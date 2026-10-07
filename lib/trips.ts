import type { Hotel, ItineraryItem, Trip } from './types';
import { addDays, sortedStays, stayHotel, tripNights } from './trip-stays';

/**
 * Trip-level facts, derived.
 *
 * Kept pure and out of the components for the usual reason: "is this trip past,
 * or upcoming?" and "how many places have I actually planned?" are arithmetic
 * over dates and item kinds, and arithmetic is worth testing without a browser.
 */

export type TripPhase = 'upcoming' | 'active' | 'past';

/**
 * Where a trip sits relative to a date.
 *
 * `active` exists because a trip in progress is neither upcoming nor past, and
 * collapsing it into either makes the list say something false about a traveller
 * who is in Bali right now.
 */
export function tripPhase(trip: Trip, today: string): TripPhase {
  if (today < trip.arrivalDate) return 'upcoming';
  // The departure date is still a day of the trip — you fly home at the end of it.
  if (today <= trip.departureDate) return 'active';
  return 'past';
}

export function todayIso(now = new Date()): string {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** Nights, not days: a 10th-to-14th trip is four nights. */
export function tripNightCount(trip: Trip): number {
  return tripNights(trip).length;
}

/** Day count, inclusive of arrival and departure. */
export function tripDayCount(trip: Trip): number {
  return trip.days.length;
}

function isHotelKind(kind: ItineraryItem['kind']): boolean {
  return kind === 'marriott' || kind === 'hilton' || kind === 'ihg' || kind === 'hyatt' || kind === 'gha';
}

/**
 * Places the traveller has chosen, as opposed to the stops the model derives.
 *
 * Hotels and airports are excluded: a stay is accommodation, and an airport row
 * is a flight, so counting either as a "planned place" would inflate the number
 * with things the traveller did not pick from the map.
 */
export function plannedPlaceCount(trip: Trip): number {
  return trip.days.reduce(
    (total, day) => total + day.items.filter((item) => !isHotelKind(item.kind) && item.kind !== 'airport').length,
    0,
  );
}

export interface TripSummary {
  dayCount: number;
  nightCount: number;
  travellers: number;
  plannedPlaces: number;
  /** One line naming the accommodation, or null when nothing is booked. */
  accommodation: string | null;
  stayCount: number;
  /** True when at least one night has no booking. */
  hasGap: boolean;
}

/** Everything the My Trips list and the trip detail header both need. */
export function tripSummary(trip: Trip, hotels: Hotel[], locale: 'zh-CN' | 'en' = 'zh-CN'): TripSummary {
  const stays = sortedStays(trip);
  const names = stays
    .map((stay) => {
      const hotel = stayHotel(stay, hotels);
      if (!hotel) return null;
      return locale === 'zh-CN' && hotel.nameZh ? hotel.nameZh : hotel.name;
    })
    .filter((entry): entry is string => Boolean(entry));

  const bookedNights = new Set<string>();
  for (const stay of stays) {
    let date = stay.checkInDate;
    // Bounded by the trip's own range so a corrupt stay cannot loop.
    while (date < stay.checkOutDate && bookedNights.size < 400) {
      bookedNights.add(date);
      date = addDays(date, 1);
    }
  }
  const nights = tripNights(trip);

  return {
    dayCount: trip.days.length,
    nightCount: nights.length,
    travellers: trip.travellers,
    plannedPlaces: plannedPlaceCount(trip),
    accommodation: names.length === 0 ? null : names.length === 1 ? names[0] : names.join(' → '),
    stayCount: stays.length,
    hasGap: nights.some((night) => !bookedNights.has(night)),
  };
}

/**
 * Trips in the order the list shows them: trips still to come (or under way)
 * sorted by how soon, then finished trips most-recent-first.
 */
export function sortTripsForList(trips: Trip[], today: string): Trip[] {
  const rank: Record<TripPhase, number> = { active: 0, upcoming: 1, past: 2 };
  return [...trips].sort((a, b) => {
    const phaseA = tripPhase(a, today);
    const phaseB = tripPhase(b, today);
    if (rank[phaseA] !== rank[phaseB]) return rank[phaseA] - rank[phaseB];
    // Upcoming reads soonest-first; past reads most-recent-first.
    return phaseA === 'past'
      ? b.arrivalDate.localeCompare(a.arrivalDate)
      : a.arrivalDate.localeCompare(b.arrivalDate);
  });
}

/** The longest stay's hotel, used as a thumbnail subject for a trip. */
export function primaryStayHotelId(trip: Trip): string | null {
  const stays = sortedStays(trip);
  if (stays.length === 0) return null;
  const longest = [...stays].sort((a, b) => b.checkOutDate.localeCompare(a.checkOutDate) && a.checkInDate.localeCompare(b.checkInDate));
  return longest[0].hotelPlaceId;
}

/** Every `refId` the trip mentions, so a map can scope itself to the trip. */
export function tripRefIds(trip: Trip): Set<string> {
  const ids = new Set<string>();
  for (const day of trip.days) for (const item of day.items) ids.add(item.refId);
  for (const stay of trip.stays ?? []) ids.add(stay.hotelPlaceId);
  return ids;
}
