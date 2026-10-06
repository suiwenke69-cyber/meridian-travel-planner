'use client';

import { useMemo, useState } from 'react';
import type { Destination, ItineraryItem, Place, Hotel, Trip, TripDay } from '@/lib/types';
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
import { ImportGuideCta } from '../../social/ImportGuideCta';
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
        </div>
      ) : (
        <>
          <ImportGuideCta variant="row" />
          <DayTabs trip={trip} activeDayId={activeDay?.id ?? null} analyses={analyses} onSelectDay={onSelectDay} />
          {activeDay && (
            <DayTimeline
              trip={trip}
              day={activeDay}
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
function DayTimeline({
  trip,
  day,
  analysis,
  places,
  hotels,
  areaNameById,
  destination,
  destinationId,
  onAddStop,
}: {
  trip: Trip;
  day: TripDay;
  analysis?: DayAnalysis;
  places: Place[];
  hotels: Hotel[];
  areaNameById: Map<string, string>;
  destination: Destination;
  destinationId: string;
  onAddStop: () => void;
}) {
  const t = useT();
  const n = useName();
  const locale = useLocale();
  const { legs, loading, totals } = useDayLegs(day);
  const addItem = useTripStore((s) => s.addItem);
  const removeItem = useTripStore((s) => s.removeItem);
  const reorderItem = useTripStore((s) => s.reorderItem);
  const selectedItemId = useUiStore((s) => s.selectedItemId);
  const selectItem = useUiStore((s) => s.selectItem);
  const selectLeg = useUiStore((s) => s.selectLeg);
  const selectedLegId = useUiStore((s) => s.selectedLegId);
  const setHoveredItem = useUiStore((s) => s.setHoveredItem);
  const requestFocus = useUiStore((s) => s.requestFocus);

  const startMinutes = 9 * 60;

  const schedule = useMemo(() => {
    let clock = startMinutes;
    const rows: Array<{ item: ItineraryItem; time: string }> = [];
    day.items.forEach((item, index) => {
      rows.push({ item, time: formatClock(clock) });
      clock += item.durationMin ?? 0;
      const leg = legs[index];
      if (leg?.durationSeconds != null) clock += Math.round(leg.durationSeconds / 60);
    });
    return rows;
  }, [day.items, legs]);

  const partial = totals.unavailable > 0;
  const crossAreaCount = analysis?.crossAreaHops ?? 0;

  const lookup = useMemo(() => {
    const map = new Map<string, { image?: ReturnType<typeof heroImage>; subtitle: string }>();
    for (const item of day.items) {
      const place = places.find((p) => p.id === item.refId);
      const hotel = hotels.find((h) => h.id === item.refId);
      const source = place ?? hotel;
      map.set(item.id, {
        image: source ? heroImage(place ? 'place' : 'hotel', source.id) : undefined,
        subtitle: [item.areaName ?? areaNameById.get(item.areaId ?? ''), item.durationMin ? formatMinutes(item.durationMin, t) : null]
          .filter(Boolean)
          .join(' · '),
      });
    }
    return map;
  }, [day.items, places, hotels, areaNameById, t]);

  return (
    <div className="scroll-area min-h-0 flex-1 px-3 py-3">
      {/* day summary */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
        <span className="font-semibold text-ink">{t('plan.day', { n: day.index + 1 })}</span>
        {day.items.length === 0 ? (
          <span className="text-muted">{t('plan.nothingPlanned')}</span>
        ) : loading ? (
          <span className="text-muted">{t('plan.measuringTravel')}</span>
        ) : (
          <>
            {totals.measured > 0 && (
              <span className="tabular-nums text-ink-soft">
                {t('plan.travelTotal', {
                  distance: t('unit.km', { value: (totals.distanceMeters / 1000).toFixed(1) }),
                  duration: formatMinutes(totals.durationSeconds / 60, t),
                })}
              </span>
            )}
            {partial && (
              <span className="rounded-full border border-warn/30 bg-warn/[0.07] px-2 py-[2px] text-[10.5px] font-medium text-warn">
                {t('plan.legsUnavailable', { count: totals.unavailable })}
              </span>
            )}
            {crossAreaCount >= 2 && (
              <span className="rounded-full border border-line px-2 py-[2px] text-[10.5px] text-muted">
                {t('plan.crossesAreas', { count: crossAreaCount + 1 })}
              </span>
            )}
          </>
        )}
      </div>

      {day.items.length === 0 ? (
        <div className="rounded-card border border-dashed border-line-strong bg-paper px-4 py-8 text-center">
          <p className="text-[13px] font-semibold text-ink">{t('plan.dayEmpty', { n: day.index + 1 })}</p>
          <p className="mx-auto mt-1.5 max-w-[34ch] text-[12px] leading-relaxed text-muted">
            {t('plan.dayEmptyHint')}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            <button type="button" className="btn-secondary btn-xs" onClick={onAddStop}>
              {t('plan.findPlaces')}
            </button>
            {destination.airports[0] && (
              <button
                type="button"
                className="btn-secondary btn-xs"
                onClick={() =>
                  addItem(
                    trip.id,
                    day.id,
                    itemFromAirport(destination.airports[0], day.index === 0 ? 'arrival' : 'departure'),
                  )
                }
              >
                {t('plan.addAirport', {
                  code: destination.airports[0].code,
                  kind: t(day.index === 0 ? 'plan.arrivalLabel' : 'plan.departureLabel'),
                })}
              </button>
            )}
          </div>
        </div>
      ) : (
        <ol className="space-y-0">
          {schedule.map(({ item, time }, index) => {
            const leg = legs[index];
            const meta = lookup.get(item.id);
            const selected = selectedItemId === item.id;
            return (
              <li key={item.id}>
                <div
                  className={cn(
                    'group flex gap-2.5 rounded-lg p-2 transition-colors duration-150',
                    selected ? 'bg-accent-soft' : 'hover:bg-black/[0.025]',
                  )}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  data-testid={`itinerary-item-${item.id}`}
                >
                  <div className="w-[42px] shrink-0 pt-0.5 text-right">
                    <span className="block text-[11.5px] font-semibold tabular-nums text-ink-soft">{time}</span>
                    {partial && <span className="block text-[9.5px] text-faint">{t('plan.timeApprox')}</span>}
                  </div>

                  <button
                    type="button"
                    className="shrink-0"
                    onClick={() => {
                      selectItem(item.id);
                      requestFocus(item.lat, item.lng, 14);
                    }}
                    aria-label={t('label.showOnMap')}
                  >
                    <ImageFrame
                      image={meta?.image}
                      variant="thumb"
                      className="w-12 rounded-md"
                      showDisclosure={false}
                      fallbackLabel={pick(item.nameZh, item.name, locale)}
                    />
                  </button>

                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="block w-full text-left"
                      onClick={() => {
                        selectItem(item.id);
                        requestFocus(item.lat, item.lng, 14);
                      }}
                    >
                      <span className="block text-[13.5px] font-semibold leading-snug tracking-[-0.005em] text-ink">
                        {pick(item.nameZh, item.name, locale)}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-muted">{meta?.subtitle || item.kind}</span>
                    </button>
                  </div>

                  <div className="flex shrink-0 items-start gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <button
                      type="button"
                      className="btn-ghost btn-xs px-1"
                      onClick={() => index > 0 && reorderItem(trip.id, day.id, item.id, index - 1)}
                      disabled={index === 0}
                      aria-label={t('plan.moveEarlier')}
                      data-testid={`move-up-${item.id}`}
                    >
                      <IconArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost btn-xs px-1"
                      onClick={() => index < day.items.length - 1 && reorderItem(trip.id, day.id, item.id, index + 1)}
                      disabled={index === day.items.length - 1}
                      aria-label={t('plan.moveLater')}
                      data-testid={`move-down-${item.id}`}
                    >
                      <IconArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost btn-xs px-1 text-muted hover:text-danger"
                      onClick={() => removeItem(trip.id, item.id)}
                      aria-label={t('plan.remove')}
                      data-testid={`remove-item-${item.id}`}
                    >
                      <IconClose size={13} />
                    </button>
                  </div>
                </div>

                {leg && (
                  <TransportLegRow
                    leg={leg}
                    selected={selectedLegId === leg.id}
                    onSelect={() => {
                      selectLeg(leg.id);
                      requestFocus(
                        (item.lat + (day.items[index + 1]?.lat ?? item.lat)) / 2,
                        (item.lng + (day.items[index + 1]?.lng ?? item.lng)) / 2,
                        12,
                      );
                    }}
                    onHover={(id) => setHoveredItem(id)}
                  />
                )}
              </li>
            );
          })}

          <li className="pt-2">
            <button
              type="button"
              className="btn-ghost btn-xs w-full border border-dashed border-line-strong text-muted"
              onClick={onAddStop}
            >
              <IconPlus size={13} />
              {t('plan.addAnotherStop')}
            </button>
          </li>
        </ol>
      )}

      {analysis && analysis.suggestions.length > 0 && (
        <section className="mt-4 rounded-card border border-line bg-paper px-3 py-2.5">
          <p className="label-caps mb-1.5">{t('plan.routeNotes')}</p>
          <ul className="space-y-2">
            {analysis.suggestions.slice(0, 3).map((suggestion) => (
              <li key={suggestion.id} className="text-[11.5px] leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink">{suggestion.title}. </span>
                {suggestion.detail}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
            {t('plan.routeNotesDisclaimer')}
          </p>
        </section>
      )}

      <p className="mt-3 text-[10.5px] leading-relaxed text-faint">
        {t('plan.timeDisclaimer')}
        {destinationId ? '' : ''}
      </p>
    </div>
  );
}

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
