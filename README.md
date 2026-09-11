# Satellites Over My City Predictor 📡

A web application that predicts when satellites pass over a chosen city (or any point
you click on the map), animates their ground track, and surfaces analytics about pass
frequency, orbit types, and visibility - alongside a live 3D globe, a best-pass
recommendation, and opt-in pass notifications.

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
- **Storage**: an in-memory cache (`backend/db.py`) holding the curated satellite set,
  refreshed on demand rather than on a fixed schedule (see the Deploying section for
  why this isn't a SQLite file).
- **Frontend**: Plain HTML/CSS/JS, [Leaflet](https://leafletjs.com/) for the maps and
  animated ground track, [Chart.js](https://www.chartjs.org/) for the insights
  dashboard, [globe.gl](https://github.com/vasturiano/globe.gl) (Three.js/WebGL) for the
  Home page's rotating globe. No build tooling required. Three tabs: "Home" (intro,
  rotating globe, how-it-works, glossary), "Map & Passes" (location picker, map, pass
  lists, dashboard), and "Global Tracking" (live world map).

```
backend/
  main.py        FastAPI app & API routes
  tle_fetch.py   pulls orbital element sets from Celestrak (concurrently), caches them
  propagate.py   Skyfield-based pass prediction & ground-track sampling
  db.py          in-memory TLE cache
  cities.py      curated city -> lat/lon lookup
  de421.bsp      bundled JPL ephemeris (sunlit/visibility calculation)
frontend/
  index.html, style.css
  app.js         location handling (city or map click), map, ground-track animation,
                 pass lists, best-pass spotlight
  dashboard.js   insights dashboard charts
  global.js      bonus: live global tracking map
  home-globe.js  Home page's rotating 3D globe (plots the same live satellite data)
  tabs.js        tab switching between the three views
  notifications.js  bonus: client-side pass alerts
api/
  index.py       Vercel entrypoint (imports the FastAPI app from backend/)
```

## Data Sources

The assignment brief lists several possible sources; after evaluating them for cost,
reliability, and whether they actually add value beyond what we can compute ourselves,
this project uses:

| Source | Used for | Why |
|---|---|---|
| [Celestrak](https://celestrak.org/NORAD/elements/) | Orbital element sets (TLEs), grouped by satellite category (space stations, weather, science, GPS, GOES) | Free, no API key, no rate limit, and always reflects the current active catalog. The core data dependency the app is built around. |
| [NASA JPL DE421 ephemeris](https://naif.jpl.nasa.gov/) (`de421.bsp`) | Sun/Earth positions, used to compute whether a satellite is sunlit at a given moment (the `visible` flag on every pass and on "Visible Right Now") | Downloaded once automatically by Skyfield on first use and cached locally (~17MB); this is real astronomical reference data, not something we could approximate ourselves. |
| [OpenStreetMap](https://www.openstreetmap.org/) tile server | Basemap imagery for both Leaflet maps (city view and live global tracking) | Free, no API key, standard choice for Leaflet-based maps. |
| Static city lookup (`backend/cities.py`) | City name → latitude/longitude | A small, curated table (31 cities) is simpler and more reliable than a geocoding API for a fixed set of cities; can be swapped for a geocoder later if free-text city search is needed. |

Additionally, [Leaflet](https://leafletjs.com/) and [Chart.js](https://www.chartjs.org/) are loaded from the cdnjs CDN - these are code libraries, not data sources, but are listed here for completeness since they are still external network dependencies.

Sources considered and intentionally **not** used, with reasoning:
- **Space-Track.org** - same underlying catalog data as Celestrak, but requires manual
  account approval; no benefit over Celestrak for this project.
- **N2YO API** - provides similar pass predictions, but requires an API key and has
  tight rate limits; Skyfield computes the same predictions locally, for any number of
  satellites, without limits.
- **Open-Notify ISS API** - only reports the ISS's current position; our own
  propagator already covers this (and every other tracked satellite) more generally.
- **satellitemap.space** - no documented public API.

We also did not restrict ourselves to only the four sources named in the brief, per
the assignment's "or other reliable sources" allowance - Celestrak's per-category
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
even with a proper User-Agent header - it was dropped as an unreliable dependency
rather than left flaky.)

Orbit type (LEO/MEO/GEO/HEO) is not trusted from the Celestrak group name - a
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

**Tab 1 - Home**

- Hero section pitching what the site does, with buttons that jump straight to
  "Map & Passes" or "Global Tracking"
- **Rotating 3D globe** (globe.gl / Three.js/WebGL): not just decorative - it plots the
  same real satellites from `/api/live-positions` as the Global Tracking tab, color-coded
  by orbit type, auto-rotating (paused automatically for visitors with "reduce motion"
  accessibility settings enabled), refreshing every 30 seconds
- "How It Works" - a plain-language walkthrough of why satellites produce "passes" at
  all, and how this site calculates them (real TLEs from Celestrak, real SGP4 orbital
  mechanics, for any point on Earth)
- An explanation of how "Best Pass" is actually chosen (filter to visible passes, then
  rank by peak elevation) - not just what the feature does, but why elevation is the
  deciding factor
- **Glossary**: a field guide to every term used across the app (Pass, Elevation,
  Azimuth, Altitude, Orbit Type, Visible/Sunlit, Ground Track, TLE), one concept per
  card, 4 per row on wide screens - aimed at a first-time visitor who doesn't yet know
  what "elevation 62°, azimuth 226°" means, not just an orbit-type reference

**Tab 2 - Map & Passes**

- City selector *or* click anywhere on the map - both work as location input, resolved
  by the same backend endpoints (`city=` or `lat=`/`lon=` query params). A map click
  fetches immediately, no extra button press needed. First visit prompts you to pick a
  location; return visits remember your last city (localStorage) and load it
  automatically
- List of upcoming passes (start time, end time, peak elevation, peak altitude,
  duration) - clicking a pass animates its ground track on the map; clicking it
  again (or the "Stop" button that appears above the map while animating) turns
  it off. A dashed line plus a live distance readout connects the location to the
  satellite's current ground-track position - for a low LEO pass this line is
  short, but for a MEO/GEO satellite it can stretch thousands of km, since a
  satellite that high can sit low in your sky while its ground track is a
  continent away. Without this, that looked like a data error rather than the
  expected geometry it actually is
- "Visible right now" panel: which tracked satellites are above the horizon (and
  actually sunlit/visible) right now - distinct from the upcoming-passes list, and how
  GEO satellites (which rarely produce a rise/set event) show up at all. Clicking one
  animates a short track centered on the current moment, sized to the satellite's
  orbit type (a fixed window that works for a fast LEO satellite is too short to show
  any visible motion for a slower MEO one) - and is labeled "near-stationary orbit"
  when a satellite genuinely doesn't move enough to show, rather than looking broken.
  Refreshes automatically every 30 seconds
- Insights dashboard: orbit-type distribution, **"LEO vs. Other Orbits: Avg. Pass
  Duration"** (a log-scale bar chart - this is the dashboard's answer to the
  assignment's "differences between LEO satellites and others" requirement: LEO
  passes last minutes, MEO/HEO passes can last hours, visually obvious at a glance),
  passes/day, average pass duration, most frequently *visible* satellites (sunlit,
  not just geometrically above the horizon)
- **Best Pass spotlight**: sits in the Insights Dashboard's stat row, automatically
  highlighting the single best upcoming viewing opportunity (the visible pass with the
  highest peak elevation) with a live countdown to rise time - an answer to "what's
  actually worth going outside for", computed entirely from data already fetched, no
  extra request needed
- **Pass notifications** (closes the assignment's own suggested bonus feature): opt in
  and the browser alerts you a few minutes before a good pass (visible, 30°+ peak
  elevation) rises. Purely client-side - no server push infrastructure, so it only
  fires while the tab stays open, which the status text says plainly rather than
  implying something more reliable than it is

**Tab 3 - Global Tracking**

- **Bonus feature - live global tracking**: a map showing the real-time current
  position of every curated satellite worldwide, color-coded by orbit type and polling
  `/api/live-positions` every 5 seconds. This is computed entirely locally from cached
  TLEs (no external calls per refresh), so it's cheap enough to poll continuously.
  The legend doubles as a filter - click LEO/MEO/GEO/HEO to show/hide that orbit
  class's markers - and markers grow on hover before showing their popup on click.

## Running Locally

```bash
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cd backend
uvicorn main:app --reload
```

Then open http://127.0.0.1:8000 in a browser.

## Deploying to Vercel

Vercel's Python functions are serverless: each request may run on a fresh,
ephemeral instance with no persistent local filesystem and no guarantee that
background work continues after a response is sent. Three parts of this app
originally assumed a normal long-running process, and needed to change to
deploy here:

| Was | Now | Why |
|---|---|---|
| SQLite file cache (`backend/satellites.db`) | In-memory dict (`backend/db.py`) | A "persistent" file isn't reliably persistent across serverless invocations, and isn't shared across instances anyway. |
| Background thread refreshing TLEs on startup | Synchronous "refresh if stale" check at the top of each data endpoint (`ensure_fresh()` in `main.py`) | Serverless functions aren't guaranteed to keep running in the background after the response is sent. |
| Ephemeris file (`de421.bsp`) auto-downloaded to the current working directory on first use | Committed to the repo (`backend/de421.bsp`, ~16MB) and loaded by an explicit path | The deployment filesystem is read-only outside `/tmp`, so a runtime download-and-cache-to-CWD pattern doesn't work there. |

Celestrak's 5 category feeds are also now fetched **concurrently** rather than
sequentially (`tle_fetch.py`), so a cold instance's first request pays for the
slowest single group's response time rather than the sum of all five -
roughly 1-2 seconds in testing, versus what could be many times that
sequentially if Celestrak is slow (which it has been, repeatedly, during this
project's development).

**Trade-off to know about:** on Vercel, the in-memory cache only lives as long
as a given instance stays warm. Under real traffic this means Celestrak gets
queried more often than the old 6-hour local cache would have. If that proves
too chatty against Celestrak's free API in practice, the fix isn't more
serverless workarounds - it's deploying this same code, unchanged, to a
platform that keeps one process running (Render, Railway, Fly.io), where the
original SQLite-file-plus-background-thread design (or this same in-memory
one) works exactly as it does locally.

### Deploy commands

```bash
npm install -g vercel   # if not already installed
vercel login
vercel                  # deploys a preview
vercel --prod           # deploys to production
```

Run these from the project root (where `vercel.json` lives). The first `vercel`
run will ask a few setup questions (link to a new or existing project); accept
the defaults unless you have a reason not to. No manual build command is
needed - `vercel.json` tells Vercel to build `api/index.py` as a Python
function (bundling `backend/` alongside it) and serve `frontend/` as static
files.

## Status

Feature-complete against the assignment brief, plus three bonus features (live
global tracking, a Best Pass spotlight, and client-side pass notifications) and a
Home page with an interactive 3D globe. Deployed and running on Vercel. See
[`docs/PROMPT_LOG.md`](docs/PROMPT_LOG.md) for a running log of how this project was
developed with AI assistance.
