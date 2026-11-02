// Renders the shop's pictures into public/skins/, for every skin, theme and device.
// Needs the dev server: `npm run dev`, then `npm run skins:previews` (another address: `... -- http://localhost:3001`).
// Run it again after adding or changing a skin; a test fails while a picture is missing.
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';

const BASE = process.argv[2] ?? 'http://localhost:3000';
const OUT = path.resolve('public/skins');
const DEVICES = { desktop: { width: 1440, height: 1000 }, phone: { width: 390, height: 844 } };
const THEMES = ['light', 'dark'];

/** Playwright's own Chromium if it's there, otherwise the Chrome installed on this computer. */
function browserOptions() {
  const roots = [path.join(os.homedir(), 'AppData/Local/ms-playwright'), path.join(os.homedir(), '.cache/ms-playwright'), path.join(os.homedir(), 'Library/Caches/ms-playwright')];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    const newest = readdirSync(root).filter(d => /^chromium-\d+$/.test(d)).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))[0];
    if (!newest) continue;
    for (const exe of ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe', 'chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
      const file = path.join(root, newest, exe);
      if (existsSync(file)) return { executablePath: file };
    }
  }
  return { channel: 'chrome' };
}

/** Screenshots come as PNG; the browser turns them into much smaller WebP. */
const toWebp = (page, png) =>
  page.evaluate(async b64 => {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const c = document.createElement('canvas');
    c.width = bitmap.width;
    c.height = bitmap.height;
    c.getContext('2d').drawImage(bitmap, 0, 0);
    const blob = await new Promise(r => c.toBlob(r, 'image/webp', 0.82));
    return btoa(String.fromCharCode(...new Uint8Array(await blob.arrayBuffer())));
  }, png.toString('base64'));

try {
  await fetch(BASE);
} catch {
  console.error(`Нет сервера на ${BASE}. Сначала запусти npm run dev.`);
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
const browser = await chromium.launch({ ...browserOptions(), args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
let count = 0, bytes = 0;

for (const [device, viewport] of Object.entries(DEVICES)) {
  for (const theme of THEMES) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    page.on('pageerror', e => {
      console.error(`${device}-${theme}: ${e.message}`);
      process.exitCode = 1;
    });
    await page.addInitScript(t => localStorage.setItem('nalichka:theme', JSON.stringify(t)), theme);
    await page.goto(`${BASE}/skin-render`, { waitUntil: 'load' });
    await page.waitForFunction(() => !!window.__showSkin, undefined, { timeout: 60000 });
    const items = await page.evaluate(() => window.__skinItems);
    const dir = path.join(OUT, `${device}-${theme}`);
    mkdirSync(dir, { recursive: true });

    for (const item of items) {
      await page.evaluate(i => window.__showSkin(i), item);
      await page.waitForSelector('#skin-shot');
      // Painted board and wallet are in, and every image has loaded.
      await page.waitForFunction(
        isDesktop => {
          const shot = document.getElementById('skin-shot');
          if (!shot || shot.querySelector('.animate-pulse')) return false;
          const imgs = [...shot.querySelectorAll('img')];
          if (isDesktop && imgs.filter(i => i.src.startsWith('blob:')).length < 3) return false;
          return imgs.every(i => i.complete && i.naturalWidth > 0);
        },
        device === 'desktop',
        { timeout: 60000 },
      );
      await page.waitForTimeout(120);
      const png = await page.locator('#skin-shot').screenshot({ type: 'png' });
      const file = path.join(dir, `${item.part}-${item.id}.webp`);
      writeFileSync(file, Buffer.from(await toWebp(page, png), 'base64'));
      count++;
      bytes += statSync(file).size;
    }
    console.log(`${device}-${theme}: ${items.length}`);
    await ctx.close();
  }
}
await browser.close();
console.log(`Готово: ${count} картинок, ${(bytes / 1024 / 1024).toFixed(1)} МБ`);
