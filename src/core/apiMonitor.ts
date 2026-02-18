import { ApiCall } from "./sessionManager";

export class ApiMonitor {
  private listeners: Set<(call: ApiCall) => void> = new Set();

  onApiCall(listener: (call: ApiCall) => void): void {
    this.listeners.add(listener);
  }

  offApiCall(listener: (call: ApiCall) => void): void {
    this.listeners.delete(listener);
  }

  notifyApiCall(call: ApiCall): void {
    this.listeners.forEach((listener) => listener(call));
  }

  interceptFetch(): void {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const [url, options = {}] = args;
      const startTime = Date.now();

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        const apiCall: ApiCall = {
          id: this.generateId(),
          url: url.toString(),
          method: options.method || "GET",
          requestHeaders: (options.headers as Record<string, string>) || {},
          requestBody: options.body as string,
          responseHeaders: this.getHeadersAsObject(response.headers),
          statusCode: response.status,
          timestamp: startTime,
          duration,
        };

        this.notifyApiCall(apiCall);

        return response;
      } catch (error) {
        const apiCall: ApiCall = {
          id: this.generateId(),
          url: url.toString(),
          method: options.method || "GET",
          requestHeaders: (options.headers as Record<string, string>) || {},
          requestBody: options.body as string,
          responseHeaders: {},
          statusCode: 0,
          timestamp: startTime,
          duration: Date.now() - startTime,
        };

        this.notifyApiCall(apiCall);
        throw error;
      }
    };
  }

  interceptXHR(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      (this as any)._method = method;
      (this as any)._url = url;
      (this as any)._startTime = Date.now();
      return originalOpen.apply(this, [method, url] as any);
    };

    XMLHttpRequest.prototype.send = function (body) {
      const xhr = this as any;
      const apiMonitorInstance = (window as any).spectrionApiMonitor || new ApiMonitor();
      (window as any).spectrionApiMonitor = apiMonitorInstance;

      const addEventListener = this.addEventListener;
      const originalAddEventListener = addEventListener.bind(this);

      (this as any).addEventListener = function (type: string, listener: EventListener) {
        if (type === "load") {
          const wrappedListener = function (event: Event) {
            const apiCall: ApiCall = {
              id: apiMonitorInstance.generateId(),
              url: xhr._url,
              method: xhr._method,
              requestHeaders: {},
              requestBody: body as string,
              responseHeaders: apiMonitorInstance.getHeadersAsObject(xhr.getAllResponseHeaders()),
              statusCode: xhr.status,
              timestamp: xhr._startTime,
              duration: Date.now() - xhr._startTime,
            };

            apiMonitorInstance.notifyApiCall(apiCall);
            return listener.call(xhr, event);
          };
          return originalAddEventListener.call(this, type, wrappedListener);
        }
        return originalAddEventListener.call(this, type, listener);
      };

      return originalSend.apply(this, [body] as any);
    };
  }

  private getHeadersAsObject(headers: Headers | string): Record<string, string> {
    const result: Record<string, string> = {};

    if (typeof headers === "string") {
      headers.split("\r\n").forEach((line) => {
        const parts = line.split(": ");
        if (parts.length === 2) {
          result[parts[0]] = parts[1];
        }
      });
    } else {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    }

    return result;
  }

  private generateId(): string {
    return `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const apiMonitor = new ApiMonitor();
