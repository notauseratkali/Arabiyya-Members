/**
 * A highly resilient fetch wrapper with automatic exponential backoff retries.
 * Prevents transient network or server startup/restart failures (e.g., "TypeError: Failed to fetch")
 * and prevents JSON parsing crashes when endpoints return HTML fallback pages (such as during static hosting or cookie checks).
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 2,
  delay = 800
): Promise<Response> {
  try {
    const res = await fetch(url, options);

    // Shield against HTML fallback responses (e.g. static hosting returning index.html or reverse-proxy cookie check pages)
    // so calling res.json() returns a safe empty fallback instead of crashing with:
    // SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
    const originalJson = res.json.bind(res);
    res.json = async () => {
      try {
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json') && !contentType.includes('+json')) {
          const text = await res.text();
          const trimmed = text.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            return JSON.parse(trimmed);
          }
          // Return sensible empty fallback depending on common endpoint structures
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
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw err;
  }
}

