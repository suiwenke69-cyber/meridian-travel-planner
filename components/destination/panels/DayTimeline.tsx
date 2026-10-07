'use client';

import { useMemo } from 'react';
import type { DayAnalysis, DayAnchors, DayAnchor, Destination, Hotel, ItineraryItem, Place, Trip, TripDay } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useT, useName, useLocale } from '@/lib/i18n/use-t';
import { pick } from '@/lib/i18n';
import type { MessageKey } from '@/lib/i18n/messages';
import { useTripStore } from '@/lib/store/trip-store';
import { useUiStore } from '@/lib/store/ui-store';
import { useDayLegs } from '@/lib/transport/use-day-legs';
import { buildDaySchedule, DEFAULT_START_TIME, dayStartMinutes, formatClock } from '@/lib/schedule';
import { formatDateShort } from '@/lib/date';
import { heroImage } from '@/lib/images';
import { itemFromAirport } from '@/lib/trip';
import { ImageFrame } from '../../ui/ImageFrame';
import { TransportLegRow } from '../TransportLegRow';
import { IconAlert, IconArrowDown, IconArrowUp, IconClose, IconPlus } from '../../ui/icons';

/**
 * One day, with its anchors.
 *
 * The anchors are what changed. A day is no longer "a list of stops that starts
 * wherever the first stop happens to be" — it is a route from where the traveller
 * wakes up to where they sleep, and the stops sit between those two facts. That
 * makes a hotel-change day fall out of the data instead of being something the
 * traveller has to express by adding two hotels to one day and hoping.
 *
 * The anchors are deliberately QUIETER than attractions: a tinted row rather than
 * a card with a photograph. They establish the day's geography without competing
 * with the things the traveller actually chose to do.
 */
export function DayTimeline({
  trip,
  day,
  anchors,
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
  anchors: DayAnchors;
  analysis?: DayAnalysis;
  places: Place[];
  hotels: Hotel[];
  areaNameById: Map<string, string>;
  destination: Destination;
  destinationId: string;
  onAddStop: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const { legs, loading, totals } = useDayLegs(day, anchors);
  const addItem = useTripStore((s) => s.addItem);
  const removeItem = useTripStore((s) => s.removeItem);
  const reorderItem = useTripStore((s) => s.reorderItem);
  const setDayStartTime = useTripStore((s) => s.setDayStartTime);
  const patchItem = useTripStore((s) => s.patchItem);
  const selectedItemId = useUiStore((s) => s.selectedItemId);
  const selectItem = useUiStore((s) => s.selectItem);
  const selectLeg = useUiStore((s) => s.selectLeg);
  const selectedLegId = useUiStore((s) => s.selectedLegId);
  const setHoveredItem = useUiStore((s) => s.setHoveredItem);
  const requestFocus = useUiStore((s) => s.requestFocus);

  const schedule = useMemo(
    () => buildDaySchedule({ trip, day, anchors, legs }),
    [trip, day, anchors, legs],
  );

  const partial = totals.unavailable > 0;
  const crossAreaCount = analysis?.crossAreaHops ?? 0;
  const overridden = Boolean(day.startTime);
  const startLabel = formatClock(dayStartMinutes(trip, day));

  const lookup = useMemo(() => {
    const map = new Map<string, { image?: ReturnType<typeof heroImage>; subtitle: string }>();
    for (const item of day.items) {
      const place = places.find((p) => p.id === item.refId);
      const hotel = hotels.find((h) => h.id === item.refId);
      const source = place ?? hotel;
      map.set(item.id, {
        image: source ? heroImage(place ? 'place' : 'hotel', source.id) : undefined,
        subtitle: [item.areaName ?? areaNameById.get(item.areaId ?? ''), item.durationMin ? shortDuration(item.durationMin, t) : null]
          .filter(Boolean)
          .join(' · '),
      });
    }
    return map;
  }, [day.items, places, hotels, areaNameById, t]);

  const itemIndexById = new Map(day.items.map((item, index) => [item.id, index]));

  return (
    <div className="scroll-area min-h-0 flex-1 px-3 py-3">
      {/* --- day summary ------------------------------------------------- */}
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
        <span className="font-semibold text-ink">
          {t('plan.day', { n: day.index + 1 })}
          <span className="ml-1.5 font-normal text-faint">{formatDateShort(day.date, locale)}</span>
        </span>

        {anchors.isHotelChange && (
          <span
            className="rounded-full border border-accent/30 bg-accent-soft px-2 py-[2px] text-[10.5px] font-semibold text-accent"
            data-testid={`hotel-change-${day.id}`}
          >
            {t('plan.hotelChangeDay')}
          </span>
        )}

        {loading ? (
          <span className="text-muted">{t('plan.measuringTravel')}</span>
        ) : (
          <>
            {totals.measured > 0 && (
              <span className="tabular-nums text-ink-soft">
                {t('plan.travelTotal', {
                  distance: t('unit.km', { value: (totals.distanceMeters / 1000).toFixed(1) }),
                  duration: shortDuration(totals.durationSeconds / 60, t),
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

      {/* --- per-day start time ------------------------------------------ */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <label className="text-[11px] text-faint" htmlFor={`day-start-${day.id}`}>
          {t('plan.startTime')}
        </label>
        <input
          id={`day-start-${day.id}`}
          type="time"
          className="field w-[92px] px-1.5 py-1 text-[11.5px]"
          value={day.startTime ?? trip.defaultStartTime ?? DEFAULT_START_TIME}
          data-testid={`day-start-${day.id}`}
          onChange={(event) => setDayStartTime(trip.id, day.id, event.target.value)}
        />
        {overridden && (
          <button
            type="button"
            className="btn-ghost btn-xs text-muted"
            data-testid={`day-start-reset-${day.id}`}
            onClick={() => setDayStartTime(trip.id, day.id, undefined)}
          >
            {t('plan.useDefaultStart')}
          </button>
        )}
        {!overridden && <span className="text-[10.5px] text-faint">{startLabel}</span>}
      </div>

      {/* --- missing accommodation, stated not invented ------------------ */}
      {anchors.missingAccommodation && (
        <p
          className="mb-2 flex items-start gap-1.5 rounded-lg border border-warn/30 bg-warn/[0.06] px-2.5 py-1.5 text-[11.5px] leading-relaxed text-warn"
          data-testid={`unbooked-day-${day.id}`}
        >
          <IconAlert size={12} className="mt-[2px] shrink-0" />
          {t('plan.unbookedNight', { date: formatDateShort(day.date, locale) })}
        </p>
      )}

      {/* --- the route ---------------------------------------------------- */}
      {day.items.length === 0 && !anchors.start && !anchors.end ? (
        <EmptyDay
          day={day}
          destination={destination}
          onAddStop={onAddStop}
          onAddAirport={() =>
            destination.airports[0] &&
            addItem(trip.id, day.id, itemFromAirport(destination.airports[0], day.index === 0 ? 'arrival' : 'departure'))
          }
        />
      ) : (
        <ol className="space-y-0" data-testid={`day-route-${day.id}`}>
          {schedule.entries.map((entry) => {
            if (entry.kind === 'anchor') {
              return (
                <AnchorRow
                  key={`${entry.role}-${entry.id}`}
                  anchor={entry.anchor}
                  role={entry.role}
                  clockLabel={entry.clockLabel}
                  onSelect={() => requestFocus(entry.anchor.lat, entry.anchor.lng, 14)}
                />
              );
            }
            if (entry.kind === 'leg') {
              return entry.leg ? (
                <TransportLegRow
                  key={entry.id}
                  leg={entry.leg}
                  selected={selectedLegId === entry.leg.id}
                  onSelect={() => {
                    selectLeg(entry.leg!.id);
                    requestFocus(entry.leg!.geometry?.[0]?.lat ?? 0, entry.leg!.geometry?.[0]?.lng ?? 0, 11);
                  }}
                  onHover={(id) => setHoveredItem(id)}
                />
              ) : (
                <li key={entry.id} className="py-1 text-center text-[10.5px] text-faint">
                  {t('plan.legsUnavailable', { count: 1 })}
                </li>
              );
            }

            const index = itemIndexById.get(entry.item.id) ?? 0;
            const meta = lookup.get(entry.item.id);
            const selected = selectedItemId === entry.item.id;
            const legacyHotel = isHotelKind(entry.item.kind);
            return (
              <li key={entry.id}>
                <div
                  className={cn(
                    'group flex gap-2.5 rounded-lg p-2 transition-colors duration-150',
                    selected ? 'bg-accent-soft' : 'hover:bg-black/[0.025]',
                  )}
                  onMouseEnter={() => setHoveredItem(entry.item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  data-testid={`itinerary-item-${entry.item.id}`}
                >
                  <div className="w-[46px] shrink-0 pt-0.5 text-right">
                    <span
                      className={cn(
                        'block text-[11.5px] font-semibold tabular-nums',
                        entry.lateMinutes > 0 ? 'text-danger' : 'text-ink-soft',
                      )}
                      data-testid={`item-time-${entry.item.id}`}
                    >
                      {entry.clockLabel}
                    </span>
                    {entry.item.fixedTime && (
                      <span className="block text-[9px] font-medium text-accent">{t('plan.fixedTime')}</span>
                    )}
                    {!entry.item.fixedTime && partial && (
                      <span className="block text-[9.5px] text-faint">{t('plan.timeApprox')}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="shrink-0"
                    onClick={() => {
                      selectItem(entry.item.id);
                      requestFocus(entry.item.lat, entry.item.lng, 14);
                    }}
                    aria-label={t('label.showOnMap')}
                  >
                    <ImageFrame
                      image={meta?.image}
                      variant="thumb"
                      className="w-12 rounded-md"
                      showDisclosure={false}
                      fallbackLabel={pick(entry.item.nameZh, entry.item.name, locale)}
                    />
                  </button>

                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="block w-full text-left"
                      onClick={() => {
                        selectItem(entry.item.id);
                        requestFocus(entry.item.lat, entry.item.lng, 14);
                      }}
                    >
                      <span className="block text-[13.5px] font-semibold leading-snug tracking-[-0.005em] text-ink">
                        {pick(entry.item.nameZh, entry.item.name, locale)}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-muted">
                        {meta?.subtitle || entry.item.kind}
                      </span>
                    </button>

                    {/* Waiting time is only shown when it is real and useful. */}
                    {entry.waitMinutes > 0 && (
                      <p className="mt-1 text-[11px] text-accent" data-testid={`item-wait-${entry.item.id}`}>
                        {t('plan.waitFor', { minutes: shortDuration(entry.waitMinutes, t) })}
                      </p>
                    )}
                    {entry.lateMinutes > 0 && (
                      <p
                        className="mt-1 flex items-start gap-1 text-[11px] font-medium text-danger"
                        data-testid={`item-conflict-${entry.item.id}`}
                      >
                        <IconAlert size={11} className="mt-[2px] shrink-0" />
                        {t('plan.conflictLate', { minutes: shortDuration(entry.lateMinutes, t) })}
                      </p>
                    )}

                    {/* A fixed time is a booking; editing it is deliberate. */}
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <label className="text-[10.5px] text-faint" htmlFor={`fixed-${entry.item.id}`}>
                        {t('plan.fixedTime')}
                      </label>
                      <input
                        id={`fixed-${entry.item.id}`}
                        type="time"
                        className="field w-[86px] px-1 py-[2px] text-[11px]"
                        value={entry.item.fixedTime ?? ''}
                        data-testid={`item-fixed-${entry.item.id}`}
                        onChange={(event) =>
                          patchItem(trip.id, day.id, entry.item.id, { fixedTime: event.target.value || undefined })
                        }
                      />
                      {entry.item.fixedTime && (
                        <button
                          type="button"
                          className="btn-ghost btn-xs text-muted"
                          onClick={() => patchItem(trip.id, day.id, entry.item.id, { fixedTime: undefined })}
                        >
                          {t('plan.fixedTimeUnset')}
                        </button>
                      )}
                    </div>

                    {legacyHotel && (
                      <p className="mt-1 text-[10.5px] leading-relaxed text-faint" data-testid={`legacy-hotel-${entry.item.id}`}>
                        {t('plan.legacyHotelRowHint')}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-start gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <button
                      type="button"
                      className="btn-ghost btn-xs px-1"
                      onClick={() => index > 0 && reorderItem(trip.id, day.id, entry.item.id, index - 1)}
                      disabled={index === 0}
                      aria-label={t('plan.moveEarlier')}
                      data-testid={`move-up-${entry.item.id}`}
                    >
                      <IconArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost btn-xs px-1"
                      onClick={() =>
                        index < day.items.length - 1 && reorderItem(trip.id, day.id, entry.item.id, index + 1)
                      }
                      disabled={index === day.items.length - 1}
                      aria-label={t('plan.moveLater')}
                      data-testid={`move-down-${entry.item.id}`}
                    >
                      <IconArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost btn-xs px-1 text-muted hover:text-danger"
                      onClick={() => removeItem(trip.id, entry.item.id)}
                      aria-label={t('plan.remove')}
                      data-testid={`remove-item-${entry.item.id}`}
                    >
                      <IconClose size={13} />
                    </button>
                  </div>
                </div>
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

      {schedule.conflicts.length > 0 && (
        <p className="mt-3 text-[10.5px] leading-relaxed text-faint">{t('plan.fixedTimeCaveat')}</p>
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
          <p className="mt-2 text-[10.5px] leading-relaxed text-faint">{t('plan.routeNotesDisclaimer')}</p>
        </section>
      )}

      <p className="mt-3 text-[10.5px] leading-relaxed text-faint">
        {t('plan.timeDisclaimer')}
        {destinationId ? '' : ''}
      </p>
    </div>
  );
}

/**
 * A hotel anchor.
 *
 * Tinted and flat rather than a photograph card, because it is context for the
 * day rather than a thing the traveller chose to visit — but it names the hotel
 * and says which of the two facts it is, so the geography of the day is never
 * ambiguous.
 */
function AnchorRow({
  anchor,
  role,
  clockLabel,
  onSelect,
}: {
  anchor: DayAnchor;
  role: 'start' | 'end';
  clockLabel: string;
  onSelect: () => void;
}) {
  const t = useT();
  const name = useName();
  const glyph = anchor.kind === 'hotel' ? '🏨' : anchor.kind === 'airport' ? '✈️' : '🧭';
  const labelKey: MessageKey = role === 'start' ? 'plan.dayStartsHere' : 'plan.dayEndsHere';
  const label = anchor.kind === 'hotel' ? t(labelKey) : anchor.kind === 'airport' ? t('plan.arrivalLabel') : t(labelKey);
  const display = anchor.nameZh && role === 'start' ? anchor.nameZh : anchor.name;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        data-testid={`day-anchor-${anchor.id}`}
        className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-left transition-colors hover:border-line-strong"
      >
        <span className="w-[46px] shrink-0 text-right text-[11px] font-medium tabular-nums text-faint">{clockLabel}</span>
        <span className="shrink-0 text-[13px]" aria-hidden="true">
          {glyph}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-medium text-ink-soft">{display || name.primary(anchor)}</span>
          <span className="block text-[10.5px] text-faint">{label}</span>
        </span>
      </button>
    </li>
  );
}

function EmptyDay({
  day,
  destination,
  onAddStop,
  onAddAirport,
}: {
  day: TripDay;
  destination: Destination;
  onAddStop: () => void;
  onAddAirport: () => void;
}) {
  const t = useT();
  return (
    <div className="rounded-card border border-dashed border-line-strong bg-paper px-4 py-8 text-center">
      <p className="text-[13px] font-semibold text-ink">{t('plan.dayEmpty', { n: day.index + 1 })}</p>
      <p className="mx-auto mt-1.5 max-w-[34ch] text-[12px] leading-relaxed text-muted">{t('plan.dayEmptyHint')}</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        <button type="button" className="btn-secondary btn-xs" onClick={onAddStop}>
          {t('plan.findPlaces')}
        </button>
        {destination.airports[0] && (
          <button type="button" className="btn-secondary btn-xs" onClick={onAddAirport}>
            {t('plan.addAirport', {
              code: destination.airports[0].code,
              kind: t(day.index === 0 ? 'plan.arrivalLabel' : 'plan.departureLabel'),
            })}
          </button>
        )}
      </div>
    </div>
  );
}

function isHotelKind(kind: ItineraryItem['kind']): boolean {
  return kind === 'marriott' || kind === 'hilton' || kind === 'ihg' || kind === 'hyatt' || kind === 'gha';
}

/** 90 -> 1 小时 30 分钟 / 1 h 30 min, shared with the panel's own formatter. */
function shortDuration(minutes: number, t: ReturnType<typeof useT>): string {
  const rounded = Math.round(minutes);
  if (rounded < 60) return t('unit.minutesShort', { count: rounded });
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest === 0
    ? t('unit.hoursShort', { count: hours })
    : `${hours}h${String(rest).padStart(2, '0')}`;
}
