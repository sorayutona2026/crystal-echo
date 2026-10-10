extends Node2D
# Walkable map: Elm village and the world map. Tiles, NPCs, party in single file, dialogue, warps, random encounters.

const T = 16
const ALLOWED = ["elmWoman", "elmChild", "elmMan", "elmGuard", "elmOld", "mother"]
const TALK = {
	"elmWoman": [["村の女性", "最近、夜になると洞窟の方から\nうなり声が聞こえるの…怖いわ。"], ["村の女性", "ちょっと休んでいきなさいな。\nお茶をいれてあげる。"]],
	"elmChild": [["子ども", "MENUボタンでメニューを開けるよ!\nセーブはこまめにね!"]],
	"elmMan": [["村の男", "戦闘では、キャラクターの\nATBゲージがたまったら行動できる。\nわざや魔法を上手に使うんだぞ。"]],
	"elmGuard": [["村の衛兵", "村の外には魔物が出る。\n森や丘では魔物に遭いやすいぞ。\n気をつけてな!"]],
	"elmOld": [["老人", "むかし、この世界には\n「光の戦士」がいたそうな。\nあんたたちのような若者じゃったよ。"]],
	"mother": [["母", "…行くのね、塔へ。"], ["母", "お父さんもね、出かける前に\nそうやって笑ったのよ。\n「帰ったら、風車を直そうな」って。"], ["母", "…待つのは、もう慣れたわ。\nだからね、アレン。\n帰ってくることだけは、約束して。"]],
}

var arg
var M
var set_def
var world
var cam
var water = []
var player
var psprite
var gx = 0
var gy = 0
var dir = "down"
var moving = false
var move_t = 0.0
var move_from = Vector2()
var move_to = Vector2()
var hist = []
var followers = []
var npcs = []
var steps = 0
var busy = false
var ui
var dlg_panel
var dlg_name
var dlg_text
var lines = []
var line_i = 0
var talking = false
var after_talk = ""
var shown = 0.0
var menu_panel
var menu_open = false
var menu_sel = 0
var menu_labels = []
var menu_msg
var banner
var banner_t = 0.0
var clock = 0.0

func _ready():
	M = Game.D.maps[Game.map_id]
	set_def = Game.D.tilesets[M.set]
	gx = Game.pos.x
	gy = Game.pos.y
	dir = Game.dir
	_build_map()
	_build_actors()
	_build_ui()
	cam = Camera2D.new()
	cam.zoom = Vector2(3, 3)
	cam.limit_left = 0
	cam.limit_top = 0
	cam.limit_right = M.w * T
	cam.limit_bottom = M.h * T
	cam.position = player.position + Vector2(8, 8)
	add_child(cam)
	cam.make_current()
	banner_t = 2.2
	banner.text = M.name

# ---------- map ----------
func _hash4(x, y):
	return ((x * 73856093) ^ (y * 19349663)) & 0xFFFFFFFF

func _def(ch):
	return set_def.get(ch, ["grass", 0])

func _tile(key, x, y, frame = 0):
	var path = "res://assets/tiles/%s_v%d.png" % [key, _hash4(x, y) % 4]
	var t = Game.tex(path)
	if t == null:
		t = Game.tex("res://assets/tiles/%s_%d.png" % [key, frame])
	if t == null:
		return null
	var s = Sprite2D.new()
	s.texture = t
	s.centered = false
	s.position = Vector2(x * T, y * T)
	world.add_child(s)
	if key == "water":
		water.append(s)
	return s

func _build_map():
	world = Node2D.new()
	add_child(world)
	var tall = []
	for y in M.h:
		var row = M.g[y]
		for x in M.w:
			var key = _def(row[x])[0]
			if Game.D.tall.has(key):
				_tile(Game.D.tall[key].base, x, y)
				tall.append([key, x, y])
			else:
				_tile(key, x, y)
	for e in tall:
		var key = e[0]
		var n = int(Game.D.tall[key].n)
		var idx = (((e[1] * 92837111) ^ (e[2] * 689287499)) & 0xFFFFFFFF) % n
		var t = Game.tex("res://assets/tiles/tall_%s_%d.png" % [key, idx])
		if t == null:
			continue
		var s = Sprite2D.new()
		s.texture = t
		s.centered = false
		s.position = Vector2(e[1] * T + (T - t.get_width()) / 2, e[2] * T + T - t.get_height())
		s.z_index = e[2] * T + T
		world.add_child(s)

func _solid(x, y):
	if x < 0 or y < 0 or x >= M.w or y >= M.h:
		return true
	if _def(M.g[y][x])[1]:
		return true
	return _npc_at(x, y) != null

# ---------- actors ----------
func _char(pal, d, f):
	return Game.tex("res://assets/chars/%s_%s_%d.png" % [pal, d, f])

func _make_actor(pal, tx, ty):
	var n = Node2D.new()
	n.position = Vector2(tx * T, ty * T)
	var s = Sprite2D.new()
	s.centered = false
	s.position = Vector2(0, -2)
	s.texture = _char(pal, "down", 0)
	n.add_child(s)
	world.add_child(n)
	return [n, s]

func _build_actors():
	player = Node2D.new()
	world.add_child(player)
	player.position = Vector2(gx * T, gy * T)
	psprite = Sprite2D.new()
	psprite.centered = false
	psprite.position = Vector2(0, -2)
	player.add_child(psprite)
	hist = []
	for i in Game.party.size() + 1:
		hist.append(Vector2i(gx, gy))
	for k in range(1, Game.party.size()):
		var a = _make_actor(Game.party[k].id, gx, gy)
		followers.append({"node": a[0], "sprite": a[1], "pal": Game.party[k].id})
	_set_player_frame(0)
	for d in M.npcs:
		if not ALLOWED.has(d.id):
			continue
		var a = _make_actor(d.pal, int(d.x), int(d.y))
		npcs.append({"d": d, "node": a[0], "sprite": a[1], "x": int(d.x), "y": int(d.y), "dir": d.dir, "moving": false, "t": 0.0,
			"from": Vector2(), "to": Vector2(), "timer": randf_range(1.0, 3.0)})
		a[1].texture = _char(d.pal, d.dir, 0)
	_zsort()

func _npc_at(x, y):
	for n in npcs:
		if (n.x == x and n.y == y):
			return n
	return null

func _set_player_frame(f):
	psprite.texture = _char(Game.party[0].id, dir, f)

func _zsort():
	player.z_index = int(player.position.y) + T + 2
	for i in followers.size():
		followers[i].node.z_index = int(followers[i].node.position.y) + T + 1
	for n in npcs:
		n.node.z_index = int(n.node.position.y) + T

# ---------- UI ----------
func _build_ui():
	ui = CanvasLayer.new()
	add_child(ui)
	dlg_panel = UI.panel(ui, Rect2(18, 452, 732, 200))
	dlg_name = UI.label(dlg_panel, "", Vector2(24, -34), 24, UI.GOLD)
	dlg_text = UI.label(dlg_panel, "", Vector2(30, 24), 28)
	dlg_panel.visible = false
	banner = UI.label(ui, "", Vector2(0, 26), 30, UI.GOLD, HORIZONTAL_ALIGNMENT_CENTER, 768)
	menu_panel = UI.panel(ui, Rect2(150, 60, 468, 520))
	menu_panel.visible = false
	menu_msg = UI.label(ui, "", Vector2(0, 600), 24, UI.GOLD, HORIZONTAL_ALIGNMENT_CENTER, 768)

func _say(l, after = ""):
	lines = l
	line_i = 0
	after_talk = after
	talking = true
	_show_line()

func _show_line():
	dlg_panel.visible = true
	dlg_name.text = lines[line_i][0]
	dlg_text.text = lines[line_i][1]
	dlg_text.visible_characters = 0
	shown = 0.0

func _dialog_input(delta):
	shown += delta * 50.0
	var total = dlg_text.text.length()
	dlg_text.visible_characters = int(shown)
	if Input.is_action_just_pressed("a") or Input.is_action_just_pressed("b"):
		if shown < total:
			shown = total
		else:
			line_i += 1
			if line_i >= lines.size():
				talking = false
				dlg_panel.visible = false
				if after_talk == "heal":
					Game.heal_all()
					menu_msg.text = "HPとMPが全回復した!"
					banner_t = 0.0
					get_tree().create_timer(1.6).timeout.connect(func(): menu_msg.text = "")
				after_talk = ""
			else:
				_show_line()

# ---------- menu ----------
func _open_menu():
	menu_open = true
	menu_sel = 0
	for l in menu_labels:
		l.queue_free()
	menu_labels = []
	menu_panel.visible = true
	var y = 18
	for m in Game.party:
		var s = Game.stats(m)
		var h = Game.D.heroes[m.id]
		menu_labels.append(UI.label(menu_panel, "%s  Lv%d" % [h.name, m.lv], Vector2(30, y), 26, UI.GOLD))
		menu_labels.append(UI.label(menu_panel, h.job, Vector2(300, y + 4), 20, UI.MUTED))
		menu_labels.append(UI.label(menu_panel, "HP %d/%d    MP %d/%d" % [m.hp, s.maxhp, m.mp, s.maxmp], Vector2(30, y + 36), 22))
		menu_labels.append(UI.label(menu_panel, "次のレベルまで %d" % maxi(0, Game.exp_at(m.lv + 1) - m.exp), Vector2(30, y + 66), 18, UI.LABEL))
		y += 110
	menu_labels.append(UI.label(menu_panel, "ギル  %d" % Game.gil, Vector2(30, y + 4), 24))
	menu_labels.append(UI.label(menu_panel, "セーブ", Vector2(90, y + 50), 26))
	menu_labels.append(UI.label(menu_panel, "とじる", Vector2(90, y + 94), 26))
	menu_labels.append(UI.label(menu_panel, "▶", Vector2(48, y + 50), 26, UI.GOLD))

func _menu_input():
	var n = menu_labels.size()
	if Input.is_action_just_pressed("up") or Input.is_action_just_pressed("down"):
		menu_sel = 1 - menu_sel
	menu_labels[n - 1].position.y = menu_labels[n - 3].position.y + (0 if menu_sel == 0 else 44)
	menu_labels[n - 3].add_theme_color_override("font_color", UI.GOLD if menu_sel == 0 else UI.INK)
	menu_labels[n - 2].add_theme_color_override("font_color", UI.GOLD if menu_sel == 1 else UI.INK)
	if Input.is_action_just_pressed("b") or Input.is_action_just_pressed("menu"):
		menu_open = false
		menu_panel.visible = false
		return
	if Input.is_action_just_pressed("a"):
		if menu_sel == 0:
			Game.pos = Vector2i(gx, gy)
			Game.dir = dir
			menu_msg.text = "セーブしました" if Game.save_game() else "セーブできませんでした"
			get_tree().create_timer(1.4).timeout.connect(func(): menu_msg.text = "")
		else:
			menu_open = false
			menu_panel.visible = false

# ---------- main loop ----------
func _process(delta):
	clock += delta
	var wf = int(clock * 2.0) % 2
	for w in water:
		w.texture = Game.tex("res://assets/tiles/water_%d.png" % wf)
	if banner_t > 0.0:
		banner_t -= delta
		banner.modulate.a = clampf(banner_t / 0.6, 0.0, 1.0)
	_npc_tick(delta)
	cam.position = player.position + Vector2(8, 8)
	if busy:
		return
	if talking:
		_dialog_input(delta)
		return
	if menu_open:
		_menu_input()
		return
	if moving:
		move_t += delta * 7.5
		var t = minf(move_t, 1.0)
		player.position = move_from.lerp(move_to, t)
		for k in followers.size():
			var a = hist[k + 2]
			var b = hist[k + 1]
			followers[k].node.position = Vector2(a * T).lerp(Vector2(b * T), t)
		var f = int(clock * 8.0) % 4
		_set_player_frame(f)
		for k in followers.size():
			var a = hist[k + 2]
			var b = hist[k + 1]
			var fd = dir
			if a != b:
				fd = "right" if b.x > a.x else "left" if b.x < a.x else "down" if b.y > a.y else "up"
			followers[k].sprite.texture = _char(followers[k].pal, fd, f)
		_zsort()
		if move_t >= 1.0:
			_arrive()
		return
	if Input.is_action_just_pressed("menu") or Input.is_action_just_pressed("b"):
		_open_menu()
		return
	if Input.is_action_just_pressed("a"):
		_interact()
		return
	for d in ["up", "down", "left", "right"]:
		if Input.is_action_pressed(d):
			_try_move(d)
			return

func _try_move(d):
	dir = d
	_set_player_frame(0)
	var v = {"up": Vector2i(0, -1), "down": Vector2i(0, 1), "left": Vector2i(-1, 0), "right": Vector2i(1, 0)}[d]
	var nx = gx + v.x
	var ny = gy + v.y
	if nx < 0 or ny < 0 or nx >= M.w or ny >= M.h:
		_leave()
		return
	if _solid(nx, ny):
		return
	hist.push_front(Vector2i(nx, ny))
	hist.resize(Game.party.size() + 2)
	move_from = Vector2(gx * T, gy * T)
	move_to = Vector2(nx * T, ny * T)
	gx = nx
	gy = ny
	moving = true
	move_t = 0.0

func _leave():
	if M.exit == null:
		return
	_warp(M.exit)

func _warp(w):
	if not Game.D.maps.has(w.map):
		_say([["", "この先は、まだ Godot版に移していない…\n(元のゲームでは遊べるよ)"]])
		return
	busy = true
	Game.map_id = w.map
	Game.pos = Vector2i(int(w.x), int(w.y))
	Game.dir = w.get("dir", "down")
	Game.main.change("field")

func _arrive():
	moving = false
	for k in followers.size():
		followers[k].sprite.texture = _char(followers[k].pal, dir, 0)
	_set_player_frame(0)
	Game.pos = Vector2i(gx, gy)
	Game.dir = dir
	var key = "%d,%d" % [gx, gy]
	if M.warps.has(key):
		_warp(M.warps[key])
		return
	if M.enc != null:
		var d = _def(M.g[gy][gx])
		var mult = float(d[2]) if d.size() > 2 else 0.0
		steps += 1
		if steps > 5 and randf() < mult / float(M.rate):
			var zone = "north" if gy < 14 else ("south" if gx < 30 else "east")
			var list = Game.D.formations[zone]
			var bg = "forest" if M.g[gy][gx] == "T" else ("dusk" if gy >= 14 else "plains")
			busy = true
			Game.main.change("battle", {"ids": list.pick_random(), "bg": bg})

func _interact():
	var v = {"up": Vector2i(0, -1), "down": Vector2i(0, 1), "left": Vector2i(-1, 0), "right": Vector2i(1, 0)}[dir]
	var tx = gx + v.x
	var ty = gy + v.y
	var n = _npc_at(tx, ty)
	if n != null:
		n.dir = {"up": "down", "down": "up", "left": "right", "right": "left"}[dir]
		n.sprite.texture = _char(n.d.pal, n.dir, 0)
		n.timer = 4.0
		var id = n.d.talk
		if id == "elmWoman":
			_say(TALK[id], "heal")
		else:
			_say(TALK[id])
		return
	var key = "%d,%d" % [tx, ty]
	if M.signs.has(key):
		_say([["", M.signs[key]]])

func _npc_tick(delta):
	for n in npcs:
		if n.moving:
			n.t += delta * 7.5
			n.node.position = n.from.lerp(n.to, minf(n.t, 1.0))
			n.sprite.texture = _char(n.d.pal, n.dir, int(clock * 8.0) % 4)
			if n.t >= 1.0:
				n.moving = false
				n.sprite.texture = _char(n.d.pal, n.dir, 0)
			continue
		if not n.d.wander or talking or menu_open:
			continue
		n.timer -= delta
		if n.timer > 0.0:
			continue
		n.timer = randf_range(1.0, 3.5)
		var d = ["up", "down", "left", "right"].pick_random()
		var v = {"up": Vector2i(0, -1), "down": Vector2i(0, 1), "left": Vector2i(-1, 0), "right": Vector2i(1, 0)}[d]
		n.dir = d
		var nx = n.x + v.x
		var ny = n.y + v.y
		if absi(nx - int(n.d.x)) > 3 or absi(ny - int(n.d.y)) > 3 or _solid(nx, ny) or (nx == gx and ny == gy) or M.warps.has("%d,%d" % [nx, ny]) or _def(M.g[ny][nx])[0] == "door":
			n.sprite.texture = _char(n.d.pal, d, 0)
			continue
		n.from = Vector2(n.x * T, n.y * T)
		n.to = Vector2(nx * T, ny * T)
		n.x = nx
		n.y = ny
		n.moving = true
		n.t = 0.0
	_zsort()
