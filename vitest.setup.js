import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import 'fake-indexeddb/auto';

// Ensure fresh DOM and storage state between tests.
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

// Polyfill crypto.randomUUID if running on a Node version that doesn't have it
// on globalThis (jsdom uses the Node global).
beforeEach(() => {
  if (!globalThis.crypto) globalThis.crypto = {};
  if (typeof globalThis.crypto.randomUUID !== 'function') {
    let counter = 0;
    globalThis.crypto.randomUUID = () => {
      counter += 1;
      return `test-uuid-${counter}-${Date.now()}`;
    };
  }
});
