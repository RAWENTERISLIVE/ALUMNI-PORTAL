#!/bin/bash

# Environment Setup Helper
# Helps generate secure environment files

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Alumni Portal - Env Setup Helper   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Function to generate a random string
generate_secret() {
    openssl rand -base64 32
}

# Check if .env exists
if [ -f ".env" ] && [ -f "backend/.env" ]; then
    echo -e "${YELLOW}Environment files already exist.${NC}"
    read -p "Overwrite? (y/N): " CONFIRM
    if [ "$CONFIRM" != "y" ]; then
        echo "Operation cancelled"
        exit 0
    fi
fi

# Collect information
echo -e "${BLUE}Frontend Configuration:${NC}"
read -p "  API URL [http://localhost:5000/api]: " API_URL
API_URL=${API_URL:-http://localhost:5000/api}

read -p "  Frontend URL [http://localhost:8080]: " FRONTEND_URL
FRONTEND_URL=${FRONTEND_URL:-http://localhost:8080}

read -p "  Environment (development/production) [development]: " NODE_ENV
NODE_ENV=${NODE_ENV:-development}

echo ""
echo -e "${BLUE}Backend Configuration:${NC}"

read -p "  Database Host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "  Database Port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "  Database User [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -p "  Database Password [password]: " DB_PASSWORD
DB_PASSWORD=${DB_PASSWORD:-password}

read -p "  Database Name [alumni_portal]: " DB_NAME
DB_NAME=${DB_NAME:-alumni_portal}

read -p "  Backend Port [5000]: " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-5000}

# Generate secrets
echo ""
echo -e "${YELLOW}Generating security keys...${NC}"
JWT_SECRET=$(generate_secret)
JWT_REFRESH_SECRET=$(generate_secret)

# Create .env files
echo -e "${YELLOW}Creating .env files...${NC}"

cat > ".env" << EOF
# Frontend Environment Variables
VITE_API_URL="${API_URL}"
FRONTEND_URL="${FRONTEND_URL}"
NODE_ENV="${NODE_ENV}"
EOF

cat > "backend/.env" << EOF
# Backend Environment Variables
PORT=${BACKEND_PORT}
NODE_ENV=${NODE_ENV}
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
JWT_EXPIRE="1h"
JWT_REFRESH_EXPIRE="7d"
FRONTEND_URL="${FRONTEND_URL}"
UPLOADS_DIR="./uploads"
MAX_FILE_SIZE="52428800"
EMAIL_FROM="noreply@alumniconnect.com"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
EOF

chmod 600 "backend/.env"

echo ""
echo -e "${GREEN}✓ Environment files created!${NC}"
echo ""
echo -e "${BLUE}Files Created:${NC}"
echo "  .env              (frontend)"
echo "  backend/.env      (backend)"
echo ""
echo -e "${YELLOW}Configuration Summary:${NC}"
echo "  Frontend URL:  ${FRONTEND_URL}"
echo "  API URL:       ${API_URL}"
echo "  Backend Port:  ${BACKEND_PORT}"
echo "  Database:      ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo "  Environment:   ${NODE_ENV}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Configure database credentials (if needed)"
echo "  2. Run: make setup"
echo "  3. Run: make dev"
echo ""
