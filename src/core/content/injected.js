(function() {
  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  window.spectrionApiCalls = [];

  window.fetch = async function(...args) {
    const startTime = Date.now();
    const [url, options = {}] = args;

    try {
      const response = await originalFetch.apply(this, args);
      const duration = Date.now() - startTime;

      const apiCall = {
        id: 'fetch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        url: url.toString(),
        method: options.method || 'GET',
        requestHeaders: options.headers || {},
        requestBody: options.body,
        responseHeaders: {},
        statusCode: response.status,
        timestamp: startTime,
        duration,
      };

      window.spectrionApiCalls.push(apiCall);

      return response;
    } catch (error) {
      const apiCall = {
        id: 'fetch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        url: url.toString(),
        method: options.method || 'GET',
        requestHeaders: options.headers || {},
        requestBody: options.body,
        responseHeaders: {},
        statusCode: 0,
        timestamp: startTime,
        duration: Date.now() - startTime,
      };

      window.spectrionApiCalls.push(apiCall);
      throw error;
    }
  };

  XMLHttpRequest.prototype.open = function(method, url) {
    this._spectrionMethod = method;
    this._spectrionUrl = url;
    this._spectrionStartTime = Date.now();
    return originalXHROpen.apply(this, [method, url]);
  };

  XMLHttpRequest.prototype.send = function(body) {
    const xhr = this;

    const addLoadListener = function() {
      xhr.addEventListener('load', function() {
        const apiCall = {
          id: 'xhr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          url: xhr._spectrionUrl,
          method: xhr._spectrionMethod,
          requestHeaders: {},
          requestBody: body,
          responseHeaders: {},
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
