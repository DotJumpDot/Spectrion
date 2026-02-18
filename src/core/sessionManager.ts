export interface ApiCall {
  id: string;
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  responseHeaders: Record<string, string>;
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
  private currentSession: Session | null = null;

  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  startSession(domain: string): Session {
    const session: Session = {
      id: this.generateId(),
      startTime: Date.now(),
      apiCalls: [],
      domain,
    };
    this.currentSession = session;
    return session;
  }

  endSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
    }
  }

  addApiCall(apiCall: ApiCall): void {
    if (this.currentSession) {
      this.currentSession.apiCalls.push(apiCall);
    }
  }

  private generateId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const sessionManager = new SessionManager();
