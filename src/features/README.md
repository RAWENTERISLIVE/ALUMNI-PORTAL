# Features Structure

Each feature folder contains all components, hooks, and logic related to that specific feature.

## Feature Folders

### `auth/`
- Purpose: Authentication pages and logic
- Contains: LoginPage.tsx, RegisterPage.tsx
- Related: AuthContext, authentication utilities

### `profile/`
- Purpose: User profile management
- Contains: ProfilePage.tsx, profile-related components
- Related: User profile forms, profile updates

### `posts/`
- Purpose: Social feed and posts
- Contains: PostsPage.tsx, PostCard, CommentSection, CreatePostForm
- Related: Post creation, editing, comments, reactions

### `mentorship/`
- Purpose: Mentorship program
- Contains: MentorshipPage.tsx, mentor request forms
- Related: Mentor matching, request management

### `jobs/`
- Purpose: Job board and opportunities
- Contains: JobsPage.tsx, job posting, job details
- Related: Job listings, applications

### `events/`
- Purpose: Events calendar and management
- Contains: EventsPage.tsx, event forms
- Related: Event creation, RSVPs

### `groups/`
- Purpose: Alumni groups and communities
- Contains: GroupsPage.tsx, group components
- Related: Group creation, discussions

### `directory/`
- Purpose: Alumni directory and search
- Contains: DirectoryPage.tsx, search utilities
- Related: Alumni search, filtering

### `admin/`
- Purpose: Admin dashboard and management
- Contains: AdminPage.tsx, admin components
- Related: User management, approvals, analytics

### `settings/`
- Purpose: User preferences and account settings
- Contains: SettingsPage.tsx, settings forms
- Related: Profile settings, preferences, password

### `analytics/`
- Purpose: Analytics and reporting
- Contains: AnalyticsPage.tsx, charts, metrics
- Related: Dashboard data, statistics

## Files to Move

Move these files from `src/pages/` to their feature folders:

```bash
# Auth feature
mv src/pages/AuthPages/LoginPage.tsx src/features/auth/
mv src/pages/AuthPages/RegisterPage.tsx src/features/auth/

# Profile feature
mv src/pages/ProfilePage.tsx src/features/profile/

# Posts feature
mv src/pages/PostsPage.tsx src/features/posts/

# Mentorship feature
mv src/pages/MentorshipPage.tsx src/features/mentorship/

# Jobs feature
mv src/pages/JobsPage.tsx src/features/jobs/

# Events feature
mv src/pages/EventsPage.tsx src/features/events/

# Groups feature
mv src/pages/GroupsPage.tsx src/features/groups/

# Directory feature
mv src/pages/DirectoryPage.tsx src/features/directory/

# Admin feature
mv src/pages/AdminPage.tsx src/features/admin/

# Settings feature
mv src/pages/SettingsPage.tsx src/features/settings/

# Analytics feature
mv src/pages/AnalyticsPage.tsx src/features/analytics/
```

Also move feature-specific components:

```bash
# Posts components
mv src/components/posts/* src/features/posts/

# Mentorship components
mv src/components/mentorship/* src/features/mentorship/

# Jobs components
mv src/components/jobs/* src/features/jobs/

# Events components - if any
# Groups components
mv src/components/groups/* src/features/groups/

# Profile components - if any
mv src/components/profile/* src/features/profile/

# Admin components - if any
mv src/components/admin/* src/features/admin/
```

## Shared Components

Move to `src/shared/`:

```bash
# Components
mv src/components/common/* src/shared/components/
mv src/components/layout/* src/shared/layout/
mv src/components/ui/* src/shared/ui/

# Hooks
mv src/hooks/* src/shared/hooks/

# Contexts
mv src/contexts/* src/shared/contexts/

# Services
mv src/services/* src/shared/services/
```

## Pages to Keep in Root

- `HomePage.tsx` - Landing page
- `NotFound.tsx` - 404 page
- `Index.tsx` / `DashboardPage.tsx` - Main dashboard
- `TestIntegration.tsx` - Test utilities
