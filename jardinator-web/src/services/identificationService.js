import { getOllamaUrl, getOllamaModel } from './ollamaService';
import { getApiKey, getSavedModel } from './aiService';
import { addLog } from './logService';

const IDENTIFICATION_HISTORY_KEY = 'jardinator_identification_history';
const OR_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ── History ───────────────────────────────────────────────────────────────────

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(IDENTIFICATION_HISTORY_KEY) || '[]'); }
  catch { return []; }
}

export function getIdentificationHistory() {
  return loadHistory();
}

export function saveIdentificationEntry(entry) {
  const history = [entry, ...loadHistory()];
  localStorage.setItem(IDENTIFICATION_HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function updateIdentificationEntry(id, changes) {
  const history = loadHistory().map(e => e.id === id ? { ...e, ...changes } : e);
  localStorage.setItem(IDENTIFICATION_HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function deleteIdentificationEntry(id) {
  const history = loadHistory().filter(e => e.id !== id);
  localStorage.setItem(IDENTIFICATION_HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function clearIdentificationHistory() {
  localStorage.removeItem(IDENTIFICATION_HISTORY_KEY);
  return [];
}

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildPrompt(hint) {
  const ctx = hint ? ` (indice fourni par l'utilisateur : ${hint})` : '';
  return `Tu es un botaniste expert. Analyse cette photo${ctx} et identifie la plante ou l'arbre représenté. Réponds en français de façon structurée.

## 1. Identification
Donne le nom commun et le nom latin de la plante ou de l'arbre. Si plusieurs espèces sont possibles, liste-les par ordre de probabilité.

## 2. Caractéristiques distinctives
Décris les éléments visibles sur la photo qui t'ont permis d'identifier la plante : forme des feuilles, nervures, fleur, écorce, couleur, texture, port, etc.

## 3. Famille botanique
Indique la famille botanique et ses caractéristiques générales.

## 4. Habitat et répartition
Où pousse naturellement cette plante ? Climat, sol, altitude, région géographique.

## 5. Usages et intérêt
Usages alimentaires, médicinaux, ornementaux ou écologiques connus.

Si la photo n'est pas assez nette ou si l'identification est incertaine, dis-le clairement et explique ce qui manque.`;
}

// ── Ollama vision streaming ───────────────────────────────────────────────────

export async function* askOllamaIdentificationStream(dataUrl, hint, baseUrl, model) {
  const url = (baseUrl || getOllamaUrl()).replace(/\/$/, '');
  const mod = model || getOllamaModel();
  if (!mod) throw new Error('NO_MODEL');

  const base64 = dataUrl.split(',')[1];

  const res = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: mod,
      messages: [{
        role: 'user',
        content: buildPrompt(hint),
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

export async function* askOpenRouterIdentificationStream(dataUrl, hint) {
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
          { type: 'text', text: buildPrompt(hint) },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      }],
      stream: true,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `Erreur HTTP ${res.status}`;
    addLog('error', `Identification — erreur HTTP ${res.status}`, msg);
    if (res.status === 401) throw new Error('BAD_KEY');
    throw new Error(msg);
  }

  addLog('ok', 'Identification — streaming démarré', getSavedModel());

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let totalChars = 0;

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
        if (chunk.error) {
          const msg = chunk.error.message || 'Erreur provider';
          addLog('error', 'Identification — erreur dans le stream', msg);
          throw new Error(msg);
        }
        const text = chunk?.choices?.[0]?.delta?.content;
        if (text) { totalChars += text.length; yield text; }
      } catch (e) { if (e.message && !e.message.startsWith('JSON')) throw e; }
    }
  }
  addLog('ok', 'Identification — réponse complète', `${totalChars} car.`);
}
