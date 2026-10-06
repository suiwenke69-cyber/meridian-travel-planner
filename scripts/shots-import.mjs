/**
 * Visual walkthrough of the social guide import flow.
 *
 * Drives the real browser through the whole promise — paste a guide, confirm
 * the places, keep them, see them on the map — and screenshots each state so the
 * result can be looked at rather than inferred from a DOM assertion.
 *
 * Usage: npm run dev, then `node scripts/shots-import.mjs`
 */

import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';
const OUT = join(process.cwd(), 'test-artifacts', 'import');
const CHROME =
  process.env.CHROME_PATH ??
  join(
    homedir(),
    'Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  );

mkdirSync(OUT, { recursive: true });

const GUIDE = `巴厘岛第三天我们去了乌鲁瓦图神庙，建议下午四点多到，然后去附近看日落。第二天在长谷吃了 Milk & Madu，早餐很好。晚上去了 La Brisa，氛围很好但周末人特别多，必点：烤章鱼。`;

const errors = [];
const browser = await chromium.launch({ executablePath: CHROME });

async function shot(page, name) {
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: false });
  console.log(`  shot: ${name}`);
}

for (const viewport of [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'mobile', width: 390, height: 844 },
]) {
  console.log(`\n=== ${viewport.label} ===`);
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
  });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`[${viewport.label}] ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`[${viewport.label}] ${error.message}`));

  await page.goto(`${BASE}/destination/bali`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="import-guide-entry"]', { timeout: 20000 });
  await page.waitForTimeout(2500);
  await shot(page, `${viewport.label}-0-destination`);

  // Entry
  await page.click('[data-testid="import-guide-entry"]');
  await page.waitForSelector('[data-testid="import-panel"][data-step="input"]', { timeout: 10000 });
  await page.waitForTimeout(400);
  await shot(page, `${viewport.label}-1-input`);

  // A link only, to show the honest platform note.
  await page.fill('[data-testid="import-url"]', 'https://www.xiaohongshu.com/explore/65f0a1b2c3');
  await page.waitForTimeout(300);
  await shot(page, `${viewport.label}-2-link`);

  // Paste the guide and run it.
  await page.fill('[data-testid="import-text"]', GUIDE);
  await page.waitForTimeout(300);
  await page.click('[data-testid="import-start"]');
  await page.waitForSelector('[data-testid="import-panel"][data-step="processing"]', { timeout: 8000 }).catch(() => {});
  await shot(page, `${viewport.label}-3-processing`);

  await page.waitForSelector('[data-testid="import-panel"][data-step="review"]', { timeout: 25000 });
  await page.waitForTimeout(2200);
  await shot(page, `${viewport.label}-4-review`);

  // Expand the unmatched candidate's resolver.
  const unmatched = page.locator('[data-testid^="import-mention-"]').filter({ has: page.locator('[data-testid^="import-mention-search-"]') }).first();
  if (await unmatched.count()) {
    const searchButton = unmatched.locator('[data-testid^="import-mention-search-"]');
    await searchButton.click();
    await page.waitForTimeout(700);
    await shot(page, `${viewport.label}-5-resolver`);
    await page.keyboard.press('Escape').catch(() => {});
    const close = unmatched.locator('button[aria-label]').last();
    await close.click().catch(() => {});
    await page.waitForTimeout(300);
  }

  // Save what is ticked.
  await page.click('[data-testid="import-save"]');
  await page.waitForSelector('[data-testid="import-panel"][data-step="done"]', { timeout: 15000 });
  await page.waitForTimeout(800);
  await shot(page, `${viewport.label}-6-done`);

  // Into 我的收藏, on the map.
  await page.click('[data-testid="import-view-saved"]');
  await page.waitForSelector('[data-testid="saved-list"]', { timeout: 10000 });
  await page.waitForTimeout(2800);
  await shot(page, `${viewport.label}-7-saved`);

  // Filter inside 我的收藏.
  const foodFilter = page.locator('[data-testid="saved-filter-food"]');
  if (await foodFilter.count()) {
    await foodFilter.click();
    await page.waitForTimeout(600);
    await shot(page, `${viewport.label}-8-saved-filter`);
  }

  // The PLAN entry point.
  await page.click('[data-testid="dest-tab-plan"]');
  await page.waitForTimeout(1200);
  await shot(page, `${viewport.label}-9-plan`);

  await context.close();
}

// Error state: a link with nothing pasted.
console.log('\n=== error state ===');
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(`[error] ${error.message}`));
  await page.goto(`${BASE}/destination/bali`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="import-guide-entry"]', { timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.click('[data-testid="import-guide-entry"]');
  await page.fill('[data-testid="import-url"]', 'https://www.xiaohongshu.com/explore/deadbeef');
  await page.click('[data-testid="import-start"]');
  await page.waitForSelector('[data-testid="import-error"]', { timeout: 20000 });
  await page.waitForTimeout(500);
  await shot(page, 'desktop-10-error');
  await context.close();
}

await browser.close();

console.log(`\nconsole/page errors: ${errors.length}`);
for (const error of errors.slice(0, 20)) console.log(`  ${error}`);
console.log(`\nscreenshots in ${OUT}`);
