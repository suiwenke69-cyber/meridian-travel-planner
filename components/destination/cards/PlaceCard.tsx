'use client';

import type { Place } from '@/lib/types';
import { heroImage } from '@/lib/images';
import { LAYER_BY_ID } from '@/lib/layers';
import { isLocatable } from '@/lib/data';
import { cuisineLabel, recommendedForLabel } from '@/lib/data/place-taxonomy';
import { useT, useName, useLocale } from '@/lib/i18n/use-t';
import type { MessageKey } from '@/lib/i18n/messages';
import { pick, pickList } from '@/lib/i18n';
import { useResearchSignals } from '@/lib/research/store';
import { cn } from '@/lib/utils';
import { ImageFrame } from '../../ui/ImageFrame';
import { AddToTripButton } from '../AddToTripButton';
import { IconCameraOff } from '../../ui/icons';

/**
 * A place card leads with the photograph, then the facts that decide whether it
 * fits today, then what other travellers said about it.
 *
 * The Chinese name leads and the canonical name follows it. That pairing is
 * deliberate and appears wherever a venue is named: a traveller reads 乌鲁瓦图神庙
 * and then searches "Uluwatu Temple" in Grab, and a card that only showed one of
 * the two would fail at one of those two jobs.
 *
 * Social signals are shown as an aggregate over the guides this researcher has
 * imported — "在 12 份已收录攻略中被提及" is a statement about our own corpus,
 * which is checkable. There is no popularity claim, because we have no
 * methodology that would support one.
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
  const t = useT();
  const name = useName();
  const locale = useLocale();
  const signals = useResearchSignals();

  const image = heroImage('place', place.id);
  const layer = LAYER_BY_ID[place.markerLayer];
  const signal = signals.get(place.id);
  const secondName = name.secondary(place);
  const locatable = isLocatable(place);

  const suits = (place.recommendedFor ?? []).slice(0, 3).map((id) => recommendedForLabel(id, locale));
  const signature = place.dining?.signatureItems ?? [];

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
              fallbackLabel={t('do.noPhoto')}
            />
            <span
              className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-2 py-0.5 text-[10px] font-semibold text-ink backdrop-blur"
              aria-hidden="true"
            >
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: layer?.color }} />
              {t(`cat.${layer?.id ?? 'activity'}` as MessageKey)}
            </span>
            {inTrip && (
              <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white">
                {t('do.inTrip')}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 border-b border-line bg-paper-warm px-3.5 py-2">
            <span className="text-muted/60">
              <IconCameraOff size={13} />
            </span>
            <span className="text-[10.5px] leading-tight text-muted">
              {t('do.noPhotoCategory', { category: t(`cat.${layer?.id ?? 'activity'}` as MessageKey) })}
            </span>
            {inTrip && (
              <span className="ml-auto shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white">
                {t('do.inTrip')}
              </span>
            )}
          </div>
        )}

        <div className="px-3.5 pb-2.5 pt-3">
          <h3 className="text-[14.5px] font-semibold leading-snug tracking-[-0.01em] text-ink">
            {name.primary(place)}
          </h3>
          {secondName && <p className="mt-0.5 text-[11.5px] font-medium text-ink-soft">{secondName}</p>}
          <p className="mt-1 text-[11.5px] leading-snug text-muted">
            {areaName}
            <span className="mx-1.5 text-line-strong" aria-hidden="true">
              ·
            </span>
            {subcategoryLabel(place, t)}
          </p>

          {/* Restaurant-specific, and only what we actually hold */}
          {place.dining && (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-muted">
              <span className="font-medium text-ink-soft">{place.dining.priceTier}</span>
              {place.dining.cuisines.slice(0, 2).map((c) => (
                <span key={c}>{cuisineLabel(c, locale)}</span>
              ))}
              {place.dining.mealTypes.length > 0 && (
                <span>{place.dining.mealTypes.slice(0, 3).map((m) => t(`meal.${m}` as MessageKey)).join(' / ')}</span>
              )}
            </p>
          )}

          <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-ink-soft">
            {pick(place.descriptionZh, place.description, locale)}
          </p>

          {suits.length > 0 && (
            <p className="mt-2 text-[11.5px] leading-snug text-muted">
              <span className="text-faint">{t('label.recommendedFor')}：</span>
              {suits.join(' · ')}
            </p>
          )}

          {signature.length > 0 && (
            <p className="mt-1 text-[11.5px] leading-snug text-muted">
              <span className="text-faint">{t('label.signatureDishes')}：</span>
              {signature.join(' · ')}
            </p>
          )}

          <p className="mt-1 text-[11.5px] tabular-nums text-faint">
            {t('label.recommendedDuration')} {formatMinutes(place.recommendedDurationMin, t)}
            <span className="mx-1.5" aria-hidden="true">
              ·
            </span>
            {pick(place.bestTimeZh, place.bestTime, locale)}
          </p>

          {!locatable && (
            <p className="mt-2 rounded-md border border-warn/30 bg-warn/[0.07] px-2 py-1 text-[10.5px] leading-snug text-warn">
              {t('label.approximateLocation')} — {t('detail.notOnMap')}
            </p>
          )}
        </div>
      </button>

      {/* Aggregated research signal. Absent entirely when there is nothing to say. */}
      {signal && signal.mentionCount > 0 && (
        <div className="mx-3.5 mb-2.5 rounded-lg border border-line bg-paper px-2.5 py-2" data-testid={`place-social-${place.id}`}>
          <p className="flex flex-wrap items-baseline gap-x-2 text-[11.5px] font-medium text-ink-soft">
            <span className="label-caps">{t('social.title')}</span>
            <span className="text-accent">{t('social.mentionCount', { count: signal.mentionCount })}</span>
          </p>
          {signal.frequentlyMentioned.length > 0 && (
            <p className="mt-1 text-[11px] leading-snug text-muted">
              <span className="text-faint">{t('social.frequentlyMentioned')}：</span>
              {signal.frequentlyMentioned.join(' · ')}
            </p>
          )}
          {signal.themes.length > 0 && (
            <p className="mt-0.5 text-[11px] leading-snug text-muted">
              <span className="text-faint">{t('social.themes')}：</span>
              {signal.themes.join(' · ')}
            </p>
          )}
          <p className="mt-1 text-[10px] leading-snug text-faint">{t('social.disclaimer')}</p>
        </div>
      )}

      <div className="flex items-center justify-end px-3.5 pb-3">
        {locatable ? (
          <AddToTripButton destinationId={destinationId} refId={place.id} size="sm" />
        ) : (
          <span className="text-[11px] text-faint">{t('detail.notOnMap')}</span>
        )}
      </div>
    </article>
  );
}

/** Subcategory as a message key, falling back to the authored English string. */
function subcategoryLabel(place: Place, t: ReturnType<typeof useT>): string {
  const slug = place.subcategory.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const key = `subcategory.${slug}` as MessageKey;
  const value = t(key);
  return value === key ? place.subcategory : value;
}

/** Minutes as 1 小时 30 分钟 / 1 h 30 min, never "90". */
function formatMinutes(minutes: number, t: ReturnType<typeof useT>): string {
  if (minutes < 60) return t('duration.minuteOnly', { m: minutes });
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? t('duration.hourOnly', { h }) : t('duration.hourMinute', { h, m });
}

export { pickList };
