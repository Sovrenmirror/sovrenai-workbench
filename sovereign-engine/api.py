"""
Sovereign Reasoning Engine - REST API

FastAPI wrapper exposing the reasoning engine as HTTP endpoints.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uvicorn
import os

from sovereign_reasoning_engine import (
    SovereignReasoningEngine,
    sovereign_reason,
    verify_truth_floor_integrity,
    TRUTH_FLOOR
)

# Initialize FastAPI app
app = FastAPI(
    title="Sovereign Reasoning Engine API",
    description="Truth-Native LLM Reasoning System with 8-Stage Protocol and 13 Truth Tiers",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class ReasonRequest(BaseModel):
    """Request to reason about a problem."""
    input: str
    provider: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None

class ReasonResponse(BaseModel):
    """Response from reasoning engine."""
    input: str
    response: str
    stages: Dict[str, Any]
    metadata: Dict[str, Any]

class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    truth_floor_verified: bool
    truth_floor_axioms: int

# Global engine instance (lazy initialization)
_engine: Optional[SovereignReasoningEngine] = None

def get_engine() -> SovereignReasoningEngine:
    """Get or create the global engine instance."""
    global _engine
    if _engine is None:
        _engine = SovereignReasoningEngine()
    return _engine

# =============================================================================
# ENDPOINTS
# =============================================================================

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint with API info."""
    return {
        "name": "Sovereign Reasoning Engine API",
        "version": "1.0.0",
        "endpoints": {
            "POST /reason": "Execute 8-stage reasoning on input",
            "GET /health": "Health check and Truth Floor verification",
            "GET /truth-floor": "Get Truth Floor axioms",
            "GET /tiers": "Get 13 Truth Tiers information"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint with Truth Floor verification."""
    try:
        verified = verify_truth_floor_integrity()
        return HealthResponse(
            status="ok",
            truth_floor_verified=verified,
            truth_floor_axioms=len(TRUTH_FLOOR)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.get("/truth-floor")
async def get_truth_floor():
    """Get the Truth Floor axioms."""
    return {
        "axioms": list(TRUTH_FLOOR),
        "count": len(TRUTH_FLOOR),
        "integrity_verified": verify_truth_floor_integrity()
    }

@app.get("/tiers")
async def get_tiers():
    """Get information about the 13 Truth Tiers."""
    from sovereign_reasoning_engine import TruthTier

    tiers = []
    for tier in TruthTier:
        tiers.append({
            "tier": tier.tier_num,
            "name": tier.tier_name,
            "resistance": tier.resistance,
            "description": _get_tier_description(tier.tier_num)
        })

    return {
        "tiers": tiers,
        "count": len(tiers),
        "thesis": "Truth is computationally cheap. Lies are expensive."
    }

def _get_tier_description(tier_num: int) -> str:
    """Get description for a tier."""
    descriptions = {
        0: "Self-evident axioms and tautologies",
        1: "Mathematical proofs and physical constants",
        2: "Logical deductions and syllogisms",
        3: "Established scientific laws and universal facts",
        4: "Empirical measurements and statistical findings",
        5: "Documentary evidence and historical records",
        6: "Context-dependent and domain-specific truths",
        7: "Time-dependent facts and predictions",
        8: "Testimonial evidence and reported claims",
        9: "Social consensus and cultural norms",
        10: "Personal beliefs and subjective experiences",
        11: "Speculation and hypothetical scenarios",
        12: "False or misleading claims (integrity violations)"
    }
    return descriptions.get(tier_num, "Unknown tier")

@app.post("/reason", response_model=ReasonResponse)
async def reason(request: ReasonRequest):
    """
    Execute the full 8-stage reasoning cycle on an input.

    Stages: AWARE → ENERGIZE → RECOGNIZE → THINK → SOLVE → ACT → ATTAIN → REST
    """
    try:
        # Get or create engine
        if request.provider or request.api_key or request.model:
            # Create custom engine with provided parameters
            engine = SovereignReasoningEngine(
                provider=request.provider,
                api_key=request.api_key,
                model=request.model
            )
        else:
            # Use global engine
            engine = get_engine()

        # Execute reasoning
        result = engine.reason(request.input)

        return ReasonResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Reasoning failed: {str(e)}"
        )

@app.post("/classify")
async def classify_text(request: Dict[str, str]):
    """
    Classify text into Truth Token Ontology (lightweight endpoint).

    This is faster than /reason as it skips the full 8-stage cycle.
    """
    try:
        from sovereign_reasoning_engine import TTOClassifier

        text = request.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")

        classifier = TTOClassifier()
        classification = classifier.classify(text)

        return {
            "text": text,
            "classification": classification
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Classification failed: {str(e)}"
        )

# =============================================================================
# SERVER
# =============================================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8888"))
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
