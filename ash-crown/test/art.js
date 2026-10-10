// 主人公の絵(会話・戦闘・フィールド)を1枚に並べて保存する
const { chromium } = require(process.env.PW_PATH || 'playwright'); const path = require('path'), fs = require('fs');
const OUT = path.resolve(__dirname, '../test-out'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 900, height: 720 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, 'index.html')); await p.waitForFunction(() => window.__rpg && window.__rpg.G.scene); await p.waitForTimeout(600);
  await p.evaluate(() => {
    document.body.innerHTML = ''; document.body.style.background = '#2a2030';
    const c = document.createElement('canvas'); c.width = 880; c.height = 700; c.id = 'sheet'; document.body.appendChild(c); const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.fillStyle = '#2a2030'; x.fillRect(0, 0, 880, 700);
    const ids = ['allen', 'lina'];
    ids.forEach((id, i) => {
      const ox = 20 + i * 440;
      x.drawImage(animeOf(id, false), ox, 10, 192, 192); x.drawImage(animeOf(id, true), ox + 200, 10, 192, 192);
      for (const [k, pose] of [['idle', 0], ['strike', 1], ['cast', 2], ['hurt', 3]]) { const im = hdHero(id, k); x.drawImage(im, ox + pose * 105, 220, 96, 120); }
      const s = SPR[id]; ['down', 'up', 'left', 'right'].forEach((d, j) => { for (let f = 0; f < 2; f++) x.drawImage(s[d][f], ox + (j * 2 + f) * 52, 360, 48, 48); });
    });
  });
  await p.locator('#sheet').screenshot({ path: path.join(OUT, 'heroes.png') });
  console.log(errs.length ? errs.join() : 'saved'); await b.close();
})();
