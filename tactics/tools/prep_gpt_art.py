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

# ---------------------------------------------------------------- painted ch2-5 battlefields (2x2 sheet)
# The faint grid of these panels is irregular / invisible in dark areas, so it cannot be measured like ch1's.
# ch2 shows ~28x30 px cells in the water (-> 27x17); ch3-5 are subdivided at the intended 24x16 (~32 px).
PANELS = {'ch6': (31, 20), 'ch2': (27, 17), 'ch3': (24, 16), 'ch4': (24, 16), 'ch5': (24, 16)}
SHEET_CELL = 48
def make_sheet_maps():
    im = Image.open(src / 'map_sheet_ch2-5.png').convert('RGB'); a = np.array(im).astype(int)
    light = (a.min(axis=2) >= 225)
    gx = runs(light.mean(axis=0) > 0.95); gy = runs(light.mean(axis=1) > 0.95)
    assert len(gx) == 1 and len(gy) == 1, (gx, gy)
    xs = [0, gx[0][0], gx[0][1], im.width]; ys = [0, gy[0][0], gy[0][1], im.height]
    boxes = {'ch2': (xs[0], ys[0], xs[1], ys[1]), 'ch3': (xs[2], ys[0], xs[3], ys[1]), 'ch4': (xs[0], ys[2], xs[1], ys[3]), 'ch5': (xs[2], ys[2], xs[3], ys[3])}
    sizes = {}
    boxes['ch6'] = None
    for name, bx in boxes.items():
        if bx is None:   # ch6: its own single-panel image, grid ~50 px (measured in the sky), label is wider
            im6 = Image.open(src / 'map_ch6.png').convert('RGB'); x0, y0, x1, y1 = 0, 0, im6.width, im6.height; p = im6; LB = (4, 4, 510, 74)
        else:
            x0, y0, x1, y1 = bx; p = im.crop((x0 + 1, y0 + 1, x1 - 1, y1 - 1)); LB = (2, 2, 300, 48)
        P = np.array(p).astype(np.float32); H, W = P.shape[:2]
        # remove the title label (dark rounded box, top-left): clone the terrain 46 px below it, feathered
        lx0, ly0, lx1, ly1 = LB
        m = Image.new('L', (W, H), 0); m.paste(255, (lx0, ly0, lx1, ly1)); m = np.array(m.filter(ImageFilter.GaussianBlur(5))).astype(np.float32)[..., None] / 255
        src_ = np.roll(P, -(ly1 - ly0 + 4), axis=0)
        P = P * (1 - m) + src_ * m
        p = Image.fromarray(np.clip(P, 0, 255).astype(np.uint8))
        cols, rows = PANELS[name]; cw = p.width / cols; ch = p.height / rows
        o = Image.new('RGB', (cols * SHEET_CELL, rows * SHEET_CELL))
        for j in range(rows):
            for i in range(cols):
                o.paste(p.crop((round(i * cw), round(j * ch), round((i + 1) * cw), round((j + 1) * ch))).resize((SHEET_CELL, SHEET_CELL), Image.LANCZOS), (i * SHEET_CELL, j * SHEET_CELL))
        o.save(out / ('map_%s.webp' % name), 'WEBP', quality=80, method=6)
        json.dump({'cols': cols, 'rows': rows, 'cell': SHEET_CELL, 'panel': [x0 + 1, y0 + 1, x1 - 1, y1 - 1]}, open(out / ('map_%s.json' % name), 'w'))
        sizes[name] = (o.size, (out / ('map_%s.webp' % name)).stat().st_size)
    return sizes

# ---------------------------------------------------------------- chibi map sprites (magenta-keyed sheet, art-src/chibi_sheet.png)
# Overrides (optional, same magenta rules): art-src/chibi_fix_sheet.png = leon+sophia chibis (row 3, 4 columns); art-src/chibi_fix2.png = row of 2 figures garud, verza;
#   art-src/chibi_override_<id>.png = one figure; art-src/chibi_override_<id1>+<id2>+....png = a left-to-right row of figures with that id list.
CHIBI_IDS = ['leon', 'mira', 'luka', 'sophia', 'jin', 'garud', 'verza', 'goblin', 'skeleton', 'slime']
CHIBI_H = 192                       # export height (px) of a hero; ~2x the on-screen size on a desktop window
CHIBI_REL = {'garud': 1.25, 'goblin': 0.85, 'slime': 0.6}
FIX_ORDER = ['leon', 'sophia', 'garud', 'verza']
FIX_Y2, FIX_Y3 = 305, 725      # chibi_fix_sheet.png: full-body row starts at y=305, chibi row at y=725 (row 1 = faces)
def fit(a, shape):
    a = a[:shape[0], :shape[1]]; return np.pad(a, ((0, shape[0] - a.shape[0]), (0, shape[1] - a.shape[1])))
def box(mask, n, kind):
    f = ImageFilter.MaxFilter if kind == 'max' else ImageFilter.MinFilter
    return np.array(Image.fromarray((mask * 255).astype(np.uint8)).filter(f(2 * n + 1))) > 127

def chroma_key(img):
    """-> (rgb uint8, alpha uint8, fg bool).  Magenta background removed, magenta spill on the edge removed, alpha eroded 1px + 1px feather."""
    a = np.array(img.convert('RGB')).astype(np.int16); R, G, B = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(R, B) - G
    core = (m > 120) & (R > 140) & (B > 140)
    lab, info = label(core[::2, ::2]); keep = np.zeros(lab.max() + 1, bool)
    for (n, cnt, *_r) in info:
        if cnt >= 300: keep[n] = True           # small enclosed magenta-ish blobs (gems) stay part of the figure
    kb = fit(np.kron(keep[lab], np.ones((2, 2), bool)), core.shape)
    bg = core & kb
    # small enclosed pure-magenta gaps (between staff and body, inside capes) are background too, except compact round blobs: those are gems / orbs
    pure = (m > 190) & (np.abs(R - B) < 40) & (R > 190) & ~bg
    pl, pinfo = label(pure[::2, ::2]); plf = fit(np.kron(pl, np.ones((2, 2), np.int32)), pure.shape)
    for (n, cnt, *_r) in pinfo:
        compact = cnt <= 45      # tiny pure-magenta specks: gem / orb highlights (those are really that colour); bigger enclosed ones are gaps
        if not compact: bg |= pure & (plf == n)
    # fringe pixels (blend of the dark outline and magenta) that missed the core threshold: also background when clearly pink-ish and next to bg
    near = box(bg, 2, 'max')
    bg |= near & (m > 70) & (R > 100) & (B > 100) & ~bg
    fg = ~bg
    zone = box(bg, 4, 'max') & fg                # despill zone: within 4 px of the background
    spill = np.clip(np.minimum(R, B) - G, 0, None)
    spill = np.where(zone, spill, 0)
    R2 = R - spill; B2 = B - spill
    rgb = np.dstack([R2, G, B2]).clip(0, 255).astype(np.uint8)
    # a final guard: any edge pixel still pinker than the picture around it is pulled to its green channel
    al = box(fg, 1, 'min')                       # erode 1 px
    al = np.array(Image.fromarray((al * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.9)))   # 1 px feather
    al = np.where(al > 0, np.clip(al.astype(np.float32) * 1.25, 0, 255), 0).astype(np.uint8)
    # colour under transparent pixels = nearest figure colour (keeps WebP / resampling free of magenta)
    c = bleed_colour(rgb, fg & (al > 200), 6)
    return np.clip(c, 0, 255).astype(np.uint8), al, fg

def chibi_figures(rgb, al, fg):
    """split a keyed image into figures: big connected parts are the figures, small detached parts join the nearest figure.  -> list of masks, left to right (top row first when 2 rows)"""
    H, W = fg.shape
    lab_h, info = label(box(fg, 2, 'max')[::2, ::2])          # 2px grow: merges droplets / staff tips lying next to a figure
    biggest = max(i[1] for i in info)
    mains = [i for i in info if i[1] >= max(1500, 0.08 * biggest)]
    labn = fit(np.kron(lab_h, np.ones((2, 2), np.int32)), (H, W))
    seeds = np.zeros((H, W), np.int32)
    for k, i in enumerate(mains): seeds[(labn == i[0]) & fg] = k + 1
    # every remaining fg pixel (detached small parts) takes the nearest main label
    seeds = spread(seeds, 40, fg) * fg      # detached specks farther than 40 px from any figure (text labels) are dropped
    return [seeds == (k + 1) for k in range(len(mains))], [(i[2] * 2, i[3] * 2) for i in mains]

def order_figs(masks, cents, rows=2):
    idx = list(range(len(masks)))
    if rows == 2: idx.sort(key=lambda k: (0 if cents[k][1] < 512 else 1, cents[k][0]))
    else: idx.sort(key=lambda k: cents[k][0])
    return idx

def crop_fig(rgb, al, mask):
    ys, xs = np.where(mask); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    p = 4; y0 = max(0, y0 - p); x0 = max(0, x0 - p); y1 = min(mask.shape[0], y1 + p); x1 = min(mask.shape[1], x1 + p)
    a = np.where(mask[y0:y1, x0:x1], al[y0:y1, x0:x1], 0).astype(np.uint8)
    im = Image.fromarray(np.dstack([rgb[y0:y1, x0:x1], a]), 'RGBA'); return im.crop(im.getbbox())

def make_chibi():
    figs = {}
    rgb, al, fg = chroma_key(Image.open(src / 'chibi_sheet.png'))
    masks, cents = chibi_figures(rgb, al, fg)
    assert len(masks) == 10, 'chibi sheet: found %d figures, expected 10' % len(masks)
    for fid, k in zip(CHIBI_IDS, order_figs(masks, cents)): figs[fid] = crop_fig(rgb, al, masks[k])
    used = {}
    def take(path, ids):
        rgb, al, fg = chroma_key(Image.open(path)); masks, cents = chibi_figures(rgb, al, fg)
        assert len(masks) == len(ids), '%s: found %d figures, expected %d (%s)' % (path.name, len(masks), len(ids), ids)
        for fid, k in zip(ids, order_figs(masks, cents, 1)): figs[fid] = crop_fig(rgb, al, masks[k]); used[fid] = path.name
    fix = src / 'chibi_fix_sheet.png'
    if fix.exists():           # 4 columns leon, sophia, garud, verza; row 3 = chibi (rows 1-2 are handled by make_fix_sheet)
        rgb, al, fg = chroma_key(Image.open(fix).crop((0, FIX_Y3, 1536, 1024)).convert('RGB'))
        masks, cents = chibi_figures(rgb, al, fg); assert len(masks) == 4, 'chibi_fix_sheet row 3: %d figures' % len(masks)
        for fid, k in zip(FIX_ORDER, order_figs(masks, cents, 1)):
            if fid in ('leon', 'sophia'): figs[fid] = crop_fig(rgb, al, masks[k]); used[fid] = fix.name     # garud / verza of this sheet are a redesign: not used
    fix = src / 'chibi_fix2.png'
    if fix.exists(): take(fix, ['garud', 'verza'])      # redrawn Garud + Verza (2 figures in a row, text labels ignored)
    for f in sorted(src.glob('chibi_override_*.png')):
        ids = f.stem[len('chibi_override_'):].replace(',', '+').split('+')
        if all(i in CHIBI_IDS for i in ids): take(f, ids)      # an explicit override wins over chibi_fix.png
        else: print('skip', f.name, '(unknown id)')
    sizes = {}
    for fid in CHIBI_IDS:
        im = figs[fid]; h = round(CHIBI_H * CHIBI_REL.get(fid, 1.0)); w = max(1, round(im.width * h / im.height))
        im = im.resize((w, h), Image.LANCZOS); im.save(out / ('chibi_%s.webp' % fid), 'WEBP', quality=88, method=6, alpha_quality=95); sizes[fid] = im.size
    # contact sheet on dark, light and map-green backgrounds
    S = Image.new('RGB', (10 * 130, 3 * 250)); 
    for row, bg in enumerate([(14, 18, 30), (245, 245, 245), (70, 120, 60)]):
        for i, fid in enumerate(CHIBI_IDS):
            tile = Image.new('RGB', (130, 250), bg); im = Image.open(out / ('chibi_%s.webp' % fid)).convert('RGBA')
            sc = min(126 / im.width, 246 / im.height); im = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS); tile.paste(im, ((130 - im.width) // 2, 248 - im.height), im); S.paste(tile, (i * 130, row * 250))
    S.save(out / 'chibi_contact.png')
    return sizes, used

if __name__ == '__main__':
    print('chibi', make_chibi())
    cells = make_faces(); print('face cells', cells)
    sizes = make_full(); print('full sizes', sizes)
    contact(sizes)
    print('backgrounds', make_backgrounds()); print('map', make_map()); print('sheet maps', make_sheet_maps())
    tot = sum(f.stat().st_size for f in out.glob('*.webp')); print('total webp bytes', tot)
