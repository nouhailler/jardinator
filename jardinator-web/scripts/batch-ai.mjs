/**
 * batch-ai.mjs — Pré-génère les données IA (conseils, consommation, profil, historique)
 * pour toutes les plantes Jardinator en appelant l'API OpenRouter.
 *
 * Usage :
 *   node scripts/batch-ai.mjs --key sk-or-v1-xxx --model qwen/qwen-2.5-7b-instruct:free
 *
 * Options :
 *   --key       Clé API OpenRouter (obligatoire)
 *   --model     ID modèle OpenRouter (obligatoire, ex: qwen/qwen-2.5-7b-instruct:free)
 *   --panels    Panneaux séparés par virgule (défaut: advice,consumption,profile,history)
 *   --limit     Nb max de requêtes par run (défaut: 50)
 *   --delay     Délai en ms entre requêtes (défaut: 3500)
 *   --output    Fichier bundle final (défaut: scripts/batch-ai-output.json)
 *   --progress  Fichier de progression (défaut: scripts/batch-ai-progress.json)
 *
 * Relancez la même commande pour reprendre là où vous vous étiez arrêté.
 * Quand c'est terminé (ou entre deux runs), importez le fichier output dans
 * Jardinator via le bouton 📂 Importer.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, '..', 'src', 'data');
const API_URL   = 'https://openrouter.ai/api/v1/chat/completions';

// ── CLI args ──────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    key:      '',
    model:    '',
    panels:   ['advice', 'consumption', 'profile', 'history'],
    limit:    50,
    delay:    3500,
    output:   join(__dirname, 'batch-ai-output.json'),
    progress: join(__dirname, 'batch-ai-progress.json'),
  };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--key':      opts.key     = args[++i]; break;
      case '--model':    opts.model   = args[++i]; break;
      case '--panels':   opts.panels  = args[++i].split(',').map(s => s.trim()); break;
      case '--limit':    opts.limit   = parseInt(args[++i]); break;
      case '--delay':    opts.delay   = parseInt(args[++i]); break;
      case '--output':   opts.output  = args[++i]; break;
      case '--progress': opts.progress = args[++i]; break;
    }
  }
  return opts;
}

// ── Chargement des plantes ────────────────────────────────────────────────────

function loadPlants() {
  const legumes = JSON.parse(readFileSync(join(DATA_DIR, 'legumes.json'), 'utf8'));
  const extra   = JSON.parse(readFileSync(join(DATA_DIR, 'plantes_extra.json'), 'utf8'));
  return [...legumes, ...extra].map((raw, i) => ({
    id:        i + 1,
    name:      raw.nom,
    nameLatin: raw.nom_latin || '',
    family:    raw.famille  || '',
  }));
}

// ── Prompts (identiques aux services de l'application) ───────────────────────

function buildAdvicePrompt(plant) {
  return `Fais un résumé pratique et structuré sur la meilleure manière de cultiver : ${plant.name}\n\nRéponds en français pour un jardinier amateur. Organise ta réponse avec ces sections : préparation du sol, semis/plantation, entretien, arrosage, maladies fréquentes, et récolte.`;
}

function buildHistoryPrompt(plant) {
  const latin = plant.nameLatin ? ` (${plant.nameLatin})` : '';
  return `Tu es un historien botaniste. Rédige une fiche historique sur la plante "${plant.name}"${latin} en français.

Utilise ce plan en 5 sections avec des titres markdown (##) :

## 🌍 Origine géographique
Berceau d'origine : région, pays ou continent. Sois précis.

## 📜 Premières cultures connues
Époque et civilisation des premières cultures. Cite des dates ou siècles précis si connus.

## 🚢 Introduction en Europe
Quand et comment elle est arrivée en Europe, par qui. Si la plante est européenne de souche, explique son histoire sur le continent. Si elle ne pousse pas en Europe, indique son introduction dans les régions où elle est cultivée.

## 🔬 Étymologie du nom
Origine du nom commun et du nom latin.

## 📚 Anecdotes historiques
Deux ou trois faits marquants ou peu connus sur cette plante à travers l'histoire.

Rédige en paragraphes clairs, avec des dates précises. Évite les tableaux complexes.`;
}

function buildConsumptionPrompt(plant) {
  return `JSON valide UNIQUEMENT. Pas de markdown, pas de commentaire, pas de tiret (-) ni d'astérisque devant les clés JSON. Toutes les accolades { } correctement fermées.
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

function buildProfilePrompt(plant) {
  return `JSON valide UNIQUEMENT. Pas de markdown, pas de commentaire, pas de tiret devant les clés. Toutes les accolades { } correctement fermées.
Sois concis : 1-2 phrases par texte. Infos manquantes → "Information manquante" ou [] ou {}.

Plante : ${plant.name} (${plant.nameLatin || '?'}, famille ${plant.family || '?'})
Expert en botanique, nutrition, biochimie végétale, pharmacognosie, aromathérapie, médecine traditionnelle.

Schéma (remplace NOM par le vrai nom de l'élément) :
{"profil_complet":{"nom_commun":"","nom_latin":"","famille":"","profil_sensoriel":{"gout":"saveurs perçues (sucré, acide, amer, umami, piquant, astringent)","texture":"texture en bouche","arome":"odeurs caractéristiques","particularites":"notes selon préparation (cru, cuit, fermenté)"},"profil_nutritionnel":{"oligoelements":{"NOM":{"quantite":"Xmg/100g","role":"fonction dans l'organisme"}},"vitamines":{"NOM":{"quantite":"Xµg/100g","role":"fonction dans l'organisme"}},"acides_gras":{"type":"Saturés/Monoinsaturés/Polyinsaturés","detail":"acides gras spécifiques (oméga-3, oméga-6...)"},"proteines":{"quantite":"Xg/100g","acides_amines_essentiels":[],"profil":"qualité (complète/incomplète, acide aminé limitant)"},"glucides":{"quantite_totale":"Xg/100g","fibres":"Xg/100g","sucres_simples":"Xg/100g (types)"}},"molecules_bioactives":{"NOM":{"type":"famille biochimique (flavonoïde, alcaloïde, terpène...)","bienfaits":"effet santé documenté","particularite":"absorption, interaction, stabilité"}},"usages_pharmacopee":{"pharmacopee_traditionnelle":{"traditions":[],"usages":[],"parties_utilisees":[]},"medecine_douce":{"approches":[],"usages":[]},"huiles_essentielles":{"produit":"HE disponible ou absence","usages_aromatherapie":"propriétés principales"}},"actions_metaboliques":{"action_generale":[],"action_sur_le_cerveau":[],"particularites_metaboliques":"spécificités d'absorption, chronobiologie"},"avertissement":""}}

Toutes les valeurs en français. Remplis chaque section avec les données connues.`;
}

// ── Appel API OpenRouter (sans streaming) ─────────────────────────────────────

async function callAPI(key, model, prompt, maxTokens) {
  const res = await fetch(API_URL, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type':  'application/json',
      'HTTP-Referer':  'https://jardinator.netlify.app',
      'X-Title':       'Jardinator',
    },
    body: JSON.stringify({
      model,
      messages:   [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 429) throw new Error('RATE_LIMIT');
    if (res.status === 401) throw new Error('BAD_KEY');
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Programme principal ───────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  if (!opts.key) {
    console.error('❌ Clé API manquante. Ajoutez --key sk-or-v1-xxx');
    process.exit(1);
  }
  if (!opts.model) {
    console.error('❌ Modèle manquant. Ajoutez --model qwen/qwen-2.5-7b-instruct:free');
    process.exit(1);
  }

  const validPanels = ['advice', 'consumption', 'profile', 'history'];
  const panels = opts.panels.filter(p => validPanels.includes(p));
  if (!panels.length) {
    console.error('❌ Aucun panneau valide. Valeurs possibles :', validPanels.join(', '));
    process.exit(1);
  }

  const plants = loadPlants();

  // Charge la progression existante
  let progress = { done: {}, advice: {}, consumption: {}, profile: {}, history: {} };
  if (existsSync(opts.progress)) {
    try {
      progress = JSON.parse(readFileSync(opts.progress, 'utf8'));
      const n = Object.keys(progress.done).length;
      console.log(`📂 Progression chargée : ${n} déjà complété(s)`);
    } catch {
      console.warn('⚠️  Fichier de progression illisible — on repart de zéro');
    }
  }

  const panelCfg = {
    advice:      { maxTokens: 2048, getKey: p => String(p.id), buildPrompt: buildAdvicePrompt },
    consumption: { maxTokens: 4096, getKey: p => String(p.id), buildPrompt: buildConsumptionPrompt },
    profile:     { maxTokens: 4096, getKey: p => String(p.id), buildPrompt: buildProfilePrompt },
    history:     { maxTokens: 4096, getKey: p => p.name,       buildPrompt: buildHistoryPrompt },
  };

  const totalNeeded = plants.length * panels.length;
  const alreadyDone = Object.keys(progress.done).filter(k => {
    const panel = k.split(':')[1];
    return panels.includes(panel);
  }).length;

  console.log(`🌿 ${plants.length} plantes × ${panels.length} panneau(x) = ${totalNeeded} requêtes au total`);
  console.log(`✅ Déjà faits : ${alreadyDone}  |  Restants : ${totalNeeded - alreadyDone}`);
  console.log(`🔢 Ce run    : max ${opts.limit} requêtes  |  délai ${opts.delay}ms`);
  console.log(`🤖 Modèle    : ${opts.model}`);
  console.log('─'.repeat(60));

  let requestCount = 0;
  let successCount = 0;
  let errorCount   = 0;
  let limitReached = false;

  outer:
  for (const plant of plants) {
    for (const panel of panels) {
      const doneKey  = `${plant.id}:${panel}`;
      if (progress.done[doneKey]) continue;  // déjà fait

      if (requestCount >= opts.limit) {
        limitReached = true;
        break outer;
      }

      const cfg      = panelCfg[panel];
      const prompt   = cfg.buildPrompt(plant);
      const storeKey = cfg.getKey(plant);

      const label = `[${plant.id}/${plants.length}] ${plant.name} → ${panel}`;
      process.stdout.write(`${label}... `);

      let retries = 0;
      let ok = false;
      while (retries <= 2) {
        try {
          const content = await callAPI(opts.key, opts.model, prompt, cfg.maxTokens);
          if (!content) throw new Error('Réponse vide');

          progress[panel][storeKey] = content;
          progress.done[doneKey]    = true;
          writeFileSync(opts.progress, JSON.stringify(progress));
          requestCount++;
          successCount++;
          console.log('✅');
          ok = true;
          break;
        } catch (err) {
          if (err.message === 'RATE_LIMIT') {
            retries++;
            const wait = retries * 30_000;
            process.stdout.write(`\n   ⏳ Rate limit — attente ${wait / 1000}s (tentative ${retries}/3)... `);
            await sleep(wait);
          } else {
            requestCount++;
            errorCount++;
            console.log(`❌ ${err.message}`);
            break;
          }
        }
      }
      if (!ok && retries > 2) {
        requestCount++;
        errorCount++;
        console.log('❌ Abandon après 3 tentatives');
      }

      if (requestCount < opts.limit) {
        await sleep(opts.delay);
      }
    }
  }

  // Génère le bundle importable
  const bundle = {
    _jardinator:          true,
    _version:             4,
    _date:                new Date().toISOString(),
    customPlants:         [],
    gardenBeds:           [],
    cropHistory:          {},
    favorites:            [],
    images:               {},
    advice:               progress.advice,
    history:              progress.history,
    gardenAiHistory:      [],
    diagnosticHistory:    [],
    identificationHistory:[],
    yields:               {},
    compost:              {},
    treatments:           [],
    consumption:          progress.consumption,
    profile:              progress.profile,
  };
  writeFileSync(opts.output, JSON.stringify(bundle, null, 2));

  // Résumé
  const totalDone = Object.keys(progress.done).filter(k => {
    const panel = k.split(':')[1];
    return panels.includes(panel);
  }).length;

  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Succès ce run   : ${successCount}`);
  console.log(`❌ Erreurs ce run  : ${errorCount}`);
  console.log(`📊 Total complétés : ${totalDone}/${totalNeeded} (${Math.round(totalDone / totalNeeded * 100)}%)`);
  console.log('');
  console.log(`💾 Progression  → ${opts.progress}`);
  console.log(`📦 Bundle       → ${opts.output}`);
  console.log('');

  if (limitReached || totalDone < totalNeeded) {
    console.log('➡️  Pour continuer  : relancez la même commande');
  } else {
    console.log('🎉 Toutes les plantes sont traitées !');
  }
  console.log('➡️  Pour importer   : Jardinator → 📂 Importer →', opts.output.split('/').pop());
}

main().catch(err => {
  console.error('\n❌ Erreur fatale :', err.message);
  process.exit(1);
});
