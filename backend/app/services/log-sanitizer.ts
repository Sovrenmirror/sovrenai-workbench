/**
 * Log Sanitization Service
 * Removes sensitive information from logs to prevent credential leakage
 */

export interface SanitizationConfig {
  redactPatterns?: RegExp[];
  redactKeys?: string[];
  replacement?: string;
}

const DEFAULT_CONFIG: Required<SanitizationConfig> = {
  // Patterns for sensitive data
  redactPatterns: [
    // API Keys
    /api[_-]?key["\s:=]+[a-zA-Z0-9_-]{20,}/gi,
    /bearer\s+[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/gi,

    // JWT Tokens
    /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,

    // Passwords
    /password["\s:=]+[^\s"',;}]+/gi,
    /passwd["\s:=]+[^\s"',;}]+/gi,
    /pwd["\s:=]+[^\s"',;}]+/gi,

    // Secrets
    /secret["\s:=]+[a-zA-Z0-9_-]{8,}/gi,
    /token["\s:=]+[a-zA-Z0-9_-]{20,}/gi,

    // Credit Cards
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,

    // Social Security Numbers
    /\b\d{3}-\d{2}-\d{4}\b/g,

    // Email addresses (partial redaction - keep domain)
    /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,

    // IP Addresses (partial redaction - keep first two octets)
    /\b(\d{1,3}\.\d{1,3})\.\d{1,3}\.\d{1,3}\b/g,

    // Private keys
    /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----[\s\S]+?-----END\s+(RSA\s+)?PRIVATE\s+KEY-----/g,

    // AWS Keys
    /AKIA[0-9A-Z]{16}/g,

    // Database connection strings
    /(?:mysql|postgresql|mongodb):\/\/[^\s"']+/gi
  ],

  // Keys to redact in JSON objects
  redactKeys: [
    'password',
    'passwd',
    'pwd',
    'secret',
    'token',
    'api_key',
    'apiKey',
    'apikey',
    'authorization',
    'auth',
    'cookie',
    'session',
    'jwt',
    'bearer',
    'private_key',
    'privateKey',
    'access_token',
    'accessToken',
    'refresh_token',
    'refreshToken',
    'client_secret',
    'clientSecret'
  ],

  replacement: '[REDACTED]'
};

export class LogSanitizer {
  private config: Required<SanitizationConfig>;

  constructor(config: SanitizationConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      redactPatterns: [...DEFAULT_CONFIG.redactPatterns, ...(config.redactPatterns || [])],
      redactKeys: [...DEFAULT_CONFIG.redactKeys, ...(config.redactKeys || [])]
    };
  }

  /**
   * Sanitize a log message (string or object)
   */
  sanitize(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }

    if (typeof input === 'object' && input !== null) {
      return this.sanitizeObject(input);
    }

    return input;
  }

  /**
   * Sanitize a string by applying redaction patterns
   */
  private sanitizeString(str: string): string {
    let sanitized = str;

    // Apply each redaction pattern
    for (const pattern of this.config.redactPatterns) {
      if (pattern.source.includes('(')) {
        // Patterns with capture groups (e.g., email, IP) - preserve some parts
        sanitized = sanitized.replace(pattern, (match, ...groups) => {
          // For email: keep domain, redact username
          if (match.includes('@')) {
            const domain = groups[1];
            return `${this.config.replacement}@${domain}`;
          }
          // For IP: keep first two octets
          if (match.includes('.') && /^\d/.test(match)) {
            const prefix = groups[0];
            return `${prefix}.xxx.xxx`;
          }
          return this.config.replacement;
        });
      } else {
        // Simple patterns - full redaction
        sanitized = sanitized.replace(pattern, this.config.replacement);
      }
    }

    return sanitized;
  }

  /**
   * Sanitize an object by redacting sensitive keys
   */
  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitize(item));
    }

    if (obj instanceof Date) {
      return obj;
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Check if key is in redact list
      if (this.config.redactKeys.some(redactKey => lowerKey.includes(redactKey.toLowerCase()))) {
        sanitized[key] = this.config.replacement;
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Create a sanitized console.log wrapper
   */
  createSafeLogger() {
    const sanitizer = this;

    return {
      log: (...args: any[]) => {
        console.log(...args.map(arg => sanitizer.sanitize(arg)));
      },
      error: (...args: any[]) => {
        console.error(...args.map(arg => sanitizer.sanitize(arg)));
      },
      warn: (...args: any[]) => {
        console.warn(...args.map(arg => sanitizer.sanitize(arg)));
      },
      info: (...args: any[]) => {
        console.info(...args.map(arg => sanitizer.sanitize(arg)));
      },
      debug: (...args: any[]) => {
        console.debug(...args.map(arg => sanitizer.sanitize(arg)));
      }
    };
  }
}

// Singleton instance
export const logSanitizer = new LogSanitizer();

// Safe logger for production use
export const safeLogger = logSanitizer.createSafeLogger();

/**
 * Utility: Sanitize console.log arguments in development
 */
export function enableLogSanitization() {
  if (process.env.NODE_ENV === 'production') {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    console.log = (...args: any[]) => {
      originalLog(...args.map(arg => logSanitizer.sanitize(arg)));
    };

    console.error = (...args: any[]) => {
      originalError(...args.map(arg => logSanitizer.sanitize(arg)));
    };

    console.warn = (...args: any[]) => {
      originalWarn(...args.map(arg => logSanitizer.sanitize(arg)));
    };

    console.info = (...args: any[]) => {
      originalInfo(...args.map(arg => logSanitizer.sanitize(arg)));
    };

    console.debug = (...args: any[]) => {
      originalDebug(...args.map(arg => logSanitizer.sanitize(arg)));
    };

    console.log('[LogSanitizer] Production log sanitization enabled');
  }
}
