'use strict';
// ===== ambient: cheap, stateless "living map" overlays drawn on the painted ground (#cvb), below units / cursor =====
// Every effect is a pure function of the frame counter G.t (no particle arrays), so it costs a few dozen drawImage calls per frame.
// Point effects are placed by tile coordinates in AMB_TABLE (x, y in tiles of the painted map).
const AMB_TABLE = {
  map_ch1: { pond: [10.8, 7.4, 3.9, 3.0], flies: [[4, 2.5, 3, 1.6], [13, 10, 2, 1], [8, 12.5, 3, 1], [17, 6, 2, 1.5]], leaves: 7, cloud: 4 },
  map_ch2: { river: [10.7, 0, 5.3, 17, [[3.6, 5], [13.5, 15]]], mist: 6 },
  map_ch3: { fog: 7, glow: [[10.4, 2.5], [18, 2.1], [19.2, 1.8], [8.2, 7.2], [8.4, 8.6], [4, 10.5], [2.4, 11.4], [11.8, 12.1], [17.2, 13.2], [20.2, 12.8], [20.7, 12.1], [19.2, 15]] },
  map_ch4: { fire: [[1.2, 0.5], [5.6, 2.5], [8.6, 0.4], [8.8, 2.1], [9.8, 1], [2.6, 5.2], [2.1, 6.6], [6.1, 7.1], [0.3, 9.3], [1.5, 11.6], [14, 4.2], [16, 1.9], [18.2, 6.7], [23.1, 8.6], [19.2, 11.2], [17.1, 12.2], [16.2, 12.7], [22.9, 12], [23.6, 12.2]], smoke: [[2.4, 6.2], [18.5, 5.8], [6, 5.6]], ash: 14 },
  map_ch5: { torch: [[6.6, 4.5], [13.2, 6.6], [16.2, 9.5], [19.4, 9.5], [8.2, 10.5], [16, 3.4], [17.8, 3.0]], shafts: 3 },
  map_ch6: { altar: [20.5, 5.1], flame: [[9.4, 1.0], [9.4, 2.5], [6.6, 4.4], [18.6, 2.4], [22.7, 2.4], [17.3, 4.8], [23.9, 5], [19, 7.4], [22.3, 7.4], [6.2, 15.3], [8.3, 17.1]], runes: [[5.7, 17.8], [7.9, 16.3]], sky: [[0, 0, 4.5, 16], [29, 0, 2, 20], [24, 16.5, 7, 3.5], [0, 16, 2, 4]], stars: 36, motes: 12 }
};
const AMB = { spr: {} };
const ambH = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
function ambSprite(kind, rgb) {   // soft blobs, built once
  const key = kind + rgb; if (AMB.spr[key]) return AMB.spr[key];
  const w = kind === 'glow' ? 48 : 128, h = kind === 'glow' ? 48 : 56, c = cvs(w, h), g = c.getContext('2d');
  g.translate(w / 2, h / 2); g.scale(w / 2, h / 2); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
  gr.addColorStop(0, 'rgba(' + rgb + ',1)'); gr.addColorStop(0.45, 'rgba(' + rgb + ',0.45)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
  g.fillStyle = gr; g.fillRect(-1, -1, 2, 2); return AMB.spr[key] = c;
}
function ambBlob(g, kind, rgb, x, y, w, h, a) { if (a <= 0.003) return; g.globalAlpha = Math.min(1, a); g.drawImage(ambSprite(kind, rgb), x - w / 2, y - h / 2, w, h); }
function ambientDraw(g) {
  if (document.hidden || !G.S || !G.S.ch.paint) return; const T = AMB_TABLE[G.S.ch.paint]; if (!T) return;
  const t = G.t || 0, ox = OX(), oy = OY(), X = tx => ox + tx * TS, Y = ty => oy + ty * TS, mw = G.S.w * TS, mh = G.S.h * TS;
  g.save(); g.beginPath(); g.rect(ox, oy, mw, mh); g.clip();
  const glow = (tx, ty, r, rgb, a) => ambBlob(g, 'glow', rgb, X(tx), Y(ty), r * TS * 2, r * TS * 2, a);
  const spark = (x, y, a, s) => { g.globalAlpha = a; g.fillRect(x - s / 2, y - s / 2, s, s); };
  const ch = G.S.ch.paint;
  if (ch === 'map_ch1') {
    const [px, py, rx, ry] = T.pond;   // water shimmer: twinkling glints + slow ripple streaks
    g.globalCompositeOperation = 'lighter'; g.fillStyle = '#d8f4ff';
    for (let i = 0; i < 26; i++) { const a = ambH(i) * 6.283, d = Math.sqrt(ambH(i + 40)), x = X(px + Math.cos(a) * rx * d * 0.92), y = Y(py + Math.sin(a) * ry * d * 0.92), s = Math.sin(t / (26 + i % 9) + i * 2.3); if (s > 0.55) { const k = (s - 0.55) / 0.45; spark(x, y, 0.6 * k, 1.4); g.globalAlpha = 0.3 * k; g.fillRect(x - 2, y, 4, 0.5); } }
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 4; i++) { const sx = Math.sin(t / 130 + i * 1.7); g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(X(px - 1.5 + ambH(i) * 3 + sx * 0.4), Y(py - 2 + i * 1.3), TS * 2.2, 0.8); }
    for (let i = 0; i < T.cloud; i++) { const p = ((t / 2600 + i * 0.27) % 1.3) - 0.15; ambBlob(g, 'blob', '0,10,0', mw * p, oy + mh * (0.12 + ambH(i + 9) * 0.76) + Math.sin(t / 300 + i) * 4, 150 + ambH(i) * 90, 70 + ambH(i + 3) * 40, 0.1); }
    T.flies.forEach((f, i) => { const k = t / (70 + i * 13) + i * 2; const x = X(f[0] + Math.sin(k) * f[2] + Math.sin(k * 2.3) * 0.5), y = Y(f[1] + Math.cos(k * 0.8) * f[3]), w = Math.abs(Math.sin(t / 3 + i)) * 2 + 0.4; g.globalAlpha = 0.95; g.fillStyle = ['#fff3a0', '#ffffff', '#ffc0e0', '#b8e0ff'][i % 4]; g.beginPath(); g.ellipse(x - 1, y, w, 1.4, -0.4, 0, 7); g.ellipse(x + 1, y, w, 1.4, 0.4, 0, 7); g.fill(); g.fillStyle = '#403020'; g.fillRect(x - 0.3, y - 1, 0.6, 2); });
    for (let i = 0; i < T.leaves; i++) { const p = ((t / (900 + i * 90) + ambH(i + 5)) % 1), x = X(ambH(i + 11) * G.S.w + p * 5 + Math.sin(p * 9 + i) * 1.2), y = oy + mh * p, a = Math.sin(p * 3.1416); g.globalAlpha = 0.8 * a; g.fillStyle = i % 2 ? '#c9d870' : '#8bc05a'; g.save(); g.translate(x, y); g.rotate(t / 20 + i); g.fillRect(-1.2, -0.6, 2.4, 1.2); g.restore(); }
  } else if (ch === 'map_ch2') {
    const [rx, ry, rw, rh, br] = T.river; g.globalCompositeOperation = 'lighter'; g.fillStyle = '#cfeaff';
    for (let i = 0; i < 28; i++) { const ty = ry + ambH(i) * rh; if (br.some(b => ty > b[0] - 0.2 && ty < b[1] + 0.2)) continue; const s = Math.sin(t / (24 + i % 11) + i * 1.9); if (s > 0.5) { const k = (s - 0.5) * 2, x = X(rx + ambH(i + 50) * rw), y = Y(ty) + ((t / 6 + i * 17) % 10); spark(x, y, 0.65 * k, 1.5); g.globalAlpha = 0.25 * k; g.fillRect(x - 3, y, 6, 0.5); } }
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < T.mist; i++) { const p = ((t / (1500 + i * 220) + i * 0.19) % 1.4) - 0.2, y = oy + mh * (0.06 + 0.88 * ambH(i + 20)) + Math.sin(t / 240 + i) * 3; ambBlob(g, 'blob', '215,230,245', ox + mw * (i % 2 ? 1 - p : p), y, 240 + ambH(i) * 100, 66, 0.2); }
  } else if (ch === 'map_ch3') {
    for (let i = 0; i < T.fog; i++) { const p = ((t / (2300 + i * 260) + i * 0.17) % 1.4) - 0.2; ambBlob(g, 'blob', '190,210,225', ox + mw * (i % 2 ? 1 - p : p), oy + mh * (0.1 + 0.8 * ambH(i + 7)) + Math.sin(t / 260 + i) * 5, 260 + ambH(i) * 120, 90, 0.17); }
    g.globalCompositeOperation = 'lighter';
    T.glow.forEach((m, i) => { const pu = 0.65 + 0.35 * Math.sin(t / 30 + i * 1.3); glow(m[0], m[1], 1.5, '70,190,255', 0.45 * pu); for (let j = 0; j < 2; j++) { const p = ((t / (170 + j * 40) + ambH(i * 3 + j)) % 1); g.fillStyle = '#a8f0ff'; spark(X(m[0] + Math.sin(p * 6 + i + j) * 0.5 + (j ? 0.4 : -0.3)), Y(m[1] - p * 1.8), 0.9 * Math.sin(p * 3.1416), 1.3); } });
    g.globalCompositeOperation = 'source-over';
  } else if (ch === 'map_ch4') {
    g.globalCompositeOperation = 'lighter';
    T.fire.forEach((f, i) => { const fl = 0.7 + 0.3 * Math.sin(t / 5 + i * 2.1) * Math.sin(t / 9 + i); glow(f[0], f[1], 1.7, '255,120,30', 0.38 * fl); glow(f[0], f[1] + 0.1, 0.8, '255,210,110', 0.45 * fl);
      for (let j = 0; j < 2; j++) { const p = ((t / (90 + j * 30) + ambH(i * 2 + j)) % 1); g.fillStyle = j ? '#ffb040' : '#ff7a28'; spark(X(f[0] + Math.sin(p * 7 + i) * 0.5 + j * 0.3), Y(f[1] - 0.2 - p * 2.6), 0.9 * (1 - p), 1.2); } });
    g.globalCompositeOperation = 'source-over';
    T.smoke.forEach((s, i) => { for (let j = 0; j < 2; j++) { const p = ((t / 260 + j * 0.5 + i * 0.3) % 1); ambBlob(g, 'blob', '60,55,60', X(s[0] + p * 1.3), Y(s[1] - p * 3), 30 + p * 40, 20 + p * 30, 0.28 * (1 - p)); } });
    g.fillStyle = '#b8b0b0'; for (let i = 0; i < T.ash; i++) { const p = ((t / (700 + i * 40) + ambH(i + 3)) % 1); spark(ox + ambH(i + 30) * mw + Math.sin(p * 8 + i) * 4 + p * 14, oy + mh * p, 0.55 * Math.sin(p * 3.1416), 1.1); }
  } else if (ch === 'map_ch5') {
    g.globalCompositeOperation = 'lighter'; g.fillStyle = '#ffb864';   // dusk light shafts: slanted soft bands (stacked polygons)
    for (let i = 0; i < T.shafts; i++) { const x = ox + mw * (0.44 + i * 0.2) + Math.sin(t / 400 + i) * 6, w = 34 + i * 12, a = 0.035 + 0.02 * Math.sin(t / 150 + i * 2), sk = mh * 0.5;
      for (let k = 0; k < 4; k++) { const ww = w * (1 - k * 0.22); g.globalAlpha = a; g.beginPath(); g.moveTo(x + w / 2 - ww / 2, oy); g.lineTo(x + w / 2 + ww / 2, oy); g.lineTo(x + w / 2 + ww / 2 - sk, oy + mh); g.lineTo(x + w / 2 - ww / 2 - sk, oy + mh); g.fill(); } }
    g.globalCompositeOperation = 'lighter';
    T.torch.forEach((f, i) => { const fl = 0.7 + 0.3 * Math.sin(t / 5 + i * 2.1) * Math.sin(t / 8 + i); glow(f[0], f[1], 2.1, '255,140,50', 0.45 * fl); glow(f[0], f[1], 0.8, '255,220,130', 0.4 * fl); const p = ((t / 100 + ambH(i)) % 1); g.fillStyle = '#ffc060'; spark(X(f[0] + Math.sin(p * 6 + i) * 0.4), Y(f[1] - 0.3 - p * 2), 0.9 * (1 - p), 1.2); });
    g.globalCompositeOperation = 'source-over';
  } else if (ch === 'map_ch6') {
    g.globalCompositeOperation = 'lighter'; const pu = 0.5 + 0.5 * Math.sin(t / 45), A = T.altar;
    glow(A[0], A[1], 5.2, '150,70,255', 0.28 + 0.2 * pu); glow(A[0], A[1], 2.2, '210,150,255', 0.3 + 0.25 * pu);
    T.runes.forEach((r, i) => glow(r[0], r[1], 1.5, '170,100,255', 0.25 + 0.25 * Math.sin(t / 38 + i * 2)));
    T.flame.forEach((f, i) => { const fl = 0.75 + 0.25 * Math.sin(t / 6 + i * 1.7) * Math.sin(t / 11 + i); glow(f[0], f[1], 1.5, '190,100,255', 0.4 * fl); });
    g.fillStyle = '#ffffff'; for (let i = 0; i < T.stars; i++) { const r = T.sky[i % T.sky.length], s = Math.sin(t / (20 + i % 17) + i * 3.1); if (s > 0) spark(X(r[0] + ambH(i) * r[2]), Y(r[1] + ambH(i + 60) * r[3]), 0.25 + 0.7 * s * s, i % 5 ? 1 : 1.8); }
    g.fillStyle = '#e0c0ff'; for (let i = 0; i < T.motes; i++) { const p = ((t / (240 + i * 20) + ambH(i + 8)) % 1), a = i % 2 ? 4.2 : 2.6; spark(X(A[0] + (ambH(i) - 0.5) * a * 2 + Math.sin(p * 7 + i) * 0.5), Y(A[1] + 1.4 - p * 6), 0.85 * Math.sin(p * 3.1416), 1.3); }
    g.globalCompositeOperation = 'source-over';
  }
  g.restore(); g.globalAlpha = 1;
}
