require('fs').mkdirSync('test-out/shots', { recursive: true }); require('fs').mkdirSync('test-out/g', { recursive: true });
const { chromium } = require(process.env.PW_PATH || 'playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForFunction(() => window.__rpg && window.__rpg.G.scene);
  await page.evaluate(() => { window.__manual = true; });
  await page.addScriptTag({ path: path.resolve(__dirname, 'bot.js') });
  const res = await page.evaluate(() => {
    const R = __rpg, G = R.G; R.setSeed(99); R.newGame(); BOT.settle(); G.debug.noEnc = true;
    function setup(members, lv, gear, inv) {
      G.party = members.map(id => { const m = { id, lv, exp: R.expAt(lv), weapon: gear[id][0], armor: gear[id][1], poison: false, hp: 1, mp: 1 }; const s = R.stats(m); m.hp = s.maxhp; m.mp = s.maxmp; return m; });
      G.inv = { ...inv };
    }
    function fight(ids, boss) {
      let result = null; const t0 = BOT.stats.frames;
      R.startBattle({ ids, boss, music: 'battle' }, r => { result = r; });
      BOT.battleLoop();
      if (G.scene === R.GameOver) { result = 'lose'; G.scene = R.Field; G.script = null; }
      for (let i = 0; i < 40 && R.transitioning(); i++) R.step();
      const hp = G.party.reduce((s, m) => s + m.hp, 0) / G.party.reduce((s, m) => s + R.stats(m).maxhp, 0);
      return { result, frames: BOT.stats.frames - t0, hp };
    }
    const out = [];
    const scen = (label, members, lvls, gear, inv, ids, boss, n) => {
      for (const lv of lvls) {
        let w = 0, fr = 0, hp = 0;
        for (let i = 0; i < n; i++) { setup(members, lv, gear, inv); const r = fight(ids, boss); if (r.result === 'win') { w++; hp += r.hp; } fr += r.frames; }
        out.push(`${label} lv${lv}: win ${w}/${n}  avgFrames ${Math.round(fr / n)}  hpLeft ${(w ? hp / w * 100 : 0).toFixed(0)}%`);
      }
    };
    const early = { allen: ['iron', 'chain'], lina: ['oakstaff', 'cloth'] };
    const mid = { allen: ['iron', 'chain'], lina: ['sage', 'silk'], kai: ['dagger', 'cloth'], zek: ['wizard', 'cloth'] };
    const mid2 = { allen: ['mythril', 'chain'], lina: ['cleric', 'silk'], kai: ['mdagger', 'chain'], zek: ['wizard', 'silk'] };
    const late = { allen: ['rune', 'mmail'], lina: ['sage', 'srobe'], kai: ['assassin', 'mmail'], zek: ['wizard', 'srobe'] };
    const late0 = { allen: ['rune', 'chain'], lina: ['sage', 'silk'], kai: ['assassin', 'chain'], zek: ['wizard', 'silk'] };
    const inv1 = { potion: 6, phoenix: 2, antidote: 2 };
    const inv2 = { potion: 6, hipotion: 3, phoenix: 2, ether: 3, antidote: 2 };
    //scen('north mob (A+L)', ['allen', 'lina'], [1, 2, 3], { allen: ['copper', 'cloth'], lina: ['oakstaff', 'cloth'] }, { potion: 3 }, ['goblin', 'slime'], false, 15);
    //scen('cave mob (A+L)', ['allen', 'lina'], [3, 4, 5], early, inv1, ['goblin', 'goblin', 'bat'], false, 15);
    //scen('cave skel (A+L)', ['allen', 'lina'], [3, 4, 5], early, inv1, ['skeleton', 'bat'], false, 15);
    scen('GOBLIN KING', ['allen', 'lina'], [4, 5, 6, 7], early, inv1, ['gking'], true, 20);
    scen('south mob', ['allen', 'lina', 'kai', 'zek'], [6, 7, 8], { allen: ['iron', 'chain'], lina: ['oakstaff', 'cloth'], kai: ['dagger', 'cloth'], zek: ['oakstaff', 'cloth'] }, inv1, ['wolf', 'wolf', 'bee'], false, 15);
    scen('tower1 mob', ['allen', 'lina', 'kai', 'zek'], [8, 9, 10], mid, inv2, ['golem', 'darkmage'], false, 15);
    scen('GUARDIAN', ['allen', 'lina', 'kai', 'zek'], [9, 10, 11], mid, inv2, ['guardian'], true, 20);
    scen('GUARDIAN mythril', ['allen', 'lina', 'kai', 'zek'], [9, 10], mid2, inv2, ['guardian'], true, 20);
    scen('tower2 mob', ['allen', 'lina', 'kai', 'zek'], [11, 12], late0, inv2, ['armor', 'darkmage'], false, 15);
    scen('GARVA', ['allen', 'lina', 'kai', 'zek'], [11, 12, 13, 14], late0, inv2, ['garva'], true, 20);
    scen('TEMPEST', ['allen', 'lina', 'kai', 'zek'], [13, 14, 15, 16], late, inv2, ['tempest'], true, 20);
    scen('shrine mob', ['allen', 'lina', 'kai', 'zek'], [10, 12], late0, inv2, ['hellhound', 'windslime'], false, 15);
        scen('GARVA full gear', ['allen', 'lina', 'kai', 'zek'], [12, 13], late, inv2, ['garva'], true, 20);
    return out;
  });
  console.log(res.join('\n'));
  console.log('ERRORS', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
