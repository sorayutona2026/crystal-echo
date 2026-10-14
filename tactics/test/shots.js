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
  for (const [ch, name, cx, cy] of [[1, '20_ch2_defend', 6, 5], [2, '21_ch3_escape_mist', 21, 1], [3, '22_ch4_ash_ruins', 20, 6], [4, '23_ch5_fort_garud', 17, 2], [5, '24_ch6_altar_verza', 20, 5]]) {
    await fresh(page); await battle(page, ch); await cursorTo(page, cx, cy); await sleep(900); await shot(page, name);
  }
  // painted-style combat FX frozen mid-effect (chibi mode)
  await fresh(page); await battle(page, 0); await cursorTo(page, 9, 13); await sleep(500);
  const hold = (js) => page.evaluate(js);
  await hold(() => { G.fx = []; const p = tilePx(9, 12); G.fxA = { wpn: 'sword' }; fxSlash(p.x, p.y + 8, -0.6, 'sword'); const q = tilePx(7, 12); fxSlash(q.x, q.y + 8, 0, 'axe'); const r = tilePx(11, 12); fxThrust(r.x, r.y + 8, 3.1, 'spear'); const w = tilePx(8, 14); fxArrow(w.x - 40, w.y, w.x + 12, w.y + 4); for (const f of G.fx) { f.L = f.life; f.hold = Math.round(f.life * 0.3); } });
  await sleep(300); await shot(page, '22_fx_slash');
  await hold(() => { G.fx = []; const p = tilePx(9, 12); fxMeteor(p.x, p.y + 8); const q = tilePx(6, 13); fxBloom(q.x, q.y + 8, '#8fc8ff', 15); const r = tilePx(12, 13); fxBloom(r.x, r.y + 8, '#c47aff', 15); for (const f of G.fx) { f.L = f.life; f.hold = f.type === 'meteor' ? 15 : 6; } });
  await sleep(300); await shot(page, '23_fx_meteor');
  await hold(() => { G.fx = []; const p = tilePx(8, 13); fxHeal(p.x, p.y + 6, false); fxCross(p.x, p.y + 6); const q = tilePx(10, 13); fxHeal(q.x, q.y + 6, true); for (const f of G.fx) { f.L = f.life; f.hold = 18; } });
  await sleep(300); await shot(page, '24_fx_heal');
  // ---- specials (必殺技) paused mid-sequence: cut-in, meteor, prayer, ambush, boss cut-in (hold = step index inside the sequence)
  for (const [name, c] of Object.entries({
    '50_special_cutin': { key: 'leon', t: null, hold: 40, setup: () => { __tac.place('leon', 4, 10); __tac.place('mira', 5, 10); __tac.place('luka', 4, 11); } },
    '51_meteor': { key: 'luka', t: 'goblin', hold: 24 + 52 + 34 - 4, setup: () => { __tac.place('luka', 2, 10); const gs = G.S.units.filter(u => u.key === 'goblin' || u.key === 'slime'); __tac.place(gs[0].id, 5, 10); __tac.place(gs[1].id, 5, 11); __tac.place(gs[2].id, 6, 10); __tac.place(gs[3].id, 5, 9); } },
    '52_pray': { key: 'sophia', t: null, hold: 24 + 52 + 22 + 12, setup: () => { __tac.place('sophia', 4, 10); __tac.place('leon', 5, 10); __tac.place('mira', 4, 11); __tac.place('luka', 3, 10); __tac.place('jin', 4, 9); for (const k of ['leon', 'mira', 'luka', 'jin', 'sophia']) __tac.hurt(k, 8); } },
    '53_ambush': { key: 'jin', t: 'goblin', hold: 24 + 52 + 6 + 9 + 14, setup: () => { __tac.place('jin', 3, 10); const g = G.S.units.find(u => u.key === 'goblin'); __tac.place(g.id, 5, 10); } },
    '54_boss_cutin': { key: 'boss', t: 'leon', hold: 40, setup: () => { __tac.place('boss', 5, 10); __tac.place('leon', 4, 10); } }
  })) {
    await fresh(page); await battle(page, 4); await sleep(300); await page.evaluate(c.setup); await sleep(200);
    for (let i = 0; i < 30 && (await page.evaluate(() => !!G.dlg)); i++) { await press(page, 'z'); await sleep(60); }
    await page.evaluate(([k, t, h]) => { __tac.seed(5); __tac.setCutin(true); __tac.setAuto(false); __tac.speed(1); __tac.special(k, t, h); }, [c.key, c.t, c.hold]);
    await page.waitForFunction(h => { const q = __tac.spState(); return q && q.n >= h; }, c.hold, { timeout: 20000, polling: 10 }); await sleep(120); await shot(page, name);
    await page.evaluate(() => __tac.spHold(null)); for (let i = 0; i < 80 && (await page.evaluate(() => __tac.busy())); i++) { await press(page, 'z'); await sleep(100); }
  }
  // forecast with crit + HUD (ch5)
  await fresh(page); await battle(page, 4);
  { const s = await st(page), leon = s.units.find(u => u.key === 'leon'), g = s.units.find(u => u.id.startsWith('goblin'));
    await page.evaluate(([id, x, y]) => __tac.place(id, x, y), [g.id, leon.x + 1, leon.y]); await sleep(200);
    await cursorTo(page, leon.x, leon.y); await press(page, 'z'); await waitMode(page, 'move'); await press(page, 'z'); await waitMode(page, 'menu'); await press(page, 'z'); await waitMode(page, 'target'); await press(page, 'z'); await waitMode(page, 'forecast'); await sleep(300); await shot(page, '30_forecast_crit'); }
  // ---- trial tower: camp row, a boss floor, secrets
  await fresh(page); await base(page, 2); await page.evaluate(() => { G.meta.tower = { best: 7, claimed: {} }; }); await sleep(250); await press(page, 'ArrowDown', 5); await sleep(250); await shot(page, '60_tower_camp_row');
  await press(page, 'z'); await sleep(300); await shot(page, '61_tower_camp_view');
  await page.evaluate(() => { __tac.speed(6); }); await press(page, 'ArrowDown'); await press(page, 'z'); await waitState(page, () => __tac.state().scene === 'card', null, 8000); await sleep(1200); await shot(page, '62_tower_card');
  await press(page, 'z'); await waitState(page, () => __tac.state().scene === 'battle' && __tac.state().ready, null, 30000); await page.evaluate(() => __tac.speed(1)); await sleep(1200); await shot(page, '63_tower_battle_floor8');
  await fresh(page); await base(page, 2); await page.evaluate(() => { G.meta.tower = { best: 4, claimed: {} }; Base.job = function* () { yield* towerRun(5); }; __tac.speed(6); });
  await waitState(page, () => __tac.state().scene === 'card', null, 8000); await press(page, 'z'); await waitState(page, () => __tac.state().scene === 'battle' && __tac.state().ready, null, 30000); await page.evaluate(() => __tac.speed(1));
  { const s = await st(page), e = s.units.find(u => u.boss); await cursorTo(page, e.x, e.y); await sleep(1200); await shot(page, '64_tower_boss_floor5'); }
  await fresh(page); await battle(page, 0); await page.evaluate(() => { G.S.secrets[0].seen = true; }); await cursorTo(page, 13, 2); await sleep(1100); await shot(page, '65_secret_sparkle');
  await fresh(page); await battle(page, 1); await page.evaluate(() => __tac.place('sophia', 2, 4)); await waitState(page, () => __tac.state().dlg, null, 8000); await sleep(2200); await shot(page, '66_secret_talk');
  for (let i = 0; i < 12; i++) { await press(page, 'z'); await sleep(250); } await sleep(300); await shot(page, '67_secret_talk_reward');
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
