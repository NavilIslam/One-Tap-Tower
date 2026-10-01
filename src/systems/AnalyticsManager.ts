export class AnalyticsManager {
  private static instance: AnalyticsManager;

  private constructor() {}

  public static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager();
    }
    return AnalyticsManager.instance;
  }

  public logEvent(eventName: string, params?: Record<string, any>): void {
    if (typeof window !== 'undefined' && (window as any).__DEV__) {
      console.log(`[Analytics] ${eventName}`, params);
    }
  }
}
