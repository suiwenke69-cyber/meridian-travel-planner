'use client';

import type { Area, Hotel, Place } from '@/lib/types';
import { useT, useName, useLocale } from '@/lib/i18n/use-t';
import { pick, pickList } from '@/lib/i18n';
import { heroImage } from '@/lib/images';
import { cn } from '@/lib/utils';
import { ImageFrame } from '../../ui/ImageFrame';

/**
 * An area card answers one question in two seconds: is this region my kind of
 * place? Photography does most of that work; the tagline and the best-for line
 * finish it. Everything else lives in the detail view.
 */
export function AreaCard({
  area,
  hotels,
  places,
  selected,
  onSelect,
  onHover,
  compact = false,
}: {
  area: Area;
  hotels: Hotel[];
  places: Place[];
  selected: boolean;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
  /** Compact rows for the map-side list; full cards for the panel. */
  compact?: boolean;
}) {
  const t = useT();
  const n = useName();
  const locale = useLocale();
  const image = heroImage('area', area.id);
  const hotelCount = hotels.filter((h) => h.areaId === area.id).length;
  const placeCount = places.filter((p) => p.areaId === area.id).length;

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onSelect(area.id)}
        onMouseEnter={() => onHover?.(area.id)}
        onMouseLeave={() => onHover?.(null)}
        data-active={selected}
        className="rail-row"
        data-testid={`area-row-${area.id}`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold leading-tight tracking-[-0.01em] text-ink">
            {n.primary(area)}
          </span>
          <span className="mt-[2px] block truncate text-[11.5px] leading-tight text-muted">
            {pick(area.taglineZh, area.tagline, locale)}
          </span>
        </span>
        <span className="shrink-0 text-[11px] tabular-nums text-faint">{hotelCount + placeCount}</span>
      </button>
    );
  }

  return (
    <article
      className={cn(
        'group overflow-hidden rounded-card border bg-surface transition-colors duration-150',
        selected ? 'border-accent/45' : 'border-line hover:border-line-strong',
      )}
      data-testid={`area-card-${area.id}`}
    >
      <button
        type="button"
        onClick={() => onSelect(area.id)}
        onMouseEnter={() => onHover?.(area.id)}
        onMouseLeave={() => onHover?.(null)}
        className="block w-full text-left"
      >
        <ImageFrame
          image={image}
          variant="card"
          sizes="(max-width: 1023px) 100vw, 360px"
          showCredit
          fallbackLabel={t('image.noPhoto')}
        />
        <div className="px-4 pb-4 pt-3.5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[18px] font-semibold leading-tight tracking-[-0.018em] text-ink">{n.primary(area)}</h3>
            <span className="shrink-0 text-[11px] tabular-nums text-faint">
              {hotelCount > 0 ? `${hotelCount} hotels · ` : ''}
              {t('explore.placeCount', { count: placeCount })}
            </span>
          </div>
          <p className="mt-1.5 text-[12.5px] font-medium leading-tight text-accent">
            {pick(area.taglineZh, area.tagline, locale)}
          </p>
          <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-soft">
            {pick(area.summaryZh, area.summary, locale)}
          </p>
        </div>
      </button>
    </article>
  );
}

/**
 * The expanded area view. This is where a traveller commits to a region, so it
 * is the one place we allow a longer read — but still organised as scannable
 * lines rather than paragraphs.
 */
export function AreaDetail({
  area,
  hotels,
  places,
  airportMinutes,
  onShowHotels,
  onShowPlaces,
  onClose,
}: {
  area: Area;
  hotels: Hotel[];
  places: Place[];
  airportMinutes?: { min: number; max: number } | null;
  onShowHotels: () => void;
  onShowPlaces: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const n = useName();
  const locale = useLocale();
  const image = heroImage('area', area.id);
  const areaHotels = hotels.filter((h) => h.areaId === area.id);
  const marriott = areaHotels.filter((h) => h.hotelGroup === 'marriott').length;
  const hilton = areaHotels.filter((h) => h.hotelGroup === 'hilton').length;
  const placeCount = places.filter((p) => p.areaId === area.id).length;

  return (
    <article className="panel mm-enter overflow-hidden" data-testid="area-detail">
      <ImageFrame
        image={image}
        variant="hero"
        priority
        sizes="(max-width: 1023px) 100vw, 400px"
        showCredit
        fallbackLabel={t('image.noPhoto')}
      />
      <div className="px-4 pb-4 pt-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[24px] font-semibold leading-none tracking-[-0.02em] text-ink">{n.primary(area)}</h2>
            <p className="mt-1.5 text-[12.5px] font-medium text-accent">
              {pick(area.taglineZh, area.tagline, locale)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost btn-xs -mr-1.5 shrink-0 text-faint hover:text-ink">
            Close
          </button>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">{pick(area.summaryZh, area.summary, locale)}</p>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-3.5">
          <div>
            <dt className="label-caps">{t('label.bestFor')}</dt>
            <dd className="mt-1 text-[12.5px] leading-snug text-ink-soft">
              {pickList(area.bestForZh, area.bestFor, locale).slice(0, 5).join(' · ')}
            </dd>
          </div>
          <div>
            <dt className="label-caps">{t('label.weakFor')}</dt>
            <dd className="mt-1 text-[12.5px] leading-snug text-ink-soft">
              {pickList(area.weakForZh, area.weakFor, locale).slice(0, 3).join(' · ')}
            </dd>
          </div>
        </dl>

        {airportMinutes && (
          <p className="mt-3.5 border-t border-line pt-3 text-[12.5px] text-muted">
            <span className="font-medium text-ink-soft tabular-nums">
              ≈{airportMinutes.min}–{airportMinutes.max} min
            </span>{' '}
            {t('explore.fromAirport')}
          </p>
        )}

        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          {marriott > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11.5px]">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-marriott" aria-hidden="true" />
              {t('explore.marriottCount', { count: marriott })}
            </span>
          )}
          {hilton > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11.5px]">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-hilton" aria-hidden="true" />
              {t('explore.hiltonCount', { count: hilton })}
            </span>
          )}
          <span className="rounded-full border border-line px-2.5 py-1 text-[11.5px] text-muted">
            {t('explore.placeCount', { count: placeCount })}
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" className="btn-secondary btn-xs flex-1" onClick={onShowHotels}>
            {t('explore.seeHotels')}
          </button>
          <button type="button" className="btn-secondary btn-xs flex-1" onClick={onShowPlaces}>
            {t('explore.seePlaces')}
          </button>
        </div>
      </div>
    </article>
  );
}
