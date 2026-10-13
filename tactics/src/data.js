'use strict';
// ===== data: terrain, weapons, classes, skills, items, units (chapters and story live in story.js) =====
const TERRAIN = {
  '.': { name: '草原', cost: 1, avo: 0, def: 0 },
  '=': { name: '道', cost: 1, avo: 0, def: 0 },
  'T': { name: '森', cost: 2, avo: 20, def: 1 },
  '^': { name: '山', cost: 3, avo: 30, def: 2 },
  '~': { name: '水', cost: 99, avo: 0, def: 0, block: true },
  '#': { name: '砦', cost: 1, avo: 20, def: 2, heal: 0.2 },
  'V': { name: '村', cost: 1, avo: 10, def: 1 },
  // blocking scenery (drawn from `props` / sprites; units can neither enter nor cross)
  'H': { name: '民家', cost: 99, avo: 0, def: 0, block: true },
  'A': { name: '天幕', cost: 99, avo: 0, def: 0, block: true },
  'R': { name: '廃墟', cost: 99, avo: 0, def: 0, block: true },
  'P': { name: '障害物', cost: 99, avo: 0, def: 0, block: true },
  'F': { name: '柵', cost: 99, avo: 0, def: 0, block: true },
  'M': { name: '岩山', cost: 99, avo: 0, def: 0, block: true },
  'Z': { name: '虚空', cost: 99, avo: 0, def: 0, block: true }
};
// enemy weapons (and the family icon / animation of the heroes' weapons)
const WEAPONS = {
  spear:  { names: ['鉄の槍'], tri: 'spear', type: 'phys', might: 6, hit: 85, min: 1, max: 1 },
  bow:    { names: ['鉄の弓'], type: 'phys', might: 5, hit: 85, min: 2, max: 2 },
  tome:   { names: ['ファイア'], type: 'mag', might: 5, hit: 85, min: 1, max: 2 },
  staff:  { names: ['ライブ'], type: 'heal', might: 4, hit: 100, min: 1, max: 1 },
  dagger: { names: ['短剣'], tri: 'sword', type: 'phys', might: 4, hit: 95, min: 1, max: 1 },
  axe:    { names: ['手斧'], tri: 'axe', type: 'phys', might: 5, hit: 75, min: 1, max: 1 },
  sword:  { names: ['骨の剣'], tri: 'sword', type: 'phys', might: 5, hit: 80, min: 1, max: 1 },
  slime:  { names: ['溶解液'], type: 'phys', might: 3, hit: 80, min: 1, max: 1 },
  dark:   { names: ['ダークボルト'], type: 'mag', might: 5, hit: 80, min: 1, max: 1 + 1 },
  gold:   { names: ['黄金の大槍'], tri: 'spear', type: 'phys', might: 7, hit: 85, min: 1, max: 1 }
};
// weapon items (heroes): fam = family (icon / animation), tier 0 iron, 1 steel, 2 silver, 3 special
const PRICE = { steel: 260, silver: 520, special: 640 };
function wfam(fam, tri, type, list) { // list: [id, name, might, hit, price, tier, extra]
  for (const [id, name, might, hit, price, tier, ex] of list) WITEMS[id] = Object.assign({ id, name, fam, tri, type, might, hit, price, tier, min: 1, max: type === 'mag' ? 2 : 1, crit: 0 }, ex || {});
}
const WITEMS = {};
wfam('spear', 'spear', 'phys', [['iron_spear', '鉄の槍', 6, 85, 0, 0], ['steel_spear', '鋼の槍', 8, 82, PRICE.steel, 1], ['silver_spear', '銀の槍', 10, 80, PRICE.silver, 2], ['lion_spear', '獅子の槍', 12, 72, PRICE.special, 3, { crit: 6 }]]);
wfam('bow', null, 'phys', [['iron_bow', '鉄の弓', 5, 85, 0, 0, { min: 2, max: 2 }], ['steel_bow', '鋼の弓', 7, 82, PRICE.steel, 1, { min: 2, max: 2 }], ['silver_bow', '銀の弓', 9, 80, PRICE.silver, 2, { min: 2, max: 2 }], ['long_bow', '長弓', 7, 74, PRICE.special, 3, { min: 2, max: 3 }]]);
wfam('tome', null, 'mag', [['fire', 'ファイア', 5, 85, 0, 0], ['elfire', 'エルファイア', 7, 82, PRICE.steel, 1], ['bolgano', 'ボルガノン', 9, 78, PRICE.silver, 2], ['raikou', '雷光の書', 11, 70, PRICE.special, 3, { crit: 8 }]]);
wfam('staff', null, 'heal', [['live', 'ライブ', 4, 100, 0, 0], ['relive', 'リライブ', 6, 100, PRICE.steel, 1], ['miracle', 'ミラクル', 8, 100, PRICE.silver, 2], ['holy', '聖なる杖', 10, 100, PRICE.special, 3]]);
wfam('dagger', 'sword', 'phys', [['dagger', '短剣', 4, 95, 0, 0], ['steel_dagger', '鋼の短剣', 6, 92, PRICE.steel, 1], ['silver_dagger', '銀の短剣', 8, 90, PRICE.silver, 2], ['viper', '毒蛇の牙', 6, 100, PRICE.special, 3, { crit: 20 }]]);
wfam('tome', null, 'mag', [['light', '光の書', 6, 88, 0, 0], ['light2', '聖光の書', 9, 85, PRICE.silver, 2]]);
for (const id of ['light', 'light2']) { WITEMS[id].fam = 'tome'; WITEMS[id].light = true; WITEMS[id].noshop = id === 'light'; }
const START_WID = { leon: 'iron_spear', mira: 'iron_bow', luka: 'fire', sophia: 'live', jin: 'dagger' };
const ITEMS = {
  potion: { name: '傷薬', heal: 15, price: 40, desc: 'HPを15回復' },
  hipotion: { name: '特傷薬', heal: 30, price: 100, desc: 'HPを30回復', stage: 2 }
};
const MAX_ITEMS = 3;
const STATS = ['hp', 'str', 'mag', 'skl', 'spd', 'def', 'res'];
const STAT_JP = { hp: 'HP', str: '力', mag: '魔力', skl: '技', spd: '速さ', def: '守備', res: '魔防', mov: '移動' };
// base: stats at Lv1; gr: growth rates (%)
const HEROES = {
  leon:   { name: 'レオン', cls: 'ナイト', sprite: 'hero_knight', wpn: 'spear', base: { hp: 24, str: 7, mag: 0, skl: 5, spd: 4, def: 7, res: 1, mov: 4 }, gr: { hp: 85, str: 55, mag: 5, skl: 45, spd: 35, def: 50, res: 25 } },
  mira:   { name: 'ミラ', cls: 'アーチャー', sprite: 'hero_archer', wpn: 'bow', base: { hp: 19, str: 5, mag: 0, skl: 7, spd: 7, def: 2, res: 1, mov: 5 }, gr: { hp: 70, str: 45, mag: 5, skl: 55, spd: 55, def: 25, res: 25 } },
  luka:   { name: 'ルカ', cls: 'メイジ', sprite: 'hero_mage', wpn: 'tome', base: { hp: 18, str: 0, mag: 7, skl: 5, spd: 4, def: 1, res: 5, mov: 5 }, gr: { hp: 60, str: 0, mag: 60, skl: 45, spd: 40, def: 15, res: 45 } },
  sophia: { name: 'ソフィア', cls: 'ヒーラー', sprite: 'hero_healer', wpn: 'staff', base: { hp: 18, str: 0, mag: 6, skl: 4, spd: 5, def: 1, res: 6, mov: 5 }, gr: { hp: 60, str: 0, mag: 50, skl: 40, spd: 40, def: 15, res: 50 } },
  jin:    { name: 'ジン', cls: 'シーフ', sprite: 'hero_thief', wpn: 'dagger', base: { hp: 18, str: 5, mag: 0, skl: 7, spd: 9, def: 2, res: 1, mov: 6 }, gr: { hp: 65, str: 45, mag: 0, skl: 50, spd: 60, def: 25, res: 20 } }
};
const ENEMY_T = {
  goblin:   { name: 'ゴブリン', cls: 'ゴブリン', sprite: 'enemy_goblin', wpn: 'axe', gold: 16, base: { hp: 18, str: 5, mag: 0, skl: 3, spd: 4, def: 2, res: 0, mov: 5 }, gr: { hp: 70, str: 40, mag: 0, skl: 30, spd: 30, def: 30, res: 15 } },
  slime:    { name: 'スライム', cls: 'スライム', sprite: 'enemy_slime', wpn: 'slime', gold: 10, base: { hp: 14, str: 3, mag: 0, skl: 2, spd: 3, def: 1, res: 0, mov: 4 }, gr: { hp: 70, str: 40, mag: 0, skl: 30, spd: 30, def: 25, res: 10 } },
  skeleton: { name: 'スケルトン', cls: 'スケルトン', sprite: 'enemy_skeleton', wpn: 'sword', gold: 22, base: { hp: 20, str: 6, mag: 0, skl: 4, spd: 4, def: 4, res: 0, mov: 4 }, gr: { hp: 70, str: 45, mag: 0, skl: 35, spd: 35, def: 35, res: 15 } },
  darkmage: { name: 'ダークメイジ', cls: 'ヴェルザの司祭', sprite: 'enemy_darkmage', wpn: 'dark', gold: 28, base: { hp: 16, str: 0, mag: 6, skl: 5, spd: 4, def: 1, res: 5, mov: 4 }, gr: { hp: 60, str: 0, mag: 45, skl: 35, spd: 35, def: 15, res: 40 } },
  volk:     { name: '司祭ヴォルク', cls: '灰の司祭', sprite: 'enemy_darkmage', wpn: 'dark', gold: 140, boss: true, aura: '170,90,255', base: { hp: 36, str: 0, mag: 9, skl: 7, spd: 6, def: 3, res: 8, mov: 4 }, gr: { hp: 80, str: 0, mag: 50, skl: 40, spd: 35, def: 25, res: 40 } },
  boss:     { name: 'ガルド', cls: '金角将軍', sprite: 'enemy_boss', wpn: 'gold', gold: 200, boss: true, base: { hp: 38, str: 9, mag: 0, skl: 7, spd: 5, def: 7, res: 2, mov: 4 }, gr: { hp: 80, str: 50, mag: 0, skl: 40, spd: 35, def: 40, res: 25 } },
  verza:    { name: '闇の司祭ヴェルザ', cls: '星堕としの司祭', sprite: 'enemy_darkmage', wpn: 'dark', gold: 0, boss: true, aura: '200,60,255', base: { hp: 44, str: 0, mag: 11, skl: 8, spd: 7, def: 4, res: 10, mov: 4 }, gr: { hp: 80, str: 0, mag: 50, skl: 40, spd: 35, def: 25, res: 40 } }
};
function scaledStats(base, gr, lv) { // deterministic growth for enemies / late joiners
  const s = Object.assign({}, base);
  for (const k of STATS) s[k] = Math.round(base[k] + (gr[k] || 0) * (lv - 1) / 100);
  return s;
}
// weapon triangle: sword > axe > spear > sword (advantage: +1 damage, +15 hit; disadvantage: the reverse)
const TRI_BEATS = { sword: 'axe', axe: 'spear', spear: 'sword' };
// hero specials: once per chapter. shot/meteor/ambush modify the weapon for one attack; buff/pray are instant
const SP = {
  leon: { name: '鼓舞', kind: 'buff', desc: '隣の味方の攻撃+2(このターン)' },
  mira: { name: '狙撃', kind: 'shot', desc: '射程2〜3・威力+3・命中+10' },
  luka: { name: 'メテオ', kind: 'meteor', desc: '射程1〜3・威力+3・着弾点の周囲1マスにも6割の被害' },
  sophia: { name: '祈り', kind: 'pray', desc: '2マス以内の味方全員を回復' },
  jin: { name: '奇襲', kind: 'ambush', desc: '威力+2・命中+30・必ず2回攻撃' },
  // boss signature moves (enemy side, once per battle; chosen by the AI)
  boss: { name: '金角断', kind: 'cleave', foe: true, desc: '威力x1.5の渾身の一撃' },
  verza: { name: '星落とし', kind: 'starfall', foe: true, desc: '威力+2・着弾点の周囲に半分の被害' }
};
// passive skills: choose 1 of 2 at Lv5 and 1 of 2 at Lv10. m = modifiers (dmg dealt, taken reduction, hit, avo, crit, spd, heal)
const SKILLS = {
  guard: { name: '守護', desc: '受けるダメージ-2', m: { taken: 2 } }, charge: { name: '突撃', desc: '与えるダメージ+2', m: { dmg: 2 } },
  rapid: { name: '連射', desc: '速さ+3(追撃しやすい)', m: { spd: 3 } }, eagle: { name: '鷹の目', desc: '命中+15', m: { hit: 15 } },
  amp: { name: '魔力増幅', desc: '与えるダメージ+3', m: { dmg: 3 } }, quick: { name: '詠唱短縮', desc: '速さ+2・命中+10', m: { spd: 2, hit: 10 } },
  mercy: { name: '慈愛', desc: '回復量+4', m: { heal: 4 } }, bless: { name: '加護', desc: '受けるダメージ-1・回避+10', m: { taken: 1, avo: 10 } },
  dodge: { name: '回避', desc: '回避+15', m: { avo: 15 } }, vital: { name: '急所', desc: '必殺率+20', m: { crit: 20 } },
  immov: { name: '不動', desc: '受けるダメージ-3', m: { taken: 3 } }, blaze: { name: '烈火', desc: '与えるダメージ+3', m: { dmg: 3 } },
  rapid2: { name: '速射', desc: '速さ+4', m: { spd: 4 } }, snipe: { name: '狙い撃ち', desc: '命中+20・必殺率+10', m: { hit: 20, crit: 10 } },
  sage: { name: '大賢者の知恵', desc: '与えるダメージ+4', m: { dmg: 4 } }, flash: { name: '瞬唱', desc: '速さ+4・命中+10', m: { spd: 4, hit: 10 } },
  saint: { name: '聖女の慈悲', desc: '回復量+6', m: { heal: 6 } }, halo: { name: '光の加護', desc: '受けるダメージ-2・回避+10', m: { taken: 2, avo: 10 } },
  shadow: { name: '影走り', desc: '回避+25', m: { avo: 25 } }, assassin: { name: '暗殺術', desc: '必殺率+35', m: { crit: 35 } }
};
const SKILL_PICKS = { // [Lv5 pair, Lv10 pair]
  leon: [['guard', 'charge'], ['immov', 'blaze']], mira: [['rapid', 'eagle'], ['rapid2', 'snipe']], luka: [['amp', 'quick'], ['sage', 'flash']],
  sophia: [['mercy', 'bless'], ['saint', 'halo']], jin: [['dodge', 'vital'], ['shadow', 'assassin']]
};
const PROMO = { // class change at Lv10 with a 勇者の証
  leon: { cls: 'パラディン', d: { hp: 5, str: 3, def: 3, res: 2, skl: 2, spd: 2, mov: 1 }, desc: '移動+1・全能力が伸びる' },
  mira: { cls: 'スナイパー', d: { hp: 4, str: 3, skl: 5, spd: 2, def: 1, res: 1 }, desc: '攻撃と技が大きく伸びる' },
  luka: { cls: '賢者', d: { hp: 4, mag: 4, skl: 2, spd: 2, res: 3 }, heal: true, desc: '魔法に加えて杖で回復もできる' },
  sophia: { cls: '司祭', d: { hp: 4, mag: 3, res: 2, skl: 2, spd: 1, def: 1 }, light: true, desc: '光の魔法で攻撃もできる' },
  jin: { cls: 'アサシン', d: { hp: 4, str: 3, skl: 3, spd: 3, def: 1 }, crit: 10, desc: '必殺率+10・全能力が伸びる' }
};
// bonds: points gain +1 per turn when two allies who both acted end the turn adjacent
const BOND_AT = [0, 3, 7, 12], BOND_RANK = ['', 'C', 'B', 'A'];
const BOND_FX = [{ hit: 0, avo: 0, crit: 0 }, { hit: 5, avo: 5, crit: 0 }, { hit: 8, avo: 8, crit: 3 }, { hit: 12, avo: 12, crit: 6 }];
const BOND_PAIRS = [['leon', 'mira'], ['leon', 'jin'], ['mira', 'sophia'], ['luka', 'sophia'], ['jin', 'mira']];
const bondKey = (a, b) => a < b ? a + '-' + b : b + '-' + a;
const bondLevel = (pts) => pts >= BOND_AT[3] ? 3 : pts >= BOND_AT[2] ? 2 : pts >= BOND_AT[1] ? 1 : 0;
function weaponOf(u) {
  let o;
  if (u.wid && WITEMS[u.wid]) { const w = WITEMS[u.wid]; o = { name: w.name, type: w.type, tri: w.tri || null, might: w.might + (u.forge || 0), hit: w.hit, min: w.min, max: w.max, crit: w.crit || 0 }; }
  else { const w = WEAPONS[u.wpn]; o = { name: w.names[0], type: w.type, tri: w.tri || null, might: w.might, hit: w.hit, min: w.min, max: w.max, crit: 0 }; }
  const k = u.spActive;
  if (k === 'shot') { o.min = 2; o.max = 3; o.might += 3; o.hit += 10; o.name = '狙撃'; }
  else if (k === 'meteor') { o.min = 1; o.max = 3; o.might += 3; o.hit += 10; o.name = 'メテオ'; }
  else if (k === 'ambush') { o.might += 2; o.hit += 30; o.name = '奇襲'; }
  else if (k === 'cleave') { o.might = Math.round(o.might * 1.5); o.name = '金角断'; }
  else if (k === 'starfall') { o.might += 2; o.name = '星落とし'; }
  else if (k === 'heal') { o = { name: 'ライブ', type: 'heal', tri: null, might: 4, hit: 100, min: 1, max: 1, crit: 0 }; }
  return o;
}
function makeHero(id, lv) {
  const d = HEROES[id], s = scaledStats(d.base, d.gr, lv);
  return Object.assign({ id, key: id, name: d.name, cls: d.cls, sprite: d.sprite, team: 0, lv, exp: 0, wpn: d.wpn, wid: START_WID[id], tier: 0, forge: 0, items: ['potion', 'potion'], skills: [], promoted: false, canHeal: id === 'sophia', injured: 0, maxhp: s.hp, hp: s.hp, ai: null, boss: false, lord: id === 'leon', dir: 'down' }, s, { hp: s.hp });
}
function makeEnemy(t, lv, x, y, ai, extra) {
  const d = ENEMY_T[t], s = scaledStats(d.base, d.gr, lv);
  return Object.assign({ id: t + '_' + x + '_' + y, key: t, name: d.name, cls: d.cls, sprite: d.sprite, team: 1, lv, exp: 0, wpn: d.wpn, tier: 0, gold: d.gold || 0, aura: d.aura || null, items: [], skills: [], maxhp: s.hp, ai: ai || 'aggro', boss: !!d.boss, lord: false, x, y, dir: 'left' }, s, { hp: s.hp }, extra || {});
}
