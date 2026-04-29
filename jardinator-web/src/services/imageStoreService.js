/**
 * imageStoreService.js
 * Stockage des images (blobs) dans IndexedDB — séparé du JSON localStorage.
 * Le JSON ne stocke qu'un imageId (ex: "img_1714000000000_abc123").
 * L'image réelle est dans la base IndexedDB "jardinator_imgstore".
 */

const DB_NAME    = 'jardinator_imgstore';
const DB_VERSION = 1;
const STORE_NAME = 'images';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

/** Sauvegarde un File ou Blob. Retourne l'imageId généré. */
export async function saveImageBlob(fileOrBlob) {
  const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ id, blob: fileOrBlob });
    tx.oncomplete = resolve;
    tx.onerror    = (e) => reject(e.target.error);
  });
  db.close();
  return id;
}

/** Charge un Blob depuis IndexedDB. Retourne null si absent. */
export async function loadImageBlob(id) {
  if (!id) return null;
  const db = await openDB();
  const result = await new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = (e) => resolve(e.target.result?.blob ?? null);
    req.onerror   = (e) => reject(e.target.error);
  });
  db.close();
  return result;
}

/** Supprime une image de IndexedDB. */
export async function deleteImageBlob(id) {
  if (!id) return;
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = resolve;
    tx.onerror    = (e) => reject(e.target.error);
  });
  db.close();
}

/** Supprime plusieurs images d'un coup. */
export async function deleteImageBlobs(ids) {
  const valid = ids.filter(Boolean);
  if (!valid.length) return;
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    valid.forEach(id => store.delete(id));
    tx.oncomplete = resolve;
    tx.onerror    = (e) => reject(e.target.error);
  });
  db.close();
}

// ── Utilitaires de conversion ─────────────────────────────────────────────────

/** File → data URL (base64) — pour envoyer à l'IA. */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Blob → data URL — pour envoyer à l'IA depuis l'historique. */
export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Blob → object URL (pour affichage <img>). Pensez à révoquer avec URL.revokeObjectURL(). */
export function blobToObjectUrl(blob) {
  return URL.createObjectURL(blob);
}
