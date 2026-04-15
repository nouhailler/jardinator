# CONTEXT.md — État du projet Jardinator

> Fichier de reprise pour les sessions Claude. Mis à jour le 2026-04-15.

---

## 🗺️ Vue d'ensemble

Jardinator est un calendrier de jardinage. Le projet contient **deux versions** :

| Version | Technologie | Statut |
|---------|-------------|--------|
| **Web** (`jardinator-web/`) | React 19 + Vite 8 + Zustand 5 | ✅ Version principale, active |
| **Desktop** (racine) | Python 3 + PyQt6 | ✅ Stable, packaging .deb v2.1.0 disponible |

La version web est la cible de développement actuel. Le `.deb` v2.1.0 **package l'app React** (pas PyQt6) via un lanceur Python HTTP + navigateur.

---

## 🏗️ Architecture web (version active)

### Stack
- **React 19** + **Vite 8** — SPA 100% front-end, aucun backend
- **Zustand 5** — état global
- **jsPDF** — export PDF (finalement via impression navigateur)
- **Open-Meteo API** — météo temps réel (gratuite, sans clé)
- **OpenRouter API** — conseils IA en streaming SSE
- **Wikimedia Commons API** — recherche d'images

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
│   ├── Header.jsx          # Onglets + search + filtres (groupe/famille/zone) + PDF + Météo + Export
│   ├── CardGrid.jsx        # Grille de cartes plantes
│   ├── DetailModal.jsx     # Fiche plante complète (image, IA, calendrier, associations…)
│   ├── GeminiPanel.jsx     # Conseils IA OpenRouter (streaming + sélecteur modèle)
│   ├── AdvicePanel.jsx     # Lecture conseils sauvegardés
│   ├── ImagePicker.jsx     # Wikimedia Commons search + URL custom
│   ├── CalendarView.jsx    # Vue calendrier mensuelle
│   ├── MeteoWidget.jsx     # Météo temps réel (Open-Meteo) + curseurs température
│   ├── GardenPlanner.jsx   # Plan du potager interactif (drag & drop)
│   ├── PdfExport.jsx       # Export PDF calendrier annuel (impression navigateur)
│   └── ExportImport.jsx    # Export/import JSON des personnalisations (v2 bundle)
├── services/
│   ├── vegetableService.js # Fusionne 11 JSONs → plants, filterPlants() avec climateZone
│   ├── imageService.js     # CRUD images localStorage + Wikimedia API
│   ├── aiService.js        # OpenRouter streaming + fetchFreeModels (cache 1h)
│   ├── weatherService.js   # Open-Meteo API (fetchWeather, searchLocation, getUserLocation)
│   └── gardenService.js    # CRUD planches de culture + historique rotations (localStorage)
├── store/
│   └── useStore.js         # Zustand : toute la logique d'état + init()
└── data/                   # 11 JSON statiques bundlés
    ├── legumes.json         # 175 légumes
    ├── plantes_extra.json   # 33 aromatiques / céréales / condimentaires
    ├── associations.json
    ├── distances.json
    ├── semis.json
    ├── types_semis.json
    ├── sol_compost.json
    ├── sous_varietes.json
    ├── infos_complementaires.json
    ├── groupes.json
    └── plant_images.json    # URLs images par défaut
```

---

## 🌿 Base de données plantes

**208 entrées** (175 légumes + 33 extra). Derniers ajouts (session 2026-04-13) :

- **Melons** : Charentais, Cantaloup, Galia, Honeydew
- **Asperges** : blanche, violette
- **Betteraves** : jaune, Chioggia
- **Aubergines** : blanche, longue
- **Carottes** : Nantaise, Chantenay, violette
- **Concombres** : mini, de serre
- **Fraise remontante**, **Haricot grimpant**, **Citrouille**
- **Navets** : boule d'or, de Milan
- **Poivrons** : rouge, jaune, corne
- **Pommes de terre** : primeur, à chair ferme, vitelotte
- **Basilics** : thaï, pourpre, citron
- **Céréales** : Blé tendre, Blé dur, Blé noir, Épeautre, Petit épeautre

---

## ✨ Fonctionnalités implémentées

| Fonctionnalité | Composant / Service | Notes |
|----------------|--------------------|----|
| Grille de plantes + fiches | `CardGrid`, `DetailModal` | 12 sections par fiche |
| Onglets saison / mois / calendrier | `Header`, `CalendarView` | |
| Filtres groupe, famille, recherche | `Header` + `filterPlants()` | |
| **Filtrage zone climatique** | `Header` + `EU_REGIONS` dans vegetableService | 6 régions EU |
| **Météo temps réel** | `MeteoWidget` + `weatherService.js` | Open-Meteo, sans clé API |
| Météo → curseurs auto-synchronisés | `MeteoWidget` | |
| Conseils IA | `GeminiPanel`, `AdvicePanel` | OpenRouter, modèles gratuits |
| Images personnalisables | `ImagePicker`, `imageService` | Wikimedia + URL custom |
| Export/Import JSON | `ExportImport` | Bundle v2 : images + conseils |
| **Export PDF calendrier** | `PdfExport` | Impression navigateur, A4 paysage |
| **Plan du potager interactif** | `GardenPlanner` | Drag & drop, planches configurables |
| **Historique des cultures** | `GardenPlanner` + `gardenService` | Par cellule et par année |
| **Alertes rotation** | `CellPanel` dans GardenPlanner | Associations défavorables N-1 |
| **Onglet 🪴 Potager** | `Header` → `GardenPlanner` | |

---

## 💾 Clés localStorage

| Clé | Contenu |
|-----|---------|
| `jardinator_images_v2` | Images personnalisées par plante |
| `jardinator_ai_advice` | Conseils IA sauvegardés |
| `jardinator_openrouter_key` | Clé API OpenRouter |
| `jardinator_model` | Modèle IA sélectionné |
| `jardinator_models_cache` | Cache modèles OpenRouter (1h) |
| `jardinator_garden_beds` | Planches de culture (grilles + plantes) |
| `jardinator_crop_history` | Historique cultures par cellule/année |
| `jardinator_weather` | Cache météo (30 min) |
| `jardinator_location` | Dernière ville météo |

---

## 🔑 Points d'attention techniques

- **IDs plantes** : séquentiels à la volée dans `getAllPlants()` — ne pas supposer qu'ils sont stables
- **Images** : override utilisateur > `plant.defaultImageUrl` > null. `null` = supprimé intentionnellement
- **OpenRouter** : modèles gratuits dynamiques, `pricing.prompt === '0'`, cache 1h
- **Météo** : Open-Meteo entièrement gratuit, pas de clé. Géolocalisation navigateur + recherche ville
- **PDF** : génère une page HTML et ouvre la boîte d'impression du navigateur (pas jsPDF finalement)
- **Garden Planner** : le drag & drop natif HTML5 est utilisé (pas de lib externe)
- **climateZone** dans `filterPlants()` filtre via `plantCompatibleWithRegion()` dans vegetableService

---

## 📦 Packaging Debian (v2.1.0)

Le `.deb` v2.1.0 package **la version web React** (plus la version PyQt6).

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

---

## 🐛 Bugs connus / limitations

| Problème | Statut |
|----------|--------|
| localStorage limité ~5MB (images data-URL volumineuses) | ⚠️ Limitation connue |
| Pas de PWA / installation mobile | 💡 Idée future |

---

## 🚀 Releases GitHub

| Version | Tag | Contenu |
|---------|-----|---------|
| v1.0.0 | `v1.0.0` | Version Python/PyQt6 desktop originale |
| v2.0.0 | `v2.0.0` | Réécriture React + 35 nouvelles plantes + .deb PyQt6 |
| v2.1.0 | `v2.1.0` | 5 nouvelles fonctionnalités + .deb React web packagé |

Repo : https://github.com/nouhailler/jardinator

---

## 🔮 Idées pour les prochaines sessions

- Progressive Web App (PWA) — installation sur mobile
- Filtrage par zone USDA (en plus des zones EU déjà implémentées)
- Plan du potager : export image/PDF de la grille
- Rotation des cultures sur N années avec suggestions automatiques
- Statistiques de rendement par plante
