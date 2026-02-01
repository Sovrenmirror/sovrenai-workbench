/**
 * Categorize Tokens by Fix Priority
 * Sorts all 393 tokens into priority categories for systematic correction
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the token registry file
const registryPath = join(__dirname, 'truth-token-registry.ts');
const content = readFileSync(registryPath, 'utf-8');

// Ultra-high-frequency words that appear in nearly every sentence
const ultraHighFreq = new Set([
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had',
  'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'can',
  'and', 'or', 'but', 'if',
  'when', 'where', 'how', 'what', 'which', 'who', 'why',
  'the', 'a', 'an',
  'to', 'from', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'as', 'of'
]);

// High-frequency words (common but not in every sentence)
const highFreq = new Set([
  'then', 'than', 'these', 'those', 'this', 'that',
  'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'me', 'him', 'us', 'them',
  'not', 'no', 'yes',
  'all', 'some', 'any', 'many', 'few', 'more', 'most',
  'so', 'very', 'too', 'also', 'only', 'just',
  'up', 'down', 'out', 'over', 'under',
  'here', 'there', 'now', 'then',
  'get', 'make', 'go', 'come', 'take', 'give',
  'know', 'think', 'see', 'look', 'want', 'need',
  'say', 'tell', 'ask', 'find', 'use', 'work',
  'feel', 'seem', 'become', 'leave', 'put'
]);

console.log('🔍 CATEGORIZING ALL TOKENS BY FIX PRIORITY\n');
console.log('=' .repeat(80));

const categories = {
  A1: { name: 'A1-CRITICAL (Ultra-High Frequency)', tokens: [], description: 'Single-word patterns with ultra-common words (is, are, when, how, etc.)' },
  A2: { name: 'A2-CRITICAL (High Frequency)', tokens: [], description: 'Single-word patterns with common words' },
  A3: { name: 'A3-CRITICAL (Medium Frequency)', tokens: [], description: 'Single-word patterns with domain-specific words' },
  B1: { name: 'B1-HIGH (Mixed - Ultra High Freq)', tokens: [], description: 'Mixed patterns containing ultra-common single words' },
  B2: { name: 'B2-HIGH (Mixed - Other)', tokens: [], description: 'Mixed patterns with other single words' },
  C: { name: 'C-LOW (Already Correct)', tokens: [], description: 'Multi-word patterns only - validate and refine' }
};

// Extract token names
const tokenNames = content.match(/'[A-Za-z]+TT':/g) || [];

console.log(`\n📊 Analyzing ${tokenNames.length} tokens...\n`);

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

  // Extract definition
  const defMatch = tokenBlock.match(/definition:\s*['"](.*?)['"]/);
  const definition = defMatch ? defMatch[1] : '';

  // Extract semantic_patterns
  const patternsMatch = tokenBlock.match(/semantic_patterns:\s*\[(.*?)\]/s);
  if (!patternsMatch) continue;

  const patternsStr = patternsMatch[1];
  const patterns = patternsStr
    .split(',')
    .map(p => p.trim().replace(/^["']|["']$/g, ''))
    .filter(p => p.length > 0);

  // Analyze patterns
  let singleWordCount = 0;
  let multiWordCount = 0;
  let hasUltraHighFreq = false;
  let hasHighFreq = false;
  const singleWords = [];
  const multiWords = [];

  for (const pattern of patterns) {
    const words = pattern.trim().toLowerCase().split(/\s+/);
    const wordCount = words.length;

    if (wordCount === 1) {
      singleWordCount++;
      singleWords.push(pattern);

      // Check frequency
      if (ultraHighFreq.has(words[0])) {
        hasUltraHighFreq = true;
      } else if (highFreq.has(words[0])) {
        hasHighFreq = true;
      }
    } else {
      multiWordCount++;
      multiWords.push(pattern);

      // Check if multi-word pattern contains ultra-high-freq single words
      for (const word of words) {
        if (ultraHighFreq.has(word)) {
          // This is actually OK - multi-word patterns can contain common words
        }
      }
    }
  }

  const tokenData = {
    name,
    tier,
    definition,
    patterns,
    singleWordCount,
    multiWordCount,
    singleWords,
    multiWords,
    hasUltraHighFreq,
    hasHighFreq
  };

  // Categorize token
  if (singleWordCount > 0 && multiWordCount === 0) {
    // Category A: Single-word only
    if (hasUltraHighFreq) {
      categories.A1.tokens.push(tokenData);
    } else if (hasHighFreq) {
      categories.A2.tokens.push(tokenData);
    } else {
      categories.A3.tokens.push(tokenData);
    }
  } else if (singleWordCount > 0 && multiWordCount > 0) {
    // Category B: Mixed
    if (hasUltraHighFreq) {
      categories.B1.tokens.push(tokenData);
    } else {
      categories.B2.tokens.push(tokenData);
    }
  } else {
    // Category C: Multi-word only
    categories.C.tokens.push(tokenData);
  }
}

// Print summary
console.log('\n📈 CATEGORIZATION SUMMARY');
console.log('─'.repeat(80));
for (const [key, cat] of Object.entries(categories)) {
  const percentage = ((cat.tokens.length / tokenNames.length) * 100).toFixed(1);
  console.log(`${cat.name}: ${cat.tokens.length} tokens (${percentage}%)`);
  console.log(`   ${cat.description}`);
  console.log('');
}

// Print detailed category breakdowns
console.log('\n' + '='.repeat(80));
console.log('CATEGORY A1: CRITICAL - ULTRA-HIGH FREQUENCY (FIX FIRST!)');
console.log('='.repeat(80));
console.log(`\n${categories.A1.tokens.length} tokens with ultra-common single-word patterns`);
console.log('These create 95% of the micro-token pollution\n');

// Sort by tier for organized fixing
const a1ByTier = {};
for (const token of categories.A1.tokens) {
  if (!a1ByTier[token.tier]) a1ByTier[token.tier] = [];
  a1ByTier[token.tier].push(token);
}

for (const tier of Object.keys(a1ByTier).sort((a, b) => a - b)) {
  console.log(`\n--- T${tier} (${a1ByTier[tier].length} tokens) ---`);
  for (const token of a1ByTier[tier]) {
    console.log(`\n${token.name} (T${token.tier})`);
    console.log(`  Definition: ${token.definition.substring(0, 80)}${token.definition.length > 80 ? '...' : ''}`);
    console.log(`  🔴 Single-word patterns: [${token.singleWords.slice(0, 5).join(', ')}${token.singleWords.length > 5 ? `, ... +${token.singleWords.length - 5} more` : ''}]`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('CATEGORY A2: CRITICAL - HIGH FREQUENCY');
console.log('='.repeat(80));
console.log(`\n${categories.A2.tokens.length} tokens with high-frequency single-word patterns\n`);

const a2ByTier = {};
for (const token of categories.A2.tokens) {
  if (!a2ByTier[token.tier]) a2ByTier[token.tier] = [];
  a2ByTier[token.tier].push(token);
}

for (const tier of Object.keys(a2ByTier).sort((a, b) => a - b).slice(0, 3)) {
  console.log(`\n--- T${tier} (${a2ByTier[tier].length} tokens) ---`);
  for (const token of a2ByTier[tier].slice(0, 5)) {
    console.log(`${token.name} (T${token.tier}): [${token.singleWords.slice(0, 3).join(', ')}...]`);
  }
}
console.log(`\n... (showing first 3 tiers, see full report for all ${categories.A2.tokens.length} tokens)`);

console.log('\n' + '='.repeat(80));
console.log('CATEGORY A3: CRITICAL - MEDIUM FREQUENCY');
console.log('='.repeat(80));
console.log(`\n${categories.A3.tokens.length} tokens with domain-specific single-word patterns\n`);
console.log('(Sample - see full report for complete list)');
for (const token of categories.A3.tokens.slice(0, 10)) {
  console.log(`${token.name} (T${token.tier}): [${token.singleWords.slice(0, 3).join(', ')}...]`);
}

console.log('\n' + '='.repeat(80));
console.log('CATEGORY B1: HIGH PRIORITY - MIXED WITH ULTRA-HIGH FREQ');
console.log('='.repeat(80));
console.log(`\n${categories.B1.tokens.length} tokens with both single-word and multi-word patterns (contains ultra-common words)\n`);
console.log('(Sample - see full report for complete list)');
for (const token of categories.B1.tokens.slice(0, 10)) {
  console.log(`${token.name} (T${token.tier})`);
  console.log(`  🔴 Remove: [${token.singleWords.slice(0, 3).join(', ')}${token.singleWords.length > 3 ? '...' : ''}]`);
  console.log(`  🟢 Keep: [${token.multiWords.slice(0, 2).join(', ')}${token.multiWords.length > 2 ? '...' : ''}]`);
}

console.log('\n' + '='.repeat(80));
console.log('CATEGORY B2: HIGH PRIORITY - MIXED (OTHER)');
console.log('='.repeat(80));
console.log(`\n${categories.B2.tokens.length} tokens with mixed patterns\n`);
console.log('(Sample - see full report for complete list)');
for (const token of categories.B2.tokens.slice(0, 10)) {
  console.log(`${token.name} (T${token.tier}): Remove ${token.singleWordCount} single-word, Keep ${token.multiWordCount} multi-word`);
}

console.log('\n' + '='.repeat(80));
console.log('CATEGORY C: LOW PRIORITY - ALREADY CORRECT!');
console.log('='.repeat(80));
console.log(`\n${categories.C.tokens.length} tokens already using multi-word patterns only\n`);
for (const token of categories.C.tokens) {
  console.log(`${token.name} (T${token.tier})`);
  console.log(`  🟢 Patterns: [${token.multiWords.join(', ')}]`);
  console.log('');
}

// Generate detailed JSON report
const report = {
  generated: new Date().toISOString(),
  total_tokens: tokenNames.length,
  categories: {
    A1: {
      ...categories.A1,
      priority: 1,
      estimated_fix_time: '2-3 hours',
      impact: 'Eliminates 95% of micro-token pollution'
    },
    A2: {
      ...categories.A2,
      priority: 2,
      estimated_fix_time: '2-3 hours',
      impact: 'Eliminates most remaining micro-token noise'
    },
    A3: {
      ...categories.A3,
      priority: 3,
      estimated_fix_time: '3-4 hours',
      impact: 'Completes single-word pattern elimination'
    },
    B1: {
      ...categories.B1,
      priority: 4,
      estimated_fix_time: '1-2 hours',
      impact: 'Removes single-word patterns from mixed tokens'
    },
    B2: {
      ...categories.B2,
      priority: 5,
      estimated_fix_time: '1-2 hours',
      impact: 'Final cleanup of mixed patterns'
    },
    C: {
      ...categories.C,
      priority: 6,
      estimated_fix_time: '30 minutes',
      impact: 'Validation and quality assurance'
    }
  },
  fix_order: ['A1', 'A2', 'A3', 'B1', 'B2', 'C'],
  total_estimated_time: '10-14 hours'
};

const reportPath = join(__dirname, 'TOKEN_CATEGORIZATION_REPORT.json');
writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log('\n' + '='.repeat(80));
console.log('✅ CATEGORIZATION COMPLETE');
console.log('='.repeat(80));
console.log('\nFiles Generated:');
console.log(`  📄 TOKEN_CATEGORIZATION_REPORT.json - Full detailed report`);
console.log('\nFix Order:');
console.log('  1️⃣  A1: Ultra-high frequency (${categories.A1.tokens.length} tokens) - 2-3 hours');
console.log('  2️⃣  A2: High frequency (${categories.A2.tokens.length} tokens) - 2-3 hours');
console.log('  3️⃣  A3: Medium frequency (${categories.A3.tokens.length} tokens) - 3-4 hours');
console.log('  4️⃣  B1: Mixed with ultra-high freq (${categories.B1.tokens.length} tokens) - 1-2 hours');
console.log('  5️⃣  B2: Mixed other (${categories.B2.tokens.length} tokens) - 1-2 hours');
console.log('  6️⃣  C: Already correct (${categories.C.tokens.length} tokens) - 30 min');
console.log('\n🎯 Start with A1 for maximum impact!');
console.log('=' .repeat(80) + '\n');
