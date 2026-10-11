'use strict';
// ===== AI: enemy decisions; also drives the test bot for the player side =====
// distance (terrain cost, ignoring units) from every tile to the nearest foe of `team`
function distToFoes(S, team) {
  const d = new Map(), open = [];
  for (const o of alive(S)) if (o.team !== team) { d.set(kk(o.x, o.y), 0); open.push([0, o.x, o.y]); }
  while (open.length) {
    open.sort((a, b) => a[0] - b[0]); const [c, x, y] = open.shift(); if (c > d.get(kk(x, y))) continue;
    for (const [dx, dy] of DIRS4) {
      const nx = x + dx, ny = y + dy; if (!inb(S, nx, ny)) continue; const T = terrAt(S, nx, ny); if (T.block) continue;
      const nc = c + T.cost, k = kk(nx, ny); if (d.has(k) && d.get(k) <= nc) continue; d.set(k, nc); open.push([nc, nx, ny]);
    }
  }
  return d;
}
// expected damage foes could deal to u if it ended on (x,y)
function threatAt(S, u, x, y) {
  let tot = 0;
  for (const e of alive(S)) {
    if (e.team === u.team || !canDamage(e)) continue;
    const w = weaponOf(e), d = dist(e.x, e.y, x, y);
    if (e.ai === 'hold' ? (d < w.min || d > w.max) : d > e.mov + w.max) continue;
    if (e.ai === 'wait' && d > e.mov + w.max) continue;
    const dm = w.type === 'mag' ? Math.max(0, e.mag + w.might - u.res) : Math.max(0, e.str + w.might - (u.def + terrAt(S, x, y).def));
    const hit = Math.max(0, Math.min(100, w.hit + e.skl * 2 - (u.spd * 2 + terrAt(S, x, y).avo))) / 100;
    tot += dm * hit * (e.spd - u.spd >= 4 ? 2 : 1);
  }
  return tot;
}
// opts.careful: weight for threat penalty (player bot); opts.hold: boss stays put
function chooseAction(S, u, opts) {
  opts = opts || {};
  const r = reach(S, u), hold = u.ai === 'hold';
  const dmap = distToFoes(S, u.team), healer = isHealer(u);
  const w = weaponOf(u);
  let best = null;
  const care = opts.careful || 0;
  for (const s of r.stops) {
    if (hold && (s.x !== u.x || s.y !== u.y)) continue;
    const T = terrAt(S, s.x, s.y), tb = (T.def * 1.0 + T.avo / 12) * 0.5;
    const th = care ? threatAt(S, u, s.x, s.y) * care * (u.lord ? (u.hp < u.maxhp * 0.5 ? 3 : 1.6) : 1) * (healer ? 1.5 : 1) : 0;
    for (const t of targetsFrom(S, u, s.x, s.y)) {
      let score;
      if (healer) { const amt = Math.min(t.maxhp - t.hp, u.mag + w.might); if (amt < 3) continue; score = 20 + amt * 1.5 + (t.lord ? 6 : 0) - th; }
      else {
        const f = forecast(S, u, t, s.x, s.y);
        const give = Math.min(t.hp, f.a.dmg * f.a.n) * f.a.hit / 100, take = f.d.can ? f.d.dmg * f.d.n * f.d.hit / 100 : 0;
        const kill = f.a.dmg * f.a.n >= t.hp && f.a.hit >= 60;
        score = 20 + give - take * (care ? 1.2 : 1) + (kill ? 15 : 0) + (t.boss ? 4 : 0) + tb - th * 0.5 - s.cost * 0.05;
      }
      if (!best || score > best.score) best = { unit: u, dest: { x: s.x, y: s.y }, target: t, score, kind: healer ? 'heal' : 'attack' };
    }
    // hero special (player bot only): considered as extra candidates, slightly penalised so it is saved for good moments
    const spd = opts.player ? SP[u.key] : null;
    if (spd && !u.spUsed) {
      const cand = (score, target) => { if (!best || score > best.score) best = { unit: u, dest: { x: s.x, y: s.y }, target, score, kind: target ? 'attack' : 'sp', sp: true }; };
      if (spd.kind === 'buff') {
        const n = alive(S).filter(o => o !== u && o.team === u.team && !o.acted && dist(s.x, s.y, o.x, o.y) <= 1).length;
        const foe = alive(S).some(o => o.team !== u.team && dist(s.x, s.y, o.x, o.y) <= 6);
        if (n >= 2 || (n >= 1 && foe)) cand(14 + 4 * n - th, null);
      } else if (spd.kind === 'pray') {
        let sum = 0, cnt = 0; for (const o of alive(S)) if (o.team === u.team && o.hp < o.maxhp && dist(s.x, s.y, o.x, o.y) <= 2) { sum += Math.min(o.maxhp - o.hp, u.mag + 3); cnt++; }
        if (sum >= 12 && cnt >= 2) cand(20 + sum * 1.5 - th, null);
      } else {
        u.spActive = spd.kind;
        for (const t of targetsFrom(S, u, s.x, s.y)) {
          const f = forecast(S, u, t, s.x, s.y);
          let give = Math.min(t.hp, f.a.dmg * f.a.n) * f.a.hit / 100; const take = f.d.can ? f.d.dmg * f.d.n * f.d.hit / 100 : 0;
          const kill = f.a.dmg * f.a.n >= t.hp && f.a.hit >= 60;
          if (spd.kind === 'meteor') for (const o of alive(S)) if (o !== t && o.team !== u.team && dist(o.x, o.y, t.x, t.y) <= 1) give += Math.min(o.hp, Math.round(f.a.dmg * 0.6));
          cand(20 + give - take + (kill ? 15 : 0) + (t.boss ? 4 : 0) + tb - th * 0.5 - 4, t);
        }
        u.spActive = null;
      }
    }
  }
  if (best) return best;
  if (u.ai === 'wait' && !opts.player) return { unit: u, dest: { x: u.x, y: u.y }, target: null, score: -1, kind: 'wait' };
  if (hold && !opts.player) return { unit: u, dest: { x: u.x, y: u.y }, target: null, score: -1, kind: 'wait' };
  // approach: closest to foes (healer: closest to hurt ally / lord)
  let goal = null;
  if (healer) {
    const al = alive(S).filter(o => o.team === u.team && o !== u).sort((a, b) => (b.maxhp - b.hp) - (a.maxhp - a.hp));
    goal = al.find(o => o.hp < o.maxhp) || al.find(o => o.lord) || al[0] || null;
  }
  let bm = null;
  for (const s of r.stops) {
    const T = terrAt(S, s.x, s.y);
    let sc;
    if (goal) sc = -dist(s.x, s.y, goal.x, goal.y) * 1.2;
    else { const dd = dmap.get(kk(s.x, s.y)); sc = -(dd == null ? 99 : dd); }
    sc += (T.def + T.avo / 15) * 0.15;
    if (care) sc -= threatAt(S, u, s.x, s.y) * care * (u.lord ? 1.5 : 1) * 0.35 * (healer ? 1.5 : 1);
    if (healer && care) { /* keep away from foes */ }
    if (!bm || sc > bm.score) bm = { unit: u, dest: { x: s.x, y: s.y }, target: null, score: sc, kind: 'move' };
  }
  return bm || { unit: u, dest: { x: u.x, y: u.y }, target: null, score: -99, kind: 'wait' };
}
// next player action for the bot; null => end turn
function suggestAction(S) {
  const mine = alive(S).filter(u => u.team === 0 && !u.acted);
  if (!mine.length) return null;
  let acts = [], moves = [];
  for (const u of mine) {
    const a = chooseAction(S, u, { careful: 0.6, player: true });
    (a.target || a.sp ? acts : moves).push(a);
  }
  if (acts.length) { acts.sort((a, b) => b.score - a.score); return acts[0]; }
  // movers: front-most first (smallest distance to foes)
  const dm = distToFoes(S, 0);
  moves.sort((a, b) => (dm.get(kk(a.unit.x, a.unit.y)) || 0) - (dm.get(kk(b.unit.x, b.unit.y)) || 0));
  return moves[0];
}
