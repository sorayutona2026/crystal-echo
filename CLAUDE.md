# クリスタル・エコー(CRYSTAL ECHO)

FF4〜6風のATBバトルRPG。外部素材なしで、絵(ドット絵)・音楽・効果音をすべてコードで生成している。
ビルドすると `dist/crystal-echo.html` 1ファイルになり、ブラウザで開けば遊べる(スマホのタッチ操作対応)。

## よく使うコマンド
- ビルド: `python3 build.py` → `dist/crystal-echo.html` と テスト用 `test/index.html` を生成
- 遊ぶ: `test/index.html` をブラウザで開く(`dist/` の方は claude.ai Artifact 用で `<html>` タグが無い)
- テスト一式: `npm install && npx playwright install chromium` のあと `npm test`
  - `test/full.js` … ボットがニューゲームからエンディングまで実際の入力で通しプレイ(`SEED=77` で乱数変更)
  - `test/balance.js` … ボス戦を自動で何度も戦わせ、レベル別勝率を出す
  - `test/smoke.js` / `test/ui.js` / `test/save.js` / `test/audio.js` … 起動・操作・セーブ・音の確認
  - `npm run shots` … 各場面のスクリーンショットを `test-out/` に保存
- 変更後は必ず `python3 build.py` → `node test/full.js` で通しプレイが COMPLETE になることを確認する

## ソース構成(src/、build.py がこの順に連結する)
| ファイル | 役割 |
|---|---|
| shell.html | ページの外枠(画面、タッチ用十字キー/ボタン、CSS) |
| engine.js | 描画基盤(論理解像度256x224を3倍で描画)、入力、ウィンドウ/カーソル/ゲージ、セーブ保存先 |
| audio.js | WebAudioのチップチューン。曲データ `TRACKS`(8分音符単位の文字列)と効果音 |
| art.js | タイル・フィールドキャラ(16x16の文字テンプレート)を生成。`stylize()` で色付き輪郭と陰影を自動付与 |
| heroes_art.js | 仲間4人の戦闘用スプライト(24x32、ポーズ別) |
| enemies_art.js | 敵15体の絵。位相aの関数で描き、4コマの待機アニメを生成 |
| post.js | HD-2D風の後処理(ライトマップ、ブルーム、被写界深度、光の筋、パーティクル、ビネット)。場所別設定 `ENV` |
| render_map.js | マップを静的レイヤにキャッシュして描画。山や森の背の高いスプライト、海岸線、装飾、色ムラ |
| data.js | ゲームデータ: アイテム `ITEMS`、仲間 `HEROES`、技 `SKILLS`、敵 `ENEMIES`、出現 `FORMATIONS`、店、マップ生成、イベント台本 `SCRIPTS` |
| game.js | 状態 `G`、パーティ計算、セーブ/ロード、台本ランナー(ジェネレータ)、フィールド移動・会話・宝箱・エンカウント |
| battle.js | ATBバトル、ダメージ計算、敵AI/ボスAI、戦闘背景、エフェクトとパーティクル、戦闘コマンド |
| menu.js | メニュー、ショップ、タイトル、ゲームオーバー、エンディング |
| main.js | メインループ(60fps固定ステップ)、起動、品質自動調整、テスト用フック `window.__rpg` |

## 仕組みのポイント
- イベントは `SCRIPTS` 内のジェネレータ関数。`yield* say('台詞', '名前')`、`yield {t:'battle', ids:[...]}` のように上から書く。
- 進行の順番はマップのつながりで制御(洞窟のボスを倒すまで南へ行けない等)。フラグは `G.flags`。
- 敵の強さは `ENEMIES` の数値。調整したら `node test/balance.js` で勝率を確認する。
- `rnd()` はゲーム進行用の乱数(テストで固定できる)。見た目だけの演出には `Math.random()` を使う。
- claude.ai の Artifact として公開する場合は `dist/crystal-echo.html` を使う(外部ファイル読み込み不可のため、すべて1ファイルに埋め込み)。
