let orbitChart, orbitDurationChart, topSatChart;

const PALETTE = ["#38bdf8", "#f59e0b", "#a78bfa", "#34d399", "#f472b6", "#fbbf24"];
const ORBIT_COLOR = { LEO: "#38bdf8", MEO: "#a78bfa", GEO: "#f59e0b", HEO: "#f472b6" };

window.loadInsights = async function loadInsights(city) {
  const res = await fetch(`/api/insights?city=${encodeURIComponent(city)}&hours=48`);
  const data = await res.json();

  document.getElementById("passesPerDayStat").textContent = data.passes_per_day;
  document.getElementById("avgDurationStat").textContent = `${data.average_duration_seconds}s`;

  renderOrbitChart(data.orbit_type_distribution);
  renderOrbitDurationChart(data.avg_duration_by_orbit_type);
  renderTopSatChart(data.top_satellites);
};

function showEmpty(canvasId, isEmpty) {
  document.getElementById(canvasId).closest(".chart-card").querySelector(".chart-empty").hidden = !isEmpty;
  document.getElementById(canvasId).hidden = isEmpty;
}

function renderOrbitChart(distribution) {
  const ctx = document.getElementById("orbitTypeChart");
  const labels = Object.keys(distribution);
  const values = Object.values(distribution);

  showEmpty("orbitTypeChart", labels.length === 0);
  if (!labels.length) {
    if (orbitChart) orbitChart.destroy();
    orbitChart = null;
    return;
  }

  if (orbitChart) orbitChart.destroy();
  orbitChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: PALETTE, borderColor: "#111827" }],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { color: "#e2e8f0", boxWidth: 12, padding: 12 } } },
    },
  });
}

function renderOrbitDurationChart(avgDurationByOrbitType) {
  const ctx = document.getElementById("orbitDurationChart");
  const labels = Object.keys(avgDurationByOrbitType);
  const values = Object.values(avgDurationByOrbitType);
  const colors = labels.map((l) => ORBIT_COLOR[l] || "#94a3b8");

  showEmpty("orbitDurationChart", labels.length === 0);
  if (!labels.length) {
    if (orbitDurationChart) orbitDurationChart.destroy();
    orbitDurationChart = null;
    return;
  }

  if (orbitDurationChart) orbitDurationChart.destroy();
  orbitDurationChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Avg duration (s)", data: values, backgroundColor: colors }],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        // Log scale on purpose: LEO passes last minutes while MEO/HEO
        // passes can last hours - a linear axis would flatten LEO's bar
        // to invisible. The order-of-magnitude gap IS the insight.
        y: {
          type: "logarithmic",
          min: 10,
          ticks: { color: "#e2e8f0" },
          grid: { color: "#1e293b" },
          title: { display: true, text: "seconds (log scale)", color: "#94a3b8" },
        },
        x: { ticks: { color: "#e2e8f0" }, grid: { display: false } },
      },
    },
  });
}

function renderTopSatChart(topSatellites) {
  const ctx = document.getElementById("topSatellitesChart");
  const labels = topSatellites.map((s) => s.name);
  const values = topSatellites.map((s) => s.passes);

  showEmpty("topSatellitesChart", labels.length === 0);
  if (!labels.length) {
    if (topSatChart) topSatChart.destroy();
    topSatChart = null;
    return;
  }

  if (topSatChart) topSatChart.destroy();
  topSatChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Passes", data: values, backgroundColor: "#38bdf8", borderRadius: 4 }],
    },
    options: {
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#e2e8f0", precision: 0 }, grid: { color: "#1e293b" } },
        y: { ticks: { color: "#e2e8f0" }, grid: { display: false } },
      },
    },
  });
}
