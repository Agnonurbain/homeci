import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Firebase App Check to avoid IndexedDB errors in JSDOM
vi.mock('firebase/app-check', () => ({
  initializeAppCheck: vi.fn(),
  ReCaptchaEnterpriseProvider: vi.fn(),
}));

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock ResizeObserver
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
