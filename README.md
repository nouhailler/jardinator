# 🌱 Jardinator — Calendrier du Jardinier

> **Planifiez vos semis, plantations et récoltes en toute sérénité.**
> Une application de bureau complète pour les jardiniers européens, avec plus de **173 variétés** de légumes, aromatiques, légumineuses et condimentaires.

---

## 🪴 Aperçu

Jardinator est une application de bureau écrite en **Python / PyQt6** qui centralise toutes les informations dont un jardinier a besoin :
calendrier de culture mois par mois, températures, associations de plantes, distances de plantation, types de semis, types de sol et bien plus encore.

---

## 🌿 Fonctionnalités principales

| 🗓️ Calendrier de culture | Semis intérieur / extérieur, plantation et récolte sur les 12 mois |
|---|---|
| 🔍 Recherche & filtres | Par nom, famille botanique ou groupe de plantes |
| 🃏 Fiches détaillées | 12 sections d'information par plante |
| 🌡️ Météo du jour | Recommandations selon la plage de température en temps réel |
| 🖼️ Images | Téléchargement Wikimedia Commons ou import depuis votre disque |
| 📆 Vue calendrier | Navigation mois par mois pour toutes les activités du potager |

---

## 🍀 Installation

### Prérequis

- Python **3.10+**
- PyQt6
- requests

```bash
pip install PyQt6 requests
```

### Lancer l'application

```bash
git clone https://github.com/nouhailler/jardinator.git
cd jardinator
python main.py
```

> Les données (base de données SQLite + images) sont stockées dans `~/.local/share/jardinator/`
> et créées automatiquement au premier lancement.

---

## 🌻 Interface — les onglets

L'application est organisée autour d'une barre de navigation principale :

| Onglet | Description |
|---|---|
| 🌿 **Tous** | L'intégralité du catalogue (173 plantes) |
| 📅 **Mois en cours** | Plantes à semer ou planter ce mois-ci |
| 🌸 **Printemps** | Mars · Avril · Mai |
| ☀️ **Été** | Juin · Juillet · Août |
| 🍂 **Automne** | Septembre · Octobre · Novembre |
| ❄️ **Hiver** | Décembre · Janvier · Février |
| 📆 **Calendrier** | Vue mensuelle complète de toutes les activités |

---

## 🔍 Filtres

Trois outils de filtrage disponibles simultanément dans la barre de titre :

- **🔍 Recherche libre** — par nom français, nom latin ou famille botanique
- **🏷️ Groupe** — légume-feuille, légume-racine, légume-fruit, légume-bulbe, légume-tige, cucurbitacée, aromatique, légumineuse, condimentaire
- **🌿 Famille** — Astéracées, Solanacées, Cucurbitacées, Fabacées, etc.

---

## 🃏 La fiche légume

Cliquez sur n'importe quelle carte pour ouvrir la fiche complète.
Elle est divisée en **12 sections** :

---

### 📷 En-tête

| Élément | Description |
|---|---|
| Photo | Image de la plante adulte (Wikimedia ou personnelle) |
| Nom scientifique | Nom latin officiel de l'espèce |
| Badge groupe | Catégorie colorée (légume-fruit, aromatique, cucurbitacée…) |
| Famille botanique | Famille taxonomique |
| Image de la graine | Vignette des graines si disponible |
| 📥 Wikimedia | Télécharge automatiquement une image libre de droits |
| 📂 Depuis le disque | Importe une photo personnelle (JPG, PNG, WebP…) |

---

### 📝 Description

Présentation générale : caractéristiques botaniques, usages culinaires, origine géographique et particularités de culture.

---

### 📅 Calendrier de culture

Grille des **12 mois** avec 4 lignes d'activités :

| Couleur | Activité |
|---|---|
| 🔵 Bleu | Semis **intérieur** — démarrage sous abri chauffé avant repiquage |
| 🟠 Orange | Semis **extérieur** — semis direct en pleine terre |
| 🟢 Vert | **Plantation** — mise en place de plants levés |
| 🔴 Rouge | **Récolte** — fenêtre de récolte |

> Le mois en cours est mis en évidence par un fond vert clair.

---

### 🌡️ Températures

Seuils thermiques indispensables pour ne pas perdre vos plants :

| Indicateur | Signification |
|---|---|
| 🌳 Extérieur min | Température minimale tolérée à l'extérieur |
| 🌳 Extérieur max | Au-delà, stress thermique ou montée en graine |
| 🏠 Serre min | Minimum sous abri froid / tunnel |
| 🏠 Serre max | Aérer obligatoirement au-dessus de ce seuil |

Affichage avec code couleur : 🔵 froid (≤ 5 °C) · 🩵 frais (≤ 15 °C) · 🟢 tempéré (≤ 25 °C) · 🟠 chaud (> 25 °C)

---

### 🚿 Soins

- **💧 Besoins en eau** — Faible / Moyen / Élevé
- **☀️ Ensoleillement** — Plein soleil · Mi-ombre · Ombre

---

### ℹ️ Informations complémentaires

| 📏 Profondeur de semis | En centimètres, ou « Surface » si la lumière est nécessaire à la germination |
|---|---|
| 🌡️ Germination | Fourchette de jours avant la levée des plantules |
| 📐 Hauteur adulte | Hauteur maximale de la plante à maturité (cm) |
| 🌱 Facilité de germination | Facile · Moyenne · Difficile |
| 👨‍🌾 Facilité de culture | Évaluation globale jusqu'à la récolte |
| 📅 Bisannuelle | Cycle sur deux ans (végétation + floraison/graine l'année suivante) |

---

### 🌿 Sous-variétés et cultivars

Liste des variétés sélectionnées les plus courantes.
Chaque cultivar est affiché sous forme de badge vert — utile pour choisir la variété adaptée à votre climat ou vos goûts.

---

### 🕳️ Type de semis

Méthode(s) recommandée(s) pour semer cette plante :

| Méthode | Description |
|---|---|
| 🕳️ En poquet | 2-3 graines par trou, puis éclaircissage — cucurbitacées, haricots |
| ➖ En ligne | Sillon continu puis éclaircissage — carottes, radis, betteraves |
| 🌬️ À la volée | Répartition aléatoire puis ratissage — salades, mâche, engrais verts |
| 🫙 En surface | Graine non recouverte, lumière nécessaire — basilic, laitue |

> Les méthodes actives sont affichées en vert, les inactives en gris.

---

### 🌍 Type de sol

| 🌊 Frais et bien drainé | Humidité régulière sans excès — convient à la majorité des légumes |
|---|---|
| 💧 Humide | Sol constamment frais — céleri, poireau, mâche |
| 🏜️ Sec | Sol léger et ressuyé — aromatiques méditerranéens (thym, romarin) |

---

### 🌱 Compost

| Type | Exigence | Convient à |
|---|---|---|
| 🦠 Bactérien | Peu exigeant | Légumineuses, légumes-racines |
| 🦠 Bactérien | Exigeant | Légumes-feuilles, légumes-fruits |
| 🍄 Fongique | Peu exigeant | Aromatiques, vivaces |
| 🍄 Fongique | Exigeant | Ligneux, arbustifs (mycorhizes importantes) |

---

### 📏 Distances de plantation

| ↔️ Sur le rang | Distance entre deux plants consécutifs |
|---|---|
| ↕️ Entre les rangs | Distance entre deux rangées — détermine la largeur des allées |
| ✂️ Éclaircissage | Distance à laisser après éclaircissage des semis en ligne |

---

### 🤝 Associations de plantes

| ✅ Associations favorables | Voisins qui se bénéficient mutuellement (ex. Tomate + Basilic, Carotte + Poireau) |
|---|---|
| ❌ Associations défavorables | Voisins à éviter — compétition, inhibition ou maladies communes |

> Le compagnonnage réduit les besoins en pesticides et optimise l'utilisation de l'espace.

---

## 🌡️ La Météo du jour

Cliquez sur **🌡️ Météo du jour** (barre de titre) pour ouvrir la fenêtre météo.
Elle reste visible en permanence, en dehors de la fenêtre principale.

### Comment l'utiliser

1. **Réglez les deux poignées** du curseur sur la température minimale et maximale attendue dans la journée.
2. **Choisissez le contexte** : Plein air ou Sous abri (serre, tunnel, voile).
3. **Lisez les résultats** : les plantes sont réparties en trois zones.

### Les zones de résultat

| Zone | Critère | Action recommandée |
|---|---|---|
| 🟢 **Conditions optimales** | Températures de la journée dans la plage idéale de la plante | Mettez en place sans hésiter |
| 🟡 **Conditions limites** | La journée est assez chaude mais la nuit reste froide (ou inverse) | Protection conseillée (voile, tunnel) |
| 🔴 **Conditions défavorables** | Il fait trop froid toute la journée | Attendez ou gardez sous abri |

---

## 🖼️ Gestion des images

Les images sont stockées localement dans `~/.local/share/jardinator/images/`.

### Téléchargement global

Le bouton **📥 Télécharger les images** de la barre principale télécharge en tâche de fond les images manquantes pour toutes les plantes depuis **Wikimedia Commons**.
Un indicateur de progression permet de suivre l'avancement et d'annuler à tout moment.

### Téléchargement individuel

Dans une fiche, **📥 Télécharger depuis Wikimedia** récupère uniquement les images de cette plante (photo + graine).

### Import personnel

**📂 Choisir une image depuis le disque** permet d'utiliser vos propres photos.
Le fichier est copié dans le dossier de données — l'original n'est jamais modifié.

---

## 🗂️ Structure du projet

```
jardinator/
│
├── main.py                      # Point d'entrée
│
├── src/
│   ├── database.py              # Couche SQLite (CRUD pur)
│   ├── service.py               # Logique métier + téléchargements Wikimedia
│   └── ui/
│       ├── main_window.py       # Fenêtre principale
│       ├── detail_dialog.py     # Fiche légume complète
│       ├── calendar_widget.py   # Vue calendrier mensuelle
│       ├── vegetable_card.py    # Carte de la grille principale
│       ├── meteo_dialog.py      # Fenêtre météo + curseur double-poignée
│       ├── help_dialog.py       # Aide et documentation intégrée
│       ├── flow_layout.py       # Layout en flux pour les cartes
│       └── styles.py            # Feuilles de style globales
│
├── legumes.json                 # 148 légumes de base
├── plantes_extra.json           # 25 aromatiques / légumineuses / condimentaires
├── associations.json            # Compagnonnage favorable et défavorable
├── distances.json               # Espacements de plantation
├── semis.json                   # Calendriers de semis intérieur / extérieur
├── types_semis.json             # Méthodes de semis (poquet, ligne, volée, surface)
├── sol_compost.json             # Types de sol, compost, bisannuelle
├── sous_varietes.json           # Cultivars et sous-variétés
├── infos_complementaires.json   # Profondeur, germination, hauteur, difficulté
└── groupes.json                 # Classification par groupe fonctionnel
```

---

## 🌱 Données

| Fichier JSON | Contenu |
|---|---|
| `legumes.json` | 148 légumes européens avec noms, familles, calendriers, températures |
| `plantes_extra.json` | 25 aromatiques, légumineuses et condimentaires supplémentaires |
| `associations.json` | Associations favorables et défavorables pour 173 plantes |
| `distances.json` | Espacements sur le rang, entre les rangs et éclaircissage |
| `semis.json` | Mois de semis intérieur et extérieur |
| `types_semis.json` | Méthodes de semis applicables |
| `sol_compost.json` | Préférences de sol, type de compost, caractère bisannuel |
| `sous_varietes.json` | Cultivars référencés par espèce |
| `infos_complementaires.json` | Profondeur de semis, germination, hauteur adulte, difficulté |
| `groupes.json` | Groupe fonctionnel de chaque plante |

> Toutes les données sont chargées au démarrage via `UPDATE WHERE name=?`.
> Pour corriger ou enrichir une donnée, il suffit d'éditer le fichier JSON correspondant et de relancer l'application.

---

## ⚙️ Détails techniques

- **Interface** : PyQt6 (QMainWindow, QDialog, QThread, custom widgets)
- **Base de données** : SQLite via le module standard `sqlite3`, avec migrations automatiques
- **Images** : Wikimedia Commons API (libre de droits, User-Agent déclaré)
- **Téléchargements** : `QThread` pour ne pas bloquer l'interface
- **Stockage local** : `~/.local/share/jardinator/` (base + images)
- **Pas de dépendance externe** au-delà de PyQt6 et requests

---

## 🤝 Contribuer

Les contributions sont les bienvenues !

1. Forkez le dépôt
2. Créez une branche : `git checkout -b feature/ma-fonctionnalite`
3. Commitez vos changements : `git commit -m "Ajouter ma fonctionnalité"`
4. Pushez : `git push origin feature/ma-fonctionnalite`
5. Ouvrez une **Pull Request**

### Idées d'améliorations

- 🌍 Localisation par région / zone climatique
- 📊 Statistiques et historique des cultures
- 🗺️ Plan du potager interactif
- 📱 Export PDF du calendrier annuel
- 🌧️ Intégration d'une API météo en temps réel

---

## 📄 Licence

Ce projet est distribué sous licence **MIT**.
Les données botaniques et les images Wikimedia sont sous leurs licences respectives (Creative Commons).

---

<div align="center">

🌱 **Bon jardinage !** 🌱

*Jardinator — cultivez avec méthode*

</div>
