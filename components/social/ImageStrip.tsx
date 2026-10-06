'use client';

import type { ImportImage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/use-t';
import { useImageUrls } from './use-image-urls';

/**
 * A run of imported images.
 *
 * Every place these appear, the same three things have to be true, and each one
 * is a rule from the brief rather than a styling choice:
 *
 *   - The frame is numbered (§34). "图片 3" is what the traveller sees in the
 *     post and what the provenance line says; a thumbnail with no number breaks
 *     the link between the two.
 *   - The image is labelled private (§20). A small marker on every frame, not a
 *     footnote somewhere else, because the question "is this going to end up
 *     public?" is asked while looking at the picture.
 *   - It is never shown at full size in a list (§30). Thumbnails only.
 */

export interface ImageStripProps {
  images: ImportImage[];
  /** Which frames are already attached to this place. */
  attachedIds?: Set<string>;
  /** Renders the images as toggleable rather than decorative. */
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (imageId: string) => void;
  onOpen?: (imageId: string) => void;
  size?: 'sm' | 'md';
  className?: string;
  /** Shows a muted ＋ tile at the end, for "add more". */
  onAdd?: () => void;
  emptyLabel?: string;
}

export function ImageStrip({
  images,
  attachedIds,
  selectable = false,
  selectedIds,
  onToggle,
  onOpen,
  size = 'md',
  className,
  onAdd,
  emptyLabel,
}: ImageStripProps) {
  const t = useT();
  const urls = useImageUrls(images);
  const dimension = size === 'sm' ? 'h-[52px] w-[52px]' : 'h-[68px] w-[68px]';

  if (images.length === 0 && !onAdd) {
    return emptyLabel ? <p className="text-[11px] text-faint">{emptyLabel}</p> : null;
  }

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {images.map((image) => {
        const url = urls.get(image.id);
        const selected = selectedIds?.has(image.id) ?? false;
        const attached = attachedIds?.has(image.id) ?? false;
        const interactive = selectable && Boolean(onToggle);
        const Tag = interactive ? 'button' : 'div';
        return (
          <Tag
            key={image.id}
            {...(interactive
              ? { type: 'button' as const, onClick: () => onToggle?.(image.id), 'aria-pressed': selected }
              : {})}
            data-testid={`import-image-${image.id}`}
            data-index={image.originalIndex}
            className={cn(
              'group relative shrink-0 overflow-hidden rounded-lg border bg-surface-2 transition-colors',
              dimension,
              selected ? 'border-accent ring-2 ring-accent/30' : 'border-line',
              interactive && 'hover:border-accent/50',
            )}
            title={image.caption ?? `${t('import.imageLabel')} ${image.originalIndex}`}
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={`${t('import.imageLabel')} ${image.originalIndex}`}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[10px] text-faint">
                {t('import.imageMissing')}
              </span>
            )}

            {/* The number the provenance line refers to. */}
            <span className="absolute left-0.5 top-0.5 rounded bg-black/60 px-1 text-[9.5px] font-medium tabular-nums text-white">
              {image.originalIndex}
            </span>

            {/* §20's boundary, stated where the question is actually asked. */}
            <span
              className="absolute bottom-0.5 left-0.5 rounded bg-black/55 px-[3px] text-[8.5px] leading-[12px] text-white/90"
              title={t('import.imagePrivateHint')}
            >
              {t('import.imagePrivate')}
            </span>

            {attached && (
              <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[9px] text-white">
                ✓
              </span>
            )}

            {!interactive && onOpen && (
              <button
                type="button"
                className="absolute inset-0"
                onClick={() => onOpen(image.id)}
                aria-label={`${t('import.imageLabel')} ${image.originalIndex}`}
              />
            )}
          </Tag>
        );
      })}

      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          data-testid="import-image-add"
          className={cn(
            'shrink-0 rounded-lg border border-dashed border-line-strong bg-surface text-faint transition-colors hover:border-accent/50 hover:text-accent',
            dimension,
          )}
        >
          <span className="block text-[15px] leading-none">＋</span>
          <span className="mt-0.5 block text-[9.5px]">{t('import.addImages')}</span>
        </button>
      )}
    </div>
  );
}
