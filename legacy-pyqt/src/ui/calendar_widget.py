"""MonthCalendarWidget — interactive monthly gardening calendar."""
from datetime import date

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QScrollArea, QFrame, QGridLayout,
)
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont

MONTHS_FR = {
    1: "Janvier", 2: "Février", 3: "Mars", 4: "Avril",
    5: "Mai",     6: "Juin",    7: "Juillet", 8: "Août",
    9: "Septembre", 10: "Octobre", 11: "Novembre", 12: "Décembre",
}

_SECTIONS = [
    ("💡 Semis en intérieur", "sowing_indoor",  "#E3F2FD", "#1565C0"),
    ("🌤 Semis en extérieur", "sowing_outdoor", "#FFF8E1", "#F57F17"),
    ("🌱 Plantation",         "planting",       "#E8F5E9", "#2E7D32"),
    ("🍅 Récolte",            "harvest",        "#FFEBEE", "#C62828"),
]


class MonthCalendarWidget(QWidget):
    vegetable_selected = pyqtSignal(int)   # vegetable id

    def __init__(self, service, parent=None):
        super().__init__(parent)
        self.service = service
        self.current_month = date.today().month
        self._build()

    # ── build ─────────────────────────────────────────────────────────────────
    def _build(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(12, 12, 12, 12)
        root.setSpacing(10)

        # Navigation row
        nav = QHBoxLayout()

        self._prev_btn = QPushButton("◀")
        self._prev_btn.setObjectName("navBtn")
        self._prev_btn.setFixedSize(38, 38)
        self._prev_btn.clicked.connect(self._prev)
        nav.addWidget(self._prev_btn)

        self._month_lbl = QLabel()
        self._month_lbl.setFont(QFont("Ubuntu", 17, QFont.Weight.Bold))
        self._month_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self._month_lbl.setStyleSheet("color:#1B5E20;")
        nav.addWidget(self._month_lbl, 1)

        self._next_btn = QPushButton("▶")
        self._next_btn.setObjectName("navBtn")
        self._next_btn.setFixedSize(38, 38)
        self._next_btn.clicked.connect(self._next)
        nav.addWidget(self._next_btn)

        today_btn = QPushButton("Aujourd'hui")
        today_btn.setObjectName("secondaryBtn")
        today_btn.clicked.connect(self._today)
        nav.addWidget(today_btn)

        root.addLayout(nav)

        # Summary line
        self._summary_lbl = QLabel()
        self._summary_lbl.setStyleSheet("color:#558B2F; font-size:12px;")
        root.addWidget(self._summary_lbl)

        # Scroll area for the sections
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        root.addWidget(scroll, 1)

        self._scroll_content = QWidget()
        self._scroll_lay = QVBoxLayout(self._scroll_content)
        self._scroll_lay.setSpacing(12)
        scroll.setWidget(self._scroll_content)

        self._refresh()

    # ── navigation ────────────────────────────────────────────────────────────
    def _prev(self):
        self.current_month = 12 if self.current_month == 1 else self.current_month - 1
        self._refresh()

    def _next(self):
        self.current_month = 1 if self.current_month == 12 else self.current_month + 1
        self._refresh()

    def _today(self):
        self.current_month = date.today().month
        self._refresh()

    # ── refresh ───────────────────────────────────────────────────────────────
    def _refresh(self):
        self._month_lbl.setText(MONTHS_FR[self.current_month])
        data = self.service.get_by_month(self.current_month)

        total = sum(len(v) for v in data.values())
        self._summary_lbl.setText(
            f"{total} activité(s) au total — "
            f"{len(data['planting'])} plantation(s) · "
            f"{len(data['harvest'])} récolte(s)"
        )

        # Clear old widgets
        while self._scroll_lay.count():
            item = self._scroll_lay.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        any_section = False
        for title, key, bg, fg in _SECTIONS:
            vegs = data.get(key, [])
            if not vegs:
                continue
            any_section = True

            frame = QFrame()
            frame.setStyleSheet(
                f"QFrame{{background:{bg};border-radius:10px;"
                f"border:1px solid {fg}40;}}"
            )
            fl = QVBoxLayout(frame)
            fl.setContentsMargins(14, 10, 14, 12)
            fl.setSpacing(8)

            header = QLabel(f"{title}  <span style='font-size:12px;'>({len(vegs)})</span>")
            header.setFont(QFont("Ubuntu", 13, QFont.Weight.Bold))
            header.setStyleSheet(f"color:{fg}; background:transparent; border:none;")
            fl.addWidget(header)

            grid = QGridLayout()
            grid.setSpacing(5)
            for i, veg in enumerate(sorted(vegs, key=lambda x: x["name"])):
                btn = QPushButton(veg["name"])
                btn.setStyleSheet(
                    f"QPushButton{{background:white;color:{fg};"
                    f"border:1px solid {fg};border-radius:6px;"
                    f"padding:4px 10px;font-size:11px;}}"
                    f"QPushButton:hover{{background:{bg};font-weight:bold;}}"
                )
                vid = veg["id"]
                btn.clicked.connect(lambda _, v=vid: self.vegetable_selected.emit(v))
                grid.addWidget(btn, i // 4, i % 4)

            fl.addLayout(grid)
            self._scroll_lay.addWidget(frame)

        if not any_section:
            lbl = QLabel("Aucune activité ce mois-ci 😴")
            lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            lbl.setStyleSheet("color:#81C784; font-size:15px; padding:40px;")
            self._scroll_lay.addWidget(lbl)

        self._scroll_lay.addStretch()
