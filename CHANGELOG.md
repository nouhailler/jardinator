# Changelog — Jardinator

## [v2.6.1] — 2026-06-01

### Nouvelles fonctionnalités

#### Menu hamburger mobile (`Header.jsx`)
- Bouton ☰/✕ visible sous 640px, à droite du sélecteur de vue plantes
- Affiche le nom de l'onglet actif à côté du bouton
- Drawer animé (`slideDown`) avec les 8 onglets de navigation
- Fermeture au tap extérieur, à Escape, ou à la sélection d'un onglet
- Desktop inchangé : tabs horizontaux conservés

### Corrections

- **Badge "Conseil IA" dupliqué** : suppression du pseudo-élément CSS `::after { content: ' Conseil IA' }` qui doublait le texte déjà présent dans le JSX de `VegetableCard`
- **Boutons fiche plante scrollables horizontalement sur mobile** : `.detail-name-row` passe en `flex-direction: column` sous 640px — la barre d'action prend toute la largeur et les boutons s'y répartissent via `flex-wrap` sans déborder du viewport. Padding réduit pour tenir en ~2 rangées sur 375px

---

## [v2.6.0] — 2026-06-01

### Nouvelles fonctionnalités

#### Import non-destructif (Export/Import)
- Case **🔒** activée par défaut à l'import : les données IA existantes (`advice`, `history`, `consumption`, `profile`) ne sont jamais écrasées
- Message de confirmation détaillant le nombre d'entrées importées vs conservées

#### Script batch pré-génération IA (`scripts/batch-ai.mjs`)
- Génère les 4 panneaux IA (advice / consumption / profile / history) pour les 208 plantes via OpenRouter en mode non-streaming
- Reprise automatique depuis la dernière position (fichier `batch-ai-progress.json`)
- Sortie : `batch-ai-output.json` — bundle v4 importable directement dans l'appli
- Rate limiting configurable + backoff exponentiel sur 429

### Améliorations — Ergonomie mobile (3 phases)

#### Phase 1 — Quick wins
- Font-size racine `14px` → `16px` (évite le zoom automatique sur les inputs)
- 10 boutons de fermeture/icônes portés à `min-width/height: 44px`
- Breakpoints `@media (max-width: 768px)` et `@media (max-width: 1024px)` ajoutés
- Card grid `minmax(175px)` → `minmax(140px, 1fr)` — 3 cartes sur iPhone SE

#### Phase 2 — Composants cassés sur mobile
- **Garden Planner** : `flex-direction: column` sous 768px, sidebars en blocs scrollables
- **Meteo panel** : `width: min(460px, 95vw)` — ne déborde plus jamais
- **Month grid** : `min-width: 480px` + scroll shadow CSS + suppression des règles cassant la grille en colonne
- **OllamaChat** : sidebar historique masquée par défaut sur mobile, bouton toggle avec compteur

#### Phase 3 — Accessibilité
- `inputMode="decimal"` sur tous les champs numériques ; `inputMode="url"` sur les champs URL
- `VegetableCard` : `<div onClick>` → `<button type="button">`
- `DetailModal` : `role="dialog" aria-modal` sur le contenu
- Navigation : `aria-label="Navigation principale"` + `aria-current="page"` sur l'onglet actif
- Font-sizes badges et labels portés à 0.75rem minimum (12px)

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
