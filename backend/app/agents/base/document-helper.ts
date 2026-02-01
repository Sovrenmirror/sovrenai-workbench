/**
 * Document Helper
 * Utility for agents to create documents from artifacts
 */

import { documentService } from '../../services/document-service.js';
import type { Artifact } from './agent-types.js';
import type { Document } from '../../services/document-service.js';

/**
 * Create documents from agent artifacts
 */
export async function createDocumentsFromArtifacts(
  artifacts: Artifact[],
  context: {
    userId: string;
    conversationId: string;
  }
): Promise<Document[]> {
  const documents: Document[] = [];

  for (const artifact of artifacts) {
    try {
      // Map artifact type to document type
      let docType: 'document' | 'diagram' | 'spreadsheet' | 'presentation' | 'checklist' = 'document';
      if (artifact.type === 'diagram') docType = 'diagram';
      else if (artifact.type === 'spreadsheet') docType = 'spreadsheet';
      else if (artifact.type === 'presentation') docType = 'presentation';
      else if (artifact.type === 'checklist') docType = 'checklist';

      const document = await documentService.create({
        userId: context.userId,
        conversationId: context.conversationId,
        title: artifact.title || `${artifact.type} by ${artifact.createdBy}`,
        type: docType,
        content: typeof artifact.content === 'string'
          ? artifact.content
          : JSON.stringify(artifact.content, null, 2),
        format: artifact.format,
        createdBy: artifact.createdBy,
        metadata: artifact.metadata || {}
      });

      documents.push(document);

      // Update artifact with document reference
      artifact.documentId = document.id;
      artifact.version = document.version;

      console.log(`[DocumentHelper] Created document: ${document.title} (${document.id})`);
    } catch (error: any) {
      console.error(`[DocumentHelper] Failed to create document from artifact:`, error.message);
    }
  }

  return documents;
}

/**
 * Create a single document from content
 */
export async function createDocument(params: {
  userId: string;
  conversationId: string;
  title: string;
  type: Document['type'];
  content: any;
  format: string;
  createdBy: string;
  metadata?: Record<string, any>;
}): Promise<Document> {
  const content = typeof params.content === 'string'
    ? params.content
    : JSON.stringify(params.content, null, 2);

  const document = await documentService.create({
    ...params,
    content
  });

  console.log(`[DocumentHelper] Created document: ${document.title} (${document.id})`);

  return document;
}
