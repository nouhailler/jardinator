import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useStore from '../store/useStore';
import {
  askOllamaDiagnosticStream,
  askOpenRouterDiagnosticStream,
  deleteDiagnosticEntry,
  clearDiagnosticHistory,
} from '../services/diagnosticService';
import {
  saveImageBlob, loadImageBlob, deleteImageBlob, deleteImageBlobs,
  fileToDataUrl, blobToDataUrl, blobToObjectUrl,
} from '../services/imageStoreService';
import { getOllamaUrl, getOllamaModel } from '../services/ollamaService';
import { getApiKey, getSavedModel } from '../services/aiService';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Miniature chargée depuis IndexedDB de façon asynchrone. */
function HistoryThumb({ imageId }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!imageId) return;
    let objectUrl;
    loadImageBlob(imageId).then(blob => {
      if (!blob) return;
      objectUrl = blobToObjectUrl(blob);
      setSrc(objectUrl);
    });
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [imageId]);
  if (!src) return null;
  return <img className="diag-history-thumb" src={src} alt="vignette" />;
}

export default function DiagnosticPanel() {
  const { diagnosticHistory, setDiagnosticHistory, storeDiagnostic, updateDiagnostic } = useStore();

  const [provider, setProvider]     = useState('ollama');
  const [previewUrl, setPreviewUrl] = useState(null); // object URL pour <img>
  const [aiDataUrl, setAiDataUrl]   = useState(null); // data URL pour l'IA
  const [imageId, setImageId]       = useState(null); // clé IndexedDB
  const [plantName, setPlantName]   = useState('');
  const [streaming, setStreaming]   = useState('');
  const [status, setStatus]         = useState('idle');
  const [errorMsg, setErrorMsg]     = useState('');
  const [selected, setSelected]     = useState(null);
  const [dragOver, setDragOver]     = useState(false);

  const fileInputRef   = useRef(null);
  const responseRef    = useRef(null);
  const abortRef       = useRef(false);
  const previewUrlRef  = useRef(null); // pour révoquer l'object URL précédente

  const ollamaModel = getOllamaModel();
  const orKey       = getApiKey();
  const orModel     = getSavedModel();
  const activeModel = provider === 'ollama' ? ollamaModel : orModel;

  const warning = provider === 'ollama' && !ollamaModel
    ? '⚠️ Modèle Ollama non configuré — allez dans Paramètres'
    : provider === 'openrouter' && !orKey
      ? '⚠️ Clé API OpenRouter manquante — allez dans Paramètres'
      : provider === 'openrouter' && !orModel
        ? '⚠️ Modèle OpenRouter non sélectionné — allez dans Paramètres'
        : null;

  const canAnalyze = !warning && aiDataUrl && status !== 'loading';
  const canSaveName = selected && plantName !== (selected.plantName || '');

  // Révoquer l'object URL quand le composant est démonté
  useEffect(() => {
    return () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); };
  }, []);

  useEffect(() => {
    if (responseRef.current)
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
  }, [streaming]);

  function revokePreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    revokePreview();

    const [savedId, dataUrl, objUrl] = await Promise.all([
      saveImageBlob(file),
      fileToDataUrl(file),
      Promise.resolve(blobToObjectUrl(file)),
    ]);

    previewUrlRef.current = objUrl;
    setImageId(savedId);
    setPreviewUrl(objUrl);
    setAiDataUrl(dataUrl);
    setStreaming('');
    setStatus('idle');
    setSelected(null);
    setErrorMsg('');
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const handleDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);

  async function handleAnalyze() {
    if (!canAnalyze) return;
    setStatus('loading');
    setStreaming('');
    setErrorMsg('');
    setSelected(null);
    abortRef.current = false;
    let fullText = '';

    try {
      const stream = provider === 'ollama'
        ? askOllamaDiagnosticStream(aiDataUrl, plantName.trim(), getOllamaUrl(), ollamaModel)
        : askOpenRouterDiagnosticStream(aiDataUrl, plantName.trim());

      for await (const chunk of stream) {
        if (abortRef.current) break;
        fullText += chunk;
        setStreaming(fullText);
      }

      if (!abortRef.current && fullText) {
        const entry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          plantName: plantName.trim(),
          imageId,          // référence IndexedDB — pas de base64 ici
          result: fullText,
          date: new Date().toISOString(),
          model: activeModel,
          provider,
        };
        storeDiagnostic(entry);
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

  async function handleDelete(id) {
    const entry = diagnosticHistory.find(e => e.id === id);
    if (entry?.imageId) await deleteImageBlob(entry.imageId);
    setDiagnosticHistory(deleteDiagnosticEntry(id));
    if (selected?.id === id) {
      setSelected(null);
      revokePreview();
      setPreviewUrl(null);
      setAiDataUrl(null);
      setImageId(null);
    }
  }

  async function handleClearAll() {
    if (!window.confirm('Effacer tout l\'historique des diagnostics ?')) return;
    const ids = diagnosticHistory.map(e => e.imageId).filter(Boolean);
    await deleteImageBlobs(ids);
    setDiagnosticHistory(clearDiagnosticHistory());
    setSelected(null);
    revokePreview();
    setPreviewUrl(null);
    setAiDataUrl(null);
    setImageId(null);
    setStreaming('');
    setStatus('idle');
  }

  async function handleSelectHistory(entry) {
    setSelected(entry);
    setStreaming('');
    setStatus('idle');
    setErrorMsg('');
    setPlantName(entry.plantName || '');
    revokePreview();
    setPreviewUrl(null);
    setAiDataUrl(null);
    setImageId(entry.imageId || null);

    if (entry.imageId) {
      const blob = await loadImageBlob(entry.imageId);
      if (blob) {
        const [objUrl, dataUrl] = await Promise.all([
          Promise.resolve(blobToObjectUrl(blob)),
          blobToDataUrl(blob),
        ]);
        previewUrlRef.current = objUrl;
        setPreviewUrl(objUrl);
        setAiDataUrl(dataUrl);
      }
    }
  }

  function handleSavePlantName() {
    if (!selected) return;
    updateDiagnostic(selected.id, { plantName: plantName.trim() });
    setSelected(prev => ({ ...prev, plantName: plantName.trim() }));
  }

  const displayResult = selected?.result || ((status === 'loading' || status === 'done') ? streaming : null);

  return (
    <div className="diagnostic-panel">

      {/* ── Sidebar historique ── */}
      <aside className="diag-history">
        <div className="diag-history-header">
          <span>Historique</span>
          {diagnosticHistory.length > 0 && (
            <button className="btn-clear-history" onClick={handleClearAll} title="Tout effacer">🗑️</button>
          )}
        </div>

        {diagnosticHistory.length === 0 ? (
          <p className="diag-history-empty">Aucun diagnostic effectué</p>
        ) : (
          <ul className="diag-history-list">
            {diagnosticHistory.map(entry => (
              <li
                key={entry.id}
                className={`diag-history-item ${selected?.id === entry.id ? 'active' : ''}`}
                onClick={() => handleSelectHistory(entry)}
              >
                <HistoryThumb imageId={entry.imageId} />
                <div className="diag-history-info">
                  <div className="diag-history-date">{formatDate(entry.date)}</div>
                  <div className="diag-history-name">{entry.plantName || 'Plante inconnue'}</div>
                  <div className="diag-history-meta">
                    <span className={`chat-provider-dot chat-provider-dot--${entry.provider}`} title={entry.provider} />
                    <span className="diag-history-model">{entry.model}</span>
                  </div>
                </div>
                <button
                  className="btn-delete-entry"
                  onClick={e => { e.stopPropagation(); handleDelete(entry.id); }}
                  title="Supprimer"
                >×</button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* ── Zone principale ── */}
      <section className="diag-main">
        <div className="diag-controls">

          <div
            className={`diag-upload-zone ${dragOver ? 'drag-over' : ''} ${previewUrl ? 'has-image' : ''}`}
            onClick={() => !previewUrl && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />

            {previewUrl ? (
              <div className="diag-image-preview-wrap">
                <img className="diag-image-preview" src={previewUrl} alt="Photo de la plante" />
                <button className="diag-image-change" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }} title="Changer la photo">
                  📷 Changer
                </button>
              </div>
            ) : (
              <div className="diag-upload-placeholder">
                <div className="diag-upload-icon">🔬</div>
                <p>Glissez une photo ici<br />ou cliquez pour en choisir une</p>
                <span className="diag-upload-hint">JPG, PNG, WEBP — photo d'une feuille ou plante malade</span>
              </div>
            )}
          </div>

          <div className="diag-options">
            <div className="diag-plant-row">
              <input
                className="diag-plant-input"
                type="text"
                placeholder="Nom de la plante (optionnel)"
                value={plantName}
                onChange={e => setPlantName(e.target.value)}
              />
              {canSaveName && (
                <button className="diag-save-name-btn" onClick={handleSavePlantName} title="Sauvegarder le nom">💾</button>
              )}
            </div>

            <div className="chat-provider-toggle">
              <button className={`chat-provider-btn ${provider === 'ollama' ? 'active' : ''}`} onClick={() => setProvider('ollama')}>🖥️ Ollama</button>
              <button className={`chat-provider-btn ${provider === 'openrouter' ? 'active' : ''}`} onClick={() => setProvider('openrouter')}>☁️ OpenRouter</button>
            </div>

            {warning
              ? <span className="chat-warning">{warning}</span>
              : <span className="chat-model-badge">{activeModel || '—'}</span>
            }

            {status === 'loading'
              ? <button className="btn-stop diag-btn-analyze" onClick={handleStop}>⏹ Arrêter</button>
              : <button className="diag-btn-analyze" onClick={handleAnalyze} disabled={!canAnalyze}>🔍 Analyser la photo</button>
            }
          </div>
        </div>

        <div className="diag-response" ref={responseRef}>
          {status === 'error' && <div className="chat-error">{errorMsg}</div>}

          {status === 'loading' && !streaming && (
            <div className="diag-analyzing">
              <span className="diag-spinner">🔬</span>
              <span>Analyse en cours…</span>
            </div>
          )}

          {displayResult ? (
            <div className="diag-result">
              {selected && (
                <div className="diag-result-meta">
                  <span className="chat-entry-date">{formatDate(selected.date)}</span>
                  <span className={`chat-entry-provider chat-entry-provider--${selected.provider}`}>
                    {selected.provider === 'ollama' ? '🖥️ Ollama' : '☁️ OpenRouter'}
                  </span>
                  <span className="chat-entry-model">{selected.model}</span>
                  {selected.plantName && <span className="diag-result-plant">🌿 {selected.plantName}</span>}
                </div>
              )}
              <div className="diag-result-body md-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayResult}</ReactMarkdown>
                {status === 'loading' && <span className="chat-cursor">▋</span>}
              </div>
            </div>
          ) : (
            status === 'idle' && !errorMsg && (
              <div className="chat-placeholder">
                <div className="chat-placeholder-icon">🌿</div>
                <p>Importez une photo d'une plante malade.<br />L'IA analysera les symptômes et proposera des remèdes biologiques.</p>
                <ul className="diag-tips">
                  <li>📸 Photo nette, bien éclairée</li>
                  <li>🍃 Centrez sur les feuilles ou zones touchées</li>
                  <li>🤖 Utilisez un modèle vision (LLaVA, GPT-4o…)</li>
                </ul>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
