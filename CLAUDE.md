# tcg-simulator — Claude 向けプロジェクト概要

## プロジェクト概要

汎用カードゲームシミュレーター（旧称: dmapp）。
Python + PyQt6 製。`data/game.json` でウィンドウ・ゾーン構成を自由に定義できる。
デフォルト設定はデュエルマスターズ用 2 ウィンドウ構成。

## 技術スタック

- Python 3.12
- PyQt6（カスタム QPainter 描画）
- pytest + pytest-qt（テスト）
- PyInstaller `--onedir --windowed`（Windows / macOS）
- GitHub Actions でタグ push 時に自動ビルド・リリース

## ディレクトリ構成

```
tcg-simulator/
├── main.py                  # エントリポイント（game.json → GameWindow 生成）
├── models/
│   ├── card.py              # Card / LibraryCard dataclass
│   ├── card_library.py      # CardLibrary シングルトン, card_sort_key
│   ├── deck.py              # Deck（load/save）
│   ├── game_state.py        # GameState シングルトン, GameCard, Zone
│   └── layout_config.py     # ZoneDefinition, WindowDefinition, GridPos, load/save_game_config
├── ui/
│   ├── signals.py           # GameSignals（zones_updated, action_logged）
│   ├── constants.py         # CARD_W/H, MIME_TYPE, CARD_BACK_PATH 等
│   ├── theme.py             # Composio インスパイアカラートークン・スタイル
│   ├── zone_widget.py       # ZoneWidget（QPainter描画, D&D, ホバーズーム）
│   ├── game_window.py       # GameWindow（汎用ウィンドウ、BoardWindow/HandWindow 統合）
│   ├── layout_editor.py     # LayoutEditorDialog（グリッドスナップ配置編集）
│   ├── action_log_widget.py # アクションログパネル
│   ├── deck_manager.py      # デッキ編集ダイアログ
│   ├── deck_list_widget.py  # デッキカード一覧ウィジェット
│   ├── search_dialog.py     # 山札サーチダイアログ
│   ├── dice_dialog.py       # ダイスダイアログ
│   ├── card_zoom.py         # ホバーズームウィンドウ
│   ├── expand_dialog.py     # ゾーン展開ダイアログ
│   └── stack_dialog.py      # 重なりカード選択ダイアログ
├── data/                    # ユーザーデータ（.gitignore 対象）
│   ├── game.json            # ウィンドウ・ゾーン定義（起動時に読み込む）
│   ├── cards.json           # カードライブラリ
│   ├── cards/               # カード画像
│   ├── decks/               # デッキ JSON
│   ├── saves/               # セーブデータ
│   ├── back.jpg             # カード裏面画像
│   └── config.json          # 最後に使用したデッキパスなど
└── tests/
    ├── conftest.py          # pytest-qt は qapp フィクスチャを自動提供
    └── test_layout_config.py
```

## アーキテクチャ

### game.json（ウィンドウ・ゾーン定義）

起動時に `data/game.json` を読み込み、`WindowDefinition` と `ZoneDefinition` のリストを生成する。
各ウィンドウ・ゾーンはこの JSON で自由に定義できる。

```json
{
  "windows": [{"id": "board", "title": "フィールド", "width": 960, "height": 780, "grid_cols": 12, "grid_rows": 10}],
  "zones": [{"id": "battle", "name": "バトルゾーン", "window_id": "board",
              "grid_pos": {"col": 0, "row": 0, "col_span": 12, "row_span": 4},
              "visibility": "public", "tappable": true, "two_row": true}]
}
```

### GameState（シングルトン）

`GameState.get_instance()` で取得。全ゾーンを `dict[str, Zone]` で管理（文字列 zone_id をキーとする）。

起動時に `initialize_zones(zone_ids)` を呼んでゾーンを game.json の定義に合わせて再構築する。

アンドゥは `push_snapshot()` → `undo()` の deque（最大50件）。

### ZoneDefinition

`models/layout_config.py` の dataclass。ゾーンの表示・動作を定義する。

主なフィールド:
- `id: str` — ゾーン識別子（"battle", "hand" 等）
- `visibility: str` — `"public"` | `"private"`（プライバシー判定に使用）
- `pile_mode: bool` — True なら山札表示（枚数のみ）
- `tappable: bool` — True なら全タップ/全解除ボタンを表示
- `two_row: bool` — True なら2段レイアウト（バトルゾーン用）
- `masked: bool` — True なら常に裏面表示
- `source_zone_id: str | None` — 別ゾーンのデータを表示する場合（クロスウィンドウビュー）
- `grid_pos: GridPos` — QGridLayout 上の配置（col, row, col_span, row_span）

### Qt シグナル

`ui/signals.py` に `game_signals` シングルトン。

| シグナル | 用途 |
|---|---|
| `zones_updated` | ゾーン変更後に全 ZoneWidget を再描画 |
| `action_logged(str)` | アクションログにエントリを追加 |

操作後は必ず両方を emit すること（ログが必要な場合）。

### ZoneWidget

`ui/zone_widget.py`。QPainter でカードを描画するカスタム QFrame。

コンストラクタ: `ZoneWidget(zone_def: ZoneDefinition)`

プライバシー判定は `ZoneDefinition.visibility == "private"` で行う（旧 `_HIDDEN_ZONES` タプルは廃止）。
モジュール関数 `register_zone_defs(zone_defs)` を main.py 起動時に呼ぶ。

### プライバシー判定（アクションログ）

カード名をログに出すか伏せるかの判定ロジック（`zone_widget.py: _is_log_private`）:

1. **移動先**の `visibility == "private"` → 非公開
2. **移動元**が `"temp"` → 非公開
3. **移動元**が `deck_list`（デッキ一覧からドロップ）→ 公開
4. それ以外 → `gc.face_down` フラグで判定

### MIME ドラッグ＆ドロップ

`MIME_TYPE = "application/x-dmapp-card"` で JSON をやり取り。

単体ドラッグ: `{"source_zone": zone_id, "card_index": int, ...}`
複数ドラッグ（Shift+クリック選択後）: `{"source_zone": ..., "card_ids": [id, ...], ...}`

## データファイル（gitignore 対象）

以下はリポジトリに含まれない。ユーザーが自分で用意する:
- `data/cards.json` — カードライブラリ
- `data/cards/` — カード画像（`.jpg` / `.webp`）
- `data/back.jpg` — カード裏面画像
- `data/decks/*.json` — デッキ定義
- `data/saves/*.json` — セーブデータ
- `data/config.json` — 起動設定

`data/game.json` と `data/saves/.gitkeep` はリポジトリに含まれる。

## ビルド・リリース

```bash
# ローカルビルド（Windows）
pip install pyinstaller -r requirements.txt
pyinstaller --onedir --windowed --name tcg-simulator main.py

# リリース（GitHub Actions）
git tag v0.x.x && git push origin v0.x.x
```

## 実装方針

- `GameState` への変更前に必ず `push_snapshot()` を呼ぶ（アンドゥ対応）
- ゾーン変更後は `game_signals.zones_updated.emit()` を必ず呼ぶ
- アクションログは `game_signals.action_logged.emit("説明文")` で追加
- `data/` 以下のパスは `main.py` で `os.chdir()` しているため相対パスで書いてよい
- PyInstaller frozen 時は `sys.executable` の親ディレクトリが作業ディレクトリになる
- ゾーン追加・変更は `data/game.json` を編集するか「設定 → レイアウト編集」から行う
