'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Destination, ItineraryItem, Trip, TripDraft } from '../types';
import {
  addItemToDay,
  clearDay,
  createTrip as buildTrip,
  duplicateItemWithinDay,
  moveItemBetweenDays,
  removeItem,
  reorderWithinDay,
  rescheduleTrip,
  setDayNote,
  updateItem,
} from '../trip';

/**
 * Trip persistence.
 *
 * V1 uses localStorage because there are no accounts yet. The store's public
 * surface is intentionally the same shape a server-backed store would expose
 * (list / create / update / delete + active selection), so swapping in a real
 * backend means replacing the `persist` middleware with API calls rather than
 * rewriting components.
 */

export interface TripStoreState {
  trips: Trip[];
  activeTripId: string | null;
  /** True once localStorage has been read — components use it to avoid hydration flicker. */
  hydrated: boolean;
  /** Set when a reschedule dropped planned items, so the UI can warn once. */
  lastRescheduleWarning: { tripId: string; dropped: number } | null;

  setHydrated: (value: boolean) => void;
  createTrip: (draft: TripDraft, destination: Destination) => Trip;
  updateTripMeta: (
    tripId: string,
    patch: Partial<Pick<Trip, 'name' | 'travellers' | 'styles' | 'budget' | 'loyalty'>>,
  ) => void;
  updateTripDates: (tripId: string, arrivalDate: string, departureDate: string) => void;
  deleteTrip: (tripId: string) => void;
  duplicateTrip: (tripId: string) => Trip | null;
  setActiveTrip: (tripId: string | null) => void;

  addItem: (tripId: string, dayId: string, item: ItineraryItem) => void;
  removeItem: (tripId: string, itemId: string) => void;
  reorderItem: (tripId: string, dayId: string, itemId: string, toIndex: number) => void;
  moveItemToDay: (tripId: string, fromDayId: string, itemId: string, toDayId: string, toIndex?: number) => void;
  /** Convenience wrapper that acts on whichever trip is active. */
  moveActiveItem: (fromDayId: string, itemId: string, toDayId: string, toIndex?: number) => void;
  duplicateItem: (tripId: string, dayId: string, itemId: string) => void;
  patchItem: (tripId: string, dayId: string, itemId: string, patch: Partial<ItineraryItem>) => void;
  clearDayItems: (tripId: string, dayId: string) => void;
  setDayNote: (tripId: string, dayId: string, note: string) => void;

  dismissRescheduleWarning: () => void;
  clearAll: () => void;
}

function mapTrip(trips: Trip[], tripId: string, fn: (trip: Trip) => Trip): Trip[] {
  return trips.map((trip) => (trip.id === tripId ? fn(trip) : trip));
}

export const useTripStore = create<TripStoreState>()(
  persist(
    (set, get) => ({
      trips: [],
      activeTripId: null,
      hydrated: false,
      lastRescheduleWarning: null,

      setHydrated: (value) => set({ hydrated: value }),

      createTrip: (draft, destination) => {
        const trip = buildTrip(draft, destination);
        set((state) => ({ trips: [trip, ...state.trips], activeTripId: trip.id }));
        return trip;
      },

      updateTripMeta: (tripId, patch) =>
        set((state) => ({
          trips: mapTrip(state.trips, tripId, (trip) => ({
            ...trip,
            ...patch,
            updatedAt: new Date().toISOString(),
          })),
        })),

      updateTripDates: (tripId, arrivalDate, departureDate) =>
        set((state) => {
          const trip = state.trips.find((t) => t.id === tripId);
          if (!trip) return state;
          const { days, droppedItems } = rescheduleTrip(trip, arrivalDate, departureDate);
          return {
            trips: mapTrip(state.trips, tripId, (current) => ({
              ...current,
              arrivalDate,
              departureDate,
              days,
              updatedAt: new Date().toISOString(),
            })),
            lastRescheduleWarning:
              droppedItems.length > 0 ? { tripId, dropped: droppedItems.length } : null,
          };
        }),

      deleteTrip: (tripId) =>
        set((state) => {
          const trips = state.trips.filter((t) => t.id !== tripId);
          return {
            trips,
            activeTripId: state.activeTripId === tripId ? (trips[0]?.id ?? null) : state.activeTripId,
          };
        }),

      duplicateTrip: (tripId) => {
        const source = get().trips.find((t) => t.id === tripId);
        if (!source) return null;
        const now = new Date().toISOString();
        const id = `${source.id}-copy-${Date.now().toString(36)}`;
        const copy: Trip = {
          ...source,
          id,
          name: `${source.name} (copy)`,
          days: source.days.map((day, index) => ({
            ...day,
            id: `${id}-day-${index + 1}`,
            items: day.items.map((item) => ({ ...item, id: `${item.id}-copy-${index}` })),
          })),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ trips: [copy, ...state.trips], activeTripId: copy.id }));
        return copy;
      },

      setActiveTrip: (tripId) => set({ activeTripId: tripId }),

      addItem: (tripId, dayId, item) =>
        set((state) => ({ trips: mapTrip(state.trips, tripId, (trip) => addItemToDay(trip, dayId, item)) })),

      removeItem: (tripId, itemId) =>
        set((state) => ({ trips: mapTrip(state.trips, tripId, (trip) => removeItem(trip, itemId)) })),

      reorderItem: (tripId, dayId, itemId, toIndex) =>
        set((state) => ({
          trips: mapTrip(state.trips, tripId, (trip) => reorderWithinDay(trip, dayId, itemId, toIndex)),
        })),

      moveItemToDay: (tripId, fromDayId, itemId, toDayId, toIndex) =>
        set((state) => ({
          trips: mapTrip(state.trips, tripId, (trip) =>
            moveItemBetweenDays(trip, fromDayId, itemId, toDayId, toIndex),
          ),
        })),

      duplicateItem: (tripId, dayId, itemId) =>
        set((state) => ({
          trips: mapTrip(state.trips, tripId, (trip) => duplicateItemWithinDay(trip, dayId, itemId)),
        })),

      moveActiveItem: (fromDayId, itemId, toDayId, toIndex) => {
        const tripId = get().activeTripId;
        if (!tripId) return;
        get().moveItemToDay(tripId, fromDayId, itemId, toDayId, toIndex);
      },

      patchItem: (tripId, dayId, itemId, patch) =>
        set((state) => ({
          trips: mapTrip(state.trips, tripId, (trip) => updateItem(trip, dayId, itemId, patch)),
        })),

      clearDayItems: (tripId, dayId) =>
        set((state) => ({ trips: mapTrip(state.trips, tripId, (trip) => clearDay(trip, dayId)) })),

      setDayNote: (tripId, dayId, note) =>
        set((state) => ({ trips: mapTrip(state.trips, tripId, (trip) => setDayNote(trip, dayId, note)) })),

      dismissRescheduleWarning: () => set({ lastRescheduleWarning: null }),

      clearAll: () => set({ trips: [], activeTripId: null, lastRescheduleWarning: null }),
    }),
    {
      name: 'meridian.trips.v1',
      storage: createJSONStorage(() => localStorage),
      // Manual hydration keeps server and first client render identical.
      skipHydration: true,
      /*
       * MIGRATION
       * ---------
       * Version 0 stored no origin, because Singapore was the only place a trip
       * could start from. Every such trip was in fact made from Singapore, so
       * the migration stamps `singapore` rather than leaving the field empty —
       * an empty origin would show "出发地 —" on an itinerary that is otherwise
       * perfectly readable.
       *
       * Nothing else changes: the days, the items and the dates are untouched,
       * and a trip that already has an origin keeps it.
       */
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as { trips?: Trip[]; activeTripId?: string | null } | undefined;
        if (!state?.trips || version >= 1) return persisted as never;
        return {
          ...state,
          trips: state.trips.map((trip) => ({ ...trip, originCityId: trip.originCityId ?? 'singapore' })),
        } as never;
      },
      partialize: (state) => ({
        trips: state.trips,
        activeTripId: state.activeTripId,
        hydrated: false,
        lastRescheduleWarning: null,
      }),
    },
  ),
);

/** Rehydrate once, on the client. Call from a top-level client component. */
export async function hydrateTripStore() {
  try {
    await useTripStore.persist.rehydrate();

    /*
     * Belt and braces on the migration.
     *
     * zustand runs `migrate` only when the stored version is older than the
     * configured one, and a payload written before versioning existed has no
     * version field at all. This second pass catches any trip that still has no
     * origin — whatever the reason — so the UI never has to render a trip
     * without one.
     */
    const { trips } = useTripStore.getState();
    if (trips.some((trip) => !trip.originCityId)) {
      useTripStore.setState({
        trips: trips.map((trip) => (trip.originCityId ? trip : { ...trip, originCityId: 'singapore' })),
      });
    }
  } catch {
    // Private browsing / storage disabled: the app still works, just without
    // persistence across refreshes.
  } finally {
    useTripStore.getState().setHydrated(true);
  }
}

export function selectActiveTrip(state: TripStoreState): Trip | null {
  if (!state.activeTripId) return null;
  return state.trips.find((t) => t.id === state.activeTripId) ?? null;
}

export function useActiveTrip(): Trip | null {
  return useTripStore(selectActiveTrip);
}

export function useTripForDestination(destinationId: string): Trip | null {
  const activeTripId = useTripStore((s) => s.activeTripId);
  const trips = useTripStore((s) => s.trips);
  const active = trips.find((t) => t.id === activeTripId);
  if (active && active.destinationId === destinationId) return active;
  const mostRecent = trips
    .filter((t) => t.destinationId === destinationId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return mostRecent ?? null;
}
