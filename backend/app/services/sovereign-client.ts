/**
 * Sovereign Reasoning Engine Client
 *
 * TypeScript client for calling the Python-based Sovereign Reasoning Engine.
 * Provides 8-stage reasoning with 13 Truth Tiers.
 */

const SOVEREIGN_ENGINE_URL = process.env.SOVEREIGN_ENGINE_URL || 'http://sovereign-engine:8888';

export interface ReasonRequest {
  input: string;
  provider?: string;
  model?: string;
  api_key?: string;
}

export interface ReasonResponse {
  input: string;
  response: string;
  stages: {
    aware: {
      raw_input: string;
      word_count: number;
      is_question: boolean;
      epistemic_subject: string;
      epistemic_level: string;
      contains_claim: boolean;
    };
    energize: {
      complexity: string;
      requires_deep_analysis: boolean;
      requires_verification: boolean;
      allocated_dimensions: number;
    };
    recognize: {
      symbol: string;
      name: string;
      tier: number;
      tier_name: string;
      resistance: number;
      epistemic_subject: string;
      epistemic_level: string;
      verifiability: string;
      confidence: number;
      truth_floor_match: string | null;
    };
    think: any;
    solve: {
      verified: boolean;
      confidence: number;
      method: string;
      tier: number;
      resistance: number;
      details: any;
    };
    act: {
      response_generated: boolean;
    };
    attain: {
      goal_achieved: boolean;
      confidence_level: string;
      verification_method: string;
      caveats_needed: boolean;
    };
    rest: {
      total_time_ms: number;
      llm_calls: number;
      cycle_complete: boolean;
    };
  };
  metadata: {
    timestamp: string;
    total_time_ms: number;
    llm_calls: number;
    tier: number;
    resistance: number;
    thesis_proof: string;
  };
}

export interface ClassifyRequest {
  text: string;
}

export interface ClassifyResponse {
  text: string;
  classification: {
    symbol: string;
    name: string;
    tier: number;
    tier_name: string;
    resistance: number;
    epistemic_subject: string;
    epistemic_level: string;
    verifiability: string;
    confidence: number;
  };
}

export interface TruthFloorResponse {
  axioms: string[];
  count: number;
  integrity_verified: boolean;
}

export interface TierInfo {
  tier: number;
  name: string;
  resistance: number;
  description: string;
}

export interface TiersResponse {
  tiers: TierInfo[];
  count: number;
  thesis: string;
}

export class SovereignClient {
  private baseUrl: string;

  constructor(baseUrl: string = SOVEREIGN_ENGINE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Execute full 8-stage reasoning on an input.
   */
  async reason(request: ReasonRequest): Promise<ReasonResponse> {
    const response = await fetch(`${this.baseUrl}/reason`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Reasoning failed: ${error.detail || response.statusText}`);
    }

    return await response.json() as ReasonResponse;
  }

  /**
   * Classify text into Truth Token Ontology (lightweight).
   */
  async classify(request: ClassifyRequest): Promise<ClassifyResponse> {
    const response = await fetch(`${this.baseUrl}/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Classification failed: ${error.detail || response.statusText}`);
    }

    return await response.json() as ClassifyResponse;
  }

  /**
   * Get Truth Floor axioms.
   */
  async getTruthFloor(): Promise<TruthFloorResponse> {
    const response = await fetch(`${this.baseUrl}/truth-floor`);

    if (!response.ok) {
      throw new Error(`Failed to get Truth Floor: ${response.statusText}`);
    }

    return await response.json() as TruthFloorResponse;
  }

  /**
   * Get 13 Truth Tiers information.
   */
  async getTiers(): Promise<TiersResponse> {
    const response = await fetch(`${this.baseUrl}/tiers`);

    if (!response.ok) {
      throw new Error(`Failed to get tiers: ${response.statusText}`);
    }

    return await response.json() as TiersResponse;
  }

  /**
   * Health check.
   */
  async health(): Promise<{ status: string; truth_floor_verified: boolean; truth_floor_axioms: number }> {
    const response = await fetch(`${this.baseUrl}/health`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Check if the Sovereign Engine is available.
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.health();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
export const sovereignClient = new SovereignClient();

// Convenience functions
export async function sovereignReason(input: string, options?: Partial<ReasonRequest>): Promise<ReasonResponse> {
  return sovereignClient.reason({ input, ...options });
}

export async function sovereignClassify(text: string): Promise<ClassifyResponse> {
  return sovereignClient.classify({ text });
}
