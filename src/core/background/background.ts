import { sessionManager } from "../sessionManager";
import { storageManager } from "../storageManager";

chrome.runtime.onInstalled.addListener(async () => {
  console.log("Spectrion extension installed");
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && tab.url.startsWith("http")) {
      const url = new URL(tab.url);
      const session = sessionManager.startSession(url.hostname);
      await storageManager.setCurrentSession(session);
    }
  } catch (error) {
    console.error("Error handling tab activation:", error);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
    try {
      const url = new URL(tab.url);
      const session = sessionManager.startSession(url.hostname);
      await storageManager.setCurrentSession(session);
    } catch (error) {
      console.error("Error handling tab update:", error);
    }
  }
});

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      if (details.type === "xmlhttprequest") {
        storageManager.getCurrentSession().then((session) => {
          if (session) {
            sessionManager.addApiCall({
              id: `req-${details.requestId}`,
              url: details.url,
              method: details.method || "GET",
              requestHeaders: {},
              requestBody: details.requestBody ? details.requestBody.raw?.toString() : undefined,
              responseHeaders: {},
              statusCode: 0,
              timestamp: Date.now(),
            });
            storageManager.setCurrentSession(session);
          }
        });
      }
    } catch (error) {
      console.error("Error in onBeforeRequest:", error);
    }
    return undefined;
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

chrome.webRequest.onCompleted.addListener(
  (details) => {
    try {
      if (details.type === "xmlhttprequest") {
        storageManager.getCurrentSession().then((session) => {
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
              storageManager.setCurrentSession(session);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error in onCompleted:", error);
    }
  },
  { urls: ["<all_urls>"] }
);

chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    try {
      if (details.type === "xmlhttprequest") {
        storageManager.getCurrentSession().then((session) => {
          if (session) {
            const apiCall = session.apiCalls.find((call) => call.id === `req-${details.requestId}`);
            if (apiCall) {
              apiCall.statusCode = 0;
              apiCall.duration = details.timeStamp - apiCall.timestamp;
              storageManager.setCurrentSession(session);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error in onErrorOccurred:", error);
    }
  },
  { urls: ["<all_urls>"] }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CONTENT_API_CALLS") {
    storageManager.getCurrentSession().then((session) => {
      if (session) {
        message.apiCalls.forEach((apiCall: any) => {
          sessionManager.addApiCall(apiCall);
        });
        storageManager.setCurrentSession(session);
      }
    });
    return true;
  }

  if (message.type === "GET_API_CALLS") {
    storageManager.getCurrentSession().then((session) => {
      sendResponse(session?.apiCalls || []);
    });
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

setInterval(async () => {
  try {
    const session = await storageManager.getCurrentSession();
    if (session && session.apiCalls.length > 0) {
      await storageManager.updateSession(session);
    }
  } catch (error) {
    console.error("Error saving session:", error);
  }
}, 5000);
