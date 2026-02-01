/**
 * Test A1 Token Fixes with Greetings
 * Verifies that fixing 14 critical tokens reduces micro-token pollution
 */

import { getChemistryEngine } from './chemistry-engine.js';

console.log('🧪 TESTING A1 TOKEN FIXES\n');
console.log('=' .repeat(80));
console.log('Testing after fixing 14 critical ultra-high-frequency tokens');
console.log('Expected: Token count reduced from 35,000+ to < 100');
console.log('=' .repeat(80) + '\n');

const engine = getChemistryEngine();

const testCases = [
  {
    name: 'Simple Greeting',
    text: 'How are you doing today?',
    expectedTokens: '< 20',
    beforeTokens: '35,000+'
  },
  {
    name: 'Friendly Response',
    text: "Hey! I'm doing great, thanks for asking!",
    expectedTokens: '< 30',
    beforeTokens: '40,000+'
  },
  {
    name: 'Scientific Fact',
    text: 'The speed of light is 299,792,458 m/s',
    expectedTokens: '< 50',
    beforeTokens: '50,000+'
  },
  {
    name: 'Subjective + Objective',
    text: 'I believe that climate change is real',
    expectedTokens: '< 40',
    beforeTokens: '45,000+'
  },
  {
    name: 'Conditional Statement',
    text: 'If it rains, then the ground will be wet',
    expectedTokens: '< 50',
    beforeTokens: '60,000+'
  }
];

console.log('\n📊 TEST RESULTS\n');

for (const testCase of testCases) {
  console.log('─'.repeat(80));
  console.log(`\n🧪 Test: ${testCase.name}`);
  console.log(`Text: "${testCase.text}"`);
  console.log('');

  try {
    const result = engine.process(testCase.text);

    // Count metrics
    const totalChunks = result.chunks.length;
    const totalTokens = result.tokens.length;
    const uniqueTokens = new Set(result.tokens.map(t => t.text)).size;
    const dominantTokens = result.tokens.filter(t => t.is_dominant).length;

    // Token distribution by tier
    const tierDist = {};
    for (const token of result.tokens) {
      tierDist[token.tier] = (tierDist[token.tier] || 0) + 1;
    }

    // Show top tokens
    const tokenCounts = {};
    for (const token of result.tokens) {
      tokenCounts[token.text] = (tokenCounts[token.text] || 0) + 1;
    }
    const topTokens = Object.entries(tokenCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    console.log(`📈 METRICS:`);
    console.log(`   Before (with bugs): ${testCase.beforeTokens} tokens`);
    console.log(`   Target: ${testCase.expectedTokens} tokens`);
    console.log(`   Actual: ${totalTokens} tokens`);
    console.log('');
    console.log(`   Chunks created: ${totalChunks}`);
    console.log(`   Total tokens: ${totalTokens}`);
    console.log(`   Unique token types: ${uniqueTokens}`);
    console.log(`   Dominant tokens: ${dominantTokens}`);
    console.log('');

    console.log(`📊 TOKEN DISTRIBUTION BY TIER:`);
    for (const tier of Object.keys(tierDist).sort((a, b) => a - b)) {
      console.log(`   T${tier}: ${tierDist[tier]} tokens`);
    }
    console.log('');

    console.log(`🔝 TOP 5 TOKEN TYPES:`);
    for (const [tokenName, count] of topTokens) {
      console.log(`   ${tokenName}: ${count} occurrences`);
    }
    console.log('');

    // Success/failure
    const success = totalTokens < 100;
    if (success) {
      console.log(`✅ SUCCESS: Token count is ${totalTokens} (target: ${testCase.expectedTokens})`);
      console.log(`   Improvement: ${testCase.beforeTokens} → ${totalTokens} tokens`);
    } else {
      console.log(`❌ NEEDS WORK: Token count is ${totalTokens} (target: ${testCase.expectedTokens})`);
      console.log(`   Still too high - need more pattern fixes`);
    }

    // Show sample tokens with their patterns
    if (totalTokens > 0) {
      console.log('');
      console.log(`📋 SAMPLE TOKENS (first 10):`);
      for (const token of result.tokens.slice(0, 10)) {
        console.log(`   ${token.text} (T${token.tier}) - "${token.matched_pattern}" in chunk "${token.chunk}"`);
      }
    }

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    console.error(error);
  }

  console.log('');
}

console.log('─'.repeat(80));
console.log('\n📈 SUMMARY\n');
console.log('If token counts are < 100 for all tests: ✅ A1 fixes are working!');
console.log('If token counts are still > 1000: ❌ Need to fix more tokens (A2, A3)');
console.log('');
console.log('Next steps:');
console.log('  1. If successful: Add deduplication (Task 8)');
console.log('  2. Continue fixing remaining tokens (A2, A3)');
console.log('  3. Test with large document (README.md)');
console.log('');
console.log('=' .repeat(80) + '\n');
