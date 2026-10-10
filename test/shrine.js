// Optional dungeon: walk into the wind shrine, open its chests, beat the storm bird and collect the reward.
require('fs').mkdirSync('test-out', { recursive: true });
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
    const R = __rpg, G = R.G; R.setSeed(21); R.newGame(); BOT.settle();
    G.flags.quest = 1; G.flags.cave_boss = 1; R.joinParty('kai'); R.joinParty('zek'); G.flags.zek = 1;
    G.party.forEach(m => { m.lv = 15; m.exp = R.expAt(15); }); R.healAll();
    Object.assign(G.party[0], { weapon: 'rune', armor: 'mmail' }); Object.assign(G.party[1], { weapon: 'sage', armor: 'srobe' });
    Object.assign(G.party[2], { weapon: 'assassin', armor: 'mmail' }); Object.assign(G.party[3], { weapon: 'wizard', armor: 'srobe' });
    G.inv = { hipotion: 4, phoenix: 3, ether: 4 }; R.healAll();
    R.Field.enter('world', 5, 23, 'left'); BOT.settle();
    BOT.warpTo('shrine', 4, 23);
    const log = [];
    // Kai sniffs out the hidden elixir
    BOT.walkTo(18, 13); BOT.press('a'); BOT.settle(); log.push('elixir ' + (G.inv.elixir || 0));
    for (const [x, y] of [[1, 12], [1, 3], [18, 6]]) { BOT.walkTo(x, y, { adjacent: true }); BOT.press('a'); BOT.settle(); }
    log.push('gale ' + (G.inv.gale || 0) + ' aerial ' + (G.inv.aerial || 0) + ' mega ' + (G.inv.megapotion || 0));
    BOT.equipBest(); R.healAll();
    BOT.talk(10, 3);
    log.push('tempest ' + !!G.flags.tempest + ' windblade ' + (G.inv.windblade || 0) + ' scene ' + (G.scene === R.Field));
    const has = id => !!G.inv[id] || G.party.some(m => m.weapon === id || m.armor === id);
    return { log, ok: !!G.flags.tempest && has('windblade') && has('elixir') && has('gale') && has('aerial') };
  });
  console.log(r.log.join('\n'));
  console.log('SHRINE:', r.ok ? 'CLEARED' : 'FAILED');
  console.log('ERRORS', errors.length ? errors.join('\n') : 'none');
  await browser.close();
  if (!r.ok) process.exit(1);
})();
