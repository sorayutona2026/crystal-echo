// ===================== 灰の王冠 (ASH CROWN) =====================
// クリスタル・エコーのエンジンの上に、新作の世界・キャラ・物語を重ねる層。
// 後ろに置いた宣言が先の同名の関数/データを上書きする(build.py の連結順は menu.js のあと)。
// 内部ID(allen/lina/kai/zek)は描画コードが参照しているので当面そのまま使い、表示名と見た目だけ置き換える。

// ---- 名前・設定 ----
Object.assign(HEROES.allen, { name: 'カイン', job: '火守' });
Object.assign(HEROES.lina, { name: 'セレネ', job: '王冠の巫女' });
Object.assign(HEROES.kai, { name: 'ミレイ', job: '灰の盗賊' });
Object.assign(HEROES.zek, { name: 'ノクス', job: '影の魔術師' });
Object.assign(SKILLS.power, { name: '灰断ち', desc: '灰ごと断つ一撃' });
Object.assign(SKILLS.whirl, { name: '灯火の輪', desc: '炎の輪で敵全体を斬る' });
Object.assign(SKILLS.braver, { name: '燃え尽きる火', desc: '命を燃やす大技' });
Object.assign(SKILLS.heal, { name: '灯し', desc: '味方1人のHP回復' });
Object.assign(ITEMS.potion, { name: '灯油の薬' });
Object.assign(ITEMS.phoenix, { name: '不死鳥の灰' });
Object.assign(ITEMS.copper, { name: '火守の剣' });
Object.assign(ITEMS.oakstaff, { name: '巫女の杖' });
Object.assign(ENEMIES.slime, { name: '灰泥' });
Object.assign(ENEMIES.bat, { name: '灰蝙蝠' });
Object.assign(ENEMIES.goblin, { name: '灰喰いの小鬼' });
Object.assign(ENEMIES.skeleton, { name: '灰骨' });
ENEMIES.ashbeast = { name: '灰喰いの獣', img: 'hellhound', hp: 190, str: 12, def: 5, mag: 6, mdf: 5, spd: 8, exp: 200, gil: 300, boss: true, weak: ['fire'], ai: 'gking' };
FORMATIONS.ruins = [['slime', 'bat'], ['bat', 'bat'], ['goblin'], ['slime', 'slime'], ['goblin', 'bat']];

// 色を暗く・赤く(灰の空の世界)
Object.assign(PALS.allen, { H: '#d8d8e4', C: '#5a1f2a', A: '#c8963c', P: '#2a2a3a' });
Object.assign(PALS.lina, { H: '#f0e8e0', C: '#d8d0e0', A: '#9a2a48', P: '#c8c0d0' });
Object.assign(HERO_STYLE.allen, { hair: '#d8d8e4', top: '#5a1f2a', legs: '#2a2a3a' });
Object.assign(ENV.town, { grade: ['#5a3a58', 0.24], ambient: '#4a4064', halo: 1.7, bloom: 0.75, thr: 150, rays: 0.1, vignette: 0.65, parts: 'dust', torch: true });
Object.assign(ENV.cave, { grade: ['#7a3030', 0.14], ambient: '#3a3048', vignette: 0.6 });
Object.assign(ENV.inside, { grade: ['#c07040', 0.14], ambient: '#4a3a4a', vignette: 0.6 });
Object.assign(ENV.battleDay, { grade: ['#7a5a6a', 0.18], vignette: 0.55, parts: 'dust' });
Object.assign(ENV.battleCave, { grade: ['#7a3030', 0.16] });
Object.assign(ENV.title, { grade: ['#a04040', 0.16], thr: 120 });

// ---- 会話の顔 ----
Object.assign(SPEAKERS, { 'カイン': 'allen', 'セレネ': 'lina', 'ミレイ': 'kai', 'ノクス': 'zek' });

// ---- タイトル ----
function drawLogo(y, a = 1) {
  ctx.save(); ctx.globalAlpha = a;
  ctx.font = `800 24px ${FONT_T}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(230,90,60,.28)';
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.fillText('ASH CROWN', 128 + dx, y + dy);
  ctx.globalCompositeOperation = 'source-over';
  const g = ctx.createLinearGradient(0, y, 0, y + 24); g.addColorStop(0, '#f4e4d8'); g.addColorStop(0.55, '#c88a60'); g.addColorStop(1, '#6a2a2a');
  ctx.fillStyle = 'rgba(8,4,10,.85)'; ctx.fillText('ASH CROWN', 128.7, y + 0.8);
  ctx.fillStyle = g; ctx.fillText('ASH CROWN', 128, y);
  ctx.fillStyle = 'rgba(200,120,90,.6)'; ctx.fillRect(56, y + 29, 144, 0.5);
  ctx.restore();
  text('灰の王冠', 128, y + 32, '#d8c8c0', 8, 'center', 't');
}

// ---- マップ ----
function buildLamp() {
  const W = 24, H = 18; const g = grid(W, H, 'g');
  for (let x = 0; x < W; x++) { g[0][x] = 'T'; } for (let y = 0; y < H; y++) { g[y][0] = 'T'; g[y][W - 1] = 'T'; }
  fillRect(g, 11, 2, 2, 16, 'P'); fillRect(g, 3, 9, 18, 1, 'P'); fillRect(g, 9, 8, 6, 3, 'P');
  house(g, 3, 3, 6, 'r', 5); fillRect(g, 5, 6, 1, 3, 'P');
  house(g, 15, 3, 6, 'r', 17); fillRect(g, 17, 6, 1, 3, 'P');
  house(g, 3, 11, 6, 'r', 5); fillRect(g, 5, 14, 1, 2, 'P');
  for (const [x, y] of [[10, 6], [13, 6], [10, 13], [13, 13], [8, 9], [15, 9]]) g[y][x] = 'L';
  g[9][12] = 'w'; g[9][11] = 'P'; g[16][8] = 'x'; g[16][9] = 'x'; g[16][15] = 'x'; g[14][17] = 'S';
  g[17][11] = 'P'; g[17][12] = 'P';
  return { id: 'lamp', hd: true, name: '燈火の街', set: 'town', music: 'town', w: W, h: H, g,
    warps: { '5,5': { map: 'hall', x: 5, y: 6, dir: 'up' }, '11,17': { map: 'ruins', x: 2, y: 2, dir: 'down', script: 'ruinsGate' }, '12,17': { map: 'ruins', x: 2, y: 2, dir: 'down', script: 'ruinsGate' } },
    signs: { '17,15': '燈火の街\n「ひとつの火は、ひとりの命」' },
    npcs: [
      { id: 'captain', x: 12, y: 15, pal: 'soldier', dir: 'up', talk: 'captain' },
      { id: 'lampWoman', x: 8, y: 11, pal: 'woman', wander: true, talk: 'lampWoman' },
      { id: 'lampOld', x: 14, y: 11, pal: 'elder', wander: true, talk: 'lampOld' },
      { id: 'lampChild', x: 9, y: 7, pal: 'child', wander: true, talk: 'lampChild' },
    ] };
}
function buildRuins() {
  const rows = [
    '##############################',
    '#>.......#####################',
    '#........#####################',
    '#........#####.........#######',
    '#........#####.........#######',
    '#...........................##',
    '###############.........#...##',
    '###############.........#...##',
    '##########B####.........#...##',
    '#########.......#########...##',
    '#########.......#########...##',
    '#B........................B.##',
    '#########.......#############',
    '#########.......#############',
    '##############.##############',
    '##############.##############',
    '#########.............########',
    '#########.............########',
    '#########......B......########',
    '##############################',
  ];
  const g = fromRows(rows);
  const trig = {}; for (let x = 11; x <= 21; x++) trig[x + ',17'] = 'ruinsBoss';
  return { id: 'ruins', name: '灰の回廊', set: 'cave', music: 'dungeon', w: g[0].length, h: g.length, g,
    warps: { '1,1': { map: 'lamp', x: 11, y: 16, dir: 'up' } },
    chests: { '10,8': { item: 'potion', n: 3 }, '1,11': { item: 'antidote', n: 2 }, '26,11': { gil: 200 }, '15,18': { item: 'phoenix' } },
    triggers: trig, enc: () => 'ruins', rate: 30,
    npcs: [
      { id: 'ashbeast', x: 16, y: 17, pal: 'gking', dir: 'down', talk: 'ruinsBoss', show: () => !G.flags.ruinsBoss },
      { id: 'selene', x: 16, y: 18, pal: 'lina', dir: 'up', talk: 'seleneCaged', show: () => !G.flags.ruinsBoss },
    ] };
}
function buildMaps() {
  MAPS = {
    lamp: buildLamp(), ruins: buildRuins(),
    hall: room('hall', '火守の詰所', ['##########', '#kk.f..kk#', '#........#', '#.t...B..#', '#........#', '#.p....p.#', '#........#', '####e#####'],
      { map: 'lamp', x: 5, y: 6, dir: 'down' }, [{ id: 'keeper', x: 6, y: 2, pal: 'elder', talk: 'keeper' }]),
  };
}

// ---- 物語(デモ:第1部の冒頭) ----
for (const k of Object.keys(SCRIPTS)) delete SCRIPTS[k];
Object.assign(SCRIPTS, {
  *intro() {
    G.fadeLevel = 1;
    yield* narrate('百年前、空から太陽が消えた。\n昼でも灰色の空の下で\n人々は「燈火」のまわりに身を寄せて生きている。');
    yield* narrate('燈火は、火守が命を分けて灯す火。\n灯すたびに、火守の寿命は縮んでいく。');
    Field.enter('lamp', 12, 12, 'up', true); G.banner = null;
    yield { t: 'fadein' };
    yield* say('……また、火が細くなってる。', 'カイン');
    yield* say('(今夜の当番で、あとどれくらい持つだろう)', 'カイン');
    yield* say('おい、カイン! 詰所に来い。\n火守長が呼んでる。', '衛兵長');
    yield* say('(街の左上にある詰所へ行こう)');
    G.flags.intro = 1;
  },
  *keeper() {
    if (!G.flags.keeperTalk) {
      G.flags.keeperTalk = 1;
      yield* say('来たか、カイン。\n……おまえの火は、あと三年ももたん。', '火守長');
      yield* say('知ってる。\n火守になったときから、わかってた。', 'カイン');
      yield* say('だが今夜、南の回廊に灰喰いが出た。\n誰かが迷い込んだらしい。\n悲鳴が聞こえたと、門番が言っておる。', '火守長');
      yield* say('行ってくれるか。\n命を削って守る火なら、\n誰かのために使え。', '火守長');
      addItem('potion', 3); G.flags.quest = 1; Audio8.sfx('chest');
      yield* say('灯油の薬×3を受け取った!');
      yield* say('……わかった。行ってくる。', 'カイン');
    } else if (!G.flags.ruinsBoss) yield* say('南の門から灰の回廊へ入れる。\n生きて戻れ、カイン。', '火守長');
    else yield* say('あの娘は、ただの迷い人ではない。\n……あの額の印は、王冠の——', '火守長');
  },
  *ruinsGate() {
    if (G.flags.quest) return true;
    yield* say('待て、カイン。\nまず詰所で火守長の話を聞け。\n街の左上の家だ。', '衛兵長');
    return false;
  },
  *captain() {
    if (!G.flags.quest) yield* say('燈火の外は灰喰いの縄張りだ。\n先に詰所で火守長の話を聞いてこい。', '衛兵長');
    else if (!G.flags.ruinsBoss) yield* say('南の門の先が灰の回廊だ。\n宿屋はないが、薬は大事に使えよ。', '衛兵長');
    else yield* say('その娘を連れて戻ったか。\n……詰所で話を聞いてやれ。', '衛兵長');
  },
  *lampWoman() { yield* say(G.flags.ruinsBoss ? '灰喰いが退いたの!?\nあなた、見かけによらないのね。' : '火守さんの火が細くなるたび、\nうちの子の咳も増える気がするの…'); },
  *lampOld() { yield* say('百年前は、空が青かったそうじゃ。\n青い、という色を\nわしは見たことがないがのう。'); },
  *lampChild() { yield* say('ねえねえ、火守のお兄ちゃん。\nあったかい火って、命の色なんだよね?'); },
  *seleneCaged() { yield* say('……だれ?\nここに、来ないで。……あぶない。', '少女'); },
  *ruinsBoss() {
    if (G.flags.ruinsBoss) return;
    yield* say('……逃げて。\nこの子は、わたしの「王冠」の匂いに\n引き寄せられてるの。', '少女');
    Audio8.sfx('boss'); G.shake = 20;
    yield* say('グルルル…', '灰喰いの獣');
    yield* say('(火が……あの獣に向かって、勝手に揺れてる)', 'カイン');
    yield* say('下がってろ。\n俺の火は、どうせ長くない。', 'カイン');
    const r = yield { t: 'battle', ids: ['ashbeast'], boss: true, music: 'boss' };
    if (r !== 'win') return;
    G.flags.ruinsBoss = 1;
    yield* say('……ありがとう。\nわたしはセレネ。\n目が覚めたら、この回廊にいたの。', 'セレネ');
    yield* say('名前以外、何も思い出せない。\nでも、ひとつだけ分かる。\nあなたの火は、とても痩せてる。', 'セレネ');
    yield* say('……わかるのか。', 'カイン');
    yield* say('額が、熱いの。\nあなたの火に、共鳴してるみたい。', 'セレネ');
    joinParty('lina'); Audio8.play('fanfare', G.map.music);
    yield* say('セレネが仲間に加わった!');
    yield { t: 'fadeout' };
    yield* narrate('——第1部「燈火の街」\n\nつづく。');
    yield { t: 'ending' };
  },
});

function newGame() {
  G.flags = {}; G.inv = { potion: 3, antidote: 1 }; G.gil = 100; G.time = 0;
  G.party = [newMember('allen')];
  Field.enter('lamp', 12, 12, 'up', true);
  runScript(SCRIPTS.intro);
}
ENDING_LINES.length = 0;
ENDING_LINES.push('', '燈火は、まだ消えていない。', '', 'けれど、空はまだ灰色のまま。', '', 'カインとセレネの旅は', 'ここから始まる。', '', 'つづく');
