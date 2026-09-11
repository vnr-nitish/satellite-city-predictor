import logging
from collections import Counter
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles

from cities import get_city_coords, list_cities
from db import get_all_tles
from propagate import get_currently_visible, get_live_positions, get_passes, get_track
from tle_fetch import refresh_curated_satellites

logger = logging.getLogger("satellite_app")

app = FastAPI(title="Satellites Over My City Predictor")

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"


def ensure_fresh():
    """Refresh the satellite cache if it's stale or empty, otherwise a cheap
    no-op. Called at the top of every data-serving endpoint rather than once
    at startup - a serverless deployment has no reliable "keep running in the
    background after the response is sent" guarantee, so a lazy, on-demand
    refresh is the pattern that works the same whether this process lives for
    milliseconds (one Vercel invocation) or weeks (a normal host)."""
    result = refresh_curated_satellites()
    for error in result.get("errors", []):
        logger.warning("TLE refresh error: %s", error)
    if not get_all_tles():
        logger.warning(
            "Satellite cache is empty after a refresh attempt - Celestrak may be "
            "temporarily unavailable. POST /api/refresh to retry."
        )


@app.get("/api/cities")
def api_cities():
    return {"cities": list_cities()}


@app.get("/api/satellites")
def api_satellites():
    ensure_fresh()
    return {"satellites": get_all_tles()}


@app.get("/api/passes")
def api_passes(city: str = Query(...), hours: float = Query(48, ge=1, le=168)):
    coords = get_city_coords(city)
    if not coords:
        raise HTTPException(status_code=404, detail=f"Unknown city '{city}'. See /api/cities.")
    ensure_fresh()
    lat, lon = coords
    return {
        "city": city,
        "lat": lat,
        "lon": lon,
        "hours": hours,
        "passes": get_passes(lat, lon, hours),
    }


@app.get("/api/track")
def api_track(
    norad_id: int = Query(...),
    start: str = Query(...),
    end: str = Query(...),
    step_seconds: int = Query(15, ge=1, le=300),
):
    ensure_fresh()
    return {"norad_id": norad_id, "points": get_track(norad_id, start, end, step_seconds)}


@app.get("/api/insights")
def api_insights(city: str = Query(...), hours: float = Query(48, ge=1, le=168)):
    coords = get_city_coords(city)
    if not coords:
        raise HTTPException(status_code=404, detail=f"Unknown city '{city}'. See /api/cities.")
    ensure_fresh()
    lat, lon = coords
    passes = get_passes(lat, lon, hours)

    total = len(passes)
    days = hours / 24
    passes_per_day = round(total / days, 2) if days else 0

    orbit_counts = Counter(p["orbit_type"] for p in passes)
    avg_duration = round(sum(p["duration_seconds"] for p in passes) / total, 1) if total else 0

    # The assignment specifically asks for "differences between LEO
    # satellites and others" - orbit_type_distribution alone only shows how
    # many passes come from each orbit type, not how those passes actually
    # differ. Average duration per orbit type is the concrete difference:
    # LEO passes last minutes, MEO/HEO passes can last hours, by contrast.
    avg_duration_by_orbit_type = {}
    for orbit_type in orbit_counts:
        durations = [p["duration_seconds"] for p in passes if p["orbit_type"] == orbit_type]
        avg_duration_by_orbit_type[orbit_type] = round(sum(durations) / len(durations), 1)

    # "Most frequently visible" means actually visible (above horizon AND
    # sunlit), not just geometrically above the horizon - a satellite that
    # passes over at noon every day isn't something anyone would ever see.
    visible_passes = [p for p in passes if p["visible"]]
    top_satellites = Counter(p["name"] for p in visible_passes).most_common(5)

    return {
        "city": city,
        "window_hours": hours,
        "total_passes": total,
        "visible_passes": len(visible_passes),
        "passes_per_day": passes_per_day,
        "orbit_type_distribution": dict(orbit_counts),
        "average_duration_seconds": avg_duration,
        "avg_duration_by_orbit_type": avg_duration_by_orbit_type,
        "top_satellites": [{"name": n, "passes": c} for n, c in top_satellites],
    }


@app.get("/api/currently-visible")
def api_currently_visible(city: str = Query(...)):
    coords = get_city_coords(city)
    if not coords:
        raise HTTPException(status_code=404, detail=f"Unknown city '{city}'. See /api/cities.")
    ensure_fresh()
    lat, lon = coords
    return {"city": city, "satellites": get_currently_visible(lat, lon)}


@app.get("/api/live-positions")
def api_live_positions():
    ensure_fresh()
    return {"positions": get_live_positions()}


@app.post("/api/refresh")
def api_refresh():
    return refresh_curated_satellites(force=True)


# On Vercel, the frontend is deployed and served separately as static output
# (see vercel.json) - this directory won't exist inside the Python function's
# bundle, so mounting it unconditionally would crash the app at import time.
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
