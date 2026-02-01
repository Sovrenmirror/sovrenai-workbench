/**
 * Workbench Agent Registry
 * Registry for workbench-style agents
 * Conversational agent is the first-contact agent for greetings and routing
 */

import type { Agent, AgentContext } from './agent-types.js';
import { ConversationalAgent } from '../specialized/conversational.js';
import { AnalystAgent } from '../specialized/analyst.js';
import { DesignerAgent } from '../specialized/designer.js';
import { ReviewerAgent } from '../specialized/reviewer.js';

class WorkbenchAgentRegistry {
  private agents: Map<string, Agent> = new Map();
  private primaryAgent: Agent;

  constructor() {
    // Conversational agent is the first-contact agent
    this.primaryAgent = new ConversationalAgent();
    this.register(this.primaryAgent);

    // Specialized agents
    this.register(new AnalystAgent());
    this.register(new DesignerAgent());
    this.register(new ReviewerAgent());
  }

  /**
   * Get the primary/first-contact agent (Conversational)
   */
  getPrimary(): Agent {
    return this.primaryAgent;
  }

  register(agent: Agent): void {
    this.agents.set(agent.name.toLowerCase(), agent);
    console.log(`[WorkbenchRegistry] Registered agent: ${agent.name} ${agent.icon}`);
  }

  get(name: string): Agent | undefined {
    return this.agents.get(name.toLowerCase());
  }

  getAll(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents that can handle the given context
   */
  getApplicable(context: AgentContext): Agent[] {
    return this.getAll().filter(agent => {
      try {
        return agent.canHandle(context);
      } catch (error) {
        console.error(`[WorkbenchRegistry] Error checking if ${agent.name} can handle context:`, error);
        return false;
      }
    });
  }

  /**
   * Get agent names and icons for display
   */
  getAgentInfo(): Array<{ name: string; icon: string }> {
    return this.getAll().map(agent => ({
      name: agent.name,
      icon: agent.icon
    }));
  }
}

// Export singleton instance
export const workbenchAgentRegistry = new WorkbenchAgentRegistry();
