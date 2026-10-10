// ===================== HD ENEMY ART, part 2 (see hd_enemies.js) =====================
Object.assign(HD_ENEMY, {
  bat(a) {
    return hdEnemyCanvas(50, 34, (x, K) => {
      const f = Math.sin(a), cx = 25, cy = 18;
      for (const k of [-1, 1]) {
        const tip = 6 - f * 9, mid = 14 - f * 4;
        K.shape([[cx + k * 4, cy - 3], [cx + k * 14, mid - 7], [cx + k * 24, tip], [cx + k * 21, tip + 8], [cx + k * 17, mid + 6], [cx + k * 13, mid + 2], [cx + k * 9, cy + 6]], '#5a3a82', { gx0: cx - 24, gx1: cx + 24, lt: k < 0 ? '#8a62b8' : '#6a46a0', dk: '#34204e', lw: 1.1 });
        K.line(cx + k * 5, cy - 2, cx + k * 24, tip, '#a888d0', 0.9); K.line(cx + k * 13, mid - 3, cx + k * 17, mid + 6, '#8a68b0', 0.8);
      }
      K.shape([[cx - 6, cy - 5], [cx - 4, cy - 14], [cx - 1, cy - 6]], '#6a46a0', { lw: 0.9 }); K.shape([[cx + 6, cy - 5], [cx + 4, cy - 14], [cx + 1, cy - 6]], '#4a2c78', { lw: 0.9 });
      x.fillStyle = '#e898b8'; x.beginPath(); x.moveTo(cx - 4.6, cy - 7); x.lineTo(cx - 4, cy - 11); x.lineTo(cx - 2.6, cy - 7); x.fill();
      K.ell(cx, cy + 1.5, 8, 9, '#6a46a0', { lt: '#9a74c8', dk: '#34204e', lw: 1.1 });
      K.eye(cx - 3.6, cy - 1.4, 2.6, 3, '#ff3050', { pr: 0.9 }); K.eye(cx + 3.6, cy - 1.4, 2.6, 3, '#ff3050', { pr: 0.9 });
      x.fillStyle = '#3a1030'; x.beginPath(); x.ellipse(cx, cy + 5, 3, 1.8, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.fillRect(cx - 2, cy + 5, 1, 2); x.fillRect(cx + 1, cy + 5, 1, 2);
      K.shape([[cx - 3, cy + 9], [cx - 1, cy + 9], [cx - 2, cy + 13]], '#4a2c78', { lw: 0.8 }); K.shape([[cx + 1, cy + 9], [cx + 3, cy + 9], [cx + 2, cy + 13]], '#4a2c78', { lw: 0.8 });
    }, '#140a1c');
  },
  wolf(a) { // drawn facing right, flipped for the party by the caller
    return hdEnemyCanvas(58, 40, (x, K) => {
      const f = Math.sin(a), g = '#8a94a8';
      x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(28, 38, 20, 2.2, 0, 0, 7); x.fill();
      K.shape([[8, 22], [1, 14 - f], [3, 8 - f], [9, 16], [11, 20]], '#6a7488', { gx0: 0, gx1: 12, lw: 1 }); // tail
      for (const lx of [10, 40]) K.shape([[lx, 28], [lx + 6, 28], [lx + 6, 37], [lx - 1, 37]], '#5a6478', { gx0: lx - 1, gx1: lx + 6, lw: 1 });
      K.shape([[8, 20], [14, 12], [34, 12], [44, 18], [44, 29], [8, 30]], g, { gx0: 8, gx1: 44, lt: '#c4ccdc', dk: '#566074', lw: 1.2 }); // body
      for (let i = 0; i < 5; i++) K.shape([[14 + i * 6, 13], [16 + i * 6, 7 - (i % 2), 19 + i * 6, 13]], '#566074', { lw: 0.8 }); // mane spikes
      for (const lx of [16, 34]) K.shape([[lx, 28], [lx + 6, 28], [lx + 6, 38], [lx - 1, 38]], g, { gx0: lx - 1, gx1: lx + 6, lt: '#c4ccdc', lw: 1 });
      K.shape([[40, 14], [50, 11], [57, 18 + f * 0.5], [55, 24], [46, 25], [40, 24]], g, { gx0: 40, gx1: 57, lt: '#d6dcea', lw: 1.2 }); // head
      K.shape([[41, 13], [43, 5], [46, 12]], '#566074', { lw: 0.9 }); K.shape([[46, 12], [49, 5], [51, 12]], '#6a7488', { lw: 0.9 });
      K.ell(56, 19, 1.8, 1.6, '#14101c', { lw: 0.5 }); K.shape([[46, 24], [56, 22.5], [55, 27], [47, 27]], '#e8ecf4', { lw: 0.8 });
      x.fillStyle = '#fff'; x.beginPath(); x.moveTo(49, 24.4); x.lineTo(50.4, 28.4); x.lineTo(51.8, 24.4); x.fill(); x.beginPath(); x.moveTo(53, 23.8); x.lineTo(54, 27); x.lineTo(55, 23.6); x.fill();
      x.fillStyle = '#ffd848'; x.beginPath(); x.ellipse(48.6, 17, 2.2, 1.8, 0.4, 0, 7); x.fill(); x.fillStyle = '#1a1008'; x.fillRect(48.2, 15.6, 0.9, 2.8); x.strokeStyle = '#14101c'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(45.4, 14.6); x.lineTo(51.4, 17); x.stroke();
    }, '#101420');
  },
  bee(a) {
    return hdEnemyCanvas(42, 36, (x, K) => {
      const f = Math.sin(a * 2);
      for (const [wx, wy, r] of [[18, 6, f], [26, 5, -f]]) { x.fillStyle = 'rgba(210,235,255,.85)'; x.beginPath(); x.ellipse(wx, wy + 1, 5, 9 + r * 2.5, wx < 22 ? -0.35 : 0.35, 0, 7); x.fill(); x.strokeStyle = '#6a8aaa'; x.lineWidth = 0.9; x.stroke(); }
      K.ell(26, 22, 14, 9, '#f0b820', { lt: '#ffe070', dk: '#c07810', lw: 1.2 });
      for (const sx of [21, 28, 35]) K.shape([[sx, 14], [sx + 3, 14], [sx + 3, 30], [sx, 30]], '#2a1a10', { lw: 0.5 });
      K.shape([[39, 20], [42, 22], [39, 26]], '#2a1a10', { lw: 0.8 }); // stinger
      K.ell(11, 21, 8.4, 8, '#c84020', { lt: '#f07048', dk: '#802410', lw: 1.2 });
      K.eye(7.6, 19, 3.2, 3.6, '#ffe848', { pr: 0.9 }); K.eye(14.4, 19, 2.6, 3.4, '#ffe848', { pr: 0.9 });
      K.line(2.4, 14, 5, 9, '#2a1a10', 0.9); K.line(13, 13, 15, 8, '#2a1a10', 0.9);
      x.fillStyle = '#fff'; x.fillRect(6, 25.4, 1, 1.6); x.fillRect(9, 25.4, 1, 1.6); x.fillStyle = '#4a1008'; x.fillRect(5.6, 24.6, 5, 1);
      for (const lx of [22, 28, 34]) K.line(lx, 30, lx - 1.6, 34, '#2a1a10', 1);
    }, '#2a1408');
  },
  skeleton(a) {
    return hdEnemyCanvas(40, 54, (x, K) => {
      const b = Math.sin(a) * 0.8, bone = '#ece4d0';
      x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(20, 52.5, 11, 1.8, 0, 0, 7); x.fill();
      for (const lx of [14, 24]) { K.shape([[lx - 1.4, 36], [lx + 1.4, 36], [lx + 1.2, 49], [lx - 1.2, 49]], bone, { gx0: lx - 2, gx1: lx + 2, lw: 0.9 }); K.shape([[lx - 3.4, 49], [lx + 3.4, 49], [lx + 4, 52.2], [lx - 3.4, 52.2]], '#d8cfb8', { lw: 0.9 }); }
      K.shape([[11, 34 + b], [29, 34 + b], [27, 39], [13, 39]], '#4a3a2a', { lw: 1 }); // tattered loincloth
      for (let i = 0; i < 4; i++) K.shape([[13 - i * 0.4, 25 + b + i * 2.4], [27 + i * 0.4, 25 + b + i * 2.4], [27, 26.6 + b + i * 2.4], [13, 26.6 + b + i * 2.4]], bone, { lw: 0.7 });
      K.line(20, 23 + b, 20, 35 + b, '#cfc6ae', 1.4);
      // round wooden shield on the near arm, short sword in the far hand
      K.line(11, 25 + b, 6, 33 + b, bone, 2.2); K.ell(6, 33 + b, 6.6, 6.6, '#8a5a2a', { lt: '#b88448', dk: '#5a3818', lw: 1.2 }); K.ell(6, 33 + b, 2, 2, '#c8c8d8', { lw: 0.7 });
      K.line(29, 25 + b, 33, 17 + b, bone, 2.2); K.shape([[32, 18 + b], [34.4, 18 + b], [34.2, 3 + b], [33, 1 + b], [31.8, 3 + b]], '#cfd6e6', { gx0: 31, gx1: 35, lt: '#fff', dk: '#8a94b0', lw: 0.9 }); K.shape([[30, 18 + b], [37, 18 + b], [37, 19.8 + b], [30, 19.8 + b]], '#a8782a', { lw: 0.7 });
      // big round skull
      K.ell(20, 13 + b, 10, 9.4, bone, { lt: '#fffdf0', dk: '#c4b99c', lw: 1.2 }); K.shape([[14, 20 + b], [26, 20 + b], [25, 25 + b], [15, 25 + b]], '#d8cfb8', { lw: 1 });
      for (const ex of [15.6, 24.4]) { x.fillStyle = '#16101c'; x.beginPath(); x.ellipse(ex, 13 + b, 3.2, 3.8, 0, 0, 7); x.fill(); x.fillStyle = '#ff5040'; x.beginPath(); x.ellipse(ex, 13.4 + b, 1.2, 1.4, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.fillRect(ex - 0.8, 12 + b, 0.7, 0.7); }
      x.fillStyle = '#16101c'; x.beginPath(); x.moveTo(19, 17.4 + b); x.lineTo(20, 19.6 + b); x.lineTo(21, 17.4 + b); x.fill();
      x.strokeStyle = '#16101c'; x.lineWidth = 0.8; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(15.6 + i * 2.2, 21.4 + b); x.lineTo(15.6 + i * 2.2, 24.4 + b); x.stroke(); }
    }, '#1a1620');
  },
  golem(a) {
    return hdEnemyCanvas(64, 68, (x, K) => {
      const b = Math.sin(a) * 0.8, st = '#a8805a', mos = '#5aa040';
      x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(32, 66, 24, 2.6, 0, 0, 7); x.fill();
      for (const lx of [16, 36]) K.shape([[lx, 48], [lx + 14, 48], [lx + 15, 66], [lx - 1, 66]], st, { gx0: lx, gx1: lx + 15, lt: '#d0a878', dk: '#5a3e28', lw: 1.3 });
      K.shape([[8, 20 + b], [56, 20 + b], [52, 52], [12, 52]], st, { gx0: 8, gx1: 56, lt: '#d0a878', dk: '#5a3e28', lw: 1.4 });
      for (const [bx, by_, bw, bh] of [[14, 26, 12, 8], [34, 24, 14, 10], [20, 40, 14, 8], [40, 40, 10, 8]]) K.shape([[bx, by_ + b], [bx + bw, by_ + b], [bx + bw, by_ + bh + b], [bx, by_ + bh + b]], '#8a6444', { lw: 0.8 });
      for (const [mx, my, mw] of [[12, 21, 14], [38, 22, 10], [20, 49, 8], [8, 36, 5]]) K.shape([[mx, my + b], [mx + mw, my + b], [mx + mw - 2, my + 3 + b], [mx + 2, my + 3.4 + b]], mos, { lw: 0.7, lt: '#8ad060', dk: '#2a6a20' });
      for (const k of [-1, 1]) { const sx = 32 + k * 28; K.shape([[sx - 8, 20 + b], [sx + 8, 20 + b], [sx + 10, 38 + b], [sx - 10, 38 + b]], st, { gx0: sx - 10, gx1: sx + 10, lt: '#d0a878', dk: '#5a3e28', lw: 1.3 }); K.shape([[sx - 8, 38 + b], [sx + 8, 38 + b], [sx + 7, 52 + b], [sx - 7, 52 + b]], '#8a6444', { gx0: sx - 8, gx1: sx + 8, lw: 1.2 }); }
      K.shape([[24, 4 + b], [42, 4 + b], [44, 20 + b], [22, 20 + b]], st, { gx0: 22, gx1: 44, lt: '#d0a878', dk: '#5a3e28', lw: 1.4 });
      for (const ex of [28.4, 37.6]) { x.fillStyle = '#10181c'; x.fillRect(ex - 3.4, 9 + b, 6.8, 4.4); x.fillStyle = '#40f0ff'; x.fillRect(ex - 2.4, 10 + b, 4.8, 2.4); x.fillStyle = '#fff'; x.fillRect(ex - 1.6, 10 + b, 1.2, 1); }
      K.line(28, 17 + b, 38, 17 + b, '#3a2818', 1.1);
      const gl = 0.55 + 0.45 * Math.sin(a * 2); x.fillStyle = `rgba(80,255,150,${0.35 * gl})`; x.beginPath(); x.arc(32, 32 + b, 9, 0, 7); x.fill(); K.ell(32, 32 + b, 5.2, 5.2, '#30e080', { lt: '#c0ffd8', dk: '#108050', lw: 1 });
    }, '#1a120c');
  },
  specter(a) {
    return hdEnemyCanvas(48, 56, (x, K) => {
      const w = Math.sin(a), hy = 4 + w;
      const tail = [[8, 28 + hy], [3, 38, 6, 48 + w * 2, 10, 54]]; 
      K.shape([[8, 26 + hy], [10, 8 + hy, 24, 2 + hy, 38, 8 + hy], [42, 26 + hy], [42, 48], [37, 53 + w * 2], [32, 47], [27, 55 + w], [22, 47], [16, 54 - w], [11, 47], [6, 50], [6, 40]], '#c8b8f0', { gx0: 6, gx1: 42, lt: '#f4eeff', dk: '#8a78c0', lw: 1.3 });
      for (const k of [-1, 1]) K.shape([[24 + k * 17, 30 + hy], [24 + k * 24, 38 + hy + w * 2], [24 + k * 20, 46 + hy], [24 + k * 15, 38 + hy]], '#bcacec', { gx0: 4, gx1: 44, lw: 1 });
      for (const ex of [17, 31]) { x.fillStyle = '#12082a'; x.beginPath(); x.ellipse(ex, 20 + hy, 4, 5.6, 0, 0, 7); x.fill(); x.fillStyle = '#9a70ff'; x.beginPath(); x.ellipse(ex, 21 + hy, 1.7, 2.4, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.fillRect(ex - 1.4, 18.4 + hy, 1.2, 1.4); }
      x.fillStyle = '#12082a'; x.beginPath(); x.ellipse(24, 32 + hy, 3.4, 5, 0, 0, 7); x.fill(); x.fillStyle = '#5a3a9a'; x.beginPath(); x.ellipse(24, 34 + hy, 2, 2.6, 0, 0, 7); x.fill();
      x.fillStyle = 'rgba(255,150,200,.4)'; x.beginPath(); x.ellipse(11, 28 + hy, 2.4, 1.3, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(37, 28 + hy, 2.4, 1.3, 0, 0, 7); x.fill();
    }, '#201046');
  },
  darkmage(a) {
    return hdEnemyCanvas(44, 56, (x, K) => {
      const b = Math.sin(a) * 0.8, gl = 0.5 + 0.5 * Math.sin(a * 2);
      x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(20, 54.5, 13, 2, 0, 0, 7); x.fill();
      K.shape([[36, 54], [37, 16 + b], [38.4, 16 + b], [38, 54]], '#6a4a2a', { gx0: 36, gx1: 39, lw: 0.8 }); x.fillStyle = `rgba(255,110,200,${0.3 + gl * 0.3})`; x.beginPath(); x.arc(37.6, 12 + b, 7, 0, 7); x.fill(); K.ell(37.6, 12 + b, 3.6, 3.6, '#ff70c0', { lt: '#ffd8f0', dk: '#a02878', lw: 1 });
      K.shape([[20, 14 + b], [11, 24 + b, 6, 40, 3, 54], [38, 54], [32, 40, 30, 24, 20, 14 + b]], '#3a2a6a', { gx0: 3, gx1: 38, lt: '#6a52b0', dk: '#1a1034', lw: 1.3 });
      for (const k of [-1, 1]) K.line(20 + k * 4, 30 + b, 20 + k * 9, 52, '#251848', 0.9);
      K.shape([[8, 50], [34, 50], [36, 54.6], [3, 54.6]], '#e8c040', { lw: 0.6 });
      K.shape([[31, 28 + b], [35, 30 + b], [36, 36 + b], [31, 35 + b]], '#2a1c52', { lw: 0.9 }); K.ell(35.4, 36 + b, 2.4, 2.4, '#d8c0a8', { lw: 0.6 });
      K.shape([[20, 4 + b], [28, 14 + b], [27, 28 + b], [13, 28 + b], [12, 14 + b]], '#2a1c52', { gx0: 12, gx1: 28, lt: '#4a38a0', dk: '#120a28', lw: 1.3 }); // hood
      x.fillStyle = '#0a0614'; x.beginPath(); x.ellipse(20, 20 + b, 6.4, 7.4, 0, 0, 7); x.fill();
      for (const ex of [17.4, 22.6]) { x.fillStyle = '#ffb030'; x.beginPath(); x.ellipse(ex, 20 + b, 1.9, 1.5, 0, 0, 7); x.fill(); x.fillStyle = '#fff4c0'; x.fillRect(ex - 0.6, 19.4 + b, 1.2, 0.8); }
    }, '#0c0818');
  },
  armor(a) {
    return hdEnemyCanvas(52, 64, (x, K) => {
      const b = Math.sin(a) * 0.8, st = '#c8d0e0';
      x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(24, 62.5, 15, 2.2, 0, 0, 7); x.fill();
      for (const lx of [14, 28]) { K.shape([[lx, 42], [lx + 10, 42], [lx + 10, 58], [lx, 58]], st, { gx0: lx, gx1: lx + 10, lt: '#f4f8ff', dk: '#6a748c', lw: 1.2 }); K.shape([[lx - 2, 56], [lx + 12, 56], [lx + 13, 62], [lx - 3, 62]], '#8a94a8', { gx0: lx - 3, gx1: lx + 13, lw: 1.1 }); K.shape([[lx + 1, 46], [lx + 9, 46], [lx + 8, 50], [lx + 2, 50]], '#aab4c8', { lw: 0.7 }); }
      K.shape([[12, 22 + b], [38, 22 + b], [36, 44], [14, 44]], st, { gx0: 12, gx1: 38, lt: '#f4f8ff', dk: '#6a748c', lw: 1.3 });
      K.shape([[14, 36], [36, 36], [36, 44], [14, 44]], '#c43a4a', { gx0: 14, gx1: 36, lt: '#e86a78', dk: '#7a1a2a', lw: 1 });
      K.shape([[18, 26 + b], [32, 26 + b], [30, 34 + b], [20, 34 + b]], '#aab4c8', { lw: 0.8 }); x.fillStyle = '#e8b830'; x.fillRect(23, 28 + b, 4, 3);
      for (const [sx, sd] of [[8, -1], [42, 1]]) { K.ell(sx, 24 + b, 7.4, 6.2, st, { lt: '#fff', dk: '#6a748c', lw: 1.2 }); K.shape([[sx - 3, 26 + b], [sx + 3, 26 + b], [sx + 2, 40 + b], [sx - 2, 40 + b]], '#aab4c8', { lw: 0.9 }); K.ell(sx, 41 + b, 3.2, 3.2, '#8a94a8', { lw: 0.8 }); }
      // sword in the far hand
      K.shape([[44, 40 + b], [47.4, 40 + b], [47, 8 + b], [45.7, 4 + b], [44.4, 8 + b]], '#e4eaf6', { gx0: 44, gx1: 48, lt: '#fff', dk: '#8a94b0', lw: 1 }); K.shape([[41, 40 + b], [51, 40 + b], [51, 42.4 + b], [41, 42.4 + b]], '#e8b830', { lw: 0.8 });
      // helm with plume and a glowing visor slit
      K.ell(24, 14 + b, 10.4, 11, st, { lt: '#fff', dk: '#6a748c', lw: 1.3 }); K.shape([[20, 2 + b], [30, 2 + b], [38, 8 + b], [32, 6 + b], [24, 5 + b]], '#d03a4a', { lw: 0.9, lt: '#f07a88', dk: '#801828' });
      K.shape([[14, 12 + b], [34, 12 + b], [34, 18 + b], [14, 18 + b]], '#2a3040', { lw: 1 }); x.fillStyle = '#50d8ff'; x.fillRect(16, 14 + b, 16, 2.2); x.fillStyle = '#fff'; x.fillRect(17, 14 + b, 3, 1);
      for (let i = 0; i < 4; i++) K.line(18 + i * 4, 18.4 + b, 18 + i * 4, 23 + b, '#6a748c', 0.7);
    }, '#101828');
  },
  gking(a) {
    return hdEnemyCanvas(82, 82, (x, K) => {
      const b = Math.sin(a) * 1, skin = '#7fc048', hy = 28 + b;
      x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(40, 80, 30, 3, 0, 0, 7); x.fill();
      K.shape([[22, 34], [4, 56, 2, 72, 8 + Math.sin(a) * 2, 80], [74, 80], [78, 70, 76, 54, 60, 34]], '#a01a3a', { gx0: 2, gx1: 78, lt: '#d04060', dk: '#5a0a22', lw: 1.4 }); // cape
      for (const lx of [24, 46]) { K.shape([[lx, 62], [lx + 14, 62], [lx + 14, 78], [lx, 78]], eshade(skin, 0.85), { gx0: lx, gx1: lx + 14, lw: 1.2 }); K.shape([[lx - 2, 77], [lx + 16, 77], [lx + 17, 81.4], [lx - 3, 81.4]], '#6a4420', { lw: 1 }); }
      K.shape([[16, 40 + b], [64, 40 + b], [66, 66], [14, 66]], skin, { gx0: 14, gx1: 66, lt: '#b8e682', dk: '#4a8a2a', lw: 1.5 });
      K.shape([[18, 40 + b], [40, 44 + b], [38, 66], [16, 66]], '#a07040', { gx0: 16, gx1: 40, lt: '#c89a60', dk: '#6a4420', lw: 1.2 }); K.shape([[62, 40 + b], [42, 44 + b], [44, 66], [64, 66]], '#7a4e26', { gx0: 42, gx1: 64, lw: 1.2 });
      K.shape([[14, 60], [66, 60], [65, 66], [15, 66]], '#4a3018', { lw: 1 }); K.shape([[35, 59.4], [45, 59.4], [45, 66.6], [35, 66.6]], '#e8b830', { lw: 0.8 });
      for (const k of [-1, 1]) { K.ell(40 + k * 28, 50 + b, 7.4, 11, eshade(skin, k < 0 ? 1 : 0.8), { lw: 1.3 }); K.ell(40 + k * 30, 62 + b, 5, 5, k < 0 ? '#a8dc72' : '#7fbf4c', { lw: 1 }); }
      // club on the far side
      K.shape([[68, 64 + b], [73, 64 + b], [76, 22 + b], [69, 20 + b]], '#8a5a2a', { gx0: 68, gx1: 76, lw: 1.1 }); K.shape([[66, 22 + b], [70, 8 + b], [80, 7 + b], [81, 22 + b], [76, 26 + b]], '#6a4420', { gx0: 66, gx1: 81, lw: 1.2 });
      for (const [sx, sy] of [[70, 11], [77, 11], [73, 17], [78, 20]]) K.shape([[sx - 1.4, sy + 1.4 + b], [sx, sy - 2 + b], [sx + 1.4, sy + 1.4 + b]], '#cfd6e6', { lw: 0.5 });
      // ears, big head, crown
      K.shape([[22, hy], [4, hy - 14], [8, hy - 2], [7, hy + 8], [22, hy + 9]], '#6aa83e', { gx0: 3, gx1: 24, lw: 1.2 }); K.shape([[58, hy], [76, hy - 14], [72, hy - 2], [73, hy + 8], [58, hy + 9]], '#5a982e', { gx0: 56, gx1: 77, lw: 1.2 });
      x.fillStyle = '#e8909a'; x.beginPath(); x.moveTo(8, hy - 9); x.lineTo(16, hy - 1); x.lineTo(10, hy + 2); x.fill(); x.beginPath(); x.moveTo(72, hy - 9); x.lineTo(64, hy - 1); x.lineTo(70, hy + 2); x.fill();
      K.ell(40, hy, 21, 17, skin, { lt: '#c2ee86', dk: '#4a8a2a', lw: 1.5 });
      K.line(24, hy - 9, 35, hy - 5, '#243a14', 2.4); K.line(56, hy - 9, 45, hy - 5, '#243a14', 2.4);
      for (const ex of [30, 50]) { x.fillStyle = '#fff4b0'; x.beginPath(); x.ellipse(ex, hy - 1, 5, 4.4, 0, 0, 7); x.fill(); x.fillStyle = '#e07810'; x.beginPath(); x.ellipse(ex, hy - 0.6, 3.6, 4, 0, 0, 7); x.fill(); x.fillStyle = '#1a0c06'; x.fillRect(ex - 0.7, hy - 4, 1.4, 6.8); x.fillStyle = '#fff'; x.fillRect(ex - 2.4, hy - 3, 1.4, 1.4); x.strokeStyle = '#1e2a10'; x.lineWidth = 1.2; x.beginPath(); x.ellipse(ex, hy - 1, 5, 4.4, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke(); }
      K.ell(40, hy + 5, 4.6, 3.4, '#6fb23c', { lw: 0.9 });
      x.fillStyle = '#3a1414'; x.beginPath(); x.moveTo(25, hy + 9.4); x.quadraticCurveTo(40, hy + 18, 55, hy + 9.4); x.quadraticCurveTo(40, hy + 12, 25, hy + 9.4); x.fill();
      x.fillStyle = '#fffbe8'; for (const [fx, d] of [[28.4, 1], [51.6, -1]]) { x.beginPath(); x.moveTo(fx, hy + 10); x.lineTo(fx + d * 1.6, hy + 4); x.lineTo(fx + d * 3.4, hy + 11); x.fill(); }
      K.shape([[22, hy - 13], [24, hy - 24], [30, hy - 17], [36, hy - 27], [40, hy - 18], [44, hy - 27], [50, hy - 17], [56, hy - 24], [58, hy - 13]], '#f0c040', { gx0: 22, gx1: 58, lt: '#fff0a0', dk: '#b07810', lw: 1.3 });
      K.ell(40, hy - 17, 2.4, 2.4, '#ff4060', { lt: '#ffc0c8', dk: '#a01830', lw: 0.7 }); K.ell(29, hy - 15, 1.7, 1.7, '#40a0ff', { lw: 0.6 }); K.ell(51, hy - 15, 1.7, 1.7, '#40e080', { lw: 0.6 });
    }, '#14240c');
  },
  guardian(a) {
    return hdEnemyCanvas(90, 90, (x, K) => {
      const f = Math.sin(a), gl = 0.5 + 0.5 * Math.sin(a * 2);
      x.fillStyle = 'rgba(0,0,0,.22)'; x.beginPath(); x.ellipse(45, 88, 26, 2.6, 0, 0, 7); x.fill();
      const ice = '#78c8f0', lt = '#d8f6ff', dk = '#3a78b8';
      for (const lx of [26, 52]) K.shape([[lx, 58], [lx + 12, 58], [lx + 11, 86], [lx + 1, 86]], ice, { gx0: lx, gx1: lx + 12, lt, dk, lw: 1.3 });
      for (const k of [-1, 1]) { const sx = 45 + k * 36; K.shape([[sx - 8 * k, 28 + f], [sx + 8 * k, 28 + f], [sx + 16 * k, 56 + f], [sx + 8 * k, 66 + f], [sx - 4 * k, 52 + f]], ice, { gx0: sx - 16, gx1: sx + 16, lt, dk, lw: 1.3 }); }
      K.shape([[45, 20], [68, 34], [64, 66], [45, 74], [26, 66], [22, 34]], ice, { gx0: 22, gx1: 68, lt, dk, lw: 1.5 });
      K.shape([[45, 24], [60, 36], [45, 44], [30, 36]], '#a8e4ff', { gx0: 30, gx1: 60, lt: '#fff', dk: '#58a0d8', lw: 1 });
      x.fillStyle = `rgba(255,90,170,${0.3 + gl * 0.3})`; x.beginPath(); x.arc(45, 50, 12, 0, 7); x.fill(); K.shape([[45, 40], [53, 50], [45, 62], [37, 50]], '#e83a98', { gx0: 37, gx1: 53, lt: '#ffb0e0', dk: '#8a1860', lw: 1.2 });
      K.shape([[45, 0], [58, 10], [54, 24], [45, 28], [36, 24], [32, 10]], '#98d8f8', { gx0: 32, gx1: 58, lt, dk, lw: 1.4 });
      for (const ex of [40, 50]) { x.fillStyle = '#10243a'; x.fillRect(ex - 3, 11, 6, 4.6); x.fillStyle = `rgb(255,${90 + gl * 60},190)`; x.fillRect(ex - 2, 12, 4, 2.4); x.fillStyle = '#fff'; x.fillRect(ex - 1.4, 12, 1.2, 1); }
      K.shape([[45, -2], [47, 5], [43, 5]], '#ff6ab8', { lw: 0.6 });
    }, '#0c2040');
  },
  tempest(a) {
    return hdEnemyCanvas(86, 66, (x, K) => {
      const f = Math.sin(a), cx = 43;
      for (const k of [-1, 1]) {
        const tipY = 4 - f * 9, mid = 24 - f * 4;
        K.shape([[cx + k * 6, 24], [cx + k * 20, mid - 10], [cx + k * 41, tipY], [cx + k * 36, tipY + 10], [cx + k * 40, tipY + 18], [cx + k * 30, mid + 8], [cx + k * 22, mid + 18], [cx + k * 14, 40]], '#40c8a8', { gx0: cx - 42, gx1: cx + 42, lt: '#a0f4dc', dk: '#1a7a78', lw: 1.3 });
        for (let i = 0; i < 4; i++) K.line(cx + k * (10 + i * 8), 26 - f * 2, cx + k * (22 + i * 6), mid + 6 + i * 3, '#e8fff8', 1);
      }
      for (const k of [-1, 1]) K.shape([[cx + k * 3, 54], [cx + k * 9, 66], [cx + k * 12, 60], [cx + k * 8, 52]], '#e8b830', { lw: 0.9 });
      K.shape([[cx - 11, 26], [cx + 11, 26], [cx + 9, 54], [cx, 60], [cx - 9, 54]], '#38b898', { gx0: cx - 11, gx1: cx + 11, lt: '#98f0d0', dk: '#1a7a78', lw: 1.4 });
      for (let i = 0; i < 4; i++) K.ell(cx, 36 + i * 5, 6 - i * 0.6, 2.6, '#e8fff4', { lt: '#fff', dk: '#a8e0cc', lw: 0.6 });
      K.shape([[cx - 8, 8], [cx - 9, 22], [cx, 28], [cx + 9, 22], [cx + 8, 8], [cx, 2]], '#48d0b0', { gx0: cx - 9, gx1: cx + 9, lt: '#a8f8e0', dk: '#1a7a78', lw: 1.3 });
      K.shape([[cx - 6, 4], [cx - 12, -2], [cx - 8, 6]], '#ffe060', { lw: 0.7 }); K.shape([[cx, 2], [cx, -4], [cx + 3, 3]], '#ffe060', { lw: 0.7 }); K.shape([[cx + 6, 4], [cx + 13, -1], [cx + 8, 7]], '#ffe060', { lw: 0.7 });
      for (const k of [-1, 1]) { x.fillStyle = '#fff4b0'; x.beginPath(); x.ellipse(cx + k * 4.6, 14, 3, 3.4, 0, 0, 7); x.fill(); x.fillStyle = '#ff6030'; x.beginPath(); x.ellipse(cx + k * 4.6, 14.4, 2.2, 3, 0, 0, 7); x.fill(); x.fillStyle = '#1a0a08'; x.fillRect(cx + k * 4.6 - 0.5, 12, 1, 4.8); x.fillStyle = '#fff'; x.fillRect(cx + k * 4.6 - 1.4, 12.6, 1, 1); x.strokeStyle = '#0c3a38'; x.lineWidth = 1; x.beginPath(); x.ellipse(cx + k * 4.6, 14, 3, 3.4, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke(); }
      K.shape([[cx - 3, 18], [cx + 3, 18], [cx, 25]], '#ffc040', { lw: 0.8 });
    }, '#082c2c');
  },
});
