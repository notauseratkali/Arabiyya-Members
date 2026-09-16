import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Global fetch interceptor to automatically route API calls to the live Cloud Run server when hosted on static sites like GitHub Pages
try {
  const originalFetch = window.fetch;
  const interceptedFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input && typeof input === 'object' && 'url' in input) {
      url = (input as Request).url;
    }

    // If the request is a relative API endpoint
    if (url.startsWith('/api/') || (url.startsWith(window.location.origin) && url.includes('/api/'))) {
      const isGitHubPages = window.location.hostname.endsWith('github.io');
      const isLocalStaticClient = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3000';
      
      if (isGitHubPages || isLocalStaticClient) {
        const backendBaseUrl = 'https://ais-pre-3p7277s77hvbctq7twyfeq-778604401758.asia-southeast1.run.app';
        const cleanPath = url.startsWith('/api/') ? url : url.substring(window.location.origin.length);
        url = `${backendBaseUrl}${cleanPath}`;
      }
    }

    if (typeof input === 'string') {
      return originalFetch(url, init);
    } else if (input instanceof URL) {
      return originalFetch(new URL(url), init);
    } else {
      // If it's a Request object, clone and rewrite the URL
      const newRequest = new Request(url, input as RequestInfo);
      return originalFetch(newRequest, init);
    }
  };

  try {
    window.fetch = interceptedFetch;
  } catch (assignError) {
    // If standard assignment fails because window.fetch has only a getter, try Object.defineProperty as a fallback
    Object.defineProperty(window, 'fetch', {
      value: interceptedFetch,
      configurable: true,
      writable: true,
      enumerable: true
    });
  }
} catch (error) {
  console.warn('[Fetch Interceptor Warning]: Global window.fetch could not be redefined due to environment sandbox restrictions.', error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
