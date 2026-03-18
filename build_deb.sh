#!/bin/bash
# build_deb.sh — Construit le paquet .deb de Jardinator
set -e

VERSION="1.0.0"
ARCH="amd64"
PKG_NAME="jardinator_${VERSION}_${ARCH}"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$ROOT_DIR/debian"
OUT_DEB="$ROOT_DIR/${PKG_NAME}.deb"

echo "🌱 Construction du paquet Jardinator v${VERSION}..."

# ── Mettre à jour les fichiers Python dans le paquet ─────────────────────────
echo "📂 Synchronisation des sources..."
LIB="$BUILD_DIR/usr/lib/jardinator"

cp "$ROOT_DIR/main.py"  "$LIB/"
cp "$ROOT_DIR"/*.json   "$LIB/"

cp "$ROOT_DIR/src/__init__.py"  "$LIB/src/"
cp "$ROOT_DIR/src/database.py"  "$LIB/src/"
cp "$ROOT_DIR/src/service.py"   "$LIB/src/"
cp "$ROOT_DIR/src/data/__init__.py" "$LIB/src/data/"

for f in __init__ calendar_widget detail_dialog flow_layout \
         help_dialog main_window meteo_dialog styles vegetable_card; do
    cp "$ROOT_DIR/src/ui/${f}.py" "$LIB/src/ui/"
done

# ── Permissions ───────────────────────────────────────────────────────────────
chmod 755 "$BUILD_DIR/DEBIAN/postinst"
chmod 755 "$BUILD_DIR/usr/bin/jardinator"
find "$BUILD_DIR/usr/lib" -name "*.py" -exec chmod 644 {} \;
find "$BUILD_DIR/usr/share" -type f   -exec chmod 644 {} \;
find "$BUILD_DIR/usr/share" -type d   -exec chmod 755 {} \;

# ── Calcul de la taille installée ─────────────────────────────────────────────
INSTALLED_SIZE=$(du -sk "$BUILD_DIR/usr" | cut -f1)
sed -i "s/^Installed-Size:.*/Installed-Size: $INSTALLED_SIZE/" "$BUILD_DIR/DEBIAN/control" 2>/dev/null || \
    echo "Installed-Size: $INSTALLED_SIZE" >> "$BUILD_DIR/DEBIAN/control"

# ── Construction du .deb ──────────────────────────────────────────────────────
echo "📦 Création du paquet .deb..."
fakeroot dpkg-deb --build "$BUILD_DIR" "$OUT_DEB"

echo ""
echo "✅  Paquet créé : $OUT_DEB"
echo "   Installer avec : sudo dpkg -i ${PKG_NAME}.deb"
