# 🔄 Project Organization Migration Guide

Step-by-step guide to complete the project reorganization.

---

## ✅ Phase 1: Frontend Organization

### Step 1: Move Auth Pages
```bash
cd /Users/raghav/Developer/ALUMNI-PORTAL-1

# Create auth subdirectory if not present
mv src/pages/AuthPages/LoginPage.tsx src/features/auth/LoginPage.tsx
mv src/pages/AuthPages/RegisterPage.tsx src/features/auth/RegisterPage.tsx

# Remove empty AuthPages folder
rm -rf src/pages/AuthPages/
```

### Step 2: Move Feature Pages
```bash
# Core pages
mv src/pages/ProfilePage.tsx src/features/profile/ProfilePage.tsx
mv src/pages/PostsPage.tsx src/features/posts/PostsPage.tsx
mv src/pages/MentorshipPage.tsx src/features/mentorship/MentorshipPage.tsx
mv src/pages/JobsPage.tsx src/features/jobs/JobsPage.tsx
mv src/pages/EventsPage.tsx src/features/events/EventsPage.tsx
mv src/pages/GroupsPage.tsx src/features/groups/GroupsPage.tsx
mv src/pages/DirectoryPage.tsx src/features/directory/DirectoryPage.tsx
mv src/pages/AdminPage.tsx src/features/admin/AdminPage.tsx
mv src/pages/SettingsPage.tsx src/features/settings/SettingsPage.tsx
mv src/pages/AnalyticsPage.tsx src/features/analytics/AnalyticsPage.tsx
```

### Step 3: Move Feature-Specific Components
```bash
# Posts feature components
mkdir -p src/features/posts/components
mv src/components/posts/* src/features/posts/components/ 2>/dev/null || true

# Mentorship components
mkdir -p src/features/mentorship/components
mv src/components/mentorship/* src/features/mentorship/components/ 2>/dev/null || true

# Jobs components
mkdir -p src/features/jobs/components
mv src/components/jobs/* src/features/jobs/components/ 2>/dev/null || true

# Groups components
mkdir -p src/features/groups/components
mv src/components/groups/* src/features/groups/components/ 2>/dev/null || true

# Other feature components
mkdir -p src/features/profile/components
mv src/components/profile/* src/features/profile/components/ 2>/dev/null || true

mkdir -p src/features/admin/components
mv src/components/admin/* src/features/admin/components/ 2>/dev/null || true
```

### Step 4: Move Shared Components
```bash
# Layout components
mv src/components/layout/* src/shared/layout/ 2>/dev/null || true

# Common components
mv src/components/common/* src/shared/components/ 2>/dev/null || true

# UI components (shadcn)
mv src/components/ui/* src/shared/ui/ 2>/dev/null || true
```

### Step 5: Move Shared Utilities
```bash
# Hooks
mv src/hooks/* src/shared/hooks/ 2>/dev/null || true

# Contexts
mv src/contexts/* src/shared/contexts/ 2>/dev/null || true

# Services
mv src/services/* src/shared/services/ 2>/dev/null || true
```

### Step 6: Clean Up Old Directories
```bash
# Remove empty old directories
rm -rf src/pages/
rm -rf src/components/
rm -rf src/hooks/
rm -rf src/contexts/
rm -rf src/services/
```

### Step 7: Update Import Paths

Update `tsconfig.json`:

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

---

## ✅ Phase 2: Backend Organization

### Step 1: Create Feature Folder Structure
```bash
cd backend/src/

# Auth feature
mkdir -p features/auth
mv routes/auth.ts features/auth/
mv controllers/authController.ts features/auth/

# Users feature
mkdir -p features/users
mv routes/users.ts features/users/
mv controllers/userController.ts features/users/

# Posts feature
mkdir -p features/posts
mv routes/posts.ts features/posts/
mv controllers/postController.ts features/posts/
mv routes/comments.ts features/posts/
mv controllers/commentController.ts features/posts/

# Mentorship feature
mkdir -p features/mentorship
mv routes/mentorship.ts features/mentorship/
mv controllers/mentorshipController.ts features/mentorship/

# Jobs feature
mkdir -p features/jobs
mv routes/jobs.ts features/jobs/
mv controllers/jobController.ts features/jobs/

# Events feature
mkdir -p features/events
mv routes/events.ts features/events/
mv controllers/eventController.ts features/events/

# Groups feature
mkdir -p features/groups
mv routes/groups.ts features/groups/
mv controllers/groupController.ts features/groups/

# Uploads feature
mkdir -p features/uploads
mv routes/uploads.ts features/uploads/
mv controllers/uploadController.ts features/uploads/

# Reports feature
mkdir -p features/reports
mv routes/reports.ts features/reports/
mv controllers/reportController.ts features/reports/

# Status feature
mkdir -p features/status
mv routes/status.ts features/status/
mv controllers/statusController.ts features/status/
```

### Step 2: Move Shared Files
```bash
# Middleware
mv middleware/* shared/middleware/ 2>/dev/null || true

# Config
mv config/* shared/config/ 2>/dev/null || true

# Models
mv models/* shared/models/ 2>/dev/null || true

# Utils (if any)
mv utils/* shared/utils/ 2>/dev/null || true
```

### Step 3: Update Backend Server Setup

Update `server.ts` to import routes from features:

```typescript
import authRoutes from './features/auth/auth';
import userRoutes from './features/users/users';
import postRoutes from './features/posts/posts';
// ... etc
```

### Step 4: Update Backend Index/Main Export

Create `backend/src/index.ts` if doesn't exist to export all features:

```typescript
export * from './features';
export { setupDatabase } from './shared/config/database';
export { setupMiddleware } from './shared/middleware';
```

---

## ✅ Phase 3: Root-Level Organization

### Step 1: Create Config Folder
```bash
cd /Users/raghav/Developer/ALUMNI-PORTAL-1

# Move config files
mkdir -p config/typescript
mkdir -p config/build

# Move files (optional - can keep at root if preferred)
# cp tsconfig.json config/typescript/
# cp tsconfig.app.json config/typescript/
# cp tsconfig.node.json config/typescript/
# cp vite.config.ts config/build/
# cp tailwind.config.ts config/build/
# cp postcss.config.js config/build/
```

### Step 2: Organize Deployment Files
```bash
# Keep common files in lists
mkdir -p deploy
mv deploy.sh deploy/ 2>/dev/null || true
mv db.sh deploy/ 2>/dev/null || true
mv build.sh deploy/ 2>/dev/null || true
```

### Step 3: Organize Scripts
```bash
# Scripts are already in scripts/ - keep organized
ls -la scripts/
```

---

## ✅ Phase 4: Update All Imports

### Frontend Imports

Before:
```tsx
import { LoginPage } from '../pages/auth/LoginPage';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
```

After:
```tsx
import { LoginPage } from '@/features/auth/LoginPage';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useAuth } from '@/shared/contexts/AuthContext';
import { apiService } from '@/shared/services/apiService';
```

### Backend Imports

Before:
```typescript
import authRouter from '../routes/auth';
import { authenticate } from '../middleware/auth';
import { User } from '../models/User';
```

After:
```typescript
import authRouter from '../features/auth/auth';
import { authenticate } from '../shared/middleware/auth';
import { User } from '../shared/models/User';
```

---

## ✅ Phase 5: Verification

### Frontend Check
```bash
# Build frontend to catch import errors
npm run build

# Should complete without errors
```

### Backend Check
```bash
# Build backend
cd backend && npm run build

# Should complete without errors
```

### Lint Check
```bash
# Run linter
npm run lint

# Should show no critical errors
```

---

## 🎯 Benefits After Migration

✅ **Clear Structure** - Easy to find code  
✅ **Scalability** - Adding features is straightforward  
✅ **Collaboration** - Team members know where to work  
✅ **Testing** - Tests can be co-located with features  
✅ **Maintenance** - Less boilerplate in imports  
✅ **Documentation** - Structure is self-documenting  

---

## 📝 Checklist

Frontend:
- [ ] Moved auth pages
- [ ] Moved feature pages
- [ ] Moved feature components
- [ ] Moved shared components
- [ ] Moved hooks/contexts/services
- [ ] Updated all import paths
- [ ] Frontend builds successfully

Backend:
- [ ] Created feature folders
- [ ] Moved routes to features
- [ ] Moved controllers to features
- [ ] Moved shared files
- [ ] Updated server.ts imports
- [ ] Backend builds successfully

Testing:
- [ ] npm run build (frontend)
- [ ] backend npm run build
- [ ] npm run lint
- [ ] No TypeScript errors
- [ ] Application runs locally

---

## 🚀 Next Steps

1. Complete the migration using steps above
2. Test locally: `make dev`
3. Run tests: `npm run test` (if tests exist)
4. Commit changes: `git commit -m "refactor: reorganize project structure"`
5. Push to branch: `git push origin feature/reorganize-structure`
