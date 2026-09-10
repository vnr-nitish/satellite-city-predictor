# Satellites Over My City Predictor 📡

A web application that predicts when satellites pass over a chosen city, animates their
ground track on a map, and surfaces analytics about pass frequency, orbit types, and
visibility.

## Problem Statement

Many satellites orbit the Earth and pass over different cities at different times.
People interested in astronomy, satellite observation, or space technology often want
to know when satellites will be visible from their location. This project predicts
satellite passes over a selected city, showing pass timing, duration, and an animated
orbital path on a map, along with a dashboard of derived insights.

## Architecture

- **Backend**: FastAPI (Python) serves both the JSON API and the static frontend.
- **Orbit math**: [Skyfield](https://rhodesmill.org/skyfield/) (SGP4 propagator) turns
  raw orbital element sets into satellite positions and rise/peak/set pass events for a
  given city.
- **Storage**: SQLite (`backend/satellites.db`, gitignored) caches fetched orbital data
  so we don't hit external sources on every request.
- **Frontend**: Plain HTML/CSS/JS, [Leaflet](https://leafletjs.com/) for the map and
  animated ground track, [Chart.js](https://www.chartjs.org/) for the insights
  dashboard. No build tooling required.

```
backend/
  main.py        FastAPI app & API routes
  tle_fetch.py   pulls orbital element sets from Celestrak, caches to SQLite
  propagate.py   Skyfield-based pass prediction & ground-track sampling
  db.py          SQLite schema/helpers
  cities.py      curated city -> lat/lon lookup
frontend/
  index.html, style.css
  app.js         city passes: map, ground-track animation, pass list
  dashboard.js   insights dashboard charts
  global.js      bonus: live global tracking map
```

## Data Sources

The assignment brief lists several possible sources; after evaluating them for cost,
reliability, and whether they actually add value beyond what we can compute ourselves,
this project uses:

| Source | Used for | Why |
|---|---|---|
| [Celestrak](https://celestrak.org/NORAD/elements/) | Orbital element sets (TLEs), grouped by satellite category (space stations, weather, GPS, Starlink, etc.) | Free, no API key, no rate limit, and always reflects the current active catalog. This is the only live external dependency the app has. |
| Static city lookup (`backend/cities.py`) | City name → latitude/longitude | A small, curated table is simpler and more reliable than a geocoding API for a fixed set of cities; can be swapped for a geocoder later if free-text city search is needed. |

Sources considered and intentionally **not** used, with reasoning:
- **Space-Track.org** — same underlying catalog data as Celestrak, but requires manual
  account approval; no benefit over Celestrak for this project.
- **N2YO API** — provides similar pass predictions, but requires an API key and has
  tight rate limits; Skyfield computes the same predictions locally, for any number of
  satellites, without limits.
- **Open-Notify ISS API** — only reports the ISS's current position; our own
  propagator already covers this (and every other tracked satellite) more generally.
- **satellitemap.space** — no documented public API.

We also did not restrict ourselves to only the four sources named in the brief, per
the assignment's "or other reliable sources" allowance — Celestrak's per-category
group feeds (rather than one fixed list of hardcoded satellites) is itself a broader
and more maintainable data source, since it always reflects Celestrak's live catalog
instead of a list of satellite IDs that could go stale or be wrong.

## Curated Satellite Set

Propagating passes for the entire active catalog (~10,000 objects) per request is
expensive. Instead, the app pulls a curated set from Celestrak's category feeds
(space stations, weather satellites, science missions, GPS, GOES), giving a mix of
orbit types that's fast to compute and still meaningful for the analytics dashboard.
(Celestrak's `starlink` group was tried too, but Celestrak throttles/blocks that
specific large-catalog query far more aggressively than the smaller category feeds,
even with a proper User-Agent header — it was dropped as an unreliable dependency
rather than left flaky.)

Orbit type (LEO/MEO/GEO/HEO) is not trusted from the Celestrak group name — a
category like "science" mixes true low-orbit satellites (Hubble) with highly
elliptical ones (Chandra X-ray Observatory). Instead it's classified per-satellite
from the TLE's own mean motion and eccentricity, which is more accurate and is
itself a small piece of real data analysis rather than a hardcoded label.

## Core Concepts

- **TLE (Two-Line Element set)**: a compact, standardized snapshot of a satellite's
  orbit at a point in time (inclination, eccentricity, mean motion, etc.), published by
  NORAD and mirrored by Celestrak.
- **Orbit propagator (SGP4)**: the algorithm that takes a TLE and a target time and
  computes the satellite's actual position at that time. Skyfield wraps SGP4 with a
  Python API.
- **Pass prediction**: for a given city, we scan the satellite's elevation angle above
  the horizon forward in time; the moments it crosses above/below a minimum elevation
  threshold are the rise/set of a pass, and the highest point in between is the peak.

## Features

- City selector with animated satellite ground-track visualization on a map
- List of upcoming passes (start time, peak elevation, duration)
- Insights dashboard: orbit-type distribution, passes/day, average pass duration, most
  frequently visible satellites
- **Bonus feature — live global tracking**: a second map showing the real-time current
  position of every curated satellite worldwide, color-coded by orbit type and polling
  `/api/live-positions` every 5 seconds. This is computed entirely locally from cached
  TLEs (no external calls per refresh), so it's cheap enough to poll continuously.

## Running Locally

```bash
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cd backend
uvicorn main:app --reload
```

Then open http://127.0.0.1:8000 in a browser.

## Status

Initial working slice: TLE ingestion, pass prediction, map animation, and insights
dashboard are functional for the curated satellite set and city list. See
[`docs/PROMPT_LOG.md`](docs/PROMPT_LOG.md) for a running log of how this project was
developed with AI assistance.
