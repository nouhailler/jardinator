// Open-Meteo API — completely free, no API key required
// https://open-meteo.com/

import { getApiKey, getSavedModel } from './aiService';
import { getOllamaUrl, getOllamaModel } from './ollamaService';

const CACHE_KEY = 'jardinator_weather';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export const WMO_CODES = {
  0: { label: 'Ciel dégagé', icon: '☀️' },
  1: { label: 'Peu nuageux', icon: '🌤️' },
  2: { label: 'Partiellement nuageux', icon: '⛅' },
  3: { label: 'Couvert', icon: '☁️' },
  45: { label: 'Brouillard', icon: '🌫️' },
  48: { label: 'Brouillard givrant', icon: '🌫️' },
  51: { label: 'Bruine légère', icon: '🌦️' },
  53: { label: 'Bruine modérée', icon: '🌦️' },
  55: { label: 'Bruine dense', icon: '🌧️' },
  61: { label: 'Pluie faible', icon: '🌧️' },
  63: { label: 'Pluie modérée', icon: '🌧️' },
  65: { label: 'Pluie forte', icon: '🌧️' },
  71: { label: 'Neige légère', icon: '🌨️' },
  73: { label: 'Neige modérée', icon: '❄️' },
  75: { label: 'Neige forte', icon: '❄️' },
  80: { label: 'Averses légères', icon: '🌦️' },
  81: { label: 'Averses modérées', icon: '🌧️' },
  82: { label: 'Averses violentes', icon: '⛈️' },
  95: { label: 'Orage', icon: '⛈️' },
  96: { label: 'Orage avec grêle', icon: '⛈️' },
  99: { label: 'Orage fort avec grêle', icon: '⛈️' },
};

export function getWeatherIcon(code) {
  return (WMO_CODES[code] || { icon: '🌡️' }).icon;
}
export function getWeatherLabel(code) {
  return (WMO_CODES[code] || { label: 'Conditions inconnues' }).label;
}

function getCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

export function clearWeatherCache() {
  localStorage.removeItem(CACHE_KEY);
}

export function getSavedLocation() {
  try { return JSON.parse(localStorage.getItem('jardinator_location') || 'null'); } catch { return null; }
}
export function saveLocation(loc) {
  try { localStorage.setItem('jardinator_location', JSON.stringify(loc)); } catch {}
}

/**
 * Fetch weather from Open-Meteo.
 * @param {number} lat
 * @param {number} lon
 * @param {string} locationName
 * @returns {Promise<WeatherData>}
 */
export async function fetchWeather(lat, lon, locationName = '') {
  const cached = getCached();
  if (cached && cached.lat === lat && cached.lon === lon) return cached;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weathercode,relative_humidity_2m,wind_speed_10m,apparent_temperature` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum` +
    `&timezone=auto&forecast_days=7`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo: ${res.status}`);
  const raw = await res.json();

  const data = {
    lat, lon,
    location: locationName,
    temp: Math.round(raw.current.temperature_2m),
    feelsLike: Math.round(raw.current.apparent_temperature),
    humidity: Math.round(raw.current.relative_humidity_2m),
    wind: Math.round(raw.current.wind_speed_10m),
    code: raw.current.weathercode,
    forecast: raw.daily.time.map((date, i) => ({
      date,
      tempMax: Math.round(raw.daily.temperature_2m_max[i]),
      tempMin: Math.round(raw.daily.temperature_2m_min[i]),
      code: raw.daily.weathercode[i],
      precip: Math.round(raw.daily.precipitation_sum[i] * 10) / 10,
    })),
    fetchedAt: new Date().toISOString(),
  };

  setCache(data);
  return data;
}

/**
 * Get user location via browser Geolocation API, then reverse-geocode with Open-Meteo's geocoding.
 * Returns { lat, lon, name }.
 */
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Géolocalisation non disponible dans ce navigateur.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, name: '' }),
      err => reject(new Error(
        err.code === 1 ? 'Accès à la localisation refusé.' :
        err.code === 2 ? 'Position indisponible.' :
        'Délai de géolocalisation dépassé.'
      )),
      { timeout: 10000, maximumAge: 60000 }
    );
  });
}

/**
 * Search locations by name using Open-Meteo Geocoding API (free).
 * @param {string} query
 * @returns {Promise<Array<{lat, lon, name, country}>>}
 */
export async function searchLocation(query) {
  if (!query.trim()) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=fr&format=json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).map(r => ({
    lat: r.latitude,
    lon: r.longitude,
    name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
  }));
}

// ── Weather AI Recommendations ────────────────────────────────────────────────

const WEATHER_RECS_KEY = 'jardinator_weather_ai_recs';
const OR_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export function loadWeatherAiRecs() {
  try { return JSON.parse(localStorage.getItem(WEATHER_RECS_KEY) || 'null'); }
  catch { return null; }
}

export function saveWeatherAiRecs(recs) {
  try {
    localStorage.setItem(WEATHER_RECS_KEY, JSON.stringify({
      text: recs.text,
      provider: recs.provider,
      model: recs.model,
      savedAt: new Date().toISOString(),
      location: recs.location,
    }));
  } catch {}
}

export function buildWeatherAiPrompt(weather) {
  const today    = weather.forecast?.[0];
  const next6    = (weather.forecast || []).slice(1, 7);
  const location = weather.location || 'votre jardin';
  const month    = new Date().toLocaleString('fr-FR', { month: 'long' });

  const forecastLines = next6.map((d, i) => {
    const dayLabel = ['demain', 'dans 2 j', 'dans 3 j', 'dans 4 j', 'dans 5 j', 'dans 6 j'][i];
    const rain = d.precip > 0 ? `, ${d.precip} mm pluie` : '';
    const w = WMO_CODES[d.code]?.label || '';
    return `- ${dayLabel} : ${d.tempMin}°C / ${d.tempMax}°C${rain}${w ? ' — ' + w : ''}`;
  }).join('\n');

  const todayLine = today
    ? `Min/Max aujourd'hui : ${today.tempMin}°C / ${today.tempMax}°C${today.precip > 0 ? `, ${today.precip} mm` : ''}`
    : '';

  return `Tu es un expert en jardinage potager européen. Nous sommes en ${month}.
Voici les conditions météo pour ${location} :

• Maintenant : ${weather.temp}°C (ressenti ${weather.feelsLike}°C), ${WMO_CODES[weather.code]?.label || ''}, humidité ${weather.humidity}%, vent ${weather.wind} km/h
• ${todayLine}

Prévisions des 6 prochains jours :
${forecastLines}

Génère 4 à 6 recommandations pratiques et concises pour un jardinier potager.
Format strict — une recommandation par ligne :
[Observation météo] → [Action concrète au jardin]

Exemples valides :
"Pluie attendue demain (12 mm) → Inutile d'arroser aujourd'hui"
"Gel annoncé cette nuit (-1°C) → Paillez les tomates et rentrez les plants fragiles"
"Forte chaleur dans 2 jours (34°C) → Préparez l'ombrage des salades et arrosez le soir"

Sois direct, pratique et adapté aux conditions détectées. Réponds uniquement avec les recommandations, sans introduction.`;
}

export async function* askOllamaWeatherStream(prompt, baseUrl, model) {
  const url = (baseUrl || getOllamaUrl()).replace(/\/$/, '');
  const mod = model || getOllamaModel();
  if (!mod) throw new Error('NO_MODEL');

  const res = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: mod,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Erreur ${res.status}`);
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const chunk = JSON.parse(line);
        const text = chunk?.message?.content;
        if (text) yield text;
        if (chunk.done) return;
      } catch {}
    }
  }
}

export async function* askOpenRouterWeatherStream(prompt) {
  const key = getApiKey();
  if (!key) throw new Error('NO_KEY');
  const model = getSavedModel();
  if (!model) throw new Error('NO_MODEL');

  const res = await fetch(OR_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Jardinator',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('BAD_KEY');
    throw new Error(err?.error?.message || `Erreur ${res.status}`);
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json || json === '[DONE]') continue;
      try {
        const chunk = JSON.parse(json);
        const text = chunk?.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch {}
    }
  }
}
