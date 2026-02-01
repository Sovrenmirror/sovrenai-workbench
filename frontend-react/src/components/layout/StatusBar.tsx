/**
 * StatusBar Component
 * Bottom status bar showing agent status and quick actions
 */

import React from 'react';
import type { WorkbenchAgent } from '../../types/workbench';

interface StatusBarProps {
  agents: WorkbenchAgent[];
  onToggleBottomPanel: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ agents, onToggleBottomPanel }) => {
  const workingCount = agents.filter(a => a.status === 'working').length;
  const totalTasks = agents.reduce((sum, a) => sum + a.tasksCompleted, 0);

  return (
    <div className="h-6 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between px-4 text-xs text-white/90">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleBottomPanel}
          className="hover:bg-white/20 px-2 py-0.5 rounded flex items-center gap-1.5 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Terminal
        </button>
        <span className="opacity-70 flex items-center gap-1.5">
          {workingCount > 0 ? (
            <>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              {workingCount} agent{workingCount > 1 ? 's' : ''} working
            </>
          ) : (
            <>
              <span className="w-2 h-2 bg-blue-400 rounded-full" />
              All agents ready
            </>
          )}
        </span>
      </div>
      <div className="flex items-center gap-6">
        <span className="opacity-70">{totalTasks} tasks completed</span>
        <span className="font-medium">Sovren v1.0</span>
      </div>
    </div>
  );
};

export default StatusBar;
