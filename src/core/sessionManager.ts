export interface ApiCall {
  id: string;
  url: string;
  method: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  statusCode: number;
  timestamp: number;
  duration?: number;
}

export interface Session {
  id: string;
  startTime: number;
  endTime?: number;
  apiCalls: ApiCall[];
  domain: string;
}

export class SessionManager {
  private activeSessions: Map<number, Session> = new Map();

  getSession(tabId: number): Session | undefined {
    return this.activeSessions.get(tabId);
  }

  startSession(tabId: number, domain: string): Session {
    const session: Session = {
      id: this.generateId(),
      startTime: Date.now(),
      apiCalls: [],
      domain,
    };
    this.activeSessions.set(tabId, session);
    return session;
  }

  endSession(tabId: number): void {
    const session = this.activeSessions.get(tabId);
    if (session) {
      session.endTime = Date.now();
      this.activeSessions.delete(tabId);
    }
  }

  restoreSession(tabId: number, session: Session): void {
    this.activeSessions.set(tabId, session);
  }

  addApiCall(tabId: number, apiCall: ApiCall): void {
    const session = this.activeSessions.get(tabId);
    if (session) {
      session.apiCalls.push(apiCall);
    }
  }

  private generateId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const sessionManager = new SessionManager();
