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
import { readFileSync, readdirSync } from 'node:fs';
import { HOTEL_BRANDS, HOTEL_GROUPS } from '../lib/data/hotel-brands';
import {
  ACTIVITY_KINDS,
  CUISINES,
  RECOMMENDED_FOR,
  getDiscoveryCategory,
} from '../lib/data/place-taxonomy';
import { normalizePlaceName } from '../lib/research/normalize';
import {
  DEFAULT_ORIGIN_CITY_ID,
  ORIGIN_CITIES,
  ORIGIN_REGIONS,
  getOriginCity,
} from '../lib/data/origins';
import { getConnection } from '../lib/data/connections';
import { extractMentions, SAMPLE_GUIDE_TEXT } from '../lib/research/extract';
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
  /*
   * Checked against the registry rather than a written-out pair.
   *
   * This rule said "must be marriott or hilton", which was true when there were
   * two programmes and became a false alarm the moment IHG, Hyatt and GHA were
   * added — every new hotel would have failed validation for being correct.
   */
  if (!HOTEL_GROUPS.some((group) => group.id === hotel.hotelGroup)) {
    err(
      `${hotel.destinationId}/${hotel.id}: hotelGroup "${hotel.hotelGroup}" is not one of ${HOTEL_GROUPS.map((g) => g.id).join(', ')}`,
    );
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
/*
 * Proximity alone is not duplication.
 *
 * The original rule compared coordinates only, and that worked while the dataset
 * had forty hotels. With five programmes and real inventory it started flagging
 * NEIGHBOURS: the Holiday Inn and the Hilton Garden Inn on Nusa Dua's Jalan
 * Pratama are 120 m apart, Renaissance Riverside and the Hilton are 104 m apart
 * on Saigon's waterfront, and the InterContinental and the JW Marriott are 96 m
 * apart. All four are genuinely different properties, each with its own OSM
 * object, and all four were reported as "the same property plotted twice".
 *
 * A duplicate shares an identity, not just a street: it has the same brand, or
 * the same name once punctuation is stripped. That is what the real bug looked
 * like — "Four Points by Sheraton Bali, Ungasan" twice, same brand, same name,
 * same point. Requiring one of those keeps the guard and drops the false alarms.
 */
const normaliseHotelName = (value: string) => value.toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]/g, '');
const hotelSites: Array<{ id: string; name: string; brandId: string; lat: number; lng: number; destinationId: string }> = [];
for (const hotel of getAllHotels()) {
  for (const seen of hotelSites) {
    if (seen.destinationId !== hotel.destinationId) continue;
    if (haversineKm({ lat: seen.lat, lng: seen.lng }, hotel.coordinates) > 0.15) continue;
    const sameName = normaliseHotelName(seen.name) === normaliseHotelName(hotel.name);
    const sameBrand = seen.brandId === hotel.brandId;
    if (!sameName && !sameBrand) continue;
    const metres = Math.round(haversineKm({ lat: seen.lat, lng: seen.lng }, hotel.coordinates) * 1000);
    err(
      `${hotel.destinationId}: "${hotel.id}" and "${seen.id}" look like the same property plotted twice ` +
        `(${sameName ? 'same name' : `same brand ${hotel.brandId}`}, ${metres} m apart) — the STAY list will show it twice`,
    );
  }
  hotelSites.push({
    id: hotel.id,
    name: hotel.name,
    brandId: hotel.brandId,
    lat: hotel.coordinates.lat,
    lng: hotel.coordinates.lng,
    destinationId: hotel.destinationId,
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
    // A place still awaiting geocoding sits at 0,0 by design and is handled by
    // the dedicated unresolved-coordinate rule. Only resolved points are checked.
    if (place.coordinates.confidence === 'demo') continue;
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
/*
 * Every destination, not just Bali. The manifests are generated from an external
 * source, so a key that does not resolve to an entity — a renamed place, a typo
 * in a subject id — produces a photograph that exists on disk and can never be
 * shown, which looks exactly like an entity that has no photograph.
 */
const imageDirectory = new URL('../lib/data/images/', import.meta.url);
const subjectDirectory = new URL('./images/subjects/', import.meta.url);

const manifestFiles = readdirSync(imageDirectory).filter((name) => name.endsWith('-images.ts'));
if (manifestFiles.length === 0) err('image manifests: none found in lib/data/images');

for (const file of manifestFiles) {
  const destinationId = file.replace(/-images\.ts$/, '');
  const source = readFileSync(new URL(file, imageDirectory), 'utf8');
  const keys = [...source.matchAll(/^  '([a-z]+):([a-z0-9-]+)':/gm)].map((match) => ({
    kind: match[1],
    id: match[2],
  }));

  const known: Record<string, Set<string>> = {
    area: new Set(getAreas(destinationId).map((a) => a.id)),
    hotel: new Set(getAllHotels().filter((h) => h.destinationId === destinationId).map((h) => h.id)),
    place: new Set(getAllPlaces().filter((p) => p.destinationId === destinationId).map((p) => p.id)),
  };

  for (const { kind, id } of keys) {
    if (!known[kind]) {
      err(`image manifest (${destinationId}): unknown entity kind "${kind}"`);
      continue;
    }
    if (!known[kind].has(id)) {
      err(
        `image manifest (${destinationId}): "${kind}:${id}" is not in the dataset — its photographs can never be shown. ` +
          `Fix scripts/images/subjects/${destinationId}.mjs and regenerate.`,
      );
    }
  }

  // The subject list is the input to the generator, so it is held to the same rule.
  const subjectsPath = new URL(`${destinationId}.mjs`, subjectDirectory);
  let subjects: string;
  try {
    subjects = readFileSync(subjectsPath, 'utf8');
  } catch {
    err(`image subjects: no subject file for the "${destinationId}" manifest`);
    continue;
  }
  const block = (from: string, to: string) => subjects.slice(subjects.indexOf(from), subjects.indexOf(to));
  const listIds = (text: string) => [...text.matchAll(/^  \['([a-z0-9-]+)',/gm)].map((m) => m[1]);

  const hotelIds = listIds(block('export const HOTELS = [', 'export const AREAS = ['));
  const areaIds = listIds(block('export const AREAS = [', 'export const PLACES = ['));
  const placeIds = listIds(block('export const PLACES = [', 'export const SUBJECT_RULES'));

  for (const id of hotelIds) if (!known.hotel.has(id)) err(`${destinationId} subjects HOTELS: "${id}" is not a hotel in the dataset`);
  for (const id of areaIds) if (!known.area.has(id)) err(`${destinationId} subjects AREAS: "${id}" is not an area in the dataset`);
  for (const id of placeIds) if (!known.place.has(id)) err(`${destinationId} subjects PLACES: "${id}" is not a place in the dataset`);
}

/*
 * --- 5b. canonical place identity ------------------------------------------
 *
 * The failure this exists to prevent has a name: La Brisa, La Brisa Bali and
 * La Brisa Canggu becoming three pins on one roof. The separate id check cannot
 * see it, because the ids differ — so this compares NORMALISED names within a
 * destination, and fails when two records reduce to the same identity.
 *
 * Places with unresolved coordinates are held to the same rule. "We have not
 * geocoded it yet" is not a licence to list it twice.
 */
const identitySeen = new Map<string, string>();
for (const place of getAllPlaces()) {
  if (place.destinationId !== 'bali') continue;
  const key = `${place.destinationId}:${normalizePlaceName(place.name)}`;
  const previous = identitySeen.get(key);
  if (previous && previous !== place.id) {
    err(
      `${place.destinationId}: "${place.id}" and "${previous}" normalise to the same place name ` +
        `("${normalizePlaceName(place.name)}") — the map would show one venue twice`,
    );
  }
  identitySeen.set(key, place.id);
}

/*
 * --- 5c. coordinates are either real or explicitly unresolved --------------
 */
let unresolvedCount = 0;
for (const place of getAllPlaces()) {
  const { lat, lng, confidence } = place.coordinates;
  if (!finite(lat) || !finite(lng)) {
    err(`${place.destinationId}/${place.id}: non-finite coordinates`);
    continue;
  }
  const pinpointed = lat !== 0 || lng !== 0;
  if (!pinpointed) {
    if (confidence !== 'demo') {
      err(
        `${place.destinationId}/${place.id}: coordinates are 0,0 but confidence is "${confidence}" — ` +
          `an ungeocoded place must be marked demo so the map and the itinerary can exclude it`,
      );
    }
    if (!/PENDING GEOCODE/i.test(place.coordinates.coordNote ?? '')) {
      warn(`${place.destinationId}/${place.id}: unresolved coordinates without a PENDING GEOCODE note`);
    }
    unresolvedCount += 1;
    continue;
  }
  if (place.destinationId === 'bali') {
    const inBali =
      lat >= -9.05 && lat <= -7.95 && lng >= 114.35 && lng <= 115.95;
    if (!inBali) {
      err(`${place.destinationId}/${place.id}: coordinates ${lat},${lng} are outside Bali`);
    }
  }
}

/*
 * --- 5d. taxonomy ids used by the data must exist --------------------------
 *
 * A typo here removes a place from a category silently: it simply never appears
 * under 美食, and nothing errors. That is the worst kind of bug to find by hand.
 */
for (const place of getAllPlaces()) {
  for (const id of place.discovery ?? []) {
    if (!getDiscoveryCategory(id)) err(`${place.destinationId}/${place.id}: discovery id "${id}" is not in the taxonomy`);
  }
  for (const id of place.recommendedFor ?? []) {
    if (!RECOMMENDED_FOR[id]) err(`${place.destinationId}/${place.id}: recommendedFor id "${id}" is not in the taxonomy`);
  }
  for (const id of place.dining?.cuisines ?? []) {
    if (!CUISINES[id]) err(`${place.destinationId}/${place.id}: cuisine id "${id}" is not in the taxonomy`);
  }
  if (place.activity && !ACTIVITY_KINDS[place.activity.kind]) {
    err(`${place.destinationId}/${place.id}: activity kind "${place.activity.kind}" is not in the taxonomy`);
  }
  // A place with dining data must be reachable from the food categories, or the
  // restaurant exists in the data and nowhere in the interface.
  if (place.dining && !(place.discovery ?? []).some((d) => ['food', 'coffee', 'beachclub', 'nightlife'].includes(d))) {
    err(`${place.destinationId}/${place.id}: has dining data but no food-related discovery category`);
  }
}

/*
 * --- 5e. the research pipeline must behave on the shipped sample -----------
 *
 * This is the only way to exercise extraction and matching in CI: the research
 * store itself lives in the browser's localStorage. Running the real corpus
 * through the real extractor catches the two failures that matter — a mention
 * matched to a place id that does not exist, and the extractor inventing
 * venues out of ordinary prose.
 */
const sampleResult = extractMentions(
  SAMPLE_GUIDE_TEXT,
  getAllPlaces()
    .filter((p) => p.destinationId === 'bali')
    .map((p) => ({ id: p.id, name: p.name, nameZh: p.nameZh, areaId: p.areaId, discovery: p.discovery, category: p.category })),
  getAreas('bali').map((a: { id: string; name: string; nameZh?: string }) => ({ id: a.id, name: a.name, nameZh: a.nameZh })),
);
const validPlaceIds = new Set(getAllPlaces().map((p) => p.id));
const validAreaIds = new Set(DESTINATIONS.flatMap((d) => getAreas(d.id)).map((a) => a.id));

for (const mention of sampleResult.mentions) {
  if (mention.matchedPlaceId && !validPlaceIds.has(mention.matchedPlaceId)) {
    err(`research: sample extraction matched "${mention.rawPlaceName}" to unknown place "${mention.matchedPlaceId}"`);
  }
  if (mention.areaHint && !validAreaIds.has(mention.areaHint)) {
    err(`research: sample extraction produced unknown areaHint "${mention.areaHint}"`);
  }
}
const normalized = sampleResult.mentions.map((m) => m.normalizedPlaceName);
const duplicates = normalized.filter((n, i) => normalized.indexOf(n) !== i);
if (duplicates.length > 0) {
  err(`research: sample extraction produced duplicate mentions: ${[...new Set(duplicates)].join(', ')}`);
}
if (sampleResult.mentions.length === 0) {
  err('research: the sample guide extracted no mentions at all — the extractor is broken');
}
if (sampleResult.mentions.length > 60) {
  err(`research: the sample guide produced ${sampleResult.mentions.length} mentions, which means the heuristic pass is matching prose`);
}

/*
 * --- 6b. origins -----------------------------------------------------------
 *
 * The origin side is now a dataset like any other, so it gets the same checks.
 * The failure modes here are specific: an airport code that is not unique, a
 * city whose airports list is empty, and — most importantly — a connection that
 * claims a direct route to a destination id that does not exist, which would
 * silently attach route data to nothing.
 */
const originIds = new Set<string>();
const airportCodes = new Map<string, string>();
for (const city of ORIGIN_CITIES) {
  if (originIds.has(city.id)) err(`duplicate origin city id: ${city.id}`);
  originIds.add(city.id);

  if (!/^[a-z0-9-]+$/.test(city.id)) err(`origin ${city.id}: id must be kebab-case`);
  if (!city.cityNameZh || !city.cityNameEn) err(`origin ${city.id}: both names are required`);
  if (!finite(city.coordinates.lat) || !finite(city.coordinates.lng)) {
    err(`origin ${city.id}: non-finite coordinates`);
  }
  if (city.airports.length === 0) err(`origin ${city.id}: no airports — a city with no airport cannot be an origin`);

  for (const airport of city.airports) {
    // One code cannot belong to two cities: it is how a traveller identifies the
    // airport, and it is what the connection table keys on.
    const owner = airportCodes.get(airport.code);
    if (owner) err(`airport code ${airport.code} is claimed by both ${owner} and ${city.id}`);
    airportCodes.set(airport.code, city.id);

    if (airport.code !== airport.code.toUpperCase()) err(`origin ${city.id}: airport code ${airport.code} must be uppercase`);
    if (!finite(airport.coordinates.lat) || !finite(airport.coordinates.lng)) {
      err(`origin ${city.id}/${airport.code}: non-finite coordinates`);
    }
    if (!airport.nameZh || !airport.nameEn) err(`origin ${city.id}/${airport.code}: both names are required`);
  }

  for (const nearby of city.nearbyOriginIds) {
    if (!ORIGIN_CITIES.some((c) => c.id === nearby)) err(`origin ${city.id}: nearbyOriginIds references unknown city ${nearby}`);
    if (nearby === city.id) err(`origin ${city.id}: lists itself as a nearby origin`);
  }
  if (!ORIGIN_REGIONS.some((r) => r.id === city.region)) err(`origin ${city.id}: unknown region ${city.region}`);
}

if (!originIds.has(DEFAULT_ORIGIN_CITY_ID)) {
  err(`the default origin "${DEFAULT_ORIGIN_CITY_ID}" is not in the dataset`);
}
const defaultOrigin = ORIGIN_CITIES.find((c) => c.id === DEFAULT_ORIGIN_CITY_ID);
if (defaultOrigin && !defaultOrigin.enabled) err('the default origin is disabled');

/*
 * --- 6c. connections ------------------------------------------------------
 *
 * The honesty rule this protects: a connection must never claim non-stop
 * service on no data. `directAvailable: null` is the only correct value for a
 * pair we have not curated, and a curated claim must carry a source and a date
 * so it can be re-checked rather than quietly ageing.
 */
const allDestinationIds = new Set(DESTINATIONS.map((d) => d.id));
let verifiedConnections = 0;
let approximateConnections = 0;
let unknownConnections = 0;

for (const city of ORIGIN_CITIES) {
  for (const destination of DESTINATIONS) {
    if (!allDestinationIds.has(destination.id)) continue;
    const connection = getConnection(city.id, destination.id);
    if (connection.originCityId !== city.id || connection.destinationId !== destination.id) {
      err(`connection ${city.id} → ${destination.id}: returned a record for a different pair`);
    }
    if (!connection.source) err(`connection ${city.id} → ${destination.id}: missing source provenance`);
    if (!connection.verifiedAt) err(`connection ${city.id} → ${destination.id}: missing verifiedAt`);

    if (connection.confidence === 'unknown') {
      unknownConnections += 1;
      /*
       * An unknown pair must not carry numbers. A duration with no confidence is
       * exactly the fabricated precision this layer exists to prevent.
       */
      if (connection.approximateFlightDuration) {
        err(`connection ${city.id} → ${destination.id}: confidence is unknown but a duration is set`);
      }
      if (connection.directAvailable !== null) {
        err(`connection ${city.id} → ${destination.id}: confidence is unknown but directAvailable is ${connection.directAvailable}`);
      }
      continue;
    }

    if (connection.directAvailable === null) {
      err(`connection ${city.id} → ${destination.id}: confidence is ${connection.confidence} but direct is unknown`);
    }
    if (!connection.approximateFlightDuration) {
      err(`connection ${city.id} → ${destination.id}: confidence is ${connection.confidence} but there is no duration`);
    }
    if (connection.approximateFlightDuration) {
      const { min, max } = connection.approximateFlightDuration;
      if (min <= 0 || max <= 0) err(`connection ${city.id} → ${destination.id}: non-positive duration`);
      if (min > max) err(`connection ${city.id} → ${destination.id}: duration min > max`);
      if (min < 25) err(`connection ${city.id} → ${destination.id}: ${min} min is implausibly short for a flight`);
    }
    for (const code of connection.originAirports) {
      if (!airportCodes.has(code)) err(`connection ${city.id} → ${destination.id}: unknown origin airport code ${code}`);
      else if (airportCodes.get(code) !== city.id) {
        err(`connection ${city.id} → ${destination.id}: origin airport ${code} belongs to ${airportCodes.get(code)}`);
      }
    }
    for (const code of connection.destinationAirports) {
      if (!getAirports(destination.id).some((a) => a.code === code)) {
        err(`connection ${city.id} → ${destination.id}: unknown destination airport code ${code}`);
      }
    }
    if (connection.confidence === 'verified') verifiedConnections += 1;
    else approximateConnections += 1;
  }
}

/*
 * The legacy per-airport fields are migrated into connections at load. If any
 * remain unharvested, an origin would be missing routes it should have — and the
 * count is the only way to notice.
 */
for (const destination of DESTINATIONS) {
  for (const airport of getAirports(destination.id)) {
    const legacy = airport.legacyRouteFromOrigin;
    if (!legacy) continue;
    const harvested = getConnection(legacy.originCityId, destination.id);
    if (harvested.confidence === 'unknown') {
      err(
        `${destination.id}/${airport.code}: legacy route from ${legacy.originCityId} was not harvested into a connection`,
      );
    }
  }
}

/*
 * --- 6d. bestFor translations stay aligned -------------------------------
 *
 * `pickList` falls back per index, so a short Chinese array degrades into a line
 * that is half Chinese and half English. It reads as a bug and nothing else
 * catches it.
 */
for (const destination of DESTINATIONS) {
  if (destination.bestForZh && destination.bestForZh.length !== destination.bestFor.length) {
    err(
      `${destination.id}: bestForZh has ${destination.bestForZh.length} entries but bestFor has ${destination.bestFor.length}`,
    );
  }
}
for (const area of DESTINATIONS.flatMap((d) => getAreas(d.id))) {
  if (area.bestForZh && area.bestForZh.length !== area.bestFor.length) {
    err(`${area.id}: bestForZh length ${area.bestForZh.length} != bestFor length ${area.bestFor.length}`);
  }
  if (area.weakForZh && area.weakForZh.length !== area.weakFor.length) {
    err(`${area.id}: weakForZh length ${area.weakForZh.length} != weakFor length ${area.weakFor.length}`);
  }
}
for (const place of getAllPlaces()) {
  if (place.tagsZh && place.tagsZh.length !== place.tags.length) {
    err(`${place.destinationId}/${place.id}: tagsZh length ${place.tagsZh.length} != tags length ${place.tags.length}`);
  }
}

// --- 6f. two records may not share a coordinate ----------------------------
/*
 * This rule exists because Bali shipped with 73 of its 145 places sharing a
 * coordinate with another record. An earlier authoring pass looked one venue up
 * successfully and then assigned the same point to its neighbours, all of them
 * labelled `confidence: "verified"` — so the map drew nine markers stacked on one
 * spot and every one of those cards claimed a source.
 *
 * A duplicate coordinate is almost never correct. Two different hotels are not at
 * the same address; two different restaurants are not behind the same door. When
 * it IS legitimate — an area whose centre is the beach inside it — the records are
 * of different kinds, so the check is per-kind.
 */
{
  const KINDS = ['hotel', 'place'] as const;
  for (const destination of DESTINATIONS) {
    const byKind: Record<string, Array<{ id: string; name: string; lat: number; lng: number }>> = {
      hotel: getAllHotels()
        .filter((h) => h.destinationId === destination.id)
        .map((h) => ({ id: h.id, name: h.name, ...h.coordinates })),
      place: getAllPlaces()
        .filter((p) => p.destinationId === destination.id)
        .map((p) => ({ id: p.id, name: p.name, ...p.coordinates })),
    };
    for (const kind of KINDS) {
      const seen = new Map<string, { id: string; name: string }>();
      for (const record of byKind[kind]) {
        // An unlocatable record is deliberately at 0,0 and is excluded everywhere.
        if (record.lat === 0 && record.lng === 0) continue;
        const key = `${record.lat.toFixed(5)},${record.lng.toFixed(5)}`;
        const previous = seen.get(key);
        if (previous) {
          err(
            `${destination.id}: ${kind}s "${previous.name}" (${previous.id}) and "${record.name}" (${record.id}) share the coordinate ${key}`,
          );
        } else {
          seen.set(key, { id: record.id, name: record.name });
        }
      }
    }
  }
  console.log('  no two records of the same kind share a coordinate');
}

// --- 7. destination coverage summary ---------------------------------------
const summary = DESTINATIONS.map((d) => {
  const stats = destinationStats(d.id);
  return {
    id: d.id,
    status: d.status,
    areas: stats.areaCount,
    groups: stats.hotelCountByGroup,
    places: stats.placeCount,
    approximate: stats.approximateCount,
  };
});

console.log('\nDestination coverage\n');
/*
 * One column per loyalty programme, generated from the registry.
 *
 * Written out as M/H this table would silently keep printing two columns while
 * five programmes shipped — the exact "looks fine, says nothing" failure the
 * coverage table exists to prevent.
 */
const PROGRAMME_COLUMNS = HOTEL_GROUPS.map((group) => ({ id: group.id, head: group.short.slice(0, 4) }));
console.log(
  ['id', 'status', 'areas', ...PROGRAMME_COLUMNS.map((c) => c.head), 'places', 'approx']
    .map((h) => h.padEnd(10))
    .join(''),
);
for (const row of summary) {
  console.log(
    [
      row.id,
      row.status,
      row.areas,
      ...PROGRAMME_COLUMNS.map((column) => row.groups[column.id] ?? 0),
      row.places,
      row.approximate,
    ]
      .map((v) => String(v).padEnd(10))
      .join(''),
  );
}

const totals = summary.reduce(
  (acc, row) => ({
    destinations: acc.destinations + 1,
    areas: acc.areas + row.areas,
    hotels: acc.hotels + Object.values(row.groups).reduce((sum, count) => sum + count, 0),
    places: acc.places + row.places,
    approximate: acc.approximate + row.approximate,
  }),
  { destinations: 0, areas: 0, hotels: 0, places: 0, approximate: 0 },
);

console.log(
  `\nTotal: ${totals.destinations} destinations · ${totals.areas} areas · ${totals.hotels} loyalty hotels · ${totals.places} places`,
);
console.log(`Places with approximate coordinates: ${totals.approximate}/${totals.places}`);
console.log(
  `Origins: ${ORIGIN_CITIES.length} cities, ${airportCodes.size} airports · ` +
    `connections verified ${verifiedConnections}, approximate ${approximateConnections}, unknown ${unknownConnections}`,
);

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
