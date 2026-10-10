# クリスタル・エコー — Godot 版(試作)

無料のゲームエンジン [Godot 4.3](https://godotengine.org/) に、今の JS 版ゲームの一部を移した試作です。
絵とデータは JS 版が生成したものをそのまま書き出して使っています(`assets/`)。

## 遊べる範囲
- タイトル(はじめから / つづきから)、セーブ・ロード(`user://save.json`)
- エルムの村とワールドマップを歩く、隊列歩行、NPC との会話(村の女性に話しかけると全回復)
- ワールドマップでのランダムエンカウント → ATB 戦闘(たたかう / わざ / アイテム / ぼうぎょ / にげる、オート戦闘、レベルアップ)
- 画面スワイプで移動・タップで決定(スマホ)

## まだ移していないもの
音楽と効果音、ストーリーイベント(洞窟・ローザ・塔・風の祠など)、ボス戦の演出、エコーゲージ。元の JS 版では遊べます。

## 動かし方
1. [Godot 4.3](https://godotengine.org/download/archive/4.3-stable/) を入れて、このフォルダ(`godot/`)を開き、F5 で実行。
2. ブラウザ用に書き出す場合(エクスポートテンプレートが必要):
   ```
   godot --headless --export-release "Web" export/index.html
   cd export && python3 -m http.server 8000   # → http://localhost:8000
   ```
   確認用に `index.html?start=battle` / `boss` / `dialog` / `world` で場面を直接開けます。
3. 自動テスト: `godot --headless --fixed-fps 60 --script res://tests/smoke.gd`

## 絵とデータの作り直し
JS 版の絵やデータを変えたら、リポジトリ直下で `node tools/export_assets.js` を実行すると `assets/` が更新されます。
日本語フォントは IPAゴシック(IPA フォントライセンス)。
