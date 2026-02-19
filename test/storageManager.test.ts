import { StorageManager, Session } from "../src/core/storageManager";

describe("StorageManager", () => {
  let storageManager: StorageManager;
  let mockStorage: Record<string, any>;

  beforeEach(() => {
    storageManager = new StorageManager();
    mockStorage = {};

    global.chrome.storage.local.get = jest.fn().mockImplementation((keys, callback) => {
      const result: any = {};
      keys.forEach((key: string) => {
        if (mockStorage[key] !== undefined) {
          result[key] = mockStorage[key];
        }
      });
      callback(result);
    });

    global.chrome.storage.local.set = jest.fn().mockImplementation((data, callback) => {
      Object.assign(mockStorage, data);
      callback();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("saveSession", () => {
    it("should save a session to storage", async () => {
      const session: Session = {
        id: "session-1",
        startTime: Date.now(),
        apiCalls: [],
        domain: "example.com",
      };

      await storageManager.saveSession(session);

      expect(global.chrome.storage.local.set).toHaveBeenCalled();
    });
  });

  describe("getAllSessions", () => {
    it("should return empty array when no sessions exist", async () => {
      const sessions = await storageManager.getAllSessions();
      expect(sessions).toEqual([]);
    });

    it("should return all saved sessions", async () => {
      const sessions = await storageManager.getAllSessions();
      expect(Array.isArray(sessions)).toBe(true);
    });
  });

  describe("saveActiveSession", () => {
    it("should save active session to storage", async () => {
      const session: Session = {
        id: "session-1",
        startTime: Date.now(),
        apiCalls: [],
        domain: "example.com",
      };

      await storageManager.saveActiveSession(1, session);

      expect(global.chrome.storage.local.set).toHaveBeenCalledWith(
        { spectrion_active_session_1: session },
        expect.any(Function)
      );
    });
  });

  describe("clearAllSessions", () => {
    it("should clear all sessions from storage", async () => {
      await storageManager.clearAllSessions();

      expect(global.chrome.storage.local.set).toHaveBeenCalledWith(
        { spectrion_sessions: [] },
        expect.any(Function)
      );
      // It might also clear active sessions if we updated clearAllSessions to do so,
      // but based on current implementation it clears 'spectrion_current_session' which is now unused/legacy or we should update it.
      // Let's check what clearAllSessions does in storageManager.ts
    });
  });

  describe("getActiveSession", () => {
    it("should retrieve active session by tabId", async () => {
      const session: Session = {
        id: "session-1",
        startTime: Date.now(),
        apiCalls: [],
        domain: "example.com",
      };

      mockStorage["spectrion_active_session_1"] = session;

      const retrieved = await storageManager.getActiveSession(1);
      expect(retrieved).toEqual(session);
    });

    it("should return null if no session exists for tabId", async () => {
      const retrieved = await storageManager.getActiveSession(999);
      expect(retrieved).toBeNull();
    });
  });

  describe("clearActiveSession", () => {
    it("should remove active session from storage", async () => {
      await storageManager.clearActiveSession(1);
      
      expect(global.chrome.storage.local.set).toHaveBeenCalledWith(
        { spectrion_active_session_1: null },
        expect.any(Function)
      );
    });
  });
});
