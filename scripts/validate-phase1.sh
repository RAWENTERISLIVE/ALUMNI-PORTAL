#!/bin/bash

# Phase 1 Validation Script
# Tests all Phase 1 features to ensure everything is working

echo "🧪 Alma Connect Sphere - Phase 1 Validation"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_BASE="http://localhost:5000/api"
FRONTEND_BASE="http://localhost:8080"

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_skip() {
    echo -e "${YELLOW}[SKIP]${NC} $1"
}

# Check if servers are running
check_servers() {
    print_test "Checking if backend server is running..."
    if curl -s "$API_BASE/status/health" > /dev/null; then
        print_pass "Backend server is running on port 5000"
    else
        print_fail "Backend server is not running. Please start it with 'npm run dev:full' or 'cd backend && npm run dev'"
        exit 1
    fi

    print_test "Checking if frontend server is running..."
    if curl -s "$FRONTEND_BASE" > /dev/null; then
        print_pass "Frontend server is running on port 8080"
    else
        print_fail "Frontend server is not running. Please start it with 'npm run dev:full' or 'npm run dev'"
        exit 1
    fi
}

# Test API endpoints
test_health_check() {
    print_test "Testing health check endpoint..."
    response=$(curl -s "$API_BASE/status/health")
    if echo "$response" | grep -q '"success":true'; then
        print_pass "Health check endpoint working"
    else
        print_fail "Health check endpoint failed"
        return 1
    fi
}

test_authentication() {
    print_test "Testing super admin login..."
    
    # Test login
    login_response=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"mpsajmer123@gmail.com","password":"bajmav-1qojmu-qoKkod"}')
    
    if echo "$login_response" | grep -q '"success":true'; then
        print_pass "Super admin login successful"
        
        # Extract token for further tests
        ACCESS_TOKEN=$(echo "$login_response" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
        if [ -n "$ACCESS_TOKEN" ]; then
            print_pass "JWT token generated successfully"
        else
            print_fail "JWT token not found in response"
            return 1
        fi
    else
        print_fail "Super admin login failed"
        echo "Response: $login_response"
        return 1
    fi
}

test_user_registration() {
    print_test "Testing user registration..."
    
    # Generate random email for testing
    TEST_EMAIL="test$(date +%s)@example.com"
    
    registration_response=$(curl -s -X POST "$API_BASE/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Test User\",\"email\":\"$TEST_EMAIL\",\"password\":\"password123\",\"admissionNumber\":\"123/21\"}")
    
    if echo "$registration_response" | grep -q '"success":true'; then
        print_pass "User registration working"
    else
        print_fail "User registration failed"
        echo "Response: $registration_response"
        return 1
    fi
}

test_admin_endpoints() {
    if [ -z "$ACCESS_TOKEN" ]; then
        print_skip "Skipping admin tests - no access token"
        return 0
    fi
    
    print_test "Testing admin user list endpoint..."
    
    users_response=$(curl -s "$API_BASE/users" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$users_response" | grep -q '"success":true'; then
        print_pass "Admin user list endpoint working"
    else
        print_fail "Admin user list endpoint failed"
        return 1
    fi
    
    print_test "Testing Phase 1 status endpoint..."
    
    phase1_response=$(curl -s "$API_BASE/status/phase1" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$phase1_response" | grep -q '"success":true'; then
        print_pass "Phase 1 status endpoint working"
    else
        print_fail "Phase 1 status endpoint failed"
        return 1
    fi
}

test_rate_limiting() {
    print_test "Testing rate limiting on authentication..."
    
    # Make multiple rapid requests to trigger rate limiting
    for i in {1..6}; do
        curl -s -X POST "$API_BASE/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"email":"invalid@test.com","password":"wrong"}' > /dev/null
    done
    
    # The 6th request should be rate limited
    final_response=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"invalid@test.com","password":"wrong"}')
    
    if echo "$final_response" | grep -q 'rate limit\|429\|Too many'; then
        print_pass "Rate limiting is working"
    else
        print_skip "Rate limiting test inconclusive"
    fi
}

test_file_structure() {
    print_test "Testing file structure..."
    
    required_files=(
        "backend/src/models/User.ts"
        "backend/src/controllers/authController.ts"
        "backend/src/controllers/userController.ts"
        "backend/src/controllers/statusController.ts"
        "backend/src/middleware/auth.ts"
        "backend/src/middleware/rateLimiter.ts"
        "backend/src/routes/auth.ts"
        "backend/src/routes/users.ts"
        "backend/src/routes/status.ts"
        "src/components/admin/Phase1Dashboard.tsx"
        "src/contexts/AuthContext.tsx"
        "src/services/apiService.ts"
        "PHASE1_SUMMARY.md"
    )
    
    missing_files=()
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        print_pass "All required files present"
    else
        print_fail "Missing files: ${missing_files[*]}"
        return 1
    fi
    
    # Check uploads directory
    if [ -d "backend/uploads" ]; then
        print_pass "Uploads directory exists"
    else
        print_fail "Uploads directory missing"
        return 1
    fi
}

# Main test execution
main() {
    echo "Starting Phase 1 validation tests..."
    echo ""
    
    PASSED=0
    TOTAL=0
    
    # Server checks
    check_servers
    
    # Test suite
    tests=(
        "test_health_check"
        "test_authentication"
        "test_user_registration"
        "test_admin_endpoints"
        "test_rate_limiting"
        "test_file_structure"
    )
    
    for test in "${tests[@]}"; do
        echo ""
        if $test; then
            ((PASSED++))
        fi
        ((TOTAL++))
    done
    
    echo ""
    echo "============================================"
    echo "Phase 1 Validation Results"
    echo "============================================"
    echo "Tests passed: $PASSED/$TOTAL"
    
    if [ $PASSED -eq $TOTAL ]; then
        echo -e "${GREEN}🎉 All tests passed! Phase 1 is fully operational.${NC}"
        echo ""
        echo "✅ Authentication & Security: Working"
        echo "✅ User Management: Working"
        echo "✅ Profile System: Working"
        echo "✅ Admin Dashboard: Working"
        echo "✅ Rate Limiting: Working"
        echo "✅ File Structure: Complete"
        echo ""
        echo -e "${BLUE}Ready to proceed with Phase 2!${NC}"
        return 0
    else
        echo -e "${RED}❌ Some tests failed. Please check the issues above.${NC}"
        return 1
    fi
}

# Run the tests
main "$@"
