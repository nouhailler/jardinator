import { useRef, useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { getFamilies, getGroupes, EU_REGIONS } from '../services/vegetableService';
import ExportImport from './ExportImport';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

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

// ─── FilterDropdown ───────────────────────────────────────────────────────────

function FilterDropdown({ search, setSearch, groupe, setGroupe, groupes, family, setFamily, families, climateZone, setClimateZone }) {
  const [open, setOpen]           = useState(false);
  const [localSearch, setLocal]   = useState(search);
  const wrapRef    = useRef(null);
  const inputRef   = useRef(null);
  const debounceRef = useRef(null);

  // Sync input if search is reset externally
  useEffect(() => { setLocal(search); }, [search]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handler(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Focus the search input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  function handleSearchChange(e) {
    const val = e.target.value;
    setLocal(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 280);
  }

  function clearAll() {
    setLocal('');
    setSearch('');
    setGroupe('');
    setFamily('');
    setClimateZone('');
  }

  const activeCount = [search, groupe, family, climateZone].filter(Boolean).length;

  return (
    <div ref={wrapRef} className="filter-dropdown">
      <button
        className={`filter-dropdown-trigger ${open ? 'open' : ''} ${activeCount > 0 ? 'has-filters' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Rechercher et filtrer les plantes"
      >
        🔍 Rechercher
        {activeCount > 0 && <span className="filter-active-count">{activeCount}</span>}
        <span className="filter-dropdown-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="filter-dropdown-panel">
          <input
            ref={inputRef}
            className="filter-panel-search"
            type="search"
            placeholder="Rechercher une plante…"
            value={localSearch}
            onChange={handleSearchChange}
          />
          <select
            className="filter-panel-select"
            value={groupe}
            onChange={e => setGroupe(e.target.value)}
          >
            <option value="">Tous les groupes</option>
            {groupes.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select
            className="filter-panel-select"
            value={family}
            onChange={e => setFamily(e.target.value)}
          >
            <option value="">Toutes les familles</option>
            {families.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select
            className="filter-panel-select"
            value={climateZone}
            onChange={e => setClimateZone(e.target.value)}
          >
            <option value="">🌍 Toutes les zones</option>
            {EU_REGIONS.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          {activeCount > 0 && (
            <button className="filter-panel-clear" onClick={clearAll}>
              ✕ Effacer les filtres ({activeCount})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export default function Header({ onIcsExport, onStartDemo, demoActive }) {
  const isOnline = useNetworkStatus();
  const {
    activeTab, setTab, search, setSearch,
    groupe, setGroupe, family, setFamily,
    climateZone, setClimateZone,
    plants, toggleMeteo, meteoOpen,
    openNewPlant, favorites,
  } = useStore();
  const groupes = getGroupes();
  const families = getFamilies();

  const [plantFilter, setPlantFilter] = useState(
    PLANT_FILTER_KEYS.has(activeTab) ? activeTab : 'all'
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isPlantView = PLANT_FILTER_KEYS.has(activeTab);

  function handlePlantFilter(key) {
    setPlantFilter(key);
    setTab(key);
  }

  // Fermer le drawer au clic extérieur
  useEffect(() => {
    if (!menuOpen) return;
    function handler(e) {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Fermer le drawer à Escape
  useEffect(() => {
    if (!menuOpen) return;
    function handler(e) { if (e.key === 'Escape') setMenuOpen(false); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [menuOpen]);

  const favLabel = favorites.size > 0 ? `⭐ Favoris (${favorites.size})` : '⭐ Favoris';
  const currentNavLabel = NAV_TABS.find(t => t.key === activeTab)?.label ?? '🌿 Plantes';

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-brand">
          <span className="header-logo">🌱</span>
          <div>
            <div className="header-title">
              Jardinator
              {!isOnline && <span className="offline-badge" title="Hors-ligne — navigation locale disponible">✈ hors-ligne</span>}
            </div>
            <div className="header-sub">Calendrier du jardinier</div>
          </div>
        </div>

        <div className="header-controls">
          <FilterDropdown
            search={search} setSearch={setSearch}
            groupe={groupe} setGroupe={setGroupe} groupes={groupes}
            family={family} setFamily={setFamily} families={families}
            climateZone={climateZone} setClimateZone={setClimateZone}
          />
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
          <button
            className={`btn-demo${demoActive ? ' active' : ''}`}
            onClick={onStartDemo}
            title="Lancer la démo cinématique"
            disabled={demoActive}
          >
            ◉ Démo
          </button>
        </div>
      </div>

      <nav className="tabs" aria-label="Navigation principale" ref={menuRef}>
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

        {NAV_TABS.map(t => (
          <button
            key={t.key}
            className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
            aria-current={activeTab === t.key ? 'page' : undefined}
          >
            {t.label}
          </button>
        ))}

        {/* Hamburger — visible uniquement sur mobile via CSS */}
        <div className="tabs-mobile">
          <span className="tabs-mobile-label">{currentNavLabel}</span>
          <button
            className="btn-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu de navigation'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Drawer de navigation mobile */}
        {menuOpen && (
          <div className="tabs-drawer" role="menu">
            {NAV_TABS.map(t => (
              <button
                key={t.key}
                className={`tabs-drawer-item ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => { setTab(t.key); setMenuOpen(false); }}
                aria-current={activeTab === t.key ? 'page' : undefined}
                role="menuitem"
              >
                {t.label}
              </button>
            ))}

            {/* ─── Actions ─── */}
            <div className="tabs-drawer-divider" />
            <div className="tabs-drawer-section">Actions</div>

            <button className="tabs-drawer-item" onClick={() => { toggleMeteo(); setMenuOpen(false); }}>
              🌡️ Météo
            </button>
            <button className="tabs-drawer-item" onClick={() => { openNewPlant(); setMenuOpen(false); }}>
              ➕ Nouvelle fiche
            </button>
            <button className="tabs-drawer-item" onClick={() => { onIcsExport(); setMenuOpen(false); }}>
              📅 Agenda
            </button>
            <ExportImport />
          </div>
        )}

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
