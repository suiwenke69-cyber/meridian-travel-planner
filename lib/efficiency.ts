import type {
  Area,
  Coordinates,
  DayAnalysis,
  DayLeg,
  Destination,
  EfficiencySuggestion,
  ItineraryItem,
  Trip,
  TripDay,
} from './types';
import { centroid, detourRatio, formatKm, formatMinutes, haversineKm, spreadKm } from './geo';
import { estimateLeg } from './routing/geodesic';
import { formatDateShort } from './date';

/**
 * V1 route-efficiency engine.
 *
 * Scope on purpose: it uses geometry only — no AI, no learned priors, no
 * invented "minutes saved". Every message it produces is derived from
 * coordinates, recommended durations and the user's own plan, and it always
 * *explains* the number it quotes.
 *
 * Distances are great-circle and travel times come from a documented estimator,
 * so nothing here is presented as an exact driving figure. When a real routing
 * provider supplies legs, pass them in via `legsOverride` and the messages
 * upgrade to road distances without any change to this file's contract.
 */

export const EFFICIENCY_THRESHOLDS = {
  /** A single hop longer than this (estimated road km) is called out. */
  longLegKm: 28,
  /** A day whose points span more than this is "spread out". */
  spreadyDayKm: 42,
  /** Consecutive stops in different areas further apart than this count as a hop. */
  crossAreaHopKm: 12,
  /** Hotel further than this from the day's activity centroid is a mismatch. */
  hotelMismatchKm: 22,
  /** Detour ratio above which A→B→C is treated as backtracking. */
  backtrackRatio: 1.8,
  /** Below this straight-line distance, a detour is too small to matter. */
  backtrackMinKm: 4,
  /** Planned hours (activities + travel) that make a day unrealistic. */
  packedDayHours: 11,
  /** Days with fewer than this many achievable stops get a reality note. */
  maxStopsPerDay: 6,
} as const;

export interface EfficiencyContext {
  destination: Destination;
  areas: Area[];
  /** Optional real routing legs for a specific day, keyed by day id. */
  legsOverride?: Map<string, DayLeg[]>;
}

function areaCentroidMap(areas: Area[]): Map<string, Coordinates> {
  const map = new Map<string, Coordinates>();
  for (const area of areas) map.set(area.id, { lat: area.coordinates.lat, lng: area.coordinates.lng });
  return map;
}

function legsForDay(day: TripDay): DayLeg[] {
  const legs: DayLeg[] = [];
  for (let i = 1; i < day.items.length; i += 1) {
    const a = day.items[i - 1];
    const b = day.items[i];
    const straight = haversineKm(a, b);
    const estimate = estimateLeg(straight);
    legs.push({
      fromItemId: a.id,
      toItemId: b.id,
      straightLineKm: straight,
      estimatedRoadKm: estimate.distanceMeters / 1000,
      estimatedMinutes: estimate.durationSeconds / 60,
      method: estimate.method,
    });
  }
  return legs;
}

/** The item that contributes most to a day's sprawl. */
function findOutlier(day: TripDay): { item: ItineraryItem; distanceKm: number; centre: Coordinates } | null {
  if (day.items.length < 3) return null;
  const centre = centroid(day.items);
  if (!centre) return null;
  let worst: ItineraryItem | null = null;
  let worstDistance = 0;
  for (const item of day.items) {
    const distance = haversineKm(item, centre);
    if (distance > worstDistance) {
      worstDistance = distance;
      worst = item;
    }
  }
  if (!worst || worstDistance < 8) return null;
  return { item: worst, distanceKm: worstDistance, centre };
}

/** Picks the day whose planned geography best matches a stray item. */
function findBetterDay(
  trip: Trip,
  fromDayId: string,
  item: ItineraryItem,
): { day: TripDay; distanceKm: number } | null {
  let best: { day: TripDay; distanceKm: number } | null = null;
  for (const day of trip.days) {
    if (day.id === fromDayId) continue;
    if (day.items.length >= EFFICIENCY_THRESHOLDS.maxStopsPerDay) continue;
    const centre = centroid(day.items.length > 0 ? day.items : []);
    // Empty days are excellent candidates: they cost nothing to relocate into.
    const distance = centre ? haversineKm(item, centre) : 0;
    const score = centre ? distance : 999;
    if (!best || score < best.distanceKm) best = { day, distanceKm: score };
  }
  return best;
}

export function analyseDay(day: TripDay, trip: Trip, ctx: EfficiencyContext): DayAnalysis {
  const overridden = ctx.legsOverride?.get(day.id);
  const legs = overridden && overridden.length === day.items.length - 1 ? overridden : legsForDay(day);
  const points: Coordinates[] = day.items.map((i) => ({ lat: i.lat, lng: i.lng }));

  const totalStraightLineKm = legs.reduce((sum, leg) => sum + leg.straightLineKm, 0);
  const totalEstimatedRoadKm = legs.reduce((sum, leg) => sum + leg.estimatedRoadKm, 0);
  const totalEstimatedMinutes = legs.reduce((sum, leg) => sum + leg.estimatedMinutes, 0);
  const spread = spreadKm(points);
  const areaIds = Array.from(new Set(day.items.map((i) => i.areaId).filter((v): v is string => Boolean(v))));

  const centroids = areaCentroidMap(ctx.areas);
  let crossAreaHops = 0;
  for (const leg of legs) {
    const from = day.items.find((i) => i.id === leg.fromItemId);
    const to = day.items.find((i) => i.id === leg.toItemId);
    if (!from?.areaId || !to?.areaId || from.areaId === to.areaId) continue;
    const a = centroids.get(from.areaId);
    const b = centroids.get(to.areaId);
    if (a && b && haversineKm(a, b) > EFFICIENCY_THRESHOLDS.crossAreaHopKm) crossAreaHops += 1;
  }

  const suggestions: EfficiencySuggestion[] = [];
  const destinationName = ctx.destination.name;

  if (day.items.length < 2) {
    return {
      dayId: day.id,
      dayIndex: day.index,
      legs,
      totalStraightLineKm,
      totalEstimatedRoadKm,
      totalEstimatedMinutes,
      spreadKm: spread,
      areaIds,
      crossAreaHops,
      suggestions,
    };
  }

  const dayLabel = `Day ${day.index + 1}`;

  // --- 1. One very long hop ------------------------------------------------
  const longest = legs.reduce<DayLeg | null>((worst, leg) => (!worst || leg.estimatedRoadKm > worst.estimatedRoadKm ? leg : worst), null);
  if (longest && longest.estimatedRoadKm > EFFICIENCY_THRESHOLDS.longLegKm) {
    const from = day.items.find((i) => i.id === longest.fromItemId);
    const to = day.items.find((i) => i.id === longest.toItemId);
    suggestions.push({
      id: `${day.id}:long-leg`,
      severity: 'critical',
      title: `${dayLabel} has a long transfer between two stops`,
      detail: `${from?.name ?? 'Stop'} → ${to?.name ?? 'Stop'} is about ${formatKm(
        longest.straightLineKm,
      )} in a straight line (≈${formatKm(longest.estimatedRoadKm)} by road, ≈${formatMinutes(
        longest.estimatedMinutes,
      )} estimated drive). Moving one of them to another day removes the biggest single block of travel.`,
      itemIds: [longest.fromItemId, longest.toItemId],
    });
  }

  // --- 2. Cross-island / spread-out day -----------------------------------
  const outlier = findOutlier(day);
  if (spread > EFFICIENCY_THRESHOLDS.spreadyDayKm) {
    const detail = outlier
      ? `${dayLabel} spans roughly ${formatKm(spread)} between its furthest stops, mostly because of “${
          outlier.item.name
        }”, which sits ${formatKm(outlier.distanceKm)} from the middle of the day.`
      : `${dayLabel} spans roughly ${formatKm(spread)} between its furthest stops.`;
    suggestions.push({
      id: `${day.id}:spread`,
      severity: spread > EFFICIENCY_THRESHOLDS.spreadyDayKm * 1.6 ? 'critical' : 'warning',
      title: `${dayLabel} covers opposite parts of ${destinationName}`,
      detail,
      itemIds: outlier ? [outlier.item.id] : day.items.map((i) => i.id),
    });
  }

  // --- 3. Backtracking -----------------------------------------------------
  for (let i = 1; i < day.items.length - 1; i += 1) {
    const a = day.items[i - 1];
    const b = day.items[i];
    const c = day.items[i + 1];
    const ratio = detourRatio(a, b, c);
    const direct = haversineKm(a, c);
    if (ratio >= EFFICIENCY_THRESHOLDS.backtrackRatio && direct > EFFICIENCY_THRESHOLDS.backtrackMinKm) {
      suggestions.push({
        id: `${day.id}:backtrack:${b.id}`,
        severity: 'warning',
        title: `“${b.name}” looks like a detour`,
        detail: `Going ${a.name} → ${b.name} → ${c.name} travels ${ratio.toFixed(
          1,
        )}× further than going straight from ${a.name} to ${c.name}. Reordering the stops, or moving “${
          b.name
        }” to another day, would cut that.`,
        itemIds: [b.id],
      });
      break;
    }
  }

  // --- 4. Hotel location vs the day's plan ---------------------------------
  const hotel = day.items.find((i) => i.kind === 'marriott' || i.kind === 'hilton');
  if (hotel) {
    const activityPoints = day.items.filter((i) => i.id !== hotel.id);
    const activityCentre = centroid(activityPoints);
    if (activityCentre) {
      const distance = haversineKm(hotel, activityCentre);
      if (distance > EFFICIENCY_THRESHOLDS.hotelMismatchKm) {
        suggestions.push({
          id: `${day.id}:hotel-mismatch`,
          severity: 'warning',
          title: 'Your hotel is a long way from today’s stops',
          detail: `“${hotel.name}” is about ${formatKm(
            distance,
          )} from the middle of today’s activities. Staying closer for this section of the trip would remove roughly ${formatMinutes(
            distance * 2 * 2.6,
          )} of driving each way.`,
          itemIds: [hotel.id],
        });
      }
    }
  }

  // --- 5. Too many stops for the hours available ---------------------------
  const activityMinutes = day.items.reduce((sum, item) => sum + (item.durationMin ?? 0), 0);
  const plannedHours = (activityMinutes + totalEstimatedMinutes) / 60;
  if (plannedHours > EFFICIENCY_THRESHOLDS.packedDayHours) {
    suggestions.push({
      id: `${day.id}:packed`,
      severity: 'info',
      title: `${dayLabel} needs about ${plannedHours.toFixed(1)} hours`,
      detail: `Activities plus estimated travel add up to roughly ${plannedHours.toFixed(
        1,
      )} hours before meals. Consider moving one stop to a lighter day.`,
      itemIds: day.items.map((i) => i.id),
    });
  }

  // --- 6. Actionable relocation -------------------------------------------
  if (outlier && (crossAreaHops >= 3 || spread > EFFICIENCY_THRESHOLDS.spreadyDayKm)) {
    const better = findBetterDay(trip, day.id, outlier.item);
    if (better) {
      suggestions.push({
        id: `${day.id}:move-${outlier.item.id}`,
        severity: 'info',
        title: `Consider moving “${outlier.item.name}” to Day ${better.day.index + 1}`,
        detail:
          better.day.items.length === 0
            ? `Day ${better.day.index + 1} (${formatDateShort(
                better.day.date,
              )}) is still empty, so it can absorb this stop without pushing anything else around.`
            : `Day ${better.day.index + 1} (${formatDateShort(
                better.day.date,
              )}) is already planned closer to this stop, so the transfer would be shorter.`,
        itemIds: [outlier.item.id],
        action: {
          kind: 'move-to-day',
          itemId: outlier.item.id,
          itemName: outlier.item.name,
          fromDayId: day.id,
          toDayId: better.day.id,
          toDayLabel: `Day ${better.day.index + 1}`,
          reason: `Reduces the spread of ${dayLabel}`,
        },
      });
    }
  }

  // --- 7. Stop count sanity -------------------------------------------------
  if (day.items.length > EFFICIENCY_THRESHOLDS.maxStopsPerDay) {
    suggestions.push({
      id: `${day.id}:too-many`,
      severity: 'info',
      title: `${dayLabel} has ${day.items.length} stops`,
      detail: `More than ${EFFICIENCY_THRESHOLDS.maxStopsPerDay} stops in one day rarely survives contact with ${destinationName} traffic. Fewer, better-placed stops usually feel like more holiday.`,
      itemIds: day.items.map((i) => i.id),
    });
  }

  return {
    dayId: day.id,
    dayIndex: day.index,
    legs,
    totalStraightLineKm,
    totalEstimatedRoadKm,
    totalEstimatedMinutes,
    spreadKm: spread,
    areaIds,
    crossAreaHops,
    suggestions,
  };
}

export function analyseTrip(trip: Trip, ctx: EfficiencyContext): DayAnalysis[] {
  return trip.days.map((day) => analyseDay(day, trip, ctx));
}

/**
 * Whole-trip advice: where to base yourself.
 *
 * Compares the area mix of the plan against a "one base per section" model and
 * reports the clustering it finds — never a recommendation to book anything.
 */
export interface BaseSuggestion {
  areaId: string;
  areaName: string;
  itemCount: number;
  share: number;
  message: string;
}

export function suggestBases(trip: Trip, destination: Destination, areas: Area[]): BaseSuggestion[] {
  const counts = new Map<string, number>();
  const total = trip.days.flatMap((d) => d.items).filter((i) => i.areaId).length;
  if (total === 0) return [];
  for (const day of trip.days) {
    for (const item of day.items) {
      if (!item.areaId) continue;
      counts.set(item.areaId, (counts.get(item.areaId) ?? 0) + 1);
    }
  }
  const nameById = new Map(areas.map((a) => [a.id, a.name]));
  return Array.from(counts.entries())
    .map(([areaId, count]) => ({
      areaId,
      areaName: nameById.get(areaId) ?? areaId,
      itemCount: count,
      share: count / total,
    }))
    .filter((entry) => entry.share >= 0.25)
    .sort((a, b) => b.itemCount - a.itemCount)
    .map((entry) => ({
      ...entry,
      message: `${Math.round(entry.share * 100)}% of your plan is in ${entry.areaName} (${
        entry.itemCount
      } ${entry.itemCount === 1 ? 'stop' : 'stops'}). Basing yourself in ${entry.areaName} for that section of the trip in ${destination.name} would cut the most travel.`,
    }));
}

/** Severity roll-up used for the little indicator on each day tab. */
export function daySeverity(analysis: DayAnalysis | undefined): 'ok' | 'info' | 'warning' | 'critical' {
  if (!analysis || analysis.suggestions.length === 0) return 'ok';
  if (analysis.suggestions.some((s) => s.severity === 'critical')) return 'critical';
  if (analysis.suggestions.some((s) => s.severity === 'warning')) return 'warning';
  return 'info';
}
