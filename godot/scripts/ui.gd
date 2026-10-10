class_name UI
extends RefCounted
# Small helpers to build the game's windows and text in code.

const INK = Color("f3ede0")
const GOLD = Color("f0cf86")
const LABEL = Color("9fb6d2")
const MUTED = Color("b4ad9f")
const DIM = Color("6b665f")
const HP = Color("8fe3a0")
const MP = Color("8cc8ff")

static func panel(parent, rect):
	var p = Panel.new()
	p.position = rect.position
	p.size = rect.size
	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0.06, 0.07, 0.16, 0.94)
	sb.border_color = Color(0.85, 0.72, 0.44)
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(6)
	sb.shadow_color = Color(0, 0, 0, 0.4)
	sb.shadow_size = 4
	p.add_theme_stylebox_override("panel", sb)
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(p)
	return p

static func label(parent, text, pos, size = 24, color = INK, align = HORIZONTAL_ALIGNMENT_LEFT, width = 0):
	var l = Label.new()
	l.text = text
	l.position = pos
	l.add_theme_font_override("font", Game.font)
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.8))
	l.add_theme_constant_override("shadow_offset_x", 1)
	l.add_theme_constant_override("shadow_offset_y", 2)
	l.horizontal_alignment = align
	if width > 0:
		l.custom_minimum_size = Vector2(width, 0)
		l.size = Vector2(width, size + 8)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(l)
	return l

static func bar(parent, pos, w, h, color):
	var bg = ColorRect.new()
	bg.position = pos
	bg.size = Vector2(w, h)
	bg.color = Color(1, 1, 1, 0.1)
	parent.add_child(bg)
	var fill = ColorRect.new()
	fill.position = pos
	fill.size = Vector2(0, h)
	fill.color = color
	parent.add_child(fill)
	return fill
