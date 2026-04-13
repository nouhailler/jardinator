/**
 * Pre-fetch Wikipedia images for all plants and save to src/data/plant_images.json
 * Run with: node scripts/prefetch-images.mjs
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

async function queryWikipedia(title) {
  const params = new URLSearchParams({
    action: 'query',
    titles: title,
    prop: 'pageimages',
    format: 'json',
    pithumbsize: '500',
  });
  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
      headers: { 'User-Agent': 'Jardinator/1.0 (plant calendar app; educational use)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages || {};
    const page = Object.values(pages)[0];
    if (!page || page.missing !== undefined) return null;
    return page.thumbnail?.source || null;
  } catch {
    return null;
  }
}

async function fetchImage(plant) {
  const latin = plant.nom_latin?.trim();
  if (!latin) return null;

  // Try full Latin name
  let url = await queryWikipedia(latin);
  if (url) return url;

  // Try genus + species only (strip variety/subspecies)
  const base = latin.split(/\s+var\.|\s+subsp\.|\s+f\./)[0].trim();
  if (base !== latin) {
    url = await queryWikipedia(base);
    if (url) return url;
  }

  // Try French common name as last resort
  url = await queryWikipedia(plant.nom);
  return url;
}

// Load existing results to allow resuming if interrupted
let existing = {};
try { existing = JSON.parse(readFileSync(outFile, 'utf8')); } catch {}

const results = { ...existing };
let found = 0, notFound = 0, skipped = 0;

console.log(`Fetching images for ${allPlants.length} plants...\n`);

for (let i = 0; i < allPlants.length; i++) {
  const plant = allPlants[i];
  const key = plant.nom;

  if (results[key] !== undefined) {
    skipped++;
    process.stdout.write(`[${i+1}/${allPlants.length}] ⏭  ${plant.nom} (cached)\n`);
    continue;
  }

  process.stdout.write(`[${i+1}/${allPlants.length}] ⏳ ${plant.nom} (${plant.nom_latin})... `);
  const url = await fetchImage(plant);

  if (url) {
    results[key] = url;
    found++;
    process.stdout.write(`✅\n`);
  } else {
    results[key] = null;
    notFound++;
    process.stdout.write(`❌ not found\n`);
  }

  // Save after each plant so we can resume if interrupted
  writeFileSync(outFile, JSON.stringify(results, null, 2));

  // Small delay to be polite to Wikipedia API
  await new Promise(r => setTimeout(r, 120));
}

console.log(`\n✅ Done: ${found} images found, ${notFound} not found, ${skipped} skipped (cached)`);
console.log(`Results saved to ${outFile}`);
