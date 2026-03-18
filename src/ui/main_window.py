"""MainWindow — pure display layer, no business logic."""
from datetime import date

from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLineEdit,
    QTabWidget, QScrollArea, QFrame, QLabel, QPushButton,
    QComboBox, QStatusBar, QProgressDialog, QMessageBox,
)
from PyQt6.QtCore import Qt, QTimer, pyqtSlot
from PyQt6.QtGui import QFont

from .vegetable_card import VegetableCard
from .detail_dialog import DetailDialog
from .calendar_widget import MonthCalendarWidget
from .flow_layout import FlowLayout
from .meteo_dialog import MeteoDialog
from .styles import MAIN_STYLE

MONTHS_FR = {
    1: "Janvier", 2: "Février", 3: "Mars", 4: "Avril",
    5: "Mai",     6: "Juin",    7: "Juillet", 8: "Août",
    9: "Septembre", 10: "Octobre", 11: "Novembre", 12: "Décembre",
}


# ── Card grid ─────────────────────────────────────────────────────────────────

class CardGrid(QScrollArea):
    """Scroll area containing a FlowLayout of VegetableCards."""

    def __init__(self, on_click, parent=None):
        super().__init__(parent)
        self._on_click = on_click
        self.setWidgetResizable(True)
        self.setFrameShape(QFrame.Shape.NoFrame)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)

        self._container = QWidget()
        self._flow = FlowLayout(self._container, margin=14, spacing=10)
        self.setWidget(self._container)

        self._cards: dict = {}   # id → VegetableCard

    def set_vegetables(self, vegetables: list):
        while self._flow.count():
            item = self._flow.takeAt(0)
            if item and item.widget():
                item.widget().deleteLater()
        self._cards.clear()

        for veg in vegetables:
            card = VegetableCard(veg)
            card.clicked.connect(self._on_click)
            self._flow.addWidget(card)
            self._cards[veg["id"]] = card

    def refresh_card(self, vegetable: dict):
        if card := self._cards.get(vegetable["id"]):
            card.update_vegetable(vegetable)


# ── Main window ───────────────────────────────────────────────────────────────

class MainWindow(QMainWindow):

    def __init__(self, service):
        super().__init__()
        self.service = service
        self.setWindowTitle("🌱  Jardinator — Calendrier du Jardinier")
        self.setMinimumSize(1000, 680)
        self.resize(1240, 820)
        self.setStyleSheet(MAIN_STYLE)

        self._dl_thread  = None
        self._meteo_dlg  = None
        self._search_timer = QTimer(singleShot=True)
        self._search_timer.timeout.connect(self._apply_filters)

        self._build()
        self._load_tab(0)

    # ── UI construction ───────────────────────────────────────────────────────
    def _build(self):
        central = QWidget()
        self.setCentralWidget(central)
        root = QVBoxLayout(central)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)

        root.addWidget(self._make_header())
        root.addWidget(self._make_tabs(), 1)

        self._status = QStatusBar()
        self.setStatusBar(self._status)
        self._status_lbl = QLabel()
        self._status.addWidget(self._status_lbl)

    def _make_header(self) -> QWidget:
        hdr = QWidget()
        hdr.setStyleSheet("background:#2E7D32;")
        hdr.setFixedHeight(76)

        lay = QHBoxLayout(hdr)
        lay.setContentsMargins(20, 8, 20, 8)
        lay.setSpacing(16)

        # Logo + title
        vbox = QVBoxLayout()
        vbox.setSpacing(2)
        title = QLabel("🌱  Jardinator")
        title.setFont(QFont("Ubuntu", 21, QFont.Weight.Bold))
        title.setStyleSheet("color:white; background:transparent;")
        sub = QLabel("Calendrier du jardinier · légumes d'Europe · 210+ variétés")
        sub.setStyleSheet("color:#A5D6A7; font-size:11px; background:transparent;")
        vbox.addWidget(title)
        vbox.addWidget(sub)
        lay.addLayout(vbox)
        lay.addStretch()

        # Search
        self._search = QLineEdit()
        self._search.setObjectName("searchBar")
        self._search.setPlaceholderText("🔍  Rechercher un légume…")
        self._search.setFixedSize(290, 36)
        self._search.textChanged.connect(lambda _: self._search_timer.start(280))
        lay.addWidget(self._search)

        # Group filter
        self._groupe_cb = QComboBox()
        self._groupe_cb.setFixedWidth(175)
        self._groupe_cb.addItem("Tous les groupes", None)
        for grp in self.service.get_groupes():
            self._groupe_cb.addItem(grp.capitalize(), grp)
        self._groupe_cb.currentIndexChanged.connect(self._apply_filters)
        lay.addWidget(self._groupe_cb)

        # Family filter
        self._family_cb = QComboBox()
        self._family_cb.setFixedWidth(175)
        self._family_cb.addItem("Toutes les familles", None)
        for fam in self.service.get_families():
            self._family_cb.addItem(fam, fam)
        self._family_cb.currentIndexChanged.connect(self._apply_filters)
        lay.addWidget(self._family_cb)

        lay.addStretch()

        # Meteo button
        meteo = QPushButton("🌡️  Météo du jour")
        meteo.setStyleSheet(
            "QPushButton{background:#0288D1;color:white;border-radius:8px;"
            "padding:7px 14px;font-weight:bold;border:none;}"
            "QPushButton:hover{background:#0277BD;}"
            "QPushButton:checked{background:#01579B;}"
        )
        meteo.setCheckable(True)
        meteo.clicked.connect(self._toggle_meteo)
        self._meteo_btn = meteo
        lay.addWidget(meteo)

        # Download button
        dl = QPushButton("📥  Télécharger les images")
        dl.setStyleSheet(
            "QPushButton{background:#43A047;color:white;border-radius:8px;"
            "padding:7px 14px;font-weight:bold;border:none;}"
            "QPushButton:hover{background:#388E3C;}"
        )
        dl.clicked.connect(self._download_all)
        lay.addWidget(dl)

        return hdr

    def _make_tabs(self) -> QTabWidget:
        self._tabs = QTabWidget()
        self._tabs.setDocumentMode(True)

        month_name = MONTHS_FR[date.today().month]
        self._grid_all    = CardGrid(self._show_detail)
        self._grid_now    = CardGrid(self._show_detail)
        self._grid_spring = CardGrid(self._show_detail)
        self._grid_summer = CardGrid(self._show_detail)
        self._grid_autumn = CardGrid(self._show_detail)
        self._grid_winter = CardGrid(self._show_detail)
        self._calendar    = MonthCalendarWidget(self.service)
        self._calendar.vegetable_selected.connect(self._show_detail)

        self._tabs.addTab(self._grid_all,    "🌿  Tous")
        self._tabs.addTab(self._grid_now,    f"📅  {month_name}")
        self._tabs.addTab(self._grid_spring, "🌸  Printemps")
        self._tabs.addTab(self._grid_summer, "☀️  Été")
        self._tabs.addTab(self._grid_autumn, "🍂  Automne")
        self._tabs.addTab(self._grid_winter, "❄️  Hiver")
        self._tabs.addTab(self._calendar,    "📆  Calendrier")

        self._tabs.currentChanged.connect(self._load_tab)
        return self._tabs

    # ── tab loading ───────────────────────────────────────────────────────────
    _TAB_SOURCES = {
        0: ("get_all",     "grid_all"),
        1: ("get_plantable_now", "grid_now"),
        2: ("get_spring",  "grid_spring"),
        3: ("get_summer",  "grid_summer"),
        4: ("get_autumn",  "grid_autumn"),
        5: ("get_winter",  "grid_winter"),
    }

    def _get_vegs_for_tab(self, idx: int) -> list:
        if idx == 0:
            return self.service.get_all()
        if idx == 1:
            return self.service.get_plantable_now()
        if idx == 2:
            return self.service.get_by_season("Printemps")
        if idx == 3:
            return self.service.get_by_season("Été")
        if idx == 4:
            return self.service.get_by_season("Automne")
        if idx == 5:
            return self.service.get_by_season("Hiver")
        return []

    def _grid_for_tab(self, idx: int):
        return [
            self._grid_all, self._grid_now,
            self._grid_spring, self._grid_summer,
            self._grid_autumn, self._grid_winter,
        ][idx] if idx < 6 else None

    def _load_tab(self, idx: int):
        if idx == 6:
            return   # Calendar handles itself
        vegs  = self._filter(self._get_vegs_for_tab(idx))
        grid  = self._grid_for_tab(idx)
        if grid:
            grid.set_vegetables(vegs)
        self._set_status(len(vegs), idx)

    def _filter(self, vegetables: list) -> list:
        grp = self._groupe_cb.currentData()
        if grp:
            vegetables = [v for v in vegetables if v.get("groupe") == grp]
        fam = self._family_cb.currentData()
        if fam:
            vegetables = [v for v in vegetables if v.get("family") == fam]
        q = self._search.text().strip().lower()
        if q:
            vegetables = [
                v for v in vegetables
                if q in v["name"].lower()
                or q in (v.get("scientific_name") or "").lower()
                or q in (v.get("family") or "").lower()
            ]
        return vegetables

    def _apply_filters(self):
        self._load_tab(self._tabs.currentIndex())

    def _set_status(self, count: int, tab_idx: int):
        labels = [
            f"{count} légume(s) au total",
            f"{count} légume(s) à planter/semer en {MONTHS_FR[date.today().month]}",
            f"{count} légume(s) de printemps",
            f"{count} légume(s) d'été",
            f"{count} légume(s) d'automne",
            f"{count} légume(s) d'hiver",
        ]
        if tab_idx < len(labels):
            self._status_lbl.setText(labels[tab_idx])

    # ── detail dialog ─────────────────────────────────────────────────────────
    @pyqtSlot(int)
    def _show_detail(self, vid: int):
        veg = self.service.get_by_id(vid)
        if veg:
            dlg = DetailDialog(veg, self.service, self)
            dlg.exec()
            self._load_tab(self._tabs.currentIndex())

    # ── meteo dialog ─────────────────────────────────────────────────────
    def _toggle_meteo(self, checked: bool):
        if checked:
            self._meteo_dlg = MeteoDialog(self.service, self)
            self._meteo_dlg.finished.connect(lambda _: self._meteo_btn.setChecked(False))
            self._meteo_dlg.show()
        else:
            if self._meteo_dlg:
                self._meteo_dlg.close()
                self._meteo_dlg = None

    # ── download all images ───────────────────────────────────────────────────
    def _download_all(self):
        if self._dl_thread and self._dl_thread.isRunning():
            QMessageBox.information(self, "Info", "Un téléchargement est déjà en cours.")
            return

        progress = QProgressDialog(
            "Téléchargement des images depuis Wikimedia Commons…",
            "Annuler", 0, 0, self,
        )
        progress.setWindowTitle("📥  Téléchargement")
        progress.setWindowModality(Qt.WindowModality.WindowModal)
        progress.setMinimumDuration(0)
        progress.setMinimumWidth(460)

        self._dl_thread = self.service.start_download_thread()

        @pyqtSlot(int, int, str)
        def on_progress(cur, total, name):
            if not progress.wasCanceled():
                progress.setMaximum(total)
                progress.setValue(cur)
                progress.setLabelText(f"Téléchargement : {name}\n({cur} / {total})")

        @pyqtSlot(int)
        def on_finished(count):
            progress.close()
            QMessageBox.information(
                self, "Terminé",
                f"✅  {count} image(s) téléchargée(s) avec succès !",
            )
            self._load_tab(self._tabs.currentIndex())

        @pyqtSlot(str)
        def on_error(msg):
            progress.close()
            QMessageBox.warning(self, "Erreur", f"Erreur lors du téléchargement :\n{msg}")

        self._dl_thread.progress.connect(on_progress)
        self._dl_thread.finished.connect(on_finished)
        self._dl_thread.error.connect(on_error)
        progress.canceled.connect(self._dl_thread.cancel)

        self._dl_thread.start()
        progress.exec()
