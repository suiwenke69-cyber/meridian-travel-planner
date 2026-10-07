'use client';

import { useMemo, useState } from 'react';
import type { DayAnchors, Destination, ItineraryItem, Place, Hotel, Trip, TripDay } from '@/lib/types';
import { formatDateShort, formatStayRange, nightCount } from '@/lib/date';

import { daySeverity } from '@/lib/efficiency';
import type { DayAnalysis } from '@/lib/types';
import { itemFromAirport } from '@/lib/trip';
import { useTripStore } from '@/lib/store/trip-store';
import { useUiStore } from '@/lib/store/ui-store';
import { useDayLegs } from '@/lib/transport/use-day-legs';
import { heroImage } from '@/lib/images';
import { cn } from '@/lib/utils';
import { useT, useName, useLocale } from '@/lib/i18n/use-t';
import type { MessageKey } from '@/lib/i18n/messages';
import { pick } from '@/lib/i18n';
import { ImageFrame } from '../../ui/ImageFrame';
import { TransportLegRow } from '../TransportLegRow';
import { TripSetupForm } from '../../planner/TripSetupForm';
import { StayEditor } from './StayEditor';
import { DayTimeline } from './DayTimeline';
import { ImportGuideCta } from '../../social/ImportGuideCta';
import { deriveTripAnchors } from '@/lib/trip-stays';
import { DEFAULT_START_TIME } from '@/lib/schedule';
import { IconArrowDown, IconArrowUp, IconClose, IconGrip, IconPlus } from '../../ui/icons';

/**
 * PLAN is where the trip becomes a shape.
 *
 * Crucially, planning is not forced on arrival: this panel shows a short setup
 * form only when the traveller chooses the tab (or taps "Add to trip" without a
 * trip). Everything the brief called "overwhelming first-run fields" — budget,
 * loyalty, style — has moved to an optional step behind "Trip preferences".
 */
export function PlanPanel({
  destination,
  destinationId,
  trip,
  analyses,
  places,
  hotels,
  areaNameById,
  activeDayId,
  onSelectDay,
  hydrated,
}: {
  destination: Destination;
  destinationId: string;
  trip: Trip | null;
  analyses: DayAnalysis[];
  places: Place[];
  hotels: Hotel[];
  areaNameById: Map<string, string>;
  activeDayId: string | null;
  onSelectDay: (dayId: string) => void;
  hydrated: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const [showPreferences, setShowPreferences] = useState(false);

  /*
   * Anchors are DERIVED, per render, from the trip's stays.
   *
   * Nothing about accommodation is stored on a day, so this cannot go stale: edit
   * a stay, change a trip date, or delete a booking and every day's start and end
   * follow immediately, with no invalidation to remember.
   *
   * Computed ABOVE the early returns on purpose. Placing it after them changed the
   * number of hooks between renders the moment a trip was created, which is the
   * one React rule that fails loudly in the browser and silently everywhere else.
   */
  const anchors = useMemo(() => (trip ? deriveTripAnchors(trip, hotels) : new Map<string, DayAnchors>()), [trip, hotels]);
  const setPanelTab = useUiStore((s) => s.setPanelTab);

  if (!hydrated) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-xs text-muted">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
        {t('plan.loadingTrips')}
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="scroll-area h-full p-3">
        {/*
          Offered BEFORE the trip form, because a guide is often the reason
          somebody opens PLAN at all: the itinerary already exists in a
          screenshot, and the form is the second thing they want.
        */}
        <ImportGuideCta className="mb-3" />
        <div className="rounded-card border border-line bg-surface">
          <TripSetupForm destination={destination} trip={null} />
        </div>
      </div>
    );
  }

  const activeDay = trip.days.find((d) => d.id === activeDayId) ?? trip.days[0] ?? null;

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-line px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label-caps">{t('plan.title')}</p>
            <h2 className="mt-1 text-[19px] font-semibold leading-tight tracking-[-0.015em]">
              {t('plan.tripDates', {
                from: formatDateShort(trip.arrivalDate, locale),
                to: formatDateShort(trip.departureDate, locale),
              })}
            </h2>
            <p className="mt-1 text-[12px] text-muted">
              {t('plan.tripSummary', {
                days: trip.days.length,
                nights: nightCount(trip.arrivalDate, trip.departureDate),
                travellers: trip.travellers,
              })}
            </p>
          </div>
          <button type="button" className="btn-secondary btn-xs shrink-0" onClick={() => setShowPreferences((v) => !v)}>
            {showPreferences ? t('app.done') : t('plan.preferences')}
          </button>
        </div>
      </header>

      {showPreferences ? (
        <div className="scroll-area min-h-0 flex-1">
          <TripSetupForm destination={destination} trip={trip} onDone={() => setShowPreferences(false)} />
          <TripStartTime trip={trip} />
        </div>
      ) : (
        <>
          <ImportGuideCta variant="row" />
          {/*
            Accommodation first, because it decides the shape of every day below
            it — but as a one-line summary with the editor behind 修改. The day is
            what PLAN is opened to work on, so the day gets the room.
          */}
          <StayEditor trip={trip} hotels={hotels} activeDayId={activeDay?.id ?? null} />
          <DayTabs trip={trip} activeDayId={activeDay?.id ?? null} analyses={analyses} onSelectDay={onSelectDay} />
          {activeDay && (
            <DayTimeline
              trip={trip}
              day={activeDay}
              anchors={anchors.get(activeDay.id) ?? EMPTY_ANCHORS}
              analysis={analyses.find((a) => a.dayId === activeDay.id)}
              places={places}
              hotels={hotels}
              areaNameById={areaNameById}
              destination={destination}
              destinationId={destinationId}
              onAddStop={() => setPanelTab('do')}
            />
          )}
        </>
      )}
    </div>
  );
}

/**
 * The trip-wide default start time.
 *
 * Sits with the other trip settings rather than on each day, because most trips
 * leave at the same time every morning and a per-day value is the exception. A
 * day that overrides it keeps its own value — changing this moves only the days
 * the traveller never touched.
 */
function TripStartTime({ trip }: { trip: Trip }) {
  const t = useT();
  const setDefaultStartTime = useTripStore((s) => s.setDefaultStartTime);
  const overriddenCount = trip.days.filter((day) => day.startTime).length;

  return (
    <section className="border-t border-line px-3 py-3" data-testid="trip-start-time">
      <p className="label-caps mb-1.5">{t('plan.tripSettings')}</p>
      <div className="flex items-center gap-2">
        <label className="text-[12px] text-ink-soft" htmlFor="trip-default-start">
          {t('plan.defaultStartTime')}
        </label>
        <input
          id="trip-default-start"
          type="time"
          className="field w-[104px] px-2 py-1 text-[12px]"
          value={trip.defaultStartTime ?? DEFAULT_START_TIME}
          data-testid="trip-default-start"
          onChange={(event) => setDefaultStartTime(trip.id, event.target.value)}
        />
      </div>
      {overriddenCount > 0 && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
          {t('plan.daysOverridden', { count: overriddenCount })}
        </p>
      )}
    </section>
  );
}

function DayTabs({
  trip,
  activeDayId,
  analyses,
  onSelectDay,
}: {
  trip: Trip;
  activeDayId: string | null;
  analyses: DayAnalysis[];
  onSelectDay: (dayId: string) => void;
}) {
  const t = useT();
  const locale = useLocale();
  return (
    <div className="shrink-0 border-b border-line">
      <div className="flex gap-1 overflow-x-auto no-scrollbar px-2 py-2" role="tablist" aria-label={t('plan.dayTablistLabel')}>
        {trip.days.map((day) => {
          const severity = daySeverity(analyses.find((a) => a.dayId === day.id));
          const active = day.id === activeDayId;
          return (
            <button
              key={day.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectDay(day.id)}
              data-testid={`day-tab-${day.index + 1}`}
              className={cn(
                'flex shrink-0 flex-col items-start rounded-lg border px-2.5 py-1.5 text-left transition-colors duration-150',
                active ? 'border-accent/40 bg-accent-soft' : 'border-line bg-surface hover:border-line-strong',
              )}
            >
              <span className="flex items-center gap-1.5 text-[11.5px] font-semibold">
                {t('plan.day', { n: day.index + 1 })}
                {severity !== 'ok' && (
                  <span
                    aria-label={severity}
                    className={cn(
                      'inline-block h-1.5 w-1.5 rounded-full',
                      severity === 'critical' ? 'bg-danger' : severity === 'warning' ? 'bg-warn' : 'bg-ocean',
                    )}
                  />
                )}
              </span>
              <span className="mt-0.5 text-[10px] text-muted">{formatDateShort(day.date, locale)}</span>
              <span className="text-[10px] text-faint">{t('unit.stops', { count: day.items.length })}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The day timeline: stops and the transport between them, in one column.
 *
 * Times are derived from curated activity durations plus MEASURED leg durations
 * only. If any leg has no routing data the whole day is marked approximate
 * rather than quietly showing a confident-looking clock.
 */
/**
 * The anchors of a day that has not been derived yet.
 *
 * Only reachable for the single render before `useMemo` settles, and an empty
 * anchor set renders as "no start, no end" rather than as anything invented.
 */
const EMPTY_ANCHORS: DayAnchors = {
  start: null,
  end: null,
  isHotelChange: false,
  missingAccommodation: false,
};

/** 90 -> 1 小时 30 分钟 / 1 h 30 min. Never a bare "90". */
function formatMinutes(minutes: number, t: ReturnType<typeof useT>): string {
  const rounded = Math.round(minutes);
  if (rounded < 60) return t('duration.minuteOnly', { m: rounded });
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return m === 0 ? t('duration.hourOnly', { h }) : t('duration.hourMinute', { h, m });
}

function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export { formatStayRange, IconGrip };
