export interface ApiBaseInput {
  hostname: string;
  port: string;
  origin?: string;
  viteApiUrl?: string;
}

/**
 * Returns '' when the caller should use a relative /api URL.
 * The UI and API are the same server for local dev, `npm start` on any PORT, and Cloud Run.
 * A static host such as GitHub Pages must set VITE_API_URL at build time.
 */
export function resolveApiBaseUrl(input: ApiBaseInput): string {
  const host = input.hostname || '';
  const configured = (input.viteApiUrl || '').trim().replace(/\/$/, '');
  const origin = (input.origin || '').replace(/\/$/, '');

  if (configured && origin && origin === configured) return '';

  if (configured && !isSameProcessHost(host)) return configured;

  if (!configured && host.endsWith('github.io')) {
    throw new Error(
      'VITE_API_URL is not set. This static build cannot reach the membership API. Set VITE_API_URL to the public API origin with no trailing slash, then rebuild. See README.md.'
    );
  }

  return '';
}

function isSameProcessHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('run.app');
}

export function resolveApiBase(): string {
  return resolveApiBaseUrl({
    hostname: window.location.hostname,
    port: window.location.port,
    origin: window.location.origin,
    viteApiUrl: import.meta.env.VITE_API_URL
  });
}
