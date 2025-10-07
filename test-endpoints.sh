#!/bin/bash

# Alumni Portal API Testing Script
echo "🚀 Testing Alumni Portal API Endpoints..."

BASE_URL="http://localhost:5000/api"
TOKEN=""

# Test 1: Health Check
echo "1. Testing Health Check..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
echo "Health: $HEALTH_RESPONSE"

# Test 2: Login with Super Admin
echo "2. Testing Super Admin Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "mpsajmer123@gmail.com", "password": "bajmav-1qojmu-qoKkod"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "Login Response: $LOGIN_RESPONSE"
echo "Extracted Token: ${TOKEN:0:50}..."

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed - no token received"
  exit 1
fi

# Test 3: Get User Profile
echo "3. Testing User Profile..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/users/me" \
  -H "Authorization: Bearer $TOKEN")
echo "Profile: $PROFILE_RESPONSE"

# Test 4: Get Posts
echo "4. Testing Posts..."
POSTS_RESPONSE=$(curl -s -X GET "$BASE_URL/posts" \
  -H "Authorization: Bearer $TOKEN")
echo "Posts: ${POSTS_RESPONSE:0:200}..."

# Test 5: Get Jobs
echo "5. Testing Jobs..."
JOBS_RESPONSE=$(curl -s -X GET "$BASE_URL/jobs" \
  -H "Authorization: Bearer $TOKEN")
echo "Jobs: $JOBS_RESPONSE"

# Test 6: Get Alumni Directory
echo "6. Testing Alumni Directory..."
DIRECTORY_RESPONSE=$(curl -s -X GET "$BASE_URL/users/directory" \
  -H "Authorization: Bearer $TOKEN")
echo "Directory: ${DIRECTORY_RESPONSE:0:200}..."

# Test 7: Get User Stats (Admin only)
echo "7. Testing User Stats..."
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/users/stats" \
  -H "Authorization: Bearer $TOKEN")
echo "Stats: $STATS_RESPONSE"

echo "✅ API Testing Complete!"
