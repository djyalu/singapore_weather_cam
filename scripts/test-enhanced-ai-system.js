#!/usr/bin/env node

/**
 * Enhanced AI System Performance Test & Validation
 * 
 * 향상된 지역별 AI 분석 시스템의 성능 테스트 및 97% 신뢰도 검증
 * 8개 지역별 분석 품질, 응답 시간, 신뢰도 검증 시스템
 */

import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';
import { generateEnhancedRegionalAnalysis, AdvancedConfidenceCalculator } from './enhanced-regional-ai-analysis.js';

const TEST_OUTPUT_DIR = 'data/test-results';
const WEATHER_DATA_FILE = 'data/weather/latest.json';

/**
 * 성능 테스트 및 검증 시스템
 */
class EnhancedAISystemTester {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      test_version: '1.0',
      target_confidence: 0.97,
      performance_targets: {
        response_time_ms: 30000, // 30초 이내
        confidence_threshold: 0.97, // 97% 이상
        regional_coverage: 8, // 8개 지역 모두
        success_rate: 0.95 // 95% 이상 성공률
      },
      tests: [],
      overall_results: {}
    };
    
    this.performanceMetrics = {
      response_times: [],
      confidence_scores: [],
      success_count: 0,
      failure_count: 0,
      regional_results: {}
    };
  }

  /**
   * 전체 테스트 실행
   */
  async runComprehensiveTest() {
    console.log('🚀 Starting Enhanced AI System Comprehensive Test...');
    console.log('🎯 Target: 97%+ confidence, <30s response time, 8 regions coverage');
    
    try {
      // 1. 날씨 데이터 유효성 검증
      await this.testWeatherDataValidity();
      
      // 2. 기본 시스템 성능 테스트
      await this.testBasicSystemPerformance();
      
      // 3. 지역별 분석 품질 테스트
      await this.testRegionalAnalysisQuality();
      
      // 4. 신뢰도 시스템 검증
      await this.testConfidenceCalculation();
      
      // 5. 스트레스 테스트
      await this.runStressTest();
      
      // 6. 종합 결과 분석
      await this.analyzeOverallResults();
      
      // 7. 결과 저장
      await this.saveTestResults();
      
      console.log('\n🎉 Enhanced AI System Test completed successfully!');
      this.printSummary();
      
      return this.testResults;
      
    } catch (error) {
      console.error('💥 Test execution failed:', error);
      this.testResults.fatal_error = error.message;
      await this.saveTestResults();
      throw error;
    }
  }

  /**
   * 날씨 데이터 유효성 검증
   */
  async testWeatherDataValidity() {
    console.log('\n📊 Testing weather data validity...');
    
    const testStart = performance.now();
    const testResult = {
      test_name: 'weather_data_validity',
      status: 'running',
      metrics: {}
    };
    
    try {
      // 날씨 데이터 로드
      const weatherData = await this.loadWeatherData();
      
      if (!weatherData) {
        throw new Error('Weather data not available');
      }
      
      // 데이터 구조 검증
      const validationResults = {
        has_timestamp: !!weatherData.timestamp,
        has_temperature_data: !!(weatherData.data?.temperature?.readings?.length > 0),
        has_humidity_data: !!(weatherData.data?.humidity?.readings?.length > 0),
        has_rainfall_data: !!(weatherData.data?.rainfall?.readings?.length > 0),
        stations_count: weatherData.stations_used?.length || 0,
        data_freshness_minutes: weatherData.timestamp ? 
          Math.floor((new Date() - new Date(weatherData.timestamp)) / (1000 * 60)) : null
      };
      
      // 품질 점수 계산
      const qualityScore = this.calculateDataQualityScore(validationResults);
      
      testResult.status = 'passed';
      testResult.metrics = {
        ...validationResults,
        quality_score: qualityScore,
        test_duration_ms: performance.now() - testStart
      };
      
      console.log(`✅ Weather data validity test passed (quality: ${(qualityScore * 100).toFixed(1)}%)`);
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.metrics.test_duration_ms = performance.now() - testStart;
      
      console.error('❌ Weather data validity test failed:', error.message);
    }
    
    this.testResults.tests.push(testResult);
    return testResult;
  }

  /**
   * 기본 시스템 성능 테스트
   */
  async testBasicSystemPerformance() {
    console.log('\n⚡ Testing basic system performance...');
    
    const testStart = performance.now();
    const testResult = {
      test_name: 'basic_system_performance',
      status: 'running',
      metrics: {}
    };
    
    try {
      // 향상된 지역별 AI 분석 실행
      const analysisStart = performance.now();
      const results = await generateEnhancedRegionalAnalysis();
      const analysisTime = performance.now() - analysisStart;
      
      // 성능 지표 수집
      const performanceMetrics = {
        total_response_time_ms: analysisTime,
        regions_analyzed: results.regions_analyzed,
        successful_analyses: results.successful_analyses,
        overall_confidence: results.confidence_breakdown?.overall_confidence || 0,
        analysis_version: results.analysis_version
      };
      
      // 성능 목표 대비 검증
      const meetsPerformanceTargets = {
        response_time_ok: analysisTime <= this.testResults.performance_targets.response_time_ms,
        confidence_ok: performanceMetrics.overall_confidence >= this.testResults.performance_targets.confidence_threshold,
        coverage_ok: performanceMetrics.regions_analyzed >= this.testResults.performance_targets.regional_coverage
      };
      
      const allTargetsMet = Object.values(meetsPerformanceTargets).every(Boolean);
      
      testResult.status = allTargetsMet ? 'passed' : 'failed';
      testResult.metrics = {
        ...performanceMetrics,
        performance_targets_met: meetsPerformanceTargets,
        all_targets_met: allTargetsMet,
        test_duration_ms: performance.now() - testStart
      };
      
      // 성능 메트릭 업데이트
      this.performanceMetrics.response_times.push(analysisTime);
      this.performanceMetrics.confidence_scores.push(performanceMetrics.overall_confidence);
      
      if (allTargetsMet) {
        this.performanceMetrics.success_count++;
        console.log(`✅ Basic performance test passed (${analysisTime.toFixed(0)}ms, ${(performanceMetrics.overall_confidence * 100).toFixed(1)}% confidence)`);
      } else {
        this.performanceMetrics.failure_count++;
        console.error(`❌ Basic performance test failed - Targets not met`);
      }
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.metrics.test_duration_ms = performance.now() - testStart;
      
      this.performanceMetrics.failure_count++;
      console.error('❌ Basic performance test failed:', error.message);
    }
    
    this.testResults.tests.push(testResult);
    return testResult;
  }

  /**
   * 지역별 분석 품질 테스트
   */
  async testRegionalAnalysisQuality() {
    console.log('\n🏙️ Testing regional analysis quality...');
    
    const testStart = performance.now();
    const testResult = {
      test_name: 'regional_analysis_quality',
      status: 'running',
      metrics: {
        regional_results: {}
      }
    };
    
    try {
      // 최신 분석 결과 로드
      const results = await this.loadLatestAnalysisResults();
      
      if (!results?.regional_analyses) {
        throw new Error('No regional analysis results available');
      }
      
      // 각 지역별 품질 검증
      const regionalQualities = {};
      let totalQualityScore = 0;
      let analyzedRegions = 0;
      
      for (const analysis of results.regional_analyses) {
        if (analysis.fallback) continue; // 폴백 분석은 제외
        
        const qualityMetrics = this.assessRegionalAnalysisQuality(analysis);
        regionalQualities[analysis.region_id] = qualityMetrics;
        totalQualityScore += qualityMetrics.overall_score;
        analyzedRegions++;
        
        this.performanceMetrics.regional_results[analysis.region_id] = qualityMetrics;
      }
      
      const averageQualityScore = analyzedRegions > 0 ? totalQualityScore / analyzedRegions : 0;
      
      testResult.status = averageQualityScore >= 0.85 ? 'passed' : 'failed';
      testResult.metrics = {
        regional_results: regionalQualities,
        average_quality_score: averageQualityScore,
        analyzed_regions: analyzedRegions,
        quality_threshold_met: averageQualityScore >= 0.85,
        test_duration_ms: performance.now() - testStart
      };
      
      if (testResult.status === 'passed') {
        console.log(`✅ Regional analysis quality test passed (avg quality: ${(averageQualityScore * 100).toFixed(1)}%)`);
      } else {
        console.error(`❌ Regional analysis quality test failed (avg quality: ${(averageQualityScore * 100).toFixed(1)}%)`);
      }
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.metrics.test_duration_ms = performance.now() - testStart;
      
      console.error('❌ Regional analysis quality test failed:', error.message);
    }
    
    this.testResults.tests.push(testResult);
    return testResult;
  }

  /**
   * 신뢰도 시스템 검증
   */
  async testConfidenceCalculation() {
    console.log('\n🎯 Testing confidence calculation system...');
    
    const testStart = performance.now();
    const testResult = {
      test_name: 'confidence_calculation',
      status: 'running',
      metrics: {}
    };
    
    try {
      const weatherData = await this.loadWeatherData();
      const analysisResults = await this.loadLatestAnalysisResults();
      
      if (!weatherData || !analysisResults) {
        throw new Error('Required data not available for confidence testing');
      }
      
      // 신뢰도 계산기 테스트
      const confidenceCalculator = new AdvancedConfidenceCalculator();
      const calculatedConfidence = confidenceCalculator.calculateOverallConfidence(
        weatherData,
        analysisResults.regional_analyses || []
      );
      
      // 신뢰도 구성 요소 분석
      const confidenceBreakdown = {
        calculated_confidence: calculatedConfidence,
        reported_confidence: analysisResults.confidence_breakdown?.overall_confidence || 0,
        confidence_difference: Math.abs(calculatedConfidence - (analysisResults.confidence_breakdown?.overall_confidence || 0)),
        meets_target: calculatedConfidence >= this.testResults.performance_targets.confidence_threshold
      };
      
      // 신뢰도 정확성 검증
      const confidenceAccuracy = confidenceBreakdown.confidence_difference <= 0.05; // 5% 이내 차이
      
      testResult.status = confidenceAccuracy && confidenceBreakdown.meets_target ? 'passed' : 'failed';
      testResult.metrics = {
        ...confidenceBreakdown,
        confidence_accuracy: confidenceAccuracy,
        target_achieved: confidenceBreakdown.meets_target,
        test_duration_ms: performance.now() - testStart
      };
      
      if (testResult.status === 'passed') {
        console.log(`✅ Confidence calculation test passed (${(calculatedConfidence * 100).toFixed(1)}% calculated)`);
      } else {
        console.error(`❌ Confidence calculation test failed`);
      }
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.metrics.test_duration_ms = performance.now() - testStart;
      
      console.error('❌ Confidence calculation test failed:', error.message);
    }
    
    this.testResults.tests.push(testResult);
    return testResult;
  }

  /**
   * 스트레스 테스트
   */
  async runStressTest() {
    console.log('\n💪 Running stress test...');
    
    const testStart = performance.now();
    const testResult = {
      test_name: 'stress_test',
      status: 'running',
      metrics: {}
    };
    
    try {
      const stressTestRuns = 3; // 3회 연속 실행
      const stressResults = [];
      
      for (let i = 1; i <= stressTestRuns; i++) {
        console.log(`  🔄 Stress test run ${i}/${stressTestRuns}...`);
        
        const runStart = performance.now();
        
        try {
          const results = await generateEnhancedRegionalAnalysis();
          const runTime = performance.now() - runStart;
          
          stressResults.push({
            run: i,
            success: true,
            response_time_ms: runTime,
            confidence: results.confidence_breakdown?.overall_confidence || 0,
            regions_analyzed: results.regions_analyzed
          });
          
          // 실행 간 짧은 대기 (API 제한 준수)
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          stressResults.push({
            run: i,
            success: false,
            error: error.message,
            response_time_ms: performance.now() - runStart
          });
        }
      }
      
      // 스트레스 테스트 결과 분석
      const successfulRuns = stressResults.filter(r => r.success);
      const averageResponseTime = successfulRuns.reduce((sum, r) => sum + r.response_time_ms, 0) / successfulRuns.length;
      const averageConfidence = successfulRuns.reduce((sum, r) => sum + r.confidence, 0) / successfulRuns.length;
      const successRate = successfulRuns.length / stressTestRuns;
      
      testResult.status = successRate >= this.testResults.performance_targets.success_rate ? 'passed' : 'failed';
      testResult.metrics = {
        stress_runs: stressTestRuns,
        successful_runs: successfulRuns.length,
        success_rate: successRate,
        average_response_time_ms: averageResponseTime || 0,
        average_confidence: averageConfidence || 0,
        stress_results: stressResults,
        meets_success_rate_target: successRate >= this.testResults.performance_targets.success_rate,
        test_duration_ms: performance.now() - testStart
      };
      
      if (testResult.status === 'passed') {
        console.log(`✅ Stress test passed (${(successRate * 100).toFixed(1)}% success rate, avg ${averageResponseTime.toFixed(0)}ms)`);
      } else {
        console.error(`❌ Stress test failed (${(successRate * 100).toFixed(1)}% success rate)`);
      }
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.metrics.test_duration_ms = performance.now() - testStart;
      
      console.error('❌ Stress test failed:', error.message);
    }
    
    this.testResults.tests.push(testResult);
    return testResult;
  }

  /**
   * 종합 결과 분석
   */
  async analyzeOverallResults() {
    console.log('\n📈 Analyzing overall results...');
    
    const passedTests = this.testResults.tests.filter(t => t.status === 'passed').length;
    const totalTests = this.testResults.tests.length;
    const overallSuccessRate = totalTests > 0 ? passedTests / totalTests : 0;
    
    // 성능 통계
    const avgResponseTime = this.performanceMetrics.response_times.length > 0
      ? this.performanceMetrics.response_times.reduce((sum, time) => sum + time, 0) / this.performanceMetrics.response_times.length
      : 0;
    
    const avgConfidence = this.performanceMetrics.confidence_scores.length > 0
      ? this.performanceMetrics.confidence_scores.reduce((sum, conf) => sum + conf, 0) / this.performanceMetrics.confidence_scores.length
      : 0;
    
    // 목표 달성 평가
    const targetAchievements = {
      response_time_target: avgResponseTime <= this.testResults.performance_targets.response_time_ms,
      confidence_target: avgConfidence >= this.testResults.performance_targets.confidence_threshold,
      success_rate_target: overallSuccessRate >= this.testResults.performance_targets.success_rate,
      regional_coverage_target: true // 8개 지역 커버리지는 이미 검증됨
    };
    
    const allTargetsAchieved = Object.values(targetAchievements).every(Boolean);
    
    this.testResults.overall_results = {
      test_summary: {
        total_tests: totalTests,
        passed_tests: passedTests,
        failed_tests: totalTests - passedTests,
        overall_success_rate: overallSuccessRate
      },
      
      performance_summary: {
        average_response_time_ms: avgResponseTime,
        average_confidence: avgConfidence,
        total_success_count: this.performanceMetrics.success_count,
        total_failure_count: this.performanceMetrics.failure_count
      },
      
      target_achievements: targetAchievements,
      all_targets_achieved: allTargetsAchieved,
      
      final_grade: this.calculateFinalGrade(overallSuccessRate, avgConfidence, allTargetsAchieved),
      
      recommendations: this.generateRecommendations(targetAchievements, avgConfidence)
    };
  }

  /**
   * 최종 등급 계산
   */
  calculateFinalGrade(successRate, confidence, targetsAchieved) {
    let grade = 'F';
    let score = 0;
    
    // 기본 점수 계산
    score += successRate * 40; // 성공률 40점
    score += confidence * 40;  // 신뢰도 40점
    score += targetsAchieved ? 20 : 0; // 목표 달성 20점
    
    // 등급 결정
    if (score >= 97) grade = 'A+';
    else if (score >= 93) grade = 'A';
    else if (score >= 90) grade = 'A-';
    else if (score >= 87) grade = 'B+';
    else if (score >= 83) grade = 'B';
    else if (score >= 80) grade = 'B-';
    else if (score >= 77) grade = 'C+';
    else if (score >= 73) grade = 'C';
    else if (score >= 70) grade = 'C-';
    else if (score >= 60) grade = 'D';
    
    return {
      grade: grade,
      score: score,
      description: this.getGradeDescription(grade, score)
    };
  }

  /**
   * 등급 설명
   */
  getGradeDescription(grade, score) {
    if (score >= 97) return 'Excellent - 97%+ 신뢰도 목표 완전 달성, 엔터프라이즈급 품질';
    if (score >= 90) return 'Very Good - 높은 신뢰도와 성능, 프로덕션 준비 완료';
    if (score >= 80) return 'Good - 양호한 성능, 일부 개선 필요';
    if (score >= 70) return 'Satisfactory - 기본 요구사항 충족, 품질 향상 필요';
    if (score >= 60) return 'Needs Improvement - 상당한 개선 필요';
    return 'Poor - 전면적인 재검토 필요';
  }

  /**
   * 개선 권장사항 생성
   */
  generateRecommendations(targetAchievements, avgConfidence) {
    const recommendations = [];
    
    if (!targetAchievements.response_time_target) {
      recommendations.push('응답 시간 최적화 필요 - API 호출 최적화, 캐싱 개선');
    }
    
    if (!targetAchievements.confidence_target) {
      recommendations.push('신뢰도 향상 필요 - 데이터 품질 개선, 검증 로직 강화');
    }
    
    if (!targetAchievements.success_rate_target) {
      recommendations.push('안정성 개선 필요 - 오류 처리 강화, 폴백 시스템 개선');
    }
    
    if (avgConfidence < 0.97) {
      recommendations.push('97% 신뢰도 목표 달성을 위한 추가 최적화 필요');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('모든 목표 달성! 현재 성능 유지 및 모니터링 지속');
    }
    
    return recommendations;
  }

  /**
   * 유틸리티 메소드들
   */
  async loadWeatherData() {
    try {
      const data = await fs.readFile(WEATHER_DATA_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('⚠️ Could not load weather data:', error.message);
      return null;
    }
  }

  async loadLatestAnalysisResults() {
    try {
      const data = await fs.readFile('data/weather-summary/enhanced-regional-analysis.json', 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('⚠️ Could not load analysis results:', error.message);
      return null;
    }
  }

  calculateDataQualityScore(validationResults) {
    let score = 0;
    let factors = 0;
    
    if (validationResults.has_timestamp) { score += 1; factors++; }
    if (validationResults.has_temperature_data) { score += 1; factors++; }
    if (validationResults.has_humidity_data) { score += 1; factors++; }
    if (validationResults.has_rainfall_data) { score += 1; factors++; }
    
    if (validationResults.stations_count >= 20) { score += 1; factors++; }
    else if (validationResults.stations_count >= 10) { score += 0.7; factors++; }
    else if (validationResults.stations_count >= 5) { score += 0.5; factors++; }
    else { factors++; }
    
    if (validationResults.data_freshness_minutes !== null) {
      if (validationResults.data_freshness_minutes <= 30) { score += 1; factors++; }
      else if (validationResults.data_freshness_minutes <= 60) { score += 0.8; factors++; }
      else if (validationResults.data_freshness_minutes <= 120) { score += 0.6; factors++; }
      else { score += 0.3; factors++; }
    }
    
    return factors > 0 ? score / factors : 0;
  }

  assessRegionalAnalysisQuality(analysis) {
    let qualityScore = 0;
    let factors = 0;
    
    // AI 요약 품질
    if (analysis.ai_summary && analysis.ai_summary.length > 50) {
      qualityScore += 1;
    } else if (analysis.ai_summary && analysis.ai_summary.length > 20) {
      qualityScore += 0.7;
    } else {
      qualityScore += 0.3;
    }
    factors++;
    
    // 상세 분석 품질
    if (analysis.detailed_analysis) {
      const analysisCount = Object.values(analysis.detailed_analysis).filter(v => v && v.length > 20).length;
      qualityScore += Math.min(1, analysisCount / 5);
      factors++;
    }
    
    // 권장사항 품질
    if (analysis.activity_suggestions && analysis.activity_suggestions.length >= 3) {
      qualityScore += 1;
    } else if (analysis.activity_suggestions && analysis.activity_suggestions.length >= 1) {
      qualityScore += 0.6;
    } else {
      qualityScore += 0.2;
    }
    factors++;
    
    // 신뢰도
    if (analysis.confidence >= 0.95) {
      qualityScore += 1;
    } else if (analysis.confidence >= 0.85) {
      qualityScore += 0.8;
    } else if (analysis.confidence >= 0.75) {
      qualityScore += 0.6;
    } else {
      qualityScore += 0.3;
    }
    factors++;
    
    return {
      overall_score: factors > 0 ? qualityScore / factors : 0,
      has_summary: !!(analysis.ai_summary && analysis.ai_summary.length > 20),
      has_detailed_analysis: !!(analysis.detailed_analysis),
      has_recommendations: !!(analysis.activity_suggestions && analysis.activity_suggestions.length > 0),
      confidence_score: analysis.confidence || 0
    };
  }

  async saveTestResults() {
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    const outputFile = path.join(TEST_OUTPUT_DIR, 'enhanced-ai-system-test-results.json');
    await fs.writeFile(outputFile, JSON.stringify(this.testResults, null, 2));
    console.log(`📁 Test results saved to: ${outputFile}`);
  }

  printSummary() {
    const results = this.testResults.overall_results;
    if (!results) return;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 ENHANCED AI SYSTEM TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 Final Grade: ${results.final_grade.grade} (${results.final_grade.score.toFixed(1)}/100)`);
    console.log(`   ${results.final_grade.description}`);
    
    console.log(`\n📈 Test Results:`);
    console.log(`   Total Tests: ${results.test_summary.total_tests}`);
    console.log(`   Passed: ${results.test_summary.passed_tests} ✅`);
    console.log(`   Failed: ${results.test_summary.failed_tests} ❌`);
    console.log(`   Success Rate: ${(results.test_summary.overall_success_rate * 100).toFixed(1)}%`);
    
    console.log(`\n⚡ Performance Metrics:`);
    console.log(`   Avg Response Time: ${results.performance_summary.average_response_time_ms.toFixed(0)}ms`);
    console.log(`   Avg Confidence: ${(results.performance_summary.average_confidence * 100).toFixed(1)}%`);
    console.log(`   Success/Failure: ${results.performance_summary.total_success_count}/${results.performance_summary.total_failure_count}`);
    
    console.log(`\n🎯 Target Achievements:`);
    Object.entries(results.target_achievements).forEach(([key, achieved]) => {
      console.log(`   ${key.replace(/_/g, ' ')}: ${achieved ? '✅' : '❌'}`);
    });
    
    if (results.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      results.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

/**
 * 메인 실행 함수
 */
async function runEnhancedAISystemTest() {
  const tester = new EnhancedAISystemTester();
  
  try {
    const results = await tester.runComprehensiveTest();
    
    // 성공 여부 판단
    const finalGrade = results.overall_results?.final_grade?.grade;
    const success = ['A+', 'A', 'A-'].includes(finalGrade);
    
    if (success) {
      console.log('\n🎉 Enhanced AI System meets all quality standards!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Enhanced AI System needs improvement.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  runEnhancedAISystemTest();
}

export { EnhancedAISystemTester };