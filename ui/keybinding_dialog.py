from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QKeySequence
from PyQt6.QtWidgets import (
    QDialog,
    QDialogButtonBox,
    QFrame,
    QGridLayout,
    QLabel,
    QPushButton,
    QVBoxLayout,
)

from . import keybindings as kb

_STYLE = """
    QDialog, QWidget { background: #1a1a2e; color: #ddd; }
    QLabel { color: #ddd; }
    QPushButton {
        background: #3a3a6a; color: #ddd; border: 1px solid #555;
        border-radius: 3px; padding: 4px 12px;
    }
    QPushButton:hover { background: #4a4a8a; }
    QPushButton:disabled { background: #2a2a3a; color: #666; }
"""

_BTN_WAITING_STYLE = (
    "QPushButton { background: #2a4a2a; color: #7f7; "
    "border: 1px solid #4f4; border-radius: 3px; padding: 4px 12px; }"
)


class _KeyCaptureButton(QPushButton):
    """クリックすると次のキー入力を取り込むボタン。"""

    key_captured = pyqtSignal(str)

    def __init__(self, key: str, parent=None):
        super().__init__(key or "（未設定）", parent)
        self._current = key
        self._waiting = False
        self.setFocusPolicy(Qt.FocusPolicy.StrongFocus)
        self.setMinimumWidth(90)
        self.clicked.connect(self._start_capture)

    def _start_capture(self):
        self._waiting = True
        self.setText("キー入力待ち…")
        self.setStyleSheet(_BTN_WAITING_STYLE)

    def keyPressEvent(self, event):
        if not self._waiting:
            super().keyPressEvent(event)
            return
        if event.key() == Qt.Key.Key_Escape:
            self._cancel()
            return
        ks = QKeySequence(event.key()).toString()
        if ks:
            self._current = ks
            self._waiting = False
            self.setText(ks)
            self.setStyleSheet("")
            self.key_captured.emit(ks)

    def _reset_ui(self, key: str):
        self._waiting = False
        self.setText(key or "（未設定）")
        self.setStyleSheet("")

    def _cancel(self):
        self._reset_ui(self._current)

    def reset_to(self, key: str):
        self._current = key
        self._reset_ui(key)


class KeybindingDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("キーバインド設定")
        self.setStyleSheet(_STYLE)
        self.setMinimumWidth(380)
        self._pending: dict[str, str] = {}
        self._setup_ui()

    def _setup_ui(self):
        root = QVBoxLayout(self)
        root.setSpacing(12)

        # ヘッダー
        title = QLabel("ホバー中のカードに適用するショートカット")
        title.setStyleSheet("color: #aaa; font-size: 11px;")
        root.addWidget(title)

        # セパレーター
        sep = QFrame()
        sep.setFrameShape(QFrame.Shape.HLine)
        sep.setStyleSheet("color: #444;")
        root.addWidget(sep)

        # アクション一覧グリッド
        grid = QGridLayout()
        grid.setColumnStretch(0, 1)
        grid.setHorizontalSpacing(10)
        grid.setVerticalSpacing(8)

        for col, text in enumerate(["アクション", "キー", "既定に戻す"]):
            lbl = QLabel(text)
            lbl.setStyleSheet("color: #888; font-size: 10px;")
            grid.addWidget(lbl, 0, col)

        self._capture_btns: dict[str, _KeyCaptureButton] = {}

        for row, (action_id, (label, default)) in enumerate(kb.ACTIONS.items(), start=1):
            grid.addWidget(QLabel(label), row, 0)

            btn = _KeyCaptureButton(kb.get(action_id))
            btn.key_captured.connect(
                lambda k, aid=action_id: self._pending.__setitem__(aid, k)
            )
            grid.addWidget(btn, row, 1)
            self._capture_btns[action_id] = btn

            reset_btn = QPushButton("↩")
            reset_btn.setFixedWidth(36)
            reset_btn.setToolTip(f"既定値「{default}」に戻す")
            reset_btn.clicked.connect(
                lambda _, aid=action_id, b=btn, d=default: self._reset_one(aid, b, d)
            )
            grid.addWidget(reset_btn, row, 2)

        root.addLayout(grid)

        # ヒント
        hint = QLabel("ボタンをクリックしてキーを押してください。Esc でキャンセル。")
        hint.setStyleSheet("color: #666; font-size: 10px;")
        root.addWidget(hint)

        sep2 = QFrame()
        sep2.setFrameShape(QFrame.Shape.HLine)
        sep2.setStyleSheet("color: #444;")
        root.addWidget(sep2)

        # 保存/キャンセル
        box = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Save |
            QDialogButtonBox.StandardButton.Cancel
        )
        box.accepted.connect(self._save)
        box.rejected.connect(self.reject)
        box.button(QDialogButtonBox.StandardButton.Save).setText("保存")
        box.button(QDialogButtonBox.StandardButton.Cancel).setText("キャンセル")
        root.addWidget(box)

    def _reset_one(self, action_id: str, btn: _KeyCaptureButton, default: str):
        btn.reset_to(default)
        self._pending[action_id] = default

    def _save(self):
        for action_id, key in self._pending.items():
            kb.set_key(action_id, key)
        kb.save()
        self.accept()
