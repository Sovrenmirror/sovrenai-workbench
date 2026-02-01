/**
 * Test Token Pattern Fixes
 *
 * Tests the specific improvements from fixing single-word patterns
 * to proper 3-7 word semantic phrases.
 *
 * Expected improvements:
 * - Greeting: 35,000+ tokens → ~13 tokens (99.96% reduction)
 * - Scientific fact: 50,000+ tokens → ~14 tokens (99.97% reduction)
 * - Peer review: 60,000+ tokens → ~20 tokens (99.97% reduction)
 */

import { processChemistry } from './chemistry-engine.js';

// Test cases from documentation
const TEST_CASES = [
  {
    name: 'Simple Greeting',
    text: 'How are you doing today?',
    expected_max: 20,
    description: 'Should have minimal tokens (down from 35,000+)'
  },
  {
    name: 'Scientific Fact',
    text: 'The speed of light is 299,792,458 m/s',
    expected_max: 20,
    description: 'Physical constant should match properly'
  },
  {
    name: 'Peer Review Statement',
    text: 'The study was peer reviewed and published in Nature journal',
    expected_max: 30,
    description: 'T2 evidence tokens should use multi-word patterns'
  },
  {
    name: 'Complex Statement',
    text: 'According to peer reviewed research published in Nature, the empirical evidence shows that climate change is accelerating',
    expected_max: 50,
    description: 'Complex scientific statement with multiple token types'
  }
];

/**
 * Run token matching tests
 */
function runTests() {
  console.log('='.repeat(80));
  console.log('TOKEN PATTERN FIXES - VERIFICATION TEST');
  console.log('='.repeat(80));
  console.log('');

  console.log('Testing token pattern improvements...');
  console.log('');

  // Run tests
  console.log('Test Results:');
  console.log('='.repeat(80));
  console.log('');

  let passCount = 0;
  let failCount = 0;

  for (const testCase of TEST_CASES) {
    console.log(`Test: ${testCase.name}`);
    console.log(`Input: "${testCase.text}"`);
    console.log(`Description: ${testCase.description}`);

    try {
      const result = processChemistry(testCase.text);
      const tokenCount = result.tokens?.length || 0;

      console.log(`  Token Count: ${tokenCount}`);
      console.log(`  Expected Max: ${testCase.expected_max}`);

      // Show matched tokens summary
      if (result.tokens && result.tokens.length > 0) {
        const tokensByCat = result.tokens.reduce((acc: Record<string, number>, t: any) => {
          const cat = t.category || 'Unknown';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {});

        console.log(`  Tokens by Category:`, tokensByCat);

        // Show top 5 matched tokens
        const topTokens = result.tokens.slice(0, 5).map((t: any) =>
          `${t.symbol} (T${t.tier})`
        ).join(', ');
        console.log(`  Top Tokens: ${topTokens}`);
      } else {
        console.log(`  No tokens matched (multi-word patterns working!)`);
      }

      // Show chemistry results
      console.log(`  Tier: T${result.tier} (${result.tier_name})`);
      console.log(`  Stability: ${(result.stability * 100).toFixed(1)}%`);

      // Pass if token count is below expected max
      const passed = tokenCount <= testCase.expected_max;

      if (passed) {
        console.log(`  ✅ PASS - Token count within expected range`);
        passCount++;
      } else {
        console.log(`  ❌ FAIL - Token count exceeds expected max`);
        failCount++;
      }
    } catch (error: any) {
      console.log(`  ❌ ERROR: ${error.message}`);
      failCount++;
    }

    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${TEST_CASES.length}`);
  console.log(`Passed: ${passCount} ✅`);
  console.log(`Failed: ${failCount} ❌`);
  console.log(`Pass Rate: ${((passCount / TEST_CASES.length) * 100).toFixed(1)}%`);
  console.log('');

  if (failCount === 0) {
    console.log('🎉 All token pattern fixes verified successfully!');
  } else {
    console.log('⚠️  Some tests failed - review token patterns');
  }

  return failCount === 0 ? 0 : 1;
}

// Run tests
try {
  const exitCode = runTests();
  process.exit(exitCode);
} catch (error) {
  console.error('Fatal error:', error);
  process.exit(1);
}
