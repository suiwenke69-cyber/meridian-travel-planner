'use client';

import { useMemo, useState } from 'react';
import type { Destination, LoyaltyProgrammeId, PriceTier, TravelStyle, Trip } from '@/lib/types';
import { formatDateLong, inclusiveDayCount, nightCount } from '@/lib/date';
import { MAX_TRIP_DAYS, createTrip } from '@/lib/trip';
import { useOriginStore } from '@/lib/store/origin-store';
import { PRICE_TIERS } from '@/lib/filters';
import { useName, useT } from '@/lib/i18n/use-t';
import type { MessageKey } from '@/lib/i18n/messages';
import { cn } from '@/lib/utils';
import { useTripStore } from '@/lib/store/trip-store';
import { useUiStore } from '@/lib/store/ui-store';
import { Tag } from '../ui/primitives';
import { IconCalendar, IconCheck, IconPlus, IconTrash, IconUsers } from '../ui/icons';

const TRAVEL_STYLES: TravelStyle[] = [
  'Beach',
  'Luxury',
  'Food',
  'Nature',
  'Nightlife',
  'Diving',
  'Surfing',
  'Culture',
  'Couple',
  'Friends',
  'Family',
];

const LOYALTY: Array<{ id: LoyaltyProgrammeId; label: string }> = [
  { id: 'marriott-bonvoy', label: 'Marriott Bonvoy' },
  { id: 'hilton-honors', label: 'Hilton Honors' },
];

const STYLE_KEY: Record<TravelStyle, MessageKey> = {
  Beach: 'style.beach',
  Luxury: 'style.luxury',
  Food: 'style.food',
  Nature: 'style.nature',
  Nightlife: 'style.nightlife',
  Diving: 'style.diving',
  Surfing: 'style.surfing',
  Culture: 'style.culture',
  Couple: 'style.couple',
  Friends: 'style.friends',
  Family: 'style.family',
};

const PRICE_TIER_KEY: Record<PriceTier, MessageKey> = {
  $: 'priceTier.budget',
  $$: 'priceTier.mid',
  $$$: 'priceTier.upscale',
  $$$$: 'priceTier.luxury',
};

/** Today + n days, formatted for `<input type="date">`. */
function isoOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
}

/**
 * Trip setup. Everything the trip builder needs, and nothing more: dates first,
 * because dates are what create the days that places get added to.
 */
export function TripSetupForm({
  destination,
  trip,
  onDone,
}: {
  destination: Destination;
  trip: Trip | null;
  onDone?: () => void;
}) {
  const createTripAction = useTripStore((s) => s.createTrip);
  const updateTripDates = useTripStore((s) => s.updateTripDates);
  const updateTripMeta = useTripStore((s) => s.updateTripMeta);
  const deleteTrip = useTripStore((s) => s.deleteTrip);
  const selectDay = useUiStore((s) => s.selectDay);
  const t = useT();
  const name = useName();
  const destinationName = name.primary(destination);

  const [arrival, setArrival] = useState(trip?.arrivalDate ?? isoOffset(30));
  const [departure, setDeparture] = useState(
    trip?.departureDate ?? isoOffset(30 + Math.max(2, destination.recommendedDays.ideal - 1)),
  );
  const [travellers, setTravellers] = useState(trip?.travellers ?? 2);
  const [styles, setStyles] = useState<TravelStyle[]>(trip?.styles ?? []);
  const [budget, setBudget] = useState<PriceTier | undefined>(trip?.budget);
  const [loyalty, setLoyalty] = useState<LoyaltyProgrammeId[]>(trip?.loyalty ?? []);
  // Secondary preferences are collapsed on first run. The brief for this pass was
  // explicit: do not open with budget, loyalty and travel style. They are still
  // here, one tap away, and they still feed the recommendations.
  const [showPreferences, setShowPreferences] = useState(Boolean(trip));

  const dayCount = useMemo(() => inclusiveDayCount(arrival, departure), [arrival, departure]);
  const nights = useMemo(() => nightCount(arrival, departure), [arrival, departure]);
  const tooLong = dayCount > MAX_TRIP_DAYS;
  const invalid = departure < arrival;

  const submit = () => {
    if (invalid || tooLong) return;
    if (trip) {
      updateTripDates(trip.id, arrival, departure);
      updateTripMeta(trip.id, { travellers, styles, budget, loyalty });
      selectDay(trip.days[0]?.id ?? null);
    } else {
      const created = createTripAction(
        {
          destinationId: destination.id,
          // A trip is FROM somewhere. The origin is stamped at creation and the
          // airport leg is measured from it, so it must not be assumed later.
          originCityId: useOriginStore.getState().originCityId,
          arrivalDate: arrival,
          departureDate: departure,
          travellers,
          styles,
          budget,
          loyalty,
        },
        destination,
      );
      selectDay(created.days[0]?.id ?? null);
    }
    onDone?.();
  };

  return (
    <div className="scroll-area h-full p-3">
      <header className="mb-3">
        <h2 className="text-[19px] font-semibold tracking-[-0.015em]">
          {trip ? t('setup.editTitle') : t('setup.planTripTo', { destination: destinationName })}
        </h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          {trip ? t('setup.editHint') : t('setup.newHint')}
        </p>
      </header>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="label-caps">{t('plan.arrival')}</span>
            <input
              type="date"
              value={arrival}
              onChange={(event) => setArrival(event.target.value)}
              data-testid="arrival-date"
              className="mt-1 w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-xs focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="label-caps">{t('plan.departure')}</span>
            <input
              type="date"
              value={departure}
              onChange={(event) => setDeparture(event.target.value)}
              data-testid="departure-date"
              className="mt-1 w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-xs focus:border-accent focus:outline-none"
            />
          </label>
        </div>

        <div
          className={cn(
            'flex items-center gap-2 rounded-card border px-2.5 py-2 text-2xs',
            invalid || tooLong ? 'border-danger/30 bg-danger/[0.05] text-danger' : 'border-line bg-paper text-muted',
          )}
        >
          <IconCalendar size={13} className="shrink-0" />
          {invalid ? (
            <span>{t('setup.dateOrder')}</span>
          ) : tooLong ? (
            <span>{t('setup.tooLong', { days: dayCount, max: MAX_TRIP_DAYS })}</span>
          ) : (
            <span>
              <strong className="text-ink">{t('setup.tripLength', { days: dayCount, nights })}</strong>
              {' · '}
              {t('setup.daysGenerated', { count: dayCount })}
              {' · '}
              {formatDateLong(arrival)} → {formatDateLong(departure)}
              {dayCount !== destination.recommendedDays.ideal && (
                <>
                  {' '}
                  ·{' '}
                  {t('setup.suggestedFor', {
                    destination: destinationName,
                    days: t('setup.tripLength', {
                      days: destination.recommendedDays.ideal,
                      nights: Math.max(0, destination.recommendedDays.ideal - 1),
                    }),
                  })}
                </>
              )}
            </span>
          )}
        </div>

        <label className="block">
          <span className="label-caps">{t('setup.travellers')}</span>
          <div className="mt-1 flex items-center gap-2">
            <IconUsers size={15} className="text-muted" />
            <input
              type="number"
              min={1}
              max={12}
              value={travellers}
              onChange={(event) => setTravellers(Number(event.target.value))}
              data-testid="travellers"
              className="w-20 rounded-lg border border-line bg-surface px-2.5 py-2 text-xs focus:border-accent focus:outline-none"
            />
            <span className="text-2xs text-muted">{t('setup.people')}</span>
          </div>
        </label>

        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border border-line bg-surface-warm px-3 py-2 text-left"
          onClick={() => setShowPreferences((v) => !v)}
          aria-expanded={showPreferences}
        >
          <span>
            <span className="block text-[12.5px] font-semibold text-ink">{t('plan.preferences')}</span>
            <span className="block text-[11px] text-muted">{t('setup.optionalHint')}</span>
          </span>
          <span className="text-[11px] text-muted">{showPreferences ? t('setup.hide') : t('setup.show')}</span>
        </button>

        {showPreferences && (
        <>
        <fieldset>
          <legend className="label-caps mb-1.5">{t('setup.travelStyle')}</legend>
          <div className="flex flex-wrap gap-1">
            {TRAVEL_STYLES.map((style) => {
              const active = styles.includes(style);
              return (
                <button
                  key={style}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStyles(active ? styles.filter((s) => s !== style) : [...styles, style])}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-2xs font-medium transition-colors',
                    active
                      ? 'border-accent/30 bg-accent-soft text-accent'
                      : 'border-line bg-surface text-ink-soft hover:border-line-strong',
                  )}
                >
                  {t(STYLE_KEY[style])}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-2xs leading-relaxed text-muted">{t('setup.styleNote')}</p>
        </fieldset>

        <fieldset>
          <legend className="label-caps mb-1.5">{t('setup.budgetTier')}</legend>
          <div className="flex flex-wrap gap-1">
            {PRICE_TIERS.map((tier) => (
              <button
                key={tier}
                type="button"
                aria-pressed={budget === tier}
                title={t(PRICE_TIER_KEY[tier])}
                onClick={() => setBudget(budget === tier ? undefined : tier)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-2xs font-medium transition-colors',
                  budget === tier
                    ? 'border-accent/30 bg-accent-soft text-accent'
                    : 'border-line bg-surface text-ink-soft hover:border-line-strong',
                )}
              >
                {tier} · {t(PRICE_TIER_KEY[tier])}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label-caps mb-1.5">{t('setup.loyalty')}</legend>
          <div className="flex flex-wrap gap-1">
            {LOYALTY.map((programme) => {
              const active = loyalty.includes(programme.id);
              return (
                <button
                  key={programme.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setLoyalty(active ? loyalty.filter((l) => l !== programme.id) : [...loyalty, programme.id])
                  }
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-2xs font-medium transition-colors',
                    active
                      ? 'border-accent/30 bg-accent-soft text-accent'
                      : 'border-line bg-surface text-ink-soft hover:border-line-strong',
                  )}
                >
                  {programme.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-2xs leading-relaxed text-muted">{t('setup.loyaltyNote')}</p>
        </fieldset>

        </>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={submit}
            disabled={invalid || tooLong}
            data-testid="create-trip"
          >
            {trip ? (
              <>
                <IconCheck size={16} />
                {t('setup.updateTrip')}
              </>
            ) : (
              <>
                <IconPlus size={16} />
                {t('plan.createTrip', { days: dayCount })}
              </>
            )}
          </button>
          {trip && (
            <button
              type="button"
              className="btn-ghost text-danger"
              onClick={() => {
                deleteTrip(trip.id);
                onDone?.();
              }}
              aria-label={t('setup.deleteTrip')}
            >
              <IconTrash size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1 pt-1">
          <Tag tone="muted">{t('setup.savedLocally')}</Tag>
          <Tag tone="muted">{t('setup.noAccount')}</Tag>
        </div>
      </div>
    </div>
  );
}
