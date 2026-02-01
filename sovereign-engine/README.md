# Sovereign Reasoning Engine

**The Ultimate Truth-Native LLM Reasoning System**

## Overview

The Sovereign Reasoning Engine is a Python-based reasoning system that executes an 8-stage protocol for deep truth verification and epistemic analysis. It classifies claims across 13 Truth Tiers (T0-T12) and provides comprehensive verification through a resistance-based cascade.

**Core Thesis:** *"Truth is computationally cheap. Lies are expensive."*

## Architecture

### 8-Stage Reasoning Protocol

```
AWARE → ENERGIZE → RECOGNIZE → THINK → SOLVE → ACT → ATTAIN → REST
```

1. **AWARE**: Perceive the input completely (epistemic subject detection)
2. **ENERGIZE**: Allocate cognitive resources based on complexity
3. **RECOGNIZE**: Pattern match against Truth Token Ontology (TTO)
4. **THINK**: Multidimensional analysis (logical, emotional, ethical, temporal, stakeholder, risk, creative)
5. **SOLVE**: Verify truth through resistance-based cascade
6. **ACT**: Generate response based on verified analysis
7. **ATTAIN**: Confirm goal achievement
8. **REST**: Consolidate and reset

### 13 Truth Tiers

| Tier | Name | Resistance | Description |
|------|------|------------|-------------|
| **T0** | Axiomatic | 0.000 | Self-evident axioms and tautologies |
| **T1** | Mathematical | 0.001 | Mathematical proofs and physical constants |
| **T2** | Logical | 0.005 | Logical deductions and syllogisms |
| **T3** | Empirical-Stable | 0.010 | Established scientific laws |
| **T4** | Empirical-Measured | 0.030 | Empirical measurements and statistics |
| **T5** | Documentary | 0.050 | Documentary evidence and historical records |
| **T6** | Contextual | 0.080 | Context-dependent truths |
| **T7** | Temporal | 0.120 | Time-dependent facts and predictions |
| **T8** | Testimonial | 0.180 | Testimonial evidence and reported claims |
| **T9** | Social | 0.250 | Social consensus and cultural norms |
| **T10** | Cognitive | 0.350 | Personal beliefs and subjective experiences |
| **T11** | Speculative | 0.500 | Speculation and hypothetical scenarios |
| **T12** | Integrity Violation | 1.000 | False or misleading claims |

### Truth Floor

12 immutable axioms (T0) with cryptographic integrity verification:
- "This statement exists"
- "A and not-A cannot both be true in the same context"
- "Energy is conserved"
- "c = 299792458 m/s in vacuum"
- ... and 8 more fundamental truths

## API Endpoints

### Core Reasoning

**POST /reason**
- Execute full 8-stage reasoning cycle
- Request: `{ "input": "What is the speed of light?" }`
- Returns: Complete reasoning trace with all stages

**POST /classify**
- Lightweight classification into Truth Token Ontology
- Request: `{ "text": "I think chocolate is great" }`
- Returns: Classification result (tier, confidence, epistemic level)

### Information

**GET /truth-floor**
- Get the 12 Truth Floor axioms
- Returns: List of axioms with integrity verification

**GET /tiers**
- Get 13 Truth Tiers information
- Returns: Complete tier definitions with resistance values

**GET /health**
- Health check with Truth Floor verification
- Returns: Status and integrity check result

## Usage

### Docker (Recommended)

```bash
# Start the engine
docker-compose up -d

# Check health
curl http://localhost:8888/health

# Reason about something
curl -X POST http://localhost:8888/reason \
  -H "Content-Type: application/json" \
  -d '{"input":"What is 2+2?"}'
```

### Python Direct

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export LLM_PROVIDER=openai
export LLM_API_KEY=your-api-key
export LLM_MODEL=gpt-4

# Run the API server
python api.py

# Or use directly in Python
python -c "from sovereign_reasoning_engine import sovereign_reason; \
           print(sovereign_reason('What is the speed of light?'))"
```

### From TypeScript/Workbench

```typescript
import { sovereignReason, sovereignClassify } from './services/sovereign-client';

// Full reasoning
const result = await sovereignReason("What is the speed of light?");
console.log(result.response);
console.log(`Tier: T${result.metadata.tier} (${result.stages.recognize.tier_name})`);
console.log(`Confidence: ${result.stages.solve.confidence * 100}%`);

// Quick classification
const classification = await sovereignClassify("I think chocolate is great");
console.log(classification.classification);
```

## Configuration

### Environment Variables

- `LLM_PROVIDER` - LLM provider: `openai`, `xai`, `anthropic`, `ollama` (default: `openai`)
- `LLM_API_KEY` - API key for the provider
- `LLM_MODEL` - Model to use: `gpt-4`, `grok-3`, `claude-sonnet-4-20250514`, etc. (default: `gpt-4`)
- `PORT` - API server port (default: `8888`)

### Supported LLM Providers

- **OpenAI** - GPT-4, GPT-3.5
- **xAI** - Grok-3 (via OpenAI-compatible API)
- **Anthropic** - Claude Sonnet, Opus
- **Ollama** - Local models (Gemma, Llama, etc.)

## Integration

The Sovereign Engine integrates with the SOVRENAI Workbench through:

1. **REST API** - TypeScript backend calls Python service via HTTP
2. **Docker Network** - Both services run in `sovrenai-network`
3. **Unified Endpoints** - Exposed through `/api/v1/sovereign/*` routes
4. **Authentication** - Protected by workbench JWT auth

## Examples

### Example 1: Mathematical Truth (T1)

```json
{
  "input": "2 + 2 = 4",
  "response": "This is a mathematical truth...",
  "metadata": {
    "tier": 1,
    "resistance": 0.001,
    "thesis_proof": "T1 verification cost: 0.001"
  }
}
```

### Example 2: Personal Belief (T10)

```json
{
  "input": "I think chocolate is the best flavor",
  "response": "This is a subjective personal preference...",
  "metadata": {
    "tier": 10,
    "resistance": 0.350,
    "thesis_proof": "T10 verification cost: 0.350"
  }
}
```

### Example 3: Speculation (T11)

```json
{
  "input": "Maybe aliens built the pyramids",
  "response": "This is speculative without evidence...",
  "metadata": {
    "tier": 11,
    "resistance": 0.500,
    "thesis_proof": "T11 verification cost: 0.500"
  }
}
```

## Development

```bash
# Run tests
python -m pytest tests/

# Format code
black sovereign_reasoning_engine.py api.py

# Type checking
mypy sovereign_reasoning_engine.py api.py
```

## Author

**Sovren Carlson**, 2025

Part of the SOVRENAI.AI VERITAS Truth-Grounding AI System.
