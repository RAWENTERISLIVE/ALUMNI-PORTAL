# 13. Troubleshooting Guide

## Common Issues & Solutions

### Backend Issues

#### 1. Port Already in Use (5000)
**Error**: `EADDRINUSE: address already in use :::5000`

**Solutions**:
```bash
# Find process using port 5000
lsof -i :5000
# Kill the process
kill -9 <PID>

# OR: Use different port
PORT=5001 npm run dev

# OR: On macOS, restart the terminal
```

---

#### 2. PostgreSQL Connection Failed
**Error**: `connect ECONNREFUSED 127.0.0.1:5432`

**Solutions**:
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Start PostgreSQL container
docker compose up -d

# Verify connection
psql -U postgres -d alumni_db -c "SELECT 1;"

# Check DATABASE_URL in .env
# Should be: postgresql://postgres:password@localhost:5432/alumni_db
```

---

#### 3. Prisma Migration Failed
**Error**: `Error: The p_...migration.sql file was not found in /prisma/migrations`

**Solutions**:
```bash
# Reset database (WARNING: deletes all data)
cd backend
npx prisma migrate reset

# Or manually fix:
npx prisma migrate resolve --rolled-back
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

---

#### 4. JWT Token Issues
**Error**: `JsonWebTokenError: invalid token` or `TokenExpiredError`

**Solutions**:
- Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set in `.env`
- Verify token isn't expired
- Check Authorization header format: `Bearer <token>`
- Ensure refresh endpoint is working: `POST /auth/refresh`

**Test Token Validity**:
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer your_token_here"
```

---

#### 5. Prisma Client Not Found
**Error**: `Cannot find module '.prisma/client'`

**Solutions**:
```bash
cd backend
# Regenerate Prisma client
npx prisma generate

# Clean install
rm -rf node_modules .prisma
npm install
npx prisma generate
```

---

#### 6. CORS Errors in Frontend
**Error**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solutions**:
- Ensure backend has CORS configured properly
- Check `VITE_API_URL` in frontend `.env` points to correct backend
- Verify backend routes are on `/api` path
- Test API directly: `curl http://localhost:5000/api/status/health`

---

#### 7. Upload File Issues
**Error**: `413 Payload Too Large` or `File not found after upload`

**Solutions**:
```bash
# Check file size limit in backend
# Default: 50MB (52428800 bytes)
MAX_FILE_SIZE=52428800

# Ensure uploads directory exists
mkdir -p backend/uploads

# Fix permissions
chmod 755 backend/uploads
```

---

#### 8. Race Condition in User Registration
**Issue**: Duplicate email not caught sometimes

**Solution**:
```typescript
// Ensure email unique constraint exists in Prisma
model User {
  email String @unique  // ← This is critical
  // ...
}

// Run migration if missing:
npx prisma migrate dev --name add_email_unique
```

---

### Frontend Issues

#### 1. Port 5173 Already in Use
**Error**: `Port 5173 is in use`

**Solutions**:
```bash
# Find and kill process
lsof -i :5173
kill -9 <PID>

# OR: Use different port
npm run dev -- --port 5174
```

---

#### 2. Hot Module Reload Not Working
**Issue**: Changes don't reflect in browser, need manual refresh

**Solutions**:
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev

# In VS Code:
# - Disable auto save and re-enable
# - Check file permissions on changed file
```

---

#### 3. Tailwind Classes Not Applied
**Issue**: `mt-4`, `bg-primary` not showing styles

**Solutions**:
```bash
# Rebuild Tailwind CSS
npm run dev

# Check tailwind.config.ts includes src files:
content: [
  "./src/**/*.{ts,tsx}"  // Should match your structure
]

# Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)

# Check class name is exactly matching (case-sensitive)
```

---

#### 4. TypeScript Errors in Components
**Error**: `Property 'xyz' does not exist on type 'Props'`

**Solutions**:
```bash
# Type check all files
npm run type-check

# Ensure type definition includes the property
interface Props {
  xyz: string; // Add missing property
}

# Generate types from backend schema (if using OpenAPI):
npm run generate:types
```

---

#### 5. API Calls Returning 401 (Unauthorized)
**Error**: All API calls return 401 even with valid token

**Solutions**:
1. Check token exists: Open DevTools → Application → Cookies/LocalStorage
2. Verify token format in axios interceptor
3. Test token manually:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/auth/me
```
4. Check token expiration time
5. Ensure refresh endpoint works

---

#### 6. Images Not Loading
**Error**: Images show 404 or broken image icon

**Solutions**:
```tsx
// Ensure image URLs are correct
<img src="/api/uploads/file-id.jpg" alt="desc" />

// For relative paths, check publicDir in vite.config.ts
export default {
  publicDir: 'public' // ensure this exists
}

// For absolute URLs, use full backend URL:
<img src={`${API_URL}/uploads/file.jpg`} />
```

---

#### 7. Context Provider Errors
**Error**: `useAuth hook must be within AuthProvider`

**Solutions**:
```tsx
// Ensure AuthProvider wraps entire app
<AuthProvider>
  <App />
</AuthProvider>

// Layout usually in App.tsx or main.tsx:
ReactDOM.createRoot(doc.getElementById('root')).render(
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </AuthProvider>
)
```

---

#### 8. Build Fails with TypeScript Errors
**Error**: `npm run build` fails but dev works

**Solutions**:
```bash
# Run type check before build
npm run type-check

# Fix any type errors reported

# Clean build
rm -rf dist
npm run build

# Check for unused variables warnings
npm run type-check -- --noEmit --listFiles
```

---

### Database Issues

#### 1. Cannot Reset Database
**Error**: `Error: Database already exists` during migrate reset

**Solutions**:
```bash
# Hard reset Docker
docker compose down -v

# Restart services
docker compose up -d

# Re-run migrations
npx prisma migrate dev
```

---

#### 2. Prisma Studio Won't Open
**Error**: `npx prisma studio` shows error or blank page

**Solutions**:
```bash
# Kill any existing studio processes
lsof -i :5555
kill -9 <PID>

# Retry
npx prisma studio

# If still fails, restart Docker:
docker compose restart postgres
```

---

#### 3. Slow Queries / Performance
**Issue**: Database queries taking long time

**Solutions**:
```typescript
// Check if you're including too much data
// ❌ Bad: Getting all user posts with all comments
const user = await prisma.user.findUnique({
  where: { id },
  include: {
    posts: {
      include: {
        comments: { include: { likes: true } }  // Too nested
      }
    }
  }
});

// ✅ Good: Only include needed data
const user = await prisma.user.findUnique({
  where: { id },
  include: { posts: { select: { id: true, title: true } } }
});

// Add database indexes for frequently queried fields:
model Post {
  id     String @id @default(uuid())
  authorId String
  author User   @relation(fields: [authorId], references: [id])
  
  @@index([authorId])  // Index for author lookups
}
```

---

### Authentication Issues

#### 1. Stuck in Login Loop
**Issue**: Redirects to login even when authenticated

**Solutions**:
1. Clear browser storage:
```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
```
2. Check token in Network tab when calling `/auth/me`
3. Verify AuthContext is initialized properly
4. Check refresh token endpoint works

---

#### 2. Password Reset Token Not Working
**Error**: Invalid or expired token when trying to reset password

**Solutions**:
```typescript
// Check token expiry in controller
if (new Date() > user.passwordResetExpires) {
  return res.status(400).json({ error: 'Token expired' });
}

// Resend reset email to get new token
// Token should be valid for 1 hour
```

---

#### 3. 2FA / Auth Codes Not Working
**Issue**: 2FA codes rejected even when correct

**Solutions**:
- Check server time synchronization: `date`
- Verify TOTP secret stored correctly
- Allow ±30 second clock skew in validation

---

### Testing Issues

#### 1. Test Suite Fails Intermittently
**Issue**: Sometimes tests pass, sometimes fail

**Solutions**:
```bash
# Run test in isolation to check dependencies
npm run test -- --testNamePattern="specific test"

# Use proper async/await, avoid promise chains
it('should fetch data', async () => {
  const data = await service.getData();
  expect(data).toBeDefined();
});

# Mock external APIs properly
jest.mock('@/services/api');

# Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  cleanup();
});
```

---

#### 2. Integration Tests Timeout
**Error**: `TIMEOUT: async callback was not invoked`

**Solutions**:
```bash
# Increase timeout for integration tests
npm run test:integration -- --testTimeout=10000

# Ensure backend is running before tests
npm run dev:full &

# Check database is clean before test suite
npx prisma migrate reset
```

---

### Deployment Issues

#### 1. Environment Variables Not Loaded
**Error**: `undefined` values with `process.env.VARIABLE`

**Solutions**:
```bash
# Frontend - ensure vars are prefixed with VITE_
VITE_API_URL=...  // Accessible in client code

# Backend - ensure .env file exists and is readable
cat .env

# Restart server after changing .env
npm stop
npm start
```

---

#### 2. API Requests Fail in Production
**Error**: CORS errors, 404s on production domain

**Solutions**:
```bash
# Check VITE_API_URL points to production backend
VITE_API_URL=https://api.yourdomain.com/api

# Rebuild frontend with correct API URL
npm run build

# Verify backend CORS config includes production domain
cors: { origin: 'https://yourdomain.com' }
```

---

#### 3. Static Files Return 404 in Production
**Issue**: CSS, JS images return 404

**Solutions**:
```bash
# Ensure .htaccess is configured for SPA:
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Or for Nginx:
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## Performance Debugging

### Backend Performance
```bash
# Enable query logging
npm run dev -- --loglevel=debug

# Monitor server resources
node --prof app.js

# Analyze performance profile
node --prof-process isolate-*.log > log.txt
```

### Frontend Performance
```typescript
// Measure component render time
import { Profiler } from 'react';

<Profiler id="PostList" onRender={(id, phase, actualDuration) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}}>
  <PostList />
</Profiler>

// Check React Query cache size
queryClient.getQueryCache().findAll().length
```

---

## Getting Help

### Debug Checklist
1. ✅ Check all console errors (browser + server)
2. ✅ Verify .env variables are set
3. ✅ Test API endpoints directly (curl/Postman)
4. ✅ Check database connectivity
5. ✅ Review recent code changes in git
6. ✅ Clear cache (npm, browser, vite)
7. ✅ Restart all services

### Reporting Bugs
- Include error message and full stack trace
- List steps to reproduce
- Describe expected vs actual behavior
- Include environment info (OS, Node version, etc.)
- Attach relevant logs and screenshots
