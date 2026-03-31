#!/bin/bash

# Test Registration Endpoint
# This script tests the registration API endpoint

API_URL="http://localhost:5000/api"

echo "=================================="
echo "Testing User Registration API"
echo "=================================="
echo ""

# Test 1: Registration with valid admission number
echo "Test 1: Valid Registration with Admission Number"
echo "------------------------------------------------"
curl -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@example.com",
    "password": "TestPassword123!",
    "name": "Test User",
    "admissionNumber": "501/21"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "Response received"
echo ""
echo ""

# Test 2: Registration with manual verification
echo "Test 2: Registration with Manual Verification"
echo "----------------------------------------------"
curl -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manual.test@example.com",
    "password": "TestPassword123!",
    "name": "Manual Test User",
    "needsManualVerification": true,
    "verificationDetails": "I graduated in 2020 but lost my admission number. Please verify manually.",
    "admissionYear": "2020"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "Response received"
echo ""
echo ""

# Test 3: Duplicate email
echo "Test 3: Duplicate Email (Should Fail)"
echo "--------------------------------------"
curl -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@example.com",
    "password": "TestPassword123!",
    "name": "Test User Duplicate",
    "admissionNumber": "501/22"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "Response received"
echo ""
echo ""

# Test 4: Invalid admission number format
echo "Test 4: Invalid Admission Number Format"
echo "---------------------------------------"
curl -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid.format@example.com",
    "password": "TestPassword123!",
    "name": "Invalid Format User",
    "admissionNumber": "invalid-format"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "Response received"
echo ""
echo ""

# Test 5: Missing required fields
echo "Test 5: Missing Required Fields (Should Fail)"
echo "---------------------------------------------"
curl -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "incomplete@example.com",
    "password": "TestPassword123!"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "Response received"
echo ""
echo ""

echo "=================================="
echo "Test Complete!"
echo "=================================="
