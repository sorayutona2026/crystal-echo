'use strict';
// ===== base (野営地): the camp between chapters. Big tappable rows; views are rebuilt every frame from G.roster / G.meta =====
const Base = { stack: [], go: false, job: null, toast: '', toastT: 0, chIdx: 0, autoDone: false };
const bRoster = () => G.roster, bMeta = () => G.meta;
const heroIds = () => HERO_ORDER.filter(id => G.roster[id] && G.roster[id].joined !== false);
const RH = () => VH() >= 420 ? 30 : VH() >= 300 ? 26 : 20;
function baseToast(t) { Base.toast = t; Base.toastT = 120; }
function basePush(fn) { Base.stack.push({ fn, idx: 0, scroll: 0 }); Aud.sfx('ok'); }
function baseBack() { if (Base.stack.length > 1) { Base.stack.pop(); Aud.sfx('cancel'); } else Aud.sfx('cancel'); }
const wDesc = w => '威力' + w.might + ' 命中' + w.hit + ' 射程' + w.min + (w.max > w.min ? '-' + w.max : '') + (w.crit ? ' 必殺+' + w.crit : '');
const statLine = u => 'HP' + u.maxhp + ' 力' + u.str + ' 魔' + u.mag + ' 技' + u.skl + ' 速' + u.spd + ' 守' + u.def + ' 防' + u.res + ' 移' + u.mov;
// ---- views ----
function viewMain() {
  const idx = Base.chIdx, ch = CHAPTERS[idx], R = bRoster(), M = bMeta();
  const pend = heroIds().some(id => pendingSkill(R[id]) || canPromote(R[id], M));
  const unread = supportList(M, R).reduce((n, p) => n + p.convos.filter(c => c.unlocked && !c.seen).length, 0);
  const dep = (M.deploy || defaultDeploy(R, idx)).length;
  return { title: '野営地', sub: '次: ' + ch.title + ' ' + ch.name, rows: [
    { t: '出撃準備', sub: ch.title + ' 「' + ch.name + '」へ  出撃 ' + dep + '/' + ch.cap + '人', r: '▶', hl: 1, fn: () => basePush(viewDeploy) },
    { t: '部隊', sub: '能力・スキル・クラスチェンジ・装備', r: pend ? '要確認!' : '', fn: () => basePush(viewParty) },
    { t: 'ショップ', sub: '武器・傷薬を売り買い', fn: () => basePush(viewShop) },
    { t: '鍛冶場', sub: '武器の威力を+1ずつ強化', fn: () => basePush(viewForge) },
    { t: '支援会話', sub: '隣で戦うと絆が深まる', r: unread ? '未読' + unread : '', fn: () => basePush(viewSupports) },
    { t: 'おまかせで整える', sub: 'スキル・装備・傷薬・編成を自動で', fn: () => { autoCamp(R, M, idx); baseToast('整えました'); Aud.sfx('levelup'); } },
    { t: 'セーブ', sub: '野営地で記録する', fn: () => { saveGame(idx); baseToast('セーブしました'); Aud.sfx('levelup'); } }
  ] };
}
function viewDeploy() {
  const idx = Base.chIdx, ch = CHAPTERS[idx], R = bRoster(), M = bMeta(); if (!M.deploy) M.deploy = defaultDeploy(R, idx);
  const dep = M.deploy, rows = heroIds().map(id => {
    const u = R[id], on = dep.includes(id), inj = u.injured > 0;
    return { t: u.name + '  Lv' + u.lv + ' ' + u.cls, sub: inj ? '負傷中(この章は休み)' : statLine(u), r: inj ? '負傷' : on ? '出撃' : '待機', hl: on ? 2 : 0, off: inj, fn: () => {
      if (id === 'leon') { baseToast('レオンは必ず出撃'); Aud.sfx('cancel'); return; }
      if (on) dep.splice(dep.indexOf(id), 1); else if (dep.length < ch.cap) dep.push(id); else { baseToast('出撃は' + ch.cap + '人まで'); Aud.sfx('cancel'); return; } Aud.sfx('ok'); } };
  });
  const ok = validDeploy(R, idx, dep);
  rows.push({ t: '出撃する!', sub: ok ? ch.title + ' 「' + ch.name + '」' : 'レオンを含めて1〜' + ch.cap + '人を選ぼう', r: dep.length + '/' + ch.cap, hl: 1, off: !ok, fn: () => { M.deploy = dep.slice().sort((a, b) => (a === 'leon' ? -1 : b === 'leon' ? 1 : 0)); Base.go = true; } });
  return { title: '出撃準備', sub: '最大' + ch.cap + '人 / ' + ch.goal, rows };
}
function viewParty() {
  const R = bRoster(), M = bMeta();
  return { title: '部隊', sub: '仲間を選ぶと詳しく見られる', rows: heroIds().map(id => { const u = R[id], tag = pendingSkill(u) ? 'スキル!' : canPromote(u, M) ? '転職可!' : u.injured > 0 ? '負傷' : '';
    return { t: u.name + '  Lv' + u.lv + ' ' + u.cls, sub: statLine(u), r: tag, hl: tag && tag !== '負傷' ? 1 : 0, fn: () => { Base.hero = id; basePush(viewHero); } }; }) };
}
function viewHero() {
  const R = bRoster(), M = bMeta(), u = R[Base.hero], rows = [];
  const p = pendingSkill(u);
  if (p) rows.push({ t: 'スキルを選ぶ', sub: SKILLS[p[0]].name + ' / ' + SKILLS[p[1]].name + ' から1つ', r: '!', hl: 1, fn: () => basePush(viewSkill) });
  if (canPromote(u, M)) rows.push({ t: 'クラスチェンジ', sub: PROMO[u.key].cls + ' (勇者の証を使う)', r: '!', hl: 1, fn: () => basePush(viewClass) });
  else if (u.lv >= 10 && !u.promoted && PROMO[u.key]) rows.push({ t: 'クラスチェンジ', sub: '勇者の証が必要(第三・四章で見つかる)', off: true, fn: () => { } });
  rows.push({ t: '装備変更', sub: weaponOf(u).name + '  ' + wDesc(weaponOf(u)) + (u.forge ? ' (+' + u.forge + ')' : ''), fn: () => basePush(viewEquip) });
  const bonds = heroIds().filter(o => o !== u.key).map(o => { const lv = bondLevel(bondPts(M, u.key, o)); return lv ? R[o].name + BOND_RANK[lv] : ''; }).filter(Boolean);
  rows.push({ t: '絆', sub: bonds.length ? bonds.join('  ') : 'まだありません(隣で一緒に行動しよう)', off: true, fn: () => { } });
  return { title: u.name, sub: 'Lv' + u.lv + ' ' + u.cls, headH: 82, head: y => {
    drawPortrait(u.sprite, 10, y + 2, 44, 0);
    text('EXP ' + u.exp + '/100', 60, y + 2, { size: 8, color: '#9fe8ff' }); text('持ち物 ' + (u.items.length ? u.items.map(k => ITEMS[k].name).join(' ') : 'なし'), 60, y + 13, { size: 7, color: '#d8e0ff' });
    text('スキル ' + (u.skills.length ? u.skills.map(k => SKILLS[k].name).join('・') : 'なし'), 60, y + 24, { size: 7, color: '#ffd8a0' });
    text('特技 ' + SP[u.key].name + ': ' + SP[u.key].desc, 60, y + 35, { size: 7, color: '#9fe8ff' });
    const st = [['HP', u.maxhp], ['力', u.str], ['魔力', u.mag], ['技', u.skl], ['速さ', u.spd], ['守備', u.def], ['魔防', u.res], ['移動', u.mov]];
    st.forEach((r, i) => { const cx = 12 + (i % 4) * 76, cy = y + 52 + Math.floor(i / 4) * 13; text(r[0], cx, cy, { size: 8, color: '#ffd24a' }); text(String(r[1]), cx + 66, cy, { size: 8, align: 'right' }); });
  }, rows };
}
function viewSkill() {
  const u = bRoster()[Base.hero], p = pendingSkill(u) || [];
  return { title: 'スキル選択', sub: u.name + ' Lv' + (u.skills.length ? 10 : 5) + ' の力を1つ選ぶ', rows: p.map(id => ({ t: SKILLS[id].name, sub: SKILLS[id].desc, hl: 1, fn: () => { chooseSkill(u, id); Aud.sfx('levelup'); baseToast(SKILLS[id].name + 'を習得'); Base.stack.pop(); } })) };
}
function viewClass() {
  const u = bRoster()[Base.hero], P = PROMO[u.key], M = bMeta();
  return { title: 'クラスチェンジ', sub: u.cls + ' → ' + P.cls, headH: 40, head: y => { text(P.desc, 12, y + 4, { size: 8, color: '#ffe27a' }); text(Object.keys(P.d).map(k => STAT_JP[k] + '+' + P.d[k]).join('  '), 12, y + 18, { size: 8 }); text('勇者の証 ' + M.proofs + '個', 12, y + 30, { size: 7, color: '#9fe8ff' }); },
    rows: [{ t: P.cls + 'になる', sub: '勇者の証を1つ使う(元には戻せません)', hl: 1, fn: () => { promote(u, M); Aud.sfx('levelup'); baseToast(u.name + 'は' + P.cls + 'になった!'); Base.stack.pop(); } }] };
}
function viewEquip() {
  const u = bRoster()[Base.hero], M = bMeta(), rows = [];
  M.convoy.forEach((id, i) => { if (canWield(u, id)) { const w = WITEMS[id]; rows.push({ t: w.name, sub: wDesc(w), r: '装備', fn: () => { equipFromConvoy(M, u, i); Aud.sfx('ok'); baseToast(w.name + 'を装備'); } }); } });
  if (!rows.length) rows.push({ t: '持っている他の武器はありません', sub: 'ショップで買うと、古い武器がここに入る', off: true, fn: () => { } });
  const c = weaponOf(u);
  return { title: '装備変更', sub: u.name + ': ' + c.name + '  ' + wDesc(c), rows };
}
function viewShop() {
  return { title: 'ショップ', sub: '買った武器は装備され、古い武器は預かり所へ', rows: [
    { t: '買う', sub: '誰に買うか選ぶ', fn: () => basePush(viewBuyWho) },
    { t: '売る', sub: '余った武器・傷薬を半額で', fn: () => basePush(viewSell) }] };
}
function viewBuyWho() {
  const R = bRoster();
  return { title: '誰に買う?', sub: '傷薬は1人3つまで', rows: heroIds().map(id => { const u = R[id]; return { t: u.name + '  ' + weaponOf(u).name, sub: '傷薬 ' + u.items.length + '/' + MAX_ITEMS + '  ' + (u.items.map(k => ITEMS[k].name).join(' ')), fn: () => { Base.hero = id; basePush(viewBuy); } }; }) };
}
function viewBuy() {
  const R = bRoster(), M = bMeta(), u = R[Base.hero], rows = [], cur = weaponOf(u);
  for (const w of shopWeapons(M, u)) { const have = u.wid === w.id; rows.push({ t: w.name, sub: wDesc(w) + (have ? '  (装備中)' : ''), r: w.price + 'G', off: have || M.gold < w.price, fn: () => { if (buyWeapon(M, u, w.id)) { Aud.sfx('levelup'); baseToast(w.name + 'を買った'); } else Aud.sfx('cancel'); } }); }
  for (const id of shopItems(M)) { const it = ITEMS[id]; rows.push({ t: it.name, sub: it.desc + '  (' + u.items.length + '/' + MAX_ITEMS + ')', r: it.price + 'G', off: M.gold < it.price || u.items.length >= MAX_ITEMS, fn: () => { if (buyItem(M, u, id)) { Aud.sfx('ok'); baseToast(it.name + 'を買った'); } else Aud.sfx('cancel'); } }); }
  return { title: u.name + 'に買う', sub: '今の武器: ' + cur.name + ' ' + wDesc(cur), rows };
}
function viewSell() {
  const R = bRoster(), M = bMeta(), rows = [];
  M.convoy.forEach((id, i) => rows.push({ t: WITEMS[id].name, sub: '預かり所の武器', r: sellPriceW(id) + 'G', fn: () => { sellConvoy(M, i); Aud.sfx('ok'); baseToast('売った'); } }));
  for (const hid of heroIds()) R[hid].items.forEach((id, i) => rows.push({ t: ITEMS[id].name, sub: R[hid].name + 'の持ち物', r: sellPriceI(id) + 'G', fn: () => { sellItem(M, R[hid], i); Aud.sfx('ok'); baseToast('売った'); } }));
  if (!rows.length) rows.push({ t: '売れるものがありません', off: true, fn: () => { } });
  return { title: '売る', sub: '半額で買い取り', rows };
}
function viewForge() {
  const R = bRoster(), M = bMeta();
  return { title: '鍛冶場', sub: '武器の威力+1 (最大+' + FORGE_MAX + ')', rows: heroIds().map(id => { const u = R[id], c = forgeCost(u), heal = weaponOf(u).type === 'heal';
    return { t: u.name + '  ' + weaponOf(u).name + (u.forge ? ' +' + u.forge : ''), sub: heal ? '杖は強化できません' : '威力 ' + weaponOf(u).might + (c != null ? ' → ' + (weaponOf(u).might + 1) : ''), r: heal ? '-' : c == null ? 'MAX' : c + 'G', off: heal || c == null || M.gold < c, fn: () => { if (forge(M, u)) { Aud.sfx('levelup'); baseToast(u.name + 'の武器を強化'); } else Aud.sfx('cancel'); } }; }) };
}
function viewSupports() {
  const R = bRoster(), M = bMeta();
  return { title: '支援会話', sub: '絆 C/B/A で会話が増える', rows: supportList(M, R).map(p => ({ t: p.title, sub: '絆 ' + p.pts + 'pt  会話 ' + p.convos.filter(c => c.seen).length + '/3' + (p.here ? '' : '  (未合流)'), r: BOND_RANK[p.lv] || '--', hl: p.convos.some(c => c.unlocked && !c.seen) ? 1 : 0, fn: () => { Base.pair = p.key; basePush(viewPair); } })) };
}
function viewPair() {
  const M = bMeta(), p = supportList(M, bRoster()).find(q => q.key === Base.pair);
  return { title: p.title, sub: '絆 ' + p.pts + 'pt', rows: p.convos.map(c => ({ t: BOND_RANK[c.k + 1] + 'の会話', sub: c.unlocked ? (c.seen ? '見た' : '新しい会話') : '絆' + BOND_RANK[c.k + 1] + 'で解放 (あと' + Math.max(0, BOND_AT[c.k + 1] - p.pts) + 'pt)', r: c.unlocked ? '▶' : '', hl: c.unlocked && !c.seen ? 1 : 0, off: !c.unlocked,
    fn: () => { M.seen[p.key + '#' + c.k] = true; Base.job = function* () { yield* dialogue(SUPPORTS[p.key][c.k], 'camp'); }; } })) };
}
// ---- input / drawing ----
const curView = () => { const e = Base.stack[Base.stack.length - 1]; return { e, v: e.fn() }; };
function allRows(v, e) { const rows = v.rows.slice(); if (Base.stack.length > 1) rows.push({ t: '戻る', back: true, fn: baseBack }); else rows.push({ t: 'タイトルへ', sub: 'セーブしてから戻ろう', fn: () => { Base.title = true; } }); return rows; }
function baseInput(a) {
  const { e, v } = curView(), rows = allRows(v, e), n = rows.length;
  if (a === 'up') { e.idx = (e.idx + n - 1) % n; Aud.sfx('move'); }
  else if (a === 'down') { e.idx = (e.idx + 1) % n; Aud.sfx('move'); }
  else if (a === 'ok') { const r = rows[Math.min(e.idx, n - 1)]; if (r.off) Aud.sfx('cancel'); else r.fn(); }
  else if (a === 'cancel') baseBack();
}
function drawBase() {
  useBg('camp', 0.36); drawDrift(18, '#ffd890', 2);
  const { e, v } = curView(), rows = allRows(v, e), n = rows.length, M = G.meta, rh = RH(), vh = VH();
  e.idx = Math.min(e.idx, n - 1);
  panel(6, 4, 308, 24, 0.88); text(v.title, 14, 7, { size: 11, bold: true, color: '#ffe860' }); text(v.sub || '', 14, 19, { size: 7, color: '#c8d4ff' });
  text(M.gold + ' G', 306, 6, { size: 11, bold: true, align: 'right', color: '#ffe27a' }); if (M.proofs) text('勇者の証 ' + M.proofs, 306, 19, { size: 7, align: 'right', color: '#9fe8ff' });
  let y0 = 32; if (v.head) { panel(6, y0, 308, v.headH, 0.8); v.head(y0 + 2); y0 += v.headH + 4; }
  const area = vh - y0 - 4, vis = Math.max(2, Math.floor(area / (rh + 2)));
  if (e.idx < e.scroll) e.scroll = e.idx; if (e.idx >= e.scroll + vis) e.scroll = e.idx - vis + 1; e.scroll = Math.max(0, Math.min(e.scroll, Math.max(0, n - vis)));
  Base.geom = { y0, rh, scroll: e.scroll, vis, n };
  for (let k = 0; k < vis && e.scroll + k < n; k++) {
    const i = e.scroll + k, r = rows[i], y = y0 + k * (rh + 2), sel = i === e.idx;
    ctx.fillStyle = sel ? 'rgba(70,92,210,0.92)' : r.hl ? 'rgba(110,70,20,0.78)' : 'rgba(8,12,44,0.78)'; ctx.fillRect(6, y, 308, rh);
    ctx.strokeStyle = sel ? '#ffe860' : r.hl ? '#e0a040' : '#4a58a8'; ctx.lineWidth = 1; ctx.strokeRect(6.5, y + 0.5, 307, rh - 1);
    if (HD.collect) HD.holes.push([6, y, 308, rh]);
    const col = r.off ? '#778' : '#fff';
    if (r.sub) { text(r.t, 14, y + (rh >= 30 ? 3 : rh >= 26 ? 3 : 1), { size: rh >= 30 ? 11 : rh >= 26 ? 10 : 9, bold: true, color: col }); text(r.sub, 14, y + (rh >= 30 ? 18 : rh >= 26 ? 15 : 11), { size: rh >= 30 ? 8 : 7, color: r.off ? '#667' : '#b8c4ff' }); }
    else text(r.t, 14, y + (rh - 10) / 2, { size: 10, bold: true, color: col });
    if (r.r) text(r.r, 306, y + (rh - 10) / 2, { size: 10, bold: true, align: 'right', color: r.off && !r.hl ? '#778' : '#ffe860' });
    if (sel) text('▶', 8, y + (rh - 8) / 2 - 1, { size: 8, color: '#ffe860' });
    Touch.add(6, y, 308, rh, () => { e.idx = i; Input.q.push('ok'); });
  }
  if (n > vis) { // scroll arrows
    if (e.scroll > 0) { rect(290, y0 - 2, 24, 12, 'rgba(0,0,30,0.8)'); text('▲', 302, y0, { size: 8, align: 'center', color: '#ffe860' }); Touch.add(280, y0 - 4, 40, 16, () => { e.idx = Math.max(0, e.scroll - 1); }); }
    if (e.scroll + vis < n) { const yy = y0 + vis * (rh + 2) - 12; rect(290, yy, 24, 12, 'rgba(0,0,30,0.8)'); text('▼', 302, yy + 1, { size: 8, align: 'center', color: '#ffe860' }); Touch.add(280, yy - 4, 40, 16, () => { e.idx = Math.min(n - 1, e.scroll + vis); }); }
  }
  if (Base.toastT > 0) { Base.toastT--; const a = Math.min(1, Base.toastT / 20); ctx.globalAlpha = a; panel(60, vh - 40, 200, 20, 0.95); text(Base.toast, 160, vh - 35, { size: 10, bold: true, align: 'center', color: '#ffe860' }); ctx.globalAlpha = 1; }
}
function* baseScene(idx) {
  G.scene = 'base'; flushInput(); Aud.bgm('title'); Base.chIdx = idx; Base.hero = null; Base.go = false; Base.job = null; Base.title = false; Base.autoDone = false; Base.toastT = 0;
  Base.stack = [{ fn: viewMain, idx: 0, scroll: 0 }]; if (!G.meta.deploy) G.meta.deploy = defaultDeploy(G.roster, idx);
  for (;;) {
    if (Base.go) break; if (Base.title) return 'title';
    if (Base.job) { const j = Base.job; Base.job = null; yield* j(); G.scene = 'base'; flushInput(); continue; }
    if (G.auto && !Base.autoDone) { Base.autoDone = true; autoCamp(G.roster, G.meta, idx); baseToast('おまかせで整えました'); Aud.sfx('levelup'); for (let i = 0; i < 90; i++) yield 1; if (G.auto) Base.go = true; continue; }
    const a = Input.q.shift(); if (a && !G.busy) baseInput(a);
    yield 1;
  }
  return 'go';
}
