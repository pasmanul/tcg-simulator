# Theme Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web版UIにテーマ選択機能を追加する。ハンバーガーメニュー→ダイアログでテーマを選択し、DOMとKonva canvasの両方に即時適用、localStorageで永続化する。

**Architecture:** `theme.ts`にTheme型と組み込みテーマを定義し、`themeStore`（Zustand）がテーマ状態を管理する。テーマ変更時はCSS変数を`:root`に自動注入（DOM側）＋ZoneGroupがthemeStoreのzonePaletteを読む（Konva側）。

**Tech Stack:** React 18 + TypeScript, Zustand, react-konva, localStorage, CSS custom properties

---

## File Map

| ファイル | 変更種別 | 責務 |
|---------|---------|------|
| `web/src/theme.ts` | 修正 | Theme型定義、darkCyberテーマ、THEMES配列 |
| `web/src/store/themeStore.ts` | 新規 | Zustandストア、CSS変数注入、localStorage読み書き |
| `web/src/index.css` | 修正 | ハードコード→CSS変数 |
| `web/src/store/uiStore.ts` | 修正 | DialogTypeに'theme'追加 |
| `web/src/ui/overlays/ThemeDialog.tsx` | 新規 | テーマ選択ダイアログUI |
| `web/src/ui/zones/ZoneGroup.tsx` | 修正 | themeStore経由でzonePalette読む |
| `web/src/ui/pages/BoardPage.tsx` | 修正 | ThemeDialog追加＋サイドバー項目追加 |
| `web/src/main.tsx` | 修正 | 起動時loadSavedTheme()呼び出し |

---

## Task 1: Theme型とdarkCyberテーマを定義する

**Files:**
- Modify: `web/src/theme.ts`

- [ ] **Step 1: theme.tsを開き、現在のTOKENSとZONE_PALETTEをTheme型に統合する**

`web/src/theme.ts`の内容を以下に置き換える:

```typescript
// Ported from ui/theme.py — civilization color palette

export interface ThemeTokens {
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

export interface ThemeStyle {
  fontBody?: string
  fontMono?: string
  borderRadius?: number   // px単位、UI角丸の基準
  glowIntensity?: number  // 0-1、グロウ強さ
  cardAspect?: number     // カード縦横比（デフォルト CARD_H/CARD_W）
}

export interface Theme {
  id: string
  name: string
  tokens: ThemeTokens
  zonePalette: Record<string, [string, string, string, string, string]>
  style?: ThemeStyle
  cssOverrides?: string
}

export const darkCyber: Theme = {
  id: 'dark-cyber',
  name: 'Dark Cyber',
  tokens: {
    bg:         '#0F0F23',
    bg2:        '#080818',
    purple:     '#7C3AED',
    purpleLite: '#A78BFA',
    cyan:       '#00FFFF',
    pink:       '#FF006E',
    text:       '#E2E8F0',
    muted:      '#94A3B8',
    border:     'rgba(124,58,237,0.30)',
  },
  zonePalette: {
    battle:    ['#1e0a0b', '#0d0506', '#c82030', '#ff8090', '#2c0a10'],
    mana:      ['#081c0c', '#040e06', '#28a848', '#66dd88', '#082214'],
    shield:    ['#1c1608', '#0e0b04', '#c89420', '#ffdd66', '#221c06'],
    graveyard: ['#120818', '#09040e', '#8820b8', '#cc66ee', '#1a0a28'],
    deck:      ['#061420', '#03080e', '#1880c8', '#44aaff', '#041020'],
    hand:      ['#061a1a', '#030e0e', '#20a8b0', '#55ddee', '#041818'],
    temp:      ['#0c1018', '#080c12', '#505c78', '#8899bb', '#0a0e18'],
  },
}

export const THEMES: Theme[] = [darkCyber]

// --- 後方互換：既存コードが直接インポートしているものを維持 ---

export interface ZoneColors {
  bgTop: string
  bgBottom: string
  border: string
  titleFg: string
  titleBar: string
}

/** @deprecated themeStore経由でzonePaletteを使うこと */
export function zoneColors(zoneId: string, zonePalette?: Theme['zonePalette']): ZoneColors {
  const palette = zonePalette ?? darkCyber.zonePalette
  const t = palette[zoneId] ?? palette['temp'] ?? darkCyber.zonePalette['temp']
  return { bgTop: t[0], bgBottom: t[1], border: t[2], titleFg: t[3], titleBar: t[4] }
}

// App-wide design tokens (後方互換)
/** @deprecated themeStore.currentTheme.tokensを使うこと */
export const TOKENS = darkCyber.tokens

export const CARD_W = 150
export const CARD_H = 210
```

- [ ] **Step 2: 型チェックを実行して既存コードへの影響を確認する**

```bash
cd web && npx tsc --noEmit
```

エラーがあれば確認してメモする（後のタスクで修正）。

- [ ] **Step 3: コミット**

```bash
git add web/src/theme.ts
git commit -m "feat: add Theme type and darkCyber theme definition"
```

---

## Task 2: themeStoreを作成する

**Files:**
- Create: `web/src/store/themeStore.ts`

- [ ] **Step 1: themeStore.tsを新規作成する**

```typescript
import { create } from 'zustand'
import { THEMES, darkCyber, type Theme } from '../theme'

const STORAGE_KEY = 'tcg-sim-theme'

function applyTheme(theme: Theme) {
  const r = document.documentElement.style

  // トークン → CSS変数
  r.setProperty('--bg',          theme.tokens.bg)
  r.setProperty('--bg2',         theme.tokens.bg2)
  r.setProperty('--purple',      theme.tokens.purple)
  r.setProperty('--purple-lite', theme.tokens.purpleLite)
  r.setProperty('--cyan',        theme.tokens.cyan)
  r.setProperty('--pink',        theme.tokens.pink)
  r.setProperty('--text',        theme.tokens.text)
  r.setProperty('--muted',       theme.tokens.muted)
  r.setProperty('--border',      theme.tokens.border)

  // スタイルオプション
  r.setProperty('--font-body',   theme.style?.fontBody   ?? "'Chakra Petch', sans-serif")
  r.setProperty('--font-mono',   theme.style?.fontMono   ?? "'Press Start 2P', monospace")
  r.setProperty('--radius',      `${theme.style?.borderRadius ?? 6}px`)
  r.setProperty('--glow',        `${theme.style?.glowIntensity ?? 1}`)

  // cssOverrides注入
  let styleEl = document.getElementById('theme-overrides') as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'theme-overrides'
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = theme.cssOverrides ?? ''
}

interface ThemeStore {
  currentTheme: Theme
  setTheme: (id: string) => void
  loadSavedTheme: () => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  currentTheme: darkCyber,

  setTheme: (id) => {
    const theme = THEMES.find(t => t.id === id) ?? darkCyber
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, id)
    set({ currentTheme: theme })
  },

  loadSavedTheme: () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const theme = (saved ? THEMES.find(t => t.id === saved) : null) ?? darkCyber
    applyTheme(theme)
    set({ currentTheme: theme })
  },
}))
```

- [ ] **Step 2: 型チェック実行**

```bash
cd web && npx tsc --noEmit
```

Expected: エラーなし。

- [ ] **Step 3: コミット**

```bash
git add web/src/store/themeStore.ts
git commit -m "feat: add themeStore with CSS variable injection"
```

---

## Task 3: index.cssをCSS変数化する

**Files:**
- Modify: `web/src/index.css`

- [ ] **Step 1: index.cssのハードコード値をCSS変数に置き換える**

`web/src/index.css`の内容を以下に置き換える:

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  background: var(--bg, #0F0F23);
  color: var(--text, #E2E8F0);
  font-family: var(--font-body, 'Chakra Petch', sans-serif);
  -webkit-font-smoothing: antialiased;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--bg2, #080818);
}
::-webkit-scrollbar-thumb {
  background: var(--purple, rgba(124,58,237,0.4));
  opacity: 0.4;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  opacity: 0.7;
}

/* Konva canvas */
canvas {
  display: block;
  filter: contrast(1.02) brightness(0.98);
}

/* Prevent context menu on canvas */
canvas {
  -webkit-user-select: none;
  user-select: none;
}
```

- [ ] **Step 2: コミット**

```bash
git add web/src/index.css
git commit -m "feat: use CSS custom properties in index.css for theming"
```

---

## Task 4: uiStoreのDialogTypeに'theme'を追加する

**Files:**
- Modify: `web/src/store/uiStore.ts:4`

- [ ] **Step 1: DialogType型を更新する**

`web/src/store/uiStore.ts`の4行目を変更する:

変更前:
```typescript
export type DialogType = 'setup' | 'setup-wizard' | 'search' | 'dice' | 'save-load' | 'field-editor' | 'zone-inline-editor' | null
```

変更後:
```typescript
export type DialogType = 'setup' | 'setup-wizard' | 'search' | 'dice' | 'save-load' | 'field-editor' | 'zone-inline-editor' | 'theme' | null
```

- [ ] **Step 2: 型チェック**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 3: コミット**

```bash
git add web/src/store/uiStore.ts
git commit -m "feat: add 'theme' to DialogType"
```

---

## Task 5: ThemeDialogを作成する

**Files:**
- Create: `web/src/ui/overlays/ThemeDialog.tsx`

- [ ] **Step 1: ThemeDialog.tsxを新規作成する**

```typescript
import { THEMES } from '../../theme'
import { useThemeStore } from '../../store/themeStore'
import { useUIStore } from '../../store/uiStore'

export function ThemeDialog() {
  const activeDialog = useUIStore(s => s.activeDialog)
  const closeDialog = useUIStore(s => s.closeDialog)
  const { currentTheme, setTheme } = useThemeStore(s => ({
    currentTheme: s.currentTheme,
    setTheme: s.setTheme,
  }))

  if (activeDialog !== 'theme') return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 700,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={closeDialog}
    >
      <div
        style={{
          background: '#08091e',
          border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 10,
          boxShadow: '0 0 40px rgba(124,58,237,0.3)',
          width: 420,
          maxWidth: '90vw',
          fontFamily: "'Chakra Petch', sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid rgba(124,58,237,0.2)',
        }}>
          <span style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            color: '#A78BFA',
            textShadow: '0 0 10px rgba(167,139,250,0.5)',
          }}>
            🎨 THEME
          </span>
          <button
            onClick={closeDialog}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#505c78',
              fontSize: 18,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0 4px',
            }}
            aria-label="閉じる"
          >×</button>
        </div>

        {/* Theme grid */}
        <div style={{
          padding: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
        }}>
          {THEMES.map(theme => {
            const isActive = theme.id === currentTheme.id
            return (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                style={{
                  background: isActive ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.03)',
                  border: isActive
                    ? '2px solid #7C3AED'
                    : '1px solid rgba(124,58,237,0.2)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 120ms',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(124,58,237,0.12)'
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}
              >
                {/* Color swatches */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {[theme.tokens.bg, theme.tokens.purple, theme.tokens.cyan, theme.tokens.pink].map((color, i) => (
                    <div
                      key={i}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        background: color,
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                  ))}
                </div>
                {/* Name */}
                <div style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 7,
                  color: isActive ? '#c4b5fd' : '#8899bb',
                  marginBottom: isActive ? 4 : 0,
                }}>
                  {theme.name}
                </div>
                {isActive && (
                  <div style={{ fontSize: 9, color: '#7C3AED' }}>✓ 選択中</div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 型チェック**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 3: コミット**

```bash
git add web/src/ui/overlays/ThemeDialog.tsx
git commit -m "feat: add ThemeDialog with color swatches"
```

---

## Task 6: ZoneGroupをthemeStore経由でzonePaletteを読むよう更新する

**Files:**
- Modify: `web/src/ui/zones/ZoneGroup.tsx`

- [ ] **Step 1: ZoneGroup.tsxのimportとcolors取得部分を変更する**

`web/src/ui/zones/ZoneGroup.tsx`の9行目付近:

変更前:
```typescript
import { zoneColors, CARD_W, CARD_H } from '../../theme'
```

変更後:
```typescript
import { zoneColors, CARD_W, CARD_H } from '../../theme'
import { useThemeStore } from '../../store/themeStore'
```

`web/src/ui/zones/ZoneGroup.tsx`の`ZoneGroup`関数内、`const colors = zoneColors(zoneDef.id)` の行:

変更前:
```typescript
  const colors = zoneColors(zoneDef.id)
```

変更後:
```typescript
  const zonePalette = useThemeStore(s => s.currentTheme.zonePalette)
  const colors = zoneColors(zoneDef.id, zonePalette)
```

- [ ] **Step 2: 型チェック**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 3: コミット**

```bash
git add web/src/ui/zones/ZoneGroup.tsx
git commit -m "feat: ZoneGroup reads zonePalette from themeStore"
```

---

## Task 7: BoardPageにThemeDialogとサイドバー項目を追加する

**Files:**
- Modify: `web/src/ui/pages/BoardPage.tsx`

- [ ] **Step 1: ThemeDialogのimportを追加する**

`web/src/ui/pages/BoardPage.tsx`の既存import群の末尾（`import { CRT_STYLE, PAGE_STYLE } from '../pageLayout'`の前）に追加:

```typescript
import { ThemeDialog } from '../overlays/ThemeDialog'
```

- [ ] **Step 2: sidebarItemsに🎨 THEMEを追加する**

`web/src/ui/pages/BoardPage.tsx`の`sidebarItems`配列（74行目付近）に項目を追加する。配列末尾（`⚙ BOARD EDIT`の後）:

```typescript
    {
      icon: '🎨',
      label: 'THEME',
      description: 'カラーテーマ変更',
      onClick: () => { useUIStore.getState().openDialog('theme'); useUIStore.getState().closeSidebar() },
    },
```

- [ ] **Step 3: JSXのOverlays内にThemeDialogを追加する**

`web/src/ui/pages/BoardPage.tsx`の`<FieldEditorDialog />`の後に追加:

```typescript
      <FieldEditorDialog />
      <ThemeDialog />
```

- [ ] **Step 4: 型チェック**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 5: コミット**

```bash
git add web/src/ui/pages/BoardPage.tsx
git commit -m "feat: integrate ThemeDialog into BoardPage sidebar"
```

---

## Task 8: 起動時にloadSavedThemeを呼び出す

**Files:**
- Modify: `web/src/main.tsx`

- [ ] **Step 1: main.tsxを更新する**

`web/src/main.tsx`を以下に変更:

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BoardPage } from './ui/pages/BoardPage'
import { useThemeStore } from './store/themeStore'

// 保存済みテーマをCSS変数に適用してからレンダリング
useThemeStore.getState().loadSavedTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BoardPage />
  </StrictMode>,
)
```

- [ ] **Step 2: 型チェック**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 3: 動作確認**

```bash
cd web && npm run dev
```

確認項目:
1. `http://localhost:5173` を開く
2. ハンバーガーボタン（☰）クリック → サイドバー開く
3. 「🎨 THEME」項目が表示される
4. クリック → ThemeDialog開く
5. テーマ「Dark Cyber」が表示され選択中状態
6. ページリロード → テーマ維持（localStorage確認）

- [ ] **Step 4: 最終コミット**

```bash
git add web/src/main.tsx
git commit -m "feat: load saved theme on startup"
```

---

## 完了後の確認

```bash
cd web && npx tsc --noEmit
```

Expected: エラーなし。

将来のテーマ追加方法:
```typescript
// web/src/theme.ts のTHEMES配列に追加するだけ
export const THEMES: Theme[] = [darkCyber, myNewTheme]
```
