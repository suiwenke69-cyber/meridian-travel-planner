'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Area, DayAnalysis, Hotel, Place } from '@/lib/types';
import { destinationStats, getDestinationBundle, getPrimaryAirport } from '@/lib/data';
import { analyseTrip } from '@/lib/efficiency';
import { heroImage } from '@/lib/images';
import { hydrateTripStore, useTripStore } from '@/lib/store/trip-store';
import { hydrateResearchStore } from '@/lib/research/store';
import { hydrateOriginStore } from '@/lib/store/origin-store';
import { hydrateUiStore, useUiStore, type PanelTab } from '@/lib/store/ui-store';
import { useIsDesktop } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { useT, useName } from '@/lib/i18n/use-t';
import type { MessageKey } from '@/lib/i18n/messages';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { OriginSelector } from '../region/OriginSelector';
import { BottomSheet, type SheetSnap } from '../ui/BottomSheet';
import { ImageFrame } from '../ui/ImageFrame';
import { IconArrowLeft, IconInfo } from '../ui/icons';
import { Popover } from '../ui/Popover';
import { EntityDetailCard } from './EntityDetailCard';
import { ExplorePanel } from './panels/ExplorePanel';
import { StayPanel } from './panels/StayPanel';
import { DoPanel } from './panels/DoPanel';
import { PlanPanel } from './panels/PlanPanel';

const DestinationMapView = dynamic(() => import('./DestinationMapView'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[var(--map-land)]">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
        Loading the map…
      </div>
    </div>
  ),
});

/**
 * The destination experience.
 *
 * Four steps in the order a traveller actually takes them:
 *   EXPLORE → understand the island and its regions
 *   STAY    → choose a property
 *   DO      → choose what to do
 *   PLAN    → arrange it, with transport between every stop
 *
 * The previous build opened on a trip form, which asked the user to commit
 * before they understood the destination. Now the default is EXPLORE and
 * planning is something you choose.
 */
export default function DestinationPlanner({ destinationId }: { destinationId: string }) {
  const bundle = useMemo(() => getDestinationBundle(destinationId), [destinationId]);
  const isDesktop = useIsDesktop();
  const [snap, setSnap] = useState<SheetSnap>('half');

  useEffect(() => {
    hydrateTripStore();
    hydrateUiStore();
  }, []);

  useEffect(() => {
    const ui = useUiStore.getState();
    ui.resetSelection();
    ui.setPanelTab('explore');
  }, [destinationId]);

  const hydrated = useTripStore((s) => s.hydrated);
  const trips = useTripStore((s) => s.trips);
  const activeTripId = useTripStore((s) => s.activeTripId);
  const setActiveTrip = useTripStore((s) => s.setActiveTrip);

  const trip = useMemo(() => {
    const active = trips.find((t) => t.id === activeTripId);
    if (active && active.destinationId === destinationId) return active;
    return (
      trips.filter((t) => t.destinationId === destinationId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ??
      null
    );
  }, [trips, activeTripId, destinationId]);

  /*
   * The research store is hydrated HERE as well as on /research.
   *
   * Place cards read aggregated social signals from it. Without this the
   * destination page starts with an empty store — `skipHydration` means nothing
   * is read until asked — and every card silently loses its 攻略参考 block, which
   * is exactly what happened the first time.
   */
  useEffect(() => {
    hydrateResearchStore();
    // The destination page reads the origin too: the airport card describes the
    // route from where the traveller is actually leaving from.
    hydrateOriginStore();
  }, []);

  useEffect(() => {
    if (trip && trip.id !== activeTripId) setActiveTrip(trip.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id, activeTripId]);

  const t = useT();
  const name = useName();
  const locale = useUiStore((s) => s.locale);
  const tab = useUiStore((s) => s.panelTab);
  const setPanelTab = useUiStore((s) => s.setPanelTab);
  const selectedDayId = useUiStore((s) => s.selectedDayId);
  const selectDay = useUiStore((s) => s.selectDay);
  const focusedAreaId = useUiStore((s) => s.selectedAreaId);
  const selectArea = useUiStore((s) => s.selectArea);
  const selectedEntityId = useUiStore((s) => s.selectedEntityId);
  const selectEntity = useUiStore((s) => s.selectEntity);
  const setHoveredEntity = useUiStore((s) => s.setHoveredEntity);
  const showAreas = useUiStore((s) => s.showAreas);

  const activeDay = useMemo(() => {
    if (!trip) return null;
    return trip.days.find((d) => d.id === selectedDayId) ?? trip.days[0] ?? null;
  }, [trip, selectedDayId]);

  useEffect(() => {
    if (trip && !selectedDayId && trip.days[0]) selectDay(trip.days[0].id);
  }, [trip, selectedDayId, selectDay]);

  const analyses = useMemo<DayAnalysis[]>(() => {
    if (!bundle || !trip) return [];
    return analyseTrip(trip, { destination: bundle.destination, areas: bundle.areas });
  }, [bundle, trip]);

  if (!bundle) {
    return (
      <main className="flex h-[100dvh] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-semibold">We do not have data for that destination yet.</p>
        <Link href="/" className="btn-primary btn-xs">
          <IconArrowLeft size={14} />
          Back to the map
        </Link>
      </main>
    );
  }

  const { destination, hotels, places, areas, airports } = bundle;
  const stats = destinationStats(destination.id);
  const airport = getPrimaryAirport(destination.id);
  /*
   * Area names as the reader's locale wants them, because this map is what every
   * panel labels its rows with — the DO area filter, the STAY area chip, the
   * itinerary subtitles. Building it from the canonical name left every one of
   * them in English under a Chinese interface.
   */
  const areaNameById = new Map(areas.map((a) => [a.id, locale === 'zh-CN' && a.nameZh ? a.nameZh : a.name]));

  const airportTransfers = new Map<string, { min: number; max: number }>();
  for (const transfer of airport?.transfers ?? []) {
    airportTransfers.set(transfer.areaId, { min: transfer.minutesMin, max: transfer.minutesMax });
  }

  const focusWholeIsland = () => {
    selectArea(null);
    const map = (window as unknown as { __mmMap?: { fitBounds: (b: unknown, o?: unknown) => void } }).__mmMap;
    if (map && destination.mapBounds) {
      map.fitBounds(
        [
          [destination.mapBounds[0][1], destination.mapBounds[0][0]],
          [destination.mapBounds[1][1], destination.mapBounds[1][0]],
        ],
        { padding: 60, duration: 700 },
      );
    }
  };

  const panel = (
    <DestinationPanel
      tab={tab}
      destination={destination}
      destinationId={destinationId}
      areas={areas}
      hotels={hotels}
      places={places}
      areaNameById={areaNameById}
      airportTransfers={airportTransfers}
      focusedAreaId={focusedAreaId}
      trip={trip}
      analyses={analyses}
      activeDayId={activeDay?.id ?? null}
      hydrated={hydrated}
      selectedEntityId={selectedEntityId}
      onSelectArea={(id) => {
        // An empty id is the "clear the area filter" signal from an empty state.
        selectArea(id === '' ? null : id);
        setHoveredEntity(null);
      }}
      onHoverArea={setHoveredEntity}
      onFocusWholeIsland={focusWholeIsland}
      onSelectEntity={(hotel: Hotel) => {
        selectEntity(hotel.id);
        setPanelTab('stay');
      }}
      onSelectPlace={(place: Place) => {
        selectEntity(place.id);
      }}
      onHoverEntity={setHoveredEntity}
      onSelectDay={selectDay}
    />
  );

  return (
    <main className="flex h-[100dvh] w-full flex-col overflow-hidden bg-paper" data-testid="planner-shell">
      <header className="surface-blur relative z-[520] flex shrink-0 items-center gap-2 border-b border-line px-3 py-2 sm:px-4">
        <Link href="/" className="btn-ghost btn-xs shrink-0" aria-label="Back to the Southeast Asia map" data-testid="back-to-region">
          <IconArrowLeft size={15} />
          <span className="hidden sm:inline">Southeast Asia</span>
        </Link>
        <span className="h-5 w-px shrink-0 bg-line" aria-hidden="true" />

        <div className="flex min-w-0 items-center gap-2.5">
          <ImageFrame
            image={heroImage('area', areas.find((a) => a.isStayBase)?.id ?? '')}
            variant="thumb"
            className="hidden h-8 w-8 shrink-0 rounded-md sm:block"
            showDisclosure={false}
          />
          <div className="min-w-0">
            <h1 className="truncate text-[14.5px] font-semibold leading-tight tracking-[-0.01em]">
              {name.primary(destination)}
            </h1>
            <p className="hidden truncate text-[11px] text-muted sm:block">
              {t(`country.${destination.region === 'indonesia' ? 'indonesia' : destination.country.toLowerCase()}` as MessageKey) ||
                destination.country}
              <span className="mx-1.5 text-line-strong" aria-hidden="true">
                ·
              </span>
              {t('dest.placesMapped', { count: stats.placeCount })}
            </p>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {/*
            The origin follows the traveller into the destination: the airport
            card describes the route from where they are actually leaving from,
            and the trip stores it. Changing it here is the same action as on the
            homepage, so the control is the same control.
          */}
          <OriginSelector />
          <LanguageSwitcher compact />
          {trip && (
            <span className="hidden whitespace-nowrap text-[11px] text-muted md:inline">
              {t('dest.tripSummary', {
                days: trip.days.length,
                stops: trip.days.reduce((n, d) => n + d.items.length, 0),
              })}
            </span>
          )}
          <Popover
            ariaLabel={t('misc.infoTitle')}
            align="end"
            panelClassName="w-[320px] p-3.5"
            trigger={({ toggle }) => (
              <button type="button" onClick={toggle} aria-label={t('misc.infoTitle')} className="btn-ghost btn-xs px-1.5 text-faint hover:text-ink-soft">
                <IconInfo size={14} />
              </button>
            )}
          >
            <p className="label-caps">{t('misc.infoTitle')}</p>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-soft">{t('misc.infoCoords')}</p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{t('misc.infoPrice')}</p>
          </Popover>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <div className="relative min-h-0 flex-1">
          <div className="absolute inset-0">
            <DestinationMapView destinationId={destinationId} showAreas={showAreas} />
          </div>

          {isDesktop && selectedEntityId && (
            <div className="pointer-events-none absolute inset-y-0 left-0 z-[500] flex w-[368px] flex-col justify-start p-3">
              <div className="pointer-events-auto scroll-area min-h-0">
                <EntityDetailCard
                  destinationId={destinationId}
                  entityId={selectedEntityId}
                  onClose={() => selectEntity(null)}
                />
              </div>
            </div>
          )}
        </div>

        {isDesktop && (
          <aside className="z-[510] flex w-[400px] shrink-0 flex-col border-l border-line bg-surface">{panel}</aside>
        )}
      </div>

      {!isDesktop && (
        <BottomSheet
          snap={snap}
          onSnapChange={setSnap}
          peekHeight={132}
          ariaLabel={t(DESTINATION_TABS.find((entry) => entry.id === tab)?.hint ?? 'tab.explore')}
          header={
            <div className="flex min-w-0 items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-semibold">
                  {t(DESTINATION_TABS.find((entry) => entry.id === tab)?.label ?? 'tab.explore')}
                </span>
                <span className="block truncate text-[11px] text-muted">{name.primary(destination)}</span>
              </span>
            </div>
          }
        >
          {selectedEntityId && (
            <div className="border-b border-line bg-paper p-2.5">
              <EntityDetailCard destinationId={destinationId} entityId={selectedEntityId} onClose={() => selectEntity(null)} />
            </div>
          )}
          <div className="min-h-0">{panel}</div>
        </BottomSheet>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------

/**
 * The four steps, as message keys rather than strings — this array is read in
 * several places (the tab bar, the mobile sheet header, the itinerary empty
 * state) and a hard-coded label here would leave one of them in English.
 */
const DESTINATION_TABS: Array<{ id: PanelTab; label: MessageKey; hint: MessageKey }> = [
  { id: 'explore', label: 'tab.explore', hint: 'tab.exploreHint' },
  { id: 'stay', label: 'tab.stay', hint: 'tab.stayHint' },
  { id: 'do', label: 'tab.do', hint: 'tab.doHint' },
  { id: 'plan', label: 'tab.plan', hint: 'tab.planHint' },
];

function DestinationPanel({
  tab,
  destination,
  destinationId,
  areas,
  hotels,
  places,
  areaNameById,
  airportTransfers,
  focusedAreaId,
  trip,
  analyses,
  activeDayId,
  hydrated,
  selectedEntityId,
  onSelectArea,
  onHoverArea,
  onFocusWholeIsland,
  onSelectEntity,
  onSelectPlace,
  onHoverEntity,
  onSelectDay,
}: {
  tab: PanelTab;
  destination: ReturnType<typeof getDestinationBundle> extends null ? never : NonNullable<ReturnType<typeof getDestinationBundle>>['destination'];
  destinationId: string;
  areas: Area[];
  hotels: Hotel[];
  places: Place[];
  areaNameById: Map<string, string>;
  airportTransfers: Map<string, { min: number; max: number }>;
  focusedAreaId: string | null;
  trip: ReturnType<typeof useTripStore.getState>['trips'][number] | null;
  analyses: DayAnalysis[];
  activeDayId: string | null;
  hydrated: boolean;
  selectedEntityId: string | null;
  onSelectArea: (id: string) => void;
  onHoverArea: (id: string | null) => void;
  onFocusWholeIsland: () => void;
  onSelectEntity: (hotel: Hotel) => void;
  onSelectPlace: (place: Place) => void;
  onHoverEntity: (id: string | null) => void;
  onSelectDay: (dayId: string) => void;
}) {
  const t = useT();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav className="shrink-0 border-b border-line px-2 pb-2 pt-2" aria-label={t('explore.scopeLabel')}>
        <div className="grid grid-cols-4 gap-1">
          {DESTINATION_TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                title={t(item.hint)}
                onClick={() => useUiStore.getState().setPanelTab(item.id)}
                data-testid={`dest-tab-${item.id}`}
                className={cn(
                  'relative rounded-lg px-2 py-2 text-[12.5px] font-semibold transition-colors duration-150',
                  active ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-black/[0.03] hover:text-ink-soft',
                )}
              >
                {t(item.label)}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="min-h-0 flex-1">
        {tab === 'explore' ? (
          <ExplorePanel
            destination={destination}
            areas={areas}
            hotels={hotels}
            places={places}
            airportTransfers={airportTransfers}
            focusedAreaId={focusedAreaId}
            onSelectArea={onSelectArea}
            onHoverArea={onHoverArea}
            onFocusWholeIsland={onFocusWholeIsland}
          />
        ) : tab === 'stay' ? (
          <StayPanel
            destinationId={destinationId}
            hotels={hotels}
            areaNameById={areaNameById}
            focusedAreaId={focusedAreaId}
            onSelectHotel={onSelectEntity}
            onHoverHotel={onHoverEntity}
            selectedHotelId={selectedEntityId}
            onClearArea={() => onSelectArea('')}
          />
        ) : tab === 'do' ? (
          <DoPanel
            destinationId={destinationId}
            places={places}
            areaNameById={areaNameById}
            focusedAreaId={focusedAreaId}
            onSelectPlace={onSelectPlace}
            onHoverPlace={onHoverEntity}
            selectedPlaceId={selectedEntityId}
            onClearArea={() => onSelectArea('')}
          />
        ) : (
          <PlanPanel
            destination={destination}
            destinationId={destinationId}
            trip={trip}
            analyses={analyses}
            places={places}
            hotels={hotels}
            areaNameById={areaNameById}
            activeDayId={activeDayId}
            onSelectDay={onSelectDay}
            hydrated={hydrated}
          />
        )}
      </div>
    </div>
  );
}

export { DESTINATION_TABS };
