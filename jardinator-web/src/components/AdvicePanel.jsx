import { useEffect } from 'react';
import useStore from '../store/useStore';

function renderMarkdown(text) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (/^### (.+)/.test(line)) return <h4 key={i} className="md-h4">{line.replace(/^### /, '')}</h4>;
    if (/^## (.+)/.test(line))  return <h3 key={i} className="md-h3">{line.replace(/^## /, '')}</h3>;
    if (/^# (.+)/.test(line))   return <h2 key={i} className="md-h2">{line.replace(/^# /, '')}</h2>;
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
    parts.push(first === bold ? <strong key={key++}>{first[1]}</strong> : <em key={key++}>{first[1]}</em>);
    remaining = remaining.slice(first.index + first[0].length);
  }
  return parts;
}

export default function AdvicePanel({ plant, onClose, onRegenerate }) {
  const savedAdvice = useStore(s => s.savedAdvice);
  const removeAdvice = useStore(s => s.removeAdvice);
  const text = savedAdvice[plant.id] || '';

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleDelete = () => {
    removeAdvice(plant.id);
    onClose();
  };

  return (
    <div className="gemini-overlay" onClick={onClose}>
      <div className="gemini-panel" onClick={e => e.stopPropagation()}>
        <div className="gemini-header">
          <span className="gemini-title">📋 Conseils sauvegardés</span>
          <div className="gemini-header-actions">
            <button className="gemini-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="gemini-query">
          Comment cultiver : <strong>{plant.name}</strong>
          {plant.nameLatin && <span className="gemini-latin"> ({plant.nameLatin})</span>}
        </div>

        <div className="gemini-body">
          <div className="gemini-response">
            {renderMarkdown(text)}
          </div>
        </div>

        <div className="gemini-footer">
          <button className="gemini-stop-btn" onClick={handleDelete} title="Supprimer ce conseil sauvegardé">
            🗑 Supprimer
          </button>
          <button className="gemini-retry-btn" onClick={onRegenerate}>
            ✨ Régénérer via IA
          </button>
          <span className="gemini-powered">Conseil sauvegardé</span>
        </div>
      </div>
    </div>
  );
}
