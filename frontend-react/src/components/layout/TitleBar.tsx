/**
 * TitleBar Component
 * Top navigation bar with logo, search, and actions
 */

import React from 'react';

interface TitleBarProps {
  onOpenCommandPalette: () => void;
  onOpenChat: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ onOpenCommandPalette, onOpenChat }) => {
  return (
    <div className="h-12 bg-[#0c0c14] border-b border-white/5 flex items-center px-4 gap-4 select-none">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 blur-lg opacity-40 -z-10" />
        </div>
        <div>
          <span className="font-semibold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Sovren</span>
          <span className="text-white/40 text-xs ml-2">Workbench</span>
        </div>
      </div>

      {/* Search Bar */}
      <button
        onClick={onOpenCommandPalette}
        className="flex-1 max-w-xl mx-auto flex items-center gap-3 px-4 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/30 hover:bg-white/[0.05] hover:border-white/10 transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-sm">Search or type a command...</span>
        <div className="ml-auto flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-white/[0.06] border border-white/10 text-white/40">⌘</kbd>
          <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-white/[0.06] border border-white/10 text-white/40">K</kbd>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenChat}
          className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          title="AI Chat"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </button>
        <button className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Settings">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
