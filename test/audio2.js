require('fs').mkdirSync('test-out/shots', { recursive: true }); require('fs').mkdirSync('test-out/g', { recursive: true });
const { chromium } = require(process.env.PW_PATH || 'playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForFunction(() => window.__rpg && window.__rpg.G.scene);
  await page.click('#mute'); await page.click('#mute');
  const r = await page.evaluate(async () => {
    const an = Audio8.ac.createAnalyser(); an.fftSize = 2048; Audio8.master.connect(an);
    const res = {};
    for (const k of ['title', 'field', 'battle', 'boss']) {
      Audio8.play(k); let peak = 0, sum = 0, n = 0; const buf = new Float32Array(2048);
      for (let i = 0; i < 20; i++) { await new Promise(r => setTimeout(r, 100)); an.getFloatTimeDomainData(buf); for (const v of buf) { peak = Math.max(peak, Math.abs(v)); sum += v * v; n++; } }
      res[k] = { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / n).toFixed(3) };
    }
    return res;
  });
  console.log(JSON.stringify(r));
  await browser.close();
})();
