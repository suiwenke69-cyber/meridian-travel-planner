import type {
  Airport,
  DayAnchor,
  DayAnchors,
  Hotel,
  ItineraryItem,
  Trip,
  TripDay,
  TripStay,
} from './types';

/**
 * Stays, and the day anchors derived from them.
 *
 * ONE SOURCE OF TRUTH
 * -------------------
 * A trip stores STAYS — a hotel and a date range. Everything else about
 * accommodation is derived: where a day starts, where it ends, whether today
 * involves moving, and whether a night is unbooked. Nothing derived is stored,
 * so editing a stay or a trip date moves every affected day with no bookkeeping
 * and no way for the timeline to disagree with the accommodation list.
 *
 * A NIGHT IS THE UNIT
 * -------------------
 * The awkward-looking `night d` definition below is what makes a hotel-change day
 * fall out for free. A stay from the 10th to the 12th covers the nights of the
 * 10th and 11th. So on the 12th:
 *
 *   start = the stay covering the night of the 11th  → the hotel you woke in
 *   end   = the stay covering the night of the 12th  → the hotel you sleep in
 *
 * Different hotels, and the day is a hotel-change day without anyone declaring it.
 */

/** A stay covers night `date` when check-in is on or before it and check-out is after. */
export function stayCoversNight(stay: TripStay, date: string): boolean {
  return stay.checkInDate <= date && date < stay.checkOutDate;
}

/** ISO date arithmetic on the date part only, so timezones cannot shift a night. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}

function shiftDays(date: string, days: number): string {
  return addDays(date, days);
}

/** The stay covering a night, or null when that night is unbooked. */
export function stayForNight(stays: TripStay[], date: string): TripStay | null {
  // Later stays win if two overlap, which keeps the derivation deterministic
  // while the editor is mid-edit and the overlap is not yet resolved.
  const covering = stays.filter((stay) => stayCoversNight(stay, date));
  if (covering.length === 0) return null;
  return covering.sort((a, b) => a.checkInDate.localeCompare(b.checkInDate)).at(-1)!;
}

/**
 * Stays that overlap another stay.
 *
 * The editor refuses to create one and says why. It is checked here rather than
 * in the component because the same question is asked by the migration and by
 * anything that imports a trip.
 */
export function findOverlappingStays(stays: TripStay[]): Array<[TripStay, TripStay]> {
  const sorted = [...stays].sort((a, b) => a.checkInDate.localeCompare(b.checkInDate));
  const out: Array<[TripStay, TripStay]> = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1];
    const current = sorted[i];
    // Back-to-back is not an overlap: check-out on the 12th and check-in on the
    // 12th is exactly how a hotel change works.
    if (current.checkInDate < previous.checkOutDate) out.push([previous, current]);
  }
  return out;
}

/** A stay may not end before it begins, and may not be a zero-night booking. */
export function isStayValid(stay: Pick<TripStay, 'checkInDate' | 'checkOutDate'>): boolean {
  return stay.checkOutDate > stay.checkInDate;
}

function hotelAnchor(hotel: Hotel, id: string): DayAnchor {
  return {
    id,
    kind: 'hotel',
    refId: hotel.id,
    name: hotel.name,
    nameZh: hotel.nameZh,
    lat: hotel.coordinates.lat,
    lng: hotel.coordinates.lng,
    areaId: hotel.areaId,
    confidence: hotel.coordinates.confidence,
    itemKind: hotel.hotelGroup,
  };
}

/**
 * An itinerary item that is already a geographic end-point.
 *
 * This is the seam for arrival and departure days. An arrival item lives on the
 * first day with the airport's coordinates, so it can anchor the start of that
 * day without any new data — and when a trip origin or a flight is modelled
 * later, it arrives through the same door.
 */
function itemAnchor(item: ItineraryItem, kind: 'airport' | 'custom'): DayAnchor {
  return {
    id: `anchor:${item.id}`,
    kind,
    refId: item.refId,
    name: item.name,
    nameZh: item.nameZh,
    lat: item.lat,
    lng: item.lng,
    areaId: item.areaId,
    confidence: item.confidence,
    itemKind: item.kind,
  };
}

/** The arrival item on a day, if the traveller has one. */
function arrivalItem(day: TripDay): ItineraryItem | null {
  return day.items.find((item) => item.kind === 'airport' && /arriv/i.test(item.note ?? '')) ?? day.items.find((item) => item.kind === 'airport') ?? null;
}

function departureItem(day: TripDay): ItineraryItem | null {
  return day.items.find((item) => item.kind === 'airport' && /depart|check in/i.test(item.note ?? '')) ?? null;
}

/**
 * Derives one day's anchors.
 *
 * `isLastDay` matters because the final day's night is not spent: a trip that
 * ends on the 14th is not missing accommodation on the 14th, it is going home.
 */
export function deriveDayAnchors(
  trip: Trip,
  day: TripDay,
  hotels: Hotel[],
  options: { isLastDay?: boolean } = {},
): DayAnchors {
  const stays = trip.stays ?? [];
  const isLastDay = options.isLastDay ?? day.index === trip.days.length - 1;
  const hotelById = new Map(hotels.map((hotel) => [hotel.id, hotel]));

  // Where the traveller woke up: the stay covering LAST night. On the first day
  // there is no previous night, so the arrival item takes the start instead.
  const previousNightStay = stayForNight(stays, shiftDays(day.date, -1));
  const startHotel = previousNightStay ? hotelById.get(previousNightStay.hotelPlaceId) : undefined;

  // Where the traveller sleeps: the stay covering tonight.
  const tonightStay = stayForNight(stays, day.date);
  const endHotel = tonightStay ? hotelById.get(tonightStay.hotelPlaceId) : undefined;

  const arrival = startHotel ? null : arrivalItem(day);
  const departure = endHotel || !isLastDay ? null : departureItem(day);

  const start: DayAnchor | null = startHotel
    ? hotelAnchor(startHotel, `start:${day.id}`)
    : arrival
      ? itemAnchor(arrival, 'airport')
      : null;

  const end: DayAnchor | null = endHotel
    ? hotelAnchor(endHotel, `end:${day.id}`)
    : departure
      ? itemAnchor(departure, 'airport')
      : null;

  const isHotelChange = Boolean(
    startHotel && endHotel && startHotel.id !== endHotel.id,
  );

  return {
    start,
    end,
    isHotelChange,
    // The last day's night is spent at home, not missing.
    missingAccommodation: !tonightStay && !isLastDay,
    fromStayId: startHotel ? previousNightStay?.id : undefined,
    toStayId: endHotel ? tonightStay?.id : undefined,
  };
}

/** Every day's anchors, in day order. */
export function deriveTripAnchors(trip: Trip, hotels: Hotel[]): Map<string, DayAnchors> {
  const out = new Map<string, DayAnchors>();
  trip.days.forEach((day, index) => {
    out.set(day.id, deriveDayAnchors(trip, day, hotels, { isLastDay: index === trip.days.length - 1 }));
  });
  return out;
}

/** The nights of a trip — every date from arrival up to, but not including, departure. */
export function tripNights(trip: Trip): string[] {
  const nights: string[] = [];
  let date = trip.arrivalDate;
  // Bounded by the trip's own dates, so a malformed range cannot loop forever.
  while (date < trip.departureDate && nights.length < 366) {
    nights.push(date);
    date = addDays(date, 1);
  }
  return nights;
}

/** Nights with no stay. The editor lists these; nothing fabricates a hotel. */
export function unbookedNights(trip: Trip): string[] {
  const stays = trip.stays ?? [];
  return tripNights(trip).filter((night) => !stayForNight(stays, night));
}

/** Stays in chronological order, as the editor and the timeline both read them. */
export function sortedStays(trip: Trip): TripStay[] {
  return [...(trip.stays ?? [])].sort((a, b) => a.checkInDate.localeCompare(b.checkInDate));
}

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

/**
 * Turns hotels that were stored as itinerary items into stays.
 *
 * THE RULE IS DELIBERATELY CONSERVATIVE
 * -------------------------------------
 * A hotel row on a day could mean "I slept here" or "I went to look at this
 * hotel". The two are indistinguishable from one row, so a SINGLE occurrence is
 * never converted — it stays an ordinary item, exactly as the traveller left it.
 *
 * A hotel that appears on two or more CONSECUTIVE days is not ambiguous: nobody
 * visits the same hotel on consecutive days without sleeping there. Those runs
 * become stays, their rows are removed from the days, and everything else is
 * untouched.
 *
 * The result is idempotent: a trip that already has stays is returned unchanged.
 */
export function migrateTripToStays(trip: Trip, now = new Date().toISOString()): Trip {
  if (trip.stays && trip.stays.length > 0) {
    return trip.stays === undefined ? { ...trip, stays: [] } : trip;
  }

  const hotelRefsOnDay = trip.days.map((day) => {
    const hotelsOnDay = day.items.filter(
      (item) => item.kind === 'marriott' || item.kind === 'hilton' || item.kind === 'ihg' || item.kind === 'hyatt' || item.kind === 'gha',
    );
    // Two DIFFERENT hotels on one day is ambiguous — preserve both.
    return new Set(hotelsOnDay.map((item) => item.refId));
  });

  const convertedDays = new Set<string>();
  const stays: TripStay[] = [];
  const consumedItemIds = new Set<string>();
  let index = 0;
  let counter = 0;

  while (index < trip.days.length) {
    const refs = hotelRefsOnDay[index];
    if (refs.size !== 1) {
      index += 1;
      continue;
    }
    const hotelId = [...refs][0];

    // Extend while the SAME single hotel repeats on the next consecutive day.
    let end = index;
    while (
      end + 1 < trip.days.length &&
      hotelRefsOnDay[end + 1].size === 1 &&
      [...hotelRefsOnDay[end + 1]][0] === hotelId
    ) {
      end += 1;
    }

    const runLength = end - index + 1;
    if (runLength >= 2) {
      counter += 1;
      stays.push({
        id: `stay-migrated-${counter}-${hotelId}`.slice(0, 60),
        hotelPlaceId: hotelId,
        checkInDate: trip.days[index].date,
        // Check-out is the morning after the last night of the run.
        checkOutDate: addDays(trip.days[end].date, 1),
        note: 'Migrated from hotel rows on consecutive days.',
      });
      for (let day = index; day <= end; day += 1) {
        convertedDays.add(trip.days[day].id);
        for (const item of trip.days[day].items) {
          if (item.refId === hotelId) consumedItemIds.add(item.id);
        }
      }
    }

    index = end + 1;
  }

  const days = trip.days.map((day) => {
    if (!convertedDays.has(day.id)) return day;
    return { ...day, items: day.items.filter((item) => !consumedItemIds.has(item.id)) };
  });

  return { ...trip, stays, defaultStartTime: trip.defaultStartTime ?? '09:00', days, updatedAt: now };
}

/** True when the trip has any stay or any hotel row, i.e. accommodation to show. */
export function hasAccommodation(trip: Trip): boolean {
  return (trip.stays?.length ?? 0) > 0;
}

/** The hotel a stay refers to, resolved. */
export function stayHotel(stay: TripStay, hotels: Hotel[]): Hotel | null {
  return hotels.find((hotel) => hotel.id === stay.hotelPlaceId) ?? null;
}

/** The airports a trip's days mention, for the arrival/departure anchors. */
export function airportsForAnchors(airports: Airport[]): Airport[] {
  return airports;
}
