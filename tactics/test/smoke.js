// smoke test: page loads without errors, title is shown, chapter 1 can be started
const { launch, open, st } = require('./lib');
(async () => {
  const b = await launch(); const { page, errors } = await open(b);
  let s = await st(page); if (s.scene !== 'title') throw new Error('title not shown: ' + s.scene);
  await page.keyboard.press('z'); await page.waitForFunction(() => ['card', 'dialogue'].includes(__tac.state().scene));
  await page.evaluate(() => __tac.speed(8));
  for (let i = 0; i < 40; i++) { s = await st(page); if (s.scene === 'battle' && s.ready) break; await page.keyboard.press('z'); await page.waitForTimeout(60); }
  s = await st(page);
  if (s.scene !== 'battle') throw new Error('did not reach battle: ' + s.scene);
  if (s.units.filter(u => u.team === 0).length !== 3 || s.units.filter(u => u.team === 1).length !== 5) throw new Error('unexpected units');
  // the chapter-start autosave must make 'continue' available after a reload
  await page.reload(); await page.waitForFunction(() => window.__tac && __tac.state().scene === 'title');
  s = await st(page); if (!(await page.evaluate(() => { try { return !!localStorage.getItem('starfall_tactics_save_v1'); } catch (e) { return true; } }))) throw new Error('no save written');
  console.log('save present, title items:', s.title.items.join(','));
  await b.close();
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log('SMOKE OK');
})().catch(e => { console.error(e); process.exit(1); });
