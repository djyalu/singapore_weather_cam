#!/usr/bin/env node

/**
 * Quick RPA Test - 로컬 개발용 간단한 GitHub Actions 테스트
 * Playwright 없이도 기본적인 HTTP 요청으로 상태 확인
 */

import https from 'https';
import fs from 'fs/promises';

class QuickRPATest {
  constructor() {
    this.repoUrl = 'https://api.github.com/repos/djyalu/singapore_weather_cam';
    this.results = [];
  }

  async httpGet(url) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, {
        headers: {
          'User-Agent': 'Singapore-Weather-Cam-Test/1.0'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve(data);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  log(status, test, message) {
    const emoji = status === 'pass' ? '✅' : '❌';
    console.log(`${emoji} ${test}: ${message}`);
    this.results.push({ test, status, message, timestamp: new Date().toISOString() });
  }

  async testRepositoryAccess() {
    try {
      const repo = await this.httpGet(this.repoUrl);
      this.log('pass', 'Repository Access', `Repository accessible: ${repo.full_name}`);
      return true;
    } catch (error) {
      this.log('fail', 'Repository Access', `Failed: ${error.message}`);
      return false;
    }
  }

  async testWorkflowFiles() {
    try {
      const workflows = await this.httpGet(`${this.repoUrl}/contents/.github/workflows`);
      
      const expectedFiles = [
        'collect-weather.yml',
        'capture-webcam.yml', 
        'deploy.yml',
        'health-check.yml',
        'monitor-usage.yml'
      ];
      
      const foundFiles = workflows.map(w => w.name);
      const missingFiles = expectedFiles.filter(f => !foundFiles.includes(f));
      
      if (missingFiles.length === 0) {
        this.log('pass', 'Workflow Files', `All ${expectedFiles.length} workflow files found`);
        return true;
      } else {
        this.log('fail', 'Workflow Files', `Missing: ${missingFiles.join(', ')}`);
        return false;
      }
    } catch (error) {
      this.log('fail', 'Workflow Files', `Failed: ${error.message}`);
      return false;
    }
  }

  async testActionsRuns() {
    try {
      const runs = await this.httpGet(`${this.repoUrl}/actions/runs?per_page=10`);
      
      if (runs.total_count > 0) {
        const recentRuns = runs.workflow_runs.slice(0, 5);
        const successfulRuns = recentRuns.filter(r => r.conclusion === 'success').length;
        
        this.log('pass', 'Recent Actions', 
          `${recentRuns.length} recent runs, ${successfulRuns} successful`);
        
        // 최근 실행들의 상태 요약
        recentRuns.forEach(run => {
          const status = run.conclusion === 'success' ? '✅' : 
                        run.conclusion === 'failure' ? '❌' : '⏳';
          console.log(`  ${status} ${run.name}: ${run.conclusion || 'running'} (${new Date(run.created_at).toLocaleString()})`);
        });
        
        return true;
      } else {
        this.log('fail', 'Recent Actions', 'No workflow runs found');
        return false;
      }
    } catch (error) {
      this.log('fail', 'Recent Actions', `Failed: ${error.message}`);
      return false;
    }
  }

  async testDataFiles() {
    try {
      // 날씨 데이터 확인
      const weatherData = await this.httpGet(`${this.repoUrl}/contents/data/weather/latest.json`);
      const weatherDate = new Date(weatherData.sha); // GitHub의 마지막 수정 시간 대신 커밋 해시 사용
      
      // 웹캠 데이터 확인  
      const webcamData = await this.httpGet(`${this.repoUrl}/contents/data/webcam/latest.json`);
      
      this.log('pass', 'Data Files', 
        `Weather and webcam data files exist`);
      
      console.log(`  📊 Weather data: ${weatherData.size} bytes`);
      console.log(`  📸 Webcam data: ${webcamData.size} bytes`);
      
      return true;
    } catch (error) {
      this.log('fail', 'Data Files', `Failed: ${error.message}`);
      return false;
    }
  }

  async testWebsiteDeployment() {
    try {
      // GitHub Pages URL 테스트
      const websiteUrl = 'https://djyalu.github.io/singapore_weather_cam/';
      const response = await this.httpGet(websiteUrl);
      
      this.log('pass', 'Website Deployment', 'Website is accessible');
      return true;
    } catch (error) {
      this.log('fail', 'Website Deployment', `Website not accessible: ${error.message}`);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Quick RPA Test for GitHub Actions');
    console.log('=====================================\n');
    
    const tests = [
      () => this.testRepositoryAccess(),
      () => this.testWorkflowFiles(),
      () => this.testActionsRuns(),
      () => this.testDataFiles(),
      () => this.testWebsiteDeployment()
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      try {
        const result = await test();
        if (result) passed++;
        else failed++;
      } catch (error) {
        console.log(`❌ Test error: ${error.message}`);
        failed++;
      }
      console.log(''); // 빈 줄 추가
    }
    
    console.log('=====================================');
    console.log('📊 Test Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${passed + failed}`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! GitHub Actions seems to be working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Check the details above.');
    }
    
    // 결과를 파일로 저장
    try {
      await fs.mkdir('test-results', { recursive: true });
      await fs.writeFile('test-results/quick-test-report.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: { passed, failed, total: passed + failed },
        results: this.results
      }, null, 2));
      console.log('📄 Report saved to: test-results/quick-test-report.json');
    } catch (error) {
      console.log('⚠️ Could not save report:', error.message);
    }
    
    return failed === 0;
  }
}

// 실행
const test = new QuickRPATest();
test.runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test runner error:', error);
  process.exit(1);
});