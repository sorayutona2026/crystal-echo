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
let DECO = {};
const THEMES = {
  bright: { tint: null, density: 0.34, flat: ['fl', 'fl', 'fl', 'fl', 'fl', 'tuft', 'tuft', 'tuft', 'clover', 'flw', 'stone', 'sun', 'stick'] },
  mossy: { tint: 'rgba(20,80,60,0.20)', density: 0.36, flat: ['moss', 'moss', 'moss', 'mush', 'tuft', 'tuft', 'stone', 'stick', 'pebble', 'flw', 'fl'] },
  harsh: { tint: 'rgba(60,40,30,0.34)', density: 0.24, flat: ['stick', 'stick', 'pebble', 'crack', 'crack', 'crack', 'stone', 'tuft', 'pebble', 'bone', 'stick', 'crack', 'skull'], dead: true }
};
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
  DECO = {}; for (const n in (MANIFEST.deco || {})) { const d = MANIFEST.deco[n], c = cvs(d.w, d.h); c.getContext('2d').drawImage(A.img[d.file], d.x, d.y, d.w, d.h, 0, 0, d.w, d.h); DECO[n] = c; }
  TILE.deco = ['deco_flower', 'deco_flowers', 'deco_tuft', 'deco_stone'].map(raw);
  TILE.forest = over('tile_forest'); TILE.mountain = over('tile_mountain');
  { const f = T.tile_fort, c = cvs(f.w, f.h); c.getContext('2d').drawImage(A.img[f.file], f.x, f.y, f.w, f.h, 0, 0, f.w, f.h); TILE.fortSprite = c; }
  // road: use a flat interior so rows of road read as a path
  const rd = raw('tile_road'); TILE.road = rd;
  const wd = pxColor(A.img[T.tile_water.file], T.tile_water.x + 8, T.tile_water.y + 8);
  TILE.waterColor = wd; TILE.waterHi = shade(wd, 1.25); TILE.waterLo = shade(wd, 0.82);
}

function hash2(x, y, k) { let h = (x * 374761393 + y * 668265263 + (k || 0) * 2246822519) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

// flat ground details (never tall enough to hide anything): flowers, tufts, mushrooms, pebbles, bones, cracks ...
function drawFlat(g, kind, px, py, x, y) {
  const h = (k) => hash2(x, y, 20 + k), put = (name, k) => { const c = DECO[name]; if (c) g.drawImage(c, px + Math.floor(h(k) * (16 - c.width)), py + Math.floor(h(k + 1) * (16 - c.height))); };
  switch (kind) {
    case 'fl': { const cols = ['#ff6b8a', '#ffd84a', '#ffffff', '#7ab8ff', '#ff9ee0', '#ff9a3a']; const c1 = cols[Math.floor(h(0) * cols.length)], c2 = cols[Math.floor(h(1) * cols.length)];
      for (let i = 0; i < 6; i++) { const fx = px + 1 + Math.floor(h(2 + i) * 13), fy = py + 2 + Math.floor(h(9 + i) * 11); g.fillStyle = '#2f7a2a'; g.fillRect(fx, fy + 1, 1, 2); g.fillStyle = i % 2 ? c1 : c2; g.fillRect(fx, fy, 1, 1); if (i % 3 === 0) { g.fillRect(fx - 1, fy, 1, 1); g.fillRect(fx + 1, fy, 1, 1); g.fillStyle = '#fff6a0'; g.fillRect(fx, fy, 1, 1); } } break; }
    case 'tuft': put(['tuft1', 'tuft2', 'tuft3'][Math.floor(h(0) * 3)], 1); break;
    case 'clover': put('clover', 1); break; case 'sun': put('sunflower', 1); break; case 'flw': put('flower_w', 1); break;
    case 'stone': put('stone_s', 1); break; case 'mush': put('mushroom', 1); break;
    case 'stick': put(['stick1', 'stick2', 'stick3'][Math.floor(h(0) * 3)], 1); break;
    case 'bone': put('bone', 1); break; case 'skull': put('skull', 1); break;
    case 'pebble': put('pebble', 1); put('pebble', 4); break;
    case 'moss': g.fillStyle = 'rgba(30,100,60,0.40)'; g.beginPath(); g.ellipse(px + 5 + h(0) * 6, py + 6 + h(1) * 5, 5, 3, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(150,220,120,0.5)'; g.fillRect(px + 3 + (h(2) * 9 | 0), py + 4 + (h(3) * 8 | 0), 1, 1); g.fillRect(px + 3 + (h(4) * 9 | 0), py + 4 + (h(5) * 8 | 0), 1, 1); break;
    case 'crack': g.fillStyle = 'rgba(25,15,10,0.55)'; { let cx = px + 2 + (h(0) * 8 | 0), cy = py + 3 + (h(1) * 8 | 0); for (let i = 0; i < 7; i++) { g.fillRect(cx, cy, 2, 1); cx += 1 + (h(2 + i) * 2 | 0); cy += (h(9 + i) < 0.5 ? 0 : 1); } } break;
  }
}
function propSprite(kind, x, y) { if (kind === 'grave') return DECO[hash2(x, y, 3) < 0.5 ? 'grave' : 'grave2']; const m = { sign: 'sign', stump: 'stump', cart: 'cart', barrel: 'barrel', banner: 'banner', cart_broken: 'cart_broken' }; return DECO[m[kind]]; }
// draws a whole map (backdrop is separate). rows = array of strings; props = {'x,y': kind}
function drawMapLayer(g, rows, ox, oy, t, themeName, props) {
  const TH = THEMES[themeName || 'bright'], H = rows.length, Wd = rows[0].length, at = (x, y) => (x < 0 || y < 0 || x >= Wd || y >= H) ? null : rows[y][x];
  const shade = TILE.shade, gd = TILE.gd, fx = []; props = props || {};
  const water = c => c === '~', roadish = c => c === '=' || c === '#' || c === null || c === '~';
  const tint = (px, py) => { if (TH.tint) { g.fillStyle = TH.tint; g.fillRect(px, py, 16, 16); } };
  for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) {
    const ch = rows[y][x], px = ox + x * 16, py = oy + y * 16;
    const U = at(x, y - 1), D = at(x, y + 1), L = at(x - 1, y), R = at(x + 1, y);
    if (ch === '~') {
      g.fillStyle = shade(TILE.waterColor, 1); g.fillRect(px, py, 16, 16);
      const ph = (t || 0) / 40 + x * 0.9 + y * 1.7;
      g.fillStyle = TILE.waterHi;
      for (let i = 0; i < 3; i++) { const yy = (i * 5 + 2) | 0, xx = ((i * 7 + x * 5 + Math.floor(ph * 2 + i)) % 12 + 12) % 12; g.fillRect(px + xx, py + yy, 4, 1); }
      g.fillStyle = TILE.waterLo; g.fillRect(px + ((x * 3 + y) % 8), py + 14, 5, 1); g.fillRect(px + ((x * 5 + y * 3) % 9 + 3), py + 8, 3, 1);
      const land = c => c !== null && c !== '~';
      const edge = (cond, a, b, c2, d2, e, f, gg, hh) => { if (!cond) return; g.fillStyle = 'rgba(20,70,110,0.55)'; g.fillRect(px + e, py + f, gg, hh); g.fillStyle = 'rgba(235,252,255,' + (0.75 + 0.2 * Math.sin((t || 0) / 18 + x + y)) + ')'; g.fillRect(px + a, py + b, c2, d2); };
      edge(land(U), 0, 1, 16, 1, 0, 0, 16, 1); edge(land(D), 0, 14, 16, 1, 0, 15, 16, 1);
      edge(land(L), 1, 0, 1, 16, 0, 0, 1, 16); edge(land(R), 14, 0, 1, 16, 15, 0, 1, 16);
      // rounded corners: bank-coloured pixels where two land sides meet
      g.fillStyle = shade(gd, 0.78);
      const cn = (a, b, cx, cy, sx, sy) => { if (land(a) && land(b)) { g.fillRect(px + cx, py + cy, 3, 1); g.fillRect(px + cx, py + cy, 1, 3); if (sx) { g.fillRect(px + cx + 2 * sx, py + cy, 1, 1); } } };
      if (land(U) && land(L)) { g.fillRect(px, py, 3, 1); g.fillRect(px, py, 1, 3); g.fillRect(px + 1, py + 1, 1, 1); }
      if (land(U) && land(R)) { g.fillRect(px + 13, py, 3, 1); g.fillRect(px + 15, py, 1, 3); g.fillRect(px + 14, py + 1, 1, 1); }
      if (land(D) && land(L)) { g.fillRect(px, py + 15, 3, 1); g.fillRect(px, py + 13, 1, 3); g.fillRect(px + 1, py + 14, 1, 1); }
      if (land(D) && land(R)) { g.fillRect(px + 13, py + 15, 3, 1); g.fillRect(px + 15, py + 13, 1, 3); g.fillRect(px + 14, py + 14, 1, 1); }
      tint(px, py);
      continue;
    }
    if (ch === '=' || ch === '#') { g.drawImage(TILE.road, px, py); }
    else {
      g.drawImage(TILE.grass[(x * 3 + y * 5 + (x * y)) & 3], px, py);
      const n = Math.sin(x * 0.8) + Math.sin(y * 1.1 + 1) + Math.sin((x + y) * 0.45);
      g.fillStyle = n > 0.6 ? 'rgba(255,255,200,0.05)' : n < -0.8 ? 'rgba(0,40,0,0.05)' : 'rgba(0,0,0,0)'; g.fillRect(px, py, 16, 16);
      g.fillStyle = 'rgba(20,50,20,0.38)';
      if (water(U)) g.fillRect(px, py, 16, 2); if (water(D)) g.fillRect(px, py + 14, 16, 2); if (water(L)) g.fillRect(px, py, 2, 16); if (water(R)) g.fillRect(px + 14, py, 2, 16);
    }
    tint(px, py);
    if (ch === '.') {
      if (hash2(x, y, 1) < TH.density && !(water(U) || water(D) || water(L) || water(R))) drawFlat(g, TH.flat[Math.floor(hash2(x, y, 2) * TH.flat.length)], px, py, x, y);
    } else if (ch === '=') {
      const br = (water(U) && water(D)) || (water(L) && water(R));
      if (br) {
        const hz = water(U); g.fillStyle = '#8a5a30'; g.fillRect(px, py, 16, 16);
        g.fillStyle = '#a77440'; for (let i = 0; i < 16; i += 4) hz ? g.fillRect(px, py + i, 16, 3) : g.fillRect(px + i, py, 3, 16);
        g.fillStyle = '#4a2c18'; if (hz) { g.fillRect(px, py, 16, 1); g.fillRect(px, py + 15, 16, 1); } else { g.fillRect(px, py, 1, 16); g.fillRect(px + 15, py, 1, 16); }
        if (hash2(x, y, 7) < 0.5) { g.fillStyle = '#4a2c18'; if (hz) { g.fillRect(px + 5, py + 4, 2, 3); } else { g.fillRect(px + 4, py + 5, 3, 2); } } // a broken plank
      } else {
        for (let i = 0; i < 3; i++) { const q = hash2(x, y, 5 + i); g.fillStyle = i ? 'rgba(255,240,200,0.35)' : 'rgba(80,60,30,0.3)'; g.fillRect(px + (q * 14 | 0), py + (hash2(x, y, 9 + i) * 14 | 0), 2, 1); }
        const gc = shade(gd, 0.9), gc2 = shade(gd, 1.0);
        const side = (c, f) => { if (roadish(c)) return; f(); };
        const dith = (hz, pos, sgn) => { for (let i = 0; i < 16; i++) { g.fillStyle = gc; if (hz) { g.fillRect(px + i, py + pos, 1, 1); if ((i & 1) === 0) { g.fillStyle = gc2; g.fillRect(px + i, py + pos + sgn, 1, 1); } } else { g.fillRect(px + pos, py + i, 1, 1); if ((i & 1) === 0) { g.fillStyle = gc2; g.fillRect(px + pos + sgn, py + i, 1, 1); } } } };
        side(U, () => dith(true, 0, 1)); side(D, () => dith(true, 15, -1)); side(L, () => dith(false, 0, 1)); side(R, () => dith(false, 15, -1));
        const cr = (a, b, cx, cy) => { if (!roadish(a) && !roadish(b)) { g.fillStyle = gc; g.fillRect(px + cx, py + cy, 2, 2); } };
        cr(U, L, 0, 0); cr(U, R, 14, 0); cr(D, L, 0, 14); cr(D, R, 14, 14);
        tint(px, py);
      }
    } else if (ch === 'T' || ch === '^') {
      g.fillStyle = 'rgba(0,30,0,0.22)'; g.beginPath(); g.ellipse(px + 8, py + 14, 6, 2, 0, 0, 7); g.fill();
      if (ch === 'T' && TH.dead && DECO.deadtree) g.drawImage(DECO.deadtree, px - 2, py - 5, 20, 20);
      else g.drawImage(ch === 'T' ? TILE.forest : TILE.mountain, px, py);
      if (TH.tint) { g.fillStyle = TH.tint; g.fillRect(px, py, 16, 16); }
    } else if (ch === '#') {
      g.fillStyle = 'rgba(40,30,60,0.2)'; g.fillRect(px, py, 16, 16);
      if (((x + y) & 1) === 0) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(px, py, 16, 16); }
    } else if (ch === 'R') {
      const c = DECO[hash2(x, y, 4) < 0.5 ? 'ruin_a' : 'ruin_b']; g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(px + 8, py + 14, 7, 2.5, 0, 0, 7); g.fill(); g.drawImage(c, px + Math.floor((16 - c.width) / 2), py + 16 - c.height);
      if (hash2(x, y, 6) < 0.6) drawFlat(g, 'moss', px, py, x + 31, y);
    } else if (ch === 'P') {
      const k = props[x + ',' + y]; g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(px + 8, py + 14, 7, 2.5, 0, 0, 7); g.fill();
      if (k === 'torch') { g.fillStyle = '#4a2c18'; g.fillRect(px + 7, py + 5, 2, 10); g.fillStyle = '#7a7a86'; g.fillRect(px + 5, py + 4, 6, 2); fx.push({ k: 'flame', x: px + 8, y: py + 3 }); }
      else if (k === 'campfire') { g.fillStyle = '#3a2a1a'; g.fillRect(px + 3, py + 12, 10, 2); g.fillStyle = '#6a4a2a'; g.fillRect(px + 4, py + 11, 8, 2); g.fillStyle = '#8a8a90'; for (let i = 0; i < 6; i++) g.fillRect(px + 2 + i * 2, py + 14, 2, 1); fx.push({ k: 'flame', x: px + 8, y: py + 10, big: 1 }); }
      else { const c = propSprite(k, x, y); if (c) g.drawImage(c, px + Math.floor((16 - c.width) / 2), py + 16 - c.height); }
    }
  }
  // multi-tile blocks: houses (H) and tents (A) are drawn once per connected block, bottom-aligned
  for (const kind of ['H', 'A']) for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) {
    if (rows[y][x] !== kind || at(x - 1, y) === kind || at(x, y - 1) === kind) continue;
    let w = 1, h = 1; while (at(x + w, y) === kind) w++; while (at(x, y + h) === kind) h++;
    const sp = kind === 'H' ? DECO['house_' + 'abcd'[(x * 7 + y * 3) % 4]] : (w * h > 1 ? DECO.hut : DECO.tent_s);
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(ox + (x + w / 2) * 16, oy + (y + h) * 16 - 2, w * 8 - 1, 3, 0, 0, 7); g.fill();
    g.drawImage(sp, Math.round(ox + x * 16 + (w * 16 - sp.width) / 2), oy + (y + h) * 16 - sp.height);
    if (kind === 'H') fx.push({ k: 'smoke', x: ox + (x + w) * 16 - 14, y: oy + (y + h) * 16 - sp.height + 6 });
    if (TH.tint) { g.fillStyle = TH.tint; g.fillRect(ox + x * 16, oy + (y + h) * 16 - sp.height, w * 16, sp.height); }
  }
  // castles: each connected '#' block gets one big sprite centred on it, bottom-aligned (gate at the bottom centre)
  for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) {
    if (rows[y][x] !== '#' || at(x - 1, y) === '#' || at(x, y - 1) === '#') continue;
    let w = 1, h = 1; while (at(x + w, y) === '#') w++; while (at(x, y + h) === '#') h++;
    if (w >= 3) for (const cx of [x, x + w - 1]) for (let yy = y; yy < y + h; yy++) {
      const wx = ox + cx * 16, wy = oy + yy * 16; g.fillStyle = '#7b7284'; g.fillRect(wx, wy, 16, 16);
      g.fillStyle = '#5a5266'; for (let r = 4; r < 16; r += 5) g.fillRect(wx, wy + r, 16, 1); for (let r = 0; r < 3; r++) for (let c = (r & 1) * 4 + 3; c < 16; c += 8) g.fillRect(wx + c, wy + r * 5, 1, 4);
      g.fillStyle = '#a49cb4'; g.fillRect(wx, wy, 16, 1);
      if (yy === y) { g.fillStyle = '#2a2236'; g.fillRect(wx, wy, 16, 1); g.fillStyle = '#9d95ad'; for (let c = 0; c < 16; c += 6) g.fillRect(wx + c, wy, 3, 3); }
    }
    g.strokeStyle = '#2a2236'; g.lineWidth = 1; g.strokeRect(ox + x * 16 + 0.5, oy + y * 16 + 0.5, w * 16 - 1, h * 16 - 1);
    const sp = TILE.fortSprite; g.drawImage(sp, Math.round(ox + x * 16 + (w * 16 - sp.width) / 2), oy + (y + h) * 16 - sp.height);
    if (TH.dead) { fx.push({ k: 'smoke', x: ox + (x + w / 2) * 16 - 6, y: oy + (y + h) * 16 - sp.height + 4, dark: 1 }); fx.push({ k: 'smoke', x: ox + (x + w / 2) * 16 + 7, y: oy + (y + h) * 16 - sp.height + 6, dark: 1, ph: 0.5 }); }
  }
  // ambient: flames, glow and smoke (animated)
  const tt = (t || 0);
  for (const f of fx) {
    if (f.k === 'flame') {
      const fl = Math.sin(tt / 3 + f.x) * 0.5 + 0.5, s2 = f.big ? 1.4 : 1;
      const gr = g.createRadialGradient(f.x, f.y, 1, f.x, f.y, 16 * s2); gr.addColorStop(0, 'rgba(255,170,60,' + (0.35 + fl * 0.12) + ')'); gr.addColorStop(1, 'rgba(255,120,20,0)'); g.fillStyle = gr; g.fillRect(f.x - 18, f.y - 18, 36, 36);
      g.fillStyle = '#e8501a'; g.fillRect(f.x - 2 * s2, f.y - 3 * s2, 4 * s2, 4 * s2); g.fillStyle = '#ffb030'; g.fillRect(f.x - 1 * s2, f.y - (4 + fl * 2) * s2, 2 * s2, 5 * s2); g.fillStyle = '#fff0a0'; g.fillRect(f.x, f.y - 2 * s2, 1, 2);
      fx.push({ k: 'smoke', x: f.x, y: f.y - 6, small: 1, dark: 0, _gen: 1 }); f.k = 'done';
    }
  }
  for (const f of fx) if (f.k === 'smoke') for (let i = 0; i < 4; i++) {
    const ph = ((tt / (f.small ? 70 : 90)) + i / 4 + (f.ph || 0)) % 1, sx = f.x + Math.sin(ph * 6 + i) * 3 + ph * 4, sy = f.y - ph * (f.small ? 14 : 22), r = (f.small ? 1.5 : 2.2) + ph * 3;
    g.fillStyle = f.dark ? 'rgba(40,36,40,' + (0.5 * (1 - ph)) + ')' : 'rgba(235,235,240,' + (0.42 * (1 - ph)) + ')'; g.beginPath(); g.arc(sx, sy, r, 0, 7); g.fill();
  }
}
// off-grid surroundings: ridge along the top, forest on the sides; dimmed so it reads as out of bounds
function drawBackdrop(g, ox, oy, w, h, themeName, t) {
  const TH = THEMES[themeName || 'bright'], c0 = -Math.ceil(ox / 16), c1 = w + Math.ceil((W - ox - w * 16) / 16), r0 = -Math.ceil(oy / 16), r1 = h + Math.ceil((H - oy - h * 16) / 16);
  for (let cy = r0; cy < r1; cy++) for (let cx = c0; cx < c1; cx++) {
    if (cx >= 0 && cy >= 0 && cx < w && cy < h) continue;
    const px = ox + cx * 16, py = oy + cy * 16, k = hash2(cx + 100, cy + 100, 3);
    g.drawImage(TILE.grass[(cx * 3 + cy * 5 + 40) & 3], px, py);
    if (cy < 0 && k < 0.8) { g.fillStyle = 'rgba(0,30,0,0.22)'; g.fillRect(px, py + 13, 16, 3); g.drawImage(TILE.mountain, px, py); }
    else if (k < 0.62) { if (TH.dead && DECO.deadtree) g.drawImage(DECO.deadtree, px - 2, py - 5, 20, 20); else g.drawImage(TILE.forest, px, py); }
    else if (k < 0.8) drawFlat(g, TH.flat[0], px, py, cx + 7, cy + 9);
    if (TH.tint) { g.fillStyle = TH.tint; g.fillRect(px, py, 16, 16); }
  }
  g.fillStyle = 'rgba(8,10,30,0.42)';
  g.fillRect(0, 0, W, Math.max(0, oy)); g.fillRect(0, oy + h * 16, W, Math.max(0, H - oy - h * 16)); g.fillRect(0, oy, Math.max(0, ox), h * 16); g.fillRect(ox + w * 16, oy, Math.max(0, W - ox - w * 16), h * 16);
  g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1; g.strokeRect(ox - 0.5, oy - 0.5, w * 16 + 1, h * 16 + 1);
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

