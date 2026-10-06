'use client';

import { useEffect, useState } from 'react';
import type { ImportImage } from '@/lib/types';
import { getImageBlob } from '@/lib/research/image-store';

/**
 * Object URLs for a set of imported images.
 *
 * Blobs live in IndexedDB, so every render needs them turned into something an
 * `<img>` can use — and every object URL is a leak until it is revoked. Doing
 * that in an effect keyed on the image IDS (not the array, which is a new
 * reference on every store write) means a re-render does not re-read twenty
 * blobs off disk, and unmounting cleans up.
 *
 * The variant matters: a card list asks for `thumb`, which is why twenty cards
 * render without twenty 1600px bitmaps in memory (§30).
 */
export function useImageUrls(images: ImportImage[], variant: 'full' | 'thumb' = 'thumb'): Map<string, string> {
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  // A stable key: ids and their hashes, so a caption edit does not re-decode.
  const key = images.map((image) => image.id).join('|');

  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];

    (async () => {
      const next = new Map<string, string>();
      for (const image of images) {
        const blob = await getImageBlob(image.id, variant);
        if (!blob) continue;
        const url = URL.createObjectURL(blob);
        created.push(url);
        next.set(image.id, url);
      }
      if (cancelled) {
        for (const url of created) URL.revokeObjectURL(url);
        return;
      }
      setUrls((previous) => {
        for (const url of previous.values()) URL.revokeObjectURL(url);
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, variant]);

  // Final cleanup on unmount only.
  useEffect(
    () => () => {
      setUrls((previous) => {
        for (const url of previous.values()) URL.revokeObjectURL(url);
        return new Map();
      });
    },
    [],
  );

  return urls;
}
