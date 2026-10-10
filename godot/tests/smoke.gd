extends SceneTree
# Headless smoke test: title -> new game -> walk out of Elm -> auto battle -> back on the field.
# Run: godot --headless --fixed-fps 60 --script res://tests/smoke.gd

var fails = 0
var G

func check(name, ok, extra = ""):
	print(("PASS " if ok else "FAIL ") + name + " " + str(extra))
	if not ok:
		fails += 1

func wait(sec):
	await create_timer(sec).timeout

func send(action, pressed):
	var e = InputEventAction.new()
	e.action = action
	e.pressed = pressed
	Input.parse_input_event(e)

func hold(action, sec):
	send(action, true)
	await wait(sec)
	send(action, false)
	await wait(0.2)

func tap(action):
	await hold(action, 0.1)

func _initialize():
	G = root.get_node("Game")
	var main = load("res://main.tscn").instantiate()
	root.add_child(main)
	run(main)

func run(main):
	await wait(1.0)
	check("title shown", main.current != null and main.current.get_script().resource_path.ends_with("title.gd"))
	await tap("a")
	await wait(1.2)
	check("field after new game", main.current.get_script().resource_path.ends_with("field.gd"), G.map_id)
	check("party of two", G.party.size() == 2)
	await hold("down", 1.4)
	await hold("up", 0.6)
	check("walked", G.pos != Vector2i(12, 12), G.pos)
	# talk to an NPC: stand next to the village guard region by just pressing A; dialog must open and close
	await tap("a")
	# leave Elm through the south edge
	G.pos = Vector2i(12, 18)
	main.current.gy = 18
	main.current.gx = 12
	main.current.player.position = Vector2(12 * 16, 18 * 16)
	await hold("down", 1.2)
	await wait(1.0)
	check("reached world map", G.map_id == "world", G.map_id)
	# battle with auto
	var before_exp = G.party[0].exp
	G.auto = true
	main.change("battle", {"ids": ["slime", "goblin", "bat"], "bg": "plains"})
	await wait(1.0)
	check("battle scene", main.current.get_script().resource_path.ends_with("battle.gd"))
	var t = 0.0
	while t < 120.0 and not main.current.get_script().resource_path.ends_with("field.gd"):
		await wait(0.5)
		t += 0.5
	check("battle ended back on field", main.current.get_script().resource_path.ends_with("field.gd"), "after %.1fs" % t)
	check("exp gained", G.party[0].exp > before_exp, "%d -> %d" % [before_exp, G.party[0].exp])
	G.auto = false
	# manual menu: open a battle, press A on "たたかう", A on target, expect an action to run
	main.change("battle", {"ids": ["slime"], "bg": "forest"})
	await wait(2.5)
	var b = main.current
	var opened = false
	var tt = 0.0
	while tt < 10.0 and b.menu == null:
		await wait(0.2)
		tt += 0.2
	opened = b.menu != null
	check("command menu opens when ATB fills", opened)
	if opened:
		await tap("a")
		await wait(0.2)
		check("target stage", b.menu != null and b.menu.stage == "target")
		await tap("a")
		await wait(1.5)
		check("attack dealt damage", b.enemies[0].hp < b.enemies[0].maxhp or not b.enemies[0].alive)
	# save / load round trip
	G.new_game()
	G.gil = 777
	G.pos = Vector2i(5, 5)
	G.save_game()
	G.gil = 1
	check("save/load", G.load_game() and G.gil == 777 and G.pos == Vector2i(5, 5))
	print("SMOKE: ", "OK" if fails == 0 else "FAILED (%d)" % fails)
	quit(1 if fails > 0 else 0)
