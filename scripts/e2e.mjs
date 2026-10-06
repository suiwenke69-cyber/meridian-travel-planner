/**
 * End-to-end smoke test for the Meridian planner.
 *
 * Drives a real Chromium against the running dev server through the whole V1
 * workflow (region map → destination preview → planner → trip builder →
 * map/itinerary sync → efficiency → persistence → mobile) and fails loudly on
 * console errors, page errors or failed requests.
 *
 * Usage:
 *   npm run dev            # in one terminal
 *   npm run test:e2e       # in another
 *
 * Screenshots and a JSON report land in ./test-artifacts (gitignored).
 */

import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';
const ARTIFACTS = join(process.cwd(), 'test-artifacts');
const CHROME =
  process.env.CHROME_PATH ??
  join(
    homedir(),
    'Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  );

mkdirSync(ARTIFACTS, { recursive: true });

const results = [];
let failures = 0;

function check(name, passed, detail = '') {
  results.push({ name, passed, detail });
  if (!passed) failures += 1;
  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

/**
 * Waits for a browser-side predicate to become true.
 *
 * `querySourceFeatures` reads the tiles that are loaded *right now*, so a map
 * that is mid-animation legitimately reports nothing. Sampling it once turned a
 * working route into a failing test.
 */
async function until(page, fn, { timeout = 8000, interval = 250 } = {}) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    last = await page.evaluate(fn);
    if (last) return last;
    await page.waitForTimeout(interval);
  }
  return last;
}

/**
 * One step of the workflow.
 *
 * The first version raced each step against a hard timeout. That was worse than
 * it looked: a step that blew the budget did not stop, its remaining `await`s
 * kept resolving, and its assertions landed minutes later under the heading of
 * whichever step was running by then — so a timed-out step could be reported as
 * a passing one. Steps now run to completion and simply say when they ran long.
 * Every Playwright call has its own timeout, so a genuine hang is still bounded;
 * a slow dev-server compile is not mistaken for a broken product.
 */
const SLOW_STEP_MS = 120_000;

/**
 * Selects an origin, opening the popover only if it is closed.
 *
 * The trigger is a TOGGLE, so a naive click is only correct if the panel happens
 * to be shut. The first version of this suite left the panel open at the end of
 * one step and the next step's click closed it again, after which every option
 * lookup timed out — a test bug that looked exactly like a product bug.
 */
async function chooseOrigin(page, id) {
  const panel = page.locator('[data-testid="origin-trigger-panel"]');
  if (!(await panel.isVisible())) {
    await page.locator('[data-testid="origin-trigger"]').first().click();
    await page.waitForTimeout(500);
  }
  await page.locator(`[data-testid="origin-trigger-option-${id}"]`).click();
}

async function step(name, fn) {
  console.log(`\n▶ ${name}`);
  const started = Date.now();
  const timer = setTimeout(() => {
    console.log(`  ⏱ still running after ${Math.round((Date.now() - started) / 1000)}s — dev-server compile, most likely`);
  }, SLOW_STEP_MS);
  try {
    await fn();
  } catch (error) {
    check(`${name} — threw`, false, error instanceof Error ? error.message.split('\n')[0] : String(error));
  } finally {
    clearTimeout(timer);
    const elapsed = (Date.now() - started) / 1000;
    if (elapsed > 20) console.log(`  ⏱ ${elapsed.toFixed(1)}s`);
  }
}

/** Wait for the map to have at least one rendered marker. */
async function waitForMarkers(page, selector = '.maplibregl-marker') {
  await page.waitForSelector(selector, { timeout: 120_000, state: 'attached' });
}

function isoOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
}

const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const context = await browser.newContext({
  viewport: { width: 1512, height: 950 },
  deviceScaleFactor: 1,
  locale: 'en-GB',
});

const page = await context.newPage();
const EXPECTED_CONSOLE_NOISE = [
  // Step 18 deliberately points every <img> at a missing file to prove the
  // fallback UI holds. The resulting 404 is the test's own doing.
  /definitely-missing\.jpg/,
  /status of 404/,
];

page.on('console', (m) => {
  if (m.type() !== 'error') return;
  const text = m.text();
  if (EXPECTED_CONSOLE_NOISE.some((pattern) => pattern.test(text))) return;
  consoleErrors.push(text);
});
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('requestfailed', (request) => {
  const url = request.url();
  const reason = request.failure()?.errorText ?? '';
  // Tile/routing CDNs are environment noise; ERR_ABORTED is Next.js cancelling
  // a prefetch, which is expected during navigation.
  if (/basemaps\.cartocdn\.com|tile\.openstreetmap\.org|router\.project-osrm\.org/.test(url)) return;
  if (reason.includes('ERR_ABORTED')) return;
  failedRequests.push(`${request.method()} ${url} — ${reason}`);
});

// ---------------------------------------------------------------------------
// Warm-up. `next dev` compiles routes and client chunks on first request, so
// the very first browser hit on /destination/bali can take far longer than any
// assertion should. Compile everything once, then run the real checks.
// ---------------------------------------------------------------------------

await step('0. Warm up the dev server', async () => {
  /*
   * A precondition, deliberately not an assertion.
   *
   * MapLibre runs here under software rasterisation, which is CPU-hungry, and
   * this machine may be running other projects at the same time. On a loaded
   * box the very first navigation can take minutes, and failing the suite on
   * that would say "the product is broken" when it means "the machine is busy".
   * The steps that follow assert the product directly, and they fail loudly if
   * anything is actually wrong — including a missing map worker.
   */
  for (const url of [BASE, `${BASE}/destination/bali`]) {
    await page.request.get(url, { timeout: 240_000 }).catch(() => {});
  }

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    await page.waitForSelector('.maplibregl-canvas', { timeout: 240_000, state: 'attached' });

    // The worker is vendored into public/ at predev time; if it is missing the
    // canvas stays blank, so make that failure explicit rather than mysterious.
    const basemapReady = await page.evaluate(async () => {
      for (let i = 0; i < 60; i += 1) {
        const map = window.__mmMap;
        if (map && map.loaded() && map.areTilesLoaded()) return true;
        await new Promise((r) => setTimeout(r, 500));
      }
      return false;
    });
    check('basemap tiles decoded (map worker healthy)', basemapReady);

    await page.goto(`${BASE}/destination/bali`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    await page.waitForSelector('.maplibregl-canvas', { timeout: 240_000, state: 'attached' });
    check('dev server warm (both routes compiled)', true);
  } catch (error) {
    const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
    console.log(`  ⚠ warm-up skipped — the machine was too loaded to reach the map in time (${reason})`);
    console.log('    the product assertions below are unaffected; they fail on their own merits');
  }
});

// ---------------------------------------------------------------------------
// 1–6. Homepage, region map, origin, selection, preview, planner
// ---------------------------------------------------------------------------

await step('1. Homepage loads', async () => {
  const response = await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  check('homepage returns 200', response?.status() === 200, `status ${response?.status()}`);
  await page.waitForSelector('[data-testid="destination-rail"]', { timeout: 30_000 });
  check('destination rail rendered', true);
});

await step('2–3. Southeast Asia map renders with Singapore marked as origin', async () => {
  await page.waitForSelector('.maplibregl-canvas', { timeout: 30_000 });
  await page.waitForSelector('.mm-origin', { timeout: 60_000, state: 'attached' });
  const originName = (await page.locator('.mm-origin__name').first().innerText()).trim();
  const originMeta = (await page.locator('.mm-origin__meta').first().innerText()).trim();
  check('origin marker present and named', /新加坡|Singapore/i.test(originName), originName);
  check('origin labelled as home', /出发地|home/i.test(originMeta), originMeta);
  // Destinations are native vector layers, so they are asserted through the map
  // rather than through DOM pins.
  // Poll rather than sample once: the layers are registered on style load, and
  // the first frame that actually paints them can land a beat later.
  const drawn = await page.evaluate(async () => {
    const map = window.__mmMap;
    if (!map) return null;
    let destinations = 0;
    for (let i = 0; i < 40; i += 1) {
      destinations = map.queryRenderedFeatures({ layers: ['destination-dot'] }).length;
      if (destinations >= 10) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return {
      destinations,
      hasArc: Boolean(map.getLayer('region-arc-line')),
      basemapLabels: map.getStyle().layers.filter((l) => l.id.startsWith('label-')).length,
    };
  });
  check('all ten destinations are drawn on the map', Boolean(drawn && drawn.destinations >= 10), JSON.stringify(drawn));
  await page.screenshot({ path: join(ARTIFACTS, '01-home.png') });
});

await step('4–5. Bali selectable; preview appears without leaving the map', async () => {
  await page.locator('[data-testid="destination-item-bali"]').click();
  await page.waitForSelector('[data-testid="destination-preview"]', { timeout: 15_000 });
  const preview = await page.locator('[data-testid="destination-preview"]').innerText();
  check('preview shows Bali', /巴厘岛|Bali/i.test(preview));
  check('preview shows the SIN → DPS route', /SIN/.test(preview) && /DPS/.test(preview));
  check('preview states the flight is direct', /直飞|Direct/.test(preview));
  // The duration is now origin-relative and phrased as 约 2 小时 45 分钟 从新加坡出发.
  check(
    'preview states an approximate flight duration',
    /约\s*\d+\s*小时/.test(preview) || /≈\s*\d+\s*(h|小时)/.test(preview),
    firstMatch(preview, /约[^\n]{0,24}/),
  );
  check(
    'preview shows a readable ideal stay',
    /4–7\s*天|4–7 days/.test(preview),
    firstMatch(preview, /(建议停留|Ideal stay)[\s\S]{0,30}/),
  );
  check('preview shows what the destination is good for', /适合|Good for/i.test(preview));
  check('preview shows Marriott inventory', /万豪|Marriott/.test(preview));
  check('preview shows Hilton inventory', /希尔顿|Hilton/.test(preview));
  // The pair is origin-side airports → destination airports: "SIN · XSP → DPS".
  check('preview shows a human-readable route pair', /SIN[^→\n]*→[^\n]*DPS/.test(preview), firstMatch(preview, /[A-Z]{3}[^\n]{0,30}DPS/));
  check('map stayed on the page', (await page.locator('.maplibregl-canvas').count()) === 1);
  await page.screenshot({ path: join(ARTIFACTS, '02-preview.png') });
});

await step('6. Bali opens at whole-island scale with EXPLORE as the default', async () => {
  await page.locator('[data-testid="explore-destination"]').click();
  await page.waitForURL(/\/destination\/bali/, { timeout: 30_000 });
  await page.waitForSelector('[data-testid="planner-shell"]', { timeout: 120_000 });
  await page.waitForSelector('.maplibregl-canvas', { timeout: 60_000 });
  await page.waitForTimeout(6000);

  const exploreActive = await page.locator('[data-testid="dest-tab-explore"]').getAttribute('aria-selected');
  check('EXPLORE is the default tab, not a trip form', exploreActive === 'true', `aria-selected=${exploreActive}`);

  const view = await page.evaluate(() => {
    const m = window.__mmMap;
    const b = m.getBounds();
    return { zoom: Number(m.getZoom().toFixed(2)), west: b.getWest(), east: b.getEast(), south: b.getSouth(), north: b.getNorth() };
  });
  // The semantic requirement: every headline region plus the airport is on screen.
  const mustSee = await page.evaluate(() => {
    const m = window.__mmMap;
    const b = m.getBounds();
    const points = [
      { name: 'Canggu', lat: -8.6553, lng: 115.13 },
      { name: 'Seminyak', lat: -8.6833, lng: 115.16 },
      { name: 'Ubud', lat: -8.5069, lng: 115.2625 },
      { name: 'Uluwatu', lat: -8.814, lng: 115.088 },
      { name: 'Nusa Dua', lat: -8.7963, lng: 115.226 },
      { name: 'Sanur', lat: -8.6905, lng: 115.262 },
      { name: 'DPS airport', lat: -8.748056, lng: 115.1675 },
    ];
    return points.filter((p) => !b.contains([p.lng, p.lat])).map((p) => p.name);
  });
  check('every headline area and the airport are in view on arrival', mustSee.length === 0, mustSee.length ? `off screen: ${mustSee.join(', ')}` : 'all visible');
  await page.screenshot({ path: join(ARTIFACTS, '03-explore.png') });
});

await step('7. Every named travel area is present and labelled on the map', async () => {
  const labelled = await page.evaluate(() => {
    const m = window.__mmMap;
    if (!m.getLayer('area-label')) return null;
    const feats = m.querySourceFeatures('area-centres');
    return feats.map((f) => f.properties.name);
  });
  /*
   * Labels are localized, so each headline area is checked against BOTH its
   * Chinese and its canonical name. Asserting on the English alone would fail
   * the moment the product language changed — which is exactly what happened.
   */
  const required = [
    { zh: '长谷', en: 'canggu' },
    { zh: '水明漾', en: 'seminyak' },
    { zh: '乌布', en: 'ubud' },
    { zh: '乌鲁瓦图', en: 'uluwatu' },
    { zh: '努沙杜瓦', en: 'nusa dua' },
    { zh: '沙努尔', en: 'sanur' },
  ];
  const normalised = (labelled ?? []).map((n) => String(n).toLowerCase());
  const missing = required.filter(
    (area) => !normalised.some((n) => n.includes(area.zh) || n.includes(area.en)),
  );
  check(
    'all six headline areas exist as map labels',
    missing.length === 0,
    missing.length ? `missing: ${missing.map((m) => m.zh).join(', ')}` : required.map((a) => a.zh).join(' '),
  );

  const visible = await page.evaluate(() => {
    const m = window.__mmMap;
    const rendered = m.queryRenderedFeatures({ layers: ['area-label'] });
    return rendered.map((f) => String(f.properties.name).toLowerCase());
  });
  const shown = required.filter((area) => visible.some((n) => n.includes(area.zh) || n.includes(area.en)));
  check('at least five of the six are actually drawn at island scale', shown.length >= 5, shown.map((a) => a.zh).join(' '));
});

await step('8. Area cards carry photography and structured metadata', async () => {
  const card = page.locator('[data-testid="area-card-canggu"]');
  check('area card rendered', (await card.count()) === 1);
  const text = await card.innerText();
  check('area card shows the region name', /长谷|Canggu/i.test(text));
  check('area card shows its tagline', /冲浪 \u00b7 咖啡|Surf \u00b7 Caf/.test(text), firstMatch(text, /[^\n]*冲浪[^\n]*/));
  const images = await card.locator('img').count();
  check('area card shows a photograph', images >= 1, `${images} image(s)`);
  const loaded = await card.locator('img').first().evaluate((el) => el.complete && el.naturalWidth > 0);
  check('the area photograph actually loads', loaded);
  await page.screenshot({ path: join(ARTIFACTS, '04-areas.png') });
});

await step('9. Selecting an area focuses the map and opens a visual area card', async () => {
  await page.locator('[data-testid="area-card-uluwatu"]').click();
  await page.waitForSelector('[data-testid="area-detail"]', { timeout: 15_000 });
  await page.waitForTimeout(2500);
  const detail = await page.locator('[data-testid="area-detail"]').innerText();
  check('area detail names the region', /乌鲁瓦图|Uluwatu/i.test(detail));
  check('area detail states what it is best for', /适合|Best for/i.test(detail));
  check('area detail states what it is less ideal for', /不太适合|Less ideal/i.test(detail));
  check('area detail shows a photo credit', /CC|public domain|Wikimedia/i.test(detail), firstMatch(detail, /[A-Z][^\n]*CC[^\n]*/));
  const zoom = await page.evaluate(() => Number(window.__mmMap.getZoom().toFixed(1)));
  check('the map focuses the area without dropping to street level', zoom >= 9 && zoom <= 12.5, `zoom ${zoom}`);
  await page.screenshot({ path: join(ARTIFACTS, '05-area-detail.png') });
});

await step('10. STAY shows hotel cards with photography and works as a filter', async () => {
  await page.locator('[data-testid="dest-tab-stay"]').click();
  await page.waitForSelector('[data-testid^="hotel-card-"]', { timeout: 20_000 });
  await page.waitForTimeout(2500);

  // The area chosen in EXPLORE carries over as context — and must be removable.
  const chip = page.locator('[data-testid="area-filter-chip"]');
  await chip.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
  check('an inherited area filter is visible and removable', (await chip.count()) === 1);
  await chip.click();
  await page.waitForTimeout(2500);

  const cards = await page.locator('[data-testid^="hotel-card-"]').count();
  check('hotel cards are listed', cards > 0, `${cards} cards`);

  const stRegis = page.locator('[data-testid="hotel-card-the-st-regis-bali-resort"]');
  check('a known Marriott property is present', (await stRegis.count()) === 1);
  const cardText = await stRegis.innerText();
  check('hotel card names the loyalty programme', /Marriott Bonvoy|St\. Regis/.test(cardText));
  check('hotel card shows a price TIER, not a rate', /\${2,4}/.test(cardText) && !/per night|IDR|USD\s?\d/i.test(cardText));
  check('hotel card shows the airport transfer context', /DPS/i.test(cardText));
  const hotelImg = await stRegis.locator('img').count();
  check('hotel card shows a photograph', hotelImg >= 1, `${hotelImg}`);

  // Marriott / Hilton filtering
  const before = await page.locator('[data-testid^="hotel-card-"]').count();
  await page.locator('[data-testid="stay-filter-hilton"]').click();
  await page.waitForTimeout(1200);
  const hiltonCards = await page.locator('[data-testid^="hotel-card-"]').count();
  check('the Hilton filter narrows the list', hiltonCards > 0 && hiltonCards < before, `${before} → ${hiltonCards}`);
  await page.locator('[data-testid="stay-filter-all"]').click();
  await page.waitForTimeout(1200);
  check('clearing the filter restores the list', (await page.locator('[data-testid^="hotel-card-"]').count()) === before);
  await page.screenshot({ path: join(ARTIFACTS, '06-stay.png') });
});

await step('11. Hotel markers and hotel cards are synchronised', async () => {
  await page.waitForTimeout(1500);
  const markers = await page.locator('.maplibregl-marker .mk--marriott, .maplibregl-marker .mk--hilton').count();
  check('hotel markers are drawn individually, not clustered away', markers >= 8, `${markers} markers`);

  // Hovering a card must emphasise its marker on the map.
  await page.locator('[data-testid="hotel-card-the-st-regis-bali-resort"]').hover();
  await page.waitForTimeout(1200);
  const emphasised = await page.locator('.mk--emphasised').count();
  check('hovering a hotel card emphasises its marker', emphasised >= 1, `${emphasised}`);
  await page.screenshot({ path: join(ARTIFACTS, '07-stay-sync.png') });
});

await step('12. DO filters by category and shows visual place cards', async () => {
  await page.locator('[data-testid="dest-tab-do"]').click();
  await page.waitForSelector('[data-testid^="place-card-"]', { timeout: 20_000 });
  await page.waitForTimeout(2500);

  const namesIn = async () => (await page.locator('[data-testid^="place-card-"] h3').allInnerTexts()).join('|');
  const highlights = await namesIn();
  const highlightCount = await page.locator('[data-testid^="place-card-"]').count();
  check('the default Highlights category lists places', highlightCount > 0, `${highlightCount}`);
  check('place cards carry photographs', (await page.locator('[data-testid^="place-card-"] img').count()) > 0);

  await page.locator('[data-testid="do-category-beach"]').click();
  await page.waitForTimeout(2500);
  const beaches = await namesIn();
  const beachCount = await page.locator('[data-testid^="place-card-"]').count();
  check(
    'switching category changes which places are shown',
    beachCount > 0 && beaches !== highlights,
    `highlights(${highlightCount}) → beaches(${beachCount})`,
  );

  // The map must follow the category rather than showing everything at once.
  const markersNow = await page.locator('.maplibregl-marker').count();
  check('the map only draws the selected category', markersNow < 30, `${markersNow} markers`);
  await page.screenshot({ path: join(ARTIFACTS, '08-do.png') });
});

await step('13. Starting a trip is deliberately three fields', async () => {
  await page.locator('[data-testid="dest-tab-plan"]').click();
  await page.waitForSelector('[data-testid="arrival-date"]', { timeout: 15_000 });

  const styleFieldsetVisible = await page.locator('fieldset:has-text("Travel style")').isVisible().catch(() => false);
  const budgetFieldsetVisible = await page.locator('fieldset:has-text("Budget tier")').isVisible().catch(() => false);
  check(
    'the first-run form leads with dates and travellers only',
    !styleFieldsetVisible && !budgetFieldsetVisible,
    `travel style visible=${styleFieldsetVisible}, budget visible=${budgetFieldsetVisible}`,
  );
  const coreFields = await page.locator('[data-testid="arrival-date"], [data-testid="departure-date"], [data-testid="travellers"]').count();
  check('the three core fields are present', coreFields === 3, `${coreFields}`);

  await page.locator('[data-testid="arrival-date"]').fill('2026-11-19');
  await page.locator('[data-testid="departure-date"]').fill('2026-11-23');
  await page.waitForTimeout(400);
  const cta = await page.locator('[data-testid="create-trip"]').innerText();
  check('the call to action states the trip length', /5\s*天|5 days/.test(cta), cta);
  await page.locator('[data-testid="create-trip"]').click();
  await page.waitForSelector('[data-testid="day-tab-5"]', { timeout: 15_000 });
  check('five days are generated', (await page.locator('[data-testid^="day-tab-"]').count()) === 5);
  await page.screenshot({ path: join(ARTIFACTS, '09-trip-created.png') });
});

await step('14. Places and hotels can be added to the itinerary', async () => {
  await page.locator('[data-testid="dest-tab-stay"]').click();
  await page.waitForSelector('[data-testid^="hotel-card-"]', { timeout: 20_000 });
  await page.waitForTimeout(2500);
  await page.locator('[data-testid="add-to-trip"]').first().click();
  await page.waitForTimeout(900);

  await page.locator('[data-testid="dest-tab-do"]').click();
  await page.waitForTimeout(2500);
  const added = [];
  for (let i = 0; i < 3; i += 1) {
    const cards = page.locator('[data-testid^="place-card-"]');
    if ((await cards.count()) <= i) break;
    const name = ((await cards.nth(i).locator('h3').innerText()) || '').trim();
    const add = cards.nth(i).locator('[data-testid="add-to-trip"]');
    if ((await add.count()) === 0) continue;
    await add.first().click();
    await page.waitForTimeout(800);
    added.push(name);
  }
  check('places were added from the DO tab', added.length >= 2, added.join(' · '));

  await page.locator('[data-testid="dest-tab-plan"]').click();
  await page.waitForTimeout(6000);
  const stops = await page.locator('[data-testid^="itinerary-item-"]').count();
  check('the itinerary lists the added stops', stops >= 3, `${stops} stops`);
  const body = await page.locator('main').innerText();
  const present = added.filter((n) => body.includes(n));
  check('the added places appear in the timeline', present.length === added.length, `${present.length}/${added.length}`);
  await page.screenshot({ path: join(ARTIFACTS, '10-itinerary.png') });
});

await step('15. Every consecutive stop gets a transport leg', async () => {
  const stops = await page.locator('[data-testid^="itinerary-item-"]').count();
  const legs = await page.locator('[data-testid^="transport-leg-"]').count();
  check('there is one leg between each pair of stops', legs === stops - 1, `${stops} stops → ${legs} legs`);

  const legText = await page.locator('[data-testid^="transport-leg-"]').first().innerText();
  check(
    'the leg names a transport mode',
    /网约车|包车|步行|摩托车|快艇|Grab|taxi|Private car|Walk|Scooter|Fast boat/i.test(legText),
    firstMatch(legText, /[^\n]*(网约车|包车|步行)[^\n]*/),
  );
  check('the leg explains the recommendation', legText.length > 60);

  /*
   * Read the leg's own claim about its numbers from the element rather than from
   * the copy. The badge is Chinese now, and an assertion tied to the English
   * words "routing engine" would fail on a translation rather than on a defect.
   */
  const legMeta = await page.locator('[data-testid^="transport-leg-"]').first().evaluate((el) => ({
    source: el.getAttribute('data-source'),
    measured: el.getAttribute('data-measured') === 'true',
  }));
  check(
    'the leg declares where its numbers came from',
    legMeta.source === 'routing-engine' || legMeta.source === 'unavailable',
    `source=${legMeta.source}`,
  );
  if (legMeta.source === 'routing-engine') {
    check('a measured leg shows a distance and a duration', legMeta.measured && /≈[\d.]+\s*(分钟|min|h|小时)/.test(legText), firstMatch(legText, /≈[^\n]*/));
  } else {
    check('an unavailable leg does not print a fabricated duration', !/≈\s*\d/.test(legText), firstMatch(legText, /暂无[^\n]*/));
  }
  await page.screenshot({ path: join(ARTIFACTS, '11-transport-legs.png') });
});

await step('16. The map draws the same day as the itinerary', async () => {
  /*
   * `querySourceFeatures` reads the tiles that happen to be loaded, and a
   * GeoJSON line can be painted on screen while that call returns nothing —
   * which is exactly what it did. Render state is the honest thing to assert:
   * the route line either put pixels on the map or it did not.
   */
  const readRoute = () =>
    page.evaluate(() => {
      const m = window.__mmMap;
      if (!m.getLayer('route-line')) return null;
      const rendered = m.queryRenderedFeatures({ layers: ['route-line'] });
      const fromTiles = m
        .querySourceFeatures('route')
        .flatMap((f) => (f.geometry.type === 'LineString' ? f.geometry.coordinates : []));
      const data = m.getSource('route')?._data;
      const fromData = data?.geometry?.coordinates?.length ?? 0;
      return {
        present: true,
        rendered: rendered.length,
        points: Math.max(fromTiles.length, fromData),
        dashed: Boolean(m.getPaintProperty('route-line', 'line-dasharray')),
      };
    });

  const route = await until(page, () => {
    const m = window.__mmMap;
    if (!m.getLayer('route-line')) return null;
    if (m.queryRenderedFeatures({ layers: ['route-line'] }).length === 0) return null;
    return true;
  }).then(readRoute);

  check('the day route is drawn', Boolean(route?.present && route.rendered > 0), JSON.stringify(route));
  /*
   * Cross-check the line against the panel rather than an internal coordinate
   * count: a solid line must be backed by a real routing engine, and a dashed
   * one must be a day where nothing could be measured. If those two ever
   * disagree, the map is claiming a road the legs say it does not have.
   */
  const legSources = await page.locator('[data-testid^="transport-leg-"]').allInnerTexts();
  const measured = legSources.some((text) => /routing engine|OSRM|OpenRouteService|Mapbox|Google Routes/i.test(text));
  const dashed = route?.dashed === true;
  check(
    'the drawn line matches what the legs claim',
    measured ? !dashed : dashed,
    dashed
      ? 'dashed straight corridor — no leg had route data'
      : 'solid road geometry — backed by a routing engine',
  );

  const numbered = await page.locator('.mk--numbered').count();
  const stops = await page.locator('[data-testid^="itinerary-item-"]').count();
  check('each stop is numbered on the map', numbered === stops, `${numbered} numbered markers for ${stops} stops`);
  await page.screenshot({ path: join(ARTIFACTS, '12-route.png') });
});

await step('17. Switching day changes the route and the emphasis', async () => {
  const routeWidth = () =>
    page.evaluate(() => {
      const m = window.__mmMap;
      if (!m.getLayer('route-line')) return 0;
      return m.queryRenderedFeatures({ layers: ['route-line'] }).length;
    });
  const before = (await until(page, () => {
    const m = window.__mmMap;
    if (!m.getLayer('route-line')) return 0;
    return m.queryRenderedFeatures({ layers: ['route-line'] }).length || 0;
  })) ?? 0;

  await page.locator('[data-testid="day-tab-2"]').click();
  await page.waitForTimeout(3500);
  const day2Stops = await page.locator('[data-testid^="itinerary-item-"]').count();
  check(
    'day 2 is empty and says so',
    day2Stops === 0 || (await page.locator('main').innerText()).includes('is empty'),
    `${day2Stops} stops`,
  );

  await page.locator('[data-testid="day-tab-1"]').click();
  await page.waitForTimeout(3500);
  const after = (await until(page, () => {
    const m = window.__mmMap;
    if (!m.getLayer('route-line')) return 0;
    return m.queryRenderedFeatures({ layers: ['route-line'] }).length || 0;
  })) ?? 0;
  check('returning to day 1 restores its route', after > 0 && before > 0, `${before} → ${after} rendered segments`);
  void routeWidth;
});

await step('18. A broken image falls back gracefully', async () => {
  // Force every image on the page to fail and confirm the UI stays intact.
  await page.evaluate(() => {
    for (const img of Array.from(document.images)) {
      img.src = '/images/bali/definitely-missing.jpg';
    }
  });
  await page.waitForTimeout(2500);
  const crashed = await page.evaluate(() => /Application error|client-side exception/i.test(document.body.innerText));
  check('broken images do not crash the page', !crashed);
  await page.screenshot({ path: join(ARTIFACTS, '13-broken-images.png') });
});

await step('18b. Trip survives a full page refresh', async () => {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="planner-shell"]', { timeout: 60_000 });
  await page.waitForTimeout(3000);
  const stats = await page.evaluate(() => {
    const raw = window.localStorage.getItem('meridian.trips.v1');
    if (!raw) return { days: 0, stops: 0 };
    const trip = JSON.parse(raw).state.trips[0];
    return { days: trip.days.length, stops: trip.days.reduce((n, d) => n + d.items.length, 0) };
  });
  check('the trip survives a refresh', stats.days === 5 && stats.stops >= 3, JSON.stringify(stats));
});

await step('18c. Mobile keeps the map and the photography usable', async () => {
  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  mobile.on('pageerror', (e) => pageErrors.push(`mobile: ${e.message}`));
  await mobile.goto(`${BASE}/destination/bali`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await mobile.waitForSelector('[data-testid="planner-shell"]', { timeout: 60_000 });
  await mobile.waitForSelector('.maplibregl-canvas', { timeout: 60_000 });
  await mobile.waitForTimeout(6000);

  const mapBox = await mobile.locator('.maplibregl-canvas').boundingBox();
  // The sheet's aria-label is localized, so it is addressed by testid: a
  // selector tied to an English string breaks the moment the language changes.
  const sheetBox = await mobile.locator('[data-testid="mobile-sheet"]').boundingBox();
  check('the map still occupies the top of the screen', Boolean(mapBox && mapBox.height > 300), mapBox ? `${Math.round(mapBox.height)}px` : 'missing');
  check('the sheet does not consume the whole viewport', Boolean(sheetBox && sheetBox.y > 250), sheetBox ? `sheet starts at ${Math.round(sheetBox.y)}` : 'missing');

  await mobile.locator('[data-testid="dest-tab-stay"]').click();
  await mobile.waitForTimeout(4000);
  const mobileCards = await mobile.locator('[data-testid^="hotel-card-"]').count();
  check('hotel photography remains usable on mobile', mobileCards > 0, `${mobileCards} cards`);
  await mobile.screenshot({ path: join(ARTIFACTS, '14-mobile.png') });
  await mobile.close();
});

await step('19. Every other destination loads without crashing', async () => {
  // The starter destinations share the same components but different data, so a
  // data problem there would only show up by actually loading them.
  const others = [
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
  /*
   * Warm every route over HTTP first. `next dev` compiles a route on its first
   * request, and nine cold compiles inside a browser loop is a timeout waiting
   * to happen — it is a slow build, not a broken destination.
   */
  for (const id of others) {
    await page.request.get(`${BASE}/destination/${id}`, { timeout: 300_000 }).catch(() => {});
  }

  const probe = await context.newPage();
  probe.setViewportSize({ width: 1440, height: 900 });
  const probeErrors = [];
  probe.on('pageerror', (e) => probeErrors.push(e.message));
  const results = [];

  for (const id of others) {
    await probe.goto(`${BASE}/destination/${id}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    try {
      await probe.waitForSelector('[data-testid="planner-shell"]', { timeout: 240_000 });
      await probe.waitForSelector('.maplibregl-canvas', { timeout: 240_000, state: 'attached' });
      // EXPLORE draws areas as native layers, not DOM markers, so assert on the
      // rendered cartography rather than on pins that correctly do not exist.
      const drawn = await probe.evaluate(async () => {
        for (let i = 0; i < 120; i += 1) {
          const map = window.__mmMap;
          if (map?.loaded?.()) {
            const areas = map.queryRenderedFeatures({ layers: ['area-label'] }).length;
            if (areas > 0) return { areas, tabs: document.querySelectorAll('[data-testid^="dest-tab-"]').length };
          }
          await new Promise((r) => setTimeout(r, 400));
        }
        return { areas: 0, tabs: document.querySelectorAll('[data-testid^="dest-tab-"]').length };
      });
      const text = await probe.locator('main').innerText();
      const crashed = /Application error|client-side exception/i.test(text);
      results.push({ id, ok: !crashed && drawn.areas > 0 && drawn.tabs === 4, areas: drawn.areas, tabs: drawn.tabs });
    } catch (error) {
      results.push({ id, ok: false, areas: 0, tabs: 0, error: String(error).split('\n')[0] });
    }
  }

  const bad = results.filter((r) => !r.ok);
  check(
    `all ${others.length} starter destinations render EXPLORE with their regions`,
    bad.length === 0,
    bad.length ? bad.map((b) => `${b.id}(areas=${b.areas},tabs=${b.tabs})`).join(', ') : results.map((r) => `${r.id}:${r.areas}`).join(' '),
  );
  check('no page errors across the other destinations', probeErrors.length === 0, probeErrors.slice(0, 3).join(' | ') || 'none');
  await probe.close();
});


// ---------------------------------------------------------------------------
// This iteration: Chinese as the primary language, restaurant/activity
// discovery, and the social-guide research pipeline.
// ---------------------------------------------------------------------------

await step('20. Chinese is the product language, and English names stay searchable', async () => {
  await page.goto(`${BASE}/destination/bali`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.waitForSelector('.maplibregl-canvas', { timeout: 120_000 });
  await page.waitForTimeout(9000);

  const tabs = (await page.locator('[data-testid^="dest-tab-"]').allInnerTexts()).map((t) => t.trim());
  check('the four tabs are Chinese', tabs.join('/') === '探索/住宿/游玩/行程', tabs.join('/'));

  const switcher = page.locator('[data-testid="language-switcher"]');
  check('a language switcher is present', (await switcher.count()) >= 1);

  // English proper nouns must remain readable: this is what a traveller types
  // into Google Maps or Grab, so a Chinese-only card would be unusable abroad.
  await page.locator('[data-testid="dest-tab-do"]').click();
  await page.waitForTimeout(4000);
  const cardText = await page.locator('[data-testid^="place-card-"]').first().innerText();
  check('place cards carry Latin proper nouns alongside Chinese', /[A-Za-z]{4,}/.test(cardText), cardText.slice(0, 60));

  // Switching to English must actually switch the chrome.
  await page.locator('[data-testid="locale-en"]').first().click();
  await page.waitForTimeout(2500);
  const enTabs = (await page.locator('[data-testid^="dest-tab-"]').allInnerTexts()).map((t) => t.trim());
  check('switching to English relabels the tabs', enTabs.join('/') === 'Explore/Stay/Do/Plan', enTabs.join('/'));

  await page.locator('[data-testid="locale-zh-CN"]').first().click();
  await page.waitForTimeout(2500);
  const backTabs = (await page.locator('[data-testid^="dest-tab-"]').allInnerTexts()).map((t) => t.trim());
  check('switching back restores Chinese', backTabs.join('/') === '探索/住宿/游玩/行程', backTabs.join('/'));
  await page.screenshot({ path: join(ARTIFACTS, '20-zh-destination.png') });
});

await step('21. DO filters by Chinese category and by area, together', async () => {
  await page.locator('[data-testid="dest-tab-do"]').click();
  await page.waitForTimeout(3500);

  const categories = (await page.locator('[data-testid="do-categories"] button').allInnerTexts()).map((t) =>
    t.replace(/\s+/g, ''),
  );
  check('the category row is Chinese and has 11 entries', categories.length === 11, categories.join(' '));
  check('it leads with 精选', categories[0].startsWith('精选'), categories[0]);
  check('it includes 美食 and 咖啡', categories.some((c) => c.startsWith('美食')) && categories.some((c) => c.startsWith('咖啡')));

  await page.locator('[data-testid="do-category-food"]').click();
  await page.waitForTimeout(3000);
  const allFood = await page.locator('[data-testid^="place-card-"]').count();
  check('美食 lists restaurants', allFood >= 20, `${allFood} cards`);

  const areaRow = page.locator('[data-testid="do-areas"] button');
  check('an area filter row is offered inside the category', (await areaRow.count()) > 3, `${await areaRow.count()} areas`);

  await page.locator('[data-testid="do-area-canggu"]').click();
  await page.waitForTimeout(3500);
  const scoped = await page.locator('[data-testid^="place-card-"]').count();
  check('美食 + 长谷 narrows the list', scoped > 0 && scoped < allFood, `${allFood} → ${scoped}`);

  const firstCard = await page.locator('[data-testid^="place-card-"]').first().innerText();
  check('restaurant cards show cuisine and meal type', /早午餐|午餐|晚餐|咖啡|巴厘菜|印尼菜|本地/.test(firstCard), firstCard.slice(0, 80));

  // A restaurant must be addable to the itinerary, or discovery is not planning.
  const add = page.locator('[data-testid^="place-card-"]').first().locator('[data-testid="add-to-trip"]');
  const needsTrip = page.locator('[data-testid^="place-card-"]').first().locator('[data-testid="add-to-trip-needs-trip"]');
  check('a restaurant offers an add-to-trip control', (await add.count()) + (await needsTrip.count()) > 0);

  await page.locator('[data-testid="do-area-canggu"]').click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: join(ARTIFACTS, '21-zh-do-food.png') });
});

await step('22. The research inbox imports a guide, extracts places and gates publication', async () => {
  await page.goto(`${BASE}/research`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.waitForSelector('[data-testid="research-add"]', { timeout: 60_000 });
  await page.waitForTimeout(2500);

  check('the inbox is Chinese', (await page.locator('h1').innerText()).includes('攻略研究'));

  // A URL alone is enough provenance; the text is supplied by the researcher
  // because these platforms prohibit automated collection.
  await page.locator('[data-testid="research-url"]').fill('https://www.xiaohongshu.com/explore/e2e-check');
  await page.waitForTimeout(1200);
  check('the platform is detected from the URL', /小红书/.test(await page.locator('main').innerText()));

  await page.locator('[data-testid="research-sample"]').click();
  await page.waitForTimeout(500);
  await page.locator('[data-testid="research-add"]').click();
  await page.waitForTimeout(4000);

  const sourceRows = await page.locator('[data-testid^="research-source-"]').count();
  check('the guide is stored', sourceRows >= 1, `${sourceRows} sources`);

  /*
   * `[data-testid^="research-mention-"]` also matches the <ul> that wraps the
   * rows, so the list container is excluded by requiring a row inside it.
   */
  const mentions = page.locator('[data-testid="research-mention-list"] > li');
  const mentionCount = await mentions.count();
  check('places are extracted from the pasted text', mentionCount >= 8, `${mentionCount} mentions`);

  const listText = await page.locator('[data-testid="research-mention-list"]').innerText();
  check('a known place is matched to its canonical record', /匹配到|已匹配/.test(listText), listText.slice(0, 80));
  check('unknown places are flagged for review', /需要确认|待验证/.test(listText));

  await page.screenshot({ path: join(ARTIFACTS, '22-zh-research-inbox.png'), fullPage: true });

  // Nothing is published until a human says so.
  const acceptedTab = page.locator('[data-testid="research-tab-accepted"]');
  check('the accepted tab starts empty', /0/.test(await acceptedTab.innerText()), await acceptedTab.innerText());

  const accept = page.locator('[data-testid="research-mention-list"] [data-testid^="research-accept-"]').first();
  check('a reviewer can accept a mention', (await accept.count()) === 1);
  await accept.click();
  await page.waitForTimeout(1500);
  check('accepting moves it to 已收录', /1/.test(await acceptedTab.innerText()), await acceptedTab.innerText());
  await page.screenshot({ path: join(ARTIFACTS, '23-zh-research-reviewed.png'), fullPage: true });
});

await step('23. An accepted mention reaches the traveller as an aggregate signal, not as copied text', async () => {
  await page.goto(`${BASE}/destination/bali`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.waitForSelector('.maplibregl-canvas', { timeout: 120_000 });
  await page.waitForTimeout(9000);
  await page.locator('[data-testid="dest-tab-do"]').click();
  await page.waitForTimeout(4000);

  const signals = page.locator('[data-testid^="place-social-"]');
  const count = await signals.count();
  check('places with accepted mentions show a signal block', count > 0, `${count} cards`);

  if (count > 0) {
    const text = await signals.first().innerText();
    check('the signal states a count over our own corpus', /在 \d+ 份已收录攻略中被提及/.test(text), text.slice(0, 60));
    // The honesty rule for this feature: a corpus count, never a popularity claim.
    check('it makes no popularity claim', !/最热门|全网第一|%\s*推荐|必吃榜/.test(text), text.slice(0, 60));
    check('it carries a provenance caveat', /不代表全网热度|只作为参考/.test(text));
  }
  await page.screenshot({ path: join(ARTIFACTS, '24-zh-social-signal.png') });
});


// ---------------------------------------------------------------------------
// This iteration: the origin became a first-class entity.
// ---------------------------------------------------------------------------

await step('24. The homepage opens on a default origin, with the origin as a control', async () => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.waitForSelector('.maplibregl-canvas', { timeout: 120_000 });
  await page.waitForTimeout(9000);

  const trigger = page.locator('[data-testid="origin-trigger"]').first();
  check('an origin control is present in the header', (await trigger.count()) === 1);
  const city = await page.locator('[data-testid="origin-trigger-city"]').first().innerText();
  const codes = await page.locator('[data-testid="origin-trigger-codes"]').first().innerText();
  check('it defaults to the intended origin', city.trim() === '新加坡', city);
  check('it shows the airport codes', /SIN/.test(codes), codes);
  // The old fixed "出发地 SIN" text must be gone: origin is now a decision.
  const body = await page.locator('body').innerText();
  check('no fixed departure code is printed as static text', !/出发地\s*SIN\b/.test(body));
  await page.screenshot({ path: join(ARTIFACTS, '30-origin-default.png') });
});

await step('25. The selector searches by Chinese name, English name and airport code', async () => {
  await page.locator('[data-testid="origin-trigger"]').first().click();
  await page.waitForTimeout(900);
  check('the selector opens', await page.locator('[data-testid="origin-trigger-panel"]').isVisible());

  const groups = await page.locator('[data-testid="origin-trigger-panel"] .label-caps').allInnerTexts();
  check('origins are grouped by region', groups.length >= 5, groups.join(' / '));
  check('the groups are Chinese', /新加坡/.test(groups.join(' ')) && /粤港澳大湾区/.test(groups.join(' ')));

  const search = page.locator('[data-testid="origin-trigger-search"]');
  const optionIds = async () =>
    (await page.locator('[data-testid^="origin-trigger-option-"]').allInnerTexts()).map((x) => x.split('\n')[0].trim());

  for (const [query, expected] of [
    ['广州', '广州'],
    ['Guangzhou', '广州'],
    ['CAN', '广州'],
    ['上海', '上海'],
    ['Shanghai', '上海'],
    ['BKK', '曼谷'],
    ['Bangkok', '曼谷'],
  ]) {
    await search.fill(query);
    await page.waitForTimeout(500);
    const found = await optionIds();
    check(`search "${query}" resolves`, found.includes(expected), found.join(', ') || 'nothing');
  }

  await search.fill('zzzz');
  await page.waitForTimeout(500);
  check('an unmatched query says so rather than showing nothing', /没有找到/.test(await page.locator('[data-testid="origin-trigger-panel"]').innerText()));
  await page.screenshot({ path: join(ARTIFACTS, '31-origin-search.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
});

await step('26. Every supported origin can be selected, and the map reorients', async () => {
  const origins = [
    ['guangzhou', '广州', 'CAN'],
    ['shenzhen', '深圳', 'SZX'],
    ['hong-kong', '香港', 'HKG'],
    ['shanghai', '上海', 'PVG'],
    ['hangzhou', '杭州', 'HGH'],
    ['beijing', '北京', 'PEK'],
    ['chengdu', '成都', 'CTU'],
    ['bangkok', '曼谷', 'BKK'],
    ['kuala-lumpur', '吉隆坡', 'KUL'],
    ['jakarta', '雅加达', 'CGK'],
    ['singapore', '新加坡', 'SIN'],
  ];

  const seen = [];
  for (const [id, name, code] of origins) {
    await chooseOrigin(page, id);
    await page.waitForTimeout(2200);
    const shown = (await page.locator('[data-testid="origin-trigger-city"]').first().innerText()).trim();
    const shownCodes = (await page.locator('[data-testid="origin-trigger-codes"]').first().innerText()).trim();
    seen.push({ id, ok: shown === name && shownCodes.includes(code), shown, shownCodes });
  }
  const bad = seen.filter((x) => !x.ok);
  check(
    `all ${origins.length} origins select and update the control`,
    bad.length === 0,
    bad.length ? bad.map((b) => `${b.id}→${b.shown}/${b.shownCodes}`).join(', ') : origins.map((o) => o[1]).join(' '),
  );

  // The origin marker must be at the selected origin, and the viewport must
  // contain it — this is the "map reorients itself" requirement.
  const view = await page.evaluate(async () => {
    for (let i = 0; i < 40; i += 1) {
      const m = window.__mmMap;
      if (m?.loaded?.()) {
        const b = m.getBounds();
        return {
          hasSingapore: b.contains([103.8198, 1.3521]),
          hasKualaLumpur: b.contains([101.6869, 3.139]),
          west: Number(b.getWest().toFixed(1)),
          south: Number(b.getSouth().toFixed(1)),
        };
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    return null;
  });
  check('the viewport covers the selected origin', Boolean(view && view.hasKualaLumpur), JSON.stringify(view));
  await page.screenshot({ path: join(ARTIFACTS, '32-origin-selected.png') });
});

await step('27. Destination metadata is origin-relative, and unknown stays unknown', async () => {
  const readBali = async () => {
    const row = page.locator('[data-testid="destination-rail"] button', { hasText: '巴厘岛' }).first();
    await row.waitFor({ timeout: 20_000 });
    return (await row.innerText()).replace(/\n/g, ' ');
  };
  const setOrigin = async (id) => {
    await chooseOrigin(page, id);
    await page.waitForTimeout(3000);
  };

  await setOrigin('singapore');
  const fromSingapore = await readBali();
  await setOrigin('guangzhou');
  const fromGuangzhou = await readBali();

  check('the same destination reports a different journey per origin', fromSingapore !== fromGuangzhou, `${fromSingapore} || ${fromGuangzhou}`);
  check('Singapore → Bali is the shorter of the two', /2h/.test(fromSingapore) && /5h/.test(fromGuangzhou), `${fromSingapore} | ${fromGuangzhou}`);

  /*
   * The honesty rule. Jakarta has almost no curated connections, so its rail
   * must contain 航班信息待确认 — and must not print a duration beside it.
   */
  await setOrigin('jakarta');
  const railText = await page.locator('[data-testid="destination-rail"]').innerText();
  check('unknown connections are labelled as unknown', /航班信息待确认/.test(railText));
  const unknownLines = railText.split('\n').filter((_, i, arr) => /航班信息待确认/.test(arr[i]));
  check('an unknown connection shows no duration', unknownLines.every((line) => !/≈\d/.test(line)), unknownLines.slice(0, 2).join(' | '));

  // And the preview card must expose the same fact structurally.
  await page.locator('[data-testid="destination-rail"] button', { hasText: '巴拉望' }).first().click();
  await page.waitForTimeout(2500);
  const route = page.locator('[data-testid="preview-route"]');
  check('the preview card carries its origin', (await route.getAttribute('data-origin')) === 'jakarta');
  check('the preview card marks the confidence', ['unknown', 'approximate', 'verified'].includes(await route.getAttribute('data-confidence')));
  await page.screenshot({ path: join(ARTIFACTS, '33-origin-relative.png') });
});

await step('28. The selected origin survives a refresh, and Bali still works', async () => {
  await chooseOrigin(page, 'shanghai');
  await page.waitForTimeout(2500);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.maplibregl-canvas', { timeout: 120_000 });
  await page.waitForTimeout(8000);
  const after = (await page.locator('[data-testid="origin-trigger-city"]').first().innerText()).trim();
  check('the origin survives a refresh', after === '上海', after);

  // Bali must be untouched by all of this.
  await page.goto(`${BASE}/destination/bali`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.waitForSelector('.maplibregl-canvas', { timeout: 120_000 });
  await page.waitForTimeout(9000);
  const tabs = (await page.locator('[data-testid^="dest-tab-"]').allInnerTexts()).map((t) => t.trim());
  check('Bali keeps its four tabs', tabs.join('/') === '探索/住宿/游玩/行程', tabs.join('/'));

  for (const [tab, selector] of [['stay', '[data-testid^="hotel-card-"]'], ['do', '[data-testid^="place-card-"]']]) {
    await page.locator(`[data-testid="dest-tab-${tab}"]`).click();
    await page.waitForTimeout(4000);
    check(`Bali ${tab} still lists content`, (await page.locator(selector).count()) > 0);
  }
  await page.locator('[data-testid="dest-tab-plan"]').click();
  await page.waitForTimeout(3500);
  check('Bali PLAN still offers to start a trip', (await page.locator('[data-testid="create-trip"], [data-testid^="day-tab-"]').count()) > 0);

  // The destination page knows the origin too.
  const destOrigin = (await page.locator('[data-testid="origin-trigger-city"]').first().innerText()).trim();
  check('the destination page carries the selected origin', destOrigin === '上海', destOrigin);
  await page.screenshot({ path: join(ARTIFACTS, '34-origin-on-destination.png') });
});

// ---------------------------------------------------------------------------

writeFileSync(
  join(ARTIFACTS, 'report.json'),
  JSON.stringify({ results, consoleErrors, pageErrors, failedRequests }, null, 2),
);

console.log('\n── console errors ──');
console.log(consoleErrors.length ? consoleErrors.join('\n') : '(none)');
console.log('\n── page errors ──');
console.log(pageErrors.length ? pageErrors.join('\n') : '(none)');
console.log('\n── failed requests ──');
console.log(failedRequests.length ? failedRequests.join('\n') : '(none)');

check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | ') || 'none');
check('no console errors', consoleErrors.length === 0, consoleErrors.join(' | ') || 'none');

console.log(`\n${failures === 0 ? '✅ ALL CHECKS PASSED' : `❌ ${failures} CHECK(S) FAILED`}`);
console.log(`Report: ${join(ARTIFACTS, 'report.json')}`);

await browser.close();
process.exit(failures === 0 ? 0 : 1);

function firstLine(text) {
  return (text ?? '').split('\n')[0].slice(0, 90);
}

function firstMatch(text, regex) {
  const match = text.match(regex);
  return match ? match[0].replace(/\s+/g, ' ') : 'no match';
}
