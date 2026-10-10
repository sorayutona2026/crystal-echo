import pathlib
root = pathlib.Path(__file__).parent
src = root / 'src'
js = '\n'.join((src / f).read_text() for f in ['engine.js', 'audio.js', 'art.js', 'hd_art.js', 'hd_world.js', 'hd_heroes.js', 'hd_front.js', 'hd_anime.js', 'hd_enemies.js', 'enemies_art.js', 'post.js', 'render_map.js', 'data.js', 'game.js', 'battle.js', 'menu.js', 'main.js'])
import base64
# painted portraits (assets/portrait_<id>.jpg) are embedded as data URIs; the game falls back to the vector busts if one is missing
imgs = {f.stem.replace('portrait_', ''): 'data:image/jpeg;base64,' + base64.b64encode(f.read_bytes()).decode() for f in sorted((root / 'assets').glob('portrait_*.jpg'))}
js += '\nconst PORTRAIT_IMG = ' + repr(imgs) + ';'
# painted battle sprites (assets/battle_<id>.png, 64x80 with alpha) replace the code-drawn ones once decoded
bimgs = {f.stem.replace('battle_', ''): 'data:image/png;base64,' + base64.b64encode(f.read_bytes()).decode() for f in sorted((root / 'assets').glob('battle_*.png'))}
js += '\nconst BATTLE_IMG = ' + repr(bimgs) + ';'
glyphs = ''.join(sorted({c for c in js if ord(c) > 127}))
js = 'const GLYPHS = ' + repr(glyphs) + ';\n' + js
shell = (src / 'shell.html').read_text()
page = shell + '\n<script>\n' + js + '\n</script>\n'
(root / 'dist' / 'crystal-echo.html').write_text(page)
(root / 'dist' / 'game.js').write_text(js)
# local test harness with full document skeleton
(root / 'test' / 'index.html').write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}</style></head><body>' + page + '</body></html>')
print('built', len(page), 'bytes')
