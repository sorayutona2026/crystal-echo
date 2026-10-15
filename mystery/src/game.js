// ===================== GAME (state, turns, combat, monsters) =====================
const G = {
  frame: 0, scene: null, F: null, p: null, mons: [], dead: [], items: [], bag: [], stars: 0, turn: 0,
  log: [], logT: 0, busy: null, wait: 0, fx: [], menu: [], prompt: null, fade: 0, shake: 0, card: 0,
  dirHold: 0, stopUntilRelease: false, bHeld: 0, bTurned: false, cause: '', best: 0, showMap: true,
};
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
function msg(s, col) { G.log.push({ s, col }); if (G.log.length > 3) G.log.shift(); G.logT = 210; }
function popup(e, text, col) { G.fx.push({ x: e.x * T + 8, y: e.y * T, text: String(text), col, t: 0 }); }
const monAt = (x, y) => G.mons.find(m => m.x === x && m.y === y && m.hp > 0);
const itemAt = (x, y) => G.items.find(i => i.x === x && i.y === y);
const occupied = (x, y) => !!monAt(x, y) || (G.p.x === x && G.p.y === y);
const settled = e => e.rx === e.x * T && e.ry === e.y * T;
const itemName = it => it.k === 'star' ? `ほしのかけら ${it.n}こ` : ITEMS[it.k].name;

function playerAtk() { const L = G.p.lv; return 3 + L + Math.floor(L / 3); }
function playerDef() { return Math.floor(G.p.lv / 2); }
function dmgCalc(atk, def) { return Math.max(1, Math.round(atk * (0.875 + rnd() * 0.25)) - def); }

// ---------- new game / floors ----------
function newGame() {
  G.p = { x: 0, y: 0, rx: 0, ry: 0, dir: [0, 1], hp: 15, mhp: 15, lv: 1, exp: 0, mado: MADO_MAX, mmado: MADO_MAX, madoT: 0, regen: 0, sleep: 0, lunge: 0, hit: 0, walk: 0 };
  G.bag = [{ k: 'candy' }, { k: 'heal' }]; G.stars = 0; G.turn = 0; G.log = []; G.cause = ''; G.menu = []; G.prompt = null; G.busy = null; G.wait = 0;
}
function enterFloor(n) {
  const F = genFloor(n); G.F = F; G.mons = []; G.dead = []; G.items = []; G.fx = [];
  const p = G.p;
  const start = randomRoomTile(F); p.x = start[0]; p.y = start[1]; p.rx = p.x * T; p.ry = p.y * T; p.dir = [0, 1];
  const startRoom = F.room[p.y * MW + p.x];
  const st = randomRoomTile(F, (x, y) => !(x === p.x && y === p.y), startRoom); F.stairs = { x: st[0], y: st[1] };
  const nm = ri(3, 5) + Math.floor(n / 3);
  for (let i = 0; i < nm; i++) spawnMonster(true, startRoom);
  const ni = ri(4, 7);
  for (let i = 0; i < ni; i++) { const t = randomRoomTile(F, (x, y) => !itemAt(x, y) && !(x === F.stairs.x && y === F.stairs.y)); if (t) dropItem(pickItem(), t[0], t[1]); }
  updateFov(F, p.x, p.y);
  G.best = Math.max(G.best, n); G.card = 110; G.stopUntilRelease = true;
  Audio8.play(MUSIC_OF(n));
}
function dropItem(k, x, y) { const it = { k, x, y }; if (k === 'star') it.n = ri(5, 15) + G.F.floor * 3; G.items.push(it); return it; }
function spawnMonster(initial, avoidRoom = -1) {
  const F = G.F, p = G.p;
  const t = randomRoomTile(F, (x, y) => !occupied(x, y) && !visible(F, x, y) && Math.max(Math.abs(x - p.x), Math.abs(y - p.y)) > 4, initial ? avoidRoom : -1);
  if (!t) return null;
  const k = pickMonster(F.floor), D = MONSTERS[k];
  const m = { k, x: t[0], y: t[1], rx: t[0] * T, ry: t[1] * T, hp: D.hp, mhp: D.hp, dir: [-1, 0], asleep: initial && rnd() < 0.35, track: 0, goal: null, hit: 0, lunge: 0, seed: Math.floor(rnd() * 99) };
  G.mons.push(m); return m;
}

// ---------- the busy runner: actions are generators that yield frame waits ----------
function runBusy() {
  if (G.wait > 0) { G.wait--; return; }
  for (let guard = 0; guard < 60 && G.busy; guard++) {
    const r = G.busy.next();
    if (r.done) { G.busy = null; break; }
    if (r.value) { G.wait = r.value - 1; break; }
  }
}
function* waitSettled() { let n = 0; while (!settled(G.p) && n++ < 30) yield 1; }

// ---------- player actions ----------
function* actMove(dx, dy) {
  const p = G.p, F = G.F; p.dir = [dx, dy];
  const tx = p.x + dx, ty = p.y + dy;
  if (monAt(tx, ty) && canStep(F, p.x, p.y, dx, dy)) { yield* actAttack(); return; }
  if (!canStep(F, p.x, p.y, dx, dy) || monAt(tx, ty)) return; // bumping a wall costs no turn
  p.x = tx; p.y = ty; p.walk++;
  updateFov(F, p.x, p.y);
  pickUpHere(true);
  yield* endTurn();
  if (p.hp <= 0) return;
  yield* waitSettled();
  if (F.stairs && p.x === F.stairs.x && p.y === F.stairs.y) askStairs();
}
function* actAttack() {
  const p = G.p, F = G.F, [dx, dy] = p.dir;
  p.lunge = 10; Audio8.sfx('slash');
  yield 4;
  const m = monAt(p.x + dx, p.y + dy);
  if (m && canStep(F, p.x, p.y, dx, dy)) {
    m.asleep = false; m.track = 10; m.goal = [p.x, p.y];
    if (rnd() < 0.95) {
      const d = dmgCalc(playerAtk(), MONSTERS[m.k].def); m.hp -= d; m.hit = 10; popup(m, d, '#ffffff'); Audio8.sfx('hit');
      msg(`${MONSTERS[m.k].name}に ${d}の ダメージ!`);
      if (m.hp <= 0) { yield 8; yield* killMon(m); }
    } else { Audio8.sfx('miss'); msg(`${MONSTERS[m.k].name}に かわされた!`); }
  }
  yield 8;
  yield* endTurn();
}
function* actWait() { pickUpHere(false); yield* endTurn(); yield 2; }
function* actSleep() {
  const p = G.p; p.sleep--;
  yield 14;
  if (p.sleep <= 0) msg(`${HERO_NAME}は 目を さました。`);
  yield* endTurn();
}
function* killMon(m) {
  const D = MONSTERS[m.k];
  m.dying = 1; G.dead.push(m); G.mons = G.mons.filter(x => x !== m); Audio8.sfx('shatter');
  msg(`${D.name}を やっつけた! けいけんち ${D.exp}`);
  if (rnd() < 0.1 && !itemAt(m.x, m.y) && !(G.F.stairs.x === m.x && G.F.stairs.y === m.y)) dropItem(pickItem(), m.x, m.y);
  yield* gainExp(D.exp);
}
function* gainExp(n) {
  const p = G.p; p.exp += n;
  while (p.lv < EXP_TABLE.length - 1 && p.exp >= EXP_TABLE[p.lv + 1]) {
    p.lv++; const up = ri(4, 6); p.mhp += up; p.hp += up;
    Audio8.sfx('levelup'); msg(`${HERO_NAME}の レベルが ${p.lv}に あがった!`, UI.gold);
    yield 30;
  }
}
// use / drop from the bag
function* actUse(i) {
  const p = G.p, it = G.bag[i], D = ITEMS[it.k];
  G.bag.splice(i, 1);
  if (D.kind === 'food') {
    Audio8.sfx('eat');
    const full = p.mado >= p.mmado;
    if (full && D.mado >= 100) { p.mmado += 5; p.mado = p.mmado; msg(`${D.name}を たべた。さいだいまどろみ度が 5 あがった!`); }
    else { p.mado = Math.min(p.mmado, p.mado + D.mado); msg(`${D.name}を たべた。夢が ふかくなった。`); }
  } else if (D.kind === 'heal') {
    Audio8.sfx('heal');
    if (p.hp >= p.mhp) { const up = D.hp >= 100 ? 2 : 1; p.mhp += up; p.hp = p.mhp; msg(`${D.name}を なめた。さいだいHPが ${up} あがった!`); }
    else { const h = Math.min(D.hp, p.mhp - p.hp); p.hp += h; popup(p, h, UI.hp); msg(`${D.name}を なめた。HPが ${h} かいふくした。`); }
  }
  yield 16;
  yield* endTurn();
}
function* actDrop(i) {
  const p = G.p, it = G.bag[i];
  if (itemAt(p.x, p.y) || (G.F.stairs.x === p.x && G.F.stairs.y === p.y)) { msg('ここには おけない。'); return; }
  G.bag.splice(i, 1); it.x = p.x; it.y = p.y; G.items.push(it); msg(`${itemName(it)}を 足元に おいた。`);
  yield 6; yield* endTurn();
}
function pickUpHere(onStep) {
  const p = G.p, it = itemAt(p.x, p.y); if (!it) return;
  if (it.k === 'star') { G.stars += it.n; G.items.splice(G.items.indexOf(it), 1); Audio8.sfx('pickup'); msg(`ほしのかけらを ${it.n}こ ひろった。`); return; }
  if (G.bag.length >= BAG_MAX) { msg(onStep ? `${itemName(it)}の 上に のった。(もちものが いっぱい)` : 'もちものが いっぱいで ひろえない。'); return; }
  G.items.splice(G.items.indexOf(it), 1); G.bag.push({ k: it.k }); Audio8.sfx('pickup'); msg(`${itemName(it)}を ひろった。`);
}
function askStairs() {
  G.prompt = { text: '階段が ある。おりますか?', opts: ['おりる', 'やめる'], sel: 0, fn: i => { if (i === 0) G.busy = descend(); } };
}
function* descend() {
  Audio8.sfx('stairs');
  for (let i = 1; i <= 20; i++) { G.fade = i / 20; yield 1; }
  const n = G.F.floor + 1;
  if (n > DUNGEON.floors) { G.fade = 1; Clear.start(); return; }
  msg(`${n}階に おりた。`); enterFloor(n);
  for (let i = 19; i >= 0; i--) { G.fade = i / 20; yield 1; }
}

// ---------- end of turn: hunger, regeneration, monsters ----------
function* endTurn() {
  const p = G.p, F = G.F; G.turn++;
  // まどろみ度: one point every 10 turns; at zero Haru starts waking up and loses HP
  if (++p.madoT >= 10) {
    p.madoT = 0;
    if (p.mado > 0) {
      p.mado--;
      if (p.mado === 20) { msg('まどろみが うすれてきた…', UI.warn); Audio8.sfx('warn'); }
      if (p.mado === 10) { msg('目が さめかけている! なにか たべないと…', UI.warn); Audio8.sfx('warn'); }
      if (p.mado === 0) { msg('まどろみが つきた! 夢から おいだされそうだ!', UI.red); Audio8.sfx('warn'); }
    }
  }
  if (p.mado <= 0) {
    p.hp -= 1; p.regen = 0;
    if (p.hp <= 0) { G.cause = 'まどろみが つきて 目が さめてしまった'; yield* die(); return; }
  } else if (p.hp < p.mhp) {
    p.regen += p.mhp / 140 + 0.02;
    while (p.regen >= 1 && p.hp < p.mhp) { p.hp++; p.regen--; }
  } else p.regen = 0;
  // monsters act; distance fields are shared within this turn
  G.df = {};
  const before = new Set(G.mons.filter(m => visible(F, m.x, m.y)));
  for (const m of [...G.mons]) {
    const n = MONSTERS[m.k].speed || 1;
    for (let i = 0; i < n && m.hp > 0; i++) {
      yield* monAct(m);
      if (p.hp <= 0) { yield* die(); return; }
    }
  }
  if (G.mons.length < 10 && rnd() < 1 / 40) spawnMonster(false);
  updateFov(F, p.x, p.y);
  // stop a held walk when something new comes into sight
  if (G.mons.some(m => visible(F, m.x, m.y) && !before.has(m))) G.stopUntilRelease = true;
}
function field(x, y) { const k = x + ',' + y; return G.df[k] || (G.df[k] = distField(G.F, x, y)); }
function canSee(m) {
  const p = G.p, F = G.F; if (cheb(m, p) <= 1) return true;
  const a = areaAt(F, m.x, m.y); return a >= 0 && a === areaAt(F, p.x, p.y);
}
function* monAct(m) {
  const p = G.p, F = G.F, D = MONSTERS[m.k];
  if (m.asleep) {
    const d = cheb(m, p);
    if ((d <= 1 && rnd() < 0.5) || (canSee(m) && rnd() < 0.08)) m.asleep = false;
    return;
  }
  const sees = canSee(m);
  if (sees) { m.track = 10; m.goal = [p.x, p.y]; }
  else if (m.track > 0) { m.track--; if (cheb(m, p) <= 7) m.goal = [p.x, p.y]; }
  const dx = Math.sign(p.x - m.x), dy = Math.sign(p.y - m.y);
  if (cheb(m, p) === 1 && canStep(F, m.x, m.y, dx, dy)) { yield* monAttack(m, dx, dy); return; }
  if (D.bolt && sees && inLine(m, p, D.bolt.range) && rnd() < D.bolt.chance) { yield* monBolt(m, dx, dy); return; }
  // walk toward the goal: the player while chasing, otherwise a random spot in some room
  if (!m.goal || (m.goal[0] === m.x && m.goal[1] === m.y)) {
    const myRoom = areaAt(F, m.x, m.y); const t = randomRoomTile(F, null, myRoom); m.goal = t; m.track = 0;
  }
  const Dg = field(m.goal[0], m.goal[1]); const cur = Dg[m.y * MW + m.x];
  let best = null, bestD = cur < 0 ? 9999 : cur, ties = [];
  for (const [ddx, ddy] of DIRS8) {
    const nx = m.x + ddx, ny = m.y + ddy; if (!canStep(F, m.x, m.y, ddx, ddy) || occupied(nx, ny)) continue;
    const v = Dg[ny * MW + nx]; if (v < 0) continue;
    if (v < bestD) { bestD = v; ties = [[ddx, ddy]]; } else if (v === bestD && ties.length) ties.push([ddx, ddy]);
  }
  if (ties.length) best = ties[Math.floor(rnd() * ties.length)];
  else if (rnd() < 0.3) { // blocked: sidestep to an equally close tile now and then
    const side = DIRS8.filter(([a, b]) => canStep(F, m.x, m.y, a, b) && !occupied(m.x + a, m.y + b) && Dg[(m.y + b) * MW + m.x + a] === cur);
    if (side.length) best = side[Math.floor(rnd() * side.length)];
  }
  if (best) { m.x += best[0]; m.y += best[1]; m.dir = best; }
  else if (!sees && m.track <= 0) m.goal = null;
}
function inLine(m, p, range) {
  const dx = p.x - m.x, dy = p.y - m.y;
  if (!(dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) || cheb(m, p) > range) return false;
  const sx = Math.sign(dx), sy = Math.sign(dy);
  for (let x = m.x + sx, y = m.y + sy; !(x === p.x && y === p.y); x += sx, y += sy) if (!passable(G.F, x, y) || monAt(x, y)) return false;
  return true;
}
function* monAttack(m, dx, dy) {
  const p = G.p, D = MONSTERS[m.k];
  m.dir = [dx, dy]; m.lunge = 10;
  yield 5;
  if (rnd() < 0.9) {
    const d = dmgCalc(D.atk, playerDef()); p.hp -= d; p.hit = 10; G.shake = 6; popup(p, d, UI.red); Audio8.sfx('hit');
    msg(`${D.name}の こうげき! ${d}の ダメージを うけた。`);
    if (p.hp <= 0) { p.hp = 0; G.cause = `${D.name}に やられた`; }
    else if (D.sleepHit && !p.sleep && rnd() < D.sleepHit) { p.sleep = ri(2, 4); Audio8.sfx('sleep'); msg(`${HERO_NAME}は ねむってしまった…`, UI.label); }
  } else { Audio8.sfx('miss'); msg(`${D.name}の こうげき! ひらりと かわした。`); }
  yield 12;
}
function* monBolt(m, dx, dy) {
  const p = G.p, D = MONSTERS[m.k];
  m.dir = [dx, dy]; m.lunge = 6;
  yield 4;
  G.bolt = { x0: m.x, y0: m.y, x1: p.x, y1: p.y, t: 14 }; G.flash = 6; Audio8.sfx('bolt');
  const d = ri(D.bolt.dmg[0], D.bolt.dmg[1]); p.hp -= d; p.hit = 10; G.shake = 8; popup(p, d, UI.red);
  msg(`${D.name}は カミナリを おとした! ${d}の ダメージ!`);
  if (p.hp <= 0) { p.hp = 0; G.cause = `${D.name}の カミナリに やられた`; }
  yield 16;
}
function* die() {
  const p = G.p; p.hp = 0;
  Audio8.stop(); Audio8.sfx('ko');
  msg(`${HERO_NAME}は たおれた…`, UI.red);
  yield 60;
  for (let i = 1; i <= 30; i++) { G.fade = i / 30; yield 1; }
  GameOver.start();
}
