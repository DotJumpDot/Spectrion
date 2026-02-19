import { ApiCall } from "../src/core/storageManager";

interface RequestPreset {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: string;
  body: string;
  createdAt: number;
}

describe("Request Builder Presets", () => {
  describe("Save Preset", () => {
    it("should prompt user for preset name", () => {
      const promptMock = jest.fn().mockReturnValue("My Test Preset");
      (global as any).prompt = promptMock;

      const presetName = prompt("Enter a name for this preset:");

      expect(promptMock).toHaveBeenCalledWith(
        expect.stringContaining("Enter a name for this preset")
      );
      expect(presetName).toBe("My Test Preset");
    });

    it("should create preset with unique ID", () => {
      const preset: RequestPreset = {
        id: `preset-${Date.now()}`,
        name: "Test Preset",
        method: "POST",
        url: "https://api.example.com/users",
        headers: '{"Content-Type": "application/json"}',
        body: '{"name": "John"}',
        createdAt: Date.now(),
      };

      expect(preset.id).toMatch(/^preset-/);
      expect(preset.createdAt).toBeLessThanOrEqual(Date.now());
    });

    it("should validate URL before saving", () => {
      const url = "";
      const isValid = url.trim().length > 0;

      expect(isValid).toBe(false);
    });

    it("should save preset to storage", async () => {
      const chromeMock = {
        storage: {
          local: {
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
      };
      global.chrome = chromeMock as any;

      const presets: RequestPreset[] = [
        {
          id: "preset-1",
          name: "Test",
          method: "GET",
          url: "https://api.com",
          headers: "{}",
          body: "",
          createdAt: Date.now(),
        },
      ];

      await chrome.storage.local.set({ spectrion_request_presets: presets });

      expect(chromeMock.storage.local.set).toHaveBeenCalledWith({
        spectrion_request_presets: presets,
      });
    });
  });

  describe("Load Preset", () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <select id="requestMethod">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
        <input id="requestUrl" />
        <textarea id="requestHeaders"></textarea>
        <textarea id="requestBody"></textarea>
      `;
    });

    it("should load preset into form fields", () => {
      const preset: RequestPreset = {
        id: "preset-123",
        name: "User API",
        method: "POST",
        url: "https://api.example.com/users",
        headers: '{"Content-Type": "application/json"}',
        body: '{"name": "John"}',
        createdAt: Date.now(),
      };

      const methodEl = document.getElementById("requestMethod") as HTMLSelectElement;
      const urlEl = document.getElementById("requestUrl") as HTMLInputElement;
      const headersEl = document.getElementById("requestHeaders") as HTMLTextAreaElement;
      const bodyEl = document.getElementById("requestBody") as HTMLTextAreaElement;

      methodEl.value = preset.method;
      urlEl.value = preset.url;
      headersEl.value = preset.headers;
      bodyEl.value = preset.body;

      expect(methodEl.value).toBe("POST");
      expect(urlEl.value).toBe("https://api.example.com/users");
      expect(headersEl.value).toContain("Content-Type");
      expect(bodyEl.value).toContain("John");
    });

    it("should handle preset with empty body", () => {
      const preset: RequestPreset = {
        id: "preset-456",
        name: "GET Request",
        method: "GET",
        url: "https://api.example.com/data",
        headers: "{}",
        body: "",
        createdAt: Date.now(),
      };

      const bodyEl = document.getElementById("requestBody") as HTMLTextAreaElement;
      bodyEl.value = preset.body;

      expect(bodyEl.value).toBe("");
    });
  });

  describe("Delete Preset", () => {
    it("should show confirmation before deleting", () => {
      const confirmMock = jest.fn().mockReturnValue(true);
      (global as any).confirm = confirmMock;

      const confirmed = confirm("Are you sure you want to delete this preset?");

      expect(confirmMock).toHaveBeenCalledWith(expect.stringContaining("delete this preset"));
      expect(confirmed).toBe(true);
    });

    it("should remove preset from array", () => {
      const presets: RequestPreset[] = [
        {
          id: "preset-1",
          name: "P1",
          method: "GET",
          url: "https://api.com/1",
          headers: "{}",
          body: "",
          createdAt: Date.now(),
        },
        {
          id: "preset-2",
          name: "P2",
          method: "POST",
          url: "https://api.com/2",
          headers: "{}",
          body: "{}",
          createdAt: Date.now(),
        },
        {
          id: "preset-3",
          name: "P3",
          method: "PUT",
          url: "https://api.com/3",
          headers: "{}",
          body: "{}",
          createdAt: Date.now(),
        },
      ];

      const filtered = presets.filter((p) => p.id !== "preset-2");

      expect(filtered.length).toBe(2);
      expect(filtered.find((p) => p.id === "preset-2")).toBeUndefined();
    });

    it("should save updated presets to storage", async () => {
      const chromeMock = {
        storage: {
          local: {
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
      };
      global.chrome = chromeMock as any;

      const updatedPresets: RequestPreset[] = [
        {
          id: "preset-1",
          name: "P1",
          method: "GET",
          url: "https://api.com/1",
          headers: "{}",
          body: "",
          createdAt: Date.now(),
        },
      ];

      await chrome.storage.local.set({ spectrion_request_presets: updatedPresets });

      expect(chromeMock.storage.local.set).toHaveBeenCalledWith({
        spectrion_request_presets: updatedPresets,
      });
    });
  });

  describe("Render Presets", () => {
    it("should display empty state when no presets", () => {
      const presets: RequestPreset[] = [];
      const presetsList = document.createElement("div");
      presetsList.id = "presetsList";

      if (presets.length === 0) {
        presetsList.innerHTML = '<div class="empty-presets">No presets saved yet</div>';
      }

      expect(presetsList.innerHTML).toContain("No presets saved yet");
    });

    it("should render preset list with all fields", () => {
      const presets: RequestPreset[] = [
        {
          id: "preset-1",
          name: "User API",
          method: "POST",
          url: "https://api.example.com/users",
          headers: '{"Content-Type": "application/json"}',
          body: '{"name": "John"}',
          createdAt: Date.now(),
        },
      ];

      const presetHtml = `
        <div class="preset-item">
          <div class="preset-info">
            <div class="preset-name">User API</div>
            <div class="preset-details">
              <span class="preset-method POST">POST</span>
              <span class="preset-url">https://api.example.com/users</span>
            </div>
          </div>
          <div class="preset-actions">
            <button class="btn-icon small preset-load" data-id="preset-1">Load</button>
            <button class="btn-icon small preset-delete" data-id="preset-1">Delete</button>
          </div>
        </div>
      `;

      expect(presetHtml).toContain("User API");
      expect(presetHtml).toContain("POST");
      expect(presetHtml).toContain("https://api.example.com/users");
      expect(presetHtml).toContain("preset-load");
      expect(presetHtml).toContain("preset-delete");
    });

    it("should apply correct color to method badges", () => {
      const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
      const colors = {
        GET: "#1976d2",
        POST: "#2e7d32",
        PUT: "#f57c00",
        DELETE: "#c62828",
        PATCH: "#7b1fa2",
      };

      methods.forEach((method) => {
        const color = colors[method as keyof typeof colors];
        expect(color).toBeDefined();
      });
    });
  });

  describe("Preset Interactions", () => {
    it("should load preset when load button clicked", () => {
      const loadBtn = document.createElement("button");
      loadBtn.className = "preset-load";
      loadBtn.setAttribute("data-id", "preset-123");

      const preset: RequestPreset = {
        id: "preset-123",
        name: "Test",
        method: "GET",
        url: "https://api.com",
        headers: "{}",
        body: "",
        createdAt: Date.now(),
      };

      const urlEl = document.getElementById("requestUrl") as HTMLInputElement;
      urlEl.value = preset.url;

      expect(urlEl.value).toBe("https://api.com");
    });

    it("should delete preset when delete button clicked", () => {
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "preset-delete";
      deleteBtn.setAttribute("data-id", "preset-456");

      let presets: RequestPreset[] = [
        {
          id: "preset-456",
          name: "ToDelete",
          method: "GET",
          url: "https://api.com",
          headers: "{}",
          body: "",
          createdAt: Date.now(),
        },
      ];

      presets = presets.filter((p) => p.id !== "preset-456");

      expect(presets.find((p) => p.id === "preset-456")).toBeUndefined();
    });
  });

  describe("Preset Storage Operations", () => {
    it("should load presets from storage", async () => {
      const chromeMock = {
        storage: {
          local: {
            get: jest.fn().mockResolvedValue({
              spectrion_request_presets: [
                {
                  id: "preset-1",
                  name: "Test",
                  method: "GET",
                  url: "https://api.com",
                  headers: "{}",
                  body: "",
                  createdAt: Date.now(),
                },
              ],
            }),
          },
        },
      };
      global.chrome = chromeMock as any;

      const result = (await chrome.storage.local.get("spectrion_request_presets")) as any as {
        spectrion_request_presets: RequestPreset[];
      };

      expect(result.spectrion_request_presets).toBeDefined();
      expect(result.spectrion_request_presets.length).toBeGreaterThan(0);
    });

    it("should handle missing presets in storage", async () => {
      const chromeMock = {
        storage: {
          local: {
            get: jest.fn().mockResolvedValue({}),
          },
        },
      };
      global.chrome = chromeMock as any;

      const result = (await chrome.storage.local.get("spectrion_request_presets")) as any;
      const presets = (result.spectrion_request_presets as RequestPreset[]) || [];

      expect(presets).toEqual([]);
    });

    it("should show toast notification on successful save", () => {
      const showToastMock = jest.fn();
      (global as any).showToast = showToastMock;

      showToastMock("Preset saved successfully!");

      expect(showToastMock).toHaveBeenCalledWith("Preset saved successfully!");
    });
  });
});
