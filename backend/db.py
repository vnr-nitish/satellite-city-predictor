"""
In-memory TLE cache.

This used to be a SQLite file on disk. That worked for a normal long-running
local server, but breaks on serverless platforms like Vercel, where each
function instance gets an ephemeral filesystem that isn't guaranteed to
persist between invocations - a "persistent" cache file there is neither
persistent nor safely shared across instances. Since the curated satellite
list is small (a few dozen rows) and cheap to refetch, a plain in-memory
cache is simpler, has no file to accidentally delete out from under a
running process (which happened twice during local development), and works
identically on a long-running host or a serverless one.

The trade-off: on serverless, this cache only survives for the lifetime of
a warm instance, so a cold start pays the cost of one Celestrak refresh. On a
normal host (local dev, Render, Railway, etc.) it behaves like before, just
reset on process restart instead of surviving one.
"""

from datetime import datetime, timezone
from typing import Dict, Optional

_tle_cache: Dict[int, dict] = {}
_last_refreshed_at: Optional[datetime] = None


def init_db():
    pass  # kept for compatibility with existing call sites; nothing to set up


def upsert_tle(norad_id: int, name: str, orbit_type: str, line1: str, line2: str):
    global _last_refreshed_at
    _last_refreshed_at = datetime.now(timezone.utc)
    _tle_cache[norad_id] = {
        "norad_id": norad_id,
        "name": name,
        "orbit_type": orbit_type,
        "line1": line1,
        "line2": line2,
        "fetched_at": _last_refreshed_at.isoformat(),
    }


def get_all_tles():
    return sorted(_tle_cache.values(), key=lambda row: row["name"])


def get_tle(norad_id: int):
    return _tle_cache.get(norad_id)


def cache_age_hours() -> float:
    if _last_refreshed_at is None:
        return float("inf")
    return (datetime.now(timezone.utc) - _last_refreshed_at).total_seconds() / 3600
