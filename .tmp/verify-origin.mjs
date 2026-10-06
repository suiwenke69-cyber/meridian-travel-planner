import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
import { join } from 'node:path';
const CHROME = join(homedir(), 'Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1512, height: 945 }, deviceScaleFactor: 2 });
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message.slice(0, 160)));
page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 160)); });

await page.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded', timeout: 240000 });
await page.waitForSelector('.maplibregl-canvas', { timeout: 180000 });
await page.waitForTimeout(11000);

console.log('默认出发地:', await page.locator('[data-testid="origin-current-city"]').innerText(), '/', await page.locator('[data-testid="origin-current-codes"]').innerText());
await page.screenshot({ path: '/tmp/origin-default.png' });

// 打开选择器
await page.locator('[data-testid="origin-trigger"]').click();
await page.waitForTimeout(1200);
const visible = await page.locator('[data-testid="origin-panel"]').isVisible();
console.log('选择器打开:', visible);
const regions = await page.locator('[data-testid="origin-panel"] .label-caps').allInnerTexts();
console.log('分组:', regions.join(' / '));
await page.screenshot({ path: '/tmp/origin-panel.png' });

// 搜索测试：中文 / 英文 / 机场代码
for (const q of ['广州', 'Guangzhou', 'CAN', 'SHA', 'Bangkok']) {
  await page.locator('[data-testid="origin-search"]').fill(q);
  await page.waitForTimeout(600);
  const opts = await page.locator('[data-testid^="origin-option-"]').allInnerTexts();
  console.log(`  搜索 "${q}" -> ${opts.length} 个: ${opts.map((o) => o.split('\n')[0]).join(', ')}`);
}
await page.locator('[data-testid="origin-search"]').fill('');
await page.waitForTimeout(600);
await page.locator('[data-testid="origin-option-guangzhou"]').click();
await page.waitForTimeout(9000);
console.log('切换后:', await page.locator('[data-testid="origin-current-city"]').innerText(), '/', await page.locator('[data-testid="origin-current-codes"]').innerText());
await page.screenshot({ path: '/tmp/origin-guangzhou.png' });

// 目的地卡片应当变化
await page.locator('[data-testid="destination-dot"]').first().click({ force: true }).catch(() => {});
await page.waitForTimeout(2000);
const preview = await page.locator('[data-testid="destination-preview"]').count();
console.log('预览卡:', preview);
console.log('错误:', errs.length ? errs.slice(0, 4).join(' | ') : '无');
await browser.close();
