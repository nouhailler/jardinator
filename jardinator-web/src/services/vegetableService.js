import legumesData from '../data/legumes.json';
import plantesExtraData from '../data/plantes_extra.json';
import groupesData from '../data/groupes.json';
import semisData from '../data/semis.json';
import typesSemisData from '../data/types_semis.json';
import associationsData from '../data/associations.json';
import distancesData from '../data/distances.json';
import solCompostData from '../data/sol_compost.json';
import sousVarietesData from '../data/sous_varietes.json';
import infosData from '../data/infos_complementaires.json';
import plantImagesData from '../data/plant_images.json';

const MONTH_NAMES = {
  'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4,
  'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8,
  'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12,
};

export const MONTH_LABELS = [
  '', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

export const SEASON_MONTHS = {
  printemps: [3, 4, 5],
  ete: [6, 7, 8],
  automne: [9, 10, 11],
  hiver: [12, 1, 2],
};

function parseFrenchMonths(str) {
  if (!str) return [];
  return str.split(',').map(m => MONTH_NAMES[m.trim()]).filter(Boolean);
}

function parseFrenchMonthArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(m => MONTH_NAMES[m.trim()]).filter(Boolean);
}

let _plants = null;

export function getAllPlants() {
  if (_plants) return _plants;

  const allRaw = [...legumesData, ...plantesExtraData];
  let id = 1;

  _plants = allRaw.map(raw => {
    const name = raw.nom;
    const semis = semisData[name] || {};
    const assoc = associationsData[name] || {};
    const dist = distancesData[name] || {};
    const typesSemis = typesSemisData[name] || {};
    const sol = solCompostData[name] || {};
    const sousVar = sousVarietesData[name] || [];
    const infos = infosData[name] || {};

    return {
      id: id++,
      name,
      nameLatin: raw.nom_latin || '',
      family: raw.famille || '',
      groupe: groupesData[name] || raw.groupe || '',
      description: raw.description || '',
      tempOutdoorMin: raw.temp_terre_min ?? null,
      tempOutdoorMax: raw.temp_terre_max ?? null,
      tempGreenhouseMin: raw.temp_serre_min ?? null,
      tempGreenhouseMax: raw.temp_serre_max ?? null,
      dureeCroissanceJours: raw.duree_croissance_jours || null,
      exposition: raw.exposition || '',
      arrosage: raw.arrosage || '',
      planting: parseFrenchMonths(raw.mois_plantation),
      harvest: parseFrenchMonths(raw.mois_recolte),
      sowingIndoor: parseFrenchMonthArray(semis.semis_interieur),
      sowingOutdoor: parseFrenchMonthArray(semis.semis_exterieur),
      associations: {
        favorables: assoc.favorables || [],
        defavorables: assoc.defavorables || [],
      },
      distances: {
        distanceRangCm: dist.distance_rang_cm || null,
        distanceRangsCm: dist.distance_rangs_cm || null,
        eclaircissageCm: dist.eclaircissage_cm || null,
      },
      typesSemis: {
        poquet: typesSemis.poquet || false,
        ligne: typesSemis.ligne || false,
        volee: typesSemis.volee || false,
        surface: typesSemis.surface || false,
      },
      sol: {
        typeSol: sol.type_sol || [],
        compostType: sol.compost_type || '',
        bisannuelle: sol.bisannuelle || false,
      },
      sousVarietes: Array.isArray(sousVar) ? sousVar : [],
      infos: {
        profondeurSemisCm: infos.profondeur_semis_cm || null,
        germinationJoursMin: infos.germination_jours_min || null,
        germinationJoursMax: infos.germination_jours_max || null,
        hauteurPlantsCm: infos.hauteur_plants_cm || null,
        faciliteGermination: infos.facilite_germination || '',
        faciliteCulture: infos.facilite_culture || '',
      },
      // Default image from pre-fetched Wikipedia data (can be overridden per-user)
      defaultImageUrl: plantImagesData[name] || null,
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  return _plants;
}

export function getGroupes() {
  const plants = getAllPlants();
  return [...new Set(plants.map(p => p.groupe).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
}

export function getFamilies() {
  const plants = getAllPlants();
  return [...new Set(plants.map(p => p.family).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
}

export function getPlantById(id) {
  return getAllPlants().find(p => p.id === id) || null;
}

export function filterPlants({ plants = null, search = '', groupe = '', family = '', tab = 'all' }) {
  let list = plants || getAllPlants();

  // Tab filter
  const now = new Date().getMonth() + 1;
  if (tab === 'now') {
    list = list.filter(p =>
      p.planting.includes(now) || p.sowingIndoor.includes(now) || p.sowingOutdoor.includes(now)
    );
  } else if (tab in SEASON_MONTHS) {
    const months = SEASON_MONTHS[tab];
    list = list.filter(p =>
      months.some(m => p.planting.includes(m) || p.sowingOutdoor.includes(m))
    );
  }

  // Group filter
  if (groupe) list = list.filter(p => p.groupe === groupe);

  // Family filter
  if (family) list = list.filter(p => p.family === family);

  // Search filter
  if (search.trim()) {
    const q = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    list = list.filter(p => {
      const haystack = [p.name, p.nameLatin, p.family]
        .join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return haystack.includes(q);
    });
  }

  return list;
}

export function getByMonth(month) {
  const plants = getAllPlants();
  return {
    sowingIndoor: plants.filter(p => p.sowingIndoor.includes(month)),
    sowingOutdoor: plants.filter(p => p.sowingOutdoor.includes(month)),
    planting: plants.filter(p => p.planting.includes(month)),
    harvest: plants.filter(p => p.harvest.includes(month)),
  };
}

export const GROUPE_COLORS = {
  'légume-feuille': '#4CAF50',
  'légume-racine': '#FF8F00',
  'légume-fruit': '#E53935',
  'légume-bulbe': '#7B1FA2',
  'légume-tige': '#00838F',
  'cucurbitacée': '#F57F17',
  'aromatique': '#2E7D32',
  'légumineuse': '#1565C0',
  'condimentaire': '#6A1B9A',
};

export const ACTIVITY_COLORS = {
  sowingIndoor: { bg: '#E3F2FD', border: '#42A5F5', label: '💡 Semis intérieur', dot: '#1976D2' },
  sowingOutdoor: { bg: '#FFF8E1', border: '#FFA726', label: '🌤 Semis extérieur', dot: '#F57C00' },
  planting: { bg: '#E8F5E9', border: '#66BB6A', label: '🌱 Plantation', dot: '#388E3C' },
  harvest: { bg: '#FFEBEE', border: '#EF5350', label: '🍅 Récolte', dot: '#C62828' },
};
