# Token Pattern Design Guidelines
**Version**: 2.0
**Date**: January 30, 2026
**Status**: Official Design Standard

---

## Table of Contents

1. [Core Principle: The 3-7 Word Rule](#core-principle-the-3-7-word-rule)
2. [Why Single-Word Patterns Fail](#why-single-word-patterns-fail)
3. [Pattern Design Process](#pattern-design-process)
4. [Good vs Bad Patterns](#good-vs-bad-patterns)
5. [Pattern Types and Examples](#pattern-types-and-examples)
6. [Testing Your Patterns](#testing-your-patterns)
7. [Common Pitfalls](#common-pitfalls)
8. [Quality Checklist](#quality-checklist)

---

## Core Principle: The 3-7 Word Rule

### The Golden Rule

**Every semantic pattern MUST contain 3-7 words that form a complete semantic phrase.**

```typescript
// ✅ CORRECT
semantic_patterns: [
  "peer reviewed research published",
  "according to empirical evidence",
  "the mathematical proof shows",
  "based on statistical analysis of"
]

// ❌ WRONG
semantic_patterns: [
  "peer",              // 1 word - TOO SHORT
  "research",          // 1 word - TOO SHORT
  "empirical",         // 1 word - TOO SHORT
  "according to"       // 2 words - TOO SHORT
]
```

### Why 3-7 Words?

**3 words minimum**:
- Provides semantic context
- Prevents false matches on common words
- Ensures meaningful phrases

**7 words maximum**:
- Balances specificity vs flexibility
- Matches typical chunk size
- Prevents overly rigid patterns

### Mathematical Justification

**Problem Size**:
- English has ~170,000 words
- Single-word patterns: 170,000 potential matches per token
- 3-word phrases: ~100 billion combinations (ultra-specific)
- 7-word phrases: Even more specific

**Result**: 3-7 word patterns reduce false positives by **99.96%+**

---

## Why Single-Word Patterns Fail

### The Micro-Token Explosion

**Example**: `PeerReviewedTT` with single-word patterns

**BAD Pattern** (single words):
```typescript
semantic_patterns: ["peer", "reviewed", "study", "published"]
```

**Result on**: "How are you doing today?"
```
❌ Matched "you" → "peer" (substring match)
❌ Matched "how" → "study" (partial phonetic match)
❌ 35,000+ false positive tokens
```

**GOOD Pattern** (multi-word):
```typescript
semantic_patterns: [
  "peer reviewed research",
  "peer reviewed study",
  "published in peer reviewed"
]
```

**Result on**: "How are you doing today?"
```
✅ No matches (requires full phrase)
✅ 0 tokens (correct)
```

### Real-World Impact

| Pattern Type | Greeting Token Count | Reduction |
|--------------|---------------------|-----------|
| Single-word | 35,000+ | Baseline |
| 2-word | 8,000 | 77.1% |
| **3-7 word** | **0-13** | **99.96%** |

---

## Pattern Design Process

### Step 1: Understand Your Token's Meaning

**Example**: `EmpiricalTT` - Statements based on observation/measurement

**Ask yourself**:
- What does this token represent?
- What phrases would humans use to express this?
- What's the semantic context?

### Step 2: Identify Natural Language Patterns

**Brainstorm phrases** that express the concept:
- "based on empirical observation"
- "according to empirical data"
- "empirical evidence shows that"
- "measured through empirical methods"
- "empirical research indicates"

### Step 3: Count Words and Validate

**Check each pattern**:
```typescript
"based on empirical observation"     // 4 words ✅
"according to empirical data"        // 4 words ✅
"empirical evidence shows that"      // 4 words ✅
"measured through empirical methods" // 4 words ✅
"empirical research indicates"       // 3 words ✅
```

### Step 4: Test for Semantic Completeness

**Does the pattern**:
- Form a complete thought?
- Provide sufficient context?
- Avoid common word combinations?

```typescript
// ✅ GOOD - Complete semantic phrase
"empirical evidence shows that"

// ❌ BAD - Incomplete thought
"empirical evidence"  // 2 words, no verb

// ❌ BAD - Too common
"based on the data"   // Too generic, many false positives
```

### Step 5: Validate Against Test Cases

**Test with non-matching text**:
```
"How are you today?" → Should match 0 patterns
"The sky is blue" → Should match 0 patterns
"I like empirical things" → Should match 0 patterns (incomplete phrase)
```

**Test with matching text**:
```
"According to empirical data collected..." → Should match ✅
"The empirical evidence shows that..." → Should match ✅
```

---

## Good vs Bad Patterns

### Category 1: Evidence Tokens

#### ❌ BAD - EmpiricalTT (old)
```typescript
semantic_patterns: [
  "empirical",           // 1 word - will match "The empire fell"
  "data",                // 1 word - will match "database"
  "observation",         // 1 word - will match "observation deck"
  "measured"             // 1 word - will match "measured cup"
]
```

**Problems**:
- Matches partial words (substring matching)
- No semantic context
- 50,000+ false positives on normal text

#### ✅ GOOD - EmpiricalTT (fixed)
```typescript
semantic_patterns: [
  "based on empirical observation",
  "according to empirical data",
  "empirical evidence shows that",
  "measured through empirical methods",
  "empirical research indicates"
]
```

**Benefits**:
- Requires full semantic context
- Won't match casual language
- 99.96% fewer false positives

### Category 2: Question Tokens

#### ❌ BAD - RequestTT (old)
```typescript
semantic_patterns: [
  "how",      // 1 word - matches every "how are you"
  "what",     // 1 word - matches every "what's up"
  "why",      // 1 word - matches "why not"
  "help"      // 1 word - matches "helpful"
]
```

**Problems**:
- Ultra-high frequency words
- No intention context
- 35,000+ matches on greetings

#### ✅ GOOD - RequestTT (fixed)
```typescript
semantic_patterns: [
  "please teach me how",
  "can you show me",
  "help me understand how",
  "what is the best",
  "why is it that",
  "how do I accomplish"
]
```

**Benefits**:
- Full request phrase required
- Includes intention words ("please", "help me")
- Only matches actual requests

### Category 3: Scientific Domain Tokens

#### ❌ BAD - PhysicsTT (old)
```typescript
semantic_patterns: [
  "physics",           // 1 word - matches "physical therapy"
  "force",             // 1 word - matches "workforce"
  "energy",            // 1 word - matches "energy drink"
  "matter"             // 1 word - matches "it doesn't matter"
]
```

#### ✅ GOOD - PhysicsTT (fixed)
```typescript
semantic_patterns: [
  "physics research shows that",
  "according to physical laws",
  "principles of physics dictate",
  "physics equations describe the",
  "based on physics theory"
]
```

---

## Pattern Types and Examples

### Type 1: Evidence-Based Patterns

**Structure**: `[evidence qualifier] + [evidence type] + [verb/connector]`

```typescript
// EmpiricalTT
"based on empirical observation"
"according to empirical data"
"empirical evidence shows that"

// StatisticalTT
"statistical analysis reveals that"
"according to statistical data"
"statistical evidence suggests the"

// MeasurementTT
"measured value of the"
"measurement indicates that the"
"according to measurements taken"
```

### Type 2: Authority-Based Patterns

**Structure**: `[authority qualifier] + [authority type] + [action]`

```typescript
// PeerReviewedTT
"peer reviewed research shows"
"according to peer reviewed"
"peer reviewed study published"
"published in peer reviewed"

// ExpertOpinionTT
"expert opinion suggests that"
"according to expert analysis"
"experts in the field"
```

### Type 3: Domain-Specific Patterns

**Structure**: `[domain name] + [domain action/concept] + [connector]`

```typescript
// PhysicsTT
"physics research shows that"
"according to physical laws"
"principles of physics dictate"

// BiologyTT
"biological research indicates that"
"according to biological principles"
"biology studies show that"

// ChemistryTT
"chemistry experiments demonstrate that"
"according to chemical principles"
"chemical analysis shows that"
```

### Type 4: Temporal Patterns

**Structure**: `[time reference] + [temporal context] + [connector]`

```typescript
// CurrentTT
"current state of affairs"
"currently happening in the"
"at the present time"

// HistoricalContextTT
"historical evidence shows that"
"according to historical records"
"history demonstrates that the"

// FutureTT
"future projections indicate that"
"predicted future state of"
"future trends suggest that"
```

### Type 5: Modal/Epistemic Patterns

**Structure**: `[epistemic marker] + [modal verb] + [complement]`

```typescript
// MaybeSpeculativeTT
"it may be that"
"possibly true that the"
"perhaps it is the case"

// EstimationTT
"estimated value of the"
"approximate calculation shows that"
"roughly equivalent to the"
```

---

## Testing Your Patterns

### Test Suite Template

```typescript
const TEST_CASES = [
  {
    name: 'Should NOT match casual language',
    text: 'How are you doing today?',
    expectedMatches: 0
  },
  {
    name: 'Should NOT match partial phrases',
    text: 'The empirical building has data',
    expectedMatches: 0
  },
  {
    name: 'SHOULD match proper usage',
    text: 'Based on empirical observation, the data shows...',
    expectedMatches: 1,
    expectedToken: 'EmpiricalTT'
  }
];
```

### Manual Testing Process

1. **Test with greetings**
   ```
   "Hello, how are you?"
   "Good morning!"
   "What's up?"
   ```
   **Expected**: 0 matches

2. **Test with casual text**
   ```
   "I went to the store yesterday"
   "The movie was really good"
   "Let's grab lunch tomorrow"
   ```
   **Expected**: 0 matches

3. **Test with target content**
   ```
   "According to peer reviewed research..."
   "The empirical evidence shows that..."
   "Based on statistical analysis..."
   ```
   **Expected**: 1-3 matches (your token only)

4. **Test with similar but wrong content**
   ```
   "The peer pressure was intense"
   "I reviewed my notes"
   "The empire fell"
   ```
   **Expected**: 0 matches

---

## Common Pitfalls

### Pitfall 1: Generic Phrases

❌ **Bad**: "the data shows"
- Too generic, matches everything

✅ **Good**: "the empirical data shows"
- Specific evidence type

### Pitfall 2: Substring Traps

❌ **Bad**: "con" (matches "conclusion", "constant", "confirm")
- Single syllables are dangerous

✅ **Good**: "condition implies that the"
- Full semantic phrase

### Pitfall 3: Common Word Combinations

❌ **Bad**: "based on the"
- Ultra-common phrase

✅ **Good**: "based on empirical observation"
- Specific qualifier

### Pitfall 4: Incomplete Thoughts

❌ **Bad**: "according to evidence"
- What kind of evidence?

✅ **Good**: "according to empirical evidence"
- Specifies evidence type

### Pitfall 5: Overly Specific Patterns

❌ **Bad**: "according to empirical evidence collected from peer reviewed research"
- 9 words, too rigid

✅ **Good**: "according to empirical evidence"
- 4 words, good balance

---

## Quality Checklist

Before adding patterns to production, verify:

### ✅ Word Count
- [ ] All patterns have 3-7 words
- [ ] No single-word patterns
- [ ] No 2-word patterns (unless exceptional case)

### ✅ Semantic Completeness
- [ ] Each pattern forms a complete thought
- [ ] Pattern includes sufficient context
- [ ] Pattern is not overly generic

### ✅ False Positive Prevention
- [ ] Tested against greetings (should not match)
- [ ] Tested against casual text (should not match)
- [ ] Tested against partial phrases (should not match)

### ✅ True Positive Validation
- [ ] Matches target content correctly
- [ ] Matches variations of target content
- [ ] Doesn't match similar-but-wrong content

### ✅ Consistency
- [ ] Follows established pattern types for this tier
- [ ] Uses consistent language structure
- [ ] Aligns with other tokens in same category

### ✅ Documentation
- [ ] Token definition clearly explains purpose
- [ ] Pattern rationale documented
- [ ] Examples provided

---

## Pattern Examples by Tier

### T0 (Meta)
```typescript
// MetaSystemTT
"AI system capability"
"system behavior exhibits"
"system status indicates"
```

### T1 (Universal)
```typescript
// AtomicFactTT
"the value is exactly"
"has been measured at"
"proven to equal"

// MathematicalTT
"mathematically equals to"
"formula shows that"
"equation demonstrates that"
```

### T2 (Physical/Evidence)
```typescript
// EmpiricalTT
"based on empirical observation"
"empirical evidence shows that"
"measured through empirical methods"

// PeerReviewedTT
"peer reviewed research shows"
"published in peer reviewed"
"according to peer reviewed"
```

### T3 (Scientific)
```typescript
// PhysicsTT
"physics research shows that"
"according to physical laws"
"principles of physics dictate"

// BiologyTT
"biological research indicates that"
"according to biological principles"
"biology studies show that"
```

### T9 (Meta-Linguistic)
```typescript
// RequestTT
"please teach me how"
"can you show me"
"help me understand how"

// QuestionTT
"interrogative form asking about"
"question form inquiring about"
"asks about the nature"
```

---

## Version History

### Version 2.0 (January 30, 2026)
- **Change**: Mandatory 3-7 word requirement
- **Reason**: Eliminated 99.96% of false positives
- **Impact**: All 358 tokens updated

### Version 1.0 (Pre-2026)
- **Pattern Style**: Single-word and short phrases
- **Result**: 35,000+ token explosions
- **Status**: Deprecated

---

## Enforcement

### Automated Checks

Future versions will include automated validation:
```typescript
function validatePattern(pattern: string): boolean {
  const wordCount = pattern.split(/\s+/).length;
  if (wordCount < 3 || wordCount > 7) {
    throw new Error(`Pattern must have 3-7 words, got ${wordCount}: "${pattern}"`);
  }
  return true;
}
```

### Code Review Requirements

All pattern changes must:
1. Pass automated word count check
2. Include test cases showing 0 false positives
3. Be reviewed by 2+ team members
4. Be tested against standard test suite

---

## Additional Resources

- `truth-token-registry.ts` - See all 393 token definitions
- `test-token-fixes.ts` - Pattern validation tests
- `FINAL_PROGRESS_SUMMARY.md` - Complete fix documentation
- `OPTION2_COMPLETION_SUMMARY.md` - T0-T3 fix details

---

## Questions?

**Q**: Can I ever use 2-word patterns?
**A**: Only in exceptional cases with strong justification. Default to 3-7 words.

**Q**: What if my pattern needs 8+ words?
**A**: Split into multiple 3-7 word patterns that cover different phrasings.

**Q**: How do I test my patterns?
**A**: Use `test-token-fixes.ts` template or the API test suite.

**Q**: What if I find an existing bad pattern?
**A**: Update it following these guidelines and run full test suite.

---

## Summary

**The 3-7 Word Rule is non-negotiable.**

Following these guidelines ensures:
- ✅ 99.96%+ false positive reduction
- ✅ Semantic precision
- ✅ Production-ready patterns
- ✅ Maintainable token registry

**When in doubt, make it longer and more specific.**

---

*Pattern Design Guidelines v2.0*
*Last Updated: January 30, 2026*
*Mandatory for all token patterns*
