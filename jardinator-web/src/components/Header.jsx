import { useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { getFamilies, getGroupes } from '../services/vegetableService';
import ExportImport from './ExportImport';

const TABS = [
  { key: 'all', label: '🌿 Tous' },
  { key: 'now', label: '📅 Ce mois' },
  { key: 'printemps', label: '🌸 Printemps' },
  { key: 'ete', label: '☀️ Été' },
  { key: 'automne', label: '🍂 Automne' },
  { key: 'hiver', label: '❄️ Hiver' },
  { key: 'calendar', label: '📆 Calendrier' },
];

export default function Header() {
  const { activeTab, setTab, search, setSearch, groupe, setGroupe, family, setFamily,
    plants, toggleMeteo, meteoOpen } = useStore();
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
          <button
            className={`btn-meteo ${meteoOpen ? 'active' : ''}`}
            onClick={toggleMeteo}
            title="Outil météo"
          >
            🌡️ Météo
          </button>
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
        <div className="tab-count">{plants.length} plante{plants.length !== 1 ? 's' : ''}</div>
      </nav>
    </header>
  );
}
