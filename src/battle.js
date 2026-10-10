// ===================== BATTLE =====================
let B = null;
const PARTY_POS = i => ({ x: 192 + i * 6, y: 28 + i * 28 });

function startBattle(cfg, cb) {
  Input.clear();
  Audio8.stop(); Audio8.sfx(cfg.boss ? 'boss' : 'encounter');
  G.scene = BattleTrans; BattleTrans.t = 0; BattleTrans.cfg = cfg; BattleTrans.cb = cb;
}
const BattleTrans = {
  t: 0, update() { if (++this.t >= 40) Battle.begin(this.cfg, this.cb); },
  draw() {
    Field.draw();
    const t = this.t;
    if (t < 16) { if ((t >> 2) % 2) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(0, 0, SW, SH); } }
    else { const k = (t - 16) / 24; ctx.fillStyle = '#000'; for (let y = 0; y < SH; y += 8) { const w = SW * Math.min(1, k * 1.4 - (y / SH) * 0.4); if (w > 0) ctx.fillRect((y / 8) % 2 ? 0 : SW - w, y, w, 8); } }
  },
};

function mkEnemy(id, idx) {
  const d = ENEMIES[id]; const img = ENEMY_IMG[d.img];
  return { side: 'e', id, d, name: d.name, hp: d.hp, maxhp: d.hp, atb: rnd() * 50, img: d.img, w: img.width, h: img.height, x: 0, y: 0,
    hitT: 0, dying: 0, alive: true, poison: false, stolen: false, turn: 0, phase2: false, buff: 1, i: idx };
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
    B = { cfg, cb, enemies: es, pb: G.party.map(() => ({ atb: 0, defend: false, offx: 0, hitT: 0, ready: false })), queue: [], ready: [], menu: null,
      gen: null, wait: 0, waitKey: false, popups: [], fx: [], parts: [], flashFx: null, banner: null, phase: 'intro', t: 0, msg: null, slide: 1, cheer: false, flee: false };
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
  popup(t, txt, col = '#fff') { const c = this.center(t); B.popups.push({ x: c.x, y: c.y - 4, text: String(txt), col, t: 0 }); },
  update() {
    if (!B) return;
    B.t++;
    B.popups.forEach(p => p.t++); B.popups = B.popups.filter(p => p.t < 50);
    B.fx.forEach(f => f.t++); B.fx = B.fx.filter(f => f.t < f.dur);
    for (const e of B.enemies) {
      if (e.hitT > 0) e.hitT--;
      if (e.dying > 0 && e.dying < 40) { e.dying++; if (e.dying < 34) for (let k = 0; k < 2; k++) spawnP({ x: e.x + Math.random() * e.w, y: e.y + e.h * (1 - e.dying / 34) + Math.random() * 6, vx: (Math.random() - 0.5) * 1.2, vy: -0.6 - Math.random() * 1.2, life: 26, size: 1.6 + Math.random() * 1.6, c0: '#f0d8ff', c1: '#8030c0' }); }
      if (e.alive && e.img === 'garva' && B.t % 2 === 0) spawnP({ x: e.x + 10 + Math.random() * (e.w - 20), y: e.y + 20 + Math.random() * (e.h - 30), vx: (Math.random() - 0.5) * 0.3, vy: -0.4 - Math.random() * 0.6, life: 40, size: 2 + Math.random() * 2.5, c0: '#c060ff', c1: '#300850' });
      if (e.alive && e.img === 'guardian' && B.t % 4 === 0) spawnP({ x: e.x + Math.random() * e.w, y: e.y + Math.random() * e.h, vx: 0, vy: -0.3, life: 30, size: 1.4, c0: '#ffffff', c1: '#60c8ff', shape: 'star' });
    }
    B.parts = (B.parts || []).filter(updP);
    if (B.flashFx && B.flashFx.a > 0) B.flashFx.a -= 0.06;
    B.pb.forEach(p => { if (p.hitT > 0) p.hitT--; });
    if (B.banner && B.banner.t > 0 && --B.banner.t === 0) B.banner = null;
    if (B.phase === 'intro') { B.slide = Math.max(0, B.slide - 1 / 24); if (B.slide <= 0) B.phase = 'main'; return; }
    if (B.gen) {
      if (B.waitKey) { if (Input.pressed.a) { B.waitKey = false; Audio8.sfx('cursor'); } else return; }
      if (B.wait > 0) { B.wait--; return; }
      let r; try { r = B.gen.next(); } catch (e) { console.error(e); r = { done: true }; }
      if (!B) return;
      if (r.done) { B.gen = null; this.afterAction(); }
      else if (r.value === 'key') B.waitKey = true; else B.wait = r.value || 0;
      return;
    }
    if (B.phase !== 'main') return;
    if (B.queue.length) { const a = B.queue.shift(); B.gen = this.exec(a); return; }
    if (B.menu) { BMenu.update(); return; }
    while (B.ready.length && G.party[B.ready[0]].hp <= 0) { B.pb[B.ready[0]].ready = false; B.ready.shift(); }
    if (B.ready.length) { BMenu.open(B.ready[0]); return; }
    // tick ATB
    G.party.forEach((m, i) => {
      const pb = B.pb[i]; if (m.hp <= 0 || pb.ready) return;
      pb.atb += (stats(m).spd + 20) * 0.04;
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
    return { dmg: Math.max(1, Math.round(dmg)), crit };
  },
  magic(src, dst, sk) {
    const A = this.statsOf(src), D = this.statsOf(dst);
    const m = sk.power + A.mag * 2; let dmg = m * m / (m + D.mdf) * (0.9 + rnd() * 0.2);
    let note = '';
    if (dst.side === 'e') { const d = B.enemies[dst.i].d; if (d.weak && d.weak.includes(sk.elem)) { dmg *= 1.8; note = 'weak'; } if (d.absorb && d.absorb.includes(sk.elem)) { return { heal: Math.round(dmg * 0.6) }; } }
    if (dst.side === 'p' && B.pb[dst.i].defend) dmg *= 0.7;
    return { dmg: Math.max(1, Math.round(dmg)), note };
  },
  healAmt(src, sk) { const A = this.statsOf(src); return Math.round((sk.power + A.mag * 2.4) * (0.92 + rnd() * 0.16)); },
  damage(t, n, col = '#fff') {
    const u = this.unit(t);
    if (t.side === 'p') { u.hp = Math.max(0, u.hp - n); B.pb[t.i].hitT = 12; if (u.hp <= 0) { u.poison = false; B.pb[t.i].atb = 0; B.pb[t.i].ready = false; B.ready = B.ready.filter(x => x !== t.i); Audio8.sfx('ko'); } }
    else { u.hp = Math.max(0, u.hp - n); u.hitT = 12; if (u.hp <= 0 && u.alive) { u.alive = false; u.dying = 1; Audio8.sfx('ko'); } }
    this.popup(t, n, col);
  },
  heal(t, n) {
    const u = this.unit(t);
    if (t.side === 'p') { const mx = stats(u).maxhp; u.hp = Math.min(mx, u.hp + n); }
    else { u.hp = Math.min(u.maxhp, u.hp + n); }
    this.popup(t, n, '#7dffa0');
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
    if (tgtMode === 'enemies') targets = allOf(otherSide);
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
    // approach animation
    if (a.side === 'p') { B.pb[a.i].pose = (item || (sk && sk.kind !== 'phys' && sk.kind !== 'steal')) ? 'cast' : 'attack'; for (let k = 0; k < 6; k++) { B.pb[a.i].offx = -k * 3; yield 1; } }
    else { const e = B.enemies[a.i]; e.hitT = 0; e.blink = 1; yield 3; e.blink = 0; yield 2; e.blink = 1; yield 3; e.blink = 0; for (let k = 1; k <= 10; k++) { e.lunge = k / 10; yield 1; } e.lunge = 0; }
    const fx = item ? (item.heal || item.full || item.revive || item.mpheal ? 'heal' : 'heal') : (a.side === 'p' && a.id === 'attack' ? 'slash' : sk.fx);
    if (a.kind === 'skill' && sk.kind === 'steal') { yield* this.steal(src, targets[0]); }
    else {
      const hits = (sk && sk.hits) || 1;
      for (let h = 0; h < hits; h++) {
        this.playFx(fx, src, targets);
        yield fxDur(fx) * 0.6;
        for (const t of targets) {
          if (!wantsDead && !this.isAlive(t)) continue;
          if (item) this.applyItem(item, t);
          else this.applySkill(sk, src, t);
        }
        yield 14;
      }
    }
    if (a.side === 'p') { for (let k = 5; k >= 0; k--) { B.pb[a.i].offx = -k * 3; yield 1; } }
    yield 10;
  },
  applySkill(sk, src, t) {
    switch (sk.kind) {
      case 'phys': {
        const r = this.phys(src, t, sk.mult);
        if (r.miss) { this.popup(t, 'MISS', '#ccc'); Audio8.sfx('cancel'); break; }
        let dmg = r.dmg;
        this.damage(t, dmg, r.crit ? '#ffe060' : '#fff'); Audio8.sfx(r.crit ? 'crit' : 'hit');
        if (r.crit) G.shake = 8;
        if (sk.poison && t.side === 'p' && this.isAlive(t) && rnd() < sk.poison) { G.party[t.i].poison = true; this.popup(t, '毒', '#b07dff'); }
        break;
      }
      case 'mag': {
        const r = this.magic(src, t, sk);
        if (r.heal) { this.heal(t, r.heal); break; }
        this.damage(t, r.dmg, r.note === 'weak' ? '#ffb040' : '#fff'); break;
      }
      case 'heal': {
        const n = this.healAmt(src, sk);
        if (t.side === 'e' && B.enemies[t.i].d.undead) this.damage(t, n, '#fff'); else this.heal(t, n);
        break;
      }
      case 'cure': { const u = this.unit(t); u.poison = false; this.popup(t, 'CURE', '#7dffa0'); break; }
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
    const s = { slash: 'slash', slash2: 'slash', whirl: 'slash', braver: 'crit', claw: 'slash', fire: 'fire', ice: 'ice', bolt: 'bolt', heal: 'heal', holy: 'holy', dark: 'dark', meteor: 'meteor', quake: 'crit', beam: 'holy' }[type];
    if (s) Audio8.sfx(s);
    if (type === 'quake' || type === 'meteor' || type === 'braver') G.shake = 16;
    for (const t of targets) { const c = this.center(t); spawnFx(type, c.x, c.y, t.side === 'e' ? B.enemies[t.i].w : 30, from); }
  },
  // ---------- end sequences ----------
  *victory() {
    yield 30;
    Audio8.play('victory'); B.cheer = true;
    let exp = 0, gil = 0; const drops = [];
    for (const e of B.enemies) { exp += e.d.exp; gil += e.d.gil; if (e.d.drop && rnd() < e.d.drop[1]) drops.push(e.d.drop[0]); }
    G.gil += gil; G.party.forEach(m => m.poison = false);
    const lines = ['戦闘に勝利した!', `${exp} EXP を獲得! ${gil} ギル を手に入れた!`];
    for (const d of drops) { addItem(d); lines.push(`${ITEMS[d].name} を手に入れた!`); }
    for (const m of G.party) { const ms = gainExp(m, exp); if (ms.length) { lines.push(...ms); } }
    for (const l of lines) { B.msg = l; if (l.includes('レベル')) Audio8.sfx('levelup'); yield 'key'; }
    B.msg = null; B.phase = 'end';
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
    const env = set === 'cave' ? ENV.battleCave : set === 'tower' ? ENV.battleTower : ENV.battleDay;
    // background layer: soft focus far away, sharper near the ground (HD-2D style)
    beginWorld('#05050f'); const bg = drawBattleBg(set, G.mapId); layerToMain([1, 0.25]);
    // character layer: crisp pixels
    beginWorld();
    let sx = 0; if (G.shake > 0) { sx = (Math.random() - 0.5) * 6; }
    ctx.save(); ctx.translate(Math.round(sx), 0);
    const slide = B.slide;
    for (const e of B.enemies) {
      if (!e.alive && e.dying >= 40) continue;
      const A = ENEMY_ANIM[e.img];
      const fi = A ? Math.floor((B.t + e.i * 5) / A.period) % 4 : 0;
      const img = A ? A.frames[fi] : ENEMY_IMG[e.img], fl = A ? A.flash[fi] : ENEMY_IMG[e.img + ':flash'];
      const bob = A && A.float ? Math.round(Math.sin((B.t + e.i * 20) / 16) * 2.5) : 0;
      const lunge = e.lunge ? Math.round(Math.sin(e.lunge * Math.PI) * 14) : 0;
      const ex = Math.round(e.x - slide * 180) + lunge, ey = e.y + bob;
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
      let x = p.x + pb.offx + Math.round(slide * 80), y = p.y;
      const active = B.menu && B.menu.who === i;
      if (active) x -= 8;
      let pose = 'idle';
      if (m.hp <= 0) pose = 'ko';
      else if (pb.hitT > 0) pose = 'hurt';
      else if (B.flee) pose = 'walk';
      else if (pb.offx < 0) pose = pb.offx <= -12 ? (pb.pose === 'cast' ? 'cast' : 'strike') : (pb.pose === 'cast' ? 'cast' : 'walk');
      else if (B.cheer) pose = 'win';
      else if (active && B.menu.stage !== 'cmd') pose = 'cast';
      else if (stats(m).maxhp / 4 > m.hp) pose = 'kneel';
      let img = hb[pose];
      if (pb.hitT % 4 > 1) img = hb.flash[pose];
      const breathe = pose === 'idle' && ((B.t + i * 17) >> 5) % 2 ? 1 : 0;
      if (B.cheer && m.hp > 0) y -= Math.abs(Math.sin(B.t / 7 + i)) * 5;
      ctx.fillStyle = 'rgba(8,4,16,.38)'; ctx.beginPath(); ctx.ellipse(x + 17, p.y + 31, 10, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      const sh = pb.hitT ? (pb.hitT % 2 ? 2 : -2) : 0;
      if (pose === 'ko') ctx.drawImage(img, x + sh, p.y + 8);
      else { ctx.drawImage(img, x + 4 + sh, y + breathe, 24, 32 - breathe); }
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
    });
    for (const f of B.fx) drawFx(f);
    drawParts();
    if (B.flashFx && B.flashFx.a > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(0.6, B.flashFx.a); ctx.fillStyle = B.flashFx.col; ctx.fillRect(0, 0, SW, 150); ctx.restore(); }
    for (const p of B.popups) {
      const k = p.t; const bounce = k < 12 ? -Math.sin(k / 12 * Math.PI) * 9 : 0; const a = k > 40 ? (50 - k) / 10 : 1;
      const big = p.col === '#ffe060' ? 12 : 10;
      ctx.save(); ctx.globalAlpha = a; ctx.font = `800 ${big}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(10,6,20,.9)'; ctx.lineJoin = 'round'; ctx.strokeText(p.text, p.x, p.y + bounce - 7);
      ctx.fillStyle = p.col; ctx.fillText(p.text, p.x, p.y + bounce - 7); ctx.restore();
    }
    // HUD
    win(0, 150, 96, 74);
    const names = []; for (const e of B.enemies) if (e.alive) names.push(e.name);
    if (!B.menu) names.slice(0, 5).forEach((n, i) => text(n, 9, 158 + i * 12, UI.ink, n.length > 8 ? 7 : 8));
    const listOpen = B.menu && (B.menu.stage === 'list' || (B.menu.stage === 'target' && B.menu.prev === 'list'));
    if (!listOpen) {
    win(96, 150, 160, 74);
    text('HP', 132, 152.5, UI.label, 5); text('MP', 186, 152.5, UI.label, 5); text('ATB', 204, 152.5, UI.label, 5);
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
    if (B.banner) { const w = Math.max(80, textW(B.banner.text, 8, 't') + 28); win((SW - w) / 2, 5, w, 20); text(B.banner.text, SW / 2, 11, UI.ink, 8, 'center', 't'); }
    if (B.msg) { win(8, 5, 240, 22); text(B.msg, SW / 2, 12, UI.ink, 8, 'center'); if (B.waitKey) { const bob = Math.sin(G.frame / 6); ctx.fillStyle = UI.gold; ctx.beginPath(); ctx.moveTo(238, 17 + bob); ctx.lineTo(243, 17 + bob); ctx.lineTo(240.5, 20.5 + bob); ctx.fill(); } }
  },
};

const BOSS_AI = {
  gking(e) { if (e.turn % 3 === 0) return 'roar'; return rnd() < 0.4 ? 'smash' : 'attack'; },
  guardian(e) { return ['attack', 'beam', 'attack', 'quake', 'beam', 'attack'][e.turn % 6]; },
  garva(e) {
    if (!e.phase2 && e.hp < e.maxhp / 2) { e.phase2 = true; e.buff = 1.15; Battle.banner('ガルヴァの闇が膨れ上がった!'); G.shake = 20; return 'darkwave'; }
    return e.phase2 ? ['darkwave', 'attack', 'darkblade', 'attack', 'darkwave', 'darkblade'][e.turn % 6] : ['attack', 'darkblade', 'attack', 'frost', 'attack'][e.turn % 5];
  },
};

// ---------- battle background (painted per area, cached) ----------
const BG_CACHE = {};
function bgKey(set, mapId) {
  if (mapId === 'tower3') return 'sanctum';
  if (set === 'world') { const ch = G.map.g[G.p.y][G.p.x]; if (ch === 'T') return 'forest'; return G.p.y >= 14 ? 'dusk' : 'plains'; }
  if (set === 'town') return 'plains';
  return set;
}
function paintBg(key) {
  const c = mkCanvas(SW, 150), x = c.getContext('2d'); const r = mulberry(key.length * 97 + 3); const lights = [];
  const P = (col, a, b, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), w, h); };
  const grad = (y0, y1, stops) => { const g = x.createLinearGradient(0, y0, 0, y1); stops.forEach((s2, i) => g.addColorStop(i / (stops.length - 1), s2)); return g; };
  const ridge = (base, amp, col, seed, step = 6) => { const rr = mulberry(seed); x.fillStyle = col; x.beginPath(); x.moveTo(0, 150); for (let i = -6; i <= SW + 6; i += step) x.lineTo(i, base - Math.abs(Math.sin(i / 41 + seed)) * amp - rr() * amp * 0.25); x.lineTo(SW, 150); x.fill(); };
  const blob = (cx, cy, rad, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, rad, 0, 7); x.fill(); };
  const groundRows = (y0, cols) => { for (let y = y0; y < 150; y++) { const k = (y - y0) / (150 - y0); x.fillStyle = cols[Math.min(cols.length - 1, Math.floor(k * cols.length))]; x.fillRect(0, y, SW, 1); } };
  if (key === 'plains' || key === 'dusk' || key === 'forest') {
    const dusk = key === 'dusk';
    x.fillStyle = grad(0, 80, dusk ? ['#3a3a7a', '#c86a5a', '#ffc080'] : ['#3c7ad8', '#8cc4f4', '#e8f4ff']); x.fillRect(0, 0, SW, 82);
    blob(dusk ? 200 : 210, dusk ? 62 : 18, 10, dusk ? '#ffe0a0' : '#fffbe8'); lights.push([dusk ? 200 : 210, dusk ? 62 : 18, 90, dusk ? '#ffb060' : '#fff4d0']);
    x.fillStyle = dusk ? 'rgba(255,200,180,.7)' : 'rgba(255,255,255,.85)';
    for (let i = 0; i < 6; i++) { const cx = r() * SW, cy = 8 + r() * 34, w = 14 + r() * 20; x.beginPath(); x.ellipse(cx, cy, w, 3.5, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(cx + w * 0.3, cy - 3, w * 0.5, 3.5, 0, 0, 7); x.fill(); }
    ridge(70, 30, dusk ? '#7a5a8a' : '#8aa8d8', 2, 8);
    for (let i = 0; i < SW; i += 2) { const h = 70 - Math.abs(Math.sin(i / 41 + 2)) * 30; if (h < 50) P(dusk ? '#f0d0d0' : '#f4f8ff', i, h, 2, 2); }
    ridge(80, 16, dusk ? '#5a4a6a' : '#5a8ab0', 5, 6);
    // tree line
    for (let i = -4; i < SW + 4; i += 7) { const h = 6 + r() * 5; blob(i, 84 - h * 0.4, h * 0.7, dusk ? '#2e3a2e' : '#2e5a34'); }
    groundRows(84, dusk ? ['#4a5a2e', '#5a6a32', '#6a7a38', '#7a8a3e'] : ['#4a8a3a', '#56963e', '#62a244', '#6eae48']);
    for (let i = 0; i < 160; i++) { const yy = 86 + Math.pow(r(), 0.7) * 64; const xx = r() * SW; const sz = 1 + (yy - 84) / 40; P(r() < 0.5 ? (dusk ? '#3e4e28' : '#3e7a30') : (dusk ? '#8a9a4a' : '#86c25a'), xx, yy, sz, sz); }
    for (let i = 0; i < 10; i++) P(['#fff3c4', '#ffd0e0', '#d8e8ff'][i % 3], r() * SW, 100 + r() * 48, 2, 2);
    // dirt path
    x.fillStyle = dusk ? 'rgba(160,120,70,.45)' : 'rgba(200,170,110,.45)'; x.beginPath(); x.moveTo(120, 84); x.lineTo(136, 84); x.lineTo(200, 150); x.lineTo(60, 150); x.fill();
    if (key === 'forest') {
      x.fillStyle = 'rgba(20,40,20,.35)'; x.fillRect(0, 0, SW, 150);
      for (let i = 0; i < 9; i++) { const tx = i * 31 + r() * 10, w = 6 + r() * 6; P('#3a2a1a', tx, 0, w, 92); P('#5a4026', tx + 1, 0, 2, 92); blob(tx + w / 2, 6 + r() * 10, 22, '#1e4a24'); blob(tx + w / 2 - 6, 2, 14, '#2e6a30'); }
      for (let i = 0; i < 5; i++) lights.push([30 + i * 50, 60 + r() * 40, 50, '#fff4c0']);
    }
  } else if (key === 'cave') {
    x.fillStyle = grad(0, 150, ['#0c0814', '#1e1626', '#2a2030']); x.fillRect(0, 0, SW, 150);
    for (let layer = 0; layer < 3; layer++) { const col = ['#1a1220', '#241a2c', '#2e2236'][layer]; for (let i = 0; i < 9; i++) { const sx = r() * SW, w = 10 + r() * 14, h = 20 + r() * 40 - layer * 6; x.fillStyle = col; x.beginPath(); x.moveTo(sx - w, 0); x.lineTo(sx, h); x.lineTo(sx + w, 0); x.fill(); } }
    ridge(92, 24, '#1c1424', 7, 5);
    groundRows(90, ['#2e2430', '#3a2e36', '#463840', '#52424a']);
    for (let i = 0; i < 120; i++) { const yy = 92 + r() * 58; P(r() < 0.5 ? '#2a2028' : '#5e4c54', r() * SW, yy, 1 + (yy - 90) / 30, 1); }
    // glowing crystal clusters
    for (const [cx, cy, s2] of [[22, 96, 1], [232, 92, 1.2], [70, 84, 0.7], [190, 80, 0.6]]) {
      for (let k = -1; k <= 1; k++) { const h = (14 + k * 4) * s2, w = 3 * s2; x.fillStyle = k ? '#3aa8d8' : '#7fe0ff'; x.beginPath(); x.moveTo(cx + k * 5 * s2 - w, cy); x.lineTo(cx + k * 5 * s2, cy - h); x.lineTo(cx + k * 5 * s2 + w, cy); x.fill(); P('#e8fbff', cx + k * 5 * s2 - 1, cy - h + 3, 1, h * 0.5); }
      lights.push([cx, cy - 8, 70 * s2, '#7fe6ff']);
    }
    x.fillStyle = 'rgba(60,120,200,.35)'; x.beginPath(); x.ellipse(150, 128, 30, 4, 0, 0, 7); x.fill();
  } else if (key === 'tower' || key === 'sanctum') {
    x.fillStyle = grad(0, 150, key === 'sanctum' ? ['#0a1030', '#1a2a5a', '#2a3a70'] : ['#100c24', '#221a44', '#2e2456']); x.fillRect(0, 0, SW, 150);
    // stained glass window
    const wx = 128;
    x.fillStyle = '#0a0818'; x.beginPath(); x.moveTo(wx - 22, 74); x.lineTo(wx - 22, 26); x.quadraticCurveTo(wx, 2, wx + 22, 26); x.lineTo(wx + 22, 74); x.fill();
    const glass = ['#4060c0', '#a040a0', '#40a0c0', '#c0a040', '#6040c0'];
    for (let yy = 10; yy < 72; yy += 6) for (let xx = wx - 20; xx < wx + 20; xx += 6) { if (Math.hypot(xx - wx, Math.max(0, 26 - yy)) > 21) continue; P(glass[(xx * 7 + yy * 3) % 5], xx + 0.5, yy + 0.5, 5, 5); }
    P('#0a0818', wx - 1, 6, 2, 68); P('#0a0818', wx - 22, 46, 44, 2);
    lights.push([wx, 40, 120, key === 'sanctum' ? '#9ad8ff' : '#b090ff']);
    // receding pillars
    for (const [px_, w, h, col] of [[30, 12, 100, '#3a3462'], [226, 12, 100, '#3a3462'], [66, 8, 78, '#2c2850'], [190, 8, 78, '#2c2850']]) { P(col, px_ - w / 2, 92 - h, w, h); P('#5a528a', px_ - w / 2, 92 - h, 2, h); P('#1e1a3a', px_ + w / 2 - 2, 92 - h, 2, h); P('#6a62a0', px_ - w / 2 - 2, 92 - h, w + 4, 3); }
    groundRows(90, ['#2a2450', '#342c5e', '#3e366c', '#48407a']);
    for (let yy = 92; yy < 150; yy += 6) P('rgba(0,0,0,.18)', 0, yy, SW, 1);
    x.fillStyle = '#6a1a3a'; x.beginPath(); x.moveTo(118, 90); x.lineTo(138, 90); x.lineTo(176, 150); x.lineTo(80, 150); x.fill();
    x.fillStyle = '#c8a040'; x.fillRect(0, 0, 0, 0); x.strokeStyle = '#c8a040'; x.lineWidth = 1; x.beginPath(); x.moveTo(119, 90); x.lineTo(83, 150); x.moveTo(137, 90); x.lineTo(173, 150); x.stroke();
    if (key === 'sanctum') { x.fillStyle = 'rgba(127,230,255,.9)'; x.beginPath(); x.moveTo(wx, 30); x.lineTo(wx + 7, 46); x.lineTo(wx, 62); x.lineTo(wx - 7, 46); x.fill(); lights.push([wx, 46, 160, '#7fe6ff']); }
  } else { // inside
    x.fillStyle = '#4a3020'; x.fillRect(0, 0, SW, 92);
    for (let i = 0; i < SW; i += 8) { P('#5a3a26', i, 0, 7, 92); P('#6e4a30', i + 1, 0, 1, 92); }
    P('#2e1e14', 0, 86, SW, 6); P('#a07850', 0, 86, SW, 1);
    P('#1a1010', 40, 30, 30, 34); P('#ffb050', 44, 46, 22, 16); lights.push([55, 50, 90, '#ff9a40']);
    groundRows(92, ['#7a5434', '#8a603c', '#966a42', '#a07448']);
    for (let yy = 94; yy < 150; yy += 7) P('rgba(0,0,0,.2)', 0, yy, SW, 1);
  }
  return { c, lights };
}
function drawBattleBg(set, mapId) {
  const key = bgKey(set, mapId);
  if (!BG_CACHE[key]) BG_CACHE[key] = paintBg(key);
  ctx.drawImage(BG_CACHE[key].c, 0, 0);
  return BG_CACHE[key];
}

// ---------- FX ----------
function fxDur(t) { return { slash: 16, slash2: 22, whirl: 24, braver: 34, claw: 16, fire: 32, ice: 30, bolt: 26, heal: 34, holy: 36, dark: 32, meteor: 44, quake: 28, beam: 26, none: 2 }[t] || 16; }
const GLOW_FX = new Set(['fire', 'ice', 'bolt', 'heal', 'holy', 'beam', 'meteor', 'braver', 'slash2', 'whirl', 'slash']);
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
        case 1: M.list = skillsOf(m).map(id => ({ id, label: SKILLS[id].name, right: SKILLS[id].mp ? String(SKILLS[id].mp) : '', ok: m.mp >= SKILLS[id].mp, desc: SKILLS[id].desc })); M.listKind = 'skill'; M.stage = 'list'; M.li = 0; M.scroll = 0; break;
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
    case 'beam': for (let i = 0; i < 24; i++) { const t = R(); spawnP({ x: from.x + (x - from.x) * t, y: from.y + (y - from.y) * t, vx: (R() - 0.5), vy: (R() - 0.5), life: 18, size: 1.5, c0: '#ffffff', c1: '#40c8ff', shape: 'star', delay: Math.floor(t * 8) }); } flashFx('#80e0ff', 0.4); break;
  }
}
