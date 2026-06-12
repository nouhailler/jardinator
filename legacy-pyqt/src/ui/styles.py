"""Application stylesheet — garden/nature theme."""

MAIN_STYLE = """
QMainWindow, QWidget {
    background-color: #F1F8E9;
    font-family: 'Ubuntu', 'Segoe UI', 'Noto Sans', sans-serif;
    font-size: 13px;
    color: #1B5E20;
}

/* ── Search bar ─────────────────────────────────── */
QLineEdit#searchBar {
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.6);
    border-radius: 20px;
    padding: 7px 16px;
    font-size: 14px;
    font-weight: bold;
    color: white;
}
QLineEdit#searchBar:focus {
    border-color: white;
    background: rgba(255, 255, 255, 0.25);
}

/* ── Tab widget ─────────────────────────────────── */
QTabWidget::pane {
    border: none;
    background: #F1F8E9;
}
QTabBar::tab {
    background: #C8E6C9;
    color: #2E7D32;
    padding: 9px 20px;
    margin-right: 4px;
    border-radius: 8px 8px 0 0;
    font-weight: bold;
    font-size: 13px;
}
QTabBar::tab:selected {
    background: #2E7D32;
    color: white;
}
QTabBar::tab:hover:!selected {
    background: #A5D6A7;
}

/* ── Buttons ────────────────────────────────────── */
QPushButton {
    background: #2E7D32;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-weight: bold;
    font-size: 13px;
}
QPushButton:hover  { background: #388E3C; }
QPushButton:pressed{ background: #1B5E20; }

QPushButton#secondaryBtn {
    background: #81C784;
    color: #1B5E20;
}
QPushButton#secondaryBtn:hover { background: #66BB6A; }

QPushButton#navBtn {
    background: #E8F5E9;
    color: #2E7D32;
    border: 1px solid #A5D6A7;
    padding: 6px 12px;
    font-size: 14px;
    font-weight: bold;
}
QPushButton#navBtn:hover { background: #C8E6C9; }

/* ── Scroll bars ────────────────────────────────── */
QScrollArea { border: none; background: transparent; }
QScrollBar:vertical {
    background: #E8F5E9;
    width: 8px;
    border-radius: 4px;
    margin: 0;
}
QScrollBar::handle:vertical {
    background: #A5D6A7;
    border-radius: 4px;
    min-height: 30px;
}
QScrollBar::handle:vertical:hover { background: #66BB6A; }
QScrollBar::add-line:vertical,
QScrollBar::sub-line:vertical { height: 0; }

/* ── ComboBox ───────────────────────────────────── */
QComboBox {
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.6);
    border-radius: 8px;
    padding: 5px 10px;
    color: white;
    font-weight: bold;
    min-height: 30px;
}
QComboBox:focus { border-color: white; }
QComboBox::drop-down { border: none; width: 24px; }
QComboBox QAbstractItemView {
    background: white;
    selection-background-color: #C8E6C9;
    selection-color: #1B5E20;
    color: #1B5E20;
    border: 1px solid #A5D6A7;
}

/* ── Progress bar ───────────────────────────────── */
QProgressBar {
    border: 1px solid #A5D6A7;
    border-radius: 6px;
    background: #E8F5E9;
    text-align: center;
    color: #1B5E20;
    min-height: 20px;
}
QProgressBar::chunk {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
        stop:0 #43A047, stop:1 #66BB6A);
    border-radius: 5px;
}

/* ── Dialog ─────────────────────────────────────── */
QDialog {
    background: #F1F8E9;
}

/* ── Status bar ─────────────────────────────────── */
QStatusBar {
    background: #E8F5E9;
    color: #558B2F;
    font-size: 12px;
    border-top: 1px solid #C8E6C9;
}
"""
