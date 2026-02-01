/**
 * Ontology Explorer Service
 * Provides access to SOVRENAI's 392 Truth Tokens (Sticky Power Units)
 */

import { TruthTokenRegistry, TruthTokenRecord, TIER_DEFINITIONS } from './truth_beast/truth-token-registry.js';

export interface OntologyUnit {
  symbol: string;
  name: string;
  tier: number;
  tier_name: string;
  definition: string;
  weight: number;
  category: string;
  resistance: number;
  semantic_patterns: string[];
  E_in: string;
  E_out: string;
  grounded: boolean;
}

export interface OntologyListResponse {
  units: OntologyUnit[];
  total: number;
  filtered: number;
  tiers: Record<number, number>;
}

export interface OntologyUnitDetailResponse {
  unit: OntologyUnit;
  tier_info: {
    tier: number;
    name: string;
    simple_name: string;
    description: string;
    contains_summary: string;
    color: string;
    child_explanation: string;
  };
  related_units: OntologyUnit[];  // Other units in same tier
}

export interface EnergyBondRequest {
  token1_symbol: string;
  token2_symbol: string;
}

export interface EnergyBondResponse {
  token1: OntologyUnit;
  token2: OntologyUnit;
  bond_energy: number;
  bond_type: string;
  stability: number;
  description: string;
}

export class OntologyService {
  private registry: TruthTokenRegistry;

  constructor() {
    this.registry = new TruthTokenRegistry();
  }

  /**
   * List all ontology units with optional search/filter
   */
  listUnits(options?: {
    search?: string;
    tier?: number;
    category?: string;
    limit?: number;
    offset?: number;
  }): OntologyListResponse {
    const allTokens = Array.from((this.registry as any).tokens.values()) as TruthTokenRecord[];

    let filtered = allTokens;

    // Apply filters
    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(token =>
        token.name.toLowerCase().includes(searchLower) ||
        token.symbol.toLowerCase().includes(searchLower) ||
        token.definition.toLowerCase().includes(searchLower) ||
        token.semantic_patterns.some(p => p.toLowerCase().includes(searchLower))
      );
    }

    if (options?.tier !== undefined) {
      filtered = filtered.filter(token => token.tier === options.tier);
    }

    if (options?.category) {
      filtered = filtered.filter(token =>
        token.category.toLowerCase() === options.category!.toLowerCase()
      );
    }

    // Sort by tier then symbol
    filtered.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return a.symbol.localeCompare(b.symbol);
    });

    // Pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    // Get tier distribution
    const tierDist = this.registry.getTierDistribution();

    // Convert to OntologyUnit format
    const units: OntologyUnit[] = paginated.map(token => this.toOntologyUnit(token));

    return {
      units,
      total: allTokens.length,
      filtered: filtered.length,
      tiers: tierDist
    };
  }

  /**
   * Get details of a specific unit by symbol
   */
  getUnitDetails(symbol: string): OntologyUnitDetailResponse | null {
    const token = this.registry.get(symbol);
    if (!token) {
      return null;
    }

    const tierInfo = TIER_DEFINITIONS[token.tier];
    const relatedUnits = this.registry.getByTier(token.tier)
      .filter(t => t.symbol !== symbol)
      .slice(0, 10)  // Limit to 10 related units
      .map(t => this.toOntologyUnit(t));

    return {
      unit: this.toOntologyUnit(token),
      tier_info: tierInfo,
      related_units: relatedUnits
    };
  }

  /**
   * Calculate energy bond between two tokens
   * Uses thermodynamic principles from Truth Beast
   */
  calculateBond(symbol1: string, symbol2: string): EnergyBondResponse | null {
    const token1 = this.registry.get(symbol1);
    const token2 = this.registry.get(symbol2);

    if (!token1 || !token2) {
      return null;
    }

    // Calculate bond energy using resistance difference
    // Lower resistance = higher energy
    const resistanceDiff = Math.abs(token1.resistance - token2.resistance);

    // Bond energy: E = ΔH - T×ΔS (simplified)
    // ΔH (enthalpy) = average weight
    // T×ΔS (entropy) = resistance difference
    const avgWeight = (token1.weight + token2.weight) / 2;
    const bondEnergy = avgWeight - (resistanceDiff * 0.5);

    // Classify bond type
    let bondType = '';
    let stability = 0;

    if (token1.tier === token2.tier) {
      bondType = 'Resonant';  // Same tier
      stability = 0.9;
    } else if (Math.abs(token1.tier - token2.tier) === 1) {
      bondType = 'Adjacent';  // Adjacent tiers
      stability = 0.7;
    } else if (Math.abs(token1.tier - token2.tier) <= 3) {
      bondType = 'Harmonic';  // Close tiers
      stability = 0.5;
    } else {
      bondType = 'Dissonant';  // Far apart
      stability = 0.3;
    }

    // Adjust stability by resistance
    stability *= (1 - resistanceDiff);

    const description = this.describeBond(token1, token2, bondType, bondEnergy, stability);

    return {
      token1: this.toOntologyUnit(token1),
      token2: this.toOntologyUnit(token2),
      bond_energy: Math.round(bondEnergy * 1000) / 1000,
      bond_type: bondType,
      stability: Math.round(stability * 1000) / 1000,
      description
    };
  }

  /**
   * Convert TruthTokenRecord to OntologyUnit
   */
  private toOntologyUnit(token: TruthTokenRecord): OntologyUnit {
    return {
      symbol: token.symbol,
      name: token.name,
      tier: token.tier,
      tier_name: this.registry.getTierName(token.tier),
      definition: token.definition,
      weight: token.weight,
      category: token.category,
      resistance: token.resistance,
      semantic_patterns: token.semantic_patterns,
      E_in: token.E_in,
      E_out: token.E_out,
      grounded: token.grounded
    };
  }

  /**
   * Generate human-readable bond description
   */
  private describeBond(
    token1: TruthTokenRecord,
    token2: TruthTokenRecord,
    bondType: string,
    energy: number,
    stability: number
  ): string {
    const t1Name = token1.name;
    const t2Name = token2.name;
    const tier1 = this.registry.getTierName(token1.tier);
    const tier2 = this.registry.getTierName(token2.tier);

    if (bondType === 'Resonant') {
      return `${t1Name} and ${t2Name} resonate in ${tier1} tier. Strong ${stability > 0.8 ? 'stable' : 'moderate'} bond with energy ${energy.toFixed(3)}.`;
    } else if (bondType === 'Adjacent') {
      return `${t1Name} (${tier1}) and ${t2Name} (${tier2}) form adjacent tier bond. ${stability > 0.6 ? 'Stable' : 'Moderate'} connection with energy ${energy.toFixed(3)}.`;
    } else if (bondType === 'Harmonic') {
      return `${t1Name} (${tier1}) and ${t2Name} (${tier2}) create harmonic relationship. ${stability > 0.4 ? 'Moderate' : 'Weak'} bond with energy ${energy.toFixed(3)}.`;
    } else {
      return `${t1Name} (${tier1}) and ${t2Name} (${tier2}) are dissonant. Weak ${stability < 0.3 ? 'unstable' : 'tenuous'} connection with energy ${energy.toFixed(3)}.`;
    }
  }

  /**
   * Get statistics about the ontology
   */
  getStatistics() {
    const tierDist = this.registry.getTierDistribution();
    const totalTokens = this.registry.count();

    return {
      total_units: totalTokens,
      tier_distribution: tierDist,
      tiers: Object.keys(TIER_DEFINITIONS).map(tier => ({
        tier: parseInt(tier),
        name: TIER_DEFINITIONS[parseInt(tier)].name,
        count: tierDist[parseInt(tier)] || 0
      }))
    };
  }
}
