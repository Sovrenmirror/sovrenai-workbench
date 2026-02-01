/**
 * Unit tests for agent routing logic
 */

import { describe, it, expect } from 'vitest';

// Recreate the agent selection logic for testing
function selectAgentForMessage(message: string): string {
  const messageLower = message.toLowerCase();

  if (messageLower.includes('research') || messageLower.includes('find') || messageLower.includes('search')) {
    return 'researcher';
  } else if (messageLower.includes('analyze') || messageLower.includes('compare') || messageLower.includes('calculate')) {
    return 'analyst';
  } else if (messageLower.includes('write') || messageLower.includes('create') || messageLower.includes('draft')) {
    return 'writer';
  } else if (messageLower.includes('diagram') || messageLower.includes('visual') || messageLower.includes('chart')) {
    return 'designer';
  } else if (messageLower.includes('plan') || messageLower.includes('organize') || messageLower.includes('schedule')) {
    return 'planner';
  } else if (messageLower.includes('review') || messageLower.includes('check') || messageLower.includes('verify')) {
    return 'reviewer';
  } else {
    return 'writer'; // Default
  }
}

describe('Agent Routing', () => {
  describe('Researcher Agent', () => {
    it('should route "research" queries to researcher', () => {
      expect(selectAgentForMessage('Research the topic')).toBe('researcher');
    });

    it('should route "find" queries to researcher', () => {
      expect(selectAgentForMessage('Find information about AI')).toBe('researcher');
    });

    it('should route "search" queries to researcher', () => {
      expect(selectAgentForMessage('Search for quantum computing papers')).toBe('researcher');
    });
  });

  describe('Analyst Agent', () => {
    it('should route "analyze" queries to analyst', () => {
      expect(selectAgentForMessage('Analyze the data')).toBe('analyst');
    });

    it('should route "compare" queries to analyst', () => {
      expect(selectAgentForMessage('Compare these two options')).toBe('analyst');
    });

    it('should route "calculate" queries to analyst', () => {
      expect(selectAgentForMessage('Calculate the ROI')).toBe('analyst');
    });
  });

  describe('Writer Agent', () => {
    it('should route "write" queries to writer', () => {
      expect(selectAgentForMessage('Write a report')).toBe('writer');
    });

    it('should route "create" queries to writer', () => {
      expect(selectAgentForMessage('Create a document')).toBe('writer');
    });

    it('should route "draft" queries to writer', () => {
      expect(selectAgentForMessage('Draft an email')).toBe('writer');
    });
  });

  describe('Designer Agent', () => {
    it('should route "diagram" queries to designer', () => {
      expect(selectAgentForMessage('Show me a diagram')).toBe('designer');
    });

    it('should route "visual" queries to designer', () => {
      expect(selectAgentForMessage('Make a visual representation')).toBe('designer');
    });

    it('should route "chart" queries to designer', () => {
      expect(selectAgentForMessage('Generate a chart')).toBe('designer');
    });
  });

  describe('Planner Agent', () => {
    it('should route "plan" queries to planner', () => {
      expect(selectAgentForMessage('Plan the project')).toBe('planner');
    });

    it('should route "organize" queries to planner', () => {
      expect(selectAgentForMessage('Organize the tasks')).toBe('planner');
    });

    it('should route "schedule" queries to planner', () => {
      expect(selectAgentForMessage('Schedule the meeting')).toBe('planner');
    });
  });

  describe('Reviewer Agent', () => {
    it('should route "review" queries to reviewer', () => {
      expect(selectAgentForMessage('Review the document')).toBe('reviewer');
    });

    it('should route "check" queries to reviewer', () => {
      expect(selectAgentForMessage('Check for errors')).toBe('reviewer');
    });

    it('should route "verify" queries to reviewer', () => {
      expect(selectAgentForMessage('Verify the facts')).toBe('reviewer');
    });
  });

  describe('Default Routing', () => {
    it('should default to writer for ambiguous queries', () => {
      expect(selectAgentForMessage('Help me with this')).toBe('writer');
    });

    it('should default to writer for general questions', () => {
      expect(selectAgentForMessage('What is entropy?')).toBe('writer');
    });
  });

  describe('Priority Handling', () => {
    it('should prioritize research over write when both keywords present', () => {
      // "Research" comes before "write" in the if-else chain
      expect(selectAgentForMessage('Research and write about AI')).toBe('researcher');
    });

    it('should prioritize analyze over write when both keywords present', () => {
      expect(selectAgentForMessage('Analyze and write a report')).toBe('analyst');
    });
  });

  describe('Case Insensitivity', () => {
    it('should handle uppercase input', () => {
      expect(selectAgentForMessage('RESEARCH THE TOPIC')).toBe('researcher');
    });

    it('should handle mixed case input', () => {
      expect(selectAgentForMessage('AnAlYzE the Data')).toBe('analyst');
    });
  });
});
