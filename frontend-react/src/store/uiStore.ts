/**
 * UI Store
 * Manages UI state (theme, panels, active tabs)
 */

import { create } from 'zustand';

export type Theme = 'dark' | 'neon' | 'cyber' | 'matrix' | 'vapor' | 'cosmic';

interface UIStore {
  theme: Theme;
  sidebarOpen: boolean;
  agentsPanelOpen: boolean;
  activityFeedOpen: boolean;
  activeTab: string;

  // WebSocket connection state
  wsConnected: boolean;
  wsReconnecting: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  toggleAgentsPanel: () => void;
  toggleActivityFeed: () => void;
  setActiveTab: (tab: string) => void;
  setWsConnected: (connected: boolean) => void;
  setWsReconnecting: (reconnecting: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  theme: 'dark',
  sidebarOpen: true,
  agentsPanelOpen: true,
  activityFeedOpen: true,
  activeTab: 'dashboard',
  wsConnected: false,
  wsReconnecting: false,

  setTheme: (theme) => {
    set({ theme });
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  toggleAgentsPanel: () => {
    set((state) => ({ agentsPanelOpen: !state.agentsPanelOpen }));
  },

  toggleActivityFeed: () => {
    set((state) => ({ activityFeedOpen: !state.activityFeedOpen }));
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  setWsConnected: (connected) => {
    set({ wsConnected: connected, wsReconnecting: false });
  },

  setWsReconnecting: (reconnecting) => {
    set({ wsReconnecting: reconnecting });
  }
}));
