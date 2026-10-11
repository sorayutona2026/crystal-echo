'use strict';
// ===== assets: embedded PNGs (ASSET_IMG / MANIFEST are appended by build.py) =====
const A = { img: {}, cache: {}, ready: false };
function loadAssets() {
  const files = Object.keys(ASSET_IMG);
  return Promise.all(files.map(f => new Promise((res, rej) => {
    const im = new Image(); im.onload = () => { A.img[f] = im; res(); }; im.onerror = () => rej(new Error('img ' + f)); im.src = ASSET_IMG[f];
  }))).then(() => { A.ready = true; buildTiles(); });
}
function cvs(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function pxColor(im, x, y) { const c = cvs(1, 1), g = c.getContext('2d'); g.drawImage(im, x, y, 1, 1, 0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; return d; }
// 16x16 tile canvases (terrain), pre-composited on grass where the art is transparent
const TILE = {};
function buildTiles() {
  const T = MANIFEST.tiles;
  const raw = n => { const t = T[n], c = cvs(16, 16); c.getContext('2d').drawImage(A.img[t.file], t.x, t.y, 16, 16, 0, 0, 16, 16); return c; };
  const grass = raw('tile_grass'), g0 = grass.getContext('2d');
  // grass: add deterministic tufts so a big field is not flat
  const gd = (()=>{const d=g0.getImageData(8,8,1,1).data; return d;})();
  const shade = (d, k) => 'rgb(' + Math.max(0, Math.min(255, d[0] * k | 0)) + ',' + Math.max(0, Math.min(255, d[1] * k | 0)) + ',' + Math.max(0, Math.min(255, d[2] * k | 0)) + ')';
  TILE.grassBase = grass; TILE.gd = gd; TILE.shade = shade;
  TILE.grass = []; // 4 variants
  for (let v = 0; v < 4; v++) {
    const c = cvs(16, 16), g = c.getContext('2d'); g.drawImage(grass, 0, 0);
    let s = v * 7919 + 13;
    const r = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    g.fillStyle = shade(gd, 0.82); for (let i = 0; i < 3; i++) { const x = r() * 13 | 0, y = r() * 13 | 0; g.fillRect(x, y + 1, 1, 1); g.fillRect(x + 1, y, 1, 2); }
    g.fillStyle = shade(gd, 1.12); for (let i = 0; i < 3; i++) g.fillRect(r() * 15 | 0, r() * 15 | 0, 1, 1);
    TILE.grass.push(c);
  }
  const over = n => { const c = cvs(16, 16), g = c.getContext('2d'); g.drawImage(grass, 0, 0); g.drawImage(raw(n), 0, 0); return c; };
  TILE.forest = over('tile_forest'); TILE.mountain = over('tile_mountain');
  { const f = T.tile_fort, c = cvs(f.w, f.h); c.getContext('2d').drawImage(A.img[f.file], f.x, f.y, f.w, f.h, 0, 0, f.w, f.h); TILE.fortSprite = c; }
  // road: use a flat interior so rows of road read as a path
  const rd = raw('tile_road'); TILE.road = rd;
  const wd = pxColor(A.img[T.tile_water.file], T.tile_water.x + 8, T.tile_water.y + 8);
  TILE.waterColor = wd; TILE.waterHi = shade(wd, 1.25); TILE.waterLo = shade(wd, 0.82);
}
function drawTile(g, ch, x, y, tx, ty, t) {
  switch (ch) {
    case '=': g.drawImage(TILE.road, x, y); break;
    case 'T': g.drawImage(TILE.forest, x, y); break;
    case '^': g.drawImage(TILE.mountain, x, y); break;
    case '#': g.drawImage(TILE.road, x, y); g.fillStyle = 'rgba(40,30,60,0.18)'; g.fillRect(x, y, 16, 16); break;
    case '~': {
      g.fillStyle = TILE.shade(TILE.waterColor, 1); g.fillRect(x, y, 16, 16);
      const ph = (t || 0) / 40 + tx * 0.9 + ty * 1.7;
      g.fillStyle = TILE.waterHi;
      for (let i = 0; i < 3; i++) { const yy = (i * 5 + 2) | 0, xx = ((i * 7 + tx * 5 + Math.floor(ph * 2 + i)) % 12 + 12) % 12; g.fillRect(x + xx, y + yy, 4, 1); }
      g.fillStyle = TILE.waterLo; g.fillRect(x + ((tx * 3 + ty) % 8), y + 14, 5, 1);
      break; }
    default: g.drawImage(TILE.grass[(tx * 3 + ty * 5 + (tx * ty)) & 3], x, y);
  }
}
// character sprites. pose rows 0-3 form the 4-frame walk cycle (row 0 = standing)
const SPR = {};
function spriteSheet(id) { const u = MANIFEST.units[id]; return A.img[u.file]; }
function spriteVariant(id, dir, row, mode) {
  const key = id + dir + row + mode; if (SPR[key]) return SPR[key];
  const u = MANIFEST.units[id], d = u.dirs[dir];
  const c = cvs(16, 16), g = c.getContext('2d');
  g.drawImage(spriteSheet(id), d.x, d.y + row * 16, 16, 16, 0, 0, 16, 16);
  if (mode) {
    const im = g.getImageData(0, 0, 16, 16), p = im.data;
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      if (mode === 'gray') { const l = (p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11) * 0.55 + 40; p[i] = p[i + 1] = p[i + 2] = l; }
      else if (mode === 'white') { p[i] = p[i + 1] = p[i + 2] = 255; }
    }
    g.putImageData(im, 0, 0);
  }
  return SPR[key] = c;
}
function drawUnitSprite(g, id, dir, row, x, y, mode, alpha) {
  const c = spriteVariant(id, dir, row, mode);
  if (alpha != null && alpha < 1) g.globalAlpha = Math.max(0, alpha);
  g.drawImage(c, Math.round(x), Math.round(y)); g.globalAlpha = 1;
}
function drawFace(g, name, x, y, scale) {
  const f = MANIFEST.faces['face_' + name]; if (!f) return;
  const s = scale || 1; g.drawImage(A.img[f.file], f.x, f.y, f.w, f.h, x, y, f.w * s, f.h * s);
}

// forts are 2x2 blocks of '#': draw the big fort sprite once over each block
function drawForts(g, rows, ox, oy) {
  for (let y = 0; y + 1 < rows.length; y++) for (let x = 0; x + 1 < rows[0].length; x++)
    if (rows[y][x] === '#' && rows[y][x + 1] === '#' && rows[y + 1][x] === '#' && rows[y + 1][x + 1] === '#') g.drawImage(TILE.fortSprite, ox + x * 16 + 1, oy + y * 16 + 2);
}
