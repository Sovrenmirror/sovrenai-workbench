/**
 * Truth Beast Configuration
 *
 * Manages configuration for LLM integration, API keys, and feature flags.
 * Reads from environment variables with sensible defaults.
 */

export interface TruthBeastConfig {
  // LLM Provider
  provider: 'claude' | 'openai' | 'ollama';
  model: string;
  apiKey?: string;
  baseURL?: string; // For Ollama

  // Feature Flags
  useLLM: boolean; // Use LLM for classification (vs token-only)
  fastPath: boolean; // Skip LLM for high-confidence T0-T4 classifications
  useTrainingData: boolean; // Include few-shot examples in prompts

  // LLM Parameters
  temperature: number; // 0.0 (deterministic) - 1.0 (creative)
  maxTokens: number; // Max tokens in LLM response

  // Performance
  cacheEnabled: boolean; // Cache chemistry results
  cacheMaxSize: number; // Max cache entries
  deduplicateTokens: boolean; // Remove duplicate token matches from overlapping chunks

  // Thresholds
  fastPathConfidenceThreshold: number; // Min confidence for fast-path (skip LLM)
  fastPathTierMax: number; // Max tier for fast-path (1-4 = grounded)
}

/**
 * Get Truth Beast configuration from environment variables
 *
 * Environment variables:
 * - TRUTH_BEAST_PROVIDER: claude | openai | ollama
 * - TRUTH_BEAST_MODEL: Model ID (claude-opus-4-5-20251101, gpt-4o, gemma2)
 * - ANTHROPIC_API_KEY: Claude API key
 * - OPENAI_API_KEY: OpenAI API key
 * - OLLAMA_BASE_URL: Ollama base URL (default: http://localhost:11434)
 * - TRUTH_BEAST_USE_LLM: true | false (default: true)
 * - TRUTH_BEAST_FAST_PATH: true | false (default: true)
 * - TRUTH_BEAST_USE_TRAINING_DATA: true | false (default: true)
 */
export function getConfig(): TruthBeastConfig {
  // Provider selection
  const provider = (process.env.TRUTH_BEAST_PROVIDER || 'claude') as 'claude' | 'openai' | 'ollama';

  // Model selection (provider-specific defaults)
  let model: string;
  if (process.env.TRUTH_BEAST_MODEL) {
    model = process.env.TRUTH_BEAST_MODEL;
  } else {
    switch (provider) {
      case 'claude':
        model = 'claude-opus-4-5-20251101';
        break;
      case 'openai':
        model = 'gpt-4o';
        break;
      case 'ollama':
        model = 'gemma2';
        break;
      default:
        model = 'claude-opus-4-5-20251101';
    }
  }

  // API key (provider-specific)
  let apiKey: string | undefined;
  if (provider === 'claude') {
    apiKey = process.env.ANTHROPIC_API_KEY;
  } else if (provider === 'openai') {
    apiKey = process.env.OPENAI_API_KEY;
  }
  // Ollama doesn't need API key (local)

  // Base URL (for Ollama)
  const baseURL = provider === 'ollama' ? (process.env.OLLAMA_BASE_URL || 'http://localhost:11434') : undefined;

  // Feature flags
  const useLLM = process.env.TRUTH_BEAST_USE_LLM !== 'false'; // Default: true
  const fastPath = process.env.TRUTH_BEAST_FAST_PATH !== 'false'; // Default: true
  const useTrainingData = process.env.TRUTH_BEAST_USE_TRAINING_DATA !== 'false'; // Default: true

  // LLM parameters
  const temperature = parseFloat(process.env.TRUTH_BEAST_TEMPERATURE || '0.2');
  const maxTokens = parseInt(process.env.TRUTH_BEAST_MAX_TOKENS || '512');

  // Performance
  const cacheEnabled = process.env.TRUTH_BEAST_CACHE_ENABLED !== 'false'; // Default: true
  const cacheMaxSize = parseInt(process.env.TRUTH_BEAST_CACHE_MAX_SIZE || '1000');
  const deduplicateTokens = process.env.TRUTH_BEAST_DEDUPLICATE_TOKENS !== 'false'; // Default: true

  // Thresholds
  const fastPathConfidenceThreshold = parseFloat(process.env.TRUTH_BEAST_FAST_PATH_CONFIDENCE || '0.85');
  const fastPathTierMax = parseInt(process.env.TRUTH_BEAST_FAST_PATH_TIER_MAX || '4');

  return {
    provider,
    model,
    apiKey,
    baseURL,
    useLLM,
    fastPath,
    useTrainingData,
    temperature,
    maxTokens,
    cacheEnabled,
    cacheMaxSize,
    deduplicateTokens,
    fastPathConfidenceThreshold,
    fastPathTierMax
  };
}

/**
 * Validate configuration
 *
 * Checks that required API keys are present if LLM is enabled
 *
 * @returns Array of validation errors (empty if valid)
 */
export function validateConfig(config: TruthBeastConfig): string[] {
  const errors: string[] = [];

  // If LLM is enabled, check for API key (except Ollama)
  if (config.useLLM && config.provider !== 'ollama') {
    if (!config.apiKey) {
      if (config.provider === 'claude') {
        errors.push('ANTHROPIC_API_KEY environment variable is required for Claude provider');
      } else if (config.provider === 'openai') {
        errors.push('OPENAI_API_KEY environment variable is required for OpenAI provider');
      }
    }
  }

  // Validate numeric ranges
  if (config.temperature < 0 || config.temperature > 1) {
    errors.push('Temperature must be between 0.0 and 1.0');
  }

  if (config.maxTokens < 64 || config.maxTokens > 4096) {
    errors.push('maxTokens must be between 64 and 4096');
  }

  if (config.fastPathConfidenceThreshold < 0 || config.fastPathConfidenceThreshold > 1) {
    errors.push('fastPathConfidenceThreshold must be between 0.0 and 1.0');
  }

  if (config.fastPathTierMax < 0 || config.fastPathTierMax > 9) {
    errors.push('fastPathTierMax must be between 0 and 9');
  }

  return errors;
}

/**
 * Get configuration status summary
 *
 * Useful for logging/debugging
 */
export function getConfigSummary(config: TruthBeastConfig): string {
  const lines: string[] = [];

  lines.push('Truth Beast Configuration:');
  lines.push(`  Provider: ${config.provider}`);
  lines.push(`  Model: ${config.model}`);
  lines.push(`  API Key: ${config.apiKey ? '✓ Configured' : '✗ Missing'}`);
  lines.push(`  Use LLM: ${config.useLLM ? '✓ Enabled' : '✗ Disabled (token-only)'}`);
  lines.push(`  Fast-path: ${config.fastPath ? '✓ Enabled' : '✗ Disabled'}`);
  if (config.fastPath) {
    lines.push(`    - Confidence threshold: ${config.fastPathConfidenceThreshold}`);
    lines.push(`    - Max tier: T${config.fastPathTierMax}`);
  }
  lines.push(`  Training data: ${config.useTrainingData ? '✓ Enabled' : '✗ Disabled'}`);
  lines.push(`  Temperature: ${config.temperature}`);
  lines.push(`  Max tokens: ${config.maxTokens}`);
  lines.push(`  Cache: ${config.cacheEnabled ? '✓ Enabled' : '✗ Disabled'} (max: ${config.cacheMaxSize})`);
  lines.push(`  Deduplication: ${config.deduplicateTokens ? '✓ Enabled' : '✗ Disabled'}`);

  return lines.join('\n');
}

/**
 * Check if LLM is available and configured
 *
 * Returns true if:
 * - useLLM is enabled
 * - Provider is configured
 * - API key is present (for Claude/OpenAI)
 */
export function isLLMAvailable(config: TruthBeastConfig): boolean {
  if (!config.useLLM) {
    return false;
  }

  // Ollama doesn't need API key
  if (config.provider === 'ollama') {
    return true;
  }

  // Claude and OpenAI need API key
  return !!config.apiKey;
}

/**
 * Singleton config instance (lazy-loaded)
 */
let _config: TruthBeastConfig | null = null;

/**
 * Get singleton config instance
 */
export function getSingletonConfig(): TruthBeastConfig {
  if (!_config) {
    _config = getConfig();
  }
  return _config;
}

/**
 * Clear singleton config (for testing/reload)
 */
export function clearConfig(): void {
  _config = null;
}
