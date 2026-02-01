/**
 * CommandPalette Component
 * Quick command search and execution modal
 */

import React, { useState, useRef, useEffect } from 'react';
import type { WorkbenchAgent } from '../types/workbench';

interface CommandPaletteProps {
  onClose: () => void;
  onOpenChat: () => void;
  agents: WorkbenchAgent[];
}

interface Command {
  id: string;
  label: string;
  icon: string;
  desc?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose, onOpenChat, agents }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commands: Command[] = [
    { id: 'chat', label: 'Open AI Chat', icon: '💬', desc: 'Start a conversation', action: () => { onOpenChat(); onClose(); } },
    { id: 'agents', label: 'View Agents', icon: '🤖', desc: 'See all available agents', action: onClose },
    { id: 'terminal', label: 'Toggle Terminal', icon: '⌨️', desc: 'Show/hide terminal', action: onClose },
    ...agents.map(a => ({
      id: a.id,
      label: `Chat with ${a.name}`,
      icon: a.icon,
      desc: a.description,
      action: () => { onOpenChat(); onClose(); }
    }))
  ];

  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.desc?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <svg className="w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-white text-lg placeholder-white/30 focus:outline-none"
          />
          <kbd className="px-2 py-1 text-xs rounded bg-white/[0.06] border border-white/10 text-white/30">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="text-center text-white/30 py-8">No results found</p>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={cmd.action}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/[0.06] text-left transition-colors ${i === 0 ? 'bg-white/[0.03]' : ''}`}
            >
              <span className="text-2xl">{cmd.icon}</span>
              <div className="flex-1">
                <p className="text-white font-medium">{cmd.label}</p>
                {cmd.desc && <p className="text-sm text-white/40">{cmd.desc}</p>}
              </div>
              <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
