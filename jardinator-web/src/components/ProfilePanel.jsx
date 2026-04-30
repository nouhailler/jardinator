import { useState, useRef, useEffect } from 'react';
import useStore from '../store/useStore';
import { buildProfilePrompt, parseProfileJson } from '../services/profileService';
import { askConsumptionStreamOR, getApiKey, getSavedModel } from '../services/aiService';
import { askOllamaStream, getOllamaUrl, getOllamaModel } from '../services/ollamaService';

// ── Primitives ─────────────────────────────────────────────────────────────────

function Missing({ value }) {
  if (!value || value === 'Information manquante') return <span className="conso-empty">—</span>;
  return null;
}

function ProfText({ value }) {
  if (!value || value === 'Information manquante') return null;
  return <p className="conso-text">{value}</p>;
}

function ProfSection({ title, children, className = '' }) {
  return (
    <div className={`conso-section ${className}`}>
      <h4 className="conso-section-title">{title}</h4>
      {children}
    </div>
  );
}

function TagList({ items }) {
  if (!items || items.length === 0) return <span className="conso-empty">—</span>;
  return (
    <div className="conso-tags">
      {items.map((item, i) => <span key={i} className="conso-tag">{item}</span>)}
    </div>
  );
}

// ── Profil sensoriel ─────────────────────────────────────────────────────────

function SensorielCard({ s }) {
  if (!s) return null;
  return (
    <div className="profil-sensoriel-card">
      {s.gout && s.gout !== 'Information manquante' && (
        <div className="profil-sensor-row">
          <span className="profil-sensor-label">👅 Goût</span>
          <span className="profil-sensor-value">{s.gout}</span>
        </div>
      )}
      {s.texture && s.texture !== 'Information manquante' && (
        <div className="profil-sensor-row">
          <span className="profil-sensor-label">✋ Texture</span>
          <span className="profil-sensor-value">{s.texture}</span>
        </div>
      )}
      {s.arome && s.arome !== 'Information manquante' && (
        <div className="profil-sensor-row">
          <span className="profil-sensor-label">👃 Arôme</span>
          <span className="profil-sensor-value">{s.arome}</span>
        </div>
      )}
      {s.particularites && s.particularites !== 'Information manquante' && (
        <div className="profil-sensor-row">
          <span className="profil-sensor-label">✨ Notes</span>
          <span className="profil-sensor-value">{s.particularites}</span>
        </div>
      )}
    </div>
  );
}

// ── Table nutriments (oligoéléments / vitamines) ─────────────────────────────

function NutrientTable({ data }) {
  if (!data || Object.keys(data).length === 0) return <span className="conso-empty">—</span>;
  return (
    <table className="profil-nutrient-table">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Quantité</th>
          <th>Rôle</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(data).map(([name, info]) => (
          <tr key={name}>
            <td className="profil-nutrient-name">{name}</td>
            <td className="profil-nutrient-qty">{info?.quantite || '—'}</td>
            <td className="profil-nutrient-role">{info?.role || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Molécules bioactives ──────────────────────────────────────────────────────

function MoleculesTable({ data }) {
  if (!data || Object.keys(data).length === 0) return <span className="conso-empty">—</span>;
  return (
    <div className="profil-molecules">
      {Object.entries(data).map(([name, info]) => (
        <div key={name} className="profil-molecule-card">
          <div className="profil-molecule-header">
            <span className="profil-molecule-name">{name}</span>
            {info?.type && <span className="profil-molecule-type">{info.type}</span>}
          </div>
          {info?.bienfaits && info.bienfaits !== 'Information manquante' && (
            <p className="profil-molecule-bienfaits">🟢 {info.bienfaits}</p>
          )}
          {info?.particularite && info.particularite !== 'Information manquante' && (
            <p className="profil-molecule-note">ℹ️ {info.particularite}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Profil nutritionnel ───────────────────────────────────────────────────────

function NutritionnelBlock({ n }) {
  if (!n) return null;
  const { oligoelements, vitamines, acides_gras, proteines, glucides } = n;
  return (
    <div className="profil-nutritionnel">
      <div className="profil-nutri-sub">
        <h5 className="profil-nutri-subtitle">🔬 Oligoéléments & minéraux</h5>
        <NutrientTable data={oligoelements} />
      </div>
      <div className="profil-nutri-sub">
        <h5 className="profil-nutri-subtitle">💊 Vitamines</h5>
        <NutrientTable data={vitamines} />
      </div>
      <div className="profil-nutri-sub">
        <h5 className="profil-nutri-subtitle">🫙 Protéines</h5>
        {proteines ? (
          <div className="conso-inforows">
            <div className="conso-inforow">
              <span className="conso-inforow-label">Quantité</span>
              <span className="conso-inforow-value">{proteines.quantite || '—'}</span>
            </div>
            <div className="conso-inforow">
              <span className="conso-inforow-label">Profil</span>
              <span className="conso-inforow-value">{proteines.profil || '—'}</span>
            </div>
            {proteines.acides_amines_essentiels?.length > 0 && (
              <div className="conso-inforow">
                <span className="conso-inforow-label">Acides aminés</span>
                <span className="conso-inforow-value">{proteines.acides_amines_essentiels.join(', ')}</span>
              </div>
            )}
          </div>
        ) : <span className="conso-empty">—</span>}
      </div>
      <div className="profil-nutri-sub">
        <h5 className="profil-nutri-subtitle">🫒 Acides gras</h5>
        {acides_gras ? (
          <div className="conso-inforows">
            <div className="conso-inforow">
              <span className="conso-inforow-label">Type</span>
              <span className="conso-inforow-value">{acides_gras.type || '—'}</span>
            </div>
            <div className="conso-inforow">
              <span className="conso-inforow-label">Détail</span>
              <span className="conso-inforow-value">{acides_gras.detail || '—'}</span>
            </div>
          </div>
        ) : <span className="conso-empty">—</span>}
      </div>
      <div className="profil-nutri-sub">
        <h5 className="profil-nutri-subtitle">🍬 Glucides</h5>
        {glucides ? (
          <div className="conso-inforows">
            <div className="conso-inforow">
              <span className="conso-inforow-label">Total</span>
              <span className="conso-inforow-value">{glucides.quantite_totale || '—'}</span>
            </div>
            <div className="conso-inforow">
              <span className="conso-inforow-label">Fibres</span>
              <span className="conso-inforow-value">{glucides.fibres || '—'}</span>
            </div>
            <div className="conso-inforow">
              <span className="conso-inforow-label">Sucres simples</span>
              <span className="conso-inforow-value">{glucides.sucres_simples || '—'}</span>
            </div>
          </div>
        ) : <span className="conso-empty">—</span>}
      </div>
    </div>
  );
}

// ── Pharmacopée ───────────────────────────────────────────────────────────────

function PharmacopeeBlock({ p }) {
  if (!p) return null;
  const { pharmacopee_traditionnelle: trad, medecine_douce: douce, huiles_essentielles: he } = p;
  return (
    <div className="profil-pharmacopee">
      {trad && (
        <div className="profil-pharma-sub">
          <h5 className="profil-nutri-subtitle">📜 Pharmacopée traditionnelle</h5>
          {trad.traditions?.length > 0 && (
            <div className="conso-inforow" style={{ gridTemplateColumns: 'auto 1fr' }}>
              <span className="conso-inforow-label">Traditions</span>
              <span className="conso-inforow-value">{trad.traditions.join(', ')}</span>
            </div>
          )}
          {trad.usages?.length > 0 && (
            <ul className="profil-list">
              {trad.usages.map((u, i) => <li key={i}>{u}</li>)}
            </ul>
          )}
          {trad.parties_utilisees?.length > 0 && (
            <div className="conso-inforow" style={{ marginTop: 6, gridTemplateColumns: 'auto 1fr' }}>
              <span className="conso-inforow-label">Parties utilisées</span>
              <span className="conso-inforow-value">{trad.parties_utilisees.join(', ')}</span>
            </div>
          )}
        </div>
      )}
      {douce && (
        <div className="profil-pharma-sub">
          <h5 className="profil-nutri-subtitle">🌿 Médecine douce</h5>
          {douce.approches?.length > 0 && (
            <div className="conso-tags" style={{ marginBottom: 6 }}>
              {douce.approches.map((a, i) => <span key={i} className="conso-tag conso-tag--alt">{a}</span>)}
            </div>
          )}
          {douce.usages?.length > 0 && (
            <ul className="profil-list">
              {douce.usages.map((u, i) => <li key={i}>{u}</li>)}
            </ul>
          )}
        </div>
      )}
      {he && (he.produit || he.usages_aromatherapie) && (
        <div className="profil-pharma-sub">
          <h5 className="profil-nutri-subtitle">💧 Huile essentielle</h5>
          <div className="conso-inforows">
            <div className="conso-inforow">
              <span className="conso-inforow-label">Produit HE</span>
              <span className="conso-inforow-value">{he.produit || '—'}</span>
            </div>
            <div className="conso-inforow">
              <span className="conso-inforow-label">Usages</span>
              <span className="conso-inforow-value">{he.usages_aromatherapie || '—'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Actions métaboliques ──────────────────────────────────────────────────────

function MetaboliqueBlock({ m }) {
  if (!m) return null;
  return (
    <div>
      {m.action_generale?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <span className="profil-meta-label">Actions générales</span>
          <TagList items={m.action_generale} />
        </div>
      )}
      {m.action_sur_le_cerveau?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <span className="profil-meta-label">🧠 Action sur le cerveau / SNC</span>
          <ul className="profil-list">
            {m.action_sur_le_cerveau.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}
      {m.particularites_metaboliques && m.particularites_metaboliques !== 'Information manquante' && (
        <p className="conso-text" style={{ marginTop: 6 }}>
          <strong>Particularités :</strong> {m.particularites_metaboliques}
        </p>
      )}
    </div>
  );
}

// ── Vue complète ──────────────────────────────────────────────────────────────

function ProfileView({ data }) {
  const p = data?.profil_complet;
  if (!p) return <p className="conso-text conso-text--error">Données non disponibles.</p>;

  return (
    <div className="conso-view">
      <ProfSection title="🎨 Profil sensoriel">
        <SensorielCard s={p.profil_sensoriel} />
      </ProfSection>

      <ProfSection title="🧪 Profil nutritionnel">
        <NutritionnelBlock n={p.profil_nutritionnel} />
      </ProfSection>

      <ProfSection title="⚗️ Molécules bioactives">
        <MoleculesTable data={p.molecules_bioactives} />
      </ProfSection>

      <ProfSection title="🏥 Usages médicinaux & pharmacopée">
        <PharmacopeeBlock p={p.usages_pharmacopee} />
      </ProfSection>

      <ProfSection title="⚙️ Actions métaboliques">
        <MetaboliqueBlock m={p.actions_metaboliques} />
      </ProfSection>

      {p.avertissement && (
        <div className="conso-warning">ℹ️ {p.avertissement}</div>
      )}
    </div>
  );
}

// ── Panel principal ───────────────────────────────────────────────────────────

export default function ProfilePanel({ plant, onClose }) {
  const storeProfile  = useStore(s => s.storeProfile);
  const removeProfile = useStore(s => s.removeProfile);
  const savedProfile  = useStore(s => s.savedProfile);
  const savedRaw      = savedProfile[String(plant.id)] || null;

  const [status, setStatus]         = useState(savedRaw ? 'saved' : 'idle');
  const [rawText, setRawText]       = useState('');
  const [parsedData, setParsed]     = useState(savedRaw ? parseProfileJson(savedRaw) : null);
  const [parseError, setParseError] = useState(false);
  const [provider, setProvider]     = useState(() => getApiKey() ? 'openrouter' : 'ollama');
  const [saved, setSaved]           = useState(!!savedRaw);
  const abortRef  = useRef(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [rawText]);

  useEffect(() => {
    if (status === 'idle') handleGenerate();
  }, []);

  const handleGenerate = async () => {
    setStatus('loading');
    setRawText('');
    setParsed(null);
    setParseError(false);
    setSaved(false);
    abortRef.current = false;

    const prompt = buildProfilePrompt(plant);
    let fullText = '';

    try {
      const stream = provider === 'openrouter'
        ? askConsumptionStreamOR(prompt)
        : askOllamaStream(prompt, getOllamaUrl(), getOllamaModel());

      for await (const chunk of stream) {
        if (abortRef.current) break;
        fullText += chunk;
        setRawText(fullText);
      }

      const parsed = parseProfileJson(fullText);
      if (parsed) {
        setParsed(parsed);
        setStatus('done');
      } else {
        setParseError(true);
        setStatus('error');
      }
    } catch (err) {
      setParseError(false);
      setRawText(err.message);
      setStatus('error');
    }
  };

  const ollamaOk     = !!getOllamaModel();
  const openrouterOk = !!getApiKey() && !!getSavedModel();
  const canGenerate  = provider === 'ollama' ? ollamaOk : openrouterOk;

  const providerWarning = provider === 'ollama' && !ollamaOk
    ? '⚠️ Ollama non configuré'
    : provider === 'openrouter' && !openrouterOk
      ? '⚠️ Clé / modèle OpenRouter manquant'
      : null;

  return (
    <div className="gemini-overlay" onClick={onClose}>
      <div className="gemini-panel conso-panel" onClick={e => e.stopPropagation()}>

        <div className="gemini-header">
          <span className="gemini-title">🌿 Profil complet</span>
          <button className="gemini-close" onClick={onClose}>✕</button>
        </div>

        <div className="gemini-query">
          <strong>{plant.name}</strong>
          {plant.nameLatin && <span className="gemini-latin"> ({plant.nameLatin})</span>}
          {plant.family && <span className="conso-family"> — {plant.family}</span>}
        </div>

        <div className="gemini-body" ref={scrollRef}>
          {status === 'loading' && !rawText && (
            <div className="gemini-spinner">
              <span className="spin-dot" /><span className="spin-dot" /><span className="spin-dot" />
              <span style={{ marginLeft: '0.5rem', color: 'var(--text-light)' }}>Analyse du profil en cours…</span>
            </div>
          )}
          {status === 'loading' && rawText && (
            <pre className="conso-raw-stream">{rawText}<span className="cursor-blink">▌</span></pre>
          )}
          {(status === 'done' || status === 'saved') && parsedData && (
            <ProfileView data={parsedData} />
          )}
          {status === 'error' && parseError && (
            <div className="gemini-error">
              ❌ JSON incomplet ou invalide
              {rawText && (() => {
                const hasCjk = /[぀-ヿ一-鿿가-힯]/.test(rawText);
                if (hasCjk) return (
                  <p style={{ fontSize: '0.8rem', marginTop: 4, color: '#b71c1c' }}>
                    Le modèle a généré des caractères dans une autre langue — il n'est pas adapté à cette tâche.
                    Changez de modèle (ex : Qwen2.5-7B-Instruct, Mistral-7B, Gemma-2-9B).
                  </p>
                );
                if (rawText.length < 200) return (
                  <p style={{ fontSize: '0.8rem', marginTop: 4, color: '#666' }}>Réponse trop courte ({rawText.length} car.) — essayez un autre modèle.</p>
                );
                if (rawText.trimEnd().endsWith('}')) return (
                  <p style={{ fontSize: '0.8rem', marginTop: 4, color: '#666' }}>JSON malformé ({rawText.length} car.) — caractères parasites. Régénérez ou changez de modèle.</p>
                );
                if (rawText.trimEnd().endsWith(']')) return (
                  <p style={{ fontSize: '0.8rem', marginTop: 4, color: '#666' }}>JSON malformé ({rawText.length} car.) — fermeture incorrecte. Changez de modèle.</p>
                );
                return (
                  <p style={{ fontSize: '0.8rem', marginTop: 4, color: '#666' }}>JSON tronqué ({rawText.length} car.) — contexte trop court. Régénérez ou choisissez un autre modèle.</p>
                );
              })()}
              <details style={{ marginTop: '0.5rem' }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.8rem' }}>Voir la réponse brute</summary>
                <pre className="conso-raw-stream">{rawText}</pre>
              </details>
              <button className="gemini-retry" onClick={handleGenerate}>🔄 Régénérer</button>
            </div>
          )}
          {status === 'error' && !parseError && (
            <div className="gemini-error">
              ❌ {rawText}
              <button className="gemini-retry" onClick={handleGenerate}>🔄 Réessayer</button>
            </div>
          )}
        </div>

        <div className="gemini-footer">
          <select
            className="gemini-model-select"
            value={provider}
            onChange={e => setProvider(e.target.value)}
            title="Source IA"
          >
            <option value="openrouter">☁️ OpenRouter</option>
            <option value="ollama">🖥 Ollama (local)</option>
          </select>

          {providerWarning && <span className="conso-provider-warn">{providerWarning}</span>}

          {status === 'loading' && (
            <button className="gemini-stop-btn" onClick={() => { abortRef.current = true; setStatus('error'); setParseError(true); }}>
              ⏹ Stop
            </button>
          )}

          {(status === 'done' || status === 'saved') && (
            <>
              <button className="gemini-retry-btn" onClick={handleGenerate} disabled={!canGenerate}>🔄 Régénérer</button>
              {saved ? (
                <>
                  <span className="gemini-saved-badge">✅ Sauvegardé</span>
                  <button
                    className="gemini-stop-btn"
                    onClick={() => { removeProfile(plant.id); setSaved(false); setParsed(null); setStatus('idle'); handleGenerate(); }}
                    title="Supprimer la sauvegarde"
                  >🗑</button>
                </>
              ) : (
                <button
                  className="gemini-save-btn"
                  onClick={() => { storeProfile(plant.id, JSON.stringify(parsedData)); setSaved(true); }}
                >💾 Sauvegarder</button>
              )}
            </>
          )}

          <span className="gemini-powered">{provider === 'openrouter' ? 'via OpenRouter' : 'via Ollama local'}</span>
        </div>
      </div>
    </div>
  );
}
