#!/usr/bin/env python3
"""Deterministic preparation of the ChatGPT-generated art (user supplied, see GPT_PROMPTS.md).
Input : art-src/gpt_faces_sheet.png, art-src/gpt_units_sheet.png   (kept as-is, not embedded)
Output: assets/gpt/face_<id>.webp (256x256), assets/gpt/full_<id>.webp (cleaned full-body with alpha), assets/gpt/contact.png (review sheet)
Also  : art-src/bg_title.png, bg_village.png, bg_sheet_6.png (2x3 grid of backgrounds), map_ch1.png (painted ch1 battlefield)
        -> assets/gpt/bg_<name>.webp (about 1280 px wide, quality 80) and assets/gpt/map_ch1.webp + map_ch1.json (grid-aligned battlefield)
Run   : python3 tools/prep_gpt_art.py
"""
import pathlib, json
import numpy as np
from PIL import Image, ImageFilter

root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'art-src'; out = root / 'assets' / 'gpt'; out.mkdir(parents=True, exist_ok=True)
FACE_IDS = ['leon', 'mira', 'luka', 'sophia', 'jin', 'garud', 'verza', 'goblin', 'skeleton', 'slime']
FLIP_FACE = {'jin', 'skeleton'}          # make every portrait look toward the dialogue text (to the right)

# ---------------------------------------------------------------- faces
def runs(flags):
    r, s = [], None
    for i, v in enumerate(flags):
        if v and s is None: s = i
        if not v and s is not None: r.append((s, i)); s = None
    if s is not None: r.append((s, len(flags)))
    return r

def split_faces():
    im = Image.open(src / 'gpt_faces_sheet.png').convert('RGB'); a = np.array(im).astype(int)
    light = (a.min(axis=2) >= 238)            # white gutters and the light margins around the centred last row
    rows = [r for r in runs(light.mean(axis=1) < 0.93) if r[1] - r[0] > 60]
    cells = []
    for (y0, y1) in rows:
        cols = [c for c in runs(light[y0:y1].mean(axis=0) < 0.93) if c[1] - c[0] > 60]
        for (x0, x1) in cols: cells.append((x0, y0, x1, y1))
    assert len(cells) == 10, 'expected 10 portrait cells, got %d: %s' % (len(cells), cells)
    return im, cells

def make_faces():
    im, cells = split_faces()
    for fid, (x0, y0, x1, y1) in zip(FACE_IDS, cells):
        w, h = x1 - x0, y1 - y0; side = min(w, h)
        # square crop: centred horizontally, biased to the top (faces sit in the upper part)
        cx = x0 + (w - side) // 2; cy = y0 + int((h - side) * 0.15)
        c = im.crop((cx, cy, cx + side, cy + side)).resize((256, 256), Image.LANCZOS)
        if fid in FLIP_FACE: c = c.transpose(Image.FLIP_LEFT_RIGHT)
        c.save(out / ('face_%s.webp' % fid), 'WEBP', quality=90, method=6)
    return cells

# ---------------------------------------------------------------- full-body figures
def erode(mask, n):
    m = mask.copy()
    for _ in range(n):
        p = np.pad(m, 1, constant_values=False)
        m = p[1:-1, 1:-1] & p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:]
    return m

def label(mask):
    H, W = mask.shape; lab = np.zeros((H, W), np.int32); n = 0; info = []
    for y in range(H):
        for x in range(W):
            if mask[y, x] and not lab[y, x]:
                n += 1; st = [(y, x)]; lab[y, x] = n; ys = []; xs = []
                while st:
                    cy, cx = st.pop(); ys.append(cy); xs.append(cx)
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            ny, nx = cy + dy, cx + dx
                            if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not lab[ny, nx]: lab[ny, nx] = n; st.append((ny, nx))
                info.append((n, len(ys), float(np.mean(xs)), float(np.mean(ys))))
    return lab, info

def spread(lab, steps, valid=None):
    """propagate labels into zero pixels (nearest-label fill, 8-neighbourhood)"""
    lab = lab.copy()
    for _ in range(steps):
        p = np.pad(lab, 1); z = lab == 0
        cand = np.zeros_like(lab)
        for dy in (0, 1, 2):
            for dx in (0, 1, 2):
                if dy == 1 and dx == 1: continue
                sh = p[dy:dy + lab.shape[0], dx:dx + lab.shape[1]]
                cand = np.where(cand == 0, sh, cand)
        lab = np.where(z & (valid if valid is not None else True), cand, lab)
        if not (lab == 0).any(): break
    return lab

def bleed_colour(rgb, solid, steps=6):
    """replace colours of fringe pixels by the nearest solid interior colour (kills red/yellow halos)"""
    rgb = rgb.astype(np.float32).copy(); known = solid.copy()
    for _ in range(steps):
        acc = np.zeros_like(rgb); cnt = np.zeros(known.shape, np.float32)
        p = np.pad(rgb, ((1, 1), (1, 1), (0, 0))); pk = np.pad(known, 1)
        for dy in (0, 1, 2):
            for dx in (0, 1, 2):
                if dy == 1 and dx == 1: continue
                k = pk[dy:dy + known.shape[0], dx:dx + known.shape[1]]
                acc += p[dy:dy + known.shape[0], dx:dx + known.shape[1]] * k[..., None]; cnt += k
        new = (~known) & (cnt > 0)
        rgb[new] = acc[new] / cnt[new][:, None]; known = known | new
    return rgb

SCALE = [0]
def make_full():
    im = Image.open(src / 'gpt_units_sheet.png').convert('RGBA'); A = np.array(im)
    alpha = A[..., 3]; rgb = A[..., :3].astype(int)
    sat = rgb.max(axis=2) - rgb.min(axis=2); luma = rgb.mean(axis=2)
    # 1) ground shadows: soft, grey, translucent
    shadow = (alpha < 215) & (sat < 45) & (luma < 185)
    alpha2 = np.where(shadow, 0, alpha)
    # 2) separate figures: eroded core, label at half resolution, spread labels over every visible pixel
    core = erode(alpha2 >= 200, 3)
    half = core[::2, ::2]; lab_h, info = label(half)
    comps = []   # (mask at half resolution, x, y centroid)
    for (n, cnt, cx, cy) in info:
        if cnt >= 250: comps.append((lab_h == n, cx, cy))
    def split(mask, cx, cy):
        mm = mask
        for _ in range(16):   # figures touching each other (capes, spear tips): erode further until the blob falls apart
            mm = erode(mm, 2); l2, i2 = label(mm); parts = [i for i in i2 if i[1] >= 800]
            if len(parts) >= 2: return [(l2 == n2, x2, y2) for (n2, c2, x2, y2) in parts]
        return None
    guard = 0
    while len(comps) < 10 and guard < 6:
        guard += 1; comps.sort(key=lambda c: -c[0].sum()); big = comps[0]; parts = split(*big)
        if not parts: break
        comps = comps[1:] + parts
    ids = ['leon', 'mira', 'luka', 'sophia', 'jin', 'garud', 'verza', 'goblin', 'skeleton', 'slime']
    assert len(comps) == 10, 'found %d figure cores, expected 10' % len(comps)
    comps.sort(key=lambda c: (0 if c[2] * 2 < 520 else 1, c[1]))
    lab_small = np.zeros(half.shape, np.int32)
    for k, (m, _x, _y) in enumerate(comps): lab_small[m] = k + 1
    lab = np.kron(lab_small, np.ones((2, 2), np.int32))[:alpha.shape[0], :alpha.shape[1]]
    lab = np.where(alpha2 > 0, lab, 0)
    # figure pixels = visible pixels; unlabeled ones take the nearest figure label
    lab = spread(lab, 400, alpha2 > 0) * (alpha2 > 0)
    res = {}
    for k, fid in enumerate(ids):
        m = lab == (k + 1)
        ys, xs = np.where(m); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        pad = 6; y0 = max(0, y0 - pad); x0 = max(0, x0 - pad); y1 = min(alpha.shape[0], y1 + pad); x1 = min(alpha.shape[1], x1 + pad)
        mm = m[y0:y1, x0:x1]; a = np.where(mm, alpha2[y0:y1, x0:x1], 0); c = A[y0:y1, x0:x1, :3]
        # drop disconnected leftovers (shadow remnants): keep only components >= 1.5% of the largest
        lab2, inf2 = label(a[::2, ::2] > 40); big2 = max(i[1] for i in inf2)
        ok = np.zeros(lab2.max() + 1, bool)
        for (n, cnt, *_r) in inf2:
            if cnt >= 0.015 * big2: ok[n] = True
        okm = np.kron(ok[lab2], np.ones((2, 2), bool))[:a.shape[0], :a.shape[1]]
        okm = np.pad(okm, ((0, a.shape[0] - okm.shape[0]), (0, a.shape[1] - okm.shape[1])))
        okm = np.array(Image.fromarray((okm * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0   # re-grow to cover thin parts
        a = np.where(okm, a, 0)
        # 3) halo removal: colours of the outer 3px come from the interior, alpha eroded by 2px then feathered
        solid = erode(a >= 250, 3)
        c2 = bleed_colour(c, solid, 8)
        a_er = np.array(Image.fromarray(a.astype(np.uint8)).filter(ImageFilter.MinFilter(5)))
        a_er = np.array(Image.fromarray(a_er).filter(ImageFilter.GaussianBlur(0.8)))
        a_fin = np.where(a_er > 0, np.clip(a_er.astype(np.float32) * 1.15, 0, 255), 0).astype(np.uint8)
        rgba = np.dstack([np.clip(c2, 0, 255).astype(np.uint8), a_fin])
        img = Image.fromarray(rgba, 'RGBA'); bb = img.getbbox(); img = img.crop(bb)
        if fid == 'leon': SCALE[0] = 360.0 / img.height   # one common scale keeps relative sizes (the slime stays small)
        f = SCALE[0] if SCALE[0] else 360.0 / img.height
        img = img.resize((max(1, round(img.width * f)), max(1, round(img.height * f))), Image.LANCZOS)
        img.save(out / ('full_%s.webp' % fid), 'WEBP', quality=88, method=6, alpha_quality=95)
        res[fid] = img.size
    return res

def contact(sizes):
    ids = list(sizes); S = Image.new('RGB', (10 * 150, 2 * 330), (0, 0, 0))
    for row, bg in enumerate([(25, 28, 45), (240, 240, 240)]):
        for i, fid in enumerate(ids):
            tile = Image.new('RGB', (150, 330), bg); im = Image.open(out / ('full_%s.webp' % fid)).convert('RGBA')
            sc = min(146 / im.width, 326 / im.height); im = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)
            tile.paste(im, ((150 - im.width) // 2, 330 - im.height - 2), im); S.paste(tile, (i * 150, row * 330))
    S.save(out / 'contact.png')

# ---------------------------------------------------------------- backgrounds (title, village, 2x3 sheet)
BG_W = 1280
def save_bg(im, name):
    im = im.convert('RGB')
    if im.width > BG_W: im = im.resize((BG_W, round(im.height * BG_W / im.width)), Image.LANCZOS)
    im.save(out / ('bg_%s.webp' % name), 'WEBP', quality=80, method=6)
    return im.size

def make_backgrounds():
    sizes = {}
    sizes['title'] = save_bg(Image.open(src / 'bg_title.png'), 'title')
    sizes['village'] = save_bg(Image.open(src / 'bg_village.png'), 'village')
    sheet = Image.open(src / 'bg_sheet_6.png').convert('RGB'); a = np.array(sheet).astype(int)
    light = (a.min(axis=2) >= 225)
    gr = [r for r in runs(light.mean(axis=1) > 0.85)]; gc = [c for c in runs(light.mean(axis=0) > 0.85)]
    assert len(gr) == 2 and len(gc) == 1, 'expected 2 row gutters and 1 column gutter, got %s %s' % (gr, gc)
    ys = [0, gr[0][0], gr[0][1], gr[1][0], gr[1][1], sheet.height]; xs = [0, gc[0][0], gc[0][1], sheet.width]
    names = [['ford', 'forest'], ['ruins', 'fort'], ['altar', 'camp']]
    for r in range(3):
        for c in range(2):
            x0, x1 = xs[2 * c], xs[2 * c + 1]; y0, y1 = ys[2 * r], ys[2 * r + 1]
            sizes[names[r][c]] = save_bg(sheet.crop((x0 + 2, y0 + 2, x1 - 2, y1 - 2)), names[r][c])   # 2px trim against gutter anti-aliasing
    return sizes

# ---------------------------------------------------------------- painted ch1 battlefield: measure the faint grid, resample every cell to 64x64
def find_lines(a, axis, thr=0.75):
    d = (np.roll(a, 3, axis=axis) + np.roll(a, -3, axis=axis)) / 2 - a
    s = (d > 8).mean(axis=1 - axis)
    pk = [i for i in range(4, len(s) - 4) if s[i] > thr and s[i] >= s[i - 1] and s[i] > s[i + 1]]
    return pk

def make_map():
    im = Image.open(src / 'map_ch1.png').convert('RGB'); g = np.array(im.convert('L')).astype(float)
    xl = find_lines(g, 1); yl = find_lines(g, 0)          # the grid is 1-2 px dark lines; texture never reaches 75% line coverage
    xs = [0] + xl + [im.width]; ys = [0] + yl + [im.height]
    if ys[-1] - ys[-2] < 40: ys = ys[:-1]                  # partial cell at the bottom edge is cropped
    if xs[-1] - xs[-2] < 40: xs = xs[:-1]
    print('map grid: %d x %d cells, x pitch %.1f, y pitch %.1f' % (len(xs) - 1, len(ys) - 1, np.mean(np.diff(xs)), np.mean(np.diff(ys))))
    C = 64; out_im = Image.new('RGB', ((len(xs) - 1) * C, (len(ys) - 1) * C))
    for j in range(len(ys) - 1):
        for i in range(len(xs) - 1):
            out_im.paste(im.crop((xs[i], ys[j], xs[i + 1], ys[j + 1])).resize((C, C), Image.LANCZOS), (i * C, j * C))
    out_im.save(out / 'map_ch1.webp', 'WEBP', quality=82, method=6)
    json.dump({'cols': len(xs) - 1, 'rows': len(ys) - 1, 'cell': C, 'xs': xs, 'ys': ys}, open(out / 'map_ch1.json', 'w'))
    return out_im.size

if __name__ == '__main__':
    cells = make_faces(); print('face cells', cells)
    sizes = make_full(); print('full sizes', sizes)
    contact(sizes)
    print('backgrounds', make_backgrounds()); print('map', make_map())
    tot = sum(f.stat().st_size for f in out.glob('*.webp')); print('total webp bytes', tot)
