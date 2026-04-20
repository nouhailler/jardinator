const PLANT_TABS = ['all', 'now', 'printemps', 'ete', 'automne', 'hiver'];

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
        text: 'Cliquez sur \'+ Nouvelle planche\' pour créer une zone de culture. Définissez le nom, le nombre de rangées et colonnes.',
      },
      {
        icon: '🌱',
        title: 'Placer une plante',
        text: 'Cliquez sur une cellule de la grille pour y affecter une plante. Vous pouvez ajouter des notes par cellule.',
      },
      {
        icon: '📜',
        title: 'Historique',
        text: 'L\'historique des cultures par cellule vous aide à pratiquer la rotation des cultures d\'une année sur l\'autre.',
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
  general: {
    title: 'Aide générale',
    sections: [
      {
        icon: '🌱',
        title: 'Bienvenue dans Jardinator',
        text: 'Jardinator est votre compagnon de jardinage : explorez les plantes, consultez le calendrier, planifiez votre potager et obtenez des conseils IA personnalisés.',
      },
      {
        icon: '🧭',
        title: 'Navigation',
        text: 'Utilisez les onglets en haut pour naviguer entre les différentes sections : Plantes, Calendrier, Potager, Chat IA et Paramètres.',
      },
    ],
  },
};

function getContent(activeTab) {
  if (PLANT_TABS.includes(activeTab)) return HELP_CONTENT.plants;
  if (activeTab === 'calendar') return HELP_CONTENT.calendar;
  if (activeTab === 'potager') return HELP_CONTENT.potager;
  if (activeTab === 'chat') return HELP_CONTENT.chat;
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
