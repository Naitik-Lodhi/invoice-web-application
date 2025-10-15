// src/test/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mocking URL.createObjectURL
// Yeh zaroori hai kyunki jsdom isko support nahi karta
if (typeof window.URL.createObjectURL === 'undefined') {
  // We use `vi.fn()` to create a dummy function. It will return `undefined` but won't crash.
  Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn() });
}
