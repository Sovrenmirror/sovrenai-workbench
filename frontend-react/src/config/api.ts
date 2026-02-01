/**
 * API Configuration
 * Centralized configuration for all API endpoints
 * Uses environment variables with development fallbacks
 */

// Base URLs from environment or defaults for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3750';
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3750';

export const config = {
  // REST API endpoints
  api: {
    baseUrl: API_BASE_URL,
    auth: {
      founderLogin: `${API_BASE_URL}/api/v1/auth/founder-login`,
      devSession: `${API_BASE_URL}/api/v1/auth/dev-session`,
    },
    chat: {
      agent: `${API_BASE_URL}/api/chat/agent`,
      stream: `${API_BASE_URL}/api/chat/stream`,
    },
    workflows: {
      create: `${API_BASE_URL}/api/workflows/create`,
      execute: `${API_BASE_URL}/api/workflows/execute`,
    },
  },

  // WebSocket endpoint
  ws: {
    url: `${WS_BASE_URL}/ws`,
  },

  // Feature flags
  features: {
    // In development mode, auto-login is available
    devAutoLogin: import.meta.env.DEV,
  },
} as const;

export default config;
