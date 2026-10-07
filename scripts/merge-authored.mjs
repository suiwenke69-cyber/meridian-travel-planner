#!/usr/bin/env node
/**
 * Merges agent-authored files into the dataset.
 *
 * Two kinds of input:
 *   /tmp/expand-<destination>.ts  → lib/data/destinations/extra/<destination>.ts
 *   /tmp/bali-fixes-<n>.ts        → one entry each in the coordinate-correction map
 *
 * WHY A SCRIPT RATHER THAN HAND COPYING
 * -------------------------------------
 * Ten destination modules and six correction slices arrive from independent
 * authors. Doing this by hand is how one of them gets pasted twice and another is
 * silently dropped — and the failure would be invisible, because a missing
 * destination module looks exactly like a destination with no extra records.
 *
 * So this reports what it moved, refuses to run twice, and prints the per-module
 * record counts so the numbers can be checked against what each author claimed.
 *
 * Usage: node scripts/merge-authored.mjs [--dry]
 */

import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DRY = process.argv.includes('--dry');

const DESTINATIONS = [
  'bali',
  'phu-quoc',
  'da-nang-hoi-an',
  'ho-chi-minh-city',
  'hanoi',
  'siem-reap',
  'phnom-penh',
  'cebu',
  'boracay',
  'palawan',
];

let moved = 0;
let missing = 0;

console.log('\nDestination modules');
for (const destination of DESTINATIONS) {
  const source = `/tmp/expand-${destination}.ts`;
  const target = join(ROOT, 'lib', 'data', 'destinations', 'extra', `${destination}.ts`);

  if (!existsSync(source)) {
    console.log(`  --  ${destination}: no author file yet`);
    missing += 1;
    continue;
  }

  const text = readFileSync(source, 'utf8');
  // A module that exports nothing is a legitimate outcome (Bali only adds hotels)
  // but it must still export all three arrays or the aggregator's types break.
  for (const name of ['areas', 'hotels', 'places']) {
    if (!new RegExp(`export const ${name}\\s*:`).test(text)) {
      console.error(`  !!  ${destination}: missing \`export const ${name}\``);
      process.exitCode = 1;
      continue;
    }
  }

  const counts = {
    areas: (text.match(/^\s*\{\s*$/gm) ?? []).length,
    hotels: (text.match(/hotelGroup:/g) ?? []).length,
    places: (text.match(/markerLayer:/g) ?? []).length,
  };

  if (!DRY) copyFileSync(source, target);
  moved += 1;
  console.log(
    `  ok  ${destination}: ${counts.hotels} hotel(s), ${counts.places} place(s)${DRY ? ' (dry run)' : ''}`,
  );
}

// ---------------------------------------------------------------------------
// Coordinate corrections
// ---------------------------------------------------------------------------
console.log('\nCoordinate corrections');
{
  const slices = [1, 2, 3, 4, 5, 6]
    .map((n) => `/tmp/bali-fixes-${n}.ts`)
    .filter((path) => existsSync(path));

  if (slices.length === 0) {
    console.log('  --  no correction slices yet');
  } else {
    const entries = [];
    for (const path of slices) {
      const text = readFileSync(path, 'utf8');
      const body = text.slice(text.indexOf('{') + 1, text.lastIndexOf('}'));
      const blocks = body
        .split(/\n\s*(?=')/)
        .map((line) => line.trim().replace(/,$/, ''))
        .filter((line) => line.startsWith("'") || line.startsWith('"'));
      entries.push(...blocks);
    }
    console.log(`  ${entries.length} correction(s) across ${slices.length} slice(s)`);

    if (!DRY) {
      const target = join(ROOT, 'lib', 'data', 'destinations', 'extra', 'coord-corrections.ts');
      const current = readFileSync(target, 'utf8');
      const header = current.slice(0, current.indexOf('export const PLACE_COORDINATE_FIXES'));
      const tail = current.slice(current.indexOf('/** Applied to hotel records at decoration time. */'));

      const map = entries
        .map((entry) => {
          const id = /^['"]([^'"]+)['"]\s*:/.exec(entry)?.[1];
          if (!id) return null;
          const lat = /lat:\s*(-?[\d.]+)/.exec(entry)?.[1];
          const lng = /lng:\s*(-?[\d.]+)/.exec(entry)?.[1];
          const confidence = /confidence:\s*'([a-z]+)'/.exec(entry)?.[1];
          const note = /note:\s*'((?:[^'\\]|\\.)*)'/.exec(entry)?.[1] ?? '';
          const safe = note.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          if (lat && lng && confidence) {
            return `  '${id}': { coordinates: { lat: ${lat}, lng: ${lng}, confidence: '${confidence}' as const, coordNote: '${safe}' }, reason: '${safe}' },`;
          }
          return `  '${id}': { reason: '${safe}' },`;
        })
        .filter(Boolean)
        .join('\n');

      writeFileSync(
        target,
        `${header}export const PLACE_COORDINATE_FIXES: Record<string, CoordinateFix> = {\n${map}\n  /* Human-reviewed decisions. Spread last so a person always wins. */\n  ...MANUAL_PLACE_COORDINATE_FIXES,\n};\n\n${tail}`,
      );
      console.log('  wrote lib/data/destinations/extra/coord-corrections.ts');
    }
  }
}

console.log(`\n${moved} module(s) moved, ${missing} still missing.`);
if (missing > 0) console.log('Run again once the remaining authors finish.');
