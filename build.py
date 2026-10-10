import pathlib
root = pathlib.Path(__file__).parent
src = root / 'src'
js = '\n'.join((src / f).read_text() for f in ['engine.js', 'audio.js', 'art.js', 'hd_art.js', 'hd_world.js', 'hd_heroes.js', 'hd_front.js', 'enemies_art.js', 'post.js', 'render_map.js', 'data.js', 'game.js', 'battle.js', 'menu.js', 'main.js'])
glyphs = ''.join(sorted({c for c in js if ord(c) > 127}))
js = 'const GLYPHS = ' + repr(glyphs) + ';\n' + js
shell = (src / 'shell.html').read_text()
page = shell + '\n<script>\n' + js + '\n</script>\n'
(root / 'dist' / 'crystal-echo.html').write_text(page)
(root / 'dist' / 'game.js').write_text(js)
# local test harness with full document skeleton
(root / 'test' / 'index.html').write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}</style></head><body>' + page + '</body></html>')
print('built', len(page), 'bytes')
