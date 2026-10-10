// ===================== HD ART: 32px tiles and sprites for maps that opt in with `hd: true` =====================
// The world layer is rendered at 2x density (PX), so a 32x32 picture drawn into a 16x16 logical tile carries four times the detail.
// Everything here is painted in code with soft shading, tufted grass, shingled roofs and so on; nothing is copied from other games.
const HD = { grass: [], path: [], water: [], tile: {}, tall: {}, fringe: {}, spr: {} };
const HS = 32;
function hdc(w = HS, h = HS) { const c = mkCanvas(w, h), x = c.getContext('2d'); return [c, x]; }
function mixHex(a, b, t) { const A = hex(a), B = hex(b); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; }
// seamless (periodic) low-frequency noise in 0..1 so tiles repeat without visible seams
function pnoise(x, y, s) {
  const k = Math.PI * 2 / HS;
  return 0.5 + 0.2 * Math.sin((x + 2 * y + s * 3.1) * k) + 0.16 * Math.sin((2 * x - y + s * 1.7) * k) + 0.1 * Math.sin((3 * x + 3 * y + s * 5.3) * k) + 0.06 * Math.sin((x - 4 * y + s) * k);
}
function fillNoise(x, c0, c1, s, w = HS, h = HS) {
  const img = x.createImageData(w, h), d = img.data;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const t = clamp(pnoise(i, j, s), 0, 1), c = mixHex(c0, c1, t), o = (j * w + i) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; }
  x.putImageData(img, 0, 0);
}
const wrap9 = fn => { for (const dx of [-HS, 0, HS]) for (const dy of [-HS, 0, HS]) fn(dx, dy); };
function blade(x, bx, by, h, lean, col, w = 1) { x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx + lean * 0.25, by - h * 0.6, bx + lean, by - h); x.stroke(); }
const GRASS_COLS = ['#3a742b', '#4a8532', '#5f9f3f', '#79bb4c', '#8fd05c'];
function grassBlades(x, r, n, minH = 2, maxH = 5) {
  for (let i = 0; i < n; i++) {
    const bx = r() * HS, by = r() * HS, h = minH + r() * (maxH - minH), lean = (r() - 0.5) * 3, col = GRASS_COLS[Math.floor(Math.pow(r(), 0.8) * GRASS_COLS.length)];
    wrap9((dx, dy) => { if (bx + dx > -4 && bx + dx < HS + 4 && by + dy > -2 && by + dy < HS + 6) blade(x, bx + dx, by + dy, h, lean, col); });
  }
}
function patch(x, cx, cy, rad, col) { wrap9((dx, dy) => { const g = x.createRadialGradient(cx + dx, cy + dy, 0, cx + dx, cy + dy, rad); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(cx + dx - rad, cy + dy - rad, rad * 2, rad * 2); }); }

function hdGrass(seed, flowers = 0, calm = false) {
  const [c, x] = hdc(); const r = mulberry(seed * 977 + 13);
  fillNoise(x, '#417d2e', '#74b348', seed);
  for (let i = 0; i < 7; i++) patch(x, r() * HS, r() * HS, 5 + r() * 8, r() < 0.55 ? 'rgba(20,56,18,.30)' : 'rgba(190,235,110,.26)');
  if (seed % 2) patch(x, r() * HS, r() * HS, 9, 'rgba(200,190,90,.22)'); else patch(x, r() * HS, r() * HS, 9, 'rgba(30,110,90,.18)');
  grassBlades(x, r, 120, 2, 6);
  // darker tuft clusters: a few overlapping blades with a shadow beneath give the lawn depth
  for (let i = 0; i < 6; i++) { const bx = r() * HS, by = 6 + r() * 24; wrap9((dx, dy) => { if (bx + dx > -5 && bx + dx < HS + 5 && by + dy > 0 && by + dy < HS + 6) { x.fillStyle = 'rgba(12,40,12,.28)'; x.beginPath(); x.ellipse(bx + dx, by + dy + 0.5, 3.2, 1.1, 0, 0, 7); x.fill(); for (let k = -2; k <= 2; k++) blade(x, bx + dx + k * 1.1, by + dy, 4.5 - Math.abs(k) * 0.7, k * 0.9, GRASS_COLS[1 + (k + 2) % 4], 1.1); } }); }
  for (let i = 0; i < 18; i++) { x.fillStyle = 'rgba(220,255,150,.5)'; x.fillRect(Math.floor(r() * HS), Math.floor(r() * HS), 1, 1); }
  if (calm ? seed % 5 === 0 : (seed % 4 === 1 || seed === 6)) { const px_ = 5 + r() * 22, py_ = 6 + r() * 22, s2 = 1 + r() * 0.8; x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(px_ + 0.8, py_ + 1.8 * s2, 3.2 * s2, 1.8 * s2, 0, 0, 7); x.fill(); x.fillStyle = '#85847c'; x.beginPath(); x.ellipse(px_, py_, 3 * s2, 2.1 * s2, 0, 0, 7); x.fill(); x.fillStyle = '#b8b6aa'; x.beginPath(); x.ellipse(px_ - 0.8, py_ - 0.7, 1.6 * s2, 1 * s2, 0, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(px_ - 1.4, py_ - 1.2, 1.2, 0.7); }
  const nf = flowers || (calm ? (seed % 8 === 3 ? 1 : 0) : (seed % 4 === 2 ? 2 : seed % 4 === 0 ? 1 : 0));
  for (let i = 0; i < nf; i++) hdFlower(x, 3 + r() * 26, 5 + r() * 24, ['#fff0b8', '#ffa8c4', '#ffffff', '#b8a4ff', '#ffe060', '#ff9a7a'][Math.floor(r() * 6)]);
  return c;
}
function hdFlower(x, fx, fy, col) {
  x.fillStyle = 'rgba(10,40,10,.3)'; x.beginPath(); x.ellipse(fx + 0.5, fy + 3.4, 2.4, 0.9, 0, 0, 7); x.fill();
  blade(x, fx, fy + 3.5, 4, 0.6, '#2f6a26', 1.2); blade(x, fx - 1.4, fy + 3.5, 2.6, -1, '#4a8a36'); blade(x, fx + 1.5, fy + 3.5, 2.6, 1, '#4a8a36');
  x.fillStyle = col; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - 0.6; x.beginPath(); x.arc(fx + Math.cos(a) * 1.9, fy + Math.sin(a) * 1.9 - 0.5, 1.5, 0, 7); x.fill(); }
  x.fillStyle = 'rgba(255,255,255,.4)'; x.beginPath(); x.arc(fx - 1.2, fy - 1.7, 0.7, 0, 7); x.fill();
  x.fillStyle = '#f0b830'; x.beginPath(); x.arc(fx, fy - 0.5, 1.2, 0, 7); x.fill(); x.fillStyle = '#b87a10'; x.fillRect(fx, fy - 0.2, 0.9, 0.9);
}
function hdPath(seed) {
  const [c, x] = hdc(); const r = mulberry(seed * 631 + 5);
  fillNoise(x, '#c19b60', '#d9b97d', seed + 3);
  for (let i = 0; i < 4; i++) patch(x, r() * HS, r() * HS, 5 + r() * 5, r() < 0.5 ? 'rgba(120,84,40,.16)' : 'rgba(250,224,160,.16)');
  for (let k = 0; k < 3; k++) { x.strokeStyle = 'rgba(100,70,34,.22)'; x.lineWidth = 1; x.beginPath(); const y0 = 6 + k * 10 + r() * 3; for (let i = 0; i <= HS; i += 2) { const yy = y0 + Math.sin(i / HS * Math.PI * 4 + k) * 1.3; i ? x.lineTo(i, yy) : x.moveTo(i, yy); } x.stroke(); }
  for (let i = 0; i < 90; i++) { x.fillStyle = ['#a8824c', '#e6c88f', '#b58d55', '#f0d8a4', '#8f6a3a'][i % 5]; x.fillRect(Math.floor(r() * HS), Math.floor(r() * HS), 1, 1); }
  for (let i = 0; i < 5; i++) {
    const px_ = 2 + r() * 28, py_ = 2 + r() * 28, rx = 1.2 + r() * 1.6;
    x.fillStyle = 'rgba(70,44,18,.35)'; x.beginPath(); x.ellipse(px_ + 0.7, py_ + 1.1, rx, rx * 0.65, 0, 0, 7); x.fill();
    x.fillStyle = ['#c9b79a', '#b3a283', '#d6c6a8'][i % 3]; x.beginPath(); x.ellipse(px_, py_, rx, rx * 0.7, 0, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.ellipse(px_ - rx * 0.3, py_ - rx * 0.25, rx * 0.4, rx * 0.25, 0, 0, 7); x.fill();
  }
  return c;
}
function hdWater(f) {
  const [c, x] = hdc();
  fillNoise(x, '#2761ab', '#337ac6', 4 + f * 0.6);
  const g = x.createLinearGradient(0, 0, 0, HS); g.addColorStop(0, 'rgba(120,180,255,.10)'); g.addColorStop(1, 'rgba(10,30,90,.18)'); x.fillStyle = g; x.fillRect(0, 0, HS, HS);
  for (let k = 0; k < 4; k++) {
    const y0 = 3 + k * 8 + f * 3 * (k % 2 ? -1 : 1); x.lineWidth = 1.3;
    for (const [w, a, off] of [[1.4, 'rgba(170,215,255,.85)', 0], [1.4, 'rgba(20,60,130,.45)', 1.8]]) {
      x.strokeStyle = a; x.beginPath();
      for (let i = 0; i <= HS; i += 2) { const yy = y0 + off + Math.sin((i / HS * 2 + k * 0.4 + f * 0.5) * Math.PI) * w; i ? x.lineTo(i, yy) : x.moveTo(i, yy); } x.stroke();
    }
  }
  const r = mulberry(31 + f); for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(255,255,255,.75)'; x.fillRect(Math.floor(r() * 30), Math.floor(r() * 30), 2, 1); }
  return c;
}
function hdFringe() {
  const [c, x] = hdc(); const r = mulberry(77);
  const g = x.createLinearGradient(0, 0, 0, 9); g.addColorStop(0, 'rgba(46,100,34,.95)'); g.addColorStop(0.5, 'rgba(58,116,43,.55)'); g.addColorStop(1, 'rgba(58,116,43,0)'); x.fillStyle = g; x.fillRect(0, 0, HS, 9);
  for (let i = 0; i < HS; i += 1) { const h = 2 + r() * 6; blade(x, i + 0.5, 0, -h, (r() - 0.5) * 3, GRASS_COLS[Math.floor(r() * 5)], 1.2); blade(x, i + 0.5, 0, -h * 0.6, (r() - 0.5) * 3, GRASS_COLS[1 + Math.floor(r() * 3)], 1.2); }
  for (let i = 0; i < 7; i++) { x.fillStyle = 'rgba(70,46,20,.28)'; x.fillRect(Math.floor(r() * 30), 9 + Math.floor(r() * 3), 2, 1); }
  return c;
}
function hdRoof(col) {
  const [c, x] = hdc(); const [d0, d1, l0, l1] = col; // base, dark, light, mid
  const finish = () => { // soft light from the upper left across the whole slope, plus moss/aging flecks
    const g = x.createLinearGradient(0, 0, HS, HS); g.addColorStop(0, 'rgba(255,230,200,.16)'); g.addColorStop(0.55, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(20,0,10,.22)'); x.fillStyle = g; x.fillRect(0, 0, HS, HS);
    const r = mulberry(11); for (let i = 0; i < 14; i++) { x.fillStyle = r() < 0.5 ? 'rgba(70,90,40,.28)' : 'rgba(255,220,190,.2)'; x.fillRect(Math.floor(r() * 30), Math.floor(r() * 30), 2, 1); }
  };
  x.fillStyle = d1; x.fillRect(0, 0, HS, HS);
  for (let row = 0; row < 4; row++) {
    const y = row * 8, off = row % 2 ? 4 : 0;
    for (let i = -off; i < HS; i += 8) {
      const g = x.createLinearGradient(0, y, 0, y + 8); g.addColorStop(0, l0); g.addColorStop(0.45, d0); g.addColorStop(1, l1);
      x.fillStyle = g; x.beginPath(); x.moveTo(i + 0.5, y); x.lineTo(i + 7.5, y); x.lineTo(i + 7.5, y + 5); x.quadraticCurveTo(i + 7.5, y + 8.5, i + 4, y + 8.5); x.quadraticCurveTo(i + 0.5, y + 8.5, i + 0.5, y + 5); x.closePath(); x.fill();
      x.strokeStyle = d1; x.lineWidth = 0.9; x.stroke();
      x.fillStyle = 'rgba(255,235,210,.35)'; x.fillRect(i + 1.5, y + 0.6, 5, 0.8);
    }
    x.fillStyle = 'rgba(40,10,5,.35)'; x.fillRect(0, y + 7.2, HS, 1.2);
  }
  finish();
  return c;
}
function hdWallBase(x) {
  fillNoise(x, '#eadbb5', '#f4e8c8', 9);
  const r = mulberry(404); for (let i = 0; i < 24; i++) { x.fillStyle = 'rgba(150,120,80,.10)'; x.fillRect(r() * 28, r() * 28, 3 + r() * 5, 1); }
  const beam = (a, b, w, h) => { const g = x.createLinearGradient(a, b, a + w, b + h); g.addColorStop(0, '#8a5a30'); g.addColorStop(1, '#5a3418'); x.fillStyle = g; x.fillRect(a, b, w, h); x.fillStyle = 'rgba(255,220,170,.25)'; x.fillRect(a, b, w > h ? w : 1, w > h ? 1 : h); };
  beam(0, 0, HS, 4); beam(0, 28, HS, 4); beam(0, 0, 4, HS); beam(28, 0, 4, HS);
  // stone footing along the bottom with irregular blocks
  const fr = mulberry(21); let fx = 0; while (fx < HS) { const w = 5 + Math.floor(fr() * 5); const g = x.createLinearGradient(0, 24, 0, 28); g.addColorStop(0, '#a8a49a'); g.addColorStop(1, '#77736a'); x.fillStyle = g; x.fillRect(fx + 0.5, 24, w - 1, 4); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(fx + 0.5, 24, w - 1, 0.9); fx += w; }
  x.strokeStyle = 'rgba(110,84,52,.35)'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(11, 8); x.lineTo(13.5, 13); x.lineTo(12, 18); x.stroke();
  const sh = x.createLinearGradient(0, 4, 0, 12); sh.addColorStop(0, 'rgba(60,40,20,.28)'); sh.addColorStop(1, 'rgba(60,40,20,0)'); x.fillStyle = sh; x.fillRect(4, 4, 24, 8);
}
function hdWall() { const [c, x] = hdc(); hdWallBase(x); return c; }
function hdWindow(seed) {
  const [c, x] = hdc(); hdWallBase(x);
  x.fillStyle = '#2e1a0c'; x.fillRect(7, 6, 18, 16);
  const g = x.createLinearGradient(0, 8, 0, 21); g.addColorStop(0, '#b8e6ff'); g.addColorStop(1, '#5b9ad6'); x.fillStyle = g; x.fillRect(9, 8, 14, 12);
  x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.moveTo(10, 19); x.lineTo(15, 8); x.lineTo(18, 8); x.lineTo(13, 19); x.fill();
  x.fillStyle = '#2e1a0c'; x.fillRect(15.4, 8, 1.4, 12); x.fillRect(9, 13.4, 14, 1.4);
  x.fillStyle = '#9a6a38'; x.fillRect(5, 21, 22, 3); x.fillStyle = '#c89258'; x.fillRect(5, 21, 22, 1);
  x.fillStyle = '#6a4422'; x.fillRect(6, 24, 20, 4);
  const r = mulberry(seed + 50); for (let i = 0; i < 6; i++) { blade(x, 8 + i * 3.2, 24.5, 3.5, (r() - 0.5) * 2, '#3f8a34'); hdFlowerHead(x, 8 + i * 3.2 + (r() - 0.5), 21.2 + r() * 1.2, ['#ff7a9a', '#ffe060', '#ffffff', '#ff9ac8'][(i + seed) % 4]); }
  return c;
}
function hdFlowerHead(x, fx, fy, col) { x.fillStyle = col; x.beginPath(); x.arc(fx, fy, 1.7, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.arc(fx - 0.5, fy - 0.5, 0.6, 0, 7); x.fill(); }
function hdDoor() {
  const [c, x] = hdc(); hdWallBase(x);
  x.fillStyle = '#251205'; x.beginPath(); x.moveTo(6, 32); x.lineTo(6, 10); x.quadraticCurveTo(16, 0, 26, 10); x.lineTo(26, 32); x.closePath(); x.fill();
  const g = x.createLinearGradient(8, 0, 24, 0); g.addColorStop(0, '#8a5328'); g.addColorStop(0.5, '#a56a36'); g.addColorStop(1, '#6e4220'); x.fillStyle = g;
  x.beginPath(); x.moveTo(8, 32); x.lineTo(8, 11); x.quadraticCurveTo(16, 3, 24, 11); x.lineTo(24, 32); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(40,20,8,.7)'; x.lineWidth = 0.9; for (const px_ of [12, 16, 20]) { x.beginPath(); x.moveTo(px_, 7 + Math.abs(px_ - 16) * 0.6); x.lineTo(px_, 32); x.stroke(); }
  x.fillStyle = '#4a2a10'; x.fillRect(8, 15, 16, 1.6); x.fillRect(8, 24, 16, 1.6);
  x.fillStyle = '#f2c84a'; x.beginPath(); x.arc(21, 21, 1.5, 0, 7); x.fill(); x.fillStyle = '#fff4b0'; x.fillRect(20.4, 20.2, 0.8, 0.8);
  x.fillStyle = '#9a9a96'; x.fillRect(5, 30, 22, 2); x.fillStyle = '#c4c4be'; x.fillRect(5, 30, 22, 0.8);
  return c;
}
function hdOnGrass(seed, draw) { const [c, x] = hdc(); x.drawImage(hdGrass(seed), 0, 0); draw(x); return c; }
function hdFence() {
  return hdOnGrass(3, x => {
    const wood = (a, b, w, h, vert) => { const g = vert ? x.createLinearGradient(a, 0, a + w, 0) : x.createLinearGradient(0, b, 0, b + h); g.addColorStop(0, '#b27a3e'); g.addColorStop(1, '#6a4020'); x.fillStyle = g; x.fillRect(a, b, w, h); x.fillStyle = 'rgba(255,225,170,.35)'; x.fillRect(a, b, vert ? 1 : w, vert ? h : 1); };
    x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 24, HS, 3);
    wood(0, 10, HS, 4, false); wood(0, 19, HS, 4, false);
    for (const a of [2, 19]) { wood(a, 6, 6, 21, true); x.fillStyle = '#d29a58'; x.beginPath(); x.moveTo(a, 6); x.lineTo(a + 3, 3.5); x.lineTo(a + 6, 6); x.fill(); }
  });
}
function hdFlowers() { return hdOnGrass(5, x => { const r = mulberry(88); for (let i = 0; i < 9; i++) hdFlower(x, 4 + r() * 24, 6 + r() * 20, ['#fff0b8', '#ff9ec0', '#ffffff', '#b8a4ff', '#ffe060'][i % 5]); }); }
function hdWell() {
  return hdOnGrass(7, x => {
    x.save(); x.translate(16, 17); x.scale(1.22, 1.22); x.translate(-16, -17);
    x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(16, 26, 13, 4, 0, 0, 7); x.fill();
    x.fillStyle = '#7e7e7a'; x.beginPath(); x.ellipse(16, 22, 11, 7, 0, 0, 7); x.fill();
    x.fillStyle = '#a8a8a2'; x.beginPath(); x.ellipse(16, 20.5, 11, 6.5, 0, 0, 7); x.fill();
    x.fillStyle = '#16294a'; x.beginPath(); x.ellipse(16, 20.5, 7.4, 4, 0, 0, 7); x.fill(); x.fillStyle = '#2f5fa0'; x.beginPath(); x.ellipse(15, 20, 4.4, 2, 0, 0, 7); x.fill();
    x.strokeStyle = 'rgba(60,60,58,.55)'; x.lineWidth = 0.8; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + 0.3; x.beginPath(); x.moveTo(16 + Math.cos(a) * 7.8, 20.5 + Math.sin(a) * 4.3); x.lineTo(16 + Math.cos(a) * 11, 20.5 + Math.sin(a) * 6.4); x.stroke(); }
    for (const a of [5, 25]) { x.fillStyle = '#6a4422'; x.fillRect(a, 6, 2.4, 15); x.fillStyle = '#b07a42'; x.fillRect(a, 6, 0.9, 15); }
    x.fillStyle = '#7a4a24'; x.fillRect(4, 6, 24, 2.6); x.fillStyle = '#c28a52'; x.fillRect(4, 6, 24, 0.9);
    x.fillStyle = '#5a3418'; x.fillRect(15.4, 8, 1.2, 6); x.fillStyle = '#8a8a86'; x.fillRect(14, 13.5, 4, 3); x.fillStyle = '#b8b8b2'; x.fillRect(14, 13.5, 4, 0.9);
    x.restore();
  });
}
function hdSign() {
  return hdOnGrass(9, x => {
    x.save(); x.translate(16, 18); x.scale(1.2, 1.2); x.translate(-16, -18);
    x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(16.5, 28, 7, 2.2, 0, 0, 7); x.fill();
    x.fillStyle = '#5e3a1a'; x.fillRect(15, 13, 3, 15); x.fillStyle = '#9c6a38'; x.fillRect(15, 13, 1, 15);
    const g = x.createLinearGradient(0, 5, 0, 18); g.addColorStop(0, '#c88a4a'); g.addColorStop(1, '#9a6430'); x.fillStyle = g; x.fillRect(5, 5, 22, 12);
    x.strokeStyle = '#4a2a10'; x.lineWidth = 1.1; x.strokeRect(5.5, 5.5, 21, 11);
    x.fillStyle = '#4a2a10'; for (let k = 0; k < 3; k++) x.fillRect(9, 8 + k * 3, 14 - k * 3, 1.2);
    x.fillStyle = 'rgba(255,235,190,.4)'; x.fillRect(6, 6, 20, 1);
    x.restore();
  });
}
function hdTree(v) {
  const [c, x] = hdc(32, 44); const r = mulberry(v * 53 + 11);
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(16, 41.5, 9, 2.4, 0, 0, 7); x.fill();
  const tg = x.createLinearGradient(12, 0, 21, 0); tg.addColorStop(0, '#7a4e26'); tg.addColorStop(0.5, '#5a3818'); tg.addColorStop(1, '#3a2210'); x.fillStyle = tg;
  x.beginPath(); x.moveTo(12.5, 40); x.quadraticCurveTo(13.5, 33, 13.6, 26); x.lineTo(19.2, 26); x.quadraticCurveTo(19.4, 33, 20.8, 40); x.quadraticCurveTo(16.5, 42, 12.5, 40); x.fill();
  x.strokeStyle = 'rgba(30,16,6,.5)'; x.lineWidth = 0.7; for (const a of [14.8, 16.6, 18.2]) { x.beginPath(); x.moveTo(a, 28); x.lineTo(a + (r() - 0.5), 39); x.stroke(); }
  const clumps = [];
  const R0 = 14.5 - (v % 2); for (let i = 0; i < 38; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R0 * 0.8; clumps.push([16 + Math.cos(a) * d, 17 + Math.sin(a) * d * 0.88, 4.6 + r() * 3.8]); }
  const pass = (col, dx, dy, k) => { x.fillStyle = col; for (const [cx, cy, rr] of clumps) { x.beginPath(); x.arc(cx + dx, cy + dy, rr * k, 0, 7); x.fill(); } };
  pass('#173c1e', 0.8, 1.2, 1.05); pass('#245a2a', 0, 0.4, 1); pass('#2f7434', -0.9, -0.6, 0.82); pass('#4a9a44', -1.7, -1.6, 0.58); pass('#78c25a', -2.4, -2.4, 0.3);
  for (let i = 0; i < 16; i++) { const [cx, cy, rr] = clumps[i % clumps.length]; x.fillStyle = 'rgba(210,255,150,.55)'; x.fillRect(cx - 2.4 + (r() - 0.5) * 3, cy - 2.4 + (r() - 0.5) * 3, 1.2, 1.2); }
  pixelize(c, '#0f2a14'); c.lw = 16; c.lh = 22; return c;
}
// 2x edge-smoothed copy of a 16px sprite (Scale2x), used for characters on HD maps
function epx2(src) {
  const w = src.width, h = src.height, sx = src.getContext('2d').getImageData(0, 0, w, h), S = new Uint32Array(sx.data.buffer);
  const out = mkCanvas(w * 2, h * 2), ox = out.getContext('2d'), oi = ox.createImageData(w * 2, h * 2), O = new Uint32Array(oi.data.buffer), W2 = w * 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, P = S[i], A = y > 0 ? S[i - w] : P, B = x < w - 1 ? S[i + 1] : P, C = x > 0 ? S[i - 1] : P, D = y < h - 1 ? S[i + w] : P;
    let p1 = P, p2 = P, p3 = P, p4 = P;
    if (C === A && C !== D && A !== B) p1 = A; if (A === B && A !== C && B !== D) p2 = B; if (D === C && D !== B && C !== A) p3 = C; if (B === D && B !== A && D !== C) p4 = D;
    const o = y * 2 * W2 + x * 2; O[o] = p1; O[o + 1] = p2; O[o + W2] = p3; O[o + W2 + 1] = p4;
  }
  ox.putImageData(oi, 0, 0); out.lw = w; out.lh = h; return out;
}
function buildHD() {
  for (let v = 0; v < 12; v++) HD.grass.push(hdGrass(v + 1));   // 12 variants so the lawn never shows a visible pattern
  for (let v = 0; v < 4; v++) HD.path.push(hdPath(v + 1));
  HD.water = [hdWater(0), hdWater(1)];
  const f = hdFringe(); HD.fringe = {};
  for (const [d, rot] of [['N', 0], ['E', Math.PI / 2], ['S', Math.PI], ['W', -Math.PI / 2]]) { const [c, x] = hdc(); x.translate(16, 16); x.rotate(rot); x.drawImage(f, -16, -16); HD.fringe[d] = c; }
  const roofR = ['#b8402e', '#6e2012', '#dc6a50', '#9a3020'], roofB = ['#2f6ac8', '#122e70', '#5a96ee', '#1f4a9c'];
  HD.tile = { roof: hdRoof(roofR), roofB: hdRoof(roofB), wall: hdWall(), window: hdWindow(1), door: hdDoor(), fence: hdFence(), flowers: hdFlowers(), well: hdWell(), sign: hdSign() };
  HD.tall = { tree: [hdTree(0), hdTree(1)] };
  buildHDWorld();
  for (const id in SPR) { const s = SPR[id]; HD.spr[id] = {}; for (const d of ['down', 'up', 'left', 'right']) HD.spr[id][d] = s[d].map(epx2); }
}
