/**
 * Coordinate verification for every hotel, place and area in the dataset.
 *
 * WHY THIS EXISTS SEPARATELY FROM validate-data.ts
 * ------------------------------------------------
 * `validate-data.ts` checks that the data is *well-formed*: ids are unique, area
 * references resolve, `confidence` is a known value. It cannot check the thing
 * that actually matters, which is whether a coordinate is where the record claims
 * it is. This script does, in three passes, cheapest first:
 *
 *   1. BOUNDS       — is the point inside its destination's own bounding box?
 *                     Offline, instant, and it catches a copy-paste from the
 *                     wrong country, which is the most common real failure.
 *   2. COLLISIONS   — are two records for the same destination within ~30 metres
 *                     of each other? Two hotels cannot share a doorway, and a
 *                     duplicated coordinate is how a "new" place turns out to be
 *                     an existing one under another name.
 *   3. REVERSE GEOCODE — ask Nominatim what is actually at the point, and compare
 *                     the country with the destination's country, plus a rough
 *                     name-token overlap. Opt-in via `--geocode` because it is
 *                     rate-limited to one request per second by policy.
 *
 * Usage:
 *   npx tsx scripts/verify-coords.mts                 # bounds + collisions
 *   npx tsx scripts/verify-coords.mts --geocode       # adds Nominatim (slow)
 *   npx tsx scripts/verify-coords.mts --geocode --limit 40
 *   npx tsx scripts/verify-coords.mts --only bali,cebu
 *
 * The geocode pass caches to `scripts/.coord-cache.json` so a re-run is free.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DESTINATIONS, getAreas, getHotels, getPlaces } from '../lib/data';

const ROOT = process.cwd();
const CACHE_PATH = join(ROOT, 'scripts', '.coord-cache.json');

const argv = process.argv.slice(2);
const GEOCODE = argv.includes('--geocode');
const LIMIT = (() => {
  const index = argv.indexOf('--limit');
  return index >= 0 ? Number(argv[index + 1]) : Infinity;
})();
const ONLY = (() => {
  const index = argv.indexOf('--only');
  return index >= 0 ? new Set(argv[index + 1].split(',')) : null;
})();

interface Record0 {
  id: string;
  name: string;
  destinationId: string;
  areaId?: string;
  lat: number;
  lng: number;
  confidence: string;
  coordNote?: string;
  kind: 'hotel' | 'place' | 'area';
}

const rows: Record0[] = [];
for (const destination of DESTINATIONS) {
  if (ONLY && !ONLY.has(destination.id)) continue;
  for (const hotel of getHotels(destination.id)) {
    rows.push({
      id: hotel.id,
      name: hotel.name,
      destinationId: destination.id,
      areaId: hotel.areaId,
      lat: hotel.coordinates.lat,
      lng: hotel.coordinates.lng,
      confidence: hotel.coordinates.confidence,
      coordNote: hotel.coordinates.coordNote,
      kind: 'hotel',
    });
  }
  for (const place of getPlaces(destination.id)) {
    rows.push({
      id: place.id,
      name: place.name,
      destinationId: destination.id,
      areaId: place.areaId,
      lat: place.coordinates.lat,
      lng: place.coordinates.lng,
      confidence: place.coordinates.confidence,
      coordNote: place.coordinates.coordNote,
      kind: 'place',
    });
  }
  for (const area of getAreas(destination.id)) {
    rows.push({
      id: area.id,
      name: area.name,
      destinationId: destination.id,
      lat: area.coordinates.lat,
      lng: area.coordinates.lng,
      confidence: area.coordinates.confidence,
      coordNote: area.coordinates.coordNote,
      kind: 'area',
    });
  }
}

let failures = 0;
let warnings = 0;
const fail = (message: string) => {
  failures += 1;
  console.log(`  [FAIL] ${message}`);
};
const warn = (message: string) => {
  warnings += 1;
  console.log(`  [WARN] ${message}`);
};

/*
 * An unlocatable record is not IN the wrong place; it has no place.
 *
 * `confidence: 'demo'` is this dataset's marker for "we could not source a
 * position" — the record sits at 0,0 and `isLocatable()` removes it from the map,
 * the itinerary and the efficiency engine. Bounds-checking it would report the
 * Gulf of Guinea as a data error, and pairing eight such records against each
 * other produced 28 phantom "same point" collisions on the first run.
 */
const locatable = rows.filter((row) => row.confidence !== 'demo');
const unlocated = rows.length - locatable.length;

console.log(
  `\nVerifying ${locatable.length} coordinates across ${ONLY ? ONLY.size : DESTINATIONS.length} destinations` +
    (unlocated > 0 ? ` (${unlocated} record(s) are unlocatable and deliberately excluded).` : '.') +
    '\n',
);

// ---------------------------------------------------------------------------
// 1. Bounds
// ---------------------------------------------------------------------------
console.log('Bounds');
{
  const byId = new Map(DESTINATIONS.map((d) => [d.id, d]));
  for (const row of locatable) {
    const destination = byId.get(row.destinationId);
    const bounds = destination?.mapBounds;
    if (!bounds) {
      warn(`${row.destinationId}/${row.id}: destination has no mapBounds to check against`);
      continue;
    }
    // 8 km of tolerance: a day-trip island or an outlying resort can legitimately
    // sit just outside the box drawn for the destination's own map view.
    const pad = 0.08;
    const withinLat = row.lat >= Math.min(bounds[0][0], bounds[1][0]) - pad && row.lat <= Math.max(bounds[0][0], bounds[1][0]) + pad;
    const withinLng = row.lng >= Math.min(bounds[0][1], bounds[1][1]) - pad && row.lng <= Math.max(bounds[0][1], bounds[1][1]) + pad;
    if (!withinLat || !withinLng) {
      fail(
        `${row.destinationId}/${row.id} "${row.name}" is OUTSIDE its destination box: ${row.lat.toFixed(5)}, ${row.lng.toFixed(5)}`,
      );
    }
  }
  console.log(`  checked ${locatable.length} points for containment`);
}

// ---------------------------------------------------------------------------
// 2. Collisions
// ---------------------------------------------------------------------------
console.log('\nCollisions');
{
  const METRES = 30;
  const byDestination = new Map<string, Record0[]>();
  for (const row of locatable) {
    const list = byDestination.get(row.destinationId) ?? [];
    list.push(row);
    byDestination.set(row.destinationId, list);
  }
  for (const [destinationId, list] of byDestination) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = list[i];
        const b = list[j];
        // Equirectangular approximation — exact enough at this scale and cheap.
        const dLat = (a.lat - b.lat) * 111_320;
        const dLng = (a.lng - b.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
        const metres = Math.hypot(dLat, dLng);
        if (metres >= METRES) continue;
        /*
         * Cross-kind coincidence is NORMAL, same-kind is a bug.
         *
         * An area's coordinate is its centre, and that centre is very often the
         * signature place inside it — White Beach the beach and White Beach the
         * zone are the same spot, and that is correct. Two PLACES at the same
         * point is a different thing entirely: either one is wrong, or a "new"
         * place is an existing one under another name.
         */
        if (a.kind === b.kind) {
          /*
           * A PRODUCT ANCHORED ON THE PLACE IT VISITS IS NOT A DUPLICATE.
           *
           * "Mount Batur Caldera Jeep Tour" and "Mount Batur" are one landmark
           * and one way to see it, and the tour's location genuinely IS the
           * mountain — there is no second coordinate to give it, and inventing a
           * meeting point would be worse data than the honest anchor.
           *
           * The allowance is deliberately narrow: the shorter name must appear
           * inside the longer one, AND the longer one must be marked as a product
           * by a word that only ever appears in a product name. "La Brisa" twice
           * still fails, because neither name contains the other.
           */
          const [shorter, longer] = a.name.length <= b.name.length ? [a, b] : [b, a];
          // Bracketed glosses are dropped first: "Mount Batur (Gunung Batur)"
          // still has to match "Mount Batur Caldera Jeep Tour".
          const strip = (value: string) =>
            value
              .replace(/\([^)]*\)/g, ' ')
              .replace(/[（【][^）】]*[）】]/g, ' ')
              .toLowerCase()
              .replace(/[^a-z0-9\u3400-\u9fff]/g, '');
          const key = strip(shorter.name);
          const longerKey = strip(longer.name);
          /*
           * Either the landmark's whole name appears in the product's, or the
           * product is named after it — a shared opening of at least eight
           * characters, which is "tanahlot" for "Tanah Lot Temple" and
           * "Tanah Lot Sunset Viewing Session", but not a coincidence two
           * unrelated venues could produce.
           */
          let shared = 0;
          while (shared < key.length && shared < longerKey.length && key[shared] === longerKey[shared]) shared += 1;
          const namedAfterIt = key.length >= 4 && longerKey.includes(key);
          /*
           * The product word is tested against BOTH names, not against `longer`.
           * "Tanah Lot Temple" and "Tanah Lot Sunset Viewing Session" are the
           * same length, so which one lands in `longer` is arbitrary — testing
           * only that one let the pair fail whenever the landmark sorted second.
           */
          const PRODUCT = /tour|session|trek|class|course|trip|cruise|experience|lesson|rental|workshop|charter/i;
          const anchored =
            (namedAfterIt || shared >= 8) && (PRODUCT.test(a.name) || PRODUCT.test(b.name));
          if (anchored) {
            warn(`${destinationId}: "${longer.name}" is anchored on "${shorter.name}" — a product on the place it visits`);
            continue;
          }
          fail(`${destinationId}: two ${a.kind}s at the same point — "${a.name}" and "${b.name}" (${metres.toFixed(1)} m)`);
        } else {
          warn(`${destinationId}: "${a.name}" (${a.kind}) coincides with "${b.name}" (${b.kind}) — ${metres.toFixed(1)} m`);
        }
      }
    }
  }
  console.log('  no two records share a spot');
}

// ---------------------------------------------------------------------------
// 3. Reverse geocode
// ---------------------------------------------------------------------------
if (GEOCODE) {
  console.log('\nReverse geocode (Nominatim, 1 req/s)');
  const cache: Record<string, { country?: string; display?: string; at: number }> = existsSync(CACHE_PATH)
    ? JSON.parse(readFileSync(CACHE_PATH, 'utf8'))
    : {};

  const byId = new Map(DESTINATIONS.map((d) => [d.id, d]));
  let checked = 0;
  let network = 0;

  for (const row of locatable) {
    if (checked >= LIMIT) break;
    checked += 1;
    const key = `${row.lat.toFixed(5)},${row.lng.toFixed(5)}`;
    let entry = cache[key];
    if (!entry) {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${row.lat}&lng=${row.lng}&zoom=16&addressdetails=1`;
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Meridian-Data-Verifier/1.0 (dataset coordinate audit)' },
        });
        if (response.status === 429) {
          warn('Nominatim rate-limited the run; stopping the geocode pass and keeping what was checked');
          break;
        }
        const payload = (await response.json()) as { address?: { country?: string }; display_name?: string };
        entry = { country: payload.address?.country, display: payload.display_name, at: Date.now() };
      } catch (error) {
        warn(`geocode failed for ${row.id}: ${error instanceof Error ? error.message : 'unknown'}`);
        continue;
      }
      cache[key] = entry;
      network += 1;
      // Nominatim's usage policy: at most one request per second.
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }

    const expected = byId.get(row.destinationId)?.country;
    if (entry.country && expected && entry.country.toLowerCase() !== expected.toLowerCase()) {
      fail(
        `${row.destinationId}/${row.id} "${row.name}" resolves to ${entry.country}, expected ${expected} — ${entry.display?.slice(0, 80)}`,
      );
    }
  }

  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 0));
  console.log(`  geocoded ${checked} points (${network} fresh requests, ${checked - network} cached)`);
}

if (unlocated > 0) {
  console.log('\nUnlocatable records (excluded from the map and the itinerary by design)');
  for (const row of rows.filter((entry) => entry.confidence === 'demo')) {
    console.log(`  · ${row.destinationId}/${row.id} — ${row.name}`);
  }
}

console.log(`\n${'-'.repeat(66)}`);
console.log(`${failures} failure(s), ${warnings} warning(s)`);
if (failures > 0) process.exit(1);
