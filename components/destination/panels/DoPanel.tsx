'use client';

import { useMemo } from 'react';
import type { Place } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useUiStore, type DoCategory } from '@/lib/store/ui-store';
import { useTripStore } from '@/lib/store/trip-store';
import { isRefInTrip } from '@/lib/trip';
import { PlaceCard } from '../cards/PlaceCard';
import { EmptyState } from '../../ui/primitives';

const CATEGORIES: Array<{ id: DoCategory; label: string }> = [
  { id: 'highlights', label: 'Highlights' },
  { id: 'beach', label: 'Beaches' },
  { id: 'nature', label: 'Nature' },
  { id: 'culture', label: 'Culture' },
  { id: 'food', label: 'Food' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'water', label: 'On the water' },
];

/** Places that count as a curated highlight, ranked by how much they define a trip. */
const HIGHLIGHT_TAGS = ['UNESCO', 'Temple', 'Culture', 'Sunset', 'Nature', 'Beach', 'Views', 'Iconic'];

function matchesCategory(place: Place, category: DoCategory): boolean {
  switch (category) {
    case 'highlights':
      return place.tags.some((tag) => HIGHLIGHT_TAGS.includes(tag)) || place.subcategory === 'temple';
    case 'beach':
      return place.category === 'beach';
    case 'nature':
      return place.category === 'nature';
    case 'culture':
      return place.subcategory === 'temple' || place.subcategory === 'landmark' || place.subcategory === 'museum' || place.subcategory === 'market';
    case 'food':
      return place.category === 'food';
    case 'nightlife':
      return place.category === 'nightlife' || place.subcategory === 'beach club';
    case 'water':
      return (
        place.subcategory === 'diving' ||
        place.subcategory === 'surf spot' ||
        place.subcategory === 'harbour' ||
        place.subcategory === 'island' ||
        place.tags.some((t) => /Diving|Snorkelling|Surfing|Island hopping|Kayaking/i.test(t))
      );
    default:
      return true;
  }
}

/**
 * DO shows one category at a time.
 *
 * The map follows the category, so the user never faces every marker at once —
 * which was the single biggest source of clutter in the previous build.
 */
export function DoPanel({
  destinationId,
  places,
  areaNameById,
  focusedAreaId,
  onSelectPlace,
  onHoverPlace,
  selectedPlaceId,
  onClearArea,
}: {
  destinationId: string;
  places: Place[];
  areaNameById: Map<string, string>;
  focusedAreaId: string | null;
  onSelectPlace: (place: Place) => void;
  onHoverPlace: (id: string | null) => void;
  selectedPlaceId: string | null;
  onClearArea: () => void;
}) {
  const category = useUiStore((s) => s.doCategory);
  const setDoCategory = useUiStore((s) => s.setDoCategory);
  const trip = useTripStore((s) => {
    const active = s.trips.find((t) => t.id === s.activeTripId);
    if (active && active.destinationId === destinationId) return active;
    return (
      s.trips.filter((t) => t.destinationId === destinationId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ??
      null
    );
  });

  const counts = useMemo(() => {
    const map = new Map<DoCategory, number>();
    for (const { id } of CATEGORIES) map.set(id, places.filter((p) => matchesCategory(p, id)).length);
    return map;
  }, [places]);

  const visible = useMemo(() => {
    const scoped = focusedAreaId ? places.filter((p) => p.areaId === focusedAreaId) : places;
    return scoped.filter((p) => matchesCategory(p, category));
  }, [places, category, focusedAreaId]);

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-line px-4 pb-3 pt-4">
        <h2 className="text-[19px] font-semibold tracking-[-0.015em]">What to do</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          {focusedAreaId
            ? `${visible.length} ${visible.length === 1 ? 'place' : 'places'} in ${areaNameById.get(focusedAreaId)}.`
            : 'The map shows only the category you pick, so it stays readable.'}
        </p>
        {focusedAreaId && (
          <button
            type="button"
            onClick={onClearArea}
            data-testid="area-filter-chip"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent-soft px-2.5 py-1 text-[11.5px] font-medium text-accent"
          >
            {areaNameById.get(focusedAreaId) ?? focusedAreaId}
            <span aria-hidden="true">×</span>
            <span className="sr-only">Clear area filter</span>
          </button>
        )}

        <div className="mt-2.5 flex flex-wrap gap-1">
          {CATEGORIES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={category === id}
              onClick={() => setDoCategory(id)}
              data-testid={`do-category-${id}`}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[5px] text-[11.5px] font-medium transition-colors duration-150',
                category === id
                  ? 'border-accent/25 bg-accent-soft text-accent'
                  : 'border-line bg-surface text-ink-soft hover:border-line-strong',
              )}
            >
              {label}
              <span className="tabular-nums text-faint">{counts.get(id) ?? 0}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="scroll-area min-h-0 flex-1 space-y-3 p-3">
        {visible.length === 0 ? (
          <EmptyState
            title="Nothing in this category here"
            body="Try another category, or search the whole island."
            action={
              focusedAreaId ? (
                <button type="button" className="btn-secondary btn-xs" onClick={onClearArea} data-testid="do-clear-area">
                  Search all of Bali
                </button>
              ) : undefined
            }
          />
        ) : (
          visible.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              areaName={areaNameById.get(place.areaId) ?? place.areaId}
              selected={selectedPlaceId === place.id}
              inTrip={Boolean(isRefInTrip(trip, place.id))}
              destinationId={destinationId}
              onSelect={() => onSelectPlace(place)}
              onHover={onHoverPlace}
            />
          ))
        )}
      </div>
    </div>
  );
}

export { matchesCategory, CATEGORIES };
