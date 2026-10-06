'use client';

import { create } from 'zustand';

/**
 * Where the import flow is, and what the map should draw while it is there.
 *
 * This is session state and is deliberately NOT persisted. A half-finished
 * import that reappeared after a refresh would look like data loss ("did my
 * paste go through?") when it is really just a form nobody submitted. The paste
 * itself lives in the panel's own state and in the import record once started.
 *
 * It is a separate store from `ui-store` for one reason: the import flow is a
 * mode, and the map has to read it. Putting it in the persisted UI store would
 * mean adding migrate-able fields for something that must never survive a
 * reload.
 */

export type ImportStep = 'input' | 'processing' | 'review' | 'done';

/** DO's scope: Meridian's whole catalogue, or just what this traveller kept. */
export type PlaceScope = 'all' | 'saved';

export interface ImportUiState {
  /** The import panel has taken over the destination side panel. */
  open: boolean;
  step: ImportStep;
  /** The import being reviewed or reported on. */
  importId: string | null;
  /**
   * The import whose candidates the map draws.
   *
   * Kept separate from `importId` so the reviewed markers stay on the map for
   * one beat after saving — the "they are on my map now" moment.
   */
  previewImportId: string | null;
  /** Card ↔ marker synchronisation inside the review list. */
  hoveredMentionId: string | null;
  /** Set when the map should highlight a place the traveller just kept. */
  justSavedPlaceIds: string[];
  /** DO scope, shared with the map so the markers match the list. */
  placeScope: PlaceScope;

  /**
   * "Point at the map to place this" mode.
   *
   * A created place needs a location, and the only honest way to get one is to
   * let the traveller point at it. There is no geocoder in a static build and
   * inventing coordinates for a place nobody can find would be worse than
   * asking.
   */
  picking: boolean;
  pickedLocation: { lat: number; lng: number } | null;
  setPicking: (value: boolean) => void;
  setPickedLocation: (value: { lat: number; lng: number } | null) => void;

  openImport: () => void;
  closeImport: () => void;
  setStep: (step: ImportStep, importId?: string | null) => void;
  setPreviewImport: (importId: string | null) => void;
  setHoveredMention: (id: string | null) => void;
  flagJustSaved: (placeIds: string[]) => void;
  setPlaceScope: (scope: PlaceScope) => void;
}

export const useImportUiStore = create<ImportUiState>()((set) => ({
  open: false,
  step: 'input',
  importId: null,
  previewImportId: null,
  hoveredMentionId: null,
  justSavedPlaceIds: [],
  placeScope: 'all',
  picking: false,
  pickedLocation: null,

  openImport: () =>
    set({ open: true, step: 'input', importId: null, previewImportId: null, picking: false, pickedLocation: null }),
  closeImport: () =>
    set({
      open: false,
      step: 'input',
      importId: null,
      previewImportId: null,
      hoveredMentionId: null,
      picking: false,
      pickedLocation: null,
    }),
  setStep: (step, importId) =>
    set((state) => ({
      step,
      importId: importId === undefined ? state.importId : importId,
      // Reviewing implies the map should show this import's places.
      previewImportId: step === 'review' ? (importId === undefined ? state.importId : importId) : state.previewImportId,
    })),
  setPreviewImport: (importId) => set({ previewImportId: importId }),
  setHoveredMention: (id) => set({ hoveredMentionId: id }),
  flagJustSaved: (placeIds) => set({ justSavedPlaceIds: placeIds }),
  setPlaceScope: (scope) => set({ placeScope: scope }),
  setPicking: (value) => set(value ? { picking: true, pickedLocation: null } : { picking: false }),
  setPickedLocation: (value) => set({ pickedLocation: value }),
}));
