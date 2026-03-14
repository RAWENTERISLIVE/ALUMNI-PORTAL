# UI.md  
> **Alumni-Student-Faculty Collaboration Portal**  
> Comprehensive UI/UX & Theming Guidelines

---

## 1. Design Principles  
- **Clean & Professional**  
  - Emphasize whitespace and content hierarchy  
  - Minimal visual clutter; focus on core actions  
- **Community-Centric**  
  - Promote engagement via clear calls-to-action (CTAs)  
  - Highlight user-generated content and peer interactions  
- **Consistent & Predictable**  
  - Unified style across pages and components  
  - Standardized spacing, typography, and iconography  
- **Accessible & Inclusive**  
  - WCAG AA color contrast and focus indicators  
  - Keyboard-navigable controls and semantic HTML

---

## 2. Branding & Theme  
- **Primary Color**  
  - Orange-500 `#F97316` for primary CTAs, active states, highlights  
- **Secondary Accent**  
  - Orange-200 `#FED7AA` for hover states, light backgrounds  
- **Neutral Palette**  
  - White `#FFFFFF`, Gray-100 `#F3F4F6`, Gray-600 `#4B5563`, Gray-800 `#1F2937`  
- **Category Colors** (for Groups & Tags)  
  - Tech: Blue-500 `#3B82F6`  
  - Sustainability: Green-500 `#10B981`  
  - Mentorship: Purple-500 `#8B5CF6`  
  - Entrepreneurship: Amber-500 `#F59E0B`

---

## 3. Typography  
- **Font Stack**  
  - Primary: System UI (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)  
- **Scale & Weights**  
  - H1 (24px/700), H2 (20px/700), H3 (18px/600)  
  - Body-Large (16px/500), Body (14px/400), Caption (12px/400)  
- **Line-Height & Spacing**  
  - 1.5× line-height for body text  
  - 8–16px vertical margins between sections

---

## 4. Layout & Grid  
- **Responsive Grid**  
  - 12-column flex/grid system with 16px gutters  
  - Breakpoints: Mobile <768px, Tablet 768–1024px, Desktop >1024px  
- **Containers**  
  - Centered max-width (e.g. 960px–1,200px) on large screens  
  - Full-width on mobile, padding 16px  
- **Sections**  
  - Hero (cover photo + title)  
  - Main content (feed, profile, listings)  
  - Sidebar (supplementary info, notifications)

---

## 5. Navigation  
- **Global Header**  
  - Left: Logo (32px height) → Home link  
  - Center: Search bar (placeholder “Search alumni, groups…”)  
  - Right: Icons—Notifications, Messages, Profile Avatar → Dropdown menu  
- **Sidebar (Desktop)**  
  - Icons + labels: Home, Profile, Groups, Jobs, Mentorship, Directory, Settings  
  - Highlight active item with Orange-500 background  
- **Mobile Navigation**  
  - Bottom nav bar with 5 key icons (Home, Feed, Create Post, Notifications, Menu)  
  - Hamburger menu for secondary links

---

## 6. Key Components  
### 6.1 Buttons  
- **Primary**: `bg-orange-500 text-white rounded-lg px-4 py-2 hover:bg-orange-600`  
- **Secondary**: `bg-gray-100 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-200`  
- **Outline**: `border border-orange-500 text-orange-500 px-3 py-1.5 hover:bg-orange-50`  

### 6.2 Cards  
- **Post Card**  
  - White background, shadow-sm, rounded-lg, padding 16px  
  - Header: avatar + name + timestamp  
  - Body: text + media  
  - Footer: reaction icons + counts  
- **Group/Job Card**  
  - Category color strip on left edge  
  - Title, brief meta, CTA button  

### 6.3 Forms & Inputs  
- **Text Input**: `w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-300`  
- **Select/Dropdown**: match text inputs, with chevron icon  
- **File Upload**: drag-and-drop area with dashed border and upload icon  

---

## 7. Interaction & Feedback  
- **Hover States**  
  - Slight scale-up (1.02×) and shadow for clickable cards/buttons  
- **Focus States**  
  - 2px Orange-300 ring for keyboard users  
- **Loading Indicators**  
  - Spinner overlay on full card or button-level loader  
- **Toasts & Modals**  
  - Toast: bottom-right, auto-dismiss in 3s, success (green), error (red)  
  - Modal: centered, dark semi-opaque backdrop, close icon  

---

## 8. Imagery & Iconography  
- **Avatar**: circular, 40px default; fallback initials on colored backgrounds  
- **Cover Photos**: full-width, aspect ratio 16:6, subtle gradient overlay  
- **Icons**: Font Awesome or Heroicons, consistent 20px size  
- **Illustrations**: use minimal flat-style graphics for empty states (e.g. “No posts yet”)  

---

## 9. Accessibility  
- **Color Contrast**: minimum 4.5:1 for text on backgrounds  
- **Alt Text**: every image with descriptive `alt` attribute  
- **ARIA Labels**: for complex widgets (dropdowns, modals)  
- **Keyboard Navigation**: tab order, skip-links, focusable controls  

---

## 10. Responsive Behavior  
- **Mobile (≤768px)**  
  - Single-column layout; collapsible sidebar  
  - Bottom nav for primary actions  
- **Tablet (768–1024px)**  
  - Two-column: content + optional right sidebar  
- **Desktop (>1024px)**  
  - Three-column: sidebar + main + right sidebar  

---

## 11. Theming & Customization  
- **CSS Variables** for colors, fonts, spacing  
- **Dark Mode** (future): invert neutrals, adjust accent colors  
- **Custom Themes**: allow Super Admin to upload logo, set brand colors via Settings panel  

---

> **Next Steps:**  
> - Prototype key screens in Figma/Sketch.  
> - Perform usability testing with sample users.  
> - Iterate based on feedback and accessibility audit.  

*This UI.md serves as your single-source guide for building a cohesive, engaging, and accessible interface that aligns with your project’s vision.*
