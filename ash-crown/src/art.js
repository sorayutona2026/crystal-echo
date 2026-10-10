// ===================== ART (procedural pixel art) =====================
const T = 16;
function px(x, c, X, Y, W = 1, H = 1) { x.fillStyle = c; x.fillRect(X, Y, W, H); }
function speckle(x, r, cols, n, w = 16, h = 16) { for (let i = 0; i < n; i++) px(x, pick2(r, cols), Math.floor(r() * w), Math.floor(r() * h)); }
function canopy(x, r, cx, cy, rad) {
  const blob = (bx, by, rr, col) => { for (let yy = -rr; yy <= rr; yy++) for (let xx = -rr; xx <= rr; xx++) if (xx * xx + yy * yy <= rr * rr + rr * 0.8) px(x, col, Math.round(bx + xx), Math.round(by + yy)); };
  blob(cx, cy, rad, '#1c4a22'); blob(cx - 0.5, cy - 0.5, rad - 1, '#2c7432');
  for (let i = 0; i < rad * 3; i++) { const a = r() * 6.28, d = r() * (rad - 1); px(x, r() < 0.5 ? '#24602a' : '#3a8c3a', Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d)); }
  blob(cx - Math.ceil(rad / 3), cy - Math.ceil(rad / 3), Math.max(1, Math.floor(rad / 2)), '#46a043');
  px(x, '#78c85e', cx - Math.ceil(rad / 2), cy - Math.ceil(rad / 2), 2, 1); px(x, '#78c85e', cx - Math.ceil(rad / 2), cy - Math.ceil(rad / 2) + 1, 1, 1);
}
function pick2(r, a) { return a[Math.floor(r() * a.length)]; }

// ---------- tiles ----------
const TILE_DRAW = {
  grass(x, r) {
    px(x, '#5a973c', 0, 0, 16, 16); speckle(x, r, ['#669f43', '#4e8934', '#6aa847', '#55913a'], 40);
    for (let i = 0; i < 4; i++) { const a = Math.floor(r() * 14) + 1, b = Math.floor(r() * 12) + 3; px(x, '#3f7a2e', a - 1, b + 1, 3, 1); px(x, '#7dbb52', a, b, 1, 1); px(x, '#8fcc5c', a, b - 1, 1, 1); px(x, '#6aac46', a + 1, b, 1, 1); }
    if (r() < 0.25) { const a = Math.floor(r() * 13) + 1, b = Math.floor(r() * 13) + 1; px(x, pick2(r, ['#fff3c4', '#ffd0e0', '#d8e8ff']), a, b); }
  },
  forest(x, r) {
    TILE_DRAW.grass(x, r);
    const t = (cx, cy, rad) => { px(x, '#2a180c', cx - 1, cy + rad - 1, 3, 3); px(x, '#5a3a1c', cx, cy + rad - 1, 1, 3); canopy(x, r, cx, cy, rad); };
    t(4, 5, 4); t(12, 4, 3); t(10, 11, 4);
  },
  hills(x, r) {
    TILE_DRAW.grass(x, r);
    const mound = (cx, cy, w, h) => { for (let yy = 0; yy < h; yy++) { const half = Math.round(w * Math.sqrt(1 - Math.pow((h - yy) / h, 2))); for (let i = -half; i <= half; i++) px(x, i < -half / 3 ? '#7cc05a' : i > half / 2 ? '#3f7a2e' : '#5aa242', cx + i, cy - h + yy + 1); } px(x, '#2f5e22', cx - w, cy + 1, w * 2 + 1, 1); px(x, '#a0d878', cx - Math.floor(w / 2), cy - h + 2, 2, 1); };
    mound(5, 10, 4, 5); mound(11, 14, 4, 5);
  },
  mountain(x, r) {
    TILE_DRAW.grass(x, r);
    for (let y = 0; y < 15; y++) { const w = Math.floor(y * 0.55) + 1; px(x, '#4a3a30', 8 - w - 1, y + 1, w * 2 + 2, 1); px(x, '#8a7056', 8 - w, y + 1, w, 1); px(x, '#6a5444', 8, y + 1, w, 1); }
    px(x, '#f2f2f6', 7, 1, 2, 2); px(x, '#f2f2f6', 6, 3, 2, 1); px(x, '#d8dae8', 8, 3, 2, 1);
  },
  water(x, r, f) {
    px(x, '#2b68b4', 0, 0, 16, 16); px(x, '#2a5ea6', 0, 8, 16, 8); speckle(x, r, ['#3172be', '#2558a0', '#3a7cc8'], 24);
    for (let i = 0; i < 3; i++) { const yy = (i * 6 + f * 3) % 16, xx = (i * 7 + f * 4) % 12; px(x, '#9cc8ff', xx, yy, 3, 1); px(x, '#5a96e0', xx - 1, yy + 1, 5, 1); }
  },
  sand(x, r) { px(x, '#e4cc8a', 0, 0, 16, 16); speckle(x, r, ['#d4b870', '#f0dca0'], 18); },
  path(x, r) { px(x, '#c9a36b', 0, 0, 16, 16); speckle(x, r, ['#b98f58', '#d8b47e', '#a8814c', '#e2c290'], 34); for (let i = 0; i < 3; i++) { const a = Math.floor(r() * 14), b = Math.floor(r() * 14); px(x, '#8a6a40', a, b + 1, 2, 1); px(x, '#efd3a0', a, b, 2, 1); } },
  bridge(x, r, f) { TILE_DRAW.water(x, r, f); px(x, '#6a4422', 0, 1, 16, 14); for (let i = 0; i < 16; i += 4) { px(x, '#a8743e', i, 2, 3, 12); px(x, '#c8945a', i, 2, 3, 1); } px(x, '#4a2c14', 0, 1, 16, 1); px(x, '#4a2c14', 0, 14, 16, 1); },
  bridgeV(x, r, f) { TILE_DRAW.water(x, r, f); px(x, '#6a4422', 1, 0, 14, 16); for (let i = 0; i < 16; i += 4) { px(x, '#a8743e', 2, i, 12, 3); px(x, '#c8945a', 2, i, 12, 1); } px(x, '#4a2c14', 1, 0, 1, 16); px(x, '#4a2c14', 14, 0, 1, 16); },
  townIcon(x, r) {
    TILE_DRAW.grass(x, r);
    const h = (a, b, roof) => { px(x, '#2a1a10', a - 1, b - 1, 8, 8); px(x, roof, a, b, 6, 3); px(x, '#f0e2c0', a, b + 3, 6, 3); px(x, '#5a3418', a + 2, b + 4, 2, 2); };
    h(1, 3, '#c83a2a'); h(9, 2, '#c83a2a'); h(5, 9, '#d85a2a');
  },
  townIcon2(x, r) {
    TILE_DRAW.sand(x, r);
    const h = (a, b, roof) => { px(x, '#1a1a2a', a - 1, b - 1, 8, 8); px(x, roof, a, b, 6, 3); px(x, '#f4f4f4', a, b + 3, 6, 3); px(x, '#3a5a9a', a + 2, b + 4, 2, 2); };
    h(1, 2, '#2a6ad0'); h(9, 4, '#2a6ad0'); h(4, 9, '#3a8ae0'); px(x, '#c8a040', 13, 10, 1, 5); px(x, '#f0f0f0', 11, 10, 2, 3);
  },
  caveIcon(x, r) { TILE_DRAW.mountain(x, r); px(x, '#140c1c', 5, 9, 6, 7); px(x, '#140c1c', 6, 8, 4, 1); px(x, '#2a1a2a', 6, 10, 4, 6); },
  towerIcon(x, r) {
    TILE_DRAW.grass(x, r);
    px(x, '#1a1a2a', 4, 0, 8, 16); px(x, '#8a8aa8', 5, 1, 6, 15); px(x, '#b0b0c8', 5, 1, 2, 15); px(x, '#5a5a78', 10, 1, 1, 15);
    px(x, '#7fe0ff', 7, 3, 2, 2); px(x, '#3a2a5a', 7, 11, 2, 5); for (let y = 2; y < 16; y += 4) px(x, '#6a6a88', 5, y, 6, 1);
  },
  // ---- 2.5D walls: 'Face' = front face shown when floor is below, 'Top' = top surface ----
  rockFace(x, r) {
    px(x, '#4c3c46', 0, 0, 16, 16);
    for (let i = 0; i < 16; i += 3) { const h = 4 + Math.floor(r() * 10); px(x, '#3a2c36', i + Math.floor(r() * 2), 2 + Math.floor(r() * 4), 1, h); px(x, '#5e4c58', i + 1, 1 + Math.floor(r() * 3), 1, h - 2); }
    speckle(x, r, ['#584652', '#3e3040'], 14); px(x, '#7a6876', 0, 0, 16, 1); px(x, '#5e4c58', 0, 1, 16, 1);
    px(x, '#2a1e2a', 0, 13, 16, 1); px(x, '#1c141e', 0, 14, 16, 2);
  },
  rockTop(x, r) { px(x, '#251c2a', 0, 0, 16, 16); speckle(x, r, ['#2e2434', '#1c1622', '#33293a'], 34); },
  tWallFace(x, r) {
    px(x, '#34345a', 0, 0, 16, 16);
    for (let row = 0; row < 3; row++) { const y = 1 + row * 4, off = row % 2 ? 4 : 0; for (let i = -off; i < 16; i += 8) { px(x, '#5c5c86', i + 1, y, 7, 3); px(x, '#7878a4', i + 1, y, 7, 1); px(x, '#4a4a72', i + 1, y + 2, 7, 1); } }
    px(x, '#9090bc', 0, 0, 16, 1); px(x, '#22223a', 0, 13, 16, 3); px(x, '#3a3a5e', 0, 13, 16, 1);
  },
  tWallTop(x, r) { px(x, '#2a2848', 0, 0, 16, 16); px(x, '#34325a', 0, 7, 16, 1); px(x, '#34325a', 7, 0, 1, 16); speckle(x, r, ['#302e52', '#24223e'], 12); },
  inWallFace(x, r) {
    px(x, '#7a5438', 0, 0, 16, 9); for (let i = 0; i < 16; i += 4) { px(x, '#5a3a24', i, 0, 1, 9); px(x, '#946a48', i + 1, 0, 1, 9); }
    px(x, '#5a3a26', 0, 9, 16, 5); px(x, '#a07850', 0, 9, 16, 1); for (let i = 2; i < 16; i += 6) px(x, '#4a2e1c', i, 10, 3, 3);
    px(x, '#2e1e14', 0, 14, 16, 2); px(x, '#b08a60', 0, 0, 16, 1);
  },
  inWallTop(x, r) { px(x, '#2e1e16', 0, 0, 16, 16); for (let y = 2; y < 16; y += 5) px(x, '#3a281e', 0, y, 16, 1); speckle(x, r, ['#382418'], 8); },
  fringeN(x, r) { for (let i = 0; i < 16; i++) { const h = 1 + Math.floor(r() * 3); px(x, '#4e8934', i, 0, 1, h); if (r() < 0.4) px(x, '#7dbb52', i, h - 1, 1, 1); } },
  // town
  tree(x, r) {
    TILE_DRAW.grass(x, r);
    px(x, '#2a180c', 5, 15, 6, 1); px(x, '#3a2414', 6, 10, 4, 5); px(x, '#6a4424', 7, 10, 1, 5); px(x, '#4e321a', 8, 10, 1, 5);
    canopy(x, r, 8, 6, 6);
  },
  fence(x, r) { TILE_DRAW.grass(x, r); px(x, '#5a3418', 0, 5, 16, 2); px(x, '#5a3418', 0, 10, 16, 2); px(x, '#8a5a2a', 0, 5, 16, 1); px(x, '#8a5a2a', 0, 10, 16, 1); for (const a of [1, 9]) { px(x, '#3a2010', a, 3, 3, 12); px(x, '#a87038', a, 3, 2, 11); } },
  roof(x, r, f, col = ['#b8402e', '#7e2416', '#dc6a50', '#9a3020']) {
    px(x, col[0], 0, 0, 16, 16);
    for (let row = 0; row < 4; row++) {
      const y = row * 4, off = row % 2 ? 2 : 0;
      for (let i = -off; i < 16; i += 4) { px(x, col[3], i, y + 2, 4, 2); px(x, col[2], i + 1, y, 2, 1); px(x, col[1], i + 3, y, 1, 4); }
      px(x, col[1], 0, y + 3, 16, 1);
    }
    speckle(x, r, [col[3], col[0]], 10);
  },
  roofB(x, r, f) { TILE_DRAW.roof(x, r, f, ['#2f6ac8', '#183a80', '#5a96ee', '#2454a8']); },
  wall(x, r) { px(x, '#efe0bc', 0, 0, 16, 16); px(x, '#6a4422', 0, 0, 16, 2); px(x, '#6a4422', 0, 14, 16, 2); px(x, '#6a4422', 0, 0, 2, 16); px(x, '#6a4422', 14, 0, 2, 16); px(x, '#d8c8a0', 2, 12, 12, 2); },
  window(x, r) { TILE_DRAW.wall(x, r); px(x, '#3a2414', 4, 4, 8, 7); px(x, '#8ad0ff', 5, 5, 6, 5); px(x, '#c8ecff', 5, 5, 2, 2); px(x, '#3a2414', 7, 5, 1, 5); px(x, '#3a2414', 5, 7, 6, 1); },
  door(x, r) { TILE_DRAW.wall(x, r); px(x, '#2a1408', 3, 2, 10, 14); px(x, '#7a4a22', 4, 3, 8, 13); px(x, '#5a3418', 7, 3, 1, 13); px(x, '#f0c040', 9, 9, 1, 2); },
  flowers(x, r) { TILE_DRAW.grass(x, r); for (let i = 0; i < 6; i++) { const a = Math.floor(r() * 13) + 1, b = Math.floor(r() * 13) + 1; px(x, pick2(r, ['#ff6a8a', '#ffe060', '#ffffff', '#b06aff']), a, b, 2, 2); px(x, '#ffe8a0', a, b); } },
  well(x, r) { TILE_DRAW.path(x, r); px(x, '#3a3a48', 2, 4, 12, 11); px(x, '#9a9aa8', 3, 5, 10, 9); px(x, '#1a3a8a', 5, 7, 6, 4); px(x, '#5a3418', 2, 1, 2, 5); px(x, '#5a3418', 12, 1, 2, 5); px(x, '#8a5a2a', 1, 0, 14, 2); },
  sign(x, r) { TILE_DRAW.grass(x, r); px(x, '#3a2010', 7, 8, 2, 8); px(x, '#3a2010', 2, 2, 12, 8); px(x, '#c8945a', 3, 3, 10, 6); px(x, '#6a4422', 4, 5, 8, 1); px(x, '#6a4422', 4, 7, 6, 1); },
  paving(x, r) { px(x, '#b8b0a0', 0, 0, 16, 16); px(x, '#8a8478', 0, 7, 16, 1); px(x, '#8a8478', 0, 15, 16, 1); px(x, '#8a8478', 5, 0, 1, 7); px(x, '#8a8478', 12, 8, 1, 7); speckle(x, r, ['#c8c0b0', '#a8a090'], 12); },
  barrel(x, r, f, base = 'grass') { TILE_DRAW[base](x, r); px(x, '#2a1408', 3, 2, 10, 13); px(x, '#a8743e', 4, 3, 8, 11); px(x, '#5a5a68', 4, 5, 8, 1); px(x, '#5a5a68', 4, 11, 8, 1); px(x, '#c8945a', 5, 3, 2, 11); },
  lamp(x, r) { TILE_DRAW.grass(x, r); px(x, '#2a2a38', 7, 4, 2, 12); px(x, '#2a2a38', 5, 0, 6, 5); px(x, '#ffe080', 6, 1, 4, 3); px(x, '#3a3a48', 5, 14, 6, 2); },
  barrelIn(x, r, f) { TILE_DRAW.barrel(x, r, f, 'floor'); },
  // interior
  inWall(x, r) { px(x, '#6a4a32', 0, 0, 16, 16); for (let i = 0; i < 16; i += 4) { px(x, '#4a3020', i, 0, 1, 16); px(x, '#8a6448', i + 1, 0, 1, 16); } px(x, '#3a2418', 0, 13, 16, 3); },
  floor(x, r) { px(x, '#b07c48', 0, 0, 16, 16); for (let y = 0; y < 16; y += 4) { px(x, '#8a5a30', 0, y + 3, 16, 1); px(x, '#8a5a30', (y * 3) % 16, y, 1, 3); } speckle(x, r, ['#c08a54', '#9a6a3a'], 8); },
  counter(x, r) { TILE_DRAW.floor(x, r); px(x, '#3a2010', 0, 2, 16, 13); px(x, '#c8945a', 0, 3, 16, 4); px(x, '#8a5a2a', 0, 7, 16, 7); px(x, '#e0b070', 0, 3, 16, 1); },
  bed(x, r) { TILE_DRAW.floor(x, r); px(x, '#3a2010', 1, 0, 14, 16); px(x, '#f0f0f0', 2, 1, 12, 4); px(x, '#3a6ad0', 2, 5, 12, 10); px(x, '#5a8ae8', 2, 5, 12, 2); },
  shelf(x, r) { px(x, '#3a2010', 0, 0, 16, 16); px(x, '#7a4a22', 1, 1, 14, 14); for (const y of [2, 7, 12]) { for (let i = 2; i < 14; i += 2) px(x, pick2(r, ['#c03030', '#3060c0', '#30a050', '#d0a030', '#8a3ab0']), i, y, 2, 4); px(x, '#3a2010', 1, y + 4, 14, 1); } },
  table(x, r) { TILE_DRAW.floor(x, r); px(x, '#3a2010', 1, 3, 14, 10); px(x, '#c8945a', 2, 4, 12, 6); px(x, '#3a2010', 3, 13, 2, 3); px(x, '#3a2010', 11, 13, 2, 3); px(x, '#f0f0f0', 6, 5, 4, 3); },
  rug(x, r) { px(x, '#8a2a3a', 0, 0, 16, 16); px(x, '#c8a040', 1, 1, 14, 14); px(x, '#a83a4a', 2, 2, 12, 12); px(x, '#c8a040', 6, 6, 4, 4); },
  plant(x, r) { TILE_DRAW.floor(x, r); px(x, '#6a3a1a', 5, 10, 6, 5); px(x, '#2a7a33', 3, 2, 10, 8); px(x, '#46a043', 5, 1, 4, 6); },
  fire(x, r, f) { TILE_DRAW.inWall(x, r); px(x, '#3a3a48', 1, 4, 14, 12); px(x, '#140c1c', 3, 7, 10, 9); px(x, f ? '#ff9a2a' : '#ffb84a', 5, 10 - f, 6, 6); px(x, '#ffe060', 7, 12, 2, 4); },
  exitMat(x, r) { TILE_DRAW.floor(x, r); px(x, '#3a6a3a', 2, 4, 12, 9); px(x, '#5a9a5a', 3, 5, 10, 7); },
  // cave
  rock(x, r) { px(x, '#3a2e3a', 0, 0, 16, 16); speckle(x, r, ['#4a3c4a', '#2a2030', '#5a4a58'], 30); px(x, '#5a4a58', 0, 0, 16, 1); px(x, '#1e1622', 0, 15, 16, 1); },
  caveFloor(x, r) { px(x, '#5c4c48', 0, 0, 16, 16); speckle(x, r, ['#6c5a54', '#4c3e3a', '#74625a'], 26); },
  boulder(x, r) { TILE_DRAW.caveFloor(x, r); px(x, '#1e1622', 2, 3, 12, 12); px(x, '#7a6a68', 3, 4, 10, 10); px(x, '#9a8a86', 4, 5, 4, 3); },
  chest(x, r, f, base = 'caveFloor') { TILE_DRAW[base](x, r); px(x, '#2a1408', 2, 4, 12, 11); px(x, '#a8642a', 3, 5, 10, 9); px(x, '#d08a3a', 3, 5, 10, 3); px(x, '#f0c040', 3, 8, 10, 1); px(x, '#f0c040', 7, 8, 2, 3); px(x, '#2a1408', 3, 8, 10, 0); },
  chestOpen(x, r, f, base = 'caveFloor') { TILE_DRAW[base](x, r); px(x, '#2a1408', 2, 2, 12, 13); px(x, '#a8642a', 3, 3, 10, 3); px(x, '#140808', 3, 7, 10, 2); px(x, '#a8642a', 3, 9, 10, 5); px(x, '#f0c040', 3, 9, 10, 1); },
  stairsDown(x, r) { px(x, '#140c1c', 0, 0, 16, 16); for (let i = 0; i < 4; i++) px(x, ['#6a5a58', '#4a3e3c', '#2e2628', '#1e1618'][i], 1, 2 + i * 3, 14, 2); },
  stairsUp(x, r) { px(x, '#2a2a3a', 0, 0, 16, 16); for (let i = 0; i < 4; i++) px(x, ['#3a3a50', '#5a5a74', '#7a7a98', '#a0a0c0'][i], 1, 2 + i * 3, 14, 3); },
  caveExit(x, r) { TILE_DRAW.caveFloor(x, r); for (let i = 0; i < 8; i++) px(x, `rgba(255,240,200,${0.07 * (8 - i)})`, 0, i * 2, 16, 2); },
  // tower
  tWall(x, r) { px(x, '#4a4a6a', 0, 0, 16, 16); for (let y = 0; y < 16; y += 4) { px(x, '#2e2e48', 0, y + 3, 16, 1); px(x, '#2e2e48', (y / 4) % 2 ? 4 : 12, y, 1, 3); px(x, '#6a6a8a', 0, y, 16, 1); } },
  tFloor(x, r) {
    px(x, '#504e78', 0, 0, 16, 16);
    for (const [a, b] of [[0, 0], [8, 0], [0, 8], [8, 8]]) { const t = r(); px(x, t < 0.3 ? '#4a4870' : t < 0.6 ? '#56547e' : '#525080', a + 1, b + 1, 7, 7); px(x, '#66649a', a + 1, b + 1, 7, 1); px(x, '#66649a', a + 1, b + 1, 1, 7); px(x, '#3e3c62', a + 1, b + 7, 7, 1); px(x, '#3e3c62', a + 7, b + 1, 1, 7); }
    px(x, '#302e50', 0, 0, 16, 1); px(x, '#302e50', 0, 0, 1, 16); px(x, '#302e50', 8, 0, 1, 16); px(x, '#302e50', 0, 8, 16, 1);
    speckle(x, r, ['#5e5c88', '#46446c'], 10);
  },
  carpet(x, r) { px(x, '#4e1028', 0, 0, 16, 16); px(x, '#c8a040', 1, 0, 1, 16); px(x, '#c8a040', 14, 0, 1, 16); px(x, '#7a2040', 3, 0, 10, 16); for (let y = 2; y < 16; y += 8) { px(x, '#a8384e', 7, y, 2, 2); px(x, '#a8384e', 6, y + 1, 4, 1); } px(x, '#5e1a32', 3, 0, 1, 16); px(x, '#5e1a32', 12, 0, 1, 16); },
  pillar(x, r) { TILE_DRAW.tFloor(x, r); px(x, '#1a1a2a', 3, 0, 10, 16); px(x, '#a8a8c4', 4, 0, 8, 16); px(x, '#cacae0', 5, 0, 2, 16); px(x, '#74749a', 10, 0, 2, 16); px(x, '#8a8aac', 3, 0, 10, 2); px(x, '#5e5e80', 3, 14, 10, 2); },
  abyss(x, r) { px(x, '#06061a', 0, 0, 16, 16); speckle(x, r, ['#1a1a4a', '#2a2a6a'], 4); },
  crystal(x, r, f) {
    TILE_DRAW.carpet(x, r);
    const g = ['#7fe0ff', '#bff0ff', '#4aa0e0'];
    px(x, '#0a2a4a', 4, 0, 8, 16); px(x, g[f % 2 ? 1 : 0], 5, 1, 6, 14); px(x, g[2], 8, 1, 3, 14); px(x, '#ffffff', 6, 2, 1, 6);
  },
  towerExit(x, r) { TILE_DRAW.tFloor(x, r); for (let i = 0; i < 8; i++) px(x, `rgba(255,250,220,${0.08 * (i + 1)})`, 0, i * 2, 16, 2); },
  savept(x, r, f) { TILE_DRAW.tFloor(x, r); px(x, f ? '#7fe0ff' : '#bff0ff', 4, 4, 8, 8); px(x, '#ffffff', 6, 6, 4, 4); },
};

// tileset definitions: char -> [drawKey, solid, encounterMult]
const TILESETS = {
  world: { '.': ['grass', 0, 1], 'T': ['forest', 0, 1.6], 'h': ['hills', 0, 1.3], 'M': ['mountain', 1], '~': ['water', 1], '=': ['bridge', 0, 0], 'I': ['bridgeV', 0, 0], 's': ['sand', 0, 0.8],
    'V': ['townIcon', 0, 0], 'R': ['townIcon2', 0, 0], 'C': ['caveIcon', 0, 0], 'c': ['caveIcon', 0, 0], 'X': ['towerIcon', 0, 0], 'W': ['shrineIcon', 0, 0] },
  town: { 'g': ['grass', 0], 'p': ['path', 0], 'T': ['tree', 1], 'F': ['fence', 1], 'R': ['roof', 1], 'r': ['roofB', 1], 'W': ['wall', 1], 'N': ['window', 1], 'D': ['door', 0], '~': ['water', 1],
    'f': ['flowers', 0], 'w': ['well', 1], 'b': ['bridgeV', 0], 'S': ['sign', 1], 'P': ['paving', 0], 'x': ['barrel', 1], 'L': ['lamp', 1], 's': ['sand', 0] },
  inside: { '#': ['inWall', 1], '.': ['floor', 0], 'c': ['counter', 1], 'B': ['bed', 1], 'k': ['shelf', 1], 't': ['table', 1], 'r': ['rug', 0], 'p': ['plant', 1], 'f': ['fire', 1], 'e': ['exitMat', 0], 'x': ['barrelIn', 1] },
  cave: { '#': ['rock', 1], '.': ['caveFloor', 0, 1], '~': ['water', 1], 'B': ['chest', 1], 'o': ['boulder', 1], '>': ['caveExit', 0, 0], 'I': ['bridgeV', 0, 0] },
  tower: { '#': ['tWall', 1], '.': ['tFloor', 0, 1], 'P': ['pillar', 1], 'B': ['chestT', 1], '^': ['stairsUp', 0, 0], 'v': ['stairsDown', 0, 0], 'c': ['carpet', 0, 0], '~': ['abyss', 1], 'X': ['crystal', 1], '*': ['savept', 0, 0], 'E': ['towerExit', 0, 0] },
};
const TILE_IMG = {}; // key -> [frame0, frame1]
const TILE_VAR = {}; // key -> [variants] for ground tiles (breaks up repetition)
const VARIED = ['grass', 'path', 'sand', 'caveFloor', 'tFloor', 'floor'];
function buildTiles() {
  for (const k of VARIED) TILE_VAR[k] = [0, 1, 2, 3].map(v => { const c = mkCanvas(16, 16); TILE_DRAW[k](c.getContext('2d'), mulberry(1000 + v * 77 + k.length), 0); return c; });
  let seed = 1;
  for (const k in TILE_DRAW) {
    const frames = [];
    for (let f = 0; f < 2; f++) {
      const c = mkCanvas(16, 16), x = c.getContext('2d'); const r = mulberry(seed);
      TILE_DRAW[k](x, r, f); frames.push(c);
    }
    seed++;
    TILE_IMG[k] = frames;
  }
  // grass fringes in 4 directions (drawn where paths meet grass)
  const base = TILE_IMG.fringeN[0]; TILE_IMG.fringe = {};
  for (const [d, rot] of [['N', 0], ['E', Math.PI / 2], ['S', Math.PI], ['W', -Math.PI / 2]]) { const c = mkCanvas(16, 16), x = c.getContext('2d'); x.translate(8, 8); x.rotate(rot); x.drawImage(base, -8, -8); TILE_IMG.fringe[d] = c; }
  // chest variants on tower floor
  for (const [k, fn] of [['chestT', 'chest'], ['chestOpenT', 'chestOpen']]) {
    const c = mkCanvas(16, 16); TILE_DRAW[fn](c.getContext('2d'), mulberry(9), 0, 'tFloor'); TILE_IMG[k] = [c, c];
  }
}
const ANIM_TILES = new Set(['water', 'bridge', 'bridgeV', 'fire', 'crystal', 'savept']);

// ---------- modern pixel-art finishing: colored outlines (selout) + directional shading ----------
function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; }
function hsl2rgb(h, s, l) { if (!s) return [l * 255, l * 255, l * 255]; const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]; }
// shift a color toward a hue (cool shadows / warm lights), the way modern pixel artists ramp colors
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
      // selout: tint outline with the neighbouring fill color
      let n = 0, R = 0, G2 = 0, B = 0;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (A(ii, jj) && !isOut(ii, jj)) { const q = (jj * w + ii) * 4; R += src[q]; G2 += src[q + 1]; B += src[q + 2]; n++; } }
      if (n && (opt.selout !== false)) { const [r2, g2, b2] = ramp(R / n, G2 / n, B / n, -0.36, 0.72, 0.35); const m = j > h * 0.55 ? 0.65 : 0.5; p[k] = r2 * (1 - m) + 20 * m; p[k + 1] = g2 * (1 - m) + 14 * m; p[k + 2] = b2 * (1 - m) + 30 * m; }
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

// ---------- character sprites (16x16 templates) ----------
// ---------- character sprites (16x16 templates) ----------
const BODY = {
  down: ['................', '.....OOOOOO.....', '....OHHHHHHO....', '...OHHHHHHHHO...', '...OHHHHHHHHO...', '...OHSSSSSSHO...', '...OSSESSESSO...', '...OSSESSESSO...', '....OOSSSSOO....', '...OCCCCCCCCO...', '..OSOCCAACCOSO..', '..OSOCCCCCCOSO..', '...OOAAAAAAOO...'],
  up: ['................', '.....OOOOOO.....', '....OHHHHHHO....', '...OHHHHHHHHO...', '...OHHHHHHHHO...', '...OHHHHHHHHO...', '...OHHHHHHHHO...', '...OSHHHHHHSO...', '....OOHHHHOO....', '...OCCCCCCCCO...', '..OSOCCCCCCOSO..', '..OSOCCCCCCOSO..', '...OOAAAAAAOO...'],
  left: ['................', '.....OOOOOO.....', '....OHHHHHHO....', '...OHHHHHHHHO...', '...OHHHHHHHHO...', '...OSSSHHHHHO...', '...OSESSHHHHO...', '..OSSSSSSHHO....', '...OOSSSSOO.....', '....OCCCCCCO....', '....OCSCCCCO....', '....OCSCCCCO....', '....OAAAAAAO....'],
};
const LEGS = {
  A: ['....OPPOOPPO....', '....OPPOOPPO....', '....OBBOOBBO....'],
  B: ['....OPPOOPPO....', '....OBBOOPPO....', '....OOO.OBBO....'],
  C: ['....OPPOOPPO....', '....OPPOOBBO....', '....OBBO.OOO....'],
  SA: ['.....OPPPPO.....', '.....OPPPPO.....', '.....OBBBBO.....'],
  SB: ['....OPPOOPPO....', '...OPPO..OPPO...', '...OBBO..OBBO...'],
};
const PALS = {
  allen: { H: '#2e2a3a', S: '#f0cba6', E: '#1a1a2a', C: '#3a2230', A: '#c8402e', P: '#22222e', B: '#2a1a1a' },
  lina: { H: '#e8e4f0', S: '#f6d8c0', E: '#3a2a4a', C: '#a8a4c4', A: '#e8a838', P: '#8a86a8', B: '#6a5a6a' },
  kai: { H: '#2e9a44', S: '#e8b888', E: '#1a1a2a', C: '#7a5230', A: '#d8b040', P: '#3a4a3a', B: '#4a2c14' },
  zek: { H: '#cfd6ee', S: '#f2d0b8', E: '#5a2a9a', C: '#6a2ea4', A: '#e8c440', P: '#4e1e78', B: '#2a1440' },
  elder: { H: '#ececec', S: '#e8c09a', E: '#1a1a2a', C: '#7a5a3a', A: '#c8a040', P: '#6a4a2a', B: '#3a2414', beard: '#ffffff' },
  woman: { H: '#c4502e', S: '#f6cfa2', E: '#1a1a2a', C: '#d87298', A: '#ffffff', P: '#a84a72', B: '#5a3418' },
  man: { H: '#3a2a1a', S: '#e8b888', E: '#1a1a2a', C: '#5a8e3a', A: '#8a5a2a', P: '#4a3a2a', B: '#3a2414' },
  child: { H: '#e8b840', S: '#f6cfa2', E: '#1a1a2a', C: '#e05a3a', A: '#ffffff', P: '#3a5ab0', B: '#5a3418' },
  soldier: { H: '#9aa2b4', S: '#f0c8a0', E: '#1a1a2a', C: '#7a8296', A: '#c83030', P: '#545c70', B: '#3a3a48' },
  merchant: { H: '#5a3a1a', S: '#e8b888', E: '#1a1a2a', C: '#d8a840', A: '#7a3a1a', P: '#6a4a2a', B: '#3a2414' },
  inn: { H: '#8a4a2a', S: '#f6cfa2', E: '#1a1a2a', C: '#f6f6f6', A: '#3a6ad0', P: '#3a3a58', B: '#3a2414' },
  mayor: { H: '#a0a0a0', S: '#e8c09a', E: '#1a1a2a', C: '#8e2a2a', A: '#e8c040', P: '#5a1a1a', B: '#2a1408', beard: '#d8d8d8' },
  sailor: { H: '#f6f6f6', S: '#d8a070', E: '#1a1a2a', C: '#2a4a9a', A: '#f6f6f6', P: '#f6f6f6', B: '#2a2a3a' },
  gking: { H: '#e8c030', S: '#5aa040', E: '#ff3030', C: '#8a3a1a', A: '#c83030', P: '#5a2a10', B: '#2a1408' },
  garva: { H: '#1e1e2e', S: '#3a3a4e', E: '#ff3040', C: '#2a2a3c', A: '#a02040', P: '#1e1e2e', B: '#101018' },
  mother: { H: '#9a5a2a', S: '#f6cfa6', E: '#1a1a2a', C: '#7a9a6a', A: '#f6f2ea', P: '#5a6a4a', B: '#5a3418' },
  leon: { H: '#6a3a1a', S: '#f0c49a', E: '#1a1a2a', C: '#9aa6bc', A: '#d8b040', P: '#3a3a58', B: '#3a2414' },
  bard: { H: '#7a2a9a', S: '#f2c8a0', E: '#1a1a2a', C: '#2e8a64', A: '#e8c040', P: '#4a3a2a', B: '#3a2414' },
  guardian: { H: '#7fe0ff', S: '#bff0ff', E: '#ff40a0', C: '#4aa0e0', A: '#ffffff', P: '#2a70b0', B: '#1a4a80' },
};
// hero heads (rows 0-8) with their own silhouettes: spiky hair, hood, bandana, long hair with circlet
const HERO_HEADS = {
  allen: {
    down: ['......O..O......', '...O.OHOOHO.O...', '...OHOHHHHOHO...', '..OHHHHHHHHHHO..', '...OHHHHHHHHO...', '...OHSHSSHSHO...', '...OSSESSESSO...', '...OSSESSESSO...', '....OOSSSSOO....'],
    up: ['......O..O......', '...O.OHOOHO.O...', '...OHOHHHHOHO...', '..OHHHHHHHHHHO..', '...OHHHHHHHHO...', '...OHHHHHHHHO...', '...OHHHHHHHHO...', '...OSHHHHHHSO...', '....OOHHHHOO....'],
    left: ['.....O.O.O......', '....OHOHOHO.O...', '...OHHHHHHHOHO..', '..OHHHHHHHHHHO..', '...OHHHHHHHHO...', '...OSSHHHHHHO...', '...OSESSHHHHO...', '..OSSESSSHHO....', '...OOSSSSOO.....'],
  },
  lina: {
    down: ['.....OOOOOO.....', '....OHHHHHHO....', '...OHHHHHHHHO...', '..OHHAAAAAAHHO..', '..OHABBBBBBAHO..', '..OHASSSSSSAHO..', '..OHSSESSESSHO..', '..OHSSESSESSHO..', '...OOOSSSSOOO...'],
    up: ['.....OOOOOO.....', '....OHHHHHHO....', '...OHHHHHHHHO...', '..OHHHHHHHHHHO..', '..OHHHHHHHHHHO..', '..OHHHHHHHHHHO..', '..OHHHHHHHHHHO..', '..OHHHHHHHHHHO..', '...OOOHHHHOOO...'],
    left: ['.....OOOOOO.....', '....OHHHHHHO....', '...OHHHHHHHHO...', '..OAAAHHHHHHHO..', '..OBBAHHHHHHHO..', '..OSSAHHHHHHHO..', '..OSESAHHHHHO...', '.OSSESAHHHHHO...', '..OOSSAOOOOO....'],
  },
  kai: {
    down: ['....OOOOOOO.....', '...OHHHHHHHO....', '..OHHHHHHHHHO...', '..OHHHHHHHHHHO..', '...OBBBBBBBBOHO.', '...OBSSSSSSBO.O.', '...OSSESSESSO...', '...OSSESSESSO...', '....OOSSSSOO....'],
    up: ['....OOOOOOO.....', '...OHHHHHHHO....', '..OHHHHHHHHHO...', '..OHHHHHHHHHHO..', '...OBBBBBBBBOHO.', '...OBBBBBBBBO.O.', '...OBBBBBBBBO...', '...OSBBBBBBSO...', '....OOBBBBOO....'],
    left: ['.....OOOOOOO....', '....OHHHHHHHO...', '...OHHHHHHHHHO..', '...OHHHHHHHHHHO.', '...OBBBBBBBOHHO.', '...OSSBBBBBO.HO.', '...OSESSBBBO..O.', '..OSSESSSBBO....', '...OOSSSSOO.....'],
  },
  zek: {
    down: ['.....OOOOOO.....', '....OHHHHHHO....', '...OHHHHHHHHO...', '...OAAAAAAAAO...', '..OHHHHHHHHHHO..', '..OHHSSSSSSHHO..', '..OHSSESSESSHO..', '..OHSSESSESSHO..', '..OHHOSSSSOHHO..'],
    up: ['.....OOOOOO.....', '....OHHHHHHO....', '...OHHHHHHHHO...', '...OAAAAAAAAO...', '..OHHHHHHHHHHO..', '..OHHHHHHHHHHO..', '..OHHHHHHHHHHO..', '..OHHHHHHHHHHO..', '..OHHHHHHHHHHO..'],
    left: ['.....OOOOOO.....', '....OHHHHHHO....', '...OHHHHHHHHO...', '...OAAAAHHHHHO..', '...OHHHHHHHHHO..', '...OSSSHHHHHHO..', '...OSESSHHHHHO..', '..OSSESSHHHHHO..', '...OOSSSOHHHO...'],
  },
};
// small identifying details layered on the 16x16 field sprites
const FEATURES = {
  allen: { down: [['#c8402e', 4, 4, 8, 1], ['#d8343e', 4, 9, 8, 1]], up: [['#c8402e', 4, 4, 8, 1], ['#c8402e', 4, 9, 8, 1]], left: [['#c8402e', 7, 4, 5, 1], ['#c8402e', 5, 9, 6, 1], ['#8a2418', 11, 9, 2, 1], ['#8a2418', 12, 10, 2, 1]] },
  zek: { down: [['#ff70c0', 7, 3, 2, 1], ['#cfd6ee', 3, 9, 1, 2], ['#cfd6ee', 12, 9, 1, 2]], up: [['#cfd6ee', 4, 9, 8, 2]], left: [['#ff70c0', 4, 3, 1, 1], ['#cfd6ee', 10, 9, 2, 2]] },
  lina: { down: [['#7a1a2e', 5, 9, 6, 1], ['#e8a838', 7, 3, 2, 1]], up: [['#7a1a2e', 4, 1, 8, 1]], left: [['#7a1a2e', 5, 9, 4, 1]] },
};
function renderChar(pal, body, legs, flip, name, dir) {
  const c = mkCanvas(16, 16), x = c.getContext('2d');
  const rows = body.concat(legs);
  for (let y = 0; y < 16; y++) for (let i = 0; i < 16; i++) {
    const ch = rows[y][i]; if (ch === '.') continue;
    let col = ch === 'O' ? '#1a1020' : pal[ch];
    if (ch === 'E' && hex(col).reduce((t, v) => t + v, 0) < 120) col = '#283058'; // keep eyes out of the outline pass so they stay dark blue
    if (pal.beard && (y === 7 || y === 8) && ch === 'S' && body !== BODY.up) col = pal.beard;
    if (pal.beard && y === 9 && ch === 'C' && i > 5 && i < 10 && body === BODY.down) col = pal.beard;
    px(x, col, flip ? 15 - i : i, y);
  }
  const F = FEATURES[name] && FEATURES[name][dir];
  if (F) for (const [col, a, b, w, h] of F) px(x, col, flip ? 16 - a - w : a, b, w, h);
  return stylize(c);
}
const SPR = {}; // name -> {down:[4], up:[4], left:[4], right:[4]}
function buildChars() {
  for (const n in PALS) {
    const p = PALS[n]; const s = {};
    const hh = HERO_HEADS[n], body = d => hh ? hh[d].concat(BODY[d].slice(9)) : BODY[d];
    s.down = ['A', 'B', 'A', 'C'].map(l => renderChar(p, body('down'), LEGS[l], false, n, 'down'));
    s.up = ['A', 'C', 'A', 'B'].map(l => renderChar(p, body('up'), LEGS[l], false, n, 'up'));
    s.left = ['SA', 'SB', 'SA', 'SB'].map(l => renderChar(p, body('left'), LEGS[l], false, n, 'left'));
    s.right = ['SA', 'SB', 'SA', 'SB'].map(l => renderChar(p, body('left'), LEGS[l], true, n, 'left'));
    SPR[n] = s;
  }
}

// ---------- enemy art ----------
function E(w, h, fn, outline) { const c = mkCanvas(w, h); const x = c.getContext('2d'); fn(x, w, h); return stylize(pixelize(c, outline), { grad: true }); }
function ell(x, cx, cy, rx, ry, col) { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); }
function poly(x, pts, col) { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.closePath(); x.fill(); }
function rect(x, a, b, w, h, col) { x.fillStyle = col; x.fillRect(a, b, w, h); }
function eyes(x, a, b, gap, col = '#fff', pupil = '#000', s = 2) { rect(x, a, b, s + 1, s + 1, col); rect(x, a + gap, b, s + 1, s + 1, col); rect(x, a + 1, b + 1, s - 1 || 1, s - 1 || 1, pupil); rect(x, a + gap + 1, b + 1, s - 1 || 1, s - 1 || 1, pupil); }

const ENEMY_ART = {
  slime: (main = '#46c06a', dark = '#2a8a48', lite = '#a8f0b8') => E(32, 28, x => {
    x.fillStyle = dark; x.beginPath(); x.moveTo(3, 26); x.quadraticCurveTo(2, 14, 16, 3); x.quadraticCurveTo(30, 14, 29, 26); x.closePath(); x.fill();
    x.fillStyle = main; x.beginPath(); x.moveTo(5, 25); x.quadraticCurveTo(5, 14, 16, 5); x.quadraticCurveTo(27, 14, 26, 25); x.closePath(); x.fill();
    ell(x, 11, 12, 3, 4, lite); eyes(x, 10, 15, 8, '#fff', '#111', 3); rect(x, 13, 21, 6, 1, dark);
  }),
  bat: () => E(40, 26, x => {
    poly(x, [20, 10, 2, 4, 5, 12, 1, 16, 8, 16, 10, 22, 16, 16], '#3a2450'); poly(x, [20, 10, 38, 4, 35, 12, 39, 16, 32, 16, 30, 22, 24, 16], '#3a2450');
    poly(x, [20, 11, 6, 7, 9, 13, 12, 18], '#5a3a78'); poly(x, [20, 11, 34, 7, 31, 13, 28, 18], '#5a3a78');
    ell(x, 20, 13, 6, 7, '#4a2e62'); poly(x, [15, 8, 16, 2, 18, 7], '#4a2e62'); poly(x, [25, 8, 24, 2, 22, 7], '#4a2e62');
    rect(x, 16, 11, 3, 2, '#ff3040'); rect(x, 21, 11, 3, 2, '#ff3040'); rect(x, 18, 16, 1, 3, '#fff'); rect(x, 21, 16, 1, 3, '#fff');
  }),
  goblin: (skin = '#6aa83a', cloth = '#8a5a2a', hat) => E(34, 40, x => {
    rect(x, 10, 26, 5, 12, '#4a3418'); rect(x, 19, 26, 5, 12, '#4a3418');
    ell(x, 17, 24, 9, 9, cloth); rect(x, 9, 25, 16, 3, '#5a3418');
    ell(x, 17, 13, 9, 8, skin); poly(x, [8, 12, 0, 6, 9, 16], skin); poly(x, [26, 12, 34, 6, 25, 16], skin);
    rect(x, 12, 11, 3, 3, '#ffe040'); rect(x, 20, 11, 3, 3, '#ffe040'); rect(x, 13, 12, 1, 2, '#000'); rect(x, 21, 12, 1, 2, '#000');
    rect(x, 13, 17, 8, 2, '#3a1a10'); rect(x, 14, 17, 1, 2, '#fff'); rect(x, 19, 17, 1, 2, '#fff');
    if (hat) { poly(x, [8, 8, 17, -2, 26, 8], hat); rect(x, 6, 7, 22, 3, hat); rect(x, 15, 1, 3, 2, '#ffe040'); }
    else { x.save(); x.translate(28, 22); x.rotate(0.5); rect(x, -2, -12, 4, 18, '#8a5a2a'); ell(x, 0, -12, 4, 4, '#6a4420'); x.restore(); }
    rect(x, 4, 22, 5, 4, skin); rect(x, 25, 22, 5, 4, skin);
  }),
  wolf: () => E(48, 34, x => {
    poly(x, [40, 14, 47, 6, 46, 16], '#6a6a7a');
    ell(x, 26, 18, 15, 8, '#7a7a8c'); ell(x, 26, 21, 12, 5, '#9a9aae');
    for (const a of [15, 20, 31, 36]) rect(x, a, 22, 4, 11, '#5a5a6a');
    ell(x, 11, 13, 8, 7, '#7a7a8c'); poly(x, [6, 10, 0, 16, 7, 18], '#7a7a8c'); poly(x, [8, 8, 9, 0, 13, 7], '#7a7a8c'); poly(x, [13, 8, 16, 1, 17, 9], '#7a7a8c');
    rect(x, 7, 11, 3, 2, '#ffe040'); rect(x, 1, 15, 2, 2, '#1a1a1a'); rect(x, 3, 17, 5, 1, '#fff');
  }),
  bee: () => E(36, 30, x => {
    ell(x, 14, 8, 8, 6, 'rgba(220,240,255,0.9)'); ell(x, 24, 7, 7, 5, 'rgba(200,225,255,0.9)');
    ell(x, 20, 18, 10, 8, '#f0c020'); rect(x, 15, 11, 3, 15, '#2a2018'); rect(x, 22, 11, 3, 15, '#2a2018');
    poly(x, [29, 18, 36, 20, 29, 22], '#2a2018'); ell(x, 8, 16, 6, 6, '#2a2018'); rect(x, 4, 14, 3, 3, '#ff3040');
    rect(x, 4, 9, 1, 4, '#2a2018'); rect(x, 7, 8, 1, 5, '#2a2018');
  }),
  skeleton: () => E(34, 46, x => {
    rect(x, 11, 32, 3, 13, '#e8e4d0'); rect(x, 20, 32, 3, 13, '#e8e4d0'); rect(x, 10, 30, 14, 3, '#d8d4c0');
    rect(x, 16, 15, 3, 16, '#e8e4d0'); for (let i = 0; i < 4; i++) rect(x, 10, 17 + i * 3, 15, 1, '#e8e4d0');
    rect(x, 7, 17, 3, 12, '#e8e4d0'); rect(x, 25, 17, 3, 10, '#e8e4d0');
    ell(x, 17, 8, 8, 8, '#f0ecd8'); rect(x, 12, 6, 4, 4, '#140c1c'); rect(x, 19, 6, 4, 4, '#140c1c'); rect(x, 13, 7, 1, 1, '#ff4040'); rect(x, 20, 7, 1, 1, '#ff4040');
    rect(x, 13, 13, 8, 3, '#d8d4c0'); for (let i = 0; i < 4; i++) rect(x, 13 + i * 2, 13, 1, 3, '#140c1c');
    x.save(); x.translate(29, 26); x.rotate(-0.3); rect(x, -1, -22, 3, 22, '#c0c8d8'); rect(x, -4, 0, 9, 2, '#8a6a2a'); rect(x, 0, 2, 1, 4, '#5a3a1a'); x.restore();
  }),
  golem: () => E(58, 62, x => {
    rect(x, 12, 44, 12, 17, '#7a6a5a'); rect(x, 34, 44, 12, 17, '#7a6a5a');
    rect(x, 10, 18, 38, 28, '#8a7a66'); rect(x, 12, 20, 16, 12, '#a0907a'); rect(x, 30, 32, 16, 12, '#6a5a4a');
    rect(x, 0, 20, 10, 26, '#7a6a5a'); rect(x, 48, 20, 10, 26, '#7a6a5a'); rect(x, 0, 42, 11, 8, '#6a5a4a'); rect(x, 47, 42, 11, 8, '#6a5a4a');
    rect(x, 19, 3, 20, 16, '#8a7a66'); rect(x, 23, 9, 4, 3, '#40ff90'); rect(x, 32, 9, 4, 3, '#40ff90');
    rect(x, 26, 24, 6, 6, '#40ff90'); rect(x, 27, 25, 4, 4, '#c0ffe0');
  }),
  specter: () => E(42, 50, x => {
    x.fillStyle = '#b8a8e8'; x.beginPath(); x.moveTo(6, 46); x.quadraticCurveTo(2, 8, 21, 3); x.quadraticCurveTo(40, 8, 36, 46);
    for (let i = 0; i < 5; i++) x.lineTo(36 - i * 7.5 - 3.75, i % 2 ? 49 : 40); x.closePath(); x.fill();
    ell(x, 21, 16, 10, 9, '#e8e0ff'); ell(x, 16, 16, 3, 4, '#140c1c'); ell(x, 26, 16, 3, 4, '#140c1c'); ell(x, 21, 25, 3, 4, '#140c1c');
    rect(x, 1, 22, 8, 4, '#b8a8e8'); rect(x, 33, 22, 8, 4, '#b8a8e8');
  }),
  darkmage: () => E(38, 48, x => {
    poly(x, [19, 2, 5, 46, 33, 46], '#3a1a4a'); poly(x, [19, 2, 10, 30, 28, 30], '#4e2266');
    ell(x, 19, 16, 7, 7, '#120818'); rect(x, 15, 15, 2, 2, '#ffe040'); rect(x, 21, 15, 2, 2, '#ffe040');
    rect(x, 5, 40, 28, 3, '#a02040');
    rect(x, 31, 8, 2, 38, '#6a4a2a'); ell(x, 32, 7, 4, 4, '#ff40a0'); ell(x, 31, 6, 1.5, 1.5, '#ffc0e0');
  }),
  armor: () => E(46, 58, x => {
    rect(x, 13, 38, 8, 19, '#5a6070'); rect(x, 25, 38, 8, 19, '#5a6070'); rect(x, 11, 52, 11, 5, '#3a4050'); rect(x, 24, 52, 11, 5, '#3a4050');
    rect(x, 10, 16, 26, 24, '#8a92a8'); rect(x, 13, 18, 9, 10, '#b0b8cc'); rect(x, 10, 34, 26, 4, '#a02040');
    ell(x, 9, 18, 7, 6, '#9aa2b8'); ell(x, 37, 18, 7, 6, '#9aa2b8'); rect(x, 3, 22, 7, 16, '#7a8296');
    rect(x, 15, 3, 16, 14, '#9aa2b8'); rect(x, 16, 8, 14, 2, '#140c1c'); rect(x, 19, 8, 2, 2, '#40c0ff'); rect(x, 25, 8, 2, 2, '#40c0ff'); poly(x, [23, 0, 20, 4, 26, 4], '#a02040');
    rect(x, 38, 4, 4, 46, '#d0d8e8'); rect(x, 34, 34, 12, 3, '#8a6a2a'); poly(x, [38, 4, 40, 0, 42, 4], '#d0d8e8');
  }),
  gking: () => E(74, 74, x => {
    poly(x, [10, 30, 0, 72, 30, 64], '#8a1a2a');
    rect(x, 22, 54, 11, 19, '#4a3418'); rect(x, 42, 54, 11, 19, '#4a3418');
    ell(x, 37, 46, 21, 16, '#7a4a1a'); rect(x, 16, 48, 42, 5, '#5a3418'); rect(x, 33, 48, 8, 5, '#e8c030');
    ell(x, 37, 25, 18, 15, '#5a9a34'); poly(x, [20, 22, 2, 10, 20, 32], '#5a9a34'); poly(x, [54, 22, 72, 10, 54, 32], '#5a9a34');
    poly(x, [22, 12, 24, 0, 30, 8, 37, -1, 44, 8, 50, 0, 52, 12], '#e8c030'); rect(x, 35, 4, 4, 4, '#ff3040');
    rect(x, 27, 21, 6, 5, '#ffe040'); rect(x, 41, 21, 6, 5, '#ffe040'); rect(x, 29, 22, 2, 3, '#000'); rect(x, 43, 22, 2, 3, '#000');
    rect(x, 28, 31, 18, 4, '#3a1a10'); rect(x, 30, 31, 2, 5, '#fff'); rect(x, 42, 31, 2, 5, '#fff');
    x.save(); x.translate(64, 42); x.rotate(0.35); rect(x, -3, -30, 6, 36, '#8a5a2a'); ell(x, 0, -30, 8, 8, '#6a4420'); rect(x, -6, -36, 3, 3, '#ccc'); rect(x, 4, -28, 3, 3, '#ccc'); x.restore();
    rect(x, 10, 40, 10, 9, '#5a9a34');
  }),
  guardian: () => E(82, 82, x => {
    rect(x, 22, 58, 14, 23, '#2a70b0'); rect(x, 46, 58, 14, 23, '#2a70b0');
    poly(x, [41, 14, 66, 30, 60, 62, 22, 62, 16, 30], '#4aa0e0'); poly(x, [41, 14, 41, 62, 22, 62, 16, 30], '#7fd0ff'); poly(x, [41, 24, 50, 40, 41, 52, 32, 40], '#e8fbff');
    poly(x, [16, 30, 2, 36, 4, 64, 14, 58], '#3a8ac8'); poly(x, [66, 30, 80, 36, 78, 64, 68, 58], '#3a8ac8');
    poly(x, [41, 0, 54, 10, 41, 20, 28, 10], '#9ae4ff'); rect(x, 34, 8, 4, 3, '#ff40a0'); rect(x, 44, 8, 4, 3, '#ff40a0');
  }, '#0a1a3a'),
  garva: () => E(84, 98, x => {
    poly(x, [20, 26, 2, 96, 72, 96, 62, 26], '#3a1040'); poly(x, [24, 30, 14, 92, 40, 80], '#5a1a5a');
    rect(x, 28, 66, 12, 30, '#22222e'); rect(x, 46, 66, 12, 30, '#22222e'); rect(x, 26, 90, 15, 7, '#121218'); rect(x, 45, 90, 15, 7, '#121218');
    rect(x, 24, 30, 38, 38, '#2e2e3e'); rect(x, 28, 34, 14, 14, '#4a4a60'); poly(x, [24, 60, 62, 60, 56, 70, 30, 70], '#a02040');
    ell(x, 22, 32, 10, 8, '#3a3a50'); ell(x, 64, 32, 10, 8, '#3a3a50'); poly(x, [14, 28, 8, 18, 22, 26], '#3a3a50'); poly(x, [72, 28, 78, 18, 64, 26], '#3a3a50');
    rect(x, 33, 8, 20, 22, '#2e2e3e'); poly(x, [33, 10, 26, 0, 38, 8], '#3a3a50'); poly(x, [53, 10, 60, 0, 48, 8], '#3a3a50');
    rect(x, 35, 17, 16, 3, '#0a0a10'); rect(x, 37, 17, 4, 3, '#ff3040'); rect(x, 45, 17, 4, 3, '#ff3040');
    x.save(); x.translate(12, 60); x.rotate(-0.25); rect(x, -3, -56, 7, 58, '#b8c0d8'); rect(x, 0, -56, 2, 58, '#e8ecff'); rect(x, -9, 2, 19, 4, '#a02040'); rect(x, -2, 6, 5, 9, '#3a2a1a'); poly(x, [-3, -56, 0.5, -64, 4, -56], '#b8c0d8'); x.restore();
    rect(x, 10, 34, 10, 22, '#2e2e3e');
  }),
};
const ENEMY_IMG = {};
function buildEnemies() {
  ENEMY_IMG.slime = ENEMY_ART.slime();
  ENEMY_IMG.redslime = ENEMY_ART.slime('#e04848', '#9a2a2a', '#ffb0a0');
  ENEMY_IMG.bat = ENEMY_ART.bat();
  ENEMY_IMG.goblin = ENEMY_ART.goblin();
  ENEMY_IMG.gmage = ENEMY_ART.goblin('#5a9a6a', '#4a2a7a', '#3a1a6a');
  ENEMY_IMG.wolf = ENEMY_ART.wolf();
  ENEMY_IMG.bee = ENEMY_ART.bee();
  ENEMY_IMG.skeleton = ENEMY_ART.skeleton();
  ENEMY_IMG.golem = ENEMY_ART.golem();
  ENEMY_IMG.specter = ENEMY_ART.specter();
  ENEMY_IMG.darkmage = ENEMY_ART.darkmage();
  ENEMY_IMG.armor = ENEMY_ART.armor();
  ENEMY_IMG.gking = ENEMY_ART.gking();
  ENEMY_IMG.guardian = ENEMY_ART.guardian();
  ENEMY_IMG.garva = ENEMY_ART.garva();
  for (const k in ENEMY_IMG) ENEMY_IMG[k + ':flash'] = silhouette(ENEMY_IMG[k]);
}

// ---------- optional external sprite overrides (e.g. renders of Meshy 3D models) ----------
// Define window.SPRITE_OVERRIDES before this script, mapping keys to image URLs (PNG files published next to the page or data: URIs):
//   window.SPRITE_OVERRIDES = { "enemy:garva": "assets/garva.png", "battle:allen": "assets/allen.png" };
// Without it, the built-in pixel art is used.
function loadOverrides() {
  const m = window.SPRITE_OVERRIDES; if (!m) return;
  for (const key in m) {
    const img = new Image(); img.onload = () => {
      const [kind, name] = key.split(':');
      if (kind === 'enemy') { ENEMY_IMG[name] = img; ENEMY_IMG[name + ':flash'] = silhouette(img); if (typeof ENEMY_ANIM !== 'undefined') delete ENEMY_ANIM[name]; }
      if (kind === 'battle' && SPR[name] && SPR[name].hb) { const fl = silhouette(img); for (const p in SPR[name].hb) if (p !== 'flash' && p !== 'ko') { SPR[name].hb[p] = img; SPR[name].hb.flash[p] = fl; } }
    }; img.src = m[key];
  }
}

