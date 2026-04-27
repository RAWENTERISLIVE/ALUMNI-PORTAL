#!/bin/bash

# Production Build Script
# Creates optimized production builds for both frontend and backend

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  MPSAJMER CONNECT - Production Build  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if running from correct directory
if [ ! -f "Makefile" ]; then
    echo -e "${RED}❌ Error: Makefile not found. Run from project root.${NC}"
    exit 1
fi

# Start build
echo -e "${YELLOW}Starting production build process...${NC}"
echo ""

# Step 1: Clean
echo -e "${BLUE}[1/4]${NC} Cleaning build artifacts..."
make clean
echo -e "${GREEN}✓ Cleaned${NC}"
echo ""

# Step 2: Build frontend
echo -e "${BLUE}[2/4]${NC} Building frontend..."
npm run build
FRONTEND_SIZE=$(du -sh "dist" | cut -f1)
echo -e "${GREEN}✓ Frontend built (${FRONTEND_SIZE})${NC}"
echo ""

# Step 3: Build backend
echo -e "${BLUE}[3/4]${NC} Building backend..."
cd backend
npm run build
BACKEND_SIZE=$(du -sh "dist" | cut -f1)
cd ..
echo -e "${GREEN}✓ Backend built (${BACKEND_SIZE})${NC}"
echo ""

# Step 4: Summary
echo -e "${BLUE}[4/4]${NC} Build Summary"
echo ""
echo -e "${GREEN}✅ Production build complete!${NC}"
echo ""
echo -e "${BLUE}Build Artifacts:${NC}"
echo "  Frontend: ./dist (${FRONTEND_SIZE})"
echo "  Backend:  ./backend/dist (${BACKEND_SIZE})"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Run: make db-migrate              # Update database"
echo "  2. Run: make start                   # Start production"
echo "  3. Open: http://localhost:8080"
echo ""
echo -e "${YELLOW}For Docker:${NC}"
echo "  docker build -t mpsajmer-connect:latest ."
echo "  docker-compose -f docker-compose.full.yml up -d"
echo ""
