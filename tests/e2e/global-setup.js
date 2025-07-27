import { chromium } from '@playwright/test';

/**
 * Global Setup for E2E Tests
 * QA Persona: Environment preparation and validation
 * DevOps Persona: Infrastructure setup and monitoring
 */

async function globalSetup() {
  console.log('🚀 Starting E2E test environment setup...');
  
  try {
    // Launch browser for setup validation
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Validate test environment is accessible
    const baseURL = process.env.TEST_BASE_URL || 'http://localhost:5173';
    console.log(`🌐 Testing accessibility of: ${baseURL}`);
    
    try {
      await page.goto(baseURL, { waitUntil: 'networkidle' });
      console.log('✅ Test environment is accessible');
    } catch (error) {
      console.error(`❌ Test environment not accessible: ${error.message}`);
      throw new Error(`Cannot access test environment at ${baseURL}`);
    }
    
    // Validate required APIs are responsive
    const healthChecks = [
      '/data/weather/latest.json',
      '/data/webcam/latest.json'
    ];
    
    for (const endpoint of healthChecks) {
      try {
        const response = await page.goto(`${baseURL}${endpoint}`);
        if (response.ok()) {
          console.log(`✅ API endpoint accessible: ${endpoint}`);
        } else {
          console.log(`⚠️  API endpoint not ready: ${endpoint} (${response.status()})`);
        }
      } catch (error) {
        console.log(`⚠️  API endpoint error: ${endpoint} - ${error.message}`);
      }
    }
    
    // Setup test data directory
    await page.evaluate(() => {
      localStorage.setItem('e2e-test-mode', 'true');
      sessionStorage.setItem('test-session', Date.now().toString());
    });
    
    // Validate critical page elements load
    await page.waitForSelector('[data-testid="app-layout"]', { timeout: 10000 });
    console.log('✅ Critical page elements are loading');
    
    await browser.close();
    console.log('🎯 E2E test environment setup complete');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error.message);
    throw error;
  }
}

export default globalSetup;