# 📁 Alumni Portal - Complete Project Structure

This document outlines the new organized project structure.

---

## 🎯 Folder Organization Principles

1. **Features** - Organized by business domain (auth, posts, jobs, etc.)
2. **Shared** - Reusable code across features
3. **Config** - Configuration files
4. **Tests** - Test files organized by type
5. **Documentation** - All markdown docs in one place

---

## 📦 Frontend Structure (`src/`)

```
src/
├── features/                    # Feature-based organization
│   ├── auth/                   # Authentication (Login, Register)
│   ├── profile/                # User profiles
│   ├── posts/                  # Social feed & posts
│   ├── mentorship/             # Mentorship program
│   ├── jobs/                   # Job board
│   ├── events/                 # Events calendar
│   ├── groups/                 # Alumni groups
│   ├── directory/              # Alumni directory
│   ├── admin/                  # Admin dashboard
│   ├── settings/               # User settings
│   ├── analytics/              # Analytics dashboard
│   └── README.md               # Feature folder guide
│
├── shared/                      # Shared across features
│   ├── components/             # Common components
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── PageHeader.tsx
│   │   ├── ReportModal.tsx
│   │   └── ...
│   ├── layout/                 # Layout components
│   │   ├── MainLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MobileNavbar.tsx
│   │   └── GlobalSearch.tsx
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ... (40+ ui components)
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── contexts/               # Global contexts
│   │   └── AuthContext.tsx
│   ├── services/               # API services
│   │   └── apiService.ts
│   └── README.md               # Shared folder guide
│
├── types/                       # TypeScript types
│   └── index.ts
│
├── lib/                         # Utility functions
│   └── utils.ts
│
├── App.tsx                      # Root component
├── main.tsx                     # Entry point
├── index.css                    # Global styles
├── vite-env.d.ts                # Vite type definitions
└── App.css                      # App styles
```

---

## 🔧 Backend Structure (`backend/src/`)

```
backend/src/
├── features/                    # Feature modules
│   ├── auth/                   # Authentication
│   │   ├── auth.ts             # Routes
│   │   └── authController.ts   # Logic
│   ├── users/                  # User management
│   │   ├── users.ts
│   │   └── userController.ts
│   ├── posts/                  # Posts & comments
│   │   ├── posts.ts
│   │   ├── postController.ts
│   │   ├── comments.ts
│   │   └── commentController.ts
│   ├── mentorship/             # Mentorship
│   ├── jobs/                   # Job board
│   ├── events/                 # Events
│   ├── groups/                 # Groups
│   ├── uploads/                # File uploads
│   ├── reports/                # Reports & moderation
│   ├── status/                 # System status
│   └── README.md               # Backend guide
│
├── shared/                      # Shared backend code
│   ├── middleware/             # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── validation.ts
│   ├── config/                 # Configuration
│   │   ├── database.ts
│   │   └── prisma.ts
│   ├── models/                 # Data models
│   │   └── User.ts
│   └── utils/                  # Utilities
│
├── server.ts                    # Express app setup
└── socket.ts                    # WebSocket setup
```

---

## 📚 Documentation (`docs/`)

```
docs/
├── 00_DOCUMENTATION_INDEX.md
├── 01_PROJECT_OVERVIEW.md
├── 02_ARCHITECTURE.md
├── 03_DATABASE_SCHEMA.md
├── 04_API_REFERENCE.md
├── 05_UI_UX_GUIDELINES.md
├── 06_DEPLOYMENT_AND_TESTING.md
├── 07_ROADMAP_AND_TRACKER.md
├── 08_FRONTEND_COMPONENTS.md
├── 09_BACKEND_CONTROLLERS.md
├── 10_SETUP_INSTALLATION_GUIDE.md
├── 11_DEVELOPMENT_GUIDE.md
├── 12_CODE_CONVENTIONS.md
├── 13_TROUBLESHOOTING_GUIDE.md
├── 14_DATABASE_OPERATIONS.md
└── 15_SECURITY_BEST_PRACTICES.md
```

---

## 🧪 Test Structure (`tests/`)

```
tests/
├── unit/                       # Unit tests
│   ├── auth.test.ts
│   ├── posts.test.ts
│   └── ...
├── integration/                # Integration tests
│   ├── auth.integration.ts
│   ├── posts.integration.ts
│   └── ...
└── e2e/                        # End-to-end tests
    ├── auth.e2e.ts
    ├── posts.e2e.ts
    └── ...
```

---

## 🔄 GitHub Structure (`.github/`)

```
.github/
├── workflows/                  # CI/CD workflows
│   ├── test.yml               # Run tests on push
│   ├── deploy.yml             # Deploy on release
│   └── lint.yml               # Linting checks
├── ISSUE_TEMPLATE/            # Issue templates
│   ├── bug_report.md
│   └── feature_request.md
└── pull_request_template.md    # PR template
```

---

## ⚙️ Configuration Files (`root/`)

```
.env                           # Environment variables
.env.example                   # Example env variables
.gitignore                     # Git ignore rules
.eslintrc.json                 # ESLint config
tsconfig.json                  # TypeScript (root)
tsconfig.app.json              # TypeScript (frontend)
tsconfig.node.json             # TypeScript (node)
vite.config.ts                 # Vite config
tailwind.config.ts             # Tailwind config
postcss.config.js              # PostCSS config
package.json                   # Frontend dependencies
Makefile                       # Build commands
docker-compose.yml             # Docker setup
nginx.conf                     # Nginx config
```

---

## 📊 Import Path Aliases

In `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/types/*": ["./src/types/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  }
}
```

### Usage Examples

```tsx
// Import from features
import { LoginPage } from '@/features/auth/LoginPage';
import { PostsPage } from '@/features/posts/PostsPage';

// Import from shared
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useAuth } from '@/shared/contexts/AuthContext';
import { apiService } from '@/shared/services/apiService';
import { Button } from '@/shared/ui/button';

// Import from lib
import { cn } from '@/lib/utils';

// Import types
import { User } from '@/types';
```

---

## 🚀 Migration Steps

1. **Create feature folders** ✅ (Done)
2. **Move pages to features**
   ```bash
   mv src/pages/*.tsx src/features/[feature]/
   ```

3. **Move components to features**
   ```bash
   mv src/components/[feature]/* src/features/[feature]/components/
   ```

4. **Move shared items**
   ```bash
   mv src/components/common/* src/shared/components/
   mv src/components/layout/* src/shared/layout/
   mv src/components/ui/* src/shared/ui/
   mv src/hooks/* src/shared/hooks/
   mv src/contexts/* src/shared/contexts/
   mv src/services/* src/shared/services/
   ```

5. **Update imports** - Use the path aliases above

6. **Backend reorganization**
   ```bash
   mv backend/src/controllers/authController.ts backend/src/features/auth/
   mv backend/src/routes/auth.ts backend/src/features/auth/
   # ... repeat for all features
   ```

7. **Move shared backend files**
   ```bash
   mv backend/src/middleware/* backend/src/shared/middleware/
   mv backend/src/config/* backend/src/shared/config/
   mv backend/src/models/* backend/src/shared/models/
   mv backend/src/utils/* backend/src/shared/utils/
   ```

---

## 📋 Benefits of This Structure

✅ **Scalability** - Easy to add new features  
✅ **Maintainability** - Clear file organization  
✅ **Code Reuse** - Shared components easily accessible  
✅ **Team Collaboration** - Everyone knows where to look  
✅ **Testing** - Tests organized alongside features  
✅ **Documentation** - Clear import paths and structure

---

## 🔗 Related Documentation

- [Frontend Features Guide](./src/features/README.md)
- [Shared Components Guide](./src/shared/README.md)
- [Backend Features Guide](./backend/src/features/README.md)
- [Development Guide](./docs/11_DEVELOPMENT_GUIDE.md)
