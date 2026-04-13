import { useState, useEffect, useRef } from 'react';
import { getAllPlants } from '../services/vegetableService';
import useStore from '../store/useStore';
import {
  fetchWeather, getUserLocation, searchLocation,
  getSavedLocation, saveLocation, getWeatherIcon, getWeatherLabel,
} from '../services/weatherService';

function classifyPlant(plant, minTemp, maxTemp, useSerre) {
  const pMin = useSerre ? plant.tempGreenhouseMin : plant.tempOutdoorMin;
  const pMax = useSerre ? plant.tempGreenhouseMax : plant.tempOutdoorMax;
  if (pMin === null || pMax === null) return null;
  if (maxTemp < pMin) return 'rouge';
  if (minTemp >= pMin && maxTemp <= pMax) return 'vert';
  return 'jaune';
}

const ZONE_CONFIG = {
  vert: { bg: '#E8F5E9', border: '#A5D6A7', color: '#2E7D32', icon: '🟢', label: 'Peut sortir' },
  jaune: { bg: '#FFFDE7', border: '#FFE082', color: '#F57F17', icon: '🟡', label: 'Risque thermique' },
  rouge: { bg: '#FFEBEE', border: '#EF9A9A', color: '#C62828', icon: '🔴', label: 'Garder à l\'abri' },
};

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function TempSlider({ label, value, onChange, min = -10, max = 45 }) {
  return (
    <div className="temp-slider-row">
      <span className="temp-slider-label">{label} : <strong>{value}°C</strong></span>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))} className="temp-slider" />
      <div className="temp-slider-ticks">
        {[-10, 0, 10, 20, 30, 40].map(t => <span key={t}>{t}°</span>)}
      </div>
    </div>
  );
}

// ─── Location search ────────────────────────────────────────────────────────
function LocationSearch({ onSelect }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef(null);

  const handleInput = (val) => {
    setQ(val);
    if (debounce.current) clearTimeout(debounce.current);
    if (!val.trim()) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      const locs = await searchLocation(val).catch(() => []);
      setResults(locs);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="meteo-location-search">
      <input
        className="meteo-loc-input"
        placeholder="🔍 Chercher une ville…"
        value={q}
        onChange={e => handleInput(e.target.value)}
      />
      {loading && <div className="meteo-loc-loading">…</div>}
      {results.length > 0 && (
        <div className="meteo-loc-results">
          {results.map((r, i) => (
            <button key={i} className="meteo-loc-item" onClick={() => { onSelect(r); setQ(''); setResults([]); }}>
              📍 {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Forecast bar ──────────────────────────────────────────────────────────
function ForecastBar({ forecast }) {
  return (
    <div className="meteo-forecast">
      {forecast.slice(0, 7).map((day, i) => {
        const date = new Date(day.date);
        const dayLabel = i === 0 ? "Auj." : DAY_LABELS[date.getDay()];
        return (
          <div key={day.date} className="meteo-forecast-day">
            <span className="mfd-day">{dayLabel}</span>
            <span className="mfd-icon">{getWeatherIcon(day.code)}</span>
            <span className="mfd-max">{day.tempMax}°</span>
            <span className="mfd-min">{day.tempMin}°</span>
            {day.precip > 0 && <span className="mfd-rain">💧{day.precip}mm</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main MeteoWidget ──────────────────────────────────────────────────────
export default function MeteoWidget() {
  const toggleMeteo = useStore(s => s.toggleMeteo);
  const openDetail = useStore(s => s.openDetail);
  const { weather, setWeather, setWeatherLoading, setWeatherError, weatherLoading, weatherError } = useStore();

  const [minTemp, setMinTemp] = useState(5);
  const [maxTemp, setMaxTemp] = useState(18);
  const [useSerre, setUseSerre] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);

  // On mount: try to load from saved location or browser geolocation
  useEffect(() => {
    const saved = getSavedLocation();
    if (saved) {
      loadWeather(saved.lat, saved.lon, saved.name);
    }
    // Also try geolocation if no saved location
    else {
      getUserLocation()
        .then(loc => loadWeather(loc.lat, loc.lon, ''))
        .catch(() => {}); // Silently fail — user can search manually
    }
  }, []);

  // Sync sliders to real weather when it arrives
  useEffect(() => {
    if (weather) {
      setMinTemp(Math.max(-10, weather.temp - 5));
      setMaxTemp(Math.min(45, weather.temp + 5));
    }
  }, [weather?.temp]);

  const loadWeather = async (lat, lon, name) => {
    setWeatherLoading(true);
    try {
      const data = await fetchWeather(lat, lon, name);
      setWeather(data);
    } catch (e) {
      setWeatherError(e.message);
    }
  };

  const handleLocationSelect = (loc) => {
    saveLocation(loc);
    loadWeather(loc.lat, loc.lon, loc.name);
    setShowLocationSearch(false);
  };

  const handleGeolocate = async () => {
    setWeatherLoading(true);
    try {
      const loc = await getUserLocation();
      saveLocation(loc);
      await loadWeather(loc.lat, loc.lon, loc.name);
    } catch (e) {
      setWeatherError(e.message);
    }
  };

  const safeMin = Math.min(minTemp, maxTemp);
  const safeMax = Math.max(minTemp, maxTemp);

  const plants = getAllPlants();
  const results = { vert: [], jaune: [], rouge: [] };
  plants.forEach(p => {
    const zone = classifyPlant(p, safeMin, safeMax, useSerre);
    if (zone) results[zone].push(p);
  });

  return (
    <div className="meteo-widget">
      <div className="meteo-header">
        <span className="meteo-title">🌡️ Météo & Recommandations</span>
        <button className="meteo-close" onClick={toggleMeteo}>✕</button>
      </div>

      {/* ── Real weather section ── */}
      <div className="meteo-weather-section">
        {weatherLoading && (
          <div className="meteo-loading">
            <span className="spin-dot"/><span className="spin-dot"/><span className="spin-dot"/>
            <span style={{ marginLeft: '0.5rem' }}>Chargement météo…</span>
          </div>
        )}
        {weatherError && !weatherLoading && (
          <div className="meteo-error-msg">⚠️ {weatherError}</div>
        )}
        {weather && !weatherLoading && (
          <div className="meteo-current">
            <div className="meteo-current-main">
              <span className="meteo-current-icon">{getWeatherIcon(weather.code)}</span>
              <div>
                <div className="meteo-current-temp">{weather.temp}°C</div>
                <div className="meteo-current-desc">{getWeatherLabel(weather.code)}</div>
                {weather.location && <div className="meteo-current-loc">📍 {weather.location}</div>}
              </div>
              <div className="meteo-current-details">
                <span>💧 {weather.humidity}%</span>
                <span>💨 {weather.wind} km/h</span>
                <span>🌡️ ressenti {weather.feelsLike}°C</span>
              </div>
            </div>
            <ForecastBar forecast={weather.forecast} />
          </div>
        )}

        <div className="meteo-loc-actions">
          {!showLocationSearch ? (
            <>
              <button className="meteo-loc-btn" onClick={() => setShowLocationSearch(true)}>🔍 Changer de ville</button>
              <button className="meteo-loc-btn" onClick={handleGeolocate}>📍 Ma position</button>
            </>
          ) : (
            <>
              <LocationSearch onSelect={handleLocationSelect} />
              <button className="meteo-loc-btn" onClick={() => setShowLocationSearch(false)}>Annuler</button>
            </>
          )}
        </div>
      </div>

      {/* ── Plant recommendation section ── */}
      <div className="meteo-toggle">
        <button className={`toggle-btn ${!useSerre ? 'active' : ''}`} onClick={() => setUseSerre(false)}>🌳 Plein air</button>
        <button className={`toggle-btn ${useSerre ? 'active' : ''}`} onClick={() => setUseSerre(true)}>🏠 Sous abri</button>
      </div>

      <div className="meteo-sliders">
        <TempSlider label="Température min" value={minTemp} onChange={v => setMinTemp(Math.min(v, maxTemp))} />
        <TempSlider label="Température max" value={maxTemp} onChange={v => setMaxTemp(Math.max(v, minTemp))} />
      </div>

      <div className="meteo-range-display">
        Plage : <strong>{safeMin}°C — {safeMax}°C</strong>
        {weather && <span className="meteo-auto-label"> (synchronisé météo)</span>}
      </div>

      <div className="meteo-results">
        {['vert', 'jaune', 'rouge'].map(zone => {
          const cfg = ZONE_CONFIG[zone];
          const list = results[zone];
          if (list.length === 0) return null;
          return (
            <div key={zone} className="meteo-zone" style={{ background: cfg.bg, borderColor: cfg.border }}>
              <div className="meteo-zone-title" style={{ color: cfg.color }}>
                {cfg.icon} {cfg.label} ({list.length})
              </div>
              <div className="meteo-zone-plants">
                {list.map(p => (
                  <button key={p.id} className="meteo-plant-btn" style={{ color: cfg.color }}
                    onClick={() => openDetail(p)}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
