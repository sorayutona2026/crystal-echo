extends Node2D

var arg
var t = 0.0
var sel = 0
var opts = []
var labels = []
var cursor
var stars = []

func _ready():
	var r = RandomNumberGenerator.new()
	r.seed = 7
	for i in 90:
		stars.append([r.randf() * 768, r.randf() * 400, r.randi() % 3 + 1, r.randf() * 6.0])
	var ui = CanvasLayer.new()
	add_child(ui)
	var shadow = UI.label(ui, "CRYSTAL ECHO", Vector2(0, 118), 74, Color("e8c870"), HORIZONTAL_ALIGNMENT_CENTER, 768)
	UI.label(ui, "クリスタル・エコー", Vector2(0, 208), 26, Color("e6dccb"), HORIZONTAL_ALIGNMENT_CENTER, 768)
	opts = ["はじめから"]
	if Game.has_save():
		opts.append("つづきから")
		sel = 1
	for i in opts.size():
		labels.append(UI.label(ui, opts[i], Vector2(330, 300 + i * 48), 28))
	cursor = UI.label(ui, "▶", Vector2(292, 300), 28, UI.GOLD)
	UI.label(ui, "Godot版(試作)  Z/タップ:決定  スワイプ:移動", Vector2(0, 628), 18, Color(0.9, 0.86, 0.78, 0.6), HORIZONTAL_ALIGNMENT_CENTER, 768)

func _process(delta):
	t += delta
	queue_redraw()
	if Input.is_action_just_pressed("up") or Input.is_action_just_pressed("down"):
		sel = (sel + 1) % opts.size()
	for i in labels.size():
		labels[i].add_theme_color_override("font_color", UI.GOLD if i == sel else UI.INK)
	cursor.position = Vector2(292 + sin(t * 8.0) * 3.0, 300 + sel * 48)
	if Input.is_action_just_pressed("a"):
		if opts[sel] == "はじめから":
			Game.new_game()
		else:
			Game.load_game()
		Game.main.change("field")

func _draw():
	for i in 40:
		var k = i / 40.0
		draw_rect(Rect2(0, i * 17, 768, 18), Color(0.03 + k * 0.2, 0.04 + k * 0.17, 0.14 + k * 0.28))
	for s in stars:
		var a = 0.4 + 0.6 * absf(sin(t * 1.2 + s[3]))
		draw_rect(Rect2(s[0], s[1], s[2], s[2]), Color(0.85, 0.88, 1.0, a))
	draw_rect(Rect2(500, 150, 42, 340), Color(0.08, 0.08, 0.2))
	var g = 0.7 + 0.3 * sin(t * 2.4)
	draw_colored_polygon(PackedVector2Array([Vector2(521, 80), Vector2(534, 106), Vector2(521, 132), Vector2(508, 106)]), Color(0.5, 0.9, 1.0, g))
	draw_colored_polygon(PackedVector2Array([Vector2(0, 672), Vector2(0, 520), Vector2(200, 470), Vector2(420, 500), Vector2(600, 520), Vector2(768, 500), Vector2(768, 672)]), Color(0.04, 0.07, 0.09))
	var a1 = Game.tex("res://assets/chars/allen_up_0.png")
	var l1 = Game.tex("res://assets/chars/lina_up_0.png")
	draw_texture_rect(a1, Rect2(200, 520, 64, 64), false)
	draw_texture_rect(l1, Rect2(264, 524, 64, 64), false)
