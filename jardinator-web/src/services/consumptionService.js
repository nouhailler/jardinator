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

Règles générales :
- composes_preoccupants : vérifier spécifiquement glycoalcaloïdes, lectines, glycosides cyanogènes, oxalates, capsaïcine si présents
- fodmaps.types_fodmaps : valeurs parmi fructose / lactose / fructanes / galacto-oligosaccharides (GOS) / polyols (sorbitol, mannitol)
- fodmaps.niveau_global "nul" → seuil_tolerance = {"portion_safe":"Non applicable","portion_moderee":"Non applicable","portion_limite":"Non applicable","unite":"g"}
- stade_developpement : préciser si la comestibilité varie selon le stade (jeunes pousses, plante mature, etc.)
- cueillette.lieu : zones à éviter (routes, pesticides, métaux lourds) + zones recommandées
- cueillette.reglementation : espèce protégée ? réglementation locale ?
- populations_sensibles : array de strings "Population : précaution spécifique"
- risques_pollution : accumulation de nitrates, métaux lourds, pesticides propre à cette espèce

Règles de précision (appliquer systématiquement) :
- fodmaps.seuil_tolerance : pour chaque portion, ajouter un équivalent ménager concret entre parenthèses si possible (ex: "30g ≈ 1 petite gousse", "80g ≈ 1 tomate moyenne")
- parties_comestibles : si une partie est techniquement comestible mais avec des réserves (fibreuse, souvent retirée, moins recommandée), préciser la nuance dans l'entrée (ex: "bulbils — comestibles mais fibreux, souvent retirés") plutôt que de la mettre dans parties_toxiques
- preparation.germination : si la germination n'est pas toxique mais indique une perte de qualité, préciser si le germe peut être plus irritant et s'il est conseillé de le retirer selon la sensibilité digestive
- preparation.reduction_antinutriments : toujours préciser le contexte d'usage ("aucune méthode requise pour l'usage culinaire standard", "trempage recommandé pour une consommation quotidienne intense", etc.)
- conservation.nettoyage : si un trempage prolongé doit être évité (perte de composés hydrosolubles, vitamines, arômes), le mentionner explicitement
- conservation.etat_visuel : signes visuels de bon état vs dégradation (flétrissement, moisissures, germination, décoloration) avec indication si la plante reste consommable malgré l'altération (ex: "carotte flétrie : encore comestible mais moins nutritive")
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
