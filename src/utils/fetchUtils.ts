import { handleClientApiFallback } from './apiClient';

/**
 * A highly resilient fetch wrapper with automatic exponential backoff retries.
 * Prevents transient network or server startup/restart failures (e.g., "TypeError: Failed to fetch")
 * and handles static hosting environments (such as GitHub Pages) where live backend API endpoints are unreachable.
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 2,
  delay = 800
): Promise<Response> {
  // Dynamically prefix the live Cloud Run backend URL when hosted on static environments like GitHub Pages
  let targetUrl = url;
  if (url.startsWith('/api/')) {
    const isGitHubPages = window.location.hostname.endsWith('github.io');
    const isLocalStaticClient = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3000';
    
    if (isGitHubPages || isLocalStaticClient) {
      const backendBaseUrl = 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app';
      targetUrl = `${backendBaseUrl}${url}`;
    }
  }

  try {
    const res = await fetch(targetUrl, options);

    // If endpoint returns 404 or HTML page for an /api/ request on static hosting (e.g. GitHub Pages)
    const contentType = res.headers.get('content-type') || '';
    if (url.includes('/api/') && (!res.ok || (!contentType.includes('application/json') && !contentType.includes('+json')))) {
      if (res.status === 404 || contentType.includes('text/html')) {
        console.warn(`[fetchWithRetry] Delegating static hosting request for ${url} to client API fallback`);
        return await handleClientApiFallback(url, options);
      }
    }

    const originalJson = res.json.bind(res);
    res.json = async () => {
      try {
        if (!contentType.includes('application/json') && !contentType.includes('+json')) {
          const text = await res.text();
          const trimmed = text.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            return JSON.parse(trimmed);
          }
          if (url.includes('unread-count') || url.includes('count')) {
            return { count: 0, unreadCount: 0 };
          }
          if (url.includes('settings')) {
            return {};
          }
          if (url.includes('profile') || url.includes('member/')) {
            return null;
          }
          return [];
        }
        return await originalJson();
      } catch (jsonErr) {
        console.warn(`[fetchWithRetry] JSON parse fallback for ${url}:`, jsonErr);
        if (url.includes('count')) return { count: 0 };
        if (url.includes('settings')) return {};
        return [];
      }
    };

    return res;
  } catch (err) {
    if (url.includes('/api/')) {
      console.warn(`[fetchWithRetry] Network error for ${url}, switching to client API fallback`);
      return await handleClientApiFallback(url, options);
    }
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw err;
  }
}


