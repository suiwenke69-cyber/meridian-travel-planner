import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
import { join } from 'node:path';
const CHROME = join(homedir(), 'Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1512, height: 945 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message.slice(0, 150)));
page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 150)); });

await page.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded', timeout: 240000 });
await page.waitForSelector('.maplibregl-canvas', { timeout: 180000 });
await page.waitForTimeout(10000);

// 逐个选择所有 origin，记录关键状态
const cities = ['guangzhou','shenzhen','hong-kong','shanghai','hangzhou','beijing','chengdu','bangkok','kuala-lumpur','jakarta','singapore'];
const seen = [];
for (const city of cities) {
  await page.locator('[data-testid="origin-trigger"]').first().click();
  await page.waitForTimeout(700);
  await page.locator(`[data-testid="origin-trigger-option-${city}"]`).click();
  await page.waitForTimeout(7000);
  const name = await page.locator('[data-testid="origin-trigger-city"]').innerText();
  const codes = await page.locator('[data-testid="origin-trigger-codes"]').innerText();
  const baliRow = await page.locator('[data-testid="destination-rail"] button', { hasText: '巴厘岛' }).first().innerText().catch(() => '');
  const unknownRows = await page.locator('[data-testid="destination-rail"]').innerText();
  const unknownCount = (unknownRows.match(/航班信息待确认/g) ?? []).length;
  seen.push({ city, name, codes, bali: baliRow.replace(/\n/g, ' '), unknownCount });
  console.log(`${name.padEnd(5)} ${codes.padEnd(12)} 巴厘岛: ${baliRow.split('\n').join(' ').slice(0, 34).padEnd(36)} 未知航线: ${unknownCount}`);
}
await page.screenshot({ path: '/tmp/origin-singapore-back.png' });

// 持久化：刷新后还在吗（当前是 singapore，换成上海再刷新）
await page.locator('[data-testid="origin-trigger"]').first().click();
await page.waitForTimeout(700);
await page.locator('[data-testid="origin-trigger-option-shanghai"]').click();
await page.waitForTimeout(5000);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('.maplibregl-canvas', { timeout: 120000 });
await page.waitForTimeout(9000);
console.log('刷新后出发地:', await page.locator('[data-testid="origin-trigger-city"]').innerText(), '/', await page.locator('[data-testid="origin-trigger-codes"]').innerText());

// 预览卡内容随 origin 变化
await page.locator('[data-testid="destination-rail"] button', { hasText: '巴厘岛' }).first().click();
await page.waitForTimeout(4000);
const pv = await page.locator('[data-testid="destination-preview"]').innerText();
const routeSection = await page.locator('[data-testid="preview-route"]').innerText();
console.log('预览卡航线段:', routeSection.replace(/\n/g, ' | ').slice(0, 140));
console.log('preview data-origin:', await page.locator('[data-testid="preview-route"]').getAttribute('data-origin'), '| confidence:', await page.locator('[data-testid="preview-route"]').getAttribute('data-confidence'));
await page.screenshot({ path: '/tmp/origin-preview-shanghai.png' });

// Bali 仍然可用
await page.goto('http://127.0.0.1:3000/destination/bali', { waitUntil: 'domcontentloaded', timeout: 180000 });
await page.waitForSelector('.maplibregl-canvas', { timeout: 120000 });
await page.waitForTimeout(10000);
const tabs = (await page.locator('[data-testid^="dest-tab-"]').allInnerTexts()).map((t) => t.trim());
const originOnDest = await page.locator('[data-testid="origin-trigger-city"]').count();
await page.locator('[data-testid="dest-tab-do"]').click();
await page.waitForTimeout(5000);
const places = await page.locator('[data-testid^="place-card-"]').count();
console.log(`Bali 标签页=${tabs.join('/')} 出发地控件=${originOnDest} 地点卡=${places}`);
await page.screenshot({ path: '/tmp/origin-destination.png' });

console.log('错误:', errs.length ? errs.slice(0, 4).join(' | ') : '无');
await browser.close();
