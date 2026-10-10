// ===================== BATTLE SPRITES (32x40, side view facing left) =====================
// Heads are hand-placed pixel templates (big eyes with a highlight, layered hair); bodies, arms and weapons
// are drawn per pose with three-tone shading, then outlined and shaded by pixelize()/stylize().
const HB_W = 32, HB_H = 40;
// template keys: h hair, H hair light, d hair dark, s skin, S skin shade, e eye line, i iris, w eye shine, m mouth,
// a accessory (headband/hood/bandana/circlet), A accessory dark, g trim or gem
const HERO_LOOK = {
  allen: {
    pal: { h: '#8a4e22', H: '#c47e3c', d: '#5a3014', s: '#f6cfa6', S: '#dca47e', e: '#1e1a30', i: '#3a78d8', w: '#ffffff', m: '#b0605a', a: '#d8343e', A: '#8e1c28' },
    head: ['......h.h.....', '....hhHhhh.h..', '...hHHhhHhhh..', '..hhHhhhhhhhh.', '.hhHhhhhhhhhdh', '.aaaaaaaaaaaaA', '.hhshhhhhhhdAa', 'hssssshhhhhdA.',
      'sseesshhhhdd..', 'seiwssShhhd...', 'seiissSShdd...', '.sssssSSSd....', '.smssSSSS.....', '..sSSSS.......'],
    top: '#2f62d6', topLt: '#5c8cf2', topDk: '#1e3e94', trim: '#e8c050', belt: '#5a3418', legs: '#2e3254', legsDk: '#1c1e36',
    boots: '#7a4a22', bootsDk: '#46280e', cape: '#c42c38', capeDk: '#7a1622', pad: '#d0d8e8', padDk: '#8a94ac', weapon: 'sword',
  },
  lina: {
    pal: { h: '#d07a3a', H: '#f0a860', d: '#9a5020', s: '#f8d8b8', S: '#e0b08c', e: '#2a1a1a', i: '#2e9a6a', w: '#ffffff', m: '#c06060', a: '#f8f4ec', A: '#cfc6d8', g: '#d8303e' },
    head: ['.....aaaaa....', '...aaaaaaaaa..', '..aaaaaaaaaaa.', '.aaaaaaaaaaaaa', '.ggggggaaaaaaa', 'gahhHhhgaaaaAa', 'ghhhhhhhgaaAAa', 'ghsshhhhhgaAAa',
      'ssseeshhhgaAA.', 'seiwssShhgaAA.', 'seiissShhgaAa.', '.sssssSShgaA..', '.smssSSSgaAA..', '..sSSSS.gAA...'],
    top: '#f8f4ec', topLt: '#ffffff', topDk: '#cfc6d8', trim: '#d8303e', belt: '#d8303e', legs: '#f8f4ec', legsDk: '#cfc6d8',
    boots: '#a86a3a', bootsDk: '#6a3e1e', robe: true, sleeve: true, weapon: 'staff', gem: '#e04050',
  },
  kai: {
    pal: { h: '#4a2e1a', H: '#7a5030', d: '#2a180c', s: '#eab88c', S: '#c88e66', e: '#1a1a2a', i: '#8a5a20', w: '#ffffff', m: '#a05a48', a: '#2e9a44', A: '#1a6a2e' },
    head: ['..............', '....aaaaaaa...', '...aaAaaaaaa..', '..aaaaaaaaaaa.', '.aAAAAAAAAAAaa', '.hhhhhhhhhhAaA', '.hshhhhhhhhd.a', 'hssssshhhhhd.A',
      'sseesshhhhdd..', 'seiwssShhhd...', 'seiissSShdd...', '.sssssSSSd....', '.smssSSSS.....', '..sSSSS.......'],
    top: '#ece0bc', topLt: '#fff8e0', topDk: '#c0ae86', vest: '#7a5230', vestDk: '#4e321a', trim: '#d8b040', belt: '#4a2c14', legs: '#3a5a40', legsDk: '#22382a',
    boots: '#5a3418', bootsDk: '#341c0a', weapon: 'dagger',
  },
  zek: {
    pal: { h: '#b8bedc', H: '#e8ecff', d: '#7a80a8', s: '#f4dccc', S: '#d8b4a4', e: '#2a1840', i: '#9a40e0', w: '#ffffff', m: '#c07080', a: '#e8c440', A: '#b08a20', g: '#ff70c0' },
    head: ['....hhhhhh....', '..hhHHhhhhhh..', '.hHHHhhhhhhhh.', '.hHhhhhhhhhdhh', '.aaaaaagaaaahh', '.hhshhhhhdhhhh', 'hsssssshhdhhdh', 'sseesshhhdhhdh',
      'seiwssShhdhhdh', 'seiissSShdhhdh', '.sssssSShdhhdh', '.smssSSShdhhd.', '..sSSSS.hdhd..', '.........hd...'],
    top: '#6a2ea4', topLt: '#9050d0', topDk: '#3e1470', trim: '#e8c440', belt: '#e8c440', legs: '#4e1e78', legsDk: '#2e0e4e',
    boots: '#2a1440', bootsDk: '#160a24', robe: true, sleeve: true, collar: true, weapon: 'rod', gem: '#b060ff',
  },
};
function heroSprite(id, pose) {
  const L = HERO_LOOK[id]; const c = mkCanvas(HB_W, HB_H), x = c.getContext('2d');
  const P = (col, a, b, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), w, h); };
  const line = (x0, y0, x1, y1, col, t = 1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) P(col, x0 + (x1 - x0) * i / n - (t > 1 ? t / 2 - 0.5 : 0), y0 + (y1 - y0) * i / n - (t > 1 ? t / 2 - 0.5 : 0), t, t); };
  const poly = (pts, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.closePath(); x.fill(); };
  // a limb: dark core with a lit upper edge
  const limb = (x0, y0, x1, y1, col, lt, t = 3) => { line(x0, y0, x1, y1, col, t); line(x0 - 0.5, y0 - 1, x1 - 0.5, y1 - 1, lt, 1); };
  const dy = pose === 'kneel' ? 4 : pose === 'hurt' ? 1 : 0, dx = pose === 'hurt' ? 2 : pose === 'strike' ? -2 : 0;
  const moving = pose === 'walk' || pose === 'strike';
  // ---- cape / scarf (behind) ----
  if (L.cape) {
    const sw = moving ? 3 : pose === 'win' ? 1 : 0;
    poly([17 + dx, 16 + dy, 23 + dx, 16 + dy, 27 + dx + sw, 36, 18 + dx + sw, 37], L.capeDk);
    poly([17 + dx, 16 + dy, 21 + dx, 16 + dy, 24 + dx + sw, 35, 18 + dx + sw, 36], L.cape);
    P(L.capeDk, 19 + dx + sw, 34, 3, 1);
  }
  if (L.scarf) { const fl = moving ? 2 : 0; poly([18 + dx, 15 + dy, 23 + dx, 16 + dy, 27 + dx + fl, 19 + dy - fl, 25 + dx + fl, 21 + dy, 20 + dx, 18 + dy], L.scarf); P('#1a6a2e', 24 + dx + fl, 20 + dy - fl, 2, 1); }
  // ---- back arm ----
  const BS = [19 + dx, 18 + dy];
  let BH = pose === 'cast' ? [12 + dx, 14 + dy] : pose === 'win' ? [23 + dx, 26 + dy] : pose === 'strike' ? [22 + dx, 22 + dy] : pose === 'walk' ? [23 + dx, 24 + dy] : [20 + dx, 27 + dy];
  limb(BS[0], BS[1], BH[0], BH[1], L.topDk, L.topDk, L.sleeve ? 4 : 3); P(L.pal.S, BH[0] - 1, BH[1], 2, 2);
  // ---- legs ----
  if (!L.robe) {
    if (moving) {
      limb(17 + dx, 28, 21 + dx, 35, L.legsDk, L.legsDk); limb(14 + dx, 28, 9 + dx, 35, L.legs, '#5a6088');
      P(L.bootsDk, 19 + dx, 34, 5, 4); P(L.boots, 7 + dx, 34, 5, 4); P('#a06a3a', 7 + dx, 34, 4, 1);
    } else if (pose === 'kneel') {
      P(L.legsDk, 16, 31, 4, 5); P(L.legs, 10, 31, 7, 4); P(L.boots, 8, 34, 5, 3); P(L.bootsDk, 17, 35, 6, 4); P(L.legs, 10, 33, 3, 3);
    } else {
      P(L.legsDk, 17 + dx, 28, 4, 8); P(L.legs, 12 + dx, 28, 4, 8); P('#ffffff22', 12 + dx, 28, 1, 7);
      P(L.bootsDk, 17 + dx, 35, 5, 4); P(L.boots, 11 + dx, 35, 5, 4); P('#ffffff30', 11 + dx, 35, 4, 1);
    }
  } else {
    const hem = 38, top = 23 + dy;
    poly([11 + dx, top, 21 + dx, top, 24 + dx, hem, 7 + dx, hem], L.topDk);
    poly([11 + dx, top, 18 + dx, top, 19 + dx, hem, 7 + dx, hem], L.top);
    poly([11 + dx, top, 13 + dx, top, 10 + dx, hem, 7 + dx, hem], L.topLt);
    for (let i = 7; i < 24; i += 1) P(L.trim, i + dx, hem - 1, 1, 1);
    if (id === 'lina') for (let i = 8; i < 22; i += 3) P(L.trim, i + dx, hem - 3, 1, 1);
    else { P(L.trim, 14 + dx, top + 1, 1, hem - top - 2); P(L.trim, 13 + dx, top + 1, 1, 1); }
    P(L.bootsDk, 15 + dx, hem, 5, 2); P(L.boots, 9 + dx, hem, 5, 2);
  }
  // ---- torso ----
  const tx = 11 + dx, ty = 15 + dy;
  P(L.top, tx, ty, 10, 13); P(L.topDk, tx + 7, ty, 3, 13); P(L.topLt, tx, ty + 1, 2, 10);
  if (L.vest) { P(L.vest, tx + 2, ty + 1, 8, 10); P(L.vestDk, tx + 7, ty + 1, 3, 10); P(L.top, tx + 1, ty + 1, 2, 9); P(L.trim, tx + 3, ty + 4, 1, 1); P(L.trim, tx + 3, ty + 7, 1, 1); }
  if (!L.robe) { P(L.top, tx - 1, ty + 10, 12, 4); P(L.topDk, tx + 7, ty + 10, 4, 4); P(L.trim, tx - 1, ty + 13, 12, 1); }
  P(L.belt, tx, ty + 8, 10, 2); P(L.trim, tx + 1, ty + 8, 2, 2);
  if (L.pad) { P(L.pad, tx + 5, ty - 1, 6, 3); P(L.padDk, tx + 8, ty, 3, 2); P('#ffffff', tx + 6, ty - 1, 2, 1); }
  if (id === 'allen') { P(L.trim, tx, ty, 6, 1); P(L.trim, tx + 2, ty + 1, 1, 6); }
  if (L.collar) { P(L.topDk, tx + 1, ty - 2, 8, 3); P(L.trim, tx + 1, ty - 2, 8, 1); P(L.pal.g, tx + 3, ty + 2, 2, 2); }
  if (id === 'lina') { P(L.trim, tx + 1, ty, 8, 1); P(L.trim, tx + 4, ty + 1, 2, 2); }
  // ---- head ----
  const hx = 8 + dx, hy = 1 + dy;
  L.head.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const k = row[i]; if (k !== '.' && L.pal[k]) P(L.pal[k], hx + i, hy + j); } });
  if (pose === 'hurt' || pose === 'ko') { P(L.pal.s, hx + 1, hy + 8, 3, 3); P(L.pal.e, hx + 1, hy + 9, 3, 1); P(L.pal.m, hx + 2, hy + 12, 2, 1); }
  else if (pose === 'win') { P(L.pal.s, hx + 1, hy + 8, 3, 3); P(L.pal.e, hx + 1, hy + 9, 1, 1); P(L.pal.e, hx + 2, hy + 8, 1, 1); P(L.pal.e, hx + 3, hy + 9, 1, 1); P(L.pal.m, hx + 1, hy + 12, 3, 1); }
  else if (pose === 'strike' || pose === 'cast') { P(L.pal.e, hx + 1, hy + 8, 3, 1); }
  P('#f0a0a0', hx + 3, hy + 11, 2, 1); // blush
  // ---- front arm + weapon ----
  const S = [13 + dx, 18 + dy]; let H;
  if (pose === 'strike') H = [4, 19]; else if (pose === 'walk') H = [9, 13]; else if (pose === 'cast') H = [6, 15 + dy];
  else if (pose === 'win') H = [13, 6]; else if (pose === 'hurt') H = [18, 25]; else if (pose === 'kneel') H = [10, 30]; else H = [11 + dx, 27 + dy];
  limb(S[0], S[1], H[0], H[1], L.top, L.topLt, L.sleeve ? 4 : 3);
  if (L.sleeve) { P(L.trim, H[0] - 1, H[1] - 2, 3, 1); }
  P(L.pal.s, H[0] - 1, H[1] - 1, 3, 3); P(L.pal.S, H[0] + 1, H[1] + 1, 1, 1);
  const W = L.weapon; let ang;
  if (pose === 'strike') ang = 0.35; else if (pose === 'walk') ang = -1.9; else if (pose === 'win') ang = -1.57; else if (pose === 'cast') ang = -1.57; else if (pose === 'hurt') ang = -2.6; else if (pose === 'kneel') ang = -0.9; else ang = W === 'staff' || W === 'rod' ? -1.57 : -1.2;
  const len = W === 'sword' ? 15 : W === 'dagger' ? 8 : 21;
  const ex = H[0] - Math.cos(ang) * len, ey = H[1] + Math.sin(ang) * len;
  if (W === 'sword' || W === 'dagger') {
    line(H[0] - 1, H[1] - 1, ex, ey, '#eef3fc', 2); line(H[0] - 1 + Math.sin(ang) * 1.4, H[1] - 1 + Math.cos(ang) * 1.4, ex + Math.sin(ang) * 1.4, ey + Math.cos(ang) * 1.4, '#8a94b0', 1);
    P('#ffffff', ex - 1, ey - 1, 1, 1);
    const gx = H[0] - Math.sin(ang) * 2.5, gy = H[1] - Math.cos(ang) * 2.5; line(gx - 2, gy, gx + 2, gy, '#e8b830', 1); P('#e8b830', H[0] - 3, H[1] - 2, 5, 1); P('#5a3418', H[0] - 1, H[1], 2, 3);
  } else {
    const gx = H[0] - Math.cos(ang) * (len - 3), gy = H[1] + Math.sin(ang) * (len - 3);
    line(H[0] + Math.cos(ang) * 7, H[1] - Math.sin(ang) * 7, gx, gy, '#8a5a2a', 2); line(H[0] + Math.cos(ang) * 7, H[1] - Math.sin(ang) * 7, gx, gy, '#b07a3a', 1);
    if (W === 'staff') { x.strokeStyle = '#e8c040'; x.lineWidth = 1; x.beginPath(); x.arc(gx, gy - 1, 3, 0, Math.PI * 2); x.stroke(); }
    else { poly([gx - 3, gy + 1, gx, gy - 5, gx + 3, gy + 1], '#e8c040'); }
    P(L.gem, gx - 1, gy - 2, 3, 3); P('#ffffff', gx - 1, gy - 2, 1, 1);
  }
  pixelize(c, '#1a1020');
  return stylize(c, { grad: true });
}
function buildHeroBattle() {
  for (const id in HERO_LOOK) {
    const S = {}; for (const p of ['idle', 'walk', 'strike', 'cast', 'hurt', 'win', 'kneel']) S[p] = heroSprite(id, p);
    const ko = mkCanvas(HB_H, HB_W); { const k = ko.getContext('2d'); k.translate(0, HB_W); k.rotate(-Math.PI / 2); k.drawImage(S.hurt, 0, 0); }
    S.ko = ko; S.flash = {}; for (const p in S) if (p !== 'flash') S.flash[p] = silhouette(S[p]);
    SPR[id].hb = S;
  }
}
