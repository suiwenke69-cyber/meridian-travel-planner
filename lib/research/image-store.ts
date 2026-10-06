'use client';

import type { ImportImage } from '../types';
import {
  ANALYSIS_MAX_EDGE,
  ANALYSIS_QUALITY,
  STORED_MAX_EDGE,
  STORED_QUALITY,
  THUMB_MAX_EDGE,
  THUMB_QUALITY,
  buildImageRecord,
  fitWithin,
} from './image-rules';

/**
 * Where imported images actually live.
 *
 * WHY NOT THE IMPORT STORE
 * ------------------------
 * Trips and research history go in `localStorage`, which is a synchronous
 * string map with a ~5MB ceiling. One phone screenshot base64'd into it would
 * blow the quota and take the traveller's itinerary down with it. Images get
 * IndexedDB: asynchronous, binary, and large enough that twenty downscaled
 * frames fit without anyone thinking about it.
 *
 * WHY THREE COPIES OF EACH IMAGE
 * ------------------------------
 * They are not copies, they are three sizes for three jobs (§30):
 *
 *   thumb   320px  — what a list renders. Never the stored image: a review
 *                    screen with twenty cards must not decode twenty 1600px
 *                    bitmaps.
 *   stored  1600px — what the traveller actually looks at.
 *   analysis 1024px — what a vision model is shown. Generated on demand and
 *                    never persisted, because it is only ever transient payload.
 *
 * WHAT THIS IS NOT
 * ----------------
 * Not a public image host, and not a cache Meridian controls. Every record is
 * written with `visibility: 'private_import'` and the only reader is the local
 * profile that created it (§20). Nothing here is ever served to another
 * traveller, and there is no code path that would let it be.
 */

const DB_NAME = 'meridian.images.v1';
const DB_VERSION = 1;
const STORE_BLOBS = 'blobs';
const STORE_META = 'meta';

export interface StoredImageRecord {
  id: string;
  importId: string;
  ownerProfileId: string;
  caption?: string;
  originalSource: ImportImage['originalSource'];
  originalIndex: number;
  width: number;
  height: number;
  bytes: number;
  contentHash: string;
  visibility: ImportImage['visibility'];
  createdAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('indexeddb_unavailable'));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_BLOBS)) db.createObjectStore(STORE_BLOBS);
      if (!db.objectStoreNames.contains(STORE_META)) {
        const meta = db.createObjectStore(STORE_META, { keyPath: 'id' });
        meta.createIndex('byImport', 'importId');
        meta.createIndex('byHash', 'contentHash');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('indexeddb_open_failed'));
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const request = fn(transaction.objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('indexeddb_request_failed'));
      }),
  );
}

/** True when this browser can hold images at all. Private mode can refuse. */
export async function imageStoreAvailable(): Promise<boolean> {
  try {
    await openDb();
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Hashing and downscaling
// ---------------------------------------------------------------------------

/**
 * SHA-256 of the stored bytes.
 *
 * The point is §30's "do not duplicate the same image unnecessarily": a
 * traveller uploading the same screenshot twice, or re-importing a post whose
 * images they already have, should cost one record and one set of bytes. The
 * hash is computed over the STORED (downscaled) bytes rather than the original
 * file, because two exports of the same screenshot differ at the byte level far
 * more often than they differ visually.
 */
export async function hashBlob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      return [...new Uint8Array(digest)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 32);
    } catch {
      // Fall through.
    }
  }
  let hash = 0;
  const view = new Uint8Array(buffer);
  for (let i = 0; i < view.length; i += 1) hash = (Math.imul(31, hash) + view[i]) | 0;
  return `h${(hash >>> 0).toString(16)}`;
}

/** Loads a File into something a canvas can draw. */
async function decode(blob: Blob): Promise<{ width: number; height: number; draw: CanvasImageSource; release: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob);
      return { width: bitmap.width, height: bitmap.height, draw: bitmap, release: () => bitmap.close() };
    } catch {
      // Fall through to the <img> path — Safari rejects some HEIC-in-JPEG cases.
    }
  }
  const url = URL.createObjectURL(blob);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error('image_decode_failed'));
    element.src = url;
  });
  return {
    width: image.naturalWidth,
    height: image.naturalHeight,
    draw: image,
    release: () => URL.revokeObjectURL(url),
  };
}

/** Re-encodes a blob at a bounded edge length. Returns JPEG unless it was PNG. */
export async function downscale(blob: Blob, maxEdge: number, quality: number): Promise<Blob> {
  const source = await decode(blob);
  try {
    const size = fitWithin(source.width, source.height, maxEdge);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (!context) return blob;
    context.drawImage(source.draw, 0, 0, size.width, size.height);
    const type = blob.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const encoded = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    // If encoding failed or grew the file, the original is the better answer.
    if (!encoded || (type !== 'image/png' && encoded.size >= blob.size && blob.size <= maxEdge * maxEdge)) return blob;
    return encoded;
  } finally {
    source.release();
  }
}

/** The bytes a vision model is shown. Transient; never written to the database. */
export async function analysisPayload(blob: Blob): Promise<{ dataUrl: string; width: number; height: number }> {
  const resized = await downscale(blob, ANALYSIS_MAX_EDGE, ANALYSIS_QUALITY);
  const dataUrl = await blobToDataUrl(resized);
  const source = await decode(resized);
  const size = { width: source.width, height: source.height };
  source.release();
  return { dataUrl, ...size };
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read_failed'));
    reader.readAsDataURL(blob);
  });
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export interface AddImageInput {
  importId: string;
  ownerProfileId: string;
  blob: Blob;
  originalIndex: number;
  originalSource: ImportImage['originalSource'];
  caption?: string;
}

function newImageId(): string {
  return `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Stores one image and returns its record.
 *
 * Returns the EXISTING record when the same bytes are already held for this
 * import, which is what makes "upload the same screenshot twice" free rather
 * than merely cheap.
 */
export async function addImage(input: AddImageInput): Promise<ImportImage> {
  const db = await openDb();
  const stored = await downscale(input.blob, STORED_MAX_EDGE, STORED_QUALITY);
  const thumb = await downscale(stored, THUMB_MAX_EDGE, THUMB_QUALITY);
  const contentHash = await hashBlob(stored);

  const existing = await findByHash(input.importId, contentHash);
  if (existing) return existing;

  const source = await decode(stored);
  const dimensions = { width: source.width, height: source.height };
  source.release();

  const id = newImageId();
  const record = buildImageRecord({
    id,
    importId: input.importId,
    ownerProfileId: input.ownerProfileId,
    originalIndex: input.originalIndex,
    originalSource: input.originalSource,
    width: dimensions.width,
    height: dimensions.height,
    bytes: stored.size,
    contentHash,
    caption: input.caption,
  });

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORE_BLOBS, STORE_META], 'readwrite');
    transaction.objectStore(STORE_BLOBS).put(stored, record.storageReference);
    transaction.objectStore(STORE_BLOBS).put(thumb, record.thumbnailReference);
    transaction.objectStore(STORE_META).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('image_write_failed'));
  });

  return record;
}

export async function findByHash(importId: string, contentHash: string): Promise<ImportImage | null> {
  try {
    const record = await tx<ImportImage | undefined>(STORE_META, 'readonly', (s) =>
      s.index('byHash').get(contentHash),
    );
    return record && record.importId === importId ? record : null;
  } catch {
    return null;
  }
}

export async function listImages(importId: string): Promise<ImportImage[]> {
  try {
    const records = await tx<ImportImage[]>(STORE_META, 'readonly', (s) => s.index('byImport').getAll(importId));
    return (records ?? []).sort((a, b) => a.originalIndex - b.originalIndex);
  } catch {
    return [];
  }
}

export async function getImageRecord(id: string): Promise<ImportImage | null> {
  try {
    return (await tx<ImportImage | undefined>(STORE_META, 'readonly', (s) => s.get(id))) ?? null;
  } catch {
    return null;
  }
}

export async function getImageBlob(id: string, variant: 'full' | 'thumb' = 'full'): Promise<Blob | null> {
  try {
    const key = `${id}:${variant}`;
    return (await tx<Blob | undefined>(STORE_BLOBS, 'readonly', (s) => s.get(key))) ?? null;
  } catch {
    return null;
  }
}

export async function updateImage(id: string, patch: Partial<ImportImage>): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_META, 'readwrite');
      const store = transaction.objectStore(STORE_META);
      const request = store.get(id);
      request.onsuccess = () => {
        const current = request.result as ImportImage | undefined;
        if (!current) return;
        store.put({ ...current, ...patch });
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('image_update_failed'));
    });
  } catch {
    // A missing record is not worth failing the flow over.
  }
}

/**
 * Deletes an import's images.
 *
 * Called from `deleteImport`, so §26's "deleting the import deletes the text"
 * extends to the pictures. A traveller who deletes a post should not find its
 * screenshots still sitting in their browser.
 */
export async function deleteImagesForImport(importId: string): Promise<number> {
  try {
    const db = await openDb();
    const records = await listImages(importId);
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_BLOBS, STORE_META], 'readwrite');
      const blobs = transaction.objectStore(STORE_BLOBS);
      const meta = transaction.objectStore(STORE_META);
      for (const record of records) {
        blobs.delete(record.storageReference);
        blobs.delete(record.thumbnailReference);
        meta.delete(record.id);
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('image_delete_failed'));
    });
    return records.length;
  } catch {
    return 0;
  }
}

/**
 * Object URLs for a set of images, with a matching revoke.
 *
 * A hook-shaped helper would be nicer, but the review screen needs these inside
 * a list that re-renders on every keystroke; returning the URLs lets the caller
 * decide when a re-read is actually warranted.
 */
export async function imageUrls(
  images: ImportImage[],
  variant: 'full' | 'thumb' = 'thumb',
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  await Promise.all(
    images.map(async (image) => {
      const blob = await getImageBlob(image.id, variant);
      if (blob) out.set(image.id, URL.createObjectURL(blob));
    }),
  );
  return out;
}

export function revokeUrls(urls: Map<string, string>): void {
  for (const url of urls.values()) URL.revokeObjectURL(url);
}
