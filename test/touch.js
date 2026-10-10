// Real touch input in battle: tap the command row, tap an enemy to choose it, swipe moves the cursor one step per flick.
const { chromium } = require(process.env.PW_PATH || 'playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 400, height: 820 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForFunction(() => window.__rpg && window.__rpg.G.scene);
  const cdp = await ctx.newCDPSession(page);
  const cvb = await page.locator('#screen').boundingBox();
  const L = (x, y) => [cvb.x + x * cvb.width / 256, cvb.y + y * cvb.height / 224];
  const down = (x, y) => cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  const move = (x, y) => cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y, id: 1 }] });
  const up = () => cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.evaluate(() => { const R = __rpg, G = R.G; R.setSeed(5); R.newGame(); G.script = null; G.narr = null; G.dialog = null; G.fadeLevel = 0; G.fadeTarget = 0; G.party.forEach(m => { m.lv = 6; m.exp = R.expAt(6); }); R.healAll(); R.Field.enter('world', 12, 10, 'down'); R.startBattle({ ids: ['slime', 'goblin', 'bat'] }); });
  await page.waitForFunction(() => __rpg.B && __rpg.B.menu, null, { timeout: 15000 });
  const who = await page.evaluate(() => __rpg.B.menu.who);
  // swipe down one flick: cursor moves one row
  const [sx, sy] = L(128, 100); await down(sx, sy); await move(sx, sy + 6); await move(sx, sy + 20); await page.waitForTimeout(150); await up(); await page.waitForTimeout(150);
  const ci1 = await page.evaluate(() => __rpg.B.menu.ci);
  // tap the 2nd command row (わざ) directly
  await down(...L(40, 157 + 13 + 5)); await up(); await page.waitForTimeout(250);
  const st1 = await page.evaluate(() => ({ stage: __rpg.B.menu && __rpg.B.menu.stage }));
  // back out with a tap on the screen's B (cancel) via the key, then tap たたかう and an enemy
  await page.evaluate(() => { __rpg.Input.set('b', true); setTimeout(() => __rpg.Input.set('b', false), 80); }); await page.waitForTimeout(250);
  await down(...L(40, 157 + 5)); await up(); await page.waitForTimeout(250);
  const st2 = await page.evaluate(() => ({ stage: __rpg.B.menu && __rpg.B.menu.stage, ti: __rpg.B.menu && __rpg.B.menu.ti }));
  const e2 = await page.evaluate(() => { const e = __rpg.B.enemies[2]; return [e.x + e.w / 2, e.y + e.h / 2]; });
  await down(...L(e2[0], e2[1])); await up(); await page.waitForTimeout(400);
  const after = await page.evaluate(() => ({ menu: !!__rpg.B.menu, queued: __rpg.B.queue.length, busy: !!__rpg.B.gen, target: __rpg.B.queue[0] && __rpg.B.queue[0].target }));
  console.log({ who, ci1, st1, st2, after });
  const ok = ci1 === 1 && st1.stage === 'list' && st2.stage === 'target' && !after.menu;
  console.log('TOUCH:', ok ? 'OK' : 'FAILED'); console.log('ERRORS', errors.length ? errors.join('\n') : 'none');
  await browser.close(); if (!ok) process.exit(1);
})();
