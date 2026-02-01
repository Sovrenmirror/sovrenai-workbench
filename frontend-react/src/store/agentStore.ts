/**
 * Agent Store
 * Manages state for all 6 agents
 */

import { create } from 'zustand';
import { AgentStatus, AGENTS, type Agent, type AgentStats, type AgentProgress } from '../types/agent';

interface AgentStore {
  agents: Record<string, Agent>;

  // Actions
  initializeAgents: () => void;
  updateAgentStatus: (agentId: string, status: AgentStatus) => void;
  updateAgentProgress: (agentId: string, progress: AgentProgress) => void;
  updateAgentStats: (agentId: string, stats: Partial<AgentStats>) => void;
  setCurrentTask: (agentId: string, taskId?: string) => void;
  clearAgentProgress: (agentId: string) => void;

  // Selectors
  getAgent: (agentId: string) => Agent | undefined;
  getAgentsByStatus: (status: AgentStatus) => Agent[];
  getWorkingAgents: () => Agent[];
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: {},

  initializeAgents: () => {
    const initialAgents: Record<string, Agent> = {};

    Object.entries(AGENTS).forEach(([id, agentData]) => {
      initialAgents[id] = {
        ...agentData,
        status: AgentStatus.INITIALIZING,
        stats: {
          tasksCompleted: 0,
          totalDuration: 0,
          avgDuration: 0,
          errorRate: 0,
          successRate: 100
        },
        lastActivity: new Date()
      };
    });

    set({ agents: initialAgents });
  },

  updateAgentStatus: (agentId: string, status: AgentStatus) => {
    set((state) => ({
      agents: {
        ...state.agents,
        [agentId]: {
          ...state.agents[agentId],
          status,
          lastActivity: new Date()
        }
      }
    }));
  },

  updateAgentProgress: (agentId: string, progress: AgentProgress) => {
    set((state) => ({
      agents: {
        ...state.agents,
        [agentId]: {
          ...state.agents[agentId],
          progress,
          status: AgentStatus.WORKING,
          lastActivity: new Date()
        }
      }
    }));
  },

  updateAgentStats: (agentId: string, statsUpdate: Partial<AgentStats>) => {
    set((state) => {
      const currentStats = state.agents[agentId]?.stats || {
        tasksCompleted: 0,
        totalDuration: 0,
        avgDuration: 0,
        errorRate: 0,
        successRate: 100
      };

      return {
        agents: {
          ...state.agents,
          [agentId]: {
            ...state.agents[agentId],
            stats: {
              ...currentStats,
              ...statsUpdate
            }
          }
        }
      };
    });
  },

  setCurrentTask: (agentId: string, taskId?: string) => {
    set((state) => ({
      agents: {
        ...state.agents,
        [agentId]: {
          ...state.agents[agentId],
          currentTask: taskId,
          lastActivity: new Date()
        }
      }
    }));
  },

  clearAgentProgress: (agentId: string) => {
    set((state) => ({
      agents: {
        ...state.agents,
        [agentId]: {
          ...state.agents[agentId],
          progress: undefined
        }
      }
    }));
  },

  getAgent: (agentId: string) => {
    return get().agents[agentId];
  },

  getAgentsByStatus: (status: AgentStatus) => {
    return Object.values(get().agents).filter(agent => agent.status === status);
  },

  getWorkingAgents: () => {
    return Object.values(get().agents).filter(agent =>
      agent.status === AgentStatus.WORKING || agent.status === AgentStatus.QUEUED
    );
  }
}));
