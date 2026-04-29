/**
 * gardenHistoryService.js
 * Persists AI analysis snapshots per garden bed so the user can track
 * how their garden evolves over time.
 */

const KEY = 'jardinator_garden_ai_history';
const MAX_ENTRIES = 50;

/** @returns {Array} all saved entries, newest first */
export function loadGardenHistory() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

/** Save a new analysis snapshot */
export function saveGardenSnapshot({ bedId, bedName, score, conflictsCount, harmoniesCount, speciesCount, plants, aiText, provider, model }) {
  const entries = loadGardenHistory();
  entries.unshift({
    id:              `${bedId}-${Date.now()}`,
    bedId,
    bedName,
    savedAt:         new Date().toISOString(),
    score,
    conflictsCount,
    harmoniesCount,
    speciesCount,
    plants:          plants.slice(0, 40),
    aiText,
    provider,
    model,
  });
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {}
}

/** Delete one entry by id */
export function deleteGardenSnapshot(id) {
  const entries = loadGardenHistory().filter(e => e.id !== id);
  try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch {}
}

/** Entries for a specific bed, newest first */
export function loadBedHistory(bedId) {
  return loadGardenHistory().filter(e => e.bedId === bedId);
}

export function formatSnapshotDate(iso) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
