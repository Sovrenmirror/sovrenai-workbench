/**
 * Header Component
 * Premium glassmorphic header with logo, status, and controls
 */

import React from 'react';
import { useUIStore } from '../../store/uiStore';
import type { Theme } from '../../store/uiStore';

const themes: { value: Theme; label: string; color: string }[] = [
  { value: 'dark', label: 'Dark', color: '#1e1e2e' },
  { value: 'neon', label: 'Neon', color: '#00ff88' },
  { value: 'cyber', label: 'Cyber', color: '#ff00aa' },
  { value: 'matrix', label: 'Matrix', color: '#00ff00' },
  { value: 'vapor', label: 'Vapor', color: '#ff1493' },
  { value: 'cosmic', label: 'Cosmic', color: '#9d4edd' }
];

export const Header: React.FC = () => {
  const { theme, wsConnected, wsReconnecting, setTheme } = useUIStore();

  return (
    <header className="glass-subtle border-b border-white/5">
      <div className="flex items-center justify-between px-8 py-5">
        {/* Logo Section */}
        <div className="flex items-center gap-5">
          {/* Animated Logo Mark */}
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 blur-xl opacity-30 -z-10" />
          </div>

          {/* Brand Text */}
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              <span className="logo-gradient">Sovren</span>
              <span className="text-white/90 ml-1.5 font-normal">Workbench</span>
            </h1>
            <p className="text-xs text-white/40 font-medium tracking-wide uppercase mt-0.5">
              Multi-Agent AI Platform
            </p>
          </div>
        </div>

        {/* Center - Connection Status */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <ConnectionStatus connected={wsConnected} reconnecting={wsReconnecting} />
        </div>

        {/* Right - Theme Switcher */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/40 font-medium uppercase tracking-wider">Theme</span>
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/[0.03] border border-white/5">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`
                  relative w-8 h-8 rounded-lg transition-all duration-200
                  ${theme === t.value
                    ? 'bg-white/10 shadow-lg'
                    : 'hover:bg-white/5'
                  }
                `}
                title={t.label}
              >
                <span
                  className={`
                    block w-3.5 h-3.5 rounded-full mx-auto
                    transition-transform duration-200
                    ${theme === t.value ? 'scale-110' : 'scale-100'}
                  `}
                  style={{
                    backgroundColor: t.color,
                    boxShadow: theme === t.value ? `0 0 12px ${t.color}60` : 'none'
                  }}
                />
                {theme === t.value && (
                  <div
                    className="absolute inset-0 rounded-lg border-2 border-white/20"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Settings Button */}
          <button className="btn-ghost p-2.5 rounded-xl">
            <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

/**
 * Connection Status Indicator
 */
const ConnectionStatus: React.FC<{ connected: boolean; reconnecting: boolean }> = ({
  connected,
  reconnecting
}) => {
  if (connected) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
        </span>
        <span className="text-sm font-medium text-emerald-400">Connected</span>
      </div>
    );
  }

  if (reconnecting) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
        <svg className="animate-spin h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm font-medium text-amber-400">Reconnecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20">
      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
      <span className="text-sm font-medium text-red-400">Disconnected</span>
    </div>
  );
};
