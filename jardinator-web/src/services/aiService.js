const KEY_STORAGE = 'jardinator_openrouter_key';
const MODELS_CACHE_KEY = 'jardinator_free_models_cache';
const ADVICE_STORAGE = 'jardinator_ai_advice';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ── Saved advice ─────────────────────────────────────────────────────────────

function loadAdviceStore() {
  try { return JSON.parse(localStorage.getItem(ADVICE_STORAGE) || '{}'); }
  catch { return {}; }
}

export function getSavedAdvice(plantId) {
  return loadAdviceStore()[plantId] || null;
}

export function saveAdvice(plantId, text) {
  const store = loadAdviceStore();
  store[plantId] = text;
  localStorage.setItem(ADVICE_STORAGE, JSON.stringify(store));
}

export function deleteSavedAdvice(plantId) {
  const store = loadAdviceStore();
  delete store[plantId];
  localStorage.setItem(ADVICE_STORAGE, JSON.stringify(store));
}

export function getAllSavedAdvice() {
  return loadAdviceStore();
}

export const DEFAULT_MODEL = '';

/**
 * Fetch the list of currently available free models from OpenRouter.
 * Results are cached for 1 hour to avoid repeated calls.
 */
export async function fetchFreeModels(apiKey) {
  // Check cache (1h TTL)
  try {
    const cached = JSON.parse(localStorage.getItem(MODELS_CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.ts < 3600_000 && cached.models.length > 0) {
      return cached.models;
    }
  } catch {}

  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const data = await res.json();

  const models = (data.data || [])
    .filter(m =>
      m.pricing?.prompt === '0' &&
      m.pricing?.completion === '0' &&
      m.id
    )
    .map(m => ({ id: m.id, label: m.name || m.id }))
    .sort((a, b) => a.label.localeCompare(b.label));

  localStorage.setItem(MODELS_CACHE_KEY, JSON.stringify({ ts: Date.now(), models }));
  return models;
}

export function clearModelsCache() {
  localStorage.removeItem(MODELS_CACHE_KEY);
}

export function getApiKey() {
  return localStorage.getItem(KEY_STORAGE) || '';
}
export function saveApiKey(key) {
  localStorage.setItem(KEY_STORAGE, key.trim());
}
export function clearApiKey() {
  localStorage.removeItem(KEY_STORAGE);
}

export function getSavedModel() {
  return localStorage.getItem('jardinator_ai_model') || DEFAULT_MODEL;
}
export function saveModel(model) {
  localStorage.setItem('jardinator_ai_model', model);
}

/**
 * Ask the AI a free-form question. Returns an async generator yielding text chunks.
 * Limite : 4096 tokens ≈ 5 pages de texte.
 */
export async function* askAIStreamChat(question) {
  const key = getApiKey();
  if (!key) throw new Error('NO_KEY');
  const model = getSavedModel();
  if (!model) throw new Error('NO_MODEL');
  yield* _stream(key, model, question, 4096);
}

async function* _stream(key, model, prompt, maxTokens = 2048) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Jardinator',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      max_tokens: maxTokens,
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

/**
 * Ask the AI a gardening question. Returns an async generator yielding text chunks.
 */
export async function* askAIStream(plantName) {
  const key = getApiKey();
  if (!key) throw new Error('NO_KEY');

  const model = getSavedModel();
  const prompt = `Fais un résumé pratique et structuré sur la meilleure manière de cultiver : ${plantName}\n\nRéponds en français pour un jardinier amateur. Organise ta réponse avec ces sections : préparation du sol, semis/plantation, entretien, arrosage, maladies fréquentes, et récolte.`;
  yield* _stream(key, model, prompt);
}
