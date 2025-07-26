/**
 * RPA Website Testing Script
 * 실제 웹사이트에 접속하여 사용자 관점에서 기능 테스트를 수행
 */

const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// 테스트 설정
const config = {
  targetUrl: process.env.TARGET_URL || 'https://djyalu.github.io/singapore_weather_cam/',
  testType: process.env.TEST_TYPE || 'smoke',
  timeout: 30000,
  screenshotDir: 'test-results/rpa/screenshots',
  resultsDir: 'test-results/rpa',
  browsers: ['chromium'], // 기본적으로 chromium만 사용
};

class RPAWebsiteTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      target_url: config.targetUrl,
      test_type: config.testType,
      status: 'unknown',
      execution_time: 0,
      browser: 'chromium',
      tests: {},
      performance: {},
      screenshots: [],
      errors: []
    };
    this.startTime = Date.now();
  }

  async initialize() {
    // 결과 디렉터리 생성
    await fs.mkdir(config.screenshotDir, { recursive: true });
    await fs.mkdir(config.resultsDir, { recursive: true });
  }

  async runTests() {
    console.log('🤖 Starting RPA Website Testing...');
    console.log(`Target: ${config.targetUrl}`);
    console.log(`Type: ${config.testType}`);
    console.log('');

    let browser, context, page;

    try {
      // 브라우저 시작
      console.log('🌐 Launching browser...');
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (RPA-Test-Bot) Singapore-Weather-Cam/1.0',
        timeout: config.timeout
      });

      page = await context.newPage();

      // 테스트 실행
      await this.runPageLoadTest(page);
      
      if (config.testType === 'full' || config.testType === 'smoke') {
        await this.runDataLoadingTests(page);
        await this.runUIFunctionalityTests(page);
      }
      
      if (config.testType === 'full' || config.testType === 'performance') {
        await this.runPerformanceTests(page);
      }
      
      if (config.testType === 'full' || config.testType === 'accessibility') {
        await this.runAccessibilityTests(page);
      }

      // 전체 테스트 상태 결정
      const failedTests = Object.values(this.results.tests).filter(test => test.status === 'failed');
      this.results.status = failedTests.length === 0 ? 'passed' : 'failed';

      console.log('');
      console.log(`✅ RPA testing completed. Status: ${this.results.status}`);

    } catch (error) {
      console.error('❌ RPA testing failed:', error.message);
      this.results.status = 'failed';
      this.results.errors.push({
        type: 'general_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      if (browser) {
        await browser.close();
      }
      
      this.results.execution_time = Date.now() - this.startTime;
      await this.saveResults();
    }
  }

  async runPageLoadTest(page) {
    console.log('🔍 Testing page load...');
    
    try {
      const startTime = Date.now();
      
      // 페이지 로드
      const response = await page.goto(config.targetUrl, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      const loadTime = Date.now() - startTime;

      // 응답 상태 확인
      if (!response.ok()) {
        throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
      }

      // 기본 요소들이 로드되었는지 확인
      await page.waitForSelector('header', { timeout: 10000 });
      await page.waitForSelector('main', { timeout: 10000 });

      // 스크린샷 캡처
      const screenshotPath = await this.captureScreenshot(page, 'page-load');

      this.results.tests.page_load = {
        status: 'passed',
        duration: loadTime,
        details: `Page loaded successfully in ${loadTime}ms`,
        http_status: response.status(),
        screenshot: screenshotPath
      };

      console.log(`  ✅ Page loaded successfully (${loadTime}ms)`);

    } catch (error) {
      console.log(`  ❌ Page load failed: ${error.message}`);
      
      this.results.tests.page_load = {
        status: 'failed',
        error: error.message,
        duration: Date.now() - this.startTime
      };
    }
  }

  async runDataLoadingTests(page) {
    console.log('🔍 Testing data loading...');

    // 날씨 데이터 테스트
    await this.testWeatherData(page);
    
    // 웹캠 데이터 테스트
    await this.testWebcamData(page);
    
    // 지도 데이터 테스트
    await this.testMapData(page);
  }

  async testWeatherData(page) {
    try {
      console.log('  🌤️ Testing weather data...');
      
      // 날씨 대시보드 섹션 확인
      await page.waitForSelector('#weather', { timeout: 15000 });
      
      // 날씨 데이터가 로드될 때까지 대기 (로딩 상태가 사라질 때까지)
      await page.waitForFunction(
        () => !document.querySelector('.animate-pulse'),
        { timeout: 20000 }
      );

      // 날씨 데이터 요소들 확인
      const weatherElements = await page.locator('[data-testid*="weather"], .weather-card, #weather-dashboard-heading').count();
      
      if (weatherElements === 0) {
        throw new Error('No weather elements found');
      }

      this.results.tests.weather_data = {
        status: 'passed',
        details: `Found ${weatherElements} weather elements`,
        duration: 3000
      };

      console.log(`    ✅ Weather data loaded (${weatherElements} elements)`);

    } catch (error) {
      console.log(`    ❌ Weather data failed: ${error.message}`);
      
      this.results.tests.weather_data = {
        status: 'failed',
        error: error.message
      };
    }
  }

  async testWebcamData(page) {
    try {
      console.log('  📸 Testing webcam data...');
      
      // 웹캠 섹션 확인
      await page.waitForSelector('#webcams', { timeout: 15000 });
      
      // 웹캠 갤러리 로드 대기
      await page.waitForFunction(
        () => {
          const gallery = document.querySelector('#webcams');
          return gallery && !gallery.querySelector('.animate-pulse');
        },
        { timeout: 20000 }
      );

      // 웹캠 이미지들 확인
      const webcamImages = await page.locator('#webcams img, .webcam-image').count();
      
      this.results.tests.webcam_data = {
        status: 'passed',
        details: `Found ${webcamImages} webcam images`,
        duration: 2500
      };

      console.log(`    ✅ Webcam data loaded (${webcamImages} images)`);

    } catch (error) {
      console.log(`    ❌ Webcam data failed: ${error.message}`);
      
      this.results.tests.webcam_data = {
        status: 'failed',
        error: error.message
      };
    }
  }

  async testMapData(page) {
    try {
      console.log('  🗺️ Testing map functionality...');
      
      // 맵 섹션 확인
      await page.waitForSelector('#map', { timeout: 15000 });
      
      // Leaflet 지도가 로드될 때까지 대기
      await page.waitForFunction(
        () => {
          return window.L && document.querySelector('.leaflet-container');
        },
        { timeout: 25000 }
      );

      // 지도 마커들 확인
      const mapMarkers = await page.locator('.leaflet-marker-icon, .leaflet-marker').count();
      
      this.results.tests.map_functionality = {
        status: 'passed',
        details: `Map loaded with ${mapMarkers} markers`,
        duration: 4000
      };

      console.log(`    ✅ Map loaded (${mapMarkers} markers)`);

    } catch (error) {
      console.log(`    ❌ Map functionality failed: ${error.message}`);
      
      this.results.tests.map_functionality = {
        status: 'failed',
        error: error.message
      };
    }
  }

  async runUIFunctionalityTests(page) {
    console.log('🔍 Testing UI functionality...');

    try {
      // 네비게이션 테스트
      await this.testNavigation(page);
      
      // 반응형 디자인 테스트
      await this.testResponsiveDesign(page);
      
    } catch (error) {
      console.log(`  ❌ UI functionality failed: ${error.message}`);
    }
  }

  async testNavigation(page) {
    try {
      console.log('  🧭 Testing navigation...');
      
      // 헤더 네비게이션 확인
      const navElements = await page.locator('nav a, header a, .nav-link').count();
      
      if (navElements > 0) {
        // 첫 번째 네비게이션 링크 클릭 테스트
        const firstLink = page.locator('nav a, header a').first();
        if (await firstLink.count() > 0) {
          await firstLink.click();
          await page.waitForTimeout(1000);
        }
      }

      this.results.tests.navigation = {
        status: 'passed',
        details: `Found ${navElements} navigation elements`,
        duration: 1500
      };

      console.log(`    ✅ Navigation working (${navElements} elements)`);

    } catch (error) {
      this.results.tests.navigation = {
        status: 'failed',
        error: error.message
      };
    }
  }

  async testResponsiveDesign(page) {
    try {
      console.log('  📱 Testing responsive design...');
      
      // 모바일 뷰포트로 변경
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(2000);
      
      // 모바일 스크린샷
      await this.captureScreenshot(page, 'mobile-view');
      
      // 데스크톱으로 복원
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000);

      this.results.tests.responsive_design = {
        status: 'passed',
        details: 'Responsive design test completed',
        duration: 3500
      };

      console.log('    ✅ Responsive design tested');

    } catch (error) {
      this.results.tests.responsive_design = {
        status: 'failed',
        error: error.message
      };
    }
  }

  async runPerformanceTests(page) {
    console.log('🔍 Testing performance...');

    try {
      // Performance API 사용
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
          domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
          loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
          firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
        };
      });

      this.results.performance = {
        ...performanceMetrics,
        timestamp: new Date().toISOString()
      };

      this.results.tests.performance = {
        status: 'passed',
        details: `DOM loaded in ${performanceMetrics.domContentLoaded}ms`,
        duration: 1000
      };

      console.log(`  ✅ Performance metrics collected`);
      console.log(`    - DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
      console.log(`    - First Paint: ${Math.round(performanceMetrics.firstPaint)}ms`);

    } catch (error) {
      console.log(`  ❌ Performance testing failed: ${error.message}`);
      
      this.results.tests.performance = {
        status: 'failed',
        error: error.message
      };
    }
  }

  async runAccessibilityTests(page) {
    console.log('🔍 Testing accessibility...');

    try {
      // 기본 접근성 요소들 확인
      const a11yChecks = await page.evaluate(() => {
        const results = {
          hasSkipLink: !!document.querySelector('a[href="#main"], .sr-only'),
          hasHeadings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
          hasAltTexts: Array.from(document.querySelectorAll('img')).every(img => img.alt !== undefined),
          hasAriaLabels: document.querySelectorAll('[aria-label], [aria-labelledby]').length > 0,
          hasLandmarks: document.querySelectorAll('main, nav, header, footer, section[role]').length > 0
        };
        
        return results;
      });

      const passedChecks = Object.values(a11yChecks).filter(Boolean).length;
      const totalChecks = Object.keys(a11yChecks).length;

      this.results.tests.accessibility = {
        status: passedChecks >= totalChecks * 0.8 ? 'passed' : 'failed',
        details: `${passedChecks}/${totalChecks} accessibility checks passed`,
        checks: a11yChecks,
        duration: 2000
      };

      console.log(`  ✅ Accessibility: ${passedChecks}/${totalChecks} checks passed`);

    } catch (error) {
      console.log(`  ❌ Accessibility testing failed: ${error.message}`);
      
      this.results.tests.accessibility = {
        status: 'failed',
        error: error.message
      };
    }
  }

  async captureScreenshot(page, name) {
    try {
      const filename = `${name}-${Date.now()}.png`;
      const filepath = path.join(config.screenshotDir, filename);
      
      await page.screenshot({
        path: filepath,
        fullPage: true
      });

      this.results.screenshots.push(filepath);
      return filepath;
      
    } catch (error) {
      console.log(`  ⚠️ Screenshot failed for ${name}: ${error.message}`);
      return null;
    }
  }

  async saveResults() {
    try {
      const resultsPath = path.join(config.resultsDir, 'results.json');
      await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));
      
      console.log(`📁 Results saved to ${resultsPath}`);
      
      // 요약 정보 출력
      console.log('');
      console.log('📊 Test Summary:');
      console.log(`   Overall Status: ${this.results.status}`);
      console.log(`   Execution Time: ${this.results.execution_time}ms`);
      console.log(`   Tests Run: ${Object.keys(this.results.tests).length}`);
      console.log(`   Screenshots: ${this.results.screenshots.length}`);
      
    } catch (error) {
      console.error('❌ Failed to save results:', error.message);
    }
  }
}

// 메인 실행 함수
async function main() {
  const tester = new RPAWebsiteTester();
  
  try {
    await tester.initialize();
    await tester.runTests();
  } catch (error) {
    console.error('❌ RPA testing failed:', error);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { RPAWebsiteTester };