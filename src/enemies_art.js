// ===================== ENEMY ART v2 (detailed, 4-frame idle animation) =====================
// Each enemy is drawn by a function of the animation phase a (0..2π). Shapes use banded gradients
// (hard colour steps, like hand-shaded pixel art), then get crisp edges, coloured outlines and shading.
function bandR(x, cx, cy, r, cols) { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); const n = cols.length; cols.forEach((c, i) => { g.addColorStop(i / n, c); g.addColorStop(Math.min(1, (i + 1) / n - 0.0001), c); }); return g; }
function bandL(x, x0, y0, x1, y1, cols) { const g = x.createLinearGradient(x0, y0, x1, y1); const n = cols.length; cols.forEach((c, i) => { g.addColorStop(i / n, c); g.addColorStop(Math.min(1, (i + 1) / n - 0.0001), c); }); return g; }
function fp(x, style, fn) { x.fillStyle = style; x.beginPath(); fn(); x.fill(); }
function oval(x, cx, cy, rx, ry, style) { fp(x, style, () => x.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2)); }
function tri(x, a, b, c, d, e, f, style) { fp(x, style, () => { x.moveTo(a, b); x.lineTo(c, d); x.lineTo(e, f); x.closePath(); }); }
function pl(x, pts, style) { fp(x, style, () => { x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.closePath(); }); }
function ln(x, x0, y0, x1, y1, col, w = 1) { x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); }
function dot(x, col, a, b, w = 1, h = 1) { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), w, h); }
function glowEye(x, cx, cy, col, core = '#ffffff', w = 2, h = 2) { dot(x, col, cx - 1, cy - 1, w + 2, h + 2); dot(x, core, cx, cy, Math.max(1, w - 1), Math.max(1, h - 1)); }
function E2(w, h, fn, outline = '#140c1c', post) { const c = mkCanvas(w, h); const x = c.getContext('2d', { willReadFrequently: true }); fn(x, w, h); pixelize(c, outline); stylize(c, { grad: true }); if (post) post(x, w, h); return c; }

const ENEMY_ART2 = {
  slime(a, P = { lite: '#b8f8c8', main: '#56d07a', mid: '#38a85a', dark: '#22784a', deep: '#14502e', fire: false }) {
    return E2(36, 34, x => {
      const s = Math.sin(a) * 0.07, rx = 15 * (1 + s), ry = 11.5 * (1 - s), cx = 18, by = 32;
      const body = () => { x.moveTo(cx - rx, by); x.bezierCurveTo(cx - rx, by - ry * 1.2, cx - rx * 0.55, by - ry * 2.15, cx, by - ry * 2.15); x.bezierCurveTo(cx + rx * 0.55, by - ry * 2.15, cx + rx, by - ry * 1.2, cx + rx, by); x.closePath(); };
      fp(x, bandR(x, cx - 5, by - ry * 1.6, rx * 2, [P.lite, P.main, P.main, P.mid, P.dark, P.deep]), body);
      oval(x, cx, by - 1.5, rx - 1, 2, P.deep);
      oval(x, cx - 6, by - ry * 1.55, 3, 2.2, '#ffffff'); dot(x, '#ffffff', cx - 2, by - ry * 1.85, 2, 1);
      for (const [bx, byy, r] of [[cx + 6, by - 8, 1.6], [cx - 8, by - 6, 1.2], [cx + 2, by - 4, 1]]) oval(x, bx, byy, r, r, P.lite);
      const ey = by - ry * 0.95;
      for (const ex of [cx - 5, cx + 4]) { oval(x, ex, ey, 2.4, 3.2, '#ffffff'); oval(x, ex + 0.5, ey + 0.6, 1.4, 2.2, '#1a1428'); dot(x, '#ffffff', ex, ey - 1.5); }
      x.strokeStyle = P.deep; x.lineWidth = 1; x.beginPath(); x.arc(cx, ey + 3, 2.5, 0.2, Math.PI - 0.2); x.stroke();
      if (P.fire) { const fl = Math.sin(a * 2) * 1.5; fp(x, bandL(x, 0, 0, 0, 10, ['#fff4a0', '#ffb030', '#e04020']), () => { x.moveTo(cx - 4, by - ry * 2.1); x.quadraticCurveTo(cx - 2, by - ry * 2.1 - 7 - fl, cx + 1, by - ry * 2.1 - 9 - fl); x.quadraticCurveTo(cx + 2, by - ry * 2.1 - 4, cx + 4, by - ry * 2.1); x.closePath(); }); }
    }, P.fire ? '#3a0c10' : '#0c2414');
  },
  bat(a) {
    return E2(50, 34, x => {
      const f = Math.sin(a), cx = 25, cy = 16;
      for (const side of [-1, 1]) {
        const tipY = 6 - f * 9, midY = 14 - f * 4;
        const pts = [cx + side * 4, cy - 3, cx + side * 14, midY - 6, cx + side * 23, tipY, cx + side * 21, tipY + 8, cx + side * 17, midY + 6, cx + side * 13, midY + 3, cx + side * 9, cy + 7];
        pl(x, pts, bandL(x, cx, 0, cx + side * 24, 0, ['#5a3a7a', '#4a2c66', '#3a2052', '#2a163e']));
        ln(x, cx + side * 4, cy - 2, cx + side * 23, tipY, '#8a6aa8', 1); ln(x, cx + side * 13, midY - 3, cx + side * 17, midY + 6, '#7a5a98', 1); ln(x, cx + side * 9, cy - 1, cx + side * 13, midY + 3, '#7a5a98', 1);
      }
      oval(x, cx, cy + 1, 7, 8.5, bandR(x, cx - 3, cy - 3, 12, ['#7a5a9a', '#5e4280', '#4a3068', '#36204e']));
      tri(x, cx - 6, cy - 4, cx - 4, cy - 13, cx - 1, cy - 5, '#5e4280'); tri(x, cx + 6, cy - 4, cx + 4, cy - 13, cx + 1, cy - 5, '#4a3068'); dot(x, '#c890b0', cx - 4, cy - 9, 1, 3);
      glowEye(x, cx - 4, cy - 2, '#ff3050', '#ffd0d8'); glowEye(x, cx + 2, cy - 2, '#ff3050', '#ffd0d8');
      dot(x, '#ffffff', cx - 2, cy + 3, 1, 2); dot(x, '#ffffff', cx + 1, cy + 3, 1, 2); dot(x, '#2a1030', cx - 2, cy + 2, 4, 1);
      dot(x, '#3a2052', cx - 3, cy + 9, 2, 2); dot(x, '#3a2052', cx + 1, cy + 9, 2, 2);
    }, '#140a1c');
  },
  goblin(a, mage) {
    return E2(40, 46, x => {
      const b = Math.round(Math.sin(a) * 0.8); const skin = mage ? ['#9ad8a0', '#72b47a', '#54945c', '#3a7444'] : ['#a8d870', '#86b852', '#68983e', '#4a782c'];
      // legs
      for (const lx of [13, 22]) { dot(x, skin[2], lx, 33, 5, 10); dot(x, skin[3], lx + 3, 33, 2, 10); dot(x, '#4a3018', lx - 1, 42, 7, 3); }
      if (mage) { pl(x, [10, 18 + b, 30, 18 + b, 33, 43, 7, 43], bandL(x, 0, 0, 40, 0, ['#7a4ab0', '#5e3494', '#48247a', '#361a5e'])); dot(x, '#e8c040', 7, 41, 26, 2); }
      else { oval(x, 20, 27 + b, 10, 9, bandR(x, 16, 22, 16, skin)); pl(x, [10, 30 + b, 30, 30 + b, 28, 38, 12, 38], bandL(x, 0, 30, 0, 38, ['#9a6a3a', '#7a5028', '#5a3a1a'])); dot(x, '#c8a060', 12, 30 + b, 16, 1); }
      // arms
      oval(x, 9, 26 + b, 3.5, 6, skin[1]); oval(x, 31, 26 + b, 3.5, 6, skin[2]); oval(x, 8, 31 + b, 2.5, 2.5, skin[0]); oval(x, 32, 31 + b, 2.5, 2.5, skin[1]);
      // head
      const hy = 13 + b;
      pl(x, [11, hy - 1, 1, hy - 8, 4, hy - 4, 11, hy + 3], bandL(x, 0, 0, 12, 0, [skin[2], skin[1], skin[0]])); pl(x, [29, hy - 1, 39, hy - 8, 36, hy - 4, 29, hy + 3], bandL(x, 28, 0, 40, 0, [skin[0], skin[1], skin[2]]));
      dot(x, '#d88a8a', 4, hy - 6, 3, 1); dot(x, '#d88a8a', 33, hy - 6, 3, 1);
      oval(x, 20, hy, 10, 9, bandR(x, 16, hy - 5, 16, skin));
      dot(x, skin[3], 12, hy - 4, 16, 2);
      glowEye(x, 15, hy - 1, '#ffe040', '#1a1008'); glowEye(x, 23, hy - 1, '#ffe040', '#1a1008');
      oval(x, 20, hy + 3, 2, 1.6, skin[3]);
      dot(x, '#3a1010', 14, hy + 5, 12, 3); for (let i = 0; i < 4; i++) dot(x, '#f4f0d8', 15 + i * 3, hy + 5, 1, 2);
      if (mage) {
        pl(x, [9, hy - 6, 20, hy - 22 + b, 31, hy - 6], bandL(x, 9, 0, 31, 0, ['#8a5ac0', '#6a3ea4', '#4e2a86'])); oval(x, 20, hy - 6, 13, 2.5, '#4e2a86');
        dot(x, '#ffe060', 17, hy - 13, 1, 1); dot(x, '#ffe060', 22, hy - 16, 1, 1);
        const g = 0.5 + 0.5 * Math.sin(a); ln(x, 34, 46, 34, 12 + b, '#6a4a2a', 2); oval(x, 34, 10 + b, 3.5, 3.5, g > 0.5 ? '#ff60c0' : '#c03090'); dot(x, '#ffffff', 33, 9 + b, 1, 1);
      } else {
        x.save(); x.translate(34, 30 + b); x.rotate(0.45 + Math.sin(a) * 0.05);
        dot(x, '#6a4424', -2, -20, 4, 22); dot(x, '#8a5e34', -1, -20, 1, 22); oval(x, 0, -21, 5, 5.5, bandR(x, -2, -23, 7, ['#9a6a3a', '#7a5028', '#5a3a1a'])); dot(x, '#c8c8d0', -5, -24, 2, 2); dot(x, '#c8c8d0', 3, -20, 2, 2); dot(x, '#c8c8d0', -1, -27, 2, 2);
        x.restore();
      }
    }, '#10180a');
  },
  wolf(a) {
    return E2(58, 40, x => {
      const br = Math.sin(a) * 0.6, ts = Math.sin(a) * 3;
      const fur = ['#b4bccc', '#949cb0', '#788096', '#5c6478', '#444a5c'];
      fp(x, bandL(x, 0, 0, 12, 0, [fur[1], fur[2], fur[3]]), () => { x.moveTo(46, 16); x.quadraticCurveTo(54, 10 + ts, 57, 4 + ts); x.quadraticCurveTo(55, 14 + ts, 48, 22); x.closePath(); });
      for (const [lx, d] of [[17, 0], [23, 1], [36, 1], [42, 0]]) { dot(x, d ? fur[3] : fur[4], lx, 25, 4, 12); dot(x, '#2a2e3a', lx - 1, 36, 6, 3); }
      oval(x, 31, 20 + br, 17, 9.5, bandR(x, 26, 14, 22, fur));
      oval(x, 30, 25 + br, 12, 4, fur[0]);
      for (let i = 0; i < 6; i++) tri(x, 18 + i * 4, 13 + br, 21 + i * 4, 7 + br - (i % 2) * 2, 24 + i * 4, 13 + br, fur[3]);
      // head
      oval(x, 13, 15, 9, 8, bandR(x, 10, 11, 12, fur));
      pl(x, [6, 14, -1, 19, 0, 22, 8, 21], fur[1]); dot(x, '#1a1a22', -1, 18, 2, 2);
      dot(x, '#f4f4f4', 1, 21, 1, 2); dot(x, '#f4f4f4', 4, 21, 1, 2); dot(x, '#4a1a20', 0, 21, 6, 1);
      tri(x, 10, 9, 12, 0, 15, 8, fur[2]); tri(x, 15, 9, 18, 1, 19, 9, fur[3]); dot(x, '#d8a0a8', 12, 4, 1, 3);
      glowEye(x, 8, 13, '#ffd040', '#fffbe0', 2, 1);
      for (let i = 0; i < 5; i++) tri(x, 16 + i * 2, 20, 18 + i * 2, 25, 20 + i * 2, 20, fur[0]);
    }, '#121420');
  },
  bee(a) {
    return E2(42, 36, x => {
      const f = Math.sin(a * 2);
      for (const [wx, wy, rot] of [[16, 9, -0.6], [24, 8, -0.2]]) { x.save(); x.translate(wx, wy); x.rotate(rot - f * 0.4); oval(x, 0, -6, 4, 8, bandL(x, 0, -14, 0, 2, ['#f4fcff', '#d4ecfc', '#b0d4f0'])); ln(x, 0, 1, 0, -12, '#90b8dc', 1); x.restore(); }
      const stripes = (yy) => ['#f8d038', '#2a2018'][Math.floor((yy) / 3) % 2];
      x.save(); x.beginPath(); x.ellipse(26, 21, 11, 8, 0.2, 0, Math.PI * 2); x.clip();
      for (let i = 14; i < 40; i += 3) { x.fillStyle = (Math.floor(i / 3) % 2) ? '#2a2018' : '#f8d038'; x.fillRect(i, 10, 3, 24); }
      x.fillStyle = bandR(x, 22, 16, 14, ['rgba(255,255,255,.25)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.25)']); x.fillRect(14, 10, 26, 24); x.restore();
      tri(x, 36, 21, 42, 25, 36, 25, '#3a2a18');
      oval(x, 15, 19, 6, 6, bandR(x, 13, 17, 8, ['#c89040', '#a87028', '#7a5018']));
      oval(x, 8, 17, 5, 5, bandR(x, 6, 15, 7, ['#4a3a2a', '#3a2a1c', '#2a1c10']));
      glowEye(x, 5, 15, '#ff3040', '#ffd0d0', 2, 3);
      ln(x, 7, 13, 4, 6, '#2a2018', 1); ln(x, 9, 13, 9, 5, '#2a2018', 1);
      for (const lx of [12, 16, 20]) ln(x, lx, 24, lx - 2, 30, '#2a2018', 1);
    }, '#1a1208');
  },
  skeleton(a) {
    return E2(40, 54, x => {
      const jaw = Math.max(0, Math.sin(a)) * 2, sw = Math.sin(a) * 0.5;
      const bone = ['#fcf8e8', '#e8e2c8', '#c8c0a0', '#a09878'];
      for (const lx of [13, 22]) { dot(x, bone[2], lx + 1, 36, 2, 8); dot(x, bone[1], lx, 43, 4, 2); dot(x, bone[2], lx + 1, 45, 2, 6); dot(x, bone[3], lx - 1, 51, 6, 2); }
      pl(x, [11, 34, 29, 34, 27, 40, 13, 40], '#4a2a3a'); for (let i = 12; i < 28; i += 3) dot(x, '#4a2a3a', i, 40, 2, 3 + (i % 2) * 2);
      oval(x, 20, 34, 6, 3, bone[1]);
      dot(x, bone[2], 19, 16, 3, 18);
      for (let i = 0; i < 4; i++) { const y = 19 + i * 3.5; fp(x, bone[1], () => { x.ellipse(20, y, 8 - i, 1.4, 0, 0, Math.PI * 2); }); }
      // shield arm
      oval(x, 8, 26, 7, 8, bandR(x, 6, 23, 10, ['#9a7a4a', '#7a5a32', '#5a3e20'])); oval(x, 8, 26, 2, 2, '#c8c8d0'); x.strokeStyle = '#5a5a68'; x.lineWidth = 1; x.beginPath(); x.ellipse(8, 26, 6.5, 7.5, 0, 0, 7); x.stroke();
      // sword arm
      ln(x, 27, 18, 31, 26, bone[1], 2); ln(x, 31, 26, 33, 20, bone[1], 2);
      x.save(); x.translate(33, 20); x.rotate(-0.25 + sw * 0.1); dot(x, '#a89a8a', -1, -22, 3, 21); dot(x, '#d0c8c0', -1, -22, 1, 21); dot(x, '#7a5a2a', -4, -1, 9, 2); dot(x, '#5a3a1a', 0, 1, 1, 4); dot(x, '#8a4a2a', 0, -14, 1, 2); x.restore();
      // skull
      oval(x, 20, 9, 8, 8, bandR(x, 17, 6, 11, bone));
      oval(x, 16.5, 9, 2.2, 2.6, '#1a0c14'); oval(x, 23.5, 9, 2.2, 2.6, '#1a0c14'); dot(x, '#ff4040', 16, 9, 1, 1); dot(x, '#ff4040', 23, 9, 1, 1);
      tri(x, 19, 12, 21, 12, 20, 14, '#2a1c20'); dot(x, '#2a1c20', 22, 4, 1, 3);
      dot(x, bone[2], 15, 15 + jaw, 10, 3); for (let i = 0; i < 4; i++) dot(x, '#2a1c20', 16 + i * 2, 15, 1, 1 + jaw);
    }, '#1a1420');
  },
  golem(a) {
    return E2(64, 68, x => {
      const br = Math.round(Math.sin(a) * 0.8), core = 0.5 + 0.5 * Math.sin(a);
      const stone = ['#c8b498', '#a8947a', '#887660', '#685a48', '#4a4034'];
      const slab = (x0, y0, w, h) => { x.fillStyle = bandL(x, x0, y0, x0 + w, y0 + h, stone); x.fillRect(x0, y0, w, h); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(x0, y0 + h - 2, w, 2); x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(x0, y0, w, 1); };
      slab(14, 48, 13, 18); slab(37, 48, 13, 18); dot(x, '#3a3428', 12, 64, 17, 3); dot(x, '#3a3428', 35, 64, 17, 3);
      slab(11, 20 + br, 42, 30);
      slab(0, 20 + br, 12, 24); slab(52, 20 + br, 12, 24); slab(-1, 42 + br, 14, 10); slab(51, 42 + br, 14, 10);
      slab(21, 3 + br, 22, 18);
      for (const [mx, my, mw] of [[13, 21, 10], [44, 30, 7], [22, 4, 8], [0, 22, 6], [38, 49, 8]]) { dot(x, '#4e8a34', mx, my + br, mw, 2); dot(x, '#6aa848', mx + 1, my + br, mw - 3, 1); dot(x, '#3a6a28', mx + 2, my + 2 + br, 2, 2); }
      ln(x, 18, 30 + br, 25, 38 + br, '#4a4034', 1); ln(x, 25, 38 + br, 22, 46 + br, '#4a4034', 1); ln(x, 44, 24 + br, 40, 34 + br, '#4a4034', 1);
      dot(x, '#1a1a14', 25, 10 + br, 14, 4); dot(x, core > 0.5 ? '#80ffb0' : '#40d080', 27, 11 + br, 4, 2); dot(x, core > 0.5 ? '#80ffb0' : '#40d080', 33, 11 + br, 4, 2);
      oval(x, 32, 33 + br, 7, 7, '#2a2a22'); oval(x, 32, 33 + br, 5, 5, core > 0.5 ? '#60f0a0' : '#38c070'); oval(x, 32, 33 + br, 2.5, 2.5, '#e0ffe8');
      x.strokeStyle = core > 0.5 ? '#60f0a0' : '#38c070'; x.lineWidth = 1; for (const [dx, dy] of [[-9, 0], [9, 0], [0, -9], [0, 9]]) { x.beginPath(); x.moveTo(32 + dx * 0.8, 33 + br + dy * 0.8); x.lineTo(32 + dx * 1.2, 33 + br + dy * 1.2); x.stroke(); }
    }, '#1e1a14');
  },
  specter(a) {
    return E2(48, 56, x => {
      const w = Math.sin(a), body = ['#f4f0ff', '#d8d0f4', '#b8acde', '#9888c4', '#7868a8'];
      fp(x, bandR(x, 19, 14, 34, body), () => {
        x.moveTo(8, 46); x.quadraticCurveTo(3, 14, 24, 4); x.quadraticCurveTo(45, 14, 40, 46);
        for (let i = 0; i <= 6; i++) { const xx = 40 - i * 32 / 6, yy = 46 + (i % 2 ? 9 : 2) + Math.sin(a + i) * 2.5; x.lineTo(xx + w, yy); }
        x.closePath();
      });
      fp(x, body[2], () => { x.moveTo(8, 26); x.quadraticCurveTo(0, 30 + w * 2, 2, 36 + w * 3); x.quadraticCurveTo(7, 32, 10, 32); x.closePath(); });
      fp(x, body[3], () => { x.moveTo(40, 26); x.quadraticCurveTo(48, 30 - w * 2, 46, 36 - w * 3); x.quadraticCurveTo(41, 32, 38, 32); x.closePath(); });
      oval(x, 18, 18, 3.6, 4.6, '#1a1030'); oval(x, 30, 18, 3.6, 4.6, '#1a1030'); dot(x, '#a8f0ff', 18, 18, 1, 2); dot(x, '#a8f0ff', 30, 18, 1, 2);
      oval(x, 24, 28 + w, 3, 4.5 + w, '#1a1030');
    }, '#2a1a48', (x, W, H) => { // dithered fade toward the tail (fake translucency)
      for (let yy = 34; yy < H; yy++) for (let xx = 0; xx < W; xx++) { const k = (yy - 34) / (H - 34); if (((xx + yy) % 2 === 0 && k > 0.25) || ((xx * 3 + yy) % 4 === 0 && k > 0.6)) x.clearRect(xx, yy, 1, 1); }
    });
  },
  darkmage(a) {
    return E2(44, 56, x => {
      const g = 0.5 + 0.5 * Math.sin(a), hem = Math.sin(a) * 1.5;
      const robe = ['#6a3a8a', '#52286e', '#3e1c56', '#2c1240', '#1e0a2e'];
      pl(x, [21, 6, 6, 50 + hem, 36, 50 - hem], bandL(x, 6, 0, 36, 0, robe));
      for (let i = 0; i < 4; i++) ln(x, 15 + i * 4, 22, 11 + i * 6, 49, robe[3 + (i % 2)], 1);
      dot(x, '#c8a040', 7, 48, 29, 2); for (let i = 8; i < 35; i += 4) dot(x, '#e8c860', i, 48, 1, 1);
      pl(x, [21, 2, 10, 24, 32, 24], bandL(x, 10, 0, 32, 0, ['#7a4a9a', '#5e3480', '#442264']));
      oval(x, 21, 17, 7, 7, '#0a0410'); glowEye(x, 17, 16, '#ffd040', '#fffbe0'); glowEye(x, 23, 16, '#ffd040', '#fffbe0');
      oval(x, 9, 32, 3, 3, '#c8c0b8'); oval(x, 33, 30, 3, 3, '#a8a098');
      ln(x, 36, 54, 36, 6, '#5a3a20', 2); dot(x, '#c8a040', 34, 10, 5, 2);
      oval(x, 36, 5, 4, 4, g > 0.5 ? '#ff60d0' : '#d03aa8'); dot(x, '#ffffff', 35, 3, 1, 2);
      for (let i = 0; i < 3; i++) { const an = a + i * 2.09; dot(x, '#ff90e0', 21 + Math.cos(an) * 17, 30 + Math.sin(an) * 6, 2, 2); }
    }, '#10061a');
  },
  armor(a) {
    return E2(52, 64, x => {
      const g = 0.5 + 0.5 * Math.sin(a), pl_ = Math.sin(a) * 1.5;
      const steel = ['#e8eef8', '#c0c8d8', '#98a2b8', '#768098', '#585f74'];
      for (const lx of [15, 28]) { x.fillStyle = bandL(x, lx, 0, lx + 9, 0, steel); x.fillRect(lx, 40, 9, 20); dot(x, '#3a4050', lx - 1, 58, 11, 5); dot(x, steel[0], lx + 1, 46, 2, 1); }
      x.fillStyle = bandL(x, 11, 0, 41, 0, steel); x.fillRect(11, 18, 30, 24); dot(x, '#a02040', 11, 36, 30, 5); dot(x, '#c83050', 11, 36, 30, 1); pl(x, [19, 41, 33, 41, 30, 52, 22, 52], '#8a1c38');
      oval(x, 19, 25, 6, 5, steel[1]); dot(x, steel[0], 15, 22, 5, 1);
      oval(x, 9, 20, 8, 6, bandR(x, 6, 17, 10, steel)); oval(x, 43, 20, 8, 6, bandR(x, 40, 17, 10, steel));
      x.fillStyle = bandL(x, 2, 0, 10, 0, steel); x.fillRect(2, 24, 8, 16);
      x.fillStyle = bandL(x, 16, 0, 36, 0, steel); x.fillRect(16, 3, 20, 16); pl(x, [16, 3, 26, -1, 36, 3], steel[1]);
      dot(x, '#0c0e16', 18, 9, 16, 3); dot(x, g > 0.5 ? '#70e0ff' : '#40a8d8', 20, 10, 4, 1); dot(x, g > 0.5 ? '#70e0ff' : '#40a8d8', 28, 10, 4, 1);
      for (let i = 0; i < 4; i++) dot(x, '#585f74', 22 + i * 2, 13, 1, 3);
      fp(x, '#c02848', () => { x.moveTo(25, 0); x.quadraticCurveTo(34, -2, 40 + pl_, 6); x.quadraticCurveTo(33, 3, 26, 4); x.closePath(); });
      dot(x, '#d8dee8', 44, 4, 4, 48); dot(x, '#ffffff', 44, 4, 1, 48); dot(x, '#98a2b8', 47, 4, 1, 48); tri(x, 44, 4, 46, -1, 48, 4, '#d8dee8'); dot(x, '#8a6a2a', 40, 40, 12, 3); dot(x, '#4a2a1a', 45, 43, 2, 6);
    }, '#14161e');
  },
  gking(a) {
    return E2(82, 82, x => {
      const b = Math.round(Math.sin(a)), cs = Math.sin(a) * 2;
      const skin = ['#b0dc78', '#90c058', '#72a242', '#56822e', '#3c6420'];
      fp(x, bandL(x, 0, 30, 0, 80, ['#d03040', '#b02030', '#8a1424', '#6a0c1a']), () => { x.moveTo(14, 30 + b); x.quadraticCurveTo(0, 60, 2 + cs, 80); x.lineTo(34, 74); x.lineTo(30, 32 + b); x.closePath(); });
      for (let i = 0; i < 6; i++) oval(x, 16 + i * 3, 32 + b, 3, 2.5, '#f0e8d8');
      for (const lx of [24, 46]) { dot(x, skin[3], lx, 58, 12, 18); dot(x, '#4a3018', lx - 2, 74, 16, 6); }
      oval(x, 41, 48 + b, 23, 17, bandR(x, 35, 40, 30, skin));
      oval(x, 41, 54 + b, 13, 9, skin[0]); dot(x, skin[2], 40, 52 + b, 2, 2);
      pl(x, [20, 56 + b, 62, 56 + b, 60, 64, 22, 64], bandL(x, 0, 56, 0, 64, ['#9a6a3a', '#7a5028', '#5a3a1a'])); dot(x, '#e8c040', 37, 56 + b, 8, 6); dot(x, '#ffe080', 38, 57 + b, 3, 2);
      oval(x, 20, 42 + b, 7, 11, skin[2]); oval(x, 63, 40 + b, 7, 10, skin[3]);
      const hy = 25 + b;
      pl(x, [24, hy, 4, hy - 12, 10, hy - 4, 24, hy + 8], bandL(x, 4, 0, 24, 0, [skin[3], skin[2], skin[1]])); pl(x, [58, hy, 78, hy - 12, 72, hy - 4, 58, hy + 8], bandL(x, 58, 0, 78, 0, [skin[1], skin[2], skin[3]]));
      oval(x, 41, hy, 18, 15, bandR(x, 35, hy - 8, 26, skin));
      dot(x, skin[4], 27, hy - 5, 28, 3);
      glowEye(x, 32, hy - 2, '#ffe040', '#1a1008', 4, 3); glowEye(x, 46, hy - 2, '#ffe040', '#1a1008', 4, 3);
      ln(x, 52, hy - 8, 56, hy + 4, '#c86060', 1);
      oval(x, 41, hy + 4, 3, 2.4, skin[3]);
      dot(x, '#3a1010', 30, hy + 8, 22, 5); for (let i = 0; i < 5; i++) dot(x, '#f4f0d8', 31 + i * 4.5, hy + 8, 2, 3); dot(x, '#f4f0d8', 32, hy + 11, 2, 2); dot(x, '#f4f0d8', 48, hy + 11, 2, 2);
      pl(x, [25, hy - 11, 27, hy - 25, 33, hy - 16, 41, hy - 28, 49, hy - 16, 55, hy - 25, 57, hy - 11], bandL(x, 0, hy - 28, 0, hy - 11, ['#fff0a0', '#f0c840', '#c89820', '#9a7010']));
      dot(x, '#ff3050', 40, hy - 18, 3, 3); dot(x, '#3080ff', 29, hy - 15, 2, 2); dot(x, '#3080ff', 52, hy - 15, 2, 2);
      x.save(); x.translate(70, 50 + b); x.rotate(0.35 + Math.sin(a) * 0.04);
      dot(x, '#6a4424', -3, -36, 6, 40); dot(x, '#8a5e34', -2, -36, 1, 40); oval(x, 0, -37, 9, 9, bandR(x, -3, -40, 11, ['#9a6a3a', '#7a5028', '#5a3a1a']));
      for (const [sx, sy] of [[-9, -40], [7, -42], [-2, -47], [8, -33], [-8, -32]]) tri(x, sx, sy, sx + 2, sy - 3, sx + 3, sy + 1, '#d0d0d8');
      x.restore();
    }, '#121c08');
  },
  guardian(a) {
    return E2(90, 90, x => {
      const pulse = 0.5 + 0.5 * Math.sin(a);
      const cry = ['#f4feff', '#c4f0ff', '#8ad8f8', '#56b0e8', '#3488c8', '#22609a'];
      for (const lx of [26, 52]) pl(x, [lx, 62, lx + 12, 62, lx + 10, 88, lx - 2, 88], bandL(x, lx, 0, lx + 12, 0, cry.slice(2)));
      pl(x, [45, 14, 72, 32, 66, 66, 24, 66, 18, 32], bandL(x, 18, 14, 72, 66, cry));
      pl(x, [45, 14, 45, 66, 24, 66, 18, 32], bandL(x, 18, 14, 45, 66, cry.slice(0, 4)));
      ln(x, 45, 14, 45, 66, '#ffffff', 1); ln(x, 18, 32, 45, 44, '#e8fbff', 1); ln(x, 72, 32, 45, 44, '#a8e0f8', 1);
      oval(x, 45, 42, 8, 9, '#1a3a6a'); oval(x, 45, 42, 6, 7, pulse > 0.5 ? '#ff70c0' : '#d040a0'); oval(x, 43, 40, 2, 2.5, '#ffe0f4');
      pl(x, [18, 32, 2, 38, 4, 68, 16, 62], bandL(x, 0, 32, 18, 68, cry.slice(1))); pl(x, [72, 32, 88, 38, 86, 68, 74, 62], bandL(x, 72, 32, 88, 68, cry.slice(2)));
      pl(x, [45, 0, 58, 10, 45, 22, 32, 10], bandL(x, 32, 0, 58, 22, cry)); dot(x, '#ff40a0', 38, 9, 4, 3); dot(x, '#ff40a0', 48, 9, 4, 3); dot(x, '#ffffff', 39, 9, 1, 1); dot(x, '#ffffff', 49, 9, 1, 1);
      for (let i = 0; i < 4; i++) { const an = a + i * Math.PI / 2; const sx = 45 + Math.cos(an) * 40, sy = 46 + Math.sin(an) * 12; pl(x, [sx, sy - 5, sx + 3, sy, sx, sy + 5, sx - 3, sy], cry[1 + (i % 3)]); }
    }, '#0a1a3a');
  },
  garva(a) {
    return E2(96, 106, x => {
      const w = Math.sin(a), gl = 0.5 + 0.5 * Math.sin(a * 2);
      const arm = ['#5a5a74', '#44445c', '#34344a', '#26263a', '#1a1a28'];
      fp(x, bandL(x, 0, 30, 0, 106, ['#5a1a6a', '#46125a', '#360a48', '#260638']), () => { x.moveTo(22, 28); x.quadraticCurveTo(4, 70, 2 + w * 3, 104); for (let i = 0; i < 6; i++) x.lineTo(10 + i * 12 + w * 2, 98 + (i % 2) * 6); x.lineTo(76, 104); x.quadraticCurveTo(80, 60, 68, 28); x.closePath(); });
      for (const lx of [30, 52]) { x.fillStyle = bandL(x, lx, 0, lx + 13, 0, arm); x.fillRect(lx, 70, 13, 30); dot(x, '#121218', lx - 2, 98, 17, 7); dot(x, '#7a7a98', lx + 2, 74, 2, 1); tri(x, lx + 6, 78, lx + 9, 72, lx + 12, 78, '#8a8aa8'); }
      x.fillStyle = bandL(x, 26, 0, 66, 0, arm); x.fillRect(26, 32, 40, 40);
      pl(x, [26, 64, 66, 64, 60, 76, 32, 76], '#9a1a3a'); dot(x, '#d03050', 26, 64, 40, 1);
      pl(x, [46, 36, 56, 44, 46, 60, 36, 44], '#2a2a3e'); dot(x, '#a040d0', 45, 46, 2, 4); dot(x, '#e090ff', 45, 47, 1, 2);
      for (const sx of [24, 68]) { oval(x, sx, 34, 12, 9, bandR(x, sx - 4, 30, 14, arm)); tri(x, sx - 8, 30, sx - 4, 18, sx, 29, arm[1]); tri(x, sx + 1, 29, sx + 5, 18, sx + 8, 30, arm[2]); }
      x.fillStyle = bandL(x, 36, 0, 56, 0, arm); x.fillRect(36, 8, 20, 24); pl(x, [36, 12, 26, 0, 40, 9], arm[1]); pl(x, [56, 12, 66, 0, 52, 9], arm[2]);
      for (let i = 0; i < 5; i++) dot(x, '#c8ccd8', 33 + i * 6, 26 + (i % 2) * 3, 2, 8);
      dot(x, '#06060a', 38, 17, 16, 4); glowEye(x, 40, 18, gl > 0.5 ? '#ff2040' : '#d01030', '#ffd0d8', 3, 1); glowEye(x, 48, 18, gl > 0.5 ? '#ff2040' : '#d01030', '#ffd0d8', 3, 1);
      x.save(); x.translate(14, 66); x.rotate(-0.22 + w * 0.02);
      dot(x, '#7a7a9c', -4, -62, 9, 62); dot(x, '#e4e6f4', -3, -62, 2, 62); dot(x, '#4a4a66', 3, -62, 2, 62); dot(x, '#2a2a3e', 0, -60, 1, 58); tri(x, -4, -62, 0.5, -70, 5, -62, '#a8aac4');
      for (let i = 0; i < 5; i++) dot(x, gl > 0.5 ? '#c060ff' : '#8030c0', 0, -54 + i * 10, 1, 4);
      dot(x, '#9a1a3a', -11, 0, 23, 4); dot(x, '#2a1a1a', -2, 4, 5, 10); oval(x, 0.5, 16, 4, 4, '#a040d0');
      x.restore();
      x.fillStyle = bandL(x, 6, 0, 18, 0, arm); x.fillRect(6, 36, 12, 26);
    }, '#0a0a12');
  },
};
const ENEMY_ANIM = {}; // name -> { frames, flash, float, period }
function buildEnemyArt() {
  const defs = {
    slime: [p => ENEMY_ART2.slime(p), 0, 9], redslime: [p => ENEMY_ART2.slime(p, { lite: '#ffd0c0', main: '#f06050', mid: '#d03a38', dark: '#a02430', deep: '#6a1420', fire: true }), 0, 9],
    bat: [p => ENEMY_ART2.bat(p), 1, 4], goblin: [p => ENEMY_ART2.goblin(p), 0, 12], gmage: [p => ENEMY_ART2.goblin(p, true), 0, 12],
    wolf: [p => ENEMY_ART2.wolf(p), 0, 12], bee: [p => ENEMY_ART2.bee(p), 1, 3], skeleton: [p => ENEMY_ART2.skeleton(p), 0, 14],
    golem: [p => ENEMY_ART2.golem(p), 0, 16], specter: [p => ENEMY_ART2.specter(p), 1, 12], darkmage: [p => ENEMY_ART2.darkmage(p), 1, 12],
    armor: [p => ENEMY_ART2.armor(p), 0, 14], gking: [p => ENEMY_ART2.gking(p), 0, 14], guardian: [p => ENEMY_ART2.guardian(p), 1, 12], garva: [p => ENEMY_ART2.garva(p), 0, 13],
  };
  for (const k in defs) {
    const [fn, float, period] = defs[k];
    const frames = [0, 1, 2, 3].map(i => fn(i / 4 * Math.PI * 2));
    ENEMY_ANIM[k] = { frames, flash: frames.map(f => silhouette(f)), dz: frames.map(f => silhouette(f, '#a050e8')), float: !!float, period };
    ENEMY_IMG[k] = frames[0]; ENEMY_IMG[k + ':flash'] = ENEMY_ANIM[k].flash[0];
  }
}
