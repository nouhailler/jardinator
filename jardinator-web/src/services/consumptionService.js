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
Sois concis : 1 phrase max par champ texte. Infos manquantes → "?" ou [].

Plante : ${plant.name} (${plant.nameLatin || '?'}, famille ${plant.family || '?'})
Expert en toxicologie alimentaire, nutrition, diététique FODMAPs (SIBO, SII, candidose).
Données FODMAPs : base Monash University.

Schéma à remplir :
{"consommation":{"parties_comestibles":[],"parties_toxiques":[],"allergies_croisees":[],"composes_preoccupants":{},"fodmaps":{"contient_fodmaps":true,"types_fodmaps":[],"niveau_global":"haut|moyen|bas|nul","seuil_tolerance":{"portion_safe":"Xg","portion_moderee":"Xg","portion_limite":"Xg","unite":"g"},"recommandations_specifiques":"","alternatives_low_fodmap":[]},"preparation":"","contre_indications":[],"risques_pollution":"","conservation":"","quantite_recommandee":"","avertissement_general":"Ces informations ne remplacent pas un avis médical."}}

Règles FODMAPs :
- types_fodmaps : valeurs exactes parmi fructose / lactose / fructanes / galacto-oligosaccharides (GOS) / polyols (sorbitol, mannitol)
- niveau_global "nul" → portion_safe/moderee/limite = "Non applicable"
- alternatives_low_fodmap : plantes du même usage sans FODMAPs significatifs
Toutes les valeurs textuelles en français.`;
}

// ── JSON parser robuste ───────────────────────────────────────────────────────

export function parseConsumptionJson(raw) {
  // Tentative directe
  try { return JSON.parse(raw); } catch {}
  // Extraire d'un bloc ```json … ```
  const fenced = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch {} }
  // Extraire le premier objet { … } complet
  const obj = raw.match(/\{[\s\S]+\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  return null;
}
