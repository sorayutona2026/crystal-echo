// ===================== MAIN LOOP =====================
function step() {
  Input.update(); G.frame++;
  G.scene.update();
  if (G.fadeIn) { G.fade = Math.max(0, G.fade - 0.05); if (!G.fade) G.fadeIn = false; }
  if (G.flash > 0) G.flash--;
  if (G.shake > 0) G.shake--;
}
function render() {
  Touch.rects.length = 0;
  resetT();
  G.scene.draw(); resetT(); drawSwipe();
  if (G.flash > 0) { ctx.fillStyle = `rgba(255,250,210,${Math.min(0.6, G.flash / 10)})`; ctx.fillRect(0, 0, SW, SH); }
  if (G.fade > 0) { ctx.fillStyle = `rgba(4,2,10,${G.fade})`; ctx.fillRect(0, 0, SW, SH); }
}
let last = 0, acc = 0, booted = false;
function loop(ts) {
  requestAnimationFrame(loop);
  if (window.__manual) return;
  if (!last) last = ts; acc += Math.min(100, ts - last); last = ts;
  let n = 0; while (acc >= 1000 / 60 && n < 4) { step(); acc -= 1000 / 60; n++; }
  if (n) render();
}
function boot() {
  if (booted) return; booted = true;
  buildTiles(); buildHero(); buildMonsters(); buildItems();
  const b = Number(Store.get('nemuri-best')); if (b) G.best = b;
  if (Store.get('nemuri-mute') === '1') { Audio8.muted = true; const el = document.getElementById('mute'); if (el) el.textContent = '♪ OFF'; }
  fit(); Title.start();
  requestAnimationFrame(loop);
}
// remember the deepest floor reached
setInterval(() => { if (G.best) Store.set('nemuri-best', String(G.best)); }, 2000);
// debug / test hooks
window.__nm = { G, step, render, newGame, enterFloor, setSeed, Input, Dungeon, Title, Intro, GameOver, Clear, MONSTERS, ITEMS, MW, MH,
  canStep, passable, areaAt, distField, spawnMonster, dropItem, settled, inMenu };
const fontReady = (document.fonts && document.fonts.load) ? Promise.race([
  Promise.all([document.fonts.load('500 24px "Zen Kaku Gothic New"', GLYPHS), document.fonts.load('700 24px "Shippori Mincho B1"', GLYPHS)]),
  new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
fontReady.catch(() => { }).then(boot);
