// ===================== DATA =====================
const HERO_NAME = 'ハル', SISTER = 'ノア';
const DUNGEON = { name: 'おもちゃの森', floors: 10 };
// floors share a look in bands of three or four: dusk, moonlight, the deep dream
const THEME_OF = f => f <= 3 ? 0 : f <= 6 ? 1 : 2;
const MUSIC_OF = f => ['dream1', 'dream2', 'dream3'][THEME_OF(f)];

// 悪夢: the things Noa was afraid of. atk/def are flat numbers, exp is given on defeat.
// speed 2 = two actions per turn. sleepHit = chance that a hit puts Haru to sleep. bolt = ranged attack in a straight line.
const MONSTERS = {
  moya: { name: 'もやもや', hp: 6, atk: 2, def: 0, exp: 2, floors: [1, 4], weight: 10 },
  neko: { name: 'まっくろネコ', hp: 9, atk: 3, def: 1, exp: 4, floors: [2, 6], weight: 8 },
  moufu: { name: 'おばけ毛布', hp: 12, atk: 4, def: 1, exp: 8, floors: [3, 8], weight: 7, sleepHit: 0.1 },
  wani: { name: 'チクタクワニ', hp: 14, atk: 4, def: 2, exp: 12, floors: [6, 10], weight: 5, speed: 2 },
  kumo: { name: 'カミナリぐも', hp: 16, atk: 4, def: 2, exp: 13, floors: [6, 10], weight: 5, bolt: { chance: 0.4, range: 8, dmg: [5, 8] } },
  piero: { name: 'ガイコツピエロ', hp: 26, atk: 8, def: 4, exp: 22, floors: [8, 10], weight: 4 },
};
function monstersFor(floor) { return Object.keys(MONSTERS).filter(k => floor >= MONSTERS[k].floors[0] && floor <= MONSTERS[k].floors[1]); }
function pickMonster(floor) {
  const ks = monstersFor(floor); let tot = 0; for (const k of ks) tot += MONSTERS[k].weight;
  let r = rnd() * tot; for (const k of ks) { r -= MONSTERS[k].weight; if (r < 0) return k; } return ks[0];
}

// items for the first stage: food for the dozing gauge, healing candy and star shards (money)
const ITEMS = {
  candy: { name: 'ゆめの菓子', kind: 'food', mado: 50, desc: 'まどろみ度が 50 回復する。' },
  bigcandy: { name: '大きなゆめの菓子', kind: 'food', mado: 100, desc: 'まどろみ度が 100 回復する。満タンなら 最大まどろみ度が 少し上がる。' },
  heal: { name: 'いやしのキャンディ', kind: 'heal', hp: 25, desc: 'HPが 25 回復する。HPが満タンなら 最大HPが 1 上がる。' },
  bigheal: { name: 'ふわふわキャンディ', kind: 'heal', hp: 100, desc: 'HPが 100 回復する。HPが満タンなら 最大HPが 2 上がる。' },
  star: { name: 'ほしのかけら', kind: 'money', desc: '夢の中の お金。' },
};
const ITEM_DROPS = [['candy', 26], ['heal', 30], ['star', 26], ['bigcandy', 8], ['bigheal', 6]];
function pickItem() { let tot = 0; for (const [, w] of ITEM_DROPS) tot += w; let r = rnd() * tot; for (const [k, w] of ITEM_DROPS) { r -= w; if (r < 0) return k; } return 'candy'; }
const BAG_MAX = 20;

// experience needed for each level (index = level)
const EXP_TABLE = [0, 0, 10, 30, 60, 100, 160, 240, 350, 500, 700, 950, 1250, 1600, 2000, 2500, 3100, 3800, 4600, 5500, 6500];
const MADO_MAX = 100;

const INTRO = [
  `妹の${SISTER}が 目をさまさなくなって 七日がすぎた。`,
  'おばあちゃんが のこした「夢わたりの枕」。',
  'これを つかえば ねむっている人の 夢に 入れるという。',
  `${HERO_NAME}「まってろ、${SISTER}。むかえに いくから」`,
];
