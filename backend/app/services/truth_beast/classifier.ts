/**
 * Truth Beast Classifier - COMPLETE 3-Layer Architecture
 *
 * Layer 1: TTO Adapter (token matching + preprocessing) - chemistry-engine.ts
 * Layer 2: LLM Classification (final tier decision) - llm-classifier.ts
 * Layer 3: Chemistry Engine (thermodynamic calculations) - chemistry-engine.ts
 *
 * Formula: E = ΔH - T × ΔS (Gibbs Free Energy)
 *
 * With FULL 385 token system + LLM integration!
 */

import { getChemistryEngine, type ChemistryResult } from './chemistry-engine.js';
import { getTruthTokenRegistry, TIER_RESISTANCE } from './truth-token-registry.js';
import { createLLMClassifier, type LLMClassificationOutput } from './llm-classifier.js';
import { getSingletonConfig, isLLMAvailable } from './config.js';

export interface ClassificationResult {
  // Classification
  tier: number;
  tier_name: string;
  confidence: number;
  truth_state: string;

  // Chemistry - E = ΔH - T × ΔS
  stability: number;       // ΔH - how grounded (0-1)
  entropy: number;         // ΔS - uncertainty (0-1)
  energy: number;          // E - truth score (-1 to 1)

  // Per-chunk data with chemistry (NEW)
  chunks?: Array<{
    text: string;
    id: string;
    index: number;
    tokens: Array<{
      text: string;
      category: string;
      tier: number;
      weight: number;
    }>;
    tier: number;
    confidence: number;
    stability: number;
    entropy: number;
    energy: number;
  }>;

  // Token matching with provenance (NEW)
  tokens_matched: Array<{
    symbol: string;
    tier: number;
    category: string;
    weight: number;
    // Provenance fields (NEW)
    chunk?: string;
    chunk_id?: string;
    chunk_index?: number;
  }>;

  // NEW: Complete linguistic mapping - NO SHORTCUTS
  token_type_coverage?: {
    unique_types: number;
    total_possible: number;
    coverage_percent: number;
    type_distribution: Record<string, number>;
  };

  // NEW: Dominant tiers (plural) - PRESERVE COMPLEXITY
  dominant_tiers?: Array<{
    tier: number;
    tier_name: string;
    token_count: number;
    percentage: number;
  }>;

  // Metadata
  tier_distribution: Record<number, number>;
  reasoning: string;
  latency_ms: number;

  // LLM metadata (NEW)
  used_llm?: boolean;
  llm_provider?: string;
  llm_model?: string;
  llm_verdict?: string;
  fast_path?: boolean;
}

/**
 * Classify text into a truth tier with COMPLETE 3-layer architecture
 *
 * Flow:
 * 1. LAYER 1: Token matching + preprocessing (chemistry engine)
 * 2. Fast-path check: Skip LLM for high-confidence T1-T4?
 * 3. LAYER 2: LLM tier classification (if not fast-path)
 * 4. LAYER 3: Chemistry calculations (E = ΔH - T×ΔS)
 * 5. Return unified result
 *
 * @param text - Text to classify
 * @returns ClassificationResult with tier, chemistry, and reasoning
 */
export async function classify(text: string): Promise<ClassificationResult> {
  const startTime = Date.now();

  if (!text || text.trim().length === 0) {
    return emptyResult();
  }

  // Get configuration
  const config = getSingletonConfig();

  // LAYER 1: Token matching + preprocessing (chemistry engine)
  const engine = getChemistryEngine();
  const chemistry = engine.process(text);

  // Check if we should use LLM or fast-path
  const shouldUseLLM = isLLMAvailable(config);
  const isFastPath = config.fastPath &&
                     chemistry.tier <= config.fastPathTierMax &&
                     chemistry.confidence >= config.fastPathConfidenceThreshold;

  let llmResult: LLMClassificationOutput | null = null;
  let usedLLM = false;

  // LAYER 2: LLM Classification (if enabled and not fast-path)
  if (shouldUseLLM && !isFastPath) {
    try {
      const classifier = createLLMClassifier(config);

      llmResult = await classifier.classify({
        text,
        tokenProfile: {
          dominant_tier: chemistry.tier,
          confidence: chemistry.confidence,
          tier_distribution: chemistry.tier_distribution,
          tokens_matched: chemistry.high_weight_tokens.map(t => ({
            symbol: t.text,
            tier: t.tier,
            weight: t.weight
          }))
        }
      });

      usedLLM = true;
    } catch (error) {
      console.warn('[Classifier] LLM classification failed, falling back to token-only:', error);
      usedLLM = false;
    }
  }

  // Transform results into ClassificationResult
  const result = transformResults(
    chemistry,
    llmResult,
    usedLLM,
    isFastPath,
    config,
    startTime
  );

  return result;
}

/**
 * Synchronous classify function for backwards compatibility
 * (Uses token-only classification without LLM)
 */
export function classifySync(text: string): ClassificationResult {
  const startTime = Date.now();

  if (!text || text.trim().length === 0) {
    return emptyResult();
  }

  const engine = getChemistryEngine();
  const chemistry = engine.process(text);

  return transformChemistryResult(chemistry, startTime);
}

/**
 * Transform results from all layers into unified ClassificationResult
 *
 * Combines:
 * - Chemistry engine results (token analysis, thermodynamics)
 * - LLM results (tier decision, reasoning)
 * - Configuration metadata
 */
function transformResults(
  chemistry: ChemistryResult,
  llmResult: LLMClassificationOutput | null,
  usedLLM: boolean,
  isFastPath: boolean,
  config: any,
  startTime: number
): ClassificationResult {
  // If LLM was used, use its tier decision
  // Otherwise, use chemistry engine's tier
  const tier = llmResult ? llmResult.tier : chemistry.tier;
  const tier_name = llmResult ? llmResult.tier_name : chemistry.tier_name;

  // Recalculate entropy based on FINAL tier (not chemistry tier)
  // Use TIER_RESISTANCE for all tiers (T0-T12) to ensure calibration:
  // - T0-T4: Low resistance = low entropy (certainty)
  // - T5-T12: High resistance = high entropy (uncertainty)
  const entropy = TIER_RESISTANCE[tier] || 0.5;

  // Recalculate energy with corrected entropy
  // E = ΔH - T × ΔS
  const T = 0.5; // Context temperature
  const energy = chemistry.stability - (T * entropy);

  // Combine confidence: LLM confidence (if used) weighted with chemistry confidence
  let confidence: number;
  if (llmResult) {
    // Weight: 70% LLM, 30% chemistry
    confidence = (llmResult.confidence * 0.7) + (chemistry.confidence * 0.3);
  } else {
    confidence = chemistry.confidence;
  }

  // Determine truth state (using LLM state if available)
  const truth_state = llmResult
    ? llmResult.state
    : getTruthState(tier, confidence, chemistry.stability);

  // Generate reasoning (combine LLM + chemistry)
  const reasoning = generateCombinedReasoning(chemistry, llmResult, usedLLM, isFastPath);

  // Transform tokens WITH provenance
  const tokens_matched = chemistry.high_weight_tokens.map(t => ({
    symbol: t.text.toUpperCase().replace(/\s+/g, '_'),
    tier: t.tier,
    category: t.category,
    weight: t.weight,
    // Include provenance for chain of custody
    chunk: t.chunk,
    chunk_id: t.chunk_id,
    chunk_index: t.chunk_index
  }));

  const latency_ms = Date.now() - startTime;

  return {
    tier,
    tier_name,
    confidence,
    truth_state,
    stability: chemistry.stability,
    entropy: entropy,  // Use recalculated entropy
    energy: energy,    // Use recalculated energy
    // Include per-chunk data for knowledge graph
    chunks: chemistry.chunks,
    tokens_matched,
    // NEW: Complete linguistic mapping - NO SHORTCUTS
    token_type_coverage: chemistry.token_type_coverage,
    dominant_tiers: chemistry.dominant_tiers,
    tier_distribution: chemistry.tier_distribution,
    reasoning,
    latency_ms,
    // LLM metadata
    used_llm: usedLLM,
    llm_provider: llmResult ? llmResult.provider : undefined,
    llm_model: llmResult ? llmResult.model : undefined,
    llm_verdict: llmResult ? llmResult.verdict : undefined,
    fast_path: isFastPath,
  };
}

/**
 * Transform ChemistryResult from engine into ClassificationResult for API
 * (Token-only classification, no LLM)
 */
function transformChemistryResult(
  chemistry: ChemistryResult,
  startTime: number
): ClassificationResult {
  // Determine truth state
  const truth_state = getTruthState(
    chemistry.tier,
    chemistry.confidence,
    chemistry.stability
  );

  // Generate reasoning
  const reasoning = generateReasoning(chemistry);

  // Transform tokens WITH provenance
  const tokens_matched = chemistry.high_weight_tokens.map(t => ({
    symbol: t.text.toUpperCase().replace(/\s+/g, '_'),
    tier: t.tier,
    category: t.category,
    weight: t.weight,
    // Include provenance for chain of custody
    chunk: t.chunk,
    chunk_id: t.chunk_id,
    chunk_index: t.chunk_index
  }));

  const latency_ms = Date.now() - startTime;

  return {
    tier: chemistry.tier,
    tier_name: chemistry.tier_name,
    confidence: chemistry.confidence,
    truth_state,
    stability: chemistry.stability,
    entropy: chemistry.entropy,
    energy: chemistry.energy,
    // Include per-chunk data for knowledge graph
    chunks: chemistry.chunks,
    tokens_matched,
    // NEW: Complete linguistic mapping
    token_type_coverage: chemistry.token_type_coverage,
    dominant_tiers: chemistry.dominant_tiers,
    tier_distribution: chemistry.tier_distribution,
    reasoning,
    latency_ms,
    used_llm: false,
    fast_path: false,
  };
}

/**
 * Determine truth state based on tier, confidence, and stability
 *
 * States:
 * - GROUND: High-confidence facts (T0-T4, strong stability)
 * - REJECTED: Garbage/adversarial (T9+)
 * - UNCERTAIN: Low stability or confidence
 * - BOUNDED: Everything else (contextual truth)
 */
function getTruthState(tier: number, confidence: number, stability: number): string {
  // T0-T4 with high confidence and stability = GROUND TRUTH
  if (tier <= 4 && confidence >= 0.7 && stability >= 0.5) {
    return 'GROUND';
  }

  // T9+ = Garbage, Meta-Linguistic issues, Deceptive, Adversarial
  if (tier >= 9) {
    return 'REJECTED';
  }

  // Low stability = UNCERTAIN
  if (stability < 0.3) {
    return 'UNCERTAIN';
  }

  // Everything else = BOUNDED (contextual truth)
  return 'BOUNDED';
}

/**
 * Generate combined reasoning from LLM and chemistry
 */
function generateCombinedReasoning(
  chemistry: ChemistryResult,
  llmResult: LLMClassificationOutput | null,
  usedLLM: boolean,
  isFastPath: boolean
): string {
  let reasoning = '';

  // NEW: Check if this is multi-tier content (NO SHORTCUTS)
  const isComplexContent = chemistry.dominant_tiers && chemistry.dominant_tiers.length > 1 &&
    chemistry.dominant_tiers[0].percentage < 50; // No single dominant tier

  // Start with classification summary
  if (isComplexContent) {
    // PRESERVE COMPLEXITY - Show distribution
    reasoning += `Complex multi-tier content. Dominant categories: `;
    const topTiers = chemistry.dominant_tiers!.slice(0, 3);
    reasoning += topTiers.map(t =>
      `${t.tier_name} (T${t.tier}): ${t.percentage.toFixed(1)}%`
    ).join(', ');
    reasoning += `. `;

    // Note token type coverage
    if (chemistry.token_type_coverage) {
      reasoning += `Linguistic coverage: ${chemistry.token_type_coverage.unique_types}/390 token types (${chemistry.token_type_coverage.coverage_percent.toFixed(1)}%). `;
    }
  } else if (llmResult) {
    reasoning += `Classified as ${llmResult.tier_name} (T${llmResult.tier}) `;
    reasoning += `with ${(llmResult.confidence * 100).toFixed(1)}% confidence. `;

    // Add LLM reasoning
    reasoning += `${llmResult.reasoning} `;
  } else {
    reasoning += `Classified as ${chemistry.tier_name} (T${chemistry.tier}) `;
    reasoning += `with ${(chemistry.confidence * 100).toFixed(1)}% confidence. `;
  }

  // Add fast-path note
  if (isFastPath) {
    reasoning += `(Fast-path: skipped LLM due to high confidence in grounded tier). `;
  } else if (usedLLM) {
    reasoning += `(LLM-enhanced classification). `;
  } else {
    reasoning += `(Token-only classification). `;
  }

  // Add chemistry metrics
  reasoning += `Stability: ${(chemistry.stability * 100).toFixed(1)}%, `;
  reasoning += `Entropy: ${(chemistry.entropy * 100).toFixed(1)}%. `;

  // Token information
  if (chemistry.high_weight_tokens.length > 0) {
    const uniqueCategories = Array.from(new Set(chemistry.high_weight_tokens.map(t => t.category)));
    const topCategories = uniqueCategories.slice(0, 3);
    reasoning += `Matched ${chemistry.high_weight_tokens.length} truth tokens: ${topCategories.join(', ')}. `;
  }

  return reasoning;
}

/**
 * Generate human-readable reasoning for the classification (token-only)
 */
function generateReasoning(chemistry: ChemistryResult): string {
  const { tier, tier_name, confidence, stability, entropy, tokens } = chemistry;

  let reasoning = '';

  // NEW: Check if this is multi-tier content (NO SHORTCUTS)
  const isComplexContent = chemistry.dominant_tiers && chemistry.dominant_tiers.length > 1 &&
    chemistry.dominant_tiers[0].percentage < 50;

  if (isComplexContent) {
    // PRESERVE COMPLEXITY - Show distribution
    reasoning += `Complex multi-tier content. Dominant categories: `;
    const topTiers = chemistry.dominant_tiers!.slice(0, 3);
    reasoning += topTiers.map(t =>
      `${t.tier_name} (T${t.tier}): ${t.percentage.toFixed(1)}%`
    ).join(', ');
    reasoning += `. `;

    // Note token type coverage
    if (chemistry.token_type_coverage) {
      reasoning += `Linguistic coverage: ${chemistry.token_type_coverage.unique_types}/390 token types (${chemistry.token_type_coverage.coverage_percent.toFixed(1)}%). `;
    }
  } else {
    reasoning += `Classified as ${tier_name} (T${tier}) with ${(confidence * 100).toFixed(1)}% confidence. `;
  }

  // Token information
  if (tokens.length > 0) {
    const uniqueCategories = Array.from(new Set(tokens.map(t => t.category)));
    const topCategories = uniqueCategories.slice(0, 3);
    reasoning += `Matched ${tokens.length} truth tokens across categories: ${topCategories.join(', ')}. `;
  } else {
    reasoning += 'No truth tokens matched - using default classification. ';
  }

  // Chemistry metrics
  reasoning += `Stability: ${(stability * 100).toFixed(1)}% (grounded), `;
  reasoning += `Entropy: ${(entropy * 100).toFixed(1)}% (uncertainty). `;

  // Energy score
  if (chemistry.energy > 0.5) {
    reasoning += `High energy score (${chemistry.energy.toFixed(2)}) indicates strong truth signal. `;
  } else if (chemistry.energy < -0.5) {
    reasoning += `Negative energy score (${chemistry.energy.toFixed(2)}) indicates weak truth signal. `;
  }

  // Tier-specific guidance
  if (tier <= 4) {
    reasoning += 'High-confidence truth territory - facts you can count on.';
  } else if (tier <= 8) {
    reasoning += 'Requires context and interpretation.';
  } else {
    reasoning += 'Low-confidence or potentially misleading content.';
  }

  return reasoning;
}

/**
 * Empty result for invalid input
 */
function emptyResult(): ClassificationResult {
  const dist: Record<number, number> = {};
  for (let i = 0; i <= 12; i++) {
    dist[i] = 0;
  }

  return {
    tier: 5,
    tier_name: 'Probabilistic',
    confidence: 0.3,
    truth_state: 'UNCERTAIN',
    stability: 0.3,
    entropy: 0.8,
    energy: -0.5,
    tokens_matched: [],
    // NEW: Complete linguistic mapping fields
    token_type_coverage: {
      unique_types: 0,
      total_possible: 390,
      coverage_percent: 0,
      type_distribution: {}
    },
    dominant_tiers: [],
    tier_distribution: dist,
    reasoning: 'Empty input - no classification possible',
    latency_ms: 0,
    used_llm: false,
    fast_path: false,
  };
}

/**
 * Get classification statistics
 */
export function getClassifierStats(): {
  token_count: number;
  tier_distribution: Record<number, number>;
  cache_size: number;
} {
  const registry = getTruthTokenRegistry();
  const engine = getChemistryEngine();
  const cacheStats = engine.getCacheStats();

  return {
    token_count: registry.count(),
    tier_distribution: registry.getTierDistribution(),
    cache_size: cacheStats.size,
  };
}

/**
 * Clear the chemistry engine cache
 */
export function clearClassifierCache(): void {
  const engine = getChemistryEngine();
  engine.clearCache();
}
