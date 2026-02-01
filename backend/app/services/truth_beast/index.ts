/**
 * Truth Beast System - COMPLETE Integration into Port 3750
 *
 * Components:
 * - Truth Token Registry: 385 truth tokens (T0-T12)
 * - Chemistry Engine: Universal thermodynamic processing (E = ΔH - T×ΔS)
 * - Classifier: Tier classification with full token system
 * - Orchestrator: Centralized decision engine (SHORT_PATH, INJECT_AND_SPEAK, CLARIFY, REFUSE)
 * - Ground Truth: 100+ verified facts database for short-path responses
 *
 * Based on: EXPERIMENTAL TRUTHBEAST NEW BUILD/backend/app/services/truth_beast/
 * Guidance: ECOSYSTEM-GUIDANCE-MATH-CHEMISTRY-PHYSICS-ENTROPY-CLASSIFICATION-PARSING.md
 *
 * Upgrade from simplified patterns → Full 385-token system with chemistry engine!
 */

// ============================================================================
// Classifier (COMPLETE 3-layer architecture: Token → LLM → Chemistry)
// ============================================================================
export { classify, classifySync, getClassifierStats, clearClassifierCache } from './classifier.js';
export type { ClassificationResult } from './classifier.js';

// ============================================================================
// Orchestrator (decision engine)
// ============================================================================
export { decide, Action } from './orchestrator.js';
export type {
  UserChemistry,
  GroundTruthMatch,
  OrchestratorConfig,
  OrchestratorDecision
} from './orchestrator.js';

// ============================================================================
// Ground Truth Database (100+ facts)
// ============================================================================
export { GroundTruthDB, getGroundTruthDB } from './ground-truth.js';

// ============================================================================
// Chemistry Engine (NEW - Universal thermodynamic processor)
// ============================================================================
export {
  getChemistryEngine,
  processChemistry,
  EnergyType,
  UniversalChemistryEngine
} from './chemistry-engine.js';
export type {
  ChemistryResult,
  Token
} from './chemistry-engine.js';

// ============================================================================
// Truth Token Registry (NEW - 385 tokens)
// ============================================================================
export {
  getTruthTokenRegistry,
  TruthTokenRegistry,
  TIER_NAMES,
  TIER_RESISTANCE,
  TIER_ENERGY_SIGNATURES
} from './truth-token-registry.js';
export type {
  TruthTokenRecord
} from './truth-token-registry.js';

// ============================================================================
// Context Bank Loader (NEW - LLM context files)
// ============================================================================
export {
  loadContextFile,
  loadContextForTask,
  getOntology,
  getSystemIdentity,
  getEpistemology,
  getTruthPhysics,
  getDeceptionPatterns,
  clearContextCache,
  getCacheStats
} from './context-loader.js';

// ============================================================================
// Training Data Loader (NEW - Few-shot examples for LLM)
// ============================================================================
export {
  loadTrainingData,
  getExamplesByTier,
  getExamplesByState,
  selectFewShotExamples,
  formatExamplesForPrompt,
  getTrainingStats,
  getRandomExample,
  clearTrainingCache
} from './training-data-loader.js';
export type {
  TrainingExample,
  TrainingData
} from './training-data-loader.js';

// ============================================================================
// LLM Classifier (NEW - The missing layer!)
// ============================================================================
export {
  LLMClassifier,
  getDefaultLLMConfig,
  createLLMClassifier
} from './llm-classifier.js';
export type {
  LLMConfig,
  TokenProfile,
  LLMClassificationInput,
  LLMClassificationOutput
} from './llm-classifier.js';

// ============================================================================
// Configuration (NEW - API keys, feature flags)
// ============================================================================
export {
  getConfig,
  validateConfig,
  getConfigSummary,
  isLLMAvailable,
  getSingletonConfig,
  clearConfig
} from './config.js';
export type {
  TruthBeastConfig
} from './config.js';
