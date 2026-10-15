// portrait phone, landscape phone and desktop: the screen should be as large as possible and the buttons stay on screen
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const { OUT } = require('./lib');
(async () => {
  const pre = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  let browser; try { browser = await chromium.launch(); } catch (e) { browser = await chromium.launch({ executablePath: pre }); }
  let bad = 0;
  for (const [name, o] of [['portrait', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }], ['landscape', { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }], ['desktop', { viewport: { width: 1280, height: 900 } }]]) {
    const page = await browser.newPage(o);
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForFunction(() => window.__nm && window.__nm.G.scene);
    await page.evaluate(() => { const N = __nm; N.setSeed(4); N.newGame(); N.G.scene = N.Dungeon; N.enterFloor(1); });
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const box = id => { const e = document.getElementById(id); if (!e) return null; const b = e.getBoundingClientRect(); return b.width ? { x: b.x, y: b.y, w: b.width, h: b.height } : null; };
      return { vw: innerWidth, vh: innerHeight, screen: box('screen'), a: box('btnA'), b: box('btnB'), m: box('menuBtn') };
    });
    const inside = b => !b || (b.x >= 0 && b.y >= 0 && b.x + b.w <= r.vw + 0.5 && b.y + b.h <= r.vh + 0.5);
    const ok = inside(r.screen) && inside(r.a) && inside(r.b) && inside(r.m);
    console.log(name, ok ? 'OK' : 'NG', `screen ${Math.round(r.screen.w)}x${Math.round(r.screen.h)} in ${r.vw}x${r.vh}`);
    if (!ok) { bad++; console.log(JSON.stringify(r)); }
    await page.screenshot({ path: `${OUT}/layout-${name}.png` });
    await page.close();
  }
  await browser.close(); if (bad) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
