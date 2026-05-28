# Web 版コードレビュー計画

## 目的

Web 版（React + Vite + Konva）の実装を、重大な不具合・仕様逸脱・保守性リスクの観点で段階的にレビューする。

特に次を優先する。

- ゲーム状態の破壊や不整合
- アンドゥ、移動、スタック、セーブ/ロードの取りこぼし
- Konva 座標系とドラッグ＆ドロップ判定のズレ
- マルチウィンドウ同期による古い状態の上書き
- `docs/acceptance/web-parity.md` の受け入れ基準との乖離

## 進捗サマリー

| フェーズ | 対象 | 状態 | 成果物 |
|---|---|---|---|
| 1 | 静的レビュー: domain / store / lib | DONE | findings |
| 2 | 描画・操作レビュー: stage / zones / cards / hooks | DONE | findings |
| 3 | UI フロー・状態レビュー: pages / overlays / hud / deck | DONE | findings |
| 4 | 同期・永続化レビュー: BroadcastChannel / File System Access API | DONE | findings |
| 5 | 検証: typecheck / build / Playwright / AC 整理 | DONE | verification log |

状態は `TODO` / `IN_PROGRESS` / `DONE` / `BLOCKED` で更新する。

## フェーズ 1: 静的レビュー

対象ファイル:

- `web/src/domain/gameLogic.ts`
- `web/src/domain/types.ts`
- `web/src/store/gameStore.ts`
- `web/src/store/libraryStore.ts`
- `web/src/store/layoutStore.ts`
- `web/src/store/uiStore.ts`
- `web/src/lib/saveStorage.ts`
- `web/src/lib/cardStorage.ts`
- `web/src/lib/boardConfigSync.ts`

確認観点:

- `domain/gameLogic.ts` の関数が純粋関数として保たれているか
- `cloneZones` 後に変更され、既存 state を直接 mutate していないか
- アクション実行前に undo snapshot が積まれているか
- undo stack の上限、ロード後、連続操作時の挙動が破綻しないか
- `GameProfile` の load/export が型と実データに対して堅牢か
- セーブデータと `GameProfile` の互換性が維持されるか
- 例外時に中途半端な状態が store に残らないか

## フェーズ 2: 描画・操作レビュー

対象ファイル:

- `web/src/ui/stage/BoardStage.tsx`
- `web/src/ui/stage/HandStage.tsx`
- `web/src/ui/stage/cardDropTarget.ts`
- `web/src/ui/zones/ZoneGroup.tsx`
- `web/src/ui/zones/ZoneOverlayButtons.tsx`
- `web/src/ui/cards/CardShape.tsx`
- `web/src/ui/hooks/useCardLayout.ts`
- `web/src/ui/hooks/useCardHotkeys.ts`
- `web/src/ui/hooks/useStageSize.ts`

確認観点:

- `calcCardPositions` が絶対座標を返し、呼び出し側も同じ座標系で扱っているか
- `ZoneGroup` の `<Group>` offset とカード座標が二重適用されていないか
- ドラッグ終了後の位置リセットが描画座標と一致しているか
- カード上への drop、山札 drop、通常 move の優先順位が正しいか
- 同一ゾーン内移動で index がずれないか
- 二段ゾーン、重なりカード、選択状態、hover zoom が干渉しないか
- 手札ウィンドウとボードで同じ状態を違う見た目として扱えるか

## フェーズ 3: UI フロー・状態レビュー

対象ファイル:

- `web/src/ui/pages/BoardPage.tsx`
- `web/src/ui/pages/DeckPage.tsx`
- `web/src/ui/pages/HandPage.tsx`
- `web/src/ui/hud/BoardHud.tsx`
- `web/src/ui/hud/HandHud.tsx`
- `web/src/ui/overlays/ContextMenu.tsx`
- `web/src/ui/overlays/DeckDropDialog.tsx`
- `web/src/ui/overlays/StackDialog.tsx`
- `web/src/ui/overlays/SearchDialog.tsx`
- `web/src/ui/overlays/SaveLoadDialog.tsx`
- `web/src/ui/overlays/GameLoadDialog.tsx`
- `web/src/ui/overlays/GameSetupWizard.tsx`
- `web/src/ui/overlays/CardEditorDialog.tsx`
- `web/src/ui/overlays/FieldEditorDialog.tsx`
- `web/src/ui/overlays/DiceDialog.tsx`
- `web/src/ui/overlays/ActionLog.tsx`
- `web/src/ui/overlays/BoardEditorDialog.tsx`

確認観点:

- ダイアログ常時マウントと自己非表示のパターンが守られているか
- ダイアログを閉じた後に専用 state が残留しないか
- `StackDialog`、`DeckDropDialog`、`SearchDialog` の cleanup 責務が明確か
- 非公開ゾーンのカード名や画像が UI やログに漏れないか
- デッキ編集で枚数制限、フィルタ、ソート、保存が一貫しているか
- エラー表示、空状態、キャンセル時の挙動が破綻しないか

## フェーズ 4: 同期・永続化レビュー

対象ファイル:

- `web/src/sync/useTabSync.ts`
- `web/src/lib/saveStorage.ts`
- `web/src/lib/cardStorage.ts`
- `web/src/store/libraryStore.ts`
- `web/src/store/gameStore.ts`

確認観点:

- BroadcastChannel で送信元へ反射してループしないか
- 複数タブ操作で古い state が新しい state を上書きしないか
- 起動時、ロード時、保存時の同期タイミングが安全か
- File System Access API が使えない環境で fallback が機能するか
- IndexedDB に保存した handle の権限再確認が破綻しないか
- 画像データや JSON の読み書きで大きなデータを扱っても UI が固まりにくいか

## フェーズ 5: 検証

実行候補:

```bash
cd web
npx tsc --noEmit
npm run build
npx playwright test
```

確認観点:

- TypeScript エラーがないか
- production build が通るか
- 既存 Playwright テストが通るか
- `docs/acceptance/web-parity.md` の 101 件を、自動化可能・手動必須・未確認に分類できるか
- レビューで見つけた重要リスクに対して再現手順またはテスト案があるか

## Findings 記録形式

レビュー結果は、このファイルまたは別ファイルに次の形式で追記する。

```md
### Finding N: タイトル

- Severity: Critical / High / Medium / Low
- Status: Open / Fixed / Won't Fix / Needs Verification
- Files: `path/to/file.ts:line`
- Summary:
- Impact:
- Suggested fix:
- Verification:
```

## レビュー方針

- まず重大度の高いバグ、データ破壊、ユーザー操作不能、保存データ破損を優先する。
- スタイルや好みの指摘は、実害がある場合に限る。
- 指摘にはファイルと行番号を付ける。
- 修正提案は、既存の設計と実装パターンに合わせる。
- 受け入れ基準との関係がある場合は AC 番号を添える。

## Review Log

### 2026-05-28 Phase 1: 静的レビュー

対象:

- `web/src/domain/gameLogic.ts`
- `web/src/domain/types.ts`
- `web/src/store/gameStore.ts`
- `web/src/store/libraryStore.ts`
- `web/src/store/layoutStore.ts`
- `web/src/store/uiStore.ts`
- `web/src/lib/saveStorage.ts`
- `web/src/lib/cardStorage.ts`
- `web/src/lib/boardConfigSync.ts`
- `web/src/sync/useTabSync.ts`
- 関連確認: `web/src/ui/pages/BoardPage.tsx`, `web/src/ui/overlays/GameLoadDialog.tsx`,
  `web/src/ui/overlays/SaveLoadDialog.tsx`

検証:

```bash
cd web
npm run build
```

結果: `tsc && vite build` は成功。

### Finding 1: GameProfile ロード後に gameStore のゾーン構造が更新されない

- Severity: High
- Status: Fixed - Verified
- Files: `web/src/ui/overlays/GameLoadDialog.tsx:18`, `web/src/store/libraryStore.ts:150`,
  `web/src/store/libraryStore.ts:174`, `web/src/ui/pages/BoardPage.tsx:116`,
  `web/src/ui/pages/BoardPage.tsx:123`, `web/src/ui/pages/BoardPage.tsx:137`
- Summary:
  `loadGameProfile()` は `libraryStore` と `layoutStore` の `boardConfig` を更新するが、
  `gameStore.initZones()` は `BoardPage` 初回 mount の `useEffect([])` でしか実行されない。
- Impact:
  既存プロファイルを開いて `boardConfig.zones` が変わっても、`gameStore.zones` は以前のゾーン構造のまま残る。
  カスタムゾーンを持つ GameProfile では、表示ゾーンと実データゾーンが不一致になり、カード移動、保存、ロード、
  マルチウィンドウ同期が破綻する可能性がある。
  関連 AC: CAT-01, CAT-03, CAT-13。
- Suggested fix:
  `loadGameProfile()` 完了時、または `layoutStore.setConfig()` 後に、`boardConfig.zones` から実体ゾーン ID を抽出して
  `gameStore.initZones()` する。既存ゲーム状態を維持したい場合は、既存 zone の cards を保持しつつ不足 zone を追加し、
  削除 zone の扱いを明示する専用アクションにする。
- Verification:
  デフォルトとは異なる zone ID を含む GameProfile を読み込み、該当ゾーンへカードを移動・保存できることを確認する。
  `web/src/store/libraryStore.ts` から `gameStore.initZonesFromDefs()` を呼ぶよう修正済み。
  `npm run build` と Playwright acceptance は通過。

### Finding 2: BroadcastChannel の PONG / STATE_UPDATE が無条件に現在状態を上書きする

- Severity: High
- Status: Fixed - Verified
- Files: `web/src/sync/useTabSync.ts:82`, `web/src/sync/useTabSync.ts:86`,
  `web/src/sync/useTabSync.ts:97`, `web/src/sync/useTabSync.ts:116`
- Summary:
  `useTabSync()` は受信した `STATE_UPDATE` と `PONG` を timestamp や authority の比較なしで
  `_applySnapshot()` している。`board` も `hand` からの `PONG` を受け入れる。
- Impact:
  古い手札ウィンドウや初期化直後のタブが、進行中のボード状態を古い snapshot で上書きできる。
  マルチウィンドウ同期でゲーム状態が巻き戻る、または空状態になるリスクがある。
  関連 AC: CAT-07。
- Suggested fix:
  状態 snapshot に monotonic な `revision` または `updatedAt` を持たせ、古い snapshot を破棄する。
  さらに、初期同期の authority を `board` 優先にして、`board` は `hand` からの `PONG` を通常適用しない。
- Verification:
  ボードでカード移動後、古い hand タブを開く/再接続する操作で、ボード状態が巻き戻らないことを確認する。
  `gameStore.revision` を追加し、`PONG` は hand 側だけが受信適用、`STATE_UPDATE` は revision 比較で古い snapshot を破棄するよう修正済み。
  `npm run build` と Playwright acceptance は通過。

### Finding 3: SaveLoadDialog の saves/ 読み書き経路が実質無効化されている

- Severity: Medium
- Status: Fixed - Verified
- Files: `web/src/ui/overlays/SaveLoadDialog.tsx:21`, `web/src/ui/overlays/SaveLoadDialog.tsx:35`,
  `web/src/ui/overlays/SaveLoadDialog.tsx:45`, `web/src/ui/overlays/SaveLoadDialog.tsx:59`,
  `web/src/ui/overlays/SaveLoadDialog.tsx:73`
- Summary:
  `dirHandle` が常に `null` のため、`listSaveFiles()`、`writeSaveFile()`、`readSaveFile()` のコードパスは実行されない。
  保存は常に download、ロードは upload のみになる。
- Impact:
  `docs/acceptance/web-parity.md` の `saves/` フォルダへの保存・一覧ロード期待と実装が食い違っている。
  ユーザーはアプリ内の保存一覧から再ロードできない。
  関連 AC: AC-13-04, AC-13-05。
- Suggested fix:
  方針をどちらかに寄せる。GameProfile 単一ファイル運用なら AC と UI 文言を download/upload 前提へ更新する。
  `saves/` 運用を残すなら、GameProfile の root directory handle を store に保持し、`SaveLoadDialog` へ渡す。
- Verification:
  実装方針を download/upload 前提に寄せ、未使用の `dirHandle`、`listSaveFiles()`、`writeSaveFile()`、`readSaveFile()` を削除した。
  UI 文言も JSON ダウンロード保存・JSON ファイル選択ロードに合わせて更新済み。
  `npm run build` と Playwright acceptance は通過。

### Finding 4: 無効操作でも undo snapshot が積まれる

- Severity: Low
- Status: Fixed - Verified
- Files: `web/src/store/gameStore.ts:84`, `web/src/store/gameStore.ts:86`,
  `web/src/store/gameStore.ts:97`, `web/src/store/gameStore.ts:147`,
  `web/src/store/gameStore.ts:191`, `web/src/store/gameStore.ts:198`
- Summary:
  `moveCard`、`tapCard`、`sortZone`、`stackCard`、`unstackCard` などは、対象 zone/card の存在確認より前に
  `pushSnapshot()` している。domain 関数側で no-op になっても undo stack は増える。
- Impact:
  無効な drag/drop や stale な card ID による操作後、最初の Ctrl+Z が見た目上 no-op になる。
  undo の信頼性が下がるが、直ちにデータ破壊するリスクは低い。
  関連 AC: CAT-08。
- Suggested fix:
  domain 関数が `{ zones, changed }` を返す、または action 側で対象存在を検証してから snapshot を積む。
- Verification:
  `gameStore` の各 action で変更後 state を先に計算し、参照同一の no-op なら snapshot と `revision` 更新を行わないよう修正済み。
  `updateCard()` も対象カードが存在しない場合は元の `zones` を返す。
  `npm run build` と Playwright acceptance は通過。

### 2026-05-28 Phase 2: 描画・操作レビュー

対象:

- `web/src/ui/stage/BoardStage.tsx`
- `web/src/ui/stage/HandStage.tsx`
- `web/src/ui/stage/cardDropTarget.ts`
- `web/src/ui/zones/ZoneGroup.tsx`
- `web/src/ui/cards/CardShape.tsx`
- `web/src/ui/hooks/useCardLayout.ts`
- `web/src/ui/hooks/useCardHotkeys.ts`
- 実使用経路として追加確認: `web/src/ui/spatial/Canvas.tsx`,
  `web/src/ui/spatial/ZoneBox.tsx`, `web/src/ui/spatial/Chrome.tsx`

### Finding 5: 実際のボード画面でカードのドラッグ＆ドロップ移動が実装経路から外れている

- Severity: Critical
- Status: Fixed - Verified
- Files: `web/src/ui/pages/BoardPage.tsx:141`, `web/src/ui/pages/BoardPage.tsx:142`,
  `web/src/ui/stage/BoardStage.tsx:32`, `web/src/ui/stage/BoardStage.tsx:68`,
  `web/src/ui/stage/BoardStage.tsx:93`, `web/src/ui/spatial/Canvas.tsx:216`,
  `web/src/ui/spatial/Canvas.tsx:236`, `web/src/ui/spatial/ZoneBox.tsx:186`,
  `web/src/ui/spatial/ZoneBox.tsx:241`
- Summary:
  `BoardStage` には `card-drop`、`findDropZone`、`moveCard`、`stackCard` の処理があるが、
  `BoardPage` は現在 `Canvas` を表示しており、`BoardStage` を使っていない。
  実使用中の `Canvas` / `ZoneBox` はカードクリックで context menu を開くのみで、カード自体の drag/drop がない。
- Impact:
  ボード画面で、手札からバトルゾーン、バトルゾーンからマナ、墓地、山札へのドラッグ移動、
  カード上 drop による進化スタック、二段ゾーンへの drop が動かない。
  受け入れ基準の中核であるカード移動系が満たせない。
  関連 AC: CAT-05, CAT-06, CAT-13。
- Suggested fix:
  方針をどちらかに統一する。
  1. spatial UI を主画面にするなら、`ZoneBox` / `Canvas` 側にカード drag/drop、drop target 判定、
     deck drop dialog、stack 判定、row 判定を移植する。
  2. 旧 Konva 実装を主画面に戻すなら、`BoardPage` で `BoardStage` を表示し、spatial UI は別モードに分離する。
- Verification:
  実画面でカードをドラッグして `moveCard` が呼ばれ、ゾーン間移動・山札上/下選択・スタックが発生することを確認する。
  spatial UI の `ZoneBox` / `HandDock` / card components に HTML5 drag/drop を追加し、`Canvas` から `moveCard`、`stackCard`、`DeckDropDialog` へ接続済み。
  `source_zone_id` を持つミラー表示は、カード操作だけ実体ゾーン ID へ向けるよう修正済み。
  pile 表示でもトップカードを drag/context/hover 対象として扱えるよう修正済み。
  `npm run build` と Playwright acceptance は通過。ドラッグ操作の細部は追加 E2E で厚くする余地あり。

### Finding 6: 現行ボード UI ではホバー系ホットキーとホバーズームが発火しない

- Severity: High
- Status: Fixed - Verified
- Files: `web/src/ui/hooks/useCardHotkeys.ts:16`, `web/src/ui/hooks/useCardHotkeys.ts:24`,
  `web/src/ui/hooks/useCardHotkeys.ts:31`, `web/src/ui/zones/ZoneGroup.tsx:94`,
  `web/src/ui/cards/CardShape.tsx:86`, `web/src/ui/spatial/Canvas.tsx:236`,
  `web/src/ui/spatial/ZoneBox.tsx:242`
- Summary:
  `useCardHotkeys()` は `uiStore.hoveredCard` を前提にしている。
  旧 `ZoneGroup` / `CardShape` は hover 時に `setHoveredCard()` と zoom timer を使うが、
  現行ボードの `Canvas` / `ZoneBox` / `MiniCard` は hover で `hoveredCard` を更新せず、zoom も起動しない。
- Impact:
  ボード画面で `B/M/G/H/S` のホバー中移動ショートカットやホバーズームが使えない。
  関連 AC: AC-05-08 から AC-05-12, AC-10-05 から AC-10-07。
- Suggested fix:
  spatial UI のカードコンポーネントにも `onMouseEnter` / `onMouseLeave` で `setHoveredCard()` と zoom 制御を追加する。
  ただし非公開ゾーンと `faceDown` の扱いは `CardShape` と同じ条件にそろえる。
- Verification:
  spatial ボード上のカードに hover した状態で `B/M/G/H/S` を押し、期待ゾーンへ移動すること。
  600ms hover で公開カードのみ zoom が出ること。
  spatial UI のカード hover から即時に `setHoveredCard()` を呼び、500ms 後に公開カードのみ `setZoom()` を呼ぶよう修正済み。
  `npm run build` と Playwright acceptance は通過。

### Finding 7: Context menu は右クリックではなく左クリック経由になっている

- Severity: Medium
- Status: Fixed - Verified
- Files: `web/src/ui/spatial/Canvas.tsx:99`, `web/src/ui/spatial/Canvas.tsx:103`,
  `web/src/ui/spatial/Canvas.tsx:236`, `web/src/ui/spatial/ZoneBox.tsx:186`,
  `web/src/ui/spatial/ZoneBox.tsx:241`, `web/src/ui/overlays/ContextMenu.tsx:43`
- Summary:
  spatial UI のカードは `onClick` で `openContextMenu()` を呼ぶ。
  `ContextMenu` 自体は表示できるが、旧 `CardShape.onContextMenu` のような右クリックイベントではない。
- Impact:
  AC が要求する「右クリックでコンテキストメニュー」が現行ボード UI では満たせない。
  クリック操作の意味も、カード選択・タップ・メニュー表示の間で曖昧になる。
  関連 AC: AC-10-01, AC-04-03 から AC-04-06。
- Suggested fix:
  `MiniCard` / `BigCard` に `onContextMenu` を追加し、右クリックで `openContextMenu()` する。
  左クリックは選択またはタップなど、別の単一責務に寄せる。
- Verification:
  右クリックで context menu が開き、左クリック時の挙動と競合しないことを確認する。
  spatial UI のカードに `onContextMenu` を追加済み。左クリックは tappable zone ではタップ、それ以外では既存通り menu 表示を維持。
  `npm run build` と Playwright acceptance は通過。

### Finding 8: SearchDialog の移動先が固定ゾーン ID 前提になっている

- Severity: Medium
- Status: Fixed - Verified
- Files: `web/src/ui/overlays/SearchDialog.tsx`
- Summary:
  `SearchDialog` の移動先が `hand` / `mana` / `graveyard` / `temp` の固定配列で定義されている。
  GameProfile のゾーン構成が変わると、存在しないゾーンへ `moveCard()` を呼び、実際には no-op でも成功したようなログを出せる。
- Impact:
  汎用カードゲームシミュレーターとして、プロファイルごとに異なるゾーン構成を扱う設計と食い違う。
  サーチ操作後にカードが移動していないのにログだけ残り、ユーザー操作の信頼性が下がる。
- Suggested fix:
  現在の `layoutStore.zones` と `gameStore.zones` から、実体が存在する移動先だけを動的に生成する。
  `source_zone_id`、`ui_widget`、`deck` は移動先候補から除外する。
- Verification:
  `SearchDialog` の移動先を現在のレイアウト定義から生成するよう修正済み。
  現在の target が候補から消えた場合は `hand`、または先頭候補へ補正する。
  `npm run build` と Playwright acceptance は通過。

### 2026-05-28 Fix Verification

実行:

```bash
cd web
npm run build
```

結果: 成功。`tsc && vite build` は通過。

追加実行:

```bash
cd web
npx playwright test --timeout=10000 --reporter=line
```

結果: 初回は 5 passed / 6 failed。

失敗は `tests/acceptance.spec.ts` が現在の Deck UI / GameLoadDialog の文言・構成と合っていないことによるもの。
代表例:

- `text=デッキ内容` が見つからない
- `LOAD CARDS` ボタンが見つからない

対応:

- `LOAD CARDS` を現行 UI の `LOAD POOL` に追従。
- `CARD LIBRARY`、`デッキ内容`、`デッキ未選択` などの旧文言を `GAME PROFILE`、`POOL`、`DECK`、`デッキなし` へ更新。
- `GameLoadDialog` の `閉じる` ボタンは strict locator になるよう exact match に修正。

再実行:

```bash
cd web
npx playwright test --timeout=10000 --reporter=line
```

結果: 11 passed。

最終検証:

- `npm run build`: 成功。`tsc && vite build` は通過。
- `npx playwright test --timeout=10000 --reporter=line`: 成功。11 passed。

追加修正後の再検証:

```bash
cd web
npm run build
npx playwright test --timeout=10000 --reporter=line
```

結果:

- `npm run build`: 成功。`tsc && vite build` は通過。
- `npx playwright test --timeout=10000 --reporter=line`: 成功。11 passed。

Phase 3/4 追加修正後の再検証:

```bash
cd web
npm run build
npx playwright test --timeout=10000 --reporter=line
```

結果:

- `npm run build`: 成功。`tsc && vite build` は通過。
- `npx playwright test --timeout=10000 --reporter=line`: 成功。11 passed。

Phase 5 追加 E2E:

- spatial UI のゾーン枚数を安定して検証するため、`ZoneBox` / `HandDock` に `data-testid` を追加。
- BoardPage のダミーデッキ初期配置: 山札 30 / 手札 5 / シールド 5 を検証。
- Draw 操作: 山札 29 / 手札 6 への変化を検証。
- Init Field 操作: 初期枚数への復帰を検証。
- 山札右クリックから SearchDialog が開き、山札枚数が表示されることを検証。
- Save/Load ダイアログが JSON ダウンロード保存 / JSON ファイル読込 UI を表示することを検証。

再検証:

```bash
cd web
npm run build
npx playwright test --timeout=10000 --reporter=line
```

結果:

- `npm run build`: 成功。`tsc && vite build` は通過。
- `npx playwright test --timeout=10000 --reporter=line`: 成功。16 passed。
