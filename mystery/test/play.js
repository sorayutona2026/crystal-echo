// a bot plays おもちゃの森 from 1F through 10F with real inputs (direction keys, A, B, the menu)
// SEED=n picks the dungeon; RUNS=n plays several seeds and reports how far each got
const { open } = require('./lib');
(async () => {
  const { browser, page, errors, shot } = await open();
  const seed0 = Number(process.env.SEED || 11), runs = Number(process.env.RUNS || 1);
  const results = [];
  for (let r = 0; r < runs; r++) {
    const res = await page.evaluate(seed => {
      const N = __nm, G = N.G;
      N.setSeed(seed); N.newGame(); G.scene = N.Dungeon; N.enterFloor(1); G.fade = 0; G.fadeIn = false;
      const key = (dx, dy) => [dy < 0 ? 'up' : dy > 0 ? 'down' : null, dx < 0 ? 'left' : dx > 0 ? 'right' : null].filter(Boolean);
      const useItem = kind => { // MENU -> 道具 -> item -> first command, all by key presses
        const i = G.bag.findIndex(it => N.ITEMS[it.k].kind === kind); if (i < 0) return false;
        TT.press('menu'); TT.press('a'); for (let k = 0; k < i; k++) TT.press('down'); TT.press('a'); TT.press('a'); TT.idle(); return true;
      };
      let guard = 0, lastFloor = 1, floorTurns = 0;
      while (G.scene === N.Dungeon && guard++ < 20000) {
        if (G.prompt) { TT.press('a'); TT.idle(); continue; }
        if (G.busy || G.p.sleep > 0 || !N.settled(G.p)) { N.step(); continue; }
        const F = G.F, p = G.p;
        if (F.floor !== lastFloor) { lastFloor = F.floor; floorTurns = 0; }
        if (++floorTurns > 1500) break; // stuck
        // 1) heal / eat when needed
        if (p.hp < p.mhp * 0.4 && useItem('heal')) continue;
        if (p.mado < 15 && useItem('food')) continue;
        // 2) fight an adjacent monster
        const adj = G.mons.find(m => Math.max(Math.abs(m.x - p.x), Math.abs(m.y - p.y)) === 1 && N.canStep(F, p.x, p.y, m.x - p.x, m.y - p.y));
        if (adj) { TT.hold(key(adj.x - p.x, adj.y - p.y)); TT.idle(); continue; }
        // 3) go to: stairs if known and (hungry or done looting), else visible items, else the nearest unexplored edge
        const seen = (x, y) => F.seen[y * N.MW + x];
        const stairsKnown = seen(F.stairs.x, F.stairs.y);
        let goal = null;
        const items = G.items.filter(it => seen(it.x, it.y) && p.mado > 10);
        if (items.length) goal = items.sort((a, b) => Math.max(Math.abs(a.x - p.x), Math.abs(a.y - p.y)) - Math.max(Math.abs(b.x - p.x), Math.abs(b.y - p.y)))[0];
        // head for the stairs when starving or after a long time on the floor, otherwise explore everything first
        if (!goal && stairsKnown && (p.mado < 15 || floorTurns > 500)) goal = F.stairs;
        let D;
        if (goal) D = N.distField(F, goal.x, goal.y);
        else { // frontier: walkable seen tiles next to unseen ones, nearest by path
          const Dp = N.distField(F, p.x, p.y); let best = 1e9;
          for (let y = 1; y < N.MH - 1; y++) for (let x = 1; x < N.MW - 1; x++) {
            const i = y * N.MW + x; if (!seen(x, y) || !N.passable(F, x, y) || Dp[i] < 0) continue;
            let edge = false; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!seen(x + dx, y + dy)) edge = true;
            if (edge && Dp[i] > 0 && Dp[i] < best) { best = Dp[i]; goal = { x, y }; }
          }
          if (!goal) goal = F.stairs; // everything seen
          D = N.distField(F, goal.x, goal.y);
        }
        if (goal.x === p.x && goal.y === p.y) { // standing on the goal: an item that could not be taken, or the stairs
          if (goal === F.stairs) { TT.press('menu'); TT.press('down'); TT.press('a'); TT.press('a'); TT.idle(); continue; }
          G.items = G.items.filter(it => it !== goal); continue;
        }
        let step = null, bd = D[p.y * N.MW + p.x];
        for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]]) {
          const v = D[(p.y + dy) * N.MW + p.x + dx];
          if (v >= 0 && v < bd && N.canStep(F, p.x, p.y, dx, dy)) { bd = v; step = [dx, dy]; }
        }
        if (!step) { TT.press('b'); TT.idle(); continue; }
        TT.hold(key(step[0], step[1])); TT.idle();
      }
      const sc = G.scene === N.Clear ? 'CLEAR' : G.scene === N.GameOver ? 'GAMEOVER' : 'STUCK';
      return { seed, result: sc, floor: G.F.floor, lv: G.p.lv, hp: G.p.hp, turn: G.turn, cause: G.cause, bag: G.bag.length, stars: G.stars };
    }, seed0 + r);
    console.log(JSON.stringify(res));
    results.push(res);
    if (r === 0) await shot('play-end');
  }
  const clear = results.filter(r => r.result === 'CLEAR').length;
  console.log(`cleared ${clear}/${runs}`);
  if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
  if (runs === 1 && results[0].result !== 'CLEAR') process.exit(1);
  if (results.some(r => r.result === 'STUCK')) process.exit(1);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
