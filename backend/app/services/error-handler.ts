/**
 * Advanced Error Handling System
 *
 * Provides structured error responses, error tracking, and graceful degradation
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Custom error types
 */
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  CACHE_ERROR = 'CACHE_ERROR',
  CLASSIFICATION_ERROR = 'CLASSIFICATION_ERROR'
}

/**
 * Application error class
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly details?: any;

  constructor(
    message: string,
    type: ErrorType,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error tracking
 */
class ErrorTracker {
  private errors: Map<string, number> = new Map();
  private recentErrors: AppError[] = [];
  private maxRecentErrors = 100;

  track(error: AppError) {
    // Count by type
    const count = this.errors.get(error.type) || 0;
    this.errors.set(error.type, count + 1);

    // Keep recent errors
    this.recentErrors.push(error);
    if (this.recentErrors.length > this.maxRecentErrors) {
      this.recentErrors.shift();
    }
  }

  getStats() {
    return {
      total: Array.from(this.errors.values()).reduce((sum, count) => sum + count, 0),
      by_type: Object.fromEntries(this.errors),
      recent: this.recentErrors.slice(-10).map(e => ({
        type: e.type,
        message: e.message,
        timestamp: e.timestamp
      }))
    };
  }

  clear() {
    this.errors.clear();
    this.recentErrors = [];
  }
}

export const errorTracker = new ErrorTracker();

/**
 * Error response formatter
 */
export function formatErrorResponse(error: AppError) {
  return {
    success: false,
    error: {
      type: error.type,
      message: error.message,
      timestamp: error.timestamp,
      ...(error.details && { details: error.details })
    }
  };
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Convert to AppError if it's a regular Error
  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else {
    // Unknown error - treat as internal error
    appError = new AppError(
      err.message || 'Internal server error',
      ErrorType.INTERNAL_ERROR,
      500,
      false
    );
  }

  // Track error
  errorTracker.track(appError);

  // Log error
  console.error(`[Error] ${appError.type}: ${appError.message}`);
  if (!appError.isOperational) {
    console.error('[Error] Stack:', appError.stack);
  }

  // Send response
  res.status(appError.statusCode).json(formatErrorResponse(appError));
}

/**
 * Async handler wrapper to catch promise rejections
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error helper
 */
export function validateRequest(
  condition: boolean,
  message: string,
  details?: any
): asserts condition {
  if (!condition) {
    throw new AppError(message, ErrorType.VALIDATION_ERROR, 400, true, details);
  }
}

/**
 * Not found error helper
 */
export function notFound(resource: string, id?: string) {
  const message = id
    ? `${resource} with id '${id}' not found`
    : `${resource} not found`;

  throw new AppError(message, ErrorType.NOT_FOUND, 404);
}

/**
 * Circuit breaker for external services
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new AppError(
          'Service temporarily unavailable',
          ErrorType.INTERNAL_ERROR,
          503
        );
      }
    }

    try {
      const result = await fn();

      // Success - reset if we were half-open
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      // Open circuit if threshold exceeded
      if (this.failures >= this.threshold) {
        this.state = 'open';
        console.warn(`[Circuit Breaker] Circuit opened after ${this.failures} failures`);
      }

      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailureTime
    };
  }

  reset() {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}
