import { ApiMonitor } from "../src/core/apiMonitor";
import { ApiCall } from "../src/core/sessionManager";

describe("ApiMonitor Integration", () => {
  let apiMonitor: ApiMonitor;

  beforeEach(() => {
    apiMonitor = new ApiMonitor();
  });

  describe("Multiple Listeners", () => {
    it("should notify all registered listeners", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();

      apiMonitor.onApiCall(listener1);
      apiMonitor.onApiCall(listener2);
      apiMonitor.onApiCall(listener3);

      const apiCall: ApiCall = {
        id: "test-1",
        url: "https://api.example.com/data",
        method: "GET",
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
      };

      apiMonitor.notifyApiCall(apiCall);

      expect(listener1).toHaveBeenCalledWith(apiCall);
      expect(listener2).toHaveBeenCalledWith(apiCall);
      expect(listener3).toHaveBeenCalledWith(apiCall);
    });

    it("should notify remaining listeners after one is removed", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      apiMonitor.onApiCall(listener1);
      apiMonitor.onApiCall(listener2);

      const apiCall: ApiCall = {
        id: "test-1",
        url: "https://api.example.com/data",
        method: "GET",
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
      };

      apiMonitor.offApiCall(listener1);
      apiMonitor.notifyApiCall(apiCall);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith(apiCall);
    });
  });

  describe("Header Parsing", () => {
    it("should handle empty Headers object", () => {
      const headers = new Headers();
      const result = (apiMonitor as any).getHeadersAsObject(headers);
      expect(result).toEqual({});
    });

    it("should handle empty header string", () => {
      const headerString = "";
      const result = (apiMonitor as any).getHeadersAsObject(headerString);
      expect(result).toEqual({});
    });

    it("should handle malformed header string", () => {
      const headerString = "Content-Type application/json\r\nInvalidLine";
      const result = (apiMonitor as any).getHeadersAsObject(headerString);
      expect(result["InvalidLine"]).toBeUndefined();
    });

    it("should handle headers with duplicate keys", () => {
      const headers = new Headers();
      headers.append("Set-Cookie", "session=abc");
      headers.append("Set-Cookie", "token=xyz");

      const result = (apiMonitor as any).getHeadersAsObject(headers);
      expect(result["set-cookie"]).toBeDefined();
    });
  });

  describe("ID Generation", () => {
    it("should generate IDs with consistent format", () => {
      const id = (apiMonitor as any).generateId();
      expect(id).toMatch(/^api-\d+-[a-z0-9]{9}$/);
    });

    it("should generate unique IDs in rapid succession", () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add((apiMonitor as any).generateId());
      }
      expect(ids.size).toBe(100);
    });
  });
});
