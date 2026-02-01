/**
 * Writer Agent
 * Specialized agent for document generation, content creation, and editing
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseAgent, AgentTask, AgentMetadata } from '../base/agent.js';
import {
  documentStorage,
  type Document
} from '../../services/document-storage.js';

export interface WriterTaskInput {
  topic: string;
  format?: 'markdown' | 'plain' | 'html';
  tone?: 'formal' | 'casual' | 'technical' | 'conversational';
  length?: 'short' | 'medium' | 'long';
  context?: string;
  existingDocumentId?: string;
  maxTokens?: number;
  temperature?: number;
  targetAudience?: string;
  keywords?: string[];
}

export interface WriterTaskOutput {
  content: string;
  title: string;
  format: string;
  wordCount: number;
  characterCount: number;
  documentId?: string;
  metadata: {
    model: string;
    tokensUsed: number;
    generationTime: number;
    tone: string;
    targetLength: string;
  };
}

export class WriterAgent extends BaseAgent {
  private anthropic!: Anthropic;
  private model: string = 'claude-sonnet-4-20250514';

  constructor() {
    const metadata: AgentMetadata = {
      id: 'writer',
      name: 'Writer',
      icon: '✍️',
      description: 'Document generation, content creation, and editing specialist',
      capabilities: ['document_generation', 'content_creation', 'editing'],
      version: '1.0.0'
    };

    super(metadata);
  }

  protected async onInitialize(): Promise<void> {
    console.log('[WriterAgent] Initializing...');

    // Initialize Anthropic SDK
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable not set');
    }

    this.anthropic = new Anthropic({ apiKey });

    console.log('[WriterAgent] Initialization complete');
  }

  protected async onExecute(task: AgentTask): Promise<WriterTaskOutput> {
    const input = task.input as WriterTaskInput;

    if (!input.topic) {
      throw new Error('Topic is required for writing task');
    }

    console.log(`[WriterAgent] Starting writing task for topic: "${input.topic}"`);

    // Emit initial progress
    this.emitProgress(0, 'Preparing writing task...', 'initialization');

    const startTime = Date.now();

    try {
      // Phase 1: Prepare prompt (10%)
      this.checkCancel();
      this.emitProgress(10, 'Preparing prompt...', 'preparation');

      const prompt = this.buildPrompt(input);

      // Phase 2: Generate content (40%)
      this.checkCancel();
      this.emitProgress(40, 'Generating content...', 'generation');

      const content = await this.generateContent(prompt, input);

      // Phase 3: Post-process content (70%)
      this.checkCancel();
      this.emitProgress(70, 'Formatting content...', 'formatting');

      const formattedContent = this.formatContent(content, input.format || 'markdown');
      const title = this.extractTitle(formattedContent, input.topic);

      // Phase 4: Save document if requested (90%)
      let documentId: string | undefined;
      if (input.existingDocumentId) {
        this.checkCancel();
        this.emitProgress(90, 'Updating document...', 'saving');

        try {
          documentStorage.update(input.existingDocumentId, {
            text: formattedContent,
            title,
            updated_at: new Date().toISOString()
          });
          documentId = input.existingDocumentId;
        } catch (error) {
          console.warn('[WriterAgent] Failed to update document:', error);
          // Continue anyway, document will be in output
        }
      }

      // Phase 5: Compile result (100%)
      this.checkCancel();
      this.emitProgress(100, 'Finalizing...', 'finalization');

      const generationTime = Date.now() - startTime;

      const output: WriterTaskOutput = {
        content: formattedContent,
        title,
        format: input.format || 'markdown',
        wordCount: this.countWords(formattedContent),
        characterCount: formattedContent.length,
        documentId,
        metadata: {
          model: this.model,
          tokensUsed: Math.ceil(formattedContent.length / 4), // Rough estimate
          generationTime,
          tone: input.tone || 'conversational',
          targetLength: input.length || 'medium'
        }
      };

      console.log(`[WriterAgent] Writing complete. Generated ${output.wordCount} words in ${generationTime}ms`);

      return output;
    } catch (error) {
      console.error('[WriterAgent] Writing failed:', error);
      throw error;
    }
  }

  protected onPause(): void {
    console.log('[WriterAgent] Paused');
  }

  protected onResume(): void {
    console.log('[WriterAgent] Resumed');
  }

  protected onCancel(): void {
    console.log('[WriterAgent] Cancelled');
  }

  /**
   * Build prompt for Claude based on input parameters
   */
  private buildPrompt(input: WriterTaskInput): string {
    const parts: string[] = [];

    // Base instruction
    parts.push(`Write a ${input.length || 'medium'} length document about: ${input.topic}`);

    // Tone
    if (input.tone) {
      parts.push(`\nTone: ${input.tone}`);
    }

    // Target audience
    if (input.targetAudience) {
      parts.push(`\nTarget Audience: ${input.targetAudience}`);
    }

    // Keywords
    if (input.keywords && input.keywords.length > 0) {
      parts.push(`\nKeywords to include: ${input.keywords.join(', ')}`);
    }

    // Context
    if (input.context) {
      parts.push(`\nAdditional Context: ${input.context}`);
    }

    // Format instructions
    parts.push(`\nFormat: ${input.format || 'markdown'}`);

    // Length guidance
    const lengthGuidance: Record<string, string> = {
      short: '300-500 words',
      medium: '800-1200 words',
      long: '1500-2500 words'
    };
    parts.push(`\nTarget length: ${lengthGuidance[input.length || 'medium']}`);

    parts.push('\n\nPlease write comprehensive, well-structured content that is informative and engaging.');

    return parts.join('');
  }

  /**
   * Generate content using Claude
   */
  private async generateContent(prompt: string, input: WriterTaskInput): Promise<string> {
    const maxTokens = input.maxTokens || 4000;
    const temperature = input.temperature !== undefined ? input.temperature : 0.7;

    const message = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract text content from response
    const textContent = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('\n');

    return textContent;
  }

  /**
   * Format content based on requested format
   */
  private formatContent(content: string, format: string): string {
    switch (format) {
      case 'plain':
        // Strip markdown if present
        return content
          .replace(/#+\s/g, '') // Remove headers
          .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
          .replace(/\*(.+?)\*/g, '$1') // Remove italic
          .replace(/\[(.+?)\]\(.+?\)/g, '$1'); // Remove links

      case 'html':
        // Basic markdown to HTML conversion
        return content
          .replace(/^### (.+)$/gm, '<h3>$1</h3>')
          .replace(/^## (.+)$/gm, '<h2>$1</h2>')
          .replace(/^# (.+)$/gm, '<h1>$1</h1>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/^(?!<h|<p)/gm, '<p>')
          .replace(/(?<!>)$/gm, '</p>');

      case 'markdown':
      default:
        return content;
    }
  }

  /**
   * Extract title from content or use topic
   */
  private extractTitle(content: string, fallbackTopic: string): string {
    // Try to extract first heading
    const h1Match = content.match(/^# (.+)$/m);
    if (h1Match) {
      return h1Match[1];
    }

    const h2Match = content.match(/^## (.+)$/m);
    if (h2Match) {
      return h2Match[1];
    }

    // Use first line if short enough
    const firstLine = content.split('\n')[0].trim();
    if (firstLine.length > 0 && firstLine.length < 100) {
      return firstLine;
    }

    // Fallback to topic
    return fallbackTopic;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }
}
