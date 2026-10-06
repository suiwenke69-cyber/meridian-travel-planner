'use client';

import { useMemo, useState } from 'react';
import type { Hotel, HotelGroupId } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useTripStore } from '@/lib/store/trip-store';
import { isRefInTrip } from '@/lib/trip';
import { HotelCard } from '../cards/HotelCard';
import { EmptyState } from '../../ui/primitives';
import { useT } from '@/lib/i18n/use-t';

type GroupFilter = 'all' | HotelGroupId;

/**
 * STAY is hotel exploration, not a booking funnel.
 *
 * Marriott and Hilton are distinguishable by the marker shape and letter-mark
 * they already carry on the map, so the filter is plain text rather than two
 * loud brand colours competing with the photography.
 */
export function StayPanel({
  destinationId,
  hotels,
  areaNameById,
  focusedAreaId,
  onSelectHotel,
  onHoverHotel,
  selectedHotelId,
  onClearArea,
}: {
  destinationId: string;
  hotels: Hotel[];
  areaNameById: Map<string, string>;
  focusedAreaId: string | null;
  onSelectHotel: (hotel: Hotel) => void;
  onHoverHotel: (id: string | null) => void;
  selectedHotelId: string | null;
  onClearArea: () => void;
}) {
  const t = useT();
  const [group, setGroup] = useState<GroupFilter>('all');
  const trip = useTripStore((s) => {
    const active = s.trips.find((t) => t.id === s.activeTripId);
    if (active && active.destinationId === destinationId) return active;
    return (
      s.trips.filter((t) => t.destinationId === destinationId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ??
      null
    );
  });

  const scoped = useMemo(() => {
    let list = hotels;
    if (group !== 'all') list = list.filter((h) => h.hotelGroup === group);
    if (focusedAreaId) list = list.filter((h) => h.areaId === focusedAreaId);
    // Properties we can actually show you come first, then by tier. A first
    // screen of empty placeholders is a poor introduction to Bali.
    return list.sort((a, b) => {
      const aHas = a.images.length > 0 ? 0 : 1;
      const bHas = b.images.length > 0 ? 0 : 1;
      if (aHas !== bHas) return aHas - bHas;
      return a.priceTier.length - b.priceTier.length || a.name.localeCompare(b.name);
    });
  }, [hotels, group, focusedAreaId]);

  const marriottCount = hotels.filter((h) => h.hotelGroup === 'marriott').length;
  const hiltonCount = hotels.filter((h) => h.hotelGroup === 'hilton').length;
  const focusedAreaName = focusedAreaId ? areaNameById.get(focusedAreaId) : null;
  /** Never hard-code a list size in copy: it goes stale the moment data changes. */
  const destinationTotals = hotels.length;

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-line px-4 pb-3 pt-4">
        <h2 className="text-[19px] font-semibold tracking-[-0.015em]">{t('stay.title')}</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          {focusedAreaName ? t('stay.subtitleInArea', { area: focusedAreaName }) : t('stay.subtitleAll')}
        </p>

        {focusedAreaName && (
          <button
            type="button"
            onClick={onClearArea}
            data-testid="area-filter-chip"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent-soft px-2.5 py-1 text-[11.5px] font-medium text-accent"
          >
            {focusedAreaName}
            <span aria-hidden="true">×</span>
            <span className="sr-only">{t('stay.clearArea')}</span>
          </button>
        )}

        <div className="mt-2.5 flex flex-wrap gap-1">
          {(
            [
              ['all', t('stay.filterAll'), hotels.length],
              ['marriott', t('stay.filterMarriott'), marriottCount],
              ['hilton', t('stay.filterHilton'), hiltonCount],
            ] as Array<[GroupFilter, string, number]>
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              aria-pressed={group === id}
              onClick={() => setGroup(id)}
              data-testid={`stay-filter-${id}`}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[5px] text-[11.5px] font-medium transition-colors duration-150',
                group === id
                  ? 'border-accent/25 bg-accent-soft text-accent'
                  : 'border-line bg-surface text-ink-soft hover:border-line-strong',
              )}
            >
              {id !== 'all' && (
                <span
                  aria-hidden="true"
                  className={cn('inline-block h-2.5 w-2.5', id === 'marriott' ? 'rounded-[2px] bg-marriott' : 'rounded-full bg-hilton')}
                />
              )}
              {label}
              <span className="tabular-nums text-faint">{count}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="scroll-area min-h-0 flex-1 space-y-3 p-3">
        {scoped.length === 0 ? (
          <EmptyState
            title={t('stay.emptyTitle')}
            body={
              focusedAreaName
                ? t('stay.emptyInArea', { area: focusedAreaName, total: destinationTotals })
                : t('stay.emptyFilter')
            }
            action={
              focusedAreaName ? (
                <button type="button" className="btn-secondary btn-xs" onClick={onClearArea} data-testid="stay-clear-area">
                  {t('stay.showAllIsland')}
                </button>
              ) : undefined
            }
          />
        ) : (
          scoped.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              areaName={areaNameById.get(hotel.areaId) ?? hotel.areaId}
              selected={selectedHotelId === hotel.id}
              inTrip={Boolean(isRefInTrip(trip, hotel.id))}
              destinationId={destinationId}
              onSelect={() => onSelectHotel(hotel)}
              onHover={onHoverHotel}
            />
          ))
        )}
      </div>

      <footer className="shrink-0 border-t border-line px-4 py-2.5">
        <p className="text-[11px] leading-relaxed text-faint">
          Price shown as a positioning tier, never a nightly rate — the basis is on each property.
        </p>
      </footer>
    </div>
  );
}
