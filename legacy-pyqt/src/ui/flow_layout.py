"""FlowLayout — wrapping layout for PyQt6 (port of Qt official example)."""
from PyQt6.QtWidgets import QLayout, QWidgetItem
from PyQt6.QtCore import Qt, QRect, QPoint, QSize


class FlowLayout(QLayout):
    def __init__(self, parent=None, margin: int = 8, spacing: int = 8):
        super().__init__(parent)
        self._items: list = []
        self.setContentsMargins(margin, margin, margin, margin)
        self.setSpacing(spacing)

    def __del__(self):
        while self.count():
            self.takeAt(0)

    # ── QLayout interface ─────────────────────────────────────────────────────
    def addItem(self, item):
        self._items.append(item)

    def count(self) -> int:
        return len(self._items)

    def itemAt(self, index: int):
        if 0 <= index < len(self._items):
            return self._items[index]
        return None

    def takeAt(self, index: int):
        if 0 <= index < len(self._items):
            return self._items.pop(index)
        return None

    def expandingDirections(self):
        return Qt.Orientation(0)

    def hasHeightForWidth(self) -> bool:
        return True

    def heightForWidth(self, width: int) -> int:
        return self._do_layout(QRect(0, 0, width, 0), test_only=True)

    def setGeometry(self, rect: QRect):
        super().setGeometry(rect)
        self._do_layout(rect, test_only=False)

    def sizeHint(self) -> QSize:
        return self.minimumSize()

    def minimumSize(self) -> QSize:
        size = QSize()
        for item in self._items:
            size = size.expandedTo(item.minimumSize())
        m = self.contentsMargins()
        return size + QSize(m.left() + m.right(), m.top() + m.bottom())

    # ── internal ──────────────────────────────────────────────────────────────
    def _do_layout(self, rect: QRect, test_only: bool) -> int:
        m = self.contentsMargins()
        eff = rect.adjusted(m.left(), m.top(), -m.right(), -m.bottom())
        x = eff.x()
        y = eff.y()
        row_h = 0
        sp = self.spacing()

        for item in self._items:
            w = item.widget()
            if w and not w.isVisible():
                continue
            item_size = item.sizeHint()
            next_x = x + item_size.width() + sp

            if next_x - sp > eff.right() and row_h > 0:
                x = eff.x()
                y += row_h + sp
                next_x = x + item_size.width() + sp
                row_h = 0

            if not test_only:
                item.setGeometry(QRect(QPoint(x, y), item_size))

            x = next_x
            row_h = max(row_h, item_size.height())

        return y + row_h - rect.y() + m.bottom()
