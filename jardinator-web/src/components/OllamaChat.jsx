import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useStore from '../store/useStore';
import {
  askOllamaStream, getOllamaUrl, getOllamaModel,
  saveChatEntry, deleteChatEntry, clearChatHistory,
} from '../services/ollamaService';
import {
  askAIStreamChat, getApiKey, getSavedModel,
} from '../services/aiService';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function OllamaChat() {
  const { chatHistory, setChatHistory } = useStore();

  const [provider, setProvider]   = useState('ollama'); // 'ollama' | 'openrouter'
  const [question, setQuestion]   = useState('');
  const [streaming, setStreaming] = useState('');
  const [status, setStatus]       = useState('idle'); // idle | loading | done | error
  const [errorMsg, setErrorMsg]   = useState('');
  const [selected, setSelected]   = useState(null);
  const abortRef                  = useRef(false);
  const responseRef               = useRef(null);

  // Config état courant (relu à chaque render pour rester réactif)
  const ollamaModel = getOllamaModel();
  const orKey       = getApiKey();
  const orModel     = getSavedModel();

  const activeModel = provider === 'ollama' ? ollamaModel : orModel;

  // Warnings par fournisseur
  const warning = provider === 'ollama' && !ollamaModel
    ? '⚠️ Modèle Ollama non configuré — allez dans Paramètres'
    : provider === 'openrouter' && !orKey
      ? '⚠️ Clé API OpenRouter manquante — allez dans Paramètres'
      : provider === 'openrouter' && !orModel
        ? '⚠️ Modèle OpenRouter non sélectionné — allez dans Paramètres'
        : null;

  const canSend = !warning && question.trim() && status !== 'loading';

  async function handleAsk() {
    if (!canSend) return;
    setStatus('loading');
    setStreaming('');
    setErrorMsg('');
    setSelected(null);
    abortRef.current = false;
    let fullText = '';

    try {
      const stream = provider === 'ollama'
        ? askOllamaStream(question.trim(), getOllamaUrl(), ollamaModel)
        : askAIStreamChat(question.trim());

      for await (const chunk of stream) {
        if (abortRef.current) break;
        fullText += chunk;
        setStreaming(fullText);
      }

      if (!abortRef.current) {
        const entry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          question: question.trim(),
          answer: fullText,
          date: new Date().toISOString(),
          model: activeModel,
          provider,
        };
        const updated = saveChatEntry(entry);
        setChatHistory(updated);
        setSelected(entry);
      }
      setStatus('done');
    } catch (err) {
      const msgs = {
        NO_KEY:   'Clé API OpenRouter manquante. Configurez-la dans Paramètres.',
        NO_MODEL: 'Aucun modèle configuré. Rendez-vous dans Paramètres.',
        BAD_KEY:  'Clé API invalide. Vérifiez-la dans Paramètres.',
      };
      setErrorMsg(msgs[err.message] || `Erreur : ${err.message}`);
      setStatus('error');
    }
  }

  function handleStop() {
    abortRef.current = true;
    setStatus('done');
  }

  function handleDelete(id) {
    setChatHistory(deleteChatEntry(id));
    if (selected?.id === id) setSelected(null);
  }

  function handleClearAll() {
    if (!window.confirm('Effacer tout l\'historique ?')) return;
    setChatHistory(clearChatHistory());
    setSelected(null);
    setStreaming('');
    setStatus('idle');
  }

  useEffect(() => {
    if (responseRef.current)
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
  }, [streaming]);

  const displayEntry = selected || ((status === 'loading' || status === 'done') ? {
    question: question.trim(),
    answer: streaming,
    date: new Date().toISOString(),
    model: activeModel,
    provider,
  } : null);

  return (
    <div className="ollama-chat">
      {/* ── Historique ── */}
      <aside className="chat-history">
        <div className="chat-history-header">
          <span>Historique</span>
          {chatHistory.length > 0 && (
            <button className="btn-clear-history" onClick={handleClearAll} title="Tout effacer">🗑️</button>
          )}
        </div>
        {chatHistory.length === 0 ? (
          <p className="chat-history-empty">Aucune question posée</p>
        ) : (
          <ul className="chat-history-list">
            {chatHistory.map(entry => (
              <li
                key={entry.id}
                className={`chat-history-item ${selected?.id === entry.id ? 'active' : ''}`}
                onClick={() => { setSelected(entry); setStatus('idle'); }}
              >
                <div className="chat-history-date">{formatDate(entry.date)}</div>
                <div className="chat-history-question">{entry.question}</div>
                <div className="chat-history-meta">
                  <span className={`chat-provider-dot chat-provider-dot--${entry.provider}`} title={entry.provider} />
                  <span className="chat-history-model">{entry.model}</span>
                  <button
                    className="btn-delete-entry"
                    onClick={e => { e.stopPropagation(); handleDelete(entry.id); }}
                    title="Supprimer"
                  >×</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* ── Zone principale ── */}
      <section className="chat-main">

        {/* Sélecteur fournisseur + zone de saisie */}
        <div className="chat-input-area">

          {/* Toggle fournisseur */}
          <div className="chat-provider-toggle">
            <button
              className={`chat-provider-btn ${provider === 'ollama' ? 'active' : ''}`}
              onClick={() => setProvider('ollama')}
            >
              🖥️ Ollama
            </button>
            <button
              className={`chat-provider-btn ${provider === 'openrouter' ? 'active' : ''}`}
              onClick={() => setProvider('openrouter')}
            >
              ☁️ OpenRouter
            </button>
          </div>

          {/* Textarea */}
          <textarea
            className="chat-textarea"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAsk(); }}
            placeholder={`Posez votre question à ${provider === 'ollama' ? 'Ollama' : 'OpenRouter'}… (Ctrl+Entrée)`}
            rows={3}
            disabled={status === 'loading'}
          />

          {/* Barre d'actions — toujours visible */}
          <div className="chat-input-actions">
            <div className="chat-input-left">
              {warning
                ? <span className="chat-warning">{warning}</span>
                : <span className="chat-model-badge">{activeModel || '—'}</span>
              }
            </div>
            <div className="chat-input-right">
              {status === 'loading'
                ? <button className="btn-stop" onClick={handleStop}>⏹ Arrêter</button>
                : <button className="btn-ask" onClick={handleAsk} disabled={!canSend}>
                    Envoyer ➤
                  </button>
              }
            </div>
          </div>
        </div>

        {/* Zone de réponse */}
        <div className="chat-response" ref={responseRef}>
          {status === 'error' && (
            <div className="chat-error">{errorMsg}</div>
          )}

          {displayEntry && (
            <div className="chat-entry">
              <div className="chat-entry-header">
                <span className="chat-entry-date">{formatDate(displayEntry.date)}</span>
                <span className={`chat-entry-provider chat-entry-provider--${displayEntry.provider}`}>
                  {displayEntry.provider === 'ollama' ? '🖥️ Ollama' : '☁️ OpenRouter'}
                </span>
                <span className="chat-entry-model">{displayEntry.model}</span>
              </div>
              <div className="chat-entry-question">
                <strong>Question :</strong> {displayEntry.question}
              </div>
              <div className="chat-entry-answer md-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayEntry.answer || ''}</ReactMarkdown>
                {status === 'loading' && <span className="chat-cursor">▋</span>}
              </div>
            </div>
          )}

          {status === 'idle' && !displayEntry && (
            <div className="chat-placeholder">
              <div className="chat-placeholder-icon">🤖</div>
              <p>Posez une question en français ou en anglais.<br />Les réponses sont sauvegardées automatiquement.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
