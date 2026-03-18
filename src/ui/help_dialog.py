"""HelpDialog — documentation complète de l'application Jardinator."""
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QScrollArea, QWidget, QFrame, QTabWidget,
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont


# ── helpers ───────────────────────────────────────────────────────────────────

def _section_title(text: str) -> QLabel:
    lbl = QLabel(text)
    lbl.setFont(QFont("Ubuntu", 13, QFont.Weight.Bold))
    lbl.setStyleSheet("color:#2E7D32; padding: 10px 0 4px 0;")
    return lbl


def _subsection_title(text: str) -> QLabel:
    lbl = QLabel(text)
    lbl.setFont(QFont("Ubuntu", 11, QFont.Weight.Bold))
    lbl.setStyleSheet("color:#1565C0; padding: 8px 0 2px 0;")
    return lbl


def _paragraph(text: str) -> QLabel:
    lbl = QLabel(text)
    lbl.setWordWrap(True)
    lbl.setStyleSheet("color:#33691E; font-size:12px; line-height:1.6;")
    lbl.setTextFormat(Qt.TextFormat.RichText)
    return lbl


def _info_row(icon: str, label: str, description: str) -> QFrame:
    f = QFrame()
    f.setStyleSheet(
        "QFrame { background:#F9FBF9; border-radius:8px;"
        " border:1px solid #C8E6C9; }"
    )
    lay = QHBoxLayout(f)
    lay.setContentsMargins(12, 8, 12, 8)
    lay.setSpacing(12)

    icon_lbl = QLabel(icon)
    icon_lbl.setFont(QFont("Ubuntu", 18))
    icon_lbl.setFixedWidth(36)
    icon_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
    lay.addWidget(icon_lbl)

    text_lay = QVBoxLayout()
    text_lay.setSpacing(2)
    label_lbl = QLabel(label)
    label_lbl.setFont(QFont("Ubuntu", 11, QFont.Weight.Bold))
    label_lbl.setStyleSheet("color:#1B5E20; background:transparent; border:none;")
    text_lay.addWidget(label_lbl)
    desc_lbl = QLabel(description)
    desc_lbl.setWordWrap(True)
    desc_lbl.setStyleSheet("color:#558B2F; font-size:11px; background:transparent; border:none;")
    text_lay.addWidget(desc_lbl)
    lay.addLayout(text_lay, 1)

    return f


def _color_badge(text: str, bg: str, fg: str) -> QLabel:
    lbl = QLabel(text)
    lbl.setStyleSheet(
        f"background:{bg}; color:{fg}; border-radius:10px;"
        " padding:3px 12px; font-weight:bold; font-size:11px;"
    )
    lbl.setSizePolicy(
        lbl.sizePolicy().horizontalPolicy(),
        lbl.sizePolicy().verticalPolicy(),
    )
    return lbl


def _separator() -> QFrame:
    line = QFrame()
    line.setFrameShape(QFrame.Shape.HLine)
    line.setStyleSheet("color:#C8E6C9; margin: 6px 0;")
    return line


def _scrollable_tab(layout_fn) -> QScrollArea:
    scroll = QScrollArea()
    scroll.setWidgetResizable(True)
    scroll.setFrameShape(QFrame.Shape.NoFrame)
    scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)

    content = QWidget()
    content.setStyleSheet("background:#F1F8E9;")
    lay = QVBoxLayout(content)
    lay.setContentsMargins(20, 16, 20, 20)
    lay.setSpacing(6)
    layout_fn(lay)
    lay.addStretch()

    scroll.setWidget(content)
    return scroll


# ── tab builders ──────────────────────────────────────────────────────────────

def _build_presentation_tab(lay: QVBoxLayout):
    lay.addWidget(_section_title("🌱  Bienvenue dans Jardinator"))
    lay.addWidget(_paragraph(
        "Jardinator est un calendrier du jardinier conçu pour les légumes d'Europe. "
        "Il recense plus de <b>210 variétés</b> de légumes, aromates, légumineuses et "
        "condimentaires, avec pour chacune une fiche détaillée couvrant toutes les "
        "informations utiles pour bien planifier vos semis, plantations et récoltes."
    ))

    lay.addWidget(_section_title("📑  Les onglets de navigation"))
    lay.addWidget(_info_row("🌿", "Tous",
        "Affiche l'intégralité du catalogue — tous les légumes et plantes disponibles."))
    lay.addWidget(_info_row("📅", "Mois en cours (ex. Mars)",
        "Filtre automatiquement les plantes que vous pouvez semer ou planter ce mois-ci."))
    lay.addWidget(_info_row("🌸", "Printemps (Mars · Avril · Mai)",
        "Légumes dont la période de semis ou de plantation tombe au printemps."))
    lay.addWidget(_info_row("☀️", "Été (Juin · Juillet · Août)",
        "Légumes dont la période de semis ou de plantation tombe en été."))
    lay.addWidget(_info_row("🍂", "Automne (Septembre · Octobre · Novembre)",
        "Légumes dont la période de semis ou de plantation tombe en automne."))
    lay.addWidget(_info_row("❄️", "Hiver (Décembre · Janvier · Février)",
        "Légumes dont la période de semis ou de plantation tombe en hiver."))
    lay.addWidget(_info_row("📆", "Calendrier",
        "Vue calendrier mensuelle : naviguez de mois en mois pour voir toutes les "
        "activités (semis intérieur, semis extérieur, plantation, récolte) d'un seul coup d'œil."))

    lay.addWidget(_section_title("🔍  Les filtres"))
    lay.addWidget(_paragraph(
        "La barre de recherche et les deux menus déroulants permettent de filtrer "
        "l'affichage en temps réel :"
    ))
    lay.addWidget(_info_row("🔍", "Recherche par nom",
        "Tapez le début d'un nom (français ou latin) ou d'une famille botanique. "
        "Les résultats s'affichent après une courte pause de saisie."))
    lay.addWidget(_info_row("🏷️", "Filtre par groupe",
        "Choisissez une catégorie : légume-feuille, légume-racine, légume-fruit, "
        "légume-bulbe, légume-tige, cucurbitacée, aromatique, légumineuse, condimentaire."))
    lay.addWidget(_info_row("🌿", "Filtre par famille",
        "Filtrez par famille botanique (Solanaceae, Fabaceae, Asteraceae, etc.)."))


def _build_fiche_tab(lay: QVBoxLayout):
    lay.addWidget(_section_title("🃏  Ouvrir une fiche légume"))
    lay.addWidget(_paragraph(
        "Cliquez sur n'importe quelle carte dans la grille pour ouvrir la fiche complète "
        "du légume. Chaque fiche est divisée en plusieurs sections décrites ci-dessous."
    ))

    # ── En-tête ──────────────────────────────────────────────────────────────
    lay.addWidget(_subsection_title("📷  En-tête"))
    lay.addWidget(_paragraph(
        "La partie haute de la fiche regroupe l'essentiel des informations d'identification."
    ))
    lay.addWidget(_info_row("📷", "Photo de la plante",
        "Image de la plante adulte. Si aucune image n'est disponible, vous pouvez en "
        "télécharger une depuis Wikimedia Commons ou en importer une depuis votre disque."))
    lay.addWidget(_info_row("🔬", "Nom scientifique",
        "Nom latin officiel de l'espèce (ex. Solanum lycopersicum pour la Tomate)."))
    lay.addWidget(_info_row("🏷️", "Badge de groupe",
        "Catégorie fonctionnelle colorée : légume-feuille (vert), légume-racine (orange), "
        "légume-fruit (rose), légume-bulbe (violet), légume-tige (bleu), "
        "cucurbitacée (jaune), aromatique (cyan), légumineuse (vert pâle), "
        "condimentaire (rouge brique)."))
    lay.addWidget(_info_row("🌿", "Famille botanique",
        "Famille taxonomique de la plante (ex. Astéracées, Solanacées, Cucurbitacées…)."))
    lay.addWidget(_info_row("🌰", "Image de la graine",
        "Petite vignette illustrant les graines lorsqu'une image est disponible."))
    lay.addWidget(_info_row("📥", "Télécharger depuis Wikimedia",
        "Récupère automatiquement une image libre de droits depuis Wikimedia Commons "
        "en utilisant le nom de la plante comme critère de recherche."))
    lay.addWidget(_info_row("📂", "Choisir une image depuis le disque",
        "Importez une photo personnelle (JPG, PNG, WebP…). Elle sera copiée dans le "
        "dossier de données de l'application et associée à cette plante."))

    lay.addWidget(_separator())

    # ── Description ──────────────────────────────────────────────────────────
    lay.addWidget(_subsection_title("📝  Description"))
    lay.addWidget(_paragraph(
        "Présentation générale de la plante : caractéristiques, usages culinaires, "
        "particularités agronomiques et origine géographique."
    ))

    lay.addWidget(_separator())

    # ── Calendrier ───────────────────────────────────────────────────────────
    lay.addWidget(_subsection_title("📅  Calendrier de culture"))
    lay.addWidget(_paragraph(
        "Grille des 12 mois de l'année. Chaque ligne représente un type d'activité. "
        "Les cases colorées indiquent les mois favorables. "
        "Le mois en cours est mis en évidence par un fond vert clair et un encadré."
    ))
    lay.addWidget(_info_row("💡", "Semis intérieur (bleu)",
        "Période recommandée pour démarrer les semis en intérieur ou sous abri chauffé, "
        "avant de repiquer les plants en pleine terre."))
    lay.addWidget(_info_row("🌤", "Semis extérieur (orange)",
        "Période pour semer directement en pleine terre, sans protection."))
    lay.addWidget(_info_row("🌱", "Plantation (vert)",
        "Période pour repiquer ou planter des plants déjà levés en pleine terre."))
    lay.addWidget(_info_row("🍅", "Récolte (rouge)",
        "Fenêtre de récolte selon la variété et les conditions climatiques."))

    lay.addWidget(_separator())

    # ── Températures ─────────────────────────────────────────────────────────
    lay.addWidget(_subsection_title("🌡️  Températures"))
    lay.addWidget(_paragraph(
        "Températures du sol ou de l'air nécessaires au bon développement de la plante. "
        "Les valeurs sont affichées avec un code couleur : "
        "<span style='color:#1565C0'><b>bleu</b></span> (froid, ≤ 5 °C), "
        "<span style='color:#0277BD'><b>bleu clair</b></span> (frais, ≤ 15 °C), "
        "<span style='color:#2E7D32'><b>vert</b></span> (tempéré, ≤ 25 °C), "
        "<span style='color:#E65100'><b>orange</b></span> (chaud, > 25 °C)."
    ))
    lay.addWidget(_info_row("🌳", "Extérieur — min",
        "Température minimale tolérée à l'extérieur. En dessous de ce seuil, "
        "la plante risque des dégâts voire la mort."))
    lay.addWidget(_info_row("🌳", "Extérieur — max",
        "Température maximale supportée à l'extérieur. Au-dessus, la plante souffre "
        "de stress thermique (arrêt de croissance, brûlures, montée en graine)."))
    lay.addWidget(_info_row("🏠", "Serre — min",
        "Température minimale conseillée sous abri froid ou serre non chauffée."))
    lay.addWidget(_info_row("🏠", "Serre — max",
        "Température maximale sous abri avant d'aérer obligatoirement."))

    lay.addWidget(_separator())

    # ── Soins ────────────────────────────────────────────────────────────────
    lay.addWidget(_subsection_title("🚿  Soins"))
    lay.addWidget(_info_row("💧", "Besoins en eau",
        "💧 Faible : arrosages rares, la plante supporte la sécheresse. "
        "💧💧 Moyen : arrosages réguliers sans excès. "
        "💧💧💧 Élevé : sol constamment humide, surveiller le paillage."))
    lay.addWidget(_info_row("☀️", "Ensoleillement",
        "☀️ Plein soleil : minimum 6 h de soleil direct par jour. "
        "⛅ Mi-ombre : 3 à 6 h, ou lumière filtrée l'après-midi. "
        "🌑 Ombre : tolère moins de 3 h de soleil direct."))

    lay.addWidget(_separator())

    # ── Informations complémentaires ─────────────────────────────────────────
    lay.addWidget(_subsection_title("ℹ️  Informations complémentaires"))
    lay.addWidget(_info_row("📏", "Profondeur de semis",
        "Profondeur à laquelle déposer la graine dans le sol. "
        "\"Surface\" signifie que la graine ne doit pas être recouverte de terre — "
        "elle a besoin de lumière pour germer."))
    lay.addWidget(_info_row("🌡️", "Germination",
        "Nombre de jours entre le semis et la levée des premières plantules, "
        "dans des conditions optimales de température et d'humidité."))
    lay.addWidget(_info_row("📐", "Hauteur adulte",
        "Hauteur maximale de la plante à maturité, en centimètres. "
        "Utile pour anticiper l'espacement et le palissage éventuel."))
    lay.addWidget(_info_row("🌱", "Facilité de germination",
        "Facile : la graine germe sans attention particulière. "
        "Moyenne : conditions de température ou d'humidité à surveiller. "
        "Difficile : stratification, scarification ou lumière spécifique requise."))
    lay.addWidget(_info_row("👨‍🌾", "Facilité de culture",
        "Évaluation globale de la difficulté d'entretien jusqu'à la récolte. "
        "Tient compte de l'arrosage, de la taille, des maladies courantes, etc."))
    lay.addWidget(_info_row("📅", "Bisannuelle",
        "Une plante bisannuelle complète son cycle sur deux ans : "
        "végétation la première année, floraison et graine la seconde. "
        "Exemples : Carotte, Poireau, Persil."))

    lay.addWidget(_separator())

    # ── Sous-variétés ────────────────────────────────────────────────────────
    lay.addWidget(_subsection_title("🌿  Sous-variétés et cultivars"))
    lay.addWidget(_paragraph(
        "Liste des variétés sélectionnées les plus courantes pour cette espèce. "
        "Chaque cultivar est présenté sous forme de badge vert. "
        "Ces variétés peuvent différer par leur couleur, leur taille, leur précocité "
        "ou leur résistance aux maladies."
    ))

    lay.addWidget(_separator())

    # ── Type de semis ─────────────────────────────────────────────────────────
    lay.addWidget(_subsection_title("🕳️  Type de semis"))
    lay.addWidget(_paragraph(
        "Méthode(s) recommandée(s) pour semer cette plante. "
        "Les cartes vertes indiquent les méthodes applicables, les grises sont inadaptées."
    ))
    lay.addWidget(_info_row("🕳️", "En poquet",
        "Déposer 2 à 3 graines dans un même trou puis éclaircir. "
        "Idéal pour les grosses graines et les cucurbitacées (Courgette, Concombre, Haricot)."))
    lay.addWidget(_info_row("➖", "En ligne",
        "Semer en sillons continus, puis éclaircir. "
        "Convient aux petites graines et aux légumes-racines (Carotte, Radis, Betterave)."))
    lay.addWidget(_info_row("🌬️", "À la volée",
        "Répandre les graines de manière aléatoire sur une surface préparée, "
        "puis ratisser. Utilisé pour les salades, les engrais verts, la mâche."))
    lay.addWidget(_info_row("🫙", "En surface",
        "Poser la graine en surface sans recouvrir de terre — la lumière est "
        "nécessaire à la germination (Laitue, Basilic, Marjolaine)."))

    lay.addWidget(_separator())

    # ── Type de sol ───────────────────────────────────────────────────────────
    lay.addWidget(_subsection_title("🌍  Type de sol"))
    lay.addWidget(_paragraph(
        "Préférence de sol de la plante. Plusieurs types peuvent être affichés "
        "si la plante s'adapte à différentes situations."
    ))
    lay.addWidget(_info_row("🌊", "Frais et bien drainé",
        "Sol qui retient suffisamment d'humidité tout en laissant l'excès s'évacuer. "
        "Convient à la majorité des légumes."))
    lay.addWidget(_info_row("💧", "Humide",
        "Sol gardant une humidité constante, proche d'une zone fraîche ou ombragée. "
        "Idéal pour le Céleri, le Poireau, la Mâche."))
    lay.addWidget(_info_row("🏜️", "Sec",
        "Sol bien ressuyé, voire pauvre et sableux. "
        "Adapté aux aromatiques méditerranéennes (Thym, Romarin, Lavande)."))

    lay.addWidget(_separator())

    # ── Compost ───────────────────────────────────────────────────────────────
    lay.addWidget(_subsection_title("🌱  Compost"))
    lay.addWidget(_paragraph(
        "Type et niveau d'exigence en matière organique. "
        "Le compost bactérien (riche en azote) favorise la croissance foliaire. "
        "Le compost fongique (riche en carbone) améliore la structure du sol "
        "et bénéficie aux plantes à enracinement profond."
    ))
    lay.addWidget(_info_row("🦠", "Peu exigeant · Bactérien",
        "Sol peu enrichi suffisant. Légumineuses et légumes-racines."))
    lay.addWidget(_info_row("🦠", "Exigeant · Bactérien",
        "Sol riche en matière organique fraîche. Légumes-feuilles et légumes-fruits."))
    lay.addWidget(_info_row("🍄", "Peu exigeant · Fongique",
        "Sol pauvre toléré avec mycorhizes. Aromatiques, vivaces."))
    lay.addWidget(_info_row("🍄", "Exigeant · Fongique",
        "Mycorhizes importantes, sol à fort réseau fongique. Ligneux, arbustifs."))

    lay.addWidget(_separator())

    # ── Distances ─────────────────────────────────────────────────────────────
    lay.addWidget(_subsection_title("📏  Distances de plantation"))
    lay.addWidget(_paragraph(
        "Espacement recommandé pour permettre à chaque plante de se développer "
        "sans concurrence excessive pour l'eau, la lumière et les nutriments."
    ))
    lay.addWidget(_info_row("↔️", "Sur le rang",
        "Distance entre deux plants consécutifs sur le même rang. "
        "Exemple : 30 cm entre deux plants de Tomate sur la même rangée."))
    lay.addWidget(_info_row("↕️", "Entre les rangs",
        "Distance entre deux rangs parallèles. "
        "Détermine la largeur des allées et l'accessibilité pour l'entretien."))
    lay.addWidget(_info_row("✂️", "Éclaircissage",
        "Distance à laisser entre les plantules après éclaircissage. "
        "Applicable aux légumes semés en lignes denses (Carotte, Radis, Navet). "
        "\"Non requis\" si la plante est semée en poquet ou transplantée."))

    lay.addWidget(_separator())

    # ── Associations ──────────────────────────────────────────────────────────
    lay.addWidget(_subsection_title("🤝  Associations"))
    lay.addWidget(_paragraph(
        "La culture associée (ou compagnonnage) consiste à planter côte à côte "
        "des espèces qui se bénéficient mutuellement — ou au contraire à éviter "
        "les voisinages néfastes."
    ))
    lay.addWidget(_info_row("✅", "Associations favorables",
        "Plantes qui améliorent la croissance, éloignent les ravageurs ou optimisent "
        "l'utilisation de l'espace lorsqu'elles sont plantées à proximité. "
        "Exemples classiques : Tomate + Basilic, Carotte + Poireau."))
    lay.addWidget(_info_row("❌", "Associations défavorables",
        "Plantes qui entrent en compétition, s'inhibent mutuellement ou favorisent "
        "le développement de maladies communes. À planter à distance."))


def _build_meteo_tab(lay: QVBoxLayout):
    lay.addWidget(_section_title("🌡️  La fenêtre Météo du jour"))
    lay.addWidget(_paragraph(
        "Cliquez sur le bouton <b>🌡️ Météo du jour</b> en haut à droite pour ouvrir "
        "la fenêtre météo. Elle reste visible en permanence et peut être déplacée "
        "indépendamment de la fenêtre principale."
    ))

    lay.addWidget(_subsection_title("🎚️  Le curseur de température"))
    lay.addWidget(_paragraph(
        "Faites glisser les <b>deux poignées</b> du curseur pour définir la plage de "
        "température de la journée :"
    ))
    lay.addWidget(_info_row("❄️", "Poignée gauche — température minimale",
        "Correspond typiquement à la température de la nuit ou du petit matin. "
        "Faites-la glisser vers la gauche pour indiquer des nuits froides."))
    lay.addWidget(_info_row("🔥", "Poignée droite — température maximale",
        "Correspond à la température maximale attendue dans l'après-midi. "
        "La plage va de −10 °C à +45 °C."))
    lay.addWidget(_paragraph(
        "Le dégradé de couleur du curseur (bleu → vert → orange → rouge) "
        "indique visuellement les zones froides, tempérées et chaudes."
    ))

    lay.addWidget(_subsection_title("🏡  Plein air vs Sous abri"))
    lay.addWidget(_paragraph(
        "Le bouton bascule <b>Plein air / Sous abri</b> change le référentiel "
        "de comparaison :"
    ))
    lay.addWidget(_info_row("🌳", "Plein air",
        "Compare la plage saisie aux températures extérieures min/max de chaque plante."))
    lay.addWidget(_info_row("🏠", "Sous abri",
        "Compare la plage saisie aux températures de serre min/max de chaque plante. "
        "Utile si vous avez une serre froide, une tunnel ou un voile d'hivernage."))

    lay.addWidget(_subsection_title("🟢🟡🔴  Les zones de couleur"))
    lay.addWidget(_paragraph(
        "Les plantes sont réparties en trois zones selon la compatibilité entre "
        "la plage de températures saisie et leurs exigences :"
    ))
    lay.addWidget(_info_row("🟢", "Zone verte — Conditions optimales",
        "La température minimale de la journée est supérieure ou égale au seuil "
        "minimum de la plante, <b>et</b> la température maximale ne dépasse pas "
        "son seuil maximum. La plante peut être mise en place sans risque."))
    lay.addWidget(_info_row("🟡", "Zone jaune — Conditions limites",
        "La température maximale de la journée atteint au moins le minimum requis, "
        "mais la nuit reste trop froide ou la journée trop chaude. "
        "Des protections (voile, ombrage, tunnel) peuvent être nécessaires."))
    lay.addWidget(_info_row("🔴", "Zone rouge — Conditions défavorables",
        "La température maximale de la journée est inférieure au minimum requis par "
        "la plante. Il fait trop froid toute la journée pour la mettre dehors."))
    lay.addWidget(_paragraph(
        "<i>Note : les plantes sans données de température ne sont pas affichées "
        "dans les résultats météo.</i>"
    ))


def _build_images_tab(lay: QVBoxLayout):
    lay.addWidget(_section_title("🖼️  Gestion des images"))
    lay.addWidget(_paragraph(
        "Jardinator associe à chaque fiche deux types d'images : "
        "la <b>photo de la plante</b> adulte et l'<b>image de la graine</b>. "
        "Les images sont stockées localement dans <code>~/.local/share/jardinator/images/</code>."
    ))

    lay.addWidget(_subsection_title("📥  Téléchargement Wikimedia"))
    lay.addWidget(_paragraph(
        "Le bouton <b>📥 Télécharger les images</b> de la barre principale lance le "
        "téléchargement en tâche de fond pour toutes les plantes du catalogue. "
        "Seules les images manquantes sont téléchargées. Vous pouvez annuler à tout moment."
    ))
    lay.addWidget(_paragraph(
        "Dans une fiche individuelle, le bouton <b>📥 Télécharger depuis Wikimedia</b> "
        "ne télécharge que les images de cette plante (photo + graine si disponible)."
    ))

    lay.addWidget(_subsection_title("📂  Import depuis le disque"))
    lay.addWidget(_paragraph(
        "Si l'image proposée par Wikimedia ne correspond pas à la variété souhaitée, "
        "vous pouvez importer votre propre photo :"
    ))
    lay.addWidget(_info_row("1️⃣", "Cliquez sur « 📂 Choisir une image depuis le disque »",
        "Un sélecteur de fichier s'ouvre. Choisissez un fichier JPG, PNG, WebP ou BMP."))
    lay.addWidget(_info_row("2️⃣", "La photo est copiée",
        "L'image est copiée dans le dossier de données et associée à cette fiche. "
        "L'original n'est pas modifié."))
    lay.addWidget(_info_row("3️⃣", "Affichage immédiat",
        "La nouvelle photo remplace l'ancienne dans la fiche sans redémarrer l'application."))


# ── Dialog ────────────────────────────────────────────────────────────────────

class HelpDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("❓  Aide — Jardinator")
        self.setMinimumSize(720, 580)
        self.resize(820, 680)
        self.setStyleSheet("background:#F1F8E9;")
        self._build()

    def _build(self):
        root = QVBoxLayout(self)
        root.setContentsMargins(0, 0, 0, 10)
        root.setSpacing(0)

        # Header
        hdr = QWidget()
        hdr.setStyleSheet("background:#2E7D32;")
        hdr.setFixedHeight(60)
        hdr_lay = QHBoxLayout(hdr)
        hdr_lay.setContentsMargins(20, 0, 20, 0)
        title = QLabel("❓  Aide et documentation")
        title.setFont(QFont("Ubuntu", 16, QFont.Weight.Bold))
        title.setStyleSheet("color:white; background:transparent;")
        hdr_lay.addWidget(title)
        hdr_lay.addStretch()
        sub = QLabel("Jardinator — Calendrier du jardinier")
        sub.setStyleSheet("color:#A5D6A7; font-size:11px; background:transparent;")
        hdr_lay.addWidget(sub)
        root.addWidget(hdr)

        # Tabs
        tabs = QTabWidget()
        tabs.setDocumentMode(True)
        tabs.setStyleSheet("QTabWidget::pane { border: none; }")
        tabs.addTab(_scrollable_tab(_build_presentation_tab),   "🏠  Présentation")
        tabs.addTab(_scrollable_tab(_build_fiche_tab),          "🌿  Fiche légume")
        tabs.addTab(_scrollable_tab(_build_meteo_tab),          "🌡️  Météo")
        tabs.addTab(_scrollable_tab(_build_images_tab),         "🖼️  Images")
        root.addWidget(tabs, 1)

        # Close button
        close = QPushButton("Fermer")
        close.setFixedHeight(36)
        close.setStyleSheet("margin: 4px 16px 0 16px;")
        close.clicked.connect(self.accept)
        root.addWidget(close)
