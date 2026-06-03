/**
 * gardenAnalysisService.js
 * Companion planting analysis and biodiversity scoring for the garden planner.
 */

import { getApiKey, getSavedModel, orStream } from './aiService';
import { getOllamaUrl, getOllamaModel } from './ollamaService';

const OR_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ── Adjacent cell keys (8 directions) ────────────────────────────────────────

export function adjKeys(row, col, rows, cols) {
  const result = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) result.push(`${nr}-${nc}`);
    }
  return result;
}

// ── Bed associations analysis ─────────────────────────────────────────────────

/**
 * Returns all conflict and harmony pairs in the current bed layout.
 * Each pair: { cellA, cellB, plantA, plantB }
 */
export function analyzeBedAssociations(bed, allPlants) {
  const conflicts = [], harmonies = [];
  const seen = new Set();

  Object.entries(bed.cells).forEach(([key, cell]) => {
    const [row, col] = key.split('-').map(Number);
    const plant = allPlants.find(p => p.id === cell.plantId);
    if (!plant) return;

    adjKeys(row, col, bed.rows, bed.cols).forEach(nKey => {
      const nCell = bed.cells[nKey];
      if (!nCell) return;
      const nPlant = allPlants.find(p => p.id === nCell.plantId);
      if (!nPlant) return;

      const pk = [key, nKey].sort().join('|');
      if (seen.has(pk)) return;
      seen.add(pk);

      const bad  = plant.associations.defavorables.includes(nPlant.name) || nPlant.associations.defavorables.includes(plant.name);
      const good = plant.associations.favorables.includes(nPlant.name)   || nPlant.associations.favorables.includes(plant.name);

      if (bad)       conflicts.push({ cellA: key, cellB: nKey, plantA: plant, plantB: nPlant });
      else if (good) harmonies.push({ cellA: key, cellB: nKey, plantA: plant, plantB: nPlant });
    });
  });

  return { conflicts, harmonies };
}

/**
 * For a single cell, returns its neighbor conflicts and harmonies.
 * Used in CellPanel for immediate local feedback.
 */
export function getCellNeighborStatus(bed, row, col, allPlants) {
  const key = `${row}-${col}`;
  const cell = bed.cells[key];
  if (!cell) return { conflicts: [], harmonies: [] };
  const plant = allPlants.find(p => p.id === cell.plantId);
  if (!plant) return { conflicts: [], harmonies: [] };

  const conflicts = [], harmonies = [];
  adjKeys(row, col, bed.rows, bed.cols).forEach(nKey => {
    const nCell = bed.cells[nKey];
    if (!nCell) return;
    const nPlant = allPlants.find(p => p.id === nCell.plantId);
    if (!nPlant) return;

    const bad  = plant.associations.defavorables.includes(nPlant.name) || nPlant.associations.defavorables.includes(plant.name);
    const good = plant.associations.favorables.includes(nPlant.name)   || nPlant.associations.favorables.includes(plant.name);
    if (bad)       conflicts.push(nPlant);
    else if (good) harmonies.push(nPlant);
  });

  return { conflicts, harmonies };
}

/**
 * Returns up to 3 favorable companion plants not already present in the bed,
 * as alternatives to a conflicting neighbor.
 */
export function getAlternatives(plant, bed, allPlants) {
  const inBed = new Set(
    Object.values(bed.cells).map(c => allPlants.find(p => p.id === c.plantId)?.name).filter(Boolean)
  );
  return plant.associations.favorables.filter(name => !inBed.has(name)).slice(0, 3);
}

// ── Biodiversity score ────────────────────────────────────────────────────────

/**
 * Score 0-100.
 * Species richness (max 35) + family diversity (max 25) + group diversity (max 20)
 * + fill rate (max 10) + harmony bonus (max 10) − conflict penalty (max −30).
 */
export function computeBiodiversityScore(bed, allPlants, conflicts, harmonies) {
  const occupied = Object.values(bed.cells);
  if (!occupied.length) return { score: 0, details: {} };

  const plants      = occupied.map(c => allPlants.find(p => p.id === c.plantId)).filter(Boolean);
  const speciesCount = new Set(plants.map(p => p.name)).size;
  const familyCount  = new Set(plants.map(p => p.family).filter(Boolean)).size;
  const groupCount   = new Set(plants.map(p => p.groupe).filter(Boolean)).size;
  const occupRate    = occupied.length / (bed.rows * bed.cols);

  const ss = Math.min(35, speciesCount * 5);
  const fs = Math.min(25, familyCount * 5);
  const gs = Math.min(20, groupCount * 5);
  const os = Math.min(10, Math.round(occupRate * 10));
  const cp = Math.min(30, conflicts.length * 8);
  const hb = Math.min(10, harmonies.length * 2);

  return {
    score: Math.max(0, Math.min(100, Math.round(ss + fs + gs + os - cp + hb))),
    details: { speciesCount, familyCount, groupCount, occupRate, conflictsCount: conflicts.length, harmoniesCount: harmonies.length, ss, fs, gs, os, cp, hb },
  };
}

export function scoreGrade(score) {
  if (score >= 80) return { label: 'Excellent', color: '#2E7D32', emoji: '🌟' };
  if (score >= 60) return { label: 'Bon',       color: '#388E3C', emoji: '🟢' };
  if (score >= 35) return { label: 'Moyen',     color: '#F57F17', emoji: '🟡' };
  return                  { label: 'Faible',    color: '#C62828', emoji: '🔴' };
}

// ── AI Prompt ─────────────────────────────────────────────────────────────────

export function buildGardenAiPrompt(bed, allPlants, conflicts, harmonies, bioScore) {
  const occupied = Object.values(bed.cells);
  const plants   = [...new Set(occupied.map(c => allPlants.find(p => p.id === c.plantId)?.name).filter(Boolean))];
  const empty    = bed.rows * bed.cols - occupied.length;
  const { label } = scoreGrade(bioScore.score);
  const { speciesCount, familyCount, groupCount } = bioScore.details;

  const confLines = conflicts.length
    ? conflicts.slice(0, 10).map(c => `• ${c.plantA.name} ↔ ${c.plantB.name} (association défavorable)`).join('\n')
    : 'Aucun conflit détecté ✅';

  const harmLines = harmonies.length
    ? harmonies.slice(0, 6).map(h => `• ${h.plantA.name} ↔ ${h.plantB.name} ✓`).join('\n')
    : '';

  return `Tu es un expert en permaculture et jardinage potager. Analyse ce plan de potager :

Planche : "${bed.name}" — ${bed.rows}×${bed.cols} cases${empty > 0 ? `, ${empty} cases vides` : ''}
Plantes présentes (${plants.length} espèces) : ${plants.join(', ')}
Score biodiversité : ${bioScore.score}/100 (${label}) — ${speciesCount} espèces · ${familyCount} familles · ${groupCount} groupes

Associations défavorables (${conflicts.length}) :
${confLines}
${harmLines ? `\nBonnes associations (${harmonies.length}) :\n${harmLines}` : ''}

Génère une analyse structurée en 3 parties :
**1. Bilan global** (1-2 phrases sur l'état général du potager)
**2. Corrections prioritaires** (pour chaque conflit, propose une alternative concrète et simple)
**3. Recommandations biodiversité** (3-4 actions pour améliorer le score${empty > 0 ? `, suggère des plantes pour les ${empty} cases vides` : ''})

Format markdown simple. Réponds directement en français, sois concis et pratique.`;
}

// ── Streaming generators ──────────────────────────────────────────────────────

export async function* askOllamaGardenStream(prompt) {
  const url   = getOllamaUrl().replace(/\/$/, '');
  const model = getOllamaModel();
  if (!model) throw new Error('NO_MODEL');

  const res = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], stream: true }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error || `Erreur ${res.status}`); }

  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      try { const c = JSON.parse(line); if (c?.message?.content) yield c.message.content; if (c.done) return; } catch {}
    }
  }
}

export async function* askOpenRouterGardenStream(prompt) {
  yield* orStream(prompt, 1000);
}
