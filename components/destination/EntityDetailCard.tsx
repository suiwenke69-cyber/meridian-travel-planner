'use client';

import type { Airport, Hotel, Place, PlaceImage } from '@/lib/types';
import { findEntity, getDestination } from '@/lib/data';
import { getHotelBrand } from '@/lib/data/hotel-brands';
import { LAYER_BY_ID } from '@/lib/layers';
import { formatMinutes } from '@/lib/geo';
import { depictsLabel, heroImage, imagesByRole } from '@/lib/images';
import { useTripStore } from '@/lib/store/trip-store';
import { isRefInTrip } from '@/lib/trip';
import { cn } from '@/lib/utils';
import { ImageFrame } from '../ui/ImageFrame';
import { ConfidenceBadge, Tag } from '../ui/primitives';
import { AddToTripButton } from './AddToTripButton';

/**
 * The detail card for whatever is selected on the map.
 *
 * Photography leads, because at this point the traveller is judging whether
 * they want to go — not reading a record. Facts are laid out as short labelled
 * lines rather than a table, and the coordinate-confidence badge is always
 * present so an approximate placement is never presented as surveyed.
 */
export function EntityDetailCard({
  destinationId,
  entityId,
  onClose,
}: {
  destinationId: string;
  entityId: string;
  onClose: () => void;
}) {
  const destination = getDestination(destinationId);
  const entity = findEntity(destinationId, entityId);
  const trip = useTripStore((s) => {
    const active = s.trips.find((t) => t.id === s.activeTripId);
    if (active && active.destinationId === destinationId) return active;
    return (
      s.trips.filter((t) => t.destinationId === destinationId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ??
      null
    );
  });

  if (!destination || !entity) {
    return (
      <div className="panel p-4">
        <p className="text-sm text-muted">This place is no longer in the dataset.</p>
        <button type="button" className="btn-secondary btn-xs mt-3" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  const kind = entity.kind;
  const record = kind === 'hotel' ? entity.hotel : kind === 'place' ? entity.place : entity.airport;
  const areaId = kind === 'hotel' ? entity.hotel.areaId : kind === 'place' ? entity.place.areaId : undefined;
  const areaName = destination.areas.find((a) => a.id === areaId)?.name ?? null;

  const images = kind === 'airport' ? [] : imagesByRole(kind, record.id, 'gallery');
  const hero = kind === 'airport' ? undefined : heroImage(kind, record.id);
  const extras = images.filter((i) => i.id !== hero?.id).slice(0, 2);
  const inTrip = isRefInTrip(trip, entityId);

  return (
    <article className="panel mm-enter overflow-hidden" data-testid="place-detail">
      {kind !== 'airport' && (
        <div className="grid gap-px bg-line" style={{ gridTemplateColumns: `repeat(${1 + extras.length}, 1fr)` }}>
          {/* Every image is labelled with what it actually shows, so "room"
              gallery shots are never mistaken for the property itself. */}
          <LabelledImage
            image={hero}
            caption={extras.length > 0 ? depictsLabel(hero?.depicts) : null}
            priority
            sizes="(max-width: 1023px) 50vw, 260px"
            fallbackLabel={kind === 'hotel' ? 'No property photography available' : `${label(entity)} — no photo yet`}
          />
          {extras.map((image) => (
            <LabelledImage
              key={image.id}
              image={image}
              caption={depictsLabel(image.depicts)}
              sizes="(max-width: 1023px) 50vw, 180px"
              fallbackLabel="No photo yet"
            />
          ))}
        </div>
      )}

      <header className="px-4 pb-2 pt-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[20px] font-semibold leading-tight tracking-[-0.018em] text-ink">{label(entity)}</h2>
            <p className="mt-1 text-[12px] leading-snug text-muted">{subtitle(entity, areaName)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost btn-xs -mr-1.5 shrink-0 text-faint hover:text-ink"
            aria-label="Close details"
          >
            Close
          </button>
        </div>
      </header>

      <div className="px-4 pb-4">
        {kind === 'hotel' && <HotelFacts hotel={entity.hotel} />}
        {kind === 'place' && <PlaceFacts place={entity.place} />}
        {kind === 'airport' && <AirportFacts airport={entity.airport} />}

        {kind === 'hotel' && (
          <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">{entity.hotel.description}</p>
        )}
        {kind === 'place' && (
          <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">{entity.place.description}</p>
        )}

        {kind === 'place' && entity.place.notes && (
          <p className="mt-3 rounded-card border border-line bg-paper px-3 py-2 text-[12px] leading-relaxed text-ink-soft">
            <span className="label-caps mb-1 block">Practical</span>
            {entity.place.notes}
          </p>
        )}

        {kind === 'hotel' && (
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            <span className="font-medium text-ink-soft">{entity.hotel.priceTier}</span> · {entity.hotel.priceTierBasis}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {kind === 'place' &&
            entity.place.tags.slice(0, 4).map((tag) => <Tag key={tag}>{tag}</Tag>)}
          {kind === 'hotel' && entity.hotel.tags.slice(0, 4).map((tag) => <Tag key={tag}>{tag}</Tag>)}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <ConfidenceBadge confidence={record.coordinates.confidence} />
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          <AddToTripButton destinationId={destinationId} refId={entityId} className="flex-1" />
          {inTrip && (
            <button
              type="button"
              className="btn-ghost btn-xs text-danger"
              onClick={() => useTripStore.getState().removeItem(trip!.id, inTrip.itemId)}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function LabelledImage({
  image,
  caption,
  sizes,
  priority = false,
  fallbackLabel,
}: {
  image?: PlaceImage;
  caption: string | null;
  sizes: string;
  priority?: boolean;
  fallbackLabel: string;
}) {
  return (
    <div className="relative">
      <ImageFrame
        image={image}
        variant={priority ? 'card' : 'card'}
        priority={priority}
        sizes={sizes}
        showCredit={Boolean(priority)}
        fallbackLabel={fallbackLabel}
        fallbackTone={priority ? 'area' : 'neutral'}
      />
      {caption && image && (
        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/55 px-2 py-[1px] text-[9.5px] font-medium uppercase tracking-wide text-white backdrop-blur">
          {caption}
        </span>
      )}
    </div>
  );
}

function label(entity: NonNullable<ReturnType<typeof findEntity>>): string {
  if (entity.kind === 'hotel') return entity.hotel.name;
  if (entity.kind === 'place') return entity.place.name;
  return `${entity.airport.code} · ${entity.airport.name}`;
}

function subtitle(entity: NonNullable<ReturnType<typeof findEntity>>, areaName: string | null): string {
  if (entity.kind === 'hotel') {
    const brand = getHotelBrand(entity.hotel.brandId);
    return [areaName, brand?.name ?? entity.hotel.brand, entity.hotel.propertyType].filter(Boolean).join(' · ');
  }
  if (entity.kind === 'place') {
    return [areaName, entity.place.subcategory, entity.place.bestTime].filter(Boolean).join(' · ');
  }
  return `${entity.airport.city} · Airport`;
}

const BEACH_LABEL: Record<Hotel['beachAccess'], string> = {
  excellent: 'Beachfront',
  good: 'Near the beach',
  limited: 'Beach nearby',
  none: 'No beach access',
};

function HotelFacts({ hotel }: { hotel: Hotel }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-y border-line py-3">
      <Fact label="Loyalty" value={hotel.loyaltyProgramme} />
      <Fact label="Airport" value={`≈${hotel.airportTransfer.minutesMin}–${hotel.airportTransfer.minutesMax} min from DPS`} />
      <Fact label="Beach" value={BEACH_LABEL[hotel.beachAccess]} />
      <Fact label="Best for" value={hotel.tags.slice(0, 3).join(' · ')} />
    </dl>
  );
}

function PlaceFacts({ place }: { place: Place }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-y border-line py-3">
      <Fact label="Recommended" value={formatMinutes(place.recommendedDurationMin)} />
      <Fact label="Best time" value={place.bestTime} />
      <Fact label="Category" value={LAYER_BY_ID[place.markerLayer]?.label ?? place.category} />
      {place.entryFee ? <Fact label="Entry" value={place.entryFee} /> : <Fact label="Area" value={place.subcategory} />}
    </dl>
  );
}

function AirportFacts({ airport }: { airport: Airport }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-y border-line py-3">
      <Fact label="From Singapore" value={airport.directFromSingapore ? 'Non-stop' : 'Connection required'} />
      {airport.flightMinutes && (
        <Fact
          label="Block time"
          value={`${formatMinutes(airport.flightMinutes.min)}–${formatMinutes(airport.flightMinutes.max)}`}
        />
      )}
      {airport.airlines && <Fact label="Carriers" value={airport.airlines.slice(0, 3).join(' · ')} />}
    </dl>
  );
}

function Fact({ label: text, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="label-caps">{text}</dt>
      <dd className="mt-0.5 text-[12.5px] leading-snug text-ink">{value}</dd>
    </div>
  );
}
