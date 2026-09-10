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
  if (window.loadInsights) window.loadInsights(city);
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
      return `<li data-index="${i}">
        <div class="sat-name">${p.name}</div>
        <div class="orbit-tag">${p.orbit_type}</div>
        <div>Rise: ${rise}</div>
        <div>Peak elevation: ${p.peak_elevation_deg}&deg;</div>
        <div>Duration: ${p.duration_seconds}s</div>
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
