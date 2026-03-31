#!/bin/bash

##############################################
# Alumni Portal - Quick Deployment Script   #
# For single-server deployment              #
##############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Alumni Portal - Deployment Script  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if running with make available
if ! command -v make &> /dev/null; then
    echo -e "${RED}❌ make is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if running in correct directory
if [ ! -f "Makefile" ]; then
    echo -e "${RED}❌ Makefile not found. Please run from project root.${NC}"
    exit 1
fi

# Menu
show_menu() {
    echo -e "${YELLOW}Choose deployment option:${NC}"
    echo "  1) Development Setup (local)"
    echo "  2) Production Setup (Docker)"
    echo "  3) Production Setup (Traditional)"
    echo "  4) Quick Start (dev)"
    echo "  5) Clean & Rebuild"
    echo "  6) Database Operations"
    echo "  7) View Logs"
    echo "  8) Diagnose Issues"
    echo "  9) Exit"
    echo ""
    read -p "Enter choice (1-9): " CHOICE
}

# Development setup
dev_setup() {
    echo -e "${GREEN}Setting up development environment...${NC}"
    make setup
    make db-start
    make db-migrate
    echo -e "${GREEN}✓ Development setup complete!${NC}"
    echo -e "${YELLOW}Run: make dev${NC}"
}

# Production Docker setup
docker_setup() {
    echo -e "${GREEN}Setting up Docker production environment...${NC}"
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
        echo "    https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    echo -e "${YELLOW}Generating Docker configuration...${NC}"
    make generate-docker
    
    # Get domain
    echo ""
    read -p "Enter your domain (e.g., yourdomain.com) [localhost]: " DOMAIN
    DOMAIN=${DOMAIN:-localhost}
    
    # Create production .env files
    echo -e "${YELLOW}Creating production environment files...${NC}"
    
    cat > .env << EOF
VITE_API_URL="http://${DOMAIN}/api"
FRONTEND_URL="http://${DOMAIN}"
NODE_ENV="production"
EOF
    
    # Generate secrets
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    
    cat > backend/.env << EOF
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://alumni:alumni123@database:5432/alumni_portal"
JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
JWT_EXPIRE="1h"
JWT_REFRESH_EXPIRE="7d"
FRONTEND_URL="http://${DOMAIN}"
EOF
    
    chmod 600 backend/.env
    
    echo ""
    echo -e "${YELLOW}Building Docker images...${NC}"
    make build
    
    echo ""
    echo -e "${GREEN}✓ Docker setup complete!${NC}"
    echo -e "${YELLOW}Run to start: docker-compose -f docker-compose.full.yml up -d${NC}"
    echo ""
    echo -e "${BLUE}Environment:${NC}"
    echo "  Frontend: http://${DOMAIN}:8080"
    echo "  Backend:  http://${DOMAIN}:5000"
    echo "  Database: localhost:5432"
}

# Traditional production setup
traditional_setup() {
    echo -e "${GREEN}Setting up traditional production environment...${NC}"
    
    # Get domain
    echo ""
    read -p "Enter your domain [localhost]: " DOMAIN
    DOMAIN=${DOMAIN:-localhost}
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+${NC}"
        exit 1
    fi
    
    # Create .env files
    echo -e "${YELLOW}Creating environment files...${NC}"
    
    cat > .env << EOF
VITE_API_URL="http://${DOMAIN}/api"
FRONTEND_URL="http://${DOMAIN}"
NODE_ENV="production"
EOF
    
    # Generate secrets
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    
    cat > backend/.env << EOF
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://alumni:alumni123@localhost:5432/alumni_portal"
JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
JWT_EXPIRE="1h"
JWT_REFRESH_EXPIRE="7d"
FRONTEND_URL="http://${DOMAIN}"
EOF
    
    chmod 600 backend/.env
    
    echo ""
    echo -e "${YELLOW}Installing dependencies...${NC}"
    make install
    
    echo ""
    echo -e "${YELLOW}Building application...${NC)"
    make build
    
    echo ""
    echo -e "${GREEN}✓ Traditional setup complete!${NC}"
    echo ""
    echo -e "${YELLOW}Manual startup (in separate terminals):${NC}"
    echo "  Terminal 1: npm run preview        (frontend)"
    echo "  Terminal 2: cd backend && npm start (backend)"
    echo ""
    echo -e "${YELLOW}Or with PM2:${NC}"
    echo "  npm install -g pm2"
    echo "  pm2 start ecosystem.config.js"
    echo "  pm2 startup"
    echo "  pm2 save"
}

# Database operations menu
db_menu() {
    echo -e "${YELLOW}Database Operations:${NC}"
    echo "  1) Start database"
    echo "  2) Stop database"
    echo "  3) Run migrations"
    echo "  4) Seed database"
    echo "  5) Reset database (WARNING!)"
    echo "  6) View logs"
    read -p "Enter choice (1-6): " DB_CHOICE
    
    case $DB_CHOICE in
        1) make db-start ;;
        2) make db-stop ;;
        3) make db-migrate ;;
        4) make db-seed ;;
        5) make db-reset ;;
        6) make db-logs ;;
        *) echo -e "${RED}Invalid choice${NC}" ;;
    esac
}

# Logs menu
logs_menu() {
    echo -e "${YELLOW}View Logs:${NC}"
    echo "  1) Database logs"
    echo "  2) Git status"
    echo "  3) Recent commits"
    read -p "Enter choice (1-3): " LOG_CHOICE
    
    case $LOG_CHOICE in
        1) make db-logs ;;
        2) make status ;;
        3) make logs ;;
        *) echo -e "${RED}Invalid choice${NC}" ;;
    esac
}

# Main loop
while true; do
    show_menu
    
    case $CHOICE in
        1) dev_setup ;;
        2) docker_setup ;;
        3) traditional_setup ;;
        4) make dev ;;
        5) 
            read -p "Are you sure? This will delete build artifacts. (y/N): " CONFIRM
            if [ "$CONFIRM" = "y" ]; then
                make clean
                make install
                make build
                echo -e "${GREEN}✓ Clean rebuild complete${NC}"
            fi
            ;;
        6) db_menu ;;
        7) logs_menu ;;
        8) make diagnose ;;
        9) 
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    clear
done
