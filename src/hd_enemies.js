// ===================== HD ENEMY ART (2x density, hero-style: bold outline, banded shading, big expressive eyes) =====================
// Drawn in the same units as the old enemy art (so sizes match) on a canvas twice as big, then pixelized like the hero sprites.
function eshade(col, k) { const a = col.startsWith('rgb') ? col.match(/\d+/g).map(Number) : hex(col); return `rgb(${clamp(Math.round(a[0] * k), 0, 255)},${clamp(Math.round(a[1] * k), 0, 255)},${clamp(Math.round(a[2] * k), 0, 255)})`; }
function enemyKit(x) {
  const bands = (g, lt, base, dk) => { g.addColorStop(0, lt); g.addColorStop(0.3, lt); g.addColorStop(0.32, base); g.addColorStop(0.68, base); g.addColorStop(0.7, dk); g.addColorStop(1, dk); };
  const mk = segs => () => { x.beginPath(); x.moveTo(segs[0][0], segs[0][1]); for (let i = 1; i < segs.length; i++) { const q = segs[i]; if (q.length === 2) x.lineTo(...q); else if (q.length === 4) x.quadraticCurveTo(...q); else x.bezierCurveTo(...q); } x.closePath(); };
  // gx0..gx1: where the light-to-shadow bands run (left = light)
  const shape = (segs, base, o = {}) => { mk(segs)(); const g = x.createLinearGradient(o.gx0 ?? 0, o.gy0 ?? 0, o.gx1 ?? 40, o.gy1 ?? 0); bands(g, o.lt || eshade(base, 1.3), base, o.dk || eshade(base, 0.62)); x.fillStyle = g; x.fill(); x.lineWidth = o.lw || 0.9; x.strokeStyle = o.line || eshade(base, 0.3); x.stroke(); };
  const ell = (cx, cy, rx, ry, base, o = {}) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, o.rot || 0, 0, 7); const g = x.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry * 0.4); bands(g, o.lt || eshade(base, 1.3), base, o.dk || eshade(base, 0.62)); x.fillStyle = g; x.fill(); x.lineWidth = o.lw || 0.9; x.strokeStyle = o.line || eshade(base, 0.3); x.stroke(); };
  const line = (a, b, c, d, col, w) => { x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); };
  const eye = (cx, cy, rx, ry, iris, o = {}) => { x.fillStyle = '#fbfbff'; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); const g = x.createLinearGradient(0, cy - ry, 0, cy + ry); g.addColorStop(0, eshade(iris, 0.5)); g.addColorStop(0.5, iris); g.addColorStop(1, eshade(iris, 1.6)); x.fillStyle = g; x.beginPath(); x.ellipse(cx + (o.dx || 0), cy + 0.3, rx * 0.78, ry * 0.9, 0, 0, 7); x.fill(); x.fillStyle = '#14101c'; x.beginPath(); x.ellipse(cx + (o.dx || 0), cy + 0.4, rx * 0.4, ry * o.pr || ry * 0.55, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx - rx * 0.35, cy - ry * 0.35, rx * 0.28, ry * 0.28, 0, 0, 7); x.fill(); x.strokeStyle = '#1a1018'; x.lineWidth = 0.9; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke(); };
  return { shape, ell, line, eye };
}
function hdEnemyCanvas(w, h, draw, outline) { const c = mkCanvas(w * 2, h * 2), x = c.getContext('2d', { willReadFrequently: true }); x.lineJoin = 'round'; x.scale(2, 2); draw(x, enemyKit(x)); x.setTransform(1, 0, 0, 1, 0, 0); return hdPixelize(c, outline ? [outline] : []); }
const HD_ENEMY = {
  slime(a, P = { lt: '#a8f4c0', main: '#4fd078', dk: '#2a9a5c', deep: '#14502e', out: '#0c2414', fire: false }) {
    return hdEnemyCanvas(36, 34, (x, K) => {
      const s = Math.sin(a) * 0.07, rx = 15 * (1 + s), ry = 11.5 * (1 - s), cx = 18, by = 32;
      x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(cx, by + 0.5, rx * 0.95, 2.2, 0, 0, 7); x.fill();
      K.shape([[cx - rx, by], [cx - rx, by - ry * 1.2, cx - rx * 0.55, by - ry * 2.15, cx, by - ry * 2.15], [cx + rx * 0.55, by - ry * 2.15, cx + rx, by - ry * 1.2, cx + rx, by], [cx + rx * 0.5, by + 1.2, cx - rx * 0.5, by + 1.2, cx - rx, by]], P.main, { gx0: cx - rx, gx1: cx + rx, lt: P.lt, dk: P.dk, lw: 1.1 });
      x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.ellipse(cx - 6.5, by - ry * 1.62, 3.4, 2.2, -0.5, 0, 7); x.fill(); x.beginPath(); x.arc(cx - 2.4, by - ry * 1.9, 1, 0, 7); x.fill();
      const ey = by - ry * 0.95; K.eye(cx - 5, ey, 3, 3.8, '#1a3a5a', { dx: 0.4 }); K.eye(cx + 4.6, ey, 3, 3.8, '#1a3a5a', { dx: 0.4 });
      x.strokeStyle = P.deep; x.lineWidth = 1; x.beginPath(); x.arc(cx - 0.2, ey + 4.6, 2.6, 0.25, Math.PI - 0.25); x.stroke();
      if (P.fire) { const fl = Math.sin(a * 2) * 1.4; K.shape([[cx - 4, by - ry * 2.1], [cx - 2, by - ry * 2.1 - 7 - fl, cx + 1, by - ry * 2.1 - 9 - fl], [cx + 4, by - ry * 2.1 - 4, cx + 4, by - ry * 2.1]], '#ffb030', { lt: '#fff4a0', dk: '#e04020', lw: 0.9 }); }
      x.fillStyle = 'rgba(255,150,150,.5)'; x.beginPath(); x.ellipse(cx - 9, ey + 3, 2, 1.2, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(cx + 8.4, ey + 3, 2, 1.2, 0, 0, 7); x.fill();
    }, P.out);
  },
  goblin(a, mage) {
    return hdEnemyCanvas(40, 46, (x, K) => {
      const b = Math.sin(a) * 0.8, skin = mage ? '#7fc890' : '#8fcf58', hy = 14 + b;
      x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(20, 44.5, 13, 2.2, 0, 0, 7); x.fill();
      for (const lx of [14.5, 25.5]) { K.shape([[lx - 3.4, 32], [lx + 3.4, 32], [lx + 3, 41], [lx - 3, 41]], eshade(skin, 0.9), { gx0: lx - 4, gx1: lx + 4 }); K.shape([[lx - 5, 41], [lx - 5.4, 44.4], [lx + 5.6, 44.4], [lx + 4, 41]], '#6a4420', { gx0: lx - 5, gx1: lx + 6 }); }
      if (!mage) {
      K.shape([[33.4, 28 + b], [36, 27 + b], [38.2, 12 + b], [34.2, 11 + b]], '#8a5a2a', { gx0: 33, gx1: 38 }); K.shape([[32, 12 + b], [34, 4 + b], [38, 3.4 + b], [40, 11 + b], [37, 13.6 + b]], '#6a4420', { gx0: 32, gx1: 40 });
      for (const [sx, sy] of [[33.6, 6.4], [38, 6.4], [36, 3.8], [36, 10.6]]) x.fillRect(sx, sy + b, 1, 1);
      }
      // torso: leather vest over a round belly, loincloth
      K.shape([[10, 24 + b], [30, 24 + b], [32, 34], [8, 34]], skin, { gx0: 8, gx1: 32 });
      K.shape([[11, 24 + b], [20, 26 + b], [19, 36], [11, 36]], '#9a6a3a', { gx0: 10, gx1: 20, lt: '#c08a52' }); K.shape([[29, 24 + b], [21, 26 + b], [22, 36], [30, 36]], '#7a4e26', { gx0: 21, gx1: 30 });
      K.shape([[9, 33], [31, 33], [30, 37], [10, 37]], '#4a3018', { gx0: 9, gx1: 31 }); K.shape([[17, 33], [23, 33], [23, 37.4], [17, 37.4]], '#e8b830', { lw: 0.6 });
      // arms
      K.shape([[8.6, 24 + b], [12, 24 + b], [9, 33 + b], [4.4, 31 + b]], eshade(skin, 0.95), { gx0: 4, gx1: 12 }); K.ell(5.4, 32 + b, 2.6, 2.6, '#a8dc72');
      K.shape([[28, 24 + b], [31.4, 24 + b], [35.4, 29 + b], [32, 31 + b]], eshade(skin, 0.8), { gx0: 28, gx1: 35 }); K.ell(34.4, 29 + b, 2.8, 2.8, '#7fbf4c');
      if (mage) {
        K.shape([[10, 24 + b], [30, 24 + b], [34, 40], [36, 44], [4, 44], [6, 40]], '#7a4ab0', { gx0: 4, gx1: 36, lt: '#a070d8', dk: '#48247a', lw: 1.1 });
        K.shape([[5, 41], [35, 41], [36, 44.4], [4, 44.4]], '#e8c040', { lw: 0.6 }); K.shape([[17, 24 + b], [23, 24 + b], [20, 34]], '#e8c040', { lw: 0.6 });
        K.shape([[34.4, 32 + b], [36, 31 + b], [36.6, 8 + b], [35, 8 + b]], '#7a4a24', { gx0: 34, gx1: 37, lw: 0.8 }); K.ell(35.8, 6 + b, 3, 3, '#ff70c0', { lt: '#ffd0f0', dk: '#b02880' }); K.ell(33, 31 + b, 2.6, 2.6, '#7fbf4c');
      }
      // pointy ears
      K.shape([[11, hy - 1], [1.6, hy - 9], [3.6, hy - 2.4], [3.2, hy + 3], [11.4, hy + 3.6]], '#78b648', { gx0: 1, gx1: 12 }); K.shape([[29, hy - 1], [38.4, hy - 9], [36.4, hy - 2.4], [36.8, hy + 3], [28.6, hy + 3.6]], '#6aa83e', { gx0: 28, gx1: 39 });
      x.fillStyle = '#e8909a'; x.beginPath(); x.moveTo(4.4, hy - 5.6); x.lineTo(8, hy - 1); x.lineTo(5, hy); x.fill(); x.beginPath(); x.moveTo(35.6, hy - 5.6); x.lineTo(32, hy - 1); x.lineTo(35, hy); x.fill();
      // head: big and round
      K.ell(20, hy, 11.4, 10, skin, { lt: '#c2ee86', dk: '#5a9a34', lw: 1.1 });
      // brows, yellow eyes with slit pupils, big nose, fangs
      K.line(11.8, hy - 5.4, 17, hy - 3.6, '#2a4a1a', 1.5); K.line(28.2, hy - 5.4, 23, hy - 3.6, '#2a4a1a', 1.5);
      for (const ex of [15.4, 24.6]) { x.fillStyle = '#fff8c0'; x.beginPath(); x.ellipse(ex, hy - 0.6, 3, 2.8, 0, 0, 7); x.fill(); x.fillStyle = '#e8a010'; x.beginPath(); x.ellipse(ex, hy - 0.4, 2.2, 2.6, 0, 0, 7); x.fill(); x.fillStyle = '#1a1008'; x.fillRect(ex - 0.4, hy - 2.6, 0.9, 4.4); x.fillStyle = '#fff'; x.fillRect(ex - 1.5, hy - 1.8, 0.9, 0.9); x.strokeStyle = '#1e2a10'; x.lineWidth = 0.8; x.beginPath(); x.ellipse(ex, hy - 0.6, 3, 2.8, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke(); }
      K.ell(20, hy + 2.8, 2.6, 2, '#7fbf4c', { lw: 0.7 });
      x.fillStyle = '#3a1a1a'; x.beginPath(); x.moveTo(13.6, hy + 5.6); x.quadraticCurveTo(20, hy + 9.4, 26.4, hy + 5.6); x.quadraticCurveTo(20, hy + 6.8, 13.6, hy + 5.6); x.fill();
      x.fillStyle = '#fffbe8'; x.beginPath(); x.moveTo(15.4, hy + 6); x.lineTo(16.6, hy + 3.4); x.lineTo(17.8, hy + 6.4); x.fill(); x.beginPath(); x.moveTo(24.6, hy + 6); x.lineTo(23.4, hy + 3.4); x.lineTo(22.2, hy + 6.4); x.fill();
      x.fillStyle = 'rgba(255,120,120,.35)'; x.beginPath(); x.ellipse(12.6, hy + 3.4, 2, 1.1, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(27.4, hy + 3.4, 2, 1.1, 0, 0, 7); x.fill();
      // a few warts / scruffy hair tuft
      if (mage) { K.shape([[8, hy - 5], [32, hy - 5], [27, hy - 8], [22, hy - 20], [17, hy - 8]], '#5e3494', { gx0: 8, gx1: 32, lt: '#8a5cc8', dk: '#361a5e', lw: 1.1 }); K.shape([[6, hy - 4], [34, hy - 4], [34, hy - 6.2], [6, hy - 6.2]], '#48247a', { lw: 0.9 }); K.shape([[7, hy - 6.2], [33, hy - 6.2], [33, hy - 7.6], [7, hy - 7.6]], '#e8c040', { lw: 0.5 }); }
      else K.shape([[17, hy - 9.4], [20, hy - 13.4], [21.6, hy - 9.2]], '#4a3018', { lw: 0.7 });
    }, mage ? '#1a0c24' : '#14240c');
  },
  garva(a) {
    return hdEnemyCanvas(96, 106, (x, K) => {
      const w = Math.sin(a), gl = 0.5 + 0.5 * Math.sin(a * 2), arm = '#4a4a68';
      x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(48, 103, 34, 4, 0, 0, 7); x.fill();
      // crimson cape behind with a ragged hem
      K.shape([[28, 30], [10, 56, 4, 84, 4 + w * 3, 102], [14, 98], [22, 103], [30, 98], [40, 104], [52, 99], [62, 103], [72, 98], [82, 102], [88, 90, 86, 60, 66, 30]], '#8a1a3a', { gx0: 4, gx1: 90, lt: '#c03058', dk: '#4a0a24', lw: 1.3 });
      // legs and greaves
      for (const lx of [31, 52]) { K.shape([[lx, 70], [lx + 14, 70], [lx + 13, 96], [lx - 1, 96]], arm, { gx0: lx, gx1: lx + 14, lw: 1.2 }); K.shape([[lx - 2, 94], [lx + 16, 94], [lx + 18, 102], [lx - 4, 102]], '#22222e', { gx0: lx - 3, gx1: lx + 18 }); K.shape([[lx + 1, 80], [lx + 13, 80], [lx + 11, 88], [lx + 3, 88]], '#7a7a98', { gx0: lx, gx1: lx + 13, lw: 0.9 }); }
      // torso: black plate with crimson sash and gold edging
      K.shape([[24, 34], [70, 34], [66, 74], [28, 74]], arm, { gx0: 24, gx1: 70, lw: 1.4 });
      K.shape([[28, 62], [66, 62], [62, 76], [32, 76]], '#9a1a3a', { gx0: 28, gx1: 66 }); K.shape([[28, 60.6], [66, 60.6], [66, 63.4], [28, 63.4]], '#e8b830', { lw: 0.7 });
      K.shape([[47, 38], [57, 46], [47, 62], [37, 46]], '#242436', { gx0: 37, gx1: 57, lw: 1 }); x.fillStyle = `rgba(190,90,255,${0.6 + gl * 0.4})`; x.beginPath(); x.moveTo(47, 43); x.lineTo(50.4, 47); x.lineTo(47, 54); x.lineTo(43.6, 47); x.fill();
      // shoulder armour with spikes
      for (const k of [-1, 1]) { const sx = 47 + k * 28; K.shape([[sx - 11, 32], [sx + 11, 32], [sx + 13, 44], [sx - 13, 44]].map(p => p), '#3a3a54', { gx0: sx - 13, gx1: sx + 13, lw: 1.3 }); K.shape([[sx - 3 + k * 4, 33], [sx + k * 8, 20], [sx + 5 + k * 4, 33]], '#cfcfe8', { lw: 0.9 }); K.shape([[sx - 11, 42.4], [sx + 11, 42.4], [sx + 11, 44], [sx - 11, 44]], '#e8b830', { lw: 0.6 }); }
      // far arm and the greatsword
      K.shape([[74, 40], [82, 44], [86, 64], [78, 66]], '#34344c', { gx0: 74, gx1: 86, lw: 1.1 }); K.ell(82, 66, 5, 5, '#22222e');
      const sw = Math.sin(a) * 2; K.shape([[80, 68], [84, 68], [84, 14 + sw], [82, 4 + sw], [80, 14 + sw]], '#cdb8f0', { gx0: 80, gx1: 84, lt: '#fff', dk: '#8a6ac0', lw: 1 }); K.shape([[74, 66], [90, 66], [90, 70], [74, 70]], '#e8b830', { lw: 0.8 }); x.fillStyle = `rgba(190,120,255,${0.35 + gl * 0.25})`; x.beginPath(); x.ellipse(82, 36, 5, 28, 0, 0, 7); x.fill();
      // near arm
      K.shape([[22, 40], [14, 44], [10, 64], [18, 66]], arm, { gx0: 10, gx1: 22, lw: 1.1 }); K.ell(14, 66, 5, 5, '#22222e');
      // head: pale face, long black hair with a white streak, burning red eyes
      K.shape([[28, 6], [20, 24, 22, 44, 26, 50], [30, 46, 30, 30, 34, 24], [60, 24, 64, 30, 66, 46], [70, 50, 74, 28, 66, 6], [48, -2, 28, 6, 28, 6]], '#1c1a28', { gx0: 20, gx1: 74, lt: '#3a3650', dk: '#0e0c16', lw: 1.2 });
      K.ell(47, 24, 13.4, 14.4, '#e8d4d0', { lt: '#fff0ec', dk: '#b89898', lw: 1.2 });
      K.shape([[34, 8], [40, 14, 46, 18, 56, 16], [48, 12, 44, 8, 40, 6]], '#f4f4ff', { lw: 0.7, lt: '#fff', dk: '#aab0d0' });
      K.shape([[32, 12], [40, 6, 56, 6, 63, 12], [60, 20, 54, 14, 47, 15], [40, 14, 36, 20, 32, 12]], '#1c1a28', { gx0: 30, gx1: 64, lt: '#3a3650', lw: 1 });
      for (const ex of [40.6, 53.4]) { x.fillStyle = '#fff0f0'; x.beginPath(); x.ellipse(ex, 25, 4.2, 3, 0, 0, 7); x.fill(); x.fillStyle = `rgb(255,${60 + gl * 40},70)`; x.beginPath(); x.ellipse(ex, 25, 3.1, 3, 0, 0, 7); x.fill(); x.fillStyle = '#2a0a10'; x.fillRect(ex - 0.5, 22.6, 1.1, 4.8); x.fillStyle = '#fff'; x.fillRect(ex - 1.8, 23.2, 1, 1); x.strokeStyle = '#140a14'; x.lineWidth = 1.2; x.beginPath(); x.ellipse(ex, 25, 4.4, 3.2, 0, Math.PI * 1.02, Math.PI * 1.98); x.stroke(); }
      K.line(35, 19.4, 44, 22, '#140a14', 1.6); K.line(59, 19.4, 50, 22, '#140a14', 1.6);
      K.line(44, 34.4, 50, 34.4, '#6a3a3a', 1.2); K.line(47, 27, 46.4, 31, '#c09898', 0.9);
      K.line(52, 17, 56, 33, '#a85058', 0.9); // old scar
    }, '#0a0814');
  },
};
