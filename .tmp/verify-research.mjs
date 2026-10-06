import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
import { join } from 'node:path';
const CHROME = join(homedir(), 'Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1512, height: 1200 }, deviceScaleFactor: 2 });
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message.slice(0, 160)));
page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 160)); });

await page.goto('http://127.0.0.1:3000/research', { waitUntil: 'domcontentloaded', timeout: 240000 });
await page.waitForSelector('[data-testid="research-add"]', { timeout: 120000 });
await page.waitForTimeout(3000);
console.log('标题:', (await page.locator('h1').innerText()));
console.log('空状态:', (await page.locator('main').innerText()).includes('还没有添加攻略') ? '中文空状态 ✓' : '??');

// 1. 粘贴链接 + 示例文本
await page.locator('[data-testid="research-url"]').fill('https://www.xiaohongshu.com/explore/abc123');
await page.waitForTimeout(800);
const detected = await page.locator('main').innerText();
console.log('平台识别:', /识别为\s*小红书/.test(detected) ? '小红书 ✓' : '未识别');
await page.locator('[data-testid="research-sample"]').click();
await page.locator('[data-testid="research-notes"]').fill('测试用攻略，验证解析流程');
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/zh-research-form.png' });

// 2. 解析
await page.locator('[data-testid="research-add"]').click();
await page.waitForTimeout(4000);
const sourceList = await page.locator('[data-testid="research-source-list"]').innerText();
console.log('攻略列表:', sourceList.slice(0, 120).replace(/\n/g, ' | '));

const mentionCount = await page.locator('[data-testid^="research-mention-"]').count();
console.log('解析出提及:', mentionCount, '处');
const mentions = await page.locator('[data-testid^="research-mention-"]').allInnerTexts();
for (const m of mentions.slice(0, 8)) console.log('   ', m.split('\n').slice(0, 4).join(' | '));
await page.screenshot({ path: '/tmp/zh-research-inbox.png', fullPage: true });

// 3. 收录第一条 → 产生社交信号
const accept = page.locator('[data-testid^="research-accept-"]').first();
if (await accept.count()) {
  await accept.click();
  await page.waitForTimeout(1500);
  console.log('已收录 1 条');
}
// 多收几条
for (let i = 0; i < 3; i += 1) {
  const a = page.locator('[data-testid^="research-accept-"]').first();
  if (await a.count()) { await a.click(); await page.waitForTimeout(900); }
}
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/zh-research-accepted.png', fullPage: true });

// 4. 回到 DO 看看卡片上的攻略参考
await page.goto('http://127.0.0.1:3000/destination/bali', { waitUntil: 'domcontentloaded', timeout: 240000 });
await page.waitForSelector('.maplibregl-canvas', { timeout: 180000 });
await page.waitForTimeout(10000);
await page.locator('[data-testid="dest-tab-do"]').click();
await page.waitForTimeout(5000);
const socials = await page.locator('[data-testid^="place-social-"]').count();
console.log('DO 卡片带攻略参考:', socials);
if (socials > 0) {
  const txt = await page.locator('[data-testid^="place-social-"]').first().innerText();
  console.log('信号内容:', txt.replace(/\n/g, ' | ').slice(0, 200));
  await page.screenshot({ path: '/tmp/zh-social-on-card.png' });
}

console.log('错误:', errs.length ? errs.slice(0, 3).join(' | ') : '无');
await browser.close();
