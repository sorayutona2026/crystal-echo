// Defeat in a story boss fight offers "もう一度たたかう(全回復)"; retrying must keep the story script alive,
// so winning afterwards still gives Kai and sets the flag.
const { chromium } = require(process.env.PW_PATH || 'playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForFunction(() => window.__rpg && window.__rpg.G.scene);
  await page.evaluate(() => { window.__manual = true; });
  await page.addScriptTag({ path: path.resolve(__dirname, 'bot.js') });
  await page.evaluate(() => { const R = __rpg, G = R.G; R.setSeed(3); R.newGame(); BOT.settle(); G.flags.quest = 1; R.healAll(); R.Field.enter('cave', 21, 18, 'right'); BOT.settle(); });
  const out = await page.evaluate(() => {
    const R = __rpg, G = R.G; const log = [];
    const pump = f => { for (let i = 0; i < 6000 && !f(); i++) { R.Input.down.a = (i % 8) < 4; R.step(); } R.Input.down.a = false; };
    G.p.x = 21; G.p.y = 18; R.Field.arrive();
    pump(() => R.B && R.B.phase === 'main');                                   // boss fight started
    const hp0 = G.party.map(m => m.hp).join(',');
    G.party.forEach(m => m.hp = 0); R.B.afterAction ? 0 : 0; R.Battle.afterAction();
    pump(() => G.scene === R.GameOver && R.GameOver.t > 70);
    log.push('game over shown with retry: ' + (R.GameOver.opts[0][1] === 'retry'));
    R.Input.down.a = true; R.step(); R.Input.down.a = false; R.step();           // choose retry
    pump(() => R.B && R.B.phase === 'main');
    log.push('fresh fight, party healed: ' + G.party.every(m => m.hp === R.stats(m).maxhp) + ', script alive: ' + !!G.script);
    R.B.enemies.forEach(e => { e.hp = 0; e.alive = false; e.dying = 40; }); R.Battle.afterAction();
    pump(() => G.flags.cave_boss && !G.script);
    log.push('story continued: cave_boss=' + !!G.flags.cave_boss + ', party=' + G.party.length);
    return { log, ok: R.GameOver && G.flags.cave_boss && G.party.length === 3 };
  });
  console.log(out.log.join('\n')); console.log('RETRY:', out.ok ? 'OK' : 'FAILED'); console.log('ERRORS', errors.length ? errors.join('\n') : 'none');
  await browser.close(); if (!out.ok) process.exit(1);
})();
