import { useState, useRef, useEffect } from 'react';
import useStore from '../store/useStore';
import {
  lookupLatinName, lookupWikipediaImage,
  generatePlantDataStream, parseGeneratedData,
  emptyFormData, formDataToPlant, plantToFormData,
  FR_MONTHS, extractJSON,
} from '../services/newPlantService';
import { generateCustomId } from '../services/customPlantsService';
import { getOllamaModel } from '../services/ollamaService';
import { getApiKey, getSavedModel } from '../services/aiService';

// ─── Small reusable sub-components ───────────────────────────────────────────

function MonthPicker({ label, value, onChange }) {
  const toggle = (m) => {
    if (value.includes(m)) onChange(value.filter(x => x !== m));
    else onChange([...value, m]);
  };
  return (
    <div className="np-month-picker">
      <span className="np-month-label">{label}</span>
      <div className="np-month-grid">
        {FR_MONTHS.map(m => (
          <button
            key={m}
            type="button"
            className={`np-month-btn ${value.includes(m) ? 'active' : ''}`}
            onClick={() => toggle(m)}
          >
            {m.slice(0, 3)}
          </button>
        ))}
      </div>
    </div>
  );
}

function TagInput({ label, value, onChange, placeholder }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setInput('');
  };
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  return (
    <div className="np-tag-group">
      <label className="np-label">{label}</label>
      <div className="np-tag-input-row">
        <input
          className="np-input np-tag-text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
        />
        <button type="button" className="np-btn-add-tag" onClick={add}>+</button>
      </div>
      {value.length > 0 && (
        <div className="np-tags">
          {value.map((v, i) => (
            <span key={i} className="np-tag">
              {v}<button type="button" onClick={() => remove(i)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SolCheckbox({ value, onChange }) {
  const TYPES = ['argileux', 'limoneux', 'sableux', 'humifère', 'calcaire'];
  const toggle = (t) => {
    if (value.includes(t)) onChange(value.filter(x => x !== t));
    else onChange([...value, t]);
  };
  return (
    <div className="np-check-row">
      {TYPES.map(t => (
        <label key={t} className="np-check-label">
          <input type="checkbox" checked={value.includes(t)} onChange={() => toggle(t)} />
          {t}
        </label>
      ))}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="np-field">
      <label className="np-label">{label}{hint && <span className="np-hint">{hint}</span>}</label>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="np-section">
      <div className="np-section-title">{title}</div>
      {children}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

const STEPS = ['input', 'lookup', 'preview', 'generate', 'edit'];

export default function NewPlantModal() {
  const { closeNewPlant, addCustomPlant, updateCustomPlant, newPlantEdit } = useStore();

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep]           = useState(newPlantEdit ? 'edit' : 'input');
  const [plantName, setPlantName] = useState(newPlantEdit?.name || '');
  const [latinName, setLatinName] = useState(newPlantEdit?.nameLatin || '');
  const [wikiImage, setWikiImage] = useState(newPlantEdit?.defaultImageUrl || '');
  const [useWikiImage, setUseWikiImage] = useState(true);
  const [lookupMsg, setLookupMsg] = useState('');
  const [genText, setGenText]     = useState('');
  const [genDone, setGenDone]     = useState(false);
  const [genError, setGenError]   = useState('');
  const [formData, setFormData]   = useState(
    newPlantEdit ? plantToFormData(newPlantEdit) : null
  );
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  const abortRef  = useRef(false);
  const genRef    = useRef(null);

  // Check AI availability
  const hasOllama    = !!getOllamaModel();
  const hasOR        = !!(getApiKey() && getSavedModel());
  const hasAI        = hasOllama || hasOR;

  // ── Step: lookup ──────────────────────────────────────────────────────────
  async function startLookup() {
    if (!plantName.trim()) return;
    setStep('lookup');
    abortRef.current = false;

    // 1. Latin name via AI
    setLookupMsg('🔍 Recherche du nom latin avec l\'IA…');
    let lat = '';
    if (hasAI) {
      lat = await lookupLatinName(plantName.trim());
    }
    if (!lat) lat = plantName.trim(); // fallback
    setLatinName(lat);
    if (abortRef.current) return;

    // 2. Wikipedia image
    setLookupMsg('🖼️ Recherche d\'une image sur Wikipédia…');
    const img = await lookupWikipediaImage(lat, plantName.trim());
    setWikiImage(img || '');
    setUseWikiImage(!!img);

    setStep('preview');
  }

  // ── Step: generate ────────────────────────────────────────────────────────
  async function startGenerate() {
    setStep('generate');
    setGenText('');
    setGenDone(false);
    setGenError('');
    abortRef.current = false;

    let fullText = '';
    try {
      const stream = generatePlantDataStream(plantName.trim(), latinName.trim());
      for await (const chunk of stream) {
        if (abortRef.current) break;
        fullText += chunk;
        setGenText(fullText);
      }

      if (abortRef.current) { setStep('preview'); return; }

      // Parse the generated JSON
      try {
        const parsed = parseGeneratedData(fullText, plantName.trim(), latinName.trim());
        parsed.imageUrl = useWikiImage ? (wikiImage || '') : '';
        setFormData(parsed);
        setGenDone(true);
        setTimeout(() => setStep('edit'), 600);
      } catch (parseErr) {
        setGenError(`Erreur de parsing JSON : ${parseErr.message}. Vous pouvez saisir manuellement.`);
        setGenDone(true);
      }
    } catch (err) {
      const msgs = {
        NO_KEY: 'Clé API OpenRouter manquante. Configurez-la dans Paramètres.',
        NO_MODEL: 'Aucun modèle configuré. Rendez-vous dans Paramètres.',
        BAD_KEY: 'Clé API invalide. Vérifiez-la dans Paramètres.',
      };
      setGenError(msgs[err.message] || `Erreur : ${err.message}`);
      setGenDone(true);
    }
  }

  function goManual() {
    const fd = emptyFormData(plantName.trim());
    fd.nameLatin = latinName.trim();
    fd.imageUrl = useWikiImage ? (wikiImage || '') : '';
    setFormData(fd);
    setStep('edit');
  }

  // ── Form helpers ──────────────────────────────────────────────────────────
  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));
  const inp = (key) => ({
    value: formData?.[key] ?? '',
    onChange: e => set(key, e.target.value),
    className: 'np-input',
  });
  const num = (key) => ({
    type: 'number',
    inputMode: 'decimal',
    value: formData?.[key] ?? '',
    onChange: e => set(key, e.target.value === '' ? '' : Number(e.target.value)),
    className: 'np-input np-input-num',
  });
  const sel = (key) => ({
    value: formData?.[key] ?? '',
    onChange: e => set(key, e.target.value),
    className: 'np-select',
  });
  const chk = (key) => ({
    type: 'checkbox',
    checked: !!formData?.[key],
    onChange: e => set(key, e.target.checked),
  });

  // ── Save ──────────────────────────────────────────────────────────────────
  function handleSave() {
    if (!formData?.name?.trim()) return;
    setSaving(true);

    const id = newPlantEdit?.id || generateCustomId();
    const plant = formDataToPlant({ ...formData, createdAt: newPlantEdit?.createdAt }, id);

    if (newPlantEdit) updateCustomPlant(plant);
    else addCustomPlant(plant);

    setSaved(true);
    setSaving(false);
    setTimeout(() => closeNewPlant(), 900);
  }

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => { abortRef.current = true; }, []);

  // ── Render helpers ────────────────────────────────────────────────────────
  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="np-overlay" onClick={e => { if (e.target === e.currentTarget) closeNewPlant(); }}>
      <div className="np-modal">

        {/* Header */}
        <div className="np-header">
          <span className="np-header-title">
            {newPlantEdit ? '✏️ Modifier la fiche' : '🌱 Nouvelle fiche plante'}
          </span>
          <div className="np-stepper">
            {[
              { label: 'Nom',       steps: ['input', 'lookup'] },
              { label: 'Aperçu',    steps: ['preview'] },
              { label: 'Génération',steps: ['generate'] },
              { label: 'Édition',   steps: ['edit'] },
            ].map(({ label, steps }, i) => {
              const allStepNames = ['input','lookup','preview','generate','edit'];
              const myIndex  = Math.max(...steps.map(s => allStepNames.indexOf(s)));
              const curIndex = allStepNames.indexOf(step);
              const isActive = steps.includes(step);
              const isDone   = curIndex > myIndex;
              return (
                <span key={i} className={`np-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                  <span className="np-step-num">{isDone ? '✓' : i + 1}</span>
                  {label}
                </span>
              );
            })}
          </div>
          <button className="np-close" onClick={closeNewPlant} title="Fermer">✕</button>
        </div>

        {/* Body */}
        <div className="np-body">

          {/* ── Step: input ── */}
          {step === 'input' && (
            <div className="np-step-content">
              <p className="np-intro">
                Entrez le nom commun de la plante. L'IA recherchera son nom latin et une image depuis Wikipédia, puis pourra remplir automatiquement la fiche.
              </p>
              <Field label="Nom commun de la plante *">
                <input
                  className="np-input np-input-large"
                  placeholder="ex: Capucine, Mâche, Pak-choï…"
                  value={plantName}
                  onChange={e => setPlantName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && plantName.trim()) startLookup(); }}
                  autoFocus
                />
              </Field>

              {!hasAI && (
                <div className="np-warn">
                  ⚠️ Aucune IA configurée. La recherche automatique du nom latin ne sera pas disponible.<br />
                  Configurez Ollama ou OpenRouter dans <strong>⚙️ Paramètres</strong>.
                </div>
              )}

              <div className="np-input-actions">
                {hasAI && (
                  <button
                    className="np-btn np-btn-primary"
                    onClick={startLookup}
                    disabled={!plantName.trim()}
                  >
                    🔍 Rechercher avec l'IA
                  </button>
                )}
                <button
                  className="np-btn np-btn-secondary"
                  onClick={goManual}
                  disabled={!plantName.trim()}
                >
                  ✏️ Saisir manuellement
                </button>
              </div>
            </div>
          )}

          {/* ── Step: lookup ── */}
          {step === 'lookup' && (
            <div className="np-step-content np-center">
              <div className="np-spinner" />
              <p className="np-lookup-msg">{lookupMsg}</p>
              <p className="np-plant-name-display">« {plantName} »</p>
              <button className="np-btn np-btn-ghost" onClick={() => { abortRef.current = true; setStep('input'); }}>
                Annuler
              </button>
            </div>
          )}

          {/* ── Step: preview ── */}
          {step === 'preview' && (
            <div className="np-step-content">
              <div className="np-preview-grid">
                {/* Image */}
                <div className="np-preview-img-col">
                  {wikiImage ? (
                    <>
                      <img
                        src={wikiImage}
                        alt={plantName}
                        className={`np-preview-img ${useWikiImage ? '' : 'np-img-rejected'}`}
                      />
                      <div className="np-img-actions">
                        <button
                          className={`np-btn-img ${useWikiImage ? 'active' : ''}`}
                          onClick={() => setUseWikiImage(true)}
                        >✓ Utiliser cette image</button>
                        <button
                          className={`np-btn-img ${!useWikiImage ? 'active reject' : ''}`}
                          onClick={() => setUseWikiImage(false)}
                        >✕ Ignorer</button>
                      </div>
                    </>
                  ) : (
                    <div className="np-no-img">
                      <span>🌿</span>
                      <p>Aucune image trouvée sur Wikipédia</p>
                    </div>
                  )}
                  <div className="np-custom-img-row">
                    <label className="np-label">URL personnalisée</label>
                    <input
                      className="np-input"
                      placeholder="https://…"
                      value={useWikiImage ? '' : wikiImage}
                      onChange={e => { setWikiImage(e.target.value); setUseWikiImage(false); }}
                    />
                  </div>
                </div>

                {/* Names */}
                <div className="np-preview-names-col">
                  <Field label="Nom commun">
                    <input
                      className="np-input"
                      value={plantName}
                      onChange={e => setPlantName(e.target.value)}
                    />
                  </Field>
                  <Field label="Nom latin (proposé par l'IA)" hint=" — modifiable">
                    <input
                      className="np-input np-input-latin"
                      value={latinName}
                      onChange={e => setLatinName(e.target.value)}
                    />
                  </Field>

                  <div className="np-preview-actions">
                    {hasAI ? (
                      <button className="np-btn np-btn-primary" onClick={startGenerate}>
                        ✨ Remplir automatiquement avec l'IA
                      </button>
                    ) : null}
                    <button className="np-btn np-btn-secondary" onClick={goManual}>
                      ✏️ Remplir manuellement
                    </button>
                    <button className="np-btn np-btn-ghost" onClick={() => setStep('input')}>
                      ← Retour
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step: generate ── */}
          {step === 'generate' && (
            <div className="np-step-content">
              <div className="np-gen-header">
                {genDone && !genError
                  ? <><span className="np-gen-ok">✅</span> Données générées avec succès !</>
                  : genError
                  ? <><span className="np-gen-err">❌</span> Erreur</>
                  : <><div className="np-spinner-small" /> Génération en cours…</>
                }
              </div>

              {genError && (
                <>
                  <p className="np-error">{genError}</p>
                  <div className="np-gen-actions">
                    <button className="np-btn np-btn-secondary" onClick={goManual}>Saisir manuellement</button>
                    <button className="np-btn np-btn-ghost" onClick={() => { setStep('preview'); setGenText(''); setGenError(''); }}>← Retour</button>
                  </div>
                </>
              )}

              {!genDone && (
                <div className="np-gen-stream">
                  <pre className="np-gen-text">{genText || '…'}</pre>
                  <button className="np-btn np-btn-ghost np-btn-stop" onClick={() => { abortRef.current = true; }}>
                    ⏹ Arrêter
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Step: edit ── */}
          {step === 'edit' && formData && (
            <div className="np-step-content np-form">

              <Section title="🌿 Identification">
                <div className="np-row-2">
                  <Field label="Nom commun *">
                    <input {...inp('name')} className="np-input" autoFocus />
                  </Field>
                  <Field label="Nom latin">
                    <input {...inp('nameLatin')} className="np-input np-input-latin" />
                  </Field>
                </div>
                <div className="np-row-2">
                  <Field label="Groupe">
                    <select {...sel('groupe')}>
                      <option value="">— choisir —</option>
                      {['légume-feuille','légume-racine','légume-fruit','légume-bulbe','légume-tige','cucurbitacée','aromatique','légumineuse','condimentaire'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Famille botanique">
                    <input {...inp('famille')} placeholder="ex: Solanacées" />
                  </Field>
                </div>
                <Field label="Description">
                  <textarea
                    className="np-textarea"
                    value={formData.description}
                    onChange={e => set('description', e.target.value)}
                    rows={3}
                    placeholder="Conseils pratiques pour le jardinier…"
                  />
                </Field>
              </Section>

              <Section title="🖼️ Image">
                <div className="np-img-preview-row">
                  {formData.imageUrl && (
                    <img src={formData.imageUrl} alt={formData.name} className="np-form-img" />
                  )}
                  <div style={{ flex: 1 }}>
                    <Field label="URL de l'image" hint=" (Wikipédia, lien direct…)">
                      <input {...inp('imageUrl')} placeholder="https://…" type="url" inputMode="url" />
                    </Field>
                  </div>
                </div>
              </Section>

              <Section title="🌡️ Températures (°C)">
                <div className="np-row-4">
                  <Field label="Sol min"><input {...num('temp_terre_min')} /></Field>
                  <Field label="Sol max"><input {...num('temp_terre_max')} /></Field>
                  <Field label="Serre min"><input {...num('temp_serre_min')} /></Field>
                  <Field label="Serre max"><input {...num('temp_serre_max')} /></Field>
                </div>
              </Section>

              <Section title="📅 Calendrier">
                <MonthPicker
                  label="🌱 Plantation"
                  value={formData.mois_plantation}
                  onChange={v => set('mois_plantation', v)}
                />
                <MonthPicker
                  label="🍅 Récolte"
                  value={formData.mois_recolte}
                  onChange={v => set('mois_recolte', v)}
                />
                <MonthPicker
                  label="💡 Semis intérieur"
                  value={formData.semis_interieur}
                  onChange={v => set('semis_interieur', v)}
                />
                <MonthPicker
                  label="🌤 Semis extérieur"
                  value={formData.semis_exterieur}
                  onChange={v => set('semis_exterieur', v)}
                />
                <div className="np-row-2">
                  <Field label="Durée de croissance (jours)">
                    <input {...num('duree_croissance_jours')} />
                  </Field>
                  <Field label="Hauteur des plants (cm)">
                    <input {...num('hauteur_plants_cm')} />
                  </Field>
                </div>
              </Section>

              <Section title="☀️ Conditions de culture">
                <div className="np-row-2">
                  <Field label="Exposition">
                    <select {...sel('exposition')}>
                      <option value="">— choisir —</option>
                      {['Plein soleil','Mi-ombre','Ombre','Plein soleil ou mi-ombre'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Arrosage">
                    <select {...sel('arrosage')}>
                      <option value="">— choisir —</option>
                      {['Abondant','Régulier','Modéré','Faible'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="np-row-2">
                  <Field label="Facilité de germination">
                    <select {...sel('facilite_germination')}>
                      <option value="">— choisir —</option>
                      {['Facile','Moyenne','Difficile'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </Field>
                  <Field label="Facilité de culture">
                    <select {...sel('facilite_culture')}>
                      <option value="">— choisir —</option>
                      {['Facile','Moyenne','Difficile'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </Field>
                </div>
              </Section>

              <Section title="📏 Distances & Semis">
                <div className="np-row-3">
                  <Field label="Distance rang (cm)"><input {...num('distance_rang_cm')} /></Field>
                  <Field label="Distance entre rangs (cm)"><input {...num('distance_rangs_cm')} /></Field>
                  <Field label="Éclaircissage (cm)"><input {...num('eclaircissage_cm')} /></Field>
                </div>
                <div className="np-row-3">
                  <Field label="Profondeur semis (cm)"><input {...num('profondeur_semis_cm')} /></Field>
                  <Field label="Germination min (jours)"><input {...num('germination_jours_min')} /></Field>
                  <Field label="Germination max (jours)"><input {...num('germination_jours_max')} /></Field>
                </div>
                <Field label="Type de semis">
                  <div className="np-check-row">
                    {['poquet','ligne','volee','surface'].map(t => (
                      <label key={t} className="np-check-label">
                        <input {...chk(t)} />
                        {t === 'volee' ? 'à la volée' : t}
                      </label>
                    ))}
                  </div>
                </Field>
              </Section>

              <Section title="🪱 Sol & Compost">
                <Field label="Type de sol">
                  <SolCheckbox value={formData.type_sol} onChange={v => set('type_sol', v)} />
                </Field>
                <div className="np-row-2">
                  <Field label="Amendement / Compost">
                    <select {...sel('compost_type')}>
                      <option value="">— choisir —</option>
                      {['Compost mûr','Fumier','Amendement calcaire','Engrais vert','Aucun'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Bisannuelle ?">
                    <label className="np-check-label np-check-inline">
                      <input {...chk('bisannuelle')} /> Oui, c'est une bisannuelle
                    </label>
                  </Field>
                </div>
              </Section>

              <Section title="🤝 Associations">
                <TagInput
                  label="✅ Favorables"
                  value={formData.associations_favorables}
                  onChange={v => set('associations_favorables', v)}
                  placeholder="ex: Basilic (Entrée pour valider)"
                />
                <TagInput
                  label="❌ Défavorables"
                  value={formData.associations_defavorables}
                  onChange={v => set('associations_defavorables', v)}
                  placeholder="ex: Fenouil"
                />
              </Section>

              <Section title="🌱 Variétés">
                <TagInput
                  label="Sous-variétés connues"
                  value={formData.varietes}
                  onChange={v => set('varietes', v)}
                  placeholder="ex: Roma, Cherry, Cœur de bœuf…"
                />
              </Section>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="np-footer">
          {step === 'edit' && (
            <>
              <button
                className="np-btn np-btn-ghost"
                onClick={() => newPlantEdit ? closeNewPlant() : setStep('input')}
              >
                {newPlantEdit ? 'Annuler' : '← Retour'}
              </button>
              <button
                className={`np-btn np-btn-save ${saved ? 'saved' : ''}`}
                onClick={handleSave}
                disabled={saving || !formData?.name?.trim()}
              >
                {saved ? '✅ Enregistré !' : saving ? 'Enregistrement…' : '💾 Enregistrer la fiche'}
              </button>
            </>
          )}
          {(step === 'input') && (
            <button className="np-btn np-btn-ghost" onClick={closeNewPlant}>Annuler</button>
          )}
        </div>

      </div>
    </div>
  );
}
