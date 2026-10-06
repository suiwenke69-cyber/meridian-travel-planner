import type { ImageProviderId, ImageRole, PlaceImage } from '../types';
import { BALI_IMAGES } from '../data/images/bali-images';

/**
 * Image resolution is a provider concern, not a component concern.
 *
 * Components never contain an image URL. They ask for images by
 * (entityKind, entityId) and receive a `PlaceImage[]` that already carries its
 * licence, author and — critically — what the photo actually depicts. Swapping
 * Wikimedia Commons for a licensed photo CDN later means adding a provider here
 * and changing nothing else.
 */

export type EntityKind = 'destination' | 'area' | 'hotel' | 'place';

export interface ImageProvider {
  id: ImageProviderId;
  label: string;
  /** Returns images for an entity, best first. Empty when nothing is available. */
  resolve(kind: EntityKind, id: string): PlaceImage[];
}

/**
 * The shipped provider: a manifest generated from Wikimedia Commons at build
 * time by `scripts/fetch-bali-images.mjs`. No runtime network call, and the
 * whole set is reproducible.
 */
export const manifestImageProvider: ImageProvider = {
  id: 'wikimedia-commons',
  label: 'Wikimedia Commons & Openverse',
  resolve(kind, id) {
    return BALI_IMAGES[`${kind}:${id}`] ?? [];
  },
};

/** Used when a deployment has no imagery at all; the UI renders fallback states. */
export const nullImageProvider: ImageProvider = {
  id: 'none',
  label: 'No imagery',
  resolve: () => [],
};

let activeProvider: ImageProvider = manifestImageProvider;

export function setImageProvider(provider: ImageProvider) {
  activeProvider = provider;
}

export function getImageProvider(): ImageProvider {
  return activeProvider;
}

// --- helpers ---------------------------------------------------------------

export function getImages(kind: EntityKind, id: string): PlaceImage[] {
  return activeProvider.resolve(kind, id);
}

export function heroImage(kind: EntityKind, id: string): PlaceImage | undefined {
  const images = getImages(kind, id);
  return images.find((i) => i.role === 'hero') ?? images[0];
}

export function imagesByRole(kind: EntityKind, id: string, role: ImageRole): PlaceImage[] {
  return getImages(kind, id).filter((i) => i.role === role);
}

/**
 * True when a photo is of the entity itself rather than its surroundings. Cards
 * use this to decide whether to print a "representative image" disclosure.
 */
export function isOwnPhoto(image: PlaceImage): boolean {
  return image.subject === 'subject';
}

/** A short, honest caption for images that are not of the entity itself. */
export function imageDisclosure(image: PlaceImage): string | null {
  switch (image.subject) {
    case 'subject':
      return null;
    case 'area':
      return 'Area photo — not this specific property';
    case 'category':
      return 'Representative photo';
    default:
      return 'Representative photo';
  }
}

/** A short label for what a photo shows, used on gallery thumbnails. */
export function depictsLabel(depicts: string | undefined): string | null {
  if (!depicts || depicts === 'general') return null;
  return depicts.charAt(0).toUpperCase() + depicts.slice(1);
}

const PROVIDER_LABEL: Record<string, string> = {
  'wikimedia-commons': 'Wikimedia Commons',
  openverse: 'Openverse',
  'curated-local': 'Curated',
  none: 'Unknown',
};

export function imageCredit(image: PlaceImage): string {
  const { author, license, provider } = image.source;
  const who = author && author !== 'Unknown' ? author : (PROVIDER_LABEL[provider] ?? 'Unknown');
  return `${who} · ${license}`;
}

export function providerLabel(provider: string): string {
  return PROVIDER_LABEL[provider] ?? provider;
}

export { BALI_IMAGES };
