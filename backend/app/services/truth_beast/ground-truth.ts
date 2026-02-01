/**
 * Ground Truth Database - Verified Facts Storage
 *
 * Stores verified claims for short-path responses (no LLM needed)
 * Based on: EXPERIMENTAL TRUTHBEAST NEW BUILD/backend/app/services/truth_beast/ground_truth_db.py
 */

import { GroundTruthMatch } from './orchestrator.js';

interface GroundTruthClaim {
  claim_text: string;
  tier: number;
  confidence: number;
  keywords: string[];
  added_at: string;
}

export class GroundTruthDB {
  private claims: GroundTruthClaim[] = [];

  constructor() {
    // Bootstrap with some basic verified facts
    this.bootstrapBasicFacts();
  }

  /**
   * Search for verified claims matching the query
   *
   * @param query - User's message
   * @param limit - Max results to return (default 10)
   * @param max_tier - Only return claims <= this tier (default 4)
   */
  search_claims(query: string, limit: number = 10, max_tier: number = 4): GroundTruthMatch[] {
    if (!query || query.trim().length === 0) {
      return [];
    }

    // Extract keywords (up to 3, as per ECOSYSTEM-GUIDANCE)
    const keywords = this.extractKeywords(query);

    if (keywords.length === 0) {
      return [];
    }

    // Search claims by keyword matching
    const matches: Array<{ claim: GroundTruthClaim; score: number }> = [];

    for (const claim of this.claims) {
      // Only include claims at or below max_tier
      if (claim.tier > max_tier) {
        continue;
      }

      // Calculate match score
      let score = 0;
      for (const keyword of keywords) {
        for (const claimKeyword of claim.keywords) {
          if (claimKeyword.includes(keyword) || keyword.includes(claimKeyword)) {
            score += 1;
          }
        }

        // Also check claim text
        if (claim.claim_text.toLowerCase().includes(keyword)) {
          score += 0.5;
        }
      }

      if (score > 0) {
        matches.push({ claim, score });
      }
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    // Return top matches
    return matches.slice(0, limit).map(m => ({
      claim_text: m.claim.claim_text,
      confidence: this.calculateConfidence(m.score, keywords.length),
      tier: m.claim.tier
    }));
  }

  /**
   * Add a verified claim to ground truth
   */
  add_claim(claim_text: string, tier: number, confidence: number = 1.0, keywords?: string[]): void {
    const extractedKeywords = keywords || this.extractKeywords(claim_text);

    this.claims.push({
      claim_text,
      tier,
      confidence,
      keywords: extractedKeywords,
      added_at: new Date().toISOString()
    });

    console.log(`[GroundTruthDB] Added claim: "${claim_text}" (T${tier}, ${extractedKeywords.length} keywords)`);
  }

  /**
   * Get total number of verified claims
   */
  count(): number {
    return this.claims.length;
  }

  /**
   * Extract keywords from text (up to 3)
   */
  private extractKeywords(text: string): string[] {
    // Normalize
    const normalized = text.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .trim();

    // Split into words
    const words = normalized.split(/\s+/);

    // Filter stop words
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might',
      'can', 'what', 'why', 'how', 'when', 'where', 'who', 'which', 'this', 'that', 'these', 'those',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
      'his', 'its', 'our', 'their', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as']);

    const keywords = words
      .filter(w => {
        // Keep if: (length > 2) OR (is a number)
        const isNumber = /^\d+$/.test(w);
        return (w.length > 2 || isNumber) && !stopWords.has(w);
      })
      .slice(0, 3); // Max 3 keywords

    return keywords;
  }

  /**
   * Calculate confidence based on match score
   */
  private calculateConfidence(score: number, queryKeywordCount: number): number {
    // Perfect match: score >= queryKeywordCount
    if (score >= queryKeywordCount) {
      return 0.95;
    }

    // Partial match
    const ratio = score / queryKeywordCount;

    if (ratio >= 0.66) {
      return 0.85;
    }

    if (ratio >= 0.33) {
      return 0.70;
    }

    return 0.55;
  }

  /**
   * Bootstrap with 100+ verified facts across T1-T4
   */
  private bootstrapBasicFacts(): void {
    // ========================================
    // T1 - Universal Truths (20 facts)
    // Mathematics, logic, definitions
    // ========================================
    this.add_claim('2 + 2 = 4', 1, 1.0, ['2', '4', 'plus']);
    this.add_claim('3 × 3 = 9', 1, 1.0, ['3', '9', 'multiply']);
    this.add_claim('10 ÷ 2 = 5', 1, 1.0, ['10', '5', 'divide']);
    this.add_claim('1 + 1 = 2', 1, 1.0, ['1', '2', 'plus']);
    this.add_claim('5 - 3 = 2', 1, 1.0, ['5', '3', 'minus']);
    this.add_claim('A circle has 360 degrees', 1, 1.0, ['circle', '360', 'degrees']);
    this.add_claim('Water is H2O', 1, 1.0, ['water', 'h2o']);
    this.add_claim('There are 7 days in a week', 1, 1.0, ['7', 'days', 'week']);
    this.add_claim('There are 12 months in a year', 1, 1.0, ['12', 'months', 'year']);
    this.add_claim('A square has 4 equal sides', 1, 1.0, ['square', '4', 'sides']);
    this.add_claim('A triangle has 3 sides', 1, 1.0, ['triangle', '3', 'sides']);
    this.add_claim('100 centimeters equal 1 meter', 1, 1.0, ['100', 'centimeters', 'meter']);
    this.add_claim('1000 meters equal 1 kilometer', 1, 1.0, ['1000', 'meters', 'kilometer']);
    this.add_claim('60 seconds equal 1 minute', 1, 1.0, ['60', 'seconds', 'minute']);
    this.add_claim('60 minutes equal 1 hour', 1, 1.0, ['60', 'minutes', 'hour']);
    this.add_claim('24 hours equal 1 day', 1, 1.0, ['24', 'hours', 'day']);
    this.add_claim('The sum of angles in a triangle is 180 degrees', 1, 1.0, ['triangle', '180', 'degrees']);
    this.add_claim('0 is neither positive nor negative', 1, 1.0, ['0', 'positive', 'negative']);
    this.add_claim('1 kilogram equals 1000 grams', 1, 1.0, ['kilogram', '1000', 'grams']);
    this.add_claim('Parallel lines never intersect', 1, 1.0, ['parallel', 'lines', 'intersect']);

    // ========================================
    // T2 - Physical Laws (30 facts)
    // Physics, chemistry constants
    // ========================================
    this.add_claim('Water boils at 100 degrees Celsius at standard atmospheric pressure', 2, 1.0, ['water', 'boil', 'celsius']);
    this.add_claim('Water freezes at 0 degrees Celsius', 2, 1.0, ['water', 'freeze', 'celsius']);
    this.add_claim('The speed of light is approximately 299,792,458 meters per second', 2, 1.0, ['speed', 'light']);
    this.add_claim('Gravity accelerates objects at 9.8 m/s² on Earth', 2, 1.0, ['gravity', 'earth', 'acceleration']);
    this.add_claim('The speed of sound in air is approximately 343 meters per second', 2, 1.0, ['sound', 'speed', 'air']);
    this.add_claim('Absolute zero is -273.15 degrees Celsius or 0 Kelvin', 2, 1.0, ['absolute', 'zero', 'kelvin']);
    this.add_claim('Density of water is 1 gram per cubic centimeter', 2, 1.0, ['density', 'water', 'gram']);
    this.add_claim('The force of gravity decreases with the square of distance', 2, 1.0, ['gravity', 'square', 'distance']);
    this.add_claim('Light travels faster in vacuum than in any medium', 2, 1.0, ['light', 'vacuum', 'faster']);
    this.add_claim('Energy cannot be created or destroyed, only transformed', 2, 1.0, ['energy', 'created', 'destroyed']);
    this.add_claim('Electric charge is conserved in all interactions', 2, 1.0, ['electric', 'charge', 'conserved']);
    this.add_claim('Momentum is conserved in closed systems', 2, 1.0, ['momentum', 'conserved', 'systems']);
    this.add_claim('Mass and energy are equivalent (E=mc²)', 2, 1.0, ['mass', 'energy', 'emc2']);
    this.add_claim('Entropy in a closed system always increases', 2, 1.0, ['entropy', 'increases', 'system']);
    this.add_claim('The wavelength of light is inversely proportional to frequency', 2, 1.0, ['wavelength', 'frequency', 'light']);
    this.add_claim('Electrical current is measured in amperes', 2, 1.0, ['current', 'amperes', 'electrical']);
    this.add_claim('Electrical resistance is measured in ohms', 2, 1.0, ['resistance', 'ohms', 'electrical']);
    this.add_claim('Power is measured in watts', 2, 1.0, ['power', 'watts', 'measured']);
    this.add_claim('Pressure is measured in pascals', 2, 1.0, ['pressure', 'pascals', 'measured']);
    this.add_claim('The pH scale ranges from 0 to 14', 2, 1.0, ['ph', 'scale', '14']);
    this.add_claim('Pure water has a pH of 7 (neutral)', 2, 1.0, ['water', 'ph', '7']);
    this.add_claim('Objects fall at the same rate in vacuum regardless of mass', 2, 1.0, ['fall', 'vacuum', 'mass']);
    this.add_claim('Metals conduct electricity better than non-metals', 2, 1.0, ['metals', 'conduct', 'electricity']);
    this.add_claim('Heat flows from hot objects to cold objects', 2, 1.0, ['heat', 'hot', 'cold']);
    this.add_claim('The Planck constant is approximately 6.626 × 10⁻³⁴ joule-seconds', 2, 1.0, ['planck', 'constant', 'joule']);
    this.add_claim('The gravitational constant G is approximately 6.674 × 10⁻¹¹ N⋅m²/kg²', 2, 1.0, ['gravitational', 'constant', 'newton']);
    this.add_claim('The electron has a negative charge', 2, 1.0, ['electron', 'negative', 'charge']);
    this.add_claim('The proton has a positive charge', 2, 1.0, ['proton', 'positive', 'charge']);
    this.add_claim('The neutron has no electric charge', 2, 1.0, ['neutron', 'charge', 'neutral']);
    this.add_claim('Diamond is the hardest natural material on the Mohs scale', 2, 1.0, ['diamond', 'hardest', 'mohs']);

    // ========================================
    // T3 - Scientific Facts (30 facts)
    // Biology, astronomy, earth science
    // ========================================
    this.add_claim('The sky is blue because of Rayleigh scattering', 3, 0.95, ['sky', 'blue', 'rayleigh']);
    this.add_claim('DNA is the molecule that carries genetic information', 3, 1.0, ['dna', 'genetic']);
    this.add_claim('The Earth revolves around the Sun', 3, 1.0, ['earth', 'sun', 'revolve']);
    this.add_claim('The Earth rotates on its axis once every 24 hours', 3, 1.0, ['earth', 'rotates', '24']);
    this.add_claim('The Moon orbits the Earth', 3, 1.0, ['moon', 'orbits', 'earth']);
    this.add_claim('The Sun is a star', 3, 1.0, ['sun', 'star']);
    this.add_claim('Mars is the fourth planet from the Sun', 3, 1.0, ['mars', 'fourth', 'planet']);
    this.add_claim('Jupiter is the largest planet in our solar system', 3, 1.0, ['jupiter', 'largest', 'planet']);
    this.add_claim('Saturn has rings made of ice and rock', 3, 1.0, ['saturn', 'rings', 'ice']);
    this.add_claim('Humans have 23 pairs of chromosomes', 3, 1.0, ['humans', '23', 'chromosomes']);
    this.add_claim('The human body has 206 bones', 3, 1.0, ['human', '206', 'bones']);
    this.add_claim('The heart pumps blood throughout the body', 3, 1.0, ['heart', 'pumps', 'blood']);
    this.add_claim('Plants perform photosynthesis using sunlight', 3, 1.0, ['plants', 'photosynthesis', 'sunlight']);
    this.add_claim('Oxygen is produced by plants during photosynthesis', 3, 1.0, ['oxygen', 'plants', 'photosynthesis']);
    this.add_claim('Carbon dioxide is used by plants during photosynthesis', 3, 1.0, ['carbon', 'dioxide', 'plants']);
    this.add_claim('The brain is the control center of the nervous system', 3, 1.0, ['brain', 'control', 'nervous']);
    this.add_claim('Red blood cells carry oxygen in the bloodstream', 3, 1.0, ['red', 'blood', 'oxygen']);
    this.add_claim('White blood cells fight infection', 3, 1.0, ['white', 'blood', 'infection']);
    this.add_claim('The Earth has one natural satellite: the Moon', 3, 1.0, ['earth', 'satellite', 'moon']);
    this.add_claim('Dinosaurs went extinct approximately 65 million years ago', 3, 0.95, ['dinosaurs', 'extinct', 'million']);
    this.add_claim('The Earth is approximately 4.54 billion years old', 3, 0.95, ['earth', 'billion', 'old']);
    this.add_claim('The Milky Way is the galaxy containing our solar system', 3, 1.0, ['milky', 'way', 'galaxy']);
    this.add_claim('The closest star to Earth (besides the Sun) is Proxima Centauri', 3, 1.0, ['proxima', 'centauri', 'closest']);
    this.add_claim('The Pacific Ocean is the largest ocean on Earth', 3, 1.0, ['pacific', 'ocean', 'largest']);
    this.add_claim('Mount Everest is the tallest mountain on Earth above sea level', 3, 1.0, ['everest', 'tallest', 'mountain']);
    this.add_claim('The Amazon River is the largest river by discharge volume', 3, 1.0, ['amazon', 'river', 'largest']);
    this.add_claim('Antarctica is the coldest continent', 3, 1.0, ['antarctica', 'coldest', 'continent']);
    this.add_claim('The Great Barrier Reef is the largest coral reef system', 3, 1.0, ['barrier', 'reef', 'coral']);
    this.add_claim('Rainbows are caused by refraction of sunlight in water droplets', 3, 0.95, ['rainbow', 'refraction', 'water']);
    this.add_claim('Sound cannot travel through a vacuum', 3, 1.0, ['sound', 'vacuum', 'travel']);

    // ========================================
    // T4 - Historical Facts (20 facts)
    // Documented historical events
    // ========================================
    this.add_claim('The Moon landing occurred on July 20, 1969', 4, 1.0, ['moon', 'landing', '1969']);
    this.add_claim('World War II ended in 1945', 4, 1.0, ['world', 'war', '1945']);
    this.add_claim('The United States declared independence in 1776', 4, 1.0, ['united', 'states', '1776']);
    this.add_claim('Christopher Columbus reached the Americas in 1492', 4, 1.0, ['columbus', 'americas', '1492']);
    this.add_claim('The Berlin Wall fell in 1989', 4, 1.0, ['berlin', 'wall', '1989']);
    this.add_claim('The Roman Empire fell in 476 AD', 4, 0.95, ['roman', 'empire', '476']);
    this.add_claim('The printing press was invented by Johannes Gutenberg around 1440', 4, 1.0, ['printing', 'gutenberg', '1440']);
    this.add_claim('The first airplane flight was by the Wright brothers in 1903', 4, 1.0, ['airplane', 'wright', '1903']);
    this.add_claim('The Titanic sank on April 15, 1912', 4, 1.0, ['titanic', 'sank', '1912']);
    this.add_claim('The internet was developed in the 1960s-1980s', 4, 1.0, ['internet', 'developed', '1960s']);
    this.add_claim('The wheel was invented around 3500 BC', 4, 0.95, ['wheel', 'invented', '3500']);
    this.add_claim('The Great Wall of China was built over many centuries', 4, 1.0, ['great', 'wall', 'china']);
    this.add_claim('The Egyptian pyramids were built around 2500 BC', 4, 0.95, ['pyramids', 'egypt', '2500']);
    this.add_claim('Alexander the Great died in 323 BC', 4, 1.0, ['alexander', 'great', '323']);
    this.add_claim('Julius Caesar was assassinated in 44 BC', 4, 1.0, ['julius', 'caesar', '44']);
    this.add_claim('The Magna Carta was signed in 1215', 4, 1.0, ['magna', 'carta', '1215']);
    this.add_claim('The French Revolution began in 1789', 4, 1.0, ['french', 'revolution', '1789']);
    this.add_claim('Abraham Lincoln was assassinated in 1865', 4, 1.0, ['lincoln', 'assassinated', '1865']);
    this.add_claim('The first atomic bomb was detonated in 1945', 4, 1.0, ['atomic', 'bomb', '1945']);
    this.add_claim('Humans first reached the South Pole in 1911', 4, 1.0, ['south', 'pole', '1911']);

    console.log(`[GroundTruthDB] Bootstrapped with ${this.claims.length} verified facts`);
  }
}

// Singleton instance
let _instance: GroundTruthDB | null = null;

export function getGroundTruthDB(): GroundTruthDB {
  if (!_instance) {
    _instance = new GroundTruthDB();
  }
  return _instance;
}
