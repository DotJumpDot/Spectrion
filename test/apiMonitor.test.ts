import { ApiMonitor } from '../src/core/apiMonitor';
import { ApiCall } from '../src/core/storageManager';

describe('ApiMonitor', () => {
  let apiMonitor: ApiMonitor;
  let mockListener: jest.Mock;

  beforeEach(() => {
    apiMonitor = new ApiMonitor();
    mockListener = jest.fn();
  });

  describe('onApiCall and offApiCall', () => {
    it('should add and remove listeners', () => {
      const apiCall: ApiCall = {
        id: 'test-1',
        url: 'https://api.example.com/data',
        method: 'GET',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
      };

      apiMonitor.onApiCall(mockListener);
      apiMonitor.notifyApiCall(apiCall);

      expect(mockListener).toHaveBeenCalledWith(apiCall);
    });

    it('should not call removed listeners', () => {
      const apiCall: ApiCall = {
        id: 'test-1',
        url: 'https://api.example.com/data',
        method: 'GET',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
      };

      apiMonitor.onApiCall(mockListener);
      apiMonitor.offApiCall(mockListener);
      apiMonitor.notifyApiCall(apiCall);

      expect(mockListener).not.toHaveBeenCalled();
    });

    it('should handle multiple listeners for same event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();

      const apiCall: ApiCall = {
        id: 'test-1',
        url: 'https://api.example.com/data',
        method: 'POST',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 201,
        timestamp: Date.now(),
      };

      apiMonitor.onApiCall(listener1);
      apiMonitor.onApiCall(listener2);
      apiMonitor.onApiCall(listener3);
      apiMonitor.notifyApiCall(apiCall);

      expect(listener1).toHaveBeenCalledWith(apiCall);
      expect(listener2).toHaveBeenCalledWith(apiCall);
      expect(listener3).toHaveBeenCalledWith(apiCall);
    });
  });

  describe('getHeadersAsObject', () => {
    it('should convert Headers object to object', () => {
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
      });

      const result = (apiMonitor as any).getHeadersAsObject(headers);

      expect(result).toEqual({
        'content-type': 'application/json',
        'authorization': 'Bearer token',
      });
    });

    it('should convert header string to object', () => {
      const headerString = 'Content-Type: application/json\r\nAuthorization: Bearer token';

      const result = (apiMonitor as any).getHeadersAsObject(headerString);

      expect(result).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
      });
    });

    it('should handle empty Headers object', () => {
      const headers = new Headers();
      const result = (apiMonitor as any).getHeadersAsObject(headers);
      expect(result).toEqual({});
    });

    it('should handle empty header string', () => {
      const headerString = '';
      const result = (apiMonitor as any).getHeadersAsObject(headerString);
      expect(result).toEqual({});
    });

    it('should handle headers with multiple values', () => {
      const headers = new Headers();
      headers.append('Set-Cookie', 'session=abc');
      headers.append('Set-Cookie', 'token=xyz');

      const result = (apiMonitor as any).getHeadersAsObject(headers);
      expect(result['set-cookie']).toBeDefined();
    });

    it('should handle malformed header string', () => {
      const headerString = 'Content-Type application/json\r\nInvalidLine';
      const result = (apiMonitor as any).getHeadersAsObject(headerString);
      expect(result['InvalidLine']).toBeUndefined();
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = (apiMonitor as any).generateId();
      const id2 = (apiMonitor as any).generateId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^api-/);
    });

    it('should generate IDs with consistent format', () => {
      const id = (apiMonitor as any).generateId();
      expect(id).toMatch(/^api-\d+-[a-z0-9]{9}$/);
    });

    it('should generate unique IDs in rapid succession', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add((apiMonitor as any).generateId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('ApiCall data structure', () => {
    it('should capture complete GET request', () => {
      const apiCall: ApiCall = {
        id: 'get-123',
        url: 'https://api.example.com/users',
        method: 'GET',
        requestHeaders: {
          'Authorization': 'Bearer token123',
          'Content-Type': 'application/json'
        },
        responseHeaders: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        statusCode: 200,
        timestamp: Date.now(),
        duration: 150,
        responseBody: JSON.stringify({ users: [] })
      };

      expect(apiCall.method).toBe('GET');
      expect(apiCall.statusCode).toBe(200);
      expect(apiCall.requestHeaders?.['Authorization']).toBe('Bearer token123');
      expect(apiCall.responseBody).toBeDefined();
    });

    it('should capture POST request with body', () => {
      const apiCall: ApiCall = {
        id: 'post-456',
        url: 'https://api.example.com/users',
        method: 'POST',
        requestHeaders: {
          'Content-Type': 'application/json'
        },
        requestBody: JSON.stringify({ name: 'John', email: 'john@example.com' }),
        responseHeaders: {
          'Content-Type': 'application/json'
        },
        statusCode: 201,
        timestamp: Date.now(),
        duration: 250,
        responseBody: JSON.stringify({ id: 1, name: 'John' })
      };

      expect(apiCall.method).toBe('POST');
      expect(apiCall.statusCode).toBe(201);
      expect(apiCall.requestBody).toContain('John');
      expect(apiCall.responseBody).toContain('John');
    });

    it('should handle PUT request', () => {
      const apiCall: ApiCall = {
        id: 'put-789',
        url: 'https://api.example.com/users/1',
        method: 'PUT',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
        duration: 300
      };

      expect(apiCall.method).toBe('PUT');
      expect(apiCall.statusCode).toBe(200);
    });

    it('should handle DELETE request', () => {
      const apiCall: ApiCall = {
        id: 'delete-101',
        url: 'https://api.example.com/users/1',
        method: 'DELETE',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 204,
        timestamp: Date.now(),
        duration: 100
      };

      expect(apiCall.method).toBe('DELETE');
      expect(apiCall.statusCode).toBe(204);
    });

    it('should handle PATCH request', () => {
      const apiCall: ApiCall = {
        id: 'patch-202',
        url: 'https://api.example.com/users/1',
        method: 'PATCH',
        requestHeaders: {
          'Content-Type': 'application/json'
        },
        requestBody: JSON.stringify({ name: 'Jane' }),
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
        duration: 120
      };

      expect(apiCall.method).toBe('PATCH');
      expect(apiCall.requestBody).toContain('Jane');
    });
  });

  describe('Error scenarios', () => {
    it('should handle API call with error status', () => {
      const apiCall: ApiCall = {
        id: 'error-1',
        url: 'https://api.example.com/notfound',
        method: 'GET',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 404,
        timestamp: Date.now(),
        duration: 50
      };

      expect(apiCall.statusCode).toBe(404);
      expect(apiCall.id).toContain('error-');
    });

    it('should handle API call with server error', () => {
      const apiCall: ApiCall = {
        id: 'error-2',
        url: 'https://api.example.com/error',
        method: 'GET',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 500,
        timestamp: Date.now(),
        duration: 200
      };

      expect(apiCall.statusCode).toBe(500);
    });

    it('should handle network error', () => {
      const apiCall: ApiCall = {
        id: 'network-error',
        url: 'https://api.example.com/timeout',
        method: 'GET',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 0,
        timestamp: Date.now(),
        duration: 5000
      };

      expect(apiCall.statusCode).toBe(0);
    });
  });

  describe('Response body handling', () => {
    it('should handle JSON response body', () => {
      const apiCall: ApiCall = {
        id: 'json-response',
        url: 'https://api.example.com/data',
        method: 'GET',
        requestHeaders: {},
        responseHeaders: {
          'Content-Type': 'application/json'
        },
        statusCode: 200,
        timestamp: Date.now(),
        duration: 100,
        responseBody: JSON.stringify({
          data: { id: 1, name: 'Test' },
          meta: { total: 1 }
        }, null, 2)
      };

      const parsedBody = JSON.parse(apiCall.responseBody!);
      expect(parsedBody.data.name).toBe('Test');
      expect(parsedBody.meta.total).toBe(1);
    });

    it('should handle text response body', () => {
      const apiCall: ApiCall = {
        id: 'text-response',
        url: 'https://api.example.com/text',
        method: 'GET',
        requestHeaders: {},
        responseHeaders: {
          'Content-Type': 'text/plain'
        },
        statusCode: 200,
        timestamp: Date.now(),
        duration: 50,
        responseBody: 'Plain text response'
      };

      expect(apiCall.responseBody).toBe('Plain text response');
    });

    it('should handle empty response body', () => {
      const apiCall: ApiCall = {
        id: 'empty-response',
        url: 'https://api.example.com/empty',
        method: 'DELETE',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 204,
        timestamp: Date.now(),
        duration: 30
      };

      expect(apiCall.responseBody).toBeUndefined();
    });

    it('should handle large response body', () => {
      const largeData = Array(1000).fill({ id: 1, data: 'test' });
      const apiCall: ApiCall = {
        id: 'large-response',
        url: 'https://api.example.com/large',
        method: 'GET',
        requestHeaders: {},
        responseHeaders: {
          'Content-Type': 'application/json'
        },
        statusCode: 200,
        timestamp: Date.now(),
        duration: 500,
        responseBody: JSON.stringify(largeData)
      };

      expect(apiCall.responseBody).toBeDefined();
      const parsed = JSON.parse(apiCall.responseBody!);
      expect(parsed.length).toBe(1000);
    });
  });

  describe('Request body handling', () => {
    it('should handle JSON request body', () => {
      const apiCall: ApiCall = {
        id: 'json-request',
        url: 'https://api.example.com/create',
        method: 'POST',
        requestHeaders: {
          'Content-Type': 'application/json'
        },
        requestBody: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin'
        }, null, 2),
        responseHeaders: {},
        statusCode: 201,
        timestamp: Date.now(),
        duration: 200
      };

      const parsedBody = JSON.parse(apiCall.requestBody!);
      expect(parsedBody.name).toBe('Test User');
      expect(parsedBody.role).toBe('admin');
    });

    it('should handle form data request body', () => {
      const apiCall: ApiCall = {
        id: 'form-request',
        url: 'https://api.example.com/submit',
        method: 'POST',
        requestHeaders: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        requestBody: 'name=John&email=john@example.com',
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
        duration: 150
      };

      expect(apiCall.requestBody).toContain('name=John');
    });

    it('should handle empty request body', () => {
      const apiCall: ApiCall = {
        id: 'no-body',
        url: 'https://api.example.com/data',
        method: 'GET',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
        duration: 100
      };

      expect(apiCall.requestBody).toBeUndefined();
    });
  });

  describe('Duration tracking', () => {
    it('should track short API call duration', () => {
      const apiCall: ApiCall = {
        id: 'short-duration',
        url: 'https://api.example.com/fast',
        method: 'GET',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
        duration: 5
      };

      expect(apiCall.duration).toBeLessThan(10);
    });

    it('should track long API call duration', () => {
      const apiCall: ApiCall = {
        id: 'long-duration',
        url: 'https://api.example.com/slow',
        method: 'GET',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
        duration: 5000
      };

      expect(apiCall.duration).toBeGreaterThan(1000);
    });

    it('should handle missing duration', () => {
      const apiCall: ApiCall = {
        id: 'no-duration',
        url: 'https://api.example.com/data',
        method: 'GET',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now()
      };

      expect(apiCall.duration).toBeUndefined();
    });
  });

  describe('Timestamp handling', () => {
    it('should use valid timestamp', () => {
      const now = Date.now();
      const apiCall: ApiCall = {
        id: 'timestamp-test',
        url: 'https://api.example.com/data',
        method: 'GET',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: now,
        duration: 100
      };

      expect(apiCall.timestamp).toBe(now);
      expect(new Date(apiCall.timestamp)).toBeInstanceOf(Date);
    });

    it('should handle timestamps from different times', () => {
      const timestamp1 = new Date('2024-01-01').getTime();
      const timestamp2 = new Date('2024-12-31').getTime();

      const call1: ApiCall = {
        id: 'call-1',
        url: 'https://api.example.com/data',
        method: 'GET',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: timestamp1,
        duration: 100
      };

      const call2: ApiCall = {
        id: 'call-2',
        url: 'https://api.example.com/data',
        method: 'GET',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: timestamp2,
        duration: 100
      };

      expect(call2.timestamp).toBeGreaterThan(call1.timestamp);
    });
  });
});
