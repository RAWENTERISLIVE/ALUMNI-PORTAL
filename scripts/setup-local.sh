#!/bin/bash

# Local Network Server Setup Script
# For schools and organizations deploying on local servers

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Alumni Portal - Local Server Setup   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root/sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run with sudo${NC}"
    exit 1
fi

echo -e "${YELLOW}This script will set up Alumni Portal on your local server${NC}"
echo ""

# Get server information
read -p "Enter server hostname [alumni-server]: " HOSTNAME
HOSTNAME=${HOSTNAME:-alumni-server}

read -p "Enter server IP address (local network): " SERVER_IP
if [[ ! "$SERVER_IP" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    echo -e "${RED}Invalid IP address${NC}"
    exit 1
fi

read -p "Network accessible from outside? (y/N): " EXTERNAL_ACCESS
EXTERNAL_ACCESS=${EXTERNAL_ACCESS:-n}

# Step 1: Update system
echo -e "${YELLOW}[1/8] Updating system...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git build-essential

# Step 2: Install Docker
echo -e "${YELLOW}[2/8] Installing Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh
usermod -aG docker root

# Step 3: Install Docker Compose
echo -e "${YELLOW}[3/8] Installing Docker Compose...${NC}"
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Step 4: Create application directory
echo -e "${YELLOW}[4/8] Creating application directory...${NC}"
mkdir -p /opt/alumni-portal
cd /opt/alumni-portal

# Step 5: Clone repository
echo -e "${YELLOW}[5/8] Cloning repository...${NC}"
git clone https://github.com/futurist-raghav/ALUMNI-PORTAL.git .

# Step 6: Configure for local network
echo -e "${YELLOW}[6/8] Configuring for local network...${NC}"

JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Determine access URL
if [ "$EXTERNAL_ACCESS" = "y" ] || [ "$EXTERNAL_ACCESS" = "Y" ]; then
    ACCESS_URL="http://${SERVER_IP}:8080"
    API_URL="http://${SERVER_IP}:5000"
else
    ACCESS_URL="http://${HOSTNAME}.local:8080"
    API_URL="http://${HOSTNAME}.local:5000"
fi

cat > ".env" << EOF
# Frontend configuration for local network
VITE_API_URL="${API_URL}/api"
FRONTEND_URL="${ACCESS_URL}"
NODE_ENV="production"

# Local network server info
SERVER_NAME="${HOSTNAME}"
SERVER_IP="${SERVER_IP}"
EOF

cat > "backend/.env" << EOF
# Backend configuration
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://alumni:$(openssl rand -base64 12)@localhost:5432/alumni_portal"
JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
JWT_EXPIRE="24h"
JWT_REFRESH_EXPIRE="30d"
FRONTEND_URL="${ACCESS_URL}"
UPLOADS_DIR="./uploads"
MAX_FILE_SIZE="52428800"

# Local network
SERVER_NAME="${HOSTNAME}"
SERVER_IP="${SERVER_IP}"
EOF

chmod 600 backend/.env

# Step 7: Setup hostname
echo -e "${YELLOW}[7/8] Configuring hostname...${NC}"
hostnamectl set-hostname ${HOSTNAME}

# Update hosts file
echo "${SERVER_IP}  ${HOSTNAME}.local  ${HOSTNAME}" >> /etc/hosts

# Step 8: Start services
echo -e "${YELLOW}[8/8] Starting services...${NC}"
docker-compose -f docker-compose.full.yml up -d
sleep 5

# Run migrations
docker-compose exec -T backend npx prisma migrate deploy
docker-compose exec -T backend npx prisma db seed 2>/dev/null || true

# Create backup script
echo -e "${YELLOW}Setting up automatic backups...${NC}"
mkdir -p /backups/alumni-portal

cat > /etc/cron.daily/alumni-backup << 'CRON_EOF'
#!/bin/bash
BACKUP_DIR="/backups/alumni-portal"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
docker exec alumni-db pg_dump -U postgres alumni_portal | gzip > $BACKUP_DIR/backup_${DATE}.sql.gz
# Keep last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
CRON_EOF

chmod +x /etc/cron.daily/alumni-backup

# Summary
echo ""
echo -e "${GREEN}✅ Local Network Setup Complete!${NC}"
echo ""
echo -e "${BLUE}Server Configuration:${NC}"
echo "  Hostname: ${HOSTNAME}"
echo "  IP Address: ${SERVER_IP}"
echo "  Access URL: ${ACCESS_URL}"
echo "  API URL: ${API_URL}"
echo ""
echo -e "${YELLOW}Access Points:${NC}"
if [ "$EXTERNAL_ACCESS" = "y" ] || [ "$EXTERNAL_ACCESS" = "Y" ]; then
    echo "  From local network:"
    echo "    http://${SERVER_IP}:8080"
    echo "    http://${HOSTNAME}.local:8080"
else
    echo "  From local network:"
    echo "    http://${HOSTNAME}.local:8080 (recommended)"
    echo "    http://${SERVER_IP}:8080"
fi
echo ""
echo -e "${YELLOW}Services Running:${NC}"
docker-compose ps
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  cd /opt/alumni-portal"
echo "  docker-compose logs -f"
echo "  docker-compose restart"
echo "  docker-compose down && docker-compose up -d"
echo ""
echo -e "${YELLOW}Backup Information:${NC}"
echo "  Location: /backups/alumni-portal"
echo "  Frequency: Daily (via cron)"
echo "  Retention: 30 days"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Add to school network DNS (optional)"
echo "2. Configure firewall rules"
echo "3. Test access from another computer"
echo "4. Create admin account"
echo ""
