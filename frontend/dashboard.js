let orbitChart, topSatChart;

const PALETTE = ["#38bdf8", "#f59e0b", "#a78bfa", "#34d399", "#f472b6", "#fbbf24"];

window.loadInsights = async function loadInsights(city) {
  const res = await fetch(`/api/insights?city=${encodeURIComponent(city)}&hours=48`);
  const data = await res.json();

  document.getElementById("passesPerDayStat").textContent = data.passes_per_day;
  document.getElementById("avgDurationStat").textContent = `${data.average_duration_seconds}s`;

  renderOrbitChart(data.orbit_type_distribution);
  renderTopSatChart(data.top_satellites);
};

function renderOrbitChart(distribution) {
  const ctx = document.getElementById("orbitTypeChart");
  const labels = Object.keys(distribution);
  const values = Object.values(distribution);

  if (orbitChart) orbitChart.destroy();
  orbitChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: PALETTE }],
    },
    options: { plugins: { legend: { labels: { color: "#e2e8f0" } } } },
  });
}

function renderTopSatChart(topSatellites) {
  const ctx = document.getElementById("topSatellitesChart");
  const labels = topSatellites.map((s) => s.name);
  const values = topSatellites.map((s) => s.passes);

  if (topSatChart) topSatChart.destroy();
  topSatChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Passes", data: values, backgroundColor: PALETTE[0] }],
    },
    options: {
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#e2e8f0" } },
        y: { ticks: { color: "#e2e8f0" } },
      },
    },
  });
}
