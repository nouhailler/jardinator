"""DetailDialog — full-detail popup for one vegetable."""
import shutil
from pathlib import Path
from datetime import date

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QScrollArea, QWidget, QFrame, QGridLayout, QProgressDialog,
    QSizePolicy, QFileDialog,
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QPixmap, QFont

MONTHS_SHORT = {
    1: "Jan", 2: "Fév", 3: "Mar", 4: "Avr", 5: "Mai", 6: "Jun",
    7: "Jul", 8: "Aoû", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Déc",
}

_ACTIONS = [
    ("💡 Semis intérieur", "sowing_indoor",  "#42A5F5"),
    ("🌤 Semis extérieur", "sowing_outdoor", "#FFA726"),
    ("🌱 Plantation",      "planting",       "#66BB6A"),
    ("🍅 Récolte",         "harvest",        "#EF5350"),
]

_WATER = {"faible": ("💧",     "#B3E5FC", "#0277BD"),
          "moyen":  ("💧💧",   "#81D4FA", "#0277BD"),
          "élevé":  ("💧💧💧", "#29B6F6", "#01579B")}

_SUN   = {"plein soleil": ("☀️",  "#FFF9C4", "#F57F17"),
          "mi-ombre":      ("⛅",  "#FFF3E0", "#E65100"),
          "ombre":         ("🌑", "#ECEFF1", "#37474F")}


def _section(title: str) -> QLabel:
    lbl = QLabel(title)
    lbl.setFont(QFont("Ubuntu", 13, QFont.Weight.Bold))
    lbl.setStyleSheet("color: #2E7D32; padding-bottom: 4px;")
    return lbl


def _card_frame(bg="#FFFFFF") -> QFrame:
    f = QFrame()
    f.setStyleSheet(
        f"QFrame {{ background: {bg}; border-radius: 10px;"
        f" border: 1px solid #C8E6C9; }}"
    )
    return f


class DetailDialog(QDialog):
    def __init__(self, vegetable: dict, service, parent=None):
        super().__init__(parent)
        self.vegetable = vegetable
        self.service   = service
        self.setWindowTitle(f"🌱  {vegetable['name']}")
        self.setMinimumSize(750, 640)
        self.resize(820, 720)
        self.setStyleSheet("background: #F1F8E9;")
        self._build()

    # ── build ─────────────────────────────────────────────────────────────────
    def _build(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(0, 0, 0, 8)
        root.setSpacing(0)

        # Scrollable body
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        root.addWidget(scroll, 1)

        body = QWidget()
        body_lay = QVBoxLayout(body)
        body_lay.setContentsMargins(20, 20, 20, 12)
        body_lay.setSpacing(14)

        body_lay.addLayout(self._header_section())
        body_lay.addWidget(self._description_section())
        body_lay.addWidget(self._calendar_section())
        body_lay.addWidget(self._temperature_section())
        body_lay.addWidget(self._care_section())
        body_lay.addWidget(self._infos_complementaires_section())
        body_lay.addWidget(self._sous_varietes_section())
        body_lay.addWidget(self._type_semis_section())
        body_lay.addWidget(self._type_sol_section())
        body_lay.addWidget(self._compost_section())
        body_lay.addWidget(self._distances_section())
        body_lay.addWidget(self._associations_section())
        body_lay.addStretch()

        scroll.setWidget(body)

        # Close button
        close = QPushButton("Fermer")
        close.setFixedHeight(36)
        close.setStyleSheet("margin: 0 16px;")
        close.clicked.connect(self.accept)
        root.addWidget(close)

    # ── sections ──────────────────────────────────────────────────────────────
    def _header_section(self) -> QHBoxLayout:
        lay = QHBoxLayout()
        lay.setSpacing(20)

        # Plant image
        self.plant_img = QLabel()
        self.plant_img.setFixedSize(320, 230)
        self.plant_img.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.plant_img.setStyleSheet("border-radius: 12px; background: #C8E6C9;")
        self._reload_plant_image()
        lay.addWidget(self.plant_img)

        # Info column
        info = QVBoxLayout()
        info.setSpacing(8)

        name_lbl = QLabel(self.vegetable["name"])
        name_lbl.setFont(QFont("Ubuntu", 22, QFont.Weight.Bold))
        name_lbl.setStyleSheet("color: #1B5E20;")
        name_lbl.setWordWrap(True)
        info.addWidget(name_lbl)

        if sci := self.vegetable.get("scientific_name"):
            sci_lbl = QLabel(sci)
            sci_lbl.setFont(QFont("Ubuntu", 12))
            sci_lbl.setStyleSheet("color: #558B2F; font-style: italic;")
            info.addWidget(sci_lbl)

        badges_row = QHBoxLayout()
        badges_row.setSpacing(6)
        if grp := self.vegetable.get("groupe"):
            _GROUPE_COLORS = {
                "légume-feuille":  ("#E8F5E9", "#2E7D32"),
                "légume-racine":   ("#FFF3E0", "#E65100"),
                "légume-fruit":    ("#FCE4EC", "#C62828"),
                "légume-bulbe":    ("#F3E5F5", "#6A1B9A"),
                "légume-tige":     ("#E3F2FD", "#1565C0"),
                "cucurbitacée":    ("#FFFDE7", "#F57F17"),
                "aromatique":      ("#E0F7FA", "#00695C"),
                "légumineuse":     ("#F1F8E9", "#558B2F"),
                "condimentaire":   ("#FBE9E7", "#BF360C"),
            }
            bg, fg = _GROUPE_COLORS.get(grp, ("#F5F5F5", "#424242"))
            grp_lbl = QLabel(grp.capitalize())
            grp_lbl.setStyleSheet(
                f"background:{bg}; color:{fg}; border-radius:10px;"
                "padding:4px 12px; font-weight:bold; font-size:12px;"
            )
            grp_lbl.setSizePolicy(QSizePolicy.Policy.Maximum, QSizePolicy.Policy.Preferred)
            badges_row.addWidget(grp_lbl)
        if fam := self.vegetable.get("family"):
            fam_lbl = QLabel(f"Famille : {fam}")
            fam_lbl.setStyleSheet(
                "background:#E8F5E9; color:#2E7D32; border-radius:10px;"
                "padding:4px 12px; font-weight:bold; font-size:12px;"
            )
            fam_lbl.setSizePolicy(QSizePolicy.Policy.Maximum, QSizePolicy.Policy.Preferred)
            badges_row.addWidget(fam_lbl)
        badges_row.addStretch()
        info.addLayout(badges_row)

        # Seed image (small)
        seed_path = self.vegetable.get("seed_image_path")
        if seed_path and Path(seed_path).exists():
            seed_frame = _card_frame("#FAFFF8")
            sf_lay = QVBoxLayout(seed_frame)
            sf_lay.setContentsMargins(8, 8, 8, 8)
            seed_img = QLabel()
            seed_img.setFixedSize(110, 90)
            seed_img.setAlignment(Qt.AlignmentFlag.AlignCenter)
            px = QPixmap(seed_path).scaled(
                110, 90,
                Qt.AspectRatioMode.KeepAspectRatio,
                Qt.TransformationMode.SmoothTransformation,
            )
            seed_img.setPixmap(px)
            sf_lay.addWidget(seed_img)
            seed_caption = QLabel("Graine")
            seed_caption.setAlignment(Qt.AlignmentFlag.AlignCenter)
            seed_caption.setStyleSheet("color:#558B2F; font-size:11px;")
            sf_lay.addWidget(seed_caption)
            info.addWidget(seed_frame)

        info.addStretch()

        # Download button (Wikimedia)
        dl_btn = QPushButton("📥  Télécharger depuis Wikimedia")
        dl_btn.setStyleSheet(
            "QPushButton{background:#43A047;color:white;border-radius:8px;"
            "padding:8px 14px;font-weight:bold;}"
            "QPushButton:hover{background:#388E3C;}"
        )
        dl_btn.clicked.connect(self._download_images)
        info.addWidget(dl_btn)

        # Import button (local file)
        import_btn = QPushButton("📂  Choisir une image depuis le disque")
        import_btn.setStyleSheet(
            "QPushButton{background:#1565C0;color:white;border-radius:8px;"
            "padding:8px 14px;font-weight:bold;}"
            "QPushButton:hover{background:#0D47A1;}"
        )
        import_btn.clicked.connect(self._import_local_image)
        info.addWidget(import_btn)

        lay.addLayout(info)
        return lay

    def _description_section(self) -> QFrame:
        desc = self.vegetable.get("description", "")
        if not desc:
            f = QFrame()
            f.hide()
            return f
        frame = _card_frame()
        lay = QVBoxLayout(frame)
        lay.addWidget(_section("Description"))
        lbl = QLabel(desc)
        lbl.setWordWrap(True)
        lbl.setStyleSheet("color:#33691E; line-height:1.5;")
        lay.addWidget(lbl)
        return frame

    def _calendar_section(self) -> QFrame:
        frame = _card_frame()
        lay = QVBoxLayout(frame)
        lay.addWidget(_section("Calendrier de culture"))
        lay.addWidget(self._build_month_grid())
        return frame

    def _build_month_grid(self) -> QWidget:
        w = QWidget()
        grid = QGridLayout(w)
        grid.setSpacing(3)
        grid.setContentsMargins(0, 0, 0, 0)

        cur = date.today().month

        # Month headers
        for col, m in enumerate(MONTHS_SHORT.values()):
            lbl = QLabel(m)
            lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            lbl.setFixedWidth(42)
            if col + 1 == cur:
                lbl.setStyleSheet(
                    "color:#1B5E20; font-size:10px; font-weight:bold;"
                    "background:#C8E6C9; border-radius:4px;"
                )
            else:
                lbl.setStyleSheet("color:#81C784; font-size:10px;")
            grid.addWidget(lbl, 0, col + 1)

        for row, (label, key, color) in enumerate(_ACTIONS, start=1):
            # Row label
            row_lbl = QLabel(label)
            row_lbl.setStyleSheet("color:#33691E; font-size:11px; padding-right:6px;")
            row_lbl.setFixedWidth(130)
            grid.addWidget(row_lbl, row, 0)

            months_set = set(self.vegetable.get(key, []))
            for col, month_num in enumerate(range(1, 13)):
                cell = QLabel()
                cell.setFixedSize(42, 22)
                cell.setAlignment(Qt.AlignmentFlag.AlignCenter)

                is_cur = (month_num == cur)
                if month_num in months_set:
                    border = "border:2px solid #1B5E20;" if is_cur else ""
                    cell.setText("●")
                    cell.setStyleSheet(
                        f"background:{color};border-radius:4px;"
                        f"color:white;font-size:10px;{border}"
                    )
                else:
                    bg = "#E8F5E9" if is_cur else "#F5F5F5"
                    border = "border:1px solid #A5D6A7;" if is_cur else ""
                    cell.setStyleSheet(f"background:{bg};border-radius:4px;{border}")

                grid.addWidget(cell, row, col + 1)

        return w

    def _temperature_section(self) -> QFrame:
        frame = _card_frame()
        lay = QVBoxLayout(frame)
        lay.addWidget(_section("Températures"))

        grid = QGridLayout()
        grid.setSpacing(10)

        rows = [
            ("🌳 Extérieur — min", self.vegetable.get("temp_outdoor_min")),
            ("🌳 Extérieur — max", self.vegetable.get("temp_outdoor_max")),
            ("🏠 Serre — min",     self.vegetable.get("temp_greenhouse_min")),
            ("🏠 Serre — max",     self.vegetable.get("temp_greenhouse_max")),
        ]
        for i, (label, val) in enumerate(rows):
            lbl = QLabel(label)
            lbl.setStyleSheet("color:#33691E; font-weight:bold;")
            grid.addWidget(lbl, i, 0)

            if val is None:
                txt, fg, bg = "—", "#9E9E9E", "#F5F5F5"
            elif val <= 5:
                txt, fg, bg = f"{val} °C", "#1565C0", "#E3F2FD"
            elif val <= 15:
                txt, fg, bg = f"{val} °C", "#0277BD", "#E1F5FE"
            elif val <= 25:
                txt, fg, bg = f"{val} °C", "#2E7D32", "#E8F5E9"
            else:
                txt, fg, bg = f"{val} °C", "#E65100", "#FFF3E0"

            val_lbl = QLabel(txt)
            val_lbl.setStyleSheet(
                f"background:{bg};color:{fg};border-radius:8px;"
                f"padding:4px 14px;border:1px solid #C8E6C9;"
                f"font-weight:bold;font-size:14px;"
            )
            val_lbl.setSizePolicy(QSizePolicy.Policy.Maximum, QSizePolicy.Policy.Preferred)
            grid.addWidget(val_lbl, i, 1)

        lay.addLayout(grid)
        return frame

    def _care_section(self) -> QFrame:
        frame = _card_frame()
        lay = QVBoxLayout(frame)
        lay.addWidget(_section("Soins"))

        row = QHBoxLayout()
        row.setSpacing(12)

        water = self.vegetable.get("water_needs", "moyen")
        w_icon, w_bg, w_fg = _WATER.get(water, _WATER["moyen"])
        w_frame = _card_frame(w_bg)
        wl = QVBoxLayout(w_frame)
        wl.setContentsMargins(14, 10, 14, 10)
        wi = QLabel(w_icon)
        wi.setFont(QFont("Ubuntu", 20))
        wi.setAlignment(Qt.AlignmentFlag.AlignCenter)
        wl.addWidget(wi)
        wl.addWidget(self._badge(f"Eau : {water}", w_fg, w_bg))
        row.addWidget(w_frame)

        sun = self.vegetable.get("sun", "plein soleil")
        s_icon, s_bg, s_fg = _SUN.get(sun, _SUN["plein soleil"])
        s_frame = _card_frame(s_bg)
        sl = QVBoxLayout(s_frame)
        sl.setContentsMargins(14, 10, 14, 10)
        si = QLabel(s_icon)
        si.setFont(QFont("Ubuntu", 20))
        si.setAlignment(Qt.AlignmentFlag.AlignCenter)
        sl.addWidget(si)
        sl.addWidget(self._badge(f"Soleil : {sun}", s_fg, s_bg))
        row.addWidget(s_frame)

        row.addStretch()
        lay.addLayout(row)
        return frame

    def _infos_complementaires_section(self) -> QFrame:
        prof      = self.vegetable.get("profondeur_semis_cm")
        gmin      = self.vegetable.get("germination_jours_min")
        gmax      = self.vegetable.get("germination_jours_max")
        haut      = self.vegetable.get("hauteur_plants_cm")
        f_germ    = self.vegetable.get("facilite_germination")
        f_cult    = self.vegetable.get("facilite_culture")
        bisann    = self.vegetable.get("bisannuelle", 0)

        if not any([prof is not None, gmin, haut, f_germ, f_cult]):
            f = QFrame()
            f.hide()
            return f

        frame = _card_frame()
        lay = QVBoxLayout(frame)
        lay.addWidget(_section("Informations complémentaires"))

        grid = QGridLayout()
        grid.setSpacing(10)
        grid.setColumnStretch(1, 1)
        grid.setColumnStretch(3, 1)

        _DIFFICULTY_COLORS = {
            "Facile":    ("#E8F5E9", "#2E7D32"),
            "Moyenne":   ("#FFF8E1", "#E65100"),
            "Difficile": ("#FFEBEE", "#C62828"),
        }

        def _info_row(row, col_offset, icon, label, value_widget):
            icon_lbl = QLabel(icon + "  " + label)
            icon_lbl.setStyleSheet("color:#33691E; font-weight:bold; font-size:12px;")
            grid.addWidget(icon_lbl, row, col_offset)
            grid.addWidget(value_widget, row, col_offset + 1)

        def _val(text, bg="#F5F5F5", fg="#424242"):
            lbl = QLabel(text)
            lbl.setStyleSheet(
                f"background:{bg}; color:{fg}; border-radius:6px;"
                f" padding:3px 10px; font-weight:bold; font-size:12px;"
            )
            lbl.setSizePolicy(QSizePolicy.Policy.Maximum, QSizePolicy.Policy.Preferred)
            return lbl

        row = 0
        if prof is not None:
            txt = "Surface" if prof == 0 else f"{prof:g} cm"
            _info_row(row, 0, "📏", "Profondeur de semis", _val(txt, "#E3F2FD", "#1565C0"))

        if gmin and gmax:
            germi_txt = f"{gmin}–{gmax} jours"
            _info_row(row, 2, "🌡️", "Germination", _val(germi_txt, "#F3E5F5", "#6A1B9A"))
        row += 1

        if haut:
            _info_row(row, 0, "📐", "Hauteur adulte", _val(f"{haut} cm", "#E8F5E9", "#2E7D32"))

        if f_germ:
            bg, fg = _DIFFICULTY_COLORS.get(f_germ, ("#F5F5F5", "#424242"))
            _info_row(row, 2, "🌱", "Facilité de germination", _val(f_germ, bg, fg))
        row += 1

        if f_cult:
            bg, fg = _DIFFICULTY_COLORS.get(f_cult, ("#F5F5F5", "#424242"))
            _info_row(row, 0, "👨‍🌾", "Facilité de culture", _val(f_cult, bg, fg))

        if bisann:
            row += 1
            _info_row(row, 0, "📅", "Cycle", _val("Bisannuelle", "#FFF3E0", "#E65100"))

        lay.addLayout(grid)
        return frame

    def _sous_varietes_section(self) -> QFrame:
        varietes = self.vegetable.get("sous_varietes", [])
        if not varietes:
            f = QFrame()
            f.hide()
            return f

        frame = _card_frame()
        lay = QVBoxLayout(frame)
        lay.addWidget(_section("Sous-variétés et cultivars"))

        flow = QHBoxLayout()
        flow.setSpacing(6)
        flow.setContentsMargins(0, 0, 0, 0)
        for v in varietes:
            badge = QLabel(v)
            badge.setStyleSheet(
                "background:#E8F5E9; color:#1B5E20; border-radius:12px;"
                " padding:4px 12px; font-size:12px; border:1px solid #A5D6A7;"
            )
            flow.addWidget(badge)
        flow.addStretch()
        lay.addLayout(flow)
        return frame

    def _type_semis_section(self) -> QFrame:
        poquet  = self.vegetable.get("semis_poquet", 0)
        ligne   = self.vegetable.get("semis_ligne", 0)
        volee   = self.vegetable.get("semis_volee", 0)
        surface = self.vegetable.get("semis_surface", 0)

        if not any([poquet, ligne, volee, surface]):
            f = QFrame()
            f.hide()
            return f

        frame = _card_frame()
        lay = QVBoxLayout(frame)
        lay.addWidget(_section("Type de semis"))

        row = QHBoxLayout()
        row.setSpacing(8)

        methods = [
            ("🕳️", "En poquet",   poquet,  "#E8F5E9", "#2E7D32", "#C8E6C9", "#9E9E9E"),
            ("➖", "En ligne",    ligne,   "#E8F5E9", "#2E7D32", "#C8E6C9", "#9E9E9E"),
            ("🌬️", "À la volée",  volee,   "#E8F5E9", "#2E7D32", "#C8E6C9", "#9E9E9E"),
            ("🫙", "En surface",  surface, "#E8F5E9", "#2E7D32", "#C8E6C9", "#9E9E9E"),
        ]
        for icon, label, active, bg_on, fg_on, border_on, fg_off in methods:
            card = QFrame()
            card.setStyleSheet(
                f"QFrame {{ background:{'#E8F5E9' if active else '#F5F5F5'};"
                f" border-radius:8px; border:2px solid {'#A5D6A7' if active else '#E0E0E0'}; }}"
            )
            cl = QVBoxLayout(card)
            cl.setContentsMargins(12, 8, 12, 8)
            cl.setSpacing(3)
            il = QLabel(icon)
            il.setFont(QFont("Ubuntu", 18))
            il.setAlignment(Qt.AlignmentFlag.AlignCenter)
            cl.addWidget(il)
            tl = QLabel(label)
            tl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            tl.setStyleSheet(f"color:{'#2E7D32' if active else '#BDBDBD'}; font-size:11px; font-weight:bold;")
            cl.addWidget(tl)
            vl = QLabel("✓ Oui" if active else "✗ Non")
            vl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            vl.setStyleSheet(f"color:{'#1B5E20' if active else '#BDBDBD'}; font-size:11px;")
            cl.addWidget(vl)
            row.addWidget(card)

        row.addStretch()
        lay.addLayout(row)
        return frame

    def _type_sol_section(self) -> QFrame:
        sols = self.vegetable.get("type_sol", [])
        if not sols:
            f = QFrame()
            f.hide()
            return f

        frame = _card_frame()
        lay = QVBoxLayout(frame)
        lay.addWidget(_section("Type de sol"))

        _SOL_STYLE = {
            "frais et bien drainé": ("🌊", "#E3F2FD", "#1565C0"),
            "humide":               ("💧", "#E1F5FE", "#0277BD"),
            "sec":                  ("🏜️", "#FFF8E1", "#F57F17"),
        }

        row = QHBoxLayout()
        row.setSpacing(10)
        for sol in sols:
            icon, bg, fg = _SOL_STYLE.get(sol, ("🌱", "#F5F5F5", "#424242"))
            card = _card_frame(bg)
            cl = QVBoxLayout(card)
            cl.setContentsMargins(14, 10, 14, 10)
            cl.setSpacing(4)
            il = QLabel(icon)
            il.setFont(QFont("Ubuntu", 22))
            il.setAlignment(Qt.AlignmentFlag.AlignCenter)
            cl.addWidget(il)
            tl = QLabel(sol.capitalize())
            tl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            tl.setStyleSheet(f"color:{fg}; font-size:12px; font-weight:bold;")
            cl.addWidget(tl)
            row.addWidget(card)

        row.addStretch()
        lay.addLayout(row)
        return frame

    def _compost_section(self) -> QFrame:
        compost = self.vegetable.get("compost_type")
        if not compost:
            f = QFrame()
            f.hide()
            return f

        _COMPOST = {
            "peu exigeant bactérien":  ("🦠", "#F3E5F5", "#6A1B9A",
                                        "Peu exigeant", "Compost bactérien",
                                        "Légumineuses, racines — sol peu enrichi"),
            "exigeant bactérien":      ("🦠", "#EDE7F6", "#4527A0",
                                        "Exigeant", "Compost bactérien",
                                        "Légumes-feuilles et fruits — sol riche"),
            "peu exigeant fongique":   ("🍄", "#E8F5E9", "#2E7D32",
                                        "Peu exigeant", "Compost fongique",
                                        "Vivaces, aromatiques — sol pauvre toléré"),
            "exigeant fongique":       ("🍄", "#F1F8E9", "#33691E",
                                        "Exigeant", "Compost fongique",
                                        "Ligneux, arbustifs — mycorhizes importantes"),
        }

        icon, bg, fg, niveau, dom, desc = _COMPOST.get(
            compost, ("🌱", "#F5F5F5", "#424242", compost, "", "")
        )

        frame = _card_frame()
        lay = QVBoxLayout(frame)
        lay.addWidget(_section("Compost"))

        card = _card_frame(bg)
        cl = QHBoxLayout(card)
        cl.setContentsMargins(16, 12, 16, 12)
        cl.setSpacing(14)

        il = QLabel(icon)
        il.setFont(QFont("Ubuntu", 32))
        il.setAlignment(Qt.AlignmentFlag.AlignCenter)
        il.setFixedWidth(50)
        cl.addWidget(il)

        info = QVBoxLayout()
        info.setSpacing(3)
        niv_lbl = QLabel(niveau)
        niv_lbl.setFont(QFont("Ubuntu", 14, QFont.Weight.Bold))
        niv_lbl.setStyleSheet(f"color:{fg};")
        info.addWidget(niv_lbl)
        dom_lbl = QLabel(dom)
        dom_lbl.setFont(QFont("Ubuntu", 11, QFont.Weight.Bold))
        dom_lbl.setStyleSheet(f"color:{fg}; opacity:0.8;")
        info.addWidget(dom_lbl)
        if desc:
            desc_lbl = QLabel(desc)
            desc_lbl.setStyleSheet("color:#558B2F; font-size:11px; font-style:italic;")
            desc_lbl.setWordWrap(True)
            info.addWidget(desc_lbl)
        cl.addLayout(info)

        lay.addWidget(card)
        return frame

    def _distances_section(self) -> QFrame:
        rang   = self.vegetable.get("distance_rang_cm")
        rangs  = self.vegetable.get("distance_rangs_cm")
        eclair = self.vegetable.get("eclaircissage_cm")

        if rang is None and rangs is None:
            f = QFrame()
            f.hide()
            return f

        frame = _card_frame()
        lay = QVBoxLayout(frame)
        lay.addWidget(_section("Distances de plantation"))

        row = QHBoxLayout()
        row.setSpacing(12)

        def _dist_card(icon, title, value_cm, color_bg, color_fg) -> QFrame:
            card = _card_frame(color_bg)
            cl = QVBoxLayout(card)
            cl.setContentsMargins(14, 10, 14, 10)
            cl.setSpacing(4)
            icon_lbl = QLabel(icon)
            icon_lbl.setFont(QFont("Ubuntu", 22))
            icon_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            cl.addWidget(icon_lbl)
            title_lbl = QLabel(title)
            title_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            title_lbl.setStyleSheet(f"color:{color_fg}; font-size:11px; font-weight:bold;")
            cl.addWidget(title_lbl)
            val_text = f"{int(value_cm)} cm" if value_cm is not None else "—"
            val_lbl = QLabel(val_text)
            val_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            val_lbl.setStyleSheet(
                f"color:{color_fg}; font-size:18px; font-weight:bold;"
                f" background:{color_bg}; border-radius:8px; padding:4px 12px;"
            )
            cl.addWidget(val_lbl)
            return card

        row.addWidget(_dist_card("↔️", "Sur le rang", rang, "#E8F5E9", "#2E7D32"))
        row.addWidget(_dist_card("↕️", "Entre les rangs", rangs, "#E3F2FD", "#1565C0"))

        if eclair is not None:
            row.addWidget(_dist_card("✂️", "Éclaircissage", eclair, "#FFF8E1", "#E65100"))
        else:
            no_card = _card_frame("#F5F5F5")
            nl = QVBoxLayout(no_card)
            nl.setContentsMargins(14, 10, 14, 10)
            nl.setSpacing(4)
            ni = QLabel("✂️")
            ni.setFont(QFont("Ubuntu", 22))
            ni.setAlignment(Qt.AlignmentFlag.AlignCenter)
            nl.addWidget(ni)
            nt = QLabel("Éclaircissage")
            nt.setAlignment(Qt.AlignmentFlag.AlignCenter)
            nt.setStyleSheet("color:#9E9E9E; font-size:11px; font-weight:bold;")
            nl.addWidget(nt)
            nv = QLabel("Non requis")
            nv.setAlignment(Qt.AlignmentFlag.AlignCenter)
            nv.setStyleSheet(
                "color:#9E9E9E; font-size:13px; font-style:italic;"
                " background:#F5F5F5; border-radius:8px; padding:4px 12px;"
            )
            nl.addWidget(nv)
            row.addWidget(no_card)

        row.addStretch()
        lay.addLayout(row)
        return frame

    def _associations_section(self) -> QFrame:
        favorables  = self.vegetable.get("associations_favorables", [])
        defavorables = self.vegetable.get("associations_defavorables", [])
        if not favorables and not defavorables:
            f = QFrame()
            f.hide()
            return f

        frame = _card_frame()
        lay = QVBoxLayout(frame)
        lay.addWidget(_section("Associations"))

        row = QHBoxLayout()
        row.setSpacing(12)

        # Favorable companions
        fav_frame = _card_frame("#F1F8E9")
        fav_lay = QVBoxLayout(fav_frame)
        fav_lay.setContentsMargins(12, 10, 12, 10)
        fav_lay.setSpacing(6)
        fav_title = QLabel("✅  Associations favorables")
        fav_title.setFont(QFont("Ubuntu", 10, QFont.Weight.Bold))
        fav_title.setStyleSheet("color:#2E7D32;")
        fav_lay.addWidget(fav_title)
        if favorables:
            for name in favorables:
                lbl = QLabel(f"• {name}")
                lbl.setStyleSheet("color:#33691E; font-size:12px;")
                fav_lay.addWidget(lbl)
        else:
            lbl = QLabel("Aucune association connue")
            lbl.setStyleSheet("color:#9E9E9E; font-style:italic; font-size:12px;")
            fav_lay.addWidget(lbl)
        fav_lay.addStretch()
        row.addWidget(fav_frame)

        # Unfavorable companions
        def_frame = _card_frame("#FFF8F8")
        def_lay = QVBoxLayout(def_frame)
        def_lay.setContentsMargins(12, 10, 12, 10)
        def_lay.setSpacing(6)
        def_title = QLabel("❌  Associations défavorables")
        def_title.setFont(QFont("Ubuntu", 10, QFont.Weight.Bold))
        def_title.setStyleSheet("color:#C62828;")
        def_lay.addWidget(def_title)
        if defavorables:
            for name in defavorables:
                lbl = QLabel(f"• {name}")
                lbl.setStyleSheet("color:#B71C1C; font-size:12px;")
                def_lay.addWidget(lbl)
        else:
            lbl = QLabel("Aucune association connue")
            lbl.setStyleSheet("color:#9E9E9E; font-style:italic; font-size:12px;")
            def_lay.addWidget(lbl)
        def_lay.addStretch()
        row.addWidget(def_frame)

        lay.addLayout(row)
        return frame

    @staticmethod
    def _badge(text: str, fg: str, bg: str) -> QLabel:
        lbl = QLabel(text)
        lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        lbl.setStyleSheet(
            f"color:{fg};background:{bg};border-radius:8px;"
            f"padding:3px 10px;font-weight:bold;font-size:12px;"
        )
        return lbl

    # ── image helpers ─────────────────────────────────────────────────────────
    def _reload_plant_image(self):
        path = self.vegetable.get("image_path")
        if path and Path(path).exists():
            px = QPixmap(path)
            if not px.isNull():
                px = px.scaled(
                    320, 230,
                    Qt.AspectRatioMode.KeepAspectRatioByExpanding,
                    Qt.TransformationMode.SmoothTransformation,
                )
                x = max(0, (px.width()  - 320) // 2)
                y = max(0, (px.height() - 230) // 2)
                self.plant_img.setPixmap(px.copy(x, y, 320, 230))
                return
        self.plant_img.setText(f"📷\n{self.vegetable['name']}")
        self.plant_img.setStyleSheet(
            "background:#C8E6C9;border-radius:12px;color:#2E7D32;font-size:16px;"
        )

    def _download_images(self):
        vid = self.vegetable["id"]
        dlg = QProgressDialog("Téléchargement…", "Annuler", 0, 2, self)
        dlg.setWindowTitle("📥 Wikimedia")
        dlg.setWindowModality(Qt.WindowModality.WindowModal)
        dlg.show()

        dlg.setValue(0)
        dlg.setLabelText(f"Image de {self.vegetable['name']}…")
        self.service.download_image_wikimedia(
            vid, self.vegetable["name"],
            self.vegetable.get("wikimedia_image") or self.vegetable["name"],
            is_seed=False,
        )

        if not dlg.wasCanceled():
            dlg.setValue(1)
            dlg.setLabelText("Image de la graine…")
            if self.vegetable.get("wikimedia_seed"):
                self.service.download_image_wikimedia(
                    vid, self.vegetable["name"],
                    self.vegetable["wikimedia_seed"],
                    is_seed=True,
                )

        dlg.setValue(2)
        self.vegetable = self.service.get_by_id(vid)
        self._reload_plant_image()

    def _import_local_image(self):
        path, _ = QFileDialog.getOpenFileName(
            self,
            "Choisir une image pour ce légume",
            str(Path.home()),
            "Images (*.jpg *.jpeg *.png *.webp *.bmp)",
        )
        if not path:
            return

        from ..database import IMAGES_DIR

        src = Path(path)
        safe_name = self.vegetable["name"].replace(" ", "_").replace("/", "_")
        dest = IMAGES_DIR / f"{safe_name}.jpg"

        try:
            shutil.copy2(src, dest)
        except Exception as exc:
            from PyQt6.QtWidgets import QMessageBox
            QMessageBox.warning(self, "Erreur", f"Impossible de copier le fichier :\n{exc}")
            return

        vid = self.vegetable["id"]
        self.service.db.update_image_path(vid, str(dest), is_seed=False)
        self.vegetable = self.service.get_by_id(vid)
        self._reload_plant_image()
