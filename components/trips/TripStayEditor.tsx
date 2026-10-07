'use client';

import { useMemo, useState } from 'react';
import type { Hotel, Trip, TripStay } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getHotels } from '@/lib/data';
import { useT, useName, useLocale } from '@/lib/i18n/use-t';
import { useTripStore } from '@/lib/store/trip-store';
import { addDays, findOverlappingStays, isStayValid, sortedStays, stayHotel, tripNights } from '@/lib/trip-stays';
import { formatDateShort } from '@/lib/date';
import { IconAlert, IconClose, IconPlus } from '@/components/ui/icons';

/**
 * 住宿, on the trip's own page.
 *
 * A thin wrapper over the same store actions the destination's PLAN panel uses,
 * so the two editors cannot diverge — the only difference is that this one can
 * add a hotel the destination bundle does not hold, and it shows the trip's own
 * date range as the default for a new stay.
 */
export function TripStayEditor({
  trip,
  hotels,
  destination,
}: {
  trip: Trip;
  hotels: Hotel[];
  destination: ReturnType<typeof import('@/lib/data').getDestination>;
}) {
  const t = useT();
  const locale = useLocale();
  const name = useName();
  const addStay = useTripStore((s) => s.addStay);
  const updateStay = useTripStore((s) => s.updateStay);
  const removeStay = useTripStore((s) => s.removeStay);
  const defaultStartTime = useTripStore((s) => s.setDefaultStartTime);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stays = useMemo(() => sortedStays(trip), [trip]);
  const hotelById = useMemo(() => new Map(hotels.map((hotel) => [hotel.id, hotel])), [hotels]);
  const overlaps = useMemo(() => new Set(findOverlappingStays(stays).flatMap(([a, b]) => [a.id, b.id])), [stays]);
  const nights = tripNights(trip);

  // A new stay defaults to the whole trip, which is the common case and saves
  // two date edits for a single-hotel holiday.
  const bookedNights = new Set<string>();
  for (const stay of stays) {
    let date = stay.checkInDate;
    while (date < stay.checkOutDate && bookedNights.size < 400) {
      bookedNights.add(date);
      date = addDays(date, 1);
    }
  }
  const firstFree = nights.find((night) => !bookedNights.has(night)) ?? trip.arrivalDate;
  const sortedHotels = useMemo(
    () => [...hotels].sort((a, b) => name.primary(a).localeCompare(name.primary(b))),
    [hotels, name],
  );

  return (
    <section className="rounded-card border border-line bg-surface" data-testid="trip-stay-editor">
      <header className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <span className="label-caps">{t('trips.accommodationSection')}</span>
        <span className="text-[10.5px] tabular-nums text-faint">{t('trips.nights', { count: nights.length })}</span>
        <span className="ml-auto flex items-center gap-1.5">
          <label className="text-[11px] text-faint" htmlFor="trip-default-start">
            {t('plan.defaultStartTime')}
          </label>
          <input
            id="trip-default-start"
            type="time"
            className="field w-[92px] px-1.5 py-1 text-[11.5px]"
            value={trip.defaultStartTime ?? '09:00'}
            data-testid="trip-default-start"
            onChange={(event) => defaultStartTime(trip.id, event.target.value)}
          />
        </span>
      </header>

      <div className="space-y-1.5 p-3">
        {stays.length === 0 && <p className="text-[12px] leading-relaxed text-muted">{t('plan.noStaysHint')}</p>}

        {stays.length > 0 && (
          <ul className="space-y-1.5" data-testid="trip-stay-list">
            {stays.map((stay) => {
              const hotel = hotelById.get(stay.hotelPlaceId);
              const invalid = !isStayValid(stay);
              return (
                <li
                  key={stay.id}
                  data-testid={`trip-stay-${stay.id}`}
                  className={cn(
                    'rounded-lg border bg-paper p-2',
                    invalid || overlaps.has(stay.id) ? 'border-danger/40' : 'border-line',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-[3px] shrink-0 text-[13px]" aria-hidden="true">🏨</span>
                    <div className="min-w-0 flex-1">
                      <select
                        className="field mb-1.5 text-[12.5px]"
                        value={stay.hotelPlaceId}
                        aria-label={t('plan.hotelForStay')}
                        data-testid={`trip-stay-hotel-${stay.id}`}
                        onChange={(event) => updateStay(trip.id, stay.id, { hotelPlaceId: event.target.value })}
                      >
                        {sortedHotels.map((option) => (
                          <option key={option.id} value={option.id}>
                            {name.primary(option)}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          className="field flex-1 px-1.5 py-1 text-[11.5px]"
                          value={stay.checkInDate}
                          aria-label={t('plan.checkIn')}
                          data-testid={`trip-stay-checkin-${stay.id}`}
                          onChange={(event) => updateStay(trip.id, stay.id, { checkInDate: event.target.value })}
                        />
                        <span className="text-[11px] text-faint" aria-hidden="true">→</span>
                        <input
                          type="date"
                          className="field flex-1 px-1.5 py-1 text-[11.5px]"
                          value={stay.checkOutDate}
                          aria-label={t('plan.checkOut')}
                          data-testid={`trip-stay-checkout-${stay.id}`}
                          onChange={(event) => updateStay(trip.id, stay.id, { checkOutDate: event.target.value })}
                        />
                        <button
                          type="button"
                          className="btn-ghost btn-xs shrink-0 px-1 text-muted hover:text-danger"
                          aria-label={t('plan.deleteStay')}
                          data-testid={`trip-stay-delete-${stay.id}`}
                          onClick={() => removeStay(trip.id, stay.id)}
                        >
                          <IconClose size={13} />
                        </button>
                      </div>
                      <p className="mt-1 text-[10.5px] tabular-nums text-faint">
                        {formatDateShort(stay.checkInDate, locale)} → {formatDateShort(stay.checkOutDate, locale)}
                        {hotel ? ` · ${name.primary(hotel)}` : ''}
                      </p>
                      {invalid && (
                        <p className="mt-1 flex items-start gap-1 text-[11px] text-danger">
                          <IconAlert size={11} className="mt-[2px] shrink-0" />
                          {t('plan.stayInvalid')}
                        </p>
                      )}
                      {!invalid && overlaps.has(stay.id) && (
                        <p className="mt-1 flex items-start gap-1 text-[11px] text-danger" data-testid={`trip-stay-overlap-${stay.id}`}>
                          <IconAlert size={11} className="mt-[2px] shrink-0" />
                          {t('plan.stayOverlap')}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {error && (
          <p className="flex items-start gap-1 text-[11.5px] text-danger" role="alert" data-testid="trip-stay-error">
            <IconAlert size={11} className="mt-[2px] shrink-0" />
            {error}
          </p>
        )}

        {adding ? (
          <AddStay
            hotels={sortedHotels}
            defaultCheckIn={firstFree}
            defaultCheckOut={addDays(firstFree, 2)}
            onSubmit={(input) => {
              const created = addStay(trip.id, input);
              if (!created) {
                setError(t('plan.stayOverlap'));
                return;
              }
              setAdding(false);
              setError(null);
            }}
            onCancel={() => {
              setAdding(false);
              setError(null);
            }}
          />
        ) : (
          <button
            type="button"
            className="btn-secondary btn-xs w-full justify-center"
            data-testid="trip-stay-add"
            disabled={hotels.length === 0}
            onClick={() => {
              setAdding(true);
              setError(null);
            }}
          >
            <IconPlus size={12} />
            {t('plan.addStay')}
          </button>
        )}

        {destination === null && null}
      </div>
    </section>
  );
}

function AddStay({
  hotels,
  defaultCheckIn,
  defaultCheckOut,
  onSubmit,
  onCancel,
}: {
  hotels: Hotel[];
  defaultCheckIn: string;
  defaultCheckOut: string;
  onSubmit: (input: Omit<TripStay, 'id'>) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const name = useName();
  const [hotelPlaceId, setHotelPlaceId] = useState(hotels[0]?.id ?? '');
  const [checkInDate, setCheckIn] = useState(defaultCheckIn);
  const [checkOutDate, setCheckOut] = useState(defaultCheckOut);

  return (
    <div className="rounded-lg border border-dashed border-line-strong bg-paper p-2" data-testid="trip-stay-add-form">
      <select
        className="field mb-1.5 text-[12.5px]"
        value={hotelPlaceId}
        aria-label={t('plan.hotelForStay')}
        data-testid="trip-stay-add-hotel"
        onChange={(event) => setHotelPlaceId(event.target.value)}
      >
        {hotels.map((hotel) => (
          <option key={hotel.id} value={hotel.id}>
            {name.primary(hotel)}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          className="field flex-1 px-1.5 py-1 text-[11.5px]"
          value={checkInDate}
          aria-label={t('plan.checkIn')}
          data-testid="trip-stay-add-checkin"
          onChange={(event) => setCheckIn(event.target.value)}
        />
        <span className="text-[11px] text-faint" aria-hidden="true">→</span>
        <input
          type="date"
          className="field flex-1 px-1.5 py-1 text-[11.5px]"
          value={checkOutDate}
          aria-label={t('plan.checkOut')}
          data-testid="trip-stay-add-checkout"
          onChange={(event) => setCheckOut(event.target.value)}
        />
      </div>
      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          className="btn-primary btn-xs flex-1 justify-center"
          data-testid="trip-stay-add-submit"
          disabled={!hotelPlaceId || checkOutDate <= checkInDate}
          onClick={() => onSubmit({ hotelPlaceId, checkInDate, checkOutDate })}
        >
          {t('app.save')}
        </button>
        <button type="button" className="btn-ghost btn-xs" onClick={onCancel}>
          {t('app.cancel')}
        </button>
      </div>
    </div>
  );
}

export { getHotels };
