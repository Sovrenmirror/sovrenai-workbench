/**
 * Document Service
 * Manages documents created by agents with versioning support
 */

import Database from 'better-sqlite3';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface Document {
  id: string;
  userId: string;
  conversationId: string;
  title: string;
  type: 'document' | 'diagram' | 'spreadsheet' | 'presentation' | 'checklist';
  content: string;
  format: string; // markdown, mermaid, json, etc.
  version: number;
  status: 'creating' | 'ready' | 'accepted' | 'archived';
  createdBy: string; // agent name
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
  notes?: string;
  links?: Array<{
    target_id: string;
    link_type: string;
    created_at: string;
  }>;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  changeDescription: string;
  changedBy: string;
  createdAt: Date;
}

class DocumentService {
  private db: Database.Database;

  constructor() {
    const dbPath = resolve(__dirname, '../../data/documents.db');
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  /**
   * Initialize database schema
   */
  private initializeDatabase(): void {
    // Documents table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        format TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        metadata TEXT
      )
    `);

    // Document versions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS document_versions (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        content TEXT NOT NULL,
        change_description TEXT NOT NULL,
        changed_by TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_documents_conversation_id ON documents(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
      CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
      CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
    `);

    console.log('[DocumentService] Database initialized');
  }

  /**
   * Create a new document
   */
  async create(params: {
    userId: string;
    conversationId: string;
    title: string;
    type: Document['type'];
    content: string;
    format: string;
    createdBy: string;
    metadata?: Record<string, any>;
  }): Promise<Document> {
    const id = this.generateId();
    const now = Date.now();

    const doc: Document = {
      id,
      userId: params.userId,
      conversationId: params.conversationId,
      title: params.title,
      type: params.type,
      content: params.content,
      format: params.format,
      version: 1,
      status: 'ready',
      createdBy: params.createdBy,
      createdAt: new Date(now),
      updatedAt: new Date(now),
      metadata: params.metadata || {}
    };

    // Insert document
    const stmt = this.db.prepare(`
      INSERT INTO documents (
        id, user_id, conversation_id, title, type, content, format,
        version, status, created_by, created_at, updated_at, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      doc.id,
      doc.userId,
      doc.conversationId,
      doc.title,
      doc.type,
      doc.content,
      doc.format,
      doc.version,
      doc.status,
      doc.createdBy,
      now,
      now,
      JSON.stringify(doc.metadata)
    );

    // Create initial version
    await this.createVersion(id, {
      content: params.content,
      changeDescription: 'Initial creation',
      changedBy: params.createdBy
    });

    console.log(`[DocumentService] Created document: ${doc.title} (${doc.id})`);

    return doc;
  }

  /**
   * Update a document
   */
  async update(id: string, params: {
    content?: string;
    title?: string;
    status?: Document['status'];
    changeDescription: string;
    changedBy: string;
  }): Promise<Document | null> {
    const doc = await this.get(id);
    if (!doc) return null;

    const previousContent = doc.content;
    const now = Date.now();

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (params.content !== undefined) {
      updates.push('content = ?');
      values.push(params.content);
      doc.content = params.content;
    }

    if (params.title !== undefined) {
      updates.push('title = ?');
      values.push(params.title);
      doc.title = params.title;
    }

    if (params.status !== undefined) {
      updates.push('status = ?');
      values.push(params.status);
      doc.status = params.status;
    }

    updates.push('version = version + 1');
    updates.push('updated_at = ?');
    values.push(now);

    values.push(id);

    // Update document
    const stmt = this.db.prepare(`
      UPDATE documents
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    // Create new version if content changed
    if (params.content && params.content !== previousContent) {
      await this.createVersion(id, {
        content: params.content,
        changeDescription: params.changeDescription,
        changedBy: params.changedBy
      });
    }

    // Fetch updated document
    return this.get(id);
  }

  /**
   * Create a new version
   */
  async createVersion(documentId: string, params: {
    content: string;
    changeDescription: string;
    changedBy: string;
  }): Promise<DocumentVersion> {
    const doc = await this.get(documentId);
    if (!doc) throw new Error('Document not found');

    const id = this.generateId();
    const now = Date.now();

    const version: DocumentVersion = {
      id,
      documentId,
      version: doc.version,
      content: params.content,
      changeDescription: params.changeDescription,
      changedBy: params.changedBy,
      createdAt: new Date(now)
    };

    const stmt = this.db.prepare(`
      INSERT INTO document_versions (
        id, document_id, version, content, change_description, changed_by, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      version.id,
      version.documentId,
      version.version,
      version.content,
      version.changeDescription,
      version.changedBy,
      now
    );

    return version;
  }

  /**
   * Get a document by ID
   */
  async get(id: string): Promise<Document | null> {
    const stmt = this.db.prepare('SELECT * FROM documents WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToDocument(row);
  }

  /**
   * Get documents by conversation
   */
  async getByConversation(conversationId: string): Promise<Document[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM documents
      WHERE conversation_id = ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(conversationId) as any[];
    return rows.map(row => this.rowToDocument(row));
  }

  /**
   * Get documents by user
   */
  async getByUser(userId: string, limit: number = 100): Promise<Document[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM documents
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(userId, limit) as any[];
    return rows.map(row => this.rowToDocument(row));
  }

  /**
   * Get document versions
   */
  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM document_versions
      WHERE document_id = ?
      ORDER BY version DESC
    `);

    const rows = stmt.all(documentId) as any[];
    return rows.map(row => this.rowToVersion(row));
  }

  /**
   * Get specific version
   */
  async getVersion(documentId: string, version: number): Promise<DocumentVersion | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM document_versions
      WHERE document_id = ? AND version = ?
    `);

    const row = stmt.get(documentId, version) as any;
    return row ? this.rowToVersion(row) : null;
  }

  /**
   * Revert to specific version
   */
  async revertToVersion(documentId: string, version: number, changedBy: string): Promise<Document | null> {
    const targetVersion = await this.getVersion(documentId, version);
    if (!targetVersion) return null;

    return this.update(documentId, {
      content: targetVersion.content,
      changeDescription: `Reverted to version ${version}`,
      changedBy
    });
  }

  /**
   * Accept a document
   */
  async accept(id: string, userId: string): Promise<Document | null> {
    return this.update(id, {
      status: 'accepted',
      changeDescription: 'Accepted by user',
      changedBy: userId
    });
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM documents WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Convert database row to Document
   */
  private rowToDocument(row: any): Document {
    return {
      id: row.id,
      userId: row.user_id,
      conversationId: row.conversation_id,
      title: row.title,
      type: row.type,
      content: row.content,
      format: row.format,
      version: row.version,
      status: row.status,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    };
  }

  /**
   * Convert database row to DocumentVersion
   */
  private rowToVersion(row: any): DocumentVersion {
    return {
      id: row.id,
      documentId: row.document_id,
      version: row.version,
      content: row.content,
      changeDescription: row.change_description,
      changedBy: row.changed_by,
      createdAt: new Date(row.created_at)
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

// Export singleton instance
export const documentService = new DocumentService();
