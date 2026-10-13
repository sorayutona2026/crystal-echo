'use strict';
// ===== main: scenes, input handling, animation, loop, test hooks =====
const SAVE_KEY = 'starfall_tactics_save_v2';
function saveGame(ch, base) { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 2, ch, base: !!base, roster: G.roster, meta: G.meta })); G.hasSave = true; } catch (e) { } }
function loadGame() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === 2 && s.roster && s.meta && s.ch >= 0 && s.ch < CHAPTERS.length) return s; } catch (e) { } return null; }
function flushInput() { Input.q.length = 0; }
function* waitAct() { for (;;) { if (Input.q.length) return Input.q.shift(); yield 1; } }
function* waitOk() { // level-up popups etc.; with auto on they close by themselves after ~1s
  let n = 0;
  for (;;) { if (Input.q.length) { if (Input.q.shift() === 'ok') return; } else { n++; if (G.auto && n > 60) return; yield 1; } }
}
function savePrefs() { try { localStorage.setItem('starfall_tactics_prefs', JSON.stringify({ auto: G.auto, speedX: G.speedX, cutin: G.cutin, hd: G.hdUnits, cutActive: !!G.cut, cutin: G.cutin, hd: G.hdUnits })); } catch (e) { } }
function loadPrefs() { try { const p = JSON.parse(localStorage.getItem('starfall_tactics_prefs')); if (p) { G.auto = !!p.auto; G.speedX = p.speedX === 2 ? 2 : 1; if (p.cutin === false) G.cutin = false; G.hdUnits = p.hd !== false; } } catch (e) { } syncButtons(); }
function syncButtons() { const a = document.getElementById('bAuto'), sp = document.getElementById('bSpeed'); if (a) a.classList.toggle('on', G.auto); if (sp) sp.textContent = '速度 x' + G.speedX; }
function setAuto(v) { G.auto = v; syncButtons(); savePrefs(); Aud.sfx(v ? 'ok' : 'cancel'); }
// ---------- visual helpers ----------
function initVisual(S) { for (const u of S.units) { u.vx = u.x; u.vy = u.y; u.vhp = u.hp; u.ghost = u.hp; u.kx = 0; u.ky = 0; u.fade = 30; u.fading = false; u.gone = false; u.flash = 0; u.lx = 0; u.ly = 0; u.walking = false; u.dead = false; } }
function tilePx(x, y) { return { x: OX() + x * TS + 8, y: OY() + y * TS }; }
function numFx(u, textv, color, size) { const p = tilePx(u.vx, u.vy); G.fx.push({ kind: 'num', x: p.x, y: p.y - 4, vy: -0.45, life: 46, text: textv, color, size }); }
function burst(u, color, n) { const p = tilePx(u.vx, u.vy); for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = 0.6 + Math.random() * 1.4; G.fx.push({ kind: 'p', x: p.x, y: p.y + 8, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.5, g: 0.06, life: 18 + (Math.random() * 10 | 0), color, s: 2 }); } }
function sparkle(u) { const p = tilePx(u.vx, u.vy); for (let i = 0; i < 10; i++) G.fx.push({ kind: 'p', x: p.x - 6 + Math.random() * 12, y: p.y + 14, vx: 0, vy: -0.4 - Math.random() * 0.5, life: 24 + (Math.random() * 12 | 0), color: Math.random() < 0.5 ? '#7dffa0' : '#d8ffe0', s: 2 }); }
function dirOf(dx, dy) { return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); }
function* tweenHp(u, to, fr) { const from = u.vhp; for (let i = 1; i <= fr; i++) { u.vhp = from + (to - from) * i / fr; yield 1; } u.vhp = to; }
function* glide(u, path, sp) {
  u.walking = true;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i]; u.dir = dirOf(b.x - a.x, b.y - a.y);
    for (let f = 1; f <= sp; f++) { u.vx = a.x + (b.x - a.x) * f / sp; u.vy = a.y + (b.y - a.y) * f / sp; yield 1; }
    Aud.sfx('step');
  }
  u.walking = false; u.vx = u.x; u.vy = u.y;
}
function* banner(textv, color, sub) {
  G.banner = { text: textv, color, t: 0, dur: 54 }; Aud.sfx('banner');
  while (G.banner.t < G.banner.dur) { G.banner.t++; yield 1; }
  G.banner = null;
}
function cutinWanted(ev) { return G.cutin && !(G.auto && G.speedX > 1) && !ev.aoe && ART[artOf(ev.att)] && ART[artOf(ev.def)]; }
function weaponFxName(a) { const w = weaponOf(a), aw = a.wpn; return w.type === 'mag' ? 'rpg_1' : (aw === 'spear' || aw === 'gold') ? 'rpg_3' : aw === 'axe' ? 'rpg_5' : (aw === 'bow' || aw === 'dagger') ? 'rpg_10' : 'rpg_4'; }
// FE-style attack cut-in (about 0.75s; shortened under auto; any tap/key skips to the result)
function* cutin(ev, impact) {
  const short = G.auto, total = short ? 30 : 46, imp = short ? 11 : 16;
  const c = G.cut = { a: ev.att, d: ev.def, ev, t: 0, total, imp, fx: weaponFxName(ev.att), skip: false }; flushInput(); let done = false;
  for (c.t = 0; c.t < total; c.t++) {
    if (Input.q.length) { const k = Input.q.shift(); if (k === 'ok' || k === 'cancel') c.skip = true; }
    if (c.skip) { if (!done) { impact(); done = true; } break; }
    if (c.t === imp && !done) { impact(); done = true; }
    yield 1;
  }
  G.cut = null;
}
function* strike(ev) {
  const a = ev.att, d = ev.def, dx = d.x - a.x, dy = d.y - a.y, dd = Math.abs(dx) + Math.abs(dy), L = Math.hypot(dx, dy) || 1;
  a.dir = dirOf(dx, dy);
  const ranged = dd >= 2, wt = weaponOf(a).type;
  const impact = () => {
    if (ev.hit) {
      d.flash = 10; G.shake = ev.kill ? 10 : 4; Aud.sfx('hit'); burst(d, '#ffe9a0', 8);
      const cp = tilePx(d.vx, d.vy), cx = cp.x, cy = cp.y + 8, aw = a.wpn;
      if (!ev.aoe) { d.kx = dx / L * 3.5; d.ky = dy / L * 3.5; }
      if (ev.aoe) spawnSpr('rpg_1', cx, cy, { scale: 0.3, dur: 3, glow: 1 });
      else if (wt === 'mag') { spawnSpr('rpg_1', cx, cy, { scale: 0.34, dur: 3, glow: 1 }); if (a.spActive === 'meteor') spawnSpr('rpg_11', cx, cy - 4, { scale: 0.3, dur: 4 }); }
      else if (aw === 'spear' || aw === 'gold') spawnSpr('rpg_3', cx, cy, { scale: 0.34, dur: 3, flip: dx < 0 });
      else if (aw === 'bow') { spawnSpr('nin_5', cx, cy, { scale: 1, dur: 3 }); spawnSpr('rpg_10', cx, cy, { scale: 0.3, dur: 3, flip: dx < 0 }); }
      else if (aw === 'axe') spawnSpr('rpg_5', cx, cy, { scale: 0.3, dur: 3, flip: dx < 0 });
      else if (aw === 'dagger') spawnSpr('rpg_10', cx, cy, { scale: 0.32, dur: 3, flip: dx < 0 });
      else spawnSpr('rpg_4', cx, cy, { scale: 0.3, dur: 3, flip: dx < 0 });
      if (ev.kill) { spawnSpr('nin_18', cx, cy + 2, { scale: 1.3, dur: 4 }); G.flashW = 4; }
      if (ev.crit) { numFx(d, '必殺 ' + ev.dmg, '#ffd24a', 14); G.shake = 12; G.flashW = 3; } else numFx(d, String(ev.dmg), d.team === 0 ? '#ff7070' : '#fff', ev.dmg >= 10 ? 13 : 11);
      Co.run(tweenHp(d, ev.hpAfter, 16));
    } else { Aud.sfx('miss'); numFx(d, 'MISS', '#c8d0ff', 9); }
  };
  const useCut = G.cutNext && cutinWanted(ev); if (useCut) G.cutNext = false;
  if (useCut) { yield* cutin(ev, impact); }
  else if (ranged) {
    const p0 = tilePx(a.vx, a.vy), p1 = tilePx(d.vx, d.vy);
    for (let f = 0; f < 22; f++) {
      const k = Math.sin(Math.PI * Math.min(1, f / 10)); a.lx = -dx / L * 2 * k; a.ly = -dy / L * 2 * k;
      if (f === 4 && wt === 'mag') spawnSpr('rpg_9', p0.x, p0.y + 8, { vx: (p1.x - p0.x) / 8, vy: (p1.y - p0.y) / 8, life: 8, scale: 0.28, dur: 2, rot: Math.atan2(p1.y - p0.y, p1.x - p0.x) + Math.PI, glow: 1 });
      if (f >= 4 && f < 12 && wt !== 'mag') { const q = (f - 4) / 8; G.fx.push({ kind: 'p', x: p0.x + (p1.x - p0.x) * q - 1, y: p0.y + 8 + (p1.y - p0.y) * q - 1, life: 5, color: wt === 'mag' ? (q % 0.25 < 0.12 ? '#ff9050' : '#ffe060') : '#f4f0d8', s: wt === 'mag' ? 4 : 3 }); }
      if (f === 12) impact();
      yield 1;
    }
  } else {
    for (let f = 0; f < 15; f++) { const k = Math.sin(Math.PI * Math.min(1, f / 12)); a.lx = dx / L * 8 * k; a.ly = dy / L * 8 * k; if (f === 5) impact(); yield 1; }
  }
  a.lx = a.ly = 0;
  yield (useCut ? 3 : 10);
  if (ev.kill) { Aud.sfx('kill'); d.fading = true; yield 30; } else yield 4;
}
function* playRecord(rec, fast) {
  const u = rec.unit; u.acting = true;
  if (rec.path && rec.path.length > 1) yield* glide(u, rec.path, fast ? 3 : 4);
  if (rec.chest) { Aud.sfx('levelup'); const c = rec.chest; numFx(u, c.item === 'proof' ? '勇者の証!' : '+' + c.gold + 'G', '#ffe27a', 11); burst(u, '#ffe27a', 12); yield 24; }
  if (rec.kind === 'escape') { Aud.sfx('heal'); numFx(u, '離脱!', '#8fffb0', 10); sparkle(u); yield 16; u.gone = true; u.acting = false; return; }
  if (rec.kind === 'talk' && rec.target) { Aud.sfx('levelup'); numFx(rec.target, '仲間に!', '#ffe27a', 10); sparkle(rec.target); yield 22; }
  if (rec.kind === 'item') { numFx(u, rec.itemName, '#9fe8ff', 8); yield 8; }
  if (rec.sp) { Aud.sfx('levelup'); numFx(u, SP[u.key].name + '!', '#ffd24a', 10); burst(u, '#ffd24a', 12); { const up = tilePx(u.vx, u.vy); spawnSpr('rpg_12', up.x, up.y + 6, { scale: 0.28, dur: 3, glow: 1 }); } yield 22; }
  if (rec.buffed.length) { for (const a of rec.buffed) { sparkle(a); numFx(a, '攻撃+2', '#ffb050', 8); } Aud.sfx('heal'); yield 30; }
  if (rec.target && !rec.unit.dead) { u.dir = dirOf(rec.target.x - u.x, rec.target.y - u.y); }
  G.cutNext = rec.kind === 'attack';
  for (const ev of rec.events) {
    if (ev.type === 'heal') {
      Aud.sfx('heal'); sparkle(ev.def); { const hp = tilePx(ev.def.vx, ev.def.vy); spawnSpr('rpg_7', hp.x, hp.y + 6, { scale: 0.42, dur: 3 }); if (rec.sp === 'pray') spawnSpr('rpg_12', hp.x, hp.y + 6, { scale: 0.22, dur: 3, glow: 1 }); } numFx(ev.def, '+' + ev.dmg, '#6dff8d', 11); yield* tweenHp(ev.def, ev.hpAfter, 20); yield 14;
    } else yield* strike(ev);
  }
  G.cutNext = false;
  for (const x of rec.exp) {
    if (x.unit.dead) continue;
    numFx(x.unit, 'EXP+' + x.n, '#8fe8ff', 8); yield 14;
    if (x.up) { Aud.sfx('levelup'); G.lvl = { unit: x.unit, up: x.up }; yield* waitOk(); G.lvl = null; flushInput(); Aud.sfx('ok'); }
  }
  u.walking = false; u.acting = false;
}
// ---------- battle input ----------
function inputReady() { return G.scene === 'battle' && !G.auto && G.phase === 0 && !G.endTurn && !G.busy && !G.banner && !G.lvl && !!G.S && !G.S.over; }
function moveCursor(dx, dy) { const S = G.S, c = G.cursor; c.x = Math.max(0, Math.min(S.w - 1, c.x + dx)); c.y = Math.max(0, Math.min(S.h - 1, c.y + dy)); Aud.sfx('move'); }
function openMenu(items, x, y, w) { G.menu = { items, idx: Math.max(0, items.findIndex(i => !i.off)), x, y, w: w || 56 }; }
function selectUnit(u) {
  const S = G.S; G.sel = u; G.reach = reach(S, u); G.moveSet = new Set(G.reach.stops.map(s => kk(s.x, s.y))); G.threat = threatTiles(S, u, G.reach);
  G.orig = { x: u.x, y: u.y, dir: u.dir }; G.mode = 'move'; G.showRange = null; Aud.sfx('ok');
}
function deselect() { G.sub = false; G.healMode = false; G.pendingAtk = null; if (G.sel) G.sel.spActive = null; G.spMode = false; G.sel = null; G.reach = null; G.moveSet = null; G.threat = null; G.mode = 'idle'; G.targets = []; G.fc = null; G.menu = null; }
function runBusy(gen) { G.busy++; Co.run((function* () { try { yield* gen; } finally { G.busy--; flushInput(); } })()); }
function confirmMove() {
  const u = G.sel, c = G.cursor, S = G.S;
  if (!G.moveSet.has(kk(c.x, c.y))) { Aud.sfx('cancel'); return; }
  const path = pathTo(G.reach, c.x, c.y); Aud.sfx('ok'); G.mode = 'moving';
  runBusy((function* () { u.x = c.x; u.y = c.y; if (path.length > 1) yield* glide(u, path, 4); u.vx = u.x; u.vy = u.y; openActionMenu(); if (G.pendingAtk) { const e = G.pendingAtk; G.pendingAtk = null; quickAttack(e); } })());
}
function adjacentRecruit(S, u) { return u.key === 'leon' ? S.units.find(o => o.recruit && !o.dead && o.team === 2 && dist(o.x, o.y, u.x, u.y) === 1) || null : null; }
function openActionMenu() {
  const u = G.sel, S = G.S, items = []; G.sub = false;
  const t = targetsFrom(S, u, u.x, u.y);
  if (isHealer(u)) items.push({ label: '回復', off: !t.length, act: 'heal', desc: '隣の味方をHP回復(射程1)' });
  else { const w = weaponOf(u); items.push({ label: '攻撃', off: !t.length, act: 'attack', desc: w.name + ' 威力' + w.might + ' 射程' + w.min + (w.max > w.min ? '〜' + w.max : '') }); if (u.canHeal) items.push({ label: '回復', off: !healTargets(S, u, u.x, u.y).length, act: 'heal', desc: '隣の味方をHP回復(杖・射程1)' }); }
  const sp = SP[u.key], st = spTargets(S, u, u.x, u.y);
  if (sp && st) items.push({ label: sp.name, act: 'sp', off: !st.length, desc: sp.desc });
  if (u.items.length) items.push({ label: '道具', act: 'item', off: u.hp >= u.maxhp, desc: '傷薬などで自分を回復(' + u.items.map(k => ITEMS[k].name).join('・') + ')' });
  if (adjacentRecruit(S, u)) items.push({ label: '話す', act: 'talk', desc: '隣の人物に話しかける' });
  if (S.ch.win === 'escape' && isExit(S, u.x, u.y)) items.push({ label: '離脱', act: 'escape', desc: '出口から脱出する' });
  items.push({ label: '待機', act: 'wait', desc: '何もせず行動を終える' });
  placeMenu(items, u); G.mode = 'menu'; u.spActive = null; G.spMode = false; G.healMode = false;
}
function placeMenu(items, u) { // place the menu where it does not cover other units (so enemies stay tappable)
  const S = G.S, ts = tileScreen(u.x, u.y), tz = TS * Engine.zoom, mw = 50, mh = items.length * 14 + 8, vh = VH();
  const cands = [[ts.x + tz + 3, ts.y - 4], [ts.x - mw - 3, ts.y - 4], [ts.x - 4, ts.y + tz + 3], [ts.x - 4, ts.y - mh - 3], [ts.x + tz + 3, ts.y + tz - mh + 4], [ts.x - mw - 3, ts.y + tz - mh + 4]];
  const others = alive(S).filter(o => o !== u).map(o => tileScreen(o.x, o.y));
  const fits = c => c[0] >= 2 && c[0] + mw <= W - 2 && c[1] >= 2 && c[1] + mh <= vh - 2 && !others.some(o => c[0] < o.x + tz && o.x < c[0] + mw && c[1] < o.y + tz && o.y < c[1] + mh);
  let pick = cands.find(fits) || cands[0]; let mx = Math.max(2, Math.min(W - mw - 2, pick[0])), my = Math.max(2, Math.min(vh - mh - 2, pick[1]));
  openMenu(items, mx, my, 50);
}
function undoMove() {
  const u = G.sel, o = G.orig; u.x = o.x; u.y = o.y; u.vx = o.x; u.vy = o.y; u.dir = o.dir; G.menu = null; G.mode = 'move'; Aud.sfx('cancel');
}
function afterAction() {
  const S = G.S; const c = G.sel ? { x: G.sel.x, y: G.sel.y } : G.cursor; deselect(); G.cursor = { x: c.x, y: c.y };
  if (!S.over && !alive(S).some(u => u.team === 0 && !u.acted)) G.endTurn = true;
}
function doAction(kind, extra) {
  const u = G.sel, S = G.S;
  if (kind === 'wait') { Aud.sfx('ok'); const rec = applyAction(S, u, null, null); u.dir = u.dir; afterAction(); return; }
  if (kind === 'escape' || kind === 'item' || kind === 'talk') {
    Aud.sfx('ok'); G.mode = 'busy'; G.menu = null; const tg = kind === 'talk' ? adjacentRecruit(S, u) : null;
    runBusy((function* () {
      if (kind === 'talk' && tg) yield* dialogue(S.ch.recruit.lines, null, true);
      const rec = applyAction(S, u, null, tg, false, kind === 'escape' ? { escape: true } : kind === 'talk' ? { talk: true } : { item: extra });
      yield* playRecord(rec); afterAction(); if (G.endTurn) yield 12;
    })()); return;
  }
  const target = G.targets[G.ti], spm = kind === 'sp' || G.spMode, hm = G.healMode; Aud.sfx('ok'); G.mode = 'busy'; G.menu = null;
  runBusy((function* () { const rec = applyAction(S, u, null, target, spm, hm ? { heal: true } : null); G.fc = null; yield* playRecord(rec); afterAction(); if (G.endTurn) yield 12; })());
}
function menuPick() {
  const m = G.menu, it = m.items[m.idx];
  if (it.off) { Aud.sfx('cancel'); return; }
  if (G.mode === 'sysmenu') { it.fn(); return; }
  if (it.act === 'wait') { G.menu = null; doAction('wait'); return; }
  if (it.act === 'escape' || it.act === 'talk') { doAction(it.act); return; }
  if (it.act === 'useitem') { doAction('item', it.idx); return; }
  if (it.act === 'item') { const u = G.sel; G.sub = true; placeMenu(u.items.map((id, i) => ({ label: ITEMS[id].name, act: 'useitem', idx: i, desc: ITEMS[id].desc })), u); Aud.sfx('ok'); return; }
  if (it.act === 'sp') {
    const k = SP[G.sel.key].kind;
    if (k === 'buff' || k === 'pray') { G.menu = null; doAction('sp'); return; }
    G.spMode = true; G.sel.spActive = k;
  }
  if (it.act === 'heal' && !isHealer(G.sel)) { G.sel.spActive = 'heal'; G.healMode = true; }
  G.targets = targetsFrom(G.S, G.sel, G.sel.x, G.sel.y).sort((a, b) => a.y - b.y || a.x - b.x); G.ti = 0; G.cursor = { x: G.targets[0].x, y: G.targets[0].y }; G.menu = null; G.mode = 'target'; Aud.sfx('ok');
}
const hdLabel = () => G.hdUnits ? 'チビ' : 'ドット';
function openSys() {
  const mk = () => [
    { label: 'ターン終了', fn: () => { G.menu = null; G.mode = 'idle'; G.endTurn = true; Aud.sfx('ok'); } },
    { label: '戦闘アニメ ' + (G.cutin ? 'ON' : 'OFF'), desc: '攻撃のカットイン演出(タップで飛ばせる)', name: '戦闘アニメ', fn: () => { G.cutin = !G.cutin; savePrefs(); G.menu.items[1].label = '戦闘アニメ ' + (G.cutin ? 'ON' : 'OFF'); Aud.sfx('ok'); } },
    { label: '表示 ' + hdLabel(), desc: 'マップ上のユニット: チビ(イラスト) / ドット', name: 'ユニット表示', fn: () => { G.hdUnits = !G.hdUnits; savePrefs(); G.menu.items[2].label = '表示 ' + hdLabel(); Aud.sfx('ok'); } },
    { label: 'とじる', fn: () => { G.menu = null; G.mode = 'idle'; Aud.sfx('cancel'); } }];
  openMenu(mk(), 100, 70, 120); G.mode = 'sysmenu'; Aud.sfx('ok');
}
function battleInput(a) {
  const S = G.S, c = G.cursor;
  if (a === 'info') { G.infoBig = !G.infoBig; return; }
  if (G.infoBig && (a === 'ok' || a === 'cancel')) { G.infoBig = false; return; }
  const dv = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[a];
  switch (G.mode) {
    case 'idle':
      if (dv) moveCursor(dv[0], dv[1]);
      else if (a === 'ok') { const u = unitAt(S, c.x, c.y); if (u && u.team === 0 && !u.acted) selectUnit(u); else if (u) { G.showRange = G.showRange === u ? null : u; Aud.sfx('ok'); } else openSys(); }
      else if (a === 'cancel') G.showRange = null;
      else if (a === 'end') openSys();
      break;
    case 'move':
      if (dv) moveCursor(dv[0], dv[1]); else if (a === 'ok') confirmMove(); else if (a === 'cancel') { const u = G.sel; deselect(); G.cursor = { x: u.x, y: u.y }; Aud.sfx('cancel'); }
      break;
    case 'menu': case 'sysmenu': {
      const m = G.menu;
      if (a === 'up') { m.idx = (m.idx + m.items.length - 1) % m.items.length; Aud.sfx('move'); }
      else if (a === 'down') { m.idx = (m.idx + 1) % m.items.length; Aud.sfx('move'); }
      else if (a === 'ok') menuPick();
      else if (a === 'cancel') { if (G.mode === 'sysmenu') { G.menu = null; G.mode = 'idle'; Aud.sfx('cancel'); } else if (G.sub) { Aud.sfx('cancel'); openActionMenu(); } else undoMove(); }
      break; }
    case 'target':
      if (a === 'left' || a === 'up') { G.ti = (G.ti + G.targets.length - 1) % G.targets.length; Aud.sfx('move'); }
      else if (a === 'right' || a === 'down') { G.ti = (G.ti + 1) % G.targets.length; Aud.sfx('move'); }
      else if (a === 'ok') {
        if (isHealer(G.sel)) { doAction('attack'); break; }
        G.fc = forecast(S, G.sel, G.targets[G.ti], G.sel.x, G.sel.y); G.fc.top = tileScreen(0, (G.sel.y + G.targets[G.ti].y) / 2).y + TS * Engine.zoom / 2 > VH() / 2; G.mode = 'forecast'; Aud.sfx('ok');
      } else if (a === 'cancel') { G.cursor = { x: G.sel.x, y: G.sel.y }; openActionMenu(); Aud.sfx('cancel'); break; }
      { const t = G.targets[G.ti]; if (t) G.cursor = { x: t.x, y: t.y }; }
      break;
    case 'forecast':
      if (a === 'ok') doAction('attack'); else if (a === 'cancel') { G.mode = 'target'; G.fc = null; Aud.sfx('cancel'); }
      break;
  }
}
// tapping an enemy directly: open the forecast for it when the selected hero can already reach it
function quickAttack(e) {
  if (!G.menu) return false; const k = G.menu.items.findIndex(i => (i.act === 'attack' || i.act === 'heal') && !i.off); if (k < 0) return false;
  G.menu.idx = k; menuPick(); const i = G.targets.indexOf(e); if (i < 0) { openActionMenu(); return false; }
  G.ti = i; G.cursor = { x: e.x, y: e.y }; battleInput('ok'); return true;
}
function tapMap(px, py) {
  if (!G.S) return;
  const z = Engine.zoom, tx = Math.floor((px / z + Cam.x - OX()) / TS), ty = Math.floor((py / z + Cam.y - OY()) / TS);
  if (G.mode === 'forecast') { const t = G.targets[G.ti]; Input.q.push(t && t.x === tx && t.y === ty ? 'ok' : 'cancel'); return; } // tap the target again = confirm
  if (G.mode === 'menu') { const e = inb(G.S, tx, ty) && unitAt(G.S, tx, ty); if (e && e.team !== 0 && quickAttack(e)) return; Input.q.push('cancel'); return; }
  if (G.mode === 'sysmenu') { Input.q.push('cancel'); return; }
  if (!inb(G.S, tx, ty)) return;
  const S = G.S, u = unitAt(S, tx, ty);
  if (G.mode === 'target') { const i = G.targets.findIndex(t => t.x === tx && t.y === ty); if (i >= 0) { G.ti = i; G.cursor = { x: tx, y: ty }; Input.q.push('ok'); } return; }
  G.cursor = { x: tx, y: ty };
  if (G.mode === 'idle') { if (u) Input.q.push('ok'); }
  else if (G.mode === 'move') {
    if (G.moveSet.has(kk(tx, ty))) Input.q.push('ok');
    else if (u && u.team !== 0 && targetsFrom(S, G.sel, G.sel.x, G.sel.y).includes(u)) { G.cursor = { x: G.sel.x, y: G.sel.y }; G.pendingAtk = u; confirmMove(); } // enemy already in range: stay and attack
  }
}
function pumpTaps() {
  for (const t of Input.taps) {
    if (G.cut) { G.cut.skip = true; continue; }
    if (G.scene === 'intro') { Input.q.push('ok'); continue; }
    if (G.dlg && G.scene === 'battle') { Input.q.push('ok'); continue; }
    const r = Touch.hit(t.x, t.y);
    if (r) { r.fn(); continue; }
    if (G.scene === 'battle' && G.auto) { setAuto(false); continue; } // a tap on the field stops auto (after the current action)
    if (G.scene === 'battle') { if (G.lvl || G.banner) { if (G.lvl) Input.q.push('ok'); } else if (!G.busy) tapMap(t.x, t.y); }
    else if (G.scene !== 'base') Input.q.push('ok');
  }
  Input.taps.length = 0;
  for (let i = Input.q.length - 1; i >= 0; i--) {
    const k = Input.q[i];
    if (k === 'mute') { Input.q.splice(i, 1); Aud.toggle(); }
    else if (k === 'auto') { Input.q.splice(i, 1); if (G.scene === 'battle' || G.scene === 'dialogue' || G.scene === 'title' || G.scene === 'base') setAuto(!G.auto); }
    else if (k === 'speed') { Input.q.splice(i, 1); G.speedX = G.speedX === 1 ? 2 : 1; syncButtons(); savePrefs(); Aud.sfx('ok'); }
    else if (k === 'cancel' && G.auto && G.scene === 'battle') { Input.q.splice(i, 1); setAuto(false); }
  }
}
// ---------- scenes ----------
function* dialogue(lines, bg, overlay) {
  if (!overlay) G.scene = 'dialogue'; flushInput();
  for (const line of lines) {
    G.dlg = { line, bg, n: 0, tip: line[0] === null && !overlay }; let wait = 0;
    for (;;) {
      if (G.dlg.n < line[1].length) G.dlg.n++; else if (G.auto) wait++;
      yield 1;
      const a = Input.q.shift();
      if (a === 'ok' || (G.auto && wait > 70)) { if (G.dlg.n < line[1].length) G.dlg.n = line[1].length; else { Aud.sfx('move'); break; } }
    }
  }
  G.dlg = null;
}
function* chapterCard(idx) {
  G.scene = 'card'; flushInput(); const ch = CHAPTERS[idx];
  G.card = { idx, title: ch.title, name: ch.name, goal: ch.goal, bg: ch.bg, t: 0, dur: 150 };
  Aud.bgm('title');
  while (G.card.t < G.card.dur) { G.card.t++; yield 1; if (Input.q.shift() === 'ok' && G.card.t > 30) break; }
  G.card = null;
}
function* bossIntro() {
  G.scene = 'intro'; flushInput(); Aud.bgm('boss'); G.intro = { t: 0 };
  while (G.intro.t < 130) { G.intro.t++; yield 1; if (Input.q.shift() === 'ok' && G.intro.t > 20) break; }
  G.intro = null;
}
function* titleScene() {
  G.scene = 'title'; flushInput(); Aud.bgm('title'); const items = [{ label: 'はじめから' }, { label: 'つづきから', off: !loadGame() }]; G.title = { idx: 0, items }; G.S = null;
  for (;;) {
    if (G.jump) return 'jump';
    const a = Input.q.shift();
    if (a === 'up' || a === 'down') { G.title.idx = (G.title.idx + 1) % items.length; Aud.sfx('move'); }
    else if (a === 'ok') { if (items[G.title.idx].off) { Aud.sfx('cancel'); } else { Aud.sfx('ok'); return G.title.idx === 0 ? 'new' : 'continue'; } }
    yield 1;
  }
}
function* gameOverScene(canCamp) {
  G.scene = 'gameover'; flushInput(); Aud.bgm('lose'); const items = [{ label: 'この章をやり直す', id: 'retry' }]; if (canCamp) items.push({ label: '野営地で整えてから', id: 'camp' }); items.push({ label: 'タイトルへ', id: 'title' }); G.title = { idx: 0, items };
  for (;;) {
    const a = Input.q.shift(); const n = items.length;
    if (a === 'up') { G.title.idx = (G.title.idx + n - 1) % n; Aud.sfx('move'); } else if (a === 'down') { G.title.idx = (G.title.idx + 1) % n; Aud.sfx('move'); }
    else if (a === 'ok') { Aud.sfx('ok'); return items[G.title.idx].id; }
    yield 1;
  }
}
function* endingScene() {
  G.scene = 'ending'; flushInput(); Aud.bgm('end'); G.ending = { t: 0 };
  for (;;) { G.ending.t++; yield 1; const a = Input.q.shift(); if (a === 'ok' && G.ending.t > 380) break; }
  G.ending = null;
}
// auto play: one action chosen by the same AI as the test bot, played with visible selection, move and attack
function* autoStep() {
  const S = G.S;
  if (G.mode !== 'idle') { if (G.sel && G.orig) { const u = G.sel; u.x = G.orig.x; u.y = G.orig.y; u.vx = u.x; u.vy = u.y; } deselect(); G.mode = 'idle'; yield 6; }
  const sug = suggestAction(S);
  if (!sug) { G.endTurn = true; yield 20; return; }
  G.busy++;
  try {
    const u = sug.unit; G.cursor = { x: u.x, y: u.y }; yield 14; selectUnit(u); yield 16;
    if (sug.dest.x !== u.x || sug.dest.y !== u.y) {
      G.cursor = { x: sug.dest.x, y: sug.dest.y }; yield 14;
      const path = pathTo(G.reach, sug.dest.x, sug.dest.y); G.mode = 'moving'; u.x = sug.dest.x; u.y = sug.dest.y; yield* glide(u, path, 4); u.vx = u.x; u.vy = u.y;
    }
    if (sug.target) { G.cursor = { x: sug.target.x, y: sug.target.y }; yield 16; }
    G.menu = null; G.mode = 'busy';
    if (sug.kind === 'talk' && S.ch.recruit) yield* dialogue(S.ch.recruit.lines, null, true);
    const rec = applyAction(S, u, null, sug.target, sug.sp, sug.opt);
    yield* playRecord(rec);
    afterAction();
  } finally { G.busy--; flushInput(); }
  yield 8;
}
function* enemyPhase() {
  const S = G.S; G.phase = 1; S.phase = 1; G.mode = 'busy'; Aud.bgm(S.ch.win === 'boss' ? 'boss' : 'enemy');
  yield* banner('敵軍フェーズ', '#a02828');
  yield* healRecords(startPhase(S, 1));
  for (const e of alive(S).filter(u => u.team === 1)) {
    if (S.over || e.dead) continue;
    const a = chooseAction(S, e, {});
    if (!a.target && a.dest.x === e.x && a.dest.y === e.y) continue;
    G.cursor = { x: e.x, y: e.y }; yield 6;
    const rec = applyAction(S, e, a.dest, a.target);
    G.cursor = { x: a.dest.x, y: a.dest.y };
    yield* playRecord(rec, true);
    yield 5;
  }
}
function* healRecords(list) { for (const h of list) { Aud.sfx('heal'); sparkle(h.unit); numFx(h.unit, '+' + h.amt, '#6dff8d', 10); Co.run(tweenHp(h.unit, h.unit.hp, 20)); } if (list.length) yield 40; }
function* battleTalk(t) { S_talk(t); G.busy++; try { yield* dialogue(t.lines, null, true); } finally { G.busy--; flushInput(); } }
function S_talk(t) { G.S.talked[t.id] = true; }
function* battleScene(S, idx) {
  G.S = S; G.scene = 'battle'; G.phase = 0; G.mode = 'idle'; G.fx = []; G.endTurn = false; G.over = null; G.showRange = null; G.infoBig = false; G.lvl = null; G.dlg = null; G.why = '';
  Cam.snap = true; Cam.key = null; initVisual(S); const leon = S.units.find(u => u.key === 'leon'); G.cursor = { x: leon.x, y: leon.y };
  for (;;) {
    G.phase = 0; S.phase = 0; Aud.bgm('field'); G.mode = 'idle'; G.endTurn = false; flushInput();
    yield* banner('自軍フェーズ', '#2a5ac8');
    yield* healRecords(startPhase(S, 0));
    while (!G.endTurn && !S.over) {
      if (!G.busy && !G.banner && !G.lvl && !G.dlg && (G.mode === 'idle' || G.auto)) { const t = nextTalk(S); if (t) { yield* battleTalk(t); continue; } }
      if (G.auto && !G.busy && !G.banner && !G.lvl && !G.dlg) yield* autoStep(); else yield 1;
    }
    if (S.over) break;
    deselect(); G.mode = 'busy';
    for (const b of endPlayerPhase(S)) if (b.up) { Aud.sfx('levelup'); numFx(b.a, '絆 ' + BOND_RANK[b.up], '#ff9fc0', 9); numFx(b.b, '絆 ' + BOND_RANK[b.up], '#ff9fc0', 9); }
    yield* enemyPhase(); if (S.over) break;
    S.turn++; checkOver(S); if (S.over) break;
  }
  while (G.busy > 0) yield 1; // let the final action animation (and any level-up popup) finish
  deselect(); G.mode = 'busy'; G.busy++; G.why = S.why;
  if (S.over === 'win') { Aud.bgm('win'); yield 20; yield* banner('勝利!', '#2a7a3a'); yield 20; G.busy--; return 'win'; }
  yield 30; G.busy--; return 'lose';
}
function* resultScene(sum, idx) {
  const lines = [[null, '戦利品: ' + (sum.gold + sum.reward) + 'G (撃破・宝箱 ' + sum.gold + 'G + 章クリア ' + sum.reward + 'G)' + (sum.proofs ? ' と勇者の証' : '')]];
  for (const id of sum.injured) lines.push([null, G.roster[id].name + 'は負傷した。次の章は休むことになる。']);
  for (const id of sum.healed) lines.push([null, G.roster[id].name + 'の傷が癒えた。']);
  yield* dialogue(lines, CHAPTERS[idx].bg);
}
function jumpSetup(idx, camp) { // test/debug: start chapter idx with a plausible party
  for (let i = 0; i <= idx; i++) prepareChapter(G.roster, G.meta, i);
  for (const id in G.roster) { const u = G.roster[id]; u.joined = true; const want = 1 + 2 * idx; while (u.lv < want) { u.lv++; for (const k of STATS) { if (k === 'hp') { u.maxhp += 2; u.hp = u.maxhp; } else if (HEROES[u.key].gr[k] > 40) u[k]++; } } }
  G.meta.cleared = idx; G.meta.gold += 400 * idx; G.meta.proofs += idx >= 4 ? 2 : 0; if (camp) autoCamp(G.roster, G.meta, idx);
}
function* flow() {
  for (;;) {
    const r = yield* titleScene(); let idx = 0, skip = false, needBase = false;
    G.roster = newRoster(); G.meta = newMeta(); G.why = '';
    if (r === 'continue') { const s = loadGame(); if (s) { G.roster = s.roster; G.meta = s.meta; idx = s.ch; needBase = !!s.base; } }
    if (r === 'jump' && G.jump.ending) { G.jump = null; G.roster = newRoster(); G.meta = newMeta(); yield* endingScene(); continue; }
    if (r === 'jump') { idx = G.jump.ch; skip = true; needBase = !!G.jump.base; if (idx > 0) jumpSetup(idx, !needBase); G.jump = null; }
    let toTitle = false;
    for (; idx < CHAPTERS.length && !toTitle;) {
      const ch = CHAPTERS[idx]; G.chIdx = idx;
      if (needBase) { const b = yield* baseScene(idx); if (b === 'title') { toTitle = true; break; } }
      needBase = false;
      if (!skip) { yield* chapterCard(idx); if (ch.intro) yield* bossIntro(); Aud.bgm('title'); yield* dialogue(ch.pre, ch.bg); }
      skip = false;
      let result;
      for (;;) {
        G.snap = { roster: cloneRoster(G.roster), meta: JSON.parse(JSON.stringify(G.meta)) }; if (idx === 0) saveGame(0, false);
        const S = prepareChapter(G.roster, G.meta, idx);
        result = yield* battleScene(S, idx);
        if (result === 'win') break;
        const c = yield* gameOverScene(idx > 0);
        G.roster = G.snap.roster; G.meta = G.snap.meta;
        if (c === 'title') { toTitle = true; break; }
        if (c === 'camp') { const b = yield* baseScene(idx); if (b === 'title') { toTitle = true; break; } }
      }
      if (toTitle) break;
      const bonus = chapterBonus(G.roster, G.S), sum = finishChapter(G.roster, G.meta, G.S, idx);
      G.scene = 'battle'; G.mode = 'busy'; G.busy++;
      for (const x of bonus) { Aud.sfx('levelup'); G.lvl = { unit: x.unit, up: x.up }; yield* waitOk(); G.lvl = null; flushInput(); }
      G.busy--;
      if (sum.late.length && ch.recruit && sum.late.includes(ch.recruit.id)) yield* dialogue(ch.recruit.late, ch.bg);
      yield* dialogue(ch.post, ch.bg);
      yield* resultScene(sum, idx);
      idx++; needBase = true;
      if (idx < CHAPTERS.length) saveGame(idx, true);
    }
    if (!toTitle) yield* endingScene();
  }
}
// ---------- loop ----------
function step() {
  pumpTaps();
  if (G.scene === 'battle') { while (Input.q.length && inputReady()) battleInput(Input.q.shift()); if (!inputReady() && !G.lvl && !G.dlg) Input.q.length = 0; }
  Co.tick(); stepFx(); camUpdate(); G.t++;
}
function render() {
  HD.collect = true; HD.holes.length = 0; HD.ui.length = 0; G.bgReq = null; G.paintReq = false;
  { const bm = Engine.port && G.scene === 'battle'; if (bm !== Engine.battleMode || !Engine.fitted) { Engine.battleMode = bm; Engine.fitted = true; fit(); Cam.snap = true; Cam.key = null; } }
  G.yOff = (Engine.port && !Engine.battleMode && Engine.vh > H && G.scene !== 'base') ? (Engine.vh - H) / 2 : 0;
  ctx.setTransform(K, 0, 0, K, 0, 0); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, Engine.vh);
  if (G.yOff) ctx.translate(0, G.yOff);
  switch (G.scene) {
    case 'title': drawTitle(); break;
    case 'card': drawCard(); break;
    case 'intro': drawIntro(); break;
    case 'dialogue': drawDialogue(); break;
    case 'battle': drawBattle(); break;
    case 'gameover': drawGameOver(); break;
    case 'ending': drawEnding(); break;
    case 'base': drawBase(); break;
    default: rect(0, 0, W, H, '#000'); text('読み込み中…', W / 2, 110, { align: 'center' });
  }
  if (Engine.port && G.scene === 'battle') drawInfoCanvas(); else if (Engine.port) { const c = cv2.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#0b0b14'; c.fillRect(0, 0, cv2.width, cv2.height); }
  hdRender(); bgRender();
  Touch.flip();
}
let _last = 0, _acc = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  const dt = Math.min(100, ts - _last); _last = ts; _acc += dt;
  while (_acc >= 1000 / 60) { const n = G.speed * (G.scene === 'battle' ? G.speedX : 1); for (let i = 0; i < n; i++) step(); _acc -= 1000 / 60; }
  render();
}
window.__tac = {
  seed: n => seedRng(n), speed: n => { G.speed = n; }, step: n => { for (let i = 0; i < n; i++) step(); render(); },
  talk: (who, txt, bg) => { G.scene = 'dialogue'; G.dlg = { line: [who, txt], bg: bg || 0, n: txt.length, tip: false }; },
  showIntro: t => { G.scene = 'intro'; G.intro = { t: t || 70 }; },
  setAuto: v => setAuto(v), setCutin: v => { G.cutin = !!v; savePrefs(); }, setHD: v => { G.hdUnits = v === 'auto' ? true : !!v; savePrefs(); },
  start: (ch, base) => { G.jump = ch === 'ending' ? { ending: true } : { ch: ch || 0, base: !!base }; },
  campAuto: () => { if (G.scene === 'base') { autoCamp(G.roster, G.meta, Base.chIdx); baseToast('おまかせで整えました'); } }, campGo: () => { if (G.scene === 'base') Base.go = true; },
  roster: () => JSON.parse(JSON.stringify({ roster: G.roster, meta: G.meta })), give: (gold, proofs) => { if (G.meta) { G.meta.gold += gold || 0; G.meta.proofs += proofs || 0; } },
  bond: (a, b, n) => { if (G.meta) G.meta.bonds[bondKey(a, b)] = n; }, ready2: () => !!G.dlg,
  setLv: (id, lv) => { const u = G.roster && G.roster[id]; if (u) { u.lv = lv; } },
  hurt: (id, hp) => { const u = G.S && G.S.units.find(q => q.id === id || q.key === id); if (u) { u.hp = hp; u.vhp = hp; u.ghost = hp; } },
  place: (id, x, y) => { const u = G.S && G.S.units.find(q => q.id === id || q.key === id); if (u) { u.x = x; u.y = y; u.vx = x; u.vy = y; } },
  kill: key => { const u = G.S && G.S.units.find(x => x.key === key); if (u) { u.hp = 0; u.dead = true; u.gone = true; checkOver(G.S); } },
  setExp: (id, n) => { if (G.roster && G.roster[id]) G.roster[id].exp = n; },
  ready: () => (G.scene === 'battle' ? inputReady() : (G.scene !== 'boot' && !G.banner)),
  state() {
    const S = G.S;
    return {
      scene: G.scene, dlg: !!G.dlg, gold: G.meta ? G.meta.gold : 0, base: G.scene === 'base' ? { depth: Base.stack.length, title: curView().v.title, rows: allRows(curView().v, curView().e).map(r => r.t), idx: curView().e.idx, geom: Base.geom } : null, auto: G.auto, speedX: G.speedX, cutin: G.cutin, hd: G.hdUnits, cutActive: !!G.cut, mode: G.mode, busy: G.busy, banner: !!G.banner, lvl: !!G.lvl, endTurn: G.endTurn, phase: G.phase, chapter: G.chIdx, ready: this.ready(),
      cursor: { x: G.cursor.x, y: G.cursor.y }, menu: G.menu ? { x: G.menu.x, y: G.menu.y, w: G.menu.w, items: G.menu.items.map(i => ({ label: i.label, off: !!i.off })), idx: G.menu.idx } : null,
      title: G.scene === 'title' || G.scene === 'gameover' ? { idx: G.title.idx, items: G.title.items.map(i => i.label) } : null,
      over: S ? S.over : null, turn: S ? S.turn : 0, ox: S ? (OX() - Cam.x) * Engine.zoom : 0, oy: S ? (OY() - Cam.y) * Engine.zoom : 0, tile: TS * Engine.zoom, zoom: Engine.zoom, vh: Engine.vh, yoff: G.yOff || 0, w: S ? S.w : 0, h: S ? S.h : 0, chIdx: G.chIdx,
      targets: (G.targets || []).map(t => t.id), ti: G.ti,
      units: S ? S.units.filter(u => !u.dead && !u.off).map(u => ({ id: u.id, key: u.key, name: u.name, team: u.team, x: u.x, y: u.y, hp: u.hp, maxhp: u.maxhp, lv: u.lv, exp: u.exp, acted: !!u.acted, boss: u.boss })) : []
    };
  },
  suggest() {
    const S = G.S; if (!S || G.scene !== 'battle') return null;
    const a = suggestAction(S); if (!a) return { end: true };
    return { unit: a.unit.id, dest: a.dest, target: a.target ? a.target.id : null, kind: a.kind, sp: !!a.sp, spLabel: a.sp ? SP[a.unit.key].name : null, from: { x: a.unit.x, y: a.unit.y }, opt: a.opt || null };
  }
};
window.addEventListener('load', () => {
  initCanvas(); initInput();
  const q = new URLSearchParams(location.search).get('seed'); seedRng(q ? +q : (Math.random() * 1e9) | 0);
  try { G.hasSave = !!loadGame(); } catch (e) { }
  loadPrefs();
  render();
  loadAssets().then(() => { Co.run(flow()); requestAnimationFrame(frame); }).catch(e => { console.error(e); });
});
