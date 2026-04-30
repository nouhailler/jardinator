const KEY = 'jardinator_profile';

// ── Storage ───────────────────────────────────────────────────────────────────

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
  catch { return {}; }
}

export function getSavedProfile(plantId) {
  return load()[String(plantId)] || null;
}

export function saveProfile(plantId, jsonStr) {
  const store = load();
  store[String(plantId)] = jsonStr;
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function deleteProfile(plantId) {
  const store = load();
  delete store[String(plantId)];
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function getAllSavedProfiles() {
  return load();
}

// ── Prompt builder ────────────────────────────────────────────────────────────

export function buildProfilePrompt(plant) {
  return `JSON valide UNIQUEMENT. Pas de markdown, pas de commentaire, pas de tiret devant les clés. Toutes les accolades { } correctement fermées.
Sois concis : 1-2 phrases par texte. Infos manquantes → "Information manquante" ou [] ou {}.

Plante : ${plant.name} (${plant.nameLatin || '?'}, famille ${plant.family || '?'})
Expert en botanique, nutrition, biochimie végétale, pharmacognosie, aromathérapie, médecine traditionnelle.

Schéma (remplace NOM par le vrai nom de l'élément) :
{"profil_complet":{"nom_commun":"","nom_latin":"","famille":"","profil_sensoriel":{"gout":"saveurs perçues (sucré, acide, amer, umami, piquant, astringent)","texture":"texture en bouche","arome":"odeurs caractéristiques","particularites":"notes selon préparation (cru, cuit, fermenté)"},"profil_nutritionnel":{"oligoelements":{"NOM":{"quantite":"Xmg/100g","role":"fonction dans l'organisme"}},"vitamines":{"NOM":{"quantite":"Xµg/100g","role":"fonction dans l'organisme"}},"acides_gras":{"type":"Saturés/Monoinsaturés/Polyinsaturés","detail":"acides gras spécifiques (oméga-3, oméga-6...)"},"proteines":{"quantite":"Xg/100g","acides_amines_essentiels":[],"profil":"qualité (complète/incomplète, acide aminé limitant)"},"glucides":{"quantite_totale":"Xg/100g","fibres":"Xg/100g","sucres_simples":"Xg/100g (types)"}},"molecules_bioactives":{"NOM":{"type":"famille biochimique (flavonoïde, alcaloïde, terpène...)","bienfaits":"effet santé documenté","particularite":"absorption, interaction, stabilité"}},"usages_pharmacopee":{"pharmacopee_traditionnelle":{"traditions":[],"usages":[],"parties_utilisees":[]},"medecine_douce":{"approches":[],"usages":[]},"huiles_essentielles":{"produit":"HE disponible ou absence","usages_aromatherapie":"propriétés principales"}},"actions_metaboliques":{"action_generale":[],"action_sur_le_cerveau":[],"particularites_metaboliques":"spécificités d'absorption, chronobiologie"},"avertissement":""}}

Toutes les valeurs en français. Remplis chaque section avec les données connues.`;
}

// ── JSON parser robuste ───────────────────────────────────────────────────────

function repairJson(raw) {
  let s = raw.replace(/([{,])\s*-+\s*"/g, '$1"');
  s = s.replace(/([}\]])\s*\)\s*([,}])/g, '$1$2');
  // Fix keys missing their opening quote: , key": → , "key":
  s = s.replace(/([{,]\s*)([^"{\[\]\s,][^"]*?)(\s*"(?=\s*:))/g, '$1"$2$3');
  let opens = 0, inStr = false, esc = false;
  for (const ch of s) {
    if (esc) { esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (!inStr) {
      if (ch === '{') opens++;
      else if (ch === '}') opens--;
    }
  }
  if (opens > 0) {
    s = s.replace(/[\]\s,]+$/, '') + '}'.repeat(opens);
  } else if (opens < 0) {
    for (let i = 0; i < -opens; i++) {
      s = s.replace(/}\s*$/, '').trimEnd();
    }
  }
  return s;
}

export function parseProfileJson(raw) {
  try { return JSON.parse(raw); } catch {}
  const fenced = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch {} }
  const obj = raw.match(/\{[\s\S]+\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch {} }
  const repaired = repairJson(raw);
  if (repaired !== raw) {
    try { return JSON.parse(repaired); } catch {}
    const obj2 = repaired.match(/\{[\s\S]+\}/);
    if (obj2) { try { return JSON.parse(obj2[0]); } catch {} }
  }
  return null;
}
