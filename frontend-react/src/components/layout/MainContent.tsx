/**
 * MainContent Component
 * Premium tabbed interface with glassmorphic design
 */

import React, { useMemo } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useActivityStore } from '../../store/activityStore';
import { ChatView } from '../chat/ChatView';
import { ActivityFeed } from '../activity/ActivityFeed';
import { DocumentTabs } from '../documents/DocumentTabs';
import { WorkflowBuilder } from '../workflow/WorkflowBuilder';

// Premium icon components
const DashboardIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);

const ActivityIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const WorkflowIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

const tabs = [
  { id: 'dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { id: 'chat', label: 'Chat', Icon: ChatIcon },
  { id: 'activity', label: 'Activity', Icon: ActivityIcon },
  { id: 'documents', label: 'Documents', Icon: DocumentIcon },
  { id: 'workflows', label: 'Workflows', Icon: WorkflowIcon }
];

export const MainContent: React.FC = () => {
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const allActivities = useActivityStore((state) => state.activities);
  const activities = useMemo(() => allActivities.slice(0, 10), [allActivities]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab Navigation */}
      <div className="glass-subtle border-b border-white/5">
        <div className="flex items-center px-6">
          {tabs.map((tab) => {
            const Icon = tab.Icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  tab-item flex items-center gap-2.5 rounded-t-lg
                  ${isActive ? 'active' : ''}
                `}
              >
                <Icon />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' && <DashboardView activities={activities} />}
        {activeTab === 'chat' && <ChatView />}
        {activeTab === 'activity' && <ActivityFeed />}
        {activeTab === 'documents' && <DocumentTabs />}
        {activeTab === 'workflows' && <WorkflowBuilder />}
      </div>
    </div>
  );
};

/**
 * Premium Dashboard View
 */
const DashboardView: React.FC<{ activities: unknown[] }> = ({ activities }) => {
  return (
    <div className="flex-1 p-8 overflow-y-auto grid-pattern">
      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="text-xs font-medium text-white/30 uppercase tracking-widest">Welcome Back</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Sovren <span className="logo-gradient">Workbench</span>
          </h1>
          <p className="text-lg text-white/50 max-w-xl">
            Your multi-agent AI collaboration platform. Orchestrate intelligent agents to research, write, analyze, and create.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 stagger-children">
          <StatCard
            icon={<AgentsIcon />}
            value="6"
            label="AI Agents Ready"
            color="indigo"
          />
          <StatCard
            icon={<TasksIcon />}
            value="10"
            label="Concurrent Tasks"
            color="purple"
          />
          <StatCard
            icon={<ActivityStatIcon />}
            value={activities.length.toString()}
            label="Recent Activities"
            color="pink"
          />
        </div>

        {/* Quick Start */}
        <div className="glass-card rounded-2xl p-8 mb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <RocketIcon />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Quick Start</h2>
              <p className="text-sm text-white/40">Get started in 3 easy steps</p>
            </div>
          </div>

          <div className="space-y-5">
            <QuickStartStep
              number={1}
              title="Start a Chat"
              description="Open the Chat tab to communicate with AI agents using natural language"
            />
            <QuickStartStep
              number={2}
              title="Mention an Agent"
              description="Type @researcher, @writer, or @analyst to direct your request"
            />
            <QuickStartStep
              number={3}
              title="Monitor Progress"
              description="Watch live updates in the Activity tab or the agents panel"
            />
          </div>
        </div>

        {/* Available Agents */}
        <div className="glass-card rounded-2xl p-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <AgentsIcon />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Available Agents</h2>
              <p className="text-sm text-white/40">Specialized AI assistants at your service</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            <AgentPreview icon="💬" name="Sovren" desc="Your AI assistant & first contact" color="indigo" />
            <AgentPreview icon="🔍" name="Researcher" desc="Web search & fact verification" color="blue" />
            <AgentPreview icon="✍️" name="Writer" desc="Content generation & editing" color="emerald" />
            <AgentPreview icon="📊" name="Analyst" desc="Data analysis & insights" color="amber" />
            <AgentPreview icon="🎨" name="Designer" desc="Diagrams & visualizations" color="pink" />
            <AgentPreview icon="📋" name="Planner" desc="Task breakdown & scheduling" color="violet" />
            <AgentPreview icon="👁️" name="Reviewer" desc="Quality checks & validation" color="cyan" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Stat Card Component
 */
const StatCard: React.FC<{
  icon: React.ReactNode;
  value: string;
  label: string;
  color: 'indigo' | 'purple' | 'pink';
}> = ({ icon, value, label, color }) => {
  const gradients = {
    indigo: 'from-indigo-500/20 to-indigo-500/5',
    purple: 'from-purple-500/20 to-purple-500/5',
    pink: 'from-pink-500/20 to-pink-500/5'
  };

  const iconBg = {
    indigo: 'from-indigo-500/30 to-indigo-600/30',
    purple: 'from-purple-500/30 to-purple-600/30',
    pink: 'from-pink-500/30 to-pink-600/30'
  };

  return (
    <div className={`stat-card bg-gradient-to-br ${gradients[color]}`}>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconBg[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-white/50">{label}</div>
    </div>
  );
};

/**
 * Quick Start Step
 */
const QuickStartStep: React.FC<{
  number: number;
  title: string;
  description: string;
}> = ({ number, title, description }) => (
  <div className="flex items-start gap-4">
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
      {number}
    </div>
    <div>
      <h3 className="text-white font-medium mb-0.5">{title}</h3>
      <p className="text-sm text-white/40">{description}</p>
    </div>
  </div>
);

/**
 * Agent Preview Card
 */
const AgentPreview: React.FC<{
  icon: string;
  name: string;
  desc: string;
  color: string;
}> = ({ icon, name, desc }) => (
  <div className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200 cursor-pointer">
    <div className="text-3xl group-hover:scale-110 transition-transform duration-200">{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="font-medium text-white group-hover:text-indigo-300 transition-colors">{name}</div>
      <div className="text-sm text-white/40 truncate">{desc}</div>
    </div>
    <svg className="w-5 h-5 text-white/20 group-hover:text-white/40 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </div>
);

// Icon components
const AgentsIcon = () => (
  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const TasksIcon = () => (
  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const ActivityStatIcon = () => (
  <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);

const RocketIcon = () => (
  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);
