// ===================== BATTLE SPRITES (24x32, side view facing left) =====================
const HERO_LOOK = {
  allen: { skin: '#f4c9a0', eye: '#2a2440', hair: '#8a4e22', hairHi: '#b87038', style: 'spiky', band: '#d8343e',
    top: '#2f62d6', topDk: '#22449a', accent: '#e8b830', legs: '#2e3254', boots: '#5a3418', cape: '#c42c38', capeDk: '#8a1c28', weapon: 'sword' },
  lina: { skin: '#f6d2b0', eye: '#3a2a1a', hair: '#e8a060', hairHi: '#f8c890', style: 'hood', hood: '#f6f2ea', hoodDk: '#d6cfc4', trim: '#d8303e',
    top: '#f6f2ea', topDk: '#d6cfc4', accent: '#d8303e', legs: '#f6f2ea', boots: '#a86a3a', robe: true, weapon: 'staff' },
  kai: { skin: '#e8b888', eye: '#1a1a2a', hair: '#4a2e1a', hairHi: '#6a4428', style: 'bandana', band: '#2e9a44', bandDk: '#1e6a2e',
    top: '#e8d8b0', topDk: '#c0ae86', vest: '#7a5230', vestDk: '#5a3a20', accent: '#d8b040', legs: '#36503a', boots: '#4a2c14', weapon: 'dagger' },
  zek: { skin: '#f2d6c4', eye: '#7a2ab0', hair: '#d4dcf2', hairHi: '#f4f8ff', style: 'long', circlet: '#e8c440',
    top: '#6a2ea4', topDk: '#4a1a78', accent: '#e8c440', legs: '#4e1e78', boots: '#2a1440', robe: true, weapon: 'rod' },
};
function heroSprite(id, pose) {
  const L = HERO_LOOK[id]; const c = mkCanvas(24, 32), x = c.getContext('2d');
  const P = (col, a, b, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), w, h); };
  const line = (x0, y0, x1, y1, col, t = 1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) P(col, x0 + (x1 - x0) * i / n - (t > 1 ? 0.5 : 0), y0 + (y1 - y0) * i / n - (t > 1 ? 0.5 : 0), t, t); };
  const dy = pose === 'kneel' ? 3 : pose === 'hurt' ? 1 : 0; const dx = pose === 'hurt' ? 1 : pose === 'strike' ? -1 : 0;
  const robe = L.robe;
  // ---- cape (behind) ----
  if (L.cape) {
    const sway = pose === 'walk' || pose === 'strike' ? 2 : 0;
    x.fillStyle = L.capeDk; x.beginPath(); x.moveTo(13 + dx, 13 + dy); x.lineTo(17 + dx, 13 + dy); x.lineTo(20 + dx + sway, 27); x.lineTo(14 + dx + sway, 28); x.closePath(); x.fill();
    x.fillStyle = L.cape; x.beginPath(); x.moveTo(13 + dx, 13 + dy); x.lineTo(16 + dx, 13 + dy); x.lineTo(18 + dx + sway, 26); x.lineTo(14 + dx + sway, 27); x.closePath(); x.fill();
  }
  // ---- long hair (behind) ----
  if (L.style === 'long') { P(L.hair, 13 + dx, 6 + dy, 5, 13); P(L.hairHi, 14 + dx, 7 + dy, 1, 10); P(L.hair, 16 + dx, 18 + dy, 2, 2); }
  // ---- back arm ----
  const sh = robe ? L.topDk : (L.vest ? L.topDk : L.topDk);
  if (pose === 'cast') { line(14 + dx, 15 + dy, 9 + dx, 12 + dy, sh, 2); P(L.skin, 8 + dx, 11 + dy, 2, 2); }
  else if (pose === 'win') { line(14 + dx, 15 + dy, 17 + dx, 20 + dy, sh, 2); }
  else { line(14 + dx, 15 + dy, 15 + dx, 20 + dy, sh, 2); P(L.skin, 15 + dx, 21 + dy, 2, 2); }
  // ---- legs ----
  if (!robe) {
    if (pose === 'walk' || pose === 'strike') { line(13, 23, 16, 29, L.legs, 3); line(10, 23, 6, 29, L.legs, 3); P(L.boots, 15, 29, 4, 3); P(L.boots, 4, 29, 4, 3); }
    else if (pose === 'kneel') { P(L.legs, 13, 25, 3, 4); P(L.legs, 8, 25, 6, 3); P(L.boots, 6, 28, 4, 2); P(L.boots, 13, 29, 5, 3); P(L.legs, 8, 27, 3, 3); P(L.boots, 7, 29, 4, 3); }
    else { P(L.legs, 13 + dx, 23, 3, 7); P(L.legs, 9 + dx, 23, 3, 7); P(L.boots, 13 + dx, 29, 4, 3); P(L.boots, 8 + dx, 29, 4, 3); }
  } else {
    // robe skirt
    const hem = 30;
    x.fillStyle = L.topDk; x.beginPath(); x.moveTo(9 + dx, 20 + dy); x.lineTo(16 + dx, 20 + dy); x.lineTo(18 + dx, hem); x.lineTo(6 + dx, hem); x.closePath(); x.fill();
    x.fillStyle = L.top; x.beginPath(); x.moveTo(9 + dx, 20 + dy); x.lineTo(14 + dx, 20 + dy); x.lineTo(15 + dx, hem); x.lineTo(6 + dx, hem); x.closePath(); x.fill();
    if (L.trim) for (let i = 6; i < 18; i += 3) { P(L.trim, i + dx, hem - 2, 2, 1); P(L.trim, i + dx + 0.5, hem - 3, 1, 1); }
    else { P(L.accent, 6 + dx, hem - 1, 12, 1); P(L.accent, 11 + dx, 21 + dy, 1, hem - 21 - dy); }
    P(L.boots, 7 + dx, hem, 4, 2); P(L.boots, 13 + dx, hem, 3, 2);
  }
  // ---- torso ----
  P(L.top, 9 + dx, 13 + dy, 7, 9); P(L.topDk, 14 + dx, 13 + dy, 2, 9);
  if (L.vest) { P(L.vest, 10 + dx, 14 + dy, 6, 7); P(L.vestDk, 14 + dx, 14 + dy, 2, 7); P(L.top, 10 + dx, 14 + dy, 1, 6); }
  if (!robe) { P(L.top, 8 + dx, 20 + dy, 9, 3); P(L.topDk, 14 + dx, 20 + dy, 3, 3); }
  P(L.accent, 9 + dx, 20 + dy, 7, 1);
  if (L.shirt) { P(L.shirt, 9 + dx, 13 + dy, 2, 7); }
  if (L.coat) { P(L.coat, 9 + dx, 13 + dy, 2, 8); P(L.accent, 9 + dx, 21 + dy, 2, 6); }
  if (L.bare) { P(L.skin, 9 + dx, 13 + dy, 6, 2); P(L.accent, 9 + dx, 12 + dy, 5, 1); }
  if (L.band && L.style === 'spiky') { P(L.cape, 9 + dx, 12 + dy, 6, 2); }
  // ---- head ----
  const hx = 7 + dx, hy = 3 + dy;
  P(L.skin, hx + 1, hy + 3, 7, 7); P(L.skin, hx, hy + 5, 2, 3); // face + nose bump
  P(L.skin, hx + 6, hy + 9, 3, 1);
  if (L.style === 'spiky') {
    P(L.hair, hx + 2, hy, 8, 4); P(L.hair, hx + 5, hy + 3, 5, 7); P(L.hair, hx + 1, hy + 1, 2, 3);
    P(L.hair, hx + 3, hy - 1, 2, 1); P(L.hair, hx + 6, hy - 2, 2, 2); P(L.hair, hx + 9, hy - 1, 2, 2); P(L.hair, hx + 10, hy + 2, 1, 4);
    P(L.hairHi, hx + 3, hy, 3, 1); P(L.hairHi, hx + 6, hy - 1, 1, 1);
    P(L.band, hx + 1, hy + 3, 9, 1); P(L.band, hx + 10, hy + 3, 2, 2); P(L.band, hx + 11, hy + 5, 1, 2);
  } else if (L.style === 'messy') {
    P(L.hair, hx + 1, hy, 9, 3); P(L.hair, hx + 6, hy + 2, 4, 8); P(L.hair, hx, hy + 2, 2, 2); P(L.hair, hx + 3, hy + 3, 1, 1);
    P(L.hair, hx + 2, hy - 1, 3, 1); P(L.hair, hx + 6, hy - 1, 3, 1); P(L.hair, hx + 10, hy + 1, 2, 5); P(L.hair, hx + 9, hy + 9, 2, 2);
    P(L.hairHi, hx + 3, hy, 4, 1); P(L.hairHi, hx + 7, hy + 3, 1, 4);
  } else if (L.style === 'bob') {
    P(L.hair, hx + 1, hy, 9, 3); P(L.hair, hx + 1, hy + 3, 2, 1); P(L.hair, hx + 6, hy + 2, 4, 10); P(L.hair, hx + 5, hy + 9, 2, 3);
    P(L.hairHi, hx + 2, hy, 5, 1); P(L.hairHi, hx + 7, hy + 3, 1, 6); P(L.hairHi, hx + 4, hy + 1, 2, 1);
  } else if (L.style === 'short') {
    P(L.hair, hx + 1, hy, 9, 3); P(L.hair, hx + 6, hy + 2, 4, 7); P(L.hair, hx + 1, hy + 3, 2, 1); P(L.hair, hx + 2, hy - 1, 6, 1);
    P(L.hairHi, hx + 3, hy, 4, 1); P(L.hairHi, hx + 7, hy + 3, 1, 4);
  } else if (L.style === 'hood') {
    P(L.hair, hx + 1, hy + 3, 3, 2);
    P(L.hood, hx + 1, hy, 9, 3); P(L.hood, hx + 4, hy + 3, 6, 9); P(L.hood, hx + 9, hy + 1, 2, 3); P(L.hood, hx + 11, hy + 2, 1, 2);
    P(L.hoodDk, hx + 8, hy + 4, 2, 8); P(L.trim, hx + 4, hy + 3, 1, 8); P(L.trim, hx + 1, hy + 2, 4, 1);
  } else if (L.style === 'bandana') {
    P(L.hair, hx + 5, hy + 3, 5, 7); P(L.hair, hx + 2, hy + 3, 2, 2);
    P(L.band, hx + 1, hy, 9, 3); P(L.band, hx + 2, hy - 1, 6, 1); P(L.bandDk, hx + 1, hy + 2, 9, 1);
    const fl = pose === 'walk' || pose === 'strike' ? 1 : 0;
    P(L.band, hx + 10, hy + 1, 2, 2); P(L.band, hx + 12, hy + 2 - fl, 2, 1); P(L.bandDk, hx + 12, hy + 3, 3, 1); P(L.band, hx + 14, hy + 3 + fl, 2, 1);
  } else if (L.style === 'long') {
    P(L.hair, hx + 1, hy, 9, 4); P(L.hair, hx + 6, hy + 3, 4, 7); P(L.hair, hx + 1, hy + 3, 1, 3);
    P(L.hairHi, hx + 2, hy, 5, 1); P(L.circlet, hx + 1, hy + 2, 8, 1); P('#ff70c0', hx + 1, hy + 2, 1, 1);
  }
  // eye
  if (pose === 'hurt' || pose === 'ko') P(L.eye, hx + 2, hy + 6, 2, 1);
  else { P(L.eye, hx + 2, hy + 5, 1, 2); P('#ffffff', hx + 3, hy + 5, 1, 1); }
  P('#c88a70', hx + 1, hy + 8, 2, 1); // mouth/cheek shade
  if (L.glasses) { P(L.glasses, hx + 1, hy + 4, 4, 1); P(L.glasses, hx + 4, hy + 5, 1, 1); P(L.glasses, hx + 5, hy + 4, 3, 1); P('#cfe4ff', hx + 3, hy + 5, 1, 1); }
  // ---- front arm + weapon ----
  const S = [10 + dx, 15 + dy]; let H;
  if (pose === 'strike') H = [3, 14]; else if (pose === 'walk') H = [7, 11]; else if (pose === 'cast') H = [5, 13 + dy];
  else if (pose === 'win') H = [10, 6]; else if (pose === 'hurt') H = [13, 19]; else H = [8 + dx, 21 + dy];
  const sleeve = L.vest ? L.top : L.top;
  line(S[0], S[1], H[0], H[1], sleeve, 2); P(L.skin, H[0] - 1, H[1] - 1, 2, 2);
  const W = L.weapon; let ang; // weapon angle (radians, 0 = pointing left)
  if (pose === 'strike') ang = 0.35; else if (pose === 'walk') ang = -1.9; else if (pose === 'win') ang = -1.57; else if (pose === 'cast') ang = -1.57; else if (pose === 'hurt') ang = -2.6; else ang = W === 'staff' || W === 'rod' ? -1.57 : -1.2;
  const len = W === 'sword' ? 11 : W === 'dagger' ? 6 : 15;
  const ex = H[0] - Math.cos(ang) * len, ey = H[1] + Math.sin(ang) * len;
  if (W === 'sword' || W === 'dagger') {
    line(H[0] - 1, H[1] - 1, ex, ey, '#dfe6f4', 1); line(H[0] - 1 + Math.sin(ang) * 0.9, H[1] - 1 + Math.cos(ang) * 0.9, ex + Math.sin(ang), ey + Math.cos(ang), '#9aa4bc', 1);
    P('#e8b830', H[0] - 2, H[1] - 2, 3, 1); P('#5a3418', H[0] - 1, H[1], 1, 2);
  } else if (W === 'orb') {
    const ox = H[0] - 2, oy = H[1] - 4;
    x.fillStyle = '#5a3aa8'; x.beginPath(); x.arc(ox, oy, 3.2, 0, 7); x.fill(); x.fillStyle = '#b89aff'; x.beginPath(); x.arc(ox - 0.6, oy - 0.6, 2.2, 0, 7); x.fill();
    P('#ffffff', ox - 2, oy - 2, 1, 1); P('#e8dcff', ox, oy, 1, 1);
  } else {
    const gx = H[0] - Math.cos(ang) * (len - 2), gy = H[1] + Math.sin(ang) * (len - 2);
    line(H[0] + Math.cos(ang) * 6, H[1] - Math.sin(ang) * 6, gx, gy, '#8a5a2a', 1);
    const gem = W === 'staff' ? '#e04050' : '#b060ff';
    P('#e8c040', gx - 1, gy - 1, 3, 3); P(gem, gx - 1, gy - 2, 3, 3); P('#ffffff', gx - 1, gy - 2, 1, 1);
  }
  pixelize(c, '#1a1020');
  return stylize(c, { grad: true });
}
function buildHeroBattle() {
  for (const id in HERO_LOOK) {
    const S = {}; for (const p of ['idle', 'walk', 'strike', 'cast', 'hurt', 'win', 'kneel']) S[p] = heroSprite(id, p);
    const ko = mkCanvas(32, 24); { const k = ko.getContext('2d'); k.translate(0, 24); k.rotate(-Math.PI / 2); k.drawImage(S.hurt, 0, 0); }
    S.ko = ko; S.flash = {}; for (const p in S) if (p !== 'flash') S.flash[p] = silhouette(S[p]);
    SPR[id].hb = S;
  }
}
