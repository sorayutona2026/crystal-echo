// screenshots of the main scenes into tactics/test-out/
const fs = require('fs'), path = require('path');
const { launch, open, st } = require('./lib');
const { press, sleep, cursorTo, waitMode, waitState, doAction, settle, botStep, endTurn } = require('./bot');
const OUT = path.join(__dirname, '..', 'test-out'); fs.mkdirSync(OUT, { recursive: true });
const shot = async (page, name) => { await page.screenshot({ path: path.join(OUT, name + '.png') }); console.log('saved', name + '.png'); };
(async () => {
  const b = await launch(); const { page, errors } = await open(b, { query: '?seed=3' });
  await page.evaluate(() => __tac.seed(3));
  await sleep(400); await shot(page, '01_title');
  // dialogue with face
  await press(page, 'z'); await waitState(page, () => __tac.state().scene === 'card'); await sleep(900); await shot(page, '02_chapter_card');
  await press(page, 'z'); await sleep(200); await press(page, 'z'); await waitState(page, () => __tac.state().scene === 'dialogue');
  for (let i = 0; i < 3; i++) { await sleep(500); await press(page, 'z'); await sleep(100); await press(page, 'z'); }
  await sleep(1200); await shot(page, '03_dialogue');
  // jump to a battle (new session so the title is skipped)
  await page.evaluate(() => { __tac.speed(10); });
  for (let i = 0; i < 60; i++) { const s = await st(page); if (s.scene === 'battle' && s.ready) break; await press(page, 'z'); await sleep(50); }
  await page.evaluate(() => __tac.speed(1)); await sleep(300);
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
  await sleep(250); await shot(page, '07_levelup');
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
  // boss chapter on a phone in portrait
  const p2 = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const pg = await p2.newPage(); pg.on('pageerror', e => errors.push('pageerror ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await pg.goto(require('./lib').URL); await pg.waitForFunction(() => window.__tac && __tac.state().scene === 'title');
  await sleep(300); await shot(pg, '12_phone_portrait_title');
  await pg.evaluate(() => __tac.start(2)); await pg.waitForFunction(() => __tac.state().scene === 'battle' && __tac.state().ready);
  await sleep(400); await pg.tap('canvas', { position: { x: 56, y: 250 } }).catch(() => { });
  await sleep(300); await shot(pg, '13_phone_portrait_battle');
  const p3 = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const pl = await p3.newPage(); await pl.goto(require('./lib').URL); await pl.waitForFunction(() => window.__tac && __tac.state().scene === 'title');
  await pl.evaluate(() => __tac.start(2)); await pl.waitForFunction(() => __tac.state().scene === 'battle' && __tac.state().ready); await sleep(300); await shot(pl, '14_phone_landscape_battle');
  await b.close();
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log('SHOTS OK');
})().catch(async e => { console.error('FAILED', e.message); process.exit(1); });
