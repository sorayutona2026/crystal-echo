extends Node2D
# Scene switcher with fades, plus swipe / tap touch controls (a floating joystick wherever the finger lands).

const TitleS = preload("res://scripts/title.gd")
const FieldS = preload("res://scripts/field.gd")
const BattleS = preload("res://scripts/battle.gd")

var current
var fade
var changing = false
var touch_id = -1
var anchor = Vector2()
var moved = false
var t0 = 0
var cur_dir = ""

func _ready():
	Game.main = self
	var cl = CanvasLayer.new()
	cl.layer = 100
	add_child(cl)
	fade = ColorRect.new()
	fade.color = Color.BLACK
	fade.size = Vector2(768, 672)
	fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	fade.modulate.a = 0.0
	cl.add_child(fade)
	var start = ""
	if OS.has_feature("web"):
		var q = JavaScriptBridge.eval("new URLSearchParams(window.location.search).get('start') || ''")
		start = str(q)
	# QA shortcuts: index.html?start=battle | boss | dialog | world
	if start == "battle" or start == "boss" or start == "dialog" or start == "world":
		Game.new_game()
		for m in Game.party:
			m.lv = 4
			m.exp = Game.exp_at(4)
		Game.heal_all()
		if start == "world":
			Game.map_id = "world"
			Game.pos = Vector2i(12, 10)
			change("field")
		elif start == "dialog":
			Game.pos = Vector2i(11, 17)
			Game.dir = "down"
			change("field")
		else:
			change("battle", {"ids": ["wolf", "bee", "gmage"] if start == "battle" else ["golem"], "bg": "dusk" if start == "battle" else "plains"})
	else:
		change("title")

func change(scene_name, arg = null):
	if changing:
		return
	changing = true
	var tw = create_tween()
	tw.tween_property(fade, "modulate:a", 1.0, 0.25)
	await tw.finished
	Engine.time_scale = 1.0
	if current != null:
		current.queue_free()
		await get_tree().process_frame
	var n
	match scene_name:
		"title": n = TitleS.new()
		"field": n = FieldS.new()
		"battle": n = BattleS.new()
	n.arg = arg
	add_child(n)
	current = n
	var tw2 = create_tween()
	tw2.tween_property(fade, "modulate:a", 0.0, 0.25)
	await tw2.finished
	changing = false

# ---------- touch ----------
func _set_dir(d):
	if d == cur_dir:
		return
	for k in ["up", "down", "left", "right"]:
		if k == d:
			Input.action_press(k)
		else:
			Input.action_release(k)
	cur_dir = d

func _tap():
	Input.action_press("a")
	await get_tree().create_timer(0.07, true, false, true).timeout
	Input.action_release("a")

func _input(e):
	if e is InputEventScreenTouch:
		if e.pressed and touch_id == -1:
			touch_id = e.index
			anchor = e.position
			moved = false
			t0 = Time.get_ticks_msec()
		elif not e.pressed and e.index == touch_id:
			touch_id = -1
			_set_dir("")
			if not moved and Time.get_ticks_msec() - t0 < 300:
				_tap()
	elif e is InputEventScreenDrag and e.index == touch_id:
		var d = e.position - anchor
		var len = d.length()
		if len > 18:
			moved = true
		if len > 60:
			anchor = e.position - d / len * 60.0
			d = e.position - anchor
		if len < 18:
			_set_dir("")
		elif absf(d.x) > absf(d.y):
			_set_dir("right" if d.x > 0 else "left")
		else:
			_set_dir("down" if d.y > 0 else "up")
