import type { PlaceImage } from '../../types';
import { BALI_IMAGES } from './bali-images';
import { PHU_QUOC_IMAGES } from './phu-quoc-images';

/**
 * Every shipped manifest, keyed by destination.
 *
 * Kept separate rather than merged at the source so a key collision between two
 * destinations is a visible fact instead of a silently overwritten entry.
 * `ALL_IMAGES` is built by the same rule the provider uses, and
 * `scripts/test-images.mts` fails if two destinations ever claim the same
 * `kind:id` — which would mean one destination's card showing another
 * destination's photograph.
 */
export const IMAGES_BY_DESTINATION: Record<string, Record<string, PlaceImage[]>> = {
  bali: BALI_IMAGES,
  'phu-quoc': PHU_QUOC_IMAGES,
};

export const ALL_IMAGES: Record<string, PlaceImage[]> = Object.assign(
  {},
  ...Object.values(IMAGES_BY_DESTINATION),
);

export { BALI_IMAGES, PHU_QUOC_IMAGES };
