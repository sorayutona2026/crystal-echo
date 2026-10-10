# 灰の王冠(ASH CROWN)

ダークファンタジーのATBバトルRPG。クリスタル・エコーのエンジン(`src/`)を土台に、世界・キャラ・物語を新しく作っている。
絵・音楽・効果音はすべてコード生成。`python3 build.py` で `dist/ash-crown.html`(1ファイル)と `test/index.html` を作る。

## いまの状態(デモ:第1部の冒頭)
タイトル → 燈火の街 → 詰所で火守長の話 → 灰の回廊 → ボス「灰喰いの獣」→ セレネ加入 → 「つづく」

## 構成
- `src/ash.js` … このゲーム固有の層(名前・色・マップ・台本・タイトル)。`build.py` が menu.js のあとに連結し、同名の関数/データを上書きする。
- それ以外の `src/*.js` はクリスタル・エコーから複製したエンジン。内部ID(allen/lina/kai/zek)は描画コードが使っているので当面そのまま、表示名だけ置き換えている(カイン/セレネ/ミレイ/ノクス)。
- 順次、不要な旧データ(旧マップ、旧敵、旧曲)を削って `ash.js` の中身を本体へ移す。

## 確認
`python3 build.py && node test/play.js`(`PW_PATH`/`CHROME` で Playwright・Chromium の場所を指定できる)

## 使っている無料のもの
- **Tone.js**(MIT)… 音楽の再生に使用。`vendor/Tone.js` を `build.py` が1ファイルに同梱する(ライセンスは `vendor/LICENSE.md`)。`src/music_tone.js` が曲データ `TRACKS` を Tone.js の音で鳴らす。読み込めない/音が出せないときは `audio.js` の元のチップチューンに戻る。
- 曲の確認: `node test/render.js` で曲を書き出して無音・音割れを検算し、`test-out/music/*.wav` に保存(聞ける)。`node test/audio_live.js` でゲーム内の切り替え・ミュートを確認。
