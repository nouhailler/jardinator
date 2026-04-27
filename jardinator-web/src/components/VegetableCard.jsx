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
  const getImageUrl  = useStore(s => s.getImageUrl);
  const adviceText   = useStore(s => s.savedAdvice[plant.id] || null);
  const isFav        = useStore(s => s.favorites.has(plant.name));
  // Re-render when overrides change
  useStore(s => s.imageOverrides[plant.id]);
  const imageUrl = getImageUrl(plant);
  const hasImage = typeof imageUrl === 'string' && !!imageUrl;

  return (
    <div className="vcard" onClick={() => onClick(plant)} title={plant.name} style={{ position: 'relative' }}>
      {plant.isCustom && <span className="card-custom-badge">✦ Ma fiche</span>}
      <div
        className="vcard-img"
        style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)` }}
      >
        {hasImage ? (
          <img src={imageUrl} alt={plant.name} className="vcard-photo" />
        ) : (
          <span className="vcard-initial" style={{ color }}>{initial}</span>
        )}
        {isFav && <span className="card-fav-star" title="Favori">★</span>}
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
        {adviceText && (
          <span className="vcard-ai-badge">
            🤖 Conseil IA
            <span className="vcard-ai-tooltip">
              {adviceText
                .replace(/#{1,6}\s*/g, '')   // strip headings
                .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')  // strip bold/italic
                .replace(/`[^`]*`/g, '')     // strip code
                .replace(/\n+/g, ' ')        // collapse newlines
                .trim()
                .slice(0, 180)
                + (adviceText.length > 180 ? '…' : '')}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
