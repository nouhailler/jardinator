const OLLAMA_URL_KEY   = 'jardinator_ollama_url';
const OLLAMA_MODEL_KEY = 'jardinator_ollama_model';
const CHAT_HISTORY_KEY = 'jardinator_chat_history';

// ── Config ────────────────────────────────────────────────────────────────────

export function getOllamaUrl() {
  return localStorage.getItem(OLLAMA_URL_KEY) || 'http://localhost:11434';
}
export function saveOllamaUrl(url) {
  localStorage.setItem(OLLAMA_URL_KEY, url.trim().replace(/\/$/, ''));
}

export function getOllamaModel() {
  return localStorage.getItem(OLLAMA_MODEL_KEY) || '';
}
export function saveOllamaModel(model) {
  localStorage.setItem(OLLAMA_MODEL_KEY, model);
}

// ── Models ────────────────────────────────────────────────────────────────────

export async function fetchOllamaModels(baseUrl) {
  const url = (baseUrl || getOllamaUrl()).replace(/\/$/, '');
  const res = await fetch(`${url}/api/tags`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const data = await res.json();
  return (data.models || []).map(m => ({ id: m.name, label: m.name }));
}

// ── Streaming chat ────────────────────────────────────────────────────────────

export async function* askOllamaStream(question, baseUrl, model) {
  const url = (baseUrl || getOllamaUrl()).replace(/\/$/, '');
  const mod = model || getOllamaModel();
  if (!mod) throw new Error('NO_MODEL');

  const res = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: mod,
      messages: [{ role: 'user', content: question }],
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

// ── Chat history ──────────────────────────────────────────────────────────────

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '[]'); }
  catch { return []; }
}

export function getChatHistory() {
  return loadHistory();
}

export function saveChatEntry(entry) {
  const history = [entry, ...loadHistory()];
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function deleteChatEntry(id) {
  const history = loadHistory().filter(e => e.id !== id);
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function clearChatHistory() {
  localStorage.removeItem(CHAT_HISTORY_KEY);
  return [];
}
