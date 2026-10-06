import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
import { join } from 'node:path';
const CHROME = join(homedir(), 'Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [], failed = [];
page.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 120)); });
page.on('requestfailed', (r) => failed.push(r.url().replace('http://127.0.0.1:4173', '') + ' :: ' + (r.failure()?.errorText ?? '')));

await page.goto('http://127.0.0.1:4173/destination/bali/', { waitUntil: 'domcontentloaded', timeout: 120_000 });
await page.waitForSelector('.maplibregl-canvas', { timeout: 120_000 });
await page.waitForTimeout(12_000);
const tabs = await page.locator('[data-testid^="dest-tab-"]').count();
await page.screenshot({ path: '/tmp/static-explore.png' });

await page.locator('[data-testid="dest-tab-stay"]').click();
await page.waitForTimeout(7000);
const hotels = await page.locator('[data-testid^="hotel-card-"]').count();
await page.locator('[data-testid="dest-tab-do"]').click();
await page.waitForTimeout(7000);
const places = await page.locator('[data-testid^="place-card-"]').count();
const broken = await page.evaluate(() => Array.from(document.images).filter((i) => i.complete && i.naturalWidth === 0).length);
const canvasBlank = await page.evaluate(() => {
  const c = document.querySelector('.maplibregl-canvas');
  return c ? c.width === 0 || c.height === 0 : true;
});
console.log(`标签页=${tabs} 酒店卡=${hotels} 地点卡=${places} 坏图=${broken} canvas为空=${canvasBlank}`);
console.log('page/console 错误:', errs.length ? errs.slice(0,3).join(' | ') : '无');
console.log('失败请求:', failed.length ? failed.slice(0,5).join(' | ') : '无');
await browser.close();
