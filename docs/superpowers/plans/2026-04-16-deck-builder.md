# デッキビルダー実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `deck.html` として独立したデッキ管理ページを追加し、カードライブラリから D&D でデッキを編集、File System Access API（readwrite）でローカルフォルダに保存できるようにする。

**Architecture:** 既存の `libraryStore` を拡張して `dirHandle` とデッキ管理アクションを持たせる。`deckStorage.ts` がファイル操作の純粋ロジックを担い、UI コンポーネント（`DeckHud`, `FilterBar`, `LibraryGrid`, `DeckGrid`）は `web/src/ui/deck/` に集約する。`imageCache.ts` を `readwrite` モードに変更して `dirHandle` を store に渡す。

**Tech Stack:** React 18, TypeScript, Zustand, Vite, File System Access API（readwrite）, HTML5 DnD

---

## ファイルマップ

| アクション | ファイル | 内容 |
|---|---|---|
| 変更 | `web/src/lib/imageCache.ts` | `readwrite` モードに変更、`LoadedLibrary` に `dirHandle` を追加 |
| 新規 | `web/src/lib/deckStorage.ts` | `decks/` フォルダへの読み書きロジック |
| 変更 | `web/src/store/libraryStore.ts` | `dirHandle` / `deckFiles` / デッキ操作アクションを追加 |
| 新規 | `web/deck.html` | HTML エントリポイント |
| 新規 | `web/src/deck.tsx` | React エントリポイント |
| 変更 | `web/vite.config.ts` | `deck` エントリを追加 |
| 新規 | `web/src/ui/deck/DeckHud.tsx` | HUD（デッキ選択・名前・枚数・SAVE・ページ遷移） |
| 新規 | `web/src/ui/deck/FilterBar.tsx` | 絞り込みバー＋フィルタ純粋関数 |
| 新規 | `web/src/ui/deck/LibraryGrid.tsx` | カードライブラリグリッド（ドラッグ元） |
| 新規 | `web/src/ui/deck/DeckGrid.tsx` | デッキグリッド（ドロップ先）＋トースト |
| 新規 | `web/src/ui/pages/DeckPage.tsx` | ページ全体のレイアウト |
| 変更 | `web/src/ui/hud/BoardHud.tsx` | DECK ボタンを追加 |

---

## Task 1: `deckStorage.ts` — デッキ読み書きロジック

**Files:**
- Create: `web/src/lib/deckStorage.ts`

### 型定義と全関数を一度に実装する

- [ ] **Step 1: ファイルを作成する**

`web/src/lib/deckStorage.ts` を以下の内容で作成する：

```typescript
export interface DeckJson {
  name: string
  cards: Array<{ cardId: string; count: number }>
}

/** decks/ サブフォルダを取得または作成する */
async function getDecksDir(
  dirHandle: FileSystemDirectoryHandle,
): Promise<FileSystemDirectoryHandle> {
  return dirHandle.getDirectoryHandle('decks', { create: true })
}

/** decks/ 内の *.json ファイル名（拡張子なし）一覧を返す */
export async function listDeckFiles(
  dirHandle: FileSystemDirectoryHandle,
): Promise<string[]> {
  const decksDir = await getDecksDir(dirHandle)
  const names: string[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for await (const [name] of (decksDir as any).entries()) {
    if (typeof name === 'string' && name.endsWith('.json')) {
      names.push(name.slice(0, -5))
    }
  }
  return names.sort()
}

/**
 * ファイル名（拡張子なし）を指定してデッキを読み込む。
 * Python 版の旧フォーマット（id フィールド）にも対応する。
 */
export async function readDeckFile(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
): Promise<DeckJson> {
  const decksDir = await getDecksDir(dirHandle)
  const fileHandle = await decksDir.getFileHandle(`${filename}.json`)
  const file = await fileHandle.getFile()
  const raw = JSON.parse(await file.text())

  // Python 版互換: cards[] の各エントリが id を持ち cardId を持たない場合に変換
  const cards = (raw.cards ?? []).map((entry: Record<string, unknown>) => ({
    cardId: (entry.cardId ?? entry.id) as string,
    count: (entry.count as number) ?? 1,
  }))

  return { name: (raw.name as string) ?? filename, cards }
}

/** デッキを filename.json として decks/ フォルダに書き込む */
export async function writeDeckFile(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
  deck: DeckJson,
): Promise<void> {
  const decksDir = await getDecksDir(dirHandle)
  const fileHandle = await decksDir.getFileHandle(`${filename}.json`, {
    create: true,
  })
  const writable = await fileHandle.createWritable()
  await writable.write(JSON.stringify(deck, null, 2))
  await writable.close()
}
```

- [ ] **Step 2: TypeScript エラーがないか確認する**

```bash
cd web && npx tsc --noEmit
```

エラーがなければ OK。

- [ ] **Step 3: コミットする**

```bash
cd web && git add src/lib/deckStorage.ts && git commit -m "feat: deckStorage.ts — decks/フォルダ読み書きロジック"
```

---

## Task 2: `imageCache.ts` 更新 — readwrite + dirHandle

**Files:**
- Modify: `web/src/lib/imageCache.ts`

### `LoadedLibrary` に `dirHandle` を追加し、`readwrite` モードにする

- [ ] **Step 1: `LoadedLibrary` インターフェースに `dirHandle` を追加する**

`web/src/lib/imageCache.ts` の以下の部分を変更する：

変更前：
```typescript
export interface LoadedLibrary {
  cardsJson: import('../domain/types').Card[]
  fileMap: Map<string, string>  // image_path -> objectURL
  cardBackUrl: string
}
```

変更後：
```typescript
export interface LoadedLibrary {
  cardsJson: import('../domain/types').Card[]
  fileMap: Map<string, string>  // image_path -> objectURL
  cardBackUrl: string
  dirHandle: FileSystemDirectoryHandle
}
```

- [ ] **Step 2: `loadLibraryFromDirectory` の戻り値に `dirHandle` を含める**

変更前：
```typescript
  return { cardsJson, fileMap, cardBackUrl }
```

変更後：
```typescript
  return { cardsJson, fileMap, cardBackUrl, dirHandle }
```

関数シグネチャは変更なし（引数として `dirHandle` を受け取っているため）。

- [ ] **Step 3: `pickAndLoadLibrary` を `readwrite` モードにする**

変更前：
```typescript
    const dirHandle: FileSystemDirectoryHandle = await win.showDirectoryPicker({ mode: 'read' })
```

変更後：
```typescript
    const dirHandle: FileSystemDirectoryHandle = await win.showDirectoryPicker({ mode: 'readwrite' })
```

- [ ] **Step 4: TypeScript エラーがないか確認する**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 5: コミットする**

```bash
git add web/src/lib/imageCache.ts && git commit -m "feat: imageCache — readwriteモード・dirHandleをLoadedLibraryに追加"
```

---

## Task 3: `libraryStore.ts` 拡張 — dirHandle とデッキ管理

**Files:**
- Modify: `web/src/store/libraryStore.ts`

### `dirHandle`・`deckFiles`・デッキ操作アクションを追加する

- [ ] **Step 1: import を追加する**

ファイル冒頭の import 群に追加：

```typescript
import { listDeckFiles, readDeckFile, writeDeckFile, type DeckJson } from '../lib/deckStorage'
```

- [ ] **Step 2: `LibraryStore` インターフェースに追加フィールドを定義する**

既存の `LibraryStore` インターフェース末尾に追加：

```typescript
  dirHandle: FileSystemDirectoryHandle | null
  deckFiles: string[]

  setDirHandle: (h: FileSystemDirectoryHandle) => void
  listDeckFiles: () => Promise<void>
  loadDeckFile: (filename: string) => Promise<void>
  saveDeckFile: () => Promise<void>
  newDeck: () => void
```

- [ ] **Step 3: 初期値と実装を追加する**

`create<LibraryStore>((set, get) => ({` のブロック内、`setCardBack` の後に追加：

```typescript
  dirHandle: null,
  deckFiles: [],

  setDirHandle: (h) => set({ dirHandle: h }),

  listDeckFiles: async () => {
    const { dirHandle } = get()
    if (!dirHandle) return
    try {
      const files = await listDeckFiles(dirHandle)
      set({ deckFiles: files })
    } catch {
      // decks/ フォルダがまだ存在しないケースは無視
    }
  },

  loadDeckFile: async (filename) => {
    const { dirHandle } = get()
    if (!dirHandle) return
    const deck = await readDeckFile(dirHandle, filename)
    set({ currentDeck: deck.cards, deckName: deck.name })
  },

  saveDeckFile: async () => {
    const { dirHandle, currentDeck, deckName } = get()
    if (!dirHandle) return
    const filename = deckName.trim() || '無題デッキ'
    const deck: DeckJson = { name: filename, cards: currentDeck }
    await writeDeckFile(dirHandle, filename, deck)
    // 一覧を更新
    const files = await listDeckFiles(dirHandle)
    set({ deckFiles: files, deckName: filename })
  },

  newDeck: () => set({ currentDeck: [], deckName: '' }),
```

- [ ] **Step 4: `loadLibrary` を更新して `dirHandle` を受け取るようにする**

既存の `loadLibrary` アクションを変更：

変更前：
```typescript
  loadLibrary: (cardsJson, fileMap) => {
    const urls: Record<string, string> = {}
    for (const card of cardsJson) {
      const url = fileMap.get(card.image_path)
      if (url) urls[card.image_path] = url
    }
    set({ cards: cardsJson, imageUrls: urls })
  },
```

変更後（第3引数 `dirHandle` を追加）：
```typescript
  loadLibrary: (cardsJson, fileMap, dirHandle?) => {
    const urls: Record<string, string> = {}
    for (const card of cardsJson) {
      const url = fileMap.get(card.image_path)
      if (url) urls[card.image_path] = url
    }
    set({ cards: cardsJson, imageUrls: urls, ...(dirHandle ? { dirHandle } : {}) })
  },
```

- [ ] **Step 5: `LibraryStore` インターフェースの `loadLibrary` シグネチャを合わせる**

```typescript
  loadLibrary: (cardsJson: Card[], fileMap: Map<string, string>, dirHandle?: FileSystemDirectoryHandle) => void
```

- [ ] **Step 6: `SetupDialog.tsx` の `loadLibrary` 呼び出しを更新する**

`web/src/ui/overlays/SetupDialog.tsx` の `handlePickFolder` と `handleRestore` を変更する：

変更前（両関数とも）：
```typescript
      loadLibrary(result.cardsJson, result.fileMap)
```

変更後：
```typescript
      loadLibrary(result.cardsJson, result.fileMap, result.dirHandle)
```

- [ ] **Step 7: TypeScript エラーがないか確認する**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 8: コミットする**

```bash
git add web/src/store/libraryStore.ts web/src/ui/overlays/SetupDialog.tsx && git commit -m "feat: libraryStore — dirHandle・デッキ管理アクションを追加"
```

---

## Task 4: HTML エントリポイントと vite.config.ts

**Files:**
- Create: `web/deck.html`
- Create: `web/src/deck.tsx`
- Modify: `web/vite.config.ts`

### `deck.html` ページのエントリを追加する

- [ ] **Step 1: `deck.html` を作成する**

`index.html` と同じ構造でタイトルのみ変更：

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TCG Simulator — デッキビルダー</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Chakra+Petch:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/deck.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: `deck.tsx` を作成する**

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { DeckPage } from './ui/pages/DeckPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DeckPage />
  </StrictMode>,
)
```

- [ ] **Step 3: `vite.config.ts` に `deck` エントリを追加する**

変更前：
```typescript
      input: {
        main: resolve(__dirname, 'index.html'),
        hand: resolve(__dirname, 'hand.html'),
      },
```

変更後：
```typescript
      input: {
        main: resolve(__dirname, 'index.html'),
        hand: resolve(__dirname, 'hand.html'),
        deck: resolve(__dirname, 'deck.html'),
      },
```

- [ ] **Step 4: dev サーバーで `deck.html` にアクセスできるか確認する**

```bash
cd web && npm run dev
```

ブラウザで `http://localhost:5173/deck.html` を開く。空白ページが表示されれば OK（`DeckPage` はまだ作っていないのでエラーが出るが、それは次のタスクで解消）。

- [ ] **Step 5: コミットする**

```bash
git add web/deck.html web/src/deck.tsx web/vite.config.ts && git commit -m "feat: deck.html エントリポイント追加"
```

---

## Task 5: `DeckHud.tsx`

**Files:**
- Create: `web/src/ui/deck/DeckHud.tsx`

### HUD バー（デッキ選択・名前・枚数・SAVE・BOARD リンク）を実装する

- [ ] **Step 1: `web/src/ui/deck/DeckHud.tsx` を作成する**

```typescript
import { useLibraryStore } from '../../store/libraryStore'

export function DeckHud() {
  const {
    deckFiles,
    currentDeck,
    deckName,
    dirHandle,
    loadDeckFile,
    saveDeckFile,
    loadDeck,
    newDeck,
  } = useLibraryStore(s => ({
    deckFiles: s.deckFiles,
    currentDeck: s.currentDeck,
    deckName: s.deckName,
    dirHandle: s.dirHandle,
    loadDeckFile: s.loadDeckFile,
    saveDeckFile: s.saveDeckFile,
    loadDeck: s.loadDeck,
    newDeck: s.newDeck,
  }))

  const totalCount = currentDeck.reduce((s, e) => s + e.count, 0)
  const overLimit = totalCount > 40

  const btn: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 8,
    padding: '7px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 150ms',
    whiteSpace: 'nowrap',
  }

  async function handleSave() {
    if (!dirHandle) {
      alert('先にカードライブラリを読み込んでください')
      return
    }
    if (!deckName.trim()) {
      alert('デッキ名を入力してください')
      return
    }
    await saveDeckFile()
  }

  async function handleSelectDeck(filename: string) {
    if (!filename) {
      newDeck()
      return
    }
    await loadDeckFile(filename)
  }

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      padding: '6px 12px',
      background: '#08091a',
      borderBottom: '1px solid rgba(124,58,237,0.2)',
      alignItems: 'center',
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 9,
        color: '#00FFFF',
        textShadow: '0 0 12px rgba(0,255,255,0.6)',
        marginRight: 4,
      }}>
        DECK
      </span>

      {/* デッキ選択 */}
      <select
        value={deckName}
        onChange={e => handleSelectDeck(e.target.value)}
        style={{
          background: '#0e1228',
          color: '#A78BFA',
          border: '1px solid rgba(124,58,237,0.5)',
          borderRadius: 4,
          padding: '4px 8px',
          fontFamily: "'Chakra Petch', sans-serif",
          fontSize: 11,
          cursor: 'pointer',
          maxWidth: 160,
        }}
      >
        <option value="">— 新規 —</option>
        {deckFiles.map(f => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>

      {/* デッキ名入力 */}
      <input
        type="text"
        placeholder="デッキ名"
        value={deckName}
        onChange={e => loadDeck({ cards: currentDeck, name: e.target.value })}
        style={{
          background: '#0e1228',
          color: '#E2E8F0',
          border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 4,
          padding: '4px 8px',
          fontFamily: "'Chakra Petch', sans-serif",
          fontSize: 12,
          width: 160,
        }}
      />

      {/* 枚数 */}
      <span style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 9,
        color: overLimit ? '#ff4444' : '#94A3B8',
        minWidth: 52,
      }}>
        {totalCount}/40
      </span>

      {/* SAVE */}
      <button
        style={{
          ...btn,
          background: '#0c280c',
          color: '#88dd88',
          border: '1px solid #285028',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#103810')}
        onMouseLeave={e => (e.currentTarget.style.background = '#0c280c')}
        onClick={handleSave}
      >
        SAVE
      </button>

      {/* BOARD リンク */}
      <a
        href="/index.html"
        style={{
          ...btn,
          background: '#0c1828',
          color: '#88aade',
          border: '1px solid #284060',
          textDecoration: 'none',
          display: 'inline-block',
          marginLeft: 'auto',
        }}
      >
        ▶ BOARD
      </a>
    </div>
  )
}
```

- [ ] **Step 2: コミットする**

```bash
git add web/src/ui/deck/DeckHud.tsx web/src/store/libraryStore.ts && git commit -m "feat: DeckHud コンポーネント追加"
```

---

## Task 6: `FilterBar.tsx` — 絞り込みバーとフィルタロジック

**Files:**
- Create: `web/src/ui/deck/FilterBar.tsx`

### 絞り込みUI と純粋なフィルタ関数を実装する

- [ ] **Step 1: `web/src/ui/deck/FilterBar.tsx` を作成する**

```typescript
import type { Card } from '../../domain/types'

export interface FilterState {
  query: string
  sort: 'mana_asc' | 'mana_desc' | 'name' | 'type'
  mana: string   // 'すべて' | '1' | ... | '12+'
  civ: string    // 'すべて' | 動的
  type: string   // 'すべて' | 動的
}

export const DEFAULT_FILTER: FilterState = {
  query: '',
  sort: 'mana_asc',
  mana: 'すべて',
  civ: 'すべて',
  type: 'すべて',
}

/** カード一覧をフィルタ＆ソートして返す純粋関数 */
export function applyFilters(cards: Card[], filter: FilterState): Card[] {
  let result = cards.filter(c => {
    if (filter.query && !c.name.toLowerCase().includes(filter.query.toLowerCase())) return false
    if (filter.mana !== 'すべて') {
      if (filter.mana === '12+') { if (c.mana < 12) return false }
      else { if (c.mana !== Number(filter.mana)) return false }
    }
    if (filter.civ !== 'すべて' && !c.civilizations.includes(filter.civ)) return false
    if (filter.type !== 'すべて' && c.card_type !== filter.type) return false
    return true
  })

  switch (filter.sort) {
    case 'mana_asc':  result = result.sort((a, b) => a.mana - b.mana || a.name.localeCompare(b.name)); break
    case 'mana_desc': result = result.sort((a, b) => b.mana - a.mana || a.name.localeCompare(b.name)); break
    case 'name':      result = result.sort((a, b) => a.name.localeCompare(b.name)); break
    case 'type':      result = result.sort((a, b) => (a.card_type ?? '').localeCompare(b.card_type ?? '') || a.mana - b.mana); break
  }
  return result
}

/** cards から重複なく文明・タイプを収集する */
export function collectOptions(cards: Card[]): { civs: string[]; types: string[] } {
  const civSet = new Set<string>()
  const typeSet = new Set<string>()
  for (const c of cards) {
    c.civilizations.forEach(v => civSet.add(v))
    if (c.card_type) typeSet.add(c.card_type)
  }
  return {
    civs: [...civSet].sort(),
    types: [...typeSet].sort(),
  }
}

interface Props {
  cards: Card[]       // 全カード（選択肢生成用）
  filter: FilterState
  onChange: (f: FilterState) => void
}

const sel: React.CSSProperties = {
  background: '#0e1228',
  color: '#A78BFA',
  border: '1px solid rgba(124,58,237,0.4)',
  borderRadius: 4,
  padding: '3px 6px',
  fontFamily: "'Chakra Petch', sans-serif",
  fontSize: 11,
  cursor: 'pointer',
}

export function FilterBar({ cards, filter, onChange }: Props) {
  const { civs, types } = collectOptions(cards)

  const set = (partial: Partial<FilterState>) => onChange({ ...filter, ...partial })

  return (
    <div style={{
      display: 'flex',
      gap: 6,
      padding: '6px 8px',
      background: '#060810',
      borderBottom: '1px solid rgba(124,58,237,0.15)',
      flexWrap: 'wrap',
      alignItems: 'center',
      flexShrink: 0,
    }}>
      {/* 名前検索 */}
      <input
        type="text"
        placeholder="カード名で検索..."
        value={filter.query}
        onChange={e => set({ query: e.target.value })}
        style={{
          ...sel,
          color: '#E2E8F0',
          width: 140,
        }}
      />

      {/* ソート */}
      <select value={filter.sort} onChange={e => set({ sort: e.target.value as FilterState['sort'] })} style={sel}>
        <option value="mana_asc">マナ↑</option>
        <option value="mana_desc">マナ↓</option>
        <option value="name">名前順</option>
        <option value="type">タイプ順</option>
      </select>

      {/* マナ */}
      <select value={filter.mana} onChange={e => set({ mana: e.target.value })} style={sel}>
        <option value="すべて">マナ:全</option>
        {Array.from({ length: 11 }, (_, i) => i + 1).map(n => (
          <option key={n} value={String(n)}>{n}</option>
        ))}
        <option value="12+">12+</option>
      </select>

      {/* 文明 */}
      <select value={filter.civ} onChange={e => set({ civ: e.target.value })} style={sel}>
        <option value="すべて">文明:全</option>
        {civs.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* タイプ */}
      <select value={filter.type} onChange={e => set({ type: e.target.value })} style={sel}>
        <option value="すべて">タイプ:全</option>
        {types.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      {/* リセット */}
      <button
        onClick={() => onChange(DEFAULT_FILTER)}
        style={{
          ...sel,
          color: '#94A3B8',
          cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        リセット
      </button>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript エラーがないか確認する**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 3: コミットする**

```bash
git add web/src/ui/deck/FilterBar.tsx && git commit -m "feat: FilterBar — 絞り込みUI・applyFilters純粋関数"
```

---

## Task 7: `LibraryGrid.tsx` — カードライブラリグリッド

**Files:**
- Create: `web/src/ui/deck/LibraryGrid.tsx`

### ドラッグ可能なカードサムネイルグリッドを実装する

- [ ] **Step 1: `web/src/ui/deck/LibraryGrid.tsx` を作成する**

```typescript
import { useLibraryStore } from '../../store/libraryStore'
import { applyFilters, type FilterState } from './FilterBar'
import type { Card } from '../../domain/types'

interface Props {
  filter: FilterState
}

function LibraryCardTile({ card }: { card: Card }) {
  const { resolveImageUrl, cardBackUrl } = useLibraryStore(s => ({
    resolveImageUrl: s.resolveImageUrl,
    cardBackUrl: s.cardBackUrl,
  }))
  const imgUrl = resolveImageUrl(card.image_path) || cardBackUrl

  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ cardId: card.id }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      title={card.name}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      {/* サムネイル */}
      <div style={{
        width: 72,
        aspectRatio: '150/210',
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid rgba(124,58,237,0.3)',
        background: '#0d1020',
        flexShrink: 0,
      }}>
        {imgUrl ? (
          <img src={imgUrl} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#1a1a2e' }} />
        )}
      </div>

      {/* カード名 */}
      <div style={{
        fontFamily: "'Chakra Petch', sans-serif",
        fontSize: 8,
        color: '#94A3B8',
        textAlign: 'center',
        width: 72,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
      }}>
        {card.name}
      </div>

      {/* マナ + 文明ドット */}
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: '#44bbff' }}>
          M{card.mana}
        </span>
        {card.civilizations.map((civ, i) => (
          <span key={i} style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: CIV_COLOR[civ] ?? '#888',
          }} />
        ))}
      </div>
    </div>
  )
}

const CIV_COLOR: Record<string, string> = {
  '光': '#ffe44d',
  '水': '#44aaff',
  '闇': '#aa44ff',
  '火': '#ff4444',
  '自然': '#44cc44',
  '無色': '#888888',
}

export function LibraryGrid({ filter }: Props) {
  const cards = useLibraryStore(s => s.cards)
  const filtered = applyFilters(cards, filter)

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: 8,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, 80px)',
      gap: 8,
      alignContent: 'start',
    }}>
      {filtered.length === 0 && (
        <div style={{
          gridColumn: '1 / -1',
          color: '#505c78',
          fontFamily: "'Chakra Petch', sans-serif",
          fontSize: 12,
          padding: 24,
          textAlign: 'center',
        }}>
          {cards.length === 0
            ? 'カードライブラリを読み込んでください'
            : '条件に一致するカードがありません'}
        </div>
      )}
      {filtered.map(card => (
        <LibraryCardTile key={card.id} card={card} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript エラーがないか確認する**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 3: コミットする**

```bash
git add web/src/ui/deck/LibraryGrid.tsx && git commit -m "feat: LibraryGrid — カードライブラリグリッド（ドラッグ対応）"
```

---

## Task 8: `DeckGrid.tsx` — デッキグリッド

**Files:**
- Create: `web/src/ui/deck/DeckGrid.tsx`

### ドロップ受け取り・枚数制限・選択・トーストを実装する

- [ ] **Step 1: `web/src/ui/deck/DeckGrid.tsx` を作成する**

```typescript
import { useState } from 'react'
import { useLibraryStore } from '../../store/libraryStore'

/** 軽量インライントースト */
function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  function show(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(null), 2500)
  }
  return { msg, show }
}

interface Props {
  selectedCardId: string | null
  onSelect: (cardId: string | null) => void
}

export function DeckGrid({ selectedCardId, onSelect }: Props) {
  const { currentDeck, cards, resolveImageUrl, cardBackUrl, loadDeck } = useLibraryStore(s => ({
    currentDeck: s.currentDeck,
    cards: s.cards,
    resolveImageUrl: s.resolveImageUrl,
    cardBackUrl: s.cardBackUrl,
    loadDeck: s.loadDeck,
  }))
  const { msg: toastMsg, show: showToast } = useToast()
  const [isDragOver, setIsDragOver] = useState(false)

  const cardMap = new Map(cards.map(c => [c.id, c]))
  const totalCount = currentDeck.reduce((s, e) => s + e.count, 0)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const raw = e.dataTransfer.getData('text/plain')
    if (!raw) return
    let cardId: string
    try {
      const parsed = JSON.parse(raw)
      cardId = parsed.cardId
    } catch {
      return
    }
    addCard(cardId)
  }

  function addCard(cardId: string) {
    const existing = currentDeck.find(e => e.cardId === cardId)
    if (existing && existing.count >= 4) {
      showToast('同じカードは4枚まで')
      return
    }
    if (totalCount >= 40) {
      showToast('デッキは40枚まで')
      return
    }
    const next = existing
      ? currentDeck.map(e => e.cardId === cardId ? { ...e, count: e.count + 1 } : e)
      : [...currentDeck, { cardId, count: 1 }]
    loadDeck({ cards: next })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ドロップ領域 */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 8,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 80px)',
          gap: 8,
          alignContent: 'start',
          background: isDragOver ? 'rgba(0,255,255,0.04)' : 'transparent',
          border: isDragOver ? '2px dashed rgba(0,255,255,0.4)' : '2px dashed transparent',
          borderRadius: 8,
          transition: 'all 150ms',
          minHeight: 120,
        }}
      >
        {currentDeck.length === 0 && !isDragOver && (
          <div style={{
            gridColumn: '1 / -1',
            color: '#2a3550',
            fontFamily: "'Chakra Petch', sans-serif",
            fontSize: 12,
            padding: 24,
            textAlign: 'center',
          }}>
            ← 左からカードをドロップ
          </div>
        )}
        {currentDeck.map(entry => {
          const card = cardMap.get(entry.cardId)
          if (!card) return null
          const imgUrl = resolveImageUrl(card.image_path) || cardBackUrl
          const isSelected = entry.cardId === selectedCardId
          return (
            <div
              key={entry.cardId}
              onClick={() => onSelect(isSelected ? null : entry.cardId)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div style={{
                position: 'relative',
                width: 72,
                aspectRatio: '150/210',
                borderRadius: 4,
                overflow: 'visible',
                border: isSelected
                  ? '2px solid #00FFFF'
                  : '1px solid rgba(0,255,255,0.2)',
                background: '#0d1020',
                flexShrink: 0,
                boxShadow: isSelected ? '0 0 8px rgba(0,255,255,0.5)' : 'none',
              }}>
                <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: 3 }}>
                  {imgUrl ? (
                    <img src={imgUrl} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#1a1a2e' }} />
                  )}
                </div>
                {/* 枚数バッジ */}
                <div style={{
                  position: 'absolute',
                  bottom: -6,
                  right: -6,
                  background: '#0a0e1a',
                  border: '1px solid rgba(0,255,255,0.4)',
                  color: '#ffdd66',
                  fontSize: 9,
                  fontFamily: "'Press Start 2P', monospace",
                  padding: '1px 4px',
                  borderRadius: 3,
                  lineHeight: 1.4,
                }}>
                  ×{entry.count}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* +1 / -1 / 削除ボタン */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '8px',
        borderTop: '1px solid rgba(124,58,237,0.15)',
        flexShrink: 0,
      }}>
        {(['inc', 'dec', 'del'] as const).map(action => {
          const labels = { inc: '+1', dec: '-1', del: '削除' }
          const colors = {
            inc:  { bg: '#0c280c', fg: '#88dd88', border: '#285028' },
            dec:  { bg: '#1a1020', fg: '#ddaa88', border: '#503828' },
            del:  { bg: '#200c0c', fg: '#dd8888', border: '#502828' },
          }
          const { bg, fg, border } = colors[action]
          return (
            <button
              key={action}
              disabled={!selectedCardId}
              onClick={() => {
                if (!selectedCardId) return
                if (action === 'inc') addCard(selectedCardId)
                else if (action === 'dec') decCard(selectedCardId)
                else removeCard(selectedCardId)
              }}
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                padding: '6px 12px',
                borderRadius: 5,
                cursor: selectedCardId ? 'pointer' : 'not-allowed',
                background: selectedCardId ? bg : '#111',
                color: selectedCardId ? fg : '#333',
                border: `1px solid ${selectedCardId ? border : '#222'}`,
                transition: 'all 150ms',
                flex: 1,
              }}
            >
              {labels[action]}
            </button>
          )
        })}
      </div>

      {/* トースト */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a0a0a',
          border: '1px solid #cc3333',
          color: '#ff8888',
          padding: '8px 20px',
          borderRadius: 8,
          fontFamily: "'Chakra Petch', sans-serif",
          fontSize: 13,
          zIndex: 9000,
          pointerEvents: 'none',
          boxShadow: '0 0 20px rgba(255,0,0,0.2)',
        }}>
          {toastMsg}
        </div>
      )}
    </div>
  )

  function decCard(cardId: string) {
    const entry = currentDeck.find(e => e.cardId === cardId)
    if (!entry) return
    const next = entry.count > 1
      ? currentDeck.map(e => e.cardId === cardId ? { ...e, count: e.count - 1 } : e)
      : currentDeck.filter(e => e.cardId !== cardId)
    if (entry.count === 1) onSelect(null)
    loadDeck({ cards: next })
  }

  function removeCard(cardId: string) {
    const next = currentDeck.filter(e => e.cardId !== cardId)
    onSelect(null)
    loadDeck({ cards: next })
  }
}
```

- [ ] **Step 2: TypeScript エラーがないか確認する**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 3: コミットする**

```bash
git add web/src/ui/deck/DeckGrid.tsx && git commit -m "feat: DeckGrid — ドロップ受け取り・枚数操作・トースト"
```

---

## Task 9: `DeckPage.tsx` — ページ全体の組み合わせ

**Files:**
- Create: `web/src/ui/pages/DeckPage.tsx`
- Modify: `web/src/ui/hud/BoardHud.tsx`

### 全コンポーネントを組み合わせてページを完成させる

- [ ] **Step 1: `web/src/ui/pages/DeckPage.tsx` を作成する**

```typescript
import { useState, useEffect } from 'react'
import { DeckHud } from '../deck/DeckHud'
import { FilterBar, DEFAULT_FILTER, type FilterState } from '../deck/FilterBar'
import { LibraryGrid } from '../deck/LibraryGrid'
import { DeckGrid } from '../deck/DeckGrid'
import { SetupDialog } from '../overlays/SetupDialog'
import { useLibraryStore } from '../../store/libraryStore'

const CRT_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
  pointerEvents: 'none',
  zIndex: 9999,
}

export function DeckPage() {
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const { listDeckFiles, cards, openDialog } = useLibraryStore(s => ({
    listDeckFiles: s.listDeckFiles,
    cards: s.cards,
    openDialog: undefined,
  }))
  const openSetupDialog = useLibraryStore(s => s.dirHandle ? null : true)

  // カードライブラリが読み込まれたらデッキ一覧を更新
  useEffect(() => {
    listDeckFiles()
  }, [cards]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: '#0F0F23',
      overflow: 'hidden',
    }}>
      <div style={CRT_STYLE} />

      <DeckHud />

      {/* メインコンテンツ: 左(ライブラリ) + 右(デッキ) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 0 }}>

        {/* 左パネル */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(124,58,237,0.2)',
          overflow: 'hidden',
        }}>
          <FilterBar cards={useLibraryStore.getState().cards} filter={filter} onChange={setFilter} />
          <LibraryGrid filter={filter} />
        </div>

        {/* 右パネル */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '6px 12px',
            background: '#060810',
            borderBottom: '1px solid rgba(0,255,255,0.1)',
            fontFamily: "'VT323', monospace",
            color: '#00FFFF88',
            fontSize: 14,
            flexShrink: 0,
          }}>
            デッキ内容（ここへドロップ）
          </div>
          <DeckGrid selectedCardId={selectedCardId} onSelect={setSelectedCardId} />
        </div>
      </div>

      <SetupDialog />
    </div>
  )
}
```

- [ ] **Step 2: `FilterBar` の `cards` prop を `useLibraryStore` hook で渡すよう修正する**

上記コードの左パネル内 `FilterBar` が `useLibraryStore.getState()` を使っており、これはリアクティブではない。以下に修正：

```typescript
// DeckPage の先頭に追加
const allCards = useLibraryStore(s => s.cards)
```

そして `FilterBar` の `cards` prop を変更：
```typescript
<FilterBar cards={allCards} filter={filter} onChange={setFilter} />
```

また `openSetupDialog` の不要な宣言を削除し、`openDialog` も削除する。クリーンな最終形：

```typescript
import { useState, useEffect } from 'react'
import { DeckHud } from '../deck/DeckHud'
import { FilterBar, DEFAULT_FILTER, type FilterState } from '../deck/FilterBar'
import { LibraryGrid } from '../deck/LibraryGrid'
import { DeckGrid } from '../deck/DeckGrid'
import { SetupDialog } from '../overlays/SetupDialog'
import { useLibraryStore } from '../../store/libraryStore'

const CRT_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
  pointerEvents: 'none',
  zIndex: 9999,
}

export function DeckPage() {
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const listDeckFiles = useLibraryStore(s => s.listDeckFiles)
  const allCards = useLibraryStore(s => s.cards)

  useEffect(() => {
    listDeckFiles()
  }, [allCards]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: '#0F0F23',
      overflow: 'hidden',
    }}>
      <div style={CRT_STYLE} />
      <DeckHud />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左パネル */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(124,58,237,0.2)',
          overflow: 'hidden',
        }}>
          <FilterBar cards={allCards} filter={filter} onChange={setFilter} />
          <LibraryGrid filter={filter} />
        </div>
        {/* 右パネル */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '6px 12px',
            background: '#060810',
            borderBottom: '1px solid rgba(0,255,255,0.1)',
            fontFamily: "'VT323', monospace",
            color: '#00FFFF88',
            fontSize: 14,
            flexShrink: 0,
          }}>
            デッキ内容（ここへドロップ）
          </div>
          <DeckGrid selectedCardId={selectedCardId} onSelect={setSelectedCardId} />
        </div>
      </div>
      <SetupDialog />
    </div>
  )
}
```

- [ ] **Step 3: `BoardHud.tsx` に DECK ボタンを追加する**

`web/src/ui/hud/BoardHud.tsx` の `LOAD CARDS` ボタンの前に追加：

```typescript
      <a
        href="/deck.html"
        style={{
          ...btn,
          background: '#0c0c28',
          color: '#aa88dd',
          border: '1px solid #404080',
          textDecoration: 'none',
          display: 'inline-block',
          marginLeft: 'auto',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#141444')}
        onMouseLeave={e => (e.currentTarget.style.background = '#0c0c28')}
      >
        DECK
      </a>
```

`LOAD CARDS` ボタンの `marginLeft: 'auto'` を削除する。

- [ ] **Step 4: TypeScript エラーがないか確認する**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 5: dev サーバーで動作確認する**

```bash
cd web && npm run dev
```

以下を確認する：
1. `http://localhost:5173/deck.html` でデッキビルダーが表示される
2. `LOAD CARDS` でカードライブラリを読み込めば左パネルにカードが並ぶ
3. 左から右へドラッグ&ドロップでカードが追加される
4. +1/-1/削除ボタンが動作する
5. SAVE でデッキが `decks/` フォルダに保存される
6. ページリロード後に `前回のフォルダを復元` → デッキ選択ドロップダウンに保存済みデッキが現れる
7. `http://localhost:5173/index.html` の DECK ボタンでデッキビルダーに遷移できる

- [ ] **Step 6: コミットする**

```bash
git add web/src/ui/pages/DeckPage.tsx web/src/ui/hud/BoardHud.tsx && git commit -m "feat: DeckPage完成・BoardHudにDECKボタン追加"
```

---

## 自己レビュー チェックリスト

実装完了後、以下を確認する：

- [ ] `deckStorage.ts` の `DeckJson` 型が `libraryStore.ts` で import されて使われている
- [ ] `LoadedLibrary.dirHandle` が `imageCache.ts`・`SetupDialog.tsx`・`libraryStore.ts` で一貫して使われている
- [ ] Python版 deck.json（`id` フィールド）の読み込みが `readDeckFile` で正しく変換される
- [ ] ドロップ時の制限（4枚・40枚）が `DeckGrid` で機能している
- [ ] `activeDeckName` が存在しないこと（`deckName` に統一されている）
- [ ] `deckFiles` が `loadLibrary` 後に `useEffect` 経由で更新される（`DeckPage`）
- [ ] TypeScript エラーが 0 件
