'use client';

import { useState } from 'react';
import type { PlaceImage } from '@/lib/types';
import { useT } from '@/lib/i18n/use-t';
import { cn } from '@/lib/utils';
import { IconCameraOff, IconMapPin } from './icons';

/**
 * Every photograph in the product goes through this component.
 *
 * It exists because photography is now a core product element, which means the
 * unhappy paths matter as much as the happy one:
 *
 *   - no image at all      → a calm placeholder, never a broken icon
 *   - image fails to load  → the same placeholder, swapped in on error
 *   - representative image → a visible disclosure, so a hotel card showing its
 *                            beach never implies it is showing the hotel
 *
 * The aspect ratio is fixed by the caller so images reserve their space and the
 * map never jumps when a photo arrives.
 */

export type ImageVariant = 'hero' | 'card' | 'thumb';

const VARIANT_CLASS: Record<ImageVariant, string> = {
  hero: 'aspect-[16/10]',
  card: 'aspect-[3/2]',
  thumb: 'aspect-square',
};

export function ImageFrame({
  image,
  variant = 'card',
  className,
  showCredit = false,
  showDisclosure = true,
  sizes,
  priority = false,
  fallbackLabel,
  fallbackTone = 'neutral',
}: {
  image?: PlaceImage;
  variant?: ImageVariant;
  className?: string;
  showCredit?: boolean;
  showDisclosure?: boolean;
  sizes?: string;
  priority?: boolean;
  /** Shown in the placeholder when there is no photo. */
  fallbackLabel?: string;
  fallbackTone?: 'neutral' | 'area';
}) {
  const [failed, setFailed] = useState(false);
  const t = useT();
  const usable = image && !failed;
  // A photo that is not of the entity itself must say so. The label is authored
  // per locale rather than derived from `imageDisclosure`, which only has English.
  const disclosure =
    showDisclosure && image
      ? image.subject === 'subject'
        ? null
        : image.subject === 'area'
          ? t('image.areaPhoto')
          : t('image.representative')
      : null;

  return (
    <figure className={cn('relative overflow-hidden bg-paper-warm', VARIANT_CLASS[variant], className)}>
      {usable ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.url}
          alt={image.alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          sizes={sizes}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <Placeholder label={fallbackLabel} tone={fallbackTone} variant={variant} />
      )}

      {(disclosure || (showCredit && usable)) && (
        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2.5 pb-1.5 pt-6">
          {disclosure && (
            <span className="block text-[10px] font-medium leading-tight text-white/90">{disclosure}</span>
          )}
          {showCredit && usable && (
            <span className="mt-0.5 block truncate text-[9.5px] leading-tight text-white/60">
              {t('image.credit', { author: image.source.author, license: image.source.license })}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * The fallback is deliberately quiet and branded rather than a grey box or a
 * broken-image glyph: a destination with no photography should still look
 * finished.
 */
function Placeholder({
  label,
  tone,
  variant,
}: {
  label?: string;
  tone: 'neutral' | 'area';
  variant: ImageVariant;
}) {
  /*
   * A hotel with no verified photography must not borrow its area's image —
   * that implies a beach is the property. This state says so plainly and still
   * looks intentional rather than broken.
   *
   * The label is already localized by the caller, so the test matches both
   * languages: in zh-CN the absence copy carries 暂无…照片 rather than "no photo".
   */
  const t = useT();
  const isAbsence = /no .*photography|no photo|暂无.*照片/i.test(label ?? '');
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-1.5 px-3 text-center',
        tone === 'area' ? 'bg-[#EFEDE7]' : 'bg-paper-warm',
      )}
      aria-hidden={!label}
    >
      <span className={cn('text-faint/60', tone === 'area' && 'text-muted/50')}>
        {variant === 'thumb' ? (
          <IconMapPin size={14} />
        ) : isAbsence ? (
          <IconCameraOff size={20} />
        ) : (
          <IconMapPin size={18} />
        )}
      </span>
      {variant !== 'thumb' && (
        <span
          className={cn(
            'max-w-[22ch] text-[10.5px] leading-snug',
            tone === 'area' ? 'text-muted' : 'text-faint',
          )}
        >
          {label ?? t('image.noPhoto')}
        </span>
      )}
    </div>
  );
}
