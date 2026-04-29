const COMPOST_KEY    = 'jardinator_compost';
const TREATMENTS_KEY = 'jardinator_treatments';

export const DEFAULT_WASTE_ITEMS = [
  { id: 'tontes',   label: 'Tontes de gazon',                  type: 'green', quantityKg: 0 },
  { id: 'residus',  label: 'Résidus de récolte',               type: 'green', quantityKg: 0 },
  { id: 'epluch',   label: 'Déchets de cuisine (épluchures)',   type: 'green', quantityKg: 0 },
  { id: 'herbes',   label: 'Mauvaises herbes (sans graines)',   type: 'green', quantityKg: 0 },
  { id: 'feuilles', label: 'Feuilles mortes',                  type: 'brown', quantityKg: 0 },
  { id: 'broyat',   label: 'Broyat de branches',               type: 'brown', quantityKg: 0 },
  { id: 'paille',   label: 'Paille / foin',                    type: 'brown', quantityKg: 0 },
  { id: 'carton',   label: 'Carton / papier journal',          type: 'brown', quantityKg: 0 },
];

// ── Compost ───────────────────────────────────────────────────────────────────

export function loadCompostData() {
  try {
    const raw = JSON.parse(localStorage.getItem(COMPOST_KEY) || 'null');
    if (!raw) return { surfaceM2: '', wasteItems: DEFAULT_WASTE_ITEMS.map(i => ({ ...i })) };
    // Migration: add any new default items that are missing
    const existingIds = new Set(raw.wasteItems.map(i => i.id));
    const missing = DEFAULT_WASTE_ITEMS.filter(i => !existingIds.has(i.id));
    return { ...raw, wasteItems: [...raw.wasteItems, ...missing] };
  } catch {
    return { surfaceM2: '', wasteItems: DEFAULT_WASTE_ITEMS.map(i => ({ ...i })) };
  }
}

export function saveCompostData(data) {
  localStorage.setItem(COMPOST_KEY, JSON.stringify(data));
}

// ── Treatments ────────────────────────────────────────────────────────────────

export function loadTreatments() {
  try { return JSON.parse(localStorage.getItem(TREATMENTS_KEY) || '[]'); }
  catch { return []; }
}

export function saveTreatmentEntry(entry) {
  const list = loadTreatments();
  const idx  = list.findIndex(e => e.id === entry.id);
  if (idx >= 0) list[idx] = entry;
  else list.unshift(entry);
  localStorage.setItem(TREATMENTS_KEY, JSON.stringify(list));
  return list;
}

export function deleteTreatmentEntry(id) {
  const list = loadTreatments().filter(e => e.id !== id);
  localStorage.setItem(TREATMENTS_KEY, JSON.stringify(list));
  return list;
}

export function newTreatmentEntry() {
  return {
    id: `treat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString().slice(0, 10),
    treatment: '',
    target: '',
    dilution: '',
    method: '',
    efficacy: 0,
    notes: '',
  };
}
