import { Session, ApiCall } from "./sessionManager";

export { Session, ApiCall };

export class StorageManager {
  private readonly SESSION_KEY = "spectrion_sessions";
  private readonly CURRENT_SESSION_KEY = "spectrion_current_session";
  private readonly FULL_INFO_MODE_KEY = "spectrion_full_info_mode";
  private readonly ANALYTICS_CACHE_KEY = "spectrion_analytics_cache";

  async getFullInfoMode(): Promise<boolean> {
    try {
      const result = await this.getStorage(this.FULL_INFO_MODE_KEY);
      return result === true;
    } catch (error) {
      console.error("Failed to get full info mode:", error);
      return false;
    }
  }

  async setFullInfoMode(enabled: boolean): Promise<void> {
    try {
      await this.setStorage(this.FULL_INFO_MODE_KEY, enabled);
    } catch (error) {
      console.error("Failed to set full info mode:", error);
      throw error;
    }
  }

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

  async saveActiveSession(tabId: number, session: Session): Promise<void> {
    try {
      await this.setStorage(`spectrion_active_session_${tabId}`, session);
    } catch (error) {
      console.error(`Failed to set active session for tab ${tabId}:`, error);
      throw error;
    }
  }

  async getActiveSession(tabId: number): Promise<Session | null> {
    try {
      return (await this.getStorage(`spectrion_active_session_${tabId}`)) || null;
    } catch (error) {
      console.error(`Failed to get active session for tab ${tabId}:`, error);
      return null;
    }
  }

  async clearActiveSession(tabId: number): Promise<void> {
    try {
      await this.setStorage(`spectrion_active_session_${tabId}`, null);
    } catch (error) {
      console.error(`Failed to clear active session for tab ${tabId}:`, error);
      throw error;
    }
  }

  async clearAllSessions(): Promise<void> {
    try {
      await this.setStorage(this.SESSION_KEY, []);
      await this.setStorage(this.CURRENT_SESSION_KEY, null);
      await this.setStorage("spectrion_url_history", []);
      await this.setStorage(this.ANALYTICS_CACHE_KEY, null);
    } catch (error) {
      console.error("Failed to clear all sessions:", error);
      throw error;
    }
  }

  async getAnalyticsCache(): Promise<any> {
    try {
      const result = await this.getStorage(this.ANALYTICS_CACHE_KEY);
      return result || null;
    } catch (error) {
      console.error("Failed to get analytics cache:", error);
      return null;
    }
  }

  async setAnalyticsCache(data: any): Promise<void> {
    try {
      await this.setStorage(this.ANALYTICS_CACHE_KEY, data);
    } catch (error) {
      console.error("Failed to set analytics cache:", error);
      throw error;
    }
  }

  async clearAnalyticsCache(): Promise<void> {
    try {
      await this.setStorage(this.ANALYTICS_CACHE_KEY, null);
    } catch (error) {
      console.error("Failed to clear analytics cache:", error);
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
