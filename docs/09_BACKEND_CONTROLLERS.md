# 9. Backend Controllers & API Implementation

## Overview
All backend business logic is organized into feature-specific controllers using Express.js with TypeScript. Each controller handles CRUD operations, validation, and business logic for its domain using Prisma for database interactions.

---

## Controller Architecture

### File Organization
```
backend/src/
├── controllers/
│   ├── authController.ts          # Authentication & JWT
│   ├── userController.ts          # User management & profiles
│   ├── postController.ts          # Posts, reactions, comments
│   ├── commentController.ts       # Comment-specific operations
│   ├── jobController.ts           # Job board operations
│   ├── eventController.ts         # Event management
│   ├── groupController.ts         # Group management
│   ├── mentorshipController.ts    # Mentorship requests & profiles
│   ├── reportController.ts        # Moderation & reporting
│   ├── statusController.ts        # System status endpoints
│   └── uploadController.ts        # File upload handling
├── middleware/
│   ├── auth.ts                    # JWT verification & RBAC
│   ├── validation.ts              # Input sanitization
│   └── errorHandler.ts            # Global error handling
├── lib/
│   └── prisma.ts                  # Prisma client singleton
└── routes/
    ├── auth.ts
    ├── users.ts
    ├── posts.ts
    └── ... (feature routes)
```

---

## Core Controllers 

### 1. authController.ts
**Purpose**: Handle user authentication lifecycle including registration, login, token refresh, and password management.

**Key Functions**:

#### `register(req, res)`
- **Route**: `POST /auth/register`
- **Body**: 
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "admissionNumber": "501/21",  // OR
    "admissionYear": "2020"
  }
  ```
- **Logic**:
  - Validate email uniqueness
  - Hash password with bcrypt (10 rounds)
  - Check admission number format
  - Create user with `PENDING` status
  - Send verification email
- **Response**: `{ success: true, message: "Registration successful" }`

#### `login(req, res)`
- **Route**: `POST /auth/login`
- **Body**: `{ "email", "password" }`
- **Logic**:
  - Verify email exists
  - Compare password hash
  - Check user status (PENDING users rejected)
  - Generate JWT access token (1 hour)
  - Generate refresh token (7 days)
  - Return tokens + user object
- **Response**: 
  ```json
  {
    "success": true,
    "accessToken": "eyJhbGc...",
    "refreshToken": "refresh...",
    "user": { "id", "email", "name", "role" }
  }
  ```

#### `refresh(req, res)`
- **Route**: `POST /auth/refresh`
- **Body**: `{ "refreshToken" }`
- **Logic**:
  - Verify refresh token validity
  - Generate new access token
  - Maintain refresh token
- **Response**: `{ "accessToken": "new jwt token" }`

#### `getCurrentUser(req, res)`
- **Route**: `GET /auth/me`
- **Auth**: Required (Bearer token)
- **Logic**:
  - Extract user ID from JWT
  - Fetch full user profile
  - Calculate profile completion percentage
  - Return enhanced user object
- **Response**:
  ```json
  {
    "user": {
      "id", "email", "name", "bio", "profileImage",
      "profileCompletion": 65
    }
  }
  ```

#### `forgotPassword(req, res)`
- **Route**: `POST /auth/forgot-password`
- **Body**: `{ "email" }`
- **Logic**:
  - Find user by email
  - Generate secure reset token
  - Set reset token expiry (1 hour)
  - Send email with reset link
- **Response**: `{ "success": true, "message": "Email sent" }`

#### `resetPassword(req, res)`
- **Route**: `POST /auth/reset-password`
- **Body**: `{ "token", "password" }`
- **Logic**:
  - Verify reset token validity and expiry
  - Hash new password
  - Clear reset token
  - Update user password
- **Response**: `{ "success": true }`

#### `changePassword(req, res)`
- **Route**: `POST /auth/change-password`
- **Auth**: Required
- **Body**: `{ "currentPassword", "newPassword" }`
- **Logic**:
  - Verify current password
  - Validate new password strength
  - Update password
  - Clear all active refresh tokens (force re-login)

---

### 2. userController.ts
**Purpose**: User profile management, admin operations, and alumni directory.

**Key Functions**:

#### `getAllUsers(req, res)`
- **Route**: `GET /users`
- **Auth**: Admin required
- **Query Params**: `{ page: 1, limit: 10, search: "", status: "" }`
- **Logic**:
  - Apply filters (status, search by name/email)
  - Paginate results
  - Count total records
  - Return sanitized user data
- **Response**:
  ```json
  {
    "users": [...],
    "total": 150,
    "page": 1,
    "pages": 15
  }
  ```

#### `getPendingUsers(req, res)`
- **Route**: `GET /users/pending`
- **Auth**: Admin required
- **Logic**: Fetch users with `status = PENDING`
- **Response**: Array of pending users

#### `getUserById(req, res)`
- **Route**: `GET /users/:id`
- **Logic**:
  - Fetch user by ID
  - Check visibility settings (privacy rules)
  - Return profile with allowed fields
- **Response**: User object (sanitized by privacy settings)

#### `updateUserProfile(req, res)`
- **Route**: `PUT /users/:id`
- **Auth**: Required (self or admin)
- **Body**:
  ```json
  {
    "name": "John Doe",
    "bio": "Software Engineer",
    "headline": "CTO at TechCorp",
    "company": "TechCorp",
    "jobTitle": "CTO",
    "linkedInProfile": "https://...",
    "isAvailableAsMentor": true,
    "privacySettings": { "bio": "alumni", "email": "connections" }
  }
  ```
- **Logic**:
  - Validate input
  - Update fields
  - Calculate profile completion
  - Audit log entry
- **Response**: Updated user object

#### `approveUser(req, res)`
- **Route**: `PUT /users/:id/approve`
- **Auth**: Admin required
- **Logic**:
  - Change status from `PENDING` to `ACTIVE`
  - Send approval email
  - Audit log entry
- **Response**: `{ "success": true }`

#### `rejectUser(req, res)`
- **Route**: `DELETE /users/:id/reject`
- **Auth**: Admin required
- **Logic**:
  - Mark user as `DELETED`
  - Send rejection email
- **Response**: `{ "success": true }`

#### `suspendUser(req, res)`
- **Route**: `PUT /users/:id/suspend`
- **Auth**: Admin required
- **Logic**: Change status to `SUSPENDED`, revoke refresh tokens

---

### 3. postController.ts
**Purpose**: Social feed posts, reactions, bookmarks, comments.

**Key Functions**:

#### `createPost(req, res)`
- **Route**: `POST /posts`
- **Auth**: Required
- **Body**:
  ```json
  {
    "title": "Amazing opportunity",
    "content": "Rich HTML content...",
    "visibility": "public",
    "category": "general",
    "tags": ["tech", "career"],
    "attachments": [{ "type": "image", "url": "..." }],
    "sharedPostId": null
  }
  ```
- **Logic**:
  - Validate content length
  - Create post with authorId
  - Store attachments
  - Increment post count for author
  - Audit log entry
- **Response**: Created post object with ID

#### `getFeed(req, res)`
- **Route**: `GET /posts?page=1&limit=20&category=general`
- **Auth**: Optional (different results for auth'd vs non-auth'd)
- **Logic**:
  - Build visibility filters based on user's connections/groups
  - Fetch posts (connections → groups → featured → public)
  - Include reaction counts
  - Include author details
  - Sort by createdAt DESC
- **Response**: Array of posts with metadata

#### `likePost(req, res)`
- **Route**: `POST /posts/:id/like`
- **Auth**: Required
- **Logic**:
  - Check if user already reacted
  - Create or delete PostReaction record
  - Update post reaction count
  - Emit socket event for real-time update
- **Response**: `{ "liked": true, "count": 42 }`

#### `bookmarkPost(req, res)`
- **Route**: `POST /posts/:id/bookmark`
- **Auth**: Required
- **Logic**:
  - Add user to post's bookmarks array
  - Audit log entry
- **Response**: `{ "bookmarked": true }`

#### `deletePost(req, res)`
- **Route**: `DELETE /posts/:id`
- **Auth**: Required (author or admin)
- **Logic**:
  - Verify authorization
  - Delete related comments, reactions
  - Delete post
  - Audit log
- **Response**: `{ "success": true }`

---

### 4. commentController.ts
**Purpose**: Comment CRUD and nested comment handling.

**Key Functions**:

#### `addComment(req, res)`
- **Route**: `POST /posts/:id/comments`
- **Auth**: Required
- **Body**: `{ "content": "Great post!", "parentCommentId": null }`
- **Logic**:
  - Create comment linked to post
  - Support nested replies (parentCommentId)
  - Increment post's commentCount
  - Emit socket event
- **Response**: Created comment object

#### `getComments(req, res)`
- **Route**: `GET /posts/:id/comments`
- **Logic**:
  - Fetch top-level comments
  - Include nested replies
  - Sort by createdAt
  - Include author info and likes count
- **Response**: Threaded comments array

#### `likeComment(req, res)`
- **Route**: `POST /comments/:id/like`
- **Auth**: Required
- **Logic**:
  - Toggle user in comment's likes array
  - Update count
- **Response**: `{ "liked": true }`

---

### 5. jobController.ts
**Purpose**: Job board operations including posting, applying, and filtering.

**Key Functions**:

#### `createJob(req, res)`
- **Route**: `POST /jobs`
- **Auth**: Required
- **Body**:
  ```json
  {
    "title": "Senior Engineer",
    "company": "TechCorp",
    "location": "San Francisco, CA",
    "type": "full-time",
    "salaryRangeMin": 120000,
    "salaryRangeMax": 160000,
    "description": "We are looking for...",
    "requirements": ["5+ years exp", "React"],
    "benefits": ["Health insurance", "401k"],
    "applicationUrl": "https://apply.techcorp.com",
    "tags": ["javascript", "react"]
  }
  ```
- **Logic**:
  - Validate required fields
  - Set status to `ACTIVE`
  - Create job with postedById
  - Audit log
- **Response**: Created job object

#### `getJobs(req, res)`
- **Route**: `GET /jobs?page=1&type=full-time&location=SF&search=engineer`
- **Logic**:
  - Filter by type (full-time, part-time, etc.)
  - Filter by location
  - Full-text search on title/description
  - Paginate
  - Sort by createdAt DESC
- **Response**: Jobs array with pagination

#### `getJobDetails(req, res)`
- **Route**: `GET /jobs/:id`
- **Logic**:
  - Fetch job
  - Include company logo/info
  - Include application count
  - Return salary if authenticated as poster

#### `applyForJob(req, res)`
- **Route**: `POST /jobs/:id/apply`
- **Auth**: Required
- **Body**: `{ "resumeUrl": "...", "coverLetter": "..." }`
- **Logic**:
  - Check if already applied
  - Create application record
  - Increment job's applicationCount
  - Send notification to job poster
  - Audit log
- **Response**: `{ "success": true, "message": "Application submitted" }`

#### `saveJob(req, res)`
- **Route**: `POST /jobs/:id/save`
- **Auth**: Required
- **Logic**:
  - Add job to user's savedJobs array
  - Toggles if already saved
- **Response**: `{ "saved": true }`

---

### 6. mentorshipController.ts
**Purpose**: Mentorship request management and mentor profile operations.

**Key Functions**:

#### `createMentorshipRequest(req, res)`
- **Route**: `POST /mentorship/request`
- **Auth**: Required
- **Body**: `{ "mentorProfileId": "...", "message": "I want to learn..." }`
- **Logic**:
  - Verify mentor exists and is active
  - Check if request already exists
  - Create request with status `pending`
  - Send notification to mentor
  - Audit log
- **Response**: Created request object

#### `respondToRequest(req, res)`
- **Route**: `PUT /mentorship/request/:id`
- **Auth**: Required
- **Body**: `{ "status": "accepted" }` // or "rejected"
- **Logic**:
  - Update request status
  - If accepted: update mentor's currentMentees count
  - Send notification to mentee
  - Audit log
- **Response**: Updated request

#### `getMentorProfile(req, res)`
- **Route**: `GET /mentors/:userId`
- **Logic**:
  - Fetch user's mentorship profile
  - Include expertise, availability, ratings
  - Count pending requests
- **Response**: Mentorship profile object

#### `updateMentorProfile(req, res)`
- **Route**: `PUT /mentors/:userId`
- **Auth**: Required (self or admin)
- **Body**:
  ```json
  {
    "expertise": ["React", "Node.js"],
    "yearsOfExperience": 8,
    "bio": "I love mentoring...",
    "availability": "high",
    "maxMentees": 5
  }
  ```
- **Logic**:
  - Update or create mentorship profile
  - Validate expertise tags
  - Audit log
- **Response**: Updated profile

---

### 7. groupController.ts
**Purpose**: Group management, member operations, and group messaging.

**Key Functions**:

#### `createGroup(req, res)`
- **Route**: `POST /groups`
- **Auth**: Required
- **Body**:
  ```json
  {
    "name": "React Enthusiasts",
    "description": "A group for React lovers",
    "category": "professional",
    "privacy": "public"
  }
  ```
- **Logic**:
  - Create group with creatorId
  - Add creator as first member
  - Audit log
- **Response**: Created group object

#### `joinGroup(req, res)`
- **Route**: `POST /groups/:id/join`
- **Auth**: Required
- **Logic**:
  - Check privacy (public joins immediately, private pending)
  - Add user to members array
  - Update memberCount
  - Send notifications
  - Audit log
- **Response**: `{ "success": true }`

#### `getGroupMembers(req, res)`
- **Route**: `GET /groups/:id/members`
- **Logic**: Return paginated members list
- **Response**: Members array with pagination

#### `sendGroupMessage(req, res)`
- **Route**: `POST /groups/:id/messages`
- **Auth**: Required
- **Body**: `{ "content": "Great point!", "replyToId": null }`
- **Logic**:
  - Create group message
  - Support nested replies
  - Emit socket event for real-time delivery
  - Audit log
- **Response**: Created message object

---

### 8. reportController.ts
**Purpose**: Content moderation and user reporting.

**Key Functions**:

#### `submitReport(req, res)`
- **Route**: `POST /reports`
- **Auth**: Required
- **Body**:
  ```json
  {
    "type": "post",
    "reason": "inappropriate_content",
    "description": "This post contains...",
    "reportedPostId": "..."
  }
  ```
- **Logic**:
  - Validate report type and reason
  - Check for duplicate reports
  - Create report with `pending` status
  - Notify admins
  - Audit log
- **Response**: `{ "success": true }`

#### `getReports(req, res)`
- **Route**: `GET /reports` (Admin only)
- **Query**: `{ page, status: "pending" }`
- **Logic**:
  - Fetch reports with status filter
  - Include reported content/user details
  - Paginate
- **Response**: Reports array

#### `reviewReport(req, res)`
- **Route**: `PUT /reports/:id`
- **Auth**: Admin required
- **Body**:
  ```json
  {
    "status": "resolved",
    "action": "remove_content",
    "adminNotes": "Content violated guidelines"
  }
  ```
- **Logic**:
  - Update report status
  - Take action (remove content, suspend user, etc.)
  - Send notifications
  - Audit log
- **Response**: Updated report

---

### 9. eventController.ts
**Purpose**: Event creation, RSVP management, and event listings.

**Key Functions**:

#### `createEvent(req, res)`
- **Route**: `POST /events`
- **Auth**: Required
- **Body**:
  ```json
  {
    "title": "Alumni Networking Dinner",
    "description": "Join us for...",
    "date": "2025-03-20",
    "time": "18:00",
    "location": "Downtown Hotel",
    "maxAttendees": 200,
    "isVirtual": false,
    "category": "networking"
  }
  ```
- **Logic**:
  - Validate date/time
  - Create event with organizerId
  - Audit log
- **Response**: Created event object

#### `rsvpEvent(req, res)`
- **Route**: `POST /events/:id/rsvp`
- **Auth**: Required
- **Body**: `{ "attending": true }`
- **Logic**:
  - Add/remove user from attendees
  - Check maxAttendees limit
  - Send confirmation email
  - Emit socket event
- **Response**: `{ "attending": true }`

---

### 10. uploadController.ts
**Purpose**: File upload handling with validation and storage.

**Key Functions**:

#### `uploadFile(req, res)`
- **Route**: `POST /upload`
- **Auth**: Required
- **Middleware**: `multer` for file handling
- **Validation**:
  - Max size: 50MB
  - Allowed types: jpg, png, pdf, doc, docx
- **Logic**:
  - Scan file for malware (optional)
  - Store in `uploads/` directory
  - Create File record in DB
  - Return file URL
- **Response**:
  ```json
  {
    "url": "/uploads/file-uuid.pdf",
    "filename": "resume.pdf",
    "size": 2048000
  }
  ```

---

## Middleware Stack

### Authentication Middleware
```typescript
// verifyToken.ts
- Extracts JWT from Authorization header
- Verifies signature with JWT_SECRET
- Attaches user object to req.user
- Returns 401 if invalid/expired
```

### Authorization Middleware
```typescript
// isAdmin.ts
- Checks if req.user.role === ADMIN or SUPER_ADMIN
- Returns 403 if not authorized

// isSelfOrAdmin.ts
- Allows if user is making request about themselves OR is admin
```

### Rate Limiting
```typescript
// Applied globally and per-endpoint
- Auth endpoints: 5 requests/15 minutes
- Registration: 3 requests/hour
- General API: 100 requests/hour
```

### Validation Middleware
```typescript
// Input sanitization using express-validator
- Email format validation
- Password strength requirements
- Required fields checking
- XSS protection
```

---

## Error Handling

### Global Error Handler
```typescript
// middleware/errorHandler.ts
- Catches all thrown errors
- Formats error responses
- Logs to audit trail
- Returns appropriate HTTP status codes

// Standard error response:
{
  "success": false,
  "error": "User not found",
  "code": "USER_NOT_FOUND",
  "statusCode": 404
}
```

### Controller Response Pattern
```typescript
// Success
res.json({ success: true, data: {...} });

// Error
res.status(400).json({ 
  success: false, 
  error: "Validation failed",
  details: [...validation errors]
});

// Not found
res.status(404).json({ 
  success: false, 
  error: "Resource not found" 
});
```
