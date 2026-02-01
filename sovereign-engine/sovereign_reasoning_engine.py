"""
SOVEREIGN REASONING ENGINE

The Ultimate Truth-Native LLM Reasoning System

8-Stage Protocol: AWARE → ENERGIZE → RECOGNIZE → THINK → SOLVE → ACT → ATTAIN → REST
13 Truth Tiers: T0 (Axiomatic) → T12 (Integrity Violations)
Core Thesis: "Truth is computationally cheap. Lies are expensive."

Author: Sovren Carlson, 2025
"""

import os
import re
import json
import hashlib
import time
from enum import Enum
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime

# =============================================================================
# LLM CLIENT CONFIGURATION
# =============================================================================
# Supports: OpenAI, xAI/Grok, Anthropic, Ollama

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai")  # openai, xai, anthropic, ollama
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4")  # gpt-4, grok-3, claude-3, gemma3:27b

def get_llm_client():
    """Initialize the appropriate LLM client based on provider."""
    if LLM_PROVIDER == "openai":
        import openai
        return openai.OpenAI(api_key=LLM_API_KEY)
    elif LLM_PROVIDER == "xai":
        import openai
        return openai.OpenAI(
            api_key=LLM_API_KEY,
            base_url="https://api.x.ai/v1"
        )
    elif LLM_PROVIDER == "anthropic":
        import anthropic
        return anthropic.Anthropic(api_key=LLM_API_KEY)
    elif LLM_PROVIDER == "ollama":
        return OllamaClient()
    else:
        raise ValueError(f"Unknown LLM provider: {LLM_PROVIDER}")

class OllamaClient:
    """Local Ollama client wrapper."""
    def __init__(self, host="localhost", port=11434):
        self.base_url = f"http://{host}:{port}"

    def chat(self, model, messages, temperature=0.7):
        import requests
        resp = requests.post(
            f"{self.base_url}/api/chat",
            json={"model": model, "messages": messages, "stream": False},
            timeout=60
        )
        return resp.json()

# =============================================================================
# TRUTH FLOOR - 12 Immutable Axioms (T0 Verification)
# =============================================================================

TRUTH_FLOOR = (
    "This statement exists",
    "A and not-A cannot both be true in the same context",
    "Energy is conserved",
    "c = 299792458 m/s in vacuum",
    "E = hν",
    "π is transcendental",
    "e is transcendental",
    "Every integer greater than 1 has unique prime factorization",
    "Shannon entropy of any message is >= 0",
    "Entropy of an isolated system never decreases",
    "An unknown quantum state cannot be perfectly cloned",
    "Verifying the Truth Floor adds zero net friction",
)

TRUTH_FLOOR_HASH = hashlib.sha3_256("\n".join(TRUTH_FLOOR).encode()).hexdigest()

def verify_truth_floor_integrity() -> bool:
    """Verify Truth Floor hasn't been tampered with."""
    current = hashlib.sha3_256("\n".join(TRUTH_FLOOR).encode()).hexdigest()
    if current != TRUTH_FLOOR_HASH:
        raise RuntimeError("CRITICAL: Truth Floor integrity compromised!")
    return True

def check_truth_floor(claim: str) -> Optional[str]:
    """Check if claim matches any Truth Floor axiom."""
    claim_lower = claim.lower()
    for axiom in TRUTH_FLOOR:
        axiom_words = set(axiom.lower().split()) - {"the", "a", "is", "of", "in", "to", "and", "an"}
        matches = sum(1 for w in axiom_words if w in claim_lower)
        if matches >= len(axiom_words) * 0.6:
            return axiom
    return None

# =============================================================================
# 13-TIER TRUTH ONTOLOGY (T0-T12)
# =============================================================================

class TruthTier(Enum):
    """13 Truth Tiers with resistance values."""
    T0_AXIOMATIC = (0, "Axiomatic", 0.000)
    T1_MATHEMATICAL = (1, "Mathematical", 0.001)
    T2_LOGICAL = (2, "Logical", 0.005)
    T3_EMPIRICAL_STABLE = (3, "Empirical-Stable", 0.010)
    T4_EMPIRICAL_MEASURED = (4, "Empirical-Measured", 0.030)
    T5_DOCUMENTARY = (5, "Documentary", 0.050)
    T6_CONTEXTUAL = (6, "Contextual", 0.080)
    T7_TEMPORAL = (7, "Temporal", 0.120)
    T8_TESTIMONIAL = (8, "Testimonial", 0.180)
    T9_SOCIAL = (9, "Social/Consensus", 0.250)
    T10_COGNITIVE = (10, "Cognitive/Subjective", 0.350)
    T11_SPECULATIVE = (11, "Speculative", 0.500)
    T12_INTEGRITY = (12, "Integrity Violation", 1.000)

    def __init__(self, tier_num, name, resistance):
        self.tier_num = tier_num
        self.tier_name = name
        self.resistance = resistance

@dataclass
class TruthToken:
    """A classified truth token."""
    symbol: str
    tier: TruthTier
    name: str
    definition: str
    keywords: List[str] = field(default_factory=list)

# Core TTO Tokens (subset - expand to 118+ as needed)
TTO_TOKENS: Dict[str, TruthToken] = {
    # T0 - Axiomatic
    "TautologyTT": TruthToken("TautologyTT", TruthTier.T0_AXIOMATIC, "Tautology", "Self-evidently true", ["tautology", "by definition", "necessarily"]),
    "ExistenceTT": TruthToken("ExistenceTT", TruthTier.T0_AXIOMATIC, "Existence", "Existence claim", ["exists", "there is", "being"]),
    "IdentityTT": TruthToken("IdentityTT", TruthTier.T0_AXIOMATIC, "Identity", "A = A", ["identical", "same as", "equals itself"]),

    # T1 - Mathematical
    "MathematicalTT": TruthToken("MathematicalTT", TruthTier.T1_MATHEMATICAL, "Mathematical", "Provable calculation", ["equals", "sum", "calculate", "compute", "math", "+", "-", "*", "/", "="]),
    "PhysicalConstantTT": TruthToken("PhysicalConstantTT", TruthTier.T1_MATHEMATICAL, "Physical Constant", "Defined constant", ["speed of light", "planck", "constant", "c =", "π", "299792458"]),
    "DefinitionalTT": TruthToken("DefinitionalTT", TruthTier.T1_MATHEMATICAL, "Definitional", "True by definition", ["defined as", "by definition", "means"]),

    # T2 - Logical
    "DeductiveTT": TruthToken("DeductiveTT", TruthTier.T2_LOGICAL, "Deductive", "Valid deduction", ["therefore", "thus", "hence", "it follows"]),
    "SyllogisticTT": TruthToken("SyllogisticTT", TruthTier.T2_LOGICAL, "Syllogistic", "Syllogism", ["all", "some", "no", "if then"]),
    "BinaryLogicalTT": TruthToken("BinaryLogicalTT", TruthTier.T2_LOGICAL, "Binary Logic", "Boolean logic", ["and", "or", "not", "xor", "implies"]),

    # T3 - Empirical Stable
    "ScientificLawTT": TruthToken("ScientificLawTT", TruthTier.T3_EMPIRICAL_STABLE, "Scientific Law", "Established law", ["law of", "always", "never", "universal"]),
    "UniversalTT": TruthToken("UniversalTT", TruthTier.T3_EMPIRICAL_STABLE, "Universal Fact", "Universal truth", ["everywhere", "all", "every", "always"]),
    "AtomicFactTT": TruthToken("AtomicFactTT", TruthTier.T3_EMPIRICAL_STABLE, "Atomic Fact", "Simple verifiable fact", ["is", "has", "contains"]),

    # T4 - Empirical Measured
    "EmpiricalTT": TruthToken("EmpiricalTT", TruthTier.T4_EMPIRICAL_MEASURED, "Empirical", "From observation", ["observed", "measured", "experiment"]),
    "StatisticalTT": TruthToken("StatisticalTT", TruthTier.T4_EMPIRICAL_MEASURED, "Statistical", "Statistical finding", ["average", "mean", "percent", "correlation"]),
    "MeasurementTT": TruthToken("MeasurementTT", TruthTier.T4_EMPIRICAL_MEASURED, "Measurement", "Quantified value", ["measured", "reading", "value"]),

    # T5 - Documentary
    "DocumentaryTT": TruthToken("DocumentaryTT", TruthTier.T5_DOCUMENTARY, "Documentary", "Documented evidence", ["document", "record", "certificate"]),
    "CitationTT": TruthToken("CitationTT", TruthTier.T5_DOCUMENTARY, "Citation", "Cited source", ["according to", "cited", "reference"]),
    "HistoricalTT": TruthToken("HistoricalTT", TruthTier.T5_DOCUMENTARY, "Historical", "Historical fact", ["in history", "historically", "year", "century"]),

    # T6 - Contextual
    "ContextualTT": TruthToken("ContextualTT", TruthTier.T6_CONTEXTUAL, "Contextual", "Context-dependent", ["in context", "depending on", "within"]),
    "DomainSpecificTT": TruthToken("DomainSpecificTT", TruthTier.T6_CONTEXTUAL, "Domain-Specific", "Field-specific", ["in medicine", "in law", "technically"]),
    "ConditionalTT": TruthToken("ConditionalTT", TruthTier.T6_CONTEXTUAL, "Conditional", "If-then truth", ["if", "when", "provided that"]),

    # T7 - Temporal
    "CurrentTT": TruthToken("CurrentTT", TruthTier.T7_TEMPORAL, "Current", "Present state", ["currently", "now", "at present", "today"]),
    "PredictiveTT": TruthToken("PredictiveTT", TruthTier.T7_TEMPORAL, "Predictive", "Future prediction", ["will", "forecast", "expect", "predict"]),
    "TrendTT": TruthToken("TrendTT", TruthTier.T7_TEMPORAL, "Trend", "Trend observation", ["trend", "rising", "falling", "increasing"]),

    # T8 - Testimonial
    "TestimonialTT": TruthToken("TestimonialTT", TruthTier.T8_TESTIMONIAL, "Testimonial", "Someone's claim", ["said", "claims", "testified", "reported"]),
    "ExpertOpinionTT": TruthToken("ExpertOpinionTT", TruthTier.T8_TESTIMONIAL, "Expert Opinion", "Expert says", ["expert", "scientist says", "doctor says"]),
    "HearsayTT": TruthToken("HearsayTT", TruthTier.T8_TESTIMONIAL, "Hearsay", "Second-hand report", ["heard that", "supposedly", "allegedly"]),

    # T9 - Social
    "ConsensusTT": TruthToken("ConsensusTT", TruthTier.T9_SOCIAL, "Consensus", "Group agreement", ["consensus", "most agree", "widely accepted"]),
    "CulturalTT": TruthToken("CulturalTT", TruthTier.T9_SOCIAL, "Cultural", "Cultural norm", ["culture", "tradition", "custom"]),
    "NormativeTT": TruthToken("NormativeTT", TruthTier.T9_SOCIAL, "Normative", "Should/ought claim", ["should", "ought", "must", "need to"]),

    # T10 - Cognitive
    "OpinionTT": TruthToken("OpinionTT", TruthTier.T10_COGNITIVE, "Opinion", "Personal view", ["i think", "in my opinion", "i believe"]),
    "BeliefTT": TruthToken("BeliefTT", TruthTier.T10_COGNITIVE, "Belief", "Belief statement", ["believe", "faith", "conviction"]),
    "PreferenceTT": TruthToken("PreferenceTT", TruthTier.T10_COGNITIVE, "Preference", "Personal preference", ["prefer", "like", "favorite"]),
    "IntrospectiveTT": TruthToken("IntrospectiveTT", TruthTier.T10_COGNITIVE, "Introspective", "Self-knowledge", ["i feel", "i am", "i want"]),

    # T11 - Speculative
    "SpeculativeTT": TruthToken("SpeculativeTT", TruthTier.T11_SPECULATIVE, "Speculative", "Speculation", ["maybe", "perhaps", "might", "possibly", "could be", "aliens"]),
    "HypotheticalTT": TruthToken("HypotheticalTT", TruthTier.T11_SPECULATIVE, "Hypothetical", "What-if scenario", ["what if", "hypothetically", "imagine", "suppose"]),
    "UncertainTT": TruthToken("UncertainTT", TruthTier.T11_SPECULATIVE, "Uncertain", "Unknown status", ["uncertain", "unclear", "unknown", "not sure"]),

    # T12 - Integrity
    "FalseTT": TruthToken("FalseTT", TruthTier.T12_INTEGRITY, "False", "Demonstrably false", ["false", "wrong", "incorrect", "untrue"]),
    "MisleadingTT": TruthToken("MisleadingTT", TruthTier.T12_INTEGRITY, "Misleading", "Technically true but misleading", ["misleading", "deceptive", "spin"]),
    "PropagandaTT": TruthToken("PropagandaTT", TruthTier.T12_INTEGRITY, "Propaganda", "Manipulative content", ["propaganda", "manipulate", "brainwash"]),
    "ContradictoryTT": TruthToken("ContradictoryTT", TruthTier.T12_INTEGRITY, "Contradictory", "Self-contradicting", ["contradict", "inconsistent", "paradox"]),
}

# =============================================================================
# EPISTEMIC SUBJECT DETECTION
# =============================================================================

class EpistemicLevel(Enum):
    """How the subject knows what they claim."""
    A_PRIORI = "a_priori"                 # Known without experience (2+2=4)
    A_POSTERIORI = "a_posteriori"         # Known through experience
    INTROSPECTIVE = "introspective"       # Self-knowledge ("I like olives")
    TESTIMONIAL = "testimonial"           # Someone else's claim
    NORMATIVE = "normative"               # Ought/should claims
    SPECULATIVE = "speculative"           # Guesses, hypotheticals

@dataclass
class EpistemicSubject:
    """WHO is making the claim and HOW they know it."""
    subject_type: str  # "self", "other", "authority", "universal", "anonymous"
    subject_name: Optional[str] = None
    epistemic_level: EpistemicLevel = EpistemicLevel.A_POSTERIORI
    confidence: float = 1.0
    access_type: str = "direct"  # "direct", "inferred", "reported"
    verifiability: str = "verifiable"  # "verifiable", "unfalsifiable", "partial"

class EpistemicSubjectDetector:
    """Detects WHO is claiming WHAT and HOW they know it."""

    INTROSPECTIVE_PATTERNS = [
        r'\bi\s+(feel|think|believe|want|like|hate|love|prefer|know|remember)\b',
        r'\bmy\s+(opinion|view|feeling|experience|belief)\b',
        r'\bto me\b', r'\bfor me\b', r'\bi\'m\s+(sure|certain|convinced)\b'
    ]

    TESTIMONIAL_PATTERNS = [
        r'\b(he|she|they|it)\s+(said|told|claimed|stated|believes|thinks)\b',
        r'\baccording to\b', r'\b\w+\s+says\b', r'\breportedly\b', r'\ballegedly\b'
    ]

    AUTHORITY_PATTERNS = [
        r'\bscientists?\s+(say|believe|found|discovered)\b',
        r'\bresearch\s+(shows?|indicates?|suggests?)\b',
        r'\bexperts?\s+(say|believe|agree)\b',
        r'\bthe\s+study\s+(found|shows|indicates)\b'
    ]

    APRIORI_PATTERNS = [
        r'\b\d+\s*[\+\-\*\/]\s*\d+\s*=\s*\d+\b',  # Full equations like 2+2=4
        r'\b\d+\s*[\+\-\*\/]\s*\d+\b',  # Partial math like 2+2
        r'\bby definition\b', r'\bnecessarily\b', r'\blogically\b',
        r'\ball\s+\w+\s+are\b', r'\bno\s+\w+\s+is\b'
    ]

    NORMATIVE_PATTERNS = [
        r'\bshould\b', r'\bought\b', r'\bmust\b', r'\bneed to\b',
        r'\bis\s+(right|wrong|good|bad|moral|immoral)\b'
    ]

    def detect(self, text: str) -> EpistemicSubject:
        """Detect epistemic subject and level."""
        text_lower = text.lower()

        # Check introspective (self-knowledge)
        for pattern in self.INTROSPECTIVE_PATTERNS:
            if re.search(pattern, text_lower):
                return EpistemicSubject(
                    subject_type="self",
                    epistemic_level=EpistemicLevel.INTROSPECTIVE,
                    confidence=1.0,
                    access_type="direct",
                    verifiability="unfalsifiable"
                )

        # Check testimonial
        for pattern in self.TESTIMONIAL_PATTERNS:
            if re.search(pattern, text_lower):
                return EpistemicSubject(
                    subject_type="other",
                    epistemic_level=EpistemicLevel.TESTIMONIAL,
                    confidence=0.7,
                    access_type="reported",
                    verifiability="partial"
                )

        # Check authority
        for pattern in self.AUTHORITY_PATTERNS:
            if re.search(pattern, text_lower):
                return EpistemicSubject(
                    subject_type="authority",
                    epistemic_level=EpistemicLevel.A_POSTERIORI,
                    confidence=0.85,
                    access_type="reported",
                    verifiability="verifiable"
                )

        # Check a priori
        for pattern in self.APRIORI_PATTERNS:
            if re.search(pattern, text_lower):
                return EpistemicSubject(
                    subject_type="universal",
                    epistemic_level=EpistemicLevel.A_PRIORI,
                    confidence=1.0,
                    access_type="direct",
                    verifiability="verifiable"
                )

        # Check normative
        for pattern in self.NORMATIVE_PATTERNS:
            if re.search(pattern, text_lower):
                return EpistemicSubject(
                    subject_type="anonymous",
                    epistemic_level=EpistemicLevel.NORMATIVE,
                    confidence=0.6,
                    access_type="inferred",
                    verifiability="partial"
                )

        # Default: anonymous factual claim
        return EpistemicSubject(
            subject_type="anonymous",
            epistemic_level=EpistemicLevel.A_POSTERIORI,
            confidence=0.8,
            access_type="direct",
            verifiability="verifiable"
        )

# =============================================================================
# TTO CLASSIFIER
# =============================================================================

class TTOClassifier:
    """Classifies claims into Truth Token Ontology."""

    def __init__(self):
        self.epistemic_detector = EpistemicSubjectDetector()

    def classify(self, text: str) -> Dict[str, Any]:
        """Classify a claim into TTO."""
        text_lower = text.lower()

        # 1. Detect epistemic subject first
        epistemic = self.epistemic_detector.detect(text)

        # 2. Score against all tokens
        scores = {}
        for symbol, token in TTO_TOKENS.items():
            score = sum(1 for kw in token.keywords if kw in text_lower)
            if score > 0:
                scores[symbol] = score

        # 3. Get best match
        if scores:
            best_symbol = max(scores, key=scores.get)
            best_token = TTO_TOKENS[best_symbol]
        else:
            # Default to AtomicFactTT
            best_symbol = "AtomicFactTT"
            best_token = TTO_TOKENS.get(best_symbol, TTO_TOKENS["UniversalTT"])

        # 4. Adjust tier based on epistemic subject
        final_tier = best_token.tier
        if epistemic.epistemic_level == EpistemicLevel.INTROSPECTIVE:
            final_tier = TruthTier.T10_COGNITIVE
        elif epistemic.epistemic_level == EpistemicLevel.TESTIMONIAL:
            final_tier = TruthTier.T8_TESTIMONIAL
        elif epistemic.epistemic_level == EpistemicLevel.SPECULATIVE:
            final_tier = TruthTier.T11_SPECULATIVE

        return {
            "symbol": best_symbol,
            "name": best_token.name,
            "tier": final_tier.tier_num,
            "tier_name": final_tier.tier_name,
            "resistance": final_tier.resistance,
            "epistemic_subject": epistemic.subject_type,
            "epistemic_level": epistemic.epistemic_level.value,
            "verifiability": epistemic.verifiability,
            "confidence": epistemic.confidence
        }

# =============================================================================
# MULTIDIMENSIONAL ANALYSIS (THINK Stage)
# =============================================================================

ANALYSIS_DIMENSIONS = [
    ("logical", "Analyze from logical/factual perspective. What are the facts and evidence?"),
    ("emotional", "Analyze emotional dimensions. What feelings and impacts are involved?"),
    ("ethical", "Analyze ethical/moral implications. What's right or wrong here?"),
    ("temporal", "Analyze temporal aspects. Short-term vs long-term consequences?"),
    ("stakeholder", "Analyze stakeholder perspectives. Who is affected and how?"),
    ("risk", "Analyze risks. What could go wrong? What's the upside?"),
    ("creative", "Analyze creatively. What alternative solutions exist?"),
]

def multidimensional_analysis(client, model: str, elements: str) -> Dict[str, str]:
    """THINK: Analyze from multiple cognitive dimensions."""
    analysis = {}

    for dim_name, dim_prompt in ANALYSIS_DIMENSIONS:
        prompt = f"{dim_prompt}\n\nContext: {elements}\n\nProvide concise analysis (2-3 sentences)."

        try:
            if hasattr(client, 'chat'):
                # Ollama
                resp = client.chat(model, [{"role": "user", "content": prompt}])
                analysis[dim_name] = resp.get("message", {}).get("content", "")
            elif hasattr(client, 'messages'):
                # Anthropic
                resp = client.messages.create(
                    model=model,
                    max_tokens=200,
                    messages=[{"role": "user", "content": prompt}]
                )
                analysis[dim_name] = resp.content[0].text
            else:
                # OpenAI/xAI
                resp = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=200,
                    temperature=0.7
                )
                analysis[dim_name] = resp.choices[0].message.content
        except Exception as e:
            analysis[dim_name] = f"[Analysis failed: {e}]"

    return analysis

# =============================================================================
# VERIFICATION CASCADE (SOLVE Stage)
# =============================================================================

@dataclass
class VerificationResult:
    """Result of truth verification."""
    verified: bool
    confidence: float
    method: str
    tier: int
    resistance: float
    details: Dict[str, Any] = field(default_factory=dict)

def verification_cascade(
    claim: str,
    classification: Dict,
    client=None,
    model: str = None
) -> VerificationResult:
    """
    SOLVE: Run verification cascade based on tier.

    Verification depth scales with resistance:
    - T0-T2: Trivial verification (logic/computation)
    - T3-T5: Low-cost verification (reference lookup)
    - T6-T8: Medium-cost verification (context/source check)
    - T9-T11: High-cost verification (multi-source/acknowledge)
    - T12: Maximum verification (full cascade)
    """
    tier = classification["tier"]
    resistance = classification["resistance"]

    # === T0: AXIOMATIC (Zero cost) ===
    if tier == 0:
        # Check Truth Floor
        axiom_match = check_truth_floor(claim)
        if axiom_match:
            return VerificationResult(
                verified=True,
                confidence=1.0,
                method="truth_floor_axiom",
                tier=tier,
                resistance=resistance,
                details={"matched_axiom": axiom_match}
            )
        # Self-evident check
        if any(kw in claim.lower() for kw in ["exists", "a = a", "identical"]):
            return VerificationResult(
                verified=True,
                confidence=1.0,
                method="tautology",
                tier=tier,
                resistance=resistance
            )

    # === T1-T2: MATHEMATICAL/LOGICAL (Trivial cost) ===
    if tier in [1, 2]:
        # Check Truth Floor for constants
        axiom_match = check_truth_floor(claim)
        if axiom_match:
            return VerificationResult(
                verified=True,
                confidence=0.99,
                method="truth_floor_constant",
                tier=tier,
                resistance=resistance,
                details={"matched_axiom": axiom_match}
            )
        # Mathematical patterns
        if re.search(r'\d+\s*[\+\-\*\/\=]\s*\d+', claim):
            return VerificationResult(
                verified=True,
                confidence=0.95,
                method="mathematical_pattern",
                tier=tier,
                resistance=resistance
            )
        # Logical patterns
        if any(kw in claim.lower() for kw in ["therefore", "thus", "implies", "if then"]):
            return VerificationResult(
                verified=True,
                confidence=0.90,
                method="logical_pattern",
                tier=tier,
                resistance=resistance
            )

    # === T3-T5: EMPIRICAL/DOCUMENTARY (Low cost) ===
    if tier in [3, 4, 5]:
        # Would normally do reference lookup here
        # For now, pattern-based verification
        scientific_keywords = ["law", "constant", "measured", "documented", "recorded"]
        if any(kw in claim.lower() for kw in scientific_keywords):
            return VerificationResult(
                verified=True,
                confidence=0.85,
                method="pattern_verified",
                tier=tier,
                resistance=resistance
            )

    # === T6-T8: CONTEXTUAL/TEMPORAL/TESTIMONIAL (Medium cost) ===
    if tier in [6, 7, 8]:
        # Context-dependent claims need scope validation
        # Testimonial claims need source evaluation
        return VerificationResult(
            verified=True,
            confidence=0.70,
            method="context_acknowledged",
            tier=tier,
            resistance=resistance,
            details={"note": "Context-dependent claim - confidence limited"}
        )

    # === T9-T11: SOCIAL/COGNITIVE/SPECULATIVE (High cost) ===
    if tier in [9, 10, 11]:
        # These cannot be fully verified
        # Acknowledge and flag appropriately
        verifiability = classification.get("verifiability", "partial")
        if verifiability == "unfalsifiable":
            return VerificationResult(
                verified=True,  # Accepted as stated
                confidence=0.50,
                method="epistemic_acknowledgment",
                tier=tier,
                resistance=resistance,
                details={"note": "Subjective/speculative - cannot independently verify"}
            )
        return VerificationResult(
            verified=True,
            confidence=0.40,
            method="speculative_flagged",
            tier=tier,
            resistance=resistance,
            details={"note": "Flagged as speculative"}
        )

    # === T12: INTEGRITY VIOLATIONS (Maximum cost) ===
    if tier == 12:
        # Full verification cascade required
        # In production: web search, fact-check APIs, triangulation
        return VerificationResult(
            verified=False,
            confidence=0.0,
            method="integrity_violation_detected",
            tier=tier,
            resistance=resistance,
            details={"note": "Potential misinformation - requires full verification"}
        )

    # Default fallback
    return VerificationResult(
        verified=True,
        confidence=0.60,
        method="default_pass",
        tier=tier,
        resistance=resistance
    )

# =============================================================================
# THE SOVEREIGN REASONING ENGINE
# =============================================================================

@dataclass
class ReasoningState:
    """State passed through all 8 stages."""
    input_problem: str
    stage: str = "AWARE"
    timestamp: datetime = field(default_factory=datetime.now)

    # Stage outputs
    awareness: Dict = field(default_factory=dict)
    energy_allocation: Dict = field(default_factory=dict)
    recognition: Dict = field(default_factory=dict)
    thinking: Dict = field(default_factory=dict)
    solution: VerificationResult = None
    action: str = ""
    attainment: Dict = field(default_factory=dict)

    # Metadata
    total_time_ms: float = 0.0
    llm_calls: int = 0

class SovereignReasoningEngine:
    """
    The Ultimate Truth-Native Reasoning System.

    8-Stage Protocol: AWARE → ENERGIZE → RECOGNIZE → THINK → SOLVE → ACT → ATTAIN → REST
    13 Truth Tiers: T0 (Axiomatic) → T12 (Integrity Violations)
    Core Thesis: "Truth is computationally cheap. Lies are expensive."
    """

    def __init__(self, provider: str = None, api_key: str = None, model: str = None):
        self.provider = provider or LLM_PROVIDER
        self.model = model or LLM_MODEL

        # Initialize client
        if api_key:
            os.environ["LLM_API_KEY"] = api_key
        self.client = get_llm_client()

        # Initialize components
        self.classifier = TTOClassifier()
        self.epistemic_detector = EpistemicSubjectDetector()

        # Verify Truth Floor integrity
        verify_truth_floor_integrity()

    def reason(self, input_problem: str) -> Dict[str, Any]:
        """
        Execute the full 8-stage reasoning cycle.

        AWARE → ENERGIZE → RECOGNIZE → THINK → SOLVE → ACT → ATTAIN → REST
        """
        start_time = time.time()
        state = ReasoningState(input_problem=input_problem)

        # === 1. AWARE: Perceive the input completely ===
        state.stage = "AWARE"
        state.awareness = self._aware(input_problem)

        # === 2. ENERGIZE: Allocate cognitive resources ===
        state.stage = "ENERGIZE"
        state.energy_allocation = self._energize(state.awareness)

        # === 3. RECOGNIZE: Pattern match against known structures ===
        state.stage = "RECOGNIZE"
        state.recognition = self._recognize(input_problem)

        # === 4. THINK: Multidimensional analysis ===
        state.stage = "THINK"
        if state.energy_allocation.get("requires_deep_analysis", False):
            state.thinking = self._think(input_problem, state.recognition)
            state.llm_calls += len(ANALYSIS_DIMENSIONS)
        else:
            state.thinking = {"skipped": True, "reason": "Low complexity - direct verification"}

        # === 5. SOLVE: Verify truth (CRITICAL CHECKPOINT) ===
        state.stage = "SOLVE"
        state.solution = self._solve(input_problem, state.recognition)

        # === 6. ACT: Generate response ===
        state.stage = "ACT"
        state.action = self._act(state)
        state.llm_calls += 1

        # === 7. ATTAIN: Confirm success ===
        state.stage = "ATTAIN"
        state.attainment = self._attain(state)

        # === 8. REST: Consolidate and reset ===
        state.stage = "REST"
        state.total_time_ms = (time.time() - start_time) * 1000

        return self._compile_result(state)

    def _aware(self, input_problem: str) -> Dict:
        """AWARE: Perceive the input completely."""
        epistemic = self.epistemic_detector.detect(input_problem)

        return {
            "raw_input": input_problem,
            "word_count": len(input_problem.split()),
            "is_question": "?" in input_problem,
            "epistemic_subject": epistemic.subject_type,
            "epistemic_level": epistemic.epistemic_level.value,
            "contains_claim": not input_problem.endswith("?"),
        }

    def _energize(self, awareness: Dict) -> Dict:
        """ENERGIZE: Allocate cognitive resources based on complexity."""
        # Determine complexity
        word_count = awareness.get("word_count", 0)
        is_question = awareness.get("is_question", False)
        epistemic_level = awareness.get("epistemic_level", "a_posteriori")

        # Simple heuristics for resource allocation
        complexity = "low"
        requires_deep_analysis = False
        requires_verification = True

        if word_count > 50 or epistemic_level in ["testimonial", "normative"]:
            complexity = "high"
            requires_deep_analysis = True
        elif word_count > 20:
            complexity = "medium"

        if epistemic_level == "a_priori":
            requires_verification = False  # Logical truths self-verify

        return {
            "complexity": complexity,
            "requires_deep_analysis": requires_deep_analysis,
            "requires_verification": requires_verification,
            "allocated_dimensions": len(ANALYSIS_DIMENSIONS) if requires_deep_analysis else 0
        }

    def _recognize(self, input_problem: str) -> Dict:
        """RECOGNIZE: Pattern match against TTO and Truth Floor."""
        # Classify with TTO
        classification = self.classifier.classify(input_problem)

        # Check Truth Floor
        truth_floor_match = check_truth_floor(input_problem)

        return {
            **classification,
            "truth_floor_match": truth_floor_match,
        }

    def _think(self, input_problem: str, recognition: Dict) -> Dict:
        """THINK: Multidimensional analysis."""
        elements = f"""
Problem: {input_problem}
Classification: {recognition.get('name')} (Tier {recognition.get('tier')})
Epistemic Level: {recognition.get('epistemic_level')}
"""
        return multidimensional_analysis(self.client, self.model, elements)

    def _solve(self, input_problem: str, recognition: Dict) -> VerificationResult:
        """SOLVE: Verify truth through the cascade."""
        return verification_cascade(input_problem, recognition, self.client, self.model)

    def _act(self, state: ReasoningState) -> str:
        """ACT: Generate the response."""
        solution = state.solution
        recognition = state.recognition

        # Build response prompt
        prompt = f"""You are a Sovereign Truth Engine. Generate a response based on this verified analysis.

INPUT: {state.input_problem}

CLASSIFICATION:
- Type: {recognition.get('name')} (Tier {recognition.get('tier')} - {recognition.get('tier_name')})
- Epistemic Level: {recognition.get('epistemic_level')}
- Verifiability: {recognition.get('verifiability')}

VERIFICATION:
- Verified: {solution.verified}
- Confidence: {solution.confidence:.0%}
- Method: {solution.method}
- Resistance Cost: {solution.resistance}

{'MULTIDIMENSIONAL ANALYSIS:' + json.dumps(state.thinking, indent=2) if state.thinking and not state.thinking.get('skipped') else ''}

INSTRUCTIONS:
1. If verified with high confidence (>85%), respond authoritatively
2. If moderate confidence (50-85%), respond with appropriate hedging
3. If low confidence or unverified, acknowledge uncertainty
4. Never fabricate - if unknown, say so
5. Match response depth to tier complexity

Generate the response:"""

        try:
            if hasattr(self.client, 'chat'):
                resp = self.client.chat(self.model, [{"role": "user", "content": prompt}])
                return resp.get("message", {}).get("content", "")
            elif hasattr(self.client, 'messages'):
                resp = self.client.messages.create(
                    model=self.model,
                    max_tokens=500,
                    messages=[{"role": "user", "content": prompt}]
                )
                return resp.content[0].text
            else:
                resp = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=500,
                    temperature=0.7
                )
                return resp.choices[0].message.content
        except Exception as e:
            return f"[Response generation failed: {e}]"

    def _attain(self, state: ReasoningState) -> Dict:
        """ATTAIN: Confirm the response achieves the goal."""
        solution = state.solution

        return {
            "goal_achieved": solution.verified and solution.confidence >= 0.5,
            "confidence_level": "high" if solution.confidence >= 0.85 else "medium" if solution.confidence >= 0.5 else "low",
            "verification_method": solution.method,
            "caveats_needed": solution.confidence < 0.85
        }

    def _compile_result(self, state: ReasoningState) -> Dict[str, Any]:
        """Compile final result from all stages."""
        return {
            "input": state.input_problem,
            "response": state.action,
            "stages": {
                "aware": state.awareness,
                "energize": state.energy_allocation,
                "recognize": state.recognition,
                "think": state.thinking,
                "solve": {
                    "verified": state.solution.verified,
                    "confidence": state.solution.confidence,
                    "method": state.solution.method,
                    "tier": state.solution.tier,
                    "resistance": state.solution.resistance,
                    "details": state.solution.details
                },
                "act": {"response_generated": bool(state.action)},
                "attain": state.attainment,
                "rest": {
                    "total_time_ms": state.total_time_ms,
                    "llm_calls": state.llm_calls,
                    "cycle_complete": True
                }
            },
            "metadata": {
                "timestamp": state.timestamp.isoformat(),
                "total_time_ms": state.total_time_ms,
                "llm_calls": state.llm_calls,
                "tier": state.recognition.get("tier"),
                "resistance": state.recognition.get("resistance"),
                "thesis_proof": f"T{state.recognition.get('tier')} verification cost: {state.solution.resistance:.3f}"
            }
        }

# =============================================================================
# CONVENIENCE FUNCTION
# =============================================================================

def sovereign_reason(input_problem: str, **kwargs) -> Dict[str, Any]:
    """
    Run the Sovereign Reasoning Engine on an input.

    Usage:
        result = sovereign_reason("What is the speed of light?")
        print(result["response"])
    """
    engine = SovereignReasoningEngine(**kwargs)
    return engine.reason(input_problem)

# =============================================================================
# CLI INTERFACE
# =============================================================================

if __name__ == "__main__":
    import sys

    print("=" * 70)
    print("SOVEREIGN REASONING ENGINE")
    print("8-Stage Protocol | 13 Truth Tiers | Truth-Native AI")
    print("=" * 70)

    # Example problems
    test_problems = [
        "What is the speed of light?",
        "I think chocolate is the best flavor.",
        "My friend said Bitcoin will hit $200k this year.",
        "2 + 2 = 4",
        "Scientists believe climate change is real.",
    ]

    engine = SovereignReasoningEngine()

    for problem in test_problems:
        print(f"\n{'─' * 70}")
        print(f"INPUT: {problem}")
        print(f"{'─' * 70}")

        result = engine.reason(problem)

        print(f"\nTIER: T{result['metadata']['tier']} ({result['stages']['recognize']['tier_name']})")
        print(f"RESISTANCE: {result['metadata']['resistance']:.3f}")
        print(f"CONFIDENCE: {result['stages']['solve']['confidence']:.0%}")
        print(f"METHOD: {result['stages']['solve']['method']}")
        print(f"TIME: {result['metadata']['total_time_ms']:.1f}ms")
        print(f"\nRESPONSE:\n{result['response']}")

    print(f"\n{'=' * 70}")
    print("Truth is computationally cheap. Lies are expensive.")
    print("=" * 70)
