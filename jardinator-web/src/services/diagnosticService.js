import { getOllamaUrl, getOllamaModel } from './ollamaService';
import { getApiKey, getSavedModel } from './aiService';

const DIAGNOSTIC_HISTORY_KEY = 'jardinator_diagnostic_history';
const OR_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ── History ───────────────────────────────────────────────────────────────────

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(DIAGNOSTIC_HISTORY_KEY) || '[]'); }
  catch { return []; }
}

export function getDiagnosticHistory() {
  return loadHistory();
}

export function saveDiagnosticEntry(entry) {
  const history = [entry, ...loadHistory()];
  localStorage.setItem(DIAGNOSTIC_HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function deleteDiagnosticEntry(id) {
  const history = loadHistory().filter(e => e.id !== id);
  localStorage.setItem(DIAGNOSTIC_HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function updateDiagnosticEntry(id, changes) {
  const history = loadHistory().map(e => e.id === id ? { ...e, ...changes } : e);
  localStorage.setItem(DIAGNOSTIC_HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function clearDiagnosticHistory() {
  localStorage.removeItem(DIAGNOSTIC_HISTORY_KEY);
  return [];
}

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildPrompt(plantName) {
  const ctx = plantName ? ` (${plantName})` : '';
  return `Tu es un expert en phytopathologie et jardinage biologique. Analyse cette photo de plante${ctx} et réponds en français de façon structurée.

## 1. Diagnostic
Identifie le ou les problèmes visibles : maladie fongique, bactérienne, virale, carence nutritive, ravageur, stress hydrique ou autre.

## 2. Causes probables
Explique les conditions qui ont favorisé l'apparition du problème.

## 3. Remèdes biologiques
Propose des traitements naturels et certifiés bio : purins, décoctions, produits du commerce bio, pratiques culturales correctives.

## 4. Prévention
Donne des mesures préventives pour éviter la récidive (rotation, taille, arrosage, amendements, etc.).

Sois précis et pratique pour un jardinier amateur.`;
}

// ── Ollama vision streaming ───────────────────────────────────────────────────

export async function* askOllamaDiagnosticStream(dataUrl, plantName, baseUrl, model) {
  const url = (baseUrl || getOllamaUrl()).replace(/\/$/, '');
  const mod = model || getOllamaModel();
  if (!mod) throw new Error('NO_MODEL');

  // Ollama vision expects raw base64 (without the data: prefix)
  const base64 = dataUrl.split(',')[1];

  const res = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: mod,
      messages: [{
        role: 'user',
        content: buildPrompt(plantName),
        images: [base64],
      }],
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

// ── OpenRouter vision streaming ───────────────────────────────────────────────

export async function* askOpenRouterDiagnosticStream(dataUrl, plantName) {
  const key = getApiKey();
  if (!key) throw new Error('NO_KEY');
  const model = getSavedModel();
  if (!model) throw new Error('NO_MODEL');

  const res = await fetch(OR_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Jardinator',
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: buildPrompt(plantName) },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      }],
      stream: true,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `Erreur ${res.status}`;
    if (res.status === 401) throw new Error('BAD_KEY');
    throw new Error(msg);
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
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json || json === '[DONE]') continue;
      try {
        const chunk = JSON.parse(json);
        const text = chunk?.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch {}
    }
  }
}
