import type {
  Airport,
  Coordinates,
  DataConfidence,
  Destination,
  Hotel,
  ItineraryItem,
  MarkerLayer,
  Place,
  Trip,
  TripDay,
  TripDraft,
} from './types';
import { addDays, inclusiveDayCount, isValidIsoDate, toIsoDate } from './date';
import { makeId } from './utils';

/**
 * Pure trip domain logic. No React, no storage — so the same functions can run
 * on a server later when trips move out of localStorage.
 */

export const MAX_TRIP_DAYS = 21;

/** Builds the empty day scaffolding for a date range. */
export function generateDays(arrivalDate: string, departureDate: string): TripDay[] {
  const count = Math.min(MAX_TRIP_DAYS, inclusiveDayCount(arrivalDate, departureDate));
  const days: TripDay[] = [];
  for (let i = 0; i < count; i += 1) {
    days.push({ id: `day-${i + 1}`, index: i, date: addDays(arrivalDate, i), items: [] });
  }
  return days;
}

export function buildTripName(destination: Destination, arrivalDate: string): string {
  const month = new Date(arrivalDate).toLocaleDateString('en-GB', { month: 'short' });
  return `${destination.name} · ${month}`;
}

export function createTrip(draft: TripDraft, destination: Destination): Trip {
  const arrival = isValidIsoDate(draft.arrivalDate) ? draft.arrivalDate : toIsoDate(new Date());
  const departure = isValidIsoDate(draft.departureDate) ? draft.departureDate : addDays(arrival, 4);
  const now = new Date().toISOString();
  const id = makeId('trip');
  const days = generateDays(arrival, departure).map((day) => ({ ...day, id: `${id}-${day.id}` }));
  return {
    id,
    name: draft.name?.trim() || buildTripName(destination, arrival),
    originCityId: draft.originCityId,
    destinationId: destination.id,
    arrivalDate: arrival,
    departureDate: departure,
    travellers: Math.max(1, draft.travellers || 2),
    styles: draft.styles ?? [],
    budget: draft.budget,
    loyalty: draft.loyalty ?? [],
    days,
    // A new trip carries the accommodation model from the start, so nothing has
    // to be migrated for it, and every day has a defineable start time.
    stays: [],
    defaultStartTime: '09:00',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Rebuilds the day list after a date change while keeping as much of the
 * existing plan as possible: days that still exist keep their items, new days
 * arrive empty, and orphaned items are reported so the UI can warn instead of
 * silently deleting work.
 */
export function rescheduleTrip(
  trip: Trip,
  arrivalDate: string,
  departureDate: string,
): { days: TripDay[]; droppedItems: ItineraryItem[] } {
  /*
   * Carry the day's own settings across a date change.
   *
   * The first version matched by INDEX, which loses a start time the moment a
   * trip gains a day at the front — and dropped `startTime` entirely, so a
   * traveller who set 08:30 for a day silently lost it by editing the trip
   * dates. Both are the same mistake: treating a per-date setting as positional.
   */
  const previousByDate = new Map(trip.days.map((day) => [day.date, day]));
  const next = generateDays(arrivalDate, departureDate).map((day, index) => {
    const existing = previousByDate.get(day.date) ?? trip.days[index];
    return {
      ...day,
      id: existing?.id ?? `${trip.id}-${day.id}`,
      items: existing?.items ?? [],
      note: existing?.note,
      startTime: existing?.startTime,
    };
  });
  const droppedItems = trip.days.slice(next.length).flatMap((day) => day.items);
  return { days: next, droppedItems };
}

// ---------------------------------------------------------------------------
// Building itinerary items from data entities
// ---------------------------------------------------------------------------

export function itemFromHotel(hotel: Hotel): ItineraryItem {
  return {
    id: makeId('item'),
    refId: hotel.id,
    kind: hotel.hotelGroup === 'marriott' ? 'marriott' : 'hilton',
    name: hotel.name,
    nameZh: hotel.nameZh,
    areaId: hotel.areaId,
    lat: hotel.coordinates.lat,
    lng: hotel.coordinates.lng,
    durationMin: 0,
    confidence: hotel.coordinates.confidence,
  };
}

export function itemFromPlace(place: Place): ItineraryItem {
  return {
    id: makeId('item'),
    refId: place.id,
    kind: place.markerLayer,
    name: place.name,
    nameZh: place.nameZh,
    areaId: place.areaId,
    lat: place.coordinates.lat,
    lng: place.coordinates.lng,
    durationMin: place.recommendedDurationMin,
    note: place.notes,
    confidence: place.coordinates.confidence,
  };
}

export function itemFromAirport(airport: Airport, kind: 'arrival' | 'departure'): ItineraryItem {
  return {
    id: makeId('item'),
    refId: airport.id,
    kind: 'airport',
    // The code is the searchable part; the word around it is chrome, and the
    // timeline resolves that through the catalogue rather than storing English.
    name: `${airport.code} — ${airport.name}`,
    nameZh: `${airport.code} — ${airport.name}`,
    lat: airport.coordinates.lat,
    lng: airport.coordinates.lng,
    durationMin: kind === 'arrival' ? 60 : 120,
    confidence: airport.coordinates.confidence,
    note: kind === 'arrival' ? 'Clear immigration and transfer to your hotel.' : 'Check in 3 hours before an international departure.',
  };
}

export function itemFromCustom(input: {
  name: string;
  lat: number;
  lng: number;
  kind?: MarkerLayer;
  areaId?: string;
  durationMin?: number;
  note?: string;
}): ItineraryItem {
  return {
    id: makeId('item'),
    refId: makeId('custom'),
    kind: input.kind ?? 'activity',
    name: input.name.trim(),
    areaId: input.areaId,
    lat: input.lat,
    lng: input.lng,
    durationMin: input.durationMin ?? 60,
    note: input.note,
    confidence: 'approximate' as DataConfidence,
  };
}

// ---------------------------------------------------------------------------
// Trip mutations (pure — the store just applies the result)
// ---------------------------------------------------------------------------

export function addItemToDay(trip: Trip, dayId: string, item: ItineraryItem): Trip {
  return {
    ...trip,
    updatedAt: new Date().toISOString(),
    days: trip.days.map((day) => (day.id === dayId ? { ...day, items: [...day.items, item] } : day)),
  };
}

export function removeItem(trip: Trip, itemId: string): Trip {
  return {
    ...trip,
    updatedAt: new Date().toISOString(),
    days: trip.days.map((day) => ({ ...day, items: day.items.filter((i) => i.id !== itemId) })),
  };
}

export function removeItemFromDay(trip: Trip, dayId: string, itemId: string): Trip {
  return {
    ...trip,
    updatedAt: new Date().toISOString(),
    days: trip.days.map((day) =>
      day.id === dayId ? { ...day, items: day.items.filter((i) => i.id !== itemId) } : day,
    ),
  };
}

/** Moves an item within a day. `toIndex` is the target position after removal. */
export function reorderWithinDay(trip: Trip, dayId: string, itemId: string, toIndex: number): Trip {
  return {
    ...trip,
    updatedAt: new Date().toISOString(),
    days: trip.days.map((day) => {
      if (day.id !== dayId) return day;
      const from = day.items.findIndex((i) => i.id === itemId);
      if (from === -1) return day;
      const items = [...day.items];
      const [moved] = items.splice(from, 1);
      const clamped = Math.max(0, Math.min(items.length, toIndex));
      items.splice(clamped, 0, moved);
      return { ...day, items };
    }),
  };
}

export function moveItemBetweenDays(trip: Trip, fromDayId: string, itemId: string, toDayId: string, toIndex?: number): Trip {
  const source = trip.days.find((d) => d.id === fromDayId);
  const item = source?.items.find((i) => i.id === itemId);
  if (!item || fromDayId === toDayId) return trip;
  const now = new Date().toISOString();
  return {
    ...trip,
    updatedAt: now,
    days: trip.days.map((day) => {
      if (day.id === fromDayId) return { ...day, items: day.items.filter((i) => i.id !== itemId) };
      if (day.id === toDayId) {
        const items = [...day.items];
        const index = toIndex === undefined ? items.length : Math.max(0, Math.min(items.length, toIndex));
        items.splice(index, 0, item);
        return { ...day, items };
      }
      return day;
    }),
  };
}

export function duplicateItemWithinDay(trip: Trip, dayId: string, itemId: string): Trip {
  return {
    ...trip,
    updatedAt: new Date().toISOString(),
    days: trip.days.map((day) => {
      if (day.id !== dayId) return day;
      const index = day.items.findIndex((i) => i.id === itemId);
      if (index === -1) return day;
      const copy: ItineraryItem = { ...day.items[index], id: makeId('item') };
      const items = [...day.items];
      items.splice(index + 1, 0, copy);
      return { ...day, items };
    }),
  };
}

export function setDayNote(trip: Trip, dayId: string, note: string): Trip {
  return {
    ...trip,
    updatedAt: new Date().toISOString(),
    days: trip.days.map((day) => (day.id === dayId ? { ...day, note } : day)),
  };
}

export function clearDay(trip: Trip, dayId: string): Trip {
  return {
    ...trip,
    updatedAt: new Date().toISOString(),
    days: trip.days.map((day) => (day.id === dayId ? { ...day, items: [] } : day)),
  };
}

export function updateItem(trip: Trip, dayId: string, itemId: string, patch: Partial<ItineraryItem>): Trip {
  return {
    ...trip,
    updatedAt: new Date().toISOString(),
    days: trip.days.map((day) =>
      day.id === dayId
        ? { ...day, items: day.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
        : day,
    ),
  };
}

// ---------------------------------------------------------------------------
// Derived reads
// ---------------------------------------------------------------------------

export function findItem(trip: Trip | null, itemId: string): { day: TripDay; item: ItineraryItem } | null {
  if (!trip) return null;
  for (const day of trip.days) {
    const item = day.items.find((i) => i.id === itemId);
    if (item) return { day, item };
  }
  return null;
}

export function isRefInTrip(trip: Trip | null, refId: string): { dayId: string; itemId: string } | null {
  if (!trip) return null;
  for (const day of trip.days) {
    const item = day.items.find((i) => i.refId === refId);
    if (item) return { dayId: day.id, itemId: item.id };
  }
  return null;
}

export function tripTotals(trip: Trip | null) {
  if (!trip) return { items: 0, days: 0, hotels: 0, points: 0 };
  const items = trip.days.flatMap((d) => d.items);
  return {
    items: items.length,
    days: trip.days.length,
    hotels: items.filter((i) => i.kind === 'marriott' || i.kind === 'hilton').length,
    points: items.length,
  };
}

export function dayPoints(day: TripDay | null): Coordinates[] {
  if (!day) return [];
  return day.items.map((item) => ({ lat: item.lat, lng: item.lng }));
}

/** Orders a day sensibly for routing: hotel first, hotel last, airport anchored. */
export function routeOrder(day: TripDay | null): ItineraryItem[] {
  if (!day) return [];
  return day.items;
}

export const EMPTY_TRIP_STATE = {
  trips: [] as Trip[],
  activeTripId: null as string | null,
};
