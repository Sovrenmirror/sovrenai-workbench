/**
 * Workflow Engine
 * Execute complex multi-agent workflows with dependencies, branching, and error recovery
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentTask, AgentTaskResult, AgentCapability } from '../base/agent.js';
import { agentRegistry } from '../base/agent-registry.js';
import { parallelExecutor } from './parallel-executor.js';
import { messageBus } from '../communication/message-bus.js';

export enum WorkflowStepType {
  TASK = 'task',
  PARALLEL = 'parallel',
  CONDITIONAL = 'conditional',
  LOOP = 'loop'
}

export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  agentId?: string;
  requiredCapabilities?: AgentCapability[];
  input: any;
  dependsOn?: string[];
  retryOnFailure?: boolean;
  maxRetries?: number;
  timeout?: number;
  condition?: (context: WorkflowContext) => boolean | Promise<boolean>;
  onSuccess?: (result: any, context: WorkflowContext) => void;
  onFailure?: (error: Error, context: WorkflowContext) => void;
  // For parallel steps
  steps?: WorkflowStep[];
  // For conditional steps
  ifTrue?: WorkflowStep[];
  ifFalse?: WorkflowStep[];
  // For loop steps
  iterations?: number;
  loopCondition?: (context: WorkflowContext, iteration: number) => boolean;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  errorStrategy?: 'abort' | 'continue' | 'retry';
  maxRetries?: number;
  timeout?: number;
}

export interface WorkflowContext {
  workflowId: string;
  variables: Record<string, any>;
  results: Map<string, any>;
  errors: Map<string, Error>;
  metadata: {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    stepsCompleted: number;
    stepsFailed: number;
    retriesPerformed: number;
  };
}

export interface WorkflowExecution {
  workflow: WorkflowDefinition;
  context: WorkflowContext;
  status: WorkflowStatus;
  currentStep?: string;
}

export class WorkflowEngine extends EventEmitter {
  private activeWorkflows: Map<string, WorkflowExecution> = new Map();
  private workflowTemplates: Map<string, WorkflowDefinition> = new Map();

  constructor() {
    super();
    this.registerDefaultTemplates();
  }

  /**
   * Register a workflow template
   */
  registerTemplate(workflow: WorkflowDefinition): void {
    this.workflowTemplates.set(workflow.id, workflow);
    console.log(`[WorkflowEngine] Registered template: ${workflow.name} (${workflow.id})`);
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflow: WorkflowDefinition, initialVariables: Record<string, any> = {}): Promise<WorkflowContext> {
    const workflowId = uuidv4();

    const context: WorkflowContext = {
      workflowId,
      variables: { ...initialVariables },
      results: new Map(),
      errors: new Map(),
      metadata: {
        startTime: new Date(),
        stepsCompleted: 0,
        stepsFailed: 0,
        retriesPerformed: 0
      }
    };

    const execution: WorkflowExecution = {
      workflow,
      context,
      status: WorkflowStatus.RUNNING
    };

    this.activeWorkflows.set(workflowId, execution);

    console.log(`[WorkflowEngine] Starting workflow: ${workflow.name} (${workflowId})`);
    this.emit('workflow_started', { workflowId, workflow });

    try {
      // Execute steps
      await this.executeSteps(workflow.steps, context, workflow);

      // Mark as completed
      execution.status = WorkflowStatus.COMPLETED;
      context.metadata.endTime = new Date();
      context.metadata.duration = context.metadata.endTime.getTime() - context.metadata.startTime.getTime();

      console.log(`[WorkflowEngine] Workflow completed: ${workflow.name} (${context.metadata.duration}ms)`);
      this.emit('workflow_completed', { workflowId, context });

      return context;
    } catch (error: any) {
      execution.status = WorkflowStatus.FAILED;
      context.metadata.endTime = new Date();
      context.metadata.duration = context.metadata.endTime.getTime() - context.metadata.startTime.getTime();

      console.error(`[WorkflowEngine] Workflow failed: ${workflow.name}`, error);
      this.emit('workflow_failed', { workflowId, error, context });

      throw error;
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Execute a list of workflow steps
   */
  private async executeSteps(steps: WorkflowStep[], context: WorkflowContext, workflow: WorkflowDefinition): Promise<void> {
    // Build dependency graph
    const dependencyGraph = this.buildDependencyGraph(steps);

    // Execute steps in topological order
    const executedSteps = new Set<string>();

    while (executedSteps.size < steps.length) {
      // Find steps that can be executed (all dependencies met)
      const readySteps = steps.filter(step => {
        if (executedSteps.has(step.id)) return false;

        if (!step.dependsOn || step.dependsOn.length === 0) return true;

        return step.dependsOn.every(depId => executedSteps.has(depId));
      });

      if (readySteps.length === 0) {
        throw new Error('Workflow deadlock: No steps can be executed (circular dependency?)');
      }

      // Execute ready steps (can be parallel if multiple are ready)
      if (readySteps.length === 1) {
        await this.executeStep(readySteps[0], context, workflow);
        executedSteps.add(readySteps[0].id);
      } else {
        // Execute multiple ready steps in parallel
        await Promise.all(
          readySteps.map(async step => {
            await this.executeStep(step, context, workflow);
            executedSteps.add(step.id);
          })
        );
      }
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep, context: WorkflowContext, workflow: WorkflowDefinition): Promise<void> {
    console.log(`[WorkflowEngine] Executing step: ${step.id} (${step.type})`);
    this.emit('step_started', { workflowId: context.workflowId, stepId: step.id });

    try {
      switch (step.type) {
        case WorkflowStepType.TASK:
          await this.executeTaskStep(step, context);
          break;

        case WorkflowStepType.PARALLEL:
          await this.executeParallelStep(step, context, workflow);
          break;

        case WorkflowStepType.CONDITIONAL:
          await this.executeConditionalStep(step, context, workflow);
          break;

        case WorkflowStepType.LOOP:
          await this.executeLoopStep(step, context, workflow);
          break;

        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      context.metadata.stepsCompleted++;
      this.emit('step_completed', { workflowId: context.workflowId, stepId: step.id });

      // Call onSuccess callback if provided
      if (step.onSuccess) {
        const result = context.results.get(step.id);
        step.onSuccess(result, context);
      }
    } catch (error: any) {
      context.metadata.stepsFailed++;
      context.errors.set(step.id, error);

      console.error(`[WorkflowEngine] Step ${step.id} failed:`, error.message);
      this.emit('step_failed', { workflowId: context.workflowId, stepId: step.id, error });

      // Call onFailure callback if provided
      if (step.onFailure) {
        step.onFailure(error, context);
      }

      // Handle error based on strategy
      const errorStrategy = workflow.errorStrategy || 'abort';

      if (errorStrategy === 'abort') {
        throw error;
      } else if (errorStrategy === 'retry' && step.retryOnFailure) {
        const maxRetries = step.maxRetries || workflow.maxRetries || 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          console.log(`[WorkflowEngine] Retrying step ${step.id} (attempt ${attempt}/${maxRetries})`);
          context.metadata.retriesPerformed++;

          try {
            await this.executeStep(step, context, workflow);
            return; // Success, exit retry loop
          } catch (retryError: any) {
            if (attempt === maxRetries) {
              throw retryError;
            }
          }
        }
      } else if (errorStrategy === 'continue') {
        console.log(`[WorkflowEngine] Continuing despite error in step ${step.id}`);
        // Continue to next step
      }
    }
  }

  /**
   * Execute a task step
   */
  private async executeTaskStep(step: WorkflowStep, context: WorkflowContext): Promise<void> {
    // Select agent
    let agent: BaseAgent | undefined;

    if (step.agentId) {
      agent = agentRegistry.get(step.agentId);
    } else if (step.requiredCapabilities) {
      const agents = agentRegistry.findByCapabilities(step.requiredCapabilities);
      if (agents.length > 0) {
        agent = agents[0];
      }
    }

    if (!agent) {
      throw new Error(`No agent available for step ${step.id}`);
    }

    // Create task
    const task: AgentTask = {
      id: `${context.workflowId}_${step.id}`,
      type: step.input.type || 'task',
      input: step.input,
      priority: 1,
      createdAt: new Date()
    };

    // Execute with timeout
    const timeout = step.timeout || 300000;
    const result = await Promise.race([
      agent.execute(task),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Step ${step.id} timed out`)), timeout)
      )
    ]);

    // Store result
    context.results.set(step.id, result);
  }

  /**
   * Execute parallel steps
   */
  private async executeParallelStep(step: WorkflowStep, context: WorkflowContext, workflow: WorkflowDefinition): Promise<void> {
    if (!step.steps || step.steps.length === 0) {
      throw new Error(`Parallel step ${step.id} has no sub-steps`);
    }

    // Execute all sub-steps in parallel
    await Promise.all(
      step.steps.map(subStep => this.executeStep(subStep, context, workflow))
    );
  }

  /**
   * Execute conditional step
   */
  private async executeConditionalStep(step: WorkflowStep, context: WorkflowContext, workflow: WorkflowDefinition): Promise<void> {
    if (!step.condition) {
      throw new Error(`Conditional step ${step.id} has no condition`);
    }

    const conditionResult = await step.condition(context);

    if (conditionResult && step.ifTrue) {
      await this.executeSteps(step.ifTrue, context, workflow);
    } else if (!conditionResult && step.ifFalse) {
      await this.executeSteps(step.ifFalse, context, workflow);
    }
  }

  /**
   * Execute loop step
   */
  private async executeLoopStep(step: WorkflowStep, context: WorkflowContext, workflow: WorkflowDefinition): Promise<void> {
    if (!step.steps || step.steps.length === 0) {
      throw new Error(`Loop step ${step.id} has no sub-steps`);
    }

    const maxIterations = step.iterations || 10;

    for (let i = 0; i < maxIterations; i++) {
      // Check loop condition
      if (step.loopCondition && !step.loopCondition(context, i)) {
        break;
      }

      // Execute loop body
      await this.executeSteps(step.steps, context, workflow);
    }
  }

  /**
   * Build dependency graph
   */
  private buildDependencyGraph(steps: WorkflowStep[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const step of steps) {
      graph.set(step.id, step.dependsOn || []);
    }

    return graph;
  }

  /**
   * Register default workflow templates
   */
  private registerDefaultTemplates(): void {
    // Research → Analyze → Write workflow
    this.registerTemplate({
      id: 'research-analyze-write',
      name: 'Research, Analyze, and Write',
      description: 'Complete research workflow with analysis and document generation',
      steps: [
        {
          id: 'research',
          type: WorkflowStepType.TASK,
          agentId: 'researcher',
          input: {
            type: 'research',
            query: '{{query}}'
          }
        },
        {
          id: 'analyze',
          type: WorkflowStepType.TASK,
          agentId: 'analyst',
          input: {
            type: 'analyze',
            data: '{{research.sources}}'
          },
          dependsOn: ['research']
        },
        {
          id: 'write',
          type: WorkflowStepType.TASK,
          agentId: 'writer',
          input: {
            type: 'write',
            topic: '{{query}}',
            context: '{{analyze.insights}}'
          },
          dependsOn: ['analyze']
        }
      ]
    });

    // Parallel research workflow
    this.registerTemplate({
      id: 'parallel-research',
      name: 'Parallel Multi-Source Research',
      description: 'Research multiple topics in parallel and combine results',
      steps: [
        {
          id: 'parallel_research',
          type: WorkflowStepType.PARALLEL,
          input: {},
          steps: [
            {
              id: 'research_1',
              type: WorkflowStepType.TASK,
              agentId: 'researcher',
              input: {
                type: 'research',
                query: '{{query1}}'
              }
            },
            {
              id: 'research_2',
              type: WorkflowStepType.TASK,
              agentId: 'researcher',
              input: {
                type: 'research',
                query: '{{query2}}'
              }
            }
          ]
        },
        {
          id: 'combine',
          type: WorkflowStepType.TASK,
          agentId: 'analyst',
          input: {
            type: 'analyze',
            data: ['{{research_1.sources}}', '{{research_2.sources}}']
          },
          dependsOn: ['parallel_research']
        }
      ]
    });

    console.log(`[WorkflowEngine] Registered ${this.workflowTemplates.size} default templates`);
  }

  /**
   * Get workflow template
   */
  getTemplate(templateId: string): WorkflowDefinition | undefined {
    return this.workflowTemplates.get(templateId);
  }

  /**
   * List all templates
   */
  listTemplates(): WorkflowDefinition[] {
    return Array.from(this.workflowTemplates.values());
  }

  /**
   * Get active workflows
   */
  getActiveWorkflows(): WorkflowExecution[] {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * Get workflow statistics
   */
  getStats(): {
    activeWorkflows: number;
    templates: number;
  } {
    return {
      activeWorkflows: this.activeWorkflows.size,
      templates: this.workflowTemplates.size
    };
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine();
