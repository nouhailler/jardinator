"""MeteoDialog — Que puis-je sortir aujourd'hui ?"""
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QScrollArea, QWidget, QFrame, QSizePolicy,
)
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont, QPainter, QColor, QLinearGradient


# ── Double-handle temperature slider ──────────────────────────────────────────

class TempRangeSlider(QWidget):
    """Custom widget — two draggable handles on a colour-gradient track."""

    range_changed = pyqtSignal(int, int)   # lo, hi

    TEMP_MIN = -10
    TEMP_MAX =  45
    MARGIN   =  20   # px left/right padding
    TRACK_H  =  20   # height of the gradient bar
    HANDLE_R =  11   # handle radius

    def __init__(self, lo: int = 8, hi: int = 25, parent=None):
        super().__init__(parent)
        self._lo   = max(self.TEMP_MIN, min(lo, hi - 1))
        self._hi   = min(self.TEMP_MAX, max(hi, lo + 1))
        self._drag = None
        self.setMinimumHeight(self.TRACK_H + self.HANDLE_R * 2 + 28)
        self.setMinimumWidth(300)
        self.setCursor(Qt.CursorShape.PointingHandCursor)

    # ── geometry helpers ──────────────────────────────────────────────────
    def _x(self, t: int) -> int:
        usable = self.width() - 2 * self.MARGIN
        frac   = (t - self.TEMP_MIN) / (self.TEMP_MAX - self.TEMP_MIN)
        return self.MARGIN + int(frac * usable)

    def _temp(self, x: int) -> int:
        usable = self.width() - 2 * self.MARGIN
        frac   = (x - self.MARGIN) / usable
        return max(self.TEMP_MIN, min(self.TEMP_MAX, round(
            self.TEMP_MIN + frac * (self.TEMP_MAX - self.TEMP_MIN)
        )))

    # ── paint ─────────────────────────────────────────────────────────────
    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)

        cy    = self.height() // 2
        bar_y = cy - self.TRACK_H // 2
        w     = self.width() - 2 * self.MARGIN
        cx_lo = self._x(self._lo)
        cx_hi = self._x(self._hi)

        # ── gradient track ───────────────────────────────────────────────
        g = QLinearGradient(self.MARGIN, 0, self.MARGIN + w, 0)
        g.setColorAt(0.00, QColor("#90CAF9"))  # cold blue
        g.setColorAt(0.22, QColor("#81C784"))  # cool green
        g.setColorAt(0.50, QColor("#A5D6A7"))  # pleasant
        g.setColorAt(0.72, QColor("#FFB74D"))  # warm
        g.setColorAt(1.00, QColor("#EF9A9A"))  # hot
        p.setBrush(g)
        p.setPen(Qt.PenStyle.NoPen)
        p.drawRoundedRect(self.MARGIN, bar_y, w, self.TRACK_H, 10, 10)

        # ── dim zones outside selection ──────────────────────────────────
        dim = QColor(30, 30, 30, 110)
        p.setBrush(dim)
        if cx_lo > self.MARGIN:
            p.drawRoundedRect(self.MARGIN, bar_y,
                              cx_lo - self.MARGIN, self.TRACK_H, 10, 10)
        if cx_hi < self.MARGIN + w:
            p.drawRoundedRect(cx_hi, bar_y,
                              self.MARGIN + w - cx_hi, self.TRACK_H, 10, 10)

        # ── white border on active range ─────────────────────────────────
        p.setBrush(Qt.BrushStyle.NoBrush)
        p.setPen(QColor(255, 255, 255, 160))

        # ── axis tick marks ───────────────────────────────────────────────
        p.setFont(QFont("Ubuntu", 8))
        p.setPen(QColor("#9E9E9E"))
        for t in [-10, 0, 10, 20, 30, 40, 45]:
            tx = self._x(t)
            p.drawLine(tx, bar_y + self.TRACK_H + 2, tx, bar_y + self.TRACK_H + 6)
            p.drawText(tx - 14, bar_y + self.TRACK_H + 8, 28, 14,
                       Qt.AlignmentFlag.AlignCenter, f"{t}°")

        # ── handles ───────────────────────────────────────────────────────
        for cx, val, label in [(cx_lo, self._lo, "MIN"), (cx_hi, self._hi, "MAX")]:
            # shadow
            p.setBrush(QColor(0, 0, 0, 30))
            p.setPen(Qt.PenStyle.NoPen)
            p.drawEllipse(cx - self.HANDLE_R + 1, cy - self.HANDLE_R + 1,
                          self.HANDLE_R * 2, self.HANDLE_R * 2)
            # white fill
            p.setBrush(QColor("white"))
            p.setPen(QColor("#2E7D32"))
            p.drawEllipse(cx - self.HANDLE_R, cy - self.HANDLE_R,
                          self.HANDLE_R * 2, self.HANDLE_R * 2)
            # temperature label above handle
            p.setFont(QFont("Ubuntu", 8, QFont.Weight.Bold))
            p.setPen(QColor("#1B5E20"))
            p.drawText(cx - 18, cy - self.HANDLE_R - 16, 36, 14,
                       Qt.AlignmentFlag.AlignCenter, f"{val}°C")

        p.end()

    # ── mouse ─────────────────────────────────────────────────────────────
    def mousePressEvent(self, ev):
        x     = int(ev.position().x())
        cx_lo = self._x(self._lo)
        cx_hi = self._x(self._hi)
        if abs(x - cx_lo) <= self.HANDLE_R + 4:
            self._drag = "lo"
        elif abs(x - cx_hi) <= self.HANDLE_R + 4:
            self._drag = "hi"

    def mouseMoveEvent(self, ev):
        if not self._drag:
            return
        t = self._temp(int(ev.position().x()))
        if self._drag == "lo":
            self._lo = min(t, self._hi - 1)
        else:
            self._hi = max(t, self._lo + 1)
        self.update()
        self.range_changed.emit(self._lo, self._hi)

    def mouseReleaseEvent(self, _):
        self._drag = None

    @property
    def lo(self) -> int: return self._lo

    @property
    def hi(self) -> int: return self._hi


# ── Classification logic ───────────────────────────────────────────────────────

def _classify(plant: dict, day_min: int, day_max: int, use_serre: bool) -> str | None:
    """Return 'vert', 'jaune', 'rouge', or None (no temp data)."""
    if use_serre:
        p_min = plant.get("temp_greenhouse_min")
        p_max = plant.get("temp_greenhouse_max")
    else:
        p_min = plant.get("temp_outdoor_min")
        p_max = plant.get("temp_outdoor_max")

    if p_min is None and p_max is None:
        return None

    p_min = p_min if p_min is not None else 0
    p_max = p_max if p_max is not None else 40

    # Red: even the warmest moment of the day is below the plant's minimum
    if day_max < p_min:
        return "rouge"

    # Green: whole day range fits within plant's comfort zone
    if day_min >= p_min and day_max <= p_max:
        return "vert"

    # Yellow: warm enough during the day but cold risk at night, or heat stress
    return "jaune"


# ── Dialog ────────────────────────────────────────────────────────────────────

_ZONE = {
    "vert":  ("🟢", "Peut aller dehors",    "#E8F5E9", "#2E7D32", "#A5D6A7"),
    "jaune": ("🟡", "Surveiller — risque",  "#FFFDE7", "#F57F17", "#FFE082"),
    "rouge": ("🔴", "Rester à l'abri",      "#FFEBEE", "#C62828", "#EF9A9A"),
}


class MeteoDialog(QDialog):
    def __init__(self, service, parent=None):
        super().__init__(parent)
        self.service    = service
        self._use_serre = False

        self.setWindowTitle("🌡️  Météo du jour")
        self.resize(640, 740)
        # non-modal: stays open while browsing cards
        self.setWindowFlags(
            Qt.WindowType.Window |
            Qt.WindowType.WindowCloseButtonHint |
            Qt.WindowType.WindowStaysOnTopHint
        )
        self.setStyleSheet("background:#F1F8E9;")
        self._build()
        self._refresh()

    # ── UI construction ───────────────────────────────────────────────────
    def _build(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(18, 18, 18, 18)
        root.setSpacing(12)

        # Title
        title = QLabel("🌡️  Que puis-je sortir aujourd'hui ?")
        title.setFont(QFont("Ubuntu", 15, QFont.Weight.Bold))
        title.setStyleSheet("color:#1B5E20;")
        root.addWidget(title)

        hint = QLabel(
            "Glissez les poignées pour régler la plage min/max du jour.\n"
            "L'app indique ce qui résiste à toute la plage de température."
        )
        hint.setStyleSheet("color:#558B2F; font-size:12px;")
        hint.setWordWrap(True)
        root.addWidget(hint)

        # ── Plein air / Sous abri toggle ──────────────────────────────────
        toggle = QFrame()
        toggle.setStyleSheet(
            "QFrame{background:white; border-radius:8px; border:1px solid #C8E6C9;}"
        )
        tl = QHBoxLayout(toggle)
        tl.setContentsMargins(8, 6, 8, 6)
        tl.setSpacing(6)
        self._btn_air   = QPushButton("🌳  Plein air")
        self._btn_serre = QPushButton("🏠  Sous abri")
        _btn_style = (
            "QPushButton{background:#F5F5F5; color:#555; border-radius:6px;"
            " border:1px solid #E0E0E0; padding:0 16px; font-weight:bold; height:32px;}"
            "QPushButton:checked{background:#2E7D32; color:white; border-color:#2E7D32;}"
            "QPushButton:hover:!checked{background:#E8F5E9;}"
        )
        for btn in (self._btn_air, self._btn_serre):
            btn.setCheckable(True)
            btn.setFixedHeight(34)
            btn.setStyleSheet(_btn_style)
            tl.addWidget(btn)
        self._btn_air.setChecked(True)
        self._btn_air.clicked.connect(lambda: self._set_mode(False))
        self._btn_serre.clicked.connect(lambda: self._set_mode(True))
        root.addWidget(toggle)

        # ── Slider frame ──────────────────────────────────────────────────
        sf = QFrame()
        sf.setStyleSheet(
            "QFrame{background:white; border-radius:10px; border:1px solid #C8E6C9;}"
        )
        sl = QVBoxLayout(sf)
        sl.setContentsMargins(18, 14, 18, 8)
        sl.setSpacing(4)

        hdr = QHBoxLayout()
        temp_title = QLabel("Plage de température du jour")
        temp_title.setFont(QFont("Ubuntu", 11, QFont.Weight.Bold))
        temp_title.setStyleSheet("color:#1B5E20; border:none;")
        hdr.addWidget(temp_title)
        hdr.addStretch()
        self._range_lbl = QLabel()
        self._range_lbl.setFont(QFont("Ubuntu", 14, QFont.Weight.Bold))
        self._range_lbl.setStyleSheet("color:#2E7D32; border:none;")
        hdr.addWidget(self._range_lbl)
        sl.addLayout(hdr)

        self._slider = TempRangeSlider(lo=8, hi=25)
        self._slider.range_changed.connect(self._on_range)
        sl.addWidget(self._slider)
        root.addWidget(sf)

        # ── Results ───────────────────────────────────────────────────────
        res_hdr = QLabel("Résultats")
        res_hdr.setFont(QFont("Ubuntu", 12, QFont.Weight.Bold))
        res_hdr.setStyleSheet("color:#1B5E20;")
        root.addWidget(res_hdr)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        self._body = QWidget()
        self._body_lay = QVBoxLayout(self._body)
        self._body_lay.setContentsMargins(0, 0, 4, 0)
        self._body_lay.setSpacing(10)
        scroll.setWidget(self._body)
        root.addWidget(scroll, 1)

        self._on_range(self._slider.lo, self._slider.hi)

    # ── slots ─────────────────────────────────────────────────────────────
    def _set_mode(self, use_serre: bool):
        self._use_serre = use_serre
        self._btn_air.setChecked(not use_serre)
        self._btn_serre.setChecked(use_serre)
        self._refresh()

    def _on_range(self, lo: int, hi: int):
        self._range_lbl.setText(f"Min {lo}°C  —  Max {hi}°C")
        self._refresh()

    # ── results rendering ─────────────────────────────────────────────────
    def _refresh(self):
        lo     = self._slider.lo
        hi     = self._slider.hi
        plants = self.service.get_all()

        buckets: dict[str, list] = {"vert": [], "jaune": [], "rouge": []}
        for p in plants:
            zone = _classify(p, lo, hi, self._use_serre)
            if zone:
                buckets[zone].append(p)

        # Clear previous results
        while self._body_lay.count():
            item = self._body_lay.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        for zone in ("vert", "jaune", "rouge"):
            self._add_zone(zone, buckets[zone])

        self._body_lay.addStretch()

    def _add_zone(self, zone: str, plants: list):
        if not plants:
            return
        emoji, label, bg, fg, border = _ZONE[zone]

        frame = QFrame()
        frame.setStyleSheet(
            f"QFrame{{background:{bg}; border-radius:10px; border:2px solid {border};}}"
        )
        fl = QVBoxLayout(frame)
        fl.setContentsMargins(14, 10, 14, 10)
        fl.setSpacing(4)

        # Zone header
        zh = QHBoxLayout()
        zt = QLabel(f"{emoji}  {label}")
        zt.setFont(QFont("Ubuntu", 11, QFont.Weight.Bold))
        zt.setStyleSheet(f"color:{fg}; background:transparent; border:none;")
        zh.addWidget(zt)
        zh.addStretch()
        cnt = QLabel(f"{len(plants)} plante(s)")
        cnt.setStyleSheet(f"color:{fg}; font-size:11px; background:transparent; border:none;")
        zh.addWidget(cnt)
        fl.addLayout(zh)

        # Separator
        sep = QFrame()
        sep.setFrameShape(QFrame.Shape.HLine)
        sep.setStyleSheet(f"color:{border}; border:none; background:{border};")
        sep.setFixedHeight(1)
        fl.addWidget(sep)

        use_serre  = self._use_serre
        min_col    = "temp_greenhouse_min" if use_serre else "temp_outdoor_min"
        max_col    = "temp_greenhouse_max" if use_serre else "temp_outdoor_max"

        for p in sorted(plants, key=lambda x: x["name"]):
            row = QHBoxLayout()
            row.setSpacing(6)

            name = QLabel(f"• {p['name']}")
            name.setStyleSheet(
                f"color:{fg}; font-size:12px; font-weight:bold;"
                " background:transparent; border:none;"
            )
            row.addWidget(name)
            row.addStretch()

            p_min = p.get(min_col)
            p_max = p.get(max_col)
            if p_min is not None or p_max is not None:
                mn = f"{int(p_min)}°C" if p_min is not None else "?"
                mx = f"{int(p_max)}°C" if p_max is not None else "?"
                tip = QLabel(f"{mn} → {mx}")
                tip.setStyleSheet(
                    f"color:{fg}; font-size:11px; background:transparent;"
                    " border:none;"
                )
                row.addWidget(tip)

            fl.addLayout(row)

        self._body_lay.addWidget(frame)
