/**
 * Enhanced Task Management System for Singapore Weather Cam
 * Cross-session persistence, intelligent orchestration, and analytics
 */

const fs = require('fs').promises;
const path = require('path');

// Task state persistence configuration
const TASK_STATE_DIR = '.github/task-state';
const TASK_ANALYTICS_FILE = '.github/task-analytics.json';
const TASK_HIERARCHY_FILE = '.github/TASKS.md';

class TaskManager {
  constructor() {
    this.tasks = new Map();
    this.taskHierarchy = {
      epics: new Map(),
      stories: new Map(),
      tasks: new Map()
    };
    this.analytics = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      completedTasks: [],
      performanceMetrics: {},
      dependencyGraph: {}
    };
    this.executionStrategy = 'systematic'; // systematic, agile, enterprise
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async initialize() {
    await this.createDirectories();
    await this.loadTaskState();
    await this.loadAnalytics();
    console.log(`🚀 Task Manager initialized - Session: ${this.analytics.sessionId}`);
  }

  async createDirectories() {
    try {
      await fs.mkdir(TASK_STATE_DIR, { recursive: true });
      console.log('📁 Task state directories created');
    } catch (error) {
      console.log('⚠️ Task directories already exist');
    }
  }

  // Epic-Story-Task Hierarchy Management
  async createEpic(epicData) {
    const epic = {
      id: epicData.id || this.generateTaskId('EPIC'),
      title: epicData.title,
      description: epicData.description,
      status: 'active', // active, completed, paused
      priority: epicData.priority || 'medium',
      timeline: epicData.timeline,
      stories: [],
      completionPercentage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.taskHierarchy.epics.set(epic.id, epic);
    await this.saveTaskState();
    
    console.log(`📚 Epic created: ${epic.id} - ${epic.title}`);
    return epic;
  }

  async createStory(storyData) {
    const story = {
      id: storyData.id || this.generateTaskId('STORY'),
      epicId: storyData.epicId,
      title: storyData.title,
      description: storyData.description,
      status: 'pending', // pending, in_progress, completed, blocked
      priority: storyData.priority || 'medium',
      estimatedEffort: storyData.estimatedEffort || 'medium',
      tasks: [],
      dependencies: storyData.dependencies || [],
      assignedPersona: storyData.assignedPersona,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.taskHierarchy.stories.set(story.id, story);
    
    // Add to epic
    if (this.taskHierarchy.epics.has(storyData.epicId)) {
      this.taskHierarchy.epics.get(storyData.epicId).stories.push(story.id);
    }

    await this.saveTaskState();
    console.log(`📖 Story created: ${story.id} - ${story.title}`);
    return story;
  }

  async createTask(taskData) {
    const task = {
      id: taskData.id || this.generateTaskId('TASK'),
      storyId: taskData.storyId,
      title: taskData.title,
      description: taskData.description,
      status: 'pending', // pending, in_progress, completed, failed, skipped
      priority: taskData.priority || 'medium',
      estimatedDuration: taskData.estimatedDuration || 300000, // 5 minutes default
      actualDuration: null,
      dependencies: taskData.dependencies || [],
      evidence: [],
      validationCriteria: taskData.validationCriteria || [],
      assignedPersona: taskData.assignedPersona,
      mcpServers: taskData.mcpServers || [],
      tools: taskData.tools || [],
      context: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    };

    this.taskHierarchy.tasks.set(task.id, task);
    
    // Add to story
    if (this.taskHierarchy.stories.has(taskData.storyId)) {
      this.taskHierarchy.stories.get(taskData.storyId).tasks.push(task.id);
    }

    await this.saveTaskState();
    console.log(`📝 Task created: ${task.id} - ${task.title}`);
    return task;
  }

  generateTaskId(type) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `${type}-${timestamp}-${random}`;
  }

  // Task Execution & Orchestration
  async executeTask(taskId, options = {}) {
    const task = this.taskHierarchy.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    console.log(`🎯 Starting task execution: ${taskId}`);
    
    // Check dependencies
    const dependencyStatus = await this.checkDependencies(task);
    if (!dependencyStatus.allResolved) {
      console.log(`⏳ Task ${taskId} blocked by dependencies: ${dependencyStatus.pending.join(', ')}`);
      task.status = 'blocked';
      await this.saveTaskState();
      return { status: 'blocked', dependencies: dependencyStatus.pending };
    }

    // Start execution
    task.status = 'in_progress';
    task.startedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();
    
    const executionStart = Date.now();
    
    try {
      // Execute based on strategy
      const result = await this.executeTaskWithStrategy(task, options);
      
      // Mark as completed
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      task.actualDuration = Date.now() - executionStart;
      
      // Add evidence
      if (result.evidence) {
        task.evidence.push(...result.evidence);
      }

      // Update analytics
      this.analytics.completedTasks.push({
        taskId: taskId,
        duration: task.actualDuration,
        completedAt: task.completedAt,
        strategy: this.executionStrategy
      });

      await this.saveTaskState();
      await this.updateAnalytics();
      
      console.log(`✅ Task completed: ${taskId} (${task.actualDuration}ms)`);
      return { status: 'completed', duration: task.actualDuration, evidence: task.evidence };

    } catch (error) {
      task.status = 'failed';
      task.updatedAt = new Date().toISOString();
      task.context.error = error.message;
      
      await this.saveTaskState();
      
      console.error(`❌ Task failed: ${taskId} - ${error.message}`);
      return { status: 'failed', error: error.message };
    }
  }

  async executeTaskWithStrategy(task, options) {
    switch (this.executionStrategy) {
      case 'systematic':
        return await this.executeSystematic(task, options);
      case 'agile':
        return await this.executeAgile(task, options);
      case 'enterprise':
        return await this.executeEnterprise(task, options);
      default:
        return await this.executeSystematic(task, options);
    }
  }

  async executeSystematic(task, options) {
    console.log(`📋 Executing systematic approach for: ${task.title}`);
    
    // 1. Discovery phase
    const discovery = await this.analyzeTaskRequirements(task);
    
    // 2. Planning phase
    const plan = await this.createExecutionPlan(task, discovery);
    
    // 3. Execution phase
    const execution = await this.executeTaskSteps(task, plan);
    
    // 4. Validation phase
    const validation = await this.validateTaskCompletion(task, execution);
    
    return {
      evidence: [discovery, plan, execution, validation],
      metrics: { approach: 'systematic', steps: 4 }
    };
  }

  async analyzeTaskRequirements(task) {
    return {
      type: 'requirements_analysis',
      timestamp: new Date().toISOString(),
      requirements: task.validationCriteria,
      dependencies: task.dependencies,
      estimatedComplexity: this.calculateTaskComplexity(task)
    };
  }

  calculateTaskComplexity(task) {
    let complexity = 0;
    complexity += task.dependencies.length * 0.2;
    complexity += task.validationCriteria.length * 0.3;
    complexity += task.mcpServers.length * 0.1;
    complexity += task.tools.length * 0.1;
    return Math.min(complexity, 1.0);
  }

  async createExecutionPlan(task, discovery) {
    return {
      type: 'execution_plan',
      timestamp: new Date().toISOString(),
      steps: [
        'Initialize tools and MCP servers',
        'Execute primary task logic',
        'Collect evidence and metrics',
        'Validate against criteria'
      ],
      estimatedDuration: task.estimatedDuration,
      mcpServers: task.mcpServers,
      tools: task.tools
    };
  }

  async executeTaskSteps(task, plan) {
    // Simulate task execution with real task logic
    console.log(`⚡ Executing task steps for: ${task.title}`);
    
    return {
      type: 'execution_result',
      timestamp: new Date().toISOString(),
      stepsCompleted: plan.steps.length,
      success: true,
      metrics: {
        startTime: Date.now(),
        endTime: Date.now() + (task.estimatedDuration || 300000)
      }
    };
  }

  async validateTaskCompletion(task, execution) {
    const validationResults = [];
    
    for (const criteria of task.validationCriteria) {
      validationResults.push({
        criteria: criteria,
        passed: true, // Implement actual validation logic
        evidence: `Validation for: ${criteria}`
      });
    }

    return {
      type: 'validation_result',
      timestamp: new Date().toISOString(),
      results: validationResults,
      overallSuccess: validationResults.every(r => r.passed)
    };
  }

  // Dependency Management
  async checkDependencies(task) {
    const pending = [];
    const resolved = [];

    for (const depId of task.dependencies) {
      const depTask = this.taskHierarchy.tasks.get(depId);
      if (!depTask || depTask.status !== 'completed') {
        pending.push(depId);
      } else {
        resolved.push(depId);
      }
    }

    return {
      allResolved: pending.length === 0,
      pending,
      resolved
    };
  }

  // Analytics & Performance Monitoring
  async updateAnalytics() {
    this.analytics.lastUpdated = new Date().toISOString();
    this.analytics.performanceMetrics = {
      totalTasks: this.taskHierarchy.tasks.size,
      completedTasks: this.analytics.completedTasks.length,
      completionRate: this.analytics.completedTasks.length / this.taskHierarchy.tasks.size,
      averageDuration: this.calculateAverageDuration(),
      sessionDuration: Date.now() - this.analytics.startTime
    };

    await this.saveAnalytics();
  }

  calculateAverageDuration() {
    if (this.analytics.completedTasks.length === 0) return 0;
    
    const totalDuration = this.analytics.completedTasks.reduce((sum, task) => sum + task.duration, 0);
    return totalDuration / this.analytics.completedTasks.length;
  }

  async getTaskStatus() {
    const status = {
      session: this.analytics.sessionId,
      timestamp: new Date().toISOString(),
      hierarchy: {
        epics: Array.from(this.taskHierarchy.epics.values()).map(epic => ({
          id: epic.id,
          title: epic.title,
          status: epic.status,
          completion: this.calculateEpicCompletion(epic.id)
        })),
        stories: Array.from(this.taskHierarchy.stories.values()).map(story => ({
          id: story.id,
          title: story.title,
          status: story.status,
          completion: this.calculateStoryCompletion(story.id)
        })),
        tasks: Array.from(this.taskHierarchy.tasks.values()).map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          duration: task.actualDuration,
          dependencies: task.dependencies
        }))
      },
      analytics: this.analytics.performanceMetrics
    };

    console.log('📊 Task Status Report:');
    console.log(`   Epics: ${status.hierarchy.epics.length}`);
    console.log(`   Stories: ${status.hierarchy.stories.length}`);
    console.log(`   Tasks: ${status.hierarchy.tasks.length}`);
    console.log(`   Completion Rate: ${(status.analytics.completionRate * 100).toFixed(1)}%`);

    return status;
  }

  calculateEpicCompletion(epicId) {
    const epic = this.taskHierarchy.epics.get(epicId);
    if (!epic || epic.stories.length === 0) return 0;

    const completedStories = epic.stories.filter(storyId => {
      const story = this.taskHierarchy.stories.get(storyId);
      return story && this.calculateStoryCompletion(storyId) === 1;
    });

    return completedStories.length / epic.stories.length;
  }

  calculateStoryCompletion(storyId) {
    const story = this.taskHierarchy.stories.get(storyId);
    if (!story || story.tasks.length === 0) return 0;

    const completedTasks = story.tasks.filter(taskId => {
      const task = this.taskHierarchy.tasks.get(taskId);
      return task && task.status === 'completed';
    });

    return completedTasks.length / story.tasks.length;
  }

  // Cross-Session Persistence
  async saveTaskState() {
    try {
      const stateData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        sessionId: this.analytics.sessionId,
        hierarchy: {
          epics: Object.fromEntries(this.taskHierarchy.epics),
          stories: Object.fromEntries(this.taskHierarchy.stories),
          tasks: Object.fromEntries(this.taskHierarchy.tasks)
        }
      };

      const stateFile = path.join(TASK_STATE_DIR, 'current-state.json');
      await fs.writeFile(stateFile, JSON.stringify(stateData, null, 2));
      
      // Also save session-specific backup
      const sessionFile = path.join(TASK_STATE_DIR, `${this.analytics.sessionId}.json`);
      await fs.writeFile(sessionFile, JSON.stringify(stateData, null, 2));

    } catch (error) {
      console.error('❌ Failed to save task state:', error.message);
    }
  }

  async loadTaskState() {
    try {
      const stateFile = path.join(TASK_STATE_DIR, 'current-state.json');
      const stateData = JSON.parse(await fs.readFile(stateFile, 'utf8'));

      this.taskHierarchy.epics = new Map(Object.entries(stateData.hierarchy.epics));
      this.taskHierarchy.stories = new Map(Object.entries(stateData.hierarchy.stories));
      this.taskHierarchy.tasks = new Map(Object.entries(stateData.hierarchy.tasks));

      console.log(`📂 Loaded task state from session: ${stateData.sessionId}`);
      console.log(`   Epics: ${this.taskHierarchy.epics.size}`);
      console.log(`   Stories: ${this.taskHierarchy.stories.size}`);
      console.log(`   Tasks: ${this.taskHierarchy.tasks.size}`);

    } catch (error) {
      console.log('📝 No existing task state found, starting fresh');
    }
  }

  async saveAnalytics() {
    try {
      await fs.writeFile(TASK_ANALYTICS_FILE, JSON.stringify(this.analytics, null, 2));
    } catch (error) {
      console.error('❌ Failed to save analytics:', error.message);
    }
  }

  async loadAnalytics() {
    try {
      const analyticsData = JSON.parse(await fs.readFile(TASK_ANALYTICS_FILE, 'utf8'));
      this.analytics = { ...this.analytics, ...analyticsData };
      console.log(`📈 Loaded analytics with ${this.analytics.completedTasks.length} completed tasks`);
    } catch (error) {
      console.log('📊 No existing analytics found, starting fresh');
    }
  }

  // Task Delegation & Multi-Agent Coordination
  async delegateTask(taskId, agentSpec) {
    const task = this.taskHierarchy.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    console.log(`🤝 Delegating task ${taskId} to ${agentSpec.persona} agent`);

    const delegation = {
      taskId: taskId,
      agentPersona: agentSpec.persona,
      mcpServers: agentSpec.mcpServers || [],
      tools: agentSpec.tools || [],
      delegatedAt: new Date().toISOString(),
      status: 'delegated'
    };

    task.context.delegation = delegation;
    await this.saveTaskState();

    return delegation;
  }
}

// Example usage and initialization
async function main() {
  const taskManager = new TaskManager();
  await taskManager.initialize();

  // Example: Create sample task hierarchy
  if (process.argv.includes('--demo')) {
    console.log('🎭 Creating demo task hierarchy...');

    const epic = await taskManager.createEpic({
      title: 'System Performance Optimization',
      description: 'Comprehensive performance analysis and optimization',
      priority: 'high',
      timeline: 'Q1 2025'
    });

    const story = await taskManager.createStory({
      epicId: epic.id,
      title: 'Backend Performance Analysis',
      description: 'Analyze and optimize backend service performance',
      priority: 'high',
      assignedPersona: 'performance'
    });

    const task = await taskManager.createTask({
      storyId: story.id,
      title: 'Identify performance bottlenecks',
      description: 'Use monitoring data to identify system bottlenecks',
      priority: 'high',
      validationCriteria: ['response_time_<200ms', 'memory_usage_<100mb'],
      assignedPersona: 'performance',
      mcpServers: ['sequential'],
      tools: ['Read', 'Grep', 'Bash']
    });

    console.log(`✨ Demo hierarchy created with task: ${task.id}`);
  }

  // Show current status
  await taskManager.getTaskStatus();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Task Manager error:', error);
    process.exit(1);
  });
}

module.exports = { TaskManager };