import { useState, useRef, useEffect } from 'react';
import useStore from '../store/useStore';
import {
  askOllamaStream, getOllamaUrl, getOllamaModel,
  saveChatEntry, deleteChatEntry, clearChatHistory,
} from '../services/ollamaService';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function renderMarkdown(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (line.startsWith('### ')) return <h3 key={i} className="md-h3">{line.slice(4)}</h3>;
    if (line.startsWith('## '))  return <h2 key={i} className="md-h2">{line.slice(3)}</h2>;
    if (line.startsWith('# '))   return <h1 key={i} className="md-h1">{line.slice(2)}</h1>;
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return <li key={i} className="md-li">{line.slice(2)}</li>;
    }
    if (!line.trim()) return <br key={i} />;
    const parts = line.split(/(\*\*.*?\*\*)/g).map((p, j) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={j}>{p.slice(2, -2)}</strong>
        : p
    );
    return <p key={i} className="md-p">{parts}</p>;
  });
}

export default function OllamaChat() {
  const { chatHistory, setChatHistory } = useStore();

  const [question, setQuestion]       = useState('');
  const [streaming, setStreaming]      = useState('');
  const [status, setStatus]            = useState('idle'); // idle | loading | done | error
  const [errorMsg, setErrorMsg]        = useState('');
  const [selected, setSelected]        = useState(null); // history entry being viewed
  const abortRef                       = useRef(false);
  const responseRef                    = useRef(null);

  const ollamaUrl   = getOllamaUrl();
  const ollamaModel = getOllamaModel();

  const noConfig = !ollamaModel;

  async function handleAsk() {
    if (!question.trim() || status === 'loading') return;
    setStatus('loading');
    setStreaming('');
    setErrorMsg('');
    setSelected(null);
    abortRef.current = false;
    let fullText = '';

    try {
      for await (const chunk of askOllamaStream(question.trim(), ollamaUrl, ollamaModel)) {
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
          model: ollamaModel,
          provider: 'ollama',
        };
        const updated = saveChatEntry(entry);
        setChatHistory(updated);
        setSelected(entry);
      }
      setStatus('done');
    } catch (err) {
      if (err.message === 'NO_MODEL') {
        setErrorMsg('Aucun modèle Ollama configuré. Rendez-vous dans les Paramètres.');
      } else {
        setErrorMsg(`Erreur : ${err.message}`);
      }
      setStatus('error');
    }
  }

  function handleStop() {
    abortRef.current = true;
    setStatus('done');
  }

  function handleDelete(id) {
    const updated = deleteChatEntry(id);
    setChatHistory(updated);
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
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [streaming]);

  const displayEntry = selected || (status === 'loading' || status === 'done' ? {
    question: question.trim(),
    answer: streaming,
    date: new Date().toISOString(),
    model: ollamaModel,
  } : null);

  return (
    <div className="ollama-chat">
      {/* ── Left: History ── */}
      <aside className="chat-history">
        <div className="chat-history-header">
          <span>Historique</span>
          {chatHistory.length > 0 && (
            <button className="btn-clear-history" onClick={handleClearAll} title="Tout effacer">
              🗑️
            </button>
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

      {/* ── Right: Chat ── */}
      <section className="chat-main">
        {/* Input */}
        <div className="chat-input-area">
          <textarea
            className="chat-textarea"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAsk();
            }}
            placeholder="Posez votre question à Ollama… (Ctrl+Entrée pour envoyer)"
            rows={3}
            disabled={status === 'loading'}
          />
          <div className="chat-input-actions">
            {noConfig && (
              <span className="chat-warning">⚠️ Configurez Ollama dans les Paramètres</span>
            )}
            <span className="chat-model-badge">{ollamaModel || '—'}</span>
            {status === 'loading' ? (
              <button className="btn-stop" onClick={handleStop}>⏹ Arrêter</button>
            ) : (
              <button
                className="btn-ask"
                onClick={handleAsk}
                disabled={!question.trim() || noConfig}
              >
                Envoyer ➤
              </button>
            )}
          </div>
        </div>

        {/* Response */}
        <div className="chat-response" ref={responseRef}>
          {status === 'error' && (
            <div className="chat-error">{errorMsg}</div>
          )}

          {displayEntry && (
            <div className="chat-entry">
              <div className="chat-entry-header">
                <span className="chat-entry-date">{formatDate(displayEntry.date)}</span>
                <span className="chat-entry-model">{displayEntry.model}</span>
              </div>
              <div className="chat-entry-question">
                <strong>Question :</strong> {displayEntry.question}
              </div>
              <div className="chat-entry-answer">
                {renderMarkdown(displayEntry.answer)}
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
