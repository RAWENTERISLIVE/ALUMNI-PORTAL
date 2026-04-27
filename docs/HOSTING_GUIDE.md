# 🌐 Hosting & Deployment Platforms Guide

Complete guide for hosting MPSAJMER CONNECT on various platforms - from local school servers to commercial providers.

---

## 📋 Quick Platform Comparison

| Platform | Type | Difficulty | Cost | Best For |
|----------|------|-----------|------|----------|
| **Local Server** | On-Premise | ⭐⭐ Easy | Free | Schools, Organizations |
| **Hostinger** | Shared Hosting | ⭐⭐⭐ Medium | $3-10/mo | Small deployments |
| **DigitalOcean** | VPS | ⭐⭐⭐ Medium | $4-12/mo | Growing apps |
| **AWS** | Cloud | ⭐⭐⭐⭐ Complex | $0-50+/mo | Enterprise scale |
| **Heroku** | PaaS | ⭐ Very Easy | $7-50/mo | Quick deployment |
| **Railway** | PaaS | ⭐ Very Easy | $5-20/mo | Modern apps |
| **Linode** | VPS | ⭐⭐⭐ Medium | $5-15/mo | Developer-friendly |
| **Hetzner** | VPS | ⭐⭐⭐ Medium | $3-10/mo | Budget-friendly |
| **Azure** | Cloud | ⭐⭐⭐⭐ Complex | $5-50+/mo | Enterprise |

---

## 🏫 LOCAL SERVER DEPLOYMENT

For schools and organizations with on-premise servers.

### Hardware Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 2GB
- Storage: 10GB
- Linux: Ubuntu 20.04 LTS or CentOS 7+

**Recommended:**
- CPU: 4+ cores
- RAM: 8GB
- Storage: 50GB SSD
- Ubuntu 22.04 LTS

### Network Setup

#### Step 1: Server Preparation
```bash
# Connect to your server
ssh admin@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
newgrp docker

# Install Git
sudo apt install -y git
```

#### Step 2: Clone & Deploy
```bash
# Create directory
cd /opt
sudo mkdir mpsajmer-connect
sudo chown $USER:$USER mpsajmer-connect
cd mpsajmer-connect

# Clone repository
git clone https://github.com/futurist-raghav/ALUMNI-PORTAL.git .

# Setup environment
./setup-env.sh

# Start services
docker-compose -f docker-compose.full.yml up -d
```

#### Step 3: Access Locally
```
Frontend: http://your-server-ip:8080
Backend:  http://your-server-ip:5000
```

#### Step 4: Network Configuration

**For Internal Network Only:**
```bash
# Edit docker-compose.full.yml
# Change ports to:
# ports:
#   - "127.0.0.1:8080:8080"  # Local only
#   - "127.0.0.1:5000:5000"  # Local only
```

**For Entire School Network:**
```bash
# Use current settings (binds to 0.0.0.0)
# Access via: http://server-hostname:8080
```

**Configure Hostname:**
```bash
# Add to /etc/hosts on school network
192.168.1.100  mpsajmer-connect.school.local

# Or configure DNS on school router
```

#### Step 5: Backup Strategy
```bash
# Create backup directory
mkdir -p /backups/mpsajmer-connect

# Daily backup cron
sudo crontab -e

# Add:
0 2 * * * docker exec alumni-db pg_dump -U postgres alumni_portal | gzip > /backups/mpsajmer-connect/backup_$(date +\%Y\%m\%d).sql.gz

# Keep last 30 days
find /backups/mpsajmer-connect -name "*.gz" -mtime +30 -delete
```

---

## 🌍 COMMERCIAL HOSTING PLATFORMS

### 1. HOSTINGER (Budget-Friendly)

**Pricing:** $3-10/month  
**Type:** Shared hosting  
**Good for:** Small teams, learning

#### Limitations
- ❌ No Docker support
- ❌ Limited to Node.js via shared hosting
- ✅ Can use traditional deployment method

#### Deployment Steps

```bash
# 1. Use SSH Access (File Manager in Hostinger)
# 2. Create app directory
mkdir -p ~/public_html/mpsajmer-connect

# 3. Upload code via SFTP
# Use FileZilla or similar
# Connect to: sftp.hostinger.com

# 4. Install dependencies
cd ~/public_html/mpsajmer-connect
npm install
cd backend && npm install && cd ..

# 5. Build
npm run build

# 6. Setup PM2 (process manager)
npm install -g pm2

# 7. Create ecosystem config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'alumni-backend',
      script: './backend/dist/server.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
EOF

# 8. Start with PM2
pm2 start ecosystem.config.js

# 9. Setup reverse proxy via Hostinger cpanel
# Point domain to backend on port 3000
```

**Hostinger cPanel Configuration:**
```
1. Go to cPanel > Addon Domains
2. Add your domain
3. Point to ~/public_html/mpsajmer-connect/dist
4. Setup reverse proxy for /api to localhost:3000
```

---

### 2. DIGITALOCEAN (VPS - Recommended)

**Pricing:** $4-12/month  
**Type:** VPS (Droplet)  
**Good for:** Most projects

#### Setup via DigitalOcean CLI

```bash
# 1. Create Droplet
# - Image: Ubuntu 22.04
# - Size: Basic ($4/month - 512MB RAM)
# - Region: Choose closest

# 2. SSH into droplet
ssh root@your-droplet-ip

# 3. Initial setup
curl https://raw.githubusercontent.com/futurist-raghav/ALUMNI-PORTAL/main/scripts/digitalocean-setup.sh | bash
```

#### Manual Setup

```bash
# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y curl wget git build-essential
apt install -y docker.io docker-compose
apt install -y nodejs npm

# Create non-root user
adduser appuser
usermod -aG docker appuser
su - appuser

# Clone project
cd /home/appuser
git clone https://github.com/futurist-raghav/ALUMNI-PORTAL.git mpsajmer-connect
cd mpsajmer-connect

# Setup environment
./setup-env.sh

# Build
npm install
cd backend && npm install && cd ..
make build

# Start with Docker Compose
docker-compose -f docker-compose.full.yml up -d
```

#### Setup Firewall
```bash
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 5432/tcp    # Database (internal only)
ufw enable
```

#### Enable SSL (Free with Let's Encrypt)
```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get certificate
certbot certonly --standalone -d yourdomain.com

# Auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer
```

---

### 3. HEROKU (Easiest PaaS)

**Pricing:** $7-50/month  
**Type:** Platform as a Service  
**Good for:** Quick deployment

#### Deployment

```bash
# 1. Install Heroku CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Create app
heroku create mpsajmer-connect-yourname

# 4. Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# 5. Add buildpack for Node.js
heroku buildpacks:add heroku/nodejs

# 6. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)

# 7. Deploy
git push heroku main

# 8. Run migrations
heroku run "cd backend && npx prisma migrate deploy"

# 9. View application
heroku open
```

**Procfile** (create in root):
```
web: node backend/dist/server.js
release: cd backend && npx prisma migrate deploy
```

---

### 4. RAILWAY (Modern & Easy)

**Pricing:** $5-20/month  
**Type:** Platform as a Service  
**Good for:** Modern Node apps

#### Deployment

```bash
# 1. Create account at railway.app
# 2. Install Railway CLI
npm install -g @railway/cli

# 3. Login
railway login

# 4. Initialize project
railway init

# 5. Create services
railway add
# Select PostgreSQL

# 6. Deploy
git push

# Or use Railway dashboard to connect GitHub
```

---

### 5. AWS (Enterprise Scale)

**Pricing:** $0-50+/month  
**Type:** Cloud Infrastructure  
**Good for:** Enterprise deployments

#### Architecture
```
Route 53 (DNS)
    ↓
CloudFront (CDN)
    ↓
Application Load Balancer
    ├─→ EC2 (Frontend + Backend)
    └─→ RDS (PostgreSQL Database)
```

#### Quick Deploy with Elastic Beanstalk

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize
eb init -p node.js-18 mpsajmer-connect

# 3. Create environment
eb create alumni-production

# 4. Deploy
eb deploy

# 5. Open
eb open
```

---

### 6. LINODE (Developer-Friendly VPS)

**Pricing:** $5-15/month  
**Type:** VPS  
**Good for:** Developers

#### StackScript Deployment

```bash
# Linode provides StackScripts
# 1. Create new Linode
# 2. Choose Ubuntu 22.04
# 3. Use this StackScript:

#!/bin/bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone alumni portal
git clone https://github.com/futurist-raghav/ALUMNI-PORTAL.git /opt/mpsajmer-connect
cd /opt/mpsajmer-connect

# Setup environment
./setup-env.sh

# Start services
docker-compose -f docker-compose.full.yml up -d
```

---

### 7. HETZNER (Budget VPS)

**Pricing:** $3-10/month  
**Type:** VPS  
**Good for:** Budget-conscious

#### Setup

```bash
# 1. Create server (CX11 - €3.50/month)
# 2. Choose Ubuntu 22.04
# 3. SSH in and run:

curl https://raw.githubusercontent.com/futurist-raghav/ALUMNI-PORTAL/main/scripts/hetzner-setup.sh | bash
```

---

## 🔧 PLATFORM-SPECIFIC GUIDES

### For Schools with Existing Infrastructure

```
School Setup
├── On-Premise Server
│   ├── Ubuntu 20.04 Server
│   ├── Docker installed
│   └── MPSAJMER CONNECT running
│
├── Network Configuration
│   ├── Static IP assignment
│   ├── Hostname: alumni.school.local
│   ├── DNS configured
│   └── Firewall rules
│
├── Access Points
│   ├── Internal: http://alumni.school.local
│   ├── External: https://alumni.school.edu (if exposed)
│   └── Admin: ssh admin@alumni.school.local
│
└── Maintenance
    ├── Daily backups to NAS
    ├── Weekly security patches
    └── Monthly database optimization
```

### For Non-Profit Organizations

**Recommended:** DigitalOcean or Linode
- Low cost ($4-5/month)
- Full control
- Easy scaling
- Good support

**Setup:**
```bash
make deploy
docker-compose -f docker-compose.full.yml up -d
```

### For Educational Institutions

**Recommended:** Local Server + AWS Backup
- Primary: On-premise for control
- Backup: AWS S3 for data redundancy
- CDN: CloudFront for global access

---

## 📦 COMPARISON TABLE

| Feature | Local | Hostinger | DigitalOcean | Heroku | AWS |
|---------|-------|-----------|-------------|--------|-----|
| Setup Time | 30 min | 20 min | 15 min | 5 min | 1 hour |
| Monthly Cost | Free | $3-10 | $4-12 | $7-50 | $5-50+ |
| Docker Support | ✅ | ❌ | ✅ | ✅ | ✅ |
| Auto-Scaling | ❌ | ❌ | ✅ | ✅ | ✅ |
| Managed DB | ❌ | ❌ | ✅ | ✅ | ✅ |
| SSL/HTTPS | Manual | Included | Free | Free | Free |
| Custom Domain | ✅ | ✅ | ✅ | ✅ | ✅ |
| Support | Self | Email | Community | Chat | Forum |
| Data Center | Local | Varies | 15+ regions | US | Global |
| Reliability | 85%* | 99.9% | 99.99% | 99.95% | 99.99% |

*Depends on hardware and network

---

## 🚀 RECOMMENDED PATHS

### Scenario 1: School with Local Server
```
1. Install Ubuntu 20.04 on school server
2. Run: ./deploy.sh
3. Choose: "Production Setup (Docker)"
4. Configure network for school LAN
5. Access via: http://alumni.school.local:8080
```

### Scenario 2: Small Organization ($5/month)
```
1. Sign up for DigitalOcean
2. Create $4 Droplet (Ubuntu 22.04)
3. Run deployment script via SSH
4. Enable SSL with Let's Encrypt
5. Access via: https://yourdomain.com
```

### Scenario 3: Non-Profit (Community Driven)
```
1. Use Railway (free tier available)
2. Connect GitHub repo
3. Auto-deploy on push
4. Managed PostgreSQL included
5. Access via: yourdomain.railway.app
```

### Scenario 4: Enterprise Deployment
```
1. Use AWS ECS or Kubernetes
2. Multi-region setup
3. Load balancing
4. Auto-scaling
5. CDN for assets
6. Access via: https://yourdomain.com
```

---

## ✅ PRE-DEPLOYMENT CHECKLIST

- [ ] Domain registered (godaddy.com, namecheap.com, etc.)
- [ ] SSL certificate ready (Let's Encrypt free)
- [ ] Environment variables configured
- [ ] Database backups setup
- [ ] Email service configured (optional)
- [ ] File upload storage configured
- [ ] CDN setup (optional)
- [ ] Monitoring & alerts configured
- [ ] Database migration successful
- [ ] Admin account created

---

## 🆘 TROUBLESHOOTING

### Port Already in Use
See [DEPLOYMENT_GUIDE.md#port-already-in-use](./DEPLOYMENT_GUIDE.md#port-already-in-use)

### Database Connection Issues
See [DEPLOYMENT_GUIDE.md#database-connection-issues](./DEPLOYMENT_GUIDE.md#database-connection-issues)

### SSL Certificate Not Working
```bash
# Check certificate status
certbot certificates

# Renew manually
certbot renew --force-renewal

# Check logs
journalctl -ex certbot
```

### Service Not Starting
```bash
# Check logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild if needed
docker-compose down
docker-compose up -d
```

---

## 📞 PLATFORM SUPPORT

| Platform | Support Email | Chat | Community |
|----------|--------------|------|-----------|
| DigitalOcean | support@digitalocean.com | Live Chat | Forums |
| Heroku | support@heroku.com | Email | Discuss |
| AWS | AWS Support Console | Chat | Forums |
| Linode | support@linode.com | Tickets | Community |
| Hetzner | support@hetzner.com | Tickets | Forums |

---

## 📚 NEXT STEPS

1. **Choose Platform** - See comparison table above
2. **Follow Platform Guide** - Each section above
3. **Configure Domain** - Point to your server
4. **Setup SSL** - Enable HTTPS
5. **Test Deployment** - Run diagnostics
6. **Monitor Performance** - Watch resources
7. **Plan Backups** - Data safety first

---

See also:
- [QUICK_START.md](./QUICK_START.md) - 5-minute local setup
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Detailed deployment
- [Makefile Commands](./MAKEFILE_GUIDE.md) - All available commands
