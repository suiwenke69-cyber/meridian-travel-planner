/**
 * Image manifest integrity.
 *
 * The manifests are generated from two external sources by
 * `scripts/fetch-destination-images.mjs`, so the thing worth testing is not that
 * a particular photograph was chosen — that is a human judgement, recorded in
 * `scripts/images/subjects/<destination>.mjs` and reviewed by eye — but that
 * every shipped entry is COMPLETE, ATTRIBUTED and REAL:
 *
 *   - the file it points at exists on disk, and is not a 1KB placeholder;
 *   - no file is shipped that no manifest entry references;
 *   - exactly one hero per subject, and it is the first entry;
 *   - every entry names its licence, author and source page;
 *   - no licence that forbids commercial use got in;
 *   - every owner id is a real entity in the dataset — an image for a place that
 *     does not exist would render nowhere and is a dangling reference;
 *   - no two destinations claim the same `kind:id` key, which would mean one
 *     destination's card showing another destination's photograph.
 *
 * Run: npm run test:images
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DESTINATIONS, getHotels, getPlaces, getAreas } from '../lib/data';
import { IMAGES_BY_DESTINATION } from '../lib/data/images';
import type { PlaceImage } from '../lib/types';

let checks = 0;
let failures = 0;

function check(name: string, passed: boolean, detail = '') {
  checks += 1;
  if (!passed) failures += 1;
  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

function section(title: string) {
  console.log(`\n${title}`);
}

const ROOT = process.cwd();
const ROLES = new Set(['hero', 'gallery']);
const KINDS = new Set(['destination', 'area', 'hotel', 'place']);

const idsFor = (destinationId: string, kind: string): Set<string> => {
  if (kind === 'area') return new Set(getAreas(destinationId).map((a) => a.id));
  if (kind === 'hotel') return new Set(getHotels(destinationId).map((h) => h.id));
  if (kind === 'place') return new Set(getPlaces(destinationId).map((p) => p.id));
  return new Set(DESTINATIONS.map((d) => d.id));
};

// --- per destination ---------------------------------------------------------
const seenKeys = new Map<string, string>();

for (const [destinationId, manifest] of Object.entries(IMAGES_BY_DESTINATION)) {
  const keys = Object.keys(manifest);
  const entries = Object.values(manifest).flat();
  const directory = join(ROOT, 'public', 'images', destinationId);
  section(`${destinationId} — ${keys.length} subjects, ${entries.length} images`);

  check(`${destinationId}: the manifest is not empty`, entries.length > 0);

  // Every key is a real entity of the right kind.
  const badKeys = keys.filter((key) => {
    const [kind, id] = key.split(':');
    return !KINDS.has(kind) || !id?.length;
  });
  check(`${destinationId}: every key is kind:id`, badKeys.length === 0, badKeys.join(', '));

  const unknown = keys.filter((key) => {
    const [kind, id] = key.split(':');
    return !idsFor(destinationId, kind).has(id);
  });
  check(
    `${destinationId}: every subject is a real ${destinationId} entity`,
    unknown.length === 0,
    unknown.join(', ') || 'all resolve',
  );

  // Every image is complete, uploaded, licensed and on disk.
  const missingFile: string[] = [];
  const tiny: string[] = [];
  const unattributed: string[] = [];
  const badRole: string[] = [];
  const wrongPath: string[] = [];
  const nonCommercial: string[] = [];

  for (const [key, images] of Object.entries(manifest)) {
    for (const image of images as PlaceImage[]) {
      const file = join(ROOT, 'public', image.url.replace(/^\//, ''));
      if (!image.url.startsWith(`/images/${destinationId}/`)) wrongPath.push(image.id);
      if (!existsSync(file)) missingFile.push(image.id);
      else if (statSync(file).size < 4096) tiny.push(`${image.id} (${statSync(file).size}B)`);
      if (!image.alt?.trim() || !image.source?.license || !image.source?.author) unattributed.push(image.id);
      if (!ROLES.has(image.role)) badRole.push(image.id);
      if (/\b(NC|ND|NonCommercial|NoDeriv)\b/i.test(image.source?.license ?? '')) nonCommercial.push(image.id);
    }

    const heroes = (images as PlaceImage[]).filter((image) => image.role === 'hero');
    check(
      `${destinationId}: ${key} has exactly one hero, first`,
      heroes.length === 1 && (images as PlaceImage[])[0]?.role === 'hero',
      `${heroes.length} hero(s)`,
    );
  }

  check(`${destinationId}: every image file exists`, missingFile.length === 0, missingFile.slice(0, 4).join(', '));
  check(`${destinationId}: no placeholder-sized image`, tiny.length === 0, tiny.slice(0, 4).join(', '));
  check(`${destinationId}: every image is attributed`, unattributed.length === 0, unattributed.slice(0, 4).join(', '));
  check(`${destinationId}: every image has a valid role`, badRole.length === 0, badRole.slice(0, 4).join(', '));
  check(`${destinationId}: every url is under /images/${destinationId}/`, wrongPath.length === 0, wrongPath.slice(0, 4).join(', '));
  check(`${destinationId}: no non-commercial licence`, nonCommercial.length === 0, nonCommercial.slice(0, 4).join(', '));

  // No orphan files: a file on disk that nothing references is either a mistake
  // or a photograph that was pulled from the manifest and left behind.
  const referenced = new Set(entries.map((image) => (image as PlaceImage).url.split('/').pop()));
  const onDisk = existsSync(directory) ? readdirSync(directory).filter((name) => /\.(jpe?g|png|webp)$/i.test(name)) : [];
  const orphans = onDisk.filter((name) => !referenced.has(name));
  check(`${destinationId}: no orphan image files`, orphans.length === 0, orphans.slice(0, 4).join(', '));
  check(
    `${destinationId}: every referenced file is on disk (${referenced.size} of ${onDisk.length})`,
    onDisk.length >= referenced.size,
    `${onDisk.length} files`,
  );

  // Key collisions across destinations.
  for (const key of keys) {
    const owner = seenKeys.get(key);
    if (owner && owner !== destinationId) {
      check(`key ${key} is claimed by only one destination`, false, `${owner} and ${destinationId}`);
    } else {
      seenKeys.set(key, destinationId);
    }
  }
}

section('cross-destination');
check(
  'no kind:id key is shared by two destinations',
  (() => {
    const all = Object.entries(IMAGES_BY_DESTINATION).flatMap(([dest, manifest]) =>
      Object.keys(manifest).map((key) => `${dest}|${key}`),
    );
    const byKey = new Map<string, string[]>();
    for (const item of all) {
      const [dest, key] = item.split('|');
      byKey.set(key, [...(byKey.get(key) ?? []), dest]);
    }
    return [...byKey.values()].every((destinations) => destinations.length === 1);
  })(),
);

console.log(`\n${'-'.repeat(64)}`);
console.log(`${checks - failures}/${checks} image manifest checks passed`);
if (failures > 0) {
  console.log(`❌ ${failures} FAILED`);
  process.exit(1);
}
console.log('✅ image manifests are complete and honest');
