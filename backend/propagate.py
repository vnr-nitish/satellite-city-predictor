"""
Orbit propagation and pass prediction using Skyfield (SGP4 under the hood).

A TLE is a snapshot of a satellite's orbit at one moment. Skyfield's SGP4
implementation takes that snapshot plus a target time and returns where the
satellite actually is. To find "passes" over a city, we scan forward in time
and ask Skyfield for the rise / culminate (peak) / set events - the moments
the satellite crosses above/below a minimum elevation angle as seen from that
city, and the moment it's highest in between.

Note on geostationary (GEO) satellites: this rise/set "pass" model doesn't
really apply to them - from a fixed city they're either continuously above
the horizon or continuously below it, so they rarely produce a rise+set pair
within any given time window and are correctly (not accidentally) absent
from most cities' pass lists. This asymmetry - LEO satellites sweep by in
minutes, MEO satellites (e.g. GPS) linger for hours, GEO satellites are
effectively static - is itself one of the "LEO vs other orbits" insights the
project is meant to surface.
"""

from datetime import timedelta

from skyfield.api import EarthSatellite, load, wgs84

from db import get_all_tles, get_tle

_ts = load.timescale()

_eph = None
_eph_load_failed = False


def _get_ephemeris():
    """Lazily download/load the JPL ephemeris (~17MB) used for the sunlit
    check, only on first use - so importing this module or starting the
    server never blocks on that download."""
    global _eph, _eph_load_failed
    if _eph is not None or _eph_load_failed:
        return _eph
    try:
        _eph = load("de421.bsp")
    except Exception:
        _eph_load_failed = True
    return _eph


def _build_satellite(row):
    return EarthSatellite(row["line1"], row["line2"], row["name"], _ts)


def _is_sunlit(sat, t):
    eph = _get_ephemeris()
    if eph is None:
        return None
    try:
        return bool(sat.at(t).is_sunlit(eph))
    except Exception:
        return None


def get_passes(city_lat: float, city_lon: float, hours: float = 48, min_elevation_deg: float = 10):
    observer = wgs84.latlon(city_lat, city_lon)
    t0 = _ts.now()
    t1 = _ts.from_datetime(t0.utc_datetime() + timedelta(hours=hours))

    passes = []
    for row in get_all_tles():
        sat = _build_satellite(row)
        try:
            times, events = sat.find_events(observer, t0, t1, altitude_degrees=min_elevation_deg)
        except Exception:
            continue

        current = {}
        for t, event in zip(times, events):
            if event == 0:  # rise
                current = {"rise_time": t.utc_iso()}
            elif event == 1:  # culminate (peak)
                alt, _, _ = (sat - observer).at(t).altaz()
                current["peak_time"] = t.utc_iso()
                current["peak_elevation_deg"] = round(alt.degrees, 1)
                current["peak_altitude_km"] = round(wgs84.subpoint(sat.at(t)).elevation.km, 1)
            elif event == 2 and "rise_time" in current:  # set
                current["set_time"] = t.utc_iso()
                rise_dt = t.utc_datetime()
                current["norad_id"] = row["norad_id"]
                current["name"] = row["name"]
                current["orbit_type"] = row["orbit_type"]
                sunlit = _is_sunlit(sat, t)
                current["visible"] = True if sunlit is None else sunlit
                passes.append(current)
                current = {}

    passes.sort(key=lambda p: p["rise_time"])
    for p in passes:
        p["duration_seconds"] = round(
            (_iso_to_dt(p["set_time"]) - _iso_to_dt(p["rise_time"])).total_seconds()
        )
    return passes


def _iso_to_dt(iso_str):
    from datetime import datetime

    return datetime.fromisoformat(iso_str.replace("Z", "+00:00"))


def get_live_positions():
    """Current lat/lon/altitude for every curated satellite, computed locally
    from cached TLEs - no external API call, so this is cheap enough to poll
    every few seconds for a live global-tracking view."""
    now = _ts.now()
    positions = []
    for row in get_all_tles():
        sat = _build_satellite(row)
        try:
            subpoint = wgs84.subpoint(sat.at(now))
        except Exception:
            continue
        positions.append(
            {
                "norad_id": row["norad_id"],
                "name": row["name"],
                "orbit_type": row["orbit_type"],
                "lat": round(subpoint.latitude.degrees, 4),
                "lon": round(subpoint.longitude.degrees, 4),
                "alt_km": round(subpoint.elevation.km, 1),
            }
        )
    return positions


def get_track(norad_id: int, start_iso: str, end_iso: str, step_seconds: int = 15):
    row = get_tle(norad_id)
    if not row:
        return []

    sat = _build_satellite(row)
    start = _iso_to_dt(start_iso)
    end = _iso_to_dt(end_iso)

    points = []
    t = start
    while t <= end:
        skyfield_t = _ts.from_datetime(t)
        subpoint = wgs84.subpoint(sat.at(skyfield_t))
        points.append(
            {
                "time": t.isoformat(),
                "lat": round(subpoint.latitude.degrees, 4),
                "lon": round(subpoint.longitude.degrees, 4),
                "alt_km": round(subpoint.elevation.km, 1),
            }
        )
        t += timedelta(seconds=step_seconds)
    return points
