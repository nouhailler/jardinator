import { useState, useEffect, useRef } from 'react';
import { askOllamaStream, getOllamaUrl, getOllamaModel } from '../services/ollamaService';
import { askAIStreamChat, getApiKey, getSavedModel } from '../services/aiService';
import { saveHistory, deleteHistory } from '../services/historyService';
import useStore from '../store/useStore';

// ── Markdown renderer stable (ligne par ligne, pas de parsing partiel) ────────

function inlineMarkdown(text) {
  const parts = [];
  let remaining = text;
  let key = 0;
  while (remaining) {
    const bold  = remaining.match(/\*\*(.+?)\*\*/);
    const ital  = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
    const code  = remaining.match(/`([^`]+)`/);
    const candidates = [bold, ital, code].filter(Boolean);
    if (!candidates.length) { parts.push(remaining); break; }
    const first = candidates.reduce((a, b) => (a.index <= b.index ? a : b));
    if (first.index > 0) parts.push(remaining.slice(0, first.index));
    if (first === bold)  parts.push(<strong key={key++}>{first[1]}</strong>);
    else if (first === ital) parts.push(<em key={key++}>{first[1]}</em>);
    else parts.push(<code key={key++} className="hist-code">{first[1]}</code>);
    remaining = remaining.slice(first.index + first[0].length);
  }
  return parts;
}

function renderMarkdown(text) {
  const lines = text.split('\n');
  const out = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length) {
      out.push(<ul key={`ul-${out.length}`} className="hist-ul">{listItems}</ul>);
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    if (/^#{3}\s+(.+)/.test(line)) {
      flushList();
      out.push(<h4 key={i} className="hist-h4">{inlineMarkdown(line.replace(/^#{3}\s+/, ''))}</h4>);
    } else if (/^#{2}\s+(.+)/.test(line)) {
      flushList();
      out.push(<h3 key={i} className="hist-h3">{inlineMarkdown(line.replace(/^#{2}\s+/, ''))}</h3>);
    } else if (/^#{1}\s+(.+)/.test(line)) {
      flushList();
      out.push(<h2 key={i} className="hist-h2">{inlineMarkdown(line.replace(/^#{1}\s+/, ''))}</h2>);
    } else if (/^---+$/.test(line.trim())) {
      flushList();
      out.push(<hr key={i} className="hist-hr" />);
    } else if (/^\s*[*\-]\s+(.+)/.test(line)) {
      listItems.push(
        <li key={i} className="hist-li">{inlineMarkdown(line.replace(/^\s*[*\-]\s+/, ''))}</li>
      );
    } else if (/^\s*\d+\.\s+(.+)/.test(line)) {
      // Numbered list — treat as unordered for simplicity
      listItems.push(
        <li key={i} className="hist-li hist-li-num">{inlineMarkdown(line.replace(/^\s*\d+\.\s+/, ''))}</li>
      );
    } else if (/^\|/.test(line.trim())) {
      // Skip table separator rows (---|---) but render data rows
      if (/^[\s|:\-]+$/.test(line.replace(/\|/g, ''))) return;
      flushList();
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      out.push(
        <div key={i} className="hist-table-row">
          {cells.map((c, ci) => <span key={ci} className="hist-table-cell">{inlineMarkdown(c)}</span>)}
        </div>
      );
    } else if (!line.trim()) {
      flushList();
      out.push(<div key={i} className="hist-spacer" />);
    } else {
      flushList();
      out.push(<p key={i} className="hist-p">{inlineMarkdown(line)}</p>);
    }
  });

  flushList();
  return out;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function historyPrompt(plant) {
  const latin = plant.nameLatin ? ` (${plant.nameLatin})` : '';
  return `Tu es un historien botaniste. Rédige une fiche historique sur la plante "${plant.name}"${latin} en français.

Utilise ce plan en 5 sections avec des titres markdown (##) :

## 🌍 Origine géographique
Berceau d'origine : région, pays ou continent. Sois précis.

## 📜 Premières cultures connues
Époque et civilisation des premières cultures. Cite des dates ou siècles précis si connus.

## 🚢 Introduction en Europe
Quand et comment elle est arrivée en Europe, par qui. Si la plante est européenne de souche, explique son histoire sur le continent. Si elle ne pousse pas en Europe, indique son introduction dans les régions où elle est cultivée.

## 🔬 Étymologie du nom
Origine du nom commun et du nom latin.

## 📚 Anecdotes historiques
Deux ou trois faits marquants ou peu connus sur cette plante à travers l'histoire.

Rédige en paragraphes clairs, avec des dates précises. Évite les tableaux complexes.`;
}

async function* autoStream(prompt) {
  const ollamaModel = getOllamaModel();
  if (ollamaModel) {
    yield* askOllamaStream(prompt, getOllamaUrl(), ollamaModel);
  } else {
    yield* askAIStreamChat(prompt);
  }
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function HistoryPanel({ plant, onClose, initialText = null }) {
  const { storeHistory, removeHistory } = useStore();

  const [status, setStatus]     = useState(initialText ? 'done' : 'idle');
  const [text, setText]         = useState(initialText || '');
  const [errorMsg, setErrMsg]   = useState('');
  const [provider, setProvider] = useState('');
  const [saved, setSaved]       = useState(!!initialText);

  const abortRef  = useRef(false);
  const scrollRef = useRef(null);

  const hasOllama = !!getOllamaModel();
  const hasOR     = !!(getApiKey() && getSavedModel());
  const hasAI     = hasOllama || hasOR;

  // Fermer avec Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  // Auto-scroll pendant le streaming
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [text]);

  // Lancer automatiquement si pas de texte initial
  useEffect(() => {
    if (!initialText && hasAI) handleAsk();
  }, []);

  async function handleAsk() {
    setStatus('loading');
    setText('');
    setErrMsg('');
    setSaved(false);
    abortRef.current = false;
    setProvider(getOllamaModel() ? 'Ollama' : 'OpenRouter');

    try {
      for await (const chunk of autoStream(historyPrompt(plant))) {
        if (abortRef.current) break;
        setText(prev => prev + chunk);
      }
      setStatus('done');
    } catch (err) {
      const msgs = {
        NO_KEY:   'Clé API OpenRouter manquante. Configurez-la dans ⚙️ Paramètres.',
        BAD_KEY:  'Clé API invalide. Vérifiez-la dans ⚙️ Paramètres.',
        NO_MODEL: 'Aucun modèle configuré. Rendez-vous dans ⚙️ Paramètres.',
      };
      setErrMsg(msgs[err.message] || `Erreur : ${err.message}`);
      setStatus('error');
    }
  }

  function handleSave() {
    storeHistory(plant.name, text);
    setSaved(true);
  }

  function handleDelete() {
    removeHistory(plant.name);
    setSaved(false);
    onClose();
  }

  return (
    <div className="hist-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="hist-panel">

        {/* Header */}
        <div className="hist-header">
          <div className="hist-header-title">
            <span className="hist-icon">📜</span>
            <div>
              <div className="hist-title">Histoire &amp; origine</div>
              <div className="hist-subtitle">
                <strong>{plant.name}</strong>
                {plant.nameLatin && <em> — {plant.nameLatin}</em>}
              </div>
            </div>
          </div>
          <div className="hist-header-actions">
            {status === 'loading' && (
              <button className="hist-btn-stop" onClick={() => { abortRef.current = true; setStatus('done'); }} title="Arrêter">⏹</button>
            )}
            {status === 'done' && (
              <button className="hist-btn-regen" onClick={handleAsk} title="Régénérer">🔄</button>
            )}
            <button className="hist-close" onClick={onClose} title="Fermer">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="hist-body" ref={scrollRef}>

          {!hasAI && (
            <div className="hist-no-ai">
              <div className="hist-no-ai-icon">🤖</div>
              <p>Aucune IA configurée.</p>
              <p>Configurez <strong>Ollama</strong> ou <strong>OpenRouter</strong> dans <strong>⚙️ Paramètres</strong>.</p>
            </div>
          )}

          {hasAI && status === 'loading' && !text && (
            <div className="hist-loading">
              <div className="hist-spinner" />
              <span>Recherche de l'histoire de <strong>{plant.name}</strong>…</span>
            </div>
          )}

          {hasAI && status === 'error' && (
            <div className="hist-error">
              <p>❌ {errorMsg}</p>
              <button className="hist-retry-btn" onClick={handleAsk}>Réessayer</button>
            </div>
          )}

          {text && (
            <div className="hist-content">
              {renderMarkdown(text)}
              {status === 'loading' && <span className="hist-cursor">▋</span>}
            </div>
          )}
        </div>

        {/* Footer */}
        {(status === 'done' || (status === 'loading' && text)) && (
          <div className="hist-footer">
            <span className="hist-provider-badge">
              {provider === 'Ollama' ? '🖥️' : '☁️'} {provider}
            </span>
            <div className="hist-footer-actions">
              {saved ? (
                <>
                  <span className="hist-saved-badge">✅ Sauvegardé</span>
                  <button className="hist-btn-delete" onClick={handleDelete} title="Supprimer l'historique sauvegardé">🗑</button>
                </>
              ) : (
                status === 'done' && (
                  <button className="hist-btn-save" onClick={handleSave}>
                    💾 Sauvegarder
                  </button>
                )
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
