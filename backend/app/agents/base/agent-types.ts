/**
 * Agent System Types
 * Type definitions for the SovrenAI Workbench agent system
 */

import type { ClassificationResult } from '../../services/truth_beast/index.js';

/**
 * Provenance tracking for agent operations
 */
export interface Provenance {
  serp_results?: Array<{
    title: string;
    snippet: string;
    url: string;
    source: string;
  }>;
  registry_matches?: any[];
  ground_truth_matches?: any[];
  review?: any;
  [key: string]: any;
}

/**
 * Step trace for stenographer
 */
export interface StepTrace {
  step: string;
  agent: string;
  icon: string;
  duration: number;
  details: string;
  error?: string;
}

/**
 * Artifact produced by agents
 */
export interface Artifact {
  type: 'document' | 'diagram' | 'spreadsheet' | 'presentation' | 'checklist' | 'analysis';
  title?: string;
  content: any;
  format: string;
  createdBy: string;
  metadata?: Record<string, any>;
  documentId?: string;
  version?: number;
}

/**
 * Agent execution context
 */
export interface AgentContext {
  userId: string;
  conversationId: string;
  classificationResult: ClassificationResult;
  previousSteps: StepTrace[];
  provenance: Provenance;
}

/**
 * Agent execution result
 */
export interface AgentResult {
  success: boolean;
  output: any;
  trace: StepTrace;
  artifacts?: Artifact[];
}

/**
 * Agent interface
 */
export interface Agent {
  name: string;
  icon: string;
  execute(context: AgentContext, input: any): Promise<AgentResult>;
  canHandle(context: AgentContext): boolean;
}
