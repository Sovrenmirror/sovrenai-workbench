/**
 * Sovren Workbench - Cursor-Style All-in-One AI Workstation
 * A premium, fully functional multi-agent development environment
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface Agent {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'ready' | 'working' | 'paused' | 'error';
  progress?: number;
  currentTask?: string;
  tasksCompleted: number;
  successRate: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
  agentName?: string;
  agentIcon?: string;
}

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileItem[];
  language?: string;
  content?: string;
}

interface Tab {
  id: string;
  name: string;
  type: 'file' | 'chat' | 'terminal' | 'agents' | 'welcome';
  icon?: string;
  content?: string;
}

interface ActivityItem {
  id: string;
  agentId: string;
  agentName: string;
  agentIcon: string;
  action: string;
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
}

// ============================================================================
// MOCK DATA
// ============================================================================

const INITIAL_AGENTS: Agent[] = [
  { id: 'sovren', name: 'Sovren', icon: '💬', description: 'Your AI assistant & first contact', status: 'ready', tasksCompleted: 100, successRate: 100 },
  { id: 'researcher', name: 'Researcher', icon: '🔍', description: 'Web search & fact verification', status: 'ready', tasksCompleted: 24, successRate: 98 },
  { id: 'writer', name: 'Writer', icon: '✍️', description: 'Content generation & editing', status: 'ready', tasksCompleted: 18, successRate: 100 },
  { id: 'analyst', name: 'Analyst', icon: '📊', description: 'Data analysis & insights', status: 'ready', tasksCompleted: 12, successRate: 95 },
  { id: 'designer', name: 'Designer', icon: '🎨', description: 'Diagrams & visualizations', status: 'ready', tasksCompleted: 8, successRate: 100 },
  { id: 'planner', name: 'Planner', icon: '📋', description: 'Task breakdown & scheduling', status: 'ready', tasksCompleted: 15, successRate: 97 },
  { id: 'reviewer', name: 'Reviewer', icon: '👁️', description: 'Quality checks & validation', status: 'ready', tasksCompleted: 20, successRate: 99 },
];

const MOCK_FILES: FileItem[] = [
  {
    id: '1', name: 'src', type: 'folder', children: [
      { id: '2', name: 'components', type: 'folder', children: [
        { id: '3', name: 'App.tsx', type: 'file', language: 'typescript', content: '// Main application component\nimport React from "react";\n\nexport default function App() {\n  return <div>Hello World</div>;\n}' },
        { id: '4', name: 'Header.tsx', type: 'file', language: 'typescript', content: '// Header component\nexport const Header = () => <header>Sovren</header>;' },
      ]},
      { id: '5', name: 'utils', type: 'folder', children: [
        { id: '6', name: 'helpers.ts', type: 'file', language: 'typescript', content: '// Helper functions\nexport const formatDate = (d: Date) => d.toISOString();' },
      ]},
      { id: '7', name: 'index.tsx', type: 'file', language: 'typescript', content: '// Entry point\nimport App from "./App";\nReactDOM.render(<App />, document.getElementById("root"));' },
    ]
  },
  { id: '8', name: 'package.json', type: 'file', language: 'json', content: '{\n  "name": "sovren-workbench",\n  "version": "1.0.0"\n}' },
  { id: '9', name: 'README.md', type: 'file', language: 'markdown', content: '# Sovren Workbench\n\nAn AI-powered development environment.' },
];

// Mock responses removed - now using real API

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

function App() {
  // State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState<'explorer' | 'agents' | 'activity'>('agents');
  const [tabs, setTabs] = useState<Tab[]>([{ id: 'welcome', name: 'Welcome', type: 'welcome' }]);
  const [activeTabId, setActiveTabId] = useState('welcome');
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '╭──────────────────────────────────────────╮',
    '│  Sovren Terminal v1.0                    │',
    '│  Type "help" for available commands      │',
    '╰──────────────────────────────────────────╯',
    ''
  ]);
  const [bottomPanelTab, setBottomPanelTab] = useState<'terminal' | 'output' | 'problems'>('terminal');
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Open a new tab
  const openTab = useCallback((tab: Tab) => {
    if (!tabs.find(t => t.id === tab.id)) {
      setTabs(prev => [...prev, tab]);
    }
    setActiveTabId(tab.id);
  }, [tabs]);

  // Close a tab
  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      return newTabs;
    });
  }, [activeTabId]);

  // Open chat tab
  const openChat = useCallback(() => {
    openTab({ id: 'chat', name: 'AI Chat', type: 'chat', icon: '💬' });
  }, [openTab]);

  // Add activity
  const addActivity = useCallback((agentId: string, action: string, status: 'success' | 'error' | 'pending') => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setActivities(prev => [{
        id: Date.now().toString(),
        agentId,
        agentName: agent.name,
        agentIcon: agent.icon,
        action,
        timestamp: new Date(),
        status
      }, ...prev].slice(0, 50));
    }
  }, [agents]);

  // Call real API for agent response
  const callAgentAPI = useCallback(async (agentId: string, userMessage: string) => {
    const agent = agents.find(a => a.id === agentId) || agents[0];

    // Set agent to working
    setAgents(prev => prev.map(a =>
      a.id === agent.id ? { ...a, status: 'working' as const, progress: 30, currentTask: userMessage.slice(0, 50) + '...' } : a
    ));
    addActivity(agent.id, `Processing: "${userMessage.slice(0, 40)}..."`, 'pending');

    try {
      // Get auth token
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3750';
      const tokenResponse = await fetch(`${API_BASE}/api/v1/auth/session`);
      const tokenData = await tokenResponse.json();
      const token = tokenData.token;

      // Update progress
      setAgents(prev => prev.map(a =>
        a.id === agent.id ? { ...a, progress: 60 } : a
      ));

      // Call the real chat API
      const response = await fetch(`${API_BASE}/api/chat/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          mentions: [agentId]
        })
      });

      const data = await response.json();

      // Update progress
      setAgents(prev => prev.map(a =>
        a.id === agent.id ? { ...a, progress: 90 } : a
      ));

      // Extract response text
      const responseText = data.response || data.content || data.message ||
        (data.error ? `Error: ${data.error.message || data.error}` : 'No response received');

      // Add assistant message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        agentId: agent.id,
        agentName: agent.name,
        agentIcon: agent.icon
      }]);

      // Reset agent status
      setAgents(prev => prev.map(a =>
        a.id === agent.id ? {
          ...a,
          status: 'ready' as const,
          progress: undefined,
          currentTask: undefined,
          tasksCompleted: a.tasksCompleted + 1
        } : a
      ));

      addActivity(agent.id, `Completed: "${userMessage.slice(0, 40)}..."`, 'success');

    } catch (error) {
      console.error('API call failed:', error);

      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
        agentId: agent.id,
        agentName: agent.name,
        agentIcon: agent.icon
      }]);

      // Reset agent status
      setAgents(prev => prev.map(a =>
        a.id === agent.id ? {
          ...a,
          status: 'error' as const,
          progress: undefined,
          currentTask: undefined
        } : a
      ));

      addActivity(agent.id, `Failed: "${userMessage.slice(0, 40)}..."`, 'error');

      // Reset to ready after 3 seconds
      setTimeout(() => {
        setAgents(prev => prev.map(a =>
          a.id === agent.id ? { ...a, status: 'ready' as const } : a
        ));
      }, 3000);
    }
  }, [agents, addActivity]);

  // Send message
  const sendMessage = useCallback((content: string) => {
    // Parse @mentions
    const mentionMatch = content.match(/@(\w+)/);
    const agentId = mentionMatch ? mentionMatch[1].toLowerCase() : 'researcher';

    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }]);

    // Call real API
    callAgentAPI(agentId, content);
  }, [callAgentAPI]);

  // Run terminal command
  const runCommand = useCallback((cmd: string) => {
    setTerminalOutput(prev => [...prev, `$ ${cmd}`]);

    if (cmd === 'help') {
      setTerminalOutput(prev => [...prev,
        '',
        'Available commands:',
        '  agents    - List all AI agents',
        '  status    - Show system status',
        '  clear     - Clear terminal',
        '  chat      - Open AI chat',
        '  version   - Show version info',
        ''
      ]);
    } else if (cmd === 'agents') {
      setTerminalOutput(prev => [...prev, '', 'Available Agents:', '']);
      agents.forEach(a => {
        setTerminalOutput(prev => [...prev, `  ${a.icon} ${a.name.padEnd(12)} [${a.status}] - ${a.tasksCompleted} tasks completed`]);
      });
      setTerminalOutput(prev => [...prev, '']);
    } else if (cmd === 'status') {
      const working = agents.filter(a => a.status === 'working').length;
      setTerminalOutput(prev => [...prev,
        '',
        '╭─ System Status ─────────────────────────╮',
        `│  Status:    ${working > 0 ? '🟢 Active' : '🔵 Idle'}                       │`,
        `│  Agents:    ${agents.length} available                   │`,
        `│  Working:   ${working} agents                       │`,
        `│  Tasks:     ${agents.reduce((sum, a) => sum + a.tasksCompleted, 0)} completed                  │`,
        '╰─────────────────────────────────────────╯',
        ''
      ]);
    } else if (cmd === 'clear') {
      setTerminalOutput(['Terminal cleared.', '']);
    } else if (cmd === 'chat') {
      openChat();
      setTerminalOutput(prev => [...prev, 'Opening AI Chat...', '']);
    } else if (cmd === 'version') {
      setTerminalOutput(prev => [...prev, '', 'Sovren Workbench v1.0.0', 'Built with ❤️ by Sovren AI', '']);
    } else if (cmd.trim() !== '') {
      setTerminalOutput(prev => [...prev, `Command not found: ${cmd}`, 'Type "help" for available commands.', '']);
    }
  }, [agents, openChat]);

  return (
    <div className="h-screen flex flex-col bg-[#09090f] text-gray-100 overflow-hidden">
      {/* Command Palette */}
      {commandPaletteOpen && (
        <CommandPalette
          onClose={() => setCommandPaletteOpen(false)}
          onOpenChat={openChat}
          agents={agents}
        />
      )}

      {/* Title Bar */}
      <TitleBar
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenChat={openChat}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar
          activePanel={activePanel}
          onPanelChange={setActivePanel}
          agentCount={agents.filter(a => a.status === 'working').length}
        />

        {/* Sidebar */}
        {!sidebarCollapsed && (
          <Sidebar
            activePanel={activePanel}
            files={MOCK_FILES}
            agents={agents}
            activities={activities}
            onFileClick={(file) => openTab({
              id: file.id,
              name: file.name,
              type: 'file',
              content: file.content
            })}
            onAgentClick={(agent) => {
              openChat();
              setTimeout(() => {
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'system',
                  content: `You are now chatting with ${agent.icon} **${agent.name}**\n\n${agent.description}\n\nType your message below to get started.`,
                  timestamp: new Date()
                }]);
              }, 100);
            }}
          />
        )}

        {/* Sidebar Resize Handle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-1 hover:w-1.5 bg-transparent hover:bg-indigo-500/50 transition-all cursor-col-resize group"
        >
          <div className="w-full h-full group-hover:bg-indigo-500" />
        </button>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabClick={setActiveTabId}
            onTabClose={closeTab}
          />

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {tabs.find(t => t.id === activeTabId)?.type === 'welcome' && (
              <WelcomeTab onOpenChat={openChat} agents={agents} />
            )}
            {tabs.find(t => t.id === activeTabId)?.type === 'chat' && (
              <ChatPanel
                messages={messages}
                agents={agents}
                onSendMessage={sendMessage}
              />
            )}
            {tabs.find(t => t.id === activeTabId)?.type === 'file' && (
              <FileEditor content={tabs.find(t => t.id === activeTabId)?.content || ''} />
            )}
          </div>

          {/* Bottom Panel */}
          {showBottomPanel && (
            <BottomPanel
              activeTab={bottomPanelTab}
              onTabChange={setBottomPanelTab}
              onClose={() => setShowBottomPanel(false)}
              terminalOutput={terminalOutput}
              onRunCommand={runCommand}
            />
          )}
        </div>

        {/* Right Panel - Agent Status */}
        <AgentStatusPanel agents={agents} />
      </div>

      {/* Status Bar */}
      <StatusBar
        agents={agents}
        onToggleBottomPanel={() => setShowBottomPanel(!showBottomPanel)}
      />
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function TitleBar({ onOpenCommandPalette, onOpenChat }: {
  onOpenCommandPalette: () => void;
  onOpenChat: () => void;
}) {
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
}

function CommandPalette({ onClose, onOpenChat, agents }: {
  onClose: () => void;
  onOpenChat: () => void;
  agents: Agent[];
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commands = [
    { id: 'chat', label: 'Open AI Chat', icon: '💬', desc: 'Start a conversation', action: () => { onOpenChat(); onClose(); } },
    { id: 'agents', label: 'View Agents', icon: '🤖', desc: 'See all available agents', action: onClose },
    { id: 'terminal', label: 'Toggle Terminal', icon: '⌨️', desc: 'Show/hide terminal', action: onClose },
    ...agents.map(a => ({ id: a.id, label: `Chat with ${a.name}`, icon: a.icon, desc: a.description, action: () => { onOpenChat(); onClose(); } }))
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
}

function ActivityBar({ activePanel, onPanelChange, agentCount }: {
  activePanel: string;
  onPanelChange: (panel: 'explorer' | 'agents' | 'activity') => void;
  agentCount: number;
}) {
  const items = [
    { id: 'explorer', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>, label: 'Explorer' },
    { id: 'agents', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>, label: 'AI Agents', badge: agentCount },
    { id: 'activity', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" /></svg>, label: 'Activity' },
  ];

  return (
    <div className="w-14 bg-[#0a0a10] border-r border-white/5 flex flex-col items-center py-3 gap-2">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onPanelChange(item.id as 'explorer' | 'agents' | 'activity')}
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            activePanel === item.id
              ? 'bg-white/10 text-white shadow-lg shadow-white/5'
              : 'text-white/30 hover:text-white/60 hover:bg-white/5'
          }`}
          title={item.label}
        >
          {item.icon}
          {item.badge !== undefined && item.badge > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full text-[10px] font-bold flex items-center justify-center text-black">
              {item.badge}
            </span>
          )}
        </button>
      ))}

      <div className="flex-1" />

      <button className="w-10 h-10 rounded-xl flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-all" title="Settings">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
}

function Sidebar({ activePanel, files, agents, activities, onFileClick, onAgentClick }: {
  activePanel: string;
  files: FileItem[];
  agents: Agent[];
  activities: ActivityItem[];
  onFileClick: (file: FileItem) => void;
  onAgentClick: (agent: Agent) => void;
}) {
  return (
    <div className="w-72 bg-[#0c0c14] border-r border-white/5 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
          {activePanel === 'explorer' && <><span>📁</span> Explorer</>}
          {activePanel === 'agents' && <><span>✨</span> AI Agents</>}
          {activePanel === 'activity' && <><span>📊</span> Activity</>}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {activePanel === 'explorer' && <FileTree files={files} onFileClick={onFileClick} />}
        {activePanel === 'agents' && <AgentList agents={agents} onAgentClick={onAgentClick} />}
        {activePanel === 'activity' && <ActivityList activities={activities} />}
      </div>
    </div>
  );
}

function FileTree({ files, onFileClick, depth = 0 }: {
  files: FileItem[];
  onFileClick: (file: FileItem) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ '1': true, '2': true });

  return (
    <div className="space-y-0.5">
      {files.map(file => (
        <div key={file.id}>
          <button
            onClick={() => {
              if (file.type === 'folder') {
                setExpanded(prev => ({ ...prev, [file.id]: !prev[file.id] }));
              } else {
                onFileClick(file);
              }
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.05] text-left text-sm group transition-colors"
            style={{ paddingLeft: depth * 16 + 8 }}
          >
            <span className="text-white/40 group-hover:text-white/60 transition-colors">
              {file.type === 'folder' ? (
                expanded[file.id] ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                )
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              )}
            </span>
            <span className="text-white/70 group-hover:text-white truncate transition-colors">{file.name}</span>
          </button>
          {file.type === 'folder' && expanded[file.id] && file.children && (
            <FileTree files={file.children} onFileClick={onFileClick} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

function AgentList({ agents, onAgentClick }: {
  agents: Agent[];
  onAgentClick: (agent: Agent) => void;
}) {
  return (
    <div className="space-y-2">
      {agents.map(agent => (
        <button
          key={agent.id}
          onClick={() => onAgentClick(agent)}
          className={`w-full p-4 rounded-xl text-left transition-all group ${
            agent.status === 'working'
              ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 shadow-lg shadow-emerald-500/5'
              : 'bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/10'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl group-hover:scale-110 transition-transform">{agent.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-white block truncate">{agent.name}</span>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              agent.status === 'working'
                ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {agent.status}
            </span>
          </div>
          <p className="text-xs text-white/40 mb-3">{agent.description}</p>

          {agent.progress !== undefined && (
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-white/40 mb-1">
                <span>Processing...</span>
                <span>{Math.round(agent.progress)}%</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300"
                  style={{ width: `${agent.progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-[10px] text-white/30">
            <span>✓ {agent.tasksCompleted} tasks</span>
            <span>⚡ {agent.successRate}% success</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function ActivityList({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3 opacity-30">📊</div>
        <p className="text-sm text-white/30">No activity yet</p>
        <p className="text-xs text-white/20 mt-1">Start chatting to see agent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map(activity => (
        <div key={activity.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg">{activity.agentIcon}</span>
            <span className="text-sm font-medium text-white">{activity.agentName}</span>
            <span className={`ml-auto w-2 h-2 rounded-full ${
              activity.status === 'success' ? 'bg-emerald-400' :
              activity.status === 'error' ? 'bg-red-400' :
              'bg-amber-400 animate-pulse'
            }`} />
          </div>
          <p className="text-xs text-white/50 truncate mb-1">{activity.action}</p>
          <p className="text-[10px] text-white/20">
            {activity.timestamp.toLocaleTimeString()}
          </p>
        </div>
      ))}
    </div>
  );
}

function TabBar({ tabs, activeTabId, onTabClick, onTabClose }: {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
}) {
  return (
    <div className="h-10 bg-[#0a0a10] border-b border-white/5 flex items-center overflow-x-auto">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`group relative flex items-center gap-2 px-4 h-full cursor-pointer transition-colors ${
            activeTabId === tab.id
              ? 'bg-[#09090f] text-white'
              : 'text-white/50 hover:text-white/70 hover:bg-white/[0.02]'
          }`}
          onClick={() => onTabClick(tab.id)}
        >
          {activeTabId === tab.id && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
          )}
          <span className="text-sm">{tab.icon || '📄'}</span>
          <span className="text-sm">{tab.name}</span>
          {tabs.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); onTabClose(tab.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-all"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function WelcomeTab({ onOpenChat, agents }: { onOpenChat: () => void; agents: Agent[] }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="relative inline-block mb-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30">
              <span className="text-5xl">⚡</span>
            </div>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 blur-2xl opacity-40 -z-10" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Sovren</span>
          </h1>
          <p className="text-xl text-white/50 max-w-lg mx-auto">
            Your AI-powered development workstation with 6 specialized agents ready to help.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-6 mb-16">
          <button
            onClick={onOpenChat}
            className="group p-8 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all text-left"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">💬</div>
            <h3 className="text-xl font-semibold text-white mb-2">Start Chatting</h3>
            <p className="text-white/50">Talk to AI agents using natural language. Use @mentions to target specific agents.</p>
          </button>

          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-left">
            <div className="text-4xl mb-4">⌘K</div>
            <h3 className="text-xl font-semibold text-white mb-2">Command Palette</h3>
            <p className="text-white/50">Quick access to all features. Press ⌘K anywhere to open.</p>
          </div>
        </div>

        {/* Agents Grid */}
        <div>
          <h2 className="text-lg font-semibold text-white/70 mb-6 flex items-center gap-2">
            <span>✨</span> Available Agents
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={onOpenChat}
                className="group p-6 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 text-left transition-all"
              >
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-3xl group-hover:scale-110 transition-transform">{agent.icon}</span>
                  <div>
                    <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{agent.name}</p>
                    <p className="text-xs text-white/30">{agent.tasksCompleted} tasks completed</p>
                  </div>
                </div>
                <p className="text-sm text-white/40">{agent.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ messages, agents, onSendMessage }: {
  messages: Message[];
  agents: Agent[];
  onSendMessage: (content: string) => void;
}) {
  const [input, setInput] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const workingAgent = agents.find(a => a.status === 'working');

  return (
    <div className="h-full flex flex-col bg-[#09090f]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-6 opacity-50">💬</div>
            <h3 className="text-xl font-semibold text-white/70 mb-2">Start a Conversation</h3>
            <p className="text-white/40 max-w-md mx-auto">
              Type your message below. Use <span className="text-indigo-400">@agent</span> to mention a specific agent.
            </p>
            <div className="flex justify-center gap-2 mt-6">
              {agents.slice(0, 3).map(a => (
                <button
                  key={a.id}
                  onClick={() => setInput(`@${a.id} `)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/20 transition-all"
                >
                  {a.icon} @{a.id}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] ${msg.role === 'user' ? '' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{msg.agentIcon}</span>
                  <span className="text-sm font-medium text-white/70">{msg.agentName}</span>
                </div>
              )}
              <div className={`rounded-2xl px-5 py-4 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-md'
                  : msg.role === 'system'
                  ? 'bg-white/5 text-white/60 border border-white/10'
                  : 'bg-white/[0.06] text-white/90 border border-white/10 rounded-bl-md'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
              <p className="text-[10px] text-white/20 mt-1.5 px-2">
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {workingAgent && (
          <div className="flex justify-start">
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/[0.06] border border-white/10">
              <span className="text-xl">{workingAgent.icon}</span>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-white/40">{workingAgent.name} is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Mention Dropdown */}
      {showMentions && (
        <div className="mx-6 mb-2 p-2 rounded-xl bg-[#12121a] border border-white/10 shadow-xl">
          <p className="text-xs text-white/30 px-3 py-1 uppercase tracking-wider">Mention an agent</p>
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => {
                setInput(prev => prev.replace(/@\w*$/, `@${agent.id} `));
                setShowMentions(false);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.06] text-left transition-colors"
            >
              <span className="text-2xl">{agent.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-white">{agent.name}</p>
                <p className="text-xs text-white/40">{agent.description}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${
                agent.status === 'working' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
              }`}>{agent.status}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-6 border-t border-white/5">
        <div className="flex items-end gap-4">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={e => {
                setInput(e.target.value);
                setShowMentions(/@\w*$/.test(e.target.value));
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message... Use @ to mention an agent"
              className="w-full px-5 py-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/30 resize-none focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              rows={1}
              style={{ minHeight: 56, maxHeight: 200 }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2"
          >
            Send
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-white/20 mt-2 px-1">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white/40 mx-1">Enter</kbd> to send ·
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white/40 mx-1">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}

function FileEditor({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="h-full flex bg-[#09090f] font-mono text-sm overflow-auto">
      {/* Line numbers */}
      <div className="py-4 pr-4 pl-6 text-right text-white/20 select-none border-r border-white/5">
        {lines.map((_, i) => (
          <div key={i} className="leading-6">{i + 1}</div>
        ))}
      </div>
      {/* Code */}
      <div className="flex-1 p-4 overflow-auto">
        <pre className="text-white/70 leading-6">{content || '// Empty file'}</pre>
      </div>
    </div>
  );
}

function BottomPanel({ activeTab, onTabChange, onClose, terminalOutput, onRunCommand }: {
  activeTab: string;
  onTabChange: (tab: 'terminal' | 'output' | 'problems') => void;
  onClose: () => void;
  terminalOutput: string[];
  onRunCommand: (cmd: string) => void;
}) {
  const [command, setCommand] = useState('');
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    outputRef.current?.scrollTo(0, outputRef.current.scrollHeight);
  }, [terminalOutput]);

  return (
    <div className="h-52 bg-[#0a0a10] border-t border-white/5 flex flex-col">
      <div className="flex items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center">
          {(['terminal', 'output', 'problems'] as const).map(tab => (
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
}

function AgentStatusPanel({ agents }: { agents: Agent[] }) {
  const workingAgents = agents.filter(a => a.status === 'working');

  if (workingAgents.length === 0) return null;

  return (
    <div className="w-72 bg-[#0c0c14] border-l border-white/5 p-4 overflow-y-auto">
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        Active Tasks
      </h3>
      <div className="space-y-3">
        {workingAgents.map(agent => (
          <div key={agent.id} className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{agent.icon}</span>
              <div className="flex-1">
                <span className="font-medium text-white block">{agent.name}</span>
                <span className="text-xs text-emerald-400">Working</span>
              </div>
            </div>
            <p className="text-xs text-white/50 mb-3 truncate">{agent.currentTask}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-white/40">Progress</span>
                <span className="text-emerald-400">{Math.round(agent.progress || 0)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300"
                  style={{ width: `${agent.progress || 0}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBar({ agents, onToggleBottomPanel }: {
  agents: Agent[];
  onToggleBottomPanel: () => void;
}) {
  const workingCount = agents.filter(a => a.status === 'working').length;
  const totalTasks = agents.reduce((sum, a) => sum + a.tasksCompleted, 0);

  return (
    <div className="h-6 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between px-4 text-xs text-white/90">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleBottomPanel}
          className="hover:bg-white/20 px-2 py-0.5 rounded flex items-center gap-1.5 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Terminal
        </button>
        <span className="opacity-70 flex items-center gap-1.5">
          {workingCount > 0 ? (
            <>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              {workingCount} agent{workingCount > 1 ? 's' : ''} working
            </>
          ) : (
            <>
              <span className="w-2 h-2 bg-blue-400 rounded-full" />
              All agents ready
            </>
          )}
        </span>
      </div>
      <div className="flex items-center gap-6">
        <span className="opacity-70">✓ {totalTasks} tasks completed</span>
        <span className="font-medium">Sovren v1.0</span>
      </div>
    </div>
  );
}

export default App;
