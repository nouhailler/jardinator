# Jardinator — Contexte technique (2026-06-03)

## Vue d'ensemble

Application web de gestion du potager, convertie de PyQt6 vers React. Déployée sur Netlify en PWA installable. Dev sur `localhost:5173`.

- **Stack** : React 19, Vite 7, Zustand, CSS vanilla (pas de framework UI)
- **Repo** : `main` branch → déploiement automatique Netlify sur push
- **Dev** : `cd jardinator-web && npm run dev`
- **Build** : `npm run build` (chunks : vendor / zustand / markdown / index ~720 kB)

---

## Structure des sources (`jardinator-web/src/`)

### Données (`data/`)
11 fichiers JSON statiques bundlés à la compilation :
`legumes.json`, `plantes_extra.json`, `associations.json`, `distances.json`, `groupes.json`, `infos_complementaires.json`, `semis.json`, `sol_compost.json`, `sous_varietes.json`, `types_semis.json`, `plant_images.json`

### Store (`store/useStore.js`)
Zustand unique. État global : `plants`, `selectedPlant`, `favorites`, `imageOverrides`, `savedAdvice`, `savedConsumption`, `savedProfile`, `savedHistory`, `gardenBeds`, `cropHistory`, `customPlants`, `diagnosticHistory`, `identificationHistory`, `chatHistory`.

`init()` charge tout depuis localStorage au démarrage. `_recompute()` recalcule la liste filtrée — doit être appelé APRÈS les `set({...})`, pas avant (bug passé : favorites vides si `_recompute` trop tôt).

### Services (`services/`)

| Fichier | Rôle | localStorage key |
|---|---|---|
| `aiService.js` | OpenRouter streaming, conseils culture, liste modèles libres, `orStream()`, `checkApiKey()`, `testModel()` | `jardinator_openrouter_key`, `jardinator_ai_advice`, `jardinator_free_models_cache` |
| `logService.js` | Pub/sub log IA en mémoire (`addLog`, `subscribeLogs`, `clearLogs`, 150 entrées max) | — (mémoire session) |
| `ollamaService.js` | Ollama local streaming, chat | — |
| `consumptionService.js` | Prompt FODMAPs/nutrition/sécurité, storage, `repairJson` | `jardinator_consumption` |
| `profileService.js` | Prompt profil complet (sensoriel/nutritionnel/médicinal/métabolique), storage, `repairJson` | `jardinator_profile` |
| `vegetableService.js` | Fusion 11 JSON → plantes normalisées, filtrage | — |
| `imageService.js` | Surcharges d'images utilisateur | `jardinator_images_v2` |
| `gardenService.js` | Plan potager (planches, cellules, historique cultural) | `jardinator_garden_beds`, `jardinator_crop_history` |
| `favoritesService.js` | Favoris | `jardinator_favorites` |
| `historyService.js` | Historique culture IA | `jardinator_plant_history` |
| `diagnosticService.js` | Diagnostics phytosanitaires IA | `jardinator_diagnostic_history` |
| `identificationService.js` | Identifications de plantes par photo IA | `jardinator_identification_history` |
| `customPlantsService.js` | Fiches plantes personnalisées | `jardinator_custom_plants` |
| `inputsService.js` | Compost et traitements | `jardinator_compost`, `jardinator_treatments` |
| `yieldService.js` | Rendements | `jardinator_yields` |
| `plantPdfService.js` | Export PDF fiche plante | — |
| `icsService.js` | Export calendrier ICS | — |
| `weatherService.js` | Météo (API externe) | — |

### Composants (`components/`)

**Fiche plante (`DetailModal.jsx`)** — modal principale. Boutons dans l'en-tête :
- ★ Favori
- 📜 Historique → `HistoryPanel` (origine/histoire de la plante via IA)
- 📋 Conseil IA → `AdvicePanel` (conseils de culture sauvegardés)
- 🍽 Consommation → `ConsumptionPanel` (badge vert si données sauvegardées)
- 🌿 Profil → `ProfilePanel` (badge vert si données sauvegardées)
- ✨ IA → `GeminiPanel` (génère les conseils de culture en texte markdown)
- 📄 PDF

**Panels IA — pattern commun** : overlay/panel, provider toggle (OpenRouter / Ollama), status `idle → loading → done/error`, sauvegarde par `plant.id` en localStorage, 💾 / ✅ / 🗑 footer.

| Panel | Type de réponse | Affichage |
|---|---|---|
| `GeminiPanel` | Texte markdown | `renderMarkdown()` maison |
| `ConsumptionPanel` | JSON structuré | `ConsumptionView` (FODMAPs, nutrition, sécurité, conservation) |
| `ProfilePanel` | JSON structuré | `ProfileView` (sensoriel, nutritionnel, médicinal, métabolique) |
| `HistoryPanel` | Texte markdown | idem GeminiPanel |
| `DiagnosticPanel` | Mixte | — |
| `IdentificationPanel` | Mixte | — |

**Autres composants** :
- `CardGrid` / `VegetableCard` : grille filtrée
- `GardenPlanner` : plan potager drag-and-drop
- `CalendarView` : vue calendrier
- `ExportImport` : export/import JSON v4 (toutes données). Case **🔒** (`protectExisting`, activée par défaut) — à l'import, skip les clés déjà présentes en localStorage pour `advice`, `history`, `consumption`, `profile`.
- `MeteoWidget` : widget météo — `WeatherAiSection` contient un panneau de diagnostic inline (logs locaux, s'ouvre automatiquement en cas d'erreur)
- `OllamaChat` : chat libre avec Ollama
- `SettingsPanel` : config API, Ollama, zone climatique — boutons **🔑 Vérifier la clé**, **🧪 Tester le modèle**, panneau **📋 Journal IA** (abonné à `logService`)
- `HelpTip` : tooltip `?` sur les sections de la fiche plante
- `NewPlantModal` : création/édition de fiches personnalisées

---

## Logique IA

### Providers
- **OpenRouter** (`aiService.js`) : modèles gratuits, streaming SSE. Clé `sk-or-v1-…` en localStorage. Cache modèles 1h.
- **Ollama** (`ollamaService.js`) : LLM local, URL + modèle configurables dans Paramètres.

### Fonctions de streaming
```
orStream(prompt, maxTokens)      → point d'entrée unique OpenRouter texte (clé+modèle lus en localStorage)
askAIStream(plantName)           → conseils culture (texte)
askAIStreamChat(question)        → chat libre (texte)
askConsumptionStreamOR(prompt)   → JSON consommation/profil (max_tokens 4096)
askOllamaStream(prompt, url, m)  → générique Ollama
```

`weatherService`, `yieldService` et `gardenAnalysisService` délèguent à `orStream()`. `diagnosticService` et `identificationService` conservent leur propre implémentation (messages multipart avec image).

**Détection erreur in-stream** : OpenRouter peut renvoyer HTTP 200 avec `{"error": {...}}` dans les chunks SSE. `_stream()` vérifie `chunk.error` et lève une exception — évite les silences inattendus.

### Repair JSON (`repairJson` — dans consumptionService et profileService)
Pipeline de corrections appliqué quand `JSON.parse` échoue :
1. Tirets markdown avant clés : `, -"key":` → `, "key":`
2. Parenthèses parasites : `}),` → `},`
3. Guillemet ouvrant manquant : `, key":` → `, "key":`
4. Accolades non fermées (`opens > 0`) : ajoute les `}` manquants en fin
5. Accolades en excès (`opens < 0`) : supprime les `}` surnuméraires en fin

Le comptage est **string-aware** (ignore `{` et `}` à l'intérieur des chaînes).

**Détection modèle inadapté** : si la réponse contient des caractères CJK (`/[぀-ヿ一-鿿가-힯]/`), message d'erreur rouge avec suggestions (Qwen2.5-7B, Mistral-7B, Gemma-2-9B).

---

## Schémas JSON IA

### Consommation (`consumptionService.buildConsumptionPrompt`)
Clé racine : `"consommation"`. Champs : `parties_comestibles`, `stade_developpement`, `parties_toxiques`, `allergies_croisees`, `composes_preoccupants`, `fodmaps` (niveau, types, `seuil_tolerance` avec équivalents ménagers), `cueillette` (lieu/réglementation/saisonnalité), `interactions_medicamenteuses`, `populations_sensibles`, `preparation` (6 sous-champs objet), `conservation` (5 sous-champs objet), `contre_indications`, `risques_pollution`, `quantite_recommandee`, `avertissement_general`.

### Profil complet (`profileService.buildProfilePrompt`)
Clé racine : `"profil_complet"`. Champs : `profil_sensoriel` (goût/texture/arôme/particularités), `profil_nutritionnel` (oligoéléments/vitamines avec quantité+rôle, acides_gras, protéines, glucides), `molecules_bioactives` (type/bienfaits/particularité), `usages_pharmacopee` (pharmacopée traditionnelle / médecine douce / huiles essentielles), `actions_metaboliques` (général / cerveau/SNC / particularités), `avertissement`.

---

## Export/Import (v4)

Bundle : `customPlants`, `gardenBeds`, `cropHistory`, `favorites`, `images`, `advice`, `history`, `gardenAiHistory`, `diagnosticHistory`, `identificationHistory`, `yields`, `compost`, `treatments`, `consumption`, `profile`.

Rétrocompatible v2/v3.

**Import non-destructif** : state `protectExisting` (useState, défaut `true`) — pour chaque entrée `advice`/`history`/`consumption`/`profile`, vérifie via `getSaved*()` si une valeur existe déjà avant d'appeler `save*()`. Le message de confirmation détaille importés vs conservés.

---

## Script batch (`scripts/batch-ai.mjs`)

Génère les 4 panneaux IA (advice / consumption / profile / history) pour les 208 plantes via l'API OpenRouter en mode non-streaming.

- **Usage** : `node scripts/batch-ai.mjs --key sk-or-v1-xxx --model qwen/qwen-2.5-7b-instruct:free [--limit 50] [--delay 3500]`
- **Reprise** : progression sauvegardée dans `scripts/batch-ai-progress.json` après chaque requête (clé `"plantId:panel"`). Relancer la même commande continue là où ça s'est arrêté.
- **Sortie** : `scripts/batch-ai-output.json` — bundle v4 importable directement via 📂 Importer (compatible avec le mode 🔒).
- **Clés de stockage** : identiques à l'appli (`String(plant.id)` pour advice/consumption/profile, `plant.name` pour history).
- **Rate limiting** : délai configurable entre requêtes (défaut 3 500 ms), backoff exponentiel sur 429 (30 s / 60 s / 90 s).

---

## PWA / Déploiement

- `vite-plugin-pwa` (Workbox, generateSW), `vite@7`, `@vitejs/plugin-react@4`
- `netlify.toml` : `publish = "jardinator-web/dist"`, `command = "npm run build"`
- Push `main` → déploiement automatique Netlify

---

## Points d'attention

- `_recompute()` doit être appelé APRÈS `set({favorites: loadFavorites()})` dans `init()`.
- Cache modèles OpenRouter TTL 1h ; `clearModelsCache()` force le rechargement.
- `max_tokens: 4096` pour les prompts JSON. Prompt (~300 tokens) + réponse (~800-1200 tokens) tient dans ce budget pour modèles ≥ 7B.
- Modèles OpenRouter fiables pour JSON complexe : `Qwen/Qwen2.5-7B-Instruct`, `mistralai/Mistral-7B-Instruct-v0.3`, `google/gemma-2-9b-it`.
- Les instructions "termine par }}" dans les prompts ont été supprimées — elles poussaient certains modèles à ajouter `}}` en double.

---

## Ergonomie mobile (appliqué 2026-06-01)

Audit complet + corrections appliquées sur `index.css`, `VegetableCard.jsx`, `DetailModal.jsx`, `Header.jsx`, `OllamaChat.jsx`, `NewPlantModal.jsx`, `ImagePicker.jsx`.

### Phase 1 — Quick wins ✅

- Font-size racine `14px` → `16px` (évite le zoom automatique sur les inputs mobiles)
- 10 boutons de fermeture/icônes à `min-width/height: 44px` (`.modal-close`, `.picker-close`, `.meteo-close`, `.gemini-close`, `.help-tip-btn`, `.help-panel-close`, `.np-close`, `.btn-fav-detail`, `.hist-close/.hist-btn-regen/.hist-btn-stop`, `.treat-modal-close`)
- Breakpoints `@media (max-width: 1024px)` (padding 1.25rem) et `@media (max-width: 768px)` (padding 1rem, detail-header colonne, grilles 1 colonne)
- Card grid `minmax(175px)` → `minmax(140px, 1fr)`

### Phase 2 — Composants cassés ✅

- **Garden Planner** : `flex-direction: column` sous 768px — sidebar `max-height: 220px`, panneau droit `max-height: 60vh`, canvas `min-height: 55vh`
- **Meteo panel** : `width: min(460px, 95vw)` (remplace `width: 460px + max-width`)
- **Month grid** : `min-width: 480px` sur header/rows → scroll horizontal garanti ; scroll-shadow CSS ; suppression des règles 640px qui cassaient la grille en colonne
- **OllamaChat** : sidebar masquée sur mobile par défaut, bouton `btn-toggle-history` (`▼ Historique (N)`) dans le chat principal — état `showHistory` (useState)

### Phase 3 — Accessibilité ✅

- `inputMode="decimal"` sur tous les champs `num()` dans `NewPlantModal` ; `type="url" inputMode="url"` sur le champ imageUrl et `ImagePicker`
- `VegetableCard` : `<div onClick>` → `<button type="button">` + CSS `text-align: left; width: 100%`
- `DetailModal` : `role="dialog" aria-modal="true" aria-label={plant.name}` sur `.modal-content`
- `<nav aria-label="Navigation principale">` + `aria-current="page"` sur l'onglet actif
- 6 classes de badges/labels portées à `0.75rem` minimum : `.vcard-badge`, `.vcard-harvest`, `.vcard-latin`, `.month-col-label`, `.vcard-ai-badge`, `.card-custom-badge`

### Correctifs post-audit ✅

- **Hamburger mobile** (`Header.jsx`) : bouton ☰/✕ sous 640px avec drawer animé (8 onglets). États `menuOpen` + `menuRef` ; fermeture clic extérieur / Escape. Desktop inchangé. CSS : `.tabs-mobile`, `.btn-hamburger`, `.tabs-drawer`, `.tabs-drawer-item`. **Point d'attention** : `.tabs` a `overflow-x: auto` sur desktop — sur mobile (`< 640px`) on passe en `overflow: visible` sinon le drawer absolu est coupé par la boîte overflow.
- **Badge "Conseil IA" dupliqué** : suppression de `.vcard-ai-badge::after { content: ' Conseil IA' }` — le texte était déjà dans le JSX.
- **Boutons fiche plante sur mobile** : `.detail-name-row` passe en `flex-direction: column; align-items: stretch` sous 640px → barre d'action pleine largeur, `flex-wrap` distribue les boutons en ~2 rangées sans scroll horizontal. Padding réduit (`5px 10px`, `0.75rem`) sur les 6 boutons d'action.

---

## Header mobile (v2.8.0 — 2026-06-03)

Sur mobile (≤ 640px) le header passe sur **2 lignes** :
- Ligne 1 : `🌱 Jardinator` + `🔍 Rechercher` (FilterDropdown seul dans `header-controls`)
- Ligne 2 : sélecteur de vue (`tab-plant-select`, `flex: 1`) + compteur + `☰`

Les 5 boutons d'action masqués dans `header-controls` migrent dans le **drawer ☰** sous une section « Actions » : Météo, Nouvelle fiche, Agenda, Export/Import, ◉ Démo.

Clic sur la marque → `handlePlantFilter('all')` (retour accueil depuis n'importe quel onglet).

Fix positionnement `.meteo-panel` sur mobile : `left: 0; right: 0; width: auto` (ancrage viewport) + `html, body { overflow-x: hidden }` (empêche le body de grandir et de décaler les éléments `position: fixed`).

---

## Démo cinématique (ajoutée 2026-06-03)

Bouton **◉ Démo** (amber) dans `header-controls` — lance une démo autonome en boucle.

### Composant `DemoMode.jsx`

Overlay `position: fixed; inset: 0; z-index: 9999; pointer-events: none` — transparent, ne bloque pas l'interaction avec l'app. Seul le bouton `✕ Quitter la démo` a `pointer-events: auto`.

**11 phases en boucle**, définies dans le tableau `PHASES` :

| # | Onglet | Cible curseur | Action de fin |
|---|---|---|---|
| 1 | `all` | `.card-grid` | — |
| 2 | `all` | `.filter-dropdown-trigger` | — |
| 3 | `all` | `.vcard` (4e) | `openDetail(plants[3])` |
| 4 | `all` | `.modal-content` | `closeDetail()` |
| 5 | `calendar` | `main` | — |
| 6 | `potager` | `main` | — |
| 7 | `diagnostic` | `main` | — |
| 8 | `identification` | `main` | — |
| 9 | `chat` | `main` | — |
| 10 | `yields` | `main` | — |
| 11 | `all` | `.header-brand` | — |

**Timing par phase** : setTab → +350 ms (DOM) → move cursor + show caption → +duration → hide caption → +330 ms → endAction → +470 ms → phase suivante.

**Curseur** : `position: fixed; top:0; left:0; transform: translate(Xpx, Ypx)` avec `transition: 0.75s cubic-bezier(0.4,0,0.2,1)`. Point ambre (#FFB300) + double anneau en expansion (`animation: demo-ring 1.6s ease-out infinite`, offset 0.8s sur le second). Position calculée via `getBoundingClientRect()` sur le sélecteur DOM de la phase.

**Actions store** : appelées via `useStore.getState()` (accès statique Zustand, stable hors hook) — pas de dépendance au cycle de re-render.

**Éléments UI** : badge `◉ DÉMO` clignotant (top-left), bouton stop (top-right), légende (bottom-center, fade), points de progression amber (bottom-center).

**Nettoyage** (`useEffect` return) : clearTimeout sur tous les timers + `closeDetail()` au cas où la modal serait ouverte.

### Adaptation mobile (v2.8.0)

- Bouton **◉ Démo** déplacé dans le drawer ☰ (texte doré, section séparée)
- Détection `isMobile` (`window.innerWidth <= 640`) → classe `demo-touch` sur le curseur
- **Indicateur de toucher** : cercle 64px (fond doré translucide) + anneau pulsant — remplace le pointeur souris sur mobile
- **Animation tap** (`demo-tapping`) : contraction → expansion 0.45s à chaque changement de cible
- Bouton stop : icône seule (✕), circulaire 44px sur mobile
- Captions : `bottom: 100px` (au-dessus de la barre OS), dots : `bottom: 72px`
- Transition curseur : 0.5s sur mobile (vs 0.75s desktop)
