/**
 * Resolves PENDING GEOCODE coordinates against OpenStreetMap.
 *
 * WHY THIS EXISTS
 * ---------------
 * The restaurant and activity datasets were authored by name, not by coordinate.
 * Asking a language model for latitudes produces plausible-looking numbers that
 * are wrong often enough to matter, and a pin 400 m off in Canggu puts a
 * traveller on the wrong side of a rice field.
 *
 * So the numbers come from Nominatim, and every resolved record keeps the OSM
 * element it came from in `coordNote`. Records that cannot be resolved keep
 * their placeholder and are reported, so a human can look them up rather than
 * the pipeline inventing something.
 *
 * Nominatim's usage policy is respected: one request per second, and a real
 * User-Agent identifying the project.
 *
 *   node scripts/geocode-pois.mjs lib/data/destinations/bali-restaurants.ts
 *   node scripts/geocode-pois.mjs --all
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const UA = 'MeridianTravelPlanner/1.0 (educational demo; contact: repo owner)';
const ENDPOINT = 'https://nominatim.openstreetmap.org/search';

/** Bali, plus the Nusa Penida group. Anything outside this box is a bad match. */
const BALI_BOUNDS = { south: -9.0, north: -8.0, west: 114.4, east: 115.9 };

const PLACEHOLDER = /coordinates: \{ lat: 0, lng: 0, confidence: 'demo', coordNote: 'PENDING GEOCODE' \}/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function usage() {
  console.log('usage: node scripts/geocode-pois.mjs <file.ts> | --all');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) usage();

const FILES =
  args[0] === '--all'
    ? [
        'lib/data/destinations/bali-restaurants.ts',
        'lib/data/destinations/bali-activities.ts',
      ]
    : args;

/**
 * Area anchors, so a result can be sanity-checked against where the venue claims
 * to be. Read from the verified geography file rather than duplicated here.
 */
function loadAreaAnchors() {
  const source = readFileSync(join(ROOT, 'lib/data/destinations/bali-places.ts'), 'utf8');
  const anchors = new Map();
  const re = /id: "([a-z0-9-]+)",\s*\n\s*destinationId: 'bali',\s*\n\s*name: "([^"]+)",\s*\n\s*coordinates: \{ lat: (-?[\d.]+), lng: (-?[\d.]+)/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    anchors.set(m[1], { name: m[2], lat: Number(m[3]), lng: Number(m[4]) });
  }
  return anchors;
}

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function nominatim(query, attempt = 0, viewbox) {
  // `bounded=1` is what makes a common venue name usable: without it, searching
  // "Mason" returns a town in Ohio. Constraining the box to the area the venue
  // claims to be in turns a global name search into a local one.
  const box = viewbox ? `&viewbox=${viewbox}&bounded=1` : '';
  const url = `${ENDPOINT}?q=${encodeURIComponent(query)}&format=jsonv2&limit=3&addressdetails=1${box}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (res.status === 429 && attempt < 4) {
      await sleep(6000 * (attempt + 1));
      return nominatim(query, attempt + 1, viewbox);
    }
    if (!res.ok) return null;
    return await res.json();
  } catch {
    if (attempt < 4) {
      await sleep(3500 * (attempt + 1));
      return nominatim(query, attempt + 1, viewbox);
    }
    return null;
  }
}

/** A ~0.12° box around the area centre, left,top,right,bottom as Nominatim wants. */
function viewboxFor(anchor) {
  if (!anchor) return undefined;
  const d = 0.12;
  return `${anchor.lng - d},${anchor.lat + d},${anchor.lng + d},${anchor.lat - d}`;
}

/**
 * Query shapes, tried in order.
 *
 * The first version used one shape and resolved 23 of 100 — Nominatim's free-text
 * search is fussy about how much context you give it. More context helps for an
 * unambiguous name and hurts for a common one, so both directions are tried, and
 * the bounded forms catch what global search scatters.
 */
/**
 * The name as OSM is likely to hold it.
 *
 * `Goa Gajah (Elephant Cave)` returns nothing; `Goa Gajah` returns the temple.
 * `Betelnut Café` returns nothing; the accent is the problem. Both are the kind
 * of noise a data author naturally writes and a gazetteer does not.
 */
function cleanName(name) {
  return name
    .replace(/\s*[（(][^)）]*[)）]\s*/g, ' ')
    .split(' · ')[0]
    .split(' — ')[0]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function queryShapes(name, anchor) {
  const area = anchor?.name;
  const clean = cleanName(name);
  const shapes = [];
  if (clean !== name) {
    if (area) shapes.push({ q: `${clean}, ${area}, Bali`, box: undefined });
    shapes.push({ q: `${clean}, Bali`, box: viewboxFor(anchor) });
  }
  if (area) shapes.push({ q: `${name}, ${area}, Bali`, box: undefined });
  shapes.push({ q: `${clean}, Bali, Indonesia`, box: undefined });
  shapes.push({ q: clean, box: viewboxFor(anchor) });
  // Last resort: the original name, bounded to the area.
  shapes.push({ q: name, box: viewboxFor(anchor) });
  return shapes;
}

const anchors = loadAreaAnchors();
console.log(`area anchors loaded: ${anchors.size}`);

let totalResolved = 0;
let totalPending = 0;
const failures = [];

for (const relative of FILES) {
  const path = join(ROOT, relative);
  const source = readFileSync(path, 'utf8');

  if (!PLACEHOLDER.test(source)) {
    console.log(`\n${relative}: no pending coordinates`);
    continue;
  }

  console.log(`\n▶ ${relative}`);

  /*
   * Match each entry's id to its placeholder line, so the replacement lands on
   * the right record even though the coordinates line carries no id itself.
   */
  const entryRe =
    /id: '([a-z0-9-]+)',\n([\s\S]*?)coordinates: \{ lat: 0, lng: 0, confidence: 'demo', coordNote: 'PENDING GEOCODE' \}/g;

  const entries = [...source.matchAll(entryRe)].map((m) => ({ id: m[1], index: m.index }));
  console.log(`  ${entries.length} entries to resolve`);

  const patches = new Map();

  for (const [i, entry] of entries.entries()) {
    // The name and area sit between the id and the placeholder.
    const block = source.slice(entry.index, source.indexOf('coordinates:', entry.index));
    const name = /name: "([^"]+)"/.exec(block)?.[1] ?? entry.id;
    const areaId = /areaId: '([a-z0-9-]+)'/.exec(block)?.[1] ?? '';

    const anchor = anchors.get(areaId);

    let results = null;
    for (const shape of queryShapes(name, anchor)) {
      // eslint-disable-next-line no-await-in-loop
      const attempt = await nominatim(shape.q, 0, shape.box);
      await sleep(1500);
      if (Array.isArray(attempt) && attempt.length > 0) {
        results = attempt;
        break;
      }
    }

    if (!Array.isArray(results) || results.length === 0) {
      failures.push({ file: relative, id: entry.id, name, reason: 'no result' });
      totalPending += 1;
      process.stdout.write(`  [${i + 1}/${entries.length}] ✗ ${entry.id}\n`);
      continue;
    }

    // Prefer the first result inside Bali; fall back to the closest one.
    const inBali = results.filter((r) => {
      const lat = Number(r.lat);
      const lng = Number(r.lon);
      return lat >= BALI_BOUNDS.south && lat <= BALI_BOUNDS.north && lng >= BALI_BOUNDS.west && lng <= BALI_BOUNDS.east;
    });
    const chosen = inBali[0] ?? results[0];
    const point = { lat: Number(chosen.lat), lng: Number(chosen.lon) };

    const inBounds =
      point.lat >= BALI_BOUNDS.south && point.lat <= BALI_BOUNDS.north && point.lng >= BALI_BOUNDS.west && point.lng <= BALI_BOUNDS.east;
    const distanceKm = anchor ? haversineKm(anchor, point) : 0;

    /*
     * A result that is outside Bali, or 15 km from the area it claims to be in,
     * is not this venue. It stays ungeocoded and goes on the human list — a pin
     * in the wrong regency is worse than a blank one.
     */
    if (!inBounds || (anchor && distanceKm > 15)) {
      failures.push({
        file: relative,
        id: entry.id,
        name,
        reason: !inBounds ? `outside Bali (${chosen.display_name?.slice(0, 60)})` : `${distanceKm.toFixed(1)} km from ${areaId}`,
      });
      totalPending += 1;
      process.stdout.write(`  [${i + 1}/${entries.length}] ✗ ${entry.id} (${!inBounds ? 'outside Bali' : `${distanceKm.toFixed(1)}km off`})\n`);
      continue;
    }

    const confidence = distanceKm <= 6 ? 'verified' : 'approximate';
    const kind = chosen.type ? `${chosen.type}${chosen.osm_id ? ` ${chosen.osm_id}` : ''}` : 'node';
    const note = confidence === 'verified'
      ? `OpenStreetMap ${kind} — Nominatim match for "${name}", ${chosen.display_name?.split(',').slice(0, 3).join(', ') ?? 'Bali'}.`
      : `Approximate: OpenStreetMap ${kind} matched "${name}" ${distanceKm.toFixed(1)} km from the ${areaId} centre, so treat the pin as indicative.`;

    patches.set(entry.id, {
      replacement: `coordinates: { lat: ${point.lat.toFixed(5)}, lng: ${point.lng.toFixed(5)}, confidence: '${confidence}', coordNote: ${JSON.stringify(note)} }`,
      id: entry.id,
    });
    totalResolved += 1;
    process.stdout.write(`  [${i + 1}/${entries.length}] ✓ ${entry.id} ${confidence} ${distanceKm.toFixed(1)}km\n`);
  }

  /*
   * Patch by id, not by character offset.
   *
   * The first version recorded each entry's offset in the ORIGINAL source and
   * then did index surgery on a mutating string. It reported "11 resolved"
   * while leaving every placeholder in place — the offsets and the output had
   * drifted apart, and nothing about the result looked wrong.
   *
   * Matching `id -> placeholder` makes the operation idempotent and immune to
   * any drift: an id appears once, and the placeholder it owns is unambiguous.
   */
  let output = source;
  for (const [id, patch] of patches) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
      `(id: '${esc}',[\\s\\S]*?)coordinates: \\{ lat: 0, lng: 0, confidence: 'demo', coordNote: 'PENDING GEOCODE' \\}`,
    );
    if (!re.test(output)) {
      failures.push({ file: relative, id, name: id, reason: 'resolved but the placeholder could not be found — not written' });
      continue;
    }
    output = output.replace(re, `$1${patch.replacement}`);
  }

  // Anything still holding a placeholder did not resolve.
  const remaining = (output.match(/PENDING GEOCODE/g) ?? []).length;
  writeFileSync(path, output);
  console.log(`  wrote ${relative}: ${patches.size} resolved, ${remaining} still pending`);
}

console.log('\n────────────────────────────────────────');
console.log(`resolved: ${totalResolved}   still pending: ${totalPending}`);
if (failures.length > 0) {
  console.log('\nNeeds a human lookup:');
  for (const f of failures) console.log(`  ${f.id.padEnd(34)} ${f.reason}`);
  console.log('\nThese keep confidence "demo" and coordNote PENDING GEOCODE on purpose.');
  console.log('Do not ship them as verified.');
} else {
  console.log('Every entry resolved against OpenStreetMap.');
}
