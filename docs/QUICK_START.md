# 🚀 Quick Start Guide

Get the Alumni Portal running in minutes using the Makefile-based workflow.

---

## 📋 Prerequisites

- **Node.js**: 18+ (check with `node --version`)
- **npm or yarn**: Latest version
- **Docker** (optional, for containerized deployment): Latest version
- **Git**: Latest version

---

## ⚡ 5-Minute Setup

### Local Development

```bash
# 1. Clone and enter directory
git clone https://github.com/futurist-raghav/ALUMNI-PORTAL.git
cd ALUMNI-PORTAL

# 2. Initial setup (installs all dependencies)
make setup

# 3. Start everything (frontend + backend + database)
make dev

# 4. Open browser
# Frontend: http://localhost:8080
# Backend API: http://localhost:5000/api
```

That's it! 🎉

---

## 📚 Common Commands

```bash
# Development
make dev                 # Start everything (recommended for development)
make dev-frontend       # Just frontend
make dev-backend        # Just backend

# Building
make build              # Build for production
make clean              # Remove build artifacts

# Database
make db-start          # Start PostgreSQL
make db-migrate        # Run migrations
make db-reset          # Reset database (⚠️ deletes data)

# Production
make deploy            # Build + migrate (ready to deploy)
make start             # Run production build (after `make deploy`)

# Utilities
make help              # Show all commands
make diagnose          # Check system status
make info              # Project information

# Git
make status            # Git status
make logs              # Recent commits
make commit            # Interactive commit
```

See [MAKEFILE_GUIDE.md](./MAKEFILE_GUIDE.md) for detailed command documentation.

---

## 🐳 Docker Deployment

### Using Docker Compose (Simplest)

```bash
# Generate Docker files
make generate-docker

# Build Docker images
docker build -t alumni-portal:latest .

# Start everything
docker-compose -f docker-compose.full.yml up -d

# Run migrations
docker-compose -f docker-compose.full.yml exec backend npx prisma migrate deploy

# View services running
docker-compose -f docker-compose.full.yml ps

# View logs
docker-compose -f docker-compose.full.yml logs -f
```

### Production Domain Setup

Edit `.env` before starting:

```env
VITE_API_URL="https://yourdomain.com/api"
FRONTEND_URL="https://yourdomain.com"
```

---

## 📦 Project Structure

```
alumni-portal/
├── Makefile                 # 🎯 All build commands here
├── MAKEFILE_GUIDE.md        # Command documentation
├── DEPLOYMENT_GUIDE.md      # Full deployment instructions
│
├── src/                     # Frontend (React + TypeScript)
├── public/                  # Static files
├── dist/                    # Frontend build output
│
├── backend/
│   ├── src/                 # Express server
│   ├── prisma/              # Database schema
│   ├── dist/                # Backend build output
│   ├── Dockerfile           # Backend Docker image
│   └── package.json
│
├── docker-compose.full.yml  # Full-stack Docker setup
├── Dockerfile.frontend      # Frontend Docker image
├── nginx.conf               # Nginx config (for Dockerfile)
│
├── .env.example             # Frontend vars
├── backend/.env.example     # Backend vars
│
└── docs/                    # Full documentation
```

---

## 🔧 Configuration

### Environment Variables

**Frontend** (`.env`):
```env
VITE_API_URL="http://localhost:5000/api"
FRONTEND_URL="http://localhost:8080"
NODE_ENV="development"
```

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/alumni_portal"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-key"
PORT="5000"
NODE_ENV="development"
FRONTEND_URL="http://localhost:8080"
```

For production, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#step-3-configure-production-environment).

---

## ✅ Verify Everything Works

```bash
# Health checks in separate terminals:

# 1. Check frontend (open in browser)
curl http://localhost:8080

# 2. Check backend API
curl http://localhost:5000/api/status

# 3. Check database
psql -U postgres -d alumni_portal -c "SELECT 1;"

# Or use the diagnostic command
make diagnose
```

---

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Find and kill process
make diagnose  # Shows which ports are in use
make stop      # Kills all services

# Or manually
lsof -i :8080   # Check port 8080
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check database logs
make db-logs

# Reset database (⚠️ DELETES DATA)
make db-reset

# Check env vars
cat backend/.env
```

### Build Fails

```bash
# Clean and reinstall everything
make clean-deps

# Then rebuild
make build
```

### Port 5432 Already Taken

```bash
# Database service is already running on another port
# Change in docker-compose.full.yml or stop existing container
docker ps
docker stop <container_id>
```

---

## 📖 Next Steps

1. **Local Development**: Run `make dev` and start building features
2. **Read Full Docs**: Open [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for production
3. **Docker Setup**: See [DEPLOYMENT_GUIDE.md#docker-deployment](./DEPLOYMENT_GUIDE.md#docker-deployment-recommended)
4. **API Reference**: Check [docs/04_API_REFERENCE.md](./docs/04_API_REFERENCE.md)
5. **Git Workflow**: See [docs/12_CODE_CONVENTIONS.md](./docs/12_CODE_CONVENTIONS.md)

---

## 💡 Quick Tips

- **Don't forget migrations**: `make db-migrate` after pulling new code
- **Development database**: Automatically starts with `make dev`
- **Production database**: Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
- **Static files**: Upload to S3, CDN, or keep on server (`./uploads`)
- **Logs**: Always check `make db-logs` when something breaks

---

## 🚢 Deployment Paths

| Scenario | Command | Time |
|----------|---------|------|
| Local development | `make dev` | 2 min |
| Production (Docker) | `make deploy && docker-compose up -d` | 10 min |
| Production (Traditional) | `make setup && make build && npm start` | 15 min |
| Cleanup | `make clean-deps` | 5 min |

---

## 📞 Getting Help

- **Issues**: Check [GitHub Issues](https://github.com/futurist-raghav/ALUMNI-PORTAL/issues)
- **Docs**: Read [Documentation Index](./docs/00_DOCUMENTATION_INDEX.md)
- **Commands**: Run `make help` for all available commands
- **Specific Topics**: Each doc file has detailed instructions

---

## 📜 License

MIT - See [LICENSE](./LICENSE) for details

---

**Happy coding!** 🎓
