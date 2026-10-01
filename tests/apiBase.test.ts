import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiBaseUrl } from '../src/utils/apiBase.ts';

test('same-origin API hosts stay relative', () => {
  assert.equal(resolveApiBaseUrl({ hostname: 'localhost', port: '3000' }), '');
  assert.equal(resolveApiBaseUrl({ hostname: '127.0.0.1', port: '3000', viteApiUrl: 'https://ignored.example' }), '');
  assert.equal(resolveApiBaseUrl({ hostname: 'api.example.run.app', port: '443' }), '');
});

test('static hosts require VITE_API_URL and reject the missing value', () => {
  assert.throws(
    () => resolveApiBaseUrl({ hostname: 'notauseratkali.github.io', port: '' }),
    /VITE_API_URL/
  );
  assert.equal(
    resolveApiBaseUrl({
      hostname: 'notauseratkali.github.io',
      port: '',
      viteApiUrl: 'https://members-api.example.org/'
    }),
    'https://members-api.example.org'
  );
});
