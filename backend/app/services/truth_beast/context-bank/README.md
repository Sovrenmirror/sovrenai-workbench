# Truth Beast Context Bank

These files provide context to the LLM for accurate tier classification and truth verification.

## Files

### SYSTEM_IDENTITY.md (3.3 KB)
**Purpose:** Defines the LLM's role and identity as Truth Beast's intelligence layer.

**Contains:**
- System role and mission
- 12 truth states (GROUND, SEEKING, HALLUCINATED, etc.)
- Behavioral principles
- Response format
- What the LLM should/shouldn't do

**Used in:** All tasks

---

### ONTOLOGY.md (4.9 KB)
**Purpose:** The 9-tier classification system (T1-T9).

**Contains:**
- Complete tier definitions (T1: Universal → T9: Garbage)
- Resistance values per tier
- Examples for each tier
- Keywords for pattern matching
- Classification rules
- Output format

**Used in:** All classification tasks

---

### EPISTEMOLOGY.md (6.1 KB)
**Purpose:** Knowledge source classification and justification types.

**Contains:**
- Knowledge sources (observation, authority, reasoning, etc.)
- Justification types (empirical, analytical, testimonial, etc.)
- Certainty levels
- Verifiability criteria
- Epistemic confidence scoring

**Used in:** Full classification, verification tasks

---

### TRUTH_PHYSICS.md (6.7 KB)
**Purpose:** The physics-based truth model (E = ΔH - T×ΔS).

**Contains:**
- Gibbs Free Energy formula explanation
- Stability (ΔH) calculation
- Entropy (ΔS) calculation
- Energy (E) scoring
- Polarity model (I - D)
- Tier resistance physics
- State transitions

**Used in:** Full analysis, generation tasks

---

### DECEPTION_PATTERNS.md (7.9 KB)
**Purpose:** Manipulation and deception detection patterns.

**Contains:**
- Deception markers (inflation, deflation)
- Manipulation tactics (clickbait, gaslighting, etc.)
- Red flags for T9-T12 content
- Detection strategies
- Risk levels

**Used in:** Deception detection, T9+ classification

---

## Usage

```typescript
import { loadContextForTask } from '../context-loader.js';

// For tier classification
const context = loadContextForTask('classify');
// Returns: SYSTEM_IDENTITY.md + ONTOLOGY.md

// For full analysis
const fullContext = loadContextForTask('full_analysis');
// Returns: All 5 files
```

## Task-Specific Loading

| Task | Files Loaded |
|------|-------------|
| `classify` | SYSTEM_IDENTITY + ONTOLOGY |
| `classify_full` | SYSTEM_IDENTITY + ONTOLOGY + EPISTEMOLOGY |
| `verify` | SYSTEM_IDENTITY + ONTOLOGY + EPISTEMOLOGY |
| `deception` | SYSTEM_IDENTITY + DECEPTION_PATTERNS |
| `full_analysis` | All 5 files |
| `generate` | SYSTEM_IDENTITY + ONTOLOGY + TRUTH_PHYSICS |

---

## Source

Extracted from: `/Users/toby_carlson/Desktop/TRUTH_BEAST/context_bank/`
Date: January 29, 2026

**These files are the authoritative source of truth for Truth Beast classification.**
