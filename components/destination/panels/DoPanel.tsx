'use client';

import { useMemo } from 'react';
import type { Hotel, Place } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useUiStore, type DoCategory } from '@/lib/store/ui-store';
import { useImportUiStore } from '@/lib/store/import-ui';
import { useSavedEntries } from '@/lib/research/saved';
import { SavedPlacesList } from '../../social/SavedPlacesList';
import { useTripStore } from '@/lib/store/trip-store';
import { isRefInTrip } from '@/lib/trip';
import { useT } from '@/lib/i18n/use-t';
import type { MessageKey } from '@/lib/i18n/messages';
import { DISCOVERY_CATEGORIES, placeMatchesCategory } from '@/lib/data/place-taxonomy';
import { PlaceCard } from '../cards/PlaceCard';
import { EmptyState } from '../../ui/primitives';

/**
 * DO shows one category at a time, and within it, one area at a time.
 *
 * Both filters exist because they answer different questions: the category is
 * "what kind of thing do I feel like", the area is "where am I willing to
 * drive". 美食 + 长谷 is a decision; 美食 alone across a whole island is a list.
 *
 * The matching itself lives in `lib/data/place-taxonomy` and reads each place's
 * authored `discovery` ids rather than guessing from an enum — a beach club is
 * genuinely both a beach club and nightlife, and inferring that from one field
 * lost most of it.
 */

const CATEGORY_IDS = DISCOVERY_CATEGORIES.map((c) => c.id);

export function matchesCategory(place: Place, category: DoCategory): boolean {
  return placeMatchesCategory(place, category);
}

export function DoPanel({
  destinationId,
  places,
  areaNameById,
  focusedAreaId,
  onSelectPlace,
  onSelectHotel,
  onHoverPlace,
  selectedPlaceId,
  onClearArea,
}: {
  destinationId: string;
  places: Place[];
  areaNameById: Map<string, string>;
  focusedAreaId: string | null;
  onSelectPlace: (place: Place) => void;
  onSelectHotel: (hotel: Hotel) => void;
  onHoverPlace: (id: string | null) => void;
  selectedPlaceId: string | null;
  onClearArea: () => void;
}) {
  const t = useT();
  const category = useUiStore((s) => s.doCategory);
  const setDoCategory = useUiStore((s) => s.setDoCategory);
  const selectArea = useUiStore((s) => s.selectArea);

  /*
   * DO carries 我的收藏 as a scope rather than as a fifth tab.
   *
   * The four steps are the traveller's progression and adding a fifth would
   * break it; saved places are places, and this is where places are browsed.
   * The scope lives in the import store because the MAP has to narrow with it.
   */
  const placeScope = useImportUiStore((s) => s.placeScope);
  const setPlaceScope = useImportUiStore((s) => s.setPlaceScope);
  const { entries: savedEntries, danglingCount } = useSavedEntries(destinationId);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const id of CATEGORY_IDS) map.set(id, places.filter((p) => placeMatchesCategory(p, id)).length);
    return map;
  }, [places]);

  /** Areas that actually hold something in the selected category, with counts. */
  const areaCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const place of places) {
      if (!placeMatchesCategory(place, category)) continue;
      map.set(place.areaId, (map.get(place.areaId) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [places, category]);

  const visible = useMemo(() => {
    const scoped = focusedAreaId ? places.filter((p) => p.areaId === focusedAreaId) : places;
    return scoped
      .filter((p) => placeMatchesCategory(p, category))
      .sort((a, b) => {
        // Photographed places first: a screen of empty cards is a poor first impression.
        const aHas = a.images.length > 0 ? 0 : 1;
        const bHas = b.images.length > 0 ? 0 : 1;
        if (aHas !== bHas) return aHas - bHas;
        return a.name.localeCompare(b.name);
      });
  }, [places, category, focusedAreaId]);

  const areaLabel = focusedAreaId ? (areaNameById.get(focusedAreaId) ?? focusedAreaId) : null;

  const trip = useTripStore((s) => {
    const active = s.trips.find((t) => t.id === s.activeTripId);
    if (active && active.destinationId === destinationId) return active;
    return (
      s.trips.filter((t) => t.destinationId === destinationId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ??
      null
    );
  });

  if (placeScope === 'saved') {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 gap-1 border-b border-line px-3 py-2" role="tablist">
          {(
            [
              { id: 'all' as const, label: t('do.scopeAll') },
              { id: 'saved' as const, label: t('do.scopeSaved') },
            ]
          ).map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={placeScope === entry.id}
              onClick={() => setPlaceScope(entry.id)}
              data-testid={`do-scope-${entry.id}`}
              className={cn(
                'flex-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition-colors duration-150',
                placeScope === entry.id ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-black/[0.03] hover:text-ink-soft',
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1">
          <SavedPlacesList
            destinationId={destinationId}
            areaNameById={areaNameById}
            entries={savedEntries}
            danglingCount={danglingCount}
            onSelectPlace={onSelectPlace}
            onSelectHotel={onSelectHotel}
            onHover={onHoverPlace}
            selectedEntityId={selectedPlaceId}
          />
        </div>
      </div>
    );
  }


  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-line px-4 pb-3 pt-4">
        <h2 className="text-[19px] font-semibold tracking-[-0.015em]">{t('do.title')}</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          {areaLabel ? t('do.restaurantsIn', { area: areaLabel }) : t('do.subtitle')}
        </p>

        <div className="mt-2.5 flex gap-1" role="tablist">
          {(
            [
              { id: 'all' as const, label: t('do.scopeAll') },
              { id: 'saved' as const, label: `${t('do.scopeSaved')} · ${savedEntries.length}` },
            ]
          ).map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={placeScope === entry.id}
              onClick={() => setPlaceScope(entry.id)}
              data-testid={`do-scope-${entry.id}`}
              className={cn(
                'flex-1 rounded-lg border px-2 py-1.5 text-[12px] font-semibold transition-colors duration-150',
                placeScope === entry.id
                  ? 'border-accent/25 bg-accent-soft text-accent'
                  : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink-soft',
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1" data-testid="do-categories">
          {DISCOVERY_CATEGORIES.map((entry) => {
            const active = category === entry.id;
            const count = categoryCounts.get(entry.id) ?? 0;
            return (
              <button
                key={entry.id}
                type="button"
                aria-pressed={active}
                onClick={() => setDoCategory(entry.id as DoCategory)}
                data-testid={`do-category-${entry.id}`}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[5px] text-[11.5px] font-medium transition-colors duration-150',
                  active
                    ? 'border-accent/25 bg-accent-soft text-accent'
                    : 'border-line bg-surface text-ink-soft hover:border-line-strong',
                )}
              >
                {t(`cat.${entry.id}` as MessageKey)}
                <span className="tabular-nums text-faint">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Area row — only areas that hold something in this category */}
        {areaCounts.length > 1 && (
          <div className="mt-2 border-t border-line pt-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="label-caps">{t('do.filterByArea')}</span>
              {focusedAreaId && (
                <button type="button" className="btn-ghost btn-xs text-muted" data-testid="do-clear-area" onClick={onClearArea}>
                  {t('do.showAllAreas')}
                </button>
              )}
            </div>
            <div className="no-scrollbar flex gap-1 overflow-x-auto pb-0.5" data-testid="do-areas">
              {areaCounts.map(([areaId, count]) => {
                const active = focusedAreaId === areaId;
                return (
                  <button
                    key={areaId}
                    type="button"
                    aria-pressed={active}
                    data-testid={`do-area-${areaId}`}
                    onClick={() => selectArea(active ? null : areaId)}
                    className={cn(
                      'shrink-0 rounded-full border px-2 py-[3px] text-[11px] transition-colors',
                      active
                        ? 'border-accent/30 bg-accent text-white'
                        : 'border-line bg-surface text-ink-soft hover:border-line-strong',
                    )}
                  >
                    {areaNameById.get(areaId) ?? areaId}
                    <span className={cn('ml-1 tabular-nums', active ? 'text-white/70' : 'text-faint')}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* A removable chip, so an area inherited from the map is never invisible */}
        {focusedAreaId && areaCounts.length <= 1 && (
          <button
            type="button"
            onClick={onClearArea}
            data-testid="area-filter-chip"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent-soft px-2.5 py-1 text-[11.5px] font-medium text-accent"
          >
            {areaLabel}
            <span aria-hidden="true">×</span>
            <span className="sr-only">{t('do.clearArea')}</span>
          </button>
        )}

        <p className="mt-2 text-[11.5px] tabular-nums text-faint">
          {t('do.resultCount', { count: visible.length })}
        </p>
      </header>

      <div className="scroll-area min-h-0 flex-1 space-y-3 p-3">
        {visible.length === 0 ? (
          <EmptyState
            title={t('do.emptyTitle')}
            body={focusedAreaId ? t('do.emptyInArea', { area: areaLabel ?? '' }) : t('do.emptyCategory')}
            action={
              focusedAreaId ? (
                <button type="button" className="btn-secondary btn-xs" onClick={onClearArea} data-testid="do-clear-area">
                  {t('do.showAllAreas')}
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

export { DISCOVERY_CATEGORIES as CATEGORIES };
