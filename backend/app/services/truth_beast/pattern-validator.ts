/**
 * Pattern Validation System
 *
 * Automatically validates truth token patterns to ensure they follow
 * the 3-7 word rule and other design guidelines.
 *
 * This prevents bugs like the micro-token explosion from ever happening again.
 */

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  token: string;
  pattern: string;
  rule: string;
  message: string;
  severity: 'error';
}

export interface ValidationWarning {
  token: string;
  pattern: string;
  rule: string;
  message: string;
  severity: 'warning';
}

/**
 * Validation rules for token patterns
 */
export const VALIDATION_RULES = {
  MIN_WORDS: 3,
  MAX_WORDS: 7,
  MIN_PATTERNS_PER_TOKEN: 1,
  RECOMMENDED_PATTERNS_PER_TOKEN: 5,
  MAX_PATTERN_LENGTH: 100, // characters
};

/**
 * Words that should NOT appear as single words in patterns
 * (ultra-common words that cause false positives)
 */
const FORBIDDEN_SINGLE_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'how', 'what', 'why', 'when', 'where', 'who', 'which',
  'and', 'or', 'but', 'if', 'then', 'so', 'as', 'for', 'to', 'of', 'in', 'on'
]);

/**
 * Validate a single pattern
 */
export function validatePattern(
  tokenName: string,
  pattern: string
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Rule 1: Check word count (3-7 words REQUIRED)
  const words = pattern.trim().split(/\s+/);
  const wordCount = words.length;

  if (wordCount < VALIDATION_RULES.MIN_WORDS) {
    errors.push({
      token: tokenName,
      pattern,
      rule: 'MIN_WORDS',
      message: `Pattern has ${wordCount} word(s), requires minimum ${VALIDATION_RULES.MIN_WORDS}. This will cause false positives!`,
      severity: 'error'
    });
  }

  if (wordCount > VALIDATION_RULES.MAX_WORDS) {
    warnings.push({
      token: tokenName,
      pattern,
      rule: 'MAX_WORDS',
      message: `Pattern has ${wordCount} words, recommended maximum is ${VALIDATION_RULES.MAX_WORDS}. May be too rigid.`,
      severity: 'warning'
    });
  }

  // Rule 2: Check for forbidden single words (if only 1 word)
  if (wordCount === 1 && FORBIDDEN_SINGLE_WORDS.has(pattern.toLowerCase())) {
    errors.push({
      token: tokenName,
      pattern,
      rule: 'FORBIDDEN_WORD',
      message: `"${pattern}" is a forbidden single-word pattern (ultra-high frequency). Use a 3-7 word phrase instead.`,
      severity: 'error'
    });
  }

  // Rule 3: Check pattern length
  if (pattern.length > VALIDATION_RULES.MAX_PATTERN_LENGTH) {
    warnings.push({
      token: tokenName,
      pattern,
      rule: 'MAX_LENGTH',
      message: `Pattern is ${pattern.length} characters, recommended maximum is ${VALIDATION_RULES.MAX_PATTERN_LENGTH}.`,
      severity: 'warning'
    });
  }

  // Rule 4: Check for empty or whitespace-only patterns
  if (!pattern.trim()) {
    errors.push({
      token: tokenName,
      pattern,
      rule: 'EMPTY_PATTERN',
      message: 'Pattern is empty or whitespace-only',
      severity: 'error'
    });
  }

  // Rule 5: Check for suspicious patterns (all lowercase single words)
  if (wordCount === 1 && pattern === pattern.toLowerCase() && pattern.length < 5) {
    warnings.push({
      token: tokenName,
      pattern,
      rule: 'SUSPICIOUS_SINGLE_WORD',
      message: `Single-word pattern "${pattern}" detected. Consider using a 3-7 word phrase for better precision.`,
      severity: 'warning'
    });
  }

  return { errors, warnings };
}

/**
 * Validate an entire token definition
 */
export function validateToken(
  tokenName: string,
  token: { semantic_patterns: string[] }
): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationWarning[] = [];

  // Check if token has patterns
  if (!token.semantic_patterns || token.semantic_patterns.length === 0) {
    allErrors.push({
      token: tokenName,
      pattern: '',
      rule: 'NO_PATTERNS',
      message: 'Token has no semantic patterns defined',
      severity: 'error'
    });
    return { valid: false, errors: allErrors, warnings: allWarnings };
  }

  // Validate each pattern
  for (const pattern of token.semantic_patterns) {
    const { errors, warnings } = validatePattern(tokenName, pattern);
    allErrors.push(...errors);
    allWarnings.push(...warnings);
  }

  // Warning if too few patterns
  if (token.semantic_patterns.length < VALIDATION_RULES.RECOMMENDED_PATTERNS_PER_TOKEN) {
    allWarnings.push({
      token: tokenName,
      pattern: '',
      rule: 'FEW_PATTERNS',
      message: `Token has ${token.semantic_patterns.length} pattern(s), recommended minimum is ${VALIDATION_RULES.RECOMMENDED_PATTERNS_PER_TOKEN}`,
      severity: 'warning'
    });
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

/**
 * Validate entire token registry
 */
export function validateRegistry(
  registry: Record<string, any>
): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationWarning[] = [];

  let tokenCount = 0;
  let patternCount = 0;

  for (const [tokenName, token] of Object.entries(registry)) {
    // Skip non-token entries (like tier definitions)
    if (!token.semantic_patterns) {
      continue;
    }

    tokenCount++;
    patternCount += token.semantic_patterns.length;

    const result = validateToken(tokenName, token);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  console.log(`\n[Validation] Checked ${tokenCount} tokens with ${patternCount} patterns`);

  if (allErrors.length === 0 && allWarnings.length === 0) {
    console.log(`[Validation] ✅ All patterns valid!`);
  } else {
    if (allErrors.length > 0) {
      console.log(`[Validation] ❌ Found ${allErrors.length} error(s)`);
    }
    if (allWarnings.length > 0) {
      console.log(`[Validation] ⚠️  Found ${allWarnings.length} warning(s)`);
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

/**
 * Format validation results for logging
 */
export function formatValidationResults(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push('\n❌ VALIDATION ERRORS:');
    lines.push('='.repeat(80));
    for (const error of result.errors) {
      lines.push(`\nToken: ${error.token}`);
      lines.push(`Rule: ${error.rule}`);
      lines.push(`Pattern: "${error.pattern}"`);
      lines.push(`Error: ${error.message}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('\n⚠️  VALIDATION WARNINGS:');
    lines.push('='.repeat(80));
    for (const warning of result.warnings) {
      lines.push(`\nToken: ${warning.token}`);
      lines.push(`Rule: ${warning.rule}`);
      if (warning.pattern) {
        lines.push(`Pattern: "${warning.pattern}"`);
      }
      lines.push(`Warning: ${warning.message}`);
    }
  }

  if (result.valid) {
    lines.push('\n✅ All validation checks passed!');
  }

  return lines.join('\n');
}

/**
 * Assert validation (throws error if invalid)
 * Use this on server startup to prevent invalid patterns from loading
 */
export function assertValidRegistry(registry: Record<string, any>): void {
  const result = validateRegistry(registry);

  if (!result.valid) {
    const formatted = formatValidationResults(result);
    console.error(formatted);
    throw new Error(
      `Token registry validation failed with ${result.errors.length} error(s). ` +
      `See console output for details. ` +
      `Fix patterns in truth-token-registry.ts to follow 3-7 word rule.`
    );
  }

  // Log warnings even if valid
  if (result.warnings.length > 0) {
    console.warn(formatValidationResults(result));
  }
}

/**
 * Get validation summary statistics
 */
export function getValidationStats(result: ValidationResult) {
  const errorsByRule = result.errors.reduce((acc, e) => {
    acc[e.rule] = (acc[e.rule] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const warningsByRule = result.warnings.reduce((acc, w) => {
    acc[w.rule] = (acc[w.rule] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalErrors: result.errors.length,
    totalWarnings: result.warnings.length,
    errorsByRule,
    warningsByRule,
    valid: result.valid
  };
}
