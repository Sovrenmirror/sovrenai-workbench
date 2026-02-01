/**
 * Session Management Service
 * Provides session storage with TTL, LRU eviction, and memory leak prevention
 */

export interface SessionOptions {
  maxSessions?: number;
  sessionTTL?: number; // milliseconds
  cleanupInterval?: number; // milliseconds
  maxSessionSize?: number; // max items per session
}

export interface SessionData {
  id: string;
  data: any;
  createdAt: Date;
  lastActivity: Date;
  accessCount: number;
}

const DEFAULT_OPTIONS: Required<SessionOptions> = {
  maxSessions: 1000,
  sessionTTL: 30 * 60 * 1000, // 30 minutes
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  maxSessionSize: 100 // max items per session
};

export class SessionManager<T = any> {
  private sessions: Map<string, SessionData> = new Map();
  private accessOrder: string[] = []; // LRU tracking
  private cleanupTimer: NodeJS.Timeout | null = null;
  private options: Required<SessionOptions>;

  // Metrics
  private stats = {
    created: 0,
    accessed: 0,
    evicted: 0,
    expired: 0,
    cleaned: 0
  };

  constructor(options: SessionOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.startCleanup();
  }

  /**
   * Create or update a session
   */
  set(sessionId: string, data: T): void {
    const now = new Date();

    // Enforce session size limit if data is an array or has length
    let sanitizedData = data;
    if (Array.isArray(data) && data.length > this.options.maxSessionSize) {
      console.warn(`[SessionManager] Session ${sessionId} exceeds size limit, truncating`);
      sanitizedData = data.slice(-this.options.maxSessionSize) as any;
    }

    // Check if session exists
    if (this.sessions.has(sessionId)) {
      // Update existing session
      const session = this.sessions.get(sessionId)!;
      session.data = sanitizedData;
      session.lastActivity = now;
      session.accessCount++;

      // Move to end of access order (most recently used)
      this.accessOrder = this.accessOrder.filter(id => id !== sessionId);
      this.accessOrder.push(sessionId);
    } else {
      // Create new session
      this.stats.created++;

      // Evict LRU session if at capacity
      if (this.sessions.size >= this.options.maxSessions) {
        this.evictLRU();
      }

      this.sessions.set(sessionId, {
        id: sessionId,
        data: sanitizedData,
        createdAt: now,
        lastActivity: now,
        accessCount: 1
      });

      this.accessOrder.push(sessionId);
    }
  }

  /**
   * Get a session by ID
   */
  get(sessionId: string): T | undefined {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return undefined;
    }

    // Check if expired
    if (this.isExpired(session)) {
      this.delete(sessionId);
      this.stats.expired++;
      return undefined;
    }

    // Update last activity and access count
    session.lastActivity = new Date();
    session.accessCount++;
    this.stats.accessed++;

    // Move to end of access order (most recently used)
    this.accessOrder = this.accessOrder.filter(id => id !== sessionId);
    this.accessOrder.push(sessionId);

    return session.data;
  }

  /**
   * Check if a session exists and is not expired
   */
  has(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (this.isExpired(session)) {
      this.delete(sessionId);
      this.stats.expired++;
      return false;
    }

    return true;
  }

  /**
   * Delete a session
   */
  delete(sessionId: string): boolean {
    const existed = this.sessions.delete(sessionId);
    if (existed) {
      this.accessOrder = this.accessOrder.filter(id => id !== sessionId);
    }
    return existed;
  }

  /**
   * Clear all sessions
   */
  clear(): void {
    this.sessions.clear();
    this.accessOrder = [];
    this.stats.cleaned++;
  }

  /**
   * Get all active session IDs
   */
  keys(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get session count
   */
  size(): number {
    return this.sessions.size;
  }

  /**
   * Get session metadata (without data)
   */
  getMetadata(sessionId: string): Omit<SessionData, 'data'> | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    return {
      id: session.id,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      accessCount: session.accessCount
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      maxSessions: this.options.maxSessions,
      sessionTTL: this.options.sessionTTL,
      ...this.stats,
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Manually trigger cleanup
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (this.isExpired(session)) {
        this.delete(sessionId);
        cleaned++;
        this.stats.expired++;
      }
    }

    if (cleaned > 0) {
      console.log(`[SessionManager] Cleaned ${cleaned} expired sessions`);
      this.stats.cleaned++;
    }

    return cleaned;
  }

  /**
   * Stop cleanup timer
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);

    console.log(`[SessionManager] Started with maxSessions=${this.options.maxSessions}, TTL=${this.options.sessionTTL}ms, cleanup every ${this.options.cleanupInterval}ms`);
  }

  /**
   * Check if session is expired
   */
  private isExpired(session: SessionData): boolean {
    const age = Date.now() - session.lastActivity.getTime();
    return age > this.options.sessionTTL;
  }

  /**
   * Evict least recently used session
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const lruSessionId = this.accessOrder[0];
    this.delete(lruSessionId);
    this.stats.evicted++;

    console.log(`[SessionManager] Evicted LRU session: ${lruSessionId}`);
  }

  /**
   * Get sessions sorted by last activity (for debugging)
   */
  getSessionsSortedByActivity(): Array<Omit<SessionData, 'data'>> {
    return Array.from(this.sessions.values())
      .map(({ id, createdAt, lastActivity, accessCount }) => ({
        id,
        createdAt,
        lastActivity,
        accessCount
      }))
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  /**
   * Force evict old sessions (keeps only N most recent)
   */
  evictOldest(keepCount: number): number {
    if (this.sessions.size <= keepCount) return 0;

    const toEvict = this.sessions.size - keepCount;
    let evicted = 0;

    for (let i = 0; i < toEvict; i++) {
      if (this.accessOrder.length > 0) {
        const oldestId = this.accessOrder[0];
        this.delete(oldestId);
        evicted++;
        this.stats.evicted++;
      }
    }

    console.log(`[SessionManager] Evicted ${evicted} oldest sessions (keeping ${keepCount})`);
    return evicted;
  }
}

// Create singleton instance for chat sessions
export const chatSessionManager = new SessionManager({
  maxSessions: 1000,
  sessionTTL: 30 * 60 * 1000, // 30 minutes
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  maxSessionSize: 100 // max 100 messages per conversation
});
