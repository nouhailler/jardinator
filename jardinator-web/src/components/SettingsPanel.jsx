import { useState, useEffect, useRef } from 'react';
import {
  getOllamaUrl, saveOllamaUrl, getOllamaModel, saveOllamaModel,
  fetchOllamaModels,
} from '../services/ollamaService';
import {
  getApiKey, saveApiKey, clearApiKey,
  getSavedModel, saveModel, fetchFreeModels, clearModelsCache, checkApiKey, testModel,
} from '../services/aiService';
import { subscribeLogs, clearLogs } from '../services/logService';
import useStore from '../store/useStore';
import HelpTip from './HelpTip';
import { useIsLocalMode } from '../hooks/useNetworkStatus';

export default function SettingsPanel() {
  const { setChatHistory } = useStore();
  const isLocal = useIsLocalMode();

  // ── Ollama ────────────────────────────────────────────────────────────────
  const [ollamaUrl, setOllamaUrl]         = useState(getOllamaUrl);
  const [ollamaModel, setOllamaModel]     = useState(getOllamaModel);
  const [ollamaModels, setOllamaModels]   = useState([]);
  const [ollamaStatus, setOllamaStatus]   = useState('idle'); // idle | loading | ok | error
  const [ollamaError, setOllamaError]     = useState('');

  // ── OpenRouter ────────────────────────────────────────────────────────────
  const [apiKey, setApiKey]               = useState(getApiKey);
  const [orModel, setOrModel]             = useState(getSavedModel);
  const [orModels, setOrModels]           = useState([]);
  const [orStatus, setOrStatus]           = useState('idle'); // idle | loading | ok | error
  const [orError, setOrError]             = useState('');
  const [checkStatus, setCheckStatus]     = useState('idle'); // idle | loading | ok | error
  const [checkInfo, setCheckInfo]         = useState(null);
  const [testStatus, setTestStatus]       = useState('idle'); // idle | loading | ok | error
  const [testInfo, setTestInfo]           = useState(null);

  // ── Logs ──────────────────────────────────────────────────────────────────
  const [logs, setLogs]   = useState([]);
  const logsEndRef        = useRef(null);

  useEffect(() => subscribeLogs(setLogs), []);
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ── Ollama actions ────────────────────────────────────────────────────────

  async function fetchOllama() {
    setOllamaStatus('loading');
    setOllamaError('');
    try {
      const models = await fetchOllamaModels(ollamaUrl);
      setOllamaModels(models);
      setOllamaStatus('ok');
      if (models.length > 0 && !ollamaModel) {
        setOllamaModel(models[0].id);
      }
    } catch (err) {
      setOllamaError(err.message);
      setOllamaStatus('error');
    }
  }

  function saveOllama() {
    saveOllamaUrl(ollamaUrl);
    saveOllamaModel(ollamaModel);
  }

  // ── OpenRouter actions ────────────────────────────────────────────────────

  async function fetchOR() {
    if (!apiKey.trim()) { setOrError('Clé API requise'); setOrStatus('error'); return; }
    setOrStatus('loading');
    setOrError('');
    try {
      clearModelsCache();
      const models = await fetchFreeModels(apiKey.trim());
      setOrModels(models);
      setOrStatus('ok');
      if (models.length > 0 && !orModel) {
        setOrModel(models[0].id);
      }
    } catch (err) {
      setOrError(err.message);
      setOrStatus('error');
    }
  }

  async function handleTestModel() {
    if (!apiKey.trim() || !orModel) return;
    setTestStatus('loading');
    setTestInfo(null);
    try {
      const result = await testModel(apiKey.trim(), orModel);
      setTestInfo({ reply: result.reply });
      setTestStatus('ok');
    } catch (err) {
      setTestInfo({ error: err.message });
      setTestStatus('error');
    }
  }

  async function handleCheckKey() {
    if (!apiKey.trim()) return;
    setCheckStatus('loading');
    setCheckInfo(null);
    try {
      const info = await checkApiKey(apiKey.trim());
      setCheckInfo(info);
      setCheckStatus('ok');
    } catch (err) {
      setCheckInfo({ error: err.message });
      setCheckStatus('error');
    }
  }

  function saveOR() {
    if (apiKey.trim()) saveApiKey(apiKey.trim());
    else clearApiKey();
    if (orModel) saveModel(orModel);
  }

  function handleClearApiKey() {
    clearApiKey();
    setApiKey('');
    setOrModels([]);
    setOrModel('');
    setOrStatus('idle');
  }

  // ── Load saved OR models on mount if key exists ───────────────────────────
  useEffect(() => {
    if (apiKey) {
      fetchFreeModels(apiKey).then(models => {
        setOrModels(models);
        if (!orModel && models.length > 0) setOrModel(models[0].id);
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="settings-panel">
      <h2 className="settings-title">⚙️ Paramètres</h2>

      {/* ── Ollama ── */}
      <section className="settings-section">
        <h3 className="settings-section-title">
          <span className="settings-badge settings-badge-ollama">Ollama</span>
          IA locale (modèle sur votre machine)
        </h3>
        {!isLocal && (
          <div className="settings-notice-local">
            <span>🖥️</span>
            <span>
              Ollama fonctionne uniquement avec la <strong>version installée (.deb)</strong>.
              En version web, utilisez OpenRouter ou Gemini ci-dessous.
            </span>
          </div>
        )}

        <div className="settings-row">
          <label className="settings-label" style={{display:'flex', alignItems:'center', gap:'6px'}}>
            URL du serveur
            <HelpTip text="Adresse de votre serveur Ollama local. Par défaut : http://localhost:11434" />
          </label>
          <div className="settings-input-group">
            <input
              className="settings-input"
              value={ollamaUrl}
              onChange={e => setOllamaUrl(e.target.value)}
              placeholder="http://localhost:11434"
            />
            <button
              className="btn-settings-action"
              onClick={fetchOllama}
              disabled={ollamaStatus === 'loading'}
            >
              {ollamaStatus === 'loading' ? '…' : '🔄 Tester & charger'}
            </button>
          </div>
        </div>

        {ollamaStatus === 'error' && (
          <p className="settings-error">❌ {ollamaError}</p>
        )}
        {ollamaStatus === 'ok' && ollamaModels.length === 0 && (
          <p className="settings-warn">⚠️ Aucun modèle installé sur ce serveur Ollama.</p>
        )}

        <div className="settings-row">
          <label className="settings-label">Modèle</label>
          <div className="settings-input-group">
            {ollamaModels.length > 0 ? (
              <select
                className="settings-select"
                value={ollamaModel}
                onChange={e => setOllamaModel(e.target.value)}
              >
                <option value="">— choisir un modèle —</option>
                {ollamaModels.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            ) : (
              <input
                className="settings-input"
                value={ollamaModel}
                onChange={e => setOllamaModel(e.target.value)}
                placeholder="ex: llama3.2, mistral, gemma2…"
              />
            )}
          </div>
        </div>

        {ollamaStatus === 'ok' && (
          <p className="settings-ok">✅ {ollamaModels.length} modèle(s) détecté(s)</p>
        )}

        <div className="settings-actions">
          <button className="btn-settings-save" onClick={saveOllama}>
            💾 Enregistrer Ollama
          </button>
        </div>
      </section>

      {/* ── OpenRouter ── */}
      <section className="settings-section">
        <h3 className="settings-section-title">
          <span className="settings-badge settings-badge-or">OpenRouter</span>
          IA cloud (modèles gratuits)
        </h3>

        <div className="settings-row">
          <label className="settings-label" style={{display:'flex', alignItems:'center', gap:'6px'}}>
            Clé API
            <HelpTip text="Obtenez une clé gratuite sur openrouter.ai. Elle est stockée uniquement dans votre navigateur." />
          </label>
          <div className="settings-input-group">
            <input
              className="settings-input"
              type="password"
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setCheckStatus('idle'); setCheckInfo(null); }}
              placeholder="sk-or-v1-…"
            />
            {apiKey && (
              <button className="btn-settings-danger" onClick={handleClearApiKey} title="Supprimer la clé">
                ✕
              </button>
            )}
          </div>
        </div>

        {apiKey && (
          <div className="settings-row">
            <label className="settings-label" />
            <div className="settings-input-group">
              <button
                className="btn-settings-action"
                onClick={handleCheckKey}
                disabled={checkStatus === 'loading'}
              >
                {checkStatus === 'loading' ? '…' : '🔑 Vérifier la clé'}
              </button>
              {checkStatus === 'ok' && checkInfo && (
                <span className="settings-ok">
                  ✅ Clé valide — {checkInfo.is_free_tier ? 'compte gratuit' : 'compte payant'}
                  {checkInfo.limit != null && ` · limite $${checkInfo.limit}`}
                </span>
              )}
              {checkStatus === 'error' && (
                <span className="settings-error">❌ {checkInfo?.error}</span>
              )}
            </div>
          </div>
        )}

        <div className="settings-row">
          <label className="settings-label">Modèle</label>
          <div className="settings-input-group">
            {orModels.length > 0 ? (
              <select
                className="settings-select"
                value={orModel}
                onChange={e => setOrModel(e.target.value)}
              >
                <option value="">— choisir un modèle —</option>
                {orModels.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            ) : (
              <input
                className="settings-input"
                value={orModel}
                onChange={e => setOrModel(e.target.value)}
                placeholder="Chargez les modèles d'abord"
              />
            )}
            <button
              className="btn-settings-action"
              onClick={fetchOR}
              disabled={orStatus === 'loading' || !apiKey.trim()}
            >
              {orStatus === 'loading' ? '…' : '🔄 Charger modèles gratuits'}
            </button>
          </div>
        </div>

        {orStatus === 'error' && (
          <p className="settings-error">❌ {orError}</p>
        )}
        {orStatus === 'ok' && (
          <p className="settings-ok">✅ {orModels.length} modèle(s) gratuit(s) disponible(s)</p>
        )}

        {/* Bouton test modèle */}
        {apiKey && orModel && (
          <div className="settings-row">
            <label className="settings-label" />
            <div className="settings-input-group" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
              <button
                className="btn-settings-action"
                onClick={handleTestModel}
                disabled={testStatus === 'loading'}
              >
                {testStatus === 'loading' ? '…' : '🧪 Tester le modèle'}
              </button>
              {testStatus === 'ok' && (
                <span className="settings-ok">✅ Modèle opérationnel</span>
              )}
              {testStatus === 'error' && (
                <span className="settings-error">❌ {testInfo?.error}</span>
              )}
            </div>
          </div>
        )}

        <div className="settings-actions">
          <button
            className="btn-settings-save"
            onClick={saveOR}
            disabled={!apiKey.trim()}
          >
            💾 Enregistrer OpenRouter
          </button>
        </div>
      </section>

      {/* ── Journal des appels IA ── */}
      <section className="settings-section">
        <h3 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>📋 Journal IA</span>
          {logs.length > 0 && (
            <button className="btn-settings-action" style={{ fontSize: '0.75rem', padding: '2px 8px' }} onClick={clearLogs}>
              Effacer
            </button>
          )}
        </h3>
        <div className="ai-log-panel">
          {logs.length === 0 ? (
            <p className="ai-log-empty">Aucun appel IA pour l'instant.</p>
          ) : (
            logs.map(entry => (
              <div key={entry.id} className={`ai-log-entry ai-log-${entry.level}`}>
                <span className="ai-log-ts">{entry.ts}</span>
                <span className="ai-log-msg">{entry.msg}</span>
                {entry.detail && <span className="ai-log-detail">{entry.detail}</span>}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </section>
    </div>
  );
}
