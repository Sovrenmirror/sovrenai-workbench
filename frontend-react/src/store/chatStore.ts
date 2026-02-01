/**
 * Chat Store
 * Manages chat messages and conversations
 */

import { create } from 'zustand';
import type { ChatMessage } from '../types/chat';

interface ChatStore {
  messages: ChatMessage[];
  isTyping: boolean;
  currentInput: string;

  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, update: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  setIsTyping: (typing: boolean) => void;
  setCurrentInput: (input: string) => void;

  // Selectors
  getLastMessage: () => ChatMessage | undefined;
  getMessagesByAgent: (agentId: string) => ChatMessage[];
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isTyping: false,
  currentInput: '',

  addMessage: (messageData) => {
    const message: ChatMessage = {
      ...messageData,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    set((state) => ({
      messages: [...state.messages, message]
    }));
  },

  updateMessage: (id, update) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...update } : msg
      )
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  setIsTyping: (typing) => {
    set({ isTyping: typing });
  },

  setCurrentInput: (input) => {
    set({ currentInput: input });
  },

  getLastMessage: () => {
    const messages = get().messages;
    return messages[messages.length - 1];
  },

  getMessagesByAgent: (agentId) => {
    return get().messages.filter((msg) => msg.agentId === agentId);
  }
}));
