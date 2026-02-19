import { sessionManager } from "../sessionManager";
import { storageManager } from "../storageManager";

chrome.runtime.onInstalled.addListener(async () => {
  console.log("Spectrion extension installed");
  console.log("WebRequest API is active");
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  (async () => {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (tab.url && tab.url.startsWith("http")) {
        const url = new URL(tab.url);
        let session = sessionManager.getSession(activeInfo.tabId);
        if (!session) {
          const storedSession = await storageManager.getActiveSession(activeInfo.tabId);
          if (storedSession) {
            session = storedSession;
            sessionManager.restoreSession(activeInfo.tabId, session);
          } else {
            session = sessionManager.startSession(activeInfo.tabId, url.hostname);
            await storageManager.saveActiveSession(activeInfo.tabId, session);
          }
        }
      }
    } catch (error) {
      console.error("Error handling tab activation:", error);
    }
  })();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
    (async () => {
      try {
        const url = new URL(tab.url!);
        // Start a new session on page load/reload
        const session = sessionManager.startSession(tabId, url.hostname);
        await storageManager.saveActiveSession(tabId, session);
      } catch (error) {
        console.error("Error handling tab update:", error);
      }
    })();
  }
});

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    (async () => {
      try {
        if (details.type === "xmlhttprequest" && details.tabId !== -1) {
          console.log("WebRequest captured:", details.url);

          const tabId = details.tabId;
          let session = sessionManager.getSession(tabId);

          if (!session) {
            const storedSession = await storageManager.getActiveSession(tabId);
            if (storedSession) {
              session = storedSession;
              sessionManager.restoreSession(tabId, session);
            } else {
              // Try to create session if tab info available
              try {
                const tab = await chrome.tabs.get(tabId);
                if (tab.url && tab.url.startsWith("http")) {
                  const url = new URL(tab.url);
                  session = sessionManager.startSession(tabId, url.hostname);
                  await storageManager.saveActiveSession(tabId, session);
                }
              } catch (e) {
                // Tab might be closed or inaccessible
              }
            }
          }

          if (session) {
            console.log("Adding API call to session:", session.id);
            sessionManager.addApiCall(tabId, {
              id: `req-${details.requestId}`,
              url: details.url,
              method: details.method || "GET",
              requestHeaders: {},
              requestBody: details.requestBody ? details.requestBody.raw?.toString() : undefined,
              responseHeaders: {},
              statusCode: 0,
              timestamp: Date.now(),
            });
            await storageManager.saveActiveSession(tabId, session);
          } else {
            console.log("No active session found for tab:", tabId);
          }
        }
      } catch (error) {
        console.error("Error in onBeforeRequest:", error);
      }
    })();
    return undefined;
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

chrome.webRequest.onCompleted.addListener(
  (details) => {
    (async () => {
      try {
        if (details.type === "xmlhttprequest" && details.tabId !== -1) {
          const tabId = details.tabId;
          let session = sessionManager.getSession(tabId);
          if (!session) {
            const storedSession = await storageManager.getActiveSession(tabId);
            if (storedSession) {
              session = storedSession;
              sessionManager.restoreSession(tabId, session);
            }
          }

          if (session) {
            const apiCall = session.apiCalls.find((call) => call.id === `req-${details.requestId}`);
            if (apiCall) {
              apiCall.responseHeaders = details.responseHeaders
                ? details.responseHeaders.reduce(
                    (acc, header) => {
                      if (header.value !== undefined) {
                        acc[header.name] = header.value;
                      }
                      return acc;
                    },
                    {} as Record<string, string>
                  )
                : {};
              apiCall.statusCode = details.statusCode;
              apiCall.duration = details.timeStamp - apiCall.timestamp;
              await storageManager.saveActiveSession(tabId, session);
            }
          }
        }
      } catch (error) {
        console.error("Error in onCompleted:", error);
      }
    })();
  },
  { urls: ["<all_urls>"] }
);

chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    (async () => {
      try {
        if (details.type === "xmlhttprequest" && details.tabId !== -1) {
          const tabId = details.tabId;
          let session = sessionManager.getSession(tabId);
          if (!session) {
            const storedSession = await storageManager.getActiveSession(tabId);
            if (storedSession) {
              session = storedSession;
              sessionManager.restoreSession(tabId, session);
            }
          }

          if (session) {
            const apiCall = session.apiCalls.find((call) => call.id === `req-${details.requestId}`);
            if (apiCall) {
              apiCall.statusCode = 0;
              apiCall.duration = details.timeStamp - apiCall.timestamp;
              await storageManager.saveActiveSession(tabId, session);
            }
          }
        }
      } catch (error) {
        console.error("Error in onErrorOccurred:", error);
      }
    })();
  },
  { urls: ["<all_urls>"] }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CONTENT_API_CALLS") {
    // This seems unused or legacy, but let's keep it safe.
    // Assuming content script sends this for XHR interception if enabled.
    // Content script runs in tab, so sender.tab.id is available.
    const tabId = sender.tab?.id;
    if (tabId) {
      storageManager.getActiveSession(tabId).then((session) => {
        if (session) {
          sessionManager.restoreSession(tabId, session);
          message.apiCalls.forEach((apiCall: any) => {
            sessionManager.addApiCall(tabId, apiCall);
          });
          storageManager.saveActiveSession(tabId, session);
        }
      });
    }
    return true;
  }

  if (message.type === "GET_API_CALLS") {
    const tabId = message.tabId;
    if (tabId) {
      storageManager.getActiveSession(tabId).then((session) => {
        sendResponse(session?.apiCalls || []);
      });
    } else {
      // Fallback or error
      sendResponse([]);
    }
    return true;
  }

  if (message.type === "GET_SESSION_INFO") {
    const tabId = message.tabId;
    if (tabId) {
      storageManager.getActiveSession(tabId).then((session) => {
        sendResponse(session);
      });
    } else {
      sendResponse(null);
    }
    return true;
  }

  if (message.type === "GET_ALL_SESSIONS") {
    storageManager.getAllSessions().then((sessions) => {
      sendResponse(sessions);
    });
    return true;
  }

  if (message.type === "SAVE_SESSION") {
    storageManager.saveSession(message.session).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === "CLEAR_SESSIONS") {
    storageManager.clearAllSessions().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Periodic save not strictly needed if we save on every update, but good for safety
setInterval(async () => {
  // We can't iterate all active sessions easily from storage without keeping track of IDs.
  // But since we save on every update, this might be redundant.
  // Let's remove it to avoid complexity, or just leave it empty.
}, 5000);
