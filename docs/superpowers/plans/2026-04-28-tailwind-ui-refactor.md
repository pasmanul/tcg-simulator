# Tailwind UI Refactor — Progress Document

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement remaining tasks. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web版の全DOM UIをTailwind CSSへ移行する。カードロジック層（`domain/`, `store/`, `sync/`, `lib/`）は一切触らない。

**Architecture:** Tailwindカラートークンは`var(--css-variable)`経由で参照するため、テーマ切り替えがDOMとKonvaの両方に自動適用される。ButtonコンポーネントはCSSカスタムプロパティ（`--btn-*`）でテーマ別カラーリングを実現する。

**Tech Stack:** React 18 + TypeScript + Vite, Tailwind CSS v3, PostCSS + Autoprefixer

---

## 完了フェーズ

### Phase 0: Tailwind セットアップ

- [x] `tailwindcss` + `postcss` + `autoprefixer` をインストール（npm packages）
- [x] `web/tailwind.config.js` 作成 — CSS変数をTailwindカラートークンとして登録
  - `bg`, `bg2`, `surface`, `surface2`, `primary`（=`--purple`）, `primary-lite`, `accent`（=`--cyan`）, `danger`（=`--pink`）, `text-base`, `muted`, `border`
  - `fontFamily`: `mono`（`'Press Start 2P'`）, `body`（`var(--font-body)`）
  - `borderRadius`: `theme`（`var(--radius)`）
- [x] `web/postcss.config.js` 作成
- [x] `web/src/index.css` に `@tailwind base/components/utilities` を追加
- [x] `web/design-system/MASTER.md` 生成（ui-ux-pro-max — Retro-Futurism スタイルガイド）

### Phase 1: 共通コンポーネント（`web/src/ui/components/`）

- [x] `Button.tsx` — variant（primary/secondary/danger/ghost）, size（sm/md）, onMouseEnter/Leave, aria-label
- [x] `Dialog.tsx` — open/onClose/title/width/className props; バックドロップクリックで閉じる; `z-[200]`
- [x] `Input.tsx` — InputHTMLAttributesを継承, label/error props
- [x] `Select.tsx` — optionsの配列prop, label/error props

### Phase 2: HUD・ページシェル

- [x] `BoardHud.tsx` — 全9ボタン → Buttonコンポーネント + `--btn-*` CSSカスタムプロパティ
- [x] `HandHud.tsx` — 全3ボタン → Buttonコンポーネント
- [x] `BoardPage.tsx` — レイアウトのインラインスタイル → Tailwind
- [x] `HandPage.tsx` — レイアウト → Tailwind
- [x] `web/src/ui/pageLayout.ts` — `PAGE_CLASSES` Tailwind文字列を追加

### Phase 3A: 小オーバーレイ（4ファイル）

- [x] `DiceDialog.tsx` — Dialog + Button
- [x] `DeckDropDialog.tsx` — Dialog + Button
- [x] `ThemeDialog.tsx` — Dialog + Button
- [x] `CardZoomOverlay.tsx` — Tailwind（動的座標はインラインスタイルを維持）

### Phase 3B: 中オーバーレイ（7ファイル）

- [x] `ContextMenu.tsx`
- [x] `SearchDialog.tsx`
- [x] `SaveLoadDialog.tsx`
- [x] `StackDialog.tsx`
- [x] `ActionLog.tsx`
- [x] `BoardSidebar.tsx`
- [x] `ZoneInlineEditor.tsx`
- 全ファイルでTailwind + Dialog/Button/Input/Selectを適用済み

### Phase 3C: 大オーバーレイ（6ファイル）— 完了済み

- [x] `GameLoadDialog.tsx` — Dialog + Button; `open={activeDialog === 'setup'}`
- [x] `FieldEditorDialog.tsx` — Dialog + Button; `open={activeDialog === 'field-editor'}`
- [x] `fieldDefShared.tsx` — FieldCard: ハードコードhex → CSS変数; Buttonでdeleteを実装
- [x] `GameSetupWizard.tsx` — カスタムオーバーレイ（バックドロップ不可・ウィザードフロー保護）; Button + Input; StepIndicator CSS変数
- [x] `CardEditorDialog.tsx` — Dialog + Button; `open={true}`（親がマウント制御）
- [x] `BoardEditorDialog.tsx` — カスタムオーバーレイ（95vw×95vh flexレイアウト）; Button; 動的位置スタイルはインライン維持; ハードコードhex → CSS変数

---

## 残タスク

### Phase 4: Deck UI（5ファイル）

対象ファイルと作業内容:

| ファイル | 規模 | 主な作業 |
|---------|------|---------|
| `web/src/ui/deck/DeckHud.tsx` | 小 | ボタン → Button, レイアウト → Tailwind |
| `web/src/ui/deck/FilterBar.tsx` | 中 | Input/Select, フィルタチップ → Tailwind |
| `web/src/ui/deck/LibraryGrid.tsx` | 中 | カードグリッド → Tailwind, カードサム → Tailwind |
| `web/src/ui/deck/DeckGrid.tsx` | 中 | デッキリスト → Tailwind |
| `web/src/ui/pages/DeckPage.tsx` | 大（約330行） | 2カラムレイアウト全体 → Tailwind |

#### Phase 4 タスク詳細

- [x] **Task 4-1: `DeckHud.tsx` を変換する**
  - インラインスタイルのボタン → `Button` コンポーネント
  - ラッパーdiv → Tailwind（`flex items-center gap-2 p-2 border-b border-border bg-bg2`）
  - 型チェック: `cd web && npx tsc --noEmit`

- [x] **Task 4-2: `FilterBar.tsx` を変換する**
  - テキスト検索input → `Input` コンポーネント
  - セレクト → `Select` コンポーネント
  - フィルタチップ（active/inactive）→ Tailwindクラス切り替え（`bg-primary/20 border-primary` vs `bg-surface border-border`）
  - 型チェック: `cd web && npx tsc --noEmit`

- [x] **Task 4-3: `LibraryGrid.tsx` を変換する**
  - グリッドコンテナ → `grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2 p-2`
  - カードサムネイル → Tailwindのホバー・選択状態クラス
  - 型チェック: `cd web && npx tsc --noEmit`

- [x] **Task 4-4: `DeckGrid.tsx` を変換する**
  - デッキカードリスト → Tailwind（`flex flex-col gap-1 p-2`）
  - 各行 → `flex items-center justify-between px-2 py-1 rounded bg-surface hover:bg-surface2`
  - 型チェック: `cd web && npx tsc --noEmit`

- [x] **Task 4-5: `DeckPage.tsx` を変換する**
  - 2カラムレイアウト → `flex h-full` + 左右パネルの `flex-col`
  - ヘッダー・フッター → Tailwind
  - インラインスタイルを全て除去
  - 型チェック: `cd web && npx tsc --noEmit`

---

### Phase 5: Konvaレイヤーのテーマ対応（4ファイル）

Konvaはブラウザ標準のCSS変数を読めないため、`useThemeStore(s => s.currentTheme.tokens)` でJSの値として取得してKonvaプロパティに渡す。

対象ファイルと作業内容:

| ファイル | 規模 | 主な作業 |
|---------|------|---------|
| `web/src/ui/zones/ZoneGroup.tsx` | 中 | `zoneColors` → themeStore経由の`zonePalette`（Theme選択実装で着手済み） |
| `web/src/ui/cards/CardShape.tsx` | 中 | ハードコードhex（`#1a1a3a`, `#aaccaa`, `#50b4ff`, `#e07020` 等）→ テーマトークン |
| `web/src/ui/zones/ZoneOverlayButtons.tsx` | 小 | DOM部分 → Tailwind（`--btn-zone-*` 変数を活用可） |
| `web/src/ui/stage/BoardStage.tsx` / `HandStage.tsx` | 小 | ラッパーdiv → Tailwind |

#### Phase 5 タスク詳細

- [x] **Task 5-1: `ZoneGroup.tsx` のzonePaletteをthemeStore経由にする**
  - `import { useThemeStore } from '../../store/themeStore'` を追加
  - `const colors = zoneColors(zoneDef.id)` → `const zonePalette = useThemeStore(s => s.currentTheme.zonePalette); const colors = zoneColors(zoneDef.id, zonePalette)`
  - 型チェック: `cd web && npx tsc --noEmit`

  > 注意: theme-selectionフェーズで既に着手されている場合はスキップする

- [x] **Task 5-2: `CardShape.tsx` のハードコード色をテーマトークンに変換する**
  - `useThemeStore` でトークンを取得
  - `#1a1a3a` → `tokens.bg`、`#aaccaa` → フェースアップカラー（tokens参照）、`#50b4ff` → `tokens.cyan`、`#e07020` → スタックバッジ色（既存 accentカラーを参照）
  - 型チェック: `cd web && npx tsc --noEmit`

- [x] **Task 5-3: `ZoneOverlayButtons.tsx` をTailwindに変換する**
  - インラインスタイルのボタン → `Button` コンポーネント（variant="ghost", size="sm"）
  - ラッパーdiv → `flex gap-1 absolute bottom-1 right-1`
  - 型チェック: `cd web && npx tsc --noEmit`

- [x] **Task 5-4: `BoardStage.tsx` / `HandStage.tsx` のラッパーdivをTailwindに変換する**
  - `style={{ width: '100%', height: '100%' }}` → `className="w-full h-full"`
  - 型チェック: `cd web && npx tsc --noEmit`

---

## アーキテクチャ上の決定事項

| 決定 | 理由 |
|------|------|
| TailwindカラーはCSS変数経由（`var()`） | テーマ切り替えが自動的にDOM全体へ適用される |
| ButtonはCSSカスタムプロパティ（`--btn-{id}-{bg\|bg-hover\|color\|...}`）でテーマ別カラーリング | Tailwindクラスを変えずにボタン色だけ差し替えられる |
| Dialogコンポーネント: `open` propがfalseのときはnullを返す | 常時マウントパターンを維持しつつレンダリングを抑制 |
| Konvaの色はJSの値（useThemeStore経由）で渡す | KonvaはブラウザのCSS変数を直接読めないため |
| `GameSetupWizard` はカスタムオーバーレイ（Dialogコンポーネントを使わない） | バックドロップクリックでの閉じ禁止（ウィザードフローを保護） |
| `BoardEditorDialog` はカスタムオーバーレイ | 95vw×95vhのフレックスレイアウト + ドラッグリサイズに対応するため |
| 動的座標（CardZoomOverlay, BoardEditorDialog内ドラッグ位置等）はインラインスタイルを維持 | Tailwindの静的クラスでは動的な数値を扱えない |

---

## 検証状況

- `npx tsc --noEmit` — 各フェーズ完了後に実行、現時点でパス
- ランタイムテスト（`npm run dev`）— 本セッションでは未実施（Phase 4/5完了後に実施予定）

---

## 触らないファイル（ロジック層）

以下のファイルはこのリファクタの対象外。変更しないこと。

- `web/src/domain/` — `types.ts`, `gameLogic.ts`
- `web/src/store/` — `gameStore.ts`, `uiStore.ts`, `layoutStore.ts`, `libraryStore.ts`, `themeStore.ts`
- `web/src/sync/useTabSync.ts`
- `web/src/lib/saveStorage.ts`
- `web/src/main.tsx`, `hand.tsx`, `deck.tsx`
- Phase 5の対象ファイル（Konva stage/zone/card）— Phase 5で扱う
