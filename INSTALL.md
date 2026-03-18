# 🌱 Installation de Jardinator

## ⚡ Installation rapide (paquet .deb)

La méthode recommandée pour Debian / Ubuntu et leurs dérivés.

### 1. Télécharger le paquet

Rendez-vous sur la page [Releases](https://github.com/nouhailler/jardinator/releases) et téléchargez le fichier `jardinator_1.0.0_amd64.deb`.

### 2. Installer le paquet

```bash
sudo dpkg -i jardinator_1.0.0_amd64.deb
```

Si des dépendances sont manquantes, corrigez-les automatiquement :

```bash
sudo apt-get install -f
```

### 3. Lancer l'application

```bash
jardinator
```

Ou via le menu **Applications → Éducation → Jardinator**.

### Désinstaller

```bash
sudo dpkg -r jardinator
```

---

## 🛠️ Installation manuelle (depuis les sources)

Pour toutes les distributions Linux, ou si vous souhaitez modifier le code.

### Prérequis

| Dépendance | Version minimale | Installation |
|---|---|---|
| Python | 3.10+ | Inclus sur la plupart des distributions |
| PyQt6 | 6.x | `pip install PyQt6` ou `sudo apt install python3-pyqt6` |
| requests | 2.x | `pip install requests` ou `sudo apt install python3-requests` |

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/nouhailler/jardinator.git
cd jardinator

# 2. (Optionnel) Créer un environnement virtuel
python3 -m venv .venv
source .venv/bin/activate

# 3. Installer les dépendances Python
pip install PyQt6 requests

# 4. Lancer l'application
python3 main.py
```

### Mise à jour

```bash
git pull
python3 main.py
```

---

## 📦 Construire le paquet .deb soi-même

```bash
git clone https://github.com/nouhailler/jardinator.git
cd jardinator
./build_deb.sh
```

Le fichier `jardinator_1.0.0_amd64.deb` est généré à la racine du projet.

---

## 📁 Données utilisateur

Les données sont stockées dans votre dossier personnel et **ne sont jamais supprimées** lors d'une désinstallation :

```
~/.local/share/jardinator/
├── jardinator.db    ← base de données SQLite
└── images/          ← images téléchargées ou importées
```

Pour réinitialiser complètement l'application :

```bash
rm -rf ~/.local/share/jardinator/
```

---

## 🐛 Problèmes connus

| Problème | Solution |
|---|---|
| `ModuleNotFoundError: No module named 'PyQt6'` | `pip install PyQt6` ou `sudo apt install python3-pyqt6` |
| `ModuleNotFoundError: No module named 'requests'` | `pip install requests` |
| Fenêtre vide au démarrage | Vérifier que Python ≥ 3.10 : `python3 --version` |
| Images non téléchargées | Vérifier la connexion Internet — les images viennent de Wikimedia Commons |
