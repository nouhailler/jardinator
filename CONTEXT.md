# CONTEXT.md — État du projet Jardinator

> Fichier de reprise pour les sessions Claude. Mis à jour le 2026-04-13.

---

## 🗺️ Vue d'ensemble

Jardinator est un calendrier de jardinage. Le projet contient **deux versions** :

| Version | Technologie | Statut |
|---------|-------------|--------|
| **Web** (`jardinator-web/`) | React 19 + Vite 8 + Zustand | ✅ Version principale, active |
| **Desktop** (racine) | Python 3 + PyQt6 | ✅ Stable, packaging .deb disponible |

La version web est la cible de développement actuel. La version Python/desktop n'est plus modifiée activement mais est maintenue pour le packaging Debian.

---

## 🏗️ Architecture web (version active)

### Stack
- **React 19** + **Vite 8** — SPA 100% front-end, aucun backend
- **Zustand 5** — état global (filtres, plante sélectionnée, images, conseils IA)
- **localStorage** — persistance des personnalisations utilisateur
- **OpenRouter API** — conseils IA en streaming SSE
- **Wikimedia Commons API** — recherche d'images libres de droits

### Fichiers clés
```
jardinator-web/src/
├── components/
│   ├── Header.jsx          # Onglets, search (debounce 280ms), filtres, MeteoWidget, ExportImport
│   ├── PlantGrid.jsx       # Grille de cartes, filtrée par useStore
│   ├── DetailModal.jsx     # Modal fiche plante — intègre ImagePicker, GeminiPanel, AdvicePanel
│   ├── GeminiPanel.jsx     # OpenRouter streaming + sélecteur de modèle dynamique
│   ├── AdvicePanel.jsx     # Lecture seule des conseils sauvegardés
│   ├── ImagePicker.jsx     # Wikimedia Commons search + URL custom + lien Google Images
│   ├── CalendarView.jsx    # Vue calendrier mensuelle avec navigation
│   ├── MeteoWidget.jsx     # Double curseur température → filtre 3 zones
│   └── ExportImport.jsx    # Bundle v2 JSON (images + conseils IA)
├── services/
│   ├── vegetableService.js # Fusionne les 11 JSONs → objets plant unifiés, IDs séquentiels
│   ├── imageService.js     # CRUD localStorage (jardinator_images_v2), migration ancienne clé, Wikimedia API
│   └── aiService.js        # OpenRouter streaming, fetchFreeModels (cache 1h), saveAdvice/getAllSavedAdvice
├── store/
│   └── useStore.js         # Zustand : activeTab, filters, selectedPlant, imageOverrides, savedAdvice, init()
└── data/                   # 11 JSON statiques bundlés à la compilation
```

### Format d'export (bundle v2)
```json
{
  "_jardinator": true,
  "_version": 2,
  "_date": "ISO date",
  "images": { "plantId": "url | null" },
  "advice": { "plantId": "texte markdown" }
}
```

---

## 🌿 Base de données plantes

**208 entrées** réparties dans 2 fichiers JSON principaux :
- `legumes.json` — 175 légumes
- `plantes_extra.json` — 33 aromatiques, légumineuses, céréales, condimentaires

Chaque plante est enrichie via 9 fichiers JSON supplémentaires (associations, distances, semis, types_semis, sol_compost, sous_varietes, infos_complementaires, groupes, plant_images).

### Dernières additions (session 2026-04-13)
- **Melons** : Charentais, Cantaloup, Galia, Honeydew
- **Haricot grimpant**, **Fraise**, **Fraise remontante**, **Citrouille**
- **Asperge** blanche et violette
- **Betterave** jaune et Chioggia
- **Aubergine** blanche et longue
- **Carottes** : Nantaise, Chantenay, violette
- **Concombres** : mini, de serre
- **Navets** : boule d'or, de Milan
- **Poivrons** : rouge, jaune, corne
- **Pommes de terre** : primeur, à chair ferme, vitelotte
- **Basilics** : thaï, pourpre, citron
- **Céréales** : Blé tendre, Blé dur, Blé noir (sarrasin), Épeautre, Petit épeautre

---

## 🔑 Points d'attention techniques

### IDs de plantes
Les IDs sont assignés **séquentiellement à la volée** par `getAllPlants()` dans `vegetableService.js`. L'ordre dépend de la concaténation `[...legumesData, ...plantesExtraData]`. Ne pas supposer qu'un ID est stable d'une version à l'autre.

### Images
- Priorité : override utilisateur > `plant.defaultImageUrl` (plant_images.json) > null
- `imageOverrides[id] = null` signifie que l'utilisateur a supprimé l'image (ne pas afficher le défaut)
- `imageOverrides[id]` absent = utiliser le défaut

### OpenRouter
- Les modèles gratuits changent fréquemment — liste récupérée dynamiquement via `/api/v1/models` filtré sur `pricing.prompt === '0'`
- Cache 1h dans localStorage (`jardinator_models_cache`)
- Streaming SSE via `askAIStream()` qui est un `async generator`

---

## 🐛 Bugs connus / limitations

| Problème | Statut | Notes |
|----------|--------|-------|
| Images auto-fetch non pertinentes | ✅ Résolu | Remplacé par ImagePicker manuel (Wikimedia search) |
| Migration ancien cache images | ✅ Résolu | `migrateOldCache()` dans imageService.js |
| Gemini API down | ✅ Résolu | Migré vers OpenRouter |
| Modèles OpenRouter hardcodés | ✅ Résolu | Fetch dynamique + cache 1h |
| localStorage limité à ~5MB | ⚠️ Limitation | Les images en data-URL volumineuses peuvent saturer |

---

## 📦 Packaging Debian

Le paquet `.deb` concerne **la version Python/PyQt6** uniquement.

```bash
# Construire le paquet
./build_deb.sh

# Installer
sudo dpkg -i jardinator_2.0.0_amd64.deb
```

La version web n'a pas de paquet .deb — elle se déploie en tant qu'application statique.

---

## 🔄 Dernière session — Ce sur quoi on travaillait

Enrichissement massif de la base de données plantes :
1. Ajout de variétés de Melon (demande initiale de l'utilisateur)
2. Ajout des variétés d'Asperge, Betterave, Aubergine
3. Ajout des variétés de Basilic, Carotte, Concombre, Fraise, Navet, Poivron, Pomme de terre
4. Ajout des céréales : Blé tendre, Blé dur, Blé noir, Épeautre, Petit épeautre

Ensuite : mise à jour README, requirements.txt, CONTEXT.md, bump version 2.0.0, build .deb, release GitHub.

---

## 🔮 Prochaines étapes possibles

- Progressive Web App (PWA) pour installation mobile
- Filtre par zone climatique (ex: USDA hardiness zones adaptées à l'Europe)
- Plan du potager interactif (drag & drop)
- Export PDF du calendrier annuel
- Rotation des cultures sur N années
