// The Home page's rotating globe - plots the same real satellites shown on
// the "Global Tracking" tab, just as an inviting first-impression visual
// rather than a functional tool. Uses globe.gl (built on Three.js/WebGL).

const HOME_GLOBE_COLOR = { LEO: "#38bdf8", MEO: "#a78bfa", GEO: "#f59e0b", HEO: "#f472b6" };
const HOME_GLOBE_REFRESH_MS = 30000;

function initHomeGlobe() {
  const container = document.getElementById("globe-container");
  if (!container || typeof Globe !== "function") return;

  const globe = Globe()(container)
    .globeImageUrl("https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg")
    .backgroundColor("rgba(0,0,0,0)")
    .width(container.clientWidth)
    .height(container.clientHeight)
    .pointAltitude(0.02)
    .pointRadius(0.35)
    .pointColor((d) => HOME_GLOBE_COLOR[d.orbit_type] || "#94a3b8")
    .pointLabel((d) => `${d.name} (${d.orbit_type})`)
    .pointLat("lat")
    .pointLng("lon")
    .pointOfView({ lat: 15, lng: 78, altitude: 2.2 });

  window.homeGlobe = globe;

  // Respect the OS-level "reduce motion" accessibility preference - a
  // constantly-spinning globe is exactly the kind of motion that setting
  // asks sites to avoid.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const controls = globe.controls();
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 0.6;
  controls.enableZoom = false;

  async function refreshPoints() {
    try {
      const res = await fetch("/api/live-positions");
      const data = await res.json();
      globe.pointsData(data.positions);
    } catch (err) {
      // Purely decorative - if this fails, the globe just stays empty/still
      // shows Earth, no need to surface an error for a non-essential feature.
    }
  }

  refreshPoints();
  setInterval(refreshPoints, HOME_GLOBE_REFRESH_MS);

  window.addEventListener("resize", () => {
    const homeTab = document.getElementById("tab-home");
    if (homeTab && !homeTab.hidden) {
      globe.width(container.clientWidth).height(container.clientHeight);
    }
  });
}

initHomeGlobe();
