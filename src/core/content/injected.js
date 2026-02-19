(function () {
  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  window.spectrionApiCalls = [];
  let fullInfoMode = false;

  async function checkFullInfoMode() {
    try {
      const response = await chrome.runtime.sendMessage({ type: "GET_FULL_INFO_MODE" });
      fullInfoMode = response?.enabled || false;
    } catch (e) {
      fullInfoMode = false;
    }
  }

  checkFullInfoMode();
  setInterval(checkFullInfoMode, 2000);

  function headersToPlainObject(headers) {
    const result = {};
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else if (typeof headers === "object" && headers !== null) {
      Object.assign(result, headers);
    }
    return result;
  }

  function stringifyBody(body) {
    if (body === null || body === undefined) {
      return undefined;
    }
    if (typeof body === "string") {
      return body;
    }
    try {
      return JSON.stringify(body, null, 2);
    } catch (e) {
      return String(body);
    }
  }

  async function cloneResponse(response) {
    try {
      const clone = response.clone();
      const text = await clone.text();
      try {
        return JSON.stringify(JSON.parse(text), null, 2);
      } catch (e) {
        return text;
      }
    } catch (e) {
      return undefined;
    }
  }

  window.fetch = async function (...args) {
    const startTime = Date.now();
    const [url, options = {}] = args;

    try {
      const response = await originalFetch.apply(this, args);
      const duration = Date.now() - startTime;

      const responseBody = fullInfoMode ? await cloneResponse(response) : undefined;

      const apiCall = {
        id: "fetch-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
        url: url.toString(),
        method: options.method || "GET",
        requestHeaders: fullInfoMode ? headersToPlainObject(options.headers) : undefined,
        requestBody: fullInfoMode ? stringifyBody(options.body) : undefined,
        responseHeaders: fullInfoMode ? headersToPlainObject(response.headers) : undefined,
        responseBody: responseBody,
        statusCode: response.status,
        timestamp: startTime,
        duration,
      };

      window.spectrionApiCalls.push(apiCall);

      return response;
    } catch (error) {
      const apiCall = {
        id: "fetch-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
        url: url.toString(),
        method: options.method || "GET",
        requestHeaders: fullInfoMode ? headersToPlainObject(options.headers) : undefined,
        requestBody: fullInfoMode ? stringifyBody(options.body) : undefined,
        responseHeaders: fullInfoMode ? {} : undefined,
        statusCode: 0,
        timestamp: startTime,
        duration: Date.now() - startTime,
      };

      window.spectrionApiCalls.push(apiCall);
      throw error;
    }
  };

  XMLHttpRequest.prototype.open = function (method, url) {
    this._spectrionMethod = method;
    this._spectrionUrl = url;
    this._spectrionStartTime = Date.now();
    return originalXHROpen.apply(this, [method, url]);
  };

  XMLHttpRequest.prototype.send = function (body) {
    const xhr = this;

    const addLoadListener = function () {
      xhr.addEventListener("load", function () {
        const responseHeadersStr = xhr.getAllResponseHeaders();
        const responseHeaders = {};

        if (fullInfoMode && responseHeadersStr) {
          const lines = responseHeadersStr.split("\r\n");
          lines.forEach(function (line) {
            const parts = line.split(": ");
            if (parts.length === 2) {
              responseHeaders[parts[0]] = parts[1];
            }
          });
        }

        let responseBody = undefined;
        if (fullInfoMode) {
          responseBody = xhr.responseText;
          try {
            if (
              xhr.getResponseHeader("content-type") &&
              xhr.getResponseHeader("content-type").includes("application/json")
            ) {
              const parsed = JSON.parse(xhr.responseText);
              responseBody = JSON.stringify(parsed, null, 2);
            }
          } catch (e) {
            responseBody = xhr.responseText;
          }
        }

        const apiCall = {
          id: "xhr-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
          url: xhr._spectrionUrl,
          method: xhr._spectrionMethod,
          requestHeaders: fullInfoMode ? {} : undefined,
          requestBody: fullInfoMode ? stringifyBody(body) : undefined,
          responseHeaders: fullInfoMode ? responseHeaders : undefined,
          responseBody: responseBody,
          statusCode: xhr.status,
          timestamp: xhr._spectrionStartTime,
          duration: Date.now() - xhr._spectrionStartTime,
        };

        window.spectrionApiCalls.push(apiCall);
      });
    };

    addLoadListener();
    return originalXHRSend.apply(this, [body]);
  };
})();
