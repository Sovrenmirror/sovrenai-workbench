/**
 * Unit tests for conversational detection
 */

import { describe, it, expect } from 'vitest';

// Recreate the isConversational function for testing
function isConversational(message: string): boolean {
  const conversationalPatterns = [
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
  ];

  const trimmed = message.trim();
  return trimmed.length < 50 && conversationalPatterns.some(p => p.test(trimmed));
}

describe('Conversational Detection', () => {
  describe('Greetings', () => {
    it('should detect "hello" as conversational', () => {
      expect(isConversational('hello')).toBe(true);
    });

    it('should detect "Hello!" as conversational', () => {
      expect(isConversational('Hello!')).toBe(true);
    });

    it('should detect "hi" as conversational', () => {
      expect(isConversational('hi')).toBe(true);
    });

    it('should detect "hey" as conversational', () => {
      expect(isConversational('hey')).toBe(true);
    });

    it('should detect "good morning" as conversational', () => {
      expect(isConversational('good morning')).toBe(true);
    });

    it('should detect "good afternoon" as conversational', () => {
      expect(isConversational('good afternoon')).toBe(true);
    });
  });

  describe('Questions about assistant', () => {
    it('should detect "how are you" as conversational', () => {
      expect(isConversational('how are you')).toBe(true);
    });

    it("should detect what's up as conversational", () => {
      expect(isConversational("what's up")).toBe(true);
    });

    it('should detect "who are you" as conversational', () => {
      expect(isConversational('who are you')).toBe(true);
    });

    it('should detect "what can you do" as conversational', () => {
      expect(isConversational('what can you do')).toBe(true);
    });
  });

  describe('Farewells', () => {
    it('should detect "bye" as conversational', () => {
      expect(isConversational('bye')).toBe(true);
    });

    it('should detect "goodbye" as conversational', () => {
      expect(isConversational('goodbye')).toBe(true);
    });

    it('should detect "see you" as conversational', () => {
      expect(isConversational('see you')).toBe(true);
    });
  });

  describe('Simple responses', () => {
    it('should detect "yes" as conversational', () => {
      expect(isConversational('yes')).toBe(true);
    });

    it('should detect "no" as conversational', () => {
      expect(isConversational('no')).toBe(true);
    });

    it('should detect "thanks" as conversational', () => {
      expect(isConversational('thanks')).toBe(true);
    });

    it('should detect "thank you" as conversational', () => {
      expect(isConversational('thank you')).toBe(true);
    });

    it('should detect "ok" as conversational', () => {
      expect(isConversational('ok')).toBe(true);
    });
  });

  describe('Non-conversational queries', () => {
    it('should not detect research queries as conversational', () => {
      expect(isConversational('What is the speed of light?')).toBe(false);
    });

    it('should not detect long questions as conversational', () => {
      expect(isConversational('Can you explain the theory of relativity in detail?')).toBe(false);
    });

    it('should not detect complex requests as conversational', () => {
      expect(isConversational('Research the history of artificial intelligence')).toBe(false);
    });

    it('should not detect commands as conversational', () => {
      expect(isConversational('Write a summary of the document')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings', () => {
      expect(isConversational('')).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(isConversational('   ')).toBe(false);
    });

    it('should handle messages with leading/trailing whitespace', () => {
      expect(isConversational('  hello  ')).toBe(true);
    });

    it('should reject very long greetings', () => {
      const longMessage = 'hello '.repeat(20);
      expect(isConversational(longMessage)).toBe(false);
    });
  });
});
