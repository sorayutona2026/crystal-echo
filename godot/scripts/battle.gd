extends Node2D
# ATB battle: same formulas as the JS game (damage, ATB speed, steal-free subset). Commands, skills, items, auto mode.

const AX = 8
const AW = 156
const SCALE = 3.0

var arg
var stage
var ui
var bg
var enemies = []
var pb = []
var hero_nodes = []
var phase = "intro"
var busy = false
var queue = []
var rdy = []
var menu = null
var t = 0.0
var slide = 1.0
var cmd_labels = []
var cmd_cursor
var rows = []
var list_labels = []
var list_panel
var cursor
var banner
var banner_t = 0.0
var auto_btn
var auto_tag
var msg_label
var result_panel
var flee_fx = false

func _ready():
	var ids = arg.ids
	bg = Sprite2D.new()
	stage = Node2D.new()
	stage.scale = Vector2(SCALE, SCALE)
	add_child(stage)
	bg.texture = Game.tex("res://assets/bg/%s.png" % arg.bg)
	bg.centered = false
	stage.add_child(bg)
	for i in ids.size():
		_add_enemy(ids[i], i)
	_layout_enemies()
	for i in Game.party.size():
		var m = Game.party[i]
		var s = Game.stats(m)
		pb.append({"atb": (20.0 + randf() * 60.0 + s.spd * 2.0) if m.hp > 0 else 0.0, "defend": false, "ready": false, "offx": 0.0, "pose": "idle", "hit": 0.0})
		var n = Sprite2D.new()
		n.centered = false
		stage.add_child(n)
		hero_nodes.append(n)
	_build_ui()
	_update_heroes()

# ---------- setup ----------
func _party_pos(i):
	return Vector2(190 + i * 7, 28 + i * 28)

func _add_enemy(id, idx):
	var d = Game.D.enemies[id]
	var frames = []
	for f in 4:
		frames.append(Game.tex("res://assets/enemies/%s_%d.png" % [d.img, f]))
	var sp = Sprite2D.new()
	sp.centered = false
	sp.texture = frames[0]
	stage.add_child(sp)
	enemies.append({"id": id, "d": d, "name": d.name, "hp": int(d.hp), "maxhp": int(d.hp), "atb": randf() * 50.0, "sprite": sp, "frames": frames,
		"w": frames[0].get_width(), "h": frames[0].get_height(), "alive": true, "i": idx, "x": 0.0, "y": 0.0, "buff": 1.0})

func _layout_enemies():
	var n = enemies.size()
	if n == 1:
		var e = enemies[0]
		e.x = roundf(AX + (AW - e.w) / 2.0)
		e.y = roundf(minf(126.0, 70.0 + e.h / 2.0) - e.h)
	else:
		var total = 8.0 * (n - 1)
		for e in enemies:
			total += e.w
		if total <= AW:
			var x = AX + (AW - total) / 2.0
			for e in enemies:
				e.x = roundf(x)
				e.y = roundf(118.0 - e.h - (e.i % 2) * 14.0)
				x += e.w + 8.0
		else:
			var half = int(ceil(n / 2.0))
			var front = enemies.slice(0, half)
			var back = enemies.slice(half)
			for pair in [[back, 78.0, 16.0], [front, 124.0, 0.0]]:
				var row = pair[0]
				var tw = 6.0 * (row.size() - 1)
				for e in row:
					tw += e.w
				var x = AX + pair[2] + (AW - pair[2] - tw) / 2.0
				for e in row:
					e.x = roundf(x)
					e.y = roundf(pair[1] - e.h)
					x += e.w + 6.0
	var cnt = {}
	for e in enemies:
		cnt[e.id] = int(cnt.get(e.id, 0)) + 1
	var seen = {}
	for e in enemies:
		if cnt[e.id] > 1:
			seen[e.id] = int(seen.get(e.id, 0)) + 1
			e.name = e.d.name + "ABCD"[seen[e.id] - 1]
	for e in enemies:
		e.sprite.position = Vector2(e.x - 180.0, e.y)

func _build_ui():
	ui = CanvasLayer.new()
	add_child(ui)
	var left = UI.panel(ui, Rect2(0, 450, 288, 222))
	var right = UI.panel(ui, Rect2(288, 450, 480, 222))
	right.name = "right"
	for i in 5:
		cmd_labels.append(UI.label(left, "", Vector2(60, 12 + i * 40), 25))
	cmd_cursor = UI.label(left, "▶", Vector2(22, 12), 25, UI.GOLD)
	cmd_cursor.visible = false
	UI.label(right, "HP", Vector2(116, 0), 15, UI.LABEL)
	UI.label(right, "MP", Vector2(268, 0), 15, UI.LABEL)
	UI.label(right, "ATB", Vector2(318, 0), 15, UI.LABEL)
	for i in Game.party.size():
		var y = 20 + i * 46
		var r = {}
		r.bg = ColorRect.new()
		r.bg.position = Vector2(8, y - 2)
		r.bg.size = Vector2(464, 40)
		r.bg.color = Color(0.94, 0.81, 0.53, 0.0)
		right.add_child(r.bg)
		r.name = UI.label(right, Game.D.heroes[Game.party[i].id].name, Vector2(20, y), 25)
		r.hp = UI.label(right, "", Vector2(100, y), 25, UI.INK, HORIZONTAL_ALIGNMENT_RIGHT, 80)
		r.hpmax = UI.label(right, "", Vector2(184, y + 6), 17, UI.MUTED)
		r.hpbar = UI.bar(right, Vector2(20, y + 31), 216, 5, UI.HP)
		r.mp = UI.label(right, "", Vector2(250, y), 23, UI.MP, HORIZONTAL_ALIGNMENT_RIGHT, 52)
		r.atb = UI.bar(right, Vector2(316, y + 12), 140, 10, Color("9fb6d2"))
		rows.append(r)
	list_panel = UI.panel(ui, Rect2(288, 450, 480, 222))
	list_panel.visible = false
	for i in 5:
		var l = UI.label(list_panel, "", Vector2(44, 10 + i * 40), 24)
		var r = UI.label(list_panel, "", Vector2(360, 12 + i * 40), 22, UI.MP, HORIZONTAL_ALIGNMENT_RIGHT, 100)
		list_labels.append([l, r])
	cursor = UI.label(ui, "▶", Vector2(0, 0), 26, UI.GOLD)
	cursor.visible = false
	banner = UI.label(ui, "", Vector2(0, 18), 28, UI.INK, HORIZONTAL_ALIGNMENT_CENTER, 768)
	msg_label = UI.label(ui, "", Vector2(0, 200), 30, UI.INK, HORIZONTAL_ALIGNMENT_CENTER, 768)
	auto_btn = Button.new()
	auto_btn.text = "オート"
	auto_btn.position = Vector2(668, 8)
	auto_btn.size = Vector2(92, 40)
	auto_btn.add_theme_font_override("font", Game.font)
	auto_btn.add_theme_font_size_override("font_size", 20)
	auto_btn.focus_mode = Control.FOCUS_NONE
	auto_btn.pressed.connect(_toggle_auto)
	ui.add_child(auto_btn)
	auto_tag = UI.label(ui, "AUTO ▶▶", Vector2(560, 14), 22, UI.GOLD)
	auto_tag.visible = false

func _toggle_auto():
	Game.auto = not Game.auto
	Engine.time_scale = 2.0 if Game.auto else 1.0

# ---------- helpers ----------
func _alive_e():
	return enemies.filter(func(e): return e.alive)

func _alive_p():
	var out = []
	for i in Game.party.size():
		if Game.party[i].hp > 0:
			out.append(i)
	return out

func _center(side, i):
	if side == "e":
		var e = enemies[i]
		return Vector2(e.x + e.w / 2.0, e.y + e.h / 2.0)
	var p = _party_pos(i)
	return Vector2(p.x + 16 + pb[i].offx, p.y + 12)

func _pstats(i):
	return Game.stats(Game.party[i])

func _stats_of(side, i):
	if side == "p":
		return _pstats(i)
	var e = enemies[i]
	return {"atk": roundf(float(e.d.str) * e.buff), "def": float(e.d.def), "mag": roundf(float(e.d.mag) * e.buff), "mdf": float(e.d.mdf), "spd": float(e.d.spd), "crit": 0.03, "maxhp": e.maxhp}

func _is_alive(side, i):
	return Game.party[i].hp > 0 if side == "p" else enemies[i].alive

func _popup(side, i, text, color = Color.WHITE, big = false):
	var c = _center(side, i) * SCALE
	var l = UI.label(ui, str(text), c + Vector2(-30, -26), 34 if big else 28, color, HORIZONTAL_ALIGNMENT_CENTER, 60)
	l.add_theme_constant_override("outline_size", 6)
	l.add_theme_color_override("font_outline_color", Color(0.04, 0.02, 0.08, 0.9))
	var tw = create_tween()
	tw.tween_property(l, "position:y", l.position.y - 34, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_interval(0.5)
	tw.tween_property(l, "modulate:a", 0.0, 0.2)
	tw.tween_callback(l.queue_free)

func _burst(side, i, colors, n = 14, speed = 28.0):
	var c = _center(side, i)
	for k in n:
		var r = ColorRect.new()
		r.size = Vector2(2, 2)
		r.color = colors[k % colors.size()]
		r.position = c
		stage.add_child(r)
		var an = randf() * TAU
		var tw = create_tween()
		tw.set_parallel(true)
		tw.tween_property(r, "position", c + Vector2(cos(an), sin(an)) * speed * randf_range(0.4, 1.0), 0.45)
		tw.tween_property(r, "modulate:a", 0.0, 0.45)
		tw.chain().tween_callback(r.queue_free)

func _slash_fx(side, i):
	var c = _center(side, i)
	var l = Line2D.new()
	l.width = 2.0
	l.default_color = Color(1, 1, 1, 0.95)
	l.add_point(c + Vector2(-14, -14))
	l.add_point(c + Vector2(14, 14))
	stage.add_child(l)
	var tw = create_tween()
	tw.tween_property(l, "modulate:a", 0.0, 0.25)
	tw.tween_callback(l.queue_free)

func _show_banner(text, secs = 0.9):
	banner.text = text
	banner_t = secs

func _slide(i, to, dur):
	var from = pb[i].offx
	var tw = create_tween()
	tw.tween_method(func(v): pb[i].offx = v, from, to, dur).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	await tw.finished

func _wait(sec):
	await get_tree().create_timer(sec).timeout

func _wait_a():
	if Game.auto:
		await _wait(0.7)
		return
	await get_tree().process_frame
	while not Input.is_action_just_pressed("a"):
		await get_tree().process_frame

# ---------- per-frame ----------
func _process(delta):
	t += delta
	auto_tag.visible = Game.auto
	if banner_t > 0.0:
		banner_t -= delta
		if banner_t <= 0.0:
			banner.text = ""
	for e in enemies:
		if e.alive:
			e.sprite.texture = e.frames[int(t * 5.0 + e.i * 1.3) % 4]
	for p in pb:
		p.hit = maxf(0.0, p.hit - delta)
	_update_heroes()
	_update_status()
	if phase == "intro":
		slide = maxf(0.0, slide - delta / 0.45)
		for e in enemies:
			e.sprite.position.x = e.x - slide * 180.0
		if slide <= 0.0:
			phase = "main"
		return
	if phase != "main" or busy:
		return
	if not queue.is_empty():
		_exec(queue.pop_front())
		return
	if menu != null:
		_menu_input()
		return
	while not rdy.is_empty() and Game.party[rdy[0]].hp <= 0:
		pb[rdy[0]].ready = false
		rdy.pop_front()
	if not rdy.is_empty():
		var who = rdy[0]
		if Game.auto:
			_consume_ready(who)
			var act = _auto_action(who)
			act.side = "p"
			act.i = who
			queue.append(act)
		else:
			_open_menu(who)
		return
	_tick_atb(delta)

func _tick_atb(delta):
	for i in Game.party.size():
		var m = Game.party[i]
		if m.hp <= 0 or pb[i].ready:
			continue
		pb[i].atb += (_pstats(i).spd + 20) * 2.4 * delta
		if pb[i].atb >= 100.0:
			pb[i].atb = 100.0
			pb[i].ready = true
			rdy.append(i)
	for e in enemies:
		if not e.alive:
			continue
		e.atb += (float(e.d.spd) + 20.0) * 2.4 * delta
		if e.atb >= 100.0:
			e.atb = 0.0
			queue.append(_enemy_ai(e))

func _consume_ready(i):
	pb[i].atb = 0.0
	pb[i].ready = false
	rdy.erase(i)

func _update_heroes():
	for i in Game.party.size():
		var m = Game.party[i]
		var n = hero_nodes[i]
		var p = _party_pos(i)
		var pose = pb[i].pose
		if m.hp <= 0:
			pose = "ko"
		elif pb[i].hit > 0.0:
			pose = "hurt"
		elif phase == "win":
			pose = "win"
		elif flee_fx:
			pose = "walk"
		elif pose == "idle" and float(m.hp) < float(_pstats(i).maxhp) / 4.0:
			pose = "kneel"
		var tx = Game.tex("res://assets/heroes/%s_%s.png" % [m.id, pose])
		n.texture = tx
		var x = p.x + pb[i].offx + slide * 80.0
		if menu != null and menu.who == i and m.hp > 0:
			x -= 8.0
		n.position = Vector2(x - 4.0, p.y) if pose == "ko" else Vector2(x, p.y - 8.0)
		if pose == "win":
			n.position.y -= absf(sin(t * 9.0 + i)) * 5.0

func _update_status():
	for i in Game.party.size():
		var m = Game.party[i]
		var s = _pstats(i)
		var r = rows[i]
		var low = m.hp < s.maxhp / 4.0
		var col = Color("ff7a86") if m.hp <= 0 else (Color("ffd860") if low else UI.INK)
		r.hp.text = str(m.hp)
		r.hp.add_theme_color_override("font_color", col)
		r.hpmax.text = "/%d" % s.maxhp
		r.mp.text = str(m.mp)
		r.hpbar.size.x = 216.0 * clampf(float(m.hp) / float(s.maxhp), 0.0, 1.0)
		r.hpbar.color = Color("ffb040") if low else UI.HP
		r.atb.size.x = 140.0 * clampf(pb[i].atb / 100.0, 0.0, 1.0)
		r.atb.color = Color("ffd76a") if pb[i].atb >= 100.0 else Color("9fb6d2")
		r.bg.color.a = 0.2 if (menu != null and menu.who == i) else 0.0

# ---------- menu ----------
func _open_menu(i):
	var m = Game.party[i]
	menu = {"who": i, "stage": "cmd", "ci": 0, "li": 0, "list": [], "kind": "", "action": null, "tside": "e", "ti": 0, "tmode": "enemy", "prev": "cmd"}
	menu.cmds = ["たたかう", Game.D.heroes[m.id].cmd, "アイテム", "ぼうぎょ", "にげる"]
	for k in 5:
		cmd_labels[k].text = menu.cmds[k]
	_refresh_menu()

func _close_menu():
	menu = null
	cursor.visible = false
	cmd_cursor.visible = false
	list_panel.visible = false
	for l in cmd_labels:
		l.text = ""

func _finish_menu(action):
	var i = menu.who
	_consume_ready(i)
	action.side = "p"
	action.i = i
	if action.kind == "item":
		Game.remove_item(action.id)
	queue.append(action)
	_close_menu()

func _refresh_menu():
	var M = menu
	cmd_cursor.visible = M.stage == "cmd"
	cmd_cursor.position.y = 12 + M.ci * 40
	for k in 5:
		cmd_labels[k].add_theme_color_override("font_color", UI.GOLD if (M.stage == "cmd" and M.ci == k) else UI.INK)
	list_panel.visible = M.stage == "list" or (M.stage == "target" and M.prev == "list")
	cursor.visible = false
	if M.stage == "list":
		var top = clampi(M.li - 4, 0, maxi(0, M.list.size() - 5))
		for k in 5:
			var e = M.list[top + k] if top + k < M.list.size() else null
			list_labels[k][0].text = e.label if e != null else ""
			list_labels[k][1].text = e.right if e != null else ""
			var c = UI.INK if (e != null and e.ok) else UI.DIM
			list_labels[k][0].add_theme_color_override("font_color", UI.GOLD if (e != null and top + k == M.li and e.ok) else c)
		cursor.visible = true
		cursor.position = Vector2(300, 450 + 10 + (M.li - top) * 40)
		_show_banner(M.list[M.li].desc, 0.2)
	elif M.stage == "target":
		cursor.visible = M.tmode == "enemy" or M.tmode == "ally"
		if M.tside == "e":
			var c = _center("e", M.ti) * SCALE
			cursor.position = Vector2(c.x - enemies[M.ti].w * 1.5 - 30, c.y - 14)
		else:
			var c = _center("p", M.ti) * SCALE
			cursor.position = Vector2(c.x - 70, c.y - 14)

func _menu_input():
	var M = menu
	if M.stage == "cmd":
		if Input.is_action_just_pressed("up"):
			M.ci = (M.ci + 4) % 5
			_refresh_menu()
		elif Input.is_action_just_pressed("down"):
			M.ci = (M.ci + 1) % 5
			_refresh_menu()
		elif Input.is_action_just_pressed("b"):
			if rdy.size() > 1:
				rdy.push_back(rdy.pop_front())
				_close_menu()
		elif Input.is_action_just_pressed("menu"):
			_toggle_auto()
		elif Input.is_action_just_pressed("a"):
			_cmd_select(M.ci)
	elif M.stage == "list":
		var n = M.list.size()
		if Input.is_action_just_pressed("up"):
			M.li = (M.li + n - 1) % n
			_refresh_menu()
		elif Input.is_action_just_pressed("down"):
			M.li = (M.li + 1) % n
			_refresh_menu()
		elif Input.is_action_just_pressed("b"):
			M.stage = "cmd"
			banner.text = ""
			_refresh_menu()
		elif Input.is_action_just_pressed("a"):
			var e = M.list[M.li]
			if e.ok:
				if M.kind == "skill":
					_to_target({"kind": "skill", "id": e.id}, Game.D.skills[e.id].target)
				else:
					_to_target({"kind": "item", "id": e.id}, Game.D.items[e.id].get("target", "ally"))
	elif M.stage == "target":
		if M.tmode == "enemies" or M.tmode == "allies":
			if Input.is_action_just_pressed("a"):
				_finish_menu(M.action)
			elif Input.is_action_just_pressed("b"):
				M.stage = M.prev
				_refresh_menu()
			return
		var pool = []
		if M.tside == "e":
			for e in _alive_e():
				pool.append(e.i)
		else:
			for i in Game.party.size():
				pool.append(i)
		var k = pool.find(M.ti)
		if k < 0:
			k = 0
			M.ti = pool[0]
		if Input.is_action_just_pressed("up"):
			M.ti = pool[(k + pool.size() - 1) % pool.size()]
			_refresh_menu()
		elif Input.is_action_just_pressed("down"):
			M.ti = pool[(k + 1) % pool.size()]
			_refresh_menu()
		elif Input.is_action_just_pressed("left") and M.tside == "p":
			M.tside = "e"
			M.ti = _alive_e()[0].i
			_refresh_menu()
		elif Input.is_action_just_pressed("right") and M.tside == "e":
			M.tside = "p"
			M.ti = M.who
			_refresh_menu()
		elif Input.is_action_just_pressed("b"):
			M.stage = M.prev
			_refresh_menu()
		elif Input.is_action_just_pressed("a"):
			var a = M.action
			a.target = {"side": M.tside, "i": M.ti}
			_finish_menu(a)

func _cmd_select(ci):
	var M = menu
	var m = Game.party[M.who]
	match ci:
		0:
			_to_target({"kind": "skill", "id": "attack"}, "enemy")
		1:
			M.list = []
			for id in Game.skills_of(m):
				var sk = Game.D.skills[id]
				if not ["phys", "mag", "heal"].has(sk.kind):
					continue
				M.list.append({"id": id, "label": sk.name, "right": ("MP %d" % int(sk.mp)) if sk.get("mp", 0) else "", "ok": m.mp >= int(sk.get("mp", 0)), "desc": sk.desc})
			M.kind = "skill"
			M.stage = "list"
			M.li = 0
			_refresh_menu()
		2:
			M.list = []
			for id in Game.inv:
				var it = Game.D.items[id]
				if it.type == "use" and (it.has("heal") or it.has("mpheal")):
					M.list.append({"id": id, "label": it.name, "right": "×%d" % Game.inv[id], "ok": true, "desc": it.desc})
			if M.list.is_empty():
				return
			M.kind = "item"
			M.stage = "list"
			M.li = 0
			_refresh_menu()
		3:
			_finish_menu({"kind": "defend"})
		4:
			_finish_menu({"kind": "flee"})

func _to_target(action, mode):
	var M = menu
	M.prev = M.stage
	M.action = action
	M.tmode = mode
	M.stage = "target"
	if mode == "enemy" or mode == "enemies":
		M.tside = "e"
		M.ti = _alive_e()[0].i
	else:
		M.tside = "p"
		M.ti = M.who
		if mode == "ally":
			var lo = M.who
			var best = 2.0
			for i in Game.party.size():
				if Game.party[i].hp > 0:
					var q = float(Game.party[i].hp) / float(_pstats(i).maxhp)
					if q < best:
						best = q
						lo = i
			M.ti = lo
	_refresh_menu()

# ---------- AI ----------
func _enemy_ai(e):
	var sk = "attack"
	var ai = e.d.get("ai", null)
	if typeof(ai) == TYPE_ARRAY:
		var tot = 0.0
		for a in ai:
			tot += float(a[1])
		var r = randf() * tot
		for a in ai:
			r -= float(a[1])
			if r <= 0.0:
				sk = a[0]
				break
	var alive = _alive_p()
	var tgt = alive.pick_random() if not alive.is_empty() else 0
	return {"side": "e", "i": e.i, "kind": "skill", "id": sk, "target": {"side": "p", "i": tgt}}

func _auto_action(who):
	var m = Game.party[who]
	var alive = _alive_p()
	var ens = _alive_e()
	var known = Game.skills_of(m)
	var low = []
	for i in alive:
		if float(Game.party[i].hp) / float(_pstats(i).maxhp) < 0.45:
			low.append(i)
	var tgt_e = {"side": "e", "i": ens.reduce(func(a, b): return a if a.hp <= b.hp else b).i}
	var can = func(id): return known.has(id) and m.mp >= int(Game.D.skills[id].get("mp", 0))
	if not low.is_empty() and can.call("heal"):
		return {"kind": "skill", "id": "heal", "target": {"side": "p", "i": low[0]}}
	var dead = []
	for i in Game.party.size():
		if Game.party[i].hp <= 0:
			dead.append(i)
	if not dead.is_empty() and Game.inv.has("phoenix"):
		Game.remove_item("phoenix")
		return {"kind": "item", "id": "phoenix", "target": {"side": "p", "i": dead[0]}}
	if not low.is_empty() and float(Game.party[low[0]].hp) / float(_pstats(low[0]).maxhp) < 0.3 and Game.inv.has("potion"):
		Game.remove_item("potion")
		return {"kind": "item", "id": "potion", "target": {"side": "p", "i": low[0]}}
	if ens.size() >= 3 and can.call("whirl"):
		return {"kind": "skill", "id": "whirl", "target": tgt_e}
	var weak_e = ens[0]
	for e in ens:
		if e.d.has("weak"):
			weak_e = e
	for id in ["blaze", "fire", "frost", "bolt"]:
		var sk = Game.D.skills.get(id, null)
		if sk != null and can.call(id) and weak_e.d.has("weak") and weak_e.d.weak.has(sk.get("elem", "")):
			return {"kind": "skill", "id": id, "target": {"side": "e", "i": weak_e.i}}
	if can.call("power") and m.mp >= 6:
		return {"kind": "skill", "id": "power", "target": tgt_e}
	return {"kind": "skill", "id": "attack", "target": tgt_e}

# ---------- damage ----------
func _phys(src, dst, mult):
	var A = _stats_of(src.side, src.i)
	var D = _stats_of(dst.side, dst.i)
	if randf() < 0.03:
		return {"miss": true}
	var dmg = A.atk * A.atk / (A.atk + D.def) * 1.6 * mult * (0.88 + randf() * 0.24)
	var crit = randf() < A.crit
	if crit:
		dmg *= 1.8
	if dst.side == "p" and pb[dst.i].defend:
		dmg *= 0.5
	return {"dmg": maxi(1, int(roundf(dmg))), "crit": crit}

func _magic(src, dst, sk):
	var A = _stats_of(src.side, src.i)
	var D = _stats_of(dst.side, dst.i)
	var m = float(sk.power) + A.mag * 2.0
	var dmg = m * m / (m + D.mdf) * (0.9 + randf() * 0.2)
	var note = ""
	if dst.side == "e":
		var d = enemies[dst.i].d
		var el = sk.get("elem", "")
		if d.has("weak") and d.weak.has(el):
			dmg *= 1.8
			note = "weak"
		if d.has("absorb") and d.absorb.has(el):
			return {"heal": int(roundf(dmg * 0.6))}
	if dst.side == "p" and pb[dst.i].defend:
		dmg *= 0.7
	return {"dmg": maxi(1, int(roundf(dmg))), "note": note}

func _damage(side, i, n, color = Color.WHITE, big = false):
	if side == "p":
		var m = Game.party[i]
		m.hp = maxi(0, m.hp - n)
		pb[i].hit = 0.35
		if m.hp <= 0:
			pb[i].atb = 0.0
			pb[i].ready = false
			rdy.erase(i)
	else:
		var e = enemies[i]
		e.hp = maxi(0, e.hp - n)
		_flash_enemy(e)
		if e.hp <= 0 and e.alive:
			e.alive = false
			var tw = create_tween()
			tw.tween_property(e.sprite, "modulate:a", 0.0, 0.5)
	_popup(side, i, n, color, big)

func _flash_enemy(e):
	var tw = create_tween()
	tw.tween_property(e.sprite, "modulate", Color(1, 0.4, 0.4), 0.05)
	tw.tween_property(e.sprite, "modulate", Color(1, 1, 1), 0.12)

func _heal(side, i, n):
	if side == "p":
		var m = Game.party[i]
		m.hp = mini(_pstats(i).maxhp, m.hp + n)
	else:
		var e = enemies[i]
		e.hp = mini(e.maxhp, e.hp + n)
	_popup(side, i, n, Color("7dffa0"))

func _fx_for(sk):
	var f = sk.get("fx", "claw")
	match f:
		"fire": return [Color("fff4a0"), Color("ffa030"), Color("e03a20")]
		"ice": return [Color("ffffff"), Color("80d8ff"), Color("3aa8ff")]
		"bolt": return [Color("ffffff"), Color("fff080")]
		"heal": return [Color("ffffff"), Color("60ffb0")]
		"holy": return [Color("ffffff"), Color("fff0a0")]
		"dark": return [Color("e0a0ff"), Color("8030c0")]
	return [Color("ffffff"), Color("ffd080")]

# ---------- action execution ----------
func _exec(a):
	busy = true
	if not _is_alive(a.side, a.i):
		busy = false
		return
	if a.side == "p":
		pb[a.i].defend = false
	if a.kind == "defend":
		pb[a.i].defend = true
		_show_banner("ぼうぎょ")
		await _wait(0.45)
		_end_action()
		return
	if a.kind == "flee":
		await _flee()
		return
	var sk = null
	var item = null
	if a.kind == "item":
		item = Game.D.items[a.id]
	else:
		sk = Game.D.skills[a.id]
	var mode = item.get("target", "ally") if item != null else sk.target
	var targets = []
	var other = "e" if a.side == "p" else "p"
	var all_of = func(side):
		var out = []
		if side == "e":
			for e in _alive_e():
				out.append({"side": "e", "i": e.i})
		else:
			for i in _alive_p():
				out.append({"side": "p", "i": i})
		return out
	var wants_dead = item != null and item.has("revive")
	if mode == "enemies":
		targets = all_of.call(other)
	elif mode == "allies":
		targets = all_of.call(a.side)
	else:
		var tg = a.target
		if not wants_dead and not _is_alive(tg.side, tg.i):
			var pool = all_of.call(tg.side)
			if pool.is_empty():
				_end_action()
				return
			tg = pool.pick_random()
		targets = [tg]
	if targets.is_empty():
		_end_action()
		return
	if sk != null and a.side == "p" and sk.get("mp", 0):
		var m = Game.party[a.i]
		if m.mp < int(sk.mp):
			_show_banner("MPが足りない!")
			await _wait(0.6)
			_end_action()
			return
		m.mp -= int(sk.mp)
	if item != null:
		_show_banner(item.name)
	elif a.id != "attack":
		_show_banner(sk.name)
	var melee = sk != null and sk.kind == "phys"
	var src = {"side": a.side, "i": a.i}
	var dash = 0.0
	if a.side == "p":
		if melee:
			var tx = 104.0 if mode == "enemies" else enemies[targets[0].i].x + enemies[targets[0].i].w - 2.0
			dash = maxf(18.0, _party_pos(a.i).x + 4.0 - tx)
			pb[a.i].pose = "strike"
			await _slide(a.i, -dash, 0.16)
		else:
			pb[a.i].pose = "cast"
			await _slide(a.i, -16.0, 0.1)
			if sk != null:
				for tgt in targets:
					_burst(tgt.side, tgt.i, _fx_for(sk), 8, 14.0)
				await _wait(0.25)
	else:
		var e = enemies[a.i]
		for k in 2:
			e.sprite.modulate.a = 0.4
			await _wait(0.05)
			e.sprite.modulate.a = 1.0
			await _wait(0.05)
		var tw2 = create_tween()
		tw2.tween_property(e.sprite, "position:x", e.x + 14.0, 0.1)
		tw2.tween_property(e.sprite, "position:x", e.x, 0.1)
	# effect and damage
	if item != null:
		for tg in targets:
			_apply_item(item, tg)
	else:
		for tg in targets:
			if not wants_dead and not _is_alive(tg.side, tg.i):
				continue
			if melee or sk.get("fx", "") in ["slash", "slash2", "claw", "whirl", "braver"]:
				_slash_fx(tg.side, tg.i)
			else:
				_burst(tg.side, tg.i, _fx_for(sk), 18, 22.0)
			_apply_skill(sk, src, tg)
	await _wait(0.45)
	if a.side == "p":
		await _slide(a.i, 0.0, 0.15)
		pb[a.i].pose = "idle"
	_end_action()

func _apply_skill(sk, src, tg):
	match sk.kind:
		"phys":
			var r = _phys(src, tg, float(sk.mult))
			if r.has("miss"):
				_popup(tg.side, tg.i, "MISS", Color("cccccc"))
				return
			_damage(tg.side, tg.i, r.dmg, Color("ffe060") if r.crit else Color.WHITE, r.crit)
		"mag":
			var r = _magic(src, tg, sk)
			if r.has("heal"):
				_heal(tg.side, tg.i, r.heal)
			else:
				_damage(tg.side, tg.i, r.dmg, Color("ffb040") if r.note == "weak" else Color.WHITE, r.note == "weak")
		"heal":
			var A = _stats_of(src.side, src.i)
			_heal(tg.side, tg.i, int(roundf((float(sk.power) + A.mag * 2.4) * (0.92 + randf() * 0.16))))

func _apply_item(item, tg):
	var m = Game.party[tg.i]
	var s = _pstats(tg.i)
	if item.has("revive"):
		if m.hp <= 0:
			m.hp = maxi(1, int(floor(s.maxhp * float(item.revive))))
			pb[tg.i].atb = 0.0
			_popup("p", tg.i, m.hp, Color("7dffa0"))
		return
	if m.hp <= 0:
		_popup("p", tg.i, "MISS", Color("cccccc"))
		return
	if item.has("heal"):
		_heal("p", tg.i, mini(int(item.heal), s.maxhp - m.hp))
	if item.has("mpheal"):
		var n = mini(int(item.mpheal), s.maxmp - m.mp)
		m.mp += n
		_popup("p", tg.i, n, UI.MP)

func _flee():
	var ps = 0.0
	var es = 0.0
	for i in _alive_p():
		ps += _pstats(i).spd
	ps /= maxf(1.0, _alive_p().size())
	for e in _alive_e():
		es += float(e.d.spd)
	es /= maxf(1.0, _alive_e().size())
	var ch = clampf(0.55 + (ps - es) * 0.03, 0.25, 0.92)
	if randf() < ch:
		_show_banner("逃げ出した!", 1.0)
		flee_fx = true
		var tw = create_tween()
		tw.set_parallel(true)
		for i in pb.size():
			tw.tween_method(func(v): pb[i].offx = v, 0.0, 90.0, 0.7)
		await tw.finished
		phase = "end"
		_leave()
	else:
		_show_banner("逃げられなかった!")
		await _wait(0.7)
		_end_action()

func _end_action():
	busy = false
	if phase != "main":
		return
	if _alive_e().is_empty():
		phase = "win"
		queue.clear()
		_victory()
	elif _alive_p().is_empty():
		phase = "lose"
		queue.clear()
		_defeat()

# ---------- end of battle ----------
func _leave():
	Engine.time_scale = 1.0
	Game.main.change("field")

func _victory():
	await _wait(0.5)
	var exp = 0
	var gil = 0
	var drops = []
	for e in enemies:
		exp += int(e.d.exp)
		gil += int(e.d.gil)
		if e.d.has("drop") and randf() < float(e.d.drop[1]):
			drops.append(e.d.drop[0])
	Game.gil += gil
	for d in drops:
		Game.add_item(d)
	var lines = []
	for m in Game.party:
		lines.append_array(Game.gain_exp(m, exp))
	result_panel = UI.panel(ui, Rect2(150, 130, 468, 150 + drops.size() * 34))
	UI.label(result_panel, "VICTORY", Vector2(0, 8), 44, UI.GOLD, HORIZONTAL_ALIGNMENT_CENTER, 468)
	UI.label(result_panel, "EXP  %d" % exp, Vector2(50, 78), 28)
	UI.label(result_panel, "ギル  %d" % gil, Vector2(260, 78), 28, UI.GOLD)
	var y = 124
	for d in drops:
		UI.label(result_panel, "%s を手に入れた!" % Game.D.items[d].name, Vector2(0, y), 24, Color("c8f0ff"), HORIZONTAL_ALIGNMENT_CENTER, 468)
		y += 34
	await _wait_a()
	result_panel.queue_free()
	for l in lines:
		msg_label.text = l
		await _wait_a()
	msg_label.text = ""
	phase = "end"
	_leave()

func _defeat():
	await _wait(0.8)
	msg_label.text = "全滅してしまった…"
	await _wait_a()
	Engine.time_scale = 1.0
	Game.heal_all()
	Game.map_id = "elm"
	Game.pos = Vector2i(12, 12)
	Game.dir = "up"
	Game.gil = Game.gil / 2
	Game.main.change("field")
