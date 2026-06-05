// jsonbinService.js — Sync via JSONBin.io (v3)
// Stocke/récupère le bundle dans un bin privé JSONBin

const KEY_KEY   = 'jardinator_jsonbin_key';
const ID_KEY    = 'jardinator_jsonbin_binid';
const SYNC_KEY  = 'jardinator_jsonbin_lastsync';
const BASE      = 'https://api.jsonbin.io/v3';

// ── Credentials ───────────────────────────────────────────────────────────────

export function getApiKey()    { return localStorage.getItem(KEY_KEY)  || ''; }
export function saveApiKey(k)  { localStorage.setItem(KEY_KEY, k.trim()); }
export function getBinId()     { return localStorage.getItem(ID_KEY)   || ''; }
export function saveBinId(id)  { localStorage.setItem(ID_KEY, id); }
export function clearJsonbin() {
  localStorage.removeItem(KEY_KEY);
  localStorage.removeItem(ID_KEY);
  localStorage.removeItem(SYNC_KEY);
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function request(method, path, key, body, extraHeaders = {}) {
  const resp = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'X-Master-Key':  key,
      'Content-Type':  'application/json',
      ...extraHeaders,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.message || `HTTP ${resp.status}`);
  }
  return resp.json();
}

// ── Sync publique ─────────────────────────────────────────────────────────────

export async function push(bundle) {
  const key   = getApiKey();
  if (!key) throw new Error('Clé API JSONBin manquante');
  let binId = getBinId();

  if (binId) {
    await request('PUT', `/b/${binId}`, key, bundle);
  } else {
    const res = await request('POST', '/b', key, bundle, {
      'X-Bin-Name':    'jardinator-sync',
      'X-Bin-Private': 'true',
    });
    binId = res.metadata.id;
    saveBinId(binId);
  }

  const now = new Date().toISOString();
  localStorage.setItem(SYNC_KEY, now);
  return now;
}

export async function pull() {
  const key   = getApiKey();
  if (!key) throw new Error('Clé API JSONBin manquante');
  const binId = getBinId();
  if (!binId) return null;

  const res = await request('GET', `/b/${binId}/latest`, key);
  const now = new Date().toISOString();
  localStorage.setItem(SYNC_KEY, now);
  return res.record;
}

export function getLastSync() { return localStorage.getItem(SYNC_KEY) || null; }
