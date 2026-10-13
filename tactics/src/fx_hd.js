'use strict';
// ===== painted-style combat FX (hi-DPI layer, additive) + vector weapon icons =====
// FX are plain G.fx entries {kind:'hd', type, ...}; drawFx() draws them on the hd canvas in chibi display mode (the pixel sprite FX stay for the ドット mode).
const fxHdOn = () => G.scene === 'battle' && typeof hdOn === 'function' && hdOn();
function hdPush(o) { if (G.fx.length > 260) return; o.kind = 'hd'; if (G.sp) o.sp = true; o.age = 0; o.vx = o.vx || 0; o.vy = o.vy || 0; if (!o.seed) { o.seed = []; for (let i = 0; i < 14; i++) o.seed.push(Math.random()); } G.fx.push(o); }
const FXCOL = { sword: '#bfe6ff', axe: '#ffb868', dagger: '#d4ffd0', spear: '#fff0a8', gold: '#fff0a8', bow: '#fff6c8', tome: '#8fc8ff', dark: '#c47aff', fire: '#ff9a40', heal: '#8dffb0' };
const fxCol = () => { const a = G.fxA; return (a && FXCOL[a.wpn]) || '#bfe6ff'; };
// public spawners (positions are map-logical px)
function fxSlash(x, y, ang, kind) {
  const C = FXCOL[kind] || '#bfe6ff';
  if (kind === 'dagger') { hdPush({ type: 'slash', x, y, ang: ang + 0.25, R: 8, sweep: 1.5, W: 3, col: C, life: 11, dir: 1 }); hdPush({ type: 'slash', x, y, ang: ang - 0.25, R: 8, sweep: 1.5, W: 3, col: C, life: 15, delay: 4, dir: -1 }); }
  else if (kind === 'axe') hdPush({ type: 'slash', x, y, ang, R: 13, sweep: 2.5, W: 6.5, col: C, life: 17, dir: 1 });
  else hdPush({ type: 'slash', x, y, ang, R: 11.5, sweep: 2.1, W: 4.4, col: C, life: 14, dir: 1 });
  fxSpark(x, y, kind === 'axe' ? 12 : 9, C);
}
function fxThrust(x, y, ang, kind) { hdPush({ type: 'thrust', x, y, ang, col: FXCOL[kind] || '#fff0a8', life: 13 }); fxSpark(x, y, 9, FXCOL[kind] || '#fff0a8'); }
function fxSpark(x, y, R, col, o) { hdPush(Object.assign({ type: 'spark', x, y, R: R || 9, col: col || '#ffe9a0', life: 16 }, o || {})); }
function fxArrow(x0, y0, x1, y1) { hdPush({ type: 'arrow', x: x0, y: y0, x0, y0, x1, y1, life: 9 }); }
function fxOrb(x, y, vx, vy, col, life) { hdPush({ type: 'orb', x, y, vx, vy, col, life: life || 8 }); }
function fxBloom(x, y, col, R) { hdPush({ type: 'bloom', x, y, R: R || 15, col, life: 22 }); fxSpark(x, y, (R || 15) * 0.8, col, { life: 18 }); }
function fxMeteor(x, y) { hdPush({ type: 'meteor', x, y, life: 36 }); }
function fxHeal(x, y, big) { hdPush({ type: 'heal', x, y, big, life: big ? 52 : 44 }); }
function fxCross(x, y) { hdPush({ type: 'cross', x, y, life: 30 }); }
// map the old sprite-sheet effect names to the painted ones (called from spawnSpr in chibi mode)
function hdFxFromSpr(name, x, y, o) {
  const a = G.fxA, ang = o.ang != null ? o.ang : (o.flip ? Math.PI : 0), kind = a ? a.wpn : 'sword';
  switch (name) {
    case 'rpg_1': fxBloom(x, y, o.aoe ? FXCOL.fire : fxCol(), o.aoe ? 12 : 14); return true;
    case 'rpg_3': fxThrust(x, y, ang, kind); return true;
    case 'rpg_5': fxSlash(x, y, ang, 'axe'); return true;
    case 'rpg_10': if (o.bow) fxSpark(x, y, 8, FXCOL.bow, { life: 12 }); else fxSlash(x, y, ang, 'dagger'); return true;
    case 'rpg_4': fxSlash(x, y, ang, 'sword'); return true;
    case 'nin_5': return true;
    case 'rpg_9': fxOrb(x, y, o.vx, o.vy, fxCol(), 9); return true;
    case 'rpg_11': fxMeteor(x, y + 4); return true;
    case 'rpg_7': fxHeal(x, y, false); return true;
    case 'rpg_12': fxCross(x, y); fxHeal(x, y, true); return true;
    case 'nin_18': fxSpark(x, y, 20, '#ffd890', { life: 22 }); return true;
  }
  return false;
}
const ease = p => 1 - (1 - p) * (1 - p);
function glowDot(x, y, r, col, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,' + a + ')'); g.addColorStop(0.35, hexA(col, a * 0.8)); g.addColorStop(1, hexA(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')'; }
function star4(x, y, r, col, a) { ctx.fillStyle = hexA(col, a); ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.22, y - r * 0.22); ctx.lineTo(x + r, y); ctx.lineTo(x + r * 0.22, y + r * 0.22); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.22, y + r * 0.22); ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.22, y - r * 0.22); ctx.closePath(); ctx.fill(); }
function drawHdFx(f) {
  const t = f.age, L = f.life, p = Math.min(1, t / L); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (f.type) {
    case 'slash': {
      const tt = t - (f.delay || 0); if (tt < 0) break; const LL = L - (f.delay || 0), pp = Math.min(1, tt / LL), q = Math.min(1, pp / 0.4), al = Math.max(0, 1 - Math.max(0, (pp - 0.3) / 0.7));
      const R = f.R, cx = f.x - Math.cos(f.ang) * R * 0.5, cy = f.y - Math.sin(f.ang) * R * 0.5, N = 16;
      for (const [pw, pa, c] of [[1.5, 0.28, f.col], [0.8, 0.8, f.col], [0.34, 1, '#ffffff']]) {
        ctx.fillStyle = c === '#ffffff' ? 'rgba(255,255,255,' + al * pa + ')' : hexA(c, al * pa); ctx.beginPath();
        const out = [], inn = [];
        for (let i = 0; i <= N; i++) { const s = i / N * q, th = f.ang + f.dir * (s - 0.5) * f.sweep, w = f.W * pw * Math.sin(Math.PI * Math.min(1, 0.06 + 0.94 * i / N * 0.92)) * 0.5;
          out.push([cx + Math.cos(th) * (R + w), cy + Math.sin(th) * (R + w)]); inn.push([cx + Math.cos(th) * (R - w), cy + Math.sin(th) * (R - w)]); }
        ctx.moveTo(out[0][0], out[0][1]); for (const q2 of out) ctx.lineTo(q2[0], q2[1]); for (let i = inn.length - 1; i >= 0; i--) ctx.lineTo(inn[i][0], inn[i][1]); ctx.closePath(); ctx.fill();
      }
      break; }
    case 'thrust': {
      const dx = Math.cos(f.ang), dy = Math.sin(f.ang), q = Math.min(1, p / 0.35), al = Math.max(0, 1 - Math.max(0, (p - 0.3) / 0.7)), hx = f.x + dx * (-18 + 20 * q), hy = f.y + dy * (-18 + 20 * q), len = 6 + 22 * q;
      for (const [w, a, c] of [[3.2, 0.3, f.col], [1.8, 0.8, f.col], [0.8, 1, '#ffffff']]) { ctx.fillStyle = c === '#ffffff' ? 'rgba(255,255,255,' + al * a + ')' : hexA(c, al * a); ctx.beginPath(); ctx.moveTo(hx + dx * 3, hy + dy * 3); ctx.lineTo(hx - dx * len - dy * w, hy - dy * len + dx * w); ctx.lineTo(hx - dx * len + dy * w, hy - dy * len - dx * w); ctx.closePath(); ctx.fill(); }
      break; }
    case 'spark': {
      const e = ease(p), al = (1 - p) * (1 - p), n = 9; glowDot(f.x, f.y, f.R * (0.5 + 0.6 * e), f.col, 0.85 * al);
      ctx.strokeStyle = hexA(f.col, al); ctx.lineWidth = Math.max(0.3, 1.5 * (1 - p));
      for (let i = 0; i < n; i++) { const th = (i / n) * 6.283 + f.seed[i] * 0.6, r0 = f.R * 0.25 * e, r1 = f.R * (0.35 + 0.9 * e) * (0.7 + f.seed[i + 3] * 0.5); ctx.beginPath(); ctx.moveTo(f.x + Math.cos(th) * r0, f.y + Math.sin(th) * r0); ctx.lineTo(f.x + Math.cos(th) * r1, f.y + Math.sin(th) * r1); ctx.stroke(); }
      break; }
    case 'arrow': {
      const e = Math.min(1, p / 0.9), hx = f.x0 + (f.x1 - f.x0) * e, hy = f.y0 + (f.y1 - f.y0) * e, dx = f.x1 - f.x0, dy = f.y1 - f.y0, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, tl = Math.min(18, d * e), al = p > 0.9 ? 1 - (p - 0.9) * 10 : 1;
      const g = ctx.createLinearGradient(hx - ux * tl, hy - uy * tl, hx, hy); g.addColorStop(0, 'rgba(255,240,180,0)'); g.addColorStop(1, 'rgba(255,246,200,' + 0.95 * al + ')');
      ctx.strokeStyle = g; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(hx - ux * tl, hy - uy * tl); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,' + al + ')'; ctx.beginPath(); ctx.moveTo(hx + ux * 2.5, hy + uy * 2.5); ctx.lineTo(hx - ux * 1 - uy * 1.4, hy - uy * 1 + ux * 1.4); ctx.lineTo(hx - ux * 1 + uy * 1.4, hy - uy * 1 - ux * 1.4); ctx.fill(); break; }
    case 'orb': {
      const al = p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1; for (let k = 4; k >= 1; k--) glowDot(f.x - f.vx * k * 0.9, f.y - f.vy * k * 0.9, 5 - k * 0.8, f.col, 0.35 * al); glowDot(f.x, f.y, 7.5, f.col, 0.95 * al); break; }
    case 'bloom': {
      const e = ease(p), al = (1 - p); glowDot(f.x, f.y, f.R * (0.5 + 0.9 * e), f.col, 0.8 * al * al + 0.1 * al);
      ctx.strokeStyle = hexA(f.col, al * 0.9); ctx.lineWidth = 1.6 * (1 - p) + 0.3; ctx.beginPath(); ctx.ellipse(f.x, f.y + 3, f.R * 1.1 * e, f.R * 0.62 * e, 0, 0, 7); ctx.stroke(); break; }
    case 'meteor': {
      const FALL = 7;
      if (t < FALL) { const e = t / FALL, sx = f.x - 34, sy = f.y - 62, hx = sx + (f.x - sx) * e, hy = sy + (f.y - sy) * e, g = ctx.createLinearGradient(hx - 26 * (1 - e * 0.3), hy - 40, hx, hy);
        g.addColorStop(0, 'rgba(255,120,30,0)'); g.addColorStop(1, 'rgba(255,200,90,0.9)'); ctx.strokeStyle = g; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hx - 24 * (1 - e * 0.3), hy - 38); ctx.lineTo(hx, hy); ctx.stroke(); glowDot(hx, hy, 11, '#ff8a30', 1); break; }
      const u = (t - FALL) / (L - FALL), e = ease(u), al = 1 - u;
      glowDot(f.x, f.y - 2, 24 * (0.4 + 0.8 * e), '#ff9040', 0.9 * al * al + 0.1 * al);
      ctx.strokeStyle = hexA('#ffc060', al); ctx.lineWidth = 2.4 * (1 - u) + 0.4; ctx.beginPath(); ctx.ellipse(f.x, f.y + 3, 26 * e, 14 * e, 0, 0, 7); ctx.stroke();
      ctx.strokeStyle = hexA('#fff0c0', al * 0.7); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(f.x, f.y + 3, 16 * e, 8.5 * e, 0, 0, 7); ctx.stroke();
      const tt = t - FALL; for (let i = 0; i < 12; i++) { const th = f.seed[i] * 6.283, sp = 0.5 + f.seed[(i + 5) % 14] * 1.1, ex = f.x + Math.cos(th) * sp * tt, ey = f.y - 2 + Math.sin(th) * sp * tt * 0.6 - tt * 0.9 + tt * tt * 0.045; ctx.fillStyle = hexA(i % 3 ? '#ffb050' : '#fff0b0', al * 1.1); ctx.beginPath(); ctx.arc(ex, ey, 1.1 * (1 - u * 0.6), 0, 7); ctx.fill(); }
      break; }
    case 'heal': {
      const n = f.big ? 14 : 10; if (!f.big || true) { const c = Math.min(1, t / 6) * (1 - p) ; if (c > 0) { glowDot(f.x, f.y + 2, 11, '#7dffa0', 0.45 * c); } }
      for (let i = 0; i < n; i++) { const dl = f.seed[i] * 12, tt = t - dl; if (tt < 0) continue; const lifeP = tt / (L - dl); if (lifeP > 1) continue; const a = Math.sin(Math.PI * lifeP), x = f.x - 8 + f.seed[(i + 3) % 14] * 16 + Math.sin(tt / 6 + i) * 1.6, y = f.y + 6 - tt * (0.35 + f.seed[(i + 7) % 14] * 0.35);
        star4(x, y, (1.4 + f.seed[(i + 1) % 14] * 1.6) * (f.big ? 1.2 : 1), i % 2 ? '#b8ffd0' : '#ffeaa0', a * 0.95); }
      break; }
    default: if (typeof SPFX !== 'undefined' && SPFX[f.type]) SPFX[f.type](f, t, L, p); break;
    case 'cross': {
      const e = ease(Math.min(1, p / 0.4)), al = Math.sin(Math.PI * p), s = 9 * (0.6 + 0.5 * e); glowDot(f.x, f.y - 6, 14, '#ffe9a0', 0.4 * al);
      ctx.fillStyle = 'rgba(255,240,170,' + 0.55 * al + ')'; ctx.fillRect(f.x - 1.1, f.y - 6 - s, 2.2, s * 2); ctx.fillRect(f.x - s, f.y - 7.1, s * 2, 2.2); ctx.fillStyle = 'rgba(255,255,255,' + al + ')'; ctx.fillRect(f.x - 0.6, f.y - 6 - s * 0.8, 1.2, s * 1.6); ctx.fillRect(f.x - s * 0.8, f.y - 6.6, s * 1.6, 1.2); break; }
  }
  ctx.restore();
}
// ---------- vector weapon / item icons (hi-DPI, one consistent style: dark outline, 2-tone fill, highlight) ----------
const VICON = {};
function vecIcon(kind) {
  if (VICON[kind]) return VICON[kind]; const S = 128, c = cvs(S, S), g = c.getContext('2d'); g.scale(S / 64, S / 64); g.lineJoin = 'round'; g.lineCap = 'round';
  const OUT = '#12142e', shape = (fill, f, lw) => { g.beginPath(); f(); g.lineWidth = lw || 5; g.strokeStyle = OUT; g.stroke(); g.fillStyle = fill; g.fill(); };
  const poly = pts => () => { g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); };
  const line = (x0, y0, x1, y1, col, w) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.strokeStyle = col; g.lineWidth = w; g.stroke(); };
  const tilt = f => { g.save(); g.translate(32, 32); g.rotate(Math.PI / 4); f(); g.restore(); };   // item drawn upright, tip toward the upper right
  const GOLD = '#f0c040', GOLD2 = '#b58418', WOOD = '#8a5a30', WOOD2 = '#5e3a1c', STEEL = '#dce8f6', STEEL2 = '#8fa6c4';
  if (kind === 'sword') tilt(() => { shape(STEEL2, poly([[-5, 10], [-5, -22], [0, -31], [5, -22], [5, 10]])); shape(STEEL, poly([[-5, 10], [-5, -22], [0, -31], [0, 10]]), 0.1); shape(GOLD, poly([[-13, 10], [13, 10], [13, 15], [-13, 15]])); shape(WOOD, poly([[-3, 15], [3, 15], [3, 25], [-3, 25]])); shape(GOLD, () => g.arc(0, 27, 3.6, 0, 7)); line(-1.5, -24, -1.5, 6, '#fff', 1.6); });
  else if (kind === 'spear' || kind === 'gold') tilt(() => { const hc = kind === 'gold' ? '#ffe27a' : STEEL; shape(WOOD, poly([[-2, -12], [2, -12], [2, 30], [-2, 30]])); shape(kind === 'gold' ? '#d6a020' : STEEL2, poly([[-8, -8], [0, -34], [8, -8], [0, -13]])); shape(hc, poly([[0, -34], [0, -13], [-8, -8]]), 0.1); shape(GOLD, poly([[-4, -9], [4, -9], [4, -5], [-4, -5]])); shape('#c83a3a', poly([[2, 4], [11, 9], [2, 12]]), 3); });
  else if (kind === 'axe') tilt(() => { shape(WOOD, poly([[-2.5, -24], [2.5, -24], [2.5, 30], [-2.5, 30]])); shape(STEEL2, () => { g.moveTo(2, -26); g.bezierCurveTo(22, -28, 26, -2, 2, 2); g.lineTo(2, -26); }); shape(STEEL, () => { g.moveTo(2, -26); g.bezierCurveTo(14, -26, 18, -16, 12, -12); g.lineTo(2, -14); }, 0.1); shape(GOLD, poly([[-4, 24], [4, 24], [4, 28], [-4, 28]]), 3); });
  else if (kind === 'dagger') tilt(() => { shape(STEEL2, poly([[-4, 6], [-4, -12], [0, -24], [4, -12], [4, 6]])); shape(STEEL, poly([[-4, 6], [-4, -12], [0, -24], [0, 6]]), 0.1); shape(GOLD, poly([[-9, 6], [9, 6], [9, 10], [-9, 10]])); shape('#3a4a8a', poly([[-3, 10], [3, 10], [3, 20], [-3, 20]])); shape(GOLD, () => g.arc(0, 22, 3, 0, 7)); });
  else if (kind === 'bow') { g.save(); g.translate(32, 32); g.rotate(-0.1); shape('none', () => { g.moveTo(-8, -28); g.quadraticCurveTo(16, 0, -8, 28); }, 7); g.beginPath(); g.moveTo(-8, -28); g.quadraticCurveTo(16, 0, -8, 28); g.strokeStyle = WOOD; g.lineWidth = 4; g.stroke(); g.beginPath(); g.moveTo(-6, -22); g.quadraticCurveTo(10, -6, 4, -2); g.strokeStyle = '#c08850'; g.lineWidth = 1.2; g.stroke(); line(-8, -28, -8, 28, '#f4f0d8', 1.4); shape(STEEL, poly([[-14, 0], [14, -1.5], [20, 0], [14, 1.5]]), 3); shape('#c83a3a', poly([[-14, 0], [-19, -4], [-12, 0], [-19, 4]]), 2); g.restore(); }
  else if (kind === 'tome' || kind === 'dark') { const A = kind === 'dark' ? '#5a2a8a' : '#2a5ac8', A2 = kind === 'dark' ? '#8a52c8' : '#4a86f0', RUNE = kind === 'dark' ? '#e0b0ff' : '#bfe6ff'; shape(A, poly([[12, 8], [50, 8], [50, 52], [12, 52]]), 5); shape(A2, poly([[12, 8], [50, 8], [50, 30], [12, 30]]), 0.1); shape('#f4ecd0', poly([[16, 52], [50, 52], [50, 56], [16, 56]]), 3); shape(GOLD, poly([[12, 8], [20, 8], [20, 52], [12, 52]]), 2.5); star4Path(g, 35, 30, 9, RUNE); }
  else if (kind === 'staff') tilt(() => { shape(WOOD, poly([[-2.4, -12], [2.4, -12], [2.4, 30], [-2.4, 30]])); shape(GOLD, () => { g.moveTo(-8, -18); g.lineTo(-3, -10); g.lineTo(3, -10); g.lineTo(8, -18); g.lineTo(4, -14); g.lineTo(-4, -14); g.closePath(); }, 4); shape('#7dffb0', () => g.arc(0, -22, 7, 0, 7)); g.beginPath(); g.arc(-2, -24, 2.4, 0, 7); g.fillStyle = '#fff'; g.fill(); });
  else if (kind === 'potion') { shape('#d84a5a', () => { g.moveTo(24, 24); g.lineTo(24, 30); g.bezierCurveTo(10, 36, 12, 56, 32, 56); g.bezierCurveTo(52, 56, 54, 36, 40, 30); g.lineTo(40, 24); g.closePath(); }); shape('#ff8a96', () => { g.moveTo(24, 36); g.bezierCurveTo(14, 40, 16, 54, 30, 55); g.lineTo(30, 36); g.closePath(); }, 0.1); shape('#c8e8f4', poly([[26, 12], [38, 12], [38, 26], [26, 26]]), 4); shape(WOOD, poly([[25, 7], [39, 7], [39, 13], [25, 13]]), 3.5); g.beginPath(); g.arc(23.5, 44, 1.8, 0, 7); g.fillStyle = '#fff'; g.fill(); }
  else if (kind === 'heart') { shape('#ff5a7a', () => { g.moveTo(32, 54); g.bezierCurveTo(4, 36, 10, 10, 26, 14); g.bezierCurveTo(30, 15, 32, 18, 32, 20); g.bezierCurveTo(32, 18, 34, 15, 38, 14); g.bezierCurveTo(54, 10, 60, 36, 32, 54); }); }
  c.vec = true; return VICON[kind] = c;
}
function star4Path(g, x, y, r, col) { g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * 0.3, y - r * 0.3); g.lineTo(x + r, y); g.lineTo(x + r * 0.3, y + r * 0.3); g.lineTo(x, y + r); g.lineTo(x - r * 0.3, y + r * 0.3); g.lineTo(x - r, y); g.lineTo(x - r * 0.3, y - r * 0.3); g.closePath(); g.fillStyle = col; g.fill(); }
