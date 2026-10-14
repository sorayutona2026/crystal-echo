// auto battle test (touch only, iframe at 390x844): turn auto on with the button, chapter 1 must be won by itself;
// then toggle auto off mid-phase and check that control returns.
const path = require('path');
const { launch } = require('./lib');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await launch(); const errors = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.join(__dirname, 'frame.html'));
  let fr = null; for (let i = 0; i < 60 && !fr; i++) { fr = page.frames().find(f => f !== page.mainFrame()); await sleep(100); }
  await fr.waitForFunction(() => window.__tac && __tac.state().scene === 'title', null, { timeout: 15000 });
  const S = () => fr.evaluate(() => __tac.state());
  const tapL = async (x, y) => { const r = await fr.evaluate(() => { const r = document.getElementById('cv').getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height, vh: __tac.state().vh, yo: __tac.state().yoff }; }); const fe = await (await page.$('iframe')).boundingBox(); await page.touchscreen.tap(fe.x + r.l + x / 320 * r.w, fe.y + r.t + (y + r.yo) / r.vh * r.h); await sleep(120); };
  const tapBtn = async sel => { const bx = await (await fr.$(sel)).boundingBox(); const fe = await (await page.$('iframe')).boundingBox(); await page.touchscreen.tap(fe.x + bx.x + bx.width / 2, fe.y + bx.y + bx.height / 2); await sleep(150); };
  await tapL(160, 190); // はじめから
  await fr.evaluate(() => __tac.speed(6));
  // only dialogue advancing by tapping; then the auto button once the battle begins
  let turned = false, won = false;
  for (let i = 0; i < 4000 && !won; i++) {
    const s = await S();
    if (s.scene === 'battle') {
      if (!turned && s.ready) { await tapBtn('#bAuto'); turned = true; if (!(await S()).auto) throw new Error('auto did not turn on'); }
      if (s.over === 'win') won = true;
      await sleep(100); continue;
    }
    if (s.scene === 'dialogue' && turned) { won = true; break; }
    await tapL(160, 120); await sleep(60);
  }
  if (!won) throw new Error('chapter 1 was not won by auto');
  const st = await S(); console.log('auto won chapter 1; auto flag', st.auto, 'scene', st.scene);
  // pref persisted?
  const pref = await fr.evaluate(() => { try { return localStorage.getItem('starfall_tactics_prefs'); } catch (e) { return 'n/a'; } }); console.log('prefs', pref);
  // second part: fresh battle, auto on, then off mid-phase
  await page.goto('file://' + path.join(__dirname, 'frame.html'));
  fr = null; for (let i = 0; i < 60 && !fr; i++) { fr = page.frames().find(f => f !== page.mainFrame()); await sleep(100); }
  await fr.waitForFunction(() => window.__tac && __tac.state().scene === 'title', null, { timeout: 15000 });
  await fr.evaluate(() => { __tac.speed(10); __tac.start(0); __tac.setAuto(false); });
  await fr.waitForFunction(() => __tac.state().scene === 'battle' && __tac.state().ready); await fr.evaluate(() => __tac.speed(1));
  await tapBtn('#bAuto');
  await fr.waitForFunction(() => __tac.state().units.some(u => u.team === 0 && u.acted), null, { timeout: 20000 });
  await tapBtn('#bAuto'); // off, mid-phase
  await fr.waitForFunction(() => { const s = __tac.state(); return !s.auto && s.ready; }, null, { timeout: 20000 });
  const n0 = (await S()).units.filter(u => u.team === 0 && u.acted).length; await sleep(1500); const s2 = await S();
  if (s2.units.filter(u => u.team === 0 && u.acted).length !== n0 || s2.phase !== 0 || s2.auto) throw new Error('auto kept playing after being switched off');
  for (let i = 0; i < 40 && (await S()).dlg; i++) { await page.keyboard.press('z'); await sleep(120); } // a mid-battle talk may be on screen
  const s2b = await S(); s2.cursor = s2b.cursor;
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowUp'); await sleep(200); const s3 = await S(); if (s3.cursor.x === s2.cursor.x && s3.cursor.y === s2.cursor.y && s2.cursor.y > 0) throw new Error('cursor did not respond after auto off ' + JSON.stringify(s2.cursor) + ' mode ' + s3.mode + ' ready ' + s3.ready);
  console.log('auto off mid-phase: control returned');
  // speed toggle
  await tapBtn('#bMenu'); await tapBtn('#sheet button[data-k=speed]'); await tapBtn('#bMenu'); if ((await S()).speedX !== 2) throw new Error('speed toggle failed');
  // auto mode also handles the camp between chapters: it shops, picks skills and starts the next chapter by itself
  await page.goto('file://' + path.join(__dirname, 'frame.html'));
  fr = null; for (let i = 0; i < 60 && !fr; i++) { fr = page.frames().find(f => f !== page.mainFrame()); await sleep(100); }
  await fr.waitForFunction(() => window.__tac && __tac.state().scene === 'title', null, { timeout: 15000 });
  await fr.evaluate(() => { __tac.speed(10); __tac.setAuto(true); __tac.start(2, true); });
  await fr.waitForFunction(() => __tac.state().scene === 'base', null, { timeout: 15000 }); const g0 = (await S()).gold;
  await fr.waitForFunction(() => __tac.state().scene === 'battle', null, { timeout: 20000 }); const g1 = (await S()).gold;
  if (!(g1 < 920)) throw new Error('auto camp did not spend gold: 920 -> ' + g1); // start(2, true) gives 120 + 400*2 gold; auto mode shops before the first frame
  console.log('auto camp OK: gold 920 ->', g1);
  await ctx.close(); await b.close();
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log('AUTO OK');
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
