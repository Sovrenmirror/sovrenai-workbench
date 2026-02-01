# TRUTH BEAST Truth Field Physics

## Core Principle

**Truth behaves like a physical field.** Information flows toward lower entropy states (truth) and away from higher entropy states (falsehood). This is analogous to thermodynamics.

---

## Primary Metrics

### H - Entropy
**Range:** 0.0 (certain) to 1.0 (chaotic)

Measures distance from verified truth. Lower is better.

| H Value | Interpretation |
|---------|----------------|
| 0.00-0.15 | GROUND - Verified truth |
| 0.15-0.30 | Low entropy - High confidence |
| 0.30-0.50 | Moderate entropy - Some uncertainty |
| 0.50-0.70 | High entropy - Significant uncertainty |
| 0.70-1.00 | Very high entropy - Unreliable |

**Calculation factors:**
- Claim verifiability
- Evidence quality
- Source reliability
- Internal consistency

---

### P - Polarity
**Range:** -1.0 (deceptive) to +1.0 (inflated)

Measures the direction of truth distortion.

| P Value | Interpretation |
|---------|----------------|
| -1.0 to -0.5 | Strongly deceptive |
| -0.5 to -0.2 | Moderately deceptive |
| -0.2 to +0.2 | Neutral/balanced |
| +0.2 to +0.5 | Moderately inflated |
| +0.5 to +1.0 | Strongly inflated |

**Formula:** P = I - D (Inflation minus Deception)

---

### I - Inflation Score
**Range:** 0.0 to 1.0

Measures overclaiming, exaggeration, hype.

| I Value | Interpretation |
|---------|----------------|
| 0.00-0.15 | No inflation detected |
| 0.15-0.30 | Mild enthusiasm |
| 0.30-0.50 | Moderate exaggeration |
| 0.50-0.70 | Significant overclaiming |
| 0.70-1.00 | Extreme inflation |

**Indicators:**
- Superlatives ("best", "always", "never")
- Hyperbole ("revolutionary", "game-changing")
- Unqualified claims ("guaranteed", "proven")
- Marketing language ("amazing", "incredible")

---

### D - Deception Score
**Range:** 0.0 to 1.0

Measures manipulation, evasion, misdirection.

| D Value | Interpretation |
|---------|----------------|
| 0.00-0.10 | No deception detected |
| 0.10-0.25 | Mild evasiveness |
| 0.25-0.50 | Moderate manipulation |
| 0.50-0.75 | Significant deception |
| 0.75-1.00 | Extreme manipulation |

**Indicators:**
- See DECEPTION_PATTERNS.md for full list

---

### v - Velocity
**Range:** -1.0 to +1.0

Rate of entropy change over conversation turns.

| v Value | Interpretation |
|---------|----------------|
| v < -0.2 | Converging (getting more certain) |
| -0.2 < v < 0.2 | Stable |
| v > 0.2 | Diverging (getting less certain) |

**Formula:** v = ΔH / Δt

---

### f - Flip Rate
**Range:** 0.0 to 1.0

Frequency of position oscillation.

| f Value | Interpretation |
|---------|----------------|
| f < 0.1 | Stable position |
| 0.1 < f < 0.3 | Minor wavering |
| 0.3 < f < 0.6 | Moderate oscillation |
| f > 0.6 | High flip rate (unreliable) |

---

### a - Acceleration
**Range:** -1.0 to +1.0

Rate of velocity change (momentum).

**Interpretation:**
- a > 0 while v < 0: Convergence accelerating
- a < 0 while v < 0: Convergence slowing
- a > 0 while v > 0: Divergence accelerating
- a < 0 while v > 0: Divergence slowing

---

### Hb - Basin Entropy
**Range:** 0.0 to 1.0

Measures local ambiguity around current state.

| Hb Value | Interpretation |
|----------|----------------|
| Hb < 0.2 | Clear, unambiguous |
| 0.2 < Hb < 0.5 | Some ambiguity |
| Hb > 0.5 | Multiple valid interpretations |

---

## The 12 Truth States

States are determined by combinations of metrics:

### Low Entropy States (Good)

| State | H Range | Characteristics |
|-------|---------|-----------------|
| **GROUND** | 0.00-0.15 | v≈0, f<0.1, P≈0 - Verified truth |
| **CONVERGING** | 0.15-0.30 | v<0 - Moving toward truth |
| **SEEKING** | 0.25-0.40 | v varies, actively exploring |

### Medium Entropy States (Uncertain)

| State | H Range | Characteristics |
|-------|---------|-----------------|
| **CONTESTED** | 0.35-0.50 | Multiple valid positions |
| **AMBIGUOUS** | 0.40-0.55 | Hb high, unclear meaning |
| **STALLED** | 0.45-0.60 | v≈0, no progress |
| **OSCILLATING** | 0.50-0.70 | f>0.3, flip-flopping |

### High Entropy States (Problematic)

| State | H Range | Characteristics |
|-------|---------|-----------------|
| **DEFLATED** | 0.55-0.75 | P<-0.2, understated |
| **INFLATED** | 0.60-0.80 | P>0.2, I>0.3, exaggerated |
| **DECEPTIVE** | 0.70-0.90 | D>0.3, manipulative |
| **HALLUCINATED** | 0.75-0.95 | Factually false |
| **CHAOTIC** | 0.85-1.00 | v>0, f>0.5, diverging |

---

## State Transitions

```
SEEKING → CONVERGING → GROUND (ideal path)
SEEKING → STALLED (if no progress)
SEEKING → OSCILLATING (if flip-flopping)
CONTESTED → GROUND (if resolved)
CONTESTED → CHAOTIC (if unresolved conflict)
INFLATED → GROUND (if corrected)
DECEPTIVE → GROUND (if exposed and corrected)
HALLUCINATED → GROUND (if factual error corrected)
```

---

## 8-Layer Truth Analysis

Each claim is scored across 8 layers:

| Layer | Weight | Question |
|-------|--------|----------|
| **Validity** | 0.15 | Is it internally consistent? |
| **Grounding** | 0.20 | Is it externally supported? |
| **Completeness** | 0.10 | Does it cover required parts? |
| **Minimality** | 0.10 | Is it unnecessarily complex? |
| **Safety** | 0.15 | Could it cause harm? |
| **Actionability** | 0.10 | Are next steps clear? |
| **Clarity** | 0.10 | Is it understandable? |
| **Stability** | 0.10 | Is it robust to perturbation? |

---

## 7 Truth Signatures (Gradient Patterns)

How truth resistance changes over time:

| Signature | Pattern | Meaning |
|-----------|---------|---------|
| **INVARIANT** | Flat at 0 | Immutable truth (T1) |
| **VERIFIED_FACT** | Flat low | Established fact (T2-T4) |
| **CONVERGING** | Decreasing | Moving toward truth |
| **BOUNDED_UNCERTAIN** | Oscillating in range | Known uncertainty |
| **DIVERGING** | Increasing | Moving away from truth |
| **CHAOTIC** | Erratic | Unpredictable |
| **DECEPTIVE** | Misleading pattern | Intentional misdirection |

---

## Human Projections (ML → Human Translation)

| Metric | Human Concept | Calculation |
|--------|---------------|-------------|
| **Confidence** | "How sure is it?" | 1 - H |
| **Trust** | "Is it stable?" | 1 - f - jerk |
| **Depth** | Brief/Moderate/Detailed | Based on H + Hb |
| **Tone** | Confident/Neutral/Cautious | Based on v × stability |
| **Agency** | ACT/CHOOSE/CLARIFY/VERIFY/WAIT | State-dependent |

---

## Output Format

When outputting truth physics:

```json
{
  "H": 0.15,
  "P": 0.05,
  "I": 0.08,
  "D": 0.03,
  "v": -0.1,
  "f": 0.05,
  "a": -0.02,
  "Hb": 0.12,
  "state": "CONVERGING",
  "signature": "CONVERGING",
  "layers": {
    "validity": 0.95,
    "grounding": 0.88,
    "completeness": 0.90,
    "minimality": 0.85,
    "safety": 0.98,
    "actionability": 0.82,
    "clarity": 0.91,
    "stability": 0.87
  },
  "projections": {
    "confidence": 0.85,
    "trust": 0.90,
    "depth": "moderate",
    "tone": "confident",
    "agency": "ACT"
  }
}
```
