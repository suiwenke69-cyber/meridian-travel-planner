'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Locale, MarkerLayer } from '../types';
import { DEFAULT_LOCALE } from '../types';
import { defaultLayerVisibility } from '../layers';

/**
 * Ephemeral planning UI state (selection, hover, focus requests).
 *
 * Only the user's *preferences* are persisted (which layers they like on, the
 * basemap). Selection and focus are session state, so a refresh never lands the
 * user on a random selected marker.
 */

/**
 * The destination experience is a progression, not a set of tools:
 * understand the place → decide where to stay → decide what to do → arrange it.
 * The tab names are the user's verbs, not the system's nouns.
 */
export type PanelTab = 'explore' | 'stay' | 'do' | 'plan';

/** Category filter inside DO. `highlights` is the curated default. */
export type DoCategory = 'highlights' | 'beach' | 'nature' | 'culture' | 'food' | 'nightlife' | 'water';
/**
 * Which half of EXPLORE is on screen. This lives in the store rather than in
 * the panel because the MAP has to agree with it: showing all twenty-two travel
 * zones at once was the single biggest reason the island map read as busy.
 */
export type ExploreScope = 'stay' | 'daytrip';
export type MobileSheet = 'peek' | 'half' | 'full';

export interface FocusRequest {
  key: number;
  lat: number;
  lng: number;
  zoom?: number;
}

export interface FitRequest {
  key: number;
  points: Array<{ lat: number; lng: number }>;
  maxZoom?: number;
}

export interface UiStoreState {
  /**
   * Product language. Simplified Chinese is the default.
   *
   * Lives here rather than in a cookie because the site is statically exported
   * and must not read request state. Server and first client render both use the
   * default; a stored preference is applied after rehydration.
   */
  locale: Locale;
  visibleLayers: Record<MarkerLayer, boolean>;
  showAreas: boolean;
  showRoute: boolean;

  /** Currently open day in the planner. */
  selectedDayId: string | null;
  /** Itinerary row ↔ marker sync. */
  selectedItemId: string | null;
  hoveredItemId: string | null;
  /** A hotel/place/airport whose detail card is open. */
  selectedEntityId: string | null;
  selectedAreaId: string | null;
  /** Area tapped in the "where to stay" tab. */
  inspectedAreaId: string | null;
  panelTab: PanelTab;
  mobileSheet: MobileSheet;

  /** Card ↔ marker synchronisation. */
  hoveredEntityId: string | null;
  /** Hovered or selected transport leg in the itinerary. */
  selectedLegId: string | null;
  /** DO category filter. */
  doCategory: DoCategory;
  /** EXPLORE segmented control — shared with the map so zones match the list. */
  exploreScope: ExploreScope;

  focusRequest: FocusRequest | null;
  fitRequest: FitRequest | null;

  setLocale: (locale: Locale) => void;
  toggleLayer: (layer: MarkerLayer) => void;
  setLayer: (layer: MarkerLayer, value: boolean) => void;
  setLayers: (layers: MarkerLayer[], value: boolean) => void;
  showOnlyGroup: (layers: MarkerLayer[]) => void;
  resetLayers: () => void;

  setShowAreas: (value: boolean) => void;
  setShowRoute: (value: boolean) => void;

  selectDay: (dayId: string | null) => void;
  selectItem: (itemId: string | null) => void;
  setHoveredItem: (itemId: string | null) => void;
  selectEntity: (entityId: string | null) => void;
  selectArea: (areaId: string | null) => void;
  setPanelTab: (tab: PanelTab) => void;
  setMobileSheet: (sheet: MobileSheet) => void;
  setHoveredEntity: (id: string | null) => void;
  selectLeg: (id: string | null) => void;
  setDoCategory: (category: DoCategory) => void;
  setExploreScope: (scope: ExploreScope) => void;

  requestFocus: (lat: number, lng: number, zoom?: number) => void;
  requestFit: (points: Array<{ lat: number; lng: number }>, maxZoom?: number) => void;

  resetSelection: () => void;
}

export const useUiStore = create<UiStoreState>()(
  persist(
    (set, get) => ({
      locale: DEFAULT_LOCALE,
      visibleLayers: defaultLayerVisibility(),
      showAreas: true,
      showRoute: true,

      selectedDayId: null,
      selectedItemId: null,
      hoveredItemId: null,
      selectedEntityId: null,
      selectedAreaId: null,
      inspectedAreaId: null,
      panelTab: 'explore',
      mobileSheet: 'half',
      hoveredEntityId: null,
      selectedLegId: null,
      doCategory: 'highlights',
      exploreScope: 'stay',

      focusRequest: null,
      fitRequest: null,

      setLocale: (locale) => set({ locale }),

      toggleLayer: (layer) =>
        set((state) => ({ visibleLayers: { ...state.visibleLayers, [layer]: !state.visibleLayers[layer] } })),

      setLayer: (layer, value) =>
        set((state) => ({ visibleLayers: { ...state.visibleLayers, [layer]: value } })),

      setLayers: (layers, value) =>
        set((state) => {
          const next = { ...state.visibleLayers };
          for (const layer of layers) next[layer] = value;
          return { visibleLayers: next };
        }),

      showOnlyGroup: (layers) =>
        set(() => {
          const next = defaultLayerVisibility();
          for (const key of Object.keys(next) as MarkerLayer[]) next[key] = layers.includes(key);
          return { visibleLayers: next };
        }),

      resetLayers: () => set({ visibleLayers: defaultLayerVisibility() }),

      setShowAreas: (value) => set({ showAreas: value }),
      setShowRoute: (value) => set({ showRoute: value }),

      selectDay: (dayId) =>
        set((state) => ({
          selectedDayId: dayId,
          selectedItemId: null,
          // Selecting a day is a map action too: keep the entity card, drop stale hover.
          hoveredItemId: null,
          selectedEntityId: state.selectedEntityId,
        })),

      selectItem: (itemId) =>
        set({ selectedItemId: itemId, selectedEntityId: itemId ? null : get().selectedEntityId }),

      setHoveredItem: (itemId) => set({ hoveredItemId: itemId }),

      selectEntity: (entityId) => set({ selectedEntityId: entityId }),

      selectArea: (areaId) => set({ selectedAreaId: areaId, inspectedAreaId: areaId }),

      setPanelTab: (tab) =>
        set((state) => ({
          panelTab: tab,
          /*
           * Moving between the four steps dismisses the open detail card.
           * Leaving a hotel's card floating over the DO list — or over the
           * itinerary you are trying to read — reads as a stale panel, not as
           * context. Re-selecting the tab you are already on is not a move, so
           * the card a card click just opened survives it.
           */
          selectedEntityId: tab === state.panelTab ? state.selectedEntityId : null,
        })),

      setMobileSheet: (sheet) => set({ mobileSheet: sheet }),
      setHoveredEntity: (id) => set({ hoveredEntityId: id }),
      selectLeg: (id) => set({ selectedLegId: id }),
      setDoCategory: (category) => set({ doCategory: category }),
      setExploreScope: (scope) => set({ exploreScope: scope }),

      requestFocus: (lat, lng, zoom) =>
        set((state) => ({ focusRequest: { key: (state.focusRequest?.key ?? 0) + 1, lat, lng, zoom } })),

      requestFit: (points, maxZoom) =>
        set((state) => ({ fitRequest: { key: (state.fitRequest?.key ?? 0) + 1, points, maxZoom } })),

      resetSelection: () =>
        set({
          selectedItemId: null,
          hoveredItemId: null,
          selectedEntityId: null,
          selectedAreaId: null,
          inspectedAreaId: null,
          hoveredEntityId: null,
          selectedLegId: null,
        }),
    }),
    {
      name: 'meridian.ui.v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        locale: state.locale,
        visibleLayers: state.visibleLayers,
        showAreas: state.showAreas,
        showRoute: state.showRoute,
      }),
    },
  ),
);

export async function hydrateUiStore() {
  try {
    await useUiStore.persist.rehydrate();
  } catch {
    // Storage unavailable — fall back to the in-memory defaults.
  }
}
