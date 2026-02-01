/**
 * DocumentViewer Component
 * Displays document content based on type
 */

import React from 'react';
import type { Document } from '../../types/document';

interface DocumentViewerProps {
  document: Document;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ document }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {document.agentIcon && (
              <span className="text-2xl">{document.agentIcon}</span>
            )}
            <h1 className="text-2xl font-bold text-white">{document.title}</h1>
          </div>
          {document.agentName && (
            <p className="text-sm text-gray-400">
              Created by {document.agentName} • {document.createdAt.toLocaleString()}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          {document.type === 'document' && (
            <DocumentContent content={document.content} />
          )}
          {document.type === 'diagram' && (
            <DiagramContent content={document.content} />
          )}
          {document.type === 'spreadsheet' && (
            <SpreadsheetContent content={document.content} />
          )}
          {document.type === 'code' && (
            <CodeContent
              content={document.content}
              language={document.metadata?.language}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Document Content (Markdown/Text)
 */
const DocumentContent: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="prose prose-invert max-w-none">
      <div className="text-gray-100 whitespace-pre-wrap">{content}</div>
    </div>
  );
};

/**
 * Diagram Content (Mermaid or SVG)
 */
const DiagramContent: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="bg-white rounded p-4">
      {/* Placeholder for Mermaid rendering */}
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📊</div>
        <div className="text-gray-600 mb-4">Diagram Viewer</div>
        <pre className="text-left text-xs bg-gray-50 p-4 rounded overflow-x-auto">
          {content}
        </pre>
        <p className="text-sm text-gray-500 mt-4">
          Mermaid.js integration coming soon
        </p>
      </div>
    </div>
  );
};

/**
 * Spreadsheet Content (Table Data)
 */
const SpreadsheetContent: React.FC<{ content: string }> = ({ content }) => {
  // Parse CSV or JSON data
  let rows: string[][] = [];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      rows = parsed;
    }
  } catch {
    // Try CSV parsing
    rows = content.split('\n').map((row) => row.split(','));
  }

  if (rows.length === 0) {
    return <div className="text-gray-400 text-center py-8">No data</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            {rows[0].map((header, i) => (
              <th
                key={i}
                className="px-4 py-2 text-left text-gray-300 font-semibold"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, i) => (
            <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-gray-100">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Code Content (Syntax Highlighted)
 */
const CodeContent: React.FC<{ content: string; language?: string }> = ({
  content,
  language
}) => {
  return (
    <div>
      {language && (
        <div className="text-xs text-gray-400 mb-2 uppercase font-semibold">
          {language}
        </div>
      )}
      <pre className="text-sm text-gray-100 overflow-x-auto">
        <code>{content}</code>
      </pre>
    </div>
  );
};
