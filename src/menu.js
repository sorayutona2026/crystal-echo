// ===================== FIELD MENU =====================
function fieldUseItem(id, m) {
  const it = ITEMS[id]; const s = stats(m);
  if (it.tent) { healAll(); return 'みんなの体力が回復した!'; }
  if (it.target === 'allies') { let n = 0; for (const p of G.party) { const ps = stats(p); if (p.hp > 0 && p.hp < ps.maxhp) { p.hp = Math.min(ps.maxhp, p.hp + it.heal); n++; } } return n ? 'みんなのHPが回復した!' : null; }
  if (it.revive) { if (m.hp > 0) return null; m.hp = Math.max(1, Math.floor(s.maxhp * it.revive)); return `${HEROES[m.id].name}が復活した!`; }
  if (m.hp <= 0) return null;
  if (it.full) { m.hp = s.maxhp; m.mp = s.maxmp; return 'HPとMPが全回復した!'; }
  if (it.heal) { if (m.hp >= s.maxhp) return null; const n = Math.min(it.heal, s.maxhp - m.hp); m.hp += n; return `HPが${n}回復した!`; }
  if (it.mpheal) { if (m.mp >= s.maxmp) return null; const n = Math.min(it.mpheal, s.maxmp - m.mp); m.mp += n; return `MPが${n}回復した!`; }
  if (it.cure) { if (!m.poison) return null; m.poison = false; return '毒が治った!'; }
  return null;
}
function fieldCast(sid, caster, target) {
  const sk = SKILLS[sid]; if (caster.mp < sk.mp) return 'MPが足りない!';
  const cs = stats(caster); const amt = () => Math.round(sk.power + cs.mag * 2.4);
  const tgts = sk.target === 'allies' ? G.party.filter(p => p.hp > 0) : [target];
  let did = false;
  for (const t of tgts) {
    const s = stats(t);
    if (sk.kind === 'heal' && t.hp > 0 && t.hp < s.maxhp) { t.hp = Math.min(s.maxhp, t.hp + amt()); did = true; }
    if (sk.kind === 'revive' && t.hp <= 0) { t.hp = Math.max(1, Math.floor(s.maxhp * 0.4)); did = true; }
  }
  if (!did) return null;
  caster.mp -= sk.mp; return `${sk.name}をとなえた!`;
}

const Menu = {
  open() { G.menu = { mode: 'main', i: 0, li: 0, scroll: 0, who: 0, msg: null, msgT: 0 }; },
  cmds: ['アイテム', 'まほう', 'そうび', 'ステータス', 'セーブ', 'とじる'],
  say(t) { G.menu.msg = t; G.menu.msgT = 70; },
  update() {
    const M = G.menu; if (M.msgT > 0) M.msgT--;
    const n = G.party.length;
    const nav = (key, len) => { if (Input.rep('up')) { M[key] = (M[key] - 1 + len) % len; Audio8.sfx('cursor'); } if (Input.rep('down')) { M[key] = (M[key] + 1) % len; Audio8.sfx('cursor'); } };
    switch (M.mode) {
      case 'main': {
        nav('i', this.cmds.length);
        if (Input.pressed.b || Input.pressed.menu) { Audio8.sfx('cancel'); G.menu = null; return; }
        if (!Input.pressed.a) return; Audio8.sfx('ok');
        const c = this.cmds[M.i];
        if (c === 'とじる') { G.menu = null; return; }
        if (c === 'アイテム') { M.mode = 'item'; M.li = 0; M.scroll = 0; }
        if (c === 'まほう') { M.mode = 'pickMagic'; M.who = 0; }
        if (c === 'そうび') { M.mode = 'pickEquip'; M.who = 0; }
        if (c === 'ステータス') { M.mode = 'pickStatus'; M.who = 0; }
        if (c === 'セーブ') { if (saveGame()) { Audio8.sfx('save'); this.say('セーブしました'); } else { Audio8.sfx('error'); this.say('セーブできませんでした'); } }
        return;
      }
      case 'item': {
        const list = this.itemList(); if (!list.length) { M.mode = 'main'; this.say('アイテムを持っていない'); return; }
        if (M.li >= list.length) M.li = list.length - 1;
        nav('li', list.length); this.scrollTo(M, M.li, 9);
        if (Input.pressed.b) { Audio8.sfx('cancel'); M.mode = 'main'; return; }
        if (Input.pressed.a) {
          const id = list[M.li]; const it = ITEMS[id];
          if (it.type !== 'use') { Audio8.sfx('error'); this.say('そうびから装備できます'); return; }
          Audio8.sfx('ok');
          if (it.target === 'party' || it.target === 'allies') { const r = fieldUseItem(id, G.party[0]); if (!r) { Audio8.sfx('error'); this.say('効果がない'); return; } removeItem(id); Audio8.sfx('heal'); this.say(r); return; }
          M.mode = 'itemTarget'; M.itemId = id; M.who = 0;
        }
        return;
      }
      case 'itemTarget': {
        nav('who', n);
        if (Input.pressed.b) { Audio8.sfx('cancel'); M.mode = 'item'; return; }
        if (Input.pressed.a) {
          const r = fieldUseItem(M.itemId, G.party[M.who]);
          if (!r) { Audio8.sfx('error'); this.say('効果がない'); return; }
          removeItem(M.itemId); Audio8.sfx('heal'); this.say(r);
          if (!G.inv[M.itemId]) M.mode = 'item';
        }
        return;
      }
      case 'pickMagic': case 'pickEquip': case 'pickStatus': {
        nav('who', n);
        if (Input.pressed.b) { Audio8.sfx('cancel'); M.mode = 'main'; return; }
        if (!Input.pressed.a) return; Audio8.sfx('ok');
        if (M.mode === 'pickMagic') { M.mode = 'magic'; M.li = 0; M.caster = M.who; }
        else if (M.mode === 'pickEquip') { M.mode = 'equip'; M.slot = 0; }
        else M.mode = 'status';
        return;
      }
      case 'magic': {
        const c = G.party[M.caster]; const list = skillsOf(c);
        if (!list.length) { M.mode = 'pickMagic'; return; }
        nav('li', list.length);
        if (Input.pressed.b) { Audio8.sfx('cancel'); M.mode = 'pickMagic'; return; }
        if (Input.pressed.a) {
          const sk = SKILLS[list[M.li]];
          if (!sk.field) { Audio8.sfx('error'); this.say('ここでは使えない'); return; }
          if (c.hp <= 0 || c.mp < sk.mp) { Audio8.sfx('error'); this.say('MPが足りない'); return; }
          Audio8.sfx('ok'); M.mode = 'magicTarget'; M.who = 0; M.skillId = list[M.li];
        }
        return;
      }
      case 'magicTarget': {
        nav('who', n);
        if (Input.pressed.b) { Audio8.sfx('cancel'); M.mode = 'magic'; return; }
        if (Input.pressed.a) { const r = fieldCast(M.skillId, G.party[M.caster], G.party[M.who]); if (!r) { Audio8.sfx('error'); this.say('効果がない'); } else { Audio8.sfx('heal'); this.say(r); } }
        return;
      }
      case 'equip': {
        if (Input.rep('up') || Input.rep('down')) { M.slot ^= 1; Audio8.sfx('cursor'); }
        if (Input.rep('left')) { M.who = (M.who + n - 1) % n; Audio8.sfx('cursor'); }
        if (Input.rep('right')) { M.who = (M.who + 1) % n; Audio8.sfx('cursor'); }
        if (Input.pressed.b) { Audio8.sfx('cancel'); M.mode = 'pickEquip'; return; }
        if (Input.pressed.a) { const l = this.equipList(); if (!l.length) { Audio8.sfx('error'); this.say('装備できるものがない'); return; } Audio8.sfx('ok'); M.mode = 'equipPick'; M.li = 0; }
        return;
      }
      case 'equipPick': {
        const l = this.equipList(); if (!l.length) { M.mode = 'equip'; return; }
        nav('li', l.length);
        if (Input.pressed.b) { Audio8.sfx('cancel'); M.mode = 'equip'; return; }
        if (Input.pressed.a) {
          const m = G.party[M.who]; const slot = M.slot ? 'armor' : 'weapon'; const id = l[M.li];
          const before = stats(m); const oldMax = before.maxhp;
          addItem(m[slot]); removeItem(id); m[slot] = id; Audio8.sfx('buy');
          M.mode = 'equip';
        }
        return;
      }
      case 'status': {
        if (Input.rep('left') || Input.rep('up')) { M.who = (M.who + n - 1) % n; Audio8.sfx('cursor'); }
        if (Input.rep('right') || Input.rep('down')) { M.who = (M.who + 1) % n; Audio8.sfx('cursor'); }
        if (Input.pressed.b || Input.pressed.a) { Audio8.sfx('cancel'); M.mode = 'pickStatus'; }
        return;
      }
    }
  },
  scrollTo(M, i, rows) { if (i < M.scroll) M.scroll = i; if (i >= M.scroll + rows) M.scroll = i - rows + 1; },
  itemList() { const order = Object.keys(ITEMS); return Object.keys(G.inv).sort((a, b) => order.indexOf(a) - order.indexOf(b)); },
  equipList() { const M = G.menu; const m = G.party[M.who]; const slot = M.slot ? 'armor' : 'weapon'; return Object.keys(G.inv).filter(id => ITEMS[id].type === slot && ITEMS[id].eq.includes(m.id)); },
  drawParty(x, y, w, sel) {
    win(x, y, w, 224 - y);
    G.party.forEach((m, i) => {
      const yy = y + 8 + i * 52; const s = stats(m); const h = HEROES[m.id];
      if (sel != null) Touch.add(x, yy - 3, w, 50, () => { G.menu.who = i; Input.tapA(); });
      if (sel === i) { ctx.fillStyle = 'rgba(240,207,134,.12)'; ctx.fillRect(x + 4, yy - 3, w - 8, 50); }
      if (m.hp > 0) ctx.drawImage(SPR[m.id].hb.idle, x + 18, yy + 2, HB_W, HB_H); else ctx.drawImage(SPR[m.id].hb.ko, x + 12, yy + 12, HB_H, HB_W);
      text(h.name, x + 58, yy, m.hp <= 0 ? '#ff7080' : UI.ink, 8.5, 'left', 't'); text(h.job, x + 102, yy, UI.muted, 7);
      text('Lv ' + m.lv, x + 58, yy + 12, UI.gold);
      text('HP', x + 58, yy + 23, UI.label, 7); text(`${m.hp}/${s.maxhp}`, x + 72, yy + 22);
      text('MP', x + 58, yy + 34, UI.label, 7); text(`${m.mp}/${s.maxmp}`, x + 72, yy + 33);
      if (m.poison) text('毒', x + 150, yy + 12, '#b07dff');
      bar(x + 120, yy + 26, 44, 3, m.hp / s.maxhp, UI.hp); bar(x + 120, yy + 37, 44, 3, s.maxmp ? m.mp / s.maxmp : 0, UI.mp);
    });
    if (sel != null) cursor(x + 4, y + 22 + sel * 52);
  },
  draw() {
    const M = G.menu;
    ctx.fillStyle = 'rgba(4,4,14,.72)'; ctx.fillRect(0, 0, SW, SH);
    const pickMode = ['itemTarget', 'pickMagic', 'pickEquip', 'pickStatus', 'magicTarget'].includes(M.mode);
    if (M.mode === 'main' || pickMode) {
      this.drawParty(0, 0, 182, pickMode ? M.who : null);
      win(182, 0, 74, 92); this.cmds.forEach((c, i) => { text(c, 196, 7 + i * 13); if (M.mode === 'main') Touch.add(182, 3 + i * 13, 74, 13, () => { M.i = i; Input.tapA(); }); });
      if (M.mode === 'main') cursor(186, 8 + M.i * 13);
      win(182, 172, 74, 52); text('ギル', 190, 179, UI.label, 7); text(String(G.gil), 248, 189, UI.ink, 8, 'right');
      const sec = Math.floor(G.time / 60); text('じかん', 190, 201, UI.label, 7); text(`${Math.floor(sec / 3600)}:${String(Math.floor(sec / 60) % 60).padStart(2, '0')}`, 248, 210, UI.ink, 8, 'right');
      win(182, 92, 74, 80); text(G.map.name.replace('クリスタルの', ''), 219, 100, UI.ink, 7, 'center');
      if (M.mode === 'itemTarget') text(ITEMS[M.itemId].name + ' ×' + (G.inv[M.itemId] || 0), 219, 120, UI.gold, 7, 'center');
      if (M.mode === 'magicTarget') { text(SKILLS[M.skillId].name, 219, 120, UI.gold, 7, 'center'); text('MP ' + G.party[M.caster].mp, 219, 134, UI.label, 7, 'center'); }
    }
    if (M.mode === 'item') {
      win(0, 0, 256, 24); text('アイテム', 10, 7, UI.gold);
      const l = this.itemList();
      win(0, 24, 256, 156);
      l.slice(M.scroll, M.scroll + 9).forEach((id, k) => { Touch.add(0, 28 + k * 16, 256, 16, () => { M.li = M.scroll + k; Input.tapA(); }); const it = ITEMS[id]; text(it.name, 22, 32 + k * 16, it.type === 'use' ? UI.ink : UI.muted); text('×' + G.inv[id], 240, 32 + k * 16, UI.muted, 8, 'right'); });
      cursor(8, 33 + (M.li - M.scroll) * 16);
      win(0, 180, 256, 44); const it = ITEMS[l[M.li]]; if (it) text(it.desc || this.eqDesc(it), 10, 188);
    }
    if (M.mode === 'magic') {
      const c = G.party[M.caster]; win(0, 0, 256, 24); text(`${HEROES[c.id].name} の${HEROES[c.id].cmd}    MP ${c.mp}/${stats(c).maxmp}`, 10, 7, UI.gold);
      win(0, 24, 256, 156); const l = skillsOf(c);
      l.forEach((id, k) => { Touch.add(0, 28 + k * 16, 256, 16, () => { M.li = k; Input.tapA(); }); const sk = SKILLS[id]; text(sk.name, 22, 32 + k * 16, sk.field ? UI.ink : UI.dim); text(sk.mp ? 'MP ' + sk.mp : '', 240, 32 + k * 16, UI.muted, 8, 'right'); });
      cursor(8, 33 + M.li * 16); win(0, 180, 256, 44); const sk = SKILLS[l[M.li]]; if (sk) text(sk.desc + (sk.field ? '' : '(戦闘中のみ)'), 10, 188);
    }
    if (M.mode === 'equip' || M.mode === 'equipPick') {
      const m = G.party[M.who]; const s = stats(m);
      win(0, 0, 256, 70); ctx.drawImage(SPR[m.id].hb.idle, 4, 16, 32, 40);
      text(`${HEROES[m.id].name}  Lv${m.lv}`, 50, 8, UI.ink); text('◀ ▶ でキャラ切替', 248, 8, UI.muted, 7, 'right');
      text('武器', 50, 26, UI.label, 7); text(ITEMS[m.weapon].name, 80, 25); text('防具', 50, 42, UI.label, 7); text(ITEMS[m.armor].name, 80, 41);
      if (M.mode === 'equip') cursor(36, 26 + M.slot * 16);
      const l = this.equipList(); let pv = null;
      win(0, 70, 140, 154);
      if (!l.length) text('なし', 22, 80, UI.dim);
      l.forEach((id, k) => { text(`${ITEMS[id].name}`, 22, 78 + k * 15); if (M.mode === 'equipPick') Touch.add(0, 75 + k * 15, 140, 15, () => { M.li = k; Input.tapA(); }); });
      if (M.mode === 'equipPick') { cursor(8, 79 + M.li * 15); const id = l[M.li]; const tmp = { ...m }; tmp[M.slot ? 'armor' : 'weapon'] = id; pv = stats(tmp); }
      win(140, 70, 116, 154);
      [['こうげき', 'atk'], ['ぼうぎょ', 'def'], ['まりょく', 'mag'], ['まほうぼうぎょ', 'mdf'], ['すばやさ', 'spd']].forEach(([lb, k], j) => {
        const y = 80 + j * 16; text(lb, 148, y, UI.label, 7); text(String(s[k]), 214, y, UI.ink, 8, 'right');
        if (pv) { const d = pv[k] - s[k]; text('→' + pv[k], 216, y, d > 0 ? UI.hp : d < 0 ? '#ff7080' : UI.ink); }
      });
    }
    if (M.mode === 'status') {
      const m = G.party[M.who]; const s = stats(m); const h = HEROES[m.id];
      win(0, 0, 256, 224); ctx.drawImage(SPR[m.id].hb.win, 30, 22, HB_W, HB_H);
      text(h.name, 76, 12, UI.ink, 11, 'left', 't'); text(h.job, 76, 28, UI.muted); text('Lv ' + m.lv, 180, 12, UI.gold, 10);
      text(`HP ${m.hp}/${s.maxhp}`, 76, 44); text(`MP ${m.mp}/${s.maxmp}`, 160, 44);
      [['ちから', s.str], ['こうげき', s.atk], ['ぼうぎょ', s.def], ['まりょく', s.mag], ['まほうぼうぎょ', s.mdf], ['すばやさ', s.spd]].forEach(([lb, v], j) => { text(lb, 20, 72 + j * 15, UI.label); text(String(v), 120, 72 + j * 15, UI.ink, 8, 'right'); });
      text('経験値', 140, 72, UI.label); text(String(m.exp), 240, 84, UI.ink, 8, 'right');
      text('次のレベルまで', 140, 100, UI.label); text(String(Math.max(0, expAt(m.lv + 1) - m.exp)), 240, 112, UI.ink, 8, 'right');
      text('武器 ' + ITEMS[m.weapon].name, 20, 168); text('防具 ' + ITEMS[m.armor].name, 20, 182);
      text('覚えたわざ: ' + skillsOf(m).map(id => SKILLS[id].name).join(' '), 20, 200, UI.muted, 7);
    }
    if (M.msg && M.msgT > 0) { const w = textW(M.msg) + 24; win((SW - w) / 2, 96, w, 24); text(M.msg, SW / 2, 104, UI.ink, 8, 'center'); }
  },
  eqDesc(it) { const who = it.eq.map(id => HEROES[id].name).join('・'); const st = [it.atk && '攻撃+' + it.atk, it.def && '防御+' + it.def, it.mag && '魔力+' + it.mag, it.mdf && '魔防+' + it.mdf, it.spd && '素早さ+' + it.spd].filter(Boolean).join(' '); return `${st}  (${who})`; },
};

// ===================== SHOP =====================
const Shop = {
  active: false,
  open(id, cb) { this.active = true; this.cb = cb; this.list = SHOPS[id]; this.mode = 'top'; this.i = 0; this.li = 0; this.qty = 1; this.msg = 'いらっしゃいませ!'; },
  close() { this.active = false; const cb = this.cb; this.cb = null; cb && cb(); },
  sellList() { return Object.keys(G.inv); },
  sellPrice(id) { const p = ITEMS[id].price; return p ? Math.floor(p / 2) : 500; },
  update() {
    const nav = (len) => { if (Input.rep('up')) { this.li = (this.li - 1 + len) % len; Audio8.sfx('cursor'); } if (Input.rep('down')) { this.li = (this.li + 1) % len; Audio8.sfx('cursor'); } };
    if (this.mode === 'top') {
      if (Input.rep('left')) { this.i = (this.i + 2) % 3; Audio8.sfx('cursor'); } if (Input.rep('right')) { this.i = (this.i + 1) % 3; Audio8.sfx('cursor'); }
      if (Input.rep('up')) { this.i = (this.i + 2) % 3; Audio8.sfx('cursor'); } if (Input.rep('down')) { this.i = (this.i + 1) % 3; Audio8.sfx('cursor'); }
      if (Input.pressed.b) { Audio8.sfx('cancel'); this.close(); return; }
      if (Input.pressed.a) { Audio8.sfx('ok'); if (this.i === 2) { this.close(); return; } this.mode = this.i === 0 ? 'buy' : 'sell'; this.li = 0; this.msg = this.i === 0 ? 'どれになさいますか?' : 'どれを売ってくれるんだい?'; if (this.mode === 'sell' && !this.sellList().length) { this.mode = 'top'; this.msg = '売れるものがないようだね。'; } }
      return;
    }
    if (this.mode === 'buy' || this.mode === 'sell') {
      const list = this.mode === 'buy' ? this.list : this.sellList();
      if (!list.length) { this.mode = 'top'; return; }
      if (this.li >= list.length) this.li = list.length - 1;
      nav(list.length);
      if (Input.pressed.b) { Audio8.sfx('cancel'); this.mode = 'top'; this.msg = 'ほかに何か?'; return; }
      if (Input.pressed.a) { Audio8.sfx('ok'); this.qty = 1; this.mode += 'Qty'; }
      return;
    }
    if (this.mode === 'buyQty' || this.mode === 'sellQty') {
      const buy = this.mode === 'buyQty'; const id = buy ? this.list[this.li] : this.sellList()[this.li];
      const price = buy ? ITEMS[id].price : this.sellPrice(id);
      const max = buy ? Math.max(1, Math.min(99 - (G.inv[id] || 0), Math.floor(G.gil / price))) : (G.inv[id] || 1);
      if (Input.rep('right') || Input.rep('up')) { this.qty = Math.min(max, this.qty + (Input.rep('up') ? 1 : 1)); Audio8.sfx('cursor'); }
      if (Input.rep('left') || Input.rep('down')) { this.qty = Math.max(1, this.qty - 1); Audio8.sfx('cursor'); }
      if (Input.pressed.b) { Audio8.sfx('cancel'); this.mode = buy ? 'buy' : 'sell'; return; }
      if (Input.pressed.a) {
        const total = price * this.qty;
        if (buy) {
          if (G.gil < total || (G.inv[id] || 0) + this.qty > 99) { Audio8.sfx('error'); this.msg = 'お金が足りないよ!'; this.mode = 'buy'; return; }
          G.gil -= total; addItem(id, this.qty); Audio8.sfx('buy'); this.msg = ITEMS[id].type !== 'use' ? 'まいど! メニューの「そうび」で装備してね。' : 'まいどあり!'; this.mode = 'buy';
        } else { G.gil += total; removeItem(id, this.qty); Audio8.sfx('buy'); this.msg = 'ありがとよ!'; this.mode = this.sellList().length ? 'sell' : 'top'; }
      }
    }
  },
  draw() {
    ctx.fillStyle = 'rgba(4,4,14,.55)'; ctx.fillRect(0, 0, SW, SH);
    win(0, 0, 256, 24); text(this.msg, 10, 7);
    win(0, 24, 256, 22); ['かう', 'うる', 'やめる'].forEach((c, i) => { text(c, 24 + i * 70, 30); if (this.mode === 'top') Touch.add(8 + i * 70, 25, 64, 18, () => { this.i = i; Input.tapA(); }); }); if (this.mode === 'top') cursor(10 + this.i * 70, 31);
    win(0, 46, 176, 22); text(this.mode === 'top' ? '何をしますか?' : this.mode.startsWith('buy') ? 'かう' : 'うる', 10, 52, UI.muted);
    win(176, 46, 80, 22); text(G.gil + ' G', 248, 52, UI.ink, 8, 'right');
    if (this.mode === 'top') return;
    const buy = this.mode.startsWith('buy'); const list = buy ? this.list : this.sellList();
    win(0, 68, 256, 108);
    const scroll = Math.max(0, this.li - 5);
    list.slice(scroll, scroll + 6).forEach((id, k) => {
      if (this.mode === 'buy' || this.mode === 'sell') Touch.add(0, 72 + k * 16, 256, 16, () => { this.li = scroll + k; Input.tapA(); });
      const it = ITEMS[id]; const price = buy ? it.price : this.sellPrice(id);
      const y = 76 + k * 16; const afford = !buy || G.gil >= price;
      text(it.name, 22, y, afford ? UI.ink : UI.dim); text(price + 'G', 196, y, afford ? UI.ink : UI.dim, 8, 'right'); text('所持 ' + (G.inv[id] || 0), 248, y, UI.muted, 7, 'right');
    });
    cursor(8, 77 + (this.li - scroll) * 16);
    win(0, 176, 256, 48);
    const id = list[this.li]; if (!id) return; const it = ITEMS[id];
    if (it.type === 'use') text(it.desc, 10, 184);
    else {
      text(Menu.eqDesc(it), 10, 182, UI.ink, 7);
      G.party.forEach((m, i) => {
        const x = 10 + i * 62; if (!it.eq.includes(m.id)) { text(HEROES[m.id].name + ' ×', x, 200, UI.dim, 7); return; }
        const cur = stats(m); const tmp = { ...m }; tmp[it.type] = id; const nv = stats(tmp);
        const k = it.type === 'weapon' ? (it.atk ? 'atk' : 'mag') : 'def'; const d = nv[k] - cur[k];
        text(`${HEROES[m.id].name} ${d > 0 ? '+' + d : d}`, x, 200, d > 0 ? UI.hp : d < 0 ? '#ff7080' : UI.ink, 7);
      });
    }
    if (this.mode.endsWith('Qty')) {
      const price = buy ? it.price : this.sellPrice(id);
      win(64, 96, 128, 44); text(`${it.name}`, 128, 102, UI.ink, 8, 'center'); text(`◀ ${this.qty}個 ▶   ${price * this.qty}G`, 128, 118, UI.gold, 8, 'center');
    }
  },
};

// ===================== TITLE / GAME OVER / ENDING =====================
const STARS = Array.from({ length: 90 }, (_, i) => ({ x: (i * 97 + (i * i) % 13) % SW, y: (i * 53) % 120, s: (i % 3) + 1, ph: i * 1.7 }));
// HD-2D style scene: layered night sky, mountains, the crystal tower, and the two heroes on a hill
function drawScene(t, dawn = 0) {
  beginWorld('#05061a');
  const sky = ctx.createLinearGradient(0, 0, 0, 150);
  sky.addColorStop(0, dawn ? '#1a2a5a' : '#070a24'); sky.addColorStop(0.6, dawn ? '#6a5a9a' : '#1c1d4e'); sky.addColorStop(1, dawn ? '#f0a070' : '#4a3a7a');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, SW, 160);
  for (const st of STARS) { const a = 0.4 + 0.6 * Math.abs(Math.sin(t / 50 + st.ph)); ctx.globalAlpha = a * (dawn ? 0.4 : 1); ctx.fillStyle = st.s === 3 ? '#fff6d8' : '#c8d0ff'; ctx.fillRect(st.x, st.y, 1, 1); }
  ctx.globalAlpha = 1;
  const ridge = (base, amp, col, seed, drift) => { const r = mulberry(seed); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, SH); let y = base; for (let x = -8; x <= SW + 8; x += 8) { y = base - Math.abs(Math.sin(x / 37 + seed)) * amp - r() * 6; ctx.lineTo(x + Math.round(drift), Math.round(y)); } ctx.lineTo(SW, SH); ctx.fill(); };
  ridge(130, 34, dawn ? '#5a4a7a' : '#22204a', 3, Math.sin(t / 400) * 2);
  // tower
  const tx = 168; ctx.fillStyle = dawn ? '#3a3058' : '#141432'; ctx.fillRect(tx, 46, 14, 100); ctx.fillRect(tx - 3, 60, 20, 4); ctx.fillRect(tx - 3, 96, 20, 4); ctx.fillRect(tx + 2, 38, 10, 10);
  ctx.fillStyle = dawn ? '#4a4070' : '#1e1e44'; ctx.fillRect(tx, 46, 4, 100);
  const cg = 0.7 + 0.3 * Math.sin(t / 25); ctx.fillStyle = `rgba(127,230,255,${cg})`; ctx.beginPath(); ctx.moveTo(tx + 7, 26); ctx.lineTo(tx + 11, 33); ctx.lineTo(tx + 7, 40); ctx.lineTo(tx + 3, 33); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(tx + 6, 30, 1, 4);
  addLight(tx + 7, 33, 140, '#7fe6ff', cg);
  ridge(150, 22, dawn ? '#3a3050' : '#141030', 9, Math.sin(t / 300) * 3);
  // foreground hill
  ctx.fillStyle = dawn ? '#2a3a2a' : '#0c1418'; ctx.beginPath(); ctx.moveTo(0, SH); ctx.lineTo(0, 178); ctx.quadraticCurveTo(70, 158, 140, 170); ctx.quadraticCurveTo(200, 180, SW, 172); ctx.lineTo(SW, SH); ctx.fill();
  const r = mulberry(5); for (let i = 0; i < 40; i++) { const x = r() * SW, y = 172 + r() * 50; ctx.fillStyle = r() < 0.5 ? (dawn ? '#3a5a3a' : '#16242a') : (dawn ? '#4a6a40' : '#1c2e30'); ctx.fillRect(x, y, 1, 2 + r() * 2); }
  const hero = (id, x, y) => ctx.drawImage(dawn ? SPR[id].up[0] : nightSprite(id), x, y);
  hero('allen', 66, 148); hero('lina', 82, 150);
  if (dawn) { hero('kai', 50, 152); hero('zek', 98, 152); }
  else { // a shooting star every few seconds
    const k = t % 240; if (k < 26) { const sx = 40 + ((t / 240) | 0) * 67 % 150, sy = 8 + ((t / 240) | 0) * 29 % 40, q = k / 26;
      const g = ctx.createLinearGradient(sx + q * 60 - 18, sy + q * 22 - 7, sx + q * 60, sy + q * 22); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,250,230,${1 - q})`);
      ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx + q * 60 - 18, sy + q * 22 - 7); ctx.lineTo(sx + q * 60, sy + q * 22); ctx.stroke(); } }
  postWorld(dawn ? { ...ENV.title, grade: ['#ffb070', 0.14] } : ENV.title);
}
// heroes seen from behind at night: shaded toward the sky colour so white clothes don't bloom out
const NIGHT = {};
function nightSprite(id) {
  if (NIGHT[id]) return NIGHT[id];
  const src = SPR[id].up[0], c = mkCanvas(src.width, src.height), x = c.getContext('2d');
  x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(26,30,80,.72)'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = 'rgba(160,200,255,.35)'; x.fillRect(0, 0, c.width, 2);
  return (NIGHT[id] = c);
}
function drawCrystal(cx, cy, sc, t) {
  ctx.save(); ctx.translate(cx, cy); ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 50 * sc); glow.addColorStop(0, 'rgba(127,224,255,.4)'); glow.addColorStop(1, 'rgba(127,224,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(-60 * sc, -60 * sc, 120 * sc, 120 * sc); ctx.globalCompositeOperation = 'source-over';
  const y = Math.sin(t / 30) * 3;
  const P = (pts, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(pts[0] * sc, pts[1] * sc + y); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] * sc, pts[i + 1] * sc + y); ctx.closePath(); ctx.fill(); };
  P([0, -34, 14, -8, 0, 34, -14, -8], '#4aa0e0'); P([0, -34, 0, 34, -14, -8], '#7fd0ff'); P([0, -34, 5, -8, 0, 20, -5, -8], '#e8fbff');
  ctx.restore();
}
function drawLogo(y, a = 1) {
  ctx.save(); ctx.globalAlpha = a;
  ctx.font = `800 24px ${FONT_T}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,210,140,.25)';
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.fillText('CRYSTAL ECHO', 128 + dx, y + dy);
  ctx.globalCompositeOperation = 'source-over';
  const g = ctx.createLinearGradient(0, y, 0, y + 24); g.addColorStop(0, '#fff6dc'); g.addColorStop(0.55, '#f0cf86'); g.addColorStop(1, '#b8863e');
  ctx.fillStyle = 'rgba(8,6,20,.8)'; ctx.fillText('CRYSTAL ECHO', 128.7, y + 0.8);
  ctx.fillStyle = g; ctx.fillText('CRYSTAL ECHO', 128, y);
  ctx.fillStyle = 'rgba(216,183,112,.7)'; ctx.fillRect(56, y + 29, 144, 0.5);
  ctx.restore();
  text('クリスタル・エコー', 128, y + 32, '#e6dccb', 8, 'center', 't');
}
const Title = {
  i: 0, t: 0,
  start() { G.scene = Title; this.t = 0; this.i = hasSave() ? 1 : 0; Audio8.play('title'); G.fadeTarget = 0; },
  update() {
    this.t++;
    const n = 2;
    if (Input.rep('up') || Input.rep('down')) { this.i = (this.i + 1) % n; Audio8.sfx('cursor'); }
    if (Input.pressed.a) {
      if (this.i === 1 && !hasSave()) { Audio8.sfx('error'); return; }
      Audio8.sfx('ok');
      if (this.i === 0) transition(() => newGame());
      else transition(() => { if (!loadGame()) newGame(); });
    }
  },
  draw() {
    drawScene(this.t);
    drawLogo(40, Math.min(1, this.t / 60));
    const opts = ['はじめから', 'つづきから'];
    opts.forEach((o, i) => { text(o, 114, 104 + i * 15, i === 1 && !hasSave() ? UI.dim : this.i === i ? UI.gold : UI.ink, 8.5, 'left', 't'); Touch.add(84, 99 + i * 15, 100, 15, () => { this.i = i; Input.tapA(); }); });
    cursor(100, 105 + this.i * 15);
    text(TOUCH ? 'スワイプで移動・タップで決定　音が出ます' : 'A / Z で決定　　音が出ます', 128, 210, 'rgba(230,220,200,.55)', 6.5, 'center');
  },
};
const GameOver = {
  i: 0, t: 0, retry: null, opts: [],
  start(retry) {
    G.scene = GameOver; this.t = 0; this.i = 0; G.fadeLevel = 0; G.fadeTarget = 0; G.dialog = null; G.menu = null; this.retry = retry || null;
    if (!this.retry) G.script = null;
    this.opts = [];
    if (this.retry) this.opts.push(['もう一度たたかう(全回復)', 'retry']);
    this.opts.push([hasSave() ? 'セーブした所から' : 'はじめから', 'load'], ['タイトルへ', 'title']);
  },
  update() {
    this.t++; if (this.t < 60) return;
    const n = this.opts.length;
    if (Input.rep('up')) { this.i = (this.i + n - 1) % n; Audio8.sfx('cursor'); }
    if (Input.rep('down')) { this.i = (this.i + 1) % n; Audio8.sfx('cursor'); }
    if (Input.pressed.a) {
      Audio8.sfx('ok'); const act = this.opts[this.i][1];
      if (act === 'retry') {
        // start the same fight again with the party as it was, fully healed
        const r = this.retry; G.party = JSON.parse(r.snap.party); G.inv = { ...r.snap.inv }; G.gil = r.snap.gil; healAll(); G.script = r.script; G.scene = Field; Field.enter(G.mapId, G.p.x, G.p.y, G.p.dir, true);
        startBattle(r.cfg, r.cb);
      } else if (act === 'load' && hasSave()) { G.script = null; transition(() => loadGame()); }
      else { G.script = null; transition(() => Title.start()); }
    }
  },
  draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SW, SH);
    ctx.globalAlpha = Math.min(1, this.t / 60); text('GAME OVER', 128, 76, '#e06070', 18, 'center', 't'); ctx.globalAlpha = 1;
    if (this.t >= 60) { this.opts.forEach((o, i) => { text(o[0], 82, 118 + i * 16, this.i === i ? UI.gold : UI.ink); Touch.add(60, 115 + i * 16, 150, 16, () => { this.i = i; Input.tapA(); }); }); cursor(68, 119 + this.i * 16); }
  },
};
const ENDING_LINES = [
  '', '風のクリスタルは輝きを取り戻し', '世界に再び、やさしい風が吹いた。', '',
  'エルムの丘の墓には', '今も毎朝、新しい花が供えられている。', 'その横で、直った風車が回っている。', '',
  'アレンは父の剣を壁に掛け', 'その横に、自分の剣を並べた。', '「いってきます」と言える場所を', '守るために。', '',
  'リナは村の教会で', 'クリスタルの声に耳をすませている。', 'あれから一度も、あの声は聞こえない。', 'それでいいのだと、彼女は笑う。', '',
  'カイは親方の地図を描き直し', '余白に、自分の名前を書き足した。', '',
  'ゼクは塔に残り', '兄の遺した研究を', '光をもう一度灯すために使っている。', '塔の窓辺には、小さな花が二輪。', '',
  '失ったものは、戻らない。', 'けれど、想いはこだまのように', '誰かの胸で、もう一度鳴る。', '',
  'そして風は', '今日も大地をめぐる——', '', '',
  '— CRYSTAL ECHO —', '', 'シナリオ・プログラム・ドット絵・音楽', 'Claude', '', 'Special Thanks', 'あなた', '', '', '',
];
const Ending = {
  t: 0,
  start() { G.scene = Ending; this.t = 0; Audio8.play('ending'); G.fadeLevel = 1; G.fadeTarget = 0; },
  update() { this.t++; const end = ENDING_LINES.length * 16 * 2.4 + 260; if (this.t > end && Input.pressed.a) { transition(() => Title.start()); } },
  draw() {
    drawScene(this.t, 1);
    ctx.fillStyle = 'rgba(4,4,14,.35)'; ctx.fillRect(0, 0, SW, SH);
    const off = SH - this.t / 2.4;
    ENDING_LINES.forEach((l, i) => {
      let y = off + i * 16 + 60; const last = i === ENDING_LINES.length - 1;
      if (last) y = Math.max(y, 96);
      if ((y < 40 || y > 210) && !last) return; const a = last ? 1 : clamp((y - 40) / 24, 0, 1) * clamp((210 - y) / 20, 0, 1);
      ctx.globalAlpha = a; if (last) drawLogo(y - 30); else text(l, 128, y, '#f3ede0', 8.5, 'center', 't'); ctx.globalAlpha = 1;
    });
    if (this.t > ENDING_LINES.length * 16 * 2.4 + 260) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(G.frame / 10); text('A:タイトルへ', 128, 200, UI.gold, 7, 'center'); ctx.globalAlpha = 1; }
  },
};
