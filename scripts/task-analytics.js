/**
 * Task Analytics and Performance Monitoring System
 * Provides comprehensive metrics and insights for task management
 */

const fs = require('fs').promises;
const path = require('path');

class TaskAnalytics {
  constructor() {
    this.metricsStore = new Map();
    this.performanceBaseline = {
      averageTaskDuration: 300000, // 5 minutes baseline
      successRate: 0.95,
      dependencyResolutionTime: 1000,
      validationTime: 5000
    };
    this.analyticsConfig = {
      sampleSize: 100,
      performanceThresholds: {
        taskDuration: 600000, // 10 minutes
        dependencyTime: 5000, // 5 seconds
        validationTime: 10000 // 10 seconds
      }
    };
  }

  async initialize() {
    await this.loadHistoricalMetrics();
    console.log('📊 Task Analytics initialized');
  }

  // Performance Metrics Collection
  async recordTaskMetrics(taskId, metrics) {
    const taskMetrics = {
      taskId,
      timestamp: new Date().toISOString(),
      ...metrics,
      performanceScore: this.calculatePerformanceScore(metrics)
    };

    this.metricsStore.set(`${taskId}_${Date.now()}`, taskMetrics);
    await this.saveMetrics();
    
    console.log(`📈 Metrics recorded for task ${taskId}: Score ${taskMetrics.performanceScore.toFixed(2)}`);
    return taskMetrics;
  }

  calculatePerformanceScore(metrics) {
    let score = 1.0;
    
    // Duration score (0.4 weight)
    const durationRatio = metrics.duration / this.performanceBaseline.averageTaskDuration;
    const durationScore = Math.max(0, 1 - (durationRatio - 1) * 0.5);
    score *= (durationScore * 0.4 + 0.6);
    
    // Success score (0.3 weight)
    const successScore = metrics.success ? 1.0 : 0.0;
    score *= (successScore * 0.3 + 0.7);
    
    // Quality score (0.2 weight)
    const qualityScore = metrics.validationsPassed / Math.max(1, metrics.totalValidations);
    score *= (qualityScore * 0.2 + 0.8);
    
    // Dependency score (0.1 weight)
    const dependencyScore = metrics.dependencyResolutionTime < this.analyticsConfig.performanceThresholds.dependencyTime ? 1.0 : 0.5;
    score *= (dependencyScore * 0.1 + 0.9);
    
    return Math.max(0, Math.min(1, score));
  }

  // Analytics Dashboard Generation
  async generateAnalyticsDashboard() {
    const metrics = Array.from(this.metricsStore.values());
    const recentMetrics = metrics.slice(-50); // Last 50 tasks
    
    const dashboard = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTasks: metrics.length,
        recentTasks: recentMetrics.length,
        averagePerformanceScore: this.calculateAverage(recentMetrics, 'performanceScore'),
        averageDuration: this.calculateAverage(recentMetrics, 'duration'),
        successRate: this.calculateSuccessRate(recentMetrics)
      },
      trends: {
        performanceTrend: this.calculateTrend(recentMetrics, 'performanceScore'),
        durationTrend: this.calculateTrend(recentMetrics, 'duration'),
        successTrend: this.calculateTrend(recentMetrics, 'success')
      },
      insights: this.generateInsights(recentMetrics),
      recommendations: this.generateRecommendations(recentMetrics)
    };

    await this.saveDashboard(dashboard);
    return dashboard;
  }

  calculateAverage(metrics, field) {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + (m[field] || 0), 0);
    return sum / metrics.length;
  }

  calculateSuccessRate(metrics) {
    if (metrics.length === 0) return 0;
    const successCount = metrics.filter(m => m.success).length;
    return successCount / metrics.length;
  }

  calculateTrend(metrics, field) {
    if (metrics.length < 5) return 'insufficient_data';
    
    const recent = metrics.slice(-10);
    const earlier = metrics.slice(-20, -10);
    
    const recentAvg = this.calculateAverage(recent, field);
    const earlierAvg = this.calculateAverage(earlier, field);
    
    if (recentAvg > earlierAvg * 1.1) return 'improving';
    if (recentAvg < earlierAvg * 0.9) return 'declining';
    return 'stable';
  }

  generateInsights(metrics) {
    const insights = [];
    
    // Performance insights
    const avgScore = this.calculateAverage(metrics, 'performanceScore');
    if (avgScore > 0.8) {
      insights.push({
        type: 'performance',
        level: 'positive',
        message: `Excellent performance with ${(avgScore * 100).toFixed(1)}% average score`
      });
    } else if (avgScore < 0.6) {
      insights.push({
        type: 'performance',
        level: 'warning',
        message: `Below-target performance at ${(avgScore * 100).toFixed(1)}% average score`
      });
    }
    
    // Duration insights
    const avgDuration = this.calculateAverage(metrics, 'duration');
    if (avgDuration > this.analyticsConfig.performanceThresholds.taskDuration) {
      insights.push({
        type: 'duration',
        level: 'warning',
        message: `Tasks taking longer than expected: ${Math.round(avgDuration / 1000)}s average`
      });
    }
    
    // Success rate insights
    const successRate = this.calculateSuccessRate(metrics);
    if (successRate < 0.9) {
      insights.push({
        type: 'reliability',
        level: 'critical',
        message: `Low success rate detected: ${(successRate * 100).toFixed(1)}%`
      });
    }
    
    return insights;
  }

  generateRecommendations(metrics) {
    const recommendations = [];
    
    // Performance optimization
    const avgScore = this.calculateAverage(metrics, 'performanceScore');
    if (avgScore < 0.7) {
      recommendations.push({
        category: 'optimization',
        priority: 'high',
        title: 'Optimize Task Execution Strategy',
        description: 'Consider using enterprise strategy for complex tasks',
        action: 'Review task complexity and adjust execution strategy'
      });
    }
    
    // Dependency management
    const avgDepTime = this.calculateAverage(metrics, 'dependencyResolutionTime');
    if (avgDepTime > this.analyticsConfig.performanceThresholds.dependencyTime) {
      recommendations.push({
        category: 'dependencies',
        priority: 'medium',
        title: 'Improve Dependency Resolution',
        description: 'Dependency resolution taking longer than optimal',
        action: 'Review task dependencies and consider task reordering'
      });
    }
    
    // Validation efficiency
    const avgValidationTime = this.calculateAverage(metrics, 'validationTime');
    if (avgValidationTime > this.analyticsConfig.performanceThresholds.validationTime) {
      recommendations.push({
        category: 'validation',
        priority: 'low',
        title: 'Streamline Validation Process',
        description: 'Validation taking longer than expected',
        action: 'Review validation criteria and consider automation'
      });
    }
    
    return recommendations;
  }

  // Predictive Analytics
  async predictTaskPerformance(taskMetadata) {
    const historicalMetrics = Array.from(this.metricsStore.values())
      .filter(m => this.isSimilarTask(m, taskMetadata))
      .slice(-20); // Recent similar tasks
    
    if (historicalMetrics.length < 3) {
      return {
        confidence: 'low',
        estimatedDuration: this.performanceBaseline.averageTaskDuration,
        estimatedSuccessRate: this.performanceBaseline.successRate,
        recommendations: ['Insufficient historical data for accurate prediction']
      };
    }
    
    const prediction = {
      confidence: this.calculatePredictionConfidence(historicalMetrics),
      estimatedDuration: this.calculateAverage(historicalMetrics, 'duration'),
      estimatedSuccessRate: this.calculateSuccessRate(historicalMetrics),
      estimatedPerformanceScore: this.calculateAverage(historicalMetrics, 'performanceScore'),
      recommendations: this.generatePredictiveRecommendations(historicalMetrics, taskMetadata)
    };
    
    console.log(`🔮 Task performance prediction: ${prediction.confidence} confidence`);
    return prediction;
  }

  isSimilarTask(historicalTask, newTask) {
    let similarity = 0;
    
    // Check task complexity
    if (historicalTask.complexity === newTask.complexity) similarity += 0.3;
    
    // Check assigned persona
    if (historicalTask.assignedPersona === newTask.assignedPersona) similarity += 0.2;
    
    // Check MCP servers
    const commonServers = (historicalTask.mcpServers || [])
      .filter(s => (newTask.mcpServers || []).includes(s));
    similarity += (commonServers.length / Math.max(1, newTask.mcpServers?.length || 1)) * 0.2;
    
    // Check tools
    const commonTools = (historicalTask.tools || [])
      .filter(t => (newTask.tools || []).includes(t));
    similarity += (commonTools.length / Math.max(1, newTask.tools?.length || 1)) * 0.3;
    
    return similarity > 0.5; // 50% similarity threshold
  }

  calculatePredictionConfidence(historicalMetrics) {
    const sampleSize = historicalMetrics.length;
    const variance = this.calculateVariance(historicalMetrics, 'performanceScore');
    
    if (sampleSize >= 10 && variance < 0.1) return 'high';
    if (sampleSize >= 5 && variance < 0.2) return 'medium';
    return 'low';
  }

  calculateVariance(metrics, field) {
    const mean = this.calculateAverage(metrics, field);
    const squaredDiffs = metrics.map(m => Math.pow((m[field] || 0) - mean, 2));
    return this.calculateAverage(squaredDiffs, null);
  }

  generatePredictiveRecommendations(historicalMetrics, taskMetadata) {
    const recommendations = [];
    
    const avgScore = this.calculateAverage(historicalMetrics, 'performanceScore');
    if (avgScore < 0.7) {
      recommendations.push('Consider breaking down task into smaller subtasks');
      recommendations.push('Allocate additional time for task completion');
    }
    
    const successRate = this.calculateSuccessRate(historicalMetrics);
    if (successRate < 0.8) {
      recommendations.push('Review task dependencies before execution');
      recommendations.push('Consider using systematic execution strategy');
    }
    
    return recommendations;
  }

  // Real-time Monitoring
  async startRealTimeMonitoring(interval = 30000) {
    console.log('🔄 Starting real-time task monitoring...');
    
    setInterval(async () => {
      const recentMetrics = Array.from(this.metricsStore.values()).slice(-10);
      const alerts = this.checkPerformanceAlerts(recentMetrics);
      
      if (alerts.length > 0) {
        console.log('🚨 Performance alerts detected:');
        alerts.forEach(alert => console.log(`   ${alert.type}: ${alert.message}`));
        await this.saveAlerts(alerts);
      }
    }, interval);
  }

  checkPerformanceAlerts(recentMetrics) {
    const alerts = [];
    
    // Check for performance degradation
    const avgScore = this.calculateAverage(recentMetrics, 'performanceScore');
    if (avgScore < 0.6) {
      alerts.push({
        type: 'performance_degradation',
        severity: 'high',
        message: `Performance score dropped to ${(avgScore * 100).toFixed(1)}%`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check for high failure rate
    const successRate = this.calculateSuccessRate(recentMetrics);
    if (successRate < 0.8) {
      alerts.push({
        type: 'high_failure_rate',
        severity: 'critical',
        message: `Success rate dropped to ${(successRate * 100).toFixed(1)}%`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check for duration spikes
    const avgDuration = this.calculateAverage(recentMetrics, 'duration');
    if (avgDuration > this.performanceBaseline.averageTaskDuration * 2) {
      alerts.push({
        type: 'duration_spike',
        severity: 'medium',
        message: `Task duration spiked to ${Math.round(avgDuration / 1000)}s`,
        timestamp: new Date().toISOString()
      });
    }
    
    return alerts;
  }

  // Data Persistence
  async saveMetrics() {
    try {
      const metricsData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        metrics: Object.fromEntries(this.metricsStore)
      };
      
      await fs.writeFile('.github/task-analytics.json', JSON.stringify(metricsData, null, 2));
    } catch (error) {
      console.error('❌ Failed to save metrics:', error.message);
    }
  }

  async loadHistoricalMetrics() {
    try {
      const data = JSON.parse(await fs.readFile('.github/task-analytics.json', 'utf8'));
      this.metricsStore = new Map(Object.entries(data.metrics || {}));
      console.log(`📂 Loaded ${this.metricsStore.size} historical metrics`);
    } catch (error) {
      console.log('📊 No historical metrics found, starting fresh');
    }
  }

  async saveDashboard(dashboard) {
    try {
      await fs.writeFile('.github/task-reports/analytics-dashboard.json', JSON.stringify(dashboard, null, 2));
      
      // Generate markdown report
      const markdown = this.generateMarkdownReport(dashboard);
      await fs.writeFile('.github/task-reports/analytics-report.md', markdown);
      
      console.log('📊 Analytics dashboard saved');
    } catch (error) {
      console.error('❌ Failed to save dashboard:', error.message);
    }
  }

  generateMarkdownReport(dashboard) {
    const { summary, trends, insights, recommendations } = dashboard;
    
    let report = '# Task Analytics Report\n\n';
    report += `**Generated**: ${dashboard.timestamp}\n\n`;
    
    // Summary section
    report += '## Performance Summary\n\n';
    report += `- **Total Tasks**: ${summary.totalTasks}\n`;
    report += `- **Recent Tasks**: ${summary.recentTasks}\n`;
    report += `- **Average Performance Score**: ${(summary.averagePerformanceScore * 100).toFixed(1)}%\n`;
    report += `- **Average Duration**: ${Math.round(summary.averageDuration / 1000)}s\n`;
    report += `- **Success Rate**: ${(summary.successRate * 100).toFixed(1)}%\n\n`;
    
    // Trends section
    report += '## Performance Trends\n\n';
    report += `- **Performance**: ${this.formatTrend(trends.performanceTrend)}\n`;
    report += `- **Duration**: ${this.formatTrend(trends.durationTrend)}\n`;
    report += `- **Success Rate**: ${this.formatTrend(trends.successTrend)}\n\n`;
    
    // Insights section
    if (insights.length > 0) {
      report += '## Key Insights\n\n';
      insights.forEach(insight => {
        const emoji = insight.level === 'positive' ? '✅' : insight.level === 'warning' ? '⚠️' : '🚨';
        report += `${emoji} **${insight.type}**: ${insight.message}\n\n`;
      });
    }
    
    // Recommendations section
    if (recommendations.length > 0) {
      report += '## Recommendations\n\n';
      recommendations.forEach((rec, index) => {
        report += `### ${index + 1}. ${rec.title}\n`;
        report += `**Priority**: ${rec.priority}\n`;
        report += `**Description**: ${rec.description}\n`;
        report += `**Action**: ${rec.action}\n\n`;
      });
    }
    
    return report;
  }

  formatTrend(trend) {
    switch (trend) {
      case 'improving': return '📈 Improving';
      case 'declining': return '📉 Declining';
      case 'stable': return '➡️ Stable';
      default: return '❓ Insufficient Data';
    }
  }

  async saveAlerts(alerts) {
    try {
      const alertsFile = '.github/task-reports/performance-alerts.json';
      let existingAlerts = [];
      
      try {
        existingAlerts = JSON.parse(await fs.readFile(alertsFile, 'utf8'));
      } catch (error) {
        // File doesn't exist, start fresh
      }
      
      const updatedAlerts = [...existingAlerts, ...alerts];
      await fs.writeFile(alertsFile, JSON.stringify(updatedAlerts, null, 2));
    } catch (error) {
      console.error('❌ Failed to save alerts:', error.message);
    }
  }
}

// CLI interface
async function main() {
  const analytics = new TaskAnalytics();
  await analytics.initialize();
  
  const action = process.argv.find(arg => arg.startsWith('--action='))?.split('=')[1] || 'dashboard';
  
  switch (action) {
    case 'dashboard':
      const dashboard = await analytics.generateAnalyticsDashboard();
      console.log('📊 Analytics dashboard generated');
      console.log(`Performance Score: ${(dashboard.summary.averagePerformanceScore * 100).toFixed(1)}%`);
      console.log(`Success Rate: ${(dashboard.summary.successRate * 100).toFixed(1)}%`);
      break;
      
    case 'monitor':
      await analytics.startRealTimeMonitoring();
      console.log('🔄 Real-time monitoring started (Ctrl+C to stop)');
      break;
      
    case 'predict':
      const taskMetadata = {
        complexity: 'medium',
        assignedPersona: 'performance',
        mcpServers: ['sequential'],
        tools: ['Read', 'Grep']
      };
      const prediction = await analytics.predictTaskPerformance(taskMetadata);
      console.log('🔮 Task prediction:', prediction);
      break;
      
    default:
      console.log('❌ Unknown action. Use --action=dashboard|monitor|predict');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Analytics error:', error);
    process.exit(1);
  });
}

module.exports = { TaskAnalytics };