import { useState, useEffect, useRef } from 'react';
import {
  askAIStream, getApiKey, saveApiKey, clearApiKey,
  fetchFreeModels, clearModelsCache, getSavedModel, saveModel,
} from '../services/aiService';
import useStore from '../store/useStore';

function renderMarkdown(text) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (/^### (.+)/.test(line)) return <h4 key={i} className="md-h4">{line.replace(/^### /, '')}</h4>;
    if (/^## (.+)/.test(line)) return <h3 key={i} className="md-h3">{line.replace(/^## /, '')}</h3>;
    if (/^# (.+)/.test(line))  return <h2 key={i} className="md-h2">{line.replace(/^# /, '')}</h2>;
    if (/^[*-] (.+)/.test(line)) return <li key={i} className="md-li">{inlineMarkdown(line.replace(/^[*-] /, ''))}</li>;
    if (!line.trim()) return <br key={i} />;
    return <p key={i} className="md-p">{inlineMarkdown(line)}</p>;
  });
}

function inlineMarkdown(text) {
  const parts = [];
  let remaining = text;
  let key = 0;
  while (remaining) {
    const bold = remaining.match(/\*\*(.+?)\*\*/);
    const ital = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
    const first = bold && ital ? (bold.index <= ital.index ? bold : ital) : bold || ital;
    if (!first) { parts.push(remaining); break; }
    if (first.index > 0) parts.push(remaining.slice(0, first.index));
    parts.push(first === bold
      ? <strong key={key++}>{first[1]}</strong>
      : <em key={key++}>{first[1]}</em>
    );
    remaining = remaining.slice(first.index + first[0].length);
  }
  return parts;
}

function KeySetup({ onSaved }) {
  const [val, setVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    if (!val.trim()) return;
    setLoading(true);
    setErr('');
    try {
      // Validate key by fetching models
      const models = await fetchFreeModels(val.trim());
      if (models.length === 0) {
        setErr('Aucun modèle gratuit trouvé. Vérifie ta clé.');
        return;
      }
      saveApiKey(val.trim());
      onSaved(models);
    } catch (e) {
      setErr(`Clé invalide ou erreur réseau : ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gemini-key-setup">
      <p className="gemini-key-info">
        Cette fonctionnalité utilise <strong>OpenRouter</strong> — accès à des modèles IA gratuits.
      </p>
      <ol className="gemini-steps">
        <li>Va sur <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">openrouter.ai ↗</a> et crée un compte</li>
        <li>Menu <strong>Keys</strong> → <strong>Create Key</strong></li>
        <li>Copie la clé (<code>sk-or-v1-…</code>) et colle-la ici</li>
      </ol>
      <div className="gemini-key-form">
        <input
          className="gemini-key-input"
          type="password"
          placeholder="sk-or-v1-…"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
          disabled={loading}
        />
        <button className="gemini-key-btn" disabled={!val.trim() || loading} onClick={handleSave}>
          {loading ? '⏳ Vérification…' : 'Enregistrer'}
        </button>
      </div>
      {err && <p className="gemini-key-err">❌ {err}</p>}
      <p className="gemini-key-note">Clé stockée uniquement dans ton navigateur. Les modèles gratuits ne consomment aucun crédit.</p>
    </div>
  );
}

export default function GeminiPanel({ plant, onClose }) {
  const [hasKey, setHasKey] = useState(!!getApiKey());
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [model, setModel] = useState(getSavedModel());
  const [status, setStatus] = useState('idle');
  const [text, setText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef(null);
  const abortRef = useRef(false);
  const storeAdvice = useStore(s => s.storeAdvice);

  // Load model list when key is present
  useEffect(() => {
    const key = getApiKey();
    if (!key) return;
    setModelsLoading(true);
    fetchFreeModels(key)
      .then(list => {
        setModels(list);
        // Ensure saved model is still in the list
        if (list.length > 0 && !list.find(m => m.id === getSavedModel())) {
          setModel(list[0].id);
          saveModel(list[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setModelsLoading(false));
  }, [hasKey]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [text]);

  // Auto-ask once models are loaded
  useEffect(() => {
    if (hasKey && models.length > 0 && status === 'idle') handleAsk();
  }, [models]);

  const handleAsk = async () => {
    setStatus('loading');
    setText('');
    setErrorMsg('');
    setSaved(false);
    abortRef.current = false;
    try {
      for await (const chunk of askAIStream(plant.name)) {
        if (abortRef.current) break;
        setText(prev => prev + chunk);
      }
      setStatus('done');
    } catch (err) {
      if (err.message === 'NO_KEY' || err.message === 'BAD_KEY') {
        clearApiKey();
        setHasKey(false);
        setStatus('idle');
      } else {
        setErrorMsg(err.message);
        setStatus('error');
      }
    }
  };

  const handleModelChange = (e) => {
    const m = e.target.value;
    setModel(m);
    saveModel(m);
  };

  const handleResetKey = () => {
    clearApiKey();
    clearModelsCache();
    setHasKey(false);
    setModels([]);
    setStatus('idle');
    setText('');
  };

  const handleRefreshModels = () => {
    clearModelsCache();
    setModelsLoading(true);
    fetchFreeModels(getApiKey())
      .then(list => { setModels(list); })
      .catch(() => {})
      .finally(() => setModelsLoading(false));
  };

  return (
    <div className="gemini-overlay" onClick={onClose}>
      <div className="gemini-panel" onClick={e => e.stopPropagation()}>
        <div className="gemini-header">
          <span className="gemini-title">✨ Conseils de culture par IA</span>
          <div className="gemini-header-actions">
            {hasKey && (
              <button className="gemini-reset-key" onClick={handleResetKey} title="Changer de clé API">🔑</button>
            )}
            <button className="gemini-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="gemini-query">
          Comment cultiver : <strong>{plant.name}</strong>
          {plant.nameLatin && <span className="gemini-latin"> ({plant.nameLatin})</span>}
        </div>

        {!hasKey ? (
          <KeySetup onSaved={(list) => { setModels(list); setHasKey(true); }} />
        ) : (
          <>
            <div className="gemini-body" ref={scrollRef}>
              {(status === 'idle' || (status === 'loading' && !text)) && modelsLoading && (
                <div className="gemini-spinner">
                  <span className="spin-dot" /><span className="spin-dot" /><span className="spin-dot" />
                  <span style={{ marginLeft: '0.5rem', color: 'var(--text-light)' }}>Chargement des modèles…</span>
                </div>
              )}
              {status === 'loading' && !text && !modelsLoading && (
                <div className="gemini-spinner">
                  <span className="spin-dot" /><span className="spin-dot" /><span className="spin-dot" />
                  <span style={{ marginLeft: '0.5rem', color: 'var(--text-light)' }}>Génération en cours…</span>
                </div>
              )}
              {text && (
                <div className="gemini-response">
                  {renderMarkdown(text)}
                  {status === 'loading' && <span className="cursor-blink">▌</span>}
                </div>
              )}
              {status === 'error' && (
                <div className="gemini-error">
                  ❌ {errorMsg}
                  <button className="gemini-retry" onClick={handleAsk}>Réessayer</button>
                </div>
              )}
            </div>

            <div className="gemini-footer">
              {models.length > 0 ? (
                <select className="gemini-model-select" value={model} onChange={handleModelChange} title="Modèle IA">
                  {models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              ) : (
                <button className="gemini-retry-btn" onClick={handleRefreshModels} disabled={modelsLoading}>
                  {modelsLoading ? '⏳' : '🔄 Charger les modèles'}
                </button>
              )}
              {status === 'loading' && (
                <button className="gemini-stop-btn" onClick={() => { abortRef.current = true; setStatus('done'); }}>⏹ Stop</button>
              )}
              {status === 'done' && (
                <>
                  <button className="gemini-retry-btn" onClick={handleAsk}>🔄 Régénérer</button>
                  {saved ? (
                    <span className="gemini-saved-badge">✅ Sauvegardé</span>
                  ) : (
                    <button
                      className="gemini-save-btn"
                      onClick={() => { storeAdvice(plant.id, text); setSaved(true); }}
                    >
                      💾 Sauvegarder les conseils
                    </button>
                  )}
                </>
              )}
              <span className="gemini-powered">via OpenRouter</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
