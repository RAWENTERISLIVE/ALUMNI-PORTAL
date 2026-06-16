## 2025-01-30 - Path Traversal in File Serving
**Vulnerability:** The `serveFile` controller was directly joining the `filename` parameter from the URL with the uploads directory path, allowing for path traversal attacks (e.g., `/api/uploads/../../.env`).
**Learning:** Even with `multer` sanitizing filenames during upload, the serving logic must independently sanitize inputs if it allows arbitrary filename parameters.
**Prevention:** Always use `path.basename()` on user-provided filenames before joining them with a directory path to serve files.

## 2025-01-30 - Hardcoded Rate Limiter Bypass
**Vulnerability:** The `withEnvironmentBypass` wrapper for `express-rate-limit` was hardcoded to `skip: () => true`, disabling rate limiting across the entire application.
**Learning:** Boilerplate or "environment-aware" wrappers can accidentally disable security features if not carefully implemented.
**Prevention:** Ensure security-critical bypasses are tied to explicit environment variables and default to "secure" (no bypass).
