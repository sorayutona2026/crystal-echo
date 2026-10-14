// Trial Tower test: camp (ch2, tower unlocked) -> 試練の塔 -> 1階 by auto -> choose 帰還 -> best floor 1, gold kept; then a defeat keeps EXP, loses gold, injures nobody
const { launch, open, st } = require('./lib');
const { press, sleep, waitState } = require('./bot');
const roster = page => page.evaluate(() => __tac.roster());
(async () => {
  const b = await launch(); const { page, errors } = await open(b, { query: '?seed=4' });
  await page.evaluate(() => { __tac.setAuto(false); __tac.speed(10); __tac.start(1, true); });
  await waitState(page, () => __tac.state().scene === 'base', null, 30000);
  let s = await st(page); const row = s.base.rows.indexOf('試練の塔'); if (row < 0) throw new Error('no tower row: ' + s.base.rows.join(','));
  const g0 = (await roster(page)).meta.gold;
  await press(page, 'ArrowDown', row); await sleep(60); await press(page, 'z'); await sleep(100);
  s = await st(page); if (s.base.title !== '試練の塔') throw new Error('tower view not open: ' + s.base.title); console.log('camp rows:', s.base.rows.slice(0, 4).join(' | '));
  // ---- run 1: clear floor 1 with the auto AI, go home
  await press(page, 'z'); // 1階から挑戦
  await waitState(page, () => __tac.state().scene === 'card', null, 8000); await page.evaluate(() => __tac.setAuto(true));
  await waitState(page, () => __tac.state().scene === 'tower', null, 120000);
  s = await st(page); console.log('floor choice:', s.title.items.join(' / ')); if (s.title.items.length !== 2) throw new Error('choice items');
  await page.evaluate(() => __tac.setAuto(false)); await press(page, 'ArrowDown'); await press(page, 'z');
  await waitState(page, () => __tac.state().scene === 'base', null, 20000);
  let r = await roster(page); const T = r.meta.tower;
  if (!T || T.best !== 1) throw new Error('best floor ' + JSON.stringify(T)); if (r.meta.gold <= g0) throw new Error('no gold reward ' + g0 + ' -> ' + r.meta.gold);
  const ls = await page.evaluate(() => { try { return localStorage.getItem('starfall_tactics_tower_best'); } catch (e) { return 'n/a'; } }); if (ls !== '1' && ls !== 'n/a') throw new Error('localStorage best ' + ls);
  if (Object.values(r.roster).some(u => u.injured > 0)) throw new Error('injury in tower');
  s = await st(page); if (s.base.title !== '試練の塔') throw new Error('not back in the tower view: ' + s.base.title); console.log('floor 1 cleared; gold', g0, '->', r.meta.gold, 'best', T.best, 'localStorage', ls);
  // ---- run 2 (from the 2nd floor): lose on purpose
  await press(page, 'ArrowDown'); await sleep(40); s = await st(page); // select 2階から挑戦
  if (s.base.idx !== 1) throw new Error('row idx ' + s.base.idx); await press(page, 'z');
  await waitState(page, () => __tac.state().scene === 'card', null, 8000); await press(page, 'z');
  await waitState(page, () => __tac.state().scene === 'battle' && __tac.state().ready, null, 30000);
  const gold1 = (await roster(page)).meta.gold;
  await page.evaluate(() => __tac.kill('leon'));
  await waitState(page, () => __tac.state().scene === 'dialogue', null, 20000); for (let i = 0; i < 6 && (await st(page)).scene !== 'base'; i++) { await press(page, 'z'); await sleep(150); }
  await waitState(page, () => __tac.state().scene === 'base', null, 10000);
  r = await roster(page); if (r.meta.gold !== gold1) throw new Error('gold changed on defeat'); if (Object.values(r.roster).some(u => u.injured > 0 || u.dead || u.hp < u.maxhp)) throw new Error('hero hurt after defeat');
  if (r.meta.tower.best !== 1) throw new Error('best changed on defeat');
  console.log('defeat: returned to camp, nobody injured, best stays', r.meta.tower.best);
  if (errors.length) throw new Error('page errors: ' + errors.join(' | ')); console.log('TOWER OK'); await b.close();
})().catch(e => { console.error(e); process.exit(1); });
