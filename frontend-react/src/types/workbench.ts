/**
 * Workbench Types
 * Types for the Sovren Workbench UI
 */

export interface WorkbenchAgent {
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
  agentName?: string;
  agentIcon?: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileItem[];
  language?: string;
  content?: string;
}

export interface Tab {
  id: string;
  name: string;
  type: 'file' | 'chat' | 'terminal' | 'agents' | 'welcome';
  icon?: string;
  content?: string;
}

export interface ActivityItem {
  id: string;
  agentId: string;
  agentName: string;
  agentIcon: string;
  action: string;
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
}

export type SidebarPanel = 'explorer' | 'agents' | 'activity';
export type BottomPanelTab = 'terminal' | 'output' | 'problems';
