/**
 * ActivityFeed Component
 * Live activity feed with filtering
 */

import React, { useState, useMemo } from 'react';
import { useActivityStore } from '../../store/activityStore';
import { ActivityItem } from './ActivityItem';
import { ActivityFilters } from './ActivityFilters';

export const ActivityFeed: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const activities = useActivityStore((state) => state.activities);
  const filter = useActivityStore((state) => state.filter);
  const clearActivities = useActivityStore((state) => state.clearActivities);

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      if (filter.agentId && activity.agentId !== filter.agentId) {
        return false;
      }
      if (filter.type && activity.type !== filter.type) {
        return false;
      }
      if (filter.status && activity.status !== filter.status) {
        return false;
      }
      return true;
    });
  }, [activities, filter]);

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">Activity Feed</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                px-3 py-1 text-sm rounded transition-colors
                ${
                  showFilters
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              🔍 Filter
            </button>
            {filteredActivities.length > 0 && (
              <button
                onClick={clearActivities}
                className="px-3 py-1 text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 rounded transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-400">
          {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'}
        </p>
      </div>

      {/* Content */}
      <div className="flex flex-1 min-h-0">
        {/* Filters Panel */}
        {showFilters && (
          <div className="w-64 border-r border-gray-800 p-4 overflow-y-auto">
            <ActivityFilters />
          </div>
        )}

        {/* Activity List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredActivities.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-lg font-semibold mb-2">No activities</h3>
                <p className="text-sm">
                  Activities will appear here as agents work
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
