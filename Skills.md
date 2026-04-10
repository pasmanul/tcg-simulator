# dmapp — スキル一覧

このファイルは Claude Code のカスタムスラッシュコマンド定義です。
各スキルは `.claude/commands/<name>.md` に配置すると `/name` で呼び出せます。

---

## /release

```
現在の git タグ一覧を確認し、次のバージョン番号を提案してください。
ユーザーが確認したら以下を実行します：

1. `git tag vX.X.X` でタグを作成
2. `git push origin vX.X.X` でプッシュ

GitHub Actions が自動で Windows / macOS ビルドを行い、
リリースに dmapp-vX.X.X-windows.zip と dmapp-vX.X.X-macos.zip をアップロードします。

リリース後、`gh release view vX.X.X --repo pasmanul/dmapp` でアセットが揃っているか確認してください。
```

---

## /add-card

```
カードライブラリ（data/cards.json）に新しいカードを追加する手順を案内します。

1. data/cards/ にカード画像を配置（例: data/cards/my-card.jpg）
2. data/cards.json の "cards" 配列に以下の形式で追記：

{
  "id": "<uuid>",
  "name": "カード名",
  "image_path": "data/cards/my-card.jpg",
  "mana": 3,
  "civilizations": ["火"],
  "card_type": "クリーチャー"
}

文明は CIVILIZATIONS = ["無色","光","水","闇","火","自然"] から選択。
カードタイプは models/card_library.py の CARD_TYPES リストを参照してください。

または、アプリ内の「デッキ管理」→「カードを追加」UIから追加することもできます。
```

---

## /new-zone

```
models/game_state.py に新しいゾーンタイプを追加します。

手順：
1. ZoneType enum に新しい値を追加
2. GameState.initialize_field() と reset_field() でクリア処理を追加（必要なら）
3. _ZONE_NAMES (ui/zone_widget.py) に表示名を追加
4. 非公開ゾーンなら _HIDDEN_ZONES タプルに追加
5. ui/search_dialog.py の _DEST_OPTIONS に移動先として追加（必要なら）
6. board_window.py または hand_window.py に ZoneWidget を配置

実装するゾーン名と、公開/非公開の区別を教えてください。
```

---

## /check-build

```
ローカルで PyInstaller ビルドが通るか確認します。

1. requirements.txt の依存パッケージを確認
2. pyinstaller --onedir --windowed --name dmapp main.py を実行
3. dist/dmapp/dmapp.exe（Windows）または dist/dmapp.app（macOS）の存在を確認
4. data/ フォルダのコピーが必要かどうかを確認

エラーがあれば原因を診断して修正します。
```

---

## /privacy-check

```
アクションログのプライバシー判定を確認します。

ui/zone_widget.py の _is_log_private メソッドを読み、
現在のルールを説明してください：

- 移動先ゾーンが _HIDDEN_ZONES → 非公開
- 移動元が TEMP → 非公開
- 移動元が deck_list → 公開
- それ以外は gc.face_down フラグで判定

変更が必要な場合は具体的なケースを教えてください。
```

---

## /undo-check

```
アンドゥが正しく機能しているか確認します。

GameState.push_snapshot() が呼ばれるべき操作の一覧と、
現在の実装でスナップショットを取っている場所を列挙します。

漏れがあれば修正します。
```
