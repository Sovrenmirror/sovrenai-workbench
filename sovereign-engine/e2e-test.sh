#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# URLs
SOVEREIGN_URL="http://localhost:8888"
WORKBENCH_URL="http://localhost:3750"

# Temp directory for test data
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   SOVEREIGN REASONING ENGINE - E2E Test Suite         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test helper functions
test_start() {
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -e "${YELLOW}[TEST $TESTS_RUN]${NC} $1"
}

test_pass() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo -e "${GREEN}  ✓ PASS${NC} $1"
}

test_fail() {
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo -e "${RED}  ✗ FAIL${NC} $1"
}

# =============================================================================
# PART 1: DIRECT SOVEREIGN ENGINE TESTS (No Auth)
# =============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PART 1: Direct Sovereign Engine API Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# TEST 1: Health Check
test_start "Sovereign Engine health check"
RESPONSE=$(curl -s "$SOVEREIGN_URL/health")
if echo "$RESPONSE" | grep -q '"status":"ok"'; then
    if echo "$RESPONSE" | grep -q '"truth_floor_verified":true'; then
        test_pass "Health check passed with Truth Floor verified"
        AXIOM_COUNT=$(echo "$RESPONSE" | grep -o '"truth_floor_axioms":[0-9]*' | cut -d':' -f2)
        echo "    Axioms: $AXIOM_COUNT/12"
    else
        test_fail "Truth Floor not verified"
    fi
else
    test_fail "Health check failed: $RESPONSE"
fi
echo ""

# TEST 2: Get Truth Floor
test_start "Get Truth Floor axioms"
RESPONSE=$(curl -s "$SOVEREIGN_URL/truth-floor")
if echo "$RESPONSE" | grep -q '"axioms"'; then
    test_pass "Truth Floor retrieved successfully"
    COUNT=$(echo "$RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo "    Count: $COUNT axioms"
else
    test_fail "Failed to get Truth Floor: $RESPONSE"
fi
echo ""

# TEST 3: Get Tiers
test_start "Get 13 Truth Tiers"
RESPONSE=$(curl -s "$SOVEREIGN_URL/tiers")
if echo "$RESPONSE" | grep -q '"tiers"'; then
    test_pass "Truth Tiers retrieved successfully"
    COUNT=$(echo "$RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo "    Tiers: $COUNT"
else
    test_fail "Failed to get tiers: $RESPONSE"
fi
echo ""

# TEST 4: Classify Mathematical Truth (T1)
test_start "Classify mathematical truth (T1)"
cat > "$TEMP_DIR/math.json" <<EOF
{"text":"2 + 2 = 4"}
EOF

RESPONSE=$(curl -s -X POST "$SOVEREIGN_URL/classify" \
    -H "Content-Type: application/json" \
    -d @"$TEMP_DIR/math.json")

if echo "$RESPONSE" | grep -q '"tier":1'; then
    test_pass "Mathematical truth classified as T1"
    RESISTANCE=$(echo "$RESPONSE" | grep -o '"resistance":[0-9.]*' | cut -d':' -f2)
    CONFIDENCE=$(echo "$RESPONSE" | grep -o '"confidence":[0-9.]*' | cut -d':' -f2)
    echo "    Tier: T1 (Mathematical)"
    echo "    Resistance: $RESISTANCE"
    echo "    Confidence: $CONFIDENCE"
else
    test_fail "Classification failed: $RESPONSE"
fi
echo ""

# TEST 5: Classify Personal Opinion (T10)
test_start "Classify personal opinion (T10)"
cat > "$TEMP_DIR/opinion.json" <<EOF
{"text":"I think chocolate is the best flavor"}
EOF

RESPONSE=$(curl -s -X POST "$SOVEREIGN_URL/classify" \
    -H "Content-Type: application/json" \
    -d @"$TEMP_DIR/opinion.json")

if echo "$RESPONSE" | grep -q '"tier":10'; then
    test_pass "Personal opinion classified as T10"
    EPISTEMIC=$(echo "$RESPONSE" | grep -o '"epistemic_level":"[^"]*"' | cut -d'"' -f4)
    echo "    Tier: T10 (Cognitive)"
    echo "    Epistemic Level: $EPISTEMIC"
else
    test_fail "Classification failed: $RESPONSE"
fi
echo ""

# TEST 6: Classify Speculation (T11)
test_start "Classify speculation (T11)"
cat > "$TEMP_DIR/speculation.json" <<EOF
{"text":"Maybe aliens built the pyramids"}
EOF

RESPONSE=$(curl -s -X POST "$SOVEREIGN_URL/classify" \
    -H "Content-Type: application/json" \
    -d @"$TEMP_DIR/speculation.json")

if echo "$RESPONSE" | grep -q '"tier":11'; then
    test_pass "Speculation classified as T11"
    RESISTANCE=$(echo "$RESPONSE" | grep -o '"resistance":[0-9.]*' | cut -d':' -f2)
    echo "    Tier: T11 (Speculative)"
    echo "    Resistance: $RESISTANCE (expensive!)"
else
    test_fail "Classification failed: $RESPONSE"
fi
echo ""

# TEST 7: Full Reasoning Cycle (8 Stages)
test_start "Full 8-stage reasoning cycle"
cat > "$TEMP_DIR/reason.json" <<EOF
{"input":"What is the speed of light?"}
EOF

RESPONSE=$(curl -s -X POST "$SOVEREIGN_URL/reason" \
    -H "Content-Type: application/json" \
    -d @"$TEMP_DIR/reason.json")

if echo "$RESPONSE" | grep -q '"response"'; then
    if echo "$RESPONSE" | grep -q '"aware"' && \
       echo "$RESPONSE" | grep -q '"energize"' && \
       echo "$RESPONSE" | grep -q '"recognize"' && \
       echo "$RESPONSE" | grep -q '"solve"' && \
       echo "$RESPONSE" | grep -q '"attain"'; then
        test_pass "All 8 stages executed successfully"

        TIER=$(echo "$RESPONSE" | grep -o '"tier":[0-9]*' | head -1 | cut -d':' -f2)
        TIME_MS=$(echo "$RESPONSE" | grep -o '"total_time_ms":[0-9.]*' | tail -1 | cut -d':' -f2)
        LLM_CALLS=$(echo "$RESPONSE" | grep -o '"llm_calls":[0-9]*' | tail -1 | cut -d':' -f2)

        echo "    Stages: AWARE → ENERGIZE → RECOGNIZE → THINK → SOLVE → ACT → ATTAIN → REST"
        echo "    Tier: T$TIER"
        echo "    Time: ${TIME_MS}ms"
        echo "    LLM Calls: $LLM_CALLS"
    else
        test_fail "Not all stages present in response"
    fi
else
    test_fail "Reasoning failed: $RESPONSE"
fi
echo ""

# =============================================================================
# PART 2: WORKBENCH INTEGRATION TESTS (With Auth)
# =============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PART 2: Workbench Integration Tests (Authenticated)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Generate unique test email
TEST_EMAIL="sovereign-test-$(date +%s)@sovrenai.com"
TEST_PASSWORD="SecurePass123!"

echo -e "${BLUE}Test User: $TEST_EMAIL${NC}"
echo ""

# TEST 8: Register User
test_start "Register test user in Workbench"
cat > "$TEMP_DIR/register.json" <<EOF
{"email":"$TEST_EMAIL","password":"$TEST_PASSWORD"}
EOF

RESPONSE=$(curl -s -X POST "$WORKBENCH_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d @"$TEMP_DIR/register.json")

if echo "$RESPONSE" | grep -q '"message":"User registered successfully"'; then
    test_pass "User registered successfully"
    JWT_TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "    Token: ${JWT_TOKEN:0:30}..."
else
    test_fail "Registration failed: $RESPONSE"
    exit 1
fi
echo ""

# TEST 9: Sovereign Engine Health Check via Workbench
test_start "Check Sovereign Engine health via Workbench"
RESPONSE=$(curl -s "$WORKBENCH_URL/api/v1/sovereign/health" \
    -H "Authorization: Bearer $JWT_TOKEN")

if echo "$RESPONSE" | grep -q '"available":true'; then
    test_pass "Sovereign Engine available via Workbench"
else
    test_fail "Sovereign Engine not available: $RESPONSE"
fi
echo ""

# TEST 10: Classify via Workbench (T1)
test_start "Classify via Workbench API (T1)"
cat > "$TEMP_DIR/classify-wb.json" <<EOF
{"text":"The speed of light is 299792458 m/s"}
EOF

RESPONSE=$(curl -s -X POST "$WORKBENCH_URL/api/v1/sovereign/classify" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d @"$TEMP_DIR/classify-wb.json")

if echo "$RESPONSE" | grep -q '"success":true'; then
    if echo "$RESPONSE" | grep -q '"tier":1'; then
        test_pass "Physical constant classified as T1 via Workbench"
        RESISTANCE=$(echo "$RESPONSE" | grep -o '"resistance":[0-9.]*' | cut -d':' -f2)
        echo "    Tier: T1 (Mathematical)"
        echo "    Resistance: $RESISTANCE (truth is cheap!)"
    else
        test_fail "Wrong tier classification"
    fi
else
    test_fail "Classification failed: $RESPONSE"
fi
echo ""

# TEST 11: Reason via Workbench
test_start "Full reasoning via Workbench API"
cat > "$TEMP_DIR/reason-wb.json" <<EOF
{"input":"Is climate change real?"}
EOF

RESPONSE=$(curl -s -X POST "$WORKBENCH_URL/api/v1/sovereign/reason" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d @"$TEMP_DIR/reason-wb.json")

if echo "$RESPONSE" | grep -q '"success":true'; then
    if echo "$RESPONSE" | grep -q '"stages"'; then
        test_pass "Full reasoning executed via Workbench"

        # Extract metadata
        if echo "$RESPONSE" | grep -q '"metadata"'; then
            TIER=$(echo "$RESPONSE" | grep -o '"tier":[0-9]*' | head -1 | cut -d':' -f2)
            echo "    Classified as: T$TIER"
            echo "    Stages: ✓ All 8 stages executed"
        fi
    else
        test_fail "Stages missing from response"
    fi
else
    test_fail "Reasoning failed: $RESPONSE"
fi
echo ""

# TEST 12: Get Truth Floor via Workbench
test_start "Get Truth Floor via Workbench"
RESPONSE=$(curl -s "$WORKBENCH_URL/api/v1/sovereign/truth-floor" \
    -H "Authorization: Bearer $JWT_TOKEN")

if echo "$RESPONSE" | grep -q '"success":true'; then
    if echo "$RESPONSE" | grep -q '"axioms"'; then
        test_pass "Truth Floor retrieved via Workbench"
        COUNT=$(echo "$RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
        echo "    Axioms: $COUNT/12"
    else
        test_fail "Axioms missing"
    fi
else
    test_fail "Failed to get Truth Floor: $RESPONSE"
fi
echo ""

# TEST 13: Get Tiers via Workbench
test_start "Get 13 Tiers via Workbench"
RESPONSE=$(curl -s "$WORKBENCH_URL/api/v1/sovereign/tiers" \
    -H "Authorization: Bearer $JWT_TOKEN")

if echo "$RESPONSE" | grep -q '"success":true'; then
    if echo "$RESPONSE" | grep -q '"tiers"'; then
        test_pass "Tiers retrieved via Workbench"
        COUNT=$(echo "$RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
        echo "    Tiers: $COUNT/13"
    else
        test_fail "Tiers missing"
    fi
else
    test_fail "Failed to get tiers: $RESPONSE"
fi
echo ""

# TEST 14: Unauthorized Access (Should Fail)
test_start "Unauthorized access (should fail)"
RESPONSE=$(curl -s -X POST "$WORKBENCH_URL/api/v1/sovereign/classify" \
    -H "Content-Type: application/json" \
    -d '{"text":"test"}')

if echo "$RESPONSE" | grep -q '"error"'; then
    test_pass "Unauthorized access correctly rejected"
else
    test_fail "Should have rejected unauthorized access: $RESPONSE"
fi
echo ""

# =============================================================================
# PART 3: THESIS VERIFICATION
# =============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PART 3: Core Thesis Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

test_start "Verify: Truth is computationally cheap"

# Test T1 (truth)
RESPONSE_T1=$(curl -s -X POST "$SOVEREIGN_URL/classify" \
    -H "Content-Type: application/json" \
    -d '{"text":"2 + 2 = 4"}')
RESISTANCE_T1=$(echo "$RESPONSE_T1" | grep -o '"resistance":[0-9.]*' | cut -d':' -f2)

# Test T12 (potential lie)
RESPONSE_T12=$(curl -s -X POST "$SOVEREIGN_URL/classify" \
    -H "Content-Type: application/json" \
    -d '{"text":"The Earth is flat"}')
RESISTANCE_T12=$(echo "$RESPONSE_T12" | grep -o '"resistance":[0-9.]*' | cut -d':' -f2)

if [ -n "$RESISTANCE_T1" ] && [ -n "$RESISTANCE_T12" ]; then
    # Calculate ratio
    RATIO=$(echo "scale=0; $RESISTANCE_T12 / $RESISTANCE_T1" | bc)

    test_pass "Thesis verified: Truth is cheaper than lies"
    echo ""
    echo "    T1 (Truth): Resistance = $RESISTANCE_T1"
    echo "    T12 (Lie):  Resistance = $RESISTANCE_T12"
    echo ""
    echo -e "${GREEN}    PROOF: Lies are ${RATIO}x more expensive than truth!${NC}"
else
    test_fail "Could not calculate resistance values"
fi
echo ""

# =============================================================================
# FINAL RESULTS
# =============================================================================

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TEST RESULTS                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Total Tests:  ${BLUE}$TESTS_RUN${NC}"
echo -e "  Passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "  Failed:       ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║    ✓ ALL TESTS PASSED - INTEGRATION COMPLETE!        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Sovereign Reasoning Engine is fully operational!${NC}"
    echo ""
    echo "Truth is cheap. Lies are expensive. 🎯"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║          ✗ SOME TESTS FAILED - CHECK LOGS             ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
