# tcg-simulator プロジェクトガイド

このリポジトリは、旧称 `dmapp` の汎用カードゲームシミュレーターである。
実装は 2 系統ある。

- デスクトップ版: Python 3.12 + PyQt6
- Web 版: React 18 + TypeScript + Vite + Konva

Web 版はサンドボックス設計を採用している。1 つのゲームを 1 つの
`GameProfile` JSON ファイルで表現し、DM などの特定ゲームに依存しない。
ユーザーがカード属性、デッキルール、ボード配置、カードプールを定義する。

## デスクトップ版

主な技術スタック:

- Python 3.12
- PyQt6 によるカスタム `QPainter` 描画
- pytest + pytest-qt
- PyInstaller `--onedir --windowed`
- GitHub Actions によるタグ push 時のリリースビルド

重要な構成:

- `main.py`: エントリポイント。`data/game.json` を読み、`GameWindow` を生成する。
- `models/card.py`: `Card` / `LibraryCard` dataclass。
- `models/card_library.py`: `CardLibrary` シングルトンと `card_sort_key`。
- `models/deck.py`: デッキの load/save。
- `models/game_state.py`: `GameState` シングルトン、`GameCard`、`Zone`。
- `models/layout_config.py`: `ZoneDefinition`、`WindowDefinition`、`GridPos`、
  `load_game_config`、`save_game_config`。
- `ui/signals.py`: グローバル `game_signals`。
- `ui/zone_widget.py`: ゾーン描画用のカスタム `QFrame`。ドラッグ＆ドロップ、ホバーズームも扱う。
- `ui/game_window.py`: 汎用ゲームウィンドウ。
- `ui/layout_editor.py`: グリッドスナップ式レイアウトエディタ。
- `data/game.json`: コミット対象のウィンドウ・ゾーン定義。

デスクトップ版の実装ルール:

- ゲーム状態を変更する前に `GameState.push_snapshot()` を呼び、アンドゥを維持する。
- ゾーン変更後は `game_signals.zones_updated.emit()` を呼ぶ。
- 必要なログは `game_signals.action_logged.emit("...")` で追加する。
- ゾーンの非公開判定は `ZoneDefinition.visibility == "private"` を基準にする。
- `ui/zone_widget.py` は `register_zone_defs(zone_defs)` を公開しており、
  `main.py` の起動時に呼ぶ。
- `zone_widget.py:_is_log_private` のログ非公開判定は次の順序に従う:
  移動先が private、移動元が `temp`、移動元が `deck_list`、最後に `gc.face_down`。
- ドラッグデータは `MIME_TYPE = "application/x-dmapp-card"` と JSON payload を使う。
- `data/` 以下のパスは、`main.py` が作業ディレクトリを変更するため相対パスで扱える。
  frozen build では `sys.executable` の親ディレクトリが作業ディレクトリになる。

通常 gitignore 対象のユーザーデータ:

- `data/cards.json`
- `data/cards/`
- `data/back.jpg`
- `data/decks/*.json`
- `data/saves/*.json`
- `data/config.json`

コミット対象のデータ:

- `data/game.json`
- `data/saves/.gitkeep`

デスクトップ版のコマンド:

```bash
pip install pyinstaller -r requirements.txt
pyinstaller --onedir --windowed --name tcg-simulator main.py
```

## Web 版

主な技術スタック:

- React 18 + TypeScript + Vite
- react-konva / Konva
- Zustand
- File System Access API。利用できない場合は download / file-picker にフォールバックする。

重要な構成:

- `web/index.html`: ボードページ。
- `web/hand.html`: 手札ウィンドウ。
- `web/deck.html`: デッキビルダー。
- `web/vite.config.ts`: マルチページ Vite 設定。
- `web/src/domain/types.ts`: `Card`、`GameCard`、`Zone`、`FieldDef`、
  `GameProfile`。
- `web/src/domain/gameLogic.ts`: `moveCard`、`stackCard`、`unstackCard`、
  `shuffleZone` などの純粋関数。
- `web/src/store/gameStore.ts`: ゾーン、アクション、アンドゥスタック。
- `web/src/store/uiStore.ts`: ダイアログ、コンテキストメニュー、アクションログ、
  デッキパネル。
- `web/src/store/layoutStore.ts`: ボード・ウィンドウ・ゾーン定義。
- `web/src/store/libraryStore.ts`: `GameProfile` 全体の管理。
- `web/src/sync/useTabSync.ts`: BroadcastChannel によるタブ間同期。
- `web/src/lib/saveStorage.ts`: File System Access API による永続化。
- `web/src/ui/pages/BoardPage.tsx`: ボードレイアウトと常時マウントされるダイアログ。
- `web/src/ui/pages/DeckPage.tsx`: デッキビルダー。
- `web/src/ui/stage/BoardStage.tsx`: Konva stage と card-drop 処理。
- `web/src/ui/zones/ZoneGroup.tsx`: Konva によるゾーン・カード描画。
- `web/src/ui/cards/CardShape.tsx`: 1 枚のカードを表す Konva group。

`GameProfile` の形:

```ts
interface GameProfile {
  meta: { name: string; version?: string }
  fieldDefs: FieldDef[]
  deckRules?: { maxDeckSize?: number; maxCopies?: number }
  boardConfig: GameConfigJson
  pool: Card[]
  decks: DeckRecord[]
}

interface FieldDef {
  id: string
  label: string
  type: 'text' | 'number' | 'select' | 'multi-select'
  options?: string[]
  sortable?: boolean
  filterable?: boolean
}

interface Card {
  id: string
  name: string
  image_data?: string
  count: number
  fields: Record<string, any>
}
```

Web 版の実装ルール:

- `domain/gameLogic.ts` の関数は純粋関数にする。`zones` を受け取り、新しい `zones` を返す。
- ゾーンやカードデータを変更する前に `cloneZones` を使う。
- アクション実行前に `gameStore` 側でアンドゥ snapshot を積む。
- `calcCardPositions(cards, areaX, areaY, areaW, areaH, cardW, cardH, twoRow)` は
  絶対座標を返す。
- 返された絶対座標は、そのまま `CardShape` に渡す。
- カード配置のために `ZoneGroup` の `<Group>` へ offset を足さない。
- ドラッグ終了後の位置リセットも同じ絶対座標系で行う。
- `CardShape.onDragEnd` は `{ fromZoneId, instanceId, dropX, dropY }` を含む
  `card-drop` custom event を dispatch する。
- `BoardStage` の drop 処理順は、カード上への drop による stack、山札ゾーンへの drop による
  `DeckDropDialog`、それ以外の通常 `moveCard` とする。
- すべてのダイアログは `BoardPage` に常時マウントし、
  `if (activeDialog !== 'xxx') return null` で自己非表示にする。
- `StackDialog` と `DeckDropDialog` は、それぞれの専用 state の cleanup を自身で行う。
- カードの進化・重なり状態は `GameCard.under_cards` に保持する。
- `stackCard` は、特に同一ゾーン内移動で index がずれるため、splice 前に `targetIdx` を確定する。
- `useTabSync(windowId)` は `BroadcastChannel('tcg-sim-state')` でウィンドウ間同期する。

Web 版のコマンド:

```bash
cd web
npm install
npm run dev
npm run build
npx tsc --noEmit
```

受け入れ基準:

- `docs/acceptance/web-parity.md` に 101 件の acceptance criteria がある。
- 元資料上の現在ステータスは全件 `[CODE]`、`[PENDING]` は 0。

