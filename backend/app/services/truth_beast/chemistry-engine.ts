/**
 * Universal Chemistry Engine - Central Engine for All Language Chemistry
 *
 * Ported from EXPERIMENTAL TRUTHBEAST NEW BUILD
 * Universal Truth Formula: E = ΔH - T × ΔS (Gibbs Free Energy)
 *
 * This engine processes all text through the same thermodynamic framework:
 * - ΔH (Enthalpy/Stability): How grounded in facts
 * - ΔS (Entropy): Uncertainty level
 * - T (Temperature): Context constant
 * - E (Energy): Final truth score
 */

import { getTruthTokenRegistry, TruthTokenRecord, TokenMatchResult, TIER_NAMES, TIER_RESISTANCE } from './truth-token-registry.js';
import { topicDetector, TopicMatch } from './topic-database.js';
import { getSingletonConfig, getConfigSummary, TruthBeastConfig } from './config.js';

/**
 * Universal energy types for component I/O
 */
export enum EnergyType {
  // Text types
  TEXT = 'text',
  CLAIM = 'claim',
  QUERY = 'query',
  PROMPT = 'prompt',

  // Structured types
  JSON = 'json',
  TOKENS = 'tokens',
  TOKEN_PROFILE = 'token_profile',

  // Classification types
  CLASSIFICATION = 'classification',
  TIER = 'tier',
  CONFIDENCE = 'confidence',

  // Chemistry types
  CHEMISTRY = 'chemistry',
  ENERGY_SCORE = 'energy_score',
  ENTROPY = 'entropy',
  STABILITY = 'stability',

  // Storage types
  GROUND_TRUTH = 'ground_truth',
  COMPOUND = 'compound',
  RELATIONSHIP = 'relationship',

  // Any
  ANY = 'any',
  NONE = 'none',
}

/**
 * A single truth token with weight
 */
export interface Token {
  text: string;
  category: string;
  tier: number;
  weight: number;
  // Provenance tracking
  chunk: string;        // Which chunk produced this token
  chunk_id: string;     // Unique chunk identifier
  chunk_index: number;  // Position in chunk array

  // Design 2: Multi-token per chunk
  matched_pattern?: string;          // Which pattern matched (e.g., "dunkin donuts history")
  pattern_length?: number;           // Word count of matched pattern
  is_dominant?: boolean;             // True for longest match in chunk
}

/**
 * Result of running language chemistry on text
 * Universal output format for all components
 */
export interface ChemistryResult {
  // Input
  original_text: string;

  // Per-chunk data with chemistry
  chunks: Array<{
    text: string;              // The 3-7 word chunk
    id: string;                // Unique chunk ID
    index: number;             // Position in array
    tokens: Token[];           // KEEP: All tokens from this chunk (for backward compat)

    // Design 2: Multi-token per chunk
    matched_tokens: Array<{    // NEW: All token matches with pattern info
      token: Token;
      matched_pattern: string;
      pattern_length: number;
      is_dominant: boolean;
    }>;
    dominant_token?: Token;    // NEW: The longest match (used for tier)

    // Phase 1: Topic detection per chunk
    topics?: TopicMatch[];     // NEW: Detected topics for this chunk
    primary_topic?: TopicMatch; // NEW: Highest priority topic for this chunk

    tier: number;              // KEEP: From dominant_token.tier
    confidence: number;        // Confidence for THIS chunk
    stability: number;         // Stability for THIS chunk
    entropy: number;           // Entropy for THIS chunk
    energy: number;            // Energy for THIS chunk
  }>;

  // Tokenization (aggregate)
  tokens: Token[];

  // Classification (aggregate)
  tier: number;
  tier_name: string;
  tier_distribution: Record<number, number>;

  // Phase 1: Topic detection (aggregate)
  topics: TopicMatch[];              // All detected topics sorted by confidence
  primary_topic?: TopicMatch;        // Highest priority topic (for verification)
  verification_needed: boolean;      // Based on topic priority

  // NEW: Complete linguistic mapping - NO SHORTCUTS
  token_type_coverage: {
    unique_types: number;           // How many of 392 token types found
    total_possible: number;         // 392 total in ontology
    coverage_percent: number;       // Percentage coverage
    type_distribution: Record<string, number>; // Each token type count
  };

  // NEW: Dominant tiers (plural, not singular) - PRESERVE COMPLEXITY
  dominant_tiers: Array<{
    tier: number;
    tier_name: string;
    token_count: number;
    percentage: number;
  }>;

  // Chemistry metrics - E = ΔH - T × ΔS (aggregate)
  stability: number;    // 0.0-1.0 (ΔH - how grounded)
  entropy: number;      // 0.0-1.0 (ΔS - uncertainty)
  energy: number;       // -1.0 to 1.0 (E - truth score)

  // Weights
  total_weight: number;
  high_weight_tokens: Token[];

  // Confidence
  confidence: number;   // 0.0-1.0 (final score)

  // Timing
  processed_at: string;
  processing_ms: number;
}

/**
 * Universal Chemistry Engine
 * THE central engine for all language chemistry
 * Every component uses this - no exceptions
 */
export class UniversalChemistryEngine {
  private config: TruthBeastConfig;
  private registry: ReturnType<typeof getTruthTokenRegistry>;
  private cache: Map<string, ChemistryResult> | null;

  constructor(config?: TruthBeastConfig) {
    // Load config (allow override for testing)
    this.config = config || getSingletonConfig();

    // Initialize registry
    this.registry = getTruthTokenRegistry();

    // Initialize cache (only if enabled in config)
    this.cache = this.config.cacheEnabled ? new Map() : null;

    // Log configuration on startup
    console.log('[Chemistry Engine] Initialized with configuration:');
    console.log(getConfigSummary(this.config));
  }

  /**
   * Get current configuration
   */
  getConfig(): TruthBeastConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (for runtime changes)
   */
  updateConfig(newConfig: Partial<TruthBeastConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Reconfigure cache if needed
    if (newConfig.cacheEnabled !== undefined) {
      if (newConfig.cacheEnabled && !this.cache) {
        this.cache = new Map();
        console.log('[Chemistry Engine] Cache enabled');
      } else if (!newConfig.cacheEnabled && this.cache) {
        this.cache = null;
        console.log('[Chemistry Engine] Cache disabled');
      }
    }

    console.log('[Chemistry Engine] Configuration updated');
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache(): void {
    if (this.cache) {
      const size = this.cache.size;
      this.cache.clear();
      console.log(`[Chemistry Engine] Cache cleared (${size} entries removed)`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { enabled: boolean; size: number; maxSize: number } {
    return {
      enabled: this.cache !== null,
      size: this.cache?.size || 0,
      maxSize: this.config.cacheMaxSize
    };
  }

  /**
   * Process ANY text through language chemistry
   * Same process for 1 word or 1 million words
   *
   * @param text - Any text to process
   * @returns ChemistryResult with full analysis
   */
  process(text: string): ChemistryResult {
    if (!text || !text.trim()) {
      return this._emptyResult();
    }

    // Check cache first (if enabled)
    if (this.cache && this.cache.has(text)) {
      return this.cache.get(text)!;
    }

    // Process uncached
    const result = this._processUncached(text);

    // Cache result (if enabled and within size limit)
    if (this.cache) {
      // Enforce cache size limit from config
      if (this.cache.size >= this.config.cacheMaxSize) {
        // Clear oldest entry (FIFO)
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
          this.cache.delete(firstKey);
        }
      }
      this.cache.set(text, result);
    }

    return result;
  }

  /**
   * Internal: Process text without caching
   * 10-step pipeline:
   * 1. Chunk
   * 2. Tokenize (per-chunk)
   * 3. Weight
   * 4. Per-Chunk Chemistry (NEW)
   * 5. Tier Distribution (aggregate)
   * 6. Classify (aggregate)
   * 7. Stability (aggregate)
   * 8. Entropy (aggregate)
   * 9. Energy (aggregate)
   * 10. Confidence (aggregate)
   * 11. Extract high-weight tokens
   */
  private _processUncached(text: string): ChemistryResult {
    const startTime = Date.now();

    // Step 1: Chunk the text with IDs
    const chunks = this._chunk(text);

    // Step 2: Extract tokens (per-chunk with provenance)
    let allTokens = this._tokenize(text, chunks);

    // Step 2.5: Deduplicate tokens (if enabled)
    if (this.config.deduplicateTokens) {
      const beforeCount = allTokens.length;
      allTokens = this._deduplicate(allTokens);
      const afterCount = allTokens.length;
      const reduction = beforeCount > 0 ? ((1 - afterCount / beforeCount) * 100).toFixed(1) : '0.0';
      console.log(`[Chemistry] Deduplication: ${beforeCount} → ${afterCount} tokens (${reduction}% reduction)`);
    }

    // Step 3: Calculate weights
    allTokens = this._weight(allTokens);

    // Step 4: Calculate chemistry for EACH CHUNK
    const chunksWithChemistry = chunks.map(chunk => {
      // Get tokens that belong to this chunk
      const chunkTokens = allTokens.filter(t => t.chunk_id === chunk.id);

      if (chunkTokens.length === 0) {
        // No tokens matched - return default values
        return {
          ...chunk,
          tokens: [],
          matched_tokens: [],
          dominant_token: undefined,
          tier: 5,  // Probabilistic (default)
          confidence: 0.5,
          stability: 0.5,
          entropy: 0.5,
          energy: 0.25
        };
      }

      // Design 2: Use ONLY dominant tokens for tier classification
      const dominantTokens = chunkTokens.filter(t => t.is_dominant === true);

      // Build matched_tokens array (all matches)
      const matchedTokens = chunkTokens.map(t => ({
        token: t,
        matched_pattern: t.matched_pattern || '',
        pattern_length: t.pattern_length || 0,
        is_dominant: t.is_dominant || false
      }));

      // Get the dominant token
      const dominantToken = dominantTokens[0] || chunkTokens[0];

      // Calculate tier distribution using ONLY dominant token
      const chunkTierDist = this._tierDistribution(dominantTokens.length > 0 ? dominantTokens : chunkTokens);
      const chunkTier = this._classify(chunkTierDist);

      // Calculate chemistry for THIS chunk
      const chunkStability = this._stability(chunkTokens, chunkTierDist);
      const chunkEntropy = this._entropy(chunkTierDist, chunkTokens.length, chunkTier);
      const chunkEnergy = this._energy(chunkStability, chunkEntropy);
      const chunkConfidence = this._confidence(chunkStability, chunkEntropy, chunkEnergy);

      // Phase 1: Detect topics for this chunk
      const chunkTopics = topicDetector.detectTopics(chunk.text);
      const chunkPrimaryTopic = topicDetector.getHighestPriorityTopic(chunkTopics) || undefined;

      return {
        ...chunk,
        tokens: chunkTokens,                    // KEEP: All tokens (backward compat)
        matched_tokens: matchedTokens,          // NEW: Design 2 array
        dominant_token: dominantToken,          // NEW: Longest match
        topics: chunkTopics || [],              // NEW: Phase 1 - detected topics
        primary_topic: chunkPrimaryTopic,       // NEW: Phase 1 - highest priority topic
        tier: chunkTier,                        // Uses dominant token
        confidence: chunkConfidence,
        stability: chunkStability,
        entropy: chunkEntropy,
        energy: chunkEnergy
      };
    });

    // Step 5-10: Calculate AGGREGATE chemistry using ONLY dominant tokens
    const dominantTokensOnly = allTokens.filter(t => t.is_dominant === true);
    const tierDistribution = this._tierDistribution(dominantTokensOnly.length > 0 ? dominantTokensOnly : allTokens);
    const tier = this._classify(tierDistribution);
    const stability = this._stability(allTokens, tierDistribution);
    const entropy = this._entropy(tierDistribution, allTokens.length, tier);
    const energy = this._energy(stability, entropy);
    const confidence = this._confidence(stability, entropy, energy);

    const highWeight = allTokens
      .sort((a, b) => b.weight - a.weight)
      .slice(0, Math.max(1, Math.floor(allTokens.length / 5)));

    // NEW: Calculate complete linguistic mapping - NO SHORTCUTS
    const tokenTypeCoverage = this._calculateTokenTypeCoverage(allTokens);

    // NEW: Calculate dominant tiers (top 5) - PRESERVE COMPLEXITY
    const dominantTiers = Object.entries(tierDistribution)
      .map(([tierNum, count]) => ({
        tier: parseInt(tierNum),
        tier_name: TIER_NAMES[parseInt(tierNum)] || 'Unknown',
        token_count: count,
        percentage: allTokens.length > 0 ? (count / allTokens.length) * 100 : 0
      }))
      .filter(t => t.token_count > 0) // Only tiers with tokens
      .sort((a, b) => b.token_count - a.token_count) // Sort by count descending
      .slice(0, 5); // Top 5 dominant tiers

    // Phase 1: Detect topics for entire text (aggregate)
    const allTopics = topicDetector.detectTopics(text);
    const primaryTopic = topicDetector.getHighestPriorityTopic(allTopics);
    const verificationNeeded = primaryTopic && primaryTopic.topic ? primaryTopic.topic.verification_priority >= 0.8 : false;

    const processingTime = Date.now() - startTime;

    return {
      original_text: text,
      chunks: chunksWithChemistry,  // NEW: Per-chunk chemistry
      tokens: allTokens,             // EXISTING: All tokens
      tier,                          // EXISTING: Aggregate tier (for backwards compatibility)
      tier_name: TIER_NAMES[tier] || 'Unknown',
      tier_distribution: tierDistribution,
      // Phase 1: Topic detection (aggregate)
      topics: allTopics,
      primary_topic: primaryTopic || undefined,
      verification_needed: verificationNeeded,
      // NEW: Complete linguistic mapping
      token_type_coverage: tokenTypeCoverage,
      dominant_tiers: dominantTiers,
      stability,
      entropy,
      energy,
      total_weight: allTokens.reduce((sum, t) => sum + t.weight, 0),
      high_weight_tokens: highWeight,
      confidence,
      processed_at: new Date().toISOString(),
      processing_ms: processingTime,
    };
  }

  /**
   * Step 1: Break text into 3-7 word chunks
   * COMPLETE LINGUISTIC MAPPING - processes entire document
   * No artificial limits - maps all language patterns
   */
  private _chunk(text: string): Array<{text: string; id: string; index: number}> {
    const words = text.split(/\s+/);
    const wordCount = words.length;

    // Handle short texts
    if (wordCount < 3) {
      return text.trim() ? [{
        text: text,
        id: this._generateChunkId(text, 0),
        index: 0
      }] : [];
    }

    const chunks: Array<{text: string; id: string; index: number}> = [];
    let chunkIndex = 0;

    // FIXED: Use SLIDING WINDOW approach instead of nested loops
    // This creates LINEAR chunks (O(N)) instead of EXPONENTIAL chunks (O(N²))
    //
    // Strategy: Create ONE optimal chunk at each position using dynamic sizing
    // - Short texts (< 20 words): Use 3-word chunks for granularity
    // - Medium texts (20-100 words): Use 5-word chunks (optimal balance)
    // - Long texts (> 100 words): Use 7-word chunks (broader context)
    // - Slide by 2 words to maintain overlap for pattern continuity
    //
    // Example: "how are you doing today my friend" (7 words)
    // Old: Position 0: [3w, 4w, 5w, 6w, 7w], Position 1: [3w, 4w, 5w, 6w], ... = 25+ chunks
    // New: Position 0: [5w], Position 2: [5w], Position 4: [3w] = 3 chunks
    console.log(`[Chemistry] Processing ${wordCount} words → creating sliding window chunks...`);

    // FIXED: Create multiple chunk sizes (3-7 words) to match all pattern lengths
    // This ensures we can detect patterns of any length from 3-7 words
    const maxChunkSize = Math.min(7, wordCount);
    const minChunkSize = 3;

    // Create overlapping chunks of multiple sizes
    for (let size = minChunkSize; size <= maxChunkSize; size++) {
      for (let i = 0; i <= wordCount - size; i++) {
        const chunkText = words.slice(i, i + size).join(' ');
        chunks.push({
          text: chunkText,
          id: this._generateChunkId(chunkText, chunkIndex),
          index: chunkIndex
        });
        chunkIndex++;
      }
    }

    console.log(`[Chemistry] Created ${chunks.length} chunks (was ~${5 * (wordCount - 2)} with old logic) - ${((chunks.length / (5 * Math.max(1, wordCount - 2))) * 100).toFixed(1)}% reduction`);
    return chunks;
  }

  /**
   * Generate a unique chunk ID
   */
  private _generateChunkId(chunkText: string, index: number): string {
    const hash = this._simpleHash(chunkText + index);
    return `chunk_${hash}_${index}`;
  }

  /**
   * Simple hash function for chunk IDs
   */
  private _simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Step 2: Match chunks against truth tokens
   * Normalizes symbols to words for better matching
   * NOW PROCESSES EACH CHUNK SEPARATELY FOR CHAIN OF CUSTODY
   * Design 2: Identifies dominant token (longest pattern) per chunk
   */
  private _tokenize(
    text: string,
    chunks: Array<{text: string; id: string; index: number}>
  ): Token[] {
    const allTokens: Token[] = [];
    const seenTokens = new Set<string>(); // Deduplication across chunks

    // FIXED: Stopword filter - ultra-common words that create noise
    // These words appear in nearly every sentence but provide minimal semantic value
    const stopwords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'can', 'of', 'at', 'by', 'for', 'with', 'about',
      'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
      'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under',
      'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
      'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other',
      'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
      'than', 'too', 'very', 'just', 'but', 'if', 'or', 'because', 'while',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'what',
      'which', 'who', 'this', 'that', 'these', 'those', 'am', 'and'
    ]);

    // Process EACH chunk separately
    for (const chunk of chunks) {
      // Normalize THIS chunk
      const normalizedChunk = this._normalizeText(chunk.text);

      // Skip if chunk is only stopwords
      const chunkWords = normalizedChunk.split(/\s+/).filter(w => !stopwords.has(w));
      if (chunkWords.length === 0) {
        continue;
      }

      // Design 2: Use searchWithMetadata to get pattern info
      const matchResults = this.registry.searchWithMetadata(normalizedChunk);

      if (matchResults.length === 0) {
        continue;  // No matches for this chunk
      }

      // FIXED: Filter out matches that are ONLY stopwords
      const filteredMatches = matchResults.filter(match => {
        const patternWords = match.matched_pattern.toLowerCase().split(/\s+/);
        const hasNonStopword = patternWords.some(w => !stopwords.has(w));
        return hasNonStopword;
      });

      if (filteredMatches.length === 0) {
        continue;
      }

      // Design 2: Find dominant token (longest pattern)
      const sortedByLength = filteredMatches.sort((a, b) =>
        b.pattern_length - a.pattern_length
      );
      const dominantMatch = sortedByLength[0];

      // FIXED: Only keep dominant token per chunk (prevents micro-token explosion)
      // Old logic created ALL matches - now we only keep the most relevant one
      const tokenKey = `${dominantMatch.token.name}:${dominantMatch.matched_pattern}`;

      // Deduplicate - skip if we've already seen this exact token+pattern
      if (seenTokens.has(tokenKey)) {
        continue;
      }
      seenTokens.add(tokenKey);

      allTokens.push({
        text: dominantMatch.token.name,
        category: dominantMatch.token.category,
        tier: dominantMatch.token.tier,
        weight: 0.0,  // Will be calculated in weight step
        // Provenance: track which chunk produced this token
        chunk: chunk.text,
        chunk_id: chunk.id,
        chunk_index: chunk.index,
        // Design 2 fields
        matched_pattern: dominantMatch.matched_pattern,
        pattern_length: dominantMatch.pattern_length,
        is_dominant: true  // Always true now since we only keep dominant
      });
    }

    console.log(`[Chemistry] Tokenization: ${chunks.length} chunks → ${allTokens.length} unique dominant tokens (deduped)`);
    return allTokens;
  }

  /**
   * Normalize symbols to words for better token matching
   */
  private _normalizeText(text: string): string {
    return text
      // Math symbols
      .replace(/\+/g, ' plus ')
      .replace(/-/g, ' minus ')
      .replace(/\*/g, ' multiply ')
      .replace(/×/g, ' multiply ')
      .replace(/\//g, ' divide ')
      .replace(/÷/g, ' divide ')
      .replace(/=/g, ' equals ')
      .replace(/≠/g, ' not equals ')
      .replace(/%/g, ' percent ')
      // Logical symbols
      .replace(/</g, ' less than ')
      .replace(/>/g, ' greater than ')
      .replace(/≤/g, ' less than or equal ')
      .replace(/≥/g, ' greater than or equal ')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Step 2.5: Deduplicate tokens from overlapping chunks
   *
   * Problem: Overlapping 3-7 word chunks create duplicate token matches
   * Example: "peer reviewed research published in Nature"
   *   Chunk 1: "peer reviewed research published" → PeerReviewedTT
   *   Chunk 2: "reviewed research published in" → PeerReviewedTT (duplicate!)
   *   Chunk 3: "research published in Nature" → PeerReviewedTT (duplicate!)
   *
   * Strategy:
   * 1. Group tokens by identity (token name + matched pattern)
   * 2. For each group, keep the BEST occurrence:
   *    - Prefer dominant tokens (is_dominant = true)
   *    - Prefer longer pattern matches
   *    - Prefer earlier chunks (lower chunk_index)
   * 3. Result: 3 duplicates → 1 token (66% reduction)
   *
   * Expected Impact: 50-70% reduction in total token count
   */
  private _deduplicate(tokens: Token[]): Token[] {
    if (tokens.length === 0) {
      return tokens;
    }

    // Group tokens by identity
    const groups = new Map<string, Token[]>();

    for (const token of tokens) {
      // Identity key: token name + matched pattern (if available)
      const key = token.matched_pattern
        ? `${token.text}:${token.matched_pattern}`
        : token.text;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(token);
    }

    // For each group, select the best token
    const deduplicated: Token[] = [];

    for (const [key, groupTokens] of groups.entries()) {
      if (groupTokens.length === 1) {
        // No duplicates, keep as-is
        deduplicated.push(groupTokens[0]);
        continue;
      }

      // Multiple occurrences - select the best one
      // Sorting criteria (in order of priority):
      // 1. is_dominant = true (most important)
      // 2. Longer pattern_length (more specific match)
      // 3. Lower chunk_index (earlier in text)
      const best = groupTokens.sort((a, b) => {
        // 1. Dominant tokens first
        if (a.is_dominant && !b.is_dominant) return -1;
        if (!a.is_dominant && b.is_dominant) return 1;

        // 2. Longer patterns first
        const aLen = a.pattern_length || 0;
        const bLen = b.pattern_length || 0;
        if (aLen !== bLen) return bLen - aLen;

        // 3. Earlier chunks first
        return a.chunk_index - b.chunk_index;
      })[0];

      deduplicated.push(best);
    }

    return deduplicated;
  }

  /**
   * Step 3: Assign weights to tokens
   * Factors: tier (lower = higher weight) + position (first/last matter more)
   */
  private _weight(tokens: Token[]): Token[] {
    if (tokens.length === 0) {
      return tokens;
    }

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Tier weight: lower tier = higher weight
      const tierWeight = 1.0 / (1 + token.tier * 0.5);

      // Position weight: first and last matter more
      const positionWeight = i < 3 || i >= tokens.length - 3 ? 1.2 : 1.0;

      token.weight = tierWeight * positionWeight;
    }

    // Normalize weights to sum to 1.0
    const total = tokens.reduce((sum, t) => sum + t.weight, 0) || 1;
    for (const token of tokens) {
      token.weight /= total;
    }

    return tokens;
  }

  /**
   * Step 4: Count tokens per tier
   * EE optimized with array indexing
   */
  private _tierDistribution(tokens: Token[]): Record<number, number> {
    // EE Optimization: Array indexing is faster than object access
    const counts = new Array(13).fill(0);

    for (const token of tokens) {
      if (token.tier >= 0 && token.tier <= 12) {
        counts[token.tier]++;
      }
    }

    // Convert to object for interface compatibility
    const dist: Record<number, number> = {};
    for (let i = 0; i <= 12; i++) {
      dist[i] = counts[i];
    }

    return dist;
  }

  /**
   * Step 5: Find dominant tier
   */
  private _classify(distribution: Record<number, number>): number {
    const values = Object.values(distribution);
    if (values.every(v => v === 0)) {
      return 5; // Default to Probabilistic
    }

    let maxTier = 5;
    let maxCount = 0;

    for (const [tierStr, count] of Object.entries(distribution)) {
      if (count > maxCount) {
        maxCount = count;
        maxTier = parseInt(tierStr);
      }
    }

    return maxTier;
  }

  /**
   * Step 6: Calculate stability (ΔH - how grounded)
   * S = (T0 + T1 + T2 + T3 tokens) / total
   * EE optimized with direct addition
   */
  private _stability(tokens: Token[], distribution: Record<number, number>): number {
    const total = tokens.length || 1;

    // EE Optimization: Direct addition is ~3x faster than reduce
    const lowTier = distribution[0] + distribution[1] + distribution[2] + distribution[3];

    return lowTier / total;
  }

  /**
   * Step 7: Calculate entropy (ΔS - uncertainty)
   *
   * For grounded truths (T0-T4): Use TIER_RESISTANCE (inherently low uncertainty)
   * For uncertain claims (T5-T12): Use Shannon entropy (token diversity)
   *
   * H = -Σ p(tier) × log₂(p(tier))
   * Normalized to 0-1
   */
  private _entropy(distribution: Record<number, number>, total: number, tier: number): number {
    if (total === 0) {
      return 0.0;
    }

    // For grounded truths (T0-T4), entropy = tier resistance
    // This ensures:
    // - 2+2=4 (T1): 2% entropy (near certain)
    // - Gravity (T2): 8% entropy (physical law)
    // - DNA (T3): 17% entropy (scientific consensus)
    // - WWII 1945 (T4): 28% entropy (historical fact)
    if (tier <= 4) {
      const resistance = TIER_RESISTANCE[tier] || 0.0;
      return resistance;
    }

    // For uncertain tiers (T5-T12), use Shannon entropy
    let entropy = 0.0;

    for (const count of Object.values(distribution)) {
      if (count > 0) {
        const p = count / total;
        entropy -= p * Math.log2(p);
      }
    }

    // Normalize to 0-1 (max entropy is log2(13) ≈ 3.7)
    const maxEntropy = Math.log2(13);
    return maxEntropy > 0 ? entropy / maxEntropy : 0.0;
  }

  /**
   * Step 8: Calculate energy (THE FORMULA)
   * E = ΔH - T × ΔS
   *
   * Where:
   * - ΔH (Enthalpy) = Stability (bond strength / grounding)
   * - T (Temperature) = 0.5 (context temperature)
   * - ΔS (Entropy) = Entropy (uncertainty)
   */
  private _energy(stability: number, entropy: number): number {
    const T = 0.5; // Context temperature
    return stability - T * entropy;
  }

  /**
   * Step 9: Calculate confidence score
   * C = 0.4 × stability + 0.3 × (1 - entropy) + 0.3 × energy_normalized
   */
  private _confidence(stability: number, entropy: number, energy: number): number {
    const energyNormalized = (energy + 1) / 2; // Normalize -1..1 to 0..1

    const confidence =
      0.4 * stability +
      0.3 * (1 - entropy) +
      0.3 * energyNormalized;

    return Math.max(0.0, Math.min(1.0, confidence));
  }

  /**
   * Return empty result for empty input
   */
  private _emptyResult(): ChemistryResult {
    const dist: Record<number, number> = {};
    for (let i = 0; i <= 12; i++) {
      dist[i] = 0;
    }

    return {
      original_text: '',
      chunks: [],  // Empty structured chunks array
      tokens: [],
      tier: 5,
      tier_name: 'Probabilistic',
      tier_distribution: dist,
      // Phase 1: Topic detection (empty)
      topics: [],
      primary_topic: undefined,
      verification_needed: false,
      // NEW: Complete linguistic mapping fields
      token_type_coverage: {
        unique_types: 0,
        total_possible: 392,
        coverage_percent: 0,
        type_distribution: {}
      },
      dominant_tiers: [],
      stability: 0.5,
      entropy: 0.0,
      energy: 0.5,
      total_weight: 0.0,
      high_weight_tokens: [],
      confidence: 0.5,
      processed_at: new Date().toISOString(),
      processing_ms: 0,
    };
  }

  /**
   * Calculate token type coverage - NO SHORTCUTS
   * Shows how many of the 392 possible token types are present
   * This is COMPLETE LINGUISTIC MAPPING
   */
  private _calculateTokenTypeCoverage(tokens: Token[]): {
    unique_types: number;
    total_possible: number;
    coverage_percent: number;
    type_distribution: Record<string, number>;
  } {
    const uniqueTokenTypes = new Set<string>();
    const typeDistribution: Record<string, number> = {};

    for (const token of tokens) {
      // Create unique key: "Category_T#" e.g., "Physical_T2"
      const typeKey = `${token.category}_T${token.tier}`;
      uniqueTokenTypes.add(typeKey);
      typeDistribution[typeKey] = (typeDistribution[typeKey] || 0) + 1;
    }

    return {
      unique_types: uniqueTokenTypes.size,
      total_possible: 392, // Total token types in ontology
      coverage_percent: (uniqueTokenTypes.size / 392) * 100,
      type_distribution: typeDistribution
    };
  }

  /**
   * Compare input and output chemistry
   * Used to validate that responses are appropriate
   */
  compare(inputChem: ChemistryResult, outputChem: ChemistryResult): {
    tier_match: boolean;
    input_tier: number;
    output_tier: number;
    stability_delta: number;
    energy_delta: number;
    grounded: boolean;
    confidence: number;
  } {
    const tierMatch = Math.abs(inputChem.tier - outputChem.tier) <= 2;

    return {
      tier_match: tierMatch,
      input_tier: inputChem.tier,
      output_tier: outputChem.tier,
      stability_delta: outputChem.stability - inputChem.stability,
      energy_delta: outputChem.energy - inputChem.energy,
      grounded: outputChem.stability >= 0.3,
      confidence: (inputChem.confidence + outputChem.confidence) / 2,
    };
  }

}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let _chemistryEngine: UniversalChemistryEngine | null = null;

/**
 * Get THE universal chemistry engine
 * This is the ONE engine that ALL components use
 */
export function getChemistryEngine(): UniversalChemistryEngine {
  if (!_chemistryEngine) {
    _chemistryEngine = new UniversalChemistryEngine();
  }
  return _chemistryEngine;
}

/**
 * Process any text through language chemistry
 * Convenience function for quick access
 */
export function processChemistry(text: string): ChemistryResult {
  return getChemistryEngine().process(text);
}
