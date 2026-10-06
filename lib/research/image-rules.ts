/**
 * Image cost control.
 *
 * Imported images are the expensive part of this feature in every dimension
 * that matters: browser memory, IndexedDB quota, upload time on a phone, and
 * tokens if a vision model ever reads them (§30, §31). None of that is visible
 * to a traveller who drags in thirty screenshots, so it is bounded here rather
 * than discovered in production.
 *
 * Everything in this file is pure. The parts that touch a canvas or a database
 * live in `image-store.ts`, so the numbers and the arithmetic can be tested
 * without a browser — which is the only reason the test suite can cover them.
 */

/** A Xiaohongshu post rarely has more than eighteen frames; twenty is generous. */
export const MAX_IMAGES_PER_IMPORT = 20;
/** Refused before the file is even read. A 40MP HEIC is not a travel note. */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
/** What we keep. Big enough to read a menu, small enough to hold twenty of. */
export const STORED_MAX_EDGE = 1600;
export const STORED_QUALITY = 0.82;
/** What a list renders. Never the stored image. */
export const THUMB_MAX_EDGE = 320;
export const THUMB_QUALITY = 0.72;
/**
 * What a vision model is shown.
 *
 * 1024 is the compromise §31 asks for: the long edge stays large enough that
 * signage and menu text survive, while the payload drops by roughly an order of
 * magnitude against a modern phone photo. Sending the original would cost more
 * and read no better.
 */
export const ANALYSIS_MAX_EDGE = 1024;
export const ANALYSIS_QUALITY = 0.8;
/**
 * Images per multimodal call.
 *
 * Batching four frames into one request cuts request overhead and lets the model
 * relate a sequence — a storefront, then the plate, then the sign — which is
 * exactly the signal §6 wants and a per-image call cannot see. Beyond four, small
 * text stops surviving the downscale.
 */
export const ANALYSIS_BATCH_SIZE = 4;
/** Total stored bytes one import may hold, after downscaling. */
export const MAX_IMPORT_IMAGE_BYTES = 40 * 1024 * 1024;

export type ImageLimitCode =
  | 'too_many_images'
  | 'image_too_large'
  | 'unsupported_image_type'
  | 'import_images_too_large';

export interface ImageLimitViolation {
  code: ImageLimitCode;
  messageKey:
    | 'import.error.tooManyImages'
    | 'import.error.imageTooLarge'
    | 'import.error.unsupportedImageType'
    | 'import.error.importImagesTooLarge';
  detail?: string;
}

/** Formats a byte count for a human. Used in the UI's budget line. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The size an image should be stored at.
 *
 * Never upscales: a 600px screenshot stays 600px, because enlarging it would
 * cost bytes and add no information. Aspect ratio is preserved exactly, and the
 * rounding is floored at 1 so a 4000×3 panorama cannot produce a zero-height
 * canvas, which throws in every browser.
 */
export function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { width: 1, height: 1 };
  }
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width: Math.round(width), height: Math.round(height) };
  const scale = maxEdge / longest;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** What the browser can decode and what we want to store. */
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif']);

export interface UploadCandidate {
  size: number;
  type: string;
  name?: string;
}

/**
 * Whether one more file may be added.
 *
 * Checks type, per-file size and count, in that order, so the traveller gets the
 * most specific reason rather than "something went wrong". A 30MB HEIC and a
 * 25th screenshot are different problems.
 */
export function checkImageUpload(
  file: UploadCandidate,
  context: { existingCount: number; existingBytes: number; projectedBytes?: number },
): ImageLimitViolation | null {
  const type = file.type.toLowerCase();
  if (!ACCEPTED_TYPES.has(type)) {
    return { code: 'unsupported_image_type', messageKey: 'import.error.unsupportedImageType', detail: type || file.name };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { code: 'image_too_large', messageKey: 'import.error.imageTooLarge', detail: formatBytes(file.size) };
  }
  if (context.existingCount >= MAX_IMAGES_PER_IMPORT) {
    return {
      code: 'too_many_images',
      messageKey: 'import.error.tooManyImages',
      detail: String(MAX_IMAGES_PER_IMPORT),
    };
  }
  const projected = context.existingBytes + (context.projectedBytes ?? Math.min(file.size, MAX_UPLOAD_BYTES));
  if (projected > MAX_IMPORT_IMAGE_BYTES) {
    return {
      code: 'import_images_too_large',
      messageKey: 'import.error.importImagesTooLarge',
      detail: formatBytes(MAX_IMPORT_IMAGE_BYTES),
    };
  }
  return null;
}

/** Splits images into the batches a multimodal call is willing to take. */
export function batchItems<T>(items: T[], size: number = ANALYSIS_BATCH_SIZE): T[][] {
  if (size <= 0) return items.length > 0 ? [items] : [];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * How much of the budget is left, for the UI's one-line summary.
 *
 * `remaining` is reported rather than a percentage: "还可以添加 12 张" is a
 * statement a traveller can act on, and "38% used" is not.
 */
export function imageBudget(used: { count: number; bytes: number }): {
  remainingCount: number;
  remainingBytes: number;
  overCount: boolean;
} {
  return {
    remainingCount: Math.max(0, MAX_IMAGES_PER_IMPORT - used.count),
    remainingBytes: Math.max(0, MAX_IMPORT_IMAGE_BYTES - used.bytes),
    overCount: used.count >= MAX_IMAGES_PER_IMPORT,
  };
}

/**
 * Builds an image catalogue entry from a file that has already been stored.
 *
 * Kept pure and separate from `image-store.ts` for two reasons. It makes the
 * privacy default testable without a browser — `visibility` is set here and
 * nowhere else — and it puts the one rule that must never be violated (§20) in a
 * function small enough to read in full.
 *
 * There is deliberately no parameter for visibility. An imported image is
 * `private_import`; `user_contributed` exists for a future flow where somebody
 * offers their OWN photograph with explicit consent (§21) and is not reachable
 * from any import path.
 */
export function buildImageRecord(input: {
  id: string;
  importId: string;
  ownerProfileId: string;
  originalIndex: number;
  originalSource: 'xiaohongshu' | 'user_upload';
  width: number;
  height: number;
  bytes: number;
  contentHash: string;
  caption?: string;
  createdAt?: string;
}): import('../types').ImportImage {
  return {
    id: input.id,
    importId: input.importId,
    ownerProfileId: input.ownerProfileId,
    storageReference: `${input.id}:full`,
    thumbnailReference: `${input.id}:thumb`,
    caption: input.caption,
    originalSource: input.originalSource,
    originalIndex: input.originalIndex,
    width: input.width,
    height: input.height,
    bytes: input.bytes,
    contentHash: input.contentHash,
    // Waiting to be read. `unsupported` and `failed` are set by the analyzer.
    analysisStatus: 'pending',
    // §20's boundary, in one line.
    visibility: 'private_import',
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}
