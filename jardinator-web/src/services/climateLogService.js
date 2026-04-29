/**
 * climateLogService.js
 * Historique climatique réel via Open-Meteo (past_days=30).
 * Analyse les seuils thermiques des plantes sur la période.
 */

const CACHE_KEY = 'jardinator_climate_history';
const CACHE_TTL = 3 * 60 * 60 * 1000; // 3 h

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function fetchClimateHistory(lat, lon, locationName = '') {
  const cached = loadClimateHistory();
  if (cached && cached.lat === lat && cached.lon === lon
    && Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_TTL) {
    return cached;
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum` +
    `&past_days=30&forecast_days=0&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo historique : ${res.status}`);
  const raw = await res.json();

  const days = raw.daily.time.map((date, i) => ({
    date,
    tempMin: Math.round(raw.daily.temperature_2m_min[i]),
    tempMax: Math.round(raw.daily.temperature_2m_max[i]),
    code:    raw.daily.weathercode[i],
    precip:  Math.round(raw.daily.precipitation_sum[i] * 10) / 10,
  }));

  const data = { lat, lon, location: locationName, fetchedAt: new Date().toISOString(), days };
  saveClimateHistory(data);
  return data;
}

// ── Storage ───────────────────────────────────────────────────────────────────

export function loadClimateHistory() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); }
  catch { return null; }
}

function saveClimateHistory(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
}

// ── Analysis ──────────────────────────────────────────────────────────────────

/**
 * Returns notable events from a 30-day history:
 * - Frost days (tempMin ≤ 0)
 * - Heat stress days (tempMax ≥ 32)
 * - First day a plant's temperature minimum was met (for up to 15 key plants)
 */
export function getNotableEvents(days, plants) {
  if (!days?.length) return [];

  const events = [];
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  // ── Frost / gel ──
  sorted.forEach(d => {
    if (d.tempMin <= 0) {
      events.push({
        type:  'frost',
        date:  d.date,
        icon:  '❄️',
        label: `Gel nocturne (${d.tempMin}°C)`,
        detail: 'Risque pour les plantes sensibles au gel',
      });
    }
  });

  // ── Forte chaleur ──
  sorted.forEach(d => {
    if (d.tempMax >= 32) {
      events.push({
        type:  'heat',
        date:  d.date,
        icon:  '🔥',
        label: `Forte chaleur (${d.tempMax}°C)`,
        detail: 'Stress hydrique — arrosage matin recommandé',
      });
    }
  });

  // ── Fortes pluies ──
  sorted.forEach(d => {
    if (d.precip >= 20) {
      events.push({
        type:  'rain',
        date:  d.date,
        icon:  '🌊',
        label: `Fortes précipitations (${d.precip} mm)`,
        detail: 'Risque de lessivage du sol et maladies fongiques',
      });
    }
  });

  // ── Premier jour favorable par plante (seuil min atteint) ──
  // Sélectionne les plantes ayant un tempOutdoorMin défini, limitées à 12 pour l'affichage
  const plantsWithMin = plants
    .filter(p => p.tempOutdoorMin !== null && p.tempOutdoorMin !== undefined)
    .sort((a, b) => (a.tempOutdoorMin ?? 99) - (b.tempOutdoorMin ?? 99));

  // Regroupe par seuil pour éviter la redondance
  const seenThresholds = {};
  plantsWithMin.forEach(plant => {
    const threshold = plant.tempOutdoorMin;
    if (seenThresholds[threshold]) {
      seenThresholds[threshold].plants.push(plant.name);
      return;
    }
    const firstDay = sorted.find(d => d.tempMin >= threshold);
    if (firstDay) {
      seenThresholds[threshold] = {
        type:      'threshold',
        date:      firstDay.date,
        icon:      '🌡️',
        threshold,
        plants:    [plant.name],
        label:     null, // computed below
        detail:    null,
      };
    }
  });

  Object.values(seenThresholds).forEach(ev => {
    const names = ev.plants.slice(0, 4).join(', ')
      + (ev.plants.length > 4 ? `… (+${ev.plants.length - 4})` : '');
    ev.label  = `Seuil ${ev.threshold}°C atteint — ${names}`;
    ev.detail = `Première nuit ≥ ${ev.threshold}°C : conditions favorables pour la germination/plantation`;
    events.push(ev);
  });

  // Trier par date décroissante (le plus récent en premier)
  return events.sort((a, b) => b.date.localeCompare(a.date));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatClimateDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}
