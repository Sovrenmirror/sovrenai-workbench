/**
 * Agent Orchestrator
 * Routes tasks to appropriate agents and manages execution
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentTask, AgentTaskResult, AgentCapability } from '../base/agent.js';
import { agentRegistry } from '../base/agent-registry.js';
import { agentStore } from '../persistence/agent-store.js';

export interface TaskRequest {
  type: string;
  input: any;
  priority?: number;
  requiredCapabilities?: AgentCapability[];
  metadata?: Record<string, any>;
}

export interface QueuedTask {
  task: AgentTask;
  agentId?: string;
  addedAt: Date;
  startedAt?: Date;
}

export class AgentOrchestrator extends EventEmitter {
  private taskQueue: QueuedTask[] = [];
  private activeTasks: Map<string, { agentId: string; task: AgentTask }> = new Map();
  private processing: boolean = false;

  constructor() {
    super();
  }

  /**
   * Submit a task for execution
   */
  async submitTask(request: TaskRequest): Promise<AgentTaskResult> {
    console.log(`[Orchestrator] Submitting task: ${request.type}`);

    // Create task
    const task: AgentTask = {
      id: uuidv4(),
      type: request.type,
      input: request.input,
      priority: request.priority || 1,
      metadata: request.metadata,
      createdAt: new Date()
    };

    // Select agent
    const agent = this.selectAgent(request);

    if (!agent) {
      throw new Error(`No agent available for task type: ${request.type}`);
    }

    console.log(`[Orchestrator] Task ${task.id} assigned to agent: ${agent.name} (${agent.id})`);

    // Execute task immediately
    return this.executeTask(agent, task);
  }

  /**
   * Queue a task for later execution
   */
  queueTask(request: TaskRequest, agentId?: string): string {
    const task: AgentTask = {
      id: uuidv4(),
      type: request.type,
      input: request.input,
      priority: request.priority || 1,
      metadata: request.metadata,
      createdAt: new Date()
    };

    const queuedTask: QueuedTask = {
      task,
      agentId,
      addedAt: new Date()
    };

    // Insert task in priority order
    this.insertTaskByPriority(queuedTask);

    console.log(`[Orchestrator] Task ${task.id} queued (priority: ${task.priority})`);

    this.emit('task_queued', { taskId: task.id, agentId });

    // Start processing if not already
    if (!this.processing) {
      this.processQueue();
    }

    return task.id;
  }

  /**
   * Process the task queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.taskQueue.length > 0) {
      const queuedTask = this.taskQueue.shift()!;

      // Select agent if not specified
      let agent: BaseAgent | undefined;
      if (queuedTask.agentId) {
        agent = agentRegistry.get(queuedTask.agentId);
      } else {
        agent = this.selectAgent({
          type: queuedTask.task.type,
          input: queuedTask.task.input
        });
      }

      if (!agent) {
        console.error(`[Orchestrator] No agent available for task ${queuedTask.task.id}`);
        continue;
      }

      // Execute task
      try {
        queuedTask.startedAt = new Date();
        await this.executeTask(agent, queuedTask.task);
      } catch (error) {
        console.error(`[Orchestrator] Task ${queuedTask.task.id} failed:`, error);
      }
    }

    this.processing = false;
  }

  /**
   * Execute a task with an agent
   */
  private async executeTask(agent: BaseAgent, task: AgentTask): Promise<AgentTaskResult> {
    // Track active task
    this.activeTasks.set(task.id, { agentId: agent.id, task });

    // Ensure agent state exists in database BEFORE executing task
    // (to avoid foreign key constraint errors)
    agentStore.saveState({
      agentId: agent.id,
      status: agent.status,
      currentTask: null,
      stats: agent.stats,
      lastUpdated: new Date()
    });

    // Subscribe to agent events
    const progressHandler = (progress: any) => {
      this.emit('task_progress', progress);
    };

    const statusHandler = (status: any) => {
      this.emit('agent_status', status);
    };

    agent.on('progress', progressHandler);
    agent.on('status', statusHandler);

    try {
      // Execute task
      const result = await agent.execute(task);

      // Save result to store
      agentStore.saveTaskResult(result);

      // Update agent state after task completion
      agentStore.saveState({
        agentId: agent.id,
        status: agent.status,
        currentTask: agent.currentTask,
        stats: agent.stats,
        lastUpdated: new Date()
      });

      this.emit('task_completed', { taskId: task.id, result });

      return result;
    } finally {
      // Clean up
      agent.off('progress', progressHandler);
      agent.off('status', statusHandler);
      this.activeTasks.delete(task.id);
    }
  }

  /**
   * Select appropriate agent for a task
   */
  private selectAgent(request: TaskRequest): BaseAgent | undefined {
    // If specific capabilities required, search by capabilities
    if (request.requiredCapabilities && request.requiredCapabilities.length > 0) {
      const agents = agentRegistry.findByCapabilities(request.requiredCapabilities);
      if (agents.length > 0) {
        return this.selectBestAgent(agents);
      }
    }

    // Map task type to capabilities
    const capabilityMap: Record<string, AgentCapability[]> = {
      research: ['web_search', 'fact_verification', 'source_gathering'],
      write: ['document_generation', 'content_creation', 'editing'],
      analyze: ['data_analysis', 'comparisons', 'insights', 'pattern_detection'],
      design: ['diagram_generation', 'visual_creation', 'flowcharts'],
      plan: ['task_breakdown', 'scheduling', 'dependency_resolution'],
      review: ['quality_checks', 'truth_validation', 'accuracy_scoring']
    };

    const capabilities = capabilityMap[request.type];
    if (!capabilities) {
      console.warn(`[Orchestrator] Unknown task type: ${request.type}`);
      return undefined;
    }

    // Find agents with any of these capabilities
    const agents = agentRegistry.findByCapability(capabilities[0]);
    if (agents.length === 0) {
      return undefined;
    }

    return this.selectBestAgent(agents);
  }

  /**
   * Select best agent from a list (based on availability and stats)
   */
  private selectBestAgent(agents: BaseAgent[]): BaseAgent | undefined {
    // Filter to available agents
    const available = agents.filter(agent => agent.status === 'ready');

    if (available.length === 0) {
      return undefined;
    }

    if (available.length === 1) {
      return available[0];
    }

    // Select agent with lowest error rate and best performance
    available.sort((a, b) => {
      const aScore = a.stats.errorRate * 100 + a.stats.avgDuration;
      const bScore = b.stats.errorRate * 100 + b.stats.avgDuration;
      return aScore - bScore;
    });

    return available[0];
  }

  /**
   * Insert task by priority (higher priority first)
   */
  private insertTaskByPriority(queuedTask: QueuedTask): void {
    const index = this.taskQueue.findIndex(
      qt => (qt.task.priority || 1) < (queuedTask.task.priority || 1)
    );

    if (index === -1) {
      this.taskQueue.push(queuedTask);
    } else {
      this.taskQueue.splice(index, 0, queuedTask);
    }
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): 'queued' | 'active' | 'completed' | 'not_found' {
    if (this.activeTasks.has(taskId)) {
      return 'active';
    }

    if (this.taskQueue.find(qt => qt.task.id === taskId)) {
      return 'queued';
    }

    const result = agentStore.getTask(taskId);
    if (result) {
      return 'completed';
    }

    return 'not_found';
  }

  /**
   * Get active tasks
   */
  getActiveTasks(): Array<{ taskId: string; agentId: string; task: AgentTask }> {
    return Array.from(this.activeTasks.entries()).map(([taskId, { agentId, task }]) => ({
      taskId,
      agentId,
      task
    }));
  }

  /**
   * Get queued tasks
   */
  getQueuedTasks(): QueuedTask[] {
    return [...this.taskQueue];
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string): boolean {
    // Check if task is active
    const activeTask = this.activeTasks.get(taskId);
    if (activeTask) {
      const agent = agentRegistry.get(activeTask.agentId);
      if (agent) {
        agent.cancel();
        return true;
      }
    }

    // Check if task is queued
    const index = this.taskQueue.findIndex(qt => qt.task.id === taskId);
    if (index !== -1) {
      this.taskQueue.splice(index, 1);
      this.emit('task_cancelled', { taskId });
      return true;
    }

    return false;
  }

  /**
   * Get orchestrator statistics
   */
  getStats(): {
    queueLength: number;
    activeTasks: number;
    totalCompleted: number;
  } {
    const storeStats = agentStore.getStats();

    return {
      queueLength: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      totalCompleted: storeStats.totalTasks
    };
  }
}

// Export singleton instance
export const agentOrchestrator = new AgentOrchestrator();
