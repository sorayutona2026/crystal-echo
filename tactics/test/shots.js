// screenshots of the main scenes into tactics/test-out/   (node test/shots.js)
const fs = require('fs'), path = require('path');
const { launch, open, st, URL } = require('./lib');
const { press, sleep, cursorTo, waitMode, waitState, settle } = require('./bot');
const OUT = path.join(__dirname, '..', 'test-out'); fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.png')) fs.unlinkSync(path.join(OUT, f));
const shot = async (page, name) => { await page.screenshot({ path: path.join(OUT, name + '.png') }); console.log('saved', name + '.png'); };
const fresh = async (page, q) => { await page.goto(URL + (q || '')); await page.waitForFunction(() => window.__tac && __tac.state().scene === 'title'); };
const battle = async (page, ch) => { await page.evaluate(c => { __tac.setAuto(false); __tac.speed(10); __tac.start(c); }, ch); await page.waitForFunction(() => __tac.state().scene === 'battle' && __tac.state().ready, null, { timeout: 30000 }); await page.evaluate(() => __tac.speed(1)); };
const base = async (page, ch) => { await page.evaluate(c => { __tac.speed(4); __tac.start(c, true); }, ch); await page.waitForFunction(() => __tac.state().scene === 'base', null, { timeout: 30000 }); await page.evaluate(() => __tac.speed(1)); await sleep(300); };
(async () => {
  const b = await launch(); const { page, errors } = await open(b, { query: '?seed=3' });
  await sleep(400); await shot(page, '01_title');
  await press(page, 'z'); await waitState(page, () => __tac.state().scene === 'card'); await sleep(900); await shot(page, '02_chapter_card');
  await press(page, 'z'); await sleep(200); await press(page, 'z'); await waitState(page, () => __tac.state().scene === 'dialogue');
  for (let i = 0; i < 4; i++) { await sleep(600); await press(page, 'z'); await sleep(100); await press(page, 'z'); }
  await sleep(1300); await shot(page, '03_dialogue_village');
  // ---- chapter 1: painted battlefield
  await fresh(page, '?seed=3'); await battle(page, 0);
  await cursorTo(page, 10, 8); await sleep(900); await shot(page, '04_ch1_painted_map');
  await cursorTo(page, 7, 13); await press(page, 'z'); await waitMode(page, 'move'); await cursorTo(page, 9, 11); await sleep(900); await shot(page, '05_ch1_move_range'); await press(page, 'x');
  // mid-battle talk (leon next to mira)
  await page.evaluate(() => __tac.place('mira', 7, 12)); await waitState(page, () => __tac.state().dlg, null, 8000); await sleep(1500); await shot(page, '06_battle_talk');
  // ---- base
  await fresh(page); await base(page, 3); await shot(page, '10_base_main');
  await press(page, 'ArrowDown'); await press(page, 'z'); await sleep(250); await press(page, 'z'); await sleep(300); await shot(page, '11_base_hero');
  await press(page, 'Escape', 2); await press(page, 'ArrowDown'); await press(page, 'z'); await press(page, 'z'); await press(page, 'z'); await sleep(300); await shot(page, '12_base_shop');
  await press(page, 'Escape', 3); await sleep(150); await press(page, 'ArrowUp', 3); await press(page, 'z'); await sleep(250); await shot(page, '13_base_deploy');
  // class change + skill rows
  await fresh(page); await base(page, 4); await page.evaluate(() => { __tac.setLv('leon', 10); __tac.give(0, 1); __tac.bond('leon', 'mira', 8); });
  await press(page, 'ArrowDown'); await press(page, 'z'); await press(page, 'z'); await sleep(300); await shot(page, '14_base_class_change');
  await press(page, 'Escape', 2); await press(page, 'ArrowDown', 3); await press(page, 'z'); await sleep(250); await press(page, 'z'); await sleep(250);
  await press(page, 'z'); await sleep(2200); await shot(page, '15_support_talk');
  // ---- maps of every chapter (cursor parked so it does not cover anything)
  for (const [ch, name, cx, cy] of [[1, '20_ch2_defend', 4, 5], [2, '21_ch3_escape_mist', 18, 1], [3, '22_ch4_ash_ruins', 10, 3], [4, '23_ch5_fort_garud', 16, 2], [5, '24_ch6_altar_verza', 9, 1]]) {
    await fresh(page); await battle(page, ch); await cursorTo(page, cx, cy); await sleep(900); await shot(page, name);
  }
  // forecast with crit + HUD (ch5)
  await fresh(page); await battle(page, 4);
  { const s = await st(page), leon = s.units.find(u => u.key === 'leon'), g = s.units.find(u => u.id.startsWith('goblin'));
    await page.evaluate(([id, x, y]) => __tac.place(id, x, y), [g.id, leon.x + 1, leon.y]); await sleep(200);
    await cursorTo(page, leon.x, leon.y); await press(page, 'z'); await waitMode(page, 'move'); await press(page, 'z'); await waitMode(page, 'menu'); await press(page, 'z'); await waitMode(page, 'target'); await press(page, 'z'); await waitMode(page, 'forecast'); await sleep(300); await shot(page, '30_forecast_crit'); }
  // game over, ending
  await fresh(page); await battle(page, 5); await page.evaluate(() => { __tac.speed(10); __tac.kill('leon'); });
  await waitState(page, () => __tac.state().scene === 'gameover', null, 60000); await page.evaluate(() => __tac.speed(1)); await sleep(300); await shot(page, '31_gameover');
  await fresh(page); await page.evaluate(() => __tac.start('ending')); await sleep(5200); await shot(page, '32_ending_a'); await sleep(9000); await shot(page, '33_ending_b');
  // ---- phones: ch1 battle (portrait / landscape), title, base
  for (const [vp, nm] of [[{ width: 390, height: 844 }, 'portrait'], [{ width: 844, height: 390 }, 'landscape']]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); const pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push('pageerror ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await pg.goto(URL); await pg.waitForFunction(() => window.__tac && __tac.state().scene === 'title'); await sleep(300); await shot(pg, '40_phone_' + nm + '_title');
    await battle(pg, 0); await sleep(900); await shot(pg, '41_phone_' + nm + '_ch1');
    await pg.goto(URL); await pg.waitForFunction(() => window.__tac && __tac.state().scene === 'title'); await base(pg, 2); await shot(pg, '42_phone_' + nm + '_base');
    await ctx.close();
  }
  await b.close();
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log('SHOTS OK');
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
