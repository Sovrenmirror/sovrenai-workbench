/**
 * Progress Tracker Service
 * Tracks progress of long-running agent tasks with time estimation
 */

import { EventEmitter } from 'events';

export interface TaskProgress {
  taskId: string;
  conversationId: string;
  agent: string;
  totalSteps: number;
  completedSteps: number;
  currentStep: string;
  startedAt: Date;
  estimatedCompletion?: Date;
  progressPercent: number;
}

class ProgressTracker extends EventEmitter {
  private tasks: Map<string, TaskProgress> = new Map();
  private progressListeners: Map<string, ((progress: TaskProgress) => void)[]> = new Map();

  /**
   * Start tracking a new task
   */
  startTask(params: {
    taskId: string;
    conversationId: string;
    agent: string;
    totalSteps: number;
    currentStep: string;
  }): TaskProgress {
    const task: TaskProgress = {
      ...params,
      completedSteps: 0,
      startedAt: new Date(),
      progressPercent: 0
    };

    this.tasks.set(params.taskId, task);
    this.notifyListeners(params.conversationId, task);
    this.emit('task_started', task);

    console.log(`[ProgressTracker] Started task ${params.taskId} for agent ${params.agent}`);

    return task;
  }

  /**
   * Update task progress
   */
  updateProgress(taskId: string, params: {
    completedSteps?: number;
    currentStep?: string;
    estimatedCompletion?: Date;
  }): TaskProgress | null {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`[ProgressTracker] Task not found: ${taskId}`);
      return null;
    }

    // Update fields
    if (params.completedSteps !== undefined) {
      task.completedSteps = params.completedSteps;
    }

    if (params.currentStep !== undefined) {
      task.currentStep = params.currentStep;
    }

    if (params.estimatedCompletion !== undefined) {
      task.estimatedCompletion = params.estimatedCompletion;
    }

    // Recalculate progress percentage
    task.progressPercent = this.calculateProgress(task);

    // Auto-estimate completion if not provided
    if (!task.estimatedCompletion && task.completedSteps > 0) {
      task.estimatedCompletion = this.estimateCompletion(taskId);
    }

    this.notifyListeners(task.conversationId, task);
    this.emit('progress_updated', task);

    return task;
  }

  /**
   * Increment progress by one step
   */
  incrementProgress(taskId: string, newStep?: string): TaskProgress | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    task.completedSteps = Math.min(task.completedSteps + 1, task.totalSteps);

    if (newStep) {
      task.currentStep = newStep;
    }

    // Recalculate progress and estimation
    task.progressPercent = this.calculateProgress(task);
    task.estimatedCompletion = this.estimateCompletion(taskId);

    this.notifyListeners(task.conversationId, task);
    this.emit('progress_updated', task);

    console.log(`[ProgressTracker] Task ${taskId} progress: ${task.progressPercent}% (${task.completedSteps}/${task.totalSteps})`);

    return task;
  }

  /**
   * Complete a task
   */
  completeTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.completedSteps = task.totalSteps;
    task.progressPercent = 100;
    task.estimatedCompletion = new Date();

    this.notifyListeners(task.conversationId, task);
    this.emit('task_completed', task);

    console.log(`[ProgressTracker] Task ${taskId} completed`);

    // Remove from active tasks after a short delay
    setTimeout(() => {
      this.tasks.delete(taskId);
    }, 5000);
  }

  /**
   * Fail a task
   */
  failTask(taskId: string, error: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    this.emit('task_failed', { task, error });

    console.error(`[ProgressTracker] Task ${taskId} failed: ${error}`);

    // Remove from active tasks
    this.tasks.delete(taskId);
  }

  /**
   * Get current progress percentage
   */
  getProgress(taskId: string): number {
    const task = this.tasks.get(taskId);
    return task ? task.progressPercent : 0;
  }

  /**
   * Get task details
   */
  getTask(taskId: string): TaskProgress | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Get all active tasks for a conversation
   */
  getTasksByConversation(conversationId: string): TaskProgress[] {
    const tasks: TaskProgress[] = [];

    this.tasks.forEach(task => {
      if (task.conversationId === conversationId) {
        tasks.push(task);
      }
    });

    return tasks;
  }

  /**
   * Subscribe to progress updates for a conversation
   */
  subscribe(conversationId: string, callback: (progress: TaskProgress) => void): () => void {
    const listeners = this.progressListeners.get(conversationId) || [];
    listeners.push(callback);
    this.progressListeners.set(conversationId, listeners);

    // Return unsubscribe function
    return () => {
      const current = this.progressListeners.get(conversationId) || [];
      this.progressListeners.set(conversationId, current.filter(l => l !== callback));
    };
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgress(task: TaskProgress): number {
    if (task.totalSteps === 0) return 0;
    return Math.round((task.completedSteps / task.totalSteps) * 100);
  }

  /**
   * Estimate completion time based on current progress
   */
  estimateCompletion(taskId: string): Date | undefined {
    const task = this.tasks.get(taskId);
    if (!task || task.completedSteps === 0) return undefined;

    const elapsed = Date.now() - task.startedAt.getTime();
    const avgTimePerStep = elapsed / task.completedSteps;
    const remainingSteps = task.totalSteps - task.completedSteps;
    const estimatedRemaining = avgTimePerStep * remainingSteps;

    return new Date(Date.now() + estimatedRemaining);
  }

  /**
   * Notify all listeners for a conversation
   */
  private notifyListeners(conversationId: string, task: TaskProgress): void {
    const listeners = this.progressListeners.get(conversationId) || [];
    listeners.forEach(callback => {
      try {
        callback(task);
      } catch (error) {
        console.error('[ProgressTracker] Listener error:', error);
      }
    });
  }

  /**
   * Get statistics
   */
  getStats(): {
    activeTasks: number;
    totalListeners: number;
    tasksByAgent: Record<string, number>;
  } {
    const tasksByAgent: Record<string, number> = {};

    this.tasks.forEach(task => {
      tasksByAgent[task.agent] = (tasksByAgent[task.agent] || 0) + 1;
    });

    let totalListeners = 0;
    this.progressListeners.forEach(listeners => {
      totalListeners += listeners.length;
    });

    return {
      activeTasks: this.tasks.size,
      totalListeners,
      tasksByAgent
    };
  }

  /**
   * Clear all tasks and listeners
   */
  clear(): void {
    this.tasks.clear();
    this.progressListeners.clear();
    console.log('[ProgressTracker] Cleared all tasks and listeners');
  }
}

// Export singleton instance
export const progressTracker = new ProgressTracker();
