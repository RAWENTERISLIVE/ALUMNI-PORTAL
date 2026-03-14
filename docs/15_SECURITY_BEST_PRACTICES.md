# 15. Security Best Practices & Guidelines

## Authentication & Authorization

### JWT (JSON Web Token) Security

#### Token Configuration
```typescript
// backend/.env
JWT_SECRET=your_min_32_char_secure_random_string_here
JWT_REFRESH_SECRET=another_min_32_char_secure_random_string_here
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d
```

**Token Expiry Strategy**:
- Access Token: 1 hour (short-lived, frequent refresh)
- Refresh Token: 7 days (long-lived, used to get new access tokens)
- Benefits: Limits exposure if access token stolen, still convenient for users

#### Token Signing & Verification
```typescript
import jwt from 'jsonwebtoken';

// Sign token
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

// Verify token (done automatically by middleware)
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// Throws error if invalid, expired, or tampered with
```

#### Refresh Token Rotation
```typescript
// When issuing refresh token
const refreshToken = generateSecureRandomToken();
user.refreshTokens.push(refreshToken);  // Store in DB

// When calling /auth/refresh
const newAccessToken = generateNewAccessToken(userId);
// OLD refresh token remains valid until expiry
// Some systems rotate refresh tokens (revoke old, issue new)
```

#### Token Invalidation
```typescript
// On logout
await prisma.user.update({
  where: { id: userId },
  data: { refreshTokens: [] }  // Revoke all tokens
});

// Subsequent requests with old refresh tokens fail
```

---

### Password Security

#### Password Hashing
```typescript
import bcrypt from 'bcrypt';

// Hash during registration/password change
const hashedPassword = await bcrypt.hash(password, 10);
// 10 = salt rounds (higher = more secure but slower)
// Default 10 is good balance for modern hardware

await prisma.user.create({
  data: { email, password: hashedPassword }
});

// Verify during login
const isValid = await bcrypt.compare(providedPassword, user.password);

if (!isValid) {
  throw new UnauthorizedException('Invalid credentials');
}
```

#### Password Requirements
```typescript
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Must contain number');
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Must contain special character (!@#$%^&*)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

#### Password Reset Security
```typescript
// Generate secure random reset token
const resetToken = crypto.randomBytes(32).toString('hex');
const resetTokenHash = await bcrypt.hash(resetToken, 10);

// Store hashed token + expiry in DB
await prisma.user.update({
  where: { id: userId },
  data: {
    passwordResetToken: resetTokenHash,
    passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  }
});

// Send plain token in email (not hashed version)
// User clicks link with plain token
// Server hashes provided token and compares with stored hash
```

---

### Rate Limiting

#### Global Rate Limit
```typescript
import rateLimit from 'express-rate-limit';

const globalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour
  message: 'Too many requests'
});

app.use(globalLimiter);
```

#### Endpoint-Specific Rate Limits
```typescript
// Auth endpoints: Aggressive limit (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 min
  skip: (req) => req.user, // Don't limit authenticated users
  keyGenerator: (req) => req.ip // By IP address
});

app.post('/auth/login', authLimiter, authController.login);

// Registration: Prevent spam
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3 // 3 registrations per hour
});

app.post('/auth/register', registerLimiter, authController.register);
```

---

## Input Validation & Sanitization

### Email Validation
```typescript
function isValidEmail(email: string): boolean {
  // RFC 5322 simplified pattern
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

// Middleware example
app.post('/auth/register', (req, res) => {
  const { email } = req.body;
  
  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
  }
  // Continue...
});
```

### SQL Injection Prevention
```typescript
// ✅ Safe: Using Prisma (parameterized queries)
const user = await prisma.user.findUnique({
  where: { email: userInput }  // Parameterized
});

// ❌ NEVER: Raw SQL with user input
const user = await prisma.$queryRaw(`
  SELECT * FROM "User" WHERE email = '${userInput}'
  // Vulnerable to SQL injection!
`);

// ✅ If using raw SQL, use parameterized queries
const user = await prisma.$queryRaw`
  SELECT * FROM "User" WHERE email = ${userInput}
`;
```

### XSS (Cross-Site Scripting) Prevention
```typescript
// ❌ Bad: Storing unfiltered user input
const post = await prisma.post.create({
  data: {
    content: req.body.content  // Could contain <script>alert('xss')</script>
  }
});

// ✅ Good: Sanitize on input
import DOMPurify from 'isomorphic-dompurify';

const post = await prisma.post.create({
  data: {
    content: DOMPurify.sanitize(req.body.content)
  }
});

// Frontend
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
```

### Input Length Limits
```typescript
const validatePostInput = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.content) errors.push('Content required');
  if (data.content?.length > 5000) errors.push('Content too long (max 5000)');
  if (data.title?.length > 200) errors.push('Title too long (max 200)');
  
  return { valid: errors.length === 0, errors };
};
```

---

## CORS & HTTPS

### CORS Configuration
```typescript
import cors from 'cors';

// Development
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Production
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### HTTPS Enforcement
```typescript
// Production: Force HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.header('host')}${req.url}`);
  }
  next();
});

// Or use Nginx/reverse proxy to handle
```

### Security Headers
```typescript
import helmet from 'helmet';

app.use(helmet()); // Adds security headers

// Manually set important headers:
// Content-Security-Policy: Prevents inline scripts
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY (prevent clickjacking)
// Strict-Transport-Security: Force HTTPS
```

---

## Data Protection

### Sensitive Data Handling
```typescript
// ❌ Bad: Return password and tokens in responses
res.json({
  user: {
    id, email, name,
    password: user.password,  // NEVER!
    refreshTokens: user.refreshTokens  // NEVER!
  }
});

// ✅ Good: Exclude sensitive fields
res.json({
  user: {
    id, email, name, bio, headline, role
    // password, refreshTokens NOT included
  }
});

// Using select in Prisma
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    // password NOT selected
  }
});
```

### Environment Variables Security
```bash
# ✅ Good: Store in .env file (never committed)
# .env (in .gitignore)
JWT_SECRET=super_secret_key
DB_PASSWORD=db_password

# ✅ Production: Use secret manager
# AWS Secrets Manager
# Google Cloud Secret Manager
# HashiCorp Vault

# ❌ Bad: Hardcode secrets
const JWT_SECRET = 'hardcoded_secret';

# ❌ Bad: Commit .env to git
git add .env  # Never!
```

### GDPR Compliance
```typescript
// Provide data export
app.get('/auth/export-data', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      posts: true,
      comments: true,
      groups: true,
      // All user data
    }
  });
  
  res.json(user);
});

// Enable data deletion
app.delete('/auth/delete-account', async (req, res) => {
  // Soft delete or hard delete with data anonymization
  await prisma.user.update({
    where: { id: req.user.id },
    data: { status: 'DELETED' }
  });
});
```

---

## Authorization & Access Control

### Role-Based Access Control (RBAC)
```typescript
// Middleware: Check role
function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Usage
app.delete('/admin/users/:id', 
  requireAuth, 
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  userController.deleteUser
);
```

### Resource Ownership Check
```typescript
// Only allow user to edit their own profile
async function updateUserProfile(req: Request, res: Response) {
  const { userId: targetId } = req.params;
  const { user: authUser } = req;
  
  // Check: Is user editing themselves OR is admin?
  if (targetId !== authUser.id && authUser.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Cannot edit other users' });
  }
  
  // Continue with update...
}

// Similarly for posts, comments
const post = await prisma.post.findUnique({ where: { id: postId } });
if (post.authorId !== req.user.id && req.user.role !== 'ADMIN') {
  return res.status(403).json({ error: 'Cannot delete' });
}
```

---

## API Security

### Request Validation Middleware
```typescript
import { body, validationResult } from 'express-validator';

app.post('/posts', [
  body('title').optional().trim().isLength({ max: 200 }),
  body('content').notEmpty().trim().isLength({ max: 5000 }),
  body('visibility').isIn(['PUBLIC', 'ALUMNI', 'CONNECTIONS', 'GROUPS']),
  body('tags').optional().isArray()
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
});
```

### Request Timeout
```typescript
// Global timeout
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 second timeout
  next();
});
```

### File Upload Security
```typescript
import multer from 'multer';
import path from 'path';

// Whitelist allowed file types
const allowedMimes = [
  'image/jpeg', 'image/png', 'application/pdf',
  'application/msword'
];

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    // Check MIME type
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    
    // Check extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'].includes(ext)) {
      return cb(new Error('Invalid file extension'));
    }
    
    cb(null, true);
  }
});
```

---

## Audit Logging

### Log All Sensitive Actions
```typescript
// Log all admin actions
async function logAuditEvent(action: string, userId: string, details?: any) {
  await prisma.auditLog.create({
    data: {
      action,
      userId,
      details: details ? JSON.stringify(details) : null,
      ipAddress: getClientIp(),
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date()
    }
  });
}

// Usage
await logAuditEvent('USER_DELETED', adminId, { deletedUserId: userId });
await logAuditEvent('POST_FLAGGED', userId, { postId });
await logAuditEvent('LOGIN_FAILED', null, { email, reason: 'Invalid password' });
```

---

## Monitoring & Alerts

### Security Monitoring
```typescript
// Alert on suspicious activity
const suspiciousActivity = {
  multipleFailedLogins: (email: string) => {
    // Count failed logins in last 15 min
    // Alert if > 5
  },
  rapidPostCreation: (userId: string) => {
    // Alert if user creates > 10 posts in 5 min
  },
  bulkDelete: (adminId: string) => {
    // Alert if admin deletes > 100 users in hour
  }
};
```

---

## Security Checklist

Before deploying to production:

- [ ] All passwords hashed with bcrypt
- [ ] JWT secrets strong (>32 chars, random)
- [ ] HTTPS enforced
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using Prisma)
- [ ] XSS prevention (sanitize user input)
- [ ] CSRF tokens if needed
- [ ] Sensitive data excluded from API responses
- [ ] .env not committed to git
- [ ] Audit logging for sensitive actions
- [ ] Error messages don't leak system details
- [ ] Dependencies up to date (`npm audit`)
- [ ] Security headers set (helmet.js)
- [ ] File upload validated
- [ ] Secrets not in logs
- [ ] Database backups enabled
- [ ] Two-factor authentication (2FA) implemented
- [ ] API rate limits tested
- [ ] Security testing completed (OWASP)
