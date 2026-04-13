import { useState, useCallback } from 'react';
import { getAllPlants } from '../services/vegetableService';
import useStore from '../store/useStore';

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

function TempSlider({ label, value, onChange, min = -10, max = 45 }) {
  return (
    <div className="temp-slider-row">
      <span className="temp-slider-label">{label} : <strong>{value}°C</strong></span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="temp-slider"
      />
      <div className="temp-slider-ticks">
        {[-10, 0, 10, 20, 30, 40].map(t => (
          <span key={t}>{t}°</span>
        ))}
      </div>
    </div>
  );
}

export default function MeteoWidget() {
  const toggleMeteo = useStore(s => s.toggleMeteo);
  const openDetail = useStore(s => s.openDetail);
  const [minTemp, setMinTemp] = useState(5);
  const [maxTemp, setMaxTemp] = useState(18);
  const [useSerre, setUseSerre] = useState(false);

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
        <span className="meteo-title">🌡️ Que puis-je sortir aujourd'hui ?</span>
        <button className="meteo-close" onClick={toggleMeteo}>✕</button>
      </div>

      <div className="meteo-toggle">
        <button
          className={`toggle-btn ${!useSerre ? 'active' : ''}`}
          onClick={() => setUseSerre(false)}
        >🌳 Plein air</button>
        <button
          className={`toggle-btn ${useSerre ? 'active' : ''}`}
          onClick={() => setUseSerre(true)}
        >🏠 Sous abri</button>
      </div>

      <div className="meteo-sliders">
        <TempSlider label="Température min" value={minTemp} onChange={v => setMinTemp(Math.min(v, maxTemp))} />
        <TempSlider label="Température max" value={maxTemp} onChange={v => setMaxTemp(Math.max(v, minTemp))} />
      </div>

      <div className="meteo-range-display">
        Plage : <strong>{safeMin}°C — {safeMax}°C</strong>
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
