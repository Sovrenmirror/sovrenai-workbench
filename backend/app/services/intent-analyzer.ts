/**
 * Intent Analyzer Service
 * Extracts domain, features, and information gaps from requirements
 * Leverages Truth Beast for classification and confidence scoring
 */

import { classify } from './truth_beast/index.js';
import { TruthTokenRegistry } from './truth_beast/truth-token-registry.js';

export interface IntentAnalysisRequest {
  text: string;
}

export interface Feature {
  name: string;
  category: string;
  confidence: number;
  keywords: string[];
}

export interface InformationGap {
  question: string;
  category: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface IntentAnalysisResponse {
  domain: {
    primary: string;
    confidence: number;
    alternatives: Array<{ name: string; confidence: number }>;
  };
  features: Feature[];
  information_gaps: InformationGap[];
  overall_confidence: number;
  truth_analysis: {
    tier: number;
    tier_name: string;
    confidence: number;
    stability: number;
  };
}

export class IntentAnalyzer {
  private registry: TruthTokenRegistry;

  // Domain keywords for classification
  private domainKeywords = {
    'E-Commerce': ['shop', 'cart', 'product', 'checkout', 'payment', 'order', 'inventory', 'store', 'marketplace'],
    'Healthcare': ['patient', 'medical', 'health', 'doctor', 'hospital', 'diagnosis', 'treatment', 'prescription'],
    'Finance': ['bank', 'payment', 'transaction', 'account', 'financial', 'money', 'credit', 'loan', 'investment'],
    'Education': ['student', 'course', 'learning', 'teach', 'education', 'class', 'assignment', 'grade', 'school'],
    'Social Media': ['post', 'share', 'follow', 'friend', 'comment', 'like', 'profile', 'feed', 'social'],
    'SaaS': ['subscription', 'tenant', 'multi-tenant', 'plan', 'billing', 'user management', 'admin', 'dashboard'],
    'IoT': ['device', 'sensor', 'telemetry', 'iot', 'hardware', 'embedded', 'monitoring', 'real-time'],
    'Gaming': ['game', 'player', 'score', 'level', 'achievement', 'multiplayer', 'leaderboard', 'match'],
    'Content Management': ['cms', 'content', 'publish', 'editor', 'article', 'blog', 'media', 'page'],
    'Analytics': ['dashboard', 'analytics', 'metrics', 'report', 'visualization', 'data', 'insights', 'statistics'],
  };

  // Feature extraction patterns
  private featurePatterns = {
    'Authentication': ['login', 'signup', 'authentication', 'auth', 'register', 'sign in', 'sign up', 'password'],
    'Authorization': ['permission', 'role', 'access control', 'authorization', 'rbac', 'admin', 'moderator'],
    'Search': ['search', 'find', 'filter', 'query', 'lookup', 'discover'],
    'Notifications': ['notification', 'alert', 'email', 'sms', 'push', 'notify', 'reminder'],
    'File Upload': ['upload', 'file', 'image', 'document', 'attachment', 'media'],
    'Real-time Updates': ['real-time', 'live', 'websocket', 'streaming', 'instant', 'push'],
    'Payment Processing': ['payment', 'stripe', 'paypal', 'checkout', 'billing', 'invoice'],
    'User Profile': ['profile', 'user', 'account', 'settings', 'preferences'],
    'Dashboard': ['dashboard', 'overview', 'summary', 'analytics', 'metrics'],
    'API Integration': ['api', 'integration', 'webhook', 'third-party', 'external'],
    'Export/Import': ['export', 'import', 'csv', 'json', 'download', 'backup'],
    'Multi-language': ['i18n', 'localization', 'translation', 'language', 'multilingual'],
  };

  constructor() {
    this.registry = new TruthTokenRegistry();
  }

  /**
   * Analyze intent from requirement text
   */
  async analyze(text: string): Promise<IntentAnalysisResponse> {
    // 1. Run Truth Beast classification
    const truthAnalysis = await classify(text);

    // 2. Detect domain
    const domain = this.detectDomain(text);

    // 3. Extract features
    const features = this.extractFeatures(text);

    // 4. Identify information gaps
    const gaps = this.identifyGaps(text, features);

    // 5. Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(truthAnalysis, domain, features);

    return {
      domain,
      features,
      information_gaps: gaps,
      overall_confidence: overallConfidence,
      truth_analysis: {
        tier: truthAnalysis.tier,
        tier_name: truthAnalysis.tier_name,
        confidence: truthAnalysis.confidence,
        stability: truthAnalysis.stability
      }
    };
  }

  /**
   * Detect primary domain from text
   */
  private detectDomain(text: string): IntentAnalysisResponse['domain'] {
    const textLower = text.toLowerCase();
    const scores: Record<string, number> = {};

    // Score each domain by keyword matches
    for (const [domain, keywords] of Object.entries(this.domainKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (textLower.includes(keyword)) {
          score += 1;
        }
      }
      if (score > 0) {
        scores[domain] = score;
      }
    }

    // No clear domain
    if (Object.keys(scores).length === 0) {
      return {
        primary: 'General',
        confidence: 0.3,
        alternatives: []
      };
    }

    // Sort by score
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const totalScore = sorted.reduce((sum, [_, score]) => sum + score, 0);

    const primary = sorted[0][0];
    const primaryConfidence = Math.min(sorted[0][1] / (totalScore * 0.5), 1.0);

    const alternatives = sorted.slice(1, 4).map(([name, score]) => ({
      name,
      confidence: Math.min(score / (totalScore * 0.5), 1.0)
    }));

    return {
      primary,
      confidence: Math.round(primaryConfidence * 100) / 100,
      alternatives
    };
  }

  /**
   * Extract features from text
   */
  private extractFeatures(text: string): Feature[] {
    const textLower = text.toLowerCase();
    const features: Feature[] = [];

    for (const [featureName, keywords] of Object.entries(this.featurePatterns)) {
      const matchedKeywords: string[] = [];
      let matchCount = 0;

      for (const keyword of keywords) {
        if (textLower.includes(keyword)) {
          matchedKeywords.push(keyword);
          matchCount += 1;
        }
      }

      if (matchCount > 0) {
        const confidence = Math.min(matchCount / keywords.length + 0.3, 1.0);
        features.push({
          name: featureName,
          category: this.categorizeFeature(featureName),
          confidence: Math.round(confidence * 100) / 100,
          keywords: matchedKeywords
        });
      }
    }

    // Sort by confidence
    features.sort((a, b) => b.confidence - a.confidence);

    return features;
  }

  /**
   * Categorize feature into high-level category
   */
  private categorizeFeature(featureName: string): string {
    const categories: Record<string, string[]> = {
      'Security': ['Authentication', 'Authorization'],
      'User Experience': ['Search', 'Notifications', 'User Profile', 'Dashboard'],
      'Data Management': ['File Upload', 'Export/Import'],
      'Integration': ['API Integration', 'Real-time Updates', 'Payment Processing'],
      'Localization': ['Multi-language']
    };

    for (const [category, features] of Object.entries(categories)) {
      if (features.includes(featureName)) {
        return category;
      }
    }

    return 'Core';
  }

  /**
   * Identify information gaps in requirements
   */
  private identifyGaps(text: string, features: Feature[]): InformationGap[] {
    const gaps: InformationGap[] = [];
    const textLower = text.toLowerCase();

    // Check for common missing information
    const gapChecks = [
      {
        condition: !textLower.includes('user') && !textLower.includes('authentication'),
        gap: {
          question: 'Who are the users of this system?',
          category: 'Users',
          importance: 'critical' as const,
          suggestion: 'Define user roles, authentication requirements, and user personas'
        }
      },
      {
        condition: !textLower.includes('data') && !textLower.includes('database'),
        gap: {
          question: 'What data needs to be stored?',
          category: 'Data Model',
          importance: 'critical' as const,
          suggestion: 'Specify data entities, relationships, and storage requirements'
        }
      },
      {
        condition: !textLower.includes('scale') && !textLower.includes('performance'),
        gap: {
          question: 'What are the performance and scale requirements?',
          category: 'Performance',
          importance: 'high' as const,
          suggestion: 'Define expected load, response times, and concurrency needs'
        }
      },
      {
        condition: !textLower.includes('security') && !textLower.includes('privacy'),
        gap: {
          question: 'What are the security and privacy requirements?',
          category: 'Security',
          importance: 'high' as const,
          suggestion: 'Specify data protection, compliance (GDPR, HIPAA), and security measures'
        }
      },
      {
        condition: features.some(f => f.name === 'Payment Processing') &&
                  !textLower.includes('pci') && !textLower.includes('compliance'),
        gap: {
          question: 'What payment compliance standards are needed?',
          category: 'Compliance',
          importance: 'critical' as const,
          suggestion: 'Address PCI-DSS compliance, payment provider selection, and fraud prevention'
        }
      },
      {
        condition: !textLower.includes('mobile') && !textLower.includes('responsive'),
        gap: {
          question: 'Is mobile support required?',
          category: 'Platform',
          importance: 'medium' as const,
          suggestion: 'Clarify if system needs mobile app, responsive web, or desktop only'
        }
      },
      {
        condition: !textLower.includes('api') && features.length > 5,
        gap: {
          question: 'Does the system need an API?',
          category: 'Architecture',
          importance: 'medium' as const,
          suggestion: 'Consider if external integrations or mobile apps need API access'
        }
      },
      {
        condition: !textLower.includes('error') && !textLower.includes('monitoring'),
        gap: {
          question: 'What error handling and monitoring is needed?',
          category: 'Operations',
          importance: 'medium' as const,
          suggestion: 'Define logging, error tracking, and monitoring requirements'
        }
      }
    ];

    for (const check of gapChecks) {
      if (check.condition) {
        gaps.push(check.gap);
      }
    }

    return gaps;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    truthAnalysis: any,
    domain: IntentAnalysisResponse['domain'],
    features: Feature[]
  ): number {
    // Weight components
    const truthWeight = 0.3;
    const domainWeight = 0.3;
    const featureWeight = 0.4;

    // Truth Beast confidence (higher tier = more specific = better)
    const truthScore = truthAnalysis.confidence;

    // Domain confidence
    const domainScore = domain.confidence;

    // Feature confidence (average of top features)
    const featureScore = features.length > 0
      ? features.slice(0, 5).reduce((sum, f) => sum + f.confidence, 0) / Math.min(features.length, 5)
      : 0.2;

    const overall = (truthScore * truthWeight) + (domainScore * domainWeight) + (featureScore * featureWeight);

    return Math.round(overall * 100) / 100;
  }
}
