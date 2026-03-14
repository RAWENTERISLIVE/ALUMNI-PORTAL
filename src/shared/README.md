# Shared Folder Structure

Shared folder contains all reusable code that doesn't belong to a specific feature.

## Subfolders

### `components/`
- EmptyState.tsx
- LoadingSpinner.tsx
- PageHeader.tsx
- ReportModal.tsx
- Other common UI components

### `layout/`
- MainLayout.tsx
- Sidebar.tsx
- MobileNavbar.tsx
- GlobalSearch.tsx
- Navigation and layout wrappers

### `ui/`
- shadcn/ui components (auto-generated)
- All Radix UI components
- Toast/Toaster utilities
- Form utilities

### `hooks/`
- use-mobile.tsx
- use-toast.ts
- Custom React hooks used across features

### `contexts/`
- AuthContext.tsx
- Global application contexts
- Redux store (if used)

### `services/`
- apiService.ts
- API client and request utilities
- External service integrations

## How It's Used

```
Feature Component
    ↓
Imports from src/shared/[category]/[component]
    ↓
Uses reusable component/hook/service
```

Example:
```tsx
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/shared/services/apiService';
```
