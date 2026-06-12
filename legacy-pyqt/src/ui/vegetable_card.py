"""VegetableCard — clickable card widget for one vegetable."""
from pathlib import Path

from PyQt6.QtWidgets import QFrame, QVBoxLayout, QLabel
from PyQt6.QtCore import pyqtSignal, Qt
from PyQt6.QtGui import QPixmap, QFont, QPainter, QColor, QLinearGradient

MONTHS_SHORT = {
    1: "Jan", 2: "Fév", 3: "Mar", 4: "Avr", 5: "Mai", 6: "Jun",
    7: "Jul", 8: "Aoû", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Déc",
}

_PALETTE = [
    "#66BB6A", "#26A69A", "#42A5F5", "#FFA726",
    "#AB47BC", "#EF5350", "#78909C", "#8D6E63",
    "#EC407A", "#29B6F6", "#9CCC65", "#FF7043",
]

_STYLE_NORMAL = """
QFrame {
    background: white;
    border: 1px solid #C8E6C9;
    border-radius: 12px;
}
"""
_STYLE_HOVER = """
QFrame {
    background: #F6FBF6;
    border: 2px solid #2E7D32;
    border-radius: 12px;
}
"""


class VegetableCard(QFrame):
    clicked = pyqtSignal(int)   # emits vegetable id

    CARD_W = 190
    CARD_H = 255
    IMG_H  = 140

    def __init__(self, vegetable: dict, parent=None):
        super().__init__(parent)
        self.vegetable = vegetable
        self.setFixedSize(self.CARD_W, self.CARD_H)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setStyleSheet(_STYLE_NORMAL)
        self._build()

    # ── build ─────────────────────────────────────────────────────────────────
    def _build(self):
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 8)
        lay.setSpacing(4)

        # Image
        self.img_lbl = QLabel()
        self.img_lbl.setFixedSize(self.CARD_W, self.IMG_H)
        self.img_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.img_lbl.setStyleSheet(
            "border-radius: 12px 12px 0 0; background: #E8F5E9;"
        )
        self._load_image()
        lay.addWidget(self.img_lbl)

        # Name
        name = QLabel(self.vegetable["name"])
        name.setFont(QFont("Ubuntu", 11, QFont.Weight.Bold))
        name.setAlignment(Qt.AlignmentFlag.AlignCenter)
        name.setWordWrap(True)
        name.setStyleSheet("color: #1B5E20; padding: 0 6px;")
        lay.addWidget(name)

        # Scientific name
        sci = QLabel(self.vegetable.get("scientific_name") or "")
        sci.setFont(QFont("Ubuntu", 8))
        sci.setAlignment(Qt.AlignmentFlag.AlignCenter)
        sci.setStyleSheet("color: #81C784; font-style: italic; padding: 0 6px;")
        sci.setWordWrap(True)
        lay.addWidget(sci)

        # Harvest badge
        harvest = self.vegetable.get("harvest", [])
        if harvest:
            parts = [MONTHS_SHORT[m] for m in sorted(harvest)[:4]]
            suffix = "…" if len(harvest) > 4 else ""
            badge = QLabel("🌾 " + ", ".join(parts) + suffix)
            badge.setAlignment(Qt.AlignmentFlag.AlignCenter)
            badge.setStyleSheet(
                "background:#E8F5E9; color:#2E7D32; border-radius:8px;"
                "padding:2px 8px; font-size:10px; font-weight:bold; margin:0 10px;"
            )
            lay.addWidget(badge)

        lay.addStretch()

    # ── image ─────────────────────────────────────────────────────────────────
    def _load_image(self):
        path = self.vegetable.get("image_path")
        if path and Path(path).exists():
            px = QPixmap(path)
            if not px.isNull():
                px = px.scaled(
                    self.CARD_W, self.IMG_H,
                    Qt.AspectRatioMode.KeepAspectRatioByExpanding,
                    Qt.TransformationMode.SmoothTransformation,
                )
                # Centre-crop
                x = max(0, (px.width()  - self.CARD_W) // 2)
                y = max(0, (px.height() - self.IMG_H)  // 2)
                px = px.copy(x, y, min(px.width(), self.CARD_W), min(px.height(), self.IMG_H))
                self.img_lbl.setPixmap(px)
                return
        self._draw_placeholder()

    def _draw_placeholder(self):
        px = QPixmap(self.CARD_W, self.IMG_H)
        idx = abs(hash(self.vegetable["name"])) % len(_PALETTE)
        c = QColor(_PALETTE[idx])
        painter = QPainter(px)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        grad = QLinearGradient(0, 0, 0, self.IMG_H)
        grad.setColorAt(0, c.lighter(130))
        grad.setColorAt(1, c)
        painter.fillRect(0, 0, self.CARD_W, self.IMG_H, grad)
        painter.setPen(QColor(255, 255, 255, 160))
        painter.setFont(QFont("Ubuntu", 44, QFont.Weight.Bold))
        painter.drawText(
            0, 0, self.CARD_W, self.IMG_H,
            Qt.AlignmentFlag.AlignCenter,
            self.vegetable["name"][0].upper(),
        )
        painter.end()
        self.img_lbl.setPixmap(px)

    # ── public ────────────────────────────────────────────────────────────────
    def update_vegetable(self, vegetable: dict):
        self.vegetable = vegetable
        self._load_image()

    # ── events ────────────────────────────────────────────────────────────────
    def enterEvent(self, event):
        self.setStyleSheet(_STYLE_HOVER)
        super().enterEvent(event)

    def leaveEvent(self, event):
        self.setStyleSheet(_STYLE_NORMAL)
        super().leaveEvent(event)

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.clicked.emit(self.vegetable["id"])
        super().mousePressEvent(event)
