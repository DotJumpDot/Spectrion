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
          <div class="code-block"><pre>${formatBody(call.requestBody)}</pre></div>
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
    chrome.storage.local.get("spectrion_max_history_size", (result) => {
      if (result.spectrion_max_history_size) {
        maxHistorySize = result.spectrion_max_history_size as number;
        maxHistorySizeInput!.value = maxHistorySize.toString();
      }
    });
  }

  function saveSettings(): void {
    const newSize = parseInt(maxHistorySizeInput!.value);
    if (isNaN(newSize) || newSize < 1 || newSize > 50) {
      alert("Please enter a valid number between 1 and 50");
      return;
    }

    maxHistorySize = newSize;
    chrome.storage.local.set({ spectrion_max_history_size: maxHistorySize }, () => {
      closeSettingsModal();
      alert("Settings saved successfully!");
    });
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
  loadAllTabSessions();
  getCurrentTabInfo().then((tabInfo) => {
    if (tabInfo) {
      loadApiCalls(tabInfo.tabId);
    }
  });
  setInterval(loadApiCalls, 3000);
});
