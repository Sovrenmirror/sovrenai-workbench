/**
 * Circuit Breaker Pattern
 * Prevents cascading failures in LLM API calls
 */

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Number of failures before opening circuit
  successThreshold?: number; // Number of successes to close circuit
  timeout?: number; // Time in ms before attempting to close circuit
  monitoringPeriod?: number; // Time window for failure tracking (ms)
}

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Blocking requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

interface CircuitStats {
  state: CircuitState;
  failures: number;
  successes: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
  openedAt: number | null;
  closedAt: number | null;
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 minute
  monitoringPeriod: 300000 // 5 minutes
};

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private openedAt: number | null = null;
  private closedAt: number | null = null;
  private options: Required<CircuitBreakerOptions>;
  private name: string;

  // Metrics
  private stats = {
    totalRequests: 0,
    totalFailures: 0,
    totalSuccesses: 0,
    recentFailures: [] as number[] // Timestamps of recent failures
  };

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.stats.totalRequests++;

    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        console.log(`[CircuitBreaker:${this.name}] Attempting reset (HALF_OPEN)`);
        this.state = CircuitState.HALF_OPEN;
      } else {
        const waitTime = this.openedAt
          ? Math.ceil((this.options.timeout - (Date.now() - this.openedAt)) / 1000)
          : 0;
        throw new CircuitBreakerError(
          `Circuit breaker is OPEN for ${this.name}. Retry in ${waitTime}s`,
          this.state
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Record successful execution
   */
  private onSuccess(): void {
    this.stats.totalSuccesses++;
    this.lastSuccessTime = Date.now();
    this.failureCount = 0;
    this.successCount++;

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successCount >= this.options.successThreshold) {
        console.log(`[CircuitBreaker:${this.name}] Circuit CLOSED (${this.successCount} successes)`);
        this.state = CircuitState.CLOSED;
        this.closedAt = Date.now();
        this.successCount = 0;
        this.openedAt = null;
      }
    }
  }

  /**
   * Record failed execution
   */
  private onFailure(): void {
    this.stats.totalFailures++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;
    this.failureCount++;
    this.stats.recentFailures.push(Date.now());

    // Clean old failures outside monitoring period
    const cutoff = Date.now() - this.options.monitoringPeriod;
    this.stats.recentFailures = this.stats.recentFailures.filter(t => t > cutoff);

    if (this.state === CircuitState.HALF_OPEN) {
      console.log(`[CircuitBreaker:${this.name}] Circuit OPEN (failed during HALF_OPEN)`);
      this.state = CircuitState.OPEN;
      this.openedAt = Date.now();
      this.failureCount = 0;
    } else if (this.failureCount >= this.options.failureThreshold) {
      console.log(`[CircuitBreaker:${this.name}] Circuit OPEN (${this.failureCount} failures)`);
      this.state = CircuitState.OPEN;
      this.openedAt = Date.now();
      this.failureCount = 0;
    }
  }

  /**
   * Check if enough time has passed to attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.openedAt) return false;
    return Date.now() - this.openedAt >= this.options.timeout;
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit statistics
   */
  getStats(): CircuitStats {
    return {
      state: this.state,
      failures: this.failureCount,
      successes: this.successCount,
      consecutiveFailures: this.failureCount,
      consecutiveSuccesses: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.stats.totalRequests,
      totalFailures: this.stats.totalFailures,
      totalSuccesses: this.stats.totalSuccesses,
      openedAt: this.openedAt,
      closedAt: this.closedAt
    };
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    console.log(`[CircuitBreaker:${this.name}] Manual reset`);
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.openedAt = null;
    this.closedAt = Date.now();
  }

  /**
   * Manually open circuit breaker
   */
  open(): void {
    console.log(`[CircuitBreaker:${this.name}] Manual open`);
    this.state = CircuitState.OPEN;
    this.openedAt = Date.now();
  }

  /**
   * Get health status
   */
  isHealthy(): boolean {
    return this.state === CircuitState.CLOSED;
  }

  /**
   * Get failure rate in monitoring period
   */
  getFailureRate(): number {
    if (this.stats.totalRequests === 0) return 0;
    const recentFailures = this.stats.recentFailures.length;
    const totalRecent = Math.max(recentFailures, 1);
    return recentFailures / totalRecent;
  }
}

/**
 * Circuit Breaker Error
 */
export class CircuitBreakerError extends Error {
  constructor(message: string, public state: CircuitState) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Circuit Breaker Manager
 * Manages multiple circuit breakers
 */
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultOptions: CircuitBreakerOptions;

  constructor(defaultOptions: CircuitBreakerOptions = {}) {
    this.defaultOptions = defaultOptions;
  }

  /**
   * Get or create a circuit breaker
   */
  getBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const breaker = new CircuitBreaker(name, { ...this.defaultOptions, ...options });
      this.breakers.set(name, breaker);
      console.log(`[CircuitBreakerManager] Created circuit breaker: ${name}`);
    }
    return this.breakers.get(name)!;
  }

  /**
   * Execute function with circuit breaker
   */
  async execute<T>(name: string, fn: () => Promise<T>, options?: CircuitBreakerOptions): Promise<T> {
    const breaker = this.getBreaker(name, options);
    return breaker.execute(fn);
  }

  /**
   * Get all circuit breaker stats
   */
  getAllStats(): Record<string, CircuitStats> {
    const stats: Record<string, CircuitStats> = {};
    for (const [name, breaker] of this.breakers.entries()) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Check if all breakers are healthy
   */
  isHealthy(): boolean {
    for (const breaker of this.breakers.values()) {
      if (!breaker.isHealthy()) return false;
    }
    return true;
  }

  /**
   * Get breaker by name
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }
}

// Singleton instance
export const circuitBreakerManager = new CircuitBreakerManager({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 minute
  monitoringPeriod: 300000 // 5 minutes
});

// Pre-configured breakers for common services
export const anthropicBreaker = circuitBreakerManager.getBreaker('anthropic', {
  failureThreshold: 3,
  timeout: 30000 // 30 seconds
});

export const azureOpenAIBreaker = circuitBreakerManager.getBreaker('azure-openai', {
  failureThreshold: 3,
  timeout: 30000
});

export const serpAPIBreaker = circuitBreakerManager.getBreaker('serp-api', {
  failureThreshold: 5,
  timeout: 60000
});
