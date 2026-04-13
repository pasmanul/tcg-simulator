import json

from PyQt6.QtCore import QMimeData, QPoint, Qt
from PyQt6.QtGui import QColor, QDrag, QPixmap
from PyQt6.QtWidgets import (
    QDialog,
    QHBoxLayout,
    QLabel,
    QMenu,
    QPushButton,
    QScrollArea,
    QVBoxLayout,
    QWidget,
)

from models.game_state import GameCard, GameState, ZoneType

from .constants import CARD_BACK_PATH, CARD_H, CARD_W, MIME_TYPE
from .signals import game_signals


class _CardLabel(QLabel):
    def __init__(self, gc: GameCard, index: int, zone_type: ZoneType, on_remove=None, parent=None):
        super().__init__(parent)
        self.gc = gc
        self.index = index
        self.zone_type = zone_type
        self._on_remove = on_remove
        self.setFixedSize(CARD_W, CARD_H)
        self.setToolTip(gc.card.name)
        self._refresh()

    def _refresh(self):
        if self.gc.face_down:
            pix = QPixmap(CARD_BACK_PATH)
            if pix.isNull():
                pix = QPixmap(CARD_W, CARD_H)
                pix.fill(QColor(20, 20, 140))
        else:
            pix = QPixmap(self.gc.card.image_path)
            if pix.isNull():
                pix = QPixmap(CARD_W, CARD_H)
                pix.fill(QColor(70, 70, 70))
            pix = pix.scaled(
                CARD_W, CARD_H,
                Qt.AspectRatioMode.IgnoreAspectRatio,
                Qt.TransformationMode.SmoothTransformation,
            )
        self.setPixmap(pix)

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.RightButton:
            menu = QMenu(self)
            tap_text = "アンタップ" if self.gc.tapped else "タップ"
            menu.addAction(tap_text, self._toggle_tap)
            face_text = "表向きにする" if self.gc.face_down else "裏向きにする"
            menu.addAction(face_text, self._toggle_face)
            menu.addSeparator()
            menu.addAction("削除", self._remove)
            menu.exec(event.globalPosition().toPoint())

    def mouseMoveEvent(self, event):
        if not (event.buttons() & Qt.MouseButton.LeftButton):
            return
        drag = QDrag(self)
        mime = QMimeData()
        payload = json.dumps({
            "source_zone": self.zone_type.value,
            "card_index": self.index,
            "card_id": self.gc.card.id,
            "card_name": self.gc.card.name,
            "image_path": self.gc.card.image_path,
        })
        mime.setData(MIME_TYPE, payload.encode())
        drag.setMimeData(mime)
        if self.pixmap():
            drag.setPixmap(self.pixmap())
        drag.exec(Qt.DropAction.MoveAction)

    def _toggle_tap(self):
        GameState.get_instance().push_snapshot()
        self.gc.tapped = not self.gc.tapped
        game_signals.zones_updated.emit()

    def _toggle_face(self):
        GameState.get_instance().push_snapshot()
        self.gc.face_down = not self.gc.face_down
        self._refresh()
        game_signals.zones_updated.emit()

    def _remove(self):
        gs = GameState.get_instance()
        gs.push_snapshot()
        gs.zones[self.zone_type].remove_card(self.index)
        game_signals.zones_updated.emit()
        if self._on_remove:
            self._on_remove()


class ExpandDialog(QDialog):
    def __init__(self, zone_type: ZoneType, label: str, parent=None):
        super().__init__(parent)
        self.zone_type = zone_type
        self.setWindowTitle(f"{label} — カード一覧")
        self.resize(600, 180)

        layout = QVBoxLayout(self)

        self._scroll = QScrollArea()
        self._scroll.setWidgetResizable(True)
        self._scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        layout.addWidget(self._scroll)

        close_btn = QPushButton("閉じる")
        close_btn.clicked.connect(self.accept)
        layout.addWidget(close_btn)

        self._rebuild()

    def _rebuild(self):
        container = QWidget()
        row = QHBoxLayout(container)
        row.setAlignment(Qt.AlignmentFlag.AlignLeft)
        row.setSpacing(6)

        zone = GameState.get_instance().zones[self.zone_type]
        for i, gc in enumerate(zone.cards):
            lbl = _CardLabel(gc, i, self.zone_type, on_remove=self._rebuild)
            row.addWidget(lbl)

        self._scroll.setWidget(container)
