'use strict';
// ===== ui: drawing for map, units, panels, menus, dialogue =====
const G = {
  scene: 'boot', t: 0, roster: null, snap: null, chIdx: 0, S: null, cursor: { x: 0, y: 0 }, mode: 'idle', sel: null, reach: null, moveSet: null, threat: null, orig: null,
  menu: null, targets: [], ti: 0, fc: null, busy: 0, banner: null, fx: [], shake: 0, infoBig: false, showRange: null, endTurn: false, modal: null,
  dlg: null, speed: 1, title: { idx: 0 }, card: null, over: null, ending: null, lvl: null, phase: 0, hasSave: false
};
const OX = () => Engine.zoom > 1 ? 0 : Math.floor((W - G.S.w * TS) / 2), OY = () => Engine.zoom > 1 ? 0 : Math.floor((H - G.S.h * TS) / 2);
// camera (portrait zoom): world px of the view's top-left; follows the cursor smoothly, can be panned by dragging
const Cam = { x: 0, y: 0, tx: 0, ty: 0, key: null, snap: true };
function camClamp() {
  const z = Engine.zoom, vw = W / z, vh = Engine.vh / z, mw = G.S.w * TS, mh = G.S.h * TS;
  Cam.tx = mw <= vw ? (mw - vw) / 2 : Math.max(0, Math.min(mw - vw, Cam.tx)); Cam.ty = mh <= vh ? (mh - vh) / 2 : Math.max(0, Math.min(mh - vh, Cam.ty));
}
function camUpdate() {
  if (!G.S || Engine.zoom <= 1) { Cam.x = Cam.y = Cam.tx = Cam.ty = 0; Cam.key = null; return; }
  const z = Engine.zoom, c = G.cursor, k = c.x + ',' + c.y;
  for (const p of Input.pans) { Cam.tx -= p.dx / z; Cam.ty -= p.dy / z; camClamp(); Cam.x = Cam.tx; Cam.y = Cam.ty; }
  Input.pans.length = 0;
  if (k !== Cam.key) { Cam.key = k; Cam.tx = c.x * TS + 8 - W / z / 2; Cam.ty = c.y * TS + 8 - Engine.vh / z / 2; camClamp(); }
  if (Cam.snap) { camClamp(); Cam.x = Cam.tx; Cam.y = Cam.ty; Cam.snap = false; }
  Cam.x += (Cam.tx - Cam.x) * 0.2; Cam.y += (Cam.ty - Cam.y) * 0.2;
}
function tileScreen(x, y) { return { x: (OX() + x * TS - Cam.x) * Engine.zoom, y: (OY() + y * TS - Cam.y) * Engine.zoom }; }
const TEAMCOL = ['#4a90ff', '#ff4a4a'];
const NOSTART = '、。，．！？!?）」』】〕…ー・ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮ:;,.';
const NOEND = '（「『【〔';
function wrapText(s, maxw, size) { // Japanese line breaking (kinsoku): no line starts with closing marks/small kana/ー, none ends with an opening bracket
  const lines = []; let cur = '';
  for (const ch of s) {
    if (tw(cur + ch, size) > maxw && cur) {
      if (NOSTART.includes(ch) && cur.length > 1) { const last = cur.slice(-1); lines.push(cur.slice(0, -1)); cur = last + ch; }
      else if (NOEND.includes(cur.slice(-1)) && cur.length > 1) { const last = cur.slice(-1); lines.push(cur.slice(0, -1)); cur = last + ch; }
      else { lines.push(cur); cur = ch; }
    } else cur += ch;
  }
  if (cur) lines.push(cur); return lines;
}
function hpColor(r) { return r > 0.5 ? '#4fe070' : r > 0.25 ? '#f0d040' : '#f05050'; }
function hpBar(x, y, w, h, hp, max, ghost) {
  rect(x - 1, y - 1, w + 2, h + 2, '#000'); rect(x, y, w, h, '#333');
  if (ghost != null && ghost > hp) rect(x, y, Math.round(w * Math.min(1, ghost / max)), h, '#fff');
  rect(x, y, Math.round(w * Math.max(0, Math.min(1, hp / max))), h, hpColor(hp / max));
}
// ---------- map ----------
function drawMap(S, tt) {
  const ox = OX(), oy = OY();
  if (Engine.zoom > 1) { ctx.fillStyle = '#10131e'; ctx.fillRect(Cam.x - 8, Cam.y - 8, W / Engine.zoom + 16, Engine.vh / Engine.zoom + 16); }
  else { rect(0, 0, W, H, '#10131e'); drawBackdrop(ctx, ox, oy, S.w, S.h, S.ch.theme, tt); }
  drawMapLayer(ctx, S.rows, ox, oy, tt, S.ch.theme, S.ch.props);
}
function drawOverlay(S) {
  const ox = OX(), oy = OY(), pulse = 0.5 + 0.5 * Math.sin(G.t / 12);
  const cell = (k, fill, line) => { const x = k % 64, y = (k - x) / 64; ctx.fillStyle = fill; ctx.fillRect(ox + x * TS, oy + y * TS, TS, TS); ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.strokeRect(ox + x * TS + 0.5, oy + y * TS + 0.5, TS - 1, TS - 1); };
  if ((G.mode === 'move' || G.mode === 'moving') && G.reach) {
    if (G.threat) for (const k of G.threat) if (!G.moveSet.has(k)) cell(k, 'rgba(255,60,60,' + (0.28 + pulse * 0.08) + ')', 'rgba(255,140,140,0.6)');
    for (const k of G.moveSet) cell(k, 'rgba(40,100,255,' + (0.46 + pulse * 0.08) + ')', 'rgba(150,190,255,0.7)');
    // path preview
    if (G.mode === 'move' && G.moveSet.has(kk(G.cursor.x, G.cursor.y)) && (G.cursor.x !== G.sel.x || G.cursor.y !== G.sel.y)) {
      const p = pathTo(G.reach, G.cursor.x, G.cursor.y); ctx.fillStyle = 'rgba(255,240,120,0.95)';
      for (const q of p) ctx.fillRect(ox + q.x * TS + 6, oy + q.y * TS + 6, 4, 4);
    }
  }
  if (G.showRange && (G.mode === 'idle')) { const r = reach(S, G.showRange); for (const s of r.stops) cell(kk(s.x, s.y), 'rgba(60,110,255,0.25)', 'rgba(150,190,255,0.5)'); for (const k of threatTiles(S, G.showRange, r)) cell(k, 'rgba(255,60,60,0.3)', 'rgba(255,140,140,0.6)'); }
  if (G.mode === 'menu' && G.sel) { const w = weaponOf(G.sel); for (let dy = -w.max; dy <= w.max; dy++) for (let dx = -w.max; dx <= w.max; dx++) { const d = Math.abs(dx) + Math.abs(dy); if (d < w.min || d > w.max) continue; const x = G.sel.x + dx, y = G.sel.y + dy; if (inb(S, x, y)) cell(kk(x, y), w.type === 'heal' ? 'rgba(60,220,120,0.3)' : 'rgba(255,60,60,0.3)', 'rgba(255,150,150,0.6)'); } }
  if ((G.mode === 'target' || G.mode === 'forecast') && G.targets) for (const t of G.targets) cell(kk(t.x, t.y), 'rgba(255,50,50,' + (0.35 + pulse * 0.25) + ')', '#ffb0b0');
}
function unitFrame(u) { // pose row & bob
  if (u.walking) { const ph = Math.floor(G.t / 5) % 4; return { row: ph, bob: ph % 2 ? -1 : 0 }; }
  return { row: 0, bob: 0 };
}
function drawUnit(u, S) {
  if (u.gone) return;
  const ox = OX(), oy = OY();
  let px = ox + u.vx * TS + (u.lx || 0), py = oy + u.vy * TS + (u.ly || 0);
  const f = unitFrame(u);
  const gray = u.team === 0 && u.acted && !u.acting && !(G.phase === 1) ? 'gray' : null;
  let mode = (u.flash > 0 && Math.floor(u.flash / 2) % 2 === 0) ? 'white' : gray;
  let by = 0; if (!u.walking && !u.dead && u.team === 0 && !u.acted && G.sel !== u) by = (Math.floor((G.t + u.vx * 9) / 30) % 2) ? 0 : 0;
  if (G.sel === u && G.mode !== 'idle') by = (Math.floor(G.t / 8) % 2) ? -1 : 0;
  // foot marker
  ctx.fillStyle = (u.team === 0 ? 'rgba(70,140,255,' : 'rgba(255,70,70,') + (u.dead ? 0.3 * (u.fade || 0) / 30 : 0.75) + ')';
  ctx.beginPath(); ctx.ellipse(px + 8, py + 14, 6.5, 2.6, 0, 0, 7); ctx.fill();
  drawUnitSprite(ctx, u.sprite, u.dir, f.row, px, py + f.bob + by - 1, mode, u.dead ? (u.fade || 0) / 30 : 1);
  if (!u.dead) hpBar(px + 2, py + 15, 12, 2, u.vhp, u.maxhp);
  if (u.team === 1 && u.boss && !u.dead) text('★', px + 4, py - 8, { size: 8, color: '#ffd24a' });
}
function drawFx() {
  const ox = 0;
  for (const f of G.fx) {
    if (f.kind === 'num') { const a = Math.min(1, f.life / 14); ctx.globalAlpha = a; text(f.text, f.x, f.y, { size: f.size || 10, bold: true, color: f.color, align: 'center', sh: '#000' }); ctx.globalAlpha = 1; }
    else if (f.kind === 'p') { ctx.globalAlpha = Math.min(1, f.life / 10); ctx.fillStyle = f.color; ctx.fillRect(Math.round(f.x), Math.round(f.y), f.s || 2, f.s || 2); ctx.globalAlpha = 1; }
  }
}
function stepFx() {
  for (const f of G.fx) { f.life--; f.x += f.vx || 0; f.y += f.vy || 0; if (f.g) f.vy += f.g; }
  G.fx = G.fx.filter(f => f.life > 0);
  for (const u of G.S ? G.S.units : []) { if (u.flash > 0) u.flash--; if (u.dead && u.fade > 0 && u.fading) { u.fade--; if (u.fade <= 0) u.gone = true; } }
  if (G.shake > 0) G.shake--;
}
function drawCursor(S) {
  const c = G.cursor, ox = OX(), oy = OY(), x = ox + c.x * TS, y = oy + c.y * TS, o = Math.floor(G.t / 10) % 2;
  ctx.strokeStyle = G.mode === 'target' || G.mode === 'forecast' ? '#ff8080' : '#ffe860'; ctx.lineWidth = 1.5;
  const L = 5, d = o ? 0 : -1;
  ctx.beginPath();
  for (const [cx, cy, sx, sy] of [[x + d, y + d, 1, 1], [x + TS - d, y + d, -1, 1], [x + d, y + TS - d, 1, -1], [x + TS - d, y + TS - d, -1, -1]]) { ctx.moveTo(cx + sx * L, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * L); }
  ctx.stroke();
}
// ---------- panels ----------
function drawUnitPanel(u, x, y) {
  panel(x, y, 128, 50);
  rect(x + 4, y + 5, 40, 40, '#161a3a'); drawFace(ctx, u.sprite, x + 5, y + 6, 1);
  ctx.strokeStyle = u.team === 0 ? '#6aa0ff' : '#ff6a6a'; ctx.lineWidth = 1; ctx.strokeRect(x + 4.5, y + 5.5, 39, 39);
  text(u.name, x + 48, y + 4, { size: 9, bold: true });
  text('Lv' + u.lv + ' ' + u.cls, x + 48, y + 14, { size: 7, color: '#b8c4ff' });
  hpBar(x + 60, y + 25, 60, 4, u.vhp, u.maxhp);
  text('HP', x + 48, y + 23, { size: 7, color: '#ffd24a' });
  text(Math.round(u.vhp) + '/' + u.maxhp, x + 64, y + 30, { size: 7 });
  text(weaponOf(u).name, x + 48, y + 38, { size: 7, color: '#d8e0ff' });
  if (u.team === 0) text('EXP ' + u.exp, x + 92, y + 38, { size: 7, color: '#9fe8ff' });
  if (u.acted && u.team === 0) text('行動済', x + 96, y + 4, { size: 7, color: '#999' });
}
function drawTerrainPanel(x, y, ch) {
  const T = TERRAIN[ch];
  panel(x, y, 70, 25);
  text(T.name, x + 5, y + 3, { size: 8, bold: true });
  const l = (T.avo ? '回避+' + T.avo : '') + ((T.def) ? ' 防御+' + T.def : ''); text(l || '効果なし', x + 5, y + 14, { size: 7, color: '#b8c4ff' });
  if (T.heal) text('回復20%', x + 36, y + 3, { size: 7, color: '#6f6' });
}
function drawBigInfo(u) {
  const x = 60, y = 40, w = 200, h = 120; panel(x, y, w, h, 0.95);
  rect(x + 6, y + 6, 40, 40, '#161a3a'); drawFace(ctx, u.sprite, x + 7, y + 7, 1);
  text(u.name, x + 52, y + 6, { size: 11, bold: true }); text('Lv' + u.lv + '  ' + u.cls + '  EXP ' + u.exp, x + 52, y + 21, { size: 8, color: '#b8c4ff' });
  text('武器 ' + weaponOf(u).name + (weaponOf(u).type === 'heal' ? ' (回復)' : ' 威力' + weaponOf(u).might + ' 射程' + weaponOf(u).min + (weaponOf(u).max > weaponOf(u).min ? '-' + weaponOf(u).max : '')), x + 52, y + 33, { size: 7 });
  const rows = [['HP', Math.round(u.vhp) + '/' + u.maxhp], ['力', u.str], ['魔力', u.mag], ['技', u.skl], ['速さ', u.spd], ['守備', u.def], ['魔防', u.res], ['移動', u.mov]];
  rows.forEach((r, i) => { const cx = x + 10 + (i % 2) * 96, cy = y + 56 + Math.floor(i / 2) * 14; text(r[0], cx, cy, { size: 9, color: '#ffd24a' }); text(String(r[1]), cx + 80, cy, { size: 9, align: 'right' }); });
  text('Aキーで閉じる', x + w - 6, y + h - 11, { size: 7, align: 'right', color: '#889' });
}
function drawMenu(m) {
  const cur = m.items[m.idx]; if (cur && cur.desc) { panel(40, 4, 240, 15, 0.92); text(cur.name || cur.label, 46, 8, { size: 8, bold: true, color: '#ffe860' }); text(cur.desc + (cur.off ? '(使えない)' : ''), 86, 8, { size: 8 }); }
  const w = m.w || 56, h = m.items.length * 14 + 8;
  panel(m.x, m.y, w, h, 0.95);
  m.items.forEach((it, i) => {
    const yy = m.y + 5 + i * 14;
    if (i === m.idx) { rect(m.x + 3, yy - 1, w - 6, 13, '#3a4ab0'); text('▶', m.x + 4, yy + 1, { size: 8, color: '#ffe860' }); }
    text(it.label, m.x + 14, yy + 1, { size: 9, color: it.off ? '#778' : '#fff' });
    Touch.add(m.x, yy - 1, w, 14, () => { m.idx = i; Input.q.push('ok'); });
  });
}
function drawForecast(fc) {
  const x = 44, w = 232, h = 62, y = fc.top ? 4 : VH() - h - 4; panel(x, y, w, h, 0.95);
  Touch.add(x, y, w, h, () => Input.q.push('ok'));
  const side = (S, cx) => {
    const u = S.u; text(u.name, cx, y + 4, { size: 9, bold: true, color: u.team === 0 ? '#9fc4ff' : '#ff9f9f' });
    text(weaponOf(u).name, cx + 46, y + 6, { size: 7, color: '#b8c4ff' });
    if (S.adv) text(S.adv > 0 ? '▲' : '▼', cx + 100, y + 5, { size: 8, bold: true, color: S.adv > 0 ? '#6dff8d' : '#ff7070' });
    hpBar(cx, y + 20, 56, 4, u.hp, u.maxhp); text('HP ' + u.hp, cx + 60, y + 16, { size: 8 });
    if (S.can) {
      text('ダメージ', cx, y + 28, { size: 8 }); text(S.dmg + (S.n > 1 ? '×2' : ''), cx + 62, y + 27, { size: 10, bold: true, align: 'right', color: S.n > 1 ? '#ffe860' : '#fff' });
      text('命中', cx + 68, y + 28, { size: 8 }); text(S.hit + '%', cx + 108, y + 27, { size: 10, bold: true, align: 'right' });
    } else text('反撃できない', cx, y + 30, { size: 8, color: '#889' });
  };
  side(fc.a, x + 6); rect(x + w / 2, y + 5, 1, h - 24, '#4a58a8'); side(fc.d, x + w / 2 + 6);
  rect(x + 6, y + h - 17, w - 12, 13, '#1f6a3a'); ctx.strokeStyle = '#7fe0a0'; ctx.strokeRect(x + 6.5, y + h - 16.5, w - 13, 12);
  text((G.spMode ? SP[G.sel.key].name : '攻撃') + 'する(もう一度タップ / 決定ボタン)', x + w / 2, y + h - 15, { size: 8, bold: true, align: 'center' });
}
const VH = () => Engine.vh || H;
function drawBanner() {
  const b = G.banner; if (!b) return; const t = b.t;
  const inT = Math.min(1, t / 12), outT = Math.min(1, (b.dur - t) / 12), k = Math.min(inT, outT), h = 32 * k;
  ctx.fillStyle = b.color; ctx.globalAlpha = 0.9; ctx.fillRect(0, VH() / 2 - h / 2, W, h); ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(0, VH() / 2 - h / 2, W, 1); ctx.fillRect(0, VH() / 2 + h / 2 - 1, W, 1);
  if (k > 0.8) { const off = (1 - Math.min(1, t / 16)) * 60; ctx.globalAlpha = Math.min(1, outT * 2); text(b.text, W / 2 + off, VH() / 2 - 10, { size: 18, bold: true, align: 'center' }); ctx.globalAlpha = 1; }
}
function drawLevelUp(L) {
  const x = 50, y = 30, w = 220, h = 150; panel(x, y, w, h, 0.97);
  text('LEVEL UP!', x + w / 2, y + 6, { size: 14, bold: true, color: '#ffe860', align: 'center' });
  rect(x + 8, y + 28, 40, 40, '#161a3a'); drawFace(ctx, L.unit.sprite, x + 9, y + 29, 1);
  text(L.unit.name, x + 54, y + 28, { size: 11, bold: true }); text(L.unit.cls, x + 54, y + 43, { size: 8, color: '#b8c4ff' });
  text('Lv ' + (L.up.lv - 1) + ' → ' + L.up.lv, x + 54, y + 54, { size: 10, bold: true, color: '#9fe8ff' });
  const names = [['hp', 'HP'], ['str', '力'], ['mag', '魔力'], ['skl', '技'], ['spd', '速さ'], ['def', '守備'], ['res', '魔防']];
  names.forEach(([k, n], i) => {
    const cx = x + 14 + (i % 2) * 104, cy = y + 76 + Math.floor(i / 2) * 15, up = L.up.gains[k];
    if (up) rect(cx - 3, cy - 1, 98, 14, 'rgba(255,230,80,0.18)');
    text(n, cx, cy, { size: 9, color: '#ffd24a' }); text(String(L.up.before[k]), cx + 44, cy, { size: 9, align: 'right', color: up ? '#fff' : '#aab' });
    text('→', cx + 50, cy, { size: 8, color: '#889' }); text(String(L.up.after[k]), cx + 70, cy, { size: 9, align: 'right', bold: !!up, color: up ? '#ffe860' : '#aab' });
    if (up && Math.floor(G.t / 8) % 2) text('+1', cx + 74, cy, { size: 8, bold: true, color: '#6f6' });
  });
  text('決定で閉じる', x + w / 2, y + h - 11, { size: 7, align: 'center', color: '#889' });
}
function drawPhaseLabel(S, x, y) {
  panel(x, y, 96, 14, 0.85);
  text('ターン' + S.turn + (G.phase === 0 ? ' 自軍' : ' 敵軍'), x + 5, y + 3, { size: 8, bold: true, color: G.phase === 0 ? '#9fc4ff' : '#ff9f9f' });
  const left = alive(S).filter(u => u.team === 1).length; text('敵' + left, x + 78, y + 3, { size: 7, color: '#ffb0b0' });
}
function cursorUnit() { const S = G.S; return unitAt(S, G.cursor.x, G.cursor.y) || (G.sel && G.sel.x === G.cursor.x && G.sel.y === G.cursor.y ? G.sel : null); }
// portrait phones: unit/terrain/phase info lives in a separate canvas below the map so it never covers the field
function drawInfoCanvas() {
  const S = G.S, main = ctx; ctx = cv2.getContext('2d'); ctx.setTransform(K, 0, 0, K, 0, 0); ctx.imageSmoothingEnabled = false;
  rect(0, 0, W, INFO_H, '#0b0b14'); ctx.fillStyle = '#2a3070'; ctx.fillRect(0, 0, W, 1);
  if (S) {
    const cu = cursorUnit();
    if (cu) drawUnitPanel(cu, 4, 5); else { panel(4, 5, 128, 50, 0.6); text('マスをタップして', 12, 17, { size: 8, color: '#889' }); text('ユニットを選択', 12, 29, { size: 8, color: '#889' }); }
    drawPhaseLabel(S, 140, 5); drawTerrainPanel(140, 23, S.rows[G.cursor.y][G.cursor.x]);
    text('味方 ' + alive(S).filter(u => u.team === 0).length + '  敵 ' + alive(S).filter(u => u.team === 1).length, 246, 8, { size: 8 });
    if (cu) {
      const rows = [['力', cu.str], ['魔力', cu.mag], ['技', cu.skl], ['速さ', cu.spd], ['守備', cu.def], ['魔防', cu.res], ['移動', cu.mov], ['射程', weaponOf(cu).min + (weaponOf(cu).max > weaponOf(cu).min ? '-' + weaponOf(cu).max : '')]];
      rows.forEach((r, i) => { const cx = 6 + (i % 4) * 52, cy = 62 + Math.floor(i / 4) * 13; text(r[0], cx, cy, { size: 8, color: '#ffd24a' }); text(String(r[1]), cx + 46, cy, { size: 8, align: 'right' }); });
      const sp = SP[cu.key]; if (sp && cu.team === 0) text('特技 ' + sp.name + (cu.spUsed ? '(使用済)' : '') + ' : ' + sp.desc, 6, 97, { size: 7, color: cu.spUsed ? '#778' : '#9fe8ff' });
    }
    text('目的: ' + S.ch.goal, 6, 109, { size: 9, color: '#ffe27a' });
    text('ドラッグ:地図を動かす  青=移動範囲  赤=攻撃範囲', 6, 122, { size: 7, color: '#889' });
    drawMinimap(S);
  }
  ctx = main;
}
// minimap (portrait): terrain, units and the camera window; tap it to jump there
const MM = { x: 218, y: 22, w: 98, h: 72, t: 4 };
function drawMinimap(S) {
  const t = Math.max(2, Math.floor(Math.min(MM.w / S.w, MM.h / S.h))); MM.t = t; const mw = S.w * t, mh = S.h * t, x0 = MM.x + (MM.w - mw) / 2, y0 = MM.y + (MM.h - mh) / 2; MM.ox = x0; MM.oy = y0;
  const col = { '.': '#6a9a3a', '=': '#a08a60', 'T': '#2f6a2a', '^': '#8a6a4a', '~': '#3a8ab0', '#': '#707080' };
  rect(x0 - 1, y0 - 1, mw + 2, mh + 2, '#000');
  for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) rect(x0 + x * t, y0 + y * t, t, t, col[S.rows[y][x]] || '#5a4a3a');
  for (const u of alive(S)) rect(x0 + u.x * t, y0 + u.y * t, t, t, u.team === 0 ? '#5ab0ff' : (u.boss ? '#ffd24a' : '#ff4a4a'));
  if (Engine.zoom > 1) { const z = Engine.zoom; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(Math.round(x0 + Cam.x / TS * t) + 0.5, Math.round(y0 + Cam.y / TS * t) + 0.5, W / z / TS * t, Engine.vh / z / TS * t); }
}
window.minimapTap = (x, y) => {
  if (!G.S || Engine.zoom <= 1 || !MM.ox) return; const tx = (x - MM.ox) / MM.t, ty = (y - MM.oy) / MM.t; if (tx < -1 || ty < -1 || tx > G.S.w + 1 || ty > G.S.h + 1) return;
  const z = Engine.zoom; Cam.tx = tx * TS - W / z / 2; Cam.ty = ty * TS - Engine.vh / z / 2; camClamp(); Cam.key = G.cursor.x + ',' + G.cursor.y;
};
function drawBattle() {
  const S = G.S; if (!S) return;
  ctx.save();
  if (G.shake > 0) ctx.translate((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3);
  if (Engine.zoom > 1) { ctx.scale(Engine.zoom, Engine.zoom); ctx.translate(-Cam.x, -Cam.y); }
  drawMap(S, G.t); drawOverlay(S);
  const us = S.units.filter(u => !u.gone).sort((a, b) => a.vy - b.vy);
  for (const u of us) drawUnit(u, S);
  drawFx();
  if (G.mode !== 'busyhide') drawCursor(S);
  ctx.restore();
  const left = G.cursor.x >= 10; // flip panels away from the cursor
  const cu = cursorUnit();
  if (G.mode !== 'forecast' && !Engine.port) {
    drawPhaseLabel(S, left ? 4 : W - 100, 4);
    drawTerrainPanel(left ? 4 : W - 74, 20, S.rows[G.cursor.y][G.cursor.x]);
    if (cu && !G.infoBig) drawUnitPanel(cu, left ? 4 : W - 132, H - 54);
  }
  if (G.infoBig && cu) drawBigInfo(cu);
  if (G.mode === 'menu' && G.menu) drawMenu(G.menu);
  if (G.mode === 'sysmenu' && G.menu) drawMenu(G.menu);
  if (G.mode === 'forecast' && G.fc) drawForecast(G.fc);
  if (G.lvl) drawLevelUp(G.lvl);
  drawBanner();
}
// ---------- dialogue / scenes ----------
function drawBackdropMap(idx, dim) {
  const ch = CHAPTERS[idx], w = ch.map[0].length, h = ch.map.length, ox = Math.floor((W - w * TS) / 2), oy = Math.floor((H - h * TS) / 2);
  rect(0, 0, W, H, '#080a14');
  drawBackdrop(ctx, ox, oy, w, h, ch.theme, G.t);
  drawMapLayer(ctx, ch.map, ox, oy, G.t, ch.theme, ch.props);
  ctx.fillStyle = 'rgba(8,10,40,' + dim + ')'; ctx.fillRect(0, 0, W, H);
}
function drawDialogue() {
  const d = G.dlg; if (!d) return;
  drawBackdropMap(d.bg, 0.62);
  const sp = d.line[0] ? SPEAKERS[d.line[0]] : null;
  const bx = sp ? 86 : 16, bw = sp ? 222 : 288, by = 170, bh = 62;
  if (sp) {
    rect(8, 150, 76, 76, '#0c0e24'); drawFace(ctx, sp.face, 8, 150, 2);
    ctx.strokeStyle = '#c8d0ff'; ctx.lineWidth = 1; ctx.strokeRect(8.5, 150.5, 75, 75);
  }
  panel(bx, by, bw, bh, 0.92);
  if (sp) { panel(bx + 6, by - 8, tw(sp.name, 9) + 14, 14, 1); text(sp.name, bx + 13, by - 5, { size: 9, bold: true, color: '#ffe860' }); }
  const all = wrapText(d.line[1], bw - 20, 9); let left = d.n;
  all.forEach((l, i) => { const part = l.slice(0, Math.max(0, left)); left -= l.length; if (part) text(part, bx + 10, by + 9 + i * 14, { size: 9 }); });
  if (d.n >= d.line[1].length && Math.floor(G.t / 20) % 2) text('▼', bx + bw - 14, by + bh - 12, { size: 8, color: '#ffe860' });
  if (d.tip) text('決定: 次へ', W - 8, 6, { size: 7, align: 'right', color: '#889' });
}
function skyGrad(c1, c2, y0, y1) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0); }
function drawStars(n, seed) { let s = seed; for (let i = 0; i < n; i++) { s = (s * 16807) % 2147483647; const x = s % W; s = (s * 16807) % 2147483647; const y = s % 130; const tw2 = (Math.floor(G.t / 20 + i) % 3 === 0) ? 0.4 : 1; ctx.fillStyle = 'rgba(255,255,230,' + 0.8 * tw2 + ')'; ctx.fillRect(x, y, 1, 1); } }
function drawHills(dark, base, amp) { ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 4) ctx.lineTo(x, base - Math.sin(x / 37) * amp - Math.sin(x / 13 + 1) * amp * 0.3); ctx.lineTo(W, H); ctx.fill(); }
function drawHeroLine(y, scale, ids, wiggle) {
  ctx.imageSmoothingEnabled = false;
  const n = ids.length, gap = 40; let x0 = W / 2 - (n * gap) / 2 + (gap - 16 * scale) / 2;
  ids.forEach((id, i) => { const bob = wiggle ? Math.round(Math.sin(G.t / 18 + i) * 1) : 0; const c = spriteVariant(id, 'down', 0, null); ctx.drawImage(c, Math.round(x0 + i * gap), y + bob, 16 * scale, 16 * scale); });
}
function drawTitle() {
  rect(0, 0, W, H, '#0e0d22');
  skyGrad('#0a0c2e', '#3a2a5a', 0, 150); drawStars(70, 99);
  // moon-like star
  ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(250, 40, 11, 0, 7); ctx.fill(); ctx.fillStyle = '#0a0c2e'; ctx.beginPath(); ctx.arc(255, 37, 10, 0, 7); ctx.fill();
  drawHills('#1a1736', 168, 10); drawHills('#0e0d22', 196, 8);
  drawHeroLine(150, 2, ['hero_knight', 'hero_archer', 'hero_mage', 'hero_healer', 'hero_thief'], true);
  // flag
  const fx = 40, fy = 112; rect(fx, fy, 2, 46, '#c8b070'); const wv = Math.sin(G.t / 10) * 2; ctx.fillStyle = '#d83a3a'; ctx.beginPath(); ctx.moveTo(fx + 2, fy + 2); ctx.lineTo(fx + 24, fy + 6 + wv); ctx.lineTo(fx + 2, fy + 18); ctx.fill();
  text('星砕きの戦旗', W / 2, 26, { size: 30, bold: true, align: 'center', color: '#ffe27a', sh: '#6a2a00' });
  text('STARFALL TACTICS', W / 2, 64, { size: 11, bold: true, align: 'center', color: '#bcd0ff' });
  const items = G.title.items;
  items.forEach((it, i) => {
    const y = 180 + i * 18, sel = i === G.title.idx; const w = 100;
    if (sel) { rect(W / 2 - w / 2, y - 2, w, 16, 'rgba(70,90,200,0.8)'); text('▶', W / 2 - w / 2 + 4, y + 1, { size: 9, color: '#ffe860' }); }
    text(it.label, W / 2, y + 1, { size: 10, bold: true, align: 'center', color: it.off ? '#778' : '#fff' });
    Touch.add(W / 2 - w / 2, y - 2, w, 16, () => { G.title.idx = i; Input.q.push('ok'); });
  });
  text('矢印+Z / タップで決定', W / 2, 228, { size: 7, align: 'center', color: '#889' });
}
function drawCard() {
  const c = G.card; rect(0, 0, W, H, '#05060f'); skyGrad('#0a0c2e', '#1a1736', 0, H); drawStars(40, 7);
  const a = Math.min(1, c.t / 20, (c.dur - c.t) / 20 + 0.0); ctx.globalAlpha = Math.max(0, Math.min(1, a));
  text(c.title, W / 2, 84, { size: 12, color: '#bcd0ff', align: 'center' });
  text(c.name, W / 2, 102, { size: 24, bold: true, color: '#ffe27a', align: 'center', sh: '#5a2a00' });
  text('目的: ' + c.goal, W / 2, 140, { size: 9, color: '#fff', align: 'center' });
  ctx.globalAlpha = 1;
}
function drawGameOver() {
  rect(0, 0, W, H, '#1a0508'); skyGrad('#2a0a10', '#0a0204', 0, H);
  text('敗  北', W / 2, 50, { size: 28, bold: true, color: '#e04040', align: 'center', sh: '#300' });
  text('旗は折れた…。だが、まだ終わりではない。', W / 2, 96, { size: 9, align: 'center', color: '#dbb' });
  G.title.items.forEach((it, i) => {
    const y = 130 + i * 20, sel = i === G.title.idx, w = 130;
    if (sel) { rect(W / 2 - w / 2, y - 2, w, 17, 'rgba(160,50,50,0.8)'); text('▶', W / 2 - w / 2 + 4, y + 1, { size: 9, color: '#ffe860' }); }
    text(it.label, W / 2, y + 2, { size: 10, bold: true, align: 'center' });
    Touch.add(W / 2 - w / 2, y - 2, w, 17, () => { G.title.idx = i; Input.q.push('ok'); });
  });
}
function drawEnding() {
  const e = G.ending, t = e.t; rect(0, 0, W, H, '#16241a');
  skyGrad('#1a2a5a', '#ffb070', 0, 160); drawStars(30, 5); ctx.globalAlpha = Math.max(0, 1 - t / 200); rect(0, 0, W, 160, 'rgba(0,0,20,0.5)'); ctx.globalAlpha = 1;
  const sy = 120 - Math.min(40, t / 8); ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(200, 150 - Math.min(60, t / 5), 22, 0, 7); ctx.fill();
  drawHills('#2a3a2a', 170, 8); drawHills('#16241a', 196, 6);
  drawHeroLine(168, 2, ['hero_knight', 'hero_archer', 'hero_mage', 'hero_healer', 'hero_thief'], true);
  const fx = 70, fy = 120; rect(fx, fy, 2, 50, '#c8b070'); const wv = Math.sin(G.t / 10) * 2; ctx.fillStyle = '#d83a3a'; ctx.beginPath(); ctx.moveTo(fx + 2, fy + 2); ctx.lineTo(fx + 28, fy + 7 + wv); ctx.lineTo(fx + 2, fy + 20); ctx.fill();
  ENDING_TEXT.forEach((l, i) => { const a = Math.max(0, Math.min(1, (t - 40 - i * 90) / 40)); ctx.globalAlpha = a; text(l, W / 2, 20 + i * 18, { size: 9, align: 'center' }); ctx.globalAlpha = 1; });
  const a2 = Math.max(0, Math.min(1, (t - 330) / 60)); ctx.globalAlpha = a2;
  text('FIN', W / 2, 84, { size: 26, bold: true, color: '#ffe27a', align: 'center', sh: '#5a2a00' });
  text('プレイしてくれてありがとう!', W / 2, 210, { size: 8, align: 'center', color: '#fff' });
  text('ドット絵: Pixel-boy (CC0)  Superpowers asset packs', W / 2, 222, { size: 7, align: 'center', color: '#dde' });
  if (t > 380 && Math.floor(G.t / 25) % 2) text('決定でタイトルへ', W / 2, 232, { size: 7, align: 'center', color: '#ffe860' });
  ctx.globalAlpha = 1;
}
