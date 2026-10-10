require('fs').mkdirSync('test-out/shots', { recursive: true }); require('fs').mkdirSync('test-out/g', { recursive: true });
const { chromium } = require(process.env.PW_PATH || 'playwright');
const path = require('path');
const OUT = process.env.OUT || 'test-out/shots';
require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 420, height: 860 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + e.stack));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForFunction(() => window.__rpg && window.__rpg.G.scene, null, { timeout: 8000 });
  await page.evaluate(() => { window.__manual = true; });
  const shot = async n => { await page.evaluate(() => __rpg.render()); await page.screenshot({ path: `${OUT}/${n}.png` }); };
  // helpers in page
  await page.evaluate(() => {
    const R = window.__rpg;
    window.TT = {
      run(n) { for (let i = 0; i < n; i++) R.step(); },
      press(k, hold = 1) { R.Input.down[k] = true; for (let i = 0; i < hold; i++) R.step(); R.Input.down[k] = false; R.step(); R.step(); },
      // mash through dialogs/scripts
      flushScript(max = 3000) { let i = 0; while ((R.G.script || R.G.fadeLevel > 0) && i++ < max) { if (R.G.choice) { this.press('a'); continue; } this.press('a'); } return i; },
    };
  });
  await shot('01-title');
  await page.evaluate(() => { __rpg.setSeed(5); __rpg.newGame(); TT.run(5); });
  await page.evaluate(() => TT.run(60));
  await shot('02-intro-narration');
  await page.evaluate(() => { let i = 0; while (__rpg.G.narr && i++ < 200) TT.press('a'); TT.run(30); });
  await shot('03-village-dialog');
  await page.evaluate(() => TT.flushScript());
  await page.evaluate(() => TT.run(20));
  await shot('04-village');
  const st = await page.evaluate(() => ({ scene: __rpg.G.scene === __rpg.Field, map: __rpg.G.mapId, p: { ...__rpg.G.p }, flags: __rpg.G.flags }));
  console.log('state', JSON.stringify(st));
  // menu
  await page.evaluate(() => { TT.press('menu'); TT.run(5); });
  await shot('05-menu');
  await page.evaluate(() => { TT.press('b'); TT.run(5); });
  // battle
  await page.evaluate(() => { __rpg.startBattle({ ids: ['slime', 'bat', 'goblin'], music: 'battle' }, r => { window.__lastBattle = r; }); TT.run(90); });
  await shot('06-battle');
  await page.evaluate(() => { TT.run(150); });
  await shot('07-battle-menu');
  console.log('ERRORS', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
