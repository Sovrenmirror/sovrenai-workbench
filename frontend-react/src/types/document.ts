/**
 * Document Types
 */

export type DocumentType = 'document' | 'diagram' | 'spreadsheet' | 'code';

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  content: string;
  agentId?: string;
  agentName?: string;
  agentIcon?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    language?: string; // For code documents
    mermaidType?: string; // For diagrams
    rows?: number; // For spreadsheets
    columns?: number;
  };
}

export interface DocumentTab {
  id: string;
  documentId: string;
  title: string;
  type: DocumentType;
  isActive: boolean;
}
