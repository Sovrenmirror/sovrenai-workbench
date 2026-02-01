/**
 * BottomPanel Component
 * Terminal/Output panel at the bottom of the workbench
 */

import React, { useState, useRef, useEffect } from 'react';
import type { BottomPanelTab } from '../../types/workbench';

interface BottomPanelProps {
  activeTab: BottomPanelTab;
  onTabChange: (tab: BottomPanelTab) => void;
  onClose: () => void;
  terminalOutput: string[];
  onRunCommand: (cmd: string) => void;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  activeTab,
  onTabChange,
  onClose,
  terminalOutput,
  onRunCommand
}) => {
  const [command, setCommand] = useState('');
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    outputRef.current?.scrollTo(0, outputRef.current.scrollHeight);
  }, [terminalOutput]);

  const tabs: BottomPanelTab[] = ['terminal', 'output', 'problems'];

  return (
    <div className="h-52 bg-[#0a0a10] border-t border-white/5 flex flex-col">
      <div className="flex items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2 border-indigo-500'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div ref={outputRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {terminalOutput.map((line, i) => (
          <div key={i} className={`leading-6 ${line.startsWith('$') ? 'text-emerald-400' : 'text-white/60'}`}>
            {line}
          </div>
        ))}
      </div>

      {activeTab === 'terminal' && (
        <div className="flex items-center gap-3 px-4 py-3 border-t border-white/5 bg-[#0c0c14]">
          <span className="text-emerald-400 font-mono">$</span>
          <input
            type="text"
            value={command}
            onChange={e => setCommand(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && command.trim()) {
                onRunCommand(command);
                setCommand('');
              }
            }}
            placeholder="Enter command..."
            className="flex-1 bg-transparent text-white placeholder-white/30 focus:outline-none font-mono"
          />
        </div>
      )}
    </div>
  );
};

export default BottomPanel;
