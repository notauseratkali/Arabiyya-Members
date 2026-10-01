export interface ApiBaseInput {
  hostname: string;
  port: string;
  viteApiUrl?: string;
}

/**
 * Relative API calls stay on the same origin when this page is served by the API
 * (Cloud Run, or local `npm run dev` on port 3000).
 * Static hosts such as GitHub Pages must set VITE_API_URL at build time.
 * Returns '' when the caller should use a relative URL.
 */
export function resolveApiBaseUrl(input: ApiBaseInput): string {
  const host = input.hostname || '';
  const sameOriginApi =
    host.endsWith('run.app') ||
    ((host === 'localhost' || host === '127.0.0.1') && input.port === '3000');
  if (sameOriginApi) return '';

  const configured = (input.viteApiUrl || '').trim().replace(/\/$/, '');
  if (!configured) {
    throw new Error(
      'VITE_API_URL is not set. This static build cannot reach the membership API. Set VITE_API_URL to the public API origin with no trailing slash, then rebuild. See README.md.'
    );
  }
  return configured;
}

export function resolveApiBase(): string {
  return resolveApiBaseUrl({
    hostname: window.location.hostname,
    port: window.location.port,
    viteApiUrl: import.meta.env.VITE_API_URL
  });
}
