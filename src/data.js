// ===================== GAME DATA =====================
const ALL = ['allen', 'lina', 'kai', 'zek'];
const ITEMS = {
  potion: { name: 'ポーション', type: 'use', price: 30, heal: 60, target: 'ally', desc: 'HPを60回復する' },
  hipotion: { name: 'ハイポーション', type: 'use', price: 150, heal: 250, target: 'ally', desc: 'HPを250回復する' },
  ether: { name: 'エーテル', type: 'use', price: 200, mpheal: 40, target: 'ally', desc: 'MPを40回復する' },
  phoenix: { name: '不死鳥の羽', type: 'use', price: 250, revive: 0.3, target: 'ally', dead: true, desc: '戦闘不能から復活させる' },
  antidote: { name: '毒消し', type: 'use', price: 20, cure: true, target: 'ally', desc: '毒を治す' },
  elixir: { name: 'エリクサー', type: 'use', price: 0, full: true, target: 'ally', desc: 'HPとMPを全回復する' },
  megapotion: { name: 'メガポーション', type: 'use', price: 600, heal: 150, target: 'allies', desc: '味方全員のHPを150回復する' },
  tent: { name: 'テント', type: 'use', price: 250, tent: true, field: 'only', target: 'party', desc: 'フィールドで使うと全員全回復' },
  // weapons
  copper: { name: '銅の剣', type: 'weapon', atk: 6, eq: ['allen'], price: 50 },
  iron: { name: '鉄の剣', type: 'weapon', atk: 14, eq: ['allen'], price: 240 },
  mythril: { name: 'ミスリルソード', type: 'weapon', atk: 26, eq: ['allen'], price: 900 },
  rune: { name: 'ルーンブレイド', type: 'weapon', atk: 40, mag: 4, eq: ['allen'], price: 0 },
  windblade: { name: 'ウィンドブレード', type: 'weapon', atk: 50, mag: 6, spd: 3, eq: ['allen'], price: 0 },
  oakstaff: { name: '樫の杖', type: 'weapon', atk: 3, mag: 2, eq: ['lina', 'zek'], price: 40 },
  cleric: { name: 'クレリックロッド', type: 'weapon', atk: 7, mag: 7, eq: ['lina'], price: 420 },
  wizard: { name: 'ウィザードロッド', type: 'weapon', atk: 7, mag: 9, eq: ['zek'], price: 480 },
  sage: { name: '賢者の杖', type: 'weapon', atk: 10, mag: 15, eq: ['lina', 'zek'], price: 0 },
  dagger: { name: 'ダガー', type: 'weapon', atk: 9, eq: ['kai'], price: 60 },
  mdagger: { name: 'ミスリルダガー', type: 'weapon', atk: 22, eq: ['kai'], price: 800 },
  assassin: { name: 'アサシンダガー', type: 'weapon', atk: 34, spd: 3, eq: ['kai'], price: 0 },
  gale: { name: 'ゲイルダガー', type: 'weapon', atk: 40, spd: 5, eq: ['kai'], price: 0 },
  zephyr: { name: 'ゼピュロスの杖', type: 'weapon', atk: 12, mag: 19, eq: ['lina', 'zek'], price: 0 },
  // armor
  cloth: { name: '旅人の服', type: 'armor', def: 3, mdf: 1, eq: ALL, price: 30 },
  chain: { name: '鎖かたびら', type: 'armor', def: 8, mdf: 2, eq: ['allen', 'kai'], price: 180 },
  silk: { name: '絹のローブ', type: 'armor', def: 5, mdf: 5, eq: ['lina', 'zek'], price: 200 },
  mmail: { name: 'ミスリルメイル', type: 'armor', def: 16, mdf: 5, eq: ['allen', 'kai'], price: 1000 },
  srobe: { name: '賢者のローブ', type: 'armor', def: 10, mdf: 13, eq: ['lina', 'zek'], price: 950 },
  aerial: { name: 'エアリアルローブ', type: 'armor', def: 14, mdf: 18, eq: ['lina', 'zek'], price: 0 },
  galemail: { name: '疾風の鎧', type: 'armor', def: 22, mdf: 9, eq: ['allen', 'kai'], price: 0 },
};

const HEROES = {
  allen: { name: 'アレン', job: '剣士', cmd: 'わざ', crit: 0.06, weapon: 'copper', armor: 'cloth',
    base: { hp: 64, mp: 6, str: 12, def: 7, mag: 4, mdf: 4, spd: 9 }, grow: { hp: 14, mp: 1.2, str: 2.2, def: 1.4, mag: 0.5, mdf: 0.9, spd: 0.5 },
    skills: [['power', 1], ['whirl', 6], ['braver', 12]] },
  lina: { name: 'リナ', job: '白魔導士', cmd: '白魔法', crit: 0.04, weapon: 'oakstaff', armor: 'cloth',
    base: { hp: 46, mp: 20, str: 6, def: 5, mag: 11, mdf: 9, spd: 9 }, grow: { hp: 10, mp: 3.2, str: 0.8, def: 0.9, mag: 1.8, mdf: 1.4, spd: 0.5 },
    skills: [['heal', 1], ['cure', 2], ['healall', 6], ['protect', 7], ['revive', 9], ['haste', 10], ['holy', 13]] },
  kai: { name: 'カイ', job: 'トレジャーハンター', cmd: 'わざ', crit: 0.15, weapon: 'dagger', armor: 'cloth',
    base: { hp: 54, mp: 8, str: 10, def: 6, mag: 5, mdf: 5, spd: 14 }, grow: { hp: 12, mp: 1.3, str: 2.0, def: 1.1, mag: 0.5, mdf: 0.8, spd: 0.9 },
    skills: [['steal', 1], ['double', 4], ['mug', 7], ['shadow', 11]] },
  zek: { name: 'ゼク', job: '黒魔導士', cmd: '黒魔法', crit: 0.03, weapon: 'oakstaff', armor: 'cloth',
    base: { hp: 42, mp: 24, str: 5, def: 4, mag: 14, mdf: 9, spd: 8 }, grow: { hp: 9, mp: 3.6, str: 0.6, def: 0.8, mag: 2.1, mdf: 1.3, spd: 0.5 },
    skills: [['fire', 1], ['frost', 1], ['bolt', 1], ['drain', 5], ['blaze', 9], ['thundara', 10], ['meteor', 14]] },
};

// kind: phys | mag | heal | cure | revive | steal | buff
const SKILLS = {
  power: { name: '強撃', mp: 3, kind: 'phys', mult: 1.8, target: 'enemy', fx: 'slash2', desc: '渾身の一撃' },
  whirl: { name: '旋風斬', mp: 7, kind: 'phys', mult: 1.0, target: 'enemies', fx: 'whirl', desc: '敵全体を斬る' },
  braver: { name: 'ブレイバー', mp: 14, kind: 'phys', mult: 3.2, target: 'enemy', fx: 'braver', desc: '天を裂く大技' },
  heal: { name: 'ヒール', mp: 3, kind: 'heal', power: 22, target: 'ally', fx: 'heal', field: true, desc: '味方1人のHP回復' },
  cure: { name: 'キュア', mp: 2, kind: 'cure', target: 'ally', fx: 'heal', desc: '毒を治す' },
  healall: { name: 'ヒールオール', mp: 9, kind: 'heal', power: 20, target: 'allies', fx: 'heal', field: true, desc: '味方全員のHP回復' },
  revive: { name: 'リバイブ', mp: 14, kind: 'revive', target: 'ally', dead: true, fx: 'holy', field: true, desc: '戦闘不能から復活' },
  protect: { name: 'プロテス', mp: 8, kind: 'buff', buff: 'prot', target: 'allies', fx: 'barrier', desc: '味方全員の受ける物理ダメージを減らす' },
  haste: { name: 'ヘイスト', mp: 10, kind: 'buff', buff: 'haste', target: 'ally', fx: 'haste', desc: '味方1人のATBを速くする' },
  echo: { name: 'エコー', mp: 0, kind: 'echo', target: 'allies', fx: 'holy', desc: '想いの声が仲間を包む(ECHOゲージ満タンで使える)' },
  holy: { name: 'ホーリー', mp: 18, kind: 'mag', power: 62, elem: 'holy', target: 'enemy', fx: 'holy', desc: '聖なる光で攻撃' },
  steal: { name: 'ぬすむ', mp: 0, kind: 'steal', target: 'enemy', fx: 'none', desc: '敵から盗む' },
  double: { name: '二連撃', mp: 4, kind: 'phys', mult: 0.9, hits: 2, target: 'enemy', fx: 'slash', desc: '素早く2回斬る' },
  mug: { name: 'ぶんどる', mp: 3, kind: 'phys', mult: 1.1, steal: true, target: 'enemy', fx: 'slash', desc: '攻撃しながら道具を盗む' },
  shadow: { name: '影縫い', mp: 10, kind: 'phys', mult: 1.25, target: 'enemies', fx: 'dark', desc: '影の刃で敵全体を斬る' },
  fire: { name: 'フレイム', mp: 4, kind: 'mag', power: 16, elem: 'fire', target: 'enemy', fx: 'fire', desc: '炎で攻撃' },
  frost: { name: 'フロスト', mp: 4, kind: 'mag', power: 16, elem: 'ice', target: 'enemy', fx: 'ice', desc: '氷で攻撃' },
  bolt: { name: 'ボルト', mp: 4, kind: 'mag', power: 16, elem: 'bolt', target: 'enemy', fx: 'bolt', desc: '雷で攻撃' },
  drain: { name: 'ドレイン', mp: 6, kind: 'mag', power: 18, elem: 'dark', drain: true, target: 'enemy', fx: 'dark', desc: '敵のHPを吸い取る' },
  thundara: { name: 'サンダラ', mp: 12, kind: 'mag', power: 26, elem: 'bolt', target: 'enemies', fx: 'bolt', desc: '雷で敵全体を攻撃' },
  blaze: { name: 'ブレイズ', mp: 12, kind: 'mag', power: 26, elem: 'fire', target: 'enemies', fx: 'fire', desc: '炎で敵全体を攻撃' },
  meteor: { name: 'メテオ', mp: 28, kind: 'mag', power: 58, target: 'enemies', fx: 'meteor', desc: '隕石で敵全体を攻撃' },
  // enemy-only
  attack: { name: 'こうげき', kind: 'phys', mult: 1, target: 'enemy', fx: 'claw' },
  smash: { name: '叩きつけ', kind: 'phys', mult: 1.7, target: 'enemy', fx: 'slash2' },
  roar: { name: '雄叫び', kind: 'phys', mult: 0.55, target: 'enemies', fx: 'quake' },
  sting: { name: '毒針', kind: 'phys', mult: 1.0, poison: 0.6, target: 'enemy', fx: 'claw' },
  beam: { name: 'クリスタルビーム', kind: 'mag', power: 34, elem: 'holy', target: 'enemy', fx: 'beam' },
  quake: { name: '震撃', kind: 'phys', mult: 0.7, target: 'enemies', fx: 'quake' },
  darkblade: { name: '暗黒剣', kind: 'phys', mult: 1.9, target: 'enemy', fx: 'dark' },
  darkwave: { name: '闇の波動', kind: 'mag', power: 34, elem: 'dark', target: 'enemies', fx: 'dark' },
  firebite: { name: '炎の牙', kind: 'mag', power: 26, elem: 'fire', target: 'enemy', fx: 'fire' },
  gust: { name: 'エアロ', kind: 'mag', power: 30, target: 'enemy', fx: 'wind' },
  tornado: { name: 'トルネード', kind: 'mag', power: 26, target: 'enemies', fx: 'wind' },
  talon: { name: '鉤爪', kind: 'phys', mult: 1.6, target: 'enemy', fx: 'claw' },
};

const ENEMIES = {
  slime: { name: 'スライム', img: 'slime', hp: 18, str: 6, def: 3, mag: 2, mdf: 3, spd: 6, exp: 5, gil: 6, weak: ['fire'], drop: ['potion', 0.12], steal: 'potion' },
  bat: { name: '吸血コウモリ', img: 'bat', hp: 14, str: 8, def: 2, mag: 2, mdf: 2, spd: 14, exp: 6, gil: 5, weak: ['bolt'], steal: 'potion' },
  goblin: { name: 'ゴブリン', img: 'goblin', hp: 26, str: 9, def: 4, mag: 2, mdf: 2, spd: 8, exp: 9, gil: 14, drop: ['antidote', 0.15], steal: 'potion' },
  skeleton: { name: 'スケルトン', img: 'skeleton', hp: 66, str: 16, def: 9, mag: 4, mdf: 6, spd: 9, exp: 22, gil: 24, weak: ['fire', 'holy'], undead: true, steal: 'antidote' },
  redslime: { name: 'レッドスライム', img: 'redslime', hp: 46, str: 15, def: 6, mag: 9, mdf: 8, spd: 8, exp: 18, gil: 20, weak: ['ice'], absorb: ['fire'], ai: [['attack', 2], ['fire', 1]], steal: 'potion' },
  wolf: { name: 'ウルフ', img: 'wolf', hp: 72, str: 21, def: 6, mag: 3, mdf: 4, spd: 15, exp: 20, gil: 16, weak: ['fire'], steal: 'potion' },
  bee: { name: 'キラービー', img: 'bee', hp: 54, str: 20, def: 5, mag: 3, mdf: 5, spd: 17, exp: 18, gil: 14, weak: ['ice'], ai: [['attack', 2], ['sting', 1]], steal: 'antidote' },
  gmage: { name: 'ゴブリンメイジ', img: 'gmage', hp: 64, str: 9, def: 5, mag: 18, mdf: 10, spd: 9, exp: 24, gil: 30, ai: [['attack', 1], ['fire', 2]], drop: ['ether', 0.08], steal: 'ether' },
  golem: { name: 'ゴーレム', img: 'golem', hp: 260, str: 42, def: 24, mag: 4, mdf: 8, spd: 6, exp: 60, gil: 60, weak: ['bolt'], ai: [['attack', 3], ['quake', 1]], steal: 'hipotion' },
  specter: { name: 'スペクター', img: 'specter', hp: 150, str: 14, def: 18, mag: 30, mdf: 18, spd: 12, exp: 52, gil: 50, weak: ['holy', 'fire'], undead: true, ai: [['attack', 1], ['frost', 2]], steal: 'ether' },
  darkmage: { name: 'ダークメイジ', img: 'darkmage', hp: 170, str: 14, def: 10, mag: 32, mdf: 18, spd: 11, exp: 62, gil: 80, ai: [['attack', 1], ['fire', 1], ['bolt', 1], ['frost', 1]], drop: ['ether', 0.2], steal: 'ether' },
  armor: { name: 'リビングアーマー', img: 'armor', hp: 300, str: 46, def: 26, mag: 4, mdf: 10, spd: 9, exp: 70, gil: 90, weak: ['bolt'], ai: [['attack', 3], ['smash', 1]], drop: ['hipotion', 0.2], steal: 'hipotion' },
  windslime: { name: 'ウィンドスライム', img: 'windslime', hp: 150, str: 24, def: 12, mag: 32, mdf: 20, spd: 14, exp: 48, gil: 44, weak: ['fire'], ai: [['attack', 1], ['gust', 2]], drop: ['ether', 0.15], steal: 'ether' },
  hellhound: { name: 'ヘルハウンド', img: 'hellhound', hp: 240, str: 46, def: 14, mag: 24, mdf: 10, spd: 18, exp: 64, gil: 58, weak: ['ice'], absorb: ['fire'], ai: [['attack', 2], ['firebite', 1]], steal: 'hipotion' },
  boneknight: { name: 'ボーンナイト', img: 'boneknight', hp: 280, str: 46, def: 24, mag: 6, mdf: 12, spd: 10, exp: 76, gil: 70, weak: ['holy', 'fire'], undead: true, ai: [['attack', 3], ['smash', 1]], drop: ['megapotion', 0.12], steal: 'phoenix' },
  gking: { name: 'ゴブリンキング', img: 'gking', hp: 680, str: 23, def: 8, mag: 8, mdf: 6, spd: 9, exp: 160, gil: 400, boss: true, steal: 'hipotion', ai: 'gking' },
  guardian: { name: 'クリスタルガーディアン', img: 'guardian', hp: 3000, str: 44, def: 20, mag: 36, mdf: 18, spd: 11, exp: 700, gil: 1200, boss: true, weak: ['bolt'], steal: 'elixir', ai: 'guardian' },
  tempest: { name: '嵐の魔鳥テンペスト', img: 'tempest', hp: 6400, str: 54, def: 24, mag: 46, mdf: 22, spd: 22, exp: 1200, gil: 2000, boss: true, weak: ['bolt'], steal: 'zephyr', ai: 'tempest' },
  garva: { name: '闇騎士ガルヴァ', img: 'garva', hp: 4200, str: 44, def: 24, mag: 35, mdf: 22, spd: 16, exp: 0, gil: 0, boss: true, weak: ['holy'], steal: 'elixir', ai: 'garva' },
};

const FORMATIONS = {
  north: [['slime', 'slime'], ['slime', 'bat'], ['goblin'], ['bat', 'bat', 'bat'], ['goblin', 'slime'], ['slime', 'slime', 'slime'], ['goblin', 'bat']],
  cave: [['bat', 'bat'], ['skeleton'], ['redslime', 'bat'], ['goblin', 'goblin', 'bat'], ['skeleton', 'bat'], ['redslime', 'redslime']],
  south: [['wolf'], ['wolf', 'wolf'], ['bee', 'bee'], ['gmage', 'goblin'], ['bee', 'wolf'], ['gmage', 'gmage'], ['skeleton', 'gmage']],
  east: [['wolf', 'wolf', 'bee'], ['gmage', 'wolf'], ['skeleton', 'gmage', 'bee'], ['redslime', 'wolf']],
  tower1: [['golem'], ['specter', 'specter'], ['armor'], ['darkmage', 'specter'], ['golem', 'darkmage']],
  shrine: [['windslime', 'windslime'], ['hellhound'], ['boneknight'], ['hellhound', 'windslime'], ['boneknight', 'windslime'], ['hellhound', 'hellhound'], ['windslime', 'windslime', 'windslime']],
  tower2: [['armor', 'darkmage'], ['golem', 'specter'], ['specter', 'specter', 'darkmage'], ['armor', 'specter']],
};

const SHOPS = {
  elm: ['potion', 'antidote', 'phoenix', 'tent', 'iron', 'chain', 'silk'],
  rosaItem: ['potion', 'hipotion', 'megapotion', 'ether', 'antidote', 'phoenix', 'tent'],
  rosaSmith: ['mythril', 'mdagger', 'cleric', 'wizard', 'mmail', 'srobe'],
};

function expToNext(lv) { return Math.round(5 * lv * lv + 10 * lv); }
function expAt(lv) { let s = 0; for (let l = 1; l < lv; l++) s += expToNext(l); return s; }

// ===================== MAPS =====================
function grid(w, h, ch) { return Array.from({ length: h }, () => Array(w).fill(ch)); }
function fromRows(rows) { const w = Math.max(...rows.map(r => r.length)); return rows.map(r => (r + '#'.repeat(w)).slice(0, w).split('')); }
function fillRect(g, x, y, w, h, ch) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && g[j][i] !== undefined) g[j][i] = ch; }
function house(g, x, y, w, roof, doorX) {
  fillRect(g, x, y, w, 2, roof);
  for (let i = 0; i < w; i++) g[y + 2][x + i] = (x + i === doorX) ? 'D' : (i === 0 || i === w - 1 ? 'W' : (i % 2 ? 'N' : 'W'));
}

function buildWorld() {
  const W = 44, H = 32; const g = grid(W, H, '.'); const r = mulberry(4242);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.min(x, y, W - 1 - x, H - 1 - y);
    if (d < 2 || (d < 3 && r() < 0.45)) g[y][x] = '~';
  }
  // organic patches with ragged edges instead of rectangles
  const blob = (cx, cy, rx, ry, ch) => { for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
    if (!g[y] || g[y][x] === undefined || g[y][x] === '~' && ch !== '~') continue; const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d < 1 + (r() - 0.5) * 0.7) g[y][x] = ch; } };
  // forests & hills (north)
  blob(5, 4, 2.6, 1.8, 'T'); blob(17.5, 5.5, 3, 2.2, 'T'); blob(34, 4, 4.2, 1.8, 'T'); blob(35, 7, 2.2, 1.2, 'T'); blob(28, 4.5, 1.6, 1.2, 'T');
  blob(13, 10, 1.8, 1.7, 'h'); blob(30, 10, 2.4, 1.3, 'h'); blob(6, 11, 1.6, 1, 'h');
  // north lake
  blob(21.5, 8.5, 2.4, 1.8, '~');
  // mountain ridge
  for (let x = 2; x < W - 2; x++) { for (let y = 14; y <= 16; y++) g[y][x] = 'M'; if (r() < 0.5) g[13][x] = 'M'; if (r() < 0.5) g[17][x] = 'M'; }
  // river in the south splits tower land
  for (let y = 17; y < H - 1; y++) { g[y][30] = '~'; if (y > 25) g[y][31] = '~'; }
  // south forests/hills/sand
  blob(5, 20, 2.6, 1.8, 'T'); blob(19, 21, 3.4, 1.8, 'T'); blob(36.5, 20, 3, 1.6, 'T'); blob(23.5, 26.5, 2.4, 1.2, 'h');
  blob(10.5, 27.2, 5.2, 1.7, 's'); blob(38, 26.5, 2.2, 1.1, 'h'); blob(26, 21, 1.6, 1.2, 'h');
  // landmarks (ensure surroundings walkable)
  const clear = (x, y) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if ('MT~'.includes(g[y + j][x + i])) g[y + j][x + i] = '.'; };
  clear(9, 7); g[7][9] = 'V';
  g[13][24] = 'C'; g[12][24] = '.'; g[12][23] = '.'; g[12][25] = '.'; g[13][23] = 'M'; g[13][25] = 'M';
  g[17][24] = 'c'; g[18][24] = '.'; g[18][23] = '.'; g[18][25] = '.'; g[17][23] = 'M'; g[17][25] = 'M';
  clear(10, 24); g[24][10] = 'R';
  g[22][30] = '=';
  clear(37, 24); g[24][37] = 'X';
  clear(4, 23); g[23][4] = 'W';
  return { id: 'world', name: 'ワールドマップ', set: 'world', music: 'field', w: W, h: H, g,
    warps: { '9,7': { map: 'elm', x: 12, y: 18, dir: 'up' }, '24,13': { map: 'cave', x: 2, y: 2, dir: 'down' }, '24,17': { map: 'cave', x: 27, y: 17, dir: 'left' },
      '10,24': { map: 'rosa', x: 13, y: 1, dir: 'down' }, '37,24': { map: 'tower1', x: 8, y: 13, dir: 'up', cond: 'zek', script: 'towerSeal' },
      '4,23': { map: 'shrine', x: 10, y: 13, dir: 'up' } },
    enc: (x, y) => y < 14 ? 'north' : x < 30 ? 'south' : 'east', rate: 22, rateAt: (x, y) => y < 14 ? 34 : 24, npcs: [] };
}

function buildElm() {
  const W = 26, H = 20; const g = grid(W, H, 'g');
  for (let x = 0; x < W; x++) { g[0][x] = 'T'; g[H - 1][x] = 'T'; } for (let y = 0; y < H; y++) { g[y][0] = 'T'; g[y][W - 1] = 'T'; }
  fillRect(g, 12, 6, 2, 14, 'p'); fillRect(g, 2, 10, 22, 1, 'p');
  house(g, 3, 3, 6, 'R', 5); fillRect(g, 5, 6, 1, 4, 'p');
  house(g, 17, 3, 6, 'R', 19); fillRect(g, 19, 6, 1, 4, 'p');
  house(g, 3, 11, 6, 'R', 5); fillRect(g, 5, 14, 8, 1, 'p');
  g[13][16] = 'w'; fillRect(g, 20, 12, 4, 3, '~'); fillRect(g, 16, 16, 4, 2, 'f'); fillRect(g, 10, 4, 2, 2, 'f');
  g[17][14] = 'S'; fillRect(g, 15, 17, 3, 1, 'F'); fillRect(g, 8, 17, 3, 1, 'F');
  g[2][12] = 'T'; g[2][13] = 'T'; g[16][2] = 'T'; g[17][3] = 'T';
  return { id: 'elm', hd: true, name: 'エルムの村', set: 'town', music: 'town', w: W, h: H, g, exit: { map: 'world', x: 9, y: 7, gate: 'elmGate' },
    warps: { '5,5': { map: 'elder', x: 4, y: 6, dir: 'up' }, '19,5': { map: 'innElm', x: 5, y: 6, dir: 'up' }, '5,13': { map: 'shopElm', x: 4, y: 6, dir: 'up' } },
    signs: { '14,17': 'エルムの村\n「風の吹く丘の村」' },
    npcs: [
      { id: 'elmWoman', x: 15, y: 11, pal: 'woman', wander: true, talk: 'elmWoman' },
      { id: 'grave', x: 14, y: 2, pal: 'grave', talk: 'grave' },
      { id: 'mother', x: 16, y: 8, pal: 'mother', dir: 'left', talk: 'mother', show: () => !G.flags.epilogue && !G.flags.dream },
      { id: 'motherHill', x: 15, y: 2, pal: 'mother', dir: 'left', talk: 'grave', show: () => !!G.flags.epilogue },
      { id: 'leonDream', x: 12, y: 9, pal: 'leon', dir: 'down', talk: 'leonDream', show: () => !!G.flags.dream },
      { id: 'motherDream', x: 13, y: 9, pal: 'mother', dir: 'down', talk: 'leonDream', show: () => !!G.flags.dream },
      { id: 'elmChild', x: 9, y: 8, pal: 'child', wander: true, talk: 'elmChild' },
      { id: 'elmMan', x: 10, y: 15, pal: 'man', wander: true, talk: 'elmMan' },
      { id: 'elmGuard', x: 11, y: 18, pal: 'soldier', talk: 'elmGuard' },
      { id: 'elmOld', x: 21, y: 15, pal: 'elder', dir: 'left', talk: 'elmOld' },
    ] };
}
function buildRosa() {
  const W = 28, H = 22; const g = grid(W, H, 'g');
  for (let x = 0; x < W; x++) g[0][x] = 'T'; for (let y = 0; y < H; y++) { g[y][0] = 'T'; g[y][W - 1] = 'T'; }
  fillRect(g, 0, 19, W, 3, '~');
  fillRect(g, 13, 0, 2, 19, 'P'); fillRect(g, 2, 9, 24, 1, 'P'); fillRect(g, 1, 17, 26, 2, 'P'); g[1][12] = 'P';
  house(g, 3, 2, 6, 'r', 5); fillRect(g, 5, 5, 1, 4, 'P');
  house(g, 18, 2, 6, 'r', 20); fillRect(g, 20, 5, 1, 4, 'P');
  house(g, 3, 11, 6, 'r', 5); fillRect(g, 5, 14, 1, 3, 'P');
  house(g, 18, 11, 6, 'r', 20); fillRect(g, 20, 14, 1, 3, 'P');
  fillRect(g, 13, 19, 2, 2, 'b'); g[13][10] = 'w';
  for (const [x, y] of [[11, 6], [16, 6], [11, 14], [16, 14]]) g[y][x] = 'L';
  g[16][24] = 'x'; g[16][25] = 'x'; g[16][2] = 'x'; fillRect(g, 9, 3, 3, 2, 'f'); fillRect(g, 15, 11, 2, 2, 'f');
  g[8][15] = 'S';
  return { id: 'rosa', name: '港町ローザ', set: 'town', music: 'port', w: W, h: H, g, exit: { map: 'world', x: 10, y: 24 },
    warps: { '5,4': { map: 'innRosa', x: 5, y: 6, dir: 'up' }, '20,4': { map: 'itemRosa', x: 4, y: 6, dir: 'up' }, '5,13': { map: 'smithRosa', x: 4, y: 6, dir: 'up' }, '20,13': { map: 'pub', x: 5, y: 7, dir: 'up' } },
    signs: { '15,8': '港町ローザ\n左上:宿屋 右上:道具屋\n左下:武具屋 右下:酒場' },
    npcs: [
      { id: 'mayor', x: 16, y: 10, pal: 'mayor', talk: 'mayor' },
      { id: 'sailor', x: 14, y: 20, pal: 'sailor', dir: 'down', talk: 'sailor' },
      { id: 'rosaWoman', x: 9, y: 7, pal: 'woman', wander: true, talk: 'rosaWoman' },
      { id: 'rosaMan', x: 22, y: 16, pal: 'man', wander: true, talk: 'rosaMan' },
      { id: 'rosaChild', x: 8, y: 16, pal: 'child', wander: true, talk: 'rosaChild' },
      { id: 'rosaGuard', x: 12, y: 1, pal: 'soldier', talk: 'rosaGuard' },
      { id: 'bard', x: 24, y: 8, pal: 'bard', dir: 'left', talk: 'bard' },
    ] };
}
function room(id, name, rows, back, npcs, music = 'town') {
  const g = fromRows(rows); const h = g.length, w = g[0].length;
  const warps = {}; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y][x] === 'e') warps[x + ',' + y] = back;
  return { id, name, set: 'inside', music, w, h, g, warps, npcs };
}
function buildCave() {
  const rows = [
    '##############################',
    '#.>....############........B##',
    '#......############.........##',
    '#...........................##',
    '#......############.........##',
    '###################.........##',
    '#######################.######',
    '#######################.######',
    '#######################.######',
    '##########..................##',
    '##########...~~~~~~~~.......##',
    '###..........~~~~~~~~......B##',
    '###.######...~~~~~~~~.......##',
    '###.######..................##',
    '###.##########################',
    '###.################.......###',
    '#........###########.......###',
    '#........###########........>#',
    '#..........................###',
    '#B.......###########.......###',
    '####################.......###',
    '##############################',
  ];
  const g = fromRows(rows);
  const trig = {}; for (let y = 15; y <= 20; y++) trig['21,' + y] = 'caveBoss';
  return { id: 'cave', name: '北の洞窟', set: 'cave', music: 'dungeon', w: g[0].length, h: g.length, g,
    warps: { '2,1': { map: 'world', x: 24, y: 13, dir: 'down' }, '28,17': { map: 'world', x: 24, y: 17, dir: 'down' } },
    chests: { '27,1': { item: 'chain' }, '27,11': { item: 'phoenix' }, '1,19': { gil: 250 } },
    triggers: trig, enc: () => 'cave', rate: 28,
    npcs: [
      { id: 'gking', x: 27, y: 17, pal: 'gking', dir: 'left', talk: 'caveBoss', show: () => !G.flags.cave_boss },
      { id: 'kaiCaged', x: 25, y: 19, pal: 'kai', dir: 'left', talk: 'kaiCaged', show: () => !G.flags.cave_boss },
    ] };
}
function buildTower1() {
  const g = fromRows([
    '####################',
    '#......#^#.........#',
    '#.PP...#c#...PP....#',
    '#......#c#.........#',
    '#..B...#c#....B....#',
    '####.###c###.#######',
    '#.......c..........#',
    '#.P...P.c.P...P....#',
    '#.......c..........#',
    '#...........~~~....#',
    '#..P....c...~~~.P..#',
    '#.......c..........#',
    '#.P.....c.....P....#',
    '#.......c..........#',
    '#.......E..........#',
    '####################',
  ]);
  g[13][17] = '*';
  return { id: 'tower1', name: 'クリスタルの塔 1F', set: 'tower', music: 'tower', w: 20, h: 16, g,
    warps: { '8,14': { map: 'world', x: 37, y: 24, dir: 'down' }, '8,1': { map: 'tower2', x: 1, y: 13, dir: 'up' } },
    chests: { '3,4': { item: 'hipotion', n: 2 }, '14,4': { item: 'sage' } },
    enc: () => 'tower1', rate: 20,
    npcs: [{ id: 'guardian', x: 8, y: 4, pal: 'guardian', talk: 'guardian', show: () => !G.flags.guardian }] };
}
function buildTower2() {
  const g = fromRows([
    '####################',
    '#.....#......#.....#',
    '#.###.#.####.#.###.#',
    '#.#B#...#....#.#...#',
    '#.#.#####.####.#.###',
    '#.#.....#......#...#',
    '#.#####.#.######.#.#',
    '#.....#.#...B..#.#.#',
    '#####.#.#####..#.#.#',
    '#.....#.....#..#.#.#',
    '#.#########.#.##.#.#',
    '#.#.......#.#....#.#',
    '#.#.#####.#.#####..#',
    '#...#B....#.......^#',
    '#v##################',
    '####################',
  ]);
  g[13][17] = '*';
  return { id: 'tower2', name: 'クリスタルの塔 2F', set: 'tower', music: 'tower', w: 20, h: 16, g,
    warps: { '1,14': { map: 'tower1', x: 8, y: 2, dir: 'down' }, '18,13': { map: 'tower3', x: 9, y: 10, dir: 'up' } },
    chests: { '3,3': { item: 'rune' }, '12,7': { item: 'assassin' }, '5,13': { item: 'elixir' } },
    enc: () => 'tower2', rate: 18, npcs: [] };
}
function buildTower3() {
  const g = fromRows([
    '####################',
    '#~~~~~~~PXP~~~~~~~~#',
    '#~~~~~~.ccc.~~~~~~~#',
    '#~~~~~...c...~~~~~~#',
    '#~~~~P...c...P~~~~~#',
    '#~~~~....c....~~~~~#',
    '#~~~~....c....~~~~~#',
    '#~~~~P...c...P~~~~~#',
    '#~~~~~...c...~~~~~~#',
    '#~~~~~~..c..~~~~~~~#',
    '#~~~~~~~.c.~~~~~~~~#',
    '#~~~~~~~*v.~~~~~~~~#',
    '####################',
  ]);
  const trig = {}; for (let x = 5; x <= 13; x++) trig[x + ',6'] = 'garva';
  return { id: 'tower3', name: 'クリスタルの間', set: 'tower', music: 'tower', w: 20, h: 13, g,
    warps: { '9,11': { map: 'tower2', x: 16, y: 13, dir: 'left' } }, triggers: trig, save: { '8,11': true },
    npcs: [{ id: 'garva', x: 9, y: 3, pal: 'garva', dir: 'down', talk: 'garva', show: () => !G.flags.garva }] };
}

// optional dungeon: an open-air ruin where the wind crystal's guardian beast nests
function buildShrine() {
  const g = fromRows([
    '####################',
    '#~~~~~~~..X..~~~~~~#',
    '#~~~~~~P.....P~~~~~#',
    '#B.~~~~...c...~~~..#',
    '#..~~~~...c...~~~..#',
    '#.....P...c...P....#',
    '#.~~~.....c.......B#',
    '#.~~~..P.ccc.P.~~~.#',
    '#........c*c.......#',
    '#..P.....ccc....P..#',
    '#~~~~~....c.....~~~#',
    '#~~~~~....c.....~~~#',
    '#B........c........#',
    '#....P....c....P...#',
    '#.........E........#',
    '####################',
  ]);
  return { id: 'shrine', name: '風の祠', set: 'tower', music: 'shrine', w: 20, h: 16, g,
    warps: { '10,14': { map: 'world', x: 4, y: 24, dir: 'down' } },
    chests: { '1,3': { item: 'gale' }, '18,6': { item: 'aerial' }, '1,12': { item: 'megapotion', n: 2 } },
    signs: {}, enc: () => 'shrine', rate: 18,
    npcs: [
      { id: 'tempest', x: 10, y: 3, pal: 'tempest', dir: 'down', talk: 'tempest', show: () => !G.flags.tempest },
      { id: 'shrineSpirit', x: 10, y: 2, pal: 'spirit', dir: 'down', talk: 'shrineSpirit', show: () => !!G.flags.tempest },
    ] };
}

const INN_ROWS = ['##########', '#B.B.B.kk#', '#........#', '#ccc.....#', '#........#', '#.t...p..#', '#........#', '#####e####'];
const SHOP_ROWS = ['##########', '#kkk..kkk#', '#........#', '#cccccc..#', '#........#', '#x......x#', '#........#', '####e#####'];
let MAPS = {};
function buildMaps() {
  MAPS = {
    world: buildWorld(), elm: buildElm(), rosa: buildRosa(), cave: buildCave(), tower1: buildTower1(), tower2: buildTower2(), tower3: buildTower3(), shrine: buildShrine(),
    elder: room('elder', '長老の家', ['##########', '#kk..f.kk#', '#........#', '#.t....B.#', '#........#', '#.p....p.#', '#...rr...#', '####e#####'],
      { map: 'elm', x: 5, y: 6, dir: 'down' }, [{ id: 'elder', x: 6, y: 2, pal: 'elder', talk: 'elder' }]),
    innElm: room('innElm', '宿屋', INN_ROWS, { map: 'elm', x: 19, y: 6, dir: 'down' }, [{ id: 'innElm', x: 2, y: 2, pal: 'inn', talk: 'innElm' }]),
    shopElm: room('shopElm', 'よろず屋', SHOP_ROWS, { map: 'elm', x: 5, y: 14, dir: 'down' }, [{ id: 'shopElm', x: 3, y: 2, pal: 'merchant', talk: 'shopElm' }]),
    innRosa: room('innRosa', '宿屋', INN_ROWS, { map: 'rosa', x: 5, y: 5, dir: 'down' }, [{ id: 'innRosa', x: 2, y: 2, pal: 'inn', talk: 'innRosa' }], 'port'),
    itemRosa: room('itemRosa', '道具屋', SHOP_ROWS, { map: 'rosa', x: 20, y: 5, dir: 'down' }, [{ id: 'itemRosa', x: 3, y: 2, pal: 'merchant', talk: 'itemRosa' }], 'port'),
    smithRosa: room('smithRosa', '武具屋', SHOP_ROWS, { map: 'rosa', x: 5, y: 14, dir: 'down' }, [{ id: 'smithRosa', x: 3, y: 2, pal: 'man', talk: 'smithRosa' }], 'port'),
    pub: room('pub', '酒場「海猫亭」', ['############', '#kkk.f..xxx#', '#..........#', '#ccccc.....#', '#..........#', '#.t..t..t..#', '#..........#', '#..........#', '#####e######'],
      { map: 'rosa', x: 20, y: 14, dir: 'down' }, [
        { id: 'barkeep', x: 2, y: 2, pal: 'inn', talk: 'barkeep' },
        { id: 'zekNpc', x: 9, y: 5, pal: 'zek', dir: 'left', talk: 'zek', show: () => !G.flags.zek },
        { id: 'patron', x: 3, y: 6, pal: 'sailor', wander: true, talk: 'patron' },
      ], 'port'),
  };
}

// hidden treasure: glints that only appear once Kai (treasure hunter) is in the party
const SPARKLES = {
  elm: { '22,2': { item: 'ether' }, '2,8': { gil: 300 } },
  world: { '33,23': { item: 'hipotion', n: 2 }, '7,29': { item: 'phoenix' }, '36,11': { gil: 500 } },
  rosa: { '26,1': { item: 'megapotion' }, '1,16': { item: 'ether', n: 2 } },
  cave: { '18,3': { gil: 400 } },
  shrine: { '18,13': { item: 'elixir' } },
  tower1: { '18,1': { item: 'galemail' } },
};

// ===================== STORY SCRIPTS =====================
const SCRIPTS = {
  *intro() {
    G.fadeLevel = 1;
    yield* narrate('世界を照らす四つのクリスタル。\n大地、水、炎、そして風。');
    yield* narrate('十年前、大地のクリスタルが砕け\nひとつの村が、地図から消えた。');
    yield* narrate('同じ年、風の塔を守った騎士レオンは\n命と引きかえに塔を封じ\n二度と帰らなかった。');
    // prologue: the dark knight at the top of the tower
    G.hideParty = true; Field.enter('tower3', 9, 6, 'up', true); G.banner = null; Audio8.play('dungeon');
    yield { t: 'fadein' };
    yield { t: 'wait', n: 40 };
    yield* say('…十年。ようやく、あの騎士の封印も\nほころびたか。', 'ガルヴァ');
    yield* say('クリスタルの光は、いつか必ず消える。\n消えゆく痛みを、もう誰にも\n味わわせはしない。', 'ガルヴァ');
    yield* say('眠れ、風よ。\n永遠の静けさの中で——', 'ガルヴァ');
    Audio8.sfx('dark'); G.shake = 30; G.flash = 20; yield { t: 'wait', n: 60 };
    yield { t: 'fadeout' };
    G.hideParty = false; Field.enter('elm', 12, 12, 'up', true); G.banner = null;
    yield* narrate('——エルムの村。\n風が、止まった朝。');
    yield { t: 'fadein' };
    yield* say('アレン! よかった、起きてたのね。', 'リナ');
    yield* say('…また、あの声が聞こえたの。\n「たすけて」って。\nクリスタルの声…だと思う。', 'リナ');
    yield* say('風車も止まってる…\n塔で何かあったのか?', 'アレン');
    yield* say('長老様がお呼びよ。\n村の左上にある長老様の家に行きましょう。', 'リナ');
    G.flags.intro = 1;
  },
  *elmGate() {
    if (G.flags.quest) return true;
    yield* say('待って、アレン!\n先に長老様のところへ行かなくちゃ。\n村の左上の家よ。', 'リナ');
    return false;
  },
  *elder() {
    if (!G.flags.quest) {
      yield* say('おお、来たか。アレン、リナ。', '長老');
      yield* say('今朝、南の塔に眠る「風のクリスタル」の\n光が急に弱まった。\n風が止めば、作物は枯れ、海は荒れる…', '長老');
      yield* say('塔には十年前、お前の父レオンが\n命をかけて張った封印があった。\n…それが、破られたのじゃ。', '長老');
      yield* say('父さんの…封印が…', 'アレン');
      yield* say('塔に入りこんだのは、闇の騎士ガルヴァ。\nかつて王宮に仕えた魔導士じゃという。', '長老');
      yield* say('リナ。お前に聞こえる声は\nクリスタルが助けを求める声…\n古い言葉で「エコー」と呼ぶものじゃ。', '長老');
      yield* say('クリスタルは、この世を去った者の想いを\n映すともいう。お前たちが傷つき倒れそうな\nとき、きっと声が届くじゃろう。', '長老');
      yield* say('わたしに…クリスタルの声が?', 'リナ');
      G.flags.echo = 1;
      yield* say('塔の入口には外側の封印も残っておる。\n港町ローザで、封印に詳しい魔導士を\n探すのじゃ。', '長老');
      yield* say('ローザへは、村の東にある\n北の洞窟を抜けねばならん。\nこれを持っていきなさい。', '長老');
      addItem('potion', 5); addItem('phoenix', 1); G.gil += 300; G.flags.quest = 1;
      Audio8.sfx('chest');
      yield* say('ポーション×5、不死鳥の羽、300ギルを\n受け取った!');
      yield* say('(戦闘で仲間が傷つくと「ECHO」がたまり\n満タンになるとリナが「エコー」を使える)');
      yield* say('レオンは最後までこの村を守った。\nアレン、お前の剣にもその血が流れておる。\n…出かける前に、母さんに顔を見せてやれ。', '長老');
      yield* say('…行こう、リナ。\n父さんが守ったものを、今度はおれが守る。', 'アレン');
    } else if (!G.flags.garva) yield* say('風のクリスタルを頼んだぞ。\n疲れたら宿屋で休むとよい。', '長老');
    else yield* say('おお…風が戻ってきた。\nレオンも、きっと誇りに思っておるよ。\n…丘へ行っておやり。', '長老');
  },
  *mother() {
    if (!G.flags.motherTalk) {
      G.flags.motherTalk = 1;
      yield* say('…行くのね、塔へ。', '母');
      yield* say('お父さんもね、出かける前に\nそうやって笑ったのよ。\n「帰ったら、風車を直そうな」って。', '母');
      yield* say('…待つのは、もう慣れたわ。\nだからね、アレン。\n帰ってくることだけは、約束して。', '母');
      yield* say('…うん。約束する。', 'アレン');
      yield* say('リナちゃんも、気をつけてね。\nこの子、無茶ばかりするから。', '母');
    } else yield* say('ちゃんとご飯は食べてる?\n…いってらっしゃい、アレン。', '母');
  },
  *grave() {
    if (!G.flags.epilogue) {
      yield* say('「風の騎士レオン ここに眠る」\n…墓の下に、亡骸はない。');
      yield* say('十年前から、ずっと空っぽの墓。\n母さんは毎朝、花を替えてる。', 'アレン');
      return;
    }
    yield* say('…来たのね。', '母');
    yield* say('ねえ、アレン。見て。\n村の風車が、回ってるわ。\n十年ぶりに。', '母');
    yield* say('父さんとの約束…\nおれ、代わりに果たせたかな。', 'アレン');
    if (G.flags.innAnswer === 1) yield* say('ずっと、ゆるせなかったんだ。\nおれと母さんを置いていった父さんを。\n…でも、今はわかるよ。', 'アレン');
    else yield* say('会えたんだ、父さんに。\nちゃんと、声も聞けた。\n…母さんに、よろしくって。', 'アレン');
    yield* say('……そう。\nあの人らしいわね。\n最後まで、私には直接言わないんだから。', '母');
    yield* say('…待って。\n声が…聞こえる。最後の、エコー。', 'リナ');
    G.flash = 30; Audio8.sfx('crystal'); yield { t: 'wait', n: 50 };
    yield* say('マーサ。\n…ただいま。それから、ありがとう。\n待っていてくれて。', 'レオン');
    yield* say('……おかえりなさい、あなた。', '母');
    yield* say('アレン。\nもう、父さんの背中を追わなくていい。\nお前の風で、お前の空を飛べ。', 'レオン');
    if (G.flags.stayed) yield* say('あの夢の中で、お前が\n「ここにいたい」と言ってくれたこと。\n…父さんは、一生の宝にするよ。', 'レオン');
    yield* say('…いってきます、父さん。', 'アレン');
    yield* say('声は、風にとけて消えた。\nでも、丘を渡る風は\nどこまでもあたたかかった。');
    yield { t: 'ending' };
  },
  *leonDream() { yield* say('…行っておいで、アレン。', 'レオン'); },
  *elmWoman() { yield* say(G.flags.garva ? '風車がまた回り始めたわ!\n洗濯物がよく乾くのよ、ありがとう!' : '最近、夜になると洞窟の方から\nうなり声が聞こえるの…\n怖いわ。'); },
  *elmChild() { yield* say(G.flags.cave_boss ? 'ゴブリンの王様をやっつけたって\nほんと!? すっげー!' : 'MENUボタンでメニューを開けるよ!\nセーブはこまめにね!'); },
  *elmMan() { yield* say('戦闘では、キャラクターの\nATBゲージがたまったら行動できる。\nわざや魔法を上手に使うんだぞ。'); },
  *elmGuard() { yield* say('村の外には魔物が出る。\n森や丘では魔物に遭いやすいぞ。\n気をつけてな!', '村の衛兵'); },
  *elmOld() {
    if (G.flags.tempest) { yield* say('なんと、祠の魔鳥を鎮めたとな!\n風の音が、前よりやさしく聞こえるわい。'); return; }
    yield* say('むかし、この世界には\n「光の戦士」がいたそうな。\nあんたたちのような若者じゃったよ。');
    yield* say('そうそう、ローザの西の森には\n「風の祠」という古い遺跡がある。\n嵐の魔鳥が棲みついて、誰も近づかんのじゃ。');
  },
  *innElm() { yield* inn(20); },
  *innRosa() { yield* inn(40); },
  *shopElm() { yield* say('いらっしゃい! よろず屋へようこそ。', '店主'); yield { t: 'shop', id: 'elm' }; },
  *itemRosa() { yield* say('ローザの道具屋だよ。\n船乗りにも冒険者にも人気さ!', '店主'); yield { t: 'shop', id: 'rosaItem' }; },
  *smithRosa() { yield* say('ミスリル製の武具がそろってるぜ。\n高いが、そのぶん頼りになる!', '鍛冶屋'); yield { t: 'shop', id: 'rosaSmith' }; },
  *kaiCaged() { yield* say('おーい! 助けてくれ!\nゴブリンどもに捕まっちまったんだ!', '???'); },
  *caveBoss() {
    if (G.flags.cave_boss) return;
    yield* say('おーい! そこの人たち!\n助けてくれ!', '???');
    Audio8.sfx('boss'); G.shake = 20;
    yield* say('グフフ…今日は獲物が\nたくさん迷い込んできたわい!', 'ゴブリンキング');
    yield* say('風が止んでから、洞窟の外は\nオレさまたちの天下よ!', 'ゴブリンキング');
    yield* say('その人を放せ!', 'アレン');
    const r = yield { t: 'battle', ids: ['gking'], boss: true, music: 'boss' };
    if (r !== 'win') return;
    G.flags.cave_boss = 1;
    yield* say('ふぅ、助かったぜ!\nオレはカイ。トレジャーハンターさ。', 'カイ');
    yield* say('死んだ親方が遺した地図があってな。\n「風の祠」に眠る秘宝を探してるんだ。', 'カイ');
    yield* say('…塔へ行くのか? 風が止まったままじゃ\n祠も探しようがねえ。\nローザまで道案内してやるよ!', 'カイ');
    joinParty('kai'); Audio8.play('fanfare', G.map.music);
    yield* say('カイが仲間に加わった!\n(「ぬすむ」で敵から道具を盗める。\n光る場所も見つけられるようになった)');
  },
  *mayor() {
    if (!G.flags.zek) yield* say('クリスタルの塔の封印を解けるのは\n魔導士だけじゃ。\n酒場に変わり者の魔導士がおるが…', '町長');
    else if (!G.flags.garva) yield* say('塔は東の川を渡った先じゃ。\nどうか、クリスタルを頼む。', '町長');
    else yield* say('風が戻り、船も出せるようになった。\n本当にありがとう!', '町長');
  },
  *sailor() { yield* say(G.flags.garva ? '追い風だ! 最高の航海日和だぜ!' : '風が止んで、船が出せねえんだ…\n商売あがったりだよ。', '船乗り'); },
  *rosaWoman() { yield* say('塔のてっぺんには、\n風のクリスタルが祀られているの。\nとてもきれいな光なんですって。'); },
  *rosaMan() { yield* say('塔の魔物は手ごわいぞ。\nゴーレムには雷、亡霊には炎や聖なる力が\n効くって話だ。'); },
  *rosaChild() { yield* say('アサシンダガーっていう\nすごい短剣が塔に眠ってるって\nカイ兄ちゃんが言ってた!'); },
  *bard() {
    yield* say('♪ 西の森の 古き祠に\n嵐をまとう 魔鳥ひとつ\n風の宝を 守りつづける ♪', '吟遊詩人');
    yield* say('…魔鳥は雷を嫌うそうだよ。\nもっとも、腕に覚えがないなら\n近づかないほうがいいけどね。', '吟遊詩人');
  },
  *tempest() {
    if (G.flags.tempest) return;
    if (G.party.some(m => m.id === 'kai')) yield* say('この祭壇…親方の地図に描いてあった\n場所だ! 秘宝はこの奥に…', 'カイ');
    yield* say('…風がうなっている。\n祭壇の上で、巨大な鳥が翼を広げた!');
    Audio8.sfx('boss'); G.shake = 24;
    yield* say('キィィィィ——ッ!!', 'テンペスト');
    const r = yield { t: 'battle', ids: ['tempest'], boss: true, music: 'boss' };
    if (r !== 'win') return;
    G.flags.tempest = 1;
    yield* say('嵐の魔鳥は光の粒となって消えた…');
    yield* say('…親方。見つけたぜ。\nあんたの言ってた「風の秘宝」。', 'カイ');
    Audio8.play('fanfare', G.map.music);
    addItem('windblade'); yield* say('祭壇に「ウィンドブレード」が残されていた!\n(アレン専用の剣)');
  },
  *shrineSpirit() { yield* say('ありがとう、旅の人。\nこれで風はまた、自由に吹けます。\nあなたたちの旅に、追い風を…', '風の精'); healAll(); Audio8.sfx('heal'); G.flash = 12; yield* say('不思議な風に包まれ、全回復した!'); },
  *rosaGuard() { yield* say('ようこそ港町ローザへ。\n宿屋で休めば、HPもMPも全快するぞ。', '衛兵'); },
  *barkeep() { yield* say('いらっしゃい。…奥の魔導士かい?\nずっと塔の古文書をにらんでるよ。', 'マスター'); },
  *patron() { yield* say('ヒック…ガルヴァってのは\nもともと立派な魔導士だったらしいぜ…'); },
  *zek() {
    yield* say('…クリスタルの塔へ行くつもりか。', '魔導士');
    yield* say('僕はゼク。王宮で封印術を学んだ。\nガルヴァは…僕の兄弟子だ。', 'ゼク');
    yield* say('兄さんの故郷は、十年前に大地の\nクリスタルが砕けたとき…\n村ごと消えてしまった。', 'ゼク');
    yield* say('それから兄さんは、クリスタルが\n消えることばかり考えるようになった。\n「失う前に、時を止めればいい」と。', 'ゼク');
    yield* say('…止めなきゃいけない。\n僕を拾って育ててくれた人だから。', 'ゼク');
    yield* say('君たちと行こう。\n外側の封印は僕が解く。', 'ゼク');
    joinParty('zek'); G.flags.zek = 1; Audio8.play('fanfare', G.map.music);
    yield* say('ゼクが仲間に加わった!\n(黒魔法で敵の弱点を突こう)');
    // that night at the harbour inn
    yield { t: 'fadeout' };
    yield* narrate('その夜。\n港の宿屋で、四人は窓の外の\n動かない帆を見つめていた。');
    yield* say('父さんはおれが六つのとき、\n塔へ行ったきりだった。\n顔もあんまり覚えてないんだ。', 'アレン');
    const ans = yield* ask('…アレンは、お父さんのこと\nどう思ってるの?', ['会いたい', 'ゆるせない'], 'リナ');
    G.flags.innAnswer = ans;
    if (ans === 1) yield* say('…ずるいだろ。\n英雄になって、帰ってこないなんて。\n母さん、ずっと泣いてたんだ。', 'アレン');
    else yield* say('会いたいよ。\n…会って、言いたいことがたくさんある。\n「おかえり」とかさ。', 'アレン');
    yield* say('…わたし、時々思うの。\nあの声は、クリスタルだけじゃなくて\nもっと懐かしい誰かの声みたいだって。', 'リナ');
    yield* say('しんみりすんなって!\n世界を救ったら、宝探しにも付き合えよ。\n約束だぜ?', 'カイ');
    yield* say('…ありがとう、みんな。\n兄さんのことは、僕がけりをつける。', 'ゼク');
    yield { t: 'fadein' };
  },
  *towerSeal() {
    if (!G.flags.zek) { yield* say('見えない壁に阻まれて、中に入れない…\n魔導士の力が必要なようだ。'); return false; }
    if (!G.flags.towerOpen) {
      yield* say('これは…命そのものを編みこんだ封印だ。\n刻まれた名は——「レオン」。', 'ゼク');
      yield* say('父さんの…!', 'アレン');
      yield* say('内側の封印は兄さんが破った。\nでも外側だけは、今もレオンさんが\n守り続けているんだ。', 'ゼク');
      yield* say('…声がする。\n「通してあげて」って…\nあたたかい声。', 'リナ');
      yield* say('古き風よ、守り手の意志よ。\n今だけ、道を開けたまえ……!', 'ゼク');
      Audio8.sfx('crystal'); G.flash = 30; yield { t: 'wait', n: 40 };
      yield* say('塔の封印が解かれた!');
      G.flags.towerOpen = 1;
    }
    return true;
  },
  *guardian() {
    if (G.flags.guardian) return;
    yield* say('…シンニュウシャ…ハイジョ…スル…', 'ガーディアン');
    yield* say('塔の番人まで闇に染められてる…!\n来るぞ!', 'ゼク');
    const r = yield { t: 'battle', ids: ['guardian'], boss: true, music: 'boss' };
    if (r !== 'win') return;
    G.flags.guardian = 1;
    yield* say('番人が砕け散り、上への道が開けた。');
    yield* say('…待って。また声が…\nアレン、あなたを呼んでる。', 'リナ');
    G.flash = 20; Audio8.sfx('crystal'); yield { t: 'wait', n: 30 };
    yield* say('…アレン。大きくなったな。', 'レオン');
    yield* say('この上に、ガルヴァがいる。\nあいつは悪人じゃない…ただ、\n失うことを恐れすぎたんだ。', 'レオン');
    yield* say('父さん……!', 'アレン');
    yield* say('…声が、消えちゃった。\nでも、きっと見守ってくれてる。', 'リナ');
  },
  *garva() {
    if (G.flags.garva) return;
    yield* say('来たか、ゼク。\nそして…レオンの息子か。\n目元がよく似ている。', 'ガルヴァ');
    yield* say('ガルヴァ! クリスタルから離れろ!', 'ゼク');
    yield* say('十年前、私の村は大地のクリスタルと\n共に消えた。母も、妹のミナも。\n残ったのは、静けさだけだった。', 'ガルヴァ');
    yield* say('光はいつか消える。ならば消える前に\nすべてを止めてしまえばいい。\n誰も、何も、失わぬように。', 'ガルヴァ');
    yield* say('レオンの息子よ。\nお前にも、取り戻したい時間があるだろう。\n…見せてやろう。止まった時の中を。', 'ガルヴァ');
    // the dream of stopped time: Allen alone, home, with both parents
    Audio8.sfx('dark'); G.flash = 40; yield { t: 'fadeout' };
    G.flags.dream = 1; G.soloLead = true; Field.enter('elm', 12, 11, 'up', true); G.banner = null; Audio8.play('ending');
    yield { t: 'fadein' };
    yield* say('…おかえり、アレン。', 'レオン');
    yield* say('父さん……? 母さんも……', 'アレン');
    yield* say('ほら、風車も直したんだ。\n約束しただろう?\n今日は母さんがシチューを作ってくれてる。', 'レオン');
    yield* say('ここでは、もう誰もいなくならない。\n…ずっと、ここにいてもいいんだぞ。', 'レオン');
    const c = yield* ask('……', ['ここにいたい', '…行かなきゃ'], 'アレン');
    if (c === 0) {
      G.flags.stayed = 1;
      yield* say('…ずっと、こうしたかったんだ。\n父さんと母さんと、三人で\n夕ごはんを食べたかった……!', 'アレン');
      yield* say('……そうか。\n…父さんもだよ、アレン。', 'レオン');
      yield* say('アレン…! アレン!\n聞こえる!? 戻ってきて!', 'リナ');
      yield* say('…聞こえるか。\nお前を待ってる人たちの声だ。\n止まった時間の中に、あの子たちはいない。', 'レオン');
      yield* say('父さんはな、お前の「明日」が見たいんだ。\n明日を生きるお前を。\n…だから、行け。', 'レオン');
    } else {
      G.flags.stayed = 0;
      yield* say('…ありがとう、父さん。\nでも、みんなが待ってるんだ。\nそれに…母さんは、本当はここにいない。', 'アレン');
      yield* say('…ああ。強くなったな。\nそれでこそ、おれの息子だ。', 'レオン');
    }
    yield* say('行っておいで、アレン。\n風は、いつだってお前の背中を押す。', 'レオン');
    yield { t: 'fadeout' };
    G.flags.dream = 0; G.soloLead = false; Field.enter('tower3', 9, 6, 'up', true); G.banner = null;
    yield { t: 'fadein' };
    yield* say('…戻ってきたのか。\n止まった時を、拒んだのだな。', 'ガルヴァ');
    yield* say('父さんは…止まるためじゃなく\n前に進むために戦ったんだ!\nおれも、そうする!', 'アレン');
    yield* say('…レオンも同じことを言った。\nならば、その答えを剣で示せ!', 'ガルヴァ');
    Audio8.sfx('boss'); G.shake = 30;
    yield* say('闇に沈め——!', 'ガルヴァ');
    const r = yield { t: 'battle', ids: ['garva'], boss: true, music: 'final', final: true };
    if (r !== 'win') return;
    G.flags.garva = 1;
    yield* say('…強いな。あの日のレオンのようだ。', 'ガルヴァ');
    yield* say('兄さん!', 'ゼク');
    yield* say('……待って。\nもうひとつ、声が聞こえる。\n小さな女の子の声……', 'リナ');
    G.flash = 20; Audio8.sfx('crystal'); yield { t: 'wait', n: 30 };
    yield* say('お兄ちゃん。\nもういいんだよ。\nずっと止まってたのは、お兄ちゃんのほうだよ。', 'ミナ');
    yield* say('……ミナ……?', 'ガルヴァ');
    yield* say('わたしね、あの日のこと、\n怖くなかったよ。お兄ちゃんが\nずっと手をにぎっててくれたから。', 'ミナ');
    yield* say('…すまなかった。\n守れなかった。忘れることも、\n前に進むことも…できなかった。', 'ガルヴァ');
    yield* say('ゼク。\n…お前は、失うことを恐れるな。\n光は消えても、誰かがまた灯せばいい。', 'ガルヴァ');
    yield* say('ミナ……今、行く……', 'ガルヴァ');
    G.flash = 60; Audio8.sfx('crystal'); yield { t: 'wait', n: 70 };
    yield* say('…兄さん。\nあなたの分まで、光を守るよ。\n…ありがとう、育ててくれて。', 'ゼク');
    yield* say('風のクリスタルが\nまばゆい光を取り戻した!');
    yield* say('…聞こえる。今度ははっきりと。', 'リナ');
    yield* say('よくやった、アレン。\nお前は、おれの自慢の息子だ。', 'レオン');
    yield* say('父さん、待って!\nまだ…まだ言いたいことが……!', 'アレン');
    yield* say('…村で、待ってるよ。\nあの丘の上で。', 'レオン');
    yield* say('さ、帰ろうぜ。\n…風が吹いてるうちにな。', 'カイ');
    // epilogue: walk the village with the wind back, then climb the hill
    yield { t: 'fadeout' };
    G.flags.epilogue = 1; Field.enter('elm', 12, 12, 'up', true); G.banner = null;
    yield* narrate('それから、三日後——\nエルムの村に、風が帰ってきた。');
    yield { t: 'fadein' };
    yield* say('アレン。\nおばさんが、丘の上で待ってるって。\n…みんなにも、会っていこうよ。', 'リナ');
    G.banner = { text: '丘の上の墓へ行こう', t: 180 };
  },
};
