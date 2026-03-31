#!/bin/bash

# Frontend Registration Flow Test
# This script opens the browser to test registration through the UI

echo "======================================"
echo "Frontend Registration Test"
echo "======================================"
echo ""

# Check if servers are running
echo "Checking if servers are running..."
if ! lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Frontend is NOT running on port 8080"
    echo "   Start with: npm run dev"
    exit 1
fi

if ! lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Backend is NOT running on port 5000"
    echo "   Start with: npm run backend"
    exit 1
fi

echo "✅ Frontend running on port 8080"
echo "✅ Backend running on port 5000"
echo ""

echo "Opening browser for manual testing..."
echo ""
echo "📋 Test Steps:"
echo "1. Browser will open to http://localhost:8080"
echo "2. Navigate to Register/Sign Up page"
echo "3. Fill in the form:"
echo "   - Name: Test User"
echo "   - Email: testfrontend@example.com"
echo "   - Password: Password123!"
echo "   - Confirm Password: Password123!"
echo "   - Admission Number: 501/23"
echo "4. Open Developer Tools (F12 or Cmd+Option+I)"
echo "5. Go to Network tab"
echo "6. Submit the form"
echo "7. Check the following:"
echo "   - Network request to http://localhost:5000/api/auth/register"
echo "   - Status should be 201 or 200"
echo "   - Response should have success: true"
echo "   - Toast notification should appear"
echo "   - Should redirect to login page"
echo ""
echo "Press Enter to open browser..."
read

# Open browser
open http://localhost:8080

echo ""
echo "======================================"
echo "Manual Testing in Progress"
echo "======================================"
echo ""
echo "After testing registration, try:"
echo "1. Test with duplicate email (should show error)"
echo "2. Test manual verification option"
echo "3. Try to login with registered user"
echo ""
echo "Check console logs in both terminals for any errors."
