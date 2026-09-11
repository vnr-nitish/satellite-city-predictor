function activateTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tabId));
  document.querySelectorAll(".tab-panel").forEach((p) => (p.hidden = p.id !== tabId));

  // Leaflet/Three.js both measure their container's size when created. Any
  // map/globe living in a tab that's hidden at that moment gets measured as
  // zero-size (display:none), so switching to it needs an explicit re-measure
  // - otherwise it renders into the wrong area until the window happens to
  // resize on its own.
  if (tabId === "tab-global-tracking" && window.globalMap) {
    setTimeout(() => window.globalMap.invalidateSize(), 0);
  }
  if (tabId === "tab-map-passes" && window.map) {
    setTimeout(() => window.map.invalidateSize(), 0);
  }
  if (tabId === "tab-home" && window.homeGlobe) {
    setTimeout(() => {
      const el = document.getElementById("globe-container");
      window.homeGlobe.width(el.clientWidth).height(el.clientHeight);
    }, 0);
  }
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});

document.querySelectorAll("[data-goto-tab]").forEach((btn) => {
  btn.addEventListener("click", () => activateTab(btn.dataset.gotoTab));
});
