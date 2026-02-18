import { SessionManager, ApiCall } from '../src/core/sessionManager';

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  describe('getCurrentSession', () => {
    it('should return null when no session is active', () => {
      expect(sessionManager.getCurrentSession()).toBeNull();
    });

    it('should return current session when one exists', () => {
      const session = sessionManager.startSession('example.com');
      expect(sessionManager.getCurrentSession()).toBe(session);
    });
  });

  describe('startSession', () => {
    it('should create a new session with required properties', () => {
      const session = sessionManager.startSession('example.com');

      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('startTime');
      expect(session).toHaveProperty('apiCalls');
      expect(session).toHaveProperty('domain', 'example.com');
      expect(session.apiCalls).toEqual([]);
    });

    it('should generate unique session IDs', () => {
      const session1 = sessionManager.startSession('example.com');
      const session2 = sessionManager.startSession('example.com');

      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe('endSession', () => {
    it('should set endTime when session is ended', () => {
      sessionManager.startSession('example.com');
      sessionManager.endSession();

      const session = sessionManager.getCurrentSession();
      expect(session).toHaveProperty('endTime');
      expect(session!.endTime).toBeGreaterThan(session!.startTime);
    });
  });

  describe('addApiCall', () => {
    it('should add API call to current session', () => {
      sessionManager.startSession('example.com');

      const apiCall: ApiCall = {
        id: 'test-1',
        url: 'https://api.example.com/data',
        method: 'GET',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
      };

      sessionManager.addApiCall(apiCall);

      const session = sessionManager.getCurrentSession();
      expect(session!.apiCalls).toHaveLength(1);
      expect(session!.apiCalls[0]).toBe(apiCall);
    });

    it('should not add API call when no session exists', () => {
      const apiCall: ApiCall = {
        id: 'test-1',
        url: 'https://api.example.com/data',
        method: 'GET',
        requestHeaders: {},
        responseHeaders: {},
        statusCode: 200,
        timestamp: Date.now(),
      };

      expect(() => sessionManager.addApiCall(apiCall)).not.toThrow();
    });
  });
});
