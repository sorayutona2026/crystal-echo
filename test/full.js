require('fs').mkdirSync('test-out/shots', { recursive: true }); require('fs').mkdirSync('test-out/g', { recursive: true });
const { chromium } = require(process.env.PW_PATH || 'playwright');
const path = require('path'); const fs = require('fs');
const OUT = process.env.OUT || 'test-out/shots'; fs.mkdirSync(OUT, { recursive: true });
const SEED = +(process.env.SEED || 11);
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 420, height: 860 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + e.stack));
  page.on('console', m => { const t = m.text(); if ((m.type() === 'error' || m.type() === 'warning') && !/ERR_TUNNEL|fonts|Failed to load resource/.test(t)) errors.push(m.type() + ': ' + t); });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForFunction(() => window.__rpg && window.__rpg.G.scene, null, { timeout: 8000 });
  await page.evaluate(() => { window.__manual = true; });
  await page.addScriptTag({ path: path.resolve(__dirname, 'bot.js') });
  const shot = async n => { await page.evaluate(() => __rpg.render()); await page.screenshot({ path: `${OUT}/${n}.png`, clip: { x: 0, y: 0, width: 420, height: 400 } }); };

  // ---------- static map validation ----------
  const problems = await page.evaluate(() => {
    const R = __rpg; const MAPS = R.MAPS(); const out = [];
    const solid = (m, x, y) => { const ch = m.g[y] && m.g[y][x]; if (ch == null) return true; const d = R.TILESETS[m.set][ch]; if (!d) { return true; } return !!d[1]; };
    const reach = (m, sx, sy) => { const seen = new Set([sx + ',' + sy]); const q = [[sx, sy]]; while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (seen.has(k) || nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || solid(m, nx, ny)) continue; seen.add(k); if (m.warps && m.warps[k]) continue; q.push([nx, ny]); } } return seen; };
    const entries = {};
    for (const id in MAPS) {
      const m = MAPS[id];
      if (m.g.length !== m.h) out.push(`${id}: height mismatch`);
      m.g.forEach((r, y) => { if (r.length !== m.w) out.push(`${id}: row ${y} width ${r.length}`); r.forEach((ch, x) => { if (!R.TILESETS[m.set][ch]) out.push(`${id}: unknown tile '${ch}' at ${x},${y}`); }); });
      for (const k in (m.warps || {})) { const w = m.warps[k]; const t = MAPS[w.map]; if (!t) { out.push(`${id}: warp to missing ${w.map}`); continue; } if (solid(t, w.x, w.y)) out.push(`${id} ${k}: warp target ${w.map} ${w.x},${w.y} is solid`); (entries[w.map] = entries[w.map] || []).push([w.x, w.y, id]); const [x, y] = k.split(',').map(Number); if (solid(m, x, y)) out.push(`${id}: warp tile ${k} solid`); }
      if (m.exit) { const t = MAPS[m.exit.map]; (entries[m.exit.map] = entries[m.exit.map] || []).push([m.exit.x, m.exit.y, id]); if (solid(t, m.exit.x, m.exit.y)) out.push(`${id}: exit target solid`); }
    }
    // each map: from every entry, everything important should be reachable
    for (const id in MAPS) {
      const m = MAPS[id]; if (id === 'world') continue;
      const ent = entries[id] || []; if (!ent.length) { out.push(`${id}: no entries`); continue; }
      const sets = ent.map(([x, y]) => reach(m, x, y)); const all = sets[0];
      sets.forEach((st, si) => { for (const k of sets[0]) if (!st.has(k)) { out.push(`${id}: entry from ${ent[si][2]} (${ent[si][0]},${ent[si][1]}) cannot reach ${k}`); break; } });
      const near = (x, y) => [[0, 1], [1, 0], [0, -1], [-1, 0]].some(([dx, dy]) => all.has((x + dx) + ',' + (y + dy)) || (m.set === 'inside' && m.g[y + dy] && m.g[y + dy][x + dx] === 'c' && all.has((x + 2 * dx) + ',' + (y + 2 * dy))));
      for (const k in (m.warps || {})) if (!all.has(k)) out.push(`${id}: warp ${k} unreachable`);
      for (const k in (m.chests || {})) { const [x, y] = k.split(',').map(Number); if (!near(x, y)) out.push(`${id}: chest ${k} unreachable`); if (m.g[y][x] !== 'B') out.push(`${id}: chest ${k} not on B tile`); }
      for (const n of (m.npcs || [])) { if (!near(n.x, n.y)) out.push(`${id}: npc ${n.id} not talkable`); if (solid(m, n.x, n.y)) out.push(`${id}: npc ${n.id} on solid tile`); }
      for (const k in (m.triggers || {})) if (!all.has(k)) out.push(`${id}: trigger ${k} unreachable`);
      for (const k in (m.signs || {})) { const [x, y] = k.split(',').map(Number); if (!near(x, y)) out.push(`${id}: sign ${k} unreachable`); }
      // town edge exit must be reachable
      if (m.exit) { let ok = false; for (const k of all) { const [x, y] = k.split(',').map(Number); if (x === 0 || y === 0 || x === m.w - 1 || y === m.h - 1) ok = true; } if (!ok) out.push(`${id}: edge exit unreachable`); }
    }
    // world connectivity
    const w = MAPS.world; const N = reach(w, 9, 7);
    if (!N.has('24,13')) out.push('world: cave entrance unreachable from village');
    if (N.has('10,24')) out.push('world: Rosa reachable without cave (gating broken)');
    const S = reach(w, 24, 17);
    if (!S.has('10,24')) out.push('world: Rosa unreachable from cave exit');
    if (!S.has('37,24')) out.push('world: tower unreachable from cave exit');
    // formations reference real enemies
    for (const k in R.FORMATIONS) for (const f of R.FORMATIONS[k]) for (const e of f) if (!R.ENEMIES[e]) out.push('formation ' + k + ' bad enemy ' + e);
    for (const k in R.ENEMIES) { const ai = R.ENEMIES[k].ai; if (Array.isArray(ai)) for (const a of ai) if (!R.SKILLS[a[0]]) out.push('enemy ' + k + ' bad skill ' + a[0]); }
    for (const h in R.HEROES) for (const [s] of R.HEROES[h].skills) if (!R.SKILLS[s]) out.push('hero ' + h + ' bad skill ' + s);
    return out;
  });
  console.log('MAP CHECK:', problems.length ? '\n  ' + problems.join('\n  ') : 'OK');

  // ---------- full playthrough by bot ----------
  const run = async (label, fn) => {
    try { await page.evaluate(fn); } catch (e) { console.log('FAIL at', label, e.message.split('\n')[0]); const lg = await page.evaluate(() => BOT.log.slice(-5)); console.log(lg.join('\n')); await shot('fail'); throw e; }
  };
  await page.evaluate(s => { __rpg.setSeed(s); }, SEED);
  try {
    await run('intro', () => { __rpg.newGame(); BOT.settle(); BOT.status('start'); });
    await run('elder', () => { BOT.warpTo('elder', 5, 5); BOT.talk(6, 2); if (!__rpg.G.flags.quest) throw new Error('quest flag not set'); BOT.warpTo('elm', 4, 7); });
    await shot('p01-elm');
    await run('shop', () => {
      BOT.warpTo('shopElm', 5, 13); BOT.walkTo(3, 4); BOT.press('up'); BOT.press('a'); BOT.settle();
      if (!__rpg.Shop.active) throw new Error('shop did not open');
      BOT.shopBuy(['iron']); BOT.equipBest(); BOT.warpTo('elm', 4, 7); BOT.status('after shop');
    });
    await run('leave elm', () => { BOT.walkTo(12, 18); BOT.exitEdge('down'); if (__rpg.G.mapId !== 'world') throw new Error('not on world'); });
    await shot('p02-world');
    await run('grind north', () => { BOT.grind(4, 9, 10, 15, 10); BOT.status('north grind'); });
    await run('to cave', () => { BOT.warpTo('cave', 24, 13); });
    await run('cave chests', () => { BOT.walkTo(27, 1, { adjacent: true }); BOT.press('a'); BOT.settle(); BOT.walkTo(27, 11, { adjacent: true }); BOT.press('a'); BOT.settle(); BOT.walkTo(1, 19, { adjacent: true }); BOT.press('a'); BOT.settle(); BOT.equipBest(); BOT.status('cave chests'); });
    await shot('p03-cave');
    await run('cave grind', () => { BOT.grind(6, 4, 17, 15, 18); __rpg.healAll(); BOT.stats.cheatHeals++; BOT.status('before gking'); });
    await run('gking', () => { window.__allowTrig = true; BOT.walkTo(21, 18); window.__allowTrig = false; BOT.settle(); if (!__rpg.G.flags.cave_boss) throw new Error('boss not beaten'); if (__rpg.G.party.length !== 3) throw new Error('kai not joined'); BOT.status('after gking'); });
    await run('exit cave', () => { BOT.warpTo('world', 28, 17); });
    await run('to rosa', () => { BOT.warpTo('rosa', 10, 24); });
    await shot('p04-rosa');
    await run('pub', () => { BOT.warpTo('pub', 20, 13); BOT.talk(9, 5); if (!__rpg.G.flags.zek) throw new Error('zek not joined'); BOT.warpTo('rosa', 5, 8); BOT.status('zek joined'); });
    await run('smith', () => {
      BOT.warpTo('smithRosa', 5, 13); BOT.walkTo(3, 4); BOT.press('up'); BOT.press('a'); BOT.settle();
      const want = ['wizard', 'cleric', 'mythril', 'mdagger'].filter(id => __rpg.G.gil >= __rpg.ITEMS[id].price);
      BOT.shopBuy(want.slice(0, 2)); BOT.equipBest(); BOT.warpTo('rosa', 4, 7); BOT.status('after smith');
    });
    await run('leave rosa', () => { BOT.walkTo(13, 0); BOT.exitEdge('up'); });
    await run('grind south', () => { BOT.grind(9, 14, 22, 20, 24); BOT.status('south grind'); });
    await run('tower', () => { BOT.warpTo('tower1', 37, 24); if (!__rpg.G.flags.towerOpen) throw new Error('tower not opened'); });
    await shot('p05-tower1');
    await run('tower1 chests', () => { BOT.walkTo(3, 4, { adjacent: true }); BOT.press('a'); BOT.settle(); BOT.walkTo(14, 4, { adjacent: true }); BOT.press('a'); BOT.settle(); BOT.equipBest(); });
    await run('tower1 grind', () => { BOT.grind(10, 2, 8, 17, 8); __rpg.healAll(); BOT.stats.cheatHeals++; BOT.status('before guardian'); });
    await run('guardian', () => { BOT.talk(8, 4); if (!__rpg.G.flags.guardian) throw new Error('guardian alive'); BOT.status('after guardian'); });
    await run('tower2', () => { BOT.warpTo('tower2', 8, 1); BOT.walkTo(3, 3, { adjacent: true }); BOT.press('a'); BOT.settle(); BOT.walkTo(12, 7, { adjacent: true }); BOT.press('a'); BOT.settle(); BOT.walkTo(5, 13, { adjacent: true }); BOT.press('a'); BOT.settle(); BOT.equipBest(); BOT.status('tower2 chests'); });
    await shot('p06-tower2');
    await run('tower2 grind', () => { BOT.grind(12, 1, 1, 18, 9); BOT.walkTo(17, 13); BOT.status('before garva'); });
    await run('tower3', () => { BOT.warpTo('tower3', 18, 13); BOT.walkTo(8, 11); });
    await shot('p07-tower3');
    await run('garva', () => { window.__allowTrig = true; BOT.walkTo(9, 6); window.__allowTrig = false; BOT.settle(); BOT.status('after garva'); if (__rpg.G.scene !== __rpg.Ending) throw new Error('no ending, scene ok? flags ' + JSON.stringify(__rpg.G.flags)); });
    await page.evaluate(() => BOT.stepN(400));
    await shot('p08-ending');
    await page.evaluate(() => BOT.stepN(5000));
    await shot('p09-theend');
    await run('back to title', () => { BOT.press('a'); BOT.stepN(60); if (__rpg.G.scene !== __rpg.Title) throw new Error('not title'); });
    console.log('PLAYTHROUGH: COMPLETE');
  } catch (e) { console.log('PLAYTHROUGH: FAILED'); }
  const lg = await page.evaluate(() => [BOT.log, BOT.stats]);
  console.log(lg[0].join('\n')); console.log('stats', JSON.stringify(lg[1]));
  console.log('ERRORS', errors.length ? errors.slice(0, 10).join('\n') : 'none');
  await browser.close();
})();
