// shared helpers for the Playwright tests (playwright is resolved from the repo-root node_modules)
const path = require('path'), fs = require('fs');
const pw = require(require.resolve('playwright', { paths: [path.join(__dirname, '..', '..'), path.join(__dirname, '..')] }));
function chromePath() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  const cands = [];
  try { for (const d of fs.readdirSync(base)) { if (/^chromium(_headless_shell)?-\d+$/.test(d)) { const p = path.join(base, d, 'chrome-linux', d.startsWith('chromium_headless') ? 'headless_shell' : 'chrome'); if (fs.existsSync(p)) cands.push(p); } } } catch (e) { }
  cands.sort(); return cands.find(p => /chromium-\d+\/chrome-linux\/chrome$/.test(p)) || cands[0];
}
async function launch() {
  try { return await pw.chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'] }); }
  catch (e) { const p = chromePath(); if (!p) throw e; return await pw.chromium.launch({ executablePath: p, args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'] }); }
}
const URL = 'file://' + path.join(__dirname, 'index.html');
async function open(browser, opts) {
  opts = opts || {};
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 960, height: 720 }, hasTouch: !!opts.touch, isMobile: !!opts.mobile, deviceScaleFactor: opts.dsf || 1 });
  const page = await ctx.newPage(); const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(URL + (opts.query || ''));
  await page.waitForFunction(() => window.__tac && window.__tac.state().scene === 'title', null, { timeout: 15000 });
  return { ctx, page, errors };
}
const st = page => page.evaluate(() => window.__tac.state());
module.exports = { pw, launch, open, st, URL };
