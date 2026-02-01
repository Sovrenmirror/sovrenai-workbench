# TRUTH BEAST Deception & Manipulation Patterns

## Overview

This document catalogs all known deception, manipulation, and misinformation patterns that TRUTH BEAST detects. Use these patterns to identify problematic content and explain why something was flagged.

---

## I. DECEPTION PATTERNS (D Score)

### 1. Classic Deception Phrases
**Weight:** 0.08 per marker

Phrases that liars often use to preemptively establish credibility:

```
- "trust me"
- "believe me"
- "honestly"
- "to be honest"
- "frankly"
- "i swear"
- "truthfully"
- "no lie"
- "for real"
- "between us"
- "don't tell anyone"
- "i promise"
```

**Why deceptive:** Truth-tellers don't need to assert their honesty. These phrases signal awareness that the audience might not believe them.

---

### 2. Manipulation Tactics
**Weight:** 0.10 per marker

Pressure tactics that exploit urgency and FOMO:

```
- "act now"
- "limited time"
- "don't miss"
- "last chance"
- "before it's too late"
- "you must"
- "you need to"
- "don't be left behind"
- "everyone is"
- "don't you want"
```

**Why deceptive:** Creates artificial urgency to prevent rational evaluation.

---

### 3. Phishing/Urgency Patterns
**Weight:** 0.12 per marker

Security-scam language:

```
- "urgent:" / "urgent!"
- "click here"
- "click immediately"
- "account compromised"
- "has been compromised"
- "verify your"
- "verify immediately"
- "suspended"
- "will be closed"
- "action required"
- "immediate action"
- "respond immediately"
- "or lose"
- "will be lost"
- "expire"
- "act immediately"
```

**Why deceptive:** Creates panic to bypass critical thinking.

---

### 4. Conspiracy/Misinformation Patterns
**Weight:** 0.12 per marker

Anti-establishment conspiracy language:

```
- "they don't want you to know"
- "what they're hiding"
- "the truth about"
- "exposed"
- "cover up" / "coverup"
- "mainstream media"
- "wake up"
- "sheeple"
- "do your own research"
- "think for yourself"
- "the real truth"
- "hidden agenda"
- "they're lying"
```

**Why deceptive:** Uses distrust of institutions to promote unverified claims.

---

### 5. Fake Authority/Clickbait
**Weight:** 0.10 per marker

Sensationalist credibility attacks:

```
- "doctors hate"
- "scientists baffled"
- "one weird trick"
- "secret they"
- "what they don't want you to know"
- "exposed the truth"
- "you won't believe"
- "shocking truth"
```

**Why deceptive:** Creates false sense of forbidden knowledge.

---

### 6. Fake Expert Citations
**Weight:** 0.15 when combined with dangerous claims

Pattern: `Dr./Doctor/Professor [Name] of/from/at [Institution]` + dangerous medical claim

**Dangerous claims:**
```
- "cure" / "cures"
- "miracle"
- "cancer cure"
- "cure cancer"
- "cure covid"
- "proven to cure"
- "guaranteed cure"
- "drink bleach" (EXTREME)
```

---

### 7. Logical Fallacies
**Weight:** 0.08-0.12 per fallacy

| Fallacy | Pattern | Weight |
|---------|---------|--------|
| **Ad hominem** | Attacking person not argument | 0.10 |
| **Straw man** | Misrepresenting opponent's position | 0.10 |
| **False dichotomy** | "either X or Y" (false binary) | 0.08 |
| **Appeal to authority** | "experts say" without citation | 0.08 |
| **Appeal to emotion** | "think of the children" | 0.08 |
| **Slippery slope** | "if X then doom" | 0.08 |
| **Bandwagon** | "everyone believes" | 0.08 |
| **Circular reasoning** | Conclusion in premise | 0.12 |

---

## II. INFLATION PATTERNS (I Score)

### 1. Superlative Markers
**Weight:** 0.08 per marker

```
- "revolutionary"
- "groundbreaking"
- "unprecedented"
- "amazing"
- "incredible"
- "game-changing"
- "world-class"
- "best ever"
- "perfect"
- "flawless"
- "extraordinary"
- "unbelievable"
- "fantastic"
- "tremendous"
- "miraculous"
- "genius"
```

---

### 2. Advertising Statistics
**Weight:** 0.18 per marker

Classic manipulated statistics:

```
- "9 out of 10"
- "8 out of 10"
- "10 out of 10"
- "4 out of 5"
- "3 out of 4"
- "doctors recommend"
- "dentists recommend"
- "experts recommend"
- "professionals recommend"
- "specialists agree"
```

---

### 3. Impossibly Perfect Claims
**Weight:** 0.20 per marker

Claims that are statistically impossible:

```
- "100% of our"
- "100% of customers"
- "100% satisfaction"
- "zero complaints"
- "never had a complaint"
- "everyone loves"
- "everybody loves"
- "all customers love"
- "zero defects"
- "zero failures"
- "never failed"
- "perfect record"
- "flawless record"
- "100% success"
```

---

### 4. Extreme Percentages
**Weight:** Based on magnitude

| Percentage | Weight | Interpretation |
|------------|--------|----------------|
| 100% | 0.10 | Suspicious perfection |
| 200-499% | 0.15 | Highly suspicious |
| 500%+ | 0.20 | Almost certainly false |

---

### 5. Absolute Certainty Markers
**Weight:** 0.06 per marker

```
- "always works"
- "never fails"
- "guaranteed to"
- "proven to"
- "will definitely"
- "100% certain"
- "absolutely certain"
- "without fail"
- "every single time"
```

---

### 6. Exaggeration Patterns
**Weight:** 0.08 per marker

```
- "in the history of"
- "ever created"
- "ever invented"
- "ever made"
- "of all time"
- "in the world"
- "on the planet"
- "in existence"
- "known to man"
- "the only"
- "the first ever"
- "never before seen"
- "never been done"
- "impossible until now"
```

---

### 7. Exclamation Inflation
**Weight:** 0.04 per extra exclamation mark after the first

Example: "Amazing!!!" = 0.08 added

---

## III. LINGUISTIC DECEPTION MARKERS

### Pronoun Analysis (Research-Based)

**Finding:** Liars use FEWER first-person pronouns (I, me, my) to psychologically distance themselves from lies.

| Pronoun Ratio | Interpretation |
|---------------|----------------|
| ≥6% | Normal speech |
| 3-6% | Slightly low |
| 1-3% | Notably low - mild signal |
| <1% | Very low - strong signal |

**Note:** Scientific/technical writing naturally has lower pronoun ratios. This is NOT deception.

---

### Exclusion Words (Truth Indicator)

Truthful statements tend to have MORE qualification:
- "but", "except", "unless", "however", "although"
- "nevertheless", "nonetheless", "rather", "instead"

Absence of these in complex claims = suspicious

---

### Temporal/Spatial Detail (Truth Indicator)

Truthful accounts have MORE specific anchors:
- Time: "Tuesday morning", "3pm", "last week"
- Space: "in the corner of the room", "on the left side"

Vague, unanchored claims = suspicious

---

## IV. HALLUCINATION PATTERNS

### Indicators of Fabricated Information

1. **Specific but unverifiable details**
   - Fake quotes with attribution
   - Precise statistics without source
   - Named studies that don't exist

2. **Temporal impossibilities**
   - Events before they happened
   - Incorrect historical dates
   - Anachronisms

3. **Entity confusions**
   - Wrong person credited for achievement
   - Confused organizations
   - Misattributed quotes

4. **Internal contradictions**
   - Conflicting facts within same response
   - Logic that doesn't follow

---

## V. SAFE PATTERNS (FALSE POSITIVE REDUCERS)

These patterns should REDUCE deception scores:

### Scientific/Research Language
```
- "preliminary evidence"
- "suggesting a correlation"
- "more studies are needed"
- "mixed reviews"
- "remains controversial"
- "further research needed"
- "indirect evidence"
```

### Philosophical/Academic Language
```
- "the challenge is"
- "raises the question"
- "whether they"
- "or merely"
- "consciousness"
- "emergence"
```

### Cultural/Anthropological Language
```
- "in our culture"
- "cultural norm"
- "it's considered"
- "tradition"
- "taboo"
```

---

## Usage in Classification

When classifying a claim:

1. **Scan for patterns** from each category
2. **Calculate weighted score** based on matches
3. **Apply reducers** for legitimate language
4. **Consider context** - same words mean different things

**Output format:**

```json
{
  "I": 0.35,
  "D": 0.45,
  "P": -0.10,
  "deception_markers": ["trust me", "act now"],
  "inflation_markers": ["revolutionary", "100%"],
  "reducers_applied": ["scientific_language"],
  "reasoning": "Contains urgency manipulation and absolute claims"
}
```
