const ORBIT_COLORS = { LEO: "#38bdf8", MEO: "#a78bfa", GEO: "#f59e0b", HEO: "#f472b6" };
const POLL_INTERVAL_MS = 5000;

let globalMap;
const markersByNoradId = new Map();
const orbitTypeByNoradId = new Map();
const hiddenOrbitTypes = new Set();

function initGlobalMap() {
  globalMap = L.map("globalMap", { worldCopyJump: true }).setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 18,
  }).addTo(globalMap);

  document.querySelectorAll(".legend-item").forEach((btn) => {
    btn.addEventListener("click", () => toggleOrbitType(btn.dataset.orbit, btn));
  });

  refreshLivePositions();
  setInterval(refreshLivePositions, POLL_INTERVAL_MS);
}

function toggleOrbitType(orbitType, btn) {
  if (hiddenOrbitTypes.has(orbitType)) {
    hiddenOrbitTypes.delete(orbitType);
    btn.classList.remove("legend-item-off");
  } else {
    hiddenOrbitTypes.add(orbitType);
    btn.classList.add("legend-item-off");
  }
  for (const [noradId, marker] of markersByNoradId) {
    const isHidden = hiddenOrbitTypes.has(orbitTypeByNoradId.get(noradId));
    if (isHidden && globalMap.hasLayer(marker)) globalMap.removeLayer(marker);
    if (!isHidden && !globalMap.hasLayer(marker)) marker.addTo(globalMap);
  }
}

async function refreshLivePositions() {
  let data;
  try {
    const res = await fetch("/api/live-positions");
    data = await res.json();
  } catch (err) {
    return;
  }

  const seen = new Set();
  for (const sat of data.positions) {
    seen.add(sat.norad_id);
    orbitTypeByNoradId.set(sat.norad_id, sat.orbit_type);
    const color = ORBIT_COLORS[sat.orbit_type] || "#94a3b8";
    const popupHtml = `<strong>${sat.name}</strong><br>${sat.orbit_type} &middot; ${sat.alt_km.toLocaleString()} km altitude`;
    const isHidden = hiddenOrbitTypes.has(sat.orbit_type);

    if (markersByNoradId.has(sat.norad_id)) {
      const marker = markersByNoradId.get(sat.norad_id);
      marker.setLatLng([sat.lat, sat.lon]);
      marker.setPopupContent(popupHtml);
    } else {
      const marker = L.circleMarker([sat.lat, sat.lon], {
        radius: 5,
        color,
        fillColor: color,
        fillOpacity: 0.9,
        weight: 1,
      }).bindPopup(popupHtml);

      marker.on("mouseover", () => marker.setStyle({ radius: 8, weight: 2 }));
      marker.on("mouseout", () => marker.setStyle({ radius: 5, weight: 1 }));

      if (!isHidden) marker.addTo(globalMap);
      markersByNoradId.set(sat.norad_id, marker);
    }
  }

  for (const [noradId, marker] of markersByNoradId) {
    if (!seen.has(noradId)) {
      globalMap.removeLayer(marker);
      markersByNoradId.delete(noradId);
      orbitTypeByNoradId.delete(noradId);
    }
  }

  document.getElementById("live-updated").textContent =
    `Updated ${new Date().toLocaleTimeString()} · ${data.positions.length} satellites`;
}

initGlobalMap();
