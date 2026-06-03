import { useState, useEffect, useRef } from 'react';
import { getAllPlants } from '../services/vegetableService';
import useStore from '../store/useStore';
import {
  fetchWeather, getUserLocation, searchLocation,
  getSavedLocation, saveLocation, getWeatherIcon, getWeatherLabel,
  buildWeatherAiPrompt, askOllamaWeatherStream, askOpenRouterWeatherStream,
  loadWeatherAiRecs, saveWeatherAiRecs,
} from '../services/weatherService';
import {
  fetchClimateHistory, loadClimateHistory,
  getNotableEvents, formatClimateDate,
} from '../services/climateLogService';
import { getOllamaUrl, getOllamaModel } from '../services/ollamaService';
import { getApiKey, getSavedModel } from '../services/aiService';

function classifyPlant(plant, minTemp, maxTemp, useSerre) {
  const pMin = useSerre ? plant.tempGreenhouseMin : plant.tempOutdoorMin;
  const pMax = useSerre ? plant.tempGreenhouseMax : plant.tempOutdoorMax;
  if (pMin === null || pMax === null) return null;
  if (maxTemp < pMin) return 'rouge';
  if (minTemp >= pMin && maxTemp <= pMax) return 'vert';
  return 'jaune';
}

const ZONE_CONFIG = {
  vert:  { bg: '#E8F5E9', border: '#A5D6A7', color: '#2E7D32', icon: '🟢', label: 'Peut sortir' },
  jaune: { bg: '#FFFDE7', border: '#FFE082', color: '#F57F17', icon: '🟡', label: 'Risque thermique' },
  rouge: { bg: '#FFEBEE', border: '#EF9A9A', color: '#C62828', icon: '🔴', label: 'Garder à l\'abri' },
};

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function tempColor(t) {
  if (t <= 0)  return '#64b5f6';
  if (t <= 10) return '#81c784';
  if (t <= 22) return '#4caf50';
  if (t <= 30) return '#ff9800';
  return '#f44336';
}

// ─── TempSlider ───────────────────────────────────────────────────────────────
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

// ─── LocationSearch ───────────────────────────────────────────────────────────
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
      <input className="meteo-loc-input" placeholder="🔍 Chercher une ville…"
        value={q} onChange={e => handleInput(e.target.value)} />
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

// ─── ForecastBar ──────────────────────────────────────────────────────────────
function ForecastBar({ forecast }) {
  return (
    <div className="meteo-forecast">
      {forecast.slice(0, 7).map((day, i) => {
        const date = new Date(day.date);
        const dayLabel = i === 0 ? 'Auj.' : DAY_LABELS[date.getDay()];
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

// ─── WeatherAiSection ─────────────────────────────────────────────────────────
function WeatherAiSection({ weather }) {
  const [open, setOpen]         = useState(false);
  const [provider, setProvider] = useState('ollama');
  const [streaming, setStreaming] = useState('');
  const [status, setStatus]     = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedRecs, setSavedRecs] = useState(() => loadWeatherAiRecs());
  const [meteoLogs, setMeteoLogs] = useState([]);
  const [showLogs, setShowLogs]   = useState(false);
  const abortRef    = useRef(false);
  const responseRef = useRef(null);

  const ollamaModel = getOllamaModel();
  const orKey       = getApiKey();
  const orModel     = getSavedModel();
  const activeModel = provider === 'ollama' ? ollamaModel : orModel;

  const warning = provider === 'ollama' && !ollamaModel
    ? '⚠️ Modèle Ollama non configuré'
    : provider === 'openrouter' && !orKey
      ? '⚠️ Clé API OpenRouter manquante'
      : provider === 'openrouter' && !orModel
        ? '⚠️ Modèle non sélectionné'
        : null;

  const canGenerate = !warning && weather && status !== 'loading';
  const displayText = (status === 'loading' || status === 'done') ? streaming : (savedRecs?.text || '');
  const lines = displayText ? displayText.split('\n').filter(l => l.trim()) : [];

  useEffect(() => {
    if (responseRef.current)
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
  }, [streaming]);

  async function handleGenerate() {
    if (!canGenerate) return;
    setStatus('loading');
    setStreaming('');
    setErrorMsg('');
    abortRef.current = false;

    const ts = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const localLogs = [];
    const mlog = (level, msg, detail = '') => {
      localLogs.push({ id: Date.now() + Math.random(), ts: ts(), level, msg, detail });
      setMeteoLogs([...localLogs]);
    };

    setMeteoLogs([]);
    let full = '';

    try {
      mlog('info', `Provider : ${provider}`, activeModel || '(aucun)');
      mlog('info', `Clé API : ${orKey ? '✓ ' + orKey.slice(0, 14) + '…' : '✗ manquante'}`, '');
      mlog('info', `Météo chargée : ${weather ? `${weather.temp}°C à ${weather.location || '?'}` : '⚠️ null'}`,
        weather ? `forecast : ${weather.forecast?.length ?? 0} jours` : '');

      const prompt = buildWeatherAiPrompt(weather);
      mlog('info', `Prompt : ${prompt.length} caractères`, prompt.slice(0, 80) + '…');

      mlog('info', 'Envoi requête…', '');
      const stream = provider === 'ollama'
        ? askOllamaWeatherStream(prompt, getOllamaUrl(), ollamaModel)
        : askOpenRouterWeatherStream(prompt);

      let chunkCount = 0;
      for await (const chunk of stream) {
        if (abortRef.current) break;
        full += chunk;
        chunkCount++;
        if (chunkCount === 1) mlog('ok', `1er chunk reçu ✓`, chunk.slice(0, 60));
        setStreaming(full);
      }
      mlog('ok', `Terminé`, `${chunkCount} chunks — ${full.length} caractères`);

      if (!abortRef.current && full) {
        const recs = { text: full, provider, model: activeModel, location: weather.location };
        saveWeatherAiRecs(recs);
        setSavedRecs({ ...recs, savedAt: new Date().toISOString() });
      }
      setStatus('done');
    } catch (err) {
      mlog('error', `Erreur : ${err.message}`, '');
      const msgs = { NO_KEY: 'Clé API OpenRouter manquante.', NO_MODEL: 'Modèle non configuré.', BAD_KEY: 'Clé API invalide.', RATE_LIMIT: '⏳ Limite de requêtes atteinte — attendez ~60s et réessayez (quota modèle gratuit).' };
      setErrorMsg(msgs[err.message] || `Erreur : ${err.message}`);
      setStatus('error');
      setShowLogs(true);
    }
  }

  return (
    <div className="meteo-section">
      <button className={`meteo-section-toggle ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span>🤖 Recommandations IA</span>
        {savedRecs && <span className="meteo-section-badge">✓</span>}
        <span className="meteo-section-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="meteo-ai-section">
          <div className="meteo-ai-controls">
            <div className="chat-provider-toggle">
              <button className={`chat-provider-btn ${provider === 'ollama' ? 'active' : ''}`} onClick={() => setProvider('ollama')}>🖥️ Ollama</button>
              <button className={`chat-provider-btn ${provider === 'openrouter' ? 'active' : ''}`} onClick={() => setProvider('openrouter')}>☁️ OpenRouter</button>
            </div>
            {warning
              ? <span className="chat-warning">{warning}</span>
              : activeModel && <span className="chat-model-badge">{activeModel}</span>
            }
            {status === 'loading'
              ? <button className="btn-stop" onClick={() => { abortRef.current = true; setStatus('done'); }}>⏹ Arrêter</button>
              : <button className="meteo-ai-btn" onClick={handleGenerate} disabled={!canGenerate}>
                  {lines.length ? '🔄 Régénérer' : '✨ Générer'}
                </button>
            }
          </div>

          {status === 'error' && <div className="chat-error">{errorMsg}</div>}

          {/* ── Logs de diagnostic ── */}
          {meteoLogs.length > 0 && (
            <div className="meteo-debug">
              <button
                className="meteo-debug-toggle"
                onClick={() => setShowLogs(v => !v)}
              >
                🔍 Diagnostic {showLogs ? '▲' : '▼'} ({meteoLogs.length})
              </button>
              {showLogs && (
                <div className="meteo-debug-panel">
                  {meteoLogs.map(e => (
                    <div key={e.id} className={`meteo-debug-line meteo-debug-${e.level}`}>
                      <span className="meteo-debug-ts">{e.ts}</span>
                      <span className="meteo-debug-msg">{e.msg}</span>
                      {e.detail && <span className="meteo-debug-detail">{e.detail}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {status === 'loading' && !streaming && (
            <div className="meteo-loading" style={{ padding: '0.75rem' }}>
              <span className="spin-dot"/><span className="spin-dot"/><span className="spin-dot"/>
              <span>Analyse en cours…</span>
            </div>
          )}

          {lines.length > 0 ? (
            <div className="meteo-ai-recs" ref={responseRef}>
              {lines.map((line, i) => {
                const arrow = line.indexOf('→');
                const ctx    = arrow > -1 ? line.slice(0, arrow).trim() : '';
                const action = arrow > -1 ? line.slice(arrow + 1).trim() : line;
                return (
                  <div key={i} className="meteo-ai-rec-line">
                    {ctx && <span className="meteo-ai-rec-ctx">{ctx}</span>}
                    {ctx && <span className="meteo-ai-rec-arrow">→</span>}
                    <span className="meteo-ai-rec-action">{action}</span>
                    {i === lines.length - 1 && status === 'loading' && <span className="chat-cursor">▋</span>}
                  </div>
                );
              })}
              {savedRecs?.savedAt && status !== 'loading' && (
                <div className="meteo-ai-meta">
                  Généré le {new Date(savedRecs.savedAt).toLocaleString('fr-FR', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                  {savedRecs.location && ` — ${savedRecs.location}`}
                </div>
              )}
            </div>
          ) : (
            status === 'idle' && !errorMsg && (
              <p className="meteo-ai-placeholder">
                Basées sur les prévisions 7 jours, l'IA génère des recommandations
                concrètes pour votre jardin : arrosage, protection gel, ombrage, semis…
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── ClimateJournalSection ────────────────────────────────────────────────────
function ClimateJournalSection({ weatherLocation }) {
  const [open, setOpen]       = useState(false);
  const [history, setHistory] = useState(() => loadClimateHistory());
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function refresh() {
    if (!weatherLocation?.lat) { setError('Aucune position météo configurée. Configurez votre ville dans le widget météo.'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await fetchClimateHistory(weatherLocation.lat, weatherLocation.lon, weatherLocation.name);
      setHistory(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && !history && weatherLocation?.lat) refresh();
  }, [open]);

  const plants = getAllPlants();
  const events = history ? getNotableEvents(history.days, plants) : [];

  return (
    <div className="meteo-section">
      <button className={`meteo-section-toggle ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span>📅 Journal climatique (30 jours)</span>
        {history && <span className="meteo-section-badge">{history.days.length}j</span>}
        <span className="meteo-section-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="meteo-climate-section">
          <div className="meteo-climate-toolbar">
            {history && (
              <span className="meteo-climate-info">
                📍 {history.location || 'Position actuelle'}
                <span className="meteo-climate-fetched">
                  · actualisé {new Date(history.fetchedAt).toLocaleDateString('fr-FR')}
                </span>
              </span>
            )}
            <button className="meteo-loc-btn" onClick={refresh} disabled={loading}>
              {loading ? '…' : '🔄 Actualiser'}
            </button>
          </div>

          {loading && (
            <div className="meteo-loading" style={{ padding: '0.75rem' }}>
              <span className="spin-dot"/><span className="spin-dot"/><span className="spin-dot"/>
              <span>Chargement de l'historique…</span>
            </div>
          )}

          {error && <div className="meteo-error-msg">⚠️ {error}</div>}

          {history && !loading && (
            <>
              {/* Température chart — 20 derniers jours */}
              <div className="meteo-temp-timeline">
                {history.days.slice(-20).map((d, i) => {
                  const barH = Math.max(4, Math.round(Math.max(0, d.tempMax) * 1.8));
                  return (
                    <div key={d.date} className={`mtt-col ${i === 19 ? 'mtt-col--today' : ''}`}>
                      <div className="mtt-max-label">{d.tempMax}°</div>
                      <div className="mtt-bar" style={{ height: `${barH}px`, background: tempColor(d.tempMax) }} />
                      {d.tempMin < 0 && <div className="mtt-frost-bar" style={{ height: `${Math.round(-d.tempMin * 2)}px` }} />}
                      {d.precip >= 3 && <div className="mtt-rain-dot" title={`${d.precip}mm`}>💧</div>}
                      <div className="mtt-date">{formatClimateDate(d.date)}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mtt-legend">
                <span style={{ color: '#64b5f6' }}>■ Froid</span>
                <span style={{ color: '#4caf50' }}>■ Idéal</span>
                <span style={{ color: '#ff9800' }}>■ Chaud</span>
                <span style={{ color: '#f44336' }}>■ Chaleur</span>
              </div>

              {/* Notable events */}
              {events.length > 0 ? (
                <div className="meteo-climate-events">
                  <div className="meteo-climate-events-title">📋 Événements notables</div>
                  {events.slice(0, 15).map((ev, i) => (
                    <div key={i} className={`mce-row mce-row--${ev.type}`}>
                      <span className="mce-icon">{ev.icon}</span>
                      <span className="mce-date">{formatClimateDate(ev.date)}</span>
                      <div className="mce-body">
                        <span className="mce-label">{ev.label}</span>
                        <span className="mce-detail">{ev.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="meteo-ai-placeholder">
                  Aucun événement notable (gel, forte chaleur, seuils plantes) sur les 30 derniers jours.
                </p>
              )}
            </>
          )}

          {!history && !loading && !error && (
            <div className="meteo-ai-placeholder">
              <p>Le journal récupère les températures réelles des 30 derniers jours via Open-Meteo et détecte automatiquement les événements notables pour vos plantes.</p>
              <button className="meteo-ai-btn" onClick={refresh} style={{ marginTop: '0.6rem' }}>
                📥 Charger l'historique
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main MeteoWidget ─────────────────────────────────────────────────────────
export default function MeteoWidget() {
  const toggleMeteo  = useStore(s => s.toggleMeteo);
  const openDetail   = useStore(s => s.openDetail);
  const { weather, setWeather, setWeatherLoading, setWeatherError, weatherLoading, weatherError } = useStore();

  const [minTemp, setMinTemp]               = useState(5);
  const [maxTemp, setMaxTemp]               = useState(18);
  const [useSerre, setUseSerre]             = useState(false);
  const [showLocationSearch, setShowLocSearch] = useState(false);
  const [savedLocation, setSavedLocation]   = useState(() => getSavedLocation());

  useEffect(() => {
    const saved = getSavedLocation();
    if (saved) {
      loadWeather(saved.lat, saved.lon, saved.name);
    } else {
      getUserLocation()
        .then(loc => loadWeather(loc.lat, loc.lon, ''))
        .catch(() => {});
    }
  }, []);

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
    setSavedLocation(loc);
    loadWeather(loc.lat, loc.lon, loc.name);
    setShowLocSearch(false);
  };

  const handleGeolocate = async () => {
    setWeatherLoading(true);
    try {
      const loc = await getUserLocation();
      saveLocation(loc);
      setSavedLocation(loc);
      await loadWeather(loc.lat, loc.lon, loc.name);
    } catch (e) {
      setWeatherError(e.message);
    }
  };

  const safeMin = Math.min(minTemp, maxTemp);
  const safeMax = Math.max(minTemp, maxTemp);
  const plants  = getAllPlants();
  const results = { vert: [], jaune: [], rouge: [] };
  plants.forEach(p => {
    const zone = classifyPlant(p, safeMin, safeMax, useSerre);
    if (zone) results[zone].push(p);
  });

  const weatherLocation = weather
    ? { lat: weather.lat, lon: weather.lon, name: weather.location }
    : savedLocation;

  return (
    <div className="meteo-widget">
      <div className="meteo-header">
        <span className="meteo-title">🌡️ Météo & Recommandations</span>
        <button className="meteo-close" onClick={toggleMeteo}>✕</button>
      </div>

      {/* ── Météo actuelle ── */}
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
              <button className="meteo-loc-btn" onClick={() => setShowLocSearch(true)}>🔍 Changer de ville</button>
              <button className="meteo-loc-btn" onClick={handleGeolocate}>📍 Ma position</button>
            </>
          ) : (
            <>
              <LocationSearch onSelect={handleLocationSelect} />
              <button className="meteo-loc-btn" onClick={() => setShowLocSearch(false)}>Annuler</button>
            </>
          )}
        </div>
      </div>

      {/* ── Recommandations IA ── */}
      <WeatherAiSection weather={weather} />

      {/* ── Journal climatique ── */}
      <ClimateJournalSection weatherLocation={weatherLocation} />

      {/* ── Classification plantes ── */}
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
          const cfg  = ZONE_CONFIG[zone];
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
