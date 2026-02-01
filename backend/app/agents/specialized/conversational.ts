/**
 * Conversational Agent
 * First-contact agent for greetings, small talk, and general conversation
 * Routes to specialized agents when technical assistance is needed
 */

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Agent, AgentContext, AgentResult, Artifact } from '../base/agent-types.js';

// Ensure environment is loaded
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../../.env'), override: true });

export class ConversationalAgent implements Agent {
  name = 'Sovren';
  icon = '💬';
  private anthropic: Anthropic | null = null;

  constructor() {
    // Lazy initialization - API key checked on first use
  }

  /**
   * Get or create Anthropic client (lazy initialization)
   */
  private getClient(): Anthropic {
    if (!this.anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable not set');
      }
      this.anthropic = new Anthropic({ apiKey });
    }
    return this.anthropic;
  }

  /**
   * Patterns that indicate conversational intent
   */
  private conversationalPatterns = [
    /^(hi|hello|hey|howdy|greetings|good\s*(morning|afternoon|evening|day))[\s!.,?]*$/i,
    /^how\s*(are\s*you|('s\s*it\s*going)|do\s*you\s*do)[\s!.,?]*$/i,
    /^what('s)?\s*up[\s!.,?]*$/i,
    /^(thanks|thank\s*you|thx|ty)[\s!.,?]*$/i,
    /^(bye|goodbye|see\s*you|later|cya)[\s!.,?]*$/i,
    /^(yes|no|yeah|nope|yep|ok|okay|sure|alright)[\s!.,?]*$/i,
    /^(nice|great|awesome|cool|interesting)[\s!.,?]*$/i,
    /^(please|help)[\s!.,?]*$/i,
    /^who\s*are\s*you[\s!.,?]*$/i,
    /^what\s*(can\s*you\s*do|are\s*you)[\s!.,?]*$/i,
    /^tell\s*me\s*(about\s*yourself|more)[\s!.,?]*$/i,
    /^(how\s*can\s*you\s*help|what\s*do\s*you\s*do)[\s!.,?]*$/i,
  ];

  /**
   * Check if this agent can handle the given context
   */
  canHandle(context: AgentContext): boolean {
    // Get the user's message from the context
    const message = context.classificationResult.original_query || '';
    const trimmed = message.trim();

    // Handle short conversational messages
    if (trimmed.length < 50) {
      if (this.conversationalPatterns.some(p => p.test(trimmed))) {
        return true;
      }
    }

    // Check classification tier - Tier 11 is conversational
    if (context.classificationResult.tier === 11) {
      return true;
    }

    return false;
  }

  /**
   * Execute the conversational response
   */
  async execute(context: AgentContext, input: any): Promise<AgentResult> {
    const startTime = Date.now();
    const message = input.userQuery || input.query || context.classificationResult.original_query || '';

    try {
      const response = await this.generateResponse(message, context);

      return {
        success: true,
        output: {
          message: response,
          type: 'conversational',
          suggestions: this.getSuggestions(message)
        },
        trace: {
          step: 'conversational',
          agent: this.name,
          icon: this.icon,
          duration: Date.now() - startTime,
          details: 'Conversational response generated'
        }
      };
    } catch (error: any) {
      return {
        success: false,
        output: {
          message: "Hello! I'm Sovren, your AI assistant. How can I help you today?",
          type: 'conversational',
          fallback: true
        },
        trace: {
          step: 'conversational',
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
   * Generate a conversational response using Claude
   */
  private async generateResponse(message: string, context: AgentContext): Promise<string> {
    const userName = context.userId !== 'anonymous' ? context.userId : 'there';

    const systemPrompt = `You are Sovren, a friendly and capable AI assistant in the SovrenAI Workbench. You work alongside a team of specialized agents:

- 🔍 Researcher: Web research, fact verification, source gathering
- ✍️ Writer: Document generation, content creation, editing
- 📊 Analyst: Data analysis, comparisons, calculations
- 🎨 Designer: Diagrams, visual creation, flowcharts
- 📋 Planner: Task breakdown, scheduling, project planning
- ✅ Reviewer: Quality checks, verification, accuracy scoring

Your role is to:
1. Warmly greet users and make them feel welcome
2. Answer questions about what you and your team can do
3. Guide users to the right specialized agent when they need specific help
4. Keep responses brief, warm, and helpful (2-3 sentences max for greetings)

If someone asks a substantive question, briefly acknowledge it and let them know which agent would be best suited to help.`;

    const response = await this.getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }]
    });

    const textContent = response.content.find(c => c.type === 'text');
    return textContent?.text || "Hello! I'm Sovren, your AI assistant. How can I help you today?";
  }

  /**
   * Get contextual suggestions based on the message
   */
  private getSuggestions(message: string): string[] {
    const lower = message.toLowerCase();

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return [
        'Research a topic',
        'Write a document',
        'Analyze some data',
        'Create a diagram'
      ];
    }

    if (lower.includes('help') || lower.includes('what can you do')) {
      return [
        '@researcher Find information',
        '@writer Create content',
        '@analyst Compare options',
        '@planner Organize tasks'
      ];
    }

    if (lower.includes('thank')) {
      return [
        'Start a new task',
        'Ask another question'
      ];
    }

    return [];
  }
}
