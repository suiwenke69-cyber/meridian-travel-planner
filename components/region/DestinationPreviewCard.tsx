'use client';

import Link from 'next/link';
import type { Destination } from '@/lib/types';
import type { DestinationStats } from '@/lib/data';
import { formatMinutesRange, primaryRouteSummary, SINGAPORE_ORIGIN } from '@/lib/data';
import { IconArrowRight, IconClose } from '../ui/icons';
import { useName, useT, useLocale, type Translator } from '@/lib/i18n/use-t';
import type { MessageKey } from '@/lib/i18n/messages';

/**
 * The stay range in the reader's language.
 *
 * `formatStayRange` in `lib/date` writes the English word "days"; the Chinese
 * needs its own unit, and a `{count}` key cannot express the min–ideal band, so
 * the band shape is replicated here and only the unit is translated.
 */
function stayRangeLabel(t: Translator, recommended: Destination['recommendedDays']): string {
  if (recommended.max - recommended.min <= 1) return t('unit.days', { count: recommended.ideal });
  const upper = Math.min(recommended.max, Math.max(recommended.ideal + 1, recommended.min + 2));
  return `${recommended.min}–${t('unit.days', { count: upper })}`;
}

/**
 * The destination preview.
 *
 * The strongest card on the page, and still compact: it answers the four
 * questions a traveller actually asks first — how long is the flight, is it
 * direct, how long should I stay, and what is it good for — then gets out of
 * the way. Selecting a destination never navigates away from the map, so
 * options can be compared spatially before committing.
 */
export function DestinationPreviewCard({
  destination,
  stats,
  onClose,
}: {
  destination: Destination;
  stats: DestinationStats;
  onClose?: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const name = useName();
  const route = primaryRouteSummary(destination);
  const sin = SINGAPORE_ORIGIN.airports[0];
  const hasLoyaltyHotels = stats.marriottCount + stats.hiltonCount > 0;

  return (
    <article className="panel mm-enter overflow-hidden" data-testid="destination-preview">
      <header className="px-4 pb-3 pt-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="label-caps">{countryLabel(destination, locale)}</p>
            <h2 className="mt-1 text-[26px] font-semibold leading-none tracking-[-0.02em] text-ink">
              {name.primary(destination)}
            </h2>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost btn-xs -mr-1.5 -mt-1 shrink-0 text-faint hover:text-ink"
              aria-label={t('region.closePreview', { name: name.primary(destination) })}
            >
              <IconClose size={15} />
            </button>
          )}
        </div>
      </header>

      {/* Route ------------------------------------------------------------ */}
      <section className="border-t border-line px-4 py-3" aria-label={t('detail.fromSingapore')}>
        <p className="text-[15px] leading-tight text-ink">
          <span className="font-semibold">
            {route.airport?.flightMinutes
              ? formatMinutesRange(route.airport.flightMinutes.min, route.airport.flightMinutes.max)
              : '—'}
          </span>
          <span className="text-ink-soft"> {t('detail.fromSingapore')}</span>
        </p>
        <p className="mt-1 text-[12.5px] leading-snug text-muted">
          <span className={route.direct ? 'font-medium text-accent' : 'font-medium text-warn'}>
            {route.direct ? t('region.direct') : t('detail.connectionRequired')}
          </span>
          <span className="mx-1.5 text-line-strong" aria-hidden="true">
            ·
          </span>
          <span className="tabular-nums">
            {sin.code} → {route.airport?.code ?? '—'}
          </span>
        </p>
        {route.airport?.airlines?.length ? (
          <p className="mt-0.5 text-[11.5px] leading-snug text-faint">
            {route.airport.airlines.slice(0, 4).join(' · ')}
          </p>
        ) : null}
      </section>

      {/* Stay + character ------------------------------------------------ */}
      <section className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-0 border-t border-line px-4 py-3">
        <div>
          <p className="label-caps">{t('region.idealStay')}</p>
          <p className="mt-1 text-[13.5px] font-medium leading-tight text-ink">
            {stayRangeLabel(t, destination.recommendedDays)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="label-caps">{t('region.bestFor')}</p>
          <p className="mt-1 text-[13px] leading-snug text-ink-soft">
            {destination.bestFor.slice(0, 3).join(' · ')}
          </p>
        </div>
      </section>

      {/* Loyalty inventory ---------------------------------------------- */}
      <section className="border-t border-line px-4 py-2.5" aria-label={t('region.loyaltyHotels')}>
        <p className="text-[11.5px] leading-snug text-muted">
          {hasLoyaltyHotels ? (
            <>
              <span className="font-medium text-ink-soft tabular-nums">{stats.marriottCount}</span>{' '}
              {t('stay.filterMarriott')}
              <span className="mx-1.5 text-line-strong" aria-hidden="true">
                ·
              </span>
              <span className="font-medium text-ink-soft tabular-nums">{stats.hiltonCount}</span>{' '}
              {t('stay.filterHilton')}
              <span className="mx-1.5 text-line-strong" aria-hidden="true">
                ·
              </span>
              <span className="tabular-nums">{stats.placeCount}</span> {t('region.placesMapped')}
            </>
          ) : (
            <>
              {t('region.noLoyaltyHotel')}{' '}
              <span className="tabular-nums">{stats.placeCount}</span> {t('region.placesMappedStill')}
            </>
          )}
        </p>
      </section>

      <div className="px-4 pb-4 pt-1">
        <Link
          href={`/destination/${destination.id}`}
          className="btn-primary w-full"
          data-testid="explore-destination"
        >
          {t('region.exploreDestination', { name: name.primary(destination) })}
          <IconArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}


/**
 * The country name in the reader's language.
 *
 * Falls back to the data's own string when the catalogue has no entry, which
 * keeps a newly added destination from rendering a raw message key.
 */
function countryLabel(
  destination: { country: string; countryZh?: string },
  locale: 'zh-CN' | 'en',
): string {
  if (locale === 'en') return destination.country;
  const key = `country.${destination.country.toLowerCase()}` as MessageKey;
  return destination.countryZh ?? destination.country;
}
