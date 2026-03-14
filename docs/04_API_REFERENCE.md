# 4. Global API Reference

**Base URL**: `http://localhost:5000/api`
**Client Proxy**: Frontend dynamically routes `/api` calls directly to the Base URL bypassing CORS constraints during development.

---

## 🔐 1. Authentication
Handles JWT lifecycles, user registrations matching statuses natively.

- **`POST /auth/register`**
  - Standard Body: `{ "email", "password", "name", "admissionNumber" }`
  - Manual Review Body: `{ "email", "password", "name", "admissionYear", ...details }`
- **`POST /auth/login`**
  - Body: `{ "email", "password" }`
  - Returns: `{ "success": true, "accessToken", "refreshToken", "user" }`
- **`POST /auth/refresh`**
  - Action: Issues a new valid Access Token consuming an unexpired Refresh Token.
- **`GET /auth/me`** (Requires `Bearer`)
  - Identifies executing User object contexts. Includes dynamically computed metric `profileCompletion`.
- **`POST /auth/logout`** (Requires `Bearer`)
- **`POST /auth/forgot-password`**
- **`POST /auth/reset-password`**
- **`POST /auth/change-password`** (Requires `Bearer`)

---

## 👤 2. User & Admin Management
- **`GET /users`** (Admin restricted)
  - Fetches paginated directories supporting `page`, `limit`, `search`, and `status`.
- **`GET /users/pending`** (Admin restricted)
  - Fetches specifically `PENDING` queue items needing review.
- **`GET /users/:id`** -> Fetches specific user data.
- **`PUT /users/:id`** -> Modifies existing user datasets. Updates mentor toggles or bio details natively.

---

## 📝 3. Posts & Feeds
- **`GET /posts`**
  - Handles universal feed fetching. Uses explicit queries: `category`, `search`, `page`.
- **`POST /posts`** (Requires `Bearer`)
  - Creates nodes attaching explicitly to the calling User. Support structures like `visibility`.
- **`PUT /posts/:id`** and **`DELETE /posts/:id`**
- **`POST /posts/:id/like`**
  - Appends natively a `PostReaction` linked table entry.
- **`POST /posts/:id/comments`**
  - Nested posting capability explicitly enforcing `content` payloads.

---

## 💼 4. Jobs Board
- **`GET /jobs`**
  - Retrieves arrays dynamically allowing subsets through `type` or `location`.
- **`POST /jobs`** (Requires `Bearer`)
  - Body requires native fields like `title`, `company`, `location`, `description`.
- **`PUT /jobs/:id`** and **`DELETE /jobs/:id`**
- **`POST /jobs/:id/apply`**
  - Submits standardized forms handling routing mechanisms back to the original `postedById`.

---

## 📅 5. Events & Groups
- **`GET /events`**, **`POST /events`**
  - Event lifecycle generating specific `organizerId` tracking objects.
- **`POST /events/:id/rsvp`**
- **`GET /groups`**, **`POST /groups`**
- **`POST /groups/:id/join`**

---

## 🛡️ 6. System & Audit
- **`GET /status/health`** -> Fast 200 OK ping indicating engine activity.
- **`GET /status/phase1`** -> Fetches implementation checklists dynamically (Auth Required).
- **`GET /audit`** -> Fetches raw history trails of sensitive system permutations.

*(All endpoints requiring explicit Authentication reject strictly emitting HTTP 401 statuses handled natively by the generic Axios Response iterators)*
