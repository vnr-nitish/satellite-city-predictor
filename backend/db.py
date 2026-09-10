import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).parent / "satellites.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS tle_cache (
            norad_id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            orbit_type TEXT NOT NULL,
            line1 TEXT NOT NULL,
            line2 TEXT NOT NULL,
            fetched_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


def upsert_tle(norad_id: int, name: str, orbit_type: str, line1: str, line2: str):
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO tle_cache (norad_id, name, orbit_type, line1, line2, fetched_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(norad_id) DO UPDATE SET
            name=excluded.name,
            orbit_type=excluded.orbit_type,
            line1=excluded.line1,
            line2=excluded.line2,
            fetched_at=excluded.fetched_at
        """,
        (norad_id, name, orbit_type, line1, line2, datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    conn.close()


def get_all_tles():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM tle_cache ORDER BY name").fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_tle(norad_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM tle_cache WHERE norad_id = ?", (norad_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def cache_age_hours() -> float:
    conn = get_connection()
    row = conn.execute("SELECT MIN(fetched_at) AS oldest FROM tle_cache").fetchone()
    conn.close()
    if not row or not row["oldest"]:
        return float("inf")
    oldest = datetime.fromisoformat(row["oldest"])
    return (datetime.now(timezone.utc) - oldest).total_seconds() / 3600
