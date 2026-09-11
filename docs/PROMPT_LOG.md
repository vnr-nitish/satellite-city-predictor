# Development Prompt Log

A log of the actual prompts given during development of this project, organized by session.

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

## Session 2 - Initial Build (2026-09-10)

**Prompt:**
> I can continue, but there's a problem: I'm running Claude Code in VS Code
> inside a folder called "New folder," while you've created the project in a
> separate folder called "satellite-city-predictor." If I open that folder
> instead, I'll lose access to this chat. Can you find a way to resolve that?

**Prompt:**
> Also, if possible, rename "New folder" to "satellite-city-predictor" and
> move all the project files into it, so we're not left with redundant
> folders - that would be cleaner. Let's get back to work on the project.

## Session 3 - Prompt Log Correction (2026-09-10)

**Prompt:**
> Let's run this on localhost so I can see the changes myself. Also, about
> the prompt log - it seems the evaluator expects the actual prompts I've
> given you, not a summary. Please use my real prompts, lightly adjusted for
> sentence structure, since the current format isn't quite right.

## Session 4 - Data Processing / Data Analysis Cross-Check (2026-09-11)

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

**Prompt:**
> Yes, please do the same cross-check for Data Analysis. Also, I selected
> Bengaluru and clicked Find Passes, but nothing came back - please check if
> something needs to be activated on your end. And the city list currently
> shown is quite limited - can we add more cities, like Visakhapatnam, Pune,
> and others?

**Prompt:**
> [Pasted the assignment's "Data Analysis" bullet list again.] Let's
> cross-check whether we've represented all of this in the dashboard. I
> believe the comparison between low Earth orbit satellites and other orbit
> types might be missing - if it's already implemented, tell me how,
> including what it's labeled as in the dashboard.

**Prompt:**
> Could you map each of those to where they're actually visible on the front
> end, so I can verify them clearly? Also, please list all the data sources
> you've used.

## Session 5 - Web App Requirements Cross-Check & Layout Planning (2026-09-11)

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

**Prompt:**
> Okay, please build it!

## Session 6 - Vercel Deployment (2026-09-11)

**Prompt:**
> For the next step, I'd like to deploy this on Vercel. Please make it
> deployment-ready and give me the build commands I'll need. If I run into
> any errors while deploying, I'll let you know.

**Prompt:** (with two screenshots of Vercel's GitHub-import configuration
screen: Application Preset, Root Directory, Build/Output/Install command
fields, and Environment Variables)
> Let me know all the options I need to choose, along with the commands and
> any environment variables required.

**Prompt:**
> I've deployed it, and everything looks good. In the screenshot, I selected
> Visakhapatnam and clicked on a visible satellite, but its position is
> showing up near the coast of Africa, if I'm reading it right. I don't
> understand how that's happening - is the data being shown correct or not?
> Now I've actually figured out what my real question is!

**Prompt:**
> Yes, please go ahead!

## Session 7 - Two-Tab Layout, Map-Click Location, Orbit Reference (2026-09-11)

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

**Prompt:**
> Yes, everything works, and I agree it should fetch immediately, as you
> suggested, rather than requiring another click on Find Passes. Once this is
> built, we can review it and decide on any further changes.

## Session 8 - Formatting Cleanup, Zoom Bug, Feature Brainstorm (2026-09-11)

**Prompt:**
> Please replace all em dashes with hyphens. Next issue: if I zoom into the
> map and then select a different city (say, Jaipur), the data updates but
> the map zooms back out to nearly the initial view - that makes it hard to
> use. Why does it reset like that? That needs fixing. Also, I'd like the
> site to have an outstanding, extraordinary feature. Here's an idea: a
> notification when a satellite is about to pass, and something about
> identifying the best time or place to actually see it. Something out of
> the box - do you have any ideas along those lines?

**Prompt:**
> Let's go ahead and implement all three.

## Session 9 - UI Refinement Pass (2026-09-11)

**Prompt:**
> I'd like a few UI changes. First, move the Best Pass spotlight into the row
> with Passes per Day and Average Duration, so we end up with three clean
> cards there. Second, the notify button below the map looks good as it is.
> Third, in the "Visible" section, there's something extra you added that
> doesn't look good - please remove it. Fourth, it's hard to tell where one
> section ends and the next begins, so please add some spacing after each
> section for clearer separation. Walk through the UI from a user's
> perspective, suggest the changes you'd make, and then we can start on them.

## Session 10 - Glossary Redesign & Mobile Responsiveness Audit (2026-09-11)

**Prompt:** (with a screenshot of the four orbit-type cards)
> I wanted this section to be a knowledge base, but not structured the way it
> currently is. One card could define one term, the next card another, and so
> on - for example, what an orbit is, what altitude means - organized by
> concept rather than just the four orbit types. It should genuinely help a
> first-time visitor understand every term used on this site. Let me know how
> you'd approach that, and I'll suggest any changes before we build it.

**Prompt:**
> It's better if you keep 4 per row on wide screens.

**Prompt:**
> Can you make this website responsive on iPhones and Android devices?
> Nothing should overflow off the screen - could you check that?

## Session 11 - Header Bug, Favicon, and a Second Responsiveness Pass (2026-09-11)

**Prompt:** (with two screenshots showing the header intact before scrolling,
then apparently gone - only a sliver of the "Global Tracking" tab visible -
after scrolling)
> When I scroll, the navbar keeps disappearing, as if it's rendering behind
> other content - that's one issue. Also, clicking "Satellites Over My City"
> should at least be clickable - right now it isn't; it can just redirect to
> the same page, but it needs to respond to a click. We also need a favicon -
> please add a good icon related to the site. And check if there's anything
> else we could improve for visual appeal or responsiveness across the site.

## Session 12 - Three-Page Restructure with a 3D Globe (2026-09-11)

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

## Session 13 - Glossary Wording and Header Centering (2026-09-11)

**Prompt:** (with two screenshots - the Orbit Type glossary card, and the
header with the tab row circled at the far right)
> In the Orbit Type card, I asked you to explain what LEO means - that it's a
> type of orbit, something along those lines - so why did you write something
> else instead? Also, let's move the tab/page navigation to the center of the
> header rather than the far right.

## Session 14 - Glossary Consistency & Full Prompt Log Rewrite (2026-09-11)

**Prompt:**
> I feel the LEO/MEO/GEO/HEO mini-list in the Orbit Type card can be removed,
> so that all the glossary cards have the same level of content and feel
> consistent. After that, please update my GitHub README and the prompt log.
> Go through and include all the actual prompts I've given you, but refine
> the structure with good English and clear sentence framing - not just the
> exact wording, but rewritten into well-formed sentences.
