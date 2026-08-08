## 2026-08-08 - Secure Error Handling in commentController
**Vulnerability:** Information Disclosure / Raw Error Message Leakage in `backend/src/controllers/commentController.ts`.
**Learning:** Returning `error.message` directly in HTTP 500 error responses can leak sensitive database names, internal fields, and stack traces to users, exposing application internals.
**Prevention:** Avoid passing raw `error.message` from `catch` blocks in HTTP JSON responses. Cast caught errors as `unknown` and return secure, generic error messages (such as `'Internal server error'`) instead.
