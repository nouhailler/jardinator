import { useState, useMemo, useEffect } from 'react';
import {
  loadCompostData, saveCompostData,
  loadTreatments, saveTreatmentEntry, deleteTreatmentEntry,
  newTreatmentEntry,
} from '../services/inputsService';

// ─── Constants ────────────────────────────────────────────────────────────────

const KNOWN_TREATMENTS = [
  "Purin d'ortie", "Décoction de prêle", "Décoction de tanaisie",
  "Bouillie bordelaise", "Soufre mouillable", "Savon noir liquide",
  "Terre de diatomée", "Huile de neem", "Pyrèthre naturel",
  "Bicarbonate de soude", "Purin de consoude", "Décoction d'ail",
  "Purin de fougère", "Lithothamne", "Kaolin",
  "Trichoderma harzianum", "Bacillus subtilis", "Bacillus thuringiensis",
  "Savon de Marseille", "Vinaigre blanc dilué",
];

const METHODS = [
  '', 'Pulvérisation foliaire', 'Arrosage au pied', 'Épandage au sol',
  'Poudrage', 'Trempage des racines', 'Badigeonnage', 'Autre',
];

const EFFICACY_LABELS = ['', 'Inefficace', 'Faible', 'Moyen', 'Bon', 'Excellent'];

// ─── WasteColumn ──────────────────────────────────────────────────────────────

function WasteColumn({ items, type, onUpdate, onRemove, onAdd }) {
  const total = items.reduce((s, i) => s + (Number(i.quantityKg) || 0), 0);
  const title = type === 'green'
    ? '🟢 Matières vertes (azotées)'
    : '🟤 Matières brunes (carbonées)';

  return (
    <div className={`compost-col compost-col--${type}`}>
      <div className="compost-col-header">
        <span className="compost-col-title">{title}</span>
        <span className="compost-col-total">{total} kg/an</span>
      </div>
      <ul className="compost-items-list">
        {items.map(item => (
          <li key={item.id} className="compost-item">
            <input
              className="compost-item-label"
              type="text"
              value={item.label}
              placeholder="Source de déchets…"
              onChange={e => onUpdate(item.id, 'label', e.target.value)}
            />
            <div className="compost-item-qty-wrap">
              <input
                className="compost-item-qty"
                type="number"
                min="0"
                step="5"
                value={item.quantityKg || ''}
                placeholder="0"
                onChange={e => onUpdate(item.id, 'quantityKg', Number(e.target.value) || 0)}
              />
              <span className="compost-item-unit">kg</span>
            </div>
            <button
              className="compost-item-del"
              onClick={() => onRemove(item.id)}
              title="Supprimer cette source"
            >×</button>
          </li>
        ))}
      </ul>
      <button className="compost-btn-add-item" onClick={() => onAdd(type)}>
        ➕ Ajouter
      </button>
    </div>
  );
}

// ─── CompostCalculator ────────────────────────────────────────────────────────

function CompostCalculator() {
  const [data, setData] = useState(() => loadCompostData());

  function applyAndSave(next) {
    saveCompostData(next);
    setData(next);
  }

  function updateSurface(val) {
    applyAndSave({ ...data, surfaceM2: val });
  }

  function updateItem(id, field, value) {
    const wasteItems = data.wasteItems.map(i =>
      i.id === id ? { ...i, [field]: value } : i
    );
    applyAndSave({ ...data, wasteItems });
  }

  function addItem(type) {
    const id = `custom_${Date.now()}`;
    applyAndSave({
      ...data,
      wasteItems: [...data.wasteItems, { id, label: '', type, quantityKg: 0, custom: true }],
    });
  }

  function removeItem(id) {
    applyAndSave({ ...data, wasteItems: data.wasteItems.filter(i => i.id !== id) });
  }

  const greens = data.wasteItems.filter(i => i.type === 'green');
  const browns = data.wasteItems.filter(i => i.type === 'brown');
  const totalGreen  = greens.reduce((s, i) => s + (Number(i.quantityKg) || 0), 0);
  const totalBrown  = browns.reduce((s, i) => s + (Number(i.quantityKg) || 0), 0);
  const totalWaste  = totalGreen + totalBrown;
  const ratio       = totalBrown > 0 ? totalGreen / totalBrown : totalGreen > 0 ? Infinity : 0;
  const compostEst  = Math.round(totalWaste * 0.35);
  const surface     = Number(data.surfaceM2) || 0;
  const compostNeed = Math.round(surface * 3);
  const balance     = compostEst - compostNeed;

  const ratioStatus =
    totalWaste === 0       ? 'empty'    :
    totalGreen === 0       ? 'no-green' :
    totalBrown === 0       ? 'no-brown' :
    ratio < 0.5            ? 'too-brown':
    ratio > 2              ? 'too-green':
                             'ok';

  const ratioInfo = {
    empty:     { icon: '—',  label: 'Saisissez vos quantités de déchets',                        cls: 'neutral' },
    'no-green':{ icon: '⚠️', label: 'Aucune matière verte — ajoutez tontes ou déchets de cuisine', cls: 'warn'    },
    'no-brown':{ icon: '⚠️', label: 'Aucune matière brune — ajoutez feuilles mortes ou carton',   cls: 'warn'    },
    'too-brown':{ icon: '📦',label: 'Excès de matières brunes — ajoutez plus de matières vertes', cls: 'warn'    },
    'too-green':{ icon: '🌿',label: 'Excès de matières vertes — ajoutez feuilles ou broyat',      cls: 'warn'    },
    ok:        { icon: '✅', label: 'Bon équilibre vert / brun',                                   cls: 'ok'      },
  }[ratioStatus];

  // Bar width for green/brown split visual
  const greenPct = totalWaste > 0 ? Math.round((totalGreen / totalWaste) * 100) : 50;

  return (
    <div className="compost-calculator">

      <div className="compost-surface-row">
        <label className="compost-surface-label">🪴 Surface totale du potager / jardin</label>
        <input
          className="compost-surface-input"
          type="number"
          min="0"
          step="1"
          value={data.surfaceM2}
          placeholder="50"
          onChange={e => updateSurface(e.target.value)}
        />
        <span className="compost-surface-unit">m²</span>
      </div>

      <div className="compost-columns">
        <WasteColumn items={greens} type="green" onUpdate={updateItem} onRemove={removeItem} onAdd={addItem} />
        <WasteColumn items={browns} type="brown" onUpdate={updateItem} onRemove={removeItem} onAdd={addItem} />
      </div>

      <div className="compost-results">
        <h3 className="compost-results-title">🧮 Bilan estimatif</h3>

        {totalWaste > 0 && (
          <div className="compost-ratio-bar-wrap">
            <div className="compost-ratio-bar">
              <div className="compost-ratio-bar-green" style={{ width: `${greenPct}%` }} />
            </div>
            <div className="compost-ratio-bar-labels">
              <span className="compost-ratio-bar-label compost-ratio-bar-label--green">🟢 {greenPct}% vert</span>
              <span className="compost-ratio-bar-label compost-ratio-bar-label--brown">🟤 {100 - greenPct}% brun</span>
            </div>
          </div>
        )}

        <div className={`compost-ratio-banner compost-ratio-banner--${ratioInfo.cls}`}>
          <span className="compost-ratio-icon">{ratioInfo.icon}</span>
          <span className="compost-ratio-text">{ratioInfo.label}</span>
          {isFinite(ratio) && ratio > 0 && (
            <span className="compost-ratio-value">Ratio vert/brun : {ratio.toFixed(1)}</span>
          )}
        </div>

        <div className="compost-stats-grid">
          <div className="compost-stat">
            <span className="compost-stat-value compost-stat-value--green">{totalGreen}</span>
            <span className="compost-stat-label">kg matières vertes</span>
          </div>
          <div className="compost-stat">
            <span className="compost-stat-value compost-stat-value--brown">{totalBrown}</span>
            <span className="compost-stat-label">kg matières brunes</span>
          </div>
          <div className="compost-stat">
            <span className="compost-stat-value">{totalWaste}</span>
            <span className="compost-stat-label">kg de déchets / an</span>
          </div>
          <div className="compost-stat compost-stat--highlight">
            <span className="compost-stat-value compost-stat-value--primary">≈ {compostEst}</span>
            <span className="compost-stat-label">kg compost estimé (×0,35)</span>
          </div>
          {surface > 0 && (
            <div className="compost-stat">
              <span className="compost-stat-value">{compostNeed}</span>
              <span className="compost-stat-label">kg recommandés (3 kg/m²)</span>
            </div>
          )}
          {surface > 0 && (
            <div className={`compost-stat compost-stat--balance ${balance >= 0 ? 'compost-stat--surplus' : 'compost-stat--deficit'}`}>
              <span className="compost-stat-value">
                {balance >= 0 ? `+${balance}` : balance}
              </span>
              <span className="compost-stat-label">{balance >= 0 ? 'kg surplus' : 'kg déficit'}</span>
            </div>
          )}
        </div>

        {surface > 0 && balance < 0 && (
          <div className="compost-tip">
            💡 Déficit de {Math.abs(balance)} kg — collectez davantage de déchets de cuisine,
            ajoutez du marc de café / sachets de thé, ou complétez avec du compost du commerce.
          </div>
        )}
        {surface > 0 && balance >= 0 && totalWaste > 0 && (
          <div className="compost-tip compost-tip--good">
            🎉 Votre production couvre les besoins du potager ! Vous pouvez même enrichir
            vos massifs d'ornement avec le surplus.
          </div>
        )}

        <div className="compost-info">
          <strong>ℹ️ Méthode :</strong> Le compost représente ~35 % du poids initial après décomposition.
          Pour un potager productif : 3 kg/m²/an. Ratio vert/brun idéal : entre 0,5 et 2 (en poids).
        </div>
      </div>
    </div>
  );
}

// ─── StarRating ───────────────────────────────────────────────────────────────

function StarRating({ value, onChange }) {
  return (
    <span className="treat-stars">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          className={`treat-star ${n <= value ? 'treat-star--filled' : ''}`}
          onClick={() => onChange(n === value ? 0 : n)}
          title={EFFICACY_LABELS[n]}
        >
          {n <= value ? '★' : '☆'}
        </button>
      ))}
    </span>
  );
}

// ─── TreatmentModal ───────────────────────────────────────────────────────────

function TreatmentModal({ entry, onSave, onClose }) {
  const [form, setForm] = useState({ ...entry });

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
  }

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.treatment.trim()) return;
    onSave(form);
  }

  const isEdit = Boolean(entry.treatment);

  return (
    <div className="treat-modal-overlay" onClick={onClose}>
      <div className="treat-modal" onClick={e => e.stopPropagation()}>
        <div className="treat-modal-header">
          <span className="treat-modal-title">
            {isEdit ? `✏️ Modifier — ${entry.treatment}` : '➕ Nouveau traitement'}
          </span>
          <button className="treat-modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="treat-modal-form" onSubmit={handleSubmit}>
          <div className="treat-form-grid">
            <div className="treat-form-row">
              <label>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                required
              />
            </div>

            <div className="treat-form-row treat-form-row--wide">
              <label>Traitement <span className="treat-required">*</span></label>
              <input
                list="known-treatments-list"
                type="text"
                value={form.treatment}
                onChange={e => set('treatment', e.target.value)}
                placeholder="Ex : Purin d'ortie"
                required
                autoFocus
              />
              <datalist id="known-treatments-list">
                {KNOWN_TREATMENTS.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>

            <div className="treat-form-row treat-form-row--wide">
              <label>Cible (plante / problème)</label>
              <input
                type="text"
                value={form.target}
                onChange={e => set('target', e.target.value)}
                placeholder="Ex : Tomates, Pucerons noirs"
              />
            </div>

            <div className="treat-form-row">
              <label>Dilution / dose</label>
              <input
                type="text"
                value={form.dilution}
                onChange={e => set('dilution', e.target.value)}
                placeholder="Ex : 10 % (1 L / 10 L)"
              />
            </div>

            <div className="treat-form-row">
              <label>Méthode d'application</label>
              <select value={form.method} onChange={e => set('method', e.target.value)}>
                {METHODS.map(m => <option key={m} value={m}>{m || '—'}</option>)}
              </select>
            </div>

            <div className="treat-form-row treat-form-row--stars">
              <label>Efficacité perçue</label>
              <div className="treat-form-efficacy">
                <StarRating value={form.efficacy} onChange={v => set('efficacy', v)} />
                {form.efficacy > 0 && (
                  <span className="treat-efficacy-label">{EFFICACY_LABELS[form.efficacy]}</span>
                )}
                {form.efficacy === 0 && (
                  <span className="treat-efficacy-label treat-efficacy-label--none">Non évalué</span>
                )}
              </div>
            </div>

            <div className="treat-form-row treat-form-row--full">
              <label>Notes / observations</label>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                rows={3}
                placeholder="Conditions météo, résultat observé, délai d'effet…"
              />
            </div>
          </div>

          <div className="treat-modal-footer">
            <button type="button" className="treat-btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="treat-btn-save" disabled={!form.treatment.trim()}>
              💾 Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── TreatmentJournal ─────────────────────────────────────────────────────────

function TreatmentJournal() {
  const [treatments, setTreatments] = useState(() => loadTreatments());
  const [search, setSearch]         = useState('');
  const [filterEff, setFilterEff]   = useState(0);
  const [modal, setModal]           = useState(null);

  function handleSave(form) {
    setTreatments(saveTreatmentEntry(form));
    setModal(null);
  }

  function handleDelete(id) {
    if (!window.confirm('Supprimer ce traitement ?')) return;
    setTreatments(deleteTreatmentEntry(id));
  }

  function fmtDate(iso) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }

  const filtered = treatments.filter(t => {
    if (filterEff > 0 && t.efficacy !== filterEff) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.treatment.toLowerCase().includes(q) ||
      t.target.toLowerCase().includes(q) ||
      (t.notes || '').toLowerCase().includes(q)
    );
  });

  const topTreatments = useMemo(() => {
    if (treatments.length === 0) return [];
    const map = {};
    treatments.forEach(t => {
      if (!t.treatment) return;
      if (!map[t.treatment]) map[t.treatment] = { count: 0, total: 0, rated: 0 };
      map[t.treatment].count++;
      if (t.efficacy > 0) { map[t.treatment].total += t.efficacy; map[t.treatment].rated++; }
    });
    return Object.entries(map)
      .map(([name, d]) => ({ name, count: d.count, avg: d.rated ? d.total / d.rated : 0 }))
      .sort((a, b) => b.avg - a.avg || b.count - a.count)
      .slice(0, 6);
  }, [treatments]);

  return (
    <div className="treat-journal">

      <div className="treat-toolbar">
        <input
          className="treat-search"
          type="search"
          placeholder="🔍 Traitement, plante, notes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="treat-filter-eff"
          value={filterEff}
          onChange={e => setFilterEff(Number(e.target.value))}
        >
          <option value={0}>★ Toutes efficacités</option>
          {[5,4,3,2,1].map(n => (
            <option key={n} value={n}>{'★'.repeat(n)} — {EFFICACY_LABELS[n]}</option>
          ))}
        </select>
        <button className="treat-btn-new" onClick={() => setModal({ entry: newTreatmentEntry() })}>
          ➕ Nouveau traitement
        </button>
      </div>

      {topTreatments.length > 0 && (
        <div className="treat-summary">
          <span className="treat-summary-title">🏆 Vos traitements :</span>
          {topTreatments.map(s => (
            <span
              key={s.name}
              className="treat-summary-badge"
              title={`Utilisé ${s.count} fois${s.avg ? ` — efficacité moy. ${s.avg.toFixed(1)}/5` : ''}`}
            >
              {s.name}
              {s.avg > 0 && (
                <span className="treat-summary-stars">
                  {'★'.repeat(Math.round(s.avg))}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="treat-empty">
          {treatments.length === 0 ? (
            <>
              <div className="treat-empty-icon">🌿</div>
              <p>Aucun traitement enregistré.<br />
                Cliquez sur <strong>➕ Nouveau traitement</strong> pour commencer votre journal.</p>
              <div className="treat-examples">
                <p className="treat-examples-title">Traitements courants à essayer :</p>
                <div className="treat-examples-tags">
                  {["Purin d'ortie", "Décoction de prêle", "Savon noir", "Bouillie bordelaise", "Terre de diatomée"].map(t => (
                    <span key={t} className="treat-example-tag">{t}</span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p>Aucun résultat pour cette recherche.</p>
          )}
        </div>
      ) : (
        <div className="treat-table-wrap">
          <table className="treat-table">
            <thead>
              <tr>
                <th className="treat-th treat-th-date">Date</th>
                <th className="treat-th treat-th-name">Traitement</th>
                <th className="treat-th treat-th-target">Cible</th>
                <th className="treat-th treat-th-dilution">Dilution</th>
                <th className="treat-th treat-th-method">Méthode</th>
                <th className="treat-th treat-th-eff">Efficacité</th>
                <th className="treat-th treat-th-notes">Notes</th>
                <th className="treat-th treat-th-actions"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="treat-row">
                  <td className="treat-td treat-td-date">{fmtDate(t.date)}</td>
                  <td className="treat-td treat-td-name">
                    <span className="treat-name-chip">{t.treatment}</span>
                  </td>
                  <td className="treat-td treat-td-target">{t.target || <span className="treat-empty-cell">—</span>}</td>
                  <td className="treat-td treat-td-dilution">{t.dilution || <span className="treat-empty-cell">—</span>}</td>
                  <td className="treat-td treat-td-method">{t.method || <span className="treat-empty-cell">—</span>}</td>
                  <td className="treat-td treat-td-eff">
                    {t.efficacy > 0 ? (
                      <span className={`treat-eff-badge treat-eff-badge--${t.efficacy}`} title={EFFICACY_LABELS[t.efficacy]}>
                        {'★'.repeat(t.efficacy)}
                      </span>
                    ) : (
                      <span className="treat-empty-cell">—</span>
                    )}
                  </td>
                  <td className="treat-td treat-td-notes">
                    <span className="treat-notes-text">{t.notes || <span className="treat-empty-cell">—</span>}</span>
                  </td>
                  <td className="treat-td treat-td-actions">
                    <button className="treat-btn-edit" onClick={() => setModal({ entry: t })} title="Modifier">✏️</button>
                    <button className="btn-delete-entry" onClick={() => handleDelete(t.id)} title="Supprimer">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <TreatmentModal
          entry={modal.entry}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── InputsPanel (main) ───────────────────────────────────────────────────────

export default function InputsPanel() {
  const [subTab, setSubTab] = useState('compost');

  return (
    <div className="inputs-panel">
      <div className="inputs-subtabs">
        <button
          className={`inputs-subtab ${subTab === 'compost' ? 'active' : ''}`}
          onClick={() => setSubTab('compost')}
        >
          ♻️ Calculateur de compost
        </button>
        <button
          className={`inputs-subtab ${subTab === 'treatments' ? 'active' : ''}`}
          onClick={() => setSubTab('treatments')}
        >
          🌿 Suivi des traitements bio
        </button>
      </div>

      <div className="inputs-content">
        {subTab === 'compost' ? <CompostCalculator /> : <TreatmentJournal />}
      </div>
    </div>
  );
}
