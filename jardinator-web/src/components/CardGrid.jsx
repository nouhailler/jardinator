import VegetableCard from './VegetableCard';
import useStore from '../store/useStore';

export default function CardGrid() {
  const plants    = useStore(s => s.plants);
  const activeTab = useStore(s => s.activeTab);
  const setTab    = useStore(s => s.setTab);
  const openDetail = useStore(s => s.openDetail);

  if (plants.length === 0) {
    if (activeTab === 'favorites') {
      return (
        <div className="fav-empty">
          <div className="fav-empty-icon">☆</div>
          <h3>Aucun favori pour l'instant</h3>
          <p>
            Ouvrez la fiche d'une plante et cliquez sur l'étoile ★ pour l'ajouter à vos favoris.
          </p>
          <button
            className="np-btn np-btn-secondary"
            style={{ marginTop: 8 }}
            onClick={() => setTab('all')}
          >
            🌿 Voir toutes les plantes
          </button>
        </div>
      );
    }
    return (
      <div className="empty-state">
        <div className="empty-icon">🌱</div>
        <div>Aucune plante trouvée pour ces critères.</div>
      </div>
    );
  }

  return (
    <div className="card-grid">
      {plants.map(plant => (
        <VegetableCard key={plant.id} plant={plant} onClick={openDetail} />
      ))}
    </div>
  );
}
