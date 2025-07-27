import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.js'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        'public/',
        'scripts/',
        '**/*.config.js',
        '**/*.config.ts',
        '**/test-utils.js',
        '**/mock-*.js',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 80,
          statements: 80
        },
        // Critical components require higher coverage
        './src/components/weather/': {
          branches: 80,
          functions: 80,
          lines: 90,
          statements: 90
        },
        './src/components/webcam/': {
          branches: 80,
          functions: 80,
          lines: 90,
          statements: 90
        },
        './src/utils/': {
          branches: 85,
          functions: 85,
          lines: 95,
          statements: 95
        }
      }
    },
    // Performance budgets for tests
    testTimeout: 10000,
    hookTimeout: 10000,
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,jsx}',
      'tests/**/*.{test,spec}.{js,jsx}'
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'coverage/',
      'public/',
      'scripts/',
      '**/*.config.js'
    ],
    // Reporters for different environments
    reporter: process.env.CI ? ['json', 'github-actions'] : ['verbose', 'html'],
    outputFile: {
      json: './test-results/vitest-results.json',
      html: './test-results/vitest-report.html'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@tests': resolve(__dirname, './tests')
    }
  },
  define: {
    // Environment variables for testing
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0'),
    'import.meta.env.VITE_TEST_MODE': JSON.stringify('true')
  }
});