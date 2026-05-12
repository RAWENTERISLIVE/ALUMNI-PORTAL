.PHONY: help install setup dev build start clean lint test db-start db-migrate db-seed db-reset deploy stop logs status cap-init cap-sync cap-android cap-ios cap-icons pwa-build

# Color output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Default shell
SHELL := /bin/bash

# Project variables
PROJECT_NAME := mpsajmer-connect
FRONTEND_PORT := 8080
BACKEND_PORT := 5000
DB_PORT := 5432
NODE_ENV ?= development
CLOUDFLARE_ACCOUNT_ID ?= fe22ba5acbed9f6925bb8d7ea1ee8a4d

help: ## Show this help message
	@echo "$(CYAN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║$(NC)    $(GREEN)MPSAJMER CONNECT - Single Server Deployment$(NC)                $(CYAN)║$(NC)"
	@echo "$(CYAN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)📋 Available Commands:$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} { \
		if (/^[a-zA-Z_-]+:.*?##.*$$/) { \
			printf "  $(CYAN)%-20s$(NC) %s\n", $$1, $$2 \
		} \
		else if (/^## /) { \
			printf "\n$(YELLOW)%s$(NC)\n", substr($$1,4) \
		} \
	}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(CYAN)Example Usage:$(NC)"
	@echo "  make setup          # Setup project first time"
	@echo "  make dev            # Start development environment"
	@echo "  make build          # Build production artifacts"
	@echo "  make deploy         # Deploy to Cloudflare"
	@echo "  make pwa-build      # Build PWA (with service worker)"
	@echo "  make cap-sync       # Sync web build to native iOS/Android"
	@echo "  make cap-android    # Open Android Studio"
	@echo "  make cap-ios        # Open Xcode for iOS"
	@echo ""

## 🔧 Setup Commands

install: ## Install all dependencies
	@echo "$(CYAN)Installing dependencies...$(NC)"
	npm install
	cd backend && npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

setup: install ## Initial project setup (install deps + environment)
	@echo "$(CYAN)Setting up project...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env 2>/dev/null || echo "$(YELLOW)⚠ .env.example not found, using defaults$(NC)"; \
	fi
	@if [ ! -f backend/.env ]; then \
		cp backend/.env.example backend/.env 2>/dev/null || echo "$(YELLOW)⚠ backend/.env.example not found, using defaults$(NC)"; \
	fi
	@echo "$(GREEN)✓ Project setup complete$(NC)"
	@echo "$(YELLOW)📝 Make sure to configure .env files with your secrets$(NC)"

## 🚀 Development Commands

dev: ## Start development servers (frontend + backend + db)
	@echo "$(CYAN)Starting development environment...$(NC)"
	@echo "$(CYAN)Frontend: http://localhost:$(FRONTEND_PORT)$(NC)"
	@echo "$(CYAN)Backend:  http://localhost:$(BACKEND_PORT)$(NC)"
	@echo "$(CYAN)Database: localhost:$(DB_PORT)$(NC)"
	npm run dev:full

dev-frontend: ## Start only frontend development server
	@echo "$(CYAN)Starting frontend on port $(FRONTEND_PORT)...$(NC)"
	npm run dev

dev-backend: ## Start only backend development server
	@echo "$(CYAN)Starting backend on port $(BACKEND_PORT)...$(NC)"
	cd backend && npm run dev

## 🏗️  Build Commands

build: clean ## Build both frontend and backend for production
	@echo "$(CYAN)Building frontend...$(NC)"
	npm run build
	@echo "$(GREEN)✓ Frontend build complete$(NC)"
	@echo ""
	@echo "$(CYAN)Building backend...$(NC)"
	cd backend && npm run build
	@echo "$(GREEN)✓ Backend build complete$(NC)"
	@echo ""
	@echo "$(GREEN)✓ Build complete - ready for deployment$(NC)"

build-frontend: ## Build only frontend
	@echo "$(CYAN)Building frontend...$(NC)"
	npm run build
	@echo "$(GREEN)✓ Frontend build complete$(NC)"

build-backend: ## Build only backend
	@echo "$(CYAN)Building backend...$(NC)"
	cd backend && npm run build
	@echo "$(GREEN)✓ Backend build complete$(NC)"

build-dev: ## Build in development mode with sourcemaps
	@echo "$(CYAN)Building frontend (dev mode)...$(NC)"
	npm run build:dev
	@echo "$(GREEN)✓ Frontend build complete$(NC)"

## 🗄️  Database Commands

db-start: ## Start PostgreSQL database with Docker Compose
	@echo "$(CYAN)Starting PostgreSQL database...$(NC)"
	cd backend && docker-compose up -d
	@echo "$(GREEN)✓ Database started on port $(DB_PORT)$(NC)"
	@sleep 2

db-stop: ## Stop PostgreSQL database
	@echo "$(CYAN)Stopping database...$(NC)"
	cd backend && docker-compose down
	@echo "$(GREEN)✓ Database stopped$(NC)"

db-migrate: ## Run database migrations
	@echo "$(CYAN)Running database migrations...$(NC)"
	cd backend && npx prisma migrate deploy
	@echo "$(GREEN)✓ Migrations complete$(NC)"

db-seed: ## Seed database with initial data
	@echo "$(CYAN)Seeding database...$(NC)"
	cd backend && npx prisma db seed 2>/dev/null || echo "$(YELLOW)No seed script configured$(NC)"
	@echo "$(GREEN)✓ Database seeded$(NC)"

db-reset: ## Reset database (WARNING: destroys all data)
	@echo "$(RED)⚠️  WARNING: This will delete all database data!$(NC)"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo ""; \
		$(MAKE) db-stop; \
		cd backend && docker-compose down -v; \
		$(MAKE) db-start; \
		$(MAKE) db-migrate; \
		$(MAKE) db-seed; \
		echo "$(GREEN)✓ Database reset complete$(NC)"; \
	else \
		echo ""; \
		echo "$(YELLOW)Operation cancelled$(NC)"; \
	fi

db-logs: ## View database logs
	cd backend && docker-compose logs db

## 🧹 Cleanup Commands

clean: ## Clean build artifacts
	@echo "$(CYAN)Cleaning build artifacts...$(NC)"
	rm -rf dist/
	cd backend && npm run clean
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

clean-deps: ## Clean node_modules and reinstall
	@echo "$(CYAN)Cleaning dependencies...$(NC)"
	rm -rf node_modules package-lock.json
	rm -rf backend/node_modules backend/package-lock.json
	npm install
	cd backend && npm install
	@echo "$(GREEN)✓ Dependencies reinstalled$(NC)"

## ✅ Quality Commands

lint: ## Run linter on frontend code
	@echo "$(CYAN)Linting frontend...$(NC)"
	npm run lint
	@echo "$(GREEN)✓ Linting complete$(NC)"

test: ## Run tests (if configured)
	@echo "$(YELLOW)⚠ Tests not yet configured$(NC)"

## 📦 Production Commands

start: ## Start production server (requires build first)
	@echo "$(CYAN)Starting production server...$(NC)"
	@if [ ! -d "dist" ] || [ ! -d "backend/dist" ]; then \
		echo "$(RED)Error: Build artifacts not found. Run 'make build' first.$(NC)"; \
		exit 1; \
	fi
	@echo "$(CYAN)Frontend: http://localhost:$(FRONTEND_PORT)$(NC)"
	@echo "$(CYAN)Backend:  http://localhost:$(BACKEND_PORT)$(NC)"
	npm run start 2>/dev/null || (cd backend && npm start)

stop: ## Stop all services
	@echo "$(CYAN)Stopping services...$(NC)"
	@pkill -f "vite" || true
	@pkill -f "node dist/server.js" || true
	$(MAKE) db-stop
	@echo "$(GREEN)✓ Services stopped$(NC)"

## 🚢 Deployment Commands

deploy: cf-deploy ## Deploy to Cloudflare (Pages + Workers + D1)

deploy-local: build db-migrate ## Deploy application locally (Local/Docker)
	@echo "$(GREEN)✓ Application ready for local deployment!$(NC)"
	@echo ""
	@echo "$(CYAN)Build Summary:$(NC)"
	@echo "  Frontend: ./dist"
	@echo "  Backend:  ./backend/dist"
	@echo ""
	@echo "$(CYAN)Next steps:$(NC)"
	@echo "  1. Set production environment variables in .env files"
	@echo "  2. Run: make start"
	@echo ""

deploy-docker: ## Create Docker image for deployment
	@echo "$(CYAN)Creating Docker image...$(NC)"
	@if [ ! -f "Dockerfile" ]; then \
		echo "$(RED)Dockerfile not found.$(NC)"; \
		exit 1; \
	fi
	docker build -t $(PROJECT_NAME):latest .
	@echo "$(GREEN)✓ Docker image created: $(PROJECT_NAME):latest$(NC)"
	@echo "$(CYAN)To run: docker run -p 8080:8080 -p 5000:5000 $(PROJECT_NAME):latest$(NC)"

## ☁️  Cloudflare Deployment
cf-deploy: build-frontend cf-deploy-backend cf-deploy-frontend ## Full deployment to Cloudflare
	@echo "$(GREEN)✓ Full Cloudflare deployment complete!$(NC)"

cf-deploy-frontend: ## Deploy frontend to Cloudflare Workers (Assets)
	@echo "$(CYAN)Deploying frontend to Cloudflare Workers...$(NC)"
	CLOUDFLARE_ACCOUNT_ID=$(CLOUDFLARE_ACCOUNT_ID) npx wrangler deploy
	@echo "$(GREEN)✓ Frontend deployed to Cloudflare Workers$(NC)"

cf-deploy-backend: ## Deploy backend to Cloudflare Workers
	@echo "$(CYAN)Deploying backend to Cloudflare Workers...$(NC)"
	cd backend-worker && CLOUDFLARE_ACCOUNT_ID=$(CLOUDFLARE_ACCOUNT_ID) npx wrangler deploy
	@echo "$(GREEN)✓ Backend deployed to Cloudflare Workers$(NC)"

cf-migrate: ## Apply D1 migrations to remote database
	@echo "$(CYAN)Applying D1 migrations...$(NC)"
	npx wrangler d1 migrations apply DB --remote
	@echo "$(GREEN)✓ D1 migrations applied$(NC)"

cf-setup: ## Initial Cloudflare setup (D1 creation + R2 bucket)
	@echo "$(CYAN)Setting up Cloudflare resources...$(NC)"
	npx wrangler d1 create mpsajmer-connect-db || true
	npx wrangler r2 bucket create mpsajmer-connect-uploads || true
	$(MAKE) cf-migrate
	@echo "$(GREEN)✓ Cloudflare setup complete$(NC)"

## 📝 Git Commands

commit: ## Commit changes with interactive selection
	@echo "$(CYAN)Preparing commit...$(NC)"
	@git add -A
	@echo "$(CYAN)Running commit composer...$(NC)"
	@git commit --interactive || echo "$(YELLOW)Commit cancelled$(NC)"

status: ## Show git status
	@git status

logs: ## Show recent git logs
	@git log --oneline -10

## 📊 Utility Commands

info: ## Show project information
	@echo "$(CYAN)Project Information:$(NC)"
	@echo "  Name: $(PROJECT_NAME)"
	@echo "  Node Version: $$(node --version)"
	@echo "  NPM Version: $$(npm --version)"
	@echo "  Frontend Port: $(FRONTEND_PORT)"
	@echo "  Backend Port: $(BACKEND_PORT)"
	@echo "  Database Port: $(DB_PORT)"

diagnose: ## Diagnose common issues
	@echo "$(CYAN)Running diagnostics...$(NC)"
	@echo ""
	@echo "$(CYAN)Port Status:$(NC)"
	@lsof -i :$(FRONTEND_PORT) >/dev/null 2>&1 && echo "  ✓ Port $(FRONTEND_PORT) is in use" || echo "  ✓ Port $(FRONTEND_PORT) is available"
	@lsof -i :$(BACKEND_PORT) >/dev/null 2>&1 && echo "  ✓ Port $(BACKEND_PORT) is in use" || echo "  ✓ Port $(BACKEND_PORT) is available"
	@lsof -i :$(DB_PORT) >/dev/null 2>&1 && echo "  ✓ Port $(DB_PORT) is in use" || echo "  ✓ Port $(DB_PORT) is available"
	@echo ""
	@echo "$(CYAN)Dependencies:$(NC)"
	@node --version | xargs echo "  Node:"
	@npm --version | xargs echo "  NPM:"
	@docker --version | xargs echo "  Docker:" 2>/dev/null || echo "  Docker: Not installed"
	@echo ""
	@echo "$(CYAN)Git Status:$(NC)"
	@git status --short 2>/dev/null || echo "  Not a git repository"
	@echo ""

.DEFAULT_GOAL := help

## 📱 Mobile & PWA Commands

cap-icons: ## Generate all PWA and native mobile assets (Icons/Splash)
	@echo "$(CYAN)Generating padded native assets...$(NC)"
	@npm install --save-dev sharp @capacitor/assets 2>/dev/null | tail -1
	node scripts/prepare-native-assets.mjs
	npx @capacitor/assets generate --assetPath assets-native --ios --android
	@echo "$(GREEN)✓ Native icons and splash screens updated$(NC)"

cap-init: ## Initialize Capacitor (run once after first clone)
	@echo "$(CYAN)Initializing Capacitor...$(NC)"
	npx cap init "MPS Ajmer Connect" "in.mpsajmer.alumni" --web-dir dist
	@echo "$(GREEN)✓ Capacitor initialized$(NC)"

cap-add-android: ## Add Android platform to Capacitor project
	@echo "$(CYAN)Adding Android platform...$(NC)"
	npx cap add android
	@echo "$(GREEN)✓ Android platform added - see android/ directory$(NC)"

cap-add-ios: ## Add iOS platform to Capacitor project
	@echo "$(CYAN)Adding iOS platform...$(NC)"
	npx cap add ios
	@echo "$(GREEN)✓ iOS platform added - see ios/ directory$(NC)"

pwa-build: ## Build frontend with PWA service worker enabled
	@echo "$(CYAN)Building PWA...$(NC)"
	npm run build
	@echo "$(GREEN)✓ PWA build complete (service worker + manifest generated)$(NC)"
	@echo "$(CYAN)Generated files:$(NC)"
	@ls dist/sw.js dist/manifest.webmanifest 2>/dev/null && echo "  ✓ sw.js & manifest.webmanifest present" || echo "  $(YELLOW)⚠ Check dist/ for sw.js and manifest.webmanifest$(NC)"

cap-sync: pwa-build ## Build PWA then sync to Android and iOS native projects
	@echo "$(CYAN)Syncing web build to native platforms...$(NC)"
	npx cap sync
	@echo "$(GREEN)✓ Synced to Android and iOS$(NC)"

cap-android: cap-sync ## Sync and open Android Studio
	@echo "$(CYAN)Opening Android Studio...$(NC)"
	npx cap open android
	@echo "$(YELLOW)📌 In Android Studio: Build → Generate Signed Bundle → .aab → upload to Play Console$(NC)"

cap-ios: cap-sync ## Sync and open Xcode for iOS
	@echo "$(CYAN)Opening Xcode...$(NC)"
	npx cap open ios
	@echo "$(YELLOW)📌 In Xcode: Product → Archive → Distribute App → App Store Connect$(NC)"

cap-run-android: cap-sync ## Run on connected Android device / emulator
	@echo "$(CYAN)Running on Android...$(NC)"
	npx cap run android

cap-run-ios: cap-sync ## Run on iOS Simulator
	@echo "$(CYAN)Running on iOS Simulator...$(NC)"
	npx cap run ios
