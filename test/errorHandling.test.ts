import { StorageManager } from "../src/core/storageManager";
import { SessionManager, ApiCall } from "../src/core/sessionManager";

describe("Error Handling", () => {
  describe("StorageManager Error Handling", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should handle storage errors gracefully", async () => {
      (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
        callback({ spectrion_sessions: null });
      });

      const storageManager = new StorageManager();

      const sessions = await storageManager.getAllSessions();

      expect(sessions).toEqual([]);
    });

    it("should log errors when saving sessions fails", async () => {
      (chrome.storage.local.set as jest.Mock).mockImplementation((data, callback) => {
        callback(new Error("Storage error"));
      });

      const storageManager = new StorageManager();
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const session = {
        id: "test-1",
        startTime: Date.now(),
        apiCalls: [],
        domain: "example.com",
      };

      await expect(storageManager.saveSession(session)).rejects.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("SessionManager Error Handling", () => {
    it("should handle adding API calls when no session exists", () => {
      const sessionManager = new SessionManager();

      const apiCall: ApiCall = {
        id: "test-1",
        url: "https://api.example.com/data",
        method: "GET",
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
      };

      expect(() => sessionManager.addApiCall(apiCall)).not.toThrow();
    });
  });

  describe("Background Script Error Handling", () => {
    it("should handle tab activation errors", async () => {
      (chrome.tabs.get as jest.Mock).mockImplementation(() => {
        throw new Error("Tab not found");
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const background = require("../src/background");

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle message errors gracefully", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      chrome.runtime.sendMessage({
        type: "INVALID_TYPE",
      });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
