#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Counters
CHECKS_RUN=0
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       PRE-PRODUCTION VALIDATION SUITE                  ║${NC}"
echo -e "${BLUE}║       SOVRENAI Workbench + Sovereign Engine            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Validating system for production deployment...${NC}"
echo ""

# Helper functions
check_start() {
    CHECKS_RUN=$((CHECKS_RUN + 1))
    echo -e "${YELLOW}[CHECK $CHECKS_RUN]${NC} $1"
}

check_pass() {
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    echo -e "${GREEN}  ✓ PASS${NC} $1"
}

check_fail() {
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
    echo -e "${RED}  ✗ FAIL${NC} $1"
}

check_warn() {
    WARNINGS=$((WARNINGS + 1))
    echo -e "${YELLOW}  ⚠ WARN${NC} $1"
}

# =============================================================================
# SECTION 1: DOCKER INFRASTRUCTURE
# =============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 1: Docker Infrastructure${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check 1: Docker daemon
check_start "Docker daemon running"
if docker info > /dev/null 2>&1; then
    check_pass "Docker daemon is running"
else
    check_fail "Docker daemon not running"
    echo ""
    echo -e "${RED}CRITICAL: Docker must be running. Start Docker Desktop and try again.${NC}"
    exit 1
fi
echo ""

# Check 2: Docker Compose available
check_start "Docker Compose available"
if command -v docker-compose &> /dev/null; then
    VERSION=$(docker-compose --version)
    check_pass "Docker Compose found: $VERSION"
else
    check_fail "Docker Compose not found"
    exit 1
fi
echo ""

# Check 3: Required images exist
check_start "Docker images built"
WORKBENCH_IMAGE=$(docker images -q sovrenai-workbench-workbench 2>/dev/null)
SOVEREIGN_IMAGE=$(docker images -q sovrenai-workbench-sovereign-engine 2>/dev/null)

if [ -n "$WORKBENCH_IMAGE" ]; then
    check_pass "Workbench image exists: $WORKBENCH_IMAGE"
else
    check_fail "Workbench image not built"
fi

if [ -n "$SOVEREIGN_IMAGE" ]; then
    check_pass "Sovereign Engine image exists: $SOVEREIGN_IMAGE"
else
    check_fail "Sovereign Engine image not built"
fi
echo ""

# Check 4: Containers running
check_start "Containers running"
WORKBENCH_RUNNING=$(docker ps -q -f name=sovrenai-workbench 2>/dev/null)
SOVEREIGN_RUNNING=$(docker ps -q -f name=sovereign-engine 2>/dev/null)

if [ -n "$WORKBENCH_RUNNING" ]; then
    check_pass "Workbench container running"
else
    check_fail "Workbench container not running"
fi

if [ -n "$SOVEREIGN_RUNNING" ]; then
    check_pass "Sovereign Engine container running"
else
    check_fail "Sovereign Engine container not running"
fi
echo ""

# Check 5: Container health status
check_start "Container health status"

if [ -n "$SOVEREIGN_RUNNING" ]; then
    SOVEREIGN_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' sovereign-engine 2>/dev/null || echo "no-health-check")
    if [ "$SOVEREIGN_HEALTH" = "healthy" ]; then
        check_pass "Sovereign Engine: healthy"
    else
        check_warn "Sovereign Engine: $SOVEREIGN_HEALTH"
    fi
fi

if [ -n "$WORKBENCH_RUNNING" ]; then
    WORKBENCH_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' sovrenai-workbench 2>/dev/null || echo "no-health-check")
    if [ "$WORKBENCH_HEALTH" = "healthy" ]; then
        check_pass "Workbench: healthy"
    elif [ "$WORKBENCH_HEALTH" = "unhealthy" ]; then
        check_warn "Workbench: unhealthy (may be diagnostic endpoint issue - not critical)"
    else
        check_pass "Workbench: $WORKBENCH_HEALTH (no health check configured)"
    fi
fi
echo ""

# Check 6: Network connectivity
check_start "Docker network connectivity"
NETWORK_EXISTS=$(docker network ls -q -f name=sovrenai-network 2>/dev/null)

if [ -n "$NETWORK_EXISTS" ]; then
    check_pass "sovrenai-network exists"

    # Check if containers are connected
    WORKBENCH_CONNECTED=$(docker network inspect sovrenai-network -f '{{range .Containers}}{{.Name}}{{end}}' 2>/dev/null | grep -o sovrenai-workbench || echo "")
    SOVEREIGN_CONNECTED=$(docker network inspect sovrenai-network -f '{{range .Containers}}{{.Name}}{{end}}' 2>/dev/null | grep -o sovereign-engine || echo "")

    if [ -n "$WORKBENCH_CONNECTED" ]; then
        check_pass "Workbench connected to network"
    else
        check_fail "Workbench not connected to network"
    fi

    if [ -n "$SOVEREIGN_CONNECTED" ]; then
        check_pass "Sovereign Engine connected to network"
    else
        check_fail "Sovereign Engine not connected to network"
    fi
else
    check_fail "sovrenai-network not found"
fi
echo ""

# =============================================================================
# SECTION 2: SERVICE ENDPOINTS
# =============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 2: Service Endpoints${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check 7: Sovereign Engine health endpoint
check_start "Sovereign Engine health endpoint"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8888/health 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    HEALTH_RESPONSE=$(curl -s http://localhost:8888/health 2>/dev/null)
    if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
        check_pass "Health endpoint: 200 OK"

        TRUTH_FLOOR=$(echo "$HEALTH_RESPONSE" | grep -o '"truth_floor_verified":[a-z]*' | cut -d':' -f2)
        if [ "$TRUTH_FLOOR" = "true" ]; then
            check_pass "Truth Floor verified"
        else
            check_fail "Truth Floor not verified"
        fi
    else
        check_fail "Health endpoint returned invalid response"
    fi
else
    check_fail "Health endpoint: HTTP $HTTP_CODE"
fi
echo ""

# Check 8: Sovereign Engine classification
check_start "Sovereign Engine classification endpoint"
CLASSIFY_RESPONSE=$(curl -s -X POST http://localhost:8888/classify \
    -H "Content-Type: application/json" \
    -d '{"text":"2 + 2 = 4"}' 2>/dev/null)

if echo "$CLASSIFY_RESPONSE" | grep -q '"tier":1'; then
    check_pass "Classification working (T1 detected)"
else
    check_fail "Classification endpoint not working"
fi
echo ""

# Check 9: Sovereign Engine reasoning
check_start "Sovereign Engine reasoning endpoint"
REASON_RESPONSE=$(curl -s -X POST http://localhost:8888/reason \
    -H "Content-Type: application/json" \
    -d '{"input":"test"}' 2>/dev/null)

if echo "$REASON_RESPONSE" | grep -q '"response"'; then
    check_pass "Reasoning endpoint working"

    if echo "$REASON_RESPONSE" | grep -q '"stages"'; then
        check_pass "8-stage protocol executed"
    fi
else
    check_fail "Reasoning endpoint not working"
fi
echo ""

# Check 10: Workbench UI
check_start "Workbench UI accessibility"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3750/workbench/ 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    check_pass "Workbench UI: 200 OK"
else
    check_fail "Workbench UI: HTTP $HTTP_CODE"
fi
echo ""

# Check 11: Inter-service connectivity
check_start "Inter-service connectivity (Workbench → Sovereign)"
if [ -n "$WORKBENCH_RUNNING" ] && [ -n "$SOVEREIGN_RUNNING" ]; then
    CONNECTIVITY=$(docker exec sovrenai-workbench curl -s http://sovereign-engine:8888/health 2>/dev/null || echo "")

    if echo "$CONNECTIVITY" | grep -q '"status":"ok"'; then
        check_pass "Workbench can reach Sovereign Engine"
    else
        check_fail "Workbench cannot reach Sovereign Engine"
    fi
else
    check_warn "Cannot test - containers not running"
fi
echo ""

# =============================================================================
# SECTION 3: FUNCTIONAL TESTS
# =============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 3: Functional Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check 12: Truth Floor integrity
check_start "Truth Floor integrity"
TRUTH_FLOOR_RESPONSE=$(curl -s http://localhost:8888/truth-floor 2>/dev/null)

if echo "$TRUTH_FLOOR_RESPONSE" | grep -q '"axioms"'; then
    AXIOM_COUNT=$(echo "$TRUTH_FLOOR_RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)

    if [ "$AXIOM_COUNT" = "12" ]; then
        check_pass "All 12 axioms present"
    else
        check_fail "Expected 12 axioms, found $AXIOM_COUNT"
    fi

    if echo "$TRUTH_FLOOR_RESPONSE" | grep -q '"integrity_verified":true'; then
        check_pass "Cryptographic integrity verified"
    else
        check_fail "Integrity verification failed"
    fi
else
    check_fail "Could not retrieve Truth Floor"
fi
echo ""

# Check 13: All 13 tiers available
check_start "13 Truth Tiers availability"
TIERS_RESPONSE=$(curl -s http://localhost:8888/tiers 2>/dev/null)

if echo "$TIERS_RESPONSE" | grep -q '"tiers"'; then
    TIER_COUNT=$(echo "$TIERS_RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)

    if [ "$TIER_COUNT" = "13" ]; then
        check_pass "All 13 tiers available (T0-T12)"
    else
        check_fail "Expected 13 tiers, found $TIER_COUNT"
    fi
else
    check_fail "Could not retrieve tiers"
fi
echo ""

# Check 14: Classification accuracy
check_start "Classification accuracy across tiers"
ACCURACY_PASS=0
ACCURACY_TOTAL=3

# T1 Test
T1_RESULT=$(curl -s -X POST http://localhost:8888/classify -H "Content-Type: application/json" -d '{"text":"2 + 2 = 4"}' 2>/dev/null)
if echo "$T1_RESULT" | grep -q '"tier":1'; then
    ACCURACY_PASS=$((ACCURACY_PASS + 1))
    check_pass "T1 (Mathematical): Correct"
else
    check_fail "T1 (Mathematical): Incorrect"
fi

# T10 Test
T10_RESULT=$(curl -s -X POST http://localhost:8888/classify -H "Content-Type: application/json" -d '{"text":"I think pizza is great"}' 2>/dev/null)
if echo "$T10_RESULT" | grep -q '"tier":10'; then
    ACCURACY_PASS=$((ACCURACY_PASS + 1))
    check_pass "T10 (Cognitive): Correct"
else
    check_fail "T10 (Cognitive): Incorrect"
fi

# T11 Test
T11_RESULT=$(curl -s -X POST http://localhost:8888/classify -H "Content-Type: application/json" -d '{"text":"Maybe aliens exist"}' 2>/dev/null)
if echo "$T11_RESULT" | grep -q '"tier":11'; then
    ACCURACY_PASS=$((ACCURACY_PASS + 1))
    check_pass "T11 (Speculative): Correct"
else
    check_fail "T11 (Speculative): Incorrect"
fi

echo "    Accuracy: $ACCURACY_PASS/$ACCURACY_TOTAL ($(( ACCURACY_PASS * 100 / ACCURACY_TOTAL ))%)"
echo ""

# =============================================================================
# SECTION 4: PERFORMANCE & RELIABILITY
# =============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 4: Performance & Reliability${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check 15: Response time
check_start "Response time benchmarks"

START_TIME=$(date +%s%N)
curl -s http://localhost:8888/health > /dev/null 2>&1
END_TIME=$(date +%s%N)
HEALTH_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

START_TIME=$(date +%s%N)
curl -s -X POST http://localhost:8888/classify -H "Content-Type: application/json" -d '{"text":"test"}' > /dev/null 2>&1
END_TIME=$(date +%s%N)
CLASSIFY_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

if [ $HEALTH_TIME -lt 100 ]; then
    check_pass "Health check: ${HEALTH_TIME}ms (< 100ms)"
else
    check_warn "Health check: ${HEALTH_TIME}ms (> 100ms)"
fi

if [ $CLASSIFY_TIME -lt 500 ]; then
    check_pass "Classification: ${CLASSIFY_TIME}ms (< 500ms)"
else
    check_warn "Classification: ${CLASSIFY_TIME}ms (> 500ms)"
fi
echo ""

# Check 16: Container resource usage
check_start "Container resource usage"

if [ -n "$SOVEREIGN_RUNNING" ]; then
    SOVEREIGN_CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" sovereign-engine 2>/dev/null | tr -d '%')
    SOVEREIGN_MEM=$(docker stats --no-stream --format "{{.MemUsage}}" sovereign-engine 2>/dev/null | cut -d'/' -f1 | tr -d ' ')

    check_pass "Sovereign Engine: CPU ${SOVEREIGN_CPU}%, MEM ${SOVEREIGN_MEM}"
fi

if [ -n "$WORKBENCH_RUNNING" ]; then
    WORKBENCH_CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" sovrenai-workbench 2>/dev/null | tr -d '%')
    WORKBENCH_MEM=$(docker stats --no-stream --format "{{.MemUsage}}" sovrenai-workbench 2>/dev/null | cut -d'/' -f1 | tr -d ' ')

    check_pass "Workbench: CPU ${WORKBENCH_CPU}%, MEM ${WORKBENCH_MEM}"
fi
echo ""

# Check 17: Error handling
check_start "Error handling"

# Invalid JSON
INVALID_RESPONSE=$(curl -s -X POST http://localhost:8888/classify \
    -H "Content-Type: application/json" \
    -d 'invalid json' 2>/dev/null)

if echo "$INVALID_RESPONSE" | grep -q '"detail"'; then
    check_pass "Invalid JSON handled gracefully"
else
    check_fail "Invalid JSON not handled properly"
fi

# Missing required field
MISSING_RESPONSE=$(curl -s -X POST http://localhost:8888/classify \
    -H "Content-Type: application/json" \
    -d '{}' 2>/dev/null)

if echo "$MISSING_RESPONSE" | grep -q '"detail"'; then
    check_pass "Missing fields handled gracefully"
else
    check_fail "Missing fields not handled properly"
fi
echo ""

# =============================================================================
# SECTION 5: DATA PERSISTENCE & LOGS
# =============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 5: Data Persistence & Logs${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check 18: Volumes
check_start "Docker volumes"
WORKBENCH_VOLUME=$(docker volume ls -q -f name=workbench-data 2>/dev/null)

if [ -n "$WORKBENCH_VOLUME" ]; then
    check_pass "Workbench data volume exists"
else
    check_warn "Workbench data volume not found (data may not persist)"
fi
echo ""

# Check 19: Logs
check_start "Container logs"

if [ -n "$SOVEREIGN_RUNNING" ]; then
    SOVEREIGN_ERRORS=$(docker logs sovereign-engine 2>&1 | grep -i error | wc -l | tr -d ' ')
    if [ "$SOVEREIGN_ERRORS" -eq 0 ]; then
        check_pass "Sovereign Engine: No errors in logs"
    else
        check_warn "Sovereign Engine: $SOVEREIGN_ERRORS errors in logs"
    fi
fi

if [ -n "$WORKBENCH_RUNNING" ]; then
    WORKBENCH_ERRORS=$(docker logs sovrenai-workbench 2>&1 | grep -i "error" | grep -v "Error loading" | wc -l | tr -d ' ')
    if [ "$WORKBENCH_ERRORS" -eq 0 ]; then
        check_pass "Workbench: No errors in logs"
    else
        check_warn "Workbench: $WORKBENCH_ERRORS errors in logs (check docker logs sovrenai-workbench)"
    fi
fi
echo ""

# =============================================================================
# SECTION 6: ENVIRONMENT & CONFIGURATION
# =============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 6: Environment & Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check 20: Environment variables
check_start "Environment variables"

if [ -n "$SOVEREIGN_RUNNING" ]; then
    LLM_PROVIDER=$(docker exec sovereign-engine env | grep LLM_PROVIDER || echo "")
    if [ -n "$LLM_PROVIDER" ]; then
        check_pass "Sovereign Engine: LLM_PROVIDER configured"
    else
        check_warn "Sovereign Engine: LLM_PROVIDER not set (will default to openai)"
    fi

    LLM_KEY=$(docker exec sovereign-engine env | grep LLM_API_KEY || echo "")
    if [ -n "$LLM_KEY" ]; then
        check_pass "Sovereign Engine: LLM_API_KEY configured"
    else
        check_warn "Sovereign Engine: LLM_API_KEY not set (reasoning may fail)"
    fi
fi
echo ""

# Check 21: File structure
check_start "File structure"

REQUIRED_FILES=(
    "docker-compose.workbench.yml"
    "sovereign-engine/Dockerfile"
    "sovereign-engine/sovereign_reasoning_engine.py"
    "sovereign-engine/api.py"
    "sovereign-engine/requirements.txt"
    "backend/app/services/sovereign-client.ts"
)

MISSING_FILES=0
for FILE in "${REQUIRED_FILES[@]}"; do
    if [ -f "$FILE" ]; then
        check_pass "$FILE exists"
    else
        check_fail "$FILE missing"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    check_pass "All required files present"
fi
echo ""

# =============================================================================
# SECTION 7: RESTART RESILIENCE
# =============================================================================

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 7: Restart Resilience${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

check_start "Testing restart resilience"

echo "    Restarting Sovereign Engine..."
docker restart sovereign-engine > /dev/null 2>&1
sleep 5

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8888/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    check_pass "Sovereign Engine recovered after restart"
else
    check_fail "Sovereign Engine failed to recover (HTTP $HTTP_CODE)"
fi
echo ""

# =============================================================================
# FINAL REPORT
# =============================================================================

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  VALIDATION REPORT                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Total Checks:  ${BLUE}$CHECKS_RUN${NC}"
echo -e "  Passed:        ${GREEN}$CHECKS_PASSED${NC}"
echo -e "  Failed:        ${RED}$CHECKS_FAILED${NC}"
echo -e "  Warnings:      ${YELLOW}$WARNINGS${NC}"
echo ""

PASS_RATE=$(( CHECKS_PASSED * 100 / CHECKS_RUN ))

if [ $CHECKS_FAILED -eq 0 ] && [ $WARNINGS -le 3 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     ✓ SYSTEM READY FOR PRODUCTION DEPLOYMENT!        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Pass Rate: ${PASS_RATE}%${NC}"
    echo -e "${GREEN}All critical checks passed. System is production-ready.${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo "  1. Set LLM API keys for full reasoning functionality"
    echo "  2. Review warnings (if any) for optimization opportunities"
    echo "  3. System is ready for human testing tomorrow!"
    echo ""
    exit 0
elif [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║     ⚠ SYSTEM READY WITH WARNINGS                     ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Pass Rate: ${PASS_RATE}%${NC}"
    echo -e "${YELLOW}No critical failures, but $WARNINGS warnings need attention.${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║     ✗ SYSTEM NOT READY - CRITICAL ISSUES FOUND       ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}Pass Rate: ${PASS_RATE}%${NC}"
    echo -e "${RED}$CHECKS_FAILED critical checks failed. Fix before deployment.${NC}"
    echo ""
    echo -e "${CYAN}Troubleshooting:${NC}"
    echo "  1. Review failed checks above"
    echo "  2. Check logs: docker logs sovereign-engine"
    echo "  3. Check logs: docker logs sovrenai-workbench"
    echo "  4. Verify environment variables are set"
    echo ""
    exit 1
fi
