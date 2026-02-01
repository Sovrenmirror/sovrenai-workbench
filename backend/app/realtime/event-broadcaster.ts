/**
 * Event Broadcaster
 * Broadcasts agent events, workflow progress, and activity feed to connected clients
 */

import { EventEmitter } from 'events';
import { connectionManager } from './connection-manager.js';
import { agentRegistry } from '../agents/base/agent-registry.js';
import { agentOrchestrator } from '../agents/orchestration/agent-orchestrator.js';
import { parallelExecutor } from '../agents/orchestration/parallel-executor.js';
import { workflowEngine } from '../agents/orchestration/workflow-engine.js';
import { messageBus } from '../agents/communication/message-bus.js';

export enum EventType {
  AGENT_STATUS = 'agent_status',
  AGENT_PROGRESS = 'agent_progress',
  TASK_STARTED = 'task_started',
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed',
  WORKFLOW_STARTED = 'workflow_started',
  WORKFLOW_STEP = 'workflow_step',
  WORKFLOW_COMPLETED = 'workflow_completed',
  WORKFLOW_FAILED = 'workflow_failed',
  PARALLEL_EXECUTION = 'parallel_execution',
  ACTIVITY = 'activity',
  MESSAGE = 'message'
}

export interface BroadcastEvent {
  type: EventType;
  timestamp: Date;
  payload: any;
}

export class EventBroadcaster extends EventEmitter {
  private activityHistory: BroadcastEvent[] = [];
  private maxHistorySize: number = 500;
  private initialized: boolean = false;

  constructor() {
    super();
  }

  /**
   * Initialize broadcaster and subscribe to agent events
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    console.log('[EventBroadcaster] Initializing...');

    // Subscribe to all agents
    this.subscribeToAgents();

    // Subscribe to orchestrator
    this.subscribeToOrchestrator();

    // Subscribe to parallel executor
    this.subscribeToParallelExecutor();

    // Subscribe to workflow engine
    this.subscribeToWorkflowEngine();

    // Subscribe to message bus
    this.subscribeToMessageBus();

    // Subscribe to self for direct emissions from external code
    this.subscribeToSelfEmissions();

    this.initialized = true;
    console.log('[EventBroadcaster] Initialized successfully');
  }

  /**
   * Subscribe to direct emissions from external code (e.g., main.ts)
   */
  private subscribeToSelfEmissions(): void {
    // Listen for activity events emitted directly
    this.on('activity', (data: any) => {
      if (data.payload) {
        // Structured emission with nested payload - flatten it
        const event: BroadcastEvent = {
          type: EventType.ACTIVITY,
          timestamp: data.timestamp || new Date(),
          payload: {
            type: data.type,  // Extract type from outer level
            ...data.payload,   // Spread inner payload
            timestamp: data.timestamp || new Date()
          }
        };

        // Add to history
        this.activityHistory.push(event);
        if (this.activityHistory.length > this.maxHistorySize) {
          this.activityHistory = this.activityHistory.slice(-this.maxHistorySize);
        }

        // Broadcast
        connectionManager.broadcast('activity', event);
      } else {
        // Raw activity data, wrap it
        this.addActivity(data);
      }
    });

    // Listen for agent_status events emitted directly
    this.on('agent_status', (data: any) => {
      this.broadcast({
        type: EventType.AGENT_STATUS,
        timestamp: new Date(),
        payload: data
      });
    });

    // Listen for agent_progress events emitted directly
    this.on('agent_progress', (data: any) => {
      this.broadcast({
        type: EventType.AGENT_PROGRESS,
        timestamp: new Date(),
        payload: data
      });
    });

    console.log('[EventBroadcaster] Subscribed to self emissions');
  }

  /**
   * Subscribe to all agent events
   */
  private subscribeToAgents(): void {
    const agents = agentRegistry.getAll();

    for (const agent of agents) {
      // Status changes
      agent.on('status', (event: any) => {
        this.broadcast({
          type: EventType.AGENT_STATUS,
          timestamp: new Date(),
          payload: {
            agentId: event.agentId || agent.id,
            status: event.status || agent.status,
            agentName: agent.name,
            agentIcon: agent.icon
          }
        });

        this.addActivity({
          type: 'agent_status',
          message: `${agent.icon} ${agent.name} is now ${event.status}`,
          agentId: agent.id,
          status: event.status
        });
      });

      // Progress updates
      agent.on('progress', (progress: any) => {
        this.broadcast({
          type: EventType.AGENT_PROGRESS,
          timestamp: new Date(),
          payload: {
            agentId: progress.agentId || agent.id,
            taskId: progress.taskId,
            percent: progress.percent,
            message: progress.message,
            stage: progress.stage,
            agentName: agent.name,
            agentIcon: agent.icon
          }
        });
      });

      // Task started
      agent.on('task_started', (event: any) => {
        this.broadcast({
          type: EventType.TASK_STARTED,
          timestamp: new Date(),
          payload: {
            agentId: event.agentId || agent.id,
            taskId: event.taskId,
            agentName: agent.name,
            agentIcon: agent.icon
          }
        });

        this.addActivity({
          type: 'task_started',
          message: `${agent.icon} ${agent.name} started task ${event.taskId}`,
          agentId: agent.id,
          taskId: event.taskId
        });
      });

      // Task completed
      agent.on('task_completed', (event: any) => {
        this.broadcast({
          type: EventType.TASK_COMPLETED,
          timestamp: new Date(),
          payload: {
            agentId: event.agentId || agent.id,
            taskId: event.taskId,
            result: event.result,
            agentName: agent.name,
            agentIcon: agent.icon
          }
        });

        this.addActivity({
          type: 'task_completed',
          message: `${agent.icon} ${agent.name} completed task ${event.taskId}`,
          agentId: agent.id,
          taskId: event.taskId,
          status: 'success'
        });
      });

      // Task error
      agent.on('task_error', (event: any) => {
        this.broadcast({
          type: EventType.TASK_FAILED,
          timestamp: new Date(),
          payload: {
            agentId: event.agentId || agent.id,
            taskId: event.taskId,
            error: event.error?.message || 'Unknown error',
            agentName: agent.name,
            agentIcon: agent.icon
          }
        });

        this.addActivity({
          type: 'task_failed',
          message: `${agent.icon} ${agent.name} task ${event.taskId} failed`,
          agentId: agent.id,
          taskId: event.taskId,
          status: 'error'
        });
      });
    }

    console.log(`[EventBroadcaster] Subscribed to ${agents.length} agents`);
  }

  /**
   * Subscribe to orchestrator events
   */
  private subscribeToOrchestrator(): void {
    agentOrchestrator.on('task_queued', (event: any) => {
      this.addActivity({
        type: 'task_queued',
        message: `Task ${event.taskId} queued for ${event.agentId}`,
        agentId: event.agentId,
        taskId: event.taskId
      });
    });

    agentOrchestrator.on('task_completed', (event: any) => {
      this.addActivity({
        type: 'task_completed',
        message: `Task ${event.taskId} completed`,
        taskId: event.taskId,
        status: 'success'
      });
    });

    console.log('[EventBroadcaster] Subscribed to orchestrator');
  }

  /**
   * Subscribe to parallel executor events
   */
  private subscribeToParallelExecutor(): void {
    parallelExecutor.on('execution_started', (event: any) => {
      this.addActivity({
        type: 'parallel_execution',
        message: `Parallel execution: ${event.taskId} started (active: ${event.activeExecutions})`,
        taskId: event.taskId,
        agentId: event.agentId
      });
    });

    parallelExecutor.on('parallel_execution_complete', (result: any) => {
      this.broadcast({
        type: EventType.PARALLEL_EXECUTION,
        timestamp: new Date(),
        payload: {
          successful: result.successful.length,
          failed: result.failed.length,
          duration: result.duration,
          metadata: result.metadata
        }
      });

      this.addActivity({
        type: 'parallel_complete',
        message: `Parallel execution complete: ${result.successful.length} success, ${result.failed.length} failed`,
        status: result.failed.length === 0 ? 'success' : 'partial'
      });
    });

    parallelExecutor.on('circuit_breaker_triggered', (event: any) => {
      this.addActivity({
        type: 'circuit_breaker',
        message: `⚠️ Circuit breaker triggered! Failure rate: ${(event.failureRate * 100).toFixed(1)}%`,
        status: 'warning'
      });
    });

    console.log('[EventBroadcaster] Subscribed to parallel executor');
  }

  /**
   * Subscribe to workflow engine events
   */
  private subscribeToWorkflowEngine(): void {
    workflowEngine.on('workflow_started', (event: any) => {
      this.broadcast({
        type: EventType.WORKFLOW_STARTED,
        timestamp: new Date(),
        payload: {
          workflowId: event.workflowId,
          workflowName: event.workflow.name,
          steps: event.workflow.steps.length
        }
      });

      this.addActivity({
        type: 'workflow_started',
        message: `📋 Workflow started: ${event.workflow.name}`,
        workflowId: event.workflowId
      });
    });

    workflowEngine.on('step_started', (event: any) => {
      this.broadcast({
        type: EventType.WORKFLOW_STEP,
        timestamp: new Date(),
        payload: {
          workflowId: event.workflowId,
          stepId: event.stepId,
          status: 'started'
        }
      });
    });

    workflowEngine.on('step_completed', (event: any) => {
      this.broadcast({
        type: EventType.WORKFLOW_STEP,
        timestamp: new Date(),
        payload: {
          workflowId: event.workflowId,
          stepId: event.stepId,
          status: 'completed'
        }
      });
    });

    workflowEngine.on('step_failed', (event: any) => {
      this.broadcast({
        type: EventType.WORKFLOW_STEP,
        timestamp: new Date(),
        payload: {
          workflowId: event.workflowId,
          stepId: event.stepId,
          status: 'failed',
          error: event.error?.message
        }
      });
    });

    workflowEngine.on('workflow_completed', (event: any) => {
      this.broadcast({
        type: EventType.WORKFLOW_COMPLETED,
        timestamp: new Date(),
        payload: {
          workflowId: event.workflowId,
          duration: event.context?.metadata?.duration,
          stepsCompleted: event.context?.metadata?.stepsCompleted,
          stepsFailed: event.context?.metadata?.stepsFailed
        }
      });

      this.addActivity({
        type: 'workflow_completed',
        message: `✅ Workflow completed (${event.context?.metadata?.stepsCompleted} steps)`,
        workflowId: event.workflowId,
        status: 'success'
      });
    });

    workflowEngine.on('workflow_failed', (event: any) => {
      this.broadcast({
        type: EventType.WORKFLOW_FAILED,
        timestamp: new Date(),
        payload: {
          workflowId: event.workflowId,
          error: event.error?.message
        }
      });

      this.addActivity({
        type: 'workflow_failed',
        message: `❌ Workflow failed: ${event.error?.message}`,
        workflowId: event.workflowId,
        status: 'error'
      });
    });

    console.log('[EventBroadcaster] Subscribed to workflow engine');
  }

  /**
   * Subscribe to message bus events
   */
  private subscribeToMessageBus(): void {
    messageBus.on('message', (message: any) => {
      this.broadcast({
        type: EventType.MESSAGE,
        timestamp: new Date(),
        payload: {
          messageType: message.type,
          fromAgent: message.fromAgent,
          toAgent: message.toAgent,
          channel: message.channel
        }
      });
    });

    console.log('[EventBroadcaster] Subscribed to message bus');
  }

  /**
   * Broadcast event to all subscribers
   */
  private broadcast(event: BroadcastEvent): void {
    // Broadcast to specific channel based on event type
    const channel = `event:${event.type}`;
    connectionManager.broadcast(channel, event);

    // Also broadcast to general events channel
    connectionManager.broadcast('events', event);
  }

  /**
   * Add activity to history and broadcast
   */
  private addActivity(activity: any): void {
    const event: BroadcastEvent = {
      type: EventType.ACTIVITY,
      timestamp: new Date(),
      payload: {
        ...activity,
        timestamp: new Date()
      }
    };

    // Add to history
    this.activityHistory.push(event);

    // Trim history if too large
    if (this.activityHistory.length > this.maxHistorySize) {
      this.activityHistory = this.activityHistory.slice(-this.maxHistorySize);
    }

    // Broadcast to activity channel
    connectionManager.broadcast('activity', event);
    this.emit('activity', event);
  }

  /**
   * Get activity history
   */
  getActivityHistory(limit?: number): BroadcastEvent[] {
    if (limit) {
      return this.activityHistory.slice(-limit);
    }
    return [...this.activityHistory];
  }

  /**
   * Clear activity history
   */
  clearHistory(): void {
    this.activityHistory = [];
    console.log('[EventBroadcaster] Activity history cleared');
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalActivities: number;
    initialized: boolean;
  } {
    return {
      totalActivities: this.activityHistory.length,
      initialized: this.initialized
    };
  }
}

// Export singleton instance
export const eventBroadcaster = new EventBroadcaster();
