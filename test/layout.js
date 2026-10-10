// Screen size and layout: the game screen must use as much of the display as possible and never overflow.
const { chromium } = require(process.env.PW_PATH || 'playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const errors = []; let fails = 0;
  const probe = async (name, opt, expect) => {
    const ctx = await browser.newContext(opt); const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto('file://' + path.resolve(__dirname, 'index.html')); await p.waitForFunction(() => window.__rpg && __rpg.G.scene); await p.waitForTimeout(700);
    const r = await p.evaluate(() => {
      const c = document.getElementById('screen').getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
      const btns = ['btnA', 'btnB', 'menuBtn'].map(id => { const e = document.getElementById(id).getBoundingClientRect(); return { id, vis: e.width > 0, inside: e.left >= 0 && e.right <= vw && e.top >= 0 && e.bottom <= vh }; });
      return { w: Math.round(c.width), h: Math.round(c.height), vw, vh, scale: SCALE, land: document.body.classList.contains('land'), overflowX: document.documentElement.scrollWidth > vw, btns, overlap: (() => { const a = document.getElementById('btnA').getBoundingClientRect(); return !(a.left >= c.right || a.right <= c.left || a.top >= c.bottom || a.bottom <= c.top); })() };
    });
    const ok = expect(r); if (!ok) fails++;
    console.log((ok ? 'OK    ' : 'FAILED ') + name, JSON.stringify({ w: r.w, h: r.h, scale: r.scale, land: r.land, overlap: r.overlap, overflowX: r.overflowX }));
    await ctx.close();
  };
  const phone = (w, h) => ({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
  await probe('portrait 390x844 uses the full width', phone(390, 844), r => r.w >= 372 && !r.overflowX && !r.land && r.btns.every(b => b.inside));
  await probe('portrait small 360x640', phone(360, 640), r => r.w >= 340 && !r.overflowX && r.btns.every(b => b.inside));
  await probe('landscape 844x390 fills the height', phone(844, 390), r => r.land && r.h >= 380 && r.w >= 430 && !r.overlap && r.btns.every(b => b.inside));
  await probe('landscape small 667x375', phone(667, 375), r => r.land && r.h >= 365 && !r.overlap && r.btns.every(b => b.inside));
  await probe('desktop 1280x900 renders at 4x', { viewport: { width: 1280, height: 900 } }, r => r.scale === 4 && r.w > 768);
  await probe('desktop 1000x700 stays 3x', { viewport: { width: 1000, height: 700 } }, r => r.scale === 3);
  console.log('LAYOUT:', fails ? 'FAILED' : 'OK'); console.log('ERRORS', errors.length ? errors.join('\n') : 'none');
  await browser.close(); if (fails) process.exit(1);
})();
