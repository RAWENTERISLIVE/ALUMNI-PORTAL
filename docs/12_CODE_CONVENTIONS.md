# 12. Code Conventions & Best Practices

## Overview
This guide ensures consistent, maintainable code across the Alma Connect Sphere project. All team members should follow these conventions.

---

## TypeScript Conventions

### Type Definitions

#### User Type
```typescript
// src/types/user.ts
interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  profileImage?: string;
  bio?: string;
  headline?: string;
  company?: string;
  jobTitle?: string;
  isAvailableAsMentor: boolean;
  profileCompletion: number;
  createdAt: string;
  updatedAt: string;
}

type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
```

#### Post Type
```typescript
interface Post {
  id: string;
  title?: string;
  content: string;
  authorId: string;
  author: User;
  visibility: 'PUBLIC' | 'ALUMNI' | 'CONNECTIONS' | 'GROUPS';
  category: string;
  tags: string[];
  reactions: PostReaction[];
  comments: Comment[];
  commentCount: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Naming Conventions

#### Variables & Constants
```typescript
// ✅ Good: camelCase for variables
const userAuthToken = 'jwt...';
const maxRetries = 3;
const isLoading = false;

// ❌ Bad: snake_case or PascalCase for variables
const user_auth_token = 'jwt...';
const IsLoading = false;

// ✅ Good: UPPER_SNAKE_CASE for constants
const MAX_FILE_SIZE = 52428800; // 50MB
const API_TIMEOUT = 30000; // ms
const DEFAULT_PAGE_SIZE = 20;

// ✅ Good: PascalCase for types, interfaces, classes
interface UserProfile {}
type UserRole = 'USER' | 'ADMIN';
class UserService {}
enum Status { PENDING, ACTIVE, SUSPENDED }
```

#### Functions
```typescript
// ✅ Good: camelCase, descriptive
function getUserProfile(userId: string): Promise<User> {}
function handleFormSubmit(e: FormEvent): void {}
function isValidEmail(email: string): boolean {}

// Prefix getters with 'get', boolean checks with 'is'/'has'
function getPostById(id: string) {}
function isAuthenticated(): boolean {}
function hasPermission(role: UserRole): boolean {}
```

#### Component Names
```typescript
// ✅ Good: PascalCase, descriptive
export function UserProfileCard(props: UserCardProps) {}
export const PostCommentSection = () => {};

// ❌ Bad: camelCase or generic names
export function userProfileCard() {}
export const PostComponent = () => {};
```

---

## React/Frontend Code Standards

### Component Structure
```typescript
// ✅ Good: Functional component with clear organization
interface ComponentProps {
  title: string;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

export function MyComponent({ title, onSubmit, isLoading }: ComponentProps) {
  // 1. State declarations
  const [formData, setFormData] = useState<FormData>({});
  
  // 2. Hooks
  const { currentUser } = useAuth();
  const { data: posts } = useQuery(['posts'], fetchPosts);
  
  // 3. Derived state
  const isButtonDisabled = isLoading || !formData.title;
  
  // 4. Event handlers
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };
  
  // 5. Render
  return (
    <form onSubmit={handleSubmit}>
      <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
      <Button disabled={isButtonDisabled} type="submit">Submit</Button>
    </form>
  );
}

export default MyComponent;
```

### Styling

#### Tailwind Classes
```typescript
// ✅ Good: Use utility classes directly
<div className="p-4 rounded-lg bg-card border shadow-sm hover:shadow-md transition-shadow">
  Content
</div>

// ✅ Good: Use custom utilities from index.css
<div className="card-hover post-card">
  Content
</div>

// ✅ Good: Extract repetitive patterns
const cardClasses = "p-5 rounded-lg border bg-card text-card-foreground shadow-sm";
<div className={cardClasses}>Content</div>

// ❌ Bad: Inline style objects for Tailwind properties
<div style={{padding: '16px', borderRadius: '8px'}}>
  This defeats Tailwind's purpose
</div>
```

#### Dark Mode
```typescript
// ✅ Good: Use dark: prefix
<div className="bg-white dark:bg-slate-900 text-black dark:text-white">
  Adapts to theme automatically
</div>

// ✅ Use theme context
const { isDarkMode, toggleDarkMode } = useTheme();
<button onClick={toggleDarkMode}>
  {isDarkMode ? '🌙' : '☀️'} Toggle Theme
</button>
```

### Props Pattern
```typescript
// ✅ Good: Type-safe props destructuring
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({ variant = 'default', size = 'md', isLoading, ...props }: ButtonProps) {
  return <button className={cn(variantClasses[variant], sizeClasses[size])} {...props} />;
}

// ✅ Usage
<Button variant="secondary" size="lg" onClick={handleClick}>Click me</Button>
```

### Async Patterns
```typescript
// ✅ Good: Use React Query for server state
const { data: user, isLoading, error } = useQuery(['user', userId], () => userService.getUser(userId));

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorAlert error={error} />;

return <UserProfile user={user} />;

// ✅ Good: Use useMutation for mutations with callbacks
const mutation = useMutation(postService.createPost, {
  onSuccess: (newPost) => {
    queryClient.invalidateQueries(['posts']);
    toast.success('Post created!');
  },
  onError: (error) => {
    toast.error(error.message);
  }
});

const handleCreatePost = (data: PostData) => mutation.mutate(data);
```

---

## Backend Code Standards

### Controller Structure
```typescript
// ✅ Good: Express controller with error handling
import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';

export async function getUserProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    next(error); // Pass to error handler middleware
  }
}
```

### Database Queries with Prisma
```typescript
// ✅ Good: Explicit include relations, type safety
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    posts: {
      orderBy: { createdAt: 'desc' },
      take: 10
    },
    mentorshipProfile: true
  }
});

// ✅ Good: Pagination
const { page = 1, limit = 20 } = req.query;
const skip = (parseInt(page) - 1) * parseInt(limit);

const [users, total] = await Promise.all([
  prisma.user.findMany({ skip, take: parseInt(limit) }),
  prisma.user.count()
]);

res.json({ users, total, page, pages: Math.ceil(total / limit) });

// ✅ Good: Transactions for data consistency
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.update({ where: { id }, data: { status: 'ACTIVE' } });
  await tx.auditLog.create({ data: { action: 'USER_ACTIVATED', userId: id } });
  return user;
});

// ❌ Bad: Don't select all fields unnecessarily
const user = await prisma.user.findUnique({
  where: { id }
  // should specify include/select
});
```

### Error Handling
```typescript
// ✅ Good: Custom error class
class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

throw new ApiError(404, 'User not found');
throw new ApiError(403, 'Unauthorized access');

// ✅ Good: Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.name
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});
```

### Input Validation
```typescript
// ✅ Good: Validate at controller entry
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain number');
  
  return { valid: errors.length === 0, errors };
}

// ✅ Usage in controller
const { valid, errors } = validatePassword(req.body.password);
if (!valid) {
  return res.status(400).json({ success: false, error: 'Invalid password', details: errors });
}
```

---

## Git & Commit Conventions

### Branch Naming
```
feature/add-mentorship-profile
feature/fix-post-comments-sorting
bugfix/auth-token-expiry
chore/update-dependencies
docs/add-deployment-guide
```

### Commit Messages
```
✅ Good:
- feat: Add mentorship profile management
- fix: Resolve post comment ordering bug
- docs: Update installation guide
- refactor: Simplify user auth middleware
- test: Add unit tests for password validation

❌ Bad:
- fixed stuff
- update
- asdf
- another commit
```

### Pull Request Conventions
```
Title: [TYPE] Brief description
- feat: New feature
- fix: Bug fix
- docs: Documentation
- refactor: Code refactor
- test: Test addition

Description should include:
- What was changed
- Why it was changed
- How to test the change
- Related issue numbers (#123)
```

---

## File Organization

### Frontend Structure
```
src/
├── components/
│   ├── ui/                # Reusable UI primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── layout/            # Layout wrappers
│   ├── posts/             # Feature-specific
│   │   ├── PostCard.tsx
│   │   ├── PostForm.tsx
│   │   └── index.ts       # Barrel export
│   └── ...
├── hooks/
│   ├── useAuth.ts
│   ├── usePosts.ts
│   └── index.ts
├── pages/
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   └── ...
├── services/
│   ├── postService.ts
│   ├── userService.ts
│   └── index.ts
├── types/
│   ├── index.ts           # All type exports
│   └── user.ts
├── lib/
│   ├── api.ts             # Axios configuration
│   ├── utils.ts           # Utilities
│   └── constants.ts
├── contexts/
│   └── AuthContext.tsx
└── App.tsx
```

### Backend Structure
```
backend/
├── src/
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Express middleware
│   ├── lib/               # Utilities & config
│   ├── models/            # Types (not ORMs)
│   ├── routes/            # Route definitions
│   ├── services/          # Business logic (optional)
│   └── server.ts          # Entry point
├── prisma/
│   └── schema.prisma      # Database schema
└── tests/
    └── ...
```

---

## Documentation Standards

### Code Comments
```typescript
// ✅ Good: Explain WHY, not WHAT
// We set a 1-hour expiry on access tokens to balance security and UX
const JWT_ACCESS_EXPIRY = '1h';

// ✅ Good: For complex logic
// Perform binary search to find insertion point for optimal performance O(log n)
const index = binarySearch(items, newItem);

// ❌ Bad: Redundant comments
const name = 'John'; // Setting name to 'John'

// ❌ Bad: Outdated comments
// This used to be 5 minutes but we changed it (wrong! It's 1 hour)
const JWT_ACCESS_EXPIRY = '1h';
```

### Function Documentation
```typescript
/**
 * Creates a new post for the authenticated user
 * @param userId - ID of the user creating the post
 * @param data - Post content and metadata
 * @returns The created post with ID
 * @throws ApiError if user not found or validation fails
 */
async function createPost(userId: string, data: PostCreateInput): Promise<Post> {
  // implementation
}
```

---

## Testing Conventions

### Test File Naming
```
MyComponent.test.tsx        // Unit tests
MyComponent.integration.ts  // Integration tests
utils.spec.ts              # Spec-style tests
```

### Test Structure
```typescript
describe('UserService', () => {
  describe('getUser', () => {
    it('should return user by id', async () => {
      const user = await userService.getUser('123');
      expect(user.id).toBe('123');
    });
    
    it('should throw error if user not found', async () => {
      await expect(userService.getUser('invalid')).rejects.toThrow();
    });
  });
});
```

---

## Code Review Checklist

Before submitting a PR, ensure:
- [ ] Code follows conventions in this doc
- [ ] No console.log() statements (except errors)
- [ ] No commented-out code
- [ ] Types are properly defined
- [ ] Error handling is in place
- [ ] No hardcoded secrets/credentials
- [ ] Performance implications considered
- [ ] Accessibility standards met
- [ ] Responsive design verified
- [ ] Tests added/updated as needed
