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

async function nominatim(query, attempt = 0) {
  const url = `${ENDPOINT}?q=${encodeURIComponent(query)}&format=jsonv2&limit=3&addressdetails=1`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (res.status === 429 && attempt < 3) {
      await sleep(4000 * (attempt + 1));
      return nominatim(query, attempt + 1);
    }
    if (!res.ok) return null;
    return await res.json();
  } catch {
    if (attempt < 3) {
      await sleep(2500 * (attempt + 1));
      return nominatim(query, attempt + 1);
    }
    return null;
  }
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
    const query = anchor ? `${name}, ${anchor.name}, Bali` : `${name}, Bali`;

    const results = await nominatim(query);
    await sleep(1100);

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

    patches.set(entry.index, {
      replacement: `coordinates: { lat: ${point.lat.toFixed(5)}, lng: ${point.lng.toFixed(5)}, confidence: '${confidence}', coordNote: ${JSON.stringify(note)} }`,
      id: entry.id,
    });
    totalResolved += 1;
    process.stdout.write(`  [${i + 1}/${entries.length}] ✓ ${entry.id} ${confidence} ${distanceKm.toFixed(1)}km\n`);
  }

  /*
   * Rebuild from the end so earlier indices stay valid.
   */
  let output = source;
  const ordered = [...patches.entries()].sort((a, b) => b[0] - a[0]);
  for (const [index, patch] of ordered) {
    const coordStart = output.indexOf('coordinates:', index);
    const coordEnd = output.indexOf('}', output.indexOf('coordNote', coordStart)) + 1;
    output = output.slice(0, coordStart) + patch.replacement + output.slice(coordEnd);
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
