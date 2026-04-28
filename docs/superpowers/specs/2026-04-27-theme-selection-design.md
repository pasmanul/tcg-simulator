# Theme Selection — Design Spec

Date: 2026-04-27

## Overview

Web版UIにテーマ選択機能を追加する。ハンバーガーメニュー（BoardSidebar）から専用ダイアログを開き、複数テーマを切り替えられる。テーマはDOM（CSS変数）とKonva canvas（zonePalette）の両方に適用される。テーマ自体のデザインはui-ux-pro-maxスキルで別途行う。

## Decisions

- UI: ダイアログ（既存overlayパターン）
- 永続化: localStorage
- 適用範囲: UIクロム（DOM）+ Konva zoneカラー（全部）
- テーマ定義方式: 単一TSオブジェクト（色 + スタイル + cssOverrides）

## Theme Interface

```ts
// web/src/theme.ts に追加
interface Theme {
  id: string
  name: string
  tokens: {
    bg: string
    bg2: string
    purple: string
    purpleLite: string
    cyan: string
    pink: string
    text: string
    muted: string
    border: string
  }
  zonePalette: Record<string, [string, string, string, string, string]>
  style?: {
    fontBody?: string       // body font-family
    fontMono?: string       // pixel/mono font
    borderRadius?: number   // UI全体の角丸基準値
    glowIntensity?: number  // グロウ強さ 0-1
    cardAspect?: number     // カード縦横比
  }
  cssOverrides?: string     // 任意CSS文字列（<style>タグに注入）
}

export const THEMES: Theme[] = [
  darkCyber,  // 現在の配色をデフォルトテーマとして定義
  // ui-ux-pro-maxで追加予定
]
```

新テーマ追加 = `THEMES`配列にオブジェクト1個追加のみ。

## themeStore

`web/src/store/themeStore.ts`（新規作成）

```ts
interface ThemeStore {
  currentTheme: Theme
  setTheme: (id: string) => void
  loadSavedTheme: () => void
}
```

- `setTheme`: ストア更新 → localStorage保存（key: `tcg-sim-theme`）→ CSS変数を`:root`に注入 → cssOverridesを`<style id="theme-overrides">`に注入
- `loadSavedTheme`: 起動時にlocalStorageからid読み取り → 該当テーマ適用（見つからなければdarkCyber）

CSS変数注入マッピング:
```
tokens.bg        → --bg
tokens.bg2       → --bg2
tokens.purple    → --purple
tokens.purpleLite→ --purple-lite
tokens.cyan      → --cyan
tokens.pink      → --pink
tokens.text      → --text
tokens.muted     → --muted
tokens.border    → --border
style.fontBody   → --font-body
style.fontMono   → --font-mono
style.borderRadius → --radius (px単位)
```

## index.css 変更

以下のハードコード値をCSS変数に置換:

```css
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
}
::-webkit-scrollbar-track { background: var(--bg2); }
::-webkit-scrollbar-thumb { background: rgba(var(--purple-rgb), 0.4); }
```

## ZoneGroup変更

`useThemeStore(s => s.currentTheme.zonePalette)` でzonePaletteを読む。
現在の`zoneColors()`関数はthemeStore経由で呼ぶよう変更。

## ThemeDialog

`web/src/ui/overlays/ThemeDialog.tsx`（新規作成）

- 既存ダイアログパターン: `if (activeDialog !== 'theme') return null`
- `uiStore`の`activeDialog`型に`'theme'`追加
- テーマ一覧をグリッド表示（カード形式、色スウォッチ付き）
- クリックで即時適用（リアルタイムプレビュー）
- 現在選択中テーマをハイライト

## BoardSidebar統合

`BoardPage.tsx`のsidebarItems配列に追加:
```ts
{ icon: '🎨', label: 'THEME', description: 'カラーテーマ変更', onClick: () => openDialog('theme') }
```

## 起動時初期化

`main.tsx`（または各ページのエントリ）で:
```ts
useThemeStore.getState().loadSavedTheme()
```

## Out of Scope

- 既存インラインスタイル（ボタン個別色等）のCSS変数移行（将来対応）
- テーマのエクスポート/インポート
- ユーザーカスタムテーマ作成UI
- hand.html / deck.htmlへのテーマ適用（初期スコープ外、BroadcastChannel経由で後対応可）

## Files Changed

- `web/src/theme.ts` — Theme interface追加、darkCyberテーマ定義、THEMES配列エクスポート
- `web/src/store/themeStore.ts` — 新規作成
- `web/src/index.css` — CSS変数使用に変更
- `web/src/ui/overlays/ThemeDialog.tsx` — 新規作成
- `web/src/store/uiStore.ts` — activeDialog型に'theme'追加
- `web/src/ui/pages/BoardPage.tsx` — sidebarItems追加
- `web/src/ui/zones/ZoneGroup.tsx` — themeStore経由でzonePalette読む
- `web/src/main.tsx` — loadSavedTheme()呼び出し追加
