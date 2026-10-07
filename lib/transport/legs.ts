import type { ItineraryItem, RouteResult, TransportLeg, TripDay } from '../types';
import { haversineKm } from '../geo';
import { requestRoute } from '../routing';
import { findWaterCrossing, recommendTransport } from './recommend';

/**
 * Turns an ordered list of itinerary stops into transport legs.
 *
 * Three separate things are computed and never conflated:
 *   1. `straightLineMeters` — great-circle. Exact for what it measures, and
 *      never displayed as a drive.
 *   2. `distanceMeters` / `durationSeconds` — from a routing engine, or null.
 *   3. `mode` / `rationale` — curated travel advice, derived from (1) and (2)
 *      but not a measurement of anything.
 *
 * When the routing engine cannot answer, the leg keeps `null` numbers and the
 * UI says "Route unavailable". It does not fall back to a plausible estimate,
 * because a plausible number is indistinguishable from a measured one once it
 * is on screen.
 */

export interface BuildLegsOptions {
  /** Injectable for tests and for swapping the transport of the request. */
  routeFor?: typeof requestRoute;
  /** Wall-clock budget for the whole day before remaining legs are marked unavailable. */
  timeoutMs?: number;
}

/**
 * Anything that can be a stop on a route.
 *
 * Itinerary items and day anchors are structurally the same thing to the router:
 * a place with coordinates. Accepting one shape is what lets a hotel-change day
 * be routed as `Hotel A → stops → Hotel B` through the same provider, with the
 * hotel-to-hotel leg measured like any other drive rather than being asserted as
 * metadata.
 */
export interface RouteStop {
  id: string;
  name: string;
  /** Used only by the transport recommender, which reads it for context. */
  kind?: ItineraryItem['kind'];
  /** Set on day anchors, which are not items but behave as one for transport. */
  itemKind?: ItineraryItem['kind'];
  nameZh?: string;
  lat: number;
  lng: number;
  areaId?: string;
}

/** Turns a day's anchors and items into the ordered stop list to route. */
export function routeStops(anchors: { start: RouteStop | null; end: RouteStop | null }, items: RouteStop[]): RouteStop[] {
  return [anchors.start, ...items, anchors.end].filter((stop): stop is RouteStop => Boolean(stop));
}

export async function buildLegsForStops(stops: RouteStop[], options: BuildLegsOptions = {}): Promise<TransportLeg[]> {
  const routeFor = options.routeFor ?? requestRoute;
  if (stops.length < 2) return [];
  const timeoutMs = options.timeoutMs ?? 12_000;
  return Promise.all(
    stops.slice(1).map((to, index) => buildLeg(stops[index], to, routeFor, timeoutMs)),
  );
}

/** Item-only routing, for callers with no anchors (and for the existing tests). */
export async function buildLegsForDay(day: TripDay, options: BuildLegsOptions = {}): Promise<TransportLeg[]> {
  return buildLegsForStops(day.items, options);
}

async function buildLeg(
  from: RouteStop,
  to: RouteStop,
  routeFor: typeof requestRoute,
  timeoutMs: number,
): Promise<TransportLeg> {
  const straightLineKm = haversineKm(from, to);

  let route: RouteResult | null = null;
  try {
    route = await withTimeout(routeFor(from, to, 'driving'), timeoutMs);
  } catch {
    route = null;
  }

  const ok = route?.status === 'ok' && route.distanceMeters !== null;
  const roadKm = ok ? (route!.distanceMeters as number) / 1000 : null;

  const crossing = findWaterCrossing(from.areaId, to.areaId);

  const recommendation = recommendTransport({
    // The recommender reads `kind` and `name`. A hotel ANCHOR carries no kind —
    // it is not an itinerary item — so it reports as a hotel stop rather than
    // losing the airport/hotel distinction that the rationale depends on.
    from: { kind: from.kind ?? from.itemKind ?? 'activity', name: from.name },
    to: { kind: to.kind ?? to.itemKind ?? 'activity', name: to.name },
    straightLineKm,
    roadKm,
    crossesWater: Boolean(crossing),
    crossingVia: crossing?.via,
  });

  return {
    id: `leg:${from.id}->${to.id}`,
    fromItemId: from.id,
    toItemId: to.id,
    fromName: from.name,
    toName: to.name,
    mode: recommendation.mode,
    alternatives: recommendation.alternatives,
    rationale: recommendation.rationale,
    distanceMeters: ok ? route!.distanceMeters : null,
    durationSeconds: ok ? route!.durationSeconds : null,
    straightLineMeters: Math.round(straightLineKm * 1000),
    geometry: route?.geometry ?? null,
    source: ok ? 'routing-engine' : 'unavailable',
    // Distance is measured by the engine; duration is its free-flow model, not
    // live traffic, so the two carry different confidence.
    confidence: ok ? 'estimated' : 'unavailable',
    providerId: route?.providerId,
    multimodal: recommendation.multimodal,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** Total measured distance and duration for a set of legs, ignoring unavailable ones. */
export function summariseLegs(legs: TransportLeg[]): {
  distanceMeters: number;
  durationSeconds: number;
  unavailable: number;
  measured: number;
} {
  return legs.reduce(
    (acc, leg) => ({
      distanceMeters: acc.distanceMeters + (leg.distanceMeters ?? 0),
      durationSeconds: acc.durationSeconds + (leg.durationSeconds ?? 0),
      unavailable: acc.unavailable + (leg.source === 'unavailable' ? 1 : 0),
      measured: acc.measured + (leg.source === 'unavailable' ? 0 : 1),
    }),
    { distanceMeters: 0, durationSeconds: 0, unavailable: 0, measured: 0 },
  );
}
