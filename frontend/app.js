let map, locationMarker, trackLine, trackMarker, connectorLine, animTimer;
let activeTrackKey = null; // identifies which card is currently animating, for click-to-toggle
let currentLocation = null; // { type: "city", city } or { type: "coords", lat, lon }

const LAST_CITY_KEY = "satellite-app-last-city";
const VISIBLE_REFRESH_MS = 30000;

// "Visible right now" has no rise/set window to animate between (the
// satellite's already up), so we animate a short window centered on now
// instead. How much of that window actually shows movement depends on the
// orbit: LEO satellites cross the sky in minutes, so a short window is
// plenty; MEO/HEO move much more slowly and need a wider window to show a
// visible arc at all; GEO doesn't meaningfully move regardless of window
// size, since "geostationary" means fixed relative to the ground.
const VISIBLE_WINDOW_MINUTES = { LEO: 10, MEO: 45, HEO: 45, GEO: 10 };

let bestPass = null; // the currently-spotlighted pass, kept for the live countdown

function getLastCity() {
  try {
    return localStorage.getItem(LAST_CITY_KEY);
  } catch (err) {
    return null;
  }
}

function saveLastCity(city) {
  try {
    localStorage.setItem(LAST_CITY_KEY, city);
  } catch (err) {
    // private browsing / storage disabled - fine to just skip remembering
  }
}

async function init() {
  map = L.map("map", { zoomControl: true }).setView([17.385, 78.4867], 3);
  window.map = map;
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 18,
  }).addTo(map);

  map.on("click", (e) => {
    document.getElementById("city-select").value = "";
    loadLocation({ type: "coords", lat: e.latlng.lat, lon: e.latlng.lng });
  });

  const res = await fetch("/api/cities");
  const { cities } = await res.json();
  const select = document.getElementById("city-select");

  document.getElementById("refresh-btn").addEventListener("click", () => {
    const city = select.value;
    if (city) loadLocation({ type: "city", city });
  });
  document.getElementById("stop-animation-btn").addEventListener("click", clearTrack);

  const lastCity = getLastCity();
  if (lastCity && cities.includes(lastCity)) {
    select.innerHTML = cities.map((c) => `<option value="${c}">${c}</option>`).join("");
    select.value = lastCity;
    await loadLocation({ type: "city", city: lastCity });
  } else {
    select.innerHTML =
      `<option value="" disabled selected>Select a city...</option>` +
      cities.map((c) => `<option value="${c}">${c}</option>`).join("");
    showGettingStartedState();
  }

  // "Visible right now" changes over time even without any user action, so
  // keep it fresh in the background rather than only updating on click.
  setInterval(() => {
    if (currentLocation) loadCurrentlyVisible();
  }, VISIBLE_REFRESH_MS);
}

function showGettingStartedState() {
  const msg = "Select a city above, or click anywhere on the map, to get started.";
  document.getElementById("pass-list").innerHTML = `<li>${msg}</li>`;
  document.getElementById("visible-now-list").innerHTML = `<li>${msg}</li>`;
}

function locationQueryString(loc) {
  return loc.type === "city"
    ? `city=${encodeURIComponent(loc.city)}`
    : `lat=${loc.lat}&lon=${loc.lon}`;
}

async function loadLocation(loc) {
  const res = await fetch(`/api/passes?${locationQueryString(loc)}&hours=48`);
  if (!res.ok) return;
  const data = await res.json();

  // A track animated for a previously-viewed location must not linger once
  // the location changes - otherwise it looks like satellites are passing
  // over somewhere you never selected.
  clearTrack();

  currentLocation = loc;
  if (loc.type === "city") saveLastCity(loc.city);

  if (locationMarker) map.removeLayer(locationMarker);
  locationMarker = L.marker([data.lat, data.lon]).addTo(map).bindPopup(data.location);
  // Never zoom back out below a reasonable "city" view (8), and never zoom
  // out below whatever the user already had - jumping from a zoomed-in view
  // back to a wide one on every location change felt like the map was
  // resetting itself instead of just moving to the new spot. setView (not
  // flyTo) is deliberate: flyTo's "fly over" animation zooms out mid-flight
  // for long-distance jumps, which would recreate the same unwanted
  // zoomed-out moment, just as an animation instead of an instant reset.
  const targetZoom = Math.max(map.getZoom(), 8);
  map.setView([data.lat, data.lon], targetZoom);

  renderPassList(data.passes);
  renderBestPassSpotlight(data.passes);
  loadCurrentlyVisible();
  if (window.loadInsights) window.loadInsights(locationQueryString(loc));

  window.currentPassesForNotify = { passes: data.passes, location: data.location };
  if (window.scheduleNotifications) window.scheduleNotifications(data.passes, data.location);
}

function formatDuration(totalSeconds) {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

// Shared card markup for both the "Upcoming Passes" and "Visible Right Now"
// lists, so the two stay visually aligned - same field order, same layout.
function satelliteCardHtml({ name, orbitType, lines }) {
  const lineHtml = lines.map((l) => `<div>${l}</div>`).join("");
  return `<div class="sat-name">${name}</div>
    <div class="orbit-tag">${orbitType}</div>
    ${lineHtml}`;
}

function renderPassList(passes) {
  const list = document.getElementById("pass-list");
  if (!passes.length) {
    list.innerHTML = "<li>No passes found in the next 48 hours.</li>";
    return;
  }
  list.innerHTML = passes
    .map((p, i) => {
      const rise = new Date(p.rise_time).toLocaleString();
      const set = new Date(p.set_time).toLocaleString();
      return `<li data-index="${i}">${satelliteCardHtml({
        name: p.name,
        orbitType: p.orbit_type,
        lines: [
          `Start: ${rise}`,
          `End: ${set}`,
          `Peak elevation: ${p.peak_elevation_deg}&deg;`,
          `Altitude: ${p.peak_altitude_km} km`,
          `Duration: ${formatDuration(p.duration_seconds)}`,
        ],
      })}</li>`;
    })
    .join("");

  [...list.children].forEach((li, i) => {
    const key = `pass-${i}`;
    li.addEventListener("click", () => {
      if (toggleOff(key, li)) return;
      highlightSelected(li, key);
      animatePassWindow(passes[i].norad_id, passes[i].rise_time, passes[i].set_time, passes[i].name);
    });
  });
}

// Highlights the single best upcoming viewing opportunity - the visible
// (sunlit, not just geometrically above the horizon) pass with the highest
// peak elevation - with a live countdown, so the answer to "what's actually
// worth going outside for" doesn't require reading the whole pass list.
function renderBestPassSpotlight(passes) {
  const card = document.getElementById("best-pass-spotlight");
  const candidates = passes.filter((p) => p.visible);

  if (!candidates.length) {
    bestPass = null;
    card.hidden = true;
    return;
  }

  bestPass = candidates.reduce((best, p) => (p.peak_elevation_deg > best.peak_elevation_deg ? p : best));
  card.hidden = false;
  card.onclick = () => animatePassWindow(bestPass.norad_id, bestPass.rise_time, bestPass.set_time, bestPass.name);
  updateSpotlightCountdown();
}

function updateSpotlightCountdown() {
  const card = document.getElementById("best-pass-spotlight");
  if (!bestPass || card.hidden) return;

  const riseTime = new Date(bestPass.rise_time);
  const peakTime = new Date(bestPass.peak_time);
  const msUntilRise = riseTime - new Date();

  const countdownText = msUntilRise <= 0
    ? "Happening now"
    : `Rises in ${formatDuration(Math.round(msUntilRise / 1000))}`;

  card.innerHTML = `
    <div class="spotlight-label">&#11088; Best Pass to Watch</div>
    <div class="spotlight-name">${bestPass.name}</div>
    <div class="spotlight-detail">${bestPass.orbit_type} &middot; peaks at ${peakTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      at ${bestPass.peak_elevation_deg}&deg; elevation &middot; ${formatDuration(bestPass.duration_seconds)} long</div>
    <div class="spotlight-countdown">${countdownText}</div>
  `;
}

setInterval(updateSpotlightCountdown, 30000);

async function loadCurrentlyVisible() {
  if (!currentLocation) return;
  const res = await fetch(`/api/currently-visible?${locationQueryString(currentLocation)}`);
  if (!res.ok) return;
  const data = await res.json();
  const list = document.getElementById("visible-now-list");

  if (!data.satellites.length) {
    list.innerHTML = "<li>No tracked satellites are above the horizon right now.</li>";
    return;
  }

  list.innerHTML = data.satellites
    .map((s, i) => {
      const visibilityNote = s.visible ? "Visible to the eye" : "Above horizon, but in daylight/shadow";
      return `<li data-index="${i}">${satelliteCardHtml({
        name: s.name,
        orbitType: s.orbit_type,
        lines: [
          `Elevation: ${s.elevation_deg}&deg;`,
          `Azimuth: ${s.azimuth_deg}&deg;`,
          visibilityNote,
        ],
      })}</li>`;
    })
    .join("");

  [...list.children].forEach((li, i) => {
    const key = `visible-${i}`;
    li.addEventListener("click", () => {
      if (toggleOff(key, li)) return;
      highlightSelected(li, key);
      const sat = data.satellites[i];
      const windowMinutes = VISIBLE_WINDOW_MINUTES[sat.orbit_type] || 10;
      const now = new Date();
      const start = new Date(now.getTime() - windowMinutes * 60000).toISOString();
      const end = new Date(now.getTime() + windowMinutes * 60000).toISOString();
      animatePassWindow(sat.norad_id, start, end, sat.name);
    });
  });
}

// Clicking the already-active card turns its animation off instead of
// redrawing the same thing. Returns true if this click was such a toggle-off.
function toggleOff(key, li) {
  if (activeTrackKey !== key) return false;
  clearTrack();
  li.classList.remove("selected");
  return true;
}

function highlightSelected(selectedLi, key) {
  document.querySelectorAll("#pass-list li, #visible-now-list li").forEach((li) => li.classList.remove("selected"));
  selectedLi.classList.add("selected");
  activeTrackKey = key;
}

function setAnimatingIndicator(name) {
  const indicator = document.getElementById("animating-indicator");
  if (name) {
    document.getElementById("animating-name").textContent = name;
    indicator.hidden = false;
  } else {
    indicator.hidden = true;
  }
}

function clearTrack() {
  clearInterval(animTimer);
  animTimer = null;
  if (trackLine) map.removeLayer(trackLine);
  if (trackMarker) map.removeLayer(trackMarker);
  if (connectorLine) map.removeLayer(connectorLine);
  trackLine = null;
  trackMarker = null;
  connectorLine = null;
  activeTrackKey = null;
  setAnimatingIndicator(null);
  document.querySelectorAll("#pass-list li, #visible-now-list li").forEach((li) => li.classList.remove("selected"));
}

// The map's blue line/marker show the satellite's ground track (the point
// directly beneath it), not a line pointing from the city toward it in the
// sky. Those are nearly the same thing for a low LEO pass, but for MEO/GEO
// satellites (thousands of km up) they can be very different: a satellite
// can sit low in your sky while its ground track is a continent away. This
// dashed line and the live distance readout make that visible instead of
// leaving the map looking like a data error.
function updateGroundTrackNote(originLatLng, satLatLng, trackSpanKm) {
  if (!connectorLine) {
    connectorLine = L.polyline([originLatLng, satLatLng], {
      color: "#f59e0b",
      weight: 2,
      dashArray: "6 8",
      opacity: 0.7,
    }).addTo(map);
  } else {
    connectorLine.setLatLngs([originLatLng, satLatLng]);
  }

  const distanceKm = Math.round(originLatLng.distanceTo(satLatLng) / 1000);
  const stationaryNote = trackSpanKm < 50 ? " (near-stationary orbit)" : "";
  document.getElementById("ground-track-note").textContent =
    `· ground track ${distanceKm.toLocaleString()} km away (dashed line)${stationaryNote}`;
}

async function animatePassWindow(noradId, startIso, endIso, satelliteName) {
  clearInterval(animTimer);
  if (trackLine) map.removeLayer(trackLine);
  if (trackMarker) map.removeLayer(trackMarker);
  if (connectorLine) map.removeLayer(connectorLine);
  connectorLine = null;

  const res = await fetch(
    `/api/track?norad_id=${noradId}&start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}&step_seconds=15`
  );
  const { points } = await res.json();
  if (!points.length) return;

  setAnimatingIndicator(satelliteName);

  const latlngs = points.map((p) => [p.lat, p.lon]);
  trackLine = L.polyline(latlngs, { color: "#38bdf8", weight: 3 }).addTo(map);
  trackMarker = L.circleMarker(latlngs[0], { radius: 7, color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 1, weight: 2 }).addTo(map);

  const originLatLng = locationMarker.getLatLng();
  const trackBounds = L.latLngBounds(latlngs);
  const trackSpanKm = trackBounds.getSouthWest().distanceTo(trackBounds.getNorthEast()) / 1000;
  updateGroundTrackNote(originLatLng, trackMarker.getLatLng(), trackSpanKm);

  map.fitBounds(trackBounds.extend(originLatLng), { maxZoom: 5, padding: [30, 30] });

  let i = 0;
  animTimer = setInterval(() => {
    trackMarker.setLatLng(latlngs[i]);
    updateGroundTrackNote(originLatLng, trackMarker.getLatLng(), trackSpanKm);
    i = (i + 1) % latlngs.length;
  }, 200);
}

init();
