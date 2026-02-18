import { StorageManager } from "../src/core/storageManager";
import { Session } from "../src/core/sessionManager";

describe("StorageManager", () => {
  let storageManager: StorageManager;
  let mockStorage: Record<string, any>;

  beforeEach(() => {
    storageManager = new StorageManager();
    mockStorage = {};

    (global as any).chrome.storage.local.get = jest.fn().mockImplementation((keys, callback) => {
      const result: any = {};
      keys.forEach((key: string) => {
        if (mockStorage[key] !== undefined) {
          result[key] = mockStorage[key];
        }
      });
      callback(result);
    });

    (global as any).chrome.storage.local.set = jest.fn().mockImplementation((data, callback) => {
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

      expect((global as any).chrome.storage.local.set).toHaveBeenCalled();
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

  describe("setCurrentSession", () => {
    it("should save current session to storage", async () => {
      const session: Session = {
        id: "session-1",
        startTime: Date.now(),
        apiCalls: [],
        domain: "example.com",
      };

      await storageManager.setCurrentSession(session);

      expect((global as any).chrome.storage.local.set).toHaveBeenCalledWith(
        { spectrion_current_session: session },
        expect.any(Function)
      );
    });
  });

  describe("clearAllSessions", () => {
    it("should clear all sessions from storage", async () => {
      await storageManager.clearAllSessions();

      expect((global as any).chrome.storage.local.set).toHaveBeenCalledWith(
        { spectrion_sessions: [] },
        expect.any(Function)
      );
      expect((global as any).chrome.storage.local.set).toHaveBeenCalledWith(
        { spectrion_current_session: null },
        expect.any(Function)
      );
    });
  });
});
