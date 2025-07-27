import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global test setup for React components testing

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_APP_VERSION: '1.0.0',
    VITE_TEST_MODE: 'true',
    MODE: 'test',
    DEV: false,
    PROD: false,
    SSR: false
  },
  writable: true
});

// Mock ResizeObserver (used by Chart.js and other components)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver (used for performance monitoring)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock matchMedia (used for responsive design testing)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage for testing
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock sessionStorage for testing
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
});

// Mock fetch for API testing
global.fetch = vi.fn();

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Uncomment below to suppress console.log in tests
  // log: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock Leaflet for map testing
vi.mock('leaflet', () => ({
  map: vi.fn(() => ({
    setView: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    remove: vi.fn(),
  })),
  tileLayer: vi.fn(() => ({
    addTo: vi.fn(),
  })),
  marker: vi.fn(() => ({
    addTo: vi.fn(),
    bindPopup: vi.fn(),
    openPopup: vi.fn(),
  })),
  icon: vi.fn(),
  divIcon: vi.fn(),
}));

// Mock Chart.js for chart testing
vi.mock('chart.js', () => ({
  Chart: vi.fn(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    resize: vi.fn(),
  })),
  registerables: [],
}));

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Line: vi.fn(() => null),
  Bar: vi.fn(() => null),
  Doughnut: vi.fn(() => null),
}));

// Performance marks mock for performance testing
global.performance = {
  ...global.performance,
  mark: vi.fn(),
  measure: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  getEntriesByType: vi.fn(),
  getEntriesByName: vi.fn(),
  now: vi.fn(() => Date.now()),
};

// Mock Image for webcam testing
global.Image = class {
  constructor() {
    setTimeout(() => {
      this.onload && this.onload();
    }, 100);
  }
};

// Error boundary testing helper
global.suppressErrorBoundaryWarnings = () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });
};

// Accessibility testing setup
global.axeConfig = {
  rules: {
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'focus-management': { enabled: true },
    'aria-usage': { enabled: true },
  }
};

// Test utilities for common patterns
global.testUtils = {
  // Wait for async operations
  waitFor: async (callback, timeout = 5000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        await callback();
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    throw new Error(`Timeout after ${timeout}ms`);
  },
  
  // Mock API responses
  mockApiResponse: (data, status = 200) => {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    });
  },
  
  // Performance testing helpers
  measureRenderTime: async (renderFn) => {
    const start = performance.now();
    await renderFn();
    const end = performance.now();
    return end - start;
  },
};

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
  
  // Reset localStorage and sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();
  
  // Reset console mocks
  console.warn.mockClear?.();
  console.error.mockClear?.();
});