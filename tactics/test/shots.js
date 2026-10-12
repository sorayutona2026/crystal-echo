// screenshots of the main scenes into tactics/test-out/
const fs = require('fs'), path = require('path');
const { launch, open, st } = require('./lib');
const { press, sleep, cursorTo, waitMode, waitState, doAction, settle, botStep, endTurn } = require('./bot');
const OUT = path.join(__dirname, '..', 'test-out'); fs.mkdirSync(OUT, { recursive: true });
const shot = async (page, name) => { await page.screenshot({ path: path.join(OUT, name + '.png') }); console.log('saved', name + '.png'); };
(async () => {
  const b = await launch(); const { page, errors } = await open(b, { query: '?seed=3' });
  await page.evaluate(() => __tac.seed(3));
  await sleep(400); await shot(page, '01_title'); await shot(page, '29_title_art');
  // dialogue with face
  await press(page, 'z'); await waitState(page, () => __tac.state().scene === 'card'); await sleep(900); await shot(page, '02_chapter_card');
  await press(page, 'z'); await sleep(200); await press(page, 'z'); await waitState(page, () => __tac.state().scene === 'dialogue');
  for (let i = 0; i < 3; i++) { await sleep(500); await press(page, 'z'); await sleep(100); await press(page, 'z'); }
  await sleep(1200); await shot(page, '03_dialogue');
  // jump to a battle (new session so the title is skipped)
  await page.evaluate(() => { __tac.speed(10); });
  for (let i = 0; i < 60; i++) { const s = await st(page); if (s.scene === 'battle' && s.ready) break; await press(page, 'z'); await sleep(50); }
  await page.evaluate(() => __tac.speed(1)); await sleep(300);
  for (let i = 0; i < 5; i++) { const s0 = await st(page); if (s0.mode === 'idle') break; await press(page, 'x'); await sleep(150); }
  // move range: select leon
  await press(page, 'z'); await waitMode(page, 'move'); await cursorTo(page, 5, 8); await sleep(250); await shot(page, '04_move_range');
  await press(page, 'x'); await sleep(100);
  // bot plays until an attack is available, then forecast
  await page.evaluate(() => __tac.speed(10));
  let sug;
  for (let i = 0; i < 80; i++) {
    await settle(page); sug = await page.evaluate(() => __tac.suggest());
    if (sug && sug.kind === 'attack') break;
    if (!sug || sug.end) await endTurn(page); else await doAction(page, sug);
  }
  await page.evaluate(() => { __tac.speed(1); __tac.setExp(null, 0); });
  await settle(page);
  const hero = sug.unit; await page.evaluate(id => { const s = __tac.state(); }, hero);
  await page.evaluate(k => __tac.setExp(k, 95), sug.unit);
  await doAction(page, sug, 'forecast'); await sleep(300); await shot(page, '05_forecast');
  // frame-exact capture: pause the loop, queue the confirm key, then advance a fixed number of steps
  await page.evaluate(() => __tac.speed(0)); await press(page, 'z');
  await page.evaluate(() => __tac.step(10)); await shot(page, '06_attack_windup');
  await page.evaluate(() => __tac.step(8)); await shot(page, '06_attack_moment');
  await page.evaluate(() => __tac.speed(1));
  for (let i = 0; i < 40; i++) { const s = await st(page); if (s.lvl) break; await sleep(100); }
  await sleep(250); await shot(page, '07_levelup'); await shot(page, '28_levelup_art');
  await press(page, 'z'); await sleep(300);
  // end the turn right away (E menu), capturing the enemy phase banner
  await settle(page);
  await endTurn(page); await sleep(450); await shot(page, '08_enemy_phase');
  await sleep(2500); await shot(page, '09_enemy_action');
  await page.evaluate(() => __tac.speed(10)); await settle(page); await page.evaluate(() => __tac.speed(1));
  await shot(page, '10_player_turn2');
  // ending (jump)
  await page.reload(); await page.waitForFunction(() => window.__tac && __tac.state().scene === 'title');
  await page.evaluate(() => __tac.start('ending')); await sleep(7500); await shot(page, '11_ending');
  // chapter 3 (fort + boss) on desktop, cursor on the boss
  await page.reload(); await page.waitForFunction(() => window.__tac && __tac.state().scene === 'title');
  await page.evaluate(() => { __tac.speed(10); __tac.start(2); });
  await page.waitForFunction(() => __tac.state().scene === 'battle' && __tac.state().ready); await page.evaluate(() => __tac.speed(1));
  await cursorTo(page, 16, 2); await sleep(300); await shot(page, '15_boss_fort');
  // defeat: the lord falls (test hook), then retry the chapter from the game-over screen
  await page.evaluate(() => { __tac.speed(10); __tac.kill('leon'); });
  await waitState(page, () => __tac.state().scene === 'gameover', null, 60000); await page.evaluate(() => __tac.speed(1)); await sleep(300); await shot(page, '16_gameover');
  await press(page, 'z'); await waitState(page, () => __tac.state().scene === 'battle'); console.log('retry after defeat OK');
  // full-map views of chapters 1 and 2 (cursor parked in a corner so nothing covers the field)
  for (const [ch, name] of [[0, '18_ch1_map'], [1, '19_ch2_map']]) {
    await page.reload(); await page.waitForFunction(() => window.__tac && __tac.state().scene === 'title');
    await page.evaluate(c => { __tac.speed(10); __tac.start(c); }, ch);
    await page.waitForFunction(() => __tac.state().scene === 'battle' && __tac.state().ready); await page.evaluate(() => __tac.speed(1));
    await cursorTo(page, 0, 0); await sleep(300); await shot(page, name);
  }
  // combat effects: sword/spear slash, meteor, heal; then auto mode
  const freshBattle = async (ch) => { await page.reload(); await page.waitForFunction(() => window.__tac && __tac.state().scene === 'title'); await page.evaluate(c => { __tac.setAuto(false); __tac.speed(10); __tac.start(c); }, ch); await page.waitForFunction(() => __tac.state().scene === 'battle' && __tac.state().ready); await page.evaluate(() => __tac.speed(1)); await sleep(300); };
  const frames = async (n) => { await page.evaluate(k => __tac.step(k), n); };
  await freshBattle(0);
  { const s1 = await st(page), lv = s1.units.find(u => u.key === 'leon');
    await page.evaluate(([x, y]) => __tac.place('slime_13_4', x, y), [lv.x + 1, lv.y]); await sleep(150);
    await doAction(page, { unit: 'leon', from: { x: lv.x, y: lv.y }, dest: { x: lv.x, y: lv.y }, target: 'slime_13_4', kind: 'attack' }, 'forecast');
    await page.evaluate(() => __tac.speed(0)); await press(page, 'z'); await frames(8); await shot(page, '22_fx_slash'); await frames(8); await shot(page, '27_cutin'); await page.evaluate(() => __tac.speed(1)); await settle(page); }
  await freshBattle(0);
  { const s1 = await st(page), lk = s1.units.find(u => u.key === 'luka');
    await page.evaluate(([x, y]) => { __tac.place('slime_13_4', x, y); __tac.place('slime_13_7', x, y - 1); }, [lk.x + 3, lk.y]); await sleep(150);
    await doAction(page, { unit: 'luka', from: { x: lk.x, y: lk.y }, dest: { x: lk.x, y: lk.y }, target: 'slime_13_4', kind: 'attack', sp: true, spLabel: 'メテオ' }, 'forecast');
    await page.evaluate(() => __tac.speed(0)); await press(page, 'z'); await frames(46); await shot(page, '23_fx_meteor'); await page.evaluate(() => __tac.speed(1)); await settle(page); }
  await freshBattle(1);
  { await page.evaluate(() => { __tac.place('leon', 1, 6); __tac.hurt('leon', 5); }); await sleep(150);
    await cursorTo(page, 1, 5); await press(page, 'z'); await waitMode(page, 'move'); await press(page, 'z'); await waitMode(page, 'menu'); await press(page, 'z'); await waitMode(page, 'target');
    await page.evaluate(() => __tac.speed(0)); await press(page, 'z'); await frames(14); await shot(page, '24_fx_heal'); await page.evaluate(() => __tac.speed(1)); await settle(page); }
  await freshBattle(0);
  await press(page, 'q'); await sleep(2500); await shot(page, '25_auto_on'); await press(page, 'q'); await sleep(600);
  // portrait art in dialogue (desktop + phone), boss reveal, HD units vs pixel sprites
  await page.reload(); await page.waitForFunction(() => window.__tac && __tac.state().scene === 'title');
  await page.evaluate(() => __tac.talk('sophia', 'お待ちください! 負傷した方が、まだ橋のたもとに…!', 1)); await sleep(300); await shot(page, '26_face_dialogue');
  await page.evaluate(() => __tac.talk('boss', '来たか、小さな旗の騎士よ。我が名はガルド。黒き軍勢の金角将軍だ。', 2)); await sleep(300); await shot(page, '26_face_dialogue_boss');
  await page.evaluate(() => __tac.showIntro(70)); await sleep(300); await shot(page, '31_boss_intro');
  for (const [hd, nm] of [[true, '30_hd_units'], [false, '30_pixel_units']]) {
    await freshBattle(2); await page.evaluate(v => __tac.setHD(v), hd); await cursorTo(page, 8, 7); await sleep(300); await shot(page, nm);
  }
  await page.evaluate(() => __tac.setHD(true));
  // special-command menu (ルカ: メテオ) on the opening position of chapter 1
  await page.reload(); await page.waitForFunction(() => window.__tac && __tac.state().scene === 'title');
  await page.evaluate(() => { __tac.speed(10); __tac.start(0); });
  await page.waitForFunction(() => __tac.state().scene === 'battle' && __tac.state().ready); await page.evaluate(() => __tac.speed(1));
  { const s1 = await st(page), lk = s1.units.find(u => u.key === 'luka'); await cursorTo(page, lk.x, lk.y); await press(page, 'z'); await waitMode(page, 'move'); await press(page, 'z'); await waitMode(page, 'menu'); await press(page, 'ArrowDown'); await sleep(250); await shot(page, '17_special_menu'); }
  // boss chapter on a phone in portrait
  const p2 = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const pg = await p2.newPage(); pg.on('pageerror', e => errors.push('pageerror ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await pg.goto(require('./lib').URL); await pg.waitForFunction(() => window.__tac && __tac.state().scene === 'title');
  await sleep(300); await shot(pg, '12_phone_portrait_title');
  await pg.evaluate(() => __tac.start(2)); await pg.waitForFunction(() => __tac.state().scene === 'battle' && __tac.state().ready);
  await sleep(400); await pg.tap('canvas', { position: { x: 56, y: 250 } }).catch(() => { });
  await sleep(300); await shot(pg, '13_phone_portrait_battle');
  // touch-only attack on the phone, inside an iframe like the artifact host: forecast, then the attack moment
  { const cx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); const pf = await cx.newPage();
    await pf.goto('file://' + path.join(__dirname, 'frame.html')); let fr = null; for (let i = 0; i < 60 && !fr; i++) { fr = pf.frames().find(f => f !== pf.mainFrame()); await sleep(100); }
    await fr.waitForFunction(() => window.__tac && __tac.state().scene === 'title'); await fr.evaluate(() => { __tac.seed(2); __tac.speed(10); __tac.start(0); });
    await fr.waitForFunction(() => __tac.state().scene === 'battle' && __tac.state().ready); await fr.evaluate(() => __tac.speed(1)); await sleep(300);
    const S = () => fr.evaluate(() => __tac.state());
    const tapT = async (tx, ty) => { const s = await S(); const r = await fr.evaluate(() => { const r = document.getElementById('cv').getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; }); const fe = await (await pf.$('iframe')).boundingBox(); await pf.touchscreen.tap(fe.x + r.l + (s.ox + tx * s.tile + s.tile / 2) / 320 * r.w, fe.y + r.t + (s.oy + ty * s.tile + s.tile / 2) / s.vh * r.h); await sleep(150); };
    let s0 = await S(); const lv = s0.units.find(u => u.key === 'leon'), sl = s0.units.find(u => u.id.startsWith('slime'));
    await fr.evaluate(([id, x, y]) => __tac.place(id, x, y), [sl.id, lv.x + 2, lv.y]); await sleep(200);
    await tapT(lv.x, lv.y); await tapT(lv.x + 1, lv.y); await sleep(400); await tapT(lv.x + 2, lv.y); await sleep(400); await shot(pf, '20_phone_tap_forecast');
    await fr.evaluate(() => __tac.speed(0)); await tapT(lv.x + 2, lv.y); await fr.evaluate(() => __tac.step(14)); await shot(pf, '21_phone_tap_attack'); await fr.evaluate(() => __tac.speed(1)); await cx.close(); }
  { const cx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); const pf = await cx.newPage();
    await pf.goto(require('./lib').URL); await pf.waitForFunction(() => window.__tac && __tac.state().scene === 'title');
    await pf.evaluate(() => { __tac.speed(10); __tac.start(1); }); await pf.waitForFunction(() => __tac.state().scene === 'battle' && __tac.state().ready); await pf.evaluate(() => __tac.speed(1));
    for (const [hd, nm] of [[true, '30_hd_units_phone'], [false, '30_pixel_units_phone']]) { await pf.evaluate(v => __tac.setHD(v), hd); await sleep(400); await shot(pf, nm); }
    await pf.evaluate(() => { __tac.setHD(true); __tac.talk('jin', 'おっと、そこの隊長さん。俺も雇ってくれないか? 前金で銀貨三枚だ。', 1); }); await sleep(300); await shot(pf, '32_phone_portrait_dialogue'); await cx.close(); }
  const p3 = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const pl = await p3.newPage(); await pl.goto(require('./lib').URL); await pl.waitForFunction(() => window.__tac && __tac.state().scene === 'title');
  await pl.evaluate(() => __tac.start(2)); await pl.waitForFunction(() => __tac.state().scene === 'battle' && __tac.state().ready); await sleep(300); await shot(pl, '14_phone_landscape_battle');
  await b.close();
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log('SHOTS OK');
})().catch(async e => { console.error('FAILED', e.message); process.exit(1); });
