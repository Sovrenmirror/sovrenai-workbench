/**
 * Agent Registry
 * Central registry for all agents in the system
 */

import { BaseAgent, AgentCapability, AgentMetadata, AgentStatus } from './agent.js';

export interface AgentHealthCheck {
  agentId: string;
  status: AgentStatus;
  healthy: boolean;
  lastCheck: Date;
  message?: string;
}

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, BaseAgent> = new Map();
  private capabilityIndex: Map<AgentCapability, Set<string>> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Register an agent
   */
  register(agent: BaseAgent): void {
    const agentId = agent.id;

    if (this.agents.has(agentId)) {
      throw new Error(`Agent with ID ${agentId} is already registered`);
    }

    // Register agent
    this.agents.set(agentId, agent);

    // Index capabilities
    for (const capability of agent.capabilities) {
      if (!this.capabilityIndex.has(capability)) {
        this.capabilityIndex.set(capability, new Set());
      }
      this.capabilityIndex.get(capability)!.add(agentId);
    }

    console.log(`[AgentRegistry] Registered agent: ${agent.name} (${agentId})`);
  }

  /**
   * Unregister an agent
   */
  unregister(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Remove from capability index
    for (const capability of agent.capabilities) {
      const agentSet = this.capabilityIndex.get(capability);
      if (agentSet) {
        agentSet.delete(agentId);
        if (agentSet.size === 0) {
          this.capabilityIndex.delete(capability);
        }
      }
    }

    // Remove agent
    this.agents.delete(agentId);

    console.log(`[AgentRegistry] Unregistered agent: ${agent.name} (${agentId})`);
  }

  /**
   * Get agent by ID
   */
  get(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get agent by name
   */
  getByName(name: string): BaseAgent | undefined {
    for (const agent of this.agents.values()) {
      if (agent.name.toLowerCase() === name.toLowerCase()) {
        return agent;
      }
    }
    return undefined;
  }

  /**
   * Get all agents
   */
  getAll(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get all agent metadata
   */
  getAllMetadata(): AgentMetadata[] {
    return Array.from(this.agents.values()).map(agent => agent.metadata);
  }

  /**
   * Find agents by capability
   */
  findByCapability(capability: AgentCapability): BaseAgent[] {
    const agentIds = this.capabilityIndex.get(capability);
    if (!agentIds) {
      return [];
    }

    const agents: BaseAgent[] = [];
    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      if (agent) {
        agents.push(agent);
      }
    }

    return agents;
  }

  /**
   * Find agents by multiple capabilities (all must match)
   */
  findByCapabilities(capabilities: AgentCapability[]): BaseAgent[] {
    if (capabilities.length === 0) {
      return this.getAll();
    }

    // Get agents with first capability
    let candidateIds = this.capabilityIndex.get(capabilities[0]);
    if (!candidateIds) {
      return [];
    }

    // Filter by remaining capabilities
    for (let i = 1; i < capabilities.length; i++) {
      const requiredIds = this.capabilityIndex.get(capabilities[i]);
      if (!requiredIds) {
        return [];
      }
      candidateIds = new Set([...candidateIds].filter(id => requiredIds.has(id)));
    }

    // Convert to agents
    const agents: BaseAgent[] = [];
    for (const agentId of candidateIds) {
      const agent = this.agents.get(agentId);
      if (agent) {
        agents.push(agent);
      }
    }

    return agents;
  }

  /**
   * Get available agents (status = READY)
   */
  getAvailable(): BaseAgent[] {
    return Array.from(this.agents.values()).filter(
      agent => agent.status === AgentStatus.READY
    );
  }

  /**
   * Get working agents (status = WORKING)
   */
  getWorking(): BaseAgent[] {
    return Array.from(this.agents.values()).filter(
      agent => agent.status === AgentStatus.WORKING
    );
  }

  /**
   * Check agent health
   */
  checkHealth(agentId: string): AgentHealthCheck {
    const agent = this.agents.get(agentId);

    if (!agent) {
      return {
        agentId,
        status: AgentStatus.ERROR,
        healthy: false,
        lastCheck: new Date(),
        message: 'Agent not found'
      };
    }

    const status = agent.status;
    const healthy = status !== AgentStatus.ERROR;

    return {
      agentId,
      status,
      healthy,
      lastCheck: new Date(),
      message: healthy ? 'Agent is healthy' : 'Agent is in error state'
    };
  }

  /**
   * Check health of all agents
   */
  checkAllHealth(): AgentHealthCheck[] {
    return Array.from(this.agents.keys()).map(agentId => this.checkHealth(agentId));
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalAgents: number;
    byStatus: Record<AgentStatus, number>;
    byCapability: Record<AgentCapability, number>;
  } {
    const byStatus: Record<string, number> = {};
    const byCapability: Record<string, number> = {};

    // Count by status
    for (const agent of this.agents.values()) {
      const status = agent.status;
      byStatus[status] = (byStatus[status] || 0) + 1;
    }

    // Count by capability
    for (const [capability, agentIds] of this.capabilityIndex.entries()) {
      byCapability[capability] = agentIds.size;
    }

    return {
      totalAgents: this.agents.size,
      byStatus: byStatus as Record<AgentStatus, number>,
      byCapability: byCapability as Record<AgentCapability, number>
    };
  }

  /**
   * Clear all agents
   */
  clear(): void {
    this.agents.clear();
    this.capabilityIndex.clear();
    console.log('[AgentRegistry] Cleared all agents');
  }
}

// Export singleton instance
export const agentRegistry = AgentRegistry.getInstance();
