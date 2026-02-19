import { SessionManager } from "../src/core/sessionManager";
import { ApiCall } from "../src/core/storageManager";

describe("SessionManager", () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  describe("getSession", () => {
    it("should return undefined when no session is active", () => {
      expect(sessionManager.getSession(1)).toBeUndefined();
    });

    it("should return current session when one exists", () => {
      const session = sessionManager.startSession(1, "example.com");
      expect(sessionManager.getSession(1)).toBe(session);
    });

    it("should return correct session for multiple tabs", () => {
      const session1 = sessionManager.startSession(1, "site1.com");
      const session2 = sessionManager.startSession(2, "site2.com");

      expect(sessionManager.getSession(1)).toBe(session1);
      expect(sessionManager.getSession(2)).toBe(session2);
    });

    it("should return undefined for non-existent tab", () => {
      sessionManager.startSession(1, "example.com");
      expect(sessionManager.getSession(999)).toBeUndefined();
    });
  });

  describe("startSession", () => {
    it("should create a new session with required properties", () => {
      const session = sessionManager.startSession(1, "example.com");

      expect(session).toHaveProperty("id");
      expect(session).toHaveProperty("startTime");
      expect(session).toHaveProperty("apiCalls");
      expect(session).toHaveProperty("domain", "example.com");
      expect(session.apiCalls).toEqual([]);
    });

    it("should generate unique session IDs", () => {
      const session1 = sessionManager.startSession(1, "example.com");
      const session2 = sessionManager.startSession(2, "example.com");

      expect(session1.id).not.toBe(session2.id);
    });

    it("should set correct domain", () => {
      const session = sessionManager.startSession(1, "subdomain.example.com");
      expect(session.domain).toBe("subdomain.example.com");
    });

    it("should handle numeric tab IDs", () => {
      const session = sessionManager.startSession(12345, "example.com");
      expect(sessionManager.getSession(12345)).toBeDefined();
    });

    it("should set startTime to current time", () => {
      const beforeTime = Date.now();
      const session = sessionManager.startSession(1, "example.com");
      const afterTime = Date.now();

      expect(session.startTime).toBeGreaterThanOrEqual(beforeTime);
      expect(session.startTime).toBeLessThanOrEqual(afterTime);
    });
  });

  describe("endSession", () => {
    it("should remove session from active sessions", () => {
      sessionManager.startSession(1, "example.com");
      sessionManager.endSession(1);

      const session = sessionManager.getSession(1);
      expect(session).toBeUndefined();
    });

    it("should not throw when ending non-existent session", () => {
      expect(() => sessionManager.endSession(999)).not.toThrow();
    });

    it("should allow multiple sessions to be ended", () => {
      sessionManager.startSession(1, "site1.com");
      sessionManager.startSession(2, "site2.com");
      sessionManager.startSession(3, "site3.com");

      sessionManager.endSession(1);
      sessionManager.endSession(2);

      expect(sessionManager.getSession(1)).toBeUndefined();
      expect(sessionManager.getSession(2)).toBeUndefined();
      expect(sessionManager.getSession(3)).toBeDefined();
    });
  });

  describe("addApiCall", () => {
    it("should add API call to current session", () => {
      const session = sessionManager.startSession(1, "example.com");

      const apiCall: ApiCall = {
        id: "test-1",
        url: "https://api.example.com/data",
        method: "GET",
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
      };

      sessionManager.addApiCall(1, apiCall);

      expect(session.apiCalls).toHaveLength(1);
      expect(session.apiCalls[0]).toBe(apiCall);
    });

    it("should not throw when no session exists", () => {
      const apiCall: ApiCall = {
        id: "test-1",
        url: "https://api.example.com/data",
        method: "GET",
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
      };

      expect(() => sessionManager.addApiCall(1, apiCall)).not.toThrow();
    });

    it("should maintain order of API calls", () => {
      const session = sessionManager.startSession(1, "example.com");

      const call1: ApiCall = {
        id: "call-1",
        url: "https://api.example.com/1",
        method: "GET",
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: 1000,
      };

      const call2: ApiCall = {
        id: "call-2",
        url: "https://api.example.com/2",
        method: "POST",
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 201,
        timestamp: 2000,
      };

      const call3: ApiCall = {
        id: "call-3",
        url: "https://api.example.com/3",
        method: "PUT",
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: 3000,
      };

      sessionManager.addApiCall(1, call1);
      sessionManager.addApiCall(1, call2);
      sessionManager.addApiCall(1, call3);

      expect(session.apiCalls).toHaveLength(3);
      expect(session.apiCalls[0]).toBe(call1);
      expect(session.apiCalls[1]).toBe(call2);
      expect(session.apiCalls[2]).toBe(call3);
    });

    it("should add multiple API calls to session", () => {
      const session = sessionManager.startSession(1, "example.com");

      for (let i = 0; i < 10; i++) {
        const apiCall: ApiCall = {
          id: `call-${i}`,
          url: `https://api.example.com/data/${i}`,
          method: "GET",
          requestHeaders: {},
          responseHeaders: {},
          statusCode: 200,
          timestamp: Date.now(),
        };
        sessionManager.addApiCall(1, apiCall);
      }

      expect(session.apiCalls).toHaveLength(10);
    });

    it("should handle API calls with different HTTP methods", () => {
      const session = sessionManager.startSession(1, "example.com");

      const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
      methods.forEach((method, index) => {
        const apiCall: ApiCall = {
          id: `call-${index}`,
          url: `https://api.example.com/${index}`,
          method: method as any,
          requestHeaders: {},
          responseHeaders: {},
          statusCode: 200,
          timestamp: Date.now(),
        };
        sessionManager.addApiCall(1, apiCall);
      });

      expect(session.apiCalls).toHaveLength(5);
      session.apiCalls.forEach((call, index) => {
        expect(call.method).toBe(methods[index]);
      });
    });
  });

  describe("Session Isolation", () => {
    it("should maintain separate sessions for different tabs", () => {
      const session1 = sessionManager.startSession(1, "example.com");
      const session2 = sessionManager.startSession(2, "another.com");

      const apiCall1: ApiCall = {
        id: "call-1",
        url: "https://api.example.com/1",
        method: "GET",
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
      };

      const apiCall2: ApiCall = {
        id: "call-2",
        url: "https://api.another.com/2",
        method: "POST",
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 201,
        timestamp: Date.now(),
      };

      sessionManager.addApiCall(1, apiCall1);
      sessionManager.addApiCall(2, apiCall2);

      expect(session1.apiCalls).toHaveLength(1);
      expect(session1.apiCalls[0]).toBe(apiCall1);
      expect(session2.apiCalls).toHaveLength(1);
      expect(session2.apiCalls[0]).toBe(apiCall2);
    });

    it("should not mix API calls between sessions", () => {
      const session1 = sessionManager.startSession(1, "example.com");
      sessionManager.startSession(2, "another.com");

      const apiCall: ApiCall = {
        id: "call-1",
        url: "https://api.example.com/1",
        method: "GET",
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
      };

      sessionManager.addApiCall(1, apiCall);

      const session2 = sessionManager.getSession(2);
      expect(session2?.apiCalls).toHaveLength(0);
    });

    it("should handle sessions with different domains", () => {
      const session1 = sessionManager.startSession(1, "site1.com");
      const session2 = sessionManager.startSession(2, "site2.com");
      const session3 = sessionManager.startSession(3, "site3.com");

      expect(session1.domain).toBe("site1.com");
      expect(session2.domain).toBe("site2.com");
      expect(session3.domain).toBe("site3.com");
    });
  });

  describe("restoreSession", () => {
    it("should restore a session from storage", () => {
      const session: any = {
        id: "session-restored",
        startTime: Date.now(),
        apiCalls: [],
        domain: "restored.com"
      };

      sessionManager.restoreSession(3, session);
      const retrieved = sessionManager.getSession(3);

      expect(retrieved).toBe(session);
      expect(retrieved?.domain).toBe("restored.com");
    });

    it("should restore session with existing API calls", () => {
      const existingApiCalls: ApiCall[] = [
        {
          id: "call-1",
          url: "https://api.example.com/data",
          method: "GET",
          requestHeaders: {},
          responseHeaders: {},
          statusCode: 200,
          timestamp: Date.now(),
        }
      ];

      const session: any = {
        id: "session-with-calls",
        startTime: Date.now(),
        apiCalls: existingApiCalls,
        domain: "restored.com"
      };

      sessionManager.restoreSession(4, session);
      const retrieved = sessionManager.getSession(4);

      expect(retrieved?.apiCalls).toHaveLength(1);
      expect(retrieved?.apiCalls[0].id).toBe("call-1");
    });

    it("should overwrite existing session when restoring", () => {
      sessionManager.startSession(1, "original.com");

      const restoredSession: any = {
        id: "session-restored",
        startTime: Date.now(),
        apiCalls: [],
        domain: "restored.com"
      };

      sessionManager.restoreSession(1, restoredSession);
      const retrieved = sessionManager.getSession(1);

      expect(retrieved?.domain).toBe("restored.com");
      expect(retrieved?.id).toBe("session-restored");
    });
  });

  describe("Session lifecycle", () => {
    it("should handle complete session lifecycle", () => {
      expect(sessionManager.getSession(1)).toBeUndefined();

      const session = sessionManager.startSession(1, "example.com");
      expect(sessionManager.getSession(1)).toBeDefined();

      const apiCall: ApiCall = {
        id: "call-1",
        url: "https://api.example.com/data",
        method: "GET",
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
      };
      sessionManager.addApiCall(1, apiCall);
      expect(session.apiCalls).toHaveLength(1);

      sessionManager.endSession(1);
      expect(sessionManager.getSession(1)).toBeUndefined();
    });

    it("should handle rapid session start and end", () => {
      for (let i = 0; i < 10; i++) {
        const tabId = i + 1;
        sessionManager.startSession(tabId, `site${i}.com`);
        sessionManager.endSession(tabId);
      }

      for (let i = 0; i < 10; i++) {
        const tabId = i + 1;
        expect(sessionManager.getSession(tabId)).toBeUndefined();
      }
    });
  });

  describe("Edge cases", () => {
    it("should handle large number of API calls in session", () => {
      const session = sessionManager.startSession(1, "example.com");

      const largeNumberOfCalls = 1000;
      for (let i = 0; i < largeNumberOfCalls; i++) {
        const apiCall: ApiCall = {
          id: `call-${i}`,
          url: `https://api.example.com/data/${i}`,
          method: "GET",
          requestHeaders: {},
          responseHeaders: {},
          statusCode: 200,
          timestamp: Date.now(),
        };
        sessionManager.addApiCall(1, apiCall);
      }

      expect(session.apiCalls).toHaveLength(largeNumberOfCalls);
    });

    it("should handle sessions with subdomains", () => {
      const session1 = sessionManager.startSession(1, "api.example.com");
      const session2 = sessionManager.startSession(2, "admin.example.com");
      const session3 = sessionManager.startSession(3, "blog.example.com");

      expect(session1.domain).toBe("api.example.com");
      expect(session2.domain).toBe("admin.example.com");
      expect(session3.domain).toBe("blog.example.com");
    });

    it("should handle session with localhost", () => {
      const session = sessionManager.startSession(1, "localhost:3000");
      expect(session.domain).toBe("localhost:3000");
    });

    it("should handle session with IP address", () => {
      const session = sessionManager.startSession(1, "192.168.1.1");
      expect(session.domain).toBe("192.168.1.1");
    });

    it("should handle API calls with same URL but different methods", () => {
      const session = sessionManager.startSession(1, "example.com");

      const url = "https://api.example.com/data";
      const methods = ["GET", "POST", "PUT", "DELETE"];

      methods.forEach((method, index) => {
        const apiCall: ApiCall = {
          id: `call-${index}`,
          url: url,
          method: method as any,
          requestHeaders: {},
          responseHeaders: {},
          statusCode: 200,
          timestamp: Date.now(),
        };
        sessionManager.addApiCall(1, apiCall);
      });

      expect(session.apiCalls).toHaveLength(4);
      session.apiCalls.forEach((call) => {
        expect(call.url).toBe(url);
      });
    });

    it("should handle API calls with various status codes", () => {
      const session = sessionManager.startSession(1, "example.com");

      const statusCodes = [200, 201, 204, 301, 302, 400, 401, 403, 404, 500, 502, 503];

      statusCodes.forEach((statusCode, index) => {
        const apiCall: ApiCall = {
          id: `call-${index}`,
          url: `https://api.example.com/status/${statusCode}`,
          method: "GET",
          requestHeaders: {},
          responseHeaders: {},
          statusCode: statusCode,
          timestamp: Date.now(),
        };
        sessionManager.addApiCall(1, apiCall);
      });

      expect(session.apiCalls).toHaveLength(statusCodes.length);
      session.apiCalls.forEach((call, index) => {
        expect(call.statusCode).toBe(statusCodes[index]);
      });
    });
  });

  describe("Session state management", () => {
    it("should allow replacing session for same tab", () => {
      const session1 = sessionManager.startSession(1, "site1.com");
      const session2 = sessionManager.startSession(1, "site2.com");

      expect(sessionManager.getSession(1)).toBe(session2);
      expect(session1.domain).toBe("site1.com");
      expect(session2.domain).toBe("site2.com");
    });

    it("should maintain independent session states", () => {
      const session1 = sessionManager.startSession(1, "site1.com");
      const session2 = sessionManager.startSession(2, "site2.com");

      const apiCall: ApiCall = {
        id: "call-1",
        url: "https://api.example.com/data",
        method: "GET",
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
      };

      sessionManager.addApiCall(1, apiCall);

      expect(session1.apiCalls).toHaveLength(1);
      expect(session2.apiCalls).toHaveLength(0);
    });
  });
});
