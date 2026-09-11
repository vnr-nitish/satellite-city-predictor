let map, cityMarker, trackLine, trackMarker, connectorLine, animTimer;
let activeTrackKey = null; // identifies which card is currently animating, for click-to-toggle
let currentCity = null;

const LAST_CITY_KEY = "satellite-app-last-city";
const VISIBLE_REFRESH_MS = 30000;

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
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 18,
  }).addTo(map);

  const res = await fetch("/api/cities");
  const { cities } = await res.json();
  const select = document.getElementById("city-select");

  document.getElementById("refresh-btn").addEventListener("click", loadPasses);
  document.getElementById("stop-animation-btn").addEventListener("click", clearTrack);

  const lastCity = getLastCity();
  if (lastCity && cities.includes(lastCity)) {
    select.innerHTML = cities.map((c) => `<option value="${c}">${c}</option>`).join("");
    select.value = lastCity;
    await loadPasses();
  } else {
    select.innerHTML =
      `<option value="" disabled selected>Select a city...</option>` +
      cities.map((c) => `<option value="${c}">${c}</option>`).join("");
    showGettingStartedState();
  }

  // "Visible right now" changes over time even without any user action, so
  // keep it fresh in the background rather than only updating on click.
  setInterval(() => {
    if (currentCity) loadCurrentlyVisible(currentCity);
  }, VISIBLE_REFRESH_MS);
}

function showGettingStartedState() {
  document.getElementById("pass-list").innerHTML = "<li>Select a city above and click \"Find Passes\" to get started.</li>";
  document.getElementById("visible-now-list").innerHTML = "<li>Select a city above and click \"Find Passes\" to get started.</li>";
}

async function loadPasses() {
  const city = document.getElementById("city-select").value;
  if (!city) return;

  const res = await fetch(`/api/passes?city=${encodeURIComponent(city)}&hours=48`);
  const data = await res.json();

  // A track animated for a previously-viewed city must not linger once the
  // city changes - otherwise it looks like satellites are passing over a
  // city you never selected.
  clearTrack();

  currentCity = city;
  saveLastCity(city);

  if (cityMarker) map.removeLayer(cityMarker);
  cityMarker = L.marker([data.lat, data.lon]).addTo(map).bindPopup(city);
  map.setView([data.lat, data.lon], 4);

  renderPassList(data.passes);
  loadCurrentlyVisible(city);
  if (window.loadInsights) window.loadInsights(city);
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

async function loadCurrentlyVisible(city) {
  const res = await fetch(`/api/currently-visible?city=${encodeURIComponent(city)}`);
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
      // "Visible right now" has no rise/set window (it's already up), so
      // animate a short track centered on the current moment instead - long
      // enough to visibly show LEO satellites moving, short enough that
      // near-stationary GEO/MEO satellites correctly barely move.
      const sat = data.satellites[i];
      const now = new Date();
      const start = new Date(now.getTime() - 10 * 60000).toISOString();
      const end = new Date(now.getTime() + 10 * 60000).toISOString();
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
function updateGroundTrackNote(cityLatLng, satLatLng) {
  if (!connectorLine) {
    connectorLine = L.polyline([cityLatLng, satLatLng], {
      color: "#f59e0b",
      weight: 2,
      dashArray: "6 8",
      opacity: 0.7,
    }).addTo(map);
  } else {
    connectorLine.setLatLngs([cityLatLng, satLatLng]);
  }

  const distanceKm = Math.round(cityLatLng.distanceTo(satLatLng) / 1000);
  document.getElementById("ground-track-note").textContent =
    `· ground track ${distanceKm.toLocaleString()} km away (dashed line)`;
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

  const cityLatLng = cityMarker.getLatLng();
  updateGroundTrackNote(cityLatLng, trackMarker.getLatLng());

  map.fitBounds(L.latLngBounds(latlngs).extend(cityLatLng), { maxZoom: 5, padding: [30, 30] });

  let i = 0;
  animTimer = setInterval(() => {
    trackMarker.setLatLng(latlngs[i]);
    updateGroundTrackNote(cityLatLng, trackMarker.getLatLng());
    i = (i + 1) % latlngs.length;
  }, 200);
}

init();
