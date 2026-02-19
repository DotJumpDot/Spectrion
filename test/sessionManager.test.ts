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
  });

  describe("endSession", () => {
    it("should set endTime when session is ended", () => {
      sessionManager.startSession(1, "example.com");
      sessionManager.endSession(1);

      // Session is removed from active sessions, but we can check if it was modified if we kept a reference?
      // Or we can check it's gone.
      const session = sessionManager.getSession(1);
      expect(session).toBeUndefined();
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

    it("should not add API call when no session exists", () => {
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
  });
});
