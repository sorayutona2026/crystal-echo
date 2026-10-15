// every candy and page through the real menus: identification, throwing, status effects, まもりのページ
const { open } = require('./lib');
(async () => {
  const { browser, page, errors, shot } = await open();
  const out = await page.evaluate(() => {
    const N = __nm, G = N.G, R = [];
    const check = (name, ok, info = '') => R.push((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : ''));
    // a fresh floor with Haru in a room and nobody around
    const fresh = (seed = 5) => { N.setSeed(seed); N.newGame(); G.scene = N.Dungeon; N.enterFloor(2); G.fade = 0; G.card = 0; G.mons = []; G.items = []; G.bag = []; G.stopUntilRelease = false; TT.run(5); };
    const give = k => { G.bag.push({ k }); return G.bag.length - 1; };
    // MENU -> 道具 -> item row -> command row (0 use, 1 throw, 2 drop) by key presses
    const cmd = (idx, row) => { TT.press('menu'); TT.press('a'); for (let k = 0; k < idx; k++) TT.press('down'); TT.press('a'); for (let k = 0; k < row; k++) TT.press('down'); TT.press('a'); };
    const monNext = (k, dx = 1, dy = 0) => { const p = G.p; const m = N.spawnMonster(false); m.k = k; m.x = p.x + dx; m.y = p.y + dy; m.rx = m.x * 16; m.ry = m.y * 16; m.hp = m.mhp = 200; m.asleep = false; return m; };
    const roomFor = n => { // put Haru where n tiles to the right are open floor
      for (let y = 1; y < N.MH - 1; y++) for (let x = 1; x < N.MW - n - 1; x++) { let ok = true; for (let i = 0; i <= n; i++) if (N.areaAt(G.F, x + i, y) < 0 || !N.passable(G.F, x + i, y)) ok = false; if (ok) { G.p.x = x; G.p.y = y; G.p.rx = x * 16; G.p.ry = y * 16; G.p.dir = [1, 0]; N.updateFov(G.F, x, y); return true; } }
      return false;
    };

    fresh(); roomFor(4);
    const unknownName = N.dispName({ k: 'chikara' });
    check('candies start unidentified', unknownName.endsWith('キャンディ') && unknownName !== 'ちからのキャンディ', unknownName);
    check('いやしのキャンディ is known', N.dispName({ k: 'heal' }) === 'いやしのキャンディ');
    let i = give('chikara'); cmd(i, 0); TT.idle();
    check('eating identifies and raises ちから', G.p.str === 9 && N.dispName({ k: 'chikara' }) === 'ちからのキャンディ', `str ${G.p.str}`);

    // throwing a sleep candy at a monster two tiles away
    fresh(); roomFor(4); let m = monNext('neko', 2, 0); i = give('nemuri'); cmd(i, 1); TT.idle();
    check('thrown ねむりキャンディ puts the monster to sleep', m.sleepT > 0 && G.known.has('nemuri'), `sleepT ${m.sleepT}`);
    // a sleeping monster does not act
    const t0 = G.p.hp; for (let k = 0; k < 3; k++) { TT.press('b'); TT.idle(); }
    check('sleeping monster does not attack', G.p.hp >= t0);

    fresh(); roomFor(4); m = monNext('neko', 3, 0); i = give('konran'); cmd(i, 1); TT.idle();
    check('thrown こんらんキャンディ confuses', m.conf > 0, `conf ${m.conf}`);

    fresh(); roomFor(4); m = monNext('neko', 2, 0); i = give('honoo'); const hp0 = m.hp; cmd(i, 0); TT.idle();
    check('ほのおキャンディ breathes fire ahead', m.hp < hp0, `${hp0} -> ${m.hp}`);

    fresh(); roomFor(4); i = give('candy'); cmd(i, 1); TT.idle();
    check('a thrown item that hits nothing lands on the floor', G.items.some(it => it.k === 'candy'));

    fresh(); roomFor(4); i = give('hayasa'); cmd(i, 0); TT.idle(); m = monNext('moya', 4, 0); m.goal = null;
    // over 6 actions the monsters get only 3 turns: count the turns they spend (a counter on monAct is not exposed, so use a sleeping timer)
    m.sleepT = 50; for (let k = 0; k < 6; k++) { TT.press('b'); TT.idle(); }
    check('はやあし: monsters act every other action', G.p.fastT > 0 && m.sleepT === 47, `sleepT 50 -> ${m.sleepT}`);

    // しきべつのページ: pick the target in a sub-menu
    fresh(); roomFor(1); give('shiki'); give('bakusui');
    TT.press('menu'); TT.press('a'); TT.press('a'); TT.press('a'); // 道具 -> page -> よむ -> "どれを しらべる?" opens
    const asked = G.menu.length === 4 && G.menu[3].title === 'どれを しらべる?';
    TT.press('a'); TT.idle();
    check('しきべつのページ asks what to identify and identifies it', asked && G.known.has('bakusui') && G.known.has('shiki') && G.bag.length === 1);

    fresh(); roomFor(1); i = give('akari'); const seen0 = G.F.seen.reduce((a, b) => a + b, 0); cmd(i, 0); TT.idle();
    check('あかりのページ reveals the floor', G.F.seen.reduce((a, b) => a + b, 0) > seen0 * 3, `${seen0} -> ${G.F.seen.reduce((a, b) => a + b, 0)}`);

    fresh(); roomFor(4); const a = monNext('moya', 2, 0), b = monNext('neko', 3, 0); i = give('bakusui'); cmd(i, 0); TT.idle();
    check('こもりうたのページ puts the room to sleep', a.sleepT > 0 && b.sleepT > 0);

    fresh(); roomFor(4); const c = monNext('moya', 2, 0); c.hp = c.mhp = 5; i = give('arashi'); cmd(i, 0); TT.idle();
    check('おおあらしのページ damages (and defeats) the room', !G.mons.includes(c));

    // まもりのページ placed on the floor: an adjacent monster stops attacking
    fresh(); roomFor(2); i = give('mamori'); cmd(i, 2); TT.idle(); m = monNext('piero', 1, 0);
    const hpw = G.p.hp; for (let k = 0; k < 6; k++) { TT.press('b'); TT.idle(); }
    check('standing on まもりのページ: no attacks', G.p.hp >= hpw && G.items.some(it => it.k === 'mamori' && it.placed), `hp ${hpw} -> ${G.p.hp}`);
    TT.press('menu'); TT.press('down'); TT.press('a'); TT.press('a'); TT.idle();
    check('まもりのページ cannot be picked up again', !G.bag.some(it => it.k === 'mamori'));

    // eating こんらんキャンディ: Haru walks off in random directions for a while
    fresh(); roomFor(1); i = give('konran'); cmd(i, 0); TT.idle();
    check('eating こんらんキャンディ confuses Haru', G.p.conf > 0);
    fresh(); roomFor(1); i = give('shiawase'); const lv0 = G.p.lv; cmd(i, 0); TT.idle();
    check('しあわせのキャンディ raises the level', G.p.lv === lv0 + 1);
    return R;
  });
  console.log(out.join('\n'));
  await shot('items');
  if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
  if (out.some(l => l.startsWith('FAIL'))) process.exit(1);
  console.log('ITEMS OK');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
