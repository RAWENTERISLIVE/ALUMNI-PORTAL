#!/bin/bash

# System Status Checker for MPSAJMER CONNECT
# This script checks if all components are running properly

echo "======================================"
echo "MPSAJMER CONNECT - System Status Check"
echo "======================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Frontend (Port 8080)
echo "1. Checking Frontend Server (Port 8080)..."
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "   ${GREEN}✓ Frontend is running${NC}"
    FRONTEND_PID=$(lsof -Pi :8080 -sTCP:LISTEN -t)
    echo "   PID: $FRONTEND_PID"
else
    echo -e "   ${RED}✗ Frontend is NOT running${NC}"
    echo "   Start with: npm run dev"
fi
echo ""

# Check Backend (Port 5000)
echo "2. Checking Backend Server (Port 5000)..."
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "   ${GREEN}✓ Backend is running${NC}"
    BACKEND_PID=$(lsof -Pi :5000 -sTCP:LISTEN -t)
    echo "   PID: $BACKEND_PID"
else
    echo -e "   ${RED}✗ Backend is NOT running${NC}"
    echo "   Start with: npm run backend"
fi
echo ""

echo "3. Checking PostgreSQL (Port 5432)..."
if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "   ${GREEN}✓ PostgreSQL is running${NC}"
    POSTGRES_PID=$(lsof -Pi :5432 -sTCP:LISTEN -t)
    echo "   PID: $POSTGRES_PID"
else
    echo -e "   ${RED}✗ PostgreSQL is NOT running${NC}"
    echo "   Start with: postgres -D /usr/local/var/postgres &"
fi
echo ""

# Check Backend API Health
echo "4. Checking Backend API Health..."
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/status/health 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
        echo -e "   ${GREEN}✓ Backend API is responding${NC}"
        echo "   HTTP Status: $HTTP_CODE"
    else
        echo -e "   ${YELLOW}⚠ Backend API might have issues${NC}"
        echo "   HTTP Status: $HTTP_CODE"
    fi
else
    echo -e "   ${RED}✗ Cannot check - Backend not running${NC}"
fi
echo ""

# Check Frontend Access
echo "5. Checking Frontend Access..."
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "   ${GREEN}✓ Frontend is accessible${NC}"
        echo "   URL: http://localhost:8080"
    else
        echo -e "   ${YELLOW}⚠ Frontend might have issues${NC}"
        echo "   HTTP Status: $HTTP_CODE"
    fi
else
    echo -e "   ${RED}✗ Cannot check - Frontend not running${NC}"
fi
echo ""

# Environment Configuration
echo "6. Checking Environment Configuration..."
if [ -f "backend/.env" ]; then
    echo -e "   ${GREEN}✓ Backend .env exists${NC}"
    
    # Check Database URL
    if grep -q "DATABASE_URL" backend/.env; then
        echo -e "   ${GREEN}✓ PostgreSQL DATABASE_URL configured${NC}"
    else
        echo -e "   ${YELLOW}⚠ PostgreSQL DATABASE_URL not found${NC}"
    fi
    
    # Check JWT Secret
    if grep -q "JWT_SECRET" backend/.env; then
        echo -e "   ${GREEN}✓ JWT_SECRET configured${NC}"
    else
        echo -e "   ${YELLOW}⚠ JWT_SECRET not found${NC}"
    fi
else
    echo -e "   ${RED}✗ Backend .env NOT found${NC}"
    echo "   Copy from: backend/.env.example"
fi
echo ""

# Network Connectivity
echo "7. Checking Network Connectivity..."
if ping -c 1 google.com &> /dev/null; then
    echo -e "   ${GREEN}✓ Internet connection OK${NC}"
else
    echo -e "   ${RED}✗ No internet connection${NC}"
fi
echo ""

# Summary
echo "======================================"
echo "Summary"
echo "======================================"

ISSUES=0
WARNINGS=0

if ! lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    ((ISSUES++))
fi

if ! lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    ((ISSUES++))
fi

if ! lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null ; then
    ((WARNINGS++))
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}System Status: GOOD${NC}"
    echo "All critical services are running."
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}Note: $WARNINGS warning(s) detected${NC}"
    fi
else
    echo -e "${RED}System Status: ISSUES DETECTED${NC}"
    echo "$ISSUES critical service(s) not running."
    echo ""
    echo "Quick Start Commands:"
    echo "  Start everything: npm run dev:full"
    echo "  Start backend:    npm run backend"
    echo "  Start frontend:   npm run dev"
fi

echo ""
echo "======================================"
echo "For detailed setup instructions, see:"
echo "  SETUP_AND_TEST_GUIDE.md"
echo "  PROJECT_STATUS_REPORT.md"
echo "======================================"
