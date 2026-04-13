import { useState, useRef } from 'react';
import useStore from '../store/useStore';
import { getAllPlants, GROUPE_COLORS } from '../services/vegetableService';
import { getCellHistory } from '../services/gardenService';

const CURRENT_YEAR = new Date().getFullYear();

// ─── Plant picker search ───────────────────────────────────────────────────
function PlantPicker({ onSelect, onClose }) {
  const [q, setQ] = useState('');
  const allPlants = getAllPlants();
  const filtered = q.trim()
    ? allPlants.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.nameLatin.toLowerCase().includes(q.toLowerCase()))
    : allPlants.slice(0, 40);

  return (
    <div className="gp-picker-overlay" onClick={onClose}>
      <div className="gp-picker" onClick={e => e.stopPropagation()}>
        <div className="gp-picker-header">
          <span>🌱 Choisir une plante</span>
          <button className="gp-close-btn" onClick={onClose}>✕</button>
        </div>
        <input
          className="gp-picker-search"
          autoFocus
          placeholder="🔍 Rechercher..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <div className="gp-picker-list">
          {filtered.map(p => {
            const color = GROUPE_COLORS[p.groupe] || '#78909C';
            return (
              <button key={p.id} className="gp-picker-item" onClick={() => onSelect(p.id)}>
                <span className="gp-picker-dot" style={{ background: color }} />
                <span className="gp-picker-name">{p.name}</span>
                <span className="gp-picker-latin">{p.nameLatin}</span>
              </button>
            );
          })}
          {filtered.length === 0 && <p className="gp-empty">Aucune plante trouvée</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Cell detail panel ─────────────────────────────────────────────────────
function CellPanel({ bed, row, col, onClose }) {
  const { setPlantInCell, removePlantFromCell, updateCellNotes, cropHistory, addCropRecord, removeCropRecord, openDetail } = useStore();
  const allPlants = getAllPlants();
  const cellKey = `${row}-${col}`;
  const cell = bed.cells[cellKey];
  const plant = cell ? allPlants.find(p => p.id === cell.plantId) : null;
  const history = getCellHistory(cropHistory, bed.id, cellKey);
  const [showPicker, setShowPicker] = useState(!cell);
  const [notes, setNotes] = useState(cell?.notes || '');
  const [histNotes, setHistNotes] = useState('');

  const handlePickPlant = (plantId) => {
    setPlantInCell(bed.id, row, col, plantId);
    // Also save to history
    addCropRecord(bed.id, cellKey, plantId, notes, CURRENT_YEAR);
    setShowPicker(false);
  };

  const handleRemove = () => {
    removePlantFromCell(bed.id, row, col);
    onClose();
  };

  const handleSaveNotes = () => {
    updateCellNotes(bed.id, row, col, notes);
    if (cell) addCropRecord(bed.id, cellKey, cell.plantId, notes, CURRENT_YEAR);
  };

  // Rotation warnings: check if any plant in adjacent cells is defavorable
  const getRotationWarnings = () => {
    if (!plant) return [];
    const warnings = [];
    // Check history: what was grown here before?
    history.slice(1).forEach(record => {
      const pastPlant = allPlants.find(p => p.id === record.plantId);
      if (!pastPlant) return;
      if (plant.associations.defavorables.includes(pastPlant.name)) {
        warnings.push(`⚠️ ${pastPlant.name} (${record.year}) est défavorable à ${plant.name}`);
      }
    });
    return warnings;
  };

  const warnings = getRotationWarnings();

  if (showPicker) {
    return <PlantPicker onSelect={handlePickPlant} onClose={onClose} />;
  }

  return (
    <div className="gp-cell-panel">
      <div className="gp-cell-panel-header">
        <span>📍 Parcelle {col + 1}×{row + 1}</span>
        <button className="gp-close-btn" onClick={onClose}>✕</button>
      </div>

      {plant ? (
        <>
          <div className="gp-cell-plant-info">
            <span className="gp-cell-plant-dot" style={{ background: GROUPE_COLORS[plant.groupe] || '#78909C' }} />
            <div>
              <strong>{plant.name}</strong>
              <div className="gp-cell-latin">{plant.nameLatin}</div>
              {cell?.plantedDate && <div className="gp-cell-date">Planté le {cell.plantedDate}</div>}
            </div>
            <button className="gp-btn-outline" onClick={() => openDetail(plant)} title="Voir la fiche complète">📋</button>
          </div>

          {warnings.length > 0 && (
            <div className="gp-rotation-warnings">
              {warnings.map((w, i) => <div key={i} className="gp-warning-item">{w}</div>)}
            </div>
          )}

          <div className="gp-notes-section">
            <label className="gp-label">📝 Notes</label>
            <textarea
              className="gp-notes-input"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observations, rendement, traitements…"
              rows={3}
            />
            <button className="gp-btn-primary" onClick={handleSaveNotes}>Enregistrer</button>
          </div>

          <div className="gp-cell-actions">
            <button className="gp-btn-secondary" onClick={() => setShowPicker(true)}>🔄 Changer</button>
            <button className="gp-btn-danger" onClick={handleRemove}>🗑 Retirer</button>
          </div>

          {history.length > 0 && (
            <div className="gp-history-section">
              <div className="gp-label">📅 Historique des cultures</div>
              {history.map(record => {
                const hp = allPlants.find(p => p.id === record.plantId);
                return (
                  <div key={record.year} className="gp-history-row">
                    <span className="gp-history-year">{record.year}</span>
                    <span className="gp-history-plant">{hp?.name || '—'}</span>
                    {record.notes && <span className="gp-history-notes">{record.notes}</span>}
                    <button
                      className="gp-history-del"
                      onClick={() => removeCropRecord(bed.id, cellKey, record.year)}
                      title="Supprimer cet enregistrement"
                    >✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="gp-empty-cell-msg">
          <p>Aucune plante sur cette parcelle.</p>
          <button className="gp-btn-primary" onClick={() => setShowPicker(true)}>🌱 Planter ici</button>
        </div>
      )}
    </div>
  );
}

// ─── Bed Editor ───────────────────────────────────────────────────────────
function BedGrid({ bed }) {
  const { setPlantInCell, imageOverrides } = useStore();
  const allPlants = getAllPlants();
  const [selectedCell, setSelectedCell] = useState(null); // { row, col }
  const [dragOver, setDragOver] = useState(null);
  const [dragging, setDragging] = useState(null); // { row, col }

  const handleCellClick = (row, col) => {
    if (selectedCell?.row === row && selectedCell?.col === col) {
      setSelectedCell(null);
    } else {
      setSelectedCell({ row, col });
    }
  };

  const handleDragStart = (e, row, col) => {
    const cell = bed.cells[`${row}-${col}`];
    if (!cell) { e.preventDefault(); return; }
    setDragging({ row, col });
    e.dataTransfer.setData('text/plain', JSON.stringify({ row, col, plantId: cell.plantId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, row, col) => {
    e.preventDefault();
    setDragOver(null);
    const data = JSON.parse(e.dataTransfer.getData('text/plain') || 'null');
    if (!data) return;
    setPlantInCell(bed.id, row, col, data.plantId);
    // Remove from source if different cell
    if (data.row !== row || data.col !== col) {
      const { removePlantFromCell } = useStore.getState();
      removePlantFromCell(bed.id, data.row, data.col);
    }
    setDragging(null);
  };

  return (
    <div className="gp-bed-wrapper">
      <div
        className="gp-grid"
        style={{ gridTemplateColumns: `repeat(${bed.cols}, 1fr)` }}
      >
        {Array.from({ length: bed.rows }, (_, row) =>
          Array.from({ length: bed.cols }, (_, col) => {
            const cellKey = `${row}-${col}`;
            const cell = bed.cells[cellKey];
            const plant = cell ? allPlants.find(p => p.id === cell.plantId) : null;
            const color = plant ? (GROUPE_COLORS[plant.groupe] || '#78909C') : null;
            const isSelected = selectedCell?.row === row && selectedCell?.col === col;
            const isDragTarget = dragOver?.row === row && dragOver?.col === col;
            const isDragging = dragging?.row === row && dragging?.col === col;

            return (
              <div
                key={cellKey}
                className={`gp-cell ${plant ? 'occupied' : 'empty'} ${isSelected ? 'selected' : ''} ${isDragTarget ? 'drag-over' : ''} ${isDragging ? 'dragging' : ''}`}
                style={plant ? { background: color + '22', borderColor: color + '88' } : {}}
                onClick={() => handleCellClick(row, col)}
                draggable={!!cell}
                onDragStart={e => handleDragStart(e, row, col)}
                onDragOver={e => { e.preventDefault(); setDragOver({ row, col }); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => handleDrop(e, row, col)}
              >
                {plant ? (
                  <div className="gp-cell-content">
                    <span className="gp-cell-dot" style={{ background: color }} />
                    <span className="gp-cell-name">{plant.name}</span>
                  </div>
                ) : (
                  <span className="gp-cell-add">+</span>
                )}
              </div>
            );
          })
        )}
      </div>

      {selectedCell && (
        <div className="gp-cell-panel-container">
          <CellPanel
            bed={bed}
            row={selectedCell.row}
            col={selectedCell.col}
            onClose={() => setSelectedCell(null)}
          />
        </div>
      )}
    </div>
  );
}

// ─── New Bed Form ──────────────────────────────────────────────────────────
function NewBedForm({ onAdd, onClose }) {
  const [name, setName] = useState('Ma planche');
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(6);
  const [cellSize, setCellSize] = useState(0.5);

  return (
    <div className="gp-new-bed-form">
      <h4 className="gp-form-title">🪴 Nouvelle planche</h4>
      <label className="gp-label">Nom</label>
      <input className="gp-input" value={name} onChange={e => setName(e.target.value)} maxLength={40} />

      <div className="gp-form-row">
        <div>
          <label className="gp-label">Rangs (hauteur)</label>
          <input className="gp-input gp-input-sm" type="number" min={1} max={20} value={rows} onChange={e => setRows(+e.target.value)} />
        </div>
        <div>
          <label className="gp-label">Colonnes (largeur)</label>
          <input className="gp-input gp-input-sm" type="number" min={1} max={20} value={cols} onChange={e => setCols(+e.target.value)} />
        </div>
        <div>
          <label className="gp-label">Taille case (m)</label>
          <input className="gp-input gp-input-sm" type="number" min={0.1} max={2} step={0.1} value={cellSize} onChange={e => setCellSize(+e.target.value)} />
        </div>
      </div>
      <p className="gp-dim-preview">Surface : {(rows * cellSize).toFixed(1)} m × {(cols * cellSize).toFixed(1)} m = {(rows * cols * cellSize * cellSize).toFixed(1)} m²</p>

      <div className="gp-form-actions">
        <button className="gp-btn-primary" onClick={() => onAdd(name, rows, cols, cellSize)}>Créer</button>
        <button className="gp-btn-outline" onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
}

// ─── Legend ────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="gp-legend">
      {Object.entries(GROUPE_COLORS).map(([groupe, color]) => (
        <span key={groupe} className="gp-legend-item">
          <span className="gp-legend-dot" style={{ background: color }} />
          {groupe}
        </span>
      ))}
    </div>
  );
}

// ─── Main GardenPlanner Component ─────────────────────────────────────────
export default function GardenPlanner() {
  const { gardenBeds, activeGardenBedId, setActiveGardenBed, addGardenBed, removeGardenBed } = useStore();
  const [showNewForm, setShowNewForm] = useState(gardenBeds.length === 0);

  const activeBed = gardenBeds.find(b => b.id === activeGardenBedId) || null;

  const handleAddBed = (name, rows, cols, cellSize) => {
    addGardenBed(name, rows, cols, cellSize);
    setShowNewForm(false);
  };

  const handleRemoveBed = (bedId) => {
    if (!confirm('Supprimer cette planche et tout son contenu ?')) return;
    removeGardenBed(bedId);
  };

  return (
    <div className="gp-container">
      {/* ── Sidebar ── */}
      <div className="gp-sidebar">
        <div className="gp-sidebar-header">
          <span className="gp-sidebar-title">🪴 Planches</span>
          <button className="gp-add-btn" onClick={() => setShowNewForm(true)} title="Nouvelle planche">+</button>
        </div>

        {gardenBeds.map(bed => (
          <div
            key={bed.id}
            className={`gp-bed-item ${bed.id === activeGardenBedId ? 'active' : ''}`}
            onClick={() => { setActiveGardenBed(bed.id); setShowNewForm(false); }}
          >
            <div className="gp-bed-item-info">
              <span className="gp-bed-item-name">{bed.name}</span>
              <span className="gp-bed-item-size">{bed.rows}×{bed.cols} — {(bed.rows * bed.cols * bed.cellSizeM * bed.cellSizeM).toFixed(1)} m²</span>
              <span className="gp-bed-item-count">
                {Object.keys(bed.cells).length}/{bed.rows * bed.cols} cases occupées
              </span>
            </div>
            <button
              className="gp-bed-del-btn"
              onClick={e => { e.stopPropagation(); handleRemoveBed(bed.id); }}
              title="Supprimer"
            >🗑</button>
          </div>
        ))}

        {gardenBeds.length === 0 && !showNewForm && (
          <p className="gp-sidebar-empty">Aucune planche. Créez-en une !</p>
        )}

        {showNewForm && (
          <NewBedForm onAdd={handleAddBed} onClose={() => setShowNewForm(gardenBeds.length === 0)} />
        )}
      </div>

      {/* ── Main area ── */}
      <div className="gp-main">
        {activeBed && !showNewForm ? (
          <>
            <div className="gp-bed-header">
              <div>
                <h2 className="gp-bed-title">{activeBed.name}</h2>
                <span className="gp-bed-subtitle">
                  {activeBed.rows} rangs × {activeBed.cols} colonnes — cases de {activeBed.cellSizeM}m — {(activeBed.rows * activeBed.cellSizeM).toFixed(1)}m × {(activeBed.cols * activeBed.cellSizeM).toFixed(1)}m
                </span>
              </div>
              <div className="gp-bed-header-actions">
                <span className="gp-tip">💡 Cliquez sur une case pour planter · Glissez pour déplacer</span>
              </div>
            </div>
            <BedGrid bed={activeBed} />
            <Legend />
          </>
        ) : !showNewForm ? (
          <div className="gp-empty-state">
            <div className="gp-empty-icon">🌿</div>
            <h3>Bienvenue dans le plan du potager</h3>
            <p>Créez votre première planche pour commencer à planifier vos cultures.</p>
            <button className="gp-btn-primary gp-btn-lg" onClick={() => setShowNewForm(true)}>
              🪴 Créer une planche
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
