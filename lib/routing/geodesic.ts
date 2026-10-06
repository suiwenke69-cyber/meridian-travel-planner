import type { Coordinates } from '../types';
import { haversineKm } from '../geo';

/**
 * Geodesic (great-circle) estimator, used ONLY by route-efficiency heuristics.
 *
 * It returns a plausible duration, and that is exactly why it is fenced off
 * here: a plausible number is indistinguishable from a measured one once it
 * reaches a card. It must never be used to fill in an itinerary transport leg.
 */
export const GEODESIC_MODEL = {
  /** Great-circle → road distance inflation for Balinese / SEA road networks. */
  roadFactor: 1.34,
  /** Average speed bands in km/h. */
  speed: { short: 22, medium: 32, long: 46 },
  /** Fixed overhead per leg (parking, walking to the entrance) in minutes. */
  fixedOverheadMinutes: 4,
  method: 'geodesic-estimate-v1',
} as const;

export interface EstimatedLeg {
  /** Great-circle × road factor. An approximation, labelled as one. */
  distanceMeters: number;
  /** Modelled duration. NEVER presented as a measured drive time. */
  durationSeconds: number;
  method: string;
}

export function estimateLeg(km: number): EstimatedLeg {
  const roadKm = km * GEODESIC_MODEL.roadFactor;
  const speed =
    roadKm > 25 ? GEODESIC_MODEL.speed.long : roadKm > 8 ? GEODESIC_MODEL.speed.medium : GEODESIC_MODEL.speed.short;
  const minutes = (roadKm / speed) * 60 + GEODESIC_MODEL.fixedOverheadMinutes;
  return {
    distanceMeters: Math.round(roadKm * 1000),
    durationSeconds: Math.round(minutes * 60),
    method: GEODESIC_MODEL.method,
  };
}

/**
 * NOTE: this is NOT a RoutingProvider.
 *
 * It produces no route geometry and no measured duration, so it must never be
 * used to fill in an itinerary leg. It exists solely to give the route-efficiency
 * heuristics a fast, synchronous, clearly-labelled sense of scale.
 */
export const GEODESIC_LABEL = 'Geographic heuristic (great-circle)';
