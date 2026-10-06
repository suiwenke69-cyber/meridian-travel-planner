'use client';

import type { Airport, Hotel, HotelStyle, Place, PlaceImage, PropertyType } from '@/lib/types';
import { findEntity, getDestination } from '@/lib/data';
import { getHotelBrand } from '@/lib/data/hotel-brands';
import { heroImage, imagesByRole } from '@/lib/images';
import { useLocale, useName, useT, type NameFormatter, type Translator } from '@/lib/i18n/use-t';
import { pick, pickList } from '@/lib/i18n';
import type { MessageKey } from '@/lib/i18n/messages';
import { useTripStore } from '@/lib/store/trip-store';
import { isRefInTrip } from '@/lib/trip';
import { cn } from '@/lib/utils';
import { ImageFrame } from '../ui/ImageFrame';
import { ConfidenceBadge, Tag } from '../ui/primitives';
import { AddToTripButton } from './AddToTripButton';

type EntityRef = NonNullable<ReturnType<typeof findEntity>>;

/** Generic property types and styles are copy; brand names stay Latin. */
const PROPERTY_TYPE_KEY: Record<PropertyType, MessageKey> = {
  'Luxury Resort': 'propertyType.luxury-resort',
  Resort: 'propertyType.resort',
  'Beach Resort': 'propertyType.beach-resort',
  'Villa Resort': 'propertyType.villa-resort',
  'City Hotel': 'propertyType.city-hotel',
  'Boutique Hotel': 'propertyType.boutique-hotel',
};

const STYLE_KEY: Record<HotelStyle, MessageKey> = {
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
  Resort: 'style.resort',
  City: 'style.city',
};

const CATEGORY_KEY: Record<string, MessageKey> = {
  marriott: 'stay.filterMarriott',
  hilton: 'stay.filterHilton',
  activity: 'cat.activity',
  nature: 'cat.nature',
  beach: 'cat.beach',
  food: 'cat.food',
  nightlife: 'cat.nightlife',
  transport: 'label.transport',
  airport: 'label.airport',
};

/** Captions for gallery thumbnails, whose `depicts` values are a closed set. */
const DEPICTS_KEY: Record<string, MessageKey> = {
  beach: 'depicts.beach',
  dining: 'depicts.dining',
  exterior: 'depicts.exterior',
  grounds: 'depicts.grounds',
  lobby: 'depicts.lobby',
  pool: 'depicts.pool',
  room: 'depicts.room',
};

function depictsText(t: Translator, depicts: string | undefined): string | null {
  if (!depicts || depicts === 'general') return null;
  const key = DEPICTS_KEY[depicts];
  return key ? t(key) : depicts.charAt(0).toUpperCase() + depicts.slice(1);
}

/** Minutes, in the units of the active locale. Mirrors `lib/geo`'s formatter. */
function formatDuration(t: Translator, minutes: number): string {
  const m = Math.round(minutes);
  if (m < 60) return t('unit.minutes', { count: m });
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? t('unit.hours', { count: h }) : t('duration.hourMinute', { h, m: rem });
}

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
  const t = useT();
  const locale = useLocale();
  const name = useName();
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
        <p className="text-sm text-muted">{t('detail.missing')}</p>
        <button type="button" className="btn-secondary btn-xs mt-3" onClick={onClose}>
          {t('detail.close')}
        </button>
      </div>
    );
  }

  const kind = entity.kind;
  const record = kind === 'hotel' ? entity.hotel : kind === 'place' ? entity.place : entity.airport;
  const areaId = kind === 'hotel' ? entity.hotel.areaId : kind === 'place' ? entity.place.areaId : undefined;
  const area = destination.areas.find((a) => a.id === areaId) ?? null;
  const areaName = area ? name.primary(area) : null;
  const canonicalName = secondaryName(name, entity);

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
            caption={extras.length > 0 ? depictsText(t, hero?.depicts) : null}
            priority
            sizes="(max-width: 1023px) 50vw, 260px"
            fallbackLabel={
              kind === 'hotel'
                ? t('detail.noPhotoHotel')
                : t('detail.noPhotoName', { name: primaryName(name, entity) })
            }
          />
          {extras.map((image) => (
            <LabelledImage
              key={image.id}
              image={image}
              caption={depictsText(t, image.depicts)}
              sizes="(max-width: 1023px) 50vw, 180px"
              fallbackLabel={t('detail.noPhotoPlace')}
            />
          ))}
        </div>
      )}

      <header className="px-4 pb-2 pt-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[20px] font-semibold leading-tight tracking-[-0.018em] text-ink">
              {primaryName(name, entity)}
            </h2>
            <p className="mt-1 text-[12px] leading-snug text-muted">
              {subtitle(entity, areaName, canonicalName, locale, t)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost btn-xs -mr-1.5 shrink-0 text-faint hover:text-ink"
            aria-label={t('detail.close')}
          >
            {t('detail.close')}
          </button>
        </div>
      </header>

      <div className="px-4 pb-4">
        {kind === 'hotel' && <HotelFacts hotel={entity.hotel} />}
        {kind === 'place' && <PlaceFacts place={entity.place} />}
        {kind === 'airport' && <AirportFacts airport={entity.airport} />}

        {kind === 'hotel' && (
          <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
            {pick(entity.hotel.descriptionZh, entity.hotel.description, locale)}
          </p>
        )}
        {kind === 'place' && (
          <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
            {pick(entity.place.descriptionZh, entity.place.description, locale)}
          </p>
        )}

        {kind === 'place' && entity.place.notes && (
          <p className="mt-3 rounded-card border border-line bg-paper px-3 py-2 text-[12px] leading-relaxed text-ink-soft">
            <span className="label-caps mb-1 block">{t('label.practical')}</span>
            {pick(entity.place.notesZh, entity.place.notes, locale)}
          </p>
        )}

        {kind === 'hotel' && (
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            <span className="font-medium text-ink-soft">{entity.hotel.priceTier}</span> · {entity.hotel.priceTierBasis}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {kind === 'place' &&
            pickList(entity.place.tagsZh, entity.place.tags, locale)
              .slice(0, 4)
              .map((tag) => <Tag key={tag}>{tag}</Tag>)}
          {kind === 'hotel' &&
            entity.hotel.tags.slice(0, 4).map((tag) => <Tag key={tag}>{t(STYLE_KEY[tag])}</Tag>)}
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
              {t('detail.remove')}
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

function primaryName(name: NameFormatter, entity: EntityRef): string {
  if (entity.kind === 'hotel') return name.primary(entity.hotel);
  if (entity.kind === 'place') return name.primary(entity.place);
  return `${entity.airport.code} · ${entity.airport.name}`;
}

function secondaryName(name: NameFormatter, entity: EntityRef): string | null {
  if (entity.kind === 'hotel') return name.secondary(entity.hotel);
  if (entity.kind === 'place') return name.secondary(entity.place);
  return null;
}

function subtitle(
  entity: EntityRef,
  areaName: string | null,
  canonicalName: string | null,
  locale: 'zh-CN' | 'en',
  t: Translator,
): string {
  if (entity.kind === 'hotel') {
    const brand = getHotelBrand(entity.hotel.brandId);
    return [
      canonicalName,
      areaName,
      brand?.name ?? entity.hotel.brand,
      t(PROPERTY_TYPE_KEY[entity.hotel.propertyType]),
    ]
      .filter(Boolean)
      .join(' · ');
  }
  if (entity.kind === 'place') {
    return [
      canonicalName,
      areaName,
      entity.place.subcategory,
      pick(entity.place.bestTimeZh, entity.place.bestTime, locale),
    ]
      .filter(Boolean)
      .join(' · ');
  }
  return [entity.airport.city, t('detail.airportSuffix')].filter(Boolean).join(' · ');
}

function HotelFacts({ hotel }: { hotel: Hotel }) {
  const t = useT();
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-y border-line py-3">
      <Fact label={t('label.loyalty')} value={hotel.loyaltyProgramme} />
      <Fact
        label={t('label.airport')}
        value={t('unit.minutesFromAirport', {
          code: 'DPS',
          min: hotel.airportTransfer.minutesMin,
          max: hotel.airportTransfer.minutesMax,
        })}
      />
      <Fact label={t('label.beach')} value={t(`beachAccess.${hotel.beachAccess}` as MessageKey)} />
      <Fact
        label={t('label.bestFor')}
        value={hotel.tags
          .slice(0, 3)
          .map((tag) => t(STYLE_KEY[tag]))
          .join(' · ')}
      />
    </dl>
  );
}

function PlaceFacts({ place }: { place: Place }) {
  const t = useT();
  const locale = useLocale();
  const categoryKey = CATEGORY_KEY[place.markerLayer];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-y border-line py-3">
      <Fact label={t('label.recommendedDuration')} value={formatDuration(t, place.recommendedDurationMin)} />
      <Fact label={t('label.bestTime')} value={pick(place.bestTimeZh, place.bestTime, locale)} />
      <Fact label={t('label.category')} value={categoryKey ? t(categoryKey) : place.category} />
      {place.entryFee ? (
        <Fact label={t('label.entry')} value={pick(place.entryFeeZh, place.entryFee, locale)} />
      ) : (
        <Fact label={t('label.area')} value={place.subcategory} />
      )}
    </dl>
  );
}

function AirportFacts({ airport }: { airport: Airport }) {
  const t = useT();
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-y border-line py-3">
      <Fact
        label={t('detail.fromSingapore')}
        value={airport.directFromSingapore ? t('detail.nonStop') : t('detail.connectionRequired')}
      />
      {airport.flightMinutes && (
        <Fact
          label={t('detail.blockTime')}
          value={`${formatDuration(t, airport.flightMinutes.min)}–${formatDuration(t, airport.flightMinutes.max)}`}
        />
      )}
      {airport.airlines && <Fact label={t('detail.carriers')} value={airport.airlines.slice(0, 3).join(' · ')} />}
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
