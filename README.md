<div align="center">

<img src="debian/usr/share/pixmaps/jardinator.svg" width="96" height="96" alt="Jardinator"/>

# 🌱 Jardinator

### Calendrier du Jardinier — Planifiez vos semis, plantations et récoltes

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev)
[![Zustand](https://img.shields.io/badge/Zustand-5-FF6B35?style=flat-square)](https://zustand-demo.pmnd.rs)
[![Ollama](https://img.shields.io/badge/IA-Ollama-3B82F6?logo=ollama&logoColor=white&style=flat-square)](https://ollama.com)
[![OpenRouter](https://img.shields.io/badge/IA-OpenRouter-7C3AED?logo=openai&logoColor=white&style=flat-square)](https://openrouter.ai)
[![Open-Meteo](https://img.shields.io/badge/Météo-Open--Meteo-0EA5E9?logo=cloudflare&logoColor=white&style=flat-square)](https://open-meteo.com)
[![Licence MIT](https://img.shields.io/badge/Licence-MIT-22C55E?style=flat-square)](LICENSE)
[![Releases](https://img.shields.io/github/v/release/nouhailler/jardinator?style=flat-square&color=2E7D32&label=Release)](https://github.com/nouhailler/jardinator/releases)

**220+ variétés** de légumes, aromatiques, légumineuses, céréales et condimentaires — **+ fiches personnalisées**  
Accessible depuis n'importe quel navigateur — aucune installation requise

[🚀 Démarrer](#-démarrage-rapide) · [✨ Fonctionnalités](#-fonctionnalités) · [📦 Télécharger le .deb](https://github.com/nouhailler/jardinator/releases/latest) · [🤝 Contribuer](#-contribuer)

</div>

---

## 📸 Aperçu

### Desktop — vue principale

![Vue principale desktop](jardinator-web/docs/screenshots/desktop-main.png)

### Fiche plante

![Fiche détail](jardinator-web/docs/screenshots/desktop-detail.png)

### Calendrier mensuel

![Calendrier de juin](jardinator-web/docs/screenshots/desktop-calendar.png)

<table>
<tr>
<td align="center" width="50%">

**Mobile — Header**

![Header mobile](jardinator-web/docs/screenshots/mobile-header.png)

</td>
<td align="center" width="50%">

**Mobile — Menu ☰**

![Drawer mobile](jardinator-web/docs/screenshots/mobile-drawer.png)

</td>
</tr>
</table>

---

## ✨ Fonctionnalités

<table>
<tr>
<td width="50%">

### 🗓️ Calendrier de culture
Visualisez sur 12 mois les semis intérieur/extérieur, plantations et récoltes. Navigation mois par mois avec mise en évidence du mois en cours.

</td>
<td width="50%">

### 🔍 Recherche & filtres intelligents
Recherche en temps réel par nom, nom latin ou famille. Filtres groupe, famille et **zone climatique européenne** (6 régions), cumulables.

</td>
</tr>
<tr>
<td>

### 🃏 Fiches détaillées complètes
Chaque plante dispose d'une fiche avec **12 sections** : températures, entretien, distances, associations, types de sol, sous-variétés, types de semis…

</td>
<td>

### 🤖 Conseils IA intégrés
Conseils de culture personnalisés via **Ollama** ou **OpenRouter**. Streaming en temps réel, sauvegarde locale, consultation hors-ligne. Badge 🤖 sur les miniatures avec aperçu au survol.

</td>
</tr>
<tr>
<td>

### 🍽 Consommation & FODMAPs
Sur chaque fiche, le bouton **🍽 Consommation** génère une analyse complète : parties comestibles/toxiques, allergies croisées, composés préoccupants, **niveau FODMAPs Monash** avec portions seuils, préparation, conservation, contre-indications. Sauvegardé localement.

</td>
<td>

### 🌿 Profil complet IA
Le bouton **🌿 Profil** génère une fiche approfondie : profil sensoriel (goût, texture, arôme), profil nutritionnel (oligoéléments, vitamines, acides gras), molécules bioactives, usages en pharmacopée traditionnelle et médecine douce, actions métaboliques. Sauvegardé localement.

</td>
</tr>
<tr>
<td>

### 📜 Historique & origine
Sur chaque fiche, le bouton **📜 Historique** génère une fiche historique structurée (origine géographique, premières cultures, introduction en Europe, étymologie, anecdotes). Sauvegardé localement, inclus dans l'export.

</td>
<td>

### ➕ Fiches personnalisées
Créez vos propres fiches plantes via un **assistant 5 étapes** : saisie du nom, enrichissement automatique par IA (nom latin, image Wikipedia), génération des données complètes, édition libre et sauvegarde.

</td>
</tr>
<tr>
<td>

### ⭐ Favoris
Marquez vos plantes favorites avec ⭐. Étoile visible sur les miniatures et les fiches. Onglet **⭐ Favoris** dédié avec compteur. Persisté dans le navigateur.

</td>
<td>

### 📄 Export PDF par fiche
Bouton **📄 PDF** sur chaque fiche — génère un document A4 structuré avec image, toutes les données botaniques, le calendrier coloré, les associations, le **conseil IA** et l'**historique** s'ils ont été sauvegardés.

</td>
</tr>
<tr>
<td>

### 💬 Chat IA libre — Ollama & OpenRouter
Posez n'importe quelle question de jardinage. Choix entre **Ollama** (IA locale, 100 % privé) et **OpenRouter** (cloud gratuit). Réponses en streaming avec rendu **Markdown** complet. Historique automatique daté.

</td>
<td>

### 💡 120 questions suggérées
Bibliothèque de **120 questions prêtes-à-envoyer** classées en 20 catégories (graines, semis, maladies, compost, outils…). Un clic charge la question dans le chat.

</td>
</tr>
<tr>
<td>

### 🪴 Plan du potager interactif
Créez des **planches de culture** avec dimensions personnalisées. Interface **drag & drop** pour placer vos plants. Alertes d'associations défavorables en temps réel sur chaque cellule.

</td>
<td>

### 🌿 Compagnonnage & Biodiversité
**Analyse en temps réel** des associations entre plantes voisines (8 directions). Cellules en conflit surlignées en rouge pulsant. Score de biodiversité 0–100 (espèces, familles, groupes, taux de remplissage, harmonies vs conflits).

</td>
</tr>
<tr>
<td>

### 🤖 Analyse IA du potager
L'IA génère un **bilan complet** de la planche : état général, corrections prioritaires pour chaque conflit, recommandations biodiversité. Fonctionne avec Ollama ou OpenRouter. **Historique** des analyses pour suivre l'évolution dans le temps.

</td>
<td>

### 📅 Historique des cultures & rotations
Enregistrement automatique par cellule et par année. **Alertes de rotation** : détection des mauvaises successions. Notes personnalisées par culture.

</td>
</tr>
<tr>
<td>

### 🌡️ Météo & Agro-météo intelligente
Connecté à **Open-Meteo** (sans clé API). Température actuelle + prévisions 7 jours. **Recommandations IA** adaptées à la météo du jour. **Journal climatique 30 jours** avec détection des événements notables (gel, canicule…).

</td>
<td>

### 🔬 Diagnostic phytosanitaire IA
Importez une photo de plante malade — l'IA identifie **maladies, carences et ravageurs**, propose des **remèdes biologiques**. Historique complet des diagnostics avec images. Compatible modèles vision (LLaVA, GPT-4o…).

</td>
</tr>
<tr>
<td>

### 🌿 Identification de plante
Photo d'une feuille, fleur ou écorce → l'IA retourne **nom commun, nom latin, famille botanique, habitat et usages**. Classement par probabilité si plusieurs espèces sont possibles.

</td>
<td>

### 🌾 Suivi des rendements
Journal de récoltes par plante et par année. **Suggestion IA** pour améliorer les rendements d'une saison à l'autre. Édition inline, navigation multi-années.

</td>
</tr>
<tr>
<td>

### ♻️ Intrants & Compost
**Calculateur de compost** : ratio vert/brun, estimation de la production selon votre surface. **Journal des traitements bio** : purins, décoctions, efficacité perçue (1–5 ⭐). Top traitements agrégés.

</td>
<td>

### 🖼️ Images personnalisables
Recherche intégrée **Wikimedia Commons**, URL personnalisée ou image par défaut. Tout est sauvegardé dans votre navigateur.

</td>
</tr>
<tr>
<td>

### 💾 Export / Import complet
Bundle JSON **v4** : images, conseils IA, historiques, consommation, profil, favoris, plan potager, rendements, traitements — tout en un clic. **Case 🔒** (activée par défaut) : l'import ne remplace jamais vos données existantes. Export agenda **.ics** compatible Google Agenda et Apple Calendar.

</td>
<td>

### ❓ Aide contextuelle
Bouton **?** flottant sur toutes les pages. Panneau latéral dont le contenu s'adapte à l'onglet actif — aide spécifique pour chaque fonctionnalité.

</td>
</tr>
</table>

---

## 🌿 Catalogue des plantes

| Catégorie | Exemples | Nb |
|-----------|---------|:--:|
| 🥕 **Légumes-racines** | Carotte (4 var.), Betterave (3 var.), Navet (3 var.), Radis (4 var.) | 40+ |
| 🍅 **Légumes-fruits** | Tomate (9 var.), Poivron (4 var.), Aubergine (3 var.), Melon (5 var.) | 35+ |
| 🥒 **Cucurbitacées** | Courgette, Concombre (3 var.), Courge (14 var.), Citrouille, Pastèque | 20+ |
| 🥬 **Légumes-feuilles** | Laitue (6 var.), Chou (20 var.), Épinard, Roquette, Mâche | 35+ |
| 🌿 **Aromatiques** | Basilic (4 var.), Menthe, Thym, Persil, Coriandre, Aneth | 15+ |
| 🫘 **Légumineuses** | Haricot (6 var.), Petit pois, Pois mange-tout, Fève, Soja | 12+ |
| 🌾 **Céréales** | Blé tendre, Blé dur, Sarrasin, Épeautre, Petit épeautre | 5 |
| 🌸 **Autres** | Asperge (3 var.), Fraise (2 var.), Artichaut, Topinambour | 20+ |
| ✏️ **Fiches personnalisées** | Créées par l'utilisateur via l'assistant IA | ∞ |

> **220+ entrées** — calendrier, températures, associations, distances, sous-variétés, infos complémentaires. Extensible à l'infini avec les fiches personnalisées.

---

## 🚀 Démarrage rapide

### Version web (recommandée)

**Prérequis** : [Node.js](https://nodejs.org) 18+ · npm 9+

```bash
git clone https://github.com/nouhailler/jardinator.git
cd jardinator/jardinator-web
npm install
npm run dev
# Ouvrez http://localhost:5173
```

### Build de production

```bash
npm run build
# Fichiers générés dans jardinator-web/dist/
# Servez avec nginx, Apache, GitHub Pages, Netlify…
```

---

## 📦 Installation Linux via paquet .deb

Le paquet `.deb` embarque **l'application web complète** (React buildé) et un lanceur local.  
Compatible avec **Debian 11+**, **Ubuntu 22.04+** et leurs dérivés.

```bash
# 1. Télécharger la dernière release
wget https://github.com/nouhailler/jardinator/releases/latest/download/jardinator_2.4.1_amd64.deb

# 2. Installer
sudo dpkg -i jardinator_2.4.1_amd64.deb
sudo apt-get install -f   # résoudre les dépendances si besoin

# 3. Lancer
jardinator
# ou depuis le menu Applications → Éducation → Jardinator
```

> **Comment ça fonctionne ?** Le lanceur démarre un serveur HTTP local sur `localhost:8765` et ouvre automatiquement votre navigateur. Toutes les données restent sur votre machine (localStorage).

➡️ [Voir toutes les releases](https://github.com/nouhailler/jardinator/releases)

---

## 🏗️ Architecture

```
jardinator/
│
├── jardinator-web/              # 🌐 Application React (version principale)
│   ├── src/
│   │   ├── components/          # Composants UI
│   │   │   ├── Header.jsx           # Onglets, recherche, filtres, météo, export
│   │   │   ├── CardGrid.jsx         # Grille des cartes plantes + badge IA + étoile favori
│   │   │   ├── VegetableCard.jsx    # Carte individuelle
│   │   │   ├── DetailModal.jsx      # Fiche plante (12 sections + PDF + IA + Historique)
│   │   │   ├── GeminiPanel.jsx      # Conseils IA OpenRouter (streaming)
│   │   │   ├── AdvicePanel.jsx      # Conseils sauvegardés
│   │   │   ├── ConsumptionPanel.jsx # Consommation/FODMAPs IA (JSON structuré + sauvegarde)
│   │   │   ├── ProfilePanel.jsx     # Profil complet IA (JSON structuré + sauvegarde)
│   │   │   ├── HistoryPanel.jsx     # Historique IA de la plante (streaming + sauvegarde)
│   │   │   ├── NewPlantModal.jsx    # Assistant 5 étapes création fiche personnalisée
│   │   │   ├── ImagePicker.jsx      # Wikimedia Commons + URL custom
│   │   │   ├── CalendarView.jsx     # Vue calendrier mensuelle
│   │   │   ├── MeteoWidget.jsx      # Météo temps réel + recommandations IA + journal 30j
│   │   │   ├── GardenPlanner.jsx    # Plan potager drag & drop + compagnonnage + biodiversité
│   │   │   ├── OllamaChat.jsx       # Chat IA libre (Ollama + OpenRouter)
│   │   │   ├── DiagnosticPanel.jsx  # Diagnostic phytosanitaire IA (photo)
│   │   │   ├── IdentificationPanel.jsx # Identification plante par photo
│   │   │   ├── YieldPanel.jsx       # Journal de rendements
│   │   │   ├── InputsPanel.jsx      # Calculateur compost + traitements bio
│   │   │   ├── SettingsPanel.jsx    # Configuration Ollama & OpenRouter
│   │   │   ├── HelpPanel.jsx        # Aide contextuelle par onglet
│   │   │   └── ExportImport.jsx     # Export/import JSON bundle v4 (🔒 non-destructif)
│   │   ├── services/
│   │   │   ├── vegetableService.js   # Fusion JSONs + filtres + zones climatiques
│   │   │   ├── imageService.js       # CRUD images + Wikimedia API
│   │   │   ├── aiService.js          # OpenRouter streaming + cache modèles
│   │   │   ├── ollamaService.js      # Ollama streaming + historique chat
│   │   │   ├── weatherService.js     # Open-Meteo API + recommandations IA météo
│   │   │   ├── climateLogService.js  # Historique climatique 30j + événements notables
│   │   │   ├── gardenService.js      # Planches de culture + historique rotations
│   │   │   ├── gardenAnalysisService.js # Analyse compagnonnage + score biodiversité + IA potager
│   │   │   ├── gardenHistoryService.js  # Historique analyses IA potager (localStorage)
│   │   │   ├── customPlantsService.js# CRUD fiches personnalisées (localStorage)
│   │   │   ├── favoritesService.js   # Gestion favoris (localStorage)
│   │   │   ├── historyService.js     # Historiques IA par plante (localStorage)
│   │   │   ├── newPlantService.js    # IA lookup Latin/Wikipedia + génération fiche
│   │   │   ├── plantPdfService.js    # Génération PDF fiche individuelle
│   │   │   ├── consumptionService.js # Prompt FODMAPs/nutrition + repairJson + storage
│   │   │   ├── profileService.js     # Prompt profil nutraceutique + repairJson + storage
│   │   │   ├── diagnosticService.js  # Diagnostic phytosanitaire IA (prompt + streaming)
│   │   │   ├── identificationService.js # Identification plante IA (prompt + streaming)
│   │   │   ├── yieldService.js       # CRUD journal de rendements
│   │   │   └── icsService.js         # Génération fichier .ics (agenda)
│   │   ├── store/
│   │   │   └── useStore.js       # État global Zustand
│   │   └── data/                 # 11 fichiers JSON (208 plantes + images)
│   ├── scripts/
│   │   └── batch-ai.mjs          # Pré-génération IA en lot (208 plantes × 4 panneaux)
│   └── package.json
│
├── main.py                      # 🖥️ Application Python/PyQt6 (version desktop legacy)
├── debian/                      # 📦 Packaging Debian (app web)
├── requirements.txt             # Dépendances Python
└── *.json                       # Données partagées
```

---

## 🖥️ Interface

### Onglets de navigation

| Onglet | Description |
|--------|-------------|
| 🌿 **Tous** | L'intégralité du catalogue (220+ plantes) |
| 📅 **Mois en cours** | Ce qu'il faut semer ou planter ce mois-ci |
| 🌸 **Printemps** | Mars · Avril · Mai |
| ☀️ **Été** | Juin · Juillet · Août |
| 🍂 **Automne** | Septembre · Octobre · Novembre |
| ❄️ **Hiver** | Décembre · Janvier · Février |
| ⭐ **Favoris** | Vos plantes marquées comme favorites |
| 📆 **Calendrier** | Vue mensuelle de toutes les activités |
| 🪴 **Potager** | Plan interactif + compagnonnage IA + score biodiversité |
| 💬 **Chat IA** | Questions libres — Ollama local ou OpenRouter cloud |
| 🔬 **Diagnostic** | Diagnostic phytosanitaire IA par photo |
| 🌿 **Identification** | Identification de plante par photo |
| 🌾 **Rendements** | Journal de récoltes par plante et par année |
| ♻️ **Intrants** | Calculateur de compost + journal traitements bio |
| ⚙️ **Paramètres** | Configuration Ollama et OpenRouter |

### Code couleur du calendrier

| Couleur | Activité |
|---------|---------|
| 🔵 **Bleu** | Semis **intérieur** — démarrage sous abri chauffé |
| 🟠 **Orange** | Semis **extérieur** — semis direct en pleine terre |
| 🟢 **Vert** | **Plantation** — mise en place des plants |
| 🔴 **Rouge** | **Récolte** — fenêtre de récolte optimale |

---

## 🤖 Fonctionnalités IA

### Conseils de culture (✨ IA)
Sur chaque fiche plante, génère un résumé pratique (sol, semis, arrosage, maladies, récolte). Sauvegardé localement, visible en badge sur les miniatures avec aperçu au survol.

### Consommation & FODMAPs (🍽 Consommation)
Analyse complète générée par IA : parties comestibles/toxiques, allergies croisées, composés préoccupants (glycoalcaloïdes, oxalates, lectines…), **niveau FODMAPs Monash** avec portions seuils et équivalents ménagers, préparation, conservation, contre-indications, interactions médicamenteuses. Sauvegardé par plante.

### Profil complet (🌿 Profil)
Fiche nutraceutique et botanique : profil sensoriel, oligoéléments & vitamines avec quantités, acides gras, protéines, molécules bioactives, usages en pharmacopée traditionnelle, médecine douce, huiles essentielles, actions métaboliques. Sauvegardé par plante.

### Historique & origine (📜 Historique)
Fiche historique structurée en 5 sections : origine géographique, premières cultures, introduction en Europe, étymologie du nom, anecdotes historiques. Sauvegardé et inclus dans le PDF et l'export.

### Fiches personnalisées (➕ Nouvelle fiche)
Assistant 5 étapes pour créer une fiche complète : l'IA recherche automatiquement le nom latin, récupère une image Wikipedia, puis génère toutes les données de culture. Tout est éditable avant sauvegarde.

### Analyse potager (🪴 Compagnonnage & Biodiversité)
Analyse en temps réel des associations entre voisins (8 directions). Score biodiversité 0–100. L'IA génère un bilan complet avec corrections prioritaires et recommandations. Les analyses sont archivées pour suivre l'évolution dans le temps.

### Recommandations agro-météo (🌡️ Météo-Agile)
À partir des données météo du jour, l'IA génère des recommandations d'action concrètes pour le jardin (semis, arrosage, protection). Journal climatique 30 jours avec événements notables.

### Diagnostic phytosanitaire (🔬)
Photo d'une plante malade → identification de la maladie, de la carence ou du ravageur, avec remèdes biologiques détaillés. Nécessite un modèle vision (LLaVA, GPT-4o, Claude…).

### Identification de plante (🌿)
Photo d'une feuille, fleur ou écorce → nom commun, nom latin, famille, habitat et usages. Probabilités si plusieurs candidats.

### Suggestions rendements (🌾)
Pour chaque récolte enregistrée, l'IA propose des améliorations ciblées (variété, densité, rotation) pour la saison suivante.

### Pré-génération IA en lot (`batch-ai.mjs`)
Pour remplir les 4 panneaux IA sur toutes les plantes sans intervention manuelle, un script Node.js est fourni. Il reprend automatiquement là où il s'est arrêté (limite quotidienne OpenRouter), et génère un fichier bundle v4 importable directement dans l'appli.

```bash
cd jardinator-web
node scripts/batch-ai.mjs \
  --key sk-or-v1-VOTRE_CLE \
  --model qwen/qwen-2.5-7b-instruct:free \
  --limit 50          # requêtes par run (reprend au prochain run)
# Puis : Jardinator → 📂 Importer → scripts/batch-ai-output.json
```

### Chat IA libre (💬)
Questions libres en langage naturel. 120 questions suggérées en 20 catégories.

**Avec Ollama (IA locale, 100 % privé) :**
```bash
curl -fsSL https://ollama.com/install.sh | sh   # installer Ollama
ollama pull mistral                              # ~4 Go, excellent en français
ollama pull llama3.2                             # ~2 Go, plus léger
```
Puis → ⚙️ **Paramètres** → URL `http://localhost:11434` → **Tester & charger**.

**Avec OpenRouter (cloud gratuit) :**
1. Créer un compte sur [openrouter.ai](https://openrouter.ai)
2. Générer une clé API gratuite (`sk-or-v1-…`)
3. → ⚙️ **Paramètres** → coller la clé → **Charger modèles gratuits**

> Les clés API sont stockées **uniquement dans votre navigateur**. Elles ne transitent jamais par nos serveurs.

---

## 💾 Persistance des données

Toutes les personnalisations sont stockées dans le **localStorage** de votre navigateur :

| Clé | Contenu |
|-----|---------|
| `jardinator_images_v2` | Images personnalisées (URL ou data-URL) |
| `jardinator_ai_advice` | Conseils IA sauvegardés par plante |
| `jardinator_plant_history` | Historiques IA sauvegardés par plante |
| `jardinator_custom_plants` | Fiches personnalisées créées par l'utilisateur |
| `jardinator_favorites` | Plantes marquées comme favorites |
| `jardinator_openrouter_key` | Clé API OpenRouter |
| `jardinator_ai_model` | Modèle OpenRouter sélectionné |
| `jardinator_free_models_cache` | Cache modèles gratuits OpenRouter (1h) |
| `jardinator_ollama_url` | URL du serveur Ollama |
| `jardinator_ollama_model` | Modèle Ollama sélectionné |
| `jardinator_chat_history` | Historique du chat IA (questions + réponses datées) |
| `jardinator_garden_beds` | Planches de culture (grilles + plantes) |
| `jardinator_crop_history` | Historique cultures par cellule/année |
| `jardinator_garden_ai_history` | Historique analyses IA potager (max 50 entrées) |
| `jardinator_weather` | Cache météo (30 min) |
| `jardinator_location` | Dernière ville météo |
| `jardinator_weather_ai_recs` | Recommandations agro-météo IA sauvegardées |
| `jardinator_climate_history` | Cache historique climatique 30j (3h) |
| `jardinator_diagnostic_history` | Historique diagnostics phytosanitaires |
| `jardinator_identification_history` | Historique identifications de plantes |
| `jardinator_compost` | Données calculateur compost |
| `jardinator_consumption` | Analyses de consommation/FODMAPs IA par plante |
| `jardinator_profile` | Profils complets IA par plante |
| `jardinator_treatments` | Journal des traitements bio |
| `jardinator_yields` | Journal de rendements |

Pour sauvegarder ou transférer vos données → bouton **💾 Exporter** dans la barre de navigation.  
Le bundle JSON **v4** contient : images + conseils IA + historiques + consommation + profils + favoris + plan potager + rendements + traitements.  
La case **🔒** sur le bouton Importer (cochée par défaut) protège vos données existantes lors d'un import partiel.

---

## 🔧 Stack technique

| Technologie | Rôle | Version |
|-------------|------|:-------:|
| [![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black&style=flat-square)](https://react.dev) | Interface utilisateur | 19 |
| [![Vite](https://img.shields.io/badge/-Vite-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev) | Build tool & dev server | 8 |
| [![Zustand](https://img.shields.io/badge/-Zustand-FF6B35?style=flat-square)](https://zustand-demo.pmnd.rs) | État global | 5 |
| [![Ollama](https://img.shields.io/badge/-Ollama-3B82F6?style=flat-square)](https://ollama.com) | IA locale (streaming) | — |
| [![OpenRouter](https://img.shields.io/badge/-OpenRouter-7C3AED?logo=openai&logoColor=white&style=flat-square)](https://openrouter.ai/docs) | IA cloud gratuite (streaming) | — |
| [![Open-Meteo](https://img.shields.io/badge/-Open--Meteo-0EA5E9?style=flat-square)](https://open-meteo.com) | Météo temps réel (sans clé) | — |
| [![Wikimedia](https://img.shields.io/badge/-Wikimedia-000000?logo=wikipedia&logoColor=white&style=flat-square)](https://commons.wikimedia.org) | Images libres de droits | — |
| JSON statiques | Base de données plantes (220+ variétés) | — |

**Aucun backend requis** — SPA 100% front-end, hébergeable sur n'importe quel CDN statique.

---

## 🤝 Contribuer

Les contributions sont les bienvenues !

```bash
# 1. Forker le dépôt, puis :
git clone https://github.com/VOTRE_PSEUDO/jardinator.git
cd jardinator/jardinator-web && npm install && npm run dev

# 2. Créer une branche
git checkout -b feature/ma-fonctionnalite

# 3. Commiter et pousser
git commit -m "feat: description de la fonctionnalité"
git push origin feature/ma-fonctionnalite

# 4. Ouvrir une Pull Request
```

### 💡 Idées d'améliorations futures

- 🗺️ **Export potager** — export image/PDF de la grille du plan
- 🔄 **Rotations automatiques** — suggestions de rotations sur N années
- 🌍 **Zones USDA** — filtrage en plus des zones EU déjà implémentées
- 📦 **Paquet .deb v2.6** — packaging incluant toutes les nouvelles fonctionnalités

---

## 📄 Licence

Distribué sous licence **MIT**. Voir [LICENSE](LICENSE) pour plus de détails.

Les données botaniques et les images Wikimedia sont sous leurs licences respectives (Creative Commons).

---

<div align="center">

🌱 **Bon jardinage !** 🌱

*Jardinator — cultivez avec méthode, récoltez avec joie*

Made with ❤️ by [nouhailler](https://github.com/nouhailler)

</div>
