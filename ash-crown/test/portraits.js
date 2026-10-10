// 会話画面で顔の絵が出ているか(絵が置いてあれば絵が、なければコードの絵が出る)を確認して画像に保存
const { chromium } = require(process.env.PW_PATH || 'playwright'); const path = require('path'), fs = require('fs');
const OUT = path.resolve(__dirname, '../test-out'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 420, height: 520 }, deviceScaleFactor: 2 }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, 'index.html')); await p.waitForFunction(() => window.__rpg && window.__rpg.G.scene); await p.waitForTimeout(800);
  await p.evaluate(() => { window.__manual = true; __rpg.setSeed(1); __rpg.newGame(); const R = __rpg; for (let i = 0; i < 5; i++) R.step(); R.G.script = null; R.G.narr = null; R.G.fadeLevel = 0; R.G.fadeTarget = 0; R.Field.enter('lamp', 12, 12, 'up', true); for (let i = 0; i < 5; i++) R.step(); });
  const lines = [['カイン', '……また、火が細くなってる。'], ['カイン', 'ありがとう。\nあなたの火は、あたたかいな!'], ['セレネ', '……だれ?\nここに、来ないで。'], ['セレネ', 'よかった、無事で!'], ['火守長', '来たか、カイン。\n……おまえの火は、あと三年ももたん。'], ['衛兵長', '燈火の外は灰喰いの縄張りだ。\n先に詰所で話を聞いてこい。']];
  const names = ['allen', 'allen_smile', 'lina', 'lina_smile', 'keeper', 'captain'];
  for (let i = 0; i < lines.length; i++) {
    await p.evaluate(([who, t]) => { const R = __rpg; R.G.script = null; R.G.dialog = null; R.G.party = [R.G.party[0]]; runScript(function* () { yield* say(t, who); }); for (let k = 0; k < 6; k++) R.step(); R.G.dialog.shown = 999; for (let k = 0; k < 3; k++) R.step(); R.render(); }, lines[i]);
    await p.locator('canvas').first().screenshot({ path: path.join(OUT, `portrait-${i + 1}-${names[i]}.png`) });
  }
  console.log(errs.length ? errs.join() : 'saved'); await b.close(); process.exit(errs.length ? 1 : 0);
})();
