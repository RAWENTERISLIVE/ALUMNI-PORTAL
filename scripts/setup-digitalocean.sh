#!/bin/bash

# DigitalOcean Droplet Setup Script
# Run this on a fresh Ubuntu 22.04 droplet
# Usage: curl https://raw.githubusercontent.com/your-repo/setup-digitalocean.sh | bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  MPSAJMER CONNECT - DigitalOcean Setup  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Step 1: Update system
echo -e "${YELLOW}[1/8] Updating system...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git build-essential

# Step 2: Install Docker
echo -e "${YELLOW}[2/8] Installing Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh
curl -fsSL https://get.docker.com/rootless | sh 2>/dev/null || true

# Step 3: Install Node.js
echo -e "${YELLOW}[3/8] Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Step 4: Create application directory
echo -e "${YELLOW}[4/8] Creating application directory...${NC}"
mkdir -p /opt/mpsajmer-connect
cd /opt/mpsajmer-connect

# Step 5: Clone repository
echo -e "${YELLOW}[5/8] Cloning repository...${NC}"
git clone https://github.com/futurist-raghav/ALUMNI-PORTAL.git .

# Step 6: Setup environment
echo -e "${YELLOW}[6/8] Setting up environment...${NC}"

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Get domain from user
read -p "Enter your domain (e.g., alumni.example.com) [localhost]: " DOMAIN
DOMAIN=${DOMAIN:-localhost}

# Create .env files
cat > ".env" << EOF
VITE_API_URL="https://${DOMAIN}/api"
FRONTEND_URL="https://${DOMAIN}"
NODE_ENV="production"
EOF

cat > "backend/.env" << EOF
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://alumni:$(openssl rand -base64 12)@localhost:5432/alumni_portal"
JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
JWT_EXPIRE="1h"
JWT_REFRESH_EXPIRE="7d"
FRONTEND_URL="https://${DOMAIN}"
UPLOADS_DIR="./uploads"
MAX_FILE_SIZE="52428800"
EMAIL_FROM="noreply@${DOMAIN}"
EOF

chmod 600 backend/.env

# Step 7: Build application
echo -e "${YELLOW}[7/8] Building application...${NC}"
npm install
cd backend && npm install && cd ..
npm run build

# Step 8: Setup Docker Compose
echo -e "${YELLOW}[8/8] Starting services with Docker...${NC}"
docker-compose -f docker-compose.full.yml up -d

# Wait for database
sleep 5

# Run migrations
docker-compose exec -T backend npx prisma migrate deploy

echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Point your domain to this server's IP"
echo "2. Install SSL certificate:"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot certonly --standalone -d ${DOMAIN}"
echo "3. Setup Nginx reverse proxy"
echo "4. Access: https://${DOMAIN}"
echo ""
echo -e "${YELLOW}Docker Commands:${NC}"
echo "  docker-compose logs -f              # View logs"
echo "  docker-compose ps                   # Service status"
echo "  docker-compose down                 # Stop services"
echo "  docker-compose up -d                # Start services"
echo ""
