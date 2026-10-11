'use strict';
// ===== data: terrain, weapons, classes, units, chapters, story =====
const TERRAIN = {
  '.': { name: '草原', cost: 1, avo: 0, def: 0 },
  '=': { name: '道', cost: 1, avo: 0, def: 0 },
  'T': { name: '森', cost: 2, avo: 20, def: 1 },
  '^': { name: '山', cost: 3, avo: 30, def: 2 },
  '~': { name: '水', cost: 99, avo: 0, def: 0, block: true },
  '#': { name: '砦', cost: 1, avo: 20, def: 2, heal: 0.2 }
};
// names[tier]: tier 0 basic, 1 steel, 2 silver (player gear improves per chapter); might +2 per tier
const WEAPONS = {
  spear:  { names: ['鉄の槍', '鋼の槍', '銀の槍'], type: 'phys', might: 6, hit: 85, min: 1, max: 1 },
  bow:    { names: ['鉄の弓', '鋼の弓', '銀の弓'], type: 'phys', might: 5, hit: 85, min: 2, max: 2 },
  tome:   { names: ['ファイア', 'エルファイア', 'ボルガノン'], type: 'mag', might: 5, hit: 85, min: 1, max: 2 },
  staff:  { names: ['ライブ', 'リライブ', 'ミラクル'], type: 'heal', might: 4, hit: 100, min: 1, max: 1 },
  dagger: { names: ['短剣', '鋼の短剣', '銀の短剣'], type: 'phys', might: 4, hit: 95, min: 1, max: 1 },
  axe:    { names: ['手斧'], type: 'phys', might: 5, hit: 75, min: 1, max: 1 },
  sword:  { names: ['骨の剣'], type: 'phys', might: 5, hit: 80, min: 1, max: 1 },
  slime:  { names: ['溶解液'], type: 'phys', might: 3, hit: 80, min: 1, max: 1 },
  dark:   { names: ['ダークボルト'], type: 'mag', might: 5, hit: 80, min: 1, max: 2 },
  gold:   { names: ['黄金の大剣'], type: 'phys', might: 7, hit: 85, min: 1, max: 1 }
};
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
  goblin:   { name: 'ゴブリン', cls: 'ゴブリン', sprite: 'enemy_goblin', wpn: 'axe', base: { hp: 18, str: 5, mag: 0, skl: 3, spd: 4, def: 2, res: 0, mov: 5 }, gr: { hp: 70, str: 40, mag: 0, skl: 30, spd: 30, def: 30, res: 15 } },
  slime:    { name: 'スライム', cls: 'スライム', sprite: 'enemy_slime', wpn: 'slime', base: { hp: 14, str: 3, mag: 0, skl: 2, spd: 3, def: 1, res: 0, mov: 4 }, gr: { hp: 70, str: 40, mag: 0, skl: 30, spd: 30, def: 25, res: 10 } },
  skeleton: { name: 'スケルトン', cls: 'スケルトン', sprite: 'enemy_skeleton', wpn: 'sword', base: { hp: 20, str: 6, mag: 0, skl: 4, spd: 4, def: 4, res: 0, mov: 4 }, gr: { hp: 70, str: 45, mag: 0, skl: 35, spd: 35, def: 35, res: 15 } },
  darkmage: { name: 'ダークメイジ', cls: 'ダークメイジ', sprite: 'enemy_darkmage', wpn: 'dark', base: { hp: 16, str: 0, mag: 6, skl: 5, spd: 4, def: 1, res: 5, mov: 4 }, gr: { hp: 60, str: 0, mag: 45, skl: 35, spd: 35, def: 15, res: 40 } },
  boss:     { name: 'ガルド', cls: '金角将軍', sprite: 'enemy_boss', wpn: 'gold', base: { hp: 38, str: 9, mag: 0, skl: 7, spd: 5, def: 7, res: 2, mov: 4 }, gr: { hp: 80, str: 50, mag: 0, skl: 40, spd: 35, def: 40, res: 25 } }
};
function scaledStats(base, gr, lv) { // deterministic growth for enemies / late joiners
  const s = Object.assign({}, base);
  for (const k of STATS) s[k] = Math.round(base[k] + (gr[k] || 0) * (lv - 1) / 100);
  return s;
}
function weaponOf(u) { const w = WEAPONS[u.wpn], t = Math.min(u.tier || 0, w.names.length - 1); return { name: w.names[t], type: w.type, might: w.might + (w.names.length > 1 ? 2 * t : 0), hit: w.hit, min: w.min, max: w.max }; }
function makeHero(id, lv) {
  const d = HEROES[id], s = scaledStats(d.base, d.gr, lv);
  return Object.assign({ id, key: id, name: d.name, cls: d.cls, sprite: d.sprite, team: 0, lv, exp: 0, wpn: d.wpn, tier: 0, maxhp: s.hp, hp: s.hp, ai: null, boss: false, lord: id === 'leon', dir: 'down' }, s, { hp: s.hp });
}
function makeEnemy(t, lv, x, y, ai, extra) {
  const d = ENEMY_T[t], s = scaledStats(d.base, d.gr, lv);
  return Object.assign({ id: t + '_' + x + '_' + y, key: t, name: d.name, cls: d.cls, sprite: d.sprite, team: 1, lv, exp: 0, wpn: d.wpn, tier: 0, maxhp: s.hp, ai: ai || 'aggro', boss: t === 'boss', lord: false, x, y, dir: 'left' }, s, { hp: s.hp }, extra || {});
}
const SPEAKERS = {
  leon: { name: 'レオン', face: 'hero_knight' }, mira: { name: 'ミラ', face: 'hero_archer' },
  luka: { name: '老魔道士ルカ', face: 'hero_mage' }, sophia: { name: 'ソフィア', face: 'hero_healer' },
  jin: { name: 'ジン', face: 'hero_thief' }, boss: { name: '金角将軍ガルド', face: 'enemy_boss' },
  dmage: { name: '闇の司祭ヴェルザ', face: 'enemy_darkmage' }, goblin: { name: 'ゴブリン', face: 'enemy_goblin' }
};
const mk = rows => rows.map(r => Array.isArray(r) ? r.join('') : r);
const CHAPTERS = [
  {
    title: '第一章', name: '国境の狼煙', goal: '敵を全滅させよ', win: 'rout', bgm: 'field',
    map: mk([
      '..TT......^^....', '..T.....==.^^...', '....====......T.', '..==..~~......T.',
      '==....~~.TT.....', '...T..~~..T.....', '..TT........^...', '......T....^^...',
      '.=======...T....', '.=..T.....T.....', '.=......~~......', '.=..............']),
    party: [['leon', 2, 9], ['mira', 3, 10], ['luka', 2, 10]],
    enemies: [['goblin', 12, 2, 1, 'aggro'], ['goblin', 11, 5, 1, 'aggro'], ['slime', 13, 4, 1, 'aggro'], ['goblin', 10, 1, 1, 'wait'], ['slime', 13, 7, 1, 'wait']],
    join: [],
    pre: [
      [null, 'フェルナ王国、北の国境。夜明けの空を、黒き軍勢の狼煙が焦がしていた。'],
      ['leon', '狼煙だ…! 国境の砦が燃えている。'],
      ['mira', '見て、ゴブリンの群れよ。しかも隊列を組んでる。ただの野盗じゃないわ。'],
      ['luka', 'ふぉっふぉ、黒き軍勢の斥候じゃな。若き騎士殿、ここはおぬしの出番じゃぞ。'],
      ['leon', '俺が…? 隊長はまだ戻っていないのに。'],
      ['mira', '迷ってる暇なんてないでしょ、レオン! 指揮はあなたよ!'],
      ['leon', '…わかった。ここから先へは、一歩も通さない!'],
      [null, '【ヒント】味方を選んで移動先を決め、「攻撃」で敵を倒そう。青が移動範囲、赤が攻撃範囲。レオンが倒れると敗北。']
    ],
    post: [
      ['mira', 'ふう…片付いたわね。怪我はない、レオン?'],
      ['leon', 'ああ。だが妙だ。ゴブリンが、旗の下で戦っていた。'],
      ['luka', '黒き軍勢は、この国をまるごと呑み込む気じゃ。南の渡しへ急ぐぞ。味方と合流できるはずじゃ。'],
      ['leon', '守るんだ。この旗の下に集まった者たちを、必ず。']
    ]
  },
  {
    title: '第二章', name: '骸骨の渡し', goal: '敵を全滅させよ', win: 'rout', bgm: 'field',
    map: mk([
      ['..TT....', '~~', '......TT'], ['.....T..', '~~', '...^^...'], ['..=====.', '~~', '..^^^..T'],
      ['..======', '==', '=======.'], ['..=.....', '~~', '.....T..'], ['.TT.....', '~~', '....T...'],
      ['......T.', '~~', '..^^....'], ['.....TT.', '~~', '....^...'], ['..=.....', '~~', '........'],
      ['..======', '==', '=====...'], ['..=.....', '~~', '.T......'], ['.=......', '~~', '......T.'],
      ['.=......', '~~', '.......T']]),
    party: [['leon', 2, 6], ['mira', 1, 7], ['luka', 2, 8], ['sophia', 1, 5], ['jin', 3, 7]],
    enemies: [['skeleton', 12, 3, 2, 'aggro'], ['skeleton', 12, 9, 2, 'aggro'], ['skeleton', 14, 5, 2, 'aggro'], ['skeleton', 14, 7, 2, 'wait'],
      ['skeleton', 15, 1, 2, 'wait'], ['darkmage', 16, 4, 2, 'wait'], ['darkmage', 16, 10, 2, 'wait']],
    join: ['sophia', 'jin'],
    pre: [
      [null, '南の渡し場。川の向こうで、死者の兵が骨を鳴らしていた。'],
      ['sophia', 'お待ちください! 負傷した方が、まだ橋のたもとに…!'],
      ['leon', '君は…? 神官か?'],
      ['sophia', 'ソフィアと申します。癒しの術が使えます。わたくしにも、戦わせてください。'],
      ['jin', 'おっと、そこの隊長さん。俺も雇ってくれないか? 前金で銀貨三枚だ。'],
      ['mira', '出たわね、コソ泥。さっきから荷車を覗いてたの、気づいてたんだから。'],
      ['jin', '人聞きが悪いなあ。…ま、骸骨どもに金目の物はなさそうだし、今回は後払いでいいぜ。'],
      ['luka', 'あやつらを操っておるのは、闇の司祭じゃ。術者を叩けば、骨は崩れるぞい。'],
      ['leon', 'ソフィア、ジン、頼む。みんなで橋を渡ろう!'],
      [null, '【ヒント】森・山・砦では回避と守備が上がる。ヒーラーは隣の味方を杖で回復できる。']
    ],
    post: [
      ['sophia', '皆さま、お怪我は…あら、レオン様、腕から血が。'],
      ['leon', 'かすり傷だ。それより、最後に司祭が何か言っていたな。'],
      ['dmage', 'ガルド将軍が…丘の砦で…お待ちかね…よ…。'],
      ['jin', '砦ってのは、あの黄金の旗の…。やれやれ、金の匂いと厄介事の匂いがするぜ。'],
      ['mira', '行こう。国境を取り戻すんだ!']
    ]
  },
  {
    title: '第三章', name: '金角の砦', goal: '敵将ガルドを倒せ', win: 'boss', bgm: 'boss',
    map: mk([
      '..TT.....^^^......TT', '....T....^^....##...', '..T.....==.....##...', '....====..T.........',
      '~~..=.....T....=.=..', '~...=..~~...T.==....', '....=..~~.^^..=...T.', '...==..~~.^^.==.....',
      '..=T.......^..=..TT.', '..=...T..====..T....', '..==.TT.==..........', '...=.......T....T...',
      '.===....T.....^^....', '.=......T..T........', '.=..................']),
    party: [['leon', 2, 12], ['mira', 3, 13], ['luka', 1, 13], ['sophia', 3, 11], ['jin', 4, 12]],
    enemies: [['goblin', 9, 9, 3, 'aggro'], ['goblin', 12, 6, 3, 'aggro'], ['slime', 13, 10, 3, 'aggro'], ['slime', 11, 5, 3, 'wait'],
      ['skeleton', 10, 7, 3, 'wait'], ['skeleton', 14, 7, 3, 'wait'], ['skeleton', 15, 5, 3, 'wait'],
      ['darkmage', 14, 3, 3, 'wait'], ['darkmage', 16, 5, 3, 'wait'], ['boss', 16, 2, 4, 'hold']],
    join: [],
    pre: [
      [null, '丘の上の古い砦。黄金の旗が、重い風にはためいている。'],
      ['boss', '来たか、小さな旗の騎士よ。我が名はガルド。黒き軍勢の金角将軍だ。'],
      ['leon', '国境を荒らす理由を言え!'],
      ['boss', '理由? 星を砕くためだ。この国の灯を、ひとつ残らずな。'],
      ['sophia', 'そんな…。'],
      ['jin', 'でかい口だな。あの金ピカの兜、いい値で売れそうだ。'],
      ['luka', '若いの、あやつは砦の上におる。守りは固いぞ。遠くから削るか、囲んで叩くか…考えるのじゃ。'],
      ['mira', '大丈夫。あたしたち、ここまで一緒に来たんだもん。'],
      ['leon', 'みんな、力を貸してくれ。…行くぞ!']
    ],
    post: [
      ['boss', '見事…だ。だが…星は、もう…。'],
      ['leon', '終わったんだ…。'],
      ['mira', 'やったね、隊長!'],
      ['sophia', '皆さま、ご無事で何よりです。'],
      ['jin', '報酬は、全員で朝日を見られること…なんてな。ま、前金もきっちりもらうけど。'],
      ['luka', 'ふぉっふぉ。旗は折れなんだな、レオン。'],
      ['leon', 'ああ。この戦旗が掲げられる限り、俺たちは何度でも立ち上がる。']
    ]
  }
];
const ENDING_TEXT = [
  'こうして国境に、朝が戻った。',
  '星砕きの戦旗は、辺境の空に高く翻っている。',
  '――旗の下に集った、五つの小さな星とともに。'
];
