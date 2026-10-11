// touch test: tap tiles/menus/buttons on a phone-sized touch device (portrait and landscape)
const { launch, open, st, URL } = require('./lib');
const { sleep, waitState } = require('./bot');
(async () => {
  const b = await launch(); const errors = [];
  for (const vp of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(URL); await page.waitForFunction(() => window.__tac && __tac.state().scene === 'title');
    const lg = async (x, y) => { const r = await page.evaluate(() => { const r = document.getElementById('cv').getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; }); return { x: r.l + x / 320 * r.w, y: r.t + y / 240 * r.h }; };
    const tap = async (x, y) => { const p = await lg(x, y); await page.touchscreen.tap(p.x, p.y); await sleep(60); };
    const tapTile = async (tx, ty) => { const s = await st(page); await tap(s.ox + tx * 16 + 8, s.oy + ty * 16 + 8); };
    // canvas must fit inside the viewport and buttons must be on screen
    const geo = await page.evaluate(() => { const r = id => document.getElementById(id).getBoundingClientRect(); const c = r('cv'); return { c: [c.left, c.top, c.right, c.bottom], b: ['bCancel', 'bEnd', 'bInfo', 'bMute'].map(i => { const q = r(i); return [q.left, q.top, q.right, q.bottom]; }), w: innerWidth, h: innerHeight }; });
    for (const q of geo.b.concat([geo.c])) if (q[0] < -0.5 || q[1] < -0.5 || q[2] > geo.w + 0.5 || q[3] > geo.h + 0.5) throw new Error('element off screen ' + JSON.stringify(geo));
    for (let i = 0; i < geo.b.length; i++) for (let j = i + 1; j < geo.b.length; j++) { const a = geo.b[i], c = geo.b[j]; if (a[0] < c[2] && c[0] < a[2] && a[1] < c[3] && c[1] < a[3]) throw new Error('buttons overlap'); }
    // start: tap "はじめから", then tap through dialogue
    await tap(160, 190); await waitState(page, () => __tac.state().scene !== 'title');
    await page.evaluate(() => __tac.speed(10));
    for (let i = 0; i < 80; i++) { const s = await st(page); if (s.scene === 'battle' && s.ready) break; await tap(160, 120); }
    await page.evaluate(() => __tac.speed(1)); await sleep(200);
    let s = await st(page); const leon = s.units.find(u => u.key === 'leon');
    await tapTile(leon.x, leon.y); await waitState(page, () => __tac.state().mode === 'move');
    await page.tap('#bCancel'); await waitState(page, () => __tac.state().mode === 'idle');
    await tapTile(leon.x, leon.y); await waitState(page, () => __tac.state().mode === 'move');
    await tapTile(leon.x + 2, leon.y); await waitState(page, () => __tac.state().mode === 'menu');
    s = await st(page); const wi = s.menu.items.findIndex(i => i.label === '待機');
    await tap(s.menu.x + 20, s.menu.y + 5 + wi * 14 + 6);
    await waitState(page, () => __tac.state().units.find(u => u.key === 'leon').acted);
    s = await st(page); const l2 = s.units.find(u => u.key === 'leon'); if (l2.x !== leon.x + 2) throw new Error('leon did not move by tap');
    await page.tap('#bEnd'); await waitState(page, () => __tac.state().mode === 'sysmenu');
    s = await st(page); await tap(s.menu.x + 20, s.menu.y + 11);
    await waitState(page, () => __tac.state().phase === 1); await page.evaluate(() => __tac.speed(10));
    await waitState(page, () => __tac.state().phase === 0 && __tac.state().ready, null, 40000);
    console.log('touch OK', vp.width + 'x' + vp.height, 'canvas', geo.c.map(Math.round).join(','));
    await ctx.close();
  }
  await b.close();
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log('TOUCH OK');
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
