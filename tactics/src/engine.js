'use strict';
// ===== engine: canvas scaling, input, rng =====
const W = 320, H = 240, TS = 16, INFO_H = 136;
let _seed = 1;
function seedRng(n) { _seed = (n >>> 0) || 1; }
function rnd() { // mulberry32 (game logic randomness; visuals use Math.random)
  _seed = (_seed + 0x6D2B79F5) >>> 0; let t = _seed;
  t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const FONT = '"Hiragino Kaku Gothic ProN","Noto Sans JP","Meiryo","IPAGothic","WenQuanYi Zen Hei",sans-serif';
let cv, cv2, ctx, K = 3, appEl;
function initCanvas() {
  appEl = document.getElementById('tac'); cv = document.getElementById('cv'); cv2 = document.getElementById('cv2'); ctx = cv.getContext('2d');
  window.addEventListener('resize', fit); fit();
}
function fit() {
  const w = window.innerWidth, h = window.innerHeight;
  const port = h > w * 1.05; let padsOff = false;
  let s;
  Engine.zoom = 1; Engine.vh = H;
  if (port) {
    s = Math.min(w / W, (h - 64) / (H + INFO_H)); if (s >= 2) s = Math.floor(s);
    if (Engine.tall) { // battle on a portrait phone: bigger map (zoom 2) with a camera, filling the height above the panels
      let s2 = w / W; if (s2 >= 2) s2 = Math.floor(s2);
      const vh = Math.floor((h - 76 - INFO_H * s2) / s2);
      if (vh >= H) { s = s2; Engine.vh = Math.min(vh, 600); Engine.zoom = 2; }
    }
  }
  else {
    let s0 = Math.min(w / W, h / H); if (s0 >= 2) s0 = Math.floor(s0);
    const mouse = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
    if ((w - W * s0) / 2 >= 84) s = s0; // side gutters are wide enough for the buttons
    else if (mouse) { s = s0; padsOff = true; } // desktop: keyboard/mouse, buttons hidden
    else { s = Math.min((w - 170) / W, h / H); if (s >= 2) s = Math.floor(s); }
  }
  s = Math.max(s, 0.5);
  appEl.className = (port ? 'port' : 'land') + (padsOff ? ' nopads' : '');
  K = Math.max(1, Math.min(6, Math.ceil(s)));
  cv.width = W * K; cv.height = Engine.vh * K;
  cv2.width = W * K; cv2.height = INFO_H * K; cv2.style.width = Math.round(W * s) + 'px'; cv2.style.height = Math.round(INFO_H * s) + 'px'; Engine.port = port;
  cv.style.width = Math.round(W * s) + 'px'; cv.style.height = Math.round(Engine.vh * s) + 'px';
  cv.style.imageRendering = cv2.style.imageRendering = (s === Math.floor(s)) ? 'pixelated' : 'auto';
  Engine.scale = s;
}
const Engine = { scale: 1, zoom: 1, vh: 240, tall: false, port: false };
// ----- input -----
const Input = { q: [], taps: [], pans: [] };
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', z: 'ok', Z: 'ok', Enter: 'ok', ' ': 'ok', x: 'cancel', X: 'cancel', Escape: 'cancel', Backspace: 'cancel', a: 'info', A: 'info', e: 'end', E: 'end', m: 'mute', M: 'mute' };
function initInput() {
  window.addEventListener('contextmenu', e => { if (e.target === cv) { e.preventDefault(); Input.q.push('cancel'); } });
  window.addEventListener('keydown', e => {
    const a = KEYMAP[e.key]; if (!a) return;
    e.preventDefault(); if (Aud) Aud.unlock(); Input.q.push(a); if (Input.q.length > 40) Input.q.shift();
  });
  // tap = pointer up without a drag; dragging pans the camera (portrait zoom)
  let ptr = null; const lp = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * Engine.vh, r }; };
  cv.addEventListener('pointerdown', e => { e.preventDefault(); if (Aud) Aud.unlock(); ptr = { cx: e.clientX, cy: e.clientY, lx: e.clientX, ly: e.clientY, drag: false }; try { cv.setPointerCapture(e.pointerId); } catch (x) { } });
  cv.addEventListener('pointermove', e => {
    if (!ptr) return; if (!ptr.drag && Math.hypot(e.clientX - ptr.cx, e.clientY - ptr.cy) > 9) ptr.drag = true;
    if (ptr.drag) { const r = cv.getBoundingClientRect(); if (Engine.zoom > 1) Input.pans.push({ dx: (e.clientX - ptr.lx) / r.width * W, dy: (e.clientY - ptr.ly) / r.height * Engine.vh }); ptr.lx = e.clientX; ptr.ly = e.clientY; }
  });
  cv.addEventListener('pointerup', e => { if (ptr && !ptr.drag) { const p = lp(e); Input.taps.push({ x: p.x, y: p.y }); } ptr = null; });
  cv2.addEventListener('pointerdown', e => { e.preventDefault(); if (Aud) Aud.unlock(); const r = cv2.getBoundingClientRect(); if (window.minimapTap) window.minimapTap((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * INFO_H); });
  cv.addEventListener('pointercancel', () => { ptr = null; });
  const b = (id, a) => document.getElementById(id).addEventListener('click', () => { if (Aud) Aud.unlock(); Input.q.push(a); });
  b('bCancel', 'cancel'); b('bEnd', 'end'); b('bInfo', 'info'); b('bMute', 'mute');
}
// tap targets registered by draw code each frame (logical coords)
const Touch = { rects: [], next: [] };
Touch.add = (x, y, w, h, fn) => Touch.next.push({ x, y, w, h, fn });
Touch.hit = (px, py) => { for (let i = Touch.rects.length - 1; i >= 0; i--) { const r = Touch.rects[i]; if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return r; } return null; };
Touch.flip = () => { Touch.rects = Touch.next; Touch.next = []; };
// ----- generator scheduler -----
const Co = { list: [] };
Co.run = (gen) => { const c = { gen, wait: 0, done: false }; Co.list.push(c); return c; };
Co.tick = () => {
  for (const c of Co.list.slice()) {
    if (c.done) continue;
    if (c.wait > 0) { c.wait--; continue; }
    let r;
    try { r = c.gen.next(); } catch (e) { c.done = true; console.error(e); throw e; }
    if (r.done) c.done = true; else c.wait = (typeof r.value === 'number' ? r.value : 1) - 1;
  }
  Co.list = Co.list.filter(c => !c.done);
};
// ----- drawing helpers -----
function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
function text(s, x, y, o) {
  o = o || {}; const sz = o.size || 9;
  ctx.font = (o.bold ? 'bold ' : '') + sz + 'px ' + FONT;
  ctx.textBaseline = 'top'; ctx.textAlign = o.align || 'left';
  if (o.shadow !== false) { ctx.fillStyle = o.sh || '#000'; ctx.fillText(s, x + 1, y + 1); }
  ctx.fillStyle = o.color || '#fff'; ctx.fillText(s, x, y);
}
function tw(s, size) { ctx.font = (size || 9) + 'px ' + FONT; return ctx.measureText(s).width; }
function panel(x, y, w, h, a) {
  ctx.fillStyle = 'rgba(8,10,40,' + (a == null ? 0.88 : a) + ')'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#c8d0ff'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.strokeStyle = '#4a58a8'; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
}
