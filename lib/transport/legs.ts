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

export async function buildLegsForDay(day: TripDay, options: BuildLegsOptions = {}): Promise<TransportLeg[]> {
  const routeFor = options.routeFor ?? requestRoute;
  const items = day.items;
  if (items.length < 2) return [];

  const timeoutMs = options.timeoutMs ?? 12_000;

  const legs = await Promise.all(
    items.slice(1).map(async (to, index) => {
      const from = items[index];
      return buildLeg(from, to, routeFor, timeoutMs);
    }),
  );

  return legs;
}

async function buildLeg(
  from: ItineraryItem,
  to: ItineraryItem,
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
    from,
    to,
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
