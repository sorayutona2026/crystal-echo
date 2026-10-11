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
- `bg/N.png` = `rpg-battle-system/backgrounds/N.png` (N = 15, 19, 12, 2, 3): painted backgrounds for the title, chapter cards, dialogue and ending.
- `icons/w_{sword,lance,axe,bow,sai}.png` = `ninja-adventure/weapons/*.png`; `icons/i_{scroll-fire,life-pot,kunai,heart}.png` = `ninja-adventure/items/*.png`: weapon and special icons.
