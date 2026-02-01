/**
 * Test Complete Truth Beast Pipeline
 *
 * Tests the full 3-layer architecture:
 * 1. Token matching + preprocessing (chemistry engine)
 * 2. LLM classification (Claude/GPT/Ollama)
 * 3. Chemistry calculations (E = ΔH - T×ΔS)
 *
 * Run with: npx tsx src/truth-beast/test-complete-pipeline.ts
 */

import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

import { classify, classifySync } from './classifier.js';
import { getConfig, getConfigSummary, isLLMAvailable } from './config.js';
import { getTrainingStats } from './training-data-loader.js';
import { getTruthTokenRegistry } from './truth-token-registry.js';

// Test cases across the tier system (T0-T12)
const TEST_CASES = [
  {
    text: 'Can you help me with this task?',
    expected_tier: 0,
    expected_tier_name: 'Meta',
    description: 'T0: System self-reference'
  },
  {
    text: '2 + 2 = 4',
    expected_tier: 1,
    expected_tier_name: 'Universal',
    description: 'T1: Mathematical truth'
  },
  {
    text: 'Gravity pulls objects toward Earth at 9.8 m/s squared',
    expected_tier: 2,
    expected_tier_name: 'Physical',
    description: 'T2: Physical law'
  },
  {
    text: 'DNA contains the genetic information for living organisms',
    expected_tier: 3,
    expected_tier_name: 'Scientific',
    description: 'T3: Scientific consensus'
  },
  {
    text: 'World War II ended in 1945',
    expected_tier: 4,
    expected_tier_name: 'Historical',
    description: 'T4: Historical fact'
  },
  {
    text: 'About 60% of adults exercise regularly',
    expected_tier: 5,
    expected_tier_name: 'Probabilistic',
    description: 'T5: Statistical claim'
  },
  {
    text: 'It is polite to shake hands when greeting someone',
    expected_tier: 6,
    expected_tier_name: 'Contextual',
    description: 'T6: Cultural norm'
  },
  {
    text: 'Pizza is the best food ever',
    expected_tier: 7,
    expected_tier_name: 'Subjective',
    description: 'T7: Personal opinion'
  },
  {
    text: 'The soul continues to exist after death',
    expected_tier: 8,
    expected_tier_name: 'Spiritual',
    description: 'T8: Spiritual belief'
  },
  {
    text: 'Doctors hate this one weird trick',
    expected_tier: 9,
    expected_tier_name: 'Garbage',
    description: 'T9: Clickbait manipulation'
  },
  {
    text: 'That never happened, you must be imagining things',
    expected_tier: 11,
    expected_tier_name: 'Deceptive',
    description: 'T11: Gaslighting manipulation'
  },
  {
    text: 'This statement is false',
    expected_tier: 12,
    expected_tier_name: 'Adversarial',
    description: 'T12: Liar paradox'
  }
];

/**
 * Run all tests
 */
async function runTests() {
  console.log('='.repeat(80));
  console.log('TRUTH BEAST COMPLETE PIPELINE TEST');
  console.log('='.repeat(80));
  console.log('');

  // Display configuration
  console.log('Configuration:');
  console.log('-'.repeat(80));
  const config = getConfig();
  console.log(getConfigSummary(config));
  console.log('');

  // Display system stats
  console.log('System Stats:');
  console.log('-'.repeat(80));
  const registry = getTruthTokenRegistry();
  const trainingStats = getTrainingStats();
  console.log(`Truth Tokens: ${registry.count()} tokens`);
  console.log(`Training Examples: ${trainingStats.total} examples`);
  console.log(`  By Tier: ${Object.entries(trainingStats.byTier).map(([t, c]) => `T${t}:${c}`).join(', ')}`);
  console.log('');

  // Check if LLM is available
  const llmAvailable = isLLMAvailable(config);
  if (!llmAvailable) {
    console.log('⚠️  WARNING: LLM not available (missing API key or disabled)');
    console.log('   Tests will run in token-only mode');
    console.log('');
  }

  // Run tests
  console.log('Running Tests:');
  console.log('='.repeat(80));
  console.log('');

  let passCount = 0;
  let failCount = 0;
  const results: Array<{
    case: typeof TEST_CASES[0];
    result: any;
    passed: boolean;
  }> = [];

  for (const testCase of TEST_CASES) {
    console.log(`Test: ${testCase.description}`);
    console.log(`Input: "${testCase.text}"`);

    try {
      const startTime = Date.now();
      const result = await classify(testCase.text);
      const elapsedMs = Date.now() - startTime;

      console.log(`Result:`);
      console.log(`  Tier: T${result.tier} (${result.tier_name})`);
      console.log(`  Expected: T${testCase.expected_tier} (${testCase.expected_tier_name})`);
      console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`  State: ${result.truth_state}`);
      console.log(`  Stability: ${(result.stability * 100).toFixed(1)}%`);
      console.log(`  Entropy: ${(result.entropy * 100).toFixed(1)}%`);
      console.log(`  Energy: ${result.energy.toFixed(3)}`);
      console.log(`  Used LLM: ${result.used_llm ? '✓' : '✗'}`);
      if (result.used_llm) {
        console.log(`  LLM Provider: ${result.llm_provider}`);
        console.log(`  LLM Model: ${result.llm_model}`);
        console.log(`  LLM Verdict: ${result.llm_verdict}`);
      }
      console.log(`  Fast-path: ${result.fast_path ? '✓' : '✗'}`);
      console.log(`  Tokens Matched: ${result.tokens_matched.length}`);
      console.log(`  Latency: ${elapsedMs}ms (${result.latency_ms}ms internal)`);

      // Check if tier matches (allow ±1 tier tolerance)
      const tierDiff = Math.abs(result.tier - testCase.expected_tier);
      const passed = tierDiff <= 1;

      if (passed) {
        console.log(`✅ PASS (tier within ±1)`);
        passCount++;
      } else {
        console.log(`❌ FAIL (tier difference: ${tierDiff})`);
        failCount++;
      }

      results.push({
        case: testCase,
        result,
        passed
      });
    } catch (error) {
      console.log(`❌ ERROR: ${error}`);
      failCount++;
      results.push({
        case: testCase,
        result: null,
        passed: false
      });
    }

    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${TEST_CASES.length}`);
  console.log(`Passed: ${passCount} ✅`);
  console.log(`Failed: ${failCount} ❌`);
  console.log(`Pass Rate: ${((passCount / TEST_CASES.length) * 100).toFixed(1)}%`);
  console.log('');

  // Accuracy by tier
  const tierAccuracy: Record<number, { correct: number; total: number }> = {};
  for (const { case: testCase, result, passed } of results) {
    const tier = testCase.expected_tier;
    if (!tierAccuracy[tier]) {
      tierAccuracy[tier] = { correct: 0, total: 0 };
    }
    tierAccuracy[tier].total++;
    if (passed) {
      tierAccuracy[tier].correct++;
    }
  }

  console.log('Accuracy by Tier:');
  console.log('-'.repeat(80));
  for (const [tier, stats] of Object.entries(tierAccuracy).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))) {
    const accuracy = (stats.correct / stats.total) * 100;
    console.log(`  T${tier}: ${stats.correct}/${stats.total} (${accuracy.toFixed(0)}%)`);
  }
  console.log('');

  // Performance stats
  const avgLatency = results
    .filter(r => r.result)
    .reduce((sum, r) => sum + r.result.latency_ms, 0) / results.filter(r => r.result).length;

  const usedLLMCount = results.filter(r => r.result && r.result.used_llm).length;
  const fastPathCount = results.filter(r => r.result && r.result.fast_path).length;

  console.log('Performance:');
  console.log('-'.repeat(80));
  console.log(`  Average Latency: ${avgLatency.toFixed(0)}ms`);
  console.log(`  Used LLM: ${usedLLMCount}/${TEST_CASES.length} (${((usedLLMCount / TEST_CASES.length) * 100).toFixed(0)}%)`);
  console.log(`  Fast-path: ${fastPathCount}/${TEST_CASES.length} (${((fastPathCount / TEST_CASES.length) * 100).toFixed(0)}%)`);
  console.log('');

  // Return exit code
  return failCount === 0 ? 0 : 1;
}

/**
 * Test synchronous classification (token-only)
 */
function testSync() {
  console.log('='.repeat(80));
  console.log('SYNCHRONOUS CLASSIFICATION TEST (Token-only)');
  console.log('='.repeat(80));
  console.log('');

  const testText = '2 + 2 = 4';
  console.log(`Input: "${testText}"`);

  const result = classifySync(testText);

  console.log(`Result:`);
  console.log(`  Tier: T${result.tier} (${result.tier_name})`);
  console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`  State: ${result.truth_state}`);
  console.log(`  Stability: ${(result.stability * 100).toFixed(1)}%`);
  console.log(`  Used LLM: ${result.used_llm ? '✓' : '✗'}`);
  console.log(`  Latency: ${result.latency_ms}ms`);
  console.log('');

  if (result.tier === 1 && !result.used_llm) {
    console.log('✅ PASS: Synchronous classification working');
    return 0;
  } else {
    console.log('❌ FAIL: Unexpected result');
    return 1;
  }
}

// Main execution
async function main() {
  try {
    // Test synchronous mode
    const syncExitCode = testSync();

    // Test async mode with LLM
    const asyncExitCode = await runTests();

    const exitCode = syncExitCode + asyncExitCode;
    process.exit(exitCode);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
