/**
 * AgentCard Component
 * Premium glassmorphic agent card with status, progress, and stats
 */

import React from 'react';
import { AgentStatus, type Agent } from '../../types/agent';
import { AgentProgress as AgentProgressComponent } from './AgentProgress';
import { AgentStatus as AgentStatusComponent } from './AgentStatus';

interface AgentCardProps {
  agent: Agent;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const isWorking = agent.status === AgentStatus.WORKING;
  const hasProgress = agent.progress && agent.progress.percent > 0;

  return (
    <div
      className={`
        glass-card rounded-xl p-4 transition-all duration-300
        hover:scale-[1.02] cursor-pointer group
        ${isWorking ? 'glow-working' : ''}
      `}
      data-agent={agent.id}
      data-status={agent.status}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
              {agent.icon}
            </div>
            {isWorking && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#12121a] animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
              {agent.name}
            </h3>
            <p className="text-xs text-white/40">{agent.description}</p>
          </div>
        </div>
        <AgentStatusComponent status={agent.status} />
      </div>

      {/* Progress Bar (if working) */}
      {hasProgress && (
        <div className="mb-4">
          <AgentProgressComponent progress={agent.progress!} />
        </div>
      )}

      {/* Current Task */}
      {agent.currentTask && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs text-white/60 truncate">
              {agent.currentTask.substring(0, 20)}...
            </span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <StatBox label="Completed" value={agent.stats.tasksCompleted.toString()} />
        <StatBox label="Success" value={`${agent.stats.successRate.toFixed(0)}%`} />
      </div>

      {/* Capabilities */}
      <div className="flex flex-wrap gap-1.5">
        {agent.capabilities.slice(0, 2).map((capability) => (
          <span
            key={capability}
            className="text-xs px-2.5 py-1 rounded-full bg-white/[0.04] text-white/50 border border-white/5"
          >
            {capability.replace(/_/g, ' ')}
          </span>
        ))}
        {agent.capabilities.length > 2 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            +{agent.capabilities.length - 2}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Stat Box Component
 */
const StatBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 text-center">
    <div className="text-sm font-semibold text-white">{value}</div>
    <div className="text-xs text-white/30">{label}</div>
  </div>
);
