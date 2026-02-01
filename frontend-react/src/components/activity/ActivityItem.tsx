/**
 * ActivityItem Component
 * Individual activity entry
 */

import React from 'react';
import type { Activity } from '../../types/activity';
import { AGENTS } from '../../types/agent';

interface ActivityItemProps {
  activity: Activity;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const agent = activity.agentId ? AGENTS[activity.agentId] : null;

  const statusColor = {
    success: 'text-emerald-400',
    error: 'text-red-400',
    warning: 'text-amber-400',
    info: 'text-blue-400'
  }[activity.status || 'info'];

  const statusIcon = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }[activity.status || 'info'];

  return (
    <div
      className="flex items-start gap-3 p-3 hover:bg-gray-800/50 rounded-lg transition-colors"
      data-activity-item={activity.id}
      data-activity-type={activity.type}
    >
      {/* Icon */}
      <div className="text-xl mt-0.5">
        {agent?.icon || statusIcon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-white">{activity.message}</p>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {new Date(activity.timestamp).toLocaleTimeString()}
          </span>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-3 mt-1">
          {agent && (
            <span className="text-xs text-gray-400">{agent.name}</span>
          )}
          {activity.status && (
            <span className={`text-xs font-medium ${statusColor}`}>
              {activity.status}
            </span>
          )}
          {activity.taskId && (
            <span className="text-xs text-gray-500">
              {activity.taskId.substring(0, 8)}...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
