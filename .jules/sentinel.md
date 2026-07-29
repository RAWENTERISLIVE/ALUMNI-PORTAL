## Sentinel Security Journal

## 2026-03-31 - Secure Error Handling in Comments Controller
**Vulnerability:** The comment controller (`commentController.ts`) previously leaked raw error messages (via `error.message`) in multiple 500 API responses. This could expose internal database schema details, raw queries, or stack traces if Prisma or third-party components failed.
**Learning:** Returning un-sanitized catch block messages back to client-facing HTTP responses is an informative data exposure risk.
**Prevention:** Catch blocks must log raw errors internally to the server console or log management systems, and return clean, generic responses (such as "Failed to create comment") back to the client.
