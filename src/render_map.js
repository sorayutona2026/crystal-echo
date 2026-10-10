// ===================== MAP RENDERER (cached static layers + decoration) =====================
// Static ground and tall objects are painted once per map into two big canvases.
// Per frame we only draw animated tiles (water, chests, save points, fire, crystals) and characters.
const DYN_GROUND = new Set(['water', 'bridge', 'bridgeV', 'savept', 'chestT', 'chest', 'chestOpen', 'chestOpenT']);
const DYN_TALL = new Set(['fire', 'crystal']);
const TALL_SPR = {};
const WATERY = new Set(['water', 'bridge', 'bridgeV']);

// ---------- tall terrain sprites ----------
function sprCanvas(w, h, fn, outline) { const c = mkCanvas(w, h); const x = c.getContext('2d'); fn(x, mulberry(w * 31 + h * 7 + (fn.seed || 0))); return stylize(pixelize(c, outline), { grad: true }); }
function mountainSprite(v) {
  const f = (x, r) => {
    const W = 26, apexX = 13 + [0, -2, 2][v % 3], apexY = [2, 0, 5][v % 3];
    for (let y = apexY; y < 24; y++) {
      const k = (y - apexY) / (24 - apexY); const half = Math.round(k * 12.5 + Math.sin(y * 0.8 + v) * 0.7);
      const l = clamp(apexX - half, 0, W - 1), rr = clamp(apexX + half, 0, W - 1);
      for (let i = l; i <= rr; i++) {
        const lit = i < apexX - (y - apexY) * 0.12;
        let col = lit ? '#a48c6c' : '#6c5846';
        const sn = y - apexY;
        if (sn < 5 + (v === 1 ? 2 : 0) - Math.abs(i - apexX) * 0.25) col = lit ? '#f6f6fc' : '#c4c8dc';
        else if (sn < 8 && r() < 0.35) col = lit ? '#e2e4ee' : '#a8acc0';
        if (y > 18) col = lit ? '#8e7c5c' : '#5e5040';
        px(x, col, i, y);
      }
    }
    for (let i = 0; i < 30; i++) { const yy = apexY + 6 + Math.floor(r() * (17 - apexY)), xx = Math.floor(r() * W); px(x, r() < 0.5 ? '#5a4a3a' : '#b49c7a', xx, yy); }
    for (let y = apexY + 2; y < 20; y++) px(x, '#55463a', apexX + Math.round((y - apexY) * 0.2), y);
    for (let y = apexY + 6; y < 18; y += 3) px(x, '#7e6a54', apexX - Math.round((y - apexY) * 0.45), y, 2, 1);
    for (let i = 0; i < W; i += 2) if (r() < 0.7) { px(x, '#4e8934', i, 22 + Math.floor(r() * 2), 2, 2); px(x, '#6aac46', i, 22, 1, 1); }
  };
  f.seed = v;
  return sprCanvas(26, 24, f, '#2e241c');
}
function caveSprite() {
  const m = mountainSprite(0); const x = m.getContext('2d');
  px(x, '#1a1218', 9, 13, 8, 11); px(x, '#1a1218', 10, 12, 6, 1); px(x, '#0a060c', 10, 15, 6, 9); px(x, '#3a2a2a', 9, 13, 1, 11); px(x, '#6a5848', 8, 12, 1, 12); px(x, '#6a5848', 17, 12, 1, 12);
  return m;
}
function towerSprite() {
  const f = (x, r) => {
    px(x, '#6a6a8a', 4, 10, 8, 20); px(x, '#9a9abc', 4, 10, 3, 20); px(x, '#4a4a68', 10, 10, 2, 20);
    for (let y = 12; y < 30; y += 4) px(x, '#5a5a7a', 4, y, 8, 1);
    px(x, '#7a7a9a', 3, 9, 10, 2); px(x, '#7a7a9a', 2, 18, 12, 2); px(x, '#3a2a5a', 7, 24, 2, 6);
    px(x, '#1a1a2a', 6, 14, 1, 2); px(x, '#1a1a2a', 9, 20, 1, 2);
    px(x, '#5a5a7a', 6, 5, 4, 4); px(x, '#8ae8ff', 7, 1, 2, 5); px(x, '#e8fbff', 7, 2, 1, 2);
  };
  return sprCanvas(16, 30, f, '#1a1a2a');
}
function shrineSprite() {
  const f = (x, r) => {
    px(x, '#8a8e8a', 1, 18, 18, 3); px(x, '#a8aca6', 1, 18, 18, 1); px(x, '#6a6e6a', 3, 16, 14, 2);
    for (const cx of [4, 14]) { px(x, '#b8bcb4', cx, 7, 3, 9); px(x, '#d8dcd4', cx, 7, 1, 9); px(x, '#7a7e78', cx + 2, 7, 1, 9); }
    px(x, '#2e6a4a', 2, 5, 16, 2); px(x, '#3e8a5a', 4, 3, 12, 2); px(x, '#56a870', 7, 1, 6, 2); px(x, '#1e4a34', 2, 6, 16, 1);
    px(x, '#1a2a2a', 7, 9, 6, 7); px(x, '#8affd8', 9, 10, 2, 3); px(x, '#e8fff8', 9, 10, 1, 1);
    px(x, '#4e8934', 0, 20, 3, 1); px(x, '#6aac46', 17, 20, 2, 1); px(x, '#4e8934', 6, 15, 1, 1);
  };
  return sprCanvas(20, 22, f, '#1a2420');
}
function treeSprite(v) {
  const f = (x, r) => {
    px(x, '#3a2414', 6, 15, 4, 7); px(x, '#6a4424', 7, 15, 1, 7); px(x, '#4e321a', 8, 15, 1, 6); px(x, '#3a2414', 5, 21, 6, 1);
    canopy(x, r, 8, 8, 7 - (v % 2));
    if (v === 1) { canopy(x, r, 5, 11, 3); canopy(x, r, 11, 11, 3); }
  };
  f.seed = v;
  return sprCanvas(16, 22, f, '#123018');
}
function forestSprite(v) {
  const f = (x, r) => {
    const spots = [[[4, 7, 4], [12, 6, 4], [8, 13, 5]], [[5, 6, 5], [12, 10, 4], [4, 14, 4]], [[8, 6, 5], [3, 12, 4], [13, 13, 4]]][v % 3];
    for (const [cx, cy, rad] of spots) { px(x, '#3a2414', cx - 1, cy + rad - 1, 2, 3); canopy(x, r, cx, cy, rad); }
  };
  f.seed = v + 10;
  return sprCanvas(16, 20, f, '#123018');
}
function buildTallSprites() {
  TALL_SPR.mountain = { imgs: [0, 1, 2].map(mountainSprite), dy: -8, base: 'grass' };
  TALL_SPR.caveIcon = { imgs: [caveSprite()], dy: -8, base: 'grass' };
  TALL_SPR.towerIcon = { imgs: [towerSprite()], dy: -14, base: 'grass' };
  TALL_SPR.shrineIcon = { imgs: [shrineSprite()], dy: -6, base: 'grass' };
  TALL_SPR.tree = { imgs: [0, 1].map(treeSprite), dy: -6, base: 'grass' };
  TALL_SPR.forest = { imgs: [0, 1, 2].map(forestSprite), dy: -4, base: 'grass' };
}

// ---------- value noise for large-scale color variation ----------
function vnoise(seed) {
  const h = (x, y) => { let n = (x * 374761393 + y * 668265263 + seed * 2654435761) | 0; n = (n ^ (n >>> 13)) * 1274126177 | 0; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi; const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
}
const thash = (x, y, k = 0) => ((((x * 73856093) ^ (y * 19349663) ^ (k * 83492791)) >>> 0) % 1000) / 1000;

// ---------- cache builder ----------
function mapKey(m, x, y) {
  const set = TILESETS[m.set];
  const base = (xx, yy) => { if (yy < 0 || xx < 0 || yy >= m.h || xx >= m.w) return null; const d = set[m.g[yy][xx]]; return d ? d[0] : null; };
  const k = base(x, y); if (!k) return null;
  if (WALLS.has(k)) { const b = base(x, y + 1); return k + ((b && b !== k) ? 'Face' : 'Top'); }
  return k;
}
// HD tile for a map that opted in (m.hd), or null to fall back to the 16px art
function hdTile(m, key, x, y) {
  if (!m.hd) return null;
  const hh = ((x * 73856093) ^ (y * 19349663)) >>> 0, v = hh % 4;
  if (key === 'grass') { const G2 = m.id === 'world' ? HD.grassW : HD.grass; return G2[(Math.imul(hh ^ (hh >>> 15), 0x2c1b3c6d) >>> 16) % G2.length]; } if (key === 'path') return HD.path[v];
  if (key === 'sand') return HD.sand[v]; if (key === 'paving') return HD.paving[v]; if (key === 'water') return HD.water[0];
  return HD.tile[key] || null;
}
function buildMapCache(m) {
  const set = TILESETS[m.set]; const W = m.w * T, H = m.h * T, D = PX;
  // the caches are stored at density D; everything below keeps drawing in 16px-per-tile coordinates through the scale transform
  const ground = mkCanvas(W * D, H * D), gx = ground.getContext('2d', { willReadFrequently: true }); gx.scale(D, D); gx.imageSmoothingEnabled = false;
  const upper = mkCanvas(W * D, H * D), ux = upper.getContext('2d'); ux.scale(D, D); ux.imageSmoothingEnabled = false;
  const groundImg = (key, x, y) => hdTile(m, key, x, y) || (TILE_VAR[key] ? TILE_VAR[key][(((x * 73856093) ^ (y * 19349663)) >>> 0) % 4] : TILE_IMG[key][0]);
  const base = (x, y) => { if (y < 0 || x < 0 || y >= m.h || x >= m.w) return null; const d = set[m.g[y][x]]; return d ? d[0] : null; };
  const isW = (x, y) => { const b = base(x, y); return b == null ? m.set === 'world' : WATERY.has(b); };
  const lights = [], dyn = [], tall = [], smoke = [], flowers = [];
  const rnd2 = mulberry(m.w * 131 + m.h * 7 + m.id.length);
  // 1) ground
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const key = mapKey(m, x, y); if (!key) continue; const sx = x * T, sy = y * T;
    if (DYN_GROUND.has(key) || DYN_TALL.has(key)) { dyn.push([key, x, y]); if (DYN_TALL.has(key)) { /* floor under fire/crystal is in its image */ } continue; }
    if (TALL_SPR[key]) { gx.drawImage(groundImg(TALL_SPR[key].base, x, y), sx, sy, T, T); tall.push([key, x, y]); continue; }
    if (m.hd && key === 'tree') { gx.drawImage(groundImg('grass', x, y), sx, sy, T, T); tall.push([key, x, y]); continue; }
    if (TALL_RECT.has(key) || TALL_ROUND.has(key)) { tall.push([key, x, y]); continue; }
    gx.drawImage(groundImg(key, x, y), sx, sy, T, T);
    if (FRINGED.has(key)) for (const [d, dx, dy] of [['N', 0, -1], ['S', 0, 1], ['W', -1, 0], ['E', 1, 0]]) { if (GRASSY.has(base(x + dx, y + dy)) || base(x + dx, y + dy) === 'mountain' || base(x + dx, y + dy) === 'forest') gx.drawImage(m.hd ? HD.fringe[d] : TILE_IMG.fringe[d], sx, sy, T, T); }
  }
  // 2) shores: rounded banks drawn over the edges of water tiles
  const bank = m.set === 'world' ? ['#e4cc8a', '#c8ac6a'] : m.set === 'cave' ? ['#4a3c3a', '#2e2428'] : ['#4e8934', '#3a6a28'];
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (base(x, y) !== 'water') continue; const sx = x * T, sy = y * T;
    const N = !isW(x, y - 1), S = !isW(x, y + 1), Wl = !isW(x - 1, y), E = !isW(x + 1, y);
    const edge = (horiz, at, dir) => {
      for (let i = 0; i < 16; i++) {
        const w = 2 + Math.round(Math.sin((horiz ? sx : sy) * 0.37 + i * 0.7) * 1 + thash(x * 16 + i, y, 3));
        if (horiz) { const yy = dir > 0 ? sy : sy + 16 - w; gx.fillStyle = bank[0]; gx.fillRect(sx + i, yy, 1, w); gx.fillStyle = bank[1]; gx.fillRect(sx + i, dir > 0 ? sy + w - 1 : yy, 1, 1); gx.fillStyle = 'rgba(220,240,255,.75)'; gx.fillRect(sx + i, dir > 0 ? sy + w : yy - 1, 1, 1); }
        else { const xx = dir > 0 ? sx : sx + 16 - w; gx.fillStyle = bank[0]; gx.fillRect(xx, sy + i, w, 1); gx.fillStyle = bank[1]; gx.fillRect(dir > 0 ? sx + w - 1 : xx, sy + i, 1, 1); gx.fillStyle = 'rgba(220,240,255,.75)'; gx.fillRect(dir > 0 ? sx + w : xx - 1, sy + i, 1, 1); }
      }
    };
    if (N) edge(true, 0, 1); if (S) edge(true, 0, -1); if (Wl) edge(false, 0, 1); if (E) edge(false, 0, -1);
    const corner = (cx, cy, rad) => { gx.save(); gx.beginPath(); gx.rect(sx, sy, 16, 16); gx.clip(); gx.fillStyle = bank[0]; gx.beginPath(); gx.arc(cx, cy, rad, 0, Math.PI * 2); gx.fill(); gx.strokeStyle = 'rgba(220,240,255,.7)'; gx.lineWidth = 1; gx.beginPath(); gx.arc(cx, cy, rad + 0.5, 0, Math.PI * 2); gx.stroke(); gx.restore(); };
    if (N && Wl) corner(sx, sy, 6); if (N && E) corner(sx + 16, sy, 6); if (S && Wl) corner(sx, sy + 16, 6); if (S && E) corner(sx + 16, sy + 16, 6);
    if (!N && !Wl && !isW(x - 1, y - 1)) corner(sx, sy, 3.5); if (!N && !E && !isW(x + 1, y - 1)) corner(sx + 16, sy, 3.5);
    if (!S && !Wl && !isW(x - 1, y + 1)) corner(sx, sy + 16, 3.5); if (!S && !E && !isW(x + 1, y + 1)) corner(sx + 16, sy + 16, 3.5);
  }
  // 3) decorations
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const b = base(x, y); const sx = x * T, sy = y * T; const h = thash(x, y, 7), h2 = thash(x, y, 11);
    const P = (c, a, bb, w = 1, hh = 1) => { gx.fillStyle = c; gx.fillRect(sx + a, sy + bb, w, hh); };
    if (b === 'grass' && (m.set === 'world' || m.set === 'town') && !m.hd) {
      const ax = Math.floor(h2 * 11) + 2, ay = Math.floor(thash(x, y, 13) * 10) + 3;
      if (h < 0.1) { P('#6b6a64', ax, ay, 3, 2); P('#a8a6a0', ax, ay, 2, 1); P('#3e5a2a', ax, ay + 2, 3, 1); }            // rock
      else if (h < 0.24) { for (let i = 0; i < 3; i++) { const c = ['#ffe680', '#ff9ab8', '#ffffff', '#b8a0ff'][Math.floor(h2 * 4 + i) % 4]; P(c, ax + i * 2 - 2, ay + (i % 2), 1, 1); P('#3e7a2e', ax + i * 2 - 2, ay + 1 + (i % 2), 1, 1); } } // flowers
      else if (h < 0.42) { P('#3c7a2a', ax, ay + 1, 1, 2); P('#3c7a2a', ax + 2, ay, 1, 3); P('#88c860', ax + 1, ay, 1, 2); P('#3c7a2a', ax + 4, ay + 1, 1, 2); } // tall grass tuft
      else if (h < 0.45 && m.set === 'world') { P('#f0f0e0', ax, ay + 1, 1, 2); P('#d83a3a', ax - 1, ay, 3, 1); P('#ffffff', ax, ay, 1, 1); } // mushroom
    } else if (b === 'caveFloor') {
      if (h < 0.3) { const ax = Math.floor(h2 * 13), ay = Math.floor(thash(x, y, 5) * 13); P('#3a2e2c', ax, ay + 1, 3, 1); P('#7a6862', ax, ay, 2, 1); }
      if (h > 0.9) { const ax = Math.floor(h2 * 10) + 3, ay = Math.floor(thash(x, y, 9) * 8) + 4; P('#3aa8d8', ax, ay, 1, 3); P('#8ae8ff', ax + 1, ay - 1, 1, 4); P('#3aa8d8', ax + 2, ay + 1, 1, 2); lights.push([sx + ax + 1, sy + ay, 34, '#7fe6ff', 0.55, 'static']); }
      else if (h > 0.8) { P('#2a2024', Math.floor(h2 * 8) + 2, 8, 6, 1); P('#2a2024', Math.floor(h2 * 8) + 7, 9, 3, 1); }
    } else if (b === 'tFloor') {
      if (h < 0.1) { P('rgba(20,16,40,.6)', 3 + Math.floor(h2 * 6), 4, 1, 5); P('rgba(20,16,40,.6)', 4 + Math.floor(h2 * 6), 8, 3, 1); }
      if (h > 0.96) { gx.strokeStyle = 'rgba(160,200,255,.35)'; gx.lineWidth = 1; gx.beginPath(); gx.arc(sx + 8, sy + 8, 5, 0, 7); gx.stroke(); lights.push([sx + 8, sy + 8, 30, '#a0c8ff', 0.35, 'static']); }
    } else if (b === 'floor' && h < 0.12) { P('rgba(60,30,10,.35)', Math.floor(h2 * 10) + 2, Math.floor(thash(x, y, 3) * 10) + 2, 4, 1); }
  }
  // 4) large-scale colour variation (organic, breaks up the tile grid)
  if (m.set !== 'inside') {
    const nz = vnoise(m.w * 17 + m.h), nz2 = vnoise(m.h * 29 + 5);
    const WD = W * D, HH = H * D, img = gx.getImageData(0, 0, WD, HH), d = img.data;
    const amp = m.set === 'world' || m.set === 'town' ? 0.16 : 0.12;
    for (let py = 0; py < HH; py++) for (let pxx = 0; pxx < WD; pxx++) {
      const i = (py * WD + pxx) * 4; if (!d[i + 3]) continue;
      const n = nz(pxx / (56 * D), py / (56 * D)) * 0.7 + nz2(pxx / (17 * D), py / (17 * D)) * 0.3; const f = 1 + (n - 0.5) * amp * 2;
      const warm = (n - 0.5) * 18;
      d[i] = clamp(d[i] * f + warm, 0, 255); d[i + 1] = clamp(d[i + 1] * f + warm * 0.5, 0, 255); d[i + 2] = clamp(d[i + 2] * f - warm * 0.4, 0, 255);
    }
    gx.putImageData(img, 0, 0);
  }
  // 5) ambient occlusion along the foot of walls and roofs
  for (let y = 1; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const above = mapKey(m, x, y - 1), here = base(x, y); if (!above || !here) continue;
    if ((TALL_RECT.has(above) && !TALL_RECT.has(here)) && !WATERY.has(here)) {
      const g = gx.createLinearGradient(0, y * T, 0, y * T + 6); g.addColorStop(0, 'rgba(10,6,20,.45)'); g.addColorStop(1, 'rgba(10,6,20,0)');
      gx.fillStyle = g; gx.fillRect(x * T, y * T, T, 6);
    }
  }
  // 6) cast shadows (light from upper-left)
  const sh = mkCanvas(W * D, H * D), sx2 = sh.getContext('2d'); sx2.scale(D, D); sx2.fillStyle = '#000';
  for (const [key, x, y] of tall) {
    const sx = x * T, sy = y * T;
    if (TALL_SPR[key]) { sx2.beginPath(); sx2.ellipse(sx + 11, sy + 13, key === 'forest' ? 9 : 7, key === 'mountain' ? 5 : 4, 0, 0, Math.PI * 2); sx2.fill(); }
    else if (TALL_RECT.has(key)) sx2.fillRect(sx + 4, sy + 4, 16, 16);
    else { sx2.beginPath(); sx2.ellipse(sx + 11, sy + 14, 7, 3.5, 0, 0, Math.PI * 2); sx2.fill(); }
  }
  gx.globalAlpha = m.set === 'world' || m.set === 'town' ? 0.26 : 0.34; gx.drawImage(sh, 0, 0, W, H); gx.globalAlpha = 1;
  // 7) upper layer: tall objects, row by row so lower rows overlap upper ones
  tall.sort((a, b) => a[2] - b[2] || a[1] - b[1]);
  for (const [key, x, y] of tall) {
    const sx = x * T, sy = y * T;
    if (TALL_SPR[key]) { const S = TALL_SPR[key]; const imgs = m.hd && HD.tall[key] ? HD.tall[key] : S.imgs; const im = imgs[(((x * 92837111) ^ (y * 689287499)) >>> 0) % imgs.length]; const iw = im.lw || im.width, ih = im.lh || im.height; ux.drawImage(im, sx + Math.round((16 - iw) / 2), sy + 16 - ih, iw, ih); continue; }
    if (m.hd && key === 'tree') { const im = HD.tall.tree[(x + y) % 2]; ux.drawImage(im, sx - 4, sy + 16 - 28, 24, 33); continue; }
    ux.drawImage(hdTile(m, key, x, y) || TILE_IMG[key][0], sx, sy, T, T);
    if (key.endsWith('Top')) { const fam = key.slice(0, -3); ux.fillStyle = 'rgba(0,0,0,.45)'; if (base(x - 1, y) !== fam) ux.fillRect(sx, sy, 1, 16); if (base(x + 1, y) !== fam) ux.fillRect(sx + 15, sy, 1, 16); if (base(x, y - 1) !== fam) { ux.fillStyle = 'rgba(255,255,255,.12)'; ux.fillRect(sx, sy, 16, 1); } }
    if (key === 'roof' || key === 'roofB') {
      const up = base(x, y - 1), dn = base(x, y + 1);
      if (up !== key) { ux.fillStyle = 'rgba(255,240,210,.35)'; ux.fillRect(sx, sy, 16, 1); if (thash(x, y, 21) < 0.35 && base(x - 1, y) === key && base(x + 1, y) === key) { smoke.push([sx + 11, sy - 6]); ux.fillStyle = '#5a3a2a'; ux.fillRect(sx + 9, sy - 5, 4, 7); ux.fillStyle = '#7a5040'; ux.fillRect(sx + 9, sy - 5, 4, 1); ux.fillStyle = '#3a2418'; ux.fillRect(sx + 12, sy - 4, 1, 6); } }
      if (dn !== key) { ux.fillStyle = 'rgba(30,10,10,.45)'; ux.fillRect(sx, sy + 14, 16, 2); }
    }
    if ((key === 'wall' || key === 'window' || key === 'door') && (base(x, y - 1) === 'roof' || base(x, y - 1) === 'roofB')) { ux.fillStyle = 'rgba(20,10,10,.35)'; ux.fillRect(sx, sy, 16, 3); }
    if (key === 'window' && !m.hd) { ux.fillStyle = '#6a4424'; ux.fillRect(sx + 4, sy + 11, 8, 2); ux.fillStyle = ['#ff7a9a', '#ffe060', '#ffffff'][(x + y) % 3]; ux.fillRect(sx + 5, sy + 10, 1, 1); ux.fillRect(sx + 8, sy + 10, 1, 1); ux.fillRect(sx + 10, sy + 10, 1, 1); ux.fillStyle = '#4e8934'; ux.fillRect(sx + 6, sy + 10, 2, 1); ux.fillRect(sx + 9, sy + 10, 1, 1); }
  }
  // 8) static lights
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const key = base(x, y), cx = x * T + 8, cy = y * T + 8;
    if (key === 'lamp') lights.push([cx, cy - 6, 46, '#ffd38a', 0.9, 'static']);
    else if (key === 'fire') lights.push([cx, cy + 2, 90, '#ff9440', 1, 'flicker']);
    else if (key === 'crystal') lights.push([cx, cy, 120, '#7fe6ff', 0.95, 'pulse']);
    else if (key === 'savept') lights.push([cx, cy, 56, '#8ae8ff', 0.8, 'pulse']);
    else if (key === 'caveExit' || key === 'towerExit') lights.push([cx, cy, 80, '#fff2d0', 0.9, 'static']);
    else if (key === 'towerIcon') lights.push([cx, cy - 18, 26, '#7fe6ff', 0.9, 'pulse']);
    else if (key === 'shrineIcon') lights.push([cx, cy - 2, 26, '#8affd8', 0.8, 'pulse']);
    else if (key === 'townIcon' || key === 'townIcon2') lights.push([cx, cy, 22, '#ffd38a', 0.5, 'static']);
    else if (key === 'window' && m.set === 'town') lights.push([cx, cy, 18, '#ffe0a0', 0.35, 'static']);
    if (key === 'flowers') flowers.push([cx, cy]);
  }
  m._cache = { ground, upper, lights, dyn, smoke, flowers };
}
function drawMapLayers(m, cx, cy) {
  if (!m._cache) buildMapCache(m);
  const C = m._cache, set = TILESETS[m.set], t = G.frame, f = (t >> 5) & 1;
  const x0 = Math.floor(cx / T), y0 = Math.floor(cy / T);
  // animated water underneath
  for (let y = y0; y <= y0 + 15; y++) for (let x = x0; x <= x0 + 17; x++) {
    if (y < 0 || x < 0 || y >= m.h || x >= m.w) continue;
    const d = set[m.g[y][x]]; if (!d || !WATERY.has(d[0])) continue;
    const sx = x * T - cx, sy = y * T - cy; ctx.drawImage(m.hd ? HD.water[f] : TILE_IMG.water[f], sx, sy, T, T);
    const h = ((x * 31 + y * 17 + (t >> 3)) * 2654435761) >>> 0;
    if (h % 19 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(sx + (h >> 5) % 14, sy + (h >> 9) % 14, 2, 1); }
  }
  blitRegion(C.ground, cx, cy);
  // animated / state-dependent tiles
  for (const [key0, x, y] of C.dyn) {
    if (x < x0 - 1 || x > x0 + 18 || y < y0 - 1 || y > y0 + 16) continue;
    let key = key0; const ch = m.g[y][x];
    if (ch === 'B' && G.flags[`chest:${G.mapId}:${x},${y}`]) key = m.set === 'tower' ? 'chestOpenT' : 'chestOpen';
    if (key === 'water') continue;
    if (m.hd && HD.tile[key]) { ctx.drawImage(HD.tile[key], x * T - cx, y * T - cy, T, T); continue; }
    const img = TILE_IMG[key]; ctx.drawImage(img[ANIM_TILES.has(key) ? f : 0], x * T - cx, y * T - cy);
  }
  blitRegion(C.upper, cx, cy);
  // lights in view
  for (const [lx_, ly_, r, col, i, kind] of C.lights) {
    const sx = lx_ - cx, sy = ly_ - cy; if (sx < -r || sy < -r || sx > SW + r || sy > SH + r) continue;
    const k = kind === 'flicker' ? 0.85 + Math.sin(t / 5 + lx_) * 0.08 + Math.sin(t / 3.3) * 0.05 : kind === 'pulse' ? 0.85 + Math.sin(t / 20 + lx_) * 0.15 : 1;
    addLight(sx, sy, r, col, i * k);
  }
}

// copy the visible window of a cached layer, clipping by hand (some browsers mishandle out-of-range source rects)
function blitRegion(img, cx, cy) {
  const D = PX, sx = Math.max(0, cx), sy = Math.max(0, cy);
  const ex = Math.min(img.width / D, cx + SW), ey = Math.min(img.height / D, cy + SH);
  if (ex <= sx || ey <= sy) return;
  ctx.drawImage(img, sx * D, sy * D, (ex - sx) * D, (ey - sy) * D, sx - cx, sy - cy, ex - sx, ey - sy);
}
