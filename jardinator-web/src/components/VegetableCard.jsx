import { GROUPE_COLORS, MONTH_LABELS } from '../services/vegetableService';
import useStore from '../store/useStore';

function getGroupeColor(groupe) {
  return GROUPE_COLORS[groupe] || '#78909C';
}

function formatMonths(months) {
  if (!months || months.length === 0) return null;
  return months.slice(0, 4).map(m => MONTH_LABELS[m]).join(', ') + (months.length > 4 ? '…' : '');
}

export default function VegetableCard({ plant, onClick }) {
  const color = getGroupeColor(plant.groupe);
  const harvestStr = formatMonths(plant.harvest);
  const initial = plant.name.charAt(0).toUpperCase();
  const getImageUrl = useStore(s => s.getImageUrl);
  // Re-render when overrides change
  useStore(s => s.imageOverrides[plant.id]);
  const imageUrl = getImageUrl(plant);
  const hasImage = typeof imageUrl === 'string' && !!imageUrl;

  return (
    <div className="vcard" onClick={() => onClick(plant)} title={plant.name}>
      <div
        className="vcard-img"
        style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)` }}
      >
        {hasImage ? (
          <img src={imageUrl} alt={plant.name} className="vcard-photo" />
        ) : (
          <span className="vcard-initial" style={{ color }}>{initial}</span>
        )}
      </div>
      <div className="vcard-body">
        <div className="vcard-name">{plant.name}</div>
        <div className="vcard-latin">{plant.nameLatin}</div>
        {plant.groupe && (
          <div className="vcard-badge" style={{ background: color + '22', color }}>
            {plant.groupe}
          </div>
        )}
        {harvestStr && (
          <div className="vcard-harvest">🌾 {harvestStr}</div>
        )}
      </div>
    </div>
  );
}
