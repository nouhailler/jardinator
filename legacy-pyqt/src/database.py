"""DatabaseManager — Pure CRUD SQLite, context manager, no UI logic."""
import sqlite3
import json
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

APP_DATA_DIR = Path.home() / ".local" / "share" / "jardinator"
DB_PATH = APP_DATA_DIR / "jardinator.db"
IMAGES_DIR = APP_DATA_DIR / "images"


class DatabaseManager:
    """Pure CRUD layer — no business logic, no UI."""

    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        self._init_db()

    # ── context manager ──────────────────────────────────────────────────────
    def __enter__(self):
        self._conn = sqlite3.connect(self.db_path)
        self._conn.row_factory = sqlite3.Row
        return self._conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self._conn.rollback()
        else:
            self._conn.commit()
        self._conn.close()
        return False

    # ── schema ────────────────────────────────────────────────────────────────
    def _init_db(self):
        with self as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS vegetables (
                    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
                    name                 TEXT NOT NULL UNIQUE,
                    name_en              TEXT,
                    scientific_name      TEXT,
                    family               TEXT,
                    description          TEXT,
                    sowing_indoor        TEXT DEFAULT '[]',
                    sowing_outdoor       TEXT DEFAULT '[]',
                    planting             TEXT DEFAULT '[]',
                    harvest              TEXT DEFAULT '[]',
                    temp_outdoor_min     REAL,
                    temp_outdoor_max     REAL,
                    temp_greenhouse_min  REAL,
                    temp_greenhouse_max  REAL,
                    water_needs          TEXT,
                    sun                  TEXT,
                    duree_croissance_jours INTEGER,
                    wikimedia_image      TEXT,
                    wikimedia_seed       TEXT,
                    image_path           TEXT,
                    seed_image_path      TEXT,
                    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_name   ON vegetables(name);
                CREATE INDEX IF NOT EXISTS idx_family ON vegetables(family);
            """)
            # Migration: add association columns if they don't exist yet
            existing = {row[1] for row in conn.execute("PRAGMA table_info(vegetables)")}
            if "associations_favorables" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN associations_favorables TEXT DEFAULT '[]'")
            if "associations_defavorables" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN associations_defavorables TEXT DEFAULT '[]'")
            if "distance_rang_cm" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN distance_rang_cm REAL")
            if "distance_rangs_cm" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN distance_rangs_cm REAL")
            if "eclaircissage_cm" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN eclaircissage_cm REAL")
            if "categorie" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN categorie TEXT DEFAULT 'légume'")
            if "sous_varietes" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN sous_varietes TEXT DEFAULT '[]'")
            if "profondeur_semis_cm" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN profondeur_semis_cm REAL")
            if "germination_jours_min" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN germination_jours_min INTEGER")
            if "germination_jours_max" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN germination_jours_max INTEGER")
            if "hauteur_plants_cm" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN hauteur_plants_cm INTEGER")
            if "facilite_germination" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN facilite_germination TEXT")
            if "facilite_culture" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN facilite_culture TEXT")
            if "bisannuelle" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN bisannuelle INTEGER DEFAULT 0")
            if "semis_poquet" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN semis_poquet INTEGER DEFAULT 0")
            if "semis_ligne" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN semis_ligne INTEGER DEFAULT 0")
            if "semis_volee" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN semis_volee INTEGER DEFAULT 0")
            if "semis_surface" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN semis_surface INTEGER DEFAULT 0")
            if "type_sol" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN type_sol TEXT DEFAULT '[]'")
            if "compost_type" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN compost_type TEXT")
            if "groupe" not in existing:
                conn.execute("ALTER TABLE vegetables ADD COLUMN groupe TEXT")

    # ── writes ────────────────────────────────────────────────────────────────
    def insert_vegetable(self, data: Dict[str, Any]) -> int:
        with self as conn:
            cur = conn.execute("""
                INSERT OR IGNORE INTO vegetables
                (name, name_en, scientific_name, family, categorie, description,
                 sowing_indoor, sowing_outdoor, planting, harvest,
                 temp_outdoor_min, temp_outdoor_max,
                 temp_greenhouse_min, temp_greenhouse_max,
                 water_needs, sun, duree_croissance_jours,
                 wikimedia_image, wikimedia_seed)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                data["name"], data.get("name_en"), data.get("scientific_name"),
                data.get("family"), data.get("categorie", "légume"),
                data.get("description"),
                json.dumps(data.get("sowing_indoor", [])),
                json.dumps(data.get("sowing_outdoor", [])),
                json.dumps(data.get("planting", [])),
                json.dumps(data.get("harvest", [])),
                data.get("temp_outdoor_min"), data.get("temp_outdoor_max"),
                data.get("temp_greenhouse_min"), data.get("temp_greenhouse_max"),
                data.get("water_needs"), data.get("sun"),
                data.get("duree_croissance_jours"),
                data.get("wikimedia_image"), data.get("wikimedia_seed"),
            ))
            return cur.lastrowid

    def update_sous_varietes(self, name: str, sous_varietes: list):
        with self as conn:
            conn.execute(
                "UPDATE vegetables SET sous_varietes=? WHERE name=?",
                (json.dumps(sous_varietes, ensure_ascii=False), name),
            )

    def update_infos_complementaires(self, name: str, data: dict):
        with self as conn:
            conn.execute(
                """UPDATE vegetables SET
                    profondeur_semis_cm=?, germination_jours_min=?, germination_jours_max=?,
                    hauteur_plants_cm=?, facilite_germination=?, facilite_culture=?
                   WHERE name=?""",
                (data.get("profondeur_semis_cm"), data.get("germination_jours_min"),
                 data.get("germination_jours_max"), data.get("hauteur_plants_cm"),
                 data.get("facilite_germination"), data.get("facilite_culture"),
                 name),
            )

    def update_groupe(self, name: str, groupe: str):
        with self as conn:
            conn.execute("UPDATE vegetables SET groupe=? WHERE name=?", (groupe, name))

    def get_groupes(self) -> list:
        with self as conn:
            rows = conn.execute(
                "SELECT DISTINCT groupe FROM vegetables "
                "WHERE groupe IS NOT NULL ORDER BY groupe"
            ).fetchall()
        return [r[0] for r in rows]

    def update_types_semis(self, name: str, poquet: bool, ligne: bool, volee: bool, surface: bool):
        with self as conn:
            conn.execute(
                "UPDATE vegetables SET semis_poquet=?, semis_ligne=?, semis_volee=?, semis_surface=? WHERE name=?",
                (int(poquet), int(ligne), int(volee), int(surface), name),
            )

    def update_sol_compost(self, name: str, type_sol: list, compost_type: str, bisannuelle: bool):
        with self as conn:
            conn.execute(
                "UPDATE vegetables SET type_sol=?, compost_type=?, bisannuelle=? WHERE name=?",
                (json.dumps(type_sol, ensure_ascii=False), compost_type, int(bisannuelle), name),
            )

    def update_semis(self, name: str, sowing_indoor: list, sowing_outdoor: list):
        with self as conn:
            conn.execute(
                "UPDATE vegetables SET sowing_indoor=?, sowing_outdoor=? WHERE name=?",
                (json.dumps(sowing_indoor), json.dumps(sowing_outdoor), name),
            )

    def update_distances(self, name: str, distance_rang: int, distance_rangs: int, eclaircissage):
        with self as conn:
            conn.execute(
                "UPDATE vegetables SET distance_rang_cm=?, distance_rangs_cm=?, eclaircissage_cm=? WHERE name=?",
                (distance_rang, distance_rangs, eclaircissage, name),
            )

    def update_associations(self, name: str, favorables: list, defavorables: list):
        with self as conn:
            conn.execute(
                "UPDATE vegetables SET associations_favorables=?, associations_defavorables=? WHERE name=?",
                (json.dumps(favorables, ensure_ascii=False),
                 json.dumps(defavorables, ensure_ascii=False),
                 name),
            )

    def update_image_path(self, vid: int, image_path: str, is_seed: bool = False):
        col = "seed_image_path" if is_seed else "image_path"
        with self as conn:
            conn.execute(f"UPDATE vegetables SET {col}=? WHERE id=?", (image_path, vid))

    # ── reads ─────────────────────────────────────────────────────────────────
    def get_all_vegetables(self) -> List[Dict]:
        with self as conn:
            rows = conn.execute("SELECT * FROM vegetables ORDER BY name").fetchall()
        return [self._row_to_dict(r) for r in rows]

    def get_vegetable_by_id(self, vid: int) -> Optional[Dict]:
        with self as conn:
            row = conn.execute("SELECT * FROM vegetables WHERE id=?", (vid,)).fetchone()
        return self._row_to_dict(row) if row else None

    def search_vegetables(self, query: str) -> List[Dict]:
        with self as conn:
            q = f"%{query}%"
            rows = conn.execute(
                "SELECT * FROM vegetables "
                "WHERE name LIKE ? OR scientific_name LIKE ? OR family LIKE ? "
                "ORDER BY name",
                (q, q, q),
            ).fetchall()
        return [self._row_to_dict(r) for r in rows]

    def get_families(self) -> List[str]:
        with self as conn:
            rows = conn.execute(
                "SELECT DISTINCT family FROM vegetables "
                "WHERE family IS NOT NULL ORDER BY family"
            ).fetchall()
        return [r[0] for r in rows]

    def count(self) -> int:
        with self as conn:
            return conn.execute("SELECT COUNT(*) FROM vegetables").fetchone()[0]

    # ── helpers ───────────────────────────────────────────────────────────────
    @staticmethod
    def _row_to_dict(row) -> Optional[Dict]:
        if row is None:
            return None
        d = dict(row)
        for key in ("sowing_indoor", "sowing_outdoor", "planting", "harvest",
                    "associations_favorables", "associations_defavorables", "sous_varietes",
                    "type_sol"):
            try:
                d[key] = json.loads(d[key]) if isinstance(d[key], str) else (d[key] or [])
            except Exception:
                d[key] = []
        return d
