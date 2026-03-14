# 10. Setup & Installation Guide

## System Requirements

### Prerequisites
- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher (or use `bun`)
- **PostgreSQL**: v14+ (for local development)
- **Git**: For version control
- **VS Code** (recommended): With TypeScript support

### Optional but Recommended
- **Docker**: For PostgreSQL containerization
- **Postman** or **Insomnia**: For API testing
- **DBeaver** or **pgAdmin**: For database management

---

## Installation Steps

### 1. Clone Repository
```bash
git clone https://github.com/futurist-raghav/ALUMNI-PORTAL.git
cd ALUMNI-PORTAL-1
```

### 2. Install Dependencies

#### Frontend + Backend (Monorepo Structure)
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies (already in root)
npm install
```

**Using Bun** (faster alternative):
```bash
bun install
cd backend && bun install && cd ..
```

### 3. Set Up Environment Variables

#### Frontend Environment (`.env` in root)
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Other configs (if needed)
VITE_APP_NAME=Alma Connect Sphere
```

#### Backend Environment (`.env` in `backend/`)
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/alumni_db

# JWT Secrets
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_here_min_32_chars

# Server
PORT=5000
NODE_ENV=development

# Email (if implemented)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Upload
MAX_FILE_SIZE=52428800  # 50MB in bytes
UPLOAD_DIR=./uploads
```

### 4. Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL container
docker compose up -d

# Verify container is running
docker ps
```

#### Option B: Local PostgreSQL
```bash
# Create database
createdb alumni_db

# Verify connection
psql -U postgres -d alumni_db -c "SELECT 1;"
```

### 5. Run Prisma Migrations

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database (optional)
npx prisma db seed

# View database in Prisma Studio
npx prisma studio
```

### 6. Start Development Servers

#### Option A: Full Application (Frontend + Backend)
```bash
# Run from root directory
npm run dev:full

# This starts:
# - Backend: http://localhost:5000
# - Frontend: http://localhost:5173
```

#### Option B: Backend Only
```bash
cd backend
npm run dev

# Backend runs on http://localhost:5000
```

#### Option C: Frontend Only
```bash
npm run dev

# Frontend runs on http://localhost:5173
```

### 7. Verify Installation

**Check Backend Health**:
```bash
curl http://localhost:5000/api/status/health

# Expected response:
# { "success": true, "message": "Backend is healthy" }
```

**Check Frontend**:
Direct your browser to `http://localhost:5173` and verify the landing page loads.

---

## Post-Installation Setup

### 1. Create Super Admin Account
A super admin is automatically created on first startup with these credentials:

**Super Admin Email(s)** (hardcoded in backend):
- `admin@alumniportal.com`
- `superadmin@alumniportal.com`

To add more super admins, modify the backend startup code or use the admin panel.

**Default Flow**:
1. Super admin account is auto-created if it doesn't exist
2. Use the admin email to login directly (bypasses pending approval)
3. Access the Admin Dashboard at `/admin`

### 2. Create Test Users
Use the registration form at `/register` with test data:

```
Email: student1@example.com
Password: TestPassword123!
Name: Test Student
Admission Number: 501/21
```

Or use the seed script:
```bash
cd backend
npx prisma db seed
```

### 3. Configure Email (Optional)
If email notifications are needed, update `.env` with valid SMTP credentials.

---

## Build for Production

### Frontend Build
```bash
# Generate optimized bundle
npm run build

# Output: dist/ directory (ready to deploy)
```

### Backend Build
```bash
cd backend

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

---

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check Prisma connection
cd backend
npx prisma db execute --stdin < /dev/null
```

### Port Already in Use
```bash
# Find process on port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 npm run dev:full
```

### Prisma Migration Failed
```bash
# Reset database (WARNING: deletes all data)
cd backend
npx prisma migrate reset

# Re-run migrations
npx prisma migrate dev
```

### Missing Dependencies
```bash
# Clear node_modules and reinstall
rm -rf node_modules backend/node_modules
npm install
cd backend && npm install && cd ..
```

### Hot Reload Not Working
```bash
# Restart dev server
# Clear npm cache if persistent
npm cache clean --force

# Use --force flag
npm run dev -- --force
```

---

## IDE Setup (VS Code)

### Recommended Extensions
1. **ES7+ React/Redux/React-Native snippets** - dsznajder.es7-react-js-snippets
2. **TypeScript Vue Plugin (Volar)** - Vue.volar
3. **Tailwind CSS IntelliSense** - bradlc.vscode-tailwindcss
4. **Prettier - Code formatter** - esbenp.prettier-vscode
5. **ESLint** - dbaeumer.vscode-eslint
6. **Prisma** - prisma.prisma
7. **Thunder Client** - rangav.vscode-thunder-client
8. **Database Client** - cweijan.vscode-database-client2

### VS Code Settings (`.vscode/settings.json`)
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## NPM Scripts Reference

| Command | Purpose |
|---------|---------|
| `npm run dev:full` | Start frontend + backend |
| `npm run dev` | Start frontend only |
| `npm run build` | Build frontend |
| `npm run preview` | Preview production build |
| `npm run lint` | Lint frontend code |
| `npm run type-check` | TypeScript type checking |
| `npm run format` | Format code with Prettier |

---

## Database Schema Viewing

### Prisma Studio
Interactive web UI to view and edit database:
```bash
cd backend
npx prisma studio

# Opens at http://localhost:5555
```

### Generate ER Diagram
```bash
cd backend
npx prisma db execute --stdin < prisma/schema.prisma
```

---

## Testing Setup

### Run Backend Tests
```bash
cd backend
npm run test
```

### Run Integration Tests
```bash
./test-integration.sh
```

### Run Registration Flow Tests
```bash
./test-registration.sh
```

---

## Next Steps

1. **Review** [02_ARCHITECTURE.md](02_ARCHITECTURE.md) for system understanding
2. **Explore** [09_BACKEND_CONTROLLERS.md](09_BACKEND_CONTROLLERS.md) for API details
3. **Build UI** using [08_FRONTEND_COMPONENTS.md](08_FRONTEND_COMPONENTS.md)
4. **Check** frontend features in [11_DEVELOPMENT_GUIDE.md](11_DEVELOPMENT_GUIDE.md)
