/**
 * Visual walkthrough of the Xiaohongshu import flow.
 *
 * Drives the real browser through the whole promise — paste a Xiaohongshu guide,
 * add its screenshots, confirm the places, assign pictures to them, keep them,
 * and see them on the map — and screenshots each state so the result can be
 * looked at rather than inferred from a DOM assertion.
 *
 * Usage: npm run dev, then `node scripts/shots-xhs.mjs`
 */

import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';
const OUT = join(process.cwd(), 'test-artifacts', 'xhs');
const CHROME =
  process.env.CHROME_PATH ??
  join(
    homedir(),
    'Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  );

mkdirSync(OUT, { recursive: true });

/** A real PNG, so the canvas path (downscale, re-encode, hash) actually runs. */
function makePng(size, hue = [30, 120, 200]) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 3 + 1);
    for (let x = 0; x < size; x += 1) {
      const px = row + 1 + x * 3;
      raw[px] = (hue[0] + x * 2) % 256;
      raw[px + 1] = (hue[1] + y) % 256;
      raw[px + 2] = (hue[2] - x) % 256;
    }
  }
  const table = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  const crc32 = (buf) => {
    let c = 0xffffffff;
    for (const byte of buf) c = table[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

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
  await page.waitForSelector('[data-testid="import-guide-entry"]', { timeout: 30000 });
  await page.waitForTimeout(2500);
  await shot(page, `${viewport.label}-0-destination`);

  await page.click('[data-testid="import-guide-entry"]');
  await page.waitForSelector('[data-testid="import-panel"][data-step="input"]', { timeout: 15000 });
  await page.waitForTimeout(500);
  await shot(page, `${viewport.label}-1-input-empty`);

  // A link from another platform, refused by name.
  await page.fill('[data-testid="import-url"]', 'https://www.tiktok.com/@someone/video/123');
  await page.waitForTimeout(400);
  await shot(page, `${viewport.label}-2-foreign-link`);

  // A real Xiaohongshu link plus screenshots.
  await page.fill('[data-testid="import-url"]', 'https://www.xiaohongshu.com/explore/65f0a1b2c3d4e5f6a7b8c9d0');
  await page.locator('[data-testid="import-file-input"]').setInputFiles([
    { name: 'a.png', mimeType: 'image/png', buffer: makePng(120, [200, 80, 60]) },
    { name: 'b.png', mimeType: 'image/png', buffer: makePng(140, [40, 160, 90]) },
    { name: 'c.png', mimeType: 'image/png', buffer: makePng(110, [60, 90, 210]) },
    { name: 'd.png', mimeType: 'image/png', buffer: makePng(130, [210, 180, 40]) },
    { name: 'e.png', mimeType: 'image/png', buffer: makePng(100, [120, 60, 200]) },
  ]);
  await page.waitForTimeout(4500);
  await page.fill('[data-testid="import-text"]', GUIDE);
  await page.waitForTimeout(400);
  await shot(page, `${viewport.label}-3-input-filled`);

  await page.click('[data-testid="import-start"]');
  await page.waitForTimeout(600);
  await shot(page, `${viewport.label}-4-processing`);

  await page.waitForSelector('[data-testid="import-panel"][data-step="review"]', { timeout: 90000 });
  await page.waitForTimeout(3500);
  await shot(page, `${viewport.label}-5-review`);

  // Scroll to the tray at the bottom of the review.
  await page.locator('[data-testid="import-unassigned"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await shot(page, `${viewport.label}-6-unassigned-tray`);

  // Ask what an unplaced picture is.
  const trayImage = page.locator('[data-testid="import-unassigned"] [data-testid^="import-image-"]').first();
  if (await trayImage.count()) {
    await trayImage.click();
    await page.waitForTimeout(900);
    await shot(page, `${viewport.label}-7-image-question`);
    const dismiss = page.locator('[data-testid^="import-question-"]').first().locator('button[aria-label]').last();
    await dismiss.click().catch(() => {});
    await page.waitForTimeout(500);
  }

  // Manual image assignment on a card.
  const card = page.locator('[data-testid^="import-candidate-"]').filter({ has: page.locator('[data-testid^="import-candidate-name-"]') }).first();
  const cardId = (await card.getAttribute('data-testid'))?.replace('import-candidate-', '');
  if (cardId) {
    await page.locator(`[data-testid="import-candidate-addimage-${cardId}"]`).click();
    await page.waitForTimeout(800);
    await shot(page, `${viewport.label}-8-image-assign`);
    const pickable = page.locator(`[data-testid="import-assign-${cardId}"] [data-testid^="import-image-"]`);
    if (await pickable.count()) {
      await pickable.first().click();
      await page.waitForTimeout(200);
      if ((await pickable.count()) > 1) await pickable.nth(1).click();
      await page.waitForTimeout(300);
      await page.locator(`[data-testid="import-assign-apply-${cardId}"]`).click();
      await page.waitForTimeout(1500);
      await shot(page, `${viewport.label}-9-card-with-images`);
    }
  }

  // Save and land in 我的收藏.
  await page.locator('[data-testid="import-panel"] .scroll-area').evaluate((el) => {
    el.scrollTop = 0;
  });
  await page.waitForTimeout(600);
  await page.click('[data-testid="import-save"]');
  await page.waitForSelector('[data-testid="import-panel"][data-step="done"]', { timeout: 30000 });
  await page.waitForTimeout(800);
  await shot(page, `${viewport.label}-10-done`);

  await page.click('[data-testid="import-view-saved"]');
  await page.waitForSelector('[data-testid="saved-list"]', { timeout: 20000 });
  await page.waitForTimeout(3500);
  await shot(page, `${viewport.label}-11-saved`);

  await context.close();
}

// Unreadable link fallback.
console.log('\n=== fallback ===');
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(`[fallback] ${error.message}`));
  await page.goto(`${BASE}/destination/bali`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="import-guide-entry"]', { timeout: 30000 });
  await page.waitForTimeout(2500);
  await page.click('[data-testid="import-guide-entry"]');
  await page.fill('[data-testid="import-url"]', 'https://www.xiaohongshu.com/explore/deadbeefdeadbeef');
  await page.click('[data-testid="import-start"]');
  await page.waitForSelector('[data-testid="import-error"]', { timeout: 30000 });
  await page.waitForTimeout(600);
  await shot(page, 'desktop-12-fallback');
  await context.close();
}

await browser.close();

console.log(`\nconsole/page errors: ${errors.length}`);
for (const error of errors.slice(0, 20)) console.log(`  ${error}`);
console.log(`\nscreenshots in ${OUT}`);
