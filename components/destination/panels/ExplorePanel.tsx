'use client';

import { useMemo } from 'react';
import type { Area, Destination, Hotel, Place } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useUiStore, type ExploreScope } from '@/lib/store/ui-store';
import { useT, useName } from '@/lib/i18n/use-t';
import type { MessageKey } from '@/lib/i18n/messages';
import { pick } from '@/lib/i18n';
import { Segmented } from '../../ui/Segmented';
import { AreaCard, AreaDetail } from '../cards/AreaCard';
import { AREA_ORDER, ZONE_ORDER, areaRank } from '@/lib/data/area-taglines';

type Scope = ExploreScope;

/**
 * EXPLORE is the default destination view and its job is orientation, not
 * booking. It answers "which part of Bali suits me?" before asking the user to
 * commit to anything.
 *
 * There is deliberately no trip form here. Planning starts when the traveller
 * chooses to start planning.
 */
/** Country name from the catalogue, falling back to the data's own string. */
function countryLabel(destination: { country: string; region: string }, t: ReturnType<typeof useT>): string {
  const key = `country.${destination.country.toLowerCase()}` as MessageKey;
  const value = t(key);
  return value === key ? destination.country : value;
}

export function ExplorePanel({
  destination,
  areas,
  hotels,
  places,
  airportTransfers,
  focusedAreaId,
  onSelectArea,
  onHoverArea,
  onFocusWholeIsland,
}: {
  destination: Destination;
  areas: Area[];
  hotels: Hotel[];
  places: Place[];
  airportTransfers: Map<string, { min: number; max: number }>;
  focusedAreaId: string | null;
  onSelectArea: (id: string) => void;
  onHoverArea: (id: string | null) => void;
  onFocusWholeIsland: () => void;
}) {
  const t = useT();
  const name = useName();
  const locale = useUiStore((s) => s.locale);
  const scope = useUiStore((s) => s.exploreScope);
  const setScope = useUiStore((s) => s.setExploreScope);
  const setPanelTab = useUiStore((s) => s.setPanelTab);
  const selectArea = useUiStore((s) => s.selectArea);

  /** Region order is driven by how much there actually is to do there. */
  const { stayAreas, dayTripAreas, counts } = useMemo(() => {
    const placeCount = new Map<string, number>();
    const hotelCount = new Map<string, number>();
    for (const place of places) placeCount.set(place.areaId, (placeCount.get(place.areaId) ?? 0) + 1);
    for (const hotel of hotels) hotelCount.set(hotel.areaId, (hotelCount.get(hotel.areaId) ?? 0) + 1);

    const substance = (a: Area, b: Area) =>
      (placeCount.get(b.id) ?? 0) + (hotelCount.get(b.id) ?? 0) * 2 -
        ((placeCount.get(a.id) ?? 0) + (hotelCount.get(a.id) ?? 0) * 2) || a.name.localeCompare(b.name);

    // Curated order first, then by how much there is to do.
    const byEditorial = (order: string[]) => (a: Area, b: Area) =>
      areaRank(a.id, order) - areaRank(b.id, order) || substance(a, b);

    return {
      stayAreas: areas.filter((a) => a.isStayBase).sort(byEditorial(AREA_ORDER)),
      dayTripAreas: areas.filter((a) => !a.isStayBase).sort(byEditorial(ZONE_ORDER)),
      counts: placeCount,
    };
  }, [areas, hotels, places]);

  const focused = focusedAreaId ? areas.find((a) => a.id === focusedAreaId) ?? null : null;

  if (focused) {
    return (
      <div className="scroll-area h-full p-3">
        <AreaDetail
          area={focused}
          hotels={hotels}
          places={places}
          airportMinutes={airportTransfers.get(focused.id) ?? null}
          onShowHotels={() => setPanelTab('stay')}
          onShowPlaces={() => setPanelTab('do')}
          onClose={() => selectArea(null)}
        />
      </div>
    );
  }

  return (
    <div className="scroll-area h-full">
      <header className="px-4 pb-3 pt-4">
        <p className="label-caps">{countryLabel(destination, t)}</p>
        <h2 className="mt-1 text-[26px] font-semibold leading-none tracking-[-0.02em] text-ink">
          {name.primary(destination)}
        </h2>
        <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">
          {pick(destination.descriptionZh, destination.description, locale)}
        </p>
        <button type="button" className="btn-secondary btn-xs mt-3" onClick={onFocusWholeIsland}>
          {t('explore.showWholeIsland')}
        </button>
      </header>

      <div className="border-t border-line px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{t('explore.whereToBase')}</h3>
          <Segmented<Scope>
            ariaLabel={t('explore.scopeLabel')}
            value={scope}
            onChange={setScope}
            size="sm"
            options={[
              { value: 'stay', label: t('explore.scopeStay'), badge: stayAreas.length },
              { value: 'daytrip', label: t('explore.scopeDaytrip'), badge: dayTripAreas.length },
            ]}
          />
        </div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
          {scope === 'stay' ? t('explore.whereToBaseHint') : t('explore.whereToBaseHintDaytrip')}
        </p>
      </div>

      <div className={cn('space-y-3 px-3 pb-4')}>
        {(scope === 'stay' ? stayAreas : dayTripAreas).map((area) => (
          <AreaCard
            key={area.id}
            area={area}
            hotels={hotels}
            places={places}
            selected={focusedAreaId === area.id}
            onSelect={onSelectArea}
            onHover={onHoverArea}
          />
        ))}
      </div>

      <footer className="border-t border-line px-4 py-3">
        <p className="text-[11.5px] leading-relaxed text-muted">
          {t('explore.regionsMapped', { count: counts.size })}
        </p>
      </footer>
    </div>
  );
}
