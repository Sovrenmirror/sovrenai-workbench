# Truth Token Pattern Design Principles
**Version**: 1.0
**Date**: January 30, 2026
**Status**: Design Specification

---

## Core Rule

> **"3-7 words should be identifiable as a truth token"**

A truth token pattern must be a **semantic unit** containing enough context to unambiguously identify its meaning, tier classification, and epistemological role.

---

## Fundamental Principles

### 1. Semantic Completeness
**A pattern must convey complete semantic meaning on its own.**

✅ **GOOD**:
- "the speed of light" (complete physical concept)
- "according to peer-reviewed research" (complete epistemological marker)
- "I personally believe that" (complete subjective qualifier)
- "if and only if" (complete logical operator)

❌ **BAD**:
- "speed" (ambiguous - speed of what? typing speed? driving speed?)
- "research" (missing source qualification)
- "believe" (missing subject and context)
- "if" (incomplete logical structure)

### 2. Word Count Requirements

| Word Count | Status | Use Case |
|------------|--------|----------|
| 1 word | ❌ **FORBIDDEN** | Too ambiguous, matches everything |
| 2 words | 🟡 **ACCEPTABLE** | Only if highly specific (e.g., "quantum entanglement") |
| 3-4 words | ✅ **GOOD** | Preferred for most tokens |
| 5-7 words | ✅ **IDEAL** | Best for complex semantic patterns |
| 8+ words | 🟡 **VERBOSE** | Only if necessary for precision |

### 3. Context Sufficiency
**Patterns must be self-contained without external context.**

✅ **GOOD**: "measured by peer-reviewed experiment"
❌ **BAD**: "measured" (by whom? how? when?)

✅ **GOOD**: "according to historical records"
❌ **BAD**: "historical" (what kind of history?)

### 4. Tier-Appropriate Specificity

Each tier requires different pattern specificity:

**T0-T1 (Meta, Universal)**: Patterns should be universally recognizable
- ✅ "mathematical proof demonstrates"
- ✅ "logically follows from"
- ❌ "proof" (could be proof of concept, proof of purchase, etc.)

**T2-T4 (Physical, Scientific, Historical)**: Domain-specific but clear
- ✅ "measured in controlled experiment"
- ✅ "documented in historical archive"
- ❌ "experiment" (too vague)

**T5-T7 (Probabilistic, Contextual, Subjective)**: Include uncertainty markers
- ✅ "probably based on statistics"
- ✅ "in this specific context"
- ✅ "I personally feel that"
- ❌ "probably" (missing basis)

**T8-T12 (Spiritual, Garbage, Deceptive)**: Include characteristic markers
- ✅ "according to spiritual belief"
- ✅ "clickbait headline claims"
- ❌ "spiritual" (needs context)

### 5. High-Frequency Word Filtering

**Never use ultra-common words as standalone patterns:**

**Forbidden Single-Word Patterns**:
- Articles: a, an, the
- Copulas: is, are, was, were, be, been, being
- Auxiliaries: have, has, had, do, does, did, will, would, could, should, may, might, can
- Conjunctions: and, or, but, if
- Interrogatives: how, what, when, where, why, who, which
- Prepositions: to, from, in, on, at, by, for, with, about, as, of

**Exception**: These words CAN appear WITHIN multi-word patterns:
- ✅ "if and only if" (complete logical structure)
- ✅ "according to the evidence" (complete phrase)
- ✅ "at the time when" (complete temporal marker)

---

## Pattern Design Templates

### Template Categories

#### 1. **Epistemological Markers** (How we know)
Pattern structure: `[source qualifier] + [verification method] + [claim type]`

Examples:
- "according to peer-reviewed research"
- "measured in controlled experiment"
- "documented in historical records"
- "proven by mathematical demonstration"
- "claimed without evidence"
- "I personally believe that"

#### 2. **Logical Structures** (Reasoning patterns)
Pattern structure: `[logical operator] + [conditional elements]`

Examples:
- "if and only if"
- "logically follows from"
- "implies that therefore"
- "contradicts the evidence that"
- "assumes without justification"

#### 3. **Temporal Markers** (Time-related)
Pattern structure: `[time preposition] + [temporal noun] + [qualifier]`

Examples:
- "at the time when"
- "during the period of"
- "since the year of"
- "before the era of"
- "in the century following"

#### 4. **Quantitative Patterns** (Numbers/measurements)
Pattern structure: `[measurement verb] + [unit type] + [precision]`

Examples:
- "measured at exactly"
- "approximately equal to"
- "within the range of"
- "calculated to be"
- "estimated at around"

#### 5. **Qualification Patterns** (Certainty/uncertainty)
Pattern structure: `[modal qualifier] + [probability marker] + [claim]`

Examples:
- "definitely proven to be"
- "probably based on evidence"
- "possibly according to theory"
- "might be true if"
- "certainly false because"

#### 6. **Domain-Specific Markers**
Pattern structure: `[domain qualifier] + [expertise marker] + [claim type]`

Examples:
- "according to scientific consensus"
- "legal precedent establishes that"
- "medical research indicates"
- "engineering principle states"
- "philosophical argument posits"

#### 7. **Deception Indicators**
Pattern structure: `[manipulation marker] + [intent indicator]`

Examples:
- "clickbait headline claims"
- "misleading without context"
- "exaggerated for effect"
- "cherry-picked data suggests"
- "selectively omits that"

---

## Token-Specific Pattern Design

### By Tier Requirements

#### T0: Meta (System Self-Reference)
**Purpose**: Identify AI system behavior, capabilities, bugs

**Pattern Requirements**:
- Must reference system/AI explicitly
- Must indicate meta-level operation
- 3-5 words optimal

**Examples**:
- MetaSystemTT: "AI system capability", "model behavior exhibits", "system status indicates"
- MetaBugTT: "system error detected", "bug causes failure", "malfunction in process"
- MetaHallucinationTT: "AI hallucinated response", "model confabulated information", "generated false memory"

#### T1: Universal (Always True)
**Purpose**: Mathematical, logical, universal truths

**Pattern Requirements**:
- Must be universally verifiable
- Must indicate absolute truth
- 3-6 words optimal

**Examples**:
- MathematicalTT: "mathematical proof demonstrates", "equals by definition", "sum of all"
- LogicalTT: "logically follows from", "necessarily implies that", "therefore must be"
- AtomicFactTT: "the value is exactly", "defined as being", "contains precisely"

#### T2: Physical (Science Facts)
**Purpose**: Verified physical reality

**Pattern Requirements**:
- Must reference measurement/observation
- Must indicate empirical verification
- 4-6 words optimal

**Examples**:
- PhysicalConstantTT: "the speed of light", "gravitational constant equals", "measured physical constant"
- ExperimentalTT: "measured in controlled experiment", "observed under laboratory conditions"
- WitnessedTT: "directly observed by witnesses", "documented eyewitness account"

#### T3: Scientific (Expert Knowledge)
**Purpose**: Domain-specific scientific knowledge

**Pattern Requirements**:
- Must reference domain/expertise
- Must indicate specialized knowledge
- 4-7 words optimal

**Examples**:
- ScientificTheoryTT: "according to scientific theory", "theoretical framework predicts", "scientific model suggests"
- LegalTT: "according to legal precedent", "statute explicitly states", "case law establishes"
- MedicalTT: "medical research indicates that", "clinical trial demonstrated", "diagnosis based on symptoms"

#### T4: Historical (Documented Past)
**Purpose**: Historical events and records

**Pattern Requirements**:
- Must reference time period
- Must indicate documentation
- 4-6 words optimal

**Examples**:
- HistoricalEventTT: "documented historical event occurred", "recorded in historical archives", "took place in year"
- ArchivalTT: "preserved in historical records", "archived document states", "primary source documents"

#### T5: Probabilistic (Statistical/Likely)
**Purpose**: Probability and statistical claims

**Pattern Requirements**:
- Must include probability marker
- Must indicate statistical basis
- 4-7 words optimal

**Examples**:
- ProbabilisticTT: "probably based on statistics", "likelihood according to data", "statistical analysis suggests"
- TrendTT: "trend indicates that likely", "pattern suggests probability of"

#### T6: Contextual (Depends on Context)
**Purpose**: Context-dependent truths

**Pattern Requirements**:
- Must indicate context dependency
- Must specify conditions
- 4-7 words optimal

**Examples**:
- ContextualTT: "in this specific context", "given these particular conditions", "under these circumstances only"
- ConditionalTT: "if and only if conditions", "assuming that premise holds", "contingent upon the case"

#### T7: Subjective (Personal Opinion)
**Purpose**: Personal beliefs and opinions

**Pattern Requirements**:
- Must include personal pronoun/marker
- Must indicate subjectivity
- 3-6 words optimal

**Examples**:
- OpinionTT: "I personally believe that", "in my opinion", "my view is that"
- SubjectiveTT: "from my perspective seems", "I feel that perhaps", "personally I think"

#### T8: Spiritual (Faith-Based)
**Purpose**: Religious/spiritual beliefs

**Pattern Requirements**:
- Must reference faith/belief system
- Must indicate non-empirical basis
- 4-6 words optimal

**Examples**:
- SpiritualTT: "according to spiritual belief", "faith teaches that", "religious doctrine states"
- MetaphysicalTT: "metaphysical claim posits that", "beyond physical realm exists"

#### T9: Garbage (Low Quality)
**Purpose**: Unverified, unsourced, poor quality

**Pattern Requirements**:
- Must indicate lack of source
- Must show quality issues
- 3-6 words optimal

**Examples**:
- UnverifiedTT: "claimed without any evidence", "unsourced assertion states", "no verification provided"
- HearsayTT: "heard from someone that", "rumor suggests without proof"
- SpeculationTT: "wild speculation without basis", "unfounded claim suggests"

#### T10: Relational (Connections)
**Purpose**: Relationships between entities

**Pattern Requirements**:
- Must indicate relationship type
- Must show connection
- 3-5 words optimal

**Examples**:
- CausalTT: "directly causes the effect", "results in the outcome", "leads to consequence"
- CorrelationTT: "correlated with but not", "associated with the factor"

#### T11-T12: Deceptive/Adversarial
**Purpose**: Manipulation and deception

**Pattern Requirements**:
- Must indicate deceptive intent
- Must show manipulation tactics
- 4-7 words optimal

**Examples**:
- ClickbaitTT: "clickbait headline claims shocking", "sensationalized for attention"
- MisleadingTT: "misleadingly omits crucial context", "deceptively framed to suggest"
- GaslightingTT: "contradicts documented evidence to confuse", "denies observable reality deliberately"

---

## Pattern Testing Methodology

### Testing Checklist

For each pattern, verify:

1. **✓ Semantic Completeness**: Does it convey complete meaning?
2. **✓ Word Count**: Is it 2-7 words (preferably 3-7)?
3. **✓ Specificity**: Is it specific to this token type?
4. **✓ No Ambiguity**: Does it match ONLY relevant text?
5. **✓ Tier Appropriate**: Does it match the tier's epistemological level?
6. **✓ No High-Freq Single Words**: Does it avoid forbidden patterns?

### Test Cases

**Test against these phrases**:

1. "How are you doing today?" → Should match 0-2 tokens (greeting patterns)
2. "The speed of light is 299,792,458 m/s" → Should match PhysicalConstantTT, NumericalTT, AtomicFactTT
3. "I believe climate change is real" → Should match OpinionTT, SubjectiveTT, ScientificFactTT
4. "According to peer-reviewed research" → Should match ScientificTheoryTT, VerifiedSourceTT
5. "This is a test" → Should match 0-1 tokens (too generic for most patterns)

### Anti-Patterns (What NOT to match)

**Avoid patterns that match generic phrases**:
- ❌ "is" matching "this is a test"
- ❌ "when" matching "when I go to the store"
- ❌ "how" matching "how to make cookies"
- ❌ "about" matching "talk about the weather"

---

## Pattern Transformation Examples

### Example 1: AtomicFactTT (T1)
**Current (BROKEN)**:
```typescript
semantic_patterns: ["is", "are", "was", "has", "have", "exists", "contains"]
```
**Problem**: Matches every sentence with copula

**Corrected**:
```typescript
semantic_patterns: [
  "the value is exactly",
  "defined as being",
  "has been measured at",
  "contains precisely the",
  "exists in the form",
  "proven to equal",
  "established fact that"
]
```
**Why Better**: Each pattern is 3-5 words and conveys factual assertion

---

### Example 2: TemporalTT (T1)
**Current (BROKEN)**:
```typescript
semantic_patterns: ["when", "date", "year", "century", "era", "time", "period"]
```
**Problem**: Matches every question and temporal reference

**Corrected**:
```typescript
semantic_patterns: [
  "at the time when",
  "during the period of",
  "in the year",
  "since the date of",
  "before the era of",
  "after the century of",
  "throughout the time period"
]
```
**Why Better**: Complete temporal phrases with context

---

### Example 3: ConditionalTT (T1)
**Current (BROKEN)**:
```typescript
semantic_patterns: ["if", "then", "when", "condition", "assuming", "suppose"]
```
**Problem**: "if" matches every conditional, "when" matches every temporal

**Corrected**:
```typescript
semantic_patterns: [
  "if and only if",
  "assuming that the premise",
  "under the condition that",
  "given that it follows",
  "suppose for the sake",
  "contingent upon whether",
  "provided that it holds"
]
```
**Why Better**: Complete conditional structures

---

### Example 4: OpinionTT (T7)
**Current (BROKEN)**:
```typescript
semantic_patterns: ["think", "believe", "feel", "opinion", "view"]
```
**Problem**: Missing personal markers, too generic

**Corrected**:
```typescript
semantic_patterns: [
  "I personally believe that",
  "in my opinion it",
  "my view is that",
  "I think that perhaps",
  "from my perspective seems",
  "I feel that maybe"
]
```
**Why Better**: Includes personal pronouns and complete subjective markers

---

### Example 5: ScientificTheoryTT (T3)
**Current (BROKEN)**:
```typescript
semantic_patterns: ["theory", "hypothesis", "model", "framework"]
```
**Problem**: Could match "conspiracy theory", "theoretical physics", etc.

**Corrected**:
```typescript
semantic_patterns: [
  "according to scientific theory",
  "theoretical framework predicts",
  "scientific model suggests",
  "hypothesis states that if",
  "theory is supported by"
]
```
**Why Better**: Specifies scientific context and epistemic role

---

## Pattern Coverage Guidelines

### Patterns Per Token

**Minimum**: 5 patterns per token
**Recommended**: 7-10 patterns per token
**Maximum**: 15 patterns per token

**Why Multiple Patterns?**
- Natural language has variation
- Same concept expressed different ways
- Need comprehensive coverage

**Pattern Variation Types**:
1. **Structural variations**: "according to X", "X indicates that", "based on X"
2. **Tense variations**: "measured at", "was measured at", "has been measured"
3. **Formality variations**: "I think", "I believe", "in my opinion", "from my perspective"
4. **Domain variations**: "scientific theory", "physical theory", "theoretical model"

---

## Quality Assurance

### Pattern Review Checklist

Before finalizing patterns for a token:

- [ ] All patterns are 2+ words (preferably 3-7)
- [ ] No ultra-common single-word patterns
- [ ] Each pattern is semantically complete
- [ ] Patterns are specific to this token type
- [ ] Patterns don't overlap significantly with other tokens
- [ ] 5-10 pattern variations provided
- [ ] Tested against sample text
- [ ] No false positives on generic phrases
- [ ] Tier-appropriate epistemological markers included

### Common Mistakes to Avoid

1. **❌ Single-word fallback**: Including "theory" alongside "scientific theory"
   - **✓ Fix**: Only use complete phrases

2. **❌ High-frequency words**: Using "is", "are", "when" as patterns
   - **✓ Fix**: Embed them in complete phrases only

3. **❌ Ambiguous patterns**: "data" (could be data science, data entry, etc.)
   - **✓ Fix**: "measured data shows", "empirical data indicates"

4. **❌ Overlapping patterns**: Multiple tokens matching the same phrase
   - **✓ Fix**: Make patterns specific to token's semantic role

5. **❌ Too verbose**: "according to the most recent peer-reviewed scientific research published in"
   - **✓ Fix**: "according to peer-reviewed research" (5 words is enough)

---

## Implementation Guidelines

### Workflow for Fixing Tokens

1. **Read token definition**: Understand semantic role and tier
2. **Identify current patterns**: Note which are problematic
3. **List semantic variations**: How is this concept expressed?
4. **Draft multi-word patterns**: Create 7-10 complete phrases
5. **Test against samples**: Verify no false positives
6. **Cross-check with similar tokens**: Avoid overlap
7. **Document reasoning**: Why these patterns?

### Pattern Documentation Format

```typescript
'TokenNameTT': {
  symbol: 'TokenNameTT',
  name: 'Token Name',
  tier: X,
  definition: 'What this token identifies',
  weight: X.XX,
  category: 'Category',
  resistance: X.XX,
  // Patterns: [semantic role description]
  // - [pattern purpose 1]
  // - [pattern purpose 2]
  semantic_patterns: [
    "complete phrase one",      // variation 1
    "complete phrase two",      // variation 2
    "complete phrase three",    // variation 3
    // ... 5-10 total patterns
  ],
  E_in: 'text',
  E_out: 'token_type',
  grounded: true/false,
}
```

---

## Success Metrics

### Pattern Quality Indicators

**Good Pattern Set**:
- ✅ Token count for greeting: < 20
- ✅ All patterns 2+ words
- ✅ No ambiguous matches
- ✅ Semantically meaningful
- ✅ 5-10 variations provided

**Bad Pattern Set**:
- ❌ Token count for greeting: 1000+
- ❌ Single-word patterns present
- ❌ Matches generic phrases
- ❌ Overlaps with other tokens
- ❌ < 3 patterns provided

---

## Appendix: Pattern Templates by Category

### Epistemological Patterns
```
"according to [source type]"
"based on [evidence type]"
"[verification method] indicates that"
"proven by [method]"
"claimed without [qualifier]"
```

### Temporal Patterns
```
"at the time when"
"during the period of"
"in the [time unit] of"
"since the [event/date]"
"before the [era/period]"
```

### Logical Patterns
```
"if and only if"
"logically follows from"
"necessarily implies that"
"contradicts the [thing]"
"assumes that premise"
```

### Quantitative Patterns
```
"measured at exactly"
"calculated to be"
"approximately equal to"
"within the range of"
"estimated at around"
```

### Subjective Patterns
```
"I personally [verb] that"
"in my [noun] it"
"from my perspective [verb]"
"I [verb] that perhaps"
```

---

## Conclusion

These principles ensure that truth token patterns are:
1. **Semantically complete** (convey full meaning)
2. **Appropriately sized** (3-7 words ideal)
3. **Tier-specific** (match epistemological level)
4. **Unambiguous** (no false positives)
5. **Comprehensive** (cover natural language variation)

**Follow these principles for all 393 token corrections.**

---

*Pattern Design Principles v1.0 - January 30, 2026*
*"3-7 words should be identifiable as a truth token"*
