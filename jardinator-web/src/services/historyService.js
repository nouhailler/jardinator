const KEY = 'jardinator_plant_history';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
  catch { return {}; }
}

function persist(store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

/** Retourne le texte d'historique sauvegardé pour une plante (clé = nom) */
export function getSavedHistory(plantName) {
  return load()[plantName] || null;
}

/** Sauvegarde le texte d'historique pour une plante */
export function saveHistory(plantName, text) {
  const store = load();
  store[plantName] = text;
  persist(store);
}

/** Supprime l'historique d'une plante */
export function deleteHistory(plantName) {
  const store = load();
  delete store[plantName];
  persist(store);
}

/** Retourne tout le store {plantName: text} */
export function getAllSavedHistory() {
  return load();
}
