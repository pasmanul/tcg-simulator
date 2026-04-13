"""Internal widget classes used by DeckManagerDialog."""
import re

from PyQt6.QtCore import Qt, QMimeData
from PyQt6.QtGui import QColor, QDrag, QFont, QPixmap
from PyQt6.QtWidgets import (
    QComboBox,
    QFrame,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QScrollArea,
    QVBoxLayout,
    QWidget,
)

from models.card import Card
from models.card_library import (
    CARD_TYPE_COLORS,
    CARD_TYPES,
    CIVILIZATIONS,
    CIV_COLORS,
    CardLibrary,
    LibraryCard,
)
from models.deck import Deck

# ── Shared constants ────────────────────────────────────────────────────────

DECK_THUMB_W, DECK_THUMB_H = 110, 154
LIB_THUMB_W, LIB_THUMB_H = 110, 154

CARD_MIME = "application/x-library-card-id"

_SORT_OPTIONS = ["マナ↑", "マナ↓", "名前順", "タイプ順"]

DIALOG_STYLE = """
    QDialog, QWidget, QSplitter { background-color: #1a1a2e; color: #ddd; }
    QLineEdit, QSpinBox, QComboBox {
        background: #2a2a4a; color: #ddd; border: 1px solid #555;
        padding: 2px 4px;
    }
    QPushButton {
        background: #3a3a6a; color: #ddd; border: 1px solid #555;
        border-radius: 3px; padding: 2px 8px;
    }
    QPushButton:hover { background: #4a4a8a; }
    QListWidget { background: #2a2a4a; color: #ddd; border: 1px solid #555; }
    QListWidget::item:selected { background: #4a4a8a; }
    QScrollArea { background: #1a1a2e; border: none; }
    QLabel { color: #ddd; }
    QCheckBox { color: #ddd; }
"""

# ── Utilities ───────────────────────────────────────────────────────────────


def apply_sort(cards: list, option: str) -> list:
    if option == "マナ↑":
        return sorted(cards, key=lambda c: (c.mana, c.name))
    if option == "マナ↓":
        return sorted(cards, key=lambda c: (-c.mana, c.name))
    if option == "タイプ順":
        return sorted(cards, key=lambda c: (c.card_type, c.mana, c.name))
    return sorted(cards, key=lambda c: c.name)  # 名前順


def sanitize_filename(name: str) -> str:
    return re.sub(r'[\\/:*?"<>|\x00-\x1f]', '_', name).strip()


def _is_rainbow(civs: list[str]) -> bool:
    return sum(1 for c in civs if c != "無色") >= 2


# ── Widgets ─────────────────────────────────────────────────────────────────

class _CivDots(QWidget):
    """文明ドット表示ウィジェット（マウスイベント透過）。"""
    DOT = 10

    def __init__(self, civs: list[str], parent=None):
        super().__init__(parent)
        self.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
        self.setStyleSheet("background: transparent;")
        row = QHBoxLayout(self)
        row.setContentsMargins(0, 0, 0, 0)
        row.setSpacing(3)
        row.setAlignment(Qt.AlignmentFlag.AlignHCenter)
        for civ in civs:
            dot = QLabel()
            dot.setFixedSize(self.DOT, self.DOT)
            color = CIV_COLORS.get(civ, "#888")
            dot.setStyleSheet(
                f"background: {color}; border-radius: {self.DOT // 2}px; border: none;"
            )
            dot.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
            row.addWidget(dot)
        if _is_rainbow(civs):
            rb = QLabel("R")
            rb.setFont(QFont("Arial", 7, QFont.Weight.Bold))
            rb.setStyleSheet("color: #ffffff; border: none;")
            rb.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
            row.addWidget(rb)


class _LibraryCardTile(QFrame):
    """カードライブラリの1枚タイル（ドラッグ可能）。"""

    def __init__(self, card: LibraryCard, on_click=None, parent=None):
        super().__init__(parent)
        self.card = card
        self._on_click = on_click
        self._drag_start = None
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self._set_normal_style()

        layout = QVBoxLayout(self)
        layout.setContentsMargins(3, 3, 3, 3)
        layout.setSpacing(2)
        layout.setAlignment(Qt.AlignmentFlag.AlignHCenter)

        thumb = QLabel()
        thumb.setFixedSize(LIB_THUMB_W, LIB_THUMB_H)
        thumb.setAlignment(Qt.AlignmentFlag.AlignCenter)
        thumb.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
        pix = QPixmap(card.image_path)
        if not pix.isNull():
            pix = pix.scaled(
                LIB_THUMB_W, LIB_THUMB_H,
                Qt.AspectRatioMode.IgnoreAspectRatio,
                Qt.TransformationMode.SmoothTransformation,
            )
        else:
            pix = QPixmap(LIB_THUMB_W, LIB_THUMB_H)
            pix.fill(QColor(70, 70, 70))
        thumb.setPixmap(pix)
        layout.addWidget(thumb, 0, Qt.AlignmentFlag.AlignHCenter)

        name_lbl = QLabel(card.name)
        name_lbl.setFont(QFont("Arial", 7))
        name_lbl.setStyleSheet("color: #ddd; border: none;")
        name_lbl.setWordWrap(True)
        name_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        name_lbl.setMaximumWidth(LIB_THUMB_W + 4)
        name_lbl.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
        layout.addWidget(name_lbl)

        info_widget = QWidget()
        info_widget.setStyleSheet("background: transparent;")
        info_widget.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
        info_row = QHBoxLayout(info_widget)
        info_row.setContentsMargins(0, 0, 0, 0)
        info_row.setSpacing(3)

        mana_lbl = QLabel(f"M{card.mana}")
        mana_lbl.setFont(QFont("Arial", 7, QFont.Weight.Bold))
        mana_lbl.setStyleSheet("color: #44bbff; border: none;")
        mana_lbl.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
        info_row.addWidget(mana_lbl)

        for civ in card.civilizations:
            dot = QLabel()
            dot.setFixedSize(8, 8)
            dot.setStyleSheet(
                f"background: {CIV_COLORS.get(civ, '#888')}; "
                "border-radius: 4px; border: none;"
            )
            dot.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
            info_row.addWidget(dot)

        layout.addWidget(info_widget, 0, Qt.AlignmentFlag.AlignHCenter)

    def _set_normal_style(self):
        self.setStyleSheet(
            "QFrame { background: #2a2a2a; border: 1px solid #555; border-radius: 4px; }"
        )

    def set_selected(self, selected: bool):
        if selected:
            self.setStyleSheet(
                "QFrame { background: #2a3a5a; border: 2px solid #5599ff; border-radius: 4px; }"
            )
        else:
            self._set_normal_style()

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self._drag_start = event.pos()
            if self._on_click:
                self._on_click(self.card.id)
        super().mousePressEvent(event)

    def mouseMoveEvent(self, event):
        if (self._drag_start is not None
                and event.buttons() & Qt.MouseButton.LeftButton):
            dist = (event.pos() - self._drag_start).manhattanLength()
            if dist >= 10:
                self._start_drag()
        super().mouseMoveEvent(event)

    def mouseReleaseEvent(self, event):
        self._drag_start = None
        super().mouseReleaseEvent(event)

    def _start_drag(self):
        self._drag_start = None
        drag = QDrag(self)
        mime = QMimeData()
        mime.setData(CARD_MIME, self.card.id.encode())
        drag.setMimeData(mime)
        pix = self.grab()
        pix = pix.scaled(
            LIB_THUMB_W, LIB_THUMB_H,
            Qt.AspectRatioMode.KeepAspectRatio,
            Qt.TransformationMode.SmoothTransformation,
        )
        drag.setPixmap(pix)
        drag.setHotSpot(pix.rect().center())
        drag.exec(Qt.DropAction.CopyAction)


class _LibraryCardGrid(QWidget):
    """フィルタ・ソート付きカードライブラリグリッド。"""
    _TILE_W = LIB_THUMB_W + 8 + 6

    def __init__(self, on_select=None, parent=None):
        super().__init__(parent)
        self._on_select = on_select  # callback(card: LibraryCard | None)
        self.setStyleSheet("background: #1a1a1a;")

        outer = QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)
        outer.setSpacing(4)

        ctrl_row = QHBoxLayout()
        self._search_edit = QLineEdit()
        self._search_edit.setPlaceholderText("カード名で検索...")
        self._search_edit.textChanged.connect(self._refresh_filter)
        ctrl_row.addWidget(self._search_edit)
        self._sort_combo = QComboBox()
        self._sort_combo.setFixedWidth(80)
        for opt in _SORT_OPTIONS:
            self._sort_combo.addItem(opt)
        self._sort_combo.currentTextChanged.connect(self._refresh_filter)
        ctrl_row.addWidget(self._sort_combo)
        outer.addLayout(ctrl_row)

        filter_row = QHBoxLayout()
        filter_row.setSpacing(6)

        mana_lbl = QLabel("マナ:")
        mana_lbl.setFixedWidth(30)
        filter_row.addWidget(mana_lbl)
        self._mana_combo = QComboBox()
        self._mana_combo.setFixedWidth(65)
        self._mana_combo.addItem("すべて")
        for i in range(1, 13):
            self._mana_combo.addItem(str(i))
        self._mana_combo.addItem("12+")
        self._mana_combo.currentTextChanged.connect(self._refresh_filter)
        filter_row.addWidget(self._mana_combo)

        civ_lbl = QLabel("文明:")
        civ_lbl.setFixedWidth(30)
        filter_row.addWidget(civ_lbl)
        self._civ_combo = QComboBox()
        self._civ_combo.setFixedWidth(65)
        self._civ_combo.addItem("すべて")
        for civ in CIVILIZATIONS:
            self._civ_combo.addItem(civ)
        self._civ_combo.currentTextChanged.connect(self._refresh_filter)
        filter_row.addWidget(self._civ_combo)

        type_lbl = QLabel("タイプ:")
        type_lbl.setFixedWidth(40)
        filter_row.addWidget(type_lbl)
        self._type_combo = QComboBox()
        self._type_combo.setFixedWidth(110)
        self._type_combo.addItem("すべて")
        for ct in CARD_TYPES:
            self._type_combo.addItem(ct)
        self._type_combo.currentTextChanged.connect(self._refresh_filter)
        filter_row.addWidget(self._type_combo)

        reset_btn = QPushButton("リセット")
        reset_btn.setFixedWidth(55)
        reset_btn.clicked.connect(self._reset_filters)
        filter_row.addWidget(reset_btn)
        filter_row.addStretch()
        outer.addLayout(filter_row)

        self._scroll = QScrollArea()
        self._scroll.setWidgetResizable(True)
        self._scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self._scroll.setStyleSheet("""
            QScrollArea { background: #1a1a1a; border: none; }
            QScrollBar:vertical { background: #1a1a1a; width: 10px; border: none; }
            QScrollBar::handle:vertical { background: #555; border-radius: 5px; min-height: 20px; }
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical { height: 0; }
        """)
        self._scroll.viewport().setStyleSheet("background: #1a1a1a;")

        self._container = QWidget()
        self._container.setStyleSheet("background: #1a1a1a;")
        self._grid = QGridLayout(self._container)
        self._grid.setAlignment(Qt.AlignmentFlag.AlignTop | Qt.AlignmentFlag.AlignLeft)
        self._grid.setSpacing(6)
        self._grid.setContentsMargins(6, 6, 6, 6)

        self._scroll.setWidget(self._container)
        outer.addWidget(self._scroll)

        self._tiles: list[_LibraryCardTile] = []
        self._selected_id: str | None = None
        self._cols: int = 3
        self._all_cards: list[LibraryCard] = []

    def _calc_cols(self) -> int:
        return max(2, (self.width() - 12 - 10) // self._TILE_W)

    def resizeEvent(self, event):
        super().resizeEvent(event)
        new_cols = self._calc_cols()
        if new_cols != self._cols:
            self._cols = new_cols
            self._refresh_filter()

    def load_library(self, library: CardLibrary):
        self._all_cards = list(library.cards)
        self._refresh_filter()

    def _refresh_filter(self):
        query = self._search_edit.text().lower()
        mana_sel = self._mana_combo.currentText()
        civ_sel = self._civ_combo.currentText()
        type_sel = self._type_combo.currentText()

        filtered = []
        for c in self._all_cards:
            if query and query not in c.name.lower():
                continue
            if mana_sel != "すべて":
                if mana_sel == "12+":
                    if c.mana < 12:
                        continue
                else:
                    if c.mana != int(mana_sel):
                        continue
            if civ_sel != "すべて" and civ_sel not in c.civilizations:
                continue
            if type_sel != "すべて" and c.card_type != type_sel:
                continue
            filtered.append(c)

        self._populate(apply_sort(filtered, self._sort_combo.currentText()))

    def _reset_filters(self):
        widgets = [self._search_edit, self._mana_combo, self._civ_combo, self._type_combo]
        for w in widgets:
            w.blockSignals(True)
        self._search_edit.clear()
        self._mana_combo.setCurrentIndex(0)
        self._civ_combo.setCurrentIndex(0)
        self._type_combo.setCurrentIndex(0)
        for w in widgets:
            w.blockSignals(False)
        self._refresh_filter()

    def _populate(self, cards: list[LibraryCard]):
        while self._grid.count():
            item = self._grid.takeAt(0)
            if item.widget():
                item.widget().setParent(None)
        self._tiles.clear()

        for i, card in enumerate(cards):
            tile = _LibraryCardTile(card, on_click=self._on_tile_click)
            self._tiles.append(tile)
            self._grid.addWidget(tile, i // self._cols, i % self._cols)

    def _on_tile_click(self, card_id: str):
        self._selected_id = card_id
        for tile in self._tiles:
            tile.set_selected(tile.card.id == card_id)
        if self._on_select:
            self._on_select(self.get_selected_card())

    def get_selected_card(self) -> LibraryCard | None:
        if self._selected_id is None:
            return None
        return next((c for c in self._all_cards if c.id == self._selected_id), None)

    def clear_selection(self):
        self._selected_id = None
        for tile in self._tiles:
            tile.set_selected(False)


class _DeckCardTile(QFrame):
    """デッキ内の1枚タイル。"""

    def __init__(self, card: Card, on_click=None, parent=None):
        super().__init__(parent)
        self.card = card
        self._on_click = on_click
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self._set_normal_style()

        layout = QVBoxLayout(self)
        layout.setContentsMargins(4, 4, 4, 4)
        layout.setSpacing(2)
        layout.setAlignment(Qt.AlignmentFlag.AlignHCenter)

        thumb = QLabel()
        thumb.setFixedSize(DECK_THUMB_W, DECK_THUMB_H)
        thumb.setAlignment(Qt.AlignmentFlag.AlignCenter)
        thumb.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
        pix = QPixmap(card.image_path)
        if not pix.isNull():
            pix = pix.scaled(DECK_THUMB_W, DECK_THUMB_H,
                             Qt.AspectRatioMode.IgnoreAspectRatio,
                             Qt.TransformationMode.SmoothTransformation)
        else:
            pix = QPixmap(DECK_THUMB_W, DECK_THUMB_H)
            pix.fill(QColor(70, 70, 70))
        thumb.setPixmap(pix)
        layout.addWidget(thumb, 0, Qt.AlignmentFlag.AlignHCenter)

        name_lbl = QLabel(card.name)
        name_lbl.setFont(QFont("Arial", 8))
        name_lbl.setStyleSheet("color: #ddd; border: none;")
        name_lbl.setWordWrap(True)
        name_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        name_lbl.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
        layout.addWidget(name_lbl)

        if card.civilizations:
            dots = _CivDots(card.civilizations)
            layout.addWidget(dots, 0, Qt.AlignmentFlag.AlignHCenter)

        if card.card_type:
            type_color = CARD_TYPE_COLORS.get(card.card_type, "#aaa")
            type_lbl = QLabel(card.card_type)
            type_lbl.setFont(QFont("Arial", 8, QFont.Weight.Bold))
            type_lbl.setStyleSheet(f"color: {type_color}; border: none;")
            type_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            type_lbl.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
            layout.addWidget(type_lbl)

        info_widget = QWidget()
        info_widget.setStyleSheet("background: transparent;")
        info_widget.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
        info_row = QHBoxLayout(info_widget)
        info_row.setContentsMargins(0, 0, 0, 0)
        info_row.setSpacing(4)

        mana_lbl = QLabel(f"M{card.mana}")
        mana_lbl.setFont(QFont("Arial", 8, QFont.Weight.Bold))
        mana_lbl.setStyleSheet("color: #44bbff; border: none;")
        mana_lbl.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
        info_row.addWidget(mana_lbl)

        count_lbl = QLabel(f"×{card.count}")
        count_lbl.setFont(QFont("Arial", 9, QFont.Weight.Bold))
        count_lbl.setStyleSheet("color: #ffdd44; border: none;")
        count_lbl.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
        info_row.addWidget(count_lbl)

        layout.addWidget(info_widget, 0, Qt.AlignmentFlag.AlignHCenter)

    def _set_normal_style(self):
        self.setStyleSheet(
            "QFrame { background: #2a2a2a; border: 1px solid #555; border-radius: 4px; }"
        )

    def set_selected(self, selected: bool):
        if selected:
            self.setStyleSheet(
                "QFrame { background: #3a5a3a; border: 2px solid #55ff55; border-radius: 4px; }"
            )
        else:
            self._set_normal_style()

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton and self._on_click:
            self._on_click(self.card.id)
        super().mousePressEvent(event)


class _DeckCardGrid(QWidget):
    """ドロップ対象のデッキカードグリッド。"""
    _TILE_W = DECK_THUMB_W + 8 + 6

    def __init__(self, on_drop=None, parent=None):
        super().__init__(parent)
        self._on_drop = on_drop
        self.setStyleSheet("background: #1a1a1a;")
        self.setAcceptDrops(True)

        outer = QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)
        outer.setSpacing(4)

        sort_row = QHBoxLayout()
        sort_row.addStretch()
        sort_lbl = QLabel("ソート:")
        sort_lbl.setStyleSheet("color: #aaa; font-size: 11px;")
        sort_row.addWidget(sort_lbl)
        self._sort_combo = QComboBox()
        self._sort_combo.setFixedWidth(80)
        for opt in _SORT_OPTIONS:
            self._sort_combo.addItem(opt)
        self._sort_combo.currentTextChanged.connect(
            lambda: self.refresh(self._current_deck)
        )
        sort_row.addWidget(self._sort_combo)
        outer.addLayout(sort_row)

        self._scroll = QScrollArea()
        self._scroll.setWidgetResizable(True)
        self._scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self._scroll.setStyleSheet("""
            QScrollArea { background: #1a1a1a; border: none; }
            QScrollBar:vertical { background: #1a1a1a; width: 10px; border: none; }
            QScrollBar::handle:vertical { background: #555; border-radius: 5px; min-height: 20px; }
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical { height: 0; }
        """)
        self._scroll.viewport().setStyleSheet("background: #1a1a1a;")

        self._container = QWidget()
        self._container.setStyleSheet("background: #1a1a1a;")
        self._grid = QGridLayout(self._container)
        self._grid.setAlignment(Qt.AlignmentFlag.AlignTop | Qt.AlignmentFlag.AlignLeft)
        self._grid.setSpacing(6)
        self._grid.setContentsMargins(6, 6, 6, 6)

        self._scroll.setWidget(self._container)
        outer.addWidget(self._scroll)

        self._entries: list[_DeckCardTile] = []
        self._selected_id: str | None = None
        self._cols: int = 4
        self._current_deck: Deck | None = None

    def _calc_cols(self) -> int:
        return max(2, (self.width() - 12 - 10) // self._TILE_W)

    def resizeEvent(self, event):
        super().resizeEvent(event)
        new_cols = self._calc_cols()
        if new_cols != self._cols:
            self._cols = new_cols
            self.refresh(self._current_deck)

    def refresh(self, deck: Deck | None):
        self._current_deck = deck
        while self._grid.count():
            item = self._grid.takeAt(0)
            if item.widget():
                item.widget().setParent(None)
        self._entries.clear()

        if not deck:
            return
        sorted_cards = apply_sort(deck.cards, self._sort_combo.currentText())
        for i, card in enumerate(sorted_cards):
            tile = _DeckCardTile(card, on_click=self._on_tile_click)
            self._entries.append(tile)
            self._grid.addWidget(tile, i // self._cols, i % self._cols)
            if card.id == self._selected_id:
                tile.set_selected(True)

    def _on_tile_click(self, card_id: str):
        self._selected_id = card_id
        for e in self._entries:
            e.set_selected(e.card.id == card_id)

    def get_selected_card_id(self) -> str | None:
        return self._selected_id

    def dragEnterEvent(self, event):
        if event.mimeData().hasFormat(CARD_MIME):
            event.acceptProposedAction()
        else:
            event.ignore()

    def dragMoveEvent(self, event):
        if event.mimeData().hasFormat(CARD_MIME):
            event.acceptProposedAction()
        else:
            event.ignore()

    def dropEvent(self, event):
        if event.mimeData().hasFormat(CARD_MIME):
            card_id = event.mimeData().data(CARD_MIME).data().decode()
            if self._on_drop:
                self._on_drop(card_id)
            event.acceptProposedAction()
        else:
            event.ignore()
