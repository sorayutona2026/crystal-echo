// ===================== HD HERO SPRITES (64x80 pixel art, shown at 32x40 on the 2x world layer) =====================
// Each pose is painted with vector shapes in hard-banded tones (cel shading), then every pixel is snapped to a small palette and
// given a dark outline, so the result reads as pixel art with twice the dots of the old 32x40 sprites.
const HB_W = 32, HB_H = 40;         // logical size on screen
const HBS = 2;                      // sprite density relative to that size
const HW = HB_W * HBS, HH = HB_H * HBS;
const HERO_STYLE = {
  allen: { skin: '#f7d0a8', iris: '#3a86e6', hair: '#8a4e22', top: '#2f62d6', legs: '#2e3a66', boots: '#6e4220', kind: 'tunic', weapon: 'sword', cape: '#c42c38' },
  lina: { skin: '#f9d9bc', iris: '#2ea978', hair: '#d07a3a', top: '#f6f2ec', legs: '#f6f2ec', boots: '#a86a3a', kind: 'robe', weapon: 'staff', gem: '#e84a58', trim: '#d8303e' },
  kai: { skin: '#e9b98c', iris: '#9a6420', hair: '#4a2e1a', top: '#eee2be', legs: '#3a5a40', boots: '#5a3418', kind: 'tunic', weapon: 'dagger', scarf: '#2e9a44' },
  zek: { skin: '#f5dccc', iris: '#9a40e0', hair: '#b8bedc', top: '#6a2ea4', legs: '#4e1e78', boots: '#2a1440', kind: 'robe', weapon: 'staff', gem: '#b060ff', trim: '#e8c440' },
};
// body pose: head offset, torso lean, legs, arms (shoulder -> hand), weapon angle, face
const HPOSE = {
  idle: { dx: 0, dy: 0, legs: 'stand', fa: [28, 31, 20, 47], ba: [36, 31, 41, 47], ang: -1.15, face: 'open' },
  walk: { dx: 0, dy: 0, legs: 'run', fa: [28, 31, 17, 40], ba: [36, 31, 44, 46], ang: 1.0, face: 'open' },
  strike: { dx: -3, dy: 1, legs: 'lunge', fa: [27, 32, 10, 38], ba: [37, 32, 44, 42], ang: -0.12, face: 'shout' },
  cast: { dx: 0, dy: 0, legs: 'stand', fa: [28, 31, 15, 25], ba: [36, 31, 40, 46], ang: 1.57, face: 'open' },
  hurt: { dx: 4, dy: 2, legs: 'stand', fa: [28, 33, 36, 51], ba: [37, 33, 44, 47], ang: -2.7, face: 'hurt' },
  win: { dx: 0, dy: -1, legs: 'stand', fa: [28, 31, 21, 15], ba: [36, 31, 44, 44], ang: 1.57, face: 'happy' },
  kneel: { dx: 0, dy: 9, legs: 'kneel', fa: [28, 40, 22, 56], ba: [36, 40, 40, 56], ang: -0.9, face: 'open' },
};
function hdHero(id, poseName) {
  const L = HERO_STYLE[id], P = HPOSE[poseName === 'ko' ? 'hurt' : poseName];
  const c = mkCanvas(HW, HH), x = c.getContext('2d', { willReadFrequently: true }); x.lineJoin = 'round'; x.lineCap = 'round';
  const dx = P.dx, dy = P.dy, robe = L.kind === 'robe';
  const shd = (col, k) => { const a = col.startsWith('rgb') ? col.match(/\d+/g).map(Number) : hex(col); return `rgb(${clamp(Math.round(a[0] * k), 0, 255)},${clamp(Math.round(a[1] * k), 0, 255)},${clamp(Math.round(a[2] * k), 0, 255)})`; };
  const bands = (g, lt, base, dk) => { g.addColorStop(0, lt); g.addColorStop(0.28, lt); g.addColorStop(0.3, base); g.addColorStop(0.66, base); g.addColorStop(0.68, dk); g.addColorStop(1, dk); };
  const mkp = pts => () => { x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.closePath(); };
  const mkc = segs => () => { x.beginPath(); x.moveTo(segs[0][0], segs[0][1]); for (let i = 1; i < segs.length; i++) { const s = segs[i]; if (s.length === 4) x.quadraticCurveTo(...s); else if (s.length === 6) x.bezierCurveTo(...s); else x.lineTo(...s); } x.closePath(); };
  const shape = (mk, base, o = {}) => { mk(); const g = x.createLinearGradient(o.gx0 ?? 0, o.gy0 ?? 0, o.gx1 ?? HW, o.gy1 ?? 0); bands(g, o.lt || shd(base, 1.25), base, o.dk || shd(base, 0.64)); x.fillStyle = g; x.fill(); x.lineWidth = o.lw || 1; x.strokeStyle = o.line || shd(base, 0.34); x.stroke(); };
  const ell = (cx, cy, rx, ry, base, o) => shape(() => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); }, base, o);
  const limb = (x0, y0, x1, y1, w, base, o = {}) => { const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a) * w / 2, ny = Math.cos(a) * w / 2; shape(mkp([x0 + nx, y0 + ny, x1 + nx * 0.8, y1 + ny * 0.8, x1 - nx * 0.8, y1 - ny * 0.8, x0 - nx, y0 - ny]), base, { gx0: x0 + nx, gy0: y0 + ny, gx1: x0 - nx, gy1: y0 - ny, ...o }); };
  const hand = (hx, hy) => ell(hx, hy, 2.3, 2.3, L.skin, { line: shd(L.skin, 0.4) });
  const line = (a, b, c2, d, col, w) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(a, b); x.lineTo(c2, d); x.stroke(); };
  const T = (px_, py_) => [px_ + dx, py_ + dy]; // body-relative point
  x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(32 + dx * 0.4, 77, 15, 3.2, 0, 0, 7); x.fill();
  // ---- behind the body: cape, scarf, long hair, hood back ----
  if (L.cape) { const s = P.legs === 'run' || P.legs === 'lunge' ? 6 : 0; shape(mkc([[36 + dx, 27 + dy], [46 + dx + s, 30 + dy, 52 + dx + s, 48, 50 + dx + s * 1.4, 64], [47 + dx + s, 70, 41 + dx, 69, 37 + dx, 66], [39 + dx, 54, 39 + dx, 40, 36 + dx, 27 + dy]]), L.cape, { gx0: 36, gx1: 52 }); }
  if (L.scarf) { const s = P.legs === 'run' || P.legs === 'lunge' ? 5 : 0; shape(mkc([[36 + dx, 23 + dy], [46 + dx + s, 20 + dy - s * 0.4, 54 + dx + s, 24 + dy - s * 0.6, 58 + dx + s, 31 + dy - s * 0.3], [52 + dx + s, 30 + dy, 46 + dx, 30 + dy, 40 + dx, 30 + dy], [38 + dx, 28 + dy, 36 + dx, 26 + dy, 36 + dx, 23 + dy]]), L.scarf, { gx0: 36, gx1: 58 }); }
  if (id === 'zek') shape(mkc([[34 + dx, 8 + dy], [46 + dx, 8 + dy, 52 + dx, 24 + dy, 50 + dx, 44 + dy], [48 + dx, 50 + dy, 44 + dx, 52 + dy, 40 + dx, 48 + dy], [42 + dx, 36 + dy, 38 + dx, 24 + dy, 34 + dx, 8 + dy]]), L.hair, { gx0: 34, gx1: 52, lt: '#eef0ff', dk: '#8a90b8' });
  if (id === 'lina') shape(mkc([[36 + dx, 18 + dy], [46 + dx, 20 + dy, 47 + dx, 34 + dy, 43 + dx, 44 + dy], [38 + dx, 46 + dy, 33 + dx, 40 + dy, 34 + dx, 30 + dy], [34 + dx, 24 + dy, 34 + dx, 20 + dy, 36 + dx, 18 + dy]]), '#e4dcf0', { gx0: 34, gx1: 48 });
  // ---- back arm ----
  limb(P.ba[0] + dx, P.ba[1] + dy, P.ba[2] + dx * 0.5, P.ba[3] + dy * 0.6, 6.2, shd(L.top, 0.72)); hand(P.ba[2] + dx * 0.5 + 0.4, P.ba[3] + dy * 0.6 + 1.4);
  // ---- legs / skirt ----
  if (!robe) {
    const leg = (a, b, c2, d, col) => { limb(a, b, c2, d, 7.4, col); const bx = c2 - 3.6, by = d - 1; shape(mkc([[bx, by], [bx - 1.5, by + 6, bx + 1, by + 9, bx + 6, by + 9], [bx + 10, by + 9, bx + 10, by + 6, bx + 8.5, by + 2], [bx + 7, by - 1, bx + 3, by - 2, bx, by]]), L.boots, { gx0: bx, gx1: bx + 10 }); };
    if (P.legs === 'stand') { leg(35, 50, 37, 69, shd(L.legs, 0.8)); leg(27, 50, 25, 69, L.legs); }
    else if (P.legs === 'run') { leg(36 + dx, 50, 45, 65, shd(L.legs, 0.8)); leg(27 + dx, 50, 18, 66, L.legs); }
    else if (P.legs === 'lunge') { leg(36 + dx, 51, 46, 68, shd(L.legs, 0.8)); leg(26 + dx, 51, 14, 67, L.legs); }
    else { leg(30, 56, 38, 70, shd(L.legs, 0.8)); limb(27, 56, 19, 66, 7.4, L.legs); shape(mkc([[14, 66], [13, 71, 17, 74, 22, 73], [26, 72, 25, 68, 23, 65], [20, 64, 16, 64, 14, 66]]), L.boots); }
  } else {
    const sw = P.legs === 'run' || P.legs === 'lunge' ? 4 : 0, top = 27 + dy, hem = P.legs === 'kneel' ? 76 : 74;
    shape(mkc([[24 + dx, top], [22 + dx, 44 + dy, 17 + dx - sw, 60, 13 - sw, hem - 1], [26, hem + 3, 44, hem + 3, 54 + sw, hem - 1], [51 + sw, 60, 45 + dx, 44 + dy, 41 + dx, top], [36 + dx, top - 3, 29 + dx, top - 3, 24 + dx, top]]), L.top, { gx0: 13, gx1: 54, dk: id === 'zek' ? '#2e0e4e' : '#b9afc8', line: id === 'zek' ? '#1a0630' : '#7a7088' });
    x.strokeStyle = id === 'zek' ? 'rgba(20,0,40,.5)' : 'rgba(100,90,130,.4)'; x.lineWidth = 1; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(28 + k * 4 + dx, 44 + dy); x.quadraticCurveTo(25 + k * 5.4 - sw, 60, 22 + k * 8 - sw, hem); x.stroke(); }
    shape(mkp([15 - sw, hem - 6, 53 + sw, hem - 6, 54 + sw, hem - 1, 14 - sw, hem - 1]), L.trim, { lw: 0.8 });
    for (let i = 0; i < 8; i++) { x.fillStyle = '#ffe8a0'; x.fillRect(19 - sw + i * 4.6, hem - 4.4, 1.2, 1.2); }
  }
  // ---- torso ----
  const [tx, ty] = T(0, 0);
  if (!robe) {
    shape(mkc([[24 + dx, 28 + dy], [23 + dx, 38 + dy, 24 + dx, 46 + dy, 26 + dx, 54 + dy], [30 + dx, 56 + dy, 38 + dx, 56 + dy, 42 + dx, 54 + dy], [43 + dx, 46 + dy, 42 + dx, 36 + dy, 40 + dx, 28 + dy], [36 + dx, 25 + dy, 28 + dx, 25 + dy, 24 + dx, 28 + dy]]), L.top, { gx0: 22, gx1: 44 });
    if (id === 'kai') { shape(mkc([[26 + dx, 29 + dy], [34 + dx, 27 + dy, 41 + dx, 29 + dy, 42 + dx, 33 + dy], [43 + dx, 41 + dy, 42 + dx, 48 + dy, 41 + dx, 52 + dy], [34 + dx, 53 + dy, 30 + dx, 52 + dy, 26 + dx, 52 + dy], [25 + dx, 44 + dy, 25 + dx, 36 + dy, 26 + dx, 29 + dy]]), '#7a5230', { gx0: 25, gx1: 43, lt: '#a8743e', dk: '#4a2e18' }); for (const yy of [34, 41]) shape(mkp([27.4 + dx, yy + dy, 30.4 + dx, yy + dy, 30.4 + dx, yy + 1.8 + dy, 27.4 + dx, yy + 1.8 + dy]), '#e0b850', { lw: 0.6 }); }
    shape(mkp([25 + dx, 49 + dy, 42 + dx, 49 + dy, 43 + dx, 53 + dy, 24 + dx, 53 + dy]), '#4a2c14', { lw: 0.8 }); shape(mkp([31 + dx, 48 + dy, 36 + dx, 48 + dy, 36 + dx, 54 + dy, 31 + dx, 54 + dy]), '#f0c84a', { lw: 0.6 });
    if (id === 'allen') { shape(mkc([[22 + dx, 28 + dy], [22 + dx, 24 + dy, 28 + dx, 22 + dy, 32 + dx, 25 + dy], [30 + dx, 30 + dy, 26 + dx, 31 + dy, 22 + dx, 31 + dy], [21.4 + dx, 30 + dy, 21.6 + dx, 29 + dy, 22 + dx, 28 + dy]]), '#cfd6e8', { lt: '#fff', dk: '#7b86a4', gx0: 22, gx1: 32 }); shape(mkc([[28 + dx, 25 + dy], [32 + dx, 23 + dy, 38 + dx, 24 + dy, 40 + dx, 28 + dy], [36 + dx, 29 + dy, 32 + dx, 28.5 + dy, 28 + dx, 25 + dy]]), '#e8c050', { lw: 0.7 }); }
  } else {
    shape(mkc([[24 + dx, 27 + dy], [23 + dx, 36 + dy, 24 + dx, 43 + dy, 25 + dx, 48 + dy], [30 + dx, 50 + dy, 38 + dx, 50 + dy, 42 + dx, 48 + dy], [43 + dx, 40 + dy, 42 + dx, 33 + dy, 41 + dx, 27 + dy], [36 + dx, 24 + dy, 29 + dx, 24 + dy, 24 + dx, 27 + dy]]), L.top, { gx0: 22, gx1: 44, dk: id === 'zek' ? '#3e1470' : '#cfc6d8' });
    shape(mkp([24 + dx, 44 + dy, 42 + dx, 44 + dy, 42.8 + dx, 48 + dy, 23.4 + dx, 48 + dy]), L.trim, { lw: 0.7 });
    if (id === 'zek') { shape(mkc([[20 + dx, 26 + dy], [22 + dx, 20 + dy, 36 + dx, 20 + dy, 44 + dx, 27 + dy], [40 + dx, 31 + dy, 26 + dx, 31 + dy, 20 + dx, 26 + dy]]), '#4a1a78', { lw: 1, lt: '#7a40b0' }); shape(mkp([20 + dx, 26 + dy, 44 + dx, 27 + dy, 44 + dx, 29.4 + dy, 20 + dx, 28.4 + dy]), '#e8c440', { lw: 0.6 }); }
    else { shape(mkc([[31 + dx, 43 + dy], [34.5 + dx, 42 + dy, 37 + dx, 45 + dy, 36 + dx, 49 + dy], [32 + dx, 48 + dy, 30.4 + dx, 46 + dy, 31 + dx, 43 + dy]]), '#ffe8a0', { lw: 0.6 }); }
  }
  // ---- head ----
  const hx = 31 + dx - (poseName === 'hurt' || poseName === 'ko' ? 1 : 0), hy = 14 + dy - (poseName === 'win' ? 1 : 0);
  // shorter, rounder head: squash vertically about the chin and widen a little about the face centre (the first version was too long)
  x.save(); x.translate(hx, hy + 11.5); x.scale(1.1, 0.8); x.translate(-hx, -(hy + 11.5));
  shape(mkc([[hx - 8, hy - 6], [hx - 8.8, hy + 1, hx - 7, hy + 7, hx - 2, hy + 11.5], [hx + 3, hy + 12, hx + 9, hy + 7, hx + 9.5, hy - 2], [hx + 10, hy - 11, hx + 1, hy - 14, hx - 4, hy - 12.5], [hx - 7, hy - 11.5, hx - 8, hy - 9, hx - 8, hy - 6]]), L.skin, { lt: shd(L.skin, 1.06), dk: shd(L.skin, 0.8), gx0: hx - 8, gx1: hx + 10, line: shd(L.skin, 0.4) });
  x.fillStyle = 'rgba(255,120,120,.4)'; x.beginPath(); x.ellipse(hx - 4.6, hy + 5.2, 2.2, 1.3, 0, 0, 7); x.fill();
  const ex = hx - 4.4, ey = hy + 0.6;
  if (P.face === 'hurt') { line(ex - 2.4, ey - 1.8, ex + 1.4, ey + 0.4, '#2a1a1a', 1.3); line(ex - 2.4, ey + 2.2, ex + 1.4, ey, '#2a1a1a', 1.3); line(hx - 7, hy + 8.4, hx - 3, hy + 8.4, '#8a3a3a', 1.1); }
  else if (P.face === 'happy') { x.strokeStyle = '#2a1a1a'; x.lineWidth = 1.3; x.beginPath(); x.arc(ex, ey + 1.6, 2.2, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); x.strokeStyle = '#8a3a3a'; x.lineWidth = 1.1; x.beginPath(); x.arc(hx - 4.4, hy + 7.4, 2.2, 0.2, Math.PI - 0.2); x.stroke(); }
  else {
    x.fillStyle = '#fff'; x.beginPath(); x.ellipse(ex, ey, 2.9, 4.2, 0.1, 0, 7); x.fill();
    const g = x.createLinearGradient(0, ey - 3.6, 0, ey + 3.6); g.addColorStop(0, shd(L.iris, 0.55)); g.addColorStop(0.5, L.iris); g.addColorStop(0.52, shd(L.iris, 1.4)); g.addColorStop(1, shd(L.iris, 1.5));
    x.fillStyle = g; x.beginPath(); x.ellipse(ex - 0.3, ey + 0.2, 2.3, 3.5, 0, 0, 7); x.fill(); x.fillStyle = '#10101c'; x.beginPath(); x.ellipse(ex - 0.3, ey + 0.1, 1.1, 2.1, 0, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.fillRect(ex - 1.8, ey - 1.9, 1.3, 1.3); x.strokeStyle = '#2a1a1a'; x.lineWidth = 1; x.beginPath(); x.moveTo(ex - 2.8, ey - 1.7); x.quadraticCurveTo(ex, ey - 3.6, ex + 2.6, ey - 1.8); x.stroke();
    if (P.face === 'shout') { x.fillStyle = '#7a2a2a'; x.beginPath(); x.ellipse(hx - 4.4, hy + 8.6, 1.9, 1.5, 0, 0, 7); x.fill(); } else line(hx - 6.4, hy + 8.4, hx - 2.8, hy + 8.4, '#8a3a3a', 1);
  }
  line(hx - 7.6, hy - 3.8, hx - 1.2, hy - 4.2, shd(L.hair, 0.6), 1); line(hx - 8.6, hy + 3.4, hx - 9.4, hy + 5, shd(L.skin, 0.55), 1);
  ell(hx + 7, hy + 1.5, 1.7, 2.6, L.skin, { line: shd(L.skin, 0.45) });
  // hair and head gear per hero
  const hairShape = (segs, base, o) => shape(mkc(segs), base, o);
  if (id === 'allen') {
    hairShape([[hx - 10, hy - 2], [hx - 11, hy - 13, hx + 1, hy - 15, hx + 10, hy - 10], [hx + 14, hy - 7, hx + 12, hy, hx + 9, hy + 6], [hx + 10, hy - 2, hx + 7, hy - 5, hx + 3, hy - 5], [hx - 1, hy - 6, hx - 5, hy - 3, hx - 7, hy + 1], [hx - 8, hy + 3, hx - 10, hy + 2, hx - 10, hy - 2]], L.hair, { gx0: hx - 10, gx1: hx + 13, lt: '#d28a48' });
    for (const [a, b, c2, d] of [[-9, -8, -14, -15], [-4, -12, -7, -19], [2, -14, 2, -20], [8, -11, 12, -17], [12, -6, 17, -8]]) shape(mkp([hx + a, hy + b, hx + c2, hy + d, hx + a + 5, hy + b + 1.4]), L.hair, { lw: 0.8, lt: '#d28a48' });
    shape(mkc([[hx - 10, hy - 6], [hx - 3, hy - 9.6, hx + 7, hy - 9.6, hx + 12, hy - 5.6], [hx + 12, hy - 3.4, hx + 11, hy - 3, hx + 10, hy - 3.4], [hx + 6, hy - 5.4, hx - 3, hy - 5.4, hx - 9, hy - 2.6], [hx - 10, hy - 3, hx - 10.4, hy - 4.6, hx - 10, hy - 6]]), '#d8343e', { lw: 0.8 });
    shape(mkp([hx + 10, hy - 5.4, hx + 16, hy - 4, hx + 21, hy, hx + 15, hy - 0.4, hx + 11, hy - 2.6]), '#d8343e', { lw: 0.7 }); shape(mkp([hx + 11, hy - 4.4, hx + 18, hy - 0.6, hx + 19, hy + 5, hx + 15, hy + 1, hx + 10.6, hy - 2]), '#a82430', { lw: 0.7 });
  } else if (id === 'kai') {
    hairShape([[hx - 9, hy - 2], [hx - 9, hy - 10, hx + 3, hy - 12, hx + 10, hy - 8], [hx + 13, hy - 5, hx + 12, hy + 1, hx + 10, hy + 8], [hx + 9, hy, hx + 6, hy - 3, hx + 2, hy - 3], [hx - 2, hy - 4.6, hx - 6, hy - 4, hx - 8, hy - 1.6], [hx - 8.6, hy - 1.6, hx - 9, hy - 1.8, hx - 9, hy - 2]], L.hair, { gx0: hx - 9, gx1: hx + 13, lt: '#8a5a34' });
    shape(mkc([[hx - 10, hy - 6], [hx - 7, hy - 14, hx + 9, hy - 15, hx + 13, hy - 7], [hx + 13, hy - 5, hx + 12, hy - 4.6, hx + 11, hy - 5.4], [hx + 6, hy - 9.4, hx - 3, hy - 9.4, hx - 8.4, hy - 3.4], [hx - 9.8, hy - 3.4, hx - 10.4, hy - 5, hx - 10, hy - 6]]), '#2e9a44', { lw: 0.9, lt: '#5ac870' });
    shape(mkp([hx + 11, hy - 9, hx + 19, hy - 10, hx + 25, hy - 7, hx + 18, hy - 5.6, hx + 13, hy - 5.4]), '#2e9a44', { lw: 0.7 }); shape(mkp([hx + 13, hy - 6, hx + 21, hy - 3, hx + 23, hy + 2, hx + 17, hy - 0.8, hx + 12.4, hy - 3.6]), '#1e6a2e', { lw: 0.7 });
  } else if (id === 'lina') {
    shape(mkc([[hx - 12, hy], [hx - 14, hy - 14, hx + 1, hy - 18, hx + 11, hy - 11], [hx + 16, hy - 6, hx + 16, hy + 4, hx + 13, hy + 12], [hx + 12, hy + 4, hx + 9, hy - 3, hx + 2, hy - 6], [hx - 3, hy - 7, hx - 8, hy - 5, hx - 10, hy + 2], [hx - 11.4, hy + 3, hx - 12, hy + 2, hx - 12, hy]]), '#f6f2ec', { gx0: hx - 13, gx1: hx + 16, dk: '#b9afc8' });
    shape(mkc([[hx - 11, hy + 1], [hx - 10, hy - 8, hx - 3, hy - 11, hx + 5, hy - 10], [hx - 1, hy - 8, hx - 5, hy - 5, hx - 8, hy + 2], [hx - 9.4, hy + 3, hx - 10.6, hy + 2.6, hx - 11, hy + 1]]), '#d8303e', { lw: 0.7 });
    shape(mkp([hx - 3, hy + 15, hx + 3, hy + 15, hx, hy + 21]), '#d8303e', { lw: 0.7 }); shape(mkp([hx - 4, hy + 14, hx + 4, hy + 14, hx + 4, hy + 16, hx - 4, hy + 16]), '#d8303e', { lw: 0.7 });
    x.strokeStyle = '#f0a860'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(hx - 9.6, hy - 1); x.quadraticCurveTo(hx - 10.4, hy + 5, hx - 8, hy + 9); x.stroke();
  } else {
    hairShape([[hx - 12, hy - 2], [hx - 13, hy - 15, hx - 1, hy - 18, hx + 10, hy - 11], [hx + 15, hy - 6, hx + 15, hy + 2, hx + 12, hy + 10], [hx + 11, hy + 2, hx + 7, hy - 4, hx + 1, hy - 6], [hx - 4, hy - 7, hx - 8, hy - 5, hx - 10, hy + 2], [hx - 11.2, hy + 3, hx - 12, hy + 1, hx - 12, hy - 2]], L.hair, { gx0: hx - 13, gx1: hx + 15, lt: '#f4f6ff', dk: '#7a80a8' });
    x.strokeStyle = '#e8c440'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(hx - 10, hy - 5.4); x.quadraticCurveTo(hx + 1, hy - 10.6, hx + 11, hy - 6.4); x.stroke(); x.fillStyle = '#ff70c0'; x.beginPath(); x.arc(hx, hy - 9, 1.6, 0, 7); x.fill();
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.9; x.beginPath(); x.moveTo(hx - 7, hy - 8); x.quadraticCurveTo(hx - 1, hy - 14, hx + 8, hy - 11); x.stroke();
  }
  x.restore();
  // ---- front arm + weapon ----
  const [fa0, fa1, fa2, fa3] = P.fa; const fx0 = fa0 + dx, fy0 = fa1 + dy, fx1 = fa2 + (P.legs === 'kneel' ? 0 : 0), fy1 = fa3;
  limb(fx0, fy0, fx1, fy1, robe ? 7 : 6.6, L.top);
  if (robe) shape(mkp([fx1 - 5, fy1 - 4, fx1 + 4, fy1 - 5, fx1 + 5, fy1 - 1, fx1 - 4, fy1]), L.trim, { lw: 0.6 });
  hand(fx1, fy1);
  x.save(); x.translate(fx1 - 0.5, fy1 - 0.5); x.rotate(L.weapon === 'staff' && (poseName === 'idle' || poseName === 'kneel') ? 1.57 : P.ang);
  if (L.weapon === 'staff') {
    // a raised staff is shortened so its jewel stays inside the picture
    const sl = (poseName === 'cast' || poseName === 'win') && P.ang > 1 ? Math.min(30, fy1 - 8) : 30, hd = sl + 3;
    x.strokeStyle = '#4a2a10'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(8, 0); x.lineTo(-sl, 0); x.stroke(); x.strokeStyle = '#b07a3a'; x.lineWidth = 1; x.beginPath(); x.moveTo(8, -0.5); x.lineTo(-sl, -0.5); x.stroke();
    x.strokeStyle = '#e8c040'; x.lineWidth = 1.4; x.beginPath(); x.arc(-hd, 0, 3.4, 0, 7); x.stroke();
    const g = x.createRadialGradient(-hd - 0.6, -0.8, 0.3, -hd, 0, 3); g.addColorStop(0, '#fff'); g.addColorStop(0.4, L.gem); g.addColorStop(1, shd(L.gem, 0.45)); x.fillStyle = g; x.beginPath(); x.arc(-hd, 0, 2.8, 0, 7); x.fill();
  } else {
    const len = L.weapon === 'sword' ? 25 : 14;
    const g = x.createLinearGradient(0, -2, 0, 2); g.addColorStop(0, '#fafcff'); g.addColorStop(0.5, '#c4ccdc'); g.addColorStop(1, '#7b86a0');
    x.fillStyle = g; x.beginPath(); x.moveTo(-1, -1.5); x.lineTo(-len, -0.3); x.lineTo(-len - 3, 0.4); x.lineTo(-len, 1.1); x.lineTo(-1, 1.5); x.closePath(); x.fill(); x.strokeStyle = '#3a4258'; x.lineWidth = 0.9; x.stroke();
    x.strokeStyle = '#fff'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(-2.4, -0.6); x.lineTo(-len + 1, -0.2); x.stroke();
    x.fillStyle = '#e8b830'; x.fillRect(-1.8, -3.8, 2, 7.6); x.strokeStyle = '#6a4a10'; x.lineWidth = 0.7; x.strokeRect(-1.8, -3.8, 2, 7.6); x.fillStyle = '#4a2c14'; x.fillRect(0.4, -1.2, 4.4, 2.4);
  }
  x.restore();
  return hdPixelize(c, [hex(L.iris), hex(shd(L.iris, 0.55)).map(Math.round), [42, 26, 26]]);
}
// snap every pixel to a small palette, binarise alpha and add a dark outline: pixel art, not a smooth illustration
function hdPixelize(c, extra) {
  const w = c.width, h = c.height, x = c.getContext('2d'), img = x.getImageData(0, 0, w, h), d = img.data;
  const key = i => (d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | d[i + 2] >> 4, count = new Map();
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] >= 128) count.set(key(i), (count.get(key(i)) || 0) + 1);
  const pal = [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 44).map(e => e[0]);
  const rgb = k => [((k >> 8) & 15) * 17, ((k >> 4) & 15) * 17, (k & 15) * 17], P = pal.map(rgb); P.push([255, 255, 255], [16, 16, 28], ...(extra || []));
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) { d[i + 3] = 0; continue; }
    let best = 0, bd = 1e9; for (let k = 0; k < P.length; k++) { const q = P[k], e = (q[0] - d[i]) ** 2 + (q[1] - d[i + 1]) ** 2 + (q[2] - d[i + 2]) ** 2; if (e < bd) { bd = e; best = k; } }
    d[i] = P[best][0]; d[i + 1] = P[best][1]; d[i + 2] = P[best][2]; d[i + 3] = 255; solid[i >> 2] = 1;
  }
  // outer outline in a dark tint of the neighbouring colour
  const out = new Uint8ClampedArray(d);
  for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
    const j = y * w + xx; if (solid[j]) continue;
    const nb = [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([a, b]) => { const X = xx + a, Y = y + b; return X >= 0 && Y >= 0 && X < w && Y < h && solid[Y * w + X] ? (Y * w + X) * 4 : -1; }).filter(k => k >= 0);
    if (!nb.length) continue; const o = j * 4; out[o] = d[nb[0]] * 0.28 + 14; out[o + 1] = d[nb[0] + 1] * 0.28 + 8; out[o + 2] = d[nb[0] + 2] * 0.28 + 22; out[o + 3] = 255;
  }
  img.data.set(out); x.putImageData(img, 0, 0); return c;
}
function buildHeroBattle() {
  for (const id in HERO_STYLE) {
    const S = {}; for (const p of ['idle', 'walk', 'strike', 'cast', 'hurt', 'win', 'kneel']) S[p] = hdHero(id, p);
    const ko = mkCanvas(HH, HW); { const k = ko.getContext('2d'); k.translate(0, HW); k.rotate(-Math.PI / 2); k.drawImage(S.hurt, 0, 0); }
    S.ko = ko; S.flash = {}; for (const p in S) if (p !== 'flash') S.flash[p] = silhouette(S[p]);
    SPR[id].hb = S;
  }
}
