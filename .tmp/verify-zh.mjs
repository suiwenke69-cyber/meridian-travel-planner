import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
import { join } from 'node:path';
const CHROME = join(homedir(), 'Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1512, height: 945 }, deviceScaleFactor: 2 });
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message.slice(0, 140)));
page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 140)); });

// 1. 首页
await page.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded', timeout: 240000 });
await page.waitForSelector('.maplibregl-canvas', { timeout: 180000 });
await page.waitForTimeout(11000);
await page.screenshot({ path: '/tmp/zh-home.png' });
console.log('首页 标题:', (await page.locator('main').innerText()).slice(0, 60).replace(/\n/g, ' | '));

// 2. 目的地 EXPLORE
await page.goto('http://127.0.0.1:3000/destination/bali', { waitUntil: 'domcontentloaded', timeout: 240000 });
await page.waitForSelector('.maplibregl-canvas', { timeout: 180000 });
await page.waitForTimeout(11000);
await page.screenshot({ path: '/tmp/zh-explore.png' });
const tabs = await page.locator('[data-testid^="dest-tab-"]').allInnerTexts();
console.log('标签页:', tabs.join(' / '));
console.log('探索面板:', (await page.locator('aside').first().innerText()).slice(0, 120).replace(/\n/g, ' | '));

// 3. STAY
await page.locator('[data-testid="dest-tab-stay"]').click();
await page.waitForTimeout(6000);
await page.screenshot({ path: '/tmp/zh-stay.png' });
console.log('住宿:', (await page.locator('aside').first().innerText()).slice(0, 100).replace(/\n/g, ' | '));

// 4. DO + 美食 + 长谷
await page.locator('[data-testid="dest-tab-do"]').click();
await page.waitForTimeout(6000);
const cats = await page.locator('[data-testid="do-categories"] button').allInnerTexts();
console.log('DO 类别:', cats.map((c) => c.replace(/\n/g, '')).join(' / '));
await page.locator('[data-testid="do-category-food"]').click();
await page.waitForTimeout(4000);
const areas = await page.locator('[data-testid="do-areas"] button').allInnerTexts();
console.log('美食下的区域:', areas.map((a) => a.replace(/\n/g, '')).slice(0, 8).join(' / '));
await page.locator('[data-testid="do-area-canggu"]').click();
await page.waitForTimeout(5000);
const cards = await page.locator('[data-testid^="place-card-"]').count();
const first = await page.locator('[data-testid^="place-card-"]').first().innerText();
console.log(`美食+长谷: ${cards} 张卡片`);
console.log('首张:', first.slice(0, 160).replace(/\n/g, ' | '));
await page.screenshot({ path: '/tmp/zh-do-canggu-food.png' });

// 5. 地图与列表联动
await page.locator('[data-testid^="place-card-"]').first().hover();
await page.waitForTimeout(1500);
const emphasised = await page.locator('.mk--emphasised').count();
console.log('卡片悬停高亮标记:', emphasised);

console.log('错误:', errs.length ? errs.slice(0, 4).join(' | ') : '无');
await browser.close();
