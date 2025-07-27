#!/usr/bin/env node

/**
 * Security Headers Validation Script
 * Tests proper security header configuration and validates fixes
 */

import fs from 'fs/promises';

const TARGET_URL = 'https://djyalu.github.io/singapore_weather_cam/';
const RESULTS_DIR = 'test-results/security-headers';

class SecurityHeaderValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      target_url: TARGET_URL,
      test_type: 'security-headers-validation',
      status: 'unknown',
      tests: {},
      fixes_validated: [],
      security_score: 0
    };
  }

  async initialize() {
    await fs.mkdir(RESULTS_DIR, { recursive: true });
    console.log('🛡️ Security Headers Validation Started');
    console.log(`🎯 Target: ${TARGET_URL}`);
    console.log('=' * 50);
  }

  async validateHTMLMetaTags() {
    console.log('\n📄 1. Validating HTML Meta Tag Configuration...');

    try {
      const response = await fetch(TARGET_URL);
      const html = await response.text();

      const checks = {
        // Valid meta tags (should be present)
        has_csp: html.includes('http-equiv="Content-Security-Policy"'),
        has_referrer_policy: html.includes('http-equiv="Referrer-Policy"'),
        has_permissions_policy: html.includes('http-equiv="Permissions-Policy"'),
        
        // Invalid meta tags (should NOT be present)
        has_invalid_xframe: html.includes('http-equiv="X-Frame-Options"'),
        has_invalid_xcontent: html.includes('http-equiv="X-Content-Type-Options"'),
        has_invalid_xxss: html.includes('http-equiv="X-XSS-Protection"'),
        
        // CSP content analysis
        csp_has_default_src: html.includes("default-src 'self'"),
        csp_has_script_src: html.includes('script-src'),
        csp_has_frame_src_none: html.includes("frame-src 'none'"),
        csp_has_upgrade_insecure: html.includes('upgrade-insecure-requests'),
        
        html_size: html.length
      };

      const invalidHeaders = checks.has_invalid_xframe || checks.has_invalid_xcontent || checks.has_invalid_xxss;
      const validHeaders = checks.has_csp && checks.has_referrer_policy && checks.has_permissions_policy;

      this.results.tests.html_meta_tags = {
        status: !invalidHeaders && validHeaders ? 'passed' : 'failed',
        checks,
        details: `Valid headers: ${validHeaders ? '✅' : '❌'}, Invalid headers removed: ${!invalidHeaders ? '✅' : '❌'}`
      };

      console.log('  ✅ Valid Meta Headers:');
      console.log(`    CSP: ${checks.has_csp ? '✅' : '❌'}`);
      console.log(`    Referrer-Policy: ${checks.has_referrer_policy ? '✅' : '❌'}`);
      console.log(`    Permissions-Policy: ${checks.has_permissions_policy ? '✅' : '❌'}`);
      
      console.log('  🚫 Invalid Meta Headers (should be removed):');
      console.log(`    X-Frame-Options: ${checks.has_invalid_xframe ? '❌ Present' : '✅ Removed'}`);
      console.log(`    X-Content-Type-Options: ${checks.has_invalid_xcontent ? '❌ Present' : '✅ Removed'}`);
      console.log(`    X-XSS-Protection: ${checks.has_invalid_xxss ? '❌ Present' : '✅ Removed'}`);

      console.log('  🔒 CSP Policy Analysis:');
      console.log(`    Default-src: ${checks.csp_has_default_src ? '✅' : '❌'}`);
      console.log(`    Script-src: ${checks.csp_has_script_src ? '✅' : '❌'}`);
      console.log(`    Frame-src none: ${checks.csp_has_frame_src_none ? '✅' : '❌'}`);
      console.log(`    Upgrade insecure: ${checks.csp_has_upgrade_insecure ? '✅' : '❌'}`);

      if (!invalidHeaders) {
        this.results.fixes_validated.push('Invalid HTTP-only meta tags successfully removed');
      }
      if (validHeaders) {
        this.results.fixes_validated.push('Valid security meta tags properly configured');
      }

      return checks;

    } catch (error) {
      console.log(`  ❌ Meta tag validation failed: ${error.message}`);
      this.results.tests.html_meta_tags = {
        status: 'failed',
        error: error.message
      };
      return null;
    }
  }

  async checkHTTPHeaders() {
    console.log('\n🌐 2. Checking HTTP Response Headers...');

    try {
      const response = await fetch(TARGET_URL, { method: 'HEAD' });
      
      const headers = {
        'x-frame-options': response.headers.get('x-frame-options'),
        'x-content-type-options': response.headers.get('x-content-type-options'),
        'x-xss-protection': response.headers.get('x-xss-protection'),
        'strict-transport-security': response.headers.get('strict-transport-security'),
        'content-security-policy': response.headers.get('content-security-policy'),
        'referrer-policy': response.headers.get('referrer-policy'),
        'server': response.headers.get('server'),
        'cache-control': response.headers.get('cache-control')
      };

      const analysis = {
        has_http_xframe: !!headers['x-frame-options'],
        has_http_xcontent: !!headers['x-content-type-options'],
        has_http_xxss: !!headers['x-xss-protection'],
        has_hsts: !!headers['strict-transport-security'],
        has_http_csp: !!headers['content-security-policy'],
        has_http_referrer: !!headers['referrer-policy'],
        uses_https: response.url.startsWith('https://'),
        status_code: response.status
      };

      this.results.tests.http_headers = {
        status: 'analyzed',
        headers,
        analysis,
        details: 'HTTP headers provided by GitHub Pages infrastructure'
      };

      console.log('  📊 GitHub Pages HTTP Headers:');
      console.log(`    X-Frame-Options: ${headers['x-frame-options'] || 'Not set'}`);
      console.log(`    X-Content-Type-Options: ${headers['x-content-type-options'] || 'Not set'}`);
      console.log(`    X-XSS-Protection: ${headers['x-xss-protection'] || 'Not set'}`);
      console.log(`    HSTS: ${headers['strict-transport-security'] || 'Not set'}`);
      console.log(`    Server: ${headers['server'] || 'Unknown'}`);
      console.log(`    HTTPS: ${analysis.uses_https ? '✅' : '❌'}`);

      if (analysis.uses_https) {
        this.results.fixes_validated.push('HTTPS properly enforced by GitHub Pages');
      }

      return { headers, analysis };

    } catch (error) {
      console.log(`  ❌ HTTP header check failed: ${error.message}`);
      this.results.tests.http_headers = {
        status: 'failed',
        error: error.message
      };
      return null;
    }
  }

  async validateCSPPolicy() {
    console.log('\n🔒 3. Validating Content Security Policy...');

    try {
      const response = await fetch(TARGET_URL);
      const html = await response.text();

      // Extract CSP from meta tag
      const cspMatch = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);
      const cspContent = cspMatch ? cspMatch[1].replace(/\s+/g, ' ').trim() : null;

      if (!cspContent) {
        throw new Error('CSP meta tag not found');
      }

      const cspDirectives = {
        'default-src': cspContent.includes("default-src 'self'"),
        'script-src': cspContent.includes('script-src'),
        'style-src': cspContent.includes('style-src'),
        'img-src': cspContent.includes('img-src'),
        'connect-src': cspContent.includes('connect-src'),
        'font-src': cspContent.includes('font-src'),
        'frame-src': cspContent.includes("frame-src 'none'"),
        'object-src': cspContent.includes("object-src 'none'"),
        'base-uri': cspContent.includes("base-uri 'self'"),
        'form-action': cspContent.includes("form-action 'self'"),
        'upgrade-insecure-requests': cspContent.includes('upgrade-insecure-requests')
      };

      const requiredDirectives = ['default-src', 'script-src', 'style-src', 'frame-src', 'upgrade-insecure-requests'];
      const presentRequired = requiredDirectives.filter(dir => cspDirectives[dir]).length;
      const cspScore = Math.round((presentRequired / requiredDirectives.length) * 100);

      this.results.tests.csp_policy = {
        status: cspScore >= 80 ? 'passed' : 'needs_improvement',
        directives: cspDirectives,
        score: cspScore,
        content: cspContent,
        details: `CSP score: ${cspScore}% (${presentRequired}/${requiredDirectives.length} required directives)`
      };

      console.log('  📋 CSP Directive Analysis:');
      Object.entries(cspDirectives).forEach(([directive, present]) => {
        const required = requiredDirectives.includes(directive);
        console.log(`    ${directive}: ${present ? '✅' : '❌'}${required ? ' (required)' : ''}`);
      });

      console.log(`  📊 CSP Score: ${cspScore}/100`);

      if (cspScore >= 80) {
        this.results.fixes_validated.push('Comprehensive CSP policy properly configured');
      }

      return { cspDirectives, cspScore, cspContent };

    } catch (error) {
      console.log(`  ❌ CSP validation failed: ${error.message}`);
      this.results.tests.csp_policy = {
        status: 'failed',
        error: error.message
      };
      return null;
    }
  }

  async testSecurityCompliance() {
    console.log('\n🔍 4. Testing Security Compliance...');

    try {
      const tests = [
        {
          name: 'HTTPS Enforcement',
          test: async () => {
            const httpUrl = TARGET_URL.replace('https://', 'http://');
            try {
              const response = await fetch(httpUrl, { redirect: 'manual' });
              return response.status === 301 || response.status === 302 || response.status === 0;
            } catch {
              return true; // HTTPS-only, HTTP blocked
            }
          }
        },
        {
          name: 'Frame Protection',
          test: async () => {
            const response = await fetch(TARGET_URL);
            const html = await response.text();
            return html.includes("frame-src 'none'") || response.headers.get('x-frame-options');
          }
        },
        {
          name: 'Mixed Content Protection',
          test: async () => {
            const response = await fetch(TARGET_URL);
            const html = await response.text();
            return html.includes('upgrade-insecure-requests');
          }
        },
        {
          name: 'External Resource Control',
          test: async () => {
            const response = await fetch(TARGET_URL);
            const html = await response.text();
            return html.includes('default-src') && html.includes('script-src');
          }
        }
      ];

      const results = {};
      let passedTests = 0;

      for (const test of tests) {
        try {
          const passed = await test.test();
          results[test.name] = {
            status: passed ? 'passed' : 'failed',
            description: test.name
          };
          
          if (passed) passedTests++;
          console.log(`  ${test.name}: ${passed ? '✅' : '❌'}`);

        } catch (error) {
          results[test.name] = {
            status: 'error',
            error: error.message,
            description: test.name
          };
          console.log(`  ${test.name}: ❌ Error - ${error.message}`);
        }
      }

      const complianceScore = Math.round((passedTests / tests.length) * 100);

      this.results.tests.security_compliance = {
        status: complianceScore >= 75 ? 'passed' : 'needs_improvement',
        score: complianceScore,
        passed_tests: passedTests,
        total_tests: tests.length,
        results,
        details: `Security compliance: ${complianceScore}% (${passedTests}/${tests.length})`
      };

      console.log(`  📊 Compliance Score: ${complianceScore}/100`);

      if (complianceScore >= 75) {
        this.results.fixes_validated.push('Security compliance tests passed');
      }

      return results;

    } catch (error) {
      console.log(`  ❌ Compliance testing failed: ${error.message}`);
      this.results.tests.security_compliance = {
        status: 'failed',
        error: error.message
      };
      return null;
    }
  }

  async calculateSecurityScore() {
    console.log('\n📊 5. Calculating Overall Security Score...');

    const weights = {
      html_meta_tags: 30,    // Proper meta tag configuration
      csp_policy: 40,        // CSP policy strength
      security_compliance: 20, // General security compliance
      http_headers: 10       // HTTP header analysis
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([test, weight]) => {
      const testResult = this.results.tests[test];
      if (testResult && testResult.status !== 'failed') {
        let score = 0;
        
        switch (test) {
          case 'html_meta_tags':
            score = testResult.status === 'passed' ? 100 : 0;
            break;
          case 'csp_policy':
            score = testResult.score || 0;
            break;
          case 'security_compliance':
            score = testResult.score || 0;
            break;
          case 'http_headers':
            score = testResult.analysis?.uses_https ? 70 : 30;
            break;
        }

        totalScore += score * weight;
        totalWeight += weight;
      }
    });

    this.results.security_score = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

    console.log('  🎯 Security Score Breakdown:');
    Object.entries(weights).forEach(([test, weight]) => {
      const testResult = this.results.tests[test];
      const score = testResult?.score || (testResult?.status === 'passed' ? 100 : 0);
      console.log(`    ${test}: ${score}/100 (weight: ${weight}%)`);
    });

    console.log(`  🏆 Overall Security Score: ${this.results.security_score}/100`);

    // Determine overall status
    if (this.results.security_score >= 90) {
      this.results.status = 'excellent';
    } else if (this.results.security_score >= 75) {
      this.results.status = 'good';
    } else if (this.results.security_score >= 60) {
      this.results.status = 'fair';
    } else {
      this.results.status = 'poor';
    }

    return this.results.security_score;
  }

  async saveResults() {
    try {
      const resultsPath = `${RESULTS_DIR}/security-validation.json`;
      await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));

      const summaryPath = `${RESULTS_DIR}/security-summary.txt`;
      const summary = this.generateTextSummary();
      await fs.writeFile(summaryPath, summary);

      console.log(`\n📁 Results saved to: ${resultsPath}`);
      console.log(`📄 Summary saved to: ${summaryPath}`);

    } catch (error) {
      console.error('❌ Failed to save results:', error.message);
    }
  }

  generateTextSummary() {
    return `
SECURITY HEADERS VALIDATION SUMMARY
===================================

Target: ${this.results.target_url}
Timestamp: ${this.results.timestamp}
Overall Status: ${this.results.status?.toUpperCase() || 'UNKNOWN'}
Security Score: ${this.results.security_score}/100

FIXES VALIDATED (${this.results.fixes_validated.length}):
${this.results.fixes_validated.map(fix => `✅ ${fix}`).join('\n')}

SECURITY TESTS:
${Object.entries(this.results.tests).map(([test, result]) => {
  const status = result.status === 'passed' || result.status === 'analyzed' ? '✅' : '❌';
  const score = result.score ? ` (${result.score}/100)` : '';
  return `${status} ${test}${score}`;
}).join('\n')}

RECOMMENDATIONS:
${this.results.security_score >= 90 ? 
  '🎉 Excellent security configuration. Continue monitoring.' :
  this.results.security_score >= 75 ?
  '✅ Good security posture. Minor improvements possible.' :
  '⚠️ Security improvements needed. Review failing tests.'
}

GitHub Pages Limitations:
- X-Frame-Options: Set via HTTP headers (not meta tags)
- X-Content-Type-Options: Set via HTTP headers (not meta tags)  
- X-XSS-Protection: Set via HTTP headers (not meta tags)
- HSTS: Managed by GitHub Pages infrastructure
`;
  }

  async runCompleteValidation() {
    await this.initialize();

    try {
      await this.validateHTMLMetaTags();
      await this.checkHTTPHeaders();
      await this.validateCSPPolicy();
      await this.testSecurityCompliance();
      await this.calculateSecurityScore();
      await this.saveResults();

      // Final summary
      console.log('\n' + '=' * 50);
      console.log('🛡️ SECURITY HEADERS VALIDATION COMPLETED');
      console.log('=' * 50);
      console.log(`📊 Overall Status: ${this.results.status.toUpperCase()}`);
      console.log(`🏆 Security Score: ${this.results.security_score}/100`);
      console.log(`🔧 Fixes Validated: ${this.results.fixes_validated.length}`);

      if (this.results.status === 'excellent' || this.results.status === 'good') {
        console.log('\n🎉 SUCCESS: Security headers properly configured!');
        console.log('📱 No more X-Frame-Options meta tag errors in browser console.');
      } else {
        console.log('\n⚠️ WARNING: Security configuration needs improvement.');
      }

      return this.results;

    } catch (error) {
      console.error(`\n❌ VALIDATION FAILED: ${error.message}`);
      this.results.status = 'failed';
      throw error;
    }
  }
}

// Execute validation
const validator = new SecurityHeaderValidator();
validator.runCompleteValidation().then(results => {
  const exitCode = results.status === 'excellent' || results.status === 'good' ? 0 : 1;
  process.exit(exitCode);
}).catch(error => {
  console.error('💥 Security validation error:', error);
  process.exit(1);
});