/**
 * Workflow Types
 */

export interface Workflow {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  steps: WorkflowStep[];
  currentStep?: number;
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  taskType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input?: any;
  result?: any;
  error?: string;
  dependsOn?: string[];
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  steps: Omit<WorkflowStep, 'id' | 'status'>[];
}
