# Credits

All files in this folder are unmodified copies (byte-for-byte) of PNGs from the Superpowers asset packs. Nothing was edited, recolored, cropped on disk, or resized. Crop coordinates are in `manifest.json`.

## Source
- Repository: https://github.com/sparklinlabs/superpowers-asset-packs (commit `e8674a03ab4456802f71f848c4df79eccca23f7a`)
- Packs used: `ninja-adventure/` and `medieval-fantasy/` (terrain from the `medieval-fantasy` background-elements tileset; the mountain tile comes from the ninja-adventure tileset and the castle sprite from medieval-fantasy)
- Author: Pixel-boy (https://twitter.com/2pblog1), as credited in each pack's `README.md` ("Assets created by Pixel-boy ... for Superpowers supporters! See https://github.com/sparklinlabs/superpowers-asset-packs for license information and more assets!")
- License: CC0 1.0 Universal. The repo `LICENSE.txt` begins: "CC0 1.0 Universal" and includes the CC0 statement. Attribution is not required; it is given here as a courtesy.

## Files
| File here | Original path in repo | Original pack |
|---|---|---|
| characters/1.png | ninja-adventure/characters/1.png | Ninja Adventure (characters) |
| characters/2.png | ninja-adventure/characters/2.png | Ninja Adventure |
| characters/9.png | ninja-adventure/characters/9.png | Ninja Adventure |
| characters/12.png | ninja-adventure/characters/12.png | Ninja Adventure |
| characters/15.png | ninja-adventure/characters/15.png | Ninja Adventure |
| characters/16.png | ninja-adventure/characters/16.png | Ninja Adventure |
| characters/20.png | ninja-adventure/characters/20.png | Ninja Adventure |
| characters/23.png | ninja-adventure/characters/23.png | Ninja Adventure |
| characters/24.png | ninja-adventure/characters/24.png | Ninja Adventure |
| characters/25.png | ninja-adventure/characters/25.png | Ninja Adventure |
| faces/N.png (N = 1,2,9,12,15,16,20,23,24,25) | ninja-adventure/characters/faceset/N.png | Ninja Adventure (portraits) |
| tiles/ninja_tileset.png | ninja-adventure/background-elements/tileset.png | Ninja Adventure (background elements; rock pile used for mountains, plus flower/tuft/stone decorations) |
| tiles/ruin_a.png | medieval-fantasy/background-elements/8.png | Medieval Fantasy (ruined stone block) |
| tiles/ruin_b.png | medieval-fantasy/background-elements/15.png | Medieval Fantasy (broken tower) |
| tiles/tent_s.png | medieval-fantasy/background-elements/5.png | Medieval Fantasy (small tent) |
| tiles/castle.png | medieval-fantasy/background-elements/17.png | Medieval Fantasy (30x39 stone castle sprite; drawn centred over the fort block) |
| tiles/fort.png | medieval-fantasy/background-elements/1.png | Medieval Fantasy (small fort sprite; no longer used by the game, kept as an unmodified copy) |
| tiles/terrain.png | medieval-fantasy/background-elements/0-tileset.png | Medieval Fantasy (background elements) |

Each `N.png` in `characters/` is the body sheet with the same number as its `faces/N.png` portrait.


## Decorations
Houses, straw hut (tent), carts, signs, graves, stump, banner, barrel, mushrooms, tufts, flowers, sticks, bones and the dead tree are crops (see `deco` in `manifest.json`) of `tiles/ninja_tileset.png` (ninja-adventure/background-elements/tileset.png). Ruins and the small tent are the medieval-fantasy files listed above. Torches, campfire, smoke, fences-free ground patches, flower patches and moss are drawn in code.

## Effects, backgrounds and icons (Loop 5)
Unmodified copies from the same repository and commit (CC0, Pixel-boy):
- `fx/rpg_N.png` = `rpg-battle-system/fx/N.png` (N = 1, 3, 4, 5, 7, 9, 10, 11, 12): explosion, slashes, heal cross, fireball, claw, flame, holy cross effects.
- `fx/nin_5.png`, `fx/nin_18.png` = `ninja-adventure/fx/5.png`, `18.png` (hit spark, smoke puff).
- `bg/N.png` = `rpg-battle-system/backgrounds/N.png` (N = 15, 19, 12, 2, 3): the old pixel-painted backgrounds. **No longer used or embedded** (replaced by the ChatGPT backgrounds below); the files stay in the repository unmodified.
- `icons/w_{sword,lance,axe,bow,sai}.png` = `ninja-adventure/weapons/*.png`; `icons/i_{scroll-fire,life-pot,kunai,heart}.png` = `ninja-adventure/items/*.png`: weapon and special icons.

## ChatGPT-generated illustrations (Loop 6)
`assets/gpt/face_<id>.webp` and `assets/gpt/full_<id>.webp` are portraits and full-body illustrations for the five heroes and five enemy types. **ユーザーがChatGPTで生成して提供した画像** (prompts in `GPT_PROMPTS.md`). The originals are kept unmodified in `art-src/gpt_faces_sheet.png` and `art-src/gpt_units_sheet.png` (not embedded in the game). `tools/prep_gpt_art.py` crops the portraits (256x256), separates the figures, removes ground shadows and the colour halo, and resizes them to WebP; it is deterministic and can be re-run.

## ChatGPT-generated backgrounds and battlefield (Loop 7)
**ユーザーがChatGPTで生成して提供した画像 (user-generated with ChatGPT).** Originals are kept unmodified in `art-src/` and are not embedded in the game:
- `art-src/bg_title.png` (1536x1024) -> `assets/gpt/bg_title.webp`: title screen.
- `art-src/bg_village.png` (1536x1024) -> `assets/gpt/bg_village.webp`: chapter 1 scenes and the ending.
- `art-src/bg_sheet_6.png` (1536x1024, a 2x3 sheet separated by thin light gutters) -> `bg_ford.webp` (chapter 2), `bg_forest.webp` (chapter 3), `bg_ruins.webp` (chapter 4), `bg_fort.webp` (chapter 5, boss reveal), `bg_altar.webp` (chapter 6), `bg_camp.webp` (camp / support talks). `tools/prep_gpt_art.py` finds the gutters automatically, trims 2 px and writes WebP (about 1280 px wide for the full-size images, quality 80).
- `art-src/map_ch1.png` (1448x1086, painted top-down battlefield with a faint grid) -> `assets/gpt/map_ch1.webp` + `map_ch1.json`: the chapter 1 ground. The script measures the painted grid lines (21 vertical and 17 horizontal lines, pitch about 65 x 62 px, slightly uneven), crops the partial bottom row and resamples every painted cell to 64x64 px, so one painted cell is exactly one game tile (22 x 17 tiles). The terrain grid of chapter 1 (`src/story.js`) was written by hand from this painting.
All of these are drawn at device resolution on the hi-DPI layer (`src/hd.js`, canvas `#cvb`), cover-fitted and slightly darkened with a vignette so text stays readable.
