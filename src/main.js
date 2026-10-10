// ===================== MAIN LOOP =====================
function step() {
  Input.update(); G.frame++;
  if (G.scene === Battle && B && Input.pressed.menu) { G.auto = !G.auto; Store.set('crystal-echo-auto', G.auto ? '1' : ''); Audio8.sfx(G.auto ? 'ok' : 'cancel'); }
  if (!transitionCb) G.scene.update(); else if (G.scene === Battle) Battle.update();
  if (G.scene === Battle && G.auto && B && !transitionCb && !B.waitKey && !B.menu) Battle.update(); // auto battles run at double speed
  updateFade();
  if (G.flash > 0) G.flash--;
  if (G.shake > 0) G.shake--;
}
function render() {
  Touch.rects.length = 0;
  resetT();
  G.scene.draw(); resetT(); drawSwipe();
  if (G.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(1, G.flash / 20)})`; ctx.fillRect(0, 0, SW, SH); }
  if (G.fadeLevel > 0) {
    if (G.scene === Field && Field.ps && !G.narr && G.fadeLevel < 1) { // iris wipe centred on the player
      const r = Math.pow(1 - G.fadeLevel, 1.4) * 200; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.rect(0, 0, SW, SH); ctx.arc(Field.ps.x, Field.ps.y, Math.max(0.1, r), 0, Math.PI * 2, true); ctx.fill('evenodd');
      ctx.strokeStyle = `rgba(240,207,134,${0.5 * (1 - G.fadeLevel)})`; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(Field.ps.x, Field.ps.y, Math.max(0.1, r), 0, Math.PI * 2); ctx.stroke();
    } else { ctx.fillStyle = `rgba(0,0,0,${G.fadeLevel})`; ctx.fillRect(0, 0, SW, SH); }
  }
  if (G.scene === Field) { resetT(); drawDialog(); }
}
let last = 0, acc = 0, booted = false;
function loop(ts) {
  requestAnimationFrame(loop);
  if (window.__manual) return;
  if (!last) last = ts; acc += Math.min(100, ts - last); last = ts;
  let n = 0; while (acc >= 1000 / 60 && n < 4) { step(); acc -= 1000 / 60; n++; }
  if (n) {
    const t0 = performance.now(); render(); const dt = performance.now() - t0;
    // adaptive quality: keep slower phones smooth
    perfAvg = perfAvg * 0.95 + dt * 0.05; perfN++;
    if (perfN > 90 && perfAvg > 13 && QUALITY.level > 0) { QUALITY.level--; perfN = 0; perfAvg = 8; }
    else if (perfN > 600 && perfAvg < 5 && QUALITY.level < 2) { QUALITY.level++; perfN = 0; }
  }
}
let perfAvg = 8, perfN = 0;
function boot(saved) {
  if (booted) return; booted = true;
  buildTiles(); buildTallSprites(); buildChars(); buildHeroBattle(); buildEnemyArt(); buildMaps(); loadOverrides();
  fit(); G.auto = Store.get('crystal-echo-auto') === '1';
  if (saved && saved.party) { try { applySnapshot(saved); } catch (e) { Title.start(); } } else Title.start();
  requestAnimationFrame(loop);
}
// debug / test hooks
window.__rpg = { G, get B() { return B; }, MAPS: () => MAPS, Field, Battle, BMenu, Menu, Shop, Title, SCRIPTS, ENEMIES, ITEMS, SKILLS, HEROES, FORMATIONS, TILESETS,
  SPARKLES, newGame, startBattle, BattleTrans, GameOver, Ending, transitioning: () => !!transitionCb, stats, gainExp, joinParty, saveGame, loadGame, snapshot, setSeed, step, render, Input, expAt, addItem, healAll };
const fontReady = (document.fonts && document.fonts.load) ? Promise.race([
  Promise.all([document.fonts.load('500 24px "Zen Kaku Gothic New"', GLYPHS), document.fonts.load('800 24px "Zen Kaku Gothic New"', '0123456789MISFULCREAT'), document.fonts.load('700 24px "Shippori Mincho B1"', GLYPHS), document.fonts.load('800 24px "Shippori Mincho B1"', 'CRYSTAL ECHO')]),
  new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
const hot = window.claude && window.claude.hot;
if (hot && hot.snapshot) hot.snapshot(() => (G.scene === Field && !G.script) ? snapshot() : null);
fontReady.catch(() => { }).then(() => { if (hot && hot.ready) hot.ready(boot); else boot(hot && hot.data); });
// edge smoothing on/off, remembered
(function () {
  const btn = document.getElementById('smoothToggle'); if (!btn) return;
  const label = () => { btn.textContent = 'なめらか ' + (QUALITY.smooth === '1' ? 'ON' : 'OFF'); };
  btn.addEventListener('click', e => { QUALITY.smooth = QUALITY.smooth === '1' ? '0' : '1'; Store.set('crystal-echo-smooth', QUALITY.smooth); label(); e.currentTarget.blur(); });
  label();
})();
