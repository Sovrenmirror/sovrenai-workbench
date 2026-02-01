/**
 * AgentGrid Component
 * 2x3 grid of agent cards
 */

import React from 'react';
import { useAgentStore } from '../../store/agentStore';
import { AgentCard } from './AgentCard';

export const AgentGrid: React.FC = () => {
  const agents = useAgentStore((state) => state.agents);

  const agentList = Object.values(agents);

  if (agentList.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">🤖</div>
          <div>No agents available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agentList.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
};
