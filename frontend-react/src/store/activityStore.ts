/**
 * Activity Store
 * Manages activity feed state
 */

import { create } from 'zustand';
import type { Activity } from '../types/activity';

interface ActivityStore {
  activities: Activity[];
  maxActivities: number;
  filter: {
    agentId?: string;
    type?: string;
    status?: string;
  };

  // Actions
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  clearActivities: () => void;
  setFilter: (filter: Partial<ActivityStore['filter']>) => void;
  clearFilter: () => void;

  // Selectors
  getRecentActivities: (limit?: number) => Activity[];
  getFilteredActivities: () => Activity[];
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activities: [],
  maxActivities: 500,
  filter: {},

  addActivity: (activityData) => {
    const activity: Activity = {
      ...activityData,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: activityData.timestamp || new Date()
    };

    set((state) => {
      const newActivities = [activity, ...state.activities];

      // Keep only maxActivities most recent
      if (newActivities.length > state.maxActivities) {
        return {
          activities: newActivities.slice(0, state.maxActivities)
        };
      }

      return { activities: newActivities };
    });
  },

  clearActivities: () => {
    set({ activities: [] });
  },

  setFilter: (filterUpdate) => {
    set((state) => ({
      filter: {
        ...state.filter,
        ...filterUpdate
      }
    }));
  },

  clearFilter: () => {
    set({ filter: {} });
  },

  getRecentActivities: (limit = 50) => {
    return get().activities.slice(0, limit);
  },

  getFilteredActivities: () => {
    const { activities, filter } = get();

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
  }
}));
