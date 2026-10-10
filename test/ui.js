require('fs').mkdirSync('test-out/shots', { recursive: true }); require('fs').mkdirSync('test-out/g', { recursive: true });
const { chromium } = require(process.env.PW_PATH || 'playwright');
const path = require('path'); const OUT = 'test-out/shots';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 400, height: 820 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_TUNNEL|Failed to load/.test(t)) errors.push(t); });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForFunction(() => window.__rpg && window.__rpg.G.scene);
  // real-time: tap 決定 on title via pointer events
  const tapBtn = async (sel, ms = 120) => { const b = await page.locator(sel).boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up(); await page.waitForTimeout(80); };
  await tapBtn('#btnA');
  await page.waitForTimeout(1500);
  const sc = await page.evaluate(() => [__rpg.G.mapId, !!__rpg.G.script, !!__rpg.G.narr]);
  console.log('after tap A on title:', sc);
  for (let i = 0; i < 25; i++) await tapBtn('#btnA', 60);
  await page.waitForTimeout(800);
  const before = await page.evaluate(() => ({ ...__rpg.G.p, script: !!__rpg.G.script }));
  // hold d-pad left
  const d = await page.locator('#dpad').boundingBox();
  await page.mouse.move(d.x + 20, d.y + d.height / 2); await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up();
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({ ...__rpg.G.p }));
  console.log('dpad move:', before.x, before.y, before.script, '->', after.x, after.y);
  // swipe on the game screen with a real touch: drag right and hold, the hero walks right
  const cdp = await ctx.newCDPSession(page); const scr = await page.locator('#screen').boundingBox();
  const sx = scr.x + scr.width / 2, sy = scr.y + scr.height / 2;
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  const sw0 = await page.evaluate(() => ({ ...__rpg.G.p }));
  await touch('touchStart', sx, sy); for (let k = 1; k <= 6; k++) { await touch('touchMove', sx + k * 8, sy); await page.waitForTimeout(16); }
  await page.waitForTimeout(600); const sw1 = await page.evaluate(() => ({ ...__rpg.G.p, joy: __rpg.Input.down.right }));
  await touch('touchEnd'); await page.waitForTimeout(300);
  console.log('swipe move:', sw0.x, sw0.y, '->', sw1.x, sw1.y, 'held right', sw1.joy, sw1.x > sw0.x ? 'OK' : 'FAILED');
  // a quick tap on the screen acts as A: tap the menu open via button, then tap screen does not break anything
  await page.touchscreen.tap(sx, sy); await page.waitForTimeout(200);
  await tapBtn('#menuBtn'); await page.waitForTimeout(200);
  console.log('menu open via button:', await page.evaluate(() => !!__rpg.G.menu));
  await tapBtn('#btnB'); await page.waitForTimeout(200);
  console.log('menu closed via B:', await page.evaluate(() => !__rpg.G.menu));
  // manual-mode screenshots of UIs
  await page.evaluate(() => { window.__manual = true; });
  await page.addScriptTag({ path: path.resolve(__dirname, 'bot.js') });
  const shot = async n => { await page.evaluate(() => __rpg.render()); await page.screenshot({ path: `${OUT}/${n}.png`, clip: { x: 0, y: 0, width: 400, height: 380 } }); };
  await page.evaluate(() => { const R = __rpg; R.joinParty('kai'); R.joinParty('zek'); R.G.party.forEach(m => { m.lv = 9; m.exp = R.expAt(9); }); R.healAll(); R.G.gil = 3000; R.G.flags.quest = 1; });
  await page.evaluate(() => { __rpg.Field.enter('rosa', 5, 14, 'up'); BOT.settle(); BOT.warpTo('smithRosa', 5, 13); BOT.walkTo(3, 4); BOT.press('up'); BOT.press('a'); BOT.settle(); BOT.press('a'); BOT.press('down'); BOT.press('down'); });
  await shot('u01-shop');
  await page.evaluate(() => { BOT.press('a'); });
  await shot('u02-shop-qty');
  await page.evaluate(() => { BOT.press('a'); BOT.press('b'); BOT.press('b'); BOT.settle(); BOT.press('menu'); for (let i = 0; i < 2; i++) BOT.press('down'); BOT.press('a'); BOT.press('down'); BOT.press('a'); });
  await shot('u03-equip-pick');
  await page.evaluate(() => { BOT.press('a'); BOT.press('b'); BOT.press('b'); BOT.press('down'); BOT.press('a'); BOT.press('a'); });
  await shot('u04-status');
  await page.evaluate(() => { BOT.press('b'); BOT.press('b'); BOT.press('b'); BOT.press('b'); BOT.settle(); __rpg.startBattle({ ids: ['golem', 'specter', 'darkmage'], music: 'battle' }); BOT.stepN(400); });
  await shot('u05-battle4');
  await page.evaluate(() => { const B = __rpg.B; if (B.menu) { BOT.press('down'); BOT.press('a'); } });
  await shot('u06-skill-list');
  await page.evaluate(() => { BOT.press('a'); BOT.stepN(2); });
  await shot('u07-target');
  await page.evaluate(() => { BOT.press('a'); BOT.stepN(30); });
  await shot('u08-fx');
  await page.evaluate(() => { BOT.battleLoop(); });
  await page.evaluate(() => { __rpg.G.party.forEach(m => { m.exp = __rpg.expAt(m.lv + 1) - 5; }); __rpg.startBattle({ ids: ['slime'], music: 'battle' }); let i = 0; while (!(__rpg.B && __rpg.B.waitKey) && i++ < 5000) { if (__rpg.B && __rpg.B.menu && __rpg.B.menu.stage === 'cmd') BOT.decide(); else __rpg.step(); } BOT.press('a'); });
  await shot('u09-victory');
  await page.evaluate(() => { BOT.press('a'); });
  await shot('u10-levelup');
  await page.evaluate(() => { BOT.battleLoop(); __rpg.startBattle({ ids: ['garva'], boss: true, music: 'boss' }); BOT.stepN(200); });
  await shot('u11-garva');
  await page.evaluate(() => { __rpg.startBattle({ ids: ['gking'], boss: true }); BOT.stepN(200); });
  await shot('u12-gking');
  console.log('ERRORS', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
