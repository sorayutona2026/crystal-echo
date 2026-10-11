import pathlib, base64, json
root = pathlib.Path(__file__).parent
src = root / 'src'
order = ['engine.js', 'assets.js', 'audio.js', 'data.js', 'battle.js', 'ai.js', 'ui.js', 'main.js']
js = '\n'.join((src / f).read_text() for f in order)
# embed every PNG referenced by the manifest (and only those) as a data URL
manifest = json.loads((root / 'assets' / 'manifest.json').read_text())
files = set()
for u in manifest['units'].values(): files.add(u['file'])
for g in ('faces', 'tiles', 'deco', 'fx', 'bg', 'icons'):
    for t in manifest[g].values(): files.add(t['file'])
imgs = {f: 'data:image/png;base64,' + base64.b64encode((root / 'assets' / f).read_bytes()).decode() for f in sorted(files)}
js += '\nconst MANIFEST = ' + json.dumps(manifest) + ';\nconst ASSET_IMG = ' + json.dumps(imgs) + ';'
shell = (src / 'shell.html').read_text()
page = shell + '\n<script>\n' + js + '\n</script>\n'
(root / 'dist').mkdir(exist_ok=True); (root / 'test').mkdir(exist_ok=True)
(root / 'dist' / 'tactics.html').write_text(page)
# local test harness with a full document skeleton
(root / 'test' / 'index.html').write_text('<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>星砕きの戦旗</title></head><body>' + page + '</body></html>')
print('built', len(page), 'bytes')
