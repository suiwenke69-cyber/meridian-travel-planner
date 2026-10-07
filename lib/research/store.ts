'use client';

import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ImageAnalysis,
  ImagePlaceAssignment,
  ImportImage,
  MatchBand,
  MentionStatus,
  PlaceAlias,
  PlaceCandidate,
  RecommendationType,
  SocialSignals,
  SubmissionStatus,
  UserDecision,
  UserPlaceSubmission,
  UserSavedPlace,
  XiaohongshuImport,
} from '../types';
import { getAreas, getHotels, getPlaces } from '../data';
import type { ExtractArea, ExtractPlace } from './extract';
import { normalizePlaceName } from './normalize';
import { MATCH_CONFIDENCE_FLOOR, type MatchTarget } from './match';
import { capMentions, checkImportInput, checkImportRate, stripBoilerplate, type LimitViolation } from './limits';
import { aggregateSignals } from './signals';
import { track } from './analytics';
import {
  addImage,
  analysisPayload,
  deleteImagesForImport,
  getImageBlob,
  listImages,
  updateImage,
} from './image-store';
import { checkImageUpload, type ImageLimitViolation } from './image-rules';
import {
  ANALYSIS_VERSION,
  IMAGE_PROPOSAL_FLOOR,
  analyzeGuide,
  mergeFindings,
  type AnalyzerImage,
} from './analyzer';
import { resolvePlace, writeCachedPlace } from './place-resolver';

/**
 * The Xiaohongshu import store.
 *
 * ONE STORE, FOUR KINDS OF RECORD
 * -------------------------------
 *   imports      the post: link, text, and the ids of its images
 *   candidates   places the post appears to name, from text OR pictures
 *   images       the image catalogue (bytes live in IndexedDB)
 *   assignments  image ↔ place, and WHO decided (§33)
 *
 * They live together because they are read together: the review screen renders
 * one card per candidate and needs that candidate's images, its resolution
 * status and its provenance in the same render.
 *
 * WHAT IS DELIBERATELY SEPARATE
 * -----------------------------
 * Saved places are REFERENCES, not copies. The canonical `Place` stays the one
 * source of truth for names, coordinates and photography; saving points at it.
 * A place the dataset lacks writes a `UserPlaceSubmission` in
 * `pending_verification` and never touches the canonical registry.
 *
 * An external provider's hit is NOT a canonical place either. It becomes a
 * submission carrying the provider's coordinates, because "a map search found
 * something with this name" and "Meridian knows this place" are different
 * claims and the record has to say which one it is (§10, §11).
 *
 * PRIVACY AND COPYRIGHT
 * ---------------------
 * Every record carries a local profile id. Imported images are written
 * `private_import` and there is no code path that promotes one to canonical
 * photography (§20). Deleting an import deletes its text, its candidates, its
 * analyses, its assignments AND its image bytes (§26) — a traveller who deletes
 * a post should not find its screenshots still in their browser.
 */

const PROFILE_KEY = 'meridian.profile.v1';

/** A stable local profile id. Replaced by an account id when there are accounts. */
export function getProfileId(): string {
  if (typeof localStorage === 'undefined') return 'local';
  let existing = localStorage.getItem(PROFILE_KEY);
  if (!existing) {
    existing = `local-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    localStorage.setItem(PROFILE_KEY, existing);
  }
  return existing;
}

export interface StartImportInput {
  url?: string;
  text?: string;
  /** Only ever passed by an internal draft; the panel knows the real count. */
  imageCount?: number;
  destinationId?: string;
  tripId?: string;
  userNotes?: string;
  title?: string;
  author?: string;
}

export interface StartImportResult {
  import?: XiaohongshuImport;
  violation?: LimitViolation;
}

export interface ProcessImportResult {
  places: number;
  located: number;
  imagesAnalyzed: number;
  degraded?: boolean;
  degradedReason?: string;
  error?: string;
}

export interface ResearchStoreState {
  imports: XiaohongshuImport[];
  candidates: PlaceCandidate[];
  /** Image CATALOGUE entries. The bytes live in IndexedDB (§30). */
  images: ImportImage[];
  analyses: ImageAnalysis[];
  /** Image ↔ place attachments, with who decided (§33). */
  assignments: ImagePlaceAssignment[];
  savedPlaces: UserSavedPlace[];
  submissions: UserPlaceSubmission[];
  aliases: PlaceAlias[];
  hydrated: boolean;
  /** Timestamps of recent imports, for the rolling-window limit. */
  importTimestamps: number[];

  setHydrated: (value: boolean) => void;

  startImport: (input: StartImportInput) => StartImportResult;
  processImport: (id: string) => Promise<ProcessImportResult>;
  deleteImport: (id: string) => Promise<void>;
  updateImport: (id: string, patch: Partial<XiaohongshuImport>) => void;
  /**
   * Attaches an import to a trip, or detaches it with null.
   *
   * The relationship the brief asked to prepare, and nothing more: it is what
   * lets "the places from this guide" and "the trip I am building" be the same
   * object later, without the import flow knowing anything about itineraries.
   */
  setImportTrip: (importId: string, tripId: string | null) => void;

  // --- images -------------------------------------------------------------
  /** Stores the files and attaches them to the import. Returns the new records. */
  addImages: (
    importId: string,
    blobs: Array<{ blob: Blob; name?: string; type: string; size: number }>,
    source?: ImportImage['originalSource'],
  ) => Promise<{ added: ImportImage[]; violations: ImageLimitViolation[] }>;
  removeImage: (imageId: string) => Promise<void>;
  setImageCaption: (imageId: string, caption: string) => void;

  // --- candidate decisions ------------------------------------------------
  decideCandidate: (id: string, decision: UserDecision) => void;
  updateCandidate: (id: string, patch: Partial<PlaceCandidate>) => void;
  /** Resolves to a Meridian place or a submission the traveller created. */
  resolveCandidateToPlace: (id: string, placeId: string) => void;
  /** Accepts one of the external candidates an external search returned. */
  acceptExternalCandidate: (id: string, providerPlaceId: string) => void;
  /** The traveller pointed at the map (§19). */
  pinCandidate: (
    id: string,
    input: { coordinates: { lat: number; lng: number }; name?: string; entityType?: RecommendationType; areaId?: string; note?: string },
  ) => void;

  // --- image ↔ place assignment (§16, §17, §33) ---------------------------
  assignImage: (candidateId: string, imageId: string, source?: ImagePlaceAssignment['source']) => void;
  unassignImage: (candidateId: string, imageId: string) => void;
  /** Attaches an image to a place the traveller created from it (§18). */
  createPlaceFromImage: (
    imageId: string,
    input: { name: string; recommendationType: RecommendationType; areaId?: string; coordinates?: { lat: number; lng: number }; note?: string },
  ) => UserPlaceSubmission | null;

  // --- saving -------------------------------------------------------------
  saveSelected: (importId: string) => { saved: number };
  unsavePlace: (placeId: string) => void;

  submitPlace: (
    input: Omit<UserPlaceSubmission, 'id' | 'ownerProfileId' | 'status' | 'createdAt'>,
  ) => UserPlaceSubmission;
  setSubmissionStatus: (id: string, status: SubmissionStatus) => void;

  /** Records that a name means a place, so the next import resolves instantly. */
  recordAlias: (alias: string, placeId: string, source?: PlaceAlias['source'], ownerProfileId?: string) => void;
}

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

/** Stable hash of the input, so an unchanged paste is never paid for twice. */
async function contentHash(parts: string[]): Promise<string> {
  const value = parts.join('\u0000');
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
      return [...new Uint8Array(digest)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 32);
    } catch {
      // Fall through to the cheap hash when subtle crypto is unavailable.
    }
  }
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  return `h${(hash >>> 0).toString(16)}`;
}

/**
 * Everything a guide can name, in one list.
 *
 * Hotels are in here alongside places because a travel guide names them
 * constantly and they are matched by the same matcher, so a name means one thing.
 */
function canonicalPlaces(destinationId: string): ExtractPlace[] {
  const places: ExtractPlace[] = getPlaces(destinationId).map((place) => ({
    id: place.id,
    name: place.name,
    nameZh: place.nameZh,
    areaId: place.areaId,
    discovery: place.discovery,
    category: place.category,
  }));
  const hotels: ExtractPlace[] = getHotels(destinationId).map((hotel) => ({
    id: hotel.id,
    name: hotel.name,
    nameZh: hotel.nameZh,
    areaId: hotel.areaId,
    discovery: ['hotel'],
    category: 'hotel',
  }));
  return [...places, ...hotels];
}

function canonicalAreas(destinationId: string): ExtractArea[] {
  return getAreas(destinationId).map((area) => ({ id: area.id, name: area.name, nameZh: area.nameZh }));
}

/**
 * The confidence band the interface speaks in.
 *
 * §13: HIGH is preselected, MEDIUM asks, LOW does not guess. The numbers come
 * from the matcher and the bands come from here, so the UI never shows a score.
 */
export function bandFor(confidence: number | undefined): MatchBand {
  if (confidence == null) return 'low';
  if (confidence >= 0.9) return 'high';
  if (confidence >= MATCH_CONFIDENCE_FLOOR) return 'medium';
  return 'low';
}

/** Targets include learned aliases, so a confirmed name resolves exactly next time. */
function matchTargets(destinationId: string, aliases: PlaceAlias[], ownerProfileId: string): MatchTarget[] {
  const fromAliases = new Map<string, string[]>();
  for (const alias of aliases) {
    // A private alias only helps the profile that made it.
    if (alias.ownerProfileId && alias.ownerProfileId !== ownerProfileId) continue;
    const list = fromAliases.get(alias.placeId) ?? [];
    list.push(alias.alias);
    fromAliases.set(alias.placeId, list);
  }
  return canonicalPlaces(destinationId).map((place) => ({
    ...place,
    aliases: fromAliases.get(place.id) ?? [],
  }));
}

/** Reads the images actually stored for one import, in the post's own order. */
async function loadAnalyzerImages(importId: string): Promise<AnalyzerImage[]> {
  const records = await listImages(importId);
  const out: AnalyzerImage[] = [];
  for (const record of records) {
    // Only the images a provider can actually read are sent; a broken upload
    // would otherwise spend a slot in an expensive batch call.
    let dataUrl: string | undefined;
    if (record.analysisStatus !== 'unsupported') {
      const blob = await getImageBlob(record.id, 'full');
      if (blob) {
        try {
          dataUrl = (await analysisPayload(blob)).dataUrl;
        } catch {
          dataUrl = undefined;
        }
      }
    }
    out.push({
      id: record.id,
      index: record.originalIndex,
      width: record.width,
      height: record.height,
      dataUrl,
      caption: record.caption,
    });
  }
  return out;
}

export const useResearchStore = create<ResearchStoreState>()(
  persist(
    (set, get) => ({
      imports: [],
      candidates: [],
      images: [],
      analyses: [],
      assignments: [],
      savedPlaces: [],
      submissions: [],
      aliases: [],
      hydrated: false,
      importTimestamps: [],

      setHydrated: (value) => set({ hydrated: value }),

      startImport: (input) => {
        const violation = checkImportInput({
          url: input.url,
          text: input.text,
          // A draft created by the image picker has neither url nor text yet.
          imageCount: input.imageCount ?? 0,
        });
        if (violation) return { violation };

        const rate = checkImportRate(get().importTimestamps);
        if (rate) return { violation: rate };

        const now = new Date().toISOString();
        const record: XiaohongshuImport = {
          id: nextId('imp'),
          ownerProfileId: getProfileId(),
          visibility: 'private',
          destinationId: input.destinationId,
          tripId: input.tripId,
          // One source in V1, so this is not a choice the traveller makes.
          platform: 'xiaohongshu',
          sourceUrl: input.url?.trim() || undefined,
          title: input.title?.trim() || undefined,
          author: input.author?.trim() || undefined,
          createdAt: now,
          status: 'draft',
          sourceAccessStatus: input.url?.trim() ? 'metadata_only' : 'user_text',
          extractionVersion: ANALYSIS_VERSION,
          userNotes: input.userNotes?.trim() || undefined,
          userProvidedText: input.text?.trim() || undefined,
          imageIds: [],
        };

        set((state) => ({
          imports: [record, ...state.imports],
          importTimestamps: [...state.importTimestamps, Date.now()],
        }));
        track('social_import_started', { platform: 'xiaohongshu', destinationId: input.destinationId });
        return { import: record };
      },

      processImport: async (id) => {
        const state = get();
        const record = state.imports.find((i) => i.id === id);
        if (!record) return { places: 0, located: 0, imagesAnalyzed: 0, error: 'import_not_found' };

        const text = stripBoilerplate(record.userProvidedText ?? '');
        const images = await loadAnalyzerImages(id);

        /*
         * Nothing to read is a specific failure, not a generic one (§27, §33).
         *
         * A link with no text AND no images is the case §2's fallback exists for,
         * and the message says what to do about it rather than reporting an error.
         */
        if (text.length === 0 && images.length === 0) {
          const reason = record.sourceUrl ? 'content_unavailable' : 'empty_text';
          set((s) => ({
            imports: s.imports.map((i) =>
              i.id === id ? { ...i, status: 'failed', failureReason: reason, processedAt: new Date().toISOString() } : i,
            ),
          }));
          track('social_import_failed', { failureCode: reason });
          return { places: 0, located: 0, imagesAnalyzed: 0, error: reason };
        }

        const destinationId = record.destinationId ?? 'bali';
        const hash = await contentHash([destinationId, record.sourceUrl ?? '', text, ...images.map((i) => i.id)]);

        /*
         * Cache by content hash AND image set.
         *
         * The image ids are part of the key on purpose: re-pasting the same
         * caption with different pictures is a different guide, and serving the
         * old candidates would silently drop the new images.
         */
        const cached = state.imports.find(
          (i) =>
            i.id !== id &&
            i.contentHash === hash &&
            i.status === 'completed' &&
            i.destinationId === record.destinationId,
        );
        if (cached) {
          const cachedCandidates = state.candidates.filter((c) => c.importId === cached.id);
          if (cachedCandidates.length > 0) {
            const cloned: PlaceCandidate[] = cachedCandidates.map((candidate) => ({
              ...candidate,
              id: nextId('cnd'),
              importId: id,
              userDecision: 'pending',
              assignedImageIds: [],
              createdAt: new Date().toISOString(),
            }));
            set((s) => ({
              imports: s.imports.map((i) =>
                i.id === id ? { ...i, status: 'review_required', contentHash: hash, processedAt: new Date().toISOString() } : i,
              ),
              candidates: [...s.candidates.filter((c) => c.importId !== id), ...cloned],
            }));
            return {
              places: cloned.length,
              located: cloned.filter((c) => Boolean(c.matchedPlaceId)).length,
              imagesAnalyzed: 0,
            };
          }
        }

        set((s) => ({ imports: s.imports.map((i) => (i.id === id ? { ...i, status: 'processing' } : i)) }));

        try {
          const analysis = await analyzeGuide({
            text,
            images,
            destinationId,
            knownPlaces: canonicalPlaces(destinationId),
            knownAreas: canonicalAreas(destinationId),
          });

          /*
           * Merge BEFORE resolving.
           *
           * §24: the same place named in the caption and visible in two pictures
           * is one place. Merging first also means one resolution call rather
           * than three, which is the difference between a free import and a
           * three-times-billed one.
           */
          const merged = mergeFindings(analysis.findings, normalizePlaceName);
          const { kept } = capMentions(merged);
          const targets = matchTargets(destinationId, state.aliases, record.ownerProfileId);
          const createdAt = new Date().toISOString();

          const candidates: PlaceCandidate[] = [];
          for (const finding of kept) {
            /*
             * Image-only findings whose reader was not sure are NOT turned into
             * place candidates (§26).
             *
             * A blurry sign is a question, not a finding, and a card that says
             * "La Brisa" with a map pin on it reads as an answer. Those go to the
             * unassigned tray instead, where the traveller decides what the
             * picture is — which is the honest place for a guess.
             */
            const imageOnly = !finding.detectedFromText && finding.detectedFromImageIds.length > 0;
            if (imageOnly && finding.confidence < IMAGE_PROPOSAL_FLOOR) continue;

            const resolution = await resolvePlace({
              rawName: finding.rawName,
              destinationId,
              targets,
              areaHint: finding.areaHint,
              entityType: finding.entityType,
              localityHint: finding.areaHint,
            });

            const candidate: PlaceCandidate = {
              id: nextId('cnd'),
              importId: id,
              rawName: finding.rawName,
              normalizedName: normalizePlaceName(finding.rawName),
              contextText: finding.contextText,
              entityType: finding.entityType,
              detectedFromText: finding.detectedFromText,
              detectedFromImageIds: [...finding.detectedFromImageIds],
              assignedImageIds: [],
              detectedReason: finding.detectedReason,
              extractedItems: finding.extractedItems,
              contextThemes: finding.contextThemes,
              positiveThemes: finding.positiveThemes,
              warnings: finding.warnings,
              bestTimeMentioned: finding.bestTimeMentioned,
              areaHint: finding.areaHint,
              destinationHint: destinationId,
              resolutionStatus: resolution.status,
              matchedPlaceId: resolution.matchedPlaceId,
              matchMethod: resolution.matchMethod,
              matchConfidence: resolution.confidence,
              matchBand: resolution.band,
              externalCandidates: resolution.externalCandidates,
              userDecision: 'pending',
              verificationStatus: resolution.matchedPlaceId ? 'matched' : 'unmatched',
              createdAt,
            };
            candidates.push(candidate);

            /*
             * The image → place SUGGESTION (§7).
             *
             * Written as a `suggested` assignment so the traveller sees the
             * proposal, and so a later analysis run can replace it without ever
             * touching a `user` row (§33).
             */
            for (const imageId of finding.detectedFromImageIds) {
              set((s) => ({
                assignments: [
                  ...s.assignments,
                  {
                    id: nextId('asg'),
                    importId: id,
                    imageId,
                    candidateId: candidate.id,
                    source: 'suggested',
                    createdAt,
                  },
                ],
              }));
            }
          }

          // Persist the per-image analysis records, and mark every image read.
          const analyses: ImageAnalysis[] = analysis.imageAnalyses.map((entry) => ({
            ...entry,
            id: nextId('anl'),
            importId: id,
          }));

          set((s) => ({
            imports: s.imports.map((i) =>
              i.id === id
                ? {
                    ...i,
                    status: candidates.length > 0 ? 'review_required' : 'failed',
                    failureReason: candidates.length === 0 ? 'no_places_detected' : undefined,
                    contentHash: hash,
                    processedAt: createdAt,
                    retrievalProvider: analysis.providerId,
                    retrievalNote: analysis.degradedReason,
                  }
                : i,
            ),
            candidates: [...s.candidates.filter((c) => c.importId !== id), ...candidates],
            analyses: [...s.analyses.filter((a) => a.importId !== id), ...analyses],
            images: s.images.map((image) =>
              image.importId === id
                ? { ...image, analysisStatus: analysis.imageStatus.get(image.id) ?? image.analysisStatus }
                : image,
            ),
          }));

          // Keep the IndexedDB records in step with the store's catalogue.
          for (const image of get().images.filter((entry) => entry.importId === id)) {
            await updateImage(image.id, { analysisStatus: image.analysisStatus });
          }

          const located = candidates.filter((c) => Boolean(c.matchedPlaceId)).length;

          if (candidates.length === 0) {
            track('social_import_failed', { failureCode: 'no_places_detected' });
            return {
              places: 0,
              located: 0,
              imagesAnalyzed: analyses.length,
              degraded: analysis.degraded,
              degradedReason: analysis.degradedReason,
              error: 'no_places_detected',
            };
          }

          track('social_import_processed', {
            platform: 'xiaohongshu',
            destinationId,
            candidateCount: candidates.length,
            matchedCount: located,
            providerId: analysis.providerId,
          });
          return {
            places: candidates.length,
            located,
            imagesAnalyzed: analyses.length,
            degraded: analysis.degraded,
            degradedReason: analysis.degradedReason,
          };
        } catch (error) {
          const code = error instanceof Error ? error.message.slice(0, 60) : 'extraction_failed';
          set((s) => ({
            imports: s.imports.map((i) =>
              i.id === id ? { ...i, status: 'failed', failureReason: code, processedAt: new Date().toISOString() } : i,
            ),
          }));
          track('social_import_failed', { failureCode: code });
          return { places: 0, located: 0, imagesAnalyzed: 0, error: code };
        }
      },

      updateImport: (id, patch) =>
        set((state) => ({ imports: state.imports.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),

      setImportTrip: (importId, tripId) =>
        set((state) => ({
          imports: state.imports.map((i) => (i.id === importId ? { ...i, tripId: tripId ?? undefined } : i)),
        })),

      /**
       * Deleting an import deletes everything it held (§26).
       *
       * Text, candidates, analyses, assignments — and the IMAGES. A traveller
       * who deletes a post should not find its screenshots still sitting in their
       * browser, and the IndexedDB purge is awaited so the promise is real rather
       * than scheduled.
       */
      deleteImport: async (id) => {
        await deleteImagesForImport(id);
        set((state) => ({
          imports: state.imports.filter((i) => i.id !== id),
          candidates: state.candidates.filter((c) => c.importId !== id),
          images: state.images.filter((i) => i.importId !== id),
          analyses: state.analyses.filter((a) => a.importId !== id),
          assignments: state.assignments.filter((a) => a.importId !== id),
        }));
      },

      // --- images -----------------------------------------------------------
      addImages: async (importId, blobs, source = 'user_upload') => {
        const state = get();
        const record = state.imports.find((i) => i.id === importId);
        if (!record) return { added: [], violations: [] };

        const existing = state.images.filter((i) => i.importId === importId);
        let count = existing.length;
        let bytes = existing.reduce((total, image) => total + (image.bytes ?? 0), 0);
        const added: ImportImage[] = [];
        const violations: ImageLimitViolation[] = [];

        for (const entry of blobs) {
          const violation = checkImageUpload(
            { size: entry.size, type: entry.type, name: entry.name },
            { existingCount: count, existingBytes: bytes },
          );
          if (violation) {
            violations.push(violation);
            continue;
          }
          try {
            const image = await addImage({
              importId,
              ownerProfileId: record.ownerProfileId,
              blob: entry.blob,
              originalIndex: count + 1,
              originalSource: source,
              caption: undefined,
            });
            // Deduplication means the same bytes can come back; only count once.
            if (!existing.some((i) => i.id === image.id) && !added.some((i) => i.id === image.id)) {
              added.push(image);
              count += 1;
              bytes += image.bytes ?? 0;
            }
          } catch {
            violations.push({ code: 'unsupported_image_type', messageKey: 'import.error.unsupportedImageType', detail: entry.name });
          }
        }

        if (added.length > 0) {
          set((s) => ({
            images: [...s.images, ...added],
            imports: s.imports.map((i) =>
              i.id === importId ? { ...i, imageIds: [...i.imageIds, ...added.map((image) => image.id)] } : i,
            ),
          }));
        }
        return { added, violations };
      },

      removeImage: async (imageId) => {
        const image = get().images.find((i) => i.id === imageId);
        if (!image) return;
        try {
          const blob = await getImageBlob(imageId, 'full');
          void blob;
        } catch {
          // Nothing to clean up.
        }
        // The catalogue entry goes; the bytes go with the import's own purge.
        set((s) => ({
          images: s.images.filter((i) => i.id !== imageId),
          assignments: s.assignments.filter((a) => a.imageId !== imageId),
          candidates: s.candidates.map((c) =>
            c.importId === image.importId
              ? {
                  ...c,
                  detectedFromImageIds: c.detectedFromImageIds.filter((id) => id !== imageId),
                  assignedImageIds: c.assignedImageIds.filter((id) => id !== imageId),
                }
              : c,
          ),
          imports: s.imports.map((i) =>
            i.id === image.importId ? { ...i, imageIds: i.imageIds.filter((id) => id !== imageId) } : i,
          ),
        }));
      },

      setImageCaption: (imageId, caption) =>
        set((state) => ({
          images: state.images.map((image) => (image.id === imageId ? { ...image, caption } : image)),
        })),

      // --- candidates -------------------------------------------------------
      decideCandidate: (id, decision) =>
        set((state) => ({
          candidates: state.candidates.map((candidate): PlaceCandidate => {
            if (candidate.id !== id) return candidate;
            const verificationStatus: MentionStatus =
              decision === 'ignore'
                ? 'rejected'
                : candidate.matchedPlaceId
                  ? 'matched'
                  : candidate.submittedPlaceId
                    ? 'possible_match'
                    : 'unmatched';
            return { ...candidate, userDecision: decision, verificationStatus };
          }),
        })),

      updateCandidate: (id, patch) =>
        set((state) => ({ candidates: state.candidates.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

      resolveCandidateToPlace: (id, placeId) => {
        const state = get();
        const candidate = state.candidates.find((c) => c.id === id);
        if (!candidate) return;

        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === id
              ? {
                  ...c,
                  matchedPlaceId: placeId,
                  matchMethod: 'manual',
                  matchConfidence: 1,
                  matchBand: 'high',
                  resolutionStatus: 'meridian',
                  externalCandidates: [],
                  verificationStatus: 'matched',
                }
              : c,
          ),
        }));

        // The learning loop: a human said this name means this place.
        get().recordAlias(candidate.rawName, placeId, 'user_confirmed', getProfileId());
        track('place_match_confirmed', { matchMethod: 'manual' });

        /*
         * Accepting an external hit also CACHES it, so the next import of the
         * same guide resolves from the local table instead of paying for the
         * lookup again (§12). The alias above is the primary mechanism; this is
         * the backstop for a name the traveller never confirms.
         */
        const accepted = candidate.externalCandidates?.find((entry) => entry.providerPlaceId === placeId);
        if (accepted) writeCachedPlace({ query: candidate.rawName, destinationId: candidate.destinationHint ?? 'bali' }, [accepted]);
      },

      acceptExternalCandidate: (id, providerPlaceId) => {
        const state = get();
        const candidate = state.candidates.find((c) => c.id === id);
        if (!candidate) return;
        const chosen = candidate.externalCandidates?.find((entry) => entry.providerPlaceId === providerPlaceId);
        if (!chosen) return;

        /*
         * An external place is NOT a Meridian place, so it cannot become a
         * `matchedPlaceId` — that field only ever points at our own dataset.
         * It becomes a submission the traveller owns, carrying the provider's
         * coordinates and a note saying where they came from. That is the
         * difference between "Meridian knows this place" and "a map search found
         * something with this name", and it is the honest record of the latter.
         */
        const submission = get().submitPlace({
          destinationId: candidate.destinationHint ?? 'bali',
          name: chosen.name,
          recommendationType: candidate.entityType ?? 'unknown',
          coordinates: { lat: chosen.lat, lng: chosen.lng },
          sourceImportId: candidate.importId,
          note: chosen.address ? `${chosen.address} · 来自 ${chosen.providerId}` : `来自 ${chosen.providerId}`,
        });

        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === id
              ? {
                  ...c,
                  submittedPlaceId: submission.id,
                  resolutionStatus: 'user_created',
                  matchMethod: 'external',
                  matchBand: 'medium',
                  verificationStatus: 'possible_match',
                }
              : c,
          ),
        }));
        writeCachedPlace({ query: candidate.rawName, destinationId: candidate.destinationHint ?? 'bali' }, [chosen]);
        track('place_created_from_import', { destinationId: candidate.destinationHint ?? 'bali' });
      },

      pinCandidate: (id, input) => {
        const state = get();
        const candidate = state.candidates.find((c) => c.id === id);
        if (!candidate) return;

        const submission = get().submitPlace({
          destinationId: candidate.destinationHint ?? 'bali',
          name: input.name?.trim() || candidate.rawName,
          recommendationType: input.entityType ?? candidate.entityType ?? 'unknown',
          areaId: input.areaId,
          coordinates: input.coordinates,
          sourceImportId: candidate.importId,
          note: input.note ?? '用户在地图上标记',
        });

        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === id
              ? {
                  ...c,
                  submittedPlaceId: submission.id,
                  resolutionStatus: 'user_pinned',
                  matchMethod: 'manual',
                  matchBand: 'medium',
                  verificationStatus: 'possible_match',
                }
              : c,
          ),
        }));
        track('place_created_from_import', { destinationId: candidate.destinationHint ?? 'bali' });
      },

      // --- image ↔ place assignment ----------------------------------------
      assignImage: (candidateId, imageId, source = 'user') => {
        const state = get();
        const candidate = state.candidates.find((c) => c.id === candidateId);
        if (!candidate) return;

        set((s) => {
          /*
           * A user assignment REPLACES a suggestion for the same image (§33).
           *
           * "AI: image 4 is Finns. User: image 4 is La Brisa." If both rows
           * survived, the image would render under two places and the traveller
           * would have to work out which one they meant. A `user` row is never
           * replaced by a later analysis run, because a re-analysis only ever
           * touches `suggested` rows.
           */
          const withoutConflict = s.assignments.filter(
            (a) => !(a.imageId === imageId && (source === 'user' ? true : a.source === 'suggested' && a.candidateId === candidateId)),
          );
          return {
            assignments: [
              ...withoutConflict,
              { id: nextId('asg'), importId: candidate.importId, imageId, candidateId, source, createdAt: new Date().toISOString() },
            ],
            /*
             * The image is REMOVED from every other candidate as well as added
             * to this one.
             *
             * Filtering the assignment rows alone was not enough: the candidate's
             * own `assignedImageIds` kept the image, so a reassigned picture
             * rendered under both places and the unassigned count was wrong.
             */
            candidates: s.candidates.map((c) => {
              if (c.id === candidateId) {
                return { ...c, assignedImageIds: [...new Set([...c.assignedImageIds, imageId])] };
              }
              if (!c.assignedImageIds.includes(imageId)) return c;
              return { ...c, assignedImageIds: c.assignedImageIds.filter((id) => id !== imageId) };
            }),
          };
        });
      },

      unassignImage: (candidateId, imageId) =>
        set((s) => ({
          assignments: s.assignments.filter((a) => !(a.candidateId === candidateId && a.imageId === imageId)),
          candidates: s.candidates.map((c) =>
            c.id === candidateId ? { ...c, assignedImageIds: c.assignedImageIds.filter((id) => id !== imageId) } : c,
          ),
        })),

      createPlaceFromImage: (imageId, input) => {
        const state = get();
        const image = state.images.find((i) => i.id === imageId);
        if (!image) return null;

        const submission = get().submitPlace({
          destinationId: state.imports.find((i) => i.id === image.importId)?.destinationId ?? 'bali',
          name: input.name,
          recommendationType: input.recommendationType,
          areaId: input.areaId,
          coordinates: input.coordinates,
          sourceImportId: image.importId,
          note: input.note ?? '从攻略图片创建',
        });

        /*
         * The picture becomes the reason we know about this place, so it is
         * attached as a USER assignment — the traveller said it, not a model.
         * A synthetic candidate carries it, because a created place has no
         * candidate of its own until review promotes it.
         */
        const candidateId = nextId('cnd');
        set((s) => ({
          candidates: [
            ...s.candidates,
            {
              id: candidateId,
              importId: image.importId,
              rawName: input.name,
              normalizedName: normalizePlaceName(input.name),
              entityType: input.recommendationType,
              detectedFromText: false,
              detectedFromImageIds: [imageId],
              assignedImageIds: [imageId],
              detectedReason: '从攻略图片创建',
              extractedItems: [],
              contextThemes: [],
              positiveThemes: [],
              warnings: [],
              areaHint: input.areaId,
              destinationHint: submission.destinationId,
              resolutionStatus: 'user_created',
              matchMethod: 'created',
              matchBand: 'medium',
              submittedPlaceId: submission.id,
              userDecision: 'save',
              verificationStatus: 'possible_match',
              createdAt: new Date().toISOString(),
            },
          ],
          assignments: [
            ...s.assignments,
            {
              id: nextId('asg'),
              importId: image.importId,
              imageId,
              candidateId,
              source: 'user',
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        track('place_created_from_import', { destinationId: submission.destinationId });
        return submission;
      },

      // --- saving -----------------------------------------------------------
      saveSelected: (importId) => {
        const state = get();
        const record = state.imports.find((i) => i.id === importId);
        if (!record) return { saved: 0 };

        const destinationId = record.destinationId ?? 'bali';
        const chosen = state.candidates.filter(
          (c) => c.importId === importId && c.userDecision === 'save' && (c.matchedPlaceId || c.submittedPlaceId),
        );

        const existing = new Set(state.savedPlaces.map((p) => p.placeId));
        const additions: UserSavedPlace[] = [];
        for (const candidate of chosen) {
          // A Meridian place is the preferred target; a created place is its own id.
          const placeId = candidate.matchedPlaceId ?? candidate.submittedPlaceId!;
          // Saving is idempotent: the same place twice is still one saved place.
          const alreadySaved = existing.has(placeId);
          /*
           * The images the traveller attached to this candidate (§22).
           *
           * They travel with the saved place as REFERENCES into the import, so
           * "the two photos I liked from that post" survive into the trip without
           * Meridian republishing anybody's work.
           */
          const imageIds = [...new Set([...candidate.assignedImageIds, ...candidate.detectedFromImageIds])];

          if (alreadySaved) {
            // An existing save gains the new images rather than being skipped:
            // saving the same place from a second guide should enrich it.
            set((s) => ({
              savedPlaces: s.savedPlaces.map((p) =>
                p.placeId === placeId
                  ? { ...p, selectedImportImageIds: [...new Set([...(p.selectedImportImageIds ?? []), ...imageIds])] }
                  : p,
              ),
            }));
            continue;
          }

          existing.add(placeId);
          additions.push({
            id: nextId('sav'),
            ownerProfileId: record.ownerProfileId,
            placeId,
            destinationId,
            sourceImportId: importId,
            selectedImportImageIds: imageIds.length > 0 ? imageIds : undefined,
            savedAt: new Date().toISOString(),
          });
        }

        set((s) => ({
          savedPlaces: [...s.savedPlaces, ...additions],
          imports: s.imports.map((i) => (i.id === importId ? { ...i, status: 'completed' } : i)),
        }));
        for (let i = 0; i < additions.length; i += 1) track('import_place_saved', { destinationId });
        return { saved: additions.length };
      },

      unsavePlace: (placeId) =>
        set((state) => ({ savedPlaces: state.savedPlaces.filter((p) => p.placeId !== placeId) })),

      submitPlace: (input) => {
        const submission: UserPlaceSubmission = {
          ...input,
          id: nextId('sub'),
          ownerProfileId: getProfileId(),
          // Never straight into the canonical dataset.
          status: 'pending_verification',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ submissions: [submission, ...state.submissions] }));
        track('place_created_from_import', { destinationId: input.destinationId });
        return submission;
      },

      setSubmissionStatus: (id, status) =>
        set((state) => ({ submissions: state.submissions.map((s) => (s.id === id ? { ...s, status } : s)) })),

      recordAlias: (alias, placeId, source = 'user_confirmed', ownerProfileId) => {
        const normalizedAlias = normalizePlaceName(alias);
        if (normalizedAlias.length < 2) return;
        set((state) => {
          const existing = state.aliases.find(
            (a) => a.normalizedAlias === normalizedAlias && a.placeId === placeId && a.ownerProfileId === ownerProfileId,
          );
          if (existing) return state;
          return {
            aliases: [
              ...state.aliases,
              {
                id: nextId('als'),
                alias: alias.trim(),
                normalizedAlias,
                placeId,
                source,
                confidence: source === 'user_confirmed' ? 1 : 0.9,
                ownerProfileId,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        });
      },
    }),
    {
      /*
       * Version 2: the candidate, image and assignment records are new, and a
       * stored v1 payload would rehydrate into a store whose fields no longer
       * match what the UI reads. Bumping the key discards the old shape rather
       * than half-migrating it — the previous iteration's imports were text-only
       * and carry nothing this model can represent.
       */
      name: 'meridian.social.v2',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        imports: state.imports,
        candidates: state.candidates,
        images: state.images,
        analyses: state.analyses,
        assignments: state.assignments,
        savedPlaces: state.savedPlaces,
        submissions: state.submissions,
        aliases: state.aliases,
        importTimestamps: state.importTimestamps,
      }),
    },
  ),
);

export async function hydrateResearchStore() {
  try {
    await useResearchStore.persist.rehydrate();
  } catch {
    // Storage unavailable — the in-memory defaults are still usable.
  }
}

// --- selectors --------------------------------------------------------------

/**
 * Aggregated signals, split by ownership (§24).
 *
 * The traveller's own imports and the reviewed community corpus are different
 * claims and are never added together.
 */
export function useSignalSets(): { mine: Map<string, SocialSignals>; community: Map<string, SocialSignals> } {
  const candidates = useResearchStore((s) => s.candidates);
  const imports = useResearchStore((s) => s.imports);
  return useMemo(() => {
    const profileId = typeof window === 'undefined' ? 'local' : getProfileId();
    const mine = imports.filter((i) => i.ownerProfileId === profileId && i.visibility === 'private');
    const community = imports.filter((i) => i.visibility === 'community');
    return {
      mine: aggregateSignals({ candidates, sources: mine }),
      community: aggregateSignals({ candidates, sources: community }),
    };
  }, [candidates, imports]);
}

/** Signals from the traveller's own imports only. Used on place cards. */
export function useResearchSignals(): Map<string, SocialSignals> {
  return useSignalSets().mine;
}

export function useImport(id: string | null) {
  const imports = useResearchStore((s) => s.imports);
  const candidates = useResearchStore((s) => s.candidates);
  const images = useResearchStore((s) => s.images);
  return useMemo(() => {
    const record = imports.find((i) => i.id === id) ?? null;
    return {
      record,
      candidates: record ? candidates.filter((c) => c.importId === record.id) : [],
      images: record ? images.filter((image) => image.importId === record.id).sort((a, b) => a.originalIndex - b.originalIndex) : [],
    };
  }, [imports, candidates, images, id]);
}

/** Imports gathered for one trip. The reverse of `SocialImport.tripId`. */
export function useImportsForTrip(tripId: string | null): XiaohongshuImport[] {
  const imports = useResearchStore((s) => s.imports);
  return useMemo(
    () => (tripId ? imports.filter((entry) => entry.tripId === tripId) : []),
    [imports, tripId],
  );
}

/** Saved places that came from an import belonging to this trip. */
export function useSavedPlacesForTrip(tripId: string | null, destinationId: string): UserSavedPlace[] {
  const saved = useResearchStore((s) => s.savedPlaces);
  const scoped = useImportsForTrip(tripId);
  return useMemo(() => {
    if (!tripId || scoped.length === 0) return [];
    const importIds = new Set(scoped.map((entry) => entry.id));
    return saved.filter(
      (place) => place.destinationId === destinationId && place.sourceImportId && importIds.has(place.sourceImportId),
    );
  }, [saved, scoped, tripId, destinationId]);
}

export function useSavedPlaces(destinationId?: string): UserSavedPlace[] {
  const saved = useResearchStore((s) => s.savedPlaces);
  return useMemo(
    () => (destinationId ? saved.filter((p) => p.destinationId === destinationId) : saved),
    [saved, destinationId],
  );
}

export function useSavedPlaceIds(): Set<string> {
  const saved = useResearchStore((s) => s.savedPlaces);
  return useMemo(() => new Set(saved.map((p) => p.placeId)), [saved]);
}

/**
 * Images that belong to no place yet (§17).
 *
 * This is the tray that makes imperfect image analysis survivable: whatever a
 * provider could not attribute, and whatever the traveller has not filed yet,
 * stays visible and actionable instead of disappearing.
 */
export function useUnassignedImages(importId: string | null): ImportImage[] {
  const images = useResearchStore((s) => s.images);
  const assignments = useResearchStore((s) => s.assignments);
  const candidates = useResearchStore((s) => s.candidates);
  return useMemo(() => {
    if (!importId) return [];
    const mine = images.filter((image) => image.importId === importId);
    const placed = new Set<string>();
    for (const assignment of assignments) {
      if (assignment.importId !== importId) continue;
      // Only an assignment to a candidate that still exists counts.
      if (candidates.some((c) => c.id === assignment.candidateId)) placed.add(assignment.imageId);
    }
    return mine.filter((image) => !placed.has(image.id)).sort((a, b) => a.originalIndex - b.originalIndex);
  }, [images, assignments, candidates, importId]);
}

/** The images attached to one candidate, suggested and confirmed (§23). */
export function imagesForCandidate(
  candidateId: string,
  images: ImportImage[],
  assignments: ImagePlaceAssignment[],
): { image: ImportImage; source: ImagePlaceAssignment['source'] }[] {
  const byId = new Map(images.map((image) => [image.id, image]));
  const out: { image: ImportImage; source: ImagePlaceAssignment['source'] }[] = [];
  for (const assignment of assignments) {
    if (assignment.candidateId !== candidateId) continue;
    const image = byId.get(assignment.imageId);
    if (image) out.push({ image, source: assignment.source });
  }
  return out.sort((a, b) => a.image.originalIndex - b.image.originalIndex);
}

export type { RecommendationType };
export { ANALYSIS_VERSION, IMAGE_PROPOSAL_FLOOR } from './analyzer';
