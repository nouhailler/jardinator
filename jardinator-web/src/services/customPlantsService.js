const KEY = 'jardinator_custom_plants';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function persist(plants) {
  localStorage.setItem(KEY, JSON.stringify(plants));
}

export function loadCustomPlants() {
  return load();
}

/** Add or update a plant (matched by id). Returns the new list. */
export function saveCustomPlant(plant) {
  const list = load();
  const idx = list.findIndex(p => p.id === plant.id);
  if (idx >= 0) list[idx] = plant;
  else list.push(plant);
  persist(list);
  return [...list];
}

export function deleteCustomPlant(id) {
  const list = load().filter(p => p.id !== id);
  persist(list);
  return [...list];
}

export function generateCustomId() {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
