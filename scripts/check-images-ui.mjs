/**
 * Do the photographs actually reach the screen?
 *
 * `scripts/test-images.mts` proves the manifest is complete and honest. It cannot
 * prove that a card renders one, that the file loads, or that a subject WITH
 * photography is not showing the "no photography available" state. This drives a
 * real browser through a destination and counts loaded images — and fails on any
 * 404 for a file under /images/.
 *
 *   node scripts/check-images-ui.mjs --destination phu-quoc
 */

import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';
const argIndex = process.argv.indexOf('--destination');
const DESTINATION = argIndex === -1 ? 'phu-quoc' : (process.argv[argIndex + 1] ?? 'phu-quoc');
const ARTIFACTS = join(process.cwd(), 'test-artifacts', `images-${DESTINATION}`);
mkdirSync(ARTIFACTS, { recursive: true });
const CHROME =
  process.env.CHROME_PATH ??
  join(
    homedir(),
    'Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  );

/**
 * One property known to have verified photography and one known not to, per
 * destination. The point of the pair is the contrast: the second must say so
 * rather than borrow the first one's picture.
 */
const FIXTURES = {
  bali: { withPhoto: 'conrad-bali', withoutPhoto: 'hilton-bali-resort' },
  'phu-quoc': { withPhoto: 'jw-marriott-phu-quoc-emerald-bay', withoutPhoto: 'sheraton-phu-quoc-long-beach-resort' },
};
const fixture = FIXTURES[DESTINATION];

let checks = 0;
let failures = 0;
function check(name, passed, detail = '') {
  checks += 1;
  if (!passed) failures += 1;
  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

const browser = await chromium.launch({ executablePath: CHROME });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
const missingImages = [];
page.on('console', (message) => message.type() === 'error' && consoleErrors.push(message.text()));
page.on('pageerror', (error) => consoleErrors.push(error.message));
page.on('response', (response) => {
  if (/\/images\//.test(response.url()) && response.status() >= 400) {
    missingImages.push(`${response.status()} ${response.url().split('/').pop()}`);
  }
});

/**
 * Card photography is lazy-loaded, so a single glance only ever sees the first
 * screenful and would report a working gallery as broken. This walks the panel
 * from top to bottom and accumulates what actually arrived.
 */
async function collectLoaded(scope) {
  const seen = new Set();
  await page.evaluate(() => {
    const area = document.querySelector('.scroll-area');
    if (area) area.scrollTop = 0;
  });
  for (let step = 0; step < 14; step += 1) {
    const batch = await page.evaluate((selector) => {
      const nodes = [...document.querySelectorAll(`${selector} img`)];
      return nodes
        .filter((img) => img.complete && img.naturalWidth > 0)
        .map((img) => img.getAttribute('src') ?? '')
        .filter((src) => /\/images\//.test(src));
    }, scope);
    for (const src of batch) seen.add(src);
    const done = await page.evaluate(() => {
      const area = document.querySelector('.scroll-area');
      if (!area) return true;
      const before = area.scrollTop;
      area.scrollTop = before + area.clientHeight * 0.85;
      return area.scrollTop + area.clientHeight >= area.scrollHeight - 4;
    });
    await page.waitForTimeout(700);
    if (done) break;
  }
  return seen;
}

/** Cards in the DOM, and how many of them show the honest no-photography state. */
async function cardStats(scope) {
  return page.evaluate((selector) => {
    const cards = [...document.querySelectorAll(selector)];
    return {
      total: cards.length,
      withoutPhoto: cards.filter((card) => /暂无该|暂无照片|No photography/i.test(card.textContent ?? '')).length,
    };
  }, scope);
}

try {
  await page.goto(`${BASE}/destination/${DESTINATION}`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
  await page.waitForSelector('.maplibregl-canvas', { timeout: 120_000 });
  await page.waitForTimeout(7000);

  // --- EXPLORE: area cards ------------------------------------------------
  await page.locator('[data-testid="dest-tab-explore"]').click();
  await page.waitForTimeout(2500);
  await page.waitForFunction(
    () => document.querySelectorAll('[data-testid^="area-card-"] img').length > 0,
    null,
    { timeout: 20_000 },
  ).catch(() => {});
  await page.waitForTimeout(2500);
  const areaImages = await collectLoaded('[data-testid^="area-"]');
  const areaStats = await cardStats('[data-testid^="area-card-"], [data-testid^="area-row-"]');
  /*
   * EXPLORE shows the stay-base areas as full cards and the day-trip zones as
   * compact rows. Only the cards carry a photograph, and four of Phu Quoc's seven
   * stay areas have one — so four is the whole story this screen can tell, and a
   * lower number would mean a broken card rather than a thin dataset.
   */
  check(
    'explore renders area photography',
    areaImages.size >= 4,
    `${areaImages.size} distinct images across ${areaStats.total} area entries`,
  );
  await page.screenshot({ path: join(ARTIFACTS, '01-explore.png') });

  // The day-trip zones are the other side of the 住宿区 / 一日游 toggle.
  await page.getByRole('radio', { name: /一日游/ }).click();
  await page.waitForTimeout(2500);
  const zoneImages = await collectLoaded('[data-testid^="area-card-"]');
  check('the day-trip zones render their photography too', zoneImages.size >= 3, `${zoneImages.size} distinct images`);
  await page.screenshot({ path: join(ARTIFACTS, '01b-explore-zones.png') });
  await page.getByRole('radio', { name: /住宿区/ }).click();
  await page.waitForTimeout(1500);

  // --- STAY: the two properties that have photography, and one that does not
  await page.locator('[data-testid="dest-tab-stay"]').click();
  await page.waitForTimeout(4000);
  const hotelImages = await collectLoaded('[data-testid^="hotel-card-"]');
  const hotelStats = await cardStats('[data-testid^="hotel-card-"]');
  check(
    'stay renders property photography where it exists',
    hotelImages.size >= 2,
    `${hotelImages.size} distinct images across ${hotelStats.total} hotel cards`,
  );
  check(
    'properties with no verified photography are stated, not faked',
    hotelStats.withoutPhoto >= 4,
    `${hotelStats.withoutPhoto} of ${hotelStats.total} say so`,
  );
  if (fixture) {
    const withPhoto = await page.locator(`[data-testid="hotel-card-${fixture.withPhoto}"] img`).count();
    check(`${fixture.withPhoto} shows a photograph`, withPhoto === 1, `${withPhoto} image(s)`);
    const honest = await page.locator(`[data-testid="hotel-card-${fixture.withoutPhoto}"]`).innerText();
    check(
      `${fixture.withoutPhoto} says it has no property photography`,
      /暂无该酒店实拍照片|No property photography/i.test(honest),
      honest.split('\n').slice(0, 3).join(' / ').slice(0, 70),
    );
  }
  await page.screenshot({ path: join(ARTIFACTS, '02-stay.png') });

  // --- DO: place cards, across the categories that have photography --------
  await page.locator('[data-testid="dest-tab-do"]').click();
  await page.waitForSelector('[data-testid^="place-card-"]', { timeout: 25_000 });
  await page.waitForTimeout(4000);
  const placeImages = await collectLoaded('[data-testid^="place-"]');
  check('do renders place photography', placeImages.size >= 15, `${placeImages.size} distinct images`);
  await page.screenshot({ path: join(ARTIFACTS, '03-do.png') });

  // --- the pictures belong to THIS destination ----------------------------
  const foreign = [...placeImages, ...areaImages, ...hotelImages].filter(
    (src) => !src.includes(`/images/${DESTINATION}/`),
  );
  check('every rendered photograph is this destination’s', foreign.length === 0, `${foreign.length} foreign`);

  check('no image 404s', missingImages.length === 0, missingImages.slice(0, 4).join(', '));
  check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '));
} finally {
  console.log(`\n${failures === 0 ? '✅ IMAGE UI CHECK PASSED' : `❌ ${failures} CHECK(S) FAILED`} (${checks} checks)`);
  await browser.close();
}
process.exit(failures === 0 ? 0 : 1);
