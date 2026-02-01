/**
 * Truth Beast Orchestrator — Centralized decision point for chat.
 *
 * Everything that needs to decide "what do we do next?" in chat goes through here.
 * Source of truth: ORCHESTRATOR-SPEC.md, CHAT-FLOW-AND-PERMISSION
 *
 * Copied from: EXPERIMENTAL TRUTHBEAST NEW BUILD/backend/app/services/truth_beast/orchestrator.py
 */

export enum Action {
  SHORT_PATH = 'SHORT_PATH',           // Return ground truth; no LLM. → SPEAK
  INJECT_AND_SPEAK = 'INJECT_AND_SPEAK', // Call LLM with optional ground-truth context. → SPEAK
  CLARIFY = 'CLARIFY',                 // Ask user to rephrase. → CLARIFY
  REFUSE = 'REFUSE'                    // Decline to answer. → REFUSE
}

export interface UserChemistry {
  tier?: number | null;
  confidence?: number | null;
  entropy?: number | null;
  stability?: number | null;
  energy?: number | null;
}

export interface GroundTruthMatch {
  claim_text: string;
  confidence: number;
  tier?: number;
}

export interface OrchestratorConfig {
  use_ground_truth?: boolean;
  entropy_clarify_threshold?: number; // Disabled when >= 1.0 (entropy typically 0–1)
}

export interface OrchestratorDecision {
  action: Action;
  payload: string | string[] | null;
}

/**
 * Decide the next chat action. Single entry point; no other place in chat path makes this decision.
 *
 * @param user_message - The user's message text
 * @param user_chemistry - Tier, confidence, entropy
 * @param ground_truth_matches - List from GroundTruthDB.search_claims
 * @param config - Optional config (defaults: use_ground_truth=true, entropy_clarify_threshold=1.0)
 *
 * @returns { action, payload }
 *   - SHORT_PATH → payload is single claim text (string)
 *   - INJECT_AND_SPEAK → payload is list of claim texts or null
 *   - CLARIFY → payload is reason string
 *   - REFUSE → payload is reason string
 *
 * Spec: ORCHESTRATOR-SPEC.md
 */
export function decide(
  user_message: string,
  user_chemistry: UserChemistry,
  ground_truth_matches: GroundTruthMatch[],
  config?: OrchestratorConfig
): OrchestratorDecision {
  const cfg: OrchestratorConfig = {
    use_ground_truth: true,
    entropy_clarify_threshold: 1.0,
    ...config
  };

  const chem = user_chemistry || {};

  // Rule 0: Optional entropy branch - if threshold set and entropy high → CLARIFY
  if (
    chem.entropy !== null &&
    chem.entropy !== undefined &&
    cfg.entropy_clarify_threshold! < 1.0 &&
    chem.entropy > cfg.entropy_clarify_threshold!
  ) {
    const reason = 'Your message is very uncertain; please rephrase so we can respond more reliably.';
    console.log('[Orchestrator] Decision: CLARIFY (entropy_high)', { entropy: chem.entropy });
    return { action: Action.CLARIFY, payload: reason };
  }

  // Rule 1: No ground truth or not enabled → INJECT_AND_SPEAK
  if (!cfg.use_ground_truth || !ground_truth_matches || ground_truth_matches.length === 0) {
    console.log('[Orchestrator] Decision: INJECT_AND_SPEAK (no ground truth)');
    return { action: Action.INJECT_AND_SPEAK, payload: null };
  }

  // Rule 2: One high-confidence match → SHORT_PATH
  if (ground_truth_matches.length === 1) {
    const match = ground_truth_matches[0];
    const confidence = match.confidence || 0.0;

    if (confidence >= 0.9) {
      console.log('[Orchestrator] Decision: SHORT_PATH', { confidence });
      return { action: Action.SHORT_PATH, payload: match.claim_text };
    }

    // One match but low confidence → inject that one
    console.log('[Orchestrator] Decision: INJECT_AND_SPEAK (one match, low confidence)', { confidence });
    return { action: Action.INJECT_AND_SPEAK, payload: [match.claim_text] };
  }

  // Rule 3: Multiple matches → INJECT_AND_SPEAK with list (up to 3)
  const claim_texts = ground_truth_matches.slice(0, 3).map(m => m.claim_text);
  console.log('[Orchestrator] Decision: INJECT_AND_SPEAK (multiple matches)', { count: ground_truth_matches.length });
  return { action: Action.INJECT_AND_SPEAK, payload: claim_texts };
}
