'use client';

import type { Place } from '@/lib/types';
import { heroImage } from '@/lib/images';
import { LAYER_BY_ID } from '@/lib/layers';
import { formatMinutes } from '@/lib/geo';
import { cn } from '@/lib/utils';
import { ImageFrame } from '../../ui/ImageFrame';
import { AddToTripButton } from '../AddToTripButton';

/**
 * A place card is a photograph, a name, and the three facts that decide whether
 * it fits today: what kind of thing it is, how long it takes, and when to go.
 * Descriptions are clamped — the detail card holds the full text.
 */
export function PlaceCard({
  place,
  areaName,
  selected,
  inTrip,
  destinationId,
  onSelect,
  onHover,
}: {
  place: Place;
  areaName: string;
  selected: boolean;
  inTrip: boolean;
  destinationId: string;
  onSelect: () => void;
  onHover?: (id: string | null) => void;
}) {
  const image = heroImage('place', place.id);
  const layer = LAYER_BY_ID[place.markerLayer];

  return (
    <article
      className={cn(
        'overflow-hidden rounded-card border bg-surface transition-colors duration-150',
        selected ? 'border-accent/50' : 'border-line hover:border-line-strong',
      )}
      onMouseEnter={() => onHover?.(place.id)}
      onMouseLeave={() => onHover?.(null)}
      data-testid={`place-card-${place.id}`}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        {image ? (
          <div className="relative">
            <ImageFrame
              image={image}
              variant="card"
              sizes="(max-width: 1023px) 100vw, 380px"
              fallbackLabel={`${place.name} — no photo yet`}
            />
            <span
              className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-2 py-0.5 text-[10px] font-semibold text-ink backdrop-blur"
              aria-hidden="true"
            >
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: layer?.color }} />
              {layer?.label}
            </span>
            {inTrip && (
              <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                In trip
              </span>
            )}
          </div>
        ) : (
          /*
           * No photo yet. An empty 3:2 box the height of the photograph it is
           * standing in for made these cards look broken and pushed two of them
           * off the screen — the card becomes text-led instead, and says why.
           */
          <div className="flex items-center gap-2 border-b border-line bg-paper-warm px-3.5 py-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: layer?.color }}
              aria-hidden="true"
            />
            <span className="text-[10.5px] leading-tight text-muted">
              {layer?.label} · no photo of this place yet
            </span>
            {inTrip && (
              <span className="ml-auto shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                In trip
              </span>
            )}
          </div>
        )}

        <div className="px-3.5 pb-2.5 pt-3">
          <h3 className="text-[14.5px] font-semibold leading-snug tracking-[-0.01em] text-ink">{place.name}</h3>
          <p className="mt-0.5 text-[11.5px] leading-snug text-muted">
            {areaName}
            <span className="mx-1.5 text-line-strong" aria-hidden="true">
              ·
            </span>
            {place.bestTime}
          </p>
          <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-ink-soft">{place.description}</p>
          <p className="mt-2 text-[11.5px] tabular-nums text-faint">
            {formatMinutes(place.recommendedDurationMin)} recommended
          </p>
        </div>
      </button>

      <div className="flex items-center justify-end px-3.5 pb-3">
        <AddToTripButton destinationId={destinationId} refId={place.id} size="sm" />
      </div>
    </article>
  );
}
