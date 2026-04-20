# TCG Simulator サンドボックス化 設計仕様

## Context

特定ゲーム（DM）への依存を排除し、汎用カードゲームシミュレーターに再設計する。
著作権問題を回避しつつ、ユーザーが任意のTCGを自由に登録・プレイできる。

対象: `web/` のみ（Python版は対象外）

---

## 設計方針

- 完全再設計（B案）: 全型を汎用型に置き換え
- 1ゲーム = 1 JSON ファイル（GameProfile）
- 起動時にファイルピッカーでJSONをロード
- カード属性はフリーフォーム（FieldDef[]で定義）
- デッキルールはすべてoptional
- ボードレイアウトはGUIエディタで編集

---

## 1. GameProfile JSON 構造

```typescript
interface GameProfile {
  meta: { name: string; version?: string }
  fieldDefs: FieldDef[]
  deckRules?: { maxDeckSize?: number; maxCopies?: number }
  boardConfig: GameConfigJson   // 既存 windows[] + zones[]
  pool: Card[]
  decks: DeckRecord[]
}

interface FieldDef {
  id: string
  label: string
  type: 'text' | 'number' | 'select' | 'multi-select'
  options?: string[]      // select / multi-select のみ
  default?: any
  sortable?: boolean      // FilterBar ソートキーに使用
  filterable?: boolean    // FilterBar フィルタに表示
}

// Card型（汎用化）
interface Card {
  id: string
  name: string
  image_data?: string
  count: number
  fields: Record<string, any>   // FieldDef.id をキー
}
```

### 例：デュエルマスターズ

```json
{
  "meta": { "name": "デュエルマスターズ" },
  "fieldDefs": [
    { "id": "mana", "label": "マナ", "type": "number", "sortable": true, "filterable": true },
    { "id": "civ",  "label": "文明", "type": "multi-select", "options": ["光","水","闇","火","自然","無色"], "filterable": true },
    { "id": "type", "label": "種類", "type": "select", "options": ["クリーチャー","呪文",...], "filterable": true }
  ],
  "deckRules": { "maxDeckSize": 40, "maxCopies": 4 },
  "boardConfig": { "windows": [...], "zones": [...] },
  "pool": [{ "id": "uuid", "name": "ボルメテウス", "fields": { "mana": 8, "civ": ["火"], "type": "クリーチャー" } }],
  "decks": [{ "name": "赤白速攻", "cards": [{ "cardId": "uuid", "count": 4 }] }]
}
```

---

## 2. 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `domain/types.ts` | Card型汎用化、FieldDef・GameProfile追加 |
| `domain/gameLogic.ts` | `cardSortKey` を FieldDef ベースに汎用化 |
| `store/libraryStore.ts` | `fieldDefs / deckRules / boardConfig` を追加管理。JSONロード/エクスポート対応 |
| `store/layoutStore.ts` | boardConfig を GameProfile から取得するよう変更 |
| `ui/deck/FilterBar.tsx` | `filterable:true` の FieldDef から動的生成 |
| `ui/overlays/CardEditorDialog.tsx` | FieldDef から動的フォームを生成（型別入力コンポーネント） |
| `ui/overlays/SetupDialog.tsx` | GameLoadDialog に変更（ファイルピッカーで JSON をロード） |
| `ui/pages/DeckPage.tsx` | ロード/エクスポートUI追加 |

---

## 3. 新規ファイル

### GameSetupWizard.tsx（3ステップ）

- ステップ①: ゲーム名・デッキルール（optional）
- ステップ②: FieldDef 登録（行: id / 型 / options / sortable / filterable）
- ステップ③: ボードエディタ（後述）

### BoardEditorDialog.tsx

- 左パネル: ゾーン一覧（public=青●、private=紫◆）+ ゾーン追加ボタン
- 右上: グリッドプレビュー（配置を色分け表示）
- 右下: ゾーン設定パネル
  - フィールド: id / 表示名 / col / row / col_span / row_span / 公開設定 / tappable / pile_mode / two_row / masked
  - GridPos は 4 つの数値入力（col, row, col_span, row_span）

---

## 4. 実装順序

1. **型定義** — `domain/types.ts` に FieldDef / GameProfile 追加、Card 型変更
2. **gameLogic 汎用化** — `cardSortKey` を FieldDef ベースに
3. **libraryStore 改修** — GameProfile の load / save / export
4. **layoutStore 改修** — boardConfig を GameProfile から取得
5. **FilterBar 動的化** — FieldDef ベースで filter / sort を生成
6. **CardEditorDialog 動的化** — FieldDef ベースの動的フォーム
7. **GameLoadDialog** — 既存 SetupDialog を置き換え
8. **GameSetupWizard** — 新規ゲーム作成ウィザード（3ステップ）
9. **BoardEditorDialog** — ゾーン GUI エディタ
10. **DeckPage 統合** — ロード/エクスポートUI

---

## 5. 検証方法

1. `npm run dev` で起動、新規ゲーム作成ウィザードを完走できること
2. 既存DMプロファイルを JSON で作成してロード、ゲームが正常に動作すること
3. 遊戯王プロファイル（ATK/DEF/レベル/属性）を作成し、CardEditorDialog で属性入力できること
4. ボードエディタでゾーンを追加・移動し、プレビューに反映されること
5. `npx tsc --noEmit` でエラーなし
