import { useState, useEffect, useMemo } from 'react';
import { getAllPlants } from '../services/vegetableService';
import { generateIcs, downloadIcs } from '../services/icsService';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR - 1];

export default function IcsExportModal({ onClose }) {
  const [year, setYear]           = useState(CURRENT_YEAR);
  const [semisInt, setSemisInt]   = useState(true);
  const [semisExt, setSemisExt]   = useState(true);
  const [plantation, setPlant]    = useState(true);
  const [recolte, setRecolte]     = useState(true);
  const [alarmDays, setAlarm]     = useState(3);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(new Set());
  const [error, setError]         = useState('');

  // Toutes les plantes disponibles (nom unique)
  const allPlants = useMemo(() => {
    const plants = getAllPlants();
    const unique = [...new Map(plants.map(p => [p.name, p])).values()];
    return unique.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, []);

  // Initialiser avec toutes les plantes sélectionnées
  useEffect(() => {
    setSelected(new Set(allPlants.map(p => p.name)));
  }, [allPlants]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allPlants;
    const q = search.toLowerCase();
    return allPlants.filter(p => p.name.toLowerCase().includes(q));
  }, [allPlants, search]);

  function togglePlant(name) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function selectAll() { setSelected(new Set(filtered.map(p => p.name))); }
  function selectNone() {
    setSelected(prev => {
      const next = new Set(prev);
      filtered.forEach(p => next.delete(p.name));
      return next;
    });
  }

  function handleExport() {
    setError('');
    if (selected.size === 0) { setError('Sélectionnez au moins une plante.'); return; }
    if (!semisInt && !semisExt && !plantation && !recolte) { setError('Cochez au moins un type d\'événement.'); return; }

    const content = generateIcs({
      plantNames: [...selected],
      year,
      semisInt, semisExt, plantation, recolte,
      alarmDays,
    });

    if (!content) { setError('Aucun événement trouvé pour la sélection.'); return; }
    downloadIcs(content, year);
    onClose();
  }

  // Fermeture sur Escape
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div className="ics-overlay" onClick={onClose}>
      <div className="ics-modal" onClick={e => e.stopPropagation()}>

        {/* ── En-tête ── */}
        <div className="ics-header">
          <span className="ics-title">📅 Exporter vers Agenda (.ics)</span>
          <button className="ics-close" onClick={onClose}>✕</button>
        </div>

        <div className="ics-body">

          {/* ── Année ── */}
          <div className="ics-section">
            <label className="ics-label">Année</label>
            <div className="ics-year-btns">
              {YEARS.map(y => (
                <button
                  key={y}
                  className={`ics-year-btn ${year === y ? 'active' : ''}`}
                  onClick={() => setYear(y)}
                >{y}</button>
              ))}
            </div>
          </div>

          {/* ── Types d'événements ── */}
          <div className="ics-section">
            <label className="ics-label">Types d'événements</label>
            <div className="ics-checkboxes">
              <label className="ics-check"><input type="checkbox" checked={semisInt} onChange={e => setSemisInt(e.target.checked)} /> 🌱 Semis intérieur</label>
              <label className="ics-check"><input type="checkbox" checked={semisExt} onChange={e => setSemisExt(e.target.checked)} /> 🌿 Semis extérieur</label>
              <label className="ics-check"><input type="checkbox" checked={plantation} onChange={e => setPlant(e.target.checked)} /> 🪴 Plantation</label>
              <label className="ics-check"><input type="checkbox" checked={recolte} onChange={e => setRecolte(e.target.checked)} /> 🌾 Récolte</label>
            </div>
          </div>

          {/* ── Rappel ── */}
          <div className="ics-section ics-section-inline">
            <label className="ics-label">Rappel avant l'événement</label>
            <select
              className="ics-select"
              value={alarmDays}
              onChange={e => setAlarm(Number(e.target.value))}
            >
              <option value={0}>Aucun rappel</option>
              <option value={1}>1 jour avant</option>
              <option value={3}>3 jours avant</option>
              <option value={7}>1 semaine avant</option>
              <option value={14}>2 semaines avant</option>
            </select>
          </div>

          {/* ── Sélection des plantes ── */}
          <div className="ics-section ics-section-plants">
            <div className="ics-plants-header">
              <label className="ics-label">Plantes ({selected.size}/{allPlants.length})</label>
              <div className="ics-plants-actions">
                <button className="ics-link-btn" onClick={selectAll}>Tout cocher</button>
                <span>·</span>
                <button className="ics-link-btn" onClick={selectNone}>Tout décocher</button>
              </div>
            </div>
            <input
              className="ics-search"
              type="search"
              placeholder="Filtrer les plantes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="ics-plants-list">
              {filtered.map(p => (
                <label key={p.name} className="ics-plant-item">
                  <input
                    type="checkbox"
                    checked={selected.has(p.name)}
                    onChange={() => togglePlant(p.name)}
                  />
                  <span className="ics-plant-name">{p.name}</span>
                  {p.groupe && <span className="ics-plant-groupe">{p.groupe}</span>}
                </label>
              ))}
              {filtered.length === 0 && (
                <p className="ics-plants-empty">Aucune plante trouvée.</p>
              )}
            </div>
          </div>

          {error && <div className="ics-error">{error}</div>}
        </div>

        {/* ── Pied ── */}
        <div className="ics-footer">
          <div className="ics-footer-info">
            Compatible Google Agenda, Apple Calendar, Outlook…
          </div>
          <div className="ics-footer-actions">
            <button className="ics-btn-cancel" onClick={onClose}>Annuler</button>
            <button className="ics-btn-export" onClick={handleExport}>
              ⬇️ Télécharger .ics
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
