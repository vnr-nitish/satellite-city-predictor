"""
Pulls curated satellite TLE (Two-Line Element) sets from Celestrak.

Rather than hardcoding NORAD catalog numbers from memory (risky - they can be
wrong), we pull Celestrak's public *group* feeds (stations, weather, GPS, etc.)
and take a handful of satellites from each group. This keeps the curated list
small (fast to propagate) while covering a variety of orbit types, and always
reflects Celestrak's current active catalog rather than a stale guess.

Orbit type (LEO/MEO/GEO/HEO) is classified from each satellite's own TLE
parameters (mean motion, eccentricity), not from which Celestrak group it came
from - a Celestrak "category" like "science" mixes true low-orbit satellites
(e.g. Hubble) with highly elliptical ones (e.g. Chandra X-ray Observatory),
so the group name alone isn't a reliable orbit-type label.
"""

import requests

from db import upsert_tle, cache_age_hours

CELESTRAK_URL = "https://celestrak.org/NORAD/elements/gp.php"
REQUEST_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; satellite-city-predictor/1.0)"}

# Celestrak group name -> how many satellites to keep from it.
# Picking from several categories just gives orbit-type variety for the
# curated set; the actual orbit_type stored is computed per-satellite below.
CURATED_GROUPS = {
    "stations": 6,   # ISS, Tiangong, etc. (LEO)
    "weather": 4,    # DMSP, Meteosat, etc. (mostly LEO)
    "science": 4,    # Hubble, Chandra, etc. (mixed LEO/HEO)
    "gps-ops": 4,    # GPS constellation (MEO)
    "goes": 3,       # geostationary weather satellites (GEO)
}
# Note: Celestrak's "starlink" group (thousands of objects) is throttled/blocked
# with a 403 far more aggressively than the smaller category feeds above, even
# with a browser User-Agent. It's skipped here rather than left as a flaky
# dependency - the groups above already give solid LEO/MEO/GEO/HEO coverage.

REFRESH_INTERVAL_HOURS = 6


def _fetch_group_tle_text(group: str) -> str:
    resp = requests.get(
        CELESTRAK_URL,
        params={"GROUP": group, "FORMAT": "tle"},
        headers=REQUEST_HEADERS,
        timeout=30,
    )
    resp.raise_for_status()
    if resp.text.startswith("Invalid query") or resp.text.startswith("No GP data found"):
        raise requests.RequestException(f"Celestrak rejected group '{group}': {resp.text.strip()}")
    return resp.text


def _parse_tle_blocks(text: str):
    lines = [line.rstrip("\r\n") for line in text.splitlines() if line.strip()]
    blocks = []
    for i in range(0, len(lines) - 2, 3):
        name, line1, line2 = lines[i], lines[i + 1], lines[i + 2]
        if line1.startswith("1 ") and line2.startswith("2 "):
            norad_id = int(line1[2:7])
            blocks.append((norad_id, name.strip(), line1, line2))
    return blocks


def _classify_orbit(line2: str) -> str:
    """Classify orbit type from TLE mean motion (rev/day) and eccentricity."""
    mean_motion = float(line2[52:63])
    eccentricity = float("0." + line2[26:33].strip())
    period_minutes = 1440 / mean_motion if mean_motion else 0

    if eccentricity > 0.25:
        return "HEO"
    if period_minutes < 128:
        return "LEO"
    if 1430 <= period_minutes <= 1450 and eccentricity < 0.05:
        return "GEO"
    return "MEO"


def refresh_curated_satellites(force: bool = False):
    if not force and cache_age_hours() < REFRESH_INTERVAL_HOURS:
        return {"refreshed": False, "reason": "cache still fresh"}

    fetched = 0
    errors = []
    for group, limit in CURATED_GROUPS.items():
        try:
            text = _fetch_group_tle_text(group)
        except requests.RequestException as exc:
            errors.append(f"{group}: {exc}")
            continue

        for norad_id, name, line1, line2 in _parse_tle_blocks(text)[:limit]:
            orbit_type = _classify_orbit(line2)
            upsert_tle(norad_id, name, orbit_type, line1, line2)
            fetched += 1

    return {"refreshed": True, "satellites_fetched": fetched, "errors": errors}
