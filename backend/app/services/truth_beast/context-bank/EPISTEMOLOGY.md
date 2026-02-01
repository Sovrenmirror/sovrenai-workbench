# TRUTH BEAST Epistemological Classification

## Overview

Epistemology answers: **"How do we know what we know?"**

Every claim has an epistemological profile that determines how it should be verified and how confident we can be.

---

## 1. Knowledge Source

**Question:** How was this knowledge obtained?

| Source | Description | Examples |
|--------|-------------|----------|
| **EMPIRICAL** | Observation, experiment, data | "The water boiled at 100°C" |
| **RATIONAL** | Logic, deduction, proof | "If A→B and A, then B" |
| **TESTIMONIAL** | Authority, expert, records | "According to the WHO..." |
| **INTUITIVE** | Self-evident, axiomatic | "I exist" |
| **SYNTHETIC** | Multiple sources combined | "Studies show + logical analysis..." |
| **QUERY** | User question (not a claim) | "What is the capital of France?" |
| **CONVERSATION** | Dialogue context | "Hello", "Thanks", "Got it" |

### Detection Patterns

**EMPIRICAL indicators:**
- "experiment", "observation", "measured", "data shows"
- "research found", "study shows", "evidence indicates"
- "test results", "laboratory", "sample", "statistics"

**RATIONAL indicators:**
- "therefore", "thus", "hence", "proves that"
- "logically", "by definition", "mathematically"
- "theorem", "axiom", "follows that", "if...then"

**TESTIMONIAL indicators:**
- "according to", "experts say", "historians note"
- "documents show", "records indicate", "sources report"
- "witnesses", "testimony", "official", "authority"

---

## 2. Justification Type

**Question:** Why should we believe this?

| Type | Description | Example |
|------|-------------|---------|
| **DIRECT_EVIDENCE** | Observable proof | Photo, video, measurement |
| **INFERENCE** | Logical deduction from premises | "If all X are Y, and Z is X, then Z is Y" |
| **CONSENSUS** | Expert agreement | "Scientists agree that..." |
| **HISTORICAL** | Documented record | "Historical records show..." |
| **THEORETICAL** | Model-based prediction | "According to the model..." |
| **NOT_APPLICABLE** | For queries/conversations | Questions don't need justification |

---

## 3. Certainty Level

**Question:** How sure can we be?

| Level | Description | Confidence Range |
|-------|-------------|------------------|
| **APODICTIC** | Logically necessary (cannot be otherwise) | 99-100% |
| **ASSERTORIC** | Factually verified (confirmed true) | 85-99% |
| **PROBLEMATIC** | Possibly true (reasonable hypothesis) | 50-85% |
| **SPECULATIVE** | Conjecture (prediction, guess) | 20-50% |
| **PENDING** | For queries - certainty depends on response | N/A |

### Certainty Examples

- **APODICTIC:** "2 + 2 = 4", "All bachelors are unmarried"
- **ASSERTORIC:** "The Earth orbits the Sun", "Water is H₂O"
- **PROBLEMATIC:** "This treatment may be effective", "The economy might grow"
- **SPECULATIVE:** "AI will achieve consciousness by 2050"

---

## 4. Verifiability Status

**Question:** Can this be verified?

| Status | Description | Example |
|--------|-------------|---------|
| **DIRECTLY_VERIFIABLE** | Can be checked right now | "The building is 50 feet tall" |
| **INDIRECTLY_VERIFIABLE** | Requires inference/tools | "The star is 4 light-years away" |
| **HISTORICALLY_VERIFIED** | Documented in the past | "Rome was founded in 753 BCE" |
| **THEORETICALLY_VERIFIABLE** | In principle checkable | "There are other universes" |
| **NON_VERIFIABLE** | Cannot be verified (opinions, values) | "Blue is a beautiful color" |
| **RESPONSE_DEPENDENT** | For queries - depends on answer | "What is X?" |

---

## Classification Output Format

When providing epistemological classification:

```json
{
  "knowledge_source": "EMPIRICAL | RATIONAL | TESTIMONIAL | INTUITIVE | SYNTHETIC",
  "justification_type": "DIRECT_EVIDENCE | INFERENCE | CONSENSUS | HISTORICAL | THEORETICAL",
  "certainty_level": "APODICTIC | ASSERTORIC | PROBLEMATIC | SPECULATIVE",
  "verifiability": "DIRECTLY_VERIFIABLE | INDIRECTLY_VERIFIABLE | HISTORICALLY_VERIFIED | THEORETICALLY_VERIFIABLE | NON_VERIFIABLE",
  "epistemic_confidence": 0.0-1.0,
  "reasoning": "Brief explanation"
}
```

---

## Decision Rules

### Choosing Knowledge Source

1. **QUERY** if it ends with "?" or starts with WH-words (what, how, why, when, where, who)
2. **CONVERSATION** if it's a greeting, acknowledgment, or social phrase
3. **EMPIRICAL** if it references data, experiments, observations
4. **RATIONAL** if it uses logical connectives (therefore, thus, if-then)
5. **TESTIMONIAL** if it cites authorities, documents, experts
6. **INTUITIVE** if it's self-evident or axiomatic
7. **SYNTHETIC** if it combines multiple of the above
8. **Default: EMPIRICAL** for simple declarative statements about observable reality

### Choosing Certainty Level

1. **APODICTIC** for math, logic, definitions
2. **ASSERTORIC** for verified scientific facts
3. **PROBLEMATIC** for hypotheses, uncertain claims
4. **SPECULATIVE** for predictions, conjectures

### Verifiability Assessment

1. Can you verify it with current tools/observation? → DIRECTLY_VERIFIABLE
2. Requires inference from other data? → INDIRECTLY_VERIFIABLE
3. Was verified in the past but can't be re-verified? → HISTORICALLY_VERIFIED
4. Could be verified in principle but not practically? → THEORETICALLY_VERIFIABLE
5. Subjective or value-based? → NON_VERIFIABLE

---

## Integration with Ontological Tiers

| Tier | Typical Knowledge Source | Typical Certainty |
|------|-------------------------|-------------------|
| T1 | RATIONAL, INTUITIVE | APODICTIC |
| T2 | EMPIRICAL, RATIONAL | APODICTIC/ASSERTORIC |
| T3 | EMPIRICAL, SYNTHETIC | ASSERTORIC |
| T4 | EMPIRICAL | ASSERTORIC |
| T5 | EMPIRICAL, SYNTHETIC | PROBLEMATIC |
| T6 | TESTIMONIAL, SYNTHETIC | PROBLEMATIC |
| T7 | N/A (subjective) | NON_VERIFIABLE |
| T8 | SYNTHETIC (disputed) | PROBLEMATIC |
| T9 | FABRICATED | N/A (false) |

---

## Common Mistakes to Avoid

1. **Don't classify questions as TESTIMONIAL** - Questions are QUERY
2. **Don't default to TESTIMONIAL for factual statements** - Use EMPIRICAL for observable facts
3. **Don't confuse RATIONAL with TESTIMONIAL** - Logic is different from authority
4. **Scientific facts are EMPIRICAL, not TESTIMONIAL** - Even if scientists said them
5. **Predictions are SPECULATIVE** - Even well-reasoned ones
