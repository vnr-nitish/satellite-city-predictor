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
- Reorganized the project to live directly at the workspace root actually open
  in the editor (rather than as a nested subfolder), so the working files and
  the assistant session stay in the same place instead of requiring a folder
  switch that would disconnect the running session.

## Session 3 — Browser Verification (2026-09-10)

- Rather than trusting the API-level testing from Session 2, actually launched
  the app and drove it with a headless browser (Playwright) to see what a real
  user would see, and caught two bugs that curl-based testing had missed:
  - The Chart.js CDN URL referenced a version/filename combination that
    doesn't exist (404), so the insights dashboard silently failed to render
    with a `Chart is not defined` error. Corrected to a version that actually
    resolves.
  - The startup satellite-data refresh ran synchronously against Celestrak,
    which blocked the entire server (including basic health checks) from
    responding at all until every satellite group finished fetching - on a
    slow run this left the app completely unresponsive for over a minute.
    Moved the refresh to a background thread so the server is reachable
    immediately, with satellite data populating shortly after.
  - Also added startup logging for TLE-refresh failures, which had previously
    failed silently, making a stale/empty cache hard to diagnose.
- Confirmed via screenshot that the fixed app actually works end-to-end: city
  selection, the upcoming-passes list, the animated ground-track on the map,
  and both dashboard charts all render correctly with live data and no
  console errors.

## Session 4 — Bonus Feature: Live Global Tracking (2026-09-10)

- Implemented the "real-time satellite tracking showing current satellite
  positions globally" bonus option from the brief: a `/api/live-positions`
  endpoint (positions computed locally from cached TLEs, no external calls,
  so it's cheap to poll) and a second Leaflet map on the page that polls it
  every 5 seconds, color-coding each satellite marker by orbit type with a
  legend.
- While testing it, hit Celestrak rate-limiting (`503 Service Unavailable`
  across every group) from the volume of manual testing earlier in the
  session. Rather than wait it out blindly, verified the new feature by
  seeding the local cache with real TLE data already fetched successfully
  earlier in the session - this only affects the local test database
  (gitignored, never committed), not the application code, which still fetches
  live from Celestrak normally.
- Confirmed via screenshot: 8 satellites rendered at their correct real-world
  positions and altitudes (LEO ~500-900km, MEO ~20,500km, GEO ~35,800km, HEO
  tens of thousands of km), color-coded correctly by orbit type, with the
  "last updated" timestamp refreshing and no console errors.
