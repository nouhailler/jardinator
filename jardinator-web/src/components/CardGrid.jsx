import VegetableCard from './VegetableCard';
import useStore from '../store/useStore';

export default function CardGrid() {
  const plants = useStore(s => s.plants);
  const openDetail = useStore(s => s.openDetail);

  if (plants.length === 0) {
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
