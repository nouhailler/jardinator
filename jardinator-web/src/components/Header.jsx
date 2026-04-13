import { useRef } from 'react';
import useStore from '../store/useStore';
import { getFamilies, getGroupes, EU_REGIONS } from '../services/vegetableService';
import ExportImport from './ExportImport';
import PdfExport from './PdfExport';

const TABS = [
  { key: 'all',      label: '🌿 Tous' },
  { key: 'now',      label: '📅 Ce mois' },
  { key: 'printemps',label: '🌸 Printemps' },
  { key: 'ete',      label: '☀️ Été' },
  { key: 'automne',  label: '🍂 Automne' },
  { key: 'hiver',    label: '❄️ Hiver' },
  { key: 'calendar', label: '📆 Calendrier' },
  { key: 'potager',  label: '🪴 Potager' },
];

export default function Header() {
  const {
    activeTab, setTab, search, setSearch,
    groupe, setGroupe, family, setFamily,
    climateZone, setClimateZone,
    plants, toggleMeteo, meteoOpen,
  } = useStore();
  const groupes = getGroupes();
  const families = getFamilies();
  const debounceRef = useRef(null);

  const handleSearch = (e) => {
    const val = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 280);
  };

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
          <PdfExport />
          <ExportImport />
        </div>
      </div>

      <nav className="tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
        <div className="tab-count">
          {activeTab !== 'potager'
            ? `${plants.length} plante${plants.length !== 1 ? 's' : ''}`
            : '🪴 Plan du potager'
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
