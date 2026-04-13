/**
 * Second pass: try alternative methods for plants that returned null in pass 1.
 * Strategies:
 *  1. Wikipedia search (opensearch → pageimages on found title)
 *  2. Wikimedia Commons search
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dir, '../src/data');
const outFile = join(dataDir, 'plant_images.json');

const legumes = JSON.parse(readFileSync(join(dataDir, 'legumes.json'), 'utf8'));
const extra = JSON.parse(readFileSync(join(dataDir, 'plantes_extra.json'), 'utf8'));
const allPlants = [...legumes, ...extra].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
const existing = JSON.parse(readFileSync(outFile, 'utf8'));

const HEADERS = { 'User-Agent': 'Jardinator/1.0 (educational plant calendar)' };

async function get(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return null;
  return res.json();
}

// Strategy 1: Wikipedia pageimages with redirect resolution
async function wikiPageimages(title) {
  const params = new URLSearchParams({
    action: 'query', titles: title, prop: 'pageimages',
    format: 'json', pithumbsize: '500', redirects: '1',
  });
  const data = await get(`https://en.wikipedia.org/w/api.php?${params}`);
  const pages = data?.query?.pages || {};
  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined) return null;
  return page.thumbnail?.source || null;
}

// Strategy 2: Wikipedia search → get first result's pageimage
async function wikiSearch(query) {
  const params = new URLSearchParams({
    action: 'query', list: 'search', srsearch: query, srnamespace: '0',
    srlimit: '3', format: 'json',
  });
  const data = await get(`https://en.wikipedia.org/w/api.php?${params}`);
  const results = data?.query?.search || [];
  for (const r of results) {
    const img = await wikiPageimages(r.title);
    if (img) return img;
  }
  return null;
}

// Strategy 3: Wikimedia Commons search for the species
async function commonsSearch(query) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `${query} -File:`,
    gsrnamespace: '6',
    gsrlimit: '5',
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
    iiurlwidth: '500',
    format: 'json',
  });
  const data = await get(`https://commons.wikimedia.org/w/api.php?${params}`);
  const pages = data?.query?.pages || {};
  for (const p of Object.values(pages)) {
    const ii = p.imageinfo?.[0];
    if (!ii) continue;
    const mime = ii.mime || '';
    if (!mime.startsWith('image/')) continue;
    // Filter out maps, logos, diagrams (small width often means icon)
    if (ii.thumburl && ii.thumbwidth >= 200) return ii.thumburl;
  }
  return null;
}

async function fetchMissing(plant) {
  const latin = (plant.nom_latin || '').trim();
  const base = latin.split(/\s+var\.|\s+subsp\.|\s+f\./)[0].trim();

  // Try all strategies in order
  let url;

  // 1. pageimages with redirect on base species
  url = await wikiPageimages(base);
  if (url) return { url, strategy: 'wiki-base-redirect' };

  // 2. Wikipedia search with Latin name
  url = await wikiSearch(latin);
  if (url) return { url, strategy: 'wiki-search-latin' };

  // 3. Wikipedia search with French name
  url = await wikiSearch(plant.nom);
  if (url) return { url, strategy: 'wiki-search-french' };

  // 4. Commons search with Latin name
  url = await commonsSearch(base);
  if (url) return { url, strategy: 'commons' };

  return { url: null, strategy: 'none' };
}

const missing = allPlants.filter(p => existing[p.nom] === null);
console.log(`Second pass: ${missing.length} plants to retry\n`);

let found = 0;
for (let i = 0; i < missing.length; i++) {
  const plant = missing[i];
  process.stdout.write(`[${i+1}/${missing.length}] ⏳ ${plant.nom}... `);

  const { url, strategy } = await fetchMissing(plant);
  if (url) {
    existing[plant.nom] = url;
    found++;
    process.stdout.write(`✅ (${strategy})\n`);
  } else {
    process.stdout.write(`❌\n`);
  }

  writeFileSync(outFile, JSON.stringify(existing, null, 2));
  await new Promise(r => setTimeout(r, 200));
}

console.log(`\n✅ Pass 2 done: ${found}/${missing.length} additional images found`);
