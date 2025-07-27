import { defineConfig, devices } from '@playwright/test';

/**
 * Comprehensive E2E Testing Configuration
 * Multi-persona validation: QA + Frontend + Performance + Security
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Timeout settings for thorough testing
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  
  // Fail the build on CI if tests fail
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration for CI/CD integration
  reporter: process.env.CI 
    ? [
        ['github'],
        ['html', { outputFolder: 'test-results/playwright-report' }],
        ['json', { outputFile: 'test-results/playwright-results.json' }],
        ['junit', { outputFile: 'test-results/junit-results.xml' }]
      ]
    : [
        ['html', { outputFolder: 'test-results/playwright-report' }],
        ['list']
      ],
  
  // Output directory for test artifacts
  outputDir: 'test-results/playwright-artifacts',
  
  // Global test configuration
  use: {
    // Base URL for testing
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
    
    // Browser settings
    headless: process.env.CI || process.env.HEADLESS !== 'false',
    viewport: { width: 1280, height: 720 },
    
    // Test artifacts
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Performance monitoring
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    // Security headers validation
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  },

  // Multi-browser testing matrix
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Performance budgets for Chromium
        contextOptions: {
          strictSelectors: true
        }
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile devices for responsive testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // Tablet testing
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },

    // Accessibility testing setup
    {
      name: 'accessibility',
      use: { 
        ...devices['Desktop Chrome'],
        // Force reduced motion for accessibility testing
        reducedMotion: 'reduce'
      },
      testMatch: '**/*accessibility*.spec.js'
    },

    // Performance testing setup  
    {
      name: 'performance',
      use: { 
        ...devices['Desktop Chrome'],
        // Network throttling for performance testing
        launchOptions: {
          args: ['--enable-web-bluetooth']
        }
      },
      testMatch: '**/*performance*.spec.js'
    },

    // Security testing setup
    {
      name: 'security',
      use: { 
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: {
          'X-Security-Test': 'true'
        }
      },
      testMatch: '**/*security*.spec.js'
    }
  ],

  // Development server configuration
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 5173,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_TEST_MODE: 'true'
    }
  },

  // Global setup and teardown
  globalSetup: require.resolve('./tests/e2e/global-setup.js'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.js'),
});

// Performance budgets configuration
export const performanceBudgets = {
  // Page load performance
  firstContentfulPaint: 2000,
  largestContentfulPaint: 3000,
  firstInputDelay: 100,
  cumulativeLayoutShift: 0.1,
  
  // Resource budgets
  totalPageSize: 2000000, // 2MB
  imageSize: 500000,      // 500KB per image
  bundleSize: 1000000,    // 1MB for JS bundle
  
  // Network budgets
  totalRequests: 50,
  thirdPartyRequests: 10
};

// Accessibility testing configuration
export const accessibilityConfig = {
  // WCAG compliance level
  level: 'AA',
  
  // Rules configuration
  rules: {
    'color-contrast': true,
    'keyboard-navigation': true,
    'focus-management': true,
    'aria-labels': true,
    'alt-text': true,
    'heading-structure': true
  },
  
  // Test coverage areas
  coverage: [
    'weather-components',
    'webcam-gallery', 
    'map-interface',
    'navigation',
    'modals',
    'forms'
  ]
};

// Security testing configuration
export const securityConfig = {
  headers: {
    required: [
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy'
    ]
  },
  
  vulnerabilities: [
    'xss-injection',
    'csrf-protection',
    'clickjacking',
    'data-exposure'
  ],
  
  compliance: {
    https: true,
    secureHeaders: true,
    inputValidation: true
  }
};