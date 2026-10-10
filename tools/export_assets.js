// Dump the procedurally generated art (tiles, field sprites, battle sprites, enemies) to PNG files
// so other engines (the Godot port in godot/) can use the very same pictures.
const { chromium } = require(process.env.PW_PATH || 'playwright');
const fs = require('fs'), path = require('path');
const OUT = path.resolve(__dirname, '../godot/assets');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, '../test/index.html')); await p.waitForFunction(() => window.__rpg && __rpg.G.scene);
  const files = await p.evaluate(() => {
    const out = {}; const url = c => c.toDataURL('image/png').split(',')[1];
    for (const k in TILE_IMG) { if (k === 'fringe') continue; TILE_IMG[k].forEach((c, i) => out[`tiles/${k}_${i}.png`] = url(c)); }
    for (const k in TILE_VAR) TILE_VAR[k].forEach((c, i) => out[`tiles/${k}_v${i}.png`] = url(c));
    for (const k in TALL_SPR) TALL_SPR[k].imgs.forEach((c, i) => out[`tiles/tall_${k}_${i}.png`] = url(c));
    for (const id in SPR) for (const d of ['down', 'up', 'left', 'right']) SPR[id][d].forEach((c, i) => out[`chars/${id}_${d}_${i}.png`] = url(c));
    for (const id in SPR) if (SPR[id].hb) for (const ps in SPR[id].hb) if (ps !== 'flash') out[`heroes/${id}_${ps}.png`] = url(SPR[id].hb[ps]);
    for (const k in ENEMY_ANIM) ENEMY_ANIM[k].frames.forEach((c, i) => out[`enemies/${k}_${i}.png`] = url(c));
    return out;
  });
  // battle backgrounds
  const bgs = await p.evaluate(() => { const o = {}; for (const k of ['plains', 'dusk', 'forest', 'cave', 'tower', 'sanctum', 'shrine']) o[`bg/${k}.png`] = paintBg(k).c.toDataURL('image/png').split(',')[1]; return o; });
  Object.assign(files, bgs);
  // game data as JSON (the Godot port reads the same numbers)
  const data = await p.evaluate(() => {
    const maps = {}; for (const id of ['elm', 'world']) { const m = MAPS[id]; maps[id] = { id, name: m.name, set: m.set, w: m.w, h: m.h, g: m.g.map(r => r.join('')), warps: m.warps || {}, exit: m.exit || null, enc: id === 'world' ? 'world' : null, rate: m.rate || 0,
      npcs: (m.npcs || []).map(n => ({ id: n.id, x: n.x, y: n.y, pal: n.pal, dir: n.dir || 'down', wander: !!n.wander, talk: n.talk })), signs: m.signs || {} }; }
    const tall = {}; for (const k in TALL_SPR) tall[k] = { n: TALL_SPR[k].imgs.length, base: TALL_SPR[k].base };
    return { heroes: HEROES, skills: SKILLS, enemies: ENEMIES, items: ITEMS, formations: FORMATIONS, maps, tilesets: { world: TILESETS.world, town: TILESETS.town }, tall, expTable: Array.from({ length: 50 }, (_, i) => expAt(i + 1)) };
  });
  fs.writeFileSync(path.join(OUT, 'data.json'), JSON.stringify(data));
  let n = 0; for (const f in files) { const fp = path.join(OUT, f); fs.mkdirSync(path.dirname(fp), { recursive: true }); fs.writeFileSync(fp, Buffer.from(files[f], 'base64')); n++; }
  console.log('wrote', n, 'files to', OUT); await b.close();
})();
