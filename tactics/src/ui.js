'use strict';
// ===== ui: drawing for map, units, panels, menus, dialogue =====
const G = {
  scene: 'boot', t: 0, roster: null, snap: null, chIdx: 0, S: null, cursor: { x: 0, y: 0 }, mode: 'idle', sel: null, reach: null, moveSet: null, threat: null, orig: null,
  menu: null, targets: [], ti: 0, fc: null, busy: 0, banner: null, fx: [], shake: 0, infoBig: false, showRange: null, endTurn: false, modal: null,
  dlg: null, speed: 1, auto: false, speedX: 1, title: { idx: 0 }, card: null, over: null, ending: null, lvl: null, phase: 0, hasSave: false
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
function hpBar(x, y, w, h, hp, max, ghost) { // gradient fill with a white damage trail
  rect(x - 1, y - 1, w + 2, h + 2, '#000'); rect(x, y, w, h, '#2a2a3a');
  if (ghost != null && ghost > hp) rect(x, y, Math.round(w * Math.min(1, ghost / max)), h, '#fff7c8');
  const fw = Math.round(w * Math.max(0, Math.min(1, hp / max))); if (fw <= 0) return;
  const c = hpColor(hp / max); rect(x, y, fw, h, c); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y, fw, Math.max(1, Math.floor(h / 3))); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y + h - 1, fw, 1);
}
// ---------- map ----------
function drawMap(S, tt) {
  const ox = OX(), oy = OY(), PAD = 24;
  if (Engine.zoom > 1) { ctx.fillStyle = '#10131e'; ctx.fillRect(Cam.x - 8, Cam.y - 8, W / Engine.zoom + 16, Engine.vh / Engine.zoom + 16); }
  else {
    if (!G.bdCv || G.bdCv.S !== S) { G.bdCv = cvs(W, H); G.bdCv.S = S; const g = G.bdCv.getContext('2d'); g.fillStyle = '#10131e'; g.fillRect(0, 0, W, H); drawBackdrop(g, ox, oy, S.w, S.h, S.ch.theme, 0); }
    ctx.drawImage(G.bdCv, 0, 0);
  }
  // static ground is cached and refreshed ~10 times a second (water shimmer); flames and smoke animate every frame
  const cw = S.w * 16 + PAD * 2, ch = S.h * 16 + PAD * 2;
  if (!G.mapCv || G.mapCv.S !== S || G.mapCv.width !== cw) { G.mapCv = cvs(cw, ch); G.mapCv.S = S; G.mapStamp = -99; }
  if (tt - G.mapStamp >= 6 || tt < G.mapStamp) { const g = G.mapCv.getContext('2d'); g.clearRect(0, 0, cw, ch); G.mapFx = drawMapLayer(g, S.rows, PAD, PAD, tt, S.ch.theme, S.ch.props, true); G.mapStamp = tt; }
  ctx.drawImage(G.mapCv, ox - PAD, oy - PAD);
  ctx.save(); ctx.translate(ox - PAD, oy - PAD); drawAmbient(ctx, G.mapFx, tt); ctx.restore();
}
// per-chapter colour grading + drifting cloud shadows, fog (ch2) and embers (ch3); drawn over the field only
function drawAtmos(S, t) {
  const ox = OX(), oy = OY(), w = S.w * 16, h = S.h * 16, th = S.ch.theme;
  ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, w, h); ctx.clip();
  const lg = (c0, c1) => { const g = ctx.createLinearGradient(0, oy, 0, oy + h); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fillRect(ox, oy, w, h); };
  if (th === 'bright') lg('rgba(255,225,150,0.11)', 'rgba(255,170,90,0.05)');
  else if (th === 'mossy') lg('rgba(120,170,200,0.12)', 'rgba(60,110,140,0.10)');
  else lg('rgba(170,60,120,0.17)', 'rgba(50,10,50,0.15)');
  const blob = (x, y, rx, ry, col) => { ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 7); ctx.fill(); ctx.restore(); };
  for (let i = 0; i < 4; i++) blob(ox + ((t * 0.14 * (1 + i * 0.25) + i * 97) % (w + 220)) - 90, oy + (i * 61 + 30) % h, 56, 26, th === 'harsh' ? 'rgba(10,0,20,0.14)' : 'rgba(0,20,40,0.10)');
  if (th === 'mossy') for (let i = 0; i < 3; i++) blob(ox + ((t * 0.07 * (1 + i * 0.4) + i * 120) % (w + 300)) - 150, oy + (i * 77 + 40) % h, 120, 26, 'rgba(225,240,250,0.16)');
  if (th === 'harsh') for (let i = 0; i < 26; i++) {
    const x = ox + ((i * 61 + t * (0.12 + (i % 3) * 0.05)) % w) + Math.sin(t / 25 + i) * 3, y = oy + h - ((i * 37 + t * (0.25 + (i % 4) * 0.08)) % (h + 20)) + 10;
    ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t / 9 + i * 3); ctx.fillStyle = i % 3 ? '#ff9a3a' : '#ffd070'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1 + (i % 4 === 0 ? 1 : 0));
  }
  ctx.globalAlpha = 1; ctx.restore();
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
  let px = ox + u.vx * TS + (u.lx || 0) + (u.kx || 0), py = oy + u.vy * TS + (u.ly || 0) + (u.ky || 0);
  const f = unitFrame(u), fade = u.dead ? (u.fade || 0) / 30 : 1;
  const gray = u.team === 0 && u.acted && !u.acting && !(G.phase === 1) ? 'gray' : null;
  const mode = (u.flash > 0 && Math.floor(u.flash / 2) % 2 === 0) ? 'white' : gray;
  let by = 0;
  if (!u.walking && !u.dead && !(u.team === 0 && u.acted)) by = Math.round(Math.sin((G.t + (u.vx * 7 + u.vy * 13) * 5) / 22) * 0.6); // gentle breathing
  if (G.sel === u && G.mode !== 'idle') by = (Math.floor(G.t / 8) % 2) ? -1 : 0;
  const sink = u.dead ? (1 - fade) * 5 : 0;
  if (u.boss && !u.dead) { const pu = 0.5 + 0.5 * Math.sin(G.t / 14), gr = ctx.createRadialGradient(px + 8, py + 9, 2, px + 8, py + 9, 17); gr.addColorStop(0, 'rgba(255,210,70,' + (0.45 + pu * 0.2) + ')'); gr.addColorStop(1, 'rgba(255,160,0,0)'); ctx.fillStyle = gr; ctx.fillRect(px - 10, py - 8, 36, 36); }
  // soft shadow + team ring on the ground
  ctx.fillStyle = 'rgba(0,0,0,' + 0.28 * fade + ')'; ctx.beginPath(); ctx.ellipse(px + 8, py + 14.5, 7, 2.8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,' + 0.18 * fade + ')'; ctx.beginPath(); ctx.ellipse(px + 8, py + 14.5, 5, 1.8, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = (u.team === 0 ? 'rgba(90,170,255,' : 'rgba(255,90,90,') + (0.85 * fade) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(px + 8, py + 14.5, 7, 2.8, 0, 0, 7); ctx.stroke();
  // team-coloured rim, then the sprite
  if (!gray && !u.dead) { ctx.globalAlpha = 0.85; ctx.drawImage(spriteRim(u.sprite, u.dir, f.row, u.team), Math.round(px) - 1, Math.round(py + f.bob + by - 1 + sink) - 1); ctx.globalAlpha = 1; }
  drawUnitSprite(ctx, u.sprite, u.dir, f.row, px, py + f.bob + by - 1 + sink, mode, fade);
  if (!u.dead) hpBar(px + 2, py + 15, 12, 2, u.vhp, u.maxhp, u.ghost);
  if (u.team === 1 && u.boss && !u.dead) text('★', px + 4, py - 8, { size: 8, color: '#ffd24a' });
}
function spawnSpr(name, wx, wy, o) { // sprite-sheet effect centred on a world point
  const d = FXS[name]; if (!d) return; o = o || {}; const dur = o.dur || 3;
  G.fx.push({ kind: 'spr', d, x: wx, y: wy, vx: o.vx || 0, vy: o.vy || 0, scale: o.scale || 0.4, dur, age: 0, life: o.life || d.n * dur, flip: o.flip ? -1 : 1, rot: o.rot || 0, glow: o.glow });
}
function drawFx() {
  for (const f of G.fx) {
    if (f.kind === 'num') {
      const age = 46 - f.life, pop = age < 7 ? 1 + (7 - age) * 0.09 : 1, a = Math.min(1, f.life / 14), sz = (f.size || 10) * pop;
      ctx.globalAlpha = a; ctx.font = 'bold ' + sz + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#000';
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) ctx.fillText(f.text, f.x + dx, f.y + dy);
      ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y); ctx.globalAlpha = 1;
    } else if (f.kind === 'p') { ctx.globalAlpha = Math.min(1, f.life / 10); ctx.fillStyle = f.color; ctx.fillRect(Math.round(f.x), Math.round(f.y), f.s || 2, f.s || 2); ctx.globalAlpha = 1; }
    else if (f.kind === 'spr') {
      const fr = Math.min(f.d.n - 1, Math.floor(f.age / f.dur)), w = f.d.fw * f.scale, h = f.d.fh * f.scale;
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.translate(f.x, f.y); if (f.rot) ctx.rotate(f.rot); ctx.scale(f.flip, 1);
      if (f.glow) ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(f.d.img, fr * f.d.fw, 0, f.d.fw, f.d.fh, -w / 2, -h / 2, w, h); ctx.restore();
    }
  }
}
function stepFx() {
  for (const f of G.fx) { f.life--; f.age = (f.age || 0) + 1; f.x += f.vx || 0; f.y += f.vy || 0; if (f.g) f.vy += f.g; }
  G.fx = G.fx.filter(f => f.life > 0);
  for (const u of G.S ? G.S.units : []) {
    if (u.flash > 0) u.flash--; if (u.dead && u.fade > 0 && u.fading) { u.fade--; if (u.fade <= 0) u.gone = true; }
    if (u.kx || u.ky) { u.kx *= 0.78; u.ky *= 0.78; if (Math.abs(u.kx) < 0.1) u.kx = 0; if (Math.abs(u.ky) < 0.1) u.ky = 0; }
    if (u.ghost != null) { if (u.ghost > u.vhp) u.ghost = Math.max(u.vhp, u.ghost - 0.18); else u.ghost = u.vhp; }
  }
  if (G.shake > 0) G.shake--; if (G.flashW > 0) G.flashW--;
}
function drawCursor(S) {
  const c = G.cursor, ox = OX(), oy = OY(), x = ox + c.x * TS, y = oy + c.y * TS, o = Math.floor(G.t / 10) % 2;
  ctx.strokeStyle = G.mode === 'target' || G.mode === 'forecast' ? '#ff8080' : '#ffe860'; ctx.lineWidth = 1.5;
  const L = 5, d = o ? 0 : -1;
  ctx.beginPath();
  for (const [cx, cy, sx, sy] of [[x + d, y + d, 1, 1], [x + TS - d, y + d, -1, 1], [x + d, y + TS - d, 1, -1], [x + TS - d, y + TS - d, -1, -1]]) { ctx.moveTo(cx + sx * L, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * L); }
  ctx.stroke();
}
function drawIcon(im, x, y, box) { if (!im) return; const sc = im.height > box ? box / im.height : 1, w = im.width * sc, h = im.height * sc; ctx.drawImage(im, Math.round(x + (box - w) / 2), Math.round(y + (box - h) / 2), w, h); }
// ---------- panels ----------
function drawUnitPanel(u, x, y) {
  panel(x, y, 128, 50);
  rect(x + 4, y + 5, 40, 40, '#161a3a'); drawFace(ctx, u.sprite, x + 5, y + 6, 1);
  ctx.strokeStyle = u.team === 0 ? '#6aa0ff' : '#ff6a6a'; ctx.lineWidth = 1; ctx.strokeRect(x + 4.5, y + 5.5, 39, 39);
  text(u.name, x + 48, y + 4, { size: 9, bold: true });
  text('Lv' + u.lv + ' ' + u.cls, x + 48, y + 14, { size: 7, color: '#b8c4ff' });
  hpBar(x + 60, y + 25, 60, 4, u.vhp, u.maxhp, u.ghost);
  text('HP', x + 48, y + 23, { size: 7, color: '#ffd24a' });
  text(Math.round(u.vhp) + '/' + u.maxhp, x + 64, y + 30, { size: 7 });
  drawIcon(weaponIcon(u), x + 47, y + 37, 11); text(weaponOf(u).name, x + 60, y + 38, { size: 7, color: '#d8e0ff' });
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
  const cur = m.items[m.idx]; if (cur && cur.desc) { panel(40, 4, 240, 15, 0.92); { const ic = cur.act === 'sp' ? ICONS['i_scroll-fire'] : cur.act === 'heal' ? ICONS['i_life-pot'] : cur.act === 'attack' && G.sel ? weaponIcon(G.sel) : null; drawIcon(ic, 44, 6, 11); } text(cur.name || cur.label, 58, 8, { size: 8, bold: true, color: '#ffe860' }); text(cur.desc + (cur.off ? '(使えない)' : ''), 98, 8, { size: 8 }); }
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
    drawIcon(weaponIcon(u), cx + 42, y + 3, 11); text(weaponOf(u).name, cx + 54, y + 6, { size: 7, color: '#b8c4ff' });
    if (S.adv) text(S.adv > 0 ? '▲' : '▼', cx + 100, y + 5, { size: 8, bold: true, color: S.adv > 0 ? '#6dff8d' : '#ff7070' });
    hpBar(cx, y + 20, 56, 4, u.hp, u.maxhp, u.hp + (S.dmgTaken || 0)); text('HP ' + u.hp, cx + 60, y + 16, { size: 8 });
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
  drawAtmos(S, G.t);
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
  if (G.flashW > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (0.12 * G.flashW) + ')'; ctx.fillRect(0, 0, W, VH()); }
  drawBanner();
  if (G.auto) { const bl = Math.floor(G.t / 20) % 2; panel(W / 2 - 34, 3, 68, 14, 0.9); text('AUTO ' + (G.speedX > 1 ? '▶▶' : '▶'), W / 2, 6, { size: 8, bold: true, align: 'center', color: bl ? '#ffe27a' : '#fff' }); }
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
  drawBgImage(ctx, CH_BG[d.bg] || '19', 0.38, G.t);
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
const CH_BG = ['19', '12', '2'];
function drawDrift(n, col, seed) { // slowly drifting light motes (fireflies / embers)
  for (let i = 0; i < n; i++) {
    const sp = 0.15 + (i % 5) * 0.06, x = ((i * 53 + seed * 17 + G.t * sp) % (W + 20)) - 10, y = H - ((i * 37 + seed * 29 + G.t * (0.1 + (i % 4) * 0.05)) % (H + 20)) + 10 + Math.sin(G.t / 30 + i) * 4;
    ctx.globalAlpha = 0.35 + 0.35 * Math.sin(G.t / 17 + i * 2); ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), (i % 3 === 0) ? 2 : 1, (i % 3 === 0) ? 2 : 1);
  }
  ctx.globalAlpha = 1;
}
function logoText(txt, x, y, size) { // stylish title lettering: glow, dark outline, vertical gradient
  ctx.font = 'bold ' + size + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.save(); ctx.shadowColor = 'rgba(255,190,60,0.95)'; ctx.shadowBlur = 14; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = '#3a1200'; ctx.strokeText(txt, x, y); ctx.restore();
  ctx.lineWidth = 2; ctx.strokeStyle = '#7a3a08'; ctx.strokeText(txt, x, y);
  const g = ctx.createLinearGradient(0, y, 0, y + size); g.addColorStop(0, '#fffbd0'); g.addColorStop(0.45, '#ffd84a'); g.addColorStop(1, '#e8701a'); ctx.fillStyle = g; ctx.fillText(txt, x, y);
}
function drawTitle() {
  drawBgImage(ctx, '15', 0.3, G.t);
  drawDrift(46, '#ffe8a0', 3);
  drawHeroLine(138, 2, ['hero_knight', 'hero_archer', 'hero_mage', 'hero_healer', 'hero_thief'], true);
  const fx = 40, fy = 112; rect(fx, fy, 2, 46, '#c8b070'); const wv = Math.sin(G.t / 10) * 2; ctx.fillStyle = '#d83a3a'; ctx.beginPath(); ctx.moveTo(fx + 2, fy + 2); ctx.lineTo(fx + 24, fy + 6 + wv); ctx.lineTo(fx + 2, fy + 18); ctx.fill();
  logoText('星砕きの戦旗', W / 2, 24, 31);
  text('STARFALL TACTICS', W / 2, 64, { size: 11, bold: true, align: 'center', color: '#e8f0ff', sh: '#102050' });
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
  const c = G.card; drawBgImage(ctx, CH_BG[c.idx] || '19', 0.55, G.t); drawDrift(30, '#ffffff', 5);
  const a = Math.max(0, Math.min(1, c.t / 20, (c.dur - c.t) / 20)); ctx.globalAlpha = a;
  rect(0, 86, W, 1, 'rgba(255,230,160,0.6)'); rect(0, 150, W, 1, 'rgba(255,230,160,0.6)');
  text(c.title, W / 2, 70, { size: 12, color: '#d8e4ff', align: 'center' });
  logoText(c.name, W / 2, 94, 24);
  text('目的: ' + c.goal, W / 2, 130, { size: 9, color: '#fff', align: 'center' });
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
  drawBgImage(ctx, '3', 0.05, G.t); ctx.globalAlpha = Math.max(0, 1 - t / 200); rect(0, 0, W, H, 'rgba(0,0,30,0.55)'); ctx.globalAlpha = 1; drawDrift(30, '#fff6c0', 9);
  drawHeroLine(168, 2, ['hero_knight', 'hero_archer', 'hero_mage', 'hero_healer', 'hero_thief'], true);
  const fx = 70, fy = 120; rect(fx, fy, 2, 50, '#c8b070'); const wv = Math.sin(G.t / 10) * 2; ctx.fillStyle = '#d83a3a'; ctx.beginPath(); ctx.moveTo(fx + 2, fy + 2); ctx.lineTo(fx + 28, fy + 7 + wv); ctx.lineTo(fx + 2, fy + 20); ctx.fill();
  ENDING_TEXT.forEach((l, i) => { const a = Math.max(0, Math.min(1, (t - 40 - i * 90) / 40)); ctx.globalAlpha = a; text(l, W / 2, 20 + i * 18, { size: 9, align: 'center' }); ctx.globalAlpha = 1; });
  const a2 = Math.max(0, Math.min(1, (t - 330) / 60)); ctx.globalAlpha = a2;
  logoText('FIN', W / 2, 80, 28);
  text('プレイしてくれてありがとう!', W / 2, 210, { size: 8, align: 'center', color: '#fff' });
  text('ドット絵: Pixel-boy (CC0)  Superpowers asset packs', W / 2, 222, { size: 7, align: 'center', color: '#dde' });
  if (t > 380 && Math.floor(G.t / 25) % 2) text('決定でタイトルへ', W / 2, 232, { size: 7, align: 'center', color: '#ffe860' });
  ctx.globalAlpha = 1;
}
