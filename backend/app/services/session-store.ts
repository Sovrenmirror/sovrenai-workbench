/**
 * Persistent Session Store
 * Stores chat sessions in SQLite for persistence across restarts
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface StoredSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

let db: Database.Database | null = null;

/**
 * Initialize the session store database
 */
export function initSessionStore(): void {
  // Create data directory if it doesn't exist
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'sessions.db');
  db = new Database(dbPath);

  // Enable WAL mode for better concurrent performance
  db.pragma('journal_mode = WAL');

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      metadata TEXT DEFAULT '{}'
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS session_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      metadata TEXT DEFAULT '{}',
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_session_id ON session_messages(session_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON session_messages(timestamp)`);

  console.log('[SessionStore] Initialized:', dbPath);
}

/**
 * Get database instance, initializing if necessary
 */
function getDB(): Database.Database {
  if (!db) {
    initSessionStore();
  }
  return db!;
}

/**
 * Create a new session
 */
export function createSession(userId: string, sessionId?: string): StoredSession {
  const database = getDB();
  const now = new Date().toISOString();
  const id = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const stmt = database.prepare(`
    INSERT INTO sessions (id, user_id, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, '{}')
  `);
  stmt.run(id, userId, now, now);

  return {
    id,
    userId,
    messages: [],
    createdAt: now,
    updatedAt: now,
    metadata: {}
  };
}

/**
 * Get a session by ID
 */
export function getSession(sessionId: string): StoredSession | null {
  const database = getDB();

  const sessionStmt = database.prepare(`SELECT * FROM sessions WHERE id = ?`);
  const session = sessionStmt.get(sessionId) as any;

  if (!session) {
    return null;
  }

  const messagesStmt = database.prepare(`
    SELECT * FROM session_messages WHERE session_id = ? ORDER BY timestamp ASC
  `);
  const messages = messagesStmt.all(sessionId) as any[];

  return {
    id: session.id,
    userId: session.user_id,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      metadata: JSON.parse(m.metadata || '{}')
    })),
    createdAt: session.created_at,
    updatedAt: session.updated_at,
    metadata: JSON.parse(session.metadata || '{}')
  };
}

/**
 * Get all sessions for a user
 */
export function getUserSessions(userId: string, limit = 50): StoredSession[] {
  const database = getDB();

  const stmt = database.prepare(`
    SELECT * FROM sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?
  `);
  const sessions = stmt.all(userId, limit) as any[];

  return sessions.map((session) => {
    const messagesStmt = database.prepare(`
      SELECT * FROM session_messages WHERE session_id = ? ORDER BY timestamp ASC
    `);
    const messages = messagesStmt.all(session.id) as any[];

    return {
      id: session.id,
      userId: session.user_id,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        metadata: JSON.parse(m.metadata || '{}')
      })),
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      metadata: JSON.parse(session.metadata || '{}')
    };
  });
}

/**
 * Add a message to a session
 */
export function addMessage(
  sessionId: string,
  message: Omit<ChatMessage, 'id' | 'timestamp'>
): ChatMessage {
  const database = getDB();
  const now = new Date().toISOString();
  const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Insert message
  const msgStmt = database.prepare(`
    INSERT INTO session_messages (id, session_id, role, content, timestamp, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  msgStmt.run(id, sessionId, message.role, message.content, now, JSON.stringify(message.metadata || {}));

  // Update session timestamp
  const updateStmt = database.prepare(`UPDATE sessions SET updated_at = ? WHERE id = ?`);
  updateStmt.run(now, sessionId);

  return {
    id,
    role: message.role,
    content: message.content,
    timestamp: now,
    metadata: message.metadata
  };
}

/**
 * Update session metadata
 */
export function updateSessionMetadata(sessionId: string, metadata: Record<string, unknown>): void {
  const database = getDB();
  const now = new Date().toISOString();

  const stmt = database.prepare(`
    UPDATE sessions SET metadata = ?, updated_at = ? WHERE id = ?
  `);
  stmt.run(JSON.stringify(metadata), now, sessionId);
}

/**
 * Delete a session and all its messages
 */
export function deleteSession(sessionId: string): boolean {
  const database = getDB();

  // Delete messages first (or rely on CASCADE)
  const msgStmt = database.prepare(`DELETE FROM session_messages WHERE session_id = ?`);
  msgStmt.run(sessionId);

  // Delete session
  const stmt = database.prepare(`DELETE FROM sessions WHERE id = ?`);
  const result = stmt.run(sessionId);

  return result.changes > 0;
}

/**
 * Delete old sessions (cleanup)
 */
export function cleanupOldSessions(daysOld = 30): number {
  const database = getDB();
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

  // Get old session IDs
  const selectStmt = database.prepare(`SELECT id FROM sessions WHERE updated_at < ?`);
  const oldSessions = selectStmt.all(cutoff) as { id: string }[];

  if (oldSessions.length === 0) {
    return 0;
  }

  // Delete messages for old sessions
  const msgDeleteStmt = database.prepare(`DELETE FROM session_messages WHERE session_id = ?`);
  for (const session of oldSessions) {
    msgDeleteStmt.run(session.id);
  }

  // Delete old sessions
  const deleteStmt = database.prepare(`DELETE FROM sessions WHERE updated_at < ?`);
  const result = deleteStmt.run(cutoff);

  console.log(`[SessionStore] Cleaned up ${result.changes} old sessions`);
  return result.changes;
}

/**
 * Get session store statistics
 */
export function getSessionStats(): {
  totalSessions: number;
  totalMessages: number;
  activeToday: number;
} {
  const database = getDB();

  const sessionCount = (database.prepare(`SELECT COUNT(*) as count FROM sessions`).get() as any).count;
  const messageCount = (database.prepare(`SELECT COUNT(*) as count FROM session_messages`).get() as any).count;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeToday = (
    database.prepare(`SELECT COUNT(*) as count FROM sessions WHERE updated_at >= ?`).get(today.toISOString()) as any
  ).count;

  return {
    totalSessions: sessionCount,
    totalMessages: messageCount,
    activeToday
  };
}

/**
 * Close the database connection
 */
export function closeSessionStore(): void {
  if (db) {
    db.close();
    db = null;
    console.log('[SessionStore] Closed');
  }
}

/**
 * Get or create a session for a user
 */
export function getOrCreateSession(userId: string, sessionId?: string): StoredSession {
  if (sessionId) {
    const existing = getSession(sessionId);
    if (existing && existing.userId === userId) {
      return existing;
    }
  }

  // Create new session
  return createSession(userId, sessionId);
}
