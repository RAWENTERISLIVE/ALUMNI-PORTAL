# 2. System & Application Architecture

## Tech Stack Overview

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Routing**: React Router DOM v6
- **State Management**:
  - *Server State*: TanStack React Query (`react-query`)
  - *Auth/Global State*: React Context API
- **Styling**: Tailwind CSS + Shadcn UI (Radix Primitives)
- **HTTP Client**: Axios (configured with intercepts for token refresh)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16 (Successfully migrated from MongoDB)
- **ORM**: Prisma (Prisma Client JS)

---

## High-Level System Architecture

```text
[ Client / Browser ]
        │
    (REST API & WebSockets potential)
        │
[ Express.js Backend Server ]
        │
   [ API Controllers & Middlewares ] (Auth, Users, Posts, Jobs, Mentorship)
        │
   [ Prisma Client ]
        │
[ PostgreSQL Database ]
```

## Frontend Architecture Details

The frontend follows a highly modular, feature-focused architecture:

- `src/pages/`: Contains functional views mapped to router paths (e.g., `HomePage`, `AdminPage`, `ProfilePage`, `JobsPage`, `MentorshipPage`).
- `src/components/`: Reusable, atomic UI elements.
  - `ui/`: Generic styling wrapper over Radix primitives (Shadcn methodology like Buttons, Inputs, Cards).
  - `shared/`: High-level abstract components that persist across views (e.g., sidebars, navigation layouts).
- `src/contexts/`: Centralized context definitions (`AuthContext` to manage local session tokens).
- `src/hooks/`: Custom encapsulated behaviors, often bundling `React Query` hooks.
- `src/services/` & `src/lib/`: Setup layers. `api.ts` houses specialized Axios interceptor logic automatically handling JWT injections and `401 Unauthorized` token refreshing algorithms via Refresh Tokens.

## Backend Architecture Details

The backend adheres strictly to REST principles alongside a unified middleware pipeline:

- `src/controllers/`: Separated domain logic files handling routing resolutions (`authController`, `userController`, `postController`, etc.)
- `src/middleware/`: Security and validation pipelines such as `verifyToken`, `isAdmin`, schema validations.
- `prisma/`: Houses `schema.prisma` describing exact Postgres SQL tables and unified cross-table relations using Prisma formats.
- `src/lib/prisma.ts`: A centralized instantiated Prisma Client to prevent connection pooling limits.

## Authentication Architecture

- **Token Lifecycle**: Short-lived Access Tokens (JWT) + Long-lived Refresh Tokens (JWT) stored safely on the client.
- **Refresh Flow**: Axos handles the automatic transparent retry by sending the `refreshToken` to the `/auth/refresh` endpoint and securing new sessions if an access token expires.
- **RBAC**: Handled by role enums in DB: `USER`, `ADMIN`, `SUPER_ADMIN`. Certain endpoints deny execution unless middleware approves the required privilege subset.
