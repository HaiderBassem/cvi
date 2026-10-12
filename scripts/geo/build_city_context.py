"""
Build real 3D city-context files for the site from open data.

  Footprints : Overture Maps Foundation buildings (merges OpenStreetMap,
               Microsoft ML Building Footprints and other open sources).
  Heights    : 1. height tagged in the source data (measured / mapped)
               2. number of floors x 3.2 m
               3. JRC GHS-BUILT-H 2018 average net building height (100 m grid,
                  derived from satellite data) sampled at the footprint centroid
               4. 6 m default — counted and reported, never hidden

Output: public/geo/<place key>.json (one file per entry in lib/geo/places.json)

Usage (from the project root):
  python3 -m venv .geo-venv && .geo-venv/bin/pip install -r scripts/geo/requirements.txt
  .geo-venv/bin/python scripts/geo/build_city_context.py            # all places
  .geo-venv/bin/python scripts/geo/build_city_context.py najaf      # one place
"""

from __future__ import annotations

import datetime as dt
import json
import math
import sys
import time
import urllib.request
import zipfile
from pathlib import Path

import duckdb
import numpy as np
import tifffile

ROOT = Path(__file__).resolve().parents[2]
PLACES = json.loads((ROOT / "lib" / "geo" / "places.json").read_text())
OUT_DIR = ROOT / "public" / "geo"
CACHE = ROOT / "data" / "geo-cache"

OVERTURE_RELEASE = "2026-09-23.1"
STAC_ITEM = "https://stac.overturemaps.org/{release}/buildings/building/{n:05d}/{n:05d}.json"
STAC_FILE_COUNT = 512

GHSL_TILE_URL = (
    "https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_BUILT_H_GLOBE_R2023A/"
    "GHS_BUILT_H_ANBH_E2018_GLOBE_R2023A_4326_3ss/V1-0/tiles/"
    "GHS_BUILT_H_ANBH_E2018_GLOBE_R2023A_4326_3ss_V1_0_{tile}.zip"
)

FLOOR_HEIGHT_M = 3.2
DEFAULT_HEIGHT_M = 6.0
M_PER_DEG_LAT = 110_540.0
M_PER_DEG_LNG_EQ = 111_320.0
USER_AGENT = "CVI-Architects-Portfolio/1.0 (city context builder)"


# ----------------------------------------------------------------- helpers


def fetch(url: str, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=300) as r, open(dest, "wb") as f:
        f.write(r.read())
    return dest


def bbox_for(lat: float, lng: float, radius_m: float) -> tuple[float, float, float, float]:
    dlat = radius_m / M_PER_DEG_LAT
    dlng = radius_m / (M_PER_DEG_LNG_EQ * math.cos(math.radians(lat)))
    return lng - dlng, lat - dlat, lng + dlng, lat + dlat


def overture_files_for(bboxes: list[tuple[float, float, float, float]]) -> list[str]:
    """Use the STAC catalogue's per-file bboxes so only a handful of parquet files are read."""
    index_path = CACHE / f"overture-{OVERTURE_RELEASE}-index.json"
    if index_path.exists():
        index = json.loads(index_path.read_text())
    else:
        index = []
        for n in range(STAC_FILE_COUNT):
            req = urllib.request.Request(STAC_ITEM.format(release=OVERTURE_RELEASE, n=n), headers={"User-Agent": USER_AGENT})
            try:
                with urllib.request.urlopen(req, timeout=60) as r:
                    item = json.loads(r.read())
            except Exception as exc:  # noqa: BLE001 - surface and keep going
                print(f"  ! STAC item {n} failed: {exc}")
                continue
            href = next(
                (a["href"] for a in item["assets"].values() if "amazonaws.com" in a.get("href", "")),
                None,
            )
            if href:
                index.append({"bbox": item["bbox"][:4], "href": href})
        index_path.parent.mkdir(parents=True, exist_ok=True)
        index_path.write_text(json.dumps(index))

    hits = []
    for entry in index:
        x0, y0, x1, y1 = entry["bbox"]
        for bx0, by0, bx1, by1 in bboxes:
            if x0 <= bx1 and x1 >= bx0 and y0 <= by1 and y1 >= by0:
                hits.append(entry["href"].replace("https://overturemaps-us-west-2.s3.us-west-2.amazonaws.com/", "s3://overturemaps-us-west-2/"))
                break
    return sorted(set(hits))


class GhslHeights:
    """Samples the GHS-BUILT-H ANBH raster (EPSG:4326, 3 arc-second) for one or more 10° tiles."""

    def __init__(self) -> None:
        self.tiles: dict[str, tuple[np.ndarray, float, float, float, float]] = {}

    @staticmethod
    def tile_name(lat: float, lng: float) -> str:
        row = int((90 - lat) // 10) + 1
        col = int((lng + 180) // 10) + 1
        return f"R{row}_C{col}"

    def _load(self, name: str):
        if name in self.tiles:
            return self.tiles[name]
        tif_dir = CACHE / "ghsl" / name
        tifs = list(tif_dir.glob("*.tif"))
        if not tifs:
            zip_path = CACHE / "ghsl" / f"{name}.zip"
            print(f"  downloading GHS-BUILT-H tile {name} …")
            fetch(GHSL_TILE_URL.format(tile=name), zip_path)
            with zipfile.ZipFile(zip_path) as zf:
                members = [m for m in zf.namelist() if m.endswith(".tif") and "/" not in m and ".." not in m]
                for m in members:
                    zf.extract(m, tif_dir)
            zip_path.unlink(missing_ok=True)
            tifs = list(tif_dir.glob("*.tif"))
        with tifffile.TiffFile(tifs[0]) as tf:
            page = tf.pages[0]
            sx, sy, _ = page.tags["ModelPixelScaleTag"].value
            _, _, _, x0, y0, _ = page.tags["ModelTiepointTag"].value
            data = page.asarray()
        self.tiles[name] = (data, x0, y0, sx, sy)
        return self.tiles[name]

    def height_at(self, lat: float, lng: float) -> float | None:
        data, x0, y0, sx, sy = self._load(self.tile_name(lat, lng))
        col = int((lng - x0) / sx)
        row = int((y0 - lat) / sy)
        if not (0 <= row < data.shape[0] and 0 <= col < data.shape[1]):
            return None
        v = float(data[row, col])
        return v if math.isfinite(v) and v > 0.5 else None


def largest_outer_ring(geojson: dict) -> list[list[float]] | None:
    t = geojson.get("type")
    if t == "Polygon":
        return geojson["coordinates"][0]
    if t == "MultiPolygon":
        rings = [poly[0] for poly in geojson["coordinates"] if poly]
        if not rings:
            return None

        def area(ring):
            return abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(ring, ring[1:])))

        return max(rings, key=area)
    return None


# ----------------------------------------------------------------- build


def build_place(con: duckdb.DuckDBPyConnection, files: list[str], ghsl: GhslHeights, place: dict) -> dict:
    lat0, lng0, radius = place["lat"], place["lng"], place["radius_m"]
    x0, y0, x1, y1 = bbox_for(lat0, lng0, radius)
    cos0 = math.cos(math.radians(lat0))

    t = time.time()
    rows = con.execute(
        """
        SELECT height, num_floors, ST_AsGeoJSON(geometry) AS g,
               ST_Y(ST_Centroid(geometry)) AS clat, ST_X(ST_Centroid(geometry)) AS clng
        FROM read_parquet(?)
        WHERE bbox.xmin <= ? AND bbox.xmax >= ? AND bbox.ymin <= ? AND bbox.ymax >= ?
        """,
        [files, x1, x0, y1, y0],
    ).fetchall()
    print(f"  {place['key']}: {len(rows)} footprints in {time.time() - t:.1f}s")

    buildings = []
    stats = {"measured": 0, "floors": 0, "ghsl": 0, "default": 0}
    for height, floors, g, clat, clng in rows:
        # keep the circular site, not the square bbox
        dx = (clng - lng0) * M_PER_DEG_LNG_EQ * cos0
        dz = (clat - lat0) * M_PER_DEG_LAT
        if math.hypot(dx, dz) > radius:
            continue
        ring = largest_outer_ring(json.loads(g))
        if not ring or len(ring) < 4:
            continue

        pts: list[list[float]] = []
        for lng, lat in ring[:-1]:
            p = [round((lng - lng0) * M_PER_DEG_LNG_EQ * cos0, 1), round((lat - lat0) * M_PER_DEG_LAT, 1)]
            if not pts or p != pts[-1]:
                pts.append(p)
        if len(pts) < 3:
            continue

        if height and height > 0:
            h, s = float(height), "m"
            stats["measured"] += 1
        elif floors and floors > 0:
            h, s = float(floors) * FLOOR_HEIGHT_M, "f"
            stats["floors"] += 1
        else:
            gh = ghsl.height_at(clat, clng)
            if gh:
                h, s = gh, "g"
                stats["ghsl"] += 1
            else:
                h, s = DEFAULT_HEIGHT_M, "d"
                stats["default"] += 1

        buildings.append({"h": round(min(h, 400.0), 1), "s": s, "p": pts})

    return {
        "key": place["key"],
        "name": place["name"],
        "center": [lat0, lng0],
        "radius_m": radius,
        "approximate": place.get("approximate", True),
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "sources": {
            "footprints": f"Overture Maps Foundation buildings {OVERTURE_RELEASE} (OpenStreetMap contributors, Microsoft ML Building Footprints) — ODbL / CDLA",
            "heights": "Mapped height or floors where available; otherwise JRC GHS-BUILT-H 2018 average net building height (100 m) — European Commission, CC BY 4.0",
        },
        "stats": {"buildings": len(buildings), **stats},
        "buildings": buildings,
    }


def main(argv: list[str]) -> int:
    wanted = set(argv[1:])
    places = [p for p in PLACES if not wanted or p["key"] in wanted]
    if not places:
        print(f"No places match {sorted(wanted)}. Known: {[p['key'] for p in PLACES]}")
        return 1

    con = duckdb.connect()
    for stmt in (
        "INSTALL spatial",
        "LOAD spatial",
        "INSTALL httpfs",
        "LOAD httpfs",
        # Anonymous public bucket. Without an explicit secret DuckDB walks the AWS
        # credential chain and can hang on the instance-metadata endpoint.
        "CREATE OR REPLACE SECRET overture (TYPE s3, PROVIDER config, REGION 'us-west-2')",
    ):
        con.execute(stmt)

    files = overture_files_for([bbox_for(p["lat"], p["lng"], p["radius_m"]) for p in places])
    print(f"Overture files covering the places: {len(files)}")
    ghsl = GhslHeights()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for place in places:
        data = build_place(con, files, ghsl, place)
        out = OUT_DIR / f"{place['key']}.json"
        out.write_text(json.dumps(data, separators=(",", ":")))
        print(f"  → {out.relative_to(ROOT)}  {out.stat().st_size / 1024:.0f} KB  {data['stats']}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
