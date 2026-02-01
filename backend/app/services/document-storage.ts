/**
 * Document Storage Service
 * Provides persistent storage for analyzed documents using SQLite
 */

import Database from 'better-sqlite3';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_DIR = resolve(__dirname, '../../../data');
const DB_PATH = resolve(DB_DIR, 'documents.db');

// Ensure data directory exists
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    tier INTEGER NOT NULL,
    tier_name TEXT NOT NULL,
    confidence REAL NOT NULL,
    truth_state TEXT,
    reasoning TEXT,
    tokens_matched INTEGER DEFAULT 0,
    chunks_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    tags TEXT, -- JSON array
    folder TEXT,
    metadata TEXT -- JSON object for additional data
  );

  CREATE INDEX IF NOT EXISTS idx_documents_tier ON documents(tier);
  CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at);
  CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder);

  CREATE TABLE IF NOT EXISTS document_tags (
    document_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (document_id, tag),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tags_tag ON document_tags(tag);
`);

export interface Document {
  id: string;
  title: string;
  text: string;
  tier: number;
  tier_name: string;
  confidence: number;
  truth_state?: string;
  reasoning?: string;
  tokens_matched?: number;
  chunks_count?: number;
  created_at: string;
  updated_at: string;
  tags?: string[];
  folder?: string;
  metadata?: any;
  notes?: string;
  links?: Array<{
    target_id: string;
    link_type: string;
    created_at: string;
  }>;
}

export class DocumentStorage {
  /**
   * Save a new document
   */
  save(document: Omit<Document, 'created_at' | 'updated_at'>): Document {
    const now = new Date().toISOString();
    const doc: Document = {
      ...document,
      created_at: now,
      updated_at: now
    };

    const stmt = db.prepare(`
      INSERT INTO documents (
        id, title, text, tier, tier_name, confidence, truth_state,
        reasoning, tokens_matched, chunks_count, created_at, updated_at,
        tags, folder, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      doc.id,
      doc.title,
      doc.text,
      doc.tier,
      doc.tier_name,
      doc.confidence,
      doc.truth_state || null,
      doc.reasoning || null,
      doc.tokens_matched || 0,
      doc.chunks_count || 0,
      doc.created_at,
      doc.updated_at,
      JSON.stringify(doc.tags || []),
      doc.folder || null,
      JSON.stringify(doc.metadata || {})
    );

    // Save tags to separate table
    if (doc.tags && doc.tags.length > 0) {
      const tagStmt = db.prepare('INSERT INTO document_tags (document_id, tag) VALUES (?, ?)');
      const insertTags = db.transaction((tags: string[]) => {
        for (const tag of tags) {
          tagStmt.run(doc.id, tag);
        }
      });
      insertTags(doc.tags);
    }

    console.log(`[DocumentStorage] Saved document: ${doc.id} (${doc.title})`);
    return doc;
  }

  /**
   * Get all documents with optional filters
   */
  list(options: {
    limit?: number;
    offset?: number;
    tier?: number;
    folder?: string;
    tag?: string;
    search?: string;
    sortBy?: 'created_at' | 'updated_at' | 'title' | 'tier';
    sortOrder?: 'ASC' | 'DESC';
  } = {}): { documents: Document[]; total: number } {
    const {
      limit = 100,
      offset = 0,
      tier,
      folder,
      tag,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    // Whitelist validation to prevent SQL injection
    const validSortColumns = ['created_at', 'updated_at', 'title', 'tier'];
    const validSortOrders = ['ASC', 'DESC'];

    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'DESC';

    let query = 'SELECT DISTINCT d.* FROM documents d';
    const params: any[] = [];
    const conditions: string[] = [];

    // Join with tags if filtering by tag
    if (tag) {
      query += ' INNER JOIN document_tags dt ON d.id = dt.document_id';
      conditions.push('dt.tag = ?');
      params.push(tag);
    }

    // Add filters
    if (tier !== undefined) {
      conditions.push('d.tier = ?');
      params.push(tier);
    }

    if (folder) {
      conditions.push('d.folder = ?');
      params.push(folder);
    }

    if (search) {
      conditions.push('(d.title LIKE ? OR d.text LIKE ? OR d.reasoning LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Build WHERE clause
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Get total count
    const countQuery = query.replace('SELECT DISTINCT d.*', 'SELECT COUNT(DISTINCT d.id)');
    const total = db.prepare(countQuery).pluck().get(...params) as number;

    // Add sorting and pagination (using validated values to prevent SQL injection)
    query += ` ORDER BY d.${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = db.prepare(query).all(...params) as any[];

    const documents = rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      metadata: JSON.parse(row.metadata || '{}')
    }));

    return { documents, total };
  }

  /**
   * Get a single document by ID
   */
  get(id: string): Document | null {
    const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as any;

    if (!row) return null;

    return {
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      metadata: JSON.parse(row.metadata || '{}')
    };
  }

  /**
   * Update a document
   */
  update(id: string, updates: Partial<Document>): Document | null {
    const existing = this.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };

    const stmt = db.prepare(`
      UPDATE documents SET
        title = ?, text = ?, tier = ?, tier_name = ?, confidence = ?,
        truth_state = ?, reasoning = ?, tokens_matched = ?, chunks_count = ?,
        updated_at = ?, tags = ?, folder = ?, metadata = ?
      WHERE id = ?
    `);

    stmt.run(
      updated.title,
      updated.text,
      updated.tier,
      updated.tier_name,
      updated.confidence,
      updated.truth_state || null,
      updated.reasoning || null,
      updated.tokens_matched || 0,
      updated.chunks_count || 0,
      updated.updated_at,
      JSON.stringify(updated.tags || []),
      updated.folder || null,
      JSON.stringify(updated.metadata || {}),
      id
    );

    // Update tags
    db.prepare('DELETE FROM document_tags WHERE document_id = ?').run(id);
    if (updated.tags && updated.tags.length > 0) {
      const tagStmt = db.prepare('INSERT INTO document_tags (document_id, tag) VALUES (?, ?)');
      const insertTags = db.transaction((tags: string[]) => {
        for (const tag of tags) {
          tagStmt.run(id, tag);
        }
      });
      insertTags(updated.tags);
    }

    console.log(`[DocumentStorage] Updated document: ${id}`);
    return updated;
  }

  /**
   * Delete a document
   */
  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM documents WHERE id = ?');
    const result = stmt.run(id);
    console.log(`[DocumentStorage] Deleted document: ${id}`);
    return result.changes > 0;
  }

  /**
   * Get all unique tags
   */
  getTags(): string[] {
    const rows = db.prepare('SELECT DISTINCT tag FROM document_tags ORDER BY tag').all() as any[];
    return rows.map(r => r.tag);
  }

  /**
   * Get all unique folders
   */
  getFolders(): string[] {
    const rows = db.prepare('SELECT DISTINCT folder FROM documents WHERE folder IS NOT NULL ORDER BY folder').all() as any[];
    return rows.map(r => r.folder);
  }

  /**
   * Get statistics
   */
  getStats(): {
    total_documents: number;
    by_tier: Record<number, number>;
    by_folder: Record<string, number>;
    total_tags: number;
  } {
    const total = db.prepare('SELECT COUNT(*) FROM documents').pluck().get() as number;

    const tierRows = db.prepare('SELECT tier, COUNT(*) as count FROM documents GROUP BY tier').all() as any[];
    const by_tier: Record<number, number> = {};
    tierRows.forEach(row => {
      by_tier[row.tier] = row.count;
    });

    const folderRows = db.prepare('SELECT folder, COUNT(*) as count FROM documents WHERE folder IS NOT NULL GROUP BY folder').all() as any[];
    const by_folder: Record<string, number> = {};
    folderRows.forEach(row => {
      by_folder[row.folder] = row.count;
    });

    const total_tags = db.prepare('SELECT COUNT(DISTINCT tag) FROM document_tags').pluck().get() as number;

    return {
      total_documents: total,
      by_tier,
      by_folder,
      total_tags
    };
  }

  /**
   * Close database connection
   */
  close() {
    db.close();
  }
}

// Export singleton instance
export const documentStorage = new DocumentStorage();
