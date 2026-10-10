// 灰の王冠:起動 → 冒頭 → 詰所 → 灰の回廊 → ボス戦 → セレネ加入 → デモ終了 を実入力で通す
const { chromium } = require(process.env.PW_PATH || 'playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.resolve(__dirname, '../test-out'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 420, height: 860 }, hasTouch: true, isMobile: true });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForFunction(() => window.__rpg && window.__rpg.G.scene, null, { timeout: 8000 });
  await page.evaluate(() => {
    window.__manual = true; const R = window.__rpg;
    window.TT = { run(n) { for (let i = 0; i < n; i++) R.step(); },
      press(k, hold = 1) { R.Input.down[k] = true; for (let i = 0; i < hold; i++) R.step(); R.Input.down[k] = false; R.step(); R.step(); },
      flush(max = 4000) { let i = 0; while ((R.G.script || R.G.fadeLevel > 0 || R.G.narr) && i++ < max) this.press('a'); return i; },
      walk(path) { for (const d of path) { R.Input.down[d] = true; this.run(18); R.Input.down[d] = false; this.run(2); } } };
  });
  const shot = async n => { await page.evaluate(() => __rpg.render()); await page.screenshot({ path: `${OUT}/${n}.png` }); };
  const st = () => page.evaluate(() => ({ map: __rpg.G.mapId, party: __rpg.G.party.map(m => m.id), flags: { ...__rpg.G.flags }, scene: __rpg.G.scene === __rpg.Field ? 'field' : 'other' }));
  const check = (c, m) => { if (!c) { errors.push('FAIL: ' + m); } };
  await page.evaluate(() => TT.run(120)); await shot('01-title');
  await page.evaluate(() => { __rpg.setSeed(5); __rpg.newGame(); TT.run(5); });
  await page.evaluate(() => { let i = 0; while (__rpg.G.narr && i++ < 300) TT.press('a'); TT.run(60); }); await shot('02-town');
  await page.evaluate(() => TT.flush());
  let s = await st(); check(s.map === 'lamp' && s.flags.intro, 'intro -> lamp town'); await shot('03-town-after-intro');
  // 詰所へ
  await page.evaluate(() => { __rpg.Field.enter('hall', 6, 3, 'up', true); __rpg.G.fadeLevel = 0; TT.run(5); __rpg.SCRIPTS && 0; });
  await page.evaluate(() => { TT.press('a'); TT.run(2); }); await shot('04-hall-talk');
  await page.evaluate(() => TT.flush());
  s = await st(); check(s.flags.quest, 'keeper gives quest');
  // 回廊のボスへ
  await page.evaluate(() => { __rpg.Field.enter('ruins', 14, 16, 'down', true); __rpg.G.fadeLevel = 0; __rpg.G.debug.noEnc = true; TT.run(5); });
  await page.evaluate(() => { TT.walk(['down']); TT.run(5); }); await shot('05-boss-talk');
  await page.evaluate(() => { __rpg.G.auto = true; let i = 0; while (__rpg.G.script && i++ < 20000) { if (__rpg.G.scene === __rpg.Field && __rpg.G.dialog) TT.press('a'); else { __rpg.step(); } if (__rpg.G.scene !== __rpg.Field && i % 600 === 0 && i < 1) 0; } });
  s = await st(); console.log('after boss', JSON.stringify(s));
  await shot('06-end');
  check(s.flags.ruinsBoss && s.party.includes('lina'), 'boss defeated, Selene joined');
  console.log(errors.length ? errors.join('\n') : 'OK no errors');
  await browser.close(); process.exit(errors.length ? 1 : 0);
})();
