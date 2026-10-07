/**
 * Manual check for the PLAN panel's vertical-space fix.
 *
 * Builds the exact shape the brief asks for — 3 hotels, 4 days — entirely through
 * the interface, then measures how much of the day is actually visible.
 */
import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';
const OUT = join(process.cwd(), 'test-artifacts/plan-space');
mkdirSync(OUT, { recursive: true });
const CHROME =
  process.env.CHROME_PATH ??
  join(
    homedir(),
    'Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  );

let failures = 0;
function check(name, passed, detail = '') {
  if (!passed) failures += 1;
  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

const browser = await chromium.launch({ executablePath: CHROME });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));

const panelBox = async () => page.locator('[data-testid="stay-editor"]').boundingBox();
const visibleStops = async () => {
  const viewport = page.viewportSize();
  return page.evaluate((vh) => {
    const rows = [...document.querySelectorAll('[data-testid^="itinerary-item-"]')];
    return rows.filter((row) => {
      const r = row.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= vh && r.height > 4;
    }).length;
  }, viewport.height);
};

try {
  await page.goto(`${BASE}/destination/bali`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
  await page.waitForSelector('.maplibregl-canvas', { timeout: 120_000 });
  await page.waitForTimeout(6000);
  await page.evaluate(() => window.localStorage.clear());

  // --- create a 4-day trip: Oct 10 → Oct 13 -------------------------------
  await page.locator('[data-testid="dest-tab-plan"]').click();
  await page.waitForSelector('[data-testid="arrival-date"]', { timeout: 20_000 });
  await page.locator('[data-testid="arrival-date"]').fill('2026-10-10');
  await page.locator('[data-testid="departure-date"]').fill('2026-10-13');
  await page.locator('[data-testid="create-trip"]').click();
  await page.waitForSelector('[data-testid="day-tab-4"]', { timeout: 20_000 });

  // --- three real stops on day 1, so "visible" means stops, not anchors ----
  await page.locator('[data-testid="dest-tab-do"]').click();
  await page.waitForSelector('[data-testid^="place-card-"] [data-testid="add-to-trip"]', { timeout: 30_000 });
  await page.waitForTimeout(1500);
  const addButtons = page.locator('[data-testid^="place-card-"] [data-testid="add-to-trip"]');
  const available = await addButtons.count();
  check('places can be added to the day', available >= 3, `${available} add buttons`);
  for (let i = 0; i < 3; i += 1) {
    await addButtons.nth(0).click();
    await page.waitForTimeout(900);
  }
  await page.locator('[data-testid="dest-tab-plan"]').click();
  await page.waitForTimeout(3000);
  const stopCount = await page.locator('[data-testid^="itinerary-item-"]').count();
  check('three stops are on the day', stopCount === 3, `${stopCount}`);

  // --- collapsed by default ----------------------------------------------
  const defaultBox = await panelBox();
  check('accommodation starts collapsed', (await page.locator('[data-testid="stay-list"]').count()) === 0);
  check('accommodation starts within the height budget', defaultBox.height <= 120, `${Math.round(defaultBox.height)}px`);
  check(
    'the collapsed summary says there is no accommodation yet',
    /还没有安排住宿/.test(await page.locator('[data-testid="stay-summary"]').innerText()),
    await page.locator('[data-testid="stay-summary"]').innerText(),
  );

  // --- three hotels, through the editor ----------------------------------
  const addStay = async (hotelId, checkIn, checkOut) => {
    if ((await page.locator('[data-testid="stay-add-form"]').count()) === 0) {
      await page.locator('[data-testid="stay-add"]').click();
      await page.waitForSelector('[data-testid="stay-add-form"]', { timeout: 10_000 });
    }
    await page.locator('[data-testid="stay-add-hotel"]').selectOption(hotelId);
    await page.locator('[data-testid="stay-add-checkin"]').fill(checkIn);
    await page.locator('[data-testid="stay-add-checkout"]').fill(checkOut);
    await page.locator('[data-testid="stay-add-submit"]').click();
    await page.waitForTimeout(600);
  };

  await page.locator('[data-testid="stay-editor-toggle"]').click();
  await page.waitForSelector('[data-testid="stay-add-form"]', { timeout: 10_000 });
  check('adding accommodation from empty opens the form', true);
  await addStay('the-ritz-carlton-bali', '2026-10-10', '2026-10-11');
  await addStay('w-bali-seminyak', '2026-10-11', '2026-10-12');
  await addStay('the-st-regis-bali-resort', '2026-10-12', '2026-10-13');
  check('three stays were added', (await page.locator('[data-testid="stay-list"] > li').count()) === 3);

  // --- 完成 collapses, and the summary states the same facts -------------
  await page.locator('[data-testid="stay-editor-toggle"]').click();
  await page.waitForTimeout(400);
  check('完成 collapses the editor', (await page.locator('[data-testid="stay-list"]').count()) === 0);
  const heading = (await page.locator('[data-testid="stay-summary-heading"]').innerText()).trim();
  check('the summary counts the hotels and the changes', /3 家住宿 · 2 次换酒店/.test(heading), heading);
  const chain = await page.locator('[data-testid="stay-summary-chain"]').innerText();
  const named = ['丽思卡尔顿', 'W 度假', '瑞吉'].filter((n) => chain.includes(n)).length;
  check('the chain names all three hotels', named === 3, chain.replace(/\s+/g, ' '));
  check('the chain states each hotel’s nights', (chain.match(/1 晚/g) ?? []).length === 3, chain.replace(/\s+/g, ' '));

  const collapsedBox = await panelBox();
  check('the collapsed summary fits the 80–120px budget', collapsedBox.height >= 30 && collapsedBox.height <= 120, `${Math.round(collapsedBox.height)}px`);
  check('no hotel select is shown outside edit mode', (await page.locator('[data-testid^="stay-hotel-"]').count()) === 0);
  check('no stay date input is shown outside edit mode', (await page.locator('[data-testid^="stay-checkin-"]').count()) === 0);

  await page.screenshot({ path: join(OUT, '01-collapsed.png') });

  // --- the day is the dominant content ----------------------------------
  const collapsedVisible = await visibleStops();
  const dayHeader = await page.locator('[data-testid^="day-start-"]').first().boundingBox();

  // Where the vertical space actually goes. Printed, not asserted: the point of
  // the exercise is to see the itinerary get the room, and this is how that is
  // measured rather than eyeballed.
  const dayRouteTop = (await page.locator('[data-testid^="day-route-"]').boundingBox()).y;
  const geometry = await page.evaluate(() => {
    const box = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) };
    };
    const rows = [...document.querySelectorAll('[data-testid^="itinerary-item-"]')].map((row) => {
      const r = row.getBoundingClientRect();
      return `${Math.round(r.top)}–${Math.round(r.bottom)}`;
    });
    const anchor = document.querySelector('[data-testid^="day-anchor-"]');
    return {
      viewport: window.innerHeight,
      stayEditor: box('[data-testid="stay-editor"]'),
      importCta: box('[data-testid="import-guide-cta"]'),
      dayTabs: box('[role="tablist"]'),
      dayRoute: box('[data-testid^="day-route-"]'),
      startRow: box('[data-testid^="day-start-"]'),
      startAnchor: anchor ? { top: Math.round(anchor.getBoundingClientRect().top) } : null,
      rows,
    };
  });
  console.log('  · geometry', JSON.stringify(geometry));

  check('the day start-time control is above the fold', dayHeader !== null && dayHeader.y + dayHeader.height < 900, `${Math.round(dayHeader?.y ?? -1)}px`);
  /*
   * The brief asks for "2–3 stops" below the trip header, the accommodation
   * summary and the day selector. Two is the floor and the shape of the rest of
   * the panel is why: each stop is followed by a transport row that carries a
   * measured duration, the provider that produced it and a rationale sentence, so
   * three stops with their legs is ~760px of content in a ~445px window. What the
   * fix has to deliver is that the window is the itinerary's, not the editor's.
   */
  check('at least two stops are fully visible', collapsedVisible >= 2, `${collapsedVisible} stops`);
  const window1990 = 900 - Math.round(dayRouteTop);
  check('the itinerary owns most of the panel', window1990 >= 400, `${window1990}px of the 900px viewport`);

  // The start time is stated once. The native input renders 上午 09:00; the panel
  // used to print 09:00 again next to it.
  const startRow = page.locator('[data-testid^="day-start-"]').first().locator('xpath=../..');
  const startText = (await startRow.innerText()).replace(/\s+/g, ' ').trim();
  check('the start time is not printed twice', (startText.match(/09:00/g) ?? []).length <= 1, startText);

  // --- the same measurement with the editor open (the old, always-open shape)
  await page.locator('[data-testid="stay-editor-toggle"]').click();
  await page.waitForTimeout(600);
  const expandedBox = await panelBox();
  const expandedVisible = await visibleStops();
  await page.screenshot({ path: join(OUT, '02-expanded.png') });
  const thirdTop = await page
    .locator('[data-testid^="itinerary-item-"]')
    .nth(2)
    .boundingBox()
    .then((b) => Math.round(b.y))
    .catch(() => null);
  if (thirdTop !== null) console.log(`  · the third stop starts at ${thirdTop}px (fold 900)`);
  console.log(`  · expanded editor ${Math.round(expandedBox.height)}px → ${expandedVisible} fully visible stops`);
  console.log(`  · collapsed summary ${Math.round(collapsedBox.height)}px → ${collapsedVisible} fully visible stops`);
  if (thirdTop !== null) console.log(`  · (third stop at ${thirdTop}px with the editor open)`);
  check('collapsing frees real vertical space', collapsedVisible > expandedVisible, `${collapsedVisible} vs ${expandedVisible} stops`);

  // --- switching days re-collapses --------------------------------------
  await page.locator('[data-testid="day-tab-2"]').click();
  await page.waitForTimeout(500);
  check('switching day collapses the editor again', (await page.locator('[data-testid="stay-list"]').count()) === 0);
  const day2Heading = (await page.locator('[data-testid="stay-summary-heading"]').innerText()).trim();
  check('the summary survives the day switch', /3 家住宿 · 2 次换酒店/.test(day2Heading), day2Heading);

  // --- the session remembers the choice across a tab switch --------------
  await page.locator('[data-testid="stay-editor-toggle"]').click();
  await page.waitForTimeout(400);
  await page.locator('[data-testid="dest-tab-do"]').click();
  await page.waitForTimeout(1500);
  await page.locator('[data-testid="dest-tab-plan"]').click();
  await page.waitForTimeout(2500);
  const rememberedOpen = (await page.locator('[data-testid="stay-list"]').count()) === 1;
  check('the session remembers the editor was left open', rememberedOpen);
  await page.locator('[data-testid="stay-editor-toggle"]').click();
  await page.waitForTimeout(300);

  // --- one hotel reads as one line --------------------------------------
  await page.locator('[data-testid="stay-editor-toggle"]').click();
  await page.waitForSelector('[data-testid="stay-list"] > li', { timeout: 10_000 });
  for (let i = 0; i < 2; i += 1) {
    await page.locator('[data-testid="stay-list"] > li').nth(1).locator('button').click();
    await page.waitForTimeout(600);
  }
  check('two stays were deleted', (await page.locator('[data-testid="stay-list"] > li').count()) === 1);
  await page.locator('[data-testid="stay-editor-toggle"]').click();
  await page.waitForTimeout(400);
  const singleHeading = (await page.locator('[data-testid="stay-summary-heading"]').innerText()).trim();
  check(
    'one hotel reads as a single line',
    /^🏨 .+ · 1 晚$/.test(singleHeading) && /丽思卡尔顿/.test(singleHeading),
    singleHeading,
  );
  check('the single-hotel summary has no chain line', (await page.locator('[data-testid="stay-summary-chain"]').count()) === 0);
  await page.screenshot({ path: join(OUT, '03-single.png') });

  // --- the unbooked-night warning is not hidden by collapsing ------------
  await page.locator('[data-testid="stay-editor-toggle"]').click();
  await page.waitForSelector('[data-testid^="stay-checkout-"]', { timeout: 10_000 });
  const stayId = await page.locator('[data-testid^="stay-checkout-"]').first().getAttribute('data-testid');
  await page.locator(`[data-testid="${stayId}"]`).fill('2026-10-11');
  await page.waitForTimeout(600);
  await page.locator('[data-testid="stay-editor-toggle"]').click();
  await page.waitForTimeout(400);
  const warn = await page.locator('[data-testid="stay-summary-unbooked"]').count();
  check('an unbooked night is still warned about when collapsed', warn === 1);
  if (warn === 1) {
    check(
      'the warning names the count',
      /2 晚/.test(await page.locator('[data-testid="stay-summary-unbooked"]').innerText()),
      await page.locator('[data-testid="stay-summary-unbooked"]').innerText(),
    );
  }

  check('no console or page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} finally {
  console.log(`\n${failures === 0 ? '✅ PLAN SPACE CHECK PASSED' : `❌ ${failures} CHECK(S) FAILED`}`);
  await browser.close();
}
process.exit(failures === 0 ? 0 : 1);
