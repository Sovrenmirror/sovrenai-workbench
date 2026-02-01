/**
 * ActivityFilters Component
 * Filter controls for activity feed
 */

import React from 'react';
import { useActivityStore } from '../../store/activityStore';
import { AGENTS } from '../../types/agent';

export const ActivityFilters: React.FC = () => {
  const filter = useActivityStore((state) => state.filter);
  const setFilter = useActivityStore((state) => state.setFilter);
  const clearFilter = useActivityStore((state) => state.clearFilter);

  const hasActiveFilters = filter.agentId || filter.type || filter.status;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilter}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Agent Filter */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Agent</label>
        <select
          value={filter.agentId || ''}
          onChange={(e) => setFilter({ agentId: e.target.value || undefined })}
          className="w-full bg-gray-800 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Agents</option>
          {Object.values(AGENTS).map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.icon} {agent.name}
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Status</label>
        <select
          value={filter.status || ''}
          onChange={(e) => setFilter({ status: e.target.value || undefined })}
          className="w-full bg-gray-800 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="success">✅ Success</option>
          <option value="error">❌ Error</option>
          <option value="warning">⚠️ Warning</option>
          <option value="info">ℹ️ Info</option>
        </select>
      </div>

      {/* Type Filter */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Type</label>
        <select
          value={filter.type || ''}
          onChange={(e) => setFilter({ type: e.target.value || undefined })}
          className="w-full bg-gray-800 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="task_started">Task Started</option>
          <option value="task_completed">Task Completed</option>
          <option value="task_failed">Task Failed</option>
          <option value="workflow_started">Workflow Started</option>
          <option value="workflow_completed">Workflow Completed</option>
          <option value="agent_status">Agent Status</option>
        </select>
      </div>
    </div>
  );
};
