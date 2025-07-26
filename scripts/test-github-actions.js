#!/usr/bin/env node

/**
 * RPA Script for GitHub Actions Testing
 * Playwright를 사용한 자동화된 GitHub Actions 상태 확인 및 테스트
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const CONFIG = {
  REPO_URL: 'https://github.com/djyalu/singapore_weather_cam',
  HEADLESS: process.env.HEADLESS !== 'false', // false로 설정하면 브라우저 창 표시
  TIMEOUT: 30000, // 30초 타임아웃
  SCREENSHOT_DIR: 'test-results/screenshots',
  REPORT_FILE: 'test-results/github-actions-test-report.json'
};

class GitHubActionsRPA {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0
      }
    };
  }

  async setup() {
    console.log('🚀 GitHub Actions RPA 테스트 시작...');
    
    // 결과 디렉토리 생성
    await fs.mkdir(CONFIG.SCREENSHOT_DIR, { recursive: true });
    
    // 브라우저 실행
    this.browser = await chromium.launch({ 
      headless: CONFIG.HEADLESS,
      slowMo: 1000 // 액션 간 1초 대기 (시각적 확인용)
    });
    
    this.page = await this.browser.newPage();
    this.page.setDefaultTimeout(CONFIG.TIMEOUT);
    
    console.log('✅ 브라우저 설정 완료');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    console.log('🧹 브라우저 정리 완료');
  }

  async takeScreenshot(name) {
    const filename = `${name}-${Date.now()}.png`;
    const filepath = path.join(CONFIG.SCREENSHOT_DIR, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 스크린샷 저장: ${filename}`);
    return filename;
  }

  async addTestResult(testName, status, details, screenshot = null) {
    this.results.tests.push({
      name: testName,
      status,
      details,
      screenshot,
      timestamp: new Date().toISOString()
    });
    
    this.results.summary.total++;
    if (status === 'passed') {
      this.results.summary.passed++;
      console.log(`✅ ${testName}: 통과`);
    } else {
      this.results.summary.failed++;
      console.log(`❌ ${testName}: 실패 - ${details}`);
    }
  }

  async navigateToActions() {
    console.log('🌐 GitHub Actions 페이지로 이동...');
    
    try {
      await this.page.goto(`${CONFIG.REPO_URL}/actions`);
      await this.page.waitForLoadState('networkidle');
      
      const screenshot = await this.takeScreenshot('actions-page');
      await this.addTestResult(
        'GitHub Actions 페이지 접근',
        'passed',
        'Actions 페이지에 성공적으로 접근함',
        screenshot
      );
      
      return true;
    } catch (error) {
      await this.addTestResult(
        'GitHub Actions 페이지 접근',
        'failed',
        `페이지 로드 실패: ${error.message}`
      );
      return false;
    }
  }

  async checkWorkflowsPresence() {
    console.log('📋 워크플로우 목록 확인...');
    
    try {
      // 워크플로우 목록 대기
      await this.page.waitForSelector('[data-testid="workflow-list"]', { timeout: 10000 });
      
      const expectedWorkflows = [
        'Collect Weather Data',
        'Capture Webcam Images', 
        'Deploy to GitHub Pages',
        'System Health Check',
        'Monitor GitHub Actions Usage'
      ];
      
      const foundWorkflows = [];
      const missingWorkflows = [];
      
      for (const workflowName of expectedWorkflows) {
        const selector = `text="${workflowName}"`;
        const element = await this.page.$(selector);
        
        if (element) {
          foundWorkflows.push(workflowName);
          console.log(`✅ 워크플로우 발견: ${workflowName}`);
        } else {
          missingWorkflows.push(workflowName);
          console.log(`❌ 워크플로우 누락: ${workflowName}`);
        }
      }
      
      const screenshot = await this.takeScreenshot('workflow-list');
      
      if (missingWorkflows.length === 0) {
        await this.addTestResult(
          '워크플로우 목록 확인',
          'passed',
          `모든 워크플로우 확인됨: ${foundWorkflows.join(', ')}`,
          screenshot
        );
        return true;
      } else {
        await this.addTestResult(
          '워크플로우 목록 확인',
          'failed',
          `누락된 워크플로우: ${missingWorkflows.join(', ')}`,
          screenshot
        );
        return false;
      }
    } catch (error) {
      await this.addTestResult(
        '워크플로우 목록 확인',
        'failed',
        `워크플로우 목록 로드 실패: ${error.message}`
      );
      return false;
    }
  }

  async checkWorkflowRuns() {
    console.log('🔄 최근 워크플로우 실행 확인...');
    
    try {
      // 첫 번째 워크플로우 클릭
      const firstWorkflow = await this.page.$('[data-testid="workflow-list"] a');
      if (firstWorkflow) {
        await firstWorkflow.click();
        await this.page.waitForLoadState('networkidle');
        
        // 실행 기록 확인
        const runElements = await this.page.$$('[data-testid="run-list"] [data-testid="run-item"]');
        const recentRuns = runElements.length;
        
        const screenshot = await this.takeScreenshot('workflow-runs');
        
        if (recentRuns > 0) {
          await this.addTestResult(
            '워크플로우 실행 기록',
            'passed',
            `${recentRuns}개의 실행 기록 확인됨`,
            screenshot
          );
          return true;
        } else {
          await this.addTestResult(
            '워크플로우 실행 기록',
            'failed',
            '실행 기록이 없음',
            screenshot
          );
          return false;
        }
      }
    } catch (error) {
      await this.addTestResult(
        '워크플로우 실행 기록',
        'failed',
        `실행 기록 확인 실패: ${error.message}`
      );
      return false;
    }
  }

  async testManualTrigger() {
    console.log('🔧 수동 실행 테스트...');
    
    try {
      // Actions 메인 페이지로 돌아가기
      await this.page.goto(`${CONFIG.REPO_URL}/actions`);
      await this.page.waitForLoadState('networkidle');
      
      // "Collect Weather Data" 워크플로우 클릭
      const weatherWorkflow = await this.page.$('text="Collect Weather Data"');
      if (weatherWorkflow) {
        await weatherWorkflow.click();
        await this.page.waitForLoadState('networkidle');
        
        // "Run workflow" 버튼 확인
        const runButton = await this.page.$('text="Run workflow"');
        if (runButton) {
          const screenshot = await this.takeScreenshot('manual-trigger-available');
          await this.addTestResult(
            '수동 실행 버튼 확인',
            'passed',
            'Run workflow 버튼이 사용 가능함',
            screenshot
          );
          
          // 실제 실행은 하지 않고 버튼 존재만 확인
          console.log('ℹ️ 실제 실행은 건너뛰고 버튼 존재만 확인함');
          return true;
        } else {
          const screenshot = await this.takeScreenshot('manual-trigger-missing');
          await this.addTestResult(
            '수동 실행 버튼 확인',
            'failed',
            'Run workflow 버튼을 찾을 수 없음',
            screenshot
          );
          return false;
        }
      }
    } catch (error) {
      await this.addTestResult(
        '수동 실행 버튼 확인',
        'failed',
        `수동 실행 테스트 실패: ${error.message}`
      );
      return false;
    }
  }

  async checkDataFiles() {
    console.log('📊 데이터 파일 상태 확인...');
    
    try {
      // 리포지토리 메인 페이지로 이동
      await this.page.goto(CONFIG.REPO_URL);
      await this.page.waitForLoadState('networkidle');
      
      // data 폴더 클릭
      const dataFolder = await this.page.$('text="data"');
      if (dataFolder) {
        await dataFolder.click();
        await this.page.waitForLoadState('networkidle');
        
        const screenshot = await this.takeScreenshot('data-folder');
        
        // 최근 커밋 시간 확인
        const commitTime = await this.page.$('.Box-row .text-small.color-fg-muted');
        if (commitTime) {
          const commitText = await commitTime.textContent();
          
          await this.addTestResult(
            '데이터 파일 상태',
            'passed',
            `데이터 폴더 확인됨. 최근 커밋: ${commitText}`,
            screenshot
          );
          return true;
        }
      }
      
      await this.addTestResult(
        '데이터 파일 상태',
        'failed',
        'data 폴더를 찾을 수 없음'
      );
      return false;
    } catch (error) {
      await this.addTestResult(
        '데이터 파일 상태',
        'failed',
        `데이터 파일 확인 실패: ${error.message}`
      );
      return false;
    }
  }

  async generateReport() {
    this.results.summary.duration = Date.now() - new Date(this.results.timestamp).getTime();
    
    // JSON 리포트 저장
    await fs.writeFile(
      CONFIG.REPORT_FILE,
      JSON.stringify(this.results, null, 2)
    );
    
    // 콘솔 요약 출력
    console.log('\n📊 테스트 결과 요약:');
    console.log(`✅ 통과: ${this.results.summary.passed}`);
    console.log(`❌ 실패: ${this.results.summary.failed}`);
    console.log(`📊 총 테스트: ${this.results.summary.total}`);
    console.log(`⏱️ 소요 시간: ${Math.round(this.results.summary.duration / 1000)}초`);
    console.log(`📄 상세 리포트: ${CONFIG.REPORT_FILE}`);
    
    return this.results.summary.failed === 0;
  }

  async runAllTests() {
    const startTime = Date.now();
    
    try {
      await this.setup();
      
      // 순차적으로 테스트 실행
      await this.navigateToActions();
      await this.checkWorkflowsPresence();
      await this.checkWorkflowRuns();
      await this.testManualTrigger();
      await this.checkDataFiles();
      
      const success = await this.generateReport();
      await this.cleanup();
      
      return success;
    } catch (error) {
      console.error('💥 테스트 실행 중 오류:', error);
      await this.cleanup();
      return false;
    }
  }
}

// 메인 실행
async function main() {
  console.log('🤖 GitHub Actions RPA 테스트 시작');
  console.log(`📁 리포지토리: ${CONFIG.REPO_URL}`);
  console.log(`🖥️ 헤드리스 모드: ${CONFIG.HEADLESS}`);
  console.log('');
  
  const rpa = new GitHubActionsRPA();
  const success = await rpa.runAllTests();
  
  if (success) {
    console.log('\n🎉 모든 테스트 통과!');
    process.exit(0);
  } else {
    console.log('\n⚠️ 일부 테스트 실패');
    process.exit(1);
  }
}

// 환경 확인
if (process.env.NODE_ENV === 'test' || process.argv.includes('--test')) {
  main().catch(console.error);
} else {
  console.log('ℹ️ RPA 테스트를 실행하려면 다음 명령어를 사용하세요:');
  console.log('NODE_ENV=test node scripts/test-github-actions.js');
  console.log('또는');
  console.log('node scripts/test-github-actions.js --test');
  console.log('');
  console.log('브라우저 창을 보려면:');
  console.log('HEADLESS=false NODE_ENV=test node scripts/test-github-actions.js');
}

export { GitHubActionsRPA };