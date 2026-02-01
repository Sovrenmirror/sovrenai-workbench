/**
 * Chat Types
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId?: string;
  agentName?: string;
  agentIcon?: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  mentions?: string[]; // Agent IDs mentioned in message
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  id: string;
  type: 'document' | 'diagram' | 'data';
  name: string;
  url?: string;
  content?: any;
}

export interface AgentMention {
  id: string;
  name: string;
  icon: string;
  trigger: string; // e.g., "@researcher"
}
