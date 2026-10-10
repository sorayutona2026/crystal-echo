// ===================== HD HERO FRONT VIEW (64x80 pixel art) =====================
// Facing the camera and symmetrical, in the same banded-tone + palette-snap style as the battle sprites (hd_heroes.js).
// Meant for dialog portraits, the status screen and the title; not used in battle.
function hdFront(id, pose) {
  const L = HERO_STYLE[id], c = mkCanvas(HW, HH), x = c.getContext('2d', { willReadFrequently: true }); x.lineJoin = 'round'; x.lineCap = 'round';
  const robe = L.kind === 'robe', happy = pose === 'happy';
  const shd = (col, k) => { const a = col.startsWith('rgb') ? col.match(/\d+/g).map(Number) : hex(col); return `rgb(${clamp(Math.round(a[0] * k), 0, 255)},${clamp(Math.round(a[1] * k), 0, 255)},${clamp(Math.round(a[2] * k), 0, 255)})`; };
  const bands = (g, lt, base, dk) => { g.addColorStop(0, lt); g.addColorStop(0.3, lt); g.addColorStop(0.32, base); g.addColorStop(0.68, base); g.addColorStop(0.7, dk); g.addColorStop(1, dk); };
  const mkp = pts => () => { x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.closePath(); };
  const mkc = segs => () => { x.beginPath(); x.moveTo(segs[0][0], segs[0][1]); for (let i = 1; i < segs.length; i++) { const s = segs[i]; if (s.length === 4) x.quadraticCurveTo(...s); else if (s.length === 6) x.bezierCurveTo(...s); else x.lineTo(...s); } x.closePath(); };
  // light comes from the upper left: gradients run left (light) to right (shadow)
  const shape = (mk, base, o = {}) => { mk(); const g = x.createLinearGradient(o.gx0 ?? 8, 0, o.gx1 ?? 56, 0); bands(g, o.lt || shd(base, 1.25), base, o.dk || shd(base, 0.64)); x.fillStyle = g; x.fill(); x.lineWidth = o.lw || 1; x.strokeStyle = o.line || shd(base, 0.34); x.stroke(); };
  const ell = (cx, cy, rx, ry, base, o) => shape(() => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); }, base, o);
  const mirror = (segs, base, o) => { shape(mkc(segs), base, o); shape(mkc(segs.map(s => s.map((v, i) => i % 2 === 0 ? 64 - v : v))), base, { ...o, lt: o && o.dk, dk: o && o.lt }); };
  const mirrorP = (pts, base, o) => { shape(mkp(pts), base, o); shape(mkp(pts.map((v, i) => i % 2 === 0 ? 64 - v : v)), base, o); };
  const line = (a, b, c2, d, col, w) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(a, b); x.lineTo(c2, d); x.stroke(); };
  x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(32, 77, 16, 3.2, 0, 0, 7); x.fill();
  // ---- behind: cape, long hair, hood back ----
  if (L.cape) { shape(mkc([[18, 36], [10, 50, 11, 66, 15, 71], [32, 76, 49, 71, 49, 71], [53, 66, 54, 50, 46, 36], [32, 30, 18, 36, 18, 36]]), L.cape, { gx0: 10, gx1: 54 }); x.strokeStyle = 'rgba(70,0,10,.4)'; x.lineWidth = 1; for (const k of [-1, 1]) { x.beginPath(); x.moveTo(32 + k * 11, 42); x.quadraticCurveTo(32 + k * 15, 58, 32 + k * 14, 72); x.stroke(); } }
  if (id === 'zek') shape(mkc([[16, 18], [10, 40, 14, 62, 20, 66], [26, 56, 26, 40, 24, 30], [40, 30, 38, 40, 44, 56], [50, 62, 54, 40, 48, 18], [32, 4, 16, 18, 16, 18]]), L.hair, { gx0: 10, gx1: 54, lt: '#eef0ff', dk: '#8a90b8' });
  // ---- legs / robe ----
  if (!robe) {
    for (const k of [-1, 1]) {
      const lx = 32 + k * 6.5; shape(mkp([lx - 4.4, 56, lx + 4.4, 56, lx + 4, 70, lx - 4, 70]), k < 0 ? L.legs : shd(L.legs, 0.85), { gx0: lx - 5, gx1: lx + 5 });
      shape(mkc([[lx - 5, 69], [lx - 6.2, 75, lx - 3, 78, lx + 1, 78], [lx + 5, 78, lx + 7, 75, lx + 5.4, 69]]), L.boots, { gx0: lx - 6, gx1: lx + 6 });
    }
  } else {
    shape(mkc([[23, 38], [20, 52, 14, 66, 10, 75], [32, 80, 54, 76, 54, 75], [50, 66, 44, 52, 41, 38], [32, 35, 23, 38, 23, 38]]), L.top, { gx0: 10, gx1: 54, dk: id === 'zek' ? '#2e0e4e' : '#b9afc8', line: id === 'zek' ? '#1a0630' : '#7a7088' });
    x.strokeStyle = id === 'zek' ? 'rgba(20,0,40,.5)' : 'rgba(100,90,130,.4)'; x.lineWidth = 1; for (let k = -3; k <= 3; k++) { x.beginPath(); x.moveTo(32 + k * 3, 50); x.quadraticCurveTo(32 + k * 5, 64, 32 + k * 7.4, 77); x.stroke(); }
    shape(mkp([10.6, 70, 53.4, 70, 54, 75, 10, 75]), L.trim, { lw: 0.8 }); for (let i = 0; i < 9; i++) { x.fillStyle = '#ffe8a0'; x.fillRect(14 + i * 4.8, 71.8, 1.2, 1.2); }
    for (const k of [-1, 1]) shape(mkc([[32 + k * 7, 76], [32 + k * 8, 79, 32 + k * 4, 80, 32 + k * 3, 78]]), L.boots, { lw: 0.8 });
  }
  // ---- arms hanging at the sides (behind the torso edge) ----
  const arm = (k, hold) => {
    const sx = 32 + k * 10.5, hx = 32 + k * 14.5, hy = 56;
    shape(mkc([[sx - 3.4, 36], [sx + 3.6, 36], [hx + 3.6, hy - 2], [hx - 3.2, hy - 2]]), k < 0 ? L.top : shd(L.top, 0.78), { gx0: sx - 4, gx1: sx + 4 });
    if (robe) shape(mkp([hx - 4.2, hy - 6, hx + 4.2, hy - 6, hx + 4.6, hy - 2, hx - 4.6, hy - 2]), L.trim, { lw: 0.7 });
    ell(hx, hy + 1.2, 2.7, 2.7, L.skin, { line: shd(L.skin, 0.4) });
  };
  arm(-1); arm(1);
  // ---- torso ----
  if (!robe) {
    shape(mkc([[22, 34], [21, 44, 22, 52, 24, 58], [32, 60, 40, 58, 42, 58], [43, 52, 43, 44, 42, 34], [36, 30, 28, 30, 22, 34]]), L.top, { gx0: 21, gx1: 43 });
    if (id === 'kai') { shape(mkc([[23, 35], [28, 32, 31, 36, 31, 40], [31, 50, 30, 56, 28, 58], [24, 58, 23, 54, 23, 48]]), '#7a5230', { gx0: 23, gx1: 31, lt: '#a8743e', dk: '#4a2e18' }); shape(mkc([[41, 35], [36, 32, 33, 36, 33, 40], [33, 50, 34, 56, 36, 58], [40, 58, 41, 54, 41, 48]]), '#7a5230', { gx0: 33, gx1: 41, lt: '#a8743e', dk: '#4a2e18' }); }
    shape(mkp([22, 54, 42, 54, 43, 58, 21.4, 58]), '#4a2c14', { lw: 0.8 }); shape(mkp([28, 53, 36, 53, 36, 59, 28, 59]), '#f0c84a', { lw: 0.7 }); x.fillStyle = shd('#f0c84a', 0.6); x.fillRect(30, 55, 4, 2);
    if (id === 'allen') {
      shape(mkc([[18, 34], [18, 30, 24, 28, 28, 31], [26, 36, 22, 37, 18, 37]]), '#cfd6e8', { lt: '#fff', dk: '#7b86a4', gx0: 18, gx1: 28 }); shape(mkc([[24, 31], [32, 28, 40, 31, 42, 34], [38, 36, 26, 36, 24, 31]]), '#e8c050', { lw: 0.8 });
      shape(mkp([42, 50, 47, 56, 45, 72, 41, 66]), '#3a4258', { lw: 0.8 }); shape(mkp([44, 46, 49, 47, 48, 52, 43, 52]), '#e8b830', { lw: 0.7 });
    }
    if (id === 'kai') { shape(mkp([41, 54, 45, 58, 44, 65, 41, 61]), '#6a4a2a', { lw: 0.8 }); shape(mkp([40.6, 52, 45, 52, 45, 55, 40.6, 55]), '#4a2c14', { lw: 0.7 }); }
  } else {
    shape(mkc([[23, 34], [22, 42, 23, 48, 24, 54], [32, 56, 40, 56, 40, 54], [41, 48, 42, 42, 41, 34], [36, 30, 28, 30, 23, 34]]), L.top, { gx0: 22, gx1: 42, dk: id === 'zek' ? '#3e1470' : '#cfc6d8' });
    shape(mkp([23, 50, 41, 50, 41.6, 54, 22.4, 54]), L.trim, { lw: 0.8 });
    if (id === 'zek') { shape(mkc([[19, 34], [20, 27, 44, 27, 45, 34], [40, 38, 24, 38, 19, 34]]), '#4a1a78', { lt: '#7a40b0', lw: 1 }); shape(mkp([19.4, 33, 44.6, 33, 44.4, 35.4, 19.6, 35.4]), '#e8c440', { lw: 0.7 }); ell(32, 40, 2.2, 2.2, '#ff70c0', { lw: 0.7 }); }
    else { shape(mkp([27, 33, 37, 33, 32, 41]), L.trim, { lw: 0.8 }); shape(mkp([26, 32, 38, 32, 38, 34, 26, 34]), L.trim, { lw: 0.8 }); ell(32, 38, 2, 2, '#ffe8a0', { lw: 0.6 }); }
  }
  // staff on the screen-left side for the mages
  if (L.weapon === 'staff') {
    x.strokeStyle = '#4a2a10'; x.lineWidth = 2.6; x.beginPath(); x.moveTo(16.4, 76); x.lineTo(16.4, 8); x.stroke(); x.strokeStyle = '#b07a3a'; x.lineWidth = 1; x.beginPath(); x.moveTo(15.6, 76); x.lineTo(15.6, 8); x.stroke();
    x.strokeStyle = '#e8c040'; x.lineWidth = 1.4; x.beginPath(); x.arc(16.4, 5, 3.6, 0, 7); x.stroke();
    const g = x.createRadialGradient(15.6, 4.2, 0.3, 16.4, 5, 3); g.addColorStop(0, '#fff'); g.addColorStop(0.4, L.gem); g.addColorStop(1, shd(L.gem, 0.45)); x.fillStyle = g; x.beginPath(); x.arc(16.4, 5, 3, 0, 7); x.fill();
    ell(14.5, 57, 2.7, 2.7, L.skin, { line: shd(L.skin, 0.4) });
  }
  // ---- neck, scarf ----
  shape(mkp([28, 28, 36, 28, 36, 34, 28, 34]), L.skin, { lt: shd(L.skin, 0.95), dk: shd(L.skin, 0.72) });
  if (L.scarf) { shape(mkc([[23, 31], [32, 36, 41, 31, 42, 34], [32, 40, 22, 34, 23, 31]]), L.scarf, { gx0: 22, gx1: 42, lw: 0.9 }); shape(mkp([34, 36, 40, 36, 38, 47, 33, 44]), L.scarf, { lw: 0.8 }); }
  // ---- head: wide and round ----
  const hx = 32, hy = 19;
  shape(mkc([[hx - 10.5, hy - 4], [hx - 11, hy + 3, hx - 8, hy + 10, hx - 2.5, hy + 11.5], [hx + 2.5, hy + 11.5, hx + 8, hy + 10, hx + 11, hy + 3], [hx + 10.5, hy - 4, hx + 11, hy - 11, hx, hy - 11.5], [hx - 11, hy - 11, hx - 10.5, hy - 4, hx - 10.5, hy - 4]]), L.skin, { lt: L.skin, dk: shd(L.skin, 0.9), gx0: hx - 11, gx1: hx + 11, line: shd(L.skin, 0.4) });
  for (const k of [-1, 1]) ell(hx + k * 11.2, hy + 1.5, 1.9, 2.8, L.skin, { lt: L.skin, dk: L.skin, line: shd(L.skin, 0.45) });
  for (const k of [-1, 1]) { x.fillStyle = 'rgba(255,120,120,.4)'; x.beginPath(); x.ellipse(hx + k * 6.6, hy + 6.4, 2.4, 1.3, 0, 0, 7); x.fill(); }
  const eye = (ex, ey, k) => {
    if (happy) { x.strokeStyle = '#2a1a1a'; x.lineWidth = 1.4; x.beginPath(); x.arc(ex, ey + 1.6, 2.4, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); return; }
    x.fillStyle = '#fff'; x.beginPath(); x.ellipse(ex, ey, 3, 4, 0, 0, 7); x.fill();
    const g = x.createLinearGradient(0, ey - 3.4, 0, ey + 3.4); g.addColorStop(0, shd(L.iris, 0.55)); g.addColorStop(0.5, L.iris); g.addColorStop(0.52, shd(L.iris, 1.4)); g.addColorStop(1, shd(L.iris, 1.5));
    x.fillStyle = g; x.beginPath(); x.ellipse(ex, ey + 0.3, 2.4, 3.3, 0, 0, 7); x.fill(); x.fillStyle = '#10101c'; x.beginPath(); x.ellipse(ex, ey + 0.2, 1.1, 2, 0, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.fillRect(ex - 1.9 + (k > 0 ? 0 : 0), ey - 2.3, 1.4, 1.4); x.fillRect(ex + 0.6, ey + 1.2, 0.8, 0.8);
    x.strokeStyle = '#2a1a1a'; x.lineWidth = 1; x.beginPath(); x.moveTo(ex - 3, ey - 2.4); x.quadraticCurveTo(ex, ey - 4.4, ex + 3, ey - 2.4); x.stroke();
  };
  eye(hx - 5.2, hy + 1, -1); eye(hx + 5.2, hy + 1, 1);
  for (const k of [-1, 1]) line(hx + k * 8.4, hy - 4.6 + (k > 0 ? 0 : 0), hx + k * 2.4, hy - 5.2, shd(L.hair, 0.6), 1);
  if (happy) { x.strokeStyle = '#8a3a3a'; x.lineWidth = 1.1; x.beginPath(); x.arc(hx, hy + 7.4, 2.8, 0.2, Math.PI - 0.2); x.stroke(); x.fillStyle = '#7a2a2a'; x.beginPath(); x.arc(hx, hy + 8.2, 1.6, 0, Math.PI); x.fill(); }
  else { line(hx - 2.4, hy + 8.2, hx + 2.4, hy + 8.2, '#8a3a3a', 1.1); line(hx - 0.4, hy + 3.6, hx + 0.6, hy + 5, shd(L.skin, 0.6), 1); }
  // ---- hair and headgear ----
  if (id === 'allen') {
    shape(mkc([[hx - 12, hy - 2], [hx - 13, hy - 14, hx, hy - 15, hx + 13, hy - 14], [hx + 13, hy - 2, hx + 12, hy - 1, hx + 12, hy - 2], [hx + 9, hy - 6, hx + 3, hy - 6, hx, hy - 7.6], [hx - 3, hy - 6, hx - 9, hy - 6, hx - 12, hy - 2]]), L.hair, { gx0: hx - 13, gx1: hx + 13, lt: '#d28a48' });
    for (const [a, b, c2, d] of [[-11, -9, -17, -15], [-6, -12, -9, -20], [0, -14, 0, -21], [6, -12, 9, -20], [11, -9, 17, -15]]) shape(mkp([hx + a - 3, hy + b + 1, hx + c2, hy + d, hx + a + 4, hy + b + 1]), L.hair, { lw: 0.8, lt: '#d28a48', gx0: hx - 18, gx1: hx + 18 });
    shape(mkc([[hx - 12, hy - 7], [hx - 6, hy - 11, hx + 6, hy - 11, hx + 12, hy - 7], [hx + 12, hy - 4.4, hx + 11, hy - 4, hx + 10, hy - 4.6], [hx + 5, hy - 7.4, hx - 5, hy - 7.4, hx - 10, hy - 4.6], [hx - 11, hy - 4, hx - 12, hy - 4.4, hx - 12, hy - 7]]), '#d8343e', { lw: 0.9, gx0: hx - 12, gx1: hx + 12 });
    shape(mkp([hx + 11, hy - 8, hx + 18, hy - 6, hx + 22, hy - 1, hx + 16, hy - 3, hx + 11, hy - 5]), '#d8343e', { lw: 0.7 }); shape(mkp([hx + 12, hy - 6.4, hx + 19, hy - 1, hx + 20, hy + 5, hx + 16, hy, hx + 11.6, hy - 3.6]), '#a82430', { lw: 0.7 });
    shape(mkp([hx - 9, hy - 5, hx - 4, hy - 3, hx - 7, hy + 2, hx - 11, hy]), L.hair, { lw: 0.7 }); shape(mkp([hx + 9, hy - 5, hx + 4, hy - 3, hx + 7, hy + 2, hx + 11, hy]), L.hair, { lw: 0.7, lt: shd(L.hair, 0.8), dk: '#d28a48' });
  } else if (id === 'kai') {
    shape(mkc([[hx - 11.6, hy - 1], [hx - 12.6, hy - 12, hx, hy - 13.6, hx + 12.6, hy - 12], [hx + 11.6, hy - 1, hx + 11.6, hy, hx + 11.6, hy - 1], [hx + 8, hy - 5, hx + 4, hy - 6, hx, hy - 7], [hx - 4, hy - 6, hx - 8, hy - 5, hx - 11.6, hy - 1]]), L.hair, { gx0: hx - 13, gx1: hx + 13, lt: '#8a5a34' });
    shape(mkc([[hx - 12.6, hy - 6], [hx - 8, hy - 15, hx + 8, hy - 15, hx + 12.6, hy - 6], [hx + 12.6, hy - 4, hx + 12, hy - 3.4, hx + 11, hy - 4], [hx + 5, hy - 8.4, hx - 5, hy - 8.4, hx - 11, hy - 4], [hx - 12, hy - 3.4, hx - 12.8, hy - 4, hx - 12.6, hy - 6]]), '#2e9a44', { lw: 0.9, lt: '#5ac870', gx0: hx - 13, gx1: hx + 13 });
    shape(mkp([hx + 11, hy - 8, hx + 19, hy - 9, hx + 25, hy - 5, hx + 18, hy - 5.4, hx + 12, hy - 4.6]), '#2e9a44', { lw: 0.7 }); shape(mkp([hx + 12, hy - 5.4, hx + 20, hy - 2, hx + 22, hy + 4, hx + 16, hy, hx + 11.6, hy - 2.6]), '#1e6a2e', { lw: 0.7 });
    shape(mkp([hx - 10, hy - 4, hx - 6, hy - 2, hx - 8, hy + 2, hx - 11, hy]), L.hair, { lw: 0.7 });
  } else if (id === 'lina') {
    shape(mkc([[hx - 14, hy + 6], [hx - 16, hy - 12, hx, hy - 19, hx + 16, hy - 12], [hx + 14, hy + 6, hx + 14.4, hy + 9, hx + 12.8, hy + 10], [hx + 11, hy - 2, hx + 7, hy - 8, hx, hy - 9], [hx - 7, hy - 8, hx - 11, hy - 2, hx - 12.8, hy + 10], [hx - 14.4, hy + 9, hx - 14, hy + 8, hx - 14, hy + 6]]), '#f6f2ec', { gx0: hx - 16, gx1: hx + 16, dk: '#b9afc8' });
    shape(mkc([[hx - 12.4, hy + 9], [hx - 12, hy - 1, hx - 7, hy - 8, hx, hy - 9.4], [hx + 7, hy - 8, hx + 12, hy - 1, hx + 12.4, hy + 9], [hx + 11.2, hy + 9.6, hx + 10.4, hy + 6, hx + 10, hy + 0], [hx + 6, hy - 6, hx - 6, hy - 6, hx - 10, hy + 0], [hx - 10.4, hy + 6, hx - 11.2, hy + 9.6, hx - 12.4, hy + 9]]), '#d8303e', { lw: 0.8, gx0: hx - 12, gx1: hx + 12 });
    for (const k of [-1, 1]) { x.strokeStyle = '#f0a860'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(hx + k * 9.4, hy - 3); x.quadraticCurveTo(hx + k * 9.8, hy + 4, hx + k * 8, hy + 9); x.stroke(); }
    x.strokeStyle = '#f0a860'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(hx - 7, hy - 6); x.quadraticCurveTo(hx, hy - 3, hx + 7, hy - 6); x.stroke();
  } else {
    shape(mkc([[hx - 12.6, hy + 2], [hx - 15, hy - 14, hx, hy - 19, hx + 15, hy - 14], [hx + 12.6, hy + 2, hx + 12.6, hy + 2, hx + 12.6, hy + 2], [hx + 10, hy - 5, hx + 5, hy - 8, hx, hy - 8.6], [hx - 5, hy - 8, hx - 10, hy - 5, hx - 12.6, hy + 2]]), L.hair, { gx0: hx - 15, gx1: hx + 15, lt: '#f4f6ff', dk: '#7a80a8' });
    for (const k of [-1, 1]) shape(mkc([[hx + k * 10, hy - 3], [hx + k * 13, hy + 4, hx + k * 12, hy + 12, hx + k * 9, hy + 14], [hx + k * 9, hy + 6, hx + k * 8, hy, hx + k * 8, hy - 4]]), L.hair, { lw: 0.8, lt: '#f4f6ff', dk: '#8a90b8', gx0: hx - 14, gx1: hx + 14 });
    x.strokeStyle = '#e8c440'; x.lineWidth = 1.7; x.beginPath(); x.moveTo(hx - 11.4, hy - 4.6); x.quadraticCurveTo(hx, hy - 10, hx + 11.4, hy - 4.6); x.stroke(); ell(hx, hy - 8.2, 1.9, 1.9, '#ff70c0', { lw: 0.7 });
    x.strokeStyle = '#ffffff'; x.lineWidth = 1; x.beginPath(); x.moveTo(hx - 6, hy - 9.4); x.quadraticCurveTo(hx, hy - 14, hx + 7, hy - 11); x.stroke();
  }
  return hdPixelize(c, [hex(L.iris), hex(shd(L.iris, 0.55)).map(Math.round), [42, 26, 26]]);
}
