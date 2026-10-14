'use strict';
// ===== battle rules (pure logic; no DOM) =====
const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function newBattle(ch, roster, meta, deploy, keepHp) {
  const rows = ch.map, S = { rows, hts: ch.hts || null, ramps: ch.ramps || null, w: rows[0].length, h: rows.length, units: [], turn: 1, phase: 0, over: null, why: '', ch, bonds: meta ? meta.bonds : null, gain: { gold: 0, proofs: 0, drops: {}, weapons: [] }, meta: meta || null, found: [], secrets: (ch.secrets || []).map(q => Object.assign({ seen: false, got: false }, q)), chests: (ch.chests || []).map(c => Object.assign({ got: false }, c)), talked: {}, escaped: 0 };
  const ids = (deploy && deploy.length ? deploy : Object.keys(roster).filter(id => !(roster[id].injured > 0) && !(ch.neutral || []).some(n => n.id === id))).slice(0, ch.slots.length);
  ids.forEach((id, i) => { const u = roster[id], [x, y] = ch.slots[i]; u.team = 0; u.x = x; u.y = y; if (!keepHp) u.hp = u.maxhp; u.acted = false; u.dead = false; u.off = false; u.dir = 'right'; u.spUsed = false; u.spActive = null; u.atkBuff = 0; u.deployed = true; S.units.push(u); });
  for (const id in roster) if (!ids.includes(id)) roster[id].deployed = false;
  for (const n of (ch.neutral || [])) { const u = roster[n.id]; if (!u || u.joined) continue; u.team = 2; u.recruit = true; u.x = n.x; u.y = n.y; u.hp = u.maxhp; u.acted = false; u.dead = false; u.off = false; u.dir = 'left'; u.spUsed = false; u.spActive = null; u.atkBuff = 0; u.deployed = true; S.units.push(u); }
  for (const [t, x, y, lv, ai, ex] of ch.enemies) { const u = makeEnemy(t, lv, x, y, ai, ex); u.acted = false; u.dead = false; u.off = false; S.units.push(u); }
  return S;
}
const inb = (S, x, y) => x >= 0 && y >= 0 && x < S.w && y < S.h;
const terrAt = (S, x, y) => TERRAIN[S.rows[y][x]] || TERRAIN['.'];
// ---- elevation: htAt = height 0-3; stepCost = terrain cost + 1 per level climbed (Infinity when blocked or a 2+ climb without a ramp tile) ----
const htAt = (S, x, y) => S.hts ? S.hts[y].charCodeAt(x) - 48 : 0;
function isRamp(S, x, y) { if (!S.ramps) return false; if (!S._rs) { S._rs = {}; for (const q of S.ramps) S._rs[kk(q[0], q[1])] = 1; } return !!S._rs[kk(x, y)]; }
function stepCost(S, x, y, nx, ny) {
  const T = terrAt(S, nx, ny); if (T.block) return Infinity; const up = htAt(S, nx, ny) - htAt(S, x, y);
  if (up <= 0) return T.cost; if (up >= 2 && !isRamp(S, x, y) && !isRamp(S, nx, ny)) return Infinity; return T.cost + up;
}
const isBow = w => w.type === 'phys' && w.min >= 2;
const rngMax = (S, u, x, y, w) => { w = w || weaponOf(u); return w.max + (isBow(w) && htAt(S, x, y) >= 2 ? 1 : 0); }; // archers on a height 2+ tile reach one further
const hiDiff = (S, ax, ay, dx, dy) => htAt(S, ax, ay) - htAt(S, dx, dy);
const alive = S => S.units.filter(u => !u.dead && !u.off);
const unitAt = (S, x, y) => S.units.find(u => !u.dead && !u.off && u.x === x && u.y === y) || null;
const dist = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);
const kk = (x, y) => y * 64 + x;
const isFoe = (a, b) => a.team !== b.team && a.team !== 2 && b.team !== 2;
const isExit = (S, x, y) => !!(S.ch.exits && S.ch.exits.some(e => e[0] === x && e[1] === y));
const chestAt = (S, x, y) => S.chests.find(c => !c.got && c.x === x && c.y === y) || null;
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
      const sc = stepCost(S, x, y, nx, ny); if (sc === Infinity) continue;
      const o = unitAt(S, nx, ny); if (o && o.team !== u.team) continue;
      const nc = c + sc; if (nc > u.mov) continue;
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
function canHealAny(u) { return isHealer(u) || !!u.canHeal; }
function targetsFrom(S, u, x, y) {
  const w = weaponOf(u), out = [];
  for (const o of alive(S)) {
    if (o === u) continue; const d = dist(x, y, o.x, o.y); if (d < w.min || d > rngMax(S, u, x, y, w)) continue;
    if (w.type === 'heal') { if (o.team === u.team && o.hp < o.maxhp) out.push(o); }
    else if (isFoe(u, o)) out.push(o);
  }
  return out;
}
function healTargets(S, u, x, y) { const k = u.spActive; u.spActive = 'heal'; const t = targetsFrom(S, u, x, y); u.spActive = k; return t; }
// tiles the unit threatens (red overlay): all tiles within weapon range of any stop tile
function threatTiles(S, u, r) {
  const w = weaponOf(u), set = new Set(); if (!canDamage(u)) return set;
  for (const s of r.stops) for (let M = rngMax(S, u, s.x, s.y, w), dy = -M; dy <= M; dy++) for (let dx = -M; dx <= M; dx++) {
    const d = Math.abs(dx) + Math.abs(dy); if (d < w.min || d > M) continue;
    const x = s.x + dx, y = s.y + dy; if (inb(S, x, y)) set.add(kk(x, y));
  }
  return set;
}
function triAdv(a, d) { const x = weaponOf(a).tri, y = weaponOf(d).tri; if (!x || !y) return 0; return TRI_BEATS[x] === y ? 1 : TRI_BEATS[y] === x ? -1 : 0; }
// skills + bonds -> modifiers
function sk(u, k) { let n = 0; const l = u.skills; if (l && l.length) for (const id of l) { const s = SKILLS[id]; if (s && s.m[k]) n += s.m[k]; } return n; }
function bonus(S, u, x, y) { // bond bonuses from adjacent allies when standing on (x,y)
  const m = { hit: 0, avo: 0, crit: 0 }; if (u.team !== 0 || !S.bonds) return m;
  for (const o of S.units) {
    if (o === u || o.dead || o.off || o.team !== 0 || Math.abs(o.x - x) + Math.abs(o.y - y) !== 1) continue;
    const lv = bondLevel(S.bonds[bondKey(u.key, o.key)] || 0); if (lv) { const f = BOND_FX[lv]; m.hit += f.hit; m.avo += f.avo; m.crit += f.crit; }
  }
  return m;
}
const bondAdj = (S, u) => { for (const o of S.units) { if (o === u || o.dead || o.off || o.team !== u.team || u.team !== 0 || Math.abs(o.x - u.x) + Math.abs(o.y - u.y) !== 1) continue; if (bondLevel((S.bonds || {})[bondKey(u.key, o.key)] || 0)) return true; } return false; };
function calcDmg(S, a, d, dx, dy, ax, ay) {
  if (ax == null) { ax = a.x; ay = a.y; }
  const w = weaponOf(a), adv = triAdv(a, d), bf = a.atkBuff || 0, hd = hiDiff(S, ax, ay, dx, dy), extra = sk(a, 'dmg') - sk(d, 'taken') + (hd > 0 ? Math.min(2, hd) : 0); // high ground: +1 damage per level (max +2)
  if (w.type === 'mag') return Math.max(0, a.mag + w.might + adv + bf + extra - d.res);
  return Math.max(0, a.str + w.might + adv + bf + extra - (d.def + terrAt(S, dx, dy).def));
}
function calcHit(S, a, d, ax, ay, dx, dy) {
  const w = weaponOf(a), hd = w.type === 'mag' ? 0 : hiDiff(S, ax, ay, dx, dy); // tomes ignore height for hit
  return Math.max(0, Math.min(100, w.hit + triAdv(a, d) * 15 + (hd > 0 ? 15 : hd < 0 ? -15 : 0) + a.skl * 2 + sk(a, 'hit') + bonus(S, a, ax, ay).hit - ((d.spd + sk(d, 'spd')) * 2 + terrAt(S, dx, dy).avo + sk(d, 'avo') + bonus(S, d, dx, dy).avo)));
}
function calcCrit(S, a, ax, ay) { return Math.max(0, Math.min(100, Math.floor(a.skl / 4) + weaponOf(a).crit + sk(a, 'crit') + (a.promoCrit || 0) + bonus(S, a, ax, ay).crit)); }
// special availability: returns null (no special), or the list of targets (may be empty => unusable)
function spTargets(S, u, x, y) {
  const sp = SP[u.key]; if (!sp || u.spUsed || u.team !== 0) return null;
  const near = r => alive(S).filter(o => o !== u && o.team === u.team && dist(x, y, o.x, o.y) <= r);
  if (sp.kind === 'buff') return near(1);
  if (sp.kind === 'pray') return alive(S).filter(o => o.team === u.team && o.hp < o.maxhp && dist(x, y, o.x, o.y) <= 2);
  u.spActive = sp.kind; const t = targetsFrom(S, u, x, y); u.spActive = null; return t;
}
// forecast of a attacks d with a standing at (ax,ay)
function forecast(S, a, d, ax, ay) {
  if (ax == null) { ax = a.x; ay = a.y; }
  const dd = dist(ax, ay, d.x, d.y), dw = weaponOf(d);
  const dcan = canDamage(d) && dd >= dw.min && dd <= rngMax(S, d, d.x, d.y, dw);
  const diff = (a.spd + sk(a, 'spd')) - (d.spd + sk(d, 'spd'));
  const adv = triAdv(a, d);
  const hiD = hiDiff(S, ax, ay, d.x, d.y), A = { hi: hiD, u: a, dmg: calcDmg(S, a, d, d.x, d.y, ax, ay), hit: calcHit(S, a, d, ax, ay, d.x, d.y), crit: calcCrit(S, a, ax, ay), n: (diff >= 4 || a.spActive === 'ambush') ? 2 : 1, can: true, adv };
  const D = { hi: -hiD, u: d, dmg: dcan ? calcDmg(S, d, a, ax, ay, d.x, d.y) : 0, hit: dcan ? calcHit(S, d, a, d.x, d.y, ax, ay) : 0, crit: dcan ? calcCrit(S, d, d.x, d.y) : 0, n: dcan ? (-diff >= 4 ? 2 : 1) : 0, can: dcan, adv: -adv };
  return { a: A, d: D, dist: dd, hi: hiDiff(S, ax, ay, d.x, d.y) };
}
// roll a whole combat. returns events with hp after each strike; mutates hp.
function runCombat(S, a, d, ax, ay) {
  const f = forecast(S, a, d, ax, ay), ev = [], seq = [];
  seq.push('a'); if (f.d.n >= 1) seq.push('d'); if (f.a.n >= 2) seq.push('a'); if (f.d.n >= 2) seq.push('d');
  for (const s of seq) {
    const att = s === 'a' ? a : d, def = s === 'a' ? d : a, F = s === 'a' ? f.a : f.d;
    const hit = rnd() * 100 < F.hit, crit = hit && F.crit > 0 && rnd() * 100 < F.crit, dmg = hit ? (crit ? F.dmg * 3 : F.dmg) : 0;
    def.hp = Math.max(0, def.hp - dmg);
    ev.push({ type: 'hit', att, def, hit, crit, dmg, hpAfter: def.hp, kill: def.hp <= 0 });
    if (def.hp <= 0) { def.dead = true; break; }
  }
  return ev;
}
const EXP_MUL = 2;
function gainExp(u, n) {
  if (u.team !== 0 || u.lv >= 20) return null;
  n = Math.round(n * EXP_MUL); u.exp += n; if (u.exp < 100) return { n, up: null };
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
  const us = alive(S), ch = S.ch;
  const leon = S.units.find(u => u.key === 'leon');
  if (S.over) return S.over;
  if (leon && leon.dead) { S.over = 'lose'; S.why = 'レオンが倒れた'; }
  else if (!us.some(u => u.team === 0) && !(leon && leon.off)) { S.over = 'lose'; S.why = '全滅した'; }
  else if (ch.win === 'defend' && ch.village && us.some(u => u.team === 1 && u.x === ch.village.x && u.y === ch.village.y)) { S.over = 'lose'; S.why = '村を奪われた'; }
  else if (ch.win === 'defend') { if (S.turn > ch.turns) S.over = 'win'; }
  else if (ch.win === 'escape') { if (leon && leon.off && !us.some(u => u.team === 0)) S.over = 'win'; }
  else if (ch.win === 'boss') { if (S.units.some(u => u.boss && u.dead)) S.over = 'win'; }
  else if (!us.some(u => u.team === 1)) S.over = 'win';
  return S.over;
}
const recruit = (S, u, t) => { t.team = 0; t.recruit = false; t.joined = true; t.acted = false; };
function bossLine(S) { return S.units.find(u => u.boss && !u.dead) || null; }
// perform one unit's action instantly; returns a record the UI can replay
// opt: {escape:true} {item:index} {talk:true} {heal:true}
function applyAction(S, u, dest, target, sp, opt) {
  opt = opt || {};
  const rec = { unit: u, from: { x: u.x, y: u.y }, path: null, events: [], exp: [], target: target || null, kind: 'wait', sp: null, buffed: [], chest: null };
  if (dest && (dest.x !== u.x || dest.y !== u.y)) {
    const r = reach(S, u); rec.path = pathTo(r, dest.x, dest.y); u.x = dest.x; u.y = dest.y;
  }
  if (u.team === 0) { const c = chestAt(S, u.x, u.y); if (c) { c.got = true; rec.chest = c; if (c.gold) S.gain.gold += c.gold; if (c.item === 'proof') S.gain.proofs++; else if (c.item && ITEMS[c.item]) { if (u.items.length < MAX_ITEMS) u.items.push(c.item); else { c.gold = Math.floor(ITEMS[c.item].price / 2); S.gain.gold += c.gold; c.item = null; } } } }
  senseSecrets(S, u);
  const kind = sp && SP[u.key] ? SP[u.key].kind : null;
  if (opt.search) { const q = secretAt(S, u.x, u.y); rec.kind = 'search'; if (q) { rec.secret = q; rec.gotText = grantSecret(S, u, q.get); markFound(S, q.id); q.got = true; } }
  else if (opt.escape) { rec.kind = 'escape'; u.off = true; S.escaped++; }
  else if (opt.talk && target) { rec.kind = 'talk'; recruit(S, u, target); }
  else if (opt.item != null) {
    const it = ITEMS[u.items[opt.item]]; rec.kind = 'item'; rec.itemName = it ? it.name : '';
    if (it) { const amt = Math.min(u.maxhp - u.hp, it.heal), before = u.hp; u.hp += amt; u.items.splice(opt.item, 1); rec.events.push({ type: 'heal', att: u, def: u, dmg: amt, hpBefore: before, hpAfter: u.hp }); }
  } else {
    if (kind) { u.spUsed = true; rec.sp = kind; }
    if (kind === 'buff') {
      rec.kind = 'buff';
      for (const o of alive(S)) if (o !== u && o.team === u.team && dist(u.x, u.y, o.x, o.y) <= 1) { o.atkBuff = 2; rec.buffed.push(o); }
    } else if (kind === 'pray') {
      rec.kind = 'heal';
      for (const o of alive(S)) if (o.team === u.team && o.hp < o.maxhp && dist(u.x, u.y, o.x, o.y) <= 2) {
        const amt = Math.min(o.maxhp - o.hp, u.mag + 3 + sk(u, 'heal')), before = o.hp; o.hp += amt;
        rec.events.push({ type: 'heal', att: u, def: o, dmg: amt, hpBefore: before, hpAfter: o.hp });
      }
      if (rec.events.length) { const e = gainExp(u, 15); if (e) rec.exp.push({ unit: u, n: 15, up: e.up }); }
    } else if (target) {
      if (opt.heal) u.spActive = 'heal';
      if (isHealer(u)) {
        const amt = Math.min(target.maxhp - target.hp, u.mag + weaponOf(u).might + (opt.heal ? 0 : 0) + sk(u, 'heal'));
        const before = target.hp; target.hp += amt; rec.kind = 'heal';
        rec.events.push({ type: 'heal', att: u, def: target, dmg: amt, hpBefore: before, hpAfter: target.hp });
        if (opt.heal) u.spActive = null;
        const e = gainExp(u, 15); if (e) rec.exp.push({ unit: u, n: 15, up: e.up });
      } else {
        rec.kind = 'attack';
        if (kind) u.spActive = kind;
        rec.events = runCombat(S, u, target, u.x, u.y);
        if ((kind === 'meteor' || kind === 'starfall') && !u.dead) { // splash on the foes around the impact point (never misses, no counter)
          const base = Math.max(1, Math.round(calcDmg(S, u, target, target.x, target.y) * (kind === 'starfall' ? 0.5 : 0.6)));
          for (const o of alive(S)) if (o !== target && isFoe(u, o) && dist(o.x, o.y, target.x, target.y) <= 1) {
            o.hp = Math.max(0, o.hp - base); if (o.hp <= 0) o.dead = true;
            rec.events.push({ type: 'hit', att: u, def: o, hit: true, dmg: base, hpAfter: o.hp, kill: o.dead, aoe: true });
          }
        }
        u.spActive = null;
        for (const e of rec.events) if (e.kill && e.att.team === 0 && e.def.team === 1) S.gain.gold += e.def.gold || 0;
        for (const p of [u, target]) if (p.team === 0 && !p.dead) {
          const killed = rec.events.some(e => e.kill && e.att === p);
          const n = killed ? 30 : 10; const e = gainExp(p, n); if (e) rec.exp.push({ unit: p, n, up: e.up });
        }
      }
    }
  }
  u.acted = true;
  checkOver(S);
  return rec;
}
// end of the player phase: bond points for adjacent allies who both acted
function endPlayerPhase(S) {
  if (!S.bonds) return [];
  const us = alive(S).filter(u => u.team === 0 && u.acted), out = [];
  for (let i = 0; i < us.length; i++) for (let j = i + 1; j < us.length; j++) if (dist(us[i].x, us[i].y, us[j].x, us[j].y) === 1) {
    const k = bondKey(us[i].key, us[j].key), before = bondLevel(S.bonds[k] || 0); S.bonds[k] = (S.bonds[k] || 0) + 1;
    const after = bondLevel(S.bonds[k]); out.push({ a: us[i], b: us[j], up: after > before ? after : 0 });
  }
  return out;
}
function startPhase(S, team) { // fort heal + reset acted flags; returns heal records
  const out = [];
  for (const u of alive(S)) if (u.team === team) {
    u.acted = false; if (team === 0) u.atkBuff = 0;
    const T = terrAt(S, u.x, u.y);
    if (T.heal && u.hp < u.maxhp) { const amt = Math.max(1, Math.round(u.maxhp * T.heal)), a = Math.min(amt, u.maxhp - u.hp); out.push({ unit: u, from: u.hp, amt: a }); u.hp += a; }
  }
  return out;
}
// mid-battle talk events: returns the next talk whose condition holds (turn at the start of a player phase, or two units standing adjacent)
function nextTalk(S) {
  for (const t of (S.ch.talks || [])) {
    if (S.talked[t.id]) continue; const w = t.when;
    if (w.turn != null) { if (S.turn >= w.turn && S.phase === 0) return t; continue; }
    if (w.at) { const a = S.units.find(u => u.key === w.at[0] && !u.dead && !u.off && u.team === 0); if (a && a.x === w.at[1] && a.y === w.at[2]) return t; continue; }
    if (w.adj) {
      const a = S.units.find(u => u.key === w.adj[0] && !u.dead && !u.off && u.team !== 2), b = S.units.find(u => u.key === w.adj[1] && !u.dead && !u.off && u.team !== 2);
      if (a && b && dist(a.x, a.y, b.x, b.y) === 1) return t;
    }
  }
  return null;
}
// ---- secrets: hidden treasures (sparkle when a hero ends a move within 2 tiles; the thief senses from 4) and secret talks ----
const secretAt = (S, x, y) => S.secrets.find(q => !q.got && q.seen && q.x === x && q.y === y) || null;
function senseSecrets(S, u) {
  if (!u || u.team !== 0 || u.dead) return [];
  const r = u.key === 'jin' ? 4 : 2, out = [];
  for (const q of S.secrets) if (!q.got && !q.seen && dist(u.x, u.y, q.x, q.y) <= r) { q.seen = true; out.push(q); }
  return out;
}
function markFound(S, id) { if (!S.found.includes(id)) S.found.push(id); }
function rewardText(g) {
  if (g.drop) return DROPS[g.drop] + 'を手に入れた'; if (g.weapon) return WITEMS[g.weapon].name + 'を手に入れた'; if (g.proof) return '勇者の証を手に入れた';
  if (g.gold) return g.gold + 'Gを手に入れた'; if (g.bond) return HEROES[g.bond[0]].name + '×' + HEROES[g.bond[1]].name + 'の絆が深まった'; if (g.item) return ITEMS[g.item].name + 'を手に入れた'; return '';
}
// applies a secret reward; meta-level loot is only recorded in S.gain (paid out when the chapter is won, so undo / defeat cannot duplicate it)
function grantSecret(S, u, g) {
  if (g.drop) S.gain.drops[g.drop] = (S.gain.drops[g.drop] || 0) + 1;
  else if (g.weapon) S.gain.weapons.push(g.weapon);
  else if (g.proof) S.gain.proofs++;
  else if (g.gold) S.gain.gold += g.gold;
  else if (g.bond) { if (S.bonds) { const k = bondKey(g.bond[0], g.bond[1]); S.bonds[k] = (S.bonds[k] || 0) + g.bond[2]; } }
  else if (g.item) { const h = g.to && S.units.find(q => q.key === g.to && q.team === 0) || u; if (h && h.items.length < MAX_ITEMS) h.items.push(g.item); else S.gain.gold += Math.floor(ITEMS[g.item].price / 2); }
  return rewardText(g);
}
const secretTotal = idx => (CHAPTERS[idx].secrets || []).length + (CHAPTERS[idx].talks || []).filter(t => t.secret).length;
const secretFound = (meta, idx) => Object.keys(meta.secrets || {}).filter(k => k.startsWith((idx + 1) + '-')).length;
// roster carried across chapters
function newRoster() { return { leon: makeHero('leon', 1), mira: makeHero('mira', 1), luka: makeHero('luka', 1) }; }
function newMeta() { return { gold: 120, convoy: [], bonds: {}, seen: {}, proofs: 0, cleared: 0, deploy: null }; }
function prepareChapter(roster, meta, idx, deploy) {
  const ch = CHAPTERS[idx], vs = Object.values(roster), avg = Math.round(vs.reduce((a, u) => a + u.lv, 0) / vs.length);
  for (const id of ch.join) if (!roster[id]) { roster[id] = makeHero(id, Math.max(2, avg - 1)); roster[id].joined = true; }
  for (const n of (ch.neutral || [])) if (!roster[n.id]) { roster[n.id] = makeHero(n.id, Math.max(2, avg - 1)); roster[n.id].joined = false; }
  return newBattle(ch, roster, meta, deploy || (meta && meta.deploy));
}
function cloneRoster(r) { return JSON.parse(JSON.stringify(r)); }
// chapter-clear bonus exp for the whole party (keeps level-ups coming); returns [{unit,n,up}]
function chapterBonus(roster, S) {
  const out = [];
  for (const id in roster) { const u = roster[id]; if (u.team === 2 || (S && u.dead)) continue; const full = !S || u.deployed; const n = full ? 40 : 25; const e = gainExp(u, n); if (e && e.up) out.push({ unit: u, n, up: e.up }); }
  return out;
}
// after a won chapter: gold, proofs, injuries, late joiners. returns a summary for the UI
function finishChapter(roster, meta, S, idx) {
  const ch = CHAPTERS[idx], sum = { gold: S.gain.gold, reward: ch.reward, proofs: S.gain.proofs, injured: [], healed: [], late: [] };
  meta.gold += S.gain.gold + ch.reward; meta.proofs += S.gain.proofs;
  meta.drops = meta.drops || {}; for (const k in S.gain.drops) meta.drops[k] = (meta.drops[k] || 0) + S.gain.drops[k];
  for (const w of S.gain.weapons) meta.convoy.push(w);
  meta.secrets = meta.secrets || {}; for (const id of S.found) meta.secrets[id] = true; sum.found = S.found.length; sum.total = secretTotal(idx); meta.cleared = Math.max(meta.cleared, idx + 1);
  for (const id in roster) { const u = roster[id]; if (u.team === 2 && u.recruit) { u.team = 0; u.recruit = false; u.joined = true; sum.late.push(id); } }
  for (const id in roster) {
    const u = roster[id];
    if (u.injured > 0 && !u.deployed) { u.injured = 0; sum.healed.push(id); }
    if (u.deployed && u.dead) { u.injured = 1; sum.injured.push(id); }
    u.dead = false; u.off = false; u.hp = u.maxhp; u.team = 0;
  }
  const nx = CHAPTERS[idx + 1], vs = Object.values(roster), avg = Math.round(vs.reduce((a, u) => a + u.lv, 0) / vs.length);
  if (nx) for (const id of nx.join) if (!roster[id]) { roster[id] = makeHero(id, Math.max(2, avg - 1)); roster[id].joined = true; sum.joined = (sum.joined || []).concat(id); }
  meta.deploy = null;
  return sum;
}
