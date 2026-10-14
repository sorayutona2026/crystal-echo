'use strict';
// ===== ui: drawing for map, units, panels, menus, dialogue =====
const G = {
  scene: 'boot', t: 0, roster: null, snap: null, chIdx: 0, S: null, cursor: { x: 0, y: 0 }, mode: 'idle', sel: null, reach: null, moveSet: null, threat: null, orig: null,
  menu: null, targets: [], ti: 0, fc: null, busy: 0, banner: null, fx: [], shake: 0, infoBig: false, showRange: null, endTurn: false, modal: null,
  dlg: null, speed: 1, auto: false, speedX: 1, hdUnits: true, cutin: true, title: { idx: 0 }, card: null, over: null, ending: null, lvl: null, phase: 0, hasSave: false
};
const camOn = () => Engine.zoom > 1 || !!(G.S && (G.S.w * TS > W || G.S.h * TS > H)); // camera: portrait zoom, or any map larger than the 320x240 view
const OX = () => camOn() ? 0 : Math.floor((W - G.S.w * TS) / 2), OY = () => camOn() ? 0 : Math.floor((H - G.S.h * TS) / 2);
// camera (portrait zoom): world px of the view's top-left; follows the cursor smoothly, can be panned by dragging
const Cam = { x: 0, y: 0, tx: 0, ty: 0, key: null, snap: true };
function camClamp() {
  const z = Engine.zoom, vw = W / z, vh = Engine.vh / z, mw = G.S.w * TS, mh = G.S.h * TS;
  Cam.tx = mw <= vw ? (mw - vw) / 2 : Math.max(0, Math.min(mw - vw, Cam.tx)); Cam.ty = mh <= vh ? (mh - vh) / 2 : Math.max(0, Math.min(mh - vh, Cam.ty));
}
function camUpdate() {
  if (!G.S || !camOn()) { Cam.x = Cam.y = Cam.tx = Cam.ty = 0; Cam.key = null; return; }
  const z = Engine.zoom, c = G.cursor, k = c.x + ',' + c.y;
  for (const p of Input.pans) { Cam.tx -= p.dx / z; Cam.ty -= p.dy / z; camClamp(); Cam.x = Cam.tx; Cam.y = Cam.ty; }
  Input.pans.length = 0;
  if (k !== Cam.key) { // follow the cursor only when it nears the edge of the view (keeps the map still while tapping)
    Cam.key = k; const vw = W / z, vh = Engine.vh / z, m = TS * 1.5, px = c.x * TS, py = c.y * TS;
    if (Cam.snap || px < Cam.tx + m || px + TS > Cam.tx + vw - m) Cam.tx = px + 8 - vw / 2;
    if (Cam.snap || py < Cam.ty + m || py + TS > Cam.ty + vh - m) Cam.ty = py + 8 - vh / 2;
    camClamp();
  }
  camClamp();
  if (Cam.snap) { camClamp(); Cam.x = Cam.tx; Cam.y = Cam.ty; Cam.snap = false; }
  Cam.x += (Cam.tx - Cam.x) * 0.2; Cam.y += (Cam.ty - Cam.y) * 0.2;
}
function tileScreen(x, y) { return { x: (OX() + x * TS - Cam.x) * Engine.zoom, y: (OY() + y * TS - Cam.y) * Engine.zoom }; }
const TEAMCOL = ['#4a90ff', '#ff4a4a', '#ffd24a'];
const teamRing = (t, a) => (t === 0 ? 'rgba(90,170,255,' : t === 2 ? 'rgba(90,230,120,' : 'rgba(255,90,90,') + a + ')';
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
  if (S.ch.paint) { G.paintReq = true; return; } // painted ground lives on #cvb
  if (camOn()) { ctx.fillStyle = '#10131e'; ctx.fillRect(Cam.x - 8, Cam.y - 8, W / Engine.zoom + 16, Engine.vh / Engine.zoom + 16); }
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
  if (S.ch.paint) return;
  const ox = OX(), oy = OY(), w = S.w * 16, h = S.h * 16, th = S.ch.theme;
  ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, w, h); ctx.clip();
  const lg = (c0, c1) => { const g = ctx.createLinearGradient(0, oy, 0, oy + h); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fillRect(ox, oy, w, h); };
  if (th === 'bright') lg('rgba(255,225,150,0.11)', 'rgba(255,170,90,0.05)');
  else if (th === 'mossy') lg('rgba(120,170,200,0.12)', 'rgba(60,110,140,0.10)');
  else if (th === 'mist') lg('rgba(150,200,210,0.14)', 'rgba(60,110,120,0.14)');
  else if (th === 'ash') lg('rgba(120,110,110,0.16)', 'rgba(40,30,30,0.18)');
  else if (th === 'altar') lg('rgba(110,60,190,0.16)', 'rgba(20,10,60,0.20)');
  else lg('rgba(170,60,120,0.17)', 'rgba(50,10,50,0.15)');
  const blob = (x, y, rx, ry, col) => { ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 7); ctx.fill(); ctx.restore(); };
  for (let i = 0; i < 4; i++) blob(ox + ((t * 0.14 * (1 + i * 0.25) + i * 97) % (w + 220)) - 90, oy + (i * 61 + 30) % h, 56, 26, th === 'harsh' ? 'rgba(10,0,20,0.14)' : 'rgba(0,20,40,0.10)');
  if (th === 'mossy' || th === 'mist') for (let i = 0; i < (th === 'mist' ? 6 : 3); i++) blob(ox + ((t * 0.07 * (1 + i * 0.4) + i * 120) % (w + 300)) - 150, oy + (i * 77 + 40) % h, 120, 26, th === 'mist' ? 'rgba(235,245,250,0.26)' : 'rgba(225,240,250,0.16)');
  if (th === 'harsh' || th === 'ash' || th === 'altar') for (let i = 0; i < (th === 'harsh' ? 26 : 34); i++) {
    const x = ox + ((i * 61 + t * (0.12 + (i % 3) * 0.05)) % w) + Math.sin(t / 25 + i) * 3, y = oy + h - ((i * 37 + t * (0.25 + (i % 4) * 0.08)) % (h + 20)) + 10;
    ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t / 9 + i * 3); ctx.fillStyle = th === 'altar' ? (i % 3 ? '#c27aff' : '#e8c8ff') : th === 'ash' ? (i % 3 ? '#b0a8a0' : '#ff9a3a') : (i % 3 ? '#ff9a3a' : '#ffd070'); ctx.fillRect(Math.round(x), Math.round(y), 1, 1 + (i % 4 === 0 ? 1 : 0));
  }
  ctx.globalAlpha = 1; ctx.restore();
}
// danger zone: every tile a living enemy can attack next turn (move range + weapon range, same reach rules as the AI); cached until units move / die
function dangerSet(S) {
  const sig = S.units.map(u => (u.dead || u.off ? 'x' : u.team + ':' + u.x + ',' + u.y + (u.team === 1 ? weaponOf(u).max : ''))).join('|') + (S.hts ? 'h' : '');
  if (G._dg && G._dg.sig === sig && G._dg.S === S) return G._dg.set;
  const set = new Set();
  for (const e of S.units) { if (e.team !== 1 || e.dead || e.off || !canDamage(e)) continue; const r = e.ai === 'hold' ? { stops: [{ x: e.x, y: e.y }] } : reach(S, e); for (const k of threatTiles(S, e, r)) set.add(k); }
  G._dg = { sig, S, set }; return set;
}
function drawDanger(S, ox, oy) {
  if (!G.danger || G.phase !== 0) return; const set = dangerSet(S), pulse = 0.5 + 0.5 * Math.sin(G.t / 30);
  ctx.save(); ctx.fillStyle = 'rgba(210,30,90,' + (0.24 + pulse * 0.06) + ')'; ctx.strokeStyle = 'rgba(255,110,150,0.8)'; ctx.lineWidth = 1; ctx.setLineDash([3, 2]);
  for (const k of set) { const x = k % 64, y = (k - x) / 64, px = ox + x * TS, py = oy + y * TS; ctx.fillRect(px, py, TS, TS);
    ctx.beginPath(); if (!set.has(kk(x, y - 1))) { ctx.moveTo(px, py + 0.5); ctx.lineTo(px + TS, py + 0.5); } if (!set.has(kk(x, y + 1))) { ctx.moveTo(px, py + TS - 0.5); ctx.lineTo(px + TS, py + TS - 0.5); }
    if (!set.has(kk(x - 1, y))) { ctx.moveTo(px + 0.5, py); ctx.lineTo(px + 0.5, py + TS); } if (!set.has(kk(x + 1, y))) { ctx.moveTo(px + TS - 0.5, py); ctx.lineTo(px + TS - 0.5, py + TS); } ctx.stroke(); }
  ctx.restore();
}
function drawOverlay(S) {
  const ox = OX(), oy = OY(), pulse = 0.5 + 0.5 * Math.sin(G.t / 12);
  const cell = (k, fill, line) => { const x = k % 64, y = (k - x) / 64; ctx.fillStyle = fill; ctx.fillRect(ox + x * TS, oy + y * TS, TS, TS); ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.strokeRect(ox + x * TS + 0.5, oy + y * TS + 0.5, TS - 1, TS - 1); };
  drawHeights(S, ox, oy); drawDanger(S, ox, oy);
  if ((G.mode === 'move' || G.mode === 'moving') && G.reach) {
    if (G.threat) for (const k of G.threat) if (!G.moveSet.has(k)) cell(k, 'rgba(255,60,60,' + (0.28 + pulse * 0.08) + ')', 'rgba(255,140,140,0.6)');
    for (const k of G.moveSet) { cell(k, 'rgba(40,100,255,' + (0.46 + pulse * 0.08) + ')', 'rgba(150,190,255,0.7)'); const pv = G.reach.prev.get(k); if (S.hts && pv !== undefined && htAt(S, k % 64, (k - k % 64) / 64) > htAt(S, pv % 64, (pv - pv % 64) / 64)) text('▲', ox + (k % 64) * TS + 9, oy + ((k - k % 64) / 64) * TS + 1, { size: 6, color: '#ffe9a0' }); } // tiny triangle: reached by climbing
    // path preview
    if (G.mode === 'move' && G.moveSet.has(kk(G.cursor.x, G.cursor.y)) && (G.cursor.x !== G.sel.x || G.cursor.y !== G.sel.y)) {
      const p = pathTo(G.reach, G.cursor.x, G.cursor.y); ctx.fillStyle = 'rgba(255,240,120,0.95)';
      for (const q of p) ctx.fillRect(ox + q.x * TS + 6, oy + q.y * TS + 6, 4, 4);
    }
  }
  { const hv = G.mode === 'idle' && !G.showRange && G.phase === 0 ? unitAt(S, G.cursor.x, G.cursor.y) : null, sr = G.showRange || (hv && hv.team === 1 ? hv : null); if (sr && G.mode === 'idle') { const r = reach(S, sr); for (const s of r.stops) cell(kk(s.x, s.y), 'rgba(60,110,255,0.25)', 'rgba(150,190,255,0.5)'); for (const k of threatTiles(S, sr, r)) cell(k, 'rgba(255,60,60,0.3)', 'rgba(255,140,140,0.6)'); } }
  if (G.mode === 'menu' && G.sel) { const w = weaponOf(G.sel), M = rngMax(S, G.sel, G.sel.x, G.sel.y, w); for (let dy = -M; dy <= M; dy++) for (let dx = -M; dx <= M; dx++) { const d = Math.abs(dx) + Math.abs(dy); if (d < w.min || d > M) continue; const x = G.sel.x + dx, y = G.sel.y + dy; if (inb(S, x, y)) cell(kk(x, y), w.type === 'heal' ? 'rgba(60,220,120,0.3)' : 'rgba(255,60,60,0.3)', 'rgba(255,150,150,0.6)'); } }
  if ((G.mode === 'target' || G.mode === 'forecast') && G.targets) for (const t of G.targets) cell(kk(t.x, t.y), 'rgba(255,50,50,' + (0.35 + pulse * 0.25) + ')', '#ffb0b0');
}
function unitFrame(u) { // pose row & bob
  if (u.walking) { const ph = Math.floor(G.t / 5) % 4; return { row: ph, bob: ph % 2 ? -1 : 0 }; }
  return { row: 0, bob: 0 };
}
// objective markers: treasure chests, escape exits, the village to defend
function drawMarkers(S) {
  if (!(hdOn() && ART.prop_chest)) for (const q of S.secrets || []) { if (!q.seen || q.got) continue; const x = OX() + q.x * TS + 8, y = OY() + q.y * TS + 8, ph = (G.t / 10 + q.x) % 6.28, r = 2 + Math.sin(ph) * 1.2; ctx.fillStyle = 'rgba(255,240,150,0.28)'; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); ctx.fillStyle = '#fff6c0'; ctx.fillRect(x - 1, y - r - 1, 2, 2 * r + 2); ctx.fillRect(x - r - 1, y - 1, 2 * r + 2, 2); }
  if (hdOn() && ART.prop_chest) return; // chibi display: the painted props are drawn on the hi-DPI layer (drawPropsHD)
  const ox = OX(), oy = OY(), pu = 0.5 + 0.5 * Math.sin(G.t / 14);
  for (const e of (S.ch.exits || [])) {
    const x = ox + e[0] * TS, y = oy + e[1] * TS; ctx.fillStyle = 'rgba(80,255,150,' + (0.22 + pu * 0.18) + ')'; ctx.fillRect(x, y, TS, TS);
    ctx.strokeStyle = 'rgba(160,255,200,0.9)'; ctx.lineWidth = 1; ctx.strokeRect(x + 1.5, y + 1.5, TS - 3, TS - 3);
    ctx.fillStyle = 'rgba(200,255,225,' + (0.5 + pu * 0.4) + ')'; ctx.fillRect(x + 7, y + 4, 2, 6); ctx.fillRect(x + 5, y + 6, 6, 1); ctx.fillRect(x + 6, y + 5, 4, 1);
  }
  const v = S.ch.village;
  if (v) { const x = ox + v.x * TS, y = oy + v.y * TS; ctx.fillStyle = 'rgba(255,210,80,' + (0.18 + pu * 0.14) + ')'; ctx.fillRect(x, y, TS, TS); ctx.strokeStyle = 'rgba(255,230,120,0.9)'; ctx.lineWidth = 1; ctx.strokeRect(x + 1.5, y + 1.5, TS - 3, TS - 3);
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x + 4, y + 2, 1, 11); ctx.fillStyle = '#e04040'; ctx.beginPath(); ctx.moveTo(x + 5, y + 2); ctx.lineTo(x + 12, y + 4 + Math.sin(G.t / 8)); ctx.lineTo(x + 5, y + 7); ctx.fill(); }
  for (const c of S.chests) {
    if (c.got) continue; const x = ox + c.x * TS, y = oy + c.y * TS;
    ctx.fillStyle = 'rgba(255,230,120,' + (0.10 + pu * 0.18) + ')'; ctx.beginPath(); ctx.arc(x + 8, y + 9, 9, 0, 7); ctx.fill();
    ctx.fillStyle = '#000'; ctx.fillRect(x + 2, y + 5, 12, 10); ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x + 3, y + 6, 10, 8); ctx.fillStyle = '#b07a3a'; ctx.fillRect(x + 3, y + 6, 10, 3); ctx.fillStyle = '#ffd24a'; ctx.fillRect(x + 7, y + 8, 2, 3); ctx.fillStyle = '#4a2a10'; ctx.fillRect(x + 3, y + 9, 10, 1);
    if (c.item === 'proof') { ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + pu * 0.5) + ')'; ctx.fillRect(x + 7, y + 1 + Math.round(pu * 2), 2, 2); }
  }
}
// elevation visuals: liftOf = interpolated height (bilinear while a unit glides between tiles) x3 screen px; drawHeights = the 高低 overlay
function liftOf(u) {
  const S = G.S; if (!S || !S.hts) return 0; const e = 1e-6, x0 = Math.max(0, Math.floor(u.vx + e)), y0 = Math.max(0, Math.floor(u.vy + e)), x1 = Math.min(S.w - 1, Math.ceil(u.vx - e)), y1 = Math.min(S.h - 1, Math.ceil(u.vy - e)), fx = u.vx - x0, fy = u.vy - y0;
  const a = htAt(S, x0, y0) * (1 - fx) + htAt(S, x1, y0) * fx, b = htAt(S, x0, y1) * (1 - fx) + htAt(S, x1, y1) * fx; return (a * (1 - fy) + b * fy) * 3;
}
const HT_TINT = ['rgba(0,0,0,0)', 'rgba(80,190,210,0.20)', 'rgba(220,190,70,0.26)', 'rgba(255,140,40,0.34)'];
function drawHeights(S, ox, oy) {
  if (!G.hts || !S.hts) return;
  for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) {
    if (terrAt(S, x, y).block) continue; const h = htAt(S, x, y), px = ox + x * TS, py = oy + y * TS;
    ctx.fillStyle = HT_TINT[h]; ctx.fillRect(px, py, TS, TS);
    if (h) text(String(h), px + 1, py + 1, { size: 6, bold: true, color: h >= 2 ? '#fff0c0' : '#d8ecff' });
    if (isRamp(S, x, y)) text('↗', px + 9, py + 8, { size: 7, bold: true, color: '#fff' });
  }
}
function drawUnit(u, S) {
  if (u.gone) return;
  const ox = OX(), oy = OY();
  let px = ox + u.vx * TS + (u.lx || 0) + (u.kx || 0), py = oy + u.vy * TS + (u.ly || 0) + (u.ky || 0); const lift = liftOf(u), gy = py;
  const f = unitFrame(u), fade = u.dead ? (u.fade || 0) / 30 : 1;
  const gray = u.team === 0 && u.acted && !u.acting && !(G.phase === 1) ? 'gray' : null;
  const mode = (u.flash > 0 && Math.floor(u.flash / 2) % 2 === 0) ? 'white' : gray;
  let by = 0;
  if (!u.walking && !u.dead && !(u.team === 0 && u.acted)) by = Math.round(Math.sin((G.t + (u.vx * 7 + u.vy * 13) * 5) / 22) * 0.6); // gentle breathing
  if (G.sel === u && G.mode !== 'idle') by = (Math.floor(G.t / 8) % 2) ? -1 : 0;
  const sink = u.dead ? (1 - fade) * 5 : 0;
  if (u.boss && !u.dead) { const pu = 0.5 + 0.5 * Math.sin(G.t / 14), ac = u.aura || '255,210,70', gr = ctx.createRadialGradient(px + 8, py + 9, 2, px + 8, py + 9, 17); gr.addColorStop(0, 'rgba(' + ac + ',' + (0.45 + pu * 0.2) + ')'); gr.addColorStop(1, 'rgba(' + ac + ',0)'); ctx.fillStyle = gr; ctx.fillRect(px - 10, py - 8, 36, 36); }
  // soft shadow + team ring on the ground
  ctx.fillStyle = 'rgba(0,0,0,' + 0.28 * fade + ')'; ctx.beginPath(); ctx.ellipse(px + 8 + lift * 0.5, gy + 14.5 + lift * 0.2, 7 + lift * 0.25, 2.8 + lift * 0.1, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,' + 0.18 * fade + ')'; ctx.beginPath(); ctx.ellipse(px + 8 + lift * 0.5, gy + 14.5 + lift * 0.2, 5 + lift * 0.2, 1.8 + lift * 0.08, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = teamRing(u.team, 0.85 * fade); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(px + 8, gy + 14.5, 7, 2.8, 0, 0, 7); ctx.stroke(); py -= lift;
  // team-coloured rim, then the sprite
  if (!gray && !u.dead) { ctx.globalAlpha = 0.85; ctx.drawImage(spriteRim(u.sprite, u.dir, f.row, u.team), Math.round(px) - 1, Math.round(py + f.bob + by - 1 + sink) - 1); ctx.globalAlpha = 1; }
  drawUnitSprite(ctx, u.sprite, u.dir, f.row, px, py + f.bob + by - 1 + sink, mode, fade);
  if (!u.dead) hpBar(px + 2, py + 15, 12, 2, u.vhp, u.maxhp, u.ghost);
  if (u.team === 1 && u.boss && !u.dead) text('★', px + 4, py - 8, { size: 8, color: '#ffd24a' });
  if (!u.dead && S && bondAdj(S, u)) drawIcon(ICONS['i_heart'], px + 9, py - 5 + Math.round(Math.sin(G.t / 12)), 7);
  if (u.team === 2 && !u.dead) text('!', px + 6, py - 8, { size: 9, bold: true, color: '#ffe860' });
}
function spawnSpr(name, wx, wy, o) { // sprite-sheet effect centred on a world point
  o = o || {}; if (fxHdOn() && hdFxFromSpr(name, wx, wy, o)) return; const d = FXS[name]; if (!d) return; const dur = o.dur || 3;
  G.fx.push({ kind: 'spr', d, x: wx, y: wy, vx: o.vx || 0, vy: o.vy || 0, scale: o.scale || 0.4, dur, age: 0, life: o.life || d.n * dur, flip: o.flip ? -1 : 1, rot: o.rot || 0, glow: o.glow });
}
function drawFx() {
  for (const f of G.fx) {
    if (f.kind === 'hd') { drawHdFx(f); continue; }
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
  const frozen = G.sp && G.sp.holding; let tickA = !G.hs && !frozen; if (tickA && G.slow != null && G.slow < 1) { G.slowAcc = (G.slowAcc || 0) + G.slow; if (G.slowAcc >= 1) G.slowAcc -= 1; else tickA = false; } const tickS = !G.hs && !frozen;
  for (const f of G.fx) { if (!(f.sp ? tickS : tickA)) continue; f.life--; f.age = (f.age || 0) + 1; f.x += f.vx || 0; f.y += f.vy || 0; if (f.g) f.vy += f.g; }
  for (const f of G.fx) if (f.hold != null) { f.age = f.hold; f.life = f.L; } // test hook: freeze an effect at a given age
  G.fx = G.fx.filter(f => f.life > 0);
  for (const u of G.S ? G.S.units : []) {
    if (u.flash > 0) u.flash--; if (u.dead && u.fade > 0 && u.fading && tickA) { u.fade--; if (u.fade <= 0) u.gone = true; }
    if (u.kx || u.ky) { u.kx *= 0.78; u.ky *= 0.78; if (Math.abs(u.kx) < 0.1) u.kx = 0; if (Math.abs(u.ky) < 0.1) u.ky = 0; }
    if (u.ghost != null) { if (u.ghost > u.vhp) u.ghost = Math.max(u.vhp, u.ghost - 0.18); else u.ghost = u.vhp; }
  }
  if (G.shake > 0) G.shake--; else G.shakeAmp = 0; if (G.flashW > 0) G.flashW--;
}
function drawCursor(S) {
  const c = G.cursor, ox = OX(), oy = OY(), x = ox + c.x * TS, y = oy + c.y * TS, o = Math.floor(G.t / 10) % 2;
  ctx.strokeStyle = G.mode === 'target' || G.mode === 'forecast' ? '#ff8080' : '#ffe860'; ctx.lineWidth = 1.5;
  const L = 5, d = o ? 0 : -1;
  ctx.beginPath();
  for (const [cx, cy, sx, sy] of [[x + d, y + d, 1, 1], [x + TS - d, y + d, -1, 1], [x + d, y + TS - d, 1, -1], [x + TS - d, y + TS - d, -1, -1]]) { ctx.moveTo(cx + sx * L, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * L); }
  ctx.stroke();
}
function drawIcon(im, x, y, box) { if (!im) return;
  if (im.vec) { if (HD.x && HD.collect && !G.infoPass) { hdUI(g => { g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(im, x, y, box, box); }); } else { ctx.imageSmoothingEnabled = true; ctx.drawImage(im, Math.round(x), Math.round(y), box, box); ctx.imageSmoothingEnabled = false; } return; } const sc = im.height > box ? box / im.height : 1, w = im.width * sc, h = im.height * sc; ctx.drawImage(im, Math.round(x + (box - w) / 2), Math.round(y + (box - h) / 2), w, h); }
// ---------- panels ----------
function drawUnitPanel(u, x, y) {
  panel(x, y, 128, 50);
  rect(x + 4, y + 5, 40, 40, '#161a3a'); drawPortrait(u.sprite, x + 4, y + 5, 40, u.team);
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
  const T = TERRAIN[ch], S = G.S, hh = S ? htAt(S, G.cursor.x, G.cursor.y) : 0, rp = S && isRamp(S, G.cursor.x, G.cursor.y);
  panel(x, y, 70, 36);
  if (S && S.hts) text('高さ ' + hh + (rp ? '  坂' : ''), x + 5, y + 25, { size: 7, color: hh >= 2 ? '#ffd890' : '#9fd0ff' });
  text(T.name, x + 5, y + 3, { size: 8, bold: true });
  const l = (T.avo ? '回避+' + T.avo : '') + ((T.def) ? ' 防御+' + T.def : ''); text(l || '効果なし', x + 5, y + 14, { size: 7, color: '#b8c4ff' });
  if (T.heal) text('回復20%', x + 36, y + 3, { size: 7, color: '#6f6' });
}
function drawBigInfo(u) {
  const x = 40, y = 20, w = 240, h = 168; panel(x, y, w, h, 0.96);
  const id = artOf(u); hdUI(g => { const im = ART[id] && ART[id].full; if (im) artFull(g, id, x + 40, y + h - 8, Math.min(128, im.height * 0.34), HD.k, { flip: ART_FACING[id] === 'left' }); });
  const tx = x + 84;
  text(u.name, tx, y + 7, { size: 11, bold: true }); text('Lv' + u.lv + '  ' + u.cls + (u.team === 0 ? '  EXP ' + u.exp : ''), tx, y + 22, { size: 8, color: '#b8c4ff' });
  const wp = weaponOf(u); drawIcon(weaponIcon(u), tx - 1, y + 33, 11);
  text(wp.name + (wp.type === 'heal' ? ' (回復)' : ' 威力' + wp.might + ' 射程' + wp.min + (wp.max > wp.min ? '-' + wp.max : '')), tx + 13, y + 35, { size: 7 });
  const rows = [['HP', Math.round(u.vhp) + '/' + u.maxhp], ['力', u.str], ['魔力', u.mag], ['技', u.skl], ['速さ', u.spd], ['守備', u.def], ['魔防', u.res], ['移動', u.mov]];
  rows.forEach((r, i) => { const cx = tx + (i % 2) * 74, cy = y + 52 + Math.floor(i / 2) * 15; text(r[0], cx, cy, { size: 9, color: '#ffd24a' }); text(String(r[1]), cx + 66, cy, { size: 9, align: 'right' }); });
  const sp = SP[u.key]; if (sp && u.team === 0) text('特技 ' + sp.name + (u.spUsed ? '(使用済)' : '') + ': ' + sp.desc, tx, y + 116, { size: 7, color: '#9fe8ff' });
  if (u.team === 0) {
    text('スキル ' + ((u.skills || []).length ? u.skills.map(k => SKILLS[k].name + '(' + SKILLS[k].desc + ')').join(' / ') : 'なし'), tx, y + 127, { size: 7, color: '#ffd8a0' });
    text('持ち物 ' + ((u.items || []).length ? u.items.map(k => ITEMS[k].name).join(' ') : 'なし') + (u.forge ? '   武器+' + u.forge : ''), tx, y + 138, { size: 7, color: '#d8e0ff' });
    if (G.S && G.S.bonds) { const b = []; for (const o of G.S.units) if (o !== u && o.team === 0 && !o.dead) { const lv = bondLevel(G.S.bonds[bondKey(u.key, o.key)] || 0); if (lv) b.push(o.name + BOND_RANK[lv]); } if (b.length) text('絆 ' + b.join(' '), tx, y + 149, { size: 7, color: '#ff9fc0' }); }
  }
  text('Aキーで閉じる', x + w - 6, y + h - 10, { size: 7, align: 'right', color: '#889' });
}
function drawMenu(m) {
  const cur = m.items[m.idx]; if (cur && cur.desc) { panel(40, 4, 240, 15, 0.92); { const ic = cur.act === 'sp' ? vecIcon('tome') : cur.act === 'heal' ? vecIcon('potion') : cur.act === 'attack' && G.sel ? weaponIcon(G.sel) : null; drawIcon(ic, 44, 6, 11); } text(cur.name || cur.label, 58, 8, { size: 8, bold: true, color: '#ffe860' }); text(cur.desc + (cur.off ? '(使えない)' : ''), 98, 8, { size: 8 }); }
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
  const x = 44, w = 232, h = 74, y = fc.top ? 4 : VH() - h - 4; panel(x, y, w, h, 0.95);
  Touch.add(x, y, w, h, () => Input.q.push('ok'));
  const side = (S, cx) => {
    const u = S.u; text(u.name, cx, y + 4, { size: 9, bold: true, color: u.team === 0 ? '#9fc4ff' : '#ff9f9f' });
    drawIcon(weaponIcon(u), cx + 42, y + 3, 11); text(weaponOf(u).name, cx + 54, y + 6, { size: 7, color: '#b8c4ff' });
    if (S.hi > 0 || (S.hi < 0 && weaponOf(u).type !== 'mag')) text(S.hi > 0 ? '▲高所' : '▼低所', cx + 70, y + 41, { size: 8, bold: true, color: S.hi > 0 ? '#ffd890' : '#8fb4ff' });
    if (S.adv) text(S.adv > 0 ? '▲' : '▼', cx + 100, y + 5, { size: 8, bold: true, color: S.adv > 0 ? '#6dff8d' : '#ff7070' });
    hpBar(cx, y + 20, 56, 4, u.hp, u.maxhp, u.hp + (S.dmgTaken || 0)); text('HP ' + u.hp, cx + 60, y + 16, { size: 8 });
    if (S.can) {
      text('ダメージ', cx, y + 28, { size: 8 }); text(S.dmg + (S.n > 1 ? '×2' : ''), cx + 62, y + 27, { size: 10, bold: true, align: 'right', color: S.n > 1 ? '#ffe860' : '#fff' });
      text('命中', cx + 68, y + 28, { size: 8 }); text(S.hit + '%', cx + 108, y + 27, { size: 10, bold: true, align: 'right' });
      text('必殺', cx, y + 41, { size: 8 }); text(S.crit + '%', cx + 62, y + 40, { size: 10, bold: true, align: 'right', color: S.crit >= 10 ? '#ffe860' : '#fff' });
    } else text('反撃できない', cx, y + 30, { size: 8, color: '#889' });
  };
  side(fc.a, x + 6); rect(x + w / 2, y + 5, 1, h - 24, '#4a58a8'); side(fc.d, x + w / 2 + 6);
  rect(x + 6, y + h - 17, w - 12, 13, '#1f6a3a'); ctx.strokeStyle = '#7fe0a0'; ctx.strokeRect(x + 6.5, y + h - 16.5, w - 13, 12);
  text((G.spMode ? SP[G.sel.key].name : '攻撃') + 'する(もう一度タップ / 決定ボタン)', x + w / 2, y + h - 15, { size: 8, bold: true, align: 'center' });
}
const VH = () => Engine.vh || H;
function drawBanner() {
  if (G.banner && HD.collect) HD.holes.push([0, VH() / 2 - 17, W, 34]);
  const b = G.banner; if (!b) return; const t = b.t;
  const inT = Math.min(1, t / 12), outT = Math.min(1, (b.dur - t) / 12), k = Math.min(inT, outT), h = 32 * k;
  ctx.fillStyle = b.color; ctx.globalAlpha = 0.9; ctx.fillRect(0, VH() / 2 - h / 2, W, h); ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(0, VH() / 2 - h / 2, W, 1); ctx.fillRect(0, VH() / 2 + h / 2 - 1, W, 1);
  if (k > 0.8) { const off = (1 - Math.min(1, t / 16)) * 60; ctx.globalAlpha = Math.min(1, outT * 2); text(b.text, W / 2 + off, VH() / 2 - 10, { size: 18, bold: true, align: 'center' }); ctx.globalAlpha = 1; }
}
function drawLevelUp(L) {
  const x = 16, y = 22, w = 288, h = 164; panel(x, y, w, h, 0.97);
  const id = artOf(L.unit); hdUI(g => { const im = ART[id] && ART[id].full; if (im) artFull(g, id, x + 46, y + h - 8, Math.min(130, im.height * 0.36), HD.k, { flip: ART_FACING[id] === 'left' }); });
  const tx = x + 96;
  text('LEVEL UP!', tx + 90, y + 6, { size: 14, bold: true, color: '#ffe860', align: 'center' });
  text(L.unit.name, tx, y + 26, { size: 11, bold: true }); text(L.unit.cls, tx + 64, y + 29, { size: 8, color: '#b8c4ff' });
  text('Lv ' + (L.up.lv - 1) + ' → ' + L.up.lv, tx, y + 42, { size: 10, bold: true, color: '#9fe8ff' });
  const names = [['hp', 'HP'], ['str', '力'], ['mag', '魔力'], ['skl', '技'], ['spd', '速さ'], ['def', '守備'], ['res', '魔防']];
  names.forEach(([k, n], i) => {
    const cx = tx + (i % 2) * 96, cy = y + 62 + Math.floor(i / 2) * 15, up = L.up.gains[k];
    if (up) rect(cx - 3, cy - 1, 92, 14, 'rgba(255,230,80,0.18)');
    text(n, cx, cy, { size: 9, color: '#ffd24a' }); text(String(L.up.before[k]), cx + 40, cy, { size: 9, align: 'right', color: up ? '#fff' : '#aab' });
    text('→', cx + 46, cy, { size: 8, color: '#889' }); text(String(L.up.after[k]), cx + 66, cy, { size: 9, align: 'right', bold: !!up, color: up ? '#ffe860' : '#aab' });
    if (up && Math.floor(G.t / 8) % 2) text('+1', cx + 70, cy, { size: 8, bold: true, color: '#6f6' });
  });
  text('決定で閉じる', x + w - 8, y + h - 11, { size: 7, align: 'right', color: '#889' });
}
function objText(S) {
  const ch = S.ch, foes = alive(S).filter(u => u.team === 1).length;
  if (ch.win === 'defend') return '村を守れ  あと' + Math.max(0, ch.turns - S.turn + 1) + 'ターン';
  if (ch.win === 'escape') { const n = alive(S).filter(u => u.team === 0).length; return '脱出 ' + S.escaped + '/' + (S.escaped + n); }
  if (ch.win === 'boss') { const b = S.units.find(u => u.boss); return (b ? b.name : '敵将') + (b && !b.dead ? ' HP' + b.hp : ' 撃破'); }
  return '敵を全滅  残り' + foes;
}
function drawPhaseLabel(S, x, y) {
  panel(x, y, 100, 24, 0.85);
  const tn = S.ch.win === 'defend' ? 'ターン' + Math.min(S.turn, S.ch.turns) + '/' + S.ch.turns : 'ターン' + S.turn;
  text(tn + (G.phase === 0 ? ' 自軍' : ' 敵軍') + (G.undoLeft != null && G.phase === 0 ? '  ↺' + G.undoLeft : ''), x + 5, y + 3, { size: 8, bold: true, color: G.phase === 0 ? '#9fc4ff' : '#ff9f9f' });
  text(objText(S), x + 5, y + 13, { size: 7, color: '#ffe27a' });
}
function cursorUnit() { const S = G.S; return unitAt(S, G.cursor.x, G.cursor.y) || (G.sel && G.sel.x === G.cursor.x && G.sel.y === G.cursor.y ? G.sel : null); }
// portrait phones: unit/terrain/phase info lives in a separate canvas below the map so it never covers the field
function drawInfoCanvas() {
  const S = G.S, main = ctx; ctx = cv2.getContext('2d'); ctx.setTransform(K, 0, 0, K, 0, 0); ctx.imageSmoothingEnabled = false; G.infoPass = true; HD.collect = false;
  rect(0, 0, W, INFO_H, '#0b0b14'); ctx.fillStyle = '#2a3070'; ctx.fillRect(0, 0, W, 1);
  if (S) {
    const cu = cursorUnit();
    if (cu) drawUnitPanel(cu, 4, 5); else { panel(4, 5, 128, 50, 0.6); text('マスをタップして', 12, 17, { size: 8, color: '#889' }); text('ユニットを選択', 12, 29, { size: 8, color: '#889' }); }
    drawPhaseLabel(S, 140, 5); drawTerrainPanel(140, 33, S.rows[G.cursor.y][G.cursor.x]);
    text('味方 ' + alive(S).filter(u => u.team === 0).length + '  敵 ' + alive(S).filter(u => u.team === 1).length, 246, 8, { size: 8 });
    if (cu) {
      const rows = [['力', cu.str], ['魔力', cu.mag], ['技', cu.skl], ['速さ', cu.spd], ['守備', cu.def], ['魔防', cu.res], ['移動', cu.mov], ['射程', weaponOf(cu).min + (weaponOf(cu).max > weaponOf(cu).min ? '-' + weaponOf(cu).max : '')]];
      rows.forEach((r, i) => { const cx = 6 + (i % 4) * 52, cy = 62 + Math.floor(i / 4) * 13; text(r[0], cx, cy, { size: 8, color: '#ffd24a' }); text(String(r[1]), cx + 46, cy, { size: 8, align: 'right' }); });
      const sp = SP[cu.key]; if (sp && cu.team === 0) text('特技 ' + sp.name + (cu.spUsed ? '(使用済)' : '') + ' : ' + sp.desc, 6, 97, { size: 7, color: cu.spUsed ? '#778' : '#9fe8ff' });
    }
    if (cu && (cu.skills || []).length) text('スキル ' + cu.skills.map(k => SKILLS[k].name).join('・'), 6, 86, { size: 7, color: '#ffd8a0' });
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
  const col = { '.': '#6a9a3a', '=': '#a08a60', 'T': '#2f6a2a', '^': '#8a6a4a', '~': '#3a8ab0', '#': '#707080', 'M': '#6a6a72', 'V': '#d8c070', 'F': '#6a4a2a', 'H': '#8a3a2a' };
  rect(x0 - 1, y0 - 1, mw + 2, mh + 2, '#000');
  for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) rect(x0 + x * t, y0 + y * t, t, t, col[S.rows[y][x]] || '#5a4a3a');
  for (const u of alive(S)) rect(x0 + u.x * t, y0 + u.y * t, t, t, u.team === 0 ? '#5ab0ff' : (u.boss ? '#ffd24a' : '#ff4a4a'));
  if (camOn()) { const z = Engine.zoom; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(Math.round(x0 + Cam.x / TS * t) + 0.5, Math.round(y0 + Cam.y / TS * t) + 0.5, W / z / TS * t, Engine.vh / z / TS * t); }
}
window.minimapTap = (x, y) => {
  if (!G.S || !camOn() || !MM.ox) return; const tx = (x - MM.ox) / MM.t, ty = (y - MM.oy) / MM.t; if (tx < -1 || ty < -1 || tx > G.S.w + 1 || ty > G.S.h + 1) return;
  const z = Engine.zoom; Cam.tx = tx * TS - W / z / 2; Cam.ty = ty * TS - Engine.vh / z / 2; camClamp(); Cam.key = G.cursor.x + ',' + G.cursor.y;
};
function drawBattle() {
  const S = G.S; if (!S) return;
  ctx.save();
  G.shx = G.shake > 0 ? (Math.random() - 0.5) * (G.shakeAmp || 3) : 0; G.shy = G.shake > 0 ? (Math.random() - 0.5) * (G.shakeAmp || 3) : 0; ctx.translate(G.shx, G.shy);
  if (camOn()) { ctx.scale(Engine.zoom, Engine.zoom); ctx.translate(-Cam.x, -Cam.y); }
  drawMap(S, G.t); drawOverlay(S); drawMarkers(S);
  const hd = hdOn();
  if (!hd) { const us = S.units.filter(u => !u.gone && !u.invis).sort((a, b) => a.vy - b.vy); for (const u of us) drawUnit(u, S); drawFx(); }
  drawAtmos(S, G.t);
  if (!hd && G.mode !== 'busyhide') drawCursor(S);
  ctx.restore();
  if (G.sp) spDimDraw();
  const left = G.cursor.x >= 10; // flip panels away from the cursor
  const cu = cursorUnit();
  if (G.mode !== 'forecast' && !Engine.port) {
    drawPhaseLabel(S, left ? 4 : W - 100, 4);
    drawTerrainPanel(left ? 4 : W - 74, 30, S.rows[G.cursor.y][G.cursor.x]);
    if (cu && !G.infoBig && !G.dlg) drawUnitPanel(cu, left ? 4 : W - 132, H - 54);
  }
  if (G.infoBig && cu) drawBigInfo(cu);
  if (G.mode === 'menu' && G.menu) drawMenu(G.menu);
  if (G.mode === 'sysmenu' && G.menu) drawMenu(G.menu);
  if (G.mode === 'forecast' && G.fc) drawForecast(G.fc);
  if (G.lvl) drawLevelUp(G.lvl);
  if (G.dlg) drawDialogueBox(G.dlg, VH() - H);
  if (G.flashW > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (0.12 * G.flashW) + ')'; ctx.fillRect(0, 0, W, VH()); }
  drawBanner();
  if (G.auto) { const bl = Math.floor(G.t / 20) % 2; panel(W / 2 - 34, 3, 68, 14, 0.9); text('AUTO ' + (G.speedX > 1 ? '▶▶' : '▶'), W / 2, 6, { size: 8, bold: true, align: 'center', color: bl ? '#ffe27a' : '#fff' }); }
}
// ---------- dialogue / scenes ----------
function drawDialogueBox(d, dy) {
  const sp = d.line[0] ? SPEAKERS[d.line[0]] : null; dy = dy || 0;
  const bx = sp ? 86 : 16, bw = sp ? 222 : 288, by = 170 + dy, bh = 62;
  if (sp) { rect(8, 150 + dy, 76, 76, '#0c0e24'); drawPortrait(sp.face, 8, 150 + dy, 76, sp.foe ? 1 : 0); }
  panel(bx, by, bw, bh, 0.92);
  if (sp) { panel(bx + 6, by - 8, tw(sp.name, 9) + 14, 14, 1); text(sp.name, bx + 13, by - 5, { size: 9, bold: true, color: '#ffe860' }); }
  const all = wrapText(d.line[1], bw - 20, 9); let left = d.n;
  all.forEach((l, i) => { const part = l.slice(0, Math.max(0, left)); left -= l.length; if (part) text(part, bx + 10, by + 9 + i * 14, { size: 9 }); });
  if (d.n >= d.line[1].length && Math.floor(G.t / 20) % 2) text('▼', bx + bw - 14, by + bh - 12, { size: 8, color: '#ffe860' });
  if (d.tip) text('決定: 次へ', W - 8, 6 + dy, { size: 7, align: 'right', color: '#889' });
}
function drawDialogue() {
  const d = G.dlg; if (!d) return;
  useBg(d.bg || 'village', 0.38);
  drawDialogueBox(d);
}
function skyGrad(c1, c2, y0, y1) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0); }
function drawStars(n, seed) { let s = seed; for (let i = 0; i < n; i++) { s = (s * 16807) % 2147483647; const x = s % W; s = (s * 16807) % 2147483647; const y = s % 130; const tw2 = (Math.floor(G.t / 20 + i) % 3 === 0) ? 0.4 : 1; ctx.fillStyle = 'rgba(255,255,230,' + 0.8 * tw2 + ')'; ctx.fillRect(x, y, 1, 1); } }
function drawHills(dark, base, amp) { ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 4) ctx.lineTo(x, base - Math.sin(x / 37) * amp - Math.sin(x / 13 + 1) * amp * 0.3); ctx.lineTo(W, H); ctx.fill(); }
function drawHeroLine(y, scale, ids, wiggle) {
  ctx.imageSmoothingEnabled = false;
  const n = ids.length, gap = 40; let x0 = W / 2 - (n * gap) / 2 + (gap - 16 * scale) / 2;
  ids.forEach((id, i) => { const bob = wiggle ? Math.round(Math.sin(G.t / 18 + i) * 1) : 0; const c = spriteVariant(id, 'down', 0, null); ctx.drawImage(c, Math.round(x0 + i * gap), y + bob, 16 * scale, 16 * scale); });
}
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
  useBg('title', 0.1);
  drawDrift(46, '#ffe8a0', 3);
  if (ART.leon) hdUI(g => { const ids = ['leon', 'mira', 'luka', 'sophia', 'jin'], xs = [60, 110, 160, 210, 260], hs = { leon: 0.235, mira: 0.235, luka: 0.26, sophia: 0.24, jin: 0.27 }; ids.forEach((id, i) => { const im = ART[id].full, h = im.height * hs[id], bob = Math.sin(G.t / 30 + i) * 1; g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(xs[i], 176, 22, 4, 0, 0, 7); g.fill(); artFull(g, id, xs[i], 176 + bob, h, HD.k, {}); }); });
  else drawHeroLine(138, 2, ['hero_knight', 'hero_archer', 'hero_mage', 'hero_healer', 'hero_thief'], true);
  logoText('星砕きの戦旗', W / 2, 24, 31);
  text('STARFALL TACTICS', W / 2, 64, { size: 11, bold: true, align: 'center', color: '#e8f0ff', sh: '#102050' });
  const items = G.title.items;
  items.forEach((it, i) => {
    const y = 180 + i * 18, sel = i === G.title.idx; const w = 100;
    if (sel) { rect(W / 2 - w / 2, y - 2, w, 16, 'rgba(70,90,200,0.8)'); text('▶', W / 2 - w / 2 + 4, y + 1, { size: 9, color: '#ffe860' }); }
    else rect(W / 2 - w / 2, y - 2, w, 16, 'rgba(0,0,20,0.45)');
    text(it.label, W / 2, y + 1, { size: 10, bold: true, align: 'center', color: it.off ? '#778' : '#fff' });
    Touch.add(W / 2 - w / 2, y - 2, w, 16, () => { G.title.idx = i; Input.q.push('ok'); });
  });
  { const tb = Math.max(towerBestLS(), G.meta ? towerMeta(G.meta).best : 0); if (tb > 0) text('試練の塔 最高 ' + tb + '階', W / 2, 78, { size: 9, bold: true, align: 'center', color: '#ffe27a', sh: '#302000' }); }
  text('矢印+Z / タップで決定', W / 2, 228, { size: 7, align: 'center', color: '#aab' });
}
function drawCard() {
  const c = G.card; useBg(c.bg, 0.5); drawDrift(30, '#ffffff', 5);
  const a = Math.max(0, Math.min(1, c.t / 20, (c.dur - c.t) / 20)); ctx.globalAlpha = a;
  rect(0, 86, W, 1, 'rgba(255,230,160,0.6)'); rect(0, 150, W, 1, 'rgba(255,230,160,0.6)');
  text(c.title, W / 2, 70, { size: 12, color: '#d8e4ff', align: 'center' });
  logoText(c.name, W / 2, 94, 24);
  text('目的: ' + c.goal, W / 2, 130, { size: 9, color: '#fff', align: 'center' });
  ctx.globalAlpha = 1;
}
function drawGameOver() {
  rect(0, -(G.yOff || 0), W, Engine.vh, '#1a0508'); skyGrad('#2a0a10', '#0a0204', 0, H);
  text('敗  北', W / 2, 50, { size: 28, bold: true, color: '#e04040', align: 'center', sh: '#300' });
  text(G.why ? '理由: ' + G.why : '旗は折れた…。だが、まだ終わりではない。', W / 2, 96, { size: 9, align: 'center', color: '#dbb' });
  G.title.items.forEach((it, i) => {
    const y = 130 + i * 20, sel = i === G.title.idx, w = 130;
    if (sel) { rect(W / 2 - w / 2, y - 2, w, 17, 'rgba(160,50,50,0.8)'); text('▶', W / 2 - w / 2 + 4, y + 1, { size: 9, color: '#ffe860' }); }
    text(it.label, W / 2, y + 2, { size: 10, bold: true, align: 'center' });
    Touch.add(W / 2 - w / 2, y - 2, w, 17, () => { G.title.idx = i; Input.q.push('ok'); });
  });
}
function drawTowerChoice() {
  const T = G.tower; rect(0, -(G.yOff || 0), W, Engine.vh, '#0a0e22'); skyGrad('#1a2250', '#070a18', 0, H); drawDrift(26, '#ffe8a0', 4);
  text('試練の塔', W / 2, 22, { size: 11, color: '#c8d4ff', align: 'center' });
  text(T.f + '階 突破!', W / 2, 40, { size: 24, bold: true, color: '#ffe860', align: 'center', sh: '#402800' });
  panel(24, 82, 272, 14 + T.lines.length * 13, 0.85); T.lines.forEach((l, i) => text(l, W / 2, 88 + i * 13, { size: 8, align: 'center', color: i === 1 && l.indexOf('手に入れた') > 0 ? '#9fe8ff' : '#e8ecff' }));
  G.title.items.forEach((it, i) => {
    const y = 140 + i * 22, sel = i === G.title.idx, w = 150;
    rect(W / 2 - w / 2, y - 2, w, 18, sel ? 'rgba(70,92,210,0.9)' : 'rgba(0,0,20,0.55)'); if (sel) text('▶', W / 2 - w / 2 + 4, y + 2, { size: 9, color: '#ffe860' });
    text(it.label, W / 2, y + 2, { size: 11, bold: true, align: 'center' });
    Touch.add(W / 2 - w / 2, y - 2, w, 18, () => { G.title.idx = i; Input.q.push('ok'); });
  });
  text('次の階はHP3割回復で続行。帰還すると金貨を持ち帰れる(敗北すると金貨は失う)', W / 2, 190, { size: 7, align: 'center', color: '#9aa8e0' });
}
const ENDING_FIN = 840;
function drawEnding() {
  const e = G.ending, t = e.t; useBg('village', 0.42); drawDrift(30, '#fff6c0', 9);
  const fa = (t0, len) => Math.max(0, Math.min(1, (t - t0) / (len || 40)));
  ENDING_TEXT.forEach((l, i) => { ctx.globalAlpha = fa(30 + i * 70); text(l, W / 2, 12 + i * 15, { size: 9, align: 'center', color: '#fff4c8' }); });
  EPILOGUE.forEach(([id, line], i) => {
    const y = 46 + i * 30; ctx.globalAlpha = fa(170 + i * 110, 50); if (ctx.globalAlpha <= 0) return;
    panel(10, y, 300, 27, 0.7); rect(13, y + 2, 23, 23, '#0c0e24'); drawPortrait(SPEAKERS[id].face, 13, y + 2, 23, 0);
    const ls = wrapText(line, 258, 8); ls.slice(0, 2).forEach((l, k) => text(l, 42, y + 3 + k * 11, { size: 8 }));
  });
  ctx.globalAlpha = fa(170 + 5 * 110 + 30, 50); text(ENDING_LAST, W / 2, 200, { size: 9, align: 'center', color: '#ffe27a' });
  ctx.globalAlpha = fa(ENDING_FIN - 40, 60); logoText('FIN', W / 2, 212, 20);
  ctx.globalAlpha = 1;
  if (t > ENDING_FIN + 40 && Math.floor(G.t / 25) % 2) text('決定でタイトルへ', W - 8, 230, { size: 7, align: 'right', color: '#ffe860' });
  ctx.globalAlpha = 1;
}

// ---------- hi-DPI overlay: map units drawn from the painted full-body art ----------
const hdOn = () => !!(HD.x && ART.leon && ART.leon.chibi && G.hdUnits !== false);
function chibiStyle(u, id) { // which chibi + size/tint for a unit: generic priests = darker Verza, Volk = purple Verza, bosses bigger
  let rel = 1, variant = null;
  if (u.sprite === 'enemy_darkmage') { if (u.key === 'verza') rel = 1.12; else if (u.key === 'volk') { rel = 1.1; variant = 'purple'; } else { rel = 0.94; variant = 'dark'; } }
  else if (u.boss) rel = 1.12;
  return { rel, variant };
}
function drawUnitHD(u) {
  if (u.gone) return; const id = artOf(u), im = ART[id]; if (!im || !im.chibi) return;
  const ox = OX(), oy = OY(), f = unitFrame(u), fade = u.dead ? (u.fade || 0) / 30 : 1;
  const px = ox + u.vx * TS + (u.lx || 0) + (u.kx || 0), gy = oy + u.vy * TS + (u.ly || 0) + (u.ky || 0), lift = liftOf(u), py = gy - lift;
  const acted = u.team === 0 && u.acted && !u.acting && !(G.phase === 1);
  let by = 0; if (!u.walking && !u.dead && !acted) by = Math.sin((G.t + (u.vx * 7 + u.vy * 13) * 5) / 22) * 0.5; if (G.sel === u && G.mode !== 'idle') by = (Math.floor(G.t / 8) % 2) ? -1.5 : 0;
  const sink = u.dead ? (1 - fade) * 5 : 0, cx = px + 8, foot = py + 14.5;
  if (u.dir === 'left' || u.dir === 'right') u.hface = u.dir; if (!u.hface) u.hface = u.team === 0 ? 'right' : 'left';
  const st = chibiStyle(u, id), h = TS * 1.5 * (im.chibi.height / 192) * st.rel, flash = u.flash > 0 && Math.floor(u.flash / 2) % 2 === 0;
  const breath = (u.walking || u.dead || acted) ? 1 : 1 + 0.018 * Math.sin((G.t + (u.vx * 5 + u.vy * 9) * 7) / 20);
  if (u.boss && !u.dead) { const pu = 0.5 + 0.5 * Math.sin(G.t / 14), ac = u.aura || '255,210,70', gr = ctx.createRadialGradient(cx, foot - h * 0.45, 2, cx, foot - h * 0.45, h * 0.9); gr.addColorStop(0, 'rgba(' + ac + ',' + (0.38 + pu * 0.2) + ')'); gr.addColorStop(1, 'rgba(' + ac + ',0)'); ctx.fillStyle = gr; ctx.fillRect(cx - h, foot - h * 1.5, h * 2, h * 1.7); }
  const rw = u.boss ? 10.5 : 8.5, gf = gy + 14.5; // shadow + ring stay on the ground; high ground gives a longer, softer shadow
  ctx.fillStyle = 'rgba(0,0,0,' + (0.34 - lift * 0.02) * fade + ')'; ctx.beginPath(); ctx.ellipse(cx + lift * 0.5, gf - 0.5 + lift * 0.2, rw + lift * 0.3, 3 + lift * 0.12, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = teamRing(u.team, 0.95 * fade); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.ellipse(cx, gf - 0.5, rw, 3, 0, 0, 7); ctx.stroke();
  const ppu = HD.k * (camOn() ? Engine.zoom : 1), variant = flash ? 'white' : acted ? 'gray' : st.variant;
  artChibi(ctx, id, cx, foot + f.bob * 0.6 + by + sink, h, ppu, { flip: u.hface === 'right', alpha: fade, variant, sy: breath });
  if (!u.dead) hpBar(px + 2, py + 16, 12, 2, u.vhp, u.maxhp, u.ghost);
  if (u.team === 1 && u.boss && !u.dead) text('★', px + 4, py - h + 12, { size: 8, color: '#ffd24a' });
  if (!u.dead && G.S && bondAdj(G.S, u)) drawIcon(ICONS['i_heart'], px + 9, py - h + 10 + Math.sin(G.t / 12), 7);
  if (u.team === 2 && !u.dead) text('!', px + 6, py - h + 8, { size: 9, bold: true, color: '#ffe860' });
}
// painted props (chests, exit banners, village flag): y-sorted with the chibis, base on the tile
function propDraw(id, cx, bottom, h, o) {
  const im = ART[id] && ART[id].full; if (!im) return; o = o || {}; const w = h * im.width / im.height, ppu = HD.k * (camOn() ? Engine.zoom : 1), c = hdScaled(id, 'full', w * ppu, h * ppu); if (!c) return;
  ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; ctx.translate(cx, bottom); if (o.skew) ctx.transform(1, 0, o.skew, 1, 0, 0); if (o.sc) ctx.scale(o.sc[0], o.sc[1]); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(c, -w / 2, -h, w, h); ctx.restore();
}
function propItems(S) {
  const ox = OX(), oy = OY(), t = G.t, L = [], pu = 0.5 + 0.5 * Math.sin(t / 22);
  for (const e of (S.ch.exits || [])) { const cx = ox + e[0] * TS + 8, by = oy + e[1] * TS + 14, ph = (e[0] * 3 + e[1]) * 0.7;
    L.push({ y: e[1] - 0.2, fn: () => { const sw = Math.sin(t / 30 + ph); propDraw('prop_exit', cx, by, 26, { skew: sw * 0.018, alpha: 0.86 + pu * 0.14, sc: [1 + pu * 0.025, 1 + pu * 0.025] }); } }); }
  const v = S.ch.village; if (v) L.push({ y: v.y - 0.2, fn: () => propDraw('prop_village', ox + v.x * TS + 8, oy + v.y * TS + 14, 26, { skew: Math.sin(t / 26) * 0.02 }) });
  for (const q of S.secrets || []) { if (!q.seen || q.got) continue; const cx = ox + q.x * TS + 8, cy = oy + q.y * TS + 9, ph = (q.x * 5 + q.y * 3) * 0.9;
    L.push({ y: q.y + 0.3, fn: () => { // painted-style sparkle: soft warm glow, a slowly turning four-point star and a few drifting motes
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const a = 0.55 + 0.45 * Math.sin(t / 14 + ph);
      glowDot(cx, cy, 11 + a * 2, '#ffd86a', 0.34 + a * 0.2); ctx.translate(cx, cy - 1); ctx.rotate(Math.sin(t / 40 + ph) * 0.35); star4(0, 0, 6.2 + a * 2.6, '#fff4b8', 0.75 + a * 0.25); star4(0, 0, 3.2, '#ffffff', 0.95); ctx.rotate(0.785); star4(0, 0, 3.4 + a, '#ffe9a0', 0.55);
      ctx.rotate(-0.785 - Math.sin(t / 40 + ph) * 0.35); for (let i = 0; i < 4; i++) { const k = ((t / 50 + i * 0.25 + ph) % 1), ax = Math.sin(i * 2.4 + ph) * 8 * k, ay = -k * 11; glowDot(ax, ay, 2.2, '#fff0a8', (1 - k) * 0.85); }
      ctx.restore(); } }); }
  for (const c of S.chests) {
    if (c.got && !c.openT) { /* picked up, animation not started: still closed */ }
    const cx = ox + c.x * TS + 8, by = oy + c.y * TS + 14;
    if (!c.got) L.push({ y: c.y - 0.1, fn: () => { const g = (0.10 + pu * 0.16); ctx.fillStyle = 'rgba(255,226,120,' + g + ')'; ctx.beginPath(); ctx.ellipse(cx, by - 5, 9, 8, 0, 0, 7); ctx.fill(); propDraw('prop_chest', cx, by, 17.5); } });
    else if (c.openT) { const age = t - c.openT; if (age > 100) continue;
      L.push({ y: c.y - 0.1, fn: () => { const pop = age < 14 ? 1 + 0.18 * Math.sin(age / 14 * Math.PI) : 1, fade = age > 80 ? 1 - (age - 80) / 20 : 1, ar = Math.min(1, age / 8);
        if (age < 30) { const gr = ctx.createRadialGradient(cx, by - 8, 1, cx, by - 8, 20); gr.addColorStop(0, 'rgba(255,240,150,' + 0.8 * (1 - age / 30) + ')'); gr.addColorStop(1, 'rgba(255,200,60,0)'); ctx.fillStyle = gr; ctx.fillRect(cx - 22, by - 30, 44, 44); }
        propDraw('prop_chest', cx, by, 17.5, { alpha: (1 - ar) * fade }); propDraw('prop_chest_open', cx, by, 19, { alpha: ar * fade, sc: [pop, pop] }); } }); }
    else if (!c.got) { }
  }
  return L;
}
function hdBattlePass() {
  const S = G.S, z = camOn() ? Engine.zoom : 1, cx0 = camOn() ? Cam.x : 0, cy0 = camOn() ? Cam.y : 0, k = HD.k, g = HD.x, main = ctx;
  g.setTransform(k * z, 0, 0, k * z, (-cx0 + (G.shx || 0) / z) * k * z, (-cy0 + (G.shy || 0) / z) * k * z); ctx = g; g.imageSmoothingEnabled = true;
  const items = S.units.filter(q => !q.gone && !q.invis).map(q => ({ y: q.vy, fn: () => drawUnitHD(q) })).concat(propItems(S)); items.sort((a, b) => a.y - b.y); for (const it of items) it.fn();
  drawFx(); if (G.mode !== 'busyhide') drawCursor(S);
  ctx = main;
}
function hdRender() {
  if (!HD.x) return; const g = HD.x; if (G.t % 15 === 0 || !HD.synced) { syncHD(); HD.synced = true; }
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, HD.cv.width, HD.cv.height);
  if (G.scene === 'battle' && G.S && hdOn()) hdBattlePass();
  g.setTransform(1, 0, 0, 1, 0, 0); const k = HD.k;
  for (const h of HD.holes) g.clearRect(Math.floor(h[0] * k), Math.floor(h[1] * k), Math.ceil(h[2] * k) + 1, Math.ceil(h[3] * k) + 1);
  g.setTransform(k, 0, 0, k, 0, (G.yOff || 0) * k); for (const fn of HD.ui) fn(g);
  if (G.cut) drawCutinHD(g);
  if (G.sp) drawSpHD(g);
  HD.holes.length = 0; HD.ui.length = 0;
}

// ---------- attack cut-in (overlay) ----------
function drawCutinHD(g) {
  const c = G.cut, t = c.t, vh = VH(), mid = vh / 2, inK = Math.min(1, t / 7), outK = Math.min(1, (c.total - t) / 7), k = Math.max(0, Math.min(inK, outK));
  g.save(); g.setTransform(HD.k, 0, 0, HD.k, 0, 0);
  g.fillStyle = 'rgba(0,0,12,' + 0.5 * k + ')'; g.fillRect(0, 0, W, vh);
  const bh = 150 * k, y0 = mid - bh / 2, gr = g.createLinearGradient(0, y0, 0, y0 + bh); gr.addColorStop(0, 'rgba(22,28,80,0.95)'); gr.addColorStop(0.5, 'rgba(10,12,40,0.97)'); gr.addColorStop(1, 'rgba(22,28,80,0.95)');
  g.fillStyle = gr; g.fillRect(0, y0, W, bh); g.fillStyle = '#ffd24a'; g.fillRect(0, y0, W, 1.5); g.fillRect(0, y0 + bh - 1.5, W, 1.5);
  g.save(); g.beginPath(); g.rect(0, y0, W, bh); g.clip(); g.globalAlpha = 0.12; g.fillStyle = '#fff';
  for (let i = 0; i < 8; i++) { const xx = ((i * 53 + t * 14) % (W + 60)) - 30; g.fillRect(xx, y0, 18, bh); } g.restore();
  const A = c.a, D = c.d, aLeft = A.team === 0, base = mid + 50;
  const drawOne = (u, side, role) => {
    const id = artOf(u), im = ART[id]; if (!im) return; const h = Math.max(54, Math.min(176, im.full.height * 0.5)) * k;
    let cx = side < 0 ? 84 : 236, off = (1 - inK) * side * 170;
    if (role === 'a') { const lg = t < c.imp ? Math.max(0, (t - 7) / (c.imp - 7)) : Math.max(0, 1 - (t - c.imp) / 8); off += -side * 34 * lg; }
    if (role === 'd' && t >= c.imp && t < c.imp + 14) off += Math.sin((t - c.imp) * 2.2) * 5 * (1 - (t - c.imp) / 14);
    const white = role === 'd' && c.ev.hit && t >= c.imp && t < c.imp + 3, fade = role === 'd' && c.ev.kill && t > c.imp + 12 ? Math.max(0, 1 - (t - c.imp - 12) / 14) : 1;
    const nat = ART_FACING[id], want = side < 0 ? 'right' : 'left';
    g.save(); g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(cx + off, base, h * 0.28, 5, 0, 0, 7); g.fill(); g.restore();
    artFull(g, id, cx + off, base, h, HD.k, { flip: nat !== want, variant: white ? 'white' : null, alpha: fade });
    // HP bar + name
    if (k > 0.9) { const bx = cx + off - 36; g.fillStyle = '#000'; g.fillRect(bx - 1, base + 6, 74, 7); g.fillStyle = '#2a2a3a'; g.fillRect(bx, base + 7, 72, 5);
      const r = Math.max(0, Math.min(1, u.vhp / u.maxhp)); g.fillStyle = hpColor(r); g.fillRect(bx, base + 7, 72 * r, 5); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(bx, base + 7, 72 * r, 2);
      g.font = 'bold 9px ' + FONT; g.textBaseline = 'top'; g.textAlign = 'left'; g.fillStyle = '#000'; g.fillText(u.name + '  HP ' + Math.round(u.vhp), bx + 1, base + 15); g.fillStyle = '#fff'; g.fillText(u.name + '  HP ' + Math.round(u.vhp), bx, base + 14); }
  };
  drawOne(aLeft ? A : D, -1, aLeft ? 'a' : 'd'); drawOne(aLeft ? D : A, 1, aLeft ? 'd' : 'a');
  // slash + damage number on the defender
  if (t >= c.imp) {
    const dx = aLeft ? 236 : 84, tt = t - c.imp; cutFxDraw(g, c, tt, dx, base - 60, aLeft);
    const txt = c.ev.hit ? String(c.ev.dmg) : 'MISS', pop = tt < 8 ? 1 + (8 - tt) * 0.12 : 1, yy = base - 150 - Math.min(12, tt * 1.2);
    g.font = 'bold ' + (c.ev.hit ? 26 : 18) * pop + 'px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'top'; g.lineWidth = 4; g.lineJoin = 'round'; g.strokeStyle = '#000'; g.strokeText(txt, dx, yy); g.fillStyle = c.ev.hit ? (c.ev.def.team === 0 ? '#ff8080' : '#fff') : '#c8d0ff'; g.fillText(txt, dx, yy);
    if (c.ev.kill && tt > 4) { g.font = 'bold 12px ' + FONT; g.lineWidth = 3; g.strokeText('撃破!', dx, yy + 30); g.fillStyle = '#ffe860'; g.fillText('撃破!', dx, yy + 30); }
  }
  g.restore();
}
// ---------- boss reveal (chapter 3) ----------
function drawIntro() {
  const t = G.intro.t;
  useBg('fort', 0.5); drawDrift(34, '#ff8a50', 11);
  ctx.fillStyle = 'rgba(255,40,30,' + Math.max(0, 0.55 - t / 24) + ')'; ctx.fillRect(0, 0, W, H);
  const k = Math.min(1, t / 26), e = 1 - Math.pow(1 - k, 3);
  hdUI(g => {
    const cx = W * 0.7 + (1 - e) * 90, bottom = 236, h = 214 * (0.88 + 0.12 * e), gr = g.createRadialGradient(cx, bottom - h * 0.5, 10, cx, bottom - h * 0.5, 130);
    gr.addColorStop(0, 'rgba(255,200,60,' + 0.45 * e + ')'); gr.addColorStop(1, 'rgba(255,120,0,0)'); g.fillStyle = gr; g.fillRect(cx - 140, bottom - h - 40, 280, h + 60);
    artFull(g, 'garud', cx, bottom, h, HD.k, { alpha: e });
  });
  const a = Math.min(1, Math.max(0, (t - 20) / 16)); ctx.globalAlpha = a;
  rect(0, 96, 190, 1, 'rgba(255,210,100,0.8)'); rect(0, 142, 190, 1, 'rgba(255,210,100,0.8)');
  text('黒き軍勢', 22, 70, { size: 10, color: '#ffb0a0' }); logoText2('金角将軍', 96, 100, 24); text('ガルド', 22, 150, { size: 14, bold: true, color: '#ffe27a' });
  ctx.globalAlpha = 1;
  if (t > 40 && Math.floor(G.t / 25) % 2) text('決定でスキップ', 8, 226, { size: 7, color: '#bbb' });
}
function logoText2(txt, x, y, size) { ctx.font = 'bold ' + size + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.save(); ctx.shadowColor = 'rgba(255,120,40,0.9)'; ctx.shadowBlur = 12; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2a0800'; ctx.strokeText(txt, x, y); ctx.restore(); const g = ctx.createLinearGradient(0, y, 0, y + size); g.addColorStop(0, '#fff6c8'); g.addColorStop(1, '#e0a020'); ctx.fillStyle = g; ctx.fillText(txt, x, y); }
