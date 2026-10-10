// ===================== HD HERO SPRITES (64x80 pixel art, shown at 32x40 on the 2x world layer) =====================
// Each pose is painted with vector shapes in hard-banded tones (cel shading), then every pixel is snapped to a small palette and
// given a dark outline, so the result reads as pixel art with twice the dots of the old 32x40 sprites.
const HB_W = 32, HB_H = 40;         // logical size on screen
const HBS = 2;                      // sprite density relative to that size
const HW = HB_W * HBS, HH = HB_H * HBS;
const HERO_STYLE = {
  allen: { skin: '#f7d0a8', iris: '#3a86e6', hair: '#8a4e22', top: '#2f62d6', legs: '#2e3a66', boots: '#6e4220', kind: 'tunic', weapon: 'sword', cape: '#c42c38' },
  lina: { skin: '#f9d9bc', iris: '#2aa8d8', hair: '#e8b832', top: '#f6f2ec', legs: '#f6f2ec', boots: '#a86a3a', kind: 'robe', weapon: 'staff', gem: '#e84a58', trim: '#d8303e' },
  kai: { skin: '#e9b98c', iris: '#9a6420', hair: '#4a2e1a', top: '#eee2be', legs: '#3a5a40', boots: '#5a3418', kind: 'tunic', weapon: 'dagger', scarf: '#2e9a44' },
  zek: { skin: '#f5dccc', iris: '#9a40e0', hair: '#b8bedc', top: '#6a2ea4', legs: '#4e1e78', boots: '#2a1440', kind: 'robe', weapon: 'staff', gem: '#b060ff', trim: '#e8c440' },
};
// Chibi proportions (about 2.3 heads tall) so the battle sprites match the painted portraits: big head, big anime eyes, short body.
// body pose: head/body offset, legs, arms (shoulder -> hand), weapon angle, face
const HPOSE = {
  idle: { dx: 0, dy: 0, legs: 'stand', fa: [23, 45, 17, 57], ba: [41, 45, 47, 57], ang: -1.15, face: 'open' },
  walk: { dx: 0, dy: 0, legs: 'run', fa: [23, 45, 14, 51], ba: [41, 45, 49, 55], ang: 1.0, face: 'open' },
  strike: { dx: -3, dy: 1, legs: 'lunge', fa: [22, 46, 6, 49], ba: [40, 46, 48, 50], ang: -0.12, face: 'shout' },
  cast: { dx: 0, dy: 0, legs: 'stand', fa: [23, 45, 15, 33], ba: [41, 45, 47, 57], ang: 1.57, face: 'open' },
  hurt: { dx: 4, dy: 2, legs: 'stand', fa: [25, 48, 31, 61], ba: [43, 48, 49, 58], ang: -2.7, face: 'hurt' },
  win: { dx: 0, dy: -1, legs: 'stand', fa: [23, 45, 17, 27], ba: [41, 45, 50, 38], ang: 1.57, face: 'happy' },
  kneel: { dx: 0, dy: 9, legs: 'kneel', fa: [23, 52, 18, 63], ba: [41, 52, 46, 63], ang: -0.9, face: 'open' },
};
function hdHero(id, poseName) {
  const L = HERO_STYLE[id], P = HPOSE[poseName === 'ko' ? 'hurt' : poseName];
  const c = mkCanvas(HW, HH), x = c.getContext('2d', { willReadFrequently: true }); x.lineJoin = 'round'; x.lineCap = 'round';
  const dx = P.dx, dy = P.dy, robe = L.kind === 'robe', run = P.legs === 'run' || P.legs === 'lunge';
  const shd = (col, k) => { const a = col.startsWith('rgb') ? col.match(/\d+/g).map(Number) : hex(col); return `rgb(${clamp(Math.round(a[0] * k), 0, 255)},${clamp(Math.round(a[1] * k), 0, 255)},${clamp(Math.round(a[2] * k), 0, 255)})`; };
  const bands = (g, lt, base, dk) => { g.addColorStop(0, lt); g.addColorStop(0.28, lt); g.addColorStop(0.3, base); g.addColorStop(0.66, base); g.addColorStop(0.68, dk); g.addColorStop(1, dk); };
  const mkp = pts => () => { x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.closePath(); };
  const mkc = segs => () => { x.beginPath(); x.moveTo(segs[0][0], segs[0][1]); for (let i = 1; i < segs.length; i++) { const q = segs[i]; if (q.length === 4) x.quadraticCurveTo(...q); else if (q.length === 6) x.bezierCurveTo(...q); else x.lineTo(...q); } x.closePath(); };
  const shape = (mk, base, o = {}) => { mk(); const g = x.createLinearGradient(o.gx0 ?? 0, o.gy0 ?? 0, o.gx1 ?? HW, o.gy1 ?? 0); bands(g, o.lt || shd(base, 1.25), base, o.dk || shd(base, 0.64)); x.fillStyle = g; x.fill(); x.lineWidth = o.lw || 1; x.strokeStyle = o.line || shd(base, 0.34); x.stroke(); };
  const ell = (cx, cy, rx, ry, base, o = {}) => shape(() => { x.beginPath(); x.ellipse(cx, cy, rx, ry, o.rot || 0, 0, 7); }, base, { gx0: cx - rx, gx1: cx + rx, ...o });
  const limb = (x0, y0, x1, y1, w, base, o = {}) => { const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a) * w / 2, ny = Math.cos(a) * w / 2; shape(mkp([x0 + nx, y0 + ny, x1 + nx * 0.8, y1 + ny * 0.8, x1 - nx * 0.8, y1 - ny * 0.8, x0 - nx, y0 - ny]), base, { gx0: x0 + nx, gy0: y0 + ny, gx1: x0 - nx, gy1: y0 - ny, ...o }); };
  const hand = (hx_, hy_) => ell(hx_, hy_, 2.6, 2.6, L.skin, { line: shd(L.skin, 0.4) });
  const line = (a, b, c2, d, col, w) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(a, b); x.lineTo(c2, d); x.stroke(); };
  const cx = 32 + dx, hx = cx - (poseName === 'hurt' || poseName === 'ko' ? 1 : 0), hy = 24 + dy - (poseName === 'win' ? 1 : 0);
  const sw = run ? 4 : 0;
  // ground shadow sits right under the boots
  x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(32 + dx * 0.4, 77.5, 14, 3, 0, 0, 7); x.fill();
  // ---- behind the body: cape, long hair ----
  if (L.cape) shape(mkc([[cx - 11, 39 + dy], [cx - 17 - sw, 52, cx - 16 - sw, 66, cx - 13 - sw, 72], [cx, 75, cx + 13 + sw, 72, cx + 13 + sw, 72], [cx + 17 + sw, 66, cx + 16 + sw, 52, cx + 11, 39 + dy], [cx, 35 + dy, cx - 11, 39 + dy, cx - 11, 39 + dy]]), L.cape, { gx0: cx - 17, gx1: cx + 17 });
  if (id === 'lina') shape(mkc([[hx - 17, hy - 2], [hx - 19, hy + 18, hx - 15, hy + 26, hx - 9, hy + 28], [hx, hy + 14, hx, hy + 14, hx + 9, hy + 28], [hx + 15, hy + 26, hx + 19, hy + 18, hx + 17, hy - 2], [hx + 15, hy - 18, hx - 15, hy - 18, hx - 17, hy - 2]]), L.hair, { gx0: hx - 19, gx1: hx + 19 });
  if (id === 'zek') shape(mkc([[hx - 17, hy - 2], [hx - 19, hy + 18, hx - 16, hy + 26, hx - 10, hy + 29], [hx, hy + 12, hx, hy + 12, hx + 10, hy + 29], [hx + 16, hy + 26, hx + 19, hy + 18, hx + 17, hy - 2], [hx + 15, hy - 18, hx - 15, hy - 18, hx - 17, hy - 2]]), L.hair, { gx0: hx - 19, gx1: hx + 19, lt: '#f2f4ff', dk: '#8a90b8' });
  // ---- back arm (screen right) ----
  limb(P.ba[0] + dx, P.ba[1] + dy, P.ba[2] + dx * 0.5, P.ba[3] + dy * 0.6, 6.6, shd(L.top, 0.72)); hand(P.ba[2] + dx * 0.5 + 0.4, P.ba[3] + dy * 0.6 + 1.4);
  // ---- legs / skirt ----
  const boot = (bx, by, w = 11) => shape(mkc([[bx - w / 2, by - 3], [bx - w / 2 - 0.5, by + 3, bx - w / 2, by + 6, bx - 2, by + 6], [bx + w / 2, by + 6, bx + w / 2 + 1.5, by + 4, bx + w / 2, by], [bx + w / 2 - 1, by - 3, bx - w / 2, by - 3, bx - w / 2, by - 3]]), L.boots, { gx0: bx - w / 2, gx1: bx + w / 2 });
  if (!robe) {
    const leg = (x0, y0, x1, y1, col) => { limb(x0, y0, x1, y1, 8, col); boot(x1 - (x1 < x0 ? 1 : 0), y1 + 0.5); };
    if (P.legs === 'stand') { leg(cx + 5, 55, cx + 6, 70, shd(L.legs, 0.8)); leg(cx - 5, 55, cx - 6, 70, L.legs); }
    else if (P.legs === 'run') { leg(cx + 5, 55, cx + 12, 68, shd(L.legs, 0.8)); leg(cx - 5, 55, cx - 11, 69, L.legs); }
    else if (P.legs === 'lunge') { leg(cx + 5, 55, cx + 14, 70, shd(L.legs, 0.8)); leg(cx - 5, 55, cx - 13, 69, L.legs); }
    else { leg(cx + 4, 62, cx + 10, 71, shd(L.legs, 0.8)); limb(cx - 4, 62, cx - 12, 70, 8, L.legs); boot(cx - 14, 71); }
  } else {
    const hem = P.legs === 'kneel' ? 76 : 73, top = 46 + dy;
    shape(mkc([[cx - 10, top], [cx - 12, 56, cx - 17 - sw, 66, cx - 19 - sw, hem], [cx, hem + 3, cx + 19 + sw, hem, cx + 19 + sw, hem], [cx + 17 + sw, 66, cx + 12, 56, cx + 10, top], [cx, top - 2, cx - 10, top, cx - 10, top]]), L.top, { gx0: cx - 19, gx1: cx + 19, dk: id === 'zek' ? '#2e0e4e' : '#b9afc8', line: id === 'zek' ? '#1a0630' : '#7a7088' });
    x.strokeStyle = id === 'zek' ? 'rgba(20,0,40,.5)' : 'rgba(100,90,130,.4)'; x.lineWidth = 1; for (let k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(cx + k * 3, 56); x.quadraticCurveTo(cx + k * 5.5, 66, cx + k * 7.5 - sw * Math.sign(k), hem - 1); x.stroke(); }
    shape(mkp([cx - 18 - sw, hem - 5, cx + 18 + sw, hem - 5, cx + 19 + sw, hem, cx - 19 - sw, hem]), L.trim, { lw: 0.8 });
    if (P.legs !== 'kneel') { boot(cx - 6, hem + 1, 9); boot(cx + 6, hem + 1, 9); }
  }
  // ---- torso ----
  const tt = 37 + dy;
  if (!robe) {
    shape(mkc([[cx - 11, tt + 2], [cx - 12, tt + 10, cx - 11, tt + 16, cx - 10, tt + 20], [cx, tt + 22, cx + 10, tt + 20, cx + 10, tt + 20], [cx + 11, tt + 16, cx + 12, tt + 10, cx + 11, tt + 2], [cx + 6, tt - 1, cx - 6, tt - 1, cx - 11, tt + 2]]), L.top, { gx0: cx - 12, gx1: cx + 12 });
    shape(mkp([cx - 11, tt + 15, cx + 11, tt + 15, cx + 11, tt + 19, cx - 11, tt + 19]), '#4a2c14', { lw: 0.8 }); shape(mkp([cx - 3, tt + 14, cx + 3, tt + 14, cx + 3, tt + 20, cx - 3, tt + 20]), '#f0c84a', { lw: 0.6 });
    if (id === 'kai') shape(mkp([cx - 10, tt + 2, cx - 2, tt + 4, cx - 2, tt + 15, cx - 10, tt + 15]), '#7a5230', { gx0: cx - 10, gx1: cx - 2, lt: '#a8743e', dk: '#4a2e18', lw: 0.8 });
    if (id === 'allen') { shape(mkc([[cx - 14, tt + 3], [cx - 14, tt - 2, cx - 7, tt - 3, cx - 3, tt + 1], [cx - 5, tt + 7, cx - 9, tt + 8, cx - 14, tt + 7]]), '#cfd6e8', { lt: '#fff', dk: '#7b86a4', gx0: cx - 14, gx1: cx - 3 }); shape(mkc([[cx + 14, tt + 3], [cx + 14, tt - 2, cx + 7, tt - 3, cx + 3, tt + 1], [cx + 5, tt + 7, cx + 9, tt + 8, cx + 14, tt + 7]]), '#aab2cc', { dk: '#6b738c', gx0: cx + 3, gx1: cx + 14 }); }
  } else {
    shape(mkc([[cx - 10, tt + 2], [cx - 11, tt + 9, cx - 11, tt + 14, cx - 10, tt + 17], [cx, tt + 19, cx + 10, tt + 17, cx + 10, tt + 17], [cx + 11, tt + 14, cx + 11, tt + 9, cx + 10, tt + 2], [cx + 6, tt - 1, cx - 6, tt - 1, cx - 10, tt + 2]]), L.top, { gx0: cx - 11, gx1: cx + 11, dk: id === 'zek' ? '#3e1470' : '#cfc6d8' });
    shape(mkp([cx - 10, tt + 13, cx + 10, tt + 13, cx + 10.6, tt + 17, cx - 10.6, tt + 17]), L.trim, { lw: 0.7 });
    if (id === 'zek') shape(mkc([[cx - 13, tt + 3], [cx - 11, tt - 3, cx + 11, tt - 3, cx + 13, tt + 3], [cx + 8, tt + 6, cx - 8, tt + 6, cx - 13, tt + 3]]), '#4a1a78', { lt: '#7a40b0', lw: 1 });
    else { shape(mkp([cx - 4, tt, cx + 4, tt, cx, tt + 10]), L.trim, { lw: 0.8 }); ell(cx, tt + 8.5, 2, 2, '#ffe8a0', { lw: 0.6 }); }
  }
  if (L.scarf) shape(mkc([[cx - 10, tt + 1], [cx, tt + 6, cx + 10, tt + 1, cx + 11, tt + 4], [cx + 3, tt + 10, cx - 8, tt + 8, cx - 10, tt + 1]]), L.scarf, { gx0: cx - 10, gx1: cx + 11, lw: 0.9 });
  if (id === 'allen' || id === 'kai') ell(hx + 11, hy - 1, 9, 12, L.hair, { gx0: hx + 2, gx1: hx + 20, lt: shd(L.hair, 1.1) });
  // ---- head: big and round ----
  ell(hx, hy + 1, 14.4, 14, L.skin, { lt: shd(L.skin, 1.05), dk: shd(L.skin, 0.84), line: shd(L.skin, 0.4) });
  for (const bx of [-13, 5.4]) { x.fillStyle = 'rgba(255,120,120,.4)'; x.beginPath(); x.ellipse(hx + bx, hy + 8.2, 3, 1.7, 0, 0, 7); x.fill(); }
  const eyeDraw = (ex, ey) => {
    if (P.face === 'hurt') { line(ex - 3, ey - 3, ex + 3, ey + 3, '#2a1a1a', 1.5); line(ex - 3, ey + 3, ex + 3, ey - 3, '#2a1a1a', 1.5); return; }
    if (P.face === 'happy') { x.strokeStyle = '#2a1a1a'; x.lineWidth = 1.6; x.beginPath(); x.arc(ex, ey + 2.2, 3.2, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); return; }
    // wide anime eye: the iris is clipped by the eye shape and tucked under a heavy upper lid so it reads as part of the face, not a sticker
    const W = 5.8, Hh = 4.6;
    x.save(); x.beginPath(); x.ellipse(ex, ey, W, Hh, 0, 0, 7); x.clip();
    x.fillStyle = shd(L.skin, 1.02); x.fillRect(ex - W, ey - Hh, W * 2, Hh * 2);
    const g = x.createLinearGradient(0, ey - Hh, 0, ey + Hh); g.addColorStop(0, shd(L.iris, 0.6)); g.addColorStop(0.45, L.iris); g.addColorStop(1, shd(L.iris, 1.7));
    x.fillStyle = g; x.beginPath(); x.ellipse(ex, ey + 0.3, 4.9, 5.6, 0, 0, 7); x.fill();
    x.fillStyle = '#10101c'; x.beginPath(); x.ellipse(ex, ey + 0.5, 2.1, 2.9, 0, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.ellipse(ex - 1.5, ey - 1.2, 1.4, 1.4, 0, 0, 7); x.fill(); x.fillRect(ex + 1.4, ey + 1.6, 1, 1);
    x.fillStyle = 'rgba(30,16,30,.55)'; x.fillRect(ex - W, ey - Hh, W * 2, 1.6); // shadow of the upper lid on the eyeball
    x.restore();
    x.strokeStyle = '#1e1018'; x.lineWidth = 1.8; x.beginPath(); x.ellipse(ex, ey - 0.2, W, Hh, 0, Math.PI * 1.04, Math.PI * 1.96); x.stroke();
    x.lineWidth = 1.1; x.beginPath(); x.moveTo(ex - W, ey - 0.6); x.lineTo(ex - W - 1.6, ey - 1.8); x.stroke();
  };
  // three-quarter view facing left: the near eye is wide, the far eye narrower, and the face sits toward the left edge
  const eyeAt = (ex, ey, k) => { x.save(); x.translate(ex, ey); x.scale(k, 1); x.translate(-ex, -ey); eyeDraw(ex, ey); x.restore(); };
  const ey0 = hy + 6; eyeAt(hx - 9.4, ey0, 1); eyeAt(hx + 3, ey0, 0.74);
  if (P.face === 'shout') { x.fillStyle = '#7a2a2a'; x.beginPath(); x.ellipse(hx - 6, hy + 12, 2.4, 1.9, 0, 0, 7); x.fill(); }
  else if (P.face === 'happy') { x.fillStyle = '#7a2a2a'; x.beginPath(); x.arc(hx - 6, hy + 10.4, 2.6, 0, Math.PI); x.fill(); }
  else if (P.face === 'hurt') line(hx - 8.4, hy + 12, hx - 3.6, hy + 12, '#8a3a3a', 1.2);
  else line(hx - 7.8, hy + 11.8, hx - 4.2, hy + 11.8, '#8a3a3a', 1.1);
  // ---- hair and head gear ----
  const cap = (top, side, col, o = {}) => shape(mkc([[hx - side, hy + 2], [hx - side - 1, hy - top * 0.7, hx - side * 0.5, hy - top, hx, hy - top], [hx + side * 0.5, hy - top, hx + side + 1, hy - top * 0.7, hx + side, hy + 2], [hx + side - 3, hy - 4, hx + 7, hy - 7, hx + 2, hy - 5.4], [hx - 3, hy - 8.4, hx - 8, hy - 6, hx - side + 3, hy - 3.6]]), col, { gx0: hx - side, gx1: hx + side, ...o });
  const band = (col, dk) => { shape(mkc([[hx - 16, hy - 5], [hx - 8, hy - 11, hx + 8, hy - 11, hx + 16, hy - 5], [hx + 16, hy - 1.4, hx + 15, hy - 1, hx + 14, hy - 1.6], [hx + 7, hy - 6.6, hx - 7, hy - 6.6, hx - 14, hy - 1.6], [hx - 15, hy - 1, hx - 16, hy - 1.4, hx - 16, hy - 5]]), col, { lw: 0.9 }); shape(mkp([hx + 14, hy - 8, hx + 22, hy - 7, hx + 27, hy - 2, hx + 20, hy - 3.6, hx + 15, hy - 4.6]), col, { lw: 0.7 }); shape(mkp([hx + 15, hy - 5.6, hx + 23, hy - 0.6, hx + 24, hy + 5, hx + 19, hy + 0.6, hx + 14, hy - 2.4]), dk, { lw: 0.7 }); };
  if (id === 'allen') {
    cap(17, 18.5, L.hair, { lt: '#d28a48' });
    for (const [a, b, c2, d] of [[-13, -8, -19, -15], [-6, -14, -9, -20], [2, -16, 3, -21], [10, -13, 15, -19], [14, -6, 20, -10]]) shape(mkp([hx + a, hy + b, hx + c2, hy + d, hx + a + 6, hy + b + 1.4]), L.hair, { lw: 0.8, lt: '#d28a48' });
    band('#d8343e', '#a82430');
    for (const k of [-1, 1]) shape(mkp([hx + k * 17, hy - 3, hx + k * 9, hy - 2, hx + k * 11, hy + 8, hx + k * 18, hy + 5]), L.hair, { lw: 0.7 });
  } else if (id === 'kai') {
    cap(16, 18.5, L.hair, { lt: '#8a5a34' });
    for (const [a, b, c2, d] of [[-14, -6, -20, -12], [-4, -14, -6, -22], [6, -14, 11, -21], [14, -6, 19, -9]]) shape(mkp([hx + a, hy + b, hx + c2, hy + d, hx + a + 6, hy + b + 1.4]), L.hair, { lw: 0.8, lt: '#8a5a34' });
    band('#2e9a44', '#1e6a2e');
    for (const k of [-1, 1]) shape(mkp([hx + k * 17, hy - 3, hx + k * 9, hy - 2, hx + k * 11, hy + 7, hx + k * 18, hy + 4]), L.hair, { lw: 0.7 });
  } else if (id === 'lina') {
    cap(18, 18.5, L.hair, { lt: '#ffe27a' });
    for (const k of [-1, 1]) shape(mkc([[hx + k * 15, hy - 2], [hx + k * 19, hy + 8, hx + k * 17, hy + 18, hx + k * 14, hy + 21], [hx + k * 12, hy + 12, hx + k * 11, hy + 4, hx + k * 11, hy - 2]]), L.hair, { gx0: hx - 19, gx1: hx + 19, lw: 0.8, lt: '#ffe27a' });
    band('#d8303e', '#a82430');
  } else {
    cap(18, 18.5, L.hair, { lt: '#f4f6ff', dk: '#7a80a8' });
    shape(mkc([[hx - 16, hy - 6], [hx - 17, hy - 16, hx - 8, hy - 20, hx + 1, hy - 20], [hx + 11, hy - 20, hx + 18, hy - 15, hx + 17, hy - 6], [hx + 9, hy - 10, hx - 8, hy - 10, hx - 16, hy - 6]]), '#6a2ea4', { lw: 1, lt: '#9a60d0', dk: '#44167a', gx0: hx - 16, gx1: hx + 17 });
    shape(mkc([[hx - 16, hy - 6], [hx - 6, hy - 11.5, hx + 8, hy - 11.5, hx + 17, hy - 6], [hx + 17, hy - 3.6, hx + 16, hy - 3.2, hx + 14, hy - 4], [hx + 6, hy - 8, hx - 7, hy - 8, hx - 14, hy - 4], [hx - 16, hy - 3.2, hx - 17, hy - 3.6, hx - 16, hy - 6]]), '#e8c440', { lw: 0.8 });
    ell(hx + 1, hy - 9.4, 2, 2, '#ff70c0', { lw: 0.6 });
  }
  // ---- front arm (screen left) + weapon ----
  const [fa0, fa1, fa2, fa3] = P.fa; const fx0 = fa0 + dx, fy0 = fa1 + dy;
  limb(fx0, fy0, fa2, fa3, robe ? 7.4 : 7, L.top);
  if (robe) shape(mkp([fa2 - 5, fa3 - 4, fa2 + 4, fa3 - 5, fa2 + 5, fa3 - 1, fa2 - 4, fa3]), L.trim, { lw: 0.6 });
  hand(fa2, fa3);
  x.save(); x.translate(fa2 - 0.5, fa3 - 0.5); x.rotate(L.weapon === 'staff' && (poseName === 'idle' || poseName === 'kneel') ? 1.57 : P.ang);
  if (L.weapon === 'staff') {
    // a raised staff is shortened so its jewel stays inside the picture
    const sl = (poseName === 'cast' || poseName === 'win') && P.ang > 1 ? Math.min(28, fa3 - 10) : 30, hd = sl + 3;
    x.strokeStyle = '#4a2a10'; x.lineWidth = 2.6; x.beginPath(); x.moveTo(8, 0); x.lineTo(-sl, 0); x.stroke(); x.strokeStyle = '#b07a3a'; x.lineWidth = 1; x.beginPath(); x.moveTo(8, -0.5); x.lineTo(-sl, -0.5); x.stroke();
    x.strokeStyle = '#e8c040'; x.lineWidth = 1.4; x.beginPath(); x.arc(-hd, 0, 3.6, 0, 7); x.stroke();
    const g = x.createRadialGradient(-hd - 0.6, -0.8, 0.3, -hd, 0, 3); g.addColorStop(0, '#fff'); g.addColorStop(0.4, L.gem); g.addColorStop(1, shd(L.gem, 0.45)); x.fillStyle = g; x.beginPath(); x.arc(-hd, 0, 3, 0, 7); x.fill();
  } else {
    const len = L.weapon === 'sword' ? 26 : 15;
    const g = x.createLinearGradient(0, -2, 0, 2); g.addColorStop(0, '#fafcff'); g.addColorStop(0.5, '#c4ccdc'); g.addColorStop(1, '#7b86a0');
    x.fillStyle = g; x.beginPath(); x.moveTo(-1, -1.8); x.lineTo(-len, -0.4); x.lineTo(-len - 3, 0.4); x.lineTo(-len, 1.2); x.lineTo(-1, 1.8); x.closePath(); x.fill(); x.strokeStyle = '#3a4258'; x.lineWidth = 0.9; x.stroke();
    x.strokeStyle = '#fff'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(-2.4, -0.6); x.lineTo(-len + 1, -0.2); x.stroke();
    x.fillStyle = '#e8b830'; x.fillRect(-1.8, -4, 2, 8); x.strokeStyle = '#6a4a10'; x.lineWidth = 0.7; x.strokeRect(-1.8, -4, 2, 8); x.fillStyle = '#4a2c14'; x.fillRect(0.4, -1.3, 4.6, 2.6);
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
// Battle sprites: 'dots' reuses the field walking sprites (16x16, side view facing the enemies) at 4x with a pixel weapon; 'chibi' is the painted chibi above.
const BATTLE_STYLE = 'chibi';
function buildHeroDots(id) {
  const F = SPR[id], S = {}, K = 4, SH = 2; // K: scale-up, SH: sprite shift right in dots so weapons have room on the left
  const px = (g, col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const weapon = (g, pose) => {
    const wp = HERO_STYLE[id].weapon, ox = SH;
    if (wp === 'staff') { // pole along the hand, jewel on top
      const gem = HERO_STYLE[id].gem; const top = pose === 'cast' ? 0 : 2, x0 = ox + 2;
      px(g, '#5a3414', x0, top + 1, 1, 14 - top); px(g, '#b07a3a', x0 - 0, top + 2, 1, 4); px(g, '#e8c040', x0 - 1, top, 3, 1); px(g, gem, x0, top - 0, 1, 1); px(g, '#fff', x0, top - 1 < 0 ? 0 : top - 1, 1, 1);
      if (pose === 'strike') { g.clearRect(x0 - 1, 0, 4, 16); px(g, '#5a3414', ox - 3, 9, 9, 1); px(g, '#e8c040', ox - 4, 8, 1, 3); px(g, gem, ox - 4, 9, 1, 1); }
    } else {
      const len = wp === 'sword' ? 7 : 4;
      if (pose === 'strike') { px(g, '#dfe6f5', ox - len + 3, 9, len, 1); px(g, '#8a94b0', ox - len + 3, 10, len, 1); px(g, '#e8b830', ox + 3, 8, 1, 3); }
      else if (pose === 'up') { px(g, '#dfe6f5', ox + 1, 9 - len, 1, len); px(g, '#8a94b0', ox + 2, 9 - len, 1, len); px(g, '#e8b830', ox, 9, 3, 1); }
      else { px(g, '#dfe6f5', ox + 1, 9, 1, len); px(g, '#8a94b0', ox + 2, 9, 1, len); px(g, '#e8b830', ox, 8, 3, 1); }
    }
  };
  const mk = (frame, o = {}) => {
    const t = mkCanvas(16, 20), g = t.getContext('2d'); g.imageSmoothingEnabled = false;
    const sy = 4 + (o.dy || 0);
    if (o.squash) { g.drawImage(frame, SH + (o.dx || 0), sy + 16 * (1 - o.squash), 16, 16 * o.squash); } else g.drawImage(frame, SH + (o.dx || 0), sy);
    if (o.weapon) weapon(g, o.weapon);
    if (o.tint) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = o.tint; g.fillRect(0, 0, 16, 20); g.globalCompositeOperation = 'source-over'; }
    const c = mkCanvas(HW, HH), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(t, 0, 0, 16 * K, 20 * K); return c;
  };
  S.idle = mk(F.left[0], { weapon: 'down' });
  S.walk = mk(F.left[1], { weapon: 'up' });
  S.strike = mk(F.left[1], { weapon: 'strike', dx: 1 });
  S.cast = mk(F.left[0], { weapon: HERO_STYLE[id].weapon === 'staff' ? 'cast' : 'up', dy: -1 });
  S.hurt = mk(F.left[0], { dx: 1, tint: 'rgba(255,60,60,.35)' });
  S.win = mk(F.down[0], { weapon: 'up', dy: -1 });
  S.kneel = mk(F.left[0], { squash: 0.8, weapon: 'down' });
  return S;
}
function buildHeroBattle() {
  for (const id in HERO_STYLE) {
    const S = {};
    if (BATTLE_STYLE === 'dots' && SPR[id] && SPR[id].left) Object.assign(S, buildHeroDots(id));
    else for (const p of ['idle', 'walk', 'strike', 'cast', 'hurt', 'win', 'kneel']) S[p] = hdHero(id, p);
    const ko = mkCanvas(HH, HW); { const k = ko.getContext('2d'); k.imageSmoothingEnabled = false; k.translate(0, HW); k.rotate(-Math.PI / 2); k.drawImage(S.hurt, 0, 0); }
    S.ko = ko; S.flash = {}; for (const p in S) if (p !== 'flash') S.flash[p] = silhouette(S[p]);
    SPR[id].hb = S;
  }
}
