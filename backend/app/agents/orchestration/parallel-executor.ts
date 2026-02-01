/**
 * Parallel Executor
 * Executes multiple agent tasks concurrently with resource pooling and error isolation
 */

import { EventEmitter } from 'events';
import { BaseAgent, AgentTask, AgentTaskResult } from '../base/agent.js';
import { agentRegistry } from '../base/agent-registry.js';

export interface ParallelExecutionOptions {
  maxConcurrent?: number;
  timeout?: number;
  failFast?: boolean;
  retryFailedTasks?: boolean;
  maxRetries?: number;
}

export interface ParallelExecutionResult {
  successful: AgentTaskResult[];
  failed: Array<{
    task: AgentTask;
    agentId: string;
    error: Error;
  }>;
  duration: number;
  metadata: {
    totalTasks: number;
    successfulCount: number;
    failedCount: number;
    retriedCount: number;
    maxConcurrency: number;
  };
}

export class ParallelExecutor extends EventEmitter {
  private maxConcurrent: number;
  private activeExecutions: number = 0;
  private circuitBreakerThreshold: number = 0.5; // 50% failure rate triggers circuit breaker

  constructor(maxConcurrent: number = 10) {
    super();
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Execute multiple tasks in parallel with resource pooling
   */
  async executeParallel(
    tasks: Array<{ agentId: string; task: AgentTask }>,
    options: ParallelExecutionOptions = {}
  ): Promise<ParallelExecutionResult> {
    const startTime = Date.now();
    const maxConcurrent = options.maxConcurrent || this.maxConcurrent;
    const timeout = options.timeout || 300000; // 5 minutes default
    const failFast = options.failFast !== false;
    const retryFailedTasks = options.retryFailedTasks || false;
    const maxRetries = options.maxRetries || 3;

    console.log(`[ParallelExecutor] Starting execution of ${tasks.length} tasks (max concurrent: ${maxConcurrent})`);

    const successful: AgentTaskResult[] = [];
    const failed: Array<{ task: AgentTask; agentId: string; error: Error }> = [];
    let retriedCount = 0;

    // Create execution promises with resource pooling
    const executionPromises: Promise<void>[] = [];
    const taskQueue = [...tasks];
    let shouldStop = false;

    // Worker function that processes tasks from queue
    const worker = async () => {
      while (taskQueue.length > 0 && !shouldStop) {
        const item = taskQueue.shift();
        if (!item) break;

        const { agentId, task } = item;

        this.activeExecutions++;
        this.emit('execution_started', { taskId: task.id, agentId, activeExecutions: this.activeExecutions });

        try {
          // Get agent
          const agent = agentRegistry.get(agentId);
          if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
          }

          // Execute with timeout
          const result = await this.executeWithTimeout(agent, task, timeout);

          successful.push(result);
          this.emit('task_completed', { taskId: task.id, agentId, result });

          console.log(`[ParallelExecutor] Task ${task.id} completed successfully by ${agentId}`);
        } catch (error: any) {
          console.error(`[ParallelExecutor] Task ${task.id} failed:`, error.message);

          // Check if we should retry
          if (retryFailedTasks && !error.message.includes('timeout')) {
            let retrySuccess = false;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              console.log(`[ParallelExecutor] Retrying task ${task.id} (attempt ${attempt}/${maxRetries})`);
              retriedCount++;

              try {
                const agent = agentRegistry.get(agentId);
                if (!agent) throw new Error(`Agent ${agentId} not found`);

                const result = await this.executeWithTimeout(agent, task, timeout);
                successful.push(result);
                retrySuccess = true;
                this.emit('task_retry_success', { taskId: task.id, agentId, attempt });
                break;
              } catch (retryError: any) {
                if (attempt === maxRetries) {
                  console.error(`[ParallelExecutor] Task ${task.id} failed after ${maxRetries} retries`);
                }
              }
            }

            if (!retrySuccess) {
              failed.push({ task, agentId, error });
              this.emit('task_failed', { taskId: task.id, agentId, error });
            }
          } else {
            failed.push({ task, agentId, error });
            this.emit('task_failed', { taskId: task.id, agentId, error });
          }

          // Fail fast if enabled
          if (failFast && failed.length > 0) {
            console.log('[ParallelExecutor] Fail-fast enabled, stopping execution');
            shouldStop = true;
          }

          // Circuit breaker check
          const totalCompleted = successful.length + failed.length;
          if (totalCompleted > 5) {
            const failureRate = failed.length / totalCompleted;
            if (failureRate > this.circuitBreakerThreshold) {
              console.error(
                `[ParallelExecutor] Circuit breaker triggered! Failure rate: ${(failureRate * 100).toFixed(1)}%`
              );
              shouldStop = true;
              this.emit('circuit_breaker_triggered', { failureRate, totalCompleted });
            }
          }
        } finally {
          this.activeExecutions--;
          this.emit('execution_finished', { taskId: task.id, agentId, activeExecutions: this.activeExecutions });
        }
      }
    };

    // Create worker pool
    const numWorkers = Math.min(maxConcurrent, tasks.length);
    for (let i = 0; i < numWorkers; i++) {
      executionPromises.push(worker());
    }

    // Wait for all workers to complete
    await Promise.all(executionPromises);

    const duration = Date.now() - startTime;

    const result: ParallelExecutionResult = {
      successful,
      failed,
      duration,
      metadata: {
        totalTasks: tasks.length,
        successfulCount: successful.length,
        failedCount: failed.length,
        retriedCount,
        maxConcurrency: maxConcurrent
      }
    };

    console.log(
      `[ParallelExecutor] Execution complete: ${successful.length} successful, ${failed.length} failed, ${duration}ms`
    );

    this.emit('parallel_execution_complete', result);

    return result;
  }

  /**
   * Execute task with timeout
   */
  private async executeWithTimeout(
    agent: BaseAgent,
    task: AgentTask,
    timeout: number
  ): Promise<AgentTaskResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Task ${task.id} timed out after ${timeout}ms`));
      }, timeout);

      agent
        .execute(task)
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Get current active executions
   */
  getActiveExecutions(): number {
    return this.activeExecutions;
  }

  /**
   * Update max concurrent setting
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = max;
    console.log(`[ParallelExecutor] Max concurrent updated to ${max}`);
  }

  /**
   * Update circuit breaker threshold
   */
  setCircuitBreakerThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Circuit breaker threshold must be between 0 and 1');
    }
    this.circuitBreakerThreshold = threshold;
    console.log(`[ParallelExecutor] Circuit breaker threshold updated to ${threshold}`);
  }
}

// Export singleton instance
export const parallelExecutor = new ParallelExecutor(
  parseInt(process.env.MAX_CONCURRENT_AGENTS || '10')
);
