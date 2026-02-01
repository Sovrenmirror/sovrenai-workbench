/**
 * Database Connection with SQLite
 * Handles document storage, versioning, and full-text search
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

let db: Database.Database | null = null;

export interface Document {
  id: string;
  name: string;
  content: string;
  tags: string; // JSON array string
  folder: string | null;
  truth_result: string | null; // JSON string
  version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface DocumentVersion {
  id: number;
  document_id: string;
  version: number;
  content: string;
  truth_result: string | null;
  created_at: string;
}

// Initialize database connection
export async function connectDB() {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'sovrenai.db');
    db = new Database(dbPath);

    console.log(`✓ Database connected: ${dbPath}`);

    // Initialize schema
    await initializeSchema();

    return { worked: true };
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Initialize database schema
async function initializeSchema() {
  if (!db) throw new Error('Database not connected');

  // Documents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      folder TEXT,
      truth_result TEXT,
      version INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_by TEXT
    )
  `);

  // Document versions table (for history tracking)
  db.exec(`
    CREATE TABLE IF NOT EXISTS document_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      content TEXT NOT NULL,
      truth_result TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

  // Document relationships table (for links between documents)
  db.exec(`
    CREATE TABLE IF NOT EXISTS document_relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_document_id TEXT NOT NULL,
      target_document_id TEXT NOT NULL,
      relationship_type TEXT DEFAULT 'references',
      created_at TEXT NOT NULL,
      FOREIGN KEY (source_document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (target_document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

  // Annotations table (for notes on documents)
  db.exec(`
    CREATE TABLE IF NOT EXISTS document_annotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

  // Full-text search virtual table
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
      document_id,
      name,
      content,
      tags
    )
  `);

  // Create indexes for performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id)`);

  console.log('✓ Database schema initialized');
}

// Get database instance
export function getDB(): Database.Database {
  if (!db) throw new Error('Database not connected');
  return db;
}

// Close database connection
export async function closeDB() {
  if (db) {
    db.close();
    db = null;
    console.log('✓ Database closed');
  }
}

// Document CRUD operations

export function createDocument(doc: Omit<Document, 'id' | 'version' | 'created_at' | 'updated_at'>): Document {
  if (!db) throw new Error('Database not connected');

  const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO documents (id, name, content, tags, folder, truth_result, version, created_at, updated_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `);

  stmt.run(id, doc.name, doc.content, doc.tags, doc.folder, doc.truth_result, now, now, doc.created_by);

  // Add to FTS
  const ftsStmt = db.prepare(`INSERT INTO documents_fts (document_id, name, content, tags) VALUES (?, ?, ?, ?)`);
  ftsStmt.run(id, doc.name, doc.content, doc.tags);

  return {
    id,
    ...doc,
    version: 1,
    created_at: now,
    updated_at: now
  };
}

export function getDocument(id: string): Document | undefined {
  if (!db) throw new Error('Database not connected');

  const stmt = db.prepare(`SELECT * FROM documents WHERE id = ?`);
  return stmt.get(id) as Document | undefined;
}

export function getAllDocuments(limit: number = 1000, offset: number = 0): Document[] {
  if (!db) throw new Error('Database not connected');

  const stmt = db.prepare(`SELECT * FROM documents ORDER BY updated_at DESC LIMIT ? OFFSET ?`);
  return stmt.all(limit, offset) as Document[];
}

export function updateDocument(id: string, updates: Partial<Document>): Document | undefined {
  if (!db) throw new Error('Database not connected');

  const currentDoc = getDocument(id);
  if (!currentDoc) return undefined;

  // Save current version to history
  const versionStmt = db.prepare(`
    INSERT INTO document_versions (document_id, version, content, truth_result, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  versionStmt.run(id, currentDoc.version, currentDoc.content, currentDoc.truth_result, currentDoc.updated_at);

  // Update document
  const now = new Date().toISOString();
  const newVersion = currentDoc.version + 1;

  const updateFields = [];
  const updateValues = [];

  if (updates.name !== undefined) {
    updateFields.push('name = ?');
    updateValues.push(updates.name);
  }
  if (updates.content !== undefined) {
    updateFields.push('content = ?');
    updateValues.push(updates.content);
  }
  if (updates.tags !== undefined) {
    updateFields.push('tags = ?');
    updateValues.push(updates.tags);
  }
  if (updates.folder !== undefined) {
    updateFields.push('folder = ?');
    updateValues.push(updates.folder);
  }
  if (updates.truth_result !== undefined) {
    updateFields.push('truth_result = ?');
    updateValues.push(updates.truth_result);
  }

  updateFields.push('version = ?', 'updated_at = ?');
  updateValues.push(newVersion, now, id);

  const stmt = db.prepare(`
    UPDATE documents
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `);
  stmt.run(...updateValues);

  // Update FTS
  const ftsStmt = db.prepare(`
    UPDATE documents_fts
    SET name = ?, content = ?, tags = ?
    WHERE document_id = ?
  `);
  ftsStmt.run(
    updates.name || currentDoc.name,
    updates.content || currentDoc.content,
    updates.tags || currentDoc.tags,
    id
  );

  return getDocument(id);
}

export function deleteDocument(id: string): boolean {
  if (!db) throw new Error('Database not connected');

  // Delete from FTS
  const ftsStmt = db.prepare(`DELETE FROM documents_fts WHERE document_id = ?`);
  ftsStmt.run(id);

  // Delete from documents (cascade will handle versions and relationships)
  const stmt = db.prepare(`DELETE FROM documents WHERE id = ?`);
  const result = stmt.run(id);

  return result.changes > 0;
}

export function getDocumentVersions(documentId: string): DocumentVersion[] {
  if (!db) throw new Error('Database not connected');

  const stmt = db.prepare(`
    SELECT * FROM document_versions
    WHERE document_id = ?
    ORDER BY version DESC
  `);
  return stmt.all(documentId) as DocumentVersion[];
}

// Full-text search
export function searchDocuments(query: string, limit: number = 50): Document[] {
  if (!db) throw new Error('Database not connected');

  const stmt = db.prepare(`
    SELECT d.* FROM documents d
    INNER JOIN documents_fts fts ON d.id = fts.document_id
    WHERE documents_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `);

  return stmt.all(query, limit) as Document[];
}

// Get documents by tag
export function getDocumentsByTag(tag: string): Document[] {
  if (!db) throw new Error('Database not connected');

  const stmt = db.prepare(`
    SELECT * FROM documents
    WHERE tags LIKE ?
    ORDER BY updated_at DESC
  `);

  return stmt.all(`%"${tag}"%`) as Document[];
}

// Get documents by folder
export function getDocumentsByFolder(folder: string | null): Document[] {
  if (!db) throw new Error('Database not connected');

  if (folder === null) {
    const stmt = db.prepare(`SELECT * FROM documents WHERE folder IS NULL ORDER BY updated_at DESC`);
    return stmt.all() as Document[];
  }

  const stmt = db.prepare(`SELECT * FROM documents WHERE folder = ? ORDER BY updated_at DESC`);
  return stmt.all(folder) as Document[];
}

// Create document relationship
export function createDocumentRelationship(
  sourceId: string,
  targetId: string,
  type: string = 'references'
): void {
  if (!db) throw new Error('Database not connected');

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO document_relationships (source_document_id, target_document_id, relationship_type, created_at)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(sourceId, targetId, type, now);
}

// Get related documents
export function getRelatedDocuments(documentId: string): Document[] {
  if (!db) throw new Error('Database not connected');

  const stmt = db.prepare(`
    SELECT d.* FROM documents d
    INNER JOIN document_relationships dr ON d.id = dr.target_document_id
    WHERE dr.source_document_id = ?
  `);

  return stmt.all(documentId) as Document[];
}

// Get all relationships
export function getAllRelationships(): any[] {
  if (!db) throw new Error('Database not connected');

  const stmt = db.prepare(`SELECT * FROM document_relationships ORDER BY created_at DESC`);
  return stmt.all();
}

// Create annotation
export function createAnnotation(documentId: string, content: string): number {
  if (!db) throw new Error('Database not connected');

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO document_annotations (document_id, content, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(documentId, content, now, now);
  return result.lastInsertRowid as number;
}

// Get annotations
export function getAnnotations(documentId: string): any[] {
  if (!db) throw new Error('Database not connected');

  const stmt = db.prepare(`
    SELECT * FROM document_annotations
    WHERE document_id = ?
    ORDER BY created_at DESC
  `);

  return stmt.all(documentId);
}

// Get database stats
export function getDatabaseStats(): {
  total_documents: number;
  total_versions: number;
  total_relationships: number;
  total_annotations: number;
} {
  if (!db) throw new Error('Database not connected');

  const docCountStmt = db.prepare(`SELECT COUNT(*) as count FROM documents`);
  const versionCountStmt = db.prepare(`SELECT COUNT(*) as count FROM document_versions`);
  const relCountStmt = db.prepare(`SELECT COUNT(*) as count FROM document_relationships`);
  const annCountStmt = db.prepare(`SELECT COUNT(*) as count FROM document_annotations`);

  return {
    total_documents: (docCountStmt.get() as any).count,
    total_versions: (versionCountStmt.get() as any).count,
    total_relationships: (relCountStmt.get() as any).count,
    total_annotations: (annCountStmt.get() as any).count
  };
}
