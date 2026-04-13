import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { GROUPE_COLORS, MONTH_LABELS, ACTIVITY_COLORS } from '../services/vegetableService';
import ImagePicker from './ImagePicker';
import GeminiPanel from './GeminiPanel';
import AdvicePanel from './AdvicePanel';

const ALL_MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12];

function MonthCalendarGrid({ plant }) {
  return (
    <div className="month-grid">
      <div className="month-grid-header">
        {ALL_MONTHS.map(m => (
          <div key={m} className="month-col-label">{MONTH_LABELS[m]}</div>
        ))}
      </div>
      {[
        { key: 'sowingIndoor', ...ACTIVITY_COLORS.sowingIndoor },
        { key: 'sowingOutdoor', ...ACTIVITY_COLORS.sowingOutdoor },
        { key: 'planting', ...ACTIVITY_COLORS.planting },
        { key: 'harvest', ...ACTIVITY_COLORS.harvest },
      ].map(row => (
        <div key={row.key} className="month-grid-row">
          <div className="month-row-label" style={{ color: row.dot }}>{row.label}</div>
          <div className="month-cells">
            {ALL_MONTHS.map(m => {
              const active = plant[row.key].includes(m);
              return (
                <div
                  key={m}
                  className="month-cell"
                  style={active ? { background: row.bg, border: `1px solid ${row.border}` } : {}}
                  title={active ? `${row.label} en ${MONTH_LABELS[m]}` : ''}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="detail-section">
      <h3 className="detail-section-title">{title}</h3>
      {children}
    </div>
  );
}

function AssocList({ items, type }) {
  if (!items || items.length === 0) return <span className="no-data">—</span>;
  const color = type === 'favorable' ? '#2E7D32' : '#C62828';
  const bg = type === 'favorable' ? '#E8F5E9' : '#FFEBEE';
  return (
    <div className="assoc-list">
      {items.map(item => (
        <span key={item} className="assoc-tag" style={{ color, background: bg }}>{item}</span>
      ))}
    </div>
  );
}

export default function DetailModal() {
  const plant = useStore(s => s.selectedPlant);
  const closeDetail = useStore(s => s.closeDetail);
  const getImageUrl = useStore(s => s.getImageUrl);
  const imageOverrides = useStore(s => s.imageOverrides);
  const setImage = useStore(s => s.setImage);
  const removeImage = useStore(s => s.removeImage);
  const restoreDefault = useStore(s => s.restoreDefault);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [geminiOpen, setGeminiOpen] = useState(false);
  const [adviceOpen, setAdviceOpen] = useState(false);
  const savedAdvice = useStore(s => s.savedAdvice);
  const hasAdvice = plant ? !!savedAdvice[plant.id] : false;

  // Resolve image: user override > default > null
  // imageOverrides[id] = null means user deleted it; absent = use default
  const imageUrl = plant ? getImageUrl(plant) : null;
  const userDeleted = plant && (imageOverrides[plant.id] === null);

  useEffect(() => {
    if (!plant) { setPickerOpen(false); return; }
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (pickerOpen) setPickerOpen(false);
        else closeDetail();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [plant, closeDetail, pickerOpen]);

  if (!plant) return null;

  const groupeColor = GROUPE_COLORS[plant.groupe] || '#78909C';
  const initial = plant.name.charAt(0).toUpperCase();
  const hasImage = typeof imageUrl === 'string' && !!imageUrl;

  const hasSemisType = plant.typesSemis.poquet || plant.typesSemis.ligne ||
    plant.typesSemis.volee || plant.typesSemis.surface;

  const handleSelectImage = (url) => {
    setImage(plant.id, url);
    setPickerOpen(false);
  };

  return (
    <>
      <div className="modal-overlay" onClick={closeDetail}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={closeDetail}>✕</button>

          {/* Header */}
          <div className="detail-header">
            <div className="detail-img-wrapper">
              {hasImage ? (
                <>
                  <img
                    src={imageUrl}
                    alt={plant.name}
                    className="detail-photo"
                    onClick={() => setPickerOpen(true)}
                    title="Cliquer pour changer l'image"
                  />
                  <div className="detail-img-actions">
                    <button className="detail-img-change" onClick={() => setPickerOpen(true)}>
                      ✏️ Changer
                    </button>
                    <button className="detail-img-delete" onClick={() => removeImage(plant.id)}>
                      🗑 Supprimer
                    </button>
                  </div>
                </>
              ) : (
                <div
                  className="detail-img-placeholder"
                  style={{ background: `linear-gradient(135deg, ${groupeColor}22, ${groupeColor}55)` }}
                >
                  <span style={{ fontSize: '3rem', color: groupeColor }}>{initial}</span>
                  <button
                    className="placeholder-hint clickable"
                    onClick={() => setPickerOpen(true)}
                  >📷 Ajouter une image</button>
                  {userDeleted && plant.defaultImageUrl && (
                    <button
                      className="img-restore-btn"
                      onClick={() => restoreDefault(plant.id)}
                    >↩ Restaurer l'image</button>
                  )}
                </div>
              )}
            </div>

            <div className="detail-header-info">
              <div className="detail-name-row">
                <h2 className="detail-name">{plant.name}</h2>
                <div className="detail-ai-buttons">
                  {hasAdvice && (
                    <button
                      className="btn-advice"
                      onClick={() => setAdviceOpen(true)}
                      title="Voir les conseils de culture sauvegardés"
                    >
                      📋 Conseil IA
                    </button>
                  )}
                  <button
                    className="btn-gemini"
                    onClick={() => setGeminiOpen(true)}
                    title="Obtenir des conseils de culture par IA"
                  >
                    ✨ IA
                  </button>
                </div>
              </div>
              <div className="detail-latin">{plant.nameLatin}</div>
              <div className="detail-tags">
                {plant.groupe && (
                  <span className="detail-badge" style={{ background: groupeColor + '22', color: groupeColor, border: `1px solid ${groupeColor}66` }}>
                    {plant.groupe}
                  </span>
                )}
                {plant.family && (
                  <span className="detail-badge family-badge">{plant.family}</span>
                )}
                {plant.sol.bisannuelle && (
                  <span className="detail-badge bisannuelle-badge">Bisannuelle</span>
                )}
              </div>
              {plant.description && (
                <p className="detail-description">{plant.description}</p>
              )}
            </div>
          </div>

          <div className="detail-body">
            <Section title="📅 Calendrier de culture">
              <MonthCalendarGrid plant={plant} />
            </Section>

            <Section title="🌡️ Températures">
              <div className="temp-grid">
                <div className="temp-card outdoor">
                  <div className="temp-card-title">🌳 Plein air</div>
                  <div className="temp-range">
                    {plant.tempOutdoorMin !== null ? `${plant.tempOutdoorMin}°C` : '—'} —{' '}
                    {plant.tempOutdoorMax !== null ? `${plant.tempOutdoorMax}°C` : '—'}
                  </div>
                </div>
                <div className="temp-card greenhouse">
                  <div className="temp-card-title">🏠 Sous abri</div>
                  <div className="temp-range">
                    {plant.tempGreenhouseMin !== null ? `${plant.tempGreenhouseMin}°C` : '—'} —{' '}
                    {plant.tempGreenhouseMax !== null ? `${plant.tempGreenhouseMax}°C` : '—'}
                  </div>
                </div>
              </div>
            </Section>

            <Section title="🌿 Entretien">
              <InfoRow label="💧 Arrosage" value={plant.arrosage} />
              <InfoRow label="☀️ Exposition" value={plant.exposition} />
              <InfoRow label="⏱ Durée de croissance" value={plant.dureeCroissanceJours ? `${plant.dureeCroissanceJours} jours` : null} />
            </Section>

            {(plant.infos.profondeurSemisCm || plant.infos.germinationJoursMin || plant.infos.hauteurPlantsCm || plant.infos.faciliteGermination) && (
              <Section title="📋 Informations complémentaires">
                <InfoRow label="Profondeur de semis" value={plant.infos.profondeurSemisCm ? `${plant.infos.profondeurSemisCm} cm` : null} />
                <InfoRow
                  label="Germination"
                  value={plant.infos.germinationJoursMin
                    ? `${plant.infos.germinationJoursMin}–${plant.infos.germinationJoursMax || plant.infos.germinationJoursMin} jours`
                    : null}
                />
                <InfoRow label="Hauteur" value={plant.infos.hauteurPlantsCm ? `${plant.infos.hauteurPlantsCm} cm` : null} />
                <InfoRow label="Facilité germination" value={plant.infos.faciliteGermination} />
                <InfoRow label="Facilité culture" value={plant.infos.faciliteCulture} />
              </Section>
            )}

            {plant.sousVarietes.length > 0 && (
              <Section title="🌿 Sous-variétés">
                <div className="sous-varietes-list">
                  {plant.sousVarietes.map(v => (
                    <span key={v} className="sous-variete-tag">{v}</span>
                  ))}
                </div>
              </Section>
            )}

            {hasSemisType && (
              <Section title="🌱 Type de semis">
                <div className="semis-types">
                  {plant.typesSemis.poquet && <span className="semis-tag">En poquet</span>}
                  {plant.typesSemis.ligne && <span className="semis-tag">En ligne</span>}
                  {plant.typesSemis.volee && <span className="semis-tag">À la volée</span>}
                  {plant.typesSemis.surface && <span className="semis-tag">En surface</span>}
                </div>
              </Section>
            )}

            {(plant.sol.typeSol.length > 0 || plant.sol.compostType) && (
              <Section title="🪱 Sol et compost">
                {plant.sol.typeSol.length > 0 && (
                  <InfoRow label="Type de sol" value={plant.sol.typeSol.join(', ')} />
                )}
                <InfoRow label="Compost" value={plant.sol.compostType} />
              </Section>
            )}

            {(plant.distances.distanceRangCm || plant.distances.distanceRangsCm || plant.distances.eclaircissageCm) && (
              <Section title="📏 Distances de plantation">
                <InfoRow label="Entre les plants" value={plant.distances.distanceRangCm ? `${plant.distances.distanceRangCm} cm` : null} />
                <InfoRow label="Entre les rangs" value={plant.distances.distanceRangsCm ? `${plant.distances.distanceRangsCm} cm` : null} />
                <InfoRow label="Éclaircissage" value={plant.distances.eclaircissageCm ? `${plant.distances.eclaircissageCm} cm` : null} />
              </Section>
            )}

            {(plant.associations.favorables.length > 0 || plant.associations.defavorables.length > 0) && (
              <Section title="🤝 Associations de plantes">
                <div className="assoc-row">
                  <div className="assoc-group">
                    <div className="assoc-group-title" style={{ color: '#2E7D32' }}>✅ Favorables</div>
                    <AssocList items={plant.associations.favorables} type="favorable" />
                  </div>
                  <div className="assoc-group">
                    <div className="assoc-group-title" style={{ color: '#C62828' }}>❌ Défavorables</div>
                    <AssocList items={plant.associations.defavorables} type="defavorable" />
                  </div>
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>

      {pickerOpen && (
        <ImagePicker
          plant={plant}
          onSelect={handleSelectImage}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {geminiOpen && (
        <GeminiPanel
          plant={plant}
          onClose={() => setGeminiOpen(false)}
        />
      )}

      {adviceOpen && (
        <AdvicePanel
          plant={plant}
          onClose={() => setAdviceOpen(false)}
          onRegenerate={() => { setAdviceOpen(false); setGeminiOpen(true); }}
        />
      )}
    </>
  );
}
