// 実際のゲーム内で Tone.js の音楽が動くか:再生開始・曲の切り替え・ミュート・ファンファーレ後に元の曲へ戻る
const { chromium } = require(process.env.PW_PATH || 'playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 420, height: 860 }, hasTouch: true }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve(__dirname, 'index.html')); await p.waitForFunction(() => window.__rpg && window.__rpg.G.scene); await p.waitForTimeout(300);
  const st = () => p.evaluate(() => ({ ready: ToneMusic.ready, cur: Audio8.cur, state: Tone.getTransport().state, mute: Tone.getDestination().mute, parts: !!ToneMusic.part }));
  const log = []; const chk = (c, m) => { if (!c) errs.push('FAIL: ' + m); log.push((c ? 'ok  ' : 'NG  ') + m); };
  await p.evaluate(() => Audio8.unlock()); await p.waitForTimeout(1500);
  let s = await st(); chk(s.ready && s.cur === 'title' && s.state === 'started', 'タイトル曲が始まる ' + JSON.stringify(s));
  await p.evaluate(() => Audio8.play('town')); await p.waitForTimeout(300); s = await st(); chk(s.cur === 'town' && s.state === 'started', '街の曲へ切り替え');
  await p.evaluate(() => Audio8.setMuted(true)); s = await st(); chk(s.mute === true, 'ミュートで消音');
  await p.evaluate(() => Audio8.setMuted(false)); s = await st(); chk(s.mute === false, 'ミュート解除');
  await p.evaluate(() => Audio8.play('fanfare', 'dungeon')); await p.waitForTimeout(10000); s = await st(); chk(s.cur === 'dungeon', 'ファンファーレのあと元の曲へ戻る (cur=' + s.cur + ')');
  await p.evaluate(() => Audio8.stop()); s = await st(); chk(s.cur === null, '停止');
  console.log(log.join('\n')); console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close(); process.exit(errs.length ? 1 : 0);
})();
