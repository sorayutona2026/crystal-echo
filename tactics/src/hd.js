'use strict';
// ===== hd: device-resolution overlay for the painted (ChatGPT) illustrations =====
// The game canvas is a 320x240 pixel-art buffer. Painted art must not go through it, so it is drawn on a second
// canvas (#cvh) laid exactly over the first, at the real device resolution. Pixel layers stay pixelated.
const ART = {};           // id -> { face: Image, full: Image }
const ART_OF_SPRITE = { hero_knight: 'leon', hero_archer: 'mira', hero_mage: 'luka', hero_healer: 'sophia', hero_thief: 'jin', enemy_boss: 'garud', enemy_darkmage: 'verza', enemy_goblin: 'goblin', enemy_skeleton: 'skeleton', enemy_slime: 'slime' };
const ART_FACING = { leon: 'right', mira: 'right', luka: 'right', sophia: 'right', jin: 'right', garud: 'left', verza: 'left', goblin: 'right', skeleton: 'left', slime: 'left' };
const ART_NAME = { leon: 'レオン', mira: 'ミラ', luka: 'ルカ', sophia: 'ソフィア', jin: 'ジン', garud: 'ガルド', verza: 'ヴェルザ', goblin: 'ゴブリン', skeleton: 'スケルトン', slime: 'スライム' };
const HD = { cv: null, x: null, k: 1, holes: [], ui: [], cache: {}, collect: false };
function artOf(x) { const s = typeof x === 'string' ? x : x.sprite; return ART_OF_SPRITE[s] || s; }
const BGL = { cv: null, x: null, cache: {} };   // #cvb: painted backgrounds / battlefield, below the pixel layer
function initHD() { HD.cv = document.getElementById('cvh'); HD.x = HD.cv.getContext('2d'); BGL.cv = document.getElementById('cvb'); BGL.x = BGL.cv.getContext('2d'); }
function syncHD() { // match the position/size of the game canvas, at device resolution
  if (!HD.cv || !cv) return; const dpr = Math.min(window.devicePixelRatio || 1, 3), r = cv.getBoundingClientRect(), pr = appEl.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    for (const c of [HD.cv, BGL.cv]) { if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } c.style.left = (r.left - pr.left) + 'px'; c.style.top = (r.top - pr.top) + 'px'; c.style.width = r.width + 'px'; c.style.height = r.height + 'px'; }
  HD.k = w / W;
}
// scaled copies (halving steps avoid aliasing); variants: null | 'gray' | 'white'
function hdScaled(id, kind, w, h, variant) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h)); const key = id + kind + w + 'x' + h + (variant || ''); if (HD.cache[key]) return HD.cache[key];
  const src = ART[id] && ART[id][kind]; if (!src) return null; let c = src, cw = src.width, ch = src.height;
  while (cw > w * 2 || ch > h * 2) { cw = Math.max(w, Math.ceil(cw / 2)); ch = Math.max(h, Math.ceil(ch / 2)); const t = cvs(cw, ch), g = t.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, cw, ch); c = t; }
  const out = cvs(w, h), g = out.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, w, h);
  if (variant) {
    const d = g.getImageData(0, 0, w, h), p = d.data;
    for (let i = 0; i < p.length; i += 4) { if (!p[i + 3]) continue; if (variant === 'gray') { const l = (p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11) * 0.55 + 30; p[i] = p[i + 1] = p[i + 2] = l; } else { p[i] = p[i + 1] = p[i + 2] = 255; } }
    g.putImageData(d, 0, 0);
  }
  return HD.cache[key] = out;
}
// full-body figure: centre x, bottom y, height h (all in the units of the current transform; ppu = device px per unit)
function artFull(g, id, cx, bottom, h, ppu, o) {
  o = o || {}; const im = ART[id] && ART[id].full; if (!im) return 0; const w = h * im.width / im.height;
  const c = hdScaled(id, 'full', w * ppu, h * ppu, o.variant); if (!c) return 0;
  g.save(); if (o.alpha != null) g.globalAlpha = o.alpha; g.translate(cx, bottom); if (o.flip) g.scale(-1, 1); g.imageSmoothingEnabled = true; g.drawImage(c, -w / 2, -h, w, h); g.restore(); return w;
}
function artFace(g, id, x, y, size, ppu, o) {
  o = o || {}; const c = hdScaled(id, 'face', size * ppu, size * ppu, o.variant); if (!c) return;
  g.save(); if (o.alpha != null) g.globalAlpha = o.alpha; g.imageSmoothingEnabled = true; g.drawImage(c, x, y, size, size); g.restore();
}
function hdUI(fn) { HD.ui.push(fn); }
// a framed portrait (drawn on the overlay; fills the pixel-art frame behind it)
function drawPortrait(spriteOrId, x, y, size, team) {
  const id = artOf(spriteOrId);
  if (G.infoPass) { // portrait phone panel: drawn straight into its own canvas
    const im = ART[id] && ART[id].face; if (im) { ctx.imageSmoothingEnabled = true; ctx.drawImage(im, x, y, size, size); ctx.imageSmoothingEnabled = false; }
    ctx.strokeStyle = team === 1 ? '#ff6a6a' : '#6aa0ff'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1); return;
  }
  hdUI(g => {
    artFace(g, id, x, y, size, HD.k);
    g.lineWidth = 1; g.strokeStyle = '#05061a'; g.strokeRect(x - 0.5, y - 0.5, size + 1, size + 1);
    g.strokeStyle = team === 1 ? '#ff7a7a' : (team === 0 ? '#7fb0ff' : '#d8dfff'); g.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.strokeRect(x + 1.5, y + 1.5, size - 3, size - 3);
  });
}

// ---- painted backgrounds (cover-fit, darkened, vignette) and the painted ch1 battlefield, drawn on #cvb ----
const BGI = {};   // name -> Image  (assets/gpt/bg_<name>.webp)
function bgCover(name, dim, w, h) {
  const key = name + '|' + dim + '|' + w + 'x' + h; if (BGL.cache[key]) return BGL.cache[key];
  const im = BGI[name]; if (!im) return null; const c = cvs(w, h), g = c.getContext('2d');
  const sc = Math.max(w / im.width, h / im.height) * 1.03, dw = im.width * sc, dh = im.height * sc;
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
  g.fillStyle = 'rgba(6,8,30,' + dim + ')'; g.fillRect(0, 0, w, h);
  const gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.55); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.62)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const bg = g.createLinearGradient(0, h * 0.55, 0, h); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, 'rgba(0,0,10,0.35)'); g.fillStyle = bg; g.fillRect(0, h * 0.55, w, h * 0.45);
  const keys = Object.keys(BGL.cache); if (keys.length > 12) delete BGL.cache[keys[0]];
  return BGL.cache[key] = c;
}
function useBg(name, dim) { G.bgReq = { name, dim: dim == null ? 0.4 : dim }; }
function bgRender() {
  const g = BGL.x; if (!g || !BGL.cv.width) return; const w = BGL.cv.width, h = BGL.cv.height;
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#06070f'; g.fillRect(0, 0, w, h);
  if (G.bgReq) { const c = bgCover(G.bgReq.name, G.bgReq.dim, w, h); if (c) g.drawImage(c, 0, 0); }
  if (G.paintReq && G.S && G.S.ch.paint) {
    const im = A.img['gpt/' + G.S.ch.paint + '.webp']; if (!im) return; const k = HD.k, z = camOn() ? Engine.zoom : 1;
    g.setTransform(k * z, 0, 0, k * z, (-Cam.x + (G.shx || 0) / z) * k * z, (-Cam.y + (G.shy || 0) / z) * k * z); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(im, OX(), OY(), G.S.w * TS, G.S.h * TS);
    if (!camOn()) { g.setTransform(1, 0, 0, 1, 0, 0); }
  }
}
