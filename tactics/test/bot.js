// keyboard-driven bot helpers shared by play.js and shots.js
const { st } = require('./lib');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function press(page, key, n) { for (let i = 0; i < (n === undefined ? 1 : n); i++) await page.keyboard.press(key); }
async function waitState(page, fn, arg, timeout) { await page.waitForFunction(fn, arg, { timeout: timeout || 20000, polling: 15 }); }
async function waitReady(page, timeout) { // like waitState(ready) but reads any mid-battle talk that pops up
  const t0 = Date.now(); for (;;) { const s = await st(page); if (s.ready) return; if (s.dlg || s.lvl) await press(page, 'z'); if (Date.now() - t0 > (timeout || 20000)) throw new Error('waitReady timeout ' + JSON.stringify({ mode: s.mode, busy: s.busy, dlg: s.dlg, scene: s.scene })); await sleep(20); }
}
async function clearDlg(page) { for (let i = 0; i < 60 && (await st(page)).dlg; i++) { await press(page, 'z'); await sleep(40); } }
async function cursorTo(page, x, y) {
  for (let tries = 0; tries < 4; tries++) {
    await clearDlg(page); const s = await st(page), dx = x - s.cursor.x, dy = y - s.cursor.y; if (!dx && !dy) return;
    if (dx) await press(page, dx > 0 ? 'ArrowRight' : 'ArrowLeft', Math.abs(dx));
    if (dy) await press(page, dy > 0 ? 'ArrowDown' : 'ArrowUp', Math.abs(dy));
    await sleep(15);
  }
  const s = await st(page); if (s.cursor.x !== x || s.cursor.y !== y) throw new Error('cursor stuck at ' + JSON.stringify(s.cursor) + ' want ' + x + ',' + y + ' mode=' + s.mode + ' ready=' + s.ready + ' busy=' + s.busy);
}
async function waitMode(page, mode) {
  await clearDlg(page);
  try { await waitState(page, m => { const s = __tac.state(); return s.mode === m && s.ready; }, mode, 8000); }
  catch (e) { const s = await st(page); throw new Error('waitMode ' + mode + ' failed; state mode=' + s.mode + ' ready=' + s.ready + ' busy=' + s.busy + ' scene=' + s.scene + ' cursor=' + JSON.stringify(s.cursor) + ' menu=' + JSON.stringify(s.menu)); }
}
// stopAt: 'select' | 'move' | 'menu' | 'target' | 'forecast' | undefined (full action)
async function doAction(page, sug, stopAt) {
  await waitReady(page);
  await cursorTo(page, sug.from.x, sug.from.y); await press(page, 'z'); await waitMode(page, 'move');
  if (stopAt === 'select') return;
  await cursorTo(page, sug.dest.x, sug.dest.y); if (stopAt === 'move') return;
  await press(page, 'z'); await waitMode(page, 'menu');
  if (stopAt === 'menu') return;
  const s = await st(page); const want = sug.sp ? sug.spLabel : sug.kind === 'escape' ? '離脱' : sug.kind === 'talk' ? '話す' : sug.kind === 'item' ? '道具' : sug.target ? (sug.kind === 'heal' ? '回復' : '攻撃') : '待機';
  const i = s.menu.items.findIndex(x => x.label === want); if (i < 0 || s.menu.items[i].off) throw new Error('menu item unavailable: ' + want + ' ' + JSON.stringify(s.menu));
  await press(page, 'ArrowDown', i - s.menu.idx); await press(page, 'z');
  const acted = () => waitState(page, id => { const s = __tac.state(); const u = s.units.find(x => x.id === id); return !u || u.acted || s.over; }, sug.unit);
  if (sug.kind === 'item') { await waitMode(page, 'menu'); const m = await st(page); await press(page, 'ArrowDown', sug.opt.item - m.menu.idx); await press(page, 'z'); await acted(); return; }
  if (sug.kind === 'talk') { for (let i = 0; i < 400; i++) { const q = await st(page); const u = q.units.find(x => x.id === sug.unit); if (!u || u.acted || q.over) break; if (q.dlg) await press(page, 'z'); await sleep(15); } return; }
  if (!sug.target) { await acted(); return; } // wait or an instant special
  await waitMode(page, 'target');
  const t = await st(page), ti = t.targets.indexOf(sug.target); if (ti < 0) throw new Error('target not in list');
  await press(page, 'ArrowRight', (ti - t.ti + t.targets.length) % t.targets.length);
  await press(page, 'z');
  if (sug.kind === 'heal') { await acted(); return; }
  await waitMode(page, 'forecast'); if (stopAt === 'forecast') return;
  await press(page, 'z'); await acted();
}
async function settle(page) { // wait until the player may act again, closing level-up popups
  for (let i = 0; i < 4000; i++) {
    const s = await st(page);
    if (s.lvl || s.dlg) { await press(page, 'z'); await sleep(20); continue; }
    if (s.scene !== 'battle' || s.over) return s;
    if (s.ready) return s;
    await sleep(15);
  }
  throw new Error('settle timeout ' + JSON.stringify(await st(page)).slice(0, 600));
}
async function endTurn(page) {
  for (let i = 0; i < 6; i++) {
    await waitReady(page); await press(page, 'e');
    try { await waitState(page, () => { const s = __tac.state(); return s.mode === 'sysmenu' && s.ready; }, null, 1500); } catch (e) { continue; }
    await press(page, 'z'); return;
  }
  throw new Error('could not open the end-turn menu');
}
// one bot step during a battle; returns false when the battle scene is over
async function botStep(page) {
  const s = await settle(page); if (s.scene !== 'battle' || s.over) return false;
  const sug = await page.evaluate(() => __tac.suggest());
  if (!sug || sug.end) { await endTurn(page); return true; }
  await doAction(page, sug); return true;
}
module.exports = { sleep, press, cursorTo, waitMode, waitState, doAction, settle, endTurn, botStep };
