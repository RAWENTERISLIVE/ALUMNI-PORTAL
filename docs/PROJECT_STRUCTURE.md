# 📁 Project Structure Guide

Comprehensive overview of the MPSAJMER CONNECT project structure optimized for single-server deployment.

---

## Root-Level Files

```
mpsajmer-connect/
├── 📄 Makefile                     # 🎯 All build/deploy commands
├── 📄 MAKEFILE_GUIDE.md            # Complete command documentation
├── 📄 QUICK_START.md               # 5-minute setup guide
├── 📄 DEPLOYMENT_GUIDE.md          # Production deployment
├── 📄 PROJECT_STRUCTURE.md         # This file
│
├── 📄 package.json                 # Frontend dependencies & scripts
├── 📄 package-lock.json            # Dependency lock file
├── 📄 tsconfig.json                # TypeScript config (root)
├── 📄 tsconfig.app.json            # Frontend TypeScript config
├── 📄 tsconfig.node.json           # Node TypeScript config
│
├── 📄 vite.config.ts               # Frontend build tool config
├── 📄 tailwind.config.ts           # CSS framework config
├── 📄 postcss.config.js            # CSS processor config
├── 📄 eslint.config.js             # Linter config
├── 📄 components.json              # Component UI config
│
├── 📄 index.html                   # Frontend entry point
├── 📄 .env.example                 # Example env variables
├── 📄 .gitignore                   # Git ignore rules
├── 📄 LICENSE                      # MIT License
├── 📄 README.md                    # Main project readme
│
├── 🐳 Docker Files
│   ├── 📄 Dockerfile               # Full-stack Docker image
│   ├── 📄 Dockerfile.frontend      # Frontend-only Docker
│   ├── 📄 docker-compose.full.yml  # Complete stack compose
│   └── 📄 nginx.conf               # Nginx reverse proxy config
│
├── 🛠️  Helper Scripts
│   ├── 📜 deploy.sh                # Interactive deployment wizard
│   ├── 📜 build.sh                 # Production build script
│   ├── 📜 db.sh                    # Database management
│   ├── 📜 setup-env.sh             # Environment setup helper
│   ├── 📜 setup-phase1.sh          # Phase 1 setup
│   ├── 📜 validate-phase1.sh       # Phase 1 validation
│   ├── 📜 quick-user-setup.sh      # Quick user setup
│   └── 📜 setup-test-users.sh      # Test users setup
│
├── 📁 src/                         # FRONTEND SOURCE
│   ├── 📄 main.tsx                 # React entry point
│   ├── 📄 App.tsx                  # Root component
│   ├── 📄 App.css                  # Root styles
│   ├── 📄 index.css                # Global styles
│   ├── 📄 vite-env.d.ts            # Vite types
│   │
│   ├── 📁 components/              # React components
│   │   ├── 📁 ui/                  # ShadCN UI components
│   │   ├── 📁 layout/              # Layout components
│   │   ├── 📁 forms/               # Form components
│   │   └── ... (other components)
│   │
│   ├── 📁 pages/                   # Page components
│   │   ├── 📁 auth/
│   │   ├── 📁 dashboard/
│   │   ├── 📁 profile/
│   │   ├── 📁 feed/
│   │   ├── 📁 jobs/
│   │   ├── 📁 events/
│   │   ├── 📁 groups/
│   │   ├── 📁 mentorship/
│   │   └── ... (other pages)
│   │
│   ├── 📁 services/                # API services & utilities
│   │   ├── api.ts                  # API client setup
│   │   ├── auth.ts                 # Auth service
│   │   ├── users.ts                # User service
│   │   └── ... (other services)
│   │
│   ├── 📁 contexts/                # React contexts
│   │   ├── AuthContext.tsx
│   │   └── ... (other contexts)
│   │
│   ├── 📁 hooks/                   # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   └── ... (other hooks)
│   │
│   ├── 📁 types/                   # TypeScript types
│   │   ├── index.ts
│   │   └── ... (type definitions)
│   │
│   ├── 📁 lib/                     # Utilities & helpers
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── ... (utilities)
│   │
│   └── 📁 integrations/            # Third-party integrations
│       ├── 📁 google/
│       ├── 📁 stripe/
│       └── ... (other integrations)
│
├── 📁 public/                      # STATIC ASSETS
│   ├── 📄 robots.txt
│   └── ... (images, icons, etc)
│
├── 📁 dist/                        # FRONTEND BUILD OUTPUT
│   ├── index.html                  # Built HTML
│   ├── assets/                     # Bundled JS/CSS/images
│   └── ... (other built files)
│
├── 📁 backend/                     # BACKEND SOURCE
│   ├── 📄 package.json             # Backend dependencies
│   ├── 📄 package-lock.json
│   ├── 📄 tsconfig.json            # Backend TypeScript config
│   ├── 📄 prisma.config.ts         # Prisma config
│   ├── 📄 .env.example             # Example backend env
│   ├── 📄 Dockerfile               # Backend Docker image
│   ├── 📄 docker-compose.yml       # DB-only compose (legacy)
│   │
│   ├── 📁 src/                     # Backend source code
│   │   ├── 📄 server.ts            # Express app & server setup
│   │   │
│   │   ├── 📁 routes/              # Express routes
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── posts.ts
│   │   │   ├── jobs.ts
│   │   │   ├── events.ts
│   │   │   ├── groups.ts
│   │   │   ├── mentorship.ts
│   │   │   ├── comments.ts
│   │   │   ├── uploads.ts
│   │   │   ├── reports.ts
│   │   │   └── status.ts
│   │   │
│   │   ├── 📁 controllers/         # Business logic
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── posts/
│   │   │   ├── jobs/
│   │   │   ├── events/
│   │   │   ├── groups/
│   │   │   ├── mentorship/
│   │   │   └── ... (other controllers)
│   │   │
│   │   ├── 📁 middleware/          # Express middleware
│   │   │   ├── auth.ts             # Auth middleware
│   │   │   ├── errorHandler.ts     # Error handling
│   │   │   ├── validation.ts       # Input validation
│   │   │   └── ... (other middleware)
│   │   │
│   │   ├── 📁 models/              # Data models
│   │   │   ├── User.ts
│   │   │   ├── Post.ts
│   │   │   ├── Job.ts
│   │   │   └── ... (other models)
│   │   │
│   │   ├── 📁 services/            # Business services
│   │   │   ├── auth.ts
│   │   │   ├── email.ts            # Email service
│   │   │   ├── file.ts             # File handling
│   │   │   └── ... (other services)
│   │   │
│   │   ├── 📁 types/               # TypeScript types
│   │   │   ├── index.ts
│   │   │   └── ... (type definitions)
│   │   │
│   │   ├── 📁 utils/               # Utilities
│   │   │   ├── logger.ts
│   │   │   ├── validators.ts
│   │   │   └── ... (other utils)
│   │   │
│   │   └── 📁 config/              # Configuration
│   │       ├── database.ts
│   │       ├── jwt.ts
│   │       └── ... (other configs)
│   │
│   ├── 📁 prisma/                  # DATABASE
│   │   ├── schema.prisma           # Database schema
│   │   ├── seed.ts                 # Database seed script
│   │   └── 📁 migrations/          # Migration files
│   │       ├── 0001_init/
│   │       ├── 0002_add_features/
│   │       └── ... (migration history)
│   │
│   ├── 📁 uploads/                 # Uploaded files
│   │   ├── 📁 profiles/            # User profile images
│   │   ├── 📁 posts/               # Post media
│   │   ├── 📁 documents/           # Documents/PDFs
│   │   └── ... (other uploads)
│   │
│   └── 📁 dist/                    # BACKEND BUILD OUTPUT
│       ├── server.js               # Compiled main file
│       ├── routes/
│       ├── controllers/
│       └── ... (compiled code)
│
├── 📁 docs/                        # COMPREHENSIVE DOCUMENTATION
│   ├── 00_DOCUMENTATION_INDEX.md
│   ├── 01_PROJECT_OVERVIEW.md
│   ├── 02_ARCHITECTURE.md
│   ├── 03_DATABASE_SCHEMA.md
│   ├── 04_API_REFERENCE.md
│   ├── 05_UI_UX_GUIDELINES.md
│   ├── 06_DEPLOYMENT_AND_TESTING.md
│   ├── 07_ROADMAP_AND_TRACKER.md
│   ├── 08_FRONTEND_COMPONENTS.md
│   ├── 09_BACKEND_CONTROLLERS.md
│   ├── 10_SETUP_INSTALLATION_GUIDE.md
│   ├── 11_DEVELOPMENT_GUIDE.md
│   ├── 12_CODE_CONVENTIONS.md
│   ├── 13_TROUBLESHOOTING_GUIDE.md
│   ├── 14_DATABASE_OPERATIONS.md
│   └── 15_SECURITY_BEST_PRACTICES.md
│
├── 📁 testsprite_tests/            # AUTOMATED TESTS
│   ├── standard_prd.json
│   ├── cleanup_test_data.py
│   └── TC*.py                      # Test cases
│
├── 📁 _ZENTASKS/                   # PROJECT MANAGEMENT
│   ├── TASK-*.md
│   └── tasks.json
│
└── 📁 node_modules/                # DEPENDENCIES (local machine only)
    └── ... (npm packages)
```

---

## Key Directories Explained

### Frontend (`src/`)
Contains all React components, pages, styles, and utilities for the web interface.

**Key folders:**
- `components/` - Reusable React components
- `pages/` - Full-page components (Auth, Dashboard, Feed, etc.)
- `services/` - API client and service functions
- `hooks/` - Custom React hooks
- `types/` - TypeScript definitions

### Backend (`backend/src/`)
Express.js server with routing, business logic, and database operations.

**Key folders:**
- `routes/` - API endpoint definitions
- `controllers/` - Request handling & business logic
- `middleware/` - Auth, validation, error handling
- `services/` - Reusable business logic
- `models/` - Data models

### Database (`backend/prisma/`)
Database schema and migrations using Prisma ORM.

**Key files:**
- `schema.prisma` - Complete database definition
- `migrations/` - Version control for schema changes
- `seed.ts` - Initial data seeding

### Documentation (`docs/`)
Comprehensive guides covering every aspect of the project.

---

## Build Outputs

### Frontend
```
dist/
├── index.html              # Main HTML file
└── assets/
    ├── index-*.js          # Main JavaScript bundle
    ├── vendor-*.js         # Dependencies
    └── index-*.css         # Styles
```

### Backend
```
backend/dist/
├── server.js               # Compiled server
├── routes/
│   └── *.js               # Compiled routes
├── controllers/
│   └── *.js               # Compiled controllers
└── ... (other compiled code)
```

---

## Environment Files

### .env (Frontend)
```env
VITE_API_URL=http://localhost:5000/api
FRONTEND_URL=http://localhost:8080
NODE_ENV=development
```

### backend/.env (Backend)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
```

---

## Single-Server Deployment Structure

For production, both frontend and backend run on the same server:

```
Single Server
├── Port 8080 → Frontend (served by Nginx or npm preview)
├── Port 5000 → Backend (Express API)
└── Port 5432 → Database (PostgreSQL in Docker)
```

### Docker Setup
```
Docker Network (alumni-network)
├── Frontend Container (port 8080)
├── Backend Container (port 5000)
└── Database Container (port 5432)
```

---

## Common Operations

### Building
```bash
make build          # Both
npm run build       # Frontend only
cd backend && npm run build  # Backend only
```

### Development
```bash
make dev            # Both
npm run dev         # Frontend
npm run backend     # Backend
```

### Database
```bash
make db-start       # Start PostgreSQL
make db-migrate     # Run migrations
make db-seed        # Seed initial data
```

---

## Code Organization Principles

1. **Separation of Concerns** - Frontend and backend are separate
2. **Modular Components** - Reusable, focused components
3. **Type Safety** - Full TypeScript coverage
4. **API Consistency** - Standardized REST endpoints
5. **Single Responsibility** - Each file has one purpose

---

## Important Files

| File | Purpose |
|------|---------|
| `Makefile` | All build/deploy commands |
| `backend/src/server.ts` | Express app entry point |
| `src/main.tsx` | React app entry point |
| `backend/prisma/schema.prisma` | Database schema |
| `.env` | Frontend configuration |
| `backend/.env` | Backend configuration |
| `vite.config.ts` | Frontend build config |
| `docker-compose.full.yml` | Full-stack Docker |

---

## Adding New Features

### New API Endpoint
1. Create route in `backend/src/routes/`
2. Create controller in `backend/src/controllers/`
3. Add TypeScript types in `backend/src/types/`
4. Update API service in `src/services/`

### New Page
1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Call API via `/src/services/`

### Database Changes
1. Update `backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev`
3. Update types in `backend/src/types/`
4. Update controllers/services

---

See [QUICK_START.md](./QUICK_START.md) for getting started or [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for production setup.
