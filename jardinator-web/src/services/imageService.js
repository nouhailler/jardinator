// v2 stores explicit user overrides only: url = chosen image, null = deleted by user
// Plants without an entry fall back to plant.defaultImageUrl from plant_images.json
const STORAGE_KEY = 'jardinator_images_v2';
const OLD_KEY = 'jardinator_images'; // key from first version of the app

/**
 * Migrate data from the old localStorage key (jardinator_images) into v2 on first run.
 * The old key stored { [plantId]: url } — we preserve those as user choices.
 */
export function migrateOldCache() {
  try {
    const alreadyMigrated = localStorage.getItem('jardinator_migrated_v2');
    if (alreadyMigrated) return;

    const old = localStorage.getItem(OLD_KEY);
    if (old) {
      const oldData = JSON.parse(old);
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      // Only import entries that aren't already overridden in v2
      for (const [id, url] of Object.entries(oldData)) {
        if (!(id in existing) && url) {
          existing[id] = url;
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    }
    localStorage.setItem('jardinator_migrated_v2', '1');
  } catch {}
}

export function getAllCached() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

export function saveImage(plantId, url) {
  try {
    const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    store[plantId] = url;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

export function deleteImage(plantId) {
  try {
    const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    store[plantId] = null; // null = explicitly deleted by user
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

/**
 * Search Wikimedia Commons for plant images.
 * Returns array of { thumbUrl, fullUrl, title }
 */
export async function searchWikimediaImages(query, limit = 18) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: '240',
    format: 'json',
    origin: '*',
  });
  try {
    const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data?.query?.pages || {};
    const results = [];
    for (const page of Object.values(pages)) {
      const ii = page.imageinfo?.[0];
      if (!ii) continue;
      if (!(ii.mime || '').startsWith('image/')) continue;
      if (!ii.thumburl || !ii.url) continue;
      results.push({
        title: page.title?.replace('File:', '') || '',
        thumbUrl: ii.thumburl,
        fullUrl: ii.url,
      });
    }
    return results;
  } catch { return []; }
}
