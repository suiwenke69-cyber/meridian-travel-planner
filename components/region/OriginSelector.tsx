'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { OriginCity } from '@/lib/types';
import { ORIGIN_REGIONS, airportCodesFor, getOriginCities, originMatchesQuery } from '@/lib/data/origins';
import { useOriginStore } from '@/lib/store/origin-store';
import { useT, useLocale } from '@/lib/i18n/use-t';
import type { MessageKey } from '@/lib/i18n/messages';
import { cn } from '@/lib/utils';
import { IconArrowDown, IconCheck, IconSearch } from '../ui/icons';

/**
 * The origin selector.
 *
 * DESIGN CONSTRAINTS, FROM THE BRIEF
 * ----------------------------------
 * Compact, premium, Chinese-first, map-first. Not a modal, not an airport form,
 * not a flight-search box. Changing origin should take a few seconds.
 *
 * So it is a small pill in the header that opens a 300 px popover: a search
 * field, the cities grouped by region, and nothing else. There is no "confirm"
 * step — choosing a city closes the popover and reorients the map immediately,
 * because that is the whole point of the control.
 *
 * SEARCH MATCHES WHAT PEOPLE ACTUALLY TYPE
 * ----------------------------------------
 * 广州, Guangzhou and CAN all resolve, because all three are how a person refers
 * to the same place depending on what is in front of them.
 */
export function OriginSelector({
  className,
  variant = 'header',
  /**
   * Which edge the popover hangs from. The header trigger sits at the top right,
   * so the panel must open leftwards or it runs off the viewport — which is
   * exactly what the first version did.
   */
  align = 'right',
  /**
   * Distinguishes the two instances the homepage renders — one in the top bar
   * and one inside the mobile rail. Both are in the DOM at every viewport (one
   * is CSS-hidden), so they must not share a test id.
   */
  testId = 'origin-trigger',
}: {
  className?: string;
  variant?: 'header' | 'hero';
  align?: 'left' | 'right';
  testId?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const originCityId = useOriginStore((s) => s.originCityId);
  const setOrigin = useOriginStore((s) => s.setOrigin);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cities = useMemo(() => getOriginCities(), []);
  const current = cities.find((c) => c.id === originCityId) ?? cities[0];

  const grouped = useMemo(() => {
    const matched = cities.filter((c) => originMatchesQuery(c, query));
    return ORIGIN_REGIONS.map((region) => ({
      region,
      cities: matched.filter((c) => c.region === region.id),
    })).filter((group) => group.cities.length > 0);
  }, [cities, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    // Focus the field on open: the control exists to be typed into.
    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      clearTimeout(timer);
    };
  }, [open]);

  const label = (city: OriginCity) =>
    locale === 'zh-CN' ? city.cityNameZh : city.cityNameEn;

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setQuery('');
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        data-testid={testId}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border transition-colors',
          variant === 'hero'
            ? 'border-line-strong bg-surface/95 px-3 py-1.5 text-[13.5px] font-semibold shadow-sm hover:border-accent/40'
            : 'border-line bg-surface px-2.5 py-[5px] text-[12px] font-medium hover:border-line-strong',
        )}
      >
        <span className="text-muted">{t('origin.from')}</span>
        <span className="font-semibold text-ink" data-testid={`${testId}-city`}>
          {label(current)}
        </span>
        <span className="tabular-nums text-faint" data-testid={`${testId}-codes`}>
          {airportCodesFor(current)}
        </span>
        <IconArrowDown size={12} className="text-muted" />
      </button>

      {open && (
        <div
          role="listbox"
          data-testid={`${testId}-panel`}
          className={cn(
            'surface-blur absolute top-[calc(100%+6px)] z-[600] w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-card border border-line shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          <div className="border-b border-line p-2">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5">
              <IconSearch size={13} className="shrink-0 text-faint" />
              <input
                ref={inputRef}
                data-testid={`${testId}-search`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('origin.searchPlaceholder')}
                aria-label={t('origin.choose')}
                className="w-full bg-transparent text-[12.5px] text-ink placeholder:text-faint focus:outline-none"
              />
            </div>
            {query.trim().length === 0 && (
              <p className="mt-1.5 px-0.5 text-[10.5px] leading-snug text-faint">{t('origin.searchHint')}</p>
            )}
          </div>

          <div className="scroll-area max-h-[340px] p-1.5">
            {grouped.length === 0 ? (
              <div className="px-2 py-5 text-center">
                <p className="text-[12.5px] font-medium text-ink">{t('origin.noResults')}</p>
                <p className="mt-1 text-[11px] text-muted">{t('origin.noResultsHint')}</p>
              </div>
            ) : (
              grouped.map(({ region, cities: groupCities }) => (
                <div key={region.id} className="mb-1 last:mb-0">
                  <p className="label-caps px-2 pb-1 pt-2">
                    {t(`origin.region.${region.id}` as MessageKey)}
                  </p>
                  <ul>
                    {groupCities.map((city) => {
                      const active = city.id === originCityId;
                      return (
                        <li key={city.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={active}
                            data-testid={`${testId}-option-${city.id}`}
                            onClick={() => {
                              setOrigin(city.id);
                              setOpen(false);
                            }}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors',
                              active ? 'bg-accent-soft' : 'hover:bg-black/[0.04]',
                            )}
                          >
                            <span className="min-w-0 flex-1">
                              <span
                                className={cn(
                                  'block truncate text-[13px] font-medium',
                                  active ? 'text-accent' : 'text-ink',
                                )}
                              >
                                {label(city)}
                              </span>
                              <span className="mt-[1px] block truncate text-[11px] text-muted">
                                {airportCodesFor(city)}
                                <span className="mx-1 text-line-strong" aria-hidden="true">
                                  ·
                                </span>
                                {city.airports.length > 1
                                  ? t('origin.airportsCount', { count: city.airports.length })
                                  : city.airports[0].nameZh}
                              </span>
                            </span>
                            {active && <IconCheck size={14} className="shrink-0 text-accent" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>

          {/*
            The future hook for 考虑附近机场. The data is already on each city; this
            states the capability without pretending to act on it yet.
          */}
          {current.nearbyOriginIds.length > 0 && (
            <div className="border-t border-line px-2.5 py-2">
              <p className="text-[10.5px] leading-snug text-faint">
                {t('origin.nearbyHint')}
                {' · '}
                {current.nearbyOriginIds
                  .map((id) => cities.find((c) => c.id === id))
                  .filter((c): c is OriginCity => Boolean(c))
                  .map((c) => label(c))
                  .join(' / ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OriginSelector;
