const DATA_URL =
  "https://script.google.com/macros/s/AKfycbxSAmARkkiSKkmw4T_dpZRnnJMJu1fyY-jDCW_hdFlc6oKD4GdNXeQFK2gd0tbYnQyR/exec";

const els = {
  total: document.querySelector("#total-experiments"),
  mean: document.querySelector("#mean-g"),
  sd: document.querySelector("#sd-g"),
  status: document.querySelector("#status"),
  tableBody: document.querySelector("#data-table-body"),
  refreshBtn: document.querySelector("#refresh-btn"),
  chartCanvas: document.querySelector("#g-histogram"),
  shareTwitter: document.querySelector("#share-twitter"),
  shareWhatsApp: document.querySelector("#share-whatsapp"),
};

let histogramChart;
let isLoading = false;

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toFixed(3) : "--";
}

function buildHistogram(values, binCount = 8) {
  if (!values.length) return { labels: [], counts: [] };

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return {
      labels: [`${min.toFixed(3)} - ${max.toFixed(3)}`],
      counts: [values.length],
    };
  }

  const width = (max - min) / binCount;
  const counts = Array.from({ length: binCount }, () => 0);

  for (const value of values) {
    const index = Math.min(Math.floor((value - min) / width), binCount - 1);
    counts[index] += 1;
  }

  const labels = counts.map((_, index) => {
    const start = min + index * width;
    const end = start + width;
    return `${start.toFixed(2)}-${end.toFixed(2)}`;
  });

  return { labels, counts };
}

function renderTable(data) {
  const recentRows = [...data]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10)
    .map(
      (item) => `
      <tr>
        <td>${new Date(item.timestamp).toISOString()}</td>
        <td>${item.experiment ?? "-"}</td>
        <td>${formatNumber(Number(item.g))}</td>
      </tr>`
    )
    .join("");

  els.tableBody.innerHTML =
    recentRows || '<tr><td colspan="3">No experiment data yet.</td></tr>';
}

function renderChart(values) {
  const { labels, counts } = buildHistogram(values);

  if (histogramChart) {
    histogramChart.data.labels = labels;
    histogramChart.data.datasets[0].data = counts;
    histogramChart.update("none");
    return;
  }

  histogramChart = new Chart(els.chartCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Number of measurements",
          data: counts,
          backgroundColor: "rgba(29, 78, 216, 0.7)",
          borderColor: "rgba(29, 78, 216, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: "g range (m/s²)" } },
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
          title: { display: true, text: "Count" },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

function setupShareLinks() {
  const shareText = "Check out Galileo's Ramp Open Day Dashboard";
  const shareUrl = window.location.href;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  els.shareTwitter.href = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  els.shareWhatsApp.href = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
}

function updateSummary(values) {
  els.total.textContent = String(values.length);
  els.mean.textContent = formatNumber(mean(values));
  els.sd.textContent = formatNumber(standardDeviation(values));
}

async function loadData() {
  if (isLoading) return;
  isLoading = true;
  els.status.textContent = "Loading data…";
  els.refreshBtn.disabled = true;

  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    const data = Array.isArray(payload) ? payload : [];
    const values = data
      .map((item) => Number(item.g))
      .filter((value) => Number.isFinite(value));

    updateSummary(values);
    renderChart(values);
    renderTable(data);
    els.status.textContent = `Last updated: ${new Date().toLocaleString()}`;
  } catch (error) {
    els.status.textContent = `Unable to load data from Google Apps Script (${error.message}).`;
  } finally {
    isLoading = false;
    els.refreshBtn.disabled = false;
  }
}

els.refreshBtn.addEventListener("click", loadData);
setupShareLinks();
loadData();
