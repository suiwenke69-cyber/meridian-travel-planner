'use client';

import type { ExternalPlaceCandidate, PlaceResolutionStatus, RecommendationType } from '../types';
import { MATCH_CONFIDENCE_FLOOR, matchPlace, type MatchTarget } from './match';
import { normalizePlaceName } from './normalize';

/**
 * Turning a name into a real map position (§10, §11).
 *
 * The order is the whole design and it is not negotiable:
 *
 *   1. Meridian's canonical dataset   — we already know this place.
 *   2. The alias table                — this profile already confirmed this name.
 *   3. An external place provider     — somebody else's map knows it.
 *   4. The traveller                  — they point at the map, or create it.
 *
 * Each step is strictly more expensive and less trustworthy than the one before,
 * which is what makes the order correct rather than merely convenient. A hit in
 * step 1 is a place Meridian has curated, photographed and verified. A hit in
 * step 3 is a name that a search engine matched to coordinates, and it is
 * offered to the traveller as a QUESTION — never written straight onto the map.
 *
 * The one thing no step may do is ask a language model for a latitude (§10, §35).
 * A model that has never seen this island cannot know where a beach club is, and
 * a plausible-looking wrong coordinate is the single most damaging output this
 * feature could produce: it would silently corrupt an itinerary with a stop that
 * does not exist.
 */

// ---------------------------------------------------------------------------
// Provider abstraction
// ---------------------------------------------------------------------------

export interface PlaceSearchQuery {
  query: string;
  destinationId: string;
  areaHint?: string;
  entityType?: RecommendationType;
  /** Free-text locality the guide mentioned, e.g. 长谷. Helps disambiguate. */
  localityHint?: string;
}

export interface PlaceSearchProvider {
  id: 'google_places';
  label: string;
  /** False on a static deployment, where the server route does not exist. */
  available: () => boolean;
  search: (query: PlaceSearchQuery) => Promise<ExternalPlaceCandidate[]>;
}

/**
 * The reference provider.
 *
 * It does not hold a key and does not call Google. It calls `/api/resolve-place`,
 * which is the only place `GOOGLE_PLACES_API_KEY` is read — the same boundary the
 * extraction and routing providers already use. That indirection is also what
 * makes §12 enforceable: the field mask is chosen on the server, so a client can
 * never ask for the expensive fields by accident.
 */
export const externalPlaceProvider: PlaceSearchProvider = {
  id: 'google_places',
  label: 'Google Places',
  available: () => true,
  async search(query) {
    const response = await fetch('/api/resolve-place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    });
    if (!response.ok) {
      const detail = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(detail.error ?? `resolve_failed_${response.status}`);
    }
    const payload = (await response.json()) as { candidates?: ExternalPlaceCandidate[] };
    return payload.candidates ?? [];
  },
};

/** A provider that always finds nothing. Used when resolution is switched off. */
export const noopPlaceProvider: PlaceSearchProvider = {
  id: 'google_places',
  label: '未启用',
  available: () => false,
  async search() {
    return [];
  },
};

/**
 * Whether to attempt an external lookup at all.
 *
 * OFF unless `NEXT_PUBLIC_PLACE_PROVIDER=google` is set. That default is a cost
 * decision as much as a noise one (§12): on a static deployment the route is not
 * deployed, so a lookup is a guaranteed 404 logged in the console for every
 * unmatched name — and on a configured deployment it is the only thing that
 * spends money.
 *
 * The switch is public-safe: it names whether to try, and carries no secret.
 */
export function placeProviderEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PLACE_PROVIDER === 'google';
}

export function getPlaceSearchProvider(): PlaceSearchProvider {
  return placeProviderEnabled() ? externalPlaceProvider : noopPlaceProvider;
}

// ---------------------------------------------------------------------------
// Cache (§12)
// ---------------------------------------------------------------------------

/**
 * Successful external lookups, keyed by name and destination.
 *
 * The point is a specific cost behaviour: `Sensorium Bali` is looked up once.
 * The traveller confirms it, an alias is recorded, and every later import
 * resolves through the alias table without touching Google again. The cache is
 * the second line of defence for the case where an alias was not recorded — a
 * mention the traveller ignored, say — so a re-import is still free.
 *
 * Cached entries carry a timestamp because a provider's data goes stale and an
 * unbounded cache would eventually serve coordinates from a place that closed.
 */
const CACHE_KEY = 'meridian.placecache.v1';
const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 400;

export interface CachedPlace {
  candidates: ExternalPlaceCandidate[];
  cachedAt: number;
}

type CacheShape = Record<string, CachedPlace>;

function cacheKey(query: PlaceSearchQuery): string {
  return `${query.destinationId}::${normalizePlaceName(query.query)}`;
}

function readCache(): CacheShape {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CacheShape) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: CacheShape): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const entries = Object.entries(cache)
      .filter(([, value]) => Date.now() - value.cachedAt < CACHE_TTL_MS)
      .sort((a, b) => b[1].cachedAt - a[1].cachedAt)
      .slice(0, MAX_CACHE_ENTRIES);
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // A full quota must not break resolution.
  }
}

export function readCachedPlace(query: PlaceSearchQuery): ExternalPlaceCandidate[] | null {
  const entry = readCache()[cacheKey(query)];
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) return null;
  return entry.candidates;
}

export function writeCachedPlace(query: PlaceSearchQuery, candidates: ExternalPlaceCandidate[]): void {
  if (candidates.length === 0) return;
  const cache = readCache();
  cache[cacheKey(query)] = { candidates, cachedAt: Date.now() };
  writeCache(cache);
}

export function clearPlaceCache(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Nothing to do.
  }
}

// ---------------------------------------------------------------------------
// The pipeline
// ---------------------------------------------------------------------------

export interface ResolutionInput {
  rawName: string;
  destinationId: string;
  targets: MatchTarget[];
  areaHint?: string;
  entityType?: RecommendationType;
  /** Localities the guide named, so a search can be narrowed before it is made. */
  localityHint?: string;
  /** False when the traveller has disabled external lookups. */
  allowExternal?: boolean;
}

export interface ResolutionResult {
  status: PlaceResolutionStatus;
  matchedPlaceId?: string;
  matchMethod?: 'exact' | 'alias' | 'fuzzy' | 'external';
  confidence?: number;
  band: 'high' | 'medium' | 'low';
  externalCandidates: ExternalPlaceCandidate[];
  /** True when the answer came from the cache rather than a fresh lookup. */
  cached: boolean;
  /** Set when an external lookup was attempted and failed, so the UI can say so. */
  externalError?: string;
}

/** §13's bands, so the interface never speaks in scores. */
function bandFor(confidence: number | undefined): 'high' | 'medium' | 'low' {
  if (confidence == null) return 'low';
  if (confidence >= 0.9) return 'high';
  if (confidence >= MATCH_CONFIDENCE_FLOOR) return 'medium';
  return 'low';
}

/**
 * Steps 1–3, in order, with every early exit deliberate.
 *
 * Note what step 1 returning a MEDIUM match does: it does NOT short-circuit to
 * `resolved`. It falls through to step 3 so the traveller can be shown both the
 * Meridian candidate and whatever an external search found. That sounds like
 * extra cost, and it is — but it is bounded by the medium band being rare, and
 * the alternative is a traveller confirming a wrong place because they were
 * never shown the right one.
 */
export async function resolvePlace(input: ResolutionInput): Promise<ResolutionResult> {
  const local = matchPlace(input.rawName, input.targets, {
    areaHint: input.areaHint,
    recommendationType: input.entityType,
  });

  const localConfidence = local.confidence > 0 ? local.confidence : undefined;

  if (local.placeId && localConfidence != null) {
    const band = bandFor(localConfidence);
    if (band === 'high') {
      return {
        status: local.method === 'alias' ? 'alias' : 'meridian',
        matchedPlaceId: local.placeId,
        matchMethod: local.method ?? 'exact',
        confidence: localConfidence,
        band,
        externalCandidates: [],
        cached: false,
      };
    }
  }

  // The traveller switched resolution off entirely.
  if (input.allowExternal === false) {
    return {
      status: local.placeId ? 'meridian' : 'unresolved',
      matchedPlaceId: local.placeId ?? undefined,
      matchMethod: local.method ?? undefined,
      confidence: localConfidence,
      band: bandFor(localConfidence),
      externalCandidates: [],
      cached: false,
    };
  }

  // --- step 3: somebody else's map ---------------------------------------
  const query: PlaceSearchQuery = {
    query: input.rawName,
    destinationId: input.destinationId,
    areaHint: input.areaHint,
    entityType: input.entityType,
    localityHint: input.localityHint,
  };

  let external: ExternalPlaceCandidate[] = [];
  let cached = false;
  let externalError: string | undefined;

  /*
   * The cache is consulted FIRST and unconditionally.
   *
   * It costs nothing and it is local, so a name this profile already resolved
   * stays resolved even on a deployment that has since switched the external
   * provider off. Skipping it when the provider is disabled would throw away
   * work the traveller already paid for in attention.
   */
  const fromCache = readCachedPlace(query);
  if (fromCache) {
    external = fromCache;
    cached = true;
  } else if (placeProviderEnabled()) {
    // The only branch that spends money, and the only one that can 404.
    try {
      external = await getPlaceSearchProvider().search(query);
      if (external.length > 0) writeCachedPlace(query, external);
    } catch (error) {
      externalError = error instanceof Error ? error.message.slice(0, 60) : 'resolve_failed';
    }
  }

  if (local.placeId) {
    return {
      status: local.method === 'alias' ? 'alias' : 'meridian',
      matchedPlaceId: local.placeId,
      matchMethod: local.method ?? 'exact',
      confidence: localConfidence,
      band: bandFor(localConfidence),
      externalCandidates: external,
      cached,
      externalError,
    };
  }

  if (external.length === 1) {
    return {
      status: 'external',
      matchMethod: 'external',
      confidence: undefined,
      band: 'low',
      externalCandidates: external,
      cached,
      externalError,
    };
  }

  if (external.length > 1) {
    return {
      status: 'external_multiple',
      matchMethod: 'external',
      confidence: undefined,
      band: 'low',
      externalCandidates: external,
      cached,
      externalError,
    };
  }

  return {
    status: 'unresolved',
    confidence: undefined,
    band: 'low',
    externalCandidates: [],
    cached,
    externalError,
  };
}

/**
 * What the traveller should see for a resolution status.
 *
 * Kept here rather than in the component so the map, the card and the saved list
 * cannot describe the same state three different ways.
 */
export function resolutionLabelKey(status: PlaceResolutionStatus):
  | 'import.resolve.meridian'
  | 'import.resolve.alias'
  | 'import.resolve.external'
  | 'import.resolve.externalMultiple'
  | 'import.resolve.unresolved'
  | 'import.resolve.pinned'
  | 'import.resolve.created' {
  switch (status) {
    case 'meridian':
      return 'import.resolve.meridian';
    case 'alias':
      return 'import.resolve.alias';
    case 'external':
      return 'import.resolve.external';
    case 'external_multiple':
      return 'import.resolve.externalMultiple';
    case 'user_pinned':
      return 'import.resolve.pinned';
    case 'user_created':
      return 'import.resolve.created';
    default:
      return 'import.resolve.unresolved';
  }
}

/** True when the traveller still has to make a decision about this candidate. */
export function needsUserDecision(status: PlaceResolutionStatus): boolean {
  return status === 'external' || status === 'external_multiple' || status === 'unresolved';
}
