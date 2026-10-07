'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Trip } from '@/lib/types';
import { getDestination, getHotels } from '@/lib/data';
import { hydrateTripStore, useTripStore } from '@/lib/store/trip-store';
import { hydrateUiStore } from '@/lib/store/ui-store';
import { useT, useName, useLocale } from '@/lib/i18n/use-t';
import { formatDateShort } from '@/lib/date';
import { sortTripsForList, todayIso, tripPhase, tripSummary, type TripPhase } from '@/lib/trips';
import { heroImage } from '@/lib/images';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ImageFrame } from '@/components/ui/ImageFrame';
import { EmptyState } from '@/components/ui/primitives';
import { IconAlert, IconArrowLeft, IconCalendar, IconCopy, IconTrash, IconUsers } from '@/components/ui/icons';

/**
 * 我的行程 — the list of trips.
 *
 * WHY THIS PAGE EXISTS
 * --------------------
 * A trip was previously only reachable by navigating back to its destination and
 * opening PLAN, which made it feel like state of that page rather than a thing
 * the traveller owns. Two consequences followed: a second trip was hard to find
 * at all, and editing or deleting one had no home.
 *
 * So trips get their own top-level surface, reachable from every header. The list
 * is grouped by what a traveller actually asks: what is coming, what is happening,
 * and what is done.
 */
export default function MyTripsPage() {
  const t = useT();
  const locale = useLocale();
  const trips = useTripStore((s) => s.trips);
  const hydrated = useTripStore((s) => s.hydrated);
  const deleteTrip = useTripStore((s) => s.deleteTrip);
  const duplicateTrip = useTripStore((s) => s.duplicateTrip);
  const updateTripDates = useTripStore((s) => s.updateTripDates);
  const updateTripMeta = useTripStore((s) => s.updateTripMeta);

  const [confirming, setConfirming] = useState<string | null>(null);
  const [editingDates, setEditingDates] = useState<string | null>(null);
  const [editingTravellers, setEditingTravellers] = useState<string | null>(null);

  useEffect(() => {
    hydrateTripStore();
    hydrateUiStore();
  }, []);

  const today = useMemo(() => todayIso(), []);
  const ordered = useMemo(() => sortTripsForList(trips, today), [trips, today]);
  const groups = useMemo(() => {
    const out: Record<TripPhase, Trip[]> = { active: [], upcoming: [], past: [] };
    for (const trip of ordered) out[tripPhase(trip, today)].push(trip);
    return out;
  }, [ordered, today]);

  return (
    <main className="min-h-[100dvh] bg-paper" data-testid="trips-page">
      <header className="surface-blur sticky top-0 z-[520] border-b border-line px-4 py-2.5">
        <div className="mx-auto flex max-w-[900px] items-center gap-3">
          <Link href="/" className="btn-ghost btn-xs shrink-0" data-testid="trips-home">
            <IconArrowLeft size={15} />
            <span className="hidden sm:inline">{t('app.back')}</span>
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em]">{t('trips.title')}</h1>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {hydrated && trips.length > 0 && (
              <span className="hidden text-[11px] tabular-nums text-faint sm:inline">
                {t('trips.count', { count: trips.length })}
              </span>
            )}
            <LanguageSwitcher compact />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[900px] px-4 py-5">
        <p className="mb-4 text-[12.5px] leading-relaxed text-muted">{t('trips.subtitle')}</p>

        {!hydrated ? (
          <p className="text-[12.5px] text-muted">{t('app.loading')}</p>
        ) : trips.length === 0 ? (
          <EmptyState
            title={t('trips.empty')}
            body={t('trips.emptyHint')}
            action={
              <Link href="/" className="btn-primary btn-xs" data-testid="trips-empty-cta">
                {t('trips.createFromMap')}
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {(['active', 'upcoming', 'past'] as TripPhase[]).map((phase) =>
              groups[phase].length === 0 ? null : (
                <section key={phase} data-testid={`trips-group-${phase}`}>
                  <h2 className="label-caps mb-2">
                    {t(phase === 'active' ? 'trips.active' : phase === 'upcoming' ? 'trips.upcoming' : 'trips.past')}
                  </h2>
                  <ul className="space-y-2.5">
                    {groups[phase].map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        phase={phase}
                        locale={locale}
                        confirming={confirming === trip.id}
                        editingDates={editingDates === trip.id}
                        editingTravellers={editingTravellers === trip.id}
                        onConfirm={() => setConfirming(trip.id)}
                        onCancelConfirm={() => setConfirming(null)}
                        onToggleDates={() => {
                          setEditingDates(editingDates === trip.id ? null : trip.id);
                          setEditingTravellers(null);
                          setConfirming(null);
                        }}
                        onToggleTravellers={() => {
                          setEditingTravellers(editingTravellers === trip.id ? null : trip.id);
                          setEditingDates(null);
                          setConfirming(null);
                        }}
                        onDelete={() => {
                          deleteTrip(trip.id);
                          setConfirming(null);
                        }}
                        onDuplicate={() => duplicateTrip(trip.id)}
                        onDates={(arrival, departure) => {
                          updateTripDates(trip.id, arrival, departure);
                          setEditingDates(null);
                        }}
                        onTravellers={(count) => {
                          updateTripMeta(trip.id, { travellers: count });
                          setEditingTravellers(null);
                        }}
                      />
                    ))}
                  </ul>
                </section>
              ),
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function TripCard({
  trip,
  phase,
  locale,
  confirming,
  editingDates,
  editingTravellers,
  onConfirm,
  onCancelConfirm,
  onToggleDates,
  onToggleTravellers,
  onDelete,
  onDuplicate,
  onDates,
  onTravellers,
}: {
  trip: Trip;
  phase: TripPhase;
  locale: 'zh-CN' | 'en';
  confirming: boolean;
  editingDates: boolean;
  editingTravellers: boolean;
  onConfirm: () => void;
  onCancelConfirm: () => void;
  onToggleDates: () => void;
  onToggleTravellers: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDates: (arrival: string, departure: string) => void;
  onTravellers: (count: number) => void;
}) {
  const t = useT();
  const name = useName();
  const hotels = useMemo(() => getHotels(trip.destinationId), [trip.destinationId]);
  const summary = useMemo(() => tripSummary(trip, hotels, locale), [trip, hotels, locale]);
  const [arrival, setArrival] = useState(trip.arrivalDate);
  const [departure, setDeparture] = useState(trip.departureDate);
  const [travellers, setTravellers] = useState(trip.travellers);

  const destination = getDestination(trip.destinationId);
  const hero = heroImage('hotel', trip.stays?.[0]?.hotelPlaceId ?? '');

  return (
    <li
      className="rounded-card border border-line bg-surface p-3"
      data-testid={`trip-card-${trip.id}`}
      data-phase={phase}
    >
      <div className="flex items-start gap-3">
        <Link href={`/trips/detail/?id=${encodeURIComponent(trip.id)}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
          <ImageFrame
            image={hero}
            variant="thumb"
            className="h-14 w-14 rounded-lg"
            showDisclosure={false}
            fallbackLabel={destination ? name.primary(destination) : trip.destinationId}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={`/trips/detail/?id=${encodeURIComponent(trip.id)}`}
            className="block"
            data-testid={`trip-open-${trip.id}`}
          >
            <span className="block text-[14.5px] font-semibold leading-snug tracking-[-0.01em] text-ink">
              {destination ? name.primary(destination) : trip.name}
            </span>
          </Link>

          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
            <span className="tabular-nums">
              {formatDateShort(trip.arrivalDate, locale)} → {formatDateShort(trip.departureDate, locale)}
            </span>
            <span className="text-line-strong" aria-hidden="true">·</span>
            <span className="tabular-nums">{t('trips.days', { count: summary.dayCount })}</span>
            <span className="text-line-strong" aria-hidden="true">·</span>
            <span className="tabular-nums">{t('trips.travellers', { count: summary.travellers })}</span>
            <span className="text-line-strong" aria-hidden="true">·</span>
            <span className="tabular-nums">{t('trips.planned', { count: summary.plannedPlaces })}</span>
          </p>

          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11.5px]" data-testid={`trip-accommodation-${trip.id}`}>
            {summary.accommodation ? (
              <span className="text-ink-soft">
                🏨 {summary.accommodation}
                <span className="ml-1.5 text-faint tabular-nums">{t('trips.nights', { count: summary.nightCount })}</span>
              </span>
            ) : (
              <span className="text-muted">{t('trips.noAccommodation')}</span>
            )}
            {summary.hasGap && (
              <span className="flex items-center gap-1 text-warn">
                <IconAlert size={11} />
                {t('trips.stayGap', { count: 1 })}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* --- actions ------------------------------------------------------ */}
      {confirming ? (
        <div className="mt-3 rounded-lg border border-danger/30 bg-danger/[0.05] p-2.5" data-testid={`trip-delete-confirm-${trip.id}`}>
          <p className="text-[11.5px] leading-relaxed text-ink-soft">{t('trips.deleteConfirm', { name: trip.name })}</p>
          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              className="btn-primary btn-xs"
              data-testid={`trip-delete-yes-${trip.id}`}
              onClick={onDelete}
            >
              {t('trips.deleteYes')}
            </button>
            <button type="button" className="btn-ghost btn-xs" onClick={onCancelConfirm}>
              {t('trips.cancel')}
            </button>
          </div>
        </div>
      ) : editingDates ? (
        <div className="mt-3 flex flex-wrap items-end gap-2" data-testid={`trip-dates-form-${trip.id}`}>
          <label className="text-[11px] text-faint">
            {t('trips.arrivalLabel')}
            <input
              type="date"
              className="field mt-1 block px-2 py-1 text-[12px]"
              value={arrival}
              data-testid={`trip-arrival-${trip.id}`}
              onChange={(event) => setArrival(event.target.value)}
            />
          </label>
          <label className="text-[11px] text-faint">
            {t('trips.departureLabel')}
            <input
              type="date"
              className="field mt-1 block px-2 py-1 text-[12px]"
              value={departure}
              data-testid={`trip-departure-${trip.id}`}
              onChange={(event) => setDeparture(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn-primary btn-xs"
            data-testid={`trip-dates-save-${trip.id}`}
            disabled={departure < arrival}
            onClick={() => onDates(arrival, departure)}
          >
            {t('trips.save')}
          </button>
          <button type="button" className="btn-ghost btn-xs" onClick={onToggleDates}>
            {t('trips.cancel')}
          </button>
        </div>
      ) : editingTravellers ? (
        <div className="mt-3 flex items-end gap-2" data-testid={`trip-travellers-form-${trip.id}`}>
          <label className="text-[11px] text-faint">
            {t('setup.travellers')}
            <input
              type="number"
              min={1}
              max={12}
              className="field mt-1 block w-[80px] px-2 py-1 text-[12px]"
              value={travellers}
              data-testid={`trip-travellers-input-${trip.id}`}
              onChange={(event) => setTravellers(Number(event.target.value))}
            />
          </label>
          <button
            type="button"
            className="btn-primary btn-xs"
            data-testid={`trip-travellers-save-${trip.id}`}
            onClick={() => onTravellers(Math.max(1, Math.min(12, travellers || 1)))}
          >
            {t('trips.save')}
          </button>
          <button type="button" className="btn-ghost btn-xs" onClick={onToggleTravellers}>
            {t('trips.cancel')}
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Link
            href={`/trips/detail/?id=${encodeURIComponent(trip.id)}`}
            className="btn-primary btn-xs"
            data-testid={`trip-detail-${trip.id}`}
          >
            {t('trips.open')}
          </Link>
          <button
            type="button"
            className="btn-secondary btn-xs"
            data-testid={`trip-edit-dates-${trip.id}`}
            onClick={onToggleDates}
          >
            <IconCalendar size={12} />
            {t('trips.editDates')}
          </button>
          <button
            type="button"
            className="btn-secondary btn-xs"
            data-testid={`trip-edit-travellers-${trip.id}`}
            onClick={onToggleTravellers}
          >
            <IconUsers size={12} />
            {t('trips.editTravellers')}
          </button>
          <button
            type="button"
            className="btn-secondary btn-xs"
            data-testid={`trip-duplicate-${trip.id}`}
            onClick={onDuplicate}
          >
            <IconCopy size={12} />
            {t('trips.duplicate')}
          </button>
          <button
            type="button"
            className={cn('btn-ghost btn-xs text-muted hover:text-danger')}
            data-testid={`trip-delete-${trip.id}`}
            onClick={onConfirm}
          >
            <IconTrash size={12} />
            {t('trips.delete')}
          </button>
        </div>
      )}
    </li>
  );
}
