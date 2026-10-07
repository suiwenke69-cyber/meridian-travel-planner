import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';
const OUT = join(process.cwd(), 'test-artifacts', 'v13');
const CHROME = join(homedir(), 'Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });
const errors = [];
for (const [label, w, h] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'zh-CN' });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${label}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[${label}] ${e.message}`));
  for (const id of ['phu-quoc', 'hanoi', 'da-nang-hoi-an', 'cebu']) {
    await page.goto(`${BASE}/destination/${id}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForSelector('.maplibregl-canvas', { timeout: 120000 });
    await page.waitForTimeout(6000);
    await page.screenshot({ path: join(OUT, `${label}-${id}-explore.png`) });
    await page.locator('[data-testid="dest-tab-stay"]').click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: join(OUT, `${label}-${id}-stay.png`) });
    if (label === 'desktop') console.log(`  ${id}: stay filters ->`, await page.locator('[data-testid^="stay-filter-"]').allInnerTexts());
  }
  await ctx.close();
}
await browser.close();
console.log('console/page errors:', errors.length);
for (const e of errors.slice(0, 10)) console.log(' ', e);
