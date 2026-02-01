/**
 * Reviewer Agent
 * Specialized agent for quality checking, truth validation, and accuracy scoring
 */

import type { Agent, AgentContext, AgentResult } from '../base/agent-types.js';
import { classify } from '../../services/truth_beast/index.js';
import { deceptionAnalyzer } from '../../services/deception-analyzer.js';
import { getGroundTruthDB } from '../../services/truth_beast/ground-truth.js';

export class ReviewerAgent implements Agent {
  name = 'Reviewer';
  icon = '👁️';

  canHandle(context: AgentContext): boolean {
    // Reviewer runs on all outputs before final response
    // Can be explicitly triggered for quality checks
    return true;
  }

  async execute(context: AgentContext, input: any): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const { contentToReview, previousAgentOutputs } = input;

      if (!contentToReview) {
        throw new Error('No content provided for review');
      }

      // 1. Check factual consistency against classification
      const factCheck = await this.checkFactualConsistency(
        contentToReview,
        context.classificationResult
      );

      // 2. Verify against ground truth / registry
      const groundTruthCheck = await this.verifyAgainstGroundTruth(
        contentToReview,
        context.provenance
      );

      // 3. Check for deception and manipulation
      const deceptionCheck = this.checkDeception(contentToReview);

      // 4. Check quality metrics (completeness, clarity, accuracy)
      const qualityScore = this.assessQuality(contentToReview, context);

      // 5. Aggregate issues
      const issues = [
        ...factCheck.issues,
        ...groundTruthCheck.issues,
        ...deceptionCheck.issues
      ];

      // 6. Determine approval
      const approved =
        issues.length === 0 &&
        qualityScore.score >= 0.8 &&
        !deceptionCheck.isDeceptive;

      // 7. Generate suggestions
      const suggestions = [
        ...qualityScore.suggestions,
        ...deceptionCheck.suggestions
      ];

      return {
        success: true,
        output: {
          approved,
          score: qualityScore.score,
          issues,
          suggestions,
          deceptionScore: deceptionCheck.score,
          factualConsistency: factCheck.consistency,
          groundTruthAlignment: groundTruthCheck.alignment,
          details: {
            factCheck,
            groundTruthCheck,
            deceptionCheck,
            qualityScore
          }
        },
        trace: {
          step: 'reviewer',
          agent: this.name,
          icon: this.icon,
          duration: Date.now() - startTime,
          details: approved
            ? `Approved with ${(qualityScore.score * 100).toFixed(0)}% confidence`
            : `Found ${issues.length} issues to address`
        }
      };
    } catch (error: any) {
      return {
        success: false,
        output: {
          approved: false,
          score: 0,
          issues: [error.message],
          suggestions: []
        },
        trace: {
          step: 'reviewer',
          agent: this.name,
          icon: this.icon,
          duration: Date.now() - startTime,
          details: '',
          error: error.message
        }
      };
    }
  }

  /**
   * Check factual consistency by re-classifying output
   */
  private async checkFactualConsistency(
    content: string,
    originalClassification: any
  ): Promise<any> {
    const issues: string[] = [];

    try {
      // Re-classify the output
      const outputClassification = await classify(content);

      // Check if output tokens align with input classification
      const originalTokens = new Set((originalClassification.tokens_matched || []).map((t: any) => t.symbol));
      const outputTokens = (outputClassification.tokens_matched || []).map((t: any) => t.symbol);

      // Check for drift (new tokens not in original)
      const driftTokens = outputTokens.filter((token: any) => !originalTokens.has(token));

      if (driftTokens.length > outputTokens.length * 0.3) {
        issues.push(`Content drift detected: ${driftTokens.length} new topics introduced`);
      }

      // Check tier consistency
      const originalMaxTier = Math.max(...Object.values(originalClassification.tier_distribution || {}).map((t: any) => t.tier));
      const outputMaxTier = Math.max(...Object.values(outputClassification.tier_distribution || {}).map((t: any) => t.tier));

      if (outputMaxTier > originalMaxTier + 2) {
        issues.push(`Quality degradation: Output tier (T${outputMaxTier}) exceeds input (T${originalMaxTier})`);
      }

      // Calculate consistency score
      const consistency = 1.0 - (issues.length * 0.2);

      return {
        issues,
        consistency: Math.max(0, consistency),
        driftTokens,
        tierComparison: { original: originalMaxTier, output: outputMaxTier }
      };
    } catch (error: any) {
      issues.push(`Fact checking failed: ${error.message}`);
      return { issues, consistency: 0.5 };
    }
  }

  /**
   * Verify claims against ground truth database
   */
  private async verifyAgainstGroundTruth(
    content: string,
    provenance: any
  ): Promise<any> {
    const issues: string[] = [];
    const groundTruthDB = getGroundTruthDB();

    try {
      // Extract claims from content (simple sentence splitting)
      const claims = content
        .split(/[.!?]+/)
        .filter(s => s.trim().length > 20)
        .slice(0, 5);  // Check first 5 claims

      let verifiedCount = 0;
      let totalClaims = claims.length;

      for (const claim of claims) {
        // Search ground truth for this claim
        const matches = groundTruthDB.search_claims(claim.trim(), 3, 4);

        if (matches && matches.length > 0) {
          // Check if match is high confidence
          const bestMatch = matches[0];
          if (bestMatch.confidence > 0.7) {
            verifiedCount++;
          } else if (bestMatch.confidence < 0.3) {
            issues.push(`Low confidence claim: "${claim.substring(0, 50)}..."`);
          }
        } else {
          // No ground truth match - check against SERP sources
          const hasSerpSupport = provenance.serp_results?.some(
            (result: any) => result.snippet.includes(claim.substring(0, 30))
          );

          if (!hasSerpSupport && claim.length > 50) {
            issues.push(`Unverified claim: "${claim.substring(0, 50)}..."`);
          }
        }
      }

      // Calculate alignment score
      const alignment = totalClaims > 0 ? verifiedCount / totalClaims : 1.0;

      if (alignment < 0.5) {
        issues.push(`Low ground truth alignment (${(alignment * 100).toFixed(0)}%)`);
      }

      return {
        issues,
        alignment,
        verifiedClaims: verifiedCount,
        totalClaims
      };
    } catch (error: any) {
      issues.push(`Ground truth verification failed: ${error.message}`);
      return { issues, alignment: 0.5 };
    }
  }

  /**
   * Check for deception and manipulation
   */
  private checkDeception(content: string): any {
    const issues: string[] = [];
    const suggestions: string[] = [];

    try {
      // Use deception analyzer
      const result = deceptionAnalyzer.analyze(content);

      if (result.is_deceptive) {
        issues.push(`Deception detected (score: ${result.deception_score}/100)`);
        issues.push(`Tier: T${result.tier} (${result.tier_name})`);

        // Add specific tactics
        if (result.detected_tactics.length > 0) {
          result.detected_tactics.forEach((tactic: any) => {
            issues.push(`Tactic: ${tactic.tactic} (confidence: ${(tactic.confidence * 100).toFixed(0)}%)`);
          });
        }

        suggestions.push('Remove manipulative language and present facts objectively');
      }

      // Check for high-tier deception (T9+)
      if (result.tier >= 9) {
        issues.push('CRITICAL: High-tier deception detected - content should be rejected');
      }

      return {
        isDeceptive: result.is_deceptive,
        score: result.deception_score,
        tier: result.tier,
        issues,
        suggestions,
        tactics: result.detected_tactics
      };
    } catch (error: any) {
      return {
        isDeceptive: false,
        score: 0,
        tier: 0,
        issues: [],
        suggestions: []
      };
    }
  }

  /**
   * Assess overall quality
   */
  private assessQuality(content: string, context: AgentContext): any {
    let score = 1.0;
    const suggestions: string[] = [];

    // Check completeness - did we address the user's request?
    const originalTokens = context.classificationResult.tokens_matched || [];
    const contentLower = content.toLowerCase();

    const addressedTokens = originalTokens.filter((token: any) =>
      contentLower.includes(token.symbol?.toLowerCase() || '')
    );

    const completeness = originalTokens.length > 0
      ? addressedTokens.length / originalTokens.length
      : 1.0;

    if (completeness < 0.5) {
      score -= 0.3;
      suggestions.push('Address more aspects of the original question');
    }

    // Check clarity - is the response understandable?
    const sentences = content.split(/[.!?]+/);
    const avgSentenceLength = content.length / sentences.length;

    if (avgSentenceLength > 150) {
      score -= 0.1;
      suggestions.push('Break down long sentences for better readability');
    }

    // Check length appropriateness
    if (content.length < 100) {
      score -= 0.2;
      suggestions.push('Provide more detailed information');
    }

    // Check for citations/sources (if applicable)
    const hasCitations = /\[|\(https?:\/\/|\bSource:|Citation:/.test(content);
    if (context.provenance.serp_results && context.provenance.serp_results.length > 0 && !hasCitations) {
      score -= 0.1;
      suggestions.push('Include citations to sources');
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      completeness,
      suggestions,
      metrics: {
        length: content.length,
        sentenceCount: sentences.length,
        avgSentenceLength,
        addressedTopics: addressedTokens.length,
        totalTopics: originalTokens.length
      }
    };
  }
}
