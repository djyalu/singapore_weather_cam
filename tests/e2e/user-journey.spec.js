import { test, expect } from '@playwright/test';

/**
 * Core User Journey E2E Tests
 * QA Persona: User experience validation
 * Frontend Persona: Cross-browser compatibility and responsive design
 * Performance Persona: Load time and interaction performance
 */

test.describe('Singapore Weather Cam - Core User Journeys', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set test mode and performance markers
    await page.addInitScript(() => {
      window.testMode = true;
      window.performance.mark('test-start');
    });
    
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test.describe('Page Load and Initial State', () => {
    test('should load main page with all critical sections', async ({ page }) => {
      // Performance: Measure page load time
      const loadStart = Date.now();
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - loadStart;
      
      expect(loadTime).toBeLessThan(5000); // 5s load time budget
      
      // Verify critical sections are present
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="weather-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="webcam-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="map-section"]')).toBeVisible();
      
      // Verify page title and meta information
      await expect(page).toHaveTitle(/Singapore Weather Cam/);
      
      // Check for proper error handling - no JavaScript errors
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.waitForTimeout(2000); // Allow time for any errors to surface
      expect(errors).toHaveLength(0);
    });

    test('should display loading states appropriately', async ({ page }) => {
      // Navigate to page and check for loading indicators
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      // Should show loading indicators initially
      const loadingElements = page.locator('[data-testid*="loading"], .loading, [aria-label*="loading"]');
      const loadingCount = await loadingElements.count();
      
      if (loadingCount > 0) {
        // Wait for loading to complete
        await page.waitForFunction(() => {
          const loadingEls = document.querySelectorAll('[data-testid*="loading"], .loading, [aria-label*="loading"]');
          return loadingEls.length === 0;
        }, { timeout: 10000 });
      }
      
      // Verify content is loaded
      await expect(page.locator('[data-testid="weather-cards"]')).toBeVisible();
      await expect(page.locator('[data-testid="webcam-gallery"]')).toBeVisible();
    });
  });

  test.describe('Weather Data Interaction', () => {
    test('should display weather information correctly', async ({ page }) => {
      // Wait for weather data to load
      await page.waitForSelector('[data-testid="weather-cards"]', { timeout: 10000 });
      
      // Verify weather cards are present
      const weatherCards = page.locator('[data-testid="weather-card"]');
      const cardCount = await weatherCards.count();
      expect(cardCount).toBeGreaterThan(0);
      
      // Check first weather card has required elements
      const firstCard = weatherCards.first();
      await expect(firstCard.locator('text=/°C|°F/')).toBeVisible(); // Temperature
      await expect(firstCard.locator('text=/%/')).toBeVisible(); // Humidity or other percentage
      
      // Verify weather cards have proper hover effects
      await firstCard.hover();
      await expect(firstCard).toHaveClass(/hover:/);
    });

    test('should handle weather data refresh', async ({ page }) => {
      // Wait for initial load
      await page.waitForSelector('[data-testid="weather-cards"]');
      
      // Look for refresh button or auto-refresh indicator
      const refreshButton = page.locator('[data-testid="refresh-weather"], [aria-label*="refresh"]');
      
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
        
        // Should show loading state briefly
        await expect(page.locator('[data-testid="weather-loading"]')).toBeVisible({ timeout: 2000 });
        
        // Should load new data
        await expect(page.locator('[data-testid="weather-loading"]')).not.toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Webcam Gallery Interaction', () => {
    test('should load and display webcam images', async ({ page }) => {
      // Wait for webcam gallery to load
      await page.waitForSelector('[data-testid="webcam-gallery"]', { timeout: 10000 });
      
      // Verify webcam cards are present
      const webcamCards = page.locator('[data-testid="webcam-card"]');
      const cardCount = await webcamCards.count();
      expect(cardCount).toBeGreaterThan(0);
      
      // Check first webcam card has image
      const firstCard = webcamCards.first();
      const image = firstCard.locator('img');
      await expect(image).toBeVisible();
      
      // Verify image has proper alt text
      const altText = await image.getAttribute('alt');
      expect(altText).toBeTruthy();
      expect(altText.length).toBeGreaterThan(0);
    });

    test('should open webcam modal on click', async ({ page }) => {
      // Wait for webcam gallery
      await page.waitForSelector('[data-testid="webcam-gallery"]');
      
      // Click on first webcam card
      const firstCard = page.locator('[data-testid="webcam-card"]').first();
      await firstCard.click();
      
      // Should open modal
      await expect(page.locator('[data-testid="webcam-modal"]')).toBeVisible({ timeout: 5000 });
      
      // Modal should have close button
      const closeButton = page.locator('[data-testid="modal-close"], [aria-label*="close"]');
      await expect(closeButton).toBeVisible();
      
      // Close modal
      await closeButton.click();
      await expect(page.locator('[data-testid="webcam-modal"]')).not.toBeVisible();
    });

    test('should handle webcam image loading errors gracefully', async ({ page }) => {
      // Intercept image requests and simulate errors
      await page.route('**/images/webcam/**', route => {
        route.abort('failed');
      });
      
      await page.goto('/');
      await page.waitForSelector('[data-testid="webcam-gallery"]');
      
      // Should show error states or placeholders
      const errorIndicators = page.locator('[data-testid="webcam-error"], .webcam-error, [alt*="error"]');
      const errorCount = await errorIndicators.count();
      
      // Should have some error handling visible
      expect(errorCount).toBeGreaterThan(0);
    });
  });

  test.describe('Map Interaction', () => {
    test('should display interactive map', async ({ page }) => {
      // Wait for map to load
      await page.waitForSelector('[data-testid="map-container"]', { timeout: 15000 });
      
      // Verify map is interactive
      const mapContainer = page.locator('[data-testid="map-container"]');
      await expect(mapContainer).toBeVisible();
      
      // Try to interact with map (zoom, pan)
      const mapElement = mapContainer.locator('.leaflet-container').first();
      if (await mapElement.isVisible()) {
        // Test map zoom
        await mapElement.click({ position: { x: 200, y: 200 } });
        
        // Look for zoom controls
        const zoomIn = page.locator('.leaflet-control-zoom-in');
        if (await zoomIn.isVisible()) {
          await zoomIn.click();
        }
      }
    });

    test('should show weather station markers', async ({ page }) => {
      // Wait for map to load
      await page.waitForSelector('[data-testid="map-container"]', { timeout: 15000 });
      
      // Look for weather station markers
      const markers = page.locator('.leaflet-marker-icon, [data-testid="weather-marker"]');
      const markerCount = await markers.count();
      
      if (markerCount > 0) {
        // Click on first marker to see popup
        await markers.first().click();
        
        // Should show popup with station info
        const popup = page.locator('.leaflet-popup, [data-testid="station-popup"]');
        await expect(popup).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Navigation and Layout', () => {
    test('should have proper navigation structure', async ({ page }) => {
      // Check for main navigation elements
      const header = page.locator('[data-testid="header"], header');
      await expect(header).toBeVisible();
      
      // Check for section navigation or anchors
      const navLinks = page.locator('nav a, [data-testid="nav-link"]');
      const linkCount = await navLinks.count();
      
      if (linkCount > 0) {
        // Test navigation link functionality
        const firstLink = navLinks.first();
        await firstLink.click();
        
        // Should scroll to or navigate to appropriate section
        await page.waitForTimeout(1000); // Allow for scroll/navigation
      }
    });

    test('should handle scroll interactions smoothly', async ({ page }) => {
      // Test smooth scrolling through sections
      const sections = page.locator('[data-testid*="section"]');
      const sectionCount = await sections.count();
      
      if (sectionCount > 1) {
        // Scroll through sections
        for (let i = 0; i < Math.min(sectionCount, 3); i++) {
          await sections.nth(i).scrollIntoViewIfNeeded();
          await page.waitForTimeout(500); // Allow for smooth scroll
        }
      }
      
      // Test scroll to top
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work properly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload({ waitUntil: 'networkidle' });
      
      // Verify mobile layout
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="weather-section"]')).toBeVisible();
      
      // Check for mobile-specific elements (hamburger menu, etc.)
      const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu');
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();
        // Should expand navigation
        await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
      }
      
      // Test touch interactions
      const weatherCard = page.locator('[data-testid="weather-card"]').first();
      if (await weatherCard.isVisible()) {
        await weatherCard.tap();
      }
    });

    test('should adapt to tablet layout', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload({ waitUntil: 'networkidle' });
      
      // Verify tablet layout adaptations
      await expect(page.locator('[data-testid="weather-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="webcam-section"]')).toBeVisible();
      
      // Check grid layouts adapt properly
      const weatherCards = page.locator('[data-testid="weather-card"]');
      const cardCount = await weatherCards.count();
      
      if (cardCount >= 2) {
        // Verify cards are arranged appropriately for tablet
        const firstCard = weatherCards.first();
        const secondCard = weatherCards.nth(1);
        
        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();
        
        // Cards should be side by side or properly spaced
        expect(Math.abs(firstBox.y - secondBox.y)).toBeLessThan(firstBox.height);
      }
    });
  });

  test.describe('Performance Validation', () => {
    test('should meet performance budgets', async ({ page }) => {
      // Enable performance monitoring
      await page.addInitScript(() => {
        window.performance.mark('navigation-start');
      });
      
      const startTime = Date.now();
      await page.goto('/', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      // Performance budgets from config
      expect(loadTime).toBeLessThan(5000); // 5s total load time
      
      // Check for First Contentful Paint
      const fcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
            if (fcpEntry) {
              resolve(fcpEntry.startTime);
            }
          }).observe({ entryTypes: ['paint'] });
          
          setTimeout(() => resolve(null), 5000);
        });
      });
      
      if (fcp) {
        expect(fcp).toBeLessThan(3000); // 3s FCP budget
      }
    });

    test('should handle concurrent data loading efficiently', async ({ page }) => {
      // Monitor network requests
      const requestPromises = [];
      page.on('request', request => {
        if (request.url().includes('/data/')) {
          requestPromises.push(request);
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Should have made API requests for weather and webcam data
      expect(requestPromises.length).toBeGreaterThan(0);
      expect(requestPromises.length).toBeLessThan(20); // Not too many requests
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network failures gracefully', async ({ page }) => {
      // Simulate network failure
      await page.setOfflineMode(true);
      
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      // Should show appropriate error messages
      await page.waitForTimeout(5000); // Allow time for error states
      
      const errorMessages = page.locator('[data-testid*="error"], .error-message, [role="alert"]');
      const errorCount = await errorMessages.count();
      
      expect(errorCount).toBeGreaterThan(0);
      
      // Restore network
      await page.setOfflineMode(false);
    });

    test('should recover from temporary API failures', async ({ page }) => {
      // Intercept API calls and simulate failures
      let failCount = 0;
      await page.route('**/data/**', route => {
        failCount++;
        if (failCount <= 2) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });
      
      await page.goto('/');
      
      // Should eventually recover and show data
      await expect(page.locator('[data-testid="weather-cards"]')).toBeVisible({ timeout: 15000 });
      
      // Should have attempted retries
      expect(failCount).toBeGreaterThan(1);
    });
  });
});