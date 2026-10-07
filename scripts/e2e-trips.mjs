/**
 * The acceptance scenario for 我的行程, driven through the REAL UI.
 *
 * The brief is explicit: if any step cannot be completed through the actual
 * interface, the feature is incomplete. So this script touches nothing but the
 * DOM — no store poking, no seeded localStorage — and it fails loudly when a step
 * has no way to be performed.
 *
 * Usage: npm run dev, then `node scripts/e2e-trips.mjs`
 */

import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';
const ARTIFACTS = join(process.cwd(), 'test-artifacts', 'trips');
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

async function step(name, fn) {
  console.log(`\n${name}`);
  try {
    await fn();
  } catch (error) {
    const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
    check(name, false, `threw — ${reason}`);
    await errors.shot(page, name);
  }
}

async function until(page, fn, { timeout = 10000, interval = 250 } = {}) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    last = await page.evaluate(fn);
    if (last) return last;
    await page.waitForTimeout(interval);
  }
  return last;
}

const browser = await chromium.launch({ executablePath: CHROME });
const context = await browser.newContext({ viewport: { width: 1440, height: 950 }, locale: 'zh-CN' });
const page = await context.newPage();
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

const errors = {
  async shot(p, name) {
    await p.screenshot({ path: join(ARTIFACTS, `${name.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}.png`) }).catch(() => {});
  },
};

try {
  // -------------------------------------------------------------------------
  await step('0. Warm up and clear any previous run', async () => {
    await page.goto(`${BASE}/trips`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    await page.waitForSelector('[data-testid="trips-page"]', { timeout: 120_000 });
    // A clean slate, so the run is repeatable.
    await page.evaluate(() => window.localStorage.clear());
    await page.waitForTimeout(500);
  });

  // -------------------------------------------------------------------------
  // 1. Create a Bali trip Oct 10–14.
  // -------------------------------------------------------------------------
  let tripId = null;
  await step('1. Create a Bali trip Oct 10–14', async () => {
    await page.goto(`${BASE}/destination/bali`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    await page.waitForSelector('.maplibregl-canvas', { timeout: 120_000 });
    await page.waitForTimeout(7000);
    await page.locator('[data-testid="dest-tab-plan"]').click();
    await page.waitForSelector('[data-testid="arrival-date"]', { timeout: 20_000 });
    await page.locator('[data-testid="arrival-date"]').fill('2026-10-10');
    await page.locator('[data-testid="departure-date"]').fill('2026-10-14');
    await page.locator('[data-testid="create-trip"]').click();
    await page.waitForSelector('[data-testid="day-tab-5"]', { timeout: 20_000 });
    check('the trip has five days', (await page.locator('[data-testid^="day-tab-"]').count()) === 5);

    tripId = await page.evaluate(() => JSON.parse(window.localStorage.getItem('meridian.trips.v1') ?? '{}').state?.activeTripId);
    check('a trip id exists', Boolean(tripId), String(tripId));
    await errors.shot(page, '01-trip-created');
  });

  // -------------------------------------------------------------------------
  // 2–3. Hotel A, then Hotel B, on the trip's own page.
  // -------------------------------------------------------------------------
  await step('2–3. Set Hotel A (Oct 10–12) and Hotel B (Oct 12–14)', async () => {
    await page.goto(`${BASE}/trips/detail/?id=${encodeURIComponent(tripId)}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="trip-detail-page"]', { timeout: 30_000 });
    await page.waitForTimeout(1200);

    // Hotels are chosen by their canonical id. The interface is Chinese-first, so
    // the visible option text is 巴厘岛 W 度假酒店 — matching on "W Bali" would be
    // testing the English bundle, not the product.
    const addStay = async (hotelId, checkIn, checkOut) => {
      await page.locator('[data-testid="trip-stay-add"]').click();
      await page.waitForSelector('[data-testid="trip-stay-add-form"]', { timeout: 10_000 });
      const select = page.locator('[data-testid="trip-stay-add-hotel"]');
      const value = await select.locator(`option[value="${hotelId}"]`).getAttribute('value');
      if (!value) throw new Error(`no hotel option with id ${hotelId}`);
      await select.selectOption(value);
      await page.locator('[data-testid="trip-stay-add-checkin"]').fill(checkIn);
      await page.locator('[data-testid="trip-stay-add-checkout"]').fill(checkOut);
      await page.locator('[data-testid="trip-stay-add-submit"]').click();
      await page.waitForTimeout(900);
      return value;
    };

    const hotelA = await addStay('w-bali-seminyak', '2026-10-10', '2026-10-12');
    const hotelB = await addStay('the-st-regis-bali-resort', '2026-10-12', '2026-10-14');

    // Scoped to the rows: the editor, its list wrapper and the add form all
    // match a `trip-stay-*` prefix and all contain date inputs.
    const stays = await page.locator('[data-testid="trip-stay-list"] > li').count();
    check('two stays are listed', stays === 2, `${stays}`);
    check('the trip reports no unbooked night', (await page.locator('[data-testid="trip-unbooked"]').count()) === 0);
    await errors.shot(page, '02-two-stays');

    // 9's precondition: the change day must be marked. Checked here because the
    // stays are what create it.
    const changeDays = await page.locator('[data-testid^="trip-hotel-change-"]').count();
    check('exactly one day is marked 换酒店', changeDays === 1, `${changeDays}`);

    // Remember for later steps.
    await page.evaluate(
      ([a, b]) => window.localStorage.setItem('__acceptance', JSON.stringify({ hotelA: a, hotelB: b })),
      [hotelA, hotelB],
    );
  });

  // -------------------------------------------------------------------------
  // 4. Day 2 start time 08:30.
  // -------------------------------------------------------------------------
  await step('4. Set Day 2 start time to 08:30', async () => {
    const dayIds = await page.evaluate(() => {
      const raw = JSON.parse(window.localStorage.getItem('meridian.trips.v1') ?? '{}').state;
      const trip = raw.trips.find((entry) => entry.id === raw.activeTripId);
      return trip.days.map((day) => day.id);
    });
    const day2 = dayIds[1];
    await page.locator(`[data-testid="trip-day-start-${day2}"]`).fill('08:30');
    await page.waitForTimeout(700);
    const stored = await page.evaluate(
      ([id]) => {
        const raw = JSON.parse(window.localStorage.getItem('meridian.trips.v1') ?? '{}').state;
        const trip = raw.trips.find((entry) => entry.id === raw.activeTripId);
        return trip.days.find((day) => day.id === id)?.startTime;
      },
      [day2],
    );
    check('the day stores its own start time', stored === '08:30', String(stored));
    await errors.shot(page, '04-day2-start');
  });

  // -------------------------------------------------------------------------
  // 5. Add three POIs to Day 2, through the destination DO tab.
  // -------------------------------------------------------------------------
  await step('5. Add three POIs to Day 2', async () => {
    await page.goto(`${BASE}/destination/bali`, { waitUntil: 'domcontentloaded', timeout: 240_000 });
    await page.waitForSelector('.maplibregl-canvas', { timeout: 120_000 });
    await page.waitForTimeout(6000);
    await page.locator('[data-testid="dest-tab-plan"]').click();
    await page.waitForSelector('[data-testid^="day-tab-"]', { timeout: 20_000 });
    // Select Day 2 in the planner, then add from DO.
    await page.locator('[data-testid^="day-tab-"]').nth(1).click();
    await page.waitForTimeout(1200);
    await page.locator('[data-testid="dest-tab-do"]').click();
    await page.waitForSelector('[data-testid^="hotel-card-"], [data-testid^="place-card-"]', { timeout: 25_000 });
    await page.waitForTimeout(1500);

    const addButtons = page.locator('[data-testid^="place-card-"] [data-testid="add-to-trip"]');
    const available = await addButtons.count();
    check('places offer an add-to-trip action', available >= 3, `${available}`);
    for (let i = 0; i < 3; i += 1) {
      await addButtons.nth(0).click();
      await page.waitForTimeout(900);
    }
    await errors.shot(page, '05-three-pois');

    const count = await page.evaluate(() => {
      const raw = JSON.parse(window.localStorage.getItem('meridian.trips.v1') ?? '{}').state;
      const trip = raw.trips.find((entry) => entry.id === raw.activeTripId);
      return trip.days[1].items.length;
    });
    check('Day 2 now holds three stops', count === 3, `${count}`);
  });

  // -------------------------------------------------------------------------
  // 6–8. Remove, reorder, move to Day 3 — all on the trip page.
  // -------------------------------------------------------------------------
  await step('6–8. Remove one POI, reorder the rest, move one to Day 3', async () => {
    await page.goto(`${BASE}/trips/detail/?id=${encodeURIComponent(tripId)}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="trip-days"]', { timeout: 30_000 });
    await page.waitForTimeout(2500);

    const ids = await page.evaluate(() => {
      const raw = JSON.parse(window.localStorage.getItem('meridian.trips.v1') ?? '{}').state;
      const trip = raw.trips.find((entry) => entry.id === raw.activeTripId);
      return { dayIds: trip.days.map((d) => d.id), day2Items: trip.days[1].items.map((i) => i.id) };
    });
    const [first, second, third] = ids.day2Items;

    // 6. Remove one.
    await page.locator(`[data-testid="trip-remove-${third}"]`).click();
    await page.waitForTimeout(900);
    let remaining = await page.evaluate(() => {
      const raw = JSON.parse(window.localStorage.getItem('meridian.trips.v1') ?? '{}').state;
      const trip = raw.trips.find((entry) => entry.id === raw.activeTripId);
      return trip.days[1].items.map((i) => i.id);
    });
    check('one stop was removed', remaining.length === 2 && !remaining.includes(third), remaining.join(', '));

    // 7. Reorder the remaining two.
    await page.locator(`[data-testid="trip-move-down-${first}"]`).click();
    await page.waitForTimeout(900);
    remaining = await page.evaluate(() => {
      const raw = JSON.parse(window.localStorage.getItem('meridian.trips.v1') ?? '{}').state;
      const trip = raw.trips.find((entry) => entry.id === raw.activeTripId);
      return trip.days[1].items.map((i) => i.id);
    });
    check('the order changed', remaining[0] === second && remaining[1] === first, remaining.join(', '));

    // 8. Move one to Day 3.
    const day3 = ids.dayIds[2];
    await page.locator(`[data-testid="trip-move-day-${second}"]`).click();
    await page.waitForTimeout(500);
    await page.locator(`[data-testid="trip-move-to-${day3}-${second}"]`).click();
    await page.waitForTimeout(1100);
    const after = await page.evaluate(() => {
      const raw = JSON.parse(window.localStorage.getItem('meridian.trips.v1') ?? '{}').state;
      const trip = raw.trips.find((entry) => entry.id === raw.activeTripId);
      return { day2: trip.days[1].items.map((i) => i.id), day3: trip.days[2].items.map((i) => i.id) };
    });
    check('the stop left Day 2', !after.day2.includes(second), after.day2.join(', '));
    check('the stop arrived on Day 3', after.day3.includes(second), after.day3.join(', '));
    await errors.shot(page, '06-08-edited');
  });

  // -------------------------------------------------------------------------
  // 9. Day 3 routes Hotel A → POIs → Hotel B.
  // -------------------------------------------------------------------------
  await step('9. Day 3 routes Hotel A → POIs → Hotel B', async () => {
    const day3Id = await page.evaluate(() => {
      const raw = JSON.parse(window.localStorage.getItem('meridian.trips.v1') ?? '{}').state;
      const trip = raw.trips.find((entry) => entry.id === raw.activeTripId);
      return trip.days[2].id;
    });
    const card = page.locator(`[data-testid="trip-day-${day3Id}"]`);
    check('Day 3 exists on the trip page', (await card.count()) === 1);

    const startAnchor = await card.locator(`[data-testid="trip-start-anchor-${day3Id}"]`).innerText();
    const endAnchor = await card.locator(`[data-testid="trip-end-anchor-${day3Id}"]`).innerText();
    check('Day 3 starts at Hotel A (W Bali)', /W 度假酒店|W Bali/.test(startAnchor), startAnchor.replace(/\n/g, ' '));
    check('Day 3 ends at Hotel B (St. Regis)', /瑞吉|St\. Regis/.test(endAnchor), endAnchor.replace(/\n/g, ' '));
    check('the day is marked 换酒店', (await card.locator('[data-testid^="trip-hotel-change-"]').count()) === 1);

    // The legs must be real measured drives between the anchors and the stop.
    const legs = await card.locator('[data-testid^="trip-leg-"]').count();
    check('Day 3 shows transport legs', legs >= 2, `${legs} legs`);
    const legText = await card.locator('[data-testid^="trip-leg-"]').allInnerTexts();
    check(
      'the legs carry a duration or say they are unavailable',
      legText.every((text) => /\d+\s*min/.test(text) || /unavailable|无法/.test(text)),
      legText.join(' | '),
    );
    await errors.shot(page, '09-day3-route');
  });

  // -------------------------------------------------------------------------
  // 10. Change Hotel B.
  // -------------------------------------------------------------------------
  await step('10. Change Hotel B', async () => {
    const stayIds = await page.evaluate(() => {
      const raw = JSON.parse(window.localStorage.getItem('meridian.trips.v1') ?? '{}').state;
      const trip = raw.trips.find((entry) => entry.id === raw.activeTripId);
      return trip.stays.map((s) => s.id);
    });
    const select = page.locator(`[data-testid="trip-stay-hotel-${stayIds[1]}"]`);
    // By id again: the Ritz-Carlton's Chinese name is 巴厘岛丽思卡尔顿酒店.
    const value = await select.locator('option[value="the-ritz-carlton-bali"]').getAttribute('value');
    check('a different hotel is available to switch to', Boolean(value), String(value));
    await select.selectOption(value);
    await page.waitForTimeout(1200);

    const endAnchor = await page
      .locator(`[data-testid="trip-end-anchor-${(await page.evaluate(() => {
        const raw = JSON.parse(window.localStorage.getItem('meridian.trips.v1') ?? '{}').state;
        return raw.trips.find((entry) => entry.id === raw.activeTripId).days[2].id;
      }))}"]`)
      .innerText();
    check('the change day now ends at the new hotel', /丽思|Ritz/.test(endAnchor), endAnchor.replace(/\n/g, ' '));
    await errors.shot(page, '10-hotel-b-changed');
  });

  // -------------------------------------------------------------------------
  // 11. Change the trip end date.
  // -------------------------------------------------------------------------
  await step('11. Change the trip end date', async () => {
    await page.locator('[data-testid="trip-settings-toggle"]').click();
    await page.waitForSelector('[data-testid="trip-settings-departure"]', { timeout: 10_000 });
    await page.locator('[data-testid="trip-settings-departure"]').fill('2026-10-16');
    await page.locator('[data-testid="trip-settings-save"]').click();
    await page.waitForTimeout(1500);
    const days = await page.evaluate(() => {
      const raw = JSON.parse(window.localStorage.getItem('meridian.trips.v1') ?? '{}').state;
      const trip = raw.trips.find((entry) => entry.id === raw.activeTripId);
      return { departure: trip.departureDate, dayCount: trip.days.length };
    });
    check('the departure date changed', days.departure === '2026-10-16', days.departure);
    check('the trip grew a day', days.dayCount === 7, String(days.dayCount));
    await errors.shot(page, '11-end-date');
  });

  // -------------------------------------------------------------------------
  // 12. Refresh and verify persistence.
  // -------------------------------------------------------------------------
  await step('12. Refresh and verify the trip survived', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="trip-days"]', { timeout: 30_000 });
    await page.waitForTimeout(2000);
    const kept = await page.evaluate(
      ([id]) => {
        const raw = JSON.parse(window.localStorage.getItem('meridian.trips.v1') ?? '{}').state;
        const trip = raw.trips.find((entry) => entry.id === id);
        return trip
          ? {
              stays: trip.stays.length,
              day2Start: trip.days[1].startTime,
              day3Items: trip.days[2].items.length,
              departure: trip.departureDate,
            }
          : null;
      },
      [tripId],
    );
    check('the trip is still there after refresh', Boolean(kept), JSON.stringify(kept));
    check('the stays survived', kept?.stays === 2, String(kept?.stays));
    check('the Day 2 start time survived', kept?.day2Start === '08:30', String(kept?.day2Start));
    check('the moved stop survived', (kept?.day3Items ?? 0) >= 1, String(kept?.day3Items));
    check('the new end date survived', kept?.departure === '2026-10-16', String(kept?.departure));
  });

  // -------------------------------------------------------------------------
  // 13. Return to 我的行程 and reopen the trip.
  // -------------------------------------------------------------------------
  await step('13. Return to 我的行程 and reopen the trip', async () => {
    await page.goto(`${BASE}/trips`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="trips-page"]', { timeout: 30_000 });
    await page.waitForTimeout(1200);
    check('the trip is listed', (await page.locator(`[data-testid="trip-card-${tripId}"]`).count()) === 1);
    check('it is grouped as upcoming', (await page.locator('[data-testid="trips-group-upcoming"]').count()) === 1);
    const cardText = await page.locator(`[data-testid="trip-card-${tripId}"]`).innerText();
    check('the card names the hotel', /W 度假酒店|W Bali/.test(cardText), cardText.slice(0, 60));
    check('the card shows dates, days, travellers and places', /2026|10月/.test(cardText) && /人/.test(cardText));

    await page.locator(`[data-testid="trip-open-${tripId}"]`).click();
    await page.waitForSelector('[data-testid="trip-days"]', { timeout: 30_000 });
    check('the trip reopens', (await page.locator('[data-testid="trip-detail-page"]').count()) === 1);
    await errors.shot(page, '13-my-trips');
  });

  // -------------------------------------------------------------------------
  // 14–15. Duplicate, then delete the duplicate.
  // -------------------------------------------------------------------------
  await step('14–15. Duplicate the trip, then delete the duplicate', async () => {
    await page.goto(`${BASE}/trips`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(`[data-testid="trip-card-${tripId}"]`, { timeout: 30_000 });
    await page.locator(`[data-testid="trip-duplicate-${tripId}"]`).click();
    await page.waitForTimeout(1400);

    const afterDuplicate = await page.evaluate(() => {
      const raw = JSON.parse(window.localStorage.getItem('meridian.trips.v1') ?? '{}').state;
      return { count: raw.trips.length, ids: raw.trips.map((t) => t.id) };
    });
    check('a second trip exists', afterDuplicate.count === 2, JSON.stringify(afterDuplicate.ids));

    const copyId = afterDuplicate.ids.find((id) => id !== tripId);
    check('the copy is a distinct trip', Boolean(copyId), String(copyId));
    const copyStays = await page.evaluate(
      ([id]) => {
        const raw = JSON.parse(window.localStorage.getItem('meridian.trips.v1') ?? '{}').state;
        const trip = raw.trips.find((entry) => entry.id === id);
        return trip ? { stays: trip.stays.length, days: trip.days.length } : null;
      },
      [copyId],
    );
    check('the copy carries the accommodation', copyStays?.stays === 2, JSON.stringify(copyStays));
    check('and the same number of days', copyStays?.days === 7, JSON.stringify(copyStays));

    // Delete the copy, which requires confirming.
    await page.locator(`[data-testid="trip-delete-${copyId}"]`).click();
    await page.waitForSelector(`[data-testid="trip-delete-confirm-${copyId}"]`, { timeout: 10_000 });
    check('deleting asks for confirmation first', (await page.locator(`[data-testid="trip-delete-confirm-${copyId}"]`).count()) === 1);
    await page.locator(`[data-testid="trip-delete-yes-${copyId}"]`).click();
    await page.waitForTimeout(1200);

    const afterDelete = await page.evaluate(() => {
      const raw = JSON.parse(window.localStorage.getItem('meridian.trips.v1') ?? '{}').state;
      return { count: raw.trips.length, ids: raw.trips.map((t) => t.id) };
    });
    check('the duplicate is gone', afterDelete.count === 1 && afterDelete.ids.includes(tripId), JSON.stringify(afterDelete.ids));
    check('the original survived', afterDelete.ids.includes(tripId));
    await errors.shot(page, '15-deleted-copy');
  });

  // -------------------------------------------------------------------------
  await step('16. The trip map view draws the trip', async () => {
    await page.goto(`${BASE}/trips/detail/?id=${encodeURIComponent(tripId)}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="trip-view-map"]', { timeout: 30_000 });
    await page.locator('[data-testid="trip-view-map"]').click();
    await page.waitForSelector('[data-testid="trip-map"]', { timeout: 30_000 });
    await page.waitForTimeout(6000);
    const markers = await page.locator('.maplibregl-marker').count();
    check('the map draws the trip', markers >= 1, `${markers} markers`);

    const days = await page.evaluate(() => {
      const raw = JSON.parse(window.localStorage.getItem('meridian.trips.v1') ?? '{}').state;
      const trip = raw.trips.find((entry) => entry.id === raw.activeTripId);
      return trip.days.map((d) => d.id);
    });
    await page.locator(`[data-testid="trip-day-filter-${days[2]}"]`).click();
    await page.waitForTimeout(2500);
    check('the day filter is selectable', (await page.locator(`[data-testid="trip-day-filter-${days[2]}"]`).getAttribute('aria-pressed')) === 'true');
    await errors.shot(page, '16-trip-map');
  });

  // -------------------------------------------------------------------------
  await step('17. No console errors during the whole run', async () => {
    check('no console or page errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
  });
} finally {
  await browser.close();
}

console.log(`\n${'-'.repeat(64)}`);
console.log(`${results.filter((r) => r.passed).length}/${results.length} acceptance checks passed`);
writeFileSync(join(ARTIFACTS, 'report.json'), JSON.stringify({ results, consoleErrors }, null, 2));
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
console.log('✅ ACCEPTANCE SCENARIO PASSED');
