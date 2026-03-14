#!/bin/bash

# Hetzner Cloud Setup Script
# Run this on a fresh CX11 server (Ubuntu 22.04)
# Usage: curl https://raw.githubusercontent.com/your-repo/setup-hetzner.sh | bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Alumni Portal - Hetzner Setup     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Enable swap (important for small instances)
echo -e "${YELLOW}[1/9] Setting up swap (2GB)...${NC}"
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Update system
echo -e "${YELLOW}[2/9] Updating system...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git build-essential

# Install Docker
echo -e "${YELLOW}[3/9] Installing Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh
usermod -aG docker root

# Install Docker Compose
echo -e "${YELLOW}[4/9] Installing Docker Compose...${NC}"
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create app directory
echo -e "${YELLOW}[5/9] Creating application directory...${NC}"
mkdir -p /opt/alumni-portal
cd /opt/alumni-portal

# Clone repository
echo -e "${YELLOW}[6/9] Cloning repository...${NC}"
git clone https://github.com/futurist-raghav/ALUMNI-PORTAL.git .

# Setup environment
echo -e "${YELLOW}[7/9] Configuring environment...${NC}"

JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

read -p "Enter domain [localhost]: " DOMAIN
DOMAIN=${DOMAIN:-localhost}

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
EOF

chmod 600 backend/.env

# Build
echo -e "${YELLOW}[8/9] Building application...${NC}"
docker-compose -f docker-compose.full.yml build

# Start services
echo -e "${YELLOW}[9/9] Starting services...${NC}"
docker-compose -f docker-compose.full.yml up -d
sleep 5

# Run migrations
docker-compose exec -T backend npx prisma migrate deploy

echo ""
echo -e "${GREEN}✅ Hetzner Setup Complete!${NC}"
echo ""
echo -e "${BLUE}Server Info:${NC}"
echo "  IP: $(hostname -I | awk '{print $1}')"
echo "  Domain: ${DOMAIN}"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  docker-compose logs -f"
echo "  docker-compose ps"
echo "  make help"
echo ""
