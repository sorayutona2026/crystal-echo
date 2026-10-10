// ===================== HD-2D RENDER PIPELINE =====================
// World is drawn into a 256x224 pixel layer (crisp pixels), then composited onto the 3x main canvas
// with smooth lighting: colored light map, bloom, tilt-shift depth of field, light shafts, particles, vignette.
const pcv = mkCanvas(SW, SH), pctx = pcv.getContext('2d');
const shadowC = mkCanvas(SW, SH), shx = shadowC.getContext('2d');
const halfC = mkCanvas(SW / 2, SH / 2), hlx = halfC.getContext('2d');
const qC = mkCanvas(SW / 4, SH / 4), qx = qC.getContext('2d', { willReadFrequently: true });
const bloomC = mkCanvas(SW / 4, SH / 4), bx = bloomC.getContext('2d');
const lightC = mkCanvas(SW / 2, SH / 2), lx = lightC.getContext('2d');
const hiC = mkCanvas(SW / 2, SH / 2), hix = hiC.getContext('2d');
let LIGHTS = [];
const QUALITY = { level: 2 }; // 2 = full, 1 = lighter, 0 = minimal (auto-adjusted by frame time)
const W3 = SW * SCALE, H3 = SH * SCALE;

function beginWorld(clear) {
  ctx = pctx; pctx.setTransform(1, 0, 0, 1, 0, 0); pctx.imageSmoothingEnabled = false; pctx.globalAlpha = 1; pctx.globalCompositeOperation = 'source-over';
  if (clear) { pctx.fillStyle = clear; pctx.fillRect(0, 0, SW, SH); } else pctx.clearRect(0, 0, SW, SH);
  LIGHTS = [];
}
function addLight(x, y, r, col, i = 1) { LIGHTS.push({ x, y, r, col, i }); }
function downsample(src) {
  hlx.imageSmoothingEnabled = true; hlx.globalCompositeOperation = 'copy'; hlx.drawImage(src, 0, 0, SW / 2, SH / 2);
  qx.imageSmoothingEnabled = true; qx.globalCompositeOperation = 'copy'; qx.drawImage(halfC, 0, 0, SW / 4, SH / 4);
  return qC;
}
const ENV = {
  world: { clouds: 1, grade: ['#ffd08a', 0.13], bloom: 0.35, thr: 228, dof: [0.85, 0.55], rays: 0.5, vignette: 0.42, parts: 'motes' },
  worldS: { clouds: 1, grade: ['#ffb070', 0.16], bloom: 0.35, thr: 228, dof: [0.85, 0.55], rays: 0.45, vignette: 0.45, parts: 'motes' },
  town: { grade: ['#ffd9a0', 0.14], bloom: 0.35, thr: 222, dof: [0.75, 0.5], rays: 0.6, vignette: 0.4, parts: 'petals' },
  rosa: { grade: ['#a8d8ff', 0.1], bloom: 0.35, thr: 222, dof: [0.75, 0.5], rays: 0.55, vignette: 0.4, parts: 'motes' },
  inside: { grade: ['#ffb060', 0.12], ambient: '#6a5a6e', halo: 1.3, bloom: 0.5, thr: 190, dof: [0.6, 0.4], vignette: 0.55, parts: 'dust' },
  cave: { grade: ['#4060a0', 0.08], ambient: '#4a4568', halo: 1.6, bloom: 0.7, thr: 150, dof: [0.7, 0.5], vignette: 0.45, parts: 'dust', torch: true },
  tower: { grade: ['#8a70ff', 0.08], ambient: '#6a6496', halo: 1.3, bloom: 0.55, thr: 200, dof: [0.7, 0.5], vignette: 0.45, parts: 'sparks' },
  shrine: { grade: ['#70ffc0', 0.16], ambient: '#7a9a8e', halo: 1.2, bloom: 0.5, thr: 200, dof: [0.7, 0.5], rays: 0.5, vignette: 0.45, parts: 'leaves' },
  tower3: { grade: ['#70c8ff', 0.12], ambient: '#4e5888', halo: 1.3, bloom: 0.65, thr: 200, dof: [0.6, 0.45], vignette: 0.55, parts: 'sparks' },
  battleDay: { grade: ['#ffd08a', 0.1], bloom: 0.3, thr: 232, vignette: 0.42, parts: 'motes' },
  battleCave: { grade: ['#4060a0', 0.12], bloom: 0.5, thr: 180, vignette: 0.6, parts: 'dust' },
  battleTower: { grade: ['#8a70ff', 0.12], bloom: 0.5, thr: 180, vignette: 0.55, parts: 'sparks' },
  battleShrine: { grade: ['#70ffc0', 0.12], bloom: 0.45, thr: 190, vignette: 0.5, parts: 'leaves' },
  dream: { grade: ['#fff0d0', 0.3], bloom: 0.8, thr: 170, dof: [0.9, 0.7], rays: 0.9, vignette: 0.7, parts: 'motes' },
  title: { grade: ['#6a80ff', 0.1], bloom: 1.0, thr: 110, dof: [0.9, 0.5], rays: 0.35, vignette: 0.6, parts: 'sparks' },
};
function envFor(mapId, set) {
  if (G.flags.dream) return ENV.dream;
  const e = envBase(mapId, set);
  // once the wind returns, leaves blow across the open air
  return G.flags.garva && (set === 'world' || set === 'town') ? { ...e, parts: 'leaves' } : e;
}
function envBase(mapId, set) {
  if (mapId === 'world') return G.p.y >= 14 ? ENV.worldS : ENV.world;
  if (mapId === 'rosa') return ENV.rosa;
  if (mapId === 'tower3') return ENV.tower3;
  if (mapId === 'shrine') return ENV.shrine;
  return ENV[set] || ENV.town;
}
// cached gradients
let dofGradCache = null, vigCache = {};
function dofMask(top, bottom) {
  const k = top + ':' + bottom; if (dofGradCache && dofGradCache.k === k) return dofGradCache.g;
  const g = hix.createLinearGradient(0, 0, 0, SH / 2);
  g.addColorStop(0, `rgba(0,0,0,${top})`); g.addColorStop(0.3, 'rgba(0,0,0,0)'); g.addColorStop(0.72, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${bottom})`);
  dofGradCache = { k, g }; return g;
}
function vignette(a) {
  if (!vigCache[a]) { const g = MAIN.createRadialGradient(W3 / 2, H3 / 2, H3 * 0.35, W3 / 2, H3 / 2, H3 * 0.85); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(4,3,12,${a})`); vigCache[a] = g; }
  return vigCache[a];
}
let bloomTick = 0;
function bloomPass(q, thr, k, reuse) {
  if (!(reuse && (bloomTick++ % 3))) {
  const d = qx.getImageData(0, 0, SW / 4, SH / 4); const p = d.data; const s = 255 / (255 - thr);
  for (let i = 0; i < p.length; i += 4) {
    const l = Math.max(p[i], p[i + 1], p[i + 2]); const v = l > thr ? (l - thr) * s / 255 : 0;
    p[i] *= v; p[i + 1] *= v; p[i + 2] *= v; p[i + 3] = 255;
  }
  bx.putImageData(d, 0, 0);
  }
  const M = MAIN; M.save(); M.setTransform(1, 0, 0, 1, 0, 0); M.imageSmoothingEnabled = true; M.globalCompositeOperation = 'lighter';
  M.globalAlpha = k * 1.3; M.drawImage(bloomC, -12, -12, W3 + 24, H3 + 24);
  M.restore();
}
function hexA(col, a) { const c = hex(col); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
// draw the pixel layer crisp onto the main canvas, with optional tilt-shift blur; returns the downsampled layer
function layerToMain(dof) {
  const M = MAIN; ctx = MAIN;
  M.save(); M.setTransform(1, 0, 0, 1, 0, 0); M.globalCompositeOperation = 'source-over'; M.globalAlpha = 1;
  M.imageSmoothingEnabled = false; M.drawImage(pcv, 0, 0, W3, H3);
  const q = downsample(pcv);
  if (dof && QUALITY.level >= 1) {
    hix.globalCompositeOperation = 'copy'; hix.imageSmoothingEnabled = true; hix.drawImage(halfC, 0, 0);
    hix.globalCompositeOperation = 'destination-in'; hix.fillStyle = dofMask(dof[0], dof[1]); hix.fillRect(0, 0, SW / 2, SH / 2);
    M.imageSmoothingEnabled = true; M.drawImage(hiC, 0, 0, W3, H3);
  }
  M.restore(); resetT();
  return q;
}
function finishPost(env, q) {
  const M = MAIN; ctx = MAIN;
  M.save(); M.setTransform(1, 0, 0, 1, 0, 0);
  if (env.ambient) {
    lx.globalCompositeOperation = 'source-over'; lx.fillStyle = env.ambient; lx.fillRect(0, 0, SW / 2, SH / 2);
    lx.globalCompositeOperation = 'lighter';
    for (const L of LIGHTS) {
      const g = lx.createRadialGradient(L.x / 2, L.y / 2, 0, L.x / 2, L.y / 2, L.r / 2);
      g.addColorStop(0, hexA(L.col, Math.min(1, L.i))); g.addColorStop(0.5, hexA(L.col, 0.45 * L.i)); g.addColorStop(1, hexA(L.col, 0));
      lx.fillStyle = g; lx.fillRect(L.x / 2 - L.r / 2, L.y / 2 - L.r / 2, L.r, L.r);
    }
    M.globalCompositeOperation = 'multiply'; M.imageSmoothingEnabled = true; M.drawImage(lightC, 0, 0, W3, H3);
  }
  M.globalCompositeOperation = 'lighter';
  const hk = env.halo || 1;
  for (const L of LIGHTS) {
    const x = L.x * SCALE, y = L.y * SCALE, r = L.r * SCALE * (hk > 1 ? 0.5 : 0.35);
    const g = M.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, hexA(L.col, Math.min(0.6, 0.3 * L.i * hk))); g.addColorStop(0.45, hexA(L.col, Math.min(0.3, 0.12 * L.i * hk))); g.addColorStop(1, hexA(L.col, 0));
    M.fillStyle = g; M.fillRect(x - r, y - r, r * 2, r * 2);
  }
  M.restore();
  if (env.bloom && q && QUALITY.level >= 1) bloomPass(q, env.thr || 150, env.bloom, QUALITY.level < 2);
  M.save(); M.setTransform(1, 0, 0, 1, 0, 0);
  if (env.grade) { M.globalCompositeOperation = 'soft-light'; M.globalAlpha = env.grade[1] * 2.2; M.fillStyle = env.grade[0]; M.fillRect(0, 0, W3, H3); M.globalAlpha = 1; }
  if (env.clouds) drawCloudShadows();
  if (env.rays && QUALITY.level >= 2) drawRays(env.rays);
  M.globalCompositeOperation = 'source-over';
  drawParticles(QUALITY.level >= 1 ? env.parts : null);
  if (env.vignette) { M.fillStyle = vignette(env.vignette); M.fillRect(0, 0, W3, H3); }
  M.restore();
  resetT();
}
function postWorld(env) { const q = layerToMain(env.dof); finishPost(env, q); }
function drawCloudShadows() {
  const M = MAIN; M.globalCompositeOperation = 'source-over'; const t = G.flags.garva ? G.frame * 0.25 : 0; // still air until the crystal is saved
  for (let i = 0; i < 3; i++) {
    const span = 900; const wx = ((i * 330 + t) % span) - 150, wy = (i * 211) % 400 - 60;
    const x = (wx - CAM.x % span) * SCALE, y = (wy - CAM.y % 400) * SCALE; const R = (70 + i * 18) * SCALE;
    for (const ox of [0, span * SCALE]) for (const oy of [0, 400 * SCALE]) {
      const X = x + ox, Y = y + oy; if (X < -R || X > W3 + R || Y < -R || Y > H3 + R) continue;
      const g = M.createRadialGradient(X, Y, R * 0.2, X, Y, R); g.addColorStop(0, 'rgba(16,24,50,.2)'); g.addColorStop(1, 'rgba(16,24,50,0)');
      M.fillStyle = g; M.save(); M.translate(X, Y); M.scale(1.6, 0.8); M.translate(-X, -Y); M.fillRect(X - R, Y - R, R * 2, R * 2); M.restore();
    }
  }
}
function drawRays(a) {
  const M = MAIN; M.globalCompositeOperation = 'screen'; const t = G.frame / 60;
  for (let i = 0; i < 4; i++) {
    const x0 = (i * 0.27 + 0.05) * W3 + Math.sin(t * 0.3 + i) * 20, w = 50 + i * 18;
    const al = a * (0.10 + 0.06 * Math.sin(t * 0.7 + i * 1.7));
    const g = M.createLinearGradient(0, 0, 0, H3 * 0.9); g.addColorStop(0, `rgba(255,236,190,${al})`); g.addColorStop(1, 'rgba(255,236,190,0)');
    M.fillStyle = g; M.beginPath(); M.moveTo(x0, -10); M.lineTo(x0 + w, -10); M.lineTo(x0 + w + 260, H3); M.lineTo(x0 + 200, H3); M.closePath(); M.fill();
  }
}
// ---------- particles (screen space, high-res) ----------
const PARTS = [];
let partKind = null;
function drawParticles(kind) {
  const M = MAIN;
  if (kind !== partKind) { PARTS.length = 0; partKind = kind; }
  if (!kind) return;
  const max = { motes: 28, petals: 16, dust: 26, sparks: 30, leaves: 18 }[kind] || 0;
  while (PARTS.length < max) PARTS.push(newPart(kind, PARTS.length < max * 0.8));
  M.globalCompositeOperation = kind === 'petals' || kind === 'leaves' ? 'source-over' : 'lighter';
  for (let i = PARTS.length - 1; i >= 0; i--) {
    const p = PARTS[i]; p.t++; p.x += p.vx + Math.sin((p.t + p.ph) / 40) * p.sw; p.y += p.vy;
    if (p.t > p.life || p.y < -20 || p.y > H3 + 20 || p.x < -20 || p.x > W3 + 20) { PARTS[i] = newPart(kind, false); continue; }
    const a = Math.min(1, p.t / 30, (p.life - p.t) / 30) * p.a;
    if (kind === 'petals' || kind === 'leaves') { M.globalAlpha = a; M.fillStyle = p.col; M.save(); M.translate(p.x, p.y); M.rotate(p.t / 20 + p.ph); M.fillRect(-3, -1.5, 6, 3); M.restore(); M.globalAlpha = 1; continue; }
    const r = p.r * (kind === 'sparks' ? (0.7 + 0.3 * Math.sin(p.t / 6 + p.ph)) : 1);
    const g = M.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3); g.addColorStop(0, hexA(p.col, a)); g.addColorStop(0.3, hexA(p.col, a * 0.5)); g.addColorStop(1, hexA(p.col, 0));
    M.fillStyle = g; M.fillRect(p.x - r * 3, p.y - r * 3, r * 6, r * 6);
  }
  M.globalCompositeOperation = 'source-over';
}
function newPart(kind, anywhere) {
  const R = Math.random;
  const p = { x: R() * W3, y: anywhere ? R() * H3 : H3 + 10, t: anywhere ? Math.floor(R() * 200) : 0, ph: R() * 100, life: 300 + R() * 300, sw: 0.3, a: 0.6, r: 2, vx: 0, vy: -0.3, col: '#ffe6a8' };
  if (kind === 'motes') { p.vx = 0.15; p.vy = -0.25 - R() * 0.2; p.r = 1.6 + R() * 1.5; p.col = R() < 0.7 ? '#ffe6a8' : '#ffffff'; p.a = 0.55; }
  if (kind === 'dust') { p.vx = 0.05; p.vy = -0.12 - R() * 0.1; p.r = 1.2 + R() * 1.2; p.col = '#b8c8ff'; p.a = 0.35; }
  if (kind === 'sparks') { p.vy = -0.4 - R() * 0.4; p.r = 1.5 + R() * 1.6; p.col = R() < 0.6 ? '#8ae8ff' : '#d8b0ff'; p.a = 0.8; }
  if (kind === 'leaves') { p.y = R() * H3; p.x = anywhere ? R() * W3 : -10; p.vx = 1.6 + R() * 1.2; p.vy = 0.15 + R() * 0.3; p.sw = 0.9; p.col = R() < 0.5 ? '#8ad070' : '#c8f0a0'; p.a = 0.8; }
  if (kind === 'petals') { p.y = anywhere ? R() * H3 : -10; p.x = anywhere ? R() * W3 : R() * W3 * 0.8; p.vx = 0.6 + R() * 0.4; p.vy = 0.7 + R() * 0.4; p.sw = 0.6; p.col = R() < 0.6 ? '#ffc6d8' : '#fff0f4'; p.a = 0.85; }
  return p;
}

// ---------- tall-object shadows (drawn into pixel layer under tall tiles) ----------
const WALLS = new Set(['rock', 'tWall', 'inWall']);
const GRASSY = new Set(['grass', 'flowers', 'tree', 'fence', 'sign', 'lamp', 'well', 'barrel', 'hills', 'forest']);
const FRINGED = new Set(['path', 'paving', 'sand']);
const CAM = { x: 0, y: 0 };
const TALL_RECT = new Set(['roof', 'roofB', 'wall', 'window', 'door', 'rockFace', 'rockTop', 'tWallFace', 'tWallTop', 'inWallFace', 'inWallTop', 'shelf', 'mountain', 'caveIcon', 'towerIcon', 'fire']);
const TALL_ROUND = new Set(['tree', 'lamp', 'barrel', 'barrelIn', 'well', 'sign', 'pillar', 'crystal', 'boulder', 'plant', 'fence']);
