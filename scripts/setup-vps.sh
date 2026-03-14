#!/bin/bash

# Generic VPS Setup Script
# Works on any cloud provider with Ubuntu 20.04+ or CentOS 7+
# Usage: bash setup-vps.sh or curl https://raw.githubusercontent.com/your-repo/setup-vps.sh | bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      Alumni Portal - VPS Setup        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Detect OS
if [ -f /etc/debian_version ]; then
    OS="debian"
    INSTALL="apt-get install -y"
elif [ -f /etc/redhat-release ]; then
    OS="redhat"
    INSTALL="yum install -y"
else
    echo -e "${RED}Unsupported operating system${NC}"
    exit 1
fi

echo -e "${BLUE}Detected OS: ${OS}${NC}"
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Step 1: Update system
echo -e "${YELLOW}[1/9] Updating system...${NC}"
if [ "$OS" = "debian" ]; then
    apt-get update && apt-get upgrade -y
    $INSTALL curl wget git build-essential openssl
else
    yum update -y
    $INSTALL curl wget git gcc openssl
fi

# Step 2: Install Docker
echo -e "${YELLOW}[2/9] Installing Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Step 3: Install Docker Compose
echo -e "${YELLOW}[3/9] Installing Docker Compose...${NC}"
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'"' -f4)
curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Step 4: Firewall setup
echo -e "${YELLOW}[4/9] Configuring firewall...${NC}"
if [ "$OS" = "debian" ]; then
    apt-get install -y ufw
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "y" | ufw enable
else
    systemctl enable firewalld
    systemctl start firewalld
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --reload
fi

# Step 5: Create application directory
echo -e "${YELLOW}[5/9] Creating application directory...${NC}"
mkdir -p /opt/alumni-portal
cd /opt/alumni-portal

# Step 6: Clone repository
echo -e "${YELLOW}[6/9] Cloning repository...${NC}"
git clone https://github.com/futurist-raghav/ALUMNI-PORTAL.git .

# Step 7: Setup environment
echo -e "${YELLOW}[7/9] Setting up environment...${NC}"

JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

echo ""
echo -e "${BLUE}Configuration:${NC}"
read -p "Enter your domain (e.g., alumni.example.com) [localhost]: " DOMAIN
DOMAIN=${DOMAIN:-localhost}

read -p "Enable SSL with Let's Encrypt? (y/N): " ENABLE_SSL
ENABLE_SSL=${ENABLE_SSL:-n}

cat > ".env" << EOF
VITE_API_URL="https://${DOMAIN}/api"
FRONTEND_URL="https://${DOMAIN}"
NODE_ENV="production"
EOF

DB_PASS=$(openssl rand -base64 12)
cat > "backend/.env" << EOF
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://alumni:${DB_PASS}@localhost:5432/alumni_portal"
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

# Step 8: Build application
echo -e "${YELLOW}[8/9] Building application...${NC}"
docker-compose -f docker-compose.full.yml build

# Step 9: Start services
echo -e "${YELLOW}[9/9] Starting services...${NC}"
docker-compose -f docker-compose.full.yml up -d
sleep 5

# Run migrations
docker-compose exec -T backend npx prisma migrate deploy
docker-compose exec -T backend npx prisma db seed 2>/dev/null || true

# SSL Setup if requested
if [ "$ENABLE_SSL" = "y" ] || [ "$ENABLE_SSL" = "Y" ]; then
    echo ""
    echo -e "${YELLOW}Setting up SSL...${NC}"
    if [ "$OS" = "debian" ]; then
        apt-get install -y certbot
    else
        yum install -y certbot
    fi
    
    certbot certonly --standalone -d "${DOMAIN}" --agree-tos --register-unsafely-without-email
    echo -e "${GREEN}✓ SSL certificate installed${NC}"
    echo "Certificate path: /etc/letsencrypt/live/${DOMAIN}/cert.pem"
fi

# Summary
echo ""
echo -e "${GREEN}✅ VPS Setup Complete!${NC}"
echo ""
echo -e "${BLUE}Server Information:${NC}"
echo "  Hostname: $(hostname)"
echo "  IP Address: $(hostname -I | awk '{print $1}')"
echo "  Domain: ${DOMAIN}"
echo "  OS: ${OS}"
echo ""
echo -e "${YELLOW}Services Running:${NC}"
docker-compose ps
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Configure DNS to point to: $(hostname -I | awk '{print $1}')"
echo "2. Setup Nginx reverse proxy (optional)"
echo "3. Access application at: https://${DOMAIN}"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  cd /opt/alumni-portal"
echo "  docker-compose logs -f              # View logs"
echo "  docker-compose ps                   # Check status"
echo "  docker-compose exec backend bash    # Backend shell"
echo "  make db-logs                        # Database logs"
echo ""
