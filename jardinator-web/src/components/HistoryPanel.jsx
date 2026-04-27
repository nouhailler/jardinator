import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { askOllamaStream, getOllamaUrl, getOllamaModel } from '../services/ollamaService';
import { askAIStreamChat, getApiKey, getSavedModel } from '../services/aiService';

function historyPrompt(plant) {
  const latin = plant.nameLatin ? ` (${plant.nameLatin})` : '';
  return `Tu es un historien botaniste. Rédige une fiche historique complète sur la plante "${plant.name}"${latin} en français, structurée ainsi :

## 🌍 Origine géographique
D'où vient cette plante ? Quel est son berceau d'origine ? Région, pays ou continent.

## 📜 Premières cultures connues
À quelle époque et dans quelle civilisation a-t-elle été cultivée pour la première fois ? Cite des dates ou siècles précis si connus.

## 🚢 Introduction en Europe
Quand et comment a-t-elle été introduite en Europe ? Par qui ? Si la plante est européenne de souche, précise son histoire sur le continent. Si elle ne pousse pas en Europe, indique son introduction dans les régions où elle est aujourd'hui cultivée.

## 🔬 Étymologie du nom
D'où vient le nom commun et le nom latin ?

## 📚 Anecdotes & faits historiques
Deux ou trois faits marquants, surprenants ou peu connus sur cette plante à travers l'histoire.

Réponds de façon précise, sourcée et accessible. Utilise des dates et des noms propres quand c'est possible.`;
}

async function* autoStream(prompt) {
  const ollamaModel = getOllamaModel();
  if (ollamaModel) {
    yield* askOllamaStream(prompt, getOllamaUrl(), ollamaModel);
  } else {
    yield* askAIStreamChat(prompt);
  }
}

export default function HistoryPanel({ plant, onClose }) {
  const [status, setStatus]   = useState('idle'); // idle | loading | done | error
  const [text, setText]       = useState('');
  const [errorMsg, setErrMsg] = useState('');
  const [provider, setProvider] = useState('');
  const abortRef  = useRef(false);
  const scrollRef = useRef(null);

  const hasOllama = !!getOllamaModel();
  const hasOR     = !!(getApiKey() && getSavedModel());
  const hasAI     = hasOllama || hasOR;

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  // Auto-scroll while streaming
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [text]);

  // Auto-launch on open
  useEffect(() => {
    if (hasAI) handleAsk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAsk() {
    setStatus('loading');
    setText('');
    setErrMsg('');
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
            {status === 'done' && (
              <button className="hist-btn-regen" onClick={handleAsk} title="Régénérer">
                🔄
              </button>
            )}
            {status === 'loading' && (
              <button
                className="hist-btn-stop"
                onClick={() => { abortRef.current = true; setStatus('done'); }}
                title="Arrêter"
              >
                ⏹
              </button>
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
              <p>Configurez <strong>Ollama</strong> ou <strong>OpenRouter</strong> dans <strong>⚙️ Paramètres</strong> pour utiliser cette fonctionnalité.</p>
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
            <div className="hist-content md-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
              {status === 'loading' && <span className="hist-cursor">▋</span>}
            </div>
          )}
        </div>

        {/* Footer */}
        {(status === 'done' || status === 'loading') && provider && (
          <div className="hist-footer">
            <span className="hist-provider-badge">
              {provider === 'Ollama' ? '🖥️' : '☁️'} {provider}
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
