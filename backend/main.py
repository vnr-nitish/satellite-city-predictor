from collections import Counter
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles

from cities import get_city_coords, list_cities
from db import get_all_tles, init_db
from propagate import get_passes, get_track
from tle_fetch import refresh_curated_satellites

app = FastAPI(title="Satellites Over My City Predictor")

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"


@app.on_event("startup")
def startup():
    init_db()
    refresh_curated_satellites()


@app.get("/api/cities")
def api_cities():
    return {"cities": list_cities()}


@app.get("/api/satellites")
def api_satellites():
    return {"satellites": get_all_tles()}


@app.get("/api/passes")
def api_passes(city: str = Query(...), hours: float = Query(48, ge=1, le=168)):
    coords = get_city_coords(city)
    if not coords:
        raise HTTPException(status_code=404, detail=f"Unknown city '{city}'. See /api/cities.")
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
    return {"norad_id": norad_id, "points": get_track(norad_id, start, end, step_seconds)}


@app.get("/api/insights")
def api_insights(city: str = Query(...), hours: float = Query(48, ge=1, le=168)):
    coords = get_city_coords(city)
    if not coords:
        raise HTTPException(status_code=404, detail=f"Unknown city '{city}'. See /api/cities.")
    lat, lon = coords
    passes = get_passes(lat, lon, hours)

    total = len(passes)
    days = hours / 24
    passes_per_day = round(total / days, 2) if days else 0

    orbit_counts = Counter(p["orbit_type"] for p in passes)
    avg_duration = round(sum(p["duration_seconds"] for p in passes) / total, 1) if total else 0
    top_satellites = Counter(p["name"] for p in passes).most_common(5)

    return {
        "city": city,
        "window_hours": hours,
        "total_passes": total,
        "passes_per_day": passes_per_day,
        "orbit_type_distribution": dict(orbit_counts),
        "average_duration_seconds": avg_duration,
        "top_satellites": [{"name": n, "passes": c} for n, c in top_satellites],
    }


@app.post("/api/refresh")
def api_refresh():
    return refresh_curated_satellites(force=True)


app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
