/**
 * DocumentTabs Component
 * Tab bar for open documents
 */

import React from 'react';
import { useDocumentStore } from '../../store/documentStore';
import { DocumentViewer } from './DocumentViewer';

export const DocumentTabs: React.FC = () => {
  const tabs = useDocumentStore((state) => state.tabs);
  const activeTabId = useDocumentStore((state) => state.activeTabId);
  const setActiveTab = useDocumentStore((state) => state.setActiveTab);
  const closeTab = useDocumentStore((state) => state.closeTab);
  const closeAllTabs = useDocumentStore((state) => state.closeAllTabs);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return '📄';
      case 'diagram': return '📊';
      case 'spreadsheet': return '📈';
      case 'code': return '💻';
      default: return '📄';
    }
  };

  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-5xl mb-4">📂</div>
          <h3 className="text-lg font-semibold mb-2">No documents open</h3>
          <p className="text-sm">
            Documents will appear here when agents create them
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b border-gray-800 bg-gray-900 px-2 py-1 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-t border-b-2 cursor-pointer
              ${
                activeTabId === tab.id
                  ? 'bg-gray-800 border-blue-500 text-white'
                  : 'border-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
              }
            `}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{getTypeIcon(tab.type)}</span>
            <span className="text-sm font-medium whitespace-nowrap max-w-[150px] truncate">
              {tab.title}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="ml-1 text-gray-500 hover:text-gray-300"
            >
              ×
            </button>
          </div>
        ))}

        {/* Close All Button */}
        {tabs.length > 1 && (
          <button
            onClick={closeAllTabs}
            className="ml-2 px-3 py-1 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded"
          >
            Close All
          </button>
        )}
      </div>

      {/* Active Document */}
      <div className="flex-1 overflow-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`h-full ${activeTabId === tab.id ? 'block' : 'hidden'}`}
          >
            <DocumentContent documentId={tab.documentId} />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Document Content Container
 */
const DocumentContent: React.FC<{ documentId: string }> = ({ documentId }) => {
  const document = useDocumentStore((state) => state.getDocument(documentId));

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">❌</div>
          <div>Document not found</div>
        </div>
      </div>
    );
  }

  return <DocumentViewer document={document} />;
};
