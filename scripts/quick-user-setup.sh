#!/bin/bash

# Quick User Setup with Proper Admission Numbers

echo "=========================================="
echo "Quick Test User Setup"
echo "=========================================="
echo ""

API_URL="http://localhost:5000/api"

# Create a user with valid admission number
echo "Creating test user with valid credentials..."
echo ""

curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test123!@#",
    "name": "Test User",
    "admissionNumber": "501/21"
  }' | jq '.'

echo ""
echo "=========================================="
echo "Important Information"
echo "=========================================="
echo ""
echo "USER CREATED:"
echo "  Email: testuser@example.com"
echo "  Password: Test123!@#"
echo "  Status: PENDING (needs approval)"
echo ""
echo "SUPER ADMINS (already exist in database):"
echo "  - futurist.raghav@gmail.com"
echo "  - mpsajmer123@gmail.com"
echo ""
echo "⚠️  PROBLEM: We don't know their passwords!"
echo ""
echo "=========================================="
echo "SOLUTION OPTIONS:"
echo "=========================================="
echo ""
echo "Option 1: Direct Database Update (Recommended)"
echo "----------------------------------------------"
echo "If you have MongoDB access, approve the test user directly:"
echo ""
echo "mongosh \"your-connection-string\""
echo "db.users.updateOne("
echo "  { email: \"testuser@example.com\" },"
echo "  { \$set: { status: \"active\" } }"
echo ")"
echo ""
echo ""
echo "Option 2: Use Backend Test Utilities"
echo "--------------------------------------"
echo "The backend might have test utility endpoints in development mode."
echo "Let's check..."
echo ""

# Try to access test utilities
TEST_UTILS=$(curl -s http://localhost:5000/api/test-utils/approve-all)
echo "Test utils response: $TEST_UTILS"

echo ""
echo "Option 3: Create New Super Admin"
echo "---------------------------------"
echo "Register with a new super admin email (if backend allows):"
echo ""
echo "Email: newsuperadmin@admin.com"
echo "Make this email a super admin email in backend config"
echo ""
echo "=========================================="
