// ===================== DUNGEON (floor generation, field of view, path distances) =====================
// The floor is cut into 3x3 sections like the original games: most sections hold a room, the rest only a
// corridor junction, and a random spanning tree (plus a few extra links) joins neighbouring sections.
const MW = 59, MH = 35, SEC_W = 19, SEC_H = 11;
const T_WALL = 0, T_ROOM = 1, T_PATH = 2;
const DIRS8 = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];

function genFloor(floor) {
  const t = new Uint8Array(MW * MH), room = new Int8Array(MW * MH).fill(-1);
  const at = (x, y) => y * MW + x;
  const rooms = [], cells = [];
  const big = floor >= 3 && rnd() < 0.08;
  if (big) {
    // 大部屋: one room fills the floor
    const r = { id: 0, x: 3, y: 3, w: MW - 6, h: MH - 6, doors: [] }; rooms.push(r);
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) { t[at(x, y)] = T_ROOM; room[at(x, y)] = 0; }
  } else {
    // pick which of the 9 sections are corridor-only junctions (at most 3, always at least 5 rooms)
    const dummy = new Set(); const nd = ri(0, 3);
    while (dummy.size < nd) dummy.add(ri(0, 8));
    for (let i = 0; i < 9; i++) {
      const cx = i % 3, cy = Math.floor(i / 3), sx = 1 + cx * SEC_W, sy = 1 + cy * SEC_H;
      if (dummy.has(i)) { const x = ri(sx + 3, sx + SEC_W - 4), y = ri(sy + 3, sy + SEC_H - 4); cells.push({ cx, cy, room: null, x, y }); t[at(x, y)] = T_PATH; continue; }
      // at least two wall tiles between a room and its section edge so corridors never brush another room
      const w = ri(4, SEC_W - 6), h = ri(3, SEC_H - 6);
      const x = ri(sx + 2, sx + SEC_W - w - 2), y = ri(sy + 2, sy + SEC_H - h - 2);
      const r = { id: rooms.length, x, y, w, h, doors: [] }; rooms.push(r);
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { t[at(xx, yy)] = T_ROOM; room[at(xx, yy)] = r.id; }
      cells.push({ cx, cy, room: r });
    }
    // spanning tree over the 3x3 grid, then a couple of extra links for loops
    const linked = new Set(), key = (a, b) => a < b ? a + ',' + b : b + ',' + a;
    const nb = i => { const out = [], cx = i % 3, cy = Math.floor(i / 3); if (cx > 0) out.push(i - 1); if (cx < 2) out.push(i + 1); if (cy > 0) out.push(i - 3); if (cy < 2) out.push(i + 3); return out; };
    const seen = new Set([ri(0, 8)]);
    while (seen.size < 9) {
      const from = [...seen].filter(i => nb(i).some(j => !seen.has(j))); const a = from[ri(0, from.length - 1)];
      const opts = nb(a).filter(j => !seen.has(j)); const b = opts[ri(0, opts.length - 1)];
      seen.add(b); linked.add(key(a, b));
    }
    for (let k = ri(1, 3); k > 0; k--) { const a = ri(0, 8), o = nb(a), b = o[ri(0, o.length - 1)]; linked.add(key(a, b)); }
    for (const k of linked) { const [a, b] = k.split(',').map(Number); carve(cells[a], cells[b]); }
  }
  function exitOf(c, side) {
    // a door on the given side of the room (or the junction point itself)
    if (!c.room) return [c.x, c.y];
    const r = c.room;
    if (side === 'E') return [r.x + r.w, ri(r.y, r.y + r.h - 1)];
    if (side === 'W') return [r.x - 1, ri(r.y, r.y + r.h - 1)];
    if (side === 'S') return [ri(r.x, r.x + r.w - 1), r.y + r.h];
    return [ri(r.x, r.x + r.w - 1), r.y - 1];
  }
  function line(x0, y0, x1, y1) {
    const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0); let x = x0, y = y0;
    for (; ;) { if (t[at(x, y)] === T_WALL) t[at(x, y)] = T_PATH; if (x === x1 && y === y1) break; x += dx; y += dy; }
  }
  function carve(A, B) {
    if (A.cx > B.cx || A.cy > B.cy) [A, B] = [B, A];
    if (A.cy === B.cy) { // left to right: bend at a column strictly between the two doors
      const [ax, ay] = exitOf(A, 'E'), [bx, by] = exitOf(B, 'W'); const mx = ri(ax + 1, bx - 1);
      line(ax, ay, mx, ay); line(mx, ay, mx, by); line(mx, by, bx, by);
      if (A.room) A.room.doors.push([ax, ay]); if (B.room) B.room.doors.push([bx, by]);
    } else { // top to bottom
      const [ax, ay] = exitOf(A, 'S'), [bx, by] = exitOf(B, 'N'); const my = ri(ay + 1, by - 1);
      line(ax, ay, ax, my); line(ax, my, bx, my); line(bx, my, bx, by);
      if (A.room) A.room.doors.push([ax, ay]); if (B.room) B.room.doors.push([bx, by]);
    }
  }
  // doorways count as part of their room for sight (standing in the entrance shows the room)
  const area = new Int8Array(room);
  for (const r of rooms) for (const [x, y] of r.doors) area[at(x, y)] = r.id;
  const F = { floor, t, room, area, rooms, big, seen: new Uint8Array(MW * MH), vis: new Uint8Array(MW * MH), stairs: null };
  return F;
}

const inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
function tileAt(F, x, y) { return inMap(x, y) ? F.t[y * MW + x] : T_WALL; }
function passable(F, x, y) { return tileAt(F, x, y) !== T_WALL; }
// diagonal steps may not cut a wall corner (same rule for moving and for attacking)
function canStep(F, x, y, dx, dy) {
  if (!passable(F, x + dx, y + dy)) return false;
  if (dx && dy && (!passable(F, x + dx, y) || !passable(F, x, y + dy))) return false;
  return true;
}
function areaAt(F, x, y) { return inMap(x, y) ? F.area[y * MW + x] : -1; }
// a random free floor tile inside a room (optionally avoiding one room)
function randomRoomTile(F, ok, avoidRoom = -1) {
  for (let tries = 0; tries < 400; tries++) {
    const cand = F.rooms.filter(r => r.id !== avoidRoom || F.rooms.length === 1);
    const r = cand[ri(0, cand.length - 1)]; const x = ri(r.x, r.x + r.w - 1), y = ri(r.y, r.y + r.h - 1);
    if (!ok || ok(x, y)) return [x, y];
  }
  return null;
}

// what the player can see: the whole room (and its walls) when inside one, otherwise only the 8 tiles around
function updateFov(F, px, py) {
  F.vis.fill(0);
  const mark = (x, y) => { if (inMap(x, y)) { F.vis[y * MW + x] = 1; F.seen[y * MW + x] = 1; } };
  const a = areaAt(F, px, py);
  if (a >= 0) { const r = F.rooms[a]; for (let y = r.y - 1; y <= r.y + r.h; y++) for (let x = r.x - 1; x <= r.x + r.w; x++) mark(x, y); }
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) mark(px + dx, py + dy);
}
function visible(F, x, y) { return inMap(x, y) && F.vis[y * MW + x] === 1; }

// breadth-first step distances to (gx, gy) over walkable tiles, honouring the corner rule
function distField(F, gx, gy) {
  const D = new Int16Array(MW * MH).fill(-1); const q = [gy * MW + gx]; D[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x = i % MW, y = (i - x) / MW;
    for (const [dx, dy] of DIRS8) {
      const nx = x + dx, ny = y + dy, j = ny * MW + nx;
      if (!inMap(nx, ny) || D[j] >= 0 || !canStep(F, x, y, dx, dy)) continue;
      D[j] = D[i] + 1; q.push(j);
    }
  }
  return D;
}
