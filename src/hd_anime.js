// ===================== ANIME-STYLE DIALOG PORTRAITS (192x192, smooth vector, cel shading) =====================
// Head-and-shoulders busts of the four heroes, painted with flat colours + one shadow tone + highlights + dark line art.
// Used by drawPortrait via animeOf(id, happy). Not pixelized on purpose.
function animeBust(id, mood) {
  const L = HERO_STYLE[id], S = 192, c = mkCanvas(S, S), x = c.getContext('2d'); x.lineJoin = 'round'; x.lineCap = 'round';
  const happy = mood === 'happy';
  const sh = (col, k) => { const a = hex(col); return `rgb(${clamp(Math.round(a[0] * k), 0, 255)},${clamp(Math.round(a[1] * k), 0, 255)},${clamp(Math.round(a[2] * k), 0, 255)})`; };
  let SM = false;
  const lens = (a,b,c,d,e,f) => [[a,b],[c,d,e,f],[(a+e)/2+(c-(a+e)/2)*0.35,(b+f)/2+(d-(b+f)/2)*0.35,a,b]];
  const P = segs => { if (SM && segs.length > 4 && segs.every(q => q.length === 2)) { const n = segs.length, m = i => { const a = segs[(i + n) % n], b = segs[(i + 1 + n) % n]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }; x.beginPath(); const m0 = m(-1); x.moveTo(m0[0], m0[1]); for (let i = 0; i < n; i++) { const e = m(i); x.quadraticCurveTo(segs[i][0], segs[i][1], e[0], e[1]); } x.closePath(); return; } x.beginPath(); x.moveTo(segs[0][0], segs[0][1]); for (let i = 1; i < segs.length; i++) { const s = segs[i]; if (s.length === 6) x.bezierCurveTo(...s); else if (s.length === 4) x.quadraticCurveTo(...s); else x.lineTo(...s); } x.closePath(); };
  // fill + line, with an optional shadow shape (clipped to the main shape) and highlight shape
  const part = (segs, col, o = {}) => {
    SM = o.sm !== false;
    P(segs); x.fillStyle = col; x.fill();
    if (o.shade) { x.save(); P(segs); x.clip(); x.fillStyle = o.shadeCol || sh(col, 0.72); for (const s of [].concat(o.shade)) { P(s); x.fill(); } x.restore(); }
    if (o.hi) { x.save(); P(segs); x.clip(); x.fillStyle = o.hiCol || sh(col, 1.28); for (const s of [].concat(o.hi)) { P(s); x.fill(); } x.restore(); }
    P(segs); x.lineWidth = o.lw || 2.4; x.strokeStyle = o.line || sh(col, 0.32); x.stroke();
  };
  const stroke = (segs, col, w) => { x.beginPath(); x.moveTo(segs[0][0], segs[0][1]); for (let i = 1; i < segs.length; i++) { const s = segs[i]; if (s.length === 6) x.bezierCurveTo(...s); else if (s.length === 4) x.quadraticCurveTo(...s); else x.lineTo(...s); } x.strokeStyle = col; x.lineWidth = w; x.stroke(); };
  const circ = (cx, cy, r, col, lw) => { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = col; x.fill(); if (lw) { x.lineWidth = lw; x.strokeStyle = sh(col, 0.35); x.stroke(); } };
  const mirror = segs => segs.map(s => s.map((v, i) => i % 2 === 0 ? S - v : v));
  const pair = (segs, col, o) => { part(segs, col, o); part(mirror(segs), col, o && { ...o, shade: o.shade && [].concat(o.shade).map(mirror), hi: o.hi && [].concat(o.hi).map(mirror) }); };
  const hairCol = L.hair, hl = id === 'zek' ? '#ffffff' : sh(hairCol, 1.45), hs = id === 'zek' ? '#8a90c0' : sh(hairCol, 0.66);
  // ---- soft backdrop glow behind the head ----
  // ---- back hair / hood ----
  if (id === 'lina') {
    part([[40, 160], [26, 110], [30, 62], [58, 28], [96, 20], [134, 28], [162, 62], [166, 110], [152, 160], [96, 150]], '#f6f2ec', { shade: [[[110, 150], [130, 40], [166, 62], [166, 110], [152, 160]]], shadeCol: 'rgba(120,110,150,.35)' });
    part([[46, 150], [36, 100], [44, 62], [96, 44], [148, 62], [156, 100], [146, 150], [96, 140]], '#d8303e', { lw: 2, shade: [[[100, 44], [148, 62], [156, 100], [146, 150], [110, 140]]] });
  }
  if (id === 'lina' || id === 'zek') {
    const long = [[44, 60], [36, 110], [44, 170], [60, 192], [78, 192], [74, 140], [76, 80], [96, 40], [116, 80], [118, 140], [114, 192], [132, 192], [148, 170], [156, 110], [148, 60], [96, 24]];
    part(long, hairCol, { shade: [[[110, 40], [148, 60], [156, 110], [148, 170], [132, 192], [114, 192], [118, 140], [116, 80]]], hi: [[[60, 70], [50, 110], [56, 160], [64, 160], [62, 110], [70, 74]]], hiCol: hl });
  }
  if (id === 'allen') { // red cape behind the shoulders
    part([[30, 192], [34, 150], [58, 136], [134, 136], [158, 150], [162, 192]], '#c42c38', { shade: [[[110, 136], [158, 150], [162, 192], [120, 192]]] });
  }
  // ---- body ----
  const robe = L.kind === 'robe';
  const torso = [[22, 192], [30, 160], [60, 144], [96, 150], [132, 144], [162, 160], [170, 192]];
  part(torso, L.top, { shade: [[[104, 150], [132, 144], [162, 160], [170, 192], [110, 192]]], shadeCol: robe && id === 'lina' ? 'rgba(120,110,160,.35)' : 'rgba(0,0,30,.25)', hi: [[[26, 170], [60, 146], [76, 150], [44, 192], [24, 192]]], hiCol: 'rgba(255,255,255,.18)' });
  // neck
  part([[80, 124], [80, 150], [96, 158], [112, 150], [112, 124]], L.skin, { shade: [[[80, 124], [112, 124], [112, 146], [96, 150], [80, 140]]], shadeCol: 'rgba(160,80,60,.28)', lw: 2 });
  if (id === 'allen') {
    part([[30, 164], [44, 150], [70, 146], [80, 152], [62, 168], [34, 176]], '#cfd6e8', { hi: [[[40, 156], [66, 148], [60, 156], [40, 164]]], hiCol: '#ffffff' });
    part([[34, 168], [62, 160], [64, 166], [36, 174]], '#e8c050', { lw: 1.6 });
    part([[162, 164], [148, 150], [122, 146], [112, 152], [130, 168], [158, 176]], '#aab2cc', {});
    part([[84, 150], [96, 160], [108, 150], [100, 146], [92, 146]], '#1e3a8a', { lw: 2 }); // collar
  } else if (id === 'kai') {
    part([[70, 150], [96, 166], [122, 150], [130, 160], [96, 182], [62, 160]], '#2e9a44', { shade: [[[96, 170], [130, 160], [96, 182]]], hi: [[[70, 152], [90, 164], [74, 164]]], hiCol: '#6adc84' });
    part([[104, 168], [124, 164], [134, 192], [112, 192]], '#2e9a44', { lw: 2 });
    part([[40, 180], [60, 164], [66, 192], [34, 192]], '#7a5230', { lw: 2 });
  } else if (id === 'lina') {
    part([[76, 150], [96, 176], [116, 150], [124, 152], [96, 192], [68, 152]], '#d8303e', { lw: 2 });
    circ(96, 166, 6, '#ffe8a0', 1.6);
    part([[34, 176], [160, 176], [164, 186], [30, 186]], '#e8b0b8', { lw: 1, shade: [] });
  } else {
    part([[46, 150], [60, 140], [132, 140], [148, 150], [136, 166], [96, 176], [56, 166]], '#4a1a78', { hi: [[[52, 150], [64, 144], [92, 144], [80, 160]]], hiCol: '#7a40b0' });
    part([[56, 160], [96, 172], [136, 160], [138, 168], [96, 180], [54, 168]], '#e8c440', { lw: 1.6 });
    circ(96, 178, 6, '#ff70c0', 1.6); circ(94, 176, 2, '#fff');
  }
  // ---- face ----
  const face = [[56, 66], [54, 96], [68, 124], [96, 138], [124, 124], [138, 96], [136, 66], [96, 40]];
  // ears
  for (const k of [-1, 1]) { const ex = 96 + k * 42; part([[ex, 86], [ex + k * 8, 84], [ex + k * 8, 100], [ex, 104]], L.skin, { lw: 2 }); }
  part([[56, 74], [54, 98], [66, 122], [96, 138], [126, 122], [138, 98], [136, 74], [96, 36]], L.skin, {
    shade: [[[96, 44], [136, 74], [138, 98], [126, 122], [110, 130], [118, 100], [114, 78]], [[56, 74], [136, 74], [136, 80], [56, 80]]],
    shadeCol: 'rgba(200,120,90,.16)', lw: 2.6 });
  // blush
  for (const k of [-1, 1]) { const g = x.createRadialGradient(96 + k * 30, 124, 1, 96 + k * 30, 124, 11); g.addColorStop(0, 'rgba(255,110,110,.5)'); g.addColorStop(1, 'rgba(255,110,110,0)'); x.fillStyle = g; x.fillRect(96 + k * 30 - 14, 110, 28, 28); }
  // ---- eyes ----
  const lid = id === 'zek' ? 3 : 0; // half-lidded and calm
  const eye = (ex, ey, k) => {
    if (happy) { stroke([[ex - 14, ey + 4], [ex - 8, ey - 8, ex + 8, ey - 8, ex + 14, ey + 4]], '#2a1620', 4.4); stroke([[ex - 10, ey + 8], [ex, ey + 2, ex + 10, ey + 8]], 'rgba(220,120,120,.0)', 1); return; }
    // anime eye: tall rounded shape, the iris fills almost all of it, only slivers of white at the sides
    const W = 17, T = 19 - lid, B = 17, shp = [[ex - W, ey - 1], [ex - W + 2, ey - T, ex + W - 2, ey - T, ex + W, ey - 1], [ex + W - 1, ey + B, ex - W + 1, ey + B, ex - W, ey - 1]];
    P(shp); x.fillStyle = '#fbfbff'; x.fill();
    x.save(); P(shp); x.clip();
    const g = x.createLinearGradient(0, ey - T, 0, ey + B); g.addColorStop(0, sh(L.iris, 0.32)); g.addColorStop(0.4, sh(L.iris, 0.85)); g.addColorStop(0.75, L.iris); g.addColorStop(1, sh(L.iris, 1.75));
    x.fillStyle = g; x.beginPath(); x.ellipse(ex, ey + 1, 13.5, 17.5, 0, 0, 7); x.fill();
    x.fillStyle = '#10101c'; x.beginPath(); x.ellipse(ex, ey + 1.5, 6.4, 8.8, 0, 0, 7); x.fill();
    // bright crescent along the bottom of the iris
    x.strokeStyle = sh(L.iris, 1.9); x.globalAlpha = 0.55; x.lineWidth = 2.4; x.beginPath(); x.ellipse(ex, ey + 2, 10, 13, 0, 0.35, Math.PI - 0.35); x.stroke(); x.globalAlpha = 1;
    x.fillStyle = 'rgba(30,20,40,.45)'; x.fillRect(ex - W, ey - T - 1, W * 2, 7 + lid); // lid shadow on the iris
    x.restore();
    x.fillStyle = '#fff'; x.beginPath(); x.ellipse(ex - 6, ey - 6, 5, 6, -0.2, 0, 7); x.fill(); x.beginPath(); x.ellipse(ex + 6.5, ey + 8, 2.6, 2.8, 0, 0, 7); x.fill();
    stroke([[ex - W - 1, ey - 1], [ex - W + 3, ey - T - 1, ex + W - 3, ey - T - 1, ex + W + 1, ey - 1]], '#1e1018', 5.6);
    stroke([[ex + k * (W + 1), ey - 3], [ex + k * (W + 8), ey - 8]], '#1e1018', 3.4);
    stroke([[ex - 11, ey + B - 1], [ex, ey + B + 1, ex + 11, ey + B - 1]], 'rgba(120,70,70,.45)', 1.5);
  };
  eye(70, 99, -1); eye(122, 99, 1);
  // brows
  for (const k of [-1, 1]) stroke([[96 + k * 40, 80], [96 + k * 26, 74 + (id === 'allen' ? -3 : 0), 96 + k * 14, 78]], sh(hairCol === '#b8bedc' ? '#8a90b8' : hairCol, 0.6), 3.2);
  // nose, mouth
  stroke([[95, 112], [97, 116]], 'rgba(150,80,60,.8)', 2);
  if (happy) { part([[84, 122], [96, 142], [108, 122], [96, 124]], '#8a2a30', { lw: 2.4 }); part([[90, 130], [96, 128], [102, 130], [96, 138]], '#ff8890', { lw: 0 }); }
  else if (id === 'zek') stroke([[88, 128], [96, 130], [104, 128]], '#8a3a3a', 2.4);
  else stroke([[88, 126], [96, 130], [104, 126]], '#8a3a3a', 2.6);
  // ---- front hair and headgear ----
  const strands = (arr, col) => { for (const s of arr) stroke(s, col, 1.6); };
  if (id === 'allen') {
    const crown = [[48, 82], [40, 40], [66, 14], [96, 8], [126, 14], [152, 40], [144, 82], [136, 70], [120, 52], [96, 60], [72, 52], [56, 70]];
    part(crown, hairCol, { hi: [[[60, 30], [84, 14], [110, 14], [86, 30]]], hiCol: hl, shade: [[[120, 20], [152, 40], [144, 82], [130, 60]]], shadeCol: hs });
    for (const [a, b, c2, d, e, f] of [[48, 54, 30, 40, 38, 72], [70, 28, 60, 4, 88, 22], [104, 18, 124, 0, 126, 24], [136, 34, 160, 28, 146, 54]]) part(lens(a, b, c2, d, e, f), hairCol, { lw: 2.2 });
    part([[42, 58], [96, 40], [150, 58], [150, 68], [96, 52], [42, 70]], '#d8343e', { lw: 2.2, hi: [[[52, 58], [96, 44], [90, 48], [52, 62]]], hiCol: '#ff7078' });
    part([[146, 60], [172, 56], [184, 70], [160, 66], [180, 94], [150, 72]], '#d8343e', { lw: 2.2, shade: [[[160, 66], [180, 94], [150, 72]]], shadeCol: '#a82430' });
    // bangs framing the face
    part([[56, 70], [62, 62], [78, 78], [64, 98], [56, 94]], hairCol, { lw: 2 }); part([[136, 70], [130, 62], [114, 78], [128, 98], [136, 94]], hairCol, { lw: 2, shade: [[[130, 62], [136, 94], [128, 98]]], shadeCol: hs });
    strands([[[70, 22], [80, 40]], [[100, 16], [104, 38]], [[122, 20], [118, 38]]], hs);
  } else if (id === 'kai') {
    part([[50, 86], [44, 44], [70, 20], [96, 14], [126, 20], [150, 44], [142, 86], [134, 68], [116, 50], [96, 58], [76, 50], [58, 68]], hairCol, { hi: [[[62, 34], [90, 18], [104, 18], [76, 36]]], hiCol: hl, shade: [[[120, 22], [150, 44], [142, 86], [128, 56]]], shadeCol: hs });
    for (const [a, b, c2, d, e, f] of [[46, 70, 36, 96, 56, 92], [146, 70, 156, 96, 138, 92], [78, 58, 74, 80, 92, 64], [112, 56, 124, 82, 132, 62]]) part(lens(a, b, c2, d, e, f), hairCol, { lw: 2 });
    part([[44, 52], [96, 34], [148, 52], [150, 64], [96, 48], [42, 66]], '#2e9a44', { lw: 2.2, hi: [[[54, 52], [96, 38], [90, 42], [54, 56]]], hiCol: '#6adc84' });
    part([[146, 54], [176, 44], [186, 60], [160, 58], [182, 84], [150, 66]], '#2e9a44', { lw: 2.2, shade: [[[160, 58], [182, 84], [150, 66]]], shadeCol: '#1e6a2e' });
  } else if (id === 'lina') {
    part([[52, 98], [46, 56], [66, 30], [96, 24], [126, 30], [146, 56], [140, 98], [134, 70], [114, 52], [96, 58], [78, 52], [58, 70]], hairCol, { hi: [[[64, 40], [90, 28], [108, 28], [78, 44]]], hiCol: '#ffc07a', shade: [[[120, 32], [146, 56], [140, 98], [126, 58]]], shadeCol: hs });
    for (const [a, b, c2, d, e, f] of [[60, 66, 70, 80, 86, 62], [100, 56, 112, 78, 126, 62]]) part(lens(a, b, c2, d, e, f), hairCol, { lw: 2 });
    for (const k of [-1, 1]) part([[96 + k * 46, 70], [96 + k * 54, 110], [96 + k * 50, 150], [96 + k * 40, 150], [96 + k * 42, 108], [96 + k * 40, 76]], hairCol, { lw: 2, hi: k < 0 ? [[[56, 80], [50, 110], [48, 140], [52, 140], [54, 110], [58, 82]]] : undefined, hiCol: '#ffc07a' });
    part([[50, 64], [96, 34], [142, 64], [142, 72], [96, 46], [50, 72]], '#d8303e', { lw: 2.2, hi: [[[58, 62], [96, 38], [90, 44], [58, 68]]], hiCol: '#ff6068' });
    stroke([[56, 88], [60, 70]], '#f6f2ec', 3);
  } else {
    part([[52, 98], [46, 54], [66, 26], [96, 20], [126, 26], [146, 54], [140, 98], [134, 70], [114, 50], [96, 56], [78, 50], [58, 70]], hairCol, { hi: [[[64, 36], [92, 24], [108, 24], [80, 40]]], hiCol: '#ffffff', shade: [[[120, 28], [146, 54], [140, 98], [126, 56]]], shadeCol: hs });
    for (const [a, b, c2, d, e, f] of [[62, 66, 70, 88, 88, 64], [104, 58, 118, 84, 130, 66]]) part(lens(a, b, c2, d, e, f), hairCol, { lw: 2, shade: [] });
    part([[44, 52], [50, 28], [96, 14], [142, 28], [148, 52], [96, 38]], '#4a1a78', { lw: 2.2, hi: [[[56, 34], [96, 18], [86, 28]]], hiCol: '#7a40b0' });
    part([[46, 50], [96, 36], [146, 50], [146, 58], [96, 44], [46, 58]], '#e8c440', { lw: 2 });
    circ(96, 44, 7, '#ff70c0', 2); circ(94, 42, 2.4, '#fff');
  }
  // soft light from the upper left over everything
  const gl = x.createLinearGradient(0, 0, S, S); gl.addColorStop(0, 'rgba(255,255,255,.12)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(0,0,30,.12)'); x.fillStyle = gl; x.globalCompositeOperation = 'source-atop'; x.fillRect(0, 0, S, S); x.globalCompositeOperation = 'source-over';
  return c;
}
const ANIME = {};
function animeOf(k, happy) { const key = k + (happy ? '!' : ''); return ANIME[key] || (ANIME[key] = animeBust(k, happy ? 'happy' : 'neutral')); }
