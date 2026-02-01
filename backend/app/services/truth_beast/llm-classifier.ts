/**
 * LLM Tier Classifier
 *
 * Uses LLM (Claude/OpenAI/Ollama) to make final tier classification decisions.
 * Token matching (from chemistry engine) is PREPROCESSING - LLM makes the final call.
 *
 * This is the missing layer in the 3-layer architecture:
 * 1. TTO Adapter (token matching + preprocessing) ✅
 * 2. LLM Classification (THIS MODULE) ✅
 * 3. Chemistry Engine (thermodynamic calculations) ✅
 */

import { loadContextForTask } from './context-loader.js';
import { selectFewShotExamples, formatExamplesForPrompt } from './training-data-loader.js';

/**
 * LLM provider configuration
 */
export interface LLMConfig {
  provider: 'claude' | 'openai' | 'ollama';
  model: string;
  apiKey?: string;
  baseURL?: string; // For Ollama
  temperature: number;
  maxTokens: number;
}

/**
 * Token profile from chemistry engine (preprocessing)
 */
export interface TokenProfile {
  tier_distribution: Record<number, number>;
  tokens_matched: Array<{
    symbol: string;
    tier: number;
    weight: number;
  }>;
  dominant_tier: number;
  confidence: number;
}

/**
 * Input for LLM classification
 */
export interface LLMClassificationInput {
  text: string;
  tokenProfile: TokenProfile;
  context?: string;
}

/**
 * Output from LLM classification
 */
export interface LLMClassificationOutput {
  tier: number;
  tier_name: string;
  verdict: 'TRUE' | 'FALSE' | 'OPINION' | 'BELIEF' | 'CONTEXTUAL' | 'DECEPTIVE' | 'UNCERTAIN';
  state: 'GROUND' | 'SEEKING' | 'CONVERGING' | 'HALLUCINATED' | 'DECEPTIVE' | 'INFLATED';
  tokens: string[];
  reasoning: string;
  confidence: number;
  provider: string;
  model: string;
  raw_response?: string;
}

/**
 * LLM Classifier - The missing layer
 *
 * Token matching tells us what patterns exist, but LLM decides the final tier.
 */
export class LLMClassifier {
  private config: LLMConfig;
  private systemContext: string;

  constructor(config: LLMConfig) {
    this.config = config;

    // Load system context from context bank
    // Uses SYSTEM_IDENTITY + ONTOLOGY (tier definitions)
    this.systemContext = loadContextForTask('classify');
  }

  /**
   * Classify text using LLM with token profile context
   *
   * Flow:
   * 1. Load system context (ontology, tier definitions)
   * 2. Select few-shot training examples based on predicted tier
   * 3. Build prompt with context + examples + token profile
   * 4. Call LLM (Claude/GPT/Ollama)
   * 5. Parse response into structured format
   *
   * @param input - Text to classify + token profile from chemistry engine
   * @returns LLM classification result
   */
  async classify(input: LLMClassificationInput): Promise<LLMClassificationOutput> {
    try {
      // 1. Select few-shot training examples (5 examples)
      const trainingExamples = selectFewShotExamples(input.tokenProfile.dominant_tier, 5);
      const fewShotText = formatExamplesForPrompt(trainingExamples);

      // 2. Build prompt with all context
      const prompt = this._buildPrompt(input, fewShotText);

      // 3. Call LLM (model-agnostic)
      const rawResponse = await this._callLLM(prompt);

      // 4. Parse response
      const parsed = this._parseResponse(rawResponse);

      return {
        ...parsed,
        provider: this.config.provider,
        model: this.config.model,
        raw_response: rawResponse
      };
    } catch (error) {
      console.error('[LLMClassifier] Classification failed:', error);

      // Fallback: Use token-based prediction
      return this._fallbackClassification(input, error);
    }
  }

  /**
   * Build the complete prompt for LLM
   *
   * Structure:
   * 1. System context (SYSTEM_IDENTITY + ONTOLOGY)
   * 2. Token analysis results (preprocessing)
   * 3. Few-shot training examples
   * 4. Claim to classify
   * 5. Response format instructions
   */
  private _buildPrompt(input: LLMClassificationInput, fewShotText: string): string {
    // Token profile summary
    const topTokens = input.tokenProfile.tokens_matched
      .slice(0, 5)
      .map(t => `${t.symbol} (T${t.tier}, weight: ${t.weight.toFixed(2)})`)
      .join(', ');

    const tierDist = Object.entries(input.tokenProfile.tier_distribution)
      .filter(([_, weight]) => weight > 0)
      .map(([tier, weight]) => `T${tier}: ${weight.toFixed(2)}`)
      .join(', ');

    return `${this.systemContext}

---

## TOKEN ANALYSIS (Preprocessing)

The text has been preprocessed using the Truth Token Registry (385 tokens).
This analysis provides HINTS but YOU make the final tier decision.

**Predicted Tier:** T${input.tokenProfile.dominant_tier}
**Confidence:** ${(input.tokenProfile.confidence * 100).toFixed(1)}%
**Top Tokens Matched:** ${topTokens || 'None'}
**Tier Distribution:** ${tierDist || 'None'}

---

## FEW-SHOT TRAINING EXAMPLES

Study these examples to understand the tier classification patterns:

${fewShotText}

---

## YOUR TASK

Classify the following claim using the tier system (T1-T9).
Consider the token analysis but make your own independent judgment.

**CLAIM TO CLASSIFY:**
"${input.text}"

---

## RESPONSE FORMAT

Respond with EXACTLY this format (no additional text):

VERDICT: <TRUE|FALSE|OPINION|BELIEF|CONTEXTUAL|DECEPTIVE|UNCERTAIN>
TIER: <1-9>
TIER_NAME: <Universal|Physical|Scientific|Historical|Probabilistic|Contextual|Subjective|Spiritual|Garbage>
STATE: <GROUND|SEEKING|CONVERGING|HALLUCINATED|DECEPTIVE|INFLATED>
TOKENS: <comma-separated list of key concepts/tokens>
REASONING: <brief explanation of why you chose this tier>
CONFIDENCE: <0.0-1.0>

Example response:
VERDICT: TRUE
TIER: 3
TIER_NAME: Scientific
STATE: GROUND
TOKENS: DNA, genetic, biology, consensus
REASONING: This reflects established scientific consensus supported by peer-reviewed research.
CONFIDENCE: 0.95`;
  }

  /**
   * Call LLM API (model-agnostic)
   */
  private async _callLLM(prompt: string): Promise<string> {
    switch (this.config.provider) {
      case 'claude':
        return this._callClaude(prompt);
      case 'openai':
        return this._callOpenAI(prompt);
      case 'ollama':
        return this._callOllama(prompt);
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  /**
   * Call Claude API (Anthropic)
   */
  private async _callClaude(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('Claude API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-opus-4-5-20251101',
        max_tokens: this.config.maxTokens || 512,
        temperature: this.config.temperature || 0.2,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Call OpenAI API (GPT)
   */
  private async _callOpenAI(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature || 0.2,
        max_tokens: this.config.maxTokens || 512,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Call Ollama API (Local)
   */
  private async _callOllama(prompt: string): Promise<string> {
    const baseURL = this.config.baseURL || 'http://localhost:11434';

    const response = await fetch(`${baseURL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'gemma2',
        prompt: prompt,
        stream: false,
        options: {
          temperature: this.config.temperature || 0.2,
          num_predict: this.config.maxTokens || 512,
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.response;
  }

  /**
   * Parse LLM response into structured format
   *
   * Expected format:
   * VERDICT: TRUE
   * TIER: 3
   * TIER_NAME: Scientific
   * STATE: GROUND
   * TOKENS: dna, genetic, biology
   * REASONING: This reflects established...
   * CONFIDENCE: 0.95
   */
  private _parseResponse(rawResponse: string): Omit<LLMClassificationOutput, 'provider' | 'model' | 'raw_response'> {
    const lines = rawResponse.split('\n');

    let verdict: LLMClassificationOutput['verdict'] = 'UNCERTAIN';
    let tier = 6; // Default: Contextual
    let tier_name = 'Contextual';
    let state: LLMClassificationOutput['state'] = 'SEEKING';
    let tokens: string[] = [];
    let reasoning = '';
    let confidence = 0.5;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('VERDICT:')) {
        const value = trimmed.substring(8).trim();
        if (['TRUE', 'FALSE', 'OPINION', 'BELIEF', 'CONTEXTUAL', 'DECEPTIVE', 'UNCERTAIN'].includes(value)) {
          verdict = value as LLMClassificationOutput['verdict'];
        }
      } else if (trimmed.startsWith('TIER:')) {
        const value = trimmed.substring(5).trim();
        const parsed = parseInt(value);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 12) {
          tier = parsed;
        }
      } else if (trimmed.startsWith('TIER_NAME:')) {
        tier_name = trimmed.substring(10).trim();
      } else if (trimmed.startsWith('STATE:')) {
        const value = trimmed.substring(6).trim();
        if (['GROUND', 'SEEKING', 'CONVERGING', 'HALLUCINATED', 'DECEPTIVE', 'INFLATED'].includes(value)) {
          state = value as LLMClassificationOutput['state'];
        }
      } else if (trimmed.startsWith('TOKENS:')) {
        const value = trimmed.substring(7).trim();
        tokens = value.split(',').map(t => t.trim()).filter(t => t.length > 0);
      } else if (trimmed.startsWith('REASONING:')) {
        reasoning = trimmed.substring(10).trim();
      } else if (trimmed.startsWith('CONFIDENCE:')) {
        const value = trimmed.substring(11).trim();
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          confidence = parsed;
        }
      }
    }

    return {
      tier,
      tier_name,
      verdict,
      state,
      tokens,
      reasoning,
      confidence
    };
  }

  /**
   * Fallback classification if LLM call fails
   *
   * Uses token-based prediction from chemistry engine
   */
  private _fallbackClassification(
    input: LLMClassificationInput,
    error: unknown
  ): LLMClassificationOutput {
    console.warn('[LLMClassifier] Using fallback classification due to error:', error);

    const tier = input.tokenProfile.dominant_tier;
    const tierNames: Record<number, string> = {
      1: 'Universal',
      2: 'Physical',
      3: 'Scientific',
      4: 'Historical',
      5: 'Probabilistic',
      6: 'Contextual',
      7: 'Subjective',
      8: 'Spiritual',
      9: 'Garbage'
    };

    return {
      tier,
      tier_name: tierNames[tier] || 'Contextual',
      verdict: tier <= 4 ? 'TRUE' : tier <= 6 ? 'CONTEXTUAL' : tier === 7 ? 'OPINION' : tier === 8 ? 'BELIEF' : 'DECEPTIVE',
      state: input.tokenProfile.confidence >= 0.7 ? 'GROUND' : 'SEEKING',
      tokens: input.tokenProfile.tokens_matched.slice(0, 5).map(t => t.symbol),
      reasoning: `Fallback classification based on token analysis. Predicted tier: T${tier}. LLM call failed: ${error}`,
      confidence: input.tokenProfile.confidence * 0.7, // Reduce confidence for fallback
      provider: this.config.provider,
      model: 'fallback-token-only'
    };
  }
}

/**
 * Default LLM configuration
 *
 * Can be overridden via environment variables or explicit config
 */
export function getDefaultLLMConfig(): LLMConfig {
  // Check environment variables
  const provider = (process.env.TRUTH_BEAST_PROVIDER || 'claude') as 'claude' | 'openai' | 'ollama';
  const model = process.env.TRUTH_BEAST_MODEL || (provider === 'claude' ? 'claude-opus-4-5-20251101' : provider === 'openai' ? 'gpt-4o' : 'gemma2');
  const apiKey = provider === 'claude' ? process.env.ANTHROPIC_API_KEY : provider === 'openai' ? process.env.OPENAI_API_KEY : undefined;
  const baseURL = provider === 'ollama' ? (process.env.OLLAMA_BASE_URL || 'http://localhost:11434') : undefined;

  return {
    provider,
    model,
    apiKey,
    baseURL,
    temperature: 0.2, // Deterministic (low temperature)
    maxTokens: 512
  };
}

/**
 * Create LLM classifier with default config
 */
export function createLLMClassifier(config?: Partial<LLMConfig>): LLMClassifier {
  const defaultConfig = getDefaultLLMConfig();
  const finalConfig = { ...defaultConfig, ...config };
  return new LLMClassifier(finalConfig);
}
