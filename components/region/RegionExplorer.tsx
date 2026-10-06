'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Destination } from '@/lib/types';
import {
  DESTINATIONS,
  SINGAPORE_ORIGIN,
  destinationStats,
  hasDirectFromSingapore,
  primaryRouteSummary,
} from '@/lib/data';

import { cn } from '@/lib/utils';
import { formatStayRange } from '@/lib/date';
import { BottomSheet, type SheetSnap } from '../ui/BottomSheet';
import { EmptyState } from '../ui/primitives';
import { IconArrowRight, IconInfo, IconSearch } from '../ui/icons';
import { Popover } from '../ui/Popover';
import { DestinationPreviewCard } from './DestinationPreviewCard';
import { useIsDesktop } from '@/lib/hooks';

const RegionMapView = dynamic(() => import('./RegionMapView'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[var(--map-land)]">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
        Loading the map…
      </div>
    </div>
  ),
});

type RailFilter = 'all' | 'direct' | 'beach' | 'weekend';

const FILTERS: Array<{ id: RailFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'direct', label: 'Direct' },
  { id: 'beach', label: 'Beach' },
  { id: 'weekend', label: 'Weekend' },
];

/**
 * The homepage.
 *
 * The map is the interface: a full-bleed Southeast Asia canvas with a slim
 * destination rail and a preview card that appears in place when a destination
 * is chosen. The user never leaves the map to compare options.
 */
export default function RegionExplorer() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<RailFilter>('all');
  // Collapsed by default: on a phone the map must own the screen, with the
  // search field just visible as the invitation to explore.
  const [snap, setSnap] = useState<SheetSnap>('peek');
  const isDesktop = useIsDesktop();

  const destinations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return DESTINATIONS.filter((destination) => {
      if (filter === 'direct' && !hasDirectFromSingapore(destination)) return false;
      if (filter === 'beach' && !destination.tags.includes('Beach')) return false;
      if (filter === 'weekend' && destination.recommendedDays.ideal > 4) return false;
      if (!needle) return true;
      return (
        destination.name.toLowerCase().includes(needle) ||
        destination.country.toLowerCase().includes(needle) ||
        destination.bestFor.some((tag) => tag.toLowerCase().includes(needle)) ||
        destination.tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    });
  }, [query, filter]);

  const selected = useMemo(() => DESTINATIONS.find((d) => d.id === selectedId) ?? null, [selectedId]);
  const stats = useMemo(() => (selected ? destinationStats(selected.id) : null), [selected]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSnap('half');
  };

  const rail = (
    <DestinationRail
      destinations={destinations}
      selectedId={selectedId}
      hoveredId={hoveredId}
      query={query}
      filter={filter}
      onQueryChange={setQuery}
      onFilterChange={setFilter}
      onSelect={handleSelect}
      onHover={setHoveredId}
    />
  );

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-paper">
      <TopBar />

      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <RegionMapView
            destinations={DESTINATIONS}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={handleSelect}
            onHover={setHoveredId}
            onBackgroundClick={() => setSelectedId(null)}
            sheetSnap={snap}
          />
        </div>

        {isDesktop ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-[500] flex w-[326px] flex-col p-3">
            <div className="pointer-events-auto flex min-h-0 flex-1 flex-col">{rail}</div>
          </div>
        ) : (
          <BottomSheet
            snap={snap}
            onSnapChange={setSnap}
            peekHeight={158}
            ariaLabel="Destinations"
            header={
              selected && stats ? (
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate text-sm font-semibold tracking-tight">{selected.name}</span>
                  <span className="truncate text-2xs text-muted">
                    {primaryRouteSummary(selected).durationLabel}
                  </span>
                </div>
              ) : (
                <div className="min-w-0">
                  <span className="block text-sm font-semibold tracking-tight">Where do you want to go?</span>
                  <span className="block truncate text-2xs text-muted">
                    {DESTINATIONS.length} destinations from Singapore
                  </span>
                </div>
              )
            }
          >
            {selected && stats ? (
              <div className="p-3">
                <DestinationPreviewCard
                  destination={selected}
                  stats={stats}
                  onClose={() => setSelectedId(null)}
                />
              </div>
            ) : (
              <div className="p-3">{rail}</div>
            )}
          </BottomSheet>
        )}

        {isDesktop && selected && stats && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-[500] flex w-[380px] flex-col justify-start p-3">
            <div className="pointer-events-auto scroll-area min-h-0">
              <DestinationPreviewCard
                destination={selected}
                stats={stats}
                onClose={() => setSelectedId(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

/**
 * The top bar frames the map rather than competing with it: one line of
 * identity, one line of context, no navigation.
 */
function TopBar() {
  return (
    <header className="surface-blur relative z-[520] flex shrink-0 items-center gap-3 border-b border-line/80 px-4 py-2">
      <Link href="/" className="flex items-baseline gap-2.5">
        <span className="text-[13px] font-semibold uppercase tracking-[0.22em] text-ink">Meridian</span>
        <span className="hidden text-[11.5px] tracking-tight text-muted sm:inline">
          Southeast Asia Travel Planner
        </span>
      </Link>
      <div className="ml-auto flex items-center gap-1.5">
        <span className="text-[11px] tracking-tight text-muted">
          Departing <span className="font-semibold text-ink-soft">{SINGAPORE_ORIGIN.airports[0].code}</span>
        </span>
        {/*
          Data provenance lives behind a small affordance rather than in the
          primary interface. The product should read as finished; the honesty
          about what is curated and what is not belongs one click away.
        */}
        <Popover
          ariaLabel="About this data"
          align="end"
          panelClassName="w-[320px] p-3.5"
          trigger={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              aria-label="About this data"
              className="btn-ghost btn-xs -mr-1 px-1.5 text-faint hover:text-ink-soft"
            >
              <IconInfo size={14} />
            </button>
          )}
        >
          <p className="label-caps">About this data</p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-soft">
            Destinations, areas and places are curated static data. Geographic coordinates were verified
            against published sources, and anything that could not be verified to a specific point is
            marked <span className="font-medium text-ink">approximate</span> on its detail card.
          </p>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
            Flight durations and carriers are sample schedule data, not live availability. No fares,
            nightly rates or availability are shown anywhere — we have no pricing source and will not
            invent one.
          </p>
        </Popover>
      </div>
    </header>
  );
}

function DestinationRail({
  destinations,
  selectedId,
  hoveredId,
  query,
  filter,
  onQueryChange,
  onFilterChange,
  onSelect,
  onHover,
}: {
  destinations: Destination[];
  selectedId: string | null;
  hoveredId: string | null;
  query: string;
  filter: RailFilter;
  onQueryChange: (value: string) => void;
  onFilterChange: (value: RailFilter) => void;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  return (
    <div className="panel flex min-h-0 flex-1 flex-col overflow-hidden" data-testid="destination-rail">
      <div className="shrink-0 px-3 pb-2.5 pt-3">
        <label className="relative block">
          <IconSearch size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Where do you want to go?"
            aria-label="Search destinations"
            className="w-full rounded-lg border border-line bg-surface-warm py-2 pl-8 pr-3 text-[13px] text-ink placeholder:text-faint transition-colors duration-150 focus:border-accent/40 focus:bg-surface focus:outline-none focus:ring-[3px] focus:ring-accent/[0.09]"
          />
        </label>

        <div className="mt-2.5 flex flex-wrap gap-1">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={filter === option.id}
              onClick={() => onFilterChange(option.id)}
              className={cn(
                'rounded-full border px-2.5 py-[5px] text-[11.5px] font-medium transition-colors duration-150',
                filter === option.id
                  ? 'border-accent/25 bg-accent-soft text-accent'
                  : 'border-line bg-surface text-ink-soft hover:border-line-strong',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-area min-h-0 flex-1 px-1.5 pb-2">
        {destinations.length === 0 ? (
          <EmptyState
            title="Nothing matches"
            body="Try a different spelling, or clear the filters to see every destination."
            action={
              <button
                type="button"
                className="btn-secondary btn-xs"
                onClick={() => {
                  onQueryChange('');
                  onFilterChange('all');
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <ul>
            {destinations.map((destination) => (
              <li key={destination.id}>
                <DestinationRow
                  destination={destination}
                  active={destination.id === selectedId}
                  hovered={destination.id === hoveredId}
                  onSelect={onSelect}
                  onHover={onHover}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * A destination row reads like a line from a travel guide, not a database row:
 * name, country, how long it takes to get there, and how long to stay.
 */
function DestinationRow({
  destination,
  active,
  hovered,
  onSelect,
  onHover,
}: {
  destination: Destination;
  active: boolean;
  hovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const route = primaryRouteSummary(destination);
  // A single typical block time. The full range is on the preview card — a
  // range in the rail pushed the country line into an ellipsis for no gain.
  const duration = route.airport?.flightMinutes
    ? `≈${formatDurationCompact(
        Math.round((route.airport.flightMinutes.min + route.airport.flightMinutes.max) / 10) * 5,
      )}`
    : null;

  return (
    <button
      type="button"
      data-testid={`destination-item-${destination.id}`}
      data-active={active}
      aria-current={active ? 'true' : undefined}
      onClick={() => onSelect(destination.id)}
      onMouseEnter={() => onHover(destination.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(destination.id)}
      onBlur={() => onHover(null)}
      className={cn('rail-row', hovered && !active && 'bg-black/[0.028]')}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-semibold leading-tight tracking-[-0.01em] text-ink">
          {destination.name}
        </span>
        <span className="mt-[3px] block truncate text-[12px] leading-tight text-muted">
          {destination.country}
          <span className="mx-1.5 text-line-strong" aria-hidden="true">
            ·
          </span>
          {formatStayRange(destination.recommendedDays)}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[12.5px] font-medium tabular-nums leading-tight text-ink-soft">
          {duration ?? '—'}
        </span>
        <span
          className={cn(
            'mt-[3px] block text-[11px] leading-tight',
            route.direct ? 'font-medium text-accent' : 'text-faint',
          )}
        >
          {route.direct ? 'Direct' : '1 stop'}
        </span>
      </span>
      <IconArrowRight
        size={14}
        className={cn(
          'shrink-0 text-faint transition-opacity duration-150',
          hovered || active ? 'opacity-100' : 'opacity-0',
        )}
      />
    </button>
  );
}

/**
 * Compact duration for tabular contexts: "2h 45m" rather than "2 h 45 m".
 * The spaced form reads well in a sentence and badly in a column.
 */
export function formatDurationCompact(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}
