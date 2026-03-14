# 8. Frontend Components Documentation

## Overview
The frontend component library is built using **Radix UI primitives** wrapped by **shadcn/ui** components, combined with domain-specific feature components. All components follow React 18 functional component patterns with TypeScript strict mode.

---

## Component Architecture

### Directory Structure
```
src/components/
├── ui/                      # Shadcn/ui + Radix primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── dropdown-menu.tsx
│   └── ... (50+ UI components)
├── layout/                  # Page layout wrappers
│   ├── AuthLayout.tsx
│   ├── MainLayout.tsx
│   └── Sidebar.tsx
├── common/                  # Shared across features
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── LoadingSpinner.tsx
├── admin/                   # Admin-specific components
│   ├── UserManagementTable.tsx
│   ├── AuditLogViewer.tsx
│   └── SystemHealthCheck.tsx
├── posts/                   # Post feature components
│   ├── PostCard.tsx
│   ├── PostForm.tsx
│   ├── CommentSection.tsx
│   └── ReactionBar.tsx
├── jobs/                    # Jobs feature components
│   ├── JobCard.tsx
│   ├── JobForm.tsx
│   ├── JobFilter.tsx
│   └── ApplicationModal.tsx
├── mentorship/              # Mentorship feature components
│   ├── MentorCard.tsx
│   ├── RequestForm.tsx
│   └── MentorshipStatus.tsx
├── groups/                  # Groups feature components
│   └── GroupCard.tsx
└── profile/                 # Profile feature components
    ├── ProfileForm.tsx
    └── ProfileCompletion.tsx
```

---

## UI Component Library

### Button Component
**File**: `src/components/ui/button.tsx`

Shadcn/ui button extending Radix UI's primitive with variants:

```typescript
// Variants
- default: bg-primary text-primary-foreground
- secondary: bg-secondary text-secondary-foreground
- destructive: bg-destructive text-destructive-foreground
- outline: border border-input bg-background hover:bg-accent
- ghost: hover:bg-accent hover:text-accent-foreground
- link: underline-offset-4 hover:underline text-primary

// Sizes
- default: h-10 px-4 py-2
- sm: h-9 rounded-md px-3
- lg: h-11 rounded-md px-8
- icon: h-10 w-10

// Usage
<Button variant="default" size="lg">Click Me</Button>
<Button variant="outline">Secondary</Button>
<Button disabled>Disabled</Button>
```

### Card Component
**File**: `src/components/ui/card.tsx`

Basic container with consistent styling:

```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>Main content area</CardContent>
  <CardFooter>Footer actions</CardFooter>
</Card>
```

**Applied Utility Classes**:
- `.profile-card`: Profile display cards
- `.post-card`: Social feed posts
- `.job-card`: Job listings with accent left border
- `.group-card`: Group display cards

### Input Component
**File**: `src/components/ui/input.tsx`

Text input with focus ring and styled placeholder:

```typescript
<Input 
  type="email"
  placeholder="name@example.com"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

**Styling**: `focus:ring-2 focus:ring-primary focus:border-transparent`

### Dialog Component
**File**: `src/components/ui/dialog.tsx`

Modal overlay using Radix Dialog:

```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>Modal description</DialogDescription>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### Dropdown Menu
**File**: `src/components/ui/dropdown-menu.tsx`

Radix-based dropdown menu:

```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">⋮</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => {}}>Edit</DropdownMenuItem>
    <DropdownMenuItem>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Tabs Component
**File**: `src/components/ui/tabs.tsx`

Tab navigation using Radix:

```typescript
<Tabs defaultValue="all" className="w-full">
  <TabsList>
    <TabsTrigger value="all">All Posts</TabsTrigger>
    <TabsTrigger value="connections">From Connections</TabsTrigger>
    <TabsTrigger value="groups">From Groups</TabsTrigger>
  </TabsList>
  <TabsContent value="all">All posts content</TabsContent>
  <TabsContent value="connections">Connection posts</TabsContent>
</Tabs>
```

---

## Layout Components

### MainLayout
**File**: `src/components/layout/MainLayout.tsx`

Primary authenticated user layout with sidebar + main content:

```typescript
<MainLayout>
  <MainLayout.Sidebar>
    {/* Navigation links */}
  </MainLayout.Sidebar>
  <MainLayout.Content>
    {/* Page content */}
  </MainLayout.Content>
</MainLayout>
```

**Features**:
- Responsive sidebar (collapsible on mobile)
- Bottom navigation on mobile
- Dark/light mode toggle
- User profile dropdown
- Notifications bell

### AuthLayout
**File**: `src/components/layout/AuthLayout.tsx`

Login/Register page layout:

```typescript
<AuthLayout>
  <AuthLayout.Card>
    {/* Form content */}
  </AuthLayout.Card>
</AuthLayout>
```

**Features**:
- Centered card design
- Background gradient
- Logo/branding

### Sidebar
**File**: `src/components/layout/Sidebar.tsx`

Left navigation sidebar with dark background:

```typescript
<Sidebar>
  <SidebarHeader>Logo/User Info</SidebarHeader>
  <SidebarNav>
    <SidebarItems>
      <SidebarItem icon={Home} label="Home" />
      <SidebarItem icon={Users} label="Directory" />
      <SidebarItem icon={Briefcase} label="Jobs" />
    </SidebarItems>
  </SidebarNav>
</Sidebar>
```

**Style**: Dark background (`bg-sidebar`), gold accent on hover/active

---

## Feature Components

### PostCard Component
**File**: `src/components/posts/PostCard.tsx`

Displays individual posts with reactions and comments:

```typescript
interface PostCardProps {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
}

<PostCard 
  post={post}
  onLike={handleLike}
  onComment={handleComment}
  onShare={handleShare}
/>
```

**Features**:
- Author avatar and name
- Post content with rich text
- Attachments gallery
- Reaction counters (likes, comments)
- Action buttons (like, comment, share, bookmark)
- Hover effects with `.card-hover` utility

### CommentSection Component
**File**: `src/components/posts/CommentSection.tsx`

Nested comments display and form:

```typescript
<CommentSection 
  postId={postId}
  comments={comments}
  onAddComment={handleAddComment}
/>
```

**Features**:
- Nested/threaded comments
- Reply functionality
- Like on comments
- Edit/delete for own comments
- Avatar and author info

### JobCard Component
**File**: `src/components/jobs/JobCard.tsx`

Shows job listing with company info:

```typescript
<JobCard 
  job={job}
  onApply={() => {}}
  onSave={() => {}}
/>
```

**Features**:
- Company logo
- Job title and description
- Salary range
- Job type badge (Full-time, Part-time, etc.)
- Location
- Save button
- Apply button with modal

### MentorCard Component
**File**: `src/components/mentorship/MentorCard.tsx`

Displays mentor profile:

```typescript
<MentorCard 
  mentor={mentor}
  onRequest={() => {}}
/>
```

**Features**:
- Profile photo
- Expertise tags
- Years of experience
- Rating/reviews
- Availability status
- Request button

### ProfileForm Component
**File**: `src/components/profile/ProfileForm.tsx`

Edit user profile with validation:

```typescript
<ProfileForm 
  user={currentUser}
  onSave={handleSave}
/>
```

**Features**:
- Bio editor
- Headline input
- Company/job title
- LinkedIn URL
- Profile picture upload
- Privacy settings per section
- Form validation
- Save/cancel buttons

---

## Common Components

### Navbar Component
**File**: `src/components/common/Navbar.tsx`

Top navigation bar:

```typescript
<Navbar>
  {/* Logo */}
  {/* Search bar */}
  {/* Notifications */}
  {/* User menu */}
</Navbar>
```

**Features**:
- Logo/branding
- Search functionality
- Notification bell with badge
- User profile dropdown
- Login/Register buttons (for non-auth)

### LoadingSpinner Component
**File**: `src/components/common/LoadingSpinner.tsx`

Loading indicator used during data fetching:

```typescript
{isLoading ? <LoadingSpinner /> : <Content />}
```

**Variants**:
- Full page spinner (centered, large)
- Inline spinner (small, next to text)
- Skeleton loading (placeholder shapes)

### EmptyState Component
**File**: `src/components/common/EmptyState.tsx`

Displays when no data exists:

```typescript
<EmptyState 
  icon={DatabaseIcon}
  title="No posts yet"
  description="Be the first to share something"
  action={<Button>Create Post</Button>}
/>
```

---

## Component Best Practices

### Composition Pattern
```typescript
// Good: Composable, reusable
<Card>
  <CardHeader>
    <CardTitle>My Title</CardTitle>
  </CardHeader>
  <CardContent>
    {children}
  </CardContent>
</Card>

// Avoid: Monolithic, hard to customize
<MyCard title="My Title">{children}</MyCard>
```

### Props Interface
```typescript
interface ComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}
```

### Accessibility
- Use semantic HTML (`<button>`, `<form>`, `<nav>`)
- Add ARIA labels for dynamic content
- Keyboard navigation support
- Focus management in modals
- Color + icon for status communication

### Styling Convention
```typescript
// Use cn() utility to merge classNames
import { cn } from '@/lib/utils';

export const Button = ({ className, ...props }) => (
  <button className={cn("px-4 py-2 rounded-lg", className)} {...props} />
);
```
