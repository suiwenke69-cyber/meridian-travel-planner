import type {
  DataConfidence,
  Destination,
  OriginDestinationConnection,
  OriginCity,
} from '../types';
import { DESTINATIONS, getAirports } from './index';
import { ORIGIN_CITIES, getOriginCity } from './origins';

/**
 * Origin → destination connections.
 *
 * WHY THIS IS ITS OWN LAYER
 * -------------------------
 * Whether a route is non-stop, how long it takes and who flies it are
 * properties of an (origin, destination) PAIR. Shanghai → Bali and Singapore →
 * Bali are different journeys to the same island, and a boolean living on
 * Bali's airport record could only ever describe one of them.
 *
 * THE HONESTY RULES
 * -----------------
 * 1. **`directAvailable` is `null` when unknown, and `null` is not `false`.**
 *    We do not infer non-stop service from distance, from hub size, or from the
 *    fact that some other origin has it.
 * 2. **Unknown means unknown.** A pair with no record renders 航班信息待确认. It
 *    never shows a guessed duration.
 * 3. **Nothing here is a live schedule.** These are block-time bands, and each
 *    record carries the date it was curated and what it is based on, so it can
 *    be refreshed rather than quietly ageing into falsehood.
 *
 * WHAT IS VERIFIED AND WHAT IS NOT
 * --------------------------------
 * The Singapore records are **harvested** from the destination data files, where
 * each one carries a cited source (airline timetables, news reports, block
 * times checked flight by flight). Those stay `verified`.
 *
 * The other origins are **curated**: the routes below are the long-standing,
 * high-frequency services that appear on any route map for those hubs. They are
 * marked `approximate` on purpose, and the interface says 待确认 beside them.
 * The honest alternative — marking all ten non-Singapore origins as unknown —
 * would demonstrate the architecture but tell a traveller nothing.
 */

const CURATED_ON = '2026-10-06';

/** What every curated non-Singapore record is based on. */
const CURATED_SOURCE =
  'Curated long-standing route knowledge for this hub, not a live schedule. Durations are typical block times including taxi. Confirm current service before booking.';

type Weekend = OriginDestinationConnection['weekendSuitability'];

/** `[destinationId, direct, [minMinutes, maxMinutes] | null, weekend]` */
type Row = [string, boolean | null, [number, number] | null, Weekend];

/**
 * Curated connections by origin.
 *
 * `direct: null` and a null duration means we do not know — the pair is listed
 * only where there is something worth saying about the journey. A pair absent
 * from this table and from the harvested Singapore records is `unknown`.
 */
const CURATED: Record<string, Row[]> = {
  // --- 粤港澳大湾区 ---------------------------------------------------------
  guangzhou: [
    ['bali', true, [305, 345], 'not-ideal'],
    ['ho-chi-minh-city', true, [180, 200], 'possible'],
    ['hanoi', true, [135, 155], 'good'],
    ['da-nang-hoi-an', true, [155, 180], 'possible'],
    ['siem-reap', true, [175, 200], 'not-ideal'],
    ['phnom-penh', true, [170, 195], 'not-ideal'],
    ['phu-quoc', true, [180, 210], 'possible'],
    ['cebu', true, [200, 230], 'not-ideal'],
    ['boracay', null, null, 'unknown'],
    ['palawan', null, null, 'unknown'],
  ],
  shenzhen: [
    ['bali', true, [310, 345], 'not-ideal'],
    ['ho-chi-minh-city', true, [180, 200], 'possible'],
    ['hanoi', true, [140, 160], 'good'],
    ['da-nang-hoi-an', true, [160, 180], 'possible'],
    ['phu-quoc', true, [180, 210], 'possible'],
    ['siem-reap', null, null, 'unknown'],
    ['phnom-penh', null, null, 'unknown'],
    ['cebu', null, null, 'unknown'],
    ['boracay', null, null, 'unknown'],
    ['palawan', null, null, 'unknown'],
  ],
  'hong-kong': [
    ['bali', true, [300, 330], 'not-ideal'],
    ['ho-chi-minh-city', true, [165, 185], 'possible'],
    ['hanoi', true, [120, 140], 'good'],
    ['da-nang-hoi-an', true, [140, 160], 'possible'],
    ['siem-reap', true, [170, 190], 'possible'],
    ['phnom-penh', true, [165, 185], 'possible'],
    ['cebu', true, [200, 225], 'possible'],
    ['phu-quoc', null, null, 'unknown'],
    ['boracay', null, null, 'unknown'],
    ['palawan', null, null, 'unknown'],
  ],

  // --- 长三角 ---------------------------------------------------------------
  shanghai: [
    ['bali', true, [360, 405], 'not-ideal'],
    ['ho-chi-minh-city', true, [255, 285], 'not-ideal'],
    ['hanoi', true, [200, 230], 'possible'],
    ['da-nang-hoi-an', true, [215, 245], 'possible'],
    ['siem-reap', true, [260, 290], 'not-ideal'],
    ['phnom-penh', true, [250, 280], 'not-ideal'],
    ['cebu', true, [240, 270], 'not-ideal'],
    ['phu-quoc', true, [280, 310], 'not-ideal'],
    ['boracay', null, null, 'unknown'],
    ['palawan', null, null, 'unknown'],
  ],
  hangzhou: [
    ['bali', true, [350, 390], 'not-ideal'],
    ['ho-chi-minh-city', true, [250, 280], 'not-ideal'],
    ['hanoi', true, [200, 230], 'possible'],
    ['da-nang-hoi-an', true, [210, 240], 'possible'],
    ['phu-quoc', true, [270, 300], 'not-ideal'],
    ['siem-reap', null, null, 'unknown'],
    ['phnom-penh', null, null, 'unknown'],
    ['cebu', null, null, 'unknown'],
    ['boracay', null, null, 'unknown'],
    ['palawan', null, null, 'unknown'],
  ],

  // --- 中国其他 -------------------------------------------------------------
  beijing: [
    ['bali', true, [400, 440], 'not-ideal'],
    ['ho-chi-minh-city', true, [290, 320], 'not-ideal'],
    ['hanoi', true, [240, 270], 'possible'],
    ['da-nang-hoi-an', true, [255, 285], 'not-ideal'],
    ['siem-reap', true, [300, 330], 'not-ideal'],
    ['phnom-penh', true, [300, 330], 'not-ideal'],
    ['cebu', null, null, 'unknown'],
    ['phu-quoc', null, null, 'unknown'],
    ['boracay', null, null, 'unknown'],
    ['palawan', null, null, 'unknown'],
  ],
  chengdu: [
    ['bali', true, [350, 390], 'not-ideal'],
    ['ho-chi-minh-city', true, [230, 260], 'not-ideal'],
    ['hanoi', true, [180, 210], 'possible'],
    ['da-nang-hoi-an', true, [190, 220], 'possible'],
    ['siem-reap', true, [240, 270], 'not-ideal'],
    ['phu-quoc', true, [240, 270], 'not-ideal'],
    ['phnom-penh', null, null, 'unknown'],
    ['cebu', null, null, 'unknown'],
    ['boracay', null, null, 'unknown'],
    ['palawan', null, null, 'unknown'],
  ],

  // --- 东南亚 ---------------------------------------------------------------
  bangkok: [
    ['bali', true, [260, 290], 'possible'],
    ['ho-chi-minh-city', true, [105, 125], 'good'],
    ['hanoi', true, [115, 135], 'good'],
    ['da-nang-hoi-an', true, [110, 130], 'good'],
    ['siem-reap', true, [70, 90], 'good'],
    ['phnom-penh', true, [75, 95], 'good'],
    ['phu-quoc', true, [80, 100], 'good'],
    ['cebu', true, [220, 250], 'not-ideal'],
    ['boracay', null, null, 'unknown'],
    ['palawan', null, null, 'unknown'],
  ],
  'kuala-lumpur': [
    ['bali', true, [185, 210], 'possible'],
    ['ho-chi-minh-city', true, [120, 140], 'good'],
    ['hanoi', true, [185, 210], 'possible'],
    ['da-nang-hoi-an', true, [175, 200], 'possible'],
    ['siem-reap', true, [120, 140], 'good'],
    ['phnom-penh', true, [115, 135], 'good'],
    ['phu-quoc', true, [105, 125], 'good'],
    ['cebu', true, [225, 255], 'not-ideal'],
    ['palawan', true, [170, 195], 'possible'],
    ['boracay', null, null, 'unknown'],
  ],
  jakarta: [
    ['bali', true, [110, 130], 'good'],
    ['ho-chi-minh-city', true, [190, 215], 'possible'],
    ['hanoi', null, null, 'unknown'],
    ['da-nang-hoi-an', null, null, 'unknown'],
    ['siem-reap', null, null, 'unknown'],
    ['phnom-penh', null, null, 'unknown'],
    ['cebu', null, null, 'unknown'],
    ['phu-quoc', null, null, 'unknown'],
    ['boracay', null, null, 'unknown'],
    ['palawan', null, null, 'unknown'],
  ],
};

// ---------------------------------------------------------------------------
// Harvesting the verified Singapore routes
// ---------------------------------------------------------------------------

/**
 * Pulls the legacy per-airport flight fields into proper connections.
 *
 * This runs once at module load and is the ONLY reader of
 * `Airport.legacyRouteFromOrigin`. Doing it here rather than hand-copying means
 * the cited sources in the destination files — airline timetables, news reports,
 * checked block times — stay attached to the data they describe, and there is
 * exactly one place where the old shape turns into the new one.
 */
function harvestLegacyRoutes(): OriginDestinationConnection[] {
  const out: OriginDestinationConnection[] = [];
  for (const destination of DESTINATIONS) {
    const airports = getAirports(destination.id);
    for (const airport of airports) {
      const legacy = airport.legacyRouteFromOrigin;
      if (!legacy) continue;
      out.push({
        originCityId: legacy.originCityId,
        destinationId: destination.id,
        directAvailable: legacy.direct,
        approximateFlightDuration: legacy.flightMinutes ?? null,
        originAirports: [],
        destinationAirports: [airport.code],
        typicalTransportMode: legacy.direct ? 'flight' : 'flight-connection',
        weekendSuitability: 'unknown',
        source: legacy.note ?? 'Verified against published schedules when the destination record was compiled.',
        verifiedAt: destination.provenance?.reviewedOn ?? CURATED_ON,
        confidence: 'verified',
        note: legacy.airlines?.length ? `Carriers observed: ${legacy.airlines.join(', ')}.` : undefined,
      });
    }
  }
  return out;
}

/** Fills in the origin-side airport codes for a connection. */
function originAirportsFor(city: OriginCity | undefined): string[] {
  if (!city) return [];
  // Long-haul international service uses the international airports; a regional
  // airport like Seletar or Don Mueang is not a plausible departure for Bali.
  const international = city.airports.filter((a) => a.type === 'international');
  return (international.length > 0 ? international : city.airports).map((a) => a.code);
}

function buildCurated(): OriginDestinationConnection[] {
  const out: OriginDestinationConnection[] = [];
  for (const [originCityId, rows] of Object.entries(CURATED)) {
    const city = getOriginCity(originCityId);
    const originAirports = originAirportsFor(city);
    for (const [destinationId, direct, duration, weekend] of rows) {
      const destination = DESTINATIONS.find((d) => d.id === destinationId);
      out.push({
        originCityId,
        destinationId,
        directAvailable: direct,
        approximateFlightDuration: duration ? { min: duration[0], max: duration[1] } : null,
        originAirports,
        destinationAirports: getAirports(destinationId).map((a) => a.code),
        typicalTransportMode: direct === true ? 'flight' : direct === false ? 'flight-connection' : 'unknown',
        weekendSuitability: weekend,
        source: CURATED_SOURCE,
        verifiedAt: CURATED_ON,
        // Never `verified`: we curated these from route knowledge, not from a
        // schedule we could point at. The UI marks them 待确认 for that reason.
        confidence: direct === null ? 'unknown' : 'approximate',
        note: destination ? undefined : `No destination record for ${destinationId}.`,
      });
    }
  }
  return out;
}

const KEY = (originCityId: string, destinationId: string) => `${originCityId}::${destinationId}`;

/**
 * Built on first use, not at module load.
 *
 * `lib/data/index.ts` re-exports `getConnection` from here, and this file reads
 * `DESTINATIONS` from there — a cycle. Harvesting at module scope meant the
 * table was built while `index.ts` was still initialising, and every import
 * failed with "Cannot access 'DESTINATIONS' before initialization".
 *
 * Lazy initialisation breaks the ordering dependency entirely: by the time
 * anyone asks for a connection, both modules are ready.
 */
let byKey: Map<string, OriginDestinationConnection> | null = null;

function table(): Map<string, OriginDestinationConnection> {
  if (!byKey) {
    byKey = new Map(
      [...harvestLegacyRoutes(), ...buildCurated()].map((c) => [KEY(c.originCityId, c.destinationId), c]),
    );
  }
  return byKey;
}

/**
 * The connection between an origin and a destination.
 *
 * Never returns null. A pair we know nothing about gets an explicit `unknown`
 * record, so the caller cannot accidentally treat "no data" as "no problem" —
 * every consumer has to handle the unknown case because it is a real value.
 */
export function getConnection(originCityId: string, destinationId: string): OriginDestinationConnection {
  const found = table().get(KEY(originCityId, destinationId));
  if (found) return found;
  return {
    originCityId,
    destinationId,
    directAvailable: null,
    approximateFlightDuration: null,
    originAirports: originAirportsFor(getOriginCity(originCityId)),
    destinationAirports: getAirports(destinationId).map((a) => a.code),
    typicalTransportMode: 'unknown',
    weekendSuitability: 'unknown',
    source: 'No connection record for this pair.',
    verifiedAt: CURATED_ON,
    confidence: 'unknown',
  };
}

export function getConnectionsForOrigin(originCityId: string): OriginDestinationConnection[] {
  return DESTINATIONS.map((d) => getConnection(originCityId, d.id));
}

export function hasConnectionRecord(originCityId: string, destinationId: string): boolean {
  return table().has(KEY(originCityId, destinationId));
}

/** How many destinations have real connection data from this origin. */
export function connectionCoverage(originCityId: string): { known: number; total: number } {
  const total = DESTINATIONS.length;
  const known = DESTINATIONS.filter((d) => {
    const c = table().get(KEY(originCityId, d.id));
    return c != null && c.confidence !== 'unknown';
  }).length;
  return { known, total };
}

export { CURATED_ON as CONNECTIONS_CURATED_ON };
export type { DataConfidence };
