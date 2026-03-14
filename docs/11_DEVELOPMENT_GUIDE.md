# 11. Development & Frontend Features Guide

## Frontend Architecture Overview

The frontend is a **React 18 SPA** using **Vite** as build tool with **TypeScript** for type safety. It communicates with the backend through REST API calls via **Axios**.

---

## Key Frontend Features

### 1. Authentication & Authorization

#### JWT Flow
- User logs in → Receives `accessToken` (1 hour) + `refreshToken` (7 days)
- On protected routes, `accessToken` attached to every API request
- When `accessToken` expires → Axios interceptor automatically calls `/auth/refresh`
- New `accessToken` issued, original request retried transparently
- User never sees the token refresh (seamless experience)

#### Protected Routes
```typescript
// src/components/ProtectedRoute.tsx
<ProtectedRoute role="USER">
  <DashboardPage />
</ProtectedRoute>

// Checks: Is user authenticated? Has required role?
```

#### Role-Based Access
Three roles enforced:
- **USER**: Standard user (alumni/student)
- **ADMIN**: Can moderate content, manage reports
- **SUPER_ADMIN**: Full system control (user approval, role assignment)

---

### 2. Home Feed System

**Location**: `src/pages/HomePage.tsx`

**Features**:
- Dynamic post aggregation from:
  - Posts from connections
  - Posts from user's groups
  - Featured posts (pinned by admin)
  - School updates (official announcements)
  - Public posts (by discovery)

**Feed Filters**:
- All posts
- Connections only
- Groups only
- Jobs posted
- Events happening soon

**Real-time Updates** (planned):
- WebSocket integration for live reaction counts
- New comment notifications
- New post alerts

---

### 3. User Profiles & Connections

**Profile Page**: `src/pages/ProfilePage.tsx`

**Profile Components**:
- Avatar image (upload or fallback initials)
- Bio and headline
- Professional info (company, job title, LinkedIn)
- Skills/tags
- Mentor availability toggle
- Privacy settings per section (public/alumni/connections)

**Profile Completion Tracking**:
- Calculated as percentage
- Missing: bio → +10%, company → +15%, etc.
- Displayed as progress bar
- Motivates users to complete profiles

**Connections System**:
- Send connection requests
- Accept/decline requests
- View connections list
- Mutual connections unlock "connections-only" content

**Alumni Directory**: `src/pages/DirectoryPage.tsx`
- Search by name, company, graduation year
- Filter by skills, location, department
- View alumni profiles with privacy respect
- Connect/message directly

---

### 4. Posts, Comments & Reactions

**Post Features**:
- Create posts with rich text editor
- Upload images/files (drag-and-drop)
- Tag people with @mentions
- Change visibility (PUBLIC, ALUMNI, CONNECTIONS, GROUPS)
- Edit/delete own posts
- Share other posts (repost)

**Commenting System**:
- Nested/threaded comments
- Reply to specific comments
- Like individual comments
- Edit/delete own comments
- @mention support in comments

**Reactions**:
- Like posts
- See reaction counts
- Real-time reaction updates (WebSocket)

**Bookmarking**:
- Save posts for later
- Access saved posts in profile
- Bookmark list visible only to you

---

### 5. Jobs Board

**Job Search**: `src/pages/JobsPage.tsx`

**Features**:
- Search jobs by title, company, location
- Filter by:
  - Job type (full-time, part-time, contract, internship)
  - Experience level
  - Salary range (if available)
  - Remote/on-site
- Sort by newest, most relevant, deadline

**Job Details**:
- Full job description
- Company information
- Required qualifications
- Benefits
- Application link
- Salary range (if shared)

**Job Applications**:
- Apply directly through portal
- Upload resume/attachments
- Write cover letter
- Track application status
- Receive notifications on status changes

**Save Jobs**:
- Save for later viewing
- Build a list of interested positions
- Resume saved search later

---

### 6. Alumni Mentorship

**Mentor Discovery**: `src/pages/MentorshipPage.tsx`

**Features**:
- Browse mentor profiles
- Search by expertise, industry, years of experience
- Filter by availability, location, mentee level
- View mentor ratings and success count

**Request Flow**:
1. Click "Request Mentorship"
2. Compose message about goals
3. Submit request
4. Mentor reviews and accepts/rejects
5. Matched → Schedule meetings

**Mentor Dashboard** (for mentors):
- View pending requests
- Accept/reject mentees
- Manage active mentorships
- Track meetings scheduled
- Leave feedback/ratings

**Mentee Dashboard** (for mentees):
- View active mentors
- Scheduled sessions
- Progress notes
- Rate mentor experience

---

### 7. Groups & Communities

**Groups**: `src/pages/GroupsPage.tsx`

**Features**:
- Browse public groups
- Create groups (public/private)
- Join groups
- Group membership (with approval flow for private groups)
- Group description, banner, category

**Group Feed**:
- Posts exclusive to group members
- Group-specific discussions
- Pinned announcements
- Event listings for group

**Group Management** (creator):
- Edit group details
- Approve/remove members
- Pin announcements
- Create group events
- Manage settings

---

### 8. Events & Networking

**Events**: Integrated across multiple pages

**Features**:
- Browse upcoming events
- Filter by category (networking, workshop, alumni meet, etc.)
- RSVP to events
- View attendee list
- Add to calendar (Google Calendar integration planned)

**Event Details**:
- Date, time, location
- Virtual vs in-person (Zoom link if virtual)
- Max capacity
- Description
- Organizer info
- RSVP status

---

### 9. Settings & Preferences

**Settings Page**: `src/pages/SettingsPage.tsx`

**Account Settings**:
- Change email
- Update password
- Two-factor authentication (2FA)
- Login history
- Active sessions management

**Privacy Settings**:
- Profile visibility (public, alumni only, connections only)
- Who can see contact info
- Who can send messages
- Who can see connection list

**Notification Preferences**:
- Email notifications toggle (per event type)
- Push notifications
- Notification frequency (immediate, daily digest, weekly)
- Unsubscribe from specific alerts

**Data & Export**:
- Download your data (GDPR)
- Delete account (irreversible)
- Data retention settings

---

### 10. Admin Dashboard

**Admin Panel**: `src/pages/AdminPage.tsx`

**User Management**:
- View all users with status
- Approve/reject pending users
- Suspend/reactivate users
- Delete users
- Assign/change roles
- Bulk actions

**Content Moderation**:
- View flagged posts/comments
- Review reports
- Remove content
- Warn/suspend users
- View moderation history

**System Health**:
- Server status
- Database status
- API response times
- User growth metrics
- Activity statistics

**Audit Logs**:
- View complete audit trail
- Filter by action type, user, date range
- Export logs
- Monitor admin actions

---

## State Management

### Global State (Context API)
```typescript
// AuthContext
- currentUser object
- isAuthenticated boolean
- login() / logout() functions
- updateProfile() function

// ThemeContext
- isDarkMode boolean
- toggleDarkMode() function
```

### Server State (React Query)
```typescript
// Queries
useQuery(['posts'], fetchPosts)
useQuery(['user', userId], fetchUserProfile)
useQuery(['jobs', filters], fetchJobs)

// Mutations
useMutation(createPost, { onSuccess: () => queryClient.invalidateQueries(['posts']) })
useMutation(likePost)
```

### Local Form State (useState/useReducer)
```typescript
const [formData, setFormData] = useState({
  title: '',
  content: ''
});

const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
```

---

## API Integration

### Axios Configuration
**File**: `src/lib/api.ts`

**Features**:
- Base URL configuration from `VITE_API_URL`
- Authorization header auto-injection
- Token refresh on 401 response
- Error handling and response transformation
- Request/response interceptors

### API Service Modules
```typescript
// src/services/
- authService.ts       (login, register, logout)
- userService.ts       (profile, directory)
- postService.ts       (CRUD posts, reactions)
- jobService.ts        (job board)
- mentorshipService.ts (mentorship requests)
- groupService.ts      (group operations)
- eventService.ts      (event RSVP)
```

### Usage Pattern
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { postService } from '@/services/postService';

const { data: posts, isLoading } = useQuery(
  ['posts'],
  postService.getFeed
);

const likeMutation = useMutation(
  (postId) => postService.likePost(postId),
  {
    onSuccess: () => queryClient.invalidateQueries(['posts'])
  }
);
```

---

## Routing Structure

**File**: `src/main.tsx` (route definitions)

```typescript
// Public routes
/                    (HomePage)
/register            (RegisterPage)
/login               (LoginPage)
/forgot-password     (ForgotPasswordPage)
/reset-password/:token (ResetPasswordPage)

// Protected routes (USER role required)
/dashboard           (DashboardPage)
/directory           (DirectoryPage)
/profile/:userId     (ProfilePage)
/profile/edit        (EditProfilePage)
/posts               (PostsPage)
/jobs                (JobsPage)
/mentorship          (MentorshipPage)
/groups              (GroupsPage)
/settings            (SettingsPage)

// Admin routes
/admin               (AdminPage)
```

---

## Key Development Patterns

### Custom Hooks
```typescript
// src/hooks/useAuth.ts
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
};

// Usage
const { currentUser, logout } = useAuth();
```

### Error Boundary
```typescript
// Catches runtime errors in components
<ErrorBoundary>
  <ComponentThatMightError />
</ErrorBoundary>
```

### Loading Skeleton
```typescript
{isLoading ? <Skeleton count={5} /> : <PostList posts={posts} />}
```

### Optimistic Updates
```typescript
likeMutation.mutate(postId, {
  onMutate: async (postId) => {
    // Optimistically update cache before server response
    queryClient.setQueryData(['posts'], (old) => {
      // Update only the affected post
      return old.map(p => p.id === postId ? {...p, liked: true} : p);
    });
  },
  onError: () => {
    // Revert on error
    queryClient.invalidateQueries(['posts']);
  }
});
```

---

## Performance Optimization

### Code Splitting
- Each page is lazy-loaded with React.lazy()
- Routes split by feature
- Reduces initial bundle size

### Image Optimization
- Use next-gen formats (WebP)
- Lazy load images below fold
- Responsive images with srcset

### Caching Strategy
- React Query handles server state caching
- Set appropriate stale time for queries
- Invalidate only affected queries on mutations

### Memoization
```typescript
const PostCard = memo(({ post }) => {
  return <Card>{post.title}</Card>;
});
```

---

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests (Playwright based)
```bash
./test-integration.sh
```

### Manual Testing Checklist
- Login/logout flow works
- Protected routes require auth
- Profile editing persists
- Post creation/deletion works
- Comments nest properly
- Like/reactions update in real-time
- Responsive design on mobile/tablet
