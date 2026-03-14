# Backend Features Structure

Each feature in the backend contains its own routes and controllers.

## Feature Folders

### `auth/`
- Contains:
  - auth.ts (routes)
  - authController.ts (logic)
- Handles: Login, registration, JWT, password reset

### `users/`
- Contains:
  - users.ts (routes)
  - userController.ts (logic)
- Handles: User profile, user data, user approval

### `posts/`
- Contains:
  - posts.ts (routes)
  - postController.ts (logic)
  - commentController.ts (comment logic)
  - comments.ts (comment routes)
- Handles: Create/read/update/delete posts, comments, reactions

### `mentorship/`
- Contains:
  - mentorship.ts (routes)
  - mentorshipController.ts (logic)
- Handles: Mentorship requests, matching, status

### `jobs/`
- Contains:
  - jobs.ts (routes)
  - jobController.ts (logic)
- Handles: Job postings, applications, listings

### `events/`
- Contains:
  - events.ts (routes)
  - eventController.ts (logic)
- Handles: Event creation, RSVPs, event listings

### `groups/`
- Contains:
  - groups.ts (routes)
  - groupController.ts (logic)
- Handles: Group creation, discussions, members

### `uploads/`
- Contains:
  - uploads.ts (routes)
  - uploadController.ts (logic)
- Handles: File uploads, media management

### `reports/`
- Contains:
  - reports.ts (routes)
  - reportController.ts (logic)
- Handles: User reports, moderation

### `status/`
- Contains:
  - status.ts (routes)
  - statusController.ts (logic)
- Handles: System status, health checks

## Shared Folder Structure

### `middleware/`
- auth.ts - Authentication middleware
- errorHandler.ts - Error handling
- rateLimiter.ts - Rate limiting
- validation.ts - Request validation
- Other common middleware

### `config/`
- database.ts - Database connection
- prisma.ts - Prisma setup
- Other configuration files

### `models/`
- User.ts - User model
- Other data models

### `utils/`
- Helper functions
- Utility functions
- Common logic

## File Organization Pattern

For each feature:

```
features/[feature]/
├── routes.ts          # Express routes
├── controller.ts      # Route handlers
├── service.ts         # Business logic (optional)
└── types.ts           # TypeScript types (optional)
```

Example:

```
features/posts/
├── posts.ts           # router.get('/posts'), router.post('/posts')
├── postController.ts  # getPosts(), createPost(), updatePost()
├── comments.ts        # Comment routes
├── commentController.ts # Comment handlers
└── types.ts           # IPost, IComment interfaces
```
