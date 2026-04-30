import { useState, useRef, useEffect } from 'react';
import useStore from '../store/useStore';
import { buildConsumptionPrompt, parseConsumptionJson } from '../services/consumptionService';
import { askConsumptionStreamOR, getApiKey, getSavedModel } from '../services/aiService';
import { askOllamaStream, getOllamaUrl, getOllamaModel } from '../services/ollamaService';

// ── FODMAP level badge ────────────────────────────────────────────────────────

const FODMAP_LEVEL_STYLE = {
  haut:  { bg: '#FFEBEE', color: '#C62828', label: 'Élevé' },
  moyen: { bg: '#FFF8E1', color: '#F57F17', label: 'Moyen' },
  bas:   { bg: '#F1F8E9', color: '#33691E', label: 'Bas'   },
  nul:   { bg: '#E8F5E9', color: '#1B5E20', label: 'Nul'   },
};

function FodmapBadge({ level }) {
  const style = FODMAP_LEVEL_STYLE[level] || FODMAP_LEVEL_STYLE.nul;
  return <span className="conso-fodmap-badge" style={{ background: style.bg, color: style.color }}>{style.label}</span>;
}

// ── Primitives ────────────────────────────────────────────────────────────────

function TagList({ items, variant = 'default' }) {
  if (!items || items.length === 0) return <span className="conso-empty">—</span>;
  return (
    <div className="conso-tags">
      {items.map((item, i) => (
        <span key={i} className={`conso-tag conso-tag--${variant}`}>{item}</span>
      ))}
    </div>
  );
}

function ConsoText({ value }) {
  if (!value || value === '?' || value === 'Non applicable') return null;
  return <p className="conso-text">{value}</p>;
}

function ConsoInfoRow({ label, value }) {
  if (!value || value === '?' || value === 'Non applicable') return null;
  return (
    <div className="conso-inforow">
      <span className="conso-inforow-label">{label}</span>
      <span className="conso-inforow-value">{value}</span>
    </div>
  );
}

function ConsoSection({ title, children, className = '' }) {
  return (
    <div className={`conso-section ${className}`}>
      <h4 className="conso-section-title">{title}</h4>
      {children}
    </div>
  );
}

// ── Compounds list ────────────────────────────────────────────────────────────

function CompoundsList({ compounds }) {
  if (!compounds || Object.keys(compounds).length === 0) return <span className="conso-empty">—</span>;
  return (
    <div className="conso-compounds">
      {Object.entries(compounds).map(([name, desc]) => (
        <div key={name} className="conso-compound-row">
          <span className="conso-compound-name">{name}</span>
          <span className="conso-compound-desc">{desc}</span>
        </div>
      ))}
    </div>
  );
}

// ── FODMAP thresholds ─────────────────────────────────────────────────────────

function ToleranceGrid({ thresholds }) {
  if (!thresholds) return null;
  const { portion_safe, portion_moderee, portion_limite } = thresholds;
  if (!portion_safe || portion_safe === 'Non applicable')
    return <p className="conso-text" style={{ marginTop: 6 }}>Pas de seuil FODMAPs significatif pour cette plante.</p>;
  return (
    <div className="conso-threshold-grid">
      <div className="conso-threshold-cell conso-threshold--safe">
        <div className="conso-threshold-label">✅ Phase élimination</div>
        <div className="conso-threshold-value">{portion_safe}</div>
      </div>
      <div className="conso-threshold-cell conso-threshold--moderate">
        <div className="conso-threshold-label">🔶 Réintroduction</div>
        <div className="conso-threshold-value">{portion_moderee}</div>
      </div>
      <div className="conso-threshold-cell conso-threshold--limit">
        <div className="conso-threshold-label">🔴 Limite absolue</div>
        <div className="conso-threshold-value">{portion_limite}</div>
      </div>
    </div>
  );
}

// ── Preparation (object or legacy string) ────────────────────────────────────

function PreparationBlock({ prep }) {
  if (!prep) return null;
  if (typeof prep === 'string') return <p className="conso-text">{prep}</p>;
  return (
    <div className="conso-inforows">
      <ConsoInfoRow label="🥕 Épluchage"         value={prep.epluchage} />
      <ConsoInfoRow label="🥗 Cru vs cuit"        value={prep.cru_vs_cuit} />
      <ConsoInfoRow label="🌱 Germination"        value={prep.germination} />
      <ConsoInfoRow label="🔥 Impact cuisson"     value={prep.impact_cuisson} />
      <ConsoInfoRow label="⚗️ Réduction antinutriments" value={prep.reduction_antinutriments} />
      <ConsoInfoRow label="⏱ Temps minimal"       value={prep.temps_cuisson_minimal} />
    </div>
  );
}

// ── Conservation (object or legacy string) ───────────────────────────────────

function ConservationBlock({ cons }) {
  if (!cons) return null;
  if (typeof cons === 'string') return <p className="conso-text">{cons}</p>;
  return (
    <div className="conso-inforows">
      <ConsoInfoRow label="✅ État optimal"         value={cons.etat_optimal} />
      <ConsoInfoRow label="📅 Durée"                value={cons.duree} />
      <ConsoInfoRow label="🌡 Conditions"           value={cons.conditions} />
      <ConsoInfoRow label="🚿 Nettoyage"            value={cons.nettoyage} />
      <ConsoInfoRow label="👁 Signes visuels"       value={cons.etat_visuel} />
    </div>
  );
}

// ── Full structured view ──────────────────────────────────────────────────────

function ConsumptionView({ data }) {
  const c = data?.consommation;
  if (!c) return <p className="conso-text conso-text--error">Données non disponibles.</p>;

  const fodmaps    = c.fodmaps || {};
  const levelStyle = FODMAP_LEVEL_STYLE[fodmaps.niveau_global] || FODMAP_LEVEL_STYLE.nul;

  return (
    <div className="conso-view">

      {/* ── FODMAPs ── */}
      <div className="conso-fodmap-card" style={{ borderColor: levelStyle.color + '88', background: levelStyle.bg + '55' }}>
        <div className="conso-fodmap-header">
          <span className="conso-fodmap-title">🧫 FODMAPs</span>
          <FodmapBadge level={fodmaps.niveau_global} />
        </div>
        {fodmaps.types_fodmaps?.length > 0 && (
          <div className="conso-fodmap-types">
            <span className="conso-label">Types présents :</span>
            <TagList items={fodmaps.types_fodmaps} variant="fodmap" />
          </div>
        )}
        <ToleranceGrid thresholds={fodmaps.seuil_tolerance} />
        {fodmaps.recommandations_specifiques && (
          <p className="conso-text conso-text--tip">💡 {fodmaps.recommandations_specifiques}</p>
        )}
        {fodmaps.alternatives_low_fodmap?.length > 0 && (
          <div className="conso-fodmap-alts">
            <span className="conso-label">Alternatives low-FODMAP :</span>
            <TagList items={fodmaps.alternatives_low_fodmap} variant="alt" />
          </div>
        )}
      </div>

      {/* ── Parties comestibles ── */}
      <ConsoSection title="✅ Parties comestibles">
        <TagList items={c.parties_comestibles} variant="safe" />
        {c.stade_developpement && (
          <p className="conso-text" style={{ marginTop: 6 }}>
            <strong>Stade :</strong> {c.stade_developpement}
          </p>
        )}
      </ConsoSection>

      {/* ── Parties toxiques ── */}
      {c.parties_toxiques?.length > 0 && (
        <ConsoSection title="☠️ Parties toxiques ou à éviter">
          <TagList items={c.parties_toxiques} variant="danger" />
        </ConsoSection>
      )}

      {/* ── Composés à surveiller ── */}
      {c.composes_preoccupants && Object.keys(c.composes_preoccupants).length > 0 && (
        <ConsoSection title="⚗️ Composés naturels à risque">
          <CompoundsList compounds={c.composes_preoccupants} />
        </ConsoSection>
      )}

      {/* ── Allergies croisées ── */}
      {c.allergies_croisees?.length > 0 && (
        <ConsoSection title="🤧 Allergies croisées">
          <TagList items={c.allergies_croisees} variant="warning" />
        </ConsoSection>
      )}

      {/* ── Interactions médicamenteuses ── */}
      {c.interactions_medicamenteuses && (
        <ConsoSection title="💊 Interactions médicamenteuses">
          <p className="conso-text conso-text--alert">{c.interactions_medicamenteuses}</p>
        </ConsoSection>
      )}

      {/* ── Populations sensibles ── */}
      {c.populations_sensibles?.length > 0 && (
        <ConsoSection title="👶 Populations sensibles">
          <div className="conso-populations">
            {c.populations_sensibles.map((item, i) => (
              <div key={i} className="conso-population-row">
                <span className="conso-population-icon">⚠️</span>
                <span className="conso-text">{item}</span>
              </div>
            ))}
          </div>
        </ConsoSection>
      )}

      {/* ── Contre-indications ── */}
      {c.contre_indications?.length > 0 && (
        <ConsoSection title="🚫 Contre-indications">
          <TagList items={c.contre_indications} variant="danger" />
        </ConsoSection>
      )}

      {/* ── Cueillette ── */}
      {c.cueillette && (c.cueillette.lieu || c.cueillette.reglementation || c.cueillette.saisonnalite) && (
        <ConsoSection title="🌿 Origine & Environnement de cueillette">
          <div className="conso-inforows">
            <ConsoInfoRow label="📍 Lieu"              value={c.cueillette.lieu} />
            <ConsoInfoRow label="⚖️ Réglementation"   value={c.cueillette.reglementation} />
            <ConsoInfoRow label="📅 Saisonnalité"      value={c.cueillette.saisonnalite} />
          </div>
        </ConsoSection>
      )}

      {/* ── Préparation & Cuisson ── */}
      {c.preparation && (
        <ConsoSection title="🍳 Préparation & Cuisson">
          <PreparationBlock prep={c.preparation} />
        </ConsoSection>
      )}

      {/* ── Conservation & Fraîcheur ── */}
      {c.conservation && (
        <ConsoSection title="🧊 Conservation & Fraîcheur">
          <ConservationBlock cons={c.conservation} />
        </ConsoSection>
      )}

      {/* ── Quantité recommandée ── */}
      {c.quantite_recommandee && (
        <ConsoSection title="📊 Quantité recommandée">
          <ConsoText value={c.quantite_recommandee} />
        </ConsoSection>
      )}

      {/* ── Risques de pollution ── */}
      {c.risques_pollution && (
        <ConsoSection title="🏭 Risques de pollution">
          <ConsoText value={c.risques_pollution} />
        </ConsoSection>
      )}

      {/* ── Avertissement ── */}
      {c.avertissement_general && (
        <div className="conso-warning">ℹ️ {c.avertissement_general}</div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function ConsumptionPanel({ plant, onClose }) {
  const storeConsumption  = useStore(s => s.storeConsumption);
  const removeConsumption = useStore(s => s.removeConsumption);
  const savedConsumption  = useStore(s => s.savedConsumption);
  const savedRaw          = savedConsumption[String(plant.id)] || null;

  const [status, setStatus]         = useState(savedRaw ? 'saved' : 'idle');
  const [rawText, setRawText]       = useState('');
  const [parsedData, setParsed]     = useState(savedRaw ? parseConsumptionJson(savedRaw) : null);
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

    const prompt = buildConsumptionPrompt(plant);
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

      const parsed = parseConsumptionJson(fullText);
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

  const handleSave = () => {
    storeConsumption(plant.id, JSON.stringify(parsedData));
    setSaved(true);
  };

  const handleDelete = () => {
    removeConsumption(plant.id);
    setSaved(false);
    setParsed(null);
    setStatus('idle');
    handleGenerate();
  };

  const ollamaOk      = !!getOllamaModel();
  const openrouterOk  = !!getApiKey() && !!getSavedModel();
  const canGenerate   = provider === 'ollama' ? ollamaOk : openrouterOk;

  const providerWarning = provider === 'ollama' && !ollamaOk
    ? '⚠️ Ollama non configuré — Paramètres'
    : provider === 'openrouter' && !openrouterOk
      ? '⚠️ Clé / modèle OpenRouter manquant — Paramètres'
      : null;

  return (
    <div className="gemini-overlay" onClick={onClose}>
      <div className="gemini-panel conso-panel" onClick={e => e.stopPropagation()}>

        <div className="gemini-header">
          <span className="gemini-title">🍽 Consommation &amp; nutrition</span>
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
              <span style={{ marginLeft: '0.5rem', color: 'var(--text-light)' }}>Analyse nutritionnelle en cours…</span>
            </div>
          )}
          {status === 'loading' && rawText && (
            <pre className="conso-raw-stream">{rawText}<span className="cursor-blink">▌</span></pre>
          )}
          {(status === 'done' || status === 'saved') && parsedData && (
            <ConsumptionView data={parsedData} />
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
                  <p style={{ fontSize: '0.8rem', marginTop: 4, color: '#666' }}>JSON malformé ({rawText.length} car.) — le modèle a fermé avec <code>]]</code> au lieu de <code>{'}}'}</code>. Changez de modèle.</p>
                );
                return (
                  <p style={{ fontSize: '0.8rem', marginTop: 4, color: '#666' }}>JSON tronqué ({rawText.length} car.) — modèle à contexte trop court. Régénérez ou choisissez un autre modèle.</p>
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
                  <button className="gemini-stop-btn" onClick={handleDelete} title="Supprimer la sauvegarde">🗑</button>
                </>
              ) : (
                <button className="gemini-save-btn" onClick={handleSave}>💾 Sauvegarder</button>
              )}
            </>
          )}

          <span className="gemini-powered">{provider === 'openrouter' ? 'via OpenRouter' : 'via Ollama local'}</span>
        </div>
      </div>
    </div>
  );
}
