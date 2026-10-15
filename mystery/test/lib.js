// shared test helpers: open the built page with a phone-sized touch viewport and drive frames by hand
const { chromium } = require(process.env.PW_PATH || 'playwright');
const path = require('path'), fs = require('fs');
const OUT = path.resolve(__dirname, '../../test-out/mystery');
fs.mkdirSync(OUT, { recursive: true });
async function open(opts = {}) {
  // use the pre-installed Chromium when the bundled one is missing
  const pre = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium'].find(f => fs.existsSync(f) && fs.statSync(f).isFile());
  let browser; try { browser = await chromium.launch(); } catch (e) { if (!pre) throw e; browser = await chromium.launch({ executablePath: pre }); }
  const page = await browser.newPage(opts.desktop ? { viewport: { width: 1280, height: 900 } } : { viewport: { width: 420, height: 860 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + e.stack));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForFunction(() => window.__nm && window.__nm.G.scene, null, { timeout: 8000 });
  await page.evaluate(REALTIME => {
    window.__manual = !REALTIME;
    const N = window.__nm;
    window.TT = {
      run(n) { for (let i = 0; i < n; i++) N.step(); },
      press(k, hold = 1) { N.Input.down[k] = true; for (let i = 0; i < hold; i++) N.step(); N.Input.down[k] = false; N.step(); N.step(); },
      // hold keys until the game starts acting on them (or give up)
      hold(keys, max = 12) { N.step(); for (const k of keys) N.Input.down[k] = true; let i = 0; while (!N.G.busy && i++ < max) N.step(); for (const k of keys) N.Input.down[k] = false; },
      idle(max = 600) { let i = 0; while ((N.G.busy || !N.settled(N.G.p)) && i++ < max) N.step(); },
    };
  }, !!opts.realtime);
  const shot = async n => { await page.evaluate(() => __nm.render()); await page.screenshot({ path: `${OUT}/${n}.png` }); };
  return { browser, page, errors, shot };
}
module.exports = { open, OUT };
