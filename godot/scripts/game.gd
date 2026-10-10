extends Node
# Global state and helpers (autoload "Game"): data tables exported from the JS game, party, flags, save/load.

const SAVE_PATH = "user://save.json"
var D = {}
var font
var tex_cache = {}
var party = []
var inv = {}
var gil = 0
var flags = {}
var map_id = "elm"
var pos = Vector2i(12, 12)
var dir = "down"
var auto = false
var main

func _ready():
	var f = FileAccess.open("res://assets/data.json", FileAccess.READ)
	D = JSON.parse_string(f.get_as_text())
	for id in D.maps:
		var m = D.maps[id]
		m.w = int(m.w)
		m.h = int(m.h)
		m.rate = int(m.rate)
	font = load("res://fonts/ipag.ttf")
	_setup_input()

func _setup_input():
	var keys = {
		"up": [KEY_UP, KEY_W], "down": [KEY_DOWN, KEY_S], "left": [KEY_LEFT, KEY_A], "right": [KEY_RIGHT, KEY_D],
		"a": [KEY_Z, KEY_ENTER, KEY_SPACE], "b": [KEY_X, KEY_BACKSPACE], "menu": [KEY_C, KEY_ESCAPE, KEY_M]}
	for act in keys:
		if not InputMap.has_action(act):
			InputMap.add_action(act)
		for k in keys[act]:
			var e = InputEventKey.new()
			e.physical_keycode = k
			InputMap.action_add_event(act, e)

func tex(path):
	if not tex_cache.has(path):
		tex_cache[path] = load(path) if ResourceLoader.exists(path) else null
	return tex_cache[path]

# ---------- party ----------
func item(id):
	return D.items.get(id, {})

func exp_at(lv):
	return int(D.expTable[lv - 1])

func new_member(id, lv = 1):
	var h = D.heroes[id]
	var m = {"id": id, "lv": lv, "exp": exp_at(lv), "weapon": h.weapon, "armor": h.armor, "hp": 0, "mp": 0}
	var s = stats(m)
	m.hp = s.maxhp
	m.mp = s.maxmp
	return m

func stats(m):
	var h = D.heroes[m.id]
	var L = m.lv - 1
	var w = item(m.weapon)
	var a = item(m.armor)
	var g = func(k): return int(floor(h.base[k] + h.grow[k] * L))
	return {
		"maxhp": mini(9999, g.call("hp")), "maxmp": mini(999, g.call("mp")),
		"str": g.call("str"), "def": g.call("def") + int(a.get("def", 0)), "mag": g.call("mag") + int(w.get("mag", 0)),
		"mdf": g.call("mdf") + int(a.get("mdf", 0)), "spd": g.call("spd") + int(w.get("spd", 0)),
		"atk": g.call("str") + int(w.get("atk", 0)), "crit": float(h.crit)}

func skills_of(m):
	var out = []
	for s in D.heroes[m.id].skills:
		if m.lv >= int(s[1]):
			out.append(s[0])
	return out

func heal_all():
	for m in party:
		var s = stats(m)
		m.hp = s.maxhp
		m.mp = s.maxmp

func gain_exp(m, n):
	var msgs = []
	if m.hp <= 0:
		return msgs
	m.exp += n
	while m.lv < 50 and m.exp >= exp_at(m.lv + 1):
		var before = stats(m)
		var known = skills_of(m)
		m.lv += 1
		var after = stats(m)
		m.hp += after.maxhp - before.maxhp
		m.mp += after.maxmp - before.maxmp
		msgs.append("%sはレベル%dになった!" % [D.heroes[m.id].name, m.lv])
		for s in skills_of(m):
			if not known.has(s):
				msgs.append("%sは「%s」を覚えた!" % [D.heroes[m.id].name, D.skills[s].name])
	return msgs

func add_item(id, n = 1):
	inv[id] = mini(99, int(inv.get(id, 0)) + n)

func remove_item(id):
	inv[id] = int(inv.get(id, 0)) - 1
	if inv[id] <= 0:
		inv.erase(id)

func new_game():
	party = [new_member("allen"), new_member("lina")]
	inv = {"potion": 3, "antidote": 1}
	gil = 200
	flags = {}
	map_id = "elm"
	pos = Vector2i(12, 12)
	dir = "up"

# ---------- save / load ----------
func has_save():
	return FileAccess.file_exists(SAVE_PATH)

func save_game():
	var f = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f == null:
		return false
	f.store_string(JSON.stringify({"party": party, "inv": inv, "gil": gil, "flags": flags, "map": map_id, "x": pos.x, "y": pos.y, "dir": dir}))
	return true

func load_game():
	if not has_save():
		return false
	var d = JSON.parse_string(FileAccess.open(SAVE_PATH, FileAccess.READ).get_as_text())
	if typeof(d) != TYPE_DICTIONARY:
		return false
	party = d.party
	for m in party:
		m.lv = int(m.lv); m.exp = int(m.exp); m.hp = int(m.hp); m.mp = int(m.mp)
	inv = d.inv
	for k in inv:
		inv[k] = int(inv[k])
	gil = int(d.gil)
	flags = d.flags
	map_id = d.map
	pos = Vector2i(int(d.x), int(d.y))
	dir = d.dir
	return true
