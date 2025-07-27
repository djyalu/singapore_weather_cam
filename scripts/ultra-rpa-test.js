#!/usr/bin/env node

/**
 * Ultra-Deep RPA Testing Script
 * 포괄적인 웹사이트 자동화 테스트 with --ultrathink analysis
 * Playwright 없이도 심층적인 사용자 시나리오 테스트 수행
 */

// Using native fetch (Node.js 18+)
import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

const TARGET_URL = process.env.TARGET_URL || 'https://djyalu.github.io/singapore_weather_cam/';
const RESULTS_DIR = 'test-results/ultra-rpa';

class UltraRPATester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      target_url: TARGET_URL,
      test_type: 'ultra-deep-rpa',
      execution_time: 0,
      status: 'unknown',
      tests: {},
      performance: {},
      user_scenarios: {},
      accessibility: {},
      security: {},
      errors: [],
      recommendations: []
    };
    this.startTime = performance.now();
  }

  async initialize() {
    await fs.mkdir(RESULTS_DIR, { recursive: true });
    console.log('🤖 Ultra-Deep RPA Testing Started');
    console.log(`🎯 Target: ${TARGET_URL}`);
    console.log(`🧠 Analysis Mode: ULTRA-THINK`);
    console.log('=' * 60);
  }

  // 🔍 LEVEL 1: 기본 연결성 및 응답성 테스트
  async testBasicConnectivity() {
    console.log('\n🔍 LEVEL 1: Basic Connectivity & Response Tests');
    
    const startTime = performance.now();
    
    try {
      const response = await fetch(TARGET_URL, {
        method: 'GET',
        headers: {
          'User-Agent': 'UltraRPA-Bot/1.0 (Singapore-Weather-Cam)'
        },
        timeout: 15000
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      const html = await response.text();

      this.results.tests.basic_connectivity = {
        status: response.ok ? 'passed' : 'failed',
        http_status: response.status,
        response_time_ms: responseTime,
        content_length: html.length,
        content_type: response.headers.get('content-type'),
        server: response.headers.get('server'),
        cache_control: response.headers.get('cache-control'),
        details: `HTTP ${response.status} - ${responseTime}ms - ${html.length} bytes`
      };

      console.log(`  ✅ HTTP Status: ${response.status}`);
      console.log(`  ⚡ Response Time: ${responseTime}ms`);
      console.log(`  📏 Content Size: ${html.length.toLocaleString()} bytes`);
      console.log(`  🏷️  Content Type: ${response.headers.get('content-type')}`);

      return { success: true, html, responseTime };

    } catch (error) {
      this.results.tests.basic_connectivity = {
        status: 'failed',
        error: error.message,
        details: `Connection failed: ${error.message}`
      };

      console.log(`  ❌ Connection Failed: ${error.message}`);
      return { success: false, error };
    }
  }

  // 🔍 LEVEL 2: HTML 구조 및 콘텐츠 분석
  async analyzeHTMLStructure(html) {
    console.log('\n🔍 LEVEL 2: HTML Structure & Content Analysis');

    try {
      const analysis = {
        // React 관련 요소들
        hasReactRoot: html.includes('<div id="root">'),
        hasReactScripts: /src="[^"]*\/assets\/js\/[^"]*\.js"/.test(html),
        hasReactCSS: /href="[^"]*\/assets\/css\/[^"]*\.css"/.test(html),
        
        // 메타데이터 분석
        hasTitle: /<title>([^<]+)<\/title>/.test(html),
        title: html.match(/<title>([^<]+)<\/title>/)?.[1] || 'No title',
        hasDescription: html.includes('meta name="description"'),
        hasKeywords: html.includes('meta name="keywords"'),
        
        // PWA 지원
        hasManifest: html.includes('link rel="manifest"'),
        hasServiceWorker: html.includes('serviceWorker'),
        hasIcons: html.includes('apple-touch-icon'),
        
        // 보안 헤더들
        hasCSP: html.includes('Content-Security-Policy'),
        hasXFrame: html.includes('X-Frame-Options'),
        hasXSS: html.includes('X-XSS-Protection'),
        
        // Open Graph 태그들
        hasOGTitle: html.includes('property="og:title"'),
        hasOGDescription: html.includes('property="og:description"'),
        hasOGImage: html.includes('property="og:image"'),
        
        // 구조적 요소들
        headSize: (html.match(/<head[\s\S]*?<\/head>/)?.[0] || '').length,
        bodySize: (html.match(/<body[\s\S]*?<\/body>/)?.[0] || '').length,
        scriptTags: (html.match(/<script[^>]*>/g) || []).length,
        linkTags: (html.match(/<link[^>]*>/g) || []).length,
        metaTags: (html.match(/<meta[^>]*>/g) || []).length
      };

      this.results.tests.html_structure = {
        status: 'passed',
        analysis,
        score: this.calculateHTMLScore(analysis),
        details: `HTML structure analysis completed`
      };

      console.log(`  ⚛️  React Root: ${analysis.hasReactRoot ? '✅' : '❌'}`);
      console.log(`  📜 React Scripts: ${analysis.hasReactScripts ? '✅' : '❌'}`);
      console.log(`  🎨 React CSS: ${analysis.hasReactCSS ? '✅' : '❌'}`);
      console.log(`  🏷️  Title: "${analysis.title}"`);
      console.log(`  🛡️  Security Headers: ${analysis.hasCSP ? '✅' : '❌'}`);
      console.log(`  📱 PWA Support: ${analysis.hasManifest && analysis.hasServiceWorker ? '✅' : '⚠️'}`);
      console.log(`  🌐 Open Graph: ${analysis.hasOGTitle ? '✅' : '❌'}`);
      console.log(`  📊 Structure Score: ${this.calculateHTMLScore(analysis)}/100`);

      return analysis;

    } catch (error) {
      console.log(`  ❌ HTML Analysis Failed: ${error.message}`);
      this.results.errors.push({
        level: 'html_analysis',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return null;
    }
  }

  calculateHTMLScore(analysis) {
    let score = 0;
    
    // 기본 구조 (40점)
    if (analysis.hasReactRoot) score += 10;
    if (analysis.hasReactScripts) score += 10;
    if (analysis.hasTitle) score += 10;
    if (analysis.hasDescription) score += 10;
    
    // 보안 (20점)
    if (analysis.hasCSP) score += 10;
    if (analysis.hasXFrame) score += 5;
    if (analysis.hasXSS) score += 5;
    
    // PWA (20점)
    if (analysis.hasManifest) score += 10;
    if (analysis.hasServiceWorker) score += 10;
    
    // SEO (20점)
    if (analysis.hasOGTitle) score += 5;
    if (analysis.hasOGDescription) score += 5;
    if (analysis.hasKeywords) score += 5;
    if (analysis.hasIcons) score += 5;
    
    return Math.min(100, score);
  }

  // 🔍 LEVEL 3: 리소스 로딩 검증
  async testResourceLoading(html) {
    console.log('\n🔍 LEVEL 3: Resource Loading Verification');

    const resources = {
      javascript: [],
      css: [],
      images: [],
      fonts: [],
      other: []
    };

    // 리소스 URL 추출
    const jsMatches = html.matchAll(/src="([^"]*\.js[^"]*)"/g);
    const cssMatches = html.matchAll(/href="([^"]*\.css[^"]*)"/g);
    const imgMatches = html.matchAll(/src="([^"]*\.(jpg|jpeg|png|gif|svg|webp)[^"]*)"/gi);

    for (const match of jsMatches) {
      resources.javascript.push(this.resolveURL(match[1]));
    }
    
    for (const match of cssMatches) {
      resources.css.push(this.resolveURL(match[1]));
    }
    
    for (const match of imgMatches) {
      resources.images.push(this.resolveURL(match[1]));
    }

    // 각 리소스 검증
    const results = {};
    let totalTests = 0;
    let passedTests = 0;

    for (const [type, urls] of Object.entries(resources)) {
      if (urls.length === 0) continue;

      console.log(`  📁 Testing ${type.toUpperCase()} resources (${urls.length})...`);
      results[type] = [];

      for (const url of urls) {
        totalTests++;
        const testResult = await this.testSingleResource(url, type);
        results[type].push(testResult);
        
        if (testResult.status === 'passed') {
          passedTests++;
          console.log(`    ✅ ${path.basename(url)} (${testResult.size} bytes)`);
        } else {
          console.log(`    ❌ ${path.basename(url)} - ${testResult.error}`);
        }
      }
    }

    this.results.tests.resource_loading = {
      status: passedTests === totalTests ? 'passed' : 'partial',
      total_resources: totalTests,
      passed_resources: passedTests,
      failed_resources: totalTests - passedTests,
      success_rate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
      details: results
    };

    console.log(`  📊 Resource Loading: ${passedTests}/${totalTests} passed (${Math.round((passedTests / totalTests) * 100)}%)`);

    return results;
  }

  resolveURL(url) {
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return new URL(url, TARGET_URL).href;
    return new URL(url, TARGET_URL).href;
  }

  async testSingleResource(url, type) {
    try {
      const startTime = performance.now();
      
      const response = await fetch(url, {
        method: 'HEAD',
        timeout: 10000
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      if (response.ok) {
        return {
          status: 'passed',
          url,
          http_status: response.status,
          size: response.headers.get('content-length') || 'unknown',
          content_type: response.headers.get('content-type'),
          response_time: responseTime
        };
      } else {
        return {
          status: 'failed',
          url,
          error: `HTTP ${response.status}`,
          response_time: responseTime
        };
      }

    } catch (error) {
      return {
        status: 'failed',
        url,
        error: error.message
      };
    }
  }

  // 🔍 LEVEL 4: 사용자 시나리오 시뮬레이션
  async simulateUserScenarios() {
    console.log('\n🔍 LEVEL 4: User Scenario Simulation');

    const scenarios = [
      {
        name: 'weather_data_access',
        description: '날씨 데이터 API 접근',
        url: `${TARGET_URL}data/weather/latest.json`
      },
      {
        name: 'webcam_data_access', 
        description: '웹캠 데이터 API 접근',
        url: `${TARGET_URL}data/webcam/latest.json`
      },
      {
        name: 'service_worker_access',
        description: 'Service Worker 파일 접근',
        url: `${TARGET_URL}sw.js`
      },
      {
        name: 'manifest_access',
        description: 'PWA Manifest 파일 접근',
        url: `${TARGET_URL}manifest.json`
      }
    ];

    const results = {};

    for (const scenario of scenarios) {
      console.log(`  🎬 Scenario: ${scenario.description}`);
      
      try {
        const startTime = performance.now();
        const response = await fetch(scenario.url, { timeout: 10000 });
        const endTime = performance.now();
        
        const responseTime = Math.round(endTime - startTime);
        const content = await response.text();

        if (response.ok) {
          let contentAnalysis = {};
          
          // JSON 데이터 분석
          if (scenario.url.includes('.json')) {
            try {
              const data = JSON.parse(content);
              contentAnalysis = {
                is_valid_json: true,
                has_timestamp: 'timestamp' in data,
                has_data: Object.keys(data).length > 1,
                data_size: Object.keys(data).length,
                content_keys: Object.keys(data).slice(0, 5) // 처음 5개 키만
              };
            } catch (e) {
              contentAnalysis = { is_valid_json: false, error: e.message };
            }
          }

          results[scenario.name] = {
            status: 'passed',
            response_time: responseTime,
            content_length: content.length,
            content_type: response.headers.get('content-type'),
            analysis: contentAnalysis,
            details: `${scenario.description} successful`
          };

          console.log(`    ✅ Success (${responseTime}ms, ${content.length} bytes)`);
          
          if (contentAnalysis.is_valid_json) {
            console.log(`    📊 JSON Data: ${contentAnalysis.data_size} fields, timestamp: ${contentAnalysis.has_timestamp ? '✅' : '❌'}`);
          }

        } else {
          results[scenario.name] = {
            status: 'failed',
            error: `HTTP ${response.status}`,
            response_time: responseTime
          };
          console.log(`    ❌ Failed: HTTP ${response.status}`);
        }

      } catch (error) {
        results[scenario.name] = {
          status: 'failed',
          error: error.message
        };
        console.log(`    ❌ Error: ${error.message}`);
      }
    }

    this.results.user_scenarios = results;
    
    const successfulScenarios = Object.values(results).filter(r => r.status === 'passed').length;
    console.log(`  📊 User Scenarios: ${successfulScenarios}/${scenarios.length} successful`);

    return results;
  }

  // 🔍 LEVEL 5: 성능 메트릭 수집
  async collectPerformanceMetrics() {
    console.log('\n🔍 LEVEL 5: Performance Metrics Collection');

    const metrics = {
      timestamp: new Date().toISOString(),
      load_tests: {},
      resource_timing: {},
      recommendations: []
    };

    // 다양한 조건에서 로딩 테스트
    const loadTests = [
      { name: 'normal_load', description: '일반 로딩' },
      { name: 'cached_load', description: '캐시된 로딩 (2차 요청)' },
      { name: 'parallel_load', description: '병렬 리소스 로딩' }
    ];

    for (const test of loadTests) {
      console.log(`  ⚡ ${test.description}...`);
      
      const startTime = performance.now();
      
      try {
        const response = await fetch(TARGET_URL, {
          headers: test.name === 'cached_load' ? {} : { 'Cache-Control': 'no-cache' }
        });
        
        const endTime = performance.now();
        const loadTime = Math.round(endTime - startTime);
        
        metrics.load_tests[test.name] = {
          status: response.ok ? 'passed' : 'failed',
          load_time: loadTime,
          http_status: response.status,
          content_length: parseInt(response.headers.get('content-length') || '0'),
          cache_status: response.headers.get('cf-cache-status') || 'unknown'
        };

        console.log(`    ⏱️  ${loadTime}ms (${response.status})`);

        // 성능 권장사항
        if (loadTime > 3000) {
          metrics.recommendations.push(`${test.description} 속도가 느림 (${loadTime}ms > 3000ms)`);
        }

      } catch (error) {
        metrics.load_tests[test.name] = {
          status: 'failed',
          error: error.message
        };
      }
    }

    this.results.performance = metrics;
    return metrics;
  }

  // 🔍 LEVEL 6: 접근성 및 보안 분석  
  async analyzeAccessibilityAndSecurity(html) {
    console.log('\n🔍 LEVEL 6: Accessibility & Security Analysis');

    const accessibility = {
      // 기본 접근성 요소들
      has_lang_attribute: html.includes('<html lang='),
      has_viewport_meta: html.includes('name="viewport"'),
      has_skip_links: html.includes('href="#main"') || html.includes('class="sr-only"'),
      has_alt_text_pattern: html.includes('alt='),
      has_aria_labels: html.includes('aria-label') || html.includes('aria-labelledby'),
      has_headings_structure: /<h[1-6][^>]*>/.test(html),
      has_landmarks: html.includes('<main') || html.includes('<nav') || html.includes('<header') || html.includes('<footer'),
      
      // 색상 및 시각적 접근성
      has_focus_indicators: html.includes('focus:'),
      has_high_contrast_support: html.includes('contrast'),
      
      score: 0
    };

    // 접근성 점수 계산
    const a11yChecks = Object.keys(accessibility).filter(k => k.startsWith('has_'));
    const passedChecks = a11yChecks.filter(check => accessibility[check]).length;
    accessibility.score = Math.round((passedChecks / a11yChecks.length) * 100);

    const security = {
      // 보안 헤더들
      has_csp: html.includes('Content-Security-Policy'),
      has_x_frame_options: html.includes('X-Frame-Options'),
      has_x_content_type: html.includes('X-Content-Type-Options'),
      has_referrer_policy: html.includes('Referrer-Policy'),
      has_permissions_policy: html.includes('Permissions-Policy'),
      
      // HTTPS 및 보안 설정들
      uses_https: TARGET_URL.startsWith('https://'),
      has_sri_integrity: html.includes('integrity='),
      has_noopener_links: html.includes('rel="noopener"'),
      
      // 취약점 패턴들
      has_inline_scripts: /<script(?![^>]*src=)[^>]*>/.test(html),
      has_eval_usage: html.includes('eval('),
      
      score: 0
    };

    // 보안 점수 계산  
    const securityChecks = ['has_csp', 'has_x_frame_options', 'uses_https', 'has_referrer_policy'];
    const passedSecurityChecks = securityChecks.filter(check => security[check]).length;
    security.score = Math.round((passedSecurityChecks / securityChecks.length) * 100);

    this.results.accessibility = accessibility;
    this.results.security = security;

    console.log(`  ♿ Accessibility Score: ${accessibility.score}/100`);
    console.log(`    - Language Attribute: ${accessibility.has_lang_attribute ? '✅' : '❌'}`);
    console.log(`    - Viewport Meta: ${accessibility.has_viewport_meta ? '✅' : '❌'}`);
    console.log(`    - ARIA Labels: ${accessibility.has_aria_labels ? '✅' : '❌'}`);
    console.log(`    - Landmarks: ${accessibility.has_landmarks ? '✅' : '❌'}`);
    
    console.log(`  🛡️  Security Score: ${security.score}/100`);
    console.log(`    - CSP Header: ${security.has_csp ? '✅' : '❌'}`);
    console.log(`    - HTTPS: ${security.uses_https ? '✅' : '❌'}`);
    console.log(`    - X-Frame-Options: ${security.has_x_frame_options ? '✅' : '❌'}`);
    console.log(`    - Referrer Policy: ${security.has_referrer_policy ? '✅' : '❌'}`);

    return { accessibility, security };
  }

  // 🔍 LEVEL 7: Ultra-Think 종합 분석 및 권장사항
  async generateUltraThinkAnalysis() {
    console.log('\n🧠 ULTRA-THINK ANALYSIS: Comprehensive System Assessment');
    
    const analysis = {
      overall_health: this.calculateOverallHealth(),
      critical_issues: [],
      performance_insights: [],
      user_experience_insights: [],
      technical_recommendations: [],
      business_impact: {},
      next_steps: []
    };

    // 전체 시스템 상태 분석
    const testResults = this.results.tests;
    const passedTests = Object.values(testResults).filter(t => t.status === 'passed').length;
    const totalTests = Object.keys(testResults).length;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    // Critical Issues 식별
    if (successRate < 80) {
      analysis.critical_issues.push(`시스템 안정성 위험: 테스트 성공률 ${Math.round(successRate)}% (권장: 95% 이상)`);
    }

    if (this.results.accessibility?.score < 70) {
      analysis.critical_issues.push(`접근성 개선 필요: ${this.results.accessibility.score}/100 (권장: 80 이상)`);
    }

    if (this.results.security?.score < 80) {
      analysis.critical_issues.push(`보안 강화 필요: ${this.results.security.score}/100 (권장: 90 이상)`);
    }

    // Performance Insights
    const performanceTests = this.results.performance?.load_tests || {};
    const normalLoad = performanceTests.normal_load;
    if (normalLoad?.load_time > 2000) {
      analysis.performance_insights.push(`페이지 로딩 속도 최적화 필요: ${normalLoad.load_time}ms (목표: 2초 이하)`);
    }

    // User Experience Insights
    const userScenarios = this.results.user_scenarios || {};
    const failedScenarios = Object.entries(userScenarios).filter(([_, result]) => result.status === 'failed');
    if (failedScenarios.length > 0) {
      analysis.user_experience_insights.push(`사용자 시나리오 실패: ${failedScenarios.map(([name]) => name).join(', ')}`);
    }

    // Technical Recommendations
    analysis.technical_recommendations = this.generateTechnicalRecommendations();

    // Business Impact Assessment
    analysis.business_impact = {
      user_accessibility: this.results.accessibility?.score >= 80 ? 'Good' : 'Needs Improvement',
      data_reliability: Object.values(userScenarios).every(s => s.status === 'passed') ? 'Excellent' : 'Fair',
      performance_satisfaction: normalLoad?.load_time <= 2000 ? 'Excellent' : 'Good',
      security_compliance: this.results.security?.score >= 90 ? 'Excellent' : 'Good'
    };

    // Next Steps 권장사항
    analysis.next_steps = this.generateNextSteps(analysis);

    this.results.ultra_analysis = analysis;

    // 출력
    console.log(`  🎯 Overall Health Score: ${analysis.overall_health}/100`);
    console.log(`  🚨 Critical Issues: ${analysis.critical_issues.length}`);
    
    if (analysis.critical_issues.length > 0) {
      analysis.critical_issues.forEach(issue => console.log(`    ❌ ${issue}`));
    } else {
      console.log(`    ✅ No critical issues detected`);
    }

    console.log(`  ⚡ Performance Insights: ${analysis.performance_insights.length}`);
    analysis.performance_insights.forEach(insight => console.log(`    💡 ${insight}`));

    console.log(`  🎨 UX Insights: ${analysis.user_experience_insights.length}`);
    analysis.user_experience_insights.forEach(insight => console.log(`    🎭 ${insight}`));

    return analysis;
  }

  calculateOverallHealth() {
    const weights = {
      basic_connectivity: 20,
      html_structure: 15,
      resource_loading: 20,
      user_scenarios: 15,
      performance: 10,
      accessibility: 10,
      security: 10
    };

    let totalScore = 0;
    let totalWeight = 0;

    // 각 테스트 영역의 점수 계산
    Object.entries(weights).forEach(([test, weight]) => {
      let score = 0;
      
      switch (test) {
        case 'basic_connectivity':
          score = this.results.tests.basic_connectivity?.status === 'passed' ? 100 : 0;
          break;
        case 'html_structure':
          score = this.results.tests.html_structure?.score || 0;
          break;
        case 'resource_loading':
          score = this.results.tests.resource_loading?.success_rate || 0;
          break;
        case 'user_scenarios':
          const scenarios = this.results.user_scenarios || {};
          const passed = Object.values(scenarios).filter(s => s.status === 'passed').length;
          const total = Object.keys(scenarios).length;
          score = total > 0 ? (passed / total) * 100 : 0;
          break;
        case 'performance':
          const normalLoad = this.results.performance?.load_tests?.normal_load;
          score = normalLoad?.load_time <= 2000 ? 100 : Math.max(0, 100 - ((normalLoad?.load_time - 2000) / 50));
          break;
        case 'accessibility':
          score = this.results.accessibility?.score || 0;
          break;
        case 'security':
          score = this.results.security?.score || 0;
          break;
      }

      totalScore += score * weight;
      totalWeight += weight;
    });

    return Math.round(totalScore / totalWeight);
  }

  generateTechnicalRecommendations() {
    const recommendations = [];

    // 성능 최적화
    const loadTime = this.results.performance?.load_tests?.normal_load?.load_time;
    if (loadTime > 2000) {
      recommendations.push('이미지 압축 및 lazy loading 구현');
      recommendations.push('JavaScript 번들 크기 최적화');
      recommendations.push('CDN 및 캐싱 전략 강화');
    }

    // 접근성 개선
    if (this.results.accessibility?.score < 80) {
      recommendations.push('ARIA 레이블 및 시맨틱 마크업 보완');
      recommendations.push('키보드 네비게이션 지원 강화');
      recommendations.push('색상 대비 및 텍스트 크기 개선');
    }

    // 보안 강화
    if (this.results.security?.score < 90) {
      recommendations.push('Content Security Policy 정책 강화');
      recommendations.push('보안 헤더 추가 구현');
      recommendations.push('HTTPS Strict Transport Security 설정');
    }

    return recommendations;
  }

  generateNextSteps(analysis) {
    const steps = [];

    if (analysis.critical_issues.length > 0) {
      steps.push('🚨 Critical Issues 해결 (최우선)');
    }

    if (analysis.performance_insights.length > 0) {
      steps.push('⚡ 성능 최적화 작업 수행');
    }

    if (this.results.accessibility?.score < 90) {
      steps.push('♿ 접근성 개선 작업');
    }

    if (this.results.security?.score < 95) {
      steps.push('🛡️ 보안 정책 강화');
    }

    steps.push('📊 정기적인 모니터링 시스템 구축');
    steps.push('🔄 지속적인 개선 프로세스 운영');

    return steps;
  }

  async saveDetailedResults() {
    try {
      this.results.execution_time = Math.round(performance.now() - this.startTime);
      
      // 종합 상태 결정
      const criticalIssues = this.results.ultra_analysis?.critical_issues?.length || 0;
      const overallHealth = this.results.ultra_analysis?.overall_health || 0;
      
      if (criticalIssues === 0 && overallHealth >= 80) {
        this.results.status = 'excellent';
      } else if (criticalIssues <= 2 && overallHealth >= 60) {
        this.results.status = 'good';
      } else if (overallHealth >= 40) {
        this.results.status = 'fair';
      } else {
        this.results.status = 'poor';
      }

      // 결과 저장
      const resultsPath = path.join(RESULTS_DIR, 'ultra-deep-results.json');
      await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));

      // 요약 리포트 생성
      const summaryPath = path.join(RESULTS_DIR, 'summary-report.txt');
      const summary = this.generateTextSummary();
      await fs.writeFile(summaryPath, summary);

      console.log(`\n📁 Detailed results saved to: ${resultsPath}`);
      console.log(`📄 Summary report saved to: ${summaryPath}`);

    } catch (error) {
      console.error('❌ Failed to save results:', error.message);
    }
  }

  generateTextSummary() {
    const analysis = this.results.ultra_analysis || {};
    
    return `
ULTRA-DEEP RPA TEST SUMMARY
===========================

Target: ${this.results.target_url}
Timestamp: ${this.results.timestamp}
Execution Time: ${this.results.execution_time}ms
Overall Status: ${this.results.status.toUpperCase()}
Overall Health Score: ${analysis.overall_health || 'N/A'}/100

CRITICAL ISSUES (${analysis.critical_issues?.length || 0}):
${analysis.critical_issues?.map(issue => `❌ ${issue}`).join('\n') || 'None detected'}

PERFORMANCE INSIGHTS (${analysis.performance_insights?.length || 0}):
${analysis.performance_insights?.map(insight => `⚡ ${insight}`).join('\n') || 'No major issues'}

USER EXPERIENCE INSIGHTS (${analysis.user_experience_insights?.length || 0}):
${analysis.user_experience_insights?.map(insight => `🎭 ${insight}`).join('\n') || 'User scenarios working well'}

TECHNICAL RECOMMENDATIONS:
${analysis.technical_recommendations?.map(rec => `💡 ${rec}`).join('\n') || 'System performing well'}

NEXT STEPS:
${analysis.next_steps?.map((step, i) => `${i + 1}. ${step}`).join('\n') || 'Continue monitoring'}

BUSINESS IMPACT:
User Accessibility: ${analysis.business_impact?.user_accessibility || 'N/A'}
Data Reliability: ${analysis.business_impact?.data_reliability || 'N/A'}
Performance Satisfaction: ${analysis.business_impact?.performance_satisfaction || 'N/A'}
Security Compliance: ${analysis.business_impact?.security_compliance || 'N/A'}
`;
  }

  async runCompleteTest() {
    await this.initialize();

    try {
      // LEVEL 1: Basic Connectivity
      const connectivityResult = await this.testBasicConnectivity();
      if (!connectivityResult.success) {
        throw new Error('기본 연결성 테스트 실패');
      }

      // LEVEL 2: HTML Structure Analysis
      const htmlAnalysis = await this.analyzeHTMLStructure(connectivityResult.html);

      // LEVEL 3: Resource Loading
      await this.testResourceLoading(connectivityResult.html);

      // LEVEL 4: User Scenarios
      await this.simulateUserScenarios();

      // LEVEL 5: Performance Metrics
      await this.collectPerformanceMetrics();

      // LEVEL 6: Accessibility & Security
      await this.analyzeAccessibilityAndSecurity(connectivityResult.html);

      // LEVEL 7: Ultra-Think Analysis
      await this.generateUltraThinkAnalysis();

      // 결과 저장
      await this.saveDetailedResults();

      // 최종 요약
      console.log('\n' + '=' * 60);
      console.log('🎯 ULTRA-DEEP RPA TEST COMPLETED');
      console.log('=' * 60);
      console.log(`📊 Overall Status: ${this.results.status.toUpperCase()}`);
      console.log(`🏥 Health Score: ${this.results.ultra_analysis?.overall_health || 'N/A'}/100`);
      console.log(`⏱️  Execution Time: ${this.results.execution_time}ms`);
      console.log(`🎬 Tests Completed: ${Object.keys(this.results.tests).length}`);
      console.log(`🚨 Critical Issues: ${this.results.ultra_analysis?.critical_issues?.length || 0}`);

      return this.results;

    } catch (error) {
      console.error(`\n❌ ULTRA-DEEP RPA TEST FAILED: ${error.message}`);
      this.results.status = 'failed';
      this.results.errors.push({
        level: 'test_execution',
        error: error.message,
        timestamp: new Date().toISOString()
      });

      await this.saveDetailedResults();
      throw error;
    }
  }
}

// 메인 실행
const tester = new UltraRPATester();
tester.runCompleteTest().then(results => {
  const exitCode = results.status === 'excellent' || results.status === 'good' ? 0 : 1;
  process.exit(exitCode);
}).catch(error => {
  console.error('💥 Ultra-deep RPA test error:', error);
  process.exit(1);
});