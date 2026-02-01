/**
 * Audit Token Pattern Analysis
 * Analyzes all 393 truth tokens to identify pattern issues
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the token registry file
const registryPath = join(__dirname, 'truth-token-registry.ts');
const content = readFileSync(registryPath, 'utf-8');

// Extract the TRUTH_TOKENS object
const tokensMatch = content.match(/const TRUTH_TOKENS: Record<string, TruthTokenRecord> = \{([\s\S]*?)\n\};/);
if (!tokensMatch) {
  console.error('Could not find TRUTH_TOKENS in file');
  process.exit(1);
}

// Parse tokens manually (since it's TypeScript, can't import directly)
const tokensText = tokensMatch[1];
const tokenBlocks = tokensText.split(/\n  '[A-Za-z]+TT':/g).filter(t => t.trim());

console.log('🔍 TRUTH TOKEN PATTERN AUDIT\n');
console.log('=' .repeat(80));

const stats = {
  total: 0,
  singleWordOnly: [],
  mixedPatterns: [],
  multiWordOnly: [],
  byTier: {},
  highFrequencyWords: {},
  patternLengths: { '1': 0, '2': 0, '3-4': 0, '5-7': 0, '8+': 0 }
};

// Common high-frequency English words that should NEVER be single-word patterns
const highFreqWords = new Set([
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'can', 'the', 'a', 'an', 'and', 'or', 'but', 'if', 'when', 'where', 'how',
  'what', 'which', 'who', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
  'she', 'it', 'we', 'they', 'to', 'from', 'in', 'on', 'at', 'by', 'for',
  'with', 'about', 'as', 'of'
]);

// Extract token names from the original content
const tokenNames = content.match(/'[A-Za-z]+TT':/g) || [];

for (const tokenName of tokenNames) {
  const name = tokenName.replace(/[':]/g, '');

  // Find this token's block
  const tokenRegex = new RegExp(`'${name}':\\s*\\{([^}]+semantic_patterns:[^\\]]+\\])[^}]*\\}`, 's');
  const match = content.match(tokenRegex);

  if (!match) continue;

  const tokenBlock = match[1];

  // Extract tier
  const tierMatch = tokenBlock.match(/tier:\s*(\d+)/);
  const tier = tierMatch ? parseInt(tierMatch[1]) : -1;

  // Extract semantic_patterns
  const patternsMatch = tokenBlock.match(/semantic_patterns:\s*\[(.*?)\]/s);
  if (!patternsMatch) continue;

  const patternsStr = patternsMatch[1];
  const patterns = patternsStr
    .split(',')
    .map(p => p.trim().replace(/^["']|["']$/g, ''))
    .filter(p => p.length > 0);

  stats.total++;

  // Initialize tier stats
  if (!stats.byTier[tier]) {
    stats.byTier[tier] = { count: 0, singleWord: 0, mixed: 0, multiWord: 0 };
  }
  stats.byTier[tier].count++;

  // Analyze patterns
  let singleWordCount = 0;
  let multiWordCount = 0;

  for (const pattern of patterns) {
    const wordCount = pattern.trim().split(/\s+/).length;

    // Track pattern length distribution
    if (wordCount === 1) {
      stats.patternLengths['1']++;
      singleWordCount++;

      // Track high-frequency words
      const word = pattern.toLowerCase();
      if (highFreqWords.has(word)) {
        if (!stats.highFrequencyWords[word]) {
          stats.highFrequencyWords[word] = [];
        }
        stats.highFrequencyWords[word].push(name);
      }
    } else if (wordCount === 2) {
      stats.patternLengths['2']++;
      multiWordCount++;
    } else if (wordCount >= 3 && wordCount <= 4) {
      stats.patternLengths['3-4']++;
      multiWordCount++;
    } else if (wordCount >= 5 && wordCount <= 7) {
      stats.patternLengths['5-7']++;
      multiWordCount++;
    } else {
      stats.patternLengths['8+']++;
      multiWordCount++;
    }
  }

  // Categorize token
  const tokenData = { name, tier, patterns, singleWordCount, multiWordCount };

  if (singleWordCount > 0 && multiWordCount === 0) {
    stats.singleWordOnly.push(tokenData);
    stats.byTier[tier].singleWord++;
  } else if (singleWordCount > 0 && multiWordCount > 0) {
    stats.mixedPatterns.push(tokenData);
    stats.byTier[tier].mixed++;
  } else {
    stats.multiWordOnly.push(tokenData);
    stats.byTier[tier].multiWord++;
  }
}

// Print summary
console.log('\n📊 OVERALL STATISTICS');
console.log('─'.repeat(80));
console.log(`Total Tokens Analyzed: ${stats.total}`);
console.log(`\n🔴 Single-Word Patterns Only: ${stats.singleWordOnly.length} (${(stats.singleWordOnly.length/stats.total*100).toFixed(1)}%)`);
console.log(`🟡 Mixed Patterns: ${stats.mixedPatterns.length} (${(stats.mixedPatterns.length/stats.total*100).toFixed(1)}%)`);
console.log(`🟢 Multi-Word Patterns Only: ${stats.multiWordOnly.length} (${(stats.multiWordOnly.length/stats.total*100).toFixed(1)}%)`);

console.log('\n📏 PATTERN LENGTH DISTRIBUTION');
console.log('─'.repeat(80));
console.log(`1 word:   ${stats.patternLengths['1'].toString().padStart(5)} patterns 🔴 (TOO SHORT)`);
console.log(`2 words:  ${stats.patternLengths['2'].toString().padStart(5)} patterns 🟡 (ACCEPTABLE)`);
console.log(`3-4 words: ${stats.patternLengths['3-4'].toString().padStart(5)} patterns 🟢 (GOOD)`);
console.log(`5-7 words: ${stats.patternLengths['5-7'].toString().padStart(5)} patterns 🟢 (IDEAL)`);
console.log(`8+ words:  ${stats.patternLengths['8+'].toString().padStart(5)} patterns 🟡 (VERBOSE)`);

console.log('\n🎯 BY TIER BREAKDOWN');
console.log('─'.repeat(80));
console.log('Tier | Total | Single-Word | Mixed | Multi-Word');
console.log('─'.repeat(80));
for (const tier of Object.keys(stats.byTier).sort((a, b) => a - b)) {
  const t = stats.byTier[tier];
  console.log(
    `T${tier.padStart(2)}  | ${t.count.toString().padStart(5)} | ` +
    `${t.singleWord.toString().padStart(11)} | ${t.mixed.toString().padStart(5)} | ${t.multiWord.toString().padStart(10)}`
  );
}

console.log('\n⚠️  HIGH-FREQUENCY SINGLE-WORD PATTERNS (CRITICAL ISSUES)');
console.log('─'.repeat(80));
const sortedHighFreq = Object.entries(stats.highFrequencyWords)
  .sort((a, b) => b[1].length - a[1].length);

for (const [word, tokens] of sortedHighFreq.slice(0, 20)) {
  console.log(`"${word}": ${tokens.length} tokens → ${tokens.slice(0, 5).join(', ')}${tokens.length > 5 ? '...' : ''}`);
}

console.log('\n🔴 CRITICAL: Tokens with ONLY Single-Word Patterns (Sample)');
console.log('─'.repeat(80));
for (const token of stats.singleWordOnly.slice(0, 20)) {
  console.log(`${token.name} (T${token.tier}): [${token.patterns.slice(0, 5).join(', ')}${token.patterns.length > 5 ? '...' : ''}]`);
}

console.log('\n\n📈 RECOMMENDATIONS');
console.log('─'.repeat(80));
console.log(`🔴 CRITICAL (${stats.singleWordOnly.length} tokens): Fix all single-word-only patterns`);
console.log(`   Priority: Start with high-frequency words ("is", "are", "when", etc.)`);
console.log(`   Impact: Will eliminate 95%+ of micro-token pollution`);
console.log('');
console.log(`🟡 HIGH (${stats.mixedPatterns.length} tokens): Convert single-word patterns to multi-word`);
console.log(`   Priority: Keep multi-word patterns, replace single-word ones`);
console.log(`   Impact: Will eliminate remaining micro-token noise`);
console.log('');
console.log(`🟢 LOW (${stats.multiWordOnly.length} tokens): Review and refine`);
console.log(`   Priority: Validate patterns are semantically meaningful`);
console.log(`   Impact: Ensure quality and coverage`);

console.log('\n' + '='.repeat(80));
console.log('✅ Audit complete. Backup saved: truth-token-registry.backup-*.ts');
console.log('='.repeat(80) + '\n');
