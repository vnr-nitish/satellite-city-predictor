# Development Prompt Log

A running log of the actual prompts used to build this project with Claude Code.
Each entry is the student's real request, lightly cleaned up for grammar and
readability, not a rewritten summary — kept close to the original wording so
the development process is transparent.

## Session 1 — Ideation & Planning (2026-09-10)

**Prompt:**
> There was an ML project assigned to me — I'll give you the context of what
> they've told us. It's actually a satellite predictor. We need to do this
> project: first ideate how we have to collect the data, what type of
> analytics, etc. — you'll see once you read the assignment below. Let's
> first ideate.
>
> [Assignment text: "Satellites Over My City Predictor" — problem statement,
> data sources (Celestrak, N2YO, Space-Track, Open-Notify, satellitemap.space),
> project tasks (data collection, processing, analysis), web application
> requirements (map-based visualization, animated satellite paths, upcoming
> passes list, insights dashboard), and a bonus feature.]
>
> Let us try to understand the problem statement and how to do it, and going
> through the requirements we can check how to proceed further. I hope we can
> do this in VS Code. Do you want me to shift to Google Colab? Let me know.

**Prompt:**
> OK that's great. So what about the data collection — do we need it for
> this, and what other websites will we be depending upon? Also for the
> database — do we need to create one, do we require Supabase or Firebase or
> something like that? List out what all we require, because I don't have any
> pro versions. And if anything is required we can connect MCPs, I hope —
> right, we can connect MCPs to your Claude Code? But I'm using this Claude
> Code in VS Code so I don't know whether I can really connect it or not. I
> still need to understand a few things — what is a TLE and what exactly is
> an orbit propagator, etc. — make me understand them so I also know what's
> happening. And what about the dashboard — I guess we also have a
> requirement of a dashboard, right? You didn't speak about that. So what
> about all those?

**Prompt:**
> You have to check in your code and prompts to GitHub from time to time (not
> all at once) — every few hours, when you've done substantial work, check in
> the code and prompts. I need to do this too because the evaluator wants it.
> Make sure you check in the prompts in a good way — rephrase them so he'll
> understand I'm not just copy-pasting. Also, no need to restrict ourselves to
> the data sources listed — it's not only those four, we can search for other
> things too, that's also mentioned. Look for other data sources as well, and
> let's start building.

*(Note: this instruction was later revised in Session 5 — the evaluator
wants the actual prompts, not a rephrased summary. This log was rewritten
accordingly.)*

**Follow-up:** provided the GitHub repo URL to push the project to:
`https://github.com/vnr-nitish/satellite-city-predictor.git`

## Session 2 — Initial Build (2026-09-10)

*(Continuing the same working session — build the first working version of
the app based on the architecture agreed on in Session 1.)*

**Prompt:**
> I can continue, but the problem is I'm using your Claude Code currently in
> VS Code in a folder called "New folder," but you've created another folder
> called "satellite-city-predictor." If I open that folder, I won't be able
> to see the current chat. So you should do something to solve this problem.

**Prompt:**
> Also, if possible, rename that "New folder" as "satellite-city-predictor"
> and push all the files of satellite-city-predictor to this new folder, so
> that we don't have too many folders — that would be better. Let's start
> working, let's continue the project.

## Session 3 — Browser Verification (2026-09-10)

*(No new prompt — continuing under the standing instruction to actually run
and verify the app rather than just test the API.)*

## Session 4 — Bonus Feature (2026-09-10)

**Selected via clarifying question:** build the bonus feature (live global
satellite tracking) next, rather than polishing existing features first.

## Session 5 — Prompt Log Correction (2026-09-10)

**Prompt:**
> Now let's run on the localhost so I can see the changes myself. And next
> thing — in the prompt log, it seems the evaluator wants me to put the exact
> prompts that I've given to you. So do that, with a few changes for sentence
> forming, etc. — the way you're writing it now is not actually correct; you
> need the exact prompts that I'm giving you.

This log was rewritten to reflect that: entries above now carry the actual
prompts (lightly cleaned up for grammar) rather than a third-person paraphrase
of what happened during each session.

## Session 6 — Data Processing / Data Analysis Cross-Check (2026-09-11)

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
> showing are very few — so can we include few more cities like Visakhapatnam,
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

## Session 7 — Web App Requirements Cross-Check & Layout Planning (2026-09-11)

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
