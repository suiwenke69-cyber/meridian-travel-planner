import type { ItineraryItem, TransportMode } from '../types';

/**
 * Transport RECOMMENDATION, deliberately separate from ROUTING.
 *
 * Routing answers "how far and how long by road". Recommendation answers "what
 * should this traveller actually do". They are different questions with
 * different data sources: routing is measured, recommendation is curated travel
 * knowledge about how Bali works.
 *
 * Keeping them apart is what stops the product from presenting a road distance
 * as advice, and what will let a multimodal planner replace this file without
 * touching the routing layer.
 *
 * Every rule here is stated in the `rationale` the UI shows, so nothing is
 * asserted without explanation.
 */

export interface RecommendationInput {
  from: Pick<ItineraryItem, 'kind' | 'name'>;
  to: Pick<ItineraryItem, 'kind' | 'name'>;
  /** Great-circle distance in km. Always available. */
  straightLineKm: number;
  /** Road distance in km, when a routing engine answered. */
  roadKm: number | null;
  /** True when the leg crosses open water (set from curated geography). */
  crossesWater: boolean;
  /** Named crossing point, e.g. "Sanur Harbour". */
  crossingVia?: string;
}

export interface Recommendation {
  mode: TransportMode;
  alternatives: TransportMode[];
  rationale: string;
  multimodal?: { via: string; modes: TransportMode[] };
}

const LABEL: Record<TransportMode, string> = {
  walk: 'walking',
  taxi: 'a taxi',
  grab: 'Car / Grab',
  'private-car': 'a private car and driver',
  scooter: 'a scooter',
  bus: 'the bus',
  train: 'the train',
  ferry: 'the ferry',
  'fast-boat': 'a fast boat',
  flight: 'a flight',
};

export function modeLabel(mode: TransportMode): string {
  return LABEL[mode];
}

/** Distance used for the recommendation: road when measured, otherwise great-circle. */
function effectiveKm(input: RecommendationInput): number {
  return input.roadKm ?? input.straightLineKm;
}

export function recommendTransport(input: RecommendationInput): Recommendation {
  const km = effectiveKm(input);
  const measured = input.roadKm !== null;
  const basis = measured ? 'road distance' : 'straight-line distance, as no road route was available';

  // --- 1. Water crossings are a different problem entirely -----------------
  if (input.crossesWater) {
    const via = input.crossingVia ?? 'the nearest harbour';
    return {
      mode: 'fast-boat',
      alternatives: ['private-car'],
      rationale: `This leg crosses open water. Take a car to ${via}, then a fast boat across. Boat timetables are seasonal and not modelled here.`,
      multimodal: { via, modes: ['private-car', 'fast-boat'] },
    };
  }

  const fromAirport = input.from.kind === 'airport';
  const toAirport = input.to.kind === 'airport';

  // --- 2. Airport legs are luggage legs ------------------------------------
  if (fromAirport || toAirport) {
    return {
      mode: 'private-car',
      alternatives: ['taxi', 'grab'],
      rationale: `Airport transfer with luggage — about ${km.toFixed(0)} km by ${basis}. A pre-booked private car is the least stressful option at Ngurah Rai.`,
    };
  }

  // --- 3. Short hops -------------------------------------------------------
  if (km <= 1.2) {
    return {
      mode: 'walk',
      alternatives: ['grab'],
      rationale: `Under ${Math.max(1, Math.round(km * 1000))} m by ${basis} — walking is realistically quicker than finding a driver.`,
    };
  }

  if (km <= 7) {
    return {
      mode: 'grab',
      alternatives: ['taxi', 'scooter'],
      rationale: `About ${km.toFixed(1)} km by ${basis}. A ride-hailing car is cheapest and easiest for this distance in Bali.`,
    };
  }

  if (km <= 25) {
    return {
      mode: 'grab',
      alternatives: ['private-car', 'taxi'],
      rationale: `About ${km.toFixed(0)} km by ${basis}. Ride-hailing works, though drivers sometimes decline long pickups at peak times — a private car is the safer fallback.`,
    };
  }

  return {
    mode: 'private-car',
    alternatives: ['grab'],
    rationale: `About ${km.toFixed(0)} km by ${basis} — a cross-island leg. Hiring a car and driver for the day is usually cheaper and far more comfortable than metered trips this length.`,
  };
}

/**
 * Curated geography that routing cannot know: which pairs of places require a
 * water crossing, and from where. Kept as data so additional islands can be
 * added without touching the recommendation logic.
 */
export const WATER_CROSSINGS: Array<{
  /** Area ids on the island side. */
  from: string[];
  /** Area ids on the far side. */
  to: string[];
  via: string;
}> = [
  { from: ['sanur', 'kuta-legian', 'seminyak', 'canggu', 'ubud', 'nusa-dua', 'uluwatu', 'jimbaran', 'denpasar'], to: ['nusa-penida'], via: 'Sanur Harbour' },
  { from: ['nusa-penida'], to: ['sanur', 'kuta-legian', 'seminyak', 'canggu', 'ubud', 'nusa-dua', 'uluwatu', 'jimbaran', 'denpasar'], via: 'Sanur Harbour' },
  { from: ['ubud', 'sanur', 'denpasar', 'kuta-legian', 'seminyak', 'canggu', 'nusa-dua', 'uluwatu', 'jimbaran'], to: ['east-bali'], via: 'Padang Bai or the east-coast road' },
  { from: ['east-bali'], to: ['ubud', 'sanur', 'denpasar', 'kuta-legian', 'seminyak', 'canggu', 'nusa-dua', 'uluwatu', 'jimbaran'], via: 'Padang Bai or the east-coast road' },
];

export function findWaterCrossing(
  fromAreaId: string | undefined,
  toAreaId: string | undefined,
): { via: string } | null {
  if (!fromAreaId || !toAreaId || fromAreaId === toAreaId) return null;
  for (const crossing of WATER_CROSSINGS) {
    if (crossing.from.includes(fromAreaId) && crossing.to.includes(toAreaId)) return { via: crossing.via };
  }
  return null;
}
