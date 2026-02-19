interface ApiCall {
  id: string;
  url: string;
  method: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  statusCode: number;
  timestamp: number;
  duration?: number;
}

interface EndpointStats {
  url: string;
  calls: number;
  totalTime: number;
  errors: number;
  bandwidth: number;
  avgTime: number;
  errorRate: number;
}

interface AnalyticsData {
  totalCalls: number;
  avgResponseTime: number;
  errorRate: number;
  totalBandwidth: number;
  endpoints: EndpointStats[];
  statusCodes: Record<number, number>;
  responseTimes: Array<{ timestamp: number; duration: number; success: boolean }>;
}

let analyticsApiCalls: ApiCall[] = [];
let analyticsTabId: number | null = null;
let timeRangeFilter = "all";
let responseTimeChart: any = null;
let statusChart: any = null;
let updateInterval: number | null = null;

import {
  Chart,
  LineController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  LineController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

document.addEventListener("DOMContentLoaded", () => {
  const timeRangeFilterSelect = document.getElementById("timeRangeFilter") as HTMLSelectElement;
  const clearAnalyticsBtn = document.getElementById("clearAnalyticsBtn");
  const confirmModal = document.getElementById("confirmModal");
  const confirmCancel = document.getElementById("confirmCancel");
  const confirmOk = document.getElementById("confirmOk");
  const confirmMessage = document.getElementById("confirmMessage");
  const endpointSearch = document.getElementById("endpointSearch") as HTMLInputElement;

  function filterCallsByTimeRange(calls: ApiCall[]): ApiCall[] {
    const now = Date.now();
    switch (timeRangeFilter) {
      case "hour":
        return calls.filter((call) => now - call.timestamp <= 60 * 60 * 1000);
      case "day":
        return calls.filter((call) => now - call.timestamp <= 24 * 60 * 60 * 1000);
      case "week":
        return calls.filter((call) => now - call.timestamp <= 7 * 24 * 60 * 60 * 1000);
      default:
        return calls;
    }
  }

  function calculateBandsize(body: string | undefined): number {
    if (!body) return 0;
    return new Blob([body]).size;
  }

  function calculateAnalytics(): AnalyticsData {
    const filteredCalls = filterCallsByTimeRange(analyticsApiCalls);

    const totalCalls = filteredCalls.length;

    const callsWithDuration = filteredCalls.filter((call) => call.duration !== undefined);
    const avgResponseTime =
      callsWithDuration.length > 0
        ? callsWithDuration.reduce((sum, call) => sum + (call.duration || 0), 0) /
          callsWithDuration.length
        : 0;

    const errorCalls = filteredCalls.filter((call) => call.statusCode >= 400);
    const errorRate = totalCalls > 0 ? (errorCalls.length / totalCalls) * 100 : 0;

    const totalBandwidth = filteredCalls.reduce((sum, call) => {
      const requestSize = calculateBandsize(call.requestBody);
      const responseSize = calculateBandsize(call.responseBody);
      return sum + requestSize + responseSize;
    }, 0);

    const endpointMap = new Map<string, EndpointStats>();

    filteredCalls.forEach((call) => {
      const url = new URL(call.url);
      const endpoint = `${call.method} ${url.pathname}`;

      if (!endpointMap.has(endpoint)) {
        endpointMap.set(endpoint, {
          url: endpoint,
          calls: 0,
          totalTime: 0,
          errors: 0,
          bandwidth: 0,
          avgTime: 0,
          errorRate: 0,
        });
      }

      const stats = endpointMap.get(endpoint)!;
      stats.calls++;
      stats.totalTime += call.duration || 0;
      stats.errors += call.statusCode >= 400 ? 1 : 0;
      stats.bandwidth += calculateBandsize(call.requestBody) + calculateBandsize(call.responseBody);
    });

    const endpoints = Array.from(endpointMap.values())
      .map((stats) => ({
        ...stats,
        avgTime: stats.calls > 0 ? stats.totalTime / stats.calls : 0,
        errorRate: stats.calls > 0 ? (stats.errors / stats.calls) * 100 : 0,
      }))
      .sort((a, b) => b.calls - a.calls);

    const statusCodes: Record<number, number> = {};
    filteredCalls.forEach((call) => {
      statusCodes[call.statusCode] = (statusCodes[call.statusCode] || 0) + 1;
    });

    const responseTimes = filteredCalls
      .filter((call) => call.duration !== undefined)
      .map((call) => ({
        timestamp: call.timestamp,
        duration: call.duration!,
        success: call.statusCode >= 200 && call.statusCode < 300,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    return {
      totalCalls,
      avgResponseTime,
      errorRate,
      totalBandwidth,
      endpoints,
      statusCodes,
      responseTimes,
    };
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  function updateStatsCards(data: AnalyticsData): void {
    const totalCallsEl = document.getElementById("totalCalls");
    const avgResponseTimeEl = document.getElementById("avgResponseTime");
    const errorRateEl = document.getElementById("errorRate");
    const totalBandwidthEl = document.getElementById("totalBandwidth");

    if (totalCallsEl) totalCallsEl.textContent = data.totalCalls.toString();
    if (avgResponseTimeEl) avgResponseTimeEl.textContent = `${Math.round(data.avgResponseTime)}ms`;
    if (errorRateEl) errorRateEl.textContent = `${data.errorRate.toFixed(1)}%`;
    if (totalBandwidthEl) totalBandwidthEl.textContent = formatBytes(data.totalBandwidth);
  }

  function updateResponseTimeChart(data: AnalyticsData): void {
    const ctx = document.getElementById("responseTimeChart") as HTMLCanvasElement;
    if (!ctx) return;

    if (responseTimeChart) {
      responseTimeChart.destroy();
    }

    const labels = data.responseTimes.map((rt) => new Date(rt.timestamp).toLocaleTimeString());
    const successData = data.responseTimes.map((rt) => (rt.success ? rt.duration : null));
    const errorData = data.responseTimes.map((rt) => (!rt.success ? rt.duration : null));

    responseTimeChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Success",
            data: successData,
            borderColor: "#2e7d32",
            backgroundColor: "rgba(46, 125, 50, 0.1)",
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 6,
          },
          {
            label: "Error",
            data: errorData,
            borderColor: "#c62828",
            backgroundColor: "rgba(198, 40, 40, 0.1)",
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              maxTicksLimit: 10,
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Response Time (ms)",
            },
          },
        },
      },
    });
  }

  function updateStatusChart(data: AnalyticsData): void {
    const ctx = document.getElementById("statusChart") as HTMLCanvasElement;
    if (!ctx) return;

    if (statusChart) {
      statusChart.destroy();
    }

    const labels = Object.keys(data.statusCodes).sort();
    const values = labels.map((code) => data.statusCodes[parseInt(code)]);
    const colors = labels.map((code) => {
      const num = parseInt(code);
      if (num >= 200 && num < 300) return "#2e7d32";
      if (num >= 300 && num < 400) return "#f57c00";
      if (num >= 400 && num < 500) return "#f57c00";
      return "#c62828";
    });

    statusChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels.map((code) => `${code}xx`),
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
          },
        },
      },
    });
  }

  function updateEndpointsTable(data: AnalyticsData, searchTerm: string = ""): void {
    const tbody = document.getElementById("endpointsTableBody");
    if (!tbody) return;

    let filteredEndpoints = data.endpoints;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filteredEndpoints = filteredEndpoints.filter((ep) =>
        ep.url.toLowerCase().includes(lowerSearch)
      );
    }

    if (filteredEndpoints.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No data available</td></tr>';
      return;
    }

    tbody.innerHTML = filteredEndpoints
      .map(
        (ep) => `
      <tr>
        <td><code style="background: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px; font-size: 12px;">${ep.url}</code></td>
        <td>${ep.calls}</td>
        <td>${Math.round(ep.avgTime)}ms</td>
        <td><span style="color: ${ep.errorRate > 10 ? "var(--error-color)" : "var(--success-color)"}">${ep.errorRate.toFixed(1)}%</span></td>
        <td>${formatBytes(ep.bandwidth)}</td>
      </tr>
    `
      )
      .join("");
  }

  function updateDashboard(): void {
    const data = calculateAnalytics();
    updateStatsCards(data);
    updateResponseTimeChart(data);
    updateStatusChart(data);
    updateEndpointsTable(data, endpointSearch?.value || "");
  }

  async function loadApiCalls(): Promise<void> {
    try {
      let response;
      if (analyticsTabId) {
        response = await chrome.runtime.sendMessage({
          type: "GET_API_CALLS",
          tabId: analyticsTabId,
        });
      } else {
        response = await chrome.runtime.sendMessage({
          type: "GET_ALL_API_CALLS",
        });
      }

      if (response) {
        analyticsApiCalls = response;

        const cacheData = {
          timestamp: Date.now(),
          data: calculateAnalytics(),
        };
        await chrome.storage.local.set({ spectrion_analytics_cache: cacheData });

        updateDashboard();
      }
    } catch (error) {
      console.error("Error loading API calls:", error);

      try {
        const cached = await chrome.storage.local.get("spectrion_analytics_cache");
        if (cached.spectrion_analytics_cache) {
          const cacheData = cached.spectrion_analytics_cache as {
            timestamp: number;
            data: AnalyticsData;
          };
          const cacheAge = Date.now() - cacheData.timestamp;
          if (cacheAge < 60000) {
            const data = cacheData.data;
            updateStatsCards(data);
            updateResponseTimeChart(data);
            updateStatusChart(data);
            updateEndpointsTable(data, endpointSearch?.value || "");
          }
        }
      } catch (cacheError) {
        console.error("Error loading cached analytics:", cacheError);
      }
    }
  }

  async function getCurrentTabInfo(): Promise<any> {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabIdStr = urlParams.get("tabId");
      if (tabIdStr) {
        analyticsTabId = parseInt(tabIdStr);
      }
      return null;
    } catch (error) {
      console.error("Error getting current tab info:", error);
      return null;
    }
  }

  function showConfirm(message: string, callback: () => void): void {
    if (!confirmMessage) return;
    confirmMessage.textContent = message;
    confirmModal?.classList.add("visible");

    const handleOk = () => {
      confirmModal?.classList.remove("visible");
      confirmOk?.removeEventListener("click", handleOk);
      confirmCancel?.removeEventListener("click", handleCancel);
      callback();
    };

    const handleCancel = () => {
      confirmModal?.classList.remove("visible");
      confirmOk?.removeEventListener("click", handleOk);
      confirmCancel?.removeEventListener("click", handleCancel);
    };

    confirmOk?.addEventListener("click", handleOk);
    confirmCancel?.addEventListener("click", handleCancel);
  }

  async function clearAnalytics(): Promise<void> {
    showConfirm("Are you sure you want to clear all analytics data?", async () => {
      try {
        await chrome.runtime.sendMessage({ type: "CLEAR_SESSIONS" });
        analyticsApiCalls = [];
        updateDashboard();
      } catch (error) {
        console.error("Error clearing analytics:", error);
        alert("Failed to clear analytics data");
      }
    });
  }

  timeRangeFilterSelect?.addEventListener("change", (e) => {
    timeRangeFilter = (e.target as HTMLSelectElement).value;
    updateDashboard();
  });

  clearAnalyticsBtn?.addEventListener("click", clearAnalytics);

  endpointSearch?.addEventListener("input", () => {
    const data = calculateAnalytics();
    updateEndpointsTable(data, endpointSearch.value);
  });

  getCurrentTabInfo();
  loadApiCalls();

  updateInterval = window.setInterval(loadApiCalls, 3000);

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "API_CALLS_UPDATED") {
      loadApiCalls();
    }
  });
});
