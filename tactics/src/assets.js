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
  TILE.deco = ['deco_flower', 'deco_flowers', 'deco_tuft', 'deco_stone'].map(raw);
  TILE.forest = over('tile_forest'); TILE.mountain = over('tile_mountain');
  { const f = T.tile_fort, c = cvs(f.w, f.h); c.getContext('2d').drawImage(A.img[f.file], f.x, f.y, f.w, f.h, 0, 0, f.w, f.h); TILE.fortSprite = c; }
  // road: use a flat interior so rows of road read as a path
  const rd = raw('tile_road'); TILE.road = rd;
  const wd = pxColor(A.img[T.tile_water.file], T.tile_water.x + 8, T.tile_water.y + 8);
  TILE.waterColor = wd; TILE.waterHi = shade(wd, 1.25); TILE.waterLo = shade(wd, 0.82);
}

function hash2(x, y, k) { let h = (x * 374761393 + y * 668265263 + (k || 0) * 2246822519) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
// draws a whole map (tiles, banks, shoreline, bridges, decorations, castle). rows = array of strings
function drawMapLayer(g, rows, ox, oy, t) {
  const H = rows.length, Wd = rows[0].length, at = (x, y) => (x < 0 || y < 0 || x >= Wd || y >= H) ? null : rows[y][x];
  const shade = TILE.shade, gd = TILE.gd;
  const water = c => c === '~', roadish = c => c === '=' || c === '#' || c === null || c === '~';
  for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) {
    const ch = rows[y][x], px = ox + x * 16, py = oy + y * 16;
    const U = at(x, y - 1), D = at(x, y + 1), L = at(x - 1, y), R = at(x + 1, y);
    if (ch === '~') {
      g.fillStyle = shade(TILE.waterColor, 1); g.fillRect(px, py, 16, 16);
      const ph = (t || 0) / 40 + x * 0.9 + y * 1.7;
      g.fillStyle = TILE.waterHi;
      for (let i = 0; i < 3; i++) { const yy = (i * 5 + 2) | 0, xx = ((i * 7 + x * 5 + Math.floor(ph * 2 + i)) % 12 + 12) % 12; g.fillRect(px + xx, py + yy, 4, 1); }
      g.fillStyle = TILE.waterLo; g.fillRect(px + ((x * 3 + y) % 8), py + 14, 5, 1); g.fillRect(px + ((x * 5 + y * 3) % 9 + 3), py + 8, 3, 1);
      // shoreline: darker rim and an animated foam line where water meets land
      const edge = (cond, fx, fy, fw, fh, dx, dy, dw, dh) => { if (!cond) return; g.fillStyle = 'rgba(20,70,110,0.55)'; g.fillRect(px + dx, py + dy, dw, dh); g.fillStyle = 'rgba(235,252,255,' + (0.75 + 0.2 * Math.sin((t || 0) / 18 + x + y)) + ')'; g.fillRect(px + fx, py + fy, fw, fh); };
      const land = c => c !== null && c !== '~' && !(c === '=' && false);
      edge(land(U), 0, 1, 16, 1, 0, 0, 16, 1); edge(land(D), 0, 14, 16, 1, 0, 15, 16, 1);
      edge(land(L), 1, 0, 1, 16, 0, 0, 1, 16); edge(land(R), 14, 0, 1, 16, 15, 0, 1, 16);
      continue;
    }
    // ground beneath everything else
    if (ch === '=' || ch === '#') { g.drawImage(TILE.road, px, py); }
    else {
      g.drawImage(TILE.grass[(x * 3 + y * 5 + (x * y)) & 3], px, py);
      const n = Math.sin(x * 0.8) + Math.sin(y * 1.1 + 1) + Math.sin((x + y) * 0.45); // soft large-scale tone patches
      g.fillStyle = n > 0.6 ? 'rgba(255,255,200,0.05)' : n < -0.8 ? 'rgba(0,40,0,0.05)' : 'rgba(0,0,0,0)'; g.fillRect(px, py, 16, 16);
      // bank shadow where grass meets water
      g.fillStyle = 'rgba(20,50,20,0.38)';
      if (water(U)) g.fillRect(px, py, 16, 2); if (water(D)) g.fillRect(px, py + 14, 16, 2); if (water(L)) g.fillRect(px, py, 2, 16); if (water(R)) g.fillRect(px + 14, py, 2, 16);
    }
    if (ch === '.') {
      const r = hash2(x, y, 1);
      if (r < 0.16 && !(water(U) || water(D) || water(L) || water(R))) { const d = TILE.deco[Math.floor(hash2(x, y, 2) * TILE.deco.length)]; g.drawImage(d, px, py); }
    } else if (ch === '=') {
      const br = (water(U) && water(D)) || (water(L) && water(R));
      if (br) { // wooden bridge
        const hz = water(U); g.fillStyle = '#8a5a30'; g.fillRect(px, py, 16, 16);
        g.fillStyle = '#a77440'; for (let i = 0; i < 16; i += 4) hz ? g.fillRect(px, py + i, 16, 3) : g.fillRect(px + i, py, 3, 16);
        g.fillStyle = '#4a2c18'; if (hz) { g.fillRect(px, py, 16, 1); g.fillRect(px, py + 15, 16, 1); } else { g.fillRect(px, py, 1, 16); g.fillRect(px + 15, py, 1, 16); }
      } else {
        // pebbles + softened edges against grass (checker dither into the grass colour)
        for (let i = 0; i < 3; i++) { const q = hash2(x, y, 5 + i); g.fillStyle = i ? 'rgba(255,240,200,0.35)' : 'rgba(80,60,30,0.3)'; g.fillRect(px + (q * 14 | 0), py + (hash2(x, y, 9 + i) * 14 | 0), 2, 1); }
        const gc = shade(gd, 0.9), gc2 = shade(gd, 1.0);
        const side = (c, f) => { if (roadish(c)) return; f(); };
        const dith = (hz, pos, sgn) => { for (let i = 0; i < 16; i++) { g.fillStyle = gc; if (hz) { g.fillRect(px + i, py + pos, 1, 1); if ((i & 1) === 0) { g.fillStyle = gc2; g.fillRect(px + i, py + pos + sgn, 1, 1); } } else { g.fillRect(px + pos, py + i, 1, 1); if ((i & 1) === 0) { g.fillStyle = gc2; g.fillRect(px + pos + sgn, py + i, 1, 1); } } } };
        side(U, () => dith(true, 0, 1)); side(D, () => dith(true, 15, -1)); side(L, () => dith(false, 0, 1)); side(R, () => dith(false, 15, -1));
        // rounded corners
        const cr = (a, b, cx, cy) => { if (!roadish(a) && !roadish(b)) { g.fillStyle = gc; g.fillRect(px + cx, py + cy, 2, 2); } };
        cr(U, L, 0, 0); cr(U, R, 14, 0); cr(D, L, 0, 14); cr(D, R, 14, 14);
      }
    } else if (ch === 'T' || ch === '^') {
      g.fillStyle = 'rgba(0,30,0,0.22)'; g.beginPath(); g.ellipse(px + 8, py + 14, 6, 2, 0, 0, 7); g.fill();
      g.drawImage(ch === 'T' ? TILE.forest : TILE.mountain, px, py);
    } else if (ch === '#') {
      g.fillStyle = 'rgba(40,30,60,0.2)'; g.fillRect(px, py, 16, 16);
      if (((x + y) & 1) === 0) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(px, py, 16, 16); }
    }
  }
  // castles: each connected '#' block gets one big sprite centred on it, bottom-aligned (gate at the bottom centre)
  for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) {
    if (rows[y][x] !== '#' || at(x - 1, y) === '#' || at(x, y - 1) === '#') continue;
    let w = 1, h = 1; while (at(x + w, y) === '#') w++; while (at(x, y + h) === '#') h++;
    g.strokeStyle = '#2a2236'; g.lineWidth = 1; g.strokeRect(ox + x * 16 + 0.5, oy + y * 16 + 0.5, w * 16 - 1, h * 16 - 1);
    if (w >= 3) for (const cx of [x, x + w - 1]) for (let yy = y; yy < y + h; yy++) { // side walls: brick with battlements
      const wx = ox + cx * 16, wy = oy + yy * 16; g.fillStyle = '#7b7284'; g.fillRect(wx, wy, 16, 16);
      g.fillStyle = '#5a5266'; for (let r = 4; r < 16; r += 5) g.fillRect(wx, wy + r, 16, 1); for (let r = 0; r < 3; r++) for (let c = (r & 1) * 4 + 3; c < 16; c += 8) g.fillRect(wx + c, wy + r * 5, 1, 4);
      g.fillStyle = '#a49cb4'; g.fillRect(wx, wy, 16, 1);
      if (yy === y) { g.fillStyle = '#2a2236'; g.fillRect(wx, wy, 16, 1); g.fillStyle = '#9d95ad'; for (let c = 0; c < 16; c += 6) g.fillRect(wx + c, wy, 3, 3); }
    }
    g.strokeStyle = '#2a2236'; g.strokeRect(ox + x * 16 + 0.5, oy + y * 16 + 0.5, w * 16 - 1, h * 16 - 1);
    const sp = TILE.fortSprite; g.drawImage(sp, Math.round(ox + x * 16 + (w * 16 - sp.width) / 2), oy + (y + h) * 16 - sp.height);
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

