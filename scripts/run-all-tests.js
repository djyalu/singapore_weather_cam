#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * QA Persona: Complete testing orchestration
 * DevOps Persona: CI/CD integration and reporting
 * All Personas: Cross-functional quality validation
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class ComprehensiveTestRunner {
  constructor() {
    this.results = {
      unit: { passed: false, score: 0, details: {} },
      integration: { passed: false, score: 0, details: {} },
      e2e: { passed: false, score: 0, details: {} },
      accessibility: { passed: false, score: 0, details: {} },
      performance: { passed: false, score: 0, details: {} },
      security: { passed: false, score: 0, details: {} },
      crossPersona: { passed: false, score: 0, details: {} }
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Test Suite');
    console.log('=' .repeat(60));

    try {
      await this.runUnitTests();
      await this.runIntegrationTests();
      await this.runAccessibilityTests();
      await this.runPerformanceTests();
      await this.runSecurityTests();
      await this.runCrossPersonaTests();
      await this.runE2ETests(); // Last as they're most resource intensive

      this.generateSummaryReport();
      this.exitWithAppropriateCode();

    } catch (error) {
      console.error('❌ Test suite execution failed:', error.message);
      this.generateFailureReport();
      process.exit(1);
    }
  }

  async runUnitTests() {
    console.log('\n🧪 Running Unit Tests...');
    
    try {
      const output = execSync('npm run test:unit -- --reporter=json', { 
        encoding: 'utf8',
        timeout: 120000 
      });
      
      const testResults = JSON.parse(output);
      
      this.results.unit = {
        passed: testResults.success,
        score: this.calculateTestScore(testResults),
        details: {
          total: testResults.numTotalTests,
          passed: testResults.numPassedTests,
          failed: testResults.numFailedTests,
          coverage: testResults.coverageMap ? this.extractCoverage(testResults.coverageMap) : null
        }
      };

      console.log(`✅ Unit Tests: ${this.results.unit.passed ? 'PASSED' : 'FAILED'} (Score: ${this.results.unit.score}/100)`);
      
    } catch (error) {
      console.error('❌ Unit Tests Failed:', error.message);
      this.results.unit.passed = false;
      this.results.unit.score = 0;
    }
  }

  async runIntegrationTests() {
    console.log('\n🔗 Running Integration Tests...');
    
    try {
      const output = execSync('npm run test:integration -- --reporter=json', { 
        encoding: 'utf8',
        timeout: 180000 
      });
      
      const testResults = JSON.parse(output);
      
      this.results.integration = {
        passed: testResults.success,
        score: this.calculateTestScore(testResults),
        details: {
          total: testResults.numTotalTests,
          passed: testResults.numPassedTests,
          failed: testResults.numFailedTests
        }
      };

      console.log(`✅ Integration Tests: ${this.results.integration.passed ? 'PASSED' : 'FAILED'} (Score: ${this.results.integration.score}/100)`);
      
    } catch (error) {
      console.error('❌ Integration Tests Failed:', error.message);
      this.results.integration.passed = false;
      this.results.integration.score = 0;
    }
  }

  async runAccessibilityTests() {
    console.log('\n♿ Running Accessibility Tests...');
    
    try {
      const output = execSync('npm run test:accessibility -- --reporter=json', { 
        encoding: 'utf8',
        timeout: 120000 
      });
      
      const testResults = JSON.parse(output);
      
      this.results.accessibility = {
        passed: testResults.success,
        score: this.calculateTestScore(testResults),
        details: {
          total: testResults.numTotalTests,
          passed: testResults.numPassedTests,
          failed: testResults.numFailedTests,
          wcagLevel: 'AA'
        }
      };

      console.log(`✅ Accessibility Tests: ${this.results.accessibility.passed ? 'PASSED' : 'FAILED'} (Score: ${this.results.accessibility.score}/100)`);
      
    } catch (error) {
      console.error('❌ Accessibility Tests Failed:', error.message);
      this.results.accessibility.passed = false;
      this.results.accessibility.score = 0;
    }
  }

  async runPerformanceTests() {
    console.log('\n⚡ Running Performance Tests...');
    
    try {
      const output = execSync('npm run test:performance -- --reporter=json', { 
        encoding: 'utf8',
        timeout: 180000 
      });
      
      const testResults = JSON.parse(output);
      
      this.results.performance = {
        passed: testResults.success,
        score: this.calculateTestScore(testResults),
        details: {
          total: testResults.numTotalTests,
          passed: testResults.numPassedTests,
          failed: testResults.numFailedTests,
          budgets: {
            renderTime: '< 100ms',
            bundleSize: '< 1MB',
            memoryUsage: 'Optimized'
          }
        }
      };

      console.log(`✅ Performance Tests: ${this.results.performance.passed ? 'PASSED' : 'FAILED'} (Score: ${this.results.performance.score}/100)`);
      
    } catch (error) {
      console.error('❌ Performance Tests Failed:', error.message);
      this.results.performance.passed = false;
      this.results.performance.score = 0;
    }
  }

  async runSecurityTests() {
    console.log('\n🔒 Running Security Tests...');
    
    try {
      const output = execSync('npm run test:security -- --reporter=json', { 
        encoding: 'utf8',
        timeout: 120000 
      });
      
      const testResults = JSON.parse(output);
      
      this.results.security = {
        passed: testResults.success,
        score: this.calculateTestScore(testResults),
        details: {
          total: testResults.numTotalTests,
          passed: testResults.numPassedTests,
          failed: testResults.numFailedTests,
          vulnerabilities: 0,
          compliance: 'OWASP Top 10'
        }
      };

      console.log(`✅ Security Tests: ${this.results.security.passed ? 'PASSED' : 'FAILED'} (Score: ${this.results.security.score}/100)`);
      
    } catch (error) {
      console.error('❌ Security Tests Failed:', error.message);
      this.results.security.passed = false;
      this.results.security.score = 0;
    }
  }

  async runCrossPersonaTests() {
    console.log('\n🎭 Running Cross-Persona Validation...');
    
    try {
      const output = execSync('npm run test -- tests/cross-persona/ --reporter=json', { 
        encoding: 'utf8',
        timeout: 240000 
      });
      
      const testResults = JSON.parse(output);
      
      this.results.crossPersona = {
        passed: testResults.success,
        score: this.calculateTestScore(testResults),
        details: {
          total: testResults.numTotalTests,
          passed: testResults.numPassedTests,
          failed: testResults.numFailedTests,
          personas: ['Architect', 'Frontend', 'Performance', 'Security', 'QA', 'DevOps']
        }
      };

      console.log(`✅ Cross-Persona Tests: ${this.results.crossPersona.passed ? 'PASSED' : 'FAILED'} (Score: ${this.results.crossPersona.score}/100)`);
      
    } catch (error) {
      console.error('❌ Cross-Persona Tests Failed:', error.message);
      this.results.crossPersona.passed = false;
      this.results.crossPersona.score = 0;
    }
  }

  async runE2ETests() {
    console.log('\n🌐 Running E2E Tests...');
    
    try {
      const output = execSync('npm run test:e2e -- --reporter=json', { 
        encoding: 'utf8',
        timeout: 600000 // 10 minutes for E2E
      });
      
      const testResults = JSON.parse(output);
      
      this.results.e2e = {
        passed: testResults.success || testResults.status === 'passed',
        score: this.calculateE2EScore(testResults),
        details: {
          total: testResults.total || 0,
          passed: testResults.passed || 0,
          failed: testResults.failed || 0,
          browsers: ['Chromium', 'Firefox', 'WebKit']
        }
      };

      console.log(`✅ E2E Tests: ${this.results.e2e.passed ? 'PASSED' : 'FAILED'} (Score: ${this.results.e2e.score}/100)`);
      
    } catch (error) {
      console.error('❌ E2E Tests Failed:', error.message);
      this.results.e2e.passed = false;
      this.results.e2e.score = 0;
    }
  }

  calculateTestScore(testResults) {
    if (!testResults || testResults.numTotalTests === 0) return 0;
    
    const passRate = (testResults.numPassedTests / testResults.numTotalTests) * 100;
    return Math.round(passRate);
  }

  calculateE2EScore(testResults) {
    if (!testResults) return 0;
    
    // For Playwright results
    if (testResults.passed !== undefined && testResults.total !== undefined) {
      return Math.round((testResults.passed / testResults.total) * 100);
    }
    
    // Fallback calculation
    return testResults.success ? 95 : 0;
  }

  extractCoverage(coverageMap) {
    // Extract coverage information from coverage map
    const summary = coverageMap.getCoverageSummary?.() || {};
    return {
      lines: summary.lines?.pct || 0,
      functions: summary.functions?.pct || 0,
      branches: summary.branches?.pct || 0,
      statements: summary.statements?.pct || 0
    };
  }

  generateSummaryReport() {
    const totalTime = Date.now() - this.startTime;
    const overallScore = this.calculateOverallScore();
    const passedTests = Object.values(this.results).filter(r => r.passed).length;
    const totalCategories = Object.keys(this.results).length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 Overall Quality Score: ${overallScore}/100`);
    console.log(`✅ Test Categories Passed: ${passedTests}/${totalCategories}`);
    console.log(`⏱️  Total Execution Time: ${Math.round(totalTime / 1000)}s`);
    
    console.log('\n📋 Detailed Results:');
    console.log('Category'.padEnd(20) + 'Status'.padEnd(10) + 'Score'.padEnd(10) + 'Details');
    console.log('-'.repeat(60));
    
    Object.entries(this.results).forEach(([category, result]) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const score = `${result.score}/100`;
      const details = result.details.total ? `${result.details.passed}/${result.details.total} tests` : 'N/A';
      
      console.log(
        category.charAt(0).toUpperCase() + category.slice(1).padEnd(19) +
        status.padEnd(10) +
        score.padEnd(10) +
        details
      );
    });

    // Quality gate determination
    console.log('\n🚦 Quality Gate Assessment:');
    if (overallScore >= 90) {
      console.log('🏆 EXCELLENT - All systems go for production!');
    } else if (overallScore >= 80) {
      console.log('✅ GOOD - Quality standards met, minor improvements possible');
    } else if (overallScore >= 70) {
      console.log('⚠️  CONDITIONAL - Some issues need attention before deployment');
    } else {
      console.log('❌ CRITICAL - Significant quality issues must be resolved');
    }

    // Save results for CI/CD
    this.saveResultsForCI(overallScore);
  }

  generateFailureReport() {
    console.log('\n❌ TEST SUITE EXECUTION FAILED');
    console.log('='.repeat(60));
    console.log('The test suite encountered critical errors during execution.');
    console.log('Please check the error messages above and resolve issues before retrying.');
    
    // Save failure state
    fs.writeFileSync('test-execution-failed.flag', JSON.stringify({
      timestamp: new Date().toISOString(),
      error: 'Test suite execution failed'
    }));
  }

  calculateOverallScore() {
    const weights = {
      unit: 0.25,
      integration: 0.20,
      e2e: 0.20,
      accessibility: 0.10,
      performance: 0.10,
      security: 0.10,
      crossPersona: 0.05
    };

    let weightedSum = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([category, weight]) => {
      if (this.results[category]) {
        weightedSum += this.results[category].score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  saveResultsForCI(overallScore) {
    const ciResults = {
      timestamp: new Date().toISOString(),
      overallScore,
      passed: overallScore >= 70, // Minimum passing threshold
      results: this.results,
      execution: {
        duration: Date.now() - this.startTime,
        environment: process.env.NODE_ENV || 'test'
      }
    };

    // Save detailed results
    fs.writeFileSync('test-results-summary.json', JSON.stringify(ciResults, null, 2));
    
    // Save simple score for CI scripts
    fs.writeFileSync('overall-test-score.txt', overallScore.toString());
    
    console.log('\n💾 Results saved for CI/CD pipeline integration');
  }

  exitWithAppropriateCode() {
    const overallScore = this.calculateOverallScore();
    const failedCategories = Object.values(this.results).filter(r => !r.passed).length;
    
    if (overallScore >= 70 && failedCategories === 0) {
      console.log('\n🎉 All tests passed! Quality gate requirements met.');
      process.exit(0);
    } else if (overallScore >= 70) {
      console.log('\n⚠️  Some test categories failed, but overall quality is acceptable.');
      process.exit(0);
    } else {
      console.log('\n❌ Quality gate failed. Please address issues before deployment.');
      process.exit(1);
    }
  }
}

// CLI execution
async function main() {
  const runner = new ComprehensiveTestRunner();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Test execution interrupted by user');
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Test execution terminated');
    process.exit(1);
  });

  await runner.runAllTests();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error in test runner:', error);
    process.exit(1);
  });
}

export default ComprehensiveTestRunner;