/**
 * Analyst Agent
 * Specialized agent for data analysis, comparisons, and insights
 */

import type { Agent, AgentContext, AgentResult, StepTrace, Artifact } from '../base/agent-types.js';
import type { ClassificationResult } from '../../services/truth_beast/index.js';

export class AnalystAgent implements Agent {
  name = 'Analyst';
  icon = '📊';

  canHandle(context: AgentContext): boolean {
    const { classificationResult } = context;

    // Trigger on comparison requests, data analysis, number-heavy queries
    const analysisTriggers = [
      'compare', 'analyze', 'calculate', 'cost', 'price',
      'statistics', 'data', 'numbers', 'metrics', 'performance',
      'vs', 'versus', 'difference', 'better', 'best', 'worst',
      'cheaper', 'expensive', 'faster', 'slower', 'comparison'
    ];

    const tokens = classificationResult.tokens_matched || [];
    const hasAnalysisTrigger = tokens.some((t: any) =>
      analysisTriggers.includes(t.symbol?.toLowerCase() || '')
    );

    const reasoning = classificationResult.reasoning || '';
    const hasAnalysisIntent =
      reasoning.includes('comparison') ||
      reasoning.includes('analysis') ||
      reasoning.includes('calculate') ||
      reasoning.includes('compare');

    return hasAnalysisTrigger || hasAnalysisIntent;
  }

  async execute(context: AgentContext, input: any): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      // 1. Extract entities to compare/analyze from classification
      const entities = this.extractEntities(context.classificationResult);

      // 2. Gather data from SERP results and internal sources
      const data = await this.gatherData(entities, context.provenance);

      // 3. Perform analysis (comparisons, calculations, summaries)
      const analysisType = this.determineAnalysisType(context.classificationResult, input);
      const analysis = await this.performAnalysis(data, analysisType);

      // 4. Format output (tables, charts data, summaries)
      const formatted = this.formatOutput(analysis, analysisType);

      // Create artifacts if applicable
      const artifacts: Artifact[] = [];
      if (analysis.table) {
        artifacts.push({
          type: 'spreadsheet',
          title: `${analysisType} Analysis`,
          content: analysis.table,
          format: 'json',
          createdBy: this.name,
          metadata: {
            entities: entities.length,
            insights: analysis.insights.length
          }
        });
      }

      return {
        success: true,
        output: formatted,
        trace: {
          step: 'analyst',
          agent: this.name,
          icon: this.icon,
          duration: Date.now() - startTime,
          details: `Analyzed ${entities.length} entities, found ${analysis.insights.length} insights`
        },
        artifacts
      };
    } catch (error: any) {
      return {
        success: false,
        output: null,
        trace: {
          step: 'analyst',
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
   * Extract entities to analyze from classification
   */
  private extractEntities(classification: ClassificationResult): string[] {
    const tokens = classification.tokens_matched || [];

    // Extract entities that are likely comparable (T0-T3)
    const entities = tokens
      .filter((token: any) => {
        const tier = token.tier;
        return tier !== undefined && tier <= 3;
      })
      .map((token: any) => token.symbol);

    return entities;
  }

  /**
   * Gather data from multiple sources
   */
  private async gatherData(entities: string[], provenance: any): Promise<any> {
    const serpData = provenance.serp_results || [];
    const registryData = provenance.registry_matches || [];

    // Combine data sources
    const dataPoints = [];

    // Extract structured data from SERP results
    for (const result of serpData) {
      // Look for numbers, prices, metrics in snippets
      const numbers = this.extractNumbers(result.snippet);
      if (numbers.length > 0) {
        dataPoints.push({
          source: result.url,
          title: result.title,
          data: numbers,
          text: result.snippet
        });
      }
    }

    return {
      entities,
      serpData: dataPoints,
      registryData,
      total: dataPoints.length
    };
  }

  /**
   * Extract numbers and metrics from text
   */
  private extractNumbers(text: string): Array<{ value: number; unit?: string; context: string }> {
    const numbers = [];

    // Match patterns like "$50", "50 GB", "50%", "50 hours", etc.
    const patterns = [
      /\$[\d,]+\.?\d*/g,  // Currency
      /\d+\.?\d*\s?(GB|MB|TB|KB)/gi,  // Storage
      /\d+\.?\d*\s?(hours?|mins?|minutes?|seconds?|secs?)/gi,  // Time
      /\d+\.?\d*%/g,  // Percentages
      /\d+\.?\d*\s?(users?|people|customers?)/gi  // Counts
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const valueStr = match[0].replace(/[^0-9.]/g, '');
        const value = parseFloat(valueStr);
        if (!isNaN(value)) {
          numbers.push({
            value,
            unit: match[1] || undefined,
            context: text.substring(Math.max(0, match.index! - 20), Math.min(text.length, match.index! + 50))
          });
        }
      }
    }

    return numbers;
  }

  /**
   * Determine type of analysis needed
   */
  private determineAnalysisType(classification: ClassificationResult, input: any): string {
    if (input.analysisType) return input.analysisType;

    const tokens = classification.tokens_matched || [];

    if (tokens.some((t: any) => ['compare', 'vs', 'versus', 'difference'].includes(t.symbol?.toLowerCase() || ''))) {
      return 'comparison';
    }
    if (tokens.some((t: any) => ['cost', 'price', 'cheaper', 'expensive'].includes(t.symbol?.toLowerCase() || ''))) {
      return 'pricing';
    }
    if (tokens.some((t: any) => ['performance', 'speed', 'faster', 'slower'].includes(t.symbol?.toLowerCase() || ''))) {
      return 'performance';
    }
    if (tokens.some((t: any) => ['best', 'worst', 'better', 'rank'].includes(t.symbol?.toLowerCase() || ''))) {
      return 'ranking';
    }

    return 'general';
  }

  /**
   * Perform analysis on gathered data
   */
  private async performAnalysis(data: any, analysisType: string): Promise<any> {
    const insights: string[] = [];
    const summary: string[] = [];
    let table: any = null;

    // Extract key metrics
    const allNumbers = data.serpData.flatMap((d: any) => d.data);

    if (allNumbers.length > 0) {
      // Calculate basic statistics
      const values = allNumbers.map((n: any) => n.value);
      const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      insights.push(`Found ${allNumbers.length} data points across ${data.total} sources`);
      insights.push(`Range: ${min.toFixed(2)} to ${max.toFixed(2)} (avg: ${avg.toFixed(2)})`);

      if (max / min > 2) {
        insights.push(`High variance detected (${(max / min).toFixed(1)}x difference)`);
      }
    }

    // Build comparison table if applicable
    if (analysisType === 'comparison' && data.serpData.length >= 2) {
      table = {
        headers: ['Source', 'Key Metrics', 'Context'],
        rows: data.serpData.slice(0, 5).map((d: any) => [
          d.title,
          d.data.map((n: any) => `${n.value}${n.unit || ''}`).join(', '),
          d.text.substring(0, 100) + '...'
        ])
      };

      summary.push(`Compared ${data.serpData.length} sources`);
    } else if (data.entities.length > 0) {
      summary.push(`Analyzed ${data.entities.length} entities: ${data.entities.join(', ')}`);
    }

    // Add context-specific insights
    switch (analysisType) {
      case 'pricing':
        insights.push('Price analysis completed - see comparison table for details');
        break;
      case 'performance':
        insights.push('Performance metrics extracted from multiple sources');
        break;
      case 'comparison':
        insights.push('Side-by-side comparison available in spreadsheet view');
        break;
    }

    return {
      insights,
      summary: summary.join('. '),
      table,
      statistics: allNumbers.length > 0 ? {
        count: allNumbers.length,
        values: allNumbers.slice(0, 10)  // Top 10
      } : null
    };
  }

  /**
   * Format output for display
   */
  private formatOutput(analysis: any, analysisType: string): any {
    return {
      type: analysisType,
      insights: analysis.insights,
      summary: analysis.summary,
      table: analysis.table,
      statistics: analysis.statistics,
      visualSuggestion: analysis.table ? 'comparison-table' : 'bar-chart'
    };
  }
}
