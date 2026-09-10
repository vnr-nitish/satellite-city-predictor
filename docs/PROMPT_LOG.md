# Development Prompt Log

A running summary of how this project was developed with AI assistance (Claude Code),
updated periodically alongside commits. Entries are paraphrased summaries of the
actual working sessions, not verbatim transcripts.

## Session 1 — Ideation & Planning (2026-09-10)

- Reviewed the assignment brief for the "Satellites Over My City Predictor" web app
  and worked through how to scope it: what data to collect, how to structure the
  analytics, and what the finished web app needs to deliver.
- Discussed development environment (VS Code vs. Google Colab) and settled on a
  standard local project in VS Code, since the deliverable is a persistent web service
  with a live UI, not a notebook-style analysis.
- Designed the architecture: FastAPI backend, Skyfield/SGP4 for orbit propagation,
  SQLite for caching, Leaflet + Chart.js frontend with no build tooling.
- Asked for a plain-language explanation of the underlying orbital-mechanics
  concepts — what a TLE (Two-Line Element set) is, and how an SGP4 orbit propagator
  turns one into a satellite's position and pass windows over a location — to
  understand what the code is actually doing rather than treating it as a black box.
- Evaluated infrastructure options: confirmed a local SQLite database is sufficient
  (no need for a hosted database service such as Supabase/Firebase, which would add
  cost and complexity without benefit at this scale), and confirmed that Claude
  Code's MCP integrations are a development-time tool for the assistant, not
  something the deployed application itself depends on.
- Decided the curated satellite set should be pulled dynamically from Celestrak's
  per-category feeds (space stations, weather, GPS, Starlink, GOES) rather than a
  hardcoded list of satellite IDs, and that the project should not be limited to the
  four data sources named in the brief.
- Set up a dedicated project repository (separate from an existing personal/shared
  repo that had unrelated content and a mismatched remote) so the codebase submitted
  for evaluation is self-contained, with instructions to commit incrementally as
  work progresses rather than as a single final push.

## Session 2 — Initial Build (2026-09-10)

- Built the first working vertical slice: Celestrak TLE ingestion into SQLite,
  Skyfield-based pass prediction (rise/peak/set times, duration, orbit type), a
  FastAPI backend exposing `/api/cities`, `/api/passes`, `/api/track`, and
  `/api/insights`, and a Leaflet + Chart.js frontend showing an animated ground
  track, an upcoming-passes list, and an insights dashboard (orbit-type mix,
  passes/day, average duration, most frequent satellites).
- Ran the server end-to-end against live Celestrak data and caught several real
  issues rather than assuming the first version worked: one Celestrak group name
  used in the original design (`noaa`) no longer exists and had to be corrected
  to `weather`; the `starlink` group was found to be throttled/blocked
  regardless of request headers and was dropped as an unreliable dependency; a
  17MB ephemeris download used for the sunlit-visibility check was blocking
  server startup and was made to load lazily on first use instead.
- Discovered that trusting each Celestrak category as a single orbit-type label
  was inaccurate (the "science" category mixes low-orbit satellites like Hubble
  with highly elliptical ones like the Chandra X-ray Observatory), which was
  also skewing the average-pass-duration insight. Fixed by classifying orbit
  type (LEO/MEO/GEO/HEO) directly from each satellite's own TLE parameters
  (mean motion and eccentricity) instead.
- Verified the fix against live data: Chandra and the NASA POLAR spacecraft now
  correctly classify as HEO, and their pass durations (tens of thousands of
  seconds, versus a few hundred for a typical ISS/Hubble pass) turned out to be
  a genuine, useful illustration of the assignment's "differences between LEO
  and other orbits" requirement rather than a data error.
