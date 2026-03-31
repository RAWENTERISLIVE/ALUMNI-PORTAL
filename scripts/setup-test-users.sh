#!/bin/bash

# Setup Test Users Script
# Creates users with different roles for testing

echo "=========================================="
echo "Setting Up Test Users"
echo "=========================================="
echo ""

API_URL="http://localhost:5000/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "This script will create test users for development."
echo ""

# Function to create user
create_user() {
    local email=$1
    local password=$2
    local name=$3
    local admission=$4
    
    echo "Creating user: $email"
    
    RESPONSE=$(curl -s -X POST $API_URL/auth/register \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$email\",
        \"password\": \"$password\",
        \"name\": \"$name\",
        \"admissionNumber\": \"$admission\"
      }")
    
    SUCCESS=$(echo $RESPONSE | jq -r '.success')
    MESSAGE=$(echo $RESPONSE | jq -r '.message')
    
    if [ "$SUCCESS" == "true" ]; then
        echo -e "${GREEN}✓ Success: $MESSAGE${NC}"
    else
        echo -e "${RED}✗ Failed: $MESSAGE${NC}"
    fi
    echo ""
}

# Create Super Admin (will be auto-approved)
echo "=========================================="
echo "1. Creating Super Admin User"
echo "=========================================="
echo ""
echo "Email: futurist.raghav@gmail.com"
echo "Password: Admin123!@#"
echo ""

create_user "futurist.raghav@gmail.com" "Admin123!@#" "Raghav Super Admin" "501/ADMIN1"

# Create another Super Admin option
echo "=========================================="
echo "2. Creating Second Super Admin User"
echo "=========================================="
echo ""
echo "Email: mpsajmer123@gmail.com"
echo "Password: Admin123!@#"
echo ""

create_user "mpsajmer123@gmail.com" "Admin123!@#" "MP Admin" "501/ADMIN2"

# Create Regular Test Users
echo "=========================================="
echo "3. Creating Regular Test Users"
echo "=========================================="
echo ""

echo "Test User 1:"
echo "Email: test1@example.com"
echo "Password: Test123!@#"
echo ""
create_user "test1@example.com" "Test123!@#" "Test User One" "501/01"

echo "Test User 2:"
echo "Email: test2@example.com"
echo "Password: Test123!@#"
echo ""
create_user "test2@example.com" "Test123!@#" "Test User Two" "501/02"

echo "Test User 3:"
echo "Email: test3@example.com"
echo "Password: Test123!@#"
echo ""
create_user "test3@example.com" "Test123!@#" "Test User Three" "501/03"

# Test login with super admin
echo "=========================================="
echo "4. Testing Login with Super Admin"
echo "=========================================="
echo ""

LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "futurist.raghav@gmail.com",
    "password": "Admin123!@#"
  }')

LOGIN_SUCCESS=$(echo $LOGIN_RESPONSE | jq -r '.success')

if [ "$LOGIN_SUCCESS" == "true" ]; then
    echo -e "${GREEN}✓ Super Admin Login: SUCCESS${NC}"
    USER_ROLE=$(echo $LOGIN_RESPONSE | jq -r '.user.role')
    USER_STATUS=$(echo $LOGIN_RESPONSE | jq -r '.user.status')
    echo "Role: $USER_ROLE"
    echo "Status: $USER_STATUS"
    echo ""
    echo -e "${GREEN}You can now login with:${NC}"
    echo "  Email: futurist.raghav@gmail.com"
    echo "  Password: Admin123!@#"
else
    echo -e "${RED}✗ Super Admin Login: FAILED${NC}"
    ERROR_MSG=$(echo $LOGIN_RESPONSE | jq -r '.message')
    echo "Error: $ERROR_MSG"
    echo ""
    echo "Note: If super admin already exists with different password,"
    echo "      you'll need to use that password instead."
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "Created test users with the following credentials:"
echo ""
echo -e "${YELLOW}Super Admins (auto-approved, can login immediately):${NC}"
echo "1. Email: futurist.raghav@gmail.com"
echo "   Password: Admin123!@#"
echo ""
echo "2. Email: mpsajmer123@gmail.com"
echo "   Password: Admin123!@#"
echo ""
echo -e "${YELLOW}Regular Users (PENDING approval):${NC}"
echo "3. Email: test1@example.com"
echo "   Password: Test123!@#"
echo ""
echo "4. Email: test2@example.com"
echo "   Password: Test123!@#"
echo ""
echo "5. Email: test3@example.com"
echo "   Password: Test123!@#"
echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. Login as super admin in the browser:"
echo "   http://localhost:8080/login"
echo ""
echo "2. Navigate to Admin Dashboard"
echo ""
echo "3. Approve pending users (test1, test2, test3)"
echo ""
echo "4. Then you can test login with regular users"
echo ""
echo "=========================================="
