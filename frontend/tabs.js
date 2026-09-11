document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => (p.hidden = true));

    btn.classList.add("active");
    const panel = document.getElementById(btn.dataset.tab);
    panel.hidden = false;

    // Leaflet measures its container's size when the map is created. The
    // global tracking map is initialized on page load while its tab is
    // still hidden (display: none has zero size), so switching to it needs
    // to tell Leaflet to re-measure - otherwise tiles render into the wrong
    // area until the window happens to resize.
    if (btn.dataset.tab === "tab-global-tracking" && window.globalMap) {
      setTimeout(() => window.globalMap.invalidateSize(), 0);
    }
    if (btn.dataset.tab === "tab-map-passes" && window.map) {
      setTimeout(() => window.map.invalidateSize(), 0);
    }
  });
});
