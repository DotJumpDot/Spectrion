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

    it("should handle adding and removing same listener multiple times", () => {
      const listener = jest.fn();

      apiMonitor.onApiCall(listener);
      apiMonitor.offApiCall(listener);

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

      expect(listener).toHaveBeenCalledTimes(0);
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

    it("should handle complex headers", () => {
      const headers = new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'X-Request-ID': 'req-12345',
        'Cache-Control': 'no-cache, no-store, max-age=0',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      });

      const result = (apiMonitor as any).getHeadersAsObject(headers);

      expect(result['content-type']).toBe('application/json; charset=utf-8');
      expect(result['authorization']).toBe('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(result['x-request-id']).toBe('req-12345');
      expect(result['cache-control']).toBe('no-cache, no-store, max-age=0');
    });

    it("should handle headers with special characters", () => {
      const headers = new Headers();
      headers.set('X-Custom-Header', 'value with spaces and:colons');
      headers.set('Accept-Language', 'en-US,en;q=0.9');

      const result = (apiMonitor as any).getHeadersAsObject(headers);

      expect(result['x-custom-header']).toBe('value with spaces and:colons');
      expect(result['accept-language']).toBe('en-US,en;q=0.9');
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

    it("should generate unique IDs across different instances", () => {
      const apiMonitor2 = new ApiMonitor();

      const ids: string[] = [];
      for (let i = 0; i < 50; i++) {
        ids.push((apiMonitor as any).generateId());
        ids.push((apiMonitor2 as any).generateId());
      }

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100);
    });
  });

  describe("Real-world API call scenarios", () => {
    it("should handle RESTful API call with JSON", () => {
      const apiCall: ApiCall = {
        id: "rest-call",
        url: "https://api.example.com/users/123",
        method: "GET",
        requestHeaders: {
          'Authorization': 'Bearer token123',
          'Accept': 'application/json'
        },
        responseHeaders: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '99',
          'X-Request-ID': 'abc-123'
        },
        statusCode: 200,
        timestamp: Date.now(),
        duration: 150,
        responseBody: JSON.stringify({
          id: 123,
          name: 'John Doe',
          email: 'john@example.com',
          created_at: '2024-01-01T00:00:00Z'
        })
      };

      const listener = jest.fn();
      apiMonitor.onApiCall(listener);
      apiMonitor.notifyApiCall(apiCall);

      expect(listener).toHaveBeenCalledWith(apiCall);
      const receivedCall = listener.mock.calls[0][0];
      expect(receivedCall.responseBody).toContain('John Doe');
      expect(receivedCall.responseHeaders['X-RateLimit-Remaining']).toBe('99');
    });

    it("should handle GraphQL API call", () => {
      const query = `query { user(id: 123) { name email } }`;
      const apiCall: ApiCall = {
        id: "graphql-call",
        url: "https://api.example.com/graphql",
        method: "POST",
        requestHeaders: {
          'Content-Type': 'application/json'
        },
        requestBody: JSON.stringify({
          query: query,
          variables: { id: 123 }
        }),
        responseHeaders: {
          'Content-Type': 'application/json'
        },
        statusCode: 200,
        timestamp: Date.now(),
        duration: 250,
        responseBody: JSON.stringify({
          data: {
            user: {
              name: 'Jane Doe',
              email: 'jane@example.com'
            }
          }
        })
      };

      const listener = jest.fn();
      apiMonitor.onApiCall(listener);
      apiMonitor.notifyApiCall(apiCall);

      expect(listener).toHaveBeenCalledWith(apiCall);
      expect(apiCall.requestBody).toContain('query {');
    });

    it("should handle file upload API call", () => {
      const apiCall: ApiCall = {
        id: "upload-call",
        url: "https://api.example.com/upload",
        method: "POST",
        requestHeaders: {
          'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary',
          'Content-Length': '12345'
        },
        requestBody: '------WebKitFormBoundary\r\nContent-Disposition: form-data; name="file"; filename="test.txt"\r\nContent-Type: text/plain\r\n\r\nFile content here\r\n------WebKitFormBoundary--',
        responseHeaders: {
          'Content-Type': 'application/json'
        },
        statusCode: 201,
        timestamp: Date.now(),
        duration: 2000,
        responseBody: JSON.stringify({
          id: 'file-123',
          url: 'https://cdn.example.com/files/test.txt',
          size: 12345
        })
      };

      const listener = jest.fn();
      apiMonitor.onApiCall(listener);
      apiMonitor.notifyApiCall(apiCall);

      expect(listener).toHaveBeenCalledWith(apiCall);
      expect(apiCall.requestBody).toContain('form-data');
    });

    it("should handle authentication API call", () => {
      const apiCall: ApiCall = {
        id: "auth-call",
        url: "https://api.example.com/auth/login",
        method: "POST",
        requestHeaders: {
          'Content-Type': 'application/json'
        },
        requestBody: JSON.stringify({
          username: 'user@example.com',
          password: 'secret'
        }),
        responseHeaders: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'session=abc123; Path=/; HttpOnly; Secure',
          'X-CSRF-Token': 'csrf=xyz789'
        },
        statusCode: 200,
        timestamp: Date.now(),
        duration: 500,
        responseBody: JSON.stringify({
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          expires_in: 3600
        })
      };

      const listener = jest.fn();
      apiMonitor.onApiCall(listener);
      apiMonitor.notifyApiCall(apiCall);

      expect(listener).toHaveBeenCalledWith(apiCall);
      expect(apiCall.responseHeaders?.['Set-Cookie']).toBeDefined();
      expect(apiCall.responseHeaders?.['X-CSRF-Token']).toBeDefined();
    });

    it("should handle pagination API call", () => {
      const apiCall: ApiCall = {
        id: "pagination-call",
        url: "https://api.example.com/users?page=2&limit=50",
        method: "GET",
        requestHeaders: {
          'Authorization': 'Bearer token123'
        },
        responseHeaders: {
          'Content-Type': 'application/json',
          'X-Total-Count': '500',
          'X-Total-Pages': '10',
          'Link': '<https://api.example.com/users?page=1>; rel="prev", <https://api.example.com/users?page=3>; rel="next"'
        },
        statusCode: 200,
        timestamp: Date.now(),
        duration: 120,
        responseBody: JSON.stringify({
          data: Array(50).fill({ id: 1, name: 'User' }),
          pagination: {
            page: 2,
            limit: 50,
            total: 500,
            pages: 10
          }
        })
      };

      const listener = jest.fn();
      apiMonitor.onApiCall(listener);
      apiMonitor.notifyApiCall(apiCall);

      expect(listener).toHaveBeenCalledWith(apiCall);
      expect(apiCall.responseHeaders?.['X-Total-Count']).toBe('500');
    });

    it("should handle error response with details", () => {
      const apiCall: ApiCall = {
        id: "error-call",
        url: "https://api.example.com/users/999",
        method: "GET",
        requestHeaders: {
          'Authorization': 'Bearer token123'
        },
        responseHeaders: {
          'Content-Type': 'application/json',
          'X-Error-Code': 'USER_NOT_FOUND',
          'X-Request-ID': 'error-12345'
        },
        statusCode: 404,
        timestamp: Date.now(),
        duration: 50,
        responseBody: JSON.stringify({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User with ID 999 not found',
            details: {
              field: 'id',
              value: 999
            }
          }
        })
      };

      const listener = jest.fn();
      apiMonitor.onApiCall(listener);
      apiMonitor.notifyApiCall(apiCall);

      expect(listener).toHaveBeenCalledWith(apiCall);
      expect(apiCall.statusCode).toBe(404);
      expect(apiCall.responseBody).toContain('USER_NOT_FOUND');
    });
  });

  describe("Performance and scalability", () => {
    it("should handle high-frequency API calls", () => {
      const listener = jest.fn();
      apiMonitor.onApiCall(listener);

      const numberOfCalls = 1000;
      for (let i = 0; i < numberOfCalls; i++) {
        const apiCall: ApiCall = {
          id: `call-${i}`,
          url: `https://api.example.com/data/${i}`,
          method: "GET",
          requestHeaders: {},
          responseHeaders: {},
          statusCode: 200,
          timestamp: Date.now(),
          duration: 10 + Math.floor(Math.random() * 90)
        };
        apiMonitor.notifyApiCall(apiCall);
      }

      expect(listener).toHaveBeenCalledTimes(numberOfCalls);
    });

    it("should handle multiple listeners with high frequency", () => {
      const listeners = Array(10).fill(null).map(() => jest.fn());
      listeners.forEach(listener => apiMonitor.onApiCall(listener));

      const numberOfCalls = 100;
      for (let i = 0; i < numberOfCalls; i++) {
        const apiCall: ApiCall = {
          id: `call-${i}`,
          url: "https://api.example.com/data",
          method: "GET",
          requestHeaders: {},
          responseHeaders: {},
          statusCode: 200,
          timestamp: Date.now(),
          duration: 50
        };
        apiMonitor.notifyApiCall(apiCall);
      }

      listeners.forEach(listener => {
        expect(listener).toHaveBeenCalledTimes(numberOfCalls);
      });
    });

    it("should handle listener removal during notification", () => {
      let callCount = 0;
      const listener1 = jest.fn(() => {
        callCount++;
        if (callCount === 5) {
          apiMonitor.offApiCall(listener1);
        }
      });
      const listener2 = jest.fn();

      apiMonitor.onApiCall(listener1);
      apiMonitor.onApiCall(listener2);

      for (let i = 0; i < 10; i++) {
        const apiCall: ApiCall = {
          id: `call-${i}`,
          url: "https://api.example.com/data",
          method: "GET",
          requestHeaders: {},
          responseHeaders: {},
          statusCode: 200,
          timestamp: Date.now(),
          duration: 50
        };
        apiMonitor.notifyApiCall(apiCall);
      }

      expect(listener1).toHaveBeenCalledTimes(5);
      expect(listener2).toHaveBeenCalledTimes(10);
    });
  });

  describe("Data integrity", () => {
    it("should preserve all ApiCall properties", () => {
      const originalApiCall: ApiCall = {
        id: "test-123",
        url: "https://api.example.com/data",
        method: "POST",
        requestHeaders: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token'
        },
        requestBody: JSON.stringify({ test: 'data' }),
        responseHeaders: {
          'Content-Type': 'application/json',
          'X-Custom': 'value'
        },
        statusCode: 201,
        timestamp: Date.now(),
        duration: 250,
        responseBody: JSON.stringify({ success: true })
      };

      const listener = jest.fn();
      apiMonitor.onApiCall(listener);
      apiMonitor.notifyApiCall(originalApiCall);

      const receivedCall = listener.mock.calls[0][0] as ApiCall;

      expect(receivedCall.id).toBe(originalApiCall.id);
      expect(receivedCall.url).toBe(originalApiCall.url);
      expect(receivedCall.method).toBe(originalApiCall.method);
      expect(receivedCall.requestHeaders).toEqual(originalApiCall.requestHeaders);
      expect(receivedCall.requestBody).toBe(originalApiCall.requestBody);
      expect(receivedCall.responseHeaders).toEqual(originalApiCall.responseHeaders);
      expect(receivedCall.statusCode).toBe(originalApiCall.statusCode);
      expect(receivedCall.timestamp).toBe(originalApiCall.timestamp);
      expect(receivedCall.duration).toBe(originalApiCall.duration);
      expect(receivedCall.responseBody).toBe(originalApiCall.responseBody);
    });

    it("should not modify original ApiCall object", () => {
      const originalApiCall: ApiCall = {
        id: "test-456",
        url: "https://api.example.com/data",
        method: "GET",
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
        duration: 100
      };

      const originalUrl = originalApiCall.url;
      const listener = jest.fn();
      apiMonitor.onApiCall(listener);
      apiMonitor.notifyApiCall(originalApiCall);

      expect(originalApiCall.url).toBe(originalUrl);
    });
  });
});
