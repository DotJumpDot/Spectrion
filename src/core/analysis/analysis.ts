interface ApiCall {
  id: string;
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  responseHeaders: Record<string, string>;
  responseBody?: string;
  statusCode: number;
  timestamp: number;
  duration?: number;
}

let apiCalls: ApiCall[] = [];
let selectedCall: ApiCall | null = null;

document.addEventListener("DOMContentLoaded", () => {
  const refreshBtn = document.getElementById("refreshBtn");
  const exportBtn = document.getElementById("exportBtn");
  const clearBtn = document.getElementById("clearBtn");
  const searchInput = document.getElementById("searchInput") as HTMLInputElement;
  const methodFilter = document.getElementById("methodFilter") as HTMLSelectElement;
  const statusFilter = document.getElementById("statusFilter") as HTMLSelectElement;
  const apiCallsContainer = document.getElementById("apiCallsContainer");
  const apiDetailsContent = document.getElementById("apiDetailsContent");
  const closeDetailsBtn = document.getElementById("closeDetailsBtn");
  const callCountBadge = document.getElementById("callCount");

  function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  function getStatusClass(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return "success";
    if (statusCode >= 300 && statusCode < 400) return "redirect";
    return "error";
  }

  function filterCalls(): ApiCall[] {
    let filtered = [...apiCalls];

    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(
        (call) =>
          call.url.toLowerCase().includes(searchTerm) ||
          call.method.toLowerCase().includes(searchTerm)
      );
    }

    const methodValue = methodFilter.value;
    if (methodValue !== "all") {
      filtered = filtered.filter((call) => call.method === methodValue);
    }

    const statusValue = statusFilter.value;
    if (statusValue === "success") {
      filtered = filtered.filter((call) => call.statusCode >= 200 && call.statusCode < 300);
    } else if (statusValue === "redirect") {
      filtered = filtered.filter((call) => call.statusCode >= 300 && call.statusCode < 400);
    } else if (statusValue === "error") {
      filtered = filtered.filter((call) => call.statusCode >= 400 || call.statusCode === 0);
    }

    return filtered;
  }

  function renderApiCalls(): void {
    const filtered = filterCalls();
    callCountBadge!.textContent = `${filtered.length} call${filtered.length !== 1 ? "s" : ""}`;

    if (filtered.length === 0) {
      apiCallsContainer!.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#999" stroke-width="1.5">
            <circle cx="24" cy="24" r="20"/>
            <path d="M24 16v16M16 24h16"/>
          </svg>
          <p>No API calls captured yet</p>
          <small>Start browsing to see API calls here</small>
        </div>
      `;
      return;
    }

    apiCallsContainer!.innerHTML = filtered
      .map(
        (call) => `
      <div class="api-call-item ${selectedCall?.id === call.id ? "active" : ""}" data-id="${call.id}">
        <div class="api-call-header">
          <span class="api-method ${call.method}">${call.method}</span>
          <span class="api-status ${getStatusClass(call.statusCode)}">${call.statusCode || "Pending"}</span>
        </div>
        <div class="api-url">${call.url}</div>
        <div class="api-time">
          ${formatTime(Date.now() - call.timestamp)} ago
          ${call.duration ? `• ${call.duration}ms` : ""}
        </div>
      </div>
    `
      )
      .join("");

    document.querySelectorAll(".api-call-item").forEach((item) => {
      item.addEventListener("click", () => {
        const callId = item.getAttribute("data-id");
        const call = apiCalls.find((c) => c.id === callId);
        if (call) {
          selectApiCall(call);
        }
      });
    });
  }

  function selectApiCall(call: ApiCall): void {
    selectedCall = call;
    renderApiCalls();
    renderApiDetails();
  }

  function renderApiDetails(): void {
    if (!selectedCall) {
      apiDetailsContent!.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#999" stroke-width="1.5">
            <rect x="12" y="8" width="24" height="32" rx="2"/>
            <path d="M20 20h8M20 26h8"/>
          </svg>
          <p>Select an API call to view details</p>
        </div>
      `;
      return;
    }

    const call = selectedCall;

    apiDetailsContent!.innerHTML = `
      <div class="detail-section">
        <h3>General</h3>
        <div class="detail-row">
          <span class="detail-label">Method:</span>
          <span class="detail-value">${call.method}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">URL:</span>
          <span class="detail-value">${call.url}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value api-status ${getStatusClass(call.statusCode)}">${call.statusCode || "Pending"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">${call.duration ? `${call.duration}ms` : "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Timestamp:</span>
          <span class="detail-value">${new Date(call.timestamp).toLocaleString()}</span>
        </div>
      </div>

      <div class="detail-section">
        <h3>Request Headers</h3>
        ${
          Object.keys(call.requestHeaders).length > 0
            ? Object.entries(call.requestHeaders)
                .map(
                  ([key, value]) => `
            <div class="detail-row">
              <span class="detail-label">${key}:</span>
              <span class="detail-value">${value}</span>
            </div>
          `
                )
                .join("")
            : '<p class="detail-value">No request headers</p>'
        }
      </div>

      ${
        call.requestBody
          ? `
        <div class="detail-section">
          <h3>Request Body</h3>
          <div class="code-block">${call.requestBody}</div>
        </div>
      `
          : ""
      }

      <div class="detail-section">
        <h3>Response Headers</h3>
        ${
          Object.keys(call.responseHeaders).length > 0
            ? Object.entries(call.responseHeaders)
                .map(
                  ([key, value]) => `
            <div class="detail-row">
              <span class="detail-label">${key}:</span>
              <span class="detail-value">${value}</span>
            </div>
          `
                )
                .join("")
            : '<p class="detail-value">No response headers</p>'
        }
      </div>

      ${
        call.responseBody
          ? `
        <div class="detail-section">
          <h3>Response Body</h3>
          <div class="code-block">${call.responseBody}</div>
        </div>
      `
          : ""
      }
    `;
  }

  async function loadApiCalls(): Promise<void> {
    try {
      // Get the current active tab ID from the URL query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const tabIdStr = urlParams.get("tabId");
      const tabId = tabIdStr ? parseInt(tabIdStr) : undefined;

      const response = await chrome.runtime.sendMessage({ type: "GET_API_CALLS", tabId });
      if (response) {
        apiCalls = response;
        renderApiCalls();
      }
    } catch (error) {
      console.error("Error loading API calls:", error);
    }
  }

  function exportApiCalls(): void {
    const data = JSON.stringify(apiCalls, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spectrion-api-calls-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  refreshBtn?.addEventListener("click", loadApiCalls);
  exportBtn?.addEventListener("click", exportApiCalls);
  clearBtn?.addEventListener("click", async () => {
    if (confirm("Are you sure you want to clear all API calls?")) {
      await chrome.runtime.sendMessage({ type: "CLEAR_SESSIONS" });
      apiCalls = [];
      selectedCall = null;
      renderApiCalls();
      renderApiDetails();
    }
  });
  closeDetailsBtn?.addEventListener("click", () => {
    selectedCall = null;
    renderApiCalls();
    renderApiDetails();
  });
  searchInput?.addEventListener("input", renderApiCalls);
  methodFilter?.addEventListener("change", renderApiCalls);
  statusFilter?.addEventListener("change", renderApiCalls);

  loadApiCalls();
  setInterval(loadApiCalls, 3000);
});
