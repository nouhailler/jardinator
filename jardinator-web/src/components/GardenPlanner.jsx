import { useState, useMemo, useRef } from 'react';
import useStore from '../store/useStore';
import { getAllPlants, GROUPE_COLORS } from '../services/vegetableService';
import { getCellHistory } from '../services/gardenService';
import {
  analyzeBedAssociations, computeBiodiversityScore, scoreGrade,
  buildGardenAiPrompt, askOllamaGardenStream, askOpenRouterGardenStream,
  getAlternatives, getCellNeighborStatus,
} from '../services/gardenAnalysisService';
import { getOllamaModel } from '../services/ollamaService';
import { getApiKey, getSavedModel } from '../services/aiService';

const CURRENT_YEAR = new Date().getFullYear();

// ─── Simple markdown renderer ─────────────────────────────────────────────────
function MdLine({ line }) {
  const html = line
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
  if (!line.trim()) return <div className="gp-ai-spacer" />;
  if (/^\*\*[^*]+\*\*$/.test(line.trim())) return <div className="gp-ai-heading" dangerouslySetInnerHTML={{ __html: html }} />;
  if (/^[-•]/.test(line.trim())) return <div className="gp-ai-bullet" dangerouslySetInnerHTML={{ __html: '• ' + html.replace(/^[-•]\s*/, '') }} />;
  return <div className="gp-ai-para" dangerouslySetInnerHTML={{ __html: html }} />;
}

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

  const handlePickPlant = (plantId) => {
    setPlantInCell(bed.id, row, col, plantId);
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

  // Rotation warnings from history
  const rotationWarnings = useMemo(() => {
    if (!plant) return [];
    return history.slice(1).reduce((acc, record) => {
      const past = allPlants.find(p => p.id === record.plantId);
      if (past && plant.associations.defavorables.includes(past.name))
        acc.push(`⚠️ ${past.name} (${record.year}) était défavorable ici`);
      return acc;
    }, []);
  }, [plant, history]);

  // Current neighbor conflicts & harmonies
  const { conflicts: neighborConflicts, harmonies: neighborHarmonies } = useMemo(
    () => getCellNeighborStatus(bed, row, col, allPlants),
    [bed.cells, row, col]
  );

  if (showPicker) {
    return <PlantPicker onSelect={handlePickPlant} onClose={onClose} />;
  }

  return (
    <div className="gp-cell-panel">
      <div className="gp-cell-panel-header">
        <span>📍 Case {col + 1}×{row + 1}</span>
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
            <button className="gp-btn-outline" onClick={() => openDetail(plant)} title="Voir la fiche">📋</button>
          </div>

          {/* Neighbor conflicts */}
          {neighborConflicts.length > 0 && (
            <div className="gp-neighbor-conflicts">
              <div className="gp-neighbor-title">⚠️ Voisins défavorables</div>
              {neighborConflicts.map((np, i) => {
                const alts = getAlternatives(np, bed, allPlants);
                return (
                  <div key={i} className="gp-neighbor-row conflict">
                    <span className="gp-neighbor-plant">🔴 {np.name}</span>
                    {alts.length > 0 && (
                      <span className="gp-neighbor-alt">→ Remplacer par : {alts.join(', ')}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Neighbor harmonies */}
          {neighborHarmonies.length > 0 && (
            <div className="gp-neighbor-harmonies">
              <div className="gp-neighbor-title">🌿 Bons voisins</div>
              {neighborHarmonies.map((np, i) => (
                <div key={i} className="gp-neighbor-row harmony">
                  <span className="gp-neighbor-plant">🟢 {np.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Rotation warnings */}
          {rotationWarnings.length > 0 && (
            <div className="gp-rotation-warnings">
              {rotationWarnings.map((w, i) => <div key={i} className="gp-warning-item">{w}</div>)}
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
                    <button className="gp-history-del" onClick={() => removeCropRecord(bed.id, cellKey, record.year)} title="Supprimer">✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="gp-empty-cell-msg">
          <p>Aucune plante sur cette case.</p>
          <button className="gp-btn-primary" onClick={() => setShowPicker(true)}>🌱 Planter ici</button>
        </div>
      )}
    </div>
  );
}

// ─── Bed Editor ───────────────────────────────────────────────────────────
function BedGrid({ bed, conflictCells, harmonyCells }) {
  const { setPlantInCell } = useStore();
  const allPlants = getAllPlants();
  const [selectedCell, setSelectedCell] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [dragging, setDragging] = useState(null);

  const handleCellClick = (row, col) => {
    if (selectedCell?.row === row && selectedCell?.col === col) setSelectedCell(null);
    else setSelectedCell({ row, col });
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
    if (data.row !== row || data.col !== col) {
      const { removePlantFromCell } = useStore.getState();
      removePlantFromCell(bed.id, data.row, data.col);
    }
    setDragging(null);
  };

  return (
    <div className="gp-bed-wrapper">
      <div className="gp-grid" style={{ gridTemplateColumns: `repeat(${bed.cols}, 1fr)` }}>
        {Array.from({ length: bed.rows }, (_, row) =>
          Array.from({ length: bed.cols }, (_, col) => {
            const cellKey = `${row}-${col}`;
            const cell    = bed.cells[cellKey];
            const plant   = cell ? allPlants.find(p => p.id === cell.plantId) : null;
            const color   = plant ? (GROUPE_COLORS[plant.groupe] || '#78909C') : null;
            const isConflict = conflictCells.has(cellKey);
            const isHarmony  = !isConflict && harmonyCells.has(cellKey);
            const isSelected  = selectedCell?.row === row && selectedCell?.col === col;
            const isDragTarget = dragOver?.row === row && dragOver?.col === col;

            return (
              <div
                key={cellKey}
                className={[
                  'gp-cell',
                  plant ? 'occupied' : 'empty',
                  isSelected  ? 'selected'  : '',
                  isDragTarget ? 'drag-over' : '',
                  dragging?.row === row && dragging?.col === col ? 'dragging' : '',
                  isConflict ? 'conflict' : '',
                  isHarmony  ? 'harmony'  : '',
                ].filter(Boolean).join(' ')}
                style={plant && !isConflict && !isHarmony ? { background: color + '22', borderColor: color + '88' } : {}}
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
                    {isConflict && <span className="gp-cell-badge conflict-badge" title="Association défavorable détectée">⚠️</span>}
                    {isHarmony  && <span className="gp-cell-badge harmony-badge"  title="Bonne association">🌿</span>}
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
          <CellPanel bed={bed} row={selectedCell.row} col={selectedCell.col} onClose={() => setSelectedCell(null)} />
        </div>
      )}
    </div>
  );
}

// ─── Companion Panel ───────────────────────────────────────────────────────
function CompanionPanel({ bed, allPlants, conflicts, harmonies, bioScore }) {
  const defaultTab = conflicts.length > 0 ? 0 : 1;
  const [tab, setTab]       = useState(defaultTab);
  const [open, setOpen]     = useState(true);
  const [provider, setProvider] = useState('ollama');
  const [aiText, setAiText]   = useState('');
  const [aiStatus, setAiStatus] = useState('idle');
  const [aiError, setAiError]  = useState('');
  const abortRef = useRef(false);
  const scrollRef = useRef(null);

  const ollamaModel = getOllamaModel();
  const orKey       = getApiKey();
  const orModel     = getSavedModel();
  const activeModel = provider === 'ollama' ? ollamaModel : orModel;

  const warning = provider === 'ollama' && !ollamaModel  ? '⚠️ Modèle Ollama non configuré'
    : provider === 'openrouter' && !orKey  ? '⚠️ Clé OpenRouter manquante'
    : provider === 'openrouter' && !orModel ? '⚠️ Modèle non sélectionné' : null;

  const { score, details } = bioScore;
  const grade = scoreGrade(score);

  const totalCells = bed.rows * bed.cols;
  const occupied   = Object.keys(bed.cells).length;

  async function handleAiGenerate() {
    if (warning || aiStatus === 'loading') return;
    setAiStatus('loading');
    setAiText('');
    setAiError('');
    abortRef.current = false;
    let full = '';

    try {
      const prompt = buildGardenAiPrompt(bed, allPlants, conflicts, harmonies, bioScore);
      const stream = provider === 'ollama'
        ? askOllamaGardenStream(prompt)
        : askOpenRouterGardenStream(prompt);

      for await (const chunk of stream) {
        if (abortRef.current) break;
        full += chunk;
        setAiText(full);
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      setAiStatus('done');
    } catch (err) {
      const msgs = { NO_KEY: 'Clé API OpenRouter manquante.', NO_MODEL: 'Modèle non configuré.', BAD_KEY: 'Clé API invalide.' };
      setAiError(msgs[err.message] || `Erreur : ${err.message}`);
      setAiStatus('error');
    }
  }

  const TABS = [
    { label: `🌱 Compagnonnage${conflicts.length ? ` · ⚠️${conflicts.length}` : ''}`, key: 0 },
    { label: `🧬 Biodiversité · ${score}/100`,                                          key: 1 },
    { label: '🤖 Analyse IA',                                                           key: 2 },
  ];

  return (
    <div className="gp-companion-wrapper">
      <button className={`gp-companion-toggle ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span className="gp-companion-toggle-title">🔬 Compagnonnage & Biodiversité</span>
        {conflicts.length > 0 && <span className="gp-companion-badge conflict">{conflicts.length} conflit{conflicts.length > 1 ? 's' : ''}</span>}
        {harmonies.length > 0 && <span className="gp-companion-badge harmony">{harmonies.length} harmonie{harmonies.length > 1 ? 's' : ''}</span>}
        <span className="gp-companion-badge bio" style={{ background: grade.color }}>{grade.emoji} {score}/100</span>
        <span className="gp-companion-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="gp-companion-body">
          <div className="gp-companion-tabs">
            {TABS.map(t => (
              <button key={t.key} className={`gp-companion-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab 0: Compagnonnage ── */}
          {tab === 0 && (
            <div className="gp-companion-content">
              {conflicts.length === 0 && harmonies.length === 0 && (
                <div className="gp-companion-empty">
                  <span>✅ Aucun conflit ni harmonie détectés dans le voisinage immédiat.</span>
                  <span className="gp-companion-hint">Ajoutez des plantes pour voir les analyses d'associations.</span>
                </div>
              )}

              {conflicts.length > 0 && (
                <div className="gp-assoc-section">
                  <div className="gp-assoc-section-title">⚠️ Associations défavorables ({conflicts.length})</div>
                  {conflicts.map((c, i) => {
                    const altA = getAlternatives(c.plantA, bed, allPlants);
                    const altB = getAlternatives(c.plantB, bed, allPlants);
                    return (
                      <div key={i} className="gp-conflict-card">
                        <div className="gp-conflict-plants">
                          <span className="gp-conflict-dot" style={{ background: GROUPE_COLORS[c.plantA.groupe] || '#ccc' }} />
                          <strong>{c.plantA.name}</strong>
                          <span className="gp-conflict-x">✕</span>
                          <span className="gp-conflict-dot" style={{ background: GROUPE_COLORS[c.plantB.groupe] || '#ccc' }} />
                          <strong>{c.plantB.name}</strong>
                        </div>
                        <div className="gp-conflict-alts">
                          {altA.length > 0 && <span>Remplacer <em>{c.plantA.name}</em> par : <strong>{altA.join(', ')}</strong></span>}
                          {altB.length > 0 && <span>Remplacer <em>{c.plantB.name}</em> par : <strong>{altB.join(', ')}</strong></span>}
                          {altA.length === 0 && altB.length === 0 && <span className="gp-no-alt">Éloignez ces deux plantes ou consultez l'Analyse IA.</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {harmonies.length > 0 && (
                <div className="gp-assoc-section">
                  <div className="gp-assoc-section-title">🌿 Bonnes associations ({harmonies.length})</div>
                  {harmonies.map((h, i) => (
                    <div key={i} className="gp-harmony-card">
                      <span className="gp-conflict-dot" style={{ background: GROUPE_COLORS[h.plantA.groupe] || '#ccc' }} />
                      <strong>{h.plantA.name}</strong>
                      <span className="gp-harmony-plus">✚</span>
                      <span className="gp-conflict-dot" style={{ background: GROUPE_COLORS[h.plantB.groupe] || '#ccc' }} />
                      <strong>{h.plantB.name}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab 1: Biodiversité ── */}
          {tab === 1 && (
            <div className="gp-companion-content">
              <div className="gp-bio-score-display">
                <div className="gp-bio-score-number" style={{ color: grade.color }}>{score}</div>
                <div className="gp-bio-score-label">
                  <span className="gp-bio-grade" style={{ color: grade.color }}>{grade.emoji} {grade.label}</span>
                  <span className="gp-bio-max">/ 100</span>
                </div>
              </div>
              <div className="gp-bio-gauge">
                <div className="gp-bio-gauge-fill" style={{ width: `${score}%`, background: grade.color }} />
              </div>

              {details.speciesCount !== undefined && (
                <div className="gp-bio-breakdown">
                  <div className="gp-bio-row">
                    <span className="gp-bio-row-icon">🌱</span>
                    <span className="gp-bio-row-label">Espèces différentes</span>
                    <span className="gp-bio-row-val">{details.speciesCount}</span>
                    <span className="gp-bio-row-pts">+{details.ss} pts</span>
                  </div>
                  <div className="gp-bio-row">
                    <span className="gp-bio-row-icon">🏷️</span>
                    <span className="gp-bio-row-label">Familles botaniques</span>
                    <span className="gp-bio-row-val">{details.familyCount}</span>
                    <span className="gp-bio-row-pts">+{details.fs} pts</span>
                  </div>
                  <div className="gp-bio-row">
                    <span className="gp-bio-row-icon">🌿</span>
                    <span className="gp-bio-row-label">Groupes légumes</span>
                    <span className="gp-bio-row-val">{details.groupCount}</span>
                    <span className="gp-bio-row-pts">+{details.gs} pts</span>
                  </div>
                  <div className="gp-bio-row">
                    <span className="gp-bio-row-icon">📊</span>
                    <span className="gp-bio-row-label">Taux d'occupation</span>
                    <span className="gp-bio-row-val">{Math.round(details.occupRate * 100)}%</span>
                    <span className="gp-bio-row-pts">+{details.os} pts</span>
                  </div>
                  {details.hb > 0 && (
                    <div className="gp-bio-row positive">
                      <span className="gp-bio-row-icon">🤝</span>
                      <span className="gp-bio-row-label">Bonnes associations</span>
                      <span className="gp-bio-row-val">{details.harmoniesCount}</span>
                      <span className="gp-bio-row-pts">+{details.hb} pts</span>
                    </div>
                  )}
                  {details.cp > 0 && (
                    <div className="gp-bio-row negative">
                      <span className="gp-bio-row-icon">⚠️</span>
                      <span className="gp-bio-row-label">Pénalité conflits</span>
                      <span className="gp-bio-row-val">{details.conflictsCount}</span>
                      <span className="gp-bio-row-pts penalty">−{details.cp} pts</span>
                    </div>
                  )}
                </div>
              )}

              <div className="gp-bio-tips">
                <div className="gp-bio-tips-title">💡 Pour améliorer le score</div>
                {details.speciesCount < 7  && <div className="gp-bio-tip">Ajoutez des espèces variées (objectif : 7+)</div>}
                {details.familyCount  < 5  && <div className="gp-bio-tip">Diversifiez les familles botaniques (objectif : 5+)</div>}
                {details.conflictsCount > 0 && <div className="gp-bio-tip">Résolvez les {details.conflictsCount} conflit{details.conflictsCount > 1 ? 's' : ''} de voisinage (−{details.cp} pts)</div>}
                {details.occupRate < 0.5   && <div className="gp-bio-tip">Augmentez le taux d'occupation ({Math.round(details.occupRate * 100)}% → 50%+)</div>}
                {details.harmoniesCount < 3 && <div className="gp-bio-tip">Placez des bonnes associations côte à côte pour des bonus</div>}
              </div>

              <div className="gp-bio-stat-row">
                <span>🪴 {occupied} case{occupied > 1 ? 's' : ''} occupée{occupied > 1 ? 's' : ''} / {totalCells}</span>
                <span>📐 {(bed.rows * bed.cellSizeM).toFixed(1)}m × {(bed.cols * bed.cellSizeM).toFixed(1)}m</span>
              </div>
            </div>
          )}

          {/* ── Tab 2: Analyse IA ── */}
          {tab === 2 && (
            <div className="gp-companion-content">
              <div className="gp-ai-controls-row">
                <div className="chat-provider-toggle">
                  <button className={`chat-provider-btn ${provider === 'ollama' ? 'active' : ''}`} onClick={() => setProvider('ollama')}>🖥️ Ollama</button>
                  <button className={`chat-provider-btn ${provider === 'openrouter' ? 'active' : ''}`} onClick={() => setProvider('openrouter')}>☁️ OpenRouter</button>
                </div>
                {warning
                  ? <span className="chat-warning">{warning}</span>
                  : activeModel && <span className="chat-model-badge">{activeModel}</span>
                }
                {aiStatus === 'loading'
                  ? <button className="btn-stop" onClick={() => { abortRef.current = true; setAiStatus('done'); }}>⏹ Arrêter</button>
                  : <button className="gp-ai-generate-btn" onClick={handleAiGenerate} disabled={!!warning || occupied === 0}>
                      {aiText ? '🔄 Régénérer' : '✨ Analyser'}
                    </button>
                }
              </div>

              {occupied === 0 && (
                <p className="gp-ai-placeholder">Ajoutez des plantes dans votre potager pour lancer l'analyse IA.</p>
              )}

              {aiStatus === 'error' && <div className="chat-error">{aiError}</div>}

              {aiStatus === 'loading' && !aiText && (
                <div className="meteo-loading" style={{ padding: '0.75rem 0' }}>
                  <span className="spin-dot"/><span className="spin-dot"/><span className="spin-dot"/>
                  <span>Analyse en cours…</span>
                </div>
              )}

              {aiText && (
                <div className="gp-ai-response" ref={scrollRef}>
                  {aiText.split('\n').map((line, i) => <MdLine key={i} line={line} />)}
                  {aiStatus === 'loading' && <span className="chat-cursor">▋</span>}
                </div>
              )}

              {!aiText && aiStatus === 'idle' && occupied > 0 && (
                <p className="gp-ai-placeholder">
                  L'IA analysera vos associations de plantes, proposera des corrections et des recommandations
                  personnalisées pour améliorer votre biodiversité.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── New Bed Form ──────────────────────────────────────────────────────────
function NewBedForm({ onAdd, onClose }) {
  const [name, setName]         = useState('Ma planche');
  const [rows, setRows]         = useState(4);
  const [cols, setCols]         = useState(6);
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
      <p className="gp-dim-preview">
        Surface : {(rows * cellSize).toFixed(1)} m × {(cols * cellSize).toFixed(1)} m = {(rows * cols * cellSize * cellSize).toFixed(1)} m²
      </p>
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

  const activeBed  = gardenBeds.find(b => b.id === activeGardenBedId) || null;
  const allPlants  = useMemo(() => getAllPlants(), []);

  const { conflicts, harmonies } = useMemo(() => {
    if (!activeBed || !Object.keys(activeBed.cells).length) return { conflicts: [], harmonies: [] };
    return analyzeBedAssociations(activeBed, allPlants);
  }, [activeBed?.cells, activeBed?.rows, activeBed?.cols]);

  const bioScore = useMemo(() => {
    if (!activeBed) return { score: 0, details: {} };
    return computeBiodiversityScore(activeBed, allPlants, conflicts, harmonies);
  }, [activeBed?.cells, conflicts, harmonies]);

  const conflictCells = useMemo(() => new Set(conflicts.flatMap(c => [c.cellA, c.cellB])), [conflicts]);
  const harmonyCells  = useMemo(() => new Set(harmonies.flatMap(h => [h.cellA, h.cellB])), [harmonies]);

  const handleAddBed = (name, rows, cols, cellSize) => {
    addGardenBed(name, rows, cols, cellSize);
    setShowNewForm(false);
  };

  const handleRemoveBed = (bedId) => {
    if (!confirm('Supprimer cette planche et tout son contenu ?')) return;
    removeGardenBed(bedId);
  };

  const grade = scoreGrade(bioScore.score);

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
              <span className="gp-bed-item-count">{Object.keys(bed.cells).length}/{bed.rows * bed.cols} cases occupées</span>
            </div>
            <button className="gp-bed-del-btn" onClick={e => { e.stopPropagation(); handleRemoveBed(bed.id); }} title="Supprimer">🗑</button>
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
                  {activeBed.rows} rangs × {activeBed.cols} colonnes — cases {activeBed.cellSizeM}m
                </span>
              </div>
              <div className="gp-bed-header-actions">
                {conflicts.length > 0 && (
                  <span className="gp-header-alert">⚠️ {conflicts.length} conflit{conflicts.length > 1 ? 's' : ''}</span>
                )}
                <span className="gp-header-score" style={{ color: grade.color }} title={`Score biodiversité : ${bioScore.score}/100`}>
                  🧬 {grade.emoji} {bioScore.score}/100
                </span>
                <span className="gp-tip">💡 Cliquez · Glissez pour déplacer</span>
              </div>
            </div>

            <BedGrid
              bed={activeBed}
              conflictCells={conflictCells}
              harmonyCells={harmonyCells}
            />
            <Legend />

            <CompanionPanel
              bed={activeBed}
              allPlants={allPlants}
              conflicts={conflicts}
              harmonies={harmonies}
              bioScore={bioScore}
            />
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
