/**
 * Base Agent Class
 * Abstract base class for all specialized agents in the Sovren Workbench
 */

import { EventEmitter } from 'events';

/**
 * Agent status lifecycle
 */
export enum AgentStatus {
  INITIALIZING = 'initializing',
  READY = 'ready',
  WORKING = 'working',
  QUEUED = 'queued',
  PAUSED = 'paused',
  ERROR = 'error',
  COMPLETED = 'completed'
}

/**
 * Agent capabilities
 */
export type AgentCapability =
  | 'web_search'
  | 'fact_verification'
  | 'source_gathering'
  | 'document_generation'
  | 'content_creation'
  | 'editing'
  | 'data_analysis'
  | 'comparisons'
  | 'insights'
  | 'pattern_detection'
  | 'diagram_generation'
  | 'visual_creation'
  | 'flowcharts'
  | 'task_breakdown'
  | 'scheduling'
  | 'dependency_resolution'
  | 'quality_checks'
  | 'truth_validation'
  | 'accuracy_scoring';

/**
 * Task definition
 */
export interface AgentTask {
  id: string;
  type: string;
  input: any;
  priority?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * Task result
 */
export interface AgentTaskResult {
  taskId: string;
  agentId: string;
  status: 'success' | 'error' | 'cancelled';
  output?: any;
  error?: Error;
  metadata?: Record<string, any>;
  startedAt: Date;
  completedAt: Date;
  duration: number;
}

/**
 * Progress update
 */
export interface ProgressUpdate {
  taskId: string;
  agentId: string;
  percent: number;
  message?: string;
  stage?: string;
}

/**
 * Agent statistics
 */
export interface AgentStats {
  tasksCompleted: number;
  tasksErrored: number;
  totalDuration: number;
  avgDuration: number;
  errorRate: number;
  lastActivity: Date | null;
}

/**
 * Agent metadata
 */
export interface AgentMetadata {
  id: string;
  name: string;
  icon: string;
  description: string;
  capabilities: AgentCapability[];
  version: string;
}

/**
 * Base Agent Abstract Class
 */
export abstract class BaseAgent extends EventEmitter {
  protected _status: AgentStatus = AgentStatus.INITIALIZING;
  protected _currentTask: AgentTask | null = null;
  protected _stats: AgentStats = {
    tasksCompleted: 0,
    tasksErrored: 0,
    totalDuration: 0,
    avgDuration: 0,
    errorRate: 0,
    lastActivity: null
  };
  protected _metadata: AgentMetadata;
  protected _cancelRequested: boolean = false;
  protected _pauseRequested: boolean = false;

  constructor(metadata: AgentMetadata) {
    super();
    this._metadata = metadata;
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    this._status = AgentStatus.INITIALIZING;
    this.emit('status', { agentId: this.id, status: this._status });

    try {
      await this.onInitialize();
      this._status = AgentStatus.READY;
      this.emit('status', { agentId: this.id, status: this._status });
    } catch (error) {
      this._status = AgentStatus.ERROR;
      this.emit('status', { agentId: this.id, status: this._status });
      this.emit('error', { agentId: this.id, error });
      throw error;
    }
  }

  /**
   * Execute a task
   */
  async execute(task: AgentTask): Promise<AgentTaskResult> {
    if (this._status !== AgentStatus.READY && this._status !== AgentStatus.QUEUED) {
      throw new Error(`Agent ${this.id} is not ready. Current status: ${this._status}`);
    }

    this._currentTask = task;
    this._status = AgentStatus.WORKING;
    this._cancelRequested = false;
    this._pauseRequested = false;

    const startedAt = new Date();

    this.emit('status', { agentId: this.id, status: this._status });
    this.emit('task_started', { agentId: this.id, taskId: task.id });

    try {
      // Execute the agent-specific logic
      const output = await this.onExecute(task);

      // Check if cancelled during execution
      if (this._cancelRequested) {
        throw new Error('Task cancelled');
      }

      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      // Update stats
      this._stats.tasksCompleted++;
      this._stats.totalDuration += duration;
      this._stats.avgDuration = this._stats.totalDuration / this._stats.tasksCompleted;
      this._stats.lastActivity = completedAt;
      this._stats.errorRate = this._stats.tasksErrored / (this._stats.tasksCompleted + this._stats.tasksErrored);

      // Reset status
      this._status = AgentStatus.READY;
      this._currentTask = null;

      const result: AgentTaskResult = {
        taskId: task.id,
        agentId: this.id,
        status: 'success',
        output,
        startedAt,
        completedAt,
        duration
      };

      this.emit('status', { agentId: this.id, status: this._status });
      this.emit('task_completed', { agentId: this.id, taskId: task.id, result });

      return result;
    } catch (error) {
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      // Update error stats
      this._stats.tasksErrored++;
      this._stats.lastActivity = completedAt;
      this._stats.errorRate = this._stats.tasksErrored / (this._stats.tasksCompleted + this._stats.tasksErrored);

      // Reset status
      this._status = AgentStatus.ERROR;
      this._currentTask = null;

      const result: AgentTaskResult = {
        taskId: task.id,
        agentId: this.id,
        status: this._cancelRequested ? 'cancelled' : 'error',
        error: error as Error,
        startedAt,
        completedAt,
        duration
      };

      this.emit('status', { agentId: this.id, status: this._status });
      this.emit('task_error', { agentId: this.id, taskId: task.id, error });

      // Return to ready state after error
      this._status = AgentStatus.READY;
      this.emit('status', { agentId: this.id, status: this._status });

      return result;
    }
  }

  /**
   * Pause current task
   */
  pause(): void {
    if (this._status !== AgentStatus.WORKING) {
      throw new Error(`Cannot pause agent ${this.id}. Current status: ${this._status}`);
    }

    this._pauseRequested = true;
    this._status = AgentStatus.PAUSED;
    this.emit('status', { agentId: this.id, status: this._status });
    this.emit('task_paused', { agentId: this.id, taskId: this._currentTask?.id });

    this.onPause();
  }

  /**
   * Resume from pause
   */
  resume(): void {
    if (this._status !== AgentStatus.PAUSED) {
      throw new Error(`Cannot resume agent ${this.id}. Current status: ${this._status}`);
    }

    this._pauseRequested = false;
    this._status = AgentStatus.WORKING;
    this.emit('status', { agentId: this.id, status: this._status });
    this.emit('task_resumed', { agentId: this.id, taskId: this._currentTask?.id });

    this.onResume();
  }

  /**
   * Cancel current task
   */
  cancel(): void {
    if (this._status !== AgentStatus.WORKING && this._status !== AgentStatus.PAUSED) {
      throw new Error(`Cannot cancel agent ${this.id}. Current status: ${this._status}`);
    }

    this._cancelRequested = true;
    this.emit('task_cancelled', { agentId: this.id, taskId: this._currentTask?.id });

    this.onCancel();
  }

  /**
   * Emit progress update
   */
  protected emitProgress(percent: number, message?: string, stage?: string): void {
    if (!this._currentTask) return;

    const progress: ProgressUpdate = {
      taskId: this._currentTask.id,
      agentId: this.id,
      percent: Math.min(100, Math.max(0, percent)),
      message,
      stage
    };

    this.emit('progress', progress);
  }

  /**
   * Check if pause requested
   */
  protected checkPause(): void {
    if (this._pauseRequested) {
      // Wait until resumed
      return;
    }
  }

  /**
   * Check if cancel requested
   */
  protected checkCancel(): void {
    if (this._cancelRequested) {
      throw new Error('Task cancelled');
    }
  }

  // Getters
  get id(): string {
    return this._metadata.id;
  }

  get name(): string {
    return this._metadata.name;
  }

  get icon(): string {
    return this._metadata.icon;
  }

  get description(): string {
    return this._metadata.description;
  }

  get capabilities(): AgentCapability[] {
    return this._metadata.capabilities;
  }

  get status(): AgentStatus {
    return this._status;
  }

  get currentTask(): AgentTask | null {
    return this._currentTask;
  }

  get stats(): AgentStats {
    return { ...this._stats };
  }

  get metadata(): AgentMetadata {
    return { ...this._metadata };
  }

  // Abstract methods to be implemented by subclasses
  protected abstract onInitialize(): Promise<void>;
  protected abstract onExecute(task: AgentTask): Promise<any>;
  protected abstract onPause(): void;
  protected abstract onResume(): void;
  protected abstract onCancel(): void;
}
