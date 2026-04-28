# CONTEXT.md — État du projet Jardinator

> Fichier de reprise pour les sessions Claude. Mis à jour le 2026-04-28.

---

## 🗺️ Vue d'ensemble

Jardinator est un calendrier de jardinage. Le projet contient **deux versions** :

| Version | Technologie | Statut |
|---------|-------------|--------|
| **Web** (`jardinator-web/`) | React 19 + Vite 8 + Zustand 5 | ✅ Version principale, active |
| **Desktop** (racine) | Python 3 + PyQt6 | ✅ Stable, legacy |

La version web est la cible de développement actuel. Le `.deb` v2.4.1 **package l'app React** via un lanceur Python HTTP + navigateur.

---

## 🏗️ Architecture web (version active)

### Stack
- **React 19** + **Vite 8** — SPA 100% front-end, aucun backend
- **Zustand 5** — état global
- **Open-Meteo API** — météo temps réel (gratuite, sans clé)
- **OpenRouter API** — IA en streaming SSE (conseils, historique, fiches)
- **Ollama API** — IA locale en streaming NDJSON
- **Wikimedia Commons API** — recherche d'images + lookup Wikipedia

### Démarrage dev
```bash
cd jardinator-web
npm install
npm run dev   # → http://localhost:5173
```

Le `vite.config.js` lit `process.env.PORT` pour la compatibilité avec le preview Claude.

### Build de production
```bash
cd jardinator-web
npm run build   # → jardinator-web/dist/
```

---

## 📁 Fichiers clés

```
jardinator-web/src/
├── components/
│   ├── Header.jsx              # Onglets + search + filtres (groupe/famille/zone) + Météo + Export
│   ├── CardGrid.jsx            # Grille de cartes plantes + état vide favoris
│   ├── VegetableCard.jsx       # Carte individuelle (badge IA, étoile favori, tooltip)
│   ├── DetailModal.jsx         # Fiche plante (image, calendrier, 12 sections, PDF, IA, Historique)
│   ├── GeminiPanel.jsx         # Conseils IA OpenRouter/Ollama (streaming)
│   ├── AdvicePanel.jsx         # Lecture conseils sauvegardés
│   ├── HistoryPanel.jsx        # Historique IA plante (streaming, markdown, sauvegarde)
│   ├── NewPlantModal.jsx       # Assistant 5 étapes création fiche personnalisée
│   ├── ImagePicker.jsx         # Wikimedia Commons search + URL custom
│   ├── CalendarView.jsx        # Vue calendrier mensuelle
│   ├── MeteoWidget.jsx         # Météo temps réel (Open-Meteo) + curseurs température
│   ├── GardenPlanner.jsx       # Plan du potager interactif (drag & drop)
│   ├── OllamaChat.jsx          # Chat IA libre (Ollama + OpenRouter)
│   ├── SettingsPanel.jsx       # Configuration Ollama & OpenRouter
│   ├── HelpPanel.jsx           # Aide contextuelle par onglet
│   └── ExportImport.jsx        # Export/import JSON des personnalisations (bundle v3)
├── services/
│   ├── vegetableService.js     # Fusionne JSONs → plants, filterPlants() avec climateZone
│   ├── imageService.js         # CRUD images localStorage + Wikimedia API
│   ├── aiService.js            # OpenRouter streaming + fetchFreeModels (cache 1h)
│   ├── ollamaService.js        # Ollama streaming NDJSON + historique chat
│   ├── weatherService.js       # Open-Meteo API (fetchWeather, searchLocation, getUserLocation)
│   ├── gardenService.js        # CRUD planches de culture + historique rotations
│   ├── customPlantsService.js  # CRUD fiches personnalisées (jardinator_custom_plants)
│   ├── favoritesService.js     # Favoris Set<plantName> (jardinator_favorites)
│   ├── historyService.js       # Historiques IA par plantName (jardinator_plant_history)
│   ├── newPlantService.js      # AI lookup Latin/Wikipedia + génération JSON plante en streaming
│   └── plantPdfService.js      # Génération HTML+CSS → impression PDF fiche individuelle
├── store/
│   └── useStore.js             # Zustand : tout l'état global + init()
└── data/                       # 12 JSON statiques bundlés (220+ plantes + 120 questions IA)
```

---

## 🌿 Base de données plantes

**220+ entrées** (175 légumes + 33 extra + fiches personnalisées utilisateur).

Les fiches personnalisées sont stockées séparément dans `jardinator_custom_plants` (localStorage) et fusionnées à la volée dans `getAllPlants()`.

---

## ✨ Fonctionnalités implémentées

| Fonctionnalité | Composant / Service | Notes |
|----------------|--------------------|----|
| Grille de plantes + fiches | `CardGrid`, `VegetableCard`, `DetailModal` | 12 sections par fiche |
| Onglets saison / mois / calendrier | `Header`, `CalendarView` | |
| Filtres groupe, famille, recherche | `Header` + `filterPlants()` | |
| Filtrage zone climatique | `Header` + `EU_REGIONS` dans vegetableService | 6 régions EU |
| Météo temps réel | `MeteoWidget` + `weatherService.js` | Open-Meteo, sans clé API |
| Conseils IA (streaming) | `GeminiPanel`, `AdvicePanel` | Ollama ou OpenRouter |
| Badge 🤖 sur les miniatures | `VegetableCard` | Aperçu au survol (180 chars) |
| **Historique IA** (streaming + sauvegarde) | `HistoryPanel`, `historyService` | 5 sections, markdown propre |
| **Fiches personnalisées** | `NewPlantModal`, `customPlantsService`, `newPlantService` | Assistant 5 étapes + AI enrichment |
| **Favoris** | `VegetableCard`, `favoritesService`, onglet ⭐ | Étoile sur miniatures + fiches |
| Images personnalisables | `ImagePicker`, `imageService` | Wikimedia + URL custom |
| Export/Import JSON | `ExportImport` | Bundle v3 : images + conseils + historiques |
| **Export PDF par fiche** | bouton dans `DetailModal`, `plantPdfService` | Image + données + conseils IA + historique |
| Plan du potager interactif | `GardenPlanner` | Drag & drop, planches configurables |
| Historique des cultures | `GardenPlanner` + `gardenService` | Par cellule et par année |
| Alertes rotation | `CellPanel` dans GardenPlanner | Associations défavorables N-1 |
| Chat IA libre | `OllamaChat` | Ollama local ou OpenRouter cloud |
| 120 questions suggérées | `OllamaChat` | 20 catégories |

---

## 💾 Clés localStorage

| Clé | Contenu |
|-----|---------|
| `jardinator_images_v2` | Images personnalisées par plante (URL ou data-URL) |
| `jardinator_ai_advice` | Conseils IA sauvegardés par plantId |
| `jardinator_plant_history` | Historiques IA sauvegardés par plantName |
| `jardinator_custom_plants` | Fiches personnalisées créées par l'utilisateur |
| `jardinator_favorites` | Set de noms de plantes favorites (JSON array) |
| `jardinator_openrouter_key` | Clé API OpenRouter |
| `jardinator_ai_model` | Modèle IA OpenRouter sélectionné |
| `jardinator_free_models_cache` | Cache modèles OpenRouter (1h) |
| `jardinator_ollama_url` | URL du serveur Ollama |
| `jardinator_ollama_model` | Modèle Ollama sélectionné |
| `jardinator_chat_history` | Historique du chat IA (questions + réponses datées) |
| `jardinator_garden_beds` | Planches de culture (grilles + plantes) |
| `jardinator_crop_history` | Historique cultures par cellule/année |
| `jardinator_weather` | Cache météo (30 min) |
| `jardinator_location` | Dernière ville météo |

---

## 🔑 Points d'attention techniques

- **IDs plantes** : séquentiels à la volée dans `getAllPlants()` — ne pas supposer qu'ils sont stables entre sessions
- **Fiches custom** : `isCustom: true`, ID préfixé `custom-`, stockées séparément, fusionnées dans `getAllPlants()`
- **Favoris** : clé = `plant.name` (pas l'ID) — résiste aux rechargements où les IDs peuvent changer
- **Historique** : clé = `plant.name`, distincts des conseils IA (clé = `plant.id`)
- **Images** : override utilisateur > `plant.defaultImageUrl` > null. `null` = supprimé intentionnellement
- **OpenRouter** : modèles gratuits dynamiques, `pricing.prompt === '0'`, cache 1h
- **Ollama** : NDJSON sur `/api/chat`, auto-sélectionné si `ollamaModel` configuré
- **HistoryPanel** : utilise `genRef` (compteur) pour éviter l'interleaving de deux streams (React StrictMode)
- **PDF** : génère du HTML+CSS inline dans une nouvelle fenêtre, ouvre `window.print()`. Inclut markdown converti en HTML via `markdownToHtml()` dans `plantPdfService.js`
- **Export bundle v3** : `{ _jardinator: true, _version: 3, images, advice, history }`
- **Garden Planner** : drag & drop natif HTML5, pas de lib externe

---

## 📦 Packaging Debian (v2.4.1)

Le `.deb` v2.4.1 package **la version web React**.

**Structure** :
```
debian/
├── DEBIAN/
│   ├── control        # Métadonnées paquet (version, dépendances)
│   └── postinst       # Script post-install (.desktop + icône)
└── usr/
    ├── bin/jardinator                           # Lanceur (HTTP server + xdg-open)
    ├── lib/jardinator/                          # App React buildée (dist/)
    ├── share/applications/jardinator.desktop    # Entrée menu
    ├── share/pixmaps/jardinator.svg             # Icône SVG
    └── share/doc/jardinator/
        ├── copyright
        └── changelog.gz
```

**Dépendances** : `python3 (>= 3.10), xdg-utils`

**Lanceur** : `python3 -m http.server 8765` sur `127.0.0.1`, puis `xdg-open http://localhost:8765`.

**Build du .deb** :
```bash
cd jardinator-web && npm run build
# Copier dist/ → debian/usr/lib/jardinator/
dpkg-deb --build debian jardinator_X.Y.Z_amd64.deb
```

---

## 🚀 Releases GitHub

| Version | Tag | Contenu |
|---------|-----|---------|
| v1.0.0 | `v1.0.0` | Version Python/PyQt6 desktop originale |
| v2.0.0 | `v2.0.0` | Réécriture React + 35 nouvelles plantes + .deb PyQt6 |
| v2.1.0 | `v2.1.0` | Météo, potager, chat IA, zones climatiques + .deb React |
| v2.2.0 | `v2.2.0` | Nouvelle fiche IA, badge conseil miniature, favoris |
| v2.3.x | `v2.3.x` | HistoryPanel + sauvegarde + export bundle v3 |
| v2.4.1 | `v2.4.1` | Export PDF par fiche (image + données + IA + historique) |

Repo : https://github.com/nouhailler/jardinator

---

## 🐛 Bugs connus / limitations

| Problème | Statut |
|----------|--------|
| localStorage limité ~5MB (images data-URL volumineuses) | ⚠️ Limitation connue |
| Pas de PWA / installation mobile | 💡 Idée future |

---

## 🔮 Idées pour les prochaines sessions

- Progressive Web App (PWA) — installation sur mobile
- Filtrage par zone USDA (en plus des zones EU déjà implémentées)
- Plan potager : export image/PDF de la grille
- Rotation des cultures sur N années avec suggestions automatiques
- Statistiques de rendement par plante
