/**
 * Agent Types
 */

export const AgentStatus = {
  INITIALIZING: 'initializing',
  READY: 'ready',
  WORKING: 'working',
  QUEUED: 'queued',
  PAUSED: 'paused',
  ERROR: 'error',
  COMPLETED: 'completed'
} as const;

export type AgentStatus = (typeof AgentStatus)[keyof typeof AgentStatus];

export interface Agent {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: AgentStatus;
  capabilities: string[];
  stats: AgentStats;
  progress?: AgentProgress;
  currentTask?: string;
  lastActivity?: Date;
}

export interface AgentStats {
  tasksCompleted: number;
  totalDuration: number;
  avgDuration: number;
  errorRate: number;
  successRate: number;
}

export interface AgentProgress {
  taskId: string;
  percent: number;
  message: string;
  stage?: string;
  startedAt: Date;
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: number;
  input: any;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export const AGENTS: Record<string, Omit<Agent, 'status' | 'stats' | 'progress' | 'currentTask' | 'lastActivity'>> = {
  researcher: {
    id: 'researcher',
    name: 'Researcher',
    icon: '🔍',
    description: 'Web search, fact verification, source gathering',
    capabilities: ['web_search', 'fact_verification', 'source_gathering']
  },
  writer: {
    id: 'writer',
    name: 'Writer',
    icon: '✍️',
    description: 'Content generation, document creation',
    capabilities: ['document_generation', 'content_creation', 'editing']
  },
  analyst: {
    id: 'analyst',
    name: 'Analyst',
    icon: '📊',
    description: 'Data analysis, pattern detection, comparisons',
    capabilities: ['data_analysis', 'comparisons', 'insights', 'pattern_detection']
  },
  designer: {
    id: 'designer',
    name: 'Designer',
    icon: '🎨',
    description: 'Diagram generation, visual creation',
    capabilities: ['diagram_generation', 'visual_creation', 'flowcharts']
  },
  planner: {
    id: 'planner',
    name: 'Planner',
    icon: '📋',
    description: 'Task breakdown, dependency resolution',
    capabilities: ['task_breakdown', 'scheduling', 'dependency_resolution']
  },
  reviewer: {
    id: 'reviewer',
    name: 'Reviewer',
    icon: '👁️',
    description: 'Quality checks, truth validation',
    capabilities: ['quality_checks', 'truth_validation', 'accuracy_scoring']
  }
};
