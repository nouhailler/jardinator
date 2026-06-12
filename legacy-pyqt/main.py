"""Point d'entrée de Jardinator."""
import sys
import logging
from PyQt6.QtWidgets import QApplication

from src.service import VegetableService
from src.ui.main_window import MainWindow

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("Jardinator")
    service = VegetableService()
    window = MainWindow(service)
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
