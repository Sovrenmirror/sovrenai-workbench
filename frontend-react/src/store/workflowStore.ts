/**
 * Workflow Store
 * Manages workflow and task state
 */

import { create } from 'zustand';
import type { Workflow, WorkflowStep } from '../types/workflow';
import type { AgentTask } from '../types/agent';

interface WorkflowStore {
  workflows: Record<string, Workflow>;
  tasks: Record<string, AgentTask>;
  activeWorkflow?: string;

  // Actions
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (workflowId: string, update: Partial<Workflow>) => void;
  updateWorkflowStep: (workflowId: string, stepId: string, update: Partial<WorkflowStep>) => void;
  setActiveWorkflow: (workflowId?: string) => void;
  addTask: (task: AgentTask) => void;
  updateTask: (taskId: string, update: Partial<AgentTask>) => void;
  clearWorkflows: () => void;

  // Selectors
  getWorkflow: (workflowId: string) => Workflow | undefined;
  getActiveWorkflow: () => Workflow | undefined;
  getTask: (taskId: string) => AgentTask | undefined;
  getTasksByAgent: (agentId: string) => AgentTask[];
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: {},
  tasks: {},
  activeWorkflow: undefined,

  addWorkflow: (workflow) => {
    set((state) => ({
      workflows: {
        ...state.workflows,
        [workflow.id]: workflow
      }
    }));
  },

  updateWorkflow: (workflowId, update) => {
    set((state) => {
      const workflow = state.workflows[workflowId];
      if (!workflow) return state;

      return {
        workflows: {
          ...state.workflows,
          [workflowId]: {
            ...workflow,
            ...update
          }
        }
      };
    });
  },

  updateWorkflowStep: (workflowId, stepId, update) => {
    set((state) => {
      const workflow = state.workflows[workflowId];
      if (!workflow) return state;

      const updatedSteps = workflow.steps.map(step =>
        step.id === stepId ? { ...step, ...update } : step
      );

      return {
        workflows: {
          ...state.workflows,
          [workflowId]: {
            ...workflow,
            steps: updatedSteps
          }
        }
      };
    });
  },

  setActiveWorkflow: (workflowId) => {
    set({ activeWorkflow: workflowId });
  },

  addTask: (task) => {
    set((state) => ({
      tasks: {
        ...state.tasks,
        [task.id]: task
      }
    }));
  },

  updateTask: (taskId, update) => {
    set((state) => {
      const task = state.tasks[taskId];
      if (!task) return state;

      return {
        tasks: {
          ...state.tasks,
          [taskId]: {
            ...task,
            ...update
          }
        }
      };
    });
  },

  clearWorkflows: () => {
    set({ workflows: {}, activeWorkflow: undefined });
  },

  getWorkflow: (workflowId) => {
    return get().workflows[workflowId];
  },

  getActiveWorkflow: () => {
    const { workflows, activeWorkflow } = get();
    return activeWorkflow ? workflows[activeWorkflow] : undefined;
  },

  getTask: (taskId) => {
    return get().tasks[taskId];
  },

  getTasksByAgent: (agentId) => {
    return Object.values(get().tasks).filter(task => task.agentId === agentId);
  }
}));
