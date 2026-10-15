// boots, starts a game through the intro, walks, opens menus; fails on any page error
const { open } = require('./lib');
(async () => {
  const { browser, page, errors, shot } = await open();
  await page.evaluate(() => TT.run(40));
  await shot('01-title');
  await page.evaluate(() => { __nm.setSeed(3); TT.press('a'); TT.run(30); });
  await shot('02-intro');
  await page.evaluate(() => { for (let i = 0; i < 8; i++) { TT.press('a'); TT.run(25); } TT.run(40); });
  const st = await page.evaluate(() => ({ scene: __nm.G.scene === __nm.Dungeon, floor: __nm.G.F && __nm.G.F.floor, hp: __nm.G.p.hp }));
  console.log('after intro', JSON.stringify(st));
  if (!st.scene || st.floor !== 1) throw new Error('did not reach 1F');
  await page.evaluate(() => TT.run(120));
  await shot('03-floor1');
  // walk a little in each direction (including diagonals)
  const moved = await page.evaluate(() => {
    const p = __nm.G.p, t0 = __nm.G.turn;
    for (const ks of [['right'], ['down'], ['left'], ['up'], ['up', 'left'], ['down', 'right']]) for (let i = 0; i < 3; i++) { TT.hold(ks); TT.idle(); __nm.G.prompt = null; }
    return __nm.G.turn - t0;
  });
  console.log('turns used by walking', moved);
  await shot('04-walked');
  await page.evaluate(() => { TT.press('menu'); TT.run(5); });
  await shot('05-menu');
  await page.evaluate(() => { TT.press('a'); TT.run(5); });
  await shot('06-bag');
  await page.evaluate(() => { TT.press('b'); TT.press('b'); TT.run(5); TT.press('b'); TT.run(30); });
  const turnsBefore = await page.evaluate(() => __nm.G.turn);
  await page.evaluate(() => { TT.press('b'); TT.idle(); });
  const turnsAfter = await page.evaluate(() => __nm.G.turn);
  console.log('step in place', turnsBefore, '->', turnsAfter);
  if (turnsAfter !== turnsBefore + 1) throw new Error('B tap should pass exactly one turn');
  if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
  console.log('SMOKE OK');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
