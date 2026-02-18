import { sessionManager, Session, ApiCall } from "./core/sessionManager";
import { apiMonitor } from "./core/apiMonitor";
import { storageManager } from "./core/storageManager";

export class Spectrion {
  private static instance: Spectrion;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): Spectrion {
    if (!Spectrion.instance) {
      Spectrion.instance = new Spectrion();
    }
    return Spectrion.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn("Spectrion is already initialized");
      return;
    }

    console.log("Initializing Spectrion...");

    try {
      await this.setupApiMonitoring();
      await this.setupStorage();
      await this.setupEventListeners();

      this.isInitialized = true;
      console.log("Spectrion initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Spectrion:", error);
      throw error;
    }
  }

  private async setupApiMonitoring(): Promise<void> {
    if (typeof window !== "undefined") {
      apiMonitor.interceptFetch();
      apiMonitor.interceptXHR();
    }
  }

  private async setupStorage(): Promise<void> {
    await storageManager.getAllSessions();
  }

  private async setupEventListeners(): Promise<void> {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      apiMonitor.onApiCall(async (call: ApiCall) => {
        const session = await storageManager.getCurrentSession();
        if (session) {
          sessionManager.addApiCall(call);
          await storageManager.setCurrentSession(session);
        }
      });
    }
  }

  get sessionManager() {
    return sessionManager;
  }

  get apiMonitor() {
    return apiMonitor;
  }

  get storageManager() {
    return storageManager;
  }
}

export const spectrion = Spectrion.getInstance();

if (typeof window !== "undefined") {
  spectrion.initialize().catch(console.error);
}

export * from "./core/sessionManager";
export * from "./core/apiMonitor";
export * from "./core/storageManager";
