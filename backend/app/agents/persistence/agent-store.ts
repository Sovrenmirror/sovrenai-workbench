/**
 * Agent State Persistence
 * Stores agent state with LRU cache and SQLite persistence
 */

import Database from 'better-sqlite3';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { AgentStatus, AgentStats, AgentTask, AgentTaskResult } from '../base/agent.js';
import { LRUCache } from '../../services/lru-cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface AgentState {
  agentId: string;
  status: AgentStatus;
  currentTask: AgentTask | null;
  stats: AgentStats;
  lastUpdated: Date;
}

export interface StorageOptions {
  dbPath?: string;
  maxCacheSize?: number;
  cacheTTL?: number; // milliseconds
}

const DEFAULT_OPTIONS: Required<StorageOptions> = {
  dbPath: resolve(__dirname, '../../../data/agents.db'),
  maxCacheSize: 100,
  cacheTTL: 3600000 // 1 hour
};

export class AgentStore {
  private db: Database.Database;
  private cache: LRUCache<AgentState>;
  private options: Required<StorageOptions>;

  constructor(options: StorageOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.cache = new LRUCache<AgentState>(
      this.options.maxCacheSize,
      this.options.cacheTTL
    );

    // Initialize database
    this.db = new Database(this.options.dbPath);
    this.initializeDatabase();
  }

  /**
   * Initialize database schema
   */
  private initializeDatabase(): void {
    // Agent state table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_states (
        agent_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        current_task TEXT,
        stats TEXT NOT NULL,
        last_updated INTEGER NOT NULL
      )
    `);

    // Task history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS task_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        status TEXT NOT NULL,
        input TEXT,
        output TEXT,
        error TEXT,
        metadata TEXT,
        started_at INTEGER NOT NULL,
        completed_at INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        FOREIGN KEY (agent_id) REFERENCES agent_states(agent_id)
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_task_history_agent_id ON task_history(agent_id);
      CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
      CREATE INDEX IF NOT EXISTS idx_task_history_started_at ON task_history(started_at);
    `);

    console.log('[AgentStore] Database initialized');
  }

  /**
   * Save agent state
   */
  saveState(state: AgentState): void {
    const cacheKey = `state:${state.agentId}`;

    // Update cache
    this.cache.set(cacheKey, state);

    // Update database
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO agent_states (agent_id, status, current_task, stats, last_updated)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      state.agentId,
      state.status,
      state.currentTask ? JSON.stringify(state.currentTask) : null,
      JSON.stringify(state.stats),
      state.lastUpdated.getTime()
    );
  }

  /**
   * Get agent state
   */
  getState(agentId: string): AgentState | null {
    const cacheKey = `state:${agentId}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Query database
    const stmt = this.db.prepare(`
      SELECT * FROM agent_states WHERE agent_id = ?
    `);

    const row = stmt.get(agentId) as any;
    if (!row) {
      return null;
    }

    const state: AgentState = {
      agentId: row.agent_id,
      status: row.status as AgentStatus,
      currentTask: row.current_task ? JSON.parse(row.current_task) : null,
      stats: JSON.parse(row.stats),
      lastUpdated: new Date(row.last_updated)
    };

    // Update cache
    this.cache.set(cacheKey, state);

    return state;
  }

  /**
   * Get all agent states
   */
  getAllStates(): AgentState[] {
    const stmt = this.db.prepare(`
      SELECT * FROM agent_states ORDER BY last_updated DESC
    `);

    const rows = stmt.all() as any[];

    return rows.map(row => ({
      agentId: row.agent_id,
      status: row.status as AgentStatus,
      currentTask: row.current_task ? JSON.parse(row.current_task) : null,
      stats: JSON.parse(row.stats),
      lastUpdated: new Date(row.last_updated)
    }));
  }

  /**
   * Delete agent state
   */
  deleteState(agentId: string): void {
    const cacheKey = `state:${agentId}`;

    // Remove from cache
    this.cache.delete(cacheKey);

    // Delete from database
    const stmt = this.db.prepare(`
      DELETE FROM agent_states WHERE agent_id = ?
    `);

    stmt.run(agentId);
  }

  /**
   * Save task result
   */
  saveTaskResult(result: AgentTaskResult): void {
    const stmt = this.db.prepare(`
      INSERT INTO task_history (
        task_id, agent_id, status, output, error, metadata,
        started_at, completed_at, duration
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      result.taskId,
      result.agentId,
      result.status,
      result.output ? JSON.stringify(result.output) : null,
      result.error ? JSON.stringify({ message: result.error.message, stack: result.error.stack }) : null,
      result.metadata ? JSON.stringify(result.metadata) : null,
      result.startedAt.getTime(),
      result.completedAt.getTime(),
      result.duration
    );
  }

  /**
   * Get task history for an agent
   */
  getTaskHistory(agentId: string, limit: number = 100): AgentTaskResult[] {
    const stmt = this.db.prepare(`
      SELECT * FROM task_history
      WHERE agent_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(agentId, limit) as any[];

    return rows.map(row => ({
      taskId: row.task_id,
      agentId: row.agent_id,
      status: row.status,
      output: row.output ? JSON.parse(row.output) : undefined,
      error: row.error ? JSON.parse(row.error) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      startedAt: new Date(row.started_at),
      completedAt: new Date(row.completed_at),
      duration: row.duration
    }));
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): AgentTaskResult | null {
    const stmt = this.db.prepare(`
      SELECT * FROM task_history WHERE task_id = ?
    `);

    const row = stmt.get(taskId) as any;
    if (!row) {
      return null;
    }

    return {
      taskId: row.task_id,
      agentId: row.agent_id,
      status: row.status,
      output: row.output ? JSON.parse(row.output) : undefined,
      error: row.error ? JSON.parse(row.error) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      startedAt: new Date(row.started_at),
      completedAt: new Date(row.completed_at),
      duration: row.duration
    };
  }

  /**
   * Get all tasks
   */
  getAllTasks(limit: number = 1000): AgentTaskResult[] {
    const stmt = this.db.prepare(`
      SELECT * FROM task_history
      ORDER BY started_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];

    return rows.map(row => ({
      taskId: row.task_id,
      agentId: row.agent_id,
      status: row.status,
      output: row.output ? JSON.parse(row.output) : undefined,
      error: row.error ? JSON.parse(row.error) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      startedAt: new Date(row.started_at),
      completedAt: new Date(row.completed_at),
      duration: row.duration
    }));
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalAgents: number;
    totalTasks: number;
    tasksByStatus: Record<string, number>;
    avgDuration: number;
  } {
    const agentCount = this.db.prepare('SELECT COUNT(*) as count FROM agent_states').get() as any;
    const taskCount = this.db.prepare('SELECT COUNT(*) as count FROM task_history').get() as any;

    const statusCounts = this.db.prepare(`
      SELECT status, COUNT(*) as count
      FROM task_history
      GROUP BY status
    `).all() as any[];

    const tasksByStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      tasksByStatus[row.status] = row.count;
    }

    const avgDuration = this.db.prepare(`
      SELECT AVG(duration) as avg FROM task_history
    `).get() as any;

    return {
      totalAgents: agentCount.count,
      totalTasks: taskCount.count,
      tasksByStatus,
      avgDuration: avgDuration.avg || 0
    };
  }

  /**
   * Clean up old tasks
   */
  cleanupOldTasks(maxAge: number = 30 * 24 * 60 * 60 * 1000): number {
    const cutoffTime = Date.now() - maxAge;

    const stmt = this.db.prepare(`
      DELETE FROM task_history WHERE started_at < ?
    `);

    const result = stmt.run(cutoffTime);
    return result.changes;
  }

  /**
   * Close database
   */
  close(): void {
    this.db.close();
  }
}

// Export singleton instance
export const agentStore = new AgentStore();
