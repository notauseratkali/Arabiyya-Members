/**
 * A highly resilient fetch wrapper with automatic exponential backoff retries.
 * Prevents transient network or server startup/restart failures (e.g., "TypeError: Failed to fetch")
 * from breaking critical startup configurations in the browser.
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 3,
  delay = 1000
): Promise<Response> {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err) {
    if (retries > 0) {
      console.warn(`Fetch to ${url} failed. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw err;
  }
}
