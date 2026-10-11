// headless balance simulation: node test/sim.js [runs]  (loads the pure-logic sources; no browser)
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = ['engine.js', 'data.js', 'battle.js', 'ai.js'].map(f => fs.readFileSync(path.join(__dirname, '../src', f), 'utf8')).join('\n');
const ctx = vm.createContext({ console });
vm.runInContext(src + '\nthis.API={seedRng,rnd,CHAPTERS,newRoster,prepareChapter,cloneRoster,alive,chooseAction,suggestAction,applyAction,startPhase,chapterBonus,checkOver,STATS};', ctx);
const A = ctx.API;
const spUse = {};
// map sanity: every 'P' tile has a prop entry and vice versa; no unit starts on a blocking tile
vm.runInContext('this.TERR = TERRAIN;', ctx);
A.CHAPTERS.forEach((c, i) => {
  c.map.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === 'P' && !(c.props || {})[x + ',' + y]) throw new Error('ch' + (i + 1) + ': P without prop at ' + x + ',' + y); });
  for (const k in c.props || {}) { const [x, y] = k.split(',').map(Number); if (c.map[y][x] !== 'P') throw new Error('ch' + (i + 1) + ': prop ' + k + ' not on a P tile'); }
  for (const [id, x, y] of c.party.concat(c.enemies.map(e => [e[0], e[1], e[2]]))) if (ctx.TERR[c.map[y][x]].block) throw new Error('ch' + (i + 1) + ': ' + id + ' starts on a blocking tile');
});
function playChapter(roster, idx, log) {
  const S = A.prepareChapter(roster, idx); let turns = 0;
  while (!S.over && turns < 40) {
    // player phase
    A.startPhase(S, 0);
    for (let guard = 0; guard < 20 && !S.over; guard++) { const a = A.suggestAction(S); if (!a) break; if (a.sp) spUse[a.unit.key] = (spUse[a.unit.key] || 0) + 1; A.applyAction(S, a.unit, a.dest, a.target, a.sp); }
    if (S.over) break;
    A.startPhase(S, 1);
    for (const e of A.alive(S).filter(u => u.team === 1)) { if (S.over || e.dead) continue; const a = A.chooseAction(S, e, {}); A.applyAction(S, e, a.dest, a.target); }
    S.turn++; turns++;
  }
  return { S, turns };
}
const runs = +process.argv[2] || 40; const res = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; let full = 0; const lv = [[], [], []]; const hpLeft = [[], [], []], lost = [[], [], []];
for (let seed = 1; seed <= runs; seed++) {
  A.seedRng(seed * 7919); let roster = A.newRoster(), done = true;
  for (let i = 0; i < 3; i++) {
    let won = false;
    for (let tries = 0; tries < 4 && !won; tries++) {
      const snap = A.cloneRoster(roster), r = playChapter(snap, i);
      res[i][0]++;
      if (r.S.over === 'win') { won = true; res[i][1]++; A.chapterBonus(snap, r.S); roster = snap; const us = A.alive(r.S).filter(u => u.team === 0); hpLeft[i].push(us.reduce((a, u) => a + u.hp / u.maxhp, 0) / us.length); lost[i].push(Object.keys(snap).length - us.length); lv[i].push(Math.round(Object.values(snap).reduce((a, u) => a + u.lv, 0) / Object.keys(snap).length * 10) / 10); }
      else { res[i][2] += (r.S.over === 'lose') ? 1 : 0; }
    }
    if (!won) { done = false; break; }
  }
  if (done) full++;
}
const avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : '-';
for (let i = 0; i < 3; i++) console.log('ch' + (i + 1), 'attempts', res[i][0], 'wins', res[i][1], 'avg lv', avg(lv[i]), 'avg hp% left', avg(hpLeft[i]), 'avg dead', avg(lost[i]));
console.log('special uses', JSON.stringify(spUse));
console.log('full clears', full + '/' + runs);
