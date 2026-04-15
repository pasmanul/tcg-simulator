# デッキビルダー設計書

**日付:** 2026-04-16  
**対象:** tcg-simulator web フロントエンド  

---

## 概要

`deck.html` として独立したデッキ管理ページを追加する。  
カードライブラリ（左）からデッキ（右）へサムネイルのドラッグ&ドロップでカードを追加し、デッキを編集・保存できる。  
デッキファイルは File System Access API（readwrite モード）でカードフォルダ内の `decks/` サブフォルダに直接保存する。すべてクライアントサイドで完結し、サーバーは不要。

---

## アーキテクチャ

### 新規ページ

既存の `board.html` / `hand.html` と同等の独立ページとして追加。

```
web/
├── deck.html               ← 新規 HTML エントリポイント
└── src/
    ├── deck.tsx            ← 新規 React エントリポイント
    ├── ui/pages/
    │   └── DeckPage.tsx    ← 新規 ページコンポーネント
    ├── ui/deck/
    │   ├── DeckHud.tsx     ← HUD（デッキ名・枚数・SAVE・ページ遷移）
    │   ├── FilterBar.tsx   ← 絞り込みバー（検索・マナ・文明・タイプ・ソート）
    │   ├── LibraryGrid.tsx ← カードライブラリグリッド（ドラッグ元）
    │   └── DeckGrid.tsx    ← デッキグリッド（ドロップ先）
    └── lib/
        └── deckStorage.ts  ← decks/ フォルダへの読み書きロジック
```

### 状態管理

`libraryStore` を拡張して以下を追加する（新ストアは作らない）：

```typescript
// 追加フィールド
activeDeckName: string                             // 編集中のデッキ名
deckFiles: string[]                                // decks/ フォルダ内のファイル名一覧
dirHandle: FileSystemDirectoryHandle | null        // readwrite フォルダハンドル

// 追加アクション
setActiveDeckName(name: string): void
loadDeckFile(filename: string): Promise<void>
saveDeckFile(): Promise<void>
listDeckFiles(): Promise<void>
```

`currentDeck: DeckEntry[]` と `deckName: string` は既存フィールドを流用。

**dirHandle の受け渡し:** `imageCache.ts` の `pickAndLoadLibrary()` / `restoreLibrary()` が返す `LoadedLibrary` に `dirHandle` フィールドを追加し、`loadLibrary()` 呼び出し時に store へ保存する。

---

## コンポーネント設計

### DeckPage レイアウト

```
┌─────────────────────────────────────────────────────────┐
│ DeckHud                                                   │
│  [デッキ選択▼]  [デッキ名入力]  [XX/40枚]  [SAVE]  [BOARD]│
├────────────────────────┬────────────────────────────────┤
│ FilterBar (左上)        │                                │
│  [検索] [ソート▼]       │ DeckGrid                       │
│  [マナ▼] [文明▼] [タイプ▼]│  - サムネイルグリッド            │
│                        │  - ×枚バッジ（右下角）           │
│ LibraryGrid            │  - クリックで選択               │
│  - サムネイルグリッド   │                                │
│  - マナ数・文明ドット    │ [+1] [-1] [削除]               │
│  - ドラッグ可           │                                │
└────────────────────────┴────────────────────────────────┘
```

### LibraryGrid

- `libraryStore.cards` を表示
- FilterBar の状態でリアルタイムフィルタリング
- HTML5 ドラッグ開始: `dragstart` → `dataTransfer.setData('text/plain', JSON.stringify({ cardId }))`
- カードタイル: サムネイル画像 + カード名（下） + マナ数 + 文明カラードット

### DeckGrid

- `libraryStore.currentDeck` を表示
- `dragover` + `drop` イベントでカードを受け取る
- ドロップ時: 同カードが既に4枚 or 合計40枚超で追加拒否（エラートースト表示）
- カードタイル: サムネイル画像 + ×枚バッジ（右下角）
- クリックで選択状態 → +1 / -1 / 削除ボタンが有効化

### DeckHud

- デッキ選択ドロップダウン（`deckFiles` から生成）+ 「新規」ボタン
- デッキ名テキスト入力
- 枚数カウンター（XX / 40）、40枚超で赤表示
- SAVE ボタン → `deckStorage.saveDeckFile()` 呼び出し
- BOARD リンク → `index.html` へ遷移

---

## File System Access API（readwrite）

### フォルダ権限の変更

`imageCache.ts` の `showDirectoryPicker` を `{ mode: 'readwrite' }` に変更。  
既存の IndexedDB ハンドル保存ロジックはそのまま流用。

### deckStorage.ts

```typescript
// decks/ サブフォルダを取得または作成
async function getDecksDir(dirHandle): Promise<FileSystemDirectoryHandle>

// decks/ 内の *.json ファイル名一覧を返す
export async function listDeckFiles(dirHandle): Promise<string[]>

// ファイル名を指定してデッキ JSON を読み込む
export async function readDeckFile(dirHandle, filename): Promise<DeckJson>

// デッキ JSON を filename.json として書き込む
export async function writeDeckFile(dirHandle, filename, deck): Promise<void>
```

### デッキ JSON フォーマット（保存形式）

```json
{
  "name": "デッキ名",
  "cards": [
    { "cardId": "uuid", "count": 4 }
  ]
}
```

### Python版 deck.json 互換

読み込み時に以下のフォールバック処理を行う：
- エントリに `cardId` フィールドがなく `id` フィールドがある場合、`id` を `cardId` として扱う
- `image_path`・`name`・`back_image_path` フィールドは無視する

---

## FilterBar の絞り込み仕様

| フィルター | 種類 | 選択肢 |
|-----------|------|--------|
| カード名検索 | テキスト入力 | — |
| ソート | ドロップダウン | マナ↑ / マナ↓ / 名前順 / タイプ順 |
| マナ | ドロップダウン | すべて / 1〜11 / 12+ |
| 文明 | ドロップダウン | すべて / 光 / 水 / 闇 / 火 / 自然 / 無色 |
| タイプ | ドロップダウン | すべて + ロード済みカードから動的収集 |

文明・タイプの選択肢はロード済みの `cards` 配列から重複排除して動的生成（固定リストに依存しない）。

---

## デッキ操作ルール

| 操作 | 条件 |
|------|------|
| カード追加（ドロップ） | 同カード ≤ 4枚 かつ 合計 ≤ 40枚 |
| +1 ボタン | 同カード ≤ 4枚 かつ 合計 ≤ 40枚 |
| -1 ボタン | count > 1 なら count-- / count = 1 ならカード削除 |
| 削除ボタン | 選択中のカードをデッキから除去 |

違反時はトースト通知（軽量インライン実装、外部ライブラリ不使用）。

---

## vite.config.ts の変更

`deck.html` を追加エントリポイントとして登録する（既存の `index.html` / `hand.html` と同様）。

---

## スコープ外（今回は実装しない）

- カードライブラリへのカード追加・編集（Python版のカードフォーム相当）
- デッキの削除・名前変更
- デッキのエクスポート（JSON ダウンロード）
- アニメーション・トランジション
- モバイル対応
