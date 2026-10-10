// ===================== HD ART for the world map and Rosa (32px tiles, larger tall sprites) =====================
// Same hand-coded painting style as hd_art.js. Tall sprites are drawn at 2x and registered with their logical size (lw, lh).
function hdCrown(x, cx, cy, R, seed) {
  const r = mulberry(seed * 41 + 7), clumps = [];
  for (let i = 0; i < 30; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * 0.78; clumps.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.88, R * (0.3 + r() * 0.26)]); }
  const pass = (col, dx, dy, k) => { x.fillStyle = col; for (const [px_, py_, rr] of clumps) { x.beginPath(); x.arc(px_ + dx, py_ + dy, rr * k, 0, 7); x.fill(); } };
  pass('#173c1e', R * 0.06, R * 0.09, 1.05); pass('#245a2a', 0, R * 0.03, 1); pass('#2f7434', -R * 0.07, -R * 0.05, 0.82); pass('#4a9a44', -R * 0.13, -R * 0.12, 0.58); pass('#78c25a', -R * 0.19, -R * 0.19, 0.3);
}
function hdTallCanvas(w, h) { const c = mkCanvas(w, h); c.lw = w / 2; c.lh = h / 2; return [c, c.getContext('2d')]; }
function hdForest(v) {
  const [c, x] = hdTallCanvas(32, 40); x.lineJoin = 'round';
  const spots = [[[9, 17, 8.6], [23, 15, 8.6], [16, 29, 10]], [[11, 15, 9.6], [24, 24, 8.4], [9, 31, 8.2]], [[16, 15, 9.8], [8, 27, 8.2], [24, 29, 8.6]]][v % 3];
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(16, 37, 13, 3, 0, 0, 7); x.fill();
  for (const [cx, cy, R] of spots.slice().sort((a, b) => a[1] - b[1])) { x.fillStyle = '#4a2e14'; x.fillRect(cx - 1.4, cy + R * 0.6, 2.8, R * 0.9); hdCrown(x, cx, cy, R, v + Math.floor(cx)); }
  return pixelize(c, '#0f2a14');
}
function hdMountain(v, cave) {
  const [c, x] = hdTallCanvas(52, 48); x.lineJoin = 'round'; x.lineCap = 'round';
  const ax = 26 + [0, -3, 3][v % 3], ay = [4, 1, 8][v % 3];
  x.fillStyle = 'rgba(0,0,0,.22)'; x.beginPath(); x.ellipse(26, 44, 24, 3.6, 0, 0, 7); x.fill();
  const r = mulberry(v * 17 + 3);
  // two lower peaks behind the main one give a ridge line instead of a lone triangle
  const peak = (px_, py_, w, hgt, lt, dk) => { for (const side of [-1, 1]) { x.beginPath(); x.moveTo(px_, py_); x.lineTo(px_ + side * w, py_ + hgt); x.lineTo(px_, py_ + hgt); x.closePath(); const g = x.createLinearGradient(0, py_, 0, py_ + hgt); g.addColorStop(0, side < 0 ? lt : dk); g.addColorStop(1, side < 0 ? shd2(lt, 0.7) : shd2(dk, 0.7)); x.fillStyle = g; x.fill(); x.strokeStyle = '#2e241c'; x.lineWidth = 0.9; x.stroke(); } };
  peak(10, 22 + v * 2, 10, 20, 'rgb(176,150,112)', 'rgb(104,86,66)'); peak(43, 25 - v, 10, 18, 'rgb(176,150,112)', 'rgb(104,86,66)');
  const left = [[ax, ay], [ax - 5, ay + 9], [ax - 9, ay + 16], [ax - 14, ay + 23], [3, 42], [ax + 1, 43]], right = [[ax, ay], [ax + 6, ay + 8], [ax + 9, ay + 16], [ax + 15, ay + 24], [49, 42], [ax + 1, 43]];
  const face = (pts, light) => { x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); x.closePath(); const g = x.createLinearGradient(0, ay, 0, 44); g.addColorStop(0, light ? '#e0cba4' : '#8a7660'); g.addColorStop(0.5, light ? '#b09068' : '#5e4c3a'); g.addColorStop(1, light ? '#80684a' : '#3a2e22'); x.fillStyle = g; x.fill();
    x.save(); x.clip(); // strata and speckle only inside this face
    x.strokeStyle = light ? 'rgba(90,64,38,.45)' : 'rgba(20,12,6,.5)'; x.lineWidth = 1; for (let k = 0; k < 7; k++) { const yy = ay + 10 + k * 5; x.beginPath(); x.moveTo(0, yy + (light ? 0 : 2)); for (let i = 0; i <= 52; i += 4) x.lineTo(i, yy + Math.sin(i * 0.5 + k + v) * 1.2 + (light ? 0 : 2)); x.stroke(); }
    for (let k = 0; k < 90; k++) { x.fillStyle = r() < 0.5 ? (light ? 'rgba(255,240,205,.5)' : 'rgba(255,230,190,.2)') : 'rgba(30,18,8,.4)'; x.fillRect(Math.floor(r() * 52), ay + Math.floor(r() * 42), 1, 1); }
    x.restore(); };
  face(left, true); face(right, false);
  x.strokeStyle = 'rgba(30,20,12,.65)'; x.lineWidth = 1.2; for (let i = 0; i < 5; i++) { const sx = ax + 1 + r() * 5, sy = ay + 12 + r() * 20; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + 1 + r() * 3, sy + 3 + r() * 5); x.lineTo(sx - 1 + r() * 3, sy + 8 + r() * 5); x.stroke(); }
  x.strokeStyle = 'rgba(50,36,24,.5)'; x.lineWidth = 1; for (let i = 0; i < 6; i++) { const t = 0.25 + r() * 0.6, sx = ax + (r() - 0.5) * 4, sy = ay + 6 + r() * 26; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + (r() > 0.5 ? 1 : -1) * (3 + r() * 5), sy + 4 + r() * 6); x.stroke(); }
  x.strokeStyle = 'rgba(255,240,210,.35)'; x.lineWidth = 1; for (let i = 0; i < 4; i++) { const sy = ay + 8 + i * 7; x.beginPath(); x.moveTo(ax - 3 - i * 3, sy); x.lineTo(ax - 7 - i * 3.4, sy + 5); x.stroke(); }
  // snow cap with a jagged lower edge, lit on the left
  const snow = (sh2) => { x.beginPath(); x.moveTo(ax, ay - 0.5); x.lineTo(ax - 10, ay + 15.5); x.lineTo(ax - 6.4, ay + 11); x.lineTo(ax - 4, ay + 16); x.lineTo(ax - 0.5, ay + 11.4); x.lineTo(ax + 3, ay + 17); x.lineTo(ax + 6, ay + 12); x.lineTo(ax + 10, ay + 15); x.closePath(); const g = x.createLinearGradient(ax - 8, 0, ax + 8, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#e6eaf6'); g.addColorStop(0.52, '#b9c0da'); g.addColorStop(1, '#a2aac8'); x.fillStyle = g; x.fill(); };
  snow();
  x.strokeStyle = '#2e241c'; x.lineWidth = 1; x.beginPath(); x.moveTo(3, 42); x.lineTo(ax - 14, ay + 22); x.lineTo(ax, ay); x.lineTo(ax + 15, ay + 23); x.lineTo(49, 42); x.stroke();
  for (let i = 0; i < 14; i++) { x.strokeStyle = ['#3f8a34', '#5aa844', '#2e6a28'][i % 3]; x.lineWidth = 1.3; const bx = 3 + r() * 46, by = 41 + r() * 3; x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx + 1, by - 3, bx + (r() - 0.5) * 3, by - 5); x.stroke(); }
  if (cave) { x.fillStyle = '#1a1218'; x.beginPath(); x.moveTo(17, 43); x.lineTo(17, 30); x.quadraticCurveTo(26, 21, 35, 30); x.lineTo(35, 43); x.closePath(); x.fill(); x.strokeStyle = '#4a3a2c'; x.lineWidth = 2; x.stroke(); const g = x.createLinearGradient(0, 28, 0, 43); g.addColorStop(0, '#000'); g.addColorStop(1, '#2a1a2a'); x.fillStyle = g; x.beginPath(); x.moveTo(19, 43); x.lineTo(19, 31); x.quadraticCurveTo(26, 25, 33, 31); x.lineTo(33, 43); x.fill(); x.fillStyle = 'rgba(160,120,70,.5)'; x.fillRect(19, 40, 14, 3); }
  return pixelize(c, '#2e241c');
}
function hdTower() {
  const [c, x] = hdTallCanvas(32, 60); x.lineJoin = 'round';
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(16, 57, 12, 2.6, 0, 0, 7); x.fill();
  const g = x.createLinearGradient(7, 0, 25, 0); g.addColorStop(0, '#d2d2ea'); g.addColorStop(0.28, '#d2d2ea'); g.addColorStop(0.3, '#9a9ac0'); g.addColorStop(0.66, '#9a9ac0'); g.addColorStop(0.68, '#5e5e86'); g.addColorStop(1, '#5e5e86');
  x.fillStyle = g; x.fillRect(8, 16, 16, 40); x.strokeStyle = '#1a1a2a'; x.lineWidth = 1; x.strokeRect(8.5, 16.5, 15, 39);
  x.fillStyle = 'rgba(40,40,70,.3)'; for (let y = 20; y < 54; y += 6) x.fillRect(8, y, 16, 1);
  const cap = (a, b, w, h) => { const gg = x.createLinearGradient(a, 0, a + w, 0); gg.addColorStop(0, '#e6e6f8'); gg.addColorStop(1, '#6a6a92'); x.fillStyle = gg; x.fillRect(a, b, w, h); x.strokeRect(a + 0.5, b + 0.5, w - 1, h - 1); };
  cap(6, 13, 20, 4); cap(5, 31, 22, 3); for (let i = 0; i < 4; i++) cap(7 + i * 5, 9, 4, 5);
  x.fillStyle = '#10101e'; x.beginPath(); x.moveTo(13, 56); x.lineTo(13, 49); x.quadraticCurveTo(16, 45, 19, 49); x.lineTo(19, 56); x.fill();
  x.fillStyle = '#1a1a2a'; x.fillRect(14, 22, 4, 7); x.fillStyle = '#7fe0ff'; x.fillRect(15, 23, 2, 5); x.fillRect(14, 40, 4, 5);
  // the crystal above
  const gl = x.createRadialGradient(16, 4, 1, 16, 4, 9); gl.addColorStop(0, 'rgba(127,230,255,.7)'); gl.addColorStop(1, 'rgba(127,230,255,0)'); x.fillStyle = gl; x.fillRect(6, -6, 20, 20);
  x.fillStyle = '#8ae8ff'; x.beginPath(); x.moveTo(16, -1); x.lineTo(19.5, 5); x.lineTo(16, 11); x.lineTo(12.5, 5); x.closePath(); x.fill(); x.fillStyle = '#e8fbff'; x.beginPath(); x.moveTo(16, 0); x.lineTo(14.4, 5); x.lineTo(16, 9); x.fill();
  return pixelize(c, '#1a1a2a');
}
function hdShrine() {
  const [c, x] = hdTallCanvas(40, 44); x.lineJoin = 'round';
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(20, 41, 17, 2.8, 0, 0, 7); x.fill();
  const stone = (a, b, w, h, d) => { const g = x.createLinearGradient(a, 0, a + w, 0); g.addColorStop(0, d ? '#7e847e' : '#d4d8d0'); g.addColorStop(0.5, d ? '#6a706a' : '#a8aea6'); g.addColorStop(1, d ? '#4a504a' : '#767c74'); x.fillStyle = g; x.fillRect(a, b, w, h); x.strokeStyle = '#2a302a'; x.lineWidth = 1; x.strokeRect(a + 0.5, b + 0.5, w - 1, h - 1); };
  stone(2, 36, 36, 5, true); stone(5, 33, 30, 4, false);
  for (const cx of [8, 29]) { stone(cx, 14, 4, 20, false); stone(cx - 2, 12, 8, 3, false); }
  x.fillStyle = '#12201a'; x.fillRect(14, 16, 12, 17);
  const roof = x.createLinearGradient(0, 3, 0, 14); roof.addColorStop(0, '#6ac08c'); roof.addColorStop(1, '#2e6a4a'); x.fillStyle = roof; x.beginPath(); x.moveTo(3, 13); x.lineTo(20, 2); x.lineTo(37, 13); x.lineTo(34, 14); x.lineTo(20, 6); x.lineTo(6, 14); x.closePath(); x.fill(); x.strokeStyle = '#1a3a2a'; x.stroke();
  const gl = x.createRadialGradient(20, 24, 1, 20, 24, 8); gl.addColorStop(0, 'rgba(160,255,220,.9)'); gl.addColorStop(1, 'rgba(160,255,220,0)'); x.fillStyle = gl; x.fillRect(10, 14, 20, 20);
  x.fillStyle = '#c8fff0'; x.beginPath(); x.moveTo(20, 18); x.lineTo(23, 24); x.lineTo(20, 30); x.lineTo(17, 24); x.closePath(); x.fill();
  x.strokeStyle = '#3e7a4a'; x.lineWidth = 1.2; for (const [vx, vy] of [[8, 14], [31, 16], [9, 30]]) { x.beginPath(); x.moveTo(vx, vy); x.quadraticCurveTo(vx + 2, vy + 6, vx - 1, vy + 11); x.stroke(); }
  return pixelize(c, '#1a2420');
}
function hdRockGround(seed) {
  const [c, x] = hdc(); const r = mulberry(seed * 71 + 5);
  fillNoise(x, '#5a4c3c', '#7a6a54', seed + 11);
  for (let i = 0; i < 6; i++) patch(x, r() * HS, r() * HS, 5 + r() * 7, r() < 0.5 ? 'rgba(20,12,6,.32)' : 'rgba(210,190,150,.2)');
  x.strokeStyle = 'rgba(30,20,10,.55)'; x.lineWidth = 1; for (let i = 0; i < 5; i++) { x.beginPath(); let px_ = r() * HS, py_ = r() * HS; x.moveTo(px_, py_); for (let k = 0; k < 3; k++) { px_ += (r() - 0.5) * 9; py_ += 3 + r() * 5; x.lineTo(px_, py_); } x.stroke(); }
  for (let i = 0; i < 70; i++) { x.fillStyle = r() < 0.5 ? 'rgba(255,235,190,.35)' : 'rgba(25,15,8,.4)'; x.fillRect(Math.floor(r() * HS), Math.floor(r() * HS), 1, 1); }
  for (let i = 0; i < 3; i++) { const px_ = r() * 28, py_ = r() * 26, s2 = 1.4 + r() * 1.4; x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(px_ + 1, py_ + 2, 3 * s2, 1.6 * s2, 0, 0, 7); x.fill(); x.fillStyle = '#8e7a62'; x.beginPath(); x.ellipse(px_, py_, 2.8 * s2, 1.9 * s2, 0, 0, 7); x.fill(); x.fillStyle = '#c2ad8c'; x.beginPath(); x.ellipse(px_ - 0.8, py_ - 0.7, 1.4 * s2, 0.9 * s2, 0, 0, 7); x.fill(); }
  return c;
}
function hdSand(seed) {
  const [c, x] = hdc(); const r = mulberry(seed * 313 + 9);
  fillNoise(x, '#dcc482', '#efdca0', seed + 5);
  x.strokeStyle = 'rgba(176,138,70,.28)'; x.lineWidth = 1; for (let k = 0; k < 4; k++) { x.beginPath(); const y0 = 4 + k * 8; for (let i = 0; i <= HS; i += 2) { const yy = y0 + Math.sin(i / HS * Math.PI * 4 + k * 1.3) * 1.4; i ? x.lineTo(i, yy) : x.moveTo(i, yy); } x.stroke(); }
  x.strokeStyle = 'rgba(255,250,215,.45)'; for (let k = 0; k < 4; k++) { x.beginPath(); const y0 = 6 + k * 8; for (let i = 0; i <= HS; i += 2) { const yy = y0 + Math.sin(i / HS * Math.PI * 4 + k * 1.3) * 1.4; i ? x.lineTo(i, yy) : x.moveTo(i, yy); } x.stroke(); }
  for (let i = 0; i < 70; i++) { x.fillStyle = ['#c2a468', '#f4e4b0', '#b89860'][i % 3]; x.fillRect(Math.floor(r() * HS), Math.floor(r() * HS), 1, 1); }
  if (seed % 2) { const px_ = 6 + r() * 20, py_ = 6 + r() * 20; x.fillStyle = 'rgba(80,56,20,.3)'; x.beginPath(); x.ellipse(px_ + 0.6, py_ + 1.2, 2.2, 1.2, 0, 0, 7); x.fill(); x.fillStyle = '#d8c8b0'; x.beginPath(); x.ellipse(px_, py_, 2, 1.3, 0, 0, 7); x.fill(); }
  return c;
}
function hdPaving(seed) {
  const [c, x] = hdc(); const r = mulberry(seed * 211 + 4);
  x.fillStyle = '#6a6458'; x.fillRect(0, 0, HS, HS);
  const rows = [0, 10, 21, 32]; for (let j = 0; j < 3; j++) {
    let px_ = (j % 2) * -7 + r() * 3; while (px_ < HS) { const w = 11 + r() * 6, y0 = rows[j], h = rows[j + 1] - rows[j];
      const t = 0.9 + r() * 0.2, base = `rgb(${Math.round(190 * t)},${Math.round(182 * t)},${Math.round(166 * t)})`;
      const g = x.createLinearGradient(px_, y0, px_ + w, y0 + h); g.addColorStop(0, shd2(base, 1.12)); g.addColorStop(1, shd2(base, 0.86)); x.fillStyle = g;
      x.beginPath(); x.moveTo(px_ + 1, y0 + 1.4); x.lineTo(px_ + w - 1, y0 + 1); x.lineTo(px_ + w - 1.2, y0 + h - 1); x.lineTo(px_ + 1.2, y0 + h - 1.4); x.closePath(); x.fill();
      x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(px_ + 1.6, y0 + 1.6, w - 3, 0.9); x.fillStyle = 'rgba(40,34,24,.25)'; x.fillRect(px_ + 1.4, y0 + h - 2.4, w - 2.4, 1);
      for (let k = 0; k < 4; k++) { x.fillStyle = 'rgba(70,60,44,.22)'; x.fillRect(px_ + 2 + r() * (w - 5), y0 + 2 + r() * (h - 5), 1, 1); }
      px_ += w; }
  }
  if (seed % 3 === 0) for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(70,120,50,.4)'; x.fillRect(Math.floor(r() * 30), [9, 20, 31][i % 3], 2 + r() * 3, 1.4); }
  return c;
}
function shd2(col, k) { const a = col.match(/\d+/g).map(Number); return `rgb(${clamp(Math.round(a[0] * k), 0, 255)},${clamp(Math.round(a[1] * k), 0, 255)},${clamp(Math.round(a[2] * k), 0, 255)})`; }
function hdHills() {
  return hdOnGrass(2, x => {
    const mound = (cx, cy, w, h) => {
      x.fillStyle = 'rgba(10,40,10,.3)'; x.beginPath(); x.ellipse(cx + 1, cy + 1, w * 0.58, h * 0.22, 0, 0, 7); x.fill();
      const g = x.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0); g.addColorStop(0, '#9adc6a'); g.addColorStop(0.35, '#6cb248'); g.addColorStop(0.37, '#58a03c'); g.addColorStop(0.7, '#58a03c'); g.addColorStop(0.72, '#3a7a2c'); g.addColorStop(1, '#2e6a24');
      x.fillStyle = g; x.beginPath(); x.moveTo(cx - w / 2, cy); x.bezierCurveTo(cx - w * 0.45, cy - h * 1.05, cx + w * 0.45, cy - h * 1.05, cx + w / 2, cy); x.closePath(); x.fill(); x.strokeStyle = '#1f4a1c'; x.lineWidth = 0.9; x.stroke();
      x.strokeStyle = 'rgba(210,255,150,.5)'; x.lineWidth = 1; x.beginPath(); x.moveTo(cx - w * 0.3, cy - h * 0.5); x.quadraticCurveTo(cx - w * 0.12, cy - h * 0.82, cx + w * 0.04, cy - h * 0.8); x.stroke();
    };
    mound(10, 21, 21, 15); mound(23, 30, 19, 12);
  });
}
function hdTownIcon(blue) {
  const [c, x] = hdc(); x.drawImage(blue ? HD.sand[0] : HD.grass[1], 0, 0);
  const house = (a, b, roof, wall) => {
    x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(a + 1, b + 14, 14, 3);
    const wg = x.createLinearGradient(a, 0, a + 13, 0); wg.addColorStop(0, shd2(wall, 1.05)); wg.addColorStop(1, shd2(wall, 0.78)); x.fillStyle = wg; x.fillRect(a, b + 7, 13, 8); x.strokeStyle = '#3a2410'; x.lineWidth = 0.9; x.strokeRect(a + 0.5, b + 7.5, 12, 7);
    const rg = x.createLinearGradient(a, b, a + 15, b + 8); rg.addColorStop(0, shd2(roof, 1.25)); rg.addColorStop(1, shd2(roof, 0.7)); x.fillStyle = rg; x.beginPath(); x.moveTo(a - 1.5, b + 8); x.lineTo(a + 6.5, b); x.lineTo(a + 14.5, b + 8); x.closePath(); x.fill(); x.strokeStyle = shd2(roof, 0.4); x.stroke();
    x.fillStyle = '#4a2c14'; x.fillRect(a + 5, b + 10.5, 3, 4.5); x.fillStyle = '#9ad8ff'; x.fillRect(a + 1.8, b + 9.5, 2.4, 2.4); x.fillRect(a + 9, b + 9.5, 2.4, 2.4);
  };
  if (blue) { house(2, 8, 'rgb(46,106,208)', 'rgb(244,244,244)'); house(15, 14, 'rgb(46,106,208)', 'rgb(240,240,236)'); x.fillStyle = '#c8a040'; x.fillRect(27, 8, 1.4, 12); x.fillStyle = '#fff'; x.fillRect(22, 8, 5.4, 3.6); }
  else { house(1, 2, 'rgb(200,58,42)', 'rgb(240,226,192)'); house(16, 8, 'rgb(212,86,44)', 'rgb(240,226,192)'); house(5, 16, 'rgb(200,58,42)', 'rgb(236,222,188)'); }
  return c;
}
function hdBridge(vertical) {
  const [c, x] = hdc(); x.drawImage(HD.water[0], 0, 0);
  const plank = (a, b, w, h) => { const g = vertical ? x.createLinearGradient(0, b, 0, b + h) : x.createLinearGradient(a, 0, a + w, 0); g.addColorStop(0, '#d29a58'); g.addColorStop(1, '#8a5a2c'); x.fillStyle = g; x.fillRect(a, b, w, h); x.strokeStyle = '#3a2410'; x.lineWidth = 0.8; x.strokeRect(a + 0.4, b + 0.4, w - 0.8, h - 0.8); };
  if (vertical) { x.fillStyle = '#2a1608'; x.fillRect(3, 0, 26, 32); for (let y = 0; y < 32; y += 8) plank(4, y + 0.5, 24, 7); for (const a of [2, 28]) { x.fillStyle = '#4a2c14'; x.fillRect(a, 0, 2.4, 32); x.fillStyle = '#b07a42'; x.fillRect(a, 0, 1, 32); } }
  else { x.fillStyle = '#2a1608'; x.fillRect(0, 3, 32, 26); for (let a = 0; a < 32; a += 8) plank(a + 0.5, 4, 7, 24); for (const b of [2, 28]) { x.fillStyle = '#4a2c14'; x.fillRect(0, b, 32, 2.4); x.fillStyle = '#b07a42'; x.fillRect(0, b, 32, 1); } }
  return c;
}
function hdLamp() {
  return hdOnGrass(4, x => {
    x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(17, 29, 7, 2.2, 0, 0, 7); x.fill();
    const g = x.createLinearGradient(14, 0, 19, 0); g.addColorStop(0, '#5a5a70'); g.addColorStop(1, '#22222e'); x.fillStyle = g; x.fillRect(14.6, 10, 3, 19); x.fillRect(12, 26, 8, 3);
    x.fillStyle = '#2a2a38'; x.beginPath(); x.moveTo(10, 8); x.lineTo(22, 8); x.lineTo(20, 3); x.lineTo(12, 3); x.closePath(); x.fill(); x.fillRect(15, 0.8, 2, 2.4);
    const gl = x.createRadialGradient(16, 6, 0.5, 16, 6, 14); gl.addColorStop(0, 'rgba(255,230,140,.7)'); gl.addColorStop(1, 'rgba(255,200,90,0)'); x.fillStyle = gl; x.fillRect(0, -6, 32, 26);
    x.fillStyle = '#ffe890'; x.fillRect(12.6, 4, 6.8, 4); x.fillStyle = '#fffbe0'; x.fillRect(14.2, 4.6, 3.6, 2.4);
  });
}
function hdBarrel() {
  return hdOnGrass(6, x => {
    x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(16, 28, 11, 3, 0, 0, 7); x.fill();
    const g = x.createLinearGradient(6, 0, 26, 0); g.addColorStop(0, '#d29a58'); g.addColorStop(0.3, '#b27a3e'); g.addColorStop(0.7, '#8a5a2c'); g.addColorStop(1, '#5e3a1a');
    x.fillStyle = g; x.beginPath(); x.moveTo(8, 9); x.bezierCurveTo(4, 14, 4, 22, 8, 27); x.lineTo(24, 27); x.bezierCurveTo(28, 22, 28, 14, 24, 9); x.closePath(); x.fill(); x.strokeStyle = '#2e1808'; x.lineWidth = 1; x.stroke();
    x.strokeStyle = 'rgba(40,20,8,.5)'; x.lineWidth = 0.8; for (const px_ of [12, 16, 20]) { x.beginPath(); x.moveTo(px_, 10); x.lineTo(px_, 27); x.stroke(); }
    for (const y of [12.5, 23]) { x.fillStyle = '#5a5a68'; x.fillRect(5.2, y, 21.6, 2.4); x.fillStyle = '#9a9aa8'; x.fillRect(5.2, y, 21.6, 0.9); }
    x.fillStyle = '#c28a50'; x.beginPath(); x.ellipse(16, 9, 8.2, 3.2, 0, 0, 7); x.fill(); x.strokeStyle = '#2e1808'; x.stroke(); x.fillStyle = '#8a5a2c'; x.beginPath(); x.ellipse(16, 9.4, 6.4, 2.2, 0, 0, 7); x.fill();
  });
}
function buildHDWorld() {
  HD.grassW = []; for (let v = 0; v < 12; v++) HD.grassW.push(hdGrass(20 + v, 0, true)); // quieter lawn for the open world map
  HD.rock = [hdRockGround(1), hdRockGround(2), hdRockGround(3), hdRockGround(4)];
  HD.sand = [hdSand(1), hdSand(2), hdSand(3), hdSand(4)];
  HD.paving = [hdPaving(1), hdPaving(2), hdPaving(3), hdPaving(4)];
  Object.assign(HD.tile, { hills: hdHills(), townIcon: hdTownIcon(false), townIcon2: hdTownIcon(true), bridge: hdBridge(false), bridgeV: hdBridge(true), lamp: hdLamp(), barrel: hdBarrel() });
  Object.assign(HD.tall, { forest: [0, 1, 2].map(hdForest), mountain: [0, 1, 2].map(v => hdMountain(v, false)), caveIcon: [hdMountain(0, true)], towerIcon: [hdTower()], shrineIcon: [hdShrine()] });
}
