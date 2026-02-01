/**
 * Token Deduplication Test
 *
 * Tests the token deduplication feature that removes duplicate
 * token matches from overlapping chunks
 */

import { UniversalChemistryEngine } from './chemistry-engine.js';

console.log('='.repeat(80));
console.log('TOKEN DEDUPLICATION TEST');
console.log('='.repeat(80));
console.log('');

// Test texts designed to create overlapping token matches
const TEST_CASES = [
  {
    name: 'Simple Greeting (baseline)',
    text: 'How are you doing today?',
    description: 'Should have minimal duplicates'
  },
  {
    name: 'Scientific Fact',
    text: 'The speed of light is 299,792,458 meters per second',
    description: 'Single fact, minimal overlap'
  },
  {
    name: 'Peer Review Statement (high overlap)',
    text: 'The study was peer reviewed and published in Nature journal',
    description: 'PeerReviewedTT should appear multiple times without dedup'
  },
  {
    name: 'Complex Scientific Statement (very high overlap)',
    text: 'According to peer reviewed research published in Nature, the empirical evidence shows that climate change is accelerating',
    description: 'Multiple overlapping scientific terms'
  },
  {
    name: 'Repeated Concept',
    text: 'The peer reviewed study was peer reviewed by three independent peer review committees',
    description: 'Same token appears multiple times legitimately'
  }
];

console.log('Testing with deduplication ENABLED vs DISABLED');
console.log('='.repeat(80));
console.log('');

// Test with deduplication enabled
console.log('Phase 1: Deduplication ENABLED (default)');
console.log('-'.repeat(80));

const engineWithDedup = new UniversalChemistryEngine();
const resultsWithDedup: any[] = [];

for (const testCase of TEST_CASES) {
  console.log(`\nTest: ${testCase.name}`);
  console.log(`Input: "${testCase.text}"`);
  console.log(`Description: ${testCase.description}`);

  const result = engineWithDedup.process(testCase.text);

  console.log(`  Chunks: ${result.chunks.length}`);
  console.log(`  Tokens: ${result.tokens.length}`);
  console.log(`  Tier: T${result.tier} (${result.tier_name})`);

  resultsWithDedup.push({
    name: testCase.name,
    chunks: result.chunks.length,
    tokens: result.tokens.length,
    tier: result.tier
  });
}

console.log('');
console.log('='.repeat(80));
console.log('Phase 2: Deduplication DISABLED');
console.log('-'.repeat(80));

// Test with deduplication disabled
const engineWithoutDedup = new UniversalChemistryEngine({
  ...engineWithDedup.getConfig(),
  deduplicateTokens: false
});

const resultsWithoutDedup: any[] = [];

for (const testCase of TEST_CASES) {
  console.log(`\nTest: ${testCase.name}`);
  console.log(`Input: "${testCase.text}"`);

  const result = engineWithoutDedup.process(testCase.text);

  console.log(`  Chunks: ${result.chunks.length}`);
  console.log(`  Tokens: ${result.tokens.length}`);
  console.log(`  Tier: T${result.tier} (${result.tier_name})`);

  resultsWithoutDedup.push({
    name: testCase.name,
    chunks: result.chunks.length,
    tokens: result.tokens.length,
    tier: result.tier
  });
}

console.log('');
console.log('='.repeat(80));
console.log('COMPARISON');
console.log('='.repeat(80));
console.log('');

console.log('Test Name                              | With Dedup | Without Dedup | Reduction');
console.log('-'.repeat(80));

let totalWithDedup = 0;
let totalWithoutDedup = 0;

for (let i = 0; i < TEST_CASES.length; i++) {
  const withDedup = resultsWithDedup[i];
  const withoutDedup = resultsWithoutDedup[i];

  const reduction = withoutDedup.tokens > 0
    ? ((1 - withDedup.tokens / withoutDedup.tokens) * 100).toFixed(1)
    : '0.0';

  const name = TEST_CASES[i].name.padEnd(38);
  const dedupCount = String(withDedup.tokens).padStart(10);
  const noDedupCount = String(withoutDedup.tokens).padStart(13);
  const reductionStr = `${reduction}%`.padStart(10);

  console.log(`${name} | ${dedupCount} | ${noDedupCount} | ${reductionStr}`);

  totalWithDedup += withDedup.tokens;
  totalWithoutDedup += withoutDedup.tokens;
}

console.log('-'.repeat(80));
const totalName = 'TOTAL'.padEnd(38);
const totalDedupCount = String(totalWithDedup).padStart(10);
const totalNoDedupCount = String(totalWithoutDedup).padStart(13);
const totalReduction = totalWithoutDedup > 0
  ? ((1 - totalWithDedup / totalWithoutDedup) * 100).toFixed(1)
  : '0.0';
const totalReductionStr = `${totalReduction}%`.padStart(10);

console.log(`${totalName} | ${totalDedupCount} | ${totalNoDedupCount} | ${totalReductionStr}`);
console.log('');

// Summary
console.log('='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log('');

if (parseFloat(totalReduction) >= 30) {
  console.log(`✅ Deduplication is EFFECTIVE (${totalReduction}% reduction)`);
  console.log(`   Before: ${totalWithoutDedup} tokens`);
  console.log(`   After:  ${totalWithDedup} tokens`);
  console.log('');
  console.log('🎯 Target: 50-70% reduction');
  if (parseFloat(totalReduction) >= 50) {
    console.log('✅ Target ACHIEVED!');
  } else {
    console.log(`⏳ Approaching target (${(50 - parseFloat(totalReduction)).toFixed(1)}% to go)`);
  }
} else {
  console.log(`⚠️  Deduplication effect lower than expected (${totalReduction}%)`);
  console.log('   This might indicate:');
  console.log('   - Token patterns already avoid overlaps');
  console.log('   - Test cases don\'t have enough overlap');
  console.log('   - OR deduplication is working but base was already good');
}

console.log('');
console.log('🎉 Deduplication test complete!');
console.log('');
