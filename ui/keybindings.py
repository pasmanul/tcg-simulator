"""キーバインド設定の読み書きモジュール。"""
import json
import os

_CONFIG_PATH = "data/config.json"

# action_id -> (表示ラベル, デフォルトキー文字列)
ACTIONS: dict[str, tuple[str, str]] = {
    "move_battle":    ("バトルゾーンへ移動", "B"),
    "move_mana":      ("マナゾーンへ移動",   "M"),
    "move_graveyard": ("墓地へ移動",         "G"),
    "move_hand":      ("手札へ移動",         "H"),
    "move_shield":    ("シールドへ移動",     "S"),
    "draw":           ("ドロー",             "D"),
    "game_reset":     ("ゲームリセット",     "R"),
}

_overrides: dict[str, str] = {}


def load():
    global _overrides
    try:
        with open(_CONFIG_PATH, encoding="utf-8") as f:
            _overrides = json.load(f).get("keybindings", {})
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        _overrides = {}


def save():
    try:
        with open(_CONFIG_PATH, encoding="utf-8") as f:
            cfg = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        cfg = {}
    cfg["keybindings"] = _overrides
    os.makedirs(os.path.dirname(os.path.abspath(_CONFIG_PATH)), exist_ok=True)
    with open(_CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)


def get(action_id: str) -> str:
    """現在のキー文字列を返す（上書きがなければデフォルト）。"""
    return _overrides.get(action_id, ACTIONS[action_id][1])


def set_key(action_id: str, key: str):
    _overrides[action_id] = key


load()
