// screenshots of each theme with monsters in view, plus the end screens (saved to test-out/mystery/)
const { open } = require('./lib');
(async () => {
  const { browser, page, errors, shot } = await open();
  for (const [f, ks] of [[2, ['moya', 'neko']], [5, ['moufu', 'neko', 'moya']], [8, ['wani', 'kumo', 'piero']]]) {
    await page.evaluate(([f, ks]) => {
      const N = __nm, G = N.G; N.setSeed(40 + f); N.newGame(); G.scene = N.Dungeon; N.enterFloor(f); G.fade = 0; G.card = 0;
      // put the given monsters around Haru inside his room
      const p = G.p; let i = 0;
      for (const [dx, dy] of [[2, 0], [-2, 1], [1, -2], [0, 2], [-2, -1]]) {
        if (i >= ks.length) break; const x = p.x + dx, y = p.y + dy;
        if (!N.passable(G.F, x, y) || G.mons.some(m => m.x === x && m.y === y)) continue;
        const m = N.spawnMonster(false); if (!m) break; m.k = ks[i++]; m.x = x; m.y = y; m.rx = x * 16; m.ry = y * 16; m.asleep = false; m.dir = [Math.sign(p.x - x) || -1, 0];
      }
      N.dropItem('heal', p.x + 1, p.y + 1); N.dropItem('star', p.x - 1, p.y + 1);
      G.F.seen.fill(1); // show the whole minimap in the shot
      TT.run(30);
    }, [f, ks]);
    await shot(`theme-${f}F`);
  }
  await page.evaluate(() => { __nm.G.cause = 'ガイコツピエロに やられた'; __nm.GameOver.start(); TT.run(80); });
  await shot('gameover');
  await page.evaluate(() => { __nm.Clear.start(); TT.run(100); });
  await shot('clear');
  if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
  console.log('shots saved');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
