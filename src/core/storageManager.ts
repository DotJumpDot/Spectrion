import { Session, ApiCall } from "./sessionManager";

export { Session, ApiCall };

export class StorageManager {
  private readonly SESSION_KEY = "spectrion_sessions";
  private readonly CURRENT_SESSION_KEY = "spectrion_current_session";

  async saveSession(session: Session): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      sessions.push(session);
      await this.setStorage(this.SESSION_KEY, sessions);
    } catch (error) {
      console.error("Failed to save session:", error);
      throw error;
    }
  }

  async updateSession(session: Session): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const index = sessions.findIndex((s) => s.id === session.id);
      if (index !== -1) {
        sessions[index] = session;
        await this.setStorage(this.SESSION_KEY, sessions);
      }
    } catch (error) {
      console.error("Failed to update session:", error);
      throw error;
    }
  }

  async getAllSessions(): Promise<Session[]> {
    try {
      const result = await this.getStorage<Session[]>(this.SESSION_KEY);
      return result || [];
    } catch (error) {
      console.error("Failed to get sessions:", error);
      return [];
    }
  }

  async getSessionById(sessionId: string): Promise<Session | null> {
    try {
      const sessions = await this.getAllSessions();
      return sessions.find((s) => s.id === sessionId) || null;
    } catch (error) {
      console.error("Failed to get session:", error);
      return null;
    }
  }

  async setCurrentSession(session: Session): Promise<void> {
    try {
      await this.setStorage(this.CURRENT_SESSION_KEY, session);
    } catch (error) {
      console.error("Failed to set current session:", error);
      throw error;
    }
  }

  async getCurrentSession(): Promise<Session | null> {
    try {
      return (await this.getStorage(this.CURRENT_SESSION_KEY)) || null;
    } catch (error) {
      console.error("Failed to get current session:", error);
      return null;
    }
  }

  async clearCurrentSession(): Promise<void> {
    try {
      await this.setStorage(this.CURRENT_SESSION_KEY, null);
    } catch (error) {
      console.error("Failed to clear current session:", error);
      throw error;
    }
  }

  async clearAllSessions(): Promise<void> {
    try {
      await this.setStorage(this.SESSION_KEY, []);
      await this.setStorage(this.CURRENT_SESSION_KEY, null);
    } catch (error) {
      console.error("Failed to clear all sessions:", error);
      throw error;
    }
  }

  private async getStorage<T>(key: string): Promise<T> {
    if (typeof chrome !== "undefined" && chrome.storage) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result: { [key: string]: any }) => {
          resolve(result[key] as T);
        });
      });
    }
    const result = localStorage.getItem(key);
    return result ? JSON.parse(result) : (null as T);
  }

  private async setStorage<T>(key: string, value: T): Promise<void> {
    if (typeof chrome !== "undefined" && chrome.storage) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    }
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export const storageManager = new StorageManager();
