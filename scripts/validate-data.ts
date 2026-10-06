/**
 * Data integrity checks for the destination registry.
 *
 * Run with `npm run validate:data`. Every check here exists because the
 * corresponding failure has actually happened during development:
 *
 *   - a NaN radius crashed Leaflet and blanked the destination planner
 *   - a duplicated hotel id produced a React key collision
 *   - a brandId with no entry in the brand registry silently lost its
 *     positioning label
 *
 * Nothing in this file is optional polish: a failure means the product is
 * broken or the data is dishonest, so it exits non-zero.
 */

import {
  DESTINATIONS,
  getAirports,
  getAllHotels,
  getAllPlaces,
  getAreas,
  destinationStats,
} from '../lib/data/index';
import { readFileSync } from 'node:fs';
import { HOTEL_BRANDS } from '../lib/data/hotel-brands';
import { haversineKm } from '../lib/geo';
import type { MarkerLayer } from '../lib/types';

const VALID_LAYERS: MarkerLayer[] = [
  'marriott',
  'hilton',
  'activity',
  'nature',
  'beach',
  'food',
  'nightlife',
  'airport',
  'transport',
];

type Problem = { level: 'error' | 'warn'; message: string };
const problems: Problem[] = [];
const err = (message: string) => problems.push({ level: 'error', message });
const warn = (message: string) => problems.push({ level: 'warn', message });

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

// --- 1. destinations --------------------------------------------------------
const destinationIds = new Set<string>();
const destinationByArea = new Map<string, Set<string>>();

for (const destination of DESTINATIONS) {
  if (destinationIds.has(destination.id)) err(`duplicate destination id: ${destination.id}`);
  destinationIds.add(destination.id);

  if (!/^[a-z0-9-]+$/.test(destination.id)) err(`${destination.id}: id must be kebab-case`);
  if (!destination.description || destination.description.length < 60) {
    warn(`${destination.id}: description is very short`);
  }
  if (!destination.provenance?.sources?.length) err(`${destination.id}: no provenance sources`);

  const lat = destination.coordinates.lat;
  const lng = destination.coordinates.lng;
  if (!finite(lat) || !finite(lng)) err(`${destination.id}: non-finite destination coordinates`);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) err(`${destination.id}: coordinates out of range`);

  if (!destination.airports.length && destination.status === 'reference') {
    err(`${destination.id}: reference destination has no airport`);
  }
  destinationByArea.set(destination.id, new Set(destination.areas.map((a) => a.id)));

  for (const airport of destination.airports) {
    if (!/^[A-Z]{3}$/.test(airport.code)) err(`${destination.id}/${airport.id}: "${airport.code}" is not a 3-letter IATA code`);
    if (!finite(airport.coordinates.lat) || !finite(airport.coordinates.lng)) {
      err(`${destination.id}/${airport.id}: non-finite airport coordinates`);
    }
    for (const transfer of airport.transfers ?? []) {
      if (!destinationByArea.get(destination.id)?.has(transfer.areaId)) {
        warn(`${destination.id}/${airport.id}: transfer references unknown area "${transfer.areaId}"`);
      }
      if (transfer.minutesMin > transfer.minutesMax) {
        err(`${destination.id}/${airport.id}: transfer ${transfer.areaId} has min > max`);
      }
    }
  }
}

// --- 2. areas ---------------------------------------------------------------
for (const destination of DESTINATIONS) {
  const seen = new Set<string>();
  for (const area of getAreas(destination.id)) {
    if (seen.has(area.id)) err(`${destination.id}: duplicate area id ${area.id}`);
    seen.add(area.id);

    if (!finite(area.radiusMeters) || area.radiusMeters <= 0) {
      err(`${destination.id}/${area.id}: radiusMeters is ${area.radiusMeters} — this crashes Leaflet`);
    }
    if (!finite(area.coordinates.lat) || !finite(area.coordinates.lng)) {
      err(`${destination.id}/${area.id}: non-finite area coordinates`);
    }
    if (!area.summary || area.summary.length < 20) warn(`${destination.id}/${area.id}: summary is very short`);
    if (!area.bestFor.length) warn(`${destination.id}/${area.id}: no bestFor entries`);

    for (const [key, value] of Object.entries(area.scores)) {
      if (!finite(value) || value < 0 || value > 5) {
        err(`${destination.id}/${area.id}: score ${key} = ${value} is outside 0–5`);
      }
    }
  }
  if (getAreas(destination.id).length === 0) err(`${destination.id}: no areas`);
  if (!getAreas(destination.id).some((a) => a.isStayBase)) err(`${destination.id}: no stay-base area`);
}

// --- 3. hotels --------------------------------------------------------------
const brandIds = new Set(HOTEL_BRANDS.map((b) => b.id));
const hotelIds = new Set<string>();
for (const hotel of getAllHotels()) {
  const key = `${hotel.destinationId}/${hotel.id}`;
  if (hotelIds.has(key)) err(`duplicate hotel id: ${key} — this causes a React key collision`);
  hotelIds.add(key);

  if (!brandIds.has(hotel.brandId)) {
    err(`${hotel.destinationId}/${hotel.id}: brandId "${hotel.brandId}" is not in the brand registry`);
  }
  if (!destinationByArea.get(hotel.destinationId)?.has(hotel.areaId)) {
    err(`${hotel.destinationId}/${hotel.id}: areaId "${hotel.areaId}" does not exist`);
  }
  if (!finite(hotel.coordinates.lat) || !finite(hotel.coordinates.lng)) {
    err(`${hotel.destinationId}/${hotel.id}: non-finite coordinates`);
  }
  if (!/^\$+$/.test(hotel.priceTier)) err(`${hotel.destinationId}/${hotel.id}: priceTier "${hotel.priceTier}" is malformed`);
  if (!hotel.priceTierBasis) err(`${hotel.destinationId}/${hotel.id}: priceTierBasis is required (never show a bare tier)`);
  if (/\d{2,}[.,]?\d*\s*(IDR|USD|SGD|VND|PHP|THB|MYR|KHR)/i.test(hotel.description)) {
    err(`${hotel.destinationId}/${hotel.id}: description appears to contain a price`);
  }
  if (hotel.hotelGroup !== 'marriott' && hotel.hotelGroup !== 'hilton') {
    err(`${hotel.destinationId}/${hotel.id}: hotelGroup must be marriott or hilton`);
  }
  if (!hotel.coordinates.confidence) err(`${hotel.destinationId}/${hotel.id}: missing coordinate confidence`);
}

/*
 * Two records for the same physical property.
 *
 * This actually shipped: "Four Points by Sheraton Bali, Ungasan" existed twice
 * under two ids and two Marriott property codes, at identical coordinates. The
 * duplicate-id check above could not see it, because the ids differed — the
 * STAY list simply showed the hotel twice. Same brand plus the same spot on the
 * map is a duplicate.
 */
const hotelSites = new Map<string, { id: string; name: string }>();
for (const hotel of getAllHotels()) {
  for (const [key, seen] of hotelSites) {
    const [destinationId, lat, lng] = key.split('|');
    if (destinationId !== hotel.destinationId) continue;
    if (haversineKm({ lat: Number(lat), lng: Number(lng) }, hotel.coordinates) > 0.15) continue;
    err(
      `${hotel.destinationId}: "${hotel.id}" and "${seen.id}" are the same property plotted twice ` +
        `(${hotel.brandId} at the same coordinates) — the STAY list will show it twice`,
    );
  }
  hotelSites.set(`${hotel.destinationId}|${hotel.coordinates.lat}|${hotel.coordinates.lng}`, {
    id: hotel.id,
    name: hotel.name,
  });
}

// --- 4. places --------------------------------------------------------------
const placeIds = new Set<string>();
for (const place of getAllPlaces()) {
  const key = `${place.destinationId}/${place.id}`;
  if (placeIds.has(key)) err(`duplicate place id: ${key}`);
  placeIds.add(key);

  if (!destinationByArea.get(place.destinationId)?.has(place.areaId)) {
    err(`${place.destinationId}/${place.id}: areaId "${place.areaId}" does not exist`);
  }
  if (!finite(place.coordinates.lat) || !finite(place.coordinates.lng)) {
    err(`${place.destinationId}/${place.id}: non-finite coordinates`);
  }
  if (!VALID_LAYERS.includes(place.markerLayer)) {
    err(`${place.destinationId}/${place.id}: markerLayer "${place.markerLayer}" is not a known layer`);
  }
  if (!finite(place.recommendedDurationMin) || place.recommendedDurationMin <= 0) {
    err(`${place.destinationId}/${place.id}: recommendedDurationMin must be a positive number`);
  }
  if (!place.description) err(`${place.destinationId}/${place.id}: missing description`);
  if (!place.coordinates.confidence) err(`${place.destinationId}/${place.id}: missing coordinate confidence`);
}

/*
 * Every entity has to be inside the destination's own map bounds.
 *
 * The map fits those bounds on arrival, so an entity outside them is an entity
 * the traveller can never see without panning into empty space — and it is the
 * signature of a transposed lat/lng or a copied coordinate from another island.
 */
for (const destination of DESTINATIONS) {
  const bounds = destination.mapBounds;
  if (!bounds) continue;
  const [[south, west], [north, east]] = bounds;
  const inside = (c: { lat: number; lng: number }) =>
    c.lat >= south && c.lat <= north && c.lng >= west && c.lng <= east;
  for (const hotel of getAllHotels().filter((h) => h.destinationId === destination.id)) {
    if (!inside(hotel.coordinates)) {
      err(
        `${destination.id}/${hotel.id}: coordinates ${hotel.coordinates.lat},${hotel.coordinates.lng} fall outside the destination's own map bounds`,
      );
    }
  }
  for (const place of getAllPlaces().filter((p) => p.destinationId === destination.id)) {
    if (!inside(place.coordinates)) {
      err(
        `${destination.id}/${place.id}: coordinates ${place.coordinates.lat},${place.coordinates.lng} fall outside the destination's own map bounds`,
      );
    }
  }
}

/*
 * --- 5. the photography manifest must point at things that exist -----------
 *
 * The image generator keeps its own hand-written search list. That list drifted
 * from the dataset: photos were filed under ids that had been renamed, so
 * thirteen Bali places showed "no photo yet" while their photographs sat unused
 * on disk. Nothing caught it, because the manifest is keyed by strings and a
 * string that matches nothing looks exactly like an entity with no photography.
 */
const imageManifestSource = readFileSync(new URL('../lib/data/images/bali-images.ts', import.meta.url), 'utf8');
const manifestKeys = [...imageManifestSource.matchAll(/^  '([a-z]+):([a-z0-9-]+)':/gm)].map((m) => ({
  kind: m[1],
  id: m[2],
}));

const known = {
  area: new Set(getAreas('bali').map((a) => a.id)),
  hotel: new Set(getAllHotels().filter((h) => h.destinationId === 'bali').map((h) => h.id)),
  place: new Set(getAllPlaces().filter((p) => p.destinationId === 'bali').map((p) => p.id)),
};
for (const { kind, id } of manifestKeys) {
  if (!known[kind as keyof typeof known]) {
    err(`image manifest: unknown entity kind "${kind}"`);
    continue;
  }
  if (!known[kind as keyof typeof known].has(id)) {
    err(
      `image manifest: "${kind}:${id}" is not in the dataset — its photographs can never be shown. ` +
        `Fix scripts/fetch-bali-images.mjs and regenerate.`,
    );
  }
}

/*
 * --- 6. the generator's id list must agree with the dataset ----------------
 */
const generatorSource = readFileSync(new URL('./fetch-bali-images.mjs', import.meta.url), 'utf8');
const areaBlock = generatorSource.slice(generatorSource.indexOf('const AREAS = ['), generatorSource.indexOf('const PLACES = ['));
const placeBlock = generatorSource.slice(generatorSource.indexOf('const PLACES = ['), generatorSource.indexOf('const BLACKLIST'));
const listIds = (block: string) => [...block.matchAll(/^  \['([a-z0-9-]+)',/gm)].map((m) => m[1]);

for (const id of listIds(areaBlock)) {
  if (!known.area.has(id)) err(`fetch-bali-images AREAS: "${id}" is not an area in the dataset`);
}
for (const id of listIds(placeBlock)) {
  if (!known.place.has(id)) err(`fetch-bali-images PLACES: "${id}" is not a place in the dataset`);
}

// --- 7. destination coverage summary ---------------------------------------
const summary = DESTINATIONS.map((d) => {
  const stats = destinationStats(d.id);
  return {
    id: d.id,
    status: d.status,
    areas: stats.areaCount,
    marriott: stats.marriottCount,
    hilton: stats.hiltonCount,
    places: stats.placeCount,
    approximate: stats.approximateCount,
  };
});

console.log('\nDestination coverage\n');
console.log(
  ['id', 'status', 'areas', 'M', 'H', 'places', 'approx'].map((h) => h.padEnd(10)).join(''),
);
for (const row of summary) {
  console.log(
    [row.id, row.status, row.areas, row.marriott, row.hilton, row.places, row.approximate]
      .map((v) => String(v).padEnd(10))
      .join(''),
  );
}

const totals = summary.reduce(
  (acc, row) => ({
    destinations: acc.destinations + 1,
    areas: acc.areas + row.areas,
    hotels: acc.hotels + row.marriott + row.hilton,
    places: acc.places + row.places,
    approximate: acc.approximate + row.approximate,
  }),
  { destinations: 0, areas: 0, hotels: 0, places: 0, approximate: 0 },
);

console.log(
  `\nTotal: ${totals.destinations} destinations · ${totals.areas} areas · ${totals.hotels} loyalty hotels · ${totals.places} places`,
);
console.log(`Places with approximate coordinates: ${totals.approximate}/${totals.places}`);

const errors = problems.filter((p) => p.level === 'error');
const warnings = problems.filter((p) => p.level === 'warn');

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings.slice(0, 30)) console.log(`  ! ${w.message}`);
}
if (errors.length) {
  console.log(`\n${errors.length} ERROR(S):`);
  for (const e of errors.slice(0, 40)) console.log(`  x ${e.message}`);
  console.log('\nData validation FAILED');
  process.exit(1);
}

console.log('\nData validation passed.');
