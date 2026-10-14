'use strict';
// ===== Trial Tower (試練の塔): endless repeatable floors on the six painted maps =====
// logic (floor generation) is pure so test/sim.js can load it; towerRun() is the scene generator used from the camp.
const TOWER_CAP = 5, TOWER_BOSS_EVERY = 5, TOWER_HEAL = 0.3;
const TOWER_PRIZE = { 5: 'guard_spear', 10: 'sky_bow', 15: 'star_tome', 20: 'shadow_blade', 25: 'tree_staff' };
const TOWER_ELITES = [
  { key: 'boss', name: '塔の番人ゴルド', cls: '鉄壁の番人', aura: '255,200,80' }, { key: 'verza', name: '星影の司祭ミルザ', cls: '星影の司祭', aura: '110,200,255' },
  { key: 'boss', name: '黄金の覇者ガルディス', cls: '黄金の覇者', aura: '255,120,60' }, { key: 'verza', name: '虚空の司祭ヴォイド', cls: '虚空の司祭', aura: '190,70,255' }];
const TOWER_KEY = 'starfall_tactics_tower_best';
function trng(seed) { let s = (seed ^ 0x9e3779b9) >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function towerMeta(meta) { if (!meta.tower) meta.tower = { best: 0, claimed: {} }; return meta.tower; }
function towerBestLS() { try { return +localStorage.getItem(TOWER_KEY) || 0; } catch (e) { return 0; } }
function towerSetBest(meta, f) { const T = towerMeta(meta); if (f > T.best) T.best = f; try { if (T.best > towerBestLS()) localStorage.setItem(TOWER_KEY, String(T.best)); } catch (e) { } }
const towerUnlocked = meta => meta.cleared >= 1;
const towerBoss = f => f % TOWER_BOSS_EVERY === 0;
function towerMapIdx(f) { // shuffled order of the six maps, re-shuffled every six floors; floor 1 is always the first (small) map
  const block = Math.floor((f - 1) / 6), r = trng(block * 31 + 5), perm = [0, 1, 2, 3, 4, 5];
  for (let i = 5; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  if (block === 0) { const k = perm.indexOf(0); [perm[0], perm[k]] = [perm[k], perm[0]]; }
  return perm[(f - 1) % 6];
}
const towerDeployable = u => u.team !== 2 && !(u.injured > 0) && u.joined !== false;
function towerDefaultDeploy(roster) {
  const ids = Object.keys(roster).filter(id => towerDeployable(roster[id]));
  ids.sort((a, b) => (a === 'leon' ? -1 : b === 'leon' ? 1 : roster[b].lv - roster[a].lv)); return ids.slice(0, TOWER_CAP);
}
const towerValidDeploy = (roster, list) => !!list && list.includes('leon') && list.length <= TOWER_CAP && list.every(id => roster[id] && towerDeployable(roster[id]));
// one floor as a chapter-shaped object (the battle code needs nothing else)
function towerChapter(f, avg0, startF, P) {
  const R = trng(f * 7919 + 13), mi = towerMapIdx(f), base = CHAPTERS[mi], map = base.map, w = map[0].length, h = map.length, pseudo = { rows: map, w, h };
  const walk = (x, y) => !TERRAIN[map[y][x]].block, boss = towerBoss(f);
  const slots = base.slots.map(s => s.slice()), has = (x, y) => slots.some(s => s[0] === x && s[1] === y);
  const near = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (walk(x, y) && !has(x, y)) near.push([x, y, Math.abs(x - slots[0][0]) + Math.abs(y - slots[0][1])]);
  near.sort((a, b) => a[2] - b[2] || a[1] - b[1] || a[0] - b[0]); for (const q of near) { if (slots.length >= TOWER_CAP) break; slots.push([q[0], q[1]]); }
  const dm = distMap(pseudo, slots), cand = []; let maxd = 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (walk(x, y) && dm.has(kk(x, y)) && !has(x, y)) { const d = dm.get(kk(x, y)); cand.push({ x, y, d }); if (d > maxd) maxd = d; }
  const used = [], pick = (lo, hi) => {
    let pool = cand.filter(c => c.d >= lo * maxd && c.d <= hi * maxd && !used.some(q => Math.abs(q.x - c.x) + Math.abs(q.y - c.y) < 2));
    if (!pool.length) pool = cand.filter(c => !used.some(q => q.x === c.x && q.y === c.y)); const c = pool[Math.floor(R() * pool.length)]; used.push(c); return c;
  };
  const lvl = Math.max(1, Math.min(30, Math.max(avg0 - 1 + Math.floor((f - startF) / 2), Math.floor(f * 0.75) + 2))); // party level - 1, +1 per two floors; never below the floor's own baseline
  let n = Math.max(2, Math.min(14, Math.round((2 + f * 0.5) * (0.5 + 0.1 * P)))); if (boss) n = Math.max(2, Math.round(n * 0.7));
  const pool = f <= 2 ? ['goblin', 'slime', 'goblin'] : f <= 5 ? ['goblin', 'slime', 'skeleton', 'goblin', 'skeleton'] : f <= 9 ? ['goblin', 'skeleton', 'skeleton', 'darkmage', 'slime'] : ['goblin', 'skeleton', 'skeleton', 'darkmage', 'darkmage'];
  const enemies = [], list = [];
  for (let i = 0; i < n; i++) { const c = pick(0.4, 1); list.push({ c, t: pool[Math.floor(R() * pool.length)] }); }
  list.sort((a, b) => a.c.d - b.c.d); list.forEach((q, i) => enemies.push([q.t, q.c.x, q.c.y, lvl, i < Math.ceil(n / 2) ? 'aggro' : 'wait']));
  let elite = null;
  if (boss) {
    const eb = f < 10 ? 1 : 2, E = TOWER_ELITES[(f / TOWER_BOSS_EVERY - 1) % TOWER_ELITES.length], c = pick(0.8, 1), L = lvl + (f < 10 ? 1 : 2), d = ENEMY_T[E.key], s = scaledStats(d.base, d.gr, L);
    const ex = { name: E.name, cls: E.cls, aura: E.aura, gold: 60 + f * 8, maxhp: Math.round(s.hp * Math.min(1.5, 1.1 + f * 0.02)) + 6, skl: s.skl + 1, str: s.str + (s.str > 0 ? eb : 0), mag: s.mag + (s.mag > 0 ? eb : 0), def: s.def + eb, res: s.res + eb };
    ex.hp = ex.maxhp; enemies.push([E.key, c.x, c.y, L, 'hold', ex]); elite = E;
  }
  const chests = [pick(0.2, 0.6), pick(0.2, 0.7)]; const cs = [{ x: chests[0].x, y: chests[0].y, gold: 40 + 12 * f }, { x: chests[1].x, y: chests[1].y, item: f < 8 ? 'potion' : 'hipotion' }];
  return Object.assign({}, base, { title: '試練の塔', name: f + '階', goal: boss ? elite.name + 'を倒せ' : '敵を全滅させよ', win: boss ? 'boss' : 'rout', turns: 0, village: null, exits: null, recruit: null,
    slots, enemies, chests: cs, secrets: [], neutral: [], join: [], talks: [], cap: TOWER_CAP, reward: (40 + 20 * f) * (boss ? 2 : 1), tower: f, lvl, intro: null, bgm: boss ? 'boss' : 'field' });
}
// ---- scene: climb from startF; returns when the player goes home or is defeated ----
function towerHealAll(R) { for (const id in R) { const u = R[id]; if (u.joined === false) continue; u.dead = false; u.off = false; u.team = 0; u.hp = u.maxhp; u.deployed = false; } }
function towerHealParty(R, ids) { for (const id of ids) { const u = R[id], heal = Math.ceil(u.maxhp * TOWER_HEAL); u.hp = u.dead ? heal : Math.min(u.maxhp, u.hp + heal); u.dead = false; u.off = false; u.team = 0; } }
function* towerChoice(f, run, lines) {
  G.scene = 'tower'; flushInput(); Aud.bgm('win'); const items = [{ label: '次の階へ', id: 'next' }, { label: '帰還する', id: 'home' }]; G.title = { idx: 0, items }; G.tower = { f, run, lines };
  for (;;) {
    const a = Input.q.shift(), n = items.length;
    if (a === 'up') { G.title.idx = (G.title.idx + n - 1) % n; Aud.sfx('move'); } else if (a === 'down') { G.title.idx = (G.title.idx + 1) % n; Aud.sfx('move'); }
    else if (a === 'ok') { Aud.sfx('ok'); G.tower = null; return items[G.title.idx].id; }
    yield 1;
  }
}
function* towerRun(startF) {
  const R = G.roster, M = G.meta, T = towerMeta(M);
  const ids = (M.tdeploy && towerValidDeploy(R, M.tdeploy) ? M.tdeploy : towerDefaultDeploy(R)).slice();
  const avg0 = Math.round(ids.reduce((a, id) => a + R[id].lv, 0) / ids.length), run = { gold: 0 };
  let f = startF;
  for (;;) {
    const ch = towerChapter(f, avg0, startF, ids.length);
    yield* chapterCard(-1, ch);
    const S = newBattle(ch, R, M, ids, f > startF); G.chIdx = G.chIdx || 0;
    const res = yield* battleScene(S, -1);
    if (res !== 'win') {
      for (const id in R) if (R[id].joined !== false) { R[id].deployed = false; }
      towerHealAll(R); G.S = null;
      yield* dialogue([[null, '試練の塔から引き返した。傷は癒えた。 (最高 ' + T.best + '階)'], [null, 'この挑戦で得た金貨 ' + run.gold + 'G は、塔に置いてきた。経験は身についたままだ。']], 'camp');
      return 'lose';
    }
    const gold = S.gain.gold + ch.reward; run.gold += gold; towerSetBest(M, f);
    const lines = ['戦利品 ' + gold + 'G  (この挑戦の合計 ' + run.gold + 'G)'];
    const pr = TOWER_PRIZE[f]; if (pr && !T.claimed[f]) { T.claimed[f] = true; M.convoy.push(pr); lines.push('「' + WITEMS[pr].name + '」を手に入れた!'); }
    towerHealParty(R, ids);
    lines.push('HPが3割回復した。  最高到達 ' + T.best + '階');
    const pick = yield* towerChoice(f, run, lines);
    if (pick === 'home') { M.gold += run.gold; towerHealAll(R); G.S = null; saveGame(Base.chIdx, true); return 'home'; }
    f++;
  }
}
