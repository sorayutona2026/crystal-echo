// headless balance simulation: node test/sim.js [runs]  (loads the pure-logic sources; no browser)
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = ['engine.js', 'data.js', 'story.js', 'height.js', 'battle.js', 'camp.js', 'ai.js', 'tower.js'].map(f => fs.readFileSync(path.join(__dirname, '../src', f), 'utf8')).join('\n');
const ctx = vm.createContext({ console });
vm.runInContext(src + '\nthis.API={seedRng,rnd,CHAPTERS,TERRAIN,newRoster,newMeta,prepareChapter,cloneRoster,alive,chooseAction,suggestAction,applyAction,startPhase,endPlayerPhase,chapterBonus,finishChapter,newBattle,towerChapter,towerDefaultDeploy,towerHealParty,towerBoss,gainExp,checkOver,autoCamp,STATS,distMap,kk,DIRS4,inb,terrAt};', ctx);
const A = ctx.API, T = A.TERRAIN;
const spUse = {};
// map sanity: row lengths, props, start tiles, reachability of exits / objectives
A.CHAPTERS.forEach((c, i) => {
  const w = c.map[0].length; c.map.forEach((r, y) => { if (r.length !== w) throw new Error('ch' + (i + 1) + ' row ' + y + ' length'); for (let x = 0; x < r.length; x++) if (r[x] === 'P' && !(c.props || {})[x + ',' + y]) throw new Error('ch' + (i + 1) + ': P without prop at ' + x + ',' + y); });
  for (const k in c.props || {}) { const [x, y] = k.split(',').map(Number); if (c.map[y][x] !== 'P') throw new Error('ch' + (i + 1) + ': prop ' + k + ' not on a P tile'); }
  for (const [x, y] of c.slots.concat(c.enemies.map(e => [e[1], e[2]]), (c.exits || []), (c.chests || []).map(q => [q.x, q.y]))) if (T[c.map[y][x]].block) throw new Error('ch' + (i + 1) + ': unit/chest/exit on a blocking tile ' + x + ',' + y);
  if (c.win === 'escape') { const S = { rows: c.map, w, h: c.map.length }; const d = A.distMap(S, c.exits); for (const [x, y] of c.slots) if (!d.has(A.kk(x, y))) throw new Error('ch' + (i + 1) + ' exit unreachable from ' + x + ',' + y); console.log('ch' + (i + 1) + ' exit distance from start', c.slots.map(([x, y]) => d.get(A.kk(x, y))).join(',')); }
});
function playChapter(roster, meta, idx) { return runBattle(A.prepareChapter(roster, meta, idx)); }
function runBattle(S) {
  let turns = 0;
  while (!S.over && turns < 40) {
    A.startPhase(S, 0);
    for (let guard = 0; guard < 30 && !S.over; guard++) { const a = A.suggestAction(S); if (!a) break; if (a.sp) spUse[a.unit.key] = (spUse[a.unit.key] || 0) + 1; A.applyAction(S, a.unit, a.dest, a.target, a.sp, a.opt); }
    if (S.over) break;
    A.endPlayerPhase(S);
    A.startPhase(S, 1);
    for (const e of A.alive(S).filter(u => u.team === 1)) { if (S.over || e.dead) continue; const a = A.chooseAction(S, e, {}); if (a.sp) spUse['E_' + e.key] = (spUse['E_' + e.key] || 0) + 1; A.applyAction(S, e, a.dest, a.target, a.sp); }
    S.turn++; turns++; A.checkOver(S);
  }
  return { S, turns };
}
if (process.argv[2] === 'tower') { // node test/sim.js tower [runs] : climbs the tower from floor 1 with parties that cleared ch1 / ch3 / ch5 / ch6
  const runs = +process.argv[3] || 12, FL = [1, 5, 10, 15, 20], MAXF = 25, st = {};
  for (const clearedCh of [1, 3, 5, 6]) {
    const stat = {}; let reached = [];
    for (let seed = 1; seed <= runs; seed++) {
      A.seedRng(seed * 7919); let roster = A.newRoster(), meta = A.newMeta();
      for (let i = 0; i < clearedCh; i++) { A.autoCamp(roster, meta, i); const r = playChapter(roster, meta, i); if (r.S.over !== 'win') { A.seedRng(seed * 31 + i); i--; continue; } A.chapterBonus(roster, r.S); A.finishChapter(roster, meta, r.S, i); }
      A.autoCamp(roster, meta, Math.min(5, clearedCh)); const ids = A.towerDefaultDeploy(roster), avg0 = Math.round(ids.reduce((a, id) => a + roster[id].lv, 0) / ids.length), startLv = avg0; let f = 1, reachedF = 0, startAvg = avg0;
      for (; f <= MAXF; f++) {
        const S = A.newBattle(A.towerChapter(f, avg0, 1, ids.length), roster, meta, ids, f > 1), r = runBattle(S); const k = stat[f] = stat[f] || [0, 0, 0, 0]; k[0]++;
        k[3] += ids.reduce((a, id) => a + roster[id].lv, 0) / ids.length;
        if (S.over === 'win') { k[1]++; k[2] += ids.filter(id => roster[id].dead).length; reachedF = f; A.towerHealParty(roster, ids); } else break;
      }
      reached.push(reachedF);
    }
    console.log('-- party after ch' + clearedCh + ' (start avg lv ' + (() => { return '' })() + ') climb from floor 1, ' + runs + ' runs: best floors ' + reached.sort((a, b) => a - b).join(','));
    for (const f of FL) if (stat[f]) console.log('   floor ' + f + (A.towerBoss(f) ? ' (boss)' : '') + ': reached ' + stat[f][0] + ' won ' + stat[f][1] + ' win% ' + Math.round(100 * stat[f][1] / stat[f][0]) + ' avg party lv ' + (stat[f][3] / stat[f][0]).toFixed(1) + ' KOs/win ' + (stat[f][2] / Math.max(1, stat[f][1])).toFixed(2));
  }
  process.exit(0);
}
const runs = +process.argv[2] || 40, NC = A.CHAPTERS.length;
const res = Array.from({ length: NC }, () => [0, 0, 0]), first = Array(NC).fill(0), tried = Array(NC).fill(0); let full = 0; const lv = Array.from({ length: NC }, () => []), hpLeft = Array.from({ length: NC }, () => []), lost = Array.from({ length: NC }, () => []), why = {};
for (let seed = 1; seed <= runs; seed++) {
  A.seedRng(seed * 7919); let roster = A.newRoster(), meta = A.newMeta(), done = true;
  for (let i = 0; i < NC; i++) {
    let won = false;
    for (let tries = 0; tries < 4 && !won; tries++) {
      const sr = A.cloneRoster(roster), sm = JSON.parse(JSON.stringify(meta));
      A.autoCamp(sr, sm, i);
      const r = playChapter(sr, sm, i);
      res[i][0]++; if (tries === 0) tried[i]++;
      if (r.S.over === 'win') {
        won = true; res[i][1]++; if (tries === 0) first[i]++; A.chapterBonus(sr, r.S);
        const us = Object.values(sr).filter(u => u.deployed && !u.dead); hpLeft[i].push(us.reduce((a, u) => a + u.hp / u.maxhp, 0) / Math.max(1, us.length));
        lost[i].push(Object.values(sr).filter(u => u.deployed && u.dead).length);
        A.finishChapter(sr, sm, r.S, i); roster = sr; meta = sm; lv[i].push(Math.round(Object.values(sr).reduce((a, u) => a + u.lv, 0) / Object.keys(sr).length * 10) / 10);
      } else { res[i][2]++; why[i + ':' + r.S.why] = (why[i + ':' + r.S.why] || 0) + 1; }
    }
    if (!won) { done = false; break; }
  }
  if (done) full++;
}
const avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : '-';
for (let i = 0; i < NC; i++) console.log('ch' + (i + 1), 'attempts', res[i][0], 'wins', res[i][1], 'win% ' + Math.round(100 * res[i][1] / Math.max(1, res[i][0])), 'first-try% ' + Math.round(100 * first[i] / Math.max(1, tried[i])), 'avg lv', avg(lv[i]), 'hp% left', avg(hpLeft[i]), 'avg dead', avg(lost[i]));
console.log('lose reasons', JSON.stringify(why)); console.log('special uses', JSON.stringify(spUse));
console.log('full clears', full + '/' + runs);
