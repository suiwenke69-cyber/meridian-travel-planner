'use client';

import type { TransportLeg, TransportMode } from '@/lib/types';
import { formatKm, formatMinutes } from '@/lib/geo';
import { modeLabel } from '@/lib/transport/recommend';
import { cn } from '@/lib/utils';
import { IconAlert } from '../ui/icons';

/**
 * A transport leg, rendered as a first-class row between two stops.
 *
 * The summary line is deliberately shaped like the sentence a traveller would
 * say out loud — "Car / Grab · ≈35 min · 18 km" — because that is the question
 * the row exists to answer.
 *
 * Honesty rules enforced here:
 *   - a routing engine's numbers are labelled as a free-flow estimate, because
 *     traffic is not modelled;
 *   - when nothing answered, the row says so and shows only the straight-line
 *     distance, explicitly marked as not a driving distance;
 *   - there is no third state. A number on this row was either produced by an
 *     engine or it is not here.
 */
export function TransportLegRow({
  leg,
  selected,
  onSelect,
  onHover,
}: {
  leg: TransportLeg;
  selected: boolean;
  onSelect: () => void;
  onHover?: (id: string | null) => void;
}) {
  const unavailable = leg.source === 'unavailable';
  const multimodal = leg.multimodal;

  return (
    <div className="relative flex gap-2 pl-[52px] pr-1" data-testid={`transport-leg-${leg.id}`}>
      {/* Connector rail, aligned with the timeline column. */}
      <div className="absolute left-[26px] top-0 flex h-full w-4 flex-col items-center" aria-hidden="true">
        <span className={cn('w-px flex-1', unavailable ? 'bg-line-strong' : 'bg-accent/30')} />
      </div>

      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={() => onHover?.(leg.id)}
        onMouseLeave={() => onHover?.(null)}
        className={cn(
          'my-1 w-full rounded-lg border px-2.5 py-2 text-left transition-colors duration-150',
          selected
            ? 'border-accent/40 bg-accent-soft'
            : 'border-line/70 bg-paper-warm/60 hover:border-line-strong hover:bg-paper-warm',
        )}
      >
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span aria-hidden="true" className="text-[14px] leading-none">
            {MODE_GLYPH[leg.mode]}
          </span>
          <span className="text-[12.5px] font-semibold tracking-[-0.005em] text-ink">{MODE_TITLE[leg.mode]}</span>
          {!unavailable && (
            <>
              <span className="text-line-strong" aria-hidden="true">
                ·
              </span>
              <span className="text-[12.5px] font-medium tabular-nums text-ink-soft">
                ≈{formatMinutes((leg.durationSeconds ?? 0) / 60)}
              </span>
              <span className="text-line-strong" aria-hidden="true">
                ·
              </span>
              <span className="text-[12.5px] tabular-nums text-ink-soft">
                {formatKm((leg.distanceMeters ?? 0) / 1000)}
              </span>
            </>
          )}
          {multimodal && (
            <span className="rounded-full border border-accent/25 bg-white/70 px-2 py-[1px] text-[10px] font-medium text-accent">
              two modes · via {multimodal.via}
            </span>
          )}
        </span>

        {unavailable ? (
          <span className="mt-1 flex items-start gap-1.5 text-[11.5px] leading-snug text-warn">
            <IconAlert size={12} className="mt-[2px] shrink-0" />
            <span>
              Route unavailable — no routing service answered.{' '}
              <span className="text-muted">
                The straight line is {formatKm(leg.straightLineMeters / 1000)}, which is not a driving distance.
              </span>
            </span>
          </span>
        ) : (
          <span className="mt-1 block text-[11.5px] leading-snug text-muted">{leg.rationale}</span>
        )}

        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {unavailable ? (
            <span className="rounded-full border border-warn/30 bg-warn/[0.07] px-2 py-[1px] text-[10px] font-medium text-warn">
              No route data
            </span>
          ) : (
            <span
              className="rounded-full border border-line bg-white/70 px-2 py-[1px] text-[10px] text-muted"
              title="Distance and duration come from this routing engine. Traffic is not modelled, so the time is a free-flow estimate."
            >
              {leg.providerId === 'osrm' ? 'OSRM road route' : (leg.providerId ?? 'routing engine')} · free-flow estimate
            </span>
          )}
          {leg.alternatives.length > 0 && !unavailable && (
            <span className="text-[10.5px] text-faint">or {leg.alternatives.slice(0, 2).map(modeLabel).join(' / ')}</span>
          )}
        </span>
      </button>
    </div>
  );
}

/** Names chosen to match how a traveller would say them out loud. */
const MODE_TITLE: Record<TransportMode, string> = {
  walk: 'Walk',
  taxi: 'Taxi',
  grab: 'Car / Grab',
  'private-car': 'Private car & driver',
  scooter: 'Scooter',
  bus: 'Bus',
  train: 'Train',
  ferry: 'Ferry',
  'fast-boat': 'Fast boat',
  flight: 'Flight',
};

const MODE_GLYPH: Record<TransportMode, string> = {
  walk: '🚶',
  taxi: '🚕',
  grab: '🚗',
  'private-car': '🚙',
  scooter: '🛵',
  bus: '🚌',
  train: '🚆',
  ferry: '⛴',
  'fast-boat': '🚤',
  flight: '✈',
};
