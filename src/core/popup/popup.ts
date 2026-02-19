interface TabInfo {
  id: number;
  url: string;
  title: string;
}

document.addEventListener("DOMContentLoaded", () => {
  const openAnalysisBtn = document.getElementById("openAnalysisBtn") as HTMLButtonElement;
  const clearBtn = document.getElementById("clearBtn") as HTMLButtonElement;
  const statusElement = document.getElementById("status") as HTMLElement;
  const apiCallsCountElement = document.getElementById("apiCallsCount") as HTMLElement;
  const sessionTimeElement = document.getElementById("sessionTime") as HTMLElement;
  const errorMessage = document.getElementById("errorMessage") as HTMLElement;
  const tabDropdown = document.getElementById("tabDropdown") as HTMLElement;
  const tabTrigger = document.getElementById("tabTrigger") as HTMLButtonElement;
  const tabValue = document.getElementById("tabValue") as HTMLElement;
  const tabMenu = document.getElementById("tabMenu") as HTMLElement;
  const tabList = document.getElementById("tabList") as HTMLElement;

  let selectedTabId: number | null = null;
  let isDropdownOpen = false;

  function showError(message: string): void {
    errorMessage.textContent = message;
    errorMessage.classList.add("visible");
    setTimeout(() => {
      errorMessage.classList.remove("visible");
    }, 5000);
  }

  function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function updateStatus(): void {
    statusElement.textContent = "Active";
    statusElement.style.background = "#e8f5e9";
    statusElement.style.color = "#2e7d32";
  }

  function toggleDropdown(): void {
    isDropdownOpen = !isDropdownOpen;
    if (isDropdownOpen) {
      tabDropdown.classList.add("open");
      tabMenu.classList.add("visible");
    } else {
      tabDropdown.classList.remove("open");
      tabMenu.classList.remove("visible");
    }
  }

  function closeDropdown(): void {
    isDropdownOpen = false;
    tabDropdown.classList.remove("open");
    tabMenu.classList.remove("visible");
  }

  function selectTab(tab: chrome.tabs.Tab): void {
    selectedTabId = tab.id!;
    if (tab.url) {
      const url = new URL(tab.url);
      tabValue.textContent = `${tab.title || url.hostname}`;
      tabValue.title = tab.url;
    }
    closeDropdown();
    loadStats();
  }

  async function loadTabs(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({}) as chrome.tabs.Tab[];
      const httpTabs = tabs.filter(tab => tab.url && tab.url.startsWith("http"));

      tabList.innerHTML = "";

      if (httpTabs.length === 0) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "dropdown-empty";
        emptyDiv.textContent = "No tabs with HTTP/HTTPS pages";
        tabList.appendChild(emptyDiv);
        tabValue.textContent = "No tabs available";
        return;
      }

      const activeTab = httpTabs.find(tab => tab.active);
      
      const orderedTabs = activeTab 
        ? [activeTab, ...httpTabs.filter(tab => tab.id !== activeTab.id)]
        : httpTabs;

      orderedTabs.forEach(tab => {
        const url = new URL(tab.url!);
        const item = document.createElement("div");
        item.className = "dropdown-item";
        if (activeTab && tab.id === activeTab.id) {
          item.classList.add("selected");
        }

        const iconDiv = document.createElement("div");
        iconDiv.className = "dropdown-item-icon";
        
        const textDiv = document.createElement("div");
        textDiv.className = "dropdown-item-text";
        textDiv.textContent = tab.title || url.hostname;
        
        const urlDiv = document.createElement("div");
        urlDiv.className = "dropdown-item-url";
        urlDiv.textContent = url.hostname;

        textDiv.appendChild(urlDiv);
        item.appendChild(iconDiv);
        item.appendChild(textDiv);

        item.addEventListener("click", () => selectTab(tab));
        tabList.appendChild(item);
      });

      if (activeTab && activeTab.id) {
        if (activeTab.url) {
          const url = new URL(activeTab.url);
          tabValue.textContent = activeTab.title || url.hostname;
          tabValue.title = activeTab.url;
        }
        selectedTabId = activeTab.id;
      }
    } catch (error) {
      console.error("Error loading tabs:", error);
    }
  }

  async function loadStats(): Promise<void> {
    try {
      if (!selectedTabId) {
        return;
      }

      const tabId = selectedTabId;

      const apiCalls = await chrome.runtime.sendMessage({ type: "GET_API_CALLS", tabId });
      if (apiCalls) {
        apiCallsCountElement.textContent = apiCalls.length.toString();
      } else {
        apiCallsCountElement.textContent = "0";
      }

      const session = await chrome.runtime.sendMessage({ type: "GET_SESSION_INFO", tabId });
      if (session) {
        const duration = Date.now() - session.startTime;
        sessionTimeElement.textContent = formatTime(duration);
      } else {
        sessionTimeElement.textContent = "00:00";
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  tabTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  document.addEventListener("click", (e) => {
    if (isDropdownOpen && !tabDropdown.contains(e.target as Node)) {
      closeDropdown();
    }
  });

  openAnalysisBtn.addEventListener("click", async () => {
    try {
      updateStatus();
      
      let analysisUrl = chrome.runtime.getURL("analysis.html");
      
      if (selectedTabId) {
        analysisUrl += `?tabId=${selectedTabId}`;
      }
      
      await chrome.tabs.create({ url: analysisUrl });
      window.close();
    } catch (error) {
      console.error("Error opening analysis tab:", error);
      showError("Failed to open analysis tab");
    }
  });

  clearBtn.addEventListener("click", async () => {
    try {
      const confirmed = confirm("Are you sure you want to clear all sessions?");
      if (confirmed) {
        await chrome.runtime.sendMessage({ type: "CLEAR_SESSIONS" });
        apiCallsCountElement.textContent = "0";
        sessionTimeElement.textContent = "--:--";
        showError("All sessions cleared");
      }
    } catch (error) {
      console.error("Error clearing sessions:", error);
      showError("Failed to clear sessions");
    }
  });

  loadTabs();
  loadStats();
  setInterval(loadStats, 2000);
});
