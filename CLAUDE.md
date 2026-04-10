# dmapp — Claude 向けプロジェクト概要

## プロジェクト概要

デュエルマスターズ非公式カードゲームシミュレーター。
Python + PyQt6 製。2 ウィンドウ構成（フィールド公開用 + 手札非公開用）。

## 技術スタック

- Python 3.12
- PyQt6（カスタム QPainter 描画）
- PyInstaller `--onedir --windowed`（Windows / macOS）
- GitHub Actions でタグ push 時に自動ビルド・リリース

## ディレクトリ構成

```
dmapp/
├── main.py                  # エントリポイント
├── models/
│   ├── card.py              # Card / LibraryCard dataclass
│   ├── card_library.py      # CardLibrary シングルトン, card_sort_key
│   ├── deck.py              # Deck（load/save）
│   └── game_state.py        # GameState シングルトン, ZoneType, GameCard, Zone
├── ui/
│   ├── signals.py           # GameSignals（zones_updated, action_logged）
│   ├── constants.py         # CARD_W/H, MIME_TYPE, CARD_BACK_PATH 等
│   ├── zone_widget.py       # ZoneWidget（QPainter描画, D&D, ホバーズーム）
│   ├── board_window.py      # BoardWindow（フィールド公開ウィンドウ）
│   ├── hand_window.py       # HandWindow（手札/保留/デッキ一覧 非公開ウィンドウ）
│   ├── action_log_widget.py # アクションログパネル
│   ├── deck_manager.py      # デッキ編集ダイアログ
│   ├── deck_list_widget.py  # デッキカード一覧ウィジェット
│   ├── search_dialog.py     # 山札サーチダイアログ
│   ├── dice_dialog.py       # ダイスダイアログ
│   ├── card_zoom.py         # ホバーズームウィンドウ
│   ├── expand_dialog.py     # ゾーン展開ダイアログ
│   └── stack_dialog.py      # 重なりカード選択ダイアログ
└── data/                    # ユーザーデータ（.gitignore 対象）
    ├── cards.json           # カードライブラリ
    ├── cards/               # カード画像
    ├── decks/               # デッキ JSON
    ├── saves/               # セーブデータ
    ├── back.jpg             # カード裏面画像
    └── config.json          # 最後に使用したデッキパスなど
```

## アーキテクチャ

### GameState（シングルトン）

`GameState.get_instance()` で取得。全ゾーンを `Dict[ZoneType, Zone]` で管理。

```python
class ZoneType(Enum):
    BATTLE    = "battle"   # バトルゾーン（公開）
    SHIELD    = "shield"   # シールド（非公開）
    DECK      = "deck"     # 山札（非公開）
    GRAVEYARD = "graveyard"# 墓地（公開）
    MANA      = "mana"     # マナゾーン（公開）
    HAND      = "hand"     # 手札（非公開）
    TEMP      = "temp"     # 保留ゾーン（非公開・HandWindow専用）
```

アンドゥは `push_snapshot()` → `undo()` の deque（最大50件）。

### Qt シグナル

`ui/signals.py` に `game_signals` シングルトン。

| シグナル | 用途 |
|---|---|
| `zones_updated` | ゾーン変更後に全 ZoneWidget を再描画 |
| `action_logged(str)` | アクションログにエントリを追加 |

操作後は必ず両方を emit すること（ログが必要な場合）。

### ZoneWidget

`ui/zone_widget.py`。QPainter でカードを描画するカスタム QFrame。

主なコンストラクタ引数:
- `pile_mode=True` → 山札表示（枚数のみ）
- `mask_cards=True` → 常に裏面表示（BoardWindow の公開手札欄）
- `card_scale=float` → カードサイズ倍率（バトルゾーンは 1.2）

**非公開ゾーン** (`_HIDDEN_ZONES`):
```python
_HIDDEN_ZONES = (ZoneType.HAND, ZoneType.SHIELD, ZoneType.DECK, ZoneType.TEMP)
```

### プライバシー判定（アクションログ）

カード名をログに出すか伏せるかの判定ロジック（`zone_widget.py: _is_log_private`）:

1. **移動先**が `_HIDDEN_ZONES` → 非公開
2. **移動元**が `TEMP` → 非公開
3. **移動元**が `deck_list`（デッキ一覧からドロップ）→ 公開
4. それ以外 → `gc.face_down` フラグで判定

ログが非公開の場合は「?」と表示。

### ホバーズーム

`ZoneWidget` でカード上にマウスを 1200ms 静止すると `card_zoom.py` のズームウィンドウが開く。

### MIME ドラッグ＆ドロップ

`MIME_TYPE = "application/x-dmapp-card"` で JSON をやり取り。

単体ドラッグ: `{"src": zone_type_value, "index": int, ...}`
複数ドラッグ（Shift+クリック選択後）: `{"src": ..., "card_ids": [id, ...], ...}`

## データファイル（gitignore 対象）

以下はリポジトリに含まれない。ユーザーが自分で用意する:
- `data/cards.json` — カードライブラリ
- `data/cards/` — カード画像（`.jpg` / `.webp`）
- `data/back.jpg` — カード裏面画像
- `data/decks/*.json` — デッキ定義
- `data/saves/*.json` — セーブデータ
- `data/config.json` — 起動設定

`data/saves/.gitkeep` のみリポジトリに含まれる（空ディレクトリ保持用）。

## ビルド・リリース

```bash
# ローカルビルド（Windows）
pip install pyinstaller -r requirements.txt
pyinstaller --onedir --windowed --name dmapp main.py

# リリース（GitHub Actions）
git tag v0.x.x && git push origin v0.x.x
```

GitHub Actions（`.github/workflows/build.yml`）がタグ push で自動起動:
- `build-windows`（windows-latest）→ `dmapp-vX.X.X-windows.zip`
- `build-macos`（macos-latest）→ `dmapp-vX.X.X-macos.zip`
- 両方を同じ GitHub Release にアップロード

macOS では `dist/dmapp.app/Contents/MacOS/data/` にデータを配置する。

## 実装方針

- `GameState` への変更前に必ず `push_snapshot()` を呼ぶ（アンドゥ対応）
- ゾーン変更後は `game_signals.zones_updated.emit()` を必ず呼ぶ
- アクションログは `game_signals.action_logged.emit("説明文")` で追加
- `data/` 以下のパスは `main.py` で `os.chdir()` しているため相対パスで書いてよい
- PyInstaller frozen 時は `sys.executable` の親ディレクトリが作業ディレクトリになる
