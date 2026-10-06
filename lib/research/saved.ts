'use client';

import { useMemo } from 'react';
import type { Hotel, Place, UserPlaceSubmission, UserSavedPlace } from '../types';
import { getHotels, getPlaces } from '../data';
import { placeMatchesCategory } from '../data/place-taxonomy';
import { useResearchStore } from './store';

/**
 * 我的收藏, resolved.
 *
 * A saved place is stored as an id, because a copy would go stale the moment the
 * canonical name or coordinates were corrected. Resolving on read means the
 * saved list can never disagree with the map — and it also means a saved id that
 * no longer resolves has to be handled honestly rather than shown as a broken
 * card. That case exists: a place removed from the dataset after somebody saved
 * it. It is dropped here and the count in the panel explains the gap.
 *
 * One place saved from three different guides is ONE entry carrying three
 * references. That is the whole point of saving by reference (§14): the same
 * beach club reached from three guides is one beach club.
 */

export type SavedFilter = 'all' | 'hotel' | 'food' | 'sight' | 'coffee' | 'nightlife';

export const SAVED_FILTERS: SavedFilter[] = ['all', 'hotel', 'food', 'sight', 'coffee', 'nightlife'];

export type SavedEntry =
  | { kind: 'place'; id: string; place: Place; saves: UserSavedPlace[] }
  | { kind: 'hotel'; id: string; hotel: Hotel; saves: UserSavedPlace[] }
  /**
   * A place the traveller created because the dataset did not have it. It is
   * private and pending review; it is shown here so it is not lost, and labelled
   * so it is never mistaken for a verified place.
   */
  | { kind: 'pending'; id: string; submission: UserPlaceSubmission; saves: UserSavedPlace[] };

/** Which saved entries a filter chip admits. */
export function matchesSavedFilter(entry: SavedEntry, filter: SavedFilter): boolean {
  if (filter === 'all') return true;
  if (entry.kind === 'hotel') return filter === 'hotel';
  if (entry.kind === 'pending') {
    const type = entry.submission.recommendationType;
    if (filter === 'hotel') return type === 'hotel';
    if (filter === 'coffee') return type === 'cafe';
    if (filter === 'nightlife') return type === 'bar' || type === 'beachclub';
    if (filter === 'food') return type === 'restaurant';
    return type !== 'hotel' && type !== 'restaurant' && type !== 'cafe' && type !== 'bar' && type !== 'beachclub';
  }
  const { place } = entry;
  if (filter === 'hotel') return false;
  if (filter === 'food') return placeMatchesCategory(place, 'food');
  if (filter === 'coffee') return placeMatchesCategory(place, 'coffee');
  if (filter === 'nightlife') return placeMatchesCategory(place, 'nightlife') || placeMatchesCategory(place, 'beachclub');
  // 景点 is the catch-all for "a thing to go and see", which is culture, nature,
  // beach and water — everything the DO categories call a sight rather than a
  // place to eat or sleep.
  return (
    placeMatchesCategory(place, 'culture') ||
    placeMatchesCategory(place, 'nature') ||
    placeMatchesCategory(place, 'beach') ||
    placeMatchesCategory(place, 'water') ||
    placeMatchesCategory(place, 'highlights')
  );
}

/**
 * Saved places for one destination, resolved and grouped.
 *
 * `danglingCount` is reported rather than hidden: if a saved place no longer
 * resolves, the panel says so instead of quietly showing a shorter list.
 */
export function useSavedEntries(destinationId: string): { entries: SavedEntry[]; danglingCount: number } {
  const saved = useResearchStore((s) => s.savedPlaces);
  const submissions = useResearchStore((s) => s.submissions);

  return useMemo(() => {
    const placeById = new Map(getPlaces(destinationId).map((place) => [place.id, place]));
    const hotelById = new Map(getHotels(destinationId).map((hotel) => [hotel.id, hotel]));

    const byId = new Map<string, UserSavedPlace[]>();
    for (const entry of saved) {
      if (entry.destinationId !== destinationId) continue;
      const list = byId.get(entry.placeId) ?? [];
      list.push(entry);
      byId.set(entry.placeId, list);
    }

    const entries: SavedEntry[] = [];
    let danglingCount = 0;

    for (const [id, saves] of byId) {
      const place = placeById.get(id);
      if (place) {
        entries.push({ kind: 'place', id, place, saves });
        continue;
      }
      const hotel = hotelById.get(id);
      if (hotel) {
        entries.push({ kind: 'hotel', id, hotel, saves });
        continue;
      }
      // A place the traveller created. Submissions are keyed by their own id.
      const submission = submissions.find((s) => s.id === id && s.status !== 'rejected');
      if (submission) {
        entries.push({ kind: 'pending', id, submission, saves });
        continue;
      }
      danglingCount += 1;
    }

    /*
     * Places created during an import are saved as submissions, not as canonical
     * references, because there is no canonical place to point at yet. They are
     * merged in here so the traveller sees everything they kept in one list.
     */
    for (const submission of submissions) {
      if (submission.destinationId !== destinationId) continue;
      if (submission.status === 'rejected') continue;
      if (byId.has(submission.id)) continue;
      entries.push({ kind: 'pending', id: submission.id, submission, saves: [] });
    }

    const latest = (entry: SavedEntry): string => {
      const stamps = entry.saves.map((s) => s.savedAt);
      if (entry.kind === 'pending' && stamps.length === 0) return entry.submission.createdAt;
      return stamps.sort().at(-1) ?? '';
    };

    entries.sort((a, b) => latest(b).localeCompare(latest(a)));
    return { entries, danglingCount };
  }, [saved, submissions, destinationId]);
}

/** How many guides mention each saved place, split by who the guide belongs to. */
export function useSavedProvenance(): Map<string, { mine: number; community: number }> {
  const mentions = useResearchStore((s) => s.mentions);
  const imports = useResearchStore((s) => s.imports);

  return useMemo(() => {
    const visibility = new Map(imports.map((entry) => [entry.id, entry.visibility]));
    const out = new Map<string, { mine: number; community: number }>();
    for (const mention of mentions) {
      if (!mention.matchedPlaceId) continue;
      if (mention.userDecision !== 'save') continue;
      const bucket = out.get(mention.matchedPlaceId) ?? { mine: 0, community: 0 };
      if (visibility.get(mention.importId) === 'community') bucket.community += 1;
      else bucket.mine += 1;
      out.set(mention.matchedPlaceId, bucket);
    }
    return out;
  }, [mentions, imports]);
}
