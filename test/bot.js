// In-page test bot. Drives the game through simulated inputs.
(function () {
  const R = window.__rpg, G = R.G;
  const log = [];
  const stepN = n => { for (let i = 0; i < n; i++) R.step(); };
  const press = (k, hold = 1) => { R.Input.down[k] = true; for (let i = 0; i < hold; i++) R.step(); R.Input.down[k] = false; R.step(); R.step(); };
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const stats = { battles: 0, wins: 0, escapes: 0, cheatHeals: 0, frames: 0 };

  function sk(id) { return R.SKILLS[id]; }
  // the game's own auto-battle AI picks every command
  function decide() { const M = R.B.menu; R.BMenu.close(R.Battle.autoAction(M.who)); }
  const inBattle = () => G.scene === R.BattleTrans || G.scene === R.Battle;
  function battleLoop() {
    let guard = 0;
    while (guard++ < 60000) {
      if (G.scene === R.GameOver) break;
      if (!inBattle() && !R.transitioning()) break;
      const B = R.B;
      if (B && B.menu && B.menu.stage === 'cmd') { decide(); continue; }
      if (B && B.waitKey) { press('a'); continue; }
      R.step();
    }
    stats.frames += guard;
    if (guard >= 60000) throw new Error('battle loop stuck');
  }
  function settle(choice = 0) {
    let guard = 0;
    while (guard++ < 20000) {
      if (G.scene === R.GameOver) throw new Error('GAME OVER at ' + G.mapId + ' lv ' + G.party.map(p => p.lv));
      if (inBattle()) { stats.battles++; battleLoop(); if (G.scene === R.GameOver) throw new Error('GAME OVER in battle at ' + G.mapId + ' lv ' + G.party.map(p => p.lv)); stats.wins++; continue; }
      if (G.scene !== R.Field) return;
      if (R.Shop.active) return;
      if (G.script) { if (G.choice) { if (G.choice.i !== choice) { press('down'); continue; } press('a'); continue; } press('a'); continue; }
      if (G.fadeLevel > 0 || G.p.moving || R.transitioning()) { R.step(); continue; }
      return;
    }
    throw new Error('settle stuck');
  }
  function bfs(tx, ty, adjacent) {
    const m = G.map; const sx = G.p.x, sy = G.p.y; const key = (x, y) => x + ',' + y;
    const prev = new Map([[key(sx, sy), null]]); const q = [[sx, sy]];
    const goal = (x, y) => adjacent ? Math.abs(x - tx) + Math.abs(y - ty) === 1 : (x === tx && y === ty);
    while (q.length) {
      const [x, y] = q.shift(); if (goal(x, y)) { const path = []; let k = key(x, y); while (prev.get(k)) { const [px, py, d] = prev.get(k); path.unshift(d); k = key(px, py); } return path; }
      for (const d in DIRS) {
        const nx = x + DIRS[d][0], ny = y + DIRS[d][1]; if (prev.has(key(nx, ny))) continue;
        if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
        const ch = m.g[ny][nx]; const def = R.TILESETS[m.set][ch];
        if (!def || def[1]) continue;
        if (R.Field.npcAt(nx, ny) && !(nx === tx && ny === ty)) continue;
        // avoid warp tiles unless it is the target
        if (m.warps && m.warps[key(nx, ny)] && !(nx === tx && ny === ty)) continue;
        if (m.triggers && m.triggers[key(nx, ny)] && !(nx === tx && ny === ty) && !window.__allowTrig) continue;
        prev.set(key(nx, ny), [x, y, d]); q.push([nx, ny]);
      }
    }
    return null;
  }
  function walkTo(tx, ty, opts = {}) {
    const mapAtStart = G.mapId; let guard = 0;
    while (guard++ < 600) {
      settle(opts.choice || 0);
      if (G.scene !== R.Field) return true;
      if (G.mapId !== mapAtStart) return true;
      if (!opts.adjacent && G.p.x === tx && G.p.y === ty) return true;
      if (opts.adjacent && Math.abs(G.p.x - tx) + Math.abs(G.p.y - ty) === 1) {
        const d = Object.keys(DIRS).find(d => G.p.x + DIRS[d][0] === tx && G.p.y + DIRS[d][1] === ty);
        if (G.p.dir !== d) { R.Input.down[d] = true; R.step(); R.Input.down[d] = false; R.step(); }
        return true;
      }
      const path = bfs(tx, ty, opts.adjacent);
      if (!path) { // NPC in the way? wait
        stepN(30); if (guard > 50) throw new Error(`no path in ${G.mapId} from ${G.p.x},${G.p.y} to ${tx},${ty}`); continue;
      }
      if (!path.length) return true;
      const d = path[0]; const bx = G.p.x, by = G.p.y;
      R.Input.down[d] = true; let k = 0;
      while (k++ < 4 && G.p.x === bx && G.p.y === by) R.step();
      R.Input.down[d] = false;
      while (G.p.moving) R.step();
      R.step(); R.step();
      if (G.p.x === bx && G.p.y === by && G.scene === R.Field && !G.script) stepN(8); // blocked by NPC
    }
    throw new Error('walk stuck');
  }
  function talk(x, y, choice = 0) { walkTo(x, y, { adjacent: true }); press('a'); settle(choice); }
  function warpTo(map, x, y) { walkTo(x, y); settle(); if (G.mapId !== map) throw new Error(`expected ${map} got ${G.mapId} at ${G.p.x},${G.p.y}`); }
  function exitEdge(dir) { // walk off map edge
    let guard = 0; const start = G.mapId;
    while (G.mapId === start && guard++ < 200) {
      const [dx, dy] = DIRS[dir];
      if ((dir === 'down' && G.p.y === G.map.h - 1) || (dir === 'up' && G.p.y === 0)) { R.Input.down[dir] = true; R.step(); R.Input.down[dir] = false; settle(); continue; }
      walkTo(G.p.x, dir === 'down' ? G.map.h - 1 : 0);
    }
  }
  function grind(targetLv, x1, y1, x2, y2, maxBattles = 200) {
    let n = 0; const start = stats.battles;
    while (Math.min(...G.party.map(p => p.lv)) < targetLv && stats.battles - start < maxBattles) {
      walkTo(x1, y1); walkTo(x2, y2); n++;
      const lowHp = G.party.some(p => p.hp < R.stats(p).maxhp * 0.5);
      if (lowHp) { R.healAll(); stats.cheatHeals++; }
      if (n > 400) break;
    }
  }
  function shopBuy(ids) {
    // assumes the shop UI is open
    const S = R.Shop; if (!S.active) throw new Error('shop not open');
    press('a'); // かう
    for (const id of ids) {
      const idx = S.list.indexOf(id); if (idx < 0) throw new Error('not sold ' + id);
      let g = 0; while (S.li !== idx && g++ < 20) press('down');
      const before = G.inv[id] || 0; press('a'); press('a');
      if ((G.inv[id] || 0) !== before + 1) log.push('could not buy ' + id + ' gil ' + G.gil);
    }
    press('b'); press('b'); settle();
  }
  function equipBest() {
    for (const m of G.party) for (const slot of ['weapon', 'armor']) {
      const cands = Object.keys(G.inv).filter(id => R.ITEMS[id].type === slot && R.ITEMS[id].eq.includes(m.id));
      for (const id of cands) {
        const cur = R.ITEMS[m[slot]], nw = R.ITEMS[id];
        const score = it => (it.atk || 0) + (it.mag || 0) * 1.5 + (it.def || 0) + (it.mdf || 0);
        if (score(nw) > score(cur)) { R.addItem(m[slot]); G.inv[id]--; if (!G.inv[id]) delete G.inv[id]; m[slot] = id; }
      }
    }
  }
  function status(tag) { log.push(`${tag}: map=${G.mapId} lv=${G.party.map(p => p.id + p.lv).join(',')} gil=${G.gil} battles=${stats.battles} heals=${stats.cheatHeals} inv=${JSON.stringify(G.inv)}`); }
  window.BOT = { log, stats, press, stepN, settle, walkTo, talk, warpTo, exitEdge, grind, shopBuy, equipBest, status, bfs, battleLoop, decide };
})();
