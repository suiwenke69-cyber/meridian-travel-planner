'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Trip } from '@/lib/types';
import { getAirports, getAreas, getDestination, getHotels, getPlaces, isLocatable } from '@/lib/data';
import { hydrateTripStore, useTripStore } from '@/lib/store/trip-store';
import { hydrateUiStore } from '@/lib/store/ui-store';
import { useT, useName, useLocale } from '@/lib/i18n/use-t';
import { formatDateShort } from '@/lib/date';
import { deriveTripAnchors, sortedStays, stayHotel, unbookedNights } from '@/lib/trip-stays';
import { tripSummary, todayIso, tripPhase } from '@/lib/trips';
import { useDayLegs } from '@/lib/transport/use-day-legs';
import { buildDaySchedule, dayStartMinutes } from '@/lib/schedule';
import { heroImage } from '@/lib/images';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ImageFrame } from '@/components/ui/ImageFrame';
import { IconAlert, IconArrowLeft, IconClose, IconInfo } from '@/components/ui/icons';
import { TripMapView } from '@/components/trips/TripMapView';
import { TripStayEditor } from '@/components/trips/TripStayEditor';

/**
 * 行程单 — one trip, on its own page.
 *
 * WHY IT IS NOT THE DESTINATION'S PLAN TAB
 * ----------------------------------------
 * PLAN is how you build a trip while looking at an island. This is the trip
 * itself: it survives the destination page, it lists every day, and every part of
 * it is editable without going back to the map. A traveller with two trips needs
 * to be able to open one directly, and a trip opened this way must not depend on
 * whichever destination page happens to be in the store.
 *
 * THE STATIC-EXPORT DETAIL
 * ------------------------
 * Trip ids are created in the browser, so a build cannot enumerate them and
 * `/trips/[id]` would 404 on GitHub Pages. The id travels as `?id=` instead —
 * the same page, a different way of naming it. It is a deliberate concession to
 * being statically hosted, and the only one on this route.
 */
export default function TripDetailClient() {
  const t = useT();
  const params = useSearchParams();
  const tripId = params.get('id');
  const trips = useTripStore((s) => s.trips);
  const hydrated = useTripStore((s) => s.hydrated);

  useEffect(() => {
    hydrateTripStore();
    hydrateUiStore();
  }, []);

  const trip = useMemo(() => trips.find((entry) => entry.id === tripId) ?? null, [trips, tripId]);

  if (!hydrated) {
    return (
      <Shell title={t('trips.title')}>
        <p className="text-[12.5px] text-muted">{t('app.loading')}</p>
      </Shell>
    );
  }

  if (!trip) {
    return (
      <Shell title={t('trips.title')}>
        <div className="rounded-card border border-line bg-surface p-5 text-center">
          <p className="text-[14px] font-semibold text-ink">{t('trips.notFound')}</p>
          <p className="mx-auto mt-1.5 max-w-[40ch] text-[12.5px] leading-relaxed text-muted">{t('trips.notFoundHint')}</p>
          <Link href="/trips" className="btn-primary btn-xs mt-3" data-testid="trip-back-to-list">
            {t('trips.back')}
          </Link>
        </div>
      </Shell>
    );
  }

  return <TripDetail trip={trip} />;
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useT();
  return (
    <main className="min-h-[100dvh] bg-paper" data-testid="trip-detail-page">
      <header className="surface-blur sticky top-0 z-[520] border-b border-line px-4 py-2.5">
        <div className="mx-auto flex max-w-[900px] items-center gap-3">
          <Link href="/trips" className="btn-ghost btn-xs shrink-0" data-testid="trip-back">
            <IconArrowLeft size={15} />
            <span className="hidden sm:inline">{t('trips.back')}</span>
          </Link>
          <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em]">{title}</h1>
          <div className="ml-auto flex items-center gap-1.5">
            <LanguageSwitcher compact />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[900px] px-4 py-5">{children}</div>
    </main>
  );
}

type TripView = 'itinerary' | 'map';

function TripDetail({ trip }: { trip: Trip }) {
  const t = useT();
  const name = useName();
  const locale = useLocale();
  const [view, setView] = useState<TripView>('itinerary');
  const [dayFilter, setDayFilter] = useState<string>('all');

  const destination = getDestination(trip.destinationId);
  const hotels = useMemo(() => getHotels(trip.destinationId), [trip.destinationId]);
  const places = useMemo(() => getPlaces(trip.destinationId), [trip.destinationId]);
  const areas = useMemo(() => getAreas(trip.destinationId), [trip.destinationId]);
  const airports = useMemo(() => getAirports(trip.destinationId), [trip.destinationId]);
  const summary = useMemo(() => tripSummary(trip, hotels, locale), [trip, hotels, locale]);
  const stays = useMemo(() => sortedStays(trip), [trip]);
  const unbooked = useMemo(() => unbookedNights(trip), [trip]);
  const phase = tripPhase(trip, todayIso());

  const areaNameById = useMemo(
    () => new Map(areas.map((area) => [area.id, locale === 'zh-CN' && area.nameZh ? area.nameZh : area.name])),
    [areas, locale],
  );

  const title = destination ? name.primary(destination) : trip.name;
  const visibleDays = view === 'map' && dayFilter !== 'all' ? trip.days.filter((day) => day.id === dayFilter) : trip.days;

  return (
    <Shell title={title}>
      {/* --- header ------------------------------------------------------- */}
      <header className="mb-3">
        <h2 className="text-[20px] font-semibold tracking-[-0.015em] text-ink">
          {title} · {t('trips.days', { count: summary.dayCount })}
          {t('trips.nights', { count: summary.nightCount })}
        </h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
          <span className="tabular-nums">
            {formatDateShort(trip.arrivalDate, locale)} → {formatDateShort(trip.departureDate, locale)}
          </span>
          <span className="text-line-strong" aria-hidden="true">·</span>
          <span className="tabular-nums">{t('trips.travellers', { count: summary.travellers })}</span>
          <span className="text-line-strong" aria-hidden="true">·</span>
          <span className="tabular-nums">{t('trips.planned', { count: summary.plannedPlaces })}</span>
          {phase !== 'upcoming' && (
            <>
              <span className="text-line-strong" aria-hidden="true">·</span>
              <span>{t(phase === 'past' ? 'trips.past' : 'trips.active')}</span>
            </>
          )}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {/* The two views the brief asks for, as one control. */}
          <div className="flex rounded-lg border border-line bg-surface-2 p-[3px]" role="tablist">
            {(['itinerary', 'map'] as TripView[]).map((entry) => (
              <button
                key={entry}
                type="button"
                role="tab"
                aria-selected={view === entry}
                data-testid={`trip-view-${entry}`}
                onClick={() => setView(entry)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors duration-150',
                  view === entry ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink-soft',
                )}
              >
                {t(entry === 'itinerary' ? 'trips.itinerary' : 'trips.map')}
              </button>
            ))}
          </div>

          <Link href={`/destination/${trip.destinationId}`} className="btn-secondary btn-xs ml-auto" data-testid="trip-open-planner">
            {t('trips.openInPlanner')}
          </Link>
        </div>
      </header>

      {unbooked.length > 0 && (
        <p className="mb-3 flex items-start gap-1.5 rounded-lg border border-warn/30 bg-warn/[0.06] px-2.5 py-1.5 text-[12px] leading-relaxed text-warn" data-testid="trip-unbooked">
          <IconAlert size={12} className="mt-[2px] shrink-0" />
          {t('trips.stayGap', { count: unbooked.length })}
        </p>
      )}

      <TripSettings trip={trip} />
      <TripStayEditor trip={trip} hotels={hotels} destination={destination} />

      {view === 'map' ? (
        <section className="mt-3">
          <div className="mb-2 flex flex-wrap gap-1" data-testid="trip-day-filter">
            {[{ id: 'all', label: t('trips.allDays') }, ...trip.days.map((day) => ({ id: day.id, label: t('trips.dayFilter', { n: day.index + 1 }) }))].map(
              (entry) => (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={dayFilter === entry.id}
                  data-testid={`trip-day-filter-${entry.id}`}
                  onClick={() => setDayFilter(entry.id)}
                  className={cn(
                    'rounded-full border px-2.5 py-[4px] text-[11.5px] font-medium transition-colors',
                    dayFilter === entry.id
                      ? 'border-accent/25 bg-accent-soft text-accent'
                      : 'border-line bg-surface text-ink-soft hover:border-line-strong',
                  )}
                >
                  {entry.label}
                </button>
              ),
            )}
          </div>

          <TripMapView
            trip={trip}
            days={visibleDays}
            destinationId={trip.destinationId}
            hotels={hotels}
            places={places}
            areaNameById={areaNameById}
          />
        </section>
      ) : (
        <section className="mt-3 space-y-3" data-testid="trip-days">
          {trip.days.map((day) => (
            <TripDayCard
              key={day.id}
              trip={trip}
              dayId={day.id}
              destinationId={trip.destinationId}
              hotels={hotels}
              places={places}
              airportsCount={airports.length}
            />
          ))}
        </section>
      )}
    </Shell>
  );
}

/**
 * Trip-level editing, on the trip's own page.
 *
 * The same four actions the list offers, repeated here rather than linked to,
 * because a traveller who has opened a trip should not have to go back to the
 * index to change its dates — and because "the trip cannot be edited" was the
 * original complaint.
 */
function TripSettings({ trip }: { trip: Trip }) {
  const t = useT();
  const locale = useLocale();
  const updateTripDates = useTripStore((s) => s.updateTripDates);
  const updateTripMeta = useTripStore((s) => s.updateTripMeta);
  const duplicateTrip = useTripStore((s) => s.duplicateTrip);
  const deleteTrip = useTripStore((s) => s.deleteTrip);
  const [open, setOpen] = useState(false);
  const [arrival, setArrival] = useState(trip.arrivalDate);
  const [departure, setDeparture] = useState(trip.departureDate);
  const [travellers, setTravellers] = useState(trip.travellers);
  const [confirming, setConfirming] = useState(false);

  // A date edit can drop days that hold stops, so the count is stated before it
  // happens rather than discovered afterwards.
  const stopsAtRisk = useMemo(() => {
    if (departure >= trip.departureDate && arrival <= trip.arrivalDate) return 0;
    return trip.days
      .filter((day) => day.date < arrival || day.date > departure)
      .reduce((total, day) => total + day.items.length, 0);
  }, [trip, arrival, departure]);

  return (
    <section className="mb-3 rounded-card border border-line bg-surface" data-testid="trip-settings">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
        data-testid="trip-settings-toggle"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="label-caps">{t('plan.tripSettings')}</span>
        <span className="ml-auto text-[11px] tabular-nums text-faint">
          {formatDateShort(trip.arrivalDate, locale)} → {formatDateShort(trip.departureDate, locale)} ·{' '}
          {t('trips.travellers', { count: trip.travellers })}
        </span>
      </button>

      {open && (
        <div className="border-t border-line p-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-[11px] text-faint">
              {t('trips.arrivalLabel')}
              <input
                type="date"
                className="field mt-1 block px-2 py-1 text-[12px]"
                value={arrival}
                data-testid="trip-settings-arrival"
                onChange={(event) => setArrival(event.target.value)}
              />
            </label>
            <label className="text-[11px] text-faint">
              {t('trips.departureLabel')}
              <input
                type="date"
                className="field mt-1 block px-2 py-1 text-[12px]"
                value={departure}
                data-testid="trip-settings-departure"
                onChange={(event) => setDeparture(event.target.value)}
              />
            </label>
            <label className="text-[11px] text-faint">
              {t('setup.travellers')}
              <input
                type="number"
                min={1}
                max={12}
                className="field mt-1 block w-[80px] px-2 py-1 text-[12px]"
                value={travellers}
                data-testid="trip-settings-travellers"
                onChange={(event) => setTravellers(Number(event.target.value))}
              />
            </label>
            <button
              type="button"
              className="btn-primary btn-xs"
              data-testid="trip-settings-save"
              disabled={departure < arrival}
              onClick={() => {
                if (arrival !== trip.arrivalDate || departure !== trip.departureDate) {
                  updateTripDates(trip.id, arrival, departure);
                }
                updateTripMeta(trip.id, { travellers: Math.max(1, Math.min(12, travellers || 1)) });
              }}
            >
              {t('trips.save')}
            </button>
            <button
              type="button"
              className="btn-secondary btn-xs"
              data-testid="trip-settings-duplicate"
              onClick={() => duplicateTrip(trip.id)}
            >
              {t('trips.duplicate')}
            </button>
            <button
              type="button"
              className="btn-ghost btn-xs text-muted hover:text-danger"
              data-testid="trip-settings-delete"
              onClick={() => setConfirming(true)}
            >
              {t('trips.delete')}
            </button>
          </div>

          {stopsAtRisk > 0 && (
            <p className="mt-2 text-[11.5px] leading-relaxed text-warn" data-testid="trip-settings-risk">
              {t('trips.datesDropStops', { count: stopsAtRisk })}
            </p>
          )}

          {confirming && (
            <div className="mt-2 rounded-lg border border-danger/30 bg-danger/[0.05] p-2.5" data-testid="trip-settings-confirm">
              <p className="text-[11.5px] leading-relaxed text-ink-soft">{t('trips.deleteConfirm', { name: trip.name })}</p>
              <div className="mt-2 flex gap-1.5">
                <button
                  type="button"
                  className="btn-primary btn-xs"
                  data-testid="trip-settings-delete-yes"
                  onClick={() => deleteTrip(trip.id)}
                >
                  {t('trips.deleteYes')}
                </button>
                <button type="button" className="btn-ghost btn-xs" onClick={() => setConfirming(false)}>
                  {t('trips.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * One day of the trip, fully editable.
 *
 * It renders the SAME derived anchors and the SAME schedule the destination's
 * PLAN panel does, by calling the same functions — so a trip opened here and the
 * same trip opened on the destination page cannot show different days.
 */
function TripDayCard({
  trip,
  dayId,
  destinationId,
  hotels,
  places,
  airportsCount,
}: {
  trip: Trip;
  dayId: string;
  destinationId: string;
  hotels: ReturnType<typeof getHotels>;
  places: ReturnType<typeof getPlaces>;
  airportsCount: number;
}) {
  const t = useT();
  const locale = useLocale();
  const removeItem = useTripStore((s) => s.removeItem);
  const reorderItem = useTripStore((s) => s.reorderItem);
  const moveItemToDay = useTripStore((s) => s.moveItemToDay);
  const patchItem = useTripStore((s) => s.patchItem);
  const setDayStartTime = useTripStore((s) => s.setDayStartTime);
  const [moving, setMoving] = useState<string | null>(null);

  const day = trip.days.find((entry) => entry.id === dayId)!;
  const anchors = useMemo(() => deriveTripAnchors(trip, hotels).get(day.id)!, [trip, hotels, day.id]);
  const { legs, loading } = useDayLegs(day, anchors);
  const schedule = useMemo(() => buildDaySchedule({ trip, day, anchors, legs }), [trip, day, anchors, legs]);
  const legByToId = new Map(legs.map((leg) => [leg.toItemId, leg]));
  // The final leg leaves the last stop for the end anchor, so it is keyed by the
  // anchor rather than by an item.
  const lastLeg = anchors.end ? legByToId.get(anchors.end.id) : undefined;

  const overridden = Boolean(day.startTime);

  return (
    <article className="rounded-card border border-line bg-surface" data-testid={`trip-day-${day.id}`}>
      <header className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <span className="text-[13.5px] font-semibold text-ink">
          {t('plan.day', { n: day.index + 1 })}
          <span className="ml-1.5 font-normal text-faint">{formatDateShort(day.date, locale)}</span>
        </span>
        {anchors.isHotelChange && (
          <span
            className="rounded-full border border-accent/30 bg-accent-soft px-2 py-[2px] text-[10.5px] font-semibold text-accent"
            data-testid={`trip-hotel-change-${day.id}`}
          >
            {t('plan.hotelChangeDay')}
          </span>
        )}
        {anchors.missingAccommodation && (
          <span className="rounded-full border border-warn/30 bg-warn/[0.08] px-2 py-[2px] text-[10.5px] font-medium text-warn">
            {t('plan.unbookedNight', { date: formatDateShort(day.date, locale) })}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          <label className="text-[11px] text-faint" htmlFor={`trip-day-start-${day.id}`}>
            {t('plan.startTime')}
          </label>
          <input
            id={`trip-day-start-${day.id}`}
            type="time"
            className="field w-[92px] px-1.5 py-1 text-[11.5px]"
            value={day.startTime ?? trip.defaultStartTime ?? '09:00'}
            data-testid={`trip-day-start-${day.id}`}
            onChange={(event) => setDayStartTime(trip.id, day.id, event.target.value)}
          />
          {overridden && (
            <button
              type="button"
              className="btn-ghost btn-xs text-muted"
              data-testid={`trip-day-start-reset-${day.id}`}
              onClick={() => setDayStartTime(trip.id, day.id, undefined)}
            >
              {t('plan.useDefaultStart')}
            </button>
          )}
        </span>
      </header>

      {/* --- anchors ------------------------------------------------------ */}
      <div className="space-y-1 px-3 py-2">
        {anchors.start && (
          <AnchorLine
            glyph={anchors.start.kind === 'hotel' ? '🏨' : '✈️'}
            name={anchors.start.nameZh ?? anchors.start.name}
            label={anchors.start.kind === 'hotel' ? t('plan.dayStartsHere') : t('plan.arrivalLabel')}
            clock={schedule.entries[0]?.clockLabel}
            testId={`trip-start-anchor-${day.id}`}
          />
        )}

        {day.items.length === 0 ? (
          <p className="px-1 py-1 text-[12px] text-muted">{t('plan.nothingPlanned')}</p>
        ) : (
          <ul>
            {schedule.entries
              .filter((entry) => entry.kind === 'item')
              .map((entry) => {
                if (entry.kind !== 'item') return null;
                const item = entry.item;
                const leg = legByToId.get(item.id);
                const place = places.find((p) => p.id === item.refId);
                const index = day.items.findIndex((entry2) => entry2.id === item.id);
                const locatable = !place || isLocatable(place);
                return (
                  <li key={item.id}>
                    {leg && (
                      <p className="py-0.5 pl-[52px] text-[11px] text-faint" data-testid={`trip-leg-${item.id}`}>
                        🚗{' '}
                        {leg.durationSeconds != null
                          ? `${Math.round(leg.durationSeconds / 60)} min`
                          : t('plan.legsUnavailable', { count: 1 })}
                      </p>
                    )}
                    <div
                      className="group flex items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-black/[0.025]"
                      data-testid={`trip-item-${item.id}`}
                    >
                      <span className="w-[44px] shrink-0 text-right text-[11.5px] font-semibold tabular-nums text-ink-soft">
                        {entry.clockLabel}
                      </span>
                      <ImageFrame
                        image={heroImage(place ? 'place' : 'hotel', item.refId)}
                        variant="thumb"
                        className="w-9 shrink-0 rounded-md"
                        showDisclosure={false}
                        fallbackLabel={item.nameZh ?? item.name}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-ink">{item.nameZh ?? item.name}</span>
                        <span className="block truncate text-[11px] text-faint">
                          {item.areaName ?? (item.areaId ? item.areaId : '')}
                          {!locatable ? ` · ${t('do.noPhoto')}` : ''}
                        </span>
                        {entry.waitMinutes > 0 && (
                          <span className="mt-0.5 block text-[10.5px] text-accent">
                            {t('plan.waitFor', { minutes: entry.waitMinutes })}
                          </span>
                        )}
                        {entry.lateMinutes > 0 && (
                          <span
                            className="mt-0.5 flex items-center gap-1 text-[10.5px] font-medium text-danger"
                            data-testid={`trip-item-conflict-${item.id}`}
                          >
                            <IconAlert size={10} />
                            {t('plan.conflictLate', { minutes: entry.lateMinutes })}
                          </span>
                        )}
                      </span>

                      <input
                        type="time"
                        className="field w-[84px] shrink-0 px-1 py-[2px] text-[11px]"
                        value={item.fixedTime ?? ''}
                        aria-label={t('plan.fixedTime')}
                        data-testid={`trip-item-fixed-${item.id}`}
                        onChange={(event) =>
                          patchItem(trip.id, day.id, item.id, { fixedTime: event.target.value || undefined })
                        }
                      />

                      <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                        <button
                          type="button"
                          className="btn-ghost btn-xs px-1"
                          disabled={index <= 0}
                          aria-label={t('plan.moveEarlier')}
                          data-testid={`trip-move-up-${item.id}`}
                          onClick={() => reorderItem(trip.id, day.id, item.id, index - 1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="btn-ghost btn-xs px-1"
                          disabled={index >= day.items.length - 1}
                          aria-label={t('plan.moveLater')}
                          data-testid={`trip-move-down-${item.id}`}
                          onClick={() => reorderItem(trip.id, day.id, item.id, index + 1)}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="btn-ghost btn-xs px-1 text-muted"
                          aria-label={t('trips.moveToDay')}
                          data-testid={`trip-move-day-${item.id}`}
                          onClick={() => setMoving(moving === item.id ? null : item.id)}
                        >
                          <IconInfo size={12} />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost btn-xs px-1 text-muted hover:text-danger"
                          aria-label={t('plan.remove')}
                          data-testid={`trip-remove-${item.id}`}
                          onClick={() => removeItem(trip.id, item.id)}
                        >
                          <IconClose size={12} />
                        </button>
                      </span>
                    </div>

                    {/* Moving a stop to another day is a first-class action. */}
                    {moving === item.id && (
                      <div className="mb-1 ml-[52px] flex flex-wrap gap-1" data-testid={`trip-move-targets-${item.id}`}>
                        {trip.days
                          .filter((target) => target.id !== day.id)
                          .map((target) => (
                            <button
                              key={target.id}
                              type="button"
                              className="btn-secondary btn-xs"
                              data-testid={`trip-move-to-${target.id}-${item.id}`}
                              onClick={() => {
                                moveItemToDay(trip.id, day.id, item.id, target.id);
                                setMoving(null);
                              }}
                            >
                              {t('trips.dayFilter', { n: target.index + 1 })}
                            </button>
                          ))}
                      </div>
                    )}
                  </li>
                );
              })}
          </ul>
        )}

        {/*
          The drive to the end anchor is shown, not implied.
          On a hotel-change day this is the leg that matters most — the one that
          takes the traveller from their last stop to the hotel they sleep in —
          and it was missing from this page while the destination's PLAN panel
          already rendered it.
        */}
        {anchors.end && lastLeg && (
          <p className="py-0.5 pl-[52px] text-[11px] text-faint" data-testid={`trip-leg-${anchors.end.id}`}>
            🚗{' '}
            {lastLeg.durationSeconds != null
              ? `${Math.round(lastLeg.durationSeconds / 60)} min`
              : t('plan.legsUnavailable', { count: 1 })}
          </p>
        )}

        {anchors.end && (
          <AnchorLine
            glyph={anchors.end.kind === 'hotel' ? '🏨' : '✈️'}
            name={anchors.end.nameZh ?? anchors.end.name}
            label={anchors.end.kind === 'hotel' ? t('plan.dayEndsHere') : t('plan.departureLabel')}
            clock={[...schedule.entries].reverse().find((entry) => entry.kind === 'anchor')?.clockLabel}
            testId={`trip-end-anchor-${day.id}`}
          />
        )}

        {loading && <p className="px-1 text-[11px] text-faint">{t('plan.measuringTravel')}</p>}
        {airportsCount === 0 && null}
      </div>
    </article>
  );
}

function AnchorLine({
  glyph,
  name,
  label,
  clock,
  testId,
}: {
  glyph: string;
  name: string;
  label: string;
  clock?: string;
  testId: string;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5"
      data-testid={testId}
    >
      <span className="w-[44px] shrink-0 text-right text-[11px] tabular-nums text-faint">{clock}</span>
      <span className="shrink-0 text-[13px]" aria-hidden="true">{glyph}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-medium text-ink-soft">{name}</span>
        <span className="block text-[10.5px] text-faint">{label}</span>
      </span>
    </div>
  );
}
