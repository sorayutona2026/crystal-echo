// In-page test bot. Drives the game through simulated inputs.
(function () {
  const R = window.__rpg, G = R.G;
  const log = [];
  const stepN = n => { for (let i = 0; i < n; i++) R.step(); };
  const press = (k, hold = 1) => { R.Input.down[k] = true; for (let i = 0; i < hold; i++) R.step(); R.Input.down[k] = false; R.step(); R.step(); };
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const stats = { battles: 0, wins: 0, escapes: 0, cheatHeals: 0, frames: 0 };

  function sk(id) { return R.SKILLS[id]; }
  function decide() {
    const B = R.B, M = B.menu, m = G.party[M.who];
    const me = m.id, S = R.stats(m);
    const alive = G.party.map((p, i) => i).filter(i => G.party[i].hp > 0);
    const dead = G.party.map((p, i) => i).filter(i => G.party[i].hp <= 0);
    const ratio = i => G.party[i].hp / R.stats(G.party[i]).maxhp;
    const low = alive.filter(i => ratio(i) < 0.45).sort((a, b) => ratio(a) - ratio(b));
    const ens = B.enemies.filter(e => e.alive);
    const boss = ens.some(e => e.d.boss);
    const known = R.HEROES[me].skills.filter(s => m.lv >= s[1]).map(s => s[0]);
    const can = id => known.includes(id) && m.mp >= sk(id).mp;
    const tgtE = () => { const e = ens.slice().sort((a, b) => a.hp - b.hp)[0]; return { side: 'e', i: e.i }; };
    const act = a => R.BMenu.close(a);
    if (me === 'lina') {
      if (dead.length && can('revive')) return act({ kind: 'skill', id: 'revive', target: { side: 'p', i: dead[0] } });
      if (low.length >= 2 && can('healall')) return act({ kind: 'skill', id: 'healall' });
      if (low.length && can('heal')) return act({ kind: 'skill', id: 'heal', target: { side: 'p', i: low[0] } });
      if (G.party.some(p => p.poison && p.hp > 0) && can('cure')) return act({ kind: 'skill', id: 'cure', target: { side: 'p', i: G.party.findIndex(p => p.poison && p.hp > 0) } });
      if (boss && can('protect') && alive.some(i => !B.pb[i].prot)) return act({ kind: 'skill', id: 'protect' });
      const fast = ['allen', 'zek'].map(id => G.party.findIndex(p => p.id === id)).find(i => i >= 0 && G.party[i].hp > 0 && !B.pb[i].haste);
      if (boss && can('haste') && fast !== undefined && low.length === 0) return act({ kind: 'skill', id: 'haste', target: { side: 'p', i: fast } });
      if (m.mp < 6 && G.inv.ether && boss) return act({ kind: 'item', id: 'ether', target: { side: 'p', i: M.who } });
      if (boss && can('holy') && m.mp > 30) return act({ kind: 'skill', id: 'holy', target: tgtE() });
    }
    const linaUp = G.party.some(p => p.id === 'lina' && p.hp > 0 && p.mp >= 3);
    if (dead.length && G.inv.phoenix) return act({ kind: 'item', id: 'phoenix', target: { side: 'p', i: dead[0] } });
    if (low.length && ratio(low[0]) < 0.3 && (!linaUp || boss)) { const pot = G.inv.hipotion ? 'hipotion' : G.inv.potion ? 'potion' : null; if (pot) return act({ kind: 'item', id: pot, target: { side: 'p', i: low[0] } }); }
    if (me === 'zek') {
      if (ens.length >= 2 && can('meteor') && boss === false && ens.length >= 3) return act({ kind: 'skill', id: 'meteor' });
      if (boss && can('meteor')) return act({ kind: 'skill', id: 'meteor' });
      if (ens.length >= 2 && can('blaze') && !ens.some(e => (e.d.absorb || []).includes('fire'))) return act({ kind: 'skill', id: 'blaze' });
      const t = tgtE(); const e = B.enemies[t.i]; const weak = (e.d.weak || []).find(w => ['fire', 'ice', 'bolt'].includes(w));
      const sp = weak ? { fire: 'fire', ice: 'frost', bolt: 'bolt' }[weak] : (e.d.absorb || []).includes('fire') ? 'frost' : 'fire';
      if (can(sp)) return act({ kind: 'skill', id: sp, target: t });
    }
    if (me === 'allen') {
      if (ens.length >= 3 && can('whirl')) return act({ kind: 'skill', id: 'whirl' });
      if (boss && can('braver')) return act({ kind: 'skill', id: 'braver', target: tgtE() });
      if (boss && can('power')) return act({ kind: 'skill', id: 'power', target: tgtE() });
    }
    if (me === 'kai') {
      if (ens.length >= 3 && can('shadow')) return act({ kind: 'skill', id: 'shadow' });
      if (boss && can('double')) return act({ kind: 'skill', id: 'double', target: tgtE() });
    }
    return act({ kind: 'skill', id: 'attack', target: tgtE() });
  }
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
