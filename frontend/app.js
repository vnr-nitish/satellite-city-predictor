let map, cityMarker, trackLine, trackMarker, animTimer;
let activeTrackKey = null; // identifies which card is currently animating, for click-to-toggle

async function init() {
  map = L.map("map", { zoomControl: true }).setView([17.385, 78.4867], 3);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 18,
  }).addTo(map);

  const res = await fetch("/api/cities");
  const { cities } = await res.json();
  const select = document.getElementById("city-select");
  select.innerHTML = cities.map((c) => `<option value="${c}">${c}</option>`).join("");

  document.getElementById("refresh-btn").addEventListener("click", loadPasses);
  await loadPasses();
}

async function loadPasses() {
  const city = document.getElementById("city-select").value;
  const res = await fetch(`/api/passes?city=${encodeURIComponent(city)}&hours=48`);
  const data = await res.json();

  // A track animated for a previously-viewed city must not linger once the
  // city changes - otherwise it looks like satellites are passing over a
  // city you never selected.
  clearTrack();

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
      if (toggleOff(key, list, li)) return;
      highlightSelected(list, li, key);
      animatePassWindow(passes[i].norad_id, passes[i].rise_time, passes[i].set_time);
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
      if (toggleOff(key, list, li)) return;
      highlightSelected(list, li, key);
      // "Visible right now" has no rise/set window (it's already up), so
      // animate a short track centered on the current moment instead - long
      // enough to visibly show LEO satellites moving, short enough that
      // near-stationary GEO/MEO satellites correctly barely move.
      const norad = data.satellites[i].norad_id;
      const now = new Date();
      const start = new Date(now.getTime() - 10 * 60000).toISOString();
      const end = new Date(now.getTime() + 10 * 60000).toISOString();
      animatePassWindow(norad, start, end);
    });
  });
}

// Clicking the already-active card turns its animation off instead of
// redrawing the same thing. Returns true if this click was such a toggle-off.
function toggleOff(key, list, li) {
  if (activeTrackKey !== key) return false;
  clearTrack();
  li.classList.remove("selected");
  return true;
}

function highlightSelected(list, selectedLi, key) {
  document.querySelectorAll("#pass-list li, #visible-now-list li").forEach((li) => li.classList.remove("selected"));
  selectedLi.classList.add("selected");
  activeTrackKey = key;
}

function clearTrack() {
  clearInterval(animTimer);
  animTimer = null;
  if (trackLine) map.removeLayer(trackLine);
  if (trackMarker) map.removeLayer(trackMarker);
  trackLine = null;
  trackMarker = null;
  activeTrackKey = null;
  document.querySelectorAll("#pass-list li, #visible-now-list li").forEach((li) => li.classList.remove("selected"));
}

async function animatePassWindow(noradId, startIso, endIso) {
  clearInterval(animTimer);
  if (trackLine) map.removeLayer(trackLine);
  if (trackMarker) map.removeLayer(trackMarker);

  const res = await fetch(
    `/api/track?norad_id=${noradId}&start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}&step_seconds=15`
  );
  const { points } = await res.json();
  if (!points.length) return;

  const latlngs = points.map((p) => [p.lat, p.lon]);
  trackLine = L.polyline(latlngs, { color: "#38bdf8", weight: 3 }).addTo(map);
  trackMarker = L.circleMarker(latlngs[0], { radius: 7, color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 1, weight: 2 }).addTo(map);

  map.fitBounds(trackLine.getBounds(), { maxZoom: 5, padding: [30, 30] });

  let i = 0;
  animTimer = setInterval(() => {
    trackMarker.setLatLng(latlngs[i]);
    i = (i + 1) % latlngs.length;
  }, 200);
}

init();
