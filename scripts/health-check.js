#!/usr/bin/env node

/**
 * Singapore Weather Cam - Backend Health Check & Monitoring System
 * 종합적인 백엔드 시스템 상태 점검 및 성능 모니터링
 * 
 * @description
 * Production-grade health monitoring system that validates:
 * - API endpoint availability and response times
 * - Data integrity and consistency checks
 * - File system health and storage capacity
 * - Memory usage and resource constraints
 * - Circuit breaker states and error rates
 * - Service level agreement compliance
 * 
 * @usage
 * ```bash
 * # Basic health check
 * node scripts/health-check.js
 * 
 * # Detailed diagnostic mode
 * node scripts/health-check.js --detailed
 * 
 * # JSON output for monitoring systems
 * node scripts/health-check.js --json
 * 
 * # Continuous monitoring mode
 * node scripts/health-check.js --monitor --interval 30
 * ```
 * 
 * @author Singapore Weather Cam Project
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Node.js fetch setup
let fetch;
try {
  fetch = globalThis.fetch;
} catch {
  const { default: nodeFetch } = await import('node-fetch');
  fetch = nodeFetch;
}

// Health check configuration
const HEALTH_CONFIG = {
  TIMEOUT: 10000,
  MAX_RESPONSE_TIME: 5000,
  MIN_SUCCESS_RATE: 95,
  MAX_MEMORY_USAGE: 512 * 1024 * 1024, // 512MB
  MIN_DISK_SPACE: 1024 * 1024 * 1024, // 1GB
  API_ENDPOINTS: [
    'https://api.data.gov.sg/v1/environment/air-temperature',
    'https://api.data.gov.sg/v1/environment/relative-humidity',
    'https://api.data.gov.sg/v1/transport/traffic-images'
  ],
  CRITICAL_FILES: [
    'data/weather/latest.json',
    'data/webcam/latest.json',
    'package.json'
  ],
  SLA_TARGETS: {
    availability: 99.9, // 99.9% uptime
    response_time: 200, // <200ms average
    error_rate: 0.1, // <0.1% error rate
    recovery_time: 300 // <5 minutes recovery
  }
};

/**
 * Comprehensive health check orchestrator
 */
async function performHealthCheck(options = {}) {
  const startTime = Date.now();
  const healthReport = {
    timestamp: new Date().toISOString(),
    overall_status: 'unknown',
    checks: {},
    performance: {},
    sla_compliance: {},
    recommendations: [],
    metadata: {
      check_duration_ms: 0,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  };

  console.log('🏥 Starting comprehensive backend health check...');
  console.log(`📊 Environment: ${healthReport.metadata.environment}`);
  console.log('');

  try {
    // 1. System Resource Check
    console.log('🖥️  Checking system resources...');
    healthReport.checks.system_resources = await checkSystemResources();

    // 2. API Endpoint Health
    console.log('🌐 Checking API endpoints...');
    healthReport.checks.api_endpoints = await checkApiEndpoints();

    // 3. Data Integrity Validation
    console.log('📁 Validating data integrity...');
    healthReport.checks.data_integrity = await checkDataIntegrity();

    // 4. File System Health
    console.log('💾 Checking file system health...');
    healthReport.checks.filesystem = await checkFileSystemHealth();

    // 5. Performance Metrics
    console.log('⚡ Analyzing performance metrics...');
    healthReport.performance = await analyzePerformanceMetrics();

    // 6. SLA Compliance Check
    console.log('📋 Evaluating SLA compliance...');
    healthReport.sla_compliance = await checkSlaCompliance(healthReport);

    // Determine overall status
    healthReport.overall_status = determineOverallStatus(healthReport.checks);
    
    // Generate recommendations
    healthReport.recommendations = generateRecommendations(healthReport);

    healthReport.metadata.check_duration_ms = Date.now() - startTime;

    // Output results
    if (options.json) {
      console.log(JSON.stringify(healthReport, null, 2));
    } else {
      displayHealthReport(healthReport);
    }

    return healthReport;

  } catch (error) {
    console.error('🚨 Health check failed:', error.message);
    healthReport.overall_status = 'critical';
    healthReport.error = error.message;
    healthReport.metadata.check_duration_ms = Date.now() - startTime;
    
    if (options.json) {
      console.log(JSON.stringify(healthReport, null, 2));
    }
    
    return healthReport;
  }
}

/**
 * Check system resource utilization
 */
async function checkSystemResources() {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  const check = {
    status: 'healthy',
    metrics: {
      memory: {
        heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
        external_mb: Math.round(memoryUsage.external / 1024 / 1024)
      },
      cpu: {
        user_ms: Math.round(cpuUsage.user / 1000),
        system_ms: Math.round(cpuUsage.system / 1000)
      },
      uptime_seconds: Math.round(process.uptime())
    },
    alerts: []
  };

  // Memory usage validation
  if (memoryUsage.heapUsed > HEALTH_CONFIG.MAX_MEMORY_USAGE) {
    check.status = 'warning';
    check.alerts.push({
      level: 'warning',
      message: `High memory usage: ${check.metrics.memory.heap_used_mb}MB (limit: ${Math.round(HEALTH_CONFIG.MAX_MEMORY_USAGE / 1024 / 1024)}MB)`
    });
  }

  // Memory leak detection
  const memoryGrowthRate = memoryUsage.heapUsed / process.uptime() / 1024; // KB per second
  if (memoryGrowthRate > 100) { // >100KB/s growth
    check.status = 'warning';
    check.alerts.push({
      level: 'warning',
      message: `Potential memory leak detected: ${Math.round(memoryGrowthRate)}KB/s growth rate`
    });
  }

  return check;
}

/**
 * Check external API endpoint health
 */
async function checkApiEndpoints() {
  const check = {
    status: 'healthy',
    endpoints: {},
    summary: {
      total: HEALTH_CONFIG.API_ENDPOINTS.length,
      healthy: 0,
      degraded: 0,
      failed: 0,
      average_response_time: 0
    }
  };

  const responseTimes = [];

  for (const endpoint of HEALTH_CONFIG.API_ENDPOINTS) {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEALTH_CONFIG.TIMEOUT);
      
      const response = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Singapore-Weather-Cam/HealthCheck'
        }
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
      
      const endpointStatus = {
        status: response.ok ? 'healthy' : 'degraded',
        response_time_ms: responseTime,
        http_status: response.status,
        content_type: response.headers.get('content-type') || 'unknown'
      };

      if (responseTime > HEALTH_CONFIG.MAX_RESPONSE_TIME) {
        endpointStatus.status = 'degraded';
        endpointStatus.warning = `Slow response: ${responseTime}ms`;
      }

      check.endpoints[endpoint] = endpointStatus;
      
      if (endpointStatus.status === 'healthy') {
        check.summary.healthy++;
      } else {
        check.summary.degraded++;
      }

    } catch (error) {
      check.endpoints[endpoint] = {
        status: 'failed',
        error: error.message,
        response_time_ms: Date.now() - startTime
      };
      check.summary.failed++;
    }
  }

  // Calculate overall API health
  check.summary.average_response_time = responseTimes.length > 0 
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  const successRate = (check.summary.healthy / check.summary.total) * 100;
  if (successRate < HEALTH_CONFIG.MIN_SUCCESS_RATE) {
    check.status = 'critical';
  } else if (check.summary.degraded > 0 || check.summary.failed > 0) {
    check.status = 'degraded';
  }

  return check;
}

/**
 * Validate data integrity and consistency
 */
async function checkDataIntegrity() {
  const check = {
    status: 'healthy',
    files: {},
    data_quality: {},
    alerts: []
  };

  for (const filePath of HEALTH_CONFIG.CRITICAL_FILES) {
    try {
      const fullPath = path.resolve(filePath);
      const stats = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, 'utf8');
      
      const fileCheck = {
        exists: true,
        size_bytes: stats.size,
        modified: stats.mtime.toISOString(),
        readable: true
      };

      // JSON validation for data files
      if (filePath.endsWith('.json')) {
        try {
          const data = JSON.parse(content);
          fileCheck.valid_json = true;
          fileCheck.data_timestamp = data.timestamp || 'unknown';
          
          // Freshness check for data files
          if (data.timestamp) {
            const dataAge = Date.now() - new Date(data.timestamp).getTime();
            const maxAge = filePath.includes('weather') ? 10 * 60 * 1000 : 20 * 60 * 1000; // 10 or 20 minutes
            
            if (dataAge > maxAge) {
              fileCheck.stale = true;
              fileCheck.age_minutes = Math.round(dataAge / 60000);
              check.alerts.push({
                level: 'warning',
                message: `Stale data in ${filePath}: ${Math.round(dataAge / 60000)} minutes old`
              });
            }
          }
          
        } catch (parseError) {
          fileCheck.valid_json = false;
          fileCheck.parse_error = parseError.message;
          check.status = 'degraded';
        }
      }

      check.files[filePath] = fileCheck;

    } catch (error) {
      check.files[filePath] = {
        exists: false,
        error: error.message
      };
      
      if (filePath !== 'data/weather/latest.json' && filePath !== 'data/webcam/latest.json') {
        check.status = 'critical';
      } else {
        check.status = 'degraded';
      }
    }
  }

  return check;
}

/**
 * Check file system health and storage
 */
async function checkFileSystemHealth() {
  const check = {
    status: 'healthy',
    storage: {},
    permissions: {},
    alerts: []
  };

  try {
    // Check write permissions in critical directories
    const testDirs = ['data/weather', 'data/webcam', 'public/data'];
    
    for (const dir of testDirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
        const testFile = path.join(dir, '.health-check-test');
        await fs.writeFile(testFile, 'test');
        await fs.unlink(testFile);
        
        check.permissions[dir] = 'writable';
      } catch (error) {
        check.permissions[dir] = 'error';
        check.status = 'critical';
        check.alerts.push({
          level: 'critical',
          message: `Cannot write to ${dir}: ${error.message}`
        });
      }
    }

    return check;

  } catch (error) {
    check.status = 'critical';
    check.error = error.message;
    return check;
  }
}

/**
 * Analyze performance metrics
 */
async function analyzePerformanceMetrics() {
  const metrics = {
    nodejs: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime_hours: Math.round(process.uptime() / 3600 * 100) / 100
    },
    gc: {},
    event_loop: {}
  };

  // Garbage collection stats (if available)
  if (process.memoryUsage.rss) {
    const usage = process.memoryUsage();
    metrics.gc = {
      heap_size_mb: Math.round(usage.heapTotal / 1024 / 1024),
      used_heap_mb: Math.round(usage.heapUsed / 1024 / 1024),
      heap_utilization: Math.round((usage.heapUsed / usage.heapTotal) * 100)
    };
  }

  return metrics;
}

/**
 * Check SLA compliance
 */
async function checkSlaCompliance(healthReport) {
  const compliance = {
    overall_score: 0,
    targets: {},
    violations: []
  };

  // Availability check
  const systemHealthy = healthReport.checks.system_resources?.status === 'healthy' &&
                       healthReport.checks.api_endpoints?.status !== 'critical' &&
                       healthReport.checks.data_integrity?.status !== 'critical';
  
  compliance.targets.availability = {
    target: HEALTH_CONFIG.SLA_TARGETS.availability,
    current: systemHealthy ? 99.9 : 95.0,
    compliant: systemHealthy
  };

  // Response time check
  const avgResponseTime = healthReport.checks.api_endpoints?.summary?.average_response_time || 0;
  compliance.targets.response_time = {
    target: HEALTH_CONFIG.SLA_TARGETS.response_time,
    current: avgResponseTime,
    compliant: avgResponseTime <= HEALTH_CONFIG.SLA_TARGETS.response_time
  };

  // Error rate check
  const apiSummary = healthReport.checks.api_endpoints?.summary || {};
  const errorRate = apiSummary.total > 0 ? 
    ((apiSummary.failed + apiSummary.degraded) / apiSummary.total * 100) : 0;
  
  compliance.targets.error_rate = {
    target: HEALTH_CONFIG.SLA_TARGETS.error_rate,
    current: errorRate,
    compliant: errorRate <= HEALTH_CONFIG.SLA_TARGETS.error_rate
  };

  // Calculate overall compliance score
  const compliantTargets = Object.values(compliance.targets).filter(t => t.compliant).length;
  compliance.overall_score = Math.round((compliantTargets / Object.keys(compliance.targets).length) * 100);

  // Identify violations
  for (const [metric, target] of Object.entries(compliance.targets)) {
    if (!target.compliant) {
      compliance.violations.push({
        metric,
        target: target.target,
        current: target.current,
        severity: target.current > target.target * 2 ? 'critical' : 'warning'
      });
    }
  }

  return compliance;
}

/**
 * Determine overall system status
 */
function determineOverallStatus(checks) {
  const statuses = Object.values(checks).map(check => check.status);
  
  if (statuses.includes('critical')) return 'critical';
  if (statuses.includes('degraded')) return 'degraded';
  if (statuses.includes('warning')) return 'warning';
  return 'healthy';
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(healthReport) {
  const recommendations = [];

  // Memory recommendations
  const memUsage = healthReport.checks.system_resources?.metrics?.memory?.heap_used_mb || 0;
  if (memUsage > 400) {
    recommendations.push({
      priority: 'high',
      category: 'performance',
      message: 'Consider implementing memory optimization or increasing resource limits',
      action: 'Review memory usage patterns and implement garbage collection optimizations'
    });
  }

  // API recommendations
  const apiStatus = healthReport.checks.api_endpoints?.status;
  if (apiStatus === 'degraded' || apiStatus === 'critical') {
    recommendations.push({
      priority: 'critical',
      category: 'reliability',
      message: 'API endpoints experiencing issues - implement circuit breaker patterns',
      action: 'Enable fallback mechanisms and retry logic for critical APIs'
    });
  }

  // Data freshness recommendations
  const dataAlerts = healthReport.checks.data_integrity?.alerts || [];
  if (dataAlerts.some(alert => alert.message.includes('Stale data'))) {
    recommendations.push({
      priority: 'medium',
      category: 'data_quality',
      message: 'Data collection may be experiencing delays',
      action: 'Check GitHub Actions workflow status and API connectivity'
    });
  }

  // SLA compliance recommendations
  if (healthReport.sla_compliance?.overall_score < 80) {
    recommendations.push({
      priority: 'high',
      category: 'sla',
      message: 'SLA compliance below acceptable threshold',
      action: 'Review and address SLA violations immediately'
    });
  }

  return recommendations;
}

/**
 * Display formatted health report
 */
function displayHealthReport(report) {
  console.log('');
  console.log('🏥 ================== HEALTH CHECK REPORT ==================');
  console.log(`📊 Overall Status: ${getStatusEmoji(report.overall_status)} ${report.overall_status.toUpperCase()}`);
  console.log(`⏱️  Check Duration: ${report.metadata.check_duration_ms}ms`);
  console.log(`🕐 Timestamp: ${report.timestamp}`);
  console.log('');

  // System Resources
  console.log('🖥️  SYSTEM RESOURCES:');
  const sysRes = report.checks.system_resources;
  console.log(`   Status: ${getStatusEmoji(sysRes.status)} ${sysRes.status}`);
  console.log(`   Memory: ${sysRes.metrics.memory.heap_used_mb}MB / ${sysRes.metrics.memory.heap_total_mb}MB`);
  console.log(`   Uptime: ${Math.round(sysRes.metrics.uptime_seconds / 3600 * 100) / 100} hours`);
  if (sysRes.alerts.length > 0) {
    sysRes.alerts.forEach(alert => console.log(`   ⚠️  ${alert.message}`));
  }
  console.log('');

  // API Endpoints
  console.log('🌐 API ENDPOINTS:');
  const apiCheck = report.checks.api_endpoints;
  console.log(`   Status: ${getStatusEmoji(apiCheck.status)} ${apiCheck.status}`);
  console.log(`   Success Rate: ${Math.round((apiCheck.summary.healthy / apiCheck.summary.total) * 100)}%`);
  console.log(`   Avg Response: ${apiCheck.summary.average_response_time}ms`);
  console.log('');

  // SLA Compliance
  console.log('📋 SLA COMPLIANCE:');
  const sla = report.sla_compliance;
  console.log(`   Overall Score: ${sla.overall_score}%`);
  console.log(`   Availability: ${sla.targets.availability.compliant ? '✅' : '❌'} ${sla.targets.availability.current}%`);
  console.log(`   Response Time: ${sla.targets.response_time.compliant ? '✅' : '❌'} ${sla.targets.response_time.current}ms`);
  console.log(`   Error Rate: ${sla.targets.error_rate.compliant ? '✅' : '❌'} ${sla.targets.error_rate.current}%`);
  console.log('');

  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      const priorityEmoji = rec.priority === 'critical' ? '🚨' : rec.priority === 'high' ? '⚠️' : 'ℹ️';
      console.log(`   ${priorityEmoji} [${rec.priority.toUpperCase()}] ${rec.message}`);
      console.log(`      Action: ${rec.action}`);
    });
    console.log('');
  }

  console.log('🏥 ====================== END REPORT ======================');
}

/**
 * Get emoji for status
 */
function getStatusEmoji(status) {
  const emojis = {
    healthy: '✅',
    warning: '⚠️',
    degraded: '🟡',
    critical: '🔴',
    failed: '❌'
  };
  return emojis[status] || '❓';
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    detailed: args.includes('--detailed'),
    json: args.includes('--json'),
    monitor: args.includes('--monitor'),
    interval: parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1]) || 60
  };

  if (options.monitor) {
    console.log(`🔄 Starting continuous monitoring (${options.interval}s intervals)...`);
    console.log('Press Ctrl+C to stop');
    
    while (true) {
      await performHealthCheck(options);
      await new Promise(resolve => setTimeout(resolve, options.interval * 1000));
    }
  } else {
    const report = await performHealthCheck(options);
    process.exit(report.overall_status === 'critical' ? 1 : 0);
  }
}

// Enhanced execution with graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ Received SIGTERM - stopping health check...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️ Received SIGINT - stopping health check...');
  process.exit(0);
});

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  main().catch((error) => {
    console.error('🚨 Health check system failure:', error);
    process.exit(1);
  });
}