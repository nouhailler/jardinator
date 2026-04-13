<div align="center">

# 🌱 Jardinator

### Calendrier du Jardinier — Planifiez vos semis, plantations et récoltes

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Zustand](https://img.shields.io/badge/Zustand-5-orange)](https://zustand-demo.pmnd.rs)
[![OpenRouter](https://img.shields.io/badge/IA-OpenRouter-7C3AED?logo=openai&logoColor=white)](https://openrouter.ai)
[![Licence MIT](https://img.shields.io/badge/Licence-MIT-green)](LICENSE)

**208 variétés** de légumes, aromatiques, légumineuses, céréales et condimentaires  
Accessible depuis n'importe quel navigateur — aucune installation requise

[🚀 Démarrer](#-démarrage-rapide) · [✨ Fonctionnalités](#-fonctionnalités) · [📦 Télécharger](https://github.com/nouhailler/jardinator/releases) · [🤝 Contribuer](#-contribuer)

</div>

---

## ✨ Fonctionnalités

<table>
<tr>
<td width="50%">

### 🗓️ Calendrier de culture
Visualisez sur 12 mois les semis intérieur/extérieur, plantations et récoltes pour chaque plante. Navigation mois par mois avec mise en évidence du mois en cours.

</td>
<td width="50%">

### 🔍 Recherche & filtres intelligents
Recherche en temps réel par nom, nom latin ou famille botanique. Filtres par groupe fonctionnel et famille, cumulables.

</td>
</tr>
<tr>
<td>

### 🃏 Fiches détaillées complètes
Chaque plante dispose d'une fiche avec 12 sections : températures, entretien, distances, associations, types de sol, sous-variétés, types de semis…

</td>
<td>

### 🤖 Conseils IA intégrés
Obtenez des conseils de culture personnalisés via **OpenRouter** (accès aux modèles gratuits). Sauvegardez les conseils et consultez-les hors-ligne.

</td>
</tr>
<tr>
<td>

### 🖼️ Images personnalisables
Choisissez des images depuis **Wikimedia Commons** (recherche intégrée), collez une URL personnalisée ou restaurez l'image par défaut. Tout est sauvegardé localement.

</td>
<td>

### 🌡️ Météo du jardin
Double curseur de température pour filtrer en temps réel les plantes adaptées à vos conditions du jour : zone froide, tempérée ou chaude.

</td>
</tr>
<tr>
<td>

### 💾 Export / Import
Exportez toutes vos personnalisations (images + conseils IA) en un fichier JSON. Importez-les sur une autre machine en un clic.

</td>
<td>

### 📆 Vue calendrier mensuelle
Naviguez mois par mois et voyez toutes les activités du potager : semis, plantations, récoltes — pour toutes vos plantes simultanément.

</td>
</tr>
</table>

---

## 🌿 Catalogue des plantes

| Catégorie | Exemples | Nb |
|-----------|---------|:--:|
| 🥕 Légumes-racines | Carotte (4 var.), Betterave (3 var.), Navet (3 var.), Pomme de terre (4 var.), Radis (4 var.) | 40+ |
| 🍅 Légumes-fruits | Tomate (9 var.), Poivron (4 var.), Aubergine (3 var.), Piment (3 var.), Melon (5 var.) | 35+ |
| 🥒 Cucurbitacées | Courgette, Concombre (3 var.), Courge (14 var.), Citrouille, Pastèque | 20+ |
| 🥬 Légumes-feuilles | Laitue (6 var.), Chou (20 var.), Épinard, Roquette, Mâche | 35+ |
| 🌿 Aromatiques | Basilic (4 var.), Menthe, Thym, Persil, Coriandre, Aneth… | 15+ |
| 🫘 Légumineuses | Haricot (6 var.), Petit pois, Pois mange-tout, Fève, Soja | 12+ |
| 🌾 Céréales | Blé tendre, Blé dur, Blé noir (sarrasin), Épeautre, Petit épeautre | 5 |
| 🌸 Autres | Asperge (3 var.), Fraise (2 var.), Artichaut, Topinambour… | 20+ |

> **208 entrées** au total, chacune avec calendrier de culture, températures, associations, distances, sous-variétés et infos complémentaires.

---

## 🚀 Démarrage rapide

### Prérequis

- [Node.js](https://nodejs.org) 18+
- npm 9+

### Installation

```bash
git clone https://github.com/nouhailler/jardinator.git
cd jardinator/jardinator-web
npm install
npm run dev
```

Ouvrez [http://localhost:5173](http://localhost:5173) dans votre navigateur.

### Build de production

```bash
npm run build
# Les fichiers sont générés dans jardinator-web/dist/
```

Servez le contenu du dossier `dist/` avec n'importe quel serveur HTTP statique (nginx, Apache, Caddy, GitHub Pages…).

---

## 📦 Installation via paquet .deb (Linux)

Pour Debian, Ubuntu et leurs dérivés, un paquet `.deb` est disponible pour la version **Python/PyQt6** de l'application.

```bash
# Télécharger depuis la page Releases
wget https://github.com/nouhailler/jardinator/releases/download/v2.0.0/jardinator_2.0.0_amd64.deb

# Installer
sudo dpkg -i jardinator_2.0.0_amd64.deb
sudo apt-get install -f  # résoudre les dépendances si besoin
```

➡️ [Voir la page Releases](https://github.com/nouhailler/jardinator/releases)

---

## 🏗️ Architecture

```
jardinator/
│
├── jardinator-web/              # 🌐 Application React (version web — recommandée)
│   ├── src/
│   │   ├── components/          # Composants React
│   │   │   ├── Header.jsx       # Onglets, recherche, filtres, météo, export
│   │   │   ├── PlantGrid.jsx    # Grille des cartes plantes
│   │   │   ├── DetailModal.jsx  # Fiche plante complète
│   │   │   ├── GeminiPanel.jsx  # Conseils IA (OpenRouter streaming)
│   │   │   ├── AdvicePanel.jsx  # Lecture des conseils sauvegardés
│   │   │   ├── ImagePicker.jsx  # Sélection d'images (Wikimedia + URL)
│   │   │   ├── CalendarView.jsx # Vue calendrier mensuelle
│   │   │   ├── MeteoWidget.jsx  # Filtre par température
│   │   │   └── ExportImport.jsx # Export/import JSON des personnalisations
│   │   ├── services/
│   │   │   ├── vegetableService.js  # Fusion des JSONs → objets plantes
│   │   │   ├── imageService.js      # CRUD images localStorage + Wikimedia API
│   │   │   └── aiService.js         # OpenRouter streaming + cache modèles
│   │   ├── store/
│   │   │   └── useStore.js      # État global Zustand
│   │   └── data/                # 11 fichiers JSON (données statiques)
│   │       ├── legumes.json         # 175 légumes principaux
│   │       ├── plantes_extra.json   # 33 aromatiques / céréales / condimentaires
│   │       ├── associations.json    # Compagnonnage (favorables/défavorables)
│   │       ├── distances.json       # Espacements de plantation
│   │       ├── semis.json           # Calendriers de semis
│   │       ├── types_semis.json     # Méthodes (poquet, ligne, volée, surface)
│   │       ├── sol_compost.json     # Types de sol et compost
│   │       ├── sous_varietes.json   # Cultivars et variétés
│   │       ├── infos_complementaires.json
│   │       ├── groupes.json
│   │       └── plant_images.json    # URLs d'images par défaut
│   └── package.json
│
├── main.py                      # 🖥️ Application Python/PyQt6 (version desktop)
├── src/                         # Sources Python
├── debian/                      # Packaging Debian
├── build_deb.sh                 # Script de construction du .deb
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

### Calendrier de culture — code couleur

| Couleur | Activité |
|---------|---------|
| 🔵 Bleu | Semis **intérieur** — démarrage sous abri chauffé |
| 🟠 Orange | Semis **extérieur** — semis direct en pleine terre |
| 🟢 Vert | **Plantation** — mise en place des plants |
| 🔴 Rouge | **Récolte** — fenêtre de récolte optimale |

---

## 🤖 Conseils IA

Jardinator intègre [OpenRouter](https://openrouter.ai) pour générer des conseils de culture personnalisés.

1. **Ouvrez** la fiche d'une plante
2. **Cliquez** sur ✨ IA
3. **Entrez** votre clé OpenRouter gratuite (`sk-or-v1-…`)  
   *(stockée uniquement dans votre navigateur)*
4. **Choisissez** un modèle parmi les gratuits disponibles
5. **Sauvegardez** les conseils pour les consulter sans relancer l'IA

> Les modèles gratuits ne consomment aucun crédit. La liste est récupérée dynamiquement depuis l'API OpenRouter.

---

## 💾 Persistance des données

Toutes les personnalisations sont stockées dans le **localStorage** de votre navigateur :

| Clé localStorage | Contenu |
|-----------------|---------|
| `jardinator_images_v2` | Images personnalisées (URL ou data-URL) |
| `jardinator_ai_advice` | Conseils IA sauvegardés par plante |
| `jardinator_openrouter_key` | Clé API OpenRouter |
| `jardinator_model` | Modèle IA sélectionné |
| `jardinator_models_cache` | Cache de la liste des modèles (1h) |

Pour **sauvegarder** ou **transférer** vos données → bouton **💾 Exporter** dans la barre de navigation.

---

## 🔧 Stack technique

| Technologie | Rôle | Version |
|-------------|------|---------|
| [React](https://react.dev) | Interface utilisateur | 19 |
| [Vite](https://vitejs.dev) | Build tool & dev server | 8 |
| [Zustand](https://zustand-demo.pmnd.rs) | État global | 5 |
| [OpenRouter API](https://openrouter.ai/docs) | Conseils IA streaming | — |
| [Wikimedia Commons API](https://commons.wikimedia.org) | Recherche d'images libres | — |
| JSON statiques | Base de données plantes | — |

**Aucun backend requis** — l'application est 100% front-end et peut être hébergée sur n'importe quel CDN statique (GitHub Pages, Netlify, Vercel…).

---

## 🤝 Contribuer

Les contributions sont les bienvenues !

```bash
# 1. Forker le dépôt, puis :
git clone https://github.com/VOTRE_PSEUDO/jardinator.git
cd jardinator/jardinator-web
npm install
npm run dev

# 2. Créer une branche
git checkout -b feature/ma-fonctionnalite

# 3. Commiter et pousser
git commit -m "feat: description de la fonctionnalité"
git push origin feature/ma-fonctionnalite

# 4. Ouvrir une Pull Request
```

### 💡 Idées d'améliorations

- 🗺️ Plan du potager interactif (placement des cultures)
- 📊 Historique des cultures et rotations
- 🌍 Filtrage par zone climatique (USDA / Europe)
- 📱 Progressive Web App (installation mobile)
- 📄 Export PDF du calendrier annuel personnalisé
- 🌧️ Intégration API météo temps réel

---

## 📄 Licence

Distribué sous licence **MIT**. Voir [LICENSE](LICENSE) pour plus de détails.

Les données botaniques et les images Wikimedia sont sous leurs licences respectives (Creative Commons).

---

<div align="center">

🌱 **Bon jardinage !** 🌱

*Jardinator — cultivez avec méthode, récoltez avec joie*

</div>
