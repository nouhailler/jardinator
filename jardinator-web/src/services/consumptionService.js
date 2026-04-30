const KEY = 'jardinator_consumption';

// ── Storage ───────────────────────────────────────────────────────────────────

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
  catch { return {}; }
}

export function getSavedConsumption(plantId) {
  return load()[String(plantId)] || null;
}

export function saveConsumption(plantId, jsonStr) {
  const store = load();
  store[String(plantId)] = jsonStr;
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function deleteConsumption(plantId) {
  const store = load();
  delete store[String(plantId)];
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function getAllSavedConsumption() {
  return load();
}

// ── Prompt builder ────────────────────────────────────────────────────────────

export function buildConsumptionPrompt(plant) {
  return `JSON UNIQUEMENT. Pas de markdown, pas de commentaire. Commence par { et termine par }.
Sois concis : 1-2 phrases max par champ texte. Infos manquantes → "" ou [].

Plante : ${plant.name} (${plant.nameLatin || '?'}, famille ${plant.family || '?'})
Expert en toxicologie alimentaire, nutrition, diététique FODMAPs (SIBO, SII, candidose), botanique, pharmacologie végétale.
Données FODMAPs : base Monash University.

Schéma à remplir :
{"consommation":{"parties_comestibles":[],"stade_developpement":"","parties_toxiques":[],"allergies_croisees":[],"composes_preoccupants":{},"fodmaps":{"contient_fodmaps":true,"types_fodmaps":[],"niveau_global":"haut|moyen|bas|nul","seuil_tolerance":{"portion_safe":"Xg","portion_moderee":"Xg","portion_limite":"Xg","unite":"g"},"recommandations_specifiques":"","alternatives_low_fodmap":[]},"cueillette":{"lieu":"","reglementation":"","saisonnalite":""},"interactions_medicamenteuses":"","populations_sensibles":[],"preparation":{"epluchage":"","cru_vs_cuit":"","germination":"","impact_cuisson":"","reduction_antinutriments":"","temps_cuisson_minimal":""},"conservation":{"etat_optimal":"","duree":"","conditions":"","nettoyage":"","etat_visuel":""},"contre_indications":[],"risques_pollution":"","quantite_recommandee":"","avertissement_general":"Ces informations ne remplacent pas un avis médical."}}

Règles :
- composes_preoccupants : vérifier spécifiquement glycoalcaloïdes, lectines, glycosides cyanogènes, oxalates, capsaïcine si présents dans cette plante
- fodmaps.types_fodmaps : valeurs parmi fructose / lactose / fructanes / galacto-oligosaccharides (GOS) / polyols (sorbitol, mannitol)
- fodmaps.niveau_global "nul" → seuil_tolerance = {"portion_safe":"Non applicable","portion_moderee":"Non applicable","portion_limite":"Non applicable","unite":"g"}
- stade_developpement : préciser si la comestibilité varie selon le stade (jeunes pousses, plante mature, etc.)
- cueillette.lieu : zones à éviter (routes, pesticides, métaux lourds) + zones recommandées
- cueillette.reglementation : espèce protégée ? réglementation locale ?
- populations_sensibles : array de strings "Population : précaution spécifique" (femmes enceintes, enfants, immunodéprimés, personnes sous traitement…)
- preparation.reduction_antinutriments : trempage, fermentation, cuisson à l'eau si pertinents
- conservation.etat_visuel : signes visuels de bon état vs dégradation (flétrissement, moisissures, germination…)
- risques_pollution : accumulation de nitrates, métaux lourds, pesticides propre à cette espèce
Toutes les valeurs textuelles en français.`;
}

// ── JSON parser robuste ───────────────────────────────────────────────────────

export function parseConsumptionJson(raw) {
  try { return JSON.parse(raw); } catch {}
  const fenced = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch {} }
  const obj = raw.match(/\{[\s\S]+\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  return null;
}
