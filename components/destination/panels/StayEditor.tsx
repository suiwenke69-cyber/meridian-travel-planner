'use client';

import { useMemo, useState } from 'react';
import type { Hotel, Trip, TripStay } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useT, useName, useLocale } from '@/lib/i18n/use-t';
import { useTripStore } from '@/lib/store/trip-store';
import { addDays, findOverlappingStays, isStayValid, sortedStays, tripNights, unbookedNights } from '@/lib/trip-stays';
import { formatDateShort } from '@/lib/date';
import { IconAlert, IconClose, IconPlus } from '../../ui/icons';

/**
 * 住宿 — the accommodation editor.
 *
 * WHY THIS IS A LIST OF STAYS AND NOT A CALENDAR OF HOTEL ROWS
 * -----------------------------------------------------------
 * The thing a traveller decides is "which hotel, for which nights", once. The
 * previous model asked them to re-add the same hotel to every day, which is
 * where the whole derived-anchor idea came from: once the stay exists, the days
 * take care of themselves.
 *
 * The editor refuses an impossible stay rather than accepting one and warning
 * later — except for an EDIT that creates an overlap, which is stored and marked,
 * because dropping a traveller's input mid-edit is worse than showing them the
 * conflict they are in the middle of fixing.
 */
export function StayEditor({ trip, hotels }: { trip: Trip; hotels: Hotel[] }) {
  const t = useT();
  const name = useName();
  const locale = useLocale();
  const addStay = useTripStore((s) => s.addStay);
  const updateStay = useTripStore((s) => s.updateStay);
  const removeStay = useTripStore((s) => s.removeStay);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stays = useMemo(() => sortedStays(trip), [trip]);
  const hotelById = useMemo(() => new Map(hotels.map((hotel) => [hotel.id, hotel])), [hotels]);
  const overlaps = useMemo(() => new Set(findOverlappingStays(stays).flatMap(([a, b]) => [a.id, b.id])), [stays]);
  const unbooked = useMemo(() => unbookedNights(trip), [trip]);
  const nights = tripNights(trip);

  // Hotels already booked cannot be booked twice for the same nights, but they
  // CAN be returned to later in the trip, so the list is not filtered down.
  const hotelOptions = useMemo(
    () => [...hotels].sort((a, b) => name.primary(a).localeCompare(name.primary(b))),
    [hotels, name],
  );

  const firstFreeNight = unbooked[0] ?? trip.arrivalDate;

  return (
    <section className="border-b border-line px-3 py-2.5" data-testid="stay-editor">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="label-caps">{t('plan.accommodation')}</span>
        <span className="text-[10.5px] tabular-nums text-faint">
          {t('plan.stayNights', { count: nights.length })}
        </span>
      </div>

      {stays.length === 0 ? (
        <p className="mb-2 text-[11.5px] leading-relaxed text-muted">{t('plan.noStaysHint')}</p>
      ) : (
        <ul className="mb-2 space-y-1.5" data-testid="stay-list">
          {stays.map((stay) => {
            const hotel = hotelById.get(stay.hotelPlaceId);
            const invalid = !isStayValid(stay);
            return (
              <li
                key={stay.id}
                data-testid={`stay-${stay.id}`}
                className={cn(
                  'rounded-lg border bg-surface p-2',
                  invalid || overlaps.has(stay.id) ? 'border-danger/40' : 'border-line',
                )}
              >
                <div className="flex items-start gap-2">
                  <span className="mt-[2px] shrink-0 text-[13px]" aria-hidden="true">
                    🏨
                  </span>
                  <div className="min-w-0 flex-1">
                    <select
                      className="field mb-1.5 text-[12.5px]"
                      value={stay.hotelPlaceId}
                      data-testid={`stay-hotel-${stay.id}`}
                      aria-label={t('plan.hotelForStay')}
                      onChange={(event) => updateStay(trip.id, stay.id, { hotelPlaceId: event.target.value })}
                    >
                      {hotelOptions.map((option) => (
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
                        data-testid={`stay-checkin-${stay.id}`}
                        onChange={(event) => updateStay(trip.id, stay.id, { checkInDate: event.target.value })}
                      />
                      <span className="text-[11px] text-faint" aria-hidden="true">
                        →
                      </span>
                      <input
                        type="date"
                        className="field flex-1 px-1.5 py-1 text-[11.5px]"
                        value={stay.checkOutDate}
                        aria-label={t('plan.checkOut')}
                        data-testid={`stay-checkout-${stay.id}`}
                        onChange={(event) => updateStay(trip.id, stay.id, { checkOutDate: event.target.value })}
                      />
                      <button
                        type="button"
                        className="btn-ghost btn-xs shrink-0 px-1 text-muted hover:text-danger"
                        aria-label={t('plan.deleteStay')}
                        data-testid={`stay-delete-${stay.id}`}
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
                      <p className="mt-1 flex items-start gap-1 text-[11px] text-danger" data-testid={`stay-overlap-${stay.id}`}>
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

      {/* A night with no bed. Stated, never filled in with a guess. */}
      {unbooked.length > 0 && (
        <ul className="mb-2 space-y-1" data-testid="unbooked-nights">
          {unbooked.slice(0, 4).map((night) => (
            <li key={night} className="flex items-start gap-1 text-[11.5px] leading-relaxed text-warn">
              <IconAlert size={11} className="mt-[3px] shrink-0" />
              {t('plan.unbookedNight', { date: formatDateShort(night, locale) })}
            </li>
          ))}
          {unbooked.length > 4 && (
            <li className="text-[11px] text-warn">{t('plan.unbookedNights', { count: unbooked.length })}</li>
          )}
        </ul>
      )}

      {error && (
        <p className="mb-2 flex items-start gap-1 text-[11.5px] text-danger" role="alert" data-testid="stay-error">
          <IconAlert size={11} className="mt-[2px] shrink-0" />
          {error}
        </p>
      )}

      {adding ? (
        <AddStayForm
          hotels={hotelOptions}
          defaultCheckIn={firstFreeNight}
          defaultCheckOut={addDays(firstFreeNight, 2)}
          onCancel={() => {
            setAdding(false);
            setError(null);
          }}
          onSubmit={(input) => {
            const created = addStay(trip.id, input);
            if (!created) {
              setError(t('plan.stayOverlap'));
              return;
            }
            setAdding(false);
            setError(null);
          }}
        />
      ) : (
        <button
          type="button"
          className="btn-secondary btn-xs w-full justify-center"
          data-testid="stay-add"
          onClick={() => {
            setAdding(true);
            setError(null);
          }}
        >
          <IconPlus size={12} />
          {t('plan.addStay')}
        </button>
      )}
    </section>
  );
}

function AddStayForm({
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
    <div className="rounded-lg border border-dashed border-line-strong bg-paper p-2" data-testid="stay-add-form">
      <select
        className="field mb-1.5 text-[12.5px]"
        value={hotelPlaceId}
        data-testid="stay-add-hotel"
        aria-label={t('plan.hotelForStay')}
        onChange={(event) => setHotelPlaceId(event.target.value)}
      >
        {hotels.length === 0 && <option value="">{t('plan.noStays')}</option>}
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
          data-testid="stay-add-checkin"
          onChange={(event) => setCheckIn(event.target.value)}
        />
        <span className="text-[11px] text-faint" aria-hidden="true">
          →
        </span>
        <input
          type="date"
          className="field flex-1 px-1.5 py-1 text-[11.5px]"
          value={checkOutDate}
          aria-label={t('plan.checkOut')}
          data-testid="stay-add-checkout"
          onChange={(event) => setCheckOut(event.target.value)}
        />
      </div>
      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          className="btn-primary btn-xs flex-1 justify-center"
          data-testid="stay-add-submit"
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
