/**
 * Researcher Agent
 * Specialized agent for web research, fact verification, and source gathering
 */

import { BaseAgent, AgentTask, AgentMetadata } from '../base/agent.js';
import { discover } from '../../services/truth_beast/truth-mapper/discovery.js';
import { searchWeb, extractClaimsFromResults } from '../../services/truth_beast/truth-mapper/serp.js';
import { getGroundTruthDB } from '../../services/truth_beast/ground-truth.js';

export interface ResearchTaskInput {
  query: string;
  maxRounds?: number;
  autoGather?: boolean;
  gatherMaxClaims?: number;
  serpAvailable?: boolean;
}

export interface ResearchTaskOutput {
  answer: string;
  confidence: number;
  sources: Array<{
    url: string;
    title: string;
    snippet: string;
  }>;
  claims: Array<{
    text: string;
    confidence: number;
    tier: number;
    source: string;
  }>;
  gaps: string[];
  nextSteps: string[];
  metadata: {
    roundsCompleted: number;
    sourcesUsed: number;
    claimsExtracted: number;
    gatherRan: boolean;
  };
}

export class ResearcherAgent extends BaseAgent {
  private groundTruthDB: any;

  constructor() {
    const metadata: AgentMetadata = {
      id: 'researcher',
      name: 'Researcher',
      icon: '🔍',
      description: 'Web research, fact verification, and source gathering specialist',
      capabilities: ['web_search', 'fact_verification', 'source_gathering'],
      version: '1.0.0'
    };

    super(metadata);
  }

  protected async onInitialize(): Promise<void> {
    console.log('[ResearcherAgent] Initializing...');

    // Initialize ground truth database
    this.groundTruthDB = getGroundTruthDB();

    console.log('[ResearcherAgent] Initialization complete');
  }

  protected async onExecute(task: AgentTask): Promise<ResearchTaskOutput> {
    const input = task.input as ResearchTaskInput;

    if (!input.query) {
      throw new Error('Research query is required');
    }

    console.log(`[ResearcherAgent] Starting research for: "${input.query}"`);

    // Emit initial progress
    this.emitProgress(0, 'Starting research...', 'initialization');

    try {
      // Phase 1: Run discovery loop (10%)
      this.checkCancel();
      this.emitProgress(10, 'Running discovery loop...', 'discovery');

      const discoverResult = await discover(input.query, {
        max_rounds: input.maxRounds || 2,
        auto_gather: input.autoGather !== false,
        gather_max_claims: input.gatherMaxClaims || 5,
        serp_available: input.serpAvailable !== false
      });

      // Phase 2: Search web for additional sources (40%)
      this.checkCancel();
      this.emitProgress(40, 'Searching web for sources...', 'web_search');

      const searchResults = await searchWeb(input.query, 5);

      // Phase 3: Extract claims from search results (60%)
      this.checkCancel();
      this.emitProgress(60, 'Extracting claims from sources...', 'claim_extraction');

      const extractedClaims = await extractClaimsFromResults(input.query, searchResults);

      // Phase 4: Verify claims against ground truth (80%)
      this.checkCancel();
      this.emitProgress(80, 'Verifying claims...', 'verification');

      const verifiedClaims = await this.verifyClaims(extractedClaims);

      // Phase 5: Compile final result (100%)
      this.checkCancel();
      this.emitProgress(100, 'Compiling results...', 'finalization');

      const output: ResearchTaskOutput = {
        answer: discoverResult.result.answer,
        confidence: discoverResult.result.confidence,
        sources: searchResults.map(result => ({
          url: result.url,
          title: result.title,
          snippet: result.snippet
        })),
        claims: verifiedClaims,
        gaps: discoverResult.result.gaps,
        nextSteps: discoverResult.result.next_steps,
        metadata: {
          roundsCompleted: discoverResult.rounds,
          sourcesUsed: discoverResult.result.sources_used,
          claimsExtracted: extractedClaims.length,
          gatherRan: discoverResult.gather_ran
        }
      };

      console.log(`[ResearcherAgent] Research complete. Found ${output.claims.length} claims from ${output.sources.length} sources`);

      return output;
    } catch (error) {
      console.error('[ResearcherAgent] Research failed:', error);
      throw error;
    }
  }

  protected onPause(): void {
    console.log('[ResearcherAgent] Paused');
  }

  protected onResume(): void {
    console.log('[ResearcherAgent] Resumed');
  }

  protected onCancel(): void {
    console.log('[ResearcherAgent] Cancelled');
  }

  /**
   * Verify claims against ground truth database
   */
  private async verifyClaims(
    extractedClaims: Array<{
      claim_text: string;
      confidence: number;
      tier: number;
      source_url: string;
      source_title: string;
    }>
  ): Promise<Array<{
    text: string;
    confidence: number;
    tier: number;
    source: string;
  }>> {
    const verifiedClaims = [];

    for (const claim of extractedClaims) {
      // Check against ground truth DB
      const existingClaims = this.groundTruthDB.search_claims(claim.claim_text);

      let finalConfidence = claim.confidence;
      let finalTier = claim.tier;

      // If claim exists in ground truth, use its tier and boost confidence
      if (existingClaims && existingClaims.length > 0) {
        const groundTruthClaim = existingClaims[0];
        finalTier = groundTruthClaim.tier;
        finalConfidence = Math.min(1.0, claim.confidence + 0.2); // Boost confidence by 0.2
      }

      verifiedClaims.push({
        text: claim.claim_text,
        confidence: finalConfidence,
        tier: finalTier,
        source: claim.source_url
      });
    }

    return verifiedClaims;
  }
}
