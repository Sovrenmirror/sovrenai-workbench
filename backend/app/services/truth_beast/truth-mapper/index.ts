/**
 * Truth Mapper - Intelligent Research and Discovery
 *
 * Export discovery module and SERP integration for use throughout the application
 */

export {
  discover,
  type DiscoverOptions,
  type DiscoverResult,
  type ResearchResult
} from './discovery.js';

export {
  searchWeb,
  extractClaimsFromResults,
  type SERPResult,
  type ExtractedClaim
} from './serp.js';
