#!/usr/bin/env node
/**
 * Parallel Sub-Agent Spawn System for Singapore Weather Cam
 * Real-time orchestration and monitoring of specialized agents
 */

import { TaskManager } from './task-manager.js';
import fs from 'fs/promises';
import path from 'path';

class ParallelSpawnSystem {
  constructor() {
    this.taskManager = new TaskManager();
    this.agents = new Map();
    this.executionStatus = new Map();
    this.realTimeMonitor = {
      startTime: Date.now(),
      activeAgents: 0,
      completedTasks: 0,
      totalTasks: 0,
      currentPhase: 'initialization'
    };
  }

  async initialize() {
    console.log('🚀 Initializing Parallel Sub-Agent Spawn System...');
    await this.taskManager.initialize();
    await this.loadTaskBreakdown();
    console.log('✅ System initialized successfully');
  }

  async loadTaskBreakdown() {
    try {
      const taskBreakdownPath = path.join(process.cwd(), 'task-breakdown.json');
      const breakdown = JSON.parse(await fs.readFile(taskBreakdownPath, 'utf8'));
      
      console.log(`📋 Loaded task breakdown: ${breakdown.total_epics} epics, ${breakdown.total_stories} stories, ${breakdown.total_tasks} tasks`);
      
      this.realTimeMonitor.totalTasks = breakdown.total_tasks;
      this.taskBreakdown = breakdown;
      
      return breakdown;
    } catch (error) {
      console.error('❌ Failed to load task breakdown:', error.message);
      throw new Error('Task breakdown file not found. Please run task creation first.');
    }
  }

  async spawnAgents() {
    console.log('\n🤖 Spawning specialized sub-agents...');
    
    const agentConfigs = [
      {
        id: 'performance-specialist',
        persona: 'performance',
        focus: ['performance', 'optimization', 'core-web-vitals'],
        mcpServers: ['sequential', 'playwright'],
        maxConcurrentTasks: 3
      },
      {
        id: 'frontend-specialist',
        persona: 'frontend',
        focus: ['ui', 'accessibility', 'mobile'],
        mcpServers: ['magic', 'context7'],
        maxConcurrentTasks: 4
      },
      {
        id: 'backend-specialist',
        persona: 'backend',
        focus: ['api', 'data-quality', 'github-actions'],
        mcpServers: ['context7', 'sequential'],
        maxConcurrentTasks: 3
      },
      {
        id: 'security-specialist',
        persona: 'security',
        focus: ['security', 'compliance', 'vulnerability'],
        mcpServers: ['sequential', 'context7'],
        maxConcurrentTasks: 2
      },
      {
        id: 'qa-specialist',
        persona: 'qa',
        focus: ['testing', 'validation', 'quality'],
        mcpServers: ['playwright', 'sequential'],
        maxConcurrentTasks: 3
      },
      {
        id: 'analyzer-specialist',
        persona: 'analyzer',
        focus: ['monitoring', 'analytics', 'health-checks'],
        mcpServers: ['sequential', 'playwright'],
        maxConcurrentTasks: 2
      },
      {
        id: 'refactorer-specialist',
        persona: 'refactorer',
        focus: ['code-quality', 'maintainability', 'proptypes'],
        mcpServers: ['sequential', 'context7'],
        maxConcurrentTasks: 3
      },
      {
        id: 'devops-specialist',
        persona: 'devops',
        focus: ['workflows', 'deployment', 'automation'],
        mcpServers: ['sequential', 'context7'],
        maxConcurrentTasks: 2
      }
    ];

    for (const config of agentConfigs) {
      const agent = await this.createAgent(config);
      this.agents.set(config.id, agent);
      console.log(`✅ Agent spawned: ${config.id} (${config.persona} persona)`);
    }

    this.realTimeMonitor.activeAgents = this.agents.size;
    console.log(`\n🎯 ${this.agents.size} specialized agents ready for parallel execution`);
  }

  async createAgent(config) {
    return {
      id: config.id,
      persona: config.persona,
      focus: config.focus,
      mcpServers: config.mcpServers,
      maxConcurrentTasks: config.maxConcurrentTasks,
      status: 'ready',
      currentTasks: [],
      completedTasks: 0,
      createdAt: new Date().toISOString()
    };
  }

  async executeParallelTasks() {
    console.log('\n⚡ Starting parallel task execution...');
    this.realTimeMonitor.currentPhase = 'execution';
    
    // Create epics from breakdown
    const epics = await this.createEpicsFromBreakdown();
    
    // Start real-time monitoring
    const monitorInterval = setInterval(() => {
      this.displayRealTimeStatus();
    }, 5000); // Update every 5 seconds

    try {
      // Execute epics in parallel with coordination
      const epicPromises = epics.map(epic => this.executeEpic(epic));
      const results = await Promise.allSettled(epicPromises);
      
      // Process results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`\n🎉 Parallel execution completed: ${successful} successful, ${failed} failed`);
      
      this.realTimeMonitor.currentPhase = 'completed';
      this.displayFinalReport();
      
    } finally {
      clearInterval(monitorInterval);
    }
  }

  async createEpicsFromBreakdown() {
    console.log('\n📚 Creating epic hierarchy from task breakdown...');
    
    const epics = [];
    
    for (const epicData of this.taskBreakdown.epics) {
      const epic = await this.taskManager.createEpic({
        id: epicData.id,
        title: epicData.title,
        description: epicData.description,
        priority: epicData.priority,
        timeline: epicData.timeline
      });

      // Create stories for this epic
      for (const storyData of epicData.stories) {
        const story = await this.taskManager.createStory({
          id: storyData.id,
          epicId: epic.id,
          title: storyData.title,
          description: storyData.description,
          priority: storyData.priority,
          assignedPersona: storyData.assigned_agents ? storyData.assigned_agents[0] : storyData.assigned_agent
        });

        // Create tasks for this story
        for (const taskData of storyData.tasks) {
          await this.taskManager.createTask({
            id: taskData.id,
            storyId: story.id,
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            estimatedDuration: (taskData.estimated_time || taskData.estimated_duration || 30) * 60 * 1000, // Convert minutes to ms
            validationCriteria: taskData.validation_criteria || [],
            assignedPersona: taskData.assigned_agent || taskData.assigned_persona,
            mcpServers: taskData.mcp_servers || [],
            tools: taskData.tools || taskData.required_tools || [],
            dependencies: taskData.dependencies
          });
        }
      }

      epics.push(epic);
      console.log(`✅ Created epic: ${epic.title} (${epicData.stories.length} stories)`);
    }

    return epics;
  }

  async executeEpic(epic) {
    console.log(`\n🎯 Executing epic: ${epic.title}`);
    
    const stories = Array.from(this.taskManager.taskHierarchy.stories.values())
      .filter(story => story.epicId === epic.id);
    
    // Execute stories in parallel with dependency management
    const storyPromises = stories.map(story => this.executeStory(story));
    const results = await Promise.allSettled(storyPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Epic completed: ${epic.title} (${successful}/${stories.length} stories)`);
    
    return { epic: epic.id, successful, total: stories.length };
  }

  async executeStory(story) {
    console.log(`📖 Executing story: ${story.title}`);
    
    const tasks = Array.from(this.taskManager.taskHierarchy.tasks.values())
      .filter(task => task.storyId === story.id);
    
    // Find appropriate agent for this story
    const agent = this.findBestAgent(story);
    if (!agent) {
      throw new Error(`No suitable agent found for story: ${story.title}`);
    }

    // Execute tasks sequentially within the story (respecting dependencies)
    const taskResults = [];
    for (const task of tasks) {
      try {
        const result = await this.executeTaskWithAgent(task, agent);
        taskResults.push(result);
        this.realTimeMonitor.completedTasks++;
      } catch (error) {
        console.error(`❌ Task failed: ${task.title} - ${error.message}`);
        taskResults.push({ status: 'failed', error: error.message });
      }
    }
    
    const successful = taskResults.filter(r => r.status === 'completed').length;
    console.log(`✅ Story completed: ${story.title} (${successful}/${tasks.length} tasks)`);
    
    return { story: story.id, successful, total: tasks.length };
  }

  findBestAgent(story) {
    // Find agent that best matches the story's requirements
    const candidates = Array.from(this.agents.values()).filter(agent => {
      return agent.persona === story.assignedPersona || 
             agent.focus.some(focus => story.title.toLowerCase().includes(focus));
    });
    
    if (candidates.length === 0) {
      return Array.from(this.agents.values())[0]; // Fallback to first agent
    }
    
    // Return agent with least current tasks
    return candidates.reduce((best, agent) => 
      agent.currentTasks.length < best.currentTasks.length ? agent : best
    );
  }

  async executeTaskWithAgent(task, agent) {
    console.log(`🤖 Agent ${agent.id} executing: ${task.title}`);
    
    // Add to agent's current tasks
    agent.currentTasks.push(task.id);
    
    try {
      const result = await this.taskManager.executeTask(task.id);
      
      // Update agent stats
      agent.completedTasks++;
      agent.currentTasks = agent.currentTasks.filter(id => id !== task.id);
      
      return result;
    } catch (error) {
      agent.currentTasks = agent.currentTasks.filter(id => id !== task.id);
      throw error;
    }
  }

  displayRealTimeStatus() {
    const now = Date.now();
    const elapsed = Math.floor((now - this.realTimeMonitor.startTime) / 1000);
    const completionRate = (this.realTimeMonitor.completedTasks / this.realTimeMonitor.totalTasks * 100).toFixed(1);
    
    console.clear();
    console.log('🔄 ═══ REAL-TIME MONITORING DASHBOARD ═══');
    console.log(`📊 Session: parallel-spawn-${new Date().toISOString().slice(0, 10)}`);
    console.log(`⏱️  Elapsed: ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`);
    console.log(`📈 Progress: ${this.realTimeMonitor.completedTasks}/${this.realTimeMonitor.totalTasks} (${completionRate}%)`);
    console.log(`🎯 Phase: ${this.realTimeMonitor.currentPhase}`);
    console.log(`🤖 Active Agents: ${this.realTimeMonitor.activeAgents}`);
    
    console.log('\n🤖 ═══ AGENT STATUS ═══');
    for (const [id, agent] of this.agents) {
      const status = agent.currentTasks.length > 0 ? 
        `🔄 Working (${agent.currentTasks.length} tasks)` : 
        `✅ Ready`;
      console.log(`${id.padEnd(20)} | ${status.padEnd(25)} | Completed: ${agent.completedTasks}`);
    }
    
    console.log('\n📊 ═══ TASK PROGRESS ═══');
    const progressBar = this.createProgressBar(completionRate);
    console.log(`${progressBar} ${completionRate}%`);
  }

  createProgressBar(percentage) {
    const width = 40;
    const filled = Math.floor(width * percentage / 100);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  displayFinalReport() {
    const totalTime = Math.floor((Date.now() - this.realTimeMonitor.startTime) / 1000);
    
    console.log('\n🎉 ═══ FINAL EXECUTION REPORT ═══');
    console.log(`⏰ Total Time: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`);
    console.log(`📊 Tasks Completed: ${this.realTimeMonitor.completedTasks}/${this.realTimeMonitor.totalTasks}`);
    console.log(`🏆 Success Rate: ${(this.realTimeMonitor.completedTasks / this.realTimeMonitor.totalTasks * 100).toFixed(1)}%`);
    
    console.log('\n🤖 ═══ AGENT PERFORMANCE ═══');
    for (const [id, agent] of this.agents) {
      console.log(`${id}: ${agent.completedTasks} tasks completed`);
    }
    
    console.log('\n✨ Parallel sub-agent execution completed successfully!');
  }
}

// Main execution
async function main() {
  const spawnSystem = new ParallelSpawnSystem();
  
  try {
    await spawnSystem.initialize();
    await spawnSystem.spawnAgents();
    await spawnSystem.executeParallelTasks();
  } catch (error) {
    console.error('❌ Parallel spawn system error:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ParallelSpawnSystem };