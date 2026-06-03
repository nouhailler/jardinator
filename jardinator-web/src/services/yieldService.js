import { getOllamaUrl, getOllamaModel } from './ollamaService';
import { getApiKey, getSavedModel, orStream } from './aiService';

const YIELDS_KEY = 'jardinator_yields';
const OR_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ── Modèle de données ─────────────────────────────────────────────────────────
// {
//   [year: string]: YieldEntry[]
// }
//
// YieldEntry: {
//   id: string,
//   plantName: string,       // ex: "Tomate"
//   variety: string,         // ex: "Cœur de Bœuf"
//   planted: string,         // ex: "10 pieds"
//   harvested: string,       // ex: "5"
//   unit: 'kg' | 'nombre' | 'g' | 'litre',
//   notes: string,
//   suggestion: string,      // texte IA généré
//   suggestionModel: string,
//   suggestionProvider: string,
//   updatedAt: string,       // ISO date
// }

// ── Persistence ───────────────────────────────────────────────────────────────

function loadAll() {
  try { return JSON.parse(localStorage.getItem(YIELDS_KEY) || '{}'); }
  catch { return {}; }
}

function saveAll(data) {
  localStorage.setItem(YIELDS_KEY, JSON.stringify(data));
}

export function getYieldYears() {
  const data = loadAll();
  return Object.keys(data).sort((a, b) => b - a); // plus récent en premier
}

export function getYieldsForYear(year) {
  return loadAll()[String(year)] || [];
}

export function saveYieldEntry(year, entry) {
  const data = loadAll();
  const yr   = String(year);
  const list = data[yr] || [];
  const idx  = list.findIndex(e => e.id === entry.id);
  if (idx >= 0) list[idx] = entry;
  else list.unshift(entry);
  data[yr] = list;
  saveAll(data);
  return list;
}

export function deleteYieldEntry(year, id) {
  const data = loadAll();
  const yr   = String(year);
  data[yr]   = (data[yr] || []).filter(e => e.id !== id);
  if (data[yr].length === 0) delete data[yr];
  saveAll(data);
  return data[yr] || [];
}

export function clearYieldsForYear(year) {
  const data = loadAll();
  delete data[String(year)];
  saveAll(data);
}

export function newEntry() {
  return {
    id: `yield_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    plantName: '',
    variety: '',
    planted: '',
    harvested: '',
    unit: 'kg',
    notes: '',
    suggestion: '',
    suggestionModel: '',
    suggestionProvider: '',
    updatedAt: new Date().toISOString(),
  };
}

// ── Prompt ────────────────────────────────────────────────────────────────────

export function buildSuggestionPrompt(entry, year) {
  const fullName = entry.variety
    ? `${entry.plantName} variété '${entry.variety}'`
    : entry.plantName;
  const harvestInfo = entry.harvested
    ? `${entry.harvested} ${entry.unit}`
    : 'quantité non renseignée';
  const plantedInfo = entry.planted || 'quantité plantée non renseignée';
  const nextYear = Number(year) + 1;
  const notes = entry.notes ? `\nNotes du jardinier : ${entry.notes}` : '';

  return `Tu es un conseiller en jardinage potager expert. En ${year}, le jardinier a cultivé : ${fullName}.
- Quantité plantée/semée : ${plantedInfo}
- Quantité récoltée : ${harvestInfo}${notes}

Rédige en français une suggestion concrète et personnalisée pour améliorer la récolte en ${nextYear}.
Propose si nécessaire une variété alternative plus productive, des ajustements de densité de plantation, des pratiques culturales, ou des associations bénéfiques.
Sois direct et pratique (3 à 5 phrases maximum).`;
}

// ── Ollama streaming ──────────────────────────────────────────────────────────

export async function* askOllamaYieldStream(prompt, baseUrl, model) {
  const url = (baseUrl || getOllamaUrl()).replace(/\/$/, '');
  const mod = model || getOllamaModel();
  if (!mod) throw new Error('NO_MODEL');

  const res = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: mod,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Erreur ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const chunk = JSON.parse(line);
        const text = chunk?.message?.content;
        if (text) yield text;
        if (chunk.done) return;
      } catch {}
    }
  }
}

// ── OpenRouter streaming ──────────────────────────────────────────────────────

export async function* askOpenRouterYieldStream(prompt) {
  yield* orStream(prompt, 512);
}
