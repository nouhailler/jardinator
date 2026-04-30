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
  return `Réponds UNIQUEMENT avec le JSON brut ci-dessous, sans balises markdown, sans bloc de code, sans commentaire avant ou après. Commence directement par { et termine par }.

Tu es un expert en botanique, toxicologie alimentaire, nutrition humaine et diététique spécialisée (FODMAPs pour SIBO, candidose chronique, syndrome de l'intestin irritable). Ta tâche est de générer un bloc d'information structuré sur la sécurité de consommation de la plante suivante :

- Nom commun : ${plant.name}
- Nom latin : ${plant.nameLatin || 'non renseigné'}
- Famille botanique : ${plant.family || 'non renseignée'}

Si une information est inconnue, utilise "Information manquante" ou []. Pour les grammages, donne des estimations prudentes basées sur les données Monash University et la littérature diététique.

Retourne exactement ce schéma JSON complété :

{
  "consommation": {
    "parties_comestibles": ["liste des parties consommables : fruit, feuille, racine, tige, fleur, graine…"],
    "parties_toxiques": ["liste des parties à éviter, avec explication entre parenthèses si nécessaire"],
    "allergies_croisees": ["allergies croisées connues : pollens, latex, autres aliments de la même famille…"],
    "composes_preoccupants": {
      "nom du composé": "explication courte : nature, seuil de risque, population à risque"
    },
    "fodmaps": {
      "contient_fodmaps": true,
      "types_fodmaps": ["parmi : fructose, lactose, fructanes, galacto-oligosaccharides (GOS), polyols (sorbitol, mannitol)"],
      "niveau_global": "haut",
      "seuil_tolerance": {
        "portion_safe": "XX g (description si utile — phase élimination stricte, personnes très sensibles)",
        "portion_moderee": "XX g (phase réintroduction, la plupart des personnes sensibles)",
        "portion_limite": "XX g (dose maximale absolue — ne pas dépasser)",
        "unite": "g"
      },
      "recommandations_specifiques": "Conseils pratiques pour réduire l'impact FODMAPs : cuisson, partie consommée, associations alimentaires, préparation.",
      "alternatives_low_fodmap": ["noms communs de plantes du même usage culinaire sans FODMAPs significatifs"]
    },
    "preparation": "Indications sur la nécessité de cuire, tremper, éplucher, fermenter, blanchir, etc. avant consommation.",
    "contre_indications": ["conditions médicales où la consommation est déconseillée ou nécessite une surveillance médicale"],
    "risques_pollution": "Risques d'accumulation de nitrates, métaux lourds, pesticides ou polluants atmosphériques propres à cette plante.",
    "conservation": "Conseils de conservation optimale pour éviter la dégradation nutritionnelle et les risques sanitaires (température, durée, contenant).",
    "quantite_recommandee": "Dose journalière ou fréquence conseillée pour une personne adulte en bonne santé.",
    "avertissement_general": "Ces informations sont fournies à titre indicatif et ne remplacent pas l'avis d'un professionnel de santé ou d'un diététicien."
  }
}

Instructions pour la section fodmaps :
- "contient_fodmaps" : true si la plante en contient en quantité significative, false sinon.
- "types_fodmaps" : liste uniquement les types réellement présents dans cette plante.
- "niveau_global" : "haut", "moyen", "bas" ou "nul" (si aucun FODMAP).
- "seuil_tolerance" : si niveau_global est "nul", mets "Non applicable" pour les trois portions.
- "recommandations_specifiques" et "alternatives_low_fodmap" : obligatoires même si niveau est "bas" ou "nul".

Utilise le français pour toutes les valeurs textuelles. Le JSON doit être valide et complet.`;
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
