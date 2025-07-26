/**
 * Task Delegation and Multi-Agent Coordination System
 * Intelligent distribution of tasks across specialized agents with persona awareness
 */

const fs = require('fs').promises;
const path = require('path');

class TaskDelegation {
  constructor() {
    this.agents = new Map();
    this.delegationQueue = [];
    this.activeAgents = new Map();
    this.completedDelegations = [];
    this.coordinationStrategy = 'intelligent'; // intelligent, parallel, sequential
    this.maxConcurrentAgents = 5;
  }

  async initialize() {
    await this.setupAgentPool();
    console.log('🤝 Task Delegation system initialized');
    console.log(`   Available agent types: ${Array.from(this.agents.keys()).join(', ')}`);
  }

  // Agent Pool Management
  async setupAgentPool() {
    // Define specialized agent configurations
    const agentConfigurations = {
      'frontend-specialist': {
        persona: 'frontend',
        capabilities: ['ui-components', 'responsive-design', 'accessibility', 'performance-optimization'],
        mcpServers: ['magic', 'context7'],
        tools: ['Read', 'Edit', 'MultiEdit', 'Write'],
        specializations: ['react', 'tailwind', 'responsive-design', 'wcag-compliance'],
        maxConcurrentTasks: 3
      },
      'backend-specialist': {
        persona: 'backend',
        capabilities: ['api-design', 'database-optimization', 'security', 'reliability'],
        mcpServers: ['context7', 'sequential'],
        tools: ['Read', 'Edit', 'Bash', 'Grep'],
        specializations: ['nodejs', 'api-security', 'performance-tuning', 'monitoring'],
        maxConcurrentTasks: 2
      },
      'performance-specialist': {
        persona: 'performance',
        capabilities: ['bottleneck-analysis', 'optimization', 'monitoring', 'benchmarking'],
        mcpServers: ['sequential', 'playwright'],
        tools: ['Read', 'Grep', 'Bash', 'Task'],
        specializations: ['core-web-vitals', 'memory-optimization', 'network-optimization'],
        maxConcurrentTasks: 2
      },
      'security-specialist': {
        persona: 'security',
        capabilities: ['vulnerability-assessment', 'threat-modeling', 'compliance', 'penetration-testing'],
        mcpServers: ['sequential', 'context7'],
        tools: ['Read', 'Grep', 'Bash'],
        specializations: ['owasp-compliance', 'csp-implementation', 'input-validation'],
        maxConcurrentTasks: 2
      },
      'quality-specialist': {
        persona: 'qa',
        capabilities: ['testing', 'validation', 'quality-assurance', 'regression-testing'],
        mcpServers: ['playwright', 'sequential'],
        tools: ['Read', 'Task', 'Bash'],
        specializations: ['e2e-testing', 'accessibility-testing', 'performance-testing'],
        maxConcurrentTasks: 3
      },
      'architecture-specialist': {
        persona: 'architect',
        capabilities: ['system-design', 'dependency-analysis', 'scalability', 'technical-debt'],
        mcpServers: ['sequential', 'context7'],
        tools: ['Read', 'Grep', 'Task'],
        specializations: ['design-patterns', 'scalability-analysis', 'technical-debt-assessment'],
        maxConcurrentTasks: 1
      },
      'analysis-specialist': {
        persona: 'analyzer',
        capabilities: ['root-cause-analysis', 'pattern-recognition', 'debugging', 'investigation'],
        mcpServers: ['sequential', 'context7'],
        tools: ['Read', 'Grep', 'Task', 'Bash'],
        specializations: ['log-analysis', 'error-debugging', 'performance-profiling'],
        maxConcurrentTasks: 2
      }
    };

    // Initialize agent pool
    for (const [agentType, config] of Object.entries(agentConfigurations)) {
      this.agents.set(agentType, {
        ...config,
        status: 'available',
        currentTasks: [],
        completedTasks: 0,
        averageTaskDuration: 300000, // 5 minutes baseline
        successRate: 1.0,
        lastUpdated: new Date().toISOString()
      });
    }
  }

  // Intelligent Task Delegation
  async delegateTask(taskData, delegationOptions = {}) {
    console.log(`🎯 Delegating task: ${taskData.id || taskData.title}`);
    
    // Analyze task requirements
    const taskAnalysis = await this.analyzeTaskRequirements(taskData);
    
    // Find optimal agent
    const optimalAgent = await this.findOptimalAgent(taskAnalysis, delegationOptions);
    
    if (!optimalAgent) {
      console.log('⏳ No suitable agents available, adding to queue');
      return await this.queueTask(taskData, taskAnalysis);
    }
    
    // Create delegation
    const delegation = await this.createDelegation(taskData, optimalAgent, taskAnalysis);
    
    // Execute delegation
    return await this.executeDelegation(delegation);
  }

  async analyzeTaskRequirements(taskData) {
    const analysis = {
      taskId: taskData.id || taskData.title,
      complexity: this.assessComplexity(taskData),
      domain: this.identifyDomain(taskData),
      requiredCapabilities: this.extractCapabilities(taskData),
      estimatedDuration: taskData.estimatedDuration || 300000,
      priority: taskData.priority || 'medium',
      dependencies: taskData.dependencies || [],
      specialRequirements: this.identifySpecialRequirements(taskData)
    };

    console.log(`🔍 Task analysis completed:`);
    console.log(`   Domain: ${analysis.domain}`);
    console.log(`   Complexity: ${analysis.complexity}`);
    console.log(`   Capabilities: ${analysis.requiredCapabilities.join(', ')}`);

    return analysis;
  }

  assessComplexity(taskData) {
    let complexity = 0;
    
    // Base complexity from description length
    complexity += Math.min((taskData.description?.length || 0) / 200, 0.3);
    
    // Dependencies increase complexity
    complexity += (taskData.dependencies?.length || 0) * 0.1;
    
    // Validation criteria increase complexity
    complexity += (taskData.validationCriteria?.length || 0) * 0.15;
    
    // MCP servers required
    complexity += (taskData.mcpServers?.length || 0) * 0.1;
    
    // Tools required
    complexity += (taskData.tools?.length || 0) * 0.05;
    
    // Normalize to 0-1 scale
    complexity = Math.min(complexity, 1.0);
    
    if (complexity < 0.3) return 'low';
    if (complexity < 0.7) return 'medium';
    return 'high';
  }

  identifyDomain(taskData) {
    const domainKeywords = {
      'frontend': ['ui', 'component', 'react', 'css', 'responsive', 'accessibility', 'user', 'interface'],
      'backend': ['api', 'server', 'database', 'endpoint', 'service', 'reliability', 'performance'],
      'security': ['security', 'vulnerability', 'auth', 'validation', 'compliance', 'threat'],
      'performance': ['optimize', 'performance', 'speed', 'memory', 'bottleneck', 'benchmark'],
      'quality': ['test', 'qa', 'validation', 'quality', 'regression', 'coverage'],
      'architecture': ['design', 'architecture', 'pattern', 'scalability', 'dependency', 'structure'],
      'analysis': ['analyze', 'debug', 'investigate', 'troubleshoot', 'root-cause', 'pattern']
    };

    const text = `${taskData.title} ${taskData.description}`.toLowerCase();
    
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      const matches = keywords.filter(keyword => text.includes(keyword));
      if (matches.length >= 2) return domain;
    }
    
    // Fallback to persona if provided
    if (taskData.assignedPersona) {
      return taskData.assignedPersona;
    }
    
    return 'general';
  }

  extractCapabilities(taskData) {
    const capabilities = [];
    const text = `${taskData.title} ${taskData.description}`.toLowerCase();
    
    // Extract capabilities based on keywords
    if (text.includes('component') || text.includes('ui')) capabilities.push('ui-components');
    if (text.includes('responsive')) capabilities.push('responsive-design');
    if (text.includes('accessible')) capabilities.push('accessibility');
    if (text.includes('api')) capabilities.push('api-design');
    if (text.includes('security')) capabilities.push('vulnerability-assessment');
    if (text.includes('performance') || text.includes('optimize')) capabilities.push('performance-optimization');
    if (text.includes('test')) capabilities.push('testing');
    if (text.includes('analyze') || text.includes('debug')) capabilities.push('root-cause-analysis');
    
    return capabilities;
  }

  identifySpecialRequirements(taskData) {
    const requirements = [];
    
    if (taskData.mcpServers?.includes('magic')) requirements.push('ui-generation');
    if (taskData.mcpServers?.includes('playwright')) requirements.push('browser-automation');
    if (taskData.mcpServers?.includes('sequential')) requirements.push('complex-analysis');
    if (taskData.tools?.includes('Bash')) requirements.push('system-access');
    if (taskData.priority === 'high') requirements.push('high-priority');
    
    return requirements;
  }

  async findOptimalAgent(taskAnalysis, options = {}) {
    const availableAgents = Array.from(this.agents.entries())
      .filter(([_, agent]) => agent.status === 'available' || agent.currentTasks.length < agent.maxConcurrentTasks)
      .map(([agentType, agent]) => ({ agentType, agent }));

    if (availableAgents.length === 0) {
      return null;
    }

    // Score each agent based on suitability
    const scoredAgents = availableAgents.map(({ agentType, agent }) => {
      const score = this.calculateAgentScore(agent, taskAnalysis);
      return { agentType, agent, score };
    });

    // Sort by score (highest first)
    scoredAgents.sort((a, b) => b.score - a.score);

    const optimal = scoredAgents[0];
    console.log(`🤖 Selected agent: ${optimal.agentType} (score: ${optimal.score.toFixed(2)})`);

    return optimal;
  }

  calculateAgentScore(agent, taskAnalysis) {
    let score = 0;
    
    // Domain match (40% weight)
    if (agent.persona === taskAnalysis.domain) {
      score += 0.4;
    }
    
    // Capability match (30% weight)
    const matchingCapabilities = agent.capabilities.filter(cap => 
      taskAnalysis.requiredCapabilities.includes(cap)
    );
    score += (matchingCapabilities.length / Math.max(1, taskAnalysis.requiredCapabilities.length)) * 0.3;
    
    // Performance history (20% weight)
    score += agent.successRate * 0.2;
    
    // Availability (10% weight)
    const availabilityScore = 1 - (agent.currentTasks.length / agent.maxConcurrentTasks);
    score += availabilityScore * 0.1;
    
    return score;
  }

  async createDelegation(taskData, optimalAgent, taskAnalysis) {
    const delegation = {
      id: `delegation_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      taskId: taskData.id,
      agentType: optimalAgent.agentType,
      agentConfig: optimalAgent.agent,
      taskData: taskData,
      taskAnalysis: taskAnalysis,
      status: 'created',
      createdAt: new Date().toISOString(),
      estimatedDuration: taskAnalysis.estimatedDuration,
      priority: taskAnalysis.priority
    };

    this.delegationQueue.push(delegation);
    console.log(`📋 Delegation created: ${delegation.id}`);

    return delegation;
  }

  async executeDelegation(delegation) {
    console.log(`⚡ Executing delegation: ${delegation.id}`);
    
    try {
      // Update delegation status
      delegation.status = 'executing';
      delegation.startedAt = new Date().toISOString();
      
      // Reserve agent
      const agent = this.agents.get(delegation.agentType);
      agent.currentTasks.push(delegation.id);
      agent.status = 'busy';
      
      // Add to active delegations
      this.activeAgents.set(delegation.id, delegation);
      
      // Simulate task execution (in real implementation, this would call Claude Code with specific persona)
      const executionResult = await this.simulateTaskExecution(delegation);
      
      // Complete delegation
      delegation.status = 'completed';
      delegation.completedAt = new Date().toISOString();
      delegation.actualDuration = Date.now() - new Date(delegation.startedAt).getTime();
      delegation.result = executionResult;
      
      // Update agent metrics
      agent.currentTasks = agent.currentTasks.filter(id => id !== delegation.id);
      agent.completedTasks++;
      agent.lastUpdated = new Date().toISOString();
      
      if (agent.currentTasks.length === 0) {
        agent.status = 'available';
      }
      
      // Move to completed
      this.activeAgents.delete(delegation.id);
      this.completedDelegations.push(delegation);
      
      console.log(`✅ Delegation completed: ${delegation.id} (${delegation.actualDuration}ms)`);
      
      // Save delegation state
      await this.saveDelegationState();
      
      return {
        delegationId: delegation.id,
        status: 'completed',
        result: executionResult,
        duration: delegation.actualDuration
      };
      
    } catch (error) {
      delegation.status = 'failed';
      delegation.error = error.message;
      delegation.failedAt = new Date().toISOString();
      
      console.error(`❌ Delegation failed: ${delegation.id} - ${error.message}`);
      
      // Release agent
      const agent = this.agents.get(delegation.agentType);
      agent.currentTasks = agent.currentTasks.filter(id => id !== delegation.id);
      if (agent.currentTasks.length === 0) {
        agent.status = 'available';
      }
      
      return {
        delegationId: delegation.id,
        status: 'failed',
        error: error.message
      };
    }
  }

  async simulateTaskExecution(delegation) {
    // Simulate execution time based on complexity
    const baseTime = 2000; // 2 seconds base
    const complexityMultiplier = {
      'low': 1,
      'medium': 2,
      'high': 3
    };
    
    const executionTime = baseTime * complexityMultiplier[delegation.taskAnalysis.complexity];
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'success',
          executionTime: executionTime,
          agent: delegation.agentType,
          persona: delegation.agentConfig.persona,
          capabilities: delegation.agentConfig.capabilities,
          evidence: [
            {
              type: 'execution_log',
              message: `Task executed by ${delegation.agentType} using ${delegation.agentConfig.persona} persona`,
              timestamp: new Date().toISOString()
            }
          ]
        });
      }, executionTime);
    });
  }

  // Coordination Strategies
  async coordinateMultipleTasks(tasks, strategy = 'intelligent') {
    console.log(`🎭 Coordinating ${tasks.length} tasks using ${strategy} strategy`);
    
    switch (strategy) {
      case 'parallel':
        return await this.executeParallel(tasks);
      case 'sequential':
        return await this.executeSequential(tasks);
      case 'intelligent':
        return await this.executeIntelligent(tasks);
      default:
        throw new Error(`Unknown coordination strategy: ${strategy}`);
    }
  }

  async executeParallel(tasks) {
    const delegationPromises = tasks.map(task => this.delegateTask(task));
    const results = await Promise.allSettled(delegationPromises);
    
    return {
      strategy: 'parallel',
      totalTasks: tasks.length,
      completed: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results: results
    };
  }

  async executeSequential(tasks) {
    const results = [];
    
    for (const task of tasks) {
      try {
        const result = await this.delegateTask(task);
        results.push({ status: 'fulfilled', value: result });
      } catch (error) {
        results.push({ status: 'rejected', reason: error });
      }
    }
    
    return {
      strategy: 'sequential',
      totalTasks: tasks.length,
      completed: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results: results
    };
  }

  async executeIntelligent(tasks) {
    // Analyze task dependencies and optimal execution order
    const taskGraph = this.buildDependencyGraph(tasks);
    const executionPlan = this.createOptimalExecutionPlan(taskGraph);
    
    console.log(`🧠 Intelligent execution plan: ${executionPlan.phases.length} phases`);
    
    const results = [];
    
    for (const phase of executionPlan.phases) {
      console.log(`⚡ Executing phase with ${phase.tasks.length} tasks`);
      
      // Execute tasks in current phase in parallel
      const phasePromises = phase.tasks.map(taskId => {
        const task = tasks.find(t => t.id === taskId);
        return this.delegateTask(task);
      });
      
      const phaseResults = await Promise.allSettled(phasePromises);
      results.push(...phaseResults);
    }
    
    return {
      strategy: 'intelligent',
      totalTasks: tasks.length,
      phases: executionPlan.phases.length,
      completed: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results: results
    };
  }

  buildDependencyGraph(tasks) {
    const graph = new Map();
    
    tasks.forEach(task => {
      graph.set(task.id, {
        task: task,
        dependencies: task.dependencies || [],
        dependents: []
      });
    });
    
    // Build dependent relationships
    tasks.forEach(task => {
      (task.dependencies || []).forEach(depId => {
        if (graph.has(depId)) {
          graph.get(depId).dependents.push(task.id);
        }
      });
    });
    
    return graph;
  }

  createOptimalExecutionPlan(taskGraph) {
    const phases = [];
    const completed = new Set();
    const remaining = new Set(taskGraph.keys());
    
    while (remaining.size > 0) {
      // Find tasks with all dependencies completed
      const readyTasks = Array.from(remaining).filter(taskId => {
        const node = taskGraph.get(taskId);
        return node.dependencies.every(depId => completed.has(depId));
      });
      
      if (readyTasks.length === 0) {
        // Circular dependency or missing dependency
        console.warn('⚠️ Circular dependency detected, breaking...');
        readyTasks.push(Array.from(remaining)[0]);
      }
      
      phases.push({
        phase: phases.length + 1,
        tasks: readyTasks
      });
      
      readyTasks.forEach(taskId => {
        completed.add(taskId);
        remaining.delete(taskId);
      });
    }
    
    return { phases };
  }

  // Status and Monitoring
  async getDelegationStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      agents: {
        total: this.agents.size,
        available: Array.from(this.agents.values()).filter(a => a.status === 'available').length,
        busy: Array.from(this.agents.values()).filter(a => a.status === 'busy').length
      },
      delegations: {
        active: this.activeAgents.size,
        queued: this.delegationQueue.length,
        completed: this.completedDelegations.length
      },
      performance: this.calculatePerformanceMetrics()
    };

    console.log('📊 Delegation Status:');
    console.log(`   Agents: ${status.agents.available}/${status.agents.total} available`);
    console.log(`   Active delegations: ${status.delegations.active}`);
    console.log(`   Completion rate: ${(status.performance.completionRate * 100).toFixed(1)}%`);

    return status;
  }

  calculatePerformanceMetrics() {
    const totalDelegations = this.completedDelegations.length;
    if (totalDelegations === 0) {
      return {
        completionRate: 1.0,
        averageDuration: 0,
        successRate: 1.0
      };
    }

    const successful = this.completedDelegations.filter(d => d.status === 'completed').length;
    const totalDuration = this.completedDelegations.reduce((sum, d) => sum + (d.actualDuration || 0), 0);

    return {
      completionRate: successful / totalDelegations,
      averageDuration: totalDuration / totalDelegations,
      successRate: successful / totalDelegations
    };
  }

  // Data Persistence
  async saveDelegationState() {
    try {
      const state = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        agents: Object.fromEntries(this.agents),
        activeDelegations: Object.fromEntries(this.activeAgents),
        completedDelegations: this.completedDelegations.slice(-50), // Keep last 50
        performance: this.calculatePerformanceMetrics()
      };

      await fs.writeFile('.github/task-state/delegation-state.json', JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('❌ Failed to save delegation state:', error.message);
    }
  }

  async loadDelegationState() {
    try {
      const state = JSON.parse(await fs.readFile('.github/task-state/delegation-state.json', 'utf8'));
      
      this.agents = new Map(Object.entries(state.agents || {}));
      this.activeAgents = new Map(Object.entries(state.activeDelegations || {}));
      this.completedDelegations = state.completedDelegations || [];
      
      console.log(`📂 Loaded delegation state with ${this.agents.size} agents`);
    } catch (error) {
      console.log('📝 No existing delegation state found, starting fresh');
    }
  }
}

// CLI interface
async function main() {
  const delegation = new TaskDelegation();
  await delegation.initialize();
  await delegation.loadDelegationState();

  const action = process.argv.find(arg => arg.startsWith('--action='))?.split('=')[1] || 'status';

  switch (action) {
    case 'status':
      await delegation.getDelegationStatus();
      break;

    case 'demo':
      // Demo delegation
      const demoTasks = [
        {
          id: 'TASK-001',
          title: 'Optimize React component performance',
          description: 'Analyze and optimize the WeatherCard component for better performance',
          assignedPersona: 'frontend',
          mcpServers: ['magic'],
          tools: ['Read', 'Edit'],
          validationCriteria: ['performance_improved', 'accessibility_maintained']
        },
        {
          id: 'TASK-002',
          title: 'Implement API security validation',
          description: 'Add input validation and rate limiting to weather API endpoints',
          assignedPersona: 'security',
          dependencies: ['TASK-001'],
          mcpServers: ['sequential'],
          tools: ['Read', 'Edit', 'Bash']
        }
      ];

      console.log('🎭 Running delegation demo...');
      const results = await delegation.coordinateMultipleTasks(demoTasks, 'intelligent');
      console.log('Demo results:', results);
      break;

    default:
      console.log('❌ Unknown action. Use --action=status|demo');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Delegation error:', error);
    process.exit(1);
  });
}

module.exports = { TaskDelegation };