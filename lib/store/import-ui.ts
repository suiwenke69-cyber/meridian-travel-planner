'use client';

import { create } from 'zustand';

/**
 * Where the Xiaohongshu import flow is, and what the map should draw while it is
 * there.
 *
 * This is session state and is deliberately NOT persisted. A half-finished
 * import that reappeared after a refresh would look like data loss ("did my
 * screenshots go through?") when it is really just a form nobody submitted.
 *
 * It is a separate store from `ui-store` for one reason: the import flow is a
 * mode, and the MAP has to read it. Putting it in the persisted UI store would
 * mean adding migrate-able fields for something that must never survive a reload.
 */

export type ImportStep = 'input' | 'processing' | 'review' | 'done';

/** DO's scope: Meridian's whole catalogue, or just what this traveller kept. */
export type PlaceScope = 'all' | 'saved';

/**
 * What a click on the map currently means.
 *
 * One field rather than three booleans, because "picking a location" is a mode
 * and two modes being active at once is a bug waiting to happen. Tagged with
 * what is being placed, so the map click handler does not have to guess.
 */
export type PickTarget =
  | { kind: 'candidate'; candidateId: string }
  | { kind: 'image'; imageId: string }
  | { kind: 'created'; candidateId: string }
  | null;

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
  hoveredCandidateId: string | null;
  /** Set when the map should highlight a place the traveller just kept. */
  justSavedPlaceIds: string[];
  /** DO scope, shared with the map so the markers match the list. */
  placeScope: PlaceScope;

  /**
   * "Point at the map to place this" mode (§19).
   *
   * A created place needs a location, and the only honest way to get one is to
   * let the traveller point at it. There is no geocoder in a static build and
   * inferring a coordinate from a photograph would be worse than asking.
   */
  picking: PickTarget;
  pickedLocation: { lat: number; lng: number } | null;

  /** The image picker is open for this candidate. */
  assigningFor: string | null;
  /** The "what is this picture?" dialog is open for this image. */
  questioningImage: string | null;

  openImport: () => void;
  closeImport: () => void;
  setStep: (step: ImportStep, importId?: string | null) => void;
  setPreviewImport: (importId: string | null) => void;
  setHoveredCandidate: (id: string | null) => void;
  flagJustSaved: (placeIds: string[]) => void;
  setPlaceScope: (scope: PlaceScope) => void;

  startPicking: (target: NonNullable<PickTarget>) => void;
  cancelPicking: () => void;
  setPickedLocation: (value: { lat: number; lng: number } | null) => void;

  openAssign: (candidateId: string) => void;
  closeAssign: () => void;
  openQuestion: (imageId: string) => void;
  closeQuestion: () => void;
}

export const useImportUiStore = create<ImportUiState>()((set) => ({
  open: false,
  step: 'input',
  importId: null,
  previewImportId: null,
  hoveredCandidateId: null,
  justSavedPlaceIds: [],
  placeScope: 'all',
  picking: null,
  pickedLocation: null,
  assigningFor: null,
  questioningImage: null,

  openImport: () =>
    set({
      open: true,
      step: 'input',
      importId: null,
      previewImportId: null,
      picking: null,
      pickedLocation: null,
      assigningFor: null,
      questioningImage: null,
    }),
  closeImport: () =>
    set({
      open: false,
      step: 'input',
      importId: null,
      previewImportId: null,
      hoveredCandidateId: null,
      picking: null,
      pickedLocation: null,
      assigningFor: null,
      questioningImage: null,
    }),
  setStep: (step, importId) =>
    set((state) => ({
      step,
      importId: importId === undefined ? state.importId : importId,
      // Reviewing implies the map should show this import's places.
      previewImportId: step === 'review' ? (importId === undefined ? state.importId : importId) : state.previewImportId,
    })),
  setPreviewImport: (importId) => set({ previewImportId: importId }),
  setHoveredCandidate: (id) => set({ hoveredCandidateId: id }),
  flagJustSaved: (placeIds) => set({ justSavedPlaceIds: placeIds }),
  setPlaceScope: (scope) => set({ placeScope: scope }),

  startPicking: (target) => set({ picking: target, pickedLocation: null }),
  cancelPicking: () => set({ picking: null, pickedLocation: null }),
  setPickedLocation: (value) => set({ pickedLocation: value }),

  openAssign: (candidateId) => set({ assigningFor: candidateId }),
  closeAssign: () => set({ assigningFor: null }),
  openQuestion: (imageId) => set({ questioningImage: imageId }),
  closeQuestion: () => set({ questioningImage: null }),
}));
