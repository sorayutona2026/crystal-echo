// ===================== BATTLE =====================
let B = null;
const PARTY_POS = i => ({ x: 190 + i * 7, y: 28 + i * 28 });

function startBattle(cfg, cb) {
  Input.clear();
  Audio8.stop(); Audio8.sfx(cfg.boss ? 'boss' : 'encounter');
  G.scene = BattleTrans; BattleTrans.t = 0; BattleTrans.cfg = cfg; BattleTrans.cb = cb; BattleTrans.shards = null;
}
// encounter: the field flashes, then shatters like glass and the pieces fly toward the camera
const BattleTrans = {
  t: 0, snap: null, shards: null,
  update() { this.t++; if (this.t === 16) Audio8.sfx('shatter'); if (this.t >= 44) Battle.begin(this.cfg, this.cb); },
  build() {
    if (!this.snap) this.snap = mkCanvas(SW * SCALE, SH * SCALE);
    const sx = this.snap.getContext('2d'); sx.globalCompositeOperation = 'copy'; sx.drawImage(cv, 0, 0); sx.globalCompositeOperation = 'source-over';
    const r = mulberry(G.frame + 7), C = 8, R = 7, cw = SW / C, ch = SH / R; const pts = [];
    for (let j = 0; j <= R; j++) { pts.push([]); for (let i = 0; i <= C; i++) { const edge = i === 0 || j === 0 || i === C || j === R; pts[j].push([i * cw + (edge ? 0 : (r() - 0.5) * cw * 0.7), j * ch + (edge ? 0 : (r() - 0.5) * ch * 0.7)]); } }
    this.shards = [];
    for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) {
      const a = pts[j][i], b = pts[j][i + 1], c = pts[j + 1][i + 1], d = pts[j + 1][i];
      for (const tri of (r() < 0.5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]])) {
        const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
        const dx = cx - SW / 2, dy = cy - SH / 2, dl = Math.hypot(dx, dy) || 1;
        this.shards.push({ tri, cx, cy, vx: dx / dl * (1.5 + r() * 2.5), vy: dy / dl * (1.5 + r() * 2.5) - 1, spin: (r() - 0.5) * 0.25, delay: Math.floor(dl / 22 + r() * 3) });
      }
    }
  },
  draw() {
    const t = this.t;
    if (t < 16 || !this.shards) {
      Field.draw();
      if (t < 16) {
        const k = t / 16; ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(SW / 2, SH / 2, 0, SW / 2, SH / 2, 180); g.addColorStop(0, `rgba(255,255,255,${0.15 + k * 0.5})`); g.addColorStop(1, 'rgba(160,190,255,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
        if ((t >> 2) % 2) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(0, 0, SW, SH); }
        ctx.restore(); return;
      }
      this.build();
    }
    const M = MAIN; M.save(); M.setTransform(1, 0, 0, 1, 0, 0);
    M.fillStyle = '#000'; M.fillRect(0, 0, W3, H3);
    const k0 = t - 16;
    for (const s of this.shards) {
      const k = Math.max(0, k0 - s.delay), z = 1 + k * k * 0.004;
      const ox = s.vx * k * k * 0.18, oy = s.vy * k * k * 0.18 + k * k * 0.05;
      M.save(); M.globalAlpha = clamp(1 - k / 22, 0, 1);
      M.translate((s.cx + ox) * SCALE, (s.cy + oy) * SCALE); M.rotate(s.spin * k); M.scale(z, z); M.translate(-s.cx * SCALE, -s.cy * SCALE);
      M.beginPath(); M.moveTo(s.tri[0][0] * SCALE, s.tri[0][1] * SCALE); M.lineTo(s.tri[1][0] * SCALE, s.tri[1][1] * SCALE); M.lineTo(s.tri[2][0] * SCALE, s.tri[2][1] * SCALE); M.closePath();
      const xs = s.tri.map(q => q[0] * SCALE), ys = s.tri.map(q => q[1] * SCALE); const bx = Math.max(0, Math.floor(Math.min(...xs)) - 2), by = Math.max(0, Math.floor(Math.min(...ys)) - 2);
      const bw = Math.min(W3, Math.ceil(Math.max(...xs)) + 2) - bx, bh = Math.min(H3, Math.ceil(Math.max(...ys)) + 2) - by;
      M.save(); M.clip(); M.drawImage(this.snap, bx, by, bw, bh, bx, by, bw, bh); M.restore();
      M.strokeStyle = 'rgba(220,240,255,.7)'; M.lineWidth = 1.5; M.stroke();
      M.restore();
    }
    if (k0 < 8) { M.globalCompositeOperation = 'lighter'; M.fillStyle = `rgba(200,230,255,${(8 - k0) / 10})`; M.fillRect(0, 0, W3, H3); }
    M.restore(); resetT();
  },
};

function mkEnemy(id, idx) {
  const d = ENEMIES[id]; const img = ENEMY_IMG[d.img];
  return { side: 'e', id, d, name: d.name, hp: d.hp, maxhp: d.hp, atb: rnd() * 50, img: d.img, w: img.width, h: img.height, x: 0, y: 0,
    hitT: 0, dying: 0, alive: true, poison: false, stolen: false, turn: 0, phase2: false, buff: 1, i: idx, kb: 0 };
}
function layoutEnemies(es) {
  const n = es.length; const AX = 8, AW = 156;
  if (n === 1) { const e = es[0]; e.x = Math.round(AX + (AW - e.w) / 2); e.y = Math.round(Math.min(126, 70 + e.h / 2) - e.h); return; }
  const total = es.reduce((s, e) => s + e.w, 0) + 8 * (n - 1);
  if (total <= AW) {
    let x = AX + (AW - total) / 2;
    es.forEach((e, i) => { e.x = Math.round(x); e.y = Math.round(118 - e.h - (i % 2) * 14); x += e.w + 8; });
  } else {
    const front = es.slice(0, Math.ceil(n / 2)), back = es.slice(Math.ceil(n / 2));
    for (const [row, bottom, off] of [[back, 78, 16], [front, 124, 0]]) {
      const tw = row.reduce((s, e) => s + e.w, 0) + 6 * (row.length - 1); let x = AX + off + (AW - off - tw) / 2;
      row.forEach(e => { e.x = Math.round(x); e.y = Math.round(bottom - e.h); x += e.w + 6; });
    }
  }
  // label duplicates A/B/C
  const cnt = {}; es.forEach(e => cnt[e.id] = (cnt[e.id] || 0) + 1);
  const seen = {}; es.forEach(e => { if (cnt[e.id] > 1) { seen[e.id] = (seen[e.id] || 0) + 1; e.name = e.d.name + 'ABCD'[seen[e.id] - 1]; } });
}

const Battle = {
  begin(cfg, cb) {
    const es = cfg.ids.map((id, i) => mkEnemy(id, i)); layoutEnemies(es);
    B = { cfg, cb, enemies: es, pb: G.party.map(() => ({ atb: 0, defend: false, offx: 0, offy: 0, hitT: 0, ready: false, trail: [], prot: false, haste: false })), queue: [], ready: [], menu: null,
      gen: null, wait: 0, waitKey: false, popups: [], fx: [], parts: [], flashFx: null, banner: null, phase: 'intro', t: 0, msg: null, slide: 1, cheer: false, flee: false,
      hold: 0, stop: 0, result: null, clouds: null, echo: 0, voice: null };
    G.party.forEach((m, i) => { const s = stats(m); B.pb[i].atb = m.hp > 0 ? 20 + rnd() * 60 + s.spd * 2 : 0; });
    G.scene = Battle; Audio8.play(cfg.music || 'battle');
  },
  // ---------- helpers ----------
  pStats(i) { return stats(G.party[i]); },
  aliveE() { return B.enemies.filter(e => e.alive); },
  aliveP() { return G.party.map((m, i) => i).filter(i => G.party[i].hp > 0); },
  center(t) {
    if (t.side === 'e') { const e = B.enemies[t.i]; return { x: e.x + e.w / 2, y: e.y + e.h / 2 }; }
    const p = PARTY_POS(t.i); return { x: p.x + 16 + B.pb[t.i].offx, y: p.y + 16 };
  },
  popup(t, txt, col = '#fff', tag) { const c = this.center(t); const n = B.popups.filter(p => p.t < 20 && Math.abs(p.x - c.x) < 8).length; B.popups.push({ x: c.x, y: c.y - 4 - n * 9, text: String(txt), col, t: 0, tag, heal: col === '#7dffa0' }); },
  update() {
    if (!B) return;
    if (B.stop > 0) { B.stop--; return; } // hit-stop: freeze a few frames on heavy blows
    B.t++;
    for (const e of B.enemies) if (e.kb > 0) e.kb = Math.max(0, e.kb - 0.8);
    if (B.result) B.result.t++;
    if (B.voice && ++B.voice.t > 200) B.voice = null;
    B.popups.forEach(p => p.t++); B.popups = B.popups.filter(p => p.t < 50);
    B.fx.forEach(f => f.t++); B.fx = B.fx.filter(f => f.t < f.dur);
    for (const e of B.enemies) {
      if (e.hitT > 0) e.hitT--;
      if (e.dying > 0 && e.dying < 40) { e.dying++; if (e.dying < 34) for (let k = 0; k < 2; k++) spawnP({ x: e.x + Math.random() * e.w, y: e.y + e.h * (1 - e.dying / 34) + Math.random() * 6, vx: (Math.random() - 0.5) * 1.2, vy: -0.6 - Math.random() * 1.2, life: 26, size: 1.6 + Math.random() * 1.6, c0: '#f0d8ff', c1: '#8030c0' }); }
      if (e.alive && e.img === 'garva' && B.t % 2 === 0) spawnP({ x: e.x + 10 + Math.random() * (e.w - 20), y: e.y + 20 + Math.random() * (e.h - 30), vx: (Math.random() - 0.5) * 0.3, vy: -0.4 - Math.random() * 0.6, life: 40, size: 2 + Math.random() * 2.5, c0: '#c060ff', c1: '#300850' });
      if (e.alive && e.img === 'hellhound' && B.t % 5 === 0) spawnP({ x: e.x + 14 + Math.random() * (e.w - 24), y: e.y + 8 + Math.random() * 8, vx: (Math.random() - 0.5) * 0.3, vy: -0.5 - Math.random() * 0.5, life: 24, size: 1.2 + Math.random(), c0: '#ffe080', c1: '#c02010' });
      if (e.alive && (e.img === 'windslime' || e.img === 'tempest') && B.t % (e.img === 'tempest' ? 2 : 6) === 0) { const an = Math.random() * Math.PI * 2, rr = e.w * 0.45; spawnP({ x: e.x + e.w / 2 + Math.cos(an) * rr, y: e.y + e.h * 0.6 + Math.sin(an) * rr * 0.3, ox: e.x + e.w / 2, oy: e.y + e.h * 0.6, spin: 0.08, vy: -0.15, life: 36, size: 1.1, c0: '#ffffff', c1: '#50d8a0' }); }
      if (e.alive && e.img === 'guardian' && B.t % 4 === 0) spawnP({ x: e.x + Math.random() * e.w, y: e.y + Math.random() * e.h, vx: 0, vy: -0.3, life: 30, size: 1.4, c0: '#ffffff', c1: '#60c8ff', shape: 'star' });
    }
    B.parts = (B.parts || []).filter(updP);
    if (B.flashFx && B.flashFx.a > 0) B.flashFx.a -= 0.06;
    B.pb.forEach(p => { if (p.hitT > 0) p.hitT--; });
    if (B.banner && B.banner.t > 0 && --B.banner.t === 0) B.banner = null;
    if (B.phase === 'intro') { B.slide = Math.max(0, B.slide - 1 / 24); if (B.slide <= 0 && ++B.hold >= (B.cfg.boss ? 64 : 1)) B.phase = 'main'; return; }
    if (B.gen) {
      if (B.waitKey) { if (Input.pressed.a || (G.auto && (B.autoWait = (B.autoWait || 0) + 1) > 50)) { B.waitKey = false; B.autoWait = 0; Audio8.sfx('cursor'); } else return; }
      if (B.wait > 0) { B.wait--; return; }
      let r; try { r = B.gen.next(); } catch (e) { console.error(e); r = { done: true }; }
      if (!B) return;
      if (r.done) { B.gen = null; this.afterAction(); }
      else if (r.value === 'key') B.waitKey = true; else B.wait = r.value || 0;
      return;
    }
    if (B.phase !== 'main') return;
    if (B.queue.length) { const a = B.queue.shift(); B.gen = this.exec(a); return; }
    if (B.menu && G.auto && B.menu.stage === 'cmd') { BMenu.close(this.autoAction(B.menu.who)); return; }
    if (B.menu) { BMenu.update(); return; }
    while (B.ready.length && G.party[B.ready[0]].hp <= 0) { B.pb[B.ready[0]].ready = false; B.ready.shift(); }
    if (B.ready.length) { BMenu.open(B.ready[0]); return; }
    // tick ATB
    G.party.forEach((m, i) => {
      const pb = B.pb[i]; if (m.hp <= 0 || pb.ready) return;
      pb.atb += (stats(m).spd + 20) * 0.04 * (pb.haste ? 1.5 : 1);
      if (pb.atb >= 100) { pb.atb = 100; pb.ready = true; B.ready.push(i); }
    });
    for (const e of B.enemies) {
      if (!e.alive) continue;
      e.atb += (e.d.spd + 20) * 0.04;
      if (e.atb >= 100) { e.atb = 0; B.queue.push(this.enemyAI(e)); }
    }
  },
  afterAction() {
    if (B.phase !== 'main') return;
    if (!this.aliveE().length) { B.phase = 'win'; B.gen = this.victory(); B.queue = []; B.menu = null; }
    else if (!this.aliveP().length) { B.phase = 'lose'; B.gen = this.defeat(); B.queue = []; B.menu = null; }
  },
  // ---------- auto battle: what a sensible player would pick for this member ----------
  autoAction(who) {
    const m = G.party[who], me = m.id;
    const alive = this.aliveP(), dead = G.party.map((p, i) => i).filter(i => G.party[i].hp <= 0);
    const ratio = i => G.party[i].hp / stats(G.party[i]).maxhp;
    const low = alive.filter(i => ratio(i) < 0.45).sort((a, b) => ratio(a) - ratio(b));
    const ens = this.aliveE(), boss = ens.some(e => e.d.boss);
    const known = skillsOf(m), can = id => known.includes(id) && m.mp >= SKILLS[id].mp;
    const tgtE = () => { const e = ens.slice().sort((a, b) => a.hp - b.hp)[0]; return { side: 'e', i: e.i }; };
    const skill = (id, target) => ({ kind: 'skill', id, target });
    const item = (id, i) => ({ kind: 'item', id, target: { side: 'p', i } });
    if (me === 'lina') {
      if (B.echo >= 100 && echoReady() && (dead.length || low.length >= 2)) return skill('echo');
      if (dead.length && can('revive')) return skill('revive', { side: 'p', i: dead[0] });
      if (low.length >= 2 && can('healall')) return skill('healall');
      if (low.length && can('heal')) return skill('heal', { side: 'p', i: low[0] });
      if (G.party.some(p => p.poison && p.hp > 0) && can('cure')) return skill('cure', { side: 'p', i: G.party.findIndex(p => p.poison && p.hp > 0) });
      if (boss && can('protect') && alive.some(i => !B.pb[i].prot)) return skill('protect');
      const fast = ['allen', 'zek'].map(id => G.party.findIndex(p => p.id === id)).find(i => i >= 0 && G.party[i].hp > 0 && !B.pb[i].haste);
      if (boss && can('haste') && fast !== undefined && low.length === 0) return skill('haste', { side: 'p', i: fast });
      if (m.mp < 6 && G.inv.ether && boss) return item('ether', who);
      if (boss && can('holy') && m.mp > 30) return skill('holy', tgtE());
    }
    const linaUp = G.party.some(p => p.id === 'lina' && p.hp > 0 && p.mp >= 3);
    if (dead.length && G.inv.phoenix) return item('phoenix', dead[0]);
    if (low.length && ratio(low[0]) < 0.3 && (!linaUp || boss)) { const pot = G.inv.hipotion ? 'hipotion' : G.inv.potion ? 'potion' : null; if (pot) return item(pot, low[0]); }
    if (me === 'zek') {
      if (ens.length >= 3 && can('meteor') && !boss) return skill('meteor');
      if (boss && can('meteor')) return skill('meteor');
      if (ens.length >= 2 && can('blaze') && !ens.some(e => (e.d.absorb || []).includes('fire'))) return skill('blaze');
      const t = tgtE(), e = B.enemies[t.i]; const weak = (e.d.weak || []).find(w => ['fire', 'ice', 'bolt'].includes(w));
      const sp = weak ? { fire: 'fire', ice: 'frost', bolt: 'bolt' }[weak] : (e.d.absorb || []).includes('fire') ? 'frost' : 'fire';
      if (can(sp)) return skill(sp, t);
    }
    if (me === 'allen') {
      if (ens.length >= 3 && can('whirl')) return skill('whirl');
      if (boss && can('braver')) return skill('braver', tgtE());
      if (boss && can('power')) return skill('power', tgtE());
    }
    if (me === 'kai') {
      if (ens.length >= 3 && can('shadow')) return skill('shadow');
      if (boss && can('double')) return skill('double', tgtE());
    }
    return skill('attack', tgtE());
  },
  // ---------- enemy AI ----------
  enemyAI(e) {
    e.turn++;
    let sk = 'attack';
    const ai = e.d.ai;
    if (typeof ai === 'string') sk = BOSS_AI[ai](e);
    else if (ai) { const tot = ai.reduce((s, a) => s + a[1], 0); let r = rnd() * tot; for (const a of ai) { r -= a[1]; if (r <= 0) { sk = a[0]; break; } } }
    const alive = this.aliveP(); const tgt = alive.length ? pick(alive) : 0;
    return { side: 'e', i: e.i, kind: 'skill', id: sk, target: { side: 'p', i: tgt } };
  },
  // ---------- damage ----------
  statsOf(t) {
    if (t.side === 'p') { const s = stats(G.party[t.i]); return s; }
    const e = B.enemies[t.i], d = e.d; return { atk: Math.round(d.str * e.buff), def: d.def, mag: Math.round(d.mag * e.buff), mdf: d.mdf, spd: d.spd, crit: 0.03, maxhp: e.maxhp };
  },
  unit(t) { return t.side === 'p' ? G.party[t.i] : B.enemies[t.i]; },
  isAlive(t) { const u = this.unit(t); return t.side === 'p' ? u.hp > 0 : u.alive; },
  phys(src, dst, mult) {
    const A = this.statsOf(src), D = this.statsOf(dst);
    if (rnd() < 0.03) return { miss: true };
    let dmg = A.atk * A.atk / (A.atk + D.def) * 1.6 * mult * (0.88 + rnd() * 0.24);
    const crit = rnd() < A.crit; if (crit) dmg *= 1.8;
    if (dst.side === 'p' && B.pb[dst.i].defend) dmg *= 0.5;
    if (dst.side === 'p' && B.pb[dst.i].prot) dmg *= 0.6;
    return { dmg: Math.max(1, Math.round(dmg)), crit };
  },
  magic(src, dst, sk) {
    const A = this.statsOf(src), D = this.statsOf(dst);
    const m = sk.power + A.mag * 2; let dmg = m * m / (m + D.mdf) * (0.9 + rnd() * 0.2);
    let note = '';
    if (dst.side === 'e') { const d = B.enemies[dst.i].d; if (d.weak && d.weak.includes(sk.elem)) { dmg *= 1.8; note = 'weak'; } if (d.absorb && d.absorb.includes(sk.elem)) { return { heal: Math.round(dmg * 0.6), note: 'absorb' }; } }
    if (dst.side === 'p' && B.pb[dst.i].defend) dmg *= 0.7;
    return { dmg: Math.max(1, Math.round(dmg)), note };
  },
  healAmt(src, sk) { const A = this.statsOf(src); return Math.round((sk.power + A.mag * 2.4) * (0.92 + rnd() * 0.16)); },
  damage(t, n, col = '#fff', tag) {
    const u = this.unit(t);
    if (t.side === 'p' && echoReady()) { B.echo = Math.min(100, B.echo + n / stats(u).maxhp * 45 + (u.hp - n <= 0 ? 25 : 0)); }
    if (t.side === 'p') { u.hp = Math.max(0, u.hp - n); B.pb[t.i].hitT = 12; if (u.hp <= 0) { u.poison = false; B.pb[t.i].atb = 0; B.pb[t.i].ready = false; B.ready = B.ready.filter(x => x !== t.i); Audio8.sfx('ko'); } }
    else { u.hp = Math.max(0, u.hp - n); u.hitT = 12; u.kb = tag === 'CRITICAL' ? 9 : 5; if (u.hp <= 0 && u.alive) { u.alive = false; u.dying = 1; Audio8.sfx('ko'); } }
    this.popup(t, n, col, tag);
  },
  heal(t, n, tag) {
    const u = this.unit(t);
    if (t.side === 'p') { const mx = stats(u).maxhp; u.hp = Math.min(mx, u.hp + n); }
    else { u.hp = Math.min(u.maxhp, u.hp + n); }
    this.popup(t, n, '#7dffa0', tag);
  },
  // ---------- action execution ----------
  *exec(a) {
    const src = { side: a.side, i: a.i };
    if (!this.isAlive(src)) return;
    const unit = this.unit(src);
    if (a.side === 'p') B.pb[a.i].defend = false;
    // poison tick
    if (unit.poison) {
      const mx = a.side === 'p' ? stats(unit).maxhp : unit.maxhp; const n = Math.max(1, Math.floor(mx / 12));
      this.damage(src, n, '#b07dff'); yield 24;
      if (!this.isAlive(src)) return;
    }
    if (a.kind === 'defend') { B.pb[a.i].defend = true; this.banner('ぼうぎょ'); yield 18; return; }
    if (a.kind === 'flee') { yield* this.flee(a); return; }
    const sk = a.kind === 'item' ? null : SKILLS[a.id];
    const item = a.kind === 'item' ? ITEMS[a.id] : null;
    const tgtMode = item ? item.target : sk.target;
    // resolve targets
    let targets = [];
    const otherSide = a.side === 'p' ? 'e' : 'p';
    const allOf = side => side === 'e' ? this.aliveE().map(e => ({ side: 'e', i: e.i })) : this.aliveP().map(i => ({ side: 'p', i }));
    const wantsDead = (item && item.dead) || (sk && sk.dead);
    if (sk && sk.kind === 'echo') { targets = G.party.map((_, i) => ({ side: 'p', i })); B.echo = 0; B.voice = { ...echoVoice(), t: 0 }; }
    else if (tgtMode === 'enemies') targets = allOf(otherSide);
    else if (tgtMode === 'allies') targets = allOf(a.side);
    else {
      let t = a.target;
      if (!wantsDead && !this.isAlive(t)) { const pool = allOf(t.side); if (!pool.length) return; t = pick(pool); }
      targets = [t];
    }
    if (!targets.length) return;
    // MP
    if (sk && sk.mp && a.side === 'p') { if (unit.mp < sk.mp) { this.banner('MPが足りない!'); yield 30; return; } unit.mp -= sk.mp; }
    // name banner
    if (item) this.banner(item.name); else if (a.id !== 'attack') this.banner(sk.name);
    // approach animation: fighters dash across to the target, casters step forward and charge a spell circle
    const melee = !item && sk && (sk.kind === 'phys' || sk.kind === 'steal');
    let dash = 0;
    if (a.side === 'p') {
      const pb = B.pb[a.i]; pb.pose = melee ? 'attack' : 'cast';
      if (melee) {
        const tx = tgtMode === 'enemies' ? 104 : (() => { const e = B.enemies[targets[0].i]; return e.x + e.w - 2; })();
        dash = Math.max(18, PARTY_POS(a.i).x + 4 - tx); pb.dashing = true; Audio8.sfx('whoosh');
        for (let k = 1; k <= 9; k++) { const q = k / 9; pb.offx = -dash * (1 - (1 - q) * (1 - q)); pb.trail.unshift(pb.offx); pb.trail.length = Math.min(pb.trail.length, 5); yield 1; }
        pb.dashing = false; pb.trail = [];
      } else {
        for (let k = 0; k < 6; k++) { pb.offx = -k * 3; yield 1; }
        if (sk) { pb.castT = 1; Audio8.sfx('charge'); const c = this.center(src); const col = sk.kind === 'heal' || sk.kind === 'revive' || sk.kind === 'buff' ? ['#ffffff', '#60ffb0'] : sk.elem === 'fire' ? ['#fff0a0', '#ff5020'] : sk.elem === 'ice' ? ['#ffffff', '#40a8ff'] : sk.elem === 'bolt' ? ['#ffffff', '#ffe040'] : ['#ffffff', '#b070ff'];
          for (let i = 0; i < 18; i++) { const an = Math.random() * Math.PI * 2, r0 = 18 + Math.random() * 8; spawnP({ x: c.x + Math.cos(an) * r0, y: c.y + 10 + Math.sin(an) * r0 * 0.4, vx: -Math.cos(an) * r0 / 14, vy: -Math.sin(an) * r0 * 0.4 / 14 - 0.4, life: 14, size: 1.4, c0: col[0], c1: col[1], shape: 'star', delay: Math.floor(Math.random() * 6) }); }
          for (let k = 0; k < 14; k++) { pb.castT = k + 1; yield 1; } pb.castT = 0; }
      }
    }
    else { const e = B.enemies[a.i]; e.hitT = 0; e.blink = 1; yield 3; e.blink = 0; yield 2; e.blink = 1; yield 3; e.blink = 0; for (let k = 1; k <= 10; k++) { e.lunge = k / 10; yield 1; } e.lunge = 0; }
    const fx = item ? (item.heal || item.full || item.revive || item.mpheal ? 'heal' : 'heal') : (a.side === 'p' && a.id === 'attack' ? 'slash' : sk.fx);
    if (a.kind === 'skill' && sk.kind === 'steal') { yield* this.steal(src, targets[0]); }
    else {
      const hits = (sk && sk.hits) || 1;
      for (let h = 0; h < hits; h++) {
        this.playFx(fx, src, targets);
        yield fxDur(fx) * 0.6;
        for (const t of targets) {
          if (!wantsDead && !(sk && sk.kind === 'echo') && !this.isAlive(t)) continue;
          if (item) this.applyItem(item, t);
          else this.applySkill(sk, src, t);
        }
        yield 14;
      }
    }
    if (a.side === 'p') {
      const pb = B.pb[a.i];
      if (dash) { const from = pb.offx; for (let k = 1; k <= 10; k++) { const q = k / 10; pb.offx = from * (1 - q); pb.offy = -Math.sin(q * Math.PI) * 10; yield 1; } pb.offx = 0; pb.offy = 0; }
      else for (let k = 5; k >= 0; k--) { pb.offx = -k * 3; yield 1; }
    }
    yield 10;
  },
  applySkill(sk, src, t) {
    switch (sk.kind) {
      case 'phys': {
        const r = this.phys(src, t, sk.mult);
        if (r.miss) { this.popup(t, 'MISS', '#ccc'); Audio8.sfx('cancel'); break; }
        let dmg = r.dmg;
        this.damage(t, dmg, r.crit ? '#ffe060' : '#fff', r.crit ? 'CRITICAL' : null); Audio8.sfx(r.crit ? 'crit' : 'hit');
        if (r.crit) { G.shake = 10; B.stop = 6; flashFx('#ffffff', 0.35); }
        else if (src.side === 'p' && sk.mult >= 1.7) B.stop = 3;
        if (sk.steal && t.side === 'e' && this.isAlive(t)) this.trySteal(src, t);
        if (sk.poison && t.side === 'p' && this.isAlive(t) && rnd() < sk.poison) { G.party[t.i].poison = true; this.popup(t, '毒', '#b07dff'); }
        break;
      }
      case 'mag': {
        const r = this.magic(src, t, sk);
        if (r.heal) { this.heal(t, r.heal, 'ABSORB'); break; }
        this.damage(t, r.dmg, r.note === 'weak' ? '#ffb040' : '#fff', r.note === 'weak' ? 'WEAK!' : null);
        if (r.note === 'weak') B.stop = 3;
        if (sk.drain && this.isAlive(src)) this.heal(src, Math.max(1, Math.round(r.dmg * 0.5)));
        break;
      }
      case 'heal': {
        const n = this.healAmt(src, sk);
        if (t.side === 'e' && B.enemies[t.i].d.undead) this.damage(t, n, '#fff'); else this.heal(t, n);
        break;
      }
      case 'cure': { const u = this.unit(t); u.poison = false; this.popup(t, 'CURE', '#7dffa0'); break; }
      case 'echo': { // the voices of the lost lift everyone back up
        const u = G.party[t.i], mx = stats(u).maxhp; const was = u.hp;
        if (u.hp <= 0) { u.hp = Math.ceil(mx / 2); B.pb[t.i].atb = 50; } else u.hp = Math.min(mx, u.hp + Math.ceil(mx / 2));
        u.poison = false; B.pb[t.i].prot = true; this.popup(t, u.hp - was || 'FULL', '#7dffa0', 'ECHO'); break;
      }
      case 'buff': { if (t.side !== 'p') break; B.pb[t.i][sk.buff] = true; this.popup(t, sk.buff === 'prot' ? 'PROTECT' : 'HASTE', sk.buff === 'prot' ? '#9fd8ff' : '#ffe080'); Audio8.sfx('buff'); break; }
      case 'revive': {
        const u = this.unit(t);
        if (t.side === 'p' && u.hp <= 0) { u.hp = Math.max(1, Math.floor(stats(u).maxhp * 0.4)); B.pb[t.i].atb = 0; this.popup(t, u.hp, '#7dffa0'); }
        else if (t.side === 'e' && B.enemies[t.i].d.undead) this.damage(t, 9999);
        else this.popup(t, 'MISS', '#ccc');
        break;
      }
    }
  },
  applyItem(it, t) {
    const u = this.unit(t); const s = stats(u);
    if (it.revive) { if (u.hp <= 0) { u.hp = Math.max(1, Math.floor(s.maxhp * it.revive)); B.pb[t.i].atb = 0; this.popup(t, u.hp, '#7dffa0'); } else this.popup(t, 'MISS', '#ccc'); return; }
    if (u.hp <= 0) { this.popup(t, 'MISS', '#ccc'); return; }
    if (it.heal) this.heal(t, Math.min(it.heal, s.maxhp - u.hp) || 0);
    if (it.mpheal) { const n = Math.min(it.mpheal, s.maxmp - u.mp); u.mp += n; this.popup(t, n, '#7dd0ff'); }
    if (it.full) { u.hp = s.maxhp; u.mp = s.maxmp; this.popup(t, 'FULL', '#7dffa0'); }
    if (it.cure) { u.poison = false; this.popup(t, 'CURE', '#7dffa0'); }
    Audio8.sfx('heal');
  },
  trySteal(src, t) {
    const e = B.enemies[t.i]; if (!e.d.steal || e.stolen) return;
    const ch = 0.45 + (this.statsOf(src).spd - e.d.spd) * 0.02 - (e.d.boss ? 0.15 : 0);
    if (rnd() < ch) { e.stolen = true; addItem(e.d.steal); Audio8.sfx('steal'); this.banner(`${ITEMS[e.d.steal].name}を盗んだ!`); }
  },
  *steal(src, t) {
    const e = B.enemies[t.i];
    yield 10;
    if (!e.d.steal || e.stolen) { this.banner('何も持っていない!'); yield 40; return; }
    const ch = 0.45 + (this.statsOf(src).spd - e.d.spd) * 0.02 - (e.d.boss ? 0.15 : 0);
    if (rnd() < ch) { e.stolen = true; addItem(e.d.steal); Audio8.sfx('steal'); this.banner(`${ITEMS[e.d.steal].name}を盗んだ!`); }
    else { Audio8.sfx('cancel'); this.banner('盗めなかった…'); }
    yield 44;
  },
  *flee(a) {
    if (B.cfg.boss || B.cfg.noEscape) { this.banner('逃げられない!'); yield 40; return; }
    const ps = this.aliveP().map(i => stats(G.party[i]).spd), es = this.aliveE().map(e => e.d.spd);
    const ch = clamp(0.55 + (ps.reduce((s, v) => s + v, 0) / ps.length - es.reduce((s, v) => s + v, 0) / es.length) * 0.03, 0.25, 0.92);
    if (rnd() < ch) {
      this.banner('逃げ出した!'); Audio8.sfx('escape'); B.flee = true;
      for (let k = 0; k < 24; k++) { B.pb.forEach(p => p.offx += 3); yield 1; }
      B.phase = 'end'; this.finish('escape');
    } else { this.banner('逃げられなかった!'); yield 40; }
  },
  banner(text) { B.banner = { text, t: 50 }; },
  playFx(type, src, targets) {
    const from = this.center(src);
    for (const t of targets) B.fx.push({ type, t: 0, dur: fxDur(type), ...this.center(t), fx: from.x, fy: from.y, big: t.side === 'e' ? B.enemies[t.i].w : 32 });
    const s = { slash: 'slash', slash2: 'slash', whirl: 'slash', braver: 'crit', claw: 'slash', fire: 'fire', ice: 'ice', bolt: 'bolt', heal: 'heal', holy: 'holy', dark: 'dark', meteor: 'meteor', quake: 'crit', beam: 'holy', wind: 'wind', barrier: 'buff', haste: 'buff' }[type];
    if (s) Audio8.sfx(s);
    if (type === 'quake' || type === 'meteor' || type === 'braver') G.shake = 16;
    if (type === 'meteor' || type === 'braver') B.stop = 4;
    for (const t of targets) { const c = this.center(t); spawnFx(type, c.x, c.y, t.side === 'e' ? B.enemies[t.i].w : 30, from); }
  },
  // ---------- end sequences ----------
  *victory() {
    yield 30;
    Audio8.play('victory'); B.cheer = true;
    let exp = 0, gil = 0; const drops = [];
    for (const e of B.enemies) { exp += e.d.exp; gil += e.d.gil; if (e.d.drop && rnd() < e.d.drop[1]) drops.push(e.d.drop[0]); }
    G.gil += gil; G.party.forEach(m => m.poison = false);
    for (const d of drops) addItem(d);
    const lines = [];
    for (const m of G.party) { const ms = gainExp(m, exp); if (ms.length) { lines.push(...ms); } }
    B.result = { exp, gil, drops, t: 0 };
    yield 'key';
    for (const l of lines) { B.msg = l; if (l.includes('レベル')) Audio8.sfx('levelup'); yield 'key'; }
    B.msg = null; B.result = null; B.phase = 'end';
    this.finish('win');
  },
  *defeat() {
    yield 40; Audio8.play('gameover'); B.msg = '全滅してしまった…'; yield 'key'; B.msg = null;
    B = null; GameOver.start();
  },
  finish(result) {
    const cb = B.cb; const cfg = B.cfg;
    transition(() => {
      B = null; G.scene = Field; Audio8.play(G.map.music); G.steps = 0;
      if (cfg.final && result === 'win') { }
      if (cb) cb(result);
    });
  },
  // ---------- draw ----------
  draw() {
    if (!B) return;
    const set = G.map ? G.map.set : 'world';
    const env = G.mapId === 'shrine' ? ENV.battleShrine : set === 'cave' ? ENV.battleCave : set === 'tower' ? ENV.battleTower : ENV.battleDay;
    // background layer: soft focus far away, sharper near the ground (HD-2D style)
    beginWorld('#05050f'); const bg = drawBattleBg(set, G.mapId); layerToMain([1, 0.25]);
    // character layer: crisp pixels
    beginWorld();
    let sx = 0, sy = 0; if (G.shake > 0) { const a = Math.min(1, G.shake / 10); sx = (Math.random() - 0.5) * 7 * a; sy = (Math.random() - 0.5) * 4 * a; }
    ctx.save(); ctx.translate(Math.round(sx), Math.round(sy));
    const slide = B.slide;
    for (const e of B.enemies) {
      if (!e.alive && e.dying >= 40) continue;
      const A = ENEMY_ANIM[e.img];
      const fi = A ? Math.floor((B.t + e.i * 5) / A.period) % 4 : 0;
      const img = A ? A.frames[fi] : ENEMY_IMG[e.img], fl = A ? A.flash[fi] : ENEMY_IMG[e.img + ':flash'];
      const bob = A && A.float ? Math.round(Math.sin((B.t + e.i * 20) / 16) * 2.5) : 0;
      const lunge = e.lunge ? Math.round(Math.sin(e.lunge * Math.PI) * 14) : 0;
      const ex = Math.round(e.x - slide * 180 - e.kb) + lunge, ey = e.y + bob;
      ctx.fillStyle = 'rgba(8,4,16,.38)'; ctx.beginPath(); ctx.ellipse(e.x - slide * 180 + lunge + e.w / 2 + 3, e.y + e.h - 1, e.w / (A && A.float ? 2.8 : 2.2), 3.5, 0, 0, Math.PI * 2); ctx.fill();
      if (!e.alive) { // dissolve from the bottom up, rows drifting apart
        const k = e.dying / 40;
        for (let r = 0; r < img.height; r += 2) {
          const rk = clamp(k * 1.9 - (r / img.height) * 0.9, 0, 1); if (rk >= 1) continue;
          const off = Math.sin(r * 1.7 + e.i) * rk * 10;
          ctx.globalAlpha = 1 - rk; ctx.drawImage(img, 0, r, img.width, 2, ex + off, ey + r - rk * 4, img.width, 2);
          const dz = A ? A.dz[fi] : fl; ctx.globalAlpha = (1 - rk) * Math.min(1, rk * 3) * 0.75; ctx.drawImage(dz, 0, r, img.width, 2, ex + off, ey + r - rk * 4, img.width, 2);
        }
        ctx.globalAlpha = 1; continue;
      }
      ctx.drawImage((e.hitT % 4 > 1 || e.blink) ? fl : img, ex + (e.hitT ? (e.hitT % 2 ? 2 : -2) : 0), ey);
    }
    G.party.forEach((m, i) => {
      const p = PARTY_POS(i); const pb = B.pb[i]; const hb = SPR[m.id].hb;
      let x = p.x + Math.round(pb.offx) + Math.round(slide * 80), y = p.y + Math.round(pb.offy || 0);
      const active = B.menu && B.menu.who === i;
      if (active) x -= 8;
      let pose = 'idle';
      if (m.hp <= 0) pose = 'ko';
      else if (pb.hitT > 0) pose = 'hurt';
      else if (B.flee || pb.dashing) pose = 'walk';
      else if (pb.offx < 0) pose = pb.offx <= -12 ? (pb.pose === 'cast' ? 'cast' : 'strike') : (pb.pose === 'cast' ? 'cast' : 'walk');
      else if (B.cheer) pose = 'win';
      else if (active && B.menu.stage !== 'cmd') pose = 'cast';
      else if (stats(m).maxhp / 4 > m.hp) pose = 'kneel';
      let img = hb[pose];
      if (pb.hitT % 4 > 1) img = hb.flash[pose];
      const breathe = pose === 'idle' && ((B.t + i * 17) >> 5) % 2 ? 1 : 0;
      if (B.cheer && m.hp > 0) y -= Math.abs(Math.sin(B.t / 7 + i)) * 5;
      if (pb.castT) { // spell circle under the caster
        const k = Math.min(1, pb.castT / 6), cx = x + 17, cy = p.y + 30, col = HEROES[m.id].cmd === '白魔法' ? '160,255,200' : '200,150,255';
        ctx.save(); ctx.globalAlpha = k * 0.9; ctx.strokeStyle = `rgba(${col},.9)`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(cx, cy, 15 * k, 4.5 * k, 0, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(cx, cy, 11 * k, 3.2 * k, 0, 0, Math.PI * 2); ctx.stroke();
        for (let r2 = 0; r2 < 6; r2++) { const an = r2 / 6 * Math.PI * 2 + pb.castT * 0.15; ctx.fillStyle = `rgba(${col},1)`; ctx.fillRect(Math.round(cx + Math.cos(an) * 13 * k), Math.round(cy + Math.sin(an) * 3.8 * k), 1, 1); }
        ctx.restore(); addLight(cx, cy - 6, 50, HEROES[m.id].cmd === '白魔法' ? '#a0ffc8' : '#c8a0ff', 0.7 * k);
      }
      ctx.fillStyle = 'rgba(8,4,16,.38)'; ctx.beginPath(); ctx.ellipse(x + 17, p.y + 31, 10, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      for (let k = pb.trail.length - 1; k >= 1; k--) { ctx.globalAlpha = 0.35 * (1 - k / pb.trail.length); ctx.drawImage(hb.walk || hb.idle, p.x + Math.round(pb.trail[k]), y - 8); }
      ctx.globalAlpha = 1;
      if (pb.haste && m.hp > 0 && !pb.dashing && (B.t >> 2) % 3 === 0) { ctx.globalAlpha = 0.25; ctx.drawImage(img, x + 3, y - 8); ctx.globalAlpha = 1; }
      const sh = pb.hitT ? (pb.hitT % 2 ? 2 : -2) : 0;
      if (pose === 'ko') ctx.drawImage(img, x - 4 + sh, p.y);
      else { ctx.drawImage(img, x + sh, y - 8 + breathe, HB_W, HB_H - breathe); }
      if (active) addLight(x + 16, y + 16, 60, '#ffe2a0', 0.6);
    });
    ctx.restore();
    for (const [lx_, ly_, lr, lc] of bg.lights) addLight(lx_, ly_, lr, lc, 0.8);
    finishPost(env, layerToMain(null));
    // overlays on the high-res canvas
    G.party.forEach((m, i) => {
      const p = PARTY_POS(i); const pb = B.pb[i]; const x = p.x + pb.offx + Math.round(B.slide * 80) - (B.menu && B.menu.who === i ? 8 : 0);
      if (pb.defend && m.hp > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(140,200,255,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + 16, p.y + 16, 18, -1.2, 1.2); ctx.stroke(); ctx.restore(); }
      if (m.poison && m.hp > 0) { ctx.fillStyle = '#c08cff'; ctx.beginPath(); ctx.arc(x + 5, p.y - 1 - (B.t >> 3) % 3, 1.2, 0, 7); ctx.fill(); }
      if (pb.prot && m.hp > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25 + 0.15 * Math.sin(B.t / 9 + i); ctx.strokeStyle = '#9fd8ff'; ctx.lineWidth = 0.6;
        for (let h = 0; h < 6; h++) { const an = h / 6 * Math.PI * 2 + B.t / 40; ctx.beginPath(); ctx.moveTo(x + 18 + Math.cos(an) * 14, p.y + 16 + Math.sin(an) * 16); ctx.lineTo(x + 18 + Math.cos(an + 1.047) * 14, p.y + 16 + Math.sin(an + 1.047) * 16); ctx.stroke(); } ctx.restore(); }
      if (pb.haste && m.hp > 0) { ctx.fillStyle = '#ffe080'; const hy = p.y + 4 - ((B.t >> 2) % 4); ctx.fillRect(x + 31, hy, 2, 1); ctx.fillRect(x + 32, hy + 1, 2, 1); ctx.fillRect(x + 31, hy + 2, 2, 1); }
    });
    for (const f of B.fx) drawFx(f);
    drawParts();
    if (B.flashFx && B.flashFx.a > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(0.6, B.flashFx.a); ctx.fillStyle = B.flashFx.col; ctx.fillRect(0, 0, SW, 150); ctx.restore(); }
    for (const p of B.popups) drawPopup(p);
    // HUD
    win(0, 150, 96, 74);
    const names = []; for (const e of B.enemies) if (e.alive) names.push(e.name);
    if (!B.menu) names.slice(0, 5).forEach((n, i) => text(n, 9, 158 + i * 12, UI.ink, n.length > 8 ? 7 : 8));
    const listOpen = B.menu && (B.menu.stage === 'list' || (B.menu.stage === 'target' && B.menu.prev === 'list'));
    if (!listOpen) {
    win(96, 150, 160, 74);
    text('HP', 132, 152.5, UI.label, 5); text('MP', 186, 152.5, UI.label, 5); text('ATB', 204, 152.5, UI.label, 5);
    if (echoReady()) { const full = B.echo >= 100, a = full ? 0.7 + 0.3 * Math.sin(G.frame / 6) : 1; ctx.save(); ctx.globalAlpha = a; text('ECHO', 104, 152.5, full ? '#bff4ff' : UI.label, 5); bar(117, 154, 12, 1.6, B.echo / 100, full ? '#9ff0ff' : '#6aa8c8'); ctx.restore(); }
    G.party.forEach((m, i) => {
      const y = 160 + i * 15.5; const s = stats(m); const pb = B.pb[i];
      const active = B.menu && B.menu.who === i;
      const col = m.hp <= 0 ? '#ff7a86' : m.hp < s.maxhp / 4 ? '#ffd860' : UI.ink;
      if (active) { const g = ctx.createLinearGradient(100, 0, 250, 0); g.addColorStop(0, 'rgba(240,207,134,.22)'); g.addColorStop(1, 'rgba(240,207,134,0)'); ctx.fillStyle = g; ctx.fillRect(100, y - 2, 150, 13); }
      text(HEROES[m.id].name, 104, y, active ? UI.gold : col, 8, 'left', 't');
      text(String(m.hp), 156, y, col, 8, 'right');
      text('/' + s.maxhp, 157, y + 1.5, UI.muted, 6);
      bar(104, y + 10, 72, 1.6, m.hp / s.maxhp, m.hp < s.maxhp / 4 ? '#ffb040' : UI.hp);
      text(String(m.mp), 196, y, UI.mp, 7, 'right');
      bar(204, y + 3, 44, 3.2, pb.atb / 100, pb.atb >= 100 ? '#ffd76a' : '#9fb6d2');
    });
    }
    if (B.menu) BMenu.draw();
    if (B.phase === 'main' || B.phase === 'win') {
      if (G.auto) { const a = 0.75 + 0.25 * Math.sin(G.frame / 8); ctx.save(); ctx.globalAlpha = a; win(206, 3, 48, 17); text('AUTO ▶▶', 230, 7.5, UI.gold, 7, 'center'); ctx.restore(); }
      else if (B.menu && B.menu.stage === 'cmd') text('MENU:オート', 252, 5, 'rgba(230,220,200,.7)', 6, 'right');
    }
    if (B.phase === 'intro' && B.cfg.boss) drawBossIntro();
    if (B.result) drawResult();
    if (B.voice) drawVoice(B.voice);
    if (B.banner) { const w = Math.max(80, textW(B.banner.text, 8, 't') + 28); win((SW - w) / 2, 5, w, 20); text(B.banner.text, SW / 2, 11, UI.ink, 8, 'center', 't'); }
    if (B.msg) { win(8, 5, 240, 22); text(B.msg, SW / 2, 12, UI.ink, 8, 'center'); if (B.waitKey) { const bob = Math.sin(G.frame / 6); ctx.fillStyle = UI.gold; ctx.beginPath(); ctx.moveTo(238, 17 + bob); ctx.lineTo(243, 17 + bob); ctx.lineTo(240.5, 20.5 + bob); ctx.fill(); } }
  },
};

// damage numbers: each digit hops in turn; crits and weaknesses get a tag above the number
function drawPopup(p) {
  const k = p.t; const a = k > 40 ? (50 - k) / 10 : 1; const crit = p.tag === 'CRITICAL';
  const size = crit ? 13 : p.tag === 'WEAK!' ? 11.5 : 10;
  ctx.save(); ctx.globalAlpha = a; ctx.font = `800 ${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineJoin = 'round';
  const chars = p.text.split(''); const ws = chars.map(c => ctx.measureText(c).width * 0.92); const tw = ws.reduce((s2, w) => s2 + w, 0);
  let x = p.x - tw / 2;
  chars.forEach((c, i) => {
    const kk = k - i * 2; let dy = p.heal ? -Math.min(k, 20) * 0.35 : (kk < 0 ? 0 : kk < 12 ? -Math.sin(kk / 12 * Math.PI) * (crit ? 12 : 9) : kk < 18 ? -Math.sin((kk - 12) / 6 * Math.PI) * 2 : 0);
    if (kk < 0 && !p.heal) { x += ws[i]; return; }
    const cx = x + ws[i] / 2, cy = p.y + dy - 7;
    ctx.lineWidth = crit ? 2.2 : 1.6; ctx.strokeStyle = 'rgba(10,6,20,.92)'; ctx.strokeText(c, cx, cy);
    if (crit) { const g = ctx.createLinearGradient(0, cy, 0, cy + size); g.addColorStop(0, '#fffbe0'); g.addColorStop(1, '#ffb030'); ctx.fillStyle = g; } else ctx.fillStyle = p.col;
    ctx.fillText(c, cx, cy); x += ws[i];
  });
  if (p.tag) {
    const ty = p.y - 18 - Math.min(k, 10) * 0.4; ctx.font = `800 6px ${FONT}`; ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(10,6,20,.9)';
    const tc = crit ? '#ffe060' : p.tag === 'WEAK!' ? '#ffb040' : p.tag === 'ABSORB' ? '#7dffa0' : '#ffffff';
    ctx.strokeText(p.tag, p.x, ty); ctx.fillStyle = tc; ctx.fillText(p.tag, p.x, ty);
  }
  ctx.restore();
}
// the Echo: who can be heard depends on where the story is
function echoReady() { return G.flags.echo && G.party.some(m => m.id === 'lina' && m.hp > 0); }
function echoVoice() {
  if (B.cfg.ids.includes('tempest') && G.party.some(m => m.id === 'kai')) return { who: '親方', text: 'カイ! てめえの地図は、てめえで描け!' };
  if (B.cfg.final) return { who: 'レオン', text: '止まるな、アレン。お前たちの明日を見せてくれ' };
  if (G.flags.guardian) return { who: 'レオン', text: '大丈夫だ。お前たちは、ひとりじゃない' };
  if (G.flags.towerOpen) return { who: '???', text: '…通してあげて。あの子たちを、守って' };
  return { who: 'クリスタル', text: 'まだ…光は、ここにある' };
}
function drawVoice(v) {
  const a = clamp(v.t / 20, 0, 1) * clamp((200 - v.t) / 30, 0, 1); if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, 40, 0, 84); g.addColorStop(0, 'rgba(160,230,255,0)'); g.addColorStop(0.5, 'rgba(60,110,160,.55)'); g.addColorStop(1, 'rgba(160,230,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 40, SW, 44);
  text('— ' + v.who + ' —', SW / 2, 48, '#bff4ff', 7, 'center', 't');
  const shown = v.text.slice(0, Math.floor(v.t / 2)); text(shown, SW / 2, 62, '#ffffff', 9, 'center', 't');
  ctx.restore();
}
// cinematic bars and a name card while a boss slides in
function drawBossIntro() {
  const t = (1 - B.slide) * 24 + B.hold; const k = clamp(t / 14, 0, 1), out = clamp((B.hold - 50) / 14, 0, 1); const bar = 22 * k * (1 - out);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SW, bar); ctx.fillRect(0, SH - bar, SW, bar);
  const boss = B.enemies.find(e => e.d.boss); if (!boss) return;
  const ck = clamp((t - 10) / 16, 0, 1) * (1 - out); if (ck <= 0) return;
  const e = 1 - Math.pow(1 - ck, 3); const x = -60 + e * 76;
  ctx.save(); ctx.globalAlpha = ck;
  const g = ctx.createLinearGradient(x - 10, 0, x + 170, 0); g.addColorStop(0, 'rgba(8,6,20,0)'); g.addColorStop(0.15, 'rgba(8,6,20,.82)'); g.addColorStop(0.75, 'rgba(8,6,20,.82)'); g.addColorStop(1, 'rgba(8,6,20,0)');
  ctx.fillStyle = g; ctx.fillRect(x - 10, 104, 180, 30);
  ctx.fillStyle = 'rgba(216,183,112,.9)'; ctx.fillRect(x, 104, 150 * e, 0.6); ctx.fillRect(x + 20, 133.4, 150 * e, 0.6);
  text('BOSS', x + 4, 107, '#ff7080', 6.5);
  text(boss.d.name, x + 4, 116, UI.gold, 11, 'left', 't');
  ctx.restore();
}
// victory panel: EXP and gil count up, drops listed underneath
function drawResult() {
  const R = B.result; const k = clamp(R.t / 12, 0, 1); const h = 50 + R.drops.length * 12;
  const y0 = 46 - (1 - k) * 10, X = 14 - 48;
  ctx.save(); ctx.globalAlpha = k; ctx.translate(X, 0); win(48, y0, 160, h);
  const shine = (R.t * 4) % 220 - 40;
  ctx.font = `800 13px ${FONT_T}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const g = ctx.createLinearGradient(80 + shine, 0, 110 + shine, 0); g.addColorStop(0, '#f0cf86'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#f0cf86');
  ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillText('VICTORY', 128.6, y0 + 6.6); ctx.fillStyle = g; ctx.fillText('VICTORY', 128, y0 + 6);
  const c = clamp((R.t - 10) / 40, 0, 1);
  text('EXP', 64, y0 + 25, UI.label, 7); text(String(Math.round(R.exp * c)), 120, y0 + 24, UI.ink, 8, 'right');
  text('ギル', 134, y0 + 25, UI.label, 7); text(String(Math.round(R.gil * c)), 196, y0 + 24, UI.gold, 8, 'right');
  ctx.fillStyle = 'rgba(216,183,112,.4)'; ctx.fillRect(60, y0 + 37, 136, 0.5);
  R.drops.forEach((d, i) => text(`${ITEMS[d].name} を手に入れた!`, 128, y0 + 42 + i * 12, '#c8f0ff', 7.5, 'center'));
  if (R.t > 50) { const bob = Math.sin(G.frame / 6); ctx.fillStyle = UI.gold; ctx.beginPath(); ctx.moveTo(196, y0 + h - 10 + bob); ctx.lineTo(201, y0 + h - 10 + bob); ctx.lineTo(198.5, y0 + h - 6.5 + bob); ctx.fill(); }
  ctx.restore();
}

const BOSS_AI = {
  gking(e) { if (e.turn % 3 === 0) return 'roar'; return rnd() < 0.4 ? 'smash' : 'attack'; },
  guardian(e) { return ['attack', 'beam', 'attack', 'quake', 'beam', 'attack'][e.turn % 6]; },
  tempest(e) {
    if (!e.phase2 && e.hp < e.maxhp * 0.4) { e.phase2 = true; e.buff = 1.12; Battle.banner('嵐が激しさを増した!'); G.shake = 20; return 'tornado'; }
    return e.phase2 ? ['tornado', 'attack', 'gust', 'talon', 'tornado', 'attack'][e.turn % 6] : ['attack', 'gust', 'talon', 'attack', 'tornado'][e.turn % 5];
  },
  garva(e) {
    if (!e.phase2 && e.hp < e.maxhp / 2) { e.phase2 = true; e.buff = 1.15; Battle.banner('ガルヴァの闇が膨れ上がった!'); G.shake = 20; return 'darkwave'; }
    return e.phase2 ? ['darkwave', 'attack', 'darkblade', 'attack', 'darkwave', 'darkblade'][e.turn % 6] : ['attack', 'darkblade', 'attack', 'frost', 'attack'][e.turn % 5];
  },
};

// ---------- battle background (painted per area, cached) ----------
const BG_CACHE = {};
function bgKey(set, mapId) {
  if (mapId === 'tower3') return 'sanctum';
  if (mapId === 'shrine') return 'shrine';
  if (set === 'world') { const ch = G.map.g[G.p.y][G.p.x]; if (ch === 'T') return 'forest'; return G.p.y >= 14 ? 'dusk' : 'plains'; }
  if (set === 'town') return 'plains';
  return set;
}
function paintBg(key) {
  const c = mkCanvas(SW, 150), x = c.getContext('2d'); const r = mulberry(key.length * 97 + 3); const lights = [], anim = {};
  const P = (col, a, b, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), w, h); };
  const grad = (y0, y1, stops) => { const g = x.createLinearGradient(0, y0, 0, y1); stops.forEach((s2, i) => g.addColorStop(i / (stops.length - 1), s2)); return g; };
  const ridge = (base, amp, col, seed, step = 6, f = 41) => { const rr = mulberry(seed); x.fillStyle = col; x.beginPath(); x.moveTo(0, 150); for (let i = -6; i <= SW + 6; i += step) x.lineTo(i, base - Math.abs(Math.sin(i / f + seed)) * amp - rr() * amp * 0.25); x.lineTo(SW, 150); x.fill(); };
  const blob = (cx, cy, rad, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, rad, 0, 7); x.fill(); };
  const ell = (cx, cy, rx, ry, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, 7); x.fill(); };
  const poly = (pts, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.closePath(); x.fill(); };
  const groundRows = (y0, cols) => { for (let y = y0; y < 150; y++) { const k = (y - y0) / (150 - y0); x.fillStyle = cols[Math.min(cols.length - 1, Math.floor(k * cols.length))]; x.fillRect(0, y, SW, 1); } };
  // puffy cloud: shaded underside, lit crown
  const cloud = (cx, cy, w, lit, mid, shade) => {
    ell(cx, cy + 2, w, w * 0.22, shade);
    for (let i = 0; i < 5; i++) { const ox = (i - 2) * w * 0.32, rr = w * (0.28 + (2 - Math.abs(i - 2)) * 0.09); blob(cx + ox, cy - rr * 0.4, rr, mid); }
    for (let i = 0; i < 4; i++) { const ox = (i - 1.5) * w * 0.3, rr = w * (0.2 + (1.5 - Math.abs(i - 1.5)) * 0.08); blob(cx + ox - 1, cy - rr * 0.7 - 1, rr, lit); }
  };
  // round tree: trunk, then dark → light leaf clusters
  const tree = (tx, ty, s, cols, trunk = '#4a3020') => {
    P(trunk, tx - s * 0.12, ty - s * 0.6, Math.max(1, s * 0.24), s * 0.6);
    blob(tx, ty - s * 1.0, s * 0.62, cols[0]); blob(tx - s * 0.3, ty - s * 0.85, s * 0.42, cols[0]); blob(tx + s * 0.32, ty - s * 0.88, s * 0.42, cols[0]);
    blob(tx - s * 0.12, ty - s * 1.12, s * 0.45, cols[1]); blob(tx - s * 0.32, ty - s * 0.95, s * 0.28, cols[1]);
    blob(tx - s * 0.22, ty - s * 1.25, s * 0.22, cols[2]);
  };
  // perspective tiled floor converging on (128, hz)
  const floor = (hz, a, b, line) => {
    const img = x.getImageData(0, hz, SW, 150 - hz), d = img.data, A = hex(a), Bc = hex(b), Ln = hex(line);
    for (let y = 0; y < 150 - hz; y++) { const t = 46 / (y + 3); const row = Math.floor(t * 2.2); const fade = Math.min(1, y / 40);
      for (let i = 0; i < SW; i++) { const wx = (i - 128) * t / 6, col = Math.floor(wx + 100); const fx = wx + 100 - col, fy = t * 2.2 - row;
        const C = (fx < 0.06 * (1 + fade) || fy < 0.08) ? Ln : ((row + col) % 2 ? A : Bc); const o = (y * SW + i) * 4; const sh = 0.75 + 0.25 * fade;
        d[o] = C[0] * sh; d[o + 1] = C[1] * sh; d[o + 2] = C[2] * sh; d[o + 3] = 255; } }
    x.putImageData(img, 0, hz);
  };
  const flame = (fx, fy) => { P('#3a2a20', fx - 1, fy, 3, 10); P('#c8a040', fx - 3, fy, 7, 1); P('#ffe080', fx - 1, fy - 4, 2, 4); P('#ffffff', fx, fy - 3, 1, 2); lights.push([fx, fy - 3, 46, '#ffb050']); (anim.flames = anim.flames || []).push([fx, fy]); };

  if (key === 'plains' || key === 'dusk' || key === 'forest') {
    const dusk = key === 'dusk';
    // sky, sun, clouds
    x.fillStyle = grad(0, 86, dusk ? ['#2a2a62', '#7a4a8a', '#e07a5a', '#ffc078'] : ['#2e66c8', '#5a96e6', '#9ccaf6', '#e6f4ff']); x.fillRect(0, 0, SW, 88);
    const sx = dusk ? 186 : 206, sy = dusk ? 50 : 20;
    for (let k = 4; k >= 1; k--) blob(sx, sy, 6 + k * 5, dusk ? `rgba(255,200,120,${0.08 * (5 - k)})` : `rgba(255,255,230,${0.07 * (5 - k)})`);
    blob(sx, sy, 8, dusk ? '#ffd890' : '#fffbe8'); lights.push([sx, sy, 100, dusk ? '#ffa050' : '#fff4d0']);
    const cc = dusk ? ['#ffd8c0', '#e8a0a0', '#8a5a7a'] : ['#ffffff', '#e8f0fa', '#a8bcd8'];
    for (const [cx, cy, w] of [[40, 22, 26], [120, 14, 20], [168, 34, 16], [86, 40, 12], [236, 46, 14]]) cloud(cx, cy, w, ...cc);
    // far snowy range with haze
    // far snowy range: lit left faces, shaded right faces, snow on the peaks, haze at the foot
    { const hAt = i => 66 - Math.abs(Math.sin(i / 41 + 2)) * 30;
      for (let i = 0; i < SW; i++) { const h = hAt(i), lit = hAt(i + 1) < h; P(dusk ? (lit ? '#7a5a86' : '#5a3e6a') : (lit ? '#8aa6d8' : '#6a86bc'), i, h, 1, 74 - h);
        if (h < 46) P(dusk ? (lit ? '#ffd8d0' : '#d8a8b8') : (lit ? '#ffffff' : '#d0dcf0'), i, h, 1, Math.min(46 - h, 5) + 1); } }
    x.fillStyle = grad(56, 76, [dusk ? 'rgba(240,150,120,0)' : 'rgba(220,235,255,0)', dusk ? 'rgba(240,150,120,.35)' : 'rgba(220,235,255,.45)']); x.fillRect(0, 56, SW, 20);
    ridge(76, 14, dusk ? '#4e3e62' : '#5a86b0', 5, 6, 30);
    // rolling hills with a windmill (Elm's wind)
    ridge(84, 10, dusk ? '#3e4a3a' : '#5a9a50', 9, 5, 24);
    for (let i = 0; i < 26; i++) { const tx = r() * SW, ty = 80 + r() * 4; tree(tx, ty, 3 + r() * 1.5, dusk ? ['#2a3a2a', '#3a4a30', '#4a5a38'] : ['#2e6a34', '#3e8a3e', '#5aa84a'], dusk ? '#2a2018' : '#3a2a1a'); }
    if (key !== 'forest') { const wx = 52, wy = 78; poly([wx - 4, wy, wx + 4, wy, wx + 2, wy - 16, wx - 2, wy - 16], dusk ? '#5a4a5a' : '#e8e0d0'); poly([wx - 3, wy - 16, wx + 3, wy - 16, wx, wy - 20], dusk ? '#4a2a3a' : '#b84a3a'); P(dusk ? '#2a1a2a' : '#6a4a3a', wx - 1, wy - 5, 2, 5); anim.mill = [wx, wy - 15]; }
    // near tree line
    for (let i = -6; i < SW + 6; i += 9) { const s = 6 + r() * 4; tree(i + r() * 4, 92, s, dusk ? ['#1e2a22', '#2a3a2a', '#3e4a32'] : ['#245a2c', '#2e7234', '#46923e']); }
    // meadow: banded grass, tufts growing toward the camera, flowers, stones, a rutted path
    groundRows(88, dusk ? ['#3e4a28', '#465230', '#4e5a34', '#566238', '#5e6a3c'] : ['#4a8a3a', '#529440', '#5a9e44', '#64a84a', '#6eb24e']);
    x.fillStyle = dusk ? 'rgba(150,110,70,.55)' : 'rgba(200,170,110,.6)'; x.beginPath(); x.moveTo(118, 88); x.lineTo(132, 88); x.quadraticCurveTo(150, 120, 196, 150); x.lineTo(70, 150); x.quadraticCurveTo(108, 118, 118, 88); x.fill();
    x.strokeStyle = dusk ? 'rgba(90,60,40,.5)' : 'rgba(150,120,70,.55)'; x.lineWidth = 1; x.beginPath(); x.moveTo(122, 89); x.quadraticCurveTo(110, 120, 96, 150); x.moveTo(128, 89); x.quadraticCurveTo(140, 120, 168, 150); x.stroke();
    for (let i = 0; i < 26; i++) { const yy = 92 + Math.pow(r(), 0.8) * 56, xx = 70 + (yy - 88) * 0.3 + r() * (60 + (yy - 88) * 1.2); const s = 1 + (yy - 88) / 30; P(dusk ? '#8a7050' : '#cab07a', xx, yy, s, s * 0.7); P(dusk ? '#5a4030' : '#9a8050', xx, yy + s * 0.6, s, 0.6); }
    for (let i = 0; i < 260; i++) { const yy = 88 + Math.pow(r(), 0.7) * 62, xx = r() * SW, s = 1 + (yy - 88) / 22; const dark = r() < 0.5;
      P(dark ? (dusk ? '#2e3a1e' : '#2e6a26') : (dusk ? '#7a8a46' : '#8aca5a'), xx, yy - s, Math.max(1, s * 0.4), s); if (s > 2) P(dark ? (dusk ? '#2e3a1e' : '#2e6a26') : (dusk ? '#7a8a46' : '#8aca5a'), xx + s * 0.6, yy - s * 0.7, 1, s * 0.7); }
    for (let i = 0; i < 26; i++) { const yy = 96 + r() * 52, xx = r() * SW, col = ['#fff3c4', '#ffb0c8', '#d8e8ff', '#ffe060'][i % 4]; P(col, xx, yy, 2, 2); P('#ffffff', xx, yy, 1, 1); P(dusk ? '#2e3a1e' : '#2e6a26', xx + 0.5, yy + 2, 1, 2); }
    for (const [rx, ry, rs] of [[28, 132, 7], [228, 140, 9], [210, 104, 4]]) { ell(rx, ry, rs, rs * 0.6, dusk ? '#5a5048' : '#8a8a86'); ell(rx - rs * 0.25, ry - rs * 0.2, rs * 0.55, rs * 0.3, dusk ? '#8a7a6a' : '#c8c8c0'); ell(rx + 1, ry + rs * 0.55, rs, 1.5, 'rgba(0,0,0,.25)'); }
    // foreground grass blades framing the scene
    for (let i = 0; i < 16; i++) { const bx = i < 8 ? r() * 40 : SW - r() * 40, h = 10 + r() * 16; poly([bx, 150, bx + 3, 150, bx + (r() - 0.5) * 10, 150 - h], dusk ? '#1a2412' : '#1e4a1a'); }
    if (key === 'forest') {
      x.fillStyle = 'rgba(16,40,22,.42)'; x.fillRect(0, 0, SW, 150);
      for (let layer = 0; layer < 2; layer++) for (let i = 0; i < 8; i++) {
        const tx = i * 34 + r() * 14 - 6, w = layer ? 9 + r() * 5 : 5 + r() * 3, col = layer ? '#2e2016' : '#3a3428';
        P(col, tx, 0, w, layer ? 104 : 90); P(layer ? '#4e3a24' : '#4a4a38', tx + 1, 0, 1, layer ? 104 : 90); P('rgba(0,0,0,.3)', tx + w - 2, 0, 2, layer ? 104 : 90);
        for (let k = 0; k < 6; k++) P(layer ? '#1e140c' : '#2a281e', tx + 1 + r() * (w - 2), r() * 90, 1, 3);
        if (layer) { P('#3e6a2e', tx - 1, 96 + r() * 6, w + 2, 2); P('#2e2016', tx - 3, 100, 3, 4); P('#2e2016', tx + w, 100, 3, 4); }
      }
      for (let i = 0; i < 22; i++) { const cx = r() * SW, cy = r() * 22; blob(cx, cy, 10 + r() * 10, ['#16381e', '#1e4a24', '#285a2c'][i % 3]); }
      for (let i = 0; i < 40; i++) P('#3e7a3a', r() * SW, r() * 30, 2, 2);
      for (const sx2 of [40, 110, 196]) { x.fillStyle = 'rgba(255,250,200,.13)'; x.beginPath(); x.moveTo(sx2, 0); x.lineTo(sx2 + 14, 0); x.lineTo(sx2 + 44, 150); x.lineTo(sx2 + 18, 150); x.fill(); lights.push([sx2 + 24, 90, 60, '#fff4c0']); }
      for (const [fx, fy] of [[20, 118], [236, 112], [70, 140], [180, 136]]) for (let k = 0; k < 5; k++) poly([fx, fy, fx + Math.cos(k * 0.7 - 2.6) * 10, fy + Math.sin(k * 0.7 - 2.6) * 7, fx + 1, fy + 1], '#2e7a34');
      for (const [mx, my] of [[44, 124], [214, 128], [150, 104]]) { P('#f0e8d8', mx, my, 1, 3); ell(mx + 0.5, my, 3, 1.6, '#d84a3a'); P('#ffffff', mx - 1, my - 1, 1, 1); }
      ell(150, 132, 24, 5, '#3a2a1a'); ell(150, 130, 24, 3, '#5a4028'); ell(127, 131, 3, 4, '#8a6a48'); for (let k = 0; k < 6; k++) P('#4a7a3a', 135 + k * 5, 127, 3, 1);
      anim.shafts = [40, 110, 196];
    }
  } else if (key === 'cave') {
    x.fillStyle = grad(0, 150, ['#0a0612', '#1a1222', '#261c2c']); x.fillRect(0, 0, SW, 150);
    // strata in the back wall
    for (let i = 0; i < 9; i++) { const y = 10 + i * 9; x.strokeStyle = i % 2 ? 'rgba(80,60,90,.25)' : 'rgba(20,10,30,.4)'; x.lineWidth = 2; x.beginPath(); for (let xx = 0; xx <= SW; xx += 8) x.lineTo(xx, y + Math.sin(xx / 30 + i) * 3); x.stroke(); }
    for (let layer = 0; layer < 3; layer++) { const col = ['#1a1220', '#241a2c', '#30243a'][layer], hl = ['#2a2030', '#382a42', '#4a3a54'][layer];
      for (let i = 0; i < 10; i++) { const sx2 = r() * SW, w = 6 + r() * 12, h = 18 + r() * 40 - layer * 4; poly([sx2 - w, 0, sx2, h, sx2 + w, 0], col); poly([sx2 - w * 0.6, 0, sx2 - 1, h * 0.8, sx2, 0], hl); P('#8ab8e8', sx2, h - 1, 1, 2); } }
    ridge(94, 24, '#1c1424', 7, 5); ridge(98, 12, '#251c2e', 3, 4);
    groundRows(94, ['#2e2430', '#3a2e36', '#463840', '#52424a']);
    for (let i = 0; i < 160; i++) { const yy = 96 + r() * 54, s = 1 + (yy - 94) / 28; P(r() < 0.5 ? '#2a2028' : '#64525a', r() * SW, yy, s, Math.max(1, s * 0.5)); }
    for (const [mx, h, w] of [[16, 26, 7], [62, 16, 5], [206, 22, 6], [244, 30, 8]]) { poly([mx - w, 96, mx, 96 - h, mx + w, 96], '#2e2232'); poly([mx - w * 0.6, 96, mx - 1, 96 - h * 0.9, mx, 96], '#4a3a4e'); }
    // underground pool with crystal reflections
    ell(150, 126, 44, 9, '#0e1c34'); ell(150, 125, 40, 7, '#1a3456'); ell(140, 123, 14, 2, '#3a6aa0'); for (let i = 0; i < 6; i++) P('#8ac8ff', 120 + i * 11, 124 + (i % 2) * 2, 4, 1);
    anim.pool = [150, 125];
    for (const [cx, cy, s2] of [[22, 104, 1.2], [232, 100, 1.4], [70, 90, 0.8], [188, 86, 0.7], [118, 96, 0.6]]) {
      for (let k = -1; k <= 1; k++) { const h = (16 + (k ? 0 : 6)) * s2, w = 3 * s2, bx = cx + k * 5 * s2; poly([bx - w, cy, bx - w * 0.3, cy - h, bx + w * 0.3, cy - h - 2 * s2, bx + w, cy], k ? '#3aa8d8' : '#7fe0ff'); poly([bx - w * 0.3, cy - h, bx, cy, bx - w, cy], k ? '#2a78b0' : '#4ab0e0'); P('#e8fbff', bx - 1, cy - h + 2, 1, h * 0.5); }
      lights.push([cx, cy - 10, 80 * s2, '#7fe6ff']); (anim.glints = anim.glints || []).push([cx, cy - 16 * s2]);
    }
    for (const [bx, by] of [[90, 138], [104, 140]]) { P('#d8d0c0', bx, by, 6, 2); P('#d8d0c0', bx + 1, by - 2, 2, 2); }
  } else if (key === 'tower') {
    x.fillStyle = grad(0, 96, ['#0e0a22', '#1e1840', '#2c2458']); x.fillRect(0, 0, SW, 96);
    // back wall masonry
    for (let y = 4; y < 92; y += 6) for (let xx = (y / 6) % 2 ? 0 : 6; xx < SW; xx += 12) { P('rgba(255,255,255,.04)', xx, y, 11, 1); P('rgba(0,0,0,.22)', xx, y + 5, 12, 1); }
    // rose window with tracery
    const wx = 128;
    x.fillStyle = '#080614'; x.beginPath(); x.moveTo(wx - 26, 80); x.lineTo(wx - 26, 30); x.quadraticCurveTo(wx, 0, wx + 26, 30); x.lineTo(wx + 26, 80); x.fill();
    const glass = ['#3a58c0', '#a040a0', '#40a8c8', '#d0a840', '#6a40c8', '#c84a5a'];
    for (let yy = 6; yy < 78; yy += 3) for (let xx = wx - 24; xx < wx + 24; xx += 3) { if (Math.hypot(xx - wx, Math.max(0, 30 - yy)) > 24) continue; const ring = Math.floor(Math.hypot(xx - wx, yy - 34) / 6), an = Math.floor((Math.atan2(yy - 34, xx - wx) + Math.PI) / (Math.PI / 4)); P(glass[(ring + an) % 6], xx + 0.5, yy + 0.5, 2, 2); }
    x.strokeStyle = '#080614'; x.lineWidth = 1.5; for (let k = 0; k < 8; k++) { const an = k / 8 * Math.PI * 2; x.beginPath(); x.moveTo(wx, 34); x.lineTo(wx + Math.cos(an) * 22, 34 + Math.sin(an) * 22); x.stroke(); }
    x.beginPath(); x.arc(wx, 34, 7, 0, 7); x.stroke(); x.beginPath(); x.arc(wx, 34, 15, 0, 7); x.stroke(); P('#080614', wx - 26, 56, 52, 2); P('#fff6c0', wx - 2, 32, 4, 4);
    lights.push([wx, 40, 130, '#b090ff']);
    // god rays from the window onto the floor
    x.fillStyle = 'rgba(200,180,255,.08)'; x.beginPath(); x.moveTo(wx - 20, 60); x.lineTo(wx + 20, 60); x.lineTo(wx + 60, 150); x.lineTo(wx - 60, 150); x.fill();
    // banners
    for (const bx of [86, 170]) { P('#5a1a2a', bx - 7, 10, 14, 44); P('#8a2a3a', bx - 7, 10, 4, 44); poly([bx - 7, 54, bx + 7, 54, bx, 60], '#5a1a2a'); P('#d8b040', bx - 7, 10, 14, 2); P('#d8b040', bx - 1, 24, 3, 3); P('#d8b040', bx - 3, 28, 7, 1); P('#d8b040', bx, 22, 1, 12); }
    // pillars with capitals and bases (far pair darker)
    for (const [px_, w, h, col, lt, dk] of [[64, 9, 84, '#2c2850', '#44407a', '#1c1838'], [192, 9, 84, '#2c2850', '#44407a', '#1c1838'], [24, 14, 100, '#3a3462', '#5e58a0', '#221e40'], [232, 14, 100, '#3a3462', '#5e58a0', '#221e40']]) {
      const top = 94 - h; P(col, px_ - w / 2, top, w, h); P(lt, px_ - w / 2 + 1, top, 2, h); P(dk, px_ + w / 2 - 3, top, 3, h);
      for (let k = 0; k < w; k += 3) P('rgba(0,0,0,.18)', px_ - w / 2 + k, top + 4, 1, h - 8);
      P(lt, px_ - w / 2 - 3, top, w + 6, 3); P(dk, px_ - w / 2 - 2, top + 3, w + 4, 2); P(lt, px_ - w / 2 - 3, 91, w + 6, 3); P(dk, px_ - w / 2 - 3, 94, w + 6, 1);
    }
    flame(46, 84); flame(210, 84);
    floor(94, '#3a3270', '#2c2658', '#1a1638');
    x.fillStyle = '#6a1a3a'; x.beginPath(); x.moveTo(116, 94); x.lineTo(140, 94); x.lineTo(184, 150); x.lineTo(72, 150); x.fill();
    x.fillStyle = '#8a2a4a'; x.beginPath(); x.moveTo(118, 94); x.lineTo(124, 94); x.lineTo(96, 150); x.lineTo(80, 150); x.fill();
    x.strokeStyle = '#d8b040'; x.lineWidth = 1; x.beginPath(); x.moveTo(117, 94); x.lineTo(75, 150); x.moveTo(139, 94); x.lineTo(181, 150); x.stroke();
  } else if (key === 'sanctum') {
    // top of the tower: open sky, floating crystal, broken colonnade, glowing sigil
    x.fillStyle = grad(0, 100, ['#04061a', '#0e1a44', '#24306a']); x.fillRect(0, 0, SW, 100);
    for (let i = 0; i < 90; i++) { const sx2 = r() * SW, sy2 = r() * 80; P(r() < 0.2 ? '#fff6d8' : '#a8b8ff', sx2, sy2, 1, 1); }
    x.fillStyle = 'rgba(120,140,255,.10)'; x.beginPath(); x.ellipse(60, 30, 90, 14, -0.3, 0, 7); x.fill(); x.fillStyle = 'rgba(200,120,255,.07)'; x.beginPath(); x.ellipse(200, 20, 70, 10, 0.2, 0, 7); x.fill();
    ridge(92, 10, '#141a3a', 6, 6);
    for (const [px_, h, broken] of [[20, 70, 0], [56, 52, 1], [200, 56, 1], [236, 74, 0]]) { const top = 96 - h; P('#3a4270', px_ - 6, top, 12, h); P('#5a64a0', px_ - 6, top, 2, h); P('#22284a', px_ + 3, top, 3, h);
      if (broken) poly([px_ - 6, top, px_ - 2, top - 5, px_ + 2, top - 1, px_ + 6, top - 4, px_ + 6, top, px_ - 6, top], '#3a4270'); else { P('#6a74b0', px_ - 9, top, 18, 3); } }
    groundRows(94, ['#2a3060', '#323a6e', '#3a447a', '#424e86']);
    for (let yy = 98; yy < 150; yy += 7) P('rgba(0,0,0,.16)', 0, yy, SW, 1);
    x.strokeStyle = 'rgba(140,220,255,.55)'; x.lineWidth = 1; x.beginPath(); x.ellipse(128, 122, 70, 14, 0, 0, 7); x.stroke(); x.beginPath(); x.ellipse(128, 122, 54, 10, 0, 0, 7); x.stroke();
    for (let k = 0; k < 12; k++) { const an = k / 12 * Math.PI * 2; P('#bff0ff', 128 + Math.cos(an) * 62, 122 + Math.sin(an) * 12, 2, 1); }
    anim.crystal = [128, 44];
    lights.push([128, 48, 170, '#7fe6ff']);
  } else if (key === 'shrine') {
    x.fillStyle = grad(0, 96, ['#12283a', '#2a6068', '#7ac0a8', '#c8ecc8']); x.fillRect(0, 0, SW, 96);
    for (const [cx, cy, w] of [[50, 24, 22], [190, 16, 26], [130, 40, 12]]) cloud(cx, cy, w, '#e8fff4', '#b8e0d0', '#6a9a98');
    ridge(76, 26, '#2a4a52', 4, 7); ridge(86, 14, '#203a40', 8, 5);
    for (const [ax, h] of [[34, 70], [222, 64], [82, 50], [174, 46]]) { P('#5a6a6a', ax - 5, 92 - h, 10, h); P('#7a8a88', ax - 5, 92 - h, 2, h); P('#3a4a4a', ax + 3, 92 - h, 2, h); P('#8a9a96', ax - 7, 92 - h, 14, 3);
      for (let k = 0; k < h; k += 7) P('rgba(0,0,0,.2)', ax - 5, 92 - h + k, 10, 1);
      for (let i = 0; i < 7; i++) { const vy = 92 - h + 4 + Math.floor(r() * (h - 8)); P('#3e7a4a', ax - 6 + Math.floor(r() * 12), vy, 2, 3); P('#5aa060', ax - 5 + Math.floor(r() * 10), vy + 1, 1, 1); } }
    x.strokeStyle = '#6a7a78'; x.lineWidth = 4; x.beginPath(); x.arc(58, 42, 24, Math.PI, Math.PI * 1.55); x.stroke(); x.beginPath(); x.arc(198, 46, 24, Math.PI * 1.5, Math.PI * 2); x.stroke();
    x.strokeStyle = '#3e7a4a'; x.lineWidth = 1; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(40 + i * 6, 20 + i * 2); x.quadraticCurveTo(44 + i * 6, 34, 40 + i * 6, 44 + i * 3); x.stroke(); }
    groundRows(90, ['#3a5a4a', '#46684e', '#527654', '#5e845a']);
    for (let i = 0; i < 180; i++) { const yy = 92 + Math.pow(r(), 0.7) * 58, s = 1 + (yy - 90) / 26; P(r() < 0.5 ? '#36583e' : '#7aa46a', r() * SW, yy - s, Math.max(1, s * 0.4), s); }
    for (let yy = 100; yy < 150; yy += 10) for (let xx = 96 - (yy - 100) * 0.4; xx < 160 + (yy - 100) * 0.4; xx += 12) { P('#8a9a96', xx, yy, 10, 4); P('#a8b8b2', xx, yy, 10, 1); }
    x.fillStyle = '#8a9a96'; x.fillRect(104, 82, 48, 10); x.fillStyle = '#6a7a78'; x.fillRect(108, 74, 40, 8); x.fillStyle = '#a8f0d0'; x.beginPath(); x.moveTo(128, 50); x.lineTo(134, 62); x.lineTo(128, 74); x.lineTo(122, 62); x.fill();
    lights.push([128, 62, 120, '#90ffd0']); anim.wind = 1;
  } else { // inside
    x.fillStyle = '#4a3020'; x.fillRect(0, 0, SW, 92);
    for (let i = 0; i < SW; i += 8) { P('#5a3a26', i, 0, 7, 92); P('#6e4a30', i + 1, 0, 1, 92); }
    P('#2e1e14', 0, 86, SW, 6); P('#a07850', 0, 86, SW, 1);
    P('#1a1010', 40, 30, 30, 34); P('#ffb050', 44, 46, 22, 16); lights.push([55, 50, 90, '#ff9a40']);
    groundRows(92, ['#7a5434', '#8a603c', '#966a42', '#a07448']);
    for (let yy = 94; yy < 150; yy += 7) P('rgba(0,0,0,.2)', 0, yy, SW, 1);
  }
  return { c, lights, anim };
}
// animated touches drawn over the cached painting each frame
function drawBgAnim(bg, key, t) {
  const A = bg.anim || {};
  if (A.mill) { const [mx, my] = A.mill; ctx.strokeStyle = key === 'dusk' ? '#3a2a3a' : '#5a4a3a'; ctx.lineWidth = 1.4; for (let k = 0; k < 4; k++) { const an = t / 30 + k * Math.PI / 2; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(an) * 10, my + Math.sin(an) * 10); ctx.stroke(); ctx.fillStyle = key === 'dusk' ? 'rgba(200,160,160,.7)' : 'rgba(250,245,235,.9)'; ctx.save(); ctx.translate(mx, my); ctx.rotate(an); ctx.fillRect(3, 0, 7, 2.5); ctx.restore(); } }
  if (A.flames) for (const [fx, fy] of A.flames) { const f = Math.sin(t / 4 + fx) * 1; ctx.fillStyle = '#ff9030'; ctx.beginPath(); ctx.moveTo(fx - 2, fy - 1); ctx.quadraticCurveTo(fx, fy - 9 - f, fx + 2, fy - 1); ctx.fill(); ctx.fillStyle = '#fff0a0'; ctx.fillRect(fx - 0.5, fy - 4 - f * 0.5, 1, 3); addLight(fx, fy - 4, 50, '#ffb050', 0.8 + Math.sin(t / 3 + fx) * 0.15); }
  if (A.glints) A.glints.forEach(([gx, gy], i) => { const k = (t + i * 37) % 120; if (k < 14) { const a = Math.sin(k / 14 * Math.PI); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(gx - 3 * a, gy, 6 * a + 1, 1); ctx.fillRect(gx, gy - 3 * a, 1, 6 * a + 1); } });
  if (A.pool) { const [px_, py_] = A.pool; ctx.strokeStyle = 'rgba(140,200,255,.35)'; ctx.lineWidth = 0.6; for (let i = 0; i < 2; i++) { const k = ((t / 60) + i * 0.5) % 1; ctx.beginPath(); ctx.ellipse(px_ - 10 + i * 18, py_, 4 + k * 12, 1 + k * 2.5, 0, 0, 7); ctx.globalAlpha = 1 - k; ctx.stroke(); ctx.globalAlpha = 1; } }
  if (A.shafts) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.shafts.forEach((sx2, i) => { ctx.fillStyle = `rgba(255,250,200,${0.04 + 0.03 * Math.sin(t / 40 + i * 2)})`; ctx.beginPath(); ctx.moveTo(sx2, 0); ctx.lineTo(sx2 + 14, 0); ctx.lineTo(sx2 + 44, 150); ctx.lineTo(sx2 + 18, 150); ctx.fill(); }); ctx.restore(); }
  if (A.crystal) { const [cx, cy] = A.crystal, b = Math.sin(t / 30) * 3, g = 0.75 + 0.25 * Math.sin(t / 20);
    ctx.fillStyle = `rgba(127,230,255,${0.25 * g})`; ctx.beginPath(); ctx.arc(cx, cy + b, 26, 0, 7); ctx.fill();
    const D = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx + pts[0], cy + b + pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(cx + pts[i], cy + b + pts[i + 1]); ctx.closePath(); ctx.fill(); };
    D([0, -22, 10, -4, 0, 22, -10, -4], '#3a90d0'); D([0, -22, 0, 22, -10, -4], '#7fd0ff'); D([0, -22, 4, -4, 0, 12, -4, -4], '#e8fbff');
    ctx.strokeStyle = `rgba(160,230,255,${0.5 * g})`; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(128, 122, 62, 12, 0, t / 40, t / 40 + 2.2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(128, 122, 62, 12, 0, t / 40 + Math.PI, t / 40 + Math.PI + 2.2); ctx.stroke(); }
  if (A.wind) { ctx.strokeStyle = 'rgba(220,255,240,.35)'; ctx.lineWidth = 0.7; for (let i = 0; i < 5; i++) { const wx = ((t * (1.6 + i * 0.3) + i * 70) % (SW + 80)) - 40, wy = 20 + i * 15; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 14, wy - 4, wx + 28, wy); ctx.stroke(); } }
}
function drawBattleBg(set, mapId) {
  const key = bgKey(set, mapId);
  if (!BG_CACHE[key]) BG_CACHE[key] = paintBg(key);
  ctx.drawImage(BG_CACHE[key].c, 0, 0);
  const t = B ? B.t : G.frame;
  drawBgAnim(BG_CACHE[key], key, t);
  if (key === 'plains' || key === 'dusk') { // drifting clouds and a few birds over the far ridge
    ctx.fillStyle = key === 'dusk' ? 'rgba(255,210,190,.55)' : 'rgba(255,255,255,.6)';
    for (let i = 0; i < 4; i++) { const w = 18 + i * 5, cx = ((i * 83 + t * (0.05 + i * 0.02)) % (SW + 80)) - 40, cy = 14 + i * 9; ctx.beginPath(); ctx.ellipse(cx, cy, w, 3, 0, 0, 7); ctx.ellipse(cx + w * 0.3, cy - 2.5, w * 0.45, 3, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = key === 'dusk' ? '#3a2a3a' : '#3a4a6a';
    for (let i = 0; i < 3; i++) { const bx = ((t * 0.35 + i * 14) % (SW + 120)) - 60, by = 40 + i * 4 + Math.sin(t / 20 + i) * 2, f = ((t >> 3) + i) % 2; ctx.fillRect(bx, by, 1, 1); ctx.fillRect(bx - 1, by - f, 1, 1); ctx.fillRect(bx + 1, by - f, 1, 1); ctx.fillRect(bx - 2, by - f * 2 + 1 - 1, 1, 1); ctx.fillRect(bx + 2, by - f * 2 + 1 - 1, 1, 1); }
  } else if (key === 'cave' && t % 50 < 25) { const dx = 60 + ((t / 50) | 0) * 47 % 140; ctx.fillStyle = 'rgba(160,210,255,.7)'; ctx.fillRect(dx, (t % 50) * 3.6, 1, 2); }
  else if (key === 'shrine') { ctx.fillStyle = 'rgba(190,255,230,.5)'; for (let i = 0; i < 10; i++) { const lx = ((i * 41 + t * (0.8 + (i % 3) * 0.3)) % (SW + 40)) - 20, ly = 20 + (i * 23) % 70 + Math.sin(t / 15 + i) * 4; ctx.fillRect(lx, ly, 2, 1); } }
  return BG_CACHE[key];
}

// ---------- FX ----------
function fxDur(t) { return { slash: 16, slash2: 22, whirl: 24, braver: 34, claw: 16, fire: 32, ice: 30, bolt: 26, heal: 34, holy: 36, dark: 32, meteor: 44, quake: 28, beam: 26, wind: 34, barrier: 30, haste: 26, none: 2 }[t] || 16; }
const GLOW_FX = new Set(['fire', 'ice', 'bolt', 'heal', 'holy', 'beam', 'meteor', 'braver', 'slash2', 'whirl', 'slash', 'wind', 'barrier', 'haste']);
function drawFx(f) {
  const k = f.t / f.dur; const x = f.x, y = f.y; const s = Math.max(16, f.big || 32) / 2;
  ctx.save(); if (GLOW_FX.has(f.type)) ctx.globalCompositeOperation = 'lighter';
  switch (f.type) {
    case 'slash': case 'claw': {
      const n = f.type === 'claw' ? 3 : 1; ctx.strokeStyle = f.type === 'claw' ? '#ff6070' : '#ffffff'; ctx.lineWidth = 2; ctx.globalAlpha = 1 - k * 0.6;
      for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 6; const L = Math.min(1, k * 2.2); ctx.beginPath(); ctx.moveTo(x - s + o, y - s); ctx.lineTo(x - s + o + 2 * s * L, y - s + 2 * s * L); ctx.stroke(); }
      break;
    }
    case 'slash2': case 'whirl': {
      ctx.strokeStyle = '#ffe080'; ctx.lineWidth = 3; ctx.globalAlpha = 1 - k * 0.7; const L = Math.min(1, k * 2);
      if (f.type === 'whirl') { ctx.beginPath(); ctx.arc(x, y, s, k * 8, k * 8 + 3 * L); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x - s + 2 * s * L, y - s + 2 * s * L); ctx.moveTo(x + s, y - s); ctx.lineTo(x + s - 2 * s * L, y - s + 2 * s * L); ctx.stroke(); }
      break;
    }
    case 'braver': { ctx.globalAlpha = 1 - k; ctx.fillStyle = '#fff6c0'; ctx.fillRect(x - 6 + k * 4, 0, 12 - k * 8, y + s); ctx.strokeStyle = '#ffe080'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - s, y + s); ctx.lineTo(x + s, y - s); ctx.stroke(); break; }
    case 'fire': {
      for (let i = 0; i < 14; i++) { const ph = (i * 37 % 100) / 100; const t = (k + ph) % 1; const px_ = x + Math.sin(i * 2.1 + k * 6) * s * 0.7; const py_ = y + s * 0.6 - t * s * 1.6; ctx.globalAlpha = (1 - t) * (1 - k * 0.5); ctx.fillStyle = t < 0.3 ? '#fff4a0' : t < 0.6 ? '#ffa030' : '#e03a20'; const r = (1 - t) * 5 + 1; ctx.fillRect(px_ - r / 2, py_ - r / 2, r, r); }
      break;
    }
    case 'ice': {
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const d = (1 - Math.min(1, k * 1.6)) * s * 1.6 + 2; ctx.fillStyle = i % 2 ? '#bff0ff' : '#5ac8ff'; ctx.globalAlpha = 1 - Math.max(0, k - 0.7) * 3; const px_ = x + Math.cos(a) * d, py_ = y + Math.sin(a) * d; ctx.beginPath(); ctx.moveTo(px_, py_ - 5); ctx.lineTo(px_ + 3, py_); ctx.lineTo(px_, py_ + 5); ctx.lineTo(px_ - 3, py_); ctx.fill(); }
      break;
    }
    case 'bolt': {
      if ((f.t >> 1) % 2) { ctx.fillStyle = 'rgba(255,255,200,.25)'; ctx.fillRect(0, 0, SW, 150); }
      ctx.strokeStyle = '#fff080'; ctx.lineWidth = 2; ctx.globalAlpha = 1 - k * 0.5; ctx.beginPath(); let yy = 0, xx = x; ctx.moveTo(xx, yy);
      const rr = mulberry(f.t >> 2); while (yy < y) { yy += 8; xx = x + (rr() - 0.5) * 16; ctx.lineTo(xx, yy); } ctx.stroke();
      break;
    }
    case 'heal': {
      for (let i = 0; i < 10; i++) { const t = (k * 1.3 + i / 10) % 1; ctx.globalAlpha = 1 - t; ctx.fillStyle = i % 2 ? '#a0ffc0' : '#ffffff'; const px_ = x + Math.sin(i * 1.7) * s * 0.8, py_ = y + s * 0.6 - t * s * 1.6; ctx.fillRect(px_ - 1, py_ - 3, 2, 6); ctx.fillRect(px_ - 3, py_ - 1, 6, 2); }
      break;
    }
    case 'holy': case 'beam': {
      if (f.type === 'beam') { ctx.strokeStyle = '#7fe0ff'; ctx.lineWidth = 4 * (1 - k); ctx.beginPath(); ctx.moveTo(f.fx, f.fy); ctx.lineTo(x, y); ctx.stroke(); }
      for (let i = 0; i < 3; i++) { const t = Math.max(0, k * 1.5 - i * 0.2); ctx.globalAlpha = Math.max(0, 1 - t); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, t * s * 1.5, 0, 7); ctx.stroke(); }
      ctx.globalAlpha = (1 - k) * 0.7; ctx.fillStyle = '#fffbe0'; ctx.beginPath(); ctx.arc(x, y, s * 0.6 * (1 - k), 0, 7); ctx.fill();
      break;
    }
    case 'dark': {
      for (let i = 0; i < 3; i++) { ctx.globalAlpha = (1 - k) * 0.8; ctx.strokeStyle = i % 2 ? '#a040ff' : '#401060'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, s * (0.4 + i * 0.3) * (1 - k * 0.5), k * 10 + i, k * 10 + i + 4); ctx.stroke(); }
      break;
    }
    case 'meteor': {
      for (let i = 0; i < 4; i++) { const t = clamp(k * 1.6 - i * 0.15, 0, 1); if (t <= 0 || t >= 1) continue; const px_ = x - 60 * (1 - t) + (i - 1.5) * 8, py_ = y - 120 * (1 - t); ctx.fillStyle = '#ff8030'; ctx.beginPath(); ctx.arc(px_, py_, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#ffe080'; ctx.beginPath(); ctx.arc(px_ + 1, py_ - 1, 2.5, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,160,60,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px_, py_); ctx.lineTo(px_ - 14, py_ - 26); ctx.stroke(); }
      if (k > 0.6) { ctx.globalAlpha = (1 - k) * 2; ctx.fillStyle = '#ffb060'; ctx.beginPath(); ctx.arc(x, y, s * (k - 0.5) * 2, 0, 7); ctx.fill(); }
      break;
    }
    case 'wind': {
      for (let i = 0; i < 4; i++) { ctx.globalAlpha = (1 - k) * 0.8; ctx.strokeStyle = i % 2 ? '#c8ffe8' : '#60e0a0'; ctx.lineWidth = 1.6; const rr = s * (0.5 + i * 0.25) * (0.6 + k * 0.6); ctx.beginPath(); ctx.ellipse(x, y + s * 0.4 - i * s * 0.35, rr, rr * 0.35, 0, k * 14 + i * 1.5, k * 14 + i * 1.5 + 3.6); ctx.stroke(); }
      break;
    }
    case 'barrier': { ctx.globalAlpha = (1 - k) * 0.9; ctx.strokeStyle = '#9fd8ff'; ctx.lineWidth = 1.2; const rr = 10 + k * 8; ctx.beginPath(); for (let h = 0; h <= 6; h++) { const an = h / 6 * Math.PI * 2 + k; const px_ = x + Math.cos(an) * rr, py_ = y + Math.sin(an) * rr * 1.1; h ? ctx.lineTo(px_, py_) : ctx.moveTo(px_, py_); } ctx.stroke(); break; }
    case 'haste': { ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ffe080'; ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { const yy = y + 8 - ((k * 30 + i * 8) % 24); ctx.beginPath(); ctx.moveTo(x - 6, yy + 4); ctx.lineTo(x, yy); ctx.lineTo(x + 6, yy + 4); ctx.stroke(); } break; }
    case 'quake': { ctx.globalAlpha = 1 - k; ctx.fillStyle = '#8a6a4a'; for (let i = 0; i < 8; i++) { const px_ = x + (i - 4) * 5, py_ = y + s - Math.sin(k * Math.PI + i) * 10; ctx.fillRect(px_, py_, 3, 3); } break; }
  }
  ctx.restore();
}

// ---------- battle command menu ----------
const BMenu = {
  open(i) {
    const m = G.party[i];
    B.menu = { who: i, stage: 'cmd', ci: 0, li: 0, scroll: 0, list: [], action: null, tSide: 'e', ti: 0 };
    B.menu.cmds = ['たたかう', HEROES[m.id].cmd, 'アイテム', 'ぼうぎょ', 'にげる'];
  },
  close(action) {
    const M = B.menu; const i = M.who;
    B.pb[i].atb = 0; B.pb[i].ready = false; B.ready = B.ready.filter(x => x !== i);
    if (action.kind === 'item') removeItem(action.id);
    B.queue.push({ side: 'p', i, ...action }); B.menu = null;
  },
  update() {
    const M = B.menu; const m = G.party[M.who];
    if (m.hp <= 0) { B.menu = null; return; }
    if (M.stage === 'cmd') {
      if (Input.rep('up')) { M.ci = (M.ci + 4) % 5; Audio8.sfx('cursor'); }
      if (Input.rep('down')) { M.ci = (M.ci + 1) % 5; Audio8.sfx('cursor'); }
      if (Input.pressed.b) { // pass turn to next ready member
        if (B.ready.length > 1) { B.ready.push(B.ready.shift()); B.menu = null; Audio8.sfx('cancel'); } return;
      }
      if (!Input.pressed.a) return;
      Audio8.sfx('ok');
      switch (M.ci) {
        case 0: this.target({ kind: 'skill', id: 'attack' }, 'enemy'); break;
        case 1: M.list = skillsOf(m).concat(m.id === 'lina' && echoReady() ? ['echo'] : []).map(id => ({ id, label: SKILLS[id].name, right: id === 'echo' ? Math.floor(B.echo) + '%' : SKILLS[id].mp ? String(SKILLS[id].mp) : '', ok: id === 'echo' ? B.echo >= 100 : m.mp >= SKILLS[id].mp, desc: SKILLS[id].desc })); M.listKind = 'skill'; M.stage = 'list'; M.li = 0; M.scroll = 0; break;
        case 2: M.list = Object.keys(G.inv).filter(id => ITEMS[id].type === 'use' && ITEMS[id].field !== 'only').map(id => ({ id, label: ITEMS[id].name, right: '×' + G.inv[id], ok: true, desc: ITEMS[id].desc })); M.listKind = 'item'; M.stage = 'list'; M.li = 0; M.scroll = 0;
          if (!M.list.length) { M.stage = 'cmd'; Audio8.sfx('error'); } break;
        case 3: this.close({ kind: 'defend' }); break;
        case 4: this.close({ kind: 'flee' }); break;
      }
    } else if (M.stage === 'list') {
      const n = M.list.length;
      if (Input.rep('up')) { M.li = (M.li - 2 + n) % n; Audio8.sfx('cursor'); }
      if (Input.rep('down')) { M.li = (M.li + 2) % n; if (M.li >= n) M.li = n - 1; Audio8.sfx('cursor'); }
      if (Input.rep('left') || Input.rep('right')) { M.li = M.li ^ 1; if (M.li >= n) M.li = n - 1; Audio8.sfx('cursor'); }
      const row = Math.floor(M.li / 2); if (row < M.scroll) M.scroll = row; if (row > M.scroll + 3) M.scroll = row - 3;
      if (Input.pressed.b) { M.stage = 'cmd'; Audio8.sfx('cancel'); return; }
      if (Input.pressed.a) {
        const e = M.list[M.li]; if (!e.ok) { Audio8.sfx('error'); return; }
        Audio8.sfx('ok');
        if (M.listKind === 'skill') { const sk = SKILLS[e.id]; this.target({ kind: 'skill', id: e.id }, sk.target); }
        else this.target({ kind: 'item', id: e.id }, ITEMS[e.id].target);
      }
    } else if (M.stage === 'target') {
      const mode = M.tmode;
      if (mode === 'enemies' || mode === 'allies') {
        if (Input.pressed.a) { Audio8.sfx('ok'); this.close(M.action); }
        if (Input.pressed.b) { Audio8.sfx('cancel'); M.stage = M.prev; }
        return;
      }
      const pool = M.tSide === 'e' ? Battle.aliveE().map(e => e.i) : G.party.map((_, i) => i);
      if (!pool.length) { M.stage = 'cmd'; return; }
      let k = pool.indexOf(M.ti); if (k < 0) { k = 0; M.ti = pool[0]; }
      if (Input.rep('up')) { M.ti = pool[(k - 1 + pool.length) % pool.length]; Audio8.sfx('cursor'); }
      if (Input.rep('down')) { M.ti = pool[(k + 1) % pool.length]; Audio8.sfx('cursor'); }
      if (Input.rep('left') && M.tSide === 'p') { M.tSide = 'e'; M.ti = Battle.aliveE()[0].i; Audio8.sfx('cursor'); }
      if (Input.rep('right') && M.tSide === 'e') { M.tSide = 'p'; M.ti = M.who; Audio8.sfx('cursor'); }
      if (Input.pressed.b) { Audio8.sfx('cancel'); M.stage = M.prev; return; }
      if (Input.pressed.a) { Audio8.sfx('ok'); this.close({ ...M.action, target: { side: M.tSide, i: M.ti } }); }
    }
  },
  target(action, mode) {
    const M = B.menu; M.prev = M.stage; M.action = action; M.tmode = mode; M.stage = 'target';
    if (mode === 'enemy' || mode === 'enemies') { M.tSide = 'e'; M.ti = Battle.aliveE()[0].i; }
    else { M.tSide = 'p'; M.ti = M.who; if (mode === 'ally') { const it = ITEMS[action.id], sk = SKILLS[action.id]; const wantsDead = (it && it.dead) || (sk && sk.dead); if (wantsDead) { const d = G.party.findIndex(p => p.hp <= 0); if (d >= 0) M.ti = d; } else { let lo = M.who, r = 2; G.party.forEach((p, i) => { if (p.hp > 0) { const q = p.hp / stats(p).maxhp; if (q < r) { r = q; lo = i; } } }); M.ti = lo; } } }
  },
  draw() {
    const M = B.menu;
    // command window
    win(0, 150, 96, 74);
    M.cmds.forEach((c, i) => text(c, 20, 157 + i * 13, M.stage === 'cmd' && M.ci === i ? UI.gold : UI.ink));
    if (M.stage === 'cmd') cursor(7, 158 + M.ci * 13);
    if (M.stage === 'list' || (M.stage === 'target' && M.prev === 'list')) {
      win(0, 150, 256, 74);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) {
        const idx = (M.scroll + r) * 2 + c; const e = M.list[idx]; if (!e) continue;
        const x = 18 + c * 124, y = 157 + r * 15;
        text(e.label, x, y, e.ok ? UI.ink : UI.dim); text(e.right, x + 100, y, e.ok ? UI.mp : UI.dim, 7, 'right');
      }
      if (M.stage === 'list') { const r = Math.floor(M.li / 2) - M.scroll, c = M.li % 2; cursor(5 + c * 124, 158 + r * 15); const e = M.list[M.li]; if (e && e.desc) { win(4, 4, 248, 20); text(e.desc, 12, 10); } }
      if (M.list.length > 8) { text('▲', 248, 152, M.scroll > 0 ? UI.gold : '#fff0', 6); text('▼', 248, 214, (M.scroll + 4) * 2 < M.list.length ? UI.gold : '#fff0', 6); }
    }
    if (M.stage === 'target') {
      const ts = M.tmode === 'enemies' ? Battle.aliveE().map(e => ({ side: 'e', i: e.i })) : M.tmode === 'allies' ? G.party.map((_, i) => ({ side: 'p', i })) : [{ side: M.tSide, i: M.ti }];
      if ((M.tmode === 'enemies' || M.tmode === 'allies') && (G.frame >> 3) % 2) return;
      for (const t of ts) {
        if (t.side === 'e') { const e = B.enemies[t.i]; cursor(e.x - 10, e.y + e.h / 2 - 4); }
        else { const p = PARTY_POS(t.i); cursor(p.x - 10, p.y + 12); }
      }
    }
  },
};

// ---------- particles ----------
function spawnP(o) { if (!B) return; const p = Object.assign({ vx: 0, vy: 0, g: 0, life: 30, size: 2, c0: '#ffffff', c1: '#ffffff', blend: 'add', shape: 'dot', delay: 0, drag: 1 }, o); p.max = p.life; B.parts.push(p); if (B.parts.length > 420) B.parts.shift(); }
function updP(p) { if (p.delay > 0) { p.delay--; return true; } p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag; if (p.spin) { const a = Math.atan2(p.y - p.oy, p.x - p.ox) + p.spin, r = Math.hypot(p.x - p.ox, p.y - p.oy) * 0.95; p.x = p.ox + Math.cos(a) * r; p.y = p.oy + Math.sin(a) * r; } return --p.life > 0; }
function mixC(a, b, t) { const A = hex(a), Bc = hex(b); return `rgb(${Math.round(A[0] + (Bc[0] - A[0]) * t)},${Math.round(A[1] + (Bc[1] - A[1]) * t)},${Math.round(A[2] + (Bc[2] - A[2]) * t)})`; }
function drawParts() {
  if (!B || !B.parts.length) return;
  ctx.save();
  for (const p of B.parts) {
    if (p.delay > 0) continue;
    const t = 1 - p.life / p.max; const al = Math.min(1, p.life / 8, (p.max - p.life + 1) / 3);
    ctx.globalCompositeOperation = p.blend === 'add' ? 'lighter' : 'source-over'; ctx.globalAlpha = al;
    const col = mixC(p.c0, p.c1, t); const sz = p.size * (1 - t * 0.55);
    if (p.shape === 'spark') { ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.5, sz * 0.6); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 2.5, p.y - p.vy * 2.5); ctx.stroke(); }
    else if (p.shape === 'star') { ctx.fillStyle = col; ctx.fillRect(p.x - sz, p.y - 0.4, sz * 2, 0.8); ctx.fillRect(p.x - 0.4, p.y - sz, 0.8, sz * 2); }
    else if (p.shape === 'rock') { ctx.fillStyle = col; ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz); }
    else { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, Math.PI * 2); ctx.fill(); if (p.blend === 'add' && sz > 1.5) { ctx.globalAlpha = al * 0.14; ctx.beginPath(); ctx.arc(p.x, p.y, sz * 2.2, 0, Math.PI * 2); ctx.fill(); } }
  }
  ctx.restore();
}
function flashFx(col, a = 0.5) { if (B) B.flashFx = { col, a }; }
function spawnFx(type, x, y, size, from) {
  const s = Math.max(14, size) / 2, R = Math.random;
  const burst = (n, o) => { for (let i = 0; i < n; i++) { const an = R() * Math.PI * 2, sp = (o.sp || 2) * (0.4 + R()); spawnP(Object.assign({ x: x + (R() - 0.5) * (o.spread || 6), y: y + (R() - 0.5) * (o.spread || 6), vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - (o.up || 0), life: (o.life || 20) * (0.6 + R() * 0.6), size: (o.size || 2) * (0.6 + R() * 0.8) }, o.p)); } };
  switch (type) {
    case 'slash': case 'claw': burst(12, { sp: 2.2, life: 14, size: 1.4, p: { shape: 'spark', c0: '#ffffff', c1: type === 'claw' ? '#ff4060' : '#ffd080', g: 0.08, delay: 4 } }); break;
    case 'slash2': case 'whirl': burst(20, { sp: 2.8, life: 18, size: 1.6, p: { shape: 'spark', c0: '#fff8d0', c1: '#ffa020', g: 0.1, delay: 5 } }); flashFx('#ffe8a0', 0.25); break;
    case 'braver': burst(46, { sp: 3.5, life: 26, size: 2, p: { shape: 'spark', c0: '#ffffff', c1: '#ffb020', g: 0.12, delay: 10 } }); for (let i = 0; i < 20; i++) spawnP({ x: x + (R() - 0.5) * 8, y: y - 70 + R() * 60, vy: 1.5, life: 20, size: 1.5, c0: '#ffffff', c1: '#ffe080', shape: 'star' }); flashFx('#fff4c0', 0.7); break;
    case 'fire':
      for (let i = 0; i < 36; i++) spawnP({ x: x + (R() - 0.5) * s * 1.4, y: y + s * 0.5 + R() * 4, vx: (R() - 0.5) * 0.5, vy: -0.8 - R() * 2.2, life: 24 + R() * 20, size: 1.8 + R() * 2.6, c0: '#ffd860', c1: '#b01808', delay: Math.floor(R() * 12) });
      for (let i = 0; i < 16; i++) spawnP({ x: x + (R() - 0.5) * s, y: y + R() * s * 0.5, vx: (R() - 0.5) * 1.6, vy: -1.5 - R() * 2, g: 0.02, life: 40 + R() * 20, size: 0.9, c0: '#ffffa0', c1: '#ff6020', delay: 8 + Math.floor(R() * 12) });
      flashFx('#ff8030', 0.35); break;
    case 'ice':
      for (let i = 0; i < 18; i++) { const an = R() * Math.PI * 2, r0 = 34 + R() * 10; spawnP({ x: x + Math.cos(an) * r0, y: y + Math.sin(an) * r0, vx: -Math.cos(an) * r0 / 12, vy: -Math.sin(an) * r0 / 12, life: 12, size: 1.8, c0: '#ffffff', c1: '#80d8ff', shape: 'spark' }); }
      burst(34, { sp: 2.4, life: 26, size: 1.8, p: { c0: '#ffffff', c1: '#3aa8ff', g: 0.06, delay: 12, shape: 'star' } });
      for (let i = 0; i < 6; i++) spawnP({ x: x + (R() - 0.5) * s, y: y + (R() - 0.5) * s, vy: -0.15, life: 40, size: 6 + R() * 4, c0: '#c0ecff', c1: '#4080c0', delay: 12 });
      flashFx('#a0e0ff', 0.3); break;
    case 'bolt': burst(36, { sp: 3.4, life: 14, size: 1.4, p: { shape: 'spark', c0: '#ffffff', c1: '#ffe030', g: 0.15, delay: 4 } }); flashFx('#fffbe0', 0.75); break;
    case 'heal': for (let i = 0; i < 34; i++) spawnP({ x: x + (R() - 0.5) * s * 1.4, y: y + s * 0.6, vx: (R() - 0.5) * 0.3, vy: -0.6 - R() * 1.4, life: 30 + R() * 20, size: 1.4 + R() * 1.6, c0: '#ffffff', c1: '#40ff90', shape: R() < 0.4 ? 'star' : 'dot', delay: Math.floor(R() * 14) }); flashFx('#a0ffc0', 0.18); break;
    case 'holy':
      for (let i = 0; i < 16; i++) { const an = i / 16 * Math.PI * 2; spawnP({ x, y, vx: Math.cos(an) * 3, vy: Math.sin(an) * 3, life: 22, size: 2, c0: '#ffffff', c1: '#ffd060', shape: 'spark', drag: 0.94, delay: 6 }); }
      burst(30, { sp: 1.2, life: 40, size: 1.6, p: { c0: '#ffffff', c1: '#fff0a0', shape: 'star', g: 0.02, delay: 8 } }); flashFx('#ffffff', 0.7); break;
    case 'dark': for (let i = 0; i < 40; i++) { const an = R() * Math.PI * 2, r0 = s * 1.5 + R() * 10; spawnP({ x: x + Math.cos(an) * r0, y: y + Math.sin(an) * r0, ox: x, oy: y, spin: 0.12, life: 30, size: 2 + R() * 2, c0: '#e0a0ff', c1: '#400060', delay: Math.floor(R() * 8) }); } flashFx('#6020a0', 0.3); break;
    case 'meteor':
      for (let m = 0; m < 4; m++) { const d = 8 + m * 7; for (let i = 0; i < 18; i++) { const an = R() * Math.PI * 2, sp = 1 + R() * 3; spawnP({ x: x + (m - 1.5) * 8, y: y + 4, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 1, g: 0.08, life: 22 + R() * 10, size: 2 + R() * 2.5, c0: '#fff0a0', c1: '#c02000', delay: d }); } for (let i = 0; i < 6; i++) spawnP({ x: x + (m - 1.5) * 8, y: y + 4, vx: (R() - 0.5) * 4, vy: -2 - R() * 2, g: 0.18, life: 30, size: 2 + R() * 1.5, c0: '#8a6a4a', c1: '#3a2a1a', blend: 'normal', shape: 'rock', delay: d }); }
      flashFx('#ff9040', 0.6); break;
    case 'quake': for (let i = 0; i < 26; i++) spawnP({ x: x + (R() - 0.5) * 30, y: y + 14, vx: (R() - 0.5) * 2, vy: -2 - R() * 2.5, g: 0.2, life: 26, size: 1.5 + R() * 2, c0: '#a08060', c1: '#4a3a2a', blend: 'normal', shape: 'rock' }); break;
    case 'wind':
      for (let i = 0; i < 30; i++) { const an = R() * Math.PI * 2, r0 = s * 0.9 + R() * 8; spawnP({ x: x + Math.cos(an) * r0, y: y + Math.sin(an) * r0 * 0.5, ox: x, oy: y, spin: 0.16, vy: -0.25, life: 30, size: 1.2 + R() * 1.4, c0: '#ffffff', c1: '#40d090', delay: Math.floor(R() * 10) }); }
      for (let i = 0; i < 8; i++) spawnP({ x: x + (R() - 0.5) * s, y: y + s * 0.5, vx: (R() - 0.5) * 2.5, vy: -1.5 - R() * 1.5, g: 0.04, life: 34, size: 1.6, c0: '#9ae070', c1: '#3a8a3a', blend: 'normal', shape: 'rock', delay: 6 + Math.floor(R() * 8) });
      flashFx('#a0ffd0', 0.25); break;
    case 'barrier': case 'haste': burst(16, { sp: 1.2, life: 26, size: 1.4, p: { c0: '#ffffff', c1: type === 'haste' ? '#ffd040' : '#60b8ff', shape: 'star', g: -0.02, delay: 2 } }); break;
    case 'beam': for (let i = 0; i < 24; i++) { const t = R(); spawnP({ x: from.x + (x - from.x) * t, y: from.y + (y - from.y) * t, vx: (R() - 0.5), vy: (R() - 0.5), life: 18, size: 1.5, c0: '#ffffff', c1: '#40c8ff', shape: 'star', delay: Math.floor(t * 8) }); } flashFx('#80e0ff', 0.4); break;
  }
}
