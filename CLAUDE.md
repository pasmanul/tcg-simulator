# tcg-simulator — Claude 向けプロジェクト概要

## プロジェクト概要

汎用カードゲームシミュレーター（旧称: dmapp）。
Python + PyQt6（デスクトップ版）と React + Vite + Konva（Web 版）の 2 実装がある。
Web 版は 1 ゲーム = 1 JSON（GameProfile）のサンドボックス設計。

詳細な構成・設計・実装ルールは `docs/project-guide.md` を参照。

## エージェント向け基本方針

- 作業前に関連ファイルを読み、既存の設計・命名・実装パターンに合わせる
- 変更は依頼範囲に絞る。不要なリファクタ・メタデータ更新は行わない
- 既存の未コミット変更はユーザーの作業として扱い、明示依頼なしに戻さない
- 実装後はテスト・型チェック・ビルド等で検証する
- コミットメッセージは日本語で簡潔に

## デスクトップ版 — クイックリファレンス

- `GameState` 変更前に `push_snapshot()` を呼ぶ（アンドゥ対応）
- ゾーン変更後は `game_signals.zones_updated.emit()` を呼ぶ
- アクションログは `game_signals.action_logged.emit("...")` で追加
- 非公開判定: `ZoneDefinition.visibility == "private"`

## Web 版 — クイックリファレンス

- `domain/gameLogic.ts` の関数はすべて純粋関数（`zones` を受け取り新 `zones` を返す）
- アクション実行前に `gameStore` 側でアンドゥ snapshot を積む
- 全ダイアログは `BoardPage` に常時マウント、`if (activeDialog !== 'xxx') return null` で自己非表示
- `cloneZones` を使ってイミュータブルに更新する

```bash
cd web && npm run dev   # 開発サーバー
npx tsc --noEmit        # 型チェック
```
