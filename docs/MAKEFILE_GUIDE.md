# 📚 Makefile Commands Guide

## Overview

This project uses a **Makefile** to manage development, building, and deployment tasks. All commands are designed for **single-server deployment** where both frontend and backend run on the same server.

## Quick Start

```bash
# First time setup
make setup

# Start development
make dev

# Build for production
make build

# Deploy to production
make deploy
make start
```

---

## 🔧 Setup Commands

### `make install`
Installs all Node.js dependencies for both frontend and backend.

### `make setup`
Complete initial project setup:
- Installs dependencies
- Copies `.env.example` to `.env` if it doesn't exist
- Prepares the project for development

```bash
make setup
```

---

## 🚀 Development Commands

### `make dev`
Starts the complete development environment with:
- Frontend on `http://localhost:8080`
- Backend on `http://localhost:5000`
- PostgreSQL database on `localhost:5432`

```bash
make dev
```

### `make dev-frontend`
Start only the React frontend development server.

```bash
make dev-frontend
```

### `make dev-backend`
Start only the Express backend server with hot-reload.

```bash
make dev-backend
```

---

## 🏗️ Build Commands

### `make build`
Builds both frontend and backend for production:
- Frontend: Vite static build → `./dist`
- Backend: TypeScript compilation → `./backend/dist`

```bash
make build
```

### `make build-frontend`
Build only the frontend.

### `make build-backend`
Build only the backend.

### `make build-dev`
Build frontend in development mode with sourcemaps.

---

## 🗄️ Database Commands

### `make db-start`
Start PostgreSQL database using Docker Compose.

```bash
make db-start
```

### `make db-stop`
Stop the PostgreSQL database.

```bash
make db-stop
```

### `make db-migrate`
Run Prisma database migrations.

```bash
make db-migrate
```

### `make db-seed`
Seed the database with initial data (if seed script exists).

```bash
make db-seed
```

### `make db-reset`
⚠️ **WARNING**: Completely reset database (asks for confirmation).
- Stops docker services
- Removes volumes
- Restarts database
- Runs migrations

```bash
make db-reset
```

### `make db-logs`
View database container logs.

```bash
make db-logs
```

---

## 🧹 Cleanup Commands

### `make clean`
Remove build artifacts:
- Removes `dist/` directory
- Removes `backend/dist/` directory

```bash
make clean
```

### `make clean-deps`
Remove all node_modules and reinstall from scratch.

```bash
make clean-deps
```

---

## ✅ Quality Commands

### `make lint`
Run ESLint on frontend code.

```bash
make lint
```

### `make test`
Run tests (currently not configured).

```bash
make test
```

---

## 📦 Production Commands

### `make start`
Start the production server.

**Prerequisites**: 
- Run `make build` first
- Database must be running (`make db-start`)

```bash
make start
```

### `make stop`
Stop all running services (frontend, backend, database).

```bash
make stop
```

---

## 🚢 Deployment Commands

### `make deploy`
Full deployment pipeline:
1. Clean build artifacts
2. Build both frontend and backend
3. Run database migrations
4. Output deployment ready status

```bash
make deploy
```

### `make deploy-docker`
Create a Docker image for deployment.

**Prerequisites**: Dockerfile must exist

```bash
make deploy-docker
```

### `make generate-docker`
Auto-generate a Dockerfile for single-server deployment.

Generates a multi-stage Dockerfile that:
- Builds frontend React app
- Builds backend Node.js server
- Exposes ports 8080 (frontend) and 5000 (backend)

```bash
make generate-docker
docker build -t mpsajmer-connect:latest .
docker run -p 8080:8080 -p 5000:5000 mpsajmer-connect:latest
```

---

## 📝 Git Commands

### `make commit`
Interactive git commit with staging all changes.

### `make status`
Show current git status.

### `make logs`
Show last 10 git commits.

---

## 📊 Utility Commands

### `make info`
Display project information:
- Project name
- Node and NPM versions
- Port configuration

```bash
make info
```

### `make diagnose`
Run diagnostics:
- Check port availability
- Verify dependencies installed
- Check git status

```bash
make diagnose
```

### `make help`
Display all available commands (default).

```bash
make help
```

---

## 🎯 Common Workflows

### Local Development
```bash
# First time
make setup

# Every time you start
make dev

# Run other commands in another terminal
make db-logs
make lint
```

### Testing Changes Locally
```bash
# Make changes to code
make build
make start
# Open http://localhost:8080
```

### Deploying to Production
```bash
# In your deployment environment
make setup           # Install deps
make build          # Build artifacts
make db-start       # Start database
make db-migrate     # Run migrations
make start          # Start servers

# Or all at once
make deploy
make start
```

### Docker Deployment
```bash
make generate-docker
docker build -t mpsajmer-connect:latest .
docker run -d -p 8080:8080 -p 5000:5000 mpsajmer-connect:latest
```

---

## 📋 Project Structure (Single Server)

```
mpsajmer-connect/
├── src/                    # Frontend React code
├── public/                 # Static frontend assets
├── dist/                   # Frontend build output
├── backend/
│   ├── src/               # Backend Express code
│   ├── dist/              # Backend build output
│   ├── prisma/            # Database schema
│   ├── docker-compose.yml # PostgreSQL setup
│   └── package.json
├── Makefile               # All build/deploy commands
├── .env                   # Environment variables
└── docker-compose.yml     # (optional) Full stack compose
```

---

## 🔒 Environment Variables

See `.env.example` and `backend/.env.example` for all available configuration options.

Key variables:
- `VITE_API_URL`: Frontend API endpoint
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing key
- `PORT`: Backend server port
- `NODE_ENV`: development/production

---

## ⚡ Performance Tips

1. **Development**: Use `make dev` for hot-reload on both frontend and backend
2. **Production**: Always run `make build` before `make start`
3. **Database**: Use `make db-migrate` instead of `prisma migrate dev`
4. **Cleanup**: Run `make clean` before major deployments

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
make diagnose  # Check which ports are in use
make stop      # Kill all processes
```

### Database Connection Issues
```bash
make db-logs   # Check database logs
make db-reset  # Reset database (WARNING!)
```

### Build Failures
```bash
make clean-deps  # Reinstall all dependencies
make build       # Try building again
```

---

## 📞 Support

For more information, see:
- [Setup Guide](./docs/10_SETUP_INSTALLATION_GUIDE.md)
- [Development Guide](./docs/11_DEVELOPMENT_GUIDE.md)
- [Deployment Guide](./docs/06_DEPLOYMENT_AND_TESTING.md)
