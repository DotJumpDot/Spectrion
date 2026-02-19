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

interface TabSession {
  tabId: number;
  url: string;
  title: string;
  favicon?: string;
  session: any;
}

interface UrlHistory {
  tabId: number;
  url: string;
  title: string;
  timestamp: number;
}

interface RequestPreset {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: string;
  body: string;
  createdAt: number;
}

let apiCalls: ApiCall[] = [];
let selectedCall: ApiCall | null = null;
let currentTabId: number | null = null;
let allTabSessions: TabSession[] = [];
let urlHistory: UrlHistory[] = [];
let currentHistoryIndex = -1;
let isDarkMode = false;
let maxHistorySize = 10;
let showUrlInsteadOfTitle = true;
let isDropdownOpen = false;
let requestPresets: RequestPreset[] = [];

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
  const darkModeToggle = document.getElementById("darkModeToggle");
  const urlText = document.getElementById("urlText");
  const prevUrlBtn = document.getElementById("prevUrlBtn");
  const nextUrlBtn = document.getElementById("nextUrlBtn");
  const urlSelector = document.getElementById("urlSelector");
  const currentUrl = document.getElementById("currentUrl");
  const urlDropdown = document.getElementById("urlDropdown");
  const urlDropdownList = document.getElementById("urlDropdownList");
  const urlToggleBtn = document.getElementById("urlToggleBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const maxHistorySizeInput = document.getElementById("maxHistorySize") as HTMLInputElement;
  const fullInfoModeInput = document.getElementById("fullInfoMode") as HTMLInputElement;
  const fullInfoModeToggle = document.querySelector(".toggle-switch") as HTMLElement;
  const copyModal = document.getElementById("copyModal");
  const closeCopyBtn = document.getElementById("closeCopyBtn");
  const copyCurlBtn = document.getElementById("copyCurl");
  const copyFetchBtn = document.getElementById("copyFetch");
  const copyAxiosBtn = document.getElementById("copyAxios");
  let currentCopyCall: ApiCall | null = null;
  const modifyModal = document.getElementById("modifyModal");
  const closeModifyBtn = document.getElementById("closeModifyBtn");
  const cancelModifyBtn = document.getElementById("cancelModifyBtn");
  const sendModifiedBtn = document.getElementById("sendModifiedBtn");
  const modifyMethod = document.getElementById("modifyMethod") as HTMLSelectElement;
  const modifyUrl = document.getElementById("modifyUrl") as HTMLInputElement;
  const modifyHeaders = document.getElementById("modifyHeaders") as HTMLTextAreaElement;
  const modifyBody = document.getElementById("modifyBody") as HTMLTextAreaElement;
  let currentModifyCall: ApiCall | null = null;
  const requestBuilderModal = document.getElementById("requestBuilderModal");
  const requestBuilderBtn = document.getElementById("requestBuilderBtn");
  const closeRequestBuilderBtn = document.getElementById("closeRequestBuilderBtn");
  const cancelRequestBtn = document.getElementById("cancelRequestBtn");
  const sendRequestBtn = document.getElementById("sendRequestBtn");
  const requestMethod = document.getElementById("requestMethod") as HTMLSelectElement;
  const requestUrl = document.getElementById("requestUrl") as HTMLInputElement;
  const requestHeaders = document.getElementById("requestHeaders") as HTMLTextAreaElement;
  const requestBody = document.getElementById("requestBody") as HTMLTextAreaElement;
  const savePresetBtn = document.getElementById("savePresetBtn");
  const presetsList = document.getElementById("presetsList");

  fullInfoModeToggle?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    fullInfoModeInput!.checked = !fullInfoModeInput!.checked;
  });

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
        <div class="api-actions">
          <button class="btn secondary small replay-btn" data-id="${call.id}" title="Replay this API call">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Replay
          </button>
          <button class="btn secondary small modify-btn" data-id="${call.id}" title="Modify and retry this API call">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Modify
          </button>
          <button class="btn secondary small copy-btn" data-id="${call.id}" title="Copy request code">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          </button>
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

    document.querySelectorAll(".replay-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const callId = btn.getAttribute("data-id");
        if (callId) {
          replayApiCall(callId);
        }
      });
    });

    document.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const callId = btn.getAttribute("data-id");
        const call = apiCalls.find((c) => c.id === callId);
        if (call) {
          currentCopyCall = call;
          openCopyModal();
        }
      });
    });

    document.querySelectorAll(".modify-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const callId = btn.getAttribute("data-id");
        const call = apiCalls.find((c) => c.id === callId);
        if (call) {
          currentModifyCall = call;
          openModifyModal(call);
        }
      });
    });
  }

  function openCopyModal(): void {
    copyModal!.classList.add("visible");
  }

  function closeCopyModal(): void {
    copyModal!.classList.remove("visible");
    currentCopyCall = null;
  }

  function openModifyModal(call: ApiCall): void {
    modifyMethod!.value = call.method;
    modifyUrl!.value = call.url;
    modifyHeaders!.value = call.requestHeaders ? JSON.stringify(call.requestHeaders, null, 2) : "";
    modifyBody!.value = call.requestBody || "";
    modifyModal!.classList.add("visible");
  }

  function closeModifyModal(): void {
    modifyModal!.classList.remove("visible");
    currentModifyCall = null;
  }

  async function sendModifiedRequest(): Promise<void> {
    const method = modifyMethod!.value;
    const url = modifyUrl!.value.trim();
    const headersStr = modifyHeaders!.value.trim();
    const bodyStr = modifyBody!.value.trim();

    if (!url) {
      alert("Please enter a URL");
      return;
    }

    let headers = {};
    if (headersStr) {
      try {
        headers = JSON.parse(headersStr);
      } catch (e) {
        alert("Invalid headers JSON");
        return;
      }
    }

    let body = undefined;
    if (bodyStr && ["POST", "PUT", "PATCH"].includes(method)) {
      try {
        body = bodyStr;
      } catch (e) {
        alert("Invalid body JSON");
        return;
      }
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
      });

      const responseText = await response.text();
      const responseHeadersObj: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeadersObj[key] = value;
      });

      const modifiedCall = {
        id: `modified-${Date.now()}`,
        url,
        method,
        requestHeaders: headers,
        requestBody: body,
        responseHeaders: responseHeadersObj,
        responseBody: responseText,
        statusCode: response.status,
        timestamp: Date.now(),
        duration: undefined,
      };

      apiCalls.unshift(modifiedCall);
      selectApiCall(modifiedCall);
      renderApiCalls();
      closeModifyModal();
      showToast("Modified request sent successfully!");
    } catch (error) {
      console.error("Error sending modified request:", error);
      alert("Failed to send modified request: " + String(error));
    }
  }

  function generateCurlCode(call: ApiCall): string {
    let curl = `curl -X ${call.method} "${call.url}"`;

    if (call.requestHeaders) {
      Object.entries(call.requestHeaders).forEach(([key, value]) => {
        curl += ` \\\n  -H "${key}: ${value}"`;
      });
    }

    if (call.requestBody) {
      curl += ` \\\n  -d '${call.requestBody}'`;
    }

    return curl;
  }

  function generateFetchCode(call: ApiCall): string {
    const headers = call.requestHeaders ? JSON.stringify(call.requestHeaders, null, 2) : "{}";
    const body = call.requestBody ? `\n  body: ${call.requestBody},` : "";

    return `fetch("${call.url}", {
  method: "${call.method}",
  headers: ${headers},${body}
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;
  }

  function generateAxiosCode(call: ApiCall): string {
    const headers = call.requestHeaders ? JSON.stringify(call.requestHeaders, null, 2) : "{}";
    const body = call.requestBody ? `\n  data: ${call.requestBody},` : "";

    return `axios({
  method: "${call.method}",
  url: "${call.url}",
  headers: ${headers},${body}
})
  .then(response => console.log(response.data))
  .catch(error => console.error('Error:', error));`;
  }

  function showToast(message: string): void {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--primary-color);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  async function replayApiCall(callId: string): Promise<void> {
    const call = apiCalls.find((c) => c.id === callId);
    if (!call) return;

    try {
      const response = await fetch(call.url, {
        method: call.method,
        headers: call.requestHeaders || {},
        body: call.requestBody || undefined,
      });

      const responseText = await response.text();
      const replayResponseHeadersObj: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        replayResponseHeadersObj[key] = value;
      });

      const replayResponse = {
        id: `replay-${call.id}`,
        url: call.url,
        method: call.method,
        requestHeaders: call.requestHeaders,
        requestBody: call.requestBody,
        responseHeaders: replayResponseHeadersObj,
        responseBody: responseText,
        statusCode: response.status,
        timestamp: Date.now(),
        duration: undefined,
      };

      apiCalls.push(replayResponse);
      selectApiCall(replayResponse);
      renderApiCalls();
    } catch (error) {
      console.error("Error replaying API call:", error);
      alert("Failed to replay API call: " + String(error));
    }
  }

  function openRequestBuilderModal(): void {
    requestBuilderModal!.classList.add("visible");
  }

  function closeRequestBuilderModal(): void {
    requestBuilderModal!.classList.remove("visible");
  }

  async function sendRequest(): Promise<void> {
    const method = requestMethod!.value;
    const url = requestUrl!.value.trim();
    const headersStr = requestHeaders!.value.trim();
    const bodyStr = requestBody!.value.trim();

    if (!url) {
      alert("Please enter a URL");
      return;
    }

    let headers = {};
    if (headersStr) {
      try {
        headers = JSON.parse(headersStr);
      } catch (e) {
        alert("Invalid headers JSON");
        return;
      }
    }

    let body = undefined;
    if (bodyStr && ["POST", "PUT", "PATCH"].includes(method)) {
      try {
        body = bodyStr;
      } catch (e) {
        alert("Invalid body JSON");
        return;
      }
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
      });

      const responseText = await response.text();
      const newCallHeadersObj: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        newCallHeadersObj[key] = value;
      });

      const newCall = {
        id: `manual-${Date.now()}`,
        url,
        method,
        requestHeaders: headers,
        requestBody: body,
        responseHeaders: newCallHeadersObj,
        responseBody: responseText,
        statusCode: response.status,
        timestamp: Date.now(),
        duration: undefined,
      };

      apiCalls.unshift(newCall);
      selectApiCall(newCall);
      renderApiCalls();
      closeRequestBuilderModal();
      showToast("Request sent successfully!");
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Failed to send request: " + String(error));
    }
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

    const formatBody = (body: string | undefined): string => {
      if (!body) return "";
      try {
        const parsed = JSON.parse(body);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        return body;
      }
    };

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
          call.requestHeaders && Object.keys(call.requestHeaders).length > 0
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
          <div class="code-block"><pre>${formatBody(call.requestBody)}</pre></div>
        </div>
      `
          : ""
      }

      <div class="detail-section">
        <h3>Response Headers</h3>
        ${
          call.responseHeaders && Object.keys(call.responseHeaders).length > 0
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
          <div class="code-block"><pre>${formatBody(call.responseBody)}</pre></div>
        </div>
      `
          : ""
      }
    `;
  }

  async function loadApiCalls(tabId?: number): Promise<void> {
    try {
      const targetTabId = tabId || currentTabId;
      const response = await chrome.runtime.sendMessage({
        type: "GET_API_CALLS",
        tabId: targetTabId,
      });
      if (response) {
        apiCalls = response;
        renderApiCalls();
      }
    } catch (error) {
      console.error("Error loading API calls:", error);
    }
  }

  async function loadAllTabSessions(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ type: "GET_ALL_ACTIVE_SESSIONS" });
      if (response) {
        allTabSessions = response;
      }
    } catch (error) {
      console.error("Error loading all tab sessions:", error);
    }
  }

  async function loadUrlHistory(): Promise<void> {
    try {
      const result = await chrome.storage.local.get("spectrion_url_history");
      urlHistory = (result.spectrion_url_history as UrlHistory[]) || [];
      currentHistoryIndex = urlHistory.length - 1;
      updateUrlDisplay();
      updateUrlNavButtons();
    } catch (error) {
      console.error("Error loading URL history:", error);
    }
  }

  async function loadPresets(): Promise<void> {
    try {
      const result = await chrome.storage.local.get("spectrion_request_presets");
      requestPresets = (result.spectrion_request_presets as RequestPreset[]) || [];
      renderPresets();
    } catch (error) {
      console.error("Error loading presets:", error);
    }
  }

  async function savePreset(): Promise<void> {
    const name = prompt("Enter a name for this preset:");
    if (!name) return;

    const preset: RequestPreset = {
      id: `preset-${Date.now()}`,
      name,
      method: requestMethod!.value,
      url: requestUrl!.value.trim(),
      headers: requestHeaders!.value.trim(),
      body: requestBody!.value.trim(),
      createdAt: Date.now(),
    };

    if (!preset.url) {
      alert("Please enter a URL before saving as preset");
      return;
    }

    requestPresets.push(preset);
    await chrome.storage.local.set({ spectrion_request_presets: requestPresets });
    renderPresets();
    showToast("Preset saved successfully!");
  }

  function loadPreset(preset: RequestPreset): void {
    requestMethod!.value = preset.method;
    requestUrl!.value = preset.url;
    requestHeaders!.value = preset.headers;
    requestBody!.value = preset.body;
  }

  async function deletePreset(id: string): Promise<void> {
    if (!confirm("Are you sure you want to delete this preset?")) return;

    requestPresets = requestPresets.filter((p) => p.id !== id);
    await chrome.storage.local.set({ spectrion_request_presets: requestPresets });
    renderPresets();
    showToast("Preset deleted successfully!");
  }

  function renderPresets(): void {
    if (!presetsList) return;

    if (requestPresets.length === 0) {
      presetsList.innerHTML = '<div class="empty-presets">No presets saved yet</div>';
      return;
    }

    presetsList.innerHTML = requestPresets
      .map(
        (preset) => `
        <div class="preset-item">
          <div class="preset-info">
            <div class="preset-name">${preset.name}</div>
            <div class="preset-details">
              <span class="preset-method ${preset.method}">${preset.method}</span>
              <span class="preset-url">${preset.url}</span>
            </div>
          </div>
          <div class="preset-actions">
            <button class="btn-icon small preset-load" data-id="${preset.id}" title="Load preset">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12l5 5l5-5" />
                <path d="M12 1v16" />
              </svg>
            </button>
            <button class="btn-icon small preset-delete" data-id="${preset.id}" title="Delete preset">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      `
      )
      .join("");

    document.querySelectorAll(".preset-load").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const preset = requestPresets.find((p) => p.id === id);
        if (preset) loadPreset(preset);
      });
    });

    document.querySelectorAll(".preset-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (id) deletePreset(id);
      });
    });
  }

  function saveUrlHistory(): void {
    chrome.storage.local.set({ spectrion_url_history: urlHistory });
  }

  function addToUrlHistory(tabInfo: any): void {
    const newEntry: UrlHistory = {
      tabId: tabInfo.tabId,
      url: tabInfo.url,
      title: tabInfo.title || tabInfo.url,
      timestamp: Date.now(),
    };

    urlHistory.push(newEntry);

    if (urlHistory.length > maxHistorySize) {
      urlHistory = urlHistory.slice(-maxHistorySize);
    }

    currentHistoryIndex = urlHistory.length - 1;
    saveUrlHistory();
    updateUrlDisplay();
    updateUrlNavButtons();
  }

  function updateUrlDisplay(): void {
    if (currentHistoryIndex >= 0 && currentHistoryIndex < urlHistory.length) {
      const current = urlHistory[currentHistoryIndex];
      urlText!.textContent = showUrlInsteadOfTitle ? current.url : current.title;
      urlText!.title = showUrlInsteadOfTitle ? current.title : current.url;
    } else {
      urlText!.textContent = "No URL selected";
    }
    renderUrlDropdown();
  }

  function toggleUrlDisplay(): void {
    showUrlInsteadOfTitle = !showUrlInsteadOfTitle;
    chrome.storage.local.set({ spectrion_show_url: showUrlInsteadOfTitle });
    updateUrlDisplay();
    renderUrlDropdown();
  }

  function toggleUrlDropdown(): void {
    isDropdownOpen = !isDropdownOpen;
    if (isDropdownOpen) {
      urlDropdown?.classList.add("visible");
    } else {
      urlDropdown?.classList.remove("visible");
    }
  }

  function closeUrlDropdown(): void {
    isDropdownOpen = false;
    urlDropdown?.classList.remove("visible");
  }

  function renderUrlDropdown(): void {
    if (!urlDropdownList) return;

    urlDropdownList.innerHTML = "";

    if (urlHistory.length === 0) {
      urlDropdownList.innerHTML =
        '<div class="url-dropdown-item" style="color: var(--text-tertiary); cursor: default;">No URL history</div>';
      return;
    }

    const reversedHistory = [...urlHistory].reverse();

    reversedHistory.forEach((entry, index) => {
      const actualIndex = urlHistory.length - 1 - index;
      const item = document.createElement("div");
      item.className = "url-dropdown-item";
      if (actualIndex === currentHistoryIndex) {
        item.classList.add("active");
      }
      item.textContent = showUrlInsteadOfTitle ? entry.url : entry.title || entry.url;
      item.title = showUrlInsteadOfTitle ? entry.title || entry.url : entry.url;
      item.addEventListener("click", () => {
        currentHistoryIndex = actualIndex;
        const urlInfo = urlHistory[currentHistoryIndex];
        if (urlInfo && urlInfo.tabId) {
          currentTabId = urlInfo.tabId;
          loadApiCalls(urlInfo.tabId);
        }
        updateUrlDisplay();
        updateUrlNavButtons();
        closeUrlDropdown();
      });
      urlDropdownList.appendChild(item);
    });
  }

  function selectUrlByIndex(index: number): void {
    if (index >= 0 && index < urlHistory.length) {
      currentHistoryIndex = index;
      const urlInfo = urlHistory[index];
      if (urlInfo && urlInfo.tabId) {
        currentTabId = urlInfo.tabId;
        loadApiCalls(urlInfo.tabId);
      }
      updateUrlDisplay();
      updateUrlNavButtons();
      closeUrlDropdown();
    }
  }

  function updateUrlNavButtons(): void {
    if (prevUrlBtn && nextUrlBtn) {
      (prevUrlBtn as HTMLButtonElement).disabled = currentHistoryIndex <= 0;
      (nextUrlBtn as HTMLButtonElement).disabled = currentHistoryIndex >= urlHistory.length - 1;
    }
  }

  function navigateUrlHistory(direction: -1 | 1): void {
    const newIndex = currentHistoryIndex + direction;
    if (newIndex >= 0 && newIndex < urlHistory.length) {
      currentHistoryIndex = newIndex;
      updateUrlDisplay();
      updateUrlNavButtons();

      const entry = urlHistory[currentHistoryIndex];
      if (entry.tabId) {
        currentTabId = entry.tabId;
        loadApiCalls(entry.tabId);
      }
    }
  }

  function toggleDarkMode(): void {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle("dark-mode", isDarkMode);

    const sunIcon = darkModeToggle?.querySelector(".sun-icon") as HTMLElement;
    const moonIcon = darkModeToggle?.querySelector(".moon-icon") as HTMLElement;

    if (sunIcon && moonIcon) {
      sunIcon.style.display = isDarkMode ? "none" : "block";
      moonIcon.style.display = isDarkMode ? "block" : "none";
    }

    chrome.storage.local.set({ spectrion_dark_mode: isDarkMode });
  }

  function loadDarkModePreference(): void {
    chrome.storage.local.get("spectrion_dark_mode", (result) => {
      if (result.spectrion_dark_mode) {
        isDarkMode = true;
        document.body.classList.add("dark-mode");

        const sunIcon = darkModeToggle?.querySelector(".sun-icon") as HTMLElement;
        const moonIcon = darkModeToggle?.querySelector(".moon-icon") as HTMLElement;

        if (sunIcon && moonIcon) {
          sunIcon.style.display = "none";
          moonIcon.style.display = "block";
        }
      }
    });
  }

  function loadSettings(): void {
    chrome.storage.local.get(
      ["spectrion_max_history_size", "spectrion_full_info_mode"],
      (result) => {
        if (result.spectrion_max_history_size) {
          maxHistorySize = result.spectrion_max_history_size as number;
          maxHistorySizeInput!.value = maxHistorySize.toString();
        }
        if (result.spectrion_full_info_mode) {
          fullInfoModeInput!.checked = true;
          updateFullInfoModeIndicator(true);
        } else {
          updateFullInfoModeIndicator(false);
        }
      }
    );
  }

  function updateFullInfoModeIndicator(enabled: boolean): void {
    console.log("updateFullInfoModeIndicator called with:", enabled);
    const statusIndicator = document.getElementById("fullInfoModeStatus");
    const statusText = statusIndicator?.querySelector(".status-text");
    console.log("statusIndicator:", statusIndicator, "statusText:", statusText);
    if (statusIndicator && statusText) {
      if (enabled) {
        statusIndicator.classList.add("active");
        statusText.textContent = "Full Info Mode";
        statusIndicator.setAttribute("title", "Full Information Mode is ON");
        console.log("Set to active mode");
      } else {
        statusIndicator.classList.remove("active");
        statusText.textContent = "Reduced Mode";
        statusIndicator.setAttribute("title", "Full Information Mode is OFF");
        console.log("Set to reduced mode");
      }
    } else {
      console.error("Could not find status indicator or text element");
    }
  }

  function saveSettings(): void {
    const newSize = parseInt(maxHistorySizeInput!.value);
    if (isNaN(newSize) || newSize < 1 || newSize > 50) {
      alert("Please enter a valid number between 1 and 50");
      return;
    }

    maxHistorySize = newSize;
    const fullInfoEnabled = fullInfoModeInput!.checked;

    console.log("Saving settings:", { maxHistorySize, fullInfoEnabled });

    chrome.storage.local.set(
      { spectrion_max_history_size: maxHistorySize, spectrion_full_info_mode: fullInfoEnabled },
      async () => {
        closeSettingsModal();

        try {
          console.log("Sending SET_FULL_INFO_MODE message:", fullInfoEnabled);
          await chrome.runtime.sendMessage({
            type: "SET_FULL_INFO_MODE",
            enabled: fullInfoEnabled,
          });
          console.log("SET_FULL_INFO_MODE message sent successfully");
        } catch (e) {
          console.error("Failed to set full info mode:", e);
        }

        updateFullInfoModeIndicator(fullInfoEnabled);

        if (fullInfoEnabled) {
          alert(
            "Settings saved successfully!\n\nNote: Please reload the page to capture new API calls with full information (headers and bodies)."
          );
        } else {
          alert("Settings saved successfully!");
        }
      }
    );
  }

  function openSettingsModal(): void {
    settingsModal!.classList.add("visible");
  }

  function closeSettingsModal(): void {
    settingsModal!.classList.remove("visible");
  }

  settingsModal?.addEventListener("click", (e) => {
    if (e.target === settingsModal) {
      closeSettingsModal();
    }
  });

  copyModal?.addEventListener("click", (e) => {
    if (e.target === copyModal) {
      closeCopyModal();
    }
  });

  closeCopyBtn?.addEventListener("click", closeCopyModal);

  copyCurlBtn?.addEventListener("click", () => {
    if (currentCopyCall) {
      const curlCode = generateCurlCode(currentCopyCall);
      navigator.clipboard.writeText(curlCode).then(() => {
        showToast("Copied as curl!");
        closeCopyModal();
      });
    }
  });

  copyFetchBtn?.addEventListener("click", () => {
    if (currentCopyCall) {
      const fetchCode = generateFetchCode(currentCopyCall);
      navigator.clipboard.writeText(fetchCode).then(() => {
        showToast("Copied as fetch!");
        closeCopyModal();
      });
    }
  });

  copyAxiosBtn?.addEventListener("click", () => {
    if (currentCopyCall) {
      const axiosCode = generateAxiosCode(currentCopyCall);
      navigator.clipboard.writeText(axiosCode).then(() => {
        showToast("Copied as axios!");
        closeCopyModal();
      });
    }
  });

  modifyModal?.addEventListener("click", (e) => {
    if (e.target === modifyModal) {
      closeModifyModal();
    }
  });

  closeModifyBtn?.addEventListener("click", closeModifyModal);
  cancelModifyBtn?.addEventListener("click", closeModifyModal);
  sendModifiedBtn?.addEventListener("click", () => {
    sendModifiedRequest();
  });

  requestBuilderBtn?.addEventListener("click", openRequestBuilderModal);
  closeRequestBuilderBtn?.addEventListener("click", closeRequestBuilderModal);
  cancelRequestBtn?.addEventListener("click", closeRequestBuilderModal);
  savePresetBtn?.addEventListener("click", () => {
    savePreset();
  });

  sendRequestBtn?.addEventListener("click", () => {
    sendRequest();
  });

  requestBuilderModal?.addEventListener("click", (e) => {
    if (e.target === requestBuilderModal) {
      closeRequestBuilderModal();
    }
  });

  async function getCurrentTabInfo(): Promise<any> {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabIdStr = urlParams.get("tabId");
      if (tabIdStr) {
        currentTabId = parseInt(tabIdStr);
        const response = await chrome.runtime.sendMessage({
          type: "GET_TAB_INFO",
          tabId: currentTabId,
        });
        if (response) {
          addToUrlHistory(response);
          return response;
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting current tab info:", error);
      return null;
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

  refreshBtn?.addEventListener("click", () => {
    loadApiCalls();
    loadAllTabSessions();
  });
  exportBtn?.addEventListener("click", exportApiCalls);
  clearBtn?.addEventListener("click", async () => {
    if (confirm("Are you sure you want to clear all API calls?")) {
      await chrome.runtime.sendMessage({ type: "CLEAR_SESSIONS" });
      apiCalls = [];
      selectedCall = null;
      urlHistory = [];
      currentHistoryIndex = -1;
      allTabSessions = [];
      renderApiCalls();
      renderApiDetails();
      updateUrlDisplay();
      updateUrlNavButtons();
      renderUrlDropdown();
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
  darkModeToggle?.addEventListener("click", toggleDarkMode);
  prevUrlBtn?.addEventListener("click", () => navigateUrlHistory(-1));
  nextUrlBtn?.addEventListener("click", () => navigateUrlHistory(1));
  settingsBtn?.addEventListener("click", openSettingsModal);
  closeSettingsBtn?.addEventListener("click", closeSettingsModal);
  saveSettingsBtn?.addEventListener("click", saveSettings);
  currentUrl?.addEventListener("click", toggleUrlDropdown);
  urlToggleBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleUrlDisplay();
  });

  loadDarkModePreference();
  loadSettings();

  chrome.storage.local.get("spectrion_show_url", (result) => {
    if (result.spectrion_show_url !== undefined) {
      showUrlInsteadOfTitle = result.spectrion_show_url as boolean;
    }
  });

  document.addEventListener("click", (e) => {
    if (isDropdownOpen && !urlSelector?.contains(e.target as Node)) {
      closeUrlDropdown();
    }
  });

  loadUrlHistory();
  loadPresets();
  loadAllTabSessions();
  getCurrentTabInfo().then((tabInfo) => {
    if (tabInfo) {
      loadApiCalls(tabInfo.tabId);
    }
  });

  setInterval(loadApiCalls, 3000);
});
