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

**208 variétés** de légumes, aromatiques, légumineuses, céréales et condimentaires  
Accessible depuis n'importe quel navigateur — aucune installation requise

[🚀 Démarrer](#-démarrage-rapide) · [✨ Fonctionnalités](#-fonctionnalités) · [📦 Télécharger le .deb](https://github.com/nouhailler/jardinator/releases/latest) · [🤝 Contribuer](#-contribuer)

</div>

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
Conseils de culture personnalisés via **OpenRouter** (modèles gratuits). Streaming en temps réel, sauvegarde locale, consultation hors-ligne.

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

### ⚙️ Paramètres centralisés
Configuration **Ollama** (URL + détection automatique des modèles) et **OpenRouter** (clé API + sélection du modèle gratuit) modifiables à tout moment.

</td>
<td>

### ❓ Aide contextuelle
Bouton **?** flottant sur toutes les pages. Panneau latéral dont le contenu s'adapte à l'onglet actif. Tooltips inline sur les zones complexes.

</td>
</tr>
<tr>
<td>

### 🪴 Plan du potager interactif
Créez des **planches de culture** avec dimensions personnalisées. Interface **drag & drop** pour placer vos plants. Avertissements d'associations défavorables en temps réel.

</td>
<td>

### 📅 Historique des cultures & rotations
Enregistrement automatique par cellule et par année. **Alertes de rotation** : détection des mauvaises successions. Notes personnalisées par culture.

</td>
</tr>
<tr>
<td>

### 🌡️ Météo en temps réel
Connecté à **Open-Meteo** (sans clé API). Température actuelle + prévisions 7 jours. Double curseur synchronisé automatiquement pour filtrer les plantes adaptées.

</td>
<td>

### 🌍 Filtrage par zone climatique
**6 régions européennes** : Nordique, Continental, Semi-continental, Atlantique, Sud-Ouest, Méditerranéen. Compatible avec tous les autres filtres.

</td>
</tr>
<tr>
<td>

### 🖼️ Images personnalisables
Recherche intégrée **Wikimedia Commons**, URL personnalisée ou image par défaut. Tout est sauvegardé dans votre navigateur.

</td>
<td>

### 📄 Export PDF du calendrier
Calendrier annuel complet en tableau **A4 paysage**. Export de la vue filtrée ou de toutes les plantes.

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

> **208 entrées** au total — calendrier, températures, associations, distances, sous-variétés, infos complémentaires.

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
wget https://github.com/nouhailler/jardinator/releases/latest/download/jardinator_2.2.0_all.deb

# 2. Installer
sudo dpkg -i jardinator_2.2.0_all.deb
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
│   │   │   ├── Header.jsx       # Onglets, recherche, filtres, météo, export
│   │   │   ├── CardGrid.jsx     # Grille des cartes plantes
│   │   │   ├── DetailModal.jsx  # Fiche plante (12 sections)
│   │   │   ├── GeminiPanel.jsx  # Conseils IA OpenRouter (streaming)
│   │   │   ├── AdvicePanel.jsx  # Conseils sauvegardés
│   │   │   ├── ImagePicker.jsx  # Wikimedia Commons + URL custom
│   │   │   ├── CalendarView.jsx # Vue calendrier mensuelle
│   │   │   ├── MeteoWidget.jsx  # Météo temps réel + curseurs
│   │   │   ├── GardenPlanner.jsx# Plan potager drag & drop
│   │   │   ├── OllamaChat.jsx   # Chat IA libre (Ollama + OpenRouter)
│   │   │   ├── SettingsPanel.jsx# Configuration Ollama & OpenRouter
│   │   │   ├── HelpPanel.jsx    # Aide contextuelle par onglet
│   │   │   ├── HelpTip.jsx      # Tooltip ? inline
│   │   │   ├── PdfExport.jsx    # Export PDF A4 paysage
│   │   │   └── ExportImport.jsx # Export/import JSON personnalisations
│   │   ├── services/
│   │   │   ├── vegetableService.js  # Fusion JSONs + filtres + zones climatiques
│   │   │   ├── imageService.js      # CRUD images + Wikimedia API
│   │   │   ├── aiService.js         # OpenRouter streaming + cache modèles
│   │   │   ├── ollamaService.js     # Ollama streaming + historique chat
│   │   │   ├── weatherService.js    # Open-Meteo API + géolocalisation
│   │   │   └── gardenService.js     # Planches de culture + historique
│   │   ├── store/
│   │   │   └── useStore.js      # État global Zustand
│   │   └── data/                # 12 fichiers JSON (208 plantes + 120 questions IA)
│   └── package.json
│
├── main.py                      # 🖥️ Application Python/PyQt6 (version desktop legacy)
├── src/                         # Sources Python (ui, service, database)
├── debian/                      # 📦 Packaging Debian (app web)
├── requirements.txt             # Dépendances Python
└── *.json                       # Données partagées
```

---

## 🖥️ Interface

### Onglets de navigation

| Onglet | Description |
|--------|-------------|
| 🌿 **Tous** | L'intégralité du catalogue (208 plantes) |
| 📅 **Mois en cours** | Ce qu'il faut semer ou planter ce mois-ci |
| 🌸 **Printemps** | Mars · Avril · Mai |
| ☀️ **Été** | Juin · Juillet · Août |
| 🍂 **Automne** | Septembre · Octobre · Novembre |
| ❄️ **Hiver** | Décembre · Janvier · Février |
| 📆 **Calendrier** | Vue mensuelle de toutes les activités |
| 🪴 **Potager** | Plan interactif + historique des cultures |
| 💬 **Chat IA** | Questions libres — Ollama local ou OpenRouter cloud |
| ⚙️ **Paramètres** | Configuration Ollama et OpenRouter |

### Code couleur du calendrier

| Couleur | Activité |
|---------|---------|
| 🔵 **Bleu** | Semis **intérieur** — démarrage sous abri chauffé |
| 🟠 **Orange** | Semis **extérieur** — semis direct en pleine terre |
| 🟢 **Vert** | **Plantation** — mise en place des plants |
| 🔴 **Rouge** | **Récolte** — fenêtre de récolte optimale |

---

## 🤖 Conseils IA

### Fiches plantes

Sur chaque fiche plante, le bouton **✨ IA** génère un résumé de culture (sol, semis, arrosage, maladies, récolte) via OpenRouter. Les conseils sont sauvegardés localement et consultables hors-ligne.

### 💬 Chat IA libre (onglet dédié)

Posez n'importe quelle question en langage naturel. Choix entre **Ollama** (local) et **OpenRouter** (cloud).

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
| `jardinator_openrouter_key` | Clé API OpenRouter |
| `jardinator_ai_model` | Modèle OpenRouter sélectionné |
| `jardinator_free_models_cache` | Cache modèles gratuits OpenRouter (1h) |
| `jardinator_ollama_url` | URL du serveur Ollama |
| `jardinator_ollama_model` | Modèle Ollama sélectionné |
| `jardinator_chat_history` | Historique du chat IA (questions + réponses datées) |
| `jardinator_garden_beds` | Planches de culture (grilles + plantes) |
| `jardinator_crop_history` | Historique cultures par cellule/année |
| `jardinator_weather` | Cache météo (30 min) |
| `jardinator_location` | Dernière ville météo |

Pour sauvegarder ou transférer vos données → bouton **💾 Exporter** dans la barre de navigation.

---

## 🔧 Stack technique

| Technologie | Rôle | Version |
|-------------|------|:-------:|
| [![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black&style=flat-square)](https://react.dev) | Interface utilisateur | 19 |
| [![Vite](https://img.shields.io/badge/-Vite-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev) | Build tool & dev server | 8 |
| [![Zustand](https://img.shields.io/badge/-Zustand-FF6B35?style=flat-square)](https://zustand-demo.pmnd.rs) | État global | 5 |
| [![Ollama](https://img.shields.io/badge/-Ollama-3B82F6?style=flat-square)](https://ollama.com) | IA locale (streaming) | — |
| [![OpenRouter](https://img.shields.io/badge/-OpenRouter-7C3AED?logo=openai&logoColor=white&style=flat-square)](https://openrouter.ai/docs) | IA cloud gratuite (streaming) | — |
| [![react-markdown](https://img.shields.io/badge/-react--markdown-gray?style=flat-square)](https://github.com/remarkjs/react-markdown) | Rendu Markdown des réponses IA | 10 |
| [![Open-Meteo](https://img.shields.io/badge/-Open--Meteo-0EA5E9?style=flat-square)](https://open-meteo.com) | Météo temps réel (sans clé) | — |
| [![Wikimedia](https://img.shields.io/badge/-Wikimedia-000000?logo=wikipedia&logoColor=white&style=flat-square)](https://commons.wikimedia.org) | Images libres de droits | — |
| JSON statiques | Base de données plantes (208 variétés) | — |

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

- 📱 **Progressive Web App** — installation sur mobile/tablette
- 🗺️ **Plan potager** — export image/PDF de la grille
- 📊 **Statistiques** — rendements et suivi par saison
- 🔄 **Rotations automatiques** — suggestions sur N années
- 🌍 **Zones USDA** — filtrage en plus des zones EU

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
