'use strict';
// ===== AI: enemy decisions; also drives the test bot / auto mode for the player side =====
// Dijkstra distance (terrain cost, ignoring units) from a set of [x,y] goals to every tile
function distMap(S, goals) {
  const d = new Map(), open = [];
  for (const [x, y] of goals) { d.set(kk(x, y), 0); open.push([0, x, y]); }
  while (open.length) {
    open.sort((a, b) => a[0] - b[0]); const [c, x, y] = open.shift(); if (c > d.get(kk(x, y))) continue;
    for (const [dx, dy] of DIRS4) {
      const nx = x + dx, ny = y + dy; if (!inb(S, nx, ny)) continue; const T = terrAt(S, nx, ny); if (T.block) continue;
      const nc = c + T.cost, k = kk(nx, ny); if (d.has(k) && d.get(k) <= nc) continue; d.set(k, nc); open.push([nc, nx, ny]);
    }
  }
  return d;
}
// distance from every tile to the nearest foe of `team`
function distToFoes(S, team) { return distMap(S, alive(S).filter(o => o.team !== team && o.team !== 2).map(o => [o.x, o.y])); }
// expected damage foes could deal to u if it ended on (x,y)
function threatAt(S, u, x, y) {
  let tot = 0;
  for (const e of alive(S)) {
    if (!isFoe(e, u) || !canDamage(e)) continue;
    const w = weaponOf(e), d = dist(e.x, e.y, x, y);
    if (e.ai === 'hold' ? (d < w.min || d > w.max) : d > e.mov + w.max) continue;
    if (e.ai === 'wait' && d > e.mov + w.max) continue;
    const ex = sk(e, 'dmg') - sk(u, 'taken');
    const dm = w.type === 'mag' ? Math.max(0, e.mag + w.might + ex - u.res) : Math.max(0, e.str + w.might + ex - (u.def + terrAt(S, x, y).def));
    const hit = Math.max(0, Math.min(100, w.hit + e.skl * 2 - (u.spd * 2 + terrAt(S, x, y).avo + sk(u, 'avo')))) / 100;
    tot += dm * hit * (e.spd - u.spd >= 4 ? 2 : 1);
  }
  return tot;
}
const potionFor = (u, missing) => { let bi = -1, bk = 0; u.items.forEach((id, i) => { const h = ITEMS[id] && ITEMS[id].heal; if (!h) return; const k = h >= missing ? 1000 - h : h; if (bi < 0 || k > bk) { bi = i; bk = k; } }); return bi; };
// opts.careful: weight for threat penalty (player bot); opts.player: act for the player side; opts.noAttack: movement only
function chooseAction(S, u, opts) {
  opts = opts || {};
  const r = reach(S, u), hold = u.ai === 'hold', player = !!opts.player, win = S.ch.win;
  const dmap = distToFoes(S, u.team), healer = isHealer(u), w = weaponOf(u), village = S.ch.village;
  const esc = player && win === 'escape', def = player && win === 'defend' && village;
  let best = null;
  const care = opts.careful || 0;
  if (esc) { const ex = r.stops.find(s => isExit(S, s.x, s.y)); if (ex) return { unit: u, dest: { x: ex.x, y: ex.y }, target: null, score: 80, kind: 'escape', opt: { escape: true } }; }
  if (player && u.key === 'leon' && !opts.noAttack) { // recruit the neutral unit by talking
    const rc = S.units.find(o => o.recruit && !o.dead && o.team === 2);
    if (rc) { const s = r.stops.filter(q => dist(q.x, q.y, rc.x, rc.y) === 1).sort((a, b) => a.cost - b.cost)[0]; if (s) return { unit: u, dest: { x: s.x, y: s.y }, target: rc, score: 90, kind: 'talk', opt: { talk: true } }; }
  }
  if (player && care && u.items.length && !opts.noAttack) { // drink a potion when badly hurt and threatened
    const th = threatAt(S, u, u.x, u.y), missing = u.maxhp - u.hp;
    if (u.hp <= u.maxhp * (u.lord ? 0.55 : 0.4) && th >= u.hp * 0.3 && missing >= 8) { const i = potionFor(u, missing); if (i >= 0) best = { unit: u, dest: { x: u.x, y: u.y }, target: null, score: 45 + (u.lord ? 15 : 0), kind: 'item', opt: { item: i } }; }
  }
  for (const s of r.stops) {
    if (hold && (s.x !== u.x || s.y !== u.y)) continue;
    const T = terrAt(S, s.x, s.y), tb = (T.def * 1.0 + T.avo / 12) * 0.5;
    const th = care ? threatAt(S, u, s.x, s.y) * care * (u.lord ? (u.hp < u.maxhp * 0.5 ? 3 : 1.6) : 1) * (healer ? 1.5 : 1) : 0;
    const cb = player && chestAt(S, s.x, s.y) ? 7 : 0, far = def ? Math.max(0, dist(s.x, s.y, village.x, village.y) - 5) * 2.5 : 0, ep = esc ? 14 : 0;
    for (const t of targetsFrom(S, u, s.x, s.y)) {
      let score;
      if (healer) { const amt = Math.min(t.maxhp - t.hp, u.mag + w.might + sk(u, 'heal')); if (amt < 3) continue; score = 20 + amt * 1.5 + (t.lord ? 6 : 0) - th + cb - far - ep * 0.5; }
      else {
        const f = forecast(S, u, t, s.x, s.y);
        const give = Math.min(t.hp, f.a.dmg * f.a.n) * f.a.hit / 100, take = f.d.can ? f.d.dmg * f.d.n * f.d.hit / 100 : 0;
        const kill = f.a.dmg * f.a.n >= t.hp && f.a.hit >= 60;
        score = 20 + give - take * (care ? 1.2 : 1) + (kill ? 15 : 0) + (t.boss ? 4 : 0) + tb - th * 0.5 - s.cost * 0.05 + cb - far - (kill ? 0 : ep);
        // bot safety: never walk the lord (or anyone) into a likely death (counter-attack plus enemies that can reach the tile)
        if (care && !kill) { const danger = (f.d.can ? f.d.dmg * f.d.n * f.d.hit / 100 : 0) + threatAt(S, u, s.x, s.y); if (danger >= u.hp - 1) score -= (u.lord && S.turn < 14) ? 100 : 12; } // a stalled fight (turn 14+) lets even the lord strike
      }
      if (!best || score > best.score) best = { unit: u, dest: { x: s.x, y: s.y }, target: t, score, kind: healer ? 'heal' : 'attack' };
    }
    // sages / priests heal like healers when nobody is worth attacking (player side only)
    if (player && u.canHeal && !healer && !u.spUsedHeal) {
      for (const t of healTargets(S, u, s.x, s.y)) { const amt = Math.min(t.maxhp - t.hp, u.mag + 4 + sk(u, 'heal')); if (amt < 7) continue; const score = 22 + amt * 1.3 + (t.lord ? 6 : 0) - th + cb - far; if (!best || score > best.score) best = { unit: u, dest: { x: s.x, y: s.y }, target: t, score, kind: 'heal', opt: { heal: true } }; }
    }
    // hero special (player bot only): considered as extra candidates, slightly penalised so it is saved for good moments
    const spd = opts.player ? SP[u.key] : null;
    if (spd && !u.spUsed) {
      const cand = (score, target) => { if (!best || score > best.score) best = { unit: u, dest: { x: s.x, y: s.y }, target, score, kind: target ? 'attack' : 'sp', sp: true }; };
      if (spd.kind === 'buff') {
        const n = alive(S).filter(o => o !== u && o.team === u.team && !o.acted && dist(s.x, s.y, o.x, o.y) <= 1).length;
        const foe = alive(S).some(o => isFoe(o, u) && dist(s.x, s.y, o.x, o.y) <= 6);
        if (n >= 2 || (n >= 1 && foe)) cand(14 + 4 * n - th - far - ep, null);
      } else if (spd.kind === 'pray') {
        let sum = 0, cnt = 0; for (const o of alive(S)) if (o.team === u.team && o.hp < o.maxhp && dist(s.x, s.y, o.x, o.y) <= 2) { sum += Math.min(o.maxhp - o.hp, u.mag + 3 + sk(u, 'heal')); cnt++; }
        if (sum >= 12 && cnt >= 2) cand(20 + sum * 1.5 - th - ep, null);
      } else {
        u.spActive = spd.kind;
        for (const t of targetsFrom(S, u, s.x, s.y)) {
          const f = forecast(S, u, t, s.x, s.y);
          let give = Math.min(t.hp, f.a.dmg * f.a.n) * f.a.hit / 100; const take = f.d.can ? f.d.dmg * f.d.n * f.d.hit / 100 : 0;
          const kill = f.a.dmg * f.a.n >= t.hp && f.a.hit >= 60;
          if (spd.kind === 'meteor') for (const o of alive(S)) if (o !== t && isFoe(u, o) && dist(o.x, o.y, t.x, t.y) <= 1) give += Math.min(o.hp, Math.round(f.a.dmg * 0.6));
          cand(20 + give - take + (kill ? 15 : 0) + (t.boss ? 4 : 0) + tb - th * 0.5 - 4 - far - (kill ? 0 : ep), t);
        }
        u.spActive = null;
      }
    }
  }
  if (best && !opts.noAttack) return best;
  if (u.ai === 'wait' && !opts.player) return { unit: u, dest: { x: u.x, y: u.y }, target: null, score: -1, kind: 'wait' };
  if (hold && !opts.player) return { unit: u, dest: { x: u.x, y: u.y }, target: null, score: -1, kind: 'wait' };
  // approach: closest to foes (healer: closest to hurt ally / lord; escape: toward the exits; defend: ring around the village; raid: toward the village)
  let goal = null;
  if (healer && !esc) {
    const al = alive(S).filter(o => o.team === u.team && o !== u).sort((a, b) => (b.maxhp - b.hp) - (a.maxhp - a.hp));
    goal = al.find(o => o.hp < o.maxhp) || al.find(o => o.lord) || al[0] || null;
  }
  let emap = null, vmap = null;
  if (esc) emap = distMap(S, S.ch.exits);
  if (!player && u.ai === 'raid' && village) vmap = S._vmap || (S._vmap = distMap(S, [[village.x, village.y]]));
  let bm = null;
  for (const s of r.stops) {
    const T = terrAt(S, s.x, s.y);
    let sc;
    if (esc) { const dd = emap.get(kk(s.x, s.y)); sc = -(dd == null ? 99 : dd) * 1.3; }
    else if (vmap) { const dd = vmap.get(kk(s.x, s.y)); sc = -(dd == null ? 99 : dd) * 1.2; }
    else if (goal) sc = -dist(s.x, s.y, goal.x, goal.y) * 1.2;
    else if (def) { const vd = dist(s.x, s.y, village.x, village.y), dd = dmap.get(kk(s.x, s.y)); sc = -Math.max(0, vd - 3) * 3 - Math.max(0, 2 - vd) * 1.5 - (dd == null ? 0 : dd) * 0.15; }
    else { const dd = dmap.get(kk(s.x, s.y)); sc = -(dd == null ? 99 : dd); }
    sc += (T.def + T.avo / 15) * 0.15;
    if (player && chestAt(S, s.x, s.y)) sc += 3;
    if (care) {
      const tha = threatAt(S, u, s.x, s.y); sc -= tha * care * (u.lord ? 1.5 : 1) * 0.35 * (healer ? 1.5 : 1); if (u.lord && tha >= u.hp - 1) sc -= 100;
      if (u.lord && u.hp < u.maxhp * 0.5 && !goal && !esc && (dmap.get(kk(u.x, u.y)) == null ? 99 : dmap.get(kk(u.x, u.y))) <= 9 && S.turn < 14) { const dd = dmap.get(kk(s.x, s.y)); sc = -tha * 2 + (dd == null ? 0 : dd) * 0.4 + (T.def + T.avo / 15) * 0.15; } // wounded lord retreats
    }
    if (!bm || sc > bm.score) bm = { unit: u, dest: { x: s.x, y: s.y }, target: null, score: sc, kind: 'move' };
  }
  return bm || { unit: u, dest: { x: u.x, y: u.y }, target: null, score: -99, kind: 'wait' };
}
// next player action for the bot; null => end turn
function suggestAction(S) {
  const mine = alive(S).filter(u => u.team === 0 && !u.acted);
  if (!mine.length) return null;
  const care = Math.max(0.15, 0.6 - Math.max(0, S.turn - 4) * 0.1); // grows bolder when the fight stalls
  const acts = [], moves = [], special = a => a.target || a.sp || a.kind === 'escape' || a.kind === 'talk' || a.kind === 'item';
  for (const u of mine) { const a = chooseAction(S, u, { careful: care, player: true }); (special(a) ? acts : moves).push(a); }
  // an attack that scored badly (the bot's lord would likely die) is dropped in favour of retreating/moving
  const okActs = acts.filter(a => a.score > 0 || !a.unit.lord);
  for (const a of acts) if (!okActs.includes(a)) { const m = chooseAction(S, a.unit, { careful: care, player: true, noAttack: true }); moves.push(m); }
  if (okActs.length) { okActs.sort((a, b) => b.score - a.score); return okActs[0]; }
  // movers: front-most first (smallest distance to foes; escape: closest to the exits first)
  const dm = S.ch.win === 'escape' ? distMap(S, S.ch.exits) : distToFoes(S, 0);
  moves.sort((a, b) => (dm.get(kk(a.unit.x, a.unit.y)) || 0) - (dm.get(kk(b.unit.x, b.unit.y)) || 0));
  return moves[0];
}
