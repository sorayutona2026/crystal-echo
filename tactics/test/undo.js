// undo + danger-zone test: attack, undo (state + RNG restored, uses decrease), danger toggle (key D) tints tiles
const { launch, open, st } = require('./lib');
const { press, sleep, waitState, doAction, settle, cursorTo } = require('./bot');
(async () => {
  const b = await launch(); const { page, errors } = await open(b, { query: '?seed=5' });
  await page.evaluate(() => { __tac.setAuto(false); __tac.speed(10); __tac.start(0); });
  await waitState(page, () => __tac.state().scene === 'battle' && __tac.state().ready);
  await page.evaluate(() => __tac.speed(10));
  const snap = s => JSON.stringify({ u: s.units.map(u => [u.id, u.x, u.y, u.hp, u.acted, u.dead, u.exp, u.lv]), seed: s.seed });
  // danger zone
  let s0 = await st(page); if (s0.danger) throw new Error('danger should start off');
  await press(page, 'd'); await sleep(100); let s1 = await st(page); if (!s1.danger || !(s1.dangerN > 0)) throw new Error('danger on failed ' + s1.dangerN);
  await press(page, 'd'); await sleep(100); if ((await st(page)).danger) throw new Error('danger off failed'); console.log('danger zone OK, tiles', s1.dangerN);
  // undo: take any suggested action that attacks if possible
  await waitState(page, () => __tac.state().ready); const before = await st(page); const k0 = snap(before);
  if (before.undoLeft !== 3) throw new Error('undoLeft ' + before.undoLeft);
  const sug = await page.evaluate(() => __tac.suggest()); if (sug.end) throw new Error('no action'); await doAction(page, sug); await settle(page);
  const after = await st(page); if (snap(after) === k0) throw new Error('action changed nothing');
  await press(page, 'u'); await sleep(200); const un = await st(page);
  if (snap(un) !== k0) throw new Error('undo did not restore state\n' + k0 + '\n' + snap(un));
  if (un.undoLeft !== 2) throw new Error('undoLeft after undo ' + un.undoLeft);
  console.log('undo restored hp/pos/acted/exp/seed; uses left', un.undoLeft, 'action:', sug.kind);
  // redo the same suggestion: the RNG was restored, so the outcome is identical
  await doAction(page, sug); await settle(page); const again = await st(page); if (snap(again) !== snap(after)) throw new Error('redo outcome differs (RNG not restored)');
  console.log('redo gives identical outcome');
  if (errors.length) throw new Error('page errors: ' + errors.join(' | ')); console.log('UNDO OK'); await b.close();
})().catch(e => { console.error(e); process.exit(1); });
