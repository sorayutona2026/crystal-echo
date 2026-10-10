// Story scenes told on a black screen (narration, the inn night after Zek joins) must stay readable:
// the dialog box has to be drawn over the fade, not under it.
const { chromium } = require(process.env.PW_PATH || 'playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForFunction(() => window.__rpg && window.__rpg.G.scene);
  await page.evaluate(() => { window.__manual = true; });
  await page.addScriptTag({ path: path.resolve(__dirname, 'bot.js') });
  const r = await page.evaluate(() => {
    const R = __rpg, G = R.G; R.setSeed(2); R.newGame(); BOT.settle(); Object.assign(G.flags, { quest: 1, echo: 1, cave_boss: 1 }); R.joinParty('kai');
    R.Field.enter('pub', 9, 7, 'up'); BOT.settle(); BOT.walkTo(9, 6); R.Input.down.a = true; R.step(); R.Input.down.a = false; R.step();
    const until = f => { for (let i = 0; i < 4000 && !f(); i++) { R.step(); if (i % 20 === 0 && !G.choice) { R.Input.down.a = true; R.step(); R.Input.down.a = false; } } for (let i = 0; i < 40; i++) R.step(); };
    // average brightness of the dialog box area on the real canvas
    const lum = () => { R.render(); const c = document.getElementById('screen'), x = c.getContext('2d'); const d = x.getImageData(60, 480, 600, 150).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return s / (d.length / 4) / 3; };
    until(() => G.choice); const fade = G.fadeLevel, choiceLum = lum();
    return { fade, choiceLum, joined: G.flags.zek };
  });
  console.log(r);
  const ok = r.joined && r.fade >= 1 && r.choiceLum > 12;
  console.log('STORY:', ok ? 'OK' : 'FAILED (dialog hidden under the fade?)'); console.log('ERRORS', errors.length ? errors.join('\n') : 'none');
  await browser.close(); if (!ok) process.exit(1);
})();
