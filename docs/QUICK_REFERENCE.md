# 🚀 QUICK REFERENCE CARD

**Quick lookup for Alumni Portal deployment & commands**

---

## ⚡ ONE-LINERS

| Task | Command |
|------|---------|
| Start locally | `make setup && make dev` |
| Build production | `make build` |
| Deploy ready | `make deploy` |
| Start production | `make start` |
| Check status | `make diagnose` |
| All commands | `make help` |

---

## 📍 WHERE TO START?

```
Choose your situation:

🎓 Learning/Testing?
  └─ Run: make dev
     Read: QUICK_START.md

🏫 School Server?
  └─ Run: bash scripts/setup-local.sh
     Read: HOSTING_GUIDE.md (Local Server)

☁️ Cloud Provider?
  └─ Read: DEPLOYMENT_OPTIONS.md
     Choose platform
     Run corresponding setup script

🚀 Production NOW?
  └─ Read: DEPLOYMENT_MASTER_GUIDE.md
```

---

## 📚 CORE DOCUMENTATION

| Document | When to Read | Time |
|----------|-------------|------|
| [DEPLOYMENT_MASTER_GUIDE.md](./DEPLOYMENT_MASTER_GUIDE.md) | Start here! | 10 min |
| [DEPLOYMENT_OPTIONS.md](./DEPLOYMENT_OPTIONS.md) | Choose platform | 5 min |
| [QUICK_START.md](./QUICK_START.md) | Try locally | 5 min |
| [HOSTING_GUIDE.md](./HOSTING_GUIDE.md) | Specific platform | 15 min |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Full setup | 30 min |
| [MAKEFILE_GUIDE.md](./MAKEFILE_GUIDE.md) | All commands | 10 min |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Project layout | 10 min |

---

## 🔧 MAKEFILE COMMANDS BY CATEGORY

### Setup
```bash
make install        # Install dependencies
make setup          # First-time setup
make help          # Show all commands
```

### Development
```bash
make dev            # Start everything (frontend + backend + db)
make dev-frontend   # Frontend only
make dev-backend    # Backend only
```

### Build
```bash
make build              # Build both for production
make build-frontend     # Frontend only
make build-backend      # Backend only
make build-dev          # Development builds
```

### Database
```bash
make db-start       # Start PostgreSQL
make db-stop        # Stop PostgreSQL
make db-migrate     # Run migrations
make db-seed        # Seed initial data
make db-reset       # Reset (⚠️ deletes data)
make db-logs        # View logs
```

### Production
```bash
make deploy         # Build + migrate (ready to deploy)
make start          # Run production server
make stop           # Stop all services
make deploy-docker  # Create Docker image
```

### Utilities
```bash
make status         # Git status
make logs          # Git logs  
make info          # Project info
make diagnose      # Check system
make clean         # Remove build artifacts
make lint          # Run linter
```

---

## 🌐 PLATFORM QUICK SETUP

### Local Server (30 sec)
```bash
bash scripts/setup-local.sh
```

### DigitalOcean (SSH + 30 sec)
```bash
bash <(curl -s https://raw.githubusercontent.com/futurist-raghav/ALUMNI-PORTAL/main/scripts/setup-digitalocean.sh)
```

### Hetzner (SSH + 30 sec)
```bash
bash <(curl -s https://raw.githubusercontent.com/futurist-raghav/ALUMNI-PORTAL/main/scripts/setup-hetzner.sh)
```

### Generic VPS (SSH + 30 sec)
```bash
bash <(curl -s https://raw.githubusercontent.com/futurist-raghav/ALUMNI-PORTAL/main/scripts/setup-vps.sh)
```

### Heroku (Git + 5 min)
```bash
heroku create alumni-portal
git push heroku main
```

---

## 💻 COMMON WORKFLOWS

### First-Time Setup
```bash
make setup
make dev
# Opens http://localhost:8080
```

### Development Cycle
```bash
make dev            # In terminal 1
# Make code changes
make lint          # Check code
git add .
make commit        # Git commit
```

### Production Deployment
```bash
make build          # Build both
make start          # Test locally
# If OK, push to server
docker-compose -f docker-compose.full.yml up -d
```

### Database Operations
```bash
make db-start       # Start DB
make db-migrate     # Update schema
make db-seed        # Add initial data
./db.sh backup      # Backup database
./db.sh restore backup.sql  # Restore
```

---

## ⚠️ COMMON ISSUES

| Issue | Solution |
|-------|----------|
| Port already in use | `make stop` then `make dev` |
| DB won't connect | `make db-logs` to check issue |
| Build fails | `make clean-deps` then `make build` |
| Permission denied | `chmod +x *.sh` then retry |
| Out of memory | Add swap or use larger machine |
| Can't access frontend | Check firewall rules |

---

## 📊 COST COMPARISON (Monthly)

```
FREE:
  └─ Local server

$3-10:
  ├─ Hetzner
  ├─ DigitalOcean
  └─ Hostinger

$5-20:
  ├─ Railway
  └─ Linode

$7-50:
  └─ Heroku

$30+:
  └─ AWS/Enterprise
```

---

## 🎯 DEPLOYMENT PATHS

### Path 1: Learn Locally (5 min)
```
1. make setup
2. make dev
3. Visit http://localhost:8080
```

### Path 2: Deploy to Cloud (15 min)
```
1. Read DEPLOYMENT_OPTIONS.md
2. Pick platform or run: bash scripts/setup-X.sh
3. Access at domain.com
```

### Path 3: School Server (30 min)
```
1. Run: bash scripts/setup-local.sh
2. Answer setup questions
3. Access from school network
```

---

## 📱 PLATFORM DIFFICULTY

```
EASIEST (5 min)
  ├─ Local dev
  ├─ Heroku
  └─ Railway

EASY (15 min)
  ├─ DigitalOcean
  ├─ Hetzner
  └─ Linode

MEDIUM (30 min)
  ├─ Generic VPS
  └─ Local server

COMPLEX (1 hour+)
  ├─ AWS
  ├─ Azure
  └─ Kubernetes
```

---

## 🔗 QUICK LINKS

| Resource | URL |
|----------|-----|
| GitHub | https://github.com/futurist-raghav/ALUMNI-PORTAL |
| DigitalOcean | https://digitalocean.com |
| Heroku | https://heroku.com |
| Railway | https://railway.app |
| AWS | https://aws.amazon.com |
| Docker | https://docker.com |

---

## 📋 CHECKLIST BEFORE DEPLOY

- [ ] Read DEPLOYMENT_MASTER_GUIDE.md
- [ ] Chose a platform
- [ ] Have domain registered (optional)
- [ ] Have credentials for platform
- [ ] Read platform-specific guide
- [ ] Ran setup script
- [ ] Configured environment (.env)
- [ ] Built application (make build)
- [ ] Tested locally (make start)
- [ ] Enabled SSL/HTTPS
- [ ] Setup backups
- [ ] Created admin account
- [ ] Verified deployment

---

## 🆘 NEED HELP?

| Question | Answer |
|----------|--------|
| How to start? | Run `make help` |
| How to choose platform? | Read DEPLOYMENT_OPTIONS.md |
| How to deploy? | Follow DEPLOYMENT_MASTER_GUIDE.md |
| How to fix issues? | Run `make diagnose` |
| What's the project layout? | Read PROJECT_STRUCTURE.md |
| All available commands? | Read MAKEFILE_GUIDE.md |

---

## 🚀 YOU'RE READY!

1. **Read:** [DEPLOYMENT_MASTER_GUIDE.md](./DEPLOYMENT_MASTER_GUIDE.md)
2. **Choose:** A platform from this list
3. **Deploy:** Follow the guide
4. **Access:** Open in browser
5. **Build:** Start creating features!

---

**Last Updated:** March 2026  
**Print this card!** → Keep it handy for quick reference

Happy Deploying! 🎉
