'use strict';
// ===================== ENGINE =====================
const SW = 256, SH = 224;
// crisp integer render scale: 3x normally, 4x on big desktop windows (the canvas is then shown up to 1024px wide)
const SCALE = (window.matchMedia && matchMedia('(pointer: fine)').matches && Math.min(innerWidth, innerHeight * SW / SH) >= 900) ? 4 : 3;
const cv = document.getElementById('screen');
cv.width = SW * SCALE; cv.height = SH * SCALE;
const MAIN = cv.getContext('2d');
let ctx = MAIN;
const FONT = '"Zen Kaku Gothic New","Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif';
const FONT_T = '"Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif';
function resetT() { ctx = MAIN; ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
resetT();

// ---- seeded RNG ----
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let rnd = Math.random; // swappable for tests
function setSeed(s) { rnd = mulberry(s); }
function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

// ---- UI palette ----
const UI = { ink: '#f4eefc', gold: '#f6c8e8', goldDeep: '#c890c8', label: '#a8b8f0', muted: '#b0a8c4', dim: '#6a6280', hp: '#8fe3a0', mp: '#8cc8ff', red: '#ff7a8a', warn: '#ffd27a' };

// ---- text ----
function text(s, x, y, col = UI.ink, size = 8, align = 'left', face) {
  const f = face === 't' ? `700 ${size}px ${FONT_T}` : `500 ${size}px ${FONT}`;
  if (ctx.font !== f) ctx.font = f;
  ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillText(s, x + 0.5, y + 0.6);
  ctx.fillStyle = col; ctx.fillText(s, x, y);
}
function textW(s, size = 8, face) { ctx.font = face === 't' ? `700 ${size}px ${FONT_T}` : `500 ${size}px ${FONT}`; return ctx.measureText(s).width; }

// ---- modern window: translucent navy glass with a thin gold frame ----
function win(x, y, w, h, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; roundRect(x + 1.2, y + 2, w - 1.6, h - 1.6, 3); ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(38,30,66,.9)'); g.addColorStop(1, 'rgba(14,10,30,.93)');
  ctx.fillStyle = g; roundRect(x + 1, y + 1, w - 2, h - 2, 3); ctx.fill();
  const sh = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 24)); sh.addColorStop(0, 'rgba(255,255,255,.07)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sh; roundRect(x + 1.5, y + 1.5, w - 3, Math.min(h - 3, 22), 2.5); ctx.fill();
  ctx.lineWidth = 0.6; ctx.strokeStyle = 'rgba(214,170,230,.85)'; roundRect(x + 1.6, y + 1.6, w - 3.2, h - 3.2, 2.4); ctx.stroke();
  ctx.lineWidth = 0.34; ctx.strokeStyle = 'rgba(255,240,200,.18)'; roundRect(x + 2.6, y + 2.6, w - 5.2, h - 5.2, 1.8); ctx.stroke();
  ctx.fillStyle = '#f2c8ec';
  for (const [cx, cy] of [[x + 1.6, y + 1.6], [x + w - 1.6, y + 1.6], [x + 1.6, y + h - 1.6], [x + w - 1.6, y + h - 1.6]]) { ctx.beginPath(); ctx.moveTo(cx, cy - 1.6); ctx.lineTo(cx + 1.6, cy); ctx.lineTo(cx, cy + 1.6); ctx.lineTo(cx - 1.6, cy); ctx.fill(); }
  ctx.restore();
}
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
// glowing gold pointer
function cursor(x, y) {
  const b = Math.sin(G.frame / 7) * 0.8; x += b;
  ctx.save();
  const gl = ctx.createRadialGradient(x + 3, y + 4, 0, x + 3, y + 4, 7); gl.addColorStop(0, 'rgba(255,190,240,.45)'); gl.addColorStop(1, 'rgba(255,190,240,0)');
  ctx.fillStyle = gl; ctx.fillRect(x - 5, y - 4, 16, 16);
  const g = ctx.createLinearGradient(x, y, x, y + 8); g.addColorStop(0, '#fff0fb'); g.addColorStop(1, '#d48ad0');
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.beginPath(); ctx.moveTo(x + 1.5, y + 1.5); ctx.lineTo(x + 8, y + 4.8); ctx.lineTo(x + 1.5, y + 8.1); ctx.fill();
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + 1, y + 1); ctx.lineTo(x + 7.4, y + 4.3); ctx.lineTo(x + 1, y + 7.6); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function bar(x, y, w, h, ratio, col, bg = 'rgba(255,255,255,.08)') {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.5)'; roundRect(x - 0.4, y - 0.4, w + 0.8, h + 0.8, h / 2 + 0.4); ctx.fill();
  ctx.fillStyle = bg; roundRect(x, y, w, h, h / 2); ctx.fill();
  const fw = Math.max(0, Math.min(1, ratio)) * w;
  if (fw > 0.3) { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, col); g.addColorStop(1, col); ctx.globalAlpha = 0.95; ctx.fillStyle = g; roundRect(x, y, Math.max(fw, h), h, h / 2); ctx.fill(); }
  ctx.restore();
}


// ---- input ----
const KEYMAP = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
  z: 'a', Z: 'a', Enter: 'a', ' ': 'a', x: 'b', X: 'b', Backspace: 'b',
  c: 'menu', C: 'menu', Escape: 'menu', m: 'menu', M: 'menu'
};
const Input = {
  down: {}, prev: {}, held: {}, pressed: {},
  set(k, v) { this.down[k] = v; },
  update() {
    for (const k of ['up', 'down', 'left', 'right', 'a', 'b', 'menu']) {
      const d = !!this.down[k];
      this.pressed[k] = d && !this.prev[k];
      this.held[k] = d ? (this.held[k] || 0) + 1 : 0;
      this.prev[k] = d;
    }
  },
  // menu-style repeat
  rep(k) { const h = this.held[k]; return h === 1 || (h > 18 && h % 5 === 0); },
  dir() { for (const k of ['up', 'down', 'left', 'right']) if (this.down[k]) return k; return null; },
  // 8-way direction from the held keys: [dx, dy] or null
  vec() { const dx = (this.down.right ? 1 : 0) - (this.down.left ? 1 : 0), dy = (this.down.down ? 1 : 0) - (this.down.up ? 1 : 0); return dx || dy ? [dx, dy] : null; },
  clear() { for (const k in this.down) this.down[k] = false; },
};
// diagonal keys press two directions at once (numpad 7/9/1/3 or Home/PgUp/End/PgDn; numpad 8/2/4/6 also move)
const DIAG = { Home: ['up', 'left'], PageUp: ['up', 'right'], End: ['down', 'left'], PageDown: ['down', 'right'] };
const NUMPAD = { Numpad7: ['up', 'left'], Numpad9: ['up', 'right'], Numpad1: ['down', 'left'], Numpad3: ['down', 'right'], Numpad8: ['up'], Numpad2: ['down'], Numpad4: ['left'], Numpad6: ['right'], Numpad5: ['b'] };
const keysOf = e => NUMPAD[e.code] || DIAG[e.key] || (KEYMAP[e.key] ? [KEYMAP[e.key]] : null);
addEventListener('keydown', e => { const k = keysOf(e); if (k) { for (const x of k) Input.set(x, true); e.preventDefault(); Audio8.unlock(); } });
addEventListener('keyup', e => { const k = keysOf(e); if (k) { for (const x of k) Input.set(x, false); e.preventDefault(); } });
addEventListener('blur', () => Input.clear());

function bindBtn(id, key) {
  const el = document.getElementById(id); if (!el) return;
  // a very quick tap still counts: the button stays down for at least 60ms so the 60fps loop sees it
  let t0 = 0, timer = null;
  const on = e => { e.preventDefault(); clearTimeout(timer); t0 = performance.now(); Input.set(key, true); el.classList.add('on'); Audio8.unlock(); };
  const off = e => { e.preventDefault(); if (!el.classList.contains('on')) return; const rest = 60 - (performance.now() - t0); const up = () => { Input.set(key, false); el.classList.remove('on'); }; if (rest > 0) timer = setTimeout(up, rest); else up(); };
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
  el.addEventListener('contextmenu', e => e.preventDefault());
}
bindBtn('btnA', 'a'); bindBtn('btnB', 'b'); bindBtn('menuBtn', 'menu');
(function dpad() {
  const el = document.getElementById('dpad'); if (!el) return;
  const arrows = { up: el.querySelector('.u'), down: el.querySelector('.d'), left: el.querySelector('.l'), right: el.querySelector('.r') };
  let pid = null;
  const setDir = d => { for (const k in arrows) { const on = !!d && d.includes(k); Input.set(k, on); arrows[k].classList.toggle('on', on); } };
  const calc = e => {
    const r = el.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < 10) return setDir(null);
    setDir(dir8(dx, dy));
  };
  el.addEventListener('pointerdown', e => { e.preventDefault(); pid = e.pointerId; el.setPointerCapture(pid); calc(e); Audio8.unlock(); });
  el.addEventListener('pointermove', e => { if (e.pointerId === pid) calc(e); });
  const end = e => { if (e.pointerId === pid) { pid = null; setDir(null); } };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
})();

// 8 sectors of 45 degrees -> the keys to hold, e.g. ['up', 'left']
function dir8(dx, dy) {
  const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)); // 0 = right, 2 = down, -2 = up, 4/-4 = left
  return [['right'], ['down', 'right'], ['down'], ['down', 'left'], ['left'], ['up', 'left'], ['up'], ['up', 'right']][(a + 8) % 8];
}
Input.tapA = function () { Input.set('a', true); setTimeout(() => Input.set('a', false), 80); };
// ---- tap targets: windows register the rows a finger can touch directly (logical 256x224 coordinates), cleared every frame ----
const Touch = {
  rects: [],
  add(x, y, w, h, fn) { this.rects.push({ x, y, w, h, fn }); },
  hit(px, py) { for (let i = this.rects.length - 1; i >= 0; i--) { const r = this.rects[i]; if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) { r.fn(); return true; } } return false; },
};
// ---- swipe on the game screen: a floating joystick wherever the finger lands; a quick tap is the A button ----
const Swipe = { id: null, ox: 0, oy: 0, x: 0, y: 0, t0: 0, moved: false, dir: null };
(function swipe() {
  const setDir = d => { const key = d ? d.join() : null; if (Swipe.dir === key) return; for (const k of ['up', 'down', 'left', 'right']) Input.set(k, !!d && d.includes(k)); Swipe.dir = key; };
  const at = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * SW / r.width, (e.clientY - r.top) * SH / r.height]; };
  cv.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || Swipe.id !== null) return; e.preventDefault(); Audio8.unlock();
    Swipe.id = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch (_) { }
    [Swipe.ox, Swipe.oy] = at(e); Swipe.x = Swipe.ox; Swipe.y = Swipe.oy; Swipe.t0 = performance.now(); Swipe.moved = false;
  });
  // in menus a swipe moves the cursor one step per 12px of drag instead of running away while the finger is down
  const menuMode = () => typeof inMenu === 'function' ? inMenu() : true;
  const pulse = d => { Input.set(d, true); setTimeout(() => Input.set(d, false), 50); };
  cv.addEventListener('pointermove', e => {
    if (e.pointerId !== Swipe.id) return; e.preventDefault();
    const [x, y] = at(e); Swipe.x = x; Swipe.y = y; const dx = x - Swipe.ox, dy = y - Swipe.oy, d = Math.hypot(dx, dy);
    if (menuMode()) {
      if (d > 6) Swipe.moved = true;
      if (Math.max(Math.abs(dx), Math.abs(dy)) >= 12) { const k = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); Swipe.ox += k === 'right' ? 12 : k === 'left' ? -12 : 0; Swipe.oy += k === 'down' ? 12 : k === 'up' ? -12 : 0; pulse(k); }
      return;
    }
    if (d > 6) Swipe.moved = true;
    if (d > 24) { Swipe.ox = x - dx / d * 24; Swipe.oy = y - dy / d * 24; } // the anchor follows the finger, so turning is easy
    setDir(d < 6 ? null : dir8(dx, dy));
  });
  const end = e => {
    if (e.pointerId !== Swipe.id) return; Swipe.id = null; setDir(null);
    if (!Swipe.moved && performance.now() - Swipe.t0 < 300) { const [x, y] = at(e); if (!Touch.hit(x, y)) Input.tapA(); }
  };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
})();
function drawSwipe() {
  if (Swipe.id === null || !Swipe.moved) return;
  const dx = Swipe.x - Swipe.ox, dy = Swipe.y - Swipe.oy, d = Math.hypot(dx, dy), k = d > 14 ? 14 / d : 1;
  ctx.save(); ctx.globalAlpha = 0.45; ctx.strokeStyle = '#f2c8ec'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(Swipe.ox, Swipe.oy, 16, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.6; ctx.fillStyle = '#f2c8ec'; ctx.beginPath(); ctx.arc(Swipe.ox + dx * k, Swipe.oy + dy * k, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
const TOUCH = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);

// ---- layout fit ----
// landscape phones: the screen takes the full height and the buttons sit in the side margins
const LANDSCAPE = window.matchMedia ? matchMedia('(orientation: landscape) and (pointer: coarse) and (max-height: 600px)') : { matches: false };
function fit() {
  const pad = document.getElementById('pad'), keys = document.getElementById('keys'), bar = document.getElementById('bar');
  const app = document.getElementById('app');
  const land = LANDSCAPE.matches;
  document.body.classList.toggle('land', land);
  let availW, availH;
  if (land) { availW = app.clientWidth - 2 * 112; availH = app.clientHeight - 4; }
  else {
    const extra = (pad && pad.offsetHeight) + (keys && keys.offsetHeight) + (bar && bar.offsetHeight) + 30;
    availW = app.clientWidth - 12; availH = app.clientHeight - extra;
  }
  let w = Math.min(availW, availH * SW / SH, SW * SCALE);
  w = Math.max(200, w);
  cv.style.width = Math.floor(w) + 'px'; cv.style.height = Math.floor(w * SH / SW) + 'px';
  // upscaling stays crisp; downscaling (phones) uses the browser's smooth filter instead of dropping pixels
  cv.style.imageRendering = w >= SW * SCALE ? 'pixelated' : 'auto';
}
addEventListener('resize', fit);


// ---- offscreen sprite helper ----
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
// pixelize: threshold alpha and add dark outline — gives crisp pixel-art look to procedurally drawn shapes
function pixelize(c, outline = '#140c1c') {
  const x = c.getContext('2d'); const w = c.width, h = c.height;
  const d = x.getImageData(0, 0, w, h); const p = d.data;
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { if (p[i * 4 + 3] >= 110) { p[i * 4 + 3] = 255; solid[i] = 1; } else p[i * 4 + 3] = 0; }
  if (outline) {
    const oc = hex(outline);
    for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
      const i = y * w + xx; if (solid[i]) continue;
      if ((xx > 0 && solid[i - 1]) || (xx < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) {
        p[i * 4] = oc[0]; p[i * 4 + 1] = oc[1]; p[i * 4 + 2] = oc[2]; p[i * 4 + 3] = 255;
      }
    }
  }
  x.putImageData(d, 0, 0); return c;
}
function hex(s) { s = s.replace('#', ''); if (s.length === 3) s = s.split('').map(c => c + c).join(''); return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]; }
// white silhouette for hit-flash
function silhouette(c, col = '#fff') {
  const s = mkCanvas(c.width, c.height), x = s.getContext('2d');
  x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, s.width, s.height); return s;
}

// ---- save storage (guarded) ----
const Store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
};
// d-pad on/off (default off: swipe the screen instead); remembered per device
(function () {
  const btn = document.getElementById('padToggle'); if (!btn) return;
  const apply = on => { document.body.classList.toggle('nodpad', !on); btn.textContent = on ? '十字キー ON' : '十字キー OFF'; try { Store.set('nemuri-dpad', on ? '1' : '0'); } catch (e) { } fit(); };
  let on = false; try { on = Store.get('nemuri-dpad') === '1'; } catch (e) { }
  btn.addEventListener('click', e => { on = !on; apply(on); e.currentTarget.blur(); });
  apply(on);
})();
