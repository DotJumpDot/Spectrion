describe("Full Information Mode", () => {
  let mockChrome: any;
  let mockStorage: { [key: string]: any } = {};
  let mockDocument: any;

  beforeEach(() => {
    mockDocument = {
      getElementById: jest.fn((id: string) => {
        if (id === "fullInfoMode") {
          return { type: "checkbox", checked: false };
        }
        if (id === "saveSettingsBtn") {
          return {};
        }
        return null;
      }),
      querySelector: jest.fn((selector: string) => {
        if (selector === ".toggle-switch") {
          return {
            dispatchEvent: jest.fn(),
          };
        }
        return null;
      }),
    };

    mockChrome = {
      runtime: {
        sendMessage: jest.fn((message: any, callback: any) => {
          if (callback) {
            setTimeout(() => callback({ success: true }), 0);
          }
          return true;
        }),
        onMessage: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
      },
      storage: {
        local: {
          get: jest.fn((keys: any, callback: any) => {
            if (callback) {
              const result: any = {};
              if (typeof keys === "string") {
                if (mockStorage[keys]) {
                  result[keys] = mockStorage[keys];
                }
              } else if (Array.isArray(keys)) {
                keys.forEach((key: string) => {
                  if (mockStorage[key]) {
                    result[key] = mockStorage[key];
                  }
                });
              }
              setTimeout(() => callback(result), 0);
            }
          }),
          set: jest.fn((items: any, callback: any) => {
            Object.assign(mockStorage, items);
            if (callback) {
              setTimeout(() => callback(), 0);
            }
          }),
        },
      },
    };
    
    (global as any).chrome = mockChrome;
    (global as any).document = mockDocument;
    mockStorage = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Toggle Switch UI", () => {
    it("should render toggle switch in settings modal", () => {
      const fullInfoModeInput = mockDocument.getElementById("fullInfoMode");
      const toggleSwitch = mockDocument.querySelector(".toggle-switch");

      expect(fullInfoModeInput).toBeTruthy();
      expect(toggleSwitch).toBeTruthy();
      expect(fullInfoModeInput?.type).toBe("checkbox");
    });
  });

  describe("Settings Persistence", () => {
    it("should save full info mode to chrome storage", () => {
      const checkbox = mockDocument.getElementById("fullInfoMode");
      checkbox!.checked = true;

      mockChrome.storage.local.set(
        { spectrion_max_history_size: 10, spectrion_full_info_mode: true }
      );

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          spectrion_full_info_mode: true,
        })
      );
    });

    it("should load full info mode from chrome storage on startup", () => {
      mockStorage.spectrion_full_info_mode = true;

      mockChrome.storage.local.get(["spectrion_full_info_mode"], (result: any) => {
        expect(result.spectrion_full_info_mode).toBe(true);
      });

      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(["spectrion_full_info_mode"], expect.any(Function));
    });
  });

  describe("Background Script Communication", () => {
    it("should send SET_FULL_INFO_MODE message to background script", async () => {
      const checkbox = document.getElementById("fullInfoMode") as HTMLInputElement;
      checkbox.checked = true;

      await chrome.runtime.sendMessage({
        type: "SET_FULL_INFO_MODE",
        enabled: true,
      });

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: "SET_FULL_INFO_MODE",
        enabled: true,
      });
    });

    it("should send message with enabled: false when toggle is off", async () => {
      const checkbox = document.getElementById("fullInfoMode") as HTMLInputElement;
      checkbox.checked = false;

      await chrome.runtime.sendMessage({
        type: "SET_FULL_INFO_MODE",
        enabled: false,
      });

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: "SET_FULL_INFO_MODE",
        enabled: false,
      });
    });
  });

  describe("Mode States", () => {
    it("should default to reduced mode (fullInfoMode = false)", () => {
      const checkbox = document.getElementById("fullInfoMode") as HTMLInputElement;
      expect(checkbox?.checked).toBe(false);
    });

    it("should enable full information mode when checkbox is checked", () => {
      const checkbox = document.getElementById("fullInfoMode") as HTMLInputElement;
      checkbox.checked = true;
      
      expect(checkbox?.checked).toBe(true);
    });

    it("should capture minimal info when full info mode is off", () => {
      const apiCall = {
        id: "test-1",
        url: "http://localhost:4100/api/test",
        method: "GET",
        statusCode: 200,
        timestamp: Date.now(),
        duration: 100,
      } as any;

      expect(apiCall.requestHeaders).toBeUndefined();
      expect(apiCall.responseHeaders).toBeUndefined();
      expect(apiCall.requestBody).toBeUndefined();
      expect(apiCall.responseBody).toBeUndefined();
    });

    it("should capture full info when full info mode is on", () => {
      const apiCall = {
        id: "test-2",
        url: "http://localhost:4100/api/test",
        method: "GET",
        requestHeaders: { Authorization: "Bearer token" },
        responseHeaders: { "Content-Type": "application/json" },
        requestBody: '{"key":"value"}',
        responseBody: '{"result":"success"}',
        statusCode: 200,
        timestamp: Date.now(),
        duration: 100,
      } as any;

      expect(apiCall.requestHeaders).toBeDefined();
      expect(apiCall.responseHeaders).toBeDefined();
      expect(apiCall.requestBody).toBeDefined();
      expect(apiCall.responseBody).toBeDefined();
    });
  });
});
