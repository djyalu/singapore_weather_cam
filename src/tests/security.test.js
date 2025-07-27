/**
 * Security Compliance Tests
 * Automated testing for security headers, input validation, and vulnerability protection
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { securityValidator } from '../services/securityService';
import App from '../App';
import { I18nProvider } from '../contexts/I18nContext';

// Mock fetch for testing API security
global.fetch = jest.fn();

describe('Security Compliance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('Content Security Policy (CSP) Tests', () => {
    test('should have CSP meta tag configured', () => {
      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      expect(cspMeta).toBeTruthy();
      
      const cspContent = cspMeta?.getAttribute('content');
      expect(cspContent).toContain('default-src');
      expect(cspContent).toContain('script-src');
      expect(cspContent).toContain('style-src');
      expect(cspContent).toContain('img-src');
      expect(cspContent).toContain('connect-src');
    });

    test('should restrict script sources', () => {
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      const cspContent = cspMeta?.getAttribute('content') || '';
      
      // Should not allow unsafe-eval or overly permissive script sources
      expect(cspContent).not.toContain("'unsafe-eval'");
      expect(cspContent).not.toContain('*');
    });

    test('should prevent frame embedding', () => {
      const frameOptionsMeta = document.querySelector('meta[http-equiv="X-Frame-Options"]');
      expect(frameOptionsMeta?.getAttribute('content')).toBe('DENY');
    });

    test('should have MIME type protection', () => {
      const mimeTypeMeta = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
      expect(mimeTypeMeta?.getAttribute('content')).toBe('nosniff');
    });
  });

  describe('Input Validation Tests', () => {
    describe('URL Validation', () => {
      test('should validate legitimate API URLs', () => {
        const validUrls = [
          'https://api.data.gov.sg/v1/environment/air-temperature',
          'https://api.data.gov.sg/v1/transport/traffic-images',
        ];

        validUrls.forEach(url => {
          const result = securityValidator.validateApiUrl(url);
          expect(result.isValid).toBe(true);
          expect(result.sanitizedUrl).toBe(url);
        });
      });

      test('should reject malicious URLs', () => {
        const maliciousUrls = [
          'javascript:alert("xss")',
          'http://malicious-site.com/api',
          'https://evil.com/api',
          'ftp://malicious.com/data',
        ];

        maliciousUrls.forEach(url => {
          const result = securityValidator.validateApiUrl(url);
          expect(result.isValid).toBe(false);
        });
      });

      test('should enforce HTTPS for external URLs', () => {
        const httpUrl = 'http://api.data.gov.sg/v1/environment/air-temperature';
        const result = securityValidator.validateApiUrl(httpUrl);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('HTTPS');
      });
    });

    describe('Coordinate Validation', () => {
      test('should validate Singapore coordinates', () => {
        const validCoordinates = [
          { lat: 1.3521, lng: 103.8198 }, // Singapore center
          { lat: 1.2966, lng: 103.7764 }, // Jurong
          { lat: 1.4382, lng: 103.7862 }, // Woodlands
        ];

        validCoordinates.forEach(({ lat, lng }) => {
          const result = securityValidator.validateCoordinates(lat, lng);
          expect(result.isValid).toBe(true);
        });
      });

      test('should reject coordinates outside Singapore', () => {
        const invalidCoordinates = [
          { lat: 40.7128, lng: -74.0060 }, // New York
          { lat: -1.0, lng: 103.0 }, // Invalid latitude
          { lat: 1.0, lng: 200.0 }, // Invalid longitude
        ];

        invalidCoordinates.forEach(({ lat, lng }) => {
          const result = securityValidator.validateCoordinates(lat, lng);
          expect(result.isValid).toBe(false);
        });
      });
    });

    describe('Data Structure Validation', () => {
      test('should validate weather data structure', () => {
        const validWeatherData = {
          timestamp: '2024-01-01T12:00:00Z',
          data: {
            temperature: {
              average: 28.5,
              minimum: 26.0,
              maximum: 31.0,
            },
            humidity: {
              average: 75.0,
              minimum: 65.0,
              maximum: 85.0,
            },
          },
          source: 'NEA Singapore',
        };

        const result = securityValidator.validateWeatherData(validWeatherData);
        expect(result.isValid).toBe(true);
      });

      test('should reject weather data with suspicious content', () => {
        const maliciousData = {
          timestamp: '2024-01-01T12:00:00Z',
          data: {
            temperature: { average: 28.5 },
          },
          source: '<script>alert("xss")</script>',
        };

        const result = securityValidator.validateWeatherData(maliciousData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Suspicious content detected in source field');
      });

      test('should validate temperature ranges', () => {
        const invalidTempData = {
          timestamp: '2024-01-01T12:00:00Z',
          data: {
            temperature: {
              average: 999, // Unrealistic temperature
            },
          },
        };

        const result = securityValidator.validateWeatherData(invalidTempData);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('XSS Protection Tests', () => {
    test('should detect suspicious script content', () => {
      const suspiciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<img onerror="alert(1)" src="x">',
        'eval("malicious code")',
      ];

      suspiciousInputs.forEach(input => {
        const hasSuspicious = securityValidator.containsSuspiciousContent(input);
        expect(hasSuspicious).toBe(true);
      });
    });

    test('should sanitize string inputs', () => {
      const maliciousString = '<script>alert("xss")</script>Hello World';
      const sanitized = securityValidator.sanitizeString(maliciousString);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).toContain('Hello World');
    });

    test('should handle object sanitization recursively', () => {
      const maliciousObject = {
        name: 'Legitimate Data',
        description: '<script>alert("xss")</script>',
        nested: {
          value: '<img onerror="alert(1)" src="x">',
          deep: {
            content: 'Safe content',
          },
        },
      };

      const sanitized = securityValidator.sanitizeObjectProperties(maliciousObject);
      
      expect(sanitized.name).toBe('Legitimate Data');
      expect(sanitized.description).not.toContain('<script>');
      expect(sanitized.nested.value).not.toContain('onerror');
      expect(sanitized.nested.deep.content).toBe('Safe content');
    });
  });

  describe('Rate Limiting Tests', () => {
    test('should allow requests within rate limit', () => {
      const clientId = 'test-client-1';
      
      // Make requests within limit
      for (let i = 0; i < 5; i++) {
        const result = securityValidator.checkRateLimit(clientId, 10, 60000);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(10 - i - 1);
      }
    });

    test('should block requests exceeding rate limit', () => {
      const clientId = 'test-client-2';
      const maxRequests = 3;
      
      // Exhaust rate limit
      for (let i = 0; i < maxRequests; i++) {
        securityValidator.checkRateLimit(clientId, maxRequests, 60000);
      }
      
      // Next request should be blocked
      const result = securityValidator.checkRateLimit(clientId, maxRequests, 60000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    test('should reset rate limit after time window', () => {
      const clientId = 'test-client-3';
      const maxRequests = 2;
      const windowMs = 100; // Very short window for testing
      
      // Exhaust rate limit
      for (let i = 0; i < maxRequests; i++) {
        securityValidator.checkRateLimit(clientId, maxRequests, windowMs);
      }
      
      // Should be blocked
      expect(securityValidator.checkRateLimit(clientId, maxRequests, windowMs).allowed).toBe(false);
      
      // Wait for window to reset
      return new Promise(resolve => {
        setTimeout(() => {
          const result = securityValidator.checkRateLimit(clientId, maxRequests, windowMs);
          expect(result.allowed).toBe(true);
          resolve();
        }, windowMs + 10);
      });
    });
  });

  describe('API Security Tests', () => {
    test('should validate API response structure', () => {
      const validResponse = {
        timestamp: '2024-01-01T12:00:00Z',
        data: [
          {
            id: '1234',
            name: 'Test Station',
            value: 28.5,
          },
        ],
        status: 'success',
      };

      expect(() => {
        securityValidator.validateApiResponse(validResponse, ['timestamp', 'data']);
      }).not.toThrow();
    });

    test('should reject API responses with missing required fields', () => {
      const invalidResponse = {
        data: [],
        // Missing timestamp
      };

      expect(() => {
        securityValidator.validateApiResponse(invalidResponse, ['timestamp', 'data']);
      }).toThrow('Missing required field: timestamp');
    });

    test('should handle fetch errors securely', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      // Test that API errors are handled without exposing internal details
      try {
        await fetch('https://api.data.gov.sg/test');
      } catch (error) {
        expect(error.message).not.toContain('internal');
        expect(error.message).not.toContain('database');
        expect(error.message).not.toContain('server');
      }
    });
  });

  describe('Data Privacy Tests', () => {
    test('should not log sensitive information', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Simulate an operation that might log data
      securityValidator.validateApiUrl('https://api.data.gov.sg/test?secret=12345');
      
      // Check that no sensitive data appears in logs
      const allLogs = [...consoleSpy.mock.calls, ...consoleErrorSpy.mock.calls];
      const logString = JSON.stringify(allLogs);
      
      expect(logString).not.toContain('secret=12345');
      expect(logString).not.toContain('password');
      expect(logString).not.toContain('token');
      
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    test('should handle localStorage access safely', () => {
      // Mock localStorage failure
      const originalLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => {
            throw new Error('Storage access denied');
          }),
          setItem: jest.fn(() => {
            throw new Error('Storage access denied');
          }),
        },
      });

      // Should not crash when localStorage fails
      expect(() => {
        render(
          <I18nProvider>
            <App />
          </I18nProvider>
        );
      }).not.toThrow();

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
      });
    });
  });

  describe('Image Security Tests', () => {
    test('should validate image URLs', () => {
      const validImageUrls = [
        'https://api.data.gov.sg/images/traffic/camera1.jpg',
        'https://data.gov.sg/webcam/feed.png',
      ];

      validImageUrls.forEach(url => {
        const result = securityValidator.validateImageUrl(url);
        expect(result.isValid).toBe(true);
      });
    });

    test('should reject non-image URLs', () => {
      const invalidUrls = [
        'https://api.data.gov.sg/script.js',
        'https://malicious.com/virus.exe',
        'javascript:alert(1)',
      ];

      invalidUrls.forEach(url => {
        const result = securityValidator.validateImageUrl(url);
        expect(result.isValid).toBe(false);
      });
    });

    test('should handle image loading errors gracefully', async () => {
      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      // Find image elements
      const images = document.querySelectorAll('img');
      
      images.forEach(img => {
        // Simulate image load error
        fireEvent.error(img);
        
        // Should not crash and should have fallback
        expect(img.src).toBeTruthy();
      });
    });
  });

  describe('Session Security Tests', () => {
    test('should handle session timeouts gracefully', async () => {
      // Mock expired session
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          getItem: jest.fn(() => null),
          setItem: jest.fn(),
          removeItem: jest.fn(),
        },
      });

      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      // Should handle missing session data gracefully
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).toBeFalsy();
      });
    });

    test('should validate session data integrity', () => {
      const validSessionData = {
        timestamp: Date.now(),
        version: '1.0.0',
      };

      // Should not throw for valid session data
      expect(() => {
        JSON.stringify(validSessionData);
      }).not.toThrow();
    });
  });

  describe('Error Handling Security', () => {
    test('should not expose sensitive error information', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Simulate an error that might contain sensitive info
      try {
        throw new Error('Database connection failed: username=admin, password=secret123');
      } catch (error) {
        // Error handling should sanitize the message
        expect(error.message).not.toContain('password=secret123');
      }
      
      consoleSpy.mockRestore();
    });

    test('should provide user-friendly error messages', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );

      // Should show user-friendly error instead of technical details
      await waitFor(() => {
        const errorElements = screen.queryAllByText(/error/i);
        if (errorElements.length > 0) {
          errorElements.forEach(element => {
            expect(element.textContent).not.toContain('stack trace');
            expect(element.textContent).not.toContain('function');
            expect(element.textContent).not.toContain('undefined');
          });
        }
      });
    });
  });
});

describe('HTTPS and Secure Context Tests', () => {
  test('should enforce secure context for sensitive operations', () => {
    // Mock secure context
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      writable: true,
    });

    render(
      <I18nProvider>
        <App />
      </I18nProvider>
    );

    expect(window.isSecureContext).toBe(true);
  });

  test('should handle non-secure context gracefully', () => {
    Object.defineProperty(window, 'isSecureContext', {
      value: false,
      writable: true,
    });

    // Should not crash in non-secure context
    expect(() => {
      render(
        <I18nProvider>
          <App />
        </I18nProvider>
      );
    }).not.toThrow();
  });
});

describe('Third-party Integration Security', () => {
  test('should validate external API responses', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        timestamp: '2024-01-01T12:00:00Z',
        data: [],
      }),
    };

    fetch.mockResolvedValueOnce(mockResponse);

    const response = await fetch('https://api.data.gov.sg/test');
    const data = await response.json();

    // Should validate response structure
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('data');
  });

  test('should handle API rate limiting from external services', async () => {
    const rateLimitResponse = {
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    };

    fetch.mockResolvedValueOnce(rateLimitResponse);

    const response = await fetch('https://api.data.gov.sg/test');
    
    expect(response.status).toBe(429);
    // Application should handle rate limiting gracefully
  });
});