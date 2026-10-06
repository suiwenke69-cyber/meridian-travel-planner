'use client';

import Link from 'next/link';
import type { Destination } from '@/lib/types';
import type { DestinationStats } from '@/lib/data';
import { formatMinutesRange, primaryRouteSummary, SINGAPORE_ORIGIN } from '@/lib/data';
import { formatStayRange } from '@/lib/date';
import { IconArrowRight, IconClose } from '../ui/icons';

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
  const route = primaryRouteSummary(destination);
  const sin = SINGAPORE_ORIGIN.airports[0];

  return (
    <article className="panel mm-enter overflow-hidden" data-testid="destination-preview">
      <header className="px-4 pb-3 pt-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="label-caps">{destination.country}</p>
            <h2 className="mt-1 text-[26px] font-semibold leading-none tracking-[-0.02em] text-ink">
              {destination.name}
            </h2>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost btn-xs -mr-1.5 -mt-1 shrink-0 text-faint hover:text-ink"
              aria-label={`Close ${destination.name} preview`}
            >
              <IconClose size={15} />
            </button>
          )}
        </div>
      </header>

      {/* Route ------------------------------------------------------------ */}
      <section className="border-t border-line px-4 py-3" aria-label="Route from Singapore">
        <p className="text-[15px] leading-tight text-ink">
          <span className="font-semibold">
            {route.airport?.flightMinutes
              ? formatMinutesRange(route.airport.flightMinutes.min, route.airport.flightMinutes.max)
              : '—'}
          </span>
          <span className="text-ink-soft"> from Singapore</span>
        </p>
        <p className="mt-1 text-[12.5px] leading-snug text-muted">
          <span className={route.direct ? 'font-medium text-accent' : 'font-medium text-warn'}>
            {route.direct ? 'Direct' : 'Connection required'}
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
          <p className="label-caps">Ideal stay</p>
          <p className="mt-1 text-[13.5px] font-medium leading-tight text-ink">
            {formatStayRange(destination.recommendedDays)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="label-caps">Good for</p>
          <p className="mt-1 text-[13px] leading-snug text-ink-soft">
            {destination.bestFor.slice(0, 3).join(' · ')}
          </p>
        </div>
      </section>

      {/* Loyalty inventory ---------------------------------------------- */}
      <section className="border-t border-line px-4 py-2.5" aria-label="Loyalty inventory">
        <p className="text-[11.5px] leading-snug text-muted">
          {stats.marriottCount + stats.hiltonCount > 0 ? (
            <>
              <span className="font-medium text-ink-soft tabular-nums">{stats.marriottCount}</span> Marriott Bonvoy
              <span className="mx-1.5 text-line-strong" aria-hidden="true">
                ·
              </span>
              <span className="font-medium text-ink-soft tabular-nums">{stats.hiltonCount}</span> Hilton Honors
              <span className="mx-1.5 text-line-strong" aria-hidden="true">
                ·
              </span>
              <span className="tabular-nums">{stats.placeCount}</span> places mapped
            </>
          ) : (
            <>
              No Marriott Bonvoy or Hilton Honors property here —{' '}
              <span className="tabular-nums">{stats.placeCount}</span> places still mapped
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
          Explore {destination.name}
          <IconArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
