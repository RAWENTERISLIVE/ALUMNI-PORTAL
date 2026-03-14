# 14. Database Operations & Prisma Guide

## Prisma Overview

Prisma is a modern ORM providing type-safe database access with an intuitive API. All database operations use Prisma instead of raw SQL.

**Key Benefits**:
- Type-safe queries with TypeScript
- Auto-generated migrations
- Visual data explorer (Prisma Studio)
- Powerful query API with relations
- Connection pooling out of box

---

## Prisma Schema Basics

**File**: `backend/prisma/schema.prisma`

### Model Definition
```prisma
model User {
  id                    String    @id @default(uuid())
  email                 String    @unique
  password              String
  name                  String
  role                  Role      @default(USER)
  status                Status    @default(PENDING)
  
  // Relations
  posts                 Post[]     @relation("UserPosts")
  mentorshipProfile     MentorshipProfile? @relation("UserMentorshipProfile")
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}

enum Status {
  PENDING
  ACTIVE
  SUSPENDED
  DELETED
}
```

### Field Types & Modifiers
```prisma
String              // Text field
Int                 // Integer
Float               // Decimal number
Boolean             // True/false
DateTime            // Date and time
Json                // Flexible JSON object
Bytes               // Binary data

// Modifiers
@id                 // Primary key
@unique             // Unique constraint
@default(value)     // Default value
@updatedAt          // Auto-updates on change
@relation()         // Define relationships
@@unique([field1, field2])  // Composite unique
@@index([field])    // Database index for performance
```

---

## Common CRUD Operations

### Create
```typescript
// Single create
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    password: 'hashed_password',
    name: 'John Doe',
    role: 'USER',
    status: 'PENDING'
  }
});

// Create with nested data
const post = await prisma.post.create({
  data: {
    title: 'My First Post',
    content: 'Content here...',
    author: {
      connect: { id: userId }  // Connect to existing user
    }
  }
});

// Create multiple
const users = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', password: '...', name: 'User 1' },
    { email: 'user2@example.com', password: '...', name: 'User 2' }
  ]
});
```

### Read
```typescript
// Find single
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// Find with relations
const userWithPosts = await prisma.user.findUnique({
  where: { email: 'john@example.com' },
  include: {
    posts: {
      orderBy: { createdAt: 'desc' },
      take: 10  // Limit to 10 posts
    }
  }
});

// Find many
const activeUsers = await prisma.user.findMany({
  where: { status: 'ACTIVE' },
  orderBy: { createdAt: 'desc' },
  skip: 20,      // Pagination offset
  take: 20       // Limit
});

// Count
const totalUsers = await prisma.user.count({
  where: { status: 'ACTIVE' }
});

// Find first matching
const adminUser = await prisma.user.findFirst({
  where: { role: 'ADMIN' }
});
```

### Update
```typescript
// Update single
const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: {
    name: 'New Name',
    headline: 'New headline'
  }
});

// Update with relations
const post = await prisma.post.update({
  where: { id: postId },
  data: {
    title: 'Updated Title',
    tags: ['new', 'tags']
  },
  include: { author: true }
});

// Update many
const result = await prisma.user.updateMany({
  where: { status: 'PENDING' },
  data: { status: 'ACTIVE' }
});
// Returns { count: number_of_updated_records }

// Increment/decrement
const post = await prisma.post.update({
  where: { id: postId },
  data: {
    commentCount: { increment: 1 }  // Add 1
    // or: { decrement: 1 } to subtract
  }
});

// Upsert (update or create)
const user = await prisma.user.upsert({
  where: { email: 'john@example.com' },
  update: { lastLogin: new Date() },
  create: {
    email: 'john@example.com',
    password: 'hashed',
    name: 'John Doe'
  }
});
```

### Delete
```typescript
// Delete single
const deletedUser = await prisma.user.delete({
  where: { id: userId }
});

// Delete many
const result = await prisma.post.deleteMany({
  where: { authorId: userId }
});
// Returns count of deleted records

// Delete with cascade
// Set `onDelete: Cascade` in @relation to auto-delete related records
const user = await prisma.user.delete({
  where: { id: userId }
  // All related posts are auto-deleted
});
```

---

## Advanced Queries

### Complex Filters with AND/OR
```typescript
// AND: All conditions must be true (implicit in where)
const users = await prisma.user.findMany({
  where: {
    status: 'ACTIVE',
    role: 'USER',
    // AND: createdAt > 90 days ago
    createdAt: { gt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
  }
});

// OR: Any condition can be true
const users = await prisma.user.findMany({
  where: {
    OR: [
      { role: 'ADMIN' },
      { isAvailableAsMentor: true }
    ]
  }
});

// Complex combo
const results = await prisma.user.findMany({
  where: {
    AND: [
      { status: 'ACTIVE' },
      {
        OR: [
          { role: 'ADMIN' },
          { mentorshipProfile: { isMentor: true } }
        ]
      }
    ]
  }
});
```

### Full-Text Search
```typescript
// Search in title or content (requires @db.Text)
const posts = await prisma.post.findMany({
  where: {
    OR: [
      { title: { contains: 'react', mode: 'insensitive' } },
      { content: { contains: 'react', mode: 'insensitive' } }
    ]
  }
});

// Starts with
const users = await prisma.user.findMany({
  where: { name: { startsWith: 'John', mode: 'insensitive' } }
});

// Ends with
const users = await prisma.user.findMany({
  where: { email: { endsWith: '@example.com' } }
});
```

### Relations & Nested Filters
```typescript
// Get users who have posts in specific category
const users = await prisma.user.findMany({
  where: {
    posts: {
      some: { category: 'jobs' }
    }
  }
});

// Get posts with comments from specific user
const posts = await prisma.post.findMany({
  where: {
    comments: {
      some: { authorId: userId }
    }
  }
});

// Get groups with more than 10 members
const groups = await prisma.group.findMany({
  where: {
    members: {
      _count: { gt: 10 }
    }
  }
});
```

### Aggregations
```typescript
// Count
const userCount = await prisma.user.count({
  where: { status: 'ACTIVE' }
});

// Aggregate with grouping
const stats = await prisma.user.aggregate({
  _count: true,        // Count all records
  _min: { createdAt: true },
  _max: { createdAt: true }
});
// Returns { _count: 150, _min: {...}, _max: {...} }

// Group by role
const byRole = await prisma.user.groupBy({
  by: ['role'],
  _count: true
});
// Returns [
//   { role: 'USER', _count: 100 },
//   { role: 'ADMIN', _count: 5 }
// ]
```

### Pagination Pattern
```typescript
async function getPaginatedPosts(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { visibility: 'PUBLIC' },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        author: { select: { id: true, name: true, profileImage: true } },
        _count: { select: { reactions: true, comments: true } }
      }
    }),
    prisma.post.count({ where: { visibility: 'PUBLIC' } })
  ]);
  
  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit)
    }
  };
}
```

---

## Transactions & Data Consistency

### Basic Transaction
```typescript
// Ensure both operations succeed or both fail
const result = await prisma.$transaction(async (tx) => {
  // Create user
  const user = await tx.user.create({
    data: { email, password, name }
  });
  
  // Create mentorship profile
  const mentorProfile = await tx.mentorshipProfile.create({
    data: { userId: user.id, isMentor: false }
  });
  
  return { user, mentorProfile };
});
```

### Transaction with Rollback on Error
```typescript
try {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' }
    });
    
    // This might fail
    await sendEmailNotification(user.email);
    
    // If email fails, entire transaction rolls back
  });
} catch (error) {
  console.error('Transaction failed, all changes rolled back');
}
```

### Atomic Increment (prevents race conditions)
```typescript
// Safe counter increment
await prisma.post.update({
  where: { id: postId },
  data: {
    commentCount: { increment: 1 }  // Atomic!
  }
});
// Much safer than:
// const post = await prisma.post.findUnique({where: {id}});
// await prisma.post.update({data: {commentCount: post.commentCount + 1}});
// ^ This can race and lose counts
```

---

## Prisma Tools & Commands

### Prisma Studio (Visual Data Manager)
```bash
cd backend
npx prisma studio

# Opens at http://localhost:5555
# Browse, view, create, edit, delete records visually
```

### Migrations
```bash
# Create a new migration after schema change
npx prisma migrate dev --name add_new_field

# List all migrations
npx prisma migrate status

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Deploy migrations (production)
npx prisma migrate deploy

# Resolve failed migrations
npx prisma migrate resolve --rolled-back migration_name
```

### Generate Client
```bash
# Regenerate Prisma client after schema changes
npx prisma generate

# Auto-generates at node_modules/.prisma/client
```

### Database Commands
```bash
# Execute raw SQL
npx prisma db execute --stdin < script.sql

# Push schema to database (without migrations)
npx prisma db push

# Seed database
npx prisma db seed
```

---

## Performance Optimization

### Select Specific Fields
```typescript
// ❌ Bad: Loads all fields
const users = await prisma.user.findMany();

// ✅ Good: Only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
    // password, tokens, etc. NOT loaded
  }
});
```

### Batch Queries
```typescript
// ❌ Bad: N+1 problem (queries in loop)
const posts = await prisma.post.findMany();
posts.forEach(async (post) => {
  const author = await prisma.user.findUnique({ where: { id: post.authorId } });
  // 1 + N queries!
});

// ✅ Good: Single query with includes
const posts = await prisma.post.findMany({
  include: { author: true }
});
// 1 query only!
```

### Limit Nested Includes
```typescript
// ❌ Bad: Deep nesting causes performance issues
const user = await prisma.user.findUnique({
  where: { id },
  include: {
    posts: {
      include: {
        comments: {
          include: {
            author: {
              include: { mentorshipProfile: true }
            }
          }
        }
      }
    }
  }
});

// ✅ Good: Shallow, targeted includes
const user = await prisma.user.findUnique({
  where: { id },
  include: {
    posts: { select: { id: true, title: true } }
  }
});
```

### Add Database Indexes
```prisma
model Post {
  id       String @id @default(uuid())
  content  String
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
  
  // Index frequently queried fields
  @@index([authorId])
  @@index([createdAt])  // For sorting
}

model Comment {
  id     String @id @default(uuid())
  postId String
  post   Post   @relation(fields: [postId], references: [id])
  
  // Composite index for finding comments on a post
  @@index([postId])
}
```

---

## Common Patterns

### Author Check
```typescript
// Ensure user is post author
const post = await prisma.post.findUnique({
  where: { id: postId }
});

if (post?.authorId !== userId) {
  throw new UnauthorizedException('Only post author can edit');
}
```

### Soft Delete
```prisma
enum Status {
  ACTIVE
  DELETED  // Soft delete via status change
}
```

```typescript
// Delete
await prisma.user.update({
  where: { id: userId },
  data: { status: 'DELETED' }
});

// Query only active
const activeUsers = await prisma.user.findMany({
  where: { status: 'ACTIVE' }
});
```

### Return Updated Count
```typescript
const result = await prisma.user.updateMany({
  where: { status: 'PENDING' },
  data: { status: 'ACTIVE' }
});

return {
  message: `Updated ${result.count} users`
};
```

---

## Debugging

### Log Queries
```bash
# Enable Prisma logging
DATABASE_URL="postgresql://...?schema=public" DEBUG=prisma:* npm run dev
```

### Check Query Performance
```typescript
const start = Date.now();

const users = await prisma.user.findMany({
  take: 1000
});

console.log(`Query took ${Date.now() - start}ms`);
```

### Validate Data Consistency
```bash
# Check database integrity
npx prisma db execute --stdin < validate.sql

# Example validate.sql:
SELECT COUNT(*) as total_users FROM "User";
SELECT COUNT(*) as total_posts FROM "Post";
```
