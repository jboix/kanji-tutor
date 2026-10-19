import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom's Blob loses its methods through fake-indexeddb's structuredClone; Node's survives it.
globalThis.Blob = NodeBlob as unknown as typeof Blob;

// findBy waits up to 5 s rather than 1 s: lazy chunks load cold in each test file (D70).
configure({ asyncUtilTimeout: 5000 });

// No test may reach Gemini (CLAUDE.md): any request to its host fails loudly.
const realFetch = globalThis.fetch;
const guardedFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.includes('generativelanguage.googleapis.com')) {
    return Promise.reject(new Error(`Blocked a real Gemini call in a test: ${url}`));
  }
  return realFetch(input, init);
};
globalThis.fetch = Object.assign(guardedFetch, { preconnect: realFetch.preconnect });

// Content and message chunks load lazily (D52, D53); let them finish before the file tears down.
afterEach(async () => {
  cleanup();
  // A saved session (R14) must not resume in the next test.
  localStorage.removeItem('kanji-reader:session');
  await vi.dynamicImportSettled();
});
