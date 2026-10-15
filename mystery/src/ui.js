// ===================== UI (scenes, map drawing, HUD, menus) =====================
function inMenu() { return G.scene !== Dungeon || G.menu.length > 0 || !!G.prompt; }

// ---------- generic list windows ----------
// m = { x, y, w, rows:[{label, col, fn}], sel, top, vis, title, draw? }
function pushMenu(m) { m.sel = m.sel || 0; m.top = 0; m.vis = m.vis || 10; G.menu.push(m); Audio8.sfx('ok'); }
function closeMenus() { G.menu = []; }
function menuUpdate() {
  const m = G.menu[G.menu.length - 1];
  if (Input.pressed.b || Input.pressed.menu) { G.menu.pop(); Audio8.sfx('cancel'); return; }
  if (!m.rows || !m.rows.length) { if (Input.pressed.a) { G.menu.pop(); Audio8.sfx('cancel'); } return; }
  const n = m.rows.length;
  if (Input.rep('up')) { m.sel = (m.sel + n - 1) % n; Audio8.sfx('cursor'); }
  if (Input.rep('down')) { m.sel = (m.sel + 1) % n; Audio8.sfx('cursor'); }
  if (m.sel < m.top) m.top = m.sel; if (m.sel >= m.top + m.vis) m.top = m.sel - m.vis + 1;
  if (Input.pressed.a) { const r = m.rows[m.sel]; if (r.disabled) Audio8.sfx('error'); else r.fn(); }
}
function drawMenu(m, active) {
  if (m.draw) return m.draw(m);
  const rows = m.rows, nv = Math.min(m.vis, rows.length), lh = 12;
  const h = nv * lh + 10 + (m.title ? 12 : 0);
  win(m.x, m.y, m.w, h);
  let y = m.y + 6;
  if (m.title) { text(m.title, m.x + 8, y, UI.label, 8); y += 12; }
  for (let i = m.top; i < m.top + nv; i++) {
    const r = rows[i], yy = y + (i - m.top) * lh;
    text(r.label, m.x + 16, yy, r.disabled ? UI.dim : r.col || UI.ink, 8);
    if (r.right) text(r.right, m.x + m.w - 8, yy, UI.muted, 8, 'right');
    if (i === m.sel && active) cursor(m.x + 5, yy + 1);
    const idx = i; Touch.add(m.x, yy - 1, m.w, lh, () => { if (G.menu[G.menu.length - 1] === m) { m.sel = idx; Input.tapA(); } });
  }
  if (m.top > 0) text('▲', m.x + m.w - 12, m.y + 2, UI.muted, 7);
  if (m.top + nv < rows.length) text('▼', m.x + m.w - 12, m.y + h - 10, UI.muted, 7);
  if (m.info && active) { const s = m.info(m.sel); if (s) { win(8, 176, 240, 40); wrapText(s, 16, 184, 224, UI.ink); } }
}
function wrapText(s, x, y, w, col, size = 8, lh = 11) {
  let line = '', yy = y;
  for (const ch of s) { if (textW(line + ch, size) > w) { text(line, x, yy, col, size); line = ''; yy += lh; } line += ch; }
  if (line) text(line, x, yy, col, size);
}
function openMainMenu() {
  pushMenu({ x: 8, y: 22, w: 92, rows: [
    { label: '道具', fn: openBag },
    { label: '足元', fn: openFoot },
    { label: 'ステータス', fn: openStatus },
    { label: 'マップ表示', right: G.showMap ? 'ON' : 'OFF', fn() { G.showMap = !G.showMap; this.right = G.showMap ? 'ON' : 'OFF'; Audio8.sfx('ok'); } },
  ] });
}
function openBag() {
  if (!G.bag.length) { closeMenus(); msg('なにも もっていない。'); Audio8.sfx('error'); return; }
  pushMenu({ x: 104, y: 22, w: 144, vis: 10, title: `もちもの ${G.bag.length}/${BAG_MAX}`,
    rows: G.bag.map((it, i) => ({ label: itemName(it), fn: () => openItem(i) })), info: i => ITEMS[G.bag[i].k].desc });
}
function openItem(i) {
  const it = G.bag[i], D = ITEMS[it.k];
  const use = D.kind === 'food' ? 'たべる' : D.kind === 'heal' ? 'なめる' : 'つかう';
  const go = gen => { closeMenus(); G.busy = gen; };
  pushMenu({ x: 150, y: 60, w: 76, rows: [
    { label: use, fn: () => go(actUse(i)) },
    { label: 'おく', fn: () => go(actDrop(i)) },
    { label: 'せつめい', fn: () => pushMenu({ draw: () => { win(8, 150, 240, 66); text(D.name, 16, 158, UI.gold, 8); wrapText(D.desc, 16, 172, 224, UI.ink); } }) },
  ] });
}
function openFoot() {
  const p = G.p, it = itemAt(p.x, p.y), stairs = G.F.stairs.x === p.x && G.F.stairs.y === p.y;
  if (!it && !stairs) { closeMenus(); msg('足元には なにもない。'); return; }
  const rows = [];
  if (it) rows.push({ label: `${itemName(it)}を ひろう`, fn: () => { closeMenus(); G.busy = (function* () { const n = G.bag.length; pickUpHere(false); if (G.bag.length !== n || !itemAt(p.x, p.y)) { yield 6; yield* endTurn(); } })(); } });
  if (stairs) rows.push({ label: '階段を おりる', fn: () => { closeMenus(); G.busy = descend(); } });
  pushMenu({ x: 104, y: 22, w: 144, rows });
}
function openStatus() {
  const p = G.p;
  pushMenu({ draw: () => {
    win(104, 22, 144, 108); let y = 30;
    const row = (a, b) => { text(a, 114, y, UI.label, 8); text(b, 238, y, UI.ink, 8, 'right'); y += 12; };
    text(HERO_NAME, 114, y, UI.gold, 9); y += 14;
    row('レベル', String(p.lv)); row('HP', `${p.hp} / ${p.mhp}`); row('まどろみ度', `${p.mado} / ${p.mmado}`);
    row('こうげき', String(playerAtk())); row('ぼうぎょ', String(playerDef()));
    row('つぎのレベルまで', p.lv < EXP_TABLE.length - 1 ? String(EXP_TABLE[p.lv + 1] - p.exp) : '-');
  } });
}

// ---------- the dungeon scene ----------
const MOTES = Array.from({ length: 26 }, () => ({ x: Math.random() * SW, y: Math.random() * SH, v: 0.08 + Math.random() * 0.18, ph: Math.random() * 6.28 }));
const Dungeon = {
  update() {
    animate();
    if (G.busy) { runBusy(); return; }
    if (G.prompt) { promptUpdate(); return; }
    if (G.menu.length) { menuUpdate(); return; }
    const p = G.p; if (p.hp <= 0) return;
    if (p.sleep > 0) { G.busy = actSleep(); return; }
    if (!settled(p)) return;
    if (Input.pressed.menu) { openMainMenu(); return; }
    const v = Input.vec();
    if (!v) { G.stopUntilRelease = false; G.dirHold = 0; } else G.dirHold++;
    // B: tap = step in place, hold + direction = turn without moving, long hold = keep resting
    if (Input.down.b) {
      G.bHeld++;
      if (v) { p.dir = v; G.bTurned = true; }
      else if (G.bHeld > 24 && G.bHeld % 3 === 0 && !G.bTurned) G.busy = actWait();
      return;
    }
    if (G.bHeld) { const tap = !G.bTurned && G.bHeld <= 24; G.bHeld = 0; G.bTurned = false; if (tap) { G.busy = actWait(); return; } }
    if (Input.pressed.a) { G.busy = actAttack(); return; }
    // wait a few frames so two keys pressed together become a diagonal
    if (v && !G.stopUntilRelease && G.dirHold >= 3) G.busy = actMove(v[0], v[1]);
  },
  draw() { drawDungeon(); },
};
function promptUpdate() {
  const P = G.prompt;
  if (Input.rep('up') || Input.rep('down')) { P.sel = 1 - P.sel; Audio8.sfx('cursor'); }
  if (Input.pressed.a) { G.prompt = null; Audio8.sfx('ok'); P.fn(P.sel); G.stopUntilRelease = true; }
  else if (Input.pressed.b || Input.pressed.menu) { G.prompt = null; Audio8.sfx('cancel'); G.stopUntilRelease = true; }
}
function animate() {
  const step = e => {
    const tx = e.x * T, ty = e.y * T, d = Math.max(Math.abs(tx - e.rx), Math.abs(ty - e.ry));
    const sp = d > T ? d / 4 : 3; // a monster that moved twice catches up quickly
    e.rx += clamp(tx - e.rx, -sp, sp); e.ry += clamp(ty - e.ry, -sp, sp);
    if (e.lunge > 0) e.lunge--; if (e.hit > 0) e.hit--;
  };
  step(G.p); for (const m of G.mons) step(m);
  for (const m of G.dead) m.dying++;
  G.dead = G.dead.filter(m => m.dying < 24);
  for (const f of G.fx) f.t++;
  G.fx = G.fx.filter(f => f.t < 44);
  if (G.logT > 0 && !G.menu.length) G.logT--;
  if (G.card > 0) G.card--;
  if (G.bolt && --G.bolt.t <= 0) G.bolt = null;
}
function lungeOff(e) { if (!e.lunge) return [0, 0]; const k = Math.sin(Math.PI * (10 - e.lunge) / 10) * 5; return [e.dir[0] * k, e.dir[1] * k]; }

function drawDungeon() {
  const F = G.F, p = G.p, th = THEMES[THEME_OF(F.floor)], TL = TILES[THEME_OF(F.floor)];
  ctx.fillStyle = th.void; ctx.fillRect(0, 0, SW, SH);
  let cx = Math.round(p.rx + 8 - SW / 2), cy = Math.round(p.ry + 8 - SH / 2 - 4);
  if (G.shake > 0) { cx += Math.round((Math.random() - 0.5) * 4); cy += Math.round((Math.random() - 0.5) * 3); }
  ctx.save(); ctx.translate(-cx, -cy);
  const x0 = Math.floor(cx / T) - 1, y0 = Math.floor(cy / T) - 1, x1 = x0 + SW / T + 2, y1 = y0 + SH / T + 2;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!inMap(x, y)) continue; const i = y * MW + x; if (!F.seen[i]) continue;
    const t = F.t[i], h = (x * 7 + y * 13 + (x * y) % 5) & 3, X = x * T, Y = y * T;
    if (t === T_WALL) ctx.drawImage(passable(F, x, y + 1) ? TL.face[h % 3] : TL.wall[h % 3], X, Y);
    else {
      ctx.drawImage(t === T_ROOM ? TL.floor[h] : TL.path[h], X, Y);
      if (!passable(F, x, y - 1)) { ctx.fillStyle = 'rgba(10,6,30,.28)'; ctx.fillRect(X, Y, T, 4); ctx.fillStyle = 'rgba(10,6,30,.14)'; ctx.fillRect(X, Y + 4, T, 2); }
    }
  }
  if (F.seen[F.stairs.y * MW + F.stairs.x]) {
    ctx.drawImage(TL.stairs, F.stairs.x * T, F.stairs.y * T);
    const g = 0.18 + Math.sin(G.frame / 20) * 0.08; ctx.fillStyle = `rgba(240,220,255,${g})`; ctx.fillRect(F.stairs.x * T + 2, F.stairs.y * T + 2, 12, 12);
  }
  for (const it of G.items) if (F.seen[it.y * MW + it.x]) ctx.drawImage(ITEM_IMG[it.k], it.x * T, it.y * T + (visible(F, it.x, it.y) ? Math.round(Math.sin(G.frame / 16 + it.x) * 0.6) : 0));
  // remembered-but-unseen tiles are dimmed
  ctx.fillStyle = th.void; ctx.globalAlpha = 0.55;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inMap(x, y) && F.seen[y * MW + x] && !F.vis[y * MW + x]) ctx.fillRect(x * T, y * T, T, T);
  ctx.globalAlpha = 1;
  // actors, back to front
  const actors = G.mons.filter(m => visible(F, m.x, m.y)).map(m => ({ m, y: m.ry }));
  actors.push({ p, y: p.ry });
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) a.m ? drawMon(a.m) : drawHero();
  for (const m of G.dead) drawMon(m);
  if (G.bolt) drawBolt(G.bolt);
  for (const f of G.fx) {
    const k = f.t / 44, y = f.y - 4 - Math.min(10, f.t * 0.8);
    ctx.globalAlpha = k > 0.75 ? (1 - k) * 4 : 1; text(f.text, f.x, y, f.col, 9, 'center'); ctx.globalAlpha = 1;
  }
  ctx.restore();
  // dark corridors: only a small circle of light around Haru
  if (areaAt(F, p.x, p.y) < 0) {
    const sx = p.rx + 8 - cx, sy = p.ry + 8 - cy;
    const g = ctx.createRadialGradient(sx, sy, 14, sx, sy, 44); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(5,3,14,.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
  }
  drawMotes(th);
  const vg = ctx.createRadialGradient(SW / 2, SH / 2, 90, SW / 2, SH / 2, 180); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(8,4,20,.5)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, SW, SH);
  if (G.showMap) drawMinimap();
  drawHud();
  if (!G.menu.length) drawLog();
  if (G.card > 0) drawCard();
  G.menu.forEach((m, i) => drawMenu(m, i === G.menu.length - 1));
  if (G.prompt) drawPrompt();
}
function drawHero() {
  const p = G.p, f = faceOf(p.dir[0], p.dir[1]);
  const moving = !settled(p), fr = moving ? (p.walk % 2 ? 1 : 3) : 0;
  const [ox, oy] = lungeOff(p);
  ctx.fillStyle = 'rgba(10,6,30,.3)'; ctx.beginPath(); ctx.ellipse(p.rx + 8, p.ry + 14.5, 5, 1.8, 0, 0, Math.PI * 2); ctx.fill();
  const img = HERO[f][fr];
  if (p.hit > 0 && p.hit % 4 < 2) ctx.globalAlpha = 0.4;
  ctx.drawImage(img, Math.round(p.rx + ox), Math.round(p.ry + oy - 2));
  ctx.globalAlpha = 1;
  if (p.lunge > 0) { // a quick swing of the wooden sword
    const a = Math.atan2(p.dir[1], p.dir[0]), k = (10 - p.lunge) / 10;
    ctx.strokeStyle = `rgba(255,240,220,${0.9 - k * 0.8})`; ctx.lineWidth = 1.4; ctx.beginPath();
    ctx.arc(p.rx + 8, p.ry + 8, 11, a - 1.1 + k * 0.4, a + 0.6 + k * 0.4); ctx.stroke();
  }
  if (p.sleep > 0) { const b = (G.frame / 3) % 30; ctx.globalAlpha = 1 - b / 30; text('z', p.rx + 12 + b * 0.2, p.ry - 2 - b * 0.4, '#d8e0ff', 7); text('Z', p.rx + 6, p.ry - 8 - (b * 0.2), '#d8e0ff', 8); ctx.globalAlpha = 1; }
}
function drawMon(m) {
  const I = MON_IMG[m.k], right = m.dir[0] > 0, fr = Math.floor((G.frame + m.seed * 7) / (m.asleep ? 40 : 18)) % 2;
  const [ox, oy] = lungeOff(m);
  const X = Math.round(m.rx + ox), Y = Math.round(m.ry + oy - 2);
  ctx.fillStyle = 'rgba(10,6,30,.3)'; ctx.beginPath(); ctx.ellipse(m.rx + 8, m.ry + 14.5, 5, 1.8, 0, 0, Math.PI * 2); ctx.fill();
  if (m.dying) {
    const k = m.dying / 24; ctx.globalAlpha = 1 - k; ctx.drawImage((right ? I.hitR : I.hitL)[0], X, Y - k * 6); ctx.globalAlpha = 1;
    for (let i = 0; i < 5; i++) { const a = i * 1.26 + m.seed, r = k * 14; ctx.fillStyle = `rgba(255,230,250,${1 - k})`; ctx.fillRect(m.rx + 8 + Math.cos(a) * r, m.ry + 6 + Math.sin(a) * r - k * 8, 1.5, 1.5); }
    return;
  }
  ctx.drawImage((m.hit > 0 && m.hit % 4 < 2 ? (right ? I.hitR : I.hitL) : (right ? I.right : I.left))[fr], X, Y);
  if (m.asleep) { const b = (G.frame / 4 + m.seed) % 24; ctx.globalAlpha = 1 - b / 24; text('z', m.rx + 11, m.ry - 3 - b * 0.3, '#d8e0ff', 6); ctx.globalAlpha = 1; }
}
function drawBolt(b) {
  const x0 = b.x0 * T + 8, y0 = b.y0 * T + 4, x1 = b.x1 * T + 8, y1 = b.y1 * T + 8;
  ctx.strokeStyle = b.t % 4 < 2 ? '#fff6b0' : '#ffd84a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, y0);
  for (let i = 1; i < 6; i++) { const k = i / 6; ctx.lineTo(x0 + (x1 - x0) * k + (Math.random() - 0.5) * 6, y0 + (y1 - y0) * k + (Math.random() - 0.5) * 6); }
  ctx.lineTo(x1, y1); ctx.stroke();
}
function drawMotes(th) {
  for (const m of MOTES) {
    m.y -= m.v; m.x += Math.sin(G.frame / 60 + m.ph) * 0.12; if (m.y < -4) { m.y = SH + 4; m.x = Math.random() * SW; }
    const a = 0.25 + 0.25 * Math.sin(G.frame / 25 + m.ph);
    ctx.fillStyle = `rgba(255,236,255,${a})`; ctx.fillRect(m.x, m.y, 1, 1);
  }
}
function drawMinimap() {
  // a compact map in the top-right corner (2px per tile) on a faint backing
  const F = G.F, s = 2, w = MW * s, h = MH * s, ox = SW - w - 4, oy = 22;
  ctx.fillStyle = 'rgba(8,4,22,.38)'; roundRect(ox - 2, oy - 2, w + 4, h + 4, 3); ctx.fill();
  ctx.fillStyle = 'rgba(190,210,255,.42)';
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const i = y * MW + x; if (F.seen[i] && F.t[i] !== T_WALL) ctx.fillRect(ox + x * s, oy + y * s, s, s); }
  if (F.seen[F.stairs.y * MW + F.stairs.x]) { ctx.fillStyle = '#ffffff'; ctx.fillRect(ox + F.stairs.x * s - 1, oy + F.stairs.y * s - 1, s + 2, s + 2); ctx.fillStyle = '#4a3a7a'; ctx.fillRect(ox + F.stairs.x * s, oy + F.stairs.y * s, s, s); }
  ctx.fillStyle = '#7ae6ff';
  for (const it of G.items) if (F.seen[it.y * MW + it.x]) ctx.fillRect(ox + it.x * s, oy + it.y * s, s, s);
  ctx.fillStyle = '#ff6e82';
  for (const m of G.mons) if (visible(F, m.x, m.y)) ctx.fillRect(ox + m.x * s, oy + m.y * s, s, s);
  if (G.frame % 40 < 28) { ctx.fillStyle = '#fff6a8'; ctx.fillRect(ox + G.p.x * s - 0.5, oy + G.p.y * s - 0.5, s + 1, s + 1); }
}
function drawHud() {
  const p = G.p, F = G.F;
  const g = ctx.createLinearGradient(0, 0, 0, 22); g.addColorStop(0, 'rgba(8,4,20,.75)'); g.addColorStop(1, 'rgba(8,4,20,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, SW, 22);
  text(`${F.floor}F`, 6, 3, UI.gold, 10, 'left', 't');
  text(`Lv${p.lv}`, 30, 4, UI.ink, 8);
  const low = p.hp <= p.mhp / 4;
  text(`HP ${p.hp}/${p.mhp}`, 58, 4, low ? UI.red : UI.ink, 8);
  bar(58, 14, 54, 2.5, p.hp / p.mhp, low ? UI.red : UI.hp);
  const mc = p.mado <= 10 ? UI.red : p.mado <= 20 ? UI.warn : UI.ink;
  text(`まどろみ ${p.mado}`, 124, 4, mc, 8);
  bar(124, 14, 50, 2.5, p.mado / p.mmado, p.mado <= 20 ? UI.warn : '#c8a8ff');
  text(`✦${G.stars}`, 250, 4, UI.gold, 8, 'right');
}
function drawLog() {
  if (G.logT <= 0 || !G.log.length) { if (G.logT <= 0) G.log = []; return; }
  const a = Math.min(1, G.logT / 20), n = G.log.length, h = n * 12 + 10;
  ctx.save(); ctx.globalAlpha = a; win(4, SH - h - 4, SW - 8, h, 0.92);
  G.log.forEach((l, i) => text(l.s, 14, SH - h + 2 + i * 12, l.col || UI.ink, 8));
  ctx.restore();
}
function drawCard() {
  const t = G.card, a = t > 90 ? (110 - t) / 20 : t < 20 ? t / 20 : 1;
  ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, 0, SW, 0); g.addColorStop(0, 'rgba(10,6,30,0)'); g.addColorStop(0.5, 'rgba(10,6,30,.7)'); g.addColorStop(1, 'rgba(10,6,30,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 92, SW, 34);
  text(`${DUNGEON.name}  ${G.F.floor}F`, SW / 2, 100, '#f6eaff', 14, 'center', 't');
  ctx.restore();
}
function drawPrompt() {
  const P = G.prompt, w = 150, x = (SW - w) / 2, y = 120;
  win(x, y, w, 52); text(P.text, x + 10, y + 7, UI.ink, 8);
  P.opts.forEach((o, i) => {
    const yy = y + 22 + i * 12; text(o, x + 26, yy, UI.ink, 8); if (i === P.sel) cursor(x + 14, yy + 1);
    Touch.add(x, yy - 1, w, 12, () => { P.sel = i; Input.tapA(); });
  });
}

// ---------- title / intro / game over / clear ----------
const STARS = Array.from({ length: 70 }, () => ({ x: Math.random() * SW, y: Math.random() * 150, s: Math.random() < 0.15 ? 2 : 1, ph: Math.random() * 6.28 }));
function drawNight(top = '#140c2e', bot = '#3e2a64', moon = true) {
  const g = ctx.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
  for (const s of STARS) { ctx.fillStyle = `rgba(255,245,255,${0.35 + 0.35 * Math.sin(G.frame / 30 + s.ph)})`; ctx.fillRect(s.x, s.y, s.s, s.s); }
  if (moon) {
  const mg = ctx.createRadialGradient(196, 52, 8, 196, 52, 46); mg.addColorStop(0, 'rgba(255,240,220,.5)'); mg.addColorStop(1, 'rgba(255,240,220,0)');
  ctx.fillStyle = mg; ctx.fillRect(140, 0, 116, 110);
  ctx.fillStyle = '#fff4e0'; ctx.beginPath(); ctx.arc(196, 52, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = top; ctx.beginPath(); ctx.arc(202, 48, 12, 0, Math.PI * 2); ctx.fill();
  }
  // rolling hills of a toy forest
  ctx.fillStyle = '#1e1640'; ctx.beginPath(); ctx.moveTo(0, SH);
  for (let x = 0; x <= SW; x += 8) ctx.lineTo(x, 168 + Math.sin(x / 30) * 8 + Math.sin(x / 11) * 3);
  ctx.lineTo(SW, SH); ctx.fill();
  ctx.fillStyle = '#140e2e'; ctx.beginPath(); ctx.moveTo(0, SH);
  for (let x = 0; x <= SW; x += 8) ctx.lineTo(x, 190 + Math.sin(x / 22 + 2) * 6);
  ctx.lineTo(SW, SH); ctx.fill();
}
const Title = {
  start() { G.scene = Title; G.fade = 1; G.fadeIn = true; G.menu = []; G.prompt = null; Audio8.play('title'); },
  update() { if (Input.pressed.a && G.fade < 0.3) { Audio8.sfx('ok'); Intro.start(); } },
  draw() {
    drawNight();
    text('ねむりの迷宮', SW / 2, 62, '#f8ecff', 24, 'center', 't');
    text('— NEMURI NO MEIKYU —', SW / 2, 94, UI.label, 7, 'center');
    if (G.best) text(`いちばん深く もぐった階 ${G.best}F`, SW / 2, 118, UI.muted, 8, 'center');
    if (G.frame % 60 < 42) text(TOUCH ? 'タップで はじめる' : 'Z / Enter で はじめる', SW / 2, 140, UI.gold, 9, 'center');
    Touch.add(0, 0, SW, SH, () => Input.tapA());
  },
};
const Intro = {
  start() { G.scene = Intro; this.i = 0; this.t = 0; G.fade = 1; G.fadeIn = true; },
  update() {
    this.t++;
    if ((Input.pressed.a || this.t > 200) && this.t > 20) {
      this.i++; this.t = 0; Audio8.sfx('cursor');
      if (this.i >= INTRO.length) {
        newGame(); G.scene = Dungeon; enterFloor(1); G.fade = 1; G.fadeIn = true;
        msg(`ここは ${SISTER}の夢の中… ${DUNGEON.name}だ。`);
      }
    }
  },
  draw() {
    ctx.fillStyle = '#07050f'; ctx.fillRect(0, 0, SW, SH);
    for (let k = 0; k <= Math.min(this.i, INTRO.length - 1); k++) {
      const a = k < this.i ? 0.55 : Math.min(1, this.t / 30);
      ctx.globalAlpha = a; text(INTRO[k], SW / 2, 64 + k * 24, '#ecdcff', 9, 'center', 't'); ctx.globalAlpha = 1;
    }
    if (this.t > 30 && G.frame % 60 < 40) text('▼', SW / 2, 186, UI.gold, 8, 'center');
  },
};
const GameOver = {
  start() { G.scene = GameOver; G.fade = 1; G.fadeIn = true; G.menu = []; G.prompt = null; this.t = 0; Audio8.play('gameover'); },
  update() { this.t++; if (this.t > 60 && Input.pressed.a) { Audio8.sfx('ok'); Title.start(); } },
  draw() {
    drawNight('#0a0618', '#24163e', false);
    text('夢から おいだされた…', SW / 2, 58, '#f2e4ff', 16, 'center', 't');
    text(G.cause || '', SW / 2, 90, UI.muted, 8, 'center');
    text(`${DUNGEON.name} ${G.F.floor}F   Lv${G.p.lv}   ${G.turn}ターン`, SW / 2, 108, UI.ink, 8, 'center');
    text('もちものは 夢に とけて きえてしまった。', SW / 2, 126, UI.label, 8, 'center');
    if (this.t > 60 && G.frame % 60 < 42) text('タイトルへ もどる', SW / 2, 150, UI.gold, 9, 'center');
    Touch.add(0, 0, SW, SH, () => Input.tapA());
  },
};
const Clear = {
  start() { G.scene = Clear; G.fade = 1; G.fadeIn = true; G.menu = []; G.prompt = null; this.t = 0; Audio8.play('clear'); },
  update() { this.t++; if (this.t > 90 && Input.pressed.a) { Audio8.sfx('ok'); Title.start(); } },
  draw() {
    drawNight('#2a1c50', '#a07ab8', false);
    text(`${DUNGEON.name}を ぬけた!`, SW / 2, 52, '#fff6e8', 16, 'center', 't');
    text(`遠くで ${SISTER}の 笑い声が きこえた気がした。`, SW / 2, 86, '#f8ecff', 9, 'center', 't');
    text(`Lv${G.p.lv}   ${G.turn}ターン   ✦${G.stars}`, SW / 2, 110, UI.ink, 8, 'center');
    text('— つづく —', SW / 2, 132, UI.gold, 9, 'center', 't');
    if (this.t > 90 && G.frame % 60 < 42) text('タイトルへ もどる', SW / 2, 156, UI.ink, 8, 'center');
    Touch.add(0, 0, SW, SH, () => Input.tapA());
  },
};
