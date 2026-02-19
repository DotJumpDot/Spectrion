document.addEventListener("DOMContentLoaded", () => {
  const openAnalysisBtn = document.getElementById("openAnalysisBtn") as HTMLButtonElement;
  const clearBtn = document.getElementById("clearBtn") as HTMLButtonElement;
  const statusElement = document.getElementById("status") as HTMLElement;
  const apiCallsCountElement = document.getElementById("apiCallsCount") as HTMLElement;
  const sessionTimeElement = document.getElementById("sessionTime") as HTMLElement;
  const errorMessage = document.getElementById("errorMessage") as HTMLElement;

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

  async function loadStats(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      if (!activeTab || !activeTab.id) {
        return;
      }

      const tabId = activeTab.id;

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
      // showError('Failed to load statistics'); // Suppress to avoid spam
    }
  }

  openAnalysisBtn.addEventListener("click", async () => {
    try {
      updateStatus();
      
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      let analysisUrl = chrome.runtime.getURL("analysis.html");
      
      if (activeTab && activeTab.id) {
        analysisUrl += `?tabId=${activeTab.id}`;
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

  loadStats();
  setInterval(loadStats, 2000);
});
