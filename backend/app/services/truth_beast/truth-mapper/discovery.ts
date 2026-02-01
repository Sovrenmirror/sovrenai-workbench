/**
 * Discovery Module - Intelligent Research Loop
 *
 * Productive research pipeline:
 * 1. research(question) → get result, gaps, next_steps
 * 2. If gaps exist and next_steps suggest gathering → runGatherPipeline()
 * 3. research(question) again with newly stored claims
 * 4. Repeat until stable or max_rounds reached
 *
 * Referenced in:
 * - PULL-BACK-CHAIN-TEST-RUN.md
 * - HOW-TO-PROGRAM-A-PROPER-AI-RESEARCHER.md
 */

import { getGroundTruthDB } from '../ground-truth.js';
import { UniversalChemistryEngine } from '../chemistry-engine.js';
import { topicDetector } from '../topic-database.js';
import { searchWeb, extractClaimsFromResults } from './serp.js';

export interface DiscoverOptions {
  max_rounds?: number;         // Default: 2
  auto_gather?: boolean;        // Default: true
  gather_max_claims?: number;   // Default: 5
  serp_available?: boolean;     // Default: false (until SERP is implemented)
}

export interface ResearchResult {
  answer: string;               // Current best answer
  confidence: number;           // 0.0-1.0
  gaps: string[];              // What we don't know yet
  next_steps: string[];        // Suggested actions
  sources_used: number;        // Number of ground truth claims used
  stable: boolean;             // True if no gaps and high confidence
}

export interface DiscoverResult {
  result: ResearchResult;      // Final research result
  gather_ran: boolean;         // True if SERP gathering occurred
  stored_claims: number;       // Number of new claims added
  rounds: number;              // Number of research rounds completed
}

/**
 * Main discovery function - runs the productive research loop
 *
 * @param question - User's question to research
 * @param options - Configuration options
 * @returns DiscoverResult with final answer and metadata
 */
export async function discover(
  question: string,
  options?: DiscoverOptions
): Promise<DiscoverResult> {
  const opts: Required<DiscoverOptions> = {
    max_rounds: 2,
    auto_gather: true,
    gather_max_claims: 5,
    serp_available: false,
    ...options
  };

  console.log(`[Discovery] Starting research loop for: "${question}"`);
  console.log(`[Discovery] Config: max_rounds=${opts.max_rounds}, auto_gather=${opts.auto_gather}`);

  let round = 0;
  let gather_ran = false;
  let stored_claims = 0;

  // Round 1: Initial research
  round++;
  console.log(`[Discovery] Round ${round}: Initial research`);
  let result = await research(question);

  // Check if we need to gather more evidence
  if (!result.stable && opts.auto_gather && opts.serp_available) {
    // Check if next_steps suggest gathering
    const should_gather = result.next_steps.some(step =>
      step.toLowerCase().includes('serp') ||
      step.toLowerCase().includes('search') ||
      step.toLowerCase().includes('gather') ||
      step.toLowerCase().includes('ground truth')
    );

    if (should_gather && round < opts.max_rounds) {
      console.log(`[Discovery] Gaps detected, running gather pipeline...`);

      // Run SERP gathering
      const gathered = await runGatherPipeline(question, opts.gather_max_claims);
      gather_ran = true;
      stored_claims = gathered.claims_added;

      console.log(`[Discovery] Gather complete: ${stored_claims} claims added`);

      // Round 2: Re-research with new claims
      round++;
      console.log(`[Discovery] Round ${round}: Re-research with new evidence`);
      result = await research(question);
    }
  }

  console.log(`[Discovery] Complete after ${round} rounds`);
  console.log(`[Discovery] Final: stable=${result.stable}, confidence=${result.confidence.toFixed(2)}`);

  return {
    result,
    gather_ran,
    stored_claims,
    rounds: round
  };
}

/**
 * Research a question using available ground truth
 *
 * @param question - User's question
 * @returns ResearchResult with answer, gaps, and next steps
 */
async function research(question: string): Promise<ResearchResult> {
  const groundTruth = getGroundTruthDB();
  const chemistry = new UniversalChemistryEngine();

  // Analyze the question
  const analysis = chemistry.process(question);
  const topics = topicDetector.detectTopics(question);

  // Search ground truth for relevant claims
  const matches = groundTruth.search_claims(question, 10, 4);

  console.log(`[Research] Found ${matches.length} ground truth matches`);
  console.log(`[Research] Detected ${topics.length} topics`);
  console.log(`[Research] Chemistry: T${analysis.tier}, confidence ${(analysis.confidence * 100).toFixed(0)}%`);

  // Determine if we have enough information
  const has_evidence = matches.length > 0;
  const high_confidence_match = matches.some(m => m.confidence >= 0.9);
  const multiple_sources = matches.length >= 3;

  // Build answer from available evidence
  let answer = '';
  let confidence = 0.0;
  let gaps: string[] = [];
  let next_steps: string[] = [];
  let sources_used = 0;

  if (high_confidence_match) {
    // Strong match found
    const best_match = matches[0];
    answer = best_match.claim_text;
    confidence = best_match.confidence;
    sources_used = 1;

    console.log(`[Research] High-confidence match found: "${answer.substring(0, 60)}..."`);
  } else if (multiple_sources) {
    // Multiple weak matches - synthesize
    answer = `Based on ${matches.length} related facts: ` +
             matches.slice(0, 3).map(m => m.claim_text).join('; ');
    confidence = 0.7;
    sources_used = matches.length;

    console.log(`[Research] Synthesized from ${sources_used} sources`);
  } else if (has_evidence) {
    // Some evidence but not strong
    answer = `Partial information available: ${matches[0].claim_text}`;
    confidence = 0.5;
    sources_used = 1;
    gaps.push('Need more comprehensive information');
    next_steps.push('Run SERP to gather additional claims');

    console.log(`[Research] Weak evidence, gaps identified`);
  } else {
    // No evidence found
    answer = 'No direct evidence found in ground truth database';
    confidence = 0.0;
    gaps.push('No ground truth claims match this question');
    gaps.push('Need to gather external evidence');
    next_steps.push('Run SERP to find and extract relevant claims');
    next_steps.push('Add verified claims to ground truth database');

    console.log(`[Research] No evidence found, gathering needed`);
  }

  // Check if answer is stable
  const stable = confidence >= 0.8 && gaps.length === 0;

  // Add topic-specific gaps
  if (topics.length > 0) {
    const primary_topic = topics[0];
    if (primary_topic.topic.verification_priority >= 0.9 && !stable) {
      gaps.push(`High-priority ${primary_topic.topic.domain} topic requires verification`);
      next_steps.push('Verify claims with authoritative sources');
    }
  }

  return {
    answer,
    confidence,
    gaps,
    next_steps,
    sources_used,
    stable
  };
}

/**
 * Run SERP gathering pipeline
 *
 * 1. Search web for relevant information (SERP)
 * 2. Extract claims using LLM
 * 3. Store verified claims in ground truth DB
 *
 * @param question - Search query
 * @param max_claims - Maximum claims to extract
 * @returns Metadata about gathering process
 */
async function runGatherPipeline(
  question: string,
  max_claims: number
): Promise<{ claims_added: number }> {
  console.log(`[Gather] Running pipeline for: "${question}"`);
  console.log(`[Gather] Target: ${max_claims} claims`);

  const groundTruth = getGroundTruthDB();

  // Step 1: Search the web
  const searchResults = await searchWeb(question, 5);

  if (searchResults.length === 0) {
    console.log(`[Gather] No search results found`);
    return { claims_added: 0 };
  }

  console.log(`[Gather] Found ${searchResults.length} search results`);

  // Step 2: Extract claims from results using LLM
  const extractedClaims = await extractClaimsFromResults(
    question,
    searchResults,
    max_claims
  );

  if (extractedClaims.length === 0) {
    console.log(`[Gather] No claims extracted`);
    return { claims_added: 0 };
  }

  // Step 3: Store claims in ground truth database
  let added = 0;
  for (const claim of extractedClaims) {
    groundTruth.add_claim(
      claim.claim_text,
      claim.tier,
      claim.confidence
    );
    added++;
  }

  console.log(`[Gather] Added ${added} claims to ground truth`);

  return { claims_added: added };
}
