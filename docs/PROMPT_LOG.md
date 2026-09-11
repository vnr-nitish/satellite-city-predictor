# Development Prompt Log

A running log of the actual prompts used to build this project with Claude Code.
Each entry is the student's real request, lightly cleaned up for grammar and
readability, not a rewritten summary - kept close to the original wording so
the development process is transparent.

## Session 1 - Ideation & Planning (2026-09-10)

**Prompt:**
> There was an ML project assigned to me - I'll give you the context of what
> they've told us. It's actually a satellite predictor. We need to do this
> project: first ideate how we have to collect the data, what type of
> analytics, etc. - you'll see once you read the assignment below. Let's
> first ideate.
>
> [Assignment text: "Satellites Over My City Predictor" - problem statement,
> data sources (Celestrak, N2YO, Space-Track, Open-Notify, satellitemap.space),
> project tasks (data collection, processing, analysis), web application
> requirements (map-based visualization, animated satellite paths, upcoming
> passes list, insights dashboard), and a bonus feature.]
>
> Let us try to understand the problem statement and how to do it, and going
> through the requirements we can check how to proceed further. I hope we can
> do this in VS Code. Do you want me to shift to Google Colab? Let me know.

**Prompt:**
> OK that's great. So what about the data collection - do we need it for
> this, and what other websites will we be depending upon? Also for the
> database - do we need to create one, do we require Supabase or Firebase or
> something like that? List out what all we require, because I don't have any
> pro versions. And if anything is required we can connect MCPs, I hope -
> right, we can connect MCPs to your Claude Code? But I'm using this Claude
> Code in VS Code so I don't know whether I can really connect it or not. I
> still need to understand a few things - what is a TLE and what exactly is
> an orbit propagator, etc. - make me understand them so I also know what's
> happening. And what about the dashboard - I guess we also have a
> requirement of a dashboard, right? You didn't speak about that. So what
> about all those?

**Prompt:**
> You have to check in your code and prompts to GitHub from time to time (not
> all at once) - every few hours, when you've done substantial work, check in
> the code and prompts. I need to do this too because the evaluator wants it.
> Make sure you check in the prompts in a good way - rephrase them so he'll
> understand I'm not just copy-pasting. Also, no need to restrict ourselves to
> the data sources listed - it's not only those four, we can search for other
> things too, that's also mentioned. Look for other data sources as well, and
> let's start building.

*(Note: this instruction was later revised in Session 5 - the evaluator
wants the actual prompts, not a rephrased summary. This log was rewritten
accordingly.)*

**Follow-up:** provided the GitHub repo URL to push the project to:
`https://github.com/vnr-nitish/satellite-city-predictor.git`

## Session 2 - Initial Build (2026-09-10)

*(Continuing the same working session - build the first working version of
the app based on the architecture agreed on in Session 1.)*

**Prompt:**
> I can continue, but the problem is I'm using your Claude Code currently in
> VS Code in a folder called "New folder," but you've created another folder
> called "satellite-city-predictor." If I open that folder, I won't be able
> to see the current chat. So you should do something to solve this problem.

**Prompt:**
> Also, if possible, rename that "New folder" as "satellite-city-predictor"
> and push all the files of satellite-city-predictor to this new folder, so
> that we don't have too many folders - that would be better. Let's start
> working, let's continue the project.

## Session 3 - Browser Verification (2026-09-10)

*(No new prompt - continuing under the standing instruction to actually run
and verify the app rather than just test the API.)*

## Session 4 - Bonus Feature (2026-09-10)

**Selected via clarifying question:** build the bonus feature (live global
satellite tracking) next, rather than polishing existing features first.

## Session 5 - Prompt Log Correction (2026-09-10)

**Prompt:**
> Now let's run on the localhost so I can see the changes myself. And next
> thing - in the prompt log, it seems the evaluator wants me to put the exact
> prompts that I've given to you. So do that, with a few changes for sentence
> forming, etc. - the way you're writing it now is not actually correct; you
> need the exact prompts that I'm giving you.

This log was rewritten to reflect that: entries above now carry the actual
prompts (lightly cleaned up for grammar) rather than a third-person paraphrase
of what happened during each session.

## Session 6 - Data Processing / Data Analysis Cross-Check (2026-09-11)

**Prompt:**
> Now let's cross check data processing and data analysis so that if we have
> missed anything we can add it.
>
> [Pasted the assignment's "Data Processing" bullet list: parsing TLE data,
> converting orbital parameters into positions, filtering satellites visible
> from a location, calculating pass start time/peak altitude/duration,
> preparing data structures for mapping and visualization.]
>
> Give a summary for each and every point that whether we have included it or
> not and also make the local host active.

Cross-checked each point against the actual code. All five were already
covered, with one real gap closed: the pass data only reported peak elevation
*angle*, not the satellite's physical orbital altitude in km, which the
assignment's feature list separately asks for. Added `peak_altitude_km`.

**Prompt:**
> Yes! Please cross check the same for data analysis and next thing I guess
> the dashboard still gets to be updated even though if I have the city of
> Bengaluru and click on find pass I'm not getting the data anything. Check if
> you have to make anything active and currently the list of cities that are
> showing are very few - so can we include few more cities like Visakhapatnam,
> Pune, etc?

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
> [Pasted the assignment's "Data Analysis" bullet list again.] Now let's cross
> check this data analysis also - whether we have represented everything in
> the dashboard or not. I feel the differences between the low [Earth orbit]
> satellites and the others is missing, if I'm not wrong. If you have
> implemented it, mention how you have implemented it - like what is the name
> that you have given in the dashboard for them.

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
> Could you please map those according to the front end visibility so that I
> can clearly check. And also I wanted you to mention all the data resources
> that you have used.

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
> dashboard, bonus feature.] These are the exact front end requirements, so we
> have to cross check whether we have built everything or not.
>
> Currently you have built everything in a single page. Let's improve the
> front end - if a single page is fine, that's fine, or if the data insights
> should be separated into a tab, that can be done. Think about how the
> front end can be improved and give me suggestions so I can review them and
> approve before you code it. Make sure whether we've implemented everything,
> and if so, name what we've called each thing in the front end so I can
> understand. Also, the "LEO vs. Other Orbits: Avg. Pass Duration" section
> showed nothing - check what's wrong with that.

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
> The animated orbital paths are for the upcoming passes - if I click, yes I'm
> getting it. For "visible right now" also it would be better if you could
> enable that feature. After the peak elevation, let the altitude come on the
> next line - we're projecting start, end, peak elevation, altitude, and
> duration, so that would look better - and give the same layout for "visible
> right now" so it looks aligned. The "LEO vs. other orbits" section is still
> blank - try once more, otherwise we can remove that feature. Keep the
> visibility notifications in progress, let's see what we can do with that.
> Rather than tabs, the header-navigation suggestion you gave is fine - let's
> go with that on a single page, but make the UI good - the cards, elements,
> positions, etc. are currently very basic. Also make the live tracking
> satellite map more interactive and responsive.

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
> In the Insights Dashboard, let Orbit Type Distribution, LEO vs. Other
> Orbits, and Most Frequently Visible be in one single row; Passes per Day
> and Average Duration can be in the second row - that way it will be nice.
> And I guess City and Find Passes should be beside "Satellites Over My
> City" rather than at the extreme right - maybe at the left it would be
> better. Could you please explain why, without selecting anything, a few
> orbits have been visible in the map and passes - I didn't select any city
> yet. What are those? And even after selecting a city, we have "Upcoming"
> and "Visible" - maybe "Visible" should come first, then "Upcoming" - swap
> the columns. And if we click on a visible one it should show, and if we
> click again it should disable - think about how a click shows it and a
> second click stops it. Any other UI functionality suggestions you can
> think of?

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
> Ok Pls build!

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

## Session 9 - Vercel Deployment (2026-09-11)

**Prompt:**
> OK as the next steps I wanted to deploy this in Vercel. So make it
> deployment ready and give me the build commands that I need to use for
> deploying. If I get any errors while deploying I'll let you know.

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
> Let me know all the options that I have to choose and the commands as well
> as the environmental variables.

Walked through each dashboard field: keep the auto-detected FastAPI preset
and `./` root directory, leave Build Command/Output Directory/Install
Command all at their defaults (the project's `vercel.json` already fully
describes the build via its explicit `builds` array, which takes precedence
over these dashboard settings regardless), and no environment variables are
needed at all - the app has no API keys or secrets, since Celestrak,
OpenStreetMap, and the JPL ephemeris are all public and keyless.

**Prompt:**
> I have deployed - everything is good. If you see the screenshot, I selected
> the city Visakhapatnam, clicked on a visible satellite, but it's actually
> showing near the coast of Africa, if I'm not wrong. I didn't understand how
> that's happening - is the data being shown correct or not? I got the
> question now!

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
> Yes! Pls do

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

## Session 10 - Two-Tab Layout, Map-Click Location, Orbit Reference (2026-09-11)

**Prompt:** (with two screenshots comparing a "Visible Right Now" click - blue
ground-track line missing - against an "Upcoming Passes" click, where it
showed clearly)
> For upcoming satellites it is showing the blue color line, for visible
> right now why it is not being shown? And the next thing - I wanted to make
> a few improvements: two tabs. Tab one: map and passes, and below it insights,
> and below that, for people to get knowledge, you can define what LEO etc.
> are so they get good knowledge - then the next tab, live global tracker.
> That's one improvement. And check: right now we pick a city and click Find
> Passes, that's nice, but if we put a point on the map and click Find Pass,
> that should also work - like choosing a point on the map, that would be
> better. For the tabs, plan the UI and let me know so I can suggest a few
> things before we give approval for coding. In tab one: map in one row, then
> two boxes (visible, then upcoming), then data insights, then informative
> content for students/satellite people about what's in orbit etc. Tab two:
> live global tracking.

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
> Yeah everything is works and it can go with immediate as you said rather
> than again clicking on find pass. Once this is built then we can see how if
> there are any changes to go ahead.

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

## Session 11 - Formatting Cleanup, Zoom Bug, Feature Brainstorm (2026-09-11)

**Prompt:**
> Please remove all the em dashes and replace with hyphens. And next thing:
> when I click on any city, if I've zoomed the map in and then click a
> different city (e.g. Jaipur), the data updates but the map zooms back out
> to close to the initial full view - that makes it hard to use. Why go back
> to a wide view? That's not good. And: we should have some outstanding
> feature - something extraordinary. I'm giving you an idea: a notification
> if a satellite is passing, and something about the best view/best place to
> actually see it. Something out of the box - do you have any ideas like that?

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
> Let's try to implement all the three.

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

## Session 12 - UI Refinement Pass (2026-09-11)

**Prompt:**
> I just wanted you to do some UI changes - the best spotlight, you can bring
> it into the row with the total number [passes per day] and the average -
> that way it'll be three good cards. After the map, the notify button is
> good, that's good. In the visible section you've included some more which
> - remove that, it's not looking good. And after each section it's better
> if you give some space - I'm unable to differentiate between the sections,
> so after every section there should be a small space so it gives good
> detailing. Please walk through and think how we can improve the UI from a
> user perspective, suggest me those changes, and then we can start working
> on it.

Asked one clarifying question before touching anything, since "in the
visible section you've included some more" was ambiguous about which recent
addition it meant: confirmed it was the sky-compass plot added last session,
to be removed entirely rather than resized or relocated.

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

## Session 13 - Glossary Redesign & Mobile Responsiveness Audit (2026-09-11)

**Prompt:** (with a screenshot of the four orbit-type cards)
> I actually wanted this section to be a knowledge [section], but not like
> this - in one card you could say what is [a term], in the next card
> something else, in the next what an orbit is, in the next what altitude
> is - grouped by concept, not just for those four orbit types. It should be
> a knowledgeable section - if somebody visits this website first, they
> should be able to understand all the different words we've used. Let me
> know how you'd do that, then I can suggest changes before we code it.

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
> Can you make this website responsive to iPhones and Android - nothing
> should go against the screen (overflowing, etc.) - could you check that?

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

## Session 14 - Header Bug, Favicon, and a Second Responsiveness Pass (2026-09-11)

**Prompt:** (with two screenshots showing the header intact before scrolling,
then apparently gone - only a sliver of the "Global Tracking" tab visible -
after scrolling)
> When I'm scrolling, the navbar kept disappearing - like it's at the back.
> That's one issue. And if I click "Satellites Over My City" it should at
> least be clickable - it's not; it should redirect to the same page, just
> be clickable. We need a favicon icon - put one good icon related to this.
> And check if there's anything else attractive or responsive we could
> improve across the website.

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
