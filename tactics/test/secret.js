// hidden treasure + secret talk test: a sparkle appears only after a hero ends a move within 2 tiles, 調べる picks it up; a secret talk fires on its condition
const { launch, open, st } = require('./lib');
const { press, sleep, waitState, waitMode, cursorTo } = require('./bot');
(async () => {
  const b = await launch(); const { page, errors } = await open(b, { query: '?seed=6' });
  await page.evaluate(() => { __tac.setAuto(false); __tac.speed(10); __tac.start(0); });
  await waitState(page, () => __tac.state().scene === 'battle' && __tac.state().ready, null, 30000);
  const sec = id => st(page).then(s => s.secrets.find(q => q.id === id));
  let q = await sec('1-t1'); if (!q || q.seen) throw new Error('secret should start hidden'); // (13,1)
  await page.evaluate(() => __tac.place('leon', 13, 5)); await sleep(100);
  if ((await sec('1-t1')).seen) throw new Error('placing a unit must not reveal');
  await cursorTo(page, 13, 5); await press(page, 'z'); await waitMode(page, 'move');
  await cursorTo(page, 13, 4); await press(page, 'z'); await waitMode(page, 'menu'); // 3 tiles away: still hidden
  if ((await sec('1-t1')).seen) throw new Error('revealed from 3 tiles'); await press(page, 'x'); await waitMode(page, 'move');
  await cursorTo(page, 13, 3); await press(page, 'z'); await waitMode(page, 'menu'); // 2 tiles away
  if (!(await sec('1-t1')).seen) throw new Error('not revealed within 2 tiles');
  let s = await st(page); if (s.menu.items.some(i => i.label === '調べる')) throw new Error('調べる offered off the tile');
  await press(page, 'x'); await waitMode(page, 'move');
  await cursorTo(page, 13, 1); await press(page, 'z'); await waitMode(page, 'menu');
  s = await st(page); const i = s.menu.items.findIndex(x => x.label === '調べる'); if (i < 0) throw new Error('no 調べる on the sparkle tile: ' + JSON.stringify(s.menu.items));
  await press(page, 'ArrowDown', i - s.menu.idx); await press(page, 'z');
  await waitState(page, () => { const t = __tac.state(); return t.found.length > 0 && t.ready; }, null, 10000);
  s = await st(page); if (s.gain.drops.str !== 1 || !(await sec('1-t1')).got) throw new Error('treasure not collected ' + JSON.stringify(s.gain));
  console.log('treasure 1-t1 revealed at 2 tiles, picked up: 力のしずく', JSON.stringify(s.gain.drops));
  // secret talk: Sophia stands on the graveyard tile in chapter 2 (reward: bond points)
  await page.goto(require('./lib').URL + '?seed=7'); await page.waitForFunction(() => window.__tac && __tac.state().scene === 'title');
  await page.evaluate(() => { __tac.setAuto(false); __tac.speed(10); __tac.start(1); });
  await waitState(page, () => __tac.state().scene === 'battle' && __tac.state().ready, null, 30000);
  const bond0 = await page.evaluate(() => __tac.bondOf('mira', 'sophia'));
  await page.evaluate(() => __tac.place('sophia', 2, 4)); await waitState(page, () => __tac.state().dlg, null, 8000);
  for (let k = 0; k < 40; k++) { s = await st(page); if (s.found.includes('2-k1') && !s.dlg) break; await press(page, 'z'); await sleep(80); }
  s = await st(page); if (!s.found.includes('2-k1')) throw new Error('secret talk not recorded ' + JSON.stringify(s.found));
  const bond1 = await page.evaluate(() => __tac.bondOf('mira', 'sophia')); if (bond1 !== bond0 + 2) throw new Error('bond reward ' + bond0 + ' -> ' + bond1);
  console.log('secret talk 2-k1 fired on the graveyard tile; bond', bond0, '->', bond1);
  // the thief senses treasure from 4 tiles (chapter 3: 3-t2 at 4,6); other heroes do not
  await page.goto(require('./lib').URL + '?seed=8'); await page.waitForFunction(() => window.__tac && __tac.state().scene === 'title');
  await page.evaluate(() => { __tac.setAuto(false); __tac.speed(10); __tac.start(2, false, ['leon', 'jin', 'mira', 'luka']); });
  await waitState(page, () => __tac.state().scene === 'battle' && __tac.state().ready, null, 30000);
  await page.evaluate(() => { __tac.place('jin', 4, 12); __tac.place('leon', 6, 10); });
  await cursorTo(page, 6, 10); await press(page, 'z'); await waitMode(page, 'move'); await cursorTo(page, 6, 10); await press(page, 'z'); await waitMode(page, 'menu'); // leon ends a move 4 tiles away
  if ((await st(page)).secrets.find(q => q.id === '3-t2').seen) throw new Error('non-thief sensed from 4 tiles'); await press(page, 'x'); await waitMode(page, 'move'); await press(page, 'x'); await sleep(100);
  await cursorTo(page, 4, 12); await press(page, 'z'); await waitMode(page, 'move'); await cursorTo(page, 4, 10); await press(page, 'z'); await waitMode(page, 'menu');
  if (!(await st(page)).secrets.find(q => q.id === '3-t2').seen) throw new Error('thief did not sense from 4 tiles'); console.log('Jin senses treasure from 4 tiles');
  await b.close();
  if (errors.length) throw new Error('page errors: ' + errors.join(' | ')); console.log('SECRET OK');
})().catch(e => { console.error(e); process.exit(1); });
