# Changelog — Jardinator

## [Unreleased] — Ergonomie mobile

### À venir
- Refonte responsive complète : breakpoints 768px et 1024px (actuellement seul 640px)
- Touch targets : tous les boutons portés à 44×44px minimum (fermeture modales, icônes action)
- Font-size racine : 14px → 16px pour éviter le zoom automatique mobile
- Garden Planner : layout colonne sur mobile, sidebars en drawers
- CalendarView : scroll horizontal avec indicateur visuel
- OllamaChat : sidebar rétractable sur mobile
- Meteo panel : largeur fluide (`min(460px, 95vw)`)
- Remplacement des `<div onClick>` par des `<button>` natifs (`VegetableCard`, `DetailModal`)
- Ajout `inputmode` sur les champs numériques et URL

---

## [v2.5.0] — 2026-04-30

### Nouvelles fonctionnalités

#### Compagnonnage & Biodiversité
- Panneau dédié dans le plan potager : détection en temps réel des conflits et harmonies entre plantes voisines
- Score de biodiversité de 0 à 100 calculé dynamiquement selon la diversité des espèces
- Analyse IA de la planche : évaluation qualitative et recommandations sur la composition du potager
- Historique des analyses IA : suivi de l'évolution du score et des recommandations au fil du temps

#### Météo-Agile
- Recommandations IA contextuelles basées sur les conditions météo actuelles (température, précipitations, humidité)
- Journal climatique des 30 derniers jours avec visualisation des tendances
- Alertes et conseils d'adaptation des tâches jardin selon la météo du moment

#### Onglet Intrants
- Calculateur de compost : calcul des proportions bruns/verts, estimation du temps de maturité
- Journal des traitements bio : suivi des applications (purins, décoctions, préparations naturelles) avec dates et doses

#### Diagnostic & Identification IA par photo
- Diagnostic phytosanitaire : analyse d'une photo de plante pour détecter maladies, ravageurs et carences
- Identification de plante : reconnaissance d'espèce à partir d'une photo avec fiche détaillée

#### Journal de rendements
- Saisie des récoltes par variété avec poids et notes
- Suggestions IA pour améliorer les rendements basées sur l'historique

#### Export agenda
- Export `.ics` compatible Google Agenda, Apple Calendar et Thunderbird
- Génération des événements de semis, repiquage et récolte pour toutes les variétés du plan

### Améliorations

- **Interface de filtrage** : remplacement des 7 onglets de catégories par une combobox compacte + menu déroulant pour la recherche et les filtres — interface plus claire et moins encombrée
- **Base de données** : 220+ variétés recensées (légumes, aromatiques, légumineuses, céréales, condimentaires)
- **Aide contextuelle** : enrichissement des tooltips et panneaux d'aide sur toutes les pages
- **Variables CSS** : correction des variables manquantes (`--bg`, `--card-bg`, `--bg-card`, `--text-muted`) pour un thème cohérent

### Corrections

- Correction des variables CSS manquantes causant des incohérences visuelles sur certains composants

### Notes techniques

- Build Vite — assets : `index-CTWd_hu7.js` / `index-zC_EIT89.css`
- IA locale via **Ollama** ou cloud via **OpenRouter** (modèles gratuits disponibles)
- Aucune dépendance nouvelle — paquet `.deb` autonome

---

## [v2.4.1] — 2025

- Correctifs divers sur le plan potager et la navigation

## [v2.2.0] — 2025

- Export PDF par fiche individuelle
- Filtrage par zone climatique européenne (6 régions)

## [v2.1.0] — 2025

- Plan du potager interactif avec drag & drop
- Fiches détaillées avec associations et distances de plantation

## [v2.0.0] — 2025

- Refonte complète PyQt6 → React/Vite
- Migration vers une architecture web avec backend Python minimal

## [v1.0.0] — 2024

- Version initiale PyQt6
