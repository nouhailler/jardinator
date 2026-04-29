import { useRef, useState } from 'react';
import useStore from '../store/useStore';
import { getFamilies, getGroupes, EU_REGIONS } from '../services/vegetableService';
import ExportImport from './ExportImport';

const PLANT_FILTER_OPTIONS = [
  { key: 'all',       label: '🌿 Tous' },
  { key: 'now',       label: '📅 Ce mois' },
  { key: 'printemps', label: '🌸 Printemps' },
  { key: 'ete',       label: '☀️ Été' },
  { key: 'automne',   label: '🍂 Automne' },
  { key: 'hiver',     label: '❄️ Hiver' },
  { key: 'favorites', label: '⭐ Favoris' },
];

const PLANT_FILTER_KEYS = new Set(PLANT_FILTER_OPTIONS.map(o => o.key));

const NAV_TABS = [
  { key: 'calendar',       label: '📆 Calendrier' },
  { key: 'potager',        label: '🪴 Potager' },
  { key: 'chat',           label: '💬 Chat IA' },
  { key: 'diagnostic',     label: '🔬 Diagnostic' },
  { key: 'identification', label: '🌿 Identification' },
  { key: 'yields',         label: '🌾 Rendements' },
  { key: 'inputs',         label: '♻️ Intrants' },
  { key: 'settings',       label: '⚙️ Paramètres' },
];

export default function Header({ onIcsExport }) {
  const {
    activeTab, setTab, search, setSearch,
    groupe, setGroupe, family, setFamily,
    climateZone, setClimateZone,
    plants, toggleMeteo, meteoOpen,
    openNewPlant, favorites,
  } = useStore();
  const groupes = getGroupes();
  const families = getFamilies();
  const debounceRef = useRef(null);

  // Remembers the last plant filter so the select keeps its value when a nav tab is active
  const [plantFilter, setPlantFilter] = useState(
    PLANT_FILTER_KEYS.has(activeTab) ? activeTab : 'all'
  );

  const isPlantView = PLANT_FILTER_KEYS.has(activeTab);

  function handlePlantFilter(key) {
    setPlantFilter(key);
    setTab(key);
  }

  const handleSearch = (e) => {
    const val = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 280);
  };

  const favLabel = favorites.size > 0 ? `⭐ Favoris (${favorites.size})` : '⭐ Favoris';

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-brand">
          <span className="header-logo">🌱</span>
          <div>
            <div className="header-title">Jardinator</div>
            <div className="header-sub">Calendrier du jardinier</div>
          </div>
        </div>

        <div className="header-controls">
          <input
            className="search-input"
            type="search"
            placeholder="🔍 Rechercher une plante..."
            defaultValue={search}
            onChange={handleSearch}
          />
          <select className="filter-select" value={groupe} onChange={e => setGroupe(e.target.value)}>
            <option value="">Tous les groupes</option>
            {groupes.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className="filter-select" value={family} onChange={e => setFamily(e.target.value)}>
            <option value="">Toutes les familles</option>
            {families.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select
            className="filter-select filter-select-zone"
            value={climateZone}
            onChange={e => setClimateZone(e.target.value)}
            title="Filtrer par zone climatique"
          >
            <option value="">🌍 Toutes les zones</option>
            {EU_REGIONS.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <button
            className={`btn-meteo ${meteoOpen ? 'active' : ''}`}
            onClick={toggleMeteo}
            title="Météo en temps réel et recommandations"
          >
            🌡️ Météo
          </button>
          <button
            className="btn-new-plant"
            onClick={() => openNewPlant()}
            title="Créer une nouvelle fiche plante"
          >
            ➕ Nouvelle fiche
          </button>
          <button
            className="btn-ics"
            onClick={onIcsExport}
            title="Exporter les dates clés vers Google Agenda / Apple Calendar (.ics)"
          >
            📅 Agenda
          </button>
          <ExportImport />
        </div>
      </div>

      <nav className="tabs">
        {/* Plant filter — combobox */}
        <select
          className={`tab-plant-select ${isPlantView ? 'active' : ''}`}
          value={plantFilter}
          onChange={e => handlePlantFilter(e.target.value)}
          title="Vue des plantes"
        >
          {PLANT_FILTER_OPTIONS.map(o => (
            <option key={o.key} value={o.key}>
              {o.key === 'favorites' ? favLabel : o.label}
            </option>
          ))}
        </select>

        {/* Navigation tabs */}
        {NAV_TABS.map(t => (
          <button
            key={t.key}
            className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}

        <div className="tab-count">
          {activeTab === 'potager'
            ? '🪴 Plan du potager'
            : isPlantView
              ? `${plants.length} plante${plants.length !== 1 ? 's' : ''}`
              : null
          }
          {climateZone && (
            <span className="zone-badge" title={EU_REGIONS.find(r => r.id === climateZone)?.description}>
              {EU_REGIONS.find(r => r.id === climateZone)?.label}
              <button className="zone-badge-clear" onClick={() => setClimateZone('')}>×</button>
            </span>
          )}
        </div>
      </nav>
    </header>
  );
}
