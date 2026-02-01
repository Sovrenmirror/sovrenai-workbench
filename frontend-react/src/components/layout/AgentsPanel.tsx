/**
 * AgentsPanel Component
 * Premium right panel showing all agents with glassmorphic design
 */

import React, { useMemo } from 'react';
import { AgentGrid } from '../agents/AgentGrid';
import { useAgentStore } from '../../store/agentStore';
import { AgentStatus } from '../../types/agent';

export const AgentsPanel: React.FC = () => {
  const agents = useAgentStore((state) => state.agents);
  const workingAgents = useMemo(() =>
    Object.values(agents).filter(agent =>
      agent.status === AgentStatus.WORKING || agent.status === AgentStatus.QUEUED
    ),
    [agents]
  );

  return (
    <div className="w-full lg:w-[420px] glass-subtle border-l border-white/5 p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Agents</h2>
              <p className="text-xs text-white/40">6 AI assistants ready</p>
            </div>
          </div>
          {workingAgents.length > 0 && (
            <div className="status-pill status-working">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span>{workingAgents.length} active</span>
            </div>
          )}
        </div>

        {/* Quick Stats Bar */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <QuickStat label="Ready" value="6" color="blue" />
          <div className="w-px h-8 bg-white/10" />
          <QuickStat label="Working" value={workingAgents.length.toString()} color="emerald" />
          <div className="w-px h-8 bg-white/10" />
          <QuickStat label="Queue" value="0" color="amber" />
        </div>
      </div>

      {/* Agent Grid */}
      <AgentGrid />
    </div>
  );
};

/**
 * Quick Stat Component
 */
const QuickStat: React.FC<{
  label: string;
  value: string;
  color: 'blue' | 'emerald' | 'amber';
}> = ({ label, value, color }) => {
  const colors = {
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400'
  };

  return (
    <div className="flex-1 text-center">
      <div className={`text-lg font-bold ${colors[color]}`}>{value}</div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  );
};
