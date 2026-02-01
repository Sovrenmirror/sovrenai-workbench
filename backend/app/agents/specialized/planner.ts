/**
 * Planner Agent
 * Specialized agent for task decomposition, scheduling, and dependency resolution
 */

import { BaseAgent, AgentTask, AgentMetadata, AgentCapability } from '../base/agent.js';

export interface PlannerTaskInput {
  project: string;
  description?: string;
  constraints?: {
    deadline?: string;
    budget?: number;
    resources?: string[];
  };
  complexity?: 'simple' | 'medium' | 'complex';
  preferences?: {
    agile?: boolean;
    waterfall?: boolean;
    parallelization?: boolean;
  };
}

export interface TaskNode {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  assignedAgent?: string;
  requiredCapabilities?: AgentCapability[];
  phase?: string;
}

export interface TaskPhase {
  id: string;
  name: string;
  description: string;
  tasks: string[];
  estimatedDuration: number;
}

export interface PlannerTaskOutput {
  project: string;
  summary: string;
  phases: TaskPhase[];
  tasks: TaskNode[];
  dependencyGraph: {
    nodes: Array<{ id: string; label: string }>;
    edges: Array<{ from: string; to: string; label?: string }>;
  };
  timeline: {
    totalHours: number;
    totalDays: number;
    criticalPath: string[];
    parallelizable: boolean;
  };
  resourceAllocation: {
    agentsNeeded: string[];
    capabilitiesRequired: AgentCapability[];
  };
  risks: Array<{
    description: string;
    severity: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  metadata: {
    complexity: string;
    tasksCreated: number;
    phasesCreated: number;
    planningTime: number;
  };
}

export class PlannerAgent extends BaseAgent {
  constructor() {
    const metadata: AgentMetadata = {
      id: 'planner',
      name: 'Planner',
      icon: '📋',
      description: 'Task decomposition, scheduling, and dependency resolution specialist',
      capabilities: ['task_breakdown', 'scheduling', 'dependency_resolution'],
      version: '1.0.0'
    };

    super(metadata);
  }

  protected async onInitialize(): Promise<void> {
    console.log('[PlannerAgent] Initializing...');
    console.log('[PlannerAgent] Initialization complete');
  }

  protected async onExecute(task: AgentTask): Promise<PlannerTaskOutput> {
    const input = task.input as PlannerTaskInput;

    if (!input.project) {
      throw new Error('Project description is required for planning task');
    }

    console.log(`[PlannerAgent] Starting planning for project: "${input.project}"`);

    // Emit initial progress
    this.emitProgress(0, 'Starting project planning...', 'initialization');

    const startTime = Date.now();

    try {
      // Phase 1: Analyze project (15%)
      this.checkCancel();
      this.emitProgress(15, 'Analyzing project requirements...', 'analysis');

      const complexity = input.complexity || this.determineComplexity(input);

      // Phase 2: Break down into tasks (35%)
      this.checkCancel();
      this.emitProgress(35, 'Breaking down into tasks...', 'decomposition');

      const tasks = this.decomposeIntoTasks(input, complexity);

      // Phase 3: Identify dependencies (55%)
      this.checkCancel();
      this.emitProgress(55, 'Identifying dependencies...', 'dependency_analysis');

      const tasksWithDeps = this.identifyDependencies(tasks);

      // Phase 4: Organize into phases (70%)
      this.checkCancel();
      this.emitProgress(70, 'Organizing into phases...', 'phase_organization');

      const phases = this.organizeIntoPhases(tasksWithDeps);

      // Phase 5: Calculate timeline (85%)
      this.checkCancel();
      this.emitProgress(85, 'Calculating timeline...', 'timeline_calculation');

      const timeline = this.calculateTimeline(tasksWithDeps);

      // Phase 6: Identify risks and resources (95%)
      this.checkCancel();
      this.emitProgress(95, 'Identifying risks and resources...', 'risk_analysis');

      const risks = this.identifyRisks(input, tasksWithDeps, complexity);
      const resourceAllocation = this.allocateResources(tasksWithDeps);

      // Phase 7: Generate dependency graph (100%)
      this.checkCancel();
      this.emitProgress(100, 'Finalizing plan...', 'finalization');

      const dependencyGraph = this.generateDependencyGraph(tasksWithDeps);

      const planningTime = Date.now() - startTime;

      const output: PlannerTaskOutput = {
        project: input.project,
        summary: this.generateSummary(input, tasksWithDeps, phases),
        phases,
        tasks: tasksWithDeps,
        dependencyGraph,
        timeline,
        resourceAllocation,
        risks,
        metadata: {
          complexity,
          tasksCreated: tasksWithDeps.length,
          phasesCreated: phases.length,
          planningTime
        }
      };

      console.log(
        `[PlannerAgent] Planning complete. Created ${output.tasks.length} tasks in ${output.phases.length} phases (${planningTime}ms)`
      );

      return output;
    } catch (error) {
      console.error('[PlannerAgent] Planning failed:', error);
      throw error;
    }
  }

  protected onPause(): void {
    console.log('[PlannerAgent] Paused');
  }

  protected onResume(): void {
    console.log('[PlannerAgent] Resumed');
  }

  protected onCancel(): void {
    console.log('[PlannerAgent] Cancelled');
  }

  /**
   * Determine project complexity
   */
  private determineComplexity(input: PlannerTaskInput): 'simple' | 'medium' | 'complex' {
    const descLength = (input.description || '').length;
    const hasConstraints = !!input.constraints;
    const hasMultipleResources = (input.constraints?.resources || []).length > 2;

    if (descLength > 500 || hasMultipleResources) {
      return 'complex';
    } else if (descLength > 200 || hasConstraints) {
      return 'medium';
    } else {
      return 'simple';
    }
  }

  /**
   * Decompose project into tasks
   */
  private decomposeIntoTasks(input: PlannerTaskInput, complexity: string): TaskNode[] {
    const tasks: TaskNode[] = [];

    // Task count based on complexity
    const taskCount = complexity === 'simple' ? 5 : complexity === 'medium' ? 10 : 15;

    // Generate tasks based on common project patterns
    const taskTemplates = this.getTaskTemplates(input.project);

    for (let i = 0; i < Math.min(taskCount, taskTemplates.length); i++) {
      const template = taskTemplates[i];
      tasks.push({
        id: `task_${i + 1}`,
        title: template.title,
        description: template.description,
        estimatedHours: template.estimatedHours,
        priority: template.priority,
        dependencies: [],
        assignedAgent: template.assignedAgent,
        requiredCapabilities: template.requiredCapabilities,
        phase: template.phase
      });
    }

    return tasks;
  }

  /**
   * Get task templates based on project type
   */
  private getTaskTemplates(project: string): Array<{
    title: string;
    description: string;
    estimatedHours: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignedAgent?: string;
    requiredCapabilities?: AgentCapability[];
    phase: string;
  }> {
    // Generic templates that can apply to most projects
    return [
      {
        title: 'Research and discovery',
        description: 'Gather requirements and research existing solutions',
        estimatedHours: 8,
        priority: 'critical',
        assignedAgent: 'researcher',
        requiredCapabilities: ['web_search', 'fact_verification'],
        phase: 'Planning'
      },
      {
        title: 'Requirements analysis',
        description: 'Analyze and document project requirements',
        estimatedHours: 6,
        priority: 'high',
        assignedAgent: 'analyst',
        requiredCapabilities: ['data_analysis', 'insights'],
        phase: 'Planning'
      },
      {
        title: 'Design architecture',
        description: 'Create system architecture and design documents',
        estimatedHours: 12,
        priority: 'high',
        assignedAgent: 'designer',
        requiredCapabilities: ['diagram_generation', 'flowcharts'],
        phase: 'Design'
      },
      {
        title: 'Create implementation plan',
        description: 'Break down implementation into detailed tasks',
        estimatedHours: 4,
        priority: 'high',
        phase: 'Planning'
      },
      {
        title: 'Core functionality development',
        description: 'Implement core features and functionality',
        estimatedHours: 40,
        priority: 'critical',
        phase: 'Implementation'
      },
      {
        title: 'Write documentation',
        description: 'Create user and developer documentation',
        estimatedHours: 16,
        priority: 'medium',
        assignedAgent: 'writer',
        requiredCapabilities: ['document_generation', 'content_creation'],
        phase: 'Documentation'
      },
      {
        title: 'Testing and QA',
        description: 'Test all functionality and fix bugs',
        estimatedHours: 24,
        priority: 'high',
        assignedAgent: 'reviewer',
        requiredCapabilities: ['quality_checks', 'accuracy_scoring'],
        phase: 'Testing'
      },
      {
        title: 'Code review',
        description: 'Review code quality and best practices',
        estimatedHours: 8,
        priority: 'medium',
        assignedAgent: 'reviewer',
        requiredCapabilities: ['quality_checks'],
        phase: 'Testing'
      },
      {
        title: 'Performance optimization',
        description: 'Optimize performance and resource usage',
        estimatedHours: 12,
        priority: 'medium',
        phase: 'Optimization'
      },
      {
        title: 'Security review',
        description: 'Review security vulnerabilities and fixes',
        estimatedHours: 8,
        priority: 'high',
        phase: 'Testing'
      },
      {
        title: 'Deployment preparation',
        description: 'Prepare deployment scripts and configuration',
        estimatedHours: 6,
        priority: 'medium',
        phase: 'Deployment'
      },
      {
        title: 'User acceptance testing',
        description: 'Conduct UAT with stakeholders',
        estimatedHours: 10,
        priority: 'medium',
        phase: 'Testing'
      },
      {
        title: 'Deploy to production',
        description: 'Deploy and verify in production environment',
        estimatedHours: 4,
        priority: 'critical',
        phase: 'Deployment'
      },
      {
        title: 'Post-launch monitoring',
        description: 'Monitor system and address issues',
        estimatedHours: 8,
        priority: 'high',
        phase: 'Maintenance'
      },
      {
        title: 'Final documentation update',
        description: 'Update docs with post-launch changes',
        estimatedHours: 4,
        priority: 'low',
        assignedAgent: 'writer',
        requiredCapabilities: ['document_generation'],
        phase: 'Documentation'
      }
    ];
  }

  /**
   * Identify task dependencies
   */
  private identifyDependencies(tasks: TaskNode[]): TaskNode[] {
    // Define dependency rules based on common patterns
    const dependencyRules: Record<string, string[]> = {
      'Requirements analysis': ['Research and discovery'],
      'Design architecture': ['Requirements analysis'],
      'Create implementation plan': ['Design architecture'],
      'Core functionality development': ['Create implementation plan'],
      'Write documentation': ['Core functionality development'],
      'Testing and QA': ['Core functionality development'],
      'Code review': ['Core functionality development'],
      'Performance optimization': ['Testing and QA'],
      'Security review': ['Code review'],
      'Deployment preparation': ['Testing and QA', 'Security review'],
      'User acceptance testing': ['Testing and QA'],
      'Deploy to production': ['Deployment preparation', 'User acceptance testing'],
      'Post-launch monitoring': ['Deploy to production'],
      'Final documentation update': ['Post-launch monitoring']
    };

    return tasks.map(task => {
      const dependencyTitles = dependencyRules[task.title] || [];
      const dependencies = tasks
        .filter(t => dependencyTitles.includes(t.title))
        .map(t => t.id);

      return {
        ...task,
        dependencies
      };
    });
  }

  /**
   * Organize tasks into phases
   */
  private organizeIntoPhases(tasks: TaskNode[]): TaskPhase[] {
    const phaseMap: Map<string, TaskNode[]> = new Map();

    // Group tasks by phase
    for (const task of tasks) {
      const phase = task.phase || 'Other';
      if (!phaseMap.has(phase)) {
        phaseMap.set(phase, []);
      }
      phaseMap.get(phase)!.push(task);
    }

    // Convert to phase objects
    const phases: TaskPhase[] = [];
    let phaseOrder = ['Planning', 'Design', 'Implementation', 'Testing', 'Documentation', 'Optimization', 'Deployment', 'Maintenance'];

    for (const phaseName of phaseOrder) {
      const phaseTasks = phaseMap.get(phaseName);
      if (phaseTasks && phaseTasks.length > 0) {
        const estimatedDuration = phaseTasks.reduce((sum, t) => sum + t.estimatedHours, 0);

        phases.push({
          id: `phase_${phases.length + 1}`,
          name: phaseName,
          description: `${phaseName} phase with ${phaseTasks.length} tasks`,
          tasks: phaseTasks.map(t => t.id),
          estimatedDuration
        });
      }
    }

    return phases;
  }

  /**
   * Calculate timeline
   */
  private calculateTimeline(tasks: TaskNode[]): {
    totalHours: number;
    totalDays: number;
    criticalPath: string[];
    parallelizable: boolean;
  } {
    const totalHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
    const totalDays = Math.ceil(totalHours / 8); // 8 hours per day

    // Find critical path (simplified - tasks with critical priority and dependencies)
    const criticalPath = tasks
      .filter(t => t.priority === 'critical')
      .map(t => t.id);

    // Check if any tasks can be parallelized (no dependencies)
    const parallelizable = tasks.some(t => t.dependencies.length === 0 && tasks.length > 1);

    return {
      totalHours,
      totalDays,
      criticalPath,
      parallelizable
    };
  }

  /**
   * Identify project risks
   */
  private identifyRisks(
    input: PlannerTaskInput,
    tasks: TaskNode[],
    complexity: string
  ): Array<{ description: string; severity: 'low' | 'medium' | 'high'; mitigation: string }> {
    const risks = [];

    // Complexity risk
    if (complexity === 'complex') {
      risks.push({
        description: 'High project complexity may lead to scope creep',
        severity: 'high' as const,
        mitigation: 'Regular milestone reviews and strict change control'
      });
    }

    // Deadline risk
    if (input.constraints?.deadline) {
      risks.push({
        description: 'Fixed deadline may pressure quality',
        severity: 'medium' as const,
        mitigation: 'Prioritize features and implement MVP first'
      });
    }

    // Dependency risk
    const avgDependencies = tasks.reduce((sum, t) => sum + t.dependencies.length, 0) / tasks.length;
    if (avgDependencies > 2) {
      risks.push({
        description: 'High task interdependencies may cause delays',
        severity: 'medium' as const,
        mitigation: 'Early identification of blockers and parallel workstreams'
      });
    }

    // Resource risk
    if (input.constraints?.resources && input.constraints.resources.length < 3) {
      risks.push({
        description: 'Limited resources may extend timeline',
        severity: 'medium' as const,
        mitigation: 'Consider outsourcing or prioritizing critical tasks'
      });
    }

    return risks;
  }

  /**
   * Allocate resources
   */
  private allocateResources(tasks: TaskNode[]): {
    agentsNeeded: string[];
    capabilitiesRequired: AgentCapability[];
  } {
    const agentsSet = new Set<string>();
    const capabilitiesSet = new Set<AgentCapability>();

    for (const task of tasks) {
      if (task.assignedAgent) {
        agentsSet.add(task.assignedAgent);
      }
      if (task.requiredCapabilities) {
        task.requiredCapabilities.forEach(cap => capabilitiesSet.add(cap));
      }
    }

    return {
      agentsNeeded: Array.from(agentsSet),
      capabilitiesRequired: Array.from(capabilitiesSet)
    };
  }

  /**
   * Generate dependency graph
   */
  private generateDependencyGraph(tasks: TaskNode[]): {
    nodes: Array<{ id: string; label: string }>;
    edges: Array<{ from: string; to: string; label?: string }>;
  } {
    const nodes = tasks.map(task => ({
      id: task.id,
      label: task.title
    }));

    const edges: Array<{ from: string; to: string; label?: string }> = [];
    for (const task of tasks) {
      for (const depId of task.dependencies) {
        edges.push({
          from: depId,
          to: task.id,
          label: 'blocks'
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * Generate project summary
   */
  private generateSummary(input: PlannerTaskInput, tasks: TaskNode[], phases: TaskPhase[]): string {
    const totalHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const criticalTasks = tasks.filter(t => t.priority === 'critical').length;

    return `Project "${input.project}" breakdown: ${tasks.length} tasks across ${phases.length} phases, estimated ${totalHours} hours (${Math.ceil(totalHours / 8)} days). ${criticalTasks} critical tasks identified.`;
  }
}
