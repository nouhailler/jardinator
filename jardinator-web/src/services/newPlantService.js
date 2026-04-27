import { askOllamaStream, getOllamaUrl, getOllamaModel } from './ollamaService';
import { askAIStreamChat } from './aiService';

// ── Month helpers ─────────────────────────────────────────────────────────────

export const FR_MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

const MONTH_NUM = {
  'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4,
  'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8,
  'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12,
};

export function parseFrMonths(val) {
  if (!val) return [];
  const arr = Array.isArray(val) ? val : String(val).split(',');
  return arr.map(m => m.toLowerCase().trim()).filter(m => FR_MONTHS.includes(m));
}

export function monthsToNumbers(arr) {
  return arr.map(m => MONTH_NUM[m]).filter(Boolean);
}

// ── Stream helpers ────────────────────────────────────────────────────────────

async function collectStream(gen) {
  let out = '';
  for await (const chunk of gen) out += chunk;
  return out.trim();
}

/** Choose the right AI provider: Ollama if configured, else OpenRouter */
async function* autoStream(prompt) {
  const ollamaModel = getOllamaModel();
  if (ollamaModel) {
    yield* askOllamaStream(prompt, getOllamaUrl(), ollamaModel);
  } else {
    yield* askAIStreamChat(prompt);
  }
}

// ── Latin name lookup ─────────────────────────────────────────────────────────

export async function lookupLatinName(commonName) {
  const prompt = `Quel est le nom latin botanique exact de la plante "${commonName}" ? Réponds UNIQUEMENT avec le nom latin scientifique, sans explication ni ponctuation supplémentaire.`;
  try {
    const text = await collectStream(autoStream(prompt));
    return text.replace(/["""*_]/g, '').trim();
  } catch {
    return '';
  }
}

// ── Wikipedia image lookup ────────────────────────────────────────────────────

export async function lookupWikipediaImage(latinName, commonName) {
  const tryFetch = async (query) => {
    try {
      const encoded = encodeURIComponent(query);
      const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encoded}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const pages = Object.values(data.query?.pages || {});
      return pages[0]?.thumbnail?.source || null;
    } catch {
      return null;
    }
  };

  // Try Latin name first (more precise), then French common name
  const img = (await tryFetch(latinName)) || (await tryFetch(commonName));
  return img;
}

// ── AI data generation ────────────────────────────────────────────────────────

const GENERATE_PROMPT = (name, latinName) =>
`Tu es un expert horticole. Génère les données de culture complètes pour "${name}" (${latinName}).

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans texte avant ou après.
Utilise exactement ce format (remplace les valeurs par les données réelles) :

{
  "groupe": "légume-fruit",
  "famille": "Solanacées",
  "description": "Description pratique de 2-3 phrases pour jardinier amateur.",
  "temp_terre_min": 15,
  "temp_terre_max": 28,
  "temp_serre_min": 18,
  "temp_serre_max": 30,
  "mois_plantation": ["avril", "mai"],
  "mois_recolte": ["juillet", "août", "septembre"],
  "semis_interieur": ["février", "mars"],
  "semis_exterieur": [],
  "duree_croissance_jours": 90,
  "exposition": "Plein soleil",
  "arrosage": "Régulier",
  "facilite_germination": "Facile",
  "facilite_culture": "Moyenne",
  "distance_rang_cm": 50,
  "distance_rangs_cm": 60,
  "eclaircissage_cm": null,
  "poquet": false,
  "ligne": true,
  "volee": false,
  "surface": false,
  "type_sol": ["limoneux", "humifère"],
  "compost_type": "Compost mûr",
  "profondeur_semis_cm": 0.5,
  "germination_jours_min": 7,
  "germination_jours_max": 14,
  "hauteur_plants_cm": 100,
  "bisannuelle": false,
  "associations_favorables": ["Basilic", "Carotte"],
  "associations_defavorables": ["Fenouil"],
  "varietes": ["Variété Roma", "Variété Cerise"]
}

Valeurs autorisées pour "groupe": légume-feuille, légume-racine, légume-fruit, légume-bulbe, légume-tige, cucurbitacée, aromatique, légumineuse, condimentaire.
Valeurs autorisées pour "type_sol": argileux, limoneux, sableux, humifère, calcaire.
Valeurs pour "facilite_germination" et "facilite_culture": Facile, Moyenne, Difficile.
Valeurs pour "exposition": Plein soleil, Mi-ombre, Ombre, Plein soleil ou mi-ombre.
Valeurs pour "arrosage": Régulier, Modéré, Abondant, Faible.
Les mois doivent être en français minuscule : janvier, février, mars, avril, mai, juin, juillet, août, septembre, octobre, novembre, décembre.`;

/** Streaming generator — yields JSON text chunks */
export async function* generatePlantDataStream(name, latinName) {
  yield* autoStream(GENERATE_PROMPT(name, latinName));
}

/** Extract and validate JSON from raw AI text */
export function extractJSON(text) {
  // Try to extract a JSON object from the text (handles markdown code blocks too)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Aucun JSON trouvé dans la réponse IA');
  return JSON.parse(jsonMatch[0]);
}

/** Parse AI raw JSON into a normalized form-data object */
export function parseGeneratedData(jsonText, name, latinName) {
  const raw = extractJSON(jsonText);
  return {
    name,
    nameLatin: latinName,
    famille: raw.famille || '',
    groupe: raw.groupe || '',
    description: raw.description || '',
    temp_terre_min: raw.temp_terre_min ?? '',
    temp_terre_max: raw.temp_terre_max ?? '',
    temp_serre_min: raw.temp_serre_min ?? '',
    temp_serre_max: raw.temp_serre_max ?? '',
    mois_plantation: parseFrMonths(raw.mois_plantation),
    mois_recolte: parseFrMonths(raw.mois_recolte),
    semis_interieur: parseFrMonths(raw.semis_interieur),
    semis_exterieur: parseFrMonths(raw.semis_exterieur),
    duree_croissance_jours: raw.duree_croissance_jours ?? '',
    exposition: raw.exposition || '',
    arrosage: raw.arrosage || '',
    facilite_germination: raw.facilite_germination || '',
    facilite_culture: raw.facilite_culture || '',
    distance_rang_cm: raw.distance_rang_cm ?? '',
    distance_rangs_cm: raw.distance_rangs_cm ?? '',
    eclaircissage_cm: raw.eclaircissage_cm ?? '',
    poquet: raw.poquet || false,
    ligne: raw.ligne || false,
    volee: raw.volee || false,
    surface: raw.surface || false,
    type_sol: Array.isArray(raw.type_sol) ? raw.type_sol : [],
    compost_type: raw.compost_type || '',
    profondeur_semis_cm: raw.profondeur_semis_cm ?? '',
    germination_jours_min: raw.germination_jours_min ?? '',
    germination_jours_max: raw.germination_jours_max ?? '',
    hauteur_plants_cm: raw.hauteur_plants_cm ?? '',
    bisannuelle: raw.bisannuelle || false,
    associations_favorables: Array.isArray(raw.associations_favorables) ? raw.associations_favorables : [],
    associations_defavorables: Array.isArray(raw.associations_defavorables) ? raw.associations_defavorables : [],
    varietes: Array.isArray(raw.varietes) ? raw.varietes : [],
    imageUrl: '',
  };
}

/** Empty form data for manual entry */
export function emptyFormData(name = '') {
  return {
    name,
    nameLatin: '',
    famille: '',
    groupe: '',
    description: '',
    temp_terre_min: '',
    temp_terre_max: '',
    temp_serre_min: '',
    temp_serre_max: '',
    mois_plantation: [],
    mois_recolte: [],
    semis_interieur: [],
    semis_exterieur: [],
    duree_croissance_jours: '',
    exposition: '',
    arrosage: '',
    facilite_germination: '',
    facilite_culture: '',
    distance_rang_cm: '',
    distance_rangs_cm: '',
    eclaircissage_cm: '',
    poquet: false,
    ligne: false,
    volee: false,
    surface: false,
    type_sol: [],
    compost_type: '',
    profondeur_semis_cm: '',
    germination_jours_min: '',
    germination_jours_max: '',
    hauteur_plants_cm: '',
    bisannuelle: false,
    associations_favorables: [],
    associations_defavorables: [],
    varietes: [],
    imageUrl: '',
  };
}

/** Convert form data to the normalized plant object used by vegetableService/getAllPlants */
export function formDataToPlant(formData, id) {
  return {
    id,
    name: formData.name.trim(),
    nameLatin: formData.nameLatin.trim(),
    family: formData.famille.trim(),
    groupe: formData.groupe,
    description: formData.description.trim(),
    tempOutdoorMin: formData.temp_terre_min !== '' ? Number(formData.temp_terre_min) : null,
    tempOutdoorMax: formData.temp_terre_max !== '' ? Number(formData.temp_terre_max) : null,
    tempGreenhouseMin: formData.temp_serre_min !== '' ? Number(formData.temp_serre_min) : null,
    tempGreenhouseMax: formData.temp_serre_max !== '' ? Number(formData.temp_serre_max) : null,
    dureeCroissanceJours: formData.duree_croissance_jours !== '' ? Number(formData.duree_croissance_jours) : null,
    exposition: formData.exposition,
    arrosage: formData.arrosage,
    planting: monthsToNumbers(formData.mois_plantation),
    harvest: monthsToNumbers(formData.mois_recolte),
    sowingIndoor: monthsToNumbers(formData.semis_interieur),
    sowingOutdoor: monthsToNumbers(formData.semis_exterieur),
    associations: {
      favorables: formData.associations_favorables,
      defavorables: formData.associations_defavorables,
    },
    distances: {
      distanceRangCm: formData.distance_rang_cm !== '' ? Number(formData.distance_rang_cm) : null,
      distanceRangsCm: formData.distance_rangs_cm !== '' ? Number(formData.distance_rangs_cm) : null,
      eclaircissageCm: formData.eclaircissage_cm !== '' ? Number(formData.eclaircissage_cm) : null,
    },
    typesSemis: {
      poquet: formData.poquet,
      ligne: formData.ligne,
      volee: formData.volee,
      surface: formData.surface,
    },
    sol: {
      typeSol: formData.type_sol,
      compostType: formData.compost_type,
      bisannuelle: formData.bisannuelle,
    },
    sousVarietes: formData.varietes,
    infos: {
      profondeurSemisCm: formData.profondeur_semis_cm !== '' ? Number(formData.profondeur_semis_cm) : null,
      germinationJoursMin: formData.germination_jours_min !== '' ? Number(formData.germination_jours_min) : null,
      germinationJoursMax: formData.germination_jours_max !== '' ? Number(formData.germination_jours_max) : null,
      hauteurPlantsCm: formData.hauteur_plants_cm !== '' ? Number(formData.hauteur_plants_cm) : null,
      faciliteGermination: formData.facilite_germination,
      faciliteCulture: formData.facilite_culture,
    },
    defaultImageUrl: formData.imageUrl || null,
    isCustom: true,
    createdAt: formData.createdAt || new Date().toISOString(),
  };
}

/** Convert a normalized plant back to form data (for editing an existing custom plant) */
export function plantToFormData(plant) {
  return {
    name: plant.name,
    nameLatin: plant.nameLatin || '',
    famille: plant.family || '',
    groupe: plant.groupe || '',
    description: plant.description || '',
    temp_terre_min: plant.tempOutdoorMin ?? '',
    temp_terre_max: plant.tempOutdoorMax ?? '',
    temp_serre_min: plant.tempGreenhouseMin ?? '',
    temp_serre_max: plant.tempGreenhouseMax ?? '',
    mois_plantation: plant.planting.map(n => FR_MONTHS[n - 1]).filter(Boolean),
    mois_recolte: plant.harvest.map(n => FR_MONTHS[n - 1]).filter(Boolean),
    semis_interieur: plant.sowingIndoor.map(n => FR_MONTHS[n - 1]).filter(Boolean),
    semis_exterieur: plant.sowingOutdoor.map(n => FR_MONTHS[n - 1]).filter(Boolean),
    duree_croissance_jours: plant.dureeCroissanceJours ?? '',
    exposition: plant.exposition || '',
    arrosage: plant.arrosage || '',
    facilite_germination: plant.infos?.faciliteGermination || '',
    facilite_culture: plant.infos?.faciliteCulture || '',
    distance_rang_cm: plant.distances?.distanceRangCm ?? '',
    distance_rangs_cm: plant.distances?.distanceRangsCm ?? '',
    eclaircissage_cm: plant.distances?.eclaircissageCm ?? '',
    poquet: plant.typesSemis?.poquet || false,
    ligne: plant.typesSemis?.ligne || false,
    volee: plant.typesSemis?.volee || false,
    surface: plant.typesSemis?.surface || false,
    type_sol: plant.sol?.typeSol || [],
    compost_type: plant.sol?.compostType || '',
    profondeur_semis_cm: plant.infos?.profondeurSemisCm ?? '',
    germination_jours_min: plant.infos?.germinationJoursMin ?? '',
    germination_jours_max: plant.infos?.germinationJoursMax ?? '',
    hauteur_plants_cm: plant.infos?.hauteurPlantsCm ?? '',
    bisannuelle: plant.sol?.bisannuelle || false,
    associations_favorables: plant.associations?.favorables || [],
    associations_defavorables: plant.associations?.defavorables || [],
    varietes: plant.sousVarietes || [],
    imageUrl: plant.defaultImageUrl || '',
    createdAt: plant.createdAt,
  };
}
