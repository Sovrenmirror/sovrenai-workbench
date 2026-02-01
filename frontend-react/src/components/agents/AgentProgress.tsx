/**
 * AgentProgress Component
 * Animated progress bar with percentage
 */

import React from 'react';
import type { AgentProgress as AgentProgressType } from '../../types/agent';

interface AgentProgressProps {
  progress: AgentProgressType;
}

export const AgentProgress: React.FC<AgentProgressProps> = ({ progress }) => {
  const percent = Math.min(100, Math.max(0, progress.percent));

  return (
    <div className="space-y-1">
      {/* Progress message */}
      {progress.message && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">{progress.message}</span>
          <span className="text-emerald-400 font-semibold">{percent.toFixed(0)}%</span>
        </div>
      )}

      {/* Progress bar */}
      <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 progress-animated transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Stage indicator */}
      {progress.stage && (
        <div className="text-xs text-gray-500">
          Stage: {progress.stage}
        </div>
      )}
    </div>
  );
};
