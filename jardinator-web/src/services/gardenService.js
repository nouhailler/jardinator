// Garden Planner & Crop History — localStorage persistence

const BEDS_KEY = 'jardinator_garden_beds';
const HISTORY_KEY = 'jardinator_crop_history';

// ─── Garden Beds ─────────────────────────────────────────────────────────────

export function loadGardenBeds() {
  try { return JSON.parse(localStorage.getItem(BEDS_KEY) || '[]'); } catch { return []; }
}

export function saveGardenBeds(beds) {
  try { localStorage.setItem(BEDS_KEY, JSON.stringify(beds)); } catch {}
}

export function createBed(name, rows = 4, cols = 6, cellSizeM = 0.5) {
  return {
    id: `bed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    rows,
    cols,
    cellSizeM,
    cells: {}, // { "r-c": { plantId, plantedDate, notes } }
    createdAt: new Date().toISOString(),
  };
}

// ─── Crop History ─────────────────────────────────────────────────────────────

export function loadCropHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}'); } catch { return {}; }
}

export function saveCropHistory(history) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {}
}

/** Returns history array for a specific cell: [{ year, plantId, notes, harvestDate }] */
export function getCellHistory(history, bedId, cellKey) {
  return (history[bedId]?.[cellKey] || []).slice().reverse(); // most recent first
}

/** Add or update the current year entry for a cell */
export function addCropRecord(history, bedId, cellKey, plantId, notes = '', year = new Date().getFullYear()) {
  const newHistory = { ...history };
  if (!newHistory[bedId]) newHistory[bedId] = {};
  if (!newHistory[bedId][cellKey]) newHistory[bedId][cellKey] = [];

  const existing = newHistory[bedId][cellKey].findIndex(r => r.year === year);
  const record = { year, plantId, notes, savedAt: new Date().toISOString() };
  if (existing >= 0) {
    newHistory[bedId][cellKey] = newHistory[bedId][cellKey].map((r, i) => i === existing ? record : r);
  } else {
    newHistory[bedId][cellKey] = [...newHistory[bedId][cellKey], record];
  }
  return newHistory;
}

export function removeCropRecord(history, bedId, cellKey, year) {
  const newHistory = { ...history };
  if (!newHistory[bedId]?.[cellKey]) return newHistory;
  newHistory[bedId][cellKey] = newHistory[bedId][cellKey].filter(r => r.year !== year);
  return newHistory;
}
