// ===================== ART (procedural pixel art, 16px tiles) =====================
const T = 16;
function px(x, c, X, Y, W = 1, H = 1) { x.fillStyle = c; x.fillRect(X, Y, W, H); }
function pick2(r, a) { return a[Math.floor(r() * a.length)]; }
function speckle(x, r, cols, n, w = 16, h = 16) { for (let i = 0; i < n; i++) px(x, pick2(r, cols), Math.floor(r() * w), Math.floor(r() * h)); }

// ---- colour ramps (borrowed from Crystal Echo): coloured outlines + directional shading ----
function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; }
function hsl2rgb(h, s, l) { if (!s) return [l * 255, l * 255, l * 255]; const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]; }
function ramp(r, g, b, dl, toward, amt) {
  let [h, s, l] = rgb2hsl(r, g, b); l = clamp(l + dl, 0, 1);
  let dh = toward - h; if (dh > 0.5) dh -= 1; if (dh < -0.5) dh += 1; h = (h + dh * amt + 1) % 1; s = clamp(s + (dl < 0 ? 0.08 : -0.04), 0, 1);
  return hsl2rgb(h, s, l);
}
function stylize(c, opt = {}) {
  const x = c.getContext('2d'); const w = c.width, h = c.height; const d = x.getImageData(0, 0, w, h); const p = d.data;
  const src = new Uint8ClampedArray(p);
  const A = (i, j) => (i < 0 || j < 0 || i >= w || j >= h) ? 0 : src[(j * w + i) * 4 + 3];
  const isOut = (i, j) => { if (!A(i, j)) return false; const k = (j * w + i) * 4; return src[k] + src[k + 1] + src[k + 2] < 110; };
  const edge = (i, j) => !A(i, j) || isOut(i, j);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = (j * w + i) * 4; if (!src[k + 3]) continue;
    if (isOut(i, j)) {
      let n = 0, R = 0, G2 = 0, B = 0;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (A(ii, jj) && !isOut(ii, jj)) { const q = (jj * w + ii) * 4; R += src[q]; G2 += src[q + 1]; B += src[q + 2]; n++; } }
      if (n) { const [r2, g2, b2] = ramp(R / n, G2 / n, B / n, -0.36, 0.72, 0.35); const m = j > h * 0.55 ? 0.65 : 0.5; p[k] = r2 * (1 - m) + 20 * m; p[k + 1] = g2 * (1 - m) + 14 * m; p[k + 2] = b2 * (1 - m) + 30 * m; }
      continue;
    }
    let dl = 0;
    if (opt.grad) dl += (0.5 - j / h) * 0.14 + (0.5 - i / w) * 0.06;
    if (edge(i + 1, j) || edge(i, j + 1)) dl -= 0.1; else if (edge(i - 1, j) || edge(i, j - 1)) dl += 0.07;
    if (!dl) continue;
    const [r2, g2, b2] = ramp(src[k], src[k + 1], src[k + 2], dl, dl < 0 ? 0.68 : 0.12, 0.12);
    p[k] = r2; p[k + 1] = g2; p[k + 2] = b2;
  }
  x.putImageData(d, 0, 0); return c;
}
function E(w, h, fn, outline) { const c = mkCanvas(w, h); const x = c.getContext('2d'); fn(x, w, h); return stylize(pixelize(c, outline), { grad: true }); }
function ell(x, cx, cy, rx, ry, col) { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); }
function poly(x, pts, col) { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.closePath(); x.fill(); }
function rect(x, a, b, w, h, col) { x.fillStyle = col; x.fillRect(a, b, w, h); }

// ---------- tiles: three dream themes ----------
const THEMES = [
  { // 1-3F ゆうぐれの森: pastel grass, rose paths, soft teal hedges
    void: '#191230', floor: ['#a3d39a', '#97c98f', '#acd9a0', '#9ccf93'], flowers: ['#ffd6ec', '#fff3b8', '#d8e0ff'],
    path: ['#e6c9b4', '#dcbca6', '#efd6c2'], leaf: ['#2e5a56', '#3f7a6a', '#56987c', '#7cbc92'], trunk: ['#4a3452', '#5e4466'], sky: '#3a2a5a' },
  { // 4-6F 月あかりの森: blue grass, lilac paths, navy trees
    void: '#0d0c24', floor: ['#7fa9bd', '#76a0b6', '#88b2c4', '#7ba5ba'], flowers: ['#e8f0ff', '#c8d8ff', '#fff6d0'],
    path: ['#aaa2cc', '#a09ac2', '#b4acd6'], leaf: ['#1e2a58', '#2c3c74', '#3e5492', '#5a74b2'], trunk: ['#241a40', '#30244e'], sky: '#1a1840' },
  { // 7-10F 夢のいちばん奥: violet ground, pink paths, deep plum thickets
    void: '#09050f', floor: ['#9a7cb8', '#9174ae', '#a486c0', '#9678b2'], flowers: ['#ffc8f0', '#f8e0ff', '#c8a8ff'],
    path: ['#c69ccc', '#bc92c2', '#d0a8d6'], leaf: ['#2c1a44', '#3e265c', '#56367a', '#74509a'], trunk: ['#1a0e26', '#261634'], sky: '#140a22' },
];
const TILES = []; // TILES[theme] = { floor:[4], path:[4], wall:[3], face:[3], stairs }
function drawFloor(x, r, th) {
  px(x, th.floor[0], 0, 0, 16, 16); speckle(x, r, th.floor, 46);
  for (let i = 0; i < 3; i++) { const a = Math.floor(r() * 14) + 1, b = Math.floor(r() * 12) + 3; px(x, th.floor[1], a - 1, b + 1, 3, 1); px(x, th.floor[2], a, b, 1, 1); }
  if (r() < 0.45) { const a = Math.floor(r() * 12) + 2, b = Math.floor(r() * 12) + 2, c = pick2(r, th.flowers); px(x, c, a, b); px(x, c, a - 1, b + 1); px(x, c, a + 1, b + 1); px(x, c, a, b + 2); px(x, '#ffffff', a, b + 1); }
}
function drawPath(x, r, th) {
  px(x, th.path[0], 0, 0, 16, 16); speckle(x, r, th.path, 40);
  for (let i = 0; i < 2; i++) { const a = Math.floor(r() * 13), b = Math.floor(r() * 13); px(x, th.path[1], a, b + 1, 3, 1); px(x, th.path[2], a, b, 3, 1); }
}
// hedge seen from above (wall top) and with its front edge showing (when floor is below)
function drawWall(x, r, th, face) {
  px(x, th.leaf[0], 0, 0, 16, 16);
  const blob = (cx, cy, rr, col) => { for (let yy = -rr; yy <= rr; yy++) for (let xx = -rr; xx <= rr; xx++) if (xx * xx + yy * yy <= rr * rr + rr * 0.6) { const X = Math.round(cx + xx), Y = Math.round(cy + yy); if (X >= 0 && X < 16 && Y >= 0 && Y < 16) px(x, col, X, Y); } };
  const n = 5;
  for (let i = 0; i < n; i++) { const cx = 2 + r() * 12, cy = 2 + r() * (face ? 7 : 12), rr = 3 + Math.floor(r() * 2); blob(cx, cy, rr, th.leaf[1]); blob(cx - 0.6, cy - 0.8, rr - 1, th.leaf[2]); if (r() < 0.6) blob(cx - 1.2, cy - 1.4, 1, th.leaf[3]); }
  if (face) {
    px(x, th.trunk[1], 0, 11, 16, 5); px(x, th.trunk[0], 0, 15, 16, 1);
    for (let i = 0; i < 16; i += 4) { const o = Math.floor(r() * 2); px(x, th.trunk[0], i + o, 11, 1, 4); }
    for (let i = 0; i < 16; i++) if (r() < 0.6) px(x, th.leaf[1], i, 10 + (r() < 0.5 ? 1 : 0));
  }
  if (r() < 0.3) { const a = 2 + Math.floor(r() * 12), b = 2 + Math.floor(r() * 7); px(x, pick2(r, th.flowers), a, b); }
}
function drawStairs(x, th) {
  // a staircase sinking into a soft glow
  px(x, '#1a1030', 1, 1, 14, 14);
  for (let i = 0; i < 4; i++) { const y = 2 + i * 3, w = 12 - i * 2; px(x, '#e8dcf6', 2 + i, y, w, 1); px(x, '#a898c8', 2 + i, y + 1, w, 1); px(x, '#5a4a7a', 2 + i, y + 2, w, 1); }
  px(x, '#f6eaff', 1, 1, 14, 1); px(x, '#f6eaff', 1, 1, 1, 14); px(x, '#3a2a5a', 14, 1, 1, 14); px(x, '#3a2a5a', 1, 14, 14, 1);
}
function buildTiles() {
  THEMES.forEach((th, i) => {
    const mk = (fn, seed) => { const c = mkCanvas(16, 16); fn(c.getContext('2d'), mulberry(seed)); return c; };
    TILES[i] = {
      floor: [0, 1, 2, 3].map(v => mk((x, r) => drawFloor(x, r, th), 100 + i * 31 + v * 7)),
      path: [0, 1, 2, 3].map(v => mk((x, r) => drawPath(x, r, th), 300 + i * 31 + v * 7)),
      wall: [0, 1, 2].map(v => mk((x, r) => drawWall(x, r, th, false), 500 + i * 31 + v * 7)),
      face: [0, 1, 2].map(v => mk((x, r) => drawWall(x, r, th, true), 700 + i * 31 + v * 7)),
      stairs: mk(x => drawStairs(x, th), 1),
    };
  });
}

// ---------- the hero: Haru in pajamas and a nightcap (16x16 templates) ----------
const HARU_PAL = { H: '#6a4632', S: '#f6d2b0', E: '#1a1a2a', C: '#93c4f2', A: '#f6e27a', P: '#7aaee6', B: '#f2a2c4', N: '#3a4a9a', W: '#ffffff' };
const HARU_HEAD = {
  down: ['.....OOOOOO.OO..', '....ONNNNNNOWWO.', '...ONNNNNNNNOWO.', '...OWWWWWWWWOO..', '...OHHHHHHHHO...', '...OHSSSSSSHO...', '...OSSESSESSO...', '...OSSESSESSO...', '....OOSSSSOO....'],
  up: ['.....OOOOOO.OO..', '....ONNNNNNOWWO.', '...ONNNNNNNNOWO.', '...OWWWWWWWWOO..', '...OHHHHHHHHO...', '...OHHHHHHHHO...', '...OHHHHHHHHO...', '...OSHHHHHHSO...', '....OOHHHHOO....'],
  left: ['.....OOOOOO.....', '....ONNNNNNOOO..', '...ONNNNNNNNNWO.', '...OWWWWWWWWOWO.', '...OHHHHHHHHOO..', '...OSSSHHHHHO...', '...OSESSHHHHO...', '..OSSSSSSHHO....', '...OOSSSSOO.....'],
};
const HARU_BODY = {
  down: ['...OCCCCCCCCO...', '..OSOCCACCCOSO..', '..OSOCCACCCOSO..', '...OOCCCCCCOO...'],
  up: ['...OCCCCCCCCO...', '..OSOCCCCCCOSO..', '..OSOCCCCCCOSO..', '...OOCCCCCCOO...'],
  left: ['....OCCCCCCO....', '....OCSCACCO....', '....OCSCCCCO....', '....OCCCCCCO....'],
};
const LEGS = {
  A: ['....OPPOOPPO....', '....OPPOOPPO....', '....OBBOOBBO....'],
  B: ['....OPPOOPPO....', '....OBBOOPPO....', '....OOO.OBBO....'],
  C: ['....OPPOOPPO....', '....OPPOOBBO....', '....OBBO.OOO....'],
  SA: ['.....OPPPPO.....', '.....OPPPPO.....', '.....OBBBBO.....'],
  SB: ['....OPPOOPPO....', '...OPPO..OPPO...', '...OBBO..OBBO...'],
};
function renderChar(pal, rows, flip) {
  const c = mkCanvas(16, 16), x = c.getContext('2d');
  for (let y = 0; y < 16; y++) for (let i = 0; i < 16; i++) {
    const ch = rows[y][i]; if (ch === '.') continue;
    let col = ch === 'O' ? '#1a1020' : pal[ch];
    if (ch === 'E') col = '#283058';
    px(x, col, flip ? 15 - i : i, y);
  }
  return stylize(c);
}
const HERO = {}; // dir -> [frames]
function buildHero() {
  const body = d => HARU_HEAD[d].concat(HARU_BODY[d]);
  HERO.down = ['A', 'B', 'A', 'C'].map(l => renderChar(HARU_PAL, body('down').concat(LEGS[l]), false));
  HERO.up = ['A', 'C', 'A', 'B'].map(l => renderChar(HARU_PAL, body('up').concat(LEGS[l]), false));
  HERO.left = ['SA', 'SB', 'SA', 'SB'].map(l => renderChar(HARU_PAL, body('left').concat(LEGS[l]), false));
  HERO.right = ['SA', 'SB', 'SA', 'SB'].map(l => renderChar(HARU_PAL, body('left').concat(LEGS[l]), true));
}
// facing for an 8-way direction: diagonals use their horizontal part, like the old games
function faceOf(dx, dy) { return dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down'; }

// ---------- 悪夢 (monsters): 2 idle frames each, drawn facing left ----------
const MON_DRAW = {
  moya(x, a) { // a sleepy lilac smog
    const b = a ? 1 : 0;
    ell(x, 8, 10 - b, 6, 4.5, '#b6a8d8'); ell(x, 5, 8 - b, 3.5, 3, '#c8bce6'); ell(x, 11, 8 - b, 3.5, 3.2, '#c4b6e2'); ell(x, 8, 6 - b, 3.5, 3, '#d6ccf0');
    rect(x, 4, 13, 2, 2, '#9c8ec4'); rect(x, 10, 13 - b, 2, 2, '#9c8ec4');
    rect(x, 5, 9 - b, 2, 1, '#2a1c40'); rect(x, 9, 9 - b, 2, 1, '#2a1c40'); rect(x, 7, 11 - b, 2, 1, '#6a5a90');
  },
  neko(x, a) { // a shadow cat with lamp eyes
    const b = a ? 1 : 0;
    poly(x, [12, 14, 15, 9 - b, 15, 6 - b, 13, 9, 12, 12], '#241a34');
    ell(x, 9, 11, 5, 3.5, '#2e2240'); ell(x, 5, 7, 3.6, 3.4, '#2e2240');
    poly(x, [2, 5, 2, 1, 5, 4], '#2e2240'); poly(x, [8, 5, 8, 1, 5, 4], '#2e2240');
    rect(x, 4, 13, 2, 2, '#241a34'); rect(x, 11, 13, 2, 2, '#241a34');
    rect(x, 3, 6, 2, 2, '#ffe060'); rect(x, 6, 6, 2, 2, '#ffe060'); rect(x, 3, 7, 1, 1, '#2a1c00'); rect(x, 6, 7, 1, 1, '#2a1c00');
  },
  moufu(x, a) { // a patchwork blanket ghost
    const b = a ? 1 : 0;
    x.fillStyle = '#e4ecff'; x.beginPath(); x.moveTo(2, 15); x.quadraticCurveTo(1, 3 - b, 8, 2 - b); x.quadraticCurveTo(15, 3 - b, 14, 15);
    for (let i = 0; i < 4; i++) x.lineTo(14 - i * 3 - 1.5, 13 + (i % 2) * 2 - b); x.closePath(); x.fill();
    rect(x, 9, 7 - b, 4, 4, '#9ab4f0'); rect(x, 3, 10 - b, 4, 3, '#f0b0c8'); rect(x, 10, 12 - b, 3, 2, '#b8e0a8');
    rect(x, 4, 5 - b, 2, 3, '#2a2448'); rect(x, 8, 5 - b, 2, 3, '#2a2448');
  },
  wani(x, a) { // a crocodile that ticks
    const b = a ? 1 : 0;
    ell(x, 9, 10, 6, 3.5, '#4e9a52'); poly(x, [1, 8 - b, 6, 6, 6, 12, 1, 11], '#5aae5c'); poly(x, [14, 9, 16, 12, 13, 12], '#3e7e44');
    rect(x, 2, 10 - b, 4, 1, '#fff'); rect(x, 4, 6, 2, 2, '#ffffff'); rect(x, 4, 6, 1, 1, '#1a1a1a');
    ell(x, 9, 10, 2.5, 2.5, '#fff6d8'); rect(x, 9, 8, 1, 2, '#3a2a1a'); rect(x, 9, 10, 2, 1, '#3a2a1a');
    rect(x, 5, 13, 2, 2, '#3e7e44'); rect(x, 12, 13, 2, 2, '#3e7e44');
  },
  kumo(x, a) { // a thundercloud
    const b = a ? 1 : 0;
    ell(x, 8, 6 - b, 6.5, 3.5, '#5a5c78'); ell(x, 5, 5 - b, 3.5, 3, '#6c6e8c'); ell(x, 11, 4 - b, 3.5, 3.2, '#6c6e8c');
    rect(x, 5, 6 - b, 2, 1, '#ffe86a'); rect(x, 9, 6 - b, 2, 1, '#ffe86a');
    poly(x, [8, 9, 5, 13, 7, 13, 6, 16, 10, 11, 8, 11, 9, 9], a ? '#fff2a0' : '#ffd84a');
  },
  piero(x, a) { // a skull clown
    const b = a ? 1 : 0;
    poly(x, [8, 0 - b, 4, 6 - b, 12, 6 - b], '#e04a7a'); ell(x, 8, 0.5 - b, 1.5, 1.5, '#ffe060');
    ell(x, 8, 8 - b, 4.5, 3.8, '#f2eee4'); rect(x, 5, 7 - b, 2, 2, '#1a1020'); rect(x, 9, 7 - b, 2, 2, '#1a1020'); rect(x, 7, 9 - b, 2, 2, '#e83040'); rect(x, 6, 11 - b, 4, 1, '#1a1020');
    poly(x, [3, 12, 13, 12, 12, 16, 4, 16], '#6a3aa8'); rect(x, 7, 12, 2, 4, '#ffe060'); ell(x, 3, 13, 1.6, 1.6, '#f2eee4'); ell(x, 13, 13, 1.6, 1.6, '#f2eee4');
  },
};
const MON_IMG = {}; // id -> { left:[2], right:[2], hit:[2] }
function buildMonsters() {
  for (const k in MON_DRAW) {
    const left = [0, 1].map(a => E(16, 16, x => MON_DRAW[k](x, a)));
    const right = left.map(c => { const m = mkCanvas(16, 16), x = m.getContext('2d'); x.translate(16, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return m; });
    MON_IMG[k] = { left, right, hitL: left.map(c => silhouette(c)), hitR: right.map(c => silhouette(c)) };
  }
}

// ---------- items on the floor ----------
const ITEM_DRAW = {
  candy(x) { poly(x, [2, 5, 5, 8, 2, 11], '#ff9ac8'); poly(x, [14, 5, 11, 8, 14, 11], '#ff9ac8'); ell(x, 8, 8, 3.6, 3.2, '#ffd0e6'); rect(x, 6, 7, 2, 1, '#fff'); rect(x, 8, 9, 2, 1, '#ff7ab0'); },
  bigcandy(x) { poly(x, [1, 3, 5, 8, 1, 13], '#ffb84a'); poly(x, [15, 3, 11, 8, 15, 13], '#ffb84a'); ell(x, 8, 8, 4.6, 4.2, '#ffe08a'); rect(x, 5, 6, 3, 1, '#fff'); rect(x, 7, 10, 4, 1, '#f09a2a'); },
  page(x) { // a torn picture-book page
    poly(x, [3, 3, 12, 2, 13, 13, 4, 14], '#f6efe0'); poly(x, [3, 3, 6, 3, 5, 6], '#e2d6c0');
    rect(x, 5, 5, 6, 4, '#b8d8f0'); ell(x, 8, 8, 2, 1.5, '#f0b0c8'); rect(x, 5, 10, 6, 1, '#a89a88'); rect(x, 5, 12, 4, 1, '#a89a88');
  },
  star(x) { poly(x, [8, 2, 10, 6, 14, 7, 11, 10, 12, 14, 8, 12, 4, 14, 5, 10, 2, 7, 6, 6], '#ffe46a'); rect(x, 7, 6, 2, 2, '#fffbe0'); },
};
const ITEM_IMG = {};
function buildItems() { for (const k in ITEM_DRAW) ITEM_IMG[k] = E(16, 16, ITEM_DRAW[k]); }
// lollipops in any colour (candies are told apart by colour until identified)
const LOLLI = {};
function lollipop(col) {
  if (!LOLLI[col]) {
    const [r, g, b] = hex(col), lite = `rgb(${Math.min(255, r + 50)},${Math.min(255, g + 50)},${Math.min(255, b + 50)})`, dark = `rgb(${r * 0.7 | 0},${g * 0.7 | 0},${b * 0.7 | 0})`;
    LOLLI[col] = E(16, 16, x => { ell(x, 8, 7, 4.2, 4, col); rect(x, 7, 10, 2, 5, '#f6f0e6'); ell(x, 6.5, 5.5, 1.4, 1.2, lite); rect(x, 9, 8, 2, 1, dark); rect(x, 5, 7, 1, 2, dark); });
  }
  return LOLLI[col];
}
