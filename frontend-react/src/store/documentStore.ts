/**
 * Document Store
 * Manages documents and document tabs
 */

import { create } from 'zustand';
import type { Document, DocumentTab } from '../types/document';

interface DocumentStore {
  documents: Record<string, Document>;
  tabs: DocumentTab[];
  activeTabId?: string;

  // Actions
  addDocument: (document: Document) => void;
  updateDocument: (id: string, update: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  openDocument: (documentId: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  closeAllTabs: () => void;

  // Selectors
  getDocument: (id: string) => Document | undefined;
  getActiveDocument: () => Document | undefined;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: {},
  tabs: [],
  activeTabId: undefined,

  addDocument: (document) => {
    set((state) => ({
      documents: {
        ...state.documents,
        [document.id]: document
      }
    }));

    // Auto-open document in new tab
    get().openDocument(document.id);
  },

  updateDocument: (id, update) => {
    set((state) => {
      const doc = state.documents[id];
      if (!doc) return state;

      return {
        documents: {
          ...state.documents,
          [id]: {
            ...doc,
            ...update,
            updatedAt: new Date()
          }
        }
      };
    });
  },

  deleteDocument: (id) => {
    set((state) => {
      const newDocuments = { ...state.documents };
      delete newDocuments[id];

      // Close any tabs with this document
      const newTabs = state.tabs.filter((tab) => tab.documentId !== id);
      const newActiveTabId =
        state.activeTabId && state.tabs.find((t) => t.id === state.activeTabId)?.documentId === id
          ? newTabs[0]?.id
          : state.activeTabId;

      return {
        documents: newDocuments,
        tabs: newTabs,
        activeTabId: newActiveTabId
      };
    });
  },

  openDocument: (documentId) => {
    const document = get().documents[documentId];
    if (!document) return;

    // Check if already open
    const existingTab = get().tabs.find((tab) => tab.documentId === documentId);
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    // Create new tab
    const newTab: DocumentTab = {
      id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      documentId: document.id,
      title: document.title,
      type: document.type,
      isActive: true
    };

    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id
    }));
  },

  closeTab: (tabId) => {
    set((state) => {
      const newTabs = state.tabs.filter((tab) => tab.id !== tabId);

      // If closing active tab, activate another
      let newActiveTabId = state.activeTabId;
      if (state.activeTabId === tabId) {
        const closedIndex = state.tabs.findIndex((t) => t.id === tabId);
        newActiveTabId = newTabs[closedIndex]?.id || newTabs[closedIndex - 1]?.id;
      }

      return {
        tabs: newTabs,
        activeTabId: newActiveTabId
      };
    });
  },

  setActiveTab: (tabId) => {
    set({ activeTabId: tabId });
  },

  closeAllTabs: () => {
    set({ tabs: [], activeTabId: undefined });
  },

  getDocument: (id) => {
    return get().documents[id];
  },

  getActiveDocument: () => {
    const { tabs, activeTabId, documents } = get();
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    return activeTab ? documents[activeTab.documentId] : undefined;
  }
}));
