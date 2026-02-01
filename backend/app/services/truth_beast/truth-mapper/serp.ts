/**
 * SERP (Search Engine Results Page) Integration
 *
 * Searches the web for evidence to support claims
 * Uses Google Custom Search API or similar
 */

import Anthropic from '@anthropic-ai/sdk';

export interface SERPResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

export interface ExtractedClaim {
  claim_text: string;
  confidence: number;
  tier: number;
  source_url: string;
  source_title: string;
}

/**
 * Search the web for information
 *
 * @param query - Search query
 * @param limit - Maximum results to return
 * @returns Array of search results
 */
export async function searchWeb(
  query: string,
  limit: number = 5
): Promise<SERPResult[]> {
  console.log(`[SERP] Searching for: "${query}"`);

  // Check for SerpAPI key (preferred) or Google Custom Search
  const serpApiKey = process.env.SERP_API_KEY;
  const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  // Prefer SerpAPI if available
  if (serpApiKey) {
    return searchWithSerpAPI(query, limit, serpApiKey);
  }

  // Fall back to Google Custom Search
  if (googleApiKey && googleSearchEngineId) {
    return searchWithGoogleCustomSearch(query, limit, googleApiKey, googleSearchEngineId);
  }

  // No API keys configured
  console.log('[SERP] No API keys configured, using mock results');
  return getMockResults(query, limit);
}

/**
 * Search using SerpAPI (serpapi.com)
 */
async function searchWithSerpAPI(
  query: string,
  limit: number,
  apiKey: string
): Promise<SERPResult[]> {
  try {
    // Build SerpAPI URL
    const url = new URL('https://serpapi.com/search');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('q', query);
    url.searchParams.set('num', limit.toString());
    url.searchParams.set('engine', 'google'); // Use Google search engine

    console.log(`[SERP] Calling SerpAPI...`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error(`[SERP] SerpAPI error: ${response.status} ${response.statusText}`);
      return getMockResults(query, limit);
    }

    const data = await response.json();

    if (!data.organic_results || data.organic_results.length === 0) {
      console.log('[SERP] No results found');
      return [];
    }

    // Parse SerpAPI results
    const results: SERPResult[] = data.organic_results.slice(0, limit).map((item: any) => ({
      title: item.title || 'Untitled',
      snippet: item.snippet || '',
      url: item.link || '',
      source: item.displayed_link || new URL(item.link).hostname
    }));

    console.log(`[SERP] Found ${results.length} results from SerpAPI`);
    return results;

  } catch (error: any) {
    console.error('[SERP] SerpAPI search failed:', error.message);
    return getMockResults(query, limit);
  }
}

/**
 * Search using Google Custom Search API (fallback)
 */
async function searchWithGoogleCustomSearch(
  query: string,
  limit: number,
  apiKey: string,
  searchEngineId: string
): Promise<SERPResult[]> {
  try {
    // Build Google Custom Search API URL
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', searchEngineId);
    url.searchParams.set('q', query);
    url.searchParams.set('num', limit.toString());

    console.log(`[SERP] Calling Google Custom Search API...`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error(`[SERP] Google API error: ${response.status} ${response.statusText}`);
      return getMockResults(query, limit);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log('[SERP] No results found');
      return [];
    }

    // Parse Google Custom Search results
    const results: SERPResult[] = data.items.map((item: any) => ({
      title: item.title || 'Untitled',
      snippet: item.snippet || '',
      url: item.link || '',
      source: new URL(item.link).hostname
    }));

    console.log(`[SERP] Found ${results.length} results from Google Custom Search`);
    return results;

  } catch (error: any) {
    console.error('[SERP] Google Custom Search failed:', error.message);
    return getMockResults(query, limit);
  }
}

/**
 * Extract claims from SERP results using LLM
 *
 * @param query - Original question
 * @param results - SERP search results
 * @param max_claims - Maximum claims to extract
 * @returns Array of extracted claims with confidence scores
 */
export async function extractClaimsFromResults(
  query: string,
  results: SERPResult[],
  max_claims: number = 5
): Promise<ExtractedClaim[]> {
  console.log(`[SERP] Extracting claims from ${results.length} results...`);

  if (results.length === 0) {
    return [];
  }

  // Build context from search results
  const context = results.map((r, i) =>
    `[${i + 1}] ${r.title}\n   Source: ${r.source}\n   "${r.snippet}"\n   URL: ${r.url}`
  ).join('\n\n');

  // Prompt for claim extraction
  const prompt = `You are a fact extraction system. Given search results about a question, extract verifiable claims.

Question: "${query}"

Search Results:
${context}

Extract ${max_claims} verifiable, factual claims from these search results. For each claim:
1. Write the claim as a clear, standalone factual statement
2. Assign a tier (1-4):
   - T1: Universal truths (math, definitions)
   - T2: Physical laws and constants
   - T3: Scientific facts (biology, astronomy, earth science)
   - T4: Historical facts and documented events
3. Assign confidence (0.0-1.0) based on:
   - Source credibility
   - Claim specificity
   - Cross-source agreement
4. Include the source URL

Format each claim as JSON:
{
  "claim_text": "The claim as a clear statement",
  "tier": 3,
  "confidence": 0.9,
  "source_url": "https://...",
  "source_title": "Source name"
}

Return only a JSON array of claims, no other text.`;

  // Try Azure OpenAI first, then fall back to Anthropic
  const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (azureApiKey) {
    return extractWithAzureOpenAI(prompt, max_claims);
  } else if (anthropicApiKey) {
    return extractWithAnthropic(prompt, max_claims, anthropicApiKey);
  } else {
    console.error('[SERP] No LLM API keys configured (AZURE_OPENAI_API_KEY or ANTHROPIC_API_KEY)');
    return [];
  }
}

/**
 * Extract claims using Azure OpenAI
 */
async function extractWithAzureOpenAI(
  prompt: string,
  max_claims: number
): Promise<ExtractedClaim[]> {
  try {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
    const apiKey = process.env.AZURE_OPENAI_API_KEY!;
    const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID!;
    const apiVersion = process.env.AZURE_API_VERSION || '2024-12-01-preview';

    console.log('[SERP] Calling Azure OpenAI for claim extraction...');

    const url = `${endpoint}openai/deployments/${deploymentId}/chat/completions?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a fact extraction system that outputs only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SERP] Azure OpenAI error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[SERP] Azure OpenAI response not in expected JSON format');
      console.log('[SERP] Response:', responseText.substring(0, 200));
      return [];
    }

    const claims: ExtractedClaim[] = JSON.parse(jsonMatch[0]);

    console.log(`[SERP] Extracted ${claims.length} claims with Azure OpenAI`);
    claims.forEach((claim, i) => {
      console.log(`  ${i + 1}. T${claim.tier} (${(claim.confidence * 100).toFixed(0)}%): ${claim.claim_text.substring(0, 60)}...`);
    });

    return claims.slice(0, max_claims);

  } catch (error: any) {
    console.error('[SERP] Azure OpenAI claim extraction failed:', error.message);
    return [];
  }
}

/**
 * Extract claims using Anthropic Claude (fallback)
 */
async function extractWithAnthropic(
  prompt: string,
  max_claims: number,
  apiKey: string
): Promise<ExtractedClaim[]> {
  try {
    const anthropic = new Anthropic({ apiKey });

    console.log('[SERP] Calling Anthropic Claude for claim extraction...');

    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = completion.content[0].type === 'text'
      ? completion.content[0].text
      : '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[SERP] Anthropic response not in expected JSON format');
      console.log('[SERP] Response:', responseText.substring(0, 200));
      return [];
    }

    const claims: ExtractedClaim[] = JSON.parse(jsonMatch[0]);

    console.log(`[SERP] Extracted ${claims.length} claims with Anthropic`);
    claims.forEach((claim, i) => {
      console.log(`  ${i + 1}. T${claim.tier} (${(claim.confidence * 100).toFixed(0)}%): ${claim.claim_text.substring(0, 60)}...`);
    });

    return claims.slice(0, max_claims);

  } catch (error: any) {
    console.error('[SERP] Anthropic claim extraction failed:', error.message);
    return [];
  }
}

/**
 * Get mock search results (fallback when API not configured)
 */
function getMockResults(query: string, limit: number): SERPResult[] {
  const lower = query.toLowerCase();

  let results: SERPResult[] = [];

  // Medical topics
  if (lower.includes('diabetes')) {
    results = [
      {
        title: 'Diabetes: Symptoms, Causes, and Treatment - Mayo Clinic',
        snippet: 'Diabetes is a chronic condition that affects how your body processes blood sugar (glucose). Type 2 diabetes can often be managed through diet, exercise, and medication.',
        url: 'https://www.mayoclinic.org/diseases-conditions/diabetes',
        source: 'mayoclinic.org'
      },
      {
        title: 'What Is Diabetes? - CDC',
        snippet: 'Diabetes is a disease that occurs when your blood glucose, also called blood sugar, is too high. Over time, having too much glucose in your blood can cause health problems.',
        url: 'https://www.cdc.gov/diabetes/basics/diabetes.html',
        source: 'cdc.gov'
      },
      {
        title: 'Diabetes Treatment: Using Insulin to Manage Blood Sugar',
        snippet: 'Insulin is a hormone that helps glucose enter your cells. People with Type 1 diabetes need insulin injections to survive.',
        url: 'https://www.diabetes.org/treatment',
        source: 'diabetes.org'
      }
    ];
  }
  // Technology topics
  else if (lower.includes('machine learning') || lower.includes('neural network')) {
    results = [
      {
        title: 'What is Machine Learning? - IBM',
        snippet: 'Machine learning is a branch of artificial intelligence (AI) that enables systems to learn and improve from experience without being explicitly programmed.',
        url: 'https://www.ibm.com/topics/machine-learning',
        source: 'ibm.com'
      },
      {
        title: 'Neural Networks and Deep Learning - Nature',
        snippet: 'Neural networks use backpropagation to adjust weights during training, allowing the network to learn complex patterns from data.',
        url: 'https://www.nature.com/articles/nature14539',
        source: 'nature.com'
      },
      {
        title: 'How Neural Networks Work - MIT Technology Review',
        snippet: 'Deep learning neural networks consist of layers of interconnected nodes that process information and learn hierarchical representations.',
        url: 'https://www.technologyreview.com/neural-networks',
        source: 'technologyreview.com'
      }
    ];
  }
  // Economics topics
  else if (lower.includes('inflation') || lower.includes('economy')) {
    results = [
      {
        title: 'What is Inflation? - Federal Reserve',
        snippet: 'Inflation is the rate at which the general level of prices for goods and services rises, eroding purchasing power over time.',
        url: 'https://www.federalreserve.gov/faqs/economy_14419.htm',
        source: 'federalreserve.gov'
      },
      {
        title: 'How Central Banks Control Inflation - IMF',
        snippet: 'Central banks use interest rate policy as their primary tool to control inflation. Raising interest rates can slow economic activity and reduce inflation.',
        url: 'https://www.imf.org/inflation-control',
        source: 'imf.org'
      }
    ];
  }
  // Physics topics
  else if (lower.includes('electromagnetic') || lower.includes('light')) {
    results = [
      {
        title: 'Electromagnetic Waves - Physics Classroom',
        snippet: 'Electromagnetic waves are waves of electric and magnetic fields that propagate through space at the speed of light. They include radio waves, visible light, and X-rays.',
        url: 'https://www.physicsclassroom.com/electromagnetic-waves',
        source: 'physicsclassroom.com'
      },
      {
        title: 'Speed of Light - NIST',
        snippet: 'The speed of light in vacuum is exactly 299,792,458 meters per second. This is a fundamental constant of nature.',
        url: 'https://www.nist.gov/pml/speed-light-vacuum',
        source: 'nist.gov'
      }
    ];
  }
  // Default generic results
  else {
    results = [
      {
        title: `Understanding ${query} - Wikipedia`,
        snippet: `General information about ${query} from various reliable sources.`,
        url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(query),
        source: 'wikipedia.org'
      }
    ];
  }

  return results.slice(0, limit);
}
