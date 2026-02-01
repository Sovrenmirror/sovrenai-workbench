/**
 * AgentStatus Component
 * Color-coded status indicator
 */

import React from 'react';
import { AgentStatus as AgentStatusEnum } from '../../types/agent';

interface AgentStatusProps {
  status: AgentStatusEnum;
}

const statusConfig: Record<AgentStatusEnum, { label: string; color: string; className: string }> = {
  [AgentStatusEnum.INITIALIZING]: {
    label: 'Initializing',
    color: '#9ca3af',
    className: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  },
  [AgentStatusEnum.READY]: {
    label: 'Ready',
    color: '#60a5fa',
    className: 'status-ready border-blue-400/30'
  },
  [AgentStatusEnum.WORKING]: {
    label: 'Working',
    color: '#34d399',
    className: 'status-working border-emerald-400/30 animate-pulse'
  },
  [AgentStatusEnum.QUEUED]: {
    label: 'Queued',
    color: '#a78bfa',
    className: 'bg-violet-400/20 text-violet-400 border-violet-400/30'
  },
  [AgentStatusEnum.PAUSED]: {
    label: 'Paused',
    color: '#fbbf24',
    className: 'status-paused border-amber-400/30'
  },
  [AgentStatusEnum.ERROR]: {
    label: 'Error',
    color: '#f87171',
    className: 'status-error border-red-400/30'
  },
  [AgentStatusEnum.COMPLETED]: {
    label: 'Completed',
    color: '#a78bfa',
    className: 'status-completed border-violet-400/30'
  }
};

export const AgentStatus: React.FC<AgentStatusProps> = ({ status }) => {
  const config = statusConfig[status];

  return (
    <div
      className={`
        inline-flex items-center gap-1.5
        px-2 py-1 rounded-full border
        text-xs font-medium
        ${config.className}
      `}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      <span>{config.label}</span>
    </div>
  );
};
