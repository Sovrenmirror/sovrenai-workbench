/**
 * Context Loader - Loads context bank files for LLM prompts
 *
 * These files provide the LLM with the Truth Beast ontology,
 * epistemology, and classification rules.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current directory (ESM compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONTEXT_BANK_PATH = join(__dirname, 'context-bank');

// Cache for context files (load once, reuse many times)
const _contextCache: Map<string, string> = new Map();

/**
 * Load a context file from the context bank
 *
 * @param filename - Name of the context file (e.g., "ONTOLOGY.md")
 * @returns File contents as string
 */
export function loadContextFile(filename: string): string {
  // Check cache first
  if (_contextCache.has(filename)) {
    return _contextCache.get(filename)!;
  }

  try {
    const filepath = join(CONTEXT_BANK_PATH, filename);
    const content = readFileSync(filepath, 'utf-8');
    _contextCache.set(filename, content);
    return content;
  } catch (error) {
    console.warn(`[ContextLoader] Failed to load ${filename}:`, error);
    return '';
  }
}

/**
 * Load context for a specific task type
 *
 * Different tasks need different context files:
 * - classify: Just the ontology
 * - classify_full: Ontology + epistemology
 * - deception: Ontology + deception patterns
 * - full_analysis: All files
 *
 * @param task - Task type
 * @returns Combined context string
 */
export function loadContextForTask(task: string): string {
  const baseFiles = ['SYSTEM_IDENTITY.md'];

  const taskFiles: Record<string, string[]> = {
    classify: ['ONTOLOGY.md'],
    classify_full: ['ONTOLOGY.md', 'EPISTEMOLOGY.md'],
    verify: ['ONTOLOGY.md', 'EPISTEMOLOGY.md'],
    deception: ['DECEPTION_PATTERNS.md'],
    full_analysis: ['ONTOLOGY.md', 'EPISTEMOLOGY.md', 'TRUTH_PHYSICS.md', 'DECEPTION_PATTERNS.md'],
    generate: ['ONTOLOGY.md', 'TRUTH_PHYSICS.md'],
  };

  const files = [...baseFiles, ...(taskFiles[task] || [])];

  const contextParts: string[] = [];
  for (const filename of files) {
    const content = loadContextFile(filename);
    if (content) {
      contextParts.push(`=== ${filename} ===\n${content}`);
    }
  }

  return contextParts.join('\n\n');
}

/**
 * Get the complete ontology (tier definitions)
 */
export function getOntology(): string {
  return loadContextFile('ONTOLOGY.md');
}

/**
 * Get the system identity (who the LLM is)
 */
export function getSystemIdentity(): string {
  return loadContextFile('SYSTEM_IDENTITY.md');
}

/**
 * Get epistemology (knowledge source definitions)
 */
export function getEpistemology(): string {
  return loadContextFile('EPISTEMOLOGY.md');
}

/**
 * Get truth physics (E = ΔH - T×ΔS explanation)
 */
export function getTruthPhysics(): string {
  return loadContextFile('TRUTH_PHYSICS.md');
}

/**
 * Get deception patterns (manipulation detection)
 */
export function getDeceptionPatterns(): string {
  return loadContextFile('DECEPTION_PATTERNS.md');
}

/**
 * Clear the context cache (for reloading after updates)
 */
export function clearContextCache(): void {
  _contextCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; files: string[] } {
  return {
    size: _contextCache.size,
    files: Array.from(_contextCache.keys()),
  };
}
