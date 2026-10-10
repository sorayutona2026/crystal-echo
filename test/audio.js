require('fs').mkdirSync('test-out/shots', { recursive: true }); require('fs').mkdirSync('test-out/g', { recursive: true });
const { chromium } = require(process.env.PW_PATH || 'playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|Failed to load/.test(m.text())) errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForFunction(() => window.__rpg && window.__rpg.G.scene);
  await page.click('#mute'); await page.click('#mute');
  const info = await page.evaluate(async () => {
    const out = [];
    out.push('ctx state ' + (Audio8.ac && Audio8.ac.state));
    for (const k in TRACKS) { const t = TRACKS[k]; const mel = t.mel.split(/\s+/).filter(Boolean); const bad = mel.filter(x => x !== '-' && x !== '.' && noteMidi(x) == null); out.push(`${k}: mel ${mel.length} chords*8 ${t.chords.split(' ').length * 8}${bad.length ? ' BAD ' + bad : ''}`); Audio8.play(k); await new Promise(r => setTimeout(r, 300)); }
    for (const s of ['cursor', 'ok', 'cancel', 'error', 'hit', 'crit', 'slash', 'fire', 'ice', 'bolt', 'heal', 'holy', 'dark', 'meteor', 'encounter', 'chest', 'levelup', 'ko', 'escape', 'steal', 'save', 'door', 'buy', 'boss', 'crystal']) Audio8.sfx(s);
    await new Promise(r => setTimeout(r, 500)); Audio8.stop();
    return out;
  });
  console.log(info.join('\n')); console.log('ERRORS', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
