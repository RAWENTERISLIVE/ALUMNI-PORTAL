# 🚀 Single-Server Deployment Guide

This guide covers deploying the Alumni Portal as a single-server application (frontend + backend on one server).

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Local Development Setup](#local-development-setup)
3. [Production Environment Setup](#production-environment-setup)
4. [Docker Deployment](#docker-deployment)
5. [Traditional Deployment (No Docker)](#traditional-deployment-no-docker)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## System Requirements

### Minimum Specs
- **OS**: Linux, macOS, or Windows (with WSL2)
- **Memory**: 2GB RAM minimum
- **Storage**: 5GB free space
- **CPU**: 1 core minimum

### Recommended Specs
- **OS**: Ubuntu 20.04 LTS or later
- **Memory**: 4GB RAM
- **Storage**: 20GB free space
- **CPU**: 2+ cores

### Required Software

#### Option A: Docker Deployment (Recommended)
```bash
# Ubuntu/Debian
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER

# macOS
brew install docker docker-compose
```

#### Option B: Traditional Deployment
```bash
# Node.js (18+)
node --version  # v18.0.0 or higher

# PostgreSQL 13+
sudo apt-get install postgresql postgresql-contrib
```

---

## Local Development Setup

**Time**: 5-10 minutes

### Step 1: Clone & Install
```bash
git clone https://github.com/futurist-raghav/ALUMNI-PORTAL.git
cd ALUMNI-PORTAL
make setup
```

### Step 2: Configure Environment
```bash
# Copy and edit frontend env
cp .env.example .env
# Edit VITE_API_URL if needed

# Copy and edit backend env
cp backend/.env.example backend/.env
# Keep defaults for local dev
```

### Step 3: Start Development
```bash
# This starts frontend, backend, and database
make dev

# Open http://localhost:8080
```

### Step 4: View Logs (in another terminal)
```bash
make db-logs      # Database logs
make status       # Check all services
```

---

## Production Environment Setup

### Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    python3-pip

# Install Docker & Docker Compose
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker $USER
newgrp docker
```

### Step 2: Clone Repository

```bash
cd /opt
sudo git clone https://github.com/futurist-raghav/ALUMNI-PORTAL.git alumni-portal
cd alumni-portal
sudo chown -R $USER:$USER .
```

### Step 3: Configure Production Environment

```bash
# Generate secure JWT secrets
openssl rand -base64 32        # Copy for JWT_SECRET
openssl rand -base64 32        # Copy for JWT_REFRESH_SECRET

# Create .env file
cat > .env << EOF
VITE_API_URL="https://yourdomain.com/api"
FRONTEND_URL="https://yourdomain.com"
NODE_ENV="production"
EOF

# Create backend/.env file
cat > backend/.env << EOF
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://alumni:$(openssl rand -base64 12)@localhost:5432/alumni_portal"
JWT_SECRET="<paste-generated-secret>"
JWT_REFRESH_SECRET="<paste-generated-secret>"
JWT_EXPIRE="1h"
JWT_REFRESH_EXPIRE="7d"
FRONTEND_URL="https://yourdomain.com"
EOF

# Secure the env file
chmod 600 backend/.env
chmod 600 .env
```

### Step 4: Database Setup

```bash
# Create PostgreSQL user and database
sudo -u postgres psql << EOF
CREATE USER alumni WITH ENCRYPTED PASSWORD 'strong_password_here';
CREATE DATABASE alumni_portal OWNER alumni;
GRANT ALL PRIVILEGES ON DATABASE alumni_portal TO alumni;
EOF

# Update DATABASE_URL in backend/.env with actual credentials
```

---

## Docker Deployment (Recommended)

### Option 1: Using Docker Compose (Easiest)

```bash
# Build and start all services
cd /opt/alumni-portal
docker-compose -f docker-compose.full.yml up -d

# Run migrations
docker-compose -f docker-compose.full.yml exec backend npx prisma migrate deploy

# Seed database (optional)
docker-compose -f docker-compose.full.yml exec backend npx prisma db seed

# View logs
docker-compose -f docker-compose.full.yml logs -f
```

### Option 2: Manual Docker Commands

```bash
# Build images
docker build -t alumni-portal:latest .
docker build -t alumni-portal-backend:latest ./backend

# Create network
docker network create alumni-network

# Start PostgreSQL
docker run -d \
  --name alumni-db \
  --network alumni-network \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=alumni_portal \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:15-alpine

# Start Backend
docker run -d \
  --name alumni-api \
  --network alumni-network \
  -p 5000:5000 \
  -e DATABASE_URL="postgresql://postgres:password@alumni-db:5432/alumni_portal" \
  -e JWT_SECRET="your-secret" \
  alumni-portal-backend:latest

# Start Frontend
docker run -d \
  --name alumni-web \
  --network alumni-network \
  -p 8080:8080 \
  -e VITE_API_URL="http://localhost:5000/api" \
  alumni-portal:latest
```

### Accessing the Application

- **Frontend**: http://your-server-ip:8080
- **Backend API**: http://your-server-ip:5000/api
- **Database**: localhost:5432 (internal only)

---

## Traditional Deployment (No Docker)

### Step 1: Install Dependencies

```bash
cd /opt/alumni-portal

# Install Node.js dependencies
npm install
cd backend && npm install && cd ..
```

### Step 2: Build Application

```bash
make build
```

### Step 3: Start Services

```bash
# In one terminal - start backend
(cd backend && npm start)

# In another terminal - start frontend
npm run preview

# Or use maker
make start
```

### Step 4: Setup Process Manager (Optional but Recommended)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem config
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'alumni-api',
      script: './backend/dist/server.js',
      cwd: '/opt/alumni-portal/backend',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'alumni-web',
      script: 'npm',
      args: 'run preview',
      cwd: '/opt/alumni-portal',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

---

## Post-Deployment Verification

```bash
# Check backend is running
curl http://localhost:5000/api/status

# Check frontend is accessible
curl http://localhost:8080

# Check database connection
psql -U alumni -d alumni_portal -c "SELECT 1;"

# View all services
make status

# Run diagnostics
make diagnose
```

---

## Setting Up Reverse Proxy (Nginx)

For production, use Nginx as a reverse proxy:

```bash
# Install Nginx
sudo apt-get install nginx

# Create config
sudo cat > /etc/nginx/sites-available/alumni-portal << 'EOF'
upstream backend {
    server localhost:5000;
}

server {
    listen 80;
    server_name yourdomain.com;

    client_max_body_size 100M;

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/alumni-portal /etc/nginx/sites-enabled/

# Test and start
sudo nginx -t
sudo systemctl start nginx
```

### Setup SSL (Recommended)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

---

## Monitoring & Maintenance

### View Logs

```bash
# Docker
docker-compose -f docker-compose.full.yml logs -f

# Traditional
pm2 logs alumni-api
pm2 logs alumni-web

# System
journalctl -u nginx -f
```

### Database Backups

```bash
# Backup
docker exec alumni-db pg_dump -U postgres alumni_portal > backup.sql

# Restore
docker exec -i alumni-db psql -U postgres alumni_portal < backup.sql

# Automated backup (cron)
0 2 * * * docker exec alumni-db pg_dump -U postgres alumni_portal > /backup/alumni_$(date +\%Y\%m\%d).sql
```

### Performance Monitoring

```bash
# Check resource usage
docker stats

# Monitor processes
pm2 monit

# Check disk space
df -h
du -sh /opt/alumni-portal

# Check database
docker exec alumni-db psql -U postgres -c "SELECT * FROM pg_stat_statements LIMIT 10;"
```

### Database Maintenance

```bash
# Vacuum and analyze
docker exec alumni-db vacuumdb -U postgres -d alumni_portal -z

# Reindex
docker exec alumni-db reindexdb -U postgres -d alumni_portal

# Schedule maintenance
docker exec alumni-db pg_dump -U postgres alumni_portal | gzip > /backup/alumni_backup_$(date +%Y%m%d).sql.gz
```

### Updates & Upgrades

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
make clean
make build
docker-compose -f docker-compose.full.yml restart

# Or traditional
pm2 restart all
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process
lsof -i :8080
kill -9 <PID>

# Or change port in .env
```

### Database Connection Issues

```bash
# Check if database is running
docker ps
psql -U alumni -h localhost -d alumni_portal

# Check logs
docker logs alumni-db
```

### Out of Memory

```bash
# Check memory usage
free -h
docker stats --no-stream

# Increase swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### SSL Certificate Issues

```bash
# Check certificate
sudo openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout

# Renew manually
sudo certbot renew --force-renewal
```

---

## Checklist ✅

- [ ] System requirements met
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database created and migrated
- [ ] Application built successfully
- [ ] Services running without errors
- [ ] Frontend accessible at http://server:8080
- [ ] API responding at http://server:5000/api
- [ ] Database backups configured
- [ ] Monitoring setup
- [ ] SSL certificate installed (production)
- [ ] Firewall rules configured

---

## Getting Help

For issues or questions:
1. Check logs: `make db-logs` or `docker-compose logs`
2. Run diagnostics: `make diagnose`
3. Review docs: See [Documentation Index](./docs/00_DOCUMENTATION_INDEX.md)
4. Check GitHub issues: https://github.com/futurist-raghav/ALUMNI-PORTAL/issues
