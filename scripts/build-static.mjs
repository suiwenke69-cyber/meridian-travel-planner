/**
 * Builds the site as a fully static export, for GitHub Pages.
 *
 * WHY THIS IS A SCRIPT AND NOT A CONFIG FLAG
 * ------------------------------------------
 * `output: 'export'` cannot emit a Route Handler, and this app has one:
 * `app/api/route/route.ts`, the server-side proxy that keeps keyed routing
 * credentials (OpenRouteService, Mapbox, Google) out of the browser. That route
 * is genuinely server-only and genuinely useful — it just cannot exist in a
 * static build.
 *
 * So the export moves it aside for the duration of the build and puts it back
 * afterwards, in a `finally`, so an interrupted build cannot lose it. The
 * deployed site is unaffected: with no key configured the proxy answers 501 and
 * the client falls back to keyless OSRM, which is what the static build uses.
 *
 * The output lands in `out/` and is published by `scripts/publish-pages.mjs`.
 */

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const API_DIR = join(ROOT, 'app', 'api');
const API_STASH = join(ROOT, '.api-stash');
const OUT_DIR = join(ROOT, 'out');

function step(message) {
  console.log(`\n▶ ${message}`);
}

if (existsSync(API_STASH)) {
  console.error('A previous export left .api-stash behind. Restore app/api manually and retry.');
  process.exit(1);
}

let stashed = false;
try {
  step('Moving app/api aside — a static export cannot contain a Route Handler');
  if (existsSync(API_DIR)) {
    renameSync(API_DIR, API_STASH);
    stashed = true;
    console.log(`   app/api → .api-stash`);
  }

  step('Building the static export');
  rmSync(OUT_DIR, { recursive: true, force: true });
  execFileSync('npx', ['--no-install', 'next', 'build'], {
    stdio: 'inherit',
    env: { ...process.env, STATIC_EXPORT: '1' },
  });

  if (!existsSync(OUT_DIR)) {
    throw new Error('next build finished but produced no out/ directory');
  }

  step('The worker MapLibre loads at runtime must ship as a static file');
  const worker = join(OUT_DIR, 'maplibre', 'maplibre-gl-worker.mjs');
  if (!existsSync(worker)) {
    throw new Error(
      'out/maplibre/maplibre-gl-worker.mjs is missing — the map would render a blank canvas. ' +
        'scripts/vendor-maplibre-worker.mjs should have run as `prebuild`.',
    );
  }
  console.log('   out/maplibre/maplibre-gl-worker.mjs present');

  step('Checking the first-run HTML actually contains content, not just a JS shell');
  const indexHtml = join(OUT_DIR, 'index.html');
  if (!existsSync(indexHtml)) throw new Error('out/index.html is missing');
  const { readFileSync } = await import('node:fs');
  const html = readFileSync(indexHtml, 'utf8');
  if (html.length < 5_000) throw new Error(`out/index.html is only ${html.length} bytes`);

  const destinations = ['bali', 'phu-quoc', 'da-nang-hoi-an', 'ho-chi-minh-city', 'hanoi', 'siem-reap', 'phnom-penh', 'cebu', 'boracay', 'palawan'];
  const missing = destinations.filter((id) => !existsSync(join(OUT_DIR, 'destination', id, 'index.html')));
  if (missing.length > 0) throw new Error(`these destination pages were not exported: ${missing.join(', ')}`);
  console.log(`   all ${destinations.length} destination pages exported`);

  // A static host has no image optimiser, so the "no photography available"
  // states must already be baked into the HTML rather than resolved at runtime.
  cpSync(join(ROOT, 'public', 'images'), join(OUT_DIR, 'images'), { recursive: true });
  console.log('   images copied into the export');

  console.log('\n✅ static export ready in out/');
} finally {
  if (stashed) {
    renameSync(API_STASH, API_DIR);
    console.log('\n↩ app/api restored');
  }
}
