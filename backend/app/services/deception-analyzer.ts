/**
 * Deception Analyzer Service
 * Specialized analysis for T9-T12 deceptive and manipulative content
 */

export interface DeceptionPattern {
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  examples: string[];
}

export interface DeceptionAnalysisResult {
  is_deceptive: boolean;
  deception_score: number; // 0-100
  tier: number;
  tier_name: string;
  detected_tactics: {
    tactic: string;
    confidence: number;
    phrases: string[];
    explanation: string;
    severity: string;
  }[];
  red_flags: string[];
  corrections: string[];
  reasoning: string;
}

export class DeceptionAnalyzer {
  private patterns: Record<string, DeceptionPattern> = {
    clickbait: {
      name: 'Clickbait',
      description: 'Sensationalized headlines designed to manipulate emotions and drive clicks',
      severity: 'medium',
      examples: [
        'You won\'t believe what happened next',
        'Doctors hate this one weird trick',
        'This will blow your mind',
        'Number 7 will shock you'
      ]
    },
    false_authority: {
      name: 'False Authority',
      description: 'Falsely claiming expert endorsement or scientific backing',
      severity: 'high',
      examples: [
        'Doctors recommend',
        'Scientists discovered',
        'Experts agree',
        'Studies show' // without citing actual studies
      ]
    },
    appeal_to_emotion: {
      name: 'Appeal to Emotion',
      description: 'Manipulating emotions instead of providing logical arguments',
      severity: 'medium',
      examples: [
        'Think of the children',
        'You wouldn\'t want your family to suffer',
        'Everyone is doing it',
        'Don\'t be left behind'
      ]
    },
    false_urgency: {
      name: 'False Urgency',
      description: 'Creating artificial scarcity or time pressure',
      severity: 'high',
      examples: [
        'Limited time only',
        'Act now before it\'s too late',
        'Only 3 left in stock',
        'Offer expires in 24 hours'
      ]
    },
    false_dichotomy: {
      name: 'False Dichotomy',
      description: 'Presenting only two options when more exist',
      severity: 'medium',
      examples: [
        'You\'re either with us or against us',
        'If you don\'t agree, you must hate',
        'Either accept this or face disaster'
      ]
    },
    gaslighting: {
      name: 'Gaslighting',
      description: 'Making someone question their own reality or sanity',
      severity: 'critical',
      examples: [
        'That never happened',
        'You\'re too sensitive',
        'You\'re imagining things',
        'Everyone else understands, why don\'t you?'
      ]
    },
    strawman: {
      name: 'Strawman Argument',
      description: 'Misrepresenting an opponent\'s position to make it easier to attack',
      severity: 'high',
      examples: [
        'So you\'re saying',
        'What you really mean is',
        'People like you believe'
      ]
    },
    ad_hominem: {
      name: 'Ad Hominem',
      description: 'Attacking the person instead of their argument',
      severity: 'medium',
      examples: [
        'You\'re just ignorant',
        'Anyone with half a brain',
        'Only idiots would think'
      ]
    },
    bandwagon: {
      name: 'Bandwagon Appeal',
      description: 'Arguing something is true because many people believe it',
      severity: 'low',
      examples: [
        'Everyone knows',
        'Most people agree',
        'The majority believes',
        '9 out of 10 people'
      ]
    },
    slippery_slope: {
      name: 'Slippery Slope',
      description: 'Suggesting a small action will inevitably lead to disaster',
      severity: 'medium',
      examples: [
        'If we allow this, soon',
        'This is just the first step towards',
        'Before you know it'
      ]
    }
  };

  /**
   * Analyze text for deception and manipulation tactics
   */
  analyze(text: string): DeceptionAnalysisResult {
    const textLower = text.toLowerCase();
    const detected_tactics: DeceptionAnalysisResult['detected_tactics'] = [];
    const red_flags: string[] = [];

    // Check each pattern
    for (const [key, pattern] of Object.entries(this.patterns)) {
      const matches = this.detectPattern(textLower, pattern);
      if (matches.length > 0) {
        detected_tactics.push({
          tactic: pattern.name,
          confidence: this.calculateConfidence(matches, pattern),
          phrases: matches,
          explanation: pattern.description,
          severity: pattern.severity
        });

        red_flags.push(`${pattern.name} detected (${pattern.severity} severity)`);
      }
    }

    // Calculate deception score
    const deception_score = this.calculateDeceptionScore(detected_tactics);

    // Determine tier
    const { tier, tier_name } = this.classifyDeceptionTier(deception_score, detected_tactics);

    // Generate corrections
    const corrections = this.generateCorrections(detected_tactics, text);

    // Build reasoning
    const reasoning = this.buildReasoning(detected_tactics, deception_score, tier_name);

    return {
      is_deceptive: deception_score > 30,
      deception_score,
      tier,
      tier_name,
      detected_tactics,
      red_flags,
      corrections,
      reasoning
    };
  }

  /**
   * Detect pattern matches in text
   */
  private detectPattern(textLower: string, pattern: DeceptionPattern): string[] {
    const matches: string[] = [];

    for (const example of pattern.examples) {
      const exampleLower = example.toLowerCase();
      // Simple substring matching - could be enhanced with regex
      if (textLower.includes(exampleLower)) {
        matches.push(example);
      }
    }

    return matches;
  }

  /**
   * Calculate confidence for a pattern match
   */
  private calculateConfidence(matches: string[], pattern: DeceptionPattern): number {
    const baseConfidence = matches.length > 0 ? 0.6 : 0;
    const matchBonus = Math.min(matches.length * 0.15, 0.3);
    const severityBonus = {
      low: 0,
      medium: 0.05,
      high: 0.1,
      critical: 0.15
    }[pattern.severity];

    return Math.min(baseConfidence + matchBonus + severityBonus, 1.0);
  }

  /**
   * Calculate overall deception score (0-100)
   */
  private calculateDeceptionScore(tactics: DeceptionAnalysisResult['detected_tactics']): number {
    if (tactics.length === 0) return 0;

    const severityWeights = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const tactic of tactics) {
      const weight = severityWeights[tactic.severity as keyof typeof severityWeights];
      totalScore += tactic.confidence * weight * 25;
      totalWeight += weight;
    }

    return Math.min(Math.round(totalScore / (totalWeight || 1)), 100);
  }

  /**
   * Classify into deception tier (T9-T12)
   */
  private classifyDeceptionTier(score: number, tactics: DeceptionAnalysisResult['detected_tactics']): { tier: number; tier_name: string } {
    const hasCritical = tactics.some(t => t.severity === 'critical');
    const hasHigh = tactics.some(t => t.severity === 'high');

    if (score < 30) {
      return { tier: 7, tier_name: 'Subjective' }; // Not really deceptive, just opinion
    } else if (score < 50) {
      return { tier: 9, tier_name: 'Garbage' }; // Misleading but not malicious
    } else if (score < 70) {
      return { tier: 10, tier_name: 'Propaganda' }; // Intentionally misleading
    } else if (score < 85 || (hasHigh && !hasCritical)) {
      return { tier: 11, tier_name: 'Deceptive' }; // Actively deceptive
    } else {
      return { tier: 12, tier_name: 'Adversarial' }; // Malicious/dangerous
    }
  }

  /**
   * Generate correction suggestions
   */
  private generateCorrections(tactics: DeceptionAnalysisResult['detected_tactics'], text: string): string[] {
    const corrections: string[] = [];

    for (const tactic of tactics) {
      switch (tactic.tactic) {
        case 'Clickbait':
          corrections.push('Replace sensational language with factual descriptions');
          corrections.push('State the actual content clearly in the title');
          break;
        case 'False Authority':
          corrections.push('Cite specific studies or experts with credentials');
          corrections.push('Provide verifiable sources and links');
          break;
        case 'False Urgency':
          corrections.push('Remove artificial time pressure tactics');
          corrections.push('Present genuine reasons for urgency, if any');
          break;
        case 'Gaslighting':
          corrections.push('Acknowledge different perspectives respectfully');
          corrections.push('Avoid questioning others\' reality or sanity');
          break;
        case 'Ad Hominem':
          corrections.push('Focus on arguments, not personal attacks');
          corrections.push('Address the substance of claims');
          break;
      }
    }

    if (corrections.length === 0) {
      corrections.push('Text appears generally truthful');
    }

    return [...new Set(corrections)]; // Remove duplicates
  }

  /**
   * Build reasoning explanation
   */
  private buildReasoning(tactics: DeceptionAnalysisResult['detected_tactics'], score: number, tier_name: string): string {
    if (tactics.length === 0) {
      return `No deception tactics detected. Content appears straightforward and honest. Deception score: ${score}/100.`;
    }

    const tacticNames = tactics.map(t => t.tactic).join(', ');
    const criticalCount = tactics.filter(t => t.severity === 'critical').length;
    const highCount = tactics.filter(t => t.severity === 'high').length;

    let reasoning = `Classified as ${tier_name} with deception score ${score}/100. `;
    reasoning += `Detected ${tactics.length} manipulation tactic${tactics.length > 1 ? 's' : ''}: ${tacticNames}. `;

    if (criticalCount > 0) {
      reasoning += `Contains ${criticalCount} critical-severity tactic${criticalCount > 1 ? 's' : ''} (gaslighting). `;
    }
    if (highCount > 0) {
      reasoning += `Contains ${highCount} high-severity tactic${highCount > 1 ? 's' : ''} (false authority, false urgency, etc.). `;
    }

    reasoning += `This content uses psychological manipulation techniques that may mislead or harm readers. `;
    reasoning += `Exercise caution and verify claims independently.`;

    return reasoning;
  }
}

// Export singleton
export const deceptionAnalyzer = new DeceptionAnalyzer();
