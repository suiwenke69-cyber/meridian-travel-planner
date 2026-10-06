'use client';

import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  CandidatePlace,
  SocialSignals,
  MentionStatus,
  RecommendationType,
  SocialGuideSource,
  SocialMention,
  SocialPlatform,
} from '../types';
import { getAreas, getPlaces } from '../data';
import { extractMentions, type ExtractArea, type ExtractPlace } from './extract';
import { detectPlatform } from './platforms';
import { aggregateSignals, reviewQueue } from './signals';

/**
 * The research layer.
 *
 * Deliberately a SEPARATE store from the trip store and from the production data
 * registry. Nothing written here can reach a traveller until a researcher moves
 * a mention to `accepted`, and even then what reaches the UI is an aggregate
 * count, never the imported text.
 *
 * Persistence mirrors the trip store: localStorage behind `persist`, with manual
 * hydration so the server and first client render agree.
 */

export interface AddSourceInput {
  url?: string;
  platform?: SocialPlatform;
  title?: string;
  author?: string;
  userNotes?: string;
  rawText?: string;
}

export interface ResearchStoreState {
  sources: SocialGuideSource[];
  mentions: SocialMention[];
  candidates: CandidatePlace[];
  hydrated: boolean;

  setHydrated: (value: boolean) => void;
  addSource: (input: AddSourceInput) => SocialGuideSource;
  updateSource: (id: string, patch: Partial<SocialGuideSource>) => void;
  deleteSource: (id: string) => void;

  /** Runs extraction for one guide and replaces its previous mentions. */
  extractSource: (id: string) => { extracted: number; matched: number };
  /** Runs extraction for every unprocessed guide. */
  extractAll: () => { extracted: number };

  setMentionStatus: (id: string, status: MentionStatus) => void;
  setMentionMatch: (id: string, placeId: string | null) => void;
  updateMention: (id: string, patch: Partial<SocialMention>) => void;

  deleteMention: (id: string) => void;
  clearAll: () => void;
}

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

/** The canonical corpus a mention is matched against. */
function canonicalPlaces(): ExtractPlace[] {
  return getPlaces('bali').map((place) => ({
    id: place.id,
    name: place.name,
    nameZh: place.nameZh,
    areaId: place.areaId,
    discovery: place.discovery,
    category: place.category,
  }));
}

function canonicalAreas(): ExtractArea[] {
  return getAreas('bali').map((area) => ({ id: area.id, name: area.name, nameZh: area.nameZh }));
}

export const useResearchStore = create<ResearchStoreState>()(
  persist(
    (set, get) => ({
      sources: [],
      mentions: [],
      candidates: [],
      hydrated: false,

      setHydrated: (value) => set({ hydrated: value }),

      addSource: (input) => {
        const platform = input.platform ?? detectPlatform(input.url) ?? (input.url ? 'other' : 'manual');
        const source: SocialGuideSource = {
          id: nextId('src'),
          platform,
          url: input.url?.trim() || undefined,
          title: input.title?.trim() || undefined,
          author: input.author?.trim() || undefined,
          userNotes: input.userNotes?.trim() || undefined,
          rawText: input.rawText?.trim() || undefined,
          importedAt: new Date().toISOString(),
          status: input.rawText && input.rawText.trim().length > 0 ? 'unprocessed' : 'unprocessed',
        };
        set((state) => ({ sources: [source, ...state.sources] }));
        return source;
      },

      updateSource: (id, patch) =>
        set((state) => ({
          sources: state.sources.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),

      deleteSource: (id) =>
        set((state) => ({
          sources: state.sources.filter((s) => s.id !== id),
          // Mentions and candidate places derived from a deleted guide go with it.
          mentions: state.mentions.filter((m) => m.sourceId !== id),
          candidates: state.candidates
            .map((c) => ({ ...c, suggestedBy: c.suggestedBy.filter((sid) => sid !== id) }))
            .filter((c) => c.suggestedBy.length > 0),
        })),

      extractSource: (id) => {
        const state = get();
        const source = state.sources.find((s) => s.id === id);
        if (!source) return { extracted: 0, matched: 0 };

        const text = source.rawText ?? '';
        if (text.trim().length === 0) {
          set((s) => ({
            sources: s.sources.map((x) => (x.id === id ? { ...x, status: 'extracted', extractedAt: new Date().toISOString() } : x)),
            mentions: s.mentions.filter((m) => m.sourceId !== id),
          }));
          return { extracted: 0, matched: 0 };
        }

        const { mentions: extracted } = extractMentions(text, canonicalPlaces(), canonicalAreas());
        const createdAt = new Date().toISOString();

        /*
         * Re-extraction REPLACES this source's mentions rather than appending.
         * A reviewer who fixes a typo in the pasted text expects the queue to
         * reflect the corrected text, not to double in size.
         *
         * Decisions already made are carried across when the normalised name is
         * unchanged, so re-running does not silently undo a morning's review.
         */
        const previous = new Map(
          state.mentions.filter((m) => m.sourceId === id).map((m) => [m.normalizedPlaceName, m]),
        );

        const next: SocialMention[] = extracted.map((mention) => {
          const prior = previous.get(mention.normalizedPlaceName);
          const status: MentionStatus = prior
            ? prior.status
            : mention.matchedPlaceId
              ? 'matched'
              : 'needs-review';
          return {
            id: prior?.id ?? nextId('men'),
            sourceId: id,
            rawPlaceName: mention.rawPlaceName,
            normalizedPlaceName: mention.normalizedPlaceName,
            matchedPlaceId: prior?.matchedPlaceId ?? mention.matchedPlaceId,
            matchMethod: prior?.matchMethod ?? mention.matchMethod,
            matchConfidence: mention.matchConfidence,
            recommendationType: prior?.recommendationType ?? mention.recommendationType,
            sentiment: mention.sentiment,
            extractedNotes: mention.extractedNotes,
            recommendedItems: mention.recommendedItems,
            areaHint: mention.areaHint,
            status: status === 'accepted' || status === 'dismissed' ? status : status,
            createdAt: prior?.createdAt ?? createdAt,
          };
        });

        /*
         * One mention per normalised name, per source. The extractor already
         * dedupes, but this is the boundary that writes to storage, and a second
         * row for the same venue would double-count in the traveller's signal.
         */
        const unique = new Map<string, SocialMention>();
        for (const mention of next) {
          if (!unique.has(mention.normalizedPlaceName)) unique.set(mention.normalizedPlaceName, mention);
        }

        set((s) => ({
          sources: s.sources.map((x) => (x.id === id ? { ...x, status: 'extracted', extractedAt: createdAt } : x)),
          mentions: [...s.mentions.filter((m) => m.sourceId !== id), ...unique.values()],
        }));

        return {
          extracted: unique.size,
          matched: [...unique.values()].filter((m) => m.matchedPlaceId).length,
        };
      },

      extractAll: () => {
        const pending = get().sources.filter((s) => s.status === 'unprocessed' && (s.rawText ?? '').trim().length > 0);
        let extracted = 0;
        for (const source of pending) extracted += get().extractSource(source.id).extracted;
        return { extracted };
      },

      setMentionStatus: (id, status) =>
        set((state) => ({
          mentions: state.mentions.map((m) => (m.id === id ? { ...m, status } : m)),
        })),

      setMentionMatch: (id, placeId) =>
        set((state) => ({
          mentions: state.mentions.map((m) =>
            m.id === id
              ? {
                  ...m,
                  matchedPlaceId: placeId ?? undefined,
                  matchMethod: placeId ? 'manual' : undefined,
                  matchConfidence: placeId ? 1 : m.matchConfidence,
                  // A manual match is still a decision to publish, not a publish.
                  status: placeId ? (m.status === 'accepted' ? 'accepted' : 'matched') : 'needs-review',
                }
              : m,
          ),
        })),

      updateMention: (id, patch) =>
        set((state) => ({ mentions: state.mentions.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),

      deleteMention: (id) => set((state) => ({ mentions: state.mentions.filter((m) => m.id !== id) })),

      clearAll: () => set({ sources: [], mentions: [], candidates: [] }),
    }),
    {
      name: 'meridian.research.v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        sources: state.sources,
        mentions: state.mentions,
        candidates: state.candidates,
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
 * Aggregated signals, memoised.
 *
 * The map is rebuilt only when the mentions or the sources actually change —
 * every place card on screen asks for this, and recomputing the corpus on each
 * render would make scrolling a restaurant list visibly expensive.
 */
export function useResearchSignals(): Map<string, SocialSignals> {
  const mentions = useResearchStore((s) => s.mentions);
  const sources = useResearchStore((s) => s.sources);
  return useMemo(() => aggregateSignals({ mentions, sources }), [mentions, sources]);
}

export function useReviewQueue() {
  const mentions = useResearchStore((s) => s.mentions);
  return reviewQueue(mentions);
}

export type { RecommendationType };
