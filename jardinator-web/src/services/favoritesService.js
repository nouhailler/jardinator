const KEY = 'jardinator_favorites';

/** Charge les favoris depuis localStorage → Set de noms de plantes */
export function loadFavorites() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); }
  catch { return new Set(); }
}

function persist(set) {
  localStorage.setItem(KEY, JSON.stringify([...set]));
}

/** Ajoute ou retire un nom du set, sauvegarde, retourne le nouveau Set */
export function toggleFavoriteEntry(set, name) {
  const next = new Set(set);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  persist(next);
  return next;
}
