'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_ORIGIN_CITY_ID, getOriginCity } from '../data/origins';

/**
 * The traveller's departure city.
 *
 * A SEPARATE STORE, ON PURPOSE
 * ----------------------------
 * This is the one piece of state that most obviously belongs to a *person*
 * rather than to a trip or a screen: "I live in Guangzhou" is true across every
 * destination and every visit. Keeping it in its own store with its own storage
 * key means that when accounts arrive, this file is replaced by a profile read
 * and nothing else in the product changes.
 *
 * Persistence is local and requires no account, which is what the brief asked
 * for. It is written so that swapping the storage for a server-backed one is a
 * change to this file alone.
 */

export interface OriginStoreState {
  /** id of the selected `OriginCity`. Always a real city — never a raw string. */
  originCityId: string;
  hydrated: boolean;
  /** True once the traveller has chosen an origin themselves. */
  userChosen: boolean;

  setOrigin: (originCityId: string) => void;
  setHydrated: (value: boolean) => void;
  resetOrigin: () => void;
}

export const useOriginStore = create<OriginStoreState>()(
  persist(
    (set) => ({
      originCityId: DEFAULT_ORIGIN_CITY_ID,
      hydrated: false,
      userChosen: false,

      setOrigin: (originCityId) => {
        /*
         * Guard against an unknown id reaching the store. A stale persisted
         * value, or a city removed from the dataset, would otherwise leave the
         * whole map without an origin marker and nothing explaining why.
         */
        const city = getOriginCity(originCityId);
        if (!city || !city.enabled) return;
        set({ originCityId: city.id, userChosen: true });
      },

      setHydrated: (value) => set({ hydrated: value }),

      resetOrigin: () => set({ originCityId: DEFAULT_ORIGIN_CITY_ID, userChosen: false }),
    }),
    {
      name: 'meridian.origin.v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ originCityId: state.originCityId, userChosen: state.userChosen }),
    },
  ),
);

export async function hydrateOriginStore() {
  try {
    await useOriginStore.persist.rehydrate();
    // Re-validate after hydration: the stored id may no longer exist.
    const { originCityId, setOrigin } = useOriginStore.getState();
    if (!getOriginCity(originCityId)) {
      useOriginStore.setState({ originCityId: DEFAULT_ORIGIN_CITY_ID });
    } else {
      setOrigin(originCityId);
    }
  } catch {
    // Storage unavailable — the default origin is still usable.
  }
}
