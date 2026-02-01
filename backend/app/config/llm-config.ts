/**
 * LLM Configuration
 * Centralized LLM provider configuration with environment-based setup
 */

export interface LLMConfig {
  provider: 'anthropic' | 'openai';
  apiKey: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMStatus {
  anthropic: {
    available: boolean;
    model: string;
    keyPresent: boolean;
  };
  openai: {
    available: boolean;
    model: string;
    keyPresent: boolean;
  };
  serper: {
    available: boolean;
    keyPresent: boolean;
  };
  defaultProvider: 'anthropic' | 'openai';
}

/**
 * Get LLM configuration from environment
 */
export function getLLMConfig(provider?: 'anthropic' | 'openai'): LLMConfig | null {
  // Determine provider
  const selectedProvider = provider || getDefaultProvider();

  if (selectedProvider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      console.warn('[LLM Config] Anthropic API key not found');
      return null;
    }

    return {
      provider: 'anthropic',
      apiKey,
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      baseUrl: process.env.ANTHROPIC_BASE_URL,
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4096'),
      stream: process.env.LLM_STREAM !== 'false'
    };
  }

  if (selectedProvider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('[LLM Config] OpenAI API key not found');
      return null;
    }

    return {
      provider: 'openai',
      apiKey,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4096'),
      stream: process.env.LLM_STREAM !== 'false'
    };
  }

  return null;
}

/**
 * Get default LLM provider based on available API keys
 */
function getDefaultProvider(): 'anthropic' | 'openai' {
  const hasAnthropic = !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY);
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  if (hasAnthropic) return 'anthropic';
  if (hasOpenAI) return 'openai';

  // Default to Anthropic even if not configured (will fail gracefully)
  return 'anthropic';
}

/**
 * Build completion config with defaults
 */
export function buildCompletionConfig(overrides?: Partial<LLMConfig>): LLMConfig | null {
  const baseConfig = getLLMConfig();

  if (!baseConfig) {
    return null;
  }

  return {
    ...baseConfig,
    ...overrides
  };
}

/**
 * Get LLM status for all providers
 */
export function getLLMStatus(): LLMStatus {
  const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const serperKey = process.env.SERPER_API_KEY || process.env.SERP_API_KEY;

  return {
    anthropic: {
      available: !!anthropicKey,
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      keyPresent: !!anthropicKey
    },
    openai: {
      available: !!openaiKey,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      keyPresent: !!openaiKey
    },
    serper: {
      available: !!serperKey,
      keyPresent: !!serperKey
    },
    defaultProvider: getDefaultProvider()
  };
}

/**
 * Print LLM status to console
 */
export function printLLMStatus(): void {
  const status = getLLMStatus();

  console.log('\n🤖 LLM Configuration Status:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Anthropic
  const anthropicIcon = status.anthropic.available ? '✅' : '❌';
  console.log(`${anthropicIcon} Anthropic (Claude)`);
  console.log(`   Model: ${status.anthropic.model}`);
  console.log(`   API Key: ${status.anthropic.keyPresent ? 'Present' : 'Missing'}`);

  // OpenAI
  const openaiIcon = status.openai.available ? '✅' : '❌';
  console.log(`\n${openaiIcon} OpenAI (GPT)`);
  console.log(`   Model: ${status.openai.model}`);
  console.log(`   API Key: ${status.openai.keyPresent ? 'Present' : 'Missing'}`);

  // Serper
  const serperIcon = status.serper.available ? '✅' : '❌';
  console.log(`\n${serperIcon} Serper (Web Search)`);
  console.log(`   API Key: ${status.serper.keyPresent ? 'Present' : 'Missing'}`);

  // Default
  console.log(`\n🎯 Default Provider: ${status.defaultProvider}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Warnings
  if (!status.anthropic.available && !status.openai.available) {
    console.warn('⚠️  Warning: No LLM provider configured!');
    console.warn('   Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env\n');
  }

  if (!status.serper.available) {
    console.warn('⚠️  Warning: Web search not available');
    console.warn('   Set SERPER_API_KEY in .env for research agent\n');
  }
}

/**
 * Validate LLM configuration
 */
export function validateLLMConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const status = getLLMStatus();

  if (!status.anthropic.available && !status.openai.available) {
    errors.push('No LLM provider configured (need ANTHROPIC_API_KEY or OPENAI_API_KEY)');
  }

  if (!status.serper.available) {
    errors.push('Web search not available (need SERPER_API_KEY)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Run status check if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  printLLMStatus();

  const validation = validateLLMConfig();
  if (!validation.valid) {
    console.log('❌ Configuration Issues:');
    validation.errors.forEach(error => console.log(`   • ${error}`));
    process.exit(1);
  } else {
    console.log('✅ All LLM providers configured correctly\n');
  }
}
