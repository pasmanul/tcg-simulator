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

---

# Web 版（React + Vite + Konva）

## 技術スタック

- React 18 + TypeScript + Vite
- react-konva / Konva（canvas 描画）
- Zustand（状態管理）
- File System Access API（カードフォルダ・セーブデータ読み書き）

## ディレクトリ構成

```
web/
├── index.html          # ボードページ (board)
├── hand.html           # 手札ウィンドウ (hand)
├── deck.html           # デッキビルダー
├── vite.config.ts      # マルチページ設定 (index/hand/deck)
└── src/
    ├── domain/
    │   ├── types.ts        # GameCard, Zone, ZoneDefinition, GameStateSnapshot 等
    │   └── gameLogic.ts    # 純粋関数: moveCard, stackCard, unstackCard, shuffleZone 等
    ├── store/
    │   ├── gameStore.ts    # ゲーム状態 + アクション（アンドゥスタック含む）
    │   ├── uiStore.ts      # UI 状態（ダイアログ・ログ・コンテキストメニュー等）
    │   ├── layoutStore.ts  # レイアウト定義（game.json 相当、ZoneDefinition[]）
    │   └── libraryStore.ts # カードライブラリ・画像キャッシュ・dirHandle
    ├── sync/
    │   └── useTabSync.ts   # BroadcastChannel によるタブ間状態同期
    ├── lib/
    │   └── saveStorage.ts  # File System Access API / ダウンロードフォールバック
    └── ui/
        ├── pages/
        │   ├── BoardPage.tsx   # ボード全体レイアウト
        │   └── DeckPage.tsx    # デッキビルダー UI
        ├── stage/
        │   └── BoardStage.tsx  # Konva Stage + card-drop イベント処理
        ├── zones/
        │   ├── ZoneGroup.tsx          # ゾーン背景・カード描画（Konva）
        │   └── ZoneOverlayButtons.tsx # 全タップ等の DOM ボタン
        ├── cards/
        │   └── CardShape.tsx   # カード 1 枚の Konva Group
        ├── hud/
        │   └── BoardHud.tsx    # 上部ボタンバー
        ├── overlays/           # ダイアログ群（常にマウント・自己非表示パターン）
        │   ├── ContextMenu.tsx
        │   ├── SetupDialog.tsx
        │   ├── SearchDialog.tsx
        │   ├── DiceDialog.tsx
        │   ├── StackDialog.tsx
        │   ├── SaveLoadDialog.tsx
        │   ├── DeckDropDialog.tsx
        │   ├── ActionLog.tsx
        │   └── ...
        └── hooks/
            ├── useStageSize.ts   # コンテナサイズ監視
            └── useCardLayout.ts  # calcCardPositions（絶対座標を返す）
```

## アーキテクチャ

### Zustand ストア

| ストア | 主な内容 |
|--------|---------|
| `gameStore` | `zones: Record<string, Zone>`、アンドゥスタック（最大50件）、moveCard / tapCard / stackCard / loadSnapshot 等 |
| `uiStore` | activeDialog / contextMenu / stackInfo / deckDropInfo / actionLog（最大200件）/ deckPanelOpen |
| `layoutStore` | `ZoneDefinition[]` + `WindowDefinition[]`（game.json 相当）|
| `libraryStore` | カードライブラリ・`dirHandle`（File System Access API）・画像 URL 解決 |

### ゲームロジック（`domain/gameLogic.ts`）

- 全関数は純粋関数。`zones` を受け取り新しい `zones` を返す（イミュータブル更新）
- `cloneZones` で deep clone してから変更する
- アクション実行前に `gameStore` 側で `undoStack.push(snapshot)` する

### Konva 描画・座標系

- `calcCardPositions(cards, areaX, areaY, areaW, areaH, cardW, cardH, twoRow)` は **絶対座標** を返す
- `ZoneGroup` 内の `CardShape` には `x={pos.x}` / `y={pos.y}` を直接渡す（`ZoneGroup` の `<Group>` に offset なし）
- ドラッグ終了後の位置リセットも同じ絶対座標で `e.target.x(x + offsetX)` する

### ドラッグ＆ドロップ

1. `CardShape.onDragEnd` で `window.dispatchEvent(new CustomEvent('card-drop', { detail: { fromZoneId, instanceId, dropX, dropY } }))` を発火
2. `BoardStage.handleCardDrop` がイベントを受け取り：
   - まずカード上へのドロップを検出（`calcCardPositions` で各カードの bounding box を計算）→ `stackCard`
   - 山札へのドロップ → `setDeckDropInfo`（DeckDropDialog で上/下を選択）
   - それ以外 → `moveCard`

### ダイアログパターン

- 全ダイアログは `BoardPage` に**常時マウント**
- `if (activeDialog !== 'xxx') return null` で自己非表示
- `StackDialog` / `DeckDropDialog` は独自 state（`stackInfo` / `deckDropInfo`）で制御
- ダイアログを閉じた時のステートリセット責任はダイアログ自身が持つ

### カード進化スタック

- `GameCard.under_cards: GameCard[]` にスタック下のカードを格納
- 上に重ねると `{ ...newCard, under_cards: [oldTop, ...oldTop.under_cards] }` に置き換え
- `stackCard` で **splice 前に targetIdx を確定**する（同ゾーン内でインデックスがずれるため）
- `CardShape` のスタックバッジ（オレンジ枚数表示）をクリックで `StackDialog` を開く

### マルチウィンドウ同期

- `useTabSync(windowId)` が `BroadcastChannel('tcg-sim-state')` でタブ間同期
- ボード (`index.html`) と手札ウィンドウ (`hand.html`) で同じ `gameStore` 状態を共有

### File System Access API / セーブ

- `libraryStore.dirHandle`: ルートフォルダハンドル（IndexedDB で永続化）
- `saveStorage.ts`: `saves/` サブフォルダへ JSON 読み書き
- `dirHandle` がない場合: セーブはダウンロード、ロードはファイルピッカーにフォールバック

## 開発・ビルド

```bash
cd web
npm install
npm run dev     # 開発サーバー（http://localhost:5173）
npm run build   # dist/ に出力
npx tsc --noEmit  # 型チェックのみ
```

## 受け入れ基準

`docs/acceptance/web-parity.md` に 101 件の AC が定義されている。
全件 `[CODE]`（コードあり・ブラウザ動作未確認）。`[PENDING]` は 0 件。
