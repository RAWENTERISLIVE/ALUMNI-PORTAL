# 5. UI/UX Guidelines & Design System

## Overview
Alma Connect Sphere implements a premium, sophisticated design system using a **Dark Red, Gold, and Black** color palette with custom Tailwind CSS and Radix UI primitives (via Shadcn/ui). The system supports both light and dark modes with HSL-based dynamic theming.

---

## 1. Color Palette & Branding

### Primary Colors
- **Dark Red (`#8B0000` / HSL: `0 85% 22%`)**
  - Primary brand color for CTA buttons, links, active states, and key highlights
  - Used for sidebar primary actions and ring focus states
  - Conveys prestige and institutional authority (alumni tradition)

- **Gold (`#DAA520` / HSL: `43 74% 49%`)**
  - Secondary accent for badges, highlights, achievements, and premium features
  - Creates visual hierarchy for important information
  - Symbolizes excellence and success

- **Black (`#000000` / HSL: `0 0% 0%`)**
  - Sidebar background (full black for professional appearance)
  - Secondary text color for emphasis
  - Border and divider elements

- **White (`#FFFFFF` / HSL: `0 0% 100%`)**
  - Card backgrounds (light mode)
  - Primary text color
  - Foreground elements

### Dynamic HSL Variables
All colors defined as CSS variables allowing seamless theme switching:
```css
--primary: 0 85% 22%;           /* Dark Red */
--primary-foreground: 0 0% 100%; /* White */
--accent: 43 74% 49%;           /* Gold */
--accent-foreground: 0 0% 0%;   /* Black */
--sidebar-background: 0 0% 0%;  /* Pure Black */
--sidebar-foreground: 0 0% 100%; /* White */
```

### Dark Mode Overrides
In dark mode, backgrounds adapt intelligently:
- Background: `0 0% 7%` (very dark gray)
- Cards: `0 0% 10%` (slightly lighter for contrast)
- Text: `0 0% 100%` (white for readability)
- Borders: `0 0% 20%` (dark but visible)

---

## 2. Typography System

### Font Stack
```css
font-family: 'Inter', sans-serif;      /* Body & UI */
font-family: 'Playfair Display', serif; /* Headlines (imported) */
```

### Type Scale (Tailwind-based)
- **H1**: `text-4xl md:text-6xl` (Bold 700) - Page titles
- **H2**: `text-3xl md:text-4xl` (Bold 700) - Section headers
- **H3**: `text-xl md:text-2xl` (Semibold 600) - Subsections
- **Body**: `text-base` (Regular 400) - Main content, `0.5rem` border radius
- **Small**: `text-sm` (Regular 400) - Captions, metadata
- **Muted**: `text-muted-foreground` (Gray 600) - Secondary text

### Letter Spacing
- Headings: `tracking-tight`
- Body: `tracking-normal` (default Inter spacing)

---

## 3. Layout & Spacing System

### Container & Grid
- **Max-width**: `1400px` (2xl breakpoint)
- **Padding**: `2rem` on container sides
- **Gutter**: 8px - 32px gap scales responsive behavior
- **Grid**: 12-column flex/grid system with responsive collapsing

### Responsive Breakpoints
- **Mobile** (`<768px`): Single column, full-width, bottom navigation
- **Tablet** (`768px - 1024px`): Two column (main + sidebar)
- **Desktop** (`>1024px`): Three column (sidebar + main + right panel)
- **2XL** (`>1400px`): Full container constraint at 1400px max

### Spacing Scale
- `xs`: `0.25rem` (4px)
- `sm`: `0.5rem` (8px)
- `md`: `1rem` (16px)
- `lg`: `1.5rem` (24px)
- `xl`: `2rem` (32px)

---

## 4. Component Patterns

### Buttons
**Primary (Dark Red backgrounds)**
```css
.btn-primary {
  @apply bg-primary text-primary-foreground px-4 py-2 rounded-lg 
    font-semibold hover:opacity-90 active:scale-95 transition-all 
    duration-200 shadow-md hover:shadow-lg;
}
```

**Secondary (Muted backgrounds)**
```css
.btn-secondary {
  @apply bg-muted text-foreground px-4 py-2 rounded-lg 
    hover:bg-muted/80 transition-colors;
}
```

**Outline (Bordered)**
```css
.btn-outline {
  @apply border-2 border-primary text-primary px-4 py-2 rounded-lg 
    hover:bg-primary/10 transition-all;
}
```

### Cards
All cards follow consistent styling with custom utility classes:

**Profile Card**
```css
.profile-card {
  @apply p-6 rounded-lg border bg-card text-card-foreground 
    shadow-sm hover:shadow-md transition-shadow;
}
```

**Post Card**
```css
.post-card {
  @apply p-5 rounded-lg border bg-card text-card-foreground 
    shadow-sm mb-4 hover:shadow-md transition-all duration-300;
}
```

**Job Card**
```css
.job-card {
  @apply p-5 rounded-lg border bg-card text-card-foreground 
    shadow-sm mb-4 border-l-4 border-l-accent;
}
```

### Navigation Links
```css
.nav-link {
  @apply flex items-center gap-2 px-4 py-3 rounded-md 
    transition-colors hover:bg-muted;
}

.nav-link.active {
  @apply bg-primary/10 text-primary font-medium border-l-4 border-primary;
}
```

### Forms & Inputs
```css
input, select, textarea {
  @apply w-full px-3 py-2 rounded-lg border border-input 
    bg-card text-foreground placeholder:text-muted-foreground
    focus:ring-2 focus:ring-primary focus:border-transparent;
}
```

---

## 5. Animation & Interactions

### Hover States
- Cards: `hover:shadow-md hover:-translate-y-1 transition-all duration-300`
- Links: `hover:text-primary transition-colors`
- Buttons: `hover:opacity-90 active:scale-95`

### Loading & Transitions
```css
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

.slide-in {
  animation: slideIn 0.4s ease-out;
}
```

### Skeleton Loading
Use Shadcn/ui Skeleton component for content placeholders with animated gradient.

---

## 6. Accessibility Standards (WCAG AA)

### Color Contrast
- Primary text on white: **#000000 on #FFFFFF** = `21:1` ✅
- Primary text on card: **#1F2937 on #F3F4F6** = `16:1` ✅
- Button text: **White on Dark Red (#8B0000)** = `6.5:1` ✅

### Focus States
All interactive elements show a `2px` dark red ring:
```css
focus:ring-2 focus:ring-primary focus:ring-offset-2
```

### Semantic HTML
- Proper heading hierarchy (h1 → h6)
- Button vs Link distinction
- Form labels with `<label htmlFor>`
- Alt text on all images
- ARIA labels for complex widgets

### Keyboard Navigation
- Tab order follows visual flow
- Skip links for main content
- All buttons/links keyboard accessible
- Modal focus trapping

---

## 7. Dark Mode Implementation

The application automatically supports dark mode via Tailwind's `dark:` prefix:

```tsx
{/* Light mode */}
<div className="bg-white dark:bg-slate-900">
  <p className="text-black dark:text-white">Content</p>
</div>
```

Dark mode is enabled by the `dark` class on the root `<html>` element managed by the theme context.

---

## 8. Image & Media Guidelines

### Avatar Images
- Size: 40px (default), 64px (profile)
- Shape: Circular (`rounded-full`)
- Fallback: Colored initials background with user's first letter

### Cover Photos
- Aspect Ratio: `16:6`
- Min-height: 300px
- Overlays: Subtle gradient (`bg-gradient-to-t from-black/40 to-transparent`)

### Icons
- Library: `lucide-react` (24px default)
- Sizing: `20px` (in buttons), `24px` (in headers), `32px` (large CTAs)
- Consistency: All icons maintain same stroke-width (2px)

---

## 9. Design Tokens Reference

| Token | Value | Usage |
|-------|-------|-------|
| `radius` | `0.5rem` (8px) | All border-radius |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle cards |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Card hover |
| `transition` | `300ms ease-in-out` | Standard animations |
| `gap-4` | `1rem` (16px) | Component spacing |

---

## 10. Real Component Examples

### Hero Section
```tsx
<header className="bg-gradient-to-r from-primary to-primary/80 text-white py-20">
  <div className="container mx-auto px-4">
    <h1 className="text-6xl font-bold">Your Legacy Continues Here</h1>
    <p className="text-xl opacity-90 mt-4">Join our alumni network</p>
  </div>
</header>
```

### Feature Card
```tsx
<div className="card-hover profile-card">
  <h3 className="text-lg font-semibold text-primary">Networking</h3>
  <p className="text-muted-foreground mt-2">Connect with alumni</p>
  <Button className="mt-4 bg-primary text-primary-foreground">Learn More</Button>
</div>
```
