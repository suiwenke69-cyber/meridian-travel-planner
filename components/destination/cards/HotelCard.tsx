'use client';

import type { Hotel } from '@/lib/types';
import { heroImage, imagesByRole } from '@/lib/images';
import { getHotelBrand } from '@/lib/data/hotel-brands';
import { cn } from '@/lib/utils';
import { ImageFrame } from '../../ui/ImageFrame';
import { AddToTripButton } from '../AddToTripButton';
import { IconCameraOff } from '../../ui/icons';

const BEACH_LABEL: Record<Hotel['beachAccess'], string> = {
  excellent: 'Beachfront',
  good: 'Near the beach',
  limited: 'Beach nearby',
  none: 'No beach',
};

/**
 * A hotel card leads with the property, then the three things that actually
 * decide a booking in this product: which loyalty programme it earns, what kind
 * of stay it is, and where it is.
 *
 * Price is a tier, never a rate, and the basis is on the detail card.
 */
export function HotelCard({
  hotel,
  areaName,
  selected,
  inTrip,
  destinationId,
  onSelect,
  onHover,
}: {
  hotel: Hotel;
  areaName: string;
  selected: boolean;
  inTrip: boolean;
  destinationId: string;
  onSelect: () => void;
  onHover?: (id: string | null) => void;
}) {
  const image = heroImage('hotel', hotel.id);
  const gallery = imagesByRole('hotel', hotel.id, 'gallery');
  const brand = getHotelBrand(hotel.brandId);
  const isMarriott = hotel.hotelGroup === 'marriott';
  const hasPropertyPhotography = Boolean(image);

  return (
    <article
      className={cn(
        'overflow-hidden rounded-card border bg-surface transition-colors duration-150',
        selected ? 'border-accent/50' : 'border-line hover:border-line-strong',
      )}
      onMouseEnter={() => onHover?.(hotel.id)}
      onMouseLeave={() => onHover?.(null)}
      data-testid={`hotel-card-${hotel.id}`}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        {hasPropertyPhotography ? (
        <div className="relative">
          <ImageFrame
            image={image}
            variant="card"
            sizes="(max-width: 1023px) 100vw, 380px"
            showCredit
            fallbackLabel="No property photography available"
            fallbackTone="area"
          />
          {gallery.length > 0 && (
            <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
              {gallery.length + 1} photos
            </span>
          )}
          {inTrip && (
            <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              In trip
            </span>
          )}
        </div>
        ) : (
          <div className="flex items-center gap-2 border-b border-line bg-paper-warm px-3.5 py-2">
            <span className="text-muted/50">
              <IconCameraOff size={14} />
            </span>
            <span className="text-[10.5px] leading-tight text-muted">
              No property photography available for this hotel
            </span>
            {inTrip && (
              <span className="ml-auto shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                In trip
              </span>
            )}
          </div>
        )}

        <div className="px-3.5 pb-2.5 pt-3">
          <div className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className={cn(
                'mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[10px] font-bold text-white',
                isMarriott ? 'rounded-[4px] bg-marriott' : 'rounded-full bg-hilton',
              )}
            >
              {isMarriott ? 'M' : 'H'}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[14.5px] font-semibold leading-snug tracking-[-0.01em] text-ink">{hotel.name}</h3>
              <p className="mt-0.5 text-[11.5px] leading-snug text-muted">
                {areaName}
                <span className="mx-1.5 text-line-strong" aria-hidden="true">
                  ·
                </span>
                {brand?.name ?? hotel.brand}
              </p>
            </div>
            <span className="shrink-0 text-[11.5px] font-medium tabular-nums text-ink-soft" title={hotel.priceTierBasis}>
              {hotel.priceTier}
            </span>
          </div>

          <p className="mt-2 text-[11.5px] leading-snug text-ink-soft">
            {hotel.propertyType}
            <span className="mx-1.5 text-line-strong" aria-hidden="true">
              ·
            </span>
            {BEACH_LABEL[hotel.beachAccess]}
            <span className="mx-1.5 text-line-strong" aria-hidden="true">
              ·
            </span>
            ≈{hotel.airportTransfer.minutesMin}–{hotel.airportTransfer.minutesMax} min DPS
          </p>
        </div>
      </button>

      <div className="flex items-center justify-between gap-2 px-3.5 pb-3">
        <span className="truncate text-[11px] text-faint">{hotel.tags.slice(0, 3).join(' · ')}</span>
        <AddToTripButton destinationId={destinationId} refId={hotel.id} size="sm" />
      </div>
    </article>
  );
}
