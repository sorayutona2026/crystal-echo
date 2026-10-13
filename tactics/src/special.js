'use strict';
// ===== specials (必殺技): activation -> cut-in -> unique hi-DPI map effect -> impact; boss signature moves share the system =====
// Phases (steps = 1/60 s): full A24 + B52 + C~50, short (auto x1) A6 + B26, map-only (戦闘アニメ OFF), skip (auto x2) = a few frames of effect.
const SPX = {
  buff:     { col: '#ffd24a', col2: '#fff4b8', dark: '#3a2600', dimCol: '24,14,0', shout: '「みんな、俺に続け!」', eye: 0.33 },
  shot:     { col: '#7dffb4', col2: '#e6fff0', dark: '#052a18', dimCol: '0,8,16', shout: '「この一矢、受けてみな!」', eye: 0.36 },
  meteor:   { col: '#ff8a3a', col2: '#ffe0a0', dark: '#3a1000', dimCol: '34,4,8', shout: '「星よ、堕ちるがよい!」', eye: 0.34 },
  pray:     { col: '#ffe9a0', col2: '#c8ffd8', dark: '#3a3410', dimCol: '10,14,34', shout: '「どうか、みんなに祈りを…!」', eye: 0.36 },
  ambush:   { col: '#c85aff', col2: '#ff6a6a', dark: '#180628', dimCol: '0,0,6', shout: '「…影に溶けろ。」', eye: 0.36 },
  cleave:   { col: '#ffb830', col2: '#fff0b0', dark: '#3a2200', dimCol: '34,16,0', shout: '「我が角にて断つ!」', eye: 0.40 },
  starfall: { col: '#b46aff', col2: '#f0d8ff', dark: '#1c0838', dimCol: '24,4,44', shout: '「星よ、堕ちるがいい…!」', eye: 0.40 }
};
const clamp01 = v => Math.max(0, Math.min(1, v)), ELL = 0.56;
const spRn = (i, k, s) => Math.abs(Math.sin((i + 1) * 12.9898 + k * 78.233 + s * 43758.5453) * 43758.5453) % 1;
// ---------- SFX (WebAudio, orchestral-ish) ----------
Object.assign(Aud, {
  duck(on) { if (!this.ctx || !this.mIn) return; const g = this.mIn.gain, t = this.ctx.currentTime; try { g.cancelScheduledValues(t); g.setTargetAtTime(on ? 0.2 : 1, t, on ? 0.05 : 0.3); } catch (e) { } },
  sweep(t, d, vol, f0, f1, q, type) {
    const c = this.ctx; if (!this.nbuf) this.noise(t, 0.01, 0.0001, 1000);
    const s = c.createBufferSource(); s.buffer = this.nbuf; s.loop = true; const f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.Q.value = q || 2; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + d);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + d * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + d + 0.05);
  },
  bell(t, f, vol, d) { this.voice(this.master, t, d, vol, [['sine', f, 0, 1], ['sine', f * 2.76, 0, 0.3], ['sine', f * 5.4, 0, 0.12]], { a: 0.003, decay: d * 0.8, sus: 0.05, r: 0.3 }); },
  sp(n) {
    const c = this.ctx; if (!c || !this.on) return; const t = c.currentTime + 0.01, M = this.master;
    switch (n) {
      case 'charge': this.tone(110, t, 0.6, 'sawtooth', 0.09, 700); this.tone(220, t, 0.6, 'triangle', 0.1, 1400); this.sweep(t, 0.6, 0.22, 300, 6500, 1.2); [220, 277, 330, 440].forEach(f => this.strings(M, f, t, 0.7, 0.05, 2400)); break;
      case 'whoosh': this.sweep(t, 0.36, 0.5, 500, 5200, 1.4); this.tone(200, t, 0.3, 'sawtooth', 0.06, 60); break;
      case 'lock': this.tone(1760, t, 0.05, 'square', 0.08); this.tone(2349, t + 0.07, 0.07, 'square', 0.1); break;
      case 'gong': this.tone(65, t, 1.5, 'sine', 0.34, 44); [98, 196, 270, 402, 529].forEach((f, i) => this.bell(t, f, 0.12 / (1 + i * 0.4), 1.8)); this.noise(t, 0.5, 0.18, 200, M, 'lowpass'); this.strings(M, 262, t, 1.0, 0.05, 2400); this.strings(M, 392, t + 0.05, 1.0, 0.04, 2400); break;
      case 'pray': [1047, 1568, 2093, 2637].forEach((f, i) => this.bell(t + i * 0.12, f, 0.1, 1.6)); [262, 330, 392, 523].forEach(f => this.strings(M, f, t, 1.6, 0.05, 1800)); this.tone(523, t, 1.2, 'sine', 0.06); break;
      case 'meteorfall': this.sweep(t, 0.7, 0.3, 160, 2200, 0.8); this.tone(60, t, 0.7, 'sawtooth', 0.06, 240); this.strings(M, 110, t, 0.7, 0.05, 900); break;
      case 'boom': this.tone(95, t, 0.9, 'sine', 0.55, 32); this.tone(48, t + 0.04, 1.3, 'sine', 0.4, 26); this.noise(t, 0.9, 0.5, 300, M, 'lowpass'); this.noise(t, 0.12, 0.4, 2200); break;
      case 'twang': this.tone(1400, t, 0.14, 'triangle', 0.22, 260); this.tone(2200, t, 0.08, 'sine', 0.1, 900); this.noise(t, 0.05, 0.25, 5000); this.tone(330, t + 0.03, 0.5, 'triangle', 0.07, 300); break;
      case 'swish': this.sweep(t, 0.12, 0.5, 6500, 1500, 3); this.tone(900, t, 0.08, 'sawtooth', 0.05, 200); break;
      case 'clang': this.tone(70, t, 0.8, 'sine', 0.4, 40); [220, 330, 614].forEach((f, i) => this.bell(t, f, 0.12, 1.0)); this.noise(t, 0.3, 0.4, 1500); break;
      case 'vanish': this.sweep(t, 0.4, 0.3, 4000, 300, 1.5); this.tone(300, t, 0.3, 'sine', 0.07, 80); break;
    }
  }
});
// ---------- map-space effects (drawn by drawHdFx -> SPFX[type]; ctx is the hi-DPI layer in map units, composite 'lighter' by default) ----------
const SPFX = {
  charge(f, t, L, p) {
    const R = f.R || 34;
    for (let j = 0; j < 3; j++) { const q = clamp01((p - j * 0.1) / 0.75), r = R * (1 - ease(q)) + 3; ctx.strokeStyle = hexA(f.col, Math.sin(Math.PI * q) * 0.9); ctx.lineWidth = 1.7 - j * 0.35; ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * ELL, 0, 0, 7); ctx.stroke(); }
    for (let i = 0; i < 12; i++) { const th = i / 12 * 6.283 + f.seed[i % 14], q = clamp01(p * 1.15 - f.seed[(i + 3) % 14] * 0.25), r = R * 1.2 * (1 - ease(q)), a = Math.sin(Math.PI * q); glowDot(f.x + Math.cos(th) * r, f.y - 6 + Math.sin(th) * r * ELL - q * 12, 2.4 + 1.2 * a, f.col, 0.85 * a); }
    const e = ease(p); glowDot(f.x, f.y - 6, 6 + 15 * e, f.col, 0.3 + 0.45 * e);
    const g = ctx.createLinearGradient(0, f.y - 40 * e, 0, f.y); g.addColorStop(0, hexA(f.col, 0)); g.addColorStop(1, hexA(f.col, 0.5 * e)); ctx.fillStyle = g; ctx.fillRect(f.x - 3 - 3 * e, f.y - 40 * e, 6 + 6 * e, 40 * e);
  },
  ring(f, t, L) {
    const tt = t - (f.delay || 0); if (tt < 0) return; const pp = clamp01(tt / (L - (f.delay || 0))), e = ease(pp), r = f.R * e, al = 1 - pp, w = (f.w || 3) * (1 - pp) + 0.4;
    ctx.strokeStyle = hexA(f.col, al * 0.9); ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * ELL, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,' + al * 0.7 + ')'; ctx.lineWidth = w * 0.4; ctx.beginPath(); ctx.ellipse(f.x, f.y, r * 0.97, r * 0.97 * ELL, 0, 0, 7); ctx.stroke();
  },
  crest(f, t, L, p) {
    const e = ease(Math.min(1, p / 0.55)), al = Math.sin(Math.PI * Math.min(1, 0.12 + p * 0.9)), R = f.R * (0.3 + 0.9 * e);
    ctx.save(); ctx.translate(f.x, f.y - 2); ctx.scale(1, 0.7); ctx.rotate(p * 0.6); ctx.beginPath();
    for (let i = 0; i < 16; i++) { const r = i % 2 ? R * 0.52 : R, th = i / 16 * 6.283; i ? ctx.lineTo(Math.cos(th) * r, Math.sin(th) * r) : ctx.moveTo(Math.cos(th) * r, Math.sin(th) * r); }
    ctx.closePath(); ctx.fillStyle = hexA(f.col, al * 0.28); ctx.fill(); ctx.strokeStyle = hexA(f.col2, al * 0.95); ctx.lineWidth = 1.8; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R * 0.34, 0, 7); ctx.strokeStyle = 'rgba(255,255,255,' + al * 0.9 + ')'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
    glowDot(f.x, f.y - 4, R * 0.5, f.col, 0.55 * al);
  },
  pillar(f, t, L) {
    const tt = t - (f.delay || 0); if (tt < 0) return; const pp = tt / (L - (f.delay || 0)), rise = ease(Math.min(1, tt / 9)), al = pp > 0.55 ? Math.max(0, 1 - (pp - 0.55) / 0.45) : 1, H = f.H * rise, w = (f.w || 9) * (0.75 + 0.25 * Math.sin(tt * 0.5)) * (1 - 0.35 * clamp01((pp - 0.5) / 0.5));
    const g = ctx.createLinearGradient(0, f.y - H, 0, f.y); g.addColorStop(0, hexA(f.col, 0)); g.addColorStop(0.55, hexA(f.col, 0.32 * al)); g.addColorStop(1, hexA(f.col, 0.8 * al)); ctx.fillStyle = g; ctx.fillRect(f.x - w / 2, f.y - H, w, H);
    const g2 = ctx.createLinearGradient(0, f.y - H, 0, f.y); g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(1, 'rgba(255,255,255,' + 0.75 * al + ')'); ctx.fillStyle = g2; ctx.fillRect(f.x - w * 0.18, f.y - H, w * 0.36, H);
    glowDot(f.x, f.y - 1, w * 1.5, f.col, 0.65 * al);
    for (let i = 0; i < 6; i++) { const q = (tt * 0.028 + f.seed[i]) % 1; star4(f.x + (f.seed[i + 6] - 0.5) * w * 2, f.y - q * H, 1.2 + f.seed[i + 2] * 1.3, '#ffffff', al * (1 - q)); }
  },
  beam(f, t, L, p) {
    const e = ease(Math.min(1, t / 6)), al = (p > 0.72 ? 1 - (p - 0.72) / 0.28 : 1) * e, w = (f.w || 17) * (0.88 + 0.12 * Math.sin(t * 0.6)), top = f.y - 320;
    const W2 = w * 2.2, g0 = ctx.createLinearGradient(f.x - W2, 0, f.x + W2, 0); g0.addColorStop(0, 'rgba(255,230,140,0)'); g0.addColorStop(0.5, 'rgba(255,240,170,' + 0.35 * al + ')'); g0.addColorStop(1, 'rgba(255,230,140,0)'); ctx.fillStyle = g0; ctx.fillRect(f.x - W2, top, W2 * 2, f.y - top + 2);
    const g = ctx.createLinearGradient(f.x - w, 0, f.x + w, 0); g.addColorStop(0, 'rgba(255,240,170,0)'); g.addColorStop(0.5, 'rgba(255,250,215,' + 0.8 * al + ')'); g.addColorStop(1, 'rgba(255,240,170,0)'); ctx.fillStyle = g; ctx.fillRect(f.x - w, top, w * 2, f.y - top + 2);
    ctx.fillStyle = 'rgba(255,255,255,' + 0.55 * al + ')'; ctx.fillRect(f.x - w * 0.16, top, w * 0.32, f.y - top); glowDot(f.x, f.y, 30, '#ffe9a0', 0.7 * al); glowDot(f.x, f.y - 90, 26, '#fff6c8', 0.25 * al);
  },
  feathers(f, t, L) {
    for (let i = 0; i < 16; i++) { const dl = f.seed[i % 14] * 16 + i * 1.3, tt = t - dl, q = tt / 46; if (q < 0 || q > 1) continue; const a = Math.sin(Math.PI * q), x = f.x + (f.seed[(i + 4) % 14] - 0.5) * f.R * 2 + Math.sin(tt * 0.11 + i) * 7, y = f.y - 95 + q * 100;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(tt * 0.11 + i) * 0.8 + 0.5); glowDot(0, 0, 5, '#ffe9a0', 0.4 * a); ctx.fillStyle = 'rgba(255,255,255,' + 0.95 * a + ')'; ctx.beginPath(); ctx.ellipse(0, 0, 1.4, 4.8, 0, 0, 7); ctx.fill(); ctx.restore(); }
  },
  scope(f, t, L) {
    const T = f.T, lock = clamp01((t - (T - 8)) / 6), e = ease(Math.min(1, t / (T * 0.75))), r = 11 + 46 * (1 - e), a = Math.min(1, t / 4) * (t > T + 3 ? Math.max(0, 1 - (t - T - 3) / 8) : 1), col = lock > 0.5 ? '#ff6a5a' : '#bfffe0';
    ctx.save(); ctx.translate(f.x, f.y); ctx.strokeStyle = hexA(col, a); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke(); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, 7); ctx.stroke();
    const rot = t * 0.07 * (1 - lock); ctx.lineWidth = 1.6; for (let i = 0; i < 4; i++) { const th = rot + i * 1.5708; ctx.beginPath(); ctx.moveTo(Math.cos(th) * r * 0.82, Math.sin(th) * r * 0.82); ctx.lineTo(Math.cos(th) * r * 1.22, Math.sin(th) * r * 1.22); ctx.stroke(); }
    ctx.lineWidth = 0.8; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { ctx.beginPath(); ctx.moveTo(dx * r * 1.5, dy * r * 1.5); ctx.lineTo(dx * r * 0.3, dy * r * 0.3); ctx.stroke(); }
    glowDot(0, 0, 2.6 + 12 * lock, col, 0.9 * a); ctx.restore();
  },
  arrowsp(f, t, L) {
    const D = f.T || 5, e = clamp01(t / D), dx = f.x1 - f.x0, dy = f.y1 - f.y0, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, ext = 40, hk = e + clamp01((t - D) / 7) * (ext / d), al = t > D + 4 ? Math.max(0, 1 - (t - D - 4) / 8) : 1;
    const hx = f.x0 + dx * hk, hy = f.y0 + dy * hk, tl = Math.min(d * hk, 60);
    for (let i = 3; i >= 0; i--) { const off = (i - 1.5) * 2.2, ox = -uy * off, oy = ux * off, a = (i === 1 || i === 2 ? 0.9 : 0.28) * al, g = ctx.createLinearGradient(hx - ux * tl, hy - uy * tl, hx, hy);
      g.addColorStop(0, 'rgba(180,255,220,0)'); g.addColorStop(1, 'rgba(210,255,235,' + a + ')'); ctx.strokeStyle = g; ctx.lineWidth = i === 1 || i === 2 ? 2.2 : 1; ctx.beginPath(); ctx.moveTo(hx - ux * tl + ox, hy - uy * tl + oy); ctx.lineTo(hx + ox, hy + oy); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,' + al + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx - ux * tl * 0.6, hy - uy * tl * 0.6); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,' + al + ')'; ctx.beginPath(); ctx.moveTo(hx + ux * 4, hy + uy * 4); ctx.lineTo(hx - ux * 1 - uy * 2, hy - uy * 1 + ux * 2); ctx.lineTo(hx - ux * 1 + uy * 2, hy - uy * 1 - ux * 2); ctx.closePath(); ctx.fill();
    if (t >= D) { const q = clamp01((t - D) / 14), fa = 1 - q; glowDot(f.x1, f.y1, 10 + 24 * ease(q), '#9dffd0', 0.9 * fa); star4(f.x1, f.y1, 16 + 22 * ease(q), '#ffffff', fa); ctx.save(); ctx.translate(f.x1, f.y1); ctx.rotate(Math.atan2(uy, ux)); ctx.fillStyle = 'rgba(255,255,255,' + 0.8 * fa + ')'; ctx.fillRect(-30, -0.6, 70 * ease(q) + 8, 1.2); ctx.restore(); }
  },
  mcircle(f, t, L, p) {
    const s = ease(Math.min(1, t / 10)), al = Math.min(1, t / 6) * (t > f.T + 6 ? Math.max(0, 1 - (t - f.T - 6) / (L - f.T - 6)) : 1), R = f.R * s;
    ctx.save(); ctx.translate(f.x, f.y); ctx.scale(1, ELL); ctx.rotate(t * 0.045);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, hexA(f.col, 0.5 * al)); g.addColorStop(0.8, hexA(f.col, 0.16 * al)); g.addColorStop(1, hexA(f.col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
    ctx.strokeStyle = hexA(f.col, 0.95 * al); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.stroke(); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0, 0, R * 0.86, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,210,' + 0.85 * al + ')'; ctx.lineWidth = 1; for (let k = 0; k < 2; k++) { ctx.beginPath(); for (let i = 0; i < 3; i++) { const th = k * 1.0472 + i * 2.0944 - 1.5708, x = Math.cos(th) * R * 0.84, y = Math.sin(th) * R * 0.84; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.stroke(); }
    ctx.lineWidth = 1; for (let i = 0; i < 24; i++) { const th = i / 24 * 6.283; ctx.beginPath(); ctx.moveTo(Math.cos(th) * R * 0.88, Math.sin(th) * R * 0.88); ctx.lineTo(Math.cos(th) * R * (i % 2 ? 0.94 : 0.99), Math.sin(th) * R * (i % 2 ? 0.94 : 0.99)); ctx.stroke(); }
    ctx.restore(); glowDot(f.x, f.y, R * 0.35, f.col, 0.4 * al);
  },
  fball(f, t, L) {
    const T = f.T; if (t > T + 1) return; const e = Math.pow(clamp01(t / T), 1.6), R = f.R || 13, pos = k => ({ x: f.x0 + (f.x - f.x0) * k, y: f.y0 + (f.y - f.y0) * k }), h = pos(e), a0 = pos(Math.max(0, e - 0.55));
    const g = ctx.createLinearGradient(a0.x, a0.y, h.x, h.y); g.addColorStop(0, hexA(f.col, 0)); g.addColorStop(1, hexA(f.col, 0.7)); ctx.strokeStyle = g; ctx.lineWidth = R * 0.8; ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.lineTo(h.x, h.y); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,200,0.8)'; ctx.lineWidth = R * 0.28; ctx.beginPath(); ctx.moveTo(pos(Math.max(0, e - 0.3)).x, pos(Math.max(0, e - 0.3)).y); ctx.lineTo(h.x, h.y); ctx.stroke();
    for (let k = 1; k < 14; k++) { const q = pos(Math.max(0, e - k * 0.03)); glowDot(q.x + Math.sin(t * 0.9 + k) * 2, q.y, R * (1 - k / 15) * 0.9, f.col, 0.5 * (1 - k / 14)); }
    glowDot(h.x, h.y, R * 1.7, f.col, 0.85); glowDot(h.x, h.y, R * 0.55, '#ffffff', 1);
    for (let i = 0; i < 7; i++) { const q = pos(Math.max(0, e - 0.04 - f.seed[i] * 0.25)); star4(q.x + (f.seed[i + 5] - 0.5) * 14, q.y + (f.seed[i + 3] - 0.5) * 8, 1.4 + f.seed[i + 1] * 1.6, f.col2 || '#fff0c0', 0.8); }
  },
  flare(f, t, L, p) { const e = ease(p), al = (1 - p) * (1 - p); glowDot(f.x, f.y, f.R * (0.4 + 0.9 * e), f.col, 0.95 * al); glowDot(f.x, f.y, f.R * 0.45 * (1 - p * 0.5), '#ffffff', al); star4(f.x, f.y, f.R * (0.5 + 1.1 * e), '#ffffff', 0.9 * al); },
  crater(f, t, L, p) {
    const e = ease(Math.min(1, t / 8)), al = p > 0.4 ? 1 - (p - 0.4) / 0.6 : 1, pulse = 0.8 + 0.2 * Math.sin(t * 0.5), R = f.R * e;
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(16,5,10,' + 0.55 * al + ')'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 2, R, R * ELL, 0, 0, 7); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; ctx.save(); ctx.translate(f.x, f.y + 2); ctx.scale(1, ELL); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, hexA(f.col, 0.9 * al * pulse)); g.addColorStop(0.55, hexA(f.col, 0.35 * al * pulse)); g.addColorStop(1, hexA(f.col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
    ctx.strokeStyle = hexA(f.col2 || f.col, 0.8 * al); ctx.lineWidth = 1; for (let i = 0; i < 8; i++) { const th = i / 8 * 6.283 + f.seed[i] * 0.5, l = R * (0.55 + f.seed[i + 2] * 0.45); ctx.beginPath(); ctx.moveTo(Math.cos(th) * R * 0.15, Math.sin(th) * R * 0.15); ctx.lineTo(Math.cos(th) * l * 0.6 + Math.sin(i) * 2, Math.sin(th) * l * 0.6); ctx.lineTo(Math.cos(th) * l, Math.sin(th) * l); ctx.stroke(); }
    ctx.restore();
  },
  debris(f, t, L, p) {
    const n = f.n || 14, al = 1 - p;
    for (let i = 0; i < n; i++) { const th = -1.5708 + (spRn(i, 1, f.seed[0]) - 0.5) * 2.7, sp = 1.5 + spRn(i, 2, f.seed[1]) * 2.6, x = f.x + Math.cos(th) * sp * t * 0.85, y = Math.min(f.y + 4, f.y - 2 + Math.sin(th) * sp * t + 0.09 * t * t);
      if (i % 3 === 0) { ctx.fillStyle = 'rgba(60,34,24,' + al + ')'; ctx.fillRect(x - 1.3, y - 1.3, 2.6, 2.6); } else glowDot(x, y, 2.4, f.col, al); }
  },
  puff(f, t, L, p) {
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 9; i++) { const th = i / 9 * 6.283 + f.seed[i], e = ease(p), r = 4 + 9 * e * (0.7 + f.seed[i + 2] * 0.6), d = 14 * e; ctx.fillStyle = 'rgba(' + (f.dark || '22,8,40') + ',' + 0.8 * (1 - p) + ')'; ctx.beginPath(); ctx.arc(f.x + Math.cos(th) * d, f.y - 6 - e * 8 + Math.sin(th) * d * 0.55, r, 0, 7); ctx.fill(); }
    ctx.globalCompositeOperation = 'lighter'; glowDot(f.x, f.y - 6, 18 * (1 - p) + 4, f.col, 0.5 * (1 - p)); ctx.strokeStyle = hexA(f.col, 0.7 * (1 - p)); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(f.x, f.y, 20 * ease(p), 11 * ease(p), 0, 0, 7); ctx.stroke();
  },
  xslash(f, t, L) {
    const tt = t - (f.delay || 0); if (tt < 0) return; const len = f.len || 24, al = tt > 6 ? Math.max(0, 1 - (tt - 6) / 9) : 1;
    for (let k = 0; k < 2; k++) { const q = clamp01((tt - k * 2) / 3); if (q <= 0) continue; const a = f.ang + (k ? 0.62 : -0.62), dx = Math.cos(a), dy = Math.sin(a), x0 = f.x - dx * len, y0 = f.y - dy * len, x1 = x0 + dx * len * 2 * q, y1 = y0 + dy * len * 2 * q;
      for (const [w, c, aa] of [[9, f.col, 0.4], [4.2, '#ff4a4a', 0.95], [1.6, '#ffffff', 1]]) { ctx.strokeStyle = c[0] === '#' && c.length === 7 ? hexA(c, aa * al) : c; ctx.lineWidth = w * (1 - 0.3 * (tt / 12)); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); } }
    if (tt >= 2 && tt < 9) glowDot(f.x, f.y, 20 * (1 - (tt - 2) / 7), '#ff3a3a', 0.8);
  },
  ghost(f, t, L, p) { if (!f.u || !ART[f.id] || !ART[f.id].chibi || !HD.cv) return; const al = Math.sin(Math.PI * Math.min(1, 0.1 + p)) * 0.85; ctx.globalCompositeOperation = 'source-over'; artChibi(ctx, f.id, f.x, f.y, f.h, HD.k * (camOn() ? Engine.zoom : 1), { flip: f.flip, alpha: al, variant: 'purple' }); },
  bignum(f, t, L) {
    const tt = t - (f.delay || 0); if (tt < 0) return; const q = tt / (L - (f.delay || 0)), pop = tt < 7 ? 1 + (7 - tt) * 0.16 : 1, bounce = -Math.abs(Math.sin(Math.min(tt, 14) * 0.3 + 0.1)) * Math.max(0, 1 - tt / 16) * 9 - Math.min(tt, 30) * 0.3, al = q > 0.75 ? 1 - (q - 0.75) / 0.25 : 1, sz = (f.size || 20) * pop;
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = al; ctx.font = '900 ' + sz + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const y = f.y - 12 + bounce; ctx.shadowColor = f.col; ctx.shadowBlur = 0; ctx.lineWidth = sz * 0.22; ctx.strokeStyle = '#150600'; ctx.strokeText(f.text, f.x, y);
    const g = ctx.createLinearGradient(0, y - sz * 0.5, 0, y + sz * 0.5); if (f.heal) { g.addColorStop(0, '#f4ffe0'); g.addColorStop(0.5, '#7dffa0'); g.addColorStop(1, '#2fbf6a'); } else if (f.foe) { g.addColorStop(0, '#fff0f0'); g.addColorStop(0.5, '#ff9a8a'); g.addColorStop(1, '#d83a3a'); } else { g.addColorStop(0, '#fffbe0'); g.addColorStop(0.45, '#ffd24a'); g.addColorStop(1, '#d8861a'); }
    ctx.fillStyle = g; ctx.fillText(f.text, f.x, y); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = al * 0.35 * (1 - clamp01(tt / 10)); ctx.fillStyle = f.col; ctx.fillText(f.text, f.x, y); ctx.globalAlpha = 1;
  }
};
const fxBig = (x, y, text, o) => hdPush(Object.assign({ type: 'bignum', x, y, text, col: '#ffd24a', size: 14, life: 62 }, o || {}));
// ---------- skill-name cut-in (screen space, drawn on the hi-DPI layer) ----------
const SILH = {};
function spSil(id, w, h, col) { w = Math.round(w); h = Math.round(h); const key = id + w + 'x' + h + col; if (SILH[key]) return SILH[key]; const src = hdScaled(id, 'full', w, h, 'white'); if (!src) return null; const c = cvs(w, h), g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, w, h); return SILH[key] = c; }
function spDimDraw() {
  const s = G.sp; if (s.dim > 0.01) { ctx.fillStyle = 'rgba(' + s.X.dimCol + ',' + s.dim.toFixed(3) + ')'; ctx.fillRect(0, 0, W, VH()); }
  if (s.tint > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(' + s.tintCol + ',' + s.tint.toFixed(3) + ')'; ctx.fillRect(0, 0, W, VH()); ctx.restore(); }
}
function drawSpHD(g) {
  const s = G.sp, X = s.X, vh = VH(); g.save(); g.setTransform(HD.k, 0, 0, HD.k, 0, 0);
  if (s.vig > 0.02 && s.focus) { const z = camOn() ? Engine.zoom : 1, sx = (s.focus.x - (camOn() ? Cam.x : 0)) * z + (G.shx || 0), sy = (s.focus.y - (camOn() ? Cam.y : 0)) * z + (G.shy || 0), r0 = 70 - 40 * s.vig, gr = g.createRadialGradient(sx, sy, r0, sx, sy, Math.hypot(W, vh) * 0.55); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.4, 'rgba(0,0,0,' + 0.4 * s.vig + ')'); gr.addColorStop(1, 'rgba(0,0,0,' + 0.85 * s.vig + ')'); g.fillStyle = gr; g.fillRect(0, 0, W, vh); }
  if (s.cutT >= 0) drawSpCut(g, s, X, vh);
  g.restore();
}
function drawSpCut(g, s, X, vh) {
  const t = s.cutT, L = s.cutLen, N = s.cutIn, mid = vh / 2, ki = Math.min(1, t / N), ko = Math.min(1, (L - t) / N), k = Math.max(0, Math.min(ki, ko)), e = 1 - Math.pow(1 - k, 3), ang = -0.1, bh = 120 * e, id = s.art, im = ART[id];
  g.fillStyle = 'rgba(0,0,0,' + 0.22 * k + ')'; g.fillRect(0, 0, W, vh);
  // diagonal band + speed lines (rotated frame)
  g.save(); g.translate(W / 2, mid); g.rotate(ang);
  const bg = g.createLinearGradient(-W, 0, W, 0); bg.addColorStop(0, 'rgba(6,6,20,0.94)'); bg.addColorStop(0.5, hexA(X.dark, 0.96)); bg.addColorStop(1, 'rgba(6,6,20,0.94)'); g.fillStyle = bg; g.fillRect(-W, -bh / 2, W * 2, bh);
  const hg = g.createLinearGradient(0, -bh / 2, 0, bh / 2); hg.addColorStop(0, hexA(X.col, 0.5)); hg.addColorStop(0.5, hexA(X.col, 0.1)); hg.addColorStop(1, hexA(X.col, 0.5)); g.fillStyle = hg; g.fillRect(-W, -bh / 2, W * 2, bh);
  g.save(); g.beginPath(); g.rect(-W, -bh / 2, W * 2, bh); g.clip();
  for (let i = 0; i < 26; i++) { const sp = 34 + (i % 5) * 11, x = W - ((i * 97 + t * sp) % (W * 1.7)) - W * 0.1, y = (spRn(i, 1, 0.3) - 0.5) * bh, len = 50 + (i % 4) * 34; g.fillStyle = i % 3 ? hexA(X.col, 0.3 + 0.35 * spRn(i, 2, 0.1)) : 'rgba(255,255,255,' + (0.35 + 0.3 * spRn(i, 3, 0.2)) + ')'; g.fillRect(x, y, len, 0.7 + (i % 3) * 0.7); }
  g.restore();
  g.fillStyle = hexA(X.col2, 0.95); g.fillRect(-W, -bh / 2 - 1.5, W * 2, 2.4); g.fillRect(-W, bh / 2 - 0.9, W * 2, 2.4); g.fillStyle = hexA(X.col, 0.6); g.fillRect(-W, -bh / 2 - 4.5, W * 2, 1.2); g.fillRect(-W, bh / 2 + 2, W * 2, 1.2);
  // eyes strip (crop of the face portrait) with a flash
  const ts = Math.max(0, t - 3), sk = ease(clamp01(ts / 6)) , sa = Math.min(1, k * 1.5);
  if (im && im.face && ts > 0) {
    const sh = 26, sy = Math.max(0, Math.min(im.face.height - 24, im.face.height * X.eye - 12)), sx0 = (1 - sk) * 220 + 6, y0 = -bh / 2 - 36;
    g.save(); g.globalAlpha = sa; g.imageSmoothingEnabled = true; g.beginPath(); g.rect(-W / 2 - 10 + sx0, y0, W + 20, sh); g.clip(); g.drawImage(im.face, 0, sy, im.face.width, 24, -W / 2 - 10 + sx0, y0, W + 20, sh); g.fillStyle = 'rgba(8,8,30,0.18)'; g.fillRect(-W / 2 - 10 + sx0, y0, W + 20, sh); g.restore();
    g.fillStyle = hexA(X.col2, sa); g.fillRect(-W / 2 - 10 + sx0, y0 - 1.2, W + 20, 1.6); g.fillRect(-W / 2 - 10 + sx0, y0 + sh - 0.4, W + 20, 1.6);
    const fl = ts < 10 ? (ts % 4 < 2 ? 0.75 - ts * 0.05 : 0.05) : 0; if (fl > 0) { g.fillStyle = 'rgba(255,255,255,' + fl * sa + ')'; g.fillRect(-W / 2 - 10 + sx0, y0, W + 20, sh); }
  }
  g.restore();
  // hero full-body art, big, with a glow edge
  if (im && im.full) {
    const h = Math.min(vh * 0.8, 214) * (0.92 + 0.08 * e), w = h * im.full.width / im.full.height, cx = W - Math.min(98, w * 0.62) + (1 - e) * 190, bottom = mid + 60 + 38 * 0 + (h > 170 ? 40 : 30);
    const sil = spSil(id, w * HD.k, h * HD.k, X.col2);
    g.save(); g.globalCompositeOperation = 'lighter'; if (sil) { const fl = ART_FACING[id] !== 'left'; for (const [dx, dy] of [[-2.2, 0], [2.2, 0], [0, -2.2], [0, 2.2], [-1.6, -1.6], [1.6, 1.6]]) { g.save(); g.globalAlpha = 0.42 * e; g.translate(cx + dx, bottom + dy); if (fl) g.scale(-1, 1); g.drawImage(sil, -w / 2, -h, w, h); g.restore(); } } g.restore();
    g.save(); g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(cx, bottom, w * 0.3, 5, 0, 0, 7); g.fill(); g.restore();
    artFull(g, id, cx, bottom, h, HD.k, { flip: ART_FACING[id] !== 'left', alpha: Math.min(1, e * 1.6) });
  }
  // skill name + shout
  const tx = 18 - (1 - e) * 150, tn = Math.max(0, t - 4), punch = tn < 9 ? 1 + 0.7 * Math.pow(1 - tn / 9, 2) : 1, tAl = Math.min(1, k * 2) * (t >= 4 ? 1 : 0);
  if (tAl > 0) {
    g.save(); g.globalAlpha = tAl; g.textBaseline = 'middle'; g.textAlign = 'left'; g.lineJoin = 'round';
    g.font = 'bold 10px ' + FONT; g.lineWidth = 3; g.strokeStyle = '#000'; g.strokeText('SPECIAL  ―  ' + s.who, tx + 2, mid - 40); g.fillStyle = X.col2; g.fillText('SPECIAL  ―  ' + s.who, tx + 2, mid - 40);
    const fs = s.name.length >= 4 ? 40 : 46; g.translate(tx, mid - 6); g.rotate(ang * 0.7); g.scale(punch, punch); g.font = '900 ' + fs + 'px ' + FONT;
    g.shadowColor = X.col; g.shadowBlur = 18; g.lineWidth = 9; g.strokeStyle = '#1a0a00'; g.strokeText(s.name, 0, 0); g.shadowBlur = 0;
    const gr = g.createLinearGradient(0, -fs * 0.5, 0, fs * 0.5); gr.addColorStop(0, '#fffbe0'); gr.addColorStop(0.42, '#ffd84a'); gr.addColorStop(0.58, '#f0a420'); gr.addColorStop(1, '#b86a10'); g.fillStyle = gr; g.fillText(s.name, 0, 0);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = tAl * 0.5 * Math.max(0, 1 - tn / 8); g.fillStyle = '#fff'; g.fillText(s.name, 0, 0); g.restore();
    g.save(); g.globalAlpha = tAl; g.font = 'bold 13px ' + FONT; g.textBaseline = 'middle'; g.textAlign = 'left'; g.lineJoin = 'round'; const nShow = Math.floor(Math.max(0, t - 9) * 1.4), line = s.shout.slice(0, nShow);
    g.lineWidth = 4; g.strokeStyle = '#000'; g.strokeText(line, tx + 2, mid + 36); g.fillStyle = '#fff'; g.fillText(line, tx + 2, mid + 36); g.restore();
  }
}
// ---------- the sequence ----------
function* spStep() {
  const s = G.sp; s.n++;
  if (G.spHold != null && s.n === G.spHold) { s.holding = true; while (G.spHold != null) yield 1; s.holding = false; }
  s.dim += (s.dimT - s.dim) * 0.16; s.vig += (s.vigT - s.vig) * 0.16; s.tint *= 0.93; yield 1;
}
function* spWait(n) { for (let i = 0; i < Math.round(n); i++) yield* spStep(); }
function* hitstop(n) { if (n <= 0) return; G.hs = true; yield* spWait(n); G.hs = false; }
function spPos(u) { const p = tilePx(u.vx, u.vy); return { x: p.x, y: p.y + 8 }; }
// one landed strike of a special: flash, shake scaled to damage, big gold number, hp tween
function spHit(ev, o) {
  o = o || {}; ev.done = true; const d = ev.def, p = tilePx(d.vx, d.vy), foe = d.team === 0;
  if (ev.hit) {
    d.flash = 12; Aud.sfx('hit'); G.shake = Math.max(G.shake || 0, o.shake || 16); G.shakeAmp = Math.max(G.shakeAmp || 0, Math.min(9, 2.5 + ev.dmg * 0.22)); G.flashW = Math.max(G.flashW || 0, o.flash || 4);
    fxBig(p.x, p.y + 4, (ev.crit ? '必殺 ' : '') + ev.dmg, { foe, delay: o.delay || 0, size: o.size || 14, col: foe ? '#ff6a6a' : '#ffd24a' }); fxSpark(p.x, p.y + 6, o.R || 22, o.col || '#ffe9a0', { life: 20 });
    Co.run(tweenHp(d, ev.hpAfter, 18));
  } else { Aud.sfx('miss'); numFx(d, 'MISS', '#c8d0ff', 10); }
}
function* spFinish(evs, sc) {
  const kill = evs.find(e => e.kill);
  if (kill) { Aud.sfx('kill'); G.slow = 0.4; for (const e of evs) if (e.kill) e.def.fading = true; yield* spWait(26); G.slow = 1; yield* spWait(6); } else yield* spWait(Math.max(6, 20 * sc));
}
function* special(rec) {
  const u = rec.unit, kind = rec.sp, X = SPX[kind]; if (!X) return;
  const mode = !G.cutin ? 'map' : (G.auto && G.speedX > 1) ? 'skip' : G.auto ? 'short' : 'full', id = artOf(u), P = { full: [24, 52, 8], short: [6, 26, 5], map: [0, 0, 0], skip: [0, 0, 0] }[mode], sc = { full: 1, short: 0.55, map: 0.6, skip: 0.25 }[mode];
  const s = G.sp = { kind, X, art: id, n: 0, dim: 0, dimT: 0, tint: 0, tintCol: '255,210,80', vig: 0, vigT: 0, focus: null, cutT: -1, cutLen: P[1], cutIn: P[2], holding: false, skip: false, name: SP[u.key].name, who: u.name, shout: X.shout };
  G.hs = false; G.slow = 1; flushInput();
  const filt = (a, b) => { try { cv.style.filter = a; if (BGL.cv) BGL.cv.style.filter = a; } catch (e) { } };
  const skipped = () => { if (Input.q.length) { const k = Input.q.shift(); if (k === 'ok' || k === 'cancel') s.skip = true; } return s.skip; };
  try {
    if (P[0] + P[1] > 0 && ART[id]) {
      const p = spPos(u); Aud.duck(true); Aud.sp('charge'); s.dimT = 0.5; G.slow = 0.5; if (mode === 'full') filt('saturate(0.55)');
      hdPush({ type: 'charge', x: p.x, y: p.y, col: X.col, R: 36, life: P[0] + 10 }); hdPush({ type: 'ring', x: p.x, y: p.y, col: X.col2, R: 26, w: 2, life: P[0] + 6, delay: 2 });
      for (let i = 0; i < P[0] && !skipped(); i++) yield* spStep();
      if (!s.skip) { Aud.sp('whoosh'); s.dimT = 0.62; for (s.cutT = 0; s.cutT < P[1]; s.cutT++) { if (skipped()) break; yield* spStep(); } }
      s.cutT = -1; filt(''); G.slow = 1; if (s.skip) G.flashW = 3;
    } else if (mode !== 'skip') { Aud.sp('whoosh'); }
    const T = Math.max(4, Math.round(SPRUN[kind].T * (s.skip ? 0.25 : sc)));
    s.dimT = 0; s.sc = s.skip ? 0.25 : sc; s.hs = mode === 'full' && !s.skip ? 7 : mode === 'short' ? 3 : 0; s.skip = false; Aud.duck(false);
    yield* SPRUN[kind](rec, s, T);
  } finally { filt(''); G.sp = null; G.slow = 1; G.hs = false; Aud.duck(false); u.invis = false; }
}
const SPRUN = {
  * buff(rec, s, T) {
    const u = rec.unit, p = spPos(u), X = s.X, sc = s.sc; Aud.sp('gong'); s.tint = 0.3; s.tintCol = '255,200,60';
    hdPush({ type: 'crest', x: p.x, y: p.y, col: X.col, col2: X.col2, R: 50, life: Math.round(46 * sc) + 10 }); for (let i = 0; i < 3; i++) hdPush({ type: 'ring', x: p.x, y: p.y, col: X.col, R: 64 + i * 12, w: 3.4 - i * 0.7, life: Math.round(34 * sc) + 10, delay: Math.round(i * 6 * sc) });
    fxSpark(p.x, p.y - 4, 30, X.col, { life: 26 }); G.shake = 8; G.shakeAmp = 2; yield* spWait(T * 0.7);
    rec.buffed.forEach((a, i) => { const q = tilePx(a.vx, a.vy); hdPush({ type: 'pillar', x: q.x, y: q.y + 12, col: X.col, H: 78, w: 10, life: Math.round(48 * sc) + 14, delay: Math.round(i * 4 * sc) }); fxSpark(q.x, q.y + 4, 18, X.col2, { life: 22, delay: 0 }); numFx(a, '攻撃+2', '#ffc060', 9); });
    yield* spWait(Math.max(10, 44 * sc));
  },
  * shot(rec, s, T) {
    const u = rec.unit, X = s.X, sc = s.sc, evs = rec.events.filter(e => e.att === u && !e.aoe), pu = spPos(u), pt = spPos(rec.target); s.focus = { x: pt.x, y: pt.y - 4 }; s.vigT = 0.78; s.dimT = 0.3; G.slow = 0;
    hdPush({ type: 'scope', x: pt.x, y: pt.y - 4, T, life: T + 14 }); Aud.sp('lock'); yield* spWait(T - 6); Aud.sp('lock');
    hdPush({ type: 'arrowsp', x0: pu.x, y0: pu.y - 4, x1: pt.x, y1: pt.y - 4, T: 5, life: 22 }); Aud.sp('twang'); yield* spWait(5);
    G.slow = 1; s.vigT = 0; for (const k of [0, 1]) hdPush({ type: 'ring', x: pt.x, y: pt.y, col: X.col, R: 40 + k * 14, w: 3, life: 22, delay: k * 3 }); hdPush({ type: 'flare', x: pt.x, y: pt.y - 4, col: X.col, R: 30, life: 20 }); G.shake = 14;
    for (let i = 0; i < evs.length; i++) { spHit(evs[i], { col: X.col, flash: 5, delay: i * 8 }); if (i) hdPush({ type: 'arrowsp', x0: pu.x, y0: pu.y - 4, x1: pt.x, y1: pt.y - 4, T: 4, life: 18 }); }
    yield* hitstop(s.hs); yield* spFinish(evs, sc);
  },
  * meteor(rec, s, T) { yield* meteorLike(rec, s, T, { c1: s.X.col, c2: s.X.col2, R: 31 }); },
  * starfall(rec, s, T) { yield* meteorLike(rec, s, T, { c1: s.X.col, c2: s.X.col2, R: 31, many: true }); },
  * pray(rec, s, T) {
    const u = rec.unit, X = s.X, sc = s.sc, p = spPos(u), heals = rec.events.filter(e => e.type === 'heal'); s.dimT = 0.32; s.tint = 0.12; s.tintCol = '255,240,170'; Aud.sp('pray');
    hdPush({ type: 'beam', x: p.x, y: p.y + 2, life: Math.round(60 * sc) + 16 }); hdPush({ type: 'feathers', x: p.x, y: p.y, R: 40, life: Math.round(70 * sc) + 24 }); hdPush({ type: 'charge', x: p.x, y: p.y, col: X.col, R: 24, life: Math.round(20 * sc) + 6 });
    yield* spWait(T * 0.8); for (let i = 0; i < 2; i++) hdPush({ type: 'ring', x: p.x, y: p.y, col: '#fff2b0', R: 70 + i * 16, w: 3.2, life: Math.round(34 * sc) + 10, delay: Math.round(i * 5 * sc) }); hdPush({ type: 'flare', x: p.x, y: p.y - 4, col: X.col, R: 28, life: 22 }); G.flashW = 3;
    yield* spWait(Math.max(2, 6 * sc));
    for (const ev of heals) { ev.done = true; const q = tilePx(ev.def.vx, ev.def.vy); Aud.sfx('heal'); hdPush({ type: 'pillar', x: q.x, y: q.y + 12, col: '#a8ffc0', H: 84, w: 11, life: Math.round(52 * sc) + 14 }); fxHeal(q.x, q.y + 6, true); fxBig(q.x, q.y + 4, '+' + ev.dmg, { heal: true, col: '#7dffa0', size: 14 }); Co.run(tweenHp(ev.def, ev.hpAfter, 24)); yield* spWait(Math.max(2, 5 * sc)); }
    yield* spWait(Math.max(10, 40 * sc));
  },
  * ambush(rec, s, T) {
    const u = rec.unit, X = s.X, sc = s.sc, evs = rec.events.filter(e => e.att === u && !e.aoe), pu = spPos(u), pt = spPos(rec.target); s.dimT = 0.9; s.focus = { x: pt.x, y: pt.y }; s.vigT = 0.5;
    Aud.sp('vanish'); hdPush({ type: 'puff', x: pu.x, y: pu.y, col: X.col, seed: null, life: Math.round(28 * sc) + 8 }); u.invis = true; yield* spWait(Math.max(3, 9 * sc));
    const gap = Math.max(3, Math.round(7 * sc)), N = 5, angs = [0.5, 2.6, 4.2, 1.6, 3.3], real = evs.length > 1 ? [2, 4] : [4];
    for (let k = 0; k < N; k++) { const a = angs[k], ox = Math.cos(a) * 5, oy = Math.sin(a) * 4, tx = pt.x + ox, ty = pt.y - 6 + oy; Aud.sp('swish'); hdPush({ type: 'xslash', x: tx, y: ty, ang: a * 0.6 - 0.4, len: 34, col: '#ff4a4a', life: 16 }); fxSpark(tx, ty, 12, '#ff6a6a', { life: 14 }); G.shake = 5; G.shakeAmp = 2;
      const ri = real.indexOf(k); if (ri >= 0 && evs[ri]) { spHit(evs[ri], { col: '#ff6a6a', flash: 5, delay: 0, size: 15, shake: 12 }); yield* hitstop(s.hs); } yield* spWait(gap); }
    // reappear behind the target
    const dx = pt.x - pu.x, dy = pt.y - pu.y, dl = Math.hypot(dx, dy) || 1, bx = pt.x + dx / dl * 16, by = pt.y + dy / dl * 10, id = artOf(u), chb = ART[id] && ART[id].chibi;
    if (chb && fxHdOn()) { const st = chibiStyle(u, id); hdPush({ type: 'ghost', u: 1, id, x: bx, y: by + 7, h: TS * 1.5 * (chb.height / 192) * st.rel, flip: dx < 0, life: 26 }); }
    hdPush({ type: 'puff', x: bx, y: by + 4, col: X.col, life: 24 }); hdPush({ type: 'puff', x: pu.x, y: pu.y, col: X.col, life: 20 }); Aud.sp('vanish'); u.invis = false; s.dimT = 0; s.vigT = 0; yield* spWait(6);
    yield* spFinish(evs, sc);
  },
  * cleave(rec, s, T) {
    const u = rec.unit, X = s.X, sc = s.sc, evs = rec.events.filter(e => e.att === u && !e.aoe), pt = spPos(rec.target); s.dimT = 0.45; s.focus = { x: pt.x, y: pt.y }; s.vigT = 0.55; G.slow = 0.5; Aud.sp('meteorfall');
    hdPush({ type: 'charge', x: pt.x, y: pt.y, col: X.col, R: 30, life: T + 4 }); yield* spWait(T); G.slow = 1; s.vigT = 0; Aud.sp('clang');
    for (const [a, R, W, d] of [[-1.0, 24, 13, 0], [-0.7, 28, 8, 2], [-1.25, 19, 6, 3]]) hdPush({ type: 'slash', x: pt.x, y: pt.y - 4, ang: a, R, sweep: 2.6, W, col: X.col, life: 20, dir: 1, delay: d });
    hdPush({ type: 'flare', x: pt.x, y: pt.y - 4, col: X.col, R: 34, life: 22 }); for (let i = 0; i < 2; i++) hdPush({ type: 'ring', x: pt.x, y: pt.y + 2, col: X.col, R: 48 + i * 14, w: 3.4, life: 22, delay: i * 3 }); hdPush({ type: 'crater', x: pt.x, y: pt.y, col: X.col, col2: X.col2, R: 17, life: 40 }); hdPush({ type: 'debris', x: pt.x, y: pt.y, col: X.col, n: 12, life: 28 }); G.shake = 20;
    for (const ev of evs) spHit(ev, { col: X.col, flash: 6, shake: 22, size: 16 }); yield* hitstop(s.hs); yield* spFinish(evs, sc);
  }
};
SPRUN.buff.T = 14; SPRUN.shot.T = 24; SPRUN.meteor.T = 34; SPRUN.starfall.T = 36; SPRUN.pray.T = 22; SPRUN.ambush.T = 6; SPRUN.cleave.T = 20;
function* meteorLike(rec, s, T, o) {
  const u = rec.unit, X = s.X, sc = s.sc, evs = rec.events.filter(e => e.att === u && !e.aoe), splash = rec.events.filter(e => e.att === u && e.aoe), pt = spPos(rec.target), cy = pt.y - 2;
  s.dimT = s.kind === 'starfall' ? 0.66 : 0.62; s.focus = { x: pt.x, y: cy }; s.vigT = 0.35; G.slow = 0.6; Aud.sp('meteorfall');
  hdPush({ type: 'mcircle', x: pt.x, y: cy + 4, R: o.R, col: o.c1, T, life: T + 40 });
  hdPush({ type: 'fball', x: pt.x, y: cy, x0: pt.x - 56, y0: cy - 200, T, col: o.c1, col2: o.c2, R: 21, life: T + 4 });
  if (o.many) for (let i = 0; i < 3; i++) hdPush({ type: 'fball', x: pt.x + (i - 1) * 26, y: cy - 4 + (i % 2) * 6, x0: pt.x + (i - 1) * 26 + 40, y0: cy - 190, T: Math.max(3, T - 6 - i * 3), col: o.c1, col2: o.c2, R: 8, life: T, delay: 0 });
  yield* spWait(T); G.slow = 1; s.vigT = 0; s.dimT = 0.2; s.tint = 0.4; s.tintCol = o.many ? '190,100,255' : '255,150,60'; Aud.sp('boom'); G.flashW = 6; G.shake = 30; G.shakeAmp = 7;
  hdPush({ type: 'flare', x: pt.x, y: cy, col: o.c1, R: 52, life: 26 }); fxBloom(pt.x, cy, o.c1, 26); for (let i = 0; i < 3; i++) hdPush({ type: 'ring', x: pt.x, y: cy + 4, col: i ? o.c1 : o.c2, R: 62 + i * 18, w: 4 - i, life: 26 + i * 2, delay: i * 3 });
  hdPush({ type: 'debris', x: pt.x, y: cy, col: o.c1, n: 14, life: 40 }); hdPush({ type: 'crater', x: pt.x, y: cy + 4, col: o.c1, col2: o.c2, R: 22, life: Math.max(40, Math.round(66 * Math.max(0.6, s.sc))) });
  for (const ev of evs) spHit(ev, { col: o.c2, flash: 6, shake: 30, size: 16 });
  splash.forEach((ev, i) => { const q = tilePx(ev.def.vx, ev.def.vy); hdPush({ type: 'flare', x: q.x, y: q.y + 6, col: o.c1, R: 22, life: 18, delay: 0 }); spHit(ev, { col: o.c1, delay: 4 + i * 3, shake: 10, size: 11, flash: 3 }); });
  yield* hitstop(s.hs); yield* spFinish(evs.concat(splash), sc);
}
// normal attack cut-in: hi-DPI effect on the defender (replaces the pixel effect sheet)
function cutFxDraw(g, c, tt, cx, cy, aLeft) {
  if (!c.ev.hit) return; const a = c.a, wk = a.wpn, mag = weaponOf(a).type === 'mag', col = FXCOL[wk] || '#bfe6ff', dir = aLeft ? 1 : -1, ang = aLeft ? -0.7 : Math.PI + 0.7, mk = o => Object.assign({ x: 0, y: 0, age: tt, seed: c.seed, vx: 0, vy: 0 }, o), prev = ctx;
  ctx = g; g.save(); g.translate(cx, cy); g.scale(3.8, 3.8);
  if (mag) { drawHdFx(mk({ type: 'bloom', R: 14, col, life: 22 })); drawHdFx(mk({ type: 'spark', R: 20, col, life: 20 })); }
  else if (wk === 'spear' || wk === 'gold') { drawHdFx(mk({ type: 'thrust', ang: aLeft ? 0 : Math.PI, col, life: 14 })); drawHdFx(mk({ type: 'spark', R: 12, col, life: 16 })); }
  else if (wk === 'bow') { drawHdFx(mk({ type: 'thrust', ang: aLeft ? 0 : Math.PI, col, life: 12 })); drawHdFx(mk({ type: 'spark', R: 14, col, life: 16 })); }
  else if (wk === 'axe') { drawHdFx(mk({ type: 'slash', ang, R: 13, sweep: 2.5, W: 6.5, col, life: 17, dir })); drawHdFx(mk({ type: 'spark', R: 14, col, life: 16 })); }
  else if (wk === 'dagger') { drawHdFx(mk({ type: 'slash', ang: ang + 0.25 * dir, R: 9, sweep: 1.5, W: 3, col, life: 11, dir })); drawHdFx(mk({ type: 'slash', ang: ang - 0.25 * dir, R: 9, sweep: 1.5, W: 3, col, life: 15, delay: 3, dir })); }
  else { drawHdFx(mk({ type: 'slash', ang, R: 11.5, sweep: 2.1, W: 4.4, col, life: 14, dir })); drawHdFx(mk({ type: 'spark', R: 12, col, life: 16 })); }
  g.restore(); ctx = prev;
}
