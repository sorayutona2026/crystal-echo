// full playthrough by a keyboard-driven bot: title -> ch1..3 -> ending.  SEED=n node test/play.js
const { launch, open, st } = require('./lib');
const { press, sleep, botStep } = require('./bot');
const SEED = +(process.env.SEED || 1);
(async () => {
  const t0 = Date.now(), b = await launch(); const { page, errors } = await open(b, { query: '?seed=' + SEED });
  await page.evaluate(s => { __tac.seed(s); __tac.speed(10); }, SEED);
  let retries = 0, lastScene = '', battles = 0, actions = 0;
  for (let guard = 0; guard < 20000; guard++) {
    const s = await st(page);
    if (s.scene !== lastScene) { console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s] scene=${s.scene} ch=${s.chIdx + 1} turn=${s.turn}`); lastScene = s.scene; }
    if (s.scene === 'ending') {
      await sleep(200);
      if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
      const f = await st(page); console.log('retries:', retries, 'seed:', SEED);
      console.log('COMPLETE'); await b.close(); return;
    }
    if (s.scene === 'battle') { const cont = await botStep(page); actions++; if (!cont) await sleep(50); if (s.turn > 40) throw new Error('turn limit'); continue; }
    if (s.scene === 'gameover') { retries++; if (retries > 6) throw new Error('too many defeats'); console.log('  defeated -> retry'); await press(page, 'z'); await sleep(100); continue; }
    if (s.scene === 'title') { await press(page, 'z'); await sleep(100); continue; }
    await press(page, 'z'); await sleep(25);
  }
  throw new Error('guard exhausted');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
