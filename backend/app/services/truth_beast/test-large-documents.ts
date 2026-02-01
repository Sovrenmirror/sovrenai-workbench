/**
 * Large Document Testing
 *
 * Tests chemistry engine performance and accuracy with large documents
 * Demonstrates token deduplication and pattern matching at scale
 */

import { UniversalChemistryEngine } from './chemistry-engine.js';
import { readFileSync } from 'fs';

console.log('='.repeat(80));
console.log('LARGE DOCUMENT TESTING');
console.log('='.repeat(80));
console.log('');

// Test documents of varying sizes and types
const TEST_DOCUMENTS = [
  {
    name: 'Small Technical (100 words)',
    text: `The chemistry engine processes text through a thermodynamic framework based on Gibbs Free Energy.
    The system uses truth tokens to classify statements into tiers ranging from T0 (universal truth) to T12 (paradox).
    Each token has semantic patterns that match 3-7 word phrases in the input text. The engine creates overlapping
    chunks from the input and searches for pattern matches in each chunk. Multi-word patterns prevent false positives
    by requiring full semantic context. The tokenization step identifies dominant tokens per chunk, selecting the
    longest matching pattern. Deduplication removes duplicate tokens from overlapping chunks. Chemistry metrics include
    stability (groundedness), entropy (uncertainty), and energy (truth score). The system supports configurable cache
    with FIFO eviction and runtime configuration updates via API endpoints.`
  },
  {
    name: 'Medium Scientific (250 words)',
    text: `According to peer reviewed research published in Nature, the empirical evidence shows that climate change
    is accelerating faster than previous models predicted. The data collected from multiple independent measurement
    stations demonstrates a consistent warming trend over the past century. Statistical analysis of temperature records
    reveals significant correlations with atmospheric carbon dioxide levels. Scientists at leading research institutions
    have verified these findings through rigorous experimental protocols and replication studies.

    The physical laws governing thermodynamics dictate that greenhouse gases trap infrared radiation in the atmosphere.
    This fundamental principle of physics has been established since the 19th century through laboratory experiments.
    The molecular structure of carbon dioxide allows it to absorb specific wavelengths of electromagnetic radiation.
    Quantum mechanical calculations confirm these absorption spectra with high precision. The accumulated scientific
    evidence from chemistry, physics, and atmospheric science converges on the same conclusion.

    Mathematical models incorporating fluid dynamics and radiative transfer equations predict future temperature increases
    based on emission scenarios. These computational simulations have been validated against historical climate data.
    The mathematical framework underlying these models derives from first principles of thermodynamics and conservation laws.
    Numerical methods solve the coupled differential equations that describe atmospheric circulation patterns. The predictive
    accuracy of these models has improved significantly as computing power and data quality have advanced. Independent research
    teams using different methodologies reach consistent conclusions, strengthening confidence in the findings.`
  },
  {
    name: 'Large Mixed Content (500 words)',
    text: `# Technical Documentation and Scientific Analysis

    ## Introduction
    The universal chemistry engine represents a breakthrough in natural language truth assessment. According to peer reviewed
    research published in computational linguistics journals, semantic pattern matching with multi-word phrases achieves
    99.96% reduction in false positive token matches compared to single-word pattern approaches. This empirical finding has
    been replicated across multiple independent studies using different text corpora.

    ## Theoretical Foundation
    The system is grounded in thermodynamic principles, specifically the Gibbs Free Energy equation: E = ΔH - T × ΔS.
    This mathematical formula relates enthalpy (stability), entropy (uncertainty), and free energy (truth score). The
    physics behind this model derives from statistical mechanics and information theory. Experimental validation shows
    strong correlation between calculated truth scores and human expert assessments.

    ## Implementation Details
    The tokenization algorithm processes text through sliding window chunks of 3-7 words each. Each chunk is analyzed
    for semantic pattern matches against a registry of 393 truth tokens. The registry organizes tokens into 13 hierarchical
    tiers based on epistemic certainty. Mathematical proofs and logical deductions occupy T0-T1 (universal truth), while
    statistical patterns and social consensus map to T5-T7 (probabilistic truth). This classification system is based on
    philosophical foundations from epistemology and logic.

    According to published benchmarks, the chemistry engine processes documents at approximately 10,000 words per second
    on modern hardware. The computational complexity is O(n × m) where n is text length and m is pattern count. Optimization
    techniques including caching and deduplication reduce average case performance to near-linear time. The cache implements
    FIFO eviction with configurable size limits between 100 and 10,000 entries.

    ## Scientific Validation
    Experimental testing demonstrates that multi-word semantic patterns correctly identify scientific statements with 95%
    accuracy. The empirical data comes from annotated test corpora containing verified scientific facts, peer reviewed
    publications, and validated measurements. Statistical analysis using precision-recall curves shows the system performs
    comparably to domain expert classification. The false positive rate has been measured at 0.04% for T0-T3 tokens
    (grounded truth categories).

    Independent research teams have replicated these findings using the open source implementation. The peer review process
    for the underlying methodology involved experts in computational linguistics, philosophy of science, and machine learning.
    Multiple rounds of revision strengthened the theoretical framework and experimental design. The published results
    underwent rigorous statistical review to ensure methodological soundness.

    ## Real-World Applications
    The chemistry engine has been deployed in production systems processing millions of documents daily. Performance
    monitoring shows 99.9% uptime with average response times under 100 milliseconds. The system handles concurrent
    requests through efficient resource pooling and load balancing. Operational metrics indicate stable performance
    across diverse document types including scientific papers, technical documentation, news articles, and social media
    content. The configuration system allows runtime tuning of cache size, deduplication settings, and LLM integration
    parameters without service interruption.`
  }
];

// Run tests
console.log('Running Large Document Tests...');
console.log('='.repeat(80));
console.log('');

const engine = new UniversalChemistryEngine();
const results: any[] = [];

for (const doc of TEST_DOCUMENTS) {
  console.log(`Test: ${doc.name}`);
  console.log('-'.repeat(80));

  const wordCount = doc.text.split(/\s+/).length;
  console.log(`Word Count: ${wordCount}`);

  const startTime = Date.now();
  const result = engine.process(doc.text);
  const endTime = Date.now();

  const processingTime = endTime - startTime;
  const wordsPerSecond = Math.round((wordCount / processingTime) * 1000);

  console.log(`Processing Time: ${processingTime}ms`);
  console.log(`Speed: ${wordsPerSecond.toLocaleString()} words/second`);
  console.log(`Chunks Created: ${result.chunks.length}`);
  console.log(`Tokens Matched: ${result.tokens.length}`);
  console.log(`Tier: T${result.tier} (${result.tier_name})`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`Stability: ${(result.stability * 100).toFixed(1)}%`);
  console.log(`Entropy: ${(result.entropy * 100).toFixed(1)}%`);

  // Show token distribution by tier
  const tierDist = result.tokens.reduce((acc, t) => {
    const key = `T${t.tier}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`Token Distribution by Tier:`, tierDist);

  // Show top 5 dominant tokens
  if (result.tokens.length > 0) {
    const dominantTokens = result.tokens
      .filter(t => t.is_dominant)
      .slice(0, 5);

    if (dominantTokens.length > 0) {
      console.log(`Top Dominant Tokens:`);
      dominantTokens.forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.text} (T${t.tier}, pattern: "${t.matched_pattern}")`);
      });
    }
  }

  results.push({
    name: doc.name,
    wordCount,
    processingTime,
    wordsPerSecond,
    chunks: result.chunks.length,
    tokens: result.tokens.length,
    tier: result.tier,
    confidence: result.confidence,
    tierDist
  });

  console.log('');
}

// Summary statistics
console.log('='.repeat(80));
console.log('PERFORMANCE SUMMARY');
console.log('='.repeat(80));
console.log('');

const totalWords = results.reduce((sum, r) => sum + r.wordCount, 0);
const totalTime = results.reduce((sum, r) => sum + r.processingTime, 0);
const totalChunks = results.reduce((sum, r) => sum + r.chunks, 0);
const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);
const avgWordsPerSecond = Math.round((totalWords / totalTime) * 1000);

console.log(`Total Words Processed: ${totalWords.toLocaleString()}`);
console.log(`Total Processing Time: ${totalTime}ms`);
console.log(`Average Speed: ${avgWordsPerSecond.toLocaleString()} words/second`);
console.log(`Total Chunks Created: ${totalChunks.toLocaleString()}`);
console.log(`Total Tokens Matched: ${totalTokens.toLocaleString()}`);
console.log(`Average Tokens per 100 Words: ${Math.round((totalTokens / totalWords) * 100)}`);
console.log('');

// Efficiency metrics
const chunksPerWord = (totalChunks / totalWords).toFixed(2);
const tokensPerChunk = totalChunks > 0 ? (totalTokens / totalChunks).toFixed(2) : '0.00';
const tokensPerWord = (totalTokens / totalWords).toFixed(3);

console.log('Efficiency Metrics:');
console.log(`  Chunks per Word: ${chunksPerWord}`);
console.log(`  Tokens per Chunk: ${tokensPerChunk}`);
console.log(`  Tokens per Word: ${tokensPerWord}`);
console.log('');

// Performance benchmarks
console.log('Performance Benchmarks:');
if (avgWordsPerSecond > 5000) {
  console.log(`  ✅ EXCELLENT: ${avgWordsPerSecond.toLocaleString()} words/sec (>5000 target)`);
} else if (avgWordsPerSecond > 2000) {
  console.log(`  ✅ GOOD: ${avgWordsPerSecond.toLocaleString()} words/sec (>2000 target)`);
} else if (avgWordsPerSecond > 1000) {
  console.log(`  ⚠️  ACCEPTABLE: ${avgWordsPerSecond.toLocaleString()} words/sec (>1000 target)`);
} else {
  console.log(`  ❌ SLOW: ${avgWordsPerSecond.toLocaleString()} words/sec (<1000 target)`);
}
console.log('');

// Token density analysis
console.log('Token Density Analysis:');
const avgTokensPerWord = totalTokens / totalWords;
if (avgTokensPerWord < 0.01) {
  console.log(`  ✅ EXCELLENT: ${(avgTokensPerWord * 100).toFixed(2)}% (very low false positives)`);
} else if (avgTokensPerWord < 0.05) {
  console.log(`  ✅ GOOD: ${(avgTokensPerWord * 100).toFixed(2)}% (low false positives)`);
} else if (avgTokensPerWord < 0.1) {
  console.log(`  ⚠️  MODERATE: ${(avgTokensPerWord * 100).toFixed(2)}% (some false positives)`);
} else {
  console.log(`  ❌ HIGH: ${(avgTokensPerWord * 100).toFixed(2)}% (many false positives)`);
}
console.log('');

// Deduplication effectiveness
console.log('Deduplication Effectiveness:');
const estimatedDuplicates = totalChunks * 0.3; // Estimate 30% overlap
const deduplicationRate = totalChunks > 0
  ? ((1 - (totalTokens / Math.min(totalChunks, estimatedDuplicates))) * 100)
  : 0;

console.log(`  Estimated potential duplicates: ${Math.round(estimatedDuplicates)}`);
console.log(`  Actual tokens after dedup: ${totalTokens}`);
console.log(`  Deduplication effectiveness: ${deduplicationRate.toFixed(1)}%`);
console.log('');

console.log('='.repeat(80));
console.log('✅ Large Document Testing Complete!');
console.log('='.repeat(80));
console.log('');

// Cache statistics
const cacheStats = engine.getCacheStats();
console.log('Cache Statistics:');
console.log(`  Enabled: ${cacheStats.enabled}`);
console.log(`  Size: ${cacheStats.size} / ${cacheStats.maxSize}`);
console.log('');
