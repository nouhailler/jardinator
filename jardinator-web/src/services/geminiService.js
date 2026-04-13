const KEY_STORAGE = 'jardinator_gemini_key';
const MODEL = 'gemini-1.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export function getApiKey() {
  return localStorage.getItem(KEY_STORAGE) || '';
}

export function saveApiKey(key) {
  localStorage.setItem(KEY_STORAGE, key.trim());
}

export function clearApiKey() {
  localStorage.removeItem(KEY_STORAGE);
}

/**
 * Ask Gemini a gardening question about a plant.
 * Returns an async generator that yields text chunks (streaming).
 */
export async function* askGeminiStream(plantName) {
  const key = getApiKey();
  if (!key) throw new Error('NO_KEY');

  const prompt = `Peux-tu faire un résumé sur la meilleure manière de cultiver : ${plantName}\n\nRéponds en français, de manière pratique et structurée pour un jardinier amateur. Inclus : préparation du sol, semis/plantation, entretien, arrosage, maladies fréquentes et récolte.`;

  const url = `${API_BASE}/${MODEL}:streamGenerateContent?alt=sse&key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `Erreur ${res.status}`;
    if (res.status === 400 && msg.includes('API_KEY')) throw new Error('BAD_KEY');
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
    buffer = lines.pop(); // keep incomplete line
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json || json === '[DONE]') continue;
      try {
        const chunk = JSON.parse(json);
        const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
      } catch {}
    }
  }
}
