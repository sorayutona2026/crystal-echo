import pathlib
root = pathlib.Path(__file__).parent
src = root / 'src'
order = ['engine.js', 'audio.js', 'art.js', 'data.js', 'dungeon.js', 'game.js', 'ui.js', 'main.js']
js = '\n'.join((src / f).read_text() for f in order)
glyphs = ''.join(sorted({c for c in js if ord(c) > 127}))
js = 'const GLYPHS = ' + repr(glyphs) + ';\n' + js
shell = (src / 'shell.html').read_text()
page = shell + '\n<script>\n' + js + '\n</script>\n'
(root / 'dist').mkdir(exist_ok=True); (root / 'test').mkdir(exist_ok=True)
(root / 'dist' / 'nemuri.html').write_text(page)
# local test harness with a full document skeleton
(root / 'test' / 'index.html').write_text('<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>ねむりの迷宮</title></head><body>' + page + '</body></html>')
print('built', len(page), 'bytes')
