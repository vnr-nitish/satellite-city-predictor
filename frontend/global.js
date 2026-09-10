const ORBIT_COLORS = { LEO: "#38bdf8", MEO: "#a78bfa", GEO: "#f59e0b", HEO: "#f472b6" };
const POLL_INTERVAL_MS = 5000;

let globalMap;
const markersByNoradId = new Map();

function initGlobalMap() {
  globalMap = L.map("globalMap", { worldCopyJump: true }).setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(globalMap);

  refreshLivePositions();
  setInterval(refreshLivePositions, POLL_INTERVAL_MS);
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
    const color = ORBIT_COLORS[sat.orbit_type] || "#94a3b8";
    const popupHtml = `<strong>${sat.name}</strong><br>${sat.orbit_type} &middot; ${sat.alt_km} km altitude`;

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
      })
        .addTo(globalMap)
        .bindPopup(popupHtml);
      markersByNoradId.set(sat.norad_id, marker);
    }
  }

  for (const [noradId, marker] of markersByNoradId) {
    if (!seen.has(noradId)) {
      globalMap.removeLayer(marker);
      markersByNoradId.delete(noradId);
    }
  }

  document.getElementById("live-updated").textContent =
    "Updated " + new Date().toLocaleTimeString();
}

initGlobalMap();
