# 📦 Guide d'installation — Jardinator v2.1.0

## ⚡ Installation rapide — paquet .deb (Debian/Ubuntu)

Le paquet `.deb` embarque **l'application web complète** (React buildé) avec un lanceur local.

### 1. Télécharger le paquet

Rendez-vous sur la page [Releases](https://github.com/nouhailler/jardinator/releases) et téléchargez `jardinator_2.1.0_all.deb`.

```bash
wget https://github.com/nouhailler/jardinator/releases/latest/download/jardinator_2.1.0_all.deb
```

### 2. Installer

```bash
sudo dpkg -i jardinator_2.1.0_all.deb
sudo apt-get install -f   # résoudre les dépendances si besoin
```

### 3. Lancer

```bash
jardinator
```

Ou via le menu **Applications → Éducation → Jardinator**.

L'application s'ouvre automatiquement dans votre navigateur sur **http://localhost:8765**.

### Désinstaller

```bash
sudo dpkg -r jardinator
```

---

## 🔧 Dépendances du paquet .deb

| Dépendance | Rôle |
|-----------|------|
| `python3 >= 3.10` | Serveur HTTP local (stdlib `http.server`) |
| `xdg-utils` | Ouverture du navigateur par défaut |

**Navigateur recommandé** : Firefox, Chromium ou tout navigateur moderne (ES2020+).

---

## 💡 Comment ça fonctionne ?

Le lanceur `jardinator` :
1. Démarre un serveur HTTP Python sur `http://127.0.0.1:8765`
2. Sert l'application React buildée depuis `/usr/lib/jardinator/`
3. Ouvre automatiquement votre navigateur par défaut
4. Si déjà lancé, ouvre simplement un nouvel onglet

Toutes vos données (plantes personnalisées, images, conseils IA, plan du potager) sont stockées dans le **localStorage** de votre navigateur — elles sont conservées entre les sessions.

---

## 🌐 Installation depuis les sources (version web)

```bash
# Prérequis : Node.js 18+ et npm 9+
git clone https://github.com/nouhailler/jardinator.git
cd jardinator/jardinator-web
npm install
npm run dev
# Ouvrir http://localhost:5173
```

---

## 🖥️ Version desktop Python/PyQt6 (legacy)

```bash
# Dépendances
sudo apt install python3-pyqt6 python3-requests
# ou avec pip :
pip install -r requirements.txt

# Lancer
cd jardinator
python3 main.py
```

---

## 📦 Construire le .deb soi-même

```bash
git clone https://github.com/nouhailler/jardinator.git
cd jardinator/jardinator-web
npm install && npm run build
cp -r dist/. ../debian/usr/lib/jardinator/
cd ..
dpkg-deb --build debian jardinator_2.1.0_all.deb
```

---

## 🐛 Dépannage

| Problème | Solution |
|---------|---------|
| Port 8765 déjà occupé | `kill $(cat /tmp/jardinator-server.pid)` puis relancer |
| Navigateur ne s'ouvre pas | Lancer manuellement `xdg-open http://localhost:8765` |
| `xdg-open: not found` | `sudo apt install xdg-utils` |
| Données perdues | Vérifier que vous utilisez bien le même navigateur |

---

## 🐛 Bugs / Support

- **Issues** : [GitHub Issues](https://github.com/nouhailler/jardinator/issues)
- **Releases** : [GitHub Releases](https://github.com/nouhailler/jardinator/releases)
