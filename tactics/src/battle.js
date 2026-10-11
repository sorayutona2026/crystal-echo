'use strict';
// ===== battle rules (pure logic; no DOM) =====
const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function newBattle(ch, roster) {
  const rows = ch.map, S = { rows, w: rows[0].length, h: rows.length, units: [], turn: 1, phase: 0, over: null, ch };
  for (const [id, x, y] of ch.party) { const u = roster[id]; u.x = x; u.y = y; u.hp = u.maxhp; u.acted = false; u.dead = false; u.dir = 'right'; S.units.push(u); }
  for (const [t, x, y, lv, ai] of ch.enemies) { const u = makeEnemy(t, lv, x, y, ai); u.acted = false; u.dead = false; S.units.push(u); }
  return S;
}
const inb = (S, x, y) => x >= 0 && y >= 0 && x < S.w && y < S.h;
const terrAt = (S, x, y) => TERRAIN[S.rows[y][x]] || TERRAIN['.'];
const alive = S => S.units.filter(u => !u.dead);
const unitAt = (S, x, y) => S.units.find(u => !u.dead && u.x === x && u.y === y) || null;
const dist = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);
const kk = (x, y) => y * 64 + x;
// movement: Dijkstra with terrain costs; enemies block, allies pass but can't be stopped on
function reach(S, u) {
  const best = new Map(), prev = new Map(), open = [[0, u.x, u.y]];
  best.set(kk(u.x, u.y), 0);
  while (open.length) {
    open.sort((a, b) => a[0] - b[0]);
    const [c, x, y] = open.shift();
    if (c > best.get(kk(x, y))) continue;
    for (const [dx, dy] of DIRS4) {
      const nx = x + dx, ny = y + dy; if (!inb(S, nx, ny)) continue;
      const T = terrAt(S, nx, ny); if (T.block) continue;
      const o = unitAt(S, nx, ny); if (o && o.team !== u.team) continue;
      const nc = c + T.cost; if (nc > u.mov) continue;
      const k = kk(nx, ny); if (best.has(k) && best.get(k) <= nc) continue;
      best.set(k, nc); prev.set(k, kk(x, y)); open.push([nc, nx, ny]);
    }
  }
  const stops = [];
  for (const [k, c] of best) { const x = k % 64, y = (k - x) / 64, o = unitAt(S, x, y); if (!o || o === u) stops.push({ x, y, cost: c }); }
  return { best, prev, stops, u };
}
function pathTo(r, x, y) {
  const p = []; let k = kk(x, y);
  while (k !== undefined) { p.unshift({ x: k % 64, y: (k - (k % 64)) / 64 }); k = r.prev.get(k); }
  return p;
}
function canDamage(u) { const w = weaponOf(u); return w.type === 'phys' || w.type === 'mag'; }
function isHealer(u) { return weaponOf(u).type === 'heal'; }
function targetsFrom(S, u, x, y) {
  const w = weaponOf(u), out = [];
  for (const o of alive(S)) {
    if (o === u) continue; const d = dist(x, y, o.x, o.y); if (d < w.min || d > w.max) continue;
    if (w.type === 'heal') { if (o.team === u.team && o.hp < o.maxhp) out.push(o); }
    else if (o.team !== u.team) out.push(o);
  }
  return out;
}
// tiles the unit threatens (red overlay): all tiles within weapon range of any stop tile
function threatTiles(S, u, r) {
  const w = weaponOf(u), set = new Set(); if (!canDamage(u)) return set;
  for (const s of r.stops) for (let dy = -w.max; dy <= w.max; dy++) for (let dx = -w.max; dx <= w.max; dx++) {
    const d = Math.abs(dx) + Math.abs(dy); if (d < w.min || d > w.max) continue;
    const x = s.x + dx, y = s.y + dy; if (inb(S, x, y)) set.add(kk(x, y));
  }
  return set;
}
function calcDmg(S, a, d, dx, dy) {
  const w = weaponOf(a);
  if (w.type === 'mag') return Math.max(0, a.mag + w.might - d.res);
  return Math.max(0, a.str + w.might - (d.def + terrAt(S, dx, dy).def));
}
function calcHit(S, a, d, dx, dy) {
  const w = weaponOf(a);
  return Math.max(0, Math.min(100, w.hit + a.skl * 2 - (d.spd * 2 + terrAt(S, dx, dy).avo)));
}
// forecast of a attacks d with a standing at (ax,ay)
function forecast(S, a, d, ax, ay) {
  if (ax == null) { ax = a.x; ay = a.y; }
  const dd = dist(ax, ay, d.x, d.y), dw = weaponOf(d);
  const dcan = canDamage(d) && dd >= dw.min && dd <= dw.max;
  const diff = a.spd - d.spd;
  const A = { u: a, dmg: calcDmg(S, a, d, d.x, d.y), hit: calcHit(S, a, d, d.x, d.y), n: diff >= 4 ? 2 : 1, can: true };
  const D = { u: d, dmg: dcan ? calcDmg(S, d, a, ax, ay) : 0, hit: dcan ? calcHit(S, d, a, ax, ay) : 0, n: dcan ? (-diff >= 4 ? 2 : 1) : 0, can: dcan };
  return { a: A, d: D, dist: dd };
}
// roll a whole combat. returns events with hp after each strike; mutates hp.
function runCombat(S, a, d, ax, ay) {
  const f = forecast(S, a, d, ax, ay), ev = [], seq = [];
  seq.push('a'); if (f.d.n >= 1) seq.push('d'); if (f.a.n >= 2) seq.push('a'); if (f.d.n >= 2) seq.push('d');
  for (const s of seq) {
    const att = s === 'a' ? a : d, def = s === 'a' ? d : a, F = s === 'a' ? f.a : f.d;
    const hit = rnd() * 100 < F.hit, dmg = hit ? F.dmg : 0;
    def.hp = Math.max(0, def.hp - dmg);
    ev.push({ type: 'hit', att, def, hit, dmg, hpAfter: def.hp, kill: def.hp <= 0 });
    if (def.hp <= 0) { def.dead = true; break; }
  }
  return ev;
}
function gainExp(u, n) {
  if (u.team !== 0 || u.lv >= 20) return null;
  u.exp += n; if (u.exp < 100) return { n, up: null };
  u.exp -= 100;
  const before = { hp: u.maxhp, str: u.str, mag: u.mag, skl: u.skl, spd: u.spd, def: u.def, res: u.res }, gr = HEROES[u.key].gr, gains = {};
  let any = false;
  for (const k of STATS) { if (gr[k] && rnd() * 100 < gr[k]) { gains[k] = 1; any = true; } }
  if (!any) gains.hp = 1;
  for (const k in gains) { if (k === 'hp') { u.maxhp++; u.hp++; } else u[k]++; }
  u.lv++;
  return { n, up: { lv: u.lv, before, gains, after: { hp: u.maxhp, str: u.str, mag: u.mag, skl: u.skl, spd: u.spd, def: u.def, res: u.res } } };
}
function checkOver(S) {
  const us = alive(S);
  const leon = S.units.find(u => u.key === 'leon');
  if (leon && leon.dead) S.over = 'lose';
  else if (!us.some(u => u.team === 0)) S.over = 'lose';
  else if (S.ch.win === 'boss' ? S.units.some(u => u.boss && u.dead) : !us.some(u => u.team === 1)) S.over = 'win';
  return S.over;
}
// perform one unit's action instantly; returns a record the UI can replay
function applyAction(S, u, dest, target) {
  const rec = { unit: u, from: { x: u.x, y: u.y }, path: null, events: [], exp: [], target: target || null, kind: 'wait' };
  if (dest && (dest.x !== u.x || dest.y !== u.y)) {
    const r = reach(S, u); rec.path = pathTo(r, dest.x, dest.y); u.x = dest.x; u.y = dest.y;
  }
  if (target) {
    if (isHealer(u)) {
      const amt = Math.min(target.maxhp - target.hp, u.mag + weaponOf(u).might);
      const before = target.hp; target.hp += amt; rec.kind = 'heal';
      rec.events.push({ type: 'heal', att: u, def: target, dmg: amt, hpBefore: before, hpAfter: target.hp });
      const e = gainExp(u, 15); if (e) rec.exp.push({ unit: u, n: 15, up: e.up });
    } else {
      rec.kind = 'attack';
      rec.events = runCombat(S, u, target, u.x, u.y);
      for (const p of [u, target]) if (p.team === 0 && !p.dead) {
        const killed = rec.events.some(e => e.kill && e.att === p);
        const n = killed ? 30 : 10; const e = gainExp(p, n); if (e) rec.exp.push({ unit: p, n, up: e.up });
      }
    }
  }
  u.acted = true;
  checkOver(S);
  return rec;
}
function startPhase(S, team) { // fort heal + reset acted flags; returns heal records
  const out = [];
  for (const u of alive(S)) if (u.team === team) {
    u.acted = false;
    const T = terrAt(S, u.x, u.y);
    if (T.heal && u.hp < u.maxhp) { const amt = Math.max(1, Math.round(u.maxhp * T.heal)), a = Math.min(amt, u.maxhp - u.hp); out.push({ unit: u, from: u.hp, amt: a }); u.hp += a; }
  }
  return out;
}
// roster carried across chapters
function newRoster() { return { leon: makeHero('leon', 1), mira: makeHero('mira', 1), luka: makeHero('luka', 1) }; }
function prepareChapter(roster, idx) {
  const ch = CHAPTERS[idx];
  for (const id of ch.join) if (!roster[id]) roster[id] = makeHero(id, 2);
  for (const id in roster) roster[id].tier = idx;
  return newBattle(ch, roster);
}
function cloneRoster(r) { return JSON.parse(JSON.stringify(r)); }
// chapter-clear bonus exp for the whole party (keeps level-ups coming); returns [{unit,n,up}]
function chapterBonus(roster, S) {
  const out = [];
  for (const id in roster) { const u = roster[id]; if (S && u.dead) continue; const e = gainExp(u, 40); if (e && e.up) out.push({ unit: u, n: 40, up: e.up }); }
  return out;
}
