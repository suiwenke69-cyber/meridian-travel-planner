#!/usr/bin/env node
/**
 * Look up a real coordinate for a place, and say how good the answer is.
 *
 * WHY THIS IS A TOOL AND NOT A ONE-OFF
 * ------------------------------------
 * A dataset coordinate has to be traceable to a source, and hand-rolling a
 * Nominatim query per record produced exactly the bug this exists to prevent:
 * several places ended up sharing one coordinate because only the first lookup
 * succeeded and the rest were given the same point.
 *
 * So this tool runs three lookups in order of trust and prints WHICH ONE
 * answered, so the caller can record the right `confidence`:
 *
 *   1. name     — an OSM object whose name matches. Strongest: it is a surveyed
 *                 position for that specific venue.  → confidence "verified"
 *   2. address  — the venue's published street address, geocoded to street level.
 *                 Honest and useful, but it is the street, not the doorway.
 *                                                     → confidence "approximate"
 *   3. none     — nothing found. The right answer is then to mark the record
 *                 unlocatable rather than borrow a neighbour's coordinate.
 *
 * Usage:
 *   node scripts/lookup-place.mjs --name "La Lucciola" --area Seminyak --near -8.69,115.16
 *   node scripts/lookup-place.mjs --name "Betelnut" --area Canggu --address "Jalan Pantai Batu Bolong, Canggu"
 *   node scripts/lookup-place.mjs --name Bebek --area Ubud --raw       # more candidates
 *
 * Rate limited to Nominatim's policy: one request per second.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CACHE_PATH = join(process.cwd(), 'scripts', '.lookup-cache.json');

/**
 * Cache writes go through a temporary file and a rename.
 *
 * Several authors run this tool at once, and a direct `writeFileSync` let two
 * processes interleave: one truncating the file while the other appended, which
 * produced a cache that was valid JSON for its first 156 KB followed by a
 * truncated fragment — and then every later run died before it could start.
 * A rename is atomic on POSIX, so a reader sees either the old file or the new
 * one and never a half-written one.
 */
function saveCache() {
  const temporary = `${CACHE_PATH}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify(cache));
  renameSync(temporary, CACHE_PATH);
}
const UA = 'Meridian-Data-Audit/1.0 (dataset coordinate verification)';

const args = process.argv.slice(2);
const flag = (name, fallback = undefined) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const RAW = args.includes('--raw');

const NAME = flag('name');
const AREA = flag('area', '');
/** The country of the destination, so a lookup is never ambiguous across borders. */
const COUNTRY = flag('country', 'Bali, Indonesia');
const ADDRESS = flag('address');
const NEAR = flag('near');

if (!NAME) {
  console.error('usage: node scripts/lookup-place.mjs --name "<place>" [--area "<area>"] [--address "<street>"] [--near lat,lng]');
  process.exit(2);
}

const origin = NEAR
  ? (() => {
      const [lat, lng] = NEAR.split(',').map(Number);
      return { lat, lng };
    })()
  : null;

const cache = existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, 'utf8')) : {};
let networkCalls = 0;

const LOCK_PATH = join(process.cwd(), 'scripts', '.lookup-lock');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A CROSS-PROCESS rate limiter.
 *
 * Nominatim allows one request per second per client, and "client" means the
 * whole machine. With several authors running this tool at once, each process
 * politely waiting 1.2s after ITS OWN request still put six requests per second
 * on the endpoint — and the endpoint answered 429 to all of them, so nobody made
 * progress. A shared timestamp file is the smallest thing that makes the limit
 * real: a caller waits until 1.25s have passed since the last request by ANY
 * process, then claims the slot and goes.
 */
async function throttle() {
  for (;;) {
    let last = 0;
    try {
      last = Number(readFileSync(LOCK_PATH, 'utf8')) || 0;
    } catch {
      last = 0;
    }
    // A crashed process can leave a lock behind; anything older than 15s is stale.
    if (last > Date.now() + 15_000 || last < Date.now() - 15_000) {
      writeFileSync(LOCK_PATH, String(Date.now()));
      return;
    }
    const wait = last + 1250 - Date.now();
    if (wait <= 0) {
      writeFileSync(LOCK_PATH, String(Date.now()));
      return;
    }
    await sleep(Math.min(wait, 400));
  }
}

/** 429 is "come back later", not "stop". A cap of 8 attempts keeps it bounded. */
async function request(url) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await throttle();
    const response = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    if (response.status === 429) {
      const backoff = 5000 * (attempt + 1);
      process.stderr.write(`  (429 from Nominatim; waiting ${backoff / 1000}s — ${7 - attempt} attempt(s) left)\n`);
      await sleep(backoff);
      continue;
    }
    if (response.status === 403) throw new Error('forbidden_403');
    return response;
  }
  throw new Error('rate_limited_after_retries');
}

async function cached(key, url) {
  if (cache[key]) return cache[key];
  const response = await request(url);
  if (!response) throw new Error('no_response');
  const json = await response.json();
  cache[key] = json;
  networkCalls += 1;
  saveCache();
  return json;
}

const metres = (a, b) =>
  Math.hypot((a.lat - b.lat) * 111_320, (a.lng - b.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180));

/**
 * How far a candidate may be from the area it claims to be in.
 *
 * This gate is the whole reason the tool exists. Without it, "La Lucciola" in
 * Cremona, Italy is a name match for "La Lucciola" in Seminyak — and accepting
 * that is precisely how a dataset gets a confidently wrong coordinate. A
 * restaurant is not 13,000 km from its own neighbourhood.
 */
const MAX_DISTANCE_M = 30_000;

function describe(label, results, limit) {
  const rejected = [];
  const kept = [];
  for (const result of results) {
    const point = { lat: Number(result.lat), lng: Number(result.lon) };
    if (origin && metres(origin, point) > MAX_DISTANCE_M) {
      rejected.push({ result, distance: metres(origin, point) });
      continue;
    }
    kept.push(result);
  }

  const rows = kept.slice(0, limit).map((result) => ({
    lat: Number(result.lat),
    lon: Number(result.lon),
    name: result.name || (result.display_name ?? '').split(',')[0],
    type: result.type || result.category,
    display: (result.display_name ?? '').slice(0, 90),
    distance: origin ? Math.round(metres(origin, { lat: Number(result.lat), lng: Number(result.lon) })) : null,
  }));
  console.log(`\n[${label}] ${rows.length} usable result(s)` + (rejected.length ? `, ${rejected.length} rejected as too far away` : ''));
  for (const row of rows) {
    console.log(
      `  ${row.lat.toFixed(5)}, ${row.lon.toFixed(5)}  ${row.distance != null ? `${row.distance}m  ` : ''}${row.type ?? ''}  |  ${row.name}  |  ${row.display}`,
    );
  }
  if (rows.length === 0) console.log('  (none)');
  for (const entry of rejected.slice(0, 3)) {
    const name = entry.result.name || (entry.result.display_name ?? '').split(',')[0];
    console.log(`  ✗ rejected ${Math.round(entry.distance / 1000)} km away: ${name} — ${(entry.result.display_name ?? '').slice(0, 70)}`);
  }
  return rows;
}

/**
 * Overpass — the SAME OpenStreetMap data, through a different door.
 *
 * Nominatim is a geocoder with a hard one-request-per-second policy and it
 * IP-blocks a machine that exceeds it, which is exactly what happened when six
 * authors ran lookups at once. Overpass serves the same surveyed OSM objects and
 * is designed for this shape of query: "objects whose name matches X within N
 * metres of a point".
 *
 * It is the PRIMARY source here for that reason. Nominatim remains the fallback,
 * and both are the same data, so switching between them changes nothing about
 * what a coordinate means.
 */
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function overpassDisplay(tags, fallback) {
  const parts = [
    tags.name,
    tags['addr:street'],
    tags['addr:suburb'] ?? tags['addr:quarter'],
    tags['addr:city'] ?? tags['addr:town'] ?? tags['addr:village'],
    tags['addr:state'],
    tags.country,
  ].filter(Boolean);
  return parts.length > 1 ? parts.join(', ') : fallback;
}

function overpassType(tags) {
  return tags.amenity ?? tags.tourism ?? tags.shop ?? tags.leisure ?? tags.historic ?? tags.natural ?? 'osm';
}

async function overpassSearch(name, radiusM = MAX_DISTANCE_M) {
  if (!origin) return [];
  const filter = `["name"~"${escapeRegex(name)}",i]`;
  const query = `[out:json][timeout:25];(nwr${filter}(around:${radiusM},${origin.lat},${origin.lng}););out center 12;`;
  const key = `overpass:${name.toLowerCase()}:${origin.lat},${origin.lng}:${radiusM}`;
  if (cache[key]) return cache[key];

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      // Overpass asks for courtesy rather than publishing a hard figure; the shared
      // slot is cheap next to its timeout and keeps a mirror from being hammered.
      await throttle();
      const response = await fetch(mirror, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: query }).toString(),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) continue;
      const payload = await response.json();
      const results = (payload.elements ?? [])
        .map((element) => {
          const lat = element.lat ?? element.center?.lat;
          const lon = element.lon ?? element.center?.lon;
          if (typeof lat !== 'number' || typeof lon !== 'number') return null;
          const tags = element.tags ?? {};
          return {
            lat,
            lon,
            name: tags.name ?? name,
            type: overpassType(tags),
            display_name: overpassDisplay(tags, `${element.type}/${element.id}`),
            osm: `${element.type}/${element.id}`,
          };
        })
        .filter(Boolean);
      cache[key] = results;
      saveCache();
      return results;
    } catch {
      // Try the next mirror.
    }
  }
  return [];
}

/**
 * Photon — a geocoder built from the same OpenStreetMap data.
 *
 * Added after Nominatim IP-blocked this machine for exceeding one request per
 * second across several authors. Photon has no comparable hard quota, accepts a
 * bias point so results come back in the right neighbourhood, and returns OSM
 * objects — the same source of truth, so a coordinate means the same thing
 * whichever door it came through.
 */
async function photonSearch(query) {
  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lang=en` +
    (origin ? `&lat=${origin.lat}&lon=${origin.lng}` : '');
  const key = `photon:${query.toLowerCase()}:${origin ? `${origin.lat},${origin.lng}` : ''}`;
  if (cache[key]) return cache[key];
  try {
    /*
     * Photon is deliberately NOT behind the shared throttle.
     *
     * The lock exists because Nominatim allows one request per second per machine
     * and IP-blocks a client that exceeds it. Photon has no comparable hard quota,
     * and routing it through the same lock meant fourteen concurrent authors each
     * waiting ~17 seconds for a slot they did not need to share.
     */
    const response = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) return [];
    const payload = await response.json();
    const results = (payload.features ?? []).map((feature) => {
      const properties = feature.properties ?? {};
      const [lon, lat] = feature.geometry?.coordinates ?? [];
      return {
        lat,
        lon,
        name: properties.name ?? query,
        type: properties.osm_value ?? properties.type ?? 'osm',
        display_name: [
          properties.name,
          properties.street,
          properties.district ?? properties.locality,
          properties.city,
          properties.state,
          properties.country,
        ]
          .filter(Boolean)
          .join(', '),
        osm: properties.osm_type && properties.osm_id ? `${properties.osm_type}/${properties.osm_id}` : undefined,
      };
    });
    const filtered = results.filter((row) => typeof row.lat === 'number' && typeof row.lon === 'number');
    cache[key] = filtered;
    saveCache();
    return filtered;
  } catch {
    return [];
  }
}

const out = { query: { name: NAME, area: AREA, address: ADDRESS ?? null }, name: [], address: [] };

try {
  // --- 1. the venue itself. Photon first, then Overpass, then Nominatim ----
  const byPhoton = await photonSearch([NAME, AREA].filter(Boolean).join(' '));
  out.name = describe('name (Photon/OSM)', byPhoton, RAW ? 8 : 5);

  if (out.name.length === 0) {
    const byOverpass = await overpassSearch(NAME);
    out.name = describe('name (Overpass/OSM)', byOverpass, RAW ? 8 : 5);
  }

  // --- 1b. Nominatim as the fallback ---------------------------------------
  if (out.name.length === 0) {
    try {
      const nameQuery = [NAME, AREA, COUNTRY].filter(Boolean).join(', ');
      const byName = await cached(
        `name:${nameQuery.toLowerCase()}`,
        `https://nominatim.openstreetmap.org/search?format=json&limit=${RAW ? 8 : 4}&q=${encodeURIComponent(nameQuery)}`,
      );
      out.name = describe('name (Nominatim)', byName, RAW ? 8 : 4);

      if (out.name.length === 0) {
        const bare = await cached(`name:${NAME.toLowerCase()}`, `https://nominatim.openstreetmap.org/search?format=json&limit=4&q=${encodeURIComponent(NAME)}`);
        out.name = describe('name (Nominatim, no locality)', bare, 4);
      }
    } catch (error) {
      console.log(`\n[nominatim] unavailable (${error.message}) — Overpass is the source of record for this run`);
    }
  }

  // --- 2. the street address ----------------------------------------------
  if (ADDRESS) {
    // A street name is itself an OSM object, so Overpass answers this too.
    const streetName = ADDRESS.split(',')[0].trim();
    const byStreet = await overpassSearch(streetName);
    const streetHits = byStreet.filter((row) => /road|street|residential|service|pedestrian|primary|secondary|tertiary|unclassified/i.test(String(row.type)));
    out.address = describe('address (Overpass street)', streetHits.length > 0 ? streetHits : byStreet, 4);
    if (out.address.length === 0) {
      try {
        const addressQuery = [ADDRESS, AREA, COUNTRY].filter(Boolean).join(', ');
        const byAddress = await cached(
          `addr:${addressQuery.toLowerCase()}`,
          `https://nominatim.openstreetmap.org/search?format=json&limit=4&q=${encodeURIComponent(addressQuery)}`,
        );
        out.address = describe('address (Nominatim)', byAddress, 4);
      } catch {
        console.log('[nominatim] unavailable for the address lookup too');
      }
    }
  }
} catch (error) {
  console.error(`\nlookup error: ${error.message}`);
  console.error('If Nominatim rate-limited this run, wait a minute and try again — the cache keeps what already succeeded.');
  process.exit(1);
}

// --- verdict ---------------------------------------------------------------
/*
 * A RESULT IS NOT A MATCH.
 *
 * Photon and Nominatim both return fuzzy neighbours — searching "La Lucciola"
 * also offers a laundry on the next street. Taking result zero blindly is how a
 * dataset gets a coordinate for a business that is not the one it names, so the
 * candidate's own name has to actually contain the query (or the query it),
 * after normalising punctuation and case.
 */
const normalise = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\u3400-\u9fff]/g, '');

/**
 * Generic geographic names that are never the venue somebody asked for.
 *
 * A query like "Courtyard Hanoi" contains "Hanoi", and OSM has a city node with
 * exactly that name — so the old symmetric substring test called the CITY
 * CENTROID a verified match for a hotel. That is the same class of error as
 * accepting a same-named restaurant in Italy, just harder to notice because the
 * answer lands in the right country. Six Hanoi hotels were nearly placed on the
 * city node before an author caught it by hand.
 */
const GENERIC_PLACE_TYPES = new Set([
  'city', 'town', 'village', 'hamlet', 'municipality', 'county', 'state', 'region',
  'country', 'administrative', 'suburb', 'neighbourhood', 'quarter', 'locality',
  'district', 'province', 'island', 'archipelago',
]);

function nameMatches(query, candidate, type) {
  if (GENERIC_PLACE_TYPES.has(String(type ?? '').toLowerCase())) return false;
  const a = normalise(query);
  const b = normalise(candidate);
  if (a.length < 3 || b.length < 3) return false;
  // The candidate may be the whole query, or a substantial part of it — never a
  // single generic word prised out of a longer name.
  if (a.includes(b)) return true;
  return b.includes(a) && a.length >= Math.max(4, Math.round(b.length * 0.6));
}

const exactName = out.name.find((row) => nameMatches(NAME, row.name, row.type)) ?? null;

/*
 * A branch of a chain is not the branch you asked for.
 *
 * "Anomali Coffee Sanur" resolved to the Jl. Dewi Sri outlet 10 km away: same
 * brand, right island, wrong shop — and it passed both the distance gate and the
 * name gate. When `--area` is given, the returned address has to mention it.
 */
const localityMismatch =
  exactName && AREA
    ? !normalise(exactName.display).includes(normalise(AREA))
    : false;
const best = exactName ?? out.address[0] ?? null;

console.log('\nVERDICT');
if (out.name.length > 0 && !exactName) {
  console.log(`  NO NAME MATCH — the ${out.name.length} result(s) above are similar names, not this business.`);
  console.log('  Do not use them. Try --address, a different spelling, or mark the record unlocatable.');
} else if (exactName && localityMismatch) {
  console.log(`  NAME MATCHES BUT THE LOCALITY DOES NOT — "${exactName.name}" is at ${exactName.display}`);
  console.log(`  You asked for "${AREA}". This is very likely a DIFFERENT BRANCH of the same brand.`);
  console.log('  Use --address, add the branch to --name, or mark the record unlocatable.');
} else if (exactName) {
  console.log(`  confidence "verified" — OSM has an object named like this: ${exactName.lat}, ${exactName.lon}`);
  console.log(`  coordNote: OSM ${exactName.type} "${exactName.name}"${exactName.osm ? ` (${exactName.osm})` : ''} — ${exactName.display}`);
} else if (out.address.length > 0) {
  console.log(`  confidence "approximate" — no OSM object for the venue; street-level from the address: ${best.lat}, ${best.lon}`);
  console.log(`  coordNote: no OSM object for this venue. Position geocoded from its published street address (${ADDRESS}); street level, not the doorway.`);
} else {
  console.log('  NO SOURCE FOUND. Do not invent a coordinate and do not copy a neighbour\'s.');
  console.log('  Mark the record unlocatable (coordinates { lat: 0, lng: 0, confidence: "demo" }) so it is excluded from the map and the itinerary.');
}
console.log(`\n(${networkCalls} network request(s); the rest came from the local cache)`);
