// touch test: tap tiles/menus/buttons on a phone-sized touch device (portrait and landscape)
const { launch, open, st, URL } = require('./lib');
const { sleep, waitState } = require('./bot');
(async () => {
  const b = await launch(); const errors = [];
  const settleCam = async (get) => { let prev = null; for (let i = 0; i < 40; i++) { const s = await get(); const k = Math.round(s.ox) + ',' + Math.round(s.oy); if (k === prev) return s; prev = k; await sleep(90); } return get(); };
  for (const vp of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(URL); await page.waitForFunction(() => window.__tac && __tac.state().scene === 'title');
    const lg = async (x, y) => { const r = await page.evaluate(() => { const r = document.getElementById('cv').getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height, vh: __tac.state().vh, yo: __tac.state().yoff }; }); return { x: r.l + x / 320 * r.w, y: r.t + (y + r.yo) / r.vh * r.h }; };
    const tap = async (x, y) => { const p = await lg(x, y); await page.touchscreen.tap(p.x, p.y); await sleep(60); };
    const tapTile = async (tx, ty) => { const s = await settleCam(() => st(page)); await tap(s.ox + tx * s.tile + s.tile / 2, s.oy + ty * s.tile + s.tile / 2); };
    // canvas must fit inside the viewport and buttons must be on screen
    const checkGeo = async (ids, tag) => {
      const geo = await page.evaluate(ids => { const r = id => document.getElementById(id).getBoundingClientRect(); const c = r('cv'); return { c: [c.left, c.top, c.right, c.bottom], b: ids.map(i => { const q = r(i); return [q.left, q.top, q.right, q.bottom, i]; }), w: innerWidth, h: innerHeight }; }, ids);
      for (const q of geo.b.concat([geo.c])) if (q[0] < -0.5 || q[1] < -0.5 || q[2] > geo.w + 0.5 || q[3] > geo.h + 0.5) throw new Error(tag + ': element off screen ' + JSON.stringify(geo));
      for (const q of geo.b) if (q[2] - q[0] < 40 || q[3] - q[1] < 36) throw new Error(tag + ': button too small ' + q);
      for (let i = 0; i < geo.b.length; i++) for (let j = i + 1; j < geo.b.length; j++) { const a = geo.b[i], c = geo.b[j]; if (a[0] < c[2] && c[0] < a[2] && a[1] < c[3] && c[1] < a[3]) throw new Error(tag + ': buttons overlap ' + a[4] + ' ' + c[4]); }
      const vis = await page.evaluate(() => [...document.querySelectorAll('#tac .pad button')].filter(b => b.offsetParent).map(b => b.id)); return vis;
    };
    // start: tap "はじめから", then tap through dialogue
    await tap(160, 190); await waitState(page, () => __tac.state().scene !== 'title');
    await page.evaluate(() => __tac.speed(10));
    for (let i = 0; i < 80; i++) { const s = await st(page); if (s.scene === 'battle' && s.ready) break; await tap(160, 120); }
    await page.evaluate(() => __tac.speed(1)); await sleep(200);
    { const v = await checkGeo(['bUndo', 'bEnd', 'bAuto', 'bMenu'], 'battle idle'); if (v.includes('bCancel') || v.includes('bOk')) throw new Error('context buttons should be hidden when idle: ' + v); }
    let s = await st(page); const leon = s.units.find(u => u.key === 'leon');
    if (vp.height > vp.width) { // portrait: zoomed map + camera; dragging pans, it must not select anything
      if (s.zoom !== 2) throw new Error('portrait battle should use zoom 2, got ' + s.zoom);
      const before = s.ox;
      await page.evaluate(() => { const c = document.getElementById('cv'), r = c.getBoundingClientRect(), f = (t, x, y) => c.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: y, pointerId: 7, bubbles: true }));
        const x0 = r.left + r.width * 0.7, y0 = r.top + r.height * 0.5; f('pointerdown', x0, y0); for (let i = 1; i <= 6; i++) f('pointermove', x0 - i * 12, y0); f('pointerup', x0 - 72, y0); });
      await sleep(300); const after = (await st(page)).ox; if (!(Math.abs(after - before) > 10) || (await st(page)).mode !== 'idle') throw new Error('drag did not pan the camera: ' + before + ' -> ' + after);
    }
    await tapTile(leon.x, leon.y); await waitState(page, () => __tac.state().mode === 'move');
    { const v = await checkGeo(['bCancel', 'bUndo', 'bEnd', 'bAuto', 'bMenu'], 'unit selected'); if (!v.includes('bCancel')) throw new Error('cancel should show while selected'); }
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
    console.log('touch OK', vp.width + 'x' + vp.height, 'ok');
    await ctx.close();
  }
  // camp (base) screens by real touches: big rows must be tappable on phones, portrait and landscape
  for (const vp of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(URL); await page.waitForFunction(() => window.__tac && __tac.state().scene === 'title');
    await page.evaluate(() => { __tac.speed(4); __tac.start(2, true); }); await waitState(page, () => __tac.state().scene === 'base'); await page.evaluate(() => { __tac.speed(1); __tac.give(1000, 0); }); await sleep(300);
    const tapRow = async (label) => { // tap the row with this label (scrolling with arrows is not needed: all test rows fit)
      const s = await st(page), i = s.base.rows.indexOf(label); if (i < 0) throw new Error('row not found: ' + label + ' in ' + s.base.rows.join(','));
      const g = s.base.geom, k = i - g.scroll; if (k < 0 || k >= g.vis) throw new Error('row not visible: ' + label + ' ' + JSON.stringify(g));
      const r = await page.evaluate(() => { const r = document.getElementById('cv').getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height, vh: __tac.state().vh, yo: __tac.state().yoff }; });
      const ly = g.y0 + k * (g.rh + 2) + g.rh / 2; await page.touchscreen.tap(r.l + 160 / 320 * r.w, r.t + (ly + r.yo) / r.vh * r.h); await sleep(150); };
    const depth = async () => (await st(page)).base.depth;
    await tapRow('部隊'); if ((await st(page)).base.title !== '部隊') throw new Error('部隊 row tap failed');
    await tapRow((await st(page)).base.rows[0]); if ((await depth()) !== 3) throw new Error('hero row tap failed');
    await tapRow('戻る'); await tapRow('戻る'); if ((await depth()) !== 1) throw new Error('戻る taps failed');
    await tapRow('ショップ'); await tapRow('買う'); await tapRow((await st(page)).base.rows[0]); if ((await depth()) !== 4) throw new Error('shop navigation failed');
    const g0 = (await st(page)).gold; await tapRow((await st(page)).base.rows[0]); const g1 = (await st(page)).gold; if (!(g1 < g0)) throw new Error('buy by tap did not spend gold ' + g0 + ' -> ' + g1);
    await tapRow('戻る'); await tapRow('戻る'); await tapRow('戻る'); if ((await depth()) !== 1) throw new Error('could not leave the shop');
    await tapRow('出撃準備'); await tapRow('出撃する!'); await waitState(page, () => __tac.state().scene !== 'base', null, 8000);
    console.log('camp touch OK', vp.width + 'x' + vp.height, 'gold', g0, '->', g1); await ctx.close();
  }
  // regression: attack with taps only, inside an iframe (like the artifact host), portrait and landscape
  for (const vp of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    for (const seq of ['menu', 'quick-menu', 'quick-move']) {
      let ok = false, log = '';
      for (let seed = 1; seed <= 6 && !ok; seed++) {
        const ctx = await b.newContext({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
        const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
        await page.goto('file://' + require('path').join(__dirname, 'frame.html'));
        let fr = null; for (let i = 0; i < 60 && !fr; i++) { fr = page.frames().find(f => f !== page.mainFrame()); await sleep(100); }
        await fr.waitForFunction(() => window.__tac && __tac.state().scene === 'title', null, { timeout: 15000 });
        const S = () => fr.evaluate(() => __tac.state());
        const tapL = async (x, y) => { const r = await fr.evaluate(() => { const r = document.getElementById('cv').getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height, vh: __tac.state().vh, yo: __tac.state().yoff }; }); const fe = await (await page.$('iframe')).boundingBox(); await page.touchscreen.tap(fe.x + r.l + x / 320 * r.w, fe.y + r.t + (y + r.yo) / r.vh * r.h); await sleep(150); };
        const tapT = async (tx, ty) => { const s = await settleCam(S); await tapL(s.ox + tx * s.tile + s.tile / 2, s.oy + ty * s.tile + s.tile / 2); };
        const tapBtn = async sel => { const bx = await (await fr.$(sel)).boundingBox(); const fe = await (await page.$('iframe')).boundingBox(); await page.touchscreen.tap(fe.x + bx.x + bx.width / 2, fe.y + bx.y + bx.height / 2); await sleep(150); };
        await fr.evaluate(sd => { __tac.seed(sd); __tac.speed(10); __tac.start(0); }, seed);
        await fr.waitForFunction(() => __tac.state().scene === 'battle' && __tac.state().ready); await fr.evaluate(() => __tac.speed(1)); await sleep(300);
        let s = await S(); const leon = s.units.find(u => u.key === 'leon'), slime = s.units.find(u => u.id.startsWith('slime'));
        await fr.evaluate(([id, x, y]) => __tac.place(id, x, y), [slime.id, leon.x + (seq === 'quick-move' ? 1 : 2), leon.y]); await sleep(200);
        const fail = m => { throw new Error('[' + vp.width + 'x' + vp.height + ' ' + seq + '] ' + m); };
        await tapT(leon.x, leon.y); if ((await S()).mode !== 'move') fail('hero tap did not select');
        if (seq === 'quick-move') { await tapT(leon.x + 1, leon.y); } // enemy adjacent from the start tile: tap it straight after selecting the hero
        else {
          await tapT(leon.x + 1, leon.y); await fr.waitForFunction(() => __tac.state().mode === 'menu', null, { timeout: 5000 });
          s = await S(); const i = s.menu.items.findIndex(x => x.label === '攻撃');
          if (seq === 'menu') { await tapL(s.menu.x + 20, s.menu.y + 5 + i * 14 + 6); if ((await S()).mode !== 'target') fail('攻撃 row tap did not enter target mode'); await tapT(leon.x + 2, leon.y); }
          else await tapT(leon.x + 2, leon.y); // tap the enemy directly while the menu is open
        }
        s = await S();
        if (seq === 'quick-move') { await fr.waitForFunction(() => __tac.state().mode === 'forecast', null, { timeout: 5000 }).catch(() => { }); s = await S(); }
        if (s.mode !== 'forecast') fail('tapping the enemy did not open the forecast (mode ' + s.mode + ')');
        if (seq === 'quick-menu') await tapBtn('#bOk'); else await tapT(leon.x + (seq === 'quick-move' ? 1 : 2), leon.y); // button 決定, or tap the same enemy again
        await fr.waitForFunction(() => __tac.state().units.find(u => u.key === 'leon').acted, null, { timeout: 8000 }).catch(() => fail('attack did not execute'));
        s = await S(); const after = s.units.find(u => u.id === slime.id); log = after ? after.hp : 'dead';
        ok = !after || after.hp < slime.hp; await ctx.close();
      }
      if (!ok) throw new Error('attack by taps never reduced enemy HP: ' + vp.width + 'x' + vp.height + ' ' + seq + ' (' + log + ')');
      console.log('tap-attack OK', vp.width + 'x' + vp.height, seq, 'enemy hp ->', log);
    }
  }
  await b.close();
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log('TOUCH OK');
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
