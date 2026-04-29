const PLANT_TABS = ['all', 'now', 'printemps', 'ete', 'automne', 'hiver', 'favorites'];

const HELP_CONTENT = {
  plants: {
    title: 'Naviguer dans les plantes',
    sections: [
      {
        icon: '🔍',
        title: 'Recherche & filtres',
        text: 'Utilisez la barre de recherche pour trouver une plante par nom. Les filtres Groupe, Famille et Zone climatique permettent d\'affiner les résultats.',
      },
      {
        icon: '🌿',
        title: 'Cartes plantes',
        text: 'Cliquez sur une carte pour voir tous les détails : périodes de semis, associations bénéfiques, besoins en sol, variétés disponibles, conseils IA.',
      },
      {
        icon: '📅',
        title: 'Onglets saisonniers',
        text: 'Les onglets Printemps/Été/Automne/Hiver filtrent les plantes selon leur période de récolte. \'Ce mois\' affiche uniquement les plantes actives ce mois-ci.',
      },
      {
        icon: '🤖',
        title: 'Conseils IA',
        text: 'Sur chaque carte détaillée, le bouton IA génère des conseils personnalisés via OpenRouter. Les conseils sont sauvegardés et accessibles hors ligne.',
      },
    ],
  },
  calendar: {
    title: 'Calendrier du jardinier',
    sections: [
      {
        icon: '📆',
        title: 'Navigation',
        text: 'Utilisez les flèches pour changer de mois. Chaque ligne représente une plante, chaque colonne un mois.',
      },
      {
        icon: '🎨',
        title: 'Couleurs',
        text: 'Vert = récolte, Bleu = semis/plantation, Orange = entretien. Les barres indiquent les périodes actives.',
      },
      {
        icon: '📄',
        title: 'Export PDF',
        text: 'Le bouton PDF en haut génère un calendrier imprimable pour le mois affiché.',
      },
    ],
  },
  potager: {
    title: 'Planificateur de potager',
    sections: [
      {
        icon: '➕',
        title: 'Créer une planche',
        text: 'Cliquez sur "+ Nouvelle planche" pour créer une zone de culture. Définissez le nom, le nombre de rangées et colonnes. Chaque cellule représente une unité de plantation.',
      },
      {
        icon: '🌱',
        title: 'Placer une plante',
        text: 'Cliquez sur une cellule vide pour y affecter une plante. Choisissez parmi le catalogue complet (220+ variétés) ou vos fiches personnalisées. Vous pouvez ajouter des notes par cellule.',
      },
      {
        icon: '📜',
        title: 'Historique des cultures',
        text: 'L\'historique par cellule enregistre quelle plante occupait chaque emplacement chaque année. Des alertes de rotation signalent les successions défavorables.',
      },
      {
        icon: '⚠️',
        title: 'Alertes de compagnonnage',
        text: 'Le panneau "Compagnonnage & Biodiversité" (colonne de droite) détecte en temps réel les associations défavorables entre plantes voisines (8 directions). Les cellules en conflit s\'affichent en rouge pulsant. Des alternatives favorables sont proposées pour chaque conflit.',
      },
      {
        icon: '🌿',
        title: 'Bonnes associations',
        text: 'Les cellules avec des voisins favorables s\'affichent en vert. L\'onglet "Compagnonnage" liste tous les conflits (🔴) et toutes les harmonies (🟢) de la planche, avec les noms de plantes concernées.',
      },
      {
        icon: '🧮',
        title: 'Score de biodiversité',
        text: 'L\'onglet "Biodiversité" calcule un score 0-100 basé sur : richesse en espèces (max 35 pts), diversité des familles botaniques (25 pts), diversité des groupes (20 pts), taux de remplissage (10 pts), bonus harmonies (10 pts), pénalité conflits (−30 pts max).',
      },
      {
        icon: '🤖',
        title: 'Analyse IA du potager',
        text: 'L\'onglet "Analyse IA" génère une analyse structurée par IA : bilan global, corrections prioritaires pour chaque conflit, recommandations biodiversité. Fonctionne avec Ollama (local) ou OpenRouter (cloud). La réponse arrive en streaming.',
      },
      {
        icon: '📊',
        title: 'Historique IA potager',
        text: 'Cliquez "💾 Sauvegarder cette analyse" pour archiver le résultat IA avec le score, la date et la liste des plantes. L\'onglet "Historique" permet de comparer l\'évolution de votre potager dans le temps. Max 50 entrées conservées.',
      },
    ],
  },
  chat: {
    title: 'Chat IA',
    sections: [
      {
        icon: '🖥️',
        title: 'Ollama (local)',
        text: 'Ollama fait tourner un modèle IA sur votre propre machine. Installez Ollama (ollama.com), téléchargez un modèle (ex: ollama pull mistral), puis configurez l\'URL dans Paramètres.',
      },
      {
        icon: '☁️',
        title: 'OpenRouter (cloud)',
        text: 'OpenRouter donne accès à des modèles gratuits en ligne. Créez un compte sur openrouter.ai, obtenez une clé API gratuite, et configurez-la dans Paramètres.',
      },
      {
        icon: '💡',
        title: 'Suggestions',
        text: 'Le bouton 💡 Suggestions propose 120 questions prêtes-à-envoyer organisées en 20 catégories de jardinage.',
      },
      {
        icon: '📋',
        title: 'Historique',
        text: 'Chaque réponse est sauvegardée automatiquement avec la date et le modèle. Cliquez sur une entrée dans l\'historique pour la relire.',
      },
      {
        icon: '⌨️',
        title: 'Raccourci',
        text: 'Ctrl+Entrée (ou Cmd+Entrée sur Mac) envoie directement la question.',
      },
    ],
  },
  diagnostic: {
    title: 'Diagnostic phytosanitaire',
    sections: [
      {
        icon: '📷',
        title: 'Importer une photo',
        text: 'Glissez-déposez une photo ou cliquez pour la sélectionner. Prenez une photo nette des feuilles ou zones malades, bien éclairée.',
      },
      {
        icon: '🔬',
        title: 'Analyser',
        text: 'Indiquez optionnellement le nom de la plante, puis cliquez sur "Analyser la photo". L\'IA identifie maladies, carences, ravageurs et propose des remèdes biologiques.',
      },
      {
        icon: '🤖',
        title: 'Modèles vision',
        text: 'Utilisez un modèle vision : LLaVA ou BakLLaVA pour Ollama, GPT-4o ou Claude pour OpenRouter. Les modèles texte seuls ne peuvent pas analyser des images.',
      },
      {
        icon: '📋',
        title: 'Historique',
        text: 'Chaque diagnostic est sauvegardé avec sa photo (IndexedDB) et le résultat. Cliquez sur une entrée pour la consulter à nouveau ou relancer une analyse.',
      },
    ],
  },
  identification: {
    title: 'Identification de plante',
    sections: [
      {
        icon: '🌿',
        title: 'Photo à identifier',
        text: 'Importez une photo d\'une feuille, fleur, branche ou écorce. Une image nette sur fond neutre donne les meilleurs résultats.',
      },
      {
        icon: '📍',
        title: 'Indice contextuel',
        text: 'Ajoutez un indice (lieu, région, altitude, saison) pour affiner l\'identification. Ex: "Forêt tempérée, France, feuille caduque".',
      },
      {
        icon: '🔍',
        title: 'Résultat',
        text: 'L\'IA donne le nom commun, nom latin, famille botanique, habitat et usages connus. Si plusieurs espèces sont possibles, elles sont classées par probabilité.',
      },
      {
        icon: '💾',
        title: 'Sauvegarder le nom',
        text: 'Une fois la plante identifiée, tapez son nom dans le champ et cliquez 💾 pour l\'associer à l\'entrée de l\'historique.',
      },
    ],
  },
  inputs: {
    title: 'Intrants & Compost',
    sections: [
      {
        icon: '♻️',
        title: 'Calculateur de compost',
        text: 'Saisissez votre surface de potager et les quantités annuelles de déchets verts et bruns. L\'outil calcule la production de compost estimée, compare avec vos besoins et indique si le ratio vert/brun est équilibré.',
      },
      {
        icon: '🟢',
        title: 'Matières vertes vs brunes',
        text: 'Matières vertes (azotées) : tontes, épluchures, résidus de récolte. Matières brunes (carbonées) : feuilles mortes, broyat, paille, carton. Le ratio idéal est entre 0,5 et 2 (en poids).',
      },
      {
        icon: '🌿',
        title: 'Journal des traitements bio',
        text: 'Enregistrez chaque application de traitement naturel : date, traitement (purin d\'ortie, décoction de prêle…), plante ciblée, dilution, méthode et efficacité perçue (1-5 étoiles).',
      },
      {
        icon: '🏆',
        title: 'Base de connaissance empirique',
        text: 'Le résumé "Top traitements" en haut du journal agrège l\'efficacité moyenne de chaque traitement. Vous construisez progressivement votre propre référentiel bio basé sur votre expérience terrain.',
      },
    ],
  },
  yields: {
    title: 'Suivi des rendements',
    sections: [
      {
        icon: '➕',
        title: 'Ajouter une entrée',
        text: 'Cliquez sur "➕ Ajouter une plante" pour créer une ligne. Renseignez la plante, la variété, la quantité plantée et la récolte obtenue.',
      },
      {
        icon: '📅',
        title: 'Navigation par année',
        text: 'Sélectionnez l\'année pour voir ou saisir les rendements correspondants. Les années passées sans données restent accessibles via le menu déroulant.',
      },
      {
        icon: '✨',
        title: 'Suggestion IA',
        text: 'Pour chaque entrée complète, le bouton "✨ Suggestion IA" génère une recommandation personnalisée pour améliorer la récolte l\'année suivante.',
      },
      {
        icon: '✏️',
        title: 'Édition inline',
        text: 'Tous les champs sont éditables directement dans le tableau : cliquez et modifiez. Les changements sont sauvegardés automatiquement à chaque modification.',
      },
    ],
  },
  settings: {
    title: 'Paramètres',
    sections: [
      {
        icon: '🖥️',
        title: 'Ollama',
        text: 'Entrez l\'URL de votre serveur Ollama (par défaut: http://localhost:11434). Cliquez \'Tester & charger\' pour détecter automatiquement les modèles installés. Cliquez \'Enregistrer Ollama\' pour sauvegarder.',
      },
      {
        icon: '☁️',
        title: 'OpenRouter',
        text: 'Entrez votre clé API OpenRouter (format: sk-or-v1-...). Cliquez \'Charger modèles gratuits\' pour voir les modèles disponibles sans frais. Changez de modèle à tout moment.',
      },
      {
        icon: '🔑',
        title: 'Clé API',
        text: 'Votre clé API est stockée uniquement dans votre navigateur (localStorage). Elle n\'est jamais envoyée à nos serveurs.',
      },
    ],
  },
  meteo: {
    title: 'Widget Météo & Agro-météo',
    sections: [
      {
        icon: '🌡️',
        title: 'Météo en temps réel',
        text: 'Saisissez une ville dans la barre de recherche météo (en haut à droite). Les températures actuelles et les prévisions 7 jours sont récupérées via Open-Meteo (sans clé API). Le double curseur filtre automatiquement les plantes adaptées à la plage de températures.',
      },
      {
        icon: '🤖',
        title: 'Recommandations IA météo',
        text: 'La section "Recommandations agro-météo" génère en streaming des conseils pratiques adaptés à la météo du jour : quand semer, arroser, protéger. Format [contexte météo] → [action à faire]. Résultat sauvegardé automatiquement.',
      },
      {
        icon: '📈',
        title: 'Journal climatique 30 jours',
        text: 'La section "Journal climatique" affiche les 30 derniers jours de températures (min/max/moyenne) sous forme de frise chronologique. Les événements notables sont signalés : gel, canicule, seuils critiques pour vos plantes.',
      },
    ],
  },
  general: {
    title: 'Aide générale',
    sections: [
      {
        icon: '🌱',
        title: 'Bienvenue dans Jardinator',
        text: 'Jardinator est votre compagnon de jardinage : explorez 220+ variétés de plantes, consultez le calendrier, planifiez votre potager avec analyse IA et obtenez des conseils personnalisés.',
      },
      {
        icon: '🧭',
        title: 'Navigation',
        text: 'Utilisez les onglets en haut pour naviguer : Plantes, Calendrier 📆, Potager 🪴, Chat IA 💬, Diagnostic 🔬, Identification 🌿, Rendements 🌾, Intrants ♻️, Paramètres ⚙️.',
      },
      {
        icon: '🌡️',
        title: 'Widget Météo',
        text: 'Le bouton 🌡️ dans la barre du haut ouvre le widget météo : température actuelle, prévisions 7j, recommandations agro-météo IA et journal climatique 30 jours. Saisissez votre ville pour localiser les prévisions.',
      },
      {
        icon: '❓',
        title: 'Aide contextuelle',
        text: 'Ce panneau d\'aide s\'adapte à l\'onglet actif. Cliquez le bouton ❓ depuis n\'importe quelle page pour obtenir l\'aide spécifique à ce contexte.',
      },
      {
        icon: '💾',
        title: 'Vos données',
        text: 'Toutes vos données sont stockées localement dans votre navigateur (localStorage / IndexedDB). Utilisez le bouton Exporter dans la barre de navigation pour créer une sauvegarde complète (images + conseils IA + historiques).',
      },
    ],
  },
};

function getContent(activeTab) {
  if (PLANT_TABS.includes(activeTab)) return HELP_CONTENT.plants;
  if (activeTab === 'calendar') return HELP_CONTENT.calendar;
  if (activeTab === 'potager') return HELP_CONTENT.potager;
  if (activeTab === 'chat') return HELP_CONTENT.chat;
  if (activeTab === 'diagnostic') return HELP_CONTENT.diagnostic;
  if (activeTab === 'identification') return HELP_CONTENT.identification;
  if (activeTab === 'yields') return HELP_CONTENT.yields;
  if (activeTab === 'inputs') return HELP_CONTENT.inputs;
  if (activeTab === 'settings') return HELP_CONTENT.settings;
  return HELP_CONTENT.general;
}

export default function HelpPanel({ isOpen, onClose, activeTab }) {
  if (!isOpen) return null;

  const content = getContent(activeTab);

  return (
    <>
      <div className="help-overlay" onClick={onClose} />
      <div className="help-panel" role="dialog" aria-modal="true" aria-label="Aide">
        <div className="help-panel-header">
          <span className="help-panel-title">Aide — {content.title}</span>
          <button className="help-panel-close" onClick={onClose} title="Fermer" type="button">
            ✕
          </button>
        </div>
        <div className="help-panel-body">
          {content.sections.map((section, i) => (
            <div className="help-section" key={i}>
              <div className="help-section-title">
                <span>{section.icon}</span>
                <span>{section.title}</span>
              </div>
              <p className="help-section-text">{section.text}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
