import json
import os
import uuid

from PyQt6.QtCore import Qt
from PyQt6.QtGui import QPixmap
from PyQt6.QtWidgets import (
    QCheckBox,
    QComboBox,
    QDialog,
    QFileDialog,
    QFrame,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QListWidget,
    QMessageBox,
    QPushButton,
    QSpinBox,
    QSplitter,
    QVBoxLayout,
    QWidget,
)

from models.card import Card
from models.card_library import (
    CARD_TYPES,
    CIVILIZATIONS,
    CIV_COLORS,
    CardLibrary,
    LibraryCard,
)
from models.deck import Deck

from ._deck_editor_widgets import (
    DIALOG_STYLE,
    LIB_THUMB_W,
    LIB_THUMB_H,
    _DeckCardGrid,
    _LibraryCardGrid,
    apply_sort,
    sanitize_filename,
)

DECKS_DIR = "data/decks"


class DeckManagerDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("デッキ管理")
        self.setWindowFlag(Qt.WindowType.WindowMaximizeButtonHint, True)
        self.setStyleSheet(DIALOG_STYLE)
        self.resize(1100, 720)
        self.current_deck: Deck | None = None
        self._library = CardLibrary.get_instance()
        self._editing_card_id: str | None = None  # None = new card
        self._setup_ui()
        self._load_deck_list()

    # -----------------------------------------------------------------------
    # UI setup
    # -----------------------------------------------------------------------

    def _setup_ui(self):
        root = QHBoxLayout(self)
        splitter = QSplitter(Qt.Orientation.Horizontal)
        splitter.addWidget(self._build_deck_panel())
        splitter.addWidget(self._build_library_panel())
        splitter.addWidget(self._build_editor_panel())
        splitter.setSizes([160, 420, 420])
        root.addWidget(splitter)

    # ---- Panel 1: Deck list ----

    def _build_deck_panel(self) -> QWidget:
        w = QWidget()
        layout = QVBoxLayout(w)
        layout.addWidget(QLabel("デッキ一覧"))
        self.deck_list = QListWidget()
        self.deck_list.currentTextChanged.connect(self._on_deck_selected)
        layout.addWidget(self.deck_list)
        btns = QHBoxLayout()
        new_btn = QPushButton("新規作成")
        new_btn.clicked.connect(self._new_deck)
        del_btn = QPushButton("削除")
        del_btn.clicked.connect(self._delete_deck)
        btns.addWidget(new_btn)
        btns.addWidget(del_btn)
        layout.addLayout(btns)

        import_btn = QPushButton("JSON インポート")
        import_btn.setToolTip("デッキ JSON ファイルを読み込んでデッキ一覧に追加する")
        import_btn.clicked.connect(self._import_deck)
        layout.addWidget(import_btn)

        return w

    # ---- Panel 2: Card library ----

    def _build_library_panel(self) -> QWidget:
        w = QWidget()
        layout = QVBoxLayout(w)
        layout.setSpacing(4)

        header = QHBoxLayout()
        header.addWidget(QLabel("カードプール"))
        header.addStretch()
        self._lib_count_label = QLabel(f"{len(self._library.cards)} 枚")
        self._lib_count_label.setStyleSheet("color: #aaa; font-size: 11px;")
        header.addWidget(self._lib_count_label)
        layout.addLayout(header)

        self.library_grid = _LibraryCardGrid(on_select=self._on_library_card_selected)
        self.library_grid.load_library(self._library)
        layout.addWidget(self.library_grid)

        hint = QLabel("カードをデッキエリアへドラッグ＆ドロップで追加")
        hint.setStyleSheet("color: #888; font-size: 10px;")
        hint.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(hint)

        layout.addWidget(self._build_card_form())
        return w

    def _build_card_form(self) -> QFrame:
        form = QFrame()
        form.setStyleSheet(
            "QFrame#cardForm { border: 1px solid #444; border-radius: 4px; "
            "background: #1e1e35; }"
        )
        form.setObjectName("cardForm")
        g = QGridLayout(form)
        g.setContentsMargins(8, 6, 8, 6)
        g.setHorizontalSpacing(6)
        g.setVerticalSpacing(4)

        # Row 0: name
        g.addWidget(QLabel("カード名:"), 0, 0)
        self._f_name = QLineEdit()
        g.addWidget(self._f_name, 0, 1, 1, 3)

        # Row 1: image
        g.addWidget(QLabel("画像:"), 1, 0)
        self._f_img = QLineEdit()
        self._f_img.textChanged.connect(self._update_form_preview)
        g.addWidget(self._f_img, 1, 1, 1, 2)
        browse_btn = QPushButton("...")
        browse_btn.setFixedWidth(28)
        browse_btn.clicked.connect(self._browse_image)
        g.addWidget(browse_btn, 1, 3)

        # Row 2: preview (left) + mana/type (right)
        self._f_preview = QLabel()
        self._f_preview.setFixedSize(LIB_THUMB_W, LIB_THUMB_H)
        self._f_preview.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self._f_preview.setStyleSheet("background: #333; border: 1px solid #555;")
        g.addWidget(self._f_preview, 2, 0, 3, 1)

        mana_row = QHBoxLayout()
        mana_row.addWidget(QLabel("マナ:"))
        self._f_mana = QSpinBox()
        self._f_mana.setRange(0, 15)
        self._f_mana.setFixedWidth(55)
        mana_row.addWidget(self._f_mana)
        mana_row.addStretch()
        g.addLayout(mana_row, 2, 1, 1, 3)

        # Row 3: civilizations
        civ_row = QHBoxLayout()
        civ_row.addWidget(QLabel("文明:"))
        self._f_civ_checks: dict[str, QCheckBox] = {}
        for civ in CIVILIZATIONS:
            cb = QCheckBox(civ)
            color = CIV_COLORS.get(civ, "#aaa")
            cb.setStyleSheet(f"color: {color}; border: none;")
            self._f_civ_checks[civ] = cb
            civ_row.addWidget(cb)
        g.addLayout(civ_row, 3, 1, 1, 3)

        # Row 4: card type
        type_row = QHBoxLayout()
        type_row.addWidget(QLabel("タイプ:"))
        self._f_type = QComboBox()
        self._f_type.addItem("")
        for t in CARD_TYPES:
            self._f_type.addItem(t)
        type_row.addWidget(self._f_type)
        type_row.addStretch()
        g.addLayout(type_row, 4, 1, 1, 3)

        # Row 5: action buttons
        btn_row = QHBoxLayout()
        clear_btn = QPushButton("新規")
        clear_btn.setToolTip("フォームをクリアして新規入力モードにする")
        clear_btn.clicked.connect(self._clear_card_form)
        btn_row.addWidget(clear_btn)

        self._f_save_btn = QPushButton("登録")
        self._f_save_btn.clicked.connect(self._save_card_form)
        btn_row.addWidget(self._f_save_btn)

        self._f_delete_btn = QPushButton("削除")
        self._f_delete_btn.clicked.connect(self._delete_card)
        self._f_delete_btn.setEnabled(False)
        btn_row.addWidget(self._f_delete_btn)

        g.addLayout(btn_row, 5, 0, 1, 4)

        return form

    # ---- Panel 3: Deck editor ----

    def _build_editor_panel(self) -> QWidget:
        w = QWidget()
        layout = QVBoxLayout(w)

        name_row = QHBoxLayout()
        name_row.addWidget(QLabel("デッキ名:"))
        self.deck_name_edit = QLineEdit()
        self.deck_name_edit.textChanged.connect(self._on_deck_name_changed)
        name_row.addWidget(self.deck_name_edit)
        self.count_label = QLabel("0 / 40")
        name_row.addWidget(self.count_label)
        layout.addLayout(name_row)

        back_row = QHBoxLayout()
        back_row.addWidget(QLabel("裏面画像:"))
        self.back_img_edit = QLineEdit()
        self.back_img_edit.setPlaceholderText("未設定（デフォルト）")
        self.back_img_edit.textChanged.connect(self._on_back_image_changed)
        back_row.addWidget(self.back_img_edit)
        back_browse_btn = QPushButton("...")
        back_browse_btn.setFixedWidth(28)
        back_browse_btn.clicked.connect(self._browse_back_image)
        back_row.addWidget(back_browse_btn)
        back_clear_btn = QPushButton("×")
        back_clear_btn.setFixedWidth(24)
        back_clear_btn.setToolTip("裏面をデフォルトに戻す")
        back_clear_btn.clicked.connect(lambda: self.back_img_edit.clear())
        back_row.addWidget(back_clear_btn)
        layout.addLayout(back_row)

        layout.addWidget(QLabel("デッキ内容（ここへドロップ）"))

        self.deck_card_grid = _DeckCardGrid(on_drop=self._on_library_drop)
        layout.addWidget(self.deck_card_grid)

        count_ctrl = QHBoxLayout()
        plus_btn = QPushButton("+1")
        plus_btn.clicked.connect(self._inc_card)
        minus_btn = QPushButton("-1")
        minus_btn.clicked.connect(self._dec_card)
        remove_btn = QPushButton("削除")
        remove_btn.clicked.connect(self._remove_deck_card)
        count_ctrl.addWidget(plus_btn)
        count_ctrl.addWidget(minus_btn)
        count_ctrl.addWidget(remove_btn)
        layout.addLayout(count_ctrl)

        layout.addWidget(self._make_separator())

        save_btn = QPushButton("デッキを保存")
        save_btn.clicked.connect(self._save_deck)
        layout.addWidget(save_btn)

        close_btn = QPushButton("閉じる")
        close_btn.clicked.connect(self.accept)
        layout.addWidget(close_btn)
        return w

    def _make_separator(self) -> QFrame:
        line = QFrame()
        line.setFrameShape(QFrame.Shape.HLine)
        line.setStyleSheet("color: #555;")
        return line

    # -----------------------------------------------------------------------
    # Deck list
    # -----------------------------------------------------------------------

    def _load_deck_list(self):
        self.deck_list.clear()
        os.makedirs(DECKS_DIR, exist_ok=True)
        for f in sorted(os.listdir(DECKS_DIR)):
            if f.endswith(".json"):
                self.deck_list.addItem(f[:-5])

    def _on_deck_selected(self, name: str):
        if not name:
            return
        path = os.path.join(DECKS_DIR, f"{name}.json")
        try:
            self.current_deck = Deck.load(path)
            self.deck_name_edit.setText(self.current_deck.name)
            self.back_img_edit.setText(self.current_deck.back_image_path)
            self._refresh_deck_grid()
        except Exception as e:
            QMessageBox.warning(self, "エラー", f"読み込み失敗: {e}")

    def _new_deck(self):
        self.current_deck = Deck()
        self.deck_name_edit.setText(self.current_deck.name)
        self.back_img_edit.clear()
        self._refresh_deck_grid()

    def _delete_deck(self):
        item = self.deck_list.currentItem()
        if not item:
            return
        name = item.text()
        if (QMessageBox.question(self, "確認", f"「{name}」を削除しますか？")
                != QMessageBox.StandardButton.Yes):
            return
        path = os.path.join(DECKS_DIR, f"{name}.json")
        if os.path.exists(path):
            os.remove(path)
        self.current_deck = None
        self._load_deck_list()

    def _import_deck(self):
        paths, _ = QFileDialog.getOpenFileNames(
            self, "デッキ JSON をインポート", DECKS_DIR,
            "Deck JSON (*.json)"
        )
        if not paths:
            return
        imported, skipped = [], []
        for path in paths:
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                deck = Deck.from_dict(data)
                base = sanitize_filename(deck.name) or sanitize_filename(
                    os.path.splitext(os.path.basename(path))[0]
                )
                dest = os.path.join(DECKS_DIR, f"{base}.json")
                counter = 1
                while os.path.exists(dest):
                    dest = os.path.join(DECKS_DIR, f"{base}_{counter}.json")
                    counter += 1
                deck.save(dest)
                imported.append(deck.name)
            except Exception as e:
                skipped.append(f"{os.path.basename(path)}: {e}")
        self._load_deck_list()
        msg_parts = []
        if imported:
            msg_parts.append(f"{len(imported)} 件インポートしました:\n" + "\n".join(f"  ・{n}" for n in imported))
        if skipped:
            msg_parts.append("以下は失敗しました:\n" + "\n".join(skipped))
        QMessageBox.information(self, "インポート完了", "\n\n".join(msg_parts))

    def _on_deck_name_changed(self, text: str):
        if self.current_deck:
            self.current_deck.name = text

    def _on_back_image_changed(self, text: str):
        if self.current_deck:
            self.current_deck.back_image_path = text.strip()

    def _browse_back_image(self):
        path, _ = QFileDialog.getOpenFileName(
            self, "裏面画像を選択", "",
            "Images (*.png *.jpg *.jpeg *.gif *.bmp *.webp)"
        )
        if path:
            self.back_img_edit.setText(path)

    # -----------------------------------------------------------------------
    # Card form (inline)
    # -----------------------------------------------------------------------

    def _on_library_card_selected(self, card: LibraryCard | None):
        if card is None:
            self._clear_card_form()
            return
        self._editing_card_id = card.id
        self._f_name.setText(card.name)
        self._f_img.setText(card.image_path)
        self._f_mana.setValue(card.mana)
        for civ, cb in self._f_civ_checks.items():
            cb.setChecked(civ in card.civilizations)
        idx = self._f_type.findText(card.card_type)
        self._f_type.setCurrentIndex(idx if idx >= 0 else 0)
        self._f_save_btn.setText("更新")
        self._f_delete_btn.setEnabled(True)

    def _clear_card_form(self):
        self._editing_card_id = None
        self._f_name.clear()
        self._f_img.clear()
        self._f_mana.setValue(0)
        for cb in self._f_civ_checks.values():
            cb.setChecked(False)
        self._f_type.setCurrentIndex(0)
        self._f_preview.setPixmap(QPixmap())
        self._f_preview.setStyleSheet("background: #333; border: 1px solid #555;")
        self._f_save_btn.setText("登録")
        self._f_delete_btn.setEnabled(False)
        self.library_grid.clear_selection()

    def _update_form_preview(self, path: str):
        pix = QPixmap(path)
        if not pix.isNull():
            pix = pix.scaled(
                LIB_THUMB_W, LIB_THUMB_H,
                Qt.AspectRatioMode.KeepAspectRatio,
                Qt.TransformationMode.SmoothTransformation,
            )
            self._f_preview.setPixmap(pix)
            self._f_preview.setStyleSheet("")
        else:
            self._f_preview.setPixmap(QPixmap())
            self._f_preview.setStyleSheet("background: #333; border: 1px solid #555;")

    def _browse_image(self):
        path, _ = QFileDialog.getOpenFileName(
            self, "画像を選択", "",
            "Images (*.png *.jpg *.jpeg *.gif *.bmp *.webp)"
        )
        if path:
            self._f_img.setText(path)

    def _save_card_form(self):
        name = self._f_name.text().strip()
        if not name:
            QMessageBox.warning(self, "エラー", "カード名を入力してください")
            return
        civs = [civ for civ, cb in self._f_civ_checks.items() if cb.isChecked()]
        card = LibraryCard(
            name=name,
            image_path=self._f_img.text().strip(),
            mana=self._f_mana.value(),
            civilizations=civs,
            card_type=self._f_type.currentText(),
            id=self._editing_card_id or str(uuid.uuid4()),
        )
        was_new = not self._editing_card_id
        if self._editing_card_id:
            for i, c in enumerate(self._library.cards):
                if c.id == self._editing_card_id:
                    self._library.cards[i] = card
                    break
        else:
            self._library.add_card(card)

        self._library.save()
        self._refresh_library()
        if was_new:
            self._clear_card_form()
            self._f_name.setFocus()
        else:
            self._editing_card_id = card.id
            self._f_save_btn.setText("更新")
            self._f_delete_btn.setEnabled(True)

    def _delete_card(self):
        if not self._editing_card_id:
            return
        card = next((c for c in self._library.cards if c.id == self._editing_card_id), None)
        if card is None:
            return
        if (QMessageBox.question(self, "確認", f"「{card.name}」を削除しますか？")
                != QMessageBox.StandardButton.Yes):
            return
        self._library.remove_card(self._editing_card_id)
        self._library.save()
        self._clear_card_form()
        self._refresh_library()

    # -----------------------------------------------------------------------
    # Library refresh
    # -----------------------------------------------------------------------

    def _refresh_library(self):
        self._lib_count_label.setText(f"{len(self._library.cards)} 枚")
        self.library_grid.load_library(self._library)

    # -----------------------------------------------------------------------
    # Drop handler: library → deck
    # -----------------------------------------------------------------------

    def _on_library_drop(self, card_id: str):
        if not self.current_deck:
            QMessageBox.warning(self, "エラー", "デッキを選択または新規作成してください")
            return
        lib_card = next((c for c in self._library.cards if c.id == card_id), None)
        if lib_card is None:
            return
        existing = next((c for c in self.current_deck.cards if c.id == card_id), None)
        if existing:
            if existing.count >= 4:
                QMessageBox.warning(self, "エラー", "同じカードは4枚までです")
                return
            if self.current_deck.total_count >= Deck.MAX_SIZE:
                QMessageBox.warning(self, "エラー", "40枚を超えます")
                return
            existing.count += 1
        else:
            if self.current_deck.total_count >= Deck.MAX_SIZE:
                QMessageBox.warning(self, "エラー", "40枚を超えます")
                return
            self.current_deck.cards.append(Card(
                name=lib_card.name,
                image_path=lib_card.image_path,
                mana=lib_card.mana,
                civilizations=lib_card.civilizations,
                card_type=lib_card.card_type,
                id=lib_card.id,
            ))
        self._refresh_deck_grid()

    # -----------------------------------------------------------------------
    # Deck editor
    # -----------------------------------------------------------------------

    def _refresh_deck_grid(self):
        self.deck_card_grid.refresh(self.current_deck)
        total = self.current_deck.total_count if self.current_deck else 0
        self.count_label.setText(f"{total} / 40")

    def _get_selected_deck_card(self) -> Card | None:
        if not self.current_deck:
            return None
        card_id = self.deck_card_grid.get_selected_card_id()
        if not card_id:
            return None
        return next((c for c in self.current_deck.cards if c.id == card_id), None)

    def _inc_card(self):
        card = self._get_selected_deck_card()
        if not card or not self.current_deck:
            return
        if card.count >= 4:
            QMessageBox.warning(self, "エラー", "同じカードは4枚までです")
            return
        if self.current_deck.total_count >= Deck.MAX_SIZE:
            QMessageBox.warning(self, "エラー", "40枚を超えます")
            return
        card.count += 1
        self._refresh_deck_grid()

    def _dec_card(self):
        card = self._get_selected_deck_card()
        if not card:
            return
        if card.count > 1:
            card.count -= 1
            self._refresh_deck_grid()
        else:
            self._remove_deck_card()

    def _remove_deck_card(self):
        card = self._get_selected_deck_card()
        if not card or not self.current_deck:
            return
        self.current_deck.cards = [c for c in self.current_deck.cards if c.id != card.id]
        self._refresh_deck_grid()

    def _save_deck(self):
        if not self.current_deck:
            return
        name = self.current_deck.name.strip()
        if not name:
            QMessageBox.warning(self, "エラー", "デッキ名を入力してください")
            return
        safe_name = sanitize_filename(name)
        path = os.path.join(DECKS_DIR, f"{safe_name}.json")
        try:
            self.current_deck.save(path)
            self._load_deck_list()
            QMessageBox.information(self, "保存完了", f"「{name}」を保存しました")
        except Exception as e:
            QMessageBox.warning(self, "エラー", f"保存失敗: {e}")
