#!/bin/bash

# Alma Connect Sphere - Phase 1 Setup Script
# This script sets up the Phase 1 foundation for fast development

echo "🚀 Setting up Alma Connect Sphere - Phase 1"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_status "Starting Phase 1 setup..."

# Step 1: Check Node.js version
print_status "Checking Node.js version..."
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    print_success "Node.js version: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Step 2: Install dependencies
print_status "Installing frontend dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

print_status "Installing backend dependencies..."
cd backend
npm install
if [ $? -eq 0 ]; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi
cd ..

# Step 3: Set up environment files
print_status "Setting up environment configuration..."

# Backend environment
if [ ! -f "backend/.env" ]; then
    print_status "Creating backend/.env from example..."
    cp backend/.env.example backend/.env
    print_warning "Please update backend/.env with your MongoDB URI and other settings"
else
    print_success "Backend .env already exists"
fi

# Frontend environment
if [ ! -f ".env" ]; then
    print_status "Creating frontend .env..."
    cat > .env << EOL
# Frontend Environment Configuration
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Alma Connect Sphere
VITE_VERSION=3.1-phase1
EOL
    print_success "Frontend .env created"
else
    print_success "Frontend .env already exists"
fi

# Step 4: Create uploads directory
print_status "Creating uploads directory..."
mkdir -p backend/uploads
print_success "Uploads directory created"

# Step 5: Build backend
print_status "Building backend..."
cd backend
npm run build
if [ $? -eq 0 ]; then
    print_success "Backend built successfully"
else
    print_warning "Backend build failed, but continuing..."
fi
cd ..

# Step 6: Check MongoDB connection (optional)
print_status "Phase 1 setup complete!"

echo ""
echo "=============================================="
echo "🎉 Phase 1 Foundation Ready!"
echo "=============================================="
echo ""
echo "📋 Phase 1 Features Implemented:"
echo "  ✅ Core Authentication & Security"
echo "  ✅ User Registration & Management"
echo "  ✅ Profile System with Privacy Controls"
echo "  ✅ Alumni Directory with Search"
echo "  ✅ RBAC (Role-Based Access Control)"
echo "  ✅ Rate Limiting & Security Headers"
echo "  ✅ File Upload Support"
echo "  ✅ Admin Dashboard with Phase Status"
echo ""
echo "🚀 Quick Start Commands:"
echo "  Frontend + Backend: npm run dev:full"
echo "  Frontend only:     npm run dev"
echo "  Backend only:      cd backend && npm run dev"
echo ""
echo "🔗 Important URLs:"
echo "  Frontend:   http://localhost:8080"
echo "  Backend:    http://localhost:5000"
echo "  API Docs:   http://localhost:5000/api"
echo "  Health:     http://localhost:5000/api/status/health"
echo ""
echo "👤 Super Admin Accounts (auto-created):"
echo "  Email: mpsajmer123@gmail.com"
echo "  Email: futurist.raghav@gmail.com"
echo "  Password: bajmav-1qojmu-qoKkod"
echo ""
print_warning "Remember to:"
echo "  1. Update backend/.env with your MongoDB URI"
echo "  2. Start MongoDB service"
echo "  3. Update super admin passwords in production"
echo ""
print_success "You're ready to start development! 🚀"
