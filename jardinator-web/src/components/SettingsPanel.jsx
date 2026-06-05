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
import {
  getClientId, saveClientId, isTokenValid, clearAuth, connect, push, pull, getLastSync,
} from '../services/googleDriveService';
import { buildBundle, applyBundle } from '../services/bundleService';
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

  // ── Google Drive ──────────────────────────────────────────────────────────
  const [gdClientId, setGdClientId]       = useState(getClientId);
  const [gdConnected, setGdConnected]     = useState(isTokenValid);
  const [gdStatus, setGdStatus]           = useState('idle'); // idle | loading | ok | error
  const [gdMsg, setGdMsg]                 = useState('');
  const [gdProtect, setGdProtect]         = useState(true);
  const [gdLastSync, setGdLastSync]       = useState(getLastSync);
  const [gdShowHelp, setGdShowHelp]       = useState(false);

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

  // ── Google Drive actions ──────────────────────────────────────────────────

  async function handleGdConnect() {
    const id = gdClientId.trim();
    if (!id) { setGdMsg('Entrez votre Client ID Google d\'abord.'); setGdStatus('error'); return; }
    saveClientId(id);
    setGdStatus('loading');
    setGdMsg('');
    try {
      await connect(id);
      setGdConnected(true);
      setGdStatus('ok');
      setGdMsg('Connecté avec succès.');
    } catch (err) {
      setGdStatus('error');
      setGdMsg(err.message);
    }
  }

  function handleGdDisconnect() {
    clearAuth();
    setGdConnected(false);
    setGdStatus('idle');
    setGdMsg('');
  }

  async function handleGdPush() {
    setGdStatus('loading');
    setGdMsg('');
    try {
      const ts = await push(buildBundle());
      setGdLastSync(ts);
      setGdStatus('ok');
      setGdMsg('Données sauvegardées sur Google Drive.');
    } catch (err) {
      setGdStatus('error');
      setGdMsg(err.message);
    }
  }

  async function handleGdPull() {
    setGdStatus('loading');
    setGdMsg('');
    try {
      const bundle = await pull();
      if (!bundle) { setGdStatus('ok'); setGdMsg('Aucun fichier trouvé sur Google Drive.'); return; }
      const { counts, skipped, warnings } = applyBundle(bundle, { protectExisting: gdProtect });
      init();
      const summary = counts.length > 0 ? counts.join(', ') : 'aucune donnée nouvelle';
      const ts = getLastSync();
      setGdLastSync(ts);
      setGdStatus('ok');
      setGdMsg(`Importé : ${summary}${skipped.length ? ` · ${skipped.length} conservé(s)` : ''}${warnings.length ? ` · ⚠️ ${warnings.length} ignoré(s)` : ''}`);
    } catch (err) {
      setGdStatus('error');
      setGdMsg(err.message);
    }
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

      {/* ── Google Drive ── */}
      <section className="settings-section">
        <h3 className="settings-section-title">
          <span className="settings-badge settings-badge-gdrive">Google Drive</span>
          Synchronisation cloud
        </h3>

        {/* Instructions collapsibles */}
        <div className="gdrive-instructions-toggle">
          <button
            className="btn-settings-action"
            style={{ fontSize: '0.8rem', padding: '3px 10px' }}
            onClick={() => setGdShowHelp(h => !h)}
          >
            {gdShowHelp ? '▲ Masquer les instructions' : '▼ Comment obtenir un Client ID ?'}
          </button>
        </div>
        {gdShowHelp && (
          <div className="gdrive-instructions">
            <ol>
              <li>Ouvrez <strong>console.cloud.google.com</strong></li>
              <li>Créez un projet (ou sélectionnez-en un)</li>
              <li>APIs &amp; Services → <strong>Identifiants</strong> → Créer des identifiants → <strong>ID client OAuth 2.0</strong></li>
              <li>Type d'application : <strong>Application Web</strong></li>
              <li>Origines autorisées : ajoutez <code>http://localhost:5173</code> (dev) et votre URL Netlify</li>
              <li>Copiez le <strong>Client ID</strong> (format <code>…googleusercontent.com</code>)</li>
              <li>APIs &amp; Services → <strong>Bibliothèque</strong> → activez l'<strong>API Google Drive</strong></li>
            </ol>
          </div>
        )}

        <div className="settings-row">
          <label className="settings-label">Client ID</label>
          <div className="settings-input-group">
            <input
              className="settings-input"
              value={gdClientId}
              onChange={e => setGdClientId(e.target.value)}
              placeholder="….apps.googleusercontent.com"
              disabled={gdConnected}
            />
            {!gdConnected ? (
              <button
                className="btn-gdrive-connect"
                onClick={handleGdConnect}
                disabled={gdStatus === 'loading' || !gdClientId.trim()}
              >
                {gdStatus === 'loading' ? '…' : '🔐 Connecter'}
              </button>
            ) : (
              <button
                className="btn-settings-danger"
                onClick={handleGdDisconnect}
                title="Déconnecter Google Drive"
              >
                Déconnecter
              </button>
            )}
          </div>
        </div>

        {gdConnected && (
          <>
            <div className="settings-row">
              <label className="settings-label" />
              <div className="settings-input-group" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <button
                  className="btn-gdrive-push"
                  onClick={handleGdPush}
                  disabled={gdStatus === 'loading'}
                  title="Envoyer toutes les données locales vers Google Drive"
                >
                  {gdStatus === 'loading' ? '…' : '☁️ Pousser'}
                </button>
                <label
                  className="import-protect-label"
                  title={gdProtect ? 'Conserver les données locales existantes' : 'Écraser les données locales'}
                  style={{ marginLeft: 0 }}
                >
                  <input
                    type="checkbox"
                    checked={gdProtect}
                    onChange={e => setGdProtect(e.target.checked)}
                  />
                  🔒
                </label>
                <button
                  className="btn-gdrive-pull"
                  onClick={handleGdPull}
                  disabled={gdStatus === 'loading'}
                  title="Récupérer les données depuis Google Drive"
                >
                  {gdStatus === 'loading' ? '…' : '⬇️ Tirer'}
                </button>
              </div>
            </div>
            {gdLastSync && (
              <p className="gdrive-last-sync">
                Dernière sync : {new Date(gdLastSync).toLocaleString('fr-FR')}
              </p>
            )}
          </>
        )}

        {gdStatus === 'ok'    && gdMsg && <p className="settings-ok gdrive-msg">{gdMsg}</p>}
        {gdStatus === 'error' && gdMsg && <p className="settings-error gdrive-msg">{gdMsg}</p>}
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
