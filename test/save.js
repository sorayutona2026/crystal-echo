require('fs').mkdirSync('test-out/shots', { recursive: true }); require('fs').mkdirSync('test-out/g', { recursive: true });
const { chromium } = require(process.env.PW_PATH || 'playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForFunction(() => window.__rpg && window.__rpg.G.scene);
  await page.evaluate(() => { window.__manual = true; });
  await page.addScriptTag({ path: path.resolve(__dirname, 'bot.js') });
  const r = await page.evaluate(() => {
    const R = __rpg, G = R.G; R.newGame(); BOT.settle(); G.gil = 1234; G.flags.quest = 1; R.joinParty('kai');
    BOT.press('menu'); for (let i = 0; i < 4; i++) BOT.press('down'); BOT.press('a'); const msg = G.menu.msg; BOT.press('b');
    const snap = JSON.stringify(R.snapshot());
    G.gil = 0; G.party.length = 1; G.flags = {};
    const ok = R.loadGame();
    return { msg, ok, same: JSON.stringify(R.snapshot()) === snap, gil: G.gil, n: G.party.length };
  });
  console.log(r);
  // reload page, title should allow つづきから
  await page.reload(); await page.waitForFunction(() => window.__rpg && window.__rpg.G.scene);
  const t = await page.evaluate(() => [__rpg.Title.i, __rpg.G.scene === __rpg.Title]);
  console.log('title cursor on continue:', t);
  console.log('ERRORS', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
