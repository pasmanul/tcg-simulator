# Skin System — 設計・実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement remaining tasks. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** UIコンポーネント層をスキンシステムに移行する。スキンを切り替えるだけでButtonやDialogのHTML構造・スタイルが丸ごと変わる。store/domain/Konvaは一切触らない。

**背景:** 現行UIはRetro-Futurism固定。今後もLiquidGlass・Glassmorphism等、異なるデザインスタイルを試したい。スキンシステムを導入し、実装を増やすだけで新スタイルを追加できる構造にする。

---

## アーキテクチャ

### コアコンセプト

```
SkinDef = コンポーネント実装 + CSS変数 + Konvaトークン（全部入り）
useSkin() → { Button, Dialog, Input, Select, Panel }
```

各ページ・オーバーレイは `useSkin()` からコンポーネントを取得するだけ。スキン切り替えはストアを更新するだけで全UI一括反映。

### 型定義（`web/src/ui/skin/types.ts`）

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  children?: ReactNode
  className?: string
  disabled?: boolean
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick']
  onMouseEnter?: ButtonHTMLAttributes<HTMLButtonElement>['onMouseEnter']
  onMouseLeave?: ButtonHTMLAttributes<HTMLButtonElement>['onMouseLeave']
  'aria-label'?: string
  style?: React.CSSProperties
  title?: string
  type?: 'button' | 'submit' | 'reset'
}

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  width?: string
  className?: string
  children?: ReactNode
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  label?: string
  error?: string
}

interface PanelProps {
  children?: ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'inset'
  style?: React.CSSProperties
}

interface SkinComponents {
  Button: React.FC<ButtonProps>
  Dialog: React.FC<DialogProps>
  Input:  React.FC<InputProps>
  Select: React.FC<SelectProps>
  Panel:  React.FC<PanelProps>
}

interface SkinDef {
  id: string
  name: string
  tokens:       ThemeTokens          // Konva用（ZoneGroup/CardShapeが参照）
  zonePalette:  ZonePalette
  cssVars:      Record<string, string>
  cssOverrides?: string
  components:   SkinComponents
}
```

**Panel の役割:** ガラス質コンテナ。ActionLog・BoardSidebar・HUDバー・Dialogの内部コンテナ等が使う。スキンによって `backdrop-filter`・背景・ボーダーが全く異なる。

### ストア（`web/src/store/skinStore.ts`）

`themeStore.ts` を置き換え。APIの形は同じ。

```typescript
interface SkinStore {
  currentSkin: SkinDef
  setSkin: (id: string) => void
  loadSavedSkin: () => void
}
```

Konva参照箇所の変更:
- `useThemeStore(s => s.currentTheme.tokens)` → `useSkinStore(s => s.currentSkin.tokens)`
- `useThemeStore(s => s.currentTheme.zonePalette)` → `useSkinStore(s => s.currentSkin.zonePalette)`

### SkinContext（`web/src/ui/skin/SkinContext.tsx`）

```tsx
const SkinContext = createContext<SkinDef>(defaultSkin)

export function SkinProvider({ children }: { children: ReactNode }) {
  const skin = useSkinStore(s => s.currentSkin)
  return <SkinContext.Provider value={skin}>{children}</SkinContext.Provider>
}

export function useSkin(): SkinComponents {
  return useContext(SkinContext).components
}

export function useSkinDef(): SkinDef {
  return useContext(SkinContext)
}
```

### ファイル構成

```
web/src/ui/skin/
├── types.ts                ← 全型定義
├── SkinContext.tsx          ← SkinProvider + useSkin() + useSkinDef()
├── index.ts                ← SKINS配列 + デフォルトスキン export
├── liquid-glass/
│   ├── tokens.ts            ← ThemeTokens + cssVars（暖金アクセント）
│   ├── Button.tsx
│   ├── Dialog.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Panel.tsx
│   └── index.ts             ← SkinDef組み立て
└── glassmorphism/
    ├── tokens.ts            ← ThemeTokens + cssVars（青紫アクセント）
    ├── Button.tsx
    ├── Dialog.tsx
    ├── Input.tsx
    ├── Select.tsx
    ├── Panel.tsx
    └── index.ts

web/src/store/
└── skinStore.ts             ← themeStore置き換え
```

既存 `web/src/ui/components/`（Button/Dialog/Input/Select）は現行維持。Phase 5でレトロスキンとして取り込む。

### SkinProvider のマウント位置

各エントリポイントのルートに追加:
```tsx
// main.tsx / hand.tsx / deck.tsx
<SkinProvider>
  <BoardPage />   // or HandPage / DeckPage
</SkinProvider>
```

### コンポーネント利用パターン（移行後）

```tsx
// 移行前
import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'

// 移行後
const { Button, Dialog, Panel } = useSkin()
```

---

## スキン仕様

### Liquid Glass

- 背景: `#1C1917`（深い暖色ダーク）
- アクセント: `#CA8A04`（ゴールド）
- ガラス: `backdrop-filter: blur(20px)` + `bg-stone-900/60`
- ボーダー: `stone-700/40` + ゴールドライン
- フォント: Playfair Display（見出し）+ Inter（本文）
- 雰囲気: 高級ボードゲーム・カードゲームショップ

### Glassmorphism Dark

- 背景: `#0F0F1A`（深い青紫ダーク）
- アクセント: `#6366F1`（インディゴ）
- ガラス: `backdrop-filter: blur(12px)` + `bg-white/8`
- ボーダー: `white/10`
- フォント: Space Grotesk or DM Sans（統一）
- 雰囲気: モダンゲームランチャー（Valorant/Steam的）

---

## 実装フェーズ

### Phase 1: Foundation

- [x] **Task 1-1: `web/src/ui/skin/types.ts` 作成**
  - ButtonProps / DialogProps / InputProps / SelectProps / PanelProps / SkinComponents / SkinDef を定義
  - ThemeTokens / ZonePalette は `../../theme` から re-export

- [x] **Task 1-2: `web/src/store/skinStore.ts` 作成**
  - themeStore と同じ構造（currentSkin / setSkin / loadSavedSkin）
  - STORAGE_KEY: `'tcg-sim-skin'`
  - applySkin() がcssVarsを全てdocument.documentElementに適用
  - デフォルト: glassmorphism（新スキン優先）

- [x] **Task 1-3: `web/src/ui/skin/SkinContext.tsx` 作成**
  - SkinProvider / useSkin() / useSkinDef() を実装

- [x] **Task 1-4: 既存7箇所を skinStore に移行**
  - `web/src/main.tsx`: `loadSavedTheme` → `loadSavedSkin`、SkinProvider追加
  - `web/src/hand.tsx`: 同上
  - `web/src/deck.tsx`: 同上
  - `web/src/ui/cards/CardShape.tsx`: `useThemeStore` → `useSkinStore`
  - `web/src/ui/zones/ZoneGroup.tsx`: `useThemeStore` → `useSkinStore`
  - `web/src/ui/overlays/ThemeDialog.tsx`: `useThemeStore` → `useSkinStore`、スキン選択UIに更新
  - 型チェック: `cd web && npx tsc --noEmit`

- [x] **Task 1-5: `web/src/ui/skin/index.ts` 作成（スタブ）**
  - Phase 2/3完了前の仮スキン（既存テーマを仮でラップ）でビルドが通る状態を維持

---

### Phase 2: Liquid Glass スキン

- [x] **Task 2-1: `skin/liquid-glass/tokens.ts` 作成**
  - ThemeTokens（暖金パレット）
  - cssVars Record（`--bg`, `--purple`→ゴールド 等 全CSS変数）
  - cssOverrides（Playfair Display / Inter フォント @import）

- [x] **Task 2-2: `skin/liquid-glass/Panel.tsx` 作成**
  - `backdrop-filter: blur(20px)` + `bg-stone-900/60`
  - ボーダー: `stone-700/40`、ゴールドライン（`border-t-1 border-amber-600/30`）
  - variant='elevated': blur強化 + shadow強化
  - variant='inset': bg暗め・blur弱め

- [x] **Task 2-3: `skin/liquid-glass/Button.tsx` 作成**
  - variant='primary': ゴールドbg + 暗色text
  - variant='secondary': ガラス質 + ゴールドボーダー
  - variant='danger': 赤系
  - variant='ghost': 透明 + hover時ゴールドtint
  - ホバー: 150ms ease transition

- [x] **Task 2-4: `skin/liquid-glass/Dialog.tsx` 作成**
  - バックドロップ: `bg-stone-950/70` + `backdrop-filter: blur(4px)`
  - パネル: Panel(variant='elevated')を使用
  - タイトル: Playfair Display、ゴールドアクセント下線

- [x] **Task 2-5: `skin/liquid-glass/Input.tsx` + `Select.tsx` 作成**
  - bg: `bg-stone-800/60`、border: `stone-600/50`
  - focus: ゴールドボーダー + glow

- [x] **Task 2-6: `skin/liquid-glass/index.ts` 作成**
  - SkinDef として組み立て・export
  - 型チェック: `cd web && npx tsc --noEmit`

---

### Phase 3: Glassmorphism Dark スキン

- [x] **Task 3-1: `skin/glassmorphism/tokens.ts` 作成**
  - ThemeTokens（青紫パレット）
  - cssVars（`--bg: #0F0F1A`、`--purple: #6366F1` 等）
  - cssOverrides（Space Grotesk or DM Sans @import）

- [x] **Task 3-2: `skin/glassmorphism/Panel.tsx` 作成**
  - `backdrop-filter: blur(12px)` + `bg-white/8`
  - ボーダー: `white/10`
  - variant='elevated': blur16px + bg-white/12
  - variant='inset': bg-black/20 + blur8px

- [x] **Task 3-3: `skin/glassmorphism/Button.tsx` 作成**
  - variant='primary': インディゴbg + white text + glow
  - variant='secondary': ガラス質 + インディゴボーダー
  - variant='danger': ローズ系
  - variant='ghost': 透明 + hover時白tint

- [x] **Task 3-4: `skin/glassmorphism/Dialog.tsx` 作成**
  - バックドロップ: `bg-black/50` + `backdrop-filter: blur(8px)`
  - パネル: Panel(variant='elevated')使用
  - タイトル: グラデーションテキスト（インディゴ→シアン）

- [x] **Task 3-5: `skin/glassmorphism/Input.tsx` + `Select.tsx` 作成**
  - bg: `bg-white/5`、border: `white/15`
  - focus: インディゴボーダー + glow

- [x] **Task 3-6: `skin/glassmorphism/index.ts` 作成**
  - SkinDef として組み立て・export
  - 型チェック: `cd web && npx tsc --noEmit`

---

### Phase 4: overlays/pages を useSkin() に移行

対象ファイル（全て `import { Button/Dialog/Input/Select }` → `useSkin()` に切り替え）:

- [x] **Task 4-1: HUD系（3ファイル）**
  - `web/src/ui/hud/BoardHud.tsx`
  - `web/src/ui/deck/DeckHud.tsx`
  - `web/src/ui/hud/HandHud.tsx`（存在確認してから）

- [x] **Task 4-2: 小オーバーレイ（4ファイル）**
  - `DiceDialog.tsx`
  - `DeckDropDialog.tsx`
  - `ThemeDialog.tsx`（スキン選択UIとして刷新済みのはず）
  - `CardZoomOverlay.tsx`

- [x] **Task 4-3: 中オーバーレイ（7ファイル）**
  - `ContextMenu.tsx`
  - `SearchDialog.tsx`
  - `SaveLoadDialog.tsx`
  - `StackDialog.tsx`
  - `ActionLog.tsx`（Panel使用に更新）
  - `BoardSidebar.tsx`（Panel使用に更新）
  - `ZoneInlineEditor.tsx`

- [x] **Task 4-4: 大オーバーレイ（6ファイル）**
  - `GameLoadDialog.tsx`
  - `FieldEditorDialog.tsx`
  - `fieldDefShared.tsx`
  - `GameSetupWizard.tsx`
  - `CardEditorDialog.tsx`
  - `BoardEditorDialog.tsx`

- [x] **Task 4-5: ページ（2ファイル）**
  - `BoardPage.tsx`
  - `DeckPage.tsx`

- [x] **Task 4-6: Deck UI（4ファイル）**
  - `FilterBar.tsx`
  - `LibraryGrid.tsx`
  - `DeckGrid.tsx`
  - `ZoneOverlayButtons.tsx`

- [x] **最終型チェック: `cd web && npx tsc --noEmit`**

---

### Phase 5: 既存テーマをスキン構造にラップ（後回し）

- [ ] `web/src/ui/skin/retro/` ディレクトリ作成
- [ ] 既存 `ui/components/Button` 等をスキン実装として取り込み
- [ ] darkCyber / neonArcade / crimsonCourt / softPaper を SkinDef として export
- [ ] `themeStore.ts` 削除、`theme.ts` を skinStore 内に統合

---

## アーキテクチャ上の決定事項

- **Skin = 統合型**: コンポーネント + CSS変数 + Konvaトークンを一括管理。スキン/テーマを分離しない
- **Panel を必須プリミティブに**: HUD・サイドバー・ダイアログコンテナ全て Panel 経由にすることでスキン反映を保証
- **既存 `ui/components/` は保留**: Phase 5まで削除しない。並行して参照されても問題ない
- **SkinProvider はエントリポイント直下**: main/hand/deck.tsx の `<App>` 相当位置に置く
- **themeStore はすぐ置き換え**: Phase 1完了時点で themeStore への参照はゼロにする
- **デフォルトスキン**: glassmorphism（新スキン優先）

---

## 検証状況

- `npx tsc --noEmit` — 各フェーズ完了後に実行
- ランタイムテスト（`npm run dev`）— Phase 3完了後に実施予定
