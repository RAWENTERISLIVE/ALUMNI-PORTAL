#!/bin/bash

# Complete Integration Test Suite
# Tests all major features step by step

echo "=========================================="
echo "MPSAJMER CONNECT - Complete Integration Test"
echo "=========================================="
echo ""

API_URL="http://localhost:5000/api"
TEST_EMAIL="integration.test@example.com"
TEST_PASSWORD="TestPassword123!"
ACCESS_TOKEN=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to print test header
print_test() {
    echo ""
    echo -e "${BLUE}===================================================${NC}"
    echo -e "${BLUE}TEST: $1${NC}"
    echo -e "${BLUE}===================================================${NC}"
}

# Function to check test result
check_result() {
    local expected=$1
    local actual=$2
    local test_name=$3
    
    if [ "$expected" == "$actual" ]; then
        echo -e "${GREEN}✓ PASS:${NC} $test_name"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL:${NC} $test_name"
        echo "  Expected: $expected"
        echo "  Got: $actual"
        ((FAILED++))
        return 1
    fi
}

# Start tests
echo "Starting integration tests..."
echo "Backend: $API_URL"
echo ""

# ============================================
# PHASE 1: AUTHENTICATION TESTS
# ============================================
print_test "PHASE 1: Authentication & User Management"

# Test 1: Health Check
print_test "1. Health Check"
HEALTH_STATUS=$(curl -s $API_URL/status/health | jq -r '.success')
check_result "true" "$HEALTH_STATUS" "Backend health check"

# Test 2: Register New User
print_test "2. User Registration"
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"Integration Test User\",
    \"admissionNumber\": \"501/$(date +%S)\"
  }")

REGISTER_SUCCESS=$(echo $REGISTER_RESPONSE | jq -r '.success')
check_result "true" "$REGISTER_SUCCESS" "User registration"

# Test 3: Duplicate Email Validation
print_test "3. Duplicate Email Validation"
DUPLICATE_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"Duplicate User\",
    \"admissionNumber\": \"501/99\"
  }")

DUPLICATE_SUCCESS=$(echo $DUPLICATE_RESPONSE | jq -r '.success')
check_result "false" "$DUPLICATE_SUCCESS" "Duplicate email rejection"

# Test 4: Manual Verification Registration
print_test "4. Manual Verification Registration"
MANUAL_EMAIL="manual.$(date +%s)@example.com"
MANUAL_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$MANUAL_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"Manual Verification User\",
    \"needsManualVerification\": true,
    \"verificationDetails\": \"I am a 2020 graduate from Computer Science department.\",
    \"admissionYear\": \"2020\"
  }")

MANUAL_SUCCESS=$(echo $MANUAL_RESPONSE | jq -r '.success')
MANUAL_FLAG=$(echo $MANUAL_RESPONSE | jq -r '.needsManualVerification')
check_result "true" "$MANUAL_SUCCESS" "Manual verification registration"
check_result "true" "$MANUAL_FLAG" "Manual verification flag set"

# Test 5: Login with Super Admin (if password known)
print_test "5. Super Admin Login Check"
echo "Note: Skipping super admin login (password not provided)"
echo "Super admins exist: mpsajmer123@gmail.com, futurist.raghav@gmail.com"

# Test 6: Get Current User (without auth - should fail)
print_test "6. Protected Endpoint Without Auth"
NO_AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" $API_URL/auth/me)
NO_AUTH_STATUS=$(echo "$NO_AUTH_RESPONSE" | tail -n 1)
check_result "401" "$NO_AUTH_STATUS" "Unauthenticated request blocked"

echo ""
echo "=========================================="
echo "PHASE 1 SUMMARY"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

# ============================================
# PHASE 2: API ENDPOINT AVAILABILITY
# ============================================
print_test "PHASE 2: API Endpoint Availability Check"

# Test endpoints existence
ENDPOINTS=(
    "status/health:GET:200"
    "posts:GET:401"
    "jobs:GET:401"
    "events:GET:401"
    "groups:GET:401"
    "users:GET:401"
)

for endpoint in "${ENDPOINTS[@]}"; do
    IFS=':' read -r path method expected_status <<< "$endpoint"
    
    if [ "$method" == "GET" ]; then
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/$path)
        check_result "$expected_status" "$STATUS" "Endpoint /$path exists"
    fi
done

echo ""
echo "=========================================="
echo "FINAL SUMMARY"
echo "=========================================="
echo -e "${GREEN}Total Passed: $PASSED${NC}"
echo -e "${RED}Total Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${YELLOW}Some tests failed. Check logs above.${NC}"
    exit 1
fi
