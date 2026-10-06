'use client';

import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  MatchBand,
  PlaceAlias,
  RecommendationType,
  SocialImport,
  SocialPlaceMention,
  SocialPlatform,
  SocialSignals,
  SubmissionStatus,
  UserDecision,
  UserPlaceSubmission,
  UserSavedPlace,
} from '../types';
import { getAreas, getHotels, getPlaces } from '../data';
import type { ExtractArea, ExtractPlace } from './extract';
import { detectPlatform } from './platforms';
import { normalizePlaceName } from './normalize';
import { MATCH_CONFIDENCE_FLOOR, matchPlace, type MatchTarget } from './match';
import { getExtractor, EXTRACTION_VERSION } from './extractor';
import { capMentions, checkImportInput, checkImportRate, stripBoilerplate, type LimitViolation } from './limits';
import { aggregateSignals } from './signals';
import { track } from './analytics';

/**
 * The social import store.
 *
 * ONE STORE, TWO AUDIENCES
 * ------------------------
 * A traveller's private import and a reviewed community contribution are the
 * same shape; they differ by `visibility`, not by type. Keeping them together
 * means the research view and the traveller's flow share one extractor, one
 * matcher and one alias table — so a name resolved in either improves both.
 *
 * WHAT IS DELIBERATELY SEPARATE
 * -----------------------------
 * Saved places are REFERENCES, not copies. The canonical `Place` stays the one
 * source of truth for names, coordinates and photography; saving points at it.
 * Creating a place the dataset lacks writes a `UserPlaceSubmission` in
 * `pending_verification` and never touches the canonical registry.
 *
 * PRIVACY
 * -------
 * Every record carries a local profile id, and pasted text lives on the import,
 * so deleting the import deletes the text. §27 is a data-shape decision rather
 * than a policy: there is no field through which one traveller's import could
 * reach another's view.
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
  platform?: SocialPlatform;
  destinationId?: string;
  tripId?: string;
  userNotes?: string;
}

export interface StartImportResult {
  import?: SocialImport;
  violation?: LimitViolation;
}

export interface ResearchStoreState {
  imports: SocialImport[];
  mentions: SocialPlaceMention[];
  savedPlaces: UserSavedPlace[];
  submissions: UserPlaceSubmission[];
  aliases: PlaceAlias[];
  hydrated: boolean;
  /** Timestamps of recent imports, for the rolling-window limit. */
  importTimestamps: number[];

  setHydrated: (value: boolean) => void;

  startImport: (input: StartImportInput) => StartImportResult;
  processImport: (id: string) => Promise<{ places: number; matched: number } | { error: string }>;
  deleteImport: (id: string) => void;
  updateImport: (id: string, patch: Partial<SocialImport>) => void;

  decideMention: (id: string, decision: UserDecision) => void;
  resolveMentionToPlace: (id: string, placeId: string) => void;
  updateMention: (id: string, patch: Partial<SocialPlaceMention>) => void;

  /** Saves the chosen mentions as references to canonical places. */
  saveSelected: (importId: string) => { saved: number };
  unsavePlace: (placeId: string) => void;

  submitPlace: (
    input: Omit<UserPlaceSubmission, 'id' | 'ownerProfileId' | 'status' | 'createdAt'>,
  ) => UserPlaceSubmission;
  setSubmissionStatus: (id: string, status: SubmissionStatus) => void;

  /** Records that a name means a place, so the next import matches instantly. */
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
 * constantly ("住 Alila Uluwatu 两晚") and leaving them out meant the most
 * valuable line in a guide — where to stay — could never match. They are
 * matched, saved and displayed through a different resolver than places, but
 * they are matched by the same matcher, so a name means one thing.
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

/** Targets include learned aliases, so a confirmed name matches exactly next time. */
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

export const useResearchStore = create<ResearchStoreState>()(
  persist(
    (set, get) => ({
      imports: [],
      mentions: [],
      savedPlaces: [],
      submissions: [],
      aliases: [],
      hydrated: false,
      importTimestamps: [],

      setHydrated: (value) => set({ hydrated: value }),

      startImport: (input) => {
        const violation = checkImportInput(input);
        if (violation) return { violation };

        const rate = checkImportRate(get().importTimestamps);
        if (rate) return { violation: rate };

        const url = input.url?.trim() || undefined;
        const text = input.text?.trim() || undefined;

        const record: SocialImport = {
          id: nextId('imp'),
          ownerProfileId: getProfileId(),
          visibility: 'private',
          destinationId: input.destinationId,
          tripId: input.tripId,
          platform: input.platform ?? detectPlatform(url) ?? (url ? 'other' : 'manual'),
          sourceUrl: url,
          userNotes: input.userNotes?.trim() || undefined,
          userProvidedText: text,
          createdAt: new Date().toISOString(),
          status: 'draft',
          /*
           * The honest answer to "where did the content come from". A URL alone
           * is `unavailable`, because we make no attempt to fetch it — that is a
           * deliberate product position, not a missing feature.
           */
          sourceAccessStatus: text ? 'user_text' : 'unavailable',
          extractionVersion: EXTRACTION_VERSION,
        };

        set((state) => ({
          imports: [record, ...state.imports],
          importTimestamps: [...state.importTimestamps, Date.now()].slice(-100),
        }));
        track('social_import_started', { platform: record.platform, destinationId: record.destinationId });
        return { import: record };
      },

      processImport: async (id) => {
        const state = get();
        const record = state.imports.find((i) => i.id === id);
        if (!record) return { error: 'import_not_found' };

        const text = stripBoilerplate(record.userProvidedText ?? '');
        if (text.length === 0) {
          set((s) => ({
            imports: s.imports.map((i) =>
              i.id === id
                ? {
                    ...i,
                    status: 'failed',
                    failureReason: record.sourceUrl ? 'content_unavailable' : 'empty_text',
                    processedAt: new Date().toISOString(),
                  }
                : i,
            ),
          }));
          track('social_import_failed', { failureCode: record.sourceUrl ? 'content_unavailable' : 'empty_text' });
          return { error: record.sourceUrl ? 'content_unavailable' : 'empty_text' };
        }

        const destinationId = record.destinationId ?? 'bali';
        const hash = await contentHash([destinationId, record.sourceUrl ?? '', text]);

        /*
         * Cache by content hash. Re-pasting the same guide while checking is
         * common, and extraction may cost money per call. A hash hit reuses the
         * stored mentions without touching the extractor.
         */
        const cached = state.imports.find(
          (i) => i.id !== id && i.contentHash === hash && i.status === 'completed' && i.destinationId === record.destinationId,
        );
        if (cached) {
          const cachedMentions = state.mentions.filter((m) => m.importId === cached.id);
          if (cachedMentions.length > 0) {
            const cloned: SocialPlaceMention[] = cachedMentions.map((m) => ({
              ...m,
              id: nextId('men'),
              importId: id,
              userDecision: 'pending',
              verificationStatus: m.matchedPlaceId ? 'matched' : 'unmatched',
              createdAt: new Date().toISOString(),
            }));
            set((s) => ({
              imports: s.imports.map((i) =>
                i.id === id ? { ...i, status: 'review_required', contentHash: hash, processedAt: new Date().toISOString() } : i,
              ),
              mentions: [...s.mentions.filter((m) => m.importId !== id), ...cloned],
            }));
            return { places: cloned.length, matched: cloned.filter((m) => m.matchedPlaceId).length };
          }
        }

        set((s) => ({ imports: s.imports.map((i) => (i.id === id ? { ...i, status: 'processing' } : i)) }));

        try {
          const extractor = getExtractor();
          const result = await extractor.extract({
            text,
            platform: record.platform,
            sourceUrl: record.sourceUrl,
            destinationId,
            knownPlaces: canonicalPlaces(destinationId),
            knownAreas: canonicalAreas(destinationId),
          });

          const { kept } = capMentions(result.places);
          const targets = matchTargets(destinationId, state.aliases, record.ownerProfileId);
          const createdAt = new Date().toISOString();

          const mentions: SocialPlaceMention[] = kept.map((place) => {
            const match = matchPlace(place.rawPlaceName, targets, {
              areaHint: place.areaHint,
              recommendationType: place.categoryHint,
            });
            const confidence = match.confidence > 0 ? Number(match.confidence.toFixed(2)) : undefined;
            return {
              id: nextId('men'),
              importId: id,
              rawPlaceName: place.rawPlaceName,
              rawText: place.rawText,
              normalizedPlaceName: normalizePlaceName(place.rawPlaceName),
              categoryHint: place.categoryHint,
              areaHint: place.areaHint,
              extractedReason: place.extractedReason,
              extractedItems: place.extractedItems,
              contextThemes: place.contextThemes,
              positiveThemes: place.positiveThemes,
              warnings: place.warnings,
              bestTimeMentioned: place.bestTimeMentioned,
              matchedPlaceId: match.placeId ?? undefined,
              matchMethod: match.method ?? undefined,
              matchConfidence: confidence,
              matchBand: bandFor(match.placeId ? confidence : undefined),
              // Nothing is preselected as saved; review is where that happens.
              userDecision: 'pending',
              verificationStatus: match.placeId ? 'matched' : 'unmatched',
              createdAt,
            };
          });

          set((s) => ({
            imports: s.imports.map((i) =>
              i.id === id
                ? {
                    ...i,
                    status: mentions.length > 0 ? 'review_required' : 'failed',
                    failureReason: mentions.length === 0 ? 'no_places_detected' : undefined,
                    contentHash: hash,
                    processedAt: createdAt,
                  }
                : i,
            ),
            mentions: [...s.mentions.filter((m) => m.importId !== id), ...mentions],
          }));

          if (mentions.length === 0) {
            track('social_import_failed', { failureCode: 'no_places_detected' });
            return { error: 'no_places_detected' };
          }

          const matched = mentions.filter((m) => m.matchedPlaceId).length;
          track('social_import_processed', {
            platform: record.platform,
            destinationId,
            candidateCount: mentions.length,
            matchedCount: matched,
            providerId: result.providerId,
          });
          return { places: mentions.length, matched };
        } catch (error) {
          const code = error instanceof Error ? error.message.slice(0, 60) : 'extraction_failed';
          set((s) => ({
            imports: s.imports.map((i) =>
              i.id === id ? { ...i, status: 'failed', failureReason: code, processedAt: new Date().toISOString() } : i,
            ),
          }));
          track('social_import_failed', { failureCode: code });
          return { error: code };
        }
      },

      updateImport: (id, patch) =>
        set((state) => ({ imports: state.imports.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),

      /** Deleting an import deletes the text it held (§26). */
      deleteImport: (id) =>
        set((state) => ({
          imports: state.imports.filter((i) => i.id !== id),
          mentions: state.mentions.filter((m) => m.importId !== id),
        })),

      decideMention: (id, decision) =>
        set((state) => ({
          mentions: state.mentions.map((m): SocialPlaceMention => {
            if (m.id !== id) return m;
            const verificationStatus: SocialPlaceMention['verificationStatus'] =
              decision === 'ignore'
                ? 'rejected'
                : m.matchedPlaceId
                  ? 'matched'
                  : m.submittedPlaceId
                    ? 'possible_match'
                    : 'unmatched';
            return { ...m, userDecision: decision, verificationStatus };
          }),
        })),

      resolveMentionToPlace: (id, placeId) => {
        const state = get();
        const mention = state.mentions.find((m) => m.id === id);
        if (!mention) return;

        set((s) => ({
          mentions: s.mentions.map((m) =>
            m.id === id
              ? {
                  ...m,
                  matchedPlaceId: placeId,
                  matchMethod: 'manual',
                  matchConfidence: 1,
                  matchBand: 'high',
                  verificationStatus: 'matched',
                }
              : m,
          ),
        }));

        // The learning loop: a human said this name means this place.
        get().recordAlias(mention.rawPlaceName, placeId, 'user_confirmed', getProfileId());
        track('place_match_confirmed', { matchMethod: 'manual' });
      },

      updateMention: (id, patch) =>
        set((state) => ({ mentions: state.mentions.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),

      saveSelected: (importId) => {
        const state = get();
        const record = state.imports.find((i) => i.id === importId);
        if (!record) return { saved: 0 };

        const destinationId = record.destinationId ?? 'bali';
        const chosen = state.mentions.filter(
          (m) => m.importId === importId && m.userDecision === 'save' && m.matchedPlaceId,
        );

        const existing = new Set(state.savedPlaces.map((p) => p.placeId));
        const additions: UserSavedPlace[] = [];
        for (const mention of chosen) {
          // Saving is idempotent: the same place twice is still one saved place.
          if (existing.has(mention.matchedPlaceId!)) continue;
          existing.add(mention.matchedPlaceId!);
          additions.push({
            id: nextId('sav'),
            ownerProfileId: record.ownerProfileId,
            placeId: mention.matchedPlaceId!,
            destinationId,
            sourceImportId: importId,
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
      name: 'meridian.social.v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        imports: state.imports,
        mentions: state.mentions,
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
 * claims and are never added together. `mine` is what this profile imported;
 * `community` is what has been contributed and reviewed.
 */
export function useSignalSets(): { mine: Map<string, SocialSignals>; community: Map<string, SocialSignals> } {
  const mentions = useResearchStore((s) => s.mentions);
  const imports = useResearchStore((s) => s.imports);
  return useMemo(() => {
    const profileId = typeof window === 'undefined' ? 'local' : getProfileId();
    const mine = imports.filter((i) => i.ownerProfileId === profileId && i.visibility === 'private');
    const community = imports.filter((i) => i.visibility === 'community');
    return {
      mine: aggregateSignals({ mentions, sources: mine }),
      community: aggregateSignals({ mentions, sources: community }),
    };
  }, [mentions, imports]);
}

/** Signals from the traveller's own imports only. Used on place cards. */
export function useResearchSignals(): Map<string, SocialSignals> {
  return useSignalSets().mine;
}

export function useImport(id: string | null) {
  const imports = useResearchStore((s) => s.imports);
  const mentions = useResearchStore((s) => s.mentions);
  return useMemo(() => {
    const record = imports.find((i) => i.id === id) ?? null;
    return { import: record, mentions: record ? mentions.filter((m) => m.importId === record.id) : [] };
  }, [imports, mentions, id]);
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

export type { RecommendationType };
