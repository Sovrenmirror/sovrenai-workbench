/**
 * Input Validation Service
 * Uses Zod for runtime type validation of all API inputs
 */

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// ═══════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════

// Chat endpoint schema
export const chatInputSchema = z.object({
  message: z.string().min(1).max(10000),
  sessionId: z.string().optional(),
  personality: z.enum(['friendly', 'professional', 'concise']).optional()
});

// Authentication schemas
export const loginSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(128)
});

export const registerSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(128),
  role: z.enum(['admin', 'user', 'readonly'])
});

// Document schemas
export const documentSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  text: z.string().min(1).max(1000000),
  tier: z.number().int().min(0).max(4).optional(),
  tier_name: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  truth_state: z.string().optional(),
  reasoning: z.string().optional(),
  tokens_matched: z.number().int().min(0).optional(),
  chunks_count: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  folder: z.string().max(255).optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

export const documentListSchema = z.object({
  limit: z.number().int().min(1).max(1000).optional(),
  offset: z.number().int().min(0).optional(),
  tier: z.number().int().min(0).max(4).optional(),
  folder: z.string().max(255).optional(),
  tag: z.string().max(100).optional(),
  search: z.string().max(500).optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'title', 'tier']).optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional()
});

// Chemistry/verification schemas
export const verifyTextSchema = z.object({
  text: z.string().min(1).max(100000),
  metadata: z.record(z.string(), z.any()).optional()
});

export const batchVerifySchema = z.object({
  documents: z.array(z.object({
    id: z.string(),
    text: z.string().min(1).max(100000)
  })).min(1).max(100)
});

// Research schemas
export const researchDiscoverSchema = z.object({
  question: z.string().min(1).max(1000),
  options: z.object({
    max_rounds: z.number().int().min(1).max(10).optional(),
    auto_gather: z.boolean().optional(),
    gather_max_claims: z.number().int().min(1).max(20).optional(),
    serp_available: z.boolean().optional()
  }).optional()
});

export const researchSearchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(20).optional()
});

// Intent extraction schema
export const intentExtractSchema = z.object({
  text: z.string().min(1).max(10000)
});

// Energy calculation schema
export const energyCalculateSchema = z.object({
  formula: z.string().min(1).max(100)
});

// Deception analysis schema
export const deceptionAnalyzeSchema = z.object({
  text: z.string().min(1).max(50000),
  threshold: z.number().min(0).max(100).optional()
});

// Session schemas
export const sessionClearSchema = z.object({
  sessionId: z.string()
});

// User management schemas
export const updateRoleSchema = z.object({
  role: z.enum(['admin', 'user', 'readonly'])
});

// ═══════════════════════════════════════════════════════════════
// VALIDATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

/**
 * Create validation middleware for request body
 */
export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errors = result.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
        return;
      }

      // Replace body with validated data
      req.body = result.data;
      next();
    } catch (error: any) {
      res.status(500).json({
        error: 'Validation error',
        message: error.message
      });
    }
  };
}

/**
 * Create validation middleware for query parameters
 */
export function validateQuery<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        const errors = result.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
        return;
      }

      // Replace query with validated data
      req.query = result.data as any;
      next();
    } catch (error: any) {
      res.status(500).json({
        error: 'Validation error',
        message: error.message
      });
    }
  };
}

/**
 * Create validation middleware for URL parameters
 */
export function validateParams<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        const errors = result.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
        return;
      }

      // Replace params with validated data
      req.params = result.data as any;
      next();
    } catch (error: any) {
      res.status(500).json({
        error: 'Validation error',
        message: error.message
      });
    }
  };
}

/**
 * Utility: Validate data directly (non-middleware)
 */
export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Utility: Safe validation that returns result object
 */
export function safeValidate<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Array<{ field: string; message: string }> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.issues.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }))
  };
}

// ═══════════════════════════════════════════════════════════════
// COMMON VALIDATION UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * UUID validation regex
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Sanitize string input (remove control characters, trim)
 */
export function sanitizeString(input: string, maxLength: number = 10000): string {
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate and sanitize email
 */
export const emailSchema = z.string().email().max(255);

/**
 * Validate and sanitize URL
 */
export const urlSchema = z.string().url().max(2048);

/**
 * Validate pagination parameters
 */
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0)
});
