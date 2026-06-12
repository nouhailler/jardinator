"""VegetableService — Business logic + Wikimedia image downloads."""
import json
import logging
import requests
from pathlib import Path
from typing import Optional, List, Dict
from datetime import date

from PyQt6.QtCore import QThread, pyqtSignal

from .database import DatabaseManager, IMAGES_DIR

LEGUMES_JSON            = Path(__file__).parent.parent / "legumes.json"
PLANTES_EXTRA_JSON      = Path(__file__).parent.parent / "plantes_extra.json"
ASSOCIATIONS_JSON       = Path(__file__).parent.parent / "associations.json"
DISTANCES_JSON          = Path(__file__).parent.parent / "distances.json"
SOUS_VARIETES_JSON      = Path(__file__).parent.parent / "sous_varietes.json"
INFOS_COMPL_JSON        = Path(__file__).parent.parent / "infos_complementaires.json"
SEMIS_JSON              = Path(__file__).parent.parent / "semis.json"
TYPES_SEMIS_JSON        = Path(__file__).parent.parent / "types_semis.json"
SOL_COMPOST_JSON        = Path(__file__).parent.parent / "sol_compost.json"
GROUPES_JSON            = Path(__file__).parent.parent / "groupes.json"

_MONTHS_FR = {
    "janvier": 1, "février": 2, "mars": 3, "avril": 4,
    "mai": 5, "juin": 6, "juillet": 7, "août": 8,
    "septembre": 9, "octobre": 10, "novembre": 11, "décembre": 12,
}


def _parse_months(value: str) -> List[int]:
    """Convert "mars, avril" → [3, 4]."""
    if not value:
        return []
    return [_MONTHS_FR[m.strip().lower()] for m in value.split(",") if m.strip().lower() in _MONTHS_FR]


def _legume_to_db(veg: Dict) -> Dict:
    """Map French JSON keys → DB English keys."""
    return {
        "name":                  veg["nom"],
        "scientific_name":       veg.get("nom_latin"),
        "family":                veg.get("famille"),
        "categorie":             veg.get("categorie", "légume"),
        "description":           veg.get("description"),
        "planting":              _parse_months(veg.get("mois_plantation", "")),
        "harvest":               _parse_months(veg.get("mois_recolte", "")),
        "sowing_indoor":         [],
        "sowing_outdoor":        [],
        "temp_outdoor_min":      veg.get("temp_terre_min"),
        "temp_outdoor_max":      veg.get("temp_terre_max"),
        "temp_greenhouse_min":   veg.get("temp_serre_min"),
        "temp_greenhouse_max":   veg.get("temp_serre_max"),
        "water_needs":           veg.get("arrosage"),
        "sun":                   veg.get("exposition"),
        "duree_croissance_jours": veg.get("duree_croissance_jours"),
    }

logger = logging.getLogger(__name__)

WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"
WIKIMEDIA_HEADERS = {
    "User-Agent": "Jardinator/1.0 (vegetable garden planner; contact@jardinator.local) python-requests"
}

MONTHS_FR = {
    1: "Janvier", 2: "Février", 3: "Mars", 4: "Avril",
    5: "Mai", 6: "Juin", 7: "Juillet", 8: "Août",
    9: "Septembre", 10: "Octobre", 11: "Novembre", 12: "Décembre",
}

SEASONS: Dict[str, List[int]] = {
    "Printemps": [3, 4, 5],
    "Été":       [6, 7, 8],
    "Automne":   [9, 10, 11],
    "Hiver":     [12, 1, 2],
}


# ── Download thread ───────────────────────────────────────────────────────────

class DownloadThread(QThread):
    progress  = pyqtSignal(int, int, str)   # current, total, veg_name
    finished  = pyqtSignal(int)             # total downloaded
    error     = pyqtSignal(str)

    def __init__(self, service, vegetable_ids=None):
        super().__init__()
        self.service = service
        self.vegetable_ids = vegetable_ids
        self._cancelled = False

    def cancel(self):
        self._cancelled = True

    def run(self):
        try:
            vegetables = self.service.db.get_all_vegetables()
            if self.vegetable_ids:
                vegetables = [v for v in vegetables if v["id"] in self.vegetable_ids]

            total = len(vegetables)
            downloaded = 0

            for i, veg in enumerate(vegetables):
                if self._cancelled:
                    break
                self.progress.emit(i + 1, total, veg["name"])

                # Plant image
                if not veg.get("image_path") or not Path(veg["image_path"]).exists():
                    path = self.service.download_image_wikimedia(
                        veg["id"], veg["name"],
                        veg.get("wikimedia_image", veg["name"]),
                        is_seed=False,
                    )
                    if path:
                        downloaded += 1

                # Seed image
                if veg.get("wikimedia_seed") and (
                    not veg.get("seed_image_path") or
                    not Path(veg.get("seed_image_path", "")).exists()
                ):
                    path = self.service.download_image_wikimedia(
                        veg["id"], veg["name"],
                        veg["wikimedia_seed"],
                        is_seed=True,
                    )
                    if path:
                        downloaded += 1

            self.finished.emit(downloaded)
        except Exception as exc:
            self.error.emit(str(exc))


# ── Service ───────────────────────────────────────────────────────────────────

class VegetableService:
    """All business logic lives here — no SQLite in UI, no Qt in DB."""

    def __init__(self):
        self.db = DatabaseManager()
        self._populate_if_empty()
        self._populate_extra_plants()
        self._load_semis()
        self._load_groupes()
        self._load_types_semis()
        self._load_sol_compost()
        self._load_associations()
        self._load_distances()
        self._load_sous_varietes()
        self._load_infos_complementaires()

    # ── population ────────────────────────────────────────────────────────────
    def _populate_if_empty(self):
        if self.db.count() == 0:
            logger.info("Populating database from %s…", LEGUMES_JSON)
            with open(LEGUMES_JSON, encoding="utf-8") as f:
                legumes_data = json.load(f)
            for veg in legumes_data:
                self.db.insert_vegetable(_legume_to_db(veg))
            logger.info("Inserted %d vegetables", self.db.count())

    def _load_associations(self):
        if not ASSOCIATIONS_JSON.exists():
            return
        with open(ASSOCIATIONS_JSON, encoding="utf-8") as f:
            data = json.load(f)
        for name, assoc in data.items():
            self.db.update_associations(
                name,
                assoc.get("favorables", []),
                assoc.get("defavorables", []),
            )
        logger.info("Associations loaded for %d vegetables", len(data))

    def _load_distances(self):
        if not DISTANCES_JSON.exists():
            return
        with open(DISTANCES_JSON, encoding="utf-8") as f:
            data = json.load(f)
        for name, d in data.items():
            self.db.update_distances(
                name,
                d.get("distance_rang_cm"),
                d.get("distance_rangs_cm"),
                d.get("eclaircissage_cm"),
            )
        logger.info("Distances loaded for %d vegetables", len(data))

    def _load_semis(self):
        if not SEMIS_JSON.exists():
            return
        with open(SEMIS_JSON, encoding="utf-8") as f:
            data = json.load(f)
        for name, d in data.items():
            self.db.update_semis(
                name,
                [_MONTHS_FR[m] for m in d.get("semis_interieur", []) if m in _MONTHS_FR],
                [_MONTHS_FR[m] for m in d.get("semis_exterieur", []) if m in _MONTHS_FR],
            )
        logger.info("Semis loaded for %d plants", len(data))

    def _load_groupes(self):
        if not GROUPES_JSON.exists():
            return
        with open(GROUPES_JSON, encoding="utf-8") as f:
            data = json.load(f)
        for name, groupe in data.items():
            self.db.update_groupe(name, groupe)
        logger.info("Groupes loaded for %d plants", len(data))

    def get_groupes(self) -> list:
        return self.db.get_groupes()

    def _load_types_semis(self):
        if not TYPES_SEMIS_JSON.exists():
            return
        with open(TYPES_SEMIS_JSON, encoding="utf-8") as f:
            data = json.load(f)
        for name, d in data.items():
            self.db.update_types_semis(
                name,
                d.get("poquet", False),
                d.get("ligne", False),
                d.get("volee", False),
                d.get("surface", False),
            )
        logger.info("Types de semis loaded for %d plants", len(data))

    def _load_sol_compost(self):
        if not SOL_COMPOST_JSON.exists():
            return
        with open(SOL_COMPOST_JSON, encoding="utf-8") as f:
            data = json.load(f)
        for name, d in data.items():
            self.db.update_sol_compost(
                name,
                d.get("type_sol", []),
                d.get("compost_type"),
                d.get("bisannuelle", False),
            )
        logger.info("Sol/compost loaded for %d plants", len(data))

    def _populate_extra_plants(self):
        if not PLANTES_EXTRA_JSON.exists():
            return
        with open(PLANTES_EXTRA_JSON, encoding="utf-8") as f:
            extra = json.load(f)
        added = 0
        for veg in extra:
            row_id = self.db.insert_vegetable(_legume_to_db(veg))
            if row_id:
                added += 1
        if added:
            logger.info("Added %d extra plants (aromatiques/légumineuses/condimentaires)", added)

    def _load_sous_varietes(self):
        if not SOUS_VARIETES_JSON.exists():
            return
        with open(SOUS_VARIETES_JSON, encoding="utf-8") as f:
            data = json.load(f)
        for name, varietes in data.items():
            self.db.update_sous_varietes(name, varietes)
        logger.info("Sous-variétés loaded for %d plants", len(data))

    def _load_infos_complementaires(self):
        if not INFOS_COMPL_JSON.exists():
            return
        with open(INFOS_COMPL_JSON, encoding="utf-8") as f:
            data = json.load(f)
        for name, infos in data.items():
            self.db.update_infos_complementaires(name, infos)
        logger.info("Infos complémentaires loaded for %d plants", len(data))

    # ── queries ───────────────────────────────────────────────────────────────
    def get_all(self) -> List[Dict]:
        return self.db.get_all_vegetables()

    def get_by_id(self, vid: int) -> Optional[Dict]:
        return self.db.get_vegetable_by_id(vid)

    def search(self, query: str) -> List[Dict]:
        if not query.strip():
            return self.db.get_all_vegetables()
        return self.db.search_vegetables(query)

    def get_by_season(self, season: str) -> List[Dict]:
        months = SEASONS.get(season, [])
        all_vegs = self.db.get_all_vegetables()
        seen: set = set()
        result = []
        for month in months:
            for veg in all_vegs:
                if veg["id"] not in seen:
                    if month in veg.get("planting", []) or month in veg.get("sowing_outdoor", []):
                        result.append(veg)
                        seen.add(veg["id"])
        return sorted(result, key=lambda x: x["name"])

    def get_plantable_now(self) -> List[Dict]:
        month = date.today().month
        return sorted(
            [
                v for v in self.db.get_all_vegetables()
                if month in v.get("planting", [])
                or month in v.get("sowing_outdoor", [])
                or month in v.get("sowing_indoor", [])
            ],
            key=lambda x: x["name"],
        )

    def get_harvestable_now(self) -> List[Dict]:
        month = date.today().month
        return [v for v in self.db.get_all_vegetables() if month in v.get("harvest", [])]

    def get_by_month(self, month: int) -> Dict[str, List[Dict]]:
        all_vegs = self.db.get_all_vegetables()
        return {
            "sowing_indoor":  [v for v in all_vegs if month in v.get("sowing_indoor",  [])],
            "sowing_outdoor": [v for v in all_vegs if month in v.get("sowing_outdoor", [])],
            "planting":       [v for v in all_vegs if month in v.get("planting",        [])],
            "harvest":        [v for v in all_vegs if month in v.get("harvest",         [])],
        }

    def get_families(self) -> List[str]:
        return self.db.get_families()

    # ── Wikimedia download ────────────────────────────────────────────────────
    def download_image_wikimedia(
        self,
        vid: int,
        name: str,
        search_term: str,
        is_seed: bool = False,
    ) -> Optional[str]:
        """Download & cache one image. Returns local path or None."""
        try:
            suffix = "_seed" if is_seed else ""
            safe_name = name.replace(" ", "_").replace("/", "_")
            local_path = IMAGES_DIR / f"{safe_name}{suffix}.jpg"

            if local_path.exists() and local_path.stat().st_size > 1000:
                self.db.update_image_path(vid, str(local_path), is_seed)
                return str(local_path)

            # 1. Search Commons
            params = {
                "action": "query",
                "list": "search",
                "srsearch": search_term or name,
                "srnamespace": "6",
                "srlimit": "8",
                "format": "json",
            }
            resp = requests.get(WIKIMEDIA_API, params=params, headers=WIKIMEDIA_HEADERS, timeout=12)
            resp.raise_for_status()
            results = resp.json().get("query", {}).get("search", [])

            image_url: Optional[str] = None
            for hit in results:
                title = hit.get("title", "")
                if not title.startswith("File:"):
                    continue
                filename = title[5:]
                ext = filename.rsplit(".", 1)[-1].lower()
                if ext not in ("jpg", "jpeg", "png", "webp"):
                    continue

                # 2. Get thumb URL
                info_params = {
                    "action": "query",
                    "titles": f"File:{filename}",
                    "prop": "imageinfo",
                    "iiprop": "url|mime",
                    "iiurlwidth": "500",
                    "format": "json",
                }
                ir = requests.get(WIKIMEDIA_API, params=info_params, headers=WIKIMEDIA_HEADERS, timeout=10)
                ir.raise_for_status()
                pages = ir.json().get("query", {}).get("pages", {})
                for page in pages.values():
                    ii = page.get("imageinfo", [{}])[0]
                    if "image" in ii.get("mime", ""):
                        image_url = ii.get("thumburl") or ii.get("url")
                        break
                if image_url:
                    break

            if not image_url:
                return None

            # 3. Download
            img_resp = requests.get(image_url, headers=WIKIMEDIA_HEADERS, timeout=30)
            img_resp.raise_for_status()

            # Save as JPEG (may actually be PNG, rename accordingly)
            content_type = img_resp.headers.get("content-type", "")
            if "png" in content_type:
                local_path = local_path.with_suffix(".png")

            with open(local_path, "wb") as f:
                f.write(img_resp.content)

            self.db.update_image_path(vid, str(local_path), is_seed)
            logger.info("Downloaded %s → %s", name, local_path.name)
            return str(local_path)

        except Exception as exc:
            logger.warning("Image download failed for '%s': %s", name, exc)
            return None

    # ── thread factory ────────────────────────────────────────────────────────
    def start_download_thread(self, vegetable_ids=None) -> DownloadThread:
        return DownloadThread(self, vegetable_ids)

    # ── formatting helpers ────────────────────────────────────────────────────
    @staticmethod
    def months_to_str(months: List[int]) -> str:
        if not months:
            return "—"
        return ", ".join(MONTHS_FR[m] for m in sorted(months))

    @staticmethod
    def get_current_season() -> str:
        month = date.today().month
        for season, months in SEASONS.items():
            if month in months:
                return season
        return "Printemps"
