let map, cityMarker, trackLine, trackMarker, animTimer;

async function init() {
  map = L.map("map").setView([17.385, 78.4867], 3);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
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

  if (cityMarker) map.removeLayer(cityMarker);
  cityMarker = L.marker([data.lat, data.lon]).addTo(map).bindPopup(city);
  map.setView([data.lat, data.lon], 4);

  renderPassList(data.passes, city);
  loadCurrentlyVisible(city);
  if (window.loadInsights) window.loadInsights(city);
}

function formatDuration(totalSeconds) {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
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
    .map((s) => {
      const visibilityNote = s.visible ? "visible to the eye" : "above horizon, but in daylight/shadow";
      return `<li>
        <div class="sat-name">${s.name}</div>
        <div class="orbit-tag">${s.orbit_type}</div>
        <div>Elevation: ${s.elevation_deg}&deg; &middot; Azimuth: ${s.azimuth_deg}&deg;</div>
        <div>${visibilityNote}</div>
      </li>`;
    })
    .join("");
}

function renderPassList(passes, city) {
  const list = document.getElementById("pass-list");
  if (!passes.length) {
    list.innerHTML = "<li>No passes found in the next 48 hours.</li>";
    return;
  }
  list.innerHTML = passes
    .map((p, i) => {
      const rise = new Date(p.rise_time).toLocaleString();
      const set = new Date(p.set_time).toLocaleString();
      return `<li data-index="${i}">
        <div class="sat-name">${p.name}</div>
        <div class="orbit-tag">${p.orbit_type}</div>
        <div>Start: ${rise}</div>
        <div>End: ${set}</div>
        <div>Peak elevation: ${p.peak_elevation_deg}&deg; &middot; Altitude: ${p.peak_altitude_km} km</div>
        <div>Duration: ${formatDuration(p.duration_seconds)}</div>
      </li>`;
    })
    .join("");

  [...list.children].forEach((li, i) => {
    li.addEventListener("click", () => animatePass(passes[i]));
  });

  window._currentPasses = passes;
}

async function animatePass(pass, doFly = true) {
  clearInterval(animTimer);
  if (trackLine) map.removeLayer(trackLine);
  if (trackMarker) map.removeLayer(trackMarker);

  const res = await fetch(
    `/api/track?norad_id=${pass.norad_id}&start=${encodeURIComponent(pass.rise_time)}&end=${encodeURIComponent(pass.set_time)}&step_seconds=15`
  );
  const { points } = await res.json();
  if (!points.length) return;

  const latlngs = points.map((p) => [p.lat, p.lon]);
  trackLine = L.polyline(latlngs, { color: "#38bdf8", weight: 3 }).addTo(map);
  trackMarker = L.circleMarker(latlngs[0], { radius: 6, color: "#f59e0b", fillOpacity: 1 }).addTo(map);

  if (doFly) map.fitBounds(trackLine.getBounds(), { maxZoom: 5 });

  let i = 0;
  animTimer = setInterval(() => {
    trackMarker.setLatLng(latlngs[i]);
    i = (i + 1) % latlngs.length;
  }, 200);
}

init();
