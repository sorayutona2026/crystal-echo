'use strict';
// ===== camp (野営地) rules: shop, forge, skills, class change, bonds, deployment (pure logic; no DOM) =====
const HERO_ORDER = ['leon', 'mira', 'luka', 'sophia', 'jin'];
const heroFam = u => (u.fam || HEROES[u.key].wpn);
function pendingSkill(u) {
  const n = u.skills.length, p = SKILL_PICKS[u.key]; if (!p) return null;
  if (u.lv >= 5 && n < 1) return p[0];
  if (u.lv >= 10 && n < 2) return p[1];
  return null;
}
function chooseSkill(u, id) { const p = pendingSkill(u); if (!p || !p.includes(id)) return false; u.skills.push(id); return true; }
const canPromote = (u, meta) => u.lv >= 10 && !u.promoted && meta.proofs > 0 && !!PROMO[u.key];
function promote(u, meta) {
  if (!canPromote(u, meta)) return false;
  const P = PROMO[u.key]; u.promoted = true; meta.proofs--; u.cls = P.cls;
  for (const k in P.d) { if (k === 'hp') { u.maxhp += P.d.hp; u.hp += P.d.hp; } else u[k] += P.d[k]; }
  if (P.heal) u.canHeal = true;
  if (P.crit) u.promoCrit = P.crit;
  if (P.light) { u.canHeal = true; u.fam = 'tome'; const old = u.wid; if (old && !meta.convoy.includes(old) && old !== 'live') meta.convoy.push(old); u.wid = 'light'; }
  return true;
}
const DROP_TO = { str: ['leon'], def: ['leon'], spd: ['jin', 'mira'], mag: ['luka'] };
function useDrop(meta, u, k) { if (!meta.drops || !(meta.drops[k] > 0)) return false; meta.drops[k]--; u[k]++; return true; }
// ---- shop ----
const shopStage = meta => meta.cleared >= 3 ? 3 : meta.cleared >= 2 ? 2 : meta.cleared >= 1 ? 1 : 0; // highest weapon tier on sale (special = 3)
function shopWeapons(meta, u) {
  const fam = heroFam(u), st = shopStage(meta), cur = WITEMS[u.wid];
  return Object.values(WITEMS).filter(w => w.fam === fam && !w.noshop && w.price > 0 && w.tier <= st && canWield(u, w.id));
}
function shopItems(meta) { return Object.keys(ITEMS).filter(id => !ITEMS[id].stage || shopStage(meta) >= ITEMS[id].stage); }
function canWield(u, id) { const w = WITEMS[id]; if (!w) return false; if (w.light) return u.fam === 'tome' && u.key === 'sophia'; return w.fam === heroFam(u) && !(w.type === 'heal' && heroFam(u) === 'tome'); }
function buyWeapon(meta, u, id) {
  const w = WITEMS[id]; if (!w || meta.gold < w.price || !canWield(u, id)) return false;
  if (u.wid === id) return false;
  meta.gold -= w.price; if (u.wid) meta.convoy.push(u.wid); u.wid = id; return true;
}
function buyItem(meta, u, id) { const it = ITEMS[id]; if (!it || meta.gold < it.price || u.items.length >= MAX_ITEMS) return false; meta.gold -= it.price; u.items.push(id); return true; }
const sellPriceW = id => Math.floor((WITEMS[id].price || 100) / 2);
const sellPriceI = id => Math.floor(ITEMS[id].price / 2);
function sellConvoy(meta, i) { const id = meta.convoy[i]; if (!id) return false; meta.gold += sellPriceW(id); meta.convoy.splice(i, 1); return true; }
function sellItem(meta, u, i) { const id = u.items[i]; if (!id) return false; meta.gold += sellPriceI(id); u.items.splice(i, 1); return true; }
function equipFromConvoy(meta, u, i) { const id = meta.convoy[i]; if (!id || !canWield(u, id)) return false; meta.convoy.splice(i, 1); if (u.wid) meta.convoy.push(u.wid); u.wid = id; return true; }
// ---- forge ----
const FORGE_MAX = 3, FORGE_COST = [100, 180, 280];
const forgeCost = u => (u.forge || 0) >= FORGE_MAX ? null : FORGE_COST[u.forge || 0];
function forge(meta, u) { const c = forgeCost(u); if (c == null || meta.gold < c || weaponOf(u).type === 'heal') return false; meta.gold -= c; u.forge = (u.forge || 0) + 1; return true; }
// ---- bonds / supports ----
const bondPts = (meta, a, b) => meta.bonds[bondKey(a, b)] || 0;
const supportKey = (a, b) => bondKey(a, b);
function supportList(meta, roster) { // [{key,title,lv,convos:[{k,unlocked,seen}]}]
  return BOND_PAIRS.map(([a, b]) => { const key = bondKey(a, b), lv = bondLevel(bondPts(meta, a, b)), here = !!(roster[a] && roster[b] && roster[a].joined !== false && roster[b].joined !== false);
    return { key, a, b, title: SUPPORT_TITLES[key], lv, pts: bondPts(meta, a, b), here, convos: [0, 1, 2].map(k => ({ k, unlocked: lv > k, seen: !!meta.seen[key + '#' + k] })) }; });
}
// ---- deployment ----
const deployable = (u) => u.team !== 2 && !(u.injured > 0) && u.joined !== false;
function defaultDeploy(roster, idx) {
  const cap = CHAPTERS[idx].cap, ids = Object.keys(roster).filter(id => deployable(roster[id]) && !(CHAPTERS[idx].neutral || []).some(n => n.id === id && !roster[id].joined));
  ids.sort((a, b) => (a === 'leon' ? -1 : b === 'leon' ? 1 : roster[b].lv - roster[a].lv));
  return ids.slice(0, cap);
}
function validDeploy(roster, idx, list) { return list && list.includes('leon') && list.length <= CHAPTERS[idx].cap && list.every(id => roster[id] && deployable(roster[id])); }
// ---- automatic camp (bot, test, auto mode): skills, class change, potions, gear, forge, deployment ----
function autoCamp(roster, meta, idx) {
  const ids = HERO_ORDER.filter(id => roster[id] && roster[id].joined !== false);
  // secret loot: unique weapons from the convoy, then stat drops
  for (const id of ids) { const u = roster[id]; for (;;) { let bi = -1, bm = weaponOf(u).might; meta.convoy.forEach((wid, i) => { const w = WITEMS[wid]; if (w && canWield(u, wid) && w.might + 0 > bm && !w.light) { bi = i; bm = w.might; } }); if (bi < 0) break; equipFromConvoy(meta, u, bi); } }
  for (const k in DROP_TO) for (const id of DROP_TO[k]) { const u = roster[id]; while (u && u.joined !== false && (meta.drops || {})[k] > 0) useDrop(meta, u, k); }
  for (const id of ids) { const u = roster[id]; for (let g = 0; g < 2; g++) { const p = pendingSkill(u); if (p) chooseSkill(u, p[0]); } }
  for (const id of ['leon', 'luka', 'mira', 'sophia', 'jin']) { const u = roster[id]; if (u && canPromote(u, meta)) promote(u, meta); }
  const potionTo = n => { for (const id of ids) { const u = roster[id]; while (u.items.length < n && meta.gold >= ITEMS.potion.price + 10 && u.items.filter(x => x === 'potion').length < n) buyItem(meta, u, 'potion'); } };
  potionTo(2);
  for (let pass = 0; pass < 3; pass++) for (const id of ['leon', 'mira', 'luka', 'jin', 'sophia']) {
    const u = roster[id]; if (!u || u.joined === false || meta.gold < 150) continue;
    const cur = WITEMS[u.wid], list = shopWeapons(meta, u).filter(w => w.might > (cur ? cur.might : 0) && w.type !== 'heal' && w.price + 60 <= meta.gold && w.tier < 3).sort((a, b) => b.might - a.might);
    const lowest = list.length ? list.reduce((m, w) => w.price < m.price ? w : m, list[0]) : null; // buy the next step first
    if (lowest) buyWeapon(meta, u, lowest.id);
  }
  for (let i = 0; i < 6; i++) for (const id of ['leon', 'mira', 'luka', 'jin']) { const u = roster[id]; if (u && u.joined !== false && meta.gold >= (forgeCost(u) || 1e9) + 60) forge(meta, u); }
  potionTo(3);
  // heal-staff upgrade for the healer when affordable
  const so = roster.sophia; if (so && !so.promoted) { const l = shopWeapons(meta, so).filter(w => w.might > WITEMS[so.wid].might && w.price + 60 <= meta.gold).sort((a, b) => a.price - b.price)[0]; if (l) buyWeapon(meta, so, l.id); }
  meta.deploy = defaultDeploy(roster, idx);
}
