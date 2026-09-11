# Development Prompt Log

A running log of the actual prompts used to build this project with Claude Code.
Each entry is the student's real request, rewritten into clear, well-structured
English rather than pasted verbatim - not a summary of what happened, but the
actual prompt, cleaned up for grammar and sentence structure so the development
process stays transparent and readable.

## Session 1 - Ideation & Planning (2026-09-10)

**Prompt:**
> I've been assigned an ML project - let me give you the context. It's a
> satellite predictor. We need to start by ideating: how we'll collect the
> data, what kind of analytics to run, and so on - you'll see the details in
> the assignment below. Let's begin with ideation.
>
> [Assignment text: "Satellites Over My City Predictor" - problem statement,
> data sources (Celestrak, N2YO, Space-Track, Open-Notify, satellitemap.space),
> project tasks (data collection, processing, analysis), web application
> requirements (map-based visualization, animated satellite paths, upcoming
> passes list, insights dashboard), and a bonus feature.]
>
> Let's work through the problem statement and the requirements together so we
> can decide how to proceed. I'd like to do this in VS Code - would you
> recommend switching to Google Colab instead? Let me know.

**Prompt:**
> That's great. Now, about data collection - do we need it for this project,
> and which websites will we depend on? And for the database - do we need to
> set one up, and would we need something like Supabase or Firebase? Please
> list out everything we'd require, since I don't have access to any paid
> tiers. If any of that requires MCP servers, can we connect those to Claude
> Code? I'm using Claude Code inside VS Code, so I'm not sure whether that's
> possible here. I'd also like to understand a couple of concepts - what
> exactly is a TLE, and what does an orbit propagator do? Please explain those
> so I understand what's actually happening. And what about the dashboard -
> isn't that also part of the requirements? You didn't mention it yet.

**Prompt:**
> You'll need to commit the code and prompts to GitHub periodically rather
> than all at once - every few hours, whenever there's substantial progress.
> I need this for the evaluator's benefit. When you log the prompts, rephrase
> them so it's clear I'm not just copy-pasting. Also, we're not restricted to
> only the four data sources listed - the assignment allows other reliable
> sources too, so feel free to look beyond those. Let's start building.

*(Note: this instruction was later revised in Session 5 - the evaluator
wants the actual prompts, not a rephrased summary. This log was rewritten
accordingly, and again in this final pass for clearer English throughout.)*

**Follow-up:** provided the GitHub repo URL to push the project to:
`https://github.com/vnr-nitish/satellite-city-predictor.git`

## Session 2 - Initial Build (2026-09-10)

*(Continuing the same working session - build the first working version of
the app based on the architecture agreed on in Session 1.)*

**Prompt:**
> I can continue, but there's a problem: I'm running Claude Code in VS Code
> inside a folder called "New folder," while you've created the project in a
> separate folder called "satellite-city-predictor." If I open that folder
> instead, I'll lose access to this chat. Can you find a way to resolve that?

**Prompt:**
> Also, if possible, rename "New folder" to "satellite-city-predictor" and
> move all the project files into it, so we're not left with redundant
> folders - that would be cleaner. Let's get back to work on the project.

## Session 3 - Browser Verification (2026-09-10)

*(No new prompt - continuing under the standing instruction to actually run
and verify the app in a browser rather than just testing the API.)*

## Session 4 - Bonus Feature Selection (2026-09-10)

**Selected via clarifying question:** build the bonus feature (live global
satellite tracking) next, rather than polishing existing features first.

## Session 5 - Prompt Log Correction (2026-09-10)

**Prompt:**
> Let's run this on localhost so I can see the changes myself. Also, about
> the prompt log - it seems the evaluator expects the actual prompts I've
> given you, not a summary. Please use my real prompts, lightly adjusted for
> sentence structure, since the current format isn't quite right.

This log was rewritten to reflect that: entries above now carry the actual
prompts (cleaned up for grammar) rather than a third-person paraphrase of
what happened during each session.

## Session 6 - Data Processing / Data Analysis Cross-Check (2026-09-11)

**Prompt:**
> Let's cross-check the Data Processing and Data Analysis requirements so we
> can add anything we've missed.
>
> [Pasted the assignment's "Data Processing" bullet list: parsing TLE data,
> converting orbital parameters into positions, filtering satellites visible
> from a location, calculating pass start time/peak altitude/duration,
> preparing data structures for mapping and visualization.]
>
> Give me a summary of each point, stating whether we've covered it, and also
> start up the local host.

Cross-checked each point against the actual code. All five were already
covered, with one real gap closed: the pass data only reported peak elevation
*angle*, not the satellite's physical orbital altitude in km, which the
assignment's feature list separately asks for. Added `peak_altitude_km`.

**Prompt:**
> Yes, please do the same cross-check for Data Analysis. Also, I selected
> Bengaluru and clicked Find Passes, but nothing came back - please check if
> something needs to be activated on your end. And the city list currently
> shown is quite limited - can we add more cities, like Visakhapatnam, Pune,
> and others?

Investigated the Bengaluru bug: a genuine 500 error, but self-inflicted during
the previous session (the running server's SQLite file was deleted for
cleanup while the server was still using it, leaving the database without its
table). Fixed the immediate issue with a clean restart, then hardened the
underlying fragility - the schema is now recreated idempotently on every
connection instead of once at startup, so the app can't be left in that
broken state again.

The requested cities (Visakhapatnam, Pune) were already in the list - the
"very few cities" report was most likely the page having loaded during that
same server-restart window. Expanded the curated city list from 15 to 31
regardless, since more variety is a clear win for the demo either way.

Cross-checking Data Analysis against the code surfaced two real gaps: no
endpoint answered "which satellites are currently visible" (only future pass
predictions existed), and "most frequently visible" was counting all
geometric passes rather than only the ones actually flagged visible (sunlit).
Added a `/api/currently-visible` endpoint and a "Visible Right Now" panel,
and changed the most-frequent-satellites calculation to count only visible
passes.

**Prompt:**
> [Pasted the assignment's "Data Analysis" bullet list again.] Let's
> cross-check whether we've represented all of this in the dashboard. I
> believe the comparison between low Earth orbit satellites and other orbit
> types might be missing - if it's already implemented, tell me how,
> including what it's labeled as in the dashboard.

Checked, and the concern was correct: the existing "Orbit Type Distribution"
chart only showed how many passes came from each orbit type, not how those
passes actually differ - the real substance of the assignment's requirement.
That finding (LEO passes last minutes, MEO/HEO passes last hours) previously
only existed in code comments and the README, not the dashboard itself.

Added a new chart, labeled **"LEO vs. Other Orbits: Avg. Pass Duration"**, as
a log-scale bar chart (`/api/insights`'s new `avg_duration_by_orbit_type`
field) - log-scaled specifically because the gap between orbit types spans
orders of magnitude (verified against live data for Bengaluru: LEO averages
~427s, MEO ~22,662s, HEO ~41,506s), which a linear axis would flatten into an
invisible LEO bar. Verified in a real browser that it renders correctly.

**Prompt:**
> Could you map each of those to where they're actually visible on the front
> end, so I can verify them clearly? Also, please list all the data sources
> you've used.

Produced a requirement -> exact UI element mapping table, and audited the
codebase for every external resource actually referenced (not just what the
README claimed). Found the README's Data Sources section was itself out of
date - it claimed Celestrak was "the only live external dependency," which
had stopped being true once the sunlit-visibility feature (NASA JPL's DE421
ephemeris) and the maps (OpenStreetMap tiles) were added. Corrected it.

## Session 7 - Web App Requirements Cross-Check & Layout Planning (2026-09-11)

**Prompt:**
> [Pasted the assignment's "Web Application Requirements" section: core
> map-based visualization, features list (city input, upcoming passes list,
> start/end/duration display, animated path, satellite details), data insights
> dashboard, bonus feature.] These are the exact front-end requirements, so
> let's cross-check whether we've built everything.
>
> Right now, everything lives on a single page - let's consider improving
> that. A single page is fine if it works well, but splitting the data
> insights into their own tab is also an option. Think through how the front
> end could be improved and give me your suggestions so I can review and
> approve before you write any code. Confirm whether every requirement has
> been implemented, and if so, tell me what each one is called in the front
> end. Also, the "LEO vs. Other Orbits: Avg. Pass Duration" section is showing
> nothing - please check what's wrong.

Investigated the blank-chart report and found a real bug: none of the three
dashboard chart functions handled the case of empty pass data (which happens
whenever the satellite cache is briefly empty, e.g. during the Celestrak
rate-limiting hit repeatedly earlier in this project) - Chart.js silently
rendered nothing, with no console error, which is exactly what "nothing
shown" looks like. Verified by forcing the empty-data path directly in a
browser test, then added a proper "no passes in this window yet" message for
that case on all three charts.

While cross-checking the Features list literally line by line, found another
real gap: "pass start time, end time, and duration" was only showing start
time and duration - end time (`set_time`) was already computed and used
internally for the track animation, but never actually displayed. Added it,
plus formatted duration as human-readable (e.g. "5h 13m") since durations now
range from seconds to hours across orbit types.

**Prompt:**
> The animated orbital paths work for upcoming passes - clicking one does
> show the animation. It would be good to enable that same feature for
> "Visible Right Now" as well. Also, please move altitude onto its own line
> after peak elevation - since we're displaying start, end, peak elevation,
> altitude, and duration together, that would read better; apply the same
> layout to "Visible Right Now" so both sections stay aligned. The "LEO vs.
> Other Orbits" section is still showing blank - please try fixing it once
> more; if it still doesn't work, we can remove it. Leave the
> visibility-notifications feature as a work in progress for now - we'll
> revisit it later. Rather than separate tabs, your header-navigation
> suggestion works - let's keep everything on a single page, but improve the
> UI: the cards, elements, and positions currently look quite basic. Also,
> make the live satellite tracking map more interactive and responsive.

Made "visible right now" satellites clickable too - since they have no
rise/set window (they're already overhead), it animates a short ground-track
segment centered on the current moment instead, long enough to show LEO
satellites visibly moving and correctly showing GEO/MEO barely moving at all.
Reordered every satellite card (both lists) to a shared template: name,
orbit-type tag, start, end, peak elevation, altitude (own line), duration.

Investigated the still-blank chart further: added `maintainAspectRatio:
false` with explicit canvas heights (Chart.js canvases inside CSS grid
columns can end up with an unstable size on first paint) and an explicit log
scale minimum, then stress-tested by switching cities four times in a row in
a real browser - the chart rendered correctly every time afterward. Root
cause most likely was the empty-cache window from Session 6, now already
covered by the "no data" message; kept the feature rather than removing it,
since it directly demonstrates the assignment's required LEO/others
distinction and renders reliably under testing.

Did a full visual pass: sticky header with Map & Passes / Dashboard / Global
Tracking anchor links, consistent card styling with hover/selected states,
proper spacing and typography tokens, a clickable legend on the global map
that toggles each orbit type's markers on/off, marker hover-to-enlarge, and
verified responsiveness down to a 390px mobile viewport (single-column stack,
nothing cut off). Visibility notifications remain unimplemented, flagged as a
future item per the request to leave it "in progress."

**Prompt:** (with two screenshots)
> In the Insights Dashboard, let's put Orbit Type Distribution, LEO vs. Other
> Orbits, and Most Frequently Visible Satellites in one row, with Passes per
> Day and Average Duration in a second row below - that would look better.
> Also, I think the City selector and Find Passes button should sit beside
> "Satellites Over My City" rather than at the far right - closer to the left
> would be better. Could you explain something: without selecting a city, I'm
> already seeing some orbits/passes on the map. What are those, since I
> haven't chosen a city yet? Also, once a city is selected, we have "Upcoming"
> and "Visible" panels - I think "Visible" should come before "Upcoming," so
> let's swap those columns. And when I click on a visible satellite, it
> should animate; clicking it again should stop the animation - please think
> through how to make a single click start it and a second click stop it. Do
> you have any other UI suggestions?

The "orbits visible before selecting a city" question led to a real bug: the
app never cleared a previously-animated track when the city changed, so a
track drawn while looking at one city could still be sitting on the map after
switching to another - easy to mistake for "satellites appearing out of
nowhere." Fixed by clearing the track/marker/animation and any "selected"
card whenever a new city's passes load. (Separately explained, not a bug: the
city dropdown defaults to the alphabetically-first city on page load and
auto-fetches its data immediately, which is why *something* is always shown
even before an explicit click.)

Implemented click-to-toggle: clicking an already-animating card now turns its
track off instead of redrawing it; clicking a different card switches to it.
Swapped "Visible Right Now" to appear before "Upcoming Passes". Regrouped the
dashboard into two explicit CSS grid rows (3 chart cards, then 2 stat cards)
instead of relying on auto-fit wrapping. Moved the city selector and "Find
Passes" button to sit beside the page title, with section navigation pushed
to the right edge instead.

Offered four further suggestions (auto-refreshing "Visible Right Now",
a "select a city" placeholder instead of a silent default, remembering the
last-picked city, and a visible animating/stop indicator) rather than
building them unprompted.

**Prompt:**
> Okay, please build it!

Built all four. First-ever visit now shows an explicit "Select a city..."
placeholder with no default city loaded; a return visit remembers the last
city (localStorage) and loads it automatically instead of always resetting to
the alphabetically-first city. Added a small "Animating <name> · Stop" bar
above the map whenever a track is playing, wired to the same toggle-off logic
as clicking the card again. "Visible Right Now" now refreshes on its own
every 30 seconds - verified in a browser by watching network requests over a
33-second window (two calls landed at t=0 and t=29s, as expected).

While testing the new "Stop" button, found and fixed a real CSS bug: the
indicator's stylesheet rule set `display: flex` unconditionally, which
overrides the browser's default handling of the `hidden` attribute - so
setting `.hidden = true` in JavaScript had no visible effect. Fixed with an
explicit `[hidden] { display: none }` override, verified the indicator now
actually disappears when clicking Stop.

## Session 8 - Vercel Deployment (2026-09-11)

**Prompt:**
> For the next step, I'd like to deploy this on Vercel. Please make it
> deployment-ready and give me the build commands I'll need. If I run into
> any errors while deploying, I'll let you know.

Vercel's Python functions are serverless - stateless, ephemeral filesystem,
no guarantee of continued execution after a response is sent - which
conflicted with three real assumptions baked into the app: a persistent
SQLite cache file, a background thread refreshing it on startup, and an
ephemeris file auto-downloaded to the working directory on first use. Rather
than bolt on Vercel-specific special cases, made the underlying design work
correctly everywhere:

- Replaced the SQLite file cache with a plain in-memory dict
  (`backend/db.py`) - simpler, and removes the entire class of "someone
  deleted the db file out from under the running server" bugs hit twice
  earlier in this project, since there's no longer a file to delete.
- Replaced the startup background thread with a lazy `ensure_fresh()` check
  at the top of each data endpoint, refreshing only when the cache is stale.
- Made Celestrak's 5 group fetches run concurrently instead of sequentially,
  cutting a cold cache's worst-case wait from "sum of all 5 groups" to
  "slowest single group" - measured at ~1.2s locally versus what could have
  been far longer sequentially given Celestrak's flakiness earlier in this
  project.
- Committed the ephemeris file (`backend/de421.bsp`, ~16MB) to the repo and
  loaded it by explicit path instead of relying on a runtime download to a
  writable current directory, which a deployment filesystem doesn't
  guarantee.
- Defensively replaced newer Python syntax (`dict[int, dict]`, `datetime |
  None`) with `typing.Dict`/`typing.Optional` in the new cache code, in case
  Vercel's default Python runtime is older than what's used locally.

Added `api/index.py` (a thin shim making `backend/` importable, since
Vercel's convention expects the function under `/api`) and `vercel.json`
(routes `/api/*` to the Python function, everything else to `frontend/` as
static files). Verified the whole chain locally by running the app through
the actual Vercel entrypoint path (`uvicorn api.index:app` from the repo
root, not `backend/`) rather than only testing the already-working local
dev path, and confirmed the ephemeris file and satellite data both resolve
correctly through it. Flagged one real trade-off in the README: the
in-memory cache only survives as long as a Vercel instance stays warm, so
production traffic will hit Celestrak more often than the old 6-hour local
cache did - documented, with a persistent host as the fallback if that
proves too chatty in practice, rather than adding more serverless-specific
workarounds.

**Prompt:** (with two screenshots of Vercel's GitHub-import configuration
screen: Application Preset, Root Directory, Build/Output/Install command
fields, and Environment Variables)
> Let me know all the options I need to choose, along with the commands and
> any environment variables required.

Walked through each dashboard field: keep the auto-detected FastAPI preset
and `./` root directory, leave Build Command/Output Directory/Install
Command all at their defaults (the project's `vercel.json` already fully
describes the build via its explicit `builds` array, which takes precedence
over these dashboard settings regardless), and no environment variables are
needed at all - the app has no API keys or secrets, since Celestrak,
OpenStreetMap, and the JPL ephemeris are all public and keyless.

**Prompt:**
> I've deployed it, and everything looks good. In the screenshot, I selected
> Visakhapatnam and clicked on a visible satellite, but its position is
> showing up near the coast of Africa, if I'm reading it right. I don't
> understand how that's happening - is the data being shown correct or not?
> Now I've actually figured out what my real question is!

Confirmed the deployment itself worked, then explained why the map showed a
GPS satellite's animated position over the Mozambique Channel while its
"Visible Right Now" card correctly reported it visible from Visakhapatnam at
20° elevation: the map draws the satellite's ground track (the point directly
beneath it), not a line toward it in the sky - nearly the same thing for a
low LEO pass, but very different for a ~20,200km-altitude MEO satellite,
whose ground track can sit thousands of km away while it's still visible at a
shallow angle. Verified this wasn't a bug by computing the expected ground
distance from standard satellite-visibility geometry (~6,340 km at 20°
elevation and GPS altitude) and confirming it matched both the distance and
the compass direction shown in the screenshot.

**Prompt:**
> Yes, please go ahead!

(Confirming the offer to add a visual explanation for this.) Added a dashed
line connecting the city marker to the satellite's live ground-track
position, redrawn every animation tick, plus a live "ground track N km away"
readout in the animating indicator bar - both computed via Leaflet's built-in
distance calculation. Caught and fixed my own typo while writing it (a
stray `#` Python-style comment accidentally left in the JavaScript, which
would have been a syntax error) before it ever reached the browser. Verified
with a browser test against a MEO satellite (POLAR, ~1,354 km ground-track
distance from Visakhapatnam) and confirmed the existing animation/toggle/
regression tests still pass.

## Session 9 - Two-Tab Layout, Map-Click Location, Orbit Reference (2026-09-11)

**Prompt:** (with two screenshots comparing a "Visible Right Now" click - blue
ground-track line missing - against an "Upcoming Passes" click, where it
showed clearly)
> For upcoming passes, the blue ground-track line shows up correctly, but why
> doesn't it show for "Visible Right Now"? Next, I'd like to make a couple of
> improvements. First: split the app into two tabs. Tab one would have the
> map and passes, with Insights below it, and below that, some educational
> content defining terms like LEO for people who want to learn more. Tab two
> would be the live global tracker. Second: right now we pick a city and
> click Find Passes - that works well, but clicking a point on the map should
> work the same way. For the tabs, please plan the UI first and let me know,
> so I can suggest changes before we approve it for coding. In tab one, I'd
> like the map in its own row, then two boxes below it (Visible, then
> Upcoming), then the data insights, then the informative content about
> orbits for students and satellite enthusiasts. Tab two stays as the live
> global tracker.

Explained the missing blue line before planning anything: it's the same
ground-track-vs-line-of-sight distinction as the previous session, one layer
deeper. METEOSAT-9 is geostationary, so its ground track across any 20-minute
window is a single point, not a line - there was nothing to draw a line
between, not a rendering failure. Proposed fixing it by scaling the
animation window to orbit type and labeling genuinely near-stationary
satellites explicitly, tying directly into the requested educational content.

Presented the two-tab layout plan (as asked, before writing code) and one
open question: should a map click fetch immediately or still require
pressing "Find Passes"?

**Prompt:**
> Yes, everything works, and I agree it should fetch immediately, as you
> suggested, rather than requiring another click on Find Passes. Once this is
> built, we can review it and decide on any further changes.

Built the full plan:
- Backend (`main.py`): `/api/passes`, `/api/insights`, and
  `/api/currently-visible` now accept either a known `city` name or raw
  `lat`/`lon` query params, resolved by one shared `resolve_location()`
  helper - a real extension, not a frontend-only trick, so a map click works
  for any point on Earth rather than snapping to the nearest of the 31
  curated cities.
- Frontend: replaced the single scrolling page with two tabs (`tabs.js`
  handles switching; the previously-hidden global map needed an explicit
  `invalidateSize()` call on first reveal, since Leaflet measures its
  container at creation time and that container had zero size while its tab
  was hidden). Added a click handler on the main map that immediately loads
  passes for the clicked coordinates, resetting the city dropdown to show
  it's now viewing a custom point. Added the "Understanding Orbits" section
  (LEO/MEO/GEO/HEO explanations with real examples from the curated
  satellite set) directly below the dashboard in Tab 1.
- Fixed the actual blue-line issue: `VISIBLE_WINDOW_MINUTES` now scales the
  "visible right now" animation window by orbit type (LEO 10 min, MEO/HEO 45
  min, GEO 10 min since widening it wouldn't help), and the ground-track note
  appends "(near-stationary orbit)" when a satellite's track genuinely spans
  under 50km. Verified against live data: GOES 14/15 (GEO) correctly flagged
  near-stationary while a GPS satellite (MEO) showed real movement with the
  wider window - and confirmed Meteosat-9 (also GEO) was *not* flagged in one
  test run, which on inspection is itself correct rather than a bug: its
  particular inclination causes just enough real drift to cross the
  threshold, which is genuine orbital variation, not something to paper over.

Verified the whole rebuild with browser tests: tab switching, the global map
rendering correctly after being hidden at load, a map click producing real
passes for that exact point, and the full existing regression suite (getting-
started state, city memory, toggle-to-stop, no console errors) still passing
- plus a mobile-width screenshot confirming the new layout stacks cleanly.

## Session 10 - Formatting Cleanup, Zoom Bug, Feature Brainstorm (2026-09-11)

**Prompt:**
> Please replace all em dashes with hyphens. Next issue: if I zoom into the
> map and then select a different city (say, Jaipur), the data updates but
> the map zooms back out to nearly the initial view - that makes it hard to
> use. Why does it reset like that? That needs fixing. Also, I'd like the
> site to have an outstanding, extraordinary feature. Here's an idea: a
> notification when a satellite is about to pass, and something about
> identifying the best time or place to actually see it. Something out of
> the box - do you have any ideas along those lines?

Replaced every em dash with a hyphen across the whole project (found in
`README.md`, `docs/PROMPT_LOG.md`, and the orbit-card headings in
`frontend/index.html`).

Investigated and fixed the zoom bug: every location change called
`map.setView(coords, 4)` unconditionally, hard-resetting to a wide zoom level
regardless of what the user had manually zoomed to. First tried `flyTo` with
`Math.max(currentZoom, 8)`, but testing revealed Leaflet's flyTo intentionally
zooms out mid-flight for long-distance jumps (a deliberate "flying over"
effect) - which would have recreated the exact complaint as an animation
instead of an instant reset. Switched to an instant `setView` at
`Math.max(currentZoom, 8)` instead: verified by scripting a zoom-to-12, then
switching cities, and confirming the zoom stayed at 12 rather than dropping.

Also proposed three "outstanding feature" options for the earlier "something
extraordinary" ask, tied to the user's own idea (a notification, best
view/place): (A) a "Best Pass Tonight" spotlight using data already
computed, (B) browser notifications before a good pass - literally the
assignment's own named bonus option, still unbuilt, (C) a sky-compass
visualization of elevation/azimuth, optionally using device orientation.
Recommended A+B as the strongest pairing, C as the flashiest but riskiest.

**Prompt:**
> Let's go ahead and implement all three.

Built all three:
- **Best Pass spotlight**: ranks fetched passes by peak elevation among
  actually-visible ones, shows the best with a live 30-second-refreshing
  countdown to rise time; clicking it animates the same as a list card.
- **Pass notifications**: opt-in button requests browser Notification
  permission, then schedules a `setTimeout` per qualifying pass (visible,
  30 deg+ peak elevation) firing 5 minutes before rise - purely client-side,
  with the status text honestly stating it only works while the tab stays
  open rather than implying real push infrastructure that doesn't exist here.
- **Sky view compass**: a polar SVG plot (center = zenith, edge = horizon,
  N/E/S/W around the ring) plotting every "visible right now" satellite by
  its actual elevation/azimuth - the same layout real satellite-tracking
  software uses. Clicking a dot animates that satellite.

Hit and fixed a real, non-obvious CSS bug while building the sky plot: an
inline `<svg>` inside a column flex container doesn't reliably compute
`height: auto` the way normal replaced elements do, even with explicit
width/height attributes - its layout box collapsed to zero height (visible
via `getBoundingClientRect`) while its child content still rendered outside
that box, letting the list below it silently overlap and intercept clicks
that looked, visually, like they should have hit the sky-plot dots. Diagnosed
by comparing computed bounding boxes rather than guessing from the visual
symptom, and fixed with the classic reliable pattern: wrap the SVG in a plain
`<div>` that owns an explicit `aspect-ratio`, and let the SVG fill it at
100% - plain divs don't hit the same replaced-element sizing edge case.
Verified with a full regression pass (existing suite, mobile screenshot,
click-to-animate from a sky-plot dot) after the fix.

## Session 11 - UI Refinement Pass (2026-09-11)

**Prompt:**
> I'd like a few UI changes. First, move the Best Pass spotlight into the row
> with Passes per Day and Average Duration, so we end up with three clean
> cards there. Second, the notify button below the map looks good as it is.
> Third, in the "Visible" section, there's something extra you added that
> doesn't look good - please remove it. Fourth, it's hard to tell where one
> section ends and the next begins, so please add some spacing after each
> section for clearer separation. Walk through the UI from a user's
> perspective, suggest the changes you'd make, and then we can start on them.

Asked one clarifying question before touching anything, since "there's
something extra you added in the visible section" was ambiguous about which
recent addition it meant: confirmed it was the sky-compass plot added last
session, to be removed entirely rather than resized or relocated.

Implemented all three:
- Removed the sky-compass plot entirely from "Visible Right Now" (HTML, CSS,
  and the `renderSkyPlot` function) - back to a plain list.
- Moved the Best Pass spotlight out of its own standalone banner into the
  Insights Dashboard's stat row, now three matching cards (Best Pass /
  Passes per Day / Average Pass Duration) instead of a separate wide banner
  plus a two-card row.
- Added a visible divider (thin rule + spacing) between Map & Passes,
  Insights Dashboard, and Understanding Orbits, and increased the overall
  gap between sections, so each reads as clearly distinct.

While confirming the result, hit Celestrak hard-blocking with 403 Forbidden
across every group (a harder block than the 503s/timeouts seen earlier,
consistent with the volume of requests made testing this project). Since the
in-memory cache (from the serverless migration) can't be seeded by a
separate script the way the old SQLite file could, verified the final layout
by running a throwaway server instance seeded in-process with real TLE data
already captured earlier in the project - confirming the removed compass,
the three-card stats row, and the section dividers all render correctly with
live-shaped data, not just in the empty-state case.

## Session 12 - Glossary Redesign & Mobile Responsiveness Audit (2026-09-11)

**Prompt:** (with a screenshot of the four orbit-type cards)
> I wanted this section to be a knowledge base, but not structured the way it
> currently is. One card could define one term, the next card another, and so
> on - for example, what an orbit is, what altitude means - organized by
> concept rather than just the four orbit types. It should genuinely help a
> first-time visitor understand every term used on this site. Let me know how
> you'd approach that, and I'll suggest any changes before we build it.

Proposed restructuring from "four cards, one per orbit type" to "one card per
term used anywhere in the app": Pass, Elevation, Azimuth, Altitude, Orbit
Type (folded into a single compact card instead of four full-size ones),
Visible/Sunlit, Ground Track, and TLE - plus renaming the section from
"Understanding Orbits" to "Glossary" so it reads as a general reference
rather than an orbit-types-only page.

**Prompt:**
> It's better if you keep 4 per row on wide screens.

Confirmed the layout direction from the proposal and gave the explicit grid
preference.

**Prompt:**
> Can you make this website responsive on iPhones and Android devices?
> Nothing should overflow off the screen - could you check that?

Built the 8-card glossary as planned (orbit types condensed into one card
with a compact color-coded mini-list rather than four cards), 4 columns on
wide screens stepping down to 2 then 1 on narrower ones. Then audited
responsiveness properly rather than eyeballing one screenshot: tested seven
real device viewport sizes (iPhone SE through 14 Pro Max, three common
Android sizes, and a tablet), checking the decisive signal - document
scrollWidth vs. window innerWidth - rather than just looking for elements
that visually extend past their container (which flagged Leaflet's own map
tiles as "overflowing," a false positive, since tile rendering always
extends past the viewport by design and is clipped by the map's own
container). Confirmed zero horizontal page overflow on every device tested,
with full-page screenshots at each size to visually verify nothing was cut
off or crowded.

## Session 13 - Header Bug, Favicon, and a Second Responsiveness Pass (2026-09-11)

**Prompt:** (with two screenshots showing the header intact before scrolling,
then apparently gone - only a sliver of the "Global Tracking" tab visible -
after scrolling)
> When I scroll, the navbar keeps disappearing, as if it's rendering behind
> other content - that's one issue. Also, clicking "Satellites Over My City"
> should at least be clickable - right now it isn't; it can just redirect to
> the same page, but it needs to respond to a click. We also need a favicon -
> please add a good icon related to the site. And check if there's anything
> else we could improve for visual appeal or responsiveness across the site.

Found the real cause of the "disappearing" header: it was `position: sticky`
with `z-index: 10`, but Leaflet's own controls/panes use z-index values up to
1000 - once the map scrolled to occupy the header's screen position, the
map's own elements painted over the sticky header instead of under it.
Raised the header's z-index to 2000 (safely above anything Leaflet uses) and
verified by scripting a scroll-then-check on both tabs (each has its own
Leaflet map), confirming the header title stays visible and on top in both.

Made the brand ("Satellites Over My City") a real link to `/`, and added a
favicon using the same satellite emoji as the header icon, via an inline SVG
data URI - no binary asset file needed for a single-icon favicon.

While auditing further as asked, found and fixed a second real layout issue
that the previous responsiveness pass had missed: in the ~641-900px range,
the header's contents no longer fit one row and wrap, but `.tab-nav`'s
`margin-left: auto` then stranded it alone on an otherwise-empty second row
instead of using that row's width - confirmed visually with a screenshot at
820px, tried right-aligning it first (no visual change, since auto-margin
already produced that same result), then left-aligned it under the brand
instead, which reads as a coherent two-row header rather than a stray
floating element. Reverified across the original seven device sizes plus
five more widths spanning the 480-1200px range, and reran the full
regression suite - zero horizontal overflow anywhere, header stays visible
on scroll at every size tested.

## Session 14 - Three-Page Restructure with a 3D Globe (2026-09-11)

**Prompt:** (with a screenshot of satellitemap.space's rotating 3D Earth
visualization for inspiration)
> Here's how I've planned to improve the website: split it into three pages -
> Home, Map & Passes, and Global Live Tracking. The Home page should
> introduce what the website does and explain how satellites orbit, ideally
> with a rotating globe like the one in the attached image. The Glossary
> section can also live there, along with an explanation of how "best time"
> is calculated. On the Map & Passes page, remove the city selector from the
> navbar and place it on the page itself, alongside the option to click
> anywhere on the map - Insights will have more room as a result. Global
> Tracking stays as the third tab. Let me know if this plan works, and based
> on your experience, suggest what the Home page should include. It should be
> very user-friendly, responsive, and include 3D animation, and it needs to
> work well on iPhone and other phones too.

Proposed the full plan before coding: keep it as one page with tab-switching
(not real separate URLs) to avoid duplicating the header and losing state
across "pages"; a Home page with a hero, a live rotating 3D globe (plotting
the actual satellites already tracked elsewhere on the site, not just
decoration), a plain-language "How It Works" walkthrough, an explanation of
the Best Pass logic, and the relocated Glossary; asked one concrete question
(should Home or Map & Passes be the default landing tab) rather than
guessing - confirmed Home.

Built it:
- Backend: unchanged - the globe reuses the existing `/api/live-positions`
  endpoint built for the Global Tracking tab, so no new data plumbing needed.
- Chose globe.gl (built on Three.js/WebGL) for the globe, loaded via CDN,
  verified the exact texture and bundle URLs actually resolved before wiring
  them in rather than assuming.
- Moved the city selector out of the header into a new "location bar" at the
  top of the Map & Passes page itself; the header is now just the brand and
  three tab buttons, which incidentally also relieves the header-wrapping
  crowding from the previous session, since there's less to fit.
- Extended the existing tab-switching system to three tabs and added a
  shared `activateTab()` used by both the header's tab buttons and the
  hero's two call-to-action buttons, so "Find Passes for My City" genuinely
  navigates rather than just looking like it does.
- Applied the same lesson learned twice already this session (Leaflet/SVG
  sizing when a container starts hidden) proactively to the globe: it
  initializes correctly since Home is now the default visible tab, but a
  resize handler still explicitly re-measures it if a visitor navigates away
  and back, rather than assuming the WebGL canvas behaves like Leaflet's map
  or worse.
- Respected the OS-level "reduce motion" accessibility preference by pausing
  the globe's auto-rotation for visitors who've asked for that.

Verified thoroughly given the size of the change: confirmed Home loads by
default with the globe actually rendering (canvas present, `homeGlobe`
initialized), the hero CTA buttons genuinely switch tabs, the relocated city
selector still drives real pass data on the Map & Passes page, navigating
back to Home from elsewhere doesn't break the globe, and the Global Tracking
tab (including its legend toggle) still works exactly as before. Caught and
fixed one stale test assumption in the process - an existing regression
script assumed the city selector was always visible in the header, which
broke under the new structure; this was the test's assumption going stale
after the app was correctly changed, not an app bug. Reran full regression
plus a mobile screenshot of the new Home page - zero horizontal overflow,
globe and layout both render cleanly at 390px.

## Session 15 - Glossary Wording and Header Centering (2026-09-11)

**Prompt:** (with two screenshots - the Orbit Type glossary card, and the
header with the tab row circled at the far right)
> In the Orbit Type card, I asked you to explain what LEO means - that it's a
> type of orbit, something along those lines - so why did you write something
> else instead? Also, let's move the tab/page navigation to the center of the
> header rather than the far right.

Both concrete fixes: the "Orbit Type" glossary card jumped straight into the
LEO/MEO/GEO/HEO mini-list without ever defining what "orbit type" itself
means - added a one-line definition ("the category a satellite's path falls
into, based on altitude and speed...") before the list. Re-laid-out the
header as a 3-column grid (`1fr auto 1fr`) so the tab row sits at the true
horizontal center regardless of the brand's width, rather than flush right -
verified by comparing the header's and nav's computed center points
(0px difference). This also let two responsive rules from earlier sessions
be simplified away: with the city selector already relocated out of the
header, the header is light enough now that the ~641-900px wrapping
workaround from two sessions ago is no longer needed.

## Session 16 - Glossary Consistency & Full Prompt Log Rewrite (2026-09-11)

**Prompt:**
> I feel the LEO/MEO/GEO/HEO mini-list in the Orbit Type card can be removed,
> so that all the glossary cards have the same level of content and feel
> consistent. After that, please update my GitHub README and the prompt log.
> Go through and include all the actual prompts I've given you, but refine
> the structure with good English and clear sentence framing - not just the
> exact wording, but rewritten into well-formed sentences.

Removed the mini-list from the Orbit Type card, folding the same information
into a plain paragraph so all eight glossary cards share the same format and
visual weight - verified with a screenshot comparing both rows of the grid
side by side.

Rewrote this entire prompt log from Session 1 onward: every quoted prompt
polished into clear, well-structured English (fixing run-on sentences and
rough phrasing while keeping the original meaning and first-person voice
intact, not converting it into a third-person summary), and the session
numbering gap at "Session 8" (a leftover from an earlier edit) closed by
renumbering everything sequentially.
