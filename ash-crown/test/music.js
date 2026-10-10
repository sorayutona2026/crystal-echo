// 曲データの検算:メロディの長さ=和音数×8、音名が読めること、実際に譜面が組めること
const { chromium } = require(process.env.PW_PATH || 'playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, 'index.html')); await p.waitForTimeout(800);
  const r = await p.evaluate(() => { const out = {}; for (const k of ['town', 'dungeon', 'boss', 'title']) { const t = TRACKS[k]; const mel = t.mel.split(/\s+/).filter(Boolean); const bad = mel.filter(x => x !== '-' && x !== '.' && noteMidi(x) == null); const s = Audio8.build(t); out[k] = { mel: mel.length, want: t.chords.split(' ').length * 8, bad, events: s.evs.length }; } return out; });
  console.log(JSON.stringify(r)); const ok = Object.values(r).every(v => v.mel === v.want && !v.bad.length) && !errs.length;
  console.log(ok ? 'OK' : 'FAIL ' + errs.join()); await b.close(); process.exit(ok ? 0 : 1);
})();
