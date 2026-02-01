/**
 * Find all invalid patterns in the token registry
 * Outputs a complete list for systematic fixing
 */

import { readFileSync } from 'fs';
import { validateRegistry, ValidationError } from './pattern-validator.js';

console.log('Finding all invalid patterns in token registry...\n');

// Read and parse the token registry file to extract TRUTH_TOKENS
const registryContent = readFileSync('./truth-token-registry.ts', 'utf-8');

// Extract tokens by evaluating the TRUTH_TOKENS object
// This is a bit hacky but works for validation purposes
const tokensMatch = registryContent.match(/const TRUTH_TOKENS[\s\S]*?= \{([\s\S]*?)\n\};/);
if (!tokensMatch) {
  throw new Error('Could not find TRUTH_TOKENS in registry file');
}

// For validation, we just need to parse the patterns
// Let's use a different approach - read all token definitions
const tokenMatches = Array.from(registryContent.matchAll(/'(\w+)':\s*\{[^}]*semantic_patterns:\s*\[([\s\S]*?)\]/g));

const tokens: Record<string, any> = {};
for (const match of tokenMatches) {
  const tokenName = match[1];
  const patternsText = match[2];
  const patterns = Array.from(patternsText.matchAll(/"([^"]+)"/g)).map(m => m[1]);

  tokens[tokenName] = {
    semantic_patterns: patterns
  };
}

const result = validateRegistry(tokens);

console.log('='.repeat(80));
console.log('INVALID PATTERNS REPORT');
console.log('='.repeat(80));
console.log('');

// Group errors by token
const errorsByToken = new Map<string, ValidationError[]>();
for (const error of result.errors) {
  if (!errorsByToken.has(error.token)) {
    errorsByToken.set(error.token, []);
  }
  errorsByToken.get(error.token)!.push(error);
}

console.log(`Total Tokens with Errors: ${errorsByToken.size}`);
console.log(`Total Pattern Errors: ${result.errors.length}`);
console.log('');

// List all tokens with errors
console.log('Tokens Needing Fixes:');
console.log('-'.repeat(80));

let tokenIndex = 1;
for (const [tokenName, errors] of errorsByToken.entries()) {
  console.log(`\n${tokenIndex}. ${tokenName}`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Invalid patterns:`);

  errors.forEach(e => {
    const wordCount = e.pattern.split(/\s+/).filter(w => w).length;
    console.log(`     - "${e.pattern}" (${wordCount} word${wordCount !== 1 ? 's' : ''})`);
  });

  tokenIndex++;
}

console.log('');
console.log('='.repeat(80));
console.log(`Total tokens to fix: ${errorsByToken.size}`);
console.log('='.repeat(80));
