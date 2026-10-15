// real touch input on a phone viewport: tap to start, drag the screen to walk (incl. diagonals),
// tap the 攻撃 / 足踏み / 道具 buttons, and tap a menu row directly
const { open } = require('./lib');
(async () => {
  const { browser, page, errors, shot } = await open({ realtime: true });
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  const scr = await page.locator('#screen').boundingBox();
  const sx = scr.x + scr.width / 2, sy = scr.y + scr.height / 2;
  const tapScreen = async () => { await page.touchscreen.tap(sx, sy); await page.waitForTimeout(250); };
  const S = () => page.evaluate(() => { const G = __nm.G; return { scene: G.scene === __nm.Dungeon ? 'dungeon' : G.scene === __nm.Title ? 'title' : G.scene === __nm.Intro ? 'intro' : 'other', turn: G.turn, x: G.p && G.p.x, y: G.p && G.p.y, menu: G.menu.length, prompt: !!G.prompt }; });
  await page.evaluate(() => __nm.setSeed(9));
  await page.waitForTimeout(600);
  await tapScreen();
  for (let i = 0; i < 12 && (await S()).scene !== 'dungeon'; i++) await tapScreen();
  let st = await S(); if (st.scene !== 'dungeon') throw new Error('tapping did not start the game: ' + JSON.stringify(st));
  await page.waitForTimeout(500);
  // drag in each of 8 directions; the held keys must match the drag angle
  const ok = [];
  for (const [ax, ay, want] of [[40, 0, 'right'], [28, 28, 'down,right'], [0, 40, 'down'], [-28, 28, 'down,left'], [-40, 0, 'left'], [-28, -28, 'up,left'], [0, -40, 'up'], [28, -28, 'up,right']]) {
    await touch('touchStart', sx, sy); await touch('touchMove', sx + ax / 3, sy + ay / 3); await touch('touchMove', sx + ax, sy + ay);
    await page.waitForTimeout(60);
    const held = await page.evaluate(() => ['up', 'down', 'left', 'right'].filter(k => __nm.Input.down[k]).join(','));
    await page.waitForTimeout(250);
    await touch('touchEnd'); await page.waitForTimeout(200);
    ok.push(held === want ? '.' : `x(${want} got ${held})`);
    await page.evaluate(() => { __nm.G.prompt = null; });
  }
  console.log('drag directions', ok.join(''));
  if (ok.some(o => o !== '.')) throw new Error('drag direction mismatch');
  st = await S(); console.log('after walking', JSON.stringify(st));
  if (st.turn < 2) throw new Error('dragging did not walk');
  // 攻撃 button swings (1 turn), 足踏み button rests (1 turn)
  for (const id of ['#btnA', '#btnB']) {
    const t0 = (await S()).turn; const b = await page.locator(id).boundingBox();
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(500);
    const t1 = (await S()).turn; console.log(id, 'turn', t0, '->', t1);
    if (t1 !== t0 + 1) throw new Error(id + ' should pass one turn');
  }
  // 道具 button opens the menu; tapping the 道具 row opens the bag
  const mb = await page.locator('#menuBtn').boundingBox();
  await page.touchscreen.tap(mb.x + mb.width / 2, mb.y + mb.height / 2); await page.waitForTimeout(300);
  if ((await S()).menu !== 1) throw new Error('menu button did not open the menu');
  const lx = (x, y) => [scr.x + x * scr.width / 256, scr.y + y * scr.height / 224];
  await page.touchscreen.tap(...lx(50, 33)); await page.waitForTimeout(300);
  st = await S(); console.log('after tapping 道具 row', JSON.stringify(st));
  if (st.menu !== 2) throw new Error('tapping the row did not open the bag');
  await shot('touch-bag');
  if (errors.length) { console.log(errors.join('\n')); process.exit(1); }
  console.log('TOUCH OK');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
