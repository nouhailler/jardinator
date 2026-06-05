// googleDriveService.js — OAuth 2.0 Google Identity Services + Drive REST API v3
// Portée drive.file : accès uniquement aux fichiers créés par l'app

const TOKEN_KEY     = 'jardinator_gdrive_token';
const CLIENTID_KEY  = 'jardinator_gdrive_clientid';
const LASTSYNC_KEY  = 'jardinator_gdrive_lastsync';
const FILE_NAME     = 'jardinator-sync.json';
const SCOPE         = 'https://www.googleapis.com/auth/drive.file';

// ── Client ID ─────────────────────────────────────────────────────────────────

export function getClientId()       { return localStorage.getItem(CLIENTID_KEY) || ''; }
export function saveClientId(id)    { localStorage.setItem(CLIENTID_KEY, id.trim()); }

// ── Token ─────────────────────────────────────────────────────────────────────

function getToken() {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY)); } catch { return null; }
}

function storeToken(resp) {
  const expires_at = Date.now() + (resp.expires_in - 60) * 1000;
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ access_token: resp.access_token, expires_at }));
}

export function isTokenValid() {
  const t = getToken();
  return !!(t && t.access_token && t.expires_at > Date.now());
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── GIS loader ────────────────────────────────────────────────────────────────

function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Impossible de charger Google Identity Services'));
    document.head.appendChild(s);
  });
}

// ── Connexion OAuth ───────────────────────────────────────────────────────────

export async function connect(clientId) {
  await loadGis();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error) {
          reject(new Error(resp.error_description || resp.error));
          return;
        }
        storeToken(resp);
        resolve();
      },
    });
    client.requestAccessToken({ prompt: '' });
  });
}

// ── Drive REST API v3 ─────────────────────────────────────────────────────────

async function driveGet(url, token) {
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${resp.status}`);
  }
  return resp;
}

async function driveMultipart(method, url, metadata, content, token) {
  const boundary = 'jardinatorBoundary812';
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n');

  const resp = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${resp.status}`);
  }
  return resp.json();
}

async function findSyncFile(token) {
  const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
  const resp = await driveGet(
    `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id,modifiedTime)`,
    token
  );
  const data = await resp.json();
  return data.files?.[0] || null;
}

// ── Sync publique ─────────────────────────────────────────────────────────────

export async function push(bundle) {
  const t = getToken();
  if (!t?.access_token) throw new Error('Non connecté à Google Drive');

  const existing = await findSyncFile(t.access_token);
  const content  = JSON.stringify(bundle);
  const meta     = { name: FILE_NAME, mimeType: 'application/json' };

  if (existing) {
    await driveMultipart(
      'PATCH',
      `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`,
      meta, content, t.access_token
    );
  } else {
    await driveMultipart(
      'POST',
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      meta, content, t.access_token
    );
  }

  const now = new Date().toISOString();
  localStorage.setItem(LASTSYNC_KEY, now);
  return now;
}

export async function pull() {
  const t = getToken();
  if (!t?.access_token) throw new Error('Non connecté à Google Drive');

  const file = await findSyncFile(t.access_token);
  if (!file) return null;

  const resp = await driveGet(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
    t.access_token
  );
  const bundle = await resp.json();

  const now = new Date().toISOString();
  localStorage.setItem(LASTSYNC_KEY, now);
  return bundle;
}

// ── Dernière synchronisation ──────────────────────────────────────────────────

export function getLastSync() { return localStorage.getItem(LASTSYNC_KEY) || null; }
