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
// candies and pages go by their look (a colour, a picture) until identified
const unknown = k => (ITEMS[k].cls === 'candy' || ITEMS[k].cls === 'page') && !G.known.has(k);
function dispName(it) {
  if (it.k === 'star') return `ほしのかけら ${it.n}こ`;
  if (!unknown(it.k)) return ITEMS[it.k].name;
  return ITEMS[it.k].cls === 'candy' ? `${G.looks[it.k].name}キャンディ` : `${G.looks[it.k]}えほんのページ`;
}
const itemName = dispName;
function itemDesc(it) {
  if (!unknown(it.k)) return ITEMS[it.k].desc;
  return ITEMS[it.k].cls === 'candy' ? 'なめるか 投げるまで 何のキャンディか わからない。' : 'よむまで 何のページか わからない。';
}
function itemImg(k) {
  const D = ITEMS[k];
  if (D.cls === 'candy') return lollipop(D.color || G.looks[k].col);
  if (D.cls === 'page') return ITEM_IMG.page;
  return ITEM_IMG[k];
}
function identify(k) {
  if (!unknown(k)) return false;
  G.known.add(k); return true;
}
const isWard = it => it && it.k === 'mamori' && it.placed;

function playerAtk() { const L = G.p.lv; return 3 + L + Math.floor(L / 3) + (G.p.str - STR_BASE); }
function playerDef() { return Math.floor(G.p.lv / 2); }
function dmgCalc(atk, def) { return Math.max(1, Math.round(atk * (0.875 + rnd() * 0.25)) - def); }

// ---------- new game / floors ----------
function newGame() {
  G.p = { x: 0, y: 0, rx: 0, ry: 0, dir: [0, 1], hp: 15, mhp: 15, lv: 1, exp: 0, mado: MADO_MAX, mmado: MADO_MAX, madoT: 0, regen: 0, sleep: 0, lunge: 0, hit: 0, walk: 0,
    str: STR_BASE, mstr: STR_BASE, conf: 0, fastT: 0 };
  // shuffle the looks of unknown candies and pages for this game
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const cl = shuffle(CANDY_LOOKS), pl = shuffle(PAGE_LOOKS); G.looks = {}; G.known = new Set();
  for (const k in ITEMS) {
    const D = ITEMS[k];
    if (D.known || (D.cls !== 'candy' && D.cls !== 'page')) { G.known.add(k); continue; }
    G.looks[k] = D.cls === 'candy' ? (([name, col]) => ({ name, col }))(cl.pop()) : pl.pop();
  }
  G.fastPhase = false;
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
  const p = G.p, F = G.F;
  if (p.conf > 0) [dx, dy] = DIRS8[ri(0, 7)];
  p.dir = [dx, dy];
  const tx = p.x + dx, ty = p.y + dy;
  if (monAt(tx, ty) && canStep(F, p.x, p.y, dx, dy)) { yield* actAttack(); return; }
  if (!canStep(F, p.x, p.y, dx, dy) || monAt(tx, ty)) { if (p.conf > 0) { yield 6; yield* endTurn(); } return; } // bumping a wall costs no turn (unless confused)
  p.x = tx; p.y = ty; p.walk++;
  updateFov(F, p.x, p.y);
  pickUpHere(true);
  yield* endTurn();
  if (p.hp <= 0) return;
  yield* waitSettled();
  if (F.stairs && p.x === F.stairs.x && p.y === F.stairs.y) askStairs();
}
function* actAttack() {
  const p = G.p, F = G.F;
  if (p.conf > 0) p.dir = DIRS8[ri(0, 7)];
  const [dx, dy] = p.dir;
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
// ---------- items: use, identify, throw, drop, pick up ----------
function* hurtMon(m, d, why) {
  m.hp -= d; m.hit = 10; m.asleep = false; m.track = 10; popup(m, d, '#ffd0a0'); Audio8.sfx('hit');
  msg(`${MONSTERS[m.k].name}に ${why}${d}の ダメージ!`);
  if (m.hp <= 0) { yield 8; yield* killMon(m); }
}
function* actUse(i) {
  const p = G.p, F = G.F, it = G.bag[i], D = ITEMS[it.k], before = dispName(it);
  G.bag.splice(i, 1);
  const verb = D.cls === 'food' ? 'たべた' : D.cls === 'page' ? 'よんだ' : 'なめた';
  if (D.cls === 'food') Audio8.sfx('eat');
  msg(`${before}を ${verb}。`);
  yield 10;
  identify(it.k);
  switch (D.kind) {
    case 'food': {
      if (p.mado >= p.mmado && D.mado >= 100) { p.mmado += 5; p.mado = p.mmado; msg('さいだいまどろみ度が 5 あがった!'); }
      else { p.mado = Math.min(p.mmado, p.mado + D.mado); msg('夢が ふかくなった。'); }
      break;
    }
    case 'heal': {
      Audio8.sfx('heal');
      if (p.hp >= p.mhp) { const up = D.hp >= 100 ? 2 : 1; p.mhp += up; p.hp = p.mhp; msg(`さいだいHPが ${up} あがった!`); }
      else { const h = Math.min(D.hp, p.mhp - p.hp); p.hp += h; popup(p, h, UI.hp); msg(`HPが ${h} かいふくした。`); }
      break;
    }
    case 'str': Audio8.sfx('buff');
      if (p.str < p.mstr) { p.str = p.mstr; msg('ちからが もとに もどった。'); } else { p.str++; p.mstr++; msg(`ちからが 1 あがった! (ちから ${p.str})`, UI.gold); }
      break;
    case 'lvup': if (p.lv < EXP_TABLE.length - 1) yield* gainExp(EXP_TABLE[p.lv + 1] - p.exp); else msg('なにも おこらなかった。'); break;
    case 'conf': p.conf = 8; Audio8.sfx('error'); msg(`${HERO_NAME}は こんらんしてしまった!`, UI.warn); break;
    case 'sleep': p.sleep = 4; Audio8.sfx('sleep'); msg(`${HERO_NAME}は ねむってしまった…`, UI.label); break;
    case 'fast': p.fastT = 20; G.fastPhase = false; Audio8.sfx('buff'); msg('足が はやくなった!', UI.gold); break;
    case 'fire': { // breathe fire straight ahead
      const [dx, dy] = p.dir; let x = p.x, y = p.y, hit = null;
      for (let n = 0; n < 10 && canStep(F, x, y, dx, dy); n++) { x += dx; y += dy; const m = monAt(x, y); if (m) { hit = m; break; } }
      G.beam = { x0: p.x, y0: p.y, x1: x, y1: y, t: 18, col: '#ff9a4a' }; Audio8.sfx('fire'); p.lunge = 8;
      yield 14;
      if (hit) yield* hurtMon(hit, ri(18, 24), 'ほのおで '); else msg('ほのおは なにもない ところで きえた。');
      break;
    }
    case 'light': {
      for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (passable(F, x, y)) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (inMap(x + dx, y + dy)) F.seen[(y + dy) * MW + x + dx] = 1;
      Audio8.sfx('sparkle'); G.flash = 8; msg('この階の ようすが わかった!');
      break;
    }
    case 'lull': {
      const ms = G.mons.filter(m => visible(F, m.x, m.y)); Audio8.sfx('sleep');
      for (const m of ms) { m.sleepT = 8; m.conf = 0; }
      msg(ms.length ? 'こもりうたが ながれて 悪夢たちは ねむってしまった。' : 'こもりうたが ながれた… でも だれも いなかった。');
      break;
    }
    case 'storm': {
      const ms = G.mons.filter(m => visible(F, m.x, m.y)); Audio8.sfx('wind'); G.shake = 12;
      if (!ms.length) msg('おおあらしが ふきぬけた… でも だれも いなかった。');
      for (const m of ms) { yield 6; yield* hurtMon(m, ri(15, 22), 'あらしで '); }
      break;
    }
    case 'ward': msg('なにも おこらなかった… 床に おくと いいのかも しれない。'); break;
  }
  yield 16;
  yield* endTurn();
}
// しきべつのページ: read it and pick one unknown item from the bag
function* actIdentify(pageIdx, target) {
  const page = G.bag[pageIdx]; G.bag.splice(pageIdx, 1);
  msg(`${dispName(page)}を よんだ。`); identify(page.k);
  yield 10;
  if (target && unknown(target.k)) { const before = dispName(target); identify(target.k); Audio8.sfx('sparkle'); msg(`${before}は ${dispName(target)}だった!`); }
  else msg('しらべる ものが なかった。');
  yield 16;
  yield* endTurn();
}
// throw in the facing direction: flies up to 10 tiles, candies work on the monster they hit
function* actThrow(i) {
  const p = G.p, F = G.F, it = G.bag[i];
  G.bag.splice(i, 1);
  let [dx, dy] = p.dir; if (p.conf > 0) [dx, dy] = DIRS8[ri(0, 7)];
  p.dir = [dx, dy]; p.lunge = 8; Audio8.sfx('whoosh'); msg(`${dispName(it)}を なげた。`);
  let x = p.x, y = p.y, hit = null;
  G.proj = { k: it.k, x: x * T, y: y * T };
  for (let n = 0; n < 10 && canStep(F, x, y, dx, dy); n++) {
    x += dx; y += dy;
    for (let f = 0; f < 4; f++) { G.proj.x += dx * 4; G.proj.y += dy * 4; yield 1; }
    const m = monAt(x, y); if (m) { hit = m; break; }
  }
  G.proj = null;
  if (hit && rnd() < 0.92) yield* throwHit(it, hit);
  else { if (hit) { msg(`${MONSTERS[hit.k].name}に よけられた。`); hit.asleep = false; } landItem(it, x, y); }
  yield 8;
  yield* endTurn();
}
function* throwHit(it, m) {
  const D = ITEMS[it.k], before = dispName(it), mn = MONSTERS[m.k].name;
  const known = () => { if (identify(it.k)) msg(`(${before}は ${D.name}だった)`); };
  m.asleep = false; m.track = 10;
  switch (D.kind) {
    case 'heal': m.hp = Math.min(m.mhp, m.hp + D.hp); popup(m, D.hp, UI.hp); msg(`${mn}の HPが かいふくしてしまった。`); known(); break;
    case 'conf': m.conf = 10; msg(`${mn}は こんらんした!`); known(); break;
    case 'sleep': m.sleepT = 10; msg(`${mn}は ねむってしまった!`); known(); break;
    case 'fast': m.fastT = 20; msg(`${mn}の 足が はやくなった!`); known(); break;
    case 'fire': known(); Audio8.sfx('fire'); yield* hurtMon(m, ri(18, 24), 'ほのおで '); break;
    default: yield* hurtMon(m, 1, ''); break; // anything else just bonks
  }
}
// an item that misses or hits a wall lands on the nearest free floor tile
function landItem(it, x, y) {
  const F = G.F;
  for (let r = 0; r <= 2; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const X = x + dx, Y = y + dy;
    if (!passable(F, X, Y) || itemAt(X, Y) || (F.stairs.x === X && F.stairs.y === Y)) continue;
    it.x = X; it.y = Y; if (it.k === 'mamori') it.placed = true; G.items.push(it); msg(`${dispName(it)}は 床に おちた。`); return;
  }
  msg(`${dispName(it)}は きえてしまった。`);
}
function* actDrop(i) {
  const p = G.p, it = G.bag[i];
  if (itemAt(p.x, p.y) || (G.F.stairs.x === p.x && G.F.stairs.y === p.y)) { msg('ここには おけない。'); return; }
  G.bag.splice(i, 1); it.x = p.x; it.y = p.y; G.items.push(it);
  if (it.k === 'mamori') { it.placed = true; identify('mamori'); msg('まもりのページを 床に おいた。ページが ふわりと ひかった。', UI.gold); Audio8.sfx('holy'); }
  else msg(`${dispName(it)}を 足元に おいた。`);
  yield 6; yield* endTurn();
}
function pickUpHere(onStep) {
  const p = G.p, it = itemAt(p.x, p.y); if (!it) return;
  if (it.k === 'star') { G.stars += it.n; G.items.splice(G.items.indexOf(it), 1); Audio8.sfx('pickup'); msg(`ほしのかけらを ${it.n}こ ひろった。`); return; }
  if (isWard(it)) { if (!onStep) msg('まもりのページは 床に はりついている。'); return; }
  if (G.bag.length >= BAG_MAX) { msg(onStep ? `${dispName(it)}の 上に のった。(もちものが いっぱい)` : 'もちものが いっぱいで ひろえない。'); return; }
  G.items.splice(G.items.indexOf(it), 1); G.bag.push({ k: it.k }); Audio8.sfx('pickup'); msg(`${dispName(it)}を ひろった。`);
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
  if (p.conf > 0 && --p.conf === 0) msg('こんらんが なおった。');
  // はやあし: every other action is free (the monsters do not move)
  if (p.fastT > 0) {
    if (--p.fastT === 0) msg('足が もとに もどった。');
    G.fastPhase = !G.fastPhase;
    if (G.fastPhase && p.fastT > 0) { updateFov(F, p.x, p.y); return; }
  }
  // monsters act; distance fields are shared within this turn
  G.df = {};
  const before = new Set(G.mons.filter(m => visible(F, m.x, m.y)));
  for (const m of [...G.mons]) {
    const n = (MONSTERS[m.k].speed || 1) + (m.fastT > 0 ? 1 : 0);
    if (m.fastT > 0) m.fastT--;
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
  if (m.sleepT > 0) { m.sleepT--; return; }
  if (m.conf > 0) { // stagger in a random direction (and hit whatever is there)
    m.conf--; const [cx, cy] = DIRS8[ri(0, 7)]; m.dir = [cx, cy];
    if (p.x === m.x + cx && p.y === m.y + cy && canStep(F, m.x, m.y, cx, cy) && !isWard(itemAt(p.x, p.y))) { yield* monAttack(m, cx, cy); return; }
    if (canStep(F, m.x, m.y, cx, cy) && !occupied(m.x + cx, m.y + cy)) { m.x += cx; m.y += cy; }
    return;
  }
  const ward = isWard(itemAt(p.x, p.y)); // standing on まもりのページ: nightmares will not attack
  const sees = canSee(m) && !ward;
  if (sees) { m.track = 10; m.goal = [p.x, p.y]; }
  else if (m.track > 0 && !ward) { m.track--; if (cheb(m, p) <= 7) m.goal = [p.x, p.y]; }
  const dx = Math.sign(p.x - m.x), dy = Math.sign(p.y - m.y);
  if (!ward && cheb(m, p) === 1 && canStep(F, m.x, m.y, dx, dy)) { yield* monAttack(m, dx, dy); return; }
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
