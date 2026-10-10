// Auto battle: toggle with MENU during a fight, then the party fights (and closes the victory panel) with no input.
const { chromium } = require(process.env.PW_PATH || 'playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForFunction(() => window.__rpg && window.__rpg.G.scene);
  await page.evaluate(() => { window.__manual = true; });
  const r = await page.evaluate(() => {
    const R = __rpg, G = R.G; R.setSeed(5); R.newGame();
    for (let i = 0; i < 4000 && G.script; i++) { R.Input.down.a = !R.Input.down.a; R.step(); } R.Input.down.a = false;
    G.party.forEach(m => { m.lv = 5; m.exp = R.expAt(5); }); R.healAll();
    let result = null; R.startBattle({ ids: ['goblin', 'slime'] }, res => { result = res; });
    for (let i = 0; i < 120; i++) R.step();
    R.Input.down.menu = true; R.step(); R.Input.down.menu = false; R.step();
    const toggled = G.auto;
    let n = 0; while (G.scene !== R.Field && n++ < 20000) R.step();
    for (let i = 0; i < 60; i++) R.step();
    return { toggled, result, frames: n, scene: G.scene === R.Field };
  });
  console.log(r);
  const ok = r.toggled && r.result === 'win' && r.scene;
  console.log('AUTO:', ok ? 'OK' : 'FAILED'); console.log('ERRORS', errors.length ? errors.join('\n') : 'none');
  await browser.close(); if (!ok) process.exit(1);
})();
