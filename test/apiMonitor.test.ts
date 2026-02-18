import { ApiMonitor } from '../src/core/apiMonitor';
import { ApiCall } from '../src/core/sessionManager';

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
  });

  describe('getHeadersAsObject', () => {
    it('should convert Headers object to object', () => {
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
      });

      const result = (apiMonitor as any).getHeadersAsObject(headers);

      expect(result).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
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
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = (apiMonitor as any).generateId();
      const id2 = (apiMonitor as any).generateId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^api-/);
    });
  });
});
