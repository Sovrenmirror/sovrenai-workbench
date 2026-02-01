/**
 * Training Data Loader
 *
 * Loads and manages training examples for LLM prompt engineering.
 * These examples are used for few-shot learning to improve tier classification accuracy.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current directory (ESM compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Training example interface
 */
export interface TrainingExample {
  text: string;
  tier: number;
  tier_name: string;
  state: string;
  category: string;
  entropy: number;
  domain: string;
  reasoning: string;
}

/**
 * Training data structure
 */
export interface TrainingData {
  examples: TrainingExample[];
  metadata: {
    source: string;
    extracted_date: string;
    total_examples: number;
    examples_by_tier: Record<number, number>;
  };
}

// Cache for training data (load once, reuse many times)
let _trainingData: TrainingData | null = null;

/**
 * Load all training data from JSON file
 *
 * @returns Complete training data with all examples
 */
export function loadTrainingData(): TrainingData {
  if (_trainingData) {
    return _trainingData;
  }

  try {
    const filepath = join(__dirname, 'training-data.json');
    const content = readFileSync(filepath, 'utf-8');
    _trainingData = JSON.parse(content);
    return _trainingData!;
  } catch (error) {
    console.warn('[TrainingDataLoader] Failed to load training data:', error);
    return {
      examples: [],
      metadata: {
        source: '',
        extracted_date: '',
        total_examples: 0,
        examples_by_tier: {}
      }
    };
  }
}

/**
 * Get examples for a specific tier
 *
 * @param tier - Tier number (1-9)
 * @returns Array of examples for that tier
 */
export function getExamplesByTier(tier: number): TrainingExample[] {
  const data = loadTrainingData();
  return data.examples.filter(ex => ex.tier === tier);
}

/**
 * Get examples for a specific truth state
 *
 * @param state - Truth state (GROUND, SEEKING, CONVERGING, DECEPTIVE, etc.)
 * @returns Array of examples with that state
 */
export function getExamplesByState(state: string): TrainingExample[] {
  const data = loadTrainingData();
  return data.examples.filter(ex => ex.state === state);
}

/**
 * Select few-shot training examples for prompt engineering
 *
 * Strategy:
 * 1. Include 1-2 examples from the predicted tier (from token analysis)
 * 2. Include 1-2 examples from adjacent tiers
 * 3. Include 1 example from a very different tier (for contrast)
 *
 * @param predictedTier - Tier predicted by token analysis
 * @param count - Total number of examples to select (default: 5)
 * @returns Array of selected training examples
 */
export function selectFewShotExamples(
  predictedTier: number,
  count: number = 5
): TrainingExample[] {
  const data = loadTrainingData();
  const selected: TrainingExample[] = [];

  // 1. Get examples from predicted tier (2 examples)
  const tierExamples = getExamplesByTier(predictedTier);
  if (tierExamples.length > 0) {
    // Take first 2 examples from predicted tier
    selected.push(...tierExamples.slice(0, 2));
  }

  // 2. Get examples from adjacent tiers (1 example each)
  const adjacentTiers = [predictedTier - 1, predictedTier + 1].filter(
    t => t >= 1 && t <= 9
  );

  for (const tier of adjacentTiers) {
    const examples = getExamplesByTier(tier);
    if (examples.length > 0) {
      selected.push(examples[0]);
    }
  }

  // 3. Get contrasting example from very different tier
  let contrastTier: number;
  if (predictedTier <= 4) {
    // If predicted tier is grounded (1-4), show garbage example (9)
    contrastTier = 9;
  } else if (predictedTier >= 7) {
    // If predicted tier is subjective/spiritual/garbage (7-9), show grounded example (1)
    contrastTier = 1;
  } else {
    // If predicted tier is middle (5-6), show example from either end
    contrastTier = Math.random() > 0.5 ? 1 : 9;
  }

  const contrastExamples = getExamplesByTier(contrastTier);
  if (contrastExamples.length > 0) {
    selected.push(contrastExamples[0]);
  }

  // Return up to 'count' examples
  return selected.slice(0, count);
}

/**
 * Format training examples for LLM prompt
 *
 * Converts examples into formatted text for inclusion in LLM prompt
 *
 * @param examples - Array of training examples
 * @returns Formatted string for LLM prompt
 */
export function formatExamplesForPrompt(examples: TrainingExample[]): string {
  const formatted = examples.map((ex, index) => {
    return `Example ${index + 1}:
Text: "${ex.text}"
TRUTH STATE: ${ex.state}
ONTOLOGICAL TIER: T${ex.tier} (${ex.tier_name})
REASONING: ${ex.reasoning}`;
  });

  return formatted.join('\n\n');
}

/**
 * Get statistics about training data
 *
 * @returns Statistics object
 */
export function getTrainingStats(): {
  total: number;
  byTier: Record<number, number>;
  byState: Record<string, number>;
  byDomain: Record<string, number>;
} {
  const data = loadTrainingData();

  const byState: Record<string, number> = {};
  const byDomain: Record<string, number> = {};

  for (const ex of data.examples) {
    // Count by state
    byState[ex.state] = (byState[ex.state] || 0) + 1;

    // Count by domain
    byDomain[ex.domain] = (byDomain[ex.domain] || 0) + 1;
  }

  return {
    total: data.examples.length,
    byTier: data.metadata.examples_by_tier,
    byState,
    byDomain
  };
}

/**
 * Get a random example (useful for testing)
 *
 * @returns Random training example
 */
export function getRandomExample(): TrainingExample | undefined {
  const data = loadTrainingData();
  if (data.examples.length === 0) {
    return undefined;
  }

  const index = Math.floor(Math.random() * data.examples.length);
  return data.examples[index];
}

/**
 * Clear the training data cache (for reloading after updates)
 */
export function clearTrainingCache(): void {
  _trainingData = null;
}
