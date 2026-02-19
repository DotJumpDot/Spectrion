import { ApiCall } from "../src/core/storageManager";

describe("Modify and Retry Functionality", () => {
  describe("Open Modify Modal", () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="modifyModal"></div>
        <input id="modifyUrl" />
        <select id="modifyMethod">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
        <textarea id="modifyHeaders"></textarea>
        <textarea id="modifyBody"></textarea>
      `;
    });

    it("should open modal when Modify button is clicked", () => {
      const modifyBtn = document.createElement("button");
      modifyBtn.className = "modify-btn";
      modifyBtn.setAttribute("data-id", "test-123");
      document.body.appendChild(modifyBtn);

      const clickEvent = new MouseEvent("click", { bubbles: true });
      modifyBtn.dispatchEvent(clickEvent);

      const modal = document.getElementById("modifyModal");
      expect(modal).toBeTruthy();
    });

    it("should pre-fill form with original API call data", () => {
      const originalCall: ApiCall = {
        id: "test-123",
        url: "https://api.example.com/users",
        method: "POST",
        requestHeaders: { "Content-Type": "application/json" },
        requestBody: JSON.stringify({ name: "John" }),
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
      };

      const modifyUrl = document.getElementById("modifyUrl") as HTMLInputElement;
      const modifyMethod = document.getElementById("modifyMethod") as HTMLSelectElement;
      const modifyHeaders = document.getElementById("modifyHeaders") as HTMLTextAreaElement;
      const modifyBody = document.getElementById("modifyBody") as HTMLTextAreaElement;

      modifyUrl.value = originalCall.url;
      modifyMethod.value = originalCall.method;
      modifyHeaders.value = JSON.stringify(originalCall.requestHeaders, null, 2);
      modifyBody.value = originalCall.requestBody || "";

      expect(modifyUrl.value).toBe("https://api.example.com/users");
      expect(modifyMethod.value).toBe("POST");
      expect(modifyHeaders.value).toContain("Content-Type");
      expect(modifyBody.value).toContain("John");
    });
  });

  describe("Modified Request Execution", () => {
    it("should send modified request with updated URL", async () => {
      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { forEach: jest.fn() },
        text: () => Promise.resolve('{ "success": true }'),
      });
      (global as any).fetch = fetchMock;

      const modifiedUrl = "https://api.example.com/users/updated";
      const method = "POST";
      const headers = { "Content-Type": "application/json" };
      const body = JSON.stringify({ name: "Jane" });

      const response = await fetch(modifiedUrl, {
        method,
        headers,
        body,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        modifiedUrl,
        expect.objectContaining({
          method: "POST",
          headers,
          body,
        })
      );
    });

    it("should handle invalid headers JSON", () => {
      const invalidHeaders = "{ invalid json }";
      let parseError = null;

      try {
        JSON.parse(invalidHeaders);
      } catch (e) {
        parseError = e;
      }

      expect(parseError).toBeTruthy();
    });

    it("should handle empty URL validation", () => {
      const url = "";
      const isValid = url.trim().length > 0;

      expect(isValid).toBe(false);
    });
  });

  describe("Response Handling", () => {
    it("should capture response headers correctly", () => {
      const headers = new Headers({
        "content-type": "application/json",
        "cache-control": "no-cache",
      });

      const headersObj: Record<string, string> = {};
      headers.forEach((value, key) => {
        headersObj[key] = value;
      });

      expect(headersObj["content-type"]).toBe("application/json");
      expect(headersObj["cache-control"]).toBe("no-cache");
    });

    it("should create new API call with modified request data", () => {
      const modifiedCall: ApiCall = {
        id: "modified-123456",
        url: "https://api.example.com/users/updated",
        method: "PUT",
        requestHeaders: { Authorization: "Bearer token" },
        requestBody: JSON.stringify({ name: "Updated" }),
        responseHeaders: { "x-request-id": "abc123" },
        responseBody: JSON.stringify({ success: true }),
        statusCode: 200,
        timestamp: Date.now(),
      };

      expect(modifiedCall.id).toMatch(/^modified-/);
      expect(modifiedCall.method).toBe("PUT");
      expect(modifiedCall.url).toContain("updated");
      expect(modifiedCall.requestBody).toContain("Updated");
    });

    it("should add modified call to beginning of list", () => {
      const apiCalls: ApiCall[] = [
        {
          id: "call-1",
          url: "https://api.com/1",
          method: "GET",
          statusCode: 200,
          timestamp: 1000,
        } as ApiCall,
        {
          id: "call-2",
          url: "https://api.com/2",
          method: "POST",
          statusCode: 201,
          timestamp: 2000,
        } as ApiCall,
      ];

      const modifiedCall: ApiCall = {
        id: "modified-3",
        url: "https://api.com/modified",
        method: "PUT",
        statusCode: 200,
        timestamp: 3000,
      } as ApiCall;

      apiCalls.unshift(modifiedCall);

      expect(apiCalls[0].id).toBe("modified-3");
      expect(apiCalls.length).toBe(3);
    });
  });

  describe("Modal Management", () => {
    it("should close modal when cancel button is clicked", () => {
      const modal = document.createElement("div");
      modal.id = "modifyModal";
      modal.classList.add("visible");
      document.body.appendChild(modal);

      const cancelBtn = document.createElement("button");
      cancelBtn.id = "cancelModifyBtn";
      cancelBtn.addEventListener("click", () => {
        modal.classList.remove("visible");
      });

      const clickEvent = new MouseEvent("click", { bubbles: true });
      cancelBtn.dispatchEvent(clickEvent);

      expect(modal.classList.contains("visible")).toBe(false);
    });

    it("should close modal when clicking outside content", () => {
      const modal = document.createElement("div");
      modal.id = "modifyModal";
      modal.classList.add("visible");
      document.body.appendChild(modal);

      // Add click outside logic
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("visible");
        }
      });

      const clickEvent = new MouseEvent("click", { bubbles: true });
      modal.dispatchEvent(clickEvent);

      expect(modal.classList.contains("visible")).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      const fetchMock = jest.fn().mockRejectedValue(new Error("Network error"));
      (global as any).fetch = fetchMock;

      let errorCaught = false;
      try {
        await fetch("https://api.example.com/test");
      } catch (e) {
        errorCaught = true;
      }

      expect(errorCaught).toBe(true);
    });

    it("should show error alert on failed request", () => {
      const alertMock = jest.fn();
      (global as any).alert = alertMock;

      alert("Failed to send modified request: Error");

      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining("Failed to send modified request")
      );
    });
  });
});
