import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { safeStorage } from '../utils/safeStorage';
import { fetchWithRetry } from '../utils/fetchUtils';

interface LogoContextType {
  logoUrl: string;
  setLogoUrl: (url: string) => void;
  resetLogo: () => void;
  refreshLogo: () => Promise<string>;
}

const LogoContext = createContext<LogoContextType>({
  logoUrl: '/logo.svg',
  setLogoUrl: () => {},
  resetLogo: () => {},
  refreshLogo: async () => '/logo.svg',
});

// Update favicon dynamically across all tabs & views
function updateFavicon(url: string) {
  try {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = url;
  } catch {
    // Non-critical fallback
  }
}

export const LogoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoState] = useState<string>(() => {
    return safeStorage.getItem('app_custom_logo') || '/logo.svg';
  });

  const setLogoUrl = useCallback((url: string) => {
    setLogoState(url);
    updateFavicon(url);
    safeStorage.setItem('app_custom_logo', url);
    window.dispatchEvent(new CustomEvent('arabiyya_logo_updated', { detail: url }));
    window.dispatchEvent(new Event('storage'));
  }, []);

  const resetLogo = useCallback(() => {
    const defaultLogo = '/logo.svg';
    setLogoState(defaultLogo);
    updateFavicon(defaultLogo);
    safeStorage.removeItem('app_custom_logo');
    window.dispatchEvent(new CustomEvent('arabiyya_logo_updated', { detail: defaultLogo }));
    window.dispatchEvent(new Event('storage'));
  }, []);

  const refreshLogo = useCallback(async (): Promise<string> => {
    try {
      const res = await fetchWithRetry(`/api/settings?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          const data = JSON.parse(text);
          if (data && data.group_logo) {
            setLogoState(prev => {
              if (prev !== data.group_logo) {
                updateFavicon(data.group_logo);
              }
              return data.group_logo;
            });
            safeStorage.setItem('app_custom_logo', data.group_logo);
            return data.group_logo;
          }
        }
      }
    } catch (err) {
      console.warn('[LogoContext] Could not refresh server settings:', err);
    }
    return logoUrl;
  }, [logoUrl]);

  useEffect(() => {
    // 1. Initial server fetch
    refreshLogo();

    // 2. Custom inter-component synchronization event
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setLogoState(customEvent.detail);
        updateFavicon(customEvent.detail);
      }
    };

    // 3. Multi-tab storage listener
    const handleStorage = () => {
      const stored = safeStorage.getItem('app_custom_logo');
      if (stored) {
        setLogoState(stored);
        updateFavicon(stored);
      } else {
        setLogoState('/logo.svg');
        updateFavicon('/logo.svg');
      }
    };

    // 4. Focus and visibility re-validation
    const handleFocus = () => {
      refreshLogo();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshLogo();
      }
    };

    window.addEventListener('arabiyya_logo_updated', handleCustomEvent);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 5. Polling sync interval (every 10s) to keep all public pages continuously in sync with Settings
    const pollInterval = setInterval(() => {
      refreshLogo();
    }, 10000);

    return () => {
      window.removeEventListener('arabiyya_logo_updated', handleCustomEvent);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(pollInterval);
    };
  }, [refreshLogo]);

  return (
    <LogoContext.Provider value={{ logoUrl, setLogoUrl, resetLogo, refreshLogo }}>
      {children}
    </LogoContext.Provider>
  );
};

export const useLogo = () => useContext(LogoContext);
