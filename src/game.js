// ===================== CORE STATE =====================
const G = {
  frame: 0, scene: null, flags: {}, party: [], inv: {}, gil: 0, time: 0,
  mapId: null, map: null, p: { x: 0, y: 0, dir: 'down', moving: 0, ox: 0, oy: 0, anim: 0 },
  fadeLevel: 0, fadeTarget: 0, flash: 0, shake: 0, script: null, dialog: null, choice: null, narr: null,
  menu: null, banner: null, steps: 0, debug: { noEnc: false },
};
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// ---------- party ----------
function newMember(id, lv = 1) {
  const h = HEROES[id]; const m = { id, lv, exp: expAt(lv), weapon: h.weapon, armor: h.armor, poison: false, hp: 0, mp: 0 };
  const s = stats(m); m.hp = s.maxhp; m.mp = s.maxmp; return m;
}
function stats(m) {
  const h = HEROES[m.id]; const L = m.lv - 1; const w = ITEMS[m.weapon] || {}, a = ITEMS[m.armor] || {};
  const g = k => Math.floor(h.base[k] + h.grow[k] * L);
  return {
    maxhp: Math.min(9999, g('hp')), maxmp: Math.min(999, g('mp')), str: g('str'), def: g('def') + (a.def || 0), mag: g('mag') + (w.mag || 0),
    mdf: g('mdf') + (a.mdf || 0), spd: g('spd') + (w.spd || 0), atk: g('str') + (w.atk || 0), crit: h.crit,
  };
}
function skillsOf(m) { return HEROES[m.id].skills.filter(s => m.lv >= s[1]).map(s => s[0]); }
function joinParty(id) {
  if (G.party.some(m => m.id === id)) return;
  const lv = Math.max(1, Math.round(G.party.reduce((s, m) => s + m.lv, 0) / G.party.length));
  G.party.push(newMember(id, lv));
}
function addItem(id, n = 1) { G.inv[id] = (G.inv[id] || 0) + n; if (G.inv[id] > 99) G.inv[id] = 99; }
function removeItem(id, n = 1) { G.inv[id] = (G.inv[id] || 0) - n; if (G.inv[id] <= 0) delete G.inv[id]; }
function healAll() { for (const m of G.party) { const s = stats(m); m.hp = s.maxhp; m.mp = s.maxmp; m.poison = false; } }
function gainExp(m, n) {
  const msgs = []; if (m.hp <= 0) return msgs;
  m.exp += n;
  while (m.lv < 50 && m.exp >= expAt(m.lv + 1)) {
    const before = stats(m); const known = skillsOf(m);
    m.lv++; const after = stats(m);
    m.hp += after.maxhp - before.maxhp; m.mp += after.maxmp - before.maxmp;
    msgs.push(`${HEROES[m.id].name}はレベル${m.lv}になった!`);
    for (const s of skillsOf(m)) if (!known.includes(s)) msgs.push(`${HEROES[m.id].name}は「${SKILLS[s].name}」を覚えた!`);
  }
  return msgs;
}

// ---------- save / load ----------
const SAVE_KEY = 'crystal-echo-save-v1';
function snapshot() {
  return { v: 1, party: G.party.map(m => ({ ...m })), inv: { ...G.inv }, gil: G.gil, flags: { ...G.flags }, time: G.time,
    map: G.mapId, x: G.p.x, y: G.p.y, dir: G.p.dir };
}
function saveGame() { return Store.set(SAVE_KEY, JSON.stringify(snapshot())); }
function hasSave() { return !!Store.get(SAVE_KEY); }
function applySnapshot(d) {
  G.party = d.party.map(m => ({ ...m })); G.inv = { ...d.inv }; G.gil = d.gil; G.flags = { ...d.flags }; G.time = d.time || 0;
  Field.enter(d.map, d.x, d.y, d.dir);
}
function loadGame() { try { const s = Store.get(SAVE_KEY); if (!s) return false; applySnapshot(JSON.parse(s)); return true; } catch (e) { console.warn(e); return false; } }

function newGame() {
  G.flags = {}; G.inv = { potion: 3, antidote: 1 }; G.gil = 200; G.time = 0;
  G.party = [newMember('allen'), newMember('lina')];
  Field.enter('elm', 12, 12, 'up', true);
  runScript(SCRIPTS.intro);
}

// ===================== SCRIPT RUNNER =====================
function* say(text, name) { yield { t: 'say', text, name }; }
function* narrate(text) { yield { t: 'narrate', text }; }
function* ask(text, opts, name) { yield { t: 'say', text, name, keep: true }; return yield { t: 'choice', opts }; }
function* inn(price) {
  const c = yield* ask(`いらっしゃいませ。\n一晩 ${price}ギル になります。\nお泊まりになりますか?`, ['はい', 'いいえ'], '宿屋');
  if (c !== 0) { yield* say('またのお越しをお待ちしております。', '宿屋'); return; }
  if (G.gil < price) { yield* say('お金が足りないようですね…', '宿屋'); return; }
  G.gil -= price; yield { t: 'fadeout' }; Audio8.play('inn'); healAll(); yield { t: 'wait', n: 150 };
  Audio8.play(G.map.music); yield { t: 'fadein' };
  yield* say('おはようございます!\nHPとMPが全回復しました。', '宿屋');
}
function runScript(fn, onDone, ...args) {
  if (G.script) { const prev = G.script; console.warn('script overlap'); }
  G.script = { gen: fn(...args), cur: null, onDone, n: 0 };
  advance();
}
function advance(val) {
  const s = G.script; if (!s) return;
  let r;
  try { r = s.gen.next(val); } catch (e) { console.error(e); r = { done: true }; }
  if (r.done) { G.script = null; G.dialog = null; G.choice = null; if (s.onDone) s.onDone(r.value); return; }
  const c = s.cur = r.value;
  switch (c.t) {
    case 'say': {
      const pk = null;
      const lines = wrapText(c.text, pk ? 178 : 226, 8.5);
      G.dialog = { pages: [], name: c.name, portrait: pk, shown: 0, keep: c.keep };
      for (let i = 0; i < lines.length; i += 4) G.dialog.pages.push(lines.slice(i, i + 4).join('\n'));
      G.dialog.text = G.dialog.pages.shift(); break;
    }
    case 'narrate': G.narr = { text: c.text, shown: 0, t: 0 }; break;
    case 'choice': G.choice = { opts: c.opts, i: 0 }; break;
    case 'wait': s.n = c.n; break;
    case 'fadeout': G.fadeTarget = 1; break;
    case 'fadein': G.fadeTarget = 0; break;
    case 'battle': startBattle(c, res => { if (res === 'lose') { G.script = null; return; } advance(res); }); break;
    case 'shop': Shop.open(c.id, () => advance()); break;
    case 'ending': G.script = null; G.dialog = null; Ending.start(); break;
    default: advance();
  }
}
function updateScript() {
  const s = G.script; if (!s || !s.cur) return;
  const c = s.cur;
  if (c.t === 'say') {
    const d = G.dialog; if (!d) return;
    if (d.shown < d.text.length) {
      d.shown += Input.down.a ? 3 : 1;
      if (d.shown >= d.text.length) { d.shown = d.text.length; if (d.keep) advance(); }
    } else if (Input.pressed.a || Input.pressed.b) { Audio8.sfx('cursor'); if (d.pages && d.pages.length) { d.text = d.pages.shift(); d.shown = 0; } else { G.dialog = null; advance(); } }
  } else if (c.t === 'narrate') {
    const n = G.narr; n.t++; if (n.shown < n.text.length && n.t % 2 === 0) n.shown++;
    if (Input.pressed.a) { if (n.shown < n.text.length) n.shown = n.text.length; else { G.narr = null; advance(); } }
  } else if (c.t === 'choice') {
    const ch = G.choice;
    if (Input.rep('up')) { ch.i = (ch.i + ch.opts.length - 1) % ch.opts.length; Audio8.sfx('cursor'); }
    if (Input.rep('down')) { ch.i = (ch.i + 1) % ch.opts.length; Audio8.sfx('cursor'); }
    if (Input.pressed.a) { Audio8.sfx('ok'); const i = ch.i; G.choice = null; G.dialog = null; advance(i); }
    else if (Input.pressed.b) { Audio8.sfx('cancel'); G.choice = null; G.dialog = null; advance(ch.opts.length - 1); }
  } else if (c.t === 'wait') { if (--s.n <= 0) advance(); }
  else if (c.t === 'fadeout') { if (G.fadeLevel >= 1) advance(); }
  else if (c.t === 'fadein') { if (G.fadeLevel <= 0) advance(); }
}
const KINSOKU = '、。,.!?！？」』)）…ー〜～';
function wrapText(str, maxW, size) {
  const out = [];
  for (const para of str.split('\n')) {
    let line = '';
    for (const ch of para) {
      if (line && textW(line + ch, size) > maxW && !KINSOKU.includes(ch)) { out.push(line); line = ch; } else line += ch;
    }
    out.push(line);
  }
  return out;
}
function drawDialog() {
  const d = G.dialog;
  if (d) {
    const y = 150; win(6, y, 244, 70);
    const tx = d.portrait ? 66 : 16;
    if (d.name) {
      const w = textW(d.name, 8, 't') + 22; win(12, y - 13, w, 17);
      text(d.name, 12 + w / 2, y - 9, UI.gold, 8, 'center', 't');
    }
    const lines = d.text.slice(0, d.shown).split('\n');
    lines.forEach((l, i) => text(l, tx, y + 11 + i * 14, UI.ink, 8.5));
    if (d.shown >= d.text.length && !d.keep) {
      const bob = Math.sin(G.frame / 6) * 1.2; ctx.fillStyle = UI.gold;
      ctx.beginPath(); ctx.moveTo(236, 207 + bob); ctx.lineTo(242, 207 + bob); ctx.lineTo(239, 211 + bob); ctx.fill();
    }
  }
  if (G.choice) {
    const ch = G.choice; const w = 74, h = ch.opts.length * 14 + 12; const x = 172, y = 134 - h;
    win(x, y, w, h); ch.opts.forEach((o, i) => text(o, x + 20, y + 7 + i * 14, ch.i === i ? UI.gold : UI.ink));
    cursor(x + 7, y + 8 + ch.i * 14);
  }
  if (G.narr) {
    ctx.fillStyle = '#040410'; ctx.fillRect(0, 0, SW, SH);
    const g = ctx.createRadialGradient(SW / 2, SH / 2, 10, SW / 2, SH / 2, 160); g.addColorStop(0, 'rgba(60,70,140,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
    const lines = G.narr.text.slice(0, G.narr.shown).split('\n');
    lines.forEach((l, i) => text(l, SW / 2, 84 + i * 18 - lines.length * 5, '#e8e2d4', 9, 'center', 't'));
    if (G.narr.shown >= G.narr.text.length) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(G.frame / 10); text('◆', SW / 2, 192, UI.gold, 6, 'center'); ctx.globalAlpha = 1; }
  }
}

// ===================== FIELD =====================
const Field = {
  npcs: [],
  enter(id, x, y, dir = 'down', silent) {
    G.mapId = id; G.map = MAPS[id]; const p = G.p; p.x = x; p.y = y; p.dir = dir; p.moving = 0; p.ox = p.oy = 0;
    this.npcs = (G.map.npcs || []).map(d => ({ d, x: d.x, y: d.y, dir: d.dir || 'down', mv: 0, ox: 0, oy: 0, tx: d.x, ty: d.y, timer: 60 + Math.floor(rnd() * 120) }));
    G.scene = Field; G.steps = 0;
    if (!silent) Audio8.play(G.map.music); else Audio8.play(G.map.music);
    if (G.map.set !== 'inside') G.banner = { text: G.map.name, t: 120 };
  },
  tileAt(x, y) { const g = G.map.g; return (g[y] && g[y][x]) || null; },
  tdef(ch) { return TILESETS[G.map.set][ch] || ['grass', 1]; },
  npcAt(x, y) { return this.npcs.find(n => n.d.show && !n.d.show() ? false : ((n.x === x && n.y === y) || (n.mv && n.tx === x && n.ty === y))); },
  solid(x, y) {
    const ch = this.tileAt(x, y); if (ch == null) return true;
    if (this.tdef(ch)[1]) return true;
    return !!this.npcAt(x, y);
  },
  update() {
    G.time++;
    this.updateNpcs();
    if (G.banner && --G.banner.t <= 0) G.banner = null;
    if (Shop.active) { Shop.update(); return; }
    if (G.script) { updateScript(); return; }
    if (G.menu) { Menu.update(); return; }
    const p = G.p;
    if (p.moving) {
      p.moving -= 2; const [dx, dy] = DIRS[p.dir]; p.ox = -dx * p.moving; p.oy = -dy * p.moving; p.anim++;
      if (p.moving <= 0) { p.ox = p.oy = 0; this.arrive(); }
      return;
    }
    if (Input.pressed.menu || Input.pressed.b) { Menu.open(); Audio8.sfx('ok'); return; }
    if (Input.pressed.a) { this.interact(); return; }
    const d = Input.dir();
    if (d) {
      p.dir = d; const [dx, dy] = DIRS[d]; const nx = p.x + dx, ny = p.y + dy;
      if (nx < 0 || ny < 0 || nx >= G.map.w || ny >= G.map.h) { this.leave(); return; }
      if (!this.solid(nx, ny)) { p.x = nx; p.y = ny; p.moving = 16; p.ox = -dx * 16; p.oy = -dy * 16; }
      else p.anim = 0;
    } else p.anim = 0;
  },
  leave() {
    const ex = G.map.exit; if (!ex) return;
    const go = () => transition(() => this.enter(ex.map, ex.x, ex.y, 'down'));
    if (ex.gate) runScript(function* () { return yield* SCRIPTS[ex.gate](); }, ok => { if (ok) go(); });
    else go();
  },
  arrive() {
    const p = G.p; const key = p.x + ',' + p.y; const m = G.map;
    const w = m.warps && m.warps[key];
    if (w) {
      const go = () => { Audio8.sfx('door'); transition(() => this.enter(w.map, w.x, w.y, w.dir)); };
      if (w.script) runScript(function* () { return yield* SCRIPTS[w.script](); }, ok => { if (ok) go(); });
      else go();
      return;
    }
    if (m.triggers && m.triggers[key]) { const sc = m.triggers[key]; runScript(SCRIPTS[sc]); return; }
    const ch = this.tileAt(p.x, p.y);
    if (ch === '*' && m.set === 'tower') { healAll(); Audio8.sfx('heal'); G.flash = 12; G.banner = { text: '光に包まれ、全回復した', t: 90 }; }
    // random encounters
    if (m.enc && !G.debug.noEnc) {
      const mult = this.tdef(ch)[2] || 0; G.steps++;
      if (mult > 0 && G.steps > 5 && rnd() < mult / m.rate) {
        const ids = pick(FORMATIONS[m.enc(p.x, p.y)]);
        startBattle({ ids, music: 'battle' }, () => { });
      }
    }
  },
  interact() {
    const p = G.p; const [dx, dy] = DIRS[p.dir]; let tx = p.x + dx, ty = p.y + dy;
    let n = this.npcAt(tx, ty);
    if (!n && this.tileAt(tx, ty) === 'c' && G.map.set === 'inside') { n = this.npcAt(tx + dx, ty + dy); }
    if (n) {
      n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[p.dir]; n.timer = 120;
      runScript(SCRIPTS[n.d.talk]); return;
    }
    const key = tx + ',' + ty;
    if (G.map.chests && G.map.chests[key]) {
      const fk = `chest:${G.mapId}:${key}`;
      if (G.flags[fk]) { runScript(function* () { yield* say('宝箱は空っぽだ。'); }); return; }
      const c = G.map.chests[key]; G.flags[fk] = 1; Audio8.sfx('chest');
      let msg;
      if (c.gil) { G.gil += c.gil; msg = `${c.gil}ギルを手に入れた!`; }
      else { addItem(c.item, c.n || 1); msg = `${ITEMS[c.item].name}${c.n > 1 ? '×' + c.n : ''}を手に入れた!`; }
      runScript(function* () { yield* say('宝箱を開けた!\n' + msg); }); return;
    }
    if (G.map.signs && G.map.signs[key]) { const t = G.map.signs[key]; runScript(function* () { yield* say(t); }); }
  },
  updateNpcs() {
    for (const n of this.npcs) {
      if (n.mv) { n.mv -= 1; const [dx, dy] = DIRS[n.dir]; n.ox = -dx * n.mv; n.oy = -dy * n.mv; if (n.mv <= 0) { n.x = n.tx; n.y = n.ty; n.ox = n.oy = 0; } continue; }
      if (!n.d.wander || G.script || G.menu) continue;
      if (--n.timer > 0) continue;
      n.timer = 60 + Math.floor(rnd() * 150);
      const d = pick(['up', 'down', 'left', 'right']); const [dx, dy] = DIRS[d]; const nx = n.x + dx, ny = n.y + dy;
      n.dir = d;
      if (Math.abs(nx - n.d.x) > 3 || Math.abs(ny - n.d.y) > 3) continue;
      if (this.solid(nx, ny) || (nx === G.p.x && ny === G.p.y) || this.tileAt(nx, ny) === 'D' || (G.map.warps && G.map.warps[nx + ',' + ny])) continue;
      n.tx = nx; n.ty = ny; n.mv = 16; n.x = nx; n.y = ny; n.ox = -dx * 16; n.oy = -dy * 16;
      n.x = n.tx; n.y = n.ty;
    }
  },
  draw() {
    const m = G.map, p = G.p;
    const px_ = p.x * T + p.ox, py_ = p.y * T + p.oy;
    let cx = px_ + 8 - SW / 2, cy = py_ + 8 - SH / 2;
    cx = m.w * T <= SW ? (m.w * T - SW) / 2 : clamp(cx, 0, m.w * T - SW);
    cy = m.h * T <= SH ? (m.h * T - SH) / 2 : clamp(cy, 0, m.h * T - SH);
    if (G.shake > 0) { cx += (Math.random() - 0.5) * 6; }
    cx = Math.round(cx); cy = Math.round(cy);
    beginWorld(m.set === 'world' ? '#1d4f9a' : '#05050f');
    drawMapLayers(m, cx, cy);
    const t = G.frame; const fl = 0.85 + Math.sin(t / 5) * 0.08 + Math.sin(t / 3.3) * 0.05;
    if (m.set === 'inside') addLight(m.w * T / 2 - cx, m.h * T / 2 - cy - 8, 190, '#ffe2b0', 0.95);
    if (m.set === 'cave') addLight(px_ - cx + 8, py_ - cy + 6, 190, '#ffb868', fl);
    if (m.set === 'tower') addLight(px_ - cx + 8, py_ - cy + 6, 130, '#d8dcff', 0.55);
    // sprites
    const list = [];
    for (const n of this.npcs) { if (n.d.show && !n.d.show()) continue; list.push({ y: n.y * T + n.oy, draw: () => this.drawChar(n.d.pal, n.dir, n.mv ? ((G.frame >> 3) & 3) : 0, n.x * T + n.ox - cx, n.y * T + n.oy - cy) }); }
    const lead = G.party[0] ? G.party[0].id : 'allen';
    list.push({ y: py_, draw: () => this.drawChar(lead, p.dir, p.moving ? ((p.anim >> 2) & 3) : 0, px_ - cx, py_ - cy) });
    list.sort((a, b) => a.y - b.y).forEach(o => o.draw());
    CAM.x = cx; CAM.y = cy;
    postWorld(envFor(G.mapId, m.set));
    if (G.banner && !Shop.active && !G.menu) {
      const a = Math.min(1, G.banner.t / 20); const w = textW(G.banner.text, 9, 't') + 40;
      ctx.save(); ctx.globalAlpha = a;
      const g = ctx.createLinearGradient((SW - w) / 2, 0, (SW + w) / 2, 0); g.addColorStop(0, 'rgba(8,10,22,0)'); g.addColorStop(0.2, 'rgba(8,10,22,.75)'); g.addColorStop(0.8, 'rgba(8,10,22,.75)'); g.addColorStop(1, 'rgba(8,10,22,0)');
      ctx.fillStyle = g; ctx.fillRect((SW - w) / 2, 10, w, 20);
      ctx.fillStyle = 'rgba(216,183,112,.8)'; ctx.fillRect(SW / 2 - w * 0.3, 10, w * 0.6, 0.5); ctx.fillRect(SW / 2 - w * 0.3, 29.5, w * 0.6, 0.5);
      text(G.banner.text, SW / 2, 14, UI.gold, 9, 'center', 't'); ctx.restore();
    }
    if (G.menu) Menu.draw();
    if (Shop.active) Shop.draw();
    drawDialog();
  },
  drawChar(pal, dir, frame, x, y) {
    const s = SPR[pal]; if (!s) return;
    ctx.fillStyle = 'rgba(10,6,20,.32)'; ctx.beginPath(); ctx.ellipse(x + 9, y + 15, 6, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(s[dir][frame], x, y - 2);
  },
};

// ---------- transitions ----------
let transitionCb = null;
function transition(fn) { G.fadeTarget = 1; transitionCb = fn; }
function updateFade() {
  const sp = 1 / 12;
  if (G.fadeLevel < G.fadeTarget) G.fadeLevel = Math.min(G.fadeTarget, G.fadeLevel + sp);
  else if (G.fadeLevel > G.fadeTarget) G.fadeLevel = Math.max(G.fadeTarget, G.fadeLevel - sp);
  if (transitionCb && G.fadeLevel >= 1) { const cb = transitionCb; transitionCb = null; cb(); G.fadeTarget = 0; }
}
