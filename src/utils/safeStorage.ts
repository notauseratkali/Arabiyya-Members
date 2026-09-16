/**
 * Safe LocalStorage wrapper that catches DOMException (SecurityError / QuotaExceededError)
 * caused by strict browser privacy settings, incognito mode, or third-party iframe restrictions.
 * Falls back to an in-memory storage dictionary if window.localStorage is inaccessible.
 */

const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`[safeStorage] Read failed for key "${key}", falling back to memory:`, e);
    }
    return memoryStorage[key] ?? null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn(`[safeStorage] Write failed for key "${key}", falling back to memory:`, e);
    }
    memoryStorage[key] = value;
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`[safeStorage] Remove failed for key "${key}":`, e);
    }
    delete memoryStorage[key];
  },

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (e) {
      console.warn('[safeStorage] Clear failed:', e);
    }
    Object.keys(memoryStorage).forEach(k => delete memoryStorage[k]);
  }
};
